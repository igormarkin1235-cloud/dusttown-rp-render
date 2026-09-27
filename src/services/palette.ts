export interface PaletteColorOption {
  id: string;
  label: string;
  value: string;
  category: 'standard' | 'shimmer' | 'gradient';
  icon?: string;
  previewClass?: string;
}

export interface PaletteBgOption {
  id: string;
  label: string;
  value: string;
  category: 'standard' | 'shimmer' | 'gradient';
  icon?: string;
  borderClass?: string;
}

// 1. ДЕСЯТЬ СТАНДАРТНЫХ ЦВЕТОВ ТЕКСТА
export const STANDARD_TEXT_COLORS: PaletteColorOption[] = [
  {
    id: 'text_white',
    label: 'Бункерный Белый',
    value: 'text-zinc-100 font-bold',
    category: 'standard',
    icon: '⚪'
  },
  {
    id: 'text_amber',
    label: 'Пип-Бой Янтарный ⚡',
    value: 'text-amber-400 font-extrabold drop-shadow-[0_0_8px_#f59e0b]',
    category: 'standard',
    icon: '⚡'
  },
  {
    id: 'text_rad_green',
    label: 'Токсичный Рад ☢️',
    value: 'text-emerald-400 font-extrabold drop-shadow-[0_0_10px_#10b981]',
    category: 'standard',
    icon: '☢️'
  },
  {
    id: 'text_quantum_cyan',
    label: 'Квантовый Лазурный 💎',
    value: 'text-cyan-400 font-extrabold drop-shadow-[0_0_10px_#22d3ee]',
    category: 'standard',
    icon: '💎'
  },
  {
    id: 'text_blood_ruby',
    label: 'Кровавый Рубин 🩸',
    value: 'text-red-500 font-extrabold drop-shadow-[0_0_8px_#ef4444]',
    category: 'standard',
    icon: '🩸'
  },
  {
    id: 'text_gold_sun',
    label: 'Имперское Золото ⭐',
    value: 'text-yellow-300 font-extrabold drop-shadow-[0_0_8px_#facc15]',
    category: 'standard',
    icon: '⭐'
  },
  {
    id: 'text_amethyst_purple',
    label: 'Магический Аметист 🔮',
    value: 'text-purple-400 font-extrabold drop-shadow-[0_0_8px_#c084fc]',
    category: 'standard',
    icon: '🔮'
  },
  {
    id: 'text_cyber_rose',
    label: 'Кибер-Розовый 🌸',
    value: 'text-pink-400 font-extrabold drop-shadow-[0_0_8px_#fb7185]',
    category: 'standard',
    icon: '🌸'
  },
  {
    id: 'text_flame_orange',
    label: 'Огненный Оранжевый 🔥',
    value: 'text-orange-400 font-extrabold drop-shadow-[0_0_8px_#fb923c]',
    category: 'standard',
    icon: '🔥'
  },
  {
    id: 'text_mint_frost',
    label: 'Холодная Мята ❄️',
    value: 'text-teal-300 font-extrabold drop-shadow-[0_0_8px_#5eead4]',
    category: 'standard',
    icon: '❄️'
  }
];

// 2. ПЯТЬ ПЕРЕЛИВАЮЩИХСЯ (АНИМИРОВАННЫХ) ЦВЕТОВ ТЕКСТА
export const SHIMMER_TEXT_COLORS: PaletteColorOption[] = [
  {
    id: 'text_shimmer_rainbow',
    label: 'Радужный Шиммер 🌈',
    value: 'rainbow-shimmer-text font-black',
    category: 'shimmer',
    icon: '🌈'
  },
  {
    id: 'text_shimmer_gold',
    label: 'Золотой Блик Рейнджера ✨',
    value: 'golden-shimmer-text font-black',
    category: 'shimmer',
    icon: '✨'
  },
  {
    id: 'text_shimmer_rad',
    label: 'Пульсирующий Токсичный Рад ☣️',
    value: 'rad-pulse-text font-black',
    category: 'shimmer',
    icon: '☣️'
  },
  {
    id: 'text_shimmer_glitch',
    label: 'Кибер-Глитч Хром 💽',
    value: 'cyber-glitch-text font-black',
    category: 'shimmer',
    icon: '💽'
  },
  {
    id: 'text_shimmer_quantum',
    label: 'Квантовое Сияние Эквестрии 🌌',
    value: 'quantum-shimmer-text font-black',
    category: 'shimmer',
    icon: '🌌'
  }
];

