import React, { useState } from 'react';
import { UserProfile, Award, CharacterSheet, InventoryItem } from '../types';
import { AvatarWithFrame } from './AvatarWithFrame';
import { ProfileAnimatedTheme } from './ProfileAnimatedTheme';
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
  Layers
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: UserProfile;
  awards: Award[];
  characters: CharacterSheet[];
  onUpdateProfile: (updated: UserProfile) => void;
  onSelectCharacter: (char: CharacterSheet) => void;
  onOpenCases: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  awards,
  characters,
  onUpdateProfile,
  onSelectCharacter,
  onOpenCases
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'customization' | 'characters' | 'awards'>('inventory');
  const [customizationCategory, setCustomizationCategory] = useState<'themes' | 'frames' | 'text' | 'bg'>('themes');

  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);

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
      avatarUrl
    });
    setIsEditing(false);
  };

  const handleApplyCosmetic = (item: InventoryItem) => {
    if (item.type === 'profile_theme') {
      onUpdateProfile({
        ...currentUser,
        activeThemeId: item.appliedValue || 'rad_core'
      });
    } else if (item.type === 'profile_text_color') {
      onUpdateProfile({
        ...currentUser,
        activeTextColor: item.appliedValue || item.textStyle
      });
    } else if (item.type === 'profile_text_bg') {
      onUpdateProfile({
        ...currentUser,
        activeTextBg: item.appliedValue || item.bgStyle
      });
    } else if (item.type === 'avatar_frame') {
      onUpdateProfile({
        ...currentUser,
        activeAvatarFrame: item.appliedValue || 'frame_rad_pulse'
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

  // Direct customization sets
  const PRESET_ANIMATED_THEMES = [
    {
      id: 'default',
      name: 'Стандартный Бункер',
      desc: 'Строгий тёмный бункер с мягким светом',
      icon: '🛡️'
    },
    {
      id: 'rad_core',
      name: 'Реактор Радиации ☢️',
      desc: 'Пульсирующий знак радиации, от которого во все стороны фонит зелёными частицами',
      icon: '☢️'
    },
    {
      id: 'rad_storm',
      name: 'Радиоактивный Шторм ☣️',
      desc: 'Зелёный туман Пустоши, падающие частицы радиоактивных осадков',
      icon: '☣️'
    },
    {
      id: 'black_tree',
      name: 'Чёрное Древо Пустоши 🍁',
      desc: 'Силуэт древа надежды «I believe in you» и опадающие тлеющие листья',
      icon: '🍁'
    },
    {
      id: 'quantum_pulse',
      name: 'Квантовое Поле 💎',
      desc: 'Лазурно-фиолетовые вспышки ионизированного квантового кристалла',
      icon: '💎'
    },
    {
      id: 'cyber_neon',
      name: 'Кибер-Матрица ⚡',
      desc: 'Неоновые бегущие световые линии и сетка довоенного мэйнфрейма',
      icon: '⚡'
    },
    {
      id: 'starfall',
      name: 'Звездопад Эквестрии ✨',
      desc: 'Падающие золотые звёзды и мягкие космические частицы',
      icon: '✨'
    }
  ];

  const PRESET_AVATAR_FRAMES = [
    { id: 'frame_none', name: 'Без рамки', type: 'none', icon: '⭕' },
    { id: 'frame_gold_3d', name: '3D Золото Рейнджера', type: '3D', icon: '🏆' },
    { id: 'frame_rad_pulse', name: 'Радиоактивный Пульс', type: 'Анимированная', icon: '☢️' },
    { id: 'frame_cyber_glitch', name: 'Кибер-Глитч', type: 'Анимированная', icon: '💽' },
    { id: 'frame_rainbow_neon', name: 'Радужный Неон', type: 'Анимированная', icon: '🌈' },
    { id: 'frame_steel_rivets', name: 'Сталь Братства с Заклёпками', type: '3D Сталь', icon: '⚙️' },
    { id: 'frame_enclave_wings', name: 'Крылья Анклава', type: 'Золотая', icon: '🪶' },
    { id: 'frame_quantum_crystal', name: 'Квантовые Осколки', type: '3D Кристалл', icon: '🔮' },
    { id: 'frame_toxic_flame', name: 'Токсичное Пламя', type: 'Анимированная', icon: '🔥' },
    { id: 'frame_raider_spikes', name: 'Шипы Рейдера', type: 'Стальная', icon: '💀' }
  ];

  const PRESET_TEXT_COLORS = [
    { value: '', label: 'Стандартный белый' },
    { value: 'text-amber-400 font-extrabold drop-shadow-[0_0_8px_#f59e0b]', label: 'Пылающий Янтарный ⚡' },
    { value: 'text-cyan-400 font-extrabold drop-shadow-[0_0_10px_#22d3ee]', label: 'Неоновый Лазурный 💎' },
    { value: 'text-emerald-400 font-extrabold drop-shadow-[0_0_10px_#10b981]', label: 'Токсичный Рад ☢️' },
    { value: 'rainbow-shimmer-text font-black', label: 'Радужный Шиммер 🌈' },
    { value: 'text-yellow-300 font-extrabold drop-shadow-[0_0_8px_#facc15]', label: 'Имперское Золото ⭐' },
    { value: 'text-purple-400 font-extrabold drop-shadow-[0_0_8px_#c084fc]', label: 'Магический Аметист 🔮' },
    { value: 'text-rose-400 font-extrabold drop-shadow-[0_0_8px_#fb7185]', label: 'Кибер-Розовый 🌸' },
    { value: 'text-red-500 font-extrabold drop-shadow-[0_0_8px_#ef4444]', label: 'Кровавый Рубин 🩸' }
  ];

  const PRESET_BG_COLORS = [
    { value: '', label: 'Стандартный Бункер', style: 'bg-zinc-950 border-zinc-800' },
    { value: 'bg-gradient-to-br from-green-950/80 via-zinc-950 to-emerald-950 border-emerald-500/50', label: 'Радиоактивная Зона ☢️', style: 'from-green-950 to-emerald-950' },
    { value: 'bg-gradient-to-br from-zinc-950 via-neutral-900 to-black border-zinc-700', label: 'Тёмный Карбон 🖤', style: 'from-zinc-950 to-black' },
    { value: 'bg-gradient-to-br from-amber-950/60 via-zinc-950 to-stone-900 border-amber-600/50', label: 'Золотой Закат 🌅', style: 'from-amber-950 to-stone-900' },
    { value: 'bg-gradient-to-br from-blue-950/70 via-slate-950 to-indigo-950 border-cyan-500/50', label: 'Глубинный Неон 🌌', style: 'from-blue-950 to-indigo-950' },
    { value: 'bg-gradient-to-br from-purple-950/70 via-zinc-950 to-fuchsia-950/50 border-purple-500/50', label: 'Фиолетовая Бездна 🔮', style: 'from-purple-950 to-fuchsia-950' },
    { value: 'bg-gradient-to-br from-red-950/60 via-zinc-950 to-rose-950/50 border-rose-500/50', label: 'Кровавая Пустошь 🩸', style: 'from-red-950 to-rose-950' },
    { value: 'bg-gradient-to-br from-emerald-950/70 via-zinc-950 to-teal-950/50 border-emerald-400/50', label: 'Изумрудный Оазис 🌴', style: 'from-emerald-950 to-teal-950' }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Card Container with Theme and Applied Cosmetics */}
      <div
        className={`relative rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all duration-500 overflow-hidden ${
          currentUser.activeTextBg ||
          'bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950 border-zinc-800'
        }`}
      >
        {/* Animated Background Theme (Rad Storm, Rad Core with particles, Quantum, Cyber, Starfall, Black Tree) */}
        <ProfileAnimatedTheme themeId={currentUser.activeThemeId || 'default'} />

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

                {/* Balance and Quick Case Links */}
                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono-pip font-extrabold text-sm shadow-inner">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>
                      {currentUser.isInfiniteEquivaxes || currentUser.username === '@MrWhitePio'
                        ? '∞ БЕСКОНЕЧНО'
                        : `${currentUser.equivaxes.toLocaleString()} ℰQ`}
                    </span>
                  </div>

                  <button
                    onClick={onOpenCases}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-xs uppercase tracking-wider transition shadow"
                  >
                    Магазин кейсов →
                  </button>

                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono-pip">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Прибыл: {new Date(currentUser.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>
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

              <div>
                <label className="block text-xs font-mono-pip text-amber-300 mb-1">URL Фотографии аватара:</label>
                <input
                  type="text"
                  required
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
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

          {/* 1. Animated Profile Themes */}
          {customizationCategory === 'themes' && (
            <div className="space-y-3">
              <div className="text-xs font-mono-pip text-zinc-400">
                Выберите анимированный фон для профиля:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRESET_ANIMATED_THEMES.map(theme => {
                  const isSelected = (currentUser.activeThemeId || 'default') === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => onUpdateProfile({ ...currentUser, activeThemeId: theme.id })}
                      className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition group ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-lg'
                          : 'bg-zinc-900/70 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span className="text-2xl filter drop-shadow">{theme.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-heading">{theme.name}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black font-mono-pip text-[9px] font-black uppercase">
                              Активно
                            </span>
                          )}
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

          {/* 2. Avatar Frames (3D, Animated, Non-animated) */}
          {customizationCategory === 'frames' && (
            <div className="space-y-3">
              <div className="text-xs font-mono-pip text-zinc-400">
                Выберите рамку для своей аватарки:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {PRESET_AVATAR_FRAMES.map(f => {
                  const isSelected = (currentUser.activeAvatarFrame || 'frame_none') === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onUpdateProfile({ ...currentUser, activeAvatarFrame: f.id })}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg'
                          : 'bg-zinc-900/70 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="my-1">
                        <AvatarWithFrame avatarUrl={currentUser.avatarUrl} frameId={f.id} size="md" />
                      </div>
                      <span className="text-xs font-bold font-heading mt-2 line-clamp-1">
                        {f.name}
                      </span>
                      <span className="text-[9px] font-mono-pip text-zinc-400 uppercase mt-0.5">
                        {f.type}
                      </span>
                      {isSelected ? (
                        <span className="mt-1.5 text-[9px] text-emerald-400 font-mono-pip font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Надето
                        </span>
                      ) : (
                        <span className="mt-1.5 text-[9px] text-zinc-500 font-mono-pip">
                          Нажмите для выбора
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Text Colors */}
          {customizationCategory === 'text' && (
            <div className="space-y-3">
              <div className="text-xs font-mono-pip text-zinc-400">
                Выберите стиль и неоновое свечение для вашего имени:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {PRESET_TEXT_COLORS.map(tc => {
                  const isSelected = (currentUser.activeTextColor || '') === tc.value;
                  return (
                    <button
                      key={tc.label}
                      onClick={() => onUpdateProfile({ ...currentUser, activeTextColor: tc.value || undefined })}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow'
                          : 'bg-zinc-900/70 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span className={`text-sm ${tc.value || 'text-zinc-200'}`}>
                        {currentUser.displayName}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono-pip">
                        {tc.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Background Colors */}
          {customizationCategory === 'bg' && (
            <div className="space-y-3">
              <div className="text-xs font-mono-pip text-zinc-400">
                Выберите оттенок и градиент карточки профиля:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PRESET_BG_COLORS.map(bg => {
                  const isSelected = (currentUser.activeTextBg || '') === bg.value;
                  return (
                    <button
                      key={bg.label}
                      onClick={() => onUpdateProfile({ ...currentUser, activeTextBg: bg.value || undefined })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/40'
                          : 'border-zinc-800 hover:border-zinc-700'
                      } ${bg.value || 'bg-zinc-900'}`}
                    >
                      <span className="text-xs font-bold text-zinc-100">{bg.label}</span>
                      {isSelected && (
                        <span className="text-[10px] text-amber-300 font-mono-pip font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Выбрано
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
                const isCosmetic = item.type !== 'item';
                const isApplied =
                  (item.type === 'profile_theme' && currentUser.activeThemeId === item.appliedValue) ||
                  (item.type === 'profile_text_color' && currentUser.activeTextColor === item.appliedValue) ||
                  (item.type === 'profile_text_bg' && currentUser.activeTextBg === item.appliedValue) ||
                  (item.type === 'avatar_frame' && currentUser.activeAvatarFrame === item.appliedValue);

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
                  </div>
                );
              })}
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
    </div>
  );
};
