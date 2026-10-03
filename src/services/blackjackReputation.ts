/**
 * BLACKJACK REPUTATION ENGINE
 * 
 * Система репутации перед Офицером Блэкджек:
 * - Уровень доверия Секьюрити Стойла 99
 * - Авторитет среди стражей порядка
 * - Штрафы за хамство, спам и провокации
 * - Особый статус для администрации и шерифов
 */

import fs from 'fs';
import path from 'path';

export interface BlackjackReputationRecord {
  userId: string;
  username: string;
  displayName: string;
  respectScore: number; // -100 to +100
  tierTitle: string;
  warningsCount: number;
  mutesCount: number;
  lastUpdated: string;
  notes?: string[];
}

const REPUTATION_FILE = path.resolve(process.cwd(), '.blackjack_reputation.json');

export function calculateTierTitle(score: number, isAdmin: boolean = false): string {
  if (isAdmin) return '⭐ Верховный Шериф (Абсолютное доверие)';
  if (score >= 80) return '🎖️ Доверенный напарник Стойла 99';
  if (score >= 40) return '🛡️ Надёжный житель Пустоши';
  if (score >= 10) return '🤠 Законопослушный сталкер';
  if (score >= -10) return '🌫️ Неприметный путник';
  if (score >= -40) return '⚠️ Подозрительный тип под прицелом';
  if (score >= -75) return '🚨 Постоянный нарушитель / Дебошир';
  return '☠️ Особо опасный рецидивист (В черном списке)';
}

export function loadBlackjackReputations(): Record<string, BlackjackReputationRecord> {
  try {
    if (fs.existsSync(REPUTATION_FILE)) {
      const raw = fs.readFileSync(REPUTATION_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read .blackjack_reputation.json:', err);
  }
  return {};
}

export function saveBlackjackReputations(reps: Record<string, BlackjackReputationRecord>): void {
  try {
    fs.writeFileSync(REPUTATION_FILE, JSON.stringify(reps, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save .blackjack_reputation.json:', err);
  }
}

export function getOrCreateBlackjackReputation(
  userId: string,
  username: string,
  displayName: string,
  isAdmin: boolean = false
): BlackjackReputationRecord {
  const reps = loadBlackjackReputations();
  const cleanId = userId || username.toLowerCase();

  if (!reps[cleanId]) {
    const initialScore = isAdmin ? 90 : 15;
    reps[cleanId] = {
      userId: cleanId,
      username,
      displayName: displayName || username,
      respectScore: initialScore,
      tierTitle: calculateTierTitle(initialScore, isAdmin),
      warningsCount: 0,
      mutesCount: 0,
      lastUpdated: new Date().toISOString(),
      notes: isAdmin ? ['Администратор сообщества'] : []
    };
    saveBlackjackReputations(reps);
  }

  return reps[cleanId];
}

export function adjustBlackjackReputation(
  userId: string,
  username: string,
  delta: number,
  reason: string,
  isAdmin: boolean = false
): BlackjackReputationRecord {
  const reps = loadBlackjackReputations();
  const cleanId = userId || username.toLowerCase();
  const rec = getOrCreateBlackjackReputation(cleanId, username, username, isAdmin);

  rec.respectScore = Math.max(-100, Math.min(100, rec.respectScore + delta));
  rec.tierTitle = calculateTierTitle(rec.respectScore, isAdmin);
  rec.lastUpdated = new Date().toISOString();
  if (reason) {
    rec.notes = rec.notes || [];
    rec.notes.unshift(`${new Date().toLocaleDateString()}: ${delta > 0 ? '+' : ''}${delta} (${reason})`);
    if (rec.notes.length > 5) rec.notes.pop();
  }

  reps[cleanId] = rec;
  saveBlackjackReputations(reps);
  return rec;
}

export function recordBlackjackInfraction(
  userId: string,
  username: string,
  type: 'warning' | 'mute' | 'ban'
): void {
  const reps = loadBlackjackReputations();
  const cleanId = userId || username.toLowerCase();
  const rec = getOrCreateBlackjackReputation(cleanId, username, username);

  if (type === 'warning') {
    rec.warningsCount += 1;
    rec.respectScore = Math.max(-100, rec.respectScore - 15);
  } else if (type === 'mute') {
    rec.mutesCount += 1;
    rec.respectScore = Math.max(-100, rec.respectScore - 30);
  } else if (type === 'ban') {
    rec.respectScore = -100;
  }

  rec.tierTitle = calculateTierTitle(rec.respectScore);
  rec.lastUpdated = new Date().toISOString();
  reps[cleanId] = rec;
  saveBlackjackReputations(reps);
}
