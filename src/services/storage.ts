import { AppStateData, UserProfile, RPEvent, CharacterSheet, Award, CaseBox, CaseItemDefinition, Achievement, Faction } from '../types';
import { INITIAL_ARTWORKS, INITIAL_NOTIFICATIONS, INITIAL_BOT_VERSIONS } from './galleryAndNotificationsData';

const STORAGE_KEY = 'dusttown_rp_app_state_v3_clean';

export const INITIAL_FACTIONS: Faction[] = [];

// Extended catalog of cosmetics & items:
// Colors, background cards, animated themes (rad_storm, rad_core, black_tree, quantum, cyber, solar), and avatar frames (3D gold, rad pulse, cyber glitch, rainbow, steel rivets, enclave wings, toxic flame)
export const INITIAL_CASE_ITEMS: CaseItemDefinition[] = [
  // --- 1. ТЕМЫ ОФОРМЛЕНИЯ ПРОФИЛЯ (Анимированные) ---
  {
    id: 'cosm_theme_rad_core',
    name: 'Анимированная Тема: Реактор Радиации ☢️',
    photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-emerald-950 via-zinc-950 to-green-950 border-emerald-500/70',
    textStyle: 'text-emerald-400 font-bold drop-shadow-[0_0_8px_#34d399]',
    rarity: 'legendary',
    type: 'profile_theme',
    appliedValue: 'rad_core'
  },
  {
    id: 'cosm_theme_rad_storm',
    name: 'Анимированная Тема: Радиоактивный Шторм ☣️',
    photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-green-950/80 via-zinc-950 to-emerald-950 border-emerald-400/60',
    textStyle: 'text-lime-300 font-bold',
    rarity: 'epic',
    type: 'profile_theme',
    appliedValue: 'rad_storm'
  },
  {
    id: 'cosm_theme_black_tree',
    name: 'Анимированная Тема: Чёрное Древо Пустоши 🍁',
    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-stone-950 via-rose-950/30 to-zinc-950 border-rose-600/60',
    textStyle: 'text-rose-300 font-bold',
    rarity: 'legendary',
    type: 'profile_theme',
    appliedValue: 'black_tree'
  },
  {
    id: 'cosm_theme_quantum',
    name: 'Анимированная Тема: Квантовое Поле Спарка 💎',
    photoUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-cyan-950 via-slate-950 to-blue-950 border-cyan-400/60',
    textStyle: 'text-cyan-300 font-bold drop-shadow-[0_0_8px_#38bdf8]',
    rarity: 'epic',
    type: 'profile_theme',
    appliedValue: 'quantum_pulse'
  },
  {
    id: 'cosm_theme_cyber_neon',
    name: 'Анимированная Тема: Кибер-Неон Пустоши ⚡',
    photoUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-fuchsia-950/60 via-zinc-950 to-purple-950 border-fuchsia-500/60',
    textStyle: 'text-fuchsia-400 font-bold',
    rarity: 'rare',
    type: 'profile_theme',
    appliedValue: 'cyber_neon'
  },

  // --- 2. РАМКИ ДЛЯ ПРОФИЛЯ И АВАТАРА (3D, анимированные, светящиеся) ---
  {
    id: 'frame_gold_3d',
    name: '3D-Рамка: Довоенное Золото Рейнджера ⭐',
    photoUrl: 'https://images.unsplash.com/photo-1589793907316-f94025b46850?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-amber-900/60 via-yellow-950 to-zinc-950 border-amber-400',
    textStyle: 'text-amber-300 font-bold',
    rarity: 'legendary',
    type: 'avatar_frame',
    appliedValue: 'frame_gold_3d'
  },
  {
    id: 'frame_rad_pulse',
    name: 'Анимированная Рамка: Радиоактивный Пульс ☢️',
    photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-emerald-950 to-black border-emerald-400',
    textStyle: 'text-emerald-400 font-bold',
    rarity: 'epic',
    type: 'avatar_frame',
    appliedValue: 'frame_rad_pulse'
  },
  {
    id: 'frame_cyber_glitch',
    name: 'Анимированная Рамка: Кибер-Глитч Голограмма 💽',
    photoUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-cyan-950 to-purple-950 border-cyan-400',
    textStyle: 'text-cyan-300 font-bold',
    rarity: 'rare',
    type: 'avatar_frame',
    appliedValue: 'frame_cyber_glitch'
  },
  {
    id: 'frame_rainbow_neon',
    name: 'Анимированная Рамка: Радужная Призма 🌈',
    photoUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-pink-950 via-purple-950 to-blue-950 border-pink-400',
    textStyle: 'rainbow-shimmer-text font-bold',
    rarity: 'epic',
    type: 'avatar_frame',
    appliedValue: 'frame_rainbow_neon'
  },
  {
    id: 'frame_steel_rivets',
    name: 'Стальная 3D-Рамка: Броня Сталкера 🛡️',
    photoUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-stone-900 to-zinc-950 border-stone-500',
    textStyle: 'text-stone-300 font-bold',
    rarity: 'common',
    type: 'avatar_frame',
    appliedValue: 'frame_steel_rivets'
  },
  {
    id: 'frame_enclave_wings',
    name: 'Золотая Рамка: Крылья Анклава 🪽',
    photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-yellow-950 to-amber-950 border-yellow-400',
    textStyle: 'text-yellow-300 font-bold',
    rarity: 'epic',
    type: 'avatar_frame',
    appliedValue: 'frame_enclave_wings'
  },
  {
    id: 'frame_toxic_flame',
    name: 'Анимированная Рамка: Токсичное Пламя 🔥',
    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-emerald-950 via-lime-950 to-zinc-950 border-lime-400',
    textStyle: 'text-lime-400 font-bold',
    rarity: 'rare',
    type: 'avatar_frame',
    appliedValue: 'frame_toxic_flame'
  },

  // --- 3. РАСШИРЕННЫЕ СТИЛИ И ЦВЕТА ТЕКСТА ПРОФИЛЯ ---
  {
    id: 'cosm_color_rad_green',
    name: 'Цвет текста: Радиационный Неон-Зелёный',
    photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-emerald-950 to-black border-emerald-400',
    textStyle: 'text-emerald-400 font-bold drop-shadow-[0_0_10px_#10b981]',
    rarity: 'rare',
    type: 'profile_text_color',
    appliedValue: 'text-emerald-400 font-bold drop-shadow-[0_0_10px_#10b981]'
  },
  {
    id: 'cosm_color_rainbow',
    name: 'Цвет текста: Радужный Шиммер (Анимированный)',
    photoUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-pink-950 via-purple-950 to-blue-950 border-pink-400',
    textStyle: 'rainbow-shimmer-text font-bold',
    rarity: 'epic',
    type: 'profile_text_color',
    appliedValue: 'rainbow-shimmer-text font-bold'
  },
  {
    id: 'cosm_color_cyan',
    name: 'Цвет текста: Квантовый Голубой Неон',
    photoUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-cyan-950 to-sky-950 border-cyan-400',
    textStyle: 'text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]',
    rarity: 'rare',
    type: 'profile_text_color',
    appliedValue: 'text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]'
  },
  {
    id: 'cosm_color_amber',
    name: 'Цвет текста: Радиационный Янтарь',
    photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-amber-950 to-orange-950 border-amber-500',
    textStyle: 'text-amber-400 font-bold drop-shadow-[0_0_8px_#f59e0b]',
    rarity: 'rare',
    type: 'profile_text_color',
    appliedValue: 'text-amber-400 font-bold drop-shadow-[0_0_8px_#f59e0b]'
  },
  {
    id: 'cosm_color_crimson',
    name: 'Цвет текста: Алый Пламень Пустоши',
    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-red-950 to-stone-950 border-red-500',
    textStyle: 'text-red-400 font-bold drop-shadow-[0_0_8px_#ef4444]',
    rarity: 'rare',
    type: 'profile_text_color',
    appliedValue: 'text-red-400 font-bold drop-shadow-[0_0_8px_#ef4444]'
  },
  {
    id: 'cosm_color_purple_void',
    name: 'Цвет текста: Фиолетовая Бездна Мегазаклинания',
    photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-purple-950 to-indigo-950 border-purple-500',
    textStyle: 'text-purple-300 font-bold drop-shadow-[0_0_8px_#c084fc]',
    rarity: 'epic',
    type: 'profile_text_color',
    appliedValue: 'text-purple-300 font-bold drop-shadow-[0_0_8px_#c084fc]'
  },
  {
    id: 'cosm_color_gold_pure',
    name: 'Цвет текста: Чистое Королевское Золото',
    photoUrl: 'https://images.unsplash.com/photo-1589793907316-f94025b46850?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-yellow-950 to-amber-950 border-yellow-400',
    textStyle: 'text-yellow-300 font-bold drop-shadow-[0_0_8px_#fde047]',
    rarity: 'epic',
    type: 'profile_text_color',
    appliedValue: 'text-yellow-300 font-bold drop-shadow-[0_0_8px_#fde047]'
  },
  {
    id: 'cosm_color_pipboy_green',
    name: 'Цвет текста: Пип-Бак Монохром (Терминал)',
    photoUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-zinc-950 to-green-950 border-green-600',
    textStyle: 'text-green-400 font-mono-pip font-bold tracking-widest',
    rarity: 'common',
    type: 'profile_text_color',
    appliedValue: 'text-green-400 font-mono-pip font-bold tracking-widest'
  },

  // --- 4. РАСШИРЕННЫЕ ФОНЫ КАРТОЧКИ ПРОФИЛЯ ---
  {
    id: 'cosm_bg_rad_bunker',
    name: 'Фон профиля: Бункер Радиационной Защиты ☢️',
    photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-emerald-950/70 via-zinc-950 to-green-950 border-emerald-500/50',
    textStyle: 'text-emerald-200',
    rarity: 'rare',
    type: 'profile_text_bg',
    appliedValue: 'bg-gradient-to-br from-emerald-950/80 via-zinc-950 to-green-950/90 border border-emerald-500/50 shadow-emerald-950/60'
  },
  {
    id: 'cosm_bg_quantum_field',
    name: 'Фон профиля: Квантовое Поле Эквиваксов 💎',
    photoUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-cyan-950/70 via-blue-950/60 to-zinc-950 border-cyan-500/50',
    textStyle: 'text-cyan-200',
    rarity: 'epic',
    type: 'profile_text_bg',
    appliedValue: 'bg-gradient-to-br from-cyan-950/70 via-blue-950/60 to-zinc-950 border border-cyan-400/50 shadow-cyan-950/60'
  },
  {
    id: 'cosm_bg_carbon_plate',
    name: 'Фон профиля: Углепластиковый Блиндаж 🛡️',
    photoUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-zinc-900 to-black border-zinc-700',
    textStyle: 'text-zinc-200',
    rarity: 'common',
    type: 'profile_text_bg',
    appliedValue: 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-zinc-700/80 shadow-inner'
  },
  {
    id: 'cosm_bg_crimson_sunset',
    name: 'Фон профиля: Закат над Кратером 🌅',
    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-red-950/80 via-amber-950/50 to-black border-red-500/50',
    textStyle: 'text-amber-200',
    rarity: 'rare',
    type: 'profile_text_bg',
    appliedValue: 'bg-gradient-to-br from-red-950/70 via-zinc-950 to-amber-950/60 border border-red-500/40 shadow-red-950/50'
  },
  {
    id: 'cosm_bg_enclave_palace',
    name: 'Фон профиля: Небесные Чертоги Анклава 🏛️',
    photoUrl: 'https://images.unsplash.com/photo-1589793907316-f94025b46850?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-amber-950/80 via-yellow-950/50 to-zinc-950 border-amber-400/60',
    textStyle: 'text-amber-100',
    rarity: 'epic',
    type: 'profile_text_bg',
    appliedValue: 'bg-gradient-to-tr from-amber-950/80 via-stone-900 to-yellow-950/50 border border-amber-400/60 shadow-amber-950/60'
  },
  {
    id: 'cosm_bg_amethyst_void',
    name: 'Фон профиля: Аметистовая Аномалия 🔮',
    photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-purple-950 via-fuchsia-950 to-black border-purple-500/50',
    textStyle: 'text-purple-200',
    rarity: 'rare',
    type: 'profile_text_bg',
    appliedValue: 'bg-gradient-to-br from-purple-950/70 via-zinc-950 to-indigo-950/70 border border-purple-500/50 shadow-purple-950/50'
  }
];

