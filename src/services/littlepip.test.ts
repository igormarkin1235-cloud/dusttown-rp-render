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

test('marks previously answered context as read archive and enforces anti-repetition rule', () => {
  const history = [
    { username: '@stalker1', text: 'Мы нашли яблочный сидр у рейдеров!', timestamp: Date.now() - 10000 },
    { username: '@stalker2', text: 'Пипка, ты тут?', timestamp: Date.now() - 8000 },
    { username: 'Ты (Литлпип)', text: 'Тут я! И сидр ваш трогать не собираюсь.', timestamp: Date.now() - 6000, isAssistant: true },
    { username: '@stalker1', text: 'Пипка, какая погода на Пустошах?', timestamp: Date.now() - 2000 }
  ];

  const prompt = buildLittlepipPrompt('Пипка, какая погода на Пустошах?', '@stalker1', 'chat', history);
  assert.match(prompt, /ПРОЧИТАННЫЙ АРХИВ ЧАТА/);
  assert.match(prompt, /ТВОЙ ПРЕДЫДУЩИЙ ОТВЕТ СТАЛКЕРАМ/);
  assert.match(prompt, /КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО повторять те же самые детали/);
  assert.match(prompt, /Текущее обращение от @stalker1: "Пипка, какая погода на Пустошах\?"/);
});

test('recognizes chat administrators and shows respect to the group owner', () => {
  const admins = [
    { userId: 1, username: '@MrWhitePio', displayName: 'MrWhitePio', isOwner: true, customTitle: 'Шериф' },
    { userId: 2, username: '@moderator', displayName: 'Deputy', isOwner: false, customTitle: 'Помощник' }
  ];

  const prompt = buildLittlepipPrompt(
    'Пипка, как обстановка?',
    '@MrWhitePio',
    'chat',
    [],
    '',
    admins,
    true,
    true
  );

  assert.match(prompt, /РУКОВОДСТВО И АДМИНИСТРАЦИЯ/);
  assert.match(prompt, /@MrWhitePio/);
  assert.match(prompt, /СОЗДАТЕЛЬ \/ ВЛАДЕЛЕЦ/);
});

test('extracts popular internet memes and direct media links', async () => {
  const { extractMemeTag, findMemeByQuery } = await import('./littlepipMemes');

  const chad = findMemeByQuery('gigachad');
  assert.equal(chad?.id, 'gigachad');
  assert.equal(chad?.badgeEmoji, '🗿');

  const rollSafe = findMemeByQuery('roll_safe');
  assert.equal(rollSafe?.id, 'roll_safe');

  const parsed = extractMemeTag('Это база, сталкер! [MEME: gigachad]');
  assert.equal(parsed.cleanText, 'Это база, сталкер!');
  assert.equal(parsed.meme?.id, 'gigachad');
  assert.match(parsed.mediaUrl || '', /imgflip|unsplash/);
});

test('generates a spontaneous random joke based on recent chat context', async () => {
  const { generateRandomJoke } = await import('./littlepipAgent');
  const joke = await generateRandomJoke('test-random-chat-123', undefined);
  assert.ok(joke.length > 10);
  assert.match(joke, /MEME/);
});

test('handles playful flirting and witty teasing gracefully', async () => {
  const { generateLittlepipText } = await import('./littlepipAgent');
  const deleteKey = process.env.GEMINI_API_KEY;
  const deleteGoogleKey = process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;

  try {
    const reply = await generateLittlepipText('Пипка, ты такая красивая и милая кобылка!', '@stalker', 'chat');
    assert.match(reply, /Pip-Buck|Макинтош|рогом|сидр|милашка|кобылка/i);
  } finally {
    if (deleteKey) process.env.GEMINI_API_KEY = deleteKey;
    if (deleteGoogleKey) process.env.GOOGLE_API_KEY = deleteGoogleKey;
  }
});

test('restricts meme photo attachments to explicit user requests', async () => {
  const { isMemeExplicitlyRequested, extractMemeTag } = await import('./littlepipMemes');
  
  assert.equal(isMemeExplicitlyRequested('Пипка, привет! Как дела?'), false);
  assert.equal(isMemeExplicitlyRequested('Пипка, скинь мем про админов'), true);
  assert.equal(isMemeExplicitlyRequested('покажи пикчу'), true);

  const withoutMedia = extractMemeTag('Отличный план! [MEME: roll_safe]', false);
  assert.equal(withoutMedia.cleanText, 'Отличный план!');
  assert.equal(withoutMedia.mediaUrl, undefined);

  const withMedia = extractMemeTag('Отличный план! [MEME: roll_safe]', true);
  assert.equal(withMedia.cleanText, 'Отличный план!');
  assert.ok(withMedia.mediaUrl?.includes('imgflip'));
});


