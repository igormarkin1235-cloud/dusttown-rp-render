import React from 'react';

interface AvatarWithFrameProps {
  avatarUrl: string;
  frameId?: string; // 'frame_none' | 'frame_gold_3d' | 'frame_rad_pulse' | 'frame_cyber_glitch' | 'frame_rainbow_neon' | 'frame_steel_rivets' | 'frame_enclave_wings' | 'frame_toxic_flame'
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isOwner?: boolean;
}

export const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({
  avatarUrl,
  frameId = 'frame_none',
  size = 'md',
  className = '',
  isOwner = false
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
        <img
          src={avatarUrl}
          alt="Avatar"
          className={`${sizeMap.img} object-cover border-2 border-amber-500/70 shadow-md`}
        />
        {isOwner && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-black shadow" />
        )}
      </div>
    );
  }

  // 2. 3D Golden Relic Frame (Довоенное 3D Золото с фасками и рельефом)
  if (frameId === 'frame_gold_3d') {
    return (
      <div className={`relative flex items-center justify-center ${sizeMap.box} ${className} group`}>
        {/* Outer 3D Bevel with perspective shadow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-200 via-amber-600 to-amber-950 p-[3px] shadow-[0_6px_14px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.7)] transform transition-transform group-hover:scale-105">
          <div className="w-full h-full rounded-[13px] bg-gradient-to-tr from-yellow-800 via-amber-500 to-yellow-200 p-[2px] shadow-inner flex items-center justify-center">
            <div className="w-full h-full rounded-[11px] bg-black overflow-hidden flex items-center justify-center">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
        {/* Corner 3D Studs */}
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
        {/* Pulsing neon green aura */}
        <div className="absolute -inset-1 rounded-2xl bg-emerald-500/40 blur-sm animate-pulse" />
        <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 border-dashed animate-spin" style={{ animationDuration: '9s' }} />
        <div className="relative w-[90%] h-[90%] rounded-xl overflow-hidden border-2 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]">
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          <div className="absolute top-0 right-0 px-1 rounded-bl bg-emerald-950/80 text-[8px] font-mono-pip text-emerald-300 border-b border-l border-emerald-500">
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
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,255,0.15)_50%)] bg-[length:100%_4px]" />
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
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
        <div className="absolute -inset-1.5 flex items-center justify-between pointer-events-none px-0.5">
          <span className="text-amber-400 text-xs filter drop-shadow">🪽</span>
          <span className="text-amber-400 text-xs filter drop-shadow transform scale-x-[-1]">🪽</span>
        </div>
        <div className="relative w-[90%] h-[90%] rounded-2xl p-[2px] bg-gradient-to-b from-amber-300 to-yellow-600 border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
          <div className="w-full h-full rounded-[14px] bg-zinc-950 overflow-hidden">
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    );
  }

  // 8. Toxic Flame Frame (Токсичное радиоактивное пламя)
  return (
    <div className={`relative flex items-center justify-center ${sizeMap.box} ${className}`}>
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-t from-emerald-600 via-lime-400 to-yellow-400 opacity-90 blur-[2px] animate-pulse" />
      <div className="relative w-[92%] h-[92%] rounded-xl bg-zinc-950 p-[2px] overflow-hidden border border-emerald-400">
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
      </div>
    </div>
  );
};
