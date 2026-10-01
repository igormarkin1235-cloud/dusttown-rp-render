import assert from 'node:assert/strict';
import test from 'node:test';

import { getFallbackLittlepipReply, shouldLittlepipReactToMessage } from './littlepip';
import {
  buildLittlepipPrompt,
  getRecentLittlepipMessages,
  handleLittlepipUpdate,
  hasPipMention,
  parseLittlepipCommand
} from './littlepipAgent';

test('does not react to unrelated messages in a non-target group chat', () => {
  const shouldReact = shouldLittlepipReactToMessage({
    text: 'мда, опять это говно',
    isBotMessage: false,
    isGroupChat: true,
    chatTitle: 'Другой чат',
    botUsername: 'DustTown_RP_bot',
    mentionsBot: false,
    replyToBot: false,
  });

  assert.equal(shouldReact, false);
});

test('reacts only when the message directly addresses Littlepip by name in the DustTownCollective chat', () => {
  const shouldReact = shouldLittlepipReactToMessage({
    text: 'Пипка, ты тут?',
    isBotMessage: false,
    isGroupChat: true,
    chatTitle: 'DustTownCollective',
    botUsername: 'DustTown_RP_bot',
    mentionsBot: false,
    replyToBot: false,
  });

  assert.equal(shouldReact, true);
});

test('fallback reply changes based on the actual message instead of repeating the same canned line', () => {
  const angryReply = getFallbackLittlepipReply('пипка, ты чё сюда пишешь а не в чат?!', '@Chara');
  const hurtReply = getFallbackLittlepipReply('пипка, меня ранили, помоги', '@Chara');

  assert.notEqual(angryReply, hurtReply);
  assert.match(hurtReply.toLowerCase(), /помощ|ран|пустош|быстр/);
  assert.match(angryReply.toLowerCase(), /слышь|по делу|хочешь|влез|пипка/);
});

test('does not reply to unrelated messages unless the name is mentioned', async () => {
  const result = await handleLittlepipUpdate(
    {
      chatId: `unaddressed-test-${Date.now()}`,
      messageId: 42,
      userId: 123,
      username: '@tester',
      text: 'снова всё в говне, но это не про тебя',
      botUsername: 'DustTown_RP_bot'
    },
    async () => {
      throw new Error('sendMessage should not be called');
    }
  );

  assert.equal(result.handled, false);
});

test('recognizes a casual direct address and Telegram commands addressed to the bot username', () => {
  assert.equal(hasPipMention('Пипка приве!'), true);
  assert.equal(parseLittlepipCommand('/pip_start@DustTown_RP_bot'), 'pip_start');
  assert.equal(parseLittlepipCommand('/support@DustTown_RP_bot'), 'support');
});

test('keeps the ten latest preceding messages for conversation context', async () => {
  const chatId = `history-test-${Date.now()}`;
  const threadId = 19;

  for (let index = 0; index < 12; index += 1) {
    await handleLittlepipUpdate(
      {
        chatId,
        threadId,
        messageId: index + 1,
        userId: index + 100,
        username: `@user${index}`,
        text: `ordinary line ${index}`
      },
      async () => {
        throw new Error('sendMessage should not be called');
      }
    );
  }

  const recent = getRecentLittlepipMessages(chatId, threadId);
  assert.equal(recent.length, 10);
  assert.equal(recent[0].text, 'ordinary line 2');
  assert.equal(recent[9].text, 'ordinary line 11');

  const prompt = buildLittlepipPrompt('Пипка, привет!', '@tester', 'chat', recent);
  assert.match(prompt, /ordinary line 2/);
  assert.match(prompt, /ordinary line 11/);
  assert.match(prompt, /Текущее обращение от @tester: "Пипка, привет!"/);
  assert.doesNotMatch(prompt, /ordinary line 1\b/);

  const botQuestion = buildLittlepipPrompt('Пипка, какие функции у бота?', '@tester', 'chat');
  assert.match(botQuestion, /server\.ts/);
  assert.match(botQuestion, /src\/services\/storage\.ts/);
});
