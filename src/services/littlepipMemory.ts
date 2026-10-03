/**
 * LITTLEPIP DEDICATED MEMORY & KNOWLEDGE ENGINE
 * 
 * Отдельный файл персистентной памяти и базы знаний Литлпип (.littlepip_memory.json).
 * Сохраняет факты, правила, объявления и важную информацию, прочитанную во вкладках группы.
 * Поддерживает выборочный сброс (за 24ч, за 3 дня, вся память).
 */

import fs from 'fs';
import path from 'path';

export interface LearnedKnowledgeItem {
  id: string;
  timestamp: number;
  isoDate: string;
  topicId: string | number;
  topicTitle: string;
  author: string;
  userId?: string | number;
  category: 'rule' | 'lore' | 'announcement' | 'player_fact' | 'general';
  content: string;
  tags: string[];
}

export interface LittlepipMemoryStore {
  version: number;
  lastUpdated: string;
  learnedKnowledge: LearnedKnowledgeItem[];
  recentDialogues: Array<{
    chatId: string | number;
    threadId: string | number;
    username: string;
    text: string;
    timestamp: number;
  }>;
}

const MEMORY_FILE = path.join(process.cwd(), '.littlepip_memory.json');

const DEFAULT_SEED_KNOWLEDGE: LearnedKnowledgeItem[] = [
  {
    id: 'seed-rule-1',
    timestamp: Date.now() - 4 * 24 * 3600 * 1000,
    isoDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    topicId: 'rules',
    topicTitle: 'Правила и Законы Даст Тауна',
    author: 'MrWhitePio',
    userId: 101,
    category: 'rule',
    content: 'Запрещен немотивированный спам, воровство сидра из личных запасов без отыгрыша и токсичность к новичкам.',
    tags: ['правила', 'спам', 'сидр']
  },
  {
    id: 'seed-lore-1',
    timestamp: Date.now() - 5 * 24 * 3600 * 1000,
    isoDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    topicId: 'lore',
    topicTitle: 'Лор, Архив и История Стойла',
    author: 'Система Стойла 2',
    category: 'lore',
    content: 'Даст Таун — укреплённое поселение Пустоши Эквестрии вокруг разрушенного бункера и завода яблочного сидра.',
    tags: ['лор', 'даст_таун', 'пустоши']
  }
];

function loadMemoryStore(): LittlepipMemoryStore {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const content = fs.readFileSync(MEMORY_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data && Array.isArray(data.learnedKnowledge)) {
        return {
          version: 1,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          learnedKnowledge: data.learnedKnowledge,
          recentDialogues: Array.isArray(data.recentDialogues) ? data.recentDialogues : []
        };
      }
    }
  } catch (e) {
    console.warn('[Littlepip Memory] Ошибка чтения .littlepip_memory.json, инициализация новой базы');
  }

  const initialStore: LittlepipMemoryStore = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    learnedKnowledge: [...DEFAULT_SEED_KNOWLEDGE],
    recentDialogues: []
  };
  saveMemoryStore(initialStore);
  return initialStore;
}

function saveMemoryStore(store: LittlepipMemoryStore): void {
  try {
    store.lastUpdated = new Date().toISOString();
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Littlepip Memory] Ошибка сохранения .littlepip_memory.json:', e);
  }
}

let memoryStore: LittlepipMemoryStore = loadMemoryStore();

/**
 * Получить всю базу памяти
 */
export function getLittlepipMemory(): LittlepipMemoryStore {
  return {
    ...memoryStore,
    learnedKnowledge: [...memoryStore.learnedKnowledge]
  };
}

/**
 * Запомнить новую информацию (правило, лор, факт из вкладки "только чтение" или чата)
 */
