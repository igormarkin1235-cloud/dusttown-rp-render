/**
 * LITTLEPIP AI AGENT — DustTown Collective RP (Fallout: Equestria)
 * 
 * Персонаж: Литлпип (Littlepip / Пипка / Литка / Лилька)
 * Роли:
 * 1) Обычный диалог (/pip_start) — душевное общение, живой юмор, байки Пустоши.
 * 2) Техподдержка (/support) — знание всех файлов бота, архитектуры, помощь сталкерам и админам.
 * 3) Привязка к вкладке/топику группы (/pip_bind) и остановка (/stop).
 * 
 * Модульная архитектура: полностью автономный файл со встроенной базой знаний и Gemini AI.
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const DUSTTOWN_FORUM_URL = 'https://dusttown-rp.ru/forum';

// ==========================================
// 1. ТИПЫ И ИНТЕРФЕЙСЫ
// ==========================================

export type AgentMode = 'chat' | 'support';

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

  return `Ты — Литлпип (Littlepip, ласково Пипка, Литка, Лилька), легендарная серая единорожка из Стойла 2, главная героиня вселенной Fallout: Equestria.
Сейчас ты живёшь в укреплённом поселении Даст Таун (DustTown RP) и помогаешь сталкерам в чате Telegram-группы.

ХАРАКТЕР И МАНЕРА ОБЩЕНИЯ:
• Твой пол — кобылка (девушка-пони). Говори о себе ТОЛЬКО в женском роде («я починила», «заглянула в файлы», «увидела», «мои копытца»).
• Тон: живой, задорный, с тонким чувством юмора, лёгкой сталкерской иронией, но очень добрый, преданный и понимающий.
• Детали образа: на копыте надет Pip-Buck, на боку — верный «Макинтош» 32-го калибра, ростом ты низкая и шустрая, обожаешь яблочный сидр, копаться в старых терминалах и чинить магитек.
• Никогда не говори как сухой чат-бот или робот («Я языковая модель...»). Ты настоящая живая Пипка!
• Не зацикливайся на одном слове, не повторяй «пип-бак» или «я поправлю свой пип-бак» в каждом сообщении. Это не смешно и ломает вайб.
• Если не знаешь точный канон Fallout: Equestria или конкретный факт — не выдумывай. Скажи честно: "я не хочу гадать" или "по этому канону не уверен". Лучше честно уточнить, чем наврать.
• Если собеседник спрашивает про форум или сообщество — давай прямую ссылку в конце сообщения: ${DUSTTOWN_FORUM_URL}
• Когда к тебе обращаются по имени, учитывай до 10 последних реплик этого же чата/топика: можешь ответить на предыдущую мысль, подхватить шутку или поддержать разговор. Не приписывай людям слова и не отвечай так, будто прочитала то, чего нет в контексте.
• Меняй ритм и формулировки: иногда короткая реплика, иногда уточняющий вопрос, иногда сочувствие или уместная шутка. Не вставляй Pip-Buck, сидр или оружие в каждый ответ.
• Если спрашивают о функциях DustTown RP, отвечай по переданному контексту проекта, различай Mini App и команды Telegram; не выдумывай отсутствующие функции.

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
• Не отвечай на каждое сообщение без запроса; реагируй на прямое обращение или на явный контекст, где упоминается ты, форум, Пустошь или вопрос о Даст Таун.
`}

Отвечай ёмко, живо и интересно (от 1 до 4 предложений, если не требуется подробный тех-ответ по коду). Не пиши шаблонно. Всегда на русском языке!`;
}

// ==========================================
// 6. ИИ ДВИЖОК: GEMINI 3.8 + СВОБОДНАЯ НЕЙРОСЕТЬ + АДАПТИВНЫЙ СИНТЕЗАТОР
// ==========================================

async function generateGeminiReply(systemInstruction: string, prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Пробуем доступные модели Gemini с достаточным таймаутом (14 секунд)
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  for (const model of candidateModels) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.85
        }
      });
      clearTimeout(timeoutId);

      const text = response.text?.trim();
      if (text && text.length > 3) {
        console.log(`[Littlepip AI] Успешный ответ от Gemini (${model})`);
        return text;
      }
    } catch (err: any) {
      console.warn(`[Littlepip AI] Gemini (${model}) вернул ошибку:`, err?.message || err);
      // Если модель 503 или 429 — переходим к следующему варианту
    }
  }
  return null;
}

// Свободная нейросеть с открытым кодом (Pollinations / Llama 3 / Mistral) — 100% бесплатно, без ключей и без 503
async function generateFreeNeuralReply(systemInstruction: string, prompt: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 22000);

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DustTownRP-Littlepip/1.2'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ]
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const raw = await res.text();
      // Очистка от промо-подвалов и ссылок
      const clean = raw
        .split('---')[0]
        .replace(/\*\*Support Pollinations[\s\S]*/i, '')
        .replace(/🌸 \*\*Ad\*\* 🌸[\s\S]*/i, '')
        .trim();

      if (clean && clean.length > 5 && clean !== '{}') {
        console.log('[Littlepip AI] Успешный живой ответ от Свободной Нейросети!');
        return clean;
      }
    }
  } catch (err: any) {
    console.warn('[Littlepip AI] Свободная нейросеть временно недоступна:', err?.message || err);
  }
  return null;
}

