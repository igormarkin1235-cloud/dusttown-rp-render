import React, { useState } from 'react';
import { UserProfile, ArtworkPost } from '../types';
import { ImageUploadInput } from './ImageUploadInput';
import {
  Pin,
  Plus,
  Trash2,
  Maximize2,
  X,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Check,
  Edit2,
  Flame,
  Zap,
  Radio,
  ExternalLink,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  ProfilePhotoWithEffects,
  ProfileEffectType,
  PROFILE_EFFECT_OPTIONS
} from './ProfilePhotoWithEffects';

interface ProfilePinnedArtsShowcaseProps {
  currentUser: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
  artworks?: ArtworkPost[];
  isReadOnly?: boolean; // For PlayerProfileModal
}

const PRESET_WASTELAND_ARTS = [
  {
    title: 'Хроники Пустоши 091C',
    url: '/backgrounds/img_091c.jpg'
  },
  {
    title: 'Архивы Пустоши 2EAE',
    url: '/backgrounds/img_2eae_564.jpg'
  },
  {
    title: 'Искорка Кола: Вкус Моркови',
    url: '/backgrounds/sparkle_cola.jpg'
  },
  {
    title: 'Пинки Пай Следит за Тобой',
    url: '/backgrounds/pinkie_watching.jpg'
  },
  {
    title: 'Министерство Военных Технологий',
    url: '/backgrounds/mowt_hero.jpg'
  },
  {
    title: 'Герои Эквестрийской Пустоши',
    url: '/backgrounds/foe_heroes.jpg'
  },
  {
    title: 'Закат над Пустошью',
    url: '/backgrounds/sunset_peaks.jpg'
  },
  {
    title: 'Кровавый Каньон',
    url: '/backgrounds/crimson_canyon.jpg'
  },
  {
    title: 'Башня в Ледяной Буре',
    url: '/backgrounds/blizzard_tower.jpg'
  },
  {
    title: 'Страж Цитадели Стальных Крыльев',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Закат над руинами Даст Тауна',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Экспедиция в Радиационный Разлом',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Квантовый алтарь Магитехов',
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Броня Рейнджера Пустоши',
    url: 'https://images.unsplash.com/photo-1589793907316-f94025b46850?auto=format&fit=crop&w=800&q=80'
  }
];

