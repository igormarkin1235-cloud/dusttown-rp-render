import React, { useState } from 'react';
import { RPEvent, UserProfile, EventCategory, CompletionOutcome } from '../types';
import { ImageUploadInput } from './ImageUploadInput';
import { EventCompletionModal } from './EventCompletionModal';
import { PaletteColorSelector } from './PaletteColorSelector';
import {
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  Plus,
  Sparkles,
  AlertCircle,
  Clock,
  Coins,
  Handshake,
  ExternalLink,
  Flame,
  Calendar
} from 'lucide-react';

interface AdminEventsManagerProps {
  currentUser: UserProfile;
  events: RPEvent[];
  profiles: UserProfile[];
  onCreateEvent: (event: RPEvent) => void;
  onTogglePauseEvent: (eventId: string) => void;
  onCompleteEvent: (outcome: CompletionOutcome) => void;
  onDeleteEvent: (eventId: string) => void;
}

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
];

const TEXT_COLOR_PRESETS = [
  { label: 'Стандартный', value: 'text-zinc-100' },
  { label: 'Янтарный Неон', value: 'text-amber-300 drop-shadow-[0_0_8px_#f59e0b]' },
  { label: 'Радиационный Зелёный', value: 'text-emerald-400 drop-shadow-[0_0_8px_#10b981]' },
  { label: 'Квантовый Голубой', value: 'text-cyan-300 drop-shadow-[0_0_8px_#06b6d4]' },
  { label: 'Розовый Шиммер', value: 'text-pink-400 drop-shadow-[0_0_8px_#ec4899]' }
];

const BG_GRADIENT_PRESETS = [
  { label: 'Стандартная Тёмная Пустошь', value: 'from-zinc-950 to-zinc-900 border-zinc-800' },
  { label: 'Радиационный Сектор', value: 'from-emerald-950/40 via-zinc-950 to-zinc-950 border-emerald-500/40' },
  { label: 'Кибернетический Шлюз', value: 'from-cyan-950/40 via-zinc-950 to-zinc-950 border-cyan-500/40' },
  { label: 'Пурпурная Аномалия', value: 'from-purple-950/40 via-zinc-950 to-zinc-950 border-purple-500/40' },
  { label: 'Золотой Альянс', value: 'from-amber-950/50 via-zinc-950 to-yellow-950/40 border-amber-500/50' }
];

