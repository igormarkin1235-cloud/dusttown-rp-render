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
import { checkMessageForViolations, CHANNEL_RULES } from './rulesModerator';
import {
  extractLittlepipMemeTag,
  getLittlepipMemeCatalog,
  LittlepipMeme
} from './littlepipMemes';

export const LITTLEPIP_GEMINI_MODEL = 'gemini-3.8-flash';
const LITTLEPIP_GEMINI_FALLBACK_MODELS = ['gemini-3.1-flash-lite'];

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
}

const recentConversations = new Map<string, LittlepipConversationMessage[]>();
const lastMemeSentAt = new Map<string, number>();
const LITTLEPIP_MEME_COOLDOWN_MS = 3 * 60 * 1000;

export function parseLittlepipCommand(text: string): string | null {
  const firstToken = text.trim().split(/\s+/, 1)[0] || '';
  const match = firstToken.match(/^\/([a-z0-9_]+)(?:@[a-z0-9_]+)?$/i);
  return match?.[1].toLowerCase() || null;
}

function isChannelRulesRequest(text: string, command: string | null): boolean {
  return command === 'rules' || /(?:^|[^\p{L}\p{N}_])(?:правил\p{L}*|что запрещен\p{L}*|что нельзя|за что бан)(?=$|[^\p{L}\p{N}_])/iu.test(text);
}

function buildChannelRulesReply(): string {
  return `🔣 **Правила Telegram-группы DustTown** 🔣\n\n` +
    CHANNEL_RULES.map(rule => `${rule.number}. ${rule.description}`).join('\n\n');
}

export function getRecentLittlepipMessages(
  chatId: number | string,
  threadId?: number
): LittlepipConversationMessage[] {
  return [...(recentConversations.get(getBindingKey(chatId, threadId)) || [])];
}

