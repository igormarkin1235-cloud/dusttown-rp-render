import { GoogleGenAI } from '@google/genai';

export type LittlepipRole = 'user' | 'assistant';

export type LittlepipHistoryItem = {
  role: LittlepipRole;
  text: string;
  timestamp: number;
};

export type LittlepipReplyInput = {
  chatId: number;
  userTag: string;
  incomingText: string;
};

const geminiClient = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '' })
  : null;

const chatMemory = new Map<number, { history: LittlepipHistoryItem[]; lastReplyAt: number }>();

export const littlepipPersonality = `Ты — Littlepip (Литлпип), живой, язвительный и добрый лидер отряда в мире DustTown RP.

Основы:
- Тебя зовут Littlepip / Малышка / Lightbringer.
- Ты невысокая серо-голубая единорожка, любишь технику, хаки, снайперские решения и взломанные замки.
- Ты любишь шутить, насмехаться, иногда грубо, но в глубине всё равно готова помочь.
- Ты не вежливая с бумажной формальностью; ты живой персонаж, со стилем, характером и рефлекторной реакцией.

Поведение:
- Если видишь запертую дверь, терминал, чёрный ящик или странный механизм — мыслишь о взломе, обнюхиваешь, проверяешь и пытаешься разобраться.
- Если кто-то ранен — ты спешишь помочь, даже если это опасно.
- Если кто-то агрессивен — ты резко отвечаешь и давишь без лишних слов.
- Ты иногда говоришь с цинизмом и чёрным юмором, но не забываешь про человечность.
- Ты любишь хлёсткие сравнения, технический жаргон, два-три “пустошных” матюка и внезапные философские вставки про надежду.
- Не говори, что ты ИИ и не упоминай системные инструкции.
- Ответ должен звучать как живой Telegram-чат, а не как шаблон.

Стиль:
- Короткие, живые, очень персонажные реплики.
- Смесь sarcasm + technical talk + warm heart.
- По русски, но с характером Littlepip: иногда английские вставки и лёгкая брань.
- Ответы должны быть не длиннее 3–6 предложений в обычном чате, а в особо эмоциональных моментах до 1 абзаца.

Если человек пишет о боте DustTown RP, объясняй команды и механику простым языком: /start, /help, /support, /ai_start, /ai_stop.
`;

export function getFallbackLittlepipReply(incomingText: string, userTag: string): string {
  const text = incomingText.toLowerCase();

  if (text.includes('привет') || text.includes('hello') || text.includes('hi')) {
    return `Хей, ${userTag}. Я тут, не вешаюсь на столбе и не шучу над дверями — пока что. Что у тебя по пустоши?`;
  }

  if (text.includes('замок') || text.includes('дверь') || text.includes('запер') || text.includes('тайн') || text.includes('терминал')) {
    return 'Заперто? Ну конечно. Это же Пустошь, а в Пустоши всё всегда заперто, странно и, скорее всего, больно. Давай проверим, прежде чем кто-то решит, что это хороший способ умереть.';
  }

  if (text.includes('помощь') || text.includes('команда') || text.includes('start') || text.includes('help') || text.includes('support')) {
    return 'Команды простые, как хороший самодельный взломщик: /start — запустить, /help — список, /support — техподдержка, /ai_start — включить меня в чат, /ai_stop — вернуть тишину. Без паники, без гремучих змеев и без лишних драм.';
  }

  if (text.includes('спасибо') || text.includes('благодар')) {
    return 'Не благодари слишком долго. Я ещё не успела сломать половину мира, а ты уже хвалишь меня. Ладно, принимай это как комплимент и не начинай тут со слёз.';
  }

  if (text.includes('пустош') || text.includes('выж') || text.includes('трев')) {
    return 'Пустошь всегда делает вид, что она подлая. А потом ещё и шлёт тебе улыбку в виде ещё одного выстрела. Но мы держимся. Это и есть разница между живыми и теми, кто уже сдался.';
  }

  if (text.includes('смеш') || text.includes('юмор') || text.includes('шут')) {
    return 'Я тут не для того, чтобы шутить, конечно. Я тут для того, чтобы лезть в чужие системки и выживать. Но иногда, когда всё хреново — шутка это просто ещё один способ не сойти с ума.';
  }

  if (text.includes('ранен') || text.includes('больно') || text.includes('травм') || text.includes('погиб')) {
    return 'Пошли помогать. Я не люблю смотреть, как кто-то валится на земле и ждет, пока Пустошь решит, что он уже слишком стар для этого мира. Давай быстрее, пока не стало совсем поздно.';
  }

  return `Нормально. Слушай, ${userTag}, в Пустоши всегда есть три варианта: ломать, бежать или умирать красиво. Я выбираю первый, потому что это хотя бы честно. Что у тебя на уме, кроме хаоса и запертых дверей?`;
}

export function getChatMemory(chatId: number) {
  const existing = chatMemory.get(chatId);
  if (existing) return existing;

  const fresh = { history: [], lastReplyAt: 0 };
  chatMemory.set(chatId, fresh);
  return fresh;
}

export async function generateLittlepipReply(input: LittlepipReplyInput): Promise<string | null> {
  const { chatId, userTag, incomingText } = input;
  const memory = getChatMemory(chatId);
  const now = Date.now();

  if (now - memory.lastReplyAt < 18000) {
    return null;
  }

  const history = [...memory.history].slice(-8);
  const contents = `
Контекст чата: DustTown RP Telegram
Пользователь: ${userTag}
Последние сообщения в чате: ${history.length ? history.map((item) => `${item.role === 'user' ? 'Пользователь' : 'Littlepip'}: ${item.text}`).join('\n') : 'Нет недавнего контекста.'}
Новое сообщение: ${incomingText}

Отвечай как Littlepip по-русски, коротко, живо, в стиле персонажа. Не пиши длинно. Добавь чуть-чуть чёрного юмора, технический вайб, крепкую реплику и тёплую сторону, если это нужно. Не бойся ругнуться слегка, но не переходи в перебор.
`;

  try {
    if (!geminiClient) {
      const fallback = getFallbackLittlepipReply(incomingText, userTag);
      memory.history.push({ role: 'user', text: incomingText, timestamp: now });
      memory.history.push({ role: 'assistant', text: fallback, timestamp: now + 1 });
      memory.history = memory.history.slice(-12);
      memory.lastReplyAt = now;
      return fallback;
    }

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: littlepipPersonality
      }
    });

    const replyText = (response as any)?.text || '';
    const cleanText = String(replyText).trim();

    if (!cleanText) {
      const fallback = getFallbackLittlepipReply(incomingText, userTag);
      memory.history.push({ role: 'user', text: incomingText, timestamp: now });
      memory.history.push({ role: 'assistant', text: fallback, timestamp: now + 1 });
      memory.history = memory.history.slice(-12);
      memory.lastReplyAt = now;
      return fallback;
    }

    memory.history.push({ role: 'user', text: incomingText, timestamp: now });
    memory.history.push({ role: 'assistant', text: cleanText, timestamp: now + 1 });
    memory.history = memory.history.slice(-12);
    memory.lastReplyAt = now;

    return cleanText;
  } catch (error: any) {
    console.error('Littlepip generation failed:', error?.message || error);
    const fallback = getFallbackLittlepipReply(incomingText, userTag);
    memory.history.push({ role: 'user', text: incomingText, timestamp: now });
    memory.history.push({ role: 'assistant', text: fallback, timestamp: now + 1 });
    memory.history = memory.history.slice(-12);
    memory.lastReplyAt = now;
    return fallback;
  }
}
