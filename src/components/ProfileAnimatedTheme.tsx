import React from 'react';
import { BlackTreeThemeDecor } from './BlackTreeThemeDecor';
import { ProfilePhotoWithEffects, ProfileEffectType } from './ProfilePhotoWithEffects';

export interface ProfileAnimatedThemeProps {
  themeId: string;
  customBgUrl?: string;
  customBgEffect?: ProfileEffectType;
  customBgPosition?: 'center' | 'top' | 'bottom';
}

export const ProfileAnimatedTheme: React.FC<ProfileAnimatedThemeProps> = ({
  themeId,
  customBgUrl,
  customBgEffect = 'embers',
  customBgPosition = 'center'
}) => {
  // 0. Custom Photo Background (User uploaded or pinned artwork)
  if (themeId === 'bg_custom_photo' || (themeId === 'default' && customBgUrl) || (customBgUrl && themeId === 'custom')) {
    if (customBgUrl) {
      return (
        <ProfilePhotoWithEffects
          imageUrl={customBgUrl}
          effect={customBgEffect}
          position={customBgPosition}
          badgeText="КАСТОМНЫЙ ФОН ПЕРСОНАЖА"
        />
      );
    }
  }

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

  // ========================================================
  // 18 ПОЛЬЗОВАТЕЛЬСКИХ ФОНОВ С НАСТОЯЩИМИ ФОТОГРАФИЯМИ И АНИМИРОВАННЫМИ ЭФФЕКТАМИ
  // ========================================================

  // 7. Sparkle Cola Poster (Искорка Кола: Вкус Моркови)
  if (themeId === 'bg_sparkle_cola') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/sparkle_cola.jpg"
          alt="Sparkle Cola"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        {/* Darkening gradient overlay for crystal-clear text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-amber-950/40" />
        <div className="absolute inset-0 border-2 border-amber-400/30 rounded-3xl" />
        {/* Animated Rising Carbonation Bubbles */}
        <div className="absolute bottom-4 left-1/4 w-2 h-2 rounded-full bg-amber-300/80 animate-ping" style={{ animationDuration: '2.5s' }} />
        <div className="absolute bottom-10 left-1/3 w-1.5 h-1.5 rounded-full bg-yellow-200/70 animate-ping" style={{ animationDuration: '3.2s', animationDelay: '0.8s' }} />
        <div className="absolute bottom-6 right-1/4 w-2.5 h-2.5 rounded-full bg-amber-400/60 animate-ping" style={{ animationDuration: '2.8s', animationDelay: '1.2s' }} />
        {/* Retro Header & Badge */}
        <div className="absolute top-3 right-4 text-right">
          <div className="text-amber-300 font-serif italic text-xs tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Sparkle Cola
          </div>
          <div className="text-[9px] text-amber-200/80 font-mono">Approved by MoP</div>
        </div>
        <div className="absolute bottom-2 right-4 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-amber-300/40 text-[9px] text-amber-200 font-mono">
          🥕 Carrot Flavour
        </div>
      </div>
    );
  }

  // 8. Pinkie Pie Is Watching You (Министерство Морали)
  if (themeId === 'bg_pinkie_watching') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/pinkie_watching.jpg"
          alt="Pinkie Watching"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        {/* Darkening gradient overlay for crystal-clear text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-neutral-950/60" />
        {/* Surveillance Searchlight Beam scanning */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-72 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_70deg,rgba(244,114,182,0.22)_80deg,rgba(244,114,182,0.22)_100deg,transparent_110deg)] animate-pulse" style={{ animationDuration: '3s' }} />
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.06)_1px,transparent_1px)] bg-[length:100%_8px]" />
        {/* Surveillance Ministry HUD */}
        <div className="absolute top-2 right-4 text-right">
          <div className="text-pink-500 font-black tracking-widest text-xs uppercase font-mono-pip drop-shadow-[0_0_8px_#ec4899]">
            MINISTRY OF MORALE
          </div>
          <div className="text-[9px] text-pink-300 tracking-widest font-mono drop-shadow">
            PINKIE IS WATCHING YOU
          </div>
        </div>
      </div>
    );
  }

  // 9. Ministry of Wartime Technology: Hero Applejack (МВТ)
  if (themeId === 'bg_mowt_hero') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/mowt_hero.jpg"
          alt="MoWT Hero"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-amber-950/50" />
        {/* Drifting warm sparks */}
        <div className="absolute bottom-6 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
        <div className="absolute top-10 right-1/3 w-2 h-2 rounded-full bg-yellow-300 animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3 right-4 text-right">
          <div className="text-amber-400 font-heading font-black text-xs tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            MINISTRY OF WARTIME TECH
          </div>
          <div className="text-[9px] text-amber-200/90 font-mono">
            You Too Can Be A Hero 🤠
          </div>
        </div>
      </div>
    );
  }

  // 10. MoWT Glowing Fiery Halo (Огненный Ореол Военных Технологий)
  if (themeId === 'bg_mowt_halo') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/mowt_halo.jpg"
          alt="MoWT Halo"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/60" />
        {/* Rotating fiery halo circle */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-amber-400/60 shadow-[0_0_30px_#f59e0b] animate-spin" style={{ animationDuration: '20s' }}>
          <div className="w-full h-full rounded-full border border-yellow-300/40 border-dashed animate-pulse" />
        </div>
        <div className="absolute right-14 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-amber-500/25 blur-2xl animate-pulse" />
        {/* Warm Embers */}
        <div className="absolute bottom-4 left-1/3 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
        <div className="absolute top-8 left-1/4 w-2 h-2 rounded-full bg-orange-400 animate-ping" style={{ animationDelay: '0.7s' }} />
      </div>
    );
  }

  // 11. Ministry of Peace: Fluttershy (Изумрудный свет Министерства Мира)
  if (themeId === 'bg_mop_fluttershy') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/mop_fluttershy.jpg"
          alt="MoP Fluttershy"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-emerald-950/40" />
        {/* Emerald Halo Glow */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-52 h-52 rounded-full bg-emerald-500/25 blur-3xl animate-pulse" />
        {/* Fluttering Butterflies */}
        <div className="absolute top-4 right-10 text-yellow-300 text-lg animate-bounce drop-shadow" style={{ animationDuration: '3s' }}>
          🦋
        </div>
        <div className="absolute bottom-6 right-20 text-lime-300 text-sm animate-bounce drop-shadow" style={{ animationDuration: '4.5s', animationDelay: '1s' }}>
          🦋
        </div>
        <div className="absolute top-1/2 right-4 text-emerald-300 text-xs animate-pulse drop-shadow">
          🦋
        </div>
        <div className="absolute top-3 left-4 text-emerald-300 font-heading font-black text-xs tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          MINISTRY OF PEACE
        </div>
      </div>
    );
  }

  // 12. Ministry of Peace Poster (Плакат за мир без войны)
  if (themeId === 'bg_mop_poster') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/mop_poster.jpg"
          alt="MoP Anti-War Poster"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-amber-950/40" />
        {/* Retro sunburst rays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.18)_0%,_transparent_60%)]" />
        <div className="absolute top-2 inset-x-0 text-center">
          <span className="text-[10px] font-black uppercase text-amber-200 tracking-widest bg-red-950/80 px-3 py-0.5 rounded border border-red-500/50 shadow-md">
            War? Fear? Death? We Must Do Better! 🕊️
          </span>
        </div>
      </div>
    );
  }

  // 13. Stable-Tec: Enjoy Stable Life (Стойло 24)
  if (themeId === 'bg_stable_tec') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/stable_tec.jpg"
          alt="Stable-Tec Poster"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-sky-950/40" />
        {/* Rotating Vault Cog Graphic */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-48 h-48 opacity-35 animate-spin-slow">
          <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400 filter drop-shadow-[0_0_8px_#22d3ee]">
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="8 4" />
          </svg>
        </div>
        <div className="absolute top-3 right-4 text-right">
          <div className="text-cyan-300 font-black font-mono-pip text-xs tracking-wider drop-shadow">
            STABLE-TEC // ENJOY LIFE
          </div>
          <div className="text-[8px] text-cyan-200 font-mono">
            Radiation FREE ✓
          </div>
        </div>
      </div>
    );
  }

  // 14. Fallout Equestria Heroes Poster (Герои Эквестрии)
  if (themeId === 'bg_foe_heroes') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/foe_heroes.jpg"
          alt="Fallout Equestria Heroes"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-stone-950/50" />
        {/* CRT Scanline grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.05)_1px,transparent_1px)] bg-[length:100%_10px]" />
        {/* Drifting wasteland dust */}
        <div className="absolute bottom-6 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
        <div className="absolute top-10 right-1/3 w-2 h-2 rounded-full bg-yellow-200 animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-2 right-4 text-amber-400 font-heading font-black text-xs tracking-widest uppercase drop-shadow">
          Fallout Equestria 🛡️
        </div>
      </div>
    );
  }

  // 15. Blizzard Broadcast Tower (Радиовышка в Буране)
  if (themeId === 'bg_blizzard_tower') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/blizzard_tower.jpg"
          alt="Blizzard Radio Tower"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-slate-950/50" />
        {/* Tower spotlight at the top */}
        <div className="absolute top-0 right-1/4 w-32 h-48 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.3)_0%,_transparent_70%)] animate-pulse" />
        {/* Blinking red antenna beacon */}
        <div className="absolute top-4 right-1/3 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-ping" />
        {/* Falling animated blizzard snowflakes */}
        <div className="absolute top-0 left-6 text-white text-xs animate-snow-1">❄</div>
        <div className="absolute top-2 left-1/3 text-sky-200 text-sm animate-snow-2">✦</div>
        <div className="absolute top-0 right-1/4 text-white text-xs animate-snow-3">❄</div>
        <div className="absolute top-1 right-12 text-slate-200 text-xs animate-snow-4">✦</div>
        <div className="absolute bottom-4 left-1/2 text-white text-xs animate-snow-2">❄</div>
        <div className="absolute bottom-2 right-4 text-sky-300 font-mono text-[9px] drop-shadow">
          [DJ PON-3 // HOMAGE FREQUENCY]
        </div>
      </div>
    );
  }

  // 16. Radioactive DNA Helix (Радиоактивная ДНК Биохазард)
  if (themeId === 'bg_rad_dna') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/rad_dna.jpg"
          alt="Rad DNA"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-purple-950/40" />
        {/* Glowing radiation icon in background */}
        <div className="absolute top-4 right-6 text-cyan-400/40 text-6xl filter drop-shadow-[0_0_18px_#22d3ee] animate-pulse">
          ☢
        </div>
        {/* DNA strand helix sparks */}
        <div className="absolute top-12 right-24 w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee] animate-ping" />
        <div className="absolute bottom-8 right-16 w-2.5 h-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_12px_#e879f9] animate-ping" style={{ animationDelay: '0.9s' }} />
        <div className="absolute top-3 left-4 text-[10px] font-mono text-cyan-300 font-bold drop-shadow">
          DNA HELIX MUTATION: DETECTED 🧬
        </div>
      </div>
    );
  }

  // 17. Radioactive Prismatic Glitch (Кибер-Призма Радиации)
  if (themeId === 'bg_rad_glitch') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/rad_glitch.jpg"
          alt="Rad Glitch"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/50" />
        {/* Prismatic rainbow split rays */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-48 h-48 bg-[conic-gradient(from_0deg_at_50%_50%,#ef4444,#eab308,#22c55e,#06b6d4,#8b5cf6,#ef4444)] opacity-25 blur-2xl animate-spin-slow" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:100%_6px]" />
      </div>
    );
  }

  // 18. Bioluminescent Alien Mushroom Forest (Неоновый Грибной Лес)
  if (themeId === 'bg_alien_mushrooms') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/alien_mushrooms.jpg"
          alt="Bioluminescent Mushroom Forest"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-fuchsia-950/40" />
        {/* Glowing spore particles */}
        <div className="absolute top-6 right-10 w-2.5 h-2.5 rounded-full bg-fuchsia-300 shadow-[0_0_14px_#e879f9] animate-ping" style={{ animationDuration: '2.5s' }} />
        <div className="absolute bottom-8 right-24 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_14px_#67e8f9] animate-ping" style={{ animationDuration: '3.2s', animationDelay: '0.7s' }} />
        <div className="absolute top-1/2 right-6 w-2 h-2 rounded-full bg-pink-300 shadow-[0_0_10px_#f472b6] animate-ping" style={{ animationDuration: '2.1s', animationDelay: '1.2s' }} />
        <div className="absolute bottom-2 right-4 text-xs font-mono text-fuchsia-300 drop-shadow">
          🍄 SPORE WASTELAND
        </div>
      </div>
    );
  }

  // 19. Foggy Wasteland Hellhound / Werewolf (Тёмный Охотник в Тумане)
  if (themeId === 'bg_fog_hellhound') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/fog_hellhound.jpg"
          alt="Hellhound in Fog"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-stone-950/50" />
        {/* Fog Layers */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-stone-700/30 via-stone-800/15 to-transparent blur-md animate-pulse" style={{ animationDuration: '5s' }} />
        {/* Predator Glowing Eyes */}
        <div className="absolute bottom-10 right-14 flex items-center gap-1.5">
          <span className="w-2 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_#fef08a] animate-pulse" />
          <span className="w-2 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_#fef08a] animate-pulse" />
        </div>
        <div className="absolute bottom-2 right-4 text-xs font-mono text-amber-200/80 drop-shadow">
          🐺 NIGHT PREDATOR
        </div>
      </div>
    );
  }

  // 20. Crimson Canyon Dead Tree (Багровый Каньон Пустошей)
  if (themeId === 'bg_crimson_canyon') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/crimson_canyon.jpg"
          alt="Crimson Canyon"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-rose-950/40" />
        {/* Mountain ridge silhouettes */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black via-stone-950/70 to-transparent" />
        <div className="absolute top-3 right-4 text-xs font-mono text-rose-300 drop-shadow">
          🏜️ CRIMSON CANYON
        </div>
      </div>
    );
  }

  // 21. Moonlit Forest (Лунный Заповедный Лес)
  if (themeId === 'bg_moonlit_forest') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/moonlit_forest.jpg"
          alt="Moonlit Forest"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-teal-950/40" />
        {/* Twinkling Fireflies */}
        <div className="absolute top-4 left-1/4 text-cyan-200 text-[10px] animate-ping" style={{ animationDuration: '3s' }}>✦</div>
        <div className="absolute top-8 left-1/2 text-cyan-200 text-[8px] animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}>✦</div>
        <div className="absolute top-12 right-28 text-cyan-200 text-[9px] animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>✦</div>
        <div className="absolute top-3 right-4 text-xs font-mono text-cyan-300 drop-shadow">
          🌲 MOONLIT GROVE 🌙
        </div>
      </div>
    );
  }

  // 22. Sunset Peaks Horizon (Закат над Озером Горных Пиков)
  if (themeId === 'bg_sunset_peaks') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/backgrounds/sunset_peaks.jpg"
          alt="Sunset Peaks"
          className="absolute inset-0 w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-orange-950/40" />
        <div className="absolute top-3 right-4 text-xs font-mono text-amber-300 drop-shadow">
          🌅 SUNSET PEAKS // 18:45
        </div>
      </div>
    );
  }

  // 23. Wasteland Art 091C (Арт Пустоши 091C)
  if (themeId === 'bg_wasteland_art_1') {
    return (
      <ProfilePhotoWithEffects
        imageUrl="/backgrounds/img_091c.jpg"
        effect="embers"
        badgeText="ХРОНИКИ ПУСТОШИ // 091C"
      />
    );
  }

  // 24. Wasteland Art 2EAE (Арт Пустоши 2EAE)
  if (themeId === 'bg_wasteland_art_2') {
    return (
      <ProfilePhotoWithEffects
        imageUrl="/backgrounds/img_2eae_564.jpg"
        effect="glitch"
        badgeText="АРХИВЫ ПУСТОШИ // 2EAE"
      />
    );
  }

  return null;
};
