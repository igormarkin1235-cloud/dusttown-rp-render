import React, { useState } from 'react';
import { UserProfile } from '../types';
import { AvatarWithFrame } from './AvatarWithFrame';
import { Users, Search, Shield, ChevronRight } from 'lucide-react';

interface ProfilesTopBarProps {
  profiles: UserProfile[];
  currentUserId: string;
  onSelectProfile: (profile: UserProfile) => void;
}

export const ProfilesTopBar: React.FC<ProfilesTopBarProps> = ({
  profiles,
  currentUserId,
  onSelectProfile
}) => {
  const [search, setSearch] = useState('');

  const filtered = profiles.filter(
    p =>
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full bg-zinc-900/90 border-b border-zinc-800/80 px-3 py-2.5 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Header Label */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-amber-400">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Сталкеры DustTown</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-mono-pip border border-zinc-700">
              {profiles.length}
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative w-36 sm:w-44">
            <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск сталкера..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-6 pr-2 py-1 text-[11px] rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Horizontal Avatars Scrollable Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filtered.map(profile => {
            const isMe = profile.id === currentUserId;
            const isOwner = profile.username === '@MrWhitePio';

            return (
              <button
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                className={`flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition group ${
                  isMe
                    ? 'bg-amber-500/10 border-amber-500/60 text-amber-200'
                    : 'bg-zinc-950/60 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title={`Открыть профиль: ${profile.displayName} (${profile.username})`}
              >
                <div className="relative">
                  <AvatarWithFrame
                    avatarUrl={profile.avatarUrl}
                    frameId={profile.activeAvatarFrame}
                    size="sm"
                  />
                  {isOwner && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow z-20" />
                  )}
                </div>
                <div className="text-left flex flex-col">
                  <span className={`text-[11px] font-bold line-clamp-1 font-heading ${profile.activeTextColor || ''}`}>
                    {profile.displayName.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono-pip -mt-0.5">
                    {profile.username}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
