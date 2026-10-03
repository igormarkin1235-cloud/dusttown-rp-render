import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateMessageReputation,
  getPlayerReputation,
  formatReputationPromptContext,
  generateReputationReport,
  getReputationLeaderboard
} from './littlepipReputation';

test('evaluates friendly praises and raises reputation score', () => {
  const userId = `test-user-praise-${Date.now()}`;
  const res = evaluateMessageReputation(userId, 'NiceStalker', 'Ты лучшая, Пипка! Спасибо огромное за помощь!');
  assert.ok(res.delta > 0);
  assert.ok(res.record.score > 0);
  assert.equal(res.record.praises, 1);
});

test('evaluates insults, lowers score and triggers grudge', () => {
  const userId = `test-user-bully-${Date.now()}`;
  const res = evaluateMessageReputation(userId, 'BadRaider', 'Мелкая дура, заткнись!');
  assert.ok(res.delta < 0);
  assert.ok(res.record.score < 0);
  assert.ok(res.record.strikes >= 1);
  assert.ok(res.record.grudgeUntil && res.record.grudgeUntil > Date.now());
  assert.match(res.record.attitude, /suspicious|offended|nemesis/);
});

test('accepts apology and restores reputation', () => {
  const userId = `test-user-apology-${Date.now()}`;
  evaluateMessageReputation(userId, 'Regretful', 'Заткнись ты');
  const apologyRes = evaluateMessageReputation(userId, 'Regretful', 'Пипка, прости пожалуйста, был не прав!');
  assert.ok(apologyRes.delta > 0);
  assert.equal(apologyRes.record.grudgeUntil, 0);
});

test('formats reputation context for prompt correctly', () => {
  const userId = `test-user-ctx-${Date.now()}`;
  const promptCtx = formatReputationPromptContext(userId, 'StalkerOne', false, false);
  assert.match(promptCtx, /СИСТЕМА ПАМЯТИ И РЕПУТАЦИИ ПИПКИ/);
  assert.match(promptCtx, /StalkerOne/);
  assert.match(promptCtx, /ТВОЯ ЛИНИЯ ПОВЕДЕНИЯ/);
});

test('generates valid reputation report and leaderboard', () => {
  const userId = `test-user-rep-${Date.now()}`;
  const report = generateReputationReport(userId, 'GoodFellow');
  assert.match(report, /Досье Pip-Buck/);
  assert.match(report, /Уровень доверия/);

  const top = getReputationLeaderboard();
  assert.match(top, /Доска почёта и розыска/);
  assert.match(top, /Любимчики/);
});
