import React from 'react';
import { RPEvent, UserProfile } from '../types';
import {
  X,
  Calendar,
  MapPin,
  Shield,
  Coins,
  ExternalLink,
  Users,
  Sparkles,
  CheckCircle2,
  Handshake,
  ArrowRight
} from 'lucide-react';

interface CollabDetailModalProps {
  event: RPEvent;
  currentUser: UserProfile;
  onJoinEvent: (eventId: string) => void;
  onClose: () => void;
}

export const CollabDetailModal: React.FC<CollabDetailModalProps> = ({
  event,
  currentUser,
  onJoinEvent,
  onClose
}) => {
  const isJoined = event.participants.some(
    p => p.toLowerCase() === currentUser.username.toLowerCase() || p === currentUser.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-amber-500/50 shadow-2xl p-5 sm:p-7 flex flex-col space-y-4 my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Collab Tag */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-black text-[10px] font-heading font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
            <Handshake className="w-3.5 h-3.5" />
            <span>СОБЫТИЕ-КОЛЛАБОРАЦИЯ</span>
          </span>
          {event.isPaused && (
            <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500 text-[10px] font-mono-pip font-bold">
              ПАУЗА
            </span>
          )}
        </div>

        {/* Event Banner */}
        {event.bannerUrl && (
          <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-zinc-700 bg-black/60 shadow-inner">
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>
        )}

        {/* Title */}
        <div>
          <h2
            className={`text-xl sm:text-2xl font-black font-heading leading-tight ${
              event.hasRainbowText
                ? 'rainbow-text'
                : 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
            }`}
          >
            {event.title}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono-pip mt-1.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {new Date(event.startTime).toLocaleString('ru-RU', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              {event.location}
            </span>
          </div>
        </div>

        {/* PARTNER CLAN BEAUTIFUL STYLIZED FRAME */}
        {event.collabClanName && (
          <div className="p-4 rounded-2xl border-2 border-dashed border-amber-500/70 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-yellow-950/40 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300">
                  <Handshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono-pip text-zinc-400 uppercase tracking-wider">
                    Клан-партнёр коллаборации:
                  </div>
                  <div className="text-sm font-black font-heading text-amber-300">
                    {event.collabClanName}
                  </div>
                </div>
              </div>

              <span className="text-[9px] font-mono-pip px-2 py-0.5 rounded-full bg-black/60 border border-amber-500/40 text-amber-400 font-bold uppercase">
                Альянс
              </span>
            </div>

            {event.collabClanUrl && (
              <a
                href={event.collabClanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-heading font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md"
              >
                <span>Перейти в группу клана {event.collabClanName}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Description */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {event.description}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono-pip">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[9px] text-zinc-500 uppercase">Фракция</div>
              <div className="text-zinc-200 font-bold truncate">{event.faction}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[9px] text-zinc-500 uppercase">Награда</div>
              <div className="text-amber-300 font-bold">+{event.rewardEquivaxes} ℰQ</div>
            </div>
          </div>
        </div>

        {/* Participants & Action */}
        <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono-pip">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Участников: <strong className="text-zinc-200">{event.participants.length}</strong></span>
          </div>

          <button
            onClick={() => onJoinEvent(event.id)}
            disabled={isJoined || event.isPaused || event.isCompleted}
            className={`py-2.5 px-6 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 ${
              isJoined
                ? 'bg-emerald-600/30 border border-emerald-500/60 text-emerald-300 cursor-default'
                : event.isPaused || event.isCompleted
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-950/60 active:scale-98 animate-pulse'
            }`}
          >
            {isJoined ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Вы участвуете!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Участвовать в событии</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
