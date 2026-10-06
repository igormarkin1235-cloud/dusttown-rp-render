/**
 * BLACKJACK DEDICATED MEMORY & SURVEILLANCE ENGINE
 * 
 * Персистентная база наблюдений и знаний Блэкджек (.blackjack_memory.json).
 * Сохраняет факты, правила, объявления и наблюдения, прочитанные в Read-Only топиках и чатах.
 * Служит досье шерифа Стойла 99.
 */

import fs from 'fs';
import path from 'path';

export interface BlackjackObservationItem {
  id: string;
  timestamp: number;
  isoDate: string;
  topicId: string | number;
  topicTitle: string;
  author: string;
  userId?: string | number;
  category: 'rule' | 'incident' | 'surveillance' | 'lore' | 'general';
  content: string;
  tags: string[];
}

export interface BlackjackMemoryStore {
  version: number;
  lastUpdated: string;
  observations: BlackjackObservationItem[];
}

const MEMORY_FILE = path.join(process.cwd(), '.blackjack_memory.json');

const DEFAULT_SEED_OBSERVATIONS: BlackjackObservationItem[] = [
  {
    id: 'bj-obs-1',
    timestamp: Date.now() - 3 * 24 * 3600 * 1000,
    isoDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    topicId: 'rules',
    topicTitle: 'Правила и Законы Даст Тауна',
    author: 'MrWhitePio',
    userId: 101,
    category: 'rule',
    content: 'Офицеру СБ Стойла 99 поручено пресекать спам, оскорбления, токсичность и рейды без отыгрыша.',
    tags: ['правила', 'сб', 'дисциплина']
  }
];

function loadMemoryStore(): BlackjackMemoryStore {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const content = fs.readFileSync(MEMORY_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data && Array.isArray(data.observations)) {
        return {
          version: 1,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          observations: data.observations
        };
      }
    }
  } catch (e) {
    console.warn('[Blackjack Memory] Ошибка чтения .blackjack_memory.json, инициализация новой базы');
  }

  const initialStore: BlackjackMemoryStore = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    observations: [...DEFAULT_SEED_OBSERVATIONS]
  };
  saveMemoryStore(initialStore);
  return initialStore;
}

function saveMemoryStore(store: BlackjackMemoryStore): void {
  try {
    store.lastUpdated = new Date().toISOString();
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Blackjack Memory] Ошибка сохранения .blackjack_memory.json:', e);
  }
}

let memoryStore: BlackjackMemoryStore = loadMemoryStore();

export function getBlackjackMemory(): BlackjackMemoryStore {
  return {
    ...memoryStore,
    observations: [...memoryStore.observations]
  };
}

export function rememberBlackjackObservation(
  topicId: string | number,
  topicTitle: string,
  author: string,
  content: string,
  userId?: string | number
): BlackjackObservationItem | null {
  const cleanContent = content.trim();
  if (!cleanContent || cleanContent.length < 5) return null;

  const isDuplicate = memoryStore.observations.some(
    item => item.content.toLowerCase() === cleanContent.toLowerCase() && String(item.topicId) === String(topicId)
  );
  if (isDuplicate) return null;

  let category: BlackjackObservationItem['category'] = 'general';
  const lower = cleanContent.toLowerCase();
  const lowerTopic = topicTitle.toLowerCase();

  if (lowerTopic.includes('правил') || lower.includes('правил') || lower.includes('запрещен') || lower.includes('наказан')) {
    category = 'rule';
  } else if (lower.includes('оскорб') || lower.includes('мут') || lower.includes('бан') || lower.includes('наруш')) {
    category = 'incident';
  } else if (lowerTopic.includes('наблюден') || lowerTopic.includes('лог') || lowerTopic.includes('отчет')) {
    category = 'surveillance';
  } else if (lowerTopic.includes('лор') || lowerTopic.includes('стойл')) {
    category = 'lore';
  }

  const tags: string[] = ['наблюдение'];
  if (category === 'rule') tags.push('правила');
  if (category === 'incident') tags.push('инцидент');
  if (author) tags.push(author.replace(/^@/, '').toLowerCase());

  const newItem: BlackjackObservationItem = {
    id: `bj-mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    isoDate: new Date().toISOString(),
    topicId,
    topicTitle,
    author: author || 'Участник',
    userId,
    category,
    content: cleanContent,
    tags
  };

  memoryStore.observations.unshift(newItem);
  if (memoryStore.observations.length > 500) {
    memoryStore.observations = memoryStore.observations.slice(0, 500);
  }

  saveMemoryStore(memoryStore);
  return newItem;
}

export function getBlackjackMemoryContextForPrompt(): string {
  if (memoryStore.observations.length === 0) return '';
  const recentItems = memoryStore.observations.slice(0, 15);
  const lines = recentItems.map(item => {
    return `• [Вкладка/Тема: ${item.topicTitle}] (Зафиксировано от ${item.author}): ${item.content}`;
  });
  return `\n\nБАЗА НАБЛЮДЕНИЙ И ФАКТОВ СТОЙЛА 99 (сохранено в .blackjack_memory.json):\n${lines.join('\n')}\nИспользуй эти факты о чате и игроках при ответах!`;
}

export function resetBlackjackMemory(scope: '24h' | '3d' | 'all'): {
  scope: string;
  deletedCount: number;
  remainingCount: number;
} {
  const now = Date.now();
  const initialCount = memoryStore.observations.length;

  if (scope === 'all') {
    memoryStore.observations = [];
  } else if (scope === '24h') {
    const cutoff = now - 24 * 60 * 60 * 1000;
    memoryStore.observations = memoryStore.observations.filter(item => item.timestamp < cutoff);
  } else if (scope === '3d') {
    const cutoff = now - 3 * 24 * 60 * 60 * 1000;
    memoryStore.observations = memoryStore.observations.filter(item => item.timestamp < cutoff);
  }

  saveMemoryStore(memoryStore);
  return {
    scope,
    deletedCount: initialCount - memoryStore.observations.length,
    remainingCount: memoryStore.observations.length
  };
}