// 3. ПЯТЬ ГРАДИЕНТОВ ТЕКСТА
export const GRADIENT_TEXT_COLORS: PaletteColorOption[] = [
  {
    id: 'text_grad_sunset',
    label: 'Градиент: Закат Пустошей 🌅',
    value: 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent font-black',
    category: 'gradient',
    icon: '🌅'
  },
  {
    id: 'text_grad_quantum',
    label: 'Градиент: Квантовый Неон 💎',
    value: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent font-black',
    category: 'gradient',
    icon: '💎'
  },
  {
    id: 'text_grad_magic',
    label: 'Градиент: Магическая Аура 🔮',
    value: 'bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent font-black',
    category: 'gradient',
    icon: '🔮'
  },
  {
    id: 'text_grad_oasis',
    label: 'Градиент: Изумрудный Оазис 🌴',
    value: 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-black',
    category: 'gradient',
    icon: '🌴'
  },
  {
    id: 'text_grad_inferno',
    label: 'Градиент: Пламя Инферно 🔥',
    value: 'bg-gradient-to-r from-yellow-300 via-amber-500 to-red-600 bg-clip-text text-transparent font-black',
    category: 'gradient',
    icon: '🔥'
  }
];

export const ALL_TEXT_COLORS: PaletteColorOption[] = [
  ...STANDARD_TEXT_COLORS,
  ...SHIMMER_TEXT_COLORS,
  ...GRADIENT_TEXT_COLORS
];

// ==========================================
// ФОНЫ КАРТОЧЕК И БЛОКОВ
// ==========================================

// 1. ДЕСЯТЬ СТАНДАРТНЫХ ФОНОВ
export const STANDARD_BG_COLORS: PaletteBgOption[] = [
  {
    id: 'bg_standard_bunker',
    label: 'Стандартный Бункер',
    value: 'bg-zinc-950 border-zinc-800',
    category: 'standard',
    icon: '🛡️'
  },
  {
    id: 'bg_dark_carbon',
    label: 'Тёмный Карбон',
    value: 'bg-neutral-950 border-neutral-800',
    category: 'standard',
    icon: '🖤'
  },
  {
    id: 'bg_obsidian',
    label: 'Обсидиановый Склеп',
    value: 'bg-black border-zinc-900',
    category: 'standard',
    icon: '🌑'
  },
  {
    id: 'bg_steel_armor',
    label: 'Броня Братства Стали',
    value: 'bg-slate-950 border-slate-800',
    category: 'standard',
    icon: '⚙️'
  },
  {
    id: 'bg_midnight_watch',
    label: 'Полуночный Дозор',
    value: 'bg-gray-950 border-gray-800',
    category: 'standard',
    icon: '🌃'
  },
  {
    id: 'bg_rust_wasteland',
    label: 'Ржавая Пустошь',
    value: 'bg-stone-950 border-stone-800',
    category: 'standard',
    icon: '🍂'
  },
  {
    id: 'bg_deep_indigo',
    label: 'Глубокий Индиго',
    value: 'bg-indigo-950/70 border-indigo-900/60',
    category: 'standard',
    icon: '🌌'
  },
  {
    id: 'bg_toxic_marsh',
    label: 'Токсичное Болото',
    value: 'bg-emerald-950/70 border-emerald-900/60',
    category: 'standard',
    icon: '☣️'
  },
  {
    id: 'bg_blood_sand',
    label: 'Кровавый Песок',
    value: 'bg-rose-950/70 border-rose-900/60',
    category: 'standard',
    icon: '🩸'
  },
  {
    id: 'bg_dark_amber',
    label: 'Тёмный Янтарь',
    value: 'bg-amber-950/60 border-amber-900/50',
    category: 'standard',
    icon: '⚡'
  }
];

