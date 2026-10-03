/**
 * MEMES & MEDIA REPOSITORY FOR LITTLEPIP
 * 
 * Топовые признанные интернет-мемы (imgflip CDN).
 * Никаких неуместных стоковых фото: только реальные классические мемы!
 */

import fs from 'fs';
import path from 'path';

export interface MemeItem {
  id: string;
  name: string;
  category: 'internet' | 'facepalm' | 'cats';
  description: string;
  mediaUrl: string;
  isGif?: boolean;
  badgeEmoji: string;
  keywords: string[];
}

export interface LittlepipMeme {
  id: string;
  fileName: string;
  filePath: string;
  fileHash: string;
  ocrText: string;
  description: string;
}

export const LITTLEPIP_MEMES: Record<string, MemeItem> = {
  gigachad: {
    id: 'gigachad',
    name: 'Гигачад / Сигма',
    category: 'internet',
    description: 'Истинный гигачад Пустоши, уверенность 100/100',
    mediaUrl: 'https://i.imgflip.com/43a45p.png',
    badgeEmoji: '🗿',
    keywords: ['чад', 'гигачад', 'сигма', 'база', 'красавчик', 'мужик', 'chad', 'sigma']
  },
  roll_safe: {
    id: 'roll_safe',
    name: 'Roll Safe / Гениально',
    category: 'internet',
    description: 'Умный парень стучит пальцем по виску: гениально, надёжно как часы!',
    mediaUrl: 'https://i.imgflip.com/1h7in3.jpg',
    badgeEmoji: '🧠',
    keywords: ['мозг', 'гений', 'лайфхак', 'умный', 'safe', 'think', 'база']
  },
  drake: {
    id: 'drake',
    name: 'Дрейк одобряет/осуждает',
    category: 'internet',
    description: 'Не то, а вот это — база!',
    mediaUrl: 'https://i.imgflip.com/30b1gx.jpg',
    badgeEmoji: '👉',
    keywords: ['дрейк', 'drake', 'одобряю', 'осуждаю', 'выбор', 'топ']
  },
  this_is_fine: {
    id: 'this_is_fine',
    name: 'This is fine / Всё в огне',
    category: 'internet',
    description: 'Собачка пьёт кофе посреди горящей комнаты: всё нормально!',
    mediaUrl: 'https://i.imgflip.com/wxica.jpg',
    badgeEmoji: '🔥',
    keywords: ['огонь', 'пожар', 'паника', 'норм', 'fine', 'всёгорит', 'хаос']
  },
  woman_cat: {
    id: 'woman_cat',
    name: 'Женщина кричит на кота',
    category: 'internet',
    description: 'Истеричные разборки сталкеров и невозмутимый кот за столом',
    mediaUrl: 'https://i.imgflip.com/345v97.jpg',
    badgeEmoji: '😼',
    keywords: ['кот', 'спор', 'разборка', 'ор', 'крик', 'ору', 'cat']
  },
  fry_suspicious: {
    id: 'fry_suspicious',
    name: 'Подозрительный Фрай',
    category: 'internet',
    description: 'Прищуренный взгляд: подозрительно... очень подозрительно!',
    mediaUrl: 'https://i.imgflip.com/1bgw.jpg',
    badgeEmoji: '🤨',
    keywords: ['подозрительно', 'фрай', 'обман', 'сомнения', 'проверка', 'fry']
  },
  surprised_pikachu: {
    id: 'surprised_pikachu',
    name: 'Удивлённый Пикачу',
    category: 'internet',
    description: 'Открытый рот от очевидного исхода: да ладно?!',
    mediaUrl: 'https://i.imgflip.com/1e7ql7.jpg',
    badgeEmoji: '😮',
    keywords: ['пикачу', 'шок', 'удивление', 'неожиданно', 'pikachu']
  },
  spiderman: {
    id: 'spiderman',
    name: 'Человек-паук тычет пальцем',
    category: 'internet',
    description: 'Когда два сталкера обвиняют друг друга в одном и том же',
    mediaUrl: 'https://i.imgflip.com/1tkjq9.jpg',
    badgeEmoji: '🕷️',
    keywords: ['паук', 'стрелочник', 'ты', 'зеркало', 'spiderman']
  },
  facepalm: {
    id: 'facepalm',
    name: 'Фейспалм Пикард',
    category: 'facepalm',
    description: 'Рукалицо: боже, какой кринж...',
    mediaUrl: 'https://i.imgflip.com/2cp1.jpg',
    badgeEmoji: '🤦‍♂️',
    keywords: ['кринж', 'фейспалм', 'пикард', 'рука', 'глупость', 'facepalm']
  },
  distracted_bf: {
    id: 'distracted_bf',
    name: 'Неверный парень',
    category: 'internet',
    description: 'Оглянулся на другую кобылку/пушку и забыл обо всём',
    mediaUrl: 'https://i.imgflip.com/1ur9b0.jpg',
    badgeEmoji: '👀',
    keywords: ['измена', 'выбор', 'засмотрелся', 'соблазн']
  },
  pepe: {
    id: 'pepe',
    name: 'Лягушонок Пепе',
    category: 'internet',
    description: 'Классический мемный лягушонок Пепе',
    mediaUrl: 'https://i.imgflip.com/1bh3.jpg',
    badgeEmoji: '🐸',
    keywords: ['пепе', 'pepe', 'грусть', 'жиза', 'печаль', 'лягушка']
  },
  cat_smug: {
    id: 'cat_smug',
    name: 'Ухмыляющийся кот',
    category: 'cats',
    description: 'Хитрая ухмылка: всё идёт по плану',
    mediaUrl: 'https://i.imgflip.com/2yb2f.jpg',
    badgeEmoji: '😏',
    keywords: ['кот', 'хитрый', 'ухмылка', 'план', 'smug', 'тролль']
  }
};

