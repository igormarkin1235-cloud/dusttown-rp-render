import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLittlepipPrompt,
  getRecentLittlepipMessages,
  generateLittlepipText,
  handleLittlepipUpdate,
  hasPipMention,
  parseLittlepipCommand
} from './littlepipAgent';

test('does not treat unrelated messages as Pipka mentions', () => {
  assert.equal(hasPipMention('мда, опять это говно'), false);
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

test('generates a local reply without either Gemini API key', async () => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;

  try {
    const reply = await generateLittlepipText('Пипка, привет!', '@tester', 'chat');

    assert.match(reply, /Привет, @tester/);
    assert.match(reply, /на связи/);
  } finally {
    if (geminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = geminiKey;
    if (googleKey === undefined) delete process.env.GOOGLE_API_KEY;
    else process.env.GOOGLE_API_KEY = googleKey;
  }
});

test('provides embedded technical support without an API key', async () => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;

  try {
    const reply = await generateLittlepipText('Пипка, бот не работает, вот ошибка', '@tester', 'support');

    assert.match(reply, /не вижу журналы/);
    assert.match(reply, /точный текст ошибки/);
  } finally {
    if (geminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = geminiKey;
    if (googleKey === undefined) delete process.env.GOOGLE_API_KEY;
    else process.env.GOOGLE_API_KEY = googleKey;
  }
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
