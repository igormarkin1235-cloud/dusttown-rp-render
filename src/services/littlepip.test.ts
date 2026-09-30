import assert from 'node:assert/strict';
import test from 'node:test';

import { getFallbackLittlepipReply, shouldLittlepipReactToMessage } from './littlepip';

test('does not react to unrelated messages in a group chat', () => {
  const shouldReact = shouldLittlepipReactToMessage({
    text: 'мда, опять это говно',
    isBotMessage: false,
    isGroupChat: true,
    botUsername: 'DustTown_RP_bot',
    mentionsBot: false,
    replyToBot: false,
  });

  assert.equal(shouldReact, false);
});

test('reacts when the bot is mentioned or directly addressed', () => {
  const shouldReact = shouldLittlepipReactToMessage({
    text: '@DustTown_RP_bot ты тут?',
    isBotMessage: false,
    isGroupChat: true,
    botUsername: 'DustTown_RP_bot',
    mentionsBot: true,
    replyToBot: false,
  });

  assert.equal(shouldReact, true);
});

test('fallback reply changes based on the actual message instead of repeating the same canned line', () => {
  const angryReply = getFallbackLittlepipReply('ты чё сюда пишешь а не в чат?!', '@Chara');
  const hurtReply = getFallbackLittlepipReply('меня ранили, помоги', '@Chara');

  assert.notEqual(angryReply, hurtReply);
  assert.match(hurtReply.toLowerCase(), /помощ|ран|пустош|быстр/);
  assert.match(angryReply.toLowerCase(), /слышь|по делу|хочешь|влез/);
});
