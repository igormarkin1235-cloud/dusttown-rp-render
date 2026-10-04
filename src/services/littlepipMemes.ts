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
  category: 'internet' | 'facepalm' | 'cats' | 'catalog';
  description: string;
  mediaUrl: string;
  filePath?: string;
  isGif?: boolean;
  isAudio?: boolean;
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
 * Загрузка 85 каталожных мемов из assets/littlepip-memes/catalog.json
 */
let catalogMemesCache: Record<string, MemeItem> | null = null;

export function loadCatalogMemes(): Record<string, MemeItem> {
  if (catalogMemesCache) return catalogMemesCache;

  const result: Record<string, MemeItem> = {};
  const possiblePaths = [
    path.join(process.cwd(), 'assets', 'littlepip-memes', 'catalog.json'),
    path.join(process.cwd(), 'repo', 'assets', 'littlepip-memes', 'catalog.json'),
    path.join(__dirname, '..', '..', 'assets', 'littlepip-memes', 'catalog.json')
  ];

  let catalogPath = possiblePaths.find(p => fs.existsSync(p));

  if (catalogPath) {
    try {
      const content = fs.readFileSync(catalogPath, 'utf-8');
      const data = JSON.parse(content);
      const items = Array.isArray(data.memes) ? data.memes : [];
      const memesDir = path.dirname(catalogPath);

      for (const m of items) {
        if (!m || !m.id) continue;
        const id = String(m.id).toLowerCase();
        const ocrLower = (m.ocrText || '').toLowerCase();
        const filePath = path.join(memesDir, m.fileName);

        const words = (ocrLower + ' ' + (m.description || '').toLowerCase())
          .replace(/[^a-zа-яё0-9]+/gi, ' ')
          .split(' ')
          .filter((w: string) => w.length >= 3);

        const item: MemeItem = {
          id,
          name: m.ocrText || `Мем ${id.slice(0, 8)}`,
          category: 'catalog',
          description: m.description || m.ocrText || '',
          mediaUrl: filePath,
          filePath,
          badgeEmoji: '🖼️',
          keywords: Array.from(new Set([id, id.slice(0, 8), m.fileName, ocrLower, ...words]))
        };

        result[id] = item;
        result[id.slice(0, 8)] = item;

        // Нормализованный текст без знаков препинания
        const cleanOcr = ocrLower.replace(/[^a-zа-яё0-9]+/gi, ' ').trim();
        if (cleanOcr) {
          result[cleanOcr] = item;
          result[cleanOcr.replace(/\s+/g, '_')] = item;
          result[cleanOcr.replace(/\s+/g, '-')] = item;
          result[cleanOcr.replace(/\s+/g, '')] = item;
        }

        // Популярные короткие псевдонимы по смыслу
        if (ocrLower.includes('шедевр')) { result['шедевр'] = item; result['это шедевр'] = item; }
        if (ocrLower.includes('круто')) { result['круто'] = item; result['класс'] = item; }
        if (ocrLower.includes('подорожник')) { result['подорожник'] = item; result['святой подорожник'] = item; }
        if (ocrLower.includes('хуле ты умный') || ocrLower.includes('умный такой')) { result['умник'] = item; result['хуле ты умный'] = item; }
        if (ocrLower.includes('нихуя себе') || ocrLower.includes('нихуя')) { result['нихуя'] = item; result['нихуя себе'] = item; }
        if (ocrLower.includes('хуясе')) { result['хуясе'] = item; result['хуясе ебать'] = item; }
        if (ocrLower.includes('держи, тебе нужнее') || ocrLower.includes('тебе нужнее')) { result['таблетки'] = item; result['держи тебе нужнее'] = item; }
        if (ocrLower.includes('чё за хуйня') || ocrLower.includes('че за хуйня')) { result['чезахуйня'] = item; result['чё за хуйня'] = item; result['что за хуйня'] = item; }
        if (ocrLower.includes('сохраню для потомков')) { result['потомки'] = item; result['сохраню для потомков'] = item; result['фото на память'] = item; }
        if (ocrLower.includes('я дерево') || ocrLower.includes('мне пох я дерево')) { result['дерево'] = item; result['мне пох я дерево'] = item; }
        if (ocrLower.includes('пиздец')) { result['пиздец'] = item; result['полный пиздец'] = item; }
        if (ocrLower.includes('молодец') || ocrLower.includes('ебать я молодец')) { result['молодец'] = item; result['ебать я молодец'] = item; }
        if (ocrLower.includes('грамота')) { result['грамота'] = item; result['ебать ты кадр'] = item; }
        if (ocrLower.includes('чайный алкаш') || ocrLower.includes('чай')) { result['чай'] = item; result['чайный алкаш'] = item; }
        if (ocrLower.includes('бухнём') || ocrLower.includes('бухнем')) { result['бухнем'] = item; result['бухнём'] = item; result['выпьем'] = item; }
        if (ocrLower.includes('10/10') || ocrLower.includes('10 из 10')) { result['10из10'] = item; result['10/10'] = item; result['десять из десяти'] = item; }
        if (ocrLower.includes('я никуда не хочу') || ocrLower.includes('там холодно')) { result['я никуда не хочу'] = item; result['холодно'] = item; result['одеяло'] = item; }
        if (ocrLower.includes('а вот тебе')) { result['а вот тебе'] = item; result['держи'] = item; }
        if (ocrLower.includes('глянь, чё несёт') || ocrLower.includes('че несет')) { result['глянь че несет'] = item; result['глянь чё несёт'] = item; result['бред'] = item; }
        if (ocrLower.includes('мне плевать')) { result['мне плевать'] = item; result['плевать'] = item; result['пофиг'] = item; }
        if (ocrLower.includes('в смысле')) { result['в смысле'] = item; result['всмысле'] = item; result['не понял'] = item; }
        if (ocrLower.includes('ясно, понятно') || ocrLower.includes('ясно понятно')) { result['ясно понятно'] = item; result['ясно'] = item; result['понятно'] = item; }
        if (ocrLower.includes('эликсир храбрости') || ocrLower.includes('эликсир')) { result['эликсир'] = item; result['эликсир храбрости'] = item; }
      }
    } catch (err) {
      console.warn('[Littlepip Memes] Error reading catalog.json:', err);
    }
  }

  catalogMemesCache = result;
  return result;
}

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
 * Ищет мем по ключевому слову или ID среди интернет-мемов и каталога из папки
 */
