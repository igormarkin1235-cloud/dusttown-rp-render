import React from 'react';

export type ProfileEffectType =
  | 'none'
  | 'embers'
  | 'radiation'
  | 'glitch'
  | 'dust'
  | 'cyber'
  | 'vignette';

export interface ProfileEffectOption {
  id: ProfileEffectType;
  name: string;
  desc: string;
  icon: string;
  badge: string;
  color: string;
}

export const PROFILE_EFFECT_OPTIONS: ProfileEffectOption[] = [
  {
    id: 'embers',
    name: 'Пепел и Искры Пустоши 🔥',
    desc: 'Тлеющие угли, огненные всполохи и взмывающие ввысь раскаленные частицы',
    icon: '🔥',
    badge: 'ОГОНЬ',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300'
  },
  {
    id: 'radiation',
    name: 'Радиационный Разлом ☢️',
    desc: 'Токсичный изумрудный туман, радиоактивная рябь и частицы распада',
    icon: '☢️',
    badge: 'ТОКСИН',
    color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/40 text-emerald-300'
  },
  {
    id: 'glitch',
    name: 'Кибер-помехи & CRT ⚡',
    desc: 'Терминальные полосы ЭВМ, глитч-хроматика и бегущий луч развёртки',
    icon: '⚡',
    badge: 'ГЛИТЧ',
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300'
  },
  {
    id: 'dust',
    name: 'Песчаная Буря Даст-Тауна 🌪️',
    desc: 'Летящие песчинки, сепия-ветер пустоши и атмосфера пыльного фронтира',
    icon: '🌪️',
    badge: 'БУРЯ',
    color: 'from-yellow-600/20 to-amber-700/10 border-yellow-600/40 text-yellow-300'
  },
  {
    id: 'cyber',
    name: 'Неоновый Пульс 🔮',
    desc: 'Синтвейв переливы фиолетового и бирюзового, киберпанк-подсветка',
    icon: '🔮',
    badge: 'НЕОН',
    color: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-300'
  },
  {
    id: 'vignette',
    name: 'Кинематографический Нуар 🎞️',
    desc: 'Глубокая драматичная виньетка, лунный свет и кинематографический контраст',
    icon: '🎞️',
    badge: 'НУАР',
    color: 'from-zinc-400/20 to-zinc-600/10 border-zinc-500/40 text-zinc-200'
  },
  {
    id: 'none',
    name: 'Оригинал (без эффектов) 🖼️',
    desc: 'Чистое отображение изображения с защитным затемнением для текста',
    icon: '🖼️',
    badge: 'ЧИСТЫЙ',
    color: 'from-zinc-700/20 to-zinc-800/10 border-zinc-700/40 text-zinc-300'
  }
];

interface ProfilePhotoWithEffectsProps {
  imageUrl: string;
  effect?: ProfileEffectType;
  position?: 'center' | 'top' | 'bottom';
  badgeText?: string;
  alt?: string;
  className?: string;
}