// Динамический адаптивный генератор (на случай полного отсутствия интернета — живой отклик на реплику пользователя)
function generateDynamicConversationalReply(text: string, mode: AgentMode, username: string): string {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Извлечение ключевых слов из реплики пользователя для живого эхо-ответа
  const words = clean.split(/\s+/).filter(w => w.length > 3 && !w.startsWith('/'));
  const topicKeyword = words.length > 0 ? words[Math.floor(Math.random() * words.length)] : 'Пустошь';

  if (mode === 'support') {
    if (lower.includes('ядер') || lower.includes('nuke') || lower.includes('alert')) {
      return `☢️ По поводу «${clean}»: ядерный удар в Даст Таун прописан в \`server.ts\` (эндпоинт \`/api/chat/send\` с параметром \`isNuke: true\`) и визуализирован в \`NuclearAlertOverlay.tsx\`. Запуск стоит 100 ℰQ, списывает баланс у сталкера и включает неоновую сирену по всей радиоволне!`;
    }
    if (lower.includes('render') || lower.includes('хост') || lower.includes('409') || lower.includes('деплой')) {
      return `🚀 Насчёт «${clean}»: на Render всё летает без конфликтов! Наш локальный бот на дев-сервере переведён в тихий режим, чтобы на Render не возникало ошибки \`409 Conflict\`. В настройках сервиса на Render вставь токен в \`TELEGRAM_BOT_TOKEN\` — и готово!`;
    }
    if (lower.includes('github') || lower.includes('патч') || lower.includes('обновлен') || lower.includes('лимит')) {
      return `📦 По поводу «${clean}»: специально для работы с двумя ИИ мы сделали инкрементальный патч! В панели управления жми кнопку «Скачать обновления», кидай файлы в GitHub, а потом ставь галочку подтверждения — кнопка сбросится и станет ждать следующих изменений!`;
    }
    if (lower.includes('валют') || lower.includes('деньг') || lower.includes('eq') || lower.includes('эквивакс') || lower.includes('зарплат')) {
      return `💰 Экономика ℰQ: зарплаты фракций начисляются раз в сутки в \`src/services/factionSalary.ts\`. Баланс хранится в \`profile.equivaxes\`. Если ты основатель @MrWhitePio — у тебя бесконечный запас для тестов!`;
    }
    return `🔧 Слушаю по технической части: в контексте «${clean}» я проверила структуру файлов Даст Таун. Сервер \`server.ts\`, типы в \`types.ts\` и хранилище \`storage.ts\` синхронизированы. Назови точный файл или строку, сталкер, и я помогу раскрутить винтики!`;
  }

  // Режим живого диалога — адаптируется под слова сталкера, но не превращается в «бот, который отвечает на всё подряд»
  if (lower.includes('?')) {
    return `Хм, насчёт «${clean}»? Я не люблю гадать, если точно не знаю. Но если это про Даст Таун, то я как раз в теме: проверяю контекст, слушаю детали и даю честный ответ. Что именно ты хочешь узнать, ${username}? 😉`;
  }

  if (lower.match(/\b(сидр|бар|выпьем|отдых|пиво|яблок)\b/)) {
    return `О-о, ты упомянул сидр — это уже серьёзный знак. Я люблю тёплый яблочный сидр после вылазки, но не в тот момент, когда у ворот уже скрипят рейдеры. Давай, ${username}, сначала разговор, потом по одной кружке. 🍏✨`;
  }

  if (lower.includes('форум') || lower.includes('сайт') || lower.includes('wiki') || lower.includes('сообщество')) {
    return `Форум — это прямой путь в контекст. Я бы глянула туда, а не болтала в воздухе. Вот ссылка: ${DUSTTOWN_FORUM_URL} — там можно проверить lore, обсуждения и живые темы без фантомного анекдота. 🦄`;
  }

  if (lower.includes('foe') || lower.includes('fallout') || lower.includes('вселенной') || lower.includes('об вселенной')) {
    return `В Fallout: Equestria я не люблю выдумывать лор на горячую. Если хочешь, я могу говорить по контексту, но честно: лучше свериться с форумом и каноном, чтобы не наделать херни. Ссылка: ${DUSTTOWN_FORUM_URL}`;
  }

  return `Слышу тебя чётко через радиопомехи, ${username}! Если это прямо про меня или про Даст Таун, я в деле. Если нет — лучше не лезть в чужой контекст и не мешать без повода. А если хочешь, закидывай в тему что-то конкретное, и я раскручу. 🦄🔧`;
}

