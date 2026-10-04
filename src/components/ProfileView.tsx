import React, { useState } from 'react';
import { UserProfile, Award, CharacterSheet, InventoryItem, getItemPawnPrice, Achievement, RPEvent, ArtworkPost } from '../types';
import { AvatarWithFrame } from './AvatarWithFrame';
import { ProfileAnimatedTheme } from './ProfileAnimatedTheme';
import { ImageUploadInput } from './ImageUploadInput';
import { TransactionHistory } from './TransactionHistory';
import { AchievementsList } from './AchievementsList';
import { PaletteColorSelector } from './PaletteColorSelector';
import { ProfilePinnedArtsShowcase } from './ProfilePinnedArtsShowcase';
import { PROFILE_EFFECT_OPTIONS } from './ProfilePhotoWithEffects';
import {
  PRESET_PROFILE_THEMES,
  PRESET_AVATAR_FRAMES,
  isThemeUnlocked,
  isFrameUnlocked,
  isTextColorUnlocked,
  isTextBgUnlocked
} from '../services/palette';
import { PRESET_CARD_FRAMES, PlayerCardFrame } from './PlayerCardFrame';
import {
  Coins,
  Award as AwardIcon,
  Sparkles,
  Calendar,
  Edit3,
  Check,
  Package,
  ExternalLink,
  Shield,
  Palette,
  Radio,
  Sliders,
  Layers,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  History,
  Receipt,
  Trophy,
  Lock,
  Flame,
  Maximize2,
  Image as ImageIcon,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { syncTelegramAvatar } from '../services/storage';

interface ProfileViewProps {
  currentUser: UserProfile;
  awards: Award[];
  characters: CharacterSheet[];
  achievements?: Achievement[];
  events?: RPEvent[];
  artworks?: ArtworkPost[];
  onUpdateProfile: (updated: UserProfile) => void;
  onSelectCharacter: (char: CharacterSheet) => void;
  onOpenCases: () => void;
  onOpenFactions?: () => void;
  onSellItemToPawnshop: (itemId: string, payout: number) => void;
  onOpenLotteryTicket?: (item: InventoryItem) => void;
  onClaimAchievementReward?: (ach: Achievement) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  awards,
  characters,
  achievements = [],
  events = [],
  artworks = [],
  onUpdateProfile,
  onSelectCharacter,
  onOpenCases,
  onOpenFactions,
  onSellItemToPawnshop,
  onOpenLotteryTicket,
  onClaimAchievementReward
}) => {
  const isOwner = currentUser.username.toLowerCase() === '@mrwhitepio' || currentUser.id === 'owner_mrwhitepio';
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'customization' | 'characters' | 'awards' | 'transactions' | 'achievements'>('inventory');
  const [customizationCategory, setCustomizationCategory] = useState<'themes' | 'frames' | 'card_frames' | 'text' | 'bg'>('themes');

  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [avatarFitMode, setAvatarFitMode] = useState<'cover' | 'contain'>(currentUser.avatarFitMode || 'cover');
  const [avatarZoom, setAvatarZoom] = useState<number>(currentUser.avatarZoom || 1);
  const [avatarOffsetY, setAvatarOffsetY] = useState<number>(currentUser.avatarOffsetY || 0);
  const [avatarOffsetX, setAvatarOffsetX] = useState<number>(currentUser.avatarOffsetX || 0);

  // In-app reliable selling confirmation (avoids window.confirm iframe blockers)
  const [confirmSellId, setConfirmSellId] = useState<string | null>(null);
  const [soldToast, setSoldToast] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isSyncingTgAvatar, setIsSyncingTgAvatar] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncTelegramAvatar = async () => {
    setIsSyncingTgAvatar(true);
    setSyncMessage(null);
    try {
      const tgUserId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const res = await syncTelegramAvatar(currentUser.id, tgUserId);
      if (res.success && res.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        onUpdateProfile({
          ...currentUser,
          avatarUrl: res.avatarUrl
        });
        setSyncMessage('✅ Аватарка успешно обновлена из Telegram!');
      } else {
        setSyncMessage(res.message || '⚠️ Не удалось получить фото из Telegram: убедитесь, что в Telegram установлена публичная фотография профиля.');
      }
    } catch (e: any) {
      setSyncMessage('❌ Ошибка синхронизации фото');
    } finally {
      setIsSyncingTgAvatar(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const userAwards = awards.filter(
    a => a.recipientUsername.toLowerCase() === currentUser.username.toLowerCase()
  );
  const userCharacters = characters.filter(
    c => c.creatorTelegram.toLowerCase() === currentUser.username.toLowerCase()
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...currentUser,
      displayName,
      username: username.startsWith('@') ? username : `@${username}`,
      bio,
      avatarUrl,
      avatarFitMode,
      avatarZoom,
      avatarOffsetY,
      avatarOffsetX
    });
    setSaveToast('Изменения профиля успешно сохранены!');
    setTimeout(() => setSaveToast(null), 3000);
    setIsEditing(false);
  };

  const handleApplyCosmetic = (item: InventoryItem) => {
    if (item.type === 'profile_theme') {
      const val = item.appliedValue || 'rad_core';
      onUpdateProfile({
        ...currentUser,
        activeThemeId: val,
        unlockedThemes: Array.from(new Set([...(currentUser.unlockedThemes || []), val]))
      });
    } else if (item.type === 'profile_text_color') {
      const val = item.appliedValue || item.textStyle;
      onUpdateProfile({
        ...currentUser,
        activeTextColor: val,
        unlockedTextColors: Array.from(new Set([...(currentUser.unlockedTextColors || []), val]))
      });
    } else if (item.type === 'profile_text_bg') {
      const val = item.appliedValue || item.bgStyle;
      onUpdateProfile({
        ...currentUser,
        activeTextBg: val,
        unlockedTextBgs: Array.from(new Set([...(currentUser.unlockedTextBgs || []), val]))
      });
    } else if (item.type === 'avatar_frame') {
      const val = item.appliedValue || 'frame_rad_pulse';
      onUpdateProfile({
        ...currentUser,
        activeAvatarFrame: val,
        unlockedFrames: Array.from(new Set([...(currentUser.unlockedFrames || []), val]))
      });
    }
  };

  const handleResetCosmetics = () => {
    onUpdateProfile({
      ...currentUser,
      activeThemeId: 'default',
      activeTextColor: undefined,
      activeTextBg: undefined,
      activeAvatarFrame: 'frame_none'
    });
  };

  // State for locked cosmetic notice & category filters
  const [lockedItemNotice, setLockedItemNotice] = useState<{
    title: string;
    description: string;
    itemType: 'theme' | 'frame' | 'textColor' | 'textBg';
    previewValue: string;
  } | null>(null);

  const [themeFilter, setThemeFilter] = useState<'all' | 'standard' | 'animated' | 'poster'>('all');
  const [frameFilter, setFrameFilter] = useState<'all' | 'standard' | 'animated' | 'special'>('all');

  return (
    <div className="space-y-6">
      {/* Profile Card Container with Theme and Applied Cosmetics */}
      <div
        className={`relative rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all duration-500 overflow-hidden ${
          currentUser.activeTextBg ||
          'bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950 border-zinc-800'
        }`}
      >
        {/* Animated Background Theme (Rad Storm, Rad Core with particles, Quantum, Cyber, Starfall, Black Tree, Custom Photo) */}
        <ProfileAnimatedTheme
          themeId={currentUser.activeThemeId || 'default'}
          customBgUrl={currentUser.customBgUrl}
          customBgEffect={currentUser.customBgEffect}
          customBgPosition={currentUser.customBgPosition}
        />

        {/* Content of the Profile Card */}
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
            {/* Left: Avatar with Frame & Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative">
                <AvatarWithFrame
                  avatarUrl={currentUser.avatarUrl}
                  frameId={currentUser.activeAvatarFrame}
                  size="xl"
                  fitMode={currentUser.avatarFitMode || 'cover'}
                  zoom={currentUser.avatarZoom || 1}
                  offsetY={currentUser.avatarOffsetY || 0}
                  offsetX={currentUser.avatarOffsetX || 0}
                />
                {currentUser.username === '@MrWhitePio' && (
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[10px] tracking-wider uppercase shadow-lg flex items-center gap-1 z-20">
                    <Shield className="w-3 h-3" /> Владелец
                  </span>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h2
                    className={`text-2xl sm:text-3xl font-extrabold font-heading ${
                      currentUser.activeTextColor || 'text-zinc-100'
                    }`}
                  >
                    {currentUser.displayName}
                  </h2>
                  <span className="px-2.5 py-1 rounded-full bg-zinc-800/80 text-xs font-mono-pip text-amber-300 border border-zinc-700">
                    {currentUser.username}
                  </span>
                </div>

                {currentUser.bio && (
                  <p className="mt-2 text-xs sm:text-sm text-zinc-300 italic max-w-lg leading-relaxed">
                    "{currentUser.bio}"
                  </p>
                )}

                {/* Faction and Assigned Rank / Title */}
                {currentUser.factionName ? (
                  <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenFactions && onOpenFactions()}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/50 text-left flex items-center gap-2 shadow-md transition group"
                      title="Открыть фракцию"
                    >
                      <Shield className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold font-heading text-zinc-100">
                        {currentUser.factionName}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[11px] font-black font-heading uppercase tracking-wide">
                        🎖️ {currentUser.factionRole || 'Боец'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono-pip font-bold ml-1">
                        +10 ℰQ/день
                      </span>
                    </button>
                  </div>
                ) : (
                  onOpenFactions && (
                    <div className="mt-2.5 flex justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={onOpenFactions}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-dashed border-zinc-700 text-[11px] text-zinc-400 hover:text-amber-300 font-mono-pip flex items-center gap-1.5 transition"
                      >
                        <Shield className="w-3.5 h-3.5" /> Вступить во фракцию (+10 ℰQ/день)
                      </button>
                    </div>
                  )
                )}

                {/* Balance and Quick Case Links */}
                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono-pip font-extrabold text-sm shadow-inner ${
                      currentUser.equivaxes < 0
                        ? 'bg-rose-950/80 border-rose-500/80 text-rose-300'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    <Coins className={`w-4 h-4 ${currentUser.equivaxes < 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                    <span>
                      {currentUser.isInfiniteEquivaxes || currentUser.username === '@MrWhitePio'
                        ? '∞ БЕСКОНЕЧНО'
                        : currentUser.equivaxes < 0
                        ? `ДОЛГ: ${currentUser.equivaxes.toLocaleString()} ℰQ`
                        : `${currentUser.equivaxes.toLocaleString()} ℰQ`}
                    </span>
                  </div>

                  <button
                    onClick={onOpenCases}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-xs uppercase tracking-wider transition shadow"
                  >
                    Магазин кейсов →
                  </button>

                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-amber-300 font-heading font-bold text-xs uppercase tracking-wider transition shadow flex items-center gap-1.5 active:scale-95"
                    title="Открыть историю транзакций и начислений Эквиваксов"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>История ℰQ</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('achievements')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-amber-300 font-heading font-bold text-xs uppercase tracking-wider transition shadow flex items-center gap-1.5 active:scale-95"
                    title="Открыть достижения Пустошей"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Достижения ({achievements.length})</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono-pip">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Прибыл: {new Date(currentUser.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Debt Explanation Banner */}
                {currentUser.equivaxes < 0 && (
                  <div className="mt-3 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="text-rose-300 font-bold">У вас непогашенный штраф (долг {currentUser.equivaxes} ℰQ):</strong>
                      <p className="text-[11px] text-zinc-300 mt-0.5">
                        Штраф был начислен администрацией за неявку на зарегистрированное событие или РП-сессию.
                        Долг будет автоматически гаситься при получении новых Эквиваксов за вылазки, торговлю и активности!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Profile Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono-pip text-zinc-200 flex items-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEditing ? 'Закрыть' : 'Редактировать'}</span>
              </button>

              {(currentUser.activeTextColor ||
                currentUser.activeThemeId !== 'default' ||
                currentUser.activeTextBg ||
                (currentUser.activeAvatarFrame && currentUser.activeAvatarFrame !== 'frame_none')) && (
                <button
                  onClick={handleResetCosmetics}
                  className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono-pip text-zinc-300 flex items-center gap-1.5 transition"
                  title="Сбросить оформление на стандартное"
                >
                  <Palette className="w-3.5 h-3.5 text-rose-400" />
                  <span>Сброс стиля</span>
                </button>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <form
              onSubmit={handleSaveProfile}
              className="mt-6 pt-5 border-t border-zinc-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in"
            >
              <div>
                <label className="block text-xs font-mono-pip text-amber-300 mb-1">Отображаемый никнейм:</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-pip text-amber-300 mb-1">Telegram Юзернейм:</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUploadInput
                  label="Фотография аватара (загрузите из галереи или URL):"
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  helperText="Вы можете загрузить любое фото из галереи телефона или выбрать файл с ПК."
                />
              </div>

              {/* Avatar Framing & Cropping Adjustment Controller */}
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Кадрирование и посадка аватара в рамке</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFitMode('cover');
                      setAvatarZoom(1);
                      setAvatarOffsetY(0);
                      setAvatarOffsetX(0);
                    }}
                    className="text-[10px] font-mono-pip text-zinc-400 hover:text-amber-300 transition"
                  >
                    Сбросить
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Live preview */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <AvatarWithFrame
                      avatarUrl={avatarUrl}
                      frameId={currentUser.activeAvatarFrame}
                      size="lg"
                      fitMode={avatarFitMode}
                      zoom={avatarZoom}
                      offsetY={avatarOffsetY}
                      offsetX={avatarOffsetX}
                    />
                    <span className="text-[9px] font-mono-pip text-zinc-500">Предпросмотр</span>
                  </div>

                  {/* Controls */}
                  <div className="flex-1 w-full space-y-2.5">
                    {/* Mode buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAvatarFitMode('cover')}
                        className={`py-1.5 px-3 rounded-xl text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 border ${
                          avatarFitMode === 'cover'
                            ? 'bg-amber-500 text-black border-amber-400 shadow'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        <span>Заполнить круг</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarFitMode('contain')}
                        className={`py-1.5 px-3 rounded-xl text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 border ${
                          avatarFitMode === 'contain'
                            ? 'bg-amber-500 text-black border-amber-400 shadow'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        <span>Вписать целиком</span>
                      </button>
                    </div>

                    {/* Sliders: Zoom & Vertical Shift */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono-pip text-zinc-400 mb-1">
                          <span>Масштаб (Zoom):</span>
                          <span className="text-amber-300 font-bold">{Math.round(avatarZoom * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="2.5"
                          step="0.05"
                          value={avatarZoom}
                          onChange={e => setAvatarZoom(parseFloat(e.target.value))}
                          className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono-pip text-zinc-400 mb-1">
                          <span>Смещение по вертикали (Y):</span>
                          <span className="text-amber-300 font-bold">{avatarOffsetY > 0 ? `+${avatarOffsetY}%` : `${avatarOffsetY}%`}</span>
                        </div>
                        <input
                          type="range"
                          min="-35"
                          max="35"
                          step="1"
                          value={avatarOffsetY}
                          onChange={e => setAvatarOffsetY(parseInt(e.target.value))}
                          className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-pip text-amber-300 mb-1">О себе / Девиз сталкера:</label>
                <input
                  type="text"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-mono-pip text-zinc-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase"
                >
                  Сохранить профиль
                </button>
              </div>
            </form>
          )}

          {/* Pinned Arts & Photos Showcase (3 slots) */}
          <ProfilePinnedArtsShowcase
            currentUser={currentUser}
            onUpdateProfile={onUpdateProfile}
            artworks={artworks}
          />
        </div>
      </div>

      {/* Activity Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xl">
            🔥
          </div>
          <div>
            <div className="text-2xl font-bold font-mono-pip text-amber-400 leading-none">
              {currentUser.eventsAttended}
            </div>
            <div className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-400 mt-1">
              Участий в ивентах
            </div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xl">
            🎲
          </div>
          <div>
            <div className="text-2xl font-bold font-mono-pip text-cyan-400 leading-none">
              {currentUser.plannedRpsAttended}
            </div>
            <div className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-400 mt-1">
              Участий в РП-сессиях
            </div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
            📜
          </div>
          <div>
            <div className="text-2xl font-bold font-mono-pip text-emerald-400 leading-none">
              {userCharacters.length}
            </div>
            <div className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-400 mt-1">
              Созданных персонажей
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition ${
            activeTab === 'inventory'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Инвентарь ({currentUser.inventory?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('customization')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition ${
            activeTab === 'customization'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>✦ Стили & Кастомизация ✦</span>
        </button>

        <button
          onClick={() => setActiveTab('awards')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition ${
            activeTab === 'awards'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <AwardIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="shimmer-neon-text">✦ Заслуги ({userAwards.length}) ✦</span>
        </button>

        <button
          onClick={() => setActiveTab('characters')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition ${
            activeTab === 'characters'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Персонажи ({userCharacters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition ${
            activeTab === 'transactions'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>Транзакции ({currentUser.transactions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition ${
            activeTab === 'achievements'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Достижения ({achievements.length})</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMIZATION HUB (Frames, Animated Themes, Text Colors, Backgrounds) */}
      {activeTab === 'customization' && (
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold font-heading text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Гардероб и стили профиля</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Выбирайте анимированные радиационные темы, 3D-рамки для аватарки, цвета текста и фоны профиля.
              </p>
            </div>

            {/* Category sub-switch */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setCustomizationCategory('themes')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-pip transition ${
                  customizationCategory === 'themes' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
                }`}
              >
                Анимир. фоны
              </button>
              <button
                onClick={() => setCustomizationCategory('frames')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-pip transition ${
                  customizationCategory === 'frames' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
                }`}
              >
                Рамки 3D / Неон
              </button>
              <button
                onClick={() => setCustomizationCategory('card_frames')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-pip transition ${
                  customizationCategory === 'card_frames' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
                }`}
              >
                Рамки в Топе
              </button>
              <button
                onClick={() => setCustomizationCategory('text')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-pip transition ${
                  customizationCategory === 'text' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
                }`}
              >
                Цвета текста
              </button>
              <button
                onClick={() => setCustomizationCategory('bg')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-pip transition ${
                  customizationCategory === 'bg' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
                }`}
              >
                Цвета фона
              </button>
            </div>
          </div>

          {/* 1. Animated & Illustrated Profile Themes (23 themes total: 3 basic + 16 wasteland posters + animated) */}
          {customizationCategory === 'themes' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-mono-pip text-zinc-400">
                  Выберите фон профиля (в начале открыты 3 базовых, остальные — из кейсов и магазина):
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono-pip">
                  <button
                    type="button"
                    onClick={() => setThemeFilter('all')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      themeFilter === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Все ({PRESET_PROFILE_THEMES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeFilter('standard')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      themeFilter === 'standard' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    3 Базовых
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeFilter('animated')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      themeFilter === 'animated' ? 'bg-purple-500 text-white font-bold' : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    Анимированные
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeFilter('poster')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      themeFilter === 'poster' ? 'bg-cyan-500 text-black font-bold' : 'text-cyan-300 hover:text-white'
                    }`}
                  >
                    Постеры Пустоши
                  </button>
                </div>
              </div>

              {/* Custom Photo Background Banner */}
              <div className="p-3.5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {currentUser.customBgUrl ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 border-amber-400 relative bg-zinc-950 shadow-md">
                      <img
                        src={currentUser.customBgUrl}
                        alt="Custom BG"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0.5 right-0.5 text-xs">✨</span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold font-heading text-zinc-100 uppercase tracking-wider">
                        Кастомный фон из фото или арта
                      </h4>
                      {currentUser.activeThemeId === 'bg_custom_photo' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[9px] uppercase font-mono-pip animate-pulse">
                          Активен
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {currentUser.customBgUrl
                        ? `Эффект: ${PROFILE_EFFECT_OPTIONS.find(o => o.id === currentUser.customBgEffect)?.name || 'Искры и пепел'}`
                        : 'Установите любое фото или арт из витрины как живой фон с эффектами!'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {currentUser.customBgUrl && currentUser.activeThemeId !== 'bg_custom_photo' && (
                    <button
                      type="button"
                      onClick={() => onUpdateProfile({ ...currentUser, activeThemeId: 'bg_custom_photo' })}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold font-heading uppercase"
                    >
                      Включить
                    </button>
                  )}
                  {currentUser.activeThemeId === 'bg_custom_photo' && (
                    <button
                      type="button"
                      onClick={() => onUpdateProfile({ ...currentUser, activeThemeId: 'default' })}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950 text-rose-300 border border-rose-900/50 text-xs font-mono-pip"
                    >
                      Отключить
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {PRESET_PROFILE_THEMES
                  .filter(theme => themeFilter === 'all' || (themeFilter === 'standard' ? ['default', 'rad_storm', 'black_tree'].includes(theme.id) : theme.category === themeFilter))
                  .map(theme => {
                    const isSelected = (currentUser.activeThemeId || 'default') === theme.id;
                    const isUnlocked = isThemeUnlocked(currentUser, theme.id);
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          if (!isUnlocked) {
                            setLockedItemNotice({
                              title: theme.name,
                              description: 'Этот фон закрыт! В начале игры всем игрокам доступны только 3 базовых стиля (Бункер, Рад-Шторм и Чёрное Древо). Вы сможете приобрести его в Магазине Пустоши или выбить из Кейсов, когда они появятся у Администраторов!',
                              itemType: 'theme',
                              previewValue: theme.id
                            });
                            return;
                          }
                          onUpdateProfile({ ...currentUser, activeThemeId: theme.id });
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition group relative ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-lg'
                            : isUnlocked
                            ? 'bg-zinc-900/70 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                            : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 opacity-75 hover:opacity-100 hover:border-zinc-700'
                        }`}
                      >
                        {theme.image ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-700/60 relative bg-zinc-950 shadow-md">
                            <img
                              src={theme.image}
                              alt={theme.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute bottom-0.5 right-0.5 text-xs filter drop-shadow">
                              {theme.icon}
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl filter drop-shadow">{theme.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold font-heading truncate">{theme.name}</span>
                            {isSelected ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-mono-pip text-[9px] font-black uppercase shrink-0">
                                Активно
                              </span>
                            ) : !isUnlocked ? (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-amber-400 font-mono-pip text-[9px] font-semibold flex items-center gap-0.5 shrink-0">
                                <Lock className="w-2.5 h-2.5" /> Замок
                              </span>
                            ) : theme.badge ? (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono-pip text-[9px] shrink-0">
                                {theme.badge}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-snug line-clamp-2">
                            {theme.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 2. Avatar Frames (18 frames: 3 basic + animated + special) */}
          {customizationCategory === 'frames' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-mono-pip text-zinc-400">
                  Выберите рамку для аватарки (в начале открыты 3 базовые рамки):
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono-pip">
                  <button
                    type="button"
                    onClick={() => setFrameFilter('all')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      frameFilter === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Все ({PRESET_AVATAR_FRAMES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrameFilter('standard')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      frameFilter === 'standard' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    3 Базовые
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrameFilter('animated')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      frameFilter === 'animated' ? 'bg-purple-500 text-white font-bold' : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    Анимированные
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrameFilter('special')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      frameFilter === 'special' ? 'bg-rose-500 text-white font-bold' : 'text-rose-300 hover:text-white'
                    }`}
                  >
                    Особенные
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {PRESET_AVATAR_FRAMES
                  .filter(f => frameFilter === 'all' || (frameFilter === 'standard' ? ['frame_none', 'frame_steel_rivets', 'frame_gold_3d'].includes(f.id) : f.type === frameFilter))
                  .map(f => {
                    const isSelected = (currentUser.activeAvatarFrame || 'frame_none') === f.id;
                    const isUnlocked = isFrameUnlocked(currentUser, f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          if (!isUnlocked) {
                            setLockedItemNotice({
                              title: f.name,
                              description: 'Эта рамка закрыта! В начале игры доступны 3 базовые рамки («Без рамки», «Стальная бронепластина» и «3D Золото»). Остальные рамки можно купить в Магазине или выбить из Кейсов!',
                              itemType: 'frame',
                              previewValue: f.id
                            });
                            return;
                          }
                          onUpdateProfile({ ...currentUser, activeAvatarFrame: f.id });
                        }}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition relative ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg'
                            : isUnlocked
                            ? 'bg-zinc-900/70 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                            : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 opacity-70 hover:opacity-100 hover:border-zinc-700'
                        }`}
                      >
                        <div className="my-1">
                          <AvatarWithFrame avatarUrl={currentUser.avatarUrl} frameId={f.id} size="md" />
                        </div>
                        <span className="text-xs font-bold font-heading mt-2 line-clamp-1">
                          {f.name}
                        </span>
                        <span className="text-[9px] font-mono-pip text-zinc-400 uppercase mt-0.5">
                          {f.type === 'animated' ? '⚡ Анимация' : f.type === 'special' ? '👑 Особенная' : 'Стандарт'}
                        </span>
                        {isSelected ? (
                          <span className="mt-1.5 text-[9px] text-emerald-400 font-mono-pip font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Надето
                          </span>
                        ) : !isUnlocked ? (
                          <span className="mt-1.5 text-[9px] text-amber-400 font-mono-pip flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Замок
                          </span>
                        ) : (
                          <span className="mt-1.5 text-[9px] text-zinc-500 font-mono-pip">
                            Выбрать
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 3. Card Frames (Рамки вокруг плашки/иконки игрока в Топе активности) */}
          {customizationCategory === 'card_frames' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-mono-pip text-zinc-300">
                  Выберите стиль рамки, которая будет окружать <strong className="text-amber-400">всю вашу карточку</strong> в списке Топа игроков Пустоши:
                </div>
                {currentUser.activeCardFrame && currentUser.activeCardFrame !== 'card_frame_none' && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateProfile({ ...currentUser, activeCardFrame: 'card_frame_none' });
                      setSaveToast('Установлен стандартный контур');
                      setTimeout(() => setSaveToast(null), 2500);
                    }}
                    className="text-[11px] font-mono-pip text-zinc-400 hover:text-amber-300 underline"
                  >
                    Сбросить до базового
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {PRESET_CARD_FRAMES.map((cf, idx) => {
                  const isSelected = (currentUser.activeCardFrame || 'card_frame_none') === cf.id;
                  return (
                    <div
                      key={cf.id}
                      onClick={() => {
                        onUpdateProfile({ ...currentUser, activeCardFrame: cf.id });
                        setSaveToast(`Рамка карточки «${cf.name}» надета!`);
                        setTimeout(() => setSaveToast(null), 2500);
                      }}
                      className="cursor-pointer group"
                    >
                      <PlayerCardFrame
                        frameId={cf.id}
                        rank={idx + 1}
                        isOwner={isOwner}
                        isSelected={isSelected}
                      >
                        <div className="p-3 bg-zinc-950 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold font-heading text-zinc-100 flex items-center gap-1.5">
                              <span>{cf.icon}</span>
                              <span className="truncate">{cf.name}</span>
                            </span>
                            {isSelected ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono-pip text-[9px] font-black uppercase flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Надето
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono-pip text-[9px]">
                                {cf.badge}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-zinc-400 font-mono-pip line-clamp-2">
                            {cf.description}
                          </p>

                          {/* Mini Sample Preview in Card Frame */}
                          <div className="mt-1 pt-1 border-t border-zinc-800 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-black border border-zinc-700 shrink-0">
                              <img
                                src={currentUser.avatarUrl}
                                alt="avatar"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold text-white truncate font-heading">
                                {currentUser.displayName}
                              </div>
                              <div className="text-[9px] text-zinc-500 font-mono-pip truncate">
                                {currentUser.username}
                              </div>
                            </div>
                          </div>
                        </div>
                      </PlayerCardFrame>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Text Colors (Extended styles: standard, animated shimmers, gradients, specials) */}
          {customizationCategory === 'text' && (
            <div className="space-y-3">
              <div className="text-xs font-mono-pip text-zinc-400">
                Выберите стиль и неоновое свечение для вашего имени (в начале доступны 3 базовых стиля):
              </div>
              <PaletteColorSelector
                type="text"
                selectedValue={currentUser.activeTextColor}
                currentUser={currentUser}
                onSelect={(val) => onUpdateProfile({ ...currentUser, activeTextColor: val || undefined })}
                sampleText={currentUser.displayName}
                onLockedClick={(label) => {
                  setLockedItemNotice({
                    title: label,
                    description: 'Этот цвет/стиль текста заблокирован! В начале доступны только 3 базовых цвета (Белый, Янтарный и Токсичный Рад). Приобретите его в Магазине или выбейте в Сундуках!',
                    itemType: 'textColor',
                    previewValue: label
                  });
                }}
              />
            </div>
          )}

          {/* 4. Background Colors (Card Bgs: standard, animated shimmers, gradients) */}
          {customizationCategory === 'bg' && (
            <div className="space-y-3">
              <div className="text-xs font-mono-pip text-zinc-400">
                Выберите оттенок и градиент карточки профиля (в начале доступны 3 базовых фона):
              </div>
              <PaletteColorSelector
                type="bg"
                selectedValue={currentUser.activeTextBg}
                currentUser={currentUser}
                onSelect={(val) => onUpdateProfile({ ...currentUser, activeTextBg: val || undefined })}
                onLockedClick={(label) => {
                  setLockedItemNotice({
                    title: label,
                    description: 'Этот фон карточки заблокирован! В начале доступны 3 базовых тона (Бункер, Карбон, Обсидиан). Приобретите его в Магазине или выбейте в Сундуках!',
                    itemType: 'textBg',
                    previewValue: label
                  });
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Locked Item Info & Preview Modal */}
      {lockedItemNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-950 border border-amber-500/60 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold font-heading text-amber-300">
                {lockedItemNotice.title}
              </h3>
              <span className="text-[10px] font-mono-pip uppercase tracking-wider text-zinc-500">
                Косметический предмет заблокирован
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {lockedItemNotice.description}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  if (lockedItemNotice.itemType === 'theme') {
                    onUpdateProfile({ ...currentUser, activeThemeId: lockedItemNotice.previewValue });
                  } else if (lockedItemNotice.itemType === 'frame') {
                    onUpdateProfile({ ...currentUser, activeAvatarFrame: lockedItemNotice.previewValue });
                  }
                  setLockedItemNotice(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-heading font-black uppercase transition"
              >
                Примерить (Предпросмотр)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLockedItemNotice(null);
                  onOpenCases();
                }}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-heading font-black uppercase transition shadow"
              >
                Открыть Кейсы
              </button>
              <button
                type="button"
                onClick={() => setLockedItemNotice(null)}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-heading font-bold uppercase transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & UNLOCKED DROPS */}
      {activeTab === 'inventory' && (
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold font-heading text-amber-400 uppercase tracking-wide">
                Инвентарь сталкера ({currentUser.inventory?.length || 0})
              </h3>
            </div>
            <button
              onClick={onOpenCases}
              className="text-xs font-mono-pip text-amber-400 hover:underline"
            >
              Открыть кейсы →
            </button>
          </div>

          {(!currentUser.inventory || currentUser.inventory.length === 0) ? (
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-2">
              <Package className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">Инвентарь пуст. Открывайте кейсы Пустоши, чтобы выбивать редкие рамки, радиационные фоны и стили!</p>
              <button
                onClick={onOpenCases}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-xs uppercase"
              >
                Перейти к кейсам
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {currentUser.inventory.map(item => {
                const isLottery = item.type === 'lottery_ticket';
                const isCosmetic = !isLottery && item.type !== 'item';
                const isApplied =
                  (item.type === 'profile_theme' && currentUser.activeThemeId === item.appliedValue) ||
                  (item.type === 'profile_text_color' && currentUser.activeTextColor === item.appliedValue) ||
                  (item.type === 'profile_text_bg' && currentUser.activeTextBg === item.appliedValue) ||
                  (item.type === 'avatar_frame' && currentUser.activeAvatarFrame === item.appliedValue);

                if (isLottery) {
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-950/80 via-zinc-950 to-zinc-900 flex flex-col justify-between shadow-xl ring-1 ring-amber-500/30 transition-all hover:scale-[1.02] relative overflow-hidden"
                    >
                      <div className="absolute top-2 right-2 px-1.5 py-0.2 rounded-md bg-amber-500 text-black text-[8px] font-mono-pip font-black uppercase tracking-wider">
                        ЛОТЕРЕЯ
                      </div>

                      <div className="text-center pt-2">
                        <div className="w-16 h-16 mx-auto my-1.5 rounded-xl bg-black/60 p-2 flex items-center justify-center border border-amber-500/40 shadow-inner">
                          <img
                            src={item.photoUrl}
                            alt={item.name}
                            className="w-full h-full object-contain filter drop-shadow animate-pulse"
                          />
                        </div>
                        <span className="block text-xs font-bold font-heading text-amber-300 line-clamp-1">
                          {item.name}
                        </span>
                        <div className="text-[10px] text-zinc-400 font-mono-pip mt-0.5">
                          Куш: <strong className="text-amber-400">{item.lotteryData?.prizeEquivaxes || 100} ℰQ</strong>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-amber-500/30">
                        <button
                          onClick={() => onOpenLotteryTicket && onOpenLotteryTicket(item)}
                          className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[10px] font-heading font-black uppercase tracking-wider transition shadow-lg animate-pulse flex items-center justify-center gap-1"
                        >
                          <span>🎰 Стереть билет</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border bg-gradient-to-br ${item.bgStyle} flex flex-col justify-between transition-all hover:scale-[1.02] shadow-md`}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto my-2 rounded-xl bg-black/40 p-2 flex items-center justify-center">
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="w-full h-full object-contain filter drop-shadow"
                        />
                      </div>
                      <span
                        className={`block text-xs line-clamp-2 leading-tight ${item.textStyle}`}
                      >
                        {item.name}
                      </span>
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-black/60 text-[9px] font-mono-pip text-zinc-400 uppercase">
                        {item.rarity}
                      </span>
                    </div>

                    {/* Cosmetic Apply Button */}
                    {isCosmetic && (
                      <div className="mt-3 pt-2 border-t border-white/10">
                        {isApplied ? (
                          <div className="w-full py-1 text-center rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-mono-pip font-bold flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" /> Применено
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApplyCosmetic(item)}
                            className="w-full py-1 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-black text-[10px] font-heading font-black uppercase tracking-wider transition"
                          >
                            Применить к профилю
                          </button>
                        )}
                      </div>
                    )}

                    {/* Resale to Wasteland Pawnshop */}
                    <div className="mt-2 pt-2 border-t border-white/10">
                      {confirmSellId === item.id ? (
                        <div className="flex items-center gap-1.5 animate-fade-in">
                          <button
                            onClick={() => {
                              const payout = getItemPawnPrice(item.rarity);
                              onSellItemToPawnshop(item.id, payout);
                              setConfirmSellId(null);
                              setSoldToast(`«${item.name}» сдан скупщику за +${payout} ℰQ!`);
                              setTimeout(() => setSoldToast(null), 3500);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono-pip font-extrabold transition shadow flex items-center justify-center gap-1 active:scale-95"
                          >
                            <Coins className="w-3 h-3" />
                            <span>Да, продать (+{getItemPawnPrice(item.rarity)} ℰQ)</span>
                          </button>
                          <button
                            onClick={() => setConfirmSellId(null)}
                            className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-mono-pip"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmSellId(item.id)}
                          className="w-full py-1.5 rounded-lg bg-zinc-800/90 hover:bg-amber-950/80 border border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-amber-300 text-[10px] font-mono-pip font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                          title="Продать скупщику за Эквиваксы"
                        >
                          <Coins className="w-3 h-3 text-amber-400" />
                          <span>Продать скупщику: +{getItemPawnPrice(item.rarity)} ℰQ</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sold Toast Notification */}
          {soldToast && (
            <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-mono-pip flex items-center justify-center gap-2 animate-bounce shadow-xl">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{soldToast}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AWARDS («ЗАСЛУГИ») */}
      {activeTab === 'awards' && (
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AwardIcon className="w-6 h-6 text-cyan-400 filter drop-shadow-[0_0_8px_#38bdf8]" />
              <h3 className="text-lg sm:text-xl font-black font-heading tracking-widest uppercase shimmer-neon-text">
                ✦ ЗАСЛУГИ И ОРДЕНА ✦
              </h3>
            </div>
            <span className="text-xs font-mono-pip text-cyan-300 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
              {userAwards.length} орденов
            </span>
          </div>

          {userAwards.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
              У вас пока нет медалей или заслуг, выданных администрацией DustTown. Участвуйте в событиях и РП-сессиях!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userAwards.map(award => (
                <div
                  key={award.id}
                  className={`p-4 rounded-2xl border bg-gradient-to-br ${award.cardBg} transition-all duration-300 hover:scale-[1.02] shadow-lg`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                      {award.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold font-heading ${award.titleColor} truncate`}>
                        {award.title}
                      </h4>
                      <p className={`text-xs mt-1 leading-relaxed ${award.textColor}`}>
                        {award.description}
                      </p>
                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400 font-mono-pip">
                        <span>Наградил: {award.awardedBy}</span>
                        <span>{new Date(award.awardedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MY CHARACTERS */}
      {activeTab === 'characters' && (
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold font-heading text-zinc-100 uppercase tracking-wide">
                Мои персонажи ({userCharacters.length})
              </h3>
            </div>
          </div>

          {userCharacters.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
              У вас пока нет созданных персонажей. Перейдите во вкладку «Анкеты персонажей», чтобы заполнить анкету!
            </div>
          ) : (
            <div className="space-y-2">
              {userCharacters.map(char => (
                <div
                  key={char.id}
                  onClick={() => onSelectCharacter(char)}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 flex items-center justify-between gap-3 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={char.avatarIcon || char.photoUrl}
                      alt={char.name}
                      className="w-12 h-12 rounded-xl object-cover border border-amber-500/40"
                    />
                    <div>
                      <div className="text-sm font-bold text-amber-300 font-heading">
                        {char.name} {char.surname !== '—' ? char.surname : ''} {char.nickname && `«${char.nickname}»`}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono-pip mt-0.5">
                        {char.race} • {char.faction} • {char.age}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-amber-400 flex items-center gap-1 font-mono-pip">
                    Просмотр анкеты <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TRANSACTION HISTORY */}
      {activeTab === 'transactions' && (
        <TransactionHistory
          transactions={currentUser.transactions || []}
          currentEquivaxes={currentUser.equivaxes}
          isInfiniteEquivaxes={Boolean(currentUser.isInfiniteEquivaxes || currentUser.username?.toLowerCase() === '@mrwhitepio')}
        />
      )}

      {/* TAB 6: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <AchievementsList
          achievements={achievements}
          currentUser={currentUser}
          events={events}
          characters={characters}
          awards={awards}
          onClaimReward={ach => onClaimAchievementReward && onClaimAchievementReward(ach)}
        />
      )}
    </div>
  );
};
