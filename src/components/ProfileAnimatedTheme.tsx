import React from 'react';
import { BlackTreeThemeDecor } from './BlackTreeThemeDecor';

interface ProfileAnimatedThemeProps {
  themeId: string;
}

export const ProfileAnimatedTheme: React.FC<ProfileAnimatedThemeProps> = ({ themeId }) => {
  // 1. Black Tree Theme (Чёрное Древо с падающими алыми/винными листьями)
  if (themeId === 'black_tree') {
    return <BlackTreeThemeDecor />;
  }

  // 2. Radioactive Storm Theme (Радиоактивный шторм с зелёными искрами и туманом)
  if (themeId === 'rad_storm') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        {/* Toxic gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-zinc-950 to-green-950/80 opacity-95" />
        
        {/* Animated radiation wave pulse */}
        <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.25)_0%,_transparent_70%)] animate-pulse" style={{ animationDuration: '4s' }} />

        {/* Radiation Hazmat scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[length:100%_8px]" />

        {/* Floating Toxic Sparks */}
        <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-16 right-20 w-3 h-3 rounded-full bg-lime-400 shadow-[0_0_14px_#a3e635] animate-ping" style={{ animationDuration: '4.5s', animationDelay: '1s' }} />
        <div className="absolute top-20 right-32 w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#6ee7b7] animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute bottom-8 left-28 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80] animate-ping" style={{ animationDuration: '3.8s', animationDelay: '1.5s' }} />

        {/* Toxic Hazard watermark symbol */}
        <div className="absolute -bottom-8 -right-6 text-9xl text-emerald-500/10 font-mono select-none">
          ☢
        </div>
      </div>
    );
  }

  // 3. Radioactive Core Theme (Радиоактивный реактор с большим знаком радиации и фонтанирующими частицами)
  if (themeId === 'rad_core') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        {/* Dark Reactor Core Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-emerald-950" />

        {/* Central Core Glow */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />

        {/* Spinning Radioactive Trefoil Hazard Symbol with glowing aura */}
        <div className="absolute -right-4 -bottom-4 sm:right-6 sm:bottom-2 w-44 h-44 flex items-center justify-center opacity-85">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Spinning ring of particles around the trefoil */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/50 animate-spin" style={{ animationDuration: '14s' }} />
            <div className="absolute inset-3 rounded-full border border-emerald-500/30 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />

            {/* Glowing Radioactive Trefoil SVG */}
            <svg viewBox="0 0 100 100" className="w-28 h-28 filter drop-shadow-[0_0_16px_rgba(52,211,153,0.9)] animate-pulse" style={{ animationDuration: '2.5s' }}>
              {/* Outer Blades */}
              <circle cx="50" cy="50" r="10" fill="#34d399" />
              <path
                d="M50 35 L40 12 A42 42 0 0 1 60 12 Z"
                fill="#10b981"
              />
              <path
                d="M50 35 L40 12 A42 42 0 0 1 60 12 Z"
                fill="#10b981"
                transform="rotate(120 50 50)"
              />
              <path
                d="M50 35 L40 12 A42 42 0 0 1 60 12 Z"
                fill="#10b981"
                transform="rotate(240 50 50)"
              />
              <circle cx="50" cy="50" r="5" fill="#09090b" />
            </svg>
          </div>
        </div>

        {/* Fountaining Glowing Green Particles Emitter */}
        <div className="absolute right-24 bottom-24">
          <span className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping" style={{ animationDuration: '1.2s' }} />
          <span className="absolute -top-6 -left-4 w-2.5 h-2.5 rounded-full bg-lime-300 shadow-[0_0_10px_#bef264] animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }} />
          <span className="absolute -top-12 left-6 w-1.5 h-1.5 rounded-full bg-emerald-200 shadow-[0_0_6px_#a7f3d0] animate-ping" style={{ animationDuration: '2.2s', animationDelay: '0.8s' }} />
          <span className="absolute -top-16 -left-10 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80] animate-ping" style={{ animationDuration: '1.6s', animationDelay: '1.1s' }} />
        </div>
      </div>
    );
  }

  // 4. Quantum Spark Magic Pulse (Квантовое поле Яблочного Спарка)
  if (themeId === 'quantum_pulse') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950 via-slate-950 to-blue-950 opacity-95" />
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/3 w-72 h-40 bg-blue-600/15 blur-2xl animate-pulse" style={{ animationDuration: '6s' }} />
        {/* Floating Quantum Runes */}
        <div className="absolute top-4 right-10 text-cyan-400/40 text-sm font-mono animate-bounce" style={{ animationDuration: '4s' }}>
          ✧ ◈ ℰQ ◈ ✧
        </div>
        <div className="absolute bottom-4 right-24 text-cyan-300/30 text-xs font-mono">
          [QUANTUM FLUX: OPTIMAL]
        </div>
      </div>
    );
  }

  // 5. Cyberpunk Wasteland Neon (Киберпанк пустоши: неоновые сетки и глифы)
  if (themeId === 'cyber_neon') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950/40 via-zinc-950 to-purple-950/60" />
        {/* Perspective Grid Floor */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-[linear-gradient(to_bottom,transparent,rgba(217,70,239,0.15)),repeating-linear-gradient(90deg,rgba(217,70,239,0.25)_0px,rgba(217,70,239,0.25)_1px,transparent_1px,transparent_24px)]" />
        <div className="absolute top-2 right-4 text-fuchsia-400/30 text-xs font-mono-pip tracking-widest">
          CYBER-NET//2077
        </div>
      </div>
    );
  }

  // 6. Solar Gold Enclave (Золотое солнце Анклава)
  if (themeId === 'solar_gold') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/70 via-stone-900 to-yellow-950/40" />
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-2 right-6 text-3xl opacity-20 filter drop-shadow">
          ☀️
        </div>
      </div>
    );
  }

  return null;
};
