import React, { useState } from 'react';
import { ArtworkPost, UserProfile } from '../types';
import {
  WeeklyArtShowcase,
  ArtSafeImage,
  FALLBACK_ART_IMAGE
} from './WeeklyArtShowcase';
import {
  Palette,
  Heart,
  Coins,
  Sparkles,
  Trophy,
  ExternalLink,
  Plus,
  Eye,
  Filter,
  Search,
  X,
  Share2,
  CheckCircle2,
  Flame,
  Award,
  Calendar,
  MessageSquare,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  Maximize2,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  Columns,
  Rows,
  Download
} from 'lucide-react';

interface ArtGalleryViewProps {
  artworks: ArtworkPost[];
  currentUser: UserProfile;
  onLikeArtwork: (artId: string) => void;
  onTipArtwork: (artId: string, amount: number) => boolean | Promise<boolean>;
  onAddArtwork: (art: ArtworkPost) => void;
  selectedArtIdToFocus?: string | null;
}

// Preset wasteland templates for quick 1-click selection if the user wants to test
const PRESET_ART_TEMPLATES = [
  {
    name: 'Паладин Стальных Крыльев (Портрет 9:16)',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    tags: ['Персонаж', 'Силовая Броня', 'Фракция']
  },
  {
    name: 'Закат над Пустошью (Широкий 16:9)',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    tags: ['Пейзаж', 'Пустошь', 'Неон']
  },
  {
    name: 'Рейдерский Концепт (Квадрат 1:1)',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    tags: ['Бой', 'Концепт']
  },
  {
    name: 'Квантовая Аномалия (Панорама 21:9)',
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    tags: ['Аномалия', 'Пустошь']
  }
];