// USER'S PROFILE ONLY (Clean state with creator profile)
export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'owner_mrwhitepio',
    username: '@MrWhitePio',
    displayName: 'MrWhitePio [Создатель]',
    avatarUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80',
    bio: 'Главный Архитектор и Создатель DustTown RP. Магитех-инженер довоенных времен.',
    equivaxes: 9999999,
    isInfiniteEquivaxes: true,
    joinedAt: '2026-01-01T00:00:00Z',
    activeThemeId: 'rad_core', // Showcase the requested new radiation core theme!
    activeTextColor: 'text-emerald-400 font-bold drop-shadow-[0_0_10px_#10b981]',
    activeTextBg: 'bg-gradient-to-br from-emerald-950/80 via-zinc-950 to-green-950/90 border border-emerald-500/50 shadow-emerald-950/60',
    activeAvatarFrame: 'frame_gold_3d', // Showcase the requested 3D frame!
    eventsAttended: 0,
    plannedRpsAttended: 0,
    inventory: [
      {
        id: 'inv_theme_core',
        itemId: 'cosm_theme_rad_core',
        name: 'Анимированная Тема: Реактор Радиации ☢️',
        photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        bgStyle: 'from-emerald-950 via-zinc-950 to-green-950 border-emerald-500/70',
        textStyle: 'text-emerald-400 font-bold drop-shadow-[0_0_8px_#34d399]',
        rarity: 'legendary',
        type: 'profile_theme',
        appliedValue: 'rad_core',
        acquiredAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'inv_theme_storm',
        itemId: 'cosm_theme_rad_storm',
        name: 'Анимированная Тема: Радиоактивный Шторм ☣️',
        photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        bgStyle: 'from-green-950/80 via-zinc-950 to-emerald-950 border-emerald-400/60',
        textStyle: 'text-lime-300 font-bold',
        rarity: 'epic',
        type: 'profile_theme',
        appliedValue: 'rad_storm',
        acquiredAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'inv_theme_tree',
        itemId: 'cosm_theme_black_tree',
        name: 'Анимированная Тема: Чёрное Древо Пустоши 🍁',
        photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
        bgStyle: 'from-stone-950 via-rose-950/30 to-zinc-950 border-rose-600/60',
        textStyle: 'text-rose-300 font-bold',
        rarity: 'legendary',
        type: 'profile_theme',
        appliedValue: 'black_tree',
        acquiredAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'inv_frame_gold',
        itemId: 'frame_gold_3d',
        name: '3D-Рамка: Довоенное Золото Рейнджера ⭐',
        photoUrl: 'https://images.unsplash.com/photo-1589793907316-f94025b46850?auto=format&fit=crop&w=400&q=80',
        bgStyle: 'from-amber-900/60 via-yellow-950 to-zinc-950 border-amber-400',
        textStyle: 'text-amber-300 font-bold',
        rarity: 'legendary',
        type: 'avatar_frame',
        appliedValue: 'frame_gold_3d',
        acquiredAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'inv_frame_rad',
        itemId: 'frame_rad_pulse',
        name: 'Анимированная Рамка: Радиоактивный Пульс ☢️',
        photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        bgStyle: 'from-emerald-950 to-black border-emerald-400',
        textStyle: 'text-emerald-400 font-bold',
        rarity: 'epic',
        type: 'avatar_frame',
        appliedValue: 'frame_rad_pulse',
        acquiredAt: '2026-01-01T00:00:00Z'
      }
    ],
    transactions: [
      {
        id: 'tx_seed_1',
        userId: 'owner_mrwhitepio',
        amount: 5000,
        type: 'income_admin',
        title: 'Основание города Даст Таун',
        description: 'Стартовый капитал основателя и архитектора поселения',
        timestamp: '2026-01-01T12:00:00Z',
        balanceAfter: 5000
      },
      {
        id: 'tx_seed_2',
        userId: 'owner_mrwhitepio',
        amount: 1500,
        type: 'income_event',
        title: 'Экспедиция «Древнее убежище Магитехов»',
        description: 'Успешная вылазка и возвращение с довоенными чертежами',
        timestamp: '2026-01-10T18:30:00Z',
        balanceAfter: 6500
      },
      {
        id: 'tx_seed_3',
        userId: 'owner_mrwhitepio',
        amount: -500,
        type: 'expense_privilege',
        title: 'VIP-Статус «Властелин Пустоши»',
        description: 'Пожизненный доступ к закрытой вкладке «Пред-релиз»',
        timestamp: '2026-01-12T14:15:00Z',
        balanceAfter: 6000
      },
      {
        id: 'tx_seed_4',
        userId: 'owner_mrwhitepio',
        amount: 850,
        type: 'income_auction',
        title: 'Продажа на аукционе: Тяжёлая броня Рейнджера',
        description: 'Лот успешно выкуплен сталкером каравана',
        timestamp: '2026-01-18T20:45:00Z',
        balanceAfter: 6850
      },
      {
        id: 'tx_seed_5',
        userId: 'owner_mrwhitepio',
        amount: -250,
        type: 'expense_case',
        title: 'Открытие: Квантовый Реликвий',
        description: 'Получена легендарная анимированная тема «Реактор Радиации»',
        timestamp: '2026-01-22T16:00:00Z',
        balanceAfter: 6600
      }
    ]
  }
];

