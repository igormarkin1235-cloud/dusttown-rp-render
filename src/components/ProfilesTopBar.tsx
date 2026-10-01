import React, { useState } from 'react';
import { UserProfile, AdminInfo, ActivityLogEntry } from '../types';
import { AvatarWithFrame } from './AvatarWithFrame';
import { Users, Search, Shield, Crown } from 'lucide-react';

interface ProfilesTopBarProps {
  profiles: UserProfile[];
  admins: AdminInfo[];
  activityLogs?: ActivityLogEntry[];
  currentUserId: string;
  onSelectProfile: (profile: UserProfile) => void;
}

export const ProfilesTopBar: React.FC<ProfilesTopBarProps> = ({
  profiles,
  admins,
  activityLogs = [],
  currentUserId,
  onSelectProfile
}) => {
  const [search, setSearch] = useState('');

  // Deduplicate profiles by unique id/userId/username to avoid duplicate keys and redundant items
  const uniqueProfiles = React.useMemo(() => {
    if (!Array.isArray(profiles)) return [];
    const seen = new Set<string>();
    const result: UserProfile[] = [];
    for (const p of profiles) {
      if (!p) continue;
      const key = (p.id || p.username || '').toLowerCase().trim();
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
    return result;
  }, [profiles]);

  const { rankedProfiles, ranks } = React.useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const scores = new Map<string, number>();
    for (const log of activityLogs) {
      if (new Date(log.timestamp).getTime() < cutoff) continue;
      const key = (log.userId || log.username || '').toLowerCase();
      if (key) scores.set(key, (scores.get(key) || 0) + 1);
    }

    const ranked = uniqueProfiles
      .map((profile, index) => ({
        profile,
        index,
        score: scores.get(profile.id.toLowerCase()) || scores.get(profile.username.toLowerCase()) || 0
      }))
      .sort((left, right) => right.score - left.score || left.index - right.index);
    const rankedIds = new Map<string, number>();
    ranked.filter(item => item.score > 0).slice(0, 3).forEach((item, index) => {
      rankedIds.set(item.profile.id, index + 1);
    });
    return { rankedProfiles: ranked.map(item => item.profile), ranks: rankedIds };
  }, [uniqueProfiles, activityLogs]);

  const filtered = rankedProfiles.filter(
    p =>
      (p.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full bg-zinc-900/90 border-b border-zinc-800/80 px-3 py-2.5 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Header Label */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-amber-400">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Сталкеры Даст Таун Колектив</span>
            <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-mono-pip border border-zinc-700">
              {uniqueProfiles.length}
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
          {filtered.map((profile, index) => {
            const profileId = profile.id || '';
            const isMe = profileId === currentUserId;
            const isOwner = (profile.username || '').toLowerCase() === '@mrwhitepio';
            const isAdmin =
              !isOwner &&
              admins.some(
                a => (a.username || '').toLowerCase() === (profile.username || '').toLowerCase()
              );
            const itemKey = profileId || profile.username || `profile-${index}`;
            const rank = ranks.get(profileId);
            const rankFrame = rank === 1 ? 'frame_rad_pulse' : rank === 2 ? 'frame_rainbow_neon' : rank === 3 ? 'frame_gold_3d' : profile.activeAvatarFrame;

            return (
              <button
                key={`${itemKey}-${index}`}
                onClick={() => onSelectProfile(profile)}
                className={`flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition group ${
                  isMe
                    ? 'bg-amber-500/10 border-amber-500/60 text-amber-200'
                    : 'bg-zinc-950/60 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title={`Открыть профиль: ${profile.displayName} (${profile.username})`}
              >
                <div className="relative flex flex-col items-center">
                  <div className="relative">
                    <AvatarWithFrame
                      avatarUrl={profile.avatarUrl}
                      frameId={rankFrame}
                      size="sm"
                    />
                    {isOwner && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-2 -right-1 drop-shadow z-20 animate-bounce" />
                    )}
                    {isAdmin && (
                      <Shield className="w-3 h-3 text-red-500 absolute -top-1.5 -right-1 drop-shadow z-20" />
                    )}
                  </div>

                  {/* Badges directly under the avatar */}
                  {isOwner && (
                    <span className="badge-owner-shimmer text-black text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider mt-1 scale-95 shadow">
                      Создатель
                    </span>
                  )}
                  {isAdmin && (
                    <span className="badge-admin-shimmer text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider mt-1 scale-95 shadow">
                      Админ
                    </span>
                  )}
                  {rank && (
                    <span className={`mt-1 rounded-full border px-1.5 py-0.5 text-[8px] font-black ${rank === 1 ? 'border-emerald-400/60 text-emerald-300' : rank === 2 ? 'border-cyan-300/60 text-cyan-200' : 'border-amber-400/60 text-amber-300'}`}>
                      АКТИВ #{rank}
                    </span>
                  )}
                </div>

                <div className="text-left flex flex-col justify-center">
                  <span className={`text-[11px] font-bold line-clamp-1 font-heading ${profile.activeTextColor || ''}`}>
                    {(profile.displayName || 'Сталкер').split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono-pip -mt-0.5">
                    {profile.username || '@unknown'}
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