export const ArtGalleryView: React.FC<ArtGalleryViewProps> = ({
  artworks,
  currentUser,
  onLikeArtwork,
  onTipArtwork,
  onAddArtwork,
  selectedArtIdToFocus
}) => {
  const [activeTag, setActiveTag] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArtDetail, setActiveArtDetail] = useState<ArtworkPost | null>(() => {
    if (selectedArtIdToFocus) {
      return artworks.find(a => a.id === selectedArtIdToFocus) || null;
    }
    return null;
  });

  const [tippingArt, setTippingArt] = useState<ArtworkPost | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(50);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Feed Layout & Fullscreen View States
  const [feedLayoutMode, setFeedLayoutMode] = useState<'masonry' | 'grid' | 'compact'>('masonry');
  const [fullscreenArt, setFullscreenArt] = useState<ArtworkPost | null>(null);
  const [isFullscreenZoomed, setIsFullscreenZoomed] = useState<boolean>(false);
  const [cardFitModes, setCardFitModes] = useState<Record<string, 'contain' | 'cover'>>({});

  const toggleCardFit = (artId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardFitModes(prev => ({
      ...prev,
      [artId]: prev[artId] === 'cover' ? 'contain' : 'cover'
    }));
  };

  // New Art Form State
  const [uploadSource, setUploadSource] = useState<'file' | 'url' | 'presets'>('file');
  const [newTitle, setNewTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newArtistName, setNewArtistName] = useState(currentUser.displayName || '');
  const [newArtistUsername, setNewArtistUsername] = useState(currentUser.username || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Персонаж']);
  const [newFitMode, setNewFitMode] = useState<'contain' | 'cover'>('contain');
  const [detectedFormatInfo, setDetectedFormatInfo] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Collect all unique tags
  const allTags = ['Все', 'Персонаж', 'Фракция', 'Пейзаж', 'Пустошь', 'Силовая Броня', 'Бой', 'Концепт', 'Скетч'];

  // Top 3 Weekly Artworks are identified for exclusion from the recent list below:
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

  let weeklyCandidates = artworks.filter(art => {
    const time = new Date(art.createdAt).getTime();
    return !isNaN(time) && now - time <= SEVEN_DAYS_MS;
  });
  if (weeklyCandidates.length < 3) {
    weeklyCandidates = artworks.filter(art => {
      const time = new Date(art.createdAt).getTime();
      return !isNaN(time) && now - time <= FOURTEEN_DAYS_MS;
    });
  }
  if (weeklyCandidates.length < 3) {
    weeklyCandidates = [...artworks];
  }

  const topWeeklyArtworks = [...weeklyCandidates]
    .sort((a, b) => {
      if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3);
  const topWeeklyIds = new Set(topWeeklyArtworks.map(a => a.id));

  // Remaining for Recent & Archive
  const remainingArtworks = artworks
    .filter(a => !topWeeklyIds.has(a.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const recentArtworks = remainingArtworks.slice(0, 3);
  const archiveArtworks = remainingArtworks.slice(3);

  // Filter helper
  const filterList = (list: ArtworkPost[]) => {
    return list.filter(art => {
      const matchesTag = activeTag === 'Все' || art.tags.includes(activeTag);
      const matchesSearch =
        searchQuery.trim() === '' ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.artistUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.description && art.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTag && matchesSearch;
    });
  };

  const handleLike = (artId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onLikeArtwork(artId);
  };

  const handleOpenTipModal = (art: ArtworkPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTippingArt(art);
    setTipAmount(50);
  };

  const handleSendTip = async () => {
    if (!tippingArt) return;
    const ok = await onTipArtwork(tippingArt.id, tipAmount);
    if (ok) {
      setSuccessToast(`Вы отправили +${tipAmount} ℰQ художнику ${tippingArt.artistUsername}! 🎨 Спасибо за поддержку!`);
      setTippingArt(null);
      setTimeout(() => setSuccessToast(null), 4000);
    } else {
      alert('Недостаточно Эквиваксов для отправки чаевых.');
    }
  };

  // Safe file reader handling ANY image format (PNG, JPG, WEBP, GIF, SVG, BMP, etc.)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        setIsProcessingFile(false);
        return;
      }

      // Check aspect ratio and dimensions safely
      const img = new Image();
      img.onload = () => {
        const w = img.width;
        const h = img.height;
        let formatDesc = `Квадрат (${w}x${h})`;
        if (h > w * 1.25) {
          formatDesc = `Вертикальный портрет / 9:16 (${w}x${h})`;
        } else if (w > h * 1.3) {
          formatDesc = `Широкоформатный / 16:9 (${w}x${h})`;
        } else {
          formatDesc = `Стандарт (${w}x${h})`;
        }
        setDetectedFormatInfo(formatDesc);

        // If image is reasonable size (<= 4MB) and not ultra-huge, keep original pristine data URL!
        const mime = file.type || 'image/jpeg';
        const isPng = mime.includes('png');
        const maxDim = 3840; // Full 4K support

        if (file.size <= 4 * 1024 * 1024 && w <= maxDim && h <= maxDim) {
          setNewImageUrl(result);
          setIsProcessingFile(false);
          return;
        }

        // Only scale down if extremely massive
        if (w > maxDim || h > maxDim) {
          const scale = Math.min(maxDim / w, maxDim / h);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(w * scale);
          canvas.height = Math.round(h * scale);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const outputMime = isPng ? 'image/png' : 'image/jpeg';
            const safeDataUrl = canvas.toDataURL(outputMime, isPng ? undefined : 0.95);
            setNewImageUrl(safeDataUrl);
            setIsProcessingFile(false);
            return;
          }
        }

        setNewImageUrl(result);
        setIsProcessingFile(false);
      };

      img.onerror = () => {
        setNewImageUrl(result);
        setDetectedFormatInfo('Формат распознан');
        setIsProcessingFile(false);
      };

      img.src = result;
    };

    reader.onerror = () => {
      alert('Ошибка при чтении файла изображения.');
      setIsProcessingFile(false);
    };

    reader.readAsDataURL(file);
  };

  const handleCreateArtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newImageUrl.trim()) {
      alert('Пожалуйста, укажите название и загрузите изображение.');
      return;
    }

    const created: ArtworkPost = {
      id: 'art_' + Date.now(),
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      imageUrl: newImageUrl.trim(),
      artistName: newArtistName.trim() || currentUser.displayName,
      artistUsername: newArtistUsername.trim().startsWith('@') ? newArtistUsername.trim() : `@${newArtistUsername.trim()}`,
      artistAvatarUrl: currentUser.avatarUrl,
      likesCount: 1,
      likedByUserIds: [currentUser.id],
      tipsReceived: 0,
      tags: selectedTags.length > 0 ? selectedTags : ['Персонаж'],
      createdAt: new Date().toISOString(),
      viewsCount: 1
    };

    onAddArtwork(created);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewImageUrl('');
    setNewDescription('');
    setDetectedFormatInfo(null);
    setSuccessToast(`🎉 Арт «${created.title}» успешно опубликован в Ленте!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-heading font-bold">{successToast}</span>
        </div>
      )}

      {/* Hero Banner & Intro */}
      <div className="relative rounded-3xl p-5 sm:p-7 border border-violet-500/40 bg-gradient-to-br from-violet-950/90 via-zinc-950 to-purple-950/80 shadow-2xl overflow-hidden">
        {/* Decorative background ambient glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/60 border border-violet-400/40 text-violet-300 text-[10px] font-mono-pip font-extrabold uppercase tracking-widest shadow">
              <Palette className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>Творчество & Арт-Резиденция Даст Тауна</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-wide uppercase drop-shadow-md">
              Лента Художников Пустоши
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
              Главная галерея сообщества: топ недели, промо авторов, свежие арты сталкеров и возможность поддержать творцов чаевыми в <strong className="text-amber-300">ℰQ</strong>!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 hover:from-violet-400 hover:to-purple-500 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-900/40 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Опубликовать арт</span>
            </button>
          </div>
        </div>

        {/* Community Art Stats bar */}
        <div className="relative z-10 grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10 text-center">
          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
            <div className="text-lg sm:text-xl font-mono-pip font-black text-violet-300">
              {artworks.length}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono-pip uppercase tracking-wider">
              Всего работ
            </div>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
            <div className="text-lg sm:text-xl font-mono-pip font-black text-amber-300 flex items-center justify-center gap-1">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{artworks.reduce((acc, a) => acc + (a.tipsReceived || 0), 0).toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono-pip uppercase tracking-wider">
              Чаевых авторам (ℰQ)
            </div>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
            <div className="text-lg sm:text-xl font-mono-pip font-black text-rose-400 flex items-center justify-center gap-1">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>{artworks.reduce((acc, a) => acc + (a.likesCount || 0), 0)}</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono-pip uppercase tracking-wider">
              Лайков сообщества
            </div>
          </div>
        </div>
      </div>

      {/* Filter, Search, and Layout Mode Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
        {/* Tag pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                activeTag === tag
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Right side: Search + Layout Mode Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Layout Mode Selector (Masonry / Grid / Compact) */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setFeedLayoutMode('masonry')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono-pip flex items-center gap-1.5 transition ${
                feedLayoutMode === 'masonry'
                  ? 'bg-violet-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="В полный размер (без обрезки / Masonry)"
            >
              <Columns className="w-3.5 h-3.5 text-violet-300" />
              <span className="hidden sm:inline">В полный рост</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedLayoutMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono-pip flex items-center gap-1.5 transition ${
                feedLayoutMode === 'grid'
                  ? 'bg-violet-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Классическая сетка"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-violet-300" />
              <span className="hidden sm:inline">Сетка</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedLayoutMode('compact')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono-pip flex items-center gap-1.5 transition ${
                feedLayoutMode === 'compact'
                  ? 'bg-violet-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Компактный вид"
            >
              <Rows className="w-3.5 h-3.5 text-violet-300" />
              <span className="hidden sm:inline">Компактно</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по артам..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. WEEKLY ART SHOWCASE COMPONENT (ТОП-3 АРТА НЕДЕЛИ)     */}
      {/* ======================================================== */}
      {activeTag === 'Все' && !searchQuery && (
        <WeeklyArtShowcase
          artworks={artworks}
          currentUser={currentUser}
          onSelectArt={setActiveArtDetail}
          onLikeArt={handleLike}
          onTipArt={handleOpenTipModal}
        />
      )}

      {/* ======================================================== */}
      {/* 2. RECENT ARTWORKS (НЕДАВНО ОПУБЛИКОВАННЫЕ)              */}
      {/* ======================================================== */}
      {recentArtworks.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-400/40 text-violet-300">
                <Flame className="w-4 h-4 text-violet-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black font-heading uppercase text-white tracking-wider flex items-center gap-2">
                  <span>Недавно Опубликованные</span>
                  <span className="text-[10px] font-mono-pip text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-500/30 font-bold">
                    СВЕЖИЕ РАБОТЫ
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {feedLayoutMode === 'masonry'
                    ? 'Отображение в полный авторский размер без обрезки (Masonry)'
                    : 'Новейшие арты художников Пустоши в высоком качестве'}
                </p>
              </div>
            </div>
          </div>

          {/* Feed Container according to chosen mode */}
          {feedLayoutMode === 'masonry' ? (
            /* Masonry Mode: Natural uncropped full size aspect ratio for every art */
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance] space-y-4">
              {filterList(recentArtworks).map(art => {
                const isLiked = art.likedByUserIds.includes(currentUser.id);

                return (
                  <div
                    key={art.id}
                    onClick={() => setActiveArtDetail(art)}
                    className="break-inside-avoid rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-violet-500/60 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-violet-950/20 flex flex-col group mb-4"
                  >
                    {/* Full uncropped image taking its authentic natural proportions */}
                    <div className="relative w-full overflow-hidden bg-black flex items-center justify-center">
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                        loading="lazy"
                        onError={e => {
                          (e.target as HTMLImageElement).src = FALLBACK_ART_IMAGE;
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[9px] font-mono-pip font-extrabold uppercase tracking-wider shadow">
                        NEW
                      </div>

                      {/* Quick Fullscreen Button on Hover */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setFullscreenArt(art);
                          setIsFullscreenZoomed(false);
                        }}
                        className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition px-2 py-1 rounded-xl bg-black/80 hover:bg-violet-600 border border-white/20 text-white text-[10px] font-mono-pip flex items-center gap-1 shadow-lg backdrop-blur-sm"
                        title="Развернуть на весь экран"
                      >
                        <Maximize2 className="w-3 h-3 text-amber-300" />
                        <span>На весь экран</span>
                      </button>
                    </div>

                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between bg-zinc-950/90 border-t border-zinc-850">
                      <div>
                        <div className="flex items-center gap-1 flex-wrap mb-1">
                          {art.tags.slice(0, 2).map(t => (
                            <span
                              key={t}
                              className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 text-[8px] font-mono-pip"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                        <h4 className="text-sm font-bold font-heading text-white group-hover:text-violet-300 transition line-clamp-1">
                          {art.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-zinc-800 text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-zinc-400 font-mono-pip truncate">
                            {art.artistUsername}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={e => handleLike(art.id, e)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono-pip transition ${
                              isLiked
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-rose-400'
                            }`}
                          >
                            <Heart
                              className={`w-3 h-3 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                            />
                            <span>{art.likesCount}</span>
                          </button>

                          <button
                            onClick={e => handleOpenTipModal(art, e)}
                            className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300"
                            title="Чаевые"
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Grid or Compact Mode */
            <div className={`grid gap-4 ${feedLayoutMode === 'compact' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
              {filterList(recentArtworks).map(art => {
                const isLiked = art.likedByUserIds.includes(currentUser.id);
                const fitMode = cardFitModes[art.id] || 'contain';

                return (
                  <div
                    key={art.id}
                    onClick={() => setActiveArtDetail(art)}
                    className="group rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-violet-500/60 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-950/20 flex flex-col justify-between"
                  >
                    <div className={`relative ${feedLayoutMode === 'compact' ? 'h-44' : 'h-64 sm:h-72'} w-full bg-zinc-950 overflow-hidden`}>
                      <ArtSafeImage
                        src={art.imageUrl}
                        alt={art.title}
                        containerClassName="w-full h-full"
                        fitMode={fitMode === 'cover' ? 'cover' : 'contain-blur'}
                        className="group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[9px] font-mono-pip font-extrabold uppercase tracking-wider shadow">
                        NEW
                      </div>

                      {/* Top Action overlay: toggle fit & expand */}
                      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                        <button
                          type="button"
                          onClick={e => toggleCardFit(art.id, e)}
                          className="px-2 py-0.5 rounded-lg bg-black/80 hover:bg-zinc-800 border border-white/20 text-[9px] font-mono-pip text-zinc-300"
                          title="Переключить режим заполнения"
                        >
                          {fitMode === 'cover' ? 'Целиком' : 'Заполнить'}
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setFullscreenArt(art);
                            setIsFullscreenZoomed(false);
                          }}
                          className="p-1 rounded-lg bg-black/80 hover:bg-violet-600 border border-white/20 text-white"
                          title="На весь экран"
                        >
                          <Maximize2 className="w-3 h-3 text-amber-300" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1 flex-wrap mb-1">
                          {art.tags.slice(0, 2).map(t => (
                            <span
                              key={t}
                              className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 text-[8px] font-mono-pip"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                        <h4 className="text-sm font-bold font-heading text-white group-hover:text-violet-300 transition line-clamp-1">
                          {art.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-zinc-800 text-[11px]">
                        <span className="text-zinc-400 font-mono-pip truncate">
                          {art.artistUsername}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={e => handleLike(art.id, e)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono-pip transition ${
                              isLiked
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-rose-400'
                            }`}
                          >
                            <Heart
                              className={`w-3 h-3 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                            />
                            <span>{art.likesCount}</span>
                          </button>

                          <button
                            onClick={e => handleOpenTipModal(art, e)}
                            className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300"
                            title="Чаевые"
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ARCHIVE / ALL OTHER ARTWORKS (АРХИВ РАБОТ)             */}
      {/* ======================================================== */}
      {archiveArtworks.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
            <h3 className="text-sm sm:text-base font-black font-heading uppercase text-zinc-300 tracking-wider flex items-center gap-2">
              <span>Архив Работ Сообщества</span>
              <span className="text-[10px] font-mono-pip text-zinc-500">
                ({filterList(archiveArtworks).length})
              </span>
            </h3>
          </div>

          {feedLayoutMode === 'masonry' ? (
            <div className="columns-2 sm:columns-3 md:columns-4 gap-3.5 [column-fill:_balance] space-y-3.5">
              {filterList(archiveArtworks).map(art => {
                const isLiked = art.likedByUserIds.includes(currentUser.id);

                return (
                  <div
                    key={art.id}
                    onClick={() => setActiveArtDetail(art)}
                    className="break-inside-avoid rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 overflow-hidden cursor-pointer transition flex flex-col mb-3.5 group"
                  >
                    <div className="relative w-full overflow-hidden bg-black flex items-center justify-center">
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                        loading="lazy"
                        onError={e => {
                          (e.target as HTMLImageElement).src = FALLBACK_ART_IMAGE;
                        }}
                      />
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setFullscreenArt(art);
                          setIsFullscreenZoomed(false);
                        }}
                        className="absolute bottom-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition p-1 rounded-lg bg-black/80 hover:bg-violet-600 border border-white/20 text-white"
                        title="На весь экран"
                      >
                        <Maximize2 className="w-3 h-3 text-amber-300" />
                      </button>
                    </div>

                    <div className="p-2.5 space-y-1.5">
                      <h5 className="text-xs font-bold font-heading text-white line-clamp-1 group-hover:text-amber-300 transition">
                        {art.title}
                      </h5>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
                        <span className="truncate">{art.artistName}</span>
                        <div className="flex items-center gap-1 font-mono-pip shrink-0">
                          <Heart
                            className={`w-2.5 h-2.5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-zinc-500'}`}
                          />
                          <span>{art.likesCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filterList(archiveArtworks).map(art => {
                const isLiked = art.likedByUserIds.includes(currentUser.id);

                return (
                  <div
                    key={art.id}
                    onClick={() => setActiveArtDetail(art)}
                    className="group rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 overflow-hidden cursor-pointer transition flex flex-col justify-between"
                  >
                    <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
                      <ArtSafeImage
                        src={art.imageUrl}
                        alt={art.title}
                        containerClassName="w-full h-full"
                        fitMode="contain-blur"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setFullscreenArt(art);
                          setIsFullscreenZoomed(false);
                        }}
                        className="absolute bottom-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition p-1 rounded-lg bg-black/80 hover:bg-violet-600 border border-white/20 text-white"
                        title="На весь экран"
                      >
                        <Maximize2 className="w-3 h-3 text-amber-300" />
                      </button>
                    </div>

                    <div className="p-2.5 space-y-1.5">
                      <h5 className="text-xs font-bold font-heading text-white line-clamp-1 group-hover:text-amber-300 transition">
                        {art.title}
                      </h5>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
                        <span className="truncate">{art.artistName}</span>
                        <div className="flex items-center gap-1 font-mono-pip shrink-0">
                          <Heart
                            className={`w-2.5 h-2.5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-zinc-500'}`}
                          />
                          <span>{art.likesCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FULL ARTWORK DETAIL VIEW (LIGHTBOX)               */}
      {/* ======================================================== */}
      {activeArtDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Close Button */}
            <button
              onClick={() => setActiveArtDetail(null)}
              className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Artwork Big Photo with Safe Fit for any aspect ratio */}
            <div
              onClick={() => {
                setFullscreenArt(activeArtDetail);
                setIsFullscreenZoomed(false);
              }}
              className="relative w-full bg-black flex items-center justify-center min-h-[320px] max-h-[62vh] overflow-hidden group cursor-zoom-in"
              title="Нажмите, чтобы открыть на весь экран (100% зум)"
            >
              <ArtSafeImage
                src={activeArtDetail.imageUrl}
                alt={activeArtDetail.title}
                containerClassName="w-full h-full min-h-[320px] max-h-[62vh]"
                fitMode="contain-blur"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenArt(activeArtDetail);
                  setIsFullscreenZoomed(false);
                }}
                className="absolute bottom-3 right-3 z-30 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-violet-600 text-white border border-white/20 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xl transition backdrop-blur-sm"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                <span>На весь экран (100% зум)</span>
              </button>
            </div>

            {/* Detail Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {activeArtDetail.tags.map(t => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-violet-300 text-[10px] font-mono-pip"
                      >
                        #{t}
                      </span>
                    ))}
                    {activeArtDetail.promoBadge && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-heading font-black">
                        {activeArtDetail.promoBadge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-heading text-white">
                    {activeArtDetail.title}
                  </h3>
                </div>

                {/* Quick Interactive Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(activeArtDetail.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-mono-pip font-bold transition ${
                      activeArtDetail.likedByUserIds.includes(currentUser.id)
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-rose-400'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        activeArtDetail.likedByUserIds.includes(currentUser.id)
                          ? 'fill-rose-500 text-rose-500'
                          : ''
                      }`}
                    />
                    <span>{activeArtDetail.likesCount} Лайков</span>
                  </button>

                  <button
                    onClick={() => handleOpenTipModal(activeArtDetail)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-heading font-black uppercase tracking-wider transition shadow-lg"
                  >
                    <Coins className="w-4 h-4 text-black" />
                    <span>Отправить чаевые</span>
                  </button>
                </div>
              </div>

              {activeArtDetail.description && (
                <div className="space-y-1">
                  <span className="text-xs font-heading font-bold text-zinc-400 uppercase tracking-wider">
                    Описание работы:
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
                    {activeArtDetail.description}
                  </p>
                </div>
              )}

              {/* Artist Showcase Box */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      activeArtDetail.artistAvatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={activeArtDetail.artistName}
                    className="w-12 h-12 rounded-2xl object-cover border border-amber-400/50 shadow"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-heading">
                        {activeArtDetail.artistName}
                      </span>
                      <span className="text-[9px] font-mono-pip px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        Автор арта
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono-pip mt-0.5">
                      Собрано чаевых за арт:{' '}
                      <strong className="text-amber-400">
                        {activeArtDetail.tipsReceived || 0} ℰQ
                      </strong>
                    </p>
                  </div>
                </div>

                <a
                  href={`https://t.me/${activeArtDetail.artistUsername.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition shadow"
                >
                  <span>{activeArtDetail.artistUsername}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TIP ARTIST (ОТПРАВКА ЧАЕВЫХ ХУДОЖНИКУ)            */}
      {/* ======================================================== */}
      {tippingArt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-950 border-2 border-amber-500/80 shadow-2xl p-6 space-y-4">
            <button
              onClick={() => setTippingArt(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300 mb-1">
                <Coins className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
              <h3 className="text-lg font-black font-heading uppercase text-white">
                Поддержать Художника
              </h3>
              <p className="text-xs text-zinc-400">
                Отправьте эквиваксы автору <strong className="text-amber-300">{tippingArt.artistUsername}</strong> за работу «{tippingArt.title}».
              </p>
            </div>

            {/* Quick Amount Options */}
            <div className="space-y-2">
              <label className="text-[11px] font-heading font-bold text-zinc-400 uppercase tracking-wider block">
                Выберите сумму чаевых (ℰQ):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 250].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTipAmount(amount)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition border ${
                      tipAmount === amount
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black scale-105'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    +{amount} ℰQ
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Ваш текущий баланс:</span>
              <span className="font-mono font-bold text-amber-300">
                {currentUser.isInfiniteEquivaxes ? '∞' : currentUser.equivaxes.toLocaleString()} ℰQ
              </span>
            </div>

            <button
              onClick={handleSendTip}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-950/50 transition active:scale-98"
            >
              Отправить +{tipAmount} ℰQ Художнику
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD NEW ARTWORK (ОПУБЛИКОВАТЬ АРТ С ЛЮБЫМ ФОРМАТОМ) */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-violet-500/60 shadow-2xl p-6 space-y-4 my-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-900/60 border border-violet-400/40 text-violet-300 text-[10px] font-mono-pip font-extrabold uppercase">
                <Palette className="w-3.5 h-3.5 text-violet-400" />
                <span>Публикация в Галерею</span>
              </div>
              <h3 className="text-xl font-black font-heading uppercase text-white">
                Добавить работу в Арт-Ленту
              </h3>
              <p className="text-xs text-zinc-400">
                Поддерживаются любые форматы (портрет 9:16, широкоформатный 16:9, квадрат, скетчи) — картинка отобразится идеально без искажений!
              </p>
            </div>

            {/* Source switch: File from device vs URL vs Templates */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setUploadSource('file')}
                className={`py-1.5 px-2 rounded-xl text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 ${
                  uploadSource === 'file'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>С устройства</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadSource('url')}
                className={`py-1.5 px-2 rounded-xl text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 ${
                  uploadSource === 'url'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>По ссылке</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadSource('presets')}
                className={`py-1.5 px-2 rounded-xl text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 ${
                  uploadSource === 'presets'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Шаблоны</span>
              </button>
            </div>

            <form onSubmit={handleCreateArtSubmit} className="space-y-3.5">
              {/* Image Input Area based on selected source */}
              {uploadSource === 'file' && (
                <div>
                  <label className="text-xs font-heading font-bold text-zinc-300 uppercase block mb-1">
                    Загрузить файл изображения (любой формат) *
                  </label>
                  <label className="relative border-2 border-dashed border-violet-500/40 hover:border-violet-400 bg-zinc-900/60 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="w-7 h-7 text-violet-400 group-hover:scale-110 transition mb-2" />
                    <span className="text-xs font-heading font-bold text-zinc-200">
                      {isProcessingFile ? 'Обработка файла...' : 'Нажмите для выбора файла с устройства'}
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-0.5">
                      PNG, JPG, WEBP, GIF, SVG • любой размер и соотношение сторон
                    </span>
                  </label>
                </div>
              )}

              {uploadSource === 'url' && (
                <div>
                  <label className="text-xs font-heading font-bold text-zinc-300 uppercase block mb-1">
                    Ссылка на изображение (URL) *
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... или ссылка на арт"
                    value={newImageUrl}
                    onChange={e => {
                      setNewImageUrl(e.target.value);
                      setDetectedFormatInfo(e.target.value ? 'По внешней ссылке' : null);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              {uploadSource === 'presets' && (
                <div className="space-y-2">
                  <label className="text-xs font-heading font-bold text-zinc-300 uppercase block">
                    Выберите тестовый атмосферный шаблон:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_ART_TEMPLATES.map((tpl, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => {
                          setNewImageUrl(tpl.url);
                          setDetectedFormatInfo(tpl.name);
                          setSelectedTags(tpl.tags);
                        }}
                        className={`p-2 rounded-xl text-left border transition text-xs flex items-center justify-between ${
                          newImageUrl === tpl.url
                            ? 'bg-violet-950/80 border-violet-400 text-violet-200 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                        }`}
                      >
                        <span className="truncate">{tpl.name}</span>
                        {newImageUrl === tpl.url && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Safe live preview of the image */}
              {newImageUrl && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-heading font-bold text-zinc-400 uppercase">
                      Предпросмотр отображения:
                    </span>
                    {detectedFormatInfo && (
                      <span className="text-[10px] font-mono-pip text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                        ✓ {detectedFormatInfo}
                      </span>
                    )}
                  </div>
                  <div className="h-44 w-full rounded-2xl overflow-hidden border border-violet-500/40 bg-zinc-950">
                    <ArtSafeImage
                      src={newImageUrl}
                      alt="Превью"
                      containerClassName="w-full h-full"
                      fitMode="contain-blur"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-heading font-bold text-zinc-300 uppercase block mb-1">
                  Название работы *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Паладин у ворот Цитадели"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-bold text-zinc-300 uppercase block mb-1">
                    Псевдоним автора
                  </label>
                  <input
                    type="text"
                    value={newArtistName}
                    onChange={e => setNewArtistName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-bold text-zinc-300 uppercase block mb-1">
                    Telegram @username
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={newArtistUsername}
                    onChange={e => setNewArtistUsername(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-heading font-bold text-zinc-300 uppercase block mb-1">
                  Описание или лор арта
                </label>
                <textarea
                  rows={2}
                  placeholder="Краткая история создания, лор персонажа или события..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-heading font-bold text-zinc-300 uppercase block mb-1.5">
                  Теги:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.filter(t => t !== 'Все').map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                        selectedTags.includes(tag)
                          ? 'bg-violet-600 text-white font-bold'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!newImageUrl || !newTitle.trim()}
                  className={`w-full py-3 rounded-2xl font-heading font-black text-xs uppercase tracking-wider shadow-xl transition ${
                    !newImageUrl || !newTitle.trim()
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 hover:from-violet-400 hover:to-purple-500 text-white cursor-pointer active:scale-98 shadow-violet-950/50'
                  }`}
                >
                  ✓ Опубликовать работу в Арт-Ленту
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DEDICATED FULLSCREEN LIGHTBOX & ULTRA-ZOOM VIEWER  */}
      {/* ======================================================== */}
      {fullscreenArt && (
        <div
          onClick={() => {
            setFullscreenArt(null);
            setIsFullscreenZoomed(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-6xl w-full max-h-[96vh] rounded-3xl overflow-hidden border border-violet-500/50 bg-zinc-950 shadow-2xl flex flex-col"
          >
            {/* Top Toolbar */}
            <div className="p-3.5 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 z-20">
              <div className="flex items-center gap-2 min-w-0">
                <Palette className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="text-sm font-bold font-heading text-zinc-100 truncate">
                  {fullscreenArt.title}
                </span>
                <span className="text-[10px] font-mono-pip text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded-full border border-violet-500/40">
                  {isFullscreenZoomed ? '100% масштаб (1:1)' : 'По экрану (Fit)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsFullscreenZoomed(!isFullscreenZoomed)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono-pip transition border border-zinc-700"
                  title="Переключить масштаб (По размеру экрана / 100% оригинал)"
                >
                  {isFullscreenZoomed ? <ZoomOut className="w-3.5 h-3.5 text-violet-400" /> : <ZoomIn className="w-3.5 h-3.5 text-violet-400" />}
                  <span>{isFullscreenZoomed ? 'По экрану' : '100% зум'}</span>
                </button>

                <a
                  href={fullscreenArt.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono-pip transition border border-zinc-700"
                  title="Открыть исходный файл в новой вкладке"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Исходник</span>
                </a>

                <button
                  type="button"
                  onClick={e => handleLike(fullscreenArt.id, e)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono-pip transition ${
                    fullscreenArt.likedByUserIds.includes(currentUser.id)
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-rose-400'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${fullscreenArt.likedByUserIds.includes(currentUser.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{fullscreenArt.likesCount}</span>
                </button>

                <button
                  type="button"
                  onClick={e => handleOpenTipModal(fullscreenArt, e)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-heading font-black uppercase transition shadow active:scale-95"
                >
                  <Coins className="w-3.5 h-3.5 text-black" />
                  <span>Чаевые</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFullscreenArt(null);
                    setIsFullscreenZoomed(false);
                  }}
                  className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="p-2 sm:p-4 flex-1 flex items-center justify-center bg-black overflow-auto max-h-[86vh]">
              <img
                src={fullscreenArt.imageUrl}
                alt={fullscreenArt.title}
                className={`${
                  isFullscreenZoomed
                    ? 'w-auto max-w-none cursor-zoom-out'
                    : 'max-h-[82vh] w-auto max-w-full object-contain cursor-zoom-in'
                } rounded-xl transition-all duration-300 shadow-2xl`}
                onClick={() => setIsFullscreenZoomed(!isFullscreenZoomed)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