export function deduplicateProfiles(profiles: UserProfile[]): UserProfile[] {
  if (!Array.isArray(profiles) || profiles.length === 0) return [];

  const map = new Map<string, UserProfile>();

  for (const p of profiles) {
    if (!p) continue;
    const rawUsername = (p.username || '').trim().toLowerCase();
    const isOwner = rawUsername === '@mrwhitepio' || p.id === 'owner_mrwhitepio' || p.id === 'user_mrwhite' || p.id === 'user_pio';

    const key = isOwner ? '@mrwhitepio' : (rawUsername || p.id);

    const existing = map.get(key);
    if (!existing) {
      if (isOwner) {
        map.set(key, {
          ...p,
          id: 'owner_mrwhitepio',
          username: '@MrWhitePio',
          displayName: p.displayName?.includes('MrWhitePio') ? p.displayName : 'MrWhitePio [Создатель]',
          isInfiniteEquivaxes: true
        });
      } else {
        map.set(key, { ...p });
      }
    } else {
      const merged: UserProfile = {
        ...existing,
        ...p,
        id: isOwner ? 'owner_mrwhitepio' : existing.id,
        username: isOwner ? '@MrWhitePio' : (existing.username || p.username),
        displayName: (existing.displayName && !existing.displayName.startsWith('Сталкер #')) ? existing.displayName : (p.displayName || existing.displayName),
        avatarUrl: (existing.avatarUrl && !existing.avatarUrl.includes('unsplash.com/photo-1535713875002')) ? existing.avatarUrl : (p.avatarUrl || existing.avatarUrl),
        bio: (existing.bio && existing.bio.length >= (p.bio?.length || 0)) ? existing.bio : (p.bio || existing.bio),
        equivaxes: isOwner ? 9999999 : (typeof p.equivaxes === 'number' ? p.equivaxes : existing.equivaxes),
        isInfiniteEquivaxes: isOwner || existing.isInfiniteEquivaxes || p.isInfiniteEquivaxes,
        activeThemeId: (p.activeThemeId && p.activeThemeId !== 'default') ? p.activeThemeId : (existing.activeThemeId || 'default'),
        activeAvatarFrame: (p.activeAvatarFrame && p.activeAvatarFrame !== 'frame_none') ? p.activeAvatarFrame : (existing.activeAvatarFrame || 'frame_none'),
        activeTextColor: p.activeTextColor || existing.activeTextColor,
        activeTextBg: p.activeTextBg || existing.activeTextBg,
        customBgUrl: p.customBgUrl || existing.customBgUrl,
        customBgEffect: p.customBgEffect || existing.customBgEffect,
        eventsAttended: Math.max(existing.eventsAttended || 0, p.eventsAttended || 0),
        plannedRpsAttended: Math.max(existing.plannedRpsAttended || 0, p.plannedRpsAttended || 0),
        inventory: Array.from(new Map([...(existing.inventory || []), ...(p.inventory || [])].map(i => [i.id || i.itemId, i])).values()),
        transactions: Array.from(new Map([...(existing.transactions || []), ...(p.transactions || [])].map(t => [t.id, t])).values())
      };
      map.set(key, merged);
    }
  }

  return Array.from(map.values());
}

