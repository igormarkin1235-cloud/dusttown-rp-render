import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { handleLittlepipUpdate, getLittlepipStats, generateLittlepipText, hasPipMention, LITTLEPIP_GEMINI_MODEL } from './src/services/littlepipAgent';
import { CloudChatState, FirebaseCloudStore } from './src/services/firebaseCloud';
import { AppStateData } from './src/types';
import { extractSongSearchQuery, searchYouTubeTrack } from './src/services/youtubeSearch';
import { generateLittlepipVoice } from './src/services/littlepipVoice';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// In AI Studio, dev server must run on port 3000. On external production (Render), use process.env.PORT
const PORT = process.env.NODE_ENV === 'production' && process.env.PORT && Number(process.env.PORT) !== 8080
  ? Number(process.env.PORT)
  : Number(process.env.DEV_PORT) || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8987511998:AAFZ5TWBa1w855MH23LmD9y5SV2z9jOjGVA';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Persistent state cache file path
const DATA_FILE = path.join(__dirname, '.dusttown_data.json');
const BACKUP_FILE = path.join(__dirname, 'backup_seed_data.json');
const firebaseCloudStore = new FirebaseCloudStore();
const firebaseConfigured = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_STORAGE_BUCKET);
let firebaseConnected = false;
let firebaseHealthy = false;
let firebaseLastError: string | null = null;
let firebaseLastSyncedAt: string | null = null;
let cloudSaveQueue: Promise<void> = Promise.resolve();

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
    auctionListings: [],
    factions: [],
    artworks: [],
    activityLogs: [
      {
        id: 'act_init_1',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        username: '@MrWhitePio',
        displayName: 'MrWhitePio (Основатель)',
        userAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        category: 'event_create',
        title: 'Создан новый ивент Пустоши',
        description: 'Основатель запустил регистрацию на рейд «Битва за Чистую Воду» (+150 ℰQ)',
        details: { amount: 150, targetName: 'Битва за Чистую Воду' },
        serverVerified: true,
        handshakeId: 'hs_init_8f921a'
      },
      {
        id: 'act_init_2',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        username: '@starlight_art',
        displayName: 'Starlight Glimmer',
        userAvatarUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=200&q=80',
        category: 'art_publish',
        title: 'Опубликован авторский арт',
        description: 'Художник опубликовал работу «Огни Нового Эппллузы» в Арт-Галерее',
        details: { targetName: 'Огни Нового Эппллузы' },
        serverVerified: true,
        handshakeId: 'hs_init_7c413b'
      },
      {
        id: 'act_init_3',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        username: '@MrWhitePio',
        displayName: 'MrWhitePio (Основатель)',
        userAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        category: 'shop_purchase',
        title: 'Покупка в Торговом Посту',
        description: 'Приобретена 3D-рамка «Золотой Ореол Пустоши 3D» (-190 ℰQ)',
        details: { amount: -190, targetName: 'Золотой Ореол Пустоши 3D', txType: 'expense_market' },
        serverVerified: true,
        handshakeId: 'hs_init_3a290d'
      },
      {
        id: 'act_init_4',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        username: '@SteelPaladin',
        displayName: 'Паладин Братства',
        userAvatarUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80',
        category: 'event_join',
        title: 'Запись на РП-сессию',
        description: 'Сталкер подтвердил участие в экспедиции «Заброшенный Бункер СРЭ» (+80 ℰQ)',
        details: { amount: 80, targetName: 'Заброшенный Бункер СРЭ' },
        serverVerified: true,
        handshakeId: 'hs_init_19e48f'
      }
    ],
    chatMessages: [
      {
        id: 'msg_init_welcome',
        senderId: 'user_pio',
        senderUsername: '@MrWhitePio',
        senderDisplayName: 'MrWhitePio (Основатель)',
        senderAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        senderFrameId: 'frame_gold_halo',
        senderRole: 'Основатель',
        content: 'Радиостанция Даст Таун в эфире! Пишите в общий чат, переходите в ЛС с игроками или запустите Ядерку ☢️ за 100 ℰQ!',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'text',
        style: {
          customBgEffect: 'radiation',
          bubbleBorderTheme: 'border-amber-500/50',
          textColorClass: 'text-amber-200'
        }
      },
      {
        id: 'msg_init_system',
        senderId: 'user_bot',
        senderUsername: '@DustTownBot',
        senderDisplayName: 'Штабной Терминал Даст Таун',
        senderAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        senderRole: 'Система',
        content: 'Все протоколы связи активированы. Ваши сообщения оформляются в стиле вашего профиля!',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        type: 'text',
        style: {
          customBgEffect: 'cyber',
          bubbleBorderTheme: 'border-emerald-500/50',
          textColorClass: 'text-emerald-300'
        }
      }
    ],
    nukeAlert: null
  };
}

function appendActivityLog(data: any, log: {
  userId?: string;
  username: string;
  displayName?: string;
  userAvatarUrl?: string;
  category: string;
  title: string;
  description: string;
  details?: any;
}) {
  data.activityLogs = Array.isArray(data.activityLogs) ? data.activityLogs : [];
  const handshakeId = 'hs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const entry = {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    userId: log.userId,
    username: log.username.startsWith('@') ? log.username : `@${log.username}`,
    displayName: log.displayName || log.username,
    userAvatarUrl: log.userAvatarUrl || '',
    category: log.category,
    title: log.title,
    description: log.description,
    details: log.details || {},
    serverVerified: true,
    handshakeId
  };
  data.activityLogs.unshift(entry);
  if (data.activityLogs.length > 250) {
    data.activityLogs = data.activityLogs.slice(0, 250);
  }
  return entry;
}

function appendPipAnnouncement(data: any, announcement: {
  id: string;
  type: string;
  title: string;
  message: string;
  targetTab: string;
  targetId?: string;
  iconEmoji?: string;
}) {
  data.notifications = Array.isArray(data.notifications) ? data.notifications : [];
  if (data.notifications.some((notification: any) => notification.id === announcement.id)) return false;

  const timestamp = new Date().toISOString();
  data.notifications.unshift({
    id: announcement.id,
    type: announcement.type,
    title: announcement.title,
    message: announcement.message,
    timestamp,
    isRead: false,
    targetTab: announcement.targetTab,
    targetId: announcement.targetId,
    iconEmoji: announcement.iconEmoji || '📡'
  });
  data.notifications = data.notifications.slice(0, 150);

  data.chatMessages = Array.isArray(data.chatMessages) ? data.chatMessages : [];
  data.chatMessages.push({
    id: `msg_pip_${announcement.id}`,
    senderId: 'littlepip',
    senderUsername: '@Pip',
    senderDisplayName: 'Пипка · Радио Даст Таун',
    senderAvatarUrl: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=160&q=80',
    senderRole: 'Радио Даст Таун',
    content: `${announcement.title}\n${announcement.message}`,
    timestamp,
    type: 'system',
    style: {
      customBgEffect: 'radiation',
      bubbleBorderTheme: 'border-emerald-400/60 shadow-[0_0_18px_rgba(52,211,153,0.18)]',
      textColorClass: 'text-emerald-100'
    }
  });
  if (data.chatMessages.length > 250) data.chatMessages = data.chatMessages.slice(-250);
  return true;
}

