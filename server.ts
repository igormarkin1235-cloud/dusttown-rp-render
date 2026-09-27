import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'https://t.me/DustTown_RP_bot/app';

app.use(express.json({ limit: '10mb' }));

// Persistent state cache file path
const DATA_FILE = path.join(__dirname, '.dusttown_data.json');

function getDefaultData() {
  return {
    profiles: [{
      id: 'owner_mrwhitepio',
      username: '@MrWhitePio',
      displayName: 'MrWhitePio [Создатель]',
      avatarUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80',
      bio: 'Главный Архитектор и Создатель DustTown RP. Магитех-инженер довоенных времен.',
      equivaxes: 9999999,
      isInfiniteEquivaxes: true,
      joinedAt: '2026-01-01T00:00:00Z',
      eventsAttended: 12,
      plannedRpsAttended: 8,
      activeThemeId: 'black_tree',
      activeAvatarFrame: 'frame_rad_pulse',
      inventory: []
    }],
    admins: [{
      username: '@MrWhitePio',
      tags: ['Главный Создатель', 'Архитектор DustTown', 'Supreme GM'],
      addedAt: '2026-01-01T00:00:00Z',
      isMainCreator: true
    }],
    characters: [],
    events: [],
    awards: [],
    cases: [],
    caseItems: [],
    weeklyShopItems: [
      {
        id: 'weekly_item_rad_core',
        name: 'Анимированная Тема: Реактор Радиации ☢️',
        description: 'Эпический довоенный экран с пульсирующей радиацией и частицами.',
        photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        bgStyle: 'from-emerald-950 via-zinc-950 to-green-950 border-emerald-500/70',
        textStyle: 'text-emerald-400 font-bold drop-shadow-[0_0_8px_#34d399]',
        rarity: 'legendary',
        type: 'profile_theme',
        appliedValue: 'rad_core',
        price: 320,
        oldPrice: 450,
        badge: 'ХИТ НЕДЕЛИ 🔥',
        stock: 5,
        addedBy: '@MrWhitePio',
        addedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'weekly_item_frame_gold',
        name: '3D Рамка: Золото Рейнджера 🏆',
        description: 'Массивная золотая 3D-окантовка с гравировкой орла НКР Эквестрии.',
        photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        bgStyle: 'from-amber-950 via-zinc-950 to-yellow-950 border-amber-500',
        textStyle: 'text-amber-300 font-bold',
        rarity: 'epic',
        type: 'avatar_frame',
        appliedValue: 'frame_gold_3d',
        price: 190,
        oldPrice: 250,
        badge: 'СКИДКА -24%',
        addedBy: '@MrWhitePio',
        addedAt: '2026-01-01T00:00:00Z'
      }
    ],
    auctionListings: []
  };
}

function saveData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getOrInitData() {
  const defaults = getDefaultData();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (parsed && Array.isArray(parsed.profiles)) {
        const data = { ...defaults, ...parsed };
        data.admins = Array.isArray(data.admins) ? data.admins : defaults.admins;
        if (!data.profiles.some((profile: any) => profile.username?.toLowerCase() === '@mrwhitepio')) {
          data.profiles.unshift(defaults.profiles[0]);
        }
        if (!data.admins.some((admin: any) => admin.username?.toLowerCase() === '@mrwhitepio')) {
          data.admins.unshift(defaults.admins[0]);
        }
        return data;
      }
    } catch (error) {
      console.error('Error reading DATA_FILE:', error);
    }
  }

  saveData(defaults);
  return defaults;
}

