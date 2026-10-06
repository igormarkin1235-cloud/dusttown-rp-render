/**
 * Telegram Polling Worker & Bot Service for Blackjack (Блэкджек)
 * Handles updates from Telegram @Bleckjek_bot, enforces moderation, and talks in character.
 */

import {
  loadBlackjackConfig,
  checkBlackjackTopicPermission,
  setBlackjackTopic,
  parseBlackjackTopicLink,
  isAuthorizedBlackjackAdmin
} from './blackjackConfig';
import { handleBlackjackMessage, hasBlackjackMention, isModerationCommand } from './blackjackAgent';
import { executeTelegramModerationAction } from './blackjackModeration';
import {
  rememberBlackjackObservation,
  getBlackjackMemory,
  BlackjackObservationItem
} from './blackjackMemory';

export interface BlackjackBotLog {
  id: string;
  time: string;
  type: 'info' | 'message' | 'action' | 'error';
  text: string;
}

// In-memory cache for chat administrators and username -> numeric ID resolution
const blackjackChatAdminsCache = new Map<string, { admins: any[]; cachedAt: number }>();
const telegramUserMap = new Map<string, number>();

export function cacheTelegramUser(username: string | undefined, id: number) {
  if (id) {
    telegramUserMap.set(String(id), id);
    if (username) {
      const clean = username.toLowerCase().replace(/^@/, '');
      telegramUserMap.set(clean, id);
      telegramUserMap.set(`@${clean}`, id);
    }
  }
}

export function resolveNumericTelegramId(tagOrId: string | number | undefined): number | undefined {
  if (!tagOrId) return undefined;
  if (typeof tagOrId === 'number') return tagOrId;
  const str = String(tagOrId).trim();
  const cleanId = str.replace(/^@id/, '').replace(/^id/, '');
  if (/^\d+$/.test(cleanId)) {
    return parseInt(cleanId, 10);
  }
  const cleanUsername = str.toLowerCase().replace(/^@/, '');
  return telegramUserMap.get(cleanUsername) || telegramUserMap.get(`@${cleanUsername}`);
}

export async function getBlackjackChatAdmins(chatId: number | string): Promise<any[]> {
  const key = String(chatId);
  const cached = blackjackChatAdminsCache.get(key);
  if (cached && Date.now() - cached.cachedAt < 10 * 60 * 1000) {
    return cached.admins;
  }

  try {
    const res = await tgBlackjackApi('getChatAdministrators', { chat_id: chatId });
    if (res && res.ok && Array.isArray(res.result)) {
      const admins = res.result.map((member: any) => ({
        userId: member.user.id,
        username: member.user.username ? `@${member.user.username}` : undefined,
        displayName: [member.user.first_name, member.user.last_name].filter(Boolean).join(' ') || 'Администратор',
        isOwner: member.status === 'creator',
        customTitle: member.custom_title
      }));
      blackjackChatAdminsCache.set(key, { admins, cachedAt: Date.now() });
      return admins;
    }
  } catch (err: any) {
    console.warn(`[Blackjack Admins] Could not load admins for chat ${key}:`, err.message);
  }
  return cached?.admins || [];
}

