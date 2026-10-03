import React, { useState } from 'react';
import { RPEvent, UserProfile } from '../types';
import { EventCard } from './EventsView';
import { Sparkles, Calendar, Plus } from 'lucide-react';

interface PlannedRPViewProps {
  events: RPEvent[];
  profiles: UserProfile[];
  currentUser: UserProfile;
  onJoinEvent: (eventId: string) => void;
  onOpenProfile: (profile: UserProfile) => void;
  onOpenAdminPanel?: () => void;
  isAdmin: boolean;
}

export const PlannedRPView: React.FC<PlannedRPViewProps> = ({
  events,
  profiles,
  currentUser,
  onJoinEvent,
  onOpenProfile,
  onOpenAdminPanel,
  isAdmin
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const plannedList = events.filter(e => e.type === 'planned_rp');

  // Check 24 hour visibility for completed
  const visibleEvents = plannedList.filter(e => {
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
      {/* Header Banner with Rainbow Shimmering Accents */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl border border-purple-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Background art */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 transform scale-105 pointer-events-none"
          style={{ backgroundImage: `url('/backgrounds/moonlit_forest.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-purple-950/80 to-zinc-950/90 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="text-xl font-bold font-heading rainbow-shimmer-text uppercase tracking-wide">
              Запланированные РП-Сессии
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-300 max-w-xl leading-relaxed">
            Сюжетные арки, походы в довоенные лаборатории и тайные собрания фракций. Записывайтесь заранее, готовьте персонажей и получайте Эквиваксы!
          </p>
        </div>

        {isAdmin && onOpenAdminPanel && (
          <button
            onClick={onOpenAdminPanel}
            className="relative z-10 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 text-white font-heading font-bold text-xs shadow-lg shadow-purple-950/50 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Создать РП-Сессию</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition ${
            filter === 'active'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Активные сессии ({visibleEvents.filter(e => !e.isCompleted).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition ${
            filter === 'completed'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Завершенные (24 ч) ({visibleEvents.filter(e => e.isCompleted).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition ${
            filter === 'all'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Все ({visibleEvents.length})
        </button>
      </div>

      {/* Cards List */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-sm text-zinc-500">
          В данный момент нет запланированных сессий в этой категории.
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
              isRainbow={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
