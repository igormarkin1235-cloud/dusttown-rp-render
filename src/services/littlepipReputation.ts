/**
 * LITTLEPIP REPUTATION & PLAYER MEMORY ENGINE
 * 
 * Персистентная система репутации и памяти Литлпип об игроках чата.
 * Запоминает добрые дела, похвалу, обиды, попытки буллинга или токсичность.
 */

import fs from 'fs';
import path from 'path';

export type PlayerAttitude = 
  | 'best_friend'   // +50..+100 (Любимчик, полное доверие, теплота, флирт)
  | 'friend'        // +20..+49  (Проверенный сталкер, дружелюбие, шутки)
  | 'neutral'       // -10..+19  (Обычный собеседник, любопытство, нейтралитет)
  | 'suspicious'    // -30..-11  (Подозрительный тип, колкости, настороженность)
  | 'offended'      // -60..-31  (Обидчик, Литлпип дуется, холодный сарказм, помнит обиду)
  | 'nemesis';      // -100..-61 (Враг в чёрном списке Pip-Buck, резкий отпор, агрессия)

export interface PlayerReputationRecord {
  userId: string | number;
  username: string;
  score: number;             // -100 to +100
  attitude: PlayerAttitude;
  strikes: number;           // число серьезных обид/наездов
  praises: number;           // число похвал/поддержки
  notes: string[];           // ключевые воспоминания ("поделился деталями", "шутил про воровство")
  lastImpression: string;
  grudgeUntil?: number;      // timestamp до которого Пипка держит обиду
  lastInteractionAt: string;
}

const REPUTATION_FILE = path.join(process.cwd(), '.littlepip_reputation.json');

