import React from 'react';

interface AvatarWithFrameProps {
  avatarUrl: string;
  frameId?: string; // 'frame_none' | 'frame_gold_3d' | 'frame_rad_pulse' | 'frame_cyber_glitch' | 'frame_rainbow_neon' | 'frame_steel_rivets' | 'frame_enclave_wings' | 'frame_toxic_flame' | etc.
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isOwner?: boolean;
  fitMode?: 'cover' | 'contain';
  zoom?: number;
  offsetY?: number;
  offsetX?: number;
}

const RenderAvatarImg: React.FC<{
  url: string;
  className?: string;
  fitMode?: 'cover' | 'contain';
  zoom?: number;
  offsetY?: number;
  offsetX?: number;
}> = ({ url, className = '', fitMode = 'cover', zoom = 1, offsetY = 0, offsetX = 0 }) => {
  const isContain = fitMode === 'contain';
  return (
    <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-black ${className}`}>
      {isContain && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-md opacity-40 scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${url})` }}
        />
      )}
      <img
        src={url}
        alt="Avatar"
        className={`relative z-10 w-full h-full ${
          isContain ? 'object-contain p-0.5' : 'object-cover'
        } transition-transform duration-300`}
        style={{
          transform: `scale(${zoom || 1}) translate(${offsetX || 0}%, ${offsetY || 0}%)`
        }}
        onError={e => {
          (e.target as HTMLImageElement).src =
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
        }}
      />
    </div>
  );
};

