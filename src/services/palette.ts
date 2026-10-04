export interface PaletteColorOption {
  id: string;
  label: string;
  value: string;
  category: 'standard' | 'shimmer' | 'gradient' | 'special';
  icon?: string;
  previewClass?: string;
}

export interface PaletteBgOption {
  id: string;
  label: string;
  value: string;
  category: 'standard' | 'shimmer' | 'gradient' | 'special';
  icon?: string;
  borderClass?: string;
}

export interface PaletteFrameOption {
  id: string;
  name: string;
  desc: string;
  type: 'standard' | 'animated' | 'special';
  icon: string;
}

export interface PaletteThemeOption {
  id: string;
  name: string;
  desc: string;
  category: 'standard' | 'animated' | 'poster' | 'special';
  icon: string;
  badge?: string;
  image?: string;
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

// 2. ПЕРЕЛИВАЮЩИЕСЯ И АНИМИРОВАННЫЕ ЦВЕТА ТЕКСТА
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
  },
  {
    id: 'text_anim_fire_blaze',
    label: 'Бушующее Пламя Инферно 🔥',
    value: 'fire-blaze-text font-black',
    category: 'shimmer',
    icon: '🔥'
  },
  {
    id: 'text_anim_toxic_hazard',
    label: 'Кислотный Биохазард ☢️',
    value: 'toxic-hazard-text font-black',
    category: 'shimmer',
    icon: '☢️'
  },
  {
    id: 'text_anim_cyber_strobe',
    label: 'Кибер-Неоновый Стробоскоп ⚡',
    value: 'cyber-strobe-text font-black',
    category: 'shimmer',
    icon: '⚡'
  },
  {
    id: 'text_anim_celestial_star',
    label: 'Звездная Пыль Аликорна 🌟',
    value: 'celestial-star-text font-black',
    category: 'shimmer',
    icon: '🌟'
  },
  {
    id: 'text_anim_plasma_lightning',
    label: 'Плазменная Молния ⚡',
    value: 'plasma-lightning-text font-black',
    category: 'shimmer',
    icon: '⚡'
  },
  {
    id: 'text_anim_radioactive_isotope',
    label: 'Радиоактивный Изотоп-137 🧪',
    value: 'isotope-137-text font-black',
    category: 'shimmer',
    icon: '🧪'
  },
  {
    id: 'text_anim_liquid_gold',
    label: 'Жидкое Золото Анклава 👑',
    value: 'liquid-gold-text font-black',
    category: 'shimmer',
    icon: '👑'
  },
  {
    id: 'text_anim_matrix_terminal',
    label: 'Терминал RobCo CRT 💻',
    value: 'terminal-crt-text font-black',
    category: 'shimmer',
    icon: '💻'
  }
];

// 3. ГРАДИЕНТЫ И ОСОБЕННЫЕ СТИЛИ ТЕКСТА
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
  },
  {
    id: 'text_grad_vaporwave',
    label: 'Градиент: Вейпорвейв Закат 🌆',
    value: 'vaporwave-gradient-text font-black',
    category: 'gradient',
    icon: '🌆'
  },
  {
    id: 'text_grad_cosmic_void',
    label: 'Градиент: Космическая Бездна 🌌',
    value: 'bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent font-black',
    category: 'gradient',
    icon: '🌌'
  },
  {
    id: 'text_grad_fallout_rad',
    label: 'Градиент: Рад-Зона Выброса ☣️',
    value: 'bg-gradient-to-r from-lime-300 via-yellow-400 to-emerald-500 bg-clip-text text-transparent font-black',
    category: 'gradient',
    icon: '☣️'
  }
];

export const SPECIAL_TEXT_COLORS: PaletteColorOption[] = [
  {
    id: 'text_special_blood_curse',
    label: 'Особенный: Кровавое Проклятие 🩸',
    value: 'blood-curse-text font-black',
    category: 'special',
    icon: '🩸'
  },
  {
    id: 'text_special_ghost_stealth',
    label: 'Особенный: Призрак Стелс-Боя 👻',
    value: 'ghost-stealth-text font-black',
    category: 'special',
    icon: '👻'
  }
];