function registerOrUpdateUser(user: { id: number | string; first_name?: string; last_name?: string; username?: string; photo_url?: string }) {
  if (!user?.id) return null;

  const data = getOrInitData();
  const userId = String(user.id);
  const username = user.username ? `@${user.username}` : `@id${userId}`;
  const isOwner = username.toLowerCase() === '@mrwhitepio';
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ')
    || user.username
    || `Сталкер #${userId.slice(-4)}`;
  let profile = data.profiles.find((item: any) =>
    item.id === `tg_user_${userId}` || item.username?.toLowerCase() === username.toLowerCase()
  );

  if (profile) {
    if (user.first_name || user.last_name) profile.displayName = displayName;
    if (user.photo_url) profile.avatarUrl = user.photo_url;
    if (user.username) profile.username = username;
    if (isOwner) profile.isInfiniteEquivaxes = true;
  } else {
    profile = {
      id: `tg_user_${userId}`,
      username,
      displayName,
      avatarUrl: user.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      bio: isOwner ? 'Главный Архитектор и Создатель DustTown RP.' : 'Выживший в Пустоши DustTown.',
      equivaxes: isOwner ? 9999999 : 150,
      isInfiniteEquivaxes: isOwner,
      joinedAt: new Date().toISOString(),
      eventsAttended: 0,
      plannedRpsAttended: 0,
      inventory: []
    };
    data.profiles.push(profile);
  }

  saveData(data);
  return { profile, data };
}

// Bot state
let isBotPolling = false;
let pollingAbortController: AbortController | null = null;
let lastBotError: string | null = null;
let botInfo: any = null;
let botLogs: Array<{ id: string; time: string; type: 'info' | 'message' | 'error'; text: string }> = [
  { id: '1', time: new Date().toLocaleTimeString(), type: 'info', text: 'Сервер DustTown RP запущен' },
  { id: '2', time: new Date().toLocaleTimeString(), type: 'info', text: 'Инициализация Telegram Bot (@DustTown_RP_bot)' }
];

function addBotLog(type: 'info' | 'message' | 'error', text: string) {
  botLogs.unshift({
    id: Math.random().toString(36).substring(7),
    time: new Date().toLocaleTimeString(),
    type,
    text
  });
  if (botLogs.length > 50) botLogs.pop();
}

// Telegram API Helper
async function tgApi(method: string, body?: any) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`Telegram API error on ${method}:`, err.message);
    lastBotError = err.message;
    throw err;
  }
}

// Start Telegram Polling Loop
let lastUpdateId = 0;

async function startTelegramPolling() {
  if (!TELEGRAM_BOT_TOKEN) {
    isBotPolling = false;
    lastBotError = 'TELEGRAM_BOT_TOKEN is not configured';
    addBotLog('error', lastBotError);
    return;
  }

  if (pollingAbortController) {
    pollingAbortController.abort();
  }
  pollingAbortController = new AbortController();
  isBotPolling = true;

  try {
    const me = await tgApi('getMe');
    if (me.ok) {
      botInfo = me.result;
      addBotLog('info', `Бот подключен: @${me.result.username} (${me.result.first_name})`);
    } else {
      addBotLog('error', `Ошибка getMe: ${me.description || 'Неверный токен'}`);
    }
  } catch (e: any) {
    addBotLog('error', `Не удалось связаться с Telegram: ${e.message}`);
  }

  // Polling loop in background
  (async () => {
    while (isBotPolling && pollingAbortController && !pollingAbortController.signal.aborted) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`, {
          signal: pollingAbortController.signal
        });
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = update.update_id;
            handleTelegramUpdate(update);
          }
        } else if (!data.ok) {
          lastBotError = data.description || 'Polling error';
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        // Wait before reconnecting
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  })();
}

function stopTelegramPolling() {
  isBotPolling = false;
  if (pollingAbortController) {
    pollingAbortController.abort();
    pollingAbortController = null;
  }
  addBotLog('info', 'Telegram Long-Polling остановлен пользователем');
}

// Handle Bot Messages
async function handleTelegramUpdate(update: any) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const user = msg.from;
  const userTag = user?.username ? `@${user.username}` : user?.first_name || 'unknown';
  const text = msg.text.trim();

  if (user) registerOrUpdateUser(user);

  addBotLog('message', `[${userTag}]: ${text}`);

  const appUrl = APP_URL;

  if (text.startsWith('/start')) {
    const welcomeText = `👋 Добро пожаловать в **DustTown RP** (Fallout: Equestria)!
    
🏛️ **DustTown** — это укреплённый город на перепутье выжженных пустошей Эквестрии. Здесь сталкеры, единороги-магитехи, пегасы-разведчики и стальные рейнджеры находят убежище, делятся довоенными тайнами и выходят на опасные вылазки.

🎮 Нажмите **«Открыть приложение»**, чтобы войти в Mini App:
• Создание и просмотр анкет персонажей
• События и ивенты с отсчётом времени и наградами
• Запланированные РП-сессии
• Профиль сталкера, заслуги и награды
• Геометрические кейсы с косметикой для профиля`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🎮 Открыть приложение',
            web_app: { url: appUrl }
          }
        ],
        [
          {
            text: '⚠️ Сообщить о проблеме',
            url: 'https://t.me/MrWhitePio'
          }
        ],
        [
          {
            text: '👥 Присоединиться к комьюнити',
            url: 'https://t.me/DustTownCollective'
          }
        ]
      ]
    };

    try {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      });
      addBotLog('info', `Отправлено стартовое меню пользователю ${userTag}`);
    } catch (e: any) {
      addBotLog('error', `Ошибка отправки /start: ${e.message}`);
    }
  } else if (text.startsWith('/help')) {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `Команды бота DustTown RP:
/start — Главное меню и запуск Mini App
По всем вопросам и проблемам обращайтесь к основателю: @MrWhitePio
Группа проекта: https://t.me/DustTownCollective`
    });
  }
}

