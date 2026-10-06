/**
 * BLACKJACK CONFIG & TOPIC PERMISSIONS
 * 
 * Настройки Telegram топиков, прав и токена бота Блэкджек.
 */

import fs from 'fs';
import path from 'path';

export type BlackjackTopicPermission = 'read_write' | 'read_only' | 'blocked';

export interface BlackjackTopicItem {
  threadId: string;
  title: string;
  permission: BlackjackTopicPermission;
  link?: string;
  notes?: string;
  enabled?: boolean;
}

export interface BlackjackConfigData {
  telegramBotToken: string;
  allowedTopicIds: string[];    // Topics where Blackjack can actively talk and moderate
  readOnlyTopicIds: string[];   // Topics where Blackjack only logs/observes
  forbiddenTopicIds: string[];  // Topics completely forbidden for Blackjack
  topics?: Record<string, BlackjackTopicItem>; // Structured topics mapping
  adminUsernames: string[];     // Usernames of authorized admins (@MrWhitePio, etc.)
  defaultMuteDurationMinutes: number; // Default 10 min
  antiLoopProtection: boolean;  // Strict one-shot trigger with Littlepip
  lastInterBotTriggerTimestamp?: number;
}

const CONFIG_FILE = path.resolve(process.cwd(), '.blackjack_config.json');

const DEFAULT_CONFIG: BlackjackConfigData = {
  telegramBotToken: process.env.BLACKJACK_TELEGRAM_BOT_TOKEN || '8818102467:AAGCBUGpBf2_pTwBhogsG-5Wt3mujzlgNjE',
  allowedTopicIds: ['general', 'main', 'moderation', 'all', 'root'],
  readOnlyTopicIds: ['rules', 'lore'],
  forbiddenTopicIds: ['private_staff', 'archive'],
  topics: {
    'root': {
      threadId: 'root',
      title: 'Основной чат (Главная ветка)',
      permission: 'read_write',
      enabled: true,
      notes: 'Главный чат сообщества Даст Таун'
    },
    'rules': {
      threadId: 'rules',
      title: 'Правила и Законы Даст Тауна',
      permission: 'read_only',
      enabled: true,
      notes: 'Только чтение: Блэкджек запоминает правила и следит за порядком, но не спамит'
    },
    'moderation': {
      threadId: 'moderation',
      title: 'Штаб СБ Стойла 99',
      permission: 'read_write',
      enabled: true,
      notes: 'Оперативная работа и исполнение наказаний'
    }
  },
  adminUsernames: ['@MrWhitePio', '@mrwhitepio', 'MrWhitePio', 'whitepio', 'mrwhite', 'WhitePio'],
  defaultMuteDurationMinutes: 10,
  antiLoopProtection: true
};

export function loadBlackjackConfig(): BlackjackConfigData {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        topics: {
          ...DEFAULT_CONFIG.topics,
          ...(parsed.topics || {})
        }
      };
    }
  } catch (err) {
    console.warn('Could not read .blackjack_config.json:', err);
  }
  return DEFAULT_CONFIG;
}

export function saveBlackjackConfig(cfg: BlackjackConfigData): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save .blackjack_config.json:', err);
  }
}

/**
 * Распарсить ссылку на топик Telegram вида:
 * - https://t.me/c/2149182371/42
 * - https://t.me/c/2149182371/42/100
 * - https://t.me/chat_name/42
 * - t.me/c/12345/42
 * - "42", "root"
 */
