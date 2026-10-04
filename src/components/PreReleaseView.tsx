import React, { useState } from 'react';
import { RPEvent, UserProfile, PreReleasePost } from '../types';
import { ImageUploadInput } from './ImageUploadInput';
import { PaletteColorSelector } from './PaletteColorSelector';
import {
  Crown,
  Lock,
  Sparkles,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Coins,
  Handshake,
  Plus,
  Trash2,
  AlertCircle,
  ExternalLink,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface PreReleaseViewProps {
  currentUser: UserProfile;
  events: RPEvent[];
  profiles: UserProfile[];
  preReleasePosts: PreReleasePost[];
  isAdmin: boolean;
  onBuyVip: () => void;
  onOpenProfile: (profile: UserProfile) => void;
  onCreatePost?: (post: PreReleasePost) => void;
  onDeletePost?: (postId: string) => void;
}

const PRESET_POST_BANNERS = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
];

const TEXT_COLOR_OPTIONS = [
  { label: 'Классический (Янтарный)', value: 'text-amber-300' },
  { label: 'Неоновый Зелёный', value: 'text-emerald-400 drop-shadow-[0_0_8px_#10b981]' },
  { label: 'Квантовый Голубой', value: 'text-cyan-300 drop-shadow-[0_0_8px_#06b6d4]' },
  { label: 'Радужный Розовый', value: 'text-pink-400 drop-shadow-[0_0_8px_#ec4899]' },
  { label: 'Золотой Королевский', value: 'text-yellow-300 drop-shadow-[0_0_8px_#eab308]' },
  { label: 'Белоснежный Чистый', value: 'text-white' }
];

const BG_GRADIENT_OPTIONS = [
  { label: 'Тёмная Пустошь', value: 'from-zinc-950 via-zinc-900 to-zinc-950 border-zinc-800' },
  { label: 'Радиационный Неон', value: 'from-emerald-950/40 via-zinc-950 to-zinc-950 border-emerald-500/40' },
  { label: 'Киберпанк Квант', value: 'from-cyan-950/40 via-zinc-950 to-zinc-950 border-cyan-500/40' },
  { label: 'Пурпурная Бездна', value: 'from-purple-950/40 via-zinc-950 to-zinc-950 border-purple-500/40' },
  { label: 'Королевское Золото', value: 'from-amber-950/40 via-zinc-950 to-yellow-950/30 border-amber-500/40' }
];