// 2. ПЯТЬ ПЕРЕЛИВАЮЩИХСЯ (АНИМИРОВАННЫХ) ФОНОВ
export const SHIMMER_BG_COLORS: PaletteBgOption[] = [
  {
    id: 'bg_shimmer_rainbow',
    label: 'Радужная Аура Эквестрии 🌈',
    value: 'shimmer-rainbow-bg border-fuchsia-500/60 shadow-lg shadow-purple-950/50',
    category: 'shimmer',
    icon: '🌈'
  },
  {
    id: 'bg_shimmer_gold',
    label: 'Золотой Зал Рейнджера ⭐',
    value: 'shimmer-gold-bg border-amber-400/60 shadow-lg shadow-amber-950/50',
    category: 'shimmer',
    icon: '⭐'
  },
  {
    id: 'bg_shimmer_cyber',
    label: 'Кибер-Матрица 2077 💽',
    value: 'shimmer-cyber-bg border-cyan-400/60 shadow-lg shadow-cyan-950/50',
    category: 'shimmer',
    icon: '💽'
  },
  {
    id: 'bg_shimmer_rad',
    label: 'Пульсирующий Реактор Рад ☢️',
    value: 'shimmer-rad-bg border-emerald-400/70 shadow-lg shadow-emerald-950/50',
    category: 'shimmer',
    icon: '☢️'
  },
  {
    id: 'bg_shimmer_cosmic',
    label: 'Космическая Туманность 🌌',
    value: 'shimmer-cosmic-bg border-purple-400/60 shadow-lg shadow-indigo-950/50',
    category: 'shimmer',
    icon: '🌌'
  }
];

// 3. ПЯТЬ ГРАДИЕНТНЫХ ФОНОВ
export const GRADIENT_BG_COLORS: PaletteBgOption[] = [
  {
    id: 'bg_grad_sunset',
    label: 'Градиент: Закат Пустошей 🌅',
    value: 'bg-gradient-to-br from-amber-950/80 via-rose-950/60 to-zinc-950 border-amber-500/50',
    category: 'gradient',
    icon: '🌅'
  },
  {
    id: 'bg_grad_quantum',
    label: 'Градиент: Квантовое Сияние 💎',
    value: 'bg-gradient-to-br from-blue-950/80 via-cyan-950/60 to-slate-950 border-cyan-500/50',
    category: 'gradient',
    icon: '💎'
  },
  {
    id: 'bg_grad_abyss',
    label: 'Градиент: Фиолетовая Бездна 🔮',
    value: 'bg-gradient-to-br from-purple-950/80 via-fuchsia-950/50 to-zinc-950 border-purple-500/50',
    category: 'gradient',
    icon: '🔮'
  },
  {
    id: 'bg_grad_oasis',
    label: 'Градиент: Изумрудный Оазис 🌴',
    value: 'bg-gradient-to-br from-emerald-950/80 via-teal-950/60 to-zinc-950 border-emerald-400/50',
    category: 'gradient',
    icon: '🌴'
  },
  {
    id: 'bg_grad_blood_moon',
    label: 'Градиент: Кровавая Луна 🩸',
    value: 'bg-gradient-to-br from-red-950/80 via-stone-950 to-rose-950/50 border-rose-500/50',
    category: 'gradient',
    icon: '🩸'
  }
];

export const ALL_BG_COLORS: PaletteBgOption[] = [
  ...STANDARD_BG_COLORS,
  ...SHIMMER_BG_COLORS,
  ...GRADIENT_BG_COLORS
];
