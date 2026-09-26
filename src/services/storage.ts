import { AppStateData, UserProfile, RPEvent, CharacterSheet, Award, CaseBox, CaseItemDefinition } from '../types';

const STORAGE_KEY = 'dusttown_rp_app_state_v3_clean';

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
    id: 'user_mrwhite',
    username: '@MrWhitePio',
    displayName: 'Mr. White (Основатель)',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
    bio: 'Главный администратор и создатель проекта DustTown RP. Постапокалипсис только начинается!',
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
    ]
  }
];

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

export function loadAppState(): AppStateData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.profiles)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load local app state', e);
  }

  return {
    profiles: INITIAL_PROFILES,
    admins: INITIAL_ADMINS,
    characters: INITIAL_CHARACTERS,
    events: INITIAL_EVENTS,
    awards: INITIAL_AWARDS,
    cases: INITIAL_CASES,
    caseItems: INITIAL_CASE_ITEMS
  };
}

export function saveAppState(state: AppStateData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