export const INITIAL_ADMINS = [
  {
    username: '@MrWhitePio',
    tags: ['Главный Создатель', 'Архитектор DustTown', 'Supreme GM'],
    addedAt: '2026-01-01T00:00:00Z',
    isMainCreator: true
  }
];

// Clean state: all example events, cases, awards removed as requested by the user
export const INITIAL_AWARDS: Award[] = [];
export const INITIAL_EVENTS: RPEvent[] = [];
export const INITIAL_CASES: CaseBox[] = [];
export const INITIAL_CHARACTERS: CharacterSheet[] = [];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_first_steps',
    title: 'Первые шаги по Пустоши',
    description: 'Успешно примите участие в первой РП-сессии или ивенте Даст Таун.',
    type: 'any_event_count',
    targetValue: 1,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
    rewardType: 'equivaxes',
    rewardAmount: 150,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: '@MrWhitePio'
  },
  {
    id: 'ach_veteran_stalker',
    title: 'Опытный Сталкер Пустошей',
    description: 'Пройдите через 5 официальных ивентов или вылазок сообщества.',
    type: 'any_event_count',
    targetValue: 5,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564445.png',
    rewardType: 'both',
    rewardAmount: 350,
    rewardCosmeticId: 'text-emerald-400 font-extrabold drop-shadow-[0_0_10px_#10b981]',
    rewardCosmeticName: 'Цвет «Токсичный Рад ☢️»',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: '@MrWhitePio'
  },
  {
    id: 'ach_days_survivor',
    title: 'Старожил Даст Таун',
    description: 'Проведите в поселении Даст Таун от 7 дней с момента прибытия.',
    type: 'time_in_bot_days',
    targetValue: 7,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3524/3524659.png',
    rewardType: 'equivaxes',
    rewardAmount: 250,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: '@MrWhitePio'
  },
  {
    id: 'ach_case_hunter',
    title: 'Охотник за Реликвиями',
    description: 'Получите хотя бы 1 редкий, эпический или легендарный предмет из кейса.',
    type: 'rare_cases_count',
    targetValue: 1,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png',
    rewardType: 'both',
    rewardAmount: 200,
    rewardCosmeticId: 'golden-shimmer-text font-black',
    rewardCosmeticName: 'Шиммер «Золотой Блик Рейнджера ✨»',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: '@MrWhitePio'
  },
  {
    id: 'ach_character_creator',
    title: 'Летописец Эквестрии',
    description: 'Создайте свою первую подробную анкету персонажа в гильдии.',
    type: 'characters_count',
    targetValue: 1,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2618/2618068.png',
    rewardType: 'both',
    rewardAmount: 150,
    rewardCosmeticId: 'text-amber-400 font-extrabold drop-shadow-[0_0_8px_#f59e0b]',
    rewardCosmeticName: 'Цвет «Пип-Бой Янтарный ⚡»',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: '@MrWhitePio'
  },
  {
    id: 'ach_capitalist',
    title: 'Магнат Пустошей',
    description: 'Накопите на личном счёте от 1,000 Эквиваксов (ℰQ).',
    type: 'equivaxes_balance',
    targetValue: 1000,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png',
    rewardType: 'profile_bg',
    rewardCosmeticId: 'shimmer-gold-bg border-amber-400/60 shadow-lg shadow-amber-950/50',
    rewardCosmeticName: 'Фон «Золотой Зал Рейнджера ⭐»',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: '@MrWhitePio'
  }
];

