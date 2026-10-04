import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasBlackjackTrigger,
  hasAggressionTowardsPipka,
  isBlackjackSender,
  handleLittlepipUpdate,
  markBlackjackCalled,
  resetBlackjackWaiting
} from './littlepipAgent';
import { getBlackjackConfig, updateBlackjackUsername } from './littlepipConfig';

test('detects Blackjack triggers correctly', () => {
  assert.equal(hasBlackjackTrigger('Блэкджек, глянь сюда'), true);
  assert.equal(hasBlackjackTrigger('Блэки, вылезай из бара'), true);
  assert.equal(hasBlackjackTrigger('Джеки, разберись с ним'), true);
  assert.equal(hasBlackjackTrigger('позови блэкджек'), true);
  assert.equal(hasBlackjackTrigger('Blackjack, take him down'), true);
  assert.equal(hasBlackjackTrigger('просто обычный текст без имени'), false);
});

test('detects aggression and threats towards Pipka', () => {
  assert.equal(hasAggressionTowardsPipka('В банку пипку'), true);
  assert.equal(hasAggressionTowardsPipka('запихну тебе в карман, будешь сидеть'), true);
  assert.equal(hasAggressionTowardsPipka('Проверить пробитие брони анти-мех... На тебе'), true);
  assert.equal(hasAggressionTowardsPipka('я тебя на запчасти разберу'), true);
  assert.equal(hasAggressionTowardsPipka('Пипка опять померла?'), true);
  assert.equal(hasAggressionTowardsPipka('Привет, как твои дела?'), false);
});

test('identifies Blackjack sender and config updates', () => {
  updateBlackjackUsername('@Blackjack_test_bot');
  const cfg = getBlackjackConfig();
  assert.equal(cfg.username, '@Blackjack_test_bot');

  assert.equal(isBlackjackSender('@Blackjack_test_bot', 999, true), true);
  assert.equal(isBlackjackSender('Blackjack_test_bot', 999, true), true);
  assert.equal(isBlackjackSender('Джеки', 999, true), true);
  assert.equal(isBlackjackSender('Обычный_Сталкер', 101, false), false);
});

test('BOT LOOP GUARD: Pipka strictly remains silent on Blackjack response', async () => {
  updateBlackjackUsername('@SecurityBlackjack');

  const sentReplies: string[] = [];
  const fakeSender = async (_chatId: any, text: string) => {
    sentReplies.push(text);
    return { ok: true };
  };

  // 1. Mark that Pipka called Blackjack
  markBlackjackCalled(12345);

  // 2. Blackjack sends a message
  const result = await handleLittlepipUpdate(
    {
      chatId: 12345,
      messageId: 501,
      userId: 99,
      username: '@SecurityBlackjack',
      text: 'Спокойно, Пипка! Я уже взвела курок револьвера. Кто тут права качает?',
      botUsername: 'DustTown_RP_bot',
      isSenderBot: true
    },
    fakeSender
  );

  // 3. Pipka must NOT reply to Blackjack
  assert.equal(result.handled, true);
  assert.equal(result.replyText || '', '');
  assert.equal(sentReplies.length, 0);
});
