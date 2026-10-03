/**
 * Telegram Polling Worker & Bot Service for Blackjack (Блэкджек)
 * Handles updates from Telegram @Bleckjek_bot, enforces moderation, and talks in character.
 */

import { loadBlackjackConfig, checkBlackjackTopicPermission } from './blackjackConfig';
import { handleBlackjackMessage, hasBlackjackMention } from './blackjackAgent';
import { executeTelegramModerationAction } from './blackjackModeration';

export interface BlackjackBotLog {
  id: string;
  time: string;
  type: 'info' | 'message' | 'action' | 'error';
  text: string;
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

  // Check if addressed to Blackjack
  const isDirect = msg.chat.type === 'private';
  const isReplyToBlackjack = msg.reply_to_message?.from?.id === blackjackBotInfo?.id;
  const isMentioned = hasBlackjackMention(text);
  const isPipAlert = text.includes('🚨 @Blackjack') || text.includes('🚨 @Bleckjek_bot');

  if (!isDirect && !isReplyToBlackjack && !isMentioned && !isPipAlert) {
    return;
  }

  if (topicPerm.canObserve && !topicPerm.canReply) {
    // Read only topic: observe without replying
    return;
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

  // Handle message
  try {
    const result = await handleBlackjackMessage({
      text,
      senderUsername,
      senderDisplayName,
      chatId,
      topicId
    });

    // If an action was taken (mute/ban/unmute), execute actual Telegram restriction if needed
    if (result.actionTaken && ['mute', 'unmute', 'ban', 'unban'].includes(result.actionTaken)) {
      addBlackjackLog('action', `⚡ Действие: ${result.actionTaken.toUpperCase()} от ${senderUsername}`);

      // Attempt to resolve target numeric user ID
      let targetNumericId = replyTargetUserId;
      const targetTag = (result as any).moderationRecord?.targetUser || '';

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
            addBlackjackLog('action', `🔒 Telegram restrictChatMember применён к ID ${targetNumericId}`);
          } else {
            addBlackjackLog('error', `Не удалось применить Telegram ограничение: ${res.error}`);
          }
        }).catch(() => {});
      }
    }

    // Send reply to Telegram
    if (result.replyText) {
      const sendBody: any = {
        chat_id: chatId,
        text: result.replyText,
        parse_mode: 'Markdown'
      };
      if (topicId) {
        sendBody.message_thread_id = parseInt(topicId, 10);
      }
      await tgBlackjackApi('sendMessage', sendBody);
    }
  } catch (err: any) {
    addBlackjackLog('error', `Ошибка обработки сообщения: ${err.message}`);
  }
}
