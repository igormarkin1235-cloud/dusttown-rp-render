import React, { useState } from 'react';
import { RPEvent, UserProfile } from '../types';
import { Play, Pause, CheckCircle2, Trash2, Plus, Sparkles, AlertCircle, Clock, Coins } from 'lucide-react';

interface AdminEventsManagerProps {
  events: RPEvent[];
  profiles: UserProfile[];
  onCreateEvent: (event: RPEvent) => void;
  onTogglePauseEvent: (eventId: string) => void;
  onCompleteEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

const PRESET_BANNERS = [
  { label: 'Шлюз Дасттауна', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Руины Спарк-Компани', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Бар Последний Патрон', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Радиоактивный Кратер', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Цитадель Анклава', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' }
];

export const AdminEventsManager: React.FC<AdminEventsManagerProps> = ({
  events,
  profiles,
  onCreateEvent,
  onTogglePauseEvent,
  onCompleteEvent,
  onDeleteEvent
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [type, setType] = useState<'event' | 'planned_rp'>('event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Шлюзы DustTown, Сектор Запад');
  const [faction, setFaction] = useState('Ополчение DustTown');
  const [hasGM, setHasGM] = useState(true);
  const [rewardEquivaxes, setRewardEquivaxes] = useState(150);
  const [bannerUrl, setBannerUrl] = useState(PRESET_BANNERS[0].url);
  const [hasRainbowText, setHasRainbowText] = useState(false);
  const [hoursFromNow, setHoursFromNow] = useState(24);

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
      participants: []
    };

    onCreateEvent(newEvent);
    setIsCreating(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-heading text-amber-400 uppercase tracking-wide">
            Управление событиями и РП
          </h3>
          <p className="text-xs text-zinc-400">
            Приостанавливайте события, завершайте РП (с 24ч баннером ЗАКРЫТО) и создавайте новые вылазки.
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
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono-pip text-zinc-300">Тип:</span>
            <button
              type="button"
              onClick={() => { setType('event'); setHasRainbowText(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition ${
                type === 'event' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              Событие / Ивент
            </button>
            <button
              type="button"
              onClick={() => { setType('planned_rp'); setHasRainbowText(true); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition ${
                type === 'planned_rp' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              Запланированное РП (Радужный текст)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-pip text-amber-300 mb-1">Заголовок:</label>
              <input
                type="text"
                required
                placeholder="Например: Штурм Рейдерской Цитадели"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
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
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">С ГМ или Без ГМ:</label>
              <select
                value={hasGM ? 'yes' : 'no'}
                onChange={e => setHasGM(e.target.value === 'yes')}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="yes">С ГМ (Мастером)</option>
                <option value="no">Без ГМ (Свободный)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono-pip text-amber-300 mb-1">Награда (ℰQ):</label>
              <input
                type="number"
                min="0"
                value={rewardEquivaxes}
                onChange={e => setRewardEquivaxes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Старт через (часов):</label>
              <input
                type="number"
                min="1"
                value={hoursFromNow}
                onChange={e => setHoursFromNow(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Описание:</label>
            <textarea
              rows={3}
              required
              placeholder="Подробности вылазки..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Banner Preset Selector */}
          <div>
            <label className="block text-xs font-mono-pip text-zinc-300 mb-1.5">Превью-фото (Приплюснутый формат 16:9):</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_BANNERS.map(b => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setBannerUrl(b.url)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-pip transition ${
                    bannerUrl === b.url
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={bannerUrl}
              onChange={e => setBannerUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {type === 'event' && (
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasRainbowText}
                onChange={e => setHasRainbowText(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span>Включить радужный переливающийся текст для заголовка</span>
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-mono-pip"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase"
            >
              Опубликовать
            </button>
          </div>
        </form>
      )}

      {/* Events Table / List for Admin */}
      <div className="space-y-3">
        {events.map(event => (
          <div
            key={event.id}
            className={`p-4 rounded-2xl border transition-all ${
              event.isCompleted
                ? 'bg-zinc-950/80 border-red-900/40 opacity-75'
                : event.isPaused
                ? 'bg-zinc-950/90 border-amber-500/40'
                : 'bg-zinc-950 border-zinc-800'
            } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
          >
            {/* Banner Thumbnail & Title */}
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <img
                src={event.bannerUrl}
                alt={event.title}
                className="w-16 h-12 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold font-heading text-zinc-100 truncate">
                    {event.title}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono-pip uppercase">
                    {event.type === 'planned_rp' ? 'РП' : 'Ивент'}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono-pip flex items-center gap-2 mt-0.5">
                  <span>{event.location}</span>
                  <span>•</span>
                  <span>{event.participants.length} участников</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">+{event.rewardEquivaxes} ℰQ</span>
                </div>
                {/* State Tag */}
                <div className="mt-1">
                  {event.isCompleted ? (
                    <span className="text-[10px] font-bold font-mono-pip text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                      ЗАКРЫТО (Баннер висит 24ч)
                    </span>
                  ) : event.isPaused ? (
                    <span className="text-[10px] font-bold font-mono-pip text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      ПРИОСТАНОВЛЕНО
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold font-mono-pip text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      АКТИВНО
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Pause / Resume */}
              {!event.isCompleted && (
                <button
                  onClick={() => onTogglePauseEvent(event.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono-pip font-bold flex items-center gap-1 transition ${
                    event.isPaused
                      ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/40'
                      : 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 border border-amber-500/40'
                  }`}
                  title={event.isPaused ? 'Возобновить запись' : 'Приостановить запись'}
                >
                  {event.isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Возобновить</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Приостановить</span>
                    </>
                  )}
                </button>
              )}

              {/* Complete Event (Завершить с баннером на 24 часа) */}
              {!event.isCompleted && (
                <button
                  onClick={() => onCompleteEvent(event.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-600/30 text-red-300 hover:bg-red-600/50 border border-red-500/40 text-xs font-mono-pip font-bold flex items-center gap-1 transition"
                  title="Завершить событие: поверх превью появится надпись ЗАКРЫТО на 24ч"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Завершить</span>
                </button>
              )}

              {/* Delete */}
              <button
                onClick={() => onDeleteEvent(event.id)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition"
                title="Удалить навсегда"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
