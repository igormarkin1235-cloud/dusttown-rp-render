import React, { useState } from 'react';
import { Faction, FactionMember, UserProfile } from '../types';
import { FACTION_ROLE_PRESETS } from '../services/palette';
import {
  Shield,
  Users,
  Coins,
  X,
  LogOut,
  UserPlus,
  Edit2,
  Trash2,
  Award,
  Crown,
  Check,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface FactionProfileModalProps {
  faction: Faction;
  currentUser: UserProfile;
  isAdmin: boolean;
  onJoinFaction: (factionId: string) => void;
  onLeaveFaction: (factionId: string) => void;
  onUpdateMemberRole: (factionId: string, targetUserId: string, newRoleTitle: string, newRoleColor?: string) => void;
  onKickMember: (factionId: string, targetUserId: string) => void;
  onEditFaction: (faction: Faction) => void;
  onDeleteFaction: (factionId: string) => void;
  onSelectMemberProfile?: (user: UserProfile) => void;
  onClose: () => void;
}

export const FactionProfileModal: React.FC<FactionProfileModalProps> = ({
  faction,
  currentUser,
  isAdmin,
  onJoinFaction,
  onLeaveFaction,
  onUpdateMemberRole,
  onKickMember,
  onEditFaction,
  onDeleteFaction,
  onSelectMemberProfile,
  onClose
}) => {
  const isMember = currentUser.factionId === faction.id;
  const isLeader = faction.leaderUserId === currentUser.id || faction.leaderUsername?.toLowerCase() === currentUser.username?.toLowerCase();
  const canManage = isAdmin || isLeader;

  const [activeTab, setActiveTab] = useState<'overview' | 'members'>('overview');

  // Edit role modal state
  const [editingMember, setEditingMember] = useState<FactionMember | null>(null);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('text-amber-400');

  const openEditRole = (member: FactionMember) => {
    setEditingMember(member);
    setNewRoleTitle(member.roleTitle || 'Рядовой');
    setNewRoleColor(member.roleColor || 'text-amber-400');
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !newRoleTitle.trim()) return;
    onUpdateMemberRole(faction.id, editingMember.userId, newRoleTitle.trim(), newRoleColor);
    setEditingMember(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-3xl bg-zinc-950 border border-zinc-700 shadow-2xl space-y-0 text-white">
        
        {/* Faction Header Banner with gradient overlay */}
        <div className={`relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-r ${faction.bgGradient || 'from-zinc-900 to-black'}`}>
          {faction.bannerUrl && (
            <img
              src={faction.bannerUrl}
              alt={faction.name}
              className="absolute inset-0 w-full h-full object-cover opacity-40 select-none"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/90 border border-white/20 text-zinc-300 hover:text-white transition shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Admin Edit / Delete Actions */}
          {canManage && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditFaction(faction)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/80 hover:bg-amber-400 text-black text-xs font-heading font-black uppercase flex items-center gap-1.5 shadow transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Редактировать
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Вы точно хотите удалить фракцию «${faction.name}»? Все бойцы станут одиночками.`)) {
                      onDeleteFaction(faction.id);
                      onClose();
                    }
                  }}
                  className="p-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white shadow transition"
                  title="Удалить фракцию"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Emblem & Basic Info positioned over banner */}
          <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 z-10 flex items-end gap-3 sm:gap-4">
            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-amber-400/80 shrink-0 bg-zinc-950 shadow-2xl relative">
              <img
                src={faction.logoUrl}
                alt={faction.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-black/70 border border-amber-400/40 text-[11px] font-mono-pip font-bold text-amber-300">
                  [{faction.tag}]
                </span>
                <h2 className={`text-lg sm:text-2xl font-black truncate font-heading ${faction.textColor || 'text-white'}`}>
                  {faction.name}
                </h2>
              </div>

              {faction.motto && (
                <p className="text-xs sm:text-sm text-zinc-300 italic mt-0.5 line-clamp-1">
                  «{faction.motto}»
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar (Join / Leave & Info Bar) */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono-pip text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Бойцы: <strong className="text-white">{faction.members?.length || 0}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Coins className="w-4 h-4" />
                <span>Жалование: <strong className="text-emerald-300">+{faction.dailySalary || 10} ℰQ/день</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Глава: <strong className="text-amber-300">{faction.leaderUsername}</strong></span>
              </div>
            </div>

            {/* Membership Action Button */}
            <div>
              {isMember ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Вы уверены, что хотите покинуть фракцию «${faction.name}»? Вы потеряете должность и ежедневное довольствие.`)) {
                      onLeaveFaction(faction.id);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-heading font-black uppercase flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Покинуть фракцию
                </button>
              ) : faction.isRecruiting ? (
                <button
                  type="button"
                  onClick={() => onJoinFaction(faction.id)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-heading font-black uppercase flex items-center gap-1.5 shadow-lg transition"
                >
                  <UserPlus className="w-4 h-4" /> Вступить во фракцию
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-500 text-xs font-mono-pip border border-zinc-700">
                  Набор закрыт
                </span>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-xl text-xs font-heading font-bold uppercase transition ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-zinc-400 hover:text-white bg-zinc-900'
              }`}
            >
              О фракции & Лор
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-4 py-1.5 rounded-xl text-xs font-heading font-bold uppercase transition flex items-center gap-1.5 ${
                activeTab === 'members'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-zinc-400 hover:text-white bg-zinc-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Личный состав ({faction.members?.length || 0})
            </button>
          </div>

          {/* TAB 1: OVERVIEW & LORE */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              {/* Lore / Description */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <h4 className="text-xs font-mono-pip uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Описание и история
                </h4>
                <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                  {faction.description || 'У этой фракции пока нет подробного описания. Администрация может добавить его в настройках.'}
                </div>
              </div>

              {/* Economic Stipend Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 border border-emerald-500/40 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-heading text-emerald-300">
                    Ежедневное довольствие фракции (+{faction.dailySalary || 10} ℰQ)
                  </h4>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-snug">
                    Все участники фракции получают гарантированно <strong>+{faction.dailySalary || 10} ℰQ</strong> каждый день автоматически в полночь, даже если они не заходят в сеть. Жалование накапливается за все дни отсутствия!
                  </p>
                </div>
              </div>

              {/* Current user's rank status if member */}
              {isMember && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-zinc-300 font-mono-pip">
                      Ваша должность во фракции:
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-black font-bold font-heading text-xs">
                      {currentUser.factionRole || 'Рядовой'}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-300/80 font-mono-pip">
                    Привязано к вашему профилю ✓
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEMBERS ROSTER */}
          {activeTab === 'members' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-mono-pip text-zinc-400">
                <span>Участники и присвоенные звания:</span>
                {canManage && (
                  <span className="text-amber-400 text-[11px]">
                    ★ Вы можете изменять должности бойцов
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {(faction.members || []).map(member => {
                  const isCurrent = member.userId === currentUser.id;
                  const isFactionLeader = member.isLeader || member.userId === faction.leaderUserId;

                  return (
                    <div
                      key={member.userId}
                      className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-700 shrink-0 bg-zinc-950">
                          <img
                            src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                            alt={member.displayName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-zinc-200 truncate font-heading">
                              {member.displayName}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono-pip">
                              {member.username}
                            </span>
                            {isFactionLeader && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold font-mono-pip">
                                ГЛАВА
                              </span>
                            )}
                          </div>

                          {/* Member Role / Position badge */}
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] font-bold font-heading text-amber-300">
                              🎖️ {member.roleTitle || 'Новобранец'}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono-pip">
                              Вступил: {new Date(member.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Management Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditRole(member)}
                              className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-300 text-zinc-400 text-[11px] font-mono-pip border border-zinc-700 transition flex items-center gap-1"
                              title="Назначить должность"
                            >
                              <Edit2 className="w-3 h-3" /> Должность
                            </button>

                            {!isFactionLeader && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Исключить бойца ${member.displayName} из фракции?`)) {
                                    onKickMember(faction.id, member.userId);
                                  }
                                }}
                                className="p-1 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 transition"
                                title="Исключить из фракции"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL: EDIT MEMBER ROLE */}
        {editingMember && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-amber-500/60 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-sm font-bold font-heading text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Назначить должность
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-zinc-300 font-mono-pip">
                Боец: <strong className="text-white">{editingMember.displayName}</strong> ({editingMember.username})
              </div>

              <form onSubmit={handleSaveRole} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono-pip text-zinc-400 mb-1">
                    Должность / Звание бойца:
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoleTitle}
                    onChange={e => setNewRoleTitle(e.target.value)}
                    placeholder="например: Командир разведки"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-amber-300 font-bold font-heading focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Preset Roles Quick Picker */}
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono-pip uppercase block mb-1">
                    Быстрый выбор из устава:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {FACTION_ROLE_PRESETS.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNewRoleTitle(r)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono-pip transition ${
                          newRoleTitle === r
                            ? 'bg-amber-400 text-black font-bold'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono-pip"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-heading font-black uppercase"
                  >
                    Присвоить звание
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
