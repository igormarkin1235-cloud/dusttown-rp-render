import React, { useState } from 'react';
import { ArtworkPost, UserProfile } from '../types';
import {
  Trophy,
  Sparkles,
  Heart,
  Coins,
  Eye,
  ExternalLink,
  Flame,
  Award,
  Crown,
  Calendar,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

// Reliable Wasteland aesthetic fallback image if any link is broken
export const FALLBACK_ART_IMAGE =
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80';

/**
 * Robust image component that handles ANY aspect ratio (square, portrait 9:16, landscape 16:9, panoramic)
 * with a blurred ambient backdrop so the artwork NEVER clips, distorts or breaks,
 * and recovers gracefully if URL fails to load.
 */
export const ArtSafeImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fitMode?: 'contain-blur' | 'cover';
  onErrorFallback?: string;
}> = ({
  src,
  alt,
  className = '',
  containerClassName = 'h-64 sm:h-72 w-full',
  fitMode = 'contain-blur',
  onErrorFallback = FALLBACK_ART_IMAGE
}) => {
  const [imgSrc, setImgSrc] = useState(src || onErrorFallback);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // If prop changes, reset
  React.useEffect(() => {
    setImgSrc(src || onErrorFallback);
    setHasError(false);
    setIsLoaded(false);
  }, [src, onErrorFallback]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(onErrorFallback);
    }
  };

  if (fitMode === 'cover') {
    return (
      <div className={`relative overflow-hidden bg-black/60 ${containerClassName}`}>
        <img
          src={imgSrc}
          alt={alt}
          onError={handleError}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } ${className}`}
          loading="lazy"
        />
      </div>
    );
  }

  // Default: contain with ambient blurred background
  return (
    <div className={`relative overflow-hidden bg-zinc-950 flex items-center justify-center ${containerClassName}`}>
      {/* Ambient blurred backdrop so any aspect ratio fills the card beautifully */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-md opacity-35 scale-110 pointer-events-none transition-opacity duration-700"
        style={{ backgroundImage: `url(${imgSrc})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />

      {/* Main sharp artwork */}
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
        className={`relative z-10 max-w-full max-h-full object-contain filter drop-shadow-lg transition-all duration-500 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${className}`}
        loading="lazy"
      />
    </div>
  );
};

interface WeeklyArtShowcaseProps {
  artworks: ArtworkPost[];
  currentUser: UserProfile;
  onSelectArt: (art: ArtworkPost) => void;
  onLikeArt: (artId: string, e?: React.MouseEvent) => void;
  onTipArt: (art: ArtworkPost, e?: React.MouseEvent) => void;
}