function announceNewStateRecords(previous: any, next: any) {
  const announceAdded = (key: string, create: (item: any) => Parameters<typeof appendPipAnnouncement>[1] | null) => {
    const knownIds = new Set((previous[key] || []).map((item: any) => item.id));
    for (const item of next[key] || []) {
      if (item.id && !knownIds.has(item.id)) {
        const announcement = create(item);
        if (announcement) appendPipAnnouncement(next, announcement);
      }
    }
  };

  announceAdded('events', event => ({
    id: `notif_event_${event.id}`,
    type: 'event',
    title: event.type === 'planned_rp' ? 'Опубликовано новое РП' : 'Опубликовано новое событие',
    message: `Пипка передаёт: «${event.title}»${event.startTime ? ` · начало ${new Date(event.startTime).toLocaleString('ru-RU')}` : ''}. Подробности уже в списке событий.`,
    targetTab: event.type === 'planned_rp' ? 'planned_rp' : 'events',
    targetId: event.id,
    iconEmoji: '☢️'
  }));
  announceAdded('auctionListings', listing => ({
    id: `notif_auction_${listing.id}`,
    type: 'auction',
    title: 'Новый лот на аукционе',
    message: `На торги выставлено «${listing.item?.name || 'новый товар'}» за ${listing.price} ℰQ.`,
    targetTab: 'market',
    targetId: listing.id,
    iconEmoji: '🔨'
  }));
  announceAdded('weeklyShopItems', item => ({
    id: `notif_shop_${item.id}`,
    type: 'auction',
    title: 'Новинка в магазине',
    message: `Пипка заметила новый товар: «${item.name}»${typeof item.price === 'number' ? ` · ${item.price} ℰQ` : ''}.`,
    targetTab: 'market',
    targetId: item.id,
    iconEmoji: '🛒'
  }));
  announceAdded('caseItems', item => ({
    id: `notif_case_item_${item.id}`,
    type: 'case',
    title: 'Новый предмет в запасах кейсов',
    message: `В кейсы добавлен предмет «${item.name}».`,
    targetTab: 'cases',
    targetId: item.id,
    iconEmoji: '📦'
  }));
  announceAdded('cases', item => ({
    id: `notif_case_${item.id}`,
    type: 'case',
    title: 'Поступил новый кейс',
    message: `Доступен кейс «${item.name}» за ${item.price} ℰQ.`,
    targetTab: 'cases',
    targetId: item.id,
    iconEmoji: '📦'
  }));
  announceAdded('awards', award => ({
    id: `notif_award_${award.id}`,
    type: 'achievement',
    title: `${award.icon || '🏅'} Новая заслуга`,
    message: `Игроку ${award.recipientUsername} вручена заслуга «${award.title}».`,
    targetTab: 'profile',
    targetId: award.recipientUsername,
    iconEmoji: award.icon || '🏅'
  }));
  announceAdded('achievements', achievement => ({
    id: `notif_achievement_${achievement.id}`,
    type: 'achievement',
    title: 'Новая цель для сталкеров',
    message: `Добавлено достижение «${achievement.title}».`,
    targetTab: 'profile',
    iconEmoji: '🏆'
  }));
}

function announceEventsStartingSoon(data: any) {
  const now = Date.now();
  let changed = false;
  for (const event of data.events || []) {
    const start = new Date(event.startTime).getTime();
    if (event.isCompleted || event.isPaused || !Number.isFinite(start) || start < now || start > now + 15 * 60_000) continue;
    changed = appendPipAnnouncement(data, {
      id: `notif_starting_${event.id}`,
      type: 'event',
      title: 'Скоро начало!',
      message: `Через несколько минут начинается «${event.title}». Пипка уже передала координаты в чат.`,
      targetTab: event.type === 'planned_rp' ? 'planned_rp' : 'events',
      targetId: event.id,
      iconEmoji: '⏳'
    }) || changed;
  }
  return changed;
}

function getOrInitData() {
  const tryFile = (filePath: string) => {
    if (fs.existsSync(filePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (parsed && Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
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
          if (!Array.isArray(parsed.artworks)) {
            parsed.artworks = [];
          }
          if (!Array.isArray(parsed.activityLogs) || parsed.activityLogs.length === 0) {
            parsed.activityLogs = getDefaultData().activityLogs;
          }
          if (Array.isArray(parsed.factions)) {
            parsed.factions = parsed.factions.filter((f: any) => f && f.id !== 'faction_guardians' && f.id !== 'faction_caravan');
          } else {
            parsed.factions = [];
          }
          return parsed;
        }
      } catch (e) {
        console.error(`Error reading ${filePath}:`, e);
      }
    }
    return null;
  };

  const fromData = tryFile(DATA_FILE);
  if (fromData) return fromData;

  const fromBackup = tryFile(BACKUP_FILE);
  if (fromBackup) {
    saveData(fromBackup);
    return fromBackup;
  }

  const initial = getDefaultData();
  saveData(initial);
  return initial;
}

function saveData(data: any): Promise<void> {
  try {
    data.lastUpdated = new Date().toISOString();
    data.syncVersion = (data.syncVersion || 0) + 1;
    const str = JSON.stringify(data, null, 2);
    fs.writeFileSync(DATA_FILE, str, 'utf-8');
    try {
      fs.writeFileSync(BACKUP_FILE, str, 'utf-8');
    } catch (bErr) {
      // backup best-effort
    }

    if (firebaseConnected) {
      const snapshot = JSON.parse(str);
      cloudSaveQueue = cloudSaveQueue.then(async () => {
        await firebaseCloudStore.saveAppState(snapshot as AppStateData);
        const chatState: CloudChatState = {
          messages: snapshot.chatMessages || [],
          nukeAlerts: snapshot.nukeAlert ? [snapshot.nukeAlert] : []
        };
        await firebaseCloudStore.saveChatState(chatState);
        firebaseHealthy = true;
        firebaseLastError = null;
        firebaseLastSyncedAt = new Date().toISOString();
      }).catch((error: any) => {
        firebaseHealthy = false;
        firebaseLastError = error?.message || 'Firebase write failed';
        console.error('[Firebase persistence] Save failed; local JSON remains available:', firebaseLastError);
      });
    }
    return firebaseConnected ? cloudSaveQueue : Promise.resolve();
  } catch (e) {
    console.error('Failed to write DATA_FILE:', e);
    return Promise.resolve();
  }
}