export const INITIAL_WEEKLY_SHOP_ITEMS = [
  {
    id: 'weekly_item_rad_core',
    name: 'Анимированная Тема: Реактор Радиации ☢️',
    description: 'Эпический довоенный экран с пульсирующей радиацией и частицами.',
    photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-emerald-950 via-zinc-950 to-green-950 border-emerald-500/70',
    textStyle: 'text-emerald-400 font-bold drop-shadow-[0_0_8px_#34d399]',
    rarity: 'legendary' as const,
    type: 'profile_theme' as const,
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
    rarity: 'epic' as const,
    type: 'avatar_frame' as const,
    appliedValue: 'frame_gold_3d',
    price: 190,
    oldPrice: 250,
    badge: 'СКИДКА -24%',
    addedBy: '@MrWhitePio',
    addedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'weekly_item_stealthboy',
    name: 'Довоенный Стелс-Бой MK.II 📟',
    description: 'Полевой маскировочный модуль для разведки Пустошей.',
    photoUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    bgStyle: 'from-cyan-950 via-zinc-950 to-slate-950 border-cyan-500/60',
    textStyle: 'text-cyan-300 font-bold',
    rarity: 'rare' as const,
    type: 'item' as const,
    price: 110,
    badge: 'ДОВОЕННЫЙ',
    addedBy: '@MrWhitePio',
    addedAt: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_AUCTION_LISTINGS = [];

export function loadAppState(): AppStateData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.profiles)) {
        const enrichedProfiles = parsed.profiles.map((p: UserProfile) => {
          let updated = { ...p };
          if (!p.transactions || p.transactions.length === 0) {
            if (p.username?.toLowerCase() === '@mrwhitepio') {
              updated.transactions = INITIAL_PROFILES[0].transactions || [];
            } else {
              updated.transactions = [
                {
                  id: 'tx_init_' + p.id,
                  userId: p.id,
                  amount: p.equivaxes || 500,
                  type: 'income_admin',
                  title: 'Стартовый баланс сталкера',
                  description: 'Приветственное довоенное пособие Даст Таун',
                  timestamp: p.joinedAt || new Date().toISOString(),
                  balanceAfter: p.equivaxes || 500
                }
              ];
            }
          }
          // Clean up old factions if present
          if (updated.factionId === 'faction_guardians' || updated.factionId === 'faction_caravan') {
            updated.factionId = undefined;
            updated.factionName = undefined;
            updated.factionRole = undefined;
            updated.factionRoleColor = undefined;
            updated.factionJoinedAt = undefined;
          }
          return updated;
        });

        const activeFactions = (Array.isArray(parsed.factions) && parsed.factions.length > 0 ? parsed.factions : INITIAL_FACTIONS).filter(
          (f: Faction) => f && f.id !== 'faction_guardians' && f.id !== 'faction_caravan'
        );

        return {
          ...parsed,
          profiles: deduplicateProfiles(enrichedProfiles.length > 0 ? enrichedProfiles : INITIAL_PROFILES),
          admins: Array.isArray(parsed.admins) && parsed.admins.length > 0 ? parsed.admins : INITIAL_ADMINS,
          characters: Array.isArray(parsed.characters) ? parsed.characters : INITIAL_CHARACTERS,
          events: Array.isArray(parsed.events) ? parsed.events : INITIAL_EVENTS,
          awards: Array.isArray(parsed.awards) ? parsed.awards : INITIAL_AWARDS,
          cases: Array.isArray(parsed.cases) && parsed.cases.length > 0 ? parsed.cases : INITIAL_CASES,
          achievements: Array.isArray(parsed.achievements) && parsed.achievements.length > 0 ? parsed.achievements : INITIAL_ACHIEVEMENTS,
          weeklyShopItems: Array.isArray(parsed.weeklyShopItems) ? parsed.weeklyShopItems : INITIAL_WEEKLY_SHOP_ITEMS,
          auctionListings: Array.isArray(parsed.auctionListings) ? parsed.auctionListings : INITIAL_AUCTION_LISTINGS,
          factions: activeFactions.length > 0 ? activeFactions : INITIAL_FACTIONS,
          artworks: Array.isArray(parsed.artworks) && parsed.artworks.length > 0 ? parsed.artworks : INITIAL_ARTWORKS,
          notifications: Array.isArray(parsed.notifications) && parsed.notifications.length > 0 ? parsed.notifications : INITIAL_NOTIFICATIONS,
          botVersions: Array.isArray(parsed.botVersions) && parsed.botVersions.length > 0 ? parsed.botVersions : INITIAL_BOT_VERSIONS,
          chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [],
          nukeAlert: parsed.nukeAlert || null,
          syncVersion: parsed.syncVersion || 1,
          lastUpdated: parsed.lastUpdated || new Date().toISOString()
        };
      }
    }
  } catch (e) {
    console.error('Failed to load local app state', e);
  }

  return {
    profiles: deduplicateProfiles(INITIAL_PROFILES),
    admins: INITIAL_ADMINS,
    characters: INITIAL_CHARACTERS,
    events: INITIAL_EVENTS,
    awards: INITIAL_AWARDS,
    cases: INITIAL_CASES,
    caseItems: INITIAL_CASE_ITEMS,
    achievements: INITIAL_ACHIEVEMENTS,
    weeklyShopItems: INITIAL_WEEKLY_SHOP_ITEMS,
    auctionListings: INITIAL_AUCTION_LISTINGS,
    factions: INITIAL_FACTIONS,
    artworks: INITIAL_ARTWORKS,
    activityLogs: [],
    notifications: INITIAL_NOTIFICATIONS,
    botVersions: INITIAL_BOT_VERSIONS
  };
}

