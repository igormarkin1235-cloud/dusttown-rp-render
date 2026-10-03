/**
 * BLACKJACK CONFIG & TOPIC PERMISSIONS
 * 
 * Настройки Telegram топиков, прав и токена бота Блэкджек.
 */

import fs from 'fs';
import path from 'path';

export interface BlackjackConfigData {
  telegramBotToken: string;
  allowedTopicIds: string[];    // Topics where Blackjack can actively talk and moderate
  readOnlyTopicIds: string[];   // Topics where Blackjack only logs/observes
  forbiddenTopicIds: string[];  // Topics completely forbidden for Blackjack
  adminUsernames: string[];     // Usernames of authorized admins (@MrWhitePio, etc.)
  defaultMuteDurationMinutes: number; // Default 10 min
  antiLoopProtection: boolean;  // Strict one-shot trigger with Littlepip
  lastInterBotTriggerTimestamp?: number;
}

const CONFIG_FILE = path.resolve(process.cwd(), '.blackjack_config.json');

const DEFAULT_CONFIG: BlackjackConfigData = {
  telegramBotToken: process.env.BLACKJACK_TELEGRAM_BOT_TOKEN || '8818102467:AAGCBUGpBf2_pTwBhogsG-5Wt3mujzlgNjE',
  allowedTopicIds: ['general', 'main', 'moderation', 'all'],
  readOnlyTopicIds: [],
  forbiddenTopicIds: ['private_staff', 'archive'],
  adminUsernames: ['@MrWhitePio', '@mrwhitepio', 'MrWhitePio'],
  defaultMuteDurationMinutes: 10,
  antiLoopProtection: true
};

export function loadBlackjackConfig(): BlackjackConfigData {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
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
 * Checks if Blackjack has permission to interact in a given Telegram Topic / Thread
 */
export function checkBlackjackTopicPermission(topicId?: string | number | null): {
  canReply: boolean;
  canObserve: boolean;
  reason?: string;
} {
  if (!topicId) {
    return { canReply: true, canObserve: true };
  }

  const topicStr = String(topicId).toLowerCase();
  const cfg = loadBlackjackConfig();

  if (cfg.forbiddenTopicIds.some(id => id.toLowerCase() === topicStr)) {
    return {
      canReply: false,
      canObserve: false,
      reason: 'Этот топик помечен как запретная зона для Блэкджек.'
    };
  }

  if (cfg.readOnlyTopicIds.some(id => id.toLowerCase() === topicStr)) {
    return {
      canReply: false,
      canObserve: true,
      reason: 'В этом топике Блэкджек находится в режиме скрытого наблюдения (Read-Only).'
    };
  }

  return { canReply: true, canObserve: true };
}

/**
 * Checks if a user is an authorized admin for issuing moderation commands to Blackjack
 */
export function isAuthorizedBlackjackAdmin(usernameOrId?: string): boolean {
  if (!usernameOrId) return false;
  const clean = usernameOrId.trim().toLowerCase().replace(/^@/, '');
  const cfg = loadBlackjackConfig();
  return cfg.adminUsernames.some(adm => adm.toLowerCase().replace(/^@/, '') === clean);
}
