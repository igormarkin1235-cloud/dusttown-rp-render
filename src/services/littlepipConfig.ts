/**
 * LITTLEPIP CONFIG & TOPIC PERMISSION ENGINE
 * 
 * Управление гибкими настройками характера, модели, и правами топиков/вкладок Telegram-группы.
 */

import fs from 'fs';
import path from 'path';

export type TopicPermission = 'read_write' | 'read_only' | 'blocked';

export interface TelegramTopicConfig {
  threadId: number | string;
  title: string;
  permission: TopicPermission;
  enabled: boolean;
  notes?: string;
  chatId?: number | string;
  chatTitle?: string;
}

export interface DiscoveredTelegramTopic {
  chatId: number | string;
  chatTitle: string;
  threadId: number;
  title: string;
  lastSeenAt: string;
}

export interface LittlepipSettings {
  // Настройки характера
  boldnessLevel: 'moderate' | 'saucy' | 'hardcore'; // дерзость
  allowProfanity: boolean;                          // сочный мат к месту
  allowFlirting: boolean;                           // флирт
  flirtChanceAdmins: number;                        // % шанс флирта с админами (например, 35)
  flirtChanceRegular: number;                       // % шанс флирта с остальными (например, 10)
  useMemesAndQuotes: boolean;                       // вворачивать мемы и анекдоты
  empathySupport: boolean;                          // эмпатия и поддержка при хандре
  
  // ИИ Модель
  model: string;                                    // gemini-2.5-flash
  temperature: number;                              // 0.84

  // Вкладки (топики) супергруппы
  topics: Record<string, TelegramTopicConfig>;
}

const CONFIG_FILE = path.join(process.cwd(), '.littlepip_config.json');
const DISCOVERED_TOPICS_FILE = path.join(process.cwd(), '.littlepip_topics.json');
const MAX_DISCOVERED_TOPICS = 500;

const DEFAULT_CONFIG: LittlepipSettings = {
  boldnessLevel: 'saucy',
  allowProfanity: true,
  allowFlirting: true,
  flirtChanceAdmins: 35,
  flirtChanceRegular: 10,
  useMemesAndQuotes: true,
  empathySupport: true,
  model: 'gemini-2.5-flash',
  temperature: 0.84,
  topics: {
    'root': {
      threadId: 'root',
      title: 'Основной чат (Главная ветка)',
      permission: 'read_write',
      enabled: true,
      notes: 'Главный чат сообщества'
    },
    'rules': {
      threadId: 'rules',
      title: 'Правила чата и Даст Таун',
      permission: 'read_only',
      enabled: true,
      notes: 'Только чтение: запоминает правила, но ничего туда не пишет'
    }
  }
};

function loadSettings(): LittlepipSettings {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const data = JSON.parse(content);
      return {
        ...DEFAULT_CONFIG,
        ...data,
        topics: { ...DEFAULT_CONFIG.topics, ...(data.topics || {}) }
      };
    }
  } catch (e) {
    console.warn('[Littlepip Config] Не удалось прочитать .littlepip_config.json, используем дефолт');
  }
  return { ...DEFAULT_CONFIG };
}

function saveSettings(settings: LittlepipSettings): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Littlepip Config] Ошибка сохранения .littlepip_config.json:', error);
    throw error;
  }
}

let activeSettings: LittlepipSettings = loadSettings();

function loadDiscoveredTopics(): DiscoveredTelegramTopic[] {
  try {
    if (!fs.existsSync(DISCOVERED_TOPICS_FILE)) return [];
    const data: unknown = JSON.parse(fs.readFileSync(DISCOVERED_TOPICS_FILE, 'utf-8'));
    if (!Array.isArray(data)) {
      throw new Error('Expected an array of discovered Telegram topics');
    }
    return data.filter((topic): topic is DiscoveredTelegramTopic =>
      typeof topic === 'object' &&
      topic !== null &&
      'chatId' in topic &&
      (typeof topic.chatId === 'number' || typeof topic.chatId === 'string') &&
      'chatTitle' in topic &&
      typeof topic.chatTitle === 'string' &&
      'threadId' in topic &&
      typeof topic.threadId === 'number' &&
      Number.isFinite(topic.threadId) &&
      'title' in topic &&
      typeof topic.title === 'string' &&
      'lastSeenAt' in topic &&
      typeof topic.lastSeenAt === 'string'
    );
  } catch (error) {
    console.error('[Littlepip Topics] Could not load discovered topics:', error);
    return [];
  }
}

let discoveredTopics = loadDiscoveredTopics();

