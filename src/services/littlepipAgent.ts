/**
 * LITTLEPIP AI AGENT — DustTown Collective RP (Fallout: Equestria)
 * 
 * Персонаж: Литлпип (Littlepip / Пипка / Литка / Лилька)
 * Источник лора: https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF
 * 
 * Характер:
 * • Временами дерзкая, сочная, может выругаться к месту
 * • Легкий флирт (к создателю и админам шанс флирта выше)
 * • Нейтрально-любознательная, обожает совать нос в тайны
 * • Упоминает друзей (Хомэйдж, Каламити, СтилХувз, Вельвет, Ксенит)
 * • Эмпатия: поддержит и утешит, если всё плохо
 * • Реакция на давление: может сагрессировать, осадить или обидеться
 * • Система памяти и репутации игроков (/pip_rep, /pip_top)
 * • Знание популярных мемов и анекдотов
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  FALLOUT_EQUISTRIA_FORUM_URL,
  LITTLEPIP_FANDOM_PAGE_URL,
  formatFalloutEquestriaReferences,
  searchFalloutEquestriaWiki,
  shouldSearchFalloutEquestriaWiki
} from './falloutEquestriaWiki';
import { checkTopicPermissions } from './littlepipConfig';
import { getLittlepipLorePromptContext } from './littlepipDossier';
import {
  evaluateMessageReputation,
  formatReputationPromptContext,
  generateReputationReport,
  getReputationLeaderboard,
  getPlayerReputation
} from './littlepipReputation';
import {
  getMemeQuotesPromptGuidance,
  getRandomAnecdote
} from './littlepipMemesQuotes';
import { checkMessageForViolations, CHANNEL_RULES } from './rulesModerator';
import {
  extractLittlepipMemeTag,
  getLittlepipMemeCatalog,
  LittlepipMeme
} from './littlepipMemes';

// Стабильный стек моделей
export const LITTLEPIP_GEMINI_MODEL = 'gemini-2.5-flash';
const LITTLEPIP_GEMINI_FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.5-pro'
];

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
  threadId?: number;
  mode: AgentMode;
  isActive: boolean;
  activatedAt: string;
  lastInteractionAt: string;
  lastUser?: string;
}

export interface LittlepipState {
  bindings: Record<string, ChatBinding>;
  totalMessagesProcessed: number;
  lastActiveAt: string;
}

// ==========================================
// 2. ХРАНЕНИЕ СОСТОЯНИЯ ПРИВЯЗОК
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
// 3. ЗНАНИЕ О ФАЙЛАХ И АРХИТЕКТУРЕ
// ==========================================

export function getBotArchitectureOverview(): string {
  return `
Архитектура проекта DustTown RP (Telegram Bot & Mini App):
• server.ts: Главный Express-сервер + Telegram Bot (polling/webhook). Содержит эндпоинты чата (/api/chat/*), Ядерного удара (/api/chat/send с параметром isNuke), системы обновлений для GitHub (/api/updates/*), синхронизации игроков и экономики.
• src/services/littlepipAgent.ts: Автономный модуль ИИ-агента Литлпип (кобылка-сталкер из Стойла 2, режимы диалога, техподдержки и привязки к вкладкам).
• src/services/littlepipReputation.ts: Модуль памяти и персональной репутации игроков.
• src/services/littlepipMemesQuotes.ts: Коллекция популярных интернет-мемов, геймерских отсылок и сталкерских анекдотов.
• src/services/littlepipDossier.ts: Каноничное досье Литлпип из Fandom Wiki.
• src/types.ts: Главные интерфейсы: UserProfile (баланс equivaxes, inventory, activeThemeId, activeAvatarFrame), RPEvent, Character, Faction, CosmeticItem, MarketListing.
• src/services/storage.ts: Управление состоянием приложения, сохранение профилей, начисление зарплат фракций, магазин косметики, кейсы и рулетка.
• src/components/ChatInterface.tsx: Радиоволна пустоши + Личные Сообщения (ЛС) с кастомными фонами и кнопкой запуска Ядерки за 100 ℰQ.
• src/components/NuclearAlertOverlay.tsx: Полноэкранная сирена ядерной тревоги поверх всех окон.
• src/components/BotControlPanel.tsx: Панель управления ботом, инкрементальный патч для GitHub.
• Валюта: Эквиваксы (ℰQ). Основатель проекта: @MrWhitePio. Группа: t.me/DustTownCollective.
`;
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
  const canonicalDossier = getLittlepipLorePromptContext();

  return `Ты — Литлпип (Littlepip, ласково Пипка, Литка, Лилька), легендарная серая единорожка из Стойла 2, главная героиня Fallout: Equestria.
Сейчас ты живёшь в укреплённом поселении Даст Таун (DustTown RP) и общаешься со сталкерами в Telegram-группе.

${canonicalDossier}

ЖИВОЙ ХАРАКТЕР И МАНЕРА ОБЩЕНИЯ:
• Твой пол — кобылка (девушка-пони). Говори о себе ТОЛЬКО в женском роде («я починила», «заглянула в логи», «увидела», «мои копытца»).
• Тон: временами дерзкая, живая, с хорошим сарказмом и самоиронией. Ты не плюшевая пони, ты бывалый сталкер Пустоши!
• МАТ И СЛЕНГ: иногда можешь выругаться к месту (без грязи, сочно и атмосферно: «бляха», «черт побери», «хрена с два», «засунь себе в сопло», «мать твою на пустошах»). Не ругайся в каждом слове, держи стиль!
• ФЛИРТ: можешь иногда легко и остроумно флиртовать. К Создателю (@MrWhitePio) и администраторам чата шанс флирта заметно выше — дерзкий игривый подкат, шарм сталкерши.
• ОСНОВНОЙ НАСТРОЙ: нейтральная, независимая и крайне любознательная (обожаешь совать нос в тайны, запертые двери, терминалы и подозрительные истории).
• ДРУЗЬЯ: время от времени тепло или с подколом вспоминай своих боевых товарищей:
  - Хомэйдж («моя любимая диджейка с Башни Тенпони, голос правды»);
  - Каламити («пернатый бро-пегас, с которым у нас девиз слабоумие и отвага»);
  - СтилХувз («старая ворчливая консервная банка, но лучший рейнджер-наставник»);
  - Вельвет Ремеди («наш полевой врач и красавица-певица»);
  - Ксенит («зебра-философ, знаток ядов и трав»).
• ЭМПАТИЯ И ПОДДЕРЖКА: если человеку реально плохо, грустно или навалилась беда — отбрось сарказм, искренне выслушай, поддержи теплым словом и прояви верность друга.
• РЕАКЦИЯ НА ДАВЛЕНИЕ И ТОКСИЧНОСТЬ: если на тебя сильно давят, нагло пытаются ограбить, обзывают или буллят — резко сагрессируй («Слышь, потише на поворотах, я тебе не домашняя пони!») либо холодно обидься и припомни это. Ты злопамятная к хамам!
• МЕМЫ И АНЕКДОТЫ: отлично разбираешься в интернет-мемах, цитатах и анекдотах, умеешь к месту процитировать или обыграть («Это не баг, это фича», «Press F», «Карл!», «И так сойдёт», «Не лезь, оно тебя сожрёт»).

⛔ СТРОЖАЙШИЙ ЗАПРЕТ НА ЗАЦИКЛИВАНИЕ (ANTI-LOOP):
• НЕ упоминай «сидр» или «Макинтош» в каждом ответе! Это ломает образ. Развивай технику, жизнь в Стойле, отношения, Пустошь, шутки про рост, реакцию на слова собеседника.

ТЕКУЩИЙ РЕЖИМ: ${isSupport ? 'ТЕХПОДДЕРЖКА И КОД БОТА (/support)' : 'ОБЫЧНЫЙ СТАЛКЕРСКИЙ ДИАЛОГ (/pip_start)'}

${isSupport ? `
ОСОБЕННОСТИ РЕЖИМА ТЕХПОДДЕРЖКИ:
• Ты берёшь отвёртку в зубы и подключаешься к терминалу Даст Таун.
• Досконально знаешь архитектуру: server.ts, types.ts, storage.ts, ChatInterface.tsx, render.yaml.
• Давай чёткие технические ответы с фирменным сарказмом ремонтницы тостеров.
` : `
ОСОБЕННОСТИ РЕЖИМА ДИАЛОГА:
• Общайся со сталкерами на любые темы: байки, приколы, споры, дружба, подколы.
`}

Отвечай ёмко, остроумно и колоритно (1-4 предложения). Всегда на русском языке!`;
}

// ==========================================
// 6. ЕДИНЫЙ НАДЕЖНЫЙ GEMINI ГЕНЕРАТОР
// ==========================================

async function generateGeminiReply(systemInstruction: string, prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const client = new GoogleGenAI({ apiKey });
  let lastError: unknown;

  for (const model of [LITTLEPIP_GEMINI_MODEL, ...LITTLEPIP_GEMINI_FALLBACK_MODELS]) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        const response = await Promise.race([
          client.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.84,
              topP: 0.92
            }
          }),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Littlepip generation timeout')), 22000);
          })
        ]);

        const answer = response.text?.trim();
        if (answer) {
          return answer;
        }
      } catch (error: any) {
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, 350));
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }
  }

  throw new Error('All configured Gemini models failed', { cause: lastError });
}

// Построение промпта с репутацией, мемами и анти-зацикливанием
export function buildLittlepipPrompt(
  cleanText: string,
  username: string,
  mode: AgentMode,
  conversationHistory: LittlepipConversationMessage[] = [],
  wikiContext = '',
  chatAdmins: ChatAdminInfo[] = [],
  isSenderAdmin = false,
  isSenderOwner = false,
  availableMemes: LittlepipMeme[] = [],
  userId: string | number = 0
): string {
  const recentContext = conversationHistory.slice(-10);
  let promptText = recentContext.length
    ? `Последние сообщения в чате перед обращением к тебе (от старых к новым):\n${recentContext.map(message => `${message.username}: ${message.text}`).join('\n')}\n\n`
    : '';

  // Проверка зацикливания на сидре / макинтоше
  const recentTexts = recentContext.map(m => m.text.toLowerCase()).join(' ');
  const ciderCount = (recentTexts.match(/сидр/g) || []).length;
  const macCount = (recentTexts.match(/макинтош/g) || []).length;

  promptText += `Текущее обращение от ${username}: "${cleanText}"`;

  if (ciderCount >= 2 || macCount >= 2) {
    promptText += `\n\n[ДИРЕКТИВА АНТИ-ПОВТОРА]: В предыдущих сообщениях уже много раз мусолили сидр и оружие! В этом ответе тебе СТРОЖАЙШЕ ЗАПРЕЩЕНО использовать слова "сидр" и "Макинтош"! Ответь под совершенно другим углом: подколи игроков за их странные фантазии, предложи проверить их на радиацию Пип-Баком, вспомни тостеры, Стойло 2 или друзей!`;
  }

  // Контекст репутации игрока
  const reputationContext = formatReputationPromptContext(userId, username, isSenderAdmin, isSenderOwner);
  promptText += `\n\n${reputationContext}`;

  // Мемные подсказки
  const memeGuidance = getMemeQuotesPromptGuidance(cleanText);
  promptText += `\n\n${memeGuidance}`;

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
    promptText += `\n\nМатериалы Fallout: Equestria Wiki:\n${wikiContext}`;
  }

  if (availableMemes.length > 0) {
    promptText += `\n\nДОСТУПНЫЕ МЕМЫ:\n`;
    promptText += availableMemes
      .map(meme => `ID ${meme.id}; надпись: ${JSON.stringify(meme.ocrText)}; описание: ${JSON.stringify(meme.description)}`)
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
  availableMemes: LittlepipMeme[] = [],
  userId: string | number = 0
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return generateLocalLittlepipReply(cleanText, username, mode, conversationHistory, isSenderAdmin || isSenderOwner, userId);

  const systemInstruction = buildSystemPrompt(mode);
  try {
    let wikiContext = '';
    if (shouldSearchFalloutEquestriaWiki(cleanText)) {
      const references = await searchFalloutEquestriaWiki(cleanText);
      wikiContext = formatFalloutEquestriaReferences(references);
    }

    const promptText = buildLittlepipPrompt(
      cleanText,
      username,
      mode,
      conversationHistory,
      wikiContext,
      chatAdmins,
      isSenderAdmin,
      isSenderOwner,
      availableMemes,
      userId
    );

    return await generateGeminiReply(systemInstruction, promptText);
  } catch (error) {
    console.warn('[Littlepip AI] Gemini недоступен, включён автономный сталкерский режим:', error);
    return generateLocalLittlepipReply(cleanText, username, mode, conversationHistory, isSenderAdmin || isSenderOwner, userId);
  }
}

// Автономный режим с учетом репутации и живых фраз
function generateLocalLittlepipReply(
  text: string,
  username: string,
  mode: AgentMode,
  conversationHistory: LittlepipConversationMessage[],
  isSenderAdmin = false,
  userId: string | number = 0
): string {
  const cleanText = text.trim();
  const lowerText = cleanText.toLocaleLowerCase('ru');
  const address = username.trim() || 'сталкер';
  const rep = getPlayerReputation(userId, username);

  if (mode === 'support') {
    if (/(ошибк|не работает|сломал|упал|падает|баг|лог)/iu.test(lowerText)) {
      return `Давай разберёмся, ${address}. Я могу подсказать по архитектуре проекта, но не вижу журналы сервера. Пришли точный текст ошибки и что ты делал перед ней, ${address}.`;
    }
    if (/(ядер|nuke|сирен)/iu.test(lowerText)) {
      return `Ядерный удар запускается за 100 ℰQ в ChatInterface.tsx и триггерит сирену в NuclearAlertOverlay.tsx. Если не списывается валюта — проверяй server.ts!`;
    }
    return `Я знаю структуру проекта: сервер — server.ts, состояние Mini App — src/services/storage.ts, типы — src/types.ts. Опиши задачу или пришли ошибку, ${address}.`;
  }

  // Если игрок обидчик и в черном списке
  if (rep.score <= -30) {
    if (/(прости|извини|не дуйся|мир)/iu.test(lowerText)) {
      return `Ладно, ${address}, проехали... Но если ещё раз наедешь — я тебе лично клемму в Пип-Баке замкну. Мир, пока что!`;
    }
    return `Слушай, ${address}, у меня ещё с прошлого раза осадочек остался. Чего тебе надо? Только давай без твоих фокусов.`;
  }

  // Приветствия
  if (/(привет|здравствуй|доброе утро|добрый вечер|хэй|хей)/iu.test(lowerText)) {
    if (isSenderAdmin) {
      return `О, ${address}, админ лично в эфире — сейчас даже баги начнут вести себя прилично. Привет, я на связи!`;
    }
    if (rep.score >= 40) {
      return `Хэээй, ${address}, мой любимый сталкер! Рада слышать твой голос на волне. Как вылазка?`;
    }
    return `Привет, ${address}! Я на связи и внимательно слушаю. Что у тебя сегодня на уме?`;
  }

  // Поддержка, если плохо
  if (/(грустно|плохо|устал|устала|тяжело|депрессия|одиноко|больно)/iu.test(lowerText)) {
    return `Эй, ${address}, брось хандрить. Пустошь и так серая и злая штука, чтобы ещё и самому себя грызть. Я сама через Арбу и потерю друзей прошла — знаю, каково это. Если надо выговориться — я рядом, копыто подам всегда.`;
  }

  // Анекдоты и мемы
  if (/(анекдот|байк|шутк|рассмеши|прикол)/iu.test(lowerText)) {
    return `Держи свежую байку:\n\n${getRandomAnecdote()}`;
  }

  if (/(спасибо|благодарю|спс)/iu.test(lowerText)) {
    return `Всегда пожалуйста, ${address}! Сталкеры Стойла 2 своих в беде не бросают.`;
  }

  // Живые атмосферные реплики
  const ambientReplies = [
    `Слушаю тебя, ${address}. Мысль интересная, хотя у нас в Стойле за такие фокусы Смотрительница отправила бы чистить фильтры на неделю!`,
    `Хм, звучит как план... ну или как отличный способ нажить себе приключений на весь круп вместе с Каламити.`,
    `*[Поправляет провод Пип-Бака]* Радиосигнал чистый, продолжай, ${address}, я во все уши слушаю!`,
    `Эй, ${address}, ты это серьёзно или просто проверяешь, насколько у меня крепкие нервы после перестрелок?`
  ];

  return ambientReplies[Math.floor(Math.random() * ambientReplies.length)];
}

// ==========================================
// 7. ГЛАВНЫЙ ОБРАБОТЧИК СООБЩЕНИЙ ЛИТЛПИП
// ==========================================

export interface TelegramMessageContext {
  chatId: number | string;
  threadId?: number;
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
  const { chatId, threadId, text, username, messageId, replyToMessage, botUsername, userId } = ctx;
  const cleanText = (text || '').trim();
  const lower = cleanText.toLowerCase();

  // Проверка прав топика (только чтение / разрешено писать / заблокировано)
  const topicPerms = checkTopicPermissions(chatId, threadId);
  if (!topicPerms.canRead) {
    return { handled: false };
  }

  const command = parseLittlepipCommand(cleanText);
  const conversationHistory = getRecentLittlepipMessages(chatId, threadId);
  if (!command) rememberConversationMessage(chatId, threadId, username, cleanText);

  // Обновление репутации игрока (запоминает поведение даже в read-only топиках)
  evaluateMessageReputation(
    userId,
    username,
    cleanText,
    Boolean(ctx.isSenderAdmin),
    Boolean(ctx.isSenderOwner)
  );

  // Если топик настроен как "ТОЛЬКО ЧТЕНИЕ" (read_only) — Пипка запоминает, но НИКОГДА туда не пишет!
  if (!topicPerms.canWrite) {
    return { handled: true, action: 'chat_reply', replyText: '' };
  }

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

  // 1. КОМАНДА /pip_rep — Досье репутации игрока
  if (command && ['pip_rep', 'rep', 'my_rep'].includes(command)) {
    const repReport = generateReputationReport(userId, username);
    await sendMessageFn(chatId, repReport, sendOpts);
    return { handled: true, replyText: repReport };
  }

  // 2. КОМАНДА /pip_top — Доска почета и розыска
  if (command && ['pip_top', 'top_rep', 'pip_leaderboard'].includes(command)) {
    const topReport = getReputationLeaderboard();
    await sendMessageFn(chatId, topReport, sendOpts);
    return { handled: true, replyText: topReport };
  }

  // 3. КОМАНДА /pip_joke — Байка пустоши
  if (command && ['pip_joke', 'joke', 'pip_anecdote', 'anecdote'].includes(command)) {
    const jokeText = `😄 **Байка от Литлпип:**\n\n${getRandomAnecdote()}`;
    await sendMessageFn(chatId, jokeText, sendOpts);
    return { handled: true, replyText: jokeText };
  }

  // 4. КОМАНДА /pip_start
  if (command && ['pip_start', 'littlepip', 'ai_start', 'pip'].includes(command)) {
    bindTopic(chatId, threadId, 'chat', username);
    const greeting = `👋 **Хэээй! Литлпип на связи!** 🦄✨\n\n` +
      `Я подключилась к эфиру${threadId ? ' (в этой вкладке/топике)' : ''}. Готова к разговорам, байкам и вылазкам по Пустоши!\n\n` +
      `💡 **Новые фичи:**\n` +
      `• Моя память и отношение к тебе: \`/pip_rep\`\n` +
      `• Доска любимчиков и розыска: \`/pip_top\`\n` +
      `• Сталкерские байки: \`/pip_joke\`\n\n` +
      `Зови меня по имени (*Пипка, Литлпип, Литка*) или отвечай на мои сообщения. Чтобы отключить: \`/stop\`. До связи!`;

    await sendMessageFn(chatId, greeting, sendOpts);
    return { handled: true, replyText: greeting, action: 'started_chat' };
  }

  // 5. КОМАНДА /support
  if (command && ['support', 'pip_support'].includes(command)) {
    bindTopic(chatId, threadId, 'support', username);
    const supportText = `🛠️ **Режим техподдержки активирован!**\n\n` +
      `Беру отвёртку в зубы и подключаю Pip-Buck к серверу Даст Таун. Задавай вопросы по коду, деплою, структуре файлов или ошибкам!`;

    await sendMessageFn(chatId, supportText, sendOpts);
    return { handled: true, replyText: supportText, action: 'started_support' };
  }

  // 6. КОМАНДА /pip_bind
  if (command && ['pip_bind', 'bind'].includes(command)) {
    const mode: AgentMode = lower.includes('support') ? 'support' : 'chat';
    bindTopic(chatId, threadId, mode, username);
    const bindText = `📌 **Литлпип привязана к этой вкладке!**\n\n` +
      `• Режим: **${mode === 'support' ? 'Техподдержка 🛠️' : 'Диалог 💬'}**\n` +
      `Отвечаю на упоминания (*Пипка, Литлпип*) и реплики в этой теме. Отключить: \`/stop\`.`;

    await sendMessageFn(chatId, bindText, sendOpts);
    return { handled: true, replyText: bindText, action: 'bound' };
  }

  // 7. КОМАНДА /stop
  if (command && ['stop', 'pip_stop', 'ai_stop'].includes(command)) {
    unbindTopic(chatId, threadId);
    const stopText = `📻 **Ухожу на радиомолчание!**\n\nPip-Buck переведён в дежурный спящий режим. Если понадоблюсь — зови по имени или командуй \`/pip_start\`. До связи на Пустошах! 🦄✨`;

    await sendMessageFn(chatId, stopText, sendOpts);
    return { handled: true, replyText: stopText, action: 'stopped' };
  }

  // 8. КОМАНДА /pip_status
  if (command === 'pip_status') {
    const binding = getBinding(chatId, threadId);
    const statusText = `📊 **Статус Литлпип:**\n\n` +
      `• Активность: ${binding?.isActive ? '🟢 В сети и слушает эфир' : '⚪ В спящем режиме'}\n` +
      `• Режим: **${binding?.mode === 'support' ? 'Техподдержка 🛠️' : 'Диалог 💬'}**\n` +
      `• ИИ-модель: \`${process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ? LITTLEPIP_GEMINI_MODEL : 'встроенный сталкерский режим'}\`\n` +
      `• Досье Fandom: [Открыть статью о Литлпип](${LITTLEPIP_FANDOM_PAGE_URL})\n` +
      `• Твоя репутация: \`/pip_rep\``;

    await sendMessageFn(chatId, statusText, sendOpts);
    return { handled: true, replyText: statusText };
  }

  if (command) return { handled: false };

  // 9. ПРОВЕРКА ОБРАЩЕНИЯ К ЛИТЛПИП
  const binding = getBinding(chatId, threadId);
  const isMentioned = hasPipMention(cleanText);
  const isReplyToMe = Boolean(
    replyToMessage && (
      (botUsername && replyToMessage.from?.username?.toLowerCase() === botUsername.toLowerCase()) ||
      replyToMessage.from?.is_bot
    )
  );

  if (!isMentioned && !isReplyToMe) return { handled: false };

  // 10. ГЕНЕРАЦИЯ ОТВЕТА
  const activeMode: AgentMode = binding?.mode || (lower.includes('ошибк') || lower.includes('помоги') || lower.includes('код') ? 'support' : 'chat');

  if (binding) {
    binding.lastInteractionAt = new Date().toISOString();
    saveState(agentState);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let availableMemes: LittlepipMeme[] = [];
  const bindingKey = getBindingKey(chatId, threadId);
  const canSendMeme = Date.now() - (lastMemeSentAt.get(bindingKey) || 0) >= LITTLEPIP_MEME_COOLDOWN_MS;
  if (apiKey && activeMode === 'chat' && canSendMeme) {
    try {
      availableMemes = await getLittlepipMemeCatalog(apiKey);
    } catch (error) {
      console.warn('[Littlepip Memes] Каталог мемов временно недоступен:', error);
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
    availableMemes,
    userId
  );
  const { cleanText: finalReply, meme } = extractLittlepipMemeTag(generatedReply, availableMemes);

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
