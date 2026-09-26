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
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

app.use(express.json({ limit: '10mb' }));

// Persistent state cache file path
const DATA_FILE = path.join(__dirname, '.dusttown_data.json');

// Bot state
let isBotPolling = true;
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
    lastBotError = 'TELEGRAM_BOT_TOKEN не задан';
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

  addBotLog('message', `[${userTag}]: ${text}`);

  const appUrl = process.env.APP_URL || 'https://t.me/DustTown_RP_bot/app';

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
    tokenMasked: TELEGRAM_BOT_TOKEN
      ? `${TELEGRAM_BOT_TOKEN.substring(0, 10)}...${TELEGRAM_BOT_TOKEN.substring(TELEGRAM_BOT_TOKEN.length - 6)}`
      : 'не задан',
    appUrl: process.env.APP_URL || ''
  });
});

app.post('/api/bot/start', async (req, res) => {
  if (!isBotPolling) {
    await startTelegramPolling();
  }
  res.json({ success: true, isPolling: isBotPolling, botInfo });
});

app.post('/api/bot/stop', (req, res) => {
  stopTelegramPolling();
  res.json({ success: true, isPolling: false });
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
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return res.json(data);
    } catch (e) {
      // Fallback
    }
  }
  res.json({ empty: true });
});

app.post('/api/data', (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
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