export const AdminEventsManager: React.FC<AdminEventsManagerProps> = ({
  currentUser,
  events,
  profiles,
  onCreateEvent,
  onTogglePauseEvent,
  onCompleteEvent,
  onDeleteEvent
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [type, setType] = useState<EventCategory>('event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Шлюзы DustTown, Сектор Запад');
  const [faction, setFaction] = useState('Ополчение Даст Таун Колектив');
  const [hasGM, setHasGM] = useState(true);
  const [rewardEquivaxes, setRewardEquivaxes] = useState(150);
  const [bannerUrl, setBannerUrl] = useState(PRESET_BANNERS[0]);
  const [hasRainbowText, setHasRainbowText] = useState(false);
  const [hoursFromNow, setHoursFromNow] = useState(24);
  const [isPreRelease, setIsPreRelease] = useState(false);
  const [textColor, setTextColor] = useState(TEXT_COLOR_PRESETS[0].value);
  const [bgGradient, setBgGradient] = useState(BG_GRADIENT_PRESETS[0].value);

  // Collab fields
  const [collabClanName, setCollabClanName] = useState('');
  const [collabClanUrl, setCollabClanUrl] = useState('');

  // Event completion modal state (review attendance and issue penalties)
  const [completingEvent, setCompletingEvent] = useState<RPEvent | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvent: RPEvent = {
      id: 'event_' + Date.now(),
      type,
      title,
      description,
      location,
      faction,
      hasGM,
      bannerUrl,
      startTime: new Date(Date.now() + 1000 * 60 * 60 * hoursFromNow).toISOString(),
      rewardEquivaxes: Number(rewardEquivaxes) || 100,
      isPaused: false,
      isCompleted: false,
      hasRainbowText: type === 'planned_rp' ? true : hasRainbowText,
      participants: [],
      collabClanName: type === 'collab' ? collabClanName.trim() : undefined,
      collabClanUrl: type === 'collab' ? collabClanUrl.trim() : undefined,
      isPreRelease,
      authorUsername: type === 'planned_rp' ? currentUser.username : undefined,
      authorDisplayName: type === 'planned_rp' ? currentUser.displayName : undefined,
      textColor,
      bgGradient
    };

    onCreateEvent(newEvent);
    setIsCreating(false);
    setTitle('');
    setDescription('');
    setCollabClanName('');
    setCollabClanUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-heading text-amber-400 uppercase tracking-wide">
            Управление Ивентами, Событиями и РП
          </h3>
          <p className="text-xs text-zinc-400">
            Публикуйте внутренние <strong>Ивенты</strong>, <strong>События-коллаборации</strong> с кланами (бегущая строка наверху) и <strong>РП-сессии</strong>. Бот автоматически уведомит группу!
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-xs shadow flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Закрыть' : 'Новое объявление'}</span>
        </button>
      </div>

      {/* Creation Form */}
      {isCreating && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/50 shadow-xl space-y-4 animate-fade-in"
        >
          <div className="space-y-1.5">
            <span className="text-xs font-mono-pip text-zinc-300">Категория публикации:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('event');
                  setHasRainbowText(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'event'
                    ? 'bg-amber-500 text-black shadow-lg ring-1 ring-amber-300'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>🔥 Ивент (Внутренний)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('collab');
                  setHasRainbowText(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'collab'
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-black shadow-lg ring-1 ring-amber-300'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                }`}
              >
                <Handshake className="w-4 h-4" />
                <span>🤝 Событие (Коллаборация)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('planned_rp');
                  setHasRainbowText(true);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'planned_rp'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg ring-1 ring-pink-400'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>🌸 РП-Сессия</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono-pip mt-1">
              {type === 'event' && '💡 Ивент публикуется во вкладку «Ивенты» как мероприятие внутри нашего комьюнити.'}
              {type === 'collab' && '💡 Событие — это коллаборация с другим кланом. Оно появится в стильной бегущей строке в самом верху приложения!'}
              {type === 'planned_rp' && '💡 РП-Сессия публикуется во вкладку «РП-Сессии» с таймером и радужной подсветкой.'}
            </p>
          </div>

          {/* If Collab: Partner clan inputs */}
          {type === 'collab' && (
            <div className="p-4 rounded-xl border-2 border-dashed border-amber-500/60 bg-amber-950/20 space-y-3 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-amber-300">
                <Handshake className="w-4 h-4 text-amber-400" />
                <span>Настройки клана-партнёра коллаборации:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                    Название клана/группы:
                  </label>
                  <input
                    type="text"
                    required={type === 'collab'}
                    placeholder="Например: Стальные Рейнджеры / Анклав"
                    value={collabClanName}
                    onChange={e => setCollabClanName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                    Ссылка на Telegram группу/канал клана:
                  </label>
                  <input
                    type="url"
                    placeholder="https://t.me/ClanGroupLink"
                    value={collabClanUrl}
                    onChange={e => setCollabClanUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-cyan-300 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-pip text-amber-300 mb-1">Заголовок:</label>
              <input
                type="text"
                required
                placeholder="Например: Штурм Рейдерской Цитадели"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-heading text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-amber-300 mb-1">Локация:</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Фракция:</label>
              <input
                type="text"
                value={faction}
                onChange={e => setFaction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Ведущий (GM):</label>
              <select
                value={hasGM ? 'yes' : 'no'}
                onChange={e => setHasGM(e.target.value === 'yes')}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono-pip"
              >
                <option value="yes">Есть GM (Ведущий)</option>
                <option value="no">Без GM (Свободная игра)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Награда (ℰQ):</label>
              <input
                type="number"
                min="0"
                value={rewardEquivaxes}
                onChange={e => setRewardEquivaxes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Старт через (часов):</label>
              <input
                type="number"
                min="1"
                value={hoursFromNow}
                onChange={e => setHoursFromNow(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Описание:</label>
            <textarea
              rows={3}
              required
              placeholder="Подробности вылазки или правила коллаборации..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Banner with File Upload from Device Gallery */}
          <ImageUploadInput
            label="Баннер / Фотография (загрузите из галереи или вставьте URL):"
            value={bannerUrl}
            onChange={setBannerUrl}
            presets={PRESET_BANNERS}
            helperText="Поддерживается выбор любой фотографии с телефона/ПК через кнопку «Из галереи»."
          />

          {/* Color & Gradient Styling Customization (Full 20-color & 20-bg palette) */}
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1.5 font-bold">
                Цвет заголовка / текста (10 стандартных, 5 переливающихся, 5 градиентов):
              </label>
              <PaletteColorSelector
                type="text"
                selectedValue={textColor}
                onSelect={val => setTextColor(val)}
                sampleText={title || 'Название события'}
              />
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1.5 font-bold">
                Фон и рамка карточки (10 стандартных, 5 переливающихся, 5 градиентов):
              </label>
              <PaletteColorSelector
                type="bg"
                selectedValue={bgGradient}
                onSelect={val => setBgGradient(val)}
              />
            </div>
          </div>

          {/* Pre-Release VIP Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 cursor-pointer hover:border-purple-400 transition">
            <input
              type="checkbox"
              checked={isPreRelease}
              onChange={e => setIsPreRelease(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 bg-zinc-950 border-zinc-700 focus:ring-purple-500 focus:ring-offset-zinc-950"
            />
            <div className="text-xs">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                👑 Опубликовать во вкладку «Пред-релиз» (только для VIP-игроков)
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Игроки с VIP смогут увидеть анонс и детали заранее, но запись будет закрыта до официального релиза.
              </p>
            </div>
          </label>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Опубликовать и оповестить группу</span>
          </button>
        </form>
      )}

      {/* List of Published Events & Collabs */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono-pip text-zinc-400 uppercase tracking-wider">
          Опубликованные анонсы ({events.length})
        </h4>

        {events.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
            Нет созданных ивентов или сессий. Нажмите «Новое объявление», чтобы опубликовать!
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <div
                key={event.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-zinc-700 shadow-md"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/60 border border-zinc-700 shrink-0">
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-bold text-sm text-zinc-100 truncate">
                        {event.title}
                      </span>

                      {event.type === 'collab' ? (
                        <span className="px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-black text-[9px] font-mono-pip font-extrabold uppercase">
                          🤝 СОБЫТИЕ (КОЛЛАБ)
                        </span>
                      ) : event.type === 'planned_rp' ? (
                        <span className="px-2 py-0.2 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[9px] font-mono-pip font-bold uppercase">
                          🌸 РП-СЕССИЯ
                        </span>
                      ) : (
                        <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono-pip font-bold uppercase">
                          🔥 ИВЕНТ
                        </span>
                      )}

                      {event.isCompleted && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[9px] font-mono-pip">
                          ЗАКРЫТО
                        </span>
                      )}
                      {event.isPaused && (
                        <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-500/40 text-[9px] font-mono-pip">
                          ПАУЗА
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-zinc-400 font-mono-pip mt-1 flex flex-wrap items-center gap-3">
                      <span>{event.location}</span>
                      <span>•</span>
                      <span className="text-amber-400">+{event.rewardEquivaxes} ℰQ</span>
                      <span>•</span>
                      <span>Участников: {event.participants.length}</span>
                      {event.collabClanName && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-300 font-bold">
                            Клан: {event.collabClanName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => onTogglePauseEvent(event.id)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition"
                    title={event.isPaused ? 'Возобновить' : 'Приостановить'}
                  >
                    {event.isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
                  </button>

                  <button
                    onClick={() => setCompletingEvent(event)}
                    disabled={event.isCompleted}
                    className={`p-2 rounded-xl border transition ${
                      event.isCompleted
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-500/40 text-emerald-300'
                    }`}
                    title="Завершить ивент / РП: отметить присутствовавших и оштрафовать прогульщиков"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Удалить «${event.title}»?`)) {
                        onDeleteEvent(event.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 transition"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completion & Attendance Review Modal */}
      {completingEvent && (
        <EventCompletionModal
          event={completingEvent}
          profiles={profiles}
          onConfirm={outcome => {
            onCompleteEvent(outcome);
            setCompletingEvent(null);
          }}
          onClose={() => setCompletingEvent(null)}
        />
      )}
    </div>
  );
};