async function initializeFirebasePersistence() {
  if (!firebaseConfigured) {
    console.info('[Persistence] Firebase credentials not configured; using local JSON storage');
    return;
  }

  try {
    firebaseConnected = await firebaseCloudStore.connect();
    if (!firebaseConnected) return;

    const localState = getOrInitData();
    const [cloudState, cloudChat] = await Promise.all([
      firebaseCloudStore.loadAppState(),
      firebaseCloudStore.loadChatState()
    ]);

    if (cloudState) {
      const restored = {
        ...localState,
        ...cloudState,
        chatMessages: cloudChat?.messages ?? localState.chatMessages ?? [],
        nukeAlert: cloudChat?.nukeAlerts?.[0] ?? null
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(restored, null, 2), 'utf-8');
      firebaseHealthy = true;
      firebaseLastSyncedAt = new Date().toISOString();
      console.info('[Persistence] Restored application state from Firebase');
      return;
    }

    console.info('[Persistence] Firebase is empty; seeding it from the local data snapshot');
    saveData(localState);
    await cloudSaveQueue;
    if (!firebaseHealthy) throw new Error(firebaseLastError || 'Initial Firebase save failed');
  } catch (error: any) {
    firebaseConnected = false;
    firebaseHealthy = false;
    firebaseLastError = error?.message || 'Firebase initialization failed';
    console.error('[Persistence] Firebase unavailable; continuing with local JSON storage:', firebaseLastError);
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

  if (!data.notifications?.some((notification: any) => notification.id === `notif_user_${profile.id}`)) {
    appendPipAnnouncement(data, {
      id: `notif_user_${profile.id}`,
      type: 'new_user',
      title: 'Новый сталкер в Даст Таун',
      message: `Пипка приветствует ${profile.displayName}, нового жителя Пустоши.`,
      targetTab: 'profile',
      targetId: profile.id,
      iconEmoji: '👋'
    });
  }

  saveData(data);
  return { profile, data };
}

// Bot state - disabled locally, hosted on Render to prevent 409 conflict
let isBotPolling = false;
let pollingAbortController: AbortController | null = null;
let lastBotError: string | null = null;
let botInfo: any = { username: 'DustTown_RP_bot', first_name: 'Dust Town RP [Render Worker]' };
let botLogs: Array<{ id: string; time: string; type: 'info' | 'message' | 'error'; text: string }> = [
  { id: '1', time: new Date().toLocaleTimeString(), type: 'info', text: 'Сервер DustTown RP запущен' },
  { id: '2', time: new Date().toLocaleTimeString(), type: 'info', text: 'Бот отключен на локальном инстансе (хостинг вынесен на Render 🚀)' }
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
            await handleTelegramUpdate(update);
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
  const callback = update.callback_query;
  if (callback) {
    const callbackCommand = callback.data === 'talk_littlepip'
      ? '/pip_start'
      : callback.data === 'support_littlepip'
        ? '/support'
        : null;
    if (callbackCommand) {
      await tgApi('answerCallbackQuery', { callback_query_id: callback.id });
      if (callback.message?.chat?.id) {
        await handleTelegramUpdate({
          message: {
            ...callback.message,
            from: callback.from,
            text: callbackCommand
          }
        });
      }
    }
    return;
  }

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

  const appUrl = process.env.APP_URL || 'https://t.me/DustTown_RP_bot/app';

  // 1. Littlepip AI Agent processing (commands /pip_start, /support, /pip_bind, /stop, /pip_status, and dialogue)
  try {
    // Send typing action so Telegram shows that Littlepip is typing
    tgApi('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {});

    const littlepipResult = await handleLittlepipUpdate(
      {
        chatId,
        threadId: msg.message_thread_id,
        messageId: msg.message_id,
        userId: user?.id || 0,
        username: user?.username ? `@${user.username}` : (user?.first_name || 'сталкер'),
        text,
        replyToMessage: msg.reply_to_message,
        botUsername: botInfo?.username || 'DustTown_RP_bot'
      },
      async (targetChatId, replyText, options) => {
        return tgApi('sendMessage', {
          chat_id: targetChatId,
          text: replyText,
          ...options
        });
      }
    );

    if (littlepipResult.handled) {
      addBotLog('info', `[Литлпип ИИ]: ответ в чат ${chatId} (${littlepipResult.mode || 'диалог'})`);
      return;
    }
  } catch (pipErr: any) {
    console.error('[Littlepip Error]:', pipErr);
    if (hasPipMention(text) || msg.reply_to_message?.from?.is_bot) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: 'Не смогла связаться с моделью и не хочу подменять ответ заготовкой. Попробуй обратиться ко мне чуть позже.',
        reply_to_message_id: msg.message_id,
        ...(msg.message_thread_id ? { message_thread_id: msg.message_thread_id } : {})
      });
      return;
    }
  }

  // 2. Standard Bot Commands
  if (text.startsWith('/start')) {
    const welcomeText = `👋 Добро пожаловать в **Даст Таун Колектив** (DustTown Collective RP)!
    
🏛️ **DustTown** — это укреплённый город на перепутье выжженных пустошей Эквестрии. Здесь сталкеры, единороги-магитехи, пегасы-разведчики и стальные рейнджеры находят убежище, делятся довоенными тайнами и выходят на опасные вылазки.

🎮 **Возможности нашего Mini App:**
• Создание и просмотр анкет персонажей
• События и ивенты с отсчётом времени и наградами
• Запланированные РП-сессии и пред-релизы
• Профиль сталкера, заслуги и награды
• Торговый пост и свободный аукцион
• Кейсы с косметикой и лотерея Пустошей

🦄 **ИИ-Агент Литлпип (Стойло 2):**
• \`/pip_start\` — запустить живой диалог с Литлпип
• \`/support\` — режим техподдержки и подсказок по коду/файлам
• \`/pip_bind\` — привязать Литлпип к текущей вкладке/топику группы
• \`/stop\` — остановить бота (радиомолчание)`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🎮 Открыть Mini App',
            web_app: { url: appUrl }
          }
        ],
        [
          {
            text: '🦄 Поговорить с Литлпип',
            callback_data: 'talk_littlepip'
          },
          {
            text: '🛠️ Техподдержка',
            callback_data: 'support_littlepip'
          }
        ],
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
/pip_start — Запустить ИИ-агента Литлпип (живой диалог и юмор)
/support — Режим техподдержки Литлпип (код, файлы, ошибки, экономика)
/pip_bind — Привязать Литлпип к текущей вкладке/топику группы
/stop — Остановить Литлпип (режим радиомолчания)
/pip_status — Проверить статус ИИ-агента

Имена для обращения в чате: Литлпип, Пипка, Литка, Лилька!
По всем вопросам обращайтесь к основателю: @MrWhitePio
Группа проекта: https://t.me/DustTownCollective`
    });
  }
}

// API Routes
app.get('/api/littlepip/status', (req, res) => {
  res.json({
    success: true,
    stats: getLittlepipStats(),
    character: {
      name: 'Литлпип (Littlepip)',
      aliases: ['Пипка', 'Литка', 'Лилька'],
      origin: 'Стойло 2 (Fallout: Equestria)',
      modes: ['chat (/pip_start)', 'support (/support)', 'bind (/pip_bind)', 'stop (/stop)']
    }
  });
});

