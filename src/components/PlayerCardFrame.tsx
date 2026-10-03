import React from 'react';

export type PlayerCardFrameType =
  | 'card_frame_none'
  | 'card_frame_champion_gold'
  | 'card_frame_rad_hazard'
  | 'card_frame_quantum_cyan'
  | 'card_frame_crimson_fire'
  | 'card_frame_steel_armor'
  | 'card_frame_void_nebula'
  | 'card_frame_magitech'
  | 'card_frame_silver_rank'
  | 'card_frame_bronze_rank';

interface PlayerCardFrameProps {
  frameId?: string;
  rank?: number;
  isOwner?: boolean;
  isAdmin?: boolean;
  isSelected?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PRESET_CARD_FRAMES: Array<{
  id: PlayerCardFrameType;
  name: string;
  badge: string;
  description: string;
  accentColor: string;
  icon: string;
}> = [
  {
    id: 'card_frame_none',
    name: 'Стандартный контур',
    badge: 'Базовый',
    description: 'Аккуратная тёмная рамка Пустоши без лишних спецэффектов',
    accentColor: '#71717a',
    icon: '▫️'
  },
  {
    id: 'card_frame_champion_gold',
    name: 'Золото Чемпиона Топ-1',
    badge: '👑 Легенда',
    description: 'Сияющая золотая рамка с объёмными уголками и короной чемпиона',
    accentColor: '#fbbf24',
    icon: '👑'
  },
  {
    id: 'card_frame_rad_hazard',
    name: 'Радиационный Неон',
    badge: '☢️ Неон',
    description: 'Ядовито-зелёный светящийся контур с эффектом изотопного распада',
    accentColor: '#22c55e',
    icon: '☢️'
  },
  {
    id: 'card_frame_quantum_cyan',
    name: 'Квантовый Кибер-Контур',
    badge: '⚡ Квант',
    description: 'Лазурная голографическая рамка терминалов Министерства Технологий',
    accentColor: '#06b6d4',
    icon: '⚡'
  },
  {
    id: 'card_frame_crimson_fire',
    name: 'Адское Пламя Пустоши',
    badge: '🔥 Пламя',
    description: 'Пульсирующий рубиновый контур с огненным ореолом выжженной земли',
    accentColor: '#ef4444',
    icon: '🔥'
  },
  {
    id: 'card_frame_steel_armor',
    name: 'Броня Стальных Рейнджеров',
    badge: '🛡️ Броня',
    description: 'Тяжелая титаново-стальная бронепластина с заклёпками по углам',
    accentColor: '#94a3b8',
    icon: '🛡️'
  },
  {
    id: 'card_frame_void_nebula',
    name: 'Пурпурная Бездна Стойла',
    badge: '🔮 Бездна',
    description: 'Глубокий фиолетовый перелив ночного неба и довоенной магии',
    accentColor: '#a855f7',
    icon: '🔮'
  },
  {
    id: 'card_frame_magitech',
    name: 'Довоенный Магитех',
    badge: '✨ Магитех',
    description: 'Бронзово-янтарный орнамент древних единорогов-исследователей',
    accentColor: '#d97706',
    icon: '✨'
  }
];

export const PlayerCardFrame: React.FC<PlayerCardFrameProps> = ({
  frameId,
  rank,
  isOwner,
  isAdmin,
  isSelected,
  className = '',
  children
}) => {
  // Resolve effective frame: prioritize explicitly equipped card frame,
  // then map avatar frame if compatible, then fallback to automatic rank prestige!
  let effectiveFrame: PlayerCardFrameType = 'card_frame_none';

  if (frameId && PRESET_CARD_FRAMES.some(f => f.id === frameId)) {
    effectiveFrame = frameId as PlayerCardFrameType;
  } else if (frameId === 'frame_gold_3d' || frameId === 'frame_gold_halo' || isOwner) {
    effectiveFrame = 'card_frame_champion_gold';
  } else if (frameId === 'frame_rad_pulse' || frameId === 'frame_toxic_flame') {
    effectiveFrame = 'card_frame_rad_hazard';
  } else if (frameId === 'frame_cyber_glitch' || frameId === 'frame_rainbow_neon') {
    effectiveFrame = 'card_frame_quantum_cyan';
  } else if (frameId === 'frame_steel_rivets' || frameId === 'frame_enclave_wings') {
    effectiveFrame = 'card_frame_steel_armor';
  } else if (rank === 1) {
    effectiveFrame = 'card_frame_champion_gold';
  } else if (rank === 2) {
    effectiveFrame = 'card_frame_silver_rank';
  } else if (rank === 3) {
    effectiveFrame = 'card_frame_bronze_rank';
  }

  // 1. Golden Champion (Top-1 / Gold)
  if (effectiveFrame === 'card_frame_champion_gold') {
    return (
      <div
        className={`relative p-[2.5px] rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600 shadow-[0_0_18px_rgba(245,158,11,0.55)] transition-all duration-300 hover:scale-[1.03] group ${className}`}
      >
        {/* Animated Golden Shimmer */}
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent pointer-events-none" />
        
        {/* 4 Corner Ornaments */}
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-900 shadow z-30" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-900 shadow z-30" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-900 shadow z-30" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-900 shadow z-30" />

        {/* Inner Card Container */}
        <div className="relative w-full h-full rounded-[14px] bg-zinc-950/95 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // 2. Silver Veteran (Top-2)
  if (effectiveFrame === 'card_frame_silver_rank') {
    return (
      <div
        className={`relative p-[2px] rounded-2xl bg-gradient-to-r from-slate-200 via-zinc-400 to-slate-100 shadow-[0_0_15px_rgba(203,213,225,0.45)] transition-all duration-300 hover:scale-[1.03] ${className}`}
      >
        <div className="relative w-full h-full rounded-[14px] bg-zinc-950/95 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // 3. Bronze Pioneer (Top-3)
  if (effectiveFrame === 'card_frame_bronze_rank') {
    return (
      <div
        className={`relative p-[2px] rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-orange-800 shadow-[0_0_15px_rgba(180,83,9,0.4)] transition-all duration-300 hover:scale-[1.03] ${className}`}
      >
        <div className="relative w-full h-full rounded-[14px] bg-zinc-950/95 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // 4. Radioactive Hazard Neon
  if (effectiveFrame === 'card_frame_rad_hazard') {
    return (
      <div
        className={`relative p-[2.5px] rounded-2xl bg-gradient-to-r from-emerald-400 via-lime-300 to-green-500 shadow-[0_0_18px_rgba(34,197,94,0.6)] animate-pulse transition-all duration-300 hover:scale-[1.03] ${className}`}
      >
        {/* Pulsing Radiation Corner Indicators */}
        <div className="absolute top-0 right-1 px-1 rounded-bl bg-emerald-950/90 text-[7px] font-mono-pip text-emerald-300 border-b border-l border-emerald-400 z-30">
          ☢️
        </div>
        <div className="relative w-full h-full rounded-[14px] bg-zinc-950/95 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // 5. Quantum Cyber Cyan
  if (effectiveFrame === 'card_frame_quantum_cyan') {
    return (
      <div
        className={`relative p-[2px] rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 shadow-[0_0_18px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-[1.03] ${className}`}
      >
        <div className="absolute -top-0.5 left-3 w-6 h-1 bg-cyan-300 rounded-full shadow-[0_0_8px_#22d3ee] z-30" />
        <div className="relative w-full h-full rounded-[14px] bg-zinc-950/95 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // 6. Crimson Hellfire
  if (effectiveFrame === 'card_frame_crimson_fire') {
    return (
      <div
        className={`relative p-[2.5px] rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-rose-600 shadow-[0_0_18px_rgba(239,68,68,0.65)] transition-all duration-300 hover:scale-[1.03] ${className}`}
      >
        <div className="absolute -top-1 right-2 text-[9px] z-30 animate-bounce">🔥</div>
        <div className="relative w-full h-full rounded-[14px] bg-zinc-950/95 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // 7. Steel Ranger Armor
  if (effectiveFrame === 'card_frame_steel_armor') {
    return (
      <div
        className={`relative p-[2px] rounded-2xl bg-gradient-to-r from-slate-400 via-zinc-600 to-slate-500 shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all duration-300 hover:scale-[1.03] ${className}`}
      >
        <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-zinc-300 border border-zinc-900 z-30" />
        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-zinc-300 border border-zinc-900 z-30" />
        <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-zinc-300 border border-zinc-900 z-30" />
        <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-zinc-300 border border-zinc-900 z-30" />
        <div className="relative w-full h-full rounded-[14px] bg-zinc-950/95 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // 8. Void Nebula
  if (effectiveFrame === 'card_frame_void_nebula') {
    return (
      <div
        className={`relative p-[2px] rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-400 to-fuchsia-500 shadow-[0_0_18px_rgba(168,85,247,0.55)] transition-all duration-300 hover:scale-[1.03] ${className}`}
      >
        <div className="relative w-full h-full rounded-[14px] bg-zinc-950/95 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // 9. Pre-War Magitech
  if (effectiveFrame === 'card_frame_magitech') {
    return (
      <div
        className={`relative p-[2px] rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 shadow-[0_0_16px_rgba(217,119,6,0.5)] transition-all duration-300 hover:scale-[1.03] ${className}`}
      >
        <div className="relative w-full h-full rounded-[14px] bg-zinc-950/95 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // Default clean card wrapper
  return (
    <div
      className={`relative p-[1px] rounded-2xl border transition-all duration-200 ${
        isSelected
          ? 'border-amber-400/80 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/80'
      } ${className}`}
    >
      <div className="relative w-full h-full rounded-[15px] overflow-hidden">
        {children}
      </div>
    </div>
  );
};
