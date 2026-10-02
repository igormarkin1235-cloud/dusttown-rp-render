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
import { LittlepipMeme } from './littlepipMemes';

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

test('warns about a rule violation even when Pipka is not mentioned', async () => {
  let sentText = '';
  const result = await handleLittlepipUpdate(
    {
      chatId: `moderation-test-${Date.now()}`,
      messageId: 43,
      userId: 124,
      username: '@tester',
      text: 'Ты идиот'
    },
    async (_chatId, text) => {
      sentText = text;
    }
  );

  assert.equal(result.handled, true);
  assert.equal(result.action, 'moderation_warning');
  assert.match(sentText, /правила №1/i);
  assert.match(sentText, /остановись/);
});

test('does not mistake casual profanity or constructive project feedback for a violation', async () => {
  for (const text of ['мда, опять это говно', 'В проекте неудобно устроены уведомления, это стоит улучшить']) {
    const result = await handleLittlepipUpdate(
      {
        chatId: `moderation-safe-${Date.now()}-${text.length}`,
        messageId: 44,
        userId: 125,
        username: '@tester',
        text
      },
      async () => {
        throw new Error('sendMessage should not be called');
      }
    );

    assert.equal(result.handled, false);
  }
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

  const adminPrompt = buildLittlepipPrompt(
    'Пипка, привет!',
    '@admin',
    'chat',
    [],
    '',
    [{ userId: 7, username: '@admin', displayName: 'Admin', isOwner: true }],
    true,
    true
  );
  assert.match(adminPrompt, /администраторы чата/i);
  assert.match(adminPrompt, /иногда легко флиртуй/);

  const meme: LittlepipMeme = {
    id: 'meme-1',
    fileName: 'meme-1.jpg',
    filePath: '/unused/meme-1.jpg',
    fileHash: 'hash',
    ocrText: 'Когда починил сервер с первого раза',
    description: 'Смешанная реакция удивления и радости'
  };
  const memePrompt = buildLittlepipPrompt('Пипка, бот заработал!', '@tester', 'chat', [], '', [], false, false, [meme]);
  assert.match(memePrompt, /Когда починил сервер с первого раза/);
  assert.match(memePrompt, /\[MEME:ID\]/);
});