export function safeLocalStorageSet(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.number === -2147024882) {
      console.warn('LocalStorage quota limit reached. Preserving lightweight cache.');
      try {
        const compact = {
          ...data,
          artworks: (data.artworks || []).slice(0, 30).map((art: any) => ({
            ...art,
            imageUrl: art.imageUrl?.length > 40000 ? art.imageUrl.slice(0, 1000) + '...[server]' : art.imageUrl
          }))
        };
        localStorage.setItem(key, JSON.stringify(compact));
      } catch (err2) {
        // Ignore fallback error
      }
    }
  }
}

export async function fetchServerState(): Promise<AppStateData | null> {
  try {
    const res = await fetch(`/api/data?_ts=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.profiles) && data.profiles.length > 0) {
      const sanitized = {
        ...data,
        profiles: deduplicateProfiles(data.profiles)
      };
      safeLocalStorageSet(STORAGE_KEY, sanitized);
      return sanitized;
    }
  } catch (e) {
    // offline
  }
  return null;
}

export async function syncUserWithServer(tgUser: any): Promise<{ profile: UserProfile | null; fullData: AppStateData | null }> {
  try {
    const res = await fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tgUser })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.fullData) {
        const sanitized = {
          ...data.fullData,
          profiles: deduplicateProfiles(data.fullData.profiles || [])
        };
        safeLocalStorageSet(STORAGE_KEY, sanitized);
        return { profile: data.profile, fullData: sanitized };
      }
    }
  } catch (e) {
    // offline
  }
  return { profile: null, fullData: null };
}

export async function toggleAdminRoleOnServer(
  requesterUsername: string,
  targetUsername: string,
  action: 'add' | 'remove',
  tags?: string[]
): Promise<any> {
  try {
    const res = await fetch('/api/admin/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterUsername, targetUsername, action, tags })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Failed to toggle admin role:', e);
  }
  return null;
}

export async function updateUserProfileOnServer(userId: string, updates: Partial<UserProfile>): Promise<AppStateData | null> {
  try {
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.fullData) {
        const sanitized = {
          ...data.fullData,
          profiles: deduplicateProfiles(data.fullData.profiles || [])
        };
        safeLocalStorageSet(STORAGE_KEY, sanitized);
        return sanitized;
      }
    }
  } catch (e) {
    // offline fallback
  }
  return null;
}

export async function uploadMediaFile(dataUrl: string, folder = 'avatars'): Promise<string> {
  try {
    const res = await fetch('/api/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, folder })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch (e) {
    console.warn('Failed to upload media to server; fallback to dataUrl:', e);
  }
  return dataUrl;
}

export async function syncTelegramAvatar(userId: string, telegramId?: string | number): Promise<{ success: boolean; avatarUrl?: string; profile?: UserProfile; message?: string }> {
  try {
    const res = await fetch('/api/user/sync-avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, telegramId })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Failed to sync Telegram avatar:', e);
  }
  return { success: false };
}

export async function joinEventOnServer(
  eventId: string,
  userId: string,
  username: string,
  action: 'join' | 'leave' = 'join'
): Promise<AppStateData | null> {
  return serverHandshakeJoinEvent(eventId, userId, username, action);
}

// Handshake verification for joining/leaving events
export async function serverHandshakeJoinEvent(
  eventId: string,
  userId: string,
  username: string,
  action: 'join' | 'leave' = 'join'
): Promise<AppStateData | null> {
  try {
    const res = await fetch('/api/handshake/join-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, userId, username, action })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.fullData) {
        safeLocalStorageSet(STORAGE_KEY, data.fullData);
        return data.fullData;
      }
    } else {
      const err = await res.json();
      if (err.error) alert(err.error);
    }
  } catch (e) {
    // offline fallback
  }
  return null;
}

// Handshake verification for purchasing weekly shop items
export async function serverHandshakeBuyItem(
  itemId: string,
  userId: string,
  username: string
): Promise<{ success: boolean; fullData?: AppStateData; error?: string }> {
  try {
    const res = await fetch('/api/handshake/buy-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, userId, username })
    });
    const data = await res.json();
    if (res.ok && data.success && data.fullData) {
      safeLocalStorageSet(STORAGE_KEY, data.fullData);
      return { success: true, fullData: data.fullData };
    }
    return { success: false, error: data.error || 'Ошибка при покупке на сервере' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Ошибка соединения с сервером' };
  }
}

// Handshake verification for opening lootboxes/cases
export async function serverHandshakeOpenCase(
  caseId: string,
  userId: string,
  wonDef: any
): Promise<{ success: boolean; fullData?: AppStateData; error?: string }> {
  try {
    const res = await fetch('/api/handshake/open-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, userId, wonDef })
    });
    const data = await res.json();
    if (res.ok && data.success && data.fullData) {
      safeLocalStorageSet(STORAGE_KEY, data.fullData);
      return { success: true, fullData: data.fullData };
    }
    return { success: false, error: data.error || 'Ошибка при открытии кейса' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Ошибка соединения с сервером' };
  }
}

// Fetch real-time server activity log
export async function fetchActivityLogs(): Promise<any[]> {
  try {
    const res = await fetch(`/api/activity-log?_ts=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data.logs) ? data.logs : [];
    }
  } catch (e) {
    // offline
  }
  return [];
}

