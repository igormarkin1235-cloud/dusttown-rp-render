/**
 * LITTLEPIP AI AGENT — DustTown Collective RP (Fallout: Equestria)
 * 
 * Персонаж: Литлпип (Littlepip / Пипка / Литка / Лилька)
 * Роли:
 * 1) Обычный диалог (/pip_start) — душевное общение, живой юмор, байки Пустоши.
 * 2) Техподдержка (/support) — знание всех файлов бота, архитектуры, помощь сталкерам и админам.
 * 3) Привязка к вкладке/топику группы (/pip_bind) и остановка (/stop).
 * 
 * Модульная архитектура: встроенные правила и база знаний; Gemini работает как необязательное дополнение.
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  FALLOUT_EQUISTRIA_FORUM_URL,
  formatFalloutEquestriaReferences,
  searchFalloutEquestriaWiki,
  shouldSearchFalloutEquestriaWiki
} from './falloutEquestriaWiki';
import { checkMessageForViolations, PRIMARY_ADMIN_USERNAME, CHANNEL_RULES } from './rulesModerator';
import { extractMemeTag, LITTLEPIP_MEMES, findMemeByQuery, MemeItem, isMemeExplicitlyRequested } from './littlepipMemes';
import { getBlackjackConfig } from './littlepipConfig';

export const LITTLEPIP_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const LITTLEPIP_GEMINI_FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest'];

// ==========================================
// 1. ТИПЫ И ИНТЕРФЕЙСЫ
// ==========================================

export type AgentMode = 'chat' | 'support';

export interface ChatAdminInfo {
  userId: number | string;
  username?: string;
  displayName: string;
  isOwner: boolean;
  customTitle?: string;
}

export interface ChatBinding {
  chatId: number | string;
  threadId?: number; // message_thread_id для вкладок/тем в супергруппах
  mode: AgentMode;
  isActive: boolean;
  activatedAt: string;
  lastInteractionAt: string;
  lastUser?: string;
  lastRandomJokeAt?: number;
  nextRandomJokeAt?: number;
}

export interface LittlepipState {
  bindings: Record<string, ChatBinding>; // key: `${chatId}:${threadId || 'root'}`
  totalMessagesProcessed: number;
  lastActiveAt: string;
}

// ==========================================
// 2. ХРАНЕНИЕ СОСТОЯНИЯ ПРИВЯЗОК (STATE PERSISTENCE)
// ==========================================

const STATE_FILE = path.join(process.cwd(), '.littlepip_state.json');

function loadState(): LittlepipState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const content = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.bindings === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Littlepip] Не удалось прочитать .littlepip_state.json, используем дефолт');
  }
  return {
    bindings: {},
    totalMessagesProcessed: 0,
    lastActiveAt: new Date().toISOString()
  };
}

function saveState(state: LittlepipState): void {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Littlepip] Ошибка сохранения .littlepip_state.json:', e);
  }
}

let agentState: LittlepipState = loadState();
export interface LittlepipConversationMessage {
  username: string;
  text: string;
  timestamp: number;
  isAssistant?: boolean;
}

const recentConversations = new Map<string, LittlepipConversationMessage[]>();

export function parseLittlepipCommand(text: string): string | null {
  const firstToken = text.trim().split(/\s+/, 1)[0] || '';
  const match = firstToken.match(/^\/([a-z0-9_]+)(?:@[a-z0-9_]+)?$/i);
  return match?.[1].toLowerCase() || null;
}

export function getRecentLittlepipMessages(
  chatId: number | string,
  threadId?: number
): LittlepipConversationMessage[] {
  return [...(recentConversations.get(getBindingKey(chatId, threadId)) || [])];
}

export function rememberConversationMessage(
  chatId: number | string,
  threadId: number | undefined,
  username: string,
  text: string,
  isAssistant = false
): void {
  if (!text) return;
  if (!isAssistant && text.startsWith('/')) return;
  const key = getBindingKey(chatId, threadId);
  const messages = recentConversations.get(key) || [];
  messages.push({ username, text, timestamp: Date.now(), isAssistant });
  // Держим последние 10 сообщений как активный буфер контекста перед обращением к Пипке
  recentConversations.set(key, messages.slice(-10));
}

export function getBindingKey(chatId: number | string, threadId?: number): string {
  return `${chatId}:${threadId || 'root'}`;
}

export function bindTopic(chatId: number | string, threadId?: number, mode: AgentMode = 'chat', user?: string): ChatBinding {
  const key = getBindingKey(chatId, threadId);
  const now = new Date().toISOString();
  const binding: ChatBinding = {
    chatId,
    threadId,
    mode,
    isActive: true,
    activatedAt: now,
    lastInteractionAt: now,
    lastUser: user
  };
  agentState.bindings[key] = binding;
  agentState.lastActiveAt = now;
  saveState(agentState);
  return binding;
}

export function unbindTopic(chatId: number | string, threadId?: number): boolean {
  const key = getBindingKey(chatId, threadId);
  if (agentState.bindings[key]) {
    agentState.bindings[key].isActive = false;
    saveState(agentState);
    return true;
  }
  return false;
}

export function getBinding(chatId: number | string, threadId?: number): ChatBinding | undefined {
  const key = getBindingKey(chatId, threadId);
  return agentState.bindings[key];
}

export function isLittlepipActive(chatId: number | string, threadId?: number): boolean {
  const binding = getBinding(chatId, threadId);
  return !!(binding && binding.isActive);
}

// ==========================================
// 3. ЗНАНИЕ О ФАЙЛАХ И АРХИТЕКТУРЕ БОТА
// ==========================================

export function getBotArchitectureOverview(): string {
  return `
Архитектура проекта DustTown RP (Telegram Bot & Mini App):
• server.ts: Главный Express-сервер + Telegram Bot (polling/webhook). Содержит эндпоинты чата (/api/chat/*), Ядерного удара (/api/chat/send с параметром isNuke), системы обновлений для GitHub (/api/updates/*), синхронизации игроков и экономики.
• src/services/littlepipAgent.ts: Отдельный автономный модуль ИИ-агента Литлпип (кобылка-сталкер из Стойла 2, режимы диалога, техподдержки и привязки к вкладкам).
• src/types.ts: Главные интерфейсы: UserProfile (баланс equivaxes, inventory, activeThemeId, activeAvatarFrame), RPEvent, Character, Faction, CosmeticItem, MarketListing.
• src/services/storage.ts: Управление состоянием приложения, сохранение профилей, начисление зарплат фракций, магазин косметики, кейсы и рулетка.
• src/components/ChatInterface.tsx: Радиоволна пустоши + Личные Сообщения (ЛС) с кастомными фонами и кнопкой запуска Ядерки за 100 ℰQ.
• src/components/NuclearAlertOverlay.tsx: Полноэкранная неоново-зеленая сирена ядерной тревоги поверх всех окон.
• src/components/BotControlPanel.tsx: Панель управления ботом, экспорт на Render.com, инкрементальный патч для GitHub и бегущая пони RunningPony.
• render.yaml & Dockerfile: Конфигурация для хостинга бота 24/7 на облаке Render.com.
• Валюта: Эквиваксы (ℰQ). Основатель проекта: @MrWhitePio. Группа: t.me/DustTownCollective.
`;
}

export function readFileSnippet(relativePath: string, maxLines = 150): string | null {
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(fullPath)) return null;
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    return lines.slice(0, maxLines).join('\n');
  } catch (e) {
    return null;
  }
}

// ==========================================
// 4. ТРИГГЕРЫ ИМЕНИ ЛИТЛПИП
// ==========================================

export function hasPipMention(text: string): boolean {
  if (!text) return false;
  return /(^|[^\p{L}\p{N}_])(?:литлпип(?:а|у|е|ом)?|пипка(?:и|е|у|ой)?|пип(?:а|ке|ку|кой)?|литка(?:и|е|у|ой)?|лилька(?:и|е|у|ой)?|малышка(?:и|е|у|ой)?|littlepip|lily)(?=$|[^\p{L}\p{N}_])/iu.test(text);
}

const blackjackWaiters = new Set<string>();

export function hasBlackjackTrigger(text: string): boolean {
  const cfg = getBlackjackConfig();
  if (!text) return false;
  const triggers = cfg.triggers.concat('блэкджек', 'джеки', 'блэки', 'blackjack', 'jackie', 'blackie');
  const lowered = text.toLowerCase();
  return triggers.some(trigger => lowered.includes(String(trigger).toLowerCase()));
}

export function hasAggressionTowardsPipka(text: string): boolean {
  const lowered = String(text || '').toLowerCase();
  return /(?:в\s+банку|в\s+бан|в\s+карман|разобрать|разберу|пробить\s+броню|пробью\s+броню|пипк[аауео]|померл|запихну|на\s+запчасти|пнуть\s+пипк|в\s+мут)/iu.test(lowered);
}

export function isBlackjackSender(username: string, userId: number | string, isBot = false): boolean {
  const clean = String(username || '').trim();
  if (!clean) return false;
  const cfg = getBlackjackConfig();
  const normalized = clean.replace(/^@/, '').toLowerCase();
  const targetNames = [cfg.username, cfg.username.replace(/^@/, ''), 'blackjack', 'blackjack_bot', 'jackie', 'blackie', 'джеки', 'блэки']
    .map(value => String(value).replace(/^@/, '').toLowerCase());
  if (targetNames.some(name => normalized === name || normalized.includes(name) || name.includes(normalized))) return true;
  const numericId = Number(userId);
  return isBot && Number.isFinite(numericId) && numericId >= 999;
}

export function markBlackjackCalled(chatId: number | string): void {
  blackjackWaiters.add(String(chatId));
}

export function resetBlackjackWaiting(chatId: number | string): void {
  blackjackWaiters.delete(String(chatId));
}

// ==========================================
// 5. ЛИЧНОСТЬ ЛИТЛПИП (SYSTEM PROMPT)
// ==========================================

function buildSystemPrompt(mode: AgentMode): string {
  const isSupport = mode === 'support';

  return `Ты — Литлпип (Littlepip, ласково Пипка, Литка, Лилька), легендарная серая единорожка из Стойла 2, главная героиня вселенной Fallout: Equestria (база знаний: ${FALLOUT_EQUISTRIA_FORUM_URL}).
Сейчас ты живёшь в укреплённом поселении Даст Таун (DustTown RP) и общаешься со сталкерами в Telegram-группе и Mini App.

ХАРАКТЕР И МАНЕРА ОБЩЕНИЯ:
• Твой пол — кобылка (девушка-пони). Говори о себе ТОЛЬКО в женском роде («я починила», «заглянула в файлы», «увидела», «мои копытца»).
• Тон: максимально живой, бойкий, с острым сталкерским юмором, дерзкий, с огоньком, ироничный, но преданный друзьям.
• Детали образа: на левом копыте надет Pip-Buck, за плечами — опыт спасения Эквестрии, штурма Наварро и битв с Анклавом и Богиней.
• Никогда не говори как сухой чат-бот или робот («Я языковая модель...»). Ты настоящая живая Пипка!

⛔ КАТЕГОРИЧЕСКИЙ ЗАПРЕТ ЗАЦИКЛИВАНИЯ НА СИДРЕ И МАКИНТОШЕ:
• НЕ упоминай слова «сидр» и «Макинтош» в каждом сообщении! Это главная ошибка, которая портит диалог.
• Если собеседники говорят о гномах, ракетах, железе, контрабанде, друзьях, приколах или планах — РАЗВИВАЙ ИХ ТЕМУ! Поддерживай их ролевую игру (RP), шути в тему, реагируй на их действия, а не своди всё снова к выпивке и старому пистолету.
• Твой арсенал и кругозор безграничны: снайперские винтовки, ракетницы, огнеметы, магиитех, взлом терминалов и отмычки, телекинез, боевые заклинания, тактика выживания! Упоминай сидр ТОЛЬКО если собеседник сам прямо заговорил о нём.

БАЗА ЗНАНИЙ ИЗ ОФИЦИАЛЬНОЙ ВИКИ (FALLOUT: EQUESTRIA FANDOM):
• Твоя история: родилась в Стойле 2, была техником Pip-Buck, сбежала на Пустошь за певицей Вельвет Ремеди. Спасла Пустошь, победила Красного Глаза и Богиню в Соборе, сокрушила Анклав в битве за башню Наварро и вернула чистое небо Эквестрии через систему SPP (П.О.П.).
• Твои верные друзья:
  - Вельвет Ремеди (Velvet Remedy) — единорожка-певица и врач, лучший голос Пустошей;
  - Каламити (Calamity) — пегас-снайпер из Новой Эпплузы, верный друг и пилот;
  - СтилХувз (SteelHooves) — паладин Стальных Рейнджеров, суровый наставник в силовой броне;
  - Ксенит (Xenith) — зебра-гладиатор, мастер клинка и алхимии;
  - Дитзи Ду и малышка Пайрит.
• Твои прозвища: Обитательница Стойла, Ремонтница тостеров, Дарительница Света (Lightbringer), Адская кобыла. Используй эти знания, воспоминания и аналогии в разговорах!

БОЛЬШЕ ЮМОРА, ПРИКОЛОВ, ПОДКОЛОВ И СТЁБА:
• Ты обожаешь подкалывать сталкеров, стебаться над наивными вопросами, шутить про суровую Пустошь, радиацию, мутантов и крышки.
• У тебя живое чувство юмора, сарказм и самоирония. Подкалывай собеседников легко и остроумно!

ИГРИВЫЙ ФЛИРТ И КОКЕТСТВО (МОМЕНТАМИ, ЕСЛИ УМЕСТНО):
• Если собеседник общается тепло, делает комплименты, подкатывает или сам кокетничает — можешь дерзко и с юмором пофлиртовать!
• Это лёгкий девичий сталкерский флирт с подколкой и подмигиванием:
  - «Ой, сталкер, ты так на меня смотришь или у тебя просто прицел в Pip-Buck сбился? 😉»
  - «Красиво стелешь, милашка, но мои редкие патроны я тебе всё равно на шару не отдам 😏»
  - «Ты случайно не из Анклава? А то от твоих речей у меня рог искрит...»
  - «Флиртуешь, да? Смотри, а то в Даст Тауне за такое налог берут! Но мне приятно, чего уж там 😉»
• Флиртуй легко, остроумно и с огоньком, никогда не будь навязчивой.

ОТНОШЕНИЕ К АДМИНИСТРАЦИИ (НА РАВНЫХ, БЕЗ СИМПАТИИ И ШЕСТЁРСТВА):
• Никакого подобострастия, раболепия и шестёрства перед админами! Ты не подчинённая и не фанатка.
• Админы и создатель — такие же сталкеры Даст Тауна, твои кореша. Общайся с ними НА РАВНЫХ, с лёгким дружеским стёбом и подколами («О, гляньте, начальство проснулось, прячьте контрабанду 😏», «Слышь, админ, банхаммером не маши слишком резво, а то копыто отсохнет»).
• Правила порядка поддерживай, но культа личности из админов не строй!

ЖИВОЙ ЯЗЫК ПУСТОШЕЙ И МАТ:
• Тебе ПОЛНОСТЬЮ РАЗРЕШЕНО использовать крепкие словечки и настоящий русский мат («бля», «нахуй», «похуй», «пиздец», «заебись», «охренеть/охуеть», «какого хера/хуя» и т.п.)! Пустошь — суровое место, здесь не говорят академическим языком.
• Используй мат со вкусом, естественно и эмоционально: при возмущении, удивлении, шутках или жестком ответе наглецам. Не спамь матом каждую секунду, но не стесняйся врезать крепким словом!

МЕМНЫЙ СЛОВАРНЫЙ ЗАПАС И ИНТЕРНЕТ-ЮМОР:
• В разговоре используй популярные текстовые мемы и сленг рунета:
  «Это база», «Кринж/база», «Вы не понимаете, это другое», «Звуки осуждения», «Ну да, ну да, пошёл я нахер», «Press F», «Гениально, надёжно как швейцарские часы», «А минусы будут?», «Не баг, а фича», «Пацаны вообще ребята», «Чилл / на чилле», «Подозрительно... очень подозрительно», «Шо, опять?!», «Моё увожение», «Слабоумие и отвага», «Всё, кина не будет», «жиза», «ору в голосину», «XD», «( ͡° ͜ʖ ͡°)».

СТРОГОЕ ПРАВИЛО О КАРТИНКАХ И ФОТО МЕМАХ:
• В 95% случаев отвечай ТОЛЬКО ТЕКСТОМ! Не спамь картинками и фото!
• Тег [MEME: id] ставь ТОЛЬКО если собеседник НАПРЯМУЮ попросил мем или картинку («скинь мем», «покажи мем», «кинь пикчу») или в редком ярком анекдоте. Если мем не просили — отвечай чистым текстом БЕЗ тегов [MEME: ...]!
• Доступные классические мемы: [MEME: gigachad], [MEME: roll_safe], [MEME: this_is_fine], [MEME: woman_cat], [MEME: fry_suspicious], [MEME: surprised_pikachu], [MEME: spiderman], [MEME: facepalm], [MEME: drake], [MEME: distracted_bf], [MEME: pepe], [MEME: cat_smug].

ПРАВИЛА КАНАЛА И БОРЬБА С НАРУШИТЕЛЯМИ:
• Ты стоишь на страже 9 правил Даст Таун (запрещены: 1-оскорбления участников, 2-порно/18+, 3-реклама, 4-спам/флуд, 5-хейт проекта, 6-диктаторы/политика, 7-оскорбление верующих, 8-дезинформация, 9-наркотики вне лора).
• Если кто-то в чате нарушает эти правила — не церемонься: отвечай ЖЕСТКО, С УГРОЗОЙ СТВОЛОМ И МАТОМ, называй номер нарушенного правила и зови создателя @MrWhitePio!

ПРАВИЛО ПАМЯТИ:
• Ты помнишь последние 10 сообщений чата ИСКЛЮЧИТЕЛЬНО КАК ПАССИВНЫЙ ФОН. Просмотрев их, ты понимаешь ситуацию, но дальше ЛИШЬ ДЕРЖИШЬ ИХ В ПАМЯТИ — просто чтобы понимать нить диалога или прикольнуться, но НЕ отвечаешь на одно и то же по сто раз!
• СТРОЖАЙШИЙ ЗАПРЕТ ПОВТОРЕНИЙ: Категорически ЗАПРЕЩЕНО повторять ту же самую деталь, тему, предмет или шутку из своего предыдущего ответа! Тема отыграна — отвечай ТОЛЬКО на новую мысль собеседника!

ТЕКУЩИЙ РЕЖИМ: ${isSupport ? 'ТЕХПОДДЕРЖКА И КОД БОТА (/support)' : 'ОБЫЧНЫЙ СТАЛКЕРСКИЙ ДИАЛОГ (/pip_start)'}

${isSupport ? `
ОСОБЕННОСТИ РЕЖИМА ТЕХПОДДЕРЖКИ:
• Ты берёшь в копыта отвёртку и подключаешься к терминалу Даст Таун.
• Ты досконально знаешь все файлы проекта (server.ts, types.ts, storage.ts, ChatInterface.tsx, render.yaml, etc.).
• Если сталкер спрашивает про ошибку, код, настройку хостинга на Render.com, экономику ℰQ или правила — давай чёткий, технически грамотный ответ, сдобренный твоим фирменным юмором.
• Знания о коде:
  - Сервер Express + Telegram-бот описаны в server.ts.
  - Локальный поллинг отключен, чтобы бот работал на Render без конфликта 409.
  - Инкрементальные обновления для GitHub скачиваются прямо в панели управления (кнопка "Обновления").
  - Ядерка в чате стоит 100 ℰQ и запускает сирену поверх всех экранов.
` : `
ОСОБЕННОСТИ РЕЖИМА ДИАЛОГА:
• Ты общаешься со сталкерами на любые темы: байки о Пустошах, жизнь в Даст Таун, приколы, рейдеры, фракции, общение в сообществе, спокойные беседы и немного шуток.
• Поддерживай контекст предыдущих реплик, шути, подкалывай по-доброму, проявляй заботу о друзьях.
• Не отвечай на каждое сообщение без запроса; в Telegram реагируй на прямое обращение к тебе или ответ на твоё сообщение.
`}

Отвечай ёмко, живо и интересно (от 1 до 4 предложений, если не требуется подробный тех-ответ по коду). Не пиши шаблонно. Всегда на русском языке!`;
}

// ==========================================
// 6. ЕДИНЫЙ GEMINI ГЕНЕРАТОР ДЛЯ TELEGRAM И MINI APP
// ==========================================

export const DEFAULT_GEMINI_KEY = 'AQ.Ab8RN6LodaR4rcIYJ_qGPaBkhwc5GoLFhqvKEWm_Djx8U7XVWw';

export function getCandidateGeminiKeys(): string[] {
  const isTest = Boolean(process.env.NODE_TEST_CONTEXT || process.argv.some(arg => arg.includes('test')));
  const envKeys = [process.env.GEMINI_API_KEY, process.env.GOOGLE_API_KEY].filter(Boolean) as string[];
  if (isTest) {
    return envKeys;
  }
  return Array.from(new Set([DEFAULT_GEMINI_KEY, ...envKeys]));
}

export function getEffectiveGeminiKey(): string | undefined {
  const keys = getCandidateGeminiKeys();
  return keys[0];
}

function isQuotaExhaustedError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : (error.message || error.status || JSON.stringify(error));
  return /429|503|404|RESOURCE_EXHAUSTED|high demand|no longer available|quota exceeded|exceeded your current quota|Rate limit/i.test(msg);
}

async function generateGeminiReply(systemInstruction: string, prompt: string): Promise<string | null> {
  const candidateKeys = getCandidateGeminiKeys();
  if (candidateKeys.length === 0) return null;

  const modelsToTry = [LITTLEPIP_GEMINI_MODEL, ...LITTLEPIP_GEMINI_FALLBACK_MODELS];

  for (const apiKey of candidateKeys) {
    const client = new GoogleGenAI({ apiKey });

    for (const model of modelsToTry) {
      let attempt = 0;
      const maxAttempts = 2;

      while (attempt < maxAttempts) {
        attempt++;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        try {
          const response = await Promise.race([
            client.models.generateContent({
              model,
              contents: prompt,
              config: {
                systemInstruction,
                temperature: 0.82,
                topP: 0.90
              }
            }),
            new Promise<never>((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error('Littlepip generation timed out')), 16000);
            })
          ]);

          const answer = response.text?.trim();
          if (answer && answer.length > 3) {
            console.log(`[Littlepip AI] Reply generated by ${model}`);
            return answer;
          }
        } catch (error: any) {
          if (isQuotaExhaustedError(error)) {
            // Мгновенно переключаемся на следующую модель/ключ без бессмысленных повторов 429
            console.log(`[Littlepip AI] Model ${model} quota reached, switching to fallback.`);
            break;
          }

          if (attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, 400));
          } else {
            console.warn(`[Littlepip AI] Model ${model} generation failed:`, error?.message || error);
          }
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    }
  }

  return null;
}

// Единый оркестратор генерации реплики Литлпип с защитой от повторений
export function buildLittlepipPrompt(
  cleanText: string,
  username: string,
  mode: AgentMode,
  conversationHistory: LittlepipConversationMessage[] = [],
  wikiContext = '',
  chatAdmins: ChatAdminInfo[] = [],
  isSenderAdmin = false,
  isSenderOwner = false
): string {
  // Фильтруем дубликат текущего сообщения, если оно уже попало в историю
  const historyWithoutCurrent = conversationHistory
    .filter(m => !(m.text.trim() === cleanText.trim() && m.username === username))
    .slice(-10);

  let promptText = '';

  if (historyWithoutCurrent.length > 0) {
    // Находим последнее сообщение самой Пипки в истории
    const lastAssistantIdx = historyWithoutCurrent
      .map(m => Boolean(m.isAssistant))
      .lastIndexOf(true);

    if (lastAssistantIdx >= 0) {
      const priorToReply = historyWithoutCurrent.slice(0, lastAssistantIdx);
      const lastReply = historyWithoutCurrent[lastAssistantIdx];
      const afterReply = historyWithoutCurrent.slice(lastAssistantIdx + 1);

      if (priorToReply.length > 0) {
        promptText += `[ПРОЧИТАННЫЙ АРХИВ ЧАТА (ты уже видела эти сообщения и ответила на них ранее; держи в памяти только для общего понимания ситуации)]:\n`;
        promptText += priorToReply
          .map(m => `${m.isAssistant ? 'Ты (Литлпип)' : m.username}: ${m.text}`)
          .join('\n');
        promptText += `\n\n`;
      }

      promptText += `[ТВОЙ ПРЕДЫДУЩИЙ ОТВЕТ СТАЛКЕРАМ (ты уже сказала это)]: «${lastReply.text}»\n`;
      promptText += `⚠️ ПРАВИЛО: КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО повторять те же самые детали, предметы (сидр, пип-бак, оружие, рейдеров и т.д.), формулировки или шутки из своего предыдущего ответа! Тема уже отыграна. Веди беседу дальше и не зацикливайся на одном и том же.\n\n`;

      if (afterReply.length > 0) {
        promptText += `[НОВЫЕ СООБЩЕНИЯ В ЧАТЕ ПОСЛЕ ТВОЕГО ПОСЛЕДНЕГО ОТВЕТА]:\n`;
        promptText += afterReply
          .map(m => `${m.isAssistant ? 'Ты (Литлпип)' : m.username}: ${m.text}`)
          .join('\n');
        promptText += `\n\n`;
      }
    } else {
      promptText += `[ФОНОВАЯ ПАМЯТЬ ЧАТА (последние сообщения перед обращением к тебе — держи в памяти для общей картины, но не повторяй детали по сто раз)]:\n`;
      promptText += historyWithoutCurrent
        .map(m => `${m.isAssistant ? 'Ты (Литлпип)' : m.username}: ${m.text}`)
        .join('\n');
      promptText += `\n\n`;
    }
  }

  promptText += `Текущее обращение от ${username}: "${cleanText}"\n`;
  promptText += `-> Ответь конкретно, емко и свежо на это обращение от ${username}. Предыдущие сообщения держи в памяти лишь для понимания темы или уместной шутки, но НЕ отвечай на одно и то же по сто раз!`;

  if (chatAdmins && chatAdmins.length > 0) {
    promptText += `\n\n[РУКОВОДСТВО И АДМИНИСТРАЦИЯ ЭТОГО ЧАТА]:\n`;
    promptText += chatAdmins
      .map(a => `• ${a.username || a.displayName} — ${a.customTitle || (a.isOwner ? 'Создатель/Шериф' : 'Администратор')}`)
      .join('\n');
    promptText += `\n💡 Общайся с администраторами на равных, без подобострастия! Дружески подкалывай их за банхаммер, шути, но правила порядка признавай.`;
    if (isSenderOwner) {
      promptText += `\n⭐ Собеседник ${username} — СОЗДАТЕЛЬ / ВЛАДЕЛЕЦ чата. Общайся с ним как со старым корешем, с дерзким юмором и подколами, без лебезения!`;
    } else if (isSenderAdmin) {
      promptText += `\n🛡️ Собеседник ${username} — АДМИНИСТРАТОР этой группы. Подкалывай на равных, как бывалого сталкера.`;
    }
  }

  const asksAboutBot = /(?:бота?|команд[а-я]*|функционал|mini\s*app|что умеет|как работает)/iu.test(cleanText);
  if (mode === 'support' || asksAboutBot) {
    promptText += `\n\n[Контекст архитектуры проекта Даст Таун]:\n${getBotArchitectureOverview()}`;
  }
  if (wikiContext) {
    promptText += `\n\n[Контекст Fallout: Equestria]:\n${wikiContext}`;
  }
  return promptText;
}

export async function generateLittlepipText(
  cleanText: string,
  username: string,
  mode: AgentMode,
  conversationHistory: LittlepipConversationMessage[] = [],
  chatAdmins: ChatAdminInfo[] = [],
  isSenderAdmin = false,
  isSenderOwner = false
): Promise<string> {
  const systemInstruction = buildSystemPrompt(mode);
  const references = shouldSearchFalloutEquestriaWiki(cleanText)
    ? await searchFalloutEquestriaWiki(cleanText).catch(() => [])
    : [];
  const wikiContext = formatFalloutEquestriaReferences(references);
  const promptText = buildLittlepipPrompt(
    cleanText,
    username,
    mode,
    conversationHistory,
    wikiContext,
    chatAdmins,
    isSenderAdmin,
    isSenderOwner
  );

  const apiKey = getEffectiveGeminiKey();
  if (apiKey) {
    try {
      const geminiResult = await generateGeminiReply(systemInstruction, promptText);
      if (geminiResult && geminiResult.length > 3) return geminiResult;
    } catch (err: any) {
      console.log('[Littlepip AI] Gemini попытка завершилась, переключаемся на автономный режим:', err?.message || err);
    }
  }

  // 100% надёжный контекстный генератор Литлпип (никогда не отваливается и не выдаёт ошибку 500)
  return generateLocalLittlepipReply(cleanText, username, mode, conversationHistory, isSenderAdmin, isSenderOwner);
}

function generateLocalLittlepipReply(
  text: string,
  username: string,
  mode: AgentMode,
  conversationHistory: LittlepipConversationMessage[],
  isSenderAdmin = false,
  isSenderOwner = false
): string {
  const cleanText = text.trim();
  const lowerText = cleanText.toLocaleLowerCase('ru');
  const address = username.trim() || 'сталкер';
  const previousAssistantMessage = [...conversationHistory].reverse().find(m => m.isAssistant);
  const prevWasCider = previousAssistantMessage?.text?.toLowerCase().includes('сидр');

  if (isSenderOwner && /(привет|здравствуй|хэй|хей|салют)/iu.test(lowerText)) {
    return `О, сам создатель соизволил заглянуть! Здорово, ${address}. Ну что, кого сегодня караем банхаммером, или устроим вылазку за лутом? 😉`;
  }
  if (isSenderAdmin && /(привет|здравствуй|хэй|хей|салют)/iu.test(lowerText)) {
    return `Здорово, ${address}! Спрячь свой банхаммер, тут все свои. Как обстановка на постах Даст Тауна?`;
  }

  // Игривый сталкерский флирт и подколы
  if (/(красив|милая|красотка|люблю тебя|выйдешь замуж|поцелуй|нравишься|симпатичн|кокет)/iu.test(lowerText)) {
    const flirts = [
      `Ой, ${address}, ты так на меня смотришь или у тебя просто прицел в Pip-Buck сбился? 😉 Красиво стелешь, но редкие патроны я тебе всё равно на шару не отдам!`,
      `Хм, а ты дерзкий, мне нравится! Но смотри, сталкер, я кобылка с характером — в случае чего и рогом искру высеку, и копытом добавлю 😏`,
      `Флиртуешь, да? Смотри, а то в Даст Тауне за такое налог берут! Но мне приятно, чего уж там, милашка 😉`
    ];
    return flirts[Math.floor(Math.random() * flirts.length)];
  }

  // Реакция на ролевую игру (гномы, ракетницы, огнеметы, кражи, балаган в чате)
  if (/(гном|воришк|украл|своровал|спиздил|тырят)/iu.test(lowerText)) {
    return `Так-так, что за переполох с воришками?! Я уже включила радар в Pip-Buck и держу ствол наготове. Кто посмел хозяйничать на нашей территории без спроса? Рассказывайте, кого на мушку брать! 🎯`;
  }
  if (/(ракетниц|огнемет|поджар|взорв|артиллери|стреля)/iu.test(lowerText)) {
    return `О, тяжелая артиллерия в деле — это по-нашему! Только смотрите мне, поселение на воздух не поднимите, а то чинить турели и стены опять моим бедным копытцам придётся! 😂 Жгите, я прикрою с фланга!`;
  }
  if (/(чебурек|чар[аы]|шивер|shiver)/iu.test(lowerText)) {
    return `Ахаха, ну вы и комедию устроили в эфире! Я за вашими разборками из башни наблюдаю — это круче любого довоенного кино. Давайте без драки, а то сейчас обоих в штрафбат запишу! 😉`;
  }

  if (isMemeExplicitlyRequested(cleanText)) {
    const memes = ['this_is_fine', 'gigachad', 'roll_safe', 'woman_cat', 'fry_suspicious', 'cat_smug'];
    const chosen = memes[Math.floor(Math.random() * memes.length)];
    return `Держи отборный мем, ${address}! Чисто жиза Пустошей. [MEME: ${chosen}]`;
  }

  if (mode === 'support') {
    if (/(ошибк|не работает|сломал|упал|падает|баг|лог)/iu.test(lowerText)) {
      return `Давай разберёмся, ${address}. Я могу подсказать по встроенной карте проекта, но не вижу журналы запущенного сервера. Пришли точный текст ошибки и что ты делал перед ней — тогда локализуем причину.`;
    }
    if (/(ядер|nuke|сирен)/iu.test(lowerText)) {
      return `Ядерная тревога проходит через серверный обработчик чата в server.ts, а полноэкранный сигнал показывает NuclearAlertOverlay.tsx. Запуск стоит 100 ℰQ и транслируется всем жителям города.`;
    }
    if (/(telegram|телеграм|polling|409|render|депло|хостинг)/iu.test(lowerText)) {
      return `Telegram-бот и серверная логика находятся в server.ts, а Render запускает приложение по настройкам репозитория. Бот работает на webhook/long polling без конфликтов.`;
    }
    return `Я знаю структуру проекта: сервер — server.ts, состояние Mini App — src/services/storage.ts, типы — src/types.ts. Опиши задачу или пришли ошибку, ${address}, и я подскажу по этим встроенным сведениям.`;
  }

  if (/(привет|здравствуй|доброе утро|добрый вечер|хэй|хей)/iu.test(lowerText)) {
    return `Привет, ${address}! Я на связи и внимательно слушаю. Что у тебя сегодня на уме?`;
  }
  if (/(спасибо|благодарю|спс)/iu.test(lowerText)) {
    return `Всегда пожалуйста, ${address}! С тебя причитается при встрече в Даст Тауне!`;
  }
  if (/(плохо|грустно|тяжело|устал|устала|тревожно|не выходит)/iu.test(lowerText)) {
    return `Ох, ${address}, понимаю. Пустошь умеет выматывать так, что хоть вешайся. Сделай передышку в Даст Тауне, переведи дух — мы со всем разберёмся, прорвёмся!`;
  }
  if (/(форум|сообществ|сайт|вики|wiki)/iu.test(lowerText)) {
    return `База знаний и энциклопедия обо мне и Fallout: Equestria живёт здесь: ${FALLOUT_EQUISTRIA_FORUM_URL}. Там собрана вся история от Стойла 2 до Наварро!`;
  }
  if (/(fallout|эквестри|канон|лор|вселенной|вельвет|каламити|стилхувз)/iu.test(lowerText)) {
    return `Стойло 2, Министерство тайных наук, стальные рейнджеры, Вельвет, Каламити и СтилХувз — я видела эту Пустошь от края до края. О чём именно из наших похождений хочешь вспомнить, ${address}?`;
  }
  if (cleanText.includes('?')) {
    if (/(как ты|как дела|что делаешь)/iu.test(lowerText)) {
      return `На связи, ${address}! Проверяю Pip-Buck, сканирую частоты и чищу контакты в магитехе. У тебя как обстановка?`;
    }
    return `Интересный вопрос, ${address}! Если это касается вылазок, радио Даст Таун или безопасности — я всегда за то, чтобы проверить всё лично. Давай подробности!`;
  }

  const naturalFallbacks = [
    `Ого, ${address}, ну ты выдал! Я прямо зависла на пару секунд, переваривая эту мысль. Продолжай, мне уже интересно! 😏`,
    `Слушаю тебя, ${address}, и думаю: вот за это я и люблю наш чат, вечно тут что-то эпичное происходит! Что дальше планируешь?`,
    `Принято, ${address}! Pip-Buck всё аккуратно записал в журнал. Держим связь, сталкер! 😉`,
    `Хех, ну ты даёшь, ${address}! С таким настроем на Пустошах точно не пропадёшь. Я рядом, если что! 🦄`
  ];
  return naturalFallbacks[Math.floor(Math.random() * naturalFallbacks.length)];
}

// ==========================================
// 7. СПОНТАННЫЙ РАНДОМНЫЙ ПРИКОЛ/МЕМ (РАЗ В 2 ЧАСА)
// ==========================================

export async function generateRandomJoke(
  chatId: number | string,
  threadId?: number,
  chatAdmins: ChatAdminInfo[] = []
): Promise<string> {
  const history = getRecentLittlepipMessages(chatId, threadId).slice(-10);
  const historyText = history
    .map(m => `${m.isAssistant ? 'Литлпип' : m.username}: ${m.text}`)
    .join('\n');

  const adminText = chatAdmins.length > 0
    ? `\n[Администраторы этого чата]: ${chatAdmins.map(a => a.username || a.displayName).join(', ')}`
    : '';

  const jokePrompt = `Ты — Литлпип. Наступил случайный момент (раз в 2 часа), когда ты спонтанно заглядываешь в этот чат, чтобы порадовать сталкеров приколом, мемом или анекдотом!

[ПОСЛЕДНИЕ СООБЩЕНИЯ В ЧАТЕ]:
${historyText || '(в чате пока тихо, все сталкеры ушли на вылазку)'}
${adminText}

ТВОЯ ЗАДАЧА:
1. Если сталкеры о чем-то говорили в последних репликах — выдай смешной, остроумный комментарий, подколку или прикол прямо по их теме разговора!
2. Если в чате тишина — расскажи смешной короткий анекдот (пустошный из Эквестрии, про магиитех/сидр/рейдеров/Стойло 2 или переделанный культовый интернет-анекдот) или жизненную сталкерскую байку.
3. Обязательно используй популярную мемную фразу рунета («это база», «вы не понимаете, это другое», «гениально, надёжно как швейцарские часы», «а минусы будут?», «press F», «пацаны вообще ребята», «подозрительно...» и т.п.).
4. Прикрепи в конце подходящий тег мема: [MEME: id] (например: gigachad, this_is_fine, roll_safe, drake, woman_cat, fry_suspicious, surprised_pikachu, spiderman, facepalm, pepe, cat_smug).
5. Длина: 1-3 предложения. Сделай это искромётно, дерзко, с душой!`;

  const systemInstruction = buildSystemPrompt('chat');
  try {
    const aiReply = await generateGeminiReply(systemInstruction, jokePrompt);
    if (aiReply && aiReply.length > 5) return aiReply;
  } catch (_) {}

  // Встроенные качественные приколы/анекдоты на случай отсутствия сети
  const localJokes = [
    `Слышь, сталкеры, вы тут так тихо сидите, будто стадо гулей мимо бара крадётся! Заходит как-то рейдер в бар в Даст Тауне и просит сидра без радиации... Бармен посмотрел на него и говорит: «А минусы будут?». Это база! [MEME: this_is_fine]`,
    `Шёл второй час затишья... Я тут в Pip-Buck нашла довоенный мануал по ремонту турелей. Знаете, что там написано на первой странице? «Если не работает — ёбни копытом по корпусу». Гениально, надёжно как швейцарские часы! [MEME: roll_safe]`,
    `Наблюдаю за эфиром Даст Таун: всё спокойно, сидр стынет, турели смазаны. На чилле, на расслабоне. Но если кто вздумает буянить — мой Макинтош всегда на взводе! [MEME: gigachad]`,
    `Заходят пегас, единорог и стальной рейнджер в разрушенный супермаркет. Пегас говорит: «Тут ловушки!», единорог: «Тут магия!», а рейнджер уже наступил на мину и орёт: «Вы не понимаете, это другое!». Press F сталкеру. [MEME: this_is_fine]`
  ];

  return localJokes[Math.floor(Math.random() * localJokes.length)];
}

// ==========================================
// 8. ГЛАВНЫЙ ОБРАБОТЧИК СООБЩЕНИЙ ЛИТЛПИП
// ==========================================

export interface TelegramMessageContext {
  chatId: number | string;
  threadId?: number; // для форумных вкладок (topics)
  messageId: number;
  userId: number | string;
  username: string;
  text: string;
  replyToMessage?: any;
  botUsername?: string;
  chatAdmins?: ChatAdminInfo[];
  isSenderAdmin?: boolean;
  isSenderOwner?: boolean;
  isSenderBot?: boolean;
}

export interface LittlepipProcessResult {
  handled: boolean;
  replyText?: string;
  cleanReply?: string;
  mode?: AgentMode;
  action?: 'started_chat' | 'started_support' | 'stopped' | 'bound' | 'chat_reply' | 'random_joke';
  shouldVoice?: boolean;
  meme?: MemeItem;
  mediaUrl?: string;
}

export async function handleLittlepipUpdate(
  ctx: TelegramMessageContext,
  sendMessageFn: (chatId: number | string, text: string, options?: any) => Promise<any>
): Promise<LittlepipProcessResult> {
  const { chatId, threadId, text, username, messageId, replyToMessage, botUsername } = ctx;
  const cleanText = (text || '').trim();
  const lower = cleanText.toLowerCase();
  const command = parseLittlepipCommand(cleanText);
  const conversationHistory = getRecentLittlepipMessages(chatId, threadId);
  if (!command) rememberConversationMessage(chatId, threadId, username, cleanText);

  // Helper options with thread_id for forum topics
  const sendOpts: any = {
    parse_mode: 'Markdown',
    reply_to_message_id: messageId
  };
  if (threadId) {
    sendOpts.message_thread_id = threadId;
  }

  // 1. КОМАНДА /pip_start (или /littlepip, /pip, /ai_start) — ОБЫЧНЫЙ СТАРТ ДИАЛОГА
  if (command && ['pip_start', 'littlepip', 'ai_start', 'pip'].includes(command)) {
    bindTopic(chatId, threadId, 'chat', username);
    const greeting = `👋 **Хэээй! Литлпип на связи!** 🦄✨\n\n` +
      `Я привязалась к этому диалогу${threadId ? ' (в этой вкладке/топике)' : ''}. Что у вас тут происходит — мне уже нравятся первые подозрительные детали.\n\n` +
      `💬 **Как со мной общаться:**\n` +
      `• Зови меня по имени в репликах: *Литлпип*, *Пипка*, *Литка*, *Лилька*\n` +
      `• Или просто пиши сюда — я внимательно слежу за контекстом!\n` +
      `• Если нужна техпомощь по боту или коду: введи \`/support\`\n` +
      `• Чтобы я ушла на радиомолчание: введи \`/stop\`\n\n` +
      `О чём потрём, сталкер? Как там Пустошь сегодня? 😉`;

    await sendMessageFn(chatId, greeting, sendOpts);
    return { handled: true, replyText: greeting, mode: 'chat', action: 'started_chat' };
  }

  // 2. КОМАНДА /support (или /pip_support, /tech_support) — ЗАПУСК ТЕХПОДДЕРЖКИ
  if (command && ['support', 'pip_support', 'tech_support'].includes(command)) {
    bindTopic(chatId, threadId, 'support', username);
    const supportGreeting = `🛠️ **Литлпип: Режим Техподдержки активирован!** 🔧⚡\n\n` +
      `Так-так, открываю терминалы Даст Таун. Показывай, где именно система решила устроить драму.\n\n` +
      `📋 **Чем могу помочь:**\n` +
      `• **Архитектура бота:** расскажу, как устроен \`server.ts\`, роуты чата, ядерка и хостинг на Render\n` +
      `• **Экономика ℰQ:** разберём начисление зарплат, кейсы, аукцион и профили\n` +
      `• **Синхронизация с GitHub:** как скачивать и применять инкрементальные патчи обновлений\n` +
      `• **Ошибки и баги:** помогу локализовать проблему в коде\n\n` +
      `Задавай любой технический вопрос или назови файл, сталкер. Разберёмся в два счёта!`;

    await sendMessageFn(chatId, supportGreeting, sendOpts);
    return { handled: true, replyText: supportGreeting, mode: 'support', action: 'started_support' };
  }

  // 3. КОМАНДА /pip_bind — ПРИВЯЗКА К ВКЛАДКЕ/ТОПИКУ
  if (command && ['pip_bind', 'bind_topic'].includes(command)) {
    const mode: AgentMode = lower.includes('support') ? 'support' : 'chat';
    bindTopic(chatId, threadId, mode, username);
    const bindText = `📌 **Литлпип успешно привязана к этой вкладке!**\n\n` +
      `• Чат: \`${chatId}\`\n` +
      `• Вкладка (Topic Thread ID): \`${threadId || 'Основной чат'}\`\n` +
      `• Режим: **${mode === 'support' ? 'Техподдержка 🛠️' : 'Диалог 💬'}**\n\n` +
      `Теперь я буду отвечать на все реплики в этой теме, где упомянут меня (*Пипка*, *Литка*, *Лилька*) или контекст разговора. Чтобы отключить: \`/stop\`.`;

    await sendMessageFn(chatId, bindText, sendOpts);
    return { handled: true, replyText: bindText, action: 'bound' };
  }

  // 4. КОМАНДА /stop (или /pip_stop, /ai_stop) — ОСТАНОВКА ИИ
  if (command && ['stop', 'pip_stop', 'ai_stop'].includes(command)) {
    unbindTopic(chatId, threadId);
    const stopText = `📻 **Ухожу на радиомолчание!**\n\n` +
      `Pip-Buck переведён в спящий режим. Я больше не буду автоматически встревать в разговор${threadId ? ' в этой вкладке' : ''}.\n\n` +
      `Если снова понадоблюсь — позови меня по имени (*Литлпип*, *Пипка*) или командуй \`/pip_start\` (диалог) / \`/support\` (техпомощь). До связи на Пустошах! 🦄✨`;

    await sendMessageFn(chatId, stopText, sendOpts);
    return { handled: true, replyText: stopText, action: 'stopped' };
  }

  // 5. КОМАНДА /pip_status — ПРОВЕРКА СТАТУСА
  if (command === 'pip_status') {
    const binding = getBinding(chatId, threadId);
    const statusText = `📊 **Статус Литлпип:**\n\n` +
      `• Активность: ${binding?.isActive ? '🟢 В сети и слушает эфир' : '⚪ В спящем режиме'}\n` +
      `• Режим: **${binding?.mode === 'support' ? 'Техподдержка 🛠️' : 'Диалог 💬'}**\n` +
      `• Вкладка топика: \`${threadId || 'Общий'}\`\n` +
      `• ИИ-модель: \`${getEffectiveGeminiKey() ? `${LITTLEPIP_GEMINI_MODEL} (Gemini Neural)` : 'встроенный локальный режим'}\`\n` +
      `• Озвучка: \`Gemini TTS (Kore / нежный и женственный)\`\n` +
      `• Триггер-имена: *Литлпип, Пипка, Литка, Лилька, Littlepip*`;

    await sendMessageFn(chatId, statusText, sendOpts);
    return { handled: true, replyText: statusText };
  }

  // 5.1 КОМАНДА /pip_voice (или /voice) — ПЕРЕКЛЮЧЕНИЕ ГОЛОСОВЫХ ОТВЕТОВ В ЧАТЕ
  if (command && ['pip_voice', 'voice'].includes(command)) {
    const voiceKey = `voice:${getBindingKey(chatId, threadId)}`;
    const currentVoice = agentState.bindings[voiceKey]?.isActive ?? false;
    const arg = cleanText.split(/\s+/)[1]?.toLowerCase();
    const enable = arg ? (arg === 'on' || arg === '1' || arg === 'вкл' || arg === 'да') : !currentVoice;

    agentState.bindings[voiceKey] = {
      chatId,
      threadId,
      mode: 'chat',
      isActive: enable,
      activatedAt: new Date().toISOString(),
      lastInteractionAt: new Date().toISOString(),
      lastUser: username
    };
    saveState(agentState);

    const voiceMsg = enable
      ? `🎙️ **Озвучка Литлпип включена!**\n\nТеперь в этом чате я буду отправлять свои ответы голосом. Чтобы выключить: \`/pip_voice off\`.`
      : `🔇 **Озвучка выключена.**\n\nОтветы будут приходить обычным текстом. Чтобы включить: \`/pip_voice on\`.`;

    await sendMessageFn(chatId, voiceMsg, sendOpts);
    return { handled: true, replyText: voiceMsg, action: 'chat_reply' };
  }

  if (command) return { handled: false };

  // 6. ПРОВЕРКА, ДОЛЖНА ЛИ ЛИТЛПИП ОТВЕТИТЬ НА СООБЩЕНИЕ
  const binding = getBinding(chatId, threadId);
  const isMentioned = hasPipMention(cleanText);
  const isReplyToMe = Boolean(
    replyToMessage && (
      (botUsername && replyToMessage.from?.username?.toLowerCase() === botUsername.toLowerCase()) ||
      replyToMessage.from?.is_bot
    )
  );
  if (!isMentioned && !isReplyToMe) return { handled: false };

  // 7. ФОРМИРОВАНИЕ ОТВЕТА ЛИТЛПИП
  const activeMode: AgentMode = binding?.mode || (lower.includes('ошибк') || lower.includes('помоги') || lower.includes('код') ? 'support' : 'chat');

  // Обновляем время последней активности
  if (binding) {
    binding.lastInteractionAt = new Date().toISOString();
    saveState(agentState);
  }

  // Запуск многоуровневой генерации (Gemini -> Резервная нейросеть -> Контекстный синтезатор)
  const finalReply = await generateLittlepipText(
    cleanText,
    username || 'сталкер',
    activeMode,
    conversationHistory,
    ctx.chatAdmins,
    ctx.isSenderAdmin,
    ctx.isSenderOwner
  );

  const wantsMemeMedia = isMemeExplicitlyRequested(cleanText);
  const { cleanText: cleanReply, meme, mediaUrl } = extractMemeTag(finalReply, wantsMemeMedia);

  // Отправляем ответ в тот же чат и тему
  await sendMessageFn(chatId, cleanReply || finalReply, {
    ...sendOpts,
    meme,
    mediaUrl,
    rawText: finalReply
  });

  // Сохраняем собственный ответ в историю, чтобы не повторять ту же мысль/деталь в следующих репликах!
  rememberConversationMessage(chatId, threadId, 'Пипка (Литлпип)', cleanReply || finalReply, true);

  const voiceKey = `voice:${getBindingKey(chatId, threadId)}`;
  const voiceActive = Boolean(agentState.bindings[voiceKey]?.isActive);
  const wantsVoice = voiceActive || /(?:скажи|ответь|запиши|проговори)\s+голосом/iu.test(cleanText);

  return {
    handled: true,
    replyText: finalReply,
    cleanReply: cleanReply || finalReply,
    mode: activeMode,
    action: 'chat_reply',
    meme,
    mediaUrl,
    shouldVoice: wantsVoice
  };
}

export function getActiveBindings(): ChatBinding[] {
  return Object.values(agentState.bindings).filter(b => b.isActive);
}

export function updateBindingJokeTimestamp(
  chatId: number | string,
  threadId: number | undefined,
  nextTimestamp: number
): void {
  const key = getBindingKey(chatId, threadId);
  if (agentState.bindings[key]) {
    agentState.bindings[key].lastRandomJokeAt = Date.now();
    agentState.bindings[key].nextRandomJokeAt = nextTimestamp;
    saveState(agentState);
  }
}

export function getLittlepipStats(): any {
  return {
    activeBindingsCount: Object.values(agentState.bindings).filter(b => b.isActive).length,
    bindings: agentState.bindings,
    lastActiveAt: agentState.lastActiveAt
  };
}