// API Routes
app.get('/api/bot/status', (req, res) => {
  res.json({
    isPolling: isBotPolling,
    botInfo,
    logs: botLogs,
    lastError: lastBotError,
    tokenConfigured: Boolean(TELEGRAM_BOT_TOKEN),
    appUrl: APP_URL
  });
});

app.post('/api/bot/start', async (req, res) => {
  if (!TELEGRAM_BOT_TOKEN) {
    return res.status(503).json({ success: false, error: 'TELEGRAM_BOT_TOKEN is not configured' });
  }
  if (!isBotPolling) {
    await startTelegramPolling();
  }
  res.json({ success: true, isPolling: isBotPolling, botInfo });
});

app.post('/api/bot/stop', (req, res) => {
  stopTelegramPolling();
  res.json({ success: true, isPolling: false });
});

app.post('/api/notify-group', async (req, res) => {
  const event = req.body?.event;
  if (!event || typeof event.title !== 'string') {
    return res.status(400).json({ error: 'A valid event is required' });
  }
  if (!TELEGRAM_BOT_TOKEN) {
    return res.status(503).json({ error: 'TELEGRAM_BOT_TOKEN is not configured' });
  }

  const targetChat = process.env.TELEGRAM_GROUP_ID || '@DustTownCollective';
  const startTime = new Date(event.startTime);
  const formattedTime = Number.isNaN(startTime.getTime())
    ? 'Час не вказано'
    : startTime.toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
  const details = [
    `🏷 **Назва:** ${event.title}`,
    event.collabClanName && `👥 **Клан-партнер:** ${event.collabClanName}`,
    event.location && `📍 **Локація:** ${event.location}`,
    event.faction && `⚔️ **Фракція:** ${event.faction}`,
    `⏰ **Час:** ${formattedTime}`,
    event.description && `\n📝 **Опис:**\n${event.description}`
  ].filter(Boolean).join('\n');
  const title = event.type === 'collab'
    ? '🤝 НОВА КОЛАБОРАЦІЯ'
    : event.type === 'planned_rp'
      ? '🌸 НОВА RP-СЕСІЯ'
      : '🔥 НОВА ПОДІЯ DUSTTOWN';
  const inlineKeyboard: any[] = [[{ text: '🎮 Відкрити Mini App', web_app: { url: APP_URL } }]];
  if (typeof event.collabClanUrl === 'string' && event.collabClanUrl.startsWith('https://')) {
    inlineKeyboard.push([{ text: '🤝 Група клану', url: event.collabClanUrl }]);
  }

  try {
    const body = {
      chat_id: targetChat,
      caption: `${title}\n\n${details}`,
      text: `${title}\n\n${details}`,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    };
    let result = event.bannerUrl?.startsWith('https://')
      ? await tgApi('sendPhoto', { ...body, photo: event.bannerUrl })
      : null;
    if (!result?.ok) result = await tgApi('sendMessage', body);
    if (!result?.ok) throw new Error(result?.description || 'Telegram rejected the notification');
    addBotLog('info', `Опубліковано подію «${event.title}» у ${targetChat}`);
    res.json({ success: true });
  } catch (error: any) {
    addBotLog('error', `Помилка сповіщення Telegram: ${error.message}`);
    res.status(502).json({ error: error.message });
  }
});