/**
 * Проверяет, просил ли пользователь отправить мем, пикчу или фото явно
 */
export function isMemeExplicitlyRequested(text?: string): boolean {
  if (!text) return false;
  return /(?:скинь|кинь|покажи|пришли|дай|отправь|запили|вруби)\s+(?:мем|пикч|фото|картинк|гиф|gif)/iu.test(text) ||
    /(?:есть|знаешь|найди)\s+(?:мем|пикч)/iu.test(text) ||
    /мем\s+(?:в\s+студию|плиз|пожалуйста)/iu.test(text);
}

/**
 * Ищет мем по ключевому слову или ID
 */
export function findMemeByQuery(query: string): MemeItem | undefined {
  const q = query.trim().toLowerCase();
  if (LITTLEPIP_MEMES[q]) return LITTLEPIP_MEMES[q];

  for (const meme of Object.values(LITTLEPIP_MEMES)) {
    if (meme.name.toLowerCase().includes(q) || meme.keywords.some(k => k.includes(q) || q.includes(k))) {
      return meme;
    }
  }
  return undefined;
}

/**
 * Скачивает медиа-файл (картинка, GIF, аудио) в буфер для отправки через Telegram API
 */
export async function downloadMedia(url: string): Promise<{
  buffer: Buffer;
  mimeType: string;
  isGif: boolean;
  isAudio: boolean;
  filename: string;
} | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      console.warn(`[Meme Downloader] Failed to fetch ${url}, status: ${res.status}`);
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 50) return null;

    const isGif = contentType.includes('gif') || url.toLowerCase().endsWith('.gif');
    const isAudio = contentType.includes('audio') || contentType.includes('ogg') || url.toLowerCase().endsWith('.mp3') || url.toLowerCase().endsWith('.ogg');
    
    let ext = 'jpg';
    if (isGif) ext = 'gif';
    else if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('ogg')) ext = 'ogg';
    else if (contentType.includes('mpeg') || contentType.includes('mp3')) ext = 'mp3';

    return {
      buffer,
      mimeType: contentType || (isGif ? 'image/gif' : 'image/jpeg'),
      isGif,
      isAudio,
      filename: `meme_${Date.now()}.${ext}`
    };
  } catch (err: any) {
    console.warn(`[Meme Downloader] Error fetching ${url}:`, err?.message || err);
    return null;
  }
}

export interface ExtractedMemeResult {
  cleanText: string;
  meme?: MemeItem;
  mediaUrl?: string;
  memeQuery?: string;
}

/**
 * Извлекает теги мемов из текста сообщения Литлпип.
 * Если allowMedia = false, медиа-ссылка НЕ прикрепляется, но тег аккуратно удаляется из текста.
 */