app.post('/api/littlepip/chat', async (req, res) => {
  try {
    const text = req.body?.text || '';
    const username = req.body?.username || 'сталкер';
    const mode = req.body?.mode || (text.toLowerCase().includes('support') ? 'support' : 'chat');
    const conversationHistory = Array.isArray(req.body?.history)
      ? req.body.history.slice(-10).filter((message: any) =>
        ['user', 'assistant'].includes(message?.role) && typeof message?.text === 'string'
      ).map((message: any) => ({
        username: message.role === 'assistant' ? 'Литлпип' : username,
        text: message.text.slice(0, 1000),
        timestamp: Date.now()
      }))
      : [];

    const songQuery = mode === 'chat' ? extractSongSearchQuery(text) : null;
    if (songQuery) {
      const track = await searchYouTubeTrack(songQuery, process.env.YOUTUBE_API_KEY);
      if (!track) {
        return res.status(404).json({ error: `Не нашла подходящую песню по запросу «${songQuery}». Попробуй назвать исполнителя или точнее описать трек.` });
      }
      return res.json({
        success: true,
        mode,
        track,
        reply: `Нашла «${track.title}» у ${track.author}. Добавляю в радио и включаю. 🎵`
      });
    }

    const reply = await generateLittlepipText(text, username, mode, conversationHistory);
    res.json({
      success: true,
      reply,
      mode
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error generating Littlepip reply' });
  }
});

app.post('/api/littlepip/voice', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({ error: 'Нечего озвучивать.' });
  if (text.length > 1000) return res.status(413).json({ error: 'Сообщение слишком длинное для озвучивания.' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Озвучивание не настроено.' });

  try {
    const audio = await generateLittlepipVoice(text, apiKey);
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-store');
    res.send(audio);
  } catch (error: any) {
    console.error('[Littlepip TTS] Generation failed:', error?.message || error);
    res.status(502).json({ error: 'Голосовое сообщение временно недоступно.' });
  }
});

app.get('/api/bot/status', (req, res) => {
  res.json({
    isPolling: isBotPolling,
    botInfo,
    logs: botLogs,
    lastError: lastBotError,
    tokenMasked: `${TELEGRAM_BOT_TOKEN.substring(0, 10)}...${TELEGRAM_BOT_TOKEN.substring(TELEGRAM_BOT_TOKEN.length - 6)}`,
    appUrl: process.env.APP_URL || '',
    hostedOnRender: true,
    renderStatus: 'Active on Render Cloud 🚀'
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

// ==========================================
// CHAT & NUCLEAR STRIKE ENDPOINTS
// ==========================================

// Get chat messages (both general broadcast and personal DMs)
app.get('/api/chat/messages', (req, res) => {
  try {
    const data = getOrInitData();
    const userId = req.query.userId as string | undefined;
    const recipientId = req.query.recipientId as string | undefined;

    if (!Array.isArray(data.chatMessages) || data.chatMessages.length === 0) {
      data.chatMessages = [
        {
          id: 'msg_init_welcome',
          senderId: 'owner_mrwhitepio',
          senderUsername: '@MrWhitePio',
          senderDisplayName: 'MrWhitePio (Основатель)',
          senderAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          senderFrameId: 'frame_gold_3d',
          senderRole: 'Основатель',
          content: 'Радиостанция Даст Таун в эфире! Пишите в общий чат, переходите в ЛС с игроками или запустите Ядерку ☢️ за 100 ℰQ!',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          type: 'text',
          style: {
            customBgEffect: 'radiation',
            bubbleBorderTheme: 'border-amber-500/50',
            textColorClass: 'text-amber-200'
          }
        },
        {
          id: 'msg_init_system',
          senderId: 'user_bot',
          senderUsername: '@DustTownBot',
          senderDisplayName: 'Штабной Терминал Даст Таун',
          senderAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
          senderRole: 'Система',
          content: 'Все протоколы связи активированы. Ваши сообщения оформляются в стиле вашего профиля!',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          type: 'text',
          style: {
            customBgEffect: 'cyber',
            bubbleBorderTheme: 'border-emerald-500/50',
            textColorClass: 'text-emerald-300'
          }
        }
      ];
      saveData(data);
    }

    // Filter: public messages (no recipientId) OR DMs where user is sender or recipient
    let relevantMessages = data.chatMessages;
    if (userId && recipientId) {
      relevantMessages = data.chatMessages.filter(
        (message: any) => message.recipientId && (
          (message.senderId === userId && message.recipientId === recipientId) ||
          (message.senderId === recipientId && message.recipientId === userId)
        )
      );
    } else if (userId) {
      relevantMessages = data.chatMessages.filter(
        (m: any) => !m.recipientId || m.recipientId === userId || m.senderId === userId
      );
    } else {
      relevantMessages = data.chatMessages.filter((m: any) => !m.recipientId);
    }

    // Clean up expired nuke alert
    let currentNuke = null;
    if (data.nukeAlert && data.nukeAlert.expiresAt > Date.now()) {
      currentNuke = data.nukeAlert;
    } else if (data.nukeAlert) {
      data.nukeAlert = null;
      saveData(data);
    }

    res.json({
      success: true,
      messages: relevantMessages,
      nukeAlert: currentNuke
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Check active nuclear strike
app.get('/api/chat/nuke-status', (req, res) => {
  try {
    const data = getOrInitData();
    if (data.nukeAlert && data.nukeAlert.expiresAt > Date.now()) {
      return res.json({ active: true, nukeAlert: data.nukeAlert });
    }
    return res.json({ active: false, nukeAlert: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send Chat Message or Nuclear Strike
app.post('/api/chat/send', (req, res) => {
  try {
    const data = getOrInitData();
    const {
      senderId,
      content,
      recipientId,
      recipientUsername,
      recipientDisplayName,
      style,
      isNuke
    } = req.body;

    if (!senderId || !content || !content.trim()) {
      return res.status(400).json({ error: 'Текст сообщения не может быть пустым' });
    }

    data.chatMessages = Array.isArray(data.chatMessages) ? data.chatMessages : [];
    data.profiles = Array.isArray(data.profiles) ? data.profiles : [];

    const sender = data.profiles.find((profile: any) => profile.id === senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Профиль отправителя не найден' });
    }

    const trimmedContent = content.trim();

    // NUCLEAR STRIKE LOGIC (Cost: 100 Equivaxes)
    if (isNuke) {
      const NUKE_PRICE = 100;
      if ((sender.equivaxes || 0) < NUKE_PRICE) {
        return res.status(400).json({
          error: `Недостаточно Эквиваксов! Для запуска Ядерки требуется ${NUKE_PRICE} ℰQ (у вас ${sender.equivaxes || 0} ℰQ).`
        });
      }

      // Deduct 100 Equivaxes
      sender.equivaxes -= NUKE_PRICE;
      sender.transactions = Array.isArray(sender.transactions) ? sender.transactions : [];
      sender.transactions.unshift({
        id: 'tx_nuke_' + Date.now(),
        userId: sender.userId,
        amount: -NUKE_PRICE,
        type: 'expense_other',
        title: '☢️ Сброс Ядерки (Ядерный Удар)',
        description: `Глобальная трансляция сообщения: "${trimmedContent.slice(0, 40)}..."`,
        timestamp: new Date().toISOString()
      });

      // Set global broadcast alert (visible to EVERYONE on ANY tab for 22 seconds)
      const nukeAlertObj = {
        id: 'nuke_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        senderId: sender.userId,
        senderUsername: sender.username || '@Wanderer',
        senderDisplayName: sender.displayName || 'Житель Пустоши',
        senderAvatarUrl: sender.avatarUrl || '',
        senderFrameId: sender.activeAvatarFrame || '',
        message: trimmedContent,
        timestamp: new Date().toISOString(),
        expiresAt: Date.now() + 22000 // 22 seconds display
      };
      data.nukeAlert = nukeAlertObj;

      // Log server activity
      appendActivityLog(data, {
        userId: sender.userId,
        username: sender.username,
        displayName: sender.displayName,
        userAvatarUrl: sender.avatarUrl,
        category: 'financial_tx',
        title: '☢️ Глобальный Ядерный Удар!',
        description: `${sender.displayName} сбросил ядерку на Пустошь (-100 ℰQ)! Сообщение: "${trimmedContent.slice(0, 60)}"`,
        details: { amount: -NUKE_PRICE, targetName: 'Ядерка Даст Таун' }
      });

      // Create glowing radioactive chat message in general feed
      const newNukeMessage = {
        id: 'msg_nuke_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        senderId: sender.userId,
        senderUsername: sender.username,
        senderDisplayName: sender.displayName,
        senderAvatarUrl: sender.avatarUrl,
        senderFrameId: sender.activeFrameId,
        senderRole: sender.role,
        content: trimmedContent,
        timestamp: new Date().toISOString(),
        type: 'nuke',
        isNuke: true,
        nukePricePaid: NUKE_PRICE,
        style: {
          ...(style || {}),
          customBgEffect: 'radiation',
          bubbleBorderTheme: 'border-lime-500 shadow-[0_0_25px_rgba(34,197,94,0.6)]',
          textColorClass: 'text-lime-300 font-bold'
        }
      };

      data.chatMessages.push(newNukeMessage);
      if (data.chatMessages.length > 250) data.chatMessages.shift();

      appendPipAnnouncement(data, {
        id: `notif_nuke_${nukeAlertObj.id}`,
        type: 'event',
        title: 'Ядерный сигнал в эфире',
        message: `${sender.displayName} запустил Ядерку. Послание: «${trimmedContent.slice(0, 140)}»`,
        targetTab: 'chat',
        iconEmoji: '☢️'
      });

      data.lastUpdated = new Date().toISOString();
      saveData(data);

      return res.json({
        success: true,
        message: newNukeMessage,
        nukeAlert: nukeAlertObj,
        senderProfile: sender
      });
    }

    // NORMAL MESSAGE OR DIRECT MESSAGE (DM)
    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      senderId: sender.userId,
      senderUsername: sender.username || '@Wanderer',
      senderDisplayName: sender.displayName || 'Житель Пустоши',
      senderAvatarUrl: sender.avatarUrl || '',
      senderFrameId: sender.activeAvatarFrame || '',
      senderRole: sender.role || 'user',
      content: trimmedContent,
      timestamp: new Date().toISOString(),
      type: 'text',
      style: style || {
        customBgUrl: sender.customBgUrl,
        customBgEffect: sender.customBgEffect || 'none',
        customBgPosition: sender.customBgPosition || 'center'
      },
      isNuke: false,
      recipientId: recipientId || undefined,
      recipientUsername: recipientUsername || undefined,
      recipientDisplayName: recipientDisplayName || undefined
    };

    data.chatMessages.push(newMsg);
    if (data.chatMessages.length > 250) data.chatMessages.shift();

    data.lastUpdated = new Date().toISOString();
    saveData(data);

    res.json({
      success: true,
      message: newMsg,
      senderProfile: sender
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Automatic announcement to community group when an event/collab/RP is published
app.post('/api/notify-group', async (req, res) => {
  try {
    const event = req.body?.event;
    if (!event) {
      return res.status(400).json({ error: 'Event object required' });
    }

    const appUrl = process.env.APP_URL || 'https://t.me/DustTown_RP_bot/app';
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
    const appUrl = process.env.APP_URL || 'https://t.me/DustTown_RP_bot/app';

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

// Version & build info endpoint
app.get('/api/version', (req, res) => {
  const buildInfoPath = path.join(__dirname, 'build-version.json');
  let buildInfo = {
    version: '1.2.5',
    builtAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    appName: 'DustTown RP — Telegram Bot & Mini App'
  };
  if (fs.existsSync(buildInfoPath)) {
    try {
      buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf-8'));
    } catch (e) {
      // ignore
    }
  }
  res.json({
    ...buildInfo,
    currentTime: new Date().toISOString(),
    telegramBot: 'active',
    port: PORT,
    persistence: {
      provider: firebaseConnected ? 'firebase' : 'local-json',
      configured: firebaseConfigured,
      healthy: firebaseHealthy,
      lastSyncedAt: firebaseLastSyncedAt,
      error: firebaseLastError ? 'Firebase sync failed; see server logs' : null
    }
  });
});

// Download prepared project files for Render.com
app.get('/api/download-render-zip', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'make_zip.py');
  const zipPath = path.join(__dirname, 'dusttown-rp-render.zip');

  exec(`python3 "${scriptPath}"`, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err || !fs.existsSync(zipPath)) {
      console.error('Failed to create zip:', err || stderr);
      return res.status(500).json({ error: 'Failed to generate zip file', details: String(err || stderr) });
    }

    const stat = fs.statSync(zipPath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', 'attachment; filename="dusttown-rp-render.zip"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);
  });
});

app.get('/api/get-zip-base64', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'make_zip.py');
  const zipPath = path.join(__dirname, 'dusttown-rp-render.zip');

  exec(`python3 "${scriptPath}"`, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err || !fs.existsSync(zipPath)) {
      console.error('Failed to create zip:', err || stderr);
      return res.status(500).json({ error: 'Failed to generate zip file', details: String(err || stderr) });
    }

    try {
      const buffer = fs.readFileSync(zipPath);
      res.json({
        success: true,
        filename: 'dusttown-rp-render.zip',
        size: buffer.length,
        base64: buffer.toString('base64'),
        updatedAt: fs.statSync(zipPath).mtime.toISOString()
      });
    } catch (readErr) {
      console.error('Error reading zip:', readErr);
      res.status(500).json({ error: 'Error reading zip file' });
    }
  });
});

// ==========================================
// INCREMENTAL UPDATE / GITHUB PATCH ENDPOINTS
// ==========================================

// Check status of changed files since last confirmation
app.get('/api/updates/status', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'patch_manager.py');
  exec(`python3 "${scriptPath}" status`, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) {
      console.error('Failed to get updates status:', err || stderr);
      return res.status(500).json({ error: 'Failed to inspect file updates', details: String(err || stderr) });
    }
    try {
      const data = JSON.parse(stdout.trim());
      res.json(data);
    } catch (parseErr) {
      res.status(500).json({ error: 'Invalid json from patch_manager', output: stdout });
    }
  });
});

// Get base64 encoded patch zip containing only updated files
app.get('/api/updates/get-patch-base64', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'patch_manager.py');
  exec(`python3 "${scriptPath}" make-patch`, { cwd: __dirname, maxBuffer: 1024 * 1024 * 64 }, (err, stdout, stderr) => {
    if (err) {
      console.error('Failed to generate patch:', err || stderr);
      return res.status(500).json({ error: 'Failed to generate patch zip', details: String(err || stderr) });
    }
    try {
      const data = JSON.parse(stdout.trim());
      res.json(data);
    } catch (parseErr) {
      res.status(500).json({ error: 'Invalid json from patch_manager', output: stdout });
    }
  });
});

// Direct stream download of patch zip
app.get('/api/updates/download-patch', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'patch_manager.py');
  const patchPath = path.join(__dirname, 'dusttown-update-patch.zip');

  exec(`python3 "${scriptPath}" make-patch`, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err || !fs.existsSync(patchPath)) {
      console.error('Failed to generate patch:', err || stderr);
      return res.status(500).send('Failed to generate patch: ' + (stderr || err?.message));
    }
    const stat = fs.statSync(patchPath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', 'attachment; filename="dusttown-update-patch.zip"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const fileStream = fs.createReadStream(patchPath);
    fileStream.pipe(res);
  });
});

// Confirm sync: resets checkpoint to current moment so button resets waiting for next changes
app.post('/api/updates/confirm-sync', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'patch_manager.py');
  exec(`python3 "${scriptPath}" confirm`, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) {
      console.error('Failed to confirm patch sync:', err || stderr);
      return res.status(500).json({ error: 'Failed to confirm sync checkpoint' });
    }
    try {
      const data = JSON.parse(stdout.trim());
      res.json(data);
    } catch (e) {
      res.json({ success: true, message: 'Синхронизация подтверждена' });
    }
  });
});

// Reset checkpoint
app.post('/api/updates/reset', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'patch_manager.py');
  exec(`python3 "${scriptPath}" reset`, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: 'Failed to reset' });
    res.json({ success: true });
  });
});

