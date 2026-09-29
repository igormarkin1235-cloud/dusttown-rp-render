import React, { useState } from 'react';
import { Faction } from '../types';
import { ImageUploadInput } from './ImageUploadInput';
import {
  FACTION_BG_PRESETS,
  FACTION_TEXT_COLOR_PRESETS,
  FACTION_EMBLEM_PRESETS,
  FACTION_BANNER_PRESETS
} from '../services/palette';
import { Shield, Sparkles, X, Palette, Image as ImageIcon, Coins, Users, Check } from 'lucide-react';

interface AdminFactionModalProps {
  factionToEdit?: Faction | null;
  currentUserId: string;
  currentUsername: string;
  onSave: (faction: Faction) => void;
  onClose: () => void;
}

export const AdminFactionModal: React.FC<AdminFactionModalProps> = ({
  factionToEdit,
  currentUserId,
  currentUsername,
  onSave,
  onClose
}) => {
  const isEditing = Boolean(factionToEdit);

  const [name, setName] = useState(factionToEdit?.name || '');
  const [tag, setTag] = useState(factionToEdit?.tag || '');
  const [motto, setMotto] = useState(factionToEdit?.motto || '');
  const [description, setDescription] = useState(factionToEdit?.description || '');
  const [logoUrl, setLogoUrl] = useState(
    factionToEdit?.logoUrl || FACTION_EMBLEM_PRESETS[0]
  );
  const [bannerUrl, setBannerUrl] = useState(
    factionToEdit?.bannerUrl || FACTION_BANNER_PRESETS[0]
  );
  const [bgGradient, setBgGradient] = useState(
    factionToEdit?.bgGradient || FACTION_BG_PRESETS[1].value
  );
  const [textColor, setTextColor] = useState(
    factionToEdit?.textColor || FACTION_TEXT_COLOR_PRESETS[0].value
  );
  const [accentColor, setAccentColor] = useState(
    factionToEdit?.accentColor || FACTION_BG_PRESETS[1].accent
  );
  const [dailySalary, setDailySalary] = useState(factionToEdit?.dailySalary || 10);
  const [isRecruiting, setIsRecruiting] = useState(factionToEdit?.isRecruiting ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const factionId = factionToEdit?.id || 'faction_' + Date.now();

    const updatedFaction: Faction = {
      id: factionId,
      name: name.trim(),
      tag: (tag.trim() || name.slice(0, 3)).toUpperCase(),
      motto: motto.trim(),
      description: description.trim(),
      logoUrl,
      bannerUrl,
      accentColor,
      bgGradient,
      textColor,
      borderColor: `border-[${accentColor}]/50`,
      leaderUserId: factionToEdit?.leaderUserId || currentUserId,
      leaderUsername: factionToEdit?.leaderUsername || currentUsername,
      members: factionToEdit?.members || [
        {
          userId: currentUserId,
          username: currentUsername,
          displayName: currentUsername,
          avatarUrl: logoUrl,
          roleTitle: 'Глава Фракции',
          roleColor: 'text-amber-400',
          joinedAt: new Date().toISOString(),
          isLeader: true
        }
      ],
      isRecruiting,
      dailySalary: Number(dailySalary) || 10,
      createdAt: factionToEdit?.createdAt || new Date().toISOString(),
      createdBy: factionToEdit?.createdBy || currentUsername
    };

    onSave(updatedFaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-zinc-950 border border-amber-500/50 p-4 sm:p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading text-amber-300">
                {isEditing ? 'Редактировать фракцию' : 'Создать новую фракцию'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono-pip">
                Настройте эмблему, лор, визуальный стиль и жалование
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono-pip uppercase tracking-wider text-zinc-400">
            Предпросмотр карточки фракции:
          </span>
          <div className={`relative overflow-hidden rounded-2xl border border-zinc-700 bg-gradient-to-br ${bgGradient} p-4 text-white shadow-xl`}>
            {/* Banner Background */}
            {bannerUrl && (
              <div className="absolute inset-0 z-0 opacity-30">
                <img
                  src={bannerUrl}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>
            )}

            <div className="relative z-10 flex items-start gap-3.5">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shrink-0 bg-zinc-950 shadow-md">
                <img
                  src={logoUrl || FACTION_EMBLEM_PRESETS[0]}
                  alt="Emblem"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-[10px] font-mono-pip font-bold text-amber-300">
                    [{tag.trim() ? tag.toUpperCase() : 'TAG'}]
                  </span>
                  <h4 className={`text-base font-black truncate font-heading ${textColor}`}>
                    {name.trim() || 'Название фракции'}
                  </h4>
                </div>

                {motto && (
                  <p className="text-xs italic text-zinc-200 mt-1 line-clamp-1">
                    «{motto}»
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono-pip text-zinc-300">
                  <span className="px-2 py-0.5 rounded bg-black/50 border border-white/10 flex items-center gap-1">
                    <Users className="w-3 h-3 text-cyan-400" />
                    {factionToEdit?.members?.length || 1} участников
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    +{dailySalary} ℰQ в день
                  </span>
                  <span className={`px-2 py-0.5 rounded ${isRecruiting ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}>
                    {isRecruiting ? 'Открытый набор' : 'Закрытая фракция'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Название фракции *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="например: Стальные Рейнджеры Эквестрии"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Тег / Аббревиатура
              </label>
              <input
                type="text"
                maxLength={6}
                value={tag}
                onChange={e => setTag(e.target.value.toUpperCase())}
                placeholder="СРЭ"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-amber-300 font-mono-pip font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
              Девиз / Слоган фракции
            </label>
            <input
              type="text"
              value={motto}
              onChange={e => setMotto(e.target.value)}
              placeholder="«Сталь хранит память предков, единство дарует силу»"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 italic"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
              Лор, История, База и Правила фракции
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Опишите историю возникновения, базу дислокации, цели фракции в Пустоши..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Photo upload: Logo / Emblem */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 font-mono-pip">
              <ImageIcon className="w-4 h-4" />
              Эмблема / Логотип фракции (Превью-фото)
            </div>
            <ImageUploadInput
              value={logoUrl}
              onChange={setLogoUrl}
              label="Загрузить собственное фото или URL логотипа"
              placeholder="URL изображения эмблемы или загрузите файл с устройства"
              presetList={FACTION_EMBLEM_PRESETS}
            />
          </div>

          {/* Photo upload: Banner */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 font-mono-pip">
              <ImageIcon className="w-4 h-4" />
              Фоновый баннер профиля фракции
            </div>
            <ImageUploadInput
              value={bannerUrl}
              onChange={setBannerUrl}
              label="Загрузить баннер или выбрать фоновое фото"
              placeholder="URL баннера или загрузите фото с устройства"
              presetList={FACTION_BANNER_PRESETS}
            />
          </div>

          {/* Visual Customization: Background Gradients */}
          <div className="space-y-2">
            <label className="block text-xs font-mono-pip text-zinc-300">
              Градиентный фон профиля:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FACTION_BG_PRESETS.map(bg => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => {
                    setBgGradient(bg.value);
                    setAccentColor(bg.accent);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                    bgGradient === bg.value
                      ? 'border-amber-400 bg-amber-500/20 text-white font-bold'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${bg.value} border border-white/20`} />
                    <span className="text-[11px] truncate">{bg.label}</span>
                  </div>
                  {bgGradient === bg.value && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Customization: Text Color */}
          <div className="space-y-2">
            <label className="block text-xs font-mono-pip text-zinc-300">
              Стиль текста заголовка:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FACTION_TEXT_COLOR_PRESETS.map(tc => (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => setTextColor(tc.value)}
                  className={`p-2 rounded-xl border text-left text-xs transition ${
                    textColor === tc.value
                      ? 'border-amber-400 bg-amber-500/20 text-white'
                      : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                  }`}
                >
                  <span className={`text-[11px] ${tc.value}`}>
                    {tc.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Economic and Recruitment Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                Ежедневное жалование (ℰQ/день)
              </label>
              <input
                type="number"
                min={0}
                max={500}
                value={dailySalary}
                onChange={e => setDailySalary(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-emerald-400 font-mono-pip font-bold focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Игроки получают эту сумму каждый день автоматически даже оффлайн!
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Статус приёма бойцов
              </label>
              <select
                value={isRecruiting ? 'open' : 'closed'}
                onChange={e => setIsRecruiting(e.target.value === 'open')}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-mono-pip focus:outline-none focus:border-amber-400"
              >
                <option value="open">🟢 Открытый набор (любой игрок может вступить)</option>
                <option value="closed">🔴 Закрытая фракция (только по приглашению)</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono-pip transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-heading font-black uppercase tracking-wider shadow-lg transition"
            >
              {isEditing ? 'Сохранить изменения' : 'Создать фракцию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