export function parseBlackjackTopicLink(input: string): { threadId: string; rawUrl?: string } | null {
  if (!input) return null;
  const trimmed = input.trim();
  const cleanId = trimmed.replace(/^#/, '');
  if (/^\d+$/.test(cleanId)) {
    return { threadId: cleanId, rawUrl: trimmed };
  }
  if (['root', 'main', 'general'].includes(trimmed.toLowerCase())) {
    return { threadId: 'root', rawUrl: trimmed };
  }
  const matchQuery = trimmed.match(/[?&](?:topic|thread|thread_id|message_thread_id)=(\d+)/i);
  if (matchQuery?.[1]) {
    return { threadId: matchQuery[1], rawUrl: trimmed };
  }
  const matchPrivate = trimmed.match(/t\.me\/c\/\d+\/(\d+)/i);
  if (matchPrivate?.[1]) {
    return { threadId: matchPrivate[1], rawUrl: trimmed };
  }
  const matchPublic = trimmed.match(/t\.me\/[a-zA-Z0-9_]+\/(\d+)/i);
  if (matchPublic?.[1]) {
    return { threadId: matchPublic[1], rawUrl: trimmed };
  }
  return null;
}

/**
 * Добавить или обновить топик для Блэкджек по ссылке или ID
 */
export function setBlackjackTopic(
  inputLinkOrId: string,
  permission: BlackjackTopicPermission = 'read_write',
  title?: string,
  notes?: string
): { success: boolean; topic?: BlackjackTopicItem; config: BlackjackConfigData; error?: string } {
  const parsed = parseBlackjackTopicLink(inputLinkOrId);
  if (!parsed) {
    return { success: false, error: 'Неверный формат ссылки на топик или ID', config: loadBlackjackConfig() };
  }

  const threadId = parsed.threadId;
  const cfg = loadBlackjackConfig();
  cfg.topics = cfg.topics || {};

  const existing = cfg.topics[threadId];
  const item: BlackjackTopicItem = {
    threadId,
    title: title || existing?.title || (threadId === 'root' ? 'Главная ветка' : `Топик #${threadId}`),
    permission,
    link: parsed.rawUrl || existing?.link,
    notes: notes || existing?.notes || (permission === 'read_only' ? 'Только чтение: сбор фактов в память' : 'Активный диалог'),
    enabled: true
  };

  cfg.topics[threadId] = item;

  // Синхронизация с legacy массивами
  cfg.allowedTopicIds = cfg.allowedTopicIds.filter(id => id.toLowerCase() !== threadId.toLowerCase());
  cfg.readOnlyTopicIds = cfg.readOnlyTopicIds.filter(id => id.toLowerCase() !== threadId.toLowerCase());
  cfg.forbiddenTopicIds = cfg.forbiddenTopicIds.filter(id => id.toLowerCase() !== threadId.toLowerCase());

  if (permission === 'read_write') {
    cfg.allowedTopicIds.push(threadId);
  } else if (permission === 'read_only') {
    cfg.readOnlyTopicIds.push(threadId);
  } else if (permission === 'blocked') {
    cfg.forbiddenTopicIds.push(threadId);
  }

  saveBlackjackConfig(cfg);
  return { success: true, topic: item, config: cfg };
}

export function removeBlackjackTopic(threadId: string): BlackjackConfigData {
  const cfg = loadBlackjackConfig();
  const cleanId = threadId.toLowerCase();
  if (cfg.topics && cfg.topics[cleanId]) {
    delete cfg.topics[cleanId];
  }
  cfg.allowedTopicIds = cfg.allowedTopicIds.filter(id => id.toLowerCase() !== cleanId);
  cfg.readOnlyTopicIds = cfg.readOnlyTopicIds.filter(id => id.toLowerCase() !== cleanId);
  cfg.forbiddenTopicIds = cfg.forbiddenTopicIds.filter(id => id.toLowerCase() !== cleanId);
  saveBlackjackConfig(cfg);
  return cfg;
}

/**
 * Checks if Blackjack has permission to interact in a given Telegram Topic / Thread
 */
export function checkBlackjackTopicPermission(topicId?: string | number | null): {
  canReply: boolean;
  canObserve: boolean;
  reason?: string;
  topicTitle?: string;
  permission?: BlackjackTopicPermission;
} {
  if (!topicId) {
    return { canReply: true, canObserve: true, permission: 'read_write', topicTitle: 'Главная ветка' };
  }

  const topicStr = String(topicId).toLowerCase();
  const cfg = loadBlackjackConfig();

  if (cfg.topics && cfg.topics[topicStr]) {
    const t = cfg.topics[topicStr];
    if (t.permission === 'blocked' || t.enabled === false) {
      return {
        canReply: false,
        canObserve: false,
        reason: 'Этот топик помечен как запретная зона для Блэкджек.',
        topicTitle: t.title,
        permission: 'blocked'
      };
    }
    if (t.permission === 'read_only') {
      return {
        canReply: false,
        canObserve: true,
        reason: 'В этом топике Блэкджек находится в режиме скрытого наблюдения (Read-Only). Данные сохраняются в память.',
        topicTitle: t.title,
        permission: 'read_only'
      };
    }
    return {
      canReply: true,
      canObserve: true,
      topicTitle: t.title,
      permission: 'read_write'
    };
  }

  if (cfg.forbiddenTopicIds.some(id => id.toLowerCase() === topicStr)) {
    return {
      canReply: false,
      canObserve: false,
      reason: 'Этот топик помечен как запретная зона для Блэкджек.',
      permission: 'blocked'
    };
  }

  if (cfg.readOnlyTopicIds.some(id => id.toLowerCase() === topicStr)) {
    return {
      canReply: false,
      canObserve: true,
      reason: 'В этом топике Блэкджек находится в режиме скрытого наблюдения (Read-Only).',
      permission: 'read_only'
    };
  }

  return { canReply: true, canObserve: true, permission: 'read_write' };
}

/**
 * Checks if a user is an authorized admin for issuing moderation commands to Blackjack
 */
export function isAuthorizedBlackjackAdmin(usernameOrId?: string | number, dynamicAdmins?: string[]): boolean {
  if (!usernameOrId) return false;
  const raw = String(usernameOrId).trim();
  const clean = raw.toLowerCase().replace(/^@/, '');
  const cfg = loadBlackjackConfig();
  if (cfg.adminUsernames.some(adm => {
    const cAdm = adm.toLowerCase().replace(/^@/, '');
    return cAdm === clean || adm === raw;
  })) return true;
  if (dynamicAdmins && dynamicAdmins.some(adm => {
    const cAdm = adm.toLowerCase().replace(/^@/, '');
    return cAdm === clean || adm === raw;
  })) return true;
  return false;
}
