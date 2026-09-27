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
const APP_URL = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'https://dusttown-rp-render-6.onrender.com/?view=miniapp';

app.use(express.json({ limit: '10mb' }));

// Persistent state cache file path
const DATA_FILE = path.join(__dirname, '.dusttown_data.json');

function getDefaultData() {
  return {
    profiles: [
      {
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
      }
    ],
    admins: [
      {
        username: '@MrWhitePio',
        tags: ['Главный Создатель', 'Архитектор DustTown', 'Supreme GM'],
        addedAt: '2026-01-01T00:00:00Z',
        isMainCreator: true
      }
    ],
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

function getOrInitData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (parsed && Array.isArray(parsed.profiles)) {
        // Ensure owner exists
        if (!parsed.profiles.some((p: any) => p.username?.toLowerCase() === '@mrwhitepio')) {
          parsed.profiles.unshift(getDefaultData().profiles[0]);
        }
        if (!parsed.admins?.some((a: any) => a.username?.toLowerCase() === '@mrwhitepio')) {
          parsed.admins = parsed.admins || [];
          parsed.admins.unshift(getDefaultData().admins[0]);
        }
        if (!Array.isArray(parsed.weeklyShopItems)) {
          parsed.weeklyShopItems = getDefaultData().weeklyShopItems;
        }
        if (!Array.isArray(parsed.auctionListings)) {
          parsed.auctionListings = [];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error reading DATA_FILE:', e);
    }
  }

  const initial = getDefaultData();
  saveData(initial);
  return initial;
}

function saveData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write DATA_FILE:', e);
  }
}

