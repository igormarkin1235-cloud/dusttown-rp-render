import React, { useState } from 'react';
import { Faction, FactionMember, UserProfile } from '../types';
import { AdminFactionModal } from './AdminFactionModal';
import { FACTION_ROLE_PRESETS } from '../services/palette';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Users,
  Coins,
  Crown,
  Award,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface AdminFactionsManagerProps {
  factions: Faction[];
  profiles: UserProfile[];
  currentUserId: string;
  currentUsername: string;
  onCreateFaction: (faction: Faction) => void;
  onUpdateFaction: (faction: Faction) => void;
  onDeleteFaction: (factionId: string) => void;
  onUpdateMemberRole: (factionId: string, targetUserId: string, newRoleTitle: string, newRoleColor?: string) => void;
  onKickMember: (factionId: string, targetUserId: string) => void;
}

export const AdminFactionsManager: React.FC<AdminFactionsManagerProps> = ({
  factions = [],
  profiles,
  currentUserId,
  currentUsername,
  onCreateFaction,
  onUpdateFaction,
  onDeleteFaction,
  onUpdateMemberRole,
  onKickMember
}) => {
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingFaction, setEditingFaction] = useState<Faction | null>(null);
  const [expandedFactionId, setExpandedFactionId] = useState<string | null>(null);

  // Edit role sub-modal
  const [editingMember, setEditingMember] = useState<{ factionId: string; member: FactionMember } | null>(null);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('text-amber-400');

  const openRoleEditor = (factionId: string, member: FactionMember) => {
    setEditingMember({ factionId, member });
    setNewRoleTitle(member.roleTitle || 'Рядовой');
    setNewRoleColor(member.roleColor || 'text-amber-400');
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !newRoleTitle.trim()) return;
    onUpdateMemberRole(editingMember.factionId, editingMember.member.userId, newRoleTitle.trim(), newRoleColor);
    setEditingMember(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h3 className="text-sm font-bold font-heading text-amber-300 uppercase flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            Управление фракциями Пустоши ({factions.length})
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Создавайте фракции, загружайте эмблемы и баннеры, назначайте звания и должности бойцам
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingFaction(null);
            setModalMode('create');
          }}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-heading font-black uppercase flex items-center gap-1.5 shadow transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Создать фракцию
        </button>
      </div>

      {/* Factions List */}
      {factions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-2">
          <Shield className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400 font-mono-pip">
            В игре пока нет фракций. Нажмите «Создать фракцию», чтобы создать первую!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {factions.map(faction => {
            const isExpanded = expandedFactionId === faction.id;

            return (
              <div
                key={faction.id}
                className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-lg"
              >
                {/* Faction Header Bar */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400/50 shrink-0 bg-zinc-900">
                      <img
                        src={faction.logoUrl}
                        alt={faction.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-black/60 border border-amber-400/30 text-[10px] font-mono-pip font-bold text-amber-300">
                          [{faction.tag}]
                        </span>
                        <h4 className="text-sm font-bold font-heading text-white">
                          {faction.name}
                        </h4>
                      </div>

                      {faction.motto && (
                        <p className="text-xs text-zinc-400 italic line-clamp-1">
                          «{faction.motto}»
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1 text-[11px] font-mono-pip text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          Бойцы: <strong className="text-zinc-200">{faction.members?.length || 0}</strong>
                        </span>
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <Coins className="w-3.5 h-3.5" />
                          +{faction.dailySalary || 10} ℰQ/день
                        </span>
                        <span className="text-amber-300/80">
                          Глава: {faction.leaderUsername}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setExpandedFactionId(isExpanded ? null : faction.id)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono-pip flex items-center gap-1 transition"
                    >
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Состав ({faction.members?.length || 0})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaction(faction);
                        setModalMode('edit');
                      }}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-300 text-zinc-400 border border-zinc-700 transition"
                      title="Редактировать фракцию"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Удалить фракцию «${faction.name}»? Все участники потеряют членство.`)) {
                          onDeleteFaction(faction.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 border border-zinc-700 transition"
                      title="Удалить фракцию"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Roster & Roles */}
                {isExpanded && (
                  <div className="p-4 border-t border-zinc-800 space-y-3 bg-zinc-950/80 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono-pip text-zinc-400">
                      <span>Назначение должностей и званий участникам фракции:</span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {(faction.members || []).map(member => (
                        <div
                          key={member.userId}
                          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={member.avatarUrl}
                              alt={member.displayName}
                              className="w-8 h-8 rounded-lg object-cover border border-zinc-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-zinc-200 truncate">{member.displayName}</span>
                                <span className="text-zinc-500 text-[11px] font-mono-pip">{member.username}</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono-pip">
                                Должность: <strong className="text-amber-300 font-heading">🎖️ {member.roleTitle || 'Новобранец'}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openRoleEditor(faction.id, member)}
                              className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 text-[11px] font-mono-pip border border-zinc-700 transition flex items-center gap-1"
                            >
                              <Award className="w-3 h-3 text-amber-400" /> Назначить звание
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Исключить бойца ${member.displayName} из фракции?`)) {
                                  onKickMember(faction.id, member.userId);
                                }
                              }}
                              className="p-1 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition"
                              title="Исключить"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <AdminFactionModal
          factionToEdit={editingFaction}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          onSave={factionData => {
            if (editingFaction) {
              onUpdateFaction(factionData);
            } else {
              onCreateFaction(factionData);
            }
            setModalMode(null);
            setEditingFaction(null);
          }}
          onClose={() => {
            setModalMode(null);
            setEditingFaction(null);
          }}
        />
      )}

      {/* ASSIGN ROLE MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-amber-500/60 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-sm font-bold font-heading text-amber-300 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Назначить должность бойцу
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
              Боец: <strong className="text-white">{editingMember.member.displayName}</strong> ({editingMember.member.username})
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
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
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
                  Сохранить должность
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