export const ProfilePinnedArtsShowcase: React.FC<ProfilePinnedArtsShowcaseProps> = ({
  currentUser,
  onUpdateProfile,
  artworks = [],
  isReadOnly = false
}) => {
  const pinnedList = currentUser.pinnedArts || [];
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [lightboxArt, setLightboxArt] = useState<{ url: string; title?: string; fitMode?: 'contain' | 'cover' } | null>(null);
  const [isLightboxZoomed, setIsLightboxZoomed] = useState(false);
  const [bgEffectPhoto, setBgEffectPhoto] = useState<{ url: string; title?: string } | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<ProfileEffectType>(currentUser.customBgEffect || 'embers');
  const [bgPosition, setBgPosition] = useState<'center' | 'top' | 'bottom'>(currentUser.customBgPosition || 'center');

  // Modal form state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [slotFitMode, setSlotFitMode] = useState<'contain' | 'cover'>('contain');
  const [modalTab, setModalTab] = useState<'url' | 'gallery' | 'presets'>('url');

  const handleApplyBackground = (effectToApply: ProfileEffectType = selectedEffect) => {
    if (!bgEffectPhoto || !onUpdateProfile) return;
    onUpdateProfile({
      ...currentUser,
      activeThemeId: 'bg_custom_photo',
      customBgUrl: bgEffectPhoto.url,
      customBgEffect: effectToApply,
      customBgPosition: bgPosition
    });
    setBgEffectPhoto(null);
  };

  const handleResetBackground = () => {
    if (!onUpdateProfile) return;
    onUpdateProfile({
      ...currentUser,
      activeThemeId: 'default',
      customBgUrl: undefined,
      customBgEffect: undefined,
      customBgPosition: undefined
    });
    setBgEffectPhoto(null);
  };

  const handleToggleSlotFit = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly || !onUpdateProfile) return;
    const newPinned = [...pinnedList];
    const cur = newPinned[slotIndex];
    if (!cur) return;
    const nextFit = cur.fitMode === 'cover' ? 'contain' : 'cover';
    newPinned[slotIndex] = {
      ...cur,
      fitMode: nextFit
    };
    onUpdateProfile({
      ...currentUser,
      pinnedArts: newPinned
    });
  };

  const openSlotEditor = (slotIndex: number) => {
    if (isReadOnly) return;
    setActiveSlot(slotIndex);
    const existing = pinnedList[slotIndex];
    if (existing) {
      setPhotoUrl(existing.url);
      setPhotoTitle(existing.title || '');
      setSlotFitMode(existing.fitMode || 'contain');
    } else {
      setPhotoUrl('');
      setPhotoTitle('');
      setSlotFitMode('contain');
    }
    setModalTab('url');
  };

  const handleSaveSlot = () => {
    if (activeSlot === null || !photoUrl.trim() || !onUpdateProfile) return;

    const newPinned = [...pinnedList];
    newPinned[activeSlot] = {
      id: 'pin_' + (activeSlot + 1) + '_' + Date.now(),
      url: photoUrl.trim(),
      title: photoTitle.trim() || `Арт #${activeSlot + 1}`,
      fitMode: slotFitMode
    };

    onUpdateProfile({
      ...currentUser,
      pinnedArts: newPinned.slice(0, 3)
    });

    setActiveSlot(null);
  };

  const handleRemoveSlot = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly || !onUpdateProfile) return;

    const newPinned = [...pinnedList];
    newPinned.splice(slotIndex, 1);

    onUpdateProfile({
      ...currentUser,
      pinnedArts: newPinned
    });
  };

  if (isReadOnly && pinnedList.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-lg relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Pin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold font-heading uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              <span>Витрина артов и фото</span>
              <span className="text-[10px] font-mono-pip px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {pinnedList.length}/3
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 font-sans">
              {isReadOnly
                ? 'Закреплённые работы и иллюстрации сталкера'
                : 'Закрепите до 3 артов или фото в профиле для показа другим игрокам'}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Showcase Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[0, 1, 2].map(slotIndex => {
          const item = pinnedList[slotIndex];

          if (item) {
            const isCurrentBg =
              (currentUser.activeThemeId === 'bg_custom_photo' || currentUser.customBgUrl === item.url) &&
              currentUser.customBgUrl === item.url;

            return (
              <div
                key={item.id || slotIndex}
                onClick={() => setLightboxArt(item)}
                className="group relative rounded-2xl overflow-hidden border border-amber-500/40 bg-zinc-950 shadow-md cursor-pointer hover:border-amber-400 hover:shadow-amber-500/10 hover:shadow-xl transition-all h-64 sm:h-72 flex flex-col justify-end"
              >
                {/* Safe uncropped image display with ambient blurred glow */}
                <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center filter blur-md opacity-35 scale-110 pointer-events-none transition-transform duration-700 group-hover:scale-120"
                    style={{ backgroundImage: `url(${item.url})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10 pointer-events-none" />

                  {/* Main artwork - fully visible without cropping in contain mode */}
                  <img
                    src={item.url}
                    alt={item.title || 'Pinned Art'}
                    className={`relative z-10 max-h-full max-w-full ${
                      item.fitMode === 'cover' ? 'w-full h-full object-cover' : 'object-contain p-2'
                    } transition-transform duration-500 group-hover:scale-105 filter drop-shadow-md`}
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                </div>

                {/* Badges on Top-Left */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                  {isCurrentBg && (
                    <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-[9px] uppercase font-mono-pip flex items-center gap-1 shadow-lg backdrop-blur-sm border border-amber-300 animate-pulse">
                      <Sparkles className="w-2.5 h-2.5 fill-black" />
                      <span>Фон</span>
                    </div>
                  )}
                  <span className={`px-1.5 py-0.5 rounded-md border text-[8px] font-mono-pip font-bold shadow ${
                    item.fitMode === 'cover'
                      ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                      : 'bg-black/80 border-zinc-700 text-zinc-300'
                  }`}>
                    {item.fitMode === 'cover' ? 'Заполнение' : 'Целиком 100%'}
                  </span>
                </div>

                {/* Top Action Buttons (if editable) */}
                {!isReadOnly && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition z-10">
                    <button
                      onClick={e => handleToggleSlotFit(slotIndex, e)}
                      className="p-1.5 rounded-lg bg-black/80 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-zinc-700 shadow"
                      title={item.fitMode === 'cover' ? 'Сделать: Целиком без обрезки' : 'Сделать: Заполнить слот'}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setBgEffectPhoto(item);
                        setSelectedEffect(currentUser.customBgEffect || 'embers');
                        setBgPosition(currentUser.customBgPosition || 'center');
                      }}
                      className={`p-1.5 rounded-lg border shadow transition ${
                        isCurrentBg
                          ? 'bg-amber-500 text-black border-amber-300'
                          : 'bg-black/80 hover:bg-amber-500 hover:text-black text-amber-300 border-zinc-700'
                      }`}
                      title="Сделать фоном профиля с эффектами"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openSlotEditor(slotIndex);
                      }}
                      className="p-1.5 rounded-lg bg-black/80 hover:bg-zinc-800 text-amber-300 border border-zinc-700 shadow"
                      title="Заменить арт"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => handleRemoveSlot(slotIndex, e)}
                      className="p-1.5 rounded-lg bg-black/80 hover:bg-rose-950 text-rose-400 border border-rose-900/60 shadow"
                      title="Убрать из витрины"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Bottom Caption & Zoom Icon */}
                <div className="relative z-10 p-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-100 truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    {item.title || `Слот #${slotIndex + 1}`}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-black/60 border border-zinc-700/80 flex items-center justify-center text-zinc-300 group-hover:text-amber-400 shrink-0">
                    <Maximize2 className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          }

          // Empty Slot
          if (isReadOnly) return null;

          return (
            <button
              key={slotIndex}
              onClick={() => openSlotEditor(slotIndex)}
              className="rounded-xl border-2 border-dashed border-zinc-800 hover:border-amber-500/60 bg-zinc-900/40 hover:bg-zinc-900/80 p-4 transition-all aspect-[4/3] flex flex-col items-center justify-center gap-2 group text-center"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800/80 group-hover:bg-amber-500/20 text-zinc-400 group-hover:text-amber-300 flex items-center justify-center transition border border-zinc-700/50 group-hover:border-amber-500/40 shadow-inner">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-heading font-bold text-zinc-300 group-hover:text-amber-300">
                  Слот {slotIndex + 1}
                </div>
                <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                  + Закрепить арт / фото
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Editor Modal */}
      {activeSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Pin className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-heading text-white">
                  Закрепить в слот {activeSlot + 1}
                </h3>
              </div>
              <button
                onClick={() => setActiveSlot(null)}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                onClick={() => setModalTab('url')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-heading font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                  modalTab === 'url' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Ссылка / Загрузка</span>
              </button>
              {artworks.length > 0 && (
                <button
                  onClick={() => setModalTab('gallery')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-heading font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    modalTab === 'gallery' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Из Галереи</span>
                </button>
              )}
              <button
                onClick={() => setModalTab('presets')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-heading font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                  modalTab === 'presets' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Пресеты</span>
              </button>
            </div>

            {/* Tab 1: URL / Upload */}
            {modalTab === 'url' && (
              <div className="space-y-3">
                <ImageUploadInput
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  label="Прямая ссылка на арт или фото:"
                  placeholder="https://..."
                />
              </div>
            )}

            {/* Tab 2: From Gallery */}
            {modalTab === 'gallery' && (
              <div className="space-y-2">
                <label className="text-xs font-mono-pip text-zinc-400">
                  Выберите опубликованный арт из Галереи Даст Таун:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {artworks.map(art => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        setPhotoUrl(art.imageUrl);
                        setPhotoTitle(art.title);
                      }}
                      className={`relative rounded-xl overflow-hidden border aspect-video p-1 text-left transition group ${
                        photoUrl === art.imageUrl
                          ? 'border-amber-400 ring-2 ring-amber-400/50'
                          : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] font-bold text-white truncate">{art.title}</span>
                      </div>
                      {photoUrl === art.imageUrl && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Wasteland Presets */}
            {modalTab === 'presets' && (
              <div className="space-y-2">
                <label className="text-xs font-mono-pip text-zinc-400">
                  Готовые атмосферные иллюстрации Fallout: Equestria:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {PRESET_WASTELAND_ARTS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPhotoUrl(preset.url);
                        setPhotoTitle(preset.title);
                      }}
                      className={`relative rounded-xl overflow-hidden border aspect-video text-left transition group ${
                        photoUrl === preset.url
                          ? 'border-amber-400 ring-2 ring-amber-400/50'
                          : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] font-bold text-white truncate">{preset.title}</span>
                      </div>
                      {photoUrl === preset.url && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caption / Title */}
            <div>
              <label className="block text-xs font-mono-pip text-amber-300 mb-1">
                Подпись / Название (опционально):
              </label>
              <input
                type="text"
                value={photoTitle}
                onChange={e => setPhotoTitle(e.target.value)}
                placeholder="Например: Мой пегас-снайпер"
                maxLength={40}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Fit mode selector */}
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1.5">
                Режим отображения в слоте:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSlotFitMode('contain')}
                  className={`py-2 px-3 rounded-xl border text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 ${
                    slotFitMode === 'contain'
                      ? 'bg-amber-500 text-black border-amber-400 shadow'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Целиком (без обрезки)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFitMode('cover')}
                  className={`py-2 px-3 rounded-xl border text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 ${
                    slotFitMode === 'cover'
                      ? 'bg-amber-500 text-black border-amber-400 shadow'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Заполнить карточку</span>
                </button>
              </div>
            </div>

            {/* Image Preview with Ambient Background */}
            {photoUrl && (
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 h-40 bg-zinc-950 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-md opacity-35 scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${photoUrl})` }}
                />
                <img
                  src={photoUrl}
                  alt="Preview"
                  className={`relative z-10 w-full h-full ${
                    slotFitMode === 'cover' ? 'object-cover' : 'object-contain p-1'
                  }`}
                  onError={e => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 text-[9px] font-mono-pip text-amber-300 z-20 border border-zinc-700">
                  {slotFitMode === 'cover' ? 'Режим: Заполнение' : 'Режим: Целиком'}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveSlot(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono-pip"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveSlot}
                disabled={!photoUrl.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-heading font-black text-xs uppercase tracking-wider shadow"
              >
                Закрепить в профиле
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxArt && (
        <div
          onClick={() => {
            setLightboxArt(null);
            setIsLightboxZoomed(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[95vh] rounded-3xl overflow-hidden border border-amber-500/50 bg-zinc-950 shadow-2xl flex flex-col"
          >
            <div className="p-3.5 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Pin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm font-bold font-heading text-zinc-100 truncate">
                  {lightboxArt.title || 'Арт из витрины'}
                </span>
                <span className="text-[10px] font-mono-pip text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
                  {isLightboxZoomed ? '100% масштаб' : 'По экрану (Fit)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsLightboxZoomed(!isLightboxZoomed)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono-pip transition border border-zinc-700"
                  title="Переключить масштаб (По размеру экрана / 100% оригинал)"
                >
                  {isLightboxZoomed ? <ZoomOut className="w-3.5 h-3.5 text-amber-400" /> : <ZoomIn className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isLightboxZoomed ? 'По экрану' : '100% зум'}</span>
                </button>
                <a
                  href={lightboxArt.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono-pip transition border border-zinc-700"
                  title="Открыть исходный файл в новой вкладке"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Исходник</span>
                </a>
                {!isReadOnly && (
                  <button
                    onClick={() => {
                      setBgEffectPhoto(lightboxArt);
                      setSelectedEffect(currentUser.customBgEffect || 'embers');
                      setBgPosition(currentUser.customBgPosition || 'center');
                      setLightboxArt(null);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-heading uppercase transition shadow active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-black" />
                    <span>Фоном</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setLightboxArt(null);
                    setIsLightboxZoomed(false);
                  }}
                  className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 sm:p-4 flex-1 flex items-center justify-center bg-black overflow-auto max-h-[82vh]">
              <img
                src={lightboxArt.url}
                alt={lightboxArt.title || 'Pinned Art'}
                className={`${
                  isLightboxZoomed
                    ? 'w-auto max-w-none cursor-zoom-out'
                    : 'max-h-[78vh] w-auto max-w-full object-contain cursor-zoom-in'
                } rounded-xl transition-all duration-300 shadow-2xl`}
                onClick={() => setIsLightboxZoomed(!isLightboxZoomed)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Background & Effects Modal */}
      {bgEffectPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-zinc-900 border border-amber-500/40 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                    Установка фона профиля с эффектом
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {bgEffectPhoto.title || 'Выбранное изображение'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBgEffectPhoto(null)}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Card Preview with Effects and Focal Position applied */}
            <div>
              <div className="text-[11px] font-mono-pip text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Предпросмотр карточки профиля</span>
                <span className="text-amber-400 font-bold">
                  Эффект: {PROFILE_EFFECT_OPTIONS.find(o => o.id === selectedEffect)?.name}
                </span>
              </div>
              <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden border border-amber-500/40 shadow-xl bg-zinc-950 flex flex-col justify-between p-4">
                {/* Simulated live effect renderer with focal position */}
                <ProfilePhotoWithEffects
                  imageUrl={bgEffectPhoto.url}
                  effect={selectedEffect}
                  position={bgPosition}
                  badgeText="LIVE PREVIEW"
                />

                {/* Simulated Profile Card Elements to verify readability */}
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-zinc-900 overflow-hidden shadow-lg">
                    <img
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-bold font-heading text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      {currentUser.displayName || currentUser.username}
                    </div>
                    <div className="text-[11px] font-mono-pip text-amber-300 drop-shadow">
                      {currentUser.factionRole || currentUser.bio || 'Сталкер Пустоши'} • ℰQ: {currentUser.equivaxes}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-200">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 font-mono-pip text-[10px]">
                    Ивенты: {currentUser.eventsAttended} | РП: {currentUser.plannedRpsAttended}
                  </span>
                  <span className="text-[10px] font-mono-pip text-amber-400 font-bold bg-amber-950/70 px-2 py-0.5 rounded border border-amber-500/40">
                    ЭФФЕКТ: {selectedEffect.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Effect Selectors */}
            <div>
              <label className="block text-xs font-heading font-bold text-zinc-200 uppercase tracking-wider mb-2">
                Выберите визуальный эффект для фона:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROFILE_EFFECT_OPTIONS.map(opt => {
                  const isOptSelected = selectedEffect === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedEffect(opt.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition active:scale-[0.98] ${
                        isOptSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                          : 'bg-zinc-800/60 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300'
                      }`}
                    >
                      <span className="text-xl shrink-0 p-1 rounded-lg bg-black/40 border border-white/5">
                        {opt.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold font-heading truncate">
                            {opt.name}
                          </span>
                          <span className="text-[9px] font-mono-pip px-1.5 py-0.2 rounded bg-black/50 text-zinc-400 border border-white/5">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-2 leading-tight mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 pt-3 border-t border-zinc-800">
              {currentUser.customBgUrl === bgEffectPhoto.url ? (
                <button
                  type="button"
                  onClick={handleResetBackground}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950 text-rose-300 border border-rose-900/50 text-xs font-mono-pip transition"
                >
                  Сбросить фон профиля
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setBgEffectPhoto(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono-pip"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyBackground(selectedEffect)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>Применить как фон</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