export const PreReleaseView: React.FC<PreReleaseViewProps> = ({
  currentUser,
  events,
  profiles,
  preReleasePosts = [],
  isAdmin,
  onBuyVip,
  onOpenProfile,
  onCreatePost,
  onDeletePost
}) => {
  const isOwner = (currentUser?.username || '').toLowerCase() === '@mrwhitepio';
  const isVip = Boolean(currentUser?.hasVip || currentUser?.isInfiniteEquivaxes || isOwner || isAdmin);

  const [activeSubTab, setActiveSubTab] = useState<'events' | 'news'>('events');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // New post form state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postBanner, setPostBanner] = useState(PRESET_POST_BANNERS[0]);
  const [postTextColor, setPostTextColor] = useState(TEXT_COLOR_OPTIONS[0].value);
  const [postBgGradient, setPostBgGradient] = useState(BG_GRADIENT_OPTIONS[0].value);

  // Pre-release events: explicitly marked as isPreRelease or planned in the future
  const preReleaseEvents = events.filter(e => e.isPreRelease);

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    if (onCreatePost) {
      onCreatePost({
        id: 'post_' + Date.now(),
        title: postTitle.trim(),
        content: postContent.trim(),
        bannerUrl: postBanner,
        textColor: postTextColor,
        bgGradient: postBgGradient,
        createdAt: new Date().toISOString(),
        authorUsername: currentUser.username,
        authorDisplayName: currentUser.displayName
      });
    }

    setShowCreateModal(false);
    setPostTitle('');
    setPostContent('');
  };

  // 1. NON-VIP LOCKED SCREEN
  if (!isVip) {
    const vipPrice = 500;
    const canAfford = currentUser.isInfiniteEquivaxes || isOwner || currentUser.equivaxes >= vipPrice;

    return (
      <div className="relative rounded-3xl bg-zinc-950 border border-purple-500/50 p-6 sm:p-10 shadow-2xl overflow-hidden text-center space-y-6 animate-fade-in my-4">
        {/* Background art */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 transform scale-105 pointer-events-none"
          style={{ backgroundImage: `url('/backgrounds/mop_poster.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-purple-950/80 to-zinc-950/95 pointer-events-none" />

        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-amber-500 p-0.5 shadow-xl animate-pulse">
            <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-300" />
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/60 text-purple-300 text-[10px] font-mono-pip font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow">
            <Lock className="w-3.5 h-3.5" />
            <span>ЗАКРЫТАЯ ЗОНА: ПРЕД-РЕЛИЗ ПУСТОШИ</span>
          </span>

          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-wide uppercase text-amber-400">
            Доступно только владельцам VIP-Статуса
          </h2>

          <p className="max-w-md text-xs text-zinc-300 font-mono-pip leading-relaxed">
            В этой закрытой секции сталкеры с VIP-статусом первыми видят тайные анонсы скорых событий, закрытые РП-сессии и посты от разработчиков о будущих патчах и изменениях игры!
          </p>
        </div>

        {/* Perks Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left text-xs font-mono-pip">
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Ранний просмотр
            </div>
            <p className="text-[11px] text-zinc-400">
              Видите все будущие события и ивенты до их официального выхода.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
            <div className="text-purple-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Тизеры и Девлоги
            </div>
            <p className="text-[11px] text-zinc-400">
              Эксклюзивные посты администрации о готовящихся механиках.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Crown className="w-4 h-4" /> Золотой VIP-знак
            </div>
            <p className="text-[11px] text-zinc-400">
              Выделение вашего профиля и статус почётного сталкера.
            </p>
          </div>
        </div>

        {/* Purchase Action */}
        <div className="relative z-10 pt-2 flex flex-col items-center space-y-2">
          <button
            onClick={onBuyVip}
            disabled={!canAfford}
            className={`py-3 px-8 rounded-2xl text-xs font-heading font-black uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-2 ${
              canAfford
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-950/60 active:scale-95'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Crown className="w-4 h-4 text-black" />
            <span>Приобрести VIP-Статус за {vipPrice} ℰQ</span>
          </button>

          <span className="text-[11px] font-mono-pip text-zinc-400">
            Ваш баланс:{' '}
            <strong className="text-amber-300">{(currentUser?.equivaxes || 0).toLocaleString()} ℰQ</strong>
            {!canAfford && (
              <span className="text-rose-400 ml-1.5">(недостаточно Эквиваксов)</span>
            )}
          </span>
        </div>
      </div>
    );
  }

  // 2. VIP GRANTED VIEW
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Exclusive VIP Header */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl border border-purple-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Background art */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 transform scale-105 pointer-events-none"
          style={{ backgroundImage: `url('/backgrounds/mowt_halo.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/95 via-zinc-950/85 to-amber-950/90 pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 text-black text-[9px] font-mono-pip font-extrabold uppercase tracking-wider flex items-center gap-1 shadow">
              <Crown className="w-3 h-3 text-black" />
              <span>VIP ПРИВИЛЕГИЯ АКТИВИРОВАНА</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-wide uppercase text-amber-300">
            Пред-релиз: Будущее Даст Таун Колектив
          </h2>
          <p className="text-xs text-zinc-300 max-w-xl">
            Вы первыми видите готовящиеся события и закрытые заметки разработчиков. Скоро они станут доступны всей Пустоши!
          </p>
        </div>

        {/* Sub-tabs & Create Post button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setActiveSubTab('events')}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase transition flex items-center gap-1.5 ${
                activeSubTab === 'events'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Скоро в игре ({preReleaseEvents.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('news')}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase transition flex items-center gap-1.5 ${
                activeSubTab === 'news'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Тизеры & Новости ({preReleasePosts.length})</span>
            </button>
          </div>

          {isAdmin && activeSubTab === 'news' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-heading font-bold text-xs shadow flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Новый тизер</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: PRE-RELEASE EVENTS (View only, participation locked as requested) */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono-pip text-zinc-400 px-1">
            <span>Будущие анонсы (только предварительный просмотр):</span>
            <span className="text-[10px] text-amber-400">
              💡 Запись откроется во время официального релиза
            </span>
          </div>

          {preReleaseEvents.length === 0 ? (
            <div className="p-10 rounded-3xl bg-zinc-950 border border-dashed border-zinc-800 text-center text-zinc-500 text-xs space-y-2">
              <Eye className="w-8 h-8 text-zinc-600 mx-auto" />
              <p>Сейчас нет событий в статусе пред-релиза.</p>
              <p className="text-[11px] text-zinc-600">
                Администрация скоро выставит сюда эксклюзивные анонсы будущих операций!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preReleaseEvents.map(event => (
                <div
                  key={event.id}
                  className={`rounded-3xl border bg-gradient-to-br p-5 shadow-xl space-y-3 transition hover:border-zinc-600 ${
                    event.bgGradient || 'from-zinc-950 to-zinc-900 border-zinc-800'
                  }`}
                >
                  {/* Banner */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-black/60 border border-zinc-800 shadow-inner">
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="w-full h-full object-cover filter brightness-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      {event.type === 'collab' ? (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-600/90 text-white text-[10px] font-heading font-black uppercase flex items-center gap-1 shadow">
                          <Handshake className="w-3 h-3" /> Коллаборация
                        </span>
                      ) : event.type === 'planned_rp' ? (
                        <span className="px-2.5 py-1 rounded-xl bg-pink-600/90 text-white text-[10px] font-heading font-black uppercase flex items-center gap-1 shadow">
                          <Sparkles className="w-3 h-3" /> РП-Сессия
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/90 text-black text-[10px] font-heading font-black uppercase flex items-center gap-1 shadow">
                          <Flame className="w-3 h-3" /> Ивент
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-xl bg-black/80 border border-purple-500/50 text-purple-300 text-[10px] font-mono-pip font-bold">
                        ПРЕД-РЕЛИЗ
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2.5 text-xs text-amber-300 font-mono-pip font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Старт:{' '}
                        {new Date(event.startTime).toLocaleString('ru-RU', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Title & Lore */}
                  <div>
                    <h3
                      className={`text-lg font-black font-heading leading-tight ${
                        event.textColor || 'text-zinc-100'
                      }`}
                    >
                      {event.title}
                    </h3>

                    {/* Admin Author Line for RP Sessions */}
                    {event.type === 'planned_rp' && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-mono-pip text-purple-300">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <span>
                          Админ: <strong>{event.authorUsername || '@MrWhitePio'}</strong>
                        </span>
                      </div>
                    )}

                    {event.collabClanName && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-mono-pip text-zinc-300">
                        <Handshake className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          Клан-партнёр: <strong className="text-amber-300">{event.collabClanName}</strong>
                        </span>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Meta Bar */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono-pip">
                    <div className="flex items-center gap-1 text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate max-w-[120px]">{event.location}</span>
                    </div>

                    <div className="text-amber-300 font-bold">
                      +{event.rewardEquivaxes} ℰQ
                    </div>
                  </div>

                  {/* Disabled Participation Button (Pre-Release view only) */}
                  <div className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-400 text-xs font-mono-pip flex items-center justify-center gap-2 select-none">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Скоро: Запись откроется в релизе</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: DEV POSTS & TEASERS */}
      {activeSubTab === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono-pip text-zinc-400 px-1">
            <span>Эксклюзивные заметки о разработке и скорых патчах:</span>
            <span>Всего заметок: {preReleasePosts.length}</span>
          </div>

          {preReleasePosts.length === 0 ? (
            <div className="p-10 rounded-3xl bg-zinc-950 border border-dashed border-zinc-800 text-center text-zinc-500 text-xs space-y-2">
              <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
              <p>Пока нет опубликованных постов в пред-релизе.</p>
              {isAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-heading font-bold"
                >
                  Опубликовать первый тизер
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {preReleasePosts.map(post => (
                <div
                  key={post.id}
                  className={`rounded-3xl border bg-gradient-to-br p-5 sm:p-6 shadow-xl space-y-4 transition ${
                    post.bgGradient || 'from-zinc-950 to-zinc-900 border-zinc-800'
                  }`}
                >
                  {/* Banner if present */}
                  {post.bannerUrl && (
                    <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-black/60 border border-zinc-800">
                      <img
                        src={post.bannerUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Post Title & Admin attribution */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3
                        className={`text-lg sm:text-xl font-black font-heading leading-tight ${
                          post.textColor || 'text-amber-300'
                        }`}
                      >
                        {post.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono-pip mt-1">
                        <span className="flex items-center gap-1 text-purple-300 font-bold">
                          <Shield className="w-3 h-3 text-purple-400" />
                          Опубликовал админ: {post.authorUsername}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(post.createdAt).toLocaleString('ru-RU', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                    </div>

                    {isAdmin && onDeletePost && (
                      <div className="shrink-0">
                        {deletingPostId === post.id ? (
                          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-red-950 border border-red-500/80 animate-fade-in">
                            <button
                              onClick={() => {
                                onDeletePost(post.id);
                                setDeletingPostId(null);
                              }}
                              className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-heading font-black uppercase"
                            >
                              Да, удалить
                            </button>
                            <button
                              onClick={() => setDeletingPostId(null)}
                              className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono-pip"
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingPostId(post.id)}
                            className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 transition"
                            title="Удалить тизер"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {post.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW DEV POST MODAL (FOR ADMINS) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-purple-500/60 shadow-2xl p-5 sm:p-7 flex flex-col space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-black font-heading text-purple-300 uppercase tracking-wide">
              Новый пост / тизер в «Пред-релиз»
            </h3>

            <form onSubmit={handleCreatePostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                  Заголовок тизера / новости:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Анонс глобального патча 1.4: Лаборатории Анклава"
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-purple-400 font-heading text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                  Текст поста:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Опишите, какие изменения скоро появятся в игре..."
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Banner with File Upload from Device Gallery */}
              <ImageUploadInput
                label="Баннер новости (загрузите из галереи или вставьте URL):"
                value={postBanner}
                onChange={setPostBanner}
                presets={PRESET_POST_BANNERS}
                helperText="Нажмите «Из галереи», чтобы загрузить своё фото."
              />

              {/* Color Customization (20 styles: 10 standard, 5 shimmering, 5 gradients) */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <label className="block text-xs font-mono-pip text-zinc-300 mb-1 font-bold">
                    Цвет текста тизера (20 стилей):
                  </label>
                  <PaletteColorSelector
                    type="text"
                    selectedValue={postTextColor}
                    onSelect={val => setPostTextColor(val)}
                    sampleText={postTitle || 'Заголовок тизера'}
                  />
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <label className="block text-xs font-mono-pip text-zinc-300 mb-1 font-bold">
                    Фон карточки тизера (20 стилей):
                  </label>
                  <PaletteColorSelector
                    type="bg"
                    selectedValue={postBgGradient}
                    onSelect={val => setPostBgGradient(val)}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-heading font-bold uppercase transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-heading font-black uppercase tracking-wider transition shadow-lg"
                >
                  Опубликовать тизер
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