app.get('/api/data', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const data = getOrInitData();
  if (announceEventsStartingSoon(data)) saveData(data);
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

  if (action !== 'remove') {
    const grantedProfile = data.profiles.find((profile: any) => profile.username?.toLowerCase() === formattedTarget.toLowerCase());
    appendPipAnnouncement(data, {
      id: `notif_admin_${formattedTarget.toLowerCase()}`,
      type: 'new_admin',
      title: 'Назначен администратор',
      message: `Пипка сообщает: ${formattedTarget} получил права администратора Даст Таун.`,
      targetTab: 'profile',
      targetId: grantedProfile?.id || formattedTarget,
      iconEmoji: '🛡️'
    });
  }
  saveData(data);
  res.json({ success: true, admins: data.admins });
});

// Dedicated Profile Update Endpoint
app.post('/api/profile/update', async (req, res) => {
  try {
    const { userId, updates } = req.body;
    if (!userId || !updates) {
      return res.status(400).json({ error: 'Missing userId or updates' });
    }

    const data = getOrInitData();
    const profileIndex = data.profiles.findIndex(
      (p: any) => p.id === userId || (p.username && p.username.toLowerCase() === userId.toLowerCase())
    );

    if (profileIndex === -1) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const current = data.profiles[profileIndex];
    data.profiles[profileIndex] = {
      ...current,
      ...updates,
      id: current.id,
      username: current.username
    };

    appendActivityLog(data, {
      userId: current.id,
      username: current.username,
      displayName: current.displayName,
      userAvatarUrl: updates.avatarUrl || current.avatarUrl,
      category: 'profile_update',
      title: 'Обновление профиля сталкера',
      description: `Сталкер ${current.username} обновил параметры профиля, гардероб или аватарку`,
      details: { targetName: current.displayName }
    });

    data.lastUpdated = new Date().toISOString();
    await saveData(data);
    if (firebaseConnected && !firebaseHealthy) {
      return res.status(503).json({ error: 'Firebase не подтвердил сохранение профиля', persistence: 'firebase' });
    }
    res.json({ success: true, profile: data.profiles[profileIndex], fullData: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real-Time Activity Log Feed
app.get('/api/activity-log', (req, res) => {
  try {
    const data = getOrInitData();
    res.json({ success: true, logs: data.activityLogs || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Handshake: Join or Leave Event (Atomic server-verified transaction)
app.post('/api/handshake/join-event', (req, res) => {
  try {
    const { eventId, userId, username, action = 'join' } = req.body;
    if (!eventId || (!userId && !username)) {
      return res.status(400).json({ error: 'Missing eventId, userId, or username' });
    }

    const data = getOrInitData();
    data.events = data.events || [];
    const event = data.events.find((e: any) => e.id === eventId);
    if (!event) {
      return res.status(404).json({ error: 'Ивент не найден на сервере' });
    }

    event.participants = event.participants || [];
    const targetUsername = username || userId;
    const isJoined = event.participants.some(
      (p: string) => p.toLowerCase() === targetUsername.toLowerCase() || p === userId
    );

    const profile = data.profiles.find(
      (p: any) => p.id === userId || (p.username && p.username.toLowerCase() === targetUsername.toLowerCase())
    );

    let activityEntry = null;

    if (action === 'leave') {
      if (!isJoined) {
        return res.status(400).json({ error: 'Вы не зарегистрированы на этот ивент' });
      }
      event.participants = event.participants.filter(
        (p: string) => p.toLowerCase() !== targetUsername.toLowerCase() && p !== userId
      );

      activityEntry = appendActivityLog(data, {
        userId: profile?.id || userId,
        username: targetUsername,
        displayName: profile?.displayName || targetUsername,
        userAvatarUrl: profile?.avatarUrl,
        category: 'event_leave',
        title: 'Отказ от участия в вылазке',
        description: `Сталкер ${targetUsername} отозвал заявку на «${event.title}»`,
        details: { targetId: event.id, targetName: event.title }
      });
    } else {
      if (event.isCompleted) {
        return res.status(400).json({ error: 'Событие уже завершено' });
      }
      if (event.isPaused) {
        return res.status(400).json({ error: 'Регистрация на событие временно приостановлена' });
      }
      if (isJoined) {
        return res.status(400).json({ error: 'Вы уже зарегистрированы на этот ивент' });
      }

      event.participants.push(targetUsername);
      const reward = Number(event.rewardEquivaxes) || 0;

      if (profile && reward > 0) {
        if (!profile.isInfiniteEquivaxes && profile.username.toLowerCase() !== '@mrwhitepio') {
          profile.equivaxes = (profile.equivaxes || 0) + reward;
        }
        profile.transactions = profile.transactions || [];
        profile.transactions.unshift({
          id: 'tx_hs_join_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          userId: profile.id,
          amount: reward,
          type: event.type === 'planned_rp' ? 'income_rp' : 'income_event',
          title: `Регистрация (Handshake): ${event.title}`,
          description: 'Серверное подтверждение довольствия за запись',
          timestamp: new Date().toISOString(),
          balanceAfter: profile.equivaxes
        });
        if (event.type === 'planned_rp') {
          profile.plannedRpsAttended = (profile.plannedRpsAttended || 0) + 1;
        } else {
          profile.eventsAttended = (profile.eventsAttended || 0) + 1;
        }
      }

      activityEntry = appendActivityLog(data, {
        userId: profile?.id || userId,
        username: targetUsername,
        displayName: profile?.displayName || targetUsername,
        userAvatarUrl: profile?.avatarUrl,
        category: 'event_join',
        title: event.type === 'planned_rp' ? 'Запись на РП-сессию ⚔️' : 'Регистрация на Ивент 🎖️',
        description: `Сталкер ${targetUsername} подтвердил участие в «${event.title}» (+${reward} ℰQ)`,
        details: { amount: reward, targetId: event.id, targetName: event.title }
      });
    }

    data.lastUpdated = new Date().toISOString();
    saveData(data);

    res.json({
      success: true,
      handshakeId: activityEntry?.handshakeId || 'hs_' + Date.now(),
      event,
      updatedProfile: profile,
      fullData: data
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Handshake: Buy Item from Weekly Shop (Server verification and atomic funds deduction)
app.post('/api/handshake/buy-item', (req, res) => {
  try {
    const { itemId, userId, username } = req.body;
    if (!itemId || (!userId && !username)) {
      return res.status(400).json({ error: 'Missing itemId, userId, or username' });
    }

    const data = getOrInitData();
    data.weeklyShopItems = data.weeklyShopItems || [];
    const shopItem = data.weeklyShopItems.find((i: any) => i.id === itemId || i.itemId === itemId);
    if (!shopItem) {
      return res.status(404).json({ error: 'Товар не найден в торговом посту' });
    }

    const profile = data.profiles.find(
      (p: any) => p.id === userId || (p.username && p.username.toLowerCase() === username.toLowerCase())
    );
    if (!profile) {
      return res.status(404).json({ error: 'Профиль покупателя не найден' });
    }

    const isInfinite = profile.isInfiniteEquivaxes || profile.username.toLowerCase() === '@mrwhitepio';
    const price = Number(shopItem.price) || 0;

    if (!isInfinite && (profile.equivaxes || 0) < price) {
      return res.status(400).json({
        error: `Недостаточно Эквиваксов для покупки товара «${shopItem.name}». Требуется: ${price} ℰQ, у вас: ${profile.equivaxes || 0} ℰQ.`
      });
    }

    // Deduct price atomically
    if (!isInfinite) {
      profile.equivaxes = Math.max(0, (profile.equivaxes || 0) - price);
    }

    const invItem = {
      id: 'inv_hs_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      itemId: shopItem.itemId || shopItem.id,
      name: shopItem.name,
      photoUrl: shopItem.photoUrl,
      bgStyle: shopItem.bgStyle || '',
      textStyle: shopItem.textStyle || '',
      rarity: shopItem.rarity || 'common',
      type: shopItem.type || 'item',
      appliedValue: shopItem.appliedValue,
      acquiredAt: new Date().toISOString()
    };

    profile.inventory = [invItem, ...(profile.inventory || [])];
    profile.transactions = profile.transactions || [];
    profile.transactions.unshift({
      id: 'tx_hs_buy_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId: profile.id,
      amount: -price,
      type: 'expense_market',
      title: `Покупка: ${shopItem.name}`,
      description: 'Торговый пост Даст Таун (Handshake Verified)',
      timestamp: new Date().toISOString(),
      balanceAfter: profile.equivaxes
    });

    // Auto-unlock cosmetics for convenience
    if (shopItem.type === 'profile_theme' && shopItem.appliedValue) {
      profile.unlockedThemes = Array.from(new Set([...(profile.unlockedThemes || []), shopItem.appliedValue]));
    } else if (shopItem.type === 'avatar_frame' && shopItem.appliedValue) {
      profile.unlockedFrames = Array.from(new Set([...(profile.unlockedFrames || []), shopItem.appliedValue]));
    } else if (shopItem.type === 'profile_text_color' && shopItem.appliedValue) {
      profile.unlockedTextColors = Array.from(new Set([...(profile.unlockedTextColors || []), shopItem.appliedValue]));
    } else if (shopItem.type === 'profile_text_bg' && shopItem.appliedValue) {
      profile.unlockedTextBgs = Array.from(new Set([...(profile.unlockedTextBgs || []), shopItem.appliedValue]));
    }

    const logEntry = appendActivityLog(data, {
      userId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      userAvatarUrl: profile.avatarUrl,
      category: 'shop_purchase',
      title: 'Покупка в Торговом Посту 🛍️',
      description: `Сталкер ${profile.username} приобрёл «${shopItem.name}» за -${price} ℰQ`,
      details: { amount: -price, targetName: shopItem.name, targetId: shopItem.id, txType: 'expense_market' }
    });

    data.lastUpdated = new Date().toISOString();
    saveData(data);

    res.json({
      success: true,
      handshakeId: logEntry.handshakeId,
      updatedProfile: profile,
      item: invItem,
      fullData: data
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Handshake: Open Lootbox / Case (Server verification and atomic drop assignment)
app.post('/api/handshake/open-case', (req, res) => {
  try {
    const { caseId, userId, wonDef } = req.body;
    if (!caseId || !userId || !wonDef) {
      return res.status(400).json({ error: 'Missing caseId, userId, or wonDef' });
    }

    const data = getOrInitData();
    data.cases = data.cases || [];
    const caseBox = data.cases.find((c: any) => c.id === caseId);
    if (!caseBox) {
      return res.status(404).json({ error: 'Кейс не найден' });
    }

    const profile = data.profiles.find((p: any) => p.id === userId);
    if (!profile) {
      return res.status(404).json({ error: 'Профиль не найден' });
    }

    const isInfinite = profile.isInfiniteEquivaxes || profile.username.toLowerCase() === '@mrwhitepio';
    const price = Number(caseBox.price) || 0;

    if (!isInfinite && (profile.equivaxes || 0) < price) {
      return res.status(400).json({
        error: `Недостаточно Эквиваксов для открытия кейса «${caseBox.name}». Цена: ${price} ℰQ.`
      });
    }

    if (!isInfinite) {
      profile.equivaxes = Math.max(0, (profile.equivaxes || 0) - price);
    }

    const invItem = {
      id: 'inv_case_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      itemId: wonDef.id,
      name: wonDef.name,
      photoUrl: wonDef.photoUrl,
      bgStyle: wonDef.bgStyle,
      textStyle: wonDef.textStyle,
      rarity: wonDef.rarity,
      type: wonDef.type,
      appliedValue: wonDef.appliedValue,
      acquiredAt: new Date().toISOString()
    };

    profile.inventory = [invItem, ...(profile.inventory || [])];
    profile.transactions = profile.transactions || [];
    profile.transactions.unshift({
      id: 'tx_case_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId: profile.id,
      amount: -price,
      type: 'expense_case',
      title: `Открытие кейса: ${caseBox.name}`,
      description: `Получен предмет: ${wonDef.name} (${wonDef.rarity})`,
      timestamp: new Date().toISOString(),
      balanceAfter: profile.equivaxes
    });

    const logEntry = appendActivityLog(data, {
      userId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      userAvatarUrl: profile.avatarUrl,
      category: 'case_open',
      title: 'Открытие контейнера с лутом 📦',
      description: `Сталкер ${profile.username} открыл «${caseBox.name}» и получил «${wonDef.name}» (${wonDef.rarity.toUpperCase()})`,
      details: { amount: -price, targetName: wonDef.name, badge: wonDef.rarity }
    });

    data.lastUpdated = new Date().toISOString();
    saveData(data);

    res.json({
      success: true,
      handshakeId: logEntry.handshakeId,
      updatedProfile: profile,
      item: invItem,
      fullData: data
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dedicated Event Join / Leave Endpoint
app.post('/api/events/join', (req, res) => {
  try {
    const { eventId, userId, username, action } = req.body;
    if (!eventId || (!userId && !username)) {
      return res.status(400).json({ error: 'Missing eventId, userId, or username' });
    }

    const data = getOrInitData();
    data.events = data.events || [];
    const eventIndex = data.events.findIndex((e: any) => e.id === eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const targetEvent = data.events[eventIndex];
    targetEvent.participants = targetEvent.participants || [];

    const targetUsername = username || userId;
    const isJoined = targetEvent.participants.some(
      (p: string) => p.toLowerCase() === targetUsername.toLowerCase() || p === userId
    );

    if (action === 'leave') {
      targetEvent.participants = targetEvent.participants.filter(
        (p: string) => p.toLowerCase() !== targetUsername.toLowerCase() && p !== userId
      );
    } else {
      if (!isJoined && !targetEvent.isCompleted && !targetEvent.isPaused) {
        targetEvent.participants.push(targetUsername);

        const reward = targetEvent.rewardEquivaxes || 0;
        const profile = data.profiles.find(
          (p: any) => p.id === userId || (p.username && p.username.toLowerCase() === targetUsername.toLowerCase())
        );
        if (profile && reward > 0) {
          if (!profile.isInfiniteEquivaxes && profile.username.toLowerCase() !== '@mrwhitepio') {
            profile.equivaxes += reward;
          }
          profile.transactions = profile.transactions || [];
          profile.transactions.unshift({
            id: 'tx_join_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            userId: profile.id,
            amount: reward,
            type: targetEvent.type === 'planned_rp' ? 'income_rp' : 'income_event',
            title: `Регистрация: ${targetEvent.title}`,
            description: 'Стартовое довольствие за запись на вылазку',
            timestamp: new Date().toISOString(),
            balanceAfter: profile.equivaxes
          });
          if (targetEvent.type === 'planned_rp') {
            profile.plannedRpsAttended = (profile.plannedRpsAttended || 0) + 1;
          } else {
            profile.eventsAttended = (profile.eventsAttended || 0) + 1;
          }
        }
      }
    }

    data.lastUpdated = new Date().toISOString();
    saveData(data);
    res.json({ success: true, event: targetEvent, fullData: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dedicated Event Completion & Multi-player Reward Distribution Endpoint
app.post('/api/events/complete', (req, res) => {
  try {
    const { outcome } = req.body;
    if (!outcome || !outcome.eventId) {
      return res.status(400).json({ error: 'Missing outcome or eventId' });
    }

    const data = getOrInitData();
    data.events = data.events || [];
    const event = data.events.find((e: any) => e.id === outcome.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.isCompleted = true;
    event.completedAt = new Date().toISOString();

    const attendedSet = new Set((outcome.attendedUserIds || []).map((x: string) => x.toLowerCase()));
    const absentSet = new Set((outcome.absentUserIds || []).map((x: string) => x.toLowerCase()));
    const rewardAmount = Number(outcome.rewardAmount) || 0;
    const penaltyAmount = Number(outcome.penaltyAmount) || 0;
    const isPlannedRp = event.type === 'planned_rp';

    data.profiles.forEach((p: any) => {
      const idMatch = p.id && (attendedSet.has(p.id.toLowerCase()) || absentSet.has(p.id.toLowerCase()));
      const usernameMatch = p.username && (attendedSet.has(p.username.toLowerCase()) || absentSet.has(p.username.toLowerCase()));
      
      const isAttended = (p.id && attendedSet.has(p.id.toLowerCase())) || (p.username && attendedSet.has(p.username.toLowerCase()));
      const isAbsent = (p.id && absentSet.has(p.id.toLowerCase())) || (p.username && absentSet.has(p.username.toLowerCase()));

      if (!isAttended && !isAbsent) return;

      p.transactions = p.transactions || [];
      const isInfinite = p.isInfiniteEquivaxes || p.username?.toLowerCase() === '@mrwhitepio';

      if (isAttended) {
        if (!isInfinite && rewardAmount > 0) {
          p.equivaxes = (p.equivaxes || 0) + rewardAmount;
        }
        if (rewardAmount > 0) {
          p.transactions.unshift({
            id: 'tx_comp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            userId: p.id,
            amount: rewardAmount,
            type: isPlannedRp ? 'income_rp' : 'income_event',
            title: `Завершение: ${event.title}`,
            description: 'Успешное участие в миссии Даст Таун',
            timestamp: new Date().toISOString(),
            balanceAfter: p.equivaxes
          });
        }
        if (isPlannedRp) {
          p.plannedRpsAttended = (p.plannedRpsAttended || 0) + 1;
        } else {
          p.eventsAttended = (p.eventsAttended || 0) + 1;
        }
      } else if (isAbsent) {
        if (!isInfinite && penaltyAmount > 0) {
          p.equivaxes = (p.equivaxes || 0) - penaltyAmount;
        }
        if (penaltyAmount > 0) {
          p.transactions.unshift({
            id: 'tx_pen_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            userId: p.id,
            amount: -penaltyAmount,
            type: 'expense_penalty',
            title: `Штраф за неявку: ${event.title}`,
            description: 'Неявка на зарегистрированное мероприятие',
            timestamp: new Date().toISOString(),
            balanceAfter: p.equivaxes
          });
        }
      }
    });

    data.lastUpdated = new Date().toISOString();
    appendActivityLog(data, {
      username: '@DustTownBot',
      displayName: 'Штаб Даст Таун',
      category: 'event_complete',
      title: 'Ивент успешно завершён 🏆',
      description: `Подведены итоги «${event.title}»: ${attendedSet.size} участников получили награду (+${rewardAmount} ℰQ)`,
      details: { amount: rewardAmount, targetId: event.id, targetName: event.title }
    });
    saveData(data);
    res.json({ success: true, event, fullData: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dedicated Artworks Endpoints for atomic sync & tip redistribution
app.post('/api/artworks/add', (req, res) => {
  try {
    const { artwork } = req.body;
    if (!artwork || !artwork.id || !artwork.imageUrl) {
      return res.status(400).json({ error: 'Missing artwork data' });
    }
    const data = getOrInitData();
    data.artworks = data.artworks || [];
    const existingIndex = data.artworks.findIndex((a: any) => a.id === artwork.id);
    if (existingIndex >= 0) {
      data.artworks[existingIndex] = { ...data.artworks[existingIndex], ...artwork };
    } else {
      data.artworks.unshift(artwork);
    }
    appendActivityLog(data, {
      userId: artwork.artistUsername,
      username: artwork.artistUsername,
      displayName: artwork.artistName,
      userAvatarUrl: artwork.artistAvatarUrl,
      category: 'art_publish',
      title: 'Новый авторский арт в Галерее 🎨',
      description: `Художник ${artwork.artistUsername} опубликовал арт «${artwork.title}»`,
      details: { targetId: artwork.id, targetName: artwork.title }
    });
    data.lastUpdated = new Date().toISOString();
    saveData(data);
    res.json({ success: true, artwork, fullData: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artworks/like', (req, res) => {
  try {
    const { artId, userId } = req.body;
    if (!artId || !userId) {
      return res.status(400).json({ error: 'Missing artId or userId' });
    }
    const data = getOrInitData();
    data.artworks = data.artworks || [];
    const art = data.artworks.find((a: any) => a.id === artId);
    if (!art) {
      return res.status(404).json({ error: 'Artwork not found' });
    }
    art.likedByUserIds = art.likedByUserIds || [];
    const isLiked = art.likedByUserIds.includes(userId);
    if (isLiked) {
      art.likedByUserIds = art.likedByUserIds.filter((id: string) => id !== userId);
      art.likesCount = Math.max(0, (art.likesCount || 1) - 1);
    } else {
      art.likedByUserIds.push(userId);
      art.likesCount = (art.likesCount || 0) + 1;
    }
    data.lastUpdated = new Date().toISOString();
    saveData(data);
    res.json({ success: true, art, fullData: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artworks/tip', (req, res) => {
  try {
    const { artId, senderId, senderUsername, amount } = req.body;
    if (!artId || !senderId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid tip parameters' });
    }
    const data = getOrInitData();
    data.artworks = data.artworks || [];
    const art = data.artworks.find((a: any) => a.id === artId);
    if (!art) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    const sender = data.profiles.find((p: any) => p.id === senderId || (p.username && p.username.toLowerCase() === senderUsername?.toLowerCase()));
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    if (!sender.isInfiniteEquivaxes && sender.username?.toLowerCase() !== '@mrwhitepio') {
      if ((sender.equivaxes || 0) < amount) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      sender.equivaxes -= amount;
    }

    sender.transactions = sender.transactions || [];
    sender.transactions.unshift({
      id: 'tx_tip_out_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId: sender.id,
      amount: -amount,
      type: 'expense_art_tip',
      title: 'Чаевые художнику',
      description: `Поддержка автора ${art.artistUsername} за работу «${art.title}»`,
      timestamp: new Date().toISOString(),
      balanceAfter: sender.equivaxes
    });

    // Credit author / artist if found in profiles
    const artist = data.profiles.find((p: any) =>
      p.username?.toLowerCase() === art.artistUsername?.toLowerCase() ||
      p.displayName?.toLowerCase() === art.artistName?.toLowerCase()
    );
    if (artist) {
      if (!artist.isInfiniteEquivaxes && artist.username?.toLowerCase() !== '@mrwhitepio') {
        artist.equivaxes = (artist.equivaxes || 0) + amount;
      }
      artist.transactions = artist.transactions || [];
      artist.transactions.unshift({
        id: 'tx_tip_in_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        userId: artist.id,
        amount: +amount,
        type: 'income_art_tip',
        title: 'Чаевые за авторский арт',
        description: `От сталкера ${senderUsername || sender.username} за арт «${art.title}»`,
        timestamp: new Date().toISOString(),
        balanceAfter: artist.equivaxes
      });
    }

    art.tipsReceived = (art.tipsReceived || 0) + amount;
    appendActivityLog(data, {
      userId: sender.id,
      username: sender.username,
      displayName: sender.displayName,
      userAvatarUrl: sender.avatarUrl,
      category: 'art_tip',
      title: 'Чаевые художнику 💸',
      description: `Сталкер ${sender.username} отправил +${amount} ℰQ автору ${art.artistUsername} за арт «${art.title}»`,
      details: { amount, targetId: art.id, targetName: art.title }
    });
    data.lastUpdated = new Date().toISOString();
    saveData(data);
    res.json({ success: true, art, fullData: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Self-Healing Restore Endpoint (revives players/events if server had a cold start)
app.post('/api/data/restore', (req, res) => {
  try {
    const current = getOrInitData();
    const incoming = req.body;

    if (incoming && typeof incoming === 'object') {
      const profileMap = new Map();
      (current.profiles || []).forEach((p: any) => profileMap.set(p.id, p));
      (incoming.profiles || []).forEach((p: any) => {
        if (!profileMap.has(p.id)) profileMap.set(p.id, p);
      });

      const eventMap = new Map();
      (current.events || []).forEach((e: any) => eventMap.set(e.id, e));
      (incoming.events || []).forEach((e: any) => {
        if (!eventMap.has(e.id)) eventMap.set(e.id, e);
      });

      const charMap = new Map();
      (current.characters || []).forEach((c: any) => charMap.set(c.id, c));
      (incoming.characters || []).forEach((c: any) => {
        if (!charMap.has(c.id)) charMap.set(c.id, c);
      });

      const mergedData = {
        ...current,
        profiles: Array.from(profileMap.values()),
        events: Array.from(eventMap.values()),
        characters: Array.from(charMap.values()),
        lastUpdated: new Date().toISOString()
      };

      saveData(mergedData);
      return res.json({ success: true, restored: true, count: mergedData.profiles.length });
    }
    res.status(400).json({ error: 'Invalid body' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/data', (req, res) => {
  try {
    const current = getOrInitData();
    const incoming = req.body;

    if (incoming && typeof incoming === 'object') {
      // 1. Merge profiles: never drop any existing profile, update fields from incoming
      const profileMap = new Map();
      (current.profiles || []).forEach((p: any) => profileMap.set(p.id, p));

      (incoming.profiles || []).forEach((inc: any) => {
        const existing = profileMap.get(inc.id);
        if (!existing) {
          profileMap.set(inc.id, inc);
        } else {
          profileMap.set(inc.id, {
            ...existing,
            ...inc,
            pinnedArts: inc.pinnedArts || existing.pinnedArts,
            equivaxes: typeof inc.equivaxes === 'number' ? inc.equivaxes : existing.equivaxes,
            transactions: (inc.transactions && inc.transactions.length >= (existing.transactions?.length || 0))
              ? inc.transactions
              : existing.transactions
          });
        }
      });

      // 2. Merge events: union participants for each event
      const eventMap = new Map();
      (current.events || []).forEach((e: any) => eventMap.set(e.id, e));

      (incoming.events || []).forEach((incEv: any) => {
        const existingEv = eventMap.get(incEv.id);
        if (!existingEv) {
          eventMap.set(incEv.id, incEv);
        } else {
          const mergedParticipants = Array.from(
            new Set([...(existingEv.participants || []), ...(incEv.participants || [])])
          );
          eventMap.set(incEv.id, {
            ...existingEv,
            ...incEv,
            participants: mergedParticipants,
            isCompleted: existingEv.isCompleted || incEv.isCompleted
          });
        }
      });

      // 3. Merge other collections
      const charMap = new Map();
      (current.characters || []).forEach((c: any) => charMap.set(c.id, c));
      (incoming.characters || []).forEach((c: any) => charMap.set(c.id, c));

      const artMap = new Map();
      (current.artworks || []).forEach((a: any) => artMap.set(a.id, a));
      (incoming.artworks || []).forEach((a: any) => artMap.set(a.id, a));

      const factionMap = new Map();
      (current.factions || []).forEach((f: any) => factionMap.set(f.id, f));
      (incoming.factions || []).forEach((f: any) => factionMap.set(f.id, f));

      const auctionMap = new Map();
      (current.auctionListings || []).forEach((a: any) => auctionMap.set(a.id, a));
      (incoming.auctionListings || []).forEach((a: any) => auctionMap.set(a.id, a));

      const mergedData = {
        ...current,
        ...incoming,
        profiles: Array.from(profileMap.values()),
        events: Array.from(eventMap.values()),
        characters: Array.from(charMap.values()),
        artworks: Array.from(artMap.values()),
        factions: Array.from(factionMap.values()),
        auctionListings: Array.from(auctionMap.values()),
        notifications: Array.from(new Map([
          ...(current.notifications || []),
          ...(incoming.notifications || [])
        ].map((notification: any) => [notification.id, notification])).values())
          .sort((left: any, right: any) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
          .slice(0, 150),
        lastUpdated: new Date().toISOString()
      };

      announceNewStateRecords(current, mergedData);
      saveData(mergedData);
      return res.json({ success: true, count: mergedData.profiles.length, lastUpdated: mergedData.lastUpdated });
    }
    res.status(400).json({ error: 'Invalid state body' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Production polling is started from startServer; local development stays disconnected by default.

// Mount Vite or serve static
async function startServer() {
  await initializeFirebasePersistence();

  const distDir = path.join(__dirname, 'dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  const hasBuiltDist = fs.existsSync(indexHtmlPath);

  // On Render or in production: if built static assets exist, serve from dist/ directly
  const isExplicitDev = process.env.NODE_ENV === 'development';
  if (hasBuiltDist && !isExplicitDev) {
    // Cache immutable hashed assets
    app.use('/assets', express.static(path.join(distDir, 'assets'), {
      maxAge: '1y',
      immutable: true
    }));

    // Static files with no-cache for HTML files
    app.use(express.static(distDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('.json')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    // SPA fallback: always serve index.html with NO-CACHE headers so updates appear immediately
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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

  if (process.env.NODE_ENV === 'production' && process.env.DISABLE_TELEGRAM_POLLING !== 'true') {
    startTelegramPolling().catch(error => {
      console.error('Failed to start Telegram polling:', error);
    });
  }
}

startServer();
