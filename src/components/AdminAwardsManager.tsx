import React, { useState } from 'react';
import { Award, UserProfile } from '../types';
import { PaletteColorSelector } from './PaletteColorSelector';
import { ALL_TEXT_COLORS, ALL_BG_COLORS } from '../services/palette';
import { Award as AwardIcon, Plus, Trash2, Sparkles, Check } from 'lucide-react';

interface AdminAwardsManagerProps {
  awards: Award[];
  profiles: UserProfile[];
  currentAdminUsername: string;
  onIssueAward: (award: Award) => void;
  onRevokeAward: (awardId: string) => void;
}

const BADGE_ICONS = [
  { icon: '🎖️', name: 'Медаль Пустоши' },
  { icon: '⭐', name: 'Звезда Шерифа' },
  { icon: '🪶', name: 'Стальное Крыло' },
  { icon: '💖', name: 'Квантовое Сердце' },
  { icon: '💀', name: 'Череп Рейдера' },
  { icon: '⚙️', name: 'Шестерня Магитеха' },
  { icon: '☢️', name: 'Знак Радиации' },
  { icon: '👑', name: 'Корона Анклава' },
  { icon: '⚡', name: 'Искра Мегазаклинания' },
  { icon: '📟', name: 'Пип-Бак Героя' }
];

const TITLE_COLORS = [
  { label: 'Золотой', class: 'text-amber-400' },
  { label: 'Лазурный', class: 'text-cyan-300' },
  { label: 'Изумрудный', class: 'text-emerald-400' },
  { label: 'Розовый Неон', class: 'text-pink-400' },
  { label: 'Алый', class: 'text-rose-400' },
  { label: 'Фиолетовый', class: 'text-purple-300' },
  { label: 'Белоснежный', class: 'text-white' }
];

const CARD_BACKGROUNDS = [
  { label: 'Золотой Закат', class: 'from-amber-950/80 via-zinc-900 to-black border-amber-500/60 shadow-amber-950/50' },
  { label: 'Квантовый Неон', class: 'from-slate-900 via-blue-950/80 to-zinc-950 border-cyan-500/50 shadow-cyan-950/40' },
  { label: 'Радиационный Свинец', class: 'from-emerald-950/80 via-zinc-900 to-black border-emerald-500/50 shadow-emerald-950/40' },
  { label: 'Рейдерский Мрак', class: 'from-red-950/80 via-zinc-900 to-zinc-950 border-red-500/50 shadow-red-950/40' },
  { label: 'Королевский Пурпур', class: 'from-purple-950/80 via-zinc-900 to-zinc-950 border-purple-500/50 shadow-purple-950/40' },
  { label: 'Матовый Карбон', class: 'from-zinc-900 to-zinc-950 border-zinc-700 shadow-zinc-950/50' }
];

