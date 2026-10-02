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

test('warns after four media messages in less than one second, not at one second', () => {
  const userId = `media-test-${Date.now()}`;
  const chatId = `chat-${Date.now()}`;

  assert.equal(checkMessageForViolations('', '@tester', userId, chatId, true, 1000).isViolation, false);
  assert.equal(checkMessageForViolations('', '@tester', userId, chatId, true, 1500).isViolation, false);
  assert.equal(checkMessageForViolations('', '@tester', userId, chatId, true, 1999).isViolation, false);
  assert.equal(checkMessageForViolations('', '@tester', userId, chatId, true, 2000).isViolation, false);

  const rapidUserId = `${userId}-rapid`;
  assert.equal(checkMessageForViolations('', '@tester', rapidUserId, chatId, true, 1000).isViolation, false);
  assert.equal(checkMessageForViolations('', '@tester', rapidUserId, chatId, true, 1200).isViolation, false);
  assert.equal(checkMessageForViolations('', '@tester', rapidUserId, chatId, true, 1500).isViolation, false);
  const fourth = checkMessageForViolations('', '@tester', rapidUserId, chatId, true, 1999);
  assert.equal(fourth.isViolation, true);
  assert.equal(fourth.ruleNumber, 4);
});