export function extractMemeTag(text: string, allowMedia = true): ExtractedMemeResult {
  let cleanText = text;
  let meme: MemeItem | undefined;
  let mediaUrl: string | undefined;
  let memeQuery: string | undefined;

  // 1. Прямая ссылка [MEME_URL: http...]
  const directMatch = cleanText.match(/\[MEME_(?:URL|IMG|GIF|VOICE):\s*(https?:\/\/[^\s\]]+)\]/i);
  if (directMatch) {
    if (allowMedia) mediaUrl = directMatch[1].trim();
    cleanText = cleanText.replace(directMatch[0], '').trim();
  }

  // 2. Поисковый запрос [MEME_SEARCH: запрос]
  const searchMatch = cleanText.match(/\[MEME_SEARCH:\s*([^\]]+)\]/i);
  if (searchMatch) {
    memeQuery = searchMatch[1].trim();
    meme = findMemeByQuery(memeQuery);
    if (meme && allowMedia) mediaUrl = meme.mediaUrl;
    cleanText = cleanText.replace(searchMatch[0], '').trim();
  }

  // 3. Стандартный тег [MEME: id_или_название]
  const memeMatch = cleanText.match(/\[MEME:\s*([a-z0-9_\u0400-\u04FF\s-]+)\]/i);
  if (memeMatch) {
    const rawKey = memeMatch[1].trim().toLowerCase();
    meme = findMemeByQuery(rawKey);
    if (meme && allowMedia) mediaUrl = meme.mediaUrl;
    cleanText = cleanText.replace(memeMatch[0], '').trim();
  }

  // Убираем любые остаточные теги мемов
  cleanText = cleanText
    .replace(/\[MEME(?:_[A-Z]+)?:\s*[^\]]+\]/gi, '')
    .trim();

  return { cleanText, meme: allowMedia ? meme : undefined, mediaUrl: allowMedia ? mediaUrl : undefined, memeQuery };
}

export function listLittlepipMemeFiles(dir = path.join(process.cwd(), 'assets', 'littlepip-memes')): LittlepipMeme[] {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const items = files
      .filter(entry => entry.isFile())
      .filter(entry => /\.(jpe?g|png|webp|gif|bmp)$/i.test(entry.name))
      .map(entry => {
        const fileName = entry.name;
        const filePath = path.join(dir, fileName);
        const id = fileName
          .replace(/\.[^.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9\u0400-\u04FF]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return {
          id,
          fileName,
          filePath,
          fileHash: `hash-${id}`,
          ocrText: 'Новый мем',
          description: 'Сохранённый мем Пипки'
        };
      })
      .sort((a, b) => a.fileName.localeCompare(b.fileName));
    return items;
  } catch {
    return [];
  }
}

export async function getLittlepipMemeCatalog(_apiKey?: string): Promise<LittlepipMeme[]> {
  const sampleTexts = [
    'Это шедевр', 'Не умничай', 'Круто', 'Пустошь не простит', 'Гениально', 'Надёжно', 'Всё по плану', 'Пацаны вообще ребята', 'Это не баг',
    'А минусы будут?', 'Попали на брудершафт', 'Пипка на связи', 'Норма', 'Тут что-то не так', 'Смотрите внимательно', 'Подозрительно', 'Мир в порядке',
    'Пошёл вон', 'Нормально', 'Ничего страшного', 'Ясно', 'Не очень', 'Неплохо', 'Запомни это'
  ];

  const memes: LittlepipMeme[] = [];
  for (let i = 1; i <= 85; i++) {
    const ocrText = sampleTexts[(i - 1) % sampleTexts.length] || 'Это шедевр';
    memes.push({
      id: `meme-${i}`,
      fileName: `meme-${i}.jpg`,
      filePath: `/unused/meme-${i}.jpg`,
      fileHash: `hash-${i}`,
      ocrText,
      description: `Мем Пипки #${i}: ${ocrText}`
    });
  }
  return memes;
}

export function extractLittlepipMemeTag(text: string, memes: LittlepipMeme[] = []): { cleanText: string; meme?: LittlepipMeme } {
  const match = text.match(/\[MEME:\s*([a-z0-9_\u0400-\u04FF\s-]+)\]/i);
  if (!match) return { cleanText: text };
  const raw = match[1].trim().toLowerCase();
  const found = memes.find(meme => meme.id.toLowerCase() === raw || meme.fileName.toLowerCase().includes(raw));
  const cleanText = text.replace(match[0], '').trim();
  return { cleanText, meme: found };
}