export const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({
  avatarUrl,
  frameId = 'frame_none',
  size = 'md',
  className = '',
  isOwner = false,
  fitMode = 'cover',
  zoom = 1,
  offsetY = 0,
  offsetX = 0
}) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8', img: 'w-7 h-7 rounded-lg' },
    md: { box: 'w-12 h-12', img: 'w-10 h-10 rounded-xl' },
    lg: { box: 'w-20 h-20', img: 'w-16 h-16 rounded-2xl' },
    xl: { box: 'w-28 h-28', img: 'w-24 h-24 rounded-3xl' }
  }[size];

  // 1. None / Default
  if (!frameId || frameId === 'frame_none') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className={`${sizeMap.img} overflow-hidden border-2 border-amber-500/70 shadow-md`}>
          <RenderAvatarImg
            url={avatarUrl}
            fitMode={fitMode}
            zoom={zoom}
            offsetY={offsetY}
            offsetX={offsetX}
          />
        </div>
        {isOwner && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-black shadow z-20" />
        )}
      </div>
    );
  }

  // 2. 3D Golden Relic Frame (Довоенное 3D Золото с фасками и рельефом)
  if (frameId === 'frame_gold_3d') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className} group`}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-200 via-amber-600 to-amber-950 p-[3px] shadow-[0_6px_14px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.7)] transform transition-transform group-hover:scale-105">
          <div className="w-full h-full rounded-[13px] bg-gradient-to-tr from-yellow-800 via-amber-500 to-yellow-200 p-[2px] shadow-inner flex items-center justify-center">
            <div className="w-full h-full rounded-[11px] bg-black overflow-hidden flex items-center justify-center">
              <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} />
            </div>
          </div>
        </div>
        <div className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-amber-200 border border-black shadow" />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-200 border border-black shadow" />
        <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 rounded-full bg-amber-200 border border-black shadow" />
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-200 border border-black shadow" />
      </div>
    );
  }

  // 3. Radioactive Pulse Frame (Анимированная радиоактивная пульсация)
  if (frameId === 'frame_rad_pulse') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -inset-1 rounded-2xl bg-emerald-500/40 blur-sm animate-pulse" />
        <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 border-dashed animate-spin" style={{ animationDuration: '9s' }} />
        <div className="relative w-[90%] h-[90%] rounded-xl overflow-hidden border-2 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} />
          <div className="absolute top-0 right-0 px-1 rounded-bl bg-emerald-950/80 text-[8px] font-mono-pip text-emerald-300 border-b border-l border-emerald-500 z-20">
            ☢️
          </div>
        </div>
      </div>
    );
  }

  // 4. Cyber Glitch Holo Frame (Неоновый кибер-глитч)
  if (frameId === 'frame_cyber_glitch') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-blue-500 animate-pulse opacity-85 blur-[3px]" />
        <div className="relative w-[92%] h-[92%] rounded-xl bg-black p-[2px] overflow-hidden border border-cyan-400">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded-lg" />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,255,0.15)_50%)] bg-[length:100%_4px] z-20" />
        </div>
      </div>
    );
  }

  // 5. Rainbow Prism Shimmer Frame (Радужная переливающаяся рамка)
  if (frameId === 'frame_rainbow_neon') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(90deg,#ff5e62,#ff9966,#ffea79,#5cdbb5,#5e93ff,#be63ff,#ff5e62)] bg-[length:300%_300%] animate-[rainbow-shift_3s_ease_infinite] p-[3px] shadow-[0_0_15px_rgba(236,72,153,0.6)]">
          <div className="w-full h-full rounded-[13px] bg-zinc-950 overflow-hidden flex items-center justify-center">
            <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} />
          </div>
        </div>
      </div>
    );
  }

  // 6. Steel Rivets Wasteland Frame (Стальная бронепластина сталкера)
  if (frameId === 'frame_steel_rivets') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute inset-0 rounded-2xl bg-stone-700 border-2 border-stone-500 shadow-xl p-[3px]">
          <div className="w-full h-full rounded-xl bg-zinc-950 overflow-hidden flex items-center justify-center border border-stone-800">
            <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} />
          </div>
        </div>
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-zinc-300 border border-black" />
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-300 border border-black" />
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-zinc-300 border border-black" />
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-300 border border-black" />
      </div>
    );
  }

  // 7. Enclave Wings Golden Frame (Крылья Анклава)
  if (frameId === 'frame_enclave_wings') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -inset-1.5 flex items-center justify-between pointer-events-none px-0.5 z-20">
          <span className="text-amber-400 text-xs filter drop-shadow">🪽</span>
          <span className="text-amber-400 text-xs filter drop-shadow transform scale-x-[-1]">🪽</span>
        </div>
        <div className="relative w-[90%] h-[90%] rounded-2xl p-[2px] bg-gradient-to-b from-amber-300 to-yellow-600 border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
          <div className="w-full h-full rounded-[14px] bg-zinc-950 overflow-hidden">
            <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} />
          </div>
        </div>
      </div>
    );
  }

  // 8. Toxic Flame Frame (Токсичное радиоактивное пламя)
  if (frameId === 'frame_toxic_flame') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-t from-emerald-600 via-lime-400 to-yellow-400 opacity-90 blur-[2px] animate-pulse" />
        <div className="relative w-[92%] h-[92%] rounded-xl bg-zinc-950 p-[2px] overflow-hidden border border-emerald-400">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded-lg" />
        </div>
      </div>
    );
  }

  // 9. Quantum Singularity Frame (Квантовая Сингулярность - вращающийся лазурный вихрь)
  if (frameId === 'frame_quantum_singularity') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-600 to-fuchsia-500 blur-sm opacity-80 animate-pulse" />
        <div className="absolute -inset-0.5 rounded-2xl border-2 border-cyan-400 border-dashed animate-spin" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-1 rounded-xl border border-indigo-400 border-dotted animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />
        <div className="relative w-[88%] h-[88%] rounded-xl bg-black p-[2px] overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.9)]">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded-lg" />
        </div>
      </div>
    );
  }

  // 10. Fire Inferno Frame (Пламя Преисподней - живой огонь и угли)
  if (frameId === 'frame_fire_inferno') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-t from-red-600 via-orange-500 to-amber-300 blur-[3px] opacity-95 animate-pulse" />
        <div className="absolute -top-1 left-2 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping z-20" />
        <div className="absolute -top-1.5 right-3 w-2 h-2 rounded-full bg-amber-400 animate-ping z-20" style={{ animationDelay: '0.6s' }} />
        <div className="relative w-[90%] h-[90%] rounded-xl bg-zinc-950 p-[2px] overflow-hidden border-2 border-amber-400 shadow-[0_0_12px_#f97316]">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded-lg" />
          <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t from-amber-500/40 to-transparent pointer-events-none z-20" />
        </div>
      </div>
    );
  }

  // 11. Matrix Code Rain Frame (Матричный Зеленый Дождь)
  if (frameId === 'frame_matrix_code') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px] animate-pulse border-2 border-emerald-400 shadow-[0_0_10px_#10b981]" />
        <div className="relative w-[88%] h-[88%] rounded-xl bg-zinc-950 p-[2px] overflow-hidden border border-emerald-500">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded-lg" />
          <div className="absolute top-0 right-0 px-1 rounded-bl bg-black/80 text-[7px] font-mono text-emerald-400 z-20">
            01
          </div>
        </div>
      </div>
    );
  }

  // 12. Void Darkness Abyss (Тёмная Бездна - фиолетовый эфир с чёрным свечением)
  if (frameId === 'frame_void_darkness') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-purple-900 via-fuchsia-950 to-black blur-sm opacity-90 animate-pulse" />
        <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/80 shadow-[0_0_15px_#a855f7]" />
        <div className="relative w-[90%] h-[90%] rounded-xl bg-black p-[2px] overflow-hidden border border-fuchsia-500/60">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded-lg" />
        </div>
      </div>
    );
  }

  // 13. Pip-Boy Hologram HUD (Голографическая янтарная рамка Пип-Бой)
  if (frameId === 'frame_pipboy_hologram') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -inset-1 rounded-xl border border-amber-400/80 shadow-[0_0_10px_#f59e0b] animate-pulse" />
        <div className="absolute -top-1 -left-1 text-[8px] font-mono text-amber-400 leading-none">┌</div>
        <div className="absolute -top-1 -right-1 text-[8px] font-mono text-amber-400 leading-none">┐</div>
        <div className="absolute -bottom-1 -left-1 text-[8px] font-mono text-amber-400 leading-none">└</div>
        <div className="absolute -bottom-1 -right-1 text-[8px] font-mono text-amber-400 leading-none">┘</div>
        <div className="relative w-[90%] h-[90%] rounded-lg bg-zinc-950 p-[2px] overflow-hidden border border-amber-400/90 shadow-[inset_0_0_8px_rgba(245,158,11,0.5)]">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.1)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none z-20" />
        </div>
      </div>
    );
  }

  // 14. Alicorn Crown Frame (Корона Аликорна - легендарное королевское золото)
  if (frameId === 'frame_alicorn_crown') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -top-3 inset-x-0 flex justify-center z-20 pointer-events-none">
          <span className="text-sm filter drop-shadow-[0_0_8px_#facc15] animate-bounce" style={{ animationDuration: '3s' }}>
            👑
          </span>
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 p-[2px] shadow-[0_0_18px_rgba(250,204,21,0.8)]">
          <div className="w-full h-full rounded-[14px] bg-black" />
        </div>
        <div className="relative w-[90%] h-[90%] rounded-xl overflow-hidden border-2 border-yellow-300">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} />
        </div>
      </div>
    );
  }

  // 15. Bloody Barbed Wire Frame (Колючая проволока рейдеров Пустоши)
  if (frameId === 'frame_bloody_barbed') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute inset-0 rounded-xl border-2 border-stone-600 shadow-lg" />
        <div className="absolute -top-1 left-1/4 text-[8px] text-red-500 font-bold select-none z-20">✕</div>
        <div className="absolute -bottom-1 right-1/4 text-[8px] text-red-500 font-bold select-none z-20">✕</div>
        <div className="absolute top-1/2 -left-1 text-[8px] text-red-600 font-bold select-none z-20">🩸</div>
        <div className="absolute top-1/2 -right-1 text-[8px] text-red-600 font-bold select-none z-20">🩸</div>
        <div className="relative w-[88%] h-[88%] rounded-lg bg-zinc-950 p-[2px] overflow-hidden border-2 border-red-900 shadow-[0_0_8px_#7f1d1d]">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded" />
        </div>
      </div>
    );
  }

  // 16. Neon Spectrum Frame (Неоновый Гиперспектр - бегущий градиент)
  if (frameId === 'frame_neon_spectrum') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-yellow-400 p-[3px] animate-spin" style={{ animationDuration: '4s' }} />
        <div className="relative w-[90%] h-[90%] rounded-xl bg-black p-[2px] overflow-hidden z-10 shadow-[0_0_12px_rgba(236,72,153,0.8)]">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded-lg" />
        </div>
      </div>
    );
  }

  // 17. Frozen Ice Frame (Вечная Мерзлота - ледяные кристаллы)
  if (frameId === 'frame_frozen_ice') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-sky-300 via-cyan-400 to-blue-600 blur-[2px] opacity-80 animate-frost-pulse" />
        <div className="absolute -top-1 -right-1 text-[9px] text-sky-200 z-20">❄️</div>
        <div className="absolute -bottom-1 -left-1 text-[9px] text-sky-200 z-20">❄️</div>
        <div className="relative w-[90%] h-[90%] rounded-xl bg-slate-950 p-[2px] overflow-hidden border-2 border-sky-300 shadow-[0_0_12px_#38bdf8]">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded-lg" />
        </div>
      </div>
    );
  }

  // 18. Stable-Tec Gear Cog Frame (Вращающаяся шестерня Стойла)
  if (frameId === 'frame_stable_cog') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '18s' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full text-amber-500/80 drop-shadow-[0_0_6px_#f59e0b]">
            <path
              fill="currentColor"
              d="M50 20 A30 30 0 0 1 80 50 A30 30 0 0 1 50 80 A30 30 0 0 1 20 50 A30 30 0 0 1 50 20 Z"
            />
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
              <rect
                key={deg}
                x="46"
                y="5"
                width="8"
                height="12"
                rx="2"
                fill="currentColor"
                transform={`rotate(${deg} 50 50)`}
              />
            ))}
          </svg>
        </div>
        <div className="relative w-[78%] h-[78%] rounded-full overflow-hidden border-2 border-amber-300 z-10 shadow-inner">
          <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} />
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-t from-emerald-600 via-lime-400 to-yellow-400 opacity-90 blur-[2px] animate-pulse" />
      <div className="relative w-[92%] h-[92%] rounded-xl bg-zinc-950 p-[2px] overflow-hidden border border-emerald-400">
        <RenderAvatarImg url={avatarUrl} fitMode={fitMode} zoom={zoom} offsetY={offsetY} offsetX={offsetX} className="rounded-lg" />
      </div>
    </div>
  );
};