// Download prepared project files for Render.com
app.get('/api/download-render-zip', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'make_zip.py');
  const zipPath = path.join(__dirname, 'dusttown-rp-render.zip');

  exec(`python3 "${scriptPath}"`, (err, stdout, stderr) => {
    if (err || !fs.existsSync(zipPath)) {
      console.error('Failed to create zip:', err || stderr);
      return res.status(500).json({ error: 'Failed to generate zip file' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="dusttown-rp-render.zip"');
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);
  });
});

app.get('/api/get-zip-base64', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'make_zip.py');
  const zipPath = path.join(__dirname, 'dusttown-rp-render.zip');

  exec(`python3 "${scriptPath}"`, (err, stdout, stderr) => {
    if (err || !fs.existsSync(zipPath)) {
      console.error('Failed to create zip:', err || stderr);
      return res.status(500).json({ error: 'Failed to generate zip file' });
    }

    const buffer = fs.readFileSync(zipPath);
    res.json({ success: true, filename: 'dusttown-rp-render.zip', size: buffer.length, base64: buffer.toString('base64') });
  });
});

app.post('/api/user/sync', (req, res) => {
  const result = registerOrUpdateUser(req.body?.tgUser);
  const data = result?.data || getOrInitData();
  res.json({ success: true, profile: result?.profile || null, fullData: data });
});

app.post('/api/admin/toggle', (req, res) => {
  const { requesterUsername, targetUsername, action, tags } = req.body || {};
  if (typeof requesterUsername !== 'string' || requesterUsername.toLowerCase() !== '@mrwhitepio') {
    return res.status(403).json({ error: 'Only the project owner can manage admins' });
  }
  if (typeof targetUsername !== 'string' || !targetUsername.trim()) {
    return res.status(400).json({ error: 'A target username is required' });
  }

  const data = getOrInitData();
  const username = targetUsername.startsWith('@') ? targetUsername : `@${targetUsername}`;
  if (username.toLowerCase() === '@mrwhitepio' && action === 'remove') {
    return res.status(400).json({ error: 'The project owner cannot be removed' });
  }
  const existing = data.admins.find((admin: any) => admin.username.toLowerCase() === username.toLowerCase());
  if (action === 'remove') {
    data.admins = data.admins.filter((admin: any) => admin.username.toLowerCase() !== username.toLowerCase());
  } else if (existing) {
    existing.tags = Array.isArray(tags) ? tags : existing.tags;
  } else {
    data.admins.push({ username, tags: Array.isArray(tags) ? tags : ['Адміністратор'], addedAt: new Date().toISOString() });
  }
  saveData(data);
  res.json({ success: true, admins: data.admins });
});

app.get('/api/data', (req, res) => {
  res.json(getOrInitData());
});

app.post('/api/data', (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return res.status(400).json({ error: 'Invalid state body' });
    }
    const current = getOrInitData();
    const profiles = new Map((current.profiles || []).map((profile: any) => [profile.id, profile]));
    if (Array.isArray(incoming.profiles)) {
      for (const profile of incoming.profiles) {
        if (profile?.id) profiles.set(profile.id, profile);
      }
    }
    const data = { ...current, ...incoming, profiles: Array.from(profiles.values()) };
    saveData(data);
    res.json({ success: true, count: data.profiles.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start Bot Polling immediately
startTelegramPolling().catch(err => {
  console.error('Initial telegram polling error:', err);
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`DustTown RP Server running on http://localhost:${PORT}`);
  });
}

startServer();