function getTopicConfigKey(chatId: number | string | undefined, threadId: number | string): string {
  return chatId === undefined ? String(threadId) : `${chatId}:${threadId}`;
}

export function recordDiscoveredTopic(topic: DiscoveredTelegramTopic): void {
  const key = getTopicConfigKey(topic.chatId, topic.threadId);
  const nextTopics = [...discoveredTopics];
  const existingIndex = nextTopics.findIndex(
    item => getTopicConfigKey(item.chatId, item.threadId) === key
  );
  if (existingIndex >= 0) {
    const existing = nextTopics[existingIndex];
    const updatedTopic = topic.title === `Топик #${topic.threadId}`
      ? { ...topic, title: existing.title }
      : topic;
    if (existing.title === updatedTopic.title && existing.chatTitle === updatedTopic.chatTitle) return;
    nextTopics[existingIndex] = updatedTopic;
  } else {
    nextTopics.push(topic);
  }
  const trimmedTopics = nextTopics.slice(-MAX_DISCOVERED_TOPICS);

  try {
    fs.writeFileSync(DISCOVERED_TOPICS_FILE, JSON.stringify(trimmedTopics, null, 2), 'utf-8');
    discoveredTopics = trimmedTopics;
  } catch (error) {
    console.error('[Littlepip Topics] Could not save discovered topics:', error);
    throw error;
  }
}

export function getDiscoveredTopics(): DiscoveredTelegramTopic[] {
  return [...discoveredTopics].sort((a, b) => a.chatTitle.localeCompare(b.chatTitle) || a.title.localeCompare(b.title));
}

export function getLittlepipSettings(): LittlepipSettings {
  return { ...activeSettings };
}

export function updateLittlepipSettings(newSettings: Partial<LittlepipSettings>): LittlepipSettings {
  const updatedSettings = {
    ...activeSettings,
    ...newSettings,
    topics: {
      ...activeSettings.topics,
      ...(newSettings.topics || {})
    }
  };
  saveSettings(updatedSettings);
  activeSettings = updatedSettings;
  return { ...activeSettings };
}

/**
 * Проверка прав топика:
 * canRead: разрешено ли читать и запоминать контекст
 * canWrite: разрешено ли отправлять реплики в этот топик
 */
export function checkTopicPermissions(chatId?: number | string, threadId?: number | string): {
  canRead: boolean;
  canWrite: boolean;
  topicTitle: string;
  permission: TopicPermission;
} {
  const key = threadId === undefined ? 'root' : getTopicConfigKey(chatId, threadId);
  const topic = activeSettings.topics[key] ||
    (threadId === undefined ? undefined : activeSettings.topics[String(threadId)]);

  if (!topic) {
    // По умолчанию новые топики в группе имеют обычный режим диалога
    return {
      canRead: true,
      canWrite: true,
      topicTitle: `Топик #${threadId ?? 'root'}`,
      permission: 'read_write'
    };
  }

  if (!topic.enabled || topic.permission === 'blocked') {
    return {
      canRead: false,
      canWrite: false,
      topicTitle: topic.title,
      permission: 'blocked'
    };
  }

  if (topic.permission === 'read_only') {
    return {
      canRead: true,
      canWrite: false, // СТРОГО: читать и запоминать, но НЕ писать!
      topicTitle: topic.title,
      permission: 'read_only'
    };
  }

  return {
    canRead: true,
    canWrite: true,
    topicTitle: topic.title,
    permission: 'read_write'
  };
}

/**
 * Добавить или обновить топик
 */
export function setTopicConfig(
  threadId: number | string,
  title: string,
  permission: TopicPermission = 'read_write',
  enabled = true,
  notes?: string,
  chatId?: number | string,
  chatTitle?: string
): LittlepipSettings {
  const key = getTopicConfigKey(chatId, threadId);
  const updatedSettings = {
    ...activeSettings,
    topics: {
      ...activeSettings.topics,
      [key]: {
        threadId,
        title,
        permission,
        enabled,
        notes,
        ...(chatId === undefined ? {} : { chatId }),
        ...(chatTitle ? { chatTitle } : {})
      }
    }
  };
  saveSettings(updatedSettings);
  activeSettings = updatedSettings;
  return { ...activeSettings };
}

/**
 * Удалить топик из настроек
 */
export function removeTopicConfig(threadId: number | string, chatId?: number | string): LittlepipSettings {
  const key = getTopicConfigKey(chatId, threadId);
  const topics = { ...activeSettings.topics };
  delete topics[key];
  const updatedSettings = { ...activeSettings, topics };
  saveSettings(updatedSettings);
  activeSettings = updatedSettings;
  return { ...activeSettings };
}