export const ProfilePhotoWithEffects: React.FC<ProfilePhotoWithEffectsProps> = ({
  imageUrl,
  effect = 'none',
  position = 'center',
  badgeText,
  alt = 'Profile Background',
  className = ''
}) => {
  const posClass =
    position === 'top'
      ? 'object-top'
      : position === 'bottom'
      ? 'object-bottom'
      : 'object-center';

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0 select-none ${className}`}
    >
      {/* 1. Underlying Image with adjustable focal position */}
      <img
        src={imageUrl}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover ${posClass} select-none transition-transform duration-700`}
        referrerPolicy="no-referrer"
        onError={e => {
          (e.target as HTMLImageElement).src =
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80';
        }}
      />

      {/* 2. Core Readable Gradient (prevents bright photos from making profile text illegible) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/30" />

      {/* 3. Deep Perimeter Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_90px_rgba(0,0,0,0.85)]" />

      {/* 4. EFFECT: Embers & Fire */}
      {effect === 'embers' && (
        <>
          {/* Bottom warm glow */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-amber-950/60 via-orange-950/25 to-transparent mix-blend-screen" />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[radial-gradient(ellipse_at_bottom,_rgba(245,158,11,0.25)_0%,_transparent_70%)] animate-pulse" />

          {/* Animated Ember particles drifting upwards */}
          <div className="absolute bottom-6 left-[15%] w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-ember-1" />
          <div className="absolute bottom-3 left-[30%] w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_10px_#ea580c] animate-ember-2" />
          <div className="absolute bottom-8 left-[50%] w-1 h-1 rounded-full bg-yellow-300 shadow-[0_0_6px_#fde047] animate-ember-3" />
          <div className="absolute bottom-4 left-[68%] w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_10px_#f59e0b] animate-ember-4" />
          <div className="absolute bottom-10 left-[82%] w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#ef4444] animate-ember-5" />
          <div className="absolute bottom-2 left-[42%] w-1 h-1 rounded-full bg-orange-300 animate-ping" />
        </>
      )}

      {/* 5. EFFECT: Radiation Toxic Fog */}
      {effect === 'radiation' && (
        <>
          {/* Toxic green ambient haze */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/40 via-green-950/20 to-emerald-900/15 mix-blend-color-dodge" />
          <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.22)_0%,_transparent_70%)] animate-toxic-vapor" />

          {/* Hazmat scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.07)_1px,transparent_1px)] bg-[length:100%_6px]" />

          {/* Glowing isotope spots */}
          <div className="absolute top-12 left-10 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981] animate-ping" />
          <div className="absolute bottom-16 right-16 w-2.5 h-2.5 rounded-full bg-lime-400 shadow-[0_0_15px_#a3e635] animate-pulse" />
          <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#34d399] animate-ember-2" />
        </>
      )}

      {/* 6. EFFECT: Cyber Glitch & CRT */}
      {effect === 'glitch' && (
        <>
          {/* CRT scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.12)_1px,transparent_1px)] bg-[length:100%_4px] mix-blend-screen pointer-events-none" />

          {/* Rolling scanline bar */}
          <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-crt-scan pointer-events-none" />

          {/* Chromatic edge pulse */}
          <div className="absolute inset-0 border border-cyan-500/20 shadow-[inset_0_0_30px_rgba(6,182,212,0.15)]" />

          {/* Corner tech reticle markers */}
          <div className="absolute top-3 left-3 text-[10px] font-mono-pip text-cyan-400/80 drop-shadow">
            [SYS // CRT-44]
          </div>
          <div className="absolute bottom-3 right-4 text-[9px] font-mono-pip text-cyan-300/70">
            FREQ: 59.94Hz • V-SYNC: ACTIVE
          </div>
        </>
      )}

      {/* 7. EFFECT: Dust Storm */}
      {effect === 'dust' && (
        <>
          {/* Sepia storm wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-yellow-950/20 to-stone-900/30 mix-blend-overlay" />
          <div className="absolute -inset-10 bg-[radial-gradient(circle_at_top_right,_rgba(217,119,6,0.2)_0%,_transparent_60%)]" />

          {/* Drifting sand grains */}
          <div className="absolute top-10 left-10 w-1.5 h-1.5 rounded-full bg-amber-300/80 shadow-[0_0_4px_#fde047] animate-dust-1" />
          <div className="absolute top-24 left-1/3 w-2 h-1 rounded-full bg-yellow-400/70 shadow-[0_0_5px_#eab308] animate-dust-2" />
          <div className="absolute top-1/2 left-2/3 w-1.5 h-1.5 rounded-full bg-amber-200/90 shadow-[0_0_6px_#fef08a] animate-dust-3" />
        </>
      )}

      {/* 8. EFFECT: Cyber Neon Pulse */}
      {effect === 'cyber' && (
        <>
          {/* Synthwave violet & cyan glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/40 via-transparent to-cyan-950/30 mix-blend-color-dodge animate-neon-glow-flow" />
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-purple-600/15 blur-3xl animate-pulse" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl animate-pulse" />

          {/* Accent laser streak */}
          <div className="absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
        </>
      )}

      {/* 9. EFFECT: Cinematic Noir */}
      {effect === 'vignette' && (
        <>
          {/* Extra deep dramatic vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.95)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-transparent to-black/90" />
          {/* Moonlit spotlight beam */}
          <div className="absolute -top-20 left-1/3 w-72 h-80 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.07)_0%,_transparent_60%)] rotate-12" />
        </>
      )}

      {/* Optional Top Badge / Status */}
      {badgeText && (
        <div className="absolute top-3.5 right-4 z-10">
          <div className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono-pip text-zinc-300 drop-shadow flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>{badgeText}</span>
          </div>
        </div>
      )}
    </div>
  );
};
