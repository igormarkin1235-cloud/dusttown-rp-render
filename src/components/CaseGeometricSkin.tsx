import React from 'react';

interface CaseSkinProps {
  skinType: 'supply_crate' | 'quantum_crystal' | 'reliquary' | 'cosmetic_box';
  isShaking?: boolean;
  isOpening?: boolean;
  isOpen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CaseGeometricSkin: React.FC<CaseSkinProps> = ({
  skinType,
  isShaking = false,
  isOpening = false,
  isOpen = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-44 h-44',
    lg: 'w-64 h-64'
  }[size];

  const shakeClass = isShaking ? 'animate-bounce' : '';
  const openingClass = isOpening ? 'scale-110 filter brightness-150 transition-all duration-700' : '';

  if (skinType === 'supply_crate') {
    return (
      <div className={`relative flex items-center justify-center ${sizeClasses} ${shakeClass} ${openingClass}`}>
        {/* Steel Outer Crate Body */}
        <div className="w-full h-full rounded-2xl bg-gradient-to-b from-stone-700 via-stone-800 to-zinc-900 border-4 border-amber-500/70 shadow-2xl relative overflow-hidden flex flex-col justify-between p-3.5">
          {/* Hazard diagonal stripes top bar */}
          <div className="w-full h-4 rounded bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_10px,#18181b_10px,#18181b_20px)] border-b border-amber-600/50" />
          
          {/* Middle Vault Lock Plate */}
          <div className="my-auto flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl bg-zinc-950 border-2 border-amber-400/80 flex items-center justify-center shadow-inner relative">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-500 animate-spin" style={{ animationDuration: '10s' }} />
              <div className="absolute w-5 h-5 rounded bg-amber-500/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              </div>
            </div>
          </div>

          {/* Rivets in 4 corners */}
          <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-zinc-400 border border-black shadow" />
          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-zinc-400 border border-black shadow" />
          <div className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-zinc-400 border border-black shadow" />
          <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-zinc-400 border border-black shadow" />

          {/* Industrial label */}
          <div className="w-full flex items-center justify-between text-[10px] font-mono-pip text-amber-300 font-bold px-1">
            <span>DT-MIL-04</span>
            <span className="text-emerald-400">● LOCKED</span>
          </div>
        </div>
      </div>
    );
  }

  if (skinType === 'quantum_crystal') {
    return (
      <div className={`relative flex items-center justify-center ${sizeClasses} ${shakeClass} ${openingClass}`}>
        {/* Outer rotating energy field */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-dashed animate-spin" style={{ animationDuration: '8s' }} />
        
        {/* Rhombus Diamond Crystal Container */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="absolute w-32 h-32 rotate-45 rounded-3xl bg-gradient-to-tr from-cyan-950 via-blue-900 to-teal-500/40 border-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.6)] backdrop-blur-sm" />
          <div className="absolute w-20 h-20 rotate-45 rounded-xl bg-gradient-to-br from-cyan-400/30 via-white/20 to-blue-600/50 border-2 border-cyan-200 shadow-[0_0_15px_#22d3ee]" />
          
          {/* Magic Core Pulse */}
          <div className="relative z-10 w-8 h-8 rounded-full bg-white shadow-[0_0_20px_#38bdf8] flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
          </div>

          {/* Rune accents */}
          <span className="absolute -top-1 text-cyan-300 text-xs font-mono font-bold tracking-widest">✧ ◈ ✧</span>
          <span className="absolute -bottom-1 text-cyan-300 text-xs font-mono font-bold tracking-widest">◈ ℰQ ◈</span>
        </div>
      </div>
    );
  }

  if (skinType === 'reliquary') {
    return (
      <div className={`relative flex items-center justify-center ${sizeClasses} ${shakeClass} ${openingClass}`}>
        {/* Sunburst radial halo */}
        <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent rounded-full animate-pulse" />

        {/* Octagonal Golden Reliquary */}
        <div className="w-40 h-40 relative flex items-center justify-center">
          {/* Layer 1: Gold Base */}
          <div className="absolute inset-2 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-600 to-amber-950 border-4 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)] transform rotate-45" />
          {/* Layer 2: Inner Royal Velvet */}
          <div className="absolute inset-5 rounded-2xl bg-gradient-to-tr from-purple-950 via-violet-900 to-stone-900 border-2 border-amber-400/80 transform rotate-12 flex items-center justify-center" />
          
          {/* Pegasus Wing Inlay */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-3xl filter drop-shadow-[0_0_10px_#fde047]">🪽</span>
            <div className="w-12 h-1 bg-amber-300 rounded-full mt-1 shadow-[0_0_8px_#f59e0b]" />
            <span className="text-[10px] font-heading font-bold text-amber-200 mt-1 uppercase tracking-wider">Equestria</span>
          </div>
        </div>
      </div>
    );
  }

  // cosmetic_box
  return (
    <div className={`relative flex items-center justify-center ${sizeClasses} ${shakeClass} ${openingClass}`}>
      <div className="w-36 h-36 relative flex items-center justify-center">
        {/* Prismatic multi-layer Hexagon */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-rose-500 via-purple-600 to-blue-500 opacity-80 blur-md animate-pulse" />
        <div className="absolute inset-2 rounded-2xl bg-zinc-950 border-2 border-pink-400/70 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(244,63,94,0.15)_50%,transparent_75%)] bg-[length:250%_250%] animate-[rainbow-shift_5s_ease_infinite]" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-3xl filter drop-shadow-[0_0_12px_#ec4899]">🎨</span>
          <span className="text-xs font-bold rainbow-shimmer-text mt-1">STYLE CASE</span>
        </div>
      </div>
    </div>
  );
};