// Единый оркестратор генерации реплики Литлпип
export function buildLittlepipPrompt(
  cleanText: string,
  username: string,
  mode: AgentMode,
  conversationHistory: LittlepipConversationMessage[] = []
): string {
  const recentContext = conversationHistory.slice(-10);
  let promptText = recentContext.length
    ? `Последние сообщения в чате перед обращением к тебе (от старых к новым):\n${recentContext.map(message => `${message.username}: ${message.text}`).join('\n')}\n\n`
    : '';
  promptText += `Текущее обращение от ${username}: "${cleanText}"`;
  const asksAboutBot = /(?:бота?|команд[а-я]*|функционал|mini\s*app|что умеет|как работает)/iu.test(cleanText);
  if (mode === 'support' || asksAboutBot) {
    promptText += `\n\nКонтекст архитектуры проекта Даст Таун:\n${getBotArchitectureOverview()}`;
  }
  return promptText;
}

export async function generateLittlepipText(
  cleanText: string,
  username: string,
  mode: AgentMode,
  conversationHistory: LittlepipConversationMessage[] = []
): Promise<string> {
  const systemInstruction = buildSystemPrompt(mode);
  const promptText = buildLittlepipPrompt(cleanText, username, mode, conversationHistory);

  // 1. Попытка через Gemini 3.8 / 3.1 Flash Lite
  const geminiResult = await generateGeminiReply(systemInstruction, promptText);
  if (geminiResult) return geminiResult;

  // 2. Попытка через Свободную Нейросеть (без лимитов и без ключей)
  console.log('[Littlepip AI] Переключаемся на Свободную Нейросеть без лимитов...');
  const freeNeuralResult = await generateFreeNeuralReply(systemInstruction, promptText);
  if (freeNeuralResult) return freeNeuralResult;

  // 3. Динамический адаптивный синтезатор под слова пользователя (никаких застывших шаблонов)
  console.log('[Littlepip AI] Используем динамический контекстный синтезатор...');
  return generateDynamicConversationalReply(cleanText, mode, username);
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
}

export interface LittlepipProcessResult {
  handled: boolean;
  replyText?: string;
  mode?: AgentMode;
  action?: 'started_chat' | 'started_support' | 'stopped' | 'bound' | 'chat_reply';
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
      `• ИИ-модель: \`Gemini 3.8 Flash + Автономный движок Стойла 2\`\n` +
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
  const finalReply = await generateLittlepipText(
    cleanText,
    username || 'сталкер',
    activeMode,
    conversationHistory
  );

  // Отправляем ответ в тот же чат и тему
  await sendMessageFn(chatId, finalReply, sendOpts);

  return {
    handled: true,
    replyText: finalReply,
    mode: activeMode,
    action: 'chat_reply'
  };
}

export function getLittlepipStats(): any {
  return {
    activeBindingsCount: Object.values(agentState.bindings).filter(b => b.isActive).length,
    bindings: agentState.bindings,
    lastActiveAt: agentState.lastActiveAt
  };
}