export function findMemeByQuery(query: string): MemeItem | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  // 1. Поиск среди встроенных интернет-мемов
  if (LITTLEPIP_MEMES[q]) return LITTLEPIP_MEMES[q];

  // 2. Поиск среди каталожных мемов из папки
  const catalog = loadCatalogMemes();
  if (catalog[q]) return catalog[q];

  // Случайный мем по запросу 'random' / 'любой'
  if (q === 'random' || q === 'любой' || q === 'мем') {
    const values = Object.values(catalog);
    if (values.length > 0) {
      return values[Math.floor(Math.random() * values.length)];
    }
  }

  // 3. Поиск по подстроке в названии или ключевых словах каталога
  for (const meme of Object.values(catalog)) {
    if (meme.id.includes(q) || meme.name.toLowerCase().includes(q) || meme.keywords.some(k => k.includes(q) || q.includes(k))) {
      return meme;
    }
  }

  // 4. Поиск по ключевым словам интернет-мемов
  for (const meme of Object.values(LITTLEPIP_MEMES)) {
    if (meme.name.toLowerCase().includes(q) || meme.keywords.some(k => k.includes(q) || q.includes(k))) {
      return meme;
    }
  }

  return undefined;
}

/**
 * Получает медиа-файл: если это локальный файл на диске — читает напрямую,
 * если ссылка в сети — скачивает по HTTP/HTTPS.
 */
export async function downloadMedia(urlOrPath: string): Promise<{
  buffer: Buffer;
  mimeType: string;
  isGif: boolean;
  isAudio: boolean;
  filename: string;
} | null> {
  try {
    if (!urlOrPath) return null;

    // 1. Проверяем локальный файл на диске
    const isRemote = urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://');
    if (!isRemote) {
      let localPath = urlOrPath;
      if (!path.isAbsolute(localPath)) {
        localPath = path.join(process.cwd(), urlOrPath);
      }
      if (!fs.existsSync(localPath)) {
        // Попробуем в подпапке repo/
        const altPath = path.join(process.cwd(), 'repo', urlOrPath);
        if (fs.existsSync(altPath)) localPath = altPath;
      }

      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        const ext = path.extname(localPath).toLowerCase().replace('.', '');
        const isGif = ext === 'gif';
        const isAudio = ext === 'ogg' || ext === 'mp3' || ext === 'wav';
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'ogg') mimeType = 'audio/ogg';
        else if (ext === 'mp3') mimeType = 'audio/mpeg';
        else if (ext === 'wav') mimeType = 'audio/wav';

        return {
          buffer,
          mimeType,
          isGif,
          isAudio,
          filename: path.basename(localPath)
        };
      }
    }

    // 2. Скачивание по сети
    const res = await fetch(urlOrPath, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      console.warn(`[Meme Downloader] Failed to fetch ${urlOrPath}, status: ${res.status}`);
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 50) return null;

    const isGif = contentType.includes('gif') || urlOrPath.toLowerCase().endsWith('.gif');
    const isAudio = contentType.includes('audio') || contentType.includes('ogg') || urlOrPath.toLowerCase().endsWith('.mp3') || urlOrPath.toLowerCase().endsWith('.ogg');
    
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
    console.warn(`[Meme Downloader] Error fetching ${urlOrPath}:`, err?.message || err);
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
