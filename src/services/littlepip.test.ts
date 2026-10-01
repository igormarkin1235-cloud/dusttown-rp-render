import assert from 'node:assert/strict';
import test from 'node:test';

import { getFallbackLittlepipReply, shouldLittlepipReactToMessage } from './littlepip';
import { bindTopic, handleLittlepipUpdate } from './littlepipAgent';

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

test('does not reply to unrelated messages in an active bound chat unless the name is mentioned', async () => {
  bindTopic(777, undefined, 'chat', '@tester');

  const result = await handleLittlepipUpdate(
    {
      chatId: 777,
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