export const ALL_TEXT_COLORS: PaletteColorOption[] = [
  ...STANDARD_TEXT_COLORS,
  ...SHIMMER_TEXT_COLORS,
  ...GRADIENT_TEXT_COLORS,
  ...SPECIAL_TEXT_COLORS
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

// ==========================================
// РАМКИ ПРОФИЛЯ (СТАНДАРТНЫЕ, АНИМИРОВАННЫЕ, ОСОБЕННЫЕ)
// ==========================================
export const PRESET_AVATAR_FRAMES: PaletteFrameOption[] = [
  // 3 БАЗОВЫЕ РАМКИ (ДОСТУПНЫ ВСЕМ В НАЧАЛЕ)
  {
    id: 'frame_none',
    name: 'Без рамки',
    desc: 'Классическая строгая граница жителя убежища',
    type: 'standard',
    icon: '👤'
  },
  {
    id: 'frame_steel_rivets',
    name: 'Стальная бронепластина',
    desc: 'Закалённый стальной каркас сталкера на клёпках',
    type: 'standard',
    icon: '⚙️'
  },
  {
    id: 'frame_gold_3d',
    name: 'Довоенное 3D Золото',
    desc: 'Рельефное золото с фасками и глубокими тенями',
    type: 'standard',
    icon: '⭐'
  },

  // АНИМИРОВАННЫЕ РАМКИ (ИЗ КЕЙСОВ ИЛИ МАГАЗИНА)
  {
    id: 'frame_rad_pulse',
    name: 'Радиоактивный Пульс',
    desc: 'Анимированная вращающаяся неоновая аура с меткой ☢️',
    type: 'animated',
    icon: '☢️'
  },
  {
    id: 'frame_cyber_glitch',
    name: 'Кибер-Глитч Хром',
    desc: 'Неоновые горизонтальные скан-линии и хроматический сдвиг',
    type: 'animated',
    icon: '💽'
  },
  {
    id: 'frame_rainbow_neon',
    name: 'Радужный Неон',
    desc: 'Переливающееся всеми спектрами сияние Эквестрии',
    type: 'animated',
    icon: '🌈'
  },
  {
    id: 'frame_toxic_flame',
    name: 'Токсичное Пламя',
    desc: 'Ионизированное радиоактивное зеленое пламя',
    type: 'animated',
    icon: '🔥'
  },
  {
    id: 'frame_quantum_singularity',
    name: 'Квантовая Сингулярность',
    desc: 'Вращающийся двойной вихрь лазурной антиматерии',
    type: 'animated',
    icon: '🌀'
  },
  {
    id: 'frame_fire_inferno',
    name: 'Пламя Преисподней',
    desc: 'Бушующие огненные языки и поднимающиеся угли',
    type: 'animated',
    icon: '🔥'
  },
  {
    id: 'frame_matrix_code',
    name: 'Матричный Дождь RobCo',
    desc: 'Бегущие цифровые зеленые символы компьютерного мэйнфрейма',
    type: 'animated',
    icon: '💻'
  },
  {
    id: 'frame_void_darkness',
    name: 'Тёмная Бездна',
    desc: 'Пульсирующий фиолетовый эфир с чёрным свечением пустоты',
    type: 'animated',
    icon: '🌌'
  },
  {
    id: 'frame_pipboy_hologram',
    name: 'Пип-Бой Голограмма',
    desc: 'Янтарный проекционный интерфейс с прицельной сеткой',
    type: 'animated',
    icon: '📟'
  },
  {
    id: 'frame_neon_spectrum',
    name: 'Неоновый Гиперспектр',
    desc: 'Вращающийся трехцветный RGB контур на высокой скорости',
    type: 'animated',
    icon: '⚡'
  },
  {
    id: 'frame_frozen_ice',
    name: 'Вечная Мерзлота',
    desc: 'Ледяные кристаллы и морозные блики с летящими снежинками',
    type: 'animated',
    icon: '❄️'
  },
  {
    id: 'frame_stable_cog',
    name: 'Шестерня Стойла 24',
    desc: 'Медленно вращающаяся довоенная латунная шестерня Stable-Tec',
    type: 'animated',
    icon: '⚙️'
  },

  // ОСОБЕННЫЕ И ЛЕГЕНДАРНЫЕ РАМКИ
  {
    id: 'frame_alicorn_crown',
    name: 'Корона Аликорна',
    desc: 'Золотая парящая королевская корона с драгоценными камнями',
    type: 'special',
    icon: '👑'
  },
  {
    id: 'frame_enclave_wings',
    name: 'Крылья Анклава',
    desc: 'Золоченые крылья высшего командного состава',
    type: 'special',
    icon: '🪽'
  },
  {
    id: 'frame_bloody_barbed',
    name: 'Колючая Проволока Рейдеров',
    desc: 'Ржавая проволока с шипами и свежими каплями крови',
    type: 'special',
    icon: '🩸'
  }
];

// ==========================================
// ФОНЫ И ТЕМЫ ПРОФИЛЯ (16 ПОЛЬЗОВАТЕЛЬСКИХ + АНИМИРОВАННЫЕ)
// ==========================================
export const PRESET_PROFILE_THEMES: PaletteThemeOption[] = [
  // 3 БАЗОВЫХ ФОНА (ДОСТУПНЫ ВСЕМ В НАЧАЛЕ)
  {
    id: 'default',
    name: 'Стандартный Бункер',
    desc: 'Строгий тёмный бункер с мягким эмбиентным освещением',
    category: 'standard',
    icon: '🛡️',
    badge: 'БАЗОВЫЙ'
  },
  {
    id: 'rad_storm',
    name: 'Радиоактивный Шторм ☣️',
    desc: 'Зелёный туман Пустоши, падающие частицы радиоактивных осадков',
    category: 'animated',
    icon: '☣️',
    badge: 'БАЗОВЫЙ'
  },
  {
    id: 'black_tree',
    name: 'Чёрное Древо Пустоши 🍁',
    desc: 'Силуэт древа надежды «I believe in you» и опадающие тлеющие листья',
    category: 'animated',
    icon: '🍁',
    badge: 'БАЗОВЫЙ'
  },

  // 18 ТЕМ ИЗ ПОЛЬЗОВАТЕЛЬСКИХ ПЛАКАТОВ И АРТОВ (СУНДУКИ / МАГАЗИН)
  {
    id: 'bg_sparkle_cola',
    name: 'Искорка Кола: Вкус Моркови 🥤',
    desc: 'Ретро-плакат с Флаттершай и пузырьками шипучей Искорка Колы от Министерства Мира',
    category: 'poster',
    icon: '🥤',
    badge: 'ПОСТЕР',
    image: '/backgrounds/sparkle_cola.jpg'
  },
  {
    id: 'bg_pinkie_watching',
    name: 'Пинки Пай Следит За Тобой 👁️',
    desc: 'Культовый плакат Министерства Морали 1984 года со сканирующим прожектором',
    category: 'poster',
    icon: '👁️',
    badge: 'ПОСТЕР',
    image: '/backgrounds/pinkie_watching.jpg'
  },
  {
    id: 'bg_mowt_hero',
    name: 'МВТ: Ты тоже можешь быть героем! 🤠',
    desc: 'Патриотический плакат Эпплджек в плаще от Министерства Военных Технологий',
    category: 'poster',
    icon: '🤠',
    badge: 'ПОСТЕР',
    image: '/backgrounds/mowt_hero.jpg'
  },
  {
    id: 'bg_mowt_halo',
    name: 'Огненный Ореол МВТ 🔥',
    desc: 'Золотисто-огненный ореол Эпплджек с вращающимся защитным кольцом',
    category: 'animated',
    icon: '🔥',
    badge: 'МВТ',
    image: '/backgrounds/mowt_halo.jpg'
  },
  {
    id: 'bg_mop_fluttershy',
    name: 'Министерство Мира: Флаттершай 🦋',
    desc: 'Изумрудный светлый портрет с парящими неоновыми бабочками надежды',
    category: 'animated',
    icon: '🦋',
    badge: 'МИН. МИРА',
    image: '/backgrounds/mop_fluttershy.jpg'
  },
  {
    id: 'bg_mop_poster',
    name: 'Министерство Мира: За мир без войны! 🕊️',
    desc: 'Винтажный плакат «War? Fear? Death? We Must Do Better!» с зебрами и пегасами',
    category: 'poster',
    icon: '🕊️',
    badge: 'ПОСТЕР',
    image: '/backgrounds/mop_poster.jpg'
  },
  {
    id: 'bg_stable_tec',
    name: 'Stable-Tec: Жизнь в Стойле ⚙️',
    desc: 'Ретро-плакат Свитти Бэлль «Be Smart! Be Safe! Enjoy Stable Life» Стойла 24',
    category: 'poster',
    icon: '⚙️',
    badge: 'STABLE-TEC',
    image: '/backgrounds/stable_tec.jpg'
  },
  {
    id: 'bg_foe_heroes',
    name: 'Герои Fallout Equestria 🛡️',
    desc: 'Эпический довоенный сепия-постер: Литлпип, Каламити, Вельвет, Стилхувз и Зенит',
    category: 'poster',
    icon: '🛡️',
    badge: 'ЛЕГЕНДЫ',
    image: '/backgrounds/foe_heroes.jpg'
  },
  {
    id: 'bg_blizzard_tower',
    name: 'Радиовышка в Буране Города ❄️',
    desc: 'Трансляционная башня Гомейдж сквозь плотный снегопад и ледяной ветер',
    category: 'animated',
    icon: '❄️',
    badge: 'ГОМЕЙДЖ',
    image: '/backgrounds/blizzard_tower.jpg'
  },
  {
    id: 'bg_rad_dna',
    name: 'Радиоактивная ДНК Биохазард 🧬',
    desc: 'Светящаяся двойная спираль ДНК с пульсирующим знаком радиации и вспышками ионов',
    category: 'animated',
    icon: '🧬',
    badge: 'БИОХАЗАРД',
    image: '/backgrounds/rad_dna.jpg'
  },
  {
    id: 'bg_rad_glitch',
    name: 'Кибер-Призма Радиации ☢️',
    desc: 'Чёрный знак радиации, рассекающий тьму спектральными хроматическими лучами',
    category: 'animated',
    icon: '☢️',
    badge: 'ГЛИТЧ',
    image: '/backgrounds/rad_glitch.jpg'
  },
  {
    id: 'bg_alien_mushrooms',
    name: 'Неоновый Грибной Лес Пустоши 🍄',
    desc: 'Биолюминесцентная флора Пустоши с парящими мерцающими спорами',
    category: 'animated',
    icon: '🍄',
    badge: 'МУТАЦИИ',
    image: '/backgrounds/alien_mushrooms.jpg'
  },
  {
    id: 'bg_fog_hellhound',
    name: 'Тёмный Охотник в Тумане 🐺',
    desc: 'Зловещий ночной болотный туман со светящимися глазами хищника под луной',
    category: 'animated',
    icon: '🐺',
    badge: 'ПУСТОШЬ',
    image: '/backgrounds/fog_hellhound.jpg'
  },
  {
    id: 'bg_crimson_canyon',
    name: 'Багровый Каньон Пустошей 🏜️',
    desc: 'Закат в багровых скалах с силуэтом иссохшего древа и тёплым ветром',
    category: 'poster',
    icon: '🏜️',
    badge: 'КАНЬОН',
    image: '/backgrounds/crimson_canyon.jpg'
  },
  {
    id: 'bg_moonlit_forest',
    name: 'Лунный Заповедный Лес 🌙',
    desc: 'Таинственная ночная чаща под огромной полной луной со светлячками',
    category: 'animated',
    icon: '🌙',
    badge: 'ЗАПОВЕДНИК',
    image: '/backgrounds/moonlit_forest.jpg'
  },
  {
    id: 'bg_sunset_peaks',
    name: 'Закат над Озером Горных Пиков 🌅',
    desc: 'Панорамный закат с золотисто-пурпурными пиками гор и зеркальной гладью воды',
    category: 'poster',
    icon: '🌅',
    badge: 'ПАНОРАМА',
    image: '/backgrounds/sunset_peaks.jpg'
  },
  {
    id: 'bg_wasteland_art_1',
    name: 'Хроники Пустоши 091C 📜',
    desc: 'Атмосферный винтажный арт из архивов Эквестрийской Пустоши',
    category: 'poster',
    icon: '📜',
    badge: 'АРХИВ',
    image: '/backgrounds/img_091c.jpg'
  },
  {
    id: 'bg_wasteland_art_2',
    name: 'Архивы Пустоши 2EAE 📁',
    desc: 'Концепт-арт выживания на пустошах из засекреченных папок',
    category: 'poster',
    icon: '📁',
    badge: 'АРХИВ',
    image: '/backgrounds/img_2eae_564.jpg'
  },

  // ДРУГИЕ АНИМИРОВАННЫЕ ЭФФЕКТЫ
  {
    id: 'rad_core',
    name: 'Реактор Радиации ☢️',
    desc: 'Пульсирующий знак радиации с фонтанирующими зелёными частицами',
    category: 'animated',
    icon: '☢️',
    badge: 'РЕАКТОР'
  },
  {
    id: 'quantum_pulse',
    name: 'Квантовое Поле 💎',
    desc: 'Лазурно-фиолетовые вспышки ионизированного квантового кристалла',
    category: 'animated',
    icon: '💎',
    badge: 'КВАНТУМ'
  },
  {
    id: 'cyber_neon',
    name: 'Кибер-Матрица ⚡',
    desc: 'Неоновые бегущие световые линии и 3D сетка довоенного мэйнфрейма',
    category: 'animated',
    icon: '⚡',
    badge: 'КИБЕР'
  },
  {
    id: 'solar_gold',
    name: 'Золотое Солнце Анклава ☀️',
    desc: 'Роскошная золотая солнечная аура высшего командования',
    category: 'animated',
    icon: '☀️',
    badge: 'АНКЛАВ'
  }
];

// ==========================================
// 3 БАЗОВЫХ ПРЕДМЕТА ПО УМОЛЧАНИЮ
// ==========================================
export const BASIC_THEME_IDS = ['default', 'rad_storm', 'black_tree'];
export const BASIC_FRAME_IDS = ['frame_none', 'frame_steel_rivets', 'frame_gold_3d'];
export const BASIC_TEXT_COLOR_IDS = ['text_white', 'text_amber', 'text_rad_green'];
export const BASIC_TEXT_BG_IDS = ['bg_standard_bunker', 'bg_dark_carbon', 'bg_obsidian'];

// Helper to check if a theme is unlocked for a user
export function isThemeUnlocked(user: any, themeId: string): boolean {
  if (!user) return false;
  if (user.username?.toLowerCase() === '@mrwhitepio' || user.isInfiniteEquivaxes) return true;
  if (BASIC_THEME_IDS.includes(themeId)) return true;
  if (user.unlockedThemes && user.unlockedThemes.includes(themeId)) return true;
  if (user.inventory && user.inventory.some((i: any) => i.type === 'profile_theme' && (i.appliedValue === themeId || i.itemId === themeId))) return true;
  return false;
}

// Helper to check if a frame is unlocked for a user
export function isFrameUnlocked(user: any, frameId: string): boolean {
  if (!user) return false;
  if (user.username?.toLowerCase() === '@mrwhitepio' || user.isInfiniteEquivaxes) return true;
  if (BASIC_FRAME_IDS.includes(frameId)) return true;
  if (user.unlockedFrames && user.unlockedFrames.includes(frameId)) return true;
  if (user.inventory && user.inventory.some((i: any) => i.type === 'avatar_frame' && (i.appliedValue === frameId || i.itemId === frameId))) return true;
  return false;
}

// Helper to check if a text color style is unlocked for a user
export function isTextColorUnlocked(user: any, textColorIdOrValue: string): boolean {
  if (!user) return false;
  if (user.username?.toLowerCase() === '@mrwhitepio' || user.isInfiniteEquivaxes) return true;
  // Check basic by id or by matched value
  const matchedOpt = ALL_TEXT_COLORS.find(c => c.id === textColorIdOrValue || c.value === textColorIdOrValue);
  const colorId = matchedOpt?.id || textColorIdOrValue;
  if (BASIC_TEXT_COLOR_IDS.includes(colorId)) return true;
  if (user.unlockedTextColors && (user.unlockedTextColors.includes(colorId) || user.unlockedTextColors.includes(textColorIdOrValue))) return true;
  if (user.inventory && user.inventory.some((i: any) => i.type === 'profile_text_color' && (i.appliedValue === textColorIdOrValue || i.appliedValue === colorId || i.textStyle === textColorIdOrValue))) return true;
  return false;
}

// Helper to check if a card background style is unlocked for a user
export function isTextBgUnlocked(user: any, textBgIdOrValue: string): boolean {
  if (!user) return false;
  if (user.username?.toLowerCase() === '@mrwhitepio' || user.isInfiniteEquivaxes) return true;
  const matchedOpt = ALL_BG_COLORS.find(b => b.id === textBgIdOrValue || b.value === textBgIdOrValue);
  const bgId = matchedOpt?.id || textBgIdOrValue;
  if (BASIC_TEXT_BG_IDS.includes(bgId)) return true;
  if (user.unlockedTextBgs && (user.unlockedTextBgs.includes(bgId) || user.unlockedTextBgs.includes(textBgIdOrValue))) return true;
  if (user.inventory && user.inventory.some((i: any) => i.type === 'profile_text_bg' && (i.appliedValue === textBgIdOrValue || i.appliedValue === bgId))) return true;
  return false;
}

// ==========================================
// ФРАКЦИИ: ПРЕСЕТЫ ОФОРМЛЕНИЯ И РОЛЕЙ
// ==========================================
export const FACTION_ROLE_PRESETS = [
  'Глава Фракции',
  'Заместитель Главы',
  'Командир Разведки',
  'Штурмовик',
  'Старший Паладин',
  'Старший Медик',
  'Интендант',
  'Оружейник-Техник',
  'Следопыт',
  'Рядовой',
  'Новобранец'
];

export const FACTION_BG_PRESETS = [
  {
    id: 'fac_bg_bunker',
    label: 'Бункерный Стальной',
    value: 'from-zinc-950 via-stone-900 to-zinc-900',
    border: 'border-zinc-700/80',
    accent: '#71717a'
  },
  {
    id: 'fac_bg_amber',
    label: 'Пип-Бой Золотой',
    value: 'from-amber-950/80 via-stone-900 to-black',
    border: 'border-amber-500/70',
    accent: '#f59e0b'
  },
  {
    id: 'fac_bg_emerald',
    label: 'Токсичный Изумруд',
    value: 'from-emerald-950/90 via-zinc-950 to-green-950/80',
    border: 'border-emerald-500/70',
    accent: '#10b981'
  },
  {
    id: 'fac_bg_cyan',
    label: 'Квантовый Лазурный',
    value: 'from-cyan-950/90 via-slate-950 to-blue-950',
    border: 'border-cyan-400/70',
    accent: '#06b6d4'
  },
  {
    id: 'fac_bg_crimson',
    label: 'Багровый Рейдер',
    value: 'from-rose-950/90 via-stone-950 to-red-950',
    border: 'border-rose-500/70',
    accent: '#f43f5e'
  },
  {
    id: 'fac_bg_purple',
    label: 'Тайный Орден',
    value: 'from-purple-950/90 via-zinc-950 to-fuchsia-950',
    border: 'border-purple-500/70',
    accent: '#a855f7'
  }
];

export const FACTION_TEXT_COLOR_PRESETS = [
  { id: 'fac_text_amber', label: 'Янтарный Свет', value: 'text-amber-400 font-extrabold drop-shadow-[0_0_8px_#f59e0b]' },
  { id: 'fac_text_cyan', label: 'Квантовый Неон', value: 'text-cyan-300 font-extrabold drop-shadow-[0_0_8px_#22d3ee]' },
  { id: 'fac_text_emerald', label: 'Радиационный', value: 'text-emerald-400 font-extrabold drop-shadow-[0_0_8px_#10b981]' },
  { id: 'fac_text_rose', label: 'Багровый Огонь', value: 'text-rose-400 font-extrabold drop-shadow-[0_0_8px_#f43f5e]' },
  { id: 'fac_text_gold', label: 'Золотой Орден', value: 'text-yellow-300 font-black drop-shadow-[0_0_10px_#fde047]' },
  { id: 'fac_text_purple', label: 'Мистический', value: 'text-purple-300 font-extrabold drop-shadow-[0_0_8px_#c084fc]' }
];

export const FACTION_EMBLEM_PRESETS = [
  '/backgrounds/img_091c.jpg',
  '/backgrounds/sparkle_cola.jpg',
  '/backgrounds/pinkie_propaganda.jpg',
  '/backgrounds/mowt_hero.jpg',
  '/backgrounds/stable_tec.jpg',
  '/backgrounds/mop_fluttershy.jpg',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80'
];

export const FACTION_BANNER_PRESETS = [
  '/backgrounds/foe_heroes.jpg',
  '/backgrounds/sunset_peaks.jpg',
  '/backgrounds/blizzard_tower.jpg',
  '/backgrounds/crimson_canyon.jpg',
  '/backgrounds/moonlit_forest.jpg',
  '/backgrounds/stable_tec.jpg'
];


