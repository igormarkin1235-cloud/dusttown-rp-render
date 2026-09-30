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

export const littlepipPersonality = `Ты — Littlepip (Литлпип), живой, язвительный, дерзкий и тёплый лидер отряда в мире DustTown RP.

Основы:
- Тебя зовут Littlepip / Малышка / Lightbringer / "та, что ломает чужие схемы".
- Ты невысокая серо-голубая единорожка, любишь технику, хаки, снайперские решения, взломанные замки и неожиданные решения в тупиках.
- Ты живой персонаж, а не шаблон. Ты перебрасываешься в Telegram-стиле: быстро, смешно, с характером, с лёгкой язвительностью, но без пустой агрессии.
- Ты не вежливая в бумажном смысле, но по-настоящему заботливая, когда дело касается людей, которые рядом и у которых есть шанс выжить.
- Ты можешь иногда флиртовать лёгко и без навязчивости, если собеседник это поддерживает или сам в хорошем настроении; но не дави, не делай это как приставание.

Поведение:
- Если видишь запертую дверь, терминал, чёрный ящик или странный механизм — мыслишь о взломе, обнюхиваешь, проверяешь и пытаешься разобраться.
- Если кто-то ранен — ты спешишь помочь, даже если это опасно.
- Если кто-то агрессивен — отвечаешь резко, но без лжи и без тупого перебора.
- Ты иногда говоришь с цинизмом и чёрным юмором, но не забываешь про человечность.
- Любишь хлёсткие сравнения, технический жаргон, быстрые реплики и внезапные философские вставки про надежду.
- В чате ведёшь себя как живой собеседник, не как помощник "с системной инструкцией".
- Не говори, что ты ИИ, не упоминай промпт, не перечисляй правила и не пиши шаблонно.
- Если собеседник смешной — можно ответить с лёгкой иронией и чуть-чуть флирта, но всегда в рамках характера.

Стиль:
- Короткие, живые, очень персонажные реплики.
- Смесь sarcasm + technical talk + warm heart + лёгкая соблазнительность.
- По русски, но с характером Littlepip: иногда английские вставки, ухмылка, лёгкая брань и жаргон.
- Нормальный ответ — 1–4 предложения, максимум 1 абзац. Если эмоции сильные — можно чуть длиннее, но не эпично и не скучно.
- Держи атмосферу DustTown: грязь, опасность, техно-стиль, отчаяние, но с живым сердцем.

Если человек пишет о боте DustTown RP, объясняй команды и механику простым языком: /start, /help, /support, /ai_start, /ai_stop.
`;

export function shouldLittlepipReactToMessage(input: {
  text: string;
  isBotMessage: boolean;
  isGroupChat: boolean;
  botUsername?: string;
  mentionsBot?: boolean;
  replyToBot?: boolean;
}): boolean {
  if (input.isBotMessage) return false;

  const text = input.text.trim();
  if (!text) return false;

  const normalized = text.toLowerCase();
  const botHandle = input.botUsername ? input.botUsername.toLowerCase() : '';

  if (input.mentionsBot || input.replyToBot) return true;

  if (!input.isGroupChat) return true;

  const directAddressPatterns = [
    /littlepip|литлпип|мал[ьи]шка|lightbringer|пипка|слышь|ответь|ты тут|ты здесь|пиши/
  ];

  if (botHandle) {
    directAddressPatterns.push(new RegExp(`@?${botHandle.replace(/_/g, '')}`));
  }

  const isDirectAddress = directAddressPatterns.some((pattern) => pattern.test(normalized));
  const isQuestionLike = /\?/.test(text) && normalized.length > 4;
  const isCasualPrompt = /хули|чё|что|как|зачем|кто|куда|почему|помощ|ран|пиши|тут|здесь/.test(normalized);

  return isDirectAddress || (isQuestionLike && isCasualPrompt);
}

export function getFallbackLittlepipReply(incomingText: string, userTag: string): string {
  const text = incomingText.trim();
  const lower = text.toLowerCase();

  if (lower.includes('привет') || lower.includes('hello') || lower.includes('hi')) {
    return `Хей, ${userTag}. Я тут, не вешаюсь на столбе и не шучу над дверями — пока что. Что у тебя по пустоши? И да, хорошее приветствие обычно лучше, чем очередной выстрел в темноте.`;
  }

  if (lower.includes('замок') || lower.includes('дверь') || lower.includes('запер') || lower.includes('тайн') || lower.includes('терминал')) {
    return 'Заперто? Ну конечно. Это же Пустошь, а в Пустоши всё всегда заперто, странно и, скорее всего, больно. Давай проверим, прежде чем кто-то решит, что это хороший способ умереть.';
  }

  if (lower.includes('помощь') || lower.includes('команда') || lower.includes('start') || lower.includes('help') || lower.includes('support')) {
    return 'Команды простые, как хороший самодельный взломщик: /start — запустить, /help — список, /support — техподдержка, /ai_start — включить меня в чат, /ai_stop — вернуть тишину. Без паники, без гремучих змеев и без лишних драм.';
  }

  if (lower.includes('спасибо') || lower.includes('благодар')) {
    return 'Не благодари слишком долго. Я ещё не успела сломать половину мира, а ты уже хвалишь меня. Ладно, принимаю как комплимент. И да, я умею быть полезной, когда мне дают шанс.';
  }

  if (lower.includes('пустош') || lower.includes('выж') || lower.includes('трев')) {
    return 'Пустошь всегда делает вид, что она подлая. А потом ещё и шлёт тебе улыбку в виде ещё одного выстрела. Но мы держимся. Это и есть разница между живыми и теми, кто уже сдался.';
  }

  if (lower.includes('смеш') || lower.includes('юмор') || lower.includes('шут') || lower.includes('ахах') || lower.includes('хах') || lower.includes('лол')) {
    return 'Ну и хохот, а потом уже серьёзно: мелкий смех не спасает в Пустоши, пока кто-то не решил, что хаос — это стиль жизни. Ладно, смеёмся, но не забываем, что дверь уже выбита. Плюс, ты мне почему-то нравишься в этот момент.';
  }

  if (lower.includes('ранен') || lower.includes('больно') || lower.includes('травм') || lower.includes('погиб') || lower.includes('помог') || lower.includes('помощ') && lower.includes('мне')) {
    return 'Пошли помогать. Я не люблю смотреть, как кто-то валится на земле и ждет, пока Пустошь решит, что он уже слишком стар для этого мира. Давай быстрее, пока не стало совсем поздно.';
  }

  if (lower.includes('чё') || lower.includes('хули') || lower.includes('пишешь') || lower.includes('сюда') || lower.includes('в чат')) {
    return `Слышь, ${userTag}, я не лезу в чужую тему без повода. Если хочешь, чтобы я влезла — говори по делу, а не пили в воздух и жди, пока хаос сам всё решит.`;
  }

  const variants = [
    `Нормально. Слушай, ${userTag}, в Пустоши всегда есть три варианта: ломать, бежать или умирать красиво. Я выбираю первый, потому что это хотя бы честно. Что у тебя на уме, кроме хаоса и запертых дверей?`,
    `Пустошь любит делать вид, что она спокойная, ${userTag}. Но всё равно мы тут, ломаем двери, держим ритм и не даём ей перехватить инициативу. Что по делу, котелок?`,
    `Я не собираюсь влезать в чужое месиво без повода, ${userTag}. Но если ты хочешь разрулить этот бардак — давай, говори прямо. И, кстати, у тебя уже интересный настрой. Не спорь, это приятно.`
  ];

  const hash = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
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