function loadReputationStore(): Record<string, PlayerReputationRecord> {
  try {
    if (fs.existsSync(REPUTATION_FILE)) {
      const content = fs.readFileSync(REPUTATION_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (typeof data === 'object' && data !== null) return data;
    }
  } catch (e) {
    console.warn('[Littlepip Rep] Ошибка чтения .littlepip_reputation.json, используем пустую базу');
  }
  return {};
}

function saveReputationStore(store: Record<string, PlayerReputationRecord>): void {
  try {
    fs.writeFileSync(REPUTATION_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Littlepip Rep] Ошибка сохранения базы репутации:', e);
  }
}

let reputationStore: Record<string, PlayerReputationRecord> = loadReputationStore();

function getPlayerKey(userId: string | number, username?: string): string {
  if (userId) return String(userId);
  if (username) return username.replace(/^@/, '').toLowerCase();
  return 'unknown_stalker';
}

function calculateAttitude(score: number): PlayerAttitude {
  if (score >= 50) return 'best_friend';
  if (score >= 20) return 'friend';
  if (score >= -10) return 'neutral';
  if (score >= -30) return 'suspicious';
  if (score >= -60) return 'offended';
  return 'nemesis';
}

/**
 * Получить досье репутации игрока
 */
export function getPlayerReputation(userId: string | number, username = 'Сталкер'): PlayerReputationRecord {
  const key = getPlayerKey(userId, username);
  if (!reputationStore[key]) {
    const record: PlayerReputationRecord = {
      userId,
      username,
      score: 0,
      attitude: 'neutral',
      strikes: 0,
      praises: 0,
      notes: [],
      lastImpression: 'Новый знакомый на волне Даст Тауна.',
      lastInteractionAt: new Date().toISOString()
    };
    reputationStore[key] = record;
    saveReputationStore(reputationStore);
    return record;
  }
  return reputationStore[key];
}

/**
 * Анализирует сообщение и динамически меняет репутацию
 */
export function evaluateMessageReputation(
  userId: string | number,
  username: string,
  text: string,
  isSenderAdmin = false,
  isSenderOwner = false
): { delta: number; reason?: string; record: PlayerReputationRecord } {
  const record = getPlayerReputation(userId, username);
  record.username = username || record.username;
  record.lastInteractionAt = new Date().toISOString();

  const lower = text.toLowerCase();
  let delta = 0;
  let reason = '';

  // 1. Извинения / примирение
  if (/(прости|извини|был не прав|была не права|не обижайся|мир\b|давай дружить)/iu.test(lower)) {
    if (record.score < 0) {
      delta += 15;
      record.grudgeUntil = 0;
      reason = 'принёс извинения и предложил мир';
      record.notes.push('Извинился за прошлые выпады');
    } else {
      delta += 3;
      reason = 'вежливое дружелюбие';
    }
  }

  // 2. Похвала, восхищение, искренний комплимент, забота
  else if (/(ты лучшая|молодец|умница|красотка|спасибо тебе|обожаю тебя|милая|забочусь|помогу тебе|ты классная|радуешь)/iu.test(lower)) {
    delta += isSenderAdmin ? 5 : 4;
    record.praises += 1;
    reason = 'тёплые слова и искренняя поддержка';
    if (!record.notes.includes('Часто хвалит и поддерживает')) {
      record.notes.push('Часто хвалит и поддерживает');
    }
  }

  // 3. Защита Литлпип или сочувствие её сложной судьбе / друзьям
  else if (/(не трогайте пипку|защищу|хомэйдж|каламити|вельвет|стилхувз|ты сильная)/iu.test(lower)) {
    delta += 4;
    reason = 'уважение к друзьям и боевому прошлому';
    if (!record.notes.includes('Уважает боевой отряд')) {
      record.notes.push('Уважает боевой отряд');
    }
  }

  // 4. Прямые оскорбления, наезды, буллинг («мелкая дура», «шлюха», «бесишь», «заткнись», «убью тебя»)
  else if (/(мелкая (?:дура|тварь|кобыла)|заткнись|пошла нах|тупая|урод|шлюх|мразь|бесишь|ненавижу тебя|завалю|убью)/iu.test(lower)) {
    delta -= 18;
    record.strikes += 1;
    record.grudgeUntil = Date.now() + 45 * 60 * 1000; // дуется 45 минут
    reason = 'грубые наезды и оскорбления личности';
    record.notes.push(`Наехал на Пипку: "${text.slice(0, 40)}"`);
  }

  // 5. Попытки отобрать оружие, ограбить, подставить или натравить воришек
  else if (/(отдай макинтош|украду|отберу|спизжу|натравить|сжечь пипку|сдать рейдерам)/iu.test(lower)) {
    delta -= 8;
    record.strikes += 1;
    reason = 'покушение на личные вещи и угрозы';
    if (!record.notes.includes('Пытался отобрать вещи или подставить')) {
      record.notes.push('Пытался отобрать вещи или подставить');
    }
  }

  // Бонус создателю/админам за поддержание порядка
  if (isSenderOwner && record.score < 25) {
    delta += 5;
  }

  // Применение изменений
  record.score = Math.max(-100, Math.min(100, record.score + delta));
  record.attitude = calculateAttitude(record.score);

  if (reason) {
    record.lastImpression = reason;
  }

  // Ограничиваем историю заметок 5 последними
  if (record.notes.length > 5) {
    record.notes = record.notes.slice(-5);
  }

  saveReputationStore(reputationStore);
  return { delta, reason, record };
}

/**
 * Генерация контекста репутации для системного промпта
 */
export function formatReputationPromptContext(
  userId: string | number,
  username: string,
  isSenderAdmin: boolean,
  isSenderOwner: boolean
): string {
  const rep = getPlayerReputation(userId, username);
  const isOffendedNow = Boolean(rep.grudgeUntil && rep.grudgeUntil > Date.now());

  let attitudeGuidance = '';
  switch (rep.attitude) {
    case 'best_friend':
      attitudeGuidance = 'ЛЮБИМЧИК И БРАТИШКА (+50..+100): Полное доверие, искреннее тепло, делись сталкерскими секретами, шути и легко флиртуй.';
      break;
    case 'friend':
      attitudeGuidance = 'ПРОВЕРЕННЫЙ СТАЛКЕР (+20..+49): Дружелюбный тон, охотно поддерживай разговор, подкалывай по-доброму.';
      break;
    case 'suspicious':
      attitudeGuidance = 'ПОДОЗРИТЕЛЬНЫЙ ТИП (-30..-11): Будь настороже, саркастично осаждай, не доверяй на слово.';
      break;
    case 'offended':
      attitudeGuidance = 'ОБИДЧИК (-60..-31): Ты на него сильно обижена! Отвечай холодно, язвительно, припоминай обиду, не помогай просто так.';
      break;
    case 'nemesis':
      attitudeGuidance = 'ВРАГ В ЧЁРНОМ СПИСКЕ (-100..-61): Агрессивный отпор! Жёстко ставь на место, угрожай выкинуть из эфира или зарядить Макинтошем.';
      break;
    default:
      attitudeGuidance = 'НЕЙТРАЛЬНЫЙ СТАЛКЕР (-10..+19): Любознательность, независимость, сталкерский юмор, общение на равных.';
      break;
  }

  if (isOffendedNow) {
    attitudeGuidance += ' [ВНИМАНИЕ: Ты сейчас активно ДУЕШЬСЯ на него из-за недавней грубости! Не сюсюкайся, держи дистанцию!]';
  }

  if (isSenderOwner) {
    attitudeGuidance += ' (Это Создатель DustTown @MrWhitePio: к нему высокое уважение, на равных, дерзко-игривый тон).';
  } else if (isSenderAdmin) {
    attitudeGuidance += ' (Это Администратор чата: высокий шанс взаимного подкола и легкого флирта).';
  }

  return `=== СИСТЕМА ПАМЯТИ И РЕПУТАЦИИ ПИПКИ ===
Собеседник: ${username} (Рейтинг: ${rep.score}/100, Статус: ${rep.attitude})
Заметки в Pip-Buck: ${rep.notes.length ? rep.notes.join('; ') : 'Пока чистый лист'}
Последнее впечатление: ${rep.lastImpression}
ТВОЯ ЛИНИЯ ПОВЕДЕНИЯ С НИМ: ${attitudeGuidance}`;
}

/**
 * Текстовый отчёт по команде /pip_rep
 */
export function generateReputationReport(userId: string | number, username: string): string {
  const rep = getPlayerReputation(userId, username);
  let statusEmoji = '⚖️';
  let statusTitle = 'Нейтральный сталкер';

  if (rep.score >= 50) {
    statusEmoji = '💖';
    statusTitle = 'Любимчик и надёжный бро';
  } else if (rep.score >= 20) {
    statusEmoji = '🤝';
    statusTitle = 'Проверенный друг Стойла 2';
  } else if (rep.score <= -60) {
    statusEmoji = '💀';
    statusTitle = 'Враг в чёрном списке Pip-Buck';
  } else if (rep.score <= -30) {
    statusEmoji = '😤';
    statusTitle = 'Временный обидчик (Пипка дуется)';
  } else if (rep.score <= -11) {
    statusEmoji = '🤨';
    statusTitle = 'Мутный и подозрительный тип';
  }

  return `📜 **Досье Pip-Buck на @${username.replace(/^@/, '')}**\n\n` +
    `• Уровень доверия: **${rep.score} / 100**\n` +
    `• Статус отношений: ${statusEmoji} **${statusTitle}**\n` +
    `• Приятных моментов: **${rep.praises}**\n` +
    `• Косяков и обид: **${rep.strikes}**\n` +
    `• Заметки памяти: ${rep.notes.length ? rep.notes.map(n => `\n  - ${n}`).join('') : 'Чисто, ещё не успел отличиться.'}\n\n` +
    `💬 *«${
      rep.score >= 50 ? 'С тобой я хоть в гнездо аликорнов пойду, бро!' :
      rep.score >= 20 ? 'Нормальный пони, с тобой на пустошах не соскучишься.' :
      rep.score <= -30 ? 'Я всё помню! Так просто от меня прощения не вымолишь!' :
      'Пока присматриваюсь. Не шуми и не трогай мои отмычки — сработаемся.'
    }»*`;
}

/**
 * Топ любимчиков и список обидчиков (/pip_top)
 */
export function getReputationLeaderboard(): string {
  const all = Object.values(reputationStore);
  const friends = [...all].filter(p => p.score > 10).sort((a, b) => b.score - a.score).slice(0, 5);
  const offenders = [...all].filter(p => p.score < -10).sort((a, b) => a.score - b.score).slice(0, 5);

  let out = `🏆 **Доска почёта и розыска Литлпип** 🦄✨\n\n`;

  out += `💚 **Любимчики (кому Пипка доверяет):**\n`;
  if (friends.length) {
    out += friends.map((f, i) => `${i + 1}. @${f.username.replace(/^@/, '')} — **+${f.score} ℰQ** (${f.attitude})`).join('\n');
  } else {
    out += `  *Пока никто не заслужил безоговорочного доверия.*`;
  }

  out += `\n\n🖤 **Черный список (кто разозлил Пипку):**\n`;
  if (offenders.length) {
    out += offenders.map((o, i) => `${i + 1}. @${o.username.replace(/^@/, '')} — **${o.score} ℰQ** (${o.attitude})`).join('\n');
  } else {
    out += `  *Врагов нет, все ведут себя прилично.*`;
  }

  return out;
}

/**
 * Получить список всех игроков и их репутацию
 */
export function getAllReputations(): PlayerReputationRecord[] {
  return Object.values(reputationStore).sort((a, b) => b.score - a.score);
}

/**
 * Ручная корректировка репутации администратором
 */
export function adjustPlayerReputation(
  userId: string | number,
  deltaScore: number,
  reason: string,
  clearGrudge = false
): PlayerReputationRecord {
  const record = getPlayerReputation(userId);
  record.score = Math.max(-100, Math.min(100, record.score + deltaScore));
  record.attitude = calculateAttitude(record.score);
  if (clearGrudge) {
    record.grudgeUntil = 0;
  }
  record.lastImpression = `Админ-корректировка: ${reason}`;
  record.notes.push(`Админ (${deltaScore > 0 ? '+' : ''}${deltaScore}): ${reason}`);
  if (record.notes.length > 5) record.notes = record.notes.slice(-5);
  saveReputationStore(reputationStore);
  return record;
}

/**
 * Снять обиду с игрока (помилование)
 */
export function forgivePlayerGrudge(userId: string | number): PlayerReputationRecord {
  const record = getPlayerReputation(userId);
  record.grudgeUntil = 0;
  if (record.score < 0) {
    record.score = 5; // Сброс до нейтрально-дружелюбного
    record.attitude = 'neutral';
  }
  record.notes.push('Обида снята Создателем/Админом Даст Тауна');
  record.lastImpression = 'Пипка простила старые обиды по решению Администрации.';
  saveReputationStore(reputationStore);
  return record;
}