function registerOrUpdateUser(user: { id: number | string; first_name?: string; last_name?: string; username?: string; photo_url?: string }) {
  if (!user || !user.id) return null;
  const data = getOrInitData();
  const userIdStr = String(user.id);
  const formattedUsername = user.username ? `@${user.username}` : `@id${userIdStr}`;
  const isOwner = formattedUsername.toLowerCase() === '@mrwhitepio';
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || (user.username ? `@${user.username}` : `Сталкер #${userIdStr.slice(-4)}`);

  let profile = data.profiles.find((p: any) =>
    p.id === 'tg_user_' + userIdStr ||
    (p.username && p.username.toLowerCase() === formattedUsername.toLowerCase())
  );

  if (profile) {
    if (displayName && (!profile.displayName || profile.displayName.startsWith('Сталкер #'))) {
      profile.displayName = displayName;
    }
    if (user.photo_url) profile.avatarUrl = user.photo_url;
    if (user.username) profile.username = `@${user.username}`;
    if (isOwner) {
      profile.isInfiniteEquivaxes = true;
    }
  } else {
    profile = {
      id: 'tg_user_' + userIdStr,
      username: formattedUsername,
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
  const userTag = user.username ? `@${user.username}` : user.first_name;
  const text = msg.text.trim();

  // Automatic registration of Telegram user in the shared database
  if (user) {
    registerOrUpdateUser(user);
  }

  addBotLog('message', `[${userTag}]: ${text}`);

  const appUrl = APP_URL;

  if (text.startsWith('/start')) {
    const welcomeText = `👋 Добро пожаловать в **Даст Таун Колектив** (DustTown Collective RP)!
    
🏛️ **DustTown** — это укреплённый город на перепутье выжженных пустошей Эквестрии. Здесь сталкеры, единороги-магитехи, пегасы-разведчики и стальные рейнджеры находят убежище, делятся довоенными тайнами и выходят на опасные вылазки.

🎮 **Возможности нашего Mini App:**
• Создание и просмотр анкет персонажей
• События и ивенты с отсчётом времени и наградами
• Запланированные РП-сессии и пред-релизы
• Профиль сталкера, заслуги и награды
• Торговый пост и свободный аукцион
• Кейсы с косметикой и лотерея Пустошей`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '⚠️ Сообщить о проблеме',
            url: 'https://t.me/MrWhitePio'
          },
          {
            text: '👥 Комьюнити проекта',
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
      text: `Команды бота группы Даст Таун Колектив:
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

// Automatic announcement to community group when an event/collab/RP is published
app.post('/api/notify-group', async (req, res) => {
  try {
    const event = req.body?.event;
    if (!event) {
      return res.status(400).json({ error: 'Event object required' });
    }

    const appUrl = APP_URL;
    const targetChat = process.env.TELEGRAM_GROUP_ID || '@DustTownCollective';

    let text = '';
    const inlineKeyboard: any[] = [];

    const formattedTime = new Date(event.startTime).toLocaleString('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    if (event.type === 'collab') {
      text = `🤝 **НОВОЕ СОБЫТИЕ: КОЛЛАБОРАЦИЯ С КЛАНОМ!**\n\n` +
        `🏷 **Название:** ${event.title}\n` +
        `👥 **Клан-партнёр:** ${event.collabClanName || 'Дружественный клан'}\n` +
        `📍 **Локация:** ${event.location}\n` +
        `💰 **Награда сталкерам:** +${event.rewardEquivaxes} ℰQ\n` +
        `⏰ **Время сбора:** ${formattedTime}\n\n` +
        `📝 **Описание:**\n${event.description}`;

      inlineKeyboard.push([{ text: '🎮 Открыть событие в Mini App', web_app: { url: appUrl } }]);
      if (event.collabClanUrl) {
        inlineKeyboard.push([{ text: `🤝 Группа клана ${event.collabClanName || 'партнёра'}`, url: event.collabClanUrl }]);
      }
    } else if (event.type === 'planned_rp') {
      text = `🌸 **НОВАЯ ЗАПЛАНИРОВАННАЯ РП-СЕССИЯ!**\n\n` +
        `🏷 **Сессия:** ${event.title}\n` +
        `📍 **Место действия:** ${event.location}\n` +
        `🎭 **GM (Ведущий):** ${event.hasGM ? 'Есть GM' : 'Свободная игра'}\n` +
        `💰 **Награда за участие:** +${event.rewardEquivaxes} ℰQ\n` +
        `⏰ **Старт:** ${formattedTime}\n\n` +
        `📝 **Сюжет:**\n${event.description}`;

      inlineKeyboard.push([{ text: '🎮 Записаться на РП в Mini App', web_app: { url: appUrl } }]);
    } else {
      text = `🔥 **НОВЫЙ ИВЕНТ В ДАСТ ТАУН КОЛЕКТИВ!**\n\n` +
        `🏷 **Ивент:** ${event.title}\n` +
        `📍 **Локация:** ${event.location}\n` +
        `⚔️ **Фракция:** ${event.faction}\n` +
        `💰 **Награда:** +${event.rewardEquivaxes} ℰQ\n` +
        `⏰ **Старт:** ${formattedTime}\n\n` +
        `📝 **Подробности:**\n${event.description}`;

      inlineKeyboard.push([{ text: '🎮 Участвовать в ивенте', web_app: { url: appUrl } }]);
    }

    let sent = false;
    if (event.bannerUrl && event.bannerUrl.startsWith('http')) {
      try {
        await tgApi('sendPhoto', {
          chat_id: targetChat,
          photo: event.bannerUrl,
          caption: text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: inlineKeyboard }
        });
        sent = true;
      } catch (err: any) {
        console.warn('sendPhoto failed, falling back to sendMessage:', err.message);
      }
    }

    if (!sent) {
      await tgApi('sendMessage', {
        chat_id: targetChat,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
    }

    addBotLog(
      'info',
      `Оповещение о ${event.type === 'collab' ? 'событии-коллаборации' : event.type === 'planned_rp' ? 'РП-сессии' : 'ивенте'} «${event.title}» отправлено в группу ${targetChat}`
    );
    res.json({ success: true });
  } catch (err: any) {
    addBotLog('error', `Ошибка отправки оповещения в группу: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Automatic announcement of attendance review & penalties to community group
app.post('/api/notify-completion', async (req, res) => {
  try {
    const { eventTitle, eventType, attendedUsernames, absentUsernames, rewardAmount, penaltyAmount } = req.body;
    const targetChat = process.env.TELEGRAM_GROUP_ID || '@DustTownCollective';
    const appUrl = APP_URL;

    const typeLabel = eventType === 'collab'
      ? 'СОБЫТИЯ-КОЛЛАБОРАЦИИ'
      : eventType === 'planned_rp'
      ? 'РП-СЕССИИ'
      : 'ИВЕНТА';

    let text = `🏁 **ИТОГИ ${typeLabel}**\n\n` +
      `🏷 **Название:** ${eventTitle}\n\n`;

    if (attendedUsernames && attendedUsernames.length > 0) {
      text += `🎖 **Присутствовали (награда +${rewardAmount} ℰQ):**\n` +
        attendedUsernames.map((u: string) => `• ${u}`).join('\n') + '\n\n';
    } else {
      text += `🎖 **Присутствовали:** Никто не явился\n\n`;
    }

    if (absentUsernames && absentUsernames.length > 0) {
      text += `⚠️ **Не явились (ШТРАФ -${penaltyAmount} ℰQ):**\n` +
        absentUsernames.map((u: string) => `• ${u} (задолженность записана)`).join('\n') + '\n\n';
      text += `💡 *Напоминание: долг автоматически списывается/погашается при поступлении новых Эквиваксов на счёт.*`;
    }

    await tgApi('sendMessage', {
      chat_id: targetChat,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🎮 Открыть Mini App', web_app: { url: appUrl } }]]
      }
    });

    addBotLog('info', `Итоги и штрафы по «${eventTitle}» отправлены в группу ${targetChat}`);
    res.json({ success: true });
  } catch (err: any) {
    addBotLog('error', `Ошибка отправки итогов в группу: ${err.message}`);
    res.status(500).json({ error: err.message });
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

    const stat = fs.statSync(zipPath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
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

    try {
      const buffer = fs.readFileSync(zipPath);
      res.json({
        success: true,
        filename: 'dusttown-rp-render.zip',
        size: buffer.length,
        base64: buffer.toString('base64')
      });
    } catch (readErr) {
      console.error('Error reading zip:', readErr);
      res.status(500).json({ error: 'Error reading zip file' });
    }
  });
});

app.get('/api/data', (req, res) => {
  const data = getOrInitData();
  res.json(data);
});

// Sync or auto-register Mini App user from Telegram WebApp initData
app.post('/api/user/sync', (req, res) => {
  const tgUser = req.body?.tgUser;
  if (!tgUser || !tgUser.id) {
    const data = getOrInitData();
    return res.json({ success: true, profile: null, fullData: data });
  }

  const result = registerOrUpdateUser(tgUser);
  res.json({
    success: true,
    profile: result?.profile,
    fullData: result?.data || getOrInitData()
  });
});

// Owner only: Toggle or assign Admin rights
app.post('/api/admin/toggle', (req, res) => {
  const { requesterUsername, targetUsername, action, tags } = req.body;
  if (!requesterUsername || requesterUsername.toLowerCase() !== '@mrwhitepio') {
    return res.status(403).json({ error: 'Только Создатель (@MrWhitePio) может назначать администраторов' });
  }

  const data = getOrInitData();
  data.admins = data.admins || [];
  const formattedTarget = targetUsername.startsWith('@') ? targetUsername : `@${targetUsername}`;

  if (action === 'remove') {
    if (formattedTarget.toLowerCase() === '@mrwhitepio') {
      return res.status(400).json({ error: 'Нельзя снять права у Главного Создателя' });
    }
    data.admins = data.admins.filter((a: any) => a.username.toLowerCase() !== formattedTarget.toLowerCase());
  } else {
    const existing = data.admins.find((a: any) => a.username.toLowerCase() === formattedTarget.toLowerCase());
    if (existing) {
      existing.tags = tags || existing.tags || ['Администратор'];
    } else {
      data.admins.push({
        username: formattedTarget,
        tags: tags || ['Администратор'],
        addedAt: new Date().toISOString(),
        isMainCreator: formattedTarget.toLowerCase() === '@mrwhitepio'
      });
    }
  }

  saveData(data);
  res.json({ success: true, admins: data.admins });
});

app.post('/api/data', (req, res) => {
  try {
    const current = getOrInitData();
    const incoming = req.body;

    if (incoming && typeof incoming === 'object') {
      // Merge profiles safely to never lose registered users
      const profileMap = new Map();
      (current.profiles || []).forEach((p: any) => profileMap.set(p.id, p));
      (incoming.profiles || []).forEach((p: any) => profileMap.set(p.id, p));

      const mergedData = {
        ...current,
        ...incoming,
        profiles: Array.from(profileMap.values())
      };

      saveData(mergedData);
      return res.json({ success: true, count: mergedData.profiles.length });
    }
    res.status(400).json({ error: 'Invalid state body' });
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
  const distDir = path.join(__dirname, 'dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  const hasBuiltDist = fs.existsSync(indexHtmlPath);

  // If in production and built static assets exist, serve from dist/
  if (process.env.NODE_ENV === 'production' && hasBuiltDist) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(indexHtmlPath, (err) => {
        if (err) {
          next(err);
        }
      });
    });
  } else {
    // Development or missing dist: mount Vite dev server in middleware mode
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error('Failed to create Vite server, checking for dist fallback:', err);
      if (hasBuiltDist) {
        app.use(express.static(distDir));
        app.get('*', (req, res, next) => {
          if (req.path.startsWith('/api')) return next();
          res.sendFile(indexHtmlPath, (sendErr) => {
            if (sendErr) next(sendErr);
          });
        });
      } else {
        // Fallback root HTML response if neither is available
        app.get('*', (req, res, next) => {
          if (req.path.startsWith('/api')) return next();
          const devIndex = path.join(__dirname, 'index.html');
          if (fs.existsSync(devIndex)) {
            res.sendFile(devIndex);
          } else {
            res.status(500).send('Building application, please refresh in a few seconds...');
          }
        });
      }
    }
  }

  app.listen(PORT, () => {
    console.log(`DustTown RP Server running on http://localhost:${PORT}`);
  });
}

startServer();
