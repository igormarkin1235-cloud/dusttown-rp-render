import assert from 'node:assert/strict';
import test from 'node:test';

import { checkMessageForViolations } from './rulesModerator';

test('detects representative violations for the text-based rules', () => {
  const cases: Array<[string, number]> = [
    ['Ты дебил', 1],
    ['Порно в общий чат', 2],
    ['Видео только для 18+', 2],
    ['Подписывайтесь на мой канал t.me/example_channel', 3],
    ['DustTown — помойка', 5],
    ['DustTown — скам', 8],
    ['Не хочу обсуждать политику', 6],
    ['Гитлер', 6],
    ['Сталин упомянут в истории', 6],
    ['Сжечь Коран', 7],
    ['Админы украли все деньги проекта DustTown', 8],
    ['Где купить кокаин', 9],
    ['Рассказ о зависимости и насилии в реальной жизни', 9],
    ['Обсудим преступление вне лора', 9]
  ];

  for (const [text, expectedRule] of cases) {
    const result = checkMessageForViolations(text, '@tester');
    assert.equal(result.isViolation, true, text);
    assert.equal(result.ruleNumber, expectedRule, text);
  }
});

test('does not flag constructive feedback or Fallout-lore references as violations', () => {
  assert.equal(
    checkMessageForViolations('В проекте неудобно устроены уведомления, это стоит улучшить', '@tester').isViolation,
    false
  );
  assert.equal(
    checkMessageForViolations('В Fallout лоре есть ментаты и психо', '@tester').isViolation,
    false
  );
  assert.equal(
    checkMessageForViolations('В игровом лоре герой переживает зависимость', '@tester').isViolation,
    false
  );
});

test('does not flag 4-5 photos, warns on mass rapid media flood (16+)', () => {
  const userId = `media-test-${Date.now()}`;
  const chatId = `chat-${Date.now()}`;

  // 4-5 photos are legitimate RP / fanart sharing and should NOT be flagged
  for (let i = 0; i < 5; i++) {
    assert.equal(checkMessageForViolations('', '@tester', userId, chatId, true, 1000 + i * 100).isViolation, false);
  }

  // Mass raid / flood (16+ rapid media messages outside albums)
  const rapidUserId = `${userId}-rapid`;
  for (let i = 0; i < 15; i++) {
    assert.equal(checkMessageForViolations('', '@tester', rapidUserId, chatId, true, 1000 + i * 50).isViolation, false);
  }
  const sixteenth = checkMessageForViolations('', '@tester', rapidUserId, chatId, true, 1800);
  assert.equal(sixteenth.isViolation, true);
  assert.equal(sixteenth.ruleNumber, 4);
});
