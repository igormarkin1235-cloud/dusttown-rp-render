import React, { useState, useEffect } from 'react';
import { RPEvent, UserProfile } from '../types';
import { Clock, MapPin, Users, ShieldAlert, Sparkles, CheckCircle, AlertTriangle, Coins, Ban } from 'lucide-react';

interface EventsViewProps {
  events: RPEvent[];
  profiles: UserProfile[];
  currentUser: UserProfile;
  onJoinEvent: (eventId: string) => void;
  onOpenProfile: (profile: UserProfile) => void;
  onOpenAdminPanel?: () => void;
  isAdmin: boolean;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  profiles,
  currentUser,
  onJoinEvent,
  onOpenProfile,
  onOpenAdminPanel,
  isAdmin
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Filter only regular events (or type === 'event')
  const eventList = events.filter(e => e.type === 'event');

  // Check 24 hour visibility rule for completed events
  const visibleEvents = eventList.filter(e => {
    if (!e.isCompleted) return true;
    if (!e.completedAt) return true;
    const completedTime = new Date(e.completedAt).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Date.now() - completedTime <= oneDayMs;
  });

  const filteredEvents = visibleEvents.filter(e => {
    if (filter === 'active') return !e.isCompleted;
    if (filter === 'completed') return e.isCompleted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h2 className="text-xl font-bold font-heading text-amber-400 uppercase tracking-wide">
              Ивенты Пустоши
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-300 max-w-xl leading-relaxed">
            Внутренние мероприятия комьюнити Даст Таун Колектив: глобальные вылазки, оборона шлюзов и сражения с рейдерами. Участвуйте, чтобы зарабатывать Эквиваксы!
          </p>
        </div>

        {isAdmin && onOpenAdminPanel && (
          <button
            onClick={onOpenAdminPanel}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition"
          >
            <span>+ Создать ивент</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition ${
            filter === 'active'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Активные ({visibleEvents.filter(e => !e.isCompleted).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition ${
            filter === 'completed'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Завершенные (24 ч) ({visibleEvents.filter(e => e.isCompleted).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition ${
            filter === 'all'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Все ({visibleEvents.length})
        </button>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-sm text-zinc-500">
          В данный момент нет доступных событий в этой категории.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              profiles={profiles}
              currentUser={currentUser}
              onJoin={() => onJoinEvent(event.id)}
              onOpenProfile={onOpenProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Event Card Component with Countdown Timer & Participant Profiles
interface EventCardProps {
  event: RPEvent;
  profiles: UserProfile[];
  currentUser: UserProfile;
  onJoin: () => void;
  onOpenProfile: (profile: UserProfile) => void;
  isRainbow?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  profiles,
  currentUser,
  onJoin,
  onOpenProfile,
  isRainbow = false
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isPast: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false
  });

  useEffect(() => {
    function calculateTime() {
      const target = new Date(event.startTime).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isPast: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isPast: false });
      }
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [event.startTime]);

  const isJoined = event.participants.some(
    p => p.toLowerCase() === currentUser.username.toLowerCase() || p === currentUser.id
  );

  // Participant profiles
  const participantProfiles = event.participants
    .map(p => profiles.find(pr => pr.username.toLowerCase() === p.toLowerCase() || pr.id === p))
    .filter((p): p is UserProfile => Boolean(p));

  const canJoin = !event.isCompleted && !event.isPaused && !isJoined;

  return (
    <div
      className={`rounded-3xl border overflow-hidden shadow-xl hover:border-zinc-700 transition bg-gradient-to-br ${
        event.bgGradient || 'from-zinc-950 to-zinc-900 border-zinc-800'
      }`}
    >
      {/* Flat Widescreen Banner Container (approx 2:1 ratio) */}
      <div className="relative w-full h-52 sm:h-64 overflow-hidden bg-zinc-900">
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="w-full h-full object-cover object-center filter brightness-90"
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-black/60" />

        {/* Top Badges (GM, Type, Reward) */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-mono-pip font-bold backdrop-blur-md border ${
                event.hasGM
                  ? 'bg-amber-500/80 text-black border-amber-400'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-700'
              }`}
            >
              {event.hasGM ? '⚡ С ГМ' : '🎲 Без ГМ'}
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-mono-pip font-bold bg-black/60 backdrop-blur-md border border-zinc-700 text-zinc-300">
              {event.faction}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/90 text-black font-mono-pip font-extrabold text-xs shadow-lg backdrop-blur-md">
            <Coins className="w-3.5 h-3.5" />
            <span>+{event.rewardEquivaxes} ℰQ</span>
          </div>
        </div>

        {/* OVERLAY: If Completed, show "ЗАКРЫТО" over preview image */}
        {event.isCompleted && (
          <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-400 mb-2 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              <Ban className="w-8 h-8" />
            </div>
            <span className="text-2xl font-black font-heading tracking-widest text-red-500 uppercase">
              ЗАКРЫТО
            </span>
            <span className="text-xs text-zinc-400 mt-1 font-mono-pip">
              Событие успешно завершено (архивируется через 24ч)
            </span>
          </div>
        )}

        {/* OVERLAY: If Paused */}
        {!event.isCompleted && event.isPaused && (
          <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-2 animate-pulse">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <span className="text-xl font-black font-heading tracking-widest text-amber-400 uppercase">
              ПРИОСТАНОВЛЕНО
            </span>
            <span className="text-xs text-zinc-400 mt-1 font-mono-pip">
              Прием участников временно приостановлен мастером
            </span>
          </div>
        )}

        {/* Bottom Banner Info: Real Working Countdown Timer */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-end justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-zinc-700/80 text-zinc-200">
            <Clock className="w-4 h-4 text-amber-400" />
            <div className="text-xs font-mono-pip font-bold">
              {timeLeft.isPast ? (
                <span className="text-emerald-400">ИДЁТ СЕЙЧАС</span>
              ) : (
                <span>
                  ДО НАЧАЛА: {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono-pip bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="max-w-[150px] sm:max-w-xs truncate">{event.location}</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <h3
          className={`text-xl font-bold font-heading leading-tight ${
            isRainbow || event.hasRainbowText
              ? 'rainbow-shimmer-text'
              : event.textColor || 'text-zinc-100 hover:text-amber-400 transition'
          }`}
        >
          {event.title}
        </h3>

        {/* Admin attribution for planned RP sessions */}
        {event.type === 'planned_rp' && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950/50 border border-purple-500/40 text-xs font-mono-pip text-purple-300 w-fit shadow-sm">
            <span className="text-sm">🛡️</span>
            <span>
              Админ: <strong className="text-purple-200">{event.authorUsername || '@MrWhitePio'}</strong>
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-zinc-300 leading-relaxed">{event.description}</p>

        {/* Participants Profile List: NOT just text, but real player profile cards! */}
        <div className="pt-3 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-zinc-300 uppercase">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Участники ({participantProfiles.length})</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono-pip">
              Нажмите на профиль для просмотра
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {participantProfiles.length === 0 ? (
              <span className="text-xs text-zinc-500 italic">Пока никто не записался</span>
            ) : (
              participantProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => onOpenProfile(p)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 transition group"
                  title={`Открыть профиль ${p.displayName}`}
                >
                  <img
                    src={p.avatarUrl}
                    alt={p.displayName}
                    className="w-6 h-6 rounded-lg object-cover border border-zinc-700 group-hover:border-amber-400"
                  />
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-zinc-200 group-hover:text-amber-300 leading-none">
                      {p.displayName}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono-pip leading-none mt-0.5">
                      {p.username}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end">
          {event.isCompleted ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono-pip">
              <CheckCircle className="w-4 h-4 text-zinc-500" />
              <span>Событие завершено</span>
            </div>
          ) : event.isPaused ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono-pip">
              <AlertTriangle className="w-4 h-4" />
              <span>Запись временно приостановлена</span>
            </div>
          ) : isJoined ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono-pip font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Вы записаны на событие (+{event.rewardEquivaxes} ℰQ получено)</span>
            </div>
          ) : (
            <button
              onClick={onJoin}
              disabled={!canJoin}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-950/40 transition active:scale-95 flex items-center gap-2"
            >
              <Coins className="w-4 h-4" />
              <span>Принять участие (+{event.rewardEquivaxes} ℰQ)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
