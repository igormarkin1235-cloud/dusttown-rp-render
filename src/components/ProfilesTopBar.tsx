import React, { useState } from 'react';
import { UserProfile, AdminInfo } from '../types';
import { PlayerCardFrame } from './PlayerCardFrame';
import { Users, Search, Shield, Crown, Flame, Trophy } from 'lucide-react';

interface ProfilesTopBarProps {
  profiles: UserProfile[];
  admins: AdminInfo[];
  currentUserId: string;
  onSelectProfile: (profile: UserProfile) => void;
}

export const ProfilesTopBar: React.FC<ProfilesTopBarProps> = ({
  profiles = [],
  admins = [],
  currentUserId,
  onSelectProfile
}) => {
  const [search, setSearch] = useState('');

  // Deduplicate and sort profiles by activity (events attended + planned rps + balance)
  const uniqueProfiles = React.useMemo(() => {
    if (!Array.isArray(profiles)) return [];
    const seen = new Set<string>();
    const result: UserProfile[] = [];
    for (const p of profiles) {
      if (!p) continue;
      const key = (p.id || p.userId || p.username || '').toLowerCase().trim();
      if (!key) {
        result.push(p);
        continue;
      }
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(p);
    }

    // Sort: Owner always first, then by activity score (events + planned rps + equivaxes)
    return result.sort((a, b) => {
      const isOwnerA = (a.username || '').toLowerCase() === '@mrwhitepio' || a.id === 'owner_mrwhitepio';
      const isOwnerB = (b.username || '').toLowerCase() === '@mrwhitepio' || b.id === 'owner_mrwhitepio';
      if (isOwnerA) return -1;
      if (isOwnerB) return 1;

      const scoreA = (a.eventsAttended || 0) * 10 + (a.plannedRpsAttended || 0) * 8 + Math.min(50, Math.floor((a.equivaxes || 0) / 100));
      const scoreB = (b.eventsAttended || 0) * 10 + (b.plannedRpsAttended || 0) * 8 + Math.min(50, Math.floor((b.equivaxes || 0) / 100));
      return scoreB - scoreA;
    });
  }, [profiles]);

  const filtered = uniqueProfiles.filter(
    p =>
      (p.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full bg-zinc-950/90 border-b border-zinc-800/80 px-3 py-2.5 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Header Label */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-amber-400">
            <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Топ активных сталкеров</span>
            <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-mono-pip border border-zinc-700">
              {uniqueProfiles.length}
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative w-36 sm:w-44">
            <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск в топе..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-6 pr-2 py-1 text-[11px] rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Horizontal Avatars Scrollable Row with Card Frames surrounding each item */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-1 px-0.5 scrollbar-none">
          {filtered.map((profile, index) => {
            const profileId = profile.id || profile.userId || '';
            const isMe = profileId === currentUserId;
            const isOwner = (profile.username || '').toLowerCase() === '@mrwhitepio';
            const isAdmin =
              !isOwner &&
              (Array.isArray(admins) ? admins : []).some(
                a => a && (a.username || '').toLowerCase() === (profile.username || '').toLowerCase()
              );
            const itemKey = profileId || profile.username || `profile-${index}`;
            const rank = index + 1;

            return (
              <PlayerCardFrame
                key={`${itemKey}-${index}`}
                frameId={profile.activeCardFrame || profile.activeAvatarFrame}
                rank={rank}
                isOwner={isOwner}
                isAdmin={isAdmin}
                isSelected={isMe}
                className="flex-shrink-0"
              >
                <button
                  type="button"
                  onClick={() => onSelectProfile(profile)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition select-none group ${
                    isMe
                      ? 'bg-amber-500/10 text-amber-200'
                      : 'bg-zinc-950/80 hover:bg-zinc-900/90 text-zinc-300 hover:text-white'
                  }`}
                  title={`Открыть профиль: ${profile.displayName} (${profile.username})`}
                >
                  {/* Rank Badge */}
                  <div className="relative flex flex-col items-center shrink-0">
                    <span
                      className={`text-[9px] font-mono-pip font-black px-1.5 py-0.5 rounded-md leading-none shadow-sm ${
                        rank === 1
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-extrabold'
                          : rank === 2
                          ? 'bg-slate-300 text-black'
                          : rank === 3
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      #{rank}
                    </span>

                    {/* Small uncropped clean Avatar inside card frame */}
                    <div className="relative mt-1">
                      <div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-700/80 bg-black flex items-center justify-center shadow-inner">
                        <img
                          src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                          alt={profile.displayName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={e => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                          }}
                        />
                      </div>
                      {isOwner && (
                        <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1.5 -right-1.5 drop-shadow z-20 animate-bounce" />
                      )}
                      {isAdmin && (
                        <Shield className="w-3 h-3 text-red-500 absolute -top-1 -right-1 drop-shadow z-20" />
                      )}
                    </div>
                  </div>

                  {/* Profile Meta Information */}
                  <div className="min-w-0 pr-1 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold font-heading truncate max-w-[105px] ${profile.activeTextColor || 'text-white'}`}>
                        {profile.displayName || 'Сталкер'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono-pip -mt-0.5">
                      <span className="truncate max-w-[70px] text-zinc-500">{profile.username || '@id'}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-amber-400/90 font-bold flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 text-amber-400" />
                        {(profile.eventsAttended || 0) + (profile.plannedRpsAttended || 0)}
                      </span>
                    </div>

                    {/* Role Mini Badge */}
                    {isOwner ? (
                      <span className="text-[8px] font-black uppercase text-amber-300 font-mono-pip tracking-wider mt-0.5">
                        👑 Создатель
                      </span>
                    ) : isAdmin ? (
                      <span className="text-[8px] font-black uppercase text-red-400 font-mono-pip tracking-wider mt-0.5">
                        🛡️ Админ
                      </span>
                    ) : profile.factionName ? (
                      <span className="text-[8px] font-mono-pip text-cyan-400 truncate max-w-[95px] mt-0.5">
                        {profile.factionName}
                      </span>
                    ) : null}
                  </div>
                </button>
              </PlayerCardFrame>
            );
          })}
        </div>
      </div>
    </div>
  );
};