export async function completeEventOnServer(outcome: any): Promise<AppStateData | null> {
  try {
    const res = await fetch('/api/events/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.fullData) {
        safeLocalStorageSet(STORAGE_KEY, data.fullData);
        return data.fullData;
      }
    }
  } catch (e) {
    // offline fallback
  }
  return null;
}

export async function restoreServerData(state: AppStateData): Promise<boolean> {
  try {
    const res = await fetch('/api/data/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export function saveAppState(state: AppStateData): void {
  try {
    safeLocalStorageSet(STORAGE_KEY, state);
    // Also broadcast to server if available
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }).catch(() => {
      // Offline or mock mode
    });
  } catch (e) {
    console.error('Failed to save app state', e);
  }
}

export async function addArtworkOnServer(artwork: any): Promise<AppStateData | null> {
  try {
    const res = await fetch('/api/artworks/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artwork })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.fullData) {
        safeLocalStorageSet(STORAGE_KEY, data.fullData);
        return data.fullData;
      }
    }
  } catch (e) {
    // offline
  }
  return null;
}

export async function likeArtworkOnServer(artId: string, userId: string): Promise<AppStateData | null> {
  try {
    const res = await fetch('/api/artworks/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artId, userId })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.fullData) {
        safeLocalStorageSet(STORAGE_KEY, data.fullData);
        return data.fullData;
      }
    }
  } catch (e) {
    // offline
  }
  return null;
}

export async function tipArtworkOnServer(
  artId: string,
  senderId: string,
  senderUsername: string,
  amount: number
): Promise<AppStateData | null> {
  try {
    const res = await fetch('/api/artworks/tip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artId, senderId, senderUsername, amount })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.fullData) {
        safeLocalStorageSet(STORAGE_KEY, data.fullData);
        return data.fullData;
      }
    }
  } catch (e) {
    // offline
  }
  return null;
}

export async function notifyTelegramGroupAboutEvent(event: RPEvent): Promise<boolean> {
  try {
    const res = await fetch('/api/notify-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event })
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to notify group about event:', e);
    return false;
  }
}

export async function notifyTelegramGroupAboutCompletion(reportData: {
  eventTitle: string;
  eventType: string;
  attendedUsernames: string[];
  absentUsernames: string[];
  rewardAmount: number;
  penaltyAmount: number;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/notify-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to notify group about completion:', e);
    return false;
  }
}