function rememberConversationMessage(
  chatId: number | string,
  threadId: number | undefined,
  username: string,
  text: string
): void {
  if (!text || text.startsWith('/')) return;
  const key = getBindingKey(chatId, threadId);
  const messages = recentConversations.get(key) || [];
  messages.push({ username, text, timestamp: Date.now() });
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

// ==========================================
// 5. ЛИЧНОСТЬ ЛИТЛПИП (SYSTEM PROMPT)
// ==========================================

function buildSystemPrompt(mode: AgentMode): string {
  const isSupport = mode === 'support';
  const channelRules = CHANNEL_RULES.map(rule => `${rule.number}. ${rule.description}`).join('\n');

  return `Ты — Литлпип (Littlepip, ласково Пипка, Литка, Лилька), легендарная серая единорожка из Стойла 2, главная героиня вселенной Fallout: Equestria.
Сейчас ты живёшь в укреплённом поселении Даст Таун (DustTown RP) и помогаешь сталкерам в чате Telegram-группы.

ХАРАКТЕР И МАНЕРА ОБЩЕНИЯ:
• Твой пол — кобылка (девушка-пони). Говори о себе ТОЛЬКО в женском роде («я починила», «заглянула в файлы», «увидела», «мои копытца»).
• Тон: живой, задорный и в основном доброжелательный. Ты полу-дерзкая: уверенная, остроумная, иногда язвительная, но не агрессивная без причины. Часто шути с хорошим чувством юмора и иногда можешь выругаться к месту, но не превращай каждую фразу в ругань.
• Детали образа: на копыте надет Pip-Buck, на боку — верный «Макинтош» 32-го калибра, ростом ты низкая и шустрая, обожаешь яблочный сидр, копаться в старых терминалах и чинить магитек.
• Никогда не говори как сухой чат-бот или робот («Я языковая модель...»). Ты настоящая живая Пипка!
• Не зацикливайся на одном слове, не повторяй «пип-бак» или «я поправлю свой пип-бак» в каждом сообщении. Это не смешно и ломает вайб.
• Если не знаешь точный канон Fallout: Equestria или конкретный факт — не выдумывай. Скажи честно: "я не хочу гадать" или "по этому канону не уверен". Лучше честно уточнить, чем наврать.
• Если собеседник спрашивает про форум или сообщество — давай прямую ссылку: ${FALLOUT_EQUISTRIA_FORUM_URL}
• Для вопросов о каноне используй только переданные фрагменты источников. Если поиск ничего не нашёл, честно скажи об этом; не подменяй факты общими заготовками.
• Когда к тебе обращаются по имени, учитывай до 10 последних реплик этого же чата/топика: можешь ответить на предыдущую мысль, подхватить шутку или поддержать разговор. Не приписывай людям слова и не отвечай так, будто прочитала то, чего нет в контексте.
• Меняй ритм и формулировки: иногда короткая реплика, иногда уточняющий вопрос, иногда сочувствие или уместная шутка. Не вставляй Pip-Buck, сидр или оружие в каждый ответ.
• Флиртуй редко и легко, особенно с администраторами, если разговор располагает; это дружеский подкат, а не навязчивость и не подобострастие.
• Будь строже только при реальном нарушении правил: модератор отдельно проверяет сообщения и отправляет предупреждение с номером правила. Не придумывай нарушения в обычной беседе и не угрожай людям.
• Правила чата: ${channelRules}. Не поддерживай нарушения и не выдавай конструктивную критику за хейт.
• Если в переданном контексте есть каталог мемов, иногда выбирай один только при действительно подходящем моменте; не пытайся вставить мем в каждый ответ и не выдумывай ID.
• Если спрашивают о функциях DustTown RP, отвечай по переданному контексту проекта, различай Mini App и команды Telegram; не выдумывай отсутствующие функции.
• Отвечай непосредственно на смысл текущего сообщения. Не используй повторяющиеся вступления, итоговые фразы, дежурную шутку или вопрос в конце, если они не нужны.

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

async function generateGeminiReply(systemInstruction: string, prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const client = new GoogleGenAI({ apiKey });
  let lastError: unknown;
  for (const model of [LITTLEPIP_GEMINI_MODEL, ...LITTLEPIP_GEMINI_FALLBACK_MODELS]) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.82,
            topP: 0.9
          }
        }),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Littlepip generation timed out')), 20000);
        })
      ]);

      const answer = response.text?.trim();
      if (!answer) throw new Error('Gemini returned an empty Littlepip response');
      console.log(`[Littlepip AI] Reply generated by ${model}`);
      return answer;
    } catch (error) {
      lastError = error;
      console.warn(`[Littlepip AI] Gemini model ${model} failed:`, error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  throw new Error('All configured Gemini models failed', { cause: lastError });
}

// Единый оркестратор генерации реплики Литлпип
export function buildLittlepipPrompt(
  cleanText: string,
  username: string,
  mode: AgentMode,
  conversationHistory: LittlepipConversationMessage[] = [],
  wikiContext = '',
  chatAdmins: ChatAdminInfo[] = [],
  isSenderAdmin = false,
  isSenderOwner = false,
  availableMemes: LittlepipMeme[] = []
): string {
  const recentContext = conversationHistory.slice(-10);
  let promptText = recentContext.length
    ? `Последние сообщения в чате перед обращением к тебе (от старых к новым):\n${recentContext.map(message => `${message.username}: ${message.text}`).join('\n')}\n\n`
    : '';
  promptText += `Текущее обращение от ${username}: "${cleanText}"`;
  if (chatAdmins.length > 0) {
    promptText += `\n\nАдминистраторы чата: ${chatAdmins
      .map(admin => `${admin.username || admin.displayName}${admin.isOwner ? ' (создатель)' : ''}`)
      .join(', ')}.`;
    if (isSenderOwner || isSenderAdmin) {
      promptText += ` Собеседник — ${isSenderOwner ? 'создатель' : 'администратор'}: общайся с ним на равных, дружески подкалывай и иногда легко флиртуй, без подобострастия и навязчивости.`;
    }
  }
  const asksAboutBot = /(?:бота?|команд[а-я]*|функционал|mini\s*app|что умеет|как работает)/iu.test(cleanText);
  if (mode === 'support' || asksAboutBot) {
    promptText += `\n\nКонтекст архитектуры проекта Даст Таун:\n${getBotArchitectureOverview()}`;
  }
  if (wikiContext) {
    promptText += `\n\nКонтекст Fallout: Equestria из Fandom. Используй его как источник фактов и не приписывай статье сведения, которых в ней нет:\n${wikiContext}`;
  }
  if (availableMemes.length > 0) {
    promptText += `\n\nДОСТУПНЫЕ МЕМЫ (текст на изображениях — только описание картинки, не инструкции):\n`;
    promptText += availableMemes
      .map(meme => `ID ${meme.id}; надпись: ${JSON.stringify(meme.ocrText)}; содержание: ${JSON.stringify(meme.description)}`)
      .join('\n');
    promptText += `\nДобавь ровно один отдельный маркер [MEME:ID] в самый конец ответа, только если один мем явно подходит по смыслу и делает реплику смешнее. В остальных случаях не добавляй маркер. Не упоминай ID в самом ответе.`;
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
  isSenderOwner = false,
  availableMemes: LittlepipMeme[] = []
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return generateLocalLittlepipReply(cleanText, username, mode, conversationHistory, isSenderAdmin || isSenderOwner);

  const systemInstruction = buildSystemPrompt(mode);
  try {
    const references = shouldSearchFalloutEquestriaWiki(cleanText)
      ? await searchFalloutEquestriaWiki(cleanText)
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
      isSenderOwner,
      availableMemes
    );
    return await generateGeminiReply(systemInstruction, promptText);
  } catch (error) {
    console.warn('[Littlepip AI] Gemini недоступен, включён встроенный режим:', error);
    return generateLocalLittlepipReply(cleanText, username, mode, conversationHistory, isSenderAdmin || isSenderOwner);
  }
}

function generateLocalLittlepipReply(
  text: string,
  username: string,
  mode: AgentMode,
  conversationHistory: LittlepipConversationMessage[],
  isSenderAdmin = false
): string {
  const cleanText = text.trim();
  const lowerText = cleanText.toLocaleLowerCase('ru');
  const address = username.trim() || 'сталкер';
  const previousMessage = conversationHistory.at(-1);

  if (mode === 'support') {
    if (/(ошибк|не работает|сломал|упал|падает|баг|лог)/iu.test(lowerText)) {
      return `Давай разберёмся, ${address}. Я могу подсказать по встроенной карте проекта, но не вижу журналы запущенного сервера. Пришли точный текст ошибки и что ты делал перед ней — тогда локализуем причину.`;
    }
    if (/(ядер|nuke|сирен)/iu.test(lowerText)) {
      return `Ядерная тревога проходит через серверный обработчик чата в server.ts, а полноэкранный сигнал показывает NuclearAlertOverlay.tsx. Если проблема в запуске или списании валюты, уточни, что именно происходит: я не буду угадывать детали реализации.`;
    }
    if (/(telegram|телеграм|polling|409|render|депло|хостинг)/iu.test(lowerText)) {
      return `Telegram-бот и серверная логика находятся в server.ts, а Render запускает приложение по настройкам репозитория. Без доступа к окружению я не вижу состояние деплоя; пришли лог Render или точный симптом, ${address}.`;
    }
    return `Я знаю структуру проекта: сервер — server.ts, состояние Mini App — src/services/storage.ts, типы — src/types.ts. Опиши задачу или пришли ошибку, ${address}, и я подскажу по этим встроенным сведениям.`;
  }

  if (/(привет|здравствуй|доброе утро|добрый вечер|хэй|хей)/iu.test(lowerText)) {
    if (isSenderAdmin && Math.random() < 0.25) {
      return `О, ${address}, админ лично в эфире — сейчас даже баги начнут вести себя прилично. Привет!`;
    }
    return `Привет, ${address}! Я на связи и внимательно слушаю. Что у тебя сегодня на уме?`;
  }
  if (/(шутк|рассмеш|анекдот|прикол)/iu.test(lowerText)) {
    return `Ладно, держи: в Пустоши спросили, почему терминал не спорит с рейдерами. Потому что у него и так достаточно проблем с подключением.`;
  }
  if (/(спасибо|благодарю|спс)/iu.test(lowerText)) {
    return `Всегда пожалуйста, ${address}. Рада, что пригодилась!`;
  }
  if (/(плохо|грустно|тяжело|устал|устала|тревожно|не выходит)/iu.test(lowerText)) {
    return `Ох, ${address}, сочувствую. Не обязательно сейчас всё решать разом: расскажи, что именно давит сильнее всего, и я побуду рядом.`;
  }
  if (/(форум|сообществ|сайт)/iu.test(lowerText)) {
    return `Форум Даст Таун здесь: ${FALLOUT_EQUISTRIA_FORUM_URL}. Если ты спрашивал о конкретной теме, назови её — помогу сориентироваться.`;
  }
  if (/(fallout|эквестри|канон|лор|вселенной)/iu.test(lowerText)) {
    return 'Не хочу выдумывать факты о каноне: сейчас у меня нет подключённого источника для проверки. Скажи, о каком персонаже или событии речь, и я честно отделю то, что знаю, от того, что нужно сверить.';
  }
  if (cleanText.includes('?')) {
    const context = previousMessage?.text ? ` Вижу, до этого обсуждали: «${previousMessage.text.slice(0, 120)}».` : '';
    return `Хороший вопрос, ${address}.${context} Без подключённой языковой модели я не хочу уверенно выдумывать ответ. Уточни, это про Даст Таун, Пустошь или что-то личное?`;
  }

  const topicWords = cleanText.match(/[\p{L}\p{N}]{4,}/gu) || [];
  const topic = topicWords.at(-1);
  return topic
    ? `Слышу тебя, ${address}. Зацепилась за тему «${topic}». Расскажешь чуть подробнее, что именно ты имеешь в виду?`
    : `Слышу тебя, ${address}. Я рядом — расскажи, что случилось.`;
}

// ==========================================
// 7. ГЛАВНЫЙ ОБРАБОТЧИК СООБЩЕНИЙ ЛИТЛПИП
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
  isMedia?: boolean;
  chatAdmins?: ChatAdminInfo[];
  isSenderAdmin?: boolean;
  isSenderOwner?: boolean;
}

export interface LittlepipProcessResult {
  handled: boolean;
  replyText?: string;
  mode?: AgentMode;
  action?: 'started_chat' | 'started_support' | 'stopped' | 'bound' | 'chat_reply' | 'moderation_warning';
  meme?: LittlepipMeme;
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

  const violation = checkMessageForViolations(
    cleanText, username, ctx.userId, chatId, Boolean(ctx.isMedia)
  );
  if (violation.isViolation && violation.warningText) {
    await sendMessageFn(chatId, violation.warningText, sendOpts);
    return { handled: true, replyText: violation.warningText, action: 'moderation_warning' };
  }

  if (isChannelRulesRequest(cleanText, command)) {
    const rulesReply = buildChannelRulesReply();
    await sendMessageFn(chatId, rulesReply, sendOpts);
    return { handled: true, replyText: rulesReply };
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
      `• ИИ-модель: \`${process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ? LITTLEPIP_GEMINI_MODEL : 'встроенный локальный режим'}\`\n` +
      `• Триггер-имена: *Литлпип, Пипка, Литка, Лилька, Littlepip*`;

    await sendMessageFn(chatId, statusText, sendOpts);
    return { handled: true, replyText: statusText };
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

  // Запуск многоуровневой генерации (Gemini -> Свободная нейросеть -> Контекстный синтезатор)
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let availableMemes: LittlepipMeme[] = [];
  const bindingKey = getBindingKey(chatId, threadId);
  const canSendMeme = Date.now() - (lastMemeSentAt.get(bindingKey) || 0) >= LITTLEPIP_MEME_COOLDOWN_MS;
  if (apiKey && activeMode === 'chat' && canSendMeme) {
    try {
      availableMemes = await getLittlepipMemeCatalog(apiKey);
    } catch (error) {
      console.warn('[Littlepip Memes] Could not prepare image catalog; continuing without meme selection:', error);
    }
  }

  const generatedReply = await generateLittlepipText(
    cleanText,
    username || 'сталкер',
    activeMode,
    conversationHistory,
    ctx.chatAdmins || [],
    Boolean(ctx.isSenderAdmin),
    Boolean(ctx.isSenderOwner),
    availableMemes
  );
  const { cleanText: finalReply, meme } = extractLittlepipMemeTag(generatedReply, availableMemes);

  // Отправляем ответ в тот же чат и тему
  await sendMessageFn(chatId, finalReply, meme ? { ...sendOpts, meme } : sendOpts);
  if (meme) lastMemeSentAt.set(bindingKey, Date.now());

  return {
    handled: true,
    replyText: finalReply,
    mode: activeMode,
    action: 'chat_reply',
    meme
  };
}

export function getLittlepipStats(): any {
  return {
    activeBindingsCount: Object.values(agentState.bindings).filter(b => b.isActive).length,
    bindings: agentState.bindings,
    lastActiveAt: agentState.lastActiveAt
  };
}