export function rememberLearnedKnowledge(
  topicId: string | number,
  topicTitle: string,
  author: string,
  content: string,
  userId?: string | number
): LearnedKnowledgeItem | null {
  const cleanContent = content.trim();
  if (!cleanContent || cleanContent.length < 5) return null;

  // Избегаем дубликатов точь-в-точь
  const isDuplicate = memoryStore.learnedKnowledge.some(
    item => item.content.toLowerCase() === cleanContent.toLowerCase() && String(item.topicId) === String(topicId)
  );
  if (isDuplicate) return null;

  // Определение категории
  let category: LearnedKnowledgeItem['category'] = 'general';
  const lower = cleanContent.toLowerCase();
  const lowerTopic = topicTitle.toLowerCase();

  if (lowerTopic.includes('правил') || lower.includes('правил') || lower.includes('запрещен') || lower.includes('нельзя')) {
    category = 'rule';
  } else if (lowerTopic.includes('лор') || lowerTopic.includes('истори') || lower.includes('стойл') || lower.includes('анклав')) {
    category = 'lore';
  } else if (lowerTopic.includes('объявлен') || lowerTopic.includes('новост') || lower.includes('внимание')) {
    category = 'announcement';
  } else if (lower.includes('меня зовут') || lower.includes('я люблю') || lower.includes('мой персонаж')) {
    category = 'player_fact';
  }

  // Извлечение тегов
  const tags: string[] = [];
  if (category === 'rule') tags.push('правила');
  if (category === 'lore') tags.push('лор');
  if (lower.includes('сидр')) tags.push('сидр');
  if (lower.includes('гном')) tags.push('гномы');
  if (lower.includes('макинтош')) tags.push('макинтош');
  if (author) tags.push(author.replace(/^@/, '').toLowerCase());

  const newItem: LearnedKnowledgeItem = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

  // Ограничиваем базу максимум 500 записями
  memoryStore.learnedKnowledge.unshift(newItem);
  if (memoryStore.learnedKnowledge.length > 500) {
    memoryStore.learnedKnowledge = memoryStore.learnedKnowledge.slice(0, 500);
  }

  saveMemoryStore(memoryStore);
  return newItem;
}

/**
 * Сохранить реплику диалога
 */
export function recordDialogueMessage(
  chatId: string | number,
  threadId: string | number,
  username: string,
  text: string
): void {
  memoryStore.recentDialogues.push({
    chatId,
    threadId,
    username,
    text,
    timestamp: Date.now()
  });

  // Храним последние 200 сообщений диалогов
  if (memoryStore.recentDialogues.length > 200) {
    memoryStore.recentDialogues = memoryStore.recentDialogues.slice(-200);
  }
  saveMemoryStore(memoryStore);
}

/**
 * СБРОС ПАМЯТИ:
 * - '24h': удалить воспоминания моложе 24 часов
 * - '3d': удалить воспоминания моложе 72 часов
 * - 'all': полная очистка памяти
 */
export function resetLittlepipMemory(scope: '24h' | '3d' | 'all'): {
  scope: string;
  deletedLearnedCount: number;
  deletedDialogueCount: number;
  remainingLearnedCount: number;
} {
  const now = Date.now();
  const initialLearnedCount = memoryStore.learnedKnowledge.length;
  const initialDialogueCount = memoryStore.recentDialogues.length;

  if (scope === 'all') {
    memoryStore.learnedKnowledge = [];
    memoryStore.recentDialogues = [];
  } else if (scope === '24h') {
    const cutoff = now - 24 * 60 * 60 * 1000;
    memoryStore.learnedKnowledge = memoryStore.learnedKnowledge.filter(item => item.timestamp < cutoff);
    memoryStore.recentDialogues = memoryStore.recentDialogues.filter(item => item.timestamp < cutoff);
  } else if (scope === '3d') {
    const cutoff = now - 3 * 24 * 60 * 60 * 1000;
    memoryStore.learnedKnowledge = memoryStore.learnedKnowledge.filter(item => item.timestamp < cutoff);
    memoryStore.recentDialogues = memoryStore.recentDialogues.filter(item => item.timestamp < cutoff);
  }

  saveMemoryStore(memoryStore);

  return {
    scope,
    deletedLearnedCount: initialLearnedCount - memoryStore.learnedKnowledge.length,
    deletedDialogueCount: initialDialogueCount - memoryStore.recentDialogues.length,
    remainingLearnedCount: memoryStore.learnedKnowledge.length
  };
}

/**
 * Удалить единичную запись памяти
 */
export function deleteSingleMemoryItem(id: string): boolean {
  const index = memoryStore.learnedKnowledge.findIndex(item => item.id === id);
  if (index >= 0) {
    memoryStore.learnedKnowledge.splice(index, 1);
    saveMemoryStore(memoryStore);
    return true;
  }
  return false;
}

/**
 * Сформировать выжимку знаний для системного промпта модели
 */
export function getKnowledgeContextForPrompt(): string {
  if (memoryStore.learnedKnowledge.length === 0) return '';

  const recentItems = memoryStore.learnedKnowledge.slice(0, 15);
  const lines = recentItems.map(item => {
    return `• [Вкладка: ${item.topicTitle}] (Запомнила от ${item.author}): ${item.content}`;
  });

  return `\n\nВЫУЧЕННЫЕ ЗНАНИЯ И ПРАВИЛА ИЗ ВКЛАДОК ГРУППЫ (сохранены в .littlepip_memory.json):\n${lines.join('\n')}\nИспользуй эти факты и правила при общении в Даст Тауне!`;
}