export const AdminAwardsManager: React.FC<AdminAwardsManagerProps> = ({
  awards,
  profiles,
  currentAdminUsername,
  onIssueAward,
  onRevokeAward
}) => {
  const [selectedIcon, setSelectedIcon] = useState('🎖️');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipientUsername, setRecipientUsername] = useState(profiles[0]?.username || '@Starlight_Pip');
  const [titleColor, setTitleColor] = useState(TITLE_COLORS[0].class);
  const [cardBg, setCardBg] = useState(CARD_BACKGROUNDS[0].class);

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !recipientUsername.trim()) return;

    const newAward: Award = {
      id: 'award_' + Date.now(),
      recipientUsername: recipientUsername.trim().startsWith('@') ? recipientUsername.trim() : `@${recipientUsername.trim()}`,
      icon: selectedIcon,
      title: title.trim(),
      description: description.trim() || 'За особые заслуги перед жителями DustTown.',
      titleColor,
      textColor: 'text-zinc-200',
      cardBg,
      awardedBy: currentAdminUsername,
      awardedAt: new Date().toISOString()
    };

    onIssueAward(newAward);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold font-heading text-amber-400 uppercase tracking-wide">
          Вручение наград и орденов («Заслуги»)
        </h3>
        <p className="text-xs text-zinc-400">
          Создавайте уникальные награды с выбором одного из 10 значков, настраиваемыми цветами и вручайте их выжившим.
        </p>
      </div>

      {/* Creation Form */}
      <form
        onSubmit={handleIssue}
        className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/40 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-bold font-heading text-amber-300">
          <AwardIcon className="w-4 h-4 text-amber-400" />
          <span>Конструктор новой награды</span>
        </div>

        {/* 10 Badges Grid */}
        <div>
          <label className="block text-xs font-mono-pip text-zinc-300 mb-1.5">
            Выберите значок награды (10 доступных символов Пустоши):
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {BADGE_ICONS.map(badge => (
              <button
                key={badge.icon}
                type="button"
                onClick={() => setSelectedIcon(badge.icon)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  selectedIcon === badge.icon
                    ? 'bg-amber-500/20 border-amber-400 scale-110 shadow-lg'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
                title={badge.name}
              >
                <span className="text-2xl filter drop-shadow">{badge.icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recipient Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono-pip text-amber-300 mb-1">
              Кому вручить (Выберите сталкера):
            </label>
            <select
              value={recipientUsername}
              onChange={e => setRecipientUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono-pip"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.username}>
                  {p.displayName} ({p.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono-pip text-amber-300 mb-1">
              Название ордена / награды:
            </label>
            <input
              type="text"
              required
              placeholder="Например: Орден Железной Подковы"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
            Описание заслуги:
          </label>
          <textarea
            rows={2}
            placeholder="За храбрость в боях за Старый Мост..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Color Settings (20 Text Colors & 20 Backgrounds) */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono-pip text-zinc-300 mb-1.5 font-bold">
              Цвет заголовка награды (10 стандартных, 5 переливающихся, 5 градиентов):
            </label>
            <PaletteColorSelector
              type="text"
              selectedValue={titleColor}
              onSelect={val => setTitleColor(val)}
              sampleText={title || 'Название награды'}
            />
          </div>

          <div>
            <label className="block text-xs font-mono-pip text-zinc-300 mb-1.5 font-bold">
              Фон карточки награды (10 стандартных, 5 переливающихся, 5 градиентов):
            </label>
            <PaletteColorSelector
              type="bg"
              selectedValue={cardBg}
              onSelect={val => setCardBg(val)}
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="pt-2">
          <label className="block text-[11px] font-mono-pip text-zinc-400 mb-1.5 uppercase">
            Предпросмотр награды:
          </label>
          <div className={`p-4 rounded-2xl border bg-gradient-to-br ${cardBg} max-w-md shadow-lg`}>
            <div className="flex items-start gap-3.5">
              <span className="text-3xl filter drop-shadow">{selectedIcon}</span>
              <div className="flex-1 min-w-0">
                <h5 className={`text-sm font-bold font-heading ${titleColor}`}>
                  {title || 'Название награды'}
                </h5>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {description || 'Описание заслуги отображается здесь.'}
                </p>
                <div className="mt-2 text-[10px] text-zinc-400 font-mono-pip flex justify-between">
                  <span>Кому: {recipientUsername}</span>
                  <span>От: {currentAdminUsername}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow"
          >
            Вручить награду
          </button>
        </div>
      </form>

      {/* Existing Awards List */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono-pip text-zinc-400 uppercase tracking-wider font-bold">
          Врученные награды ({awards.length}):
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {awards.map(award => (
            <div
              key={award.id}
              className={`p-3.5 rounded-2xl border bg-gradient-to-br ${award.cardBg} flex items-start justify-between gap-3`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-2xl">{award.icon}</span>
                <div className="min-w-0">
                  <div className={`text-xs font-bold font-heading truncate ${award.titleColor}`}>
                    {award.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono-pip">
                    Кому: <span className="text-amber-300 font-bold">{award.recipientUsername}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1 line-clamp-2">
                    {award.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onRevokeAward(award.id)}
                className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition"
                title="Отозвать награду"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
