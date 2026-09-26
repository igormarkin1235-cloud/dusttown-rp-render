import React from 'react';
import { UserProfile, AdminInfo } from '../types';
import { AvatarWithFrame } from './AvatarWithFrame';
import { Shield, Coins, Sparkles, ChevronDown } from 'lucide-react';

interface MiniAppHeaderProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  admins: AdminInfo[];
  onSwitchUser: (userId: string) => void;
  onOpenMyProfile: () => void;
  onOpenCases: () => void;
}

export const MiniAppHeader: React.FC<MiniAppHeaderProps> = ({
  currentUser,
  profiles,
  admins,
  onSwitchUser,
  onOpenMyProfile,
  onOpenCases
}) => {
  const isAdmin = admins.some(
    a => a.username.toLowerCase() === currentUser.username.toLowerCase()
  ) || currentUser.username.toLowerCase() === '@mrwhitepio';

  return (
    <header className="w-full bg-zinc-950/95 border-b border-zinc-800/80 sticky top-0 z-30 backdrop-blur-md px-3 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-900/30 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <span className="text-amber-400 font-extrabold text-sm font-mono-pip">DT</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-heading font-black text-base tracking-wider text-amber-400 uppercase leading-none">
                DustTown RP
              </h1>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" /> ADMIN
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 font-mono-pip leading-none mt-1">
              Fallout: Equestria Telegram Mini App
            </p>
          </div>
        </div>

        {/* Right Controls: Balance + User Selector */}
        <div className="flex items-center gap-2">
          {/* Equivaxes Balance Pill */}
          <button
            onClick={onOpenCases}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono-pip text-xs font-bold transition shadow-sm"
            title="Открыть кейсы и потратить Эквиваксы"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {currentUser.isInfiniteEquivaxes || currentUser.username === '@MrWhitePio'
                ? '∞'
                : currentUser.equivaxes.toLocaleString()} ℰQ
            </span>
          </button>

          {/* User Profile Trigger with Switcher dropdown */}
          <div className="relative group">
            <button
              onClick={onOpenMyProfile}
              className="flex items-center gap-2 px-2 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition"
              title="Открыть мой профиль"
            >
              <AvatarWithFrame
                avatarUrl={currentUser.avatarUrl}
                frameId={currentUser.activeAvatarFrame}
                size="sm"
              />
              <span className="hidden sm:inline text-xs font-bold text-zinc-200 font-heading max-w-[100px] truncate">
                {currentUser.displayName}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {/* Quick User Switcher Menu */}
            <div className="absolute right-0 top-full mt-1.5 w-60 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-2 hidden group-hover:block hover:block z-40">
              <div className="text-[10px] font-mono-pip text-zinc-400 uppercase px-2 py-1 font-bold">
                Сменить игрока (Симуляция ТГ):
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSwitchUser(p.id)}
                    className={`w-full flex items-center gap-2.5 p-1.5 rounded-xl text-left text-xs transition ${
                      p.id === currentUser.id
                        ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40'
                        : 'hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <img src={p.avatarUrl} alt={p.displayName} className="w-6 h-6 rounded-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-heading">{p.displayName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono-pip">{p.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