export async function isSenderTelegramAdmin(
  chatId: number | string,
  userId: number | string,
  username?: string,
  isPrivateChat = false
): Promise<boolean> {
  // 1. Static config / owner check
  if (isAuthorizedBlackjackAdmin(username || userId)) return true;
  if (isPrivateChat) return isAuthorizedBlackjackAdmin(username || userId);

  const cleanUser = username ? username.toLowerCase().replace(/^@/, '') : '';
  const uId = String(userId);

  // 2. Check cached/loaded admins
  const admins = await getBlackjackChatAdmins(chatId);
  const found = admins.find(a =>
    String(a.userId) === uId ||
    (a.username && a.username.toLowerCase().replace(/^@/, '') === cleanUser)
  );
  if (found) return true;

  // 3. Fallback: getChatMember direct call
  try {
    const res = await tgBlackjackApi('getChatMember', { chat_id: chatId, user_id: userId });
    if (res && res.ok && res.result) {
      const status = res.result.status;
      if (status === 'creator' || status === 'administrator') {
        const key = String(chatId);
        const existing = blackjackChatAdminsCache.get(key)?.admins || [];
        existing.push({
          userId,
          username: username ? (username.startsWith('@') ? username : `@${username}`) : undefined,
          displayName: res.result.user?.first_name || 'Администратор',
          isOwner: status === 'creator'
        });
        blackjackChatAdminsCache.set(key, { admins: existing, cachedAt: Date.now() });
        return true;
      }
    }
  } catch {
    // If Blackjack doesn't have permissions, test with Littlepip token
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const pipRes = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChatMember`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, user_id: userId })
        });
        const pipData = await pipRes.json();
        if (pipData && pipData.ok && (pipData.result?.status === 'creator' || pipData.result?.status === 'administrator')) {
          return true;
        }
      } catch {}
    }
  }

  return false;
}

let isBlackjackPolling = false;
let blackjackAbortController: AbortController | null = null;
let lastBlackjackError: string | null = null;
let blackjackBotInfo: any = {
  id: 8818102467,
  username: 'Bleckjek_bot',
  first_name: 'Блэкджек_Бот',
  is_bot: true
};
let lastUpdateId = 0;

const blackjackLogs: BlackjackBotLog[] = [
  {
    id: 'bj_init',
    time: new Date().toLocaleTimeString(),
    type: 'info',
    text: 'Служба безопасности Стойла 99: Модуль Блэкджек инициализирован'
  }
];

export function addBlackjackLog(type: 'info' | 'message' | 'action' | 'error', text: string) {
  blackjackLogs.unshift({
    id: Math.random().toString(36).substring(7),
    time: new Date().toLocaleTimeString(),
    type,
    text
  });
  if (blackjackLogs.length > 60) {
    blackjackLogs.pop();
  }
}

export function getBlackjackBotLogs(): BlackjackBotLog[] {
  return [...blackjackLogs];
}

export function getBlackjackBotStatus() {
  const cfg = loadBlackjackConfig();
  const token = cfg.telegramBotToken || process.env.BLACKJACK_TELEGRAM_BOT_TOKEN || '8818102467:AAGCBUGpBf2_pTwBhogsG-5Wt3mujzlgNjE';
  return {
    isPolling: isBlackjackPolling,
    botInfo: blackjackBotInfo,
    logs: blackjackLogs,
    lastError: lastBlackjackError,
    tokenConfigured: Boolean(token),
    tokenMasked: token ? `${token.substring(0, 10)}...${token.slice(-4)}` : 'Не задан',
    activeTopicIds: cfg.allowedTopicIds,
    readOnlyTopicIds: cfg.readOnlyTopicIds,
    forbiddenTopicIds: cfg.forbiddenTopicIds,
    adminUsernames: cfg.adminUsernames
  };
}

/**
 * Execute Telegram API call using Blackjack's bot token
 */
export async function tgBlackjackApi(method: string, body?: any) {
  const cfg = loadBlackjackConfig();
  const token = cfg.telegramBotToken || process.env.BLACKJACK_TELEGRAM_BOT_TOKEN || '8818102467:AAGCBUGpBf2_pTwBhogsG-5Wt3mujzlgNjE';
  if (!token) {
    throw new Error('Токен Telegram для Блэкджек не настроен');
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || `Telegram API error on ${method}`);
  }
  return data;
}

/**
 * Test connectivity with Telegram getMe
 */
export async function testBlackjackTelegramConnection() {
  try {
    const me = await tgBlackjackApi('getMe');
    if (me.ok && me.result) {
      blackjackBotInfo = me.result;
      lastBlackjackError = null;
      addBlackjackLog('info', `✅ Связь с Telegram подтверждена: @${me.result.username} (${me.result.first_name}) [ID: ${me.result.id}]`);
      return { success: true, botInfo: me.result };
    }
    return { success: false, error: 'Telegram вернул пустой результат' };
  } catch (err: any) {
    lastBlackjackError = err.message;
    addBlackjackLog('error', `❌ Ошибка проверки связи: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Start long-polling loop for Blackjack
 */
export async function startBlackjackPolling(options: { resolveUserId?: (username: string) => string | number | null } = {}) {
  if (isBlackjackPolling) {
    return { success: true, message: 'Бот Блэкджек уже активен и опрашивает Telegram' };
  }

  const conn = await testBlackjackTelegramConnection();
  if (!conn.success) {
    return { success: false, error: conn.error };
  }

  isBlackjackPolling = true;
  blackjackAbortController = new AbortController();
  addBlackjackLog('info', '🔫 Блэкджек вышла на дежурство в чатах (Long-Polling запущен)');

  // Background polling loop
  (async () => {
    while (isBlackjackPolling && blackjackAbortController && !blackjackAbortController.signal.aborted) {
      try {
        const cfg = loadBlackjackConfig();
        const token = cfg.telegramBotToken || process.env.BLACKJACK_TELEGRAM_BOT_TOKEN || '8818102467:AAGCBUGpBf2_pTwBhogsG-5Wt3mujzlgNjE';
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;

        const res = await fetch(url, { signal: blackjackAbortController.signal });
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = update.update_id;
            await processBlackjackUpdate(update, options.resolveUserId);
          }
        } else if (!data.ok) {
          lastBlackjackError = data.description || 'Polling error';
          addBlackjackLog('error', `Ошибка ответа Telegram: ${lastBlackjackError}`);
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          break;
        }
        lastBlackjackError = err.message;
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  })();

  return { success: true, message: 'Long-polling запущен', botInfo: blackjackBotInfo };
}

/**
 * Stop long-polling loop
 */
export function stopBlackjackPolling() {
  isBlackjackPolling = false;
  if (blackjackAbortController) {
    blackjackAbortController.abort();
    blackjackAbortController = null;
  }
  addBlackjackLog('info', '🛑 Блэкджек ушла на радиомолчание (дежурство приостановлено)');
  return { success: true, message: 'Polling остановлен' };
}

/**
 * Send reply using Blackjack Telegram bot token with automatic Markdown fallback
 */
export async function sendBlackjackReply(
  chatId: number | string,
  topicId: string | number | undefined,
  replyToMessageId: number | undefined,
  text: string
) {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown'
  };
  if (topicId && topicId !== 'root') {
    const threadNum = typeof topicId === 'number' ? topicId : parseInt(String(topicId), 10);
    if (!isNaN(threadNum) && threadNum > 0) {
      body.message_thread_id = threadNum;
    }
  }
  if (replyToMessageId) {
    body.reply_to_message_id = replyToMessageId;
  }

  try {
    return await tgBlackjackApi('sendMessage', body);
  } catch (err: any) {
    // If Telegram rejected Markdown formatting, retry immediately with plain text
    if (body.parse_mode) {
      delete body.parse_mode;
      try {
        return await tgBlackjackApi('sendMessage', body);
      } catch (err2: any) {
        addBlackjackLog('error', `Ошибка отправки ответа: ${err2.message}`);
        throw err2;
      }
    }
    throw err;
  }
}

/**
 * Process a single Telegram update for Blackjack
 */
async function processBlackjackUpdate(
  update: any,
  resolveUserId?: (username: string) => string | number | null
) {
  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const topicId = msg.is_topic_message ? String(msg.message_thread_id) : undefined;
  const user = msg.from;
  if (!user || user.is_bot) return;

  const text = (typeof msg.text === 'string' ? msg.text : msg.caption || '').trim();
  if (!text) return;

  const senderUsername = user.username ? `@${user.username}` : `@id${user.id}`;
  const senderDisplayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || senderUsername;

  // Topic validation
  const topicPerm = checkBlackjackTopicPermission(topicId);
  if (!topicPerm.canObserve) {
    return; // Forbidden topic
  }

  // Read-only topic: quietly observe and remember information into Blackjack persistent memory
  if (topicPerm.canObserve && !topicPerm.canReply) {
    rememberBlackjackObservation(
      topicId || 'root',
      topicPerm.topicTitle || (topicId ? `Топик #${topicId}` : 'Основная ветка'),
      senderUsername,
      text,
      user.id
    );
    return;
  }

  // 1. Команда настройки топика по ссылке: /bj_topic <ссылка_или_id> <read_only|read_write|blocked> [название]
  if (text.startsWith('/bj_topic') || text.startsWith('/bj_bind')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `⚙️ **Формат настройки топика Блэкджек по ссылке:**\n\`/bj_topic <ссылка на топик или ID> <read_only|read_write|blocked> [Название]\`\n\n• \`read_only\` — Только чтение (сохранение фактов в память)\n• \`read_write\` — Активный диалог и модерация (можно писать)\n• \`blocked\` — Запретная зона (полный игнор)\n\nПример: \`/bj_topic https://t.me/c/2149182371/42 read_only Сводки и правила\``);
      return;
    }
    const targetLinkOrId = parts[1];
    const rawMode = parts[2]?.toLowerCase() || 'read_write';
    const mode = ['read_only', 'read_write', 'blocked'].includes(rawMode) ? rawMode as any : 'read_write';
    const customTitle = parts.slice(3).join(' ') || (parts[2] && !['read_only', 'read_write', 'blocked'].includes(rawMode) ? parts.slice(2).join(' ') : undefined);
    const result = setBlackjackTopic(targetLinkOrId, mode, customTitle);
    if (result.success && result.topic) {
      const modeLabel = mode === 'read_only' ? '👁️ Только чтение (Запоминание в память)' : mode === 'blocked' ? '🚫 Запретная зона (Игнорировать)' : '💬 Активный диалог и модерация';
      await sendBlackjackReply(chatId, topicId, msg.message_id, `✅ **Топик Блэкджек настроен!**\n\n• **ID/Ветка:** #${result.topic.threadId}\n• **Название:** ${result.topic.title}\n• **Режим:** ${modeLabel}`);
    } else {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `❌ **Ошибка:** ${result.error || 'Не удалось распознать ссылку на топик'}`);
    }
    return;
  }

  // Шорткат: /bj_read <ссылка_или_id> [название] — быстро сделать топик «только чтение и память»
  if (text.startsWith('/bj_read')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `👁️ **Шорткат режима Только Чтение для Блэкджек:**\n\`/bj_read <ссылка на топик или ID> [Название]\`\n\nБлэкджек будет молча собирать сообщения из этой ветки в память.`);
      return;
    }
    const targetLinkOrId = parts[1];
    const customTitle = parts.slice(2).join(' ') || undefined;
    const result = setBlackjackTopic(targetLinkOrId, 'read_only', customTitle);
    if (result.success && result.topic) {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `👁️ **Топик #${result.topic.threadId} переведён в режим «Только чтение»!**\n\nБлэкджек молчит в эфире, а все факты и сообщения сохраняются в память Стойла 99.`);
    } else {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `❌ **Ошибка:** ${result.error || 'Не удалось распознать ссылку'}`);
    }
    return;
  }

  // Шорткат: /bj_write <ссылка_или_id> [название] — разрешить писать и общаться в топике
  if (text.startsWith('/bj_write')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `💬 **Шорткат активного режима для Блэкджек:**\n\`/bj_write <ссылка на топик или ID> [Название]\`\n\nБлэкджек будет активно отвечать и модерировать эту ветку.`);
      return;
    }
    const targetLinkOrId = parts[1];
    const customTitle = parts.slice(2).join(' ') || undefined;
    const result = setBlackjackTopic(targetLinkOrId, 'read_write', customTitle);
    if (result.success && result.topic) {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `💬 **Топик #${result.topic.threadId} переведён в режим «Активный диалог»!**\n\nБлэкджек отвечает на вопросы, реагирует на нарушения и общается.`);
    } else {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `❌ **Ошибка:** ${result.error || 'Не удалось распознать ссылку'}`);
    }
    return;
  }

  // Шорткат: /bj_block <ссылка_или_id>
  if (text.startsWith('/bj_block')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `🚫 **Шорткат блокировки топика:**\n\`/bj_block <ссылка на топик или ID>\``);
      return;
    }
    const targetLinkOrId = parts[1];
    const result = setBlackjackTopic(targetLinkOrId, 'blocked');
    if (result.success && result.topic) {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `🚫 **Топик #${result.topic.threadId} заблокирован!**\n\nБлэкджек полностью игнорирует эту ветку.`);
    } else {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `❌ **Ошибка:** ${result.error || 'Не удалось распознать ссылку'}`);
    }
    return;
  }

  // 2. Список топиков: /bj_topics
  if (text.startsWith('/bj_topics')) {
    const cfg = loadBlackjackConfig();
    const topicsList = Object.values(cfg.topics || {});
    if (topicsList.length === 0) {
      await sendBlackjackReply(chatId, topicId, msg.message_id, `📋 У Блэкджек пока нет отдельных настроек топиков (работает во всех доступных). Настроить: \`/bj_topic <ссылка> <режим>\``);
      return;
    }
    const lines = topicsList.map(t => {
      const icon = t.permission === 'read_only' ? '👁️ [Только чтение/Память]' : t.permission === 'blocked' ? '🚫 [Запретная зона]' : '💬 [Диалог и Модерация]';
      return `• **${t.title}** (#${t.threadId}): ${icon}`;
    });
    await sendBlackjackReply(chatId, topicId, msg.message_id, `📋 **Топики Блэкджек:**\n\n${lines.join('\n')}\n\nНастроить топик: \`/bj_topic <ссылка> <read_only|read_write|blocked>\``);
    return;
  }

  // Память шерифа: /bj_memory
  if (text.startsWith('/bj_memory')) {
    const mem = getBlackjackMemory();
    const obsCount = mem.observations.length;
    const rulesCount = mem.observations.filter((o: BlackjackObservationItem) => o.category === 'rule').length;
    const recent = mem.observations.slice(0, 5).map((o: BlackjackObservationItem) => `• [${o.topicTitle}] (${o.author}): ${o.content.slice(0, 80)}...`).join('\n');
    await sendBlackjackReply(chatId, topicId, msg.message_id, `🧠 **Досье и память Блэкджек:**\n\n• Всего записей в памяти: **${obsCount}**\n• Зафиксировано правил: **${rulesCount}**\n• Последние наблюдения:\n${recent || 'Записей пока нет.'}`);
    return;
  }

  // Check if addressed to Blackjack
  const isDirect = msg.chat.type === 'private';
  const isReplyToBlackjack = Boolean(
    msg.reply_to_message?.from?.id === blackjackBotInfo?.id ||
    msg.reply_to_message?.from?.username?.toLowerCase() === 'bleckjek_bot' ||
    msg.reply_to_message?.from?.username?.toLowerCase() === 'blackjack_bot' ||
    msg.reply_to_message?.from?.first_name?.toLowerCase().includes('блэкджек')
  );
  const isMentioned = hasBlackjackMention(text) || isModerationCommand(text);
  const isPipAlert = text.includes('🚨 @Blackjack') || text.includes('🚨 @Bleckjek_bot');

  if (!isDirect && !isReplyToBlackjack && !isMentioned && !isPipAlert) {
    return;
  }

  cacheTelegramUser(user.username, user.id);
  if (msg.reply_to_message && msg.reply_to_message.from) {
    cacheTelegramUser(msg.reply_to_message.from.username, msg.reply_to_message.from.id);
  }

  addBlackjackLog('message', `[${msg.chat.title || 'ЛС'}] ${senderUsername}: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`);

  // If this was a reply to another user in the chat, we have their exact numeric telegram ID!
  let replyTargetUserId: number | undefined;
  let replyTargetUsername: string | undefined;
  if (msg.reply_to_message && msg.reply_to_message.from && !msg.reply_to_message.from.is_bot) {
    replyTargetUserId = msg.reply_to_message.from.id;
    replyTargetUsername = msg.reply_to_message.from.username
      ? `@${msg.reply_to_message.from.username}`
      : `@id${msg.reply_to_message.from.id}`;
  }

  const isGroup = (typeof chatId === 'number' && chatId < 0) || String(chatId).startsWith('-');
  const chatAdmins = isGroup ? await getBlackjackChatAdmins(chatId) : [];
  const adminTags = chatAdmins.map(a => a.username).filter(Boolean) as string[];

  // Comprehensive Admin Check
  const isSenderAdmin = await isSenderTelegramAdmin(chatId, user.id, user.username, isDirect);

  // Handle message
  try {
    const result = await handleBlackjackMessage({
      text,
      senderUsername,
      senderDisplayName,
      senderId: String(user.id),
      isSenderAdmin,
      chatId,
      topicId,
      adminsList: adminTags,
      replyTargetUserId,
      replyTargetUsername
    });

    // If an action was taken (mute/ban/unmute), execute actual Telegram restriction if needed
    if (result.actionTaken && ['mute', 'unmute', 'ban', 'unban'].includes(result.actionTaken)) {
      addBlackjackLog('action', `⚡ Действие: ${result.actionTaken.toUpperCase()} от ${senderUsername}`);

      // Attempt to resolve target numeric user ID
      const targetTag = (result as any).moderationRecord?.targetUser || replyTargetUsername || '';
      let targetNumericId = replyTargetUserId || resolveNumericTelegramId(targetTag);

      if (!targetNumericId && targetTag && resolveUserId) {
        const resolved = resolveUserId(targetTag);
        if (resolved) {
          targetNumericId = typeof resolved === 'number' ? resolved : parseInt(String(resolved).replace(/\D/g, ''), 10);
        }
      }

      if (targetNumericId && !isNaN(targetNumericId)) {
        const duration = (result as any).moderationRecord?.durationMinutes || 10;
        const untilDate = Date.now() + duration * 60 * 1000;
        executeTelegramModerationAction(
          chatId,
          targetNumericId,
          result.actionTaken as any,
          untilDate
        ).then(res => {
          if (res.success) {
            addBlackjackLog('action', `🔒 Telegram ${result.actionTaken} применён к ID ${targetNumericId}`);
          } else {
            addBlackjackLog('error', `Не удалось применить Telegram ограничение: ${res.error}`);
            sendBlackjackReply(chatId, topicId, msg.message_id, `⚠️ _Внимание: наказание внесено в журнал СБ, но Telegram отклонил системное ограничение (${res.error}). Проверьте, выданы ли боту права администратора на «Блокировку пользователей»._`).catch(() => {});
          }
        }).catch(() => {});
      } else {
        addBlackjackLog('error', `Не удалось определить числовой Telegram ID для ${targetTag}. Используйте ответ (reply) на сообщение нарушителя.`);
      }
    }

    // Send reply to Telegram
    if (result.replyText) {
      await sendBlackjackReply(chatId, topicId, msg.message_id, result.replyText);
    }
  } catch (err: any) {
    addBlackjackLog('error', `Ошибка обработки сообщения: ${err.message}`);
  }
}