export const WeeklyArtShowcase: React.FC<WeeklyArtShowcaseProps> = ({
  artworks,
  currentUser,
  onSelectArt,
  onLikeArt,
  onTipArt
}) => {
  // Determine top 3 artworks based on:
  // 1. Publication date (preferred within the last 7 to 14 days)
  // 2. likesCount descending, and then recency descending
  const getWeeklyTopArtworks = (): ArtworkPost[] => {
    if (!artworks || artworks.length === 0) return [];

    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

    // Filter by publication within 7 days
    let pool = artworks.filter(art => {
      const time = new Date(art.createdAt).getTime();
      return !isNaN(time) && now - time <= SEVEN_DAYS_MS;
    });

    // If fewer than 3, expand window to 14 days
    if (pool.length < 3) {
      pool = artworks.filter(art => {
        const time = new Date(art.createdAt).getTime();
        return !isNaN(time) && now - time <= FOURTEEN_DAYS_MS;
      });
    }

    // If still fewer than 3, fallback to all available artworks
    if (pool.length < 3) {
      pool = [...artworks];
    }

    // Sort by likesCount (descending), ties broken by newest createdAt
    const sorted = [...pool].sort((a, b) => {
      if (b.likesCount !== a.likesCount) {
        return b.likesCount - a.likesCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted.slice(0, 3);
  };

  const topThree = getWeeklyTopArtworks();

  if (topThree.length === 0) {
    return null;
  }

  // Visual frame configurations for 1st, 2nd, and 3rd rank
  const getRankFrameConfig = (rankIndex: number) => {
    switch (rankIndex) {
      case 0:
        return {
          rankLabel: '1 МЕСТО',
          crownIcon: <Crown className="w-4 h-4 text-amber-300 animate-bounce" />,
          cardBorder: 'border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.35),inset_0_0_20px_rgba(245,158,11,0.1)]',
          badgeBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black',
          ribbonText: '👑 АРТ НЕДЕЛИ • ТОП-1',
          accentColor: 'text-amber-300',
          glowRing: 'ring-2 ring-amber-400/40',
          pedestalTitle: 'Золотой Куш Пустоши'
        };
      case 1:
        return {
          rankLabel: '2 МЕСТО',
          crownIcon: <Sparkles className="w-4 h-4 text-cyan-300 animate-spin-slow" />,
          cardBorder: 'border-2 border-cyan-400/90 shadow-[0_0_30px_rgba(6,182,212,0.3),inset_0_0_15px_rgba(6,182,212,0.08)]',
          badgeBg: 'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 text-black',
          ribbonText: '🥈 КВАНТОВЫЙ ВЫБОР • ТОП-2',
          accentColor: 'text-cyan-300',
          glowRing: 'ring-2 ring-cyan-400/30',
          pedestalTitle: 'Серебряное Крыло'
        };
      case 2:
      default:
        return {
          rankLabel: '3 МЕСТО',
          crownIcon: <Flame className="w-4 h-4 text-rose-400 animate-pulse" />,
          cardBorder: 'border-2 border-rose-500/90 shadow-[0_0_25px_rgba(244,63,94,0.3),inset_0_0_15px_rgba(244,63,94,0.08)]',
          badgeBg: 'bg-gradient-to-r from-rose-500 via-orange-400 to-amber-500 text-white',
          ribbonText: '🥉 ПЛАМЯ ПУСТОШИ • ТОП-3',
          accentColor: 'text-rose-300',
          glowRing: 'ring-2 ring-rose-500/30',
          pedestalTitle: 'Бронзовый Реактор'
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header of the Showcase */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md">
            <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black font-heading uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <span>★ Витрина: Арты Недели ★</span>
              </h3>
              <span className="text-[10px] font-mono-pip text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 font-black">
                ТОП-3
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Работы, набравшие наибольшее количество лайков за неделю. Премиум-продвижение авторов!
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 text-[10px] font-mono-pip self-start sm:self-auto">
          <Calendar className="w-3 h-3 text-amber-400" />
          <span>Период: последние 7 дней</span>
        </div>
      </div>

      {/* Grid of the 3 Stylized Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {topThree.map((art, index) => {
          const config = getRankFrameConfig(index);
          const isLiked = art.likedByUserIds.includes(currentUser.id);

          return (
            <div
              key={art.id}
              onClick={() => onSelectArt(art)}
              className={`group relative rounded-3xl bg-zinc-950 ${config.cardBorder} ${config.glowRing} overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] flex flex-col justify-between`}
            >
              {/* Top Placement Ribbon Badge */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-heading font-black tracking-wider uppercase shadow-xl flex items-center gap-1.5 ${config.badgeBg}`}
                >
                  {config.crownIcon}
                  <span>{config.ribbonText}</span>
                </span>
              </div>

              {/* View Counter Badge on Top-Right */}
              <div className="absolute top-3 right-3 z-30">
                <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 text-[9px] font-mono-pip text-zinc-300 flex items-center gap-1">
                  <Eye className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{art.viewsCount || 100}</span>
                </span>
              </div>

              {/* Artwork Media Area with Universal Safe Aspect Image */}
              <div className="relative w-full h-64 sm:h-72 overflow-hidden bg-black/80">
                <ArtSafeImage
                  src={art.imageUrl}
                  alt={art.title}
                  containerClassName="w-full h-full"
                  fitMode="contain-blur"
                  className="group-hover:scale-105 transition-transform duration-500"
                />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 pointer-events-none">
                  <div className="px-3 py-1.5 rounded-xl bg-black/80 border border-white/20 text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Развернуть арт</span>
                  </div>
                </div>
              </div>

              {/* Content Card Body */}
              <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between bg-gradient-to-b from-zinc-950/80 to-zinc-900/90 border-t border-white/5">
                <div>
                  {/* Tag list */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    {art.tags.slice(0, 3).map(t => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] font-mono-pip"
                      >
                        #{t}
                      </span>
                    ))}
                    <span className="text-[9px] font-mono-pip text-amber-400/90 ml-auto">
                      {new Date(art.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-base font-bold font-heading text-white group-hover:text-amber-300 transition line-clamp-1">
                    {art.title}
                  </h4>
                  {art.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-snug">
                      {art.description}
                    </p>
                  )}
                </div>

                {/* Artist Promo Box (Promotes the creator) */}
                <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-2 shadow-inner">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        art.artistAvatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                      }
                      alt={art.artistName}
                      className="w-8 h-8 rounded-full object-cover border border-amber-400/60 shadow"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-zinc-200 truncate">
                        {art.artistName}
                      </span>
                      <a
                        href={`https://t.me/${art.artistUsername.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono-pip flex items-center gap-1 truncate"
                        title="Открыть Telegram художника"
                      >
                        <span>{art.artistUsername}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono-pip px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold shrink-0">
                    Автор
                  </span>
                </div>

                {/* Bottom Action Footer: Like button & Tip button */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={e => onLikeArt(art.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono-pip font-bold transition ${
                      isLiked
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 scale-105'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                    <span>{art.likesCount}</span>
                  </button>

                  <button
                    onClick={e => onTipArt(art, e)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-heading font-bold transition shadow"
                    title="Отправить чаевые художнику в ℰQ"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Чаевые ({art.tipsReceived || 0} ℰQ)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
