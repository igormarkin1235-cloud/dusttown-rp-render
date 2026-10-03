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
      notes: 'Главный чат сообщества Даст Таун'
    },
    'rules': {
      threadId: 'rules',
      title: 'Правила и Законы Даст Тауна',
      permission: 'read_only',
      enabled: true,
      notes: 'Только чтение: Пипка впитывает правила и регламент, запоминает в память, но писать сюда запрещено'
    },
    'tavern': {
      threadId: 'tavern',
      title: 'Таверна «Слепая Пуля» (Общение)',
      permission: 'read_write',
      enabled: true,
      notes: 'Живой диалог, сталкерские байки, шутки и подколы'
    },
    'quests': {
      threadId: 'quests',
      title: 'Квесты, Вылазки и Пустоши',
      permission: 'read_write',
      enabled: true,
      notes: 'Координация рейдов, помощь сталкерам и техподдержка'
    },
    'market': {
      threadId: 'market',
      title: 'Базар и Торговля ℰQ',
      permission: 'read_write',
      enabled: true,
      notes: 'Экономика крышек и валюты ℰQ, обсуждение инвентаря'
    },
    'lore': {
      threadId: 'lore',
      title: 'Лор, Архив и История Стойла 2',
      permission: 'read_only',
      enabled: true,
      notes: 'База знаний: запоминает историю мира, персонажей и сюжет'
    },
    'announcements': {
      threadId: 'announcements',
      title: 'Объявления Администрации',
      permission: 'read_only',
      enabled: true,
      notes: 'Важные новости от создателей Даст Тауна: читает и запоминает'
    },
    'offtopic': {
      threadId: 'offtopic',
      title: 'Флудилка, Оффтоп и Мемы',
      permission: 'blocked',
      enabled: true,
      notes: 'Запрещено: Пипка полностью игнорирует сообщения из этой вкладки'
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
  } catch (e) {
    console.error('[Littlepip Config] Ошибка сохранения .littlepip_config.json:', e);
  }
}

let activeSettings: LittlepipSettings = loadSettings();

export function getLittlepipSettings(): LittlepipSettings {
  return { ...activeSettings };
}

export function updateLittlepipSettings(newSettings: Partial<LittlepipSettings>): LittlepipSettings {
  activeSettings = {
    ...activeSettings,
    ...newSettings,
    topics: {
      ...activeSettings.topics,
      ...(newSettings.topics || {})
    }
  };
  saveSettings(activeSettings);
  return { ...activeSettings };
}

/**
 * Проверка прав топика:
 * canRead: разрешено ли читать и запоминать контекст
 * canWrite: разрешено ли отправлять реплики в этот топик
 */
export function checkTopicPermissions(threadId?: number | string): {
  canRead: boolean;
  canWrite: boolean;
  topicTitle: string;
  permission: TopicPermission;
} {
  const key = String(threadId || 'root');
  let topic = activeSettings.topics[key];

  if (!topic) {
    topic = registerDiscoveredTopic(key, `Топик #${key}`);
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
 * Автоматически зарегистрировать обнаруженный топик группы
 */
export function registerDiscoveredTopic(
  threadId: number | string,
  title?: string
): TelegramTopicConfig {
  const key = String(threadId);
  const existingTopic = activeSettings.topics[key];
  if (!existingTopic) {
    const newTopic: TelegramTopicConfig = {
      threadId: key,
      title: title || `Топик #${key}`,
      permission: 'read_write',
      enabled: true,
      notes: 'Обнаружен в группе'
    };
    activeSettings.topics[key] = newTopic;
    saveSettings(activeSettings);
    return newTopic;
  }
  if (title && existingTopic.title === `Топик #${key}`) {
    existingTopic.title = title;
    saveSettings(activeSettings);
  }
  return existingTopic;
}

/**
 * Добавить или обновить топик
 */
export function setTopicConfig(
  threadId: number | string,
  title: string,
  permission: TopicPermission = 'read_write',
  enabled = true,
  notes?: string
): LittlepipSettings {
  const key = String(threadId);
  activeSettings.topics[key] = {
    threadId: key,
    title,
    permission,
    enabled,
    notes
  };
  saveSettings(activeSettings);
  return { ...activeSettings };
}

/**
 * Удалить топик из настроек
 */
export function removeTopicConfig(threadId: number | string): LittlepipSettings {
  const key = String(threadId);
  delete activeSettings.topics[key];
  saveSettings(activeSettings);
  return { ...activeSettings };
}
