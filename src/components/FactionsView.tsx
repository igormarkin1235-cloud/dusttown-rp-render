import React, { useState } from 'react';
import { Faction, UserProfile } from '../types';
import { FactionProfileModal } from './FactionProfileModal';
import { AdminFactionModal } from './AdminFactionModal';
import {
  Shield,
  Plus,
  Search,
  Users,
  Coins,
  Crown,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Award
} from 'lucide-react';

interface FactionsViewProps {
  factions: Faction[];
  currentUser: UserProfile;
  isAdmin: boolean;
  onJoinFaction: (factionId: string) => void;
  onLeaveFaction: (factionId: string) => void;
  onUpdateMemberRole: (factionId: string, targetUserId: string, newRoleTitle: string, newRoleColor?: string) => void;
  onKickMember: (factionId: string, targetUserId: string) => void;
  onCreateFaction: (faction: Faction) => void;
  onUpdateFaction: (faction: Faction) => void;
  onDeleteFaction: (factionId: string) => void;
  onSelectMemberProfile?: (user: UserProfile) => void;
}

export const FactionsView: React.FC<FactionsViewProps> = ({
  factions = [],
  currentUser,
  isAdmin,
  onJoinFaction,
  onLeaveFaction,
  onUpdateMemberRole,
  onKickMember,
  onCreateFaction,
  onUpdateFaction,
  onDeleteFaction,
  onSelectMemberProfile
}) => {
  const [search, setSearch] = useState('');
  const [filterRecruiting, setFilterRecruiting] = useState<'all' | 'recruiting' | 'my'>('all');

  // Modals state
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [factionModalMode, setFactionModalMode] = useState<'view' | 'create' | 'edit' | null>(null);
  const [editingFaction, setEditingFaction] = useState<Faction | null>(null);

  const currentFaction = factions.find(f => f.id === currentUser.factionId);

  const filteredFactions = factions.filter(f => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.tag.toLowerCase().includes(search.toLowerCase()) ||
      (f.motto && f.motto.toLowerCase().includes(search.toLowerCase())) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterRecruiting === 'recruiting') return f.isRecruiting;
    if (filterRecruiting === 'my') return f.id === currentUser.factionId;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Current Faction Status */}
      {currentFaction ? (
        <div className={`p-4 sm:p-5 rounded-3xl border border-amber-500/40 bg-gradient-to-r ${currentFaction.bgGradient || 'from-amber-950/60 via-zinc-900 to-zinc-950'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden`}>
          {currentFaction.bannerUrl && (
            <img
              src={currentFaction.bannerUrl}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
              referrerPolicy="no-referrer"
            />
          )}

          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shrink-0 bg-zinc-950 shadow-md">
              <img
                src={currentFaction.logoUrl}
                alt={currentFaction.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-black/60 border border-amber-400/40 text-[10px] font-mono-pip font-bold text-amber-300">
                  [{currentFaction.tag}]
                </span>
                <span className="text-xs font-mono-pip uppercase tracking-wide text-zinc-400">
                  Ваша фракция:
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black font-heading text-white">
                {currentFaction.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-black text-xs font-heading font-black flex items-center gap-1 shadow">
                  <Award className="w-3.5 h-3.5" /> {currentUser.factionRole || 'Боец'}
                </span>
                <span className="text-xs text-emerald-400 font-mono-pip font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> +{currentFaction.dailySalary || 10} ℰQ в день
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedFaction(currentFaction);
                setFactionModalMode('view');
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-heading font-black uppercase flex items-center justify-center gap-1.5 shadow transition"
            >
              Штаб фракции <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-3xl border border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-heading text-zinc-200">
                Вы пока не состоите ни в одной фракции
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Вступите во фракцию, чтобы получить звание в профиле и получать <strong>+10 ℰQ каждый день</strong>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold font-heading text-amber-400 uppercase tracking-wide flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            Фракции Пустоши ({factions.length})
          </h2>
          <p className="text-xs text-zinc-400">
            Организации, кланы и группировки выживших DustTown RP
          </p>
        </div>

        {/* Admin Create Faction button */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingFaction(null);
              setFactionModalMode('create');
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-heading font-black uppercase flex items-center justify-center gap-1.5 shadow-lg transition"
          >
            <Plus className="w-4 h-4" /> Создать фракцию
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию, тегу, девизу или лору фракции..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono-pip shrink-0">
          <button
            type="button"
            onClick={() => setFilterRecruiting('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterRecruiting === 'all'
                ? 'bg-amber-500 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Все ({factions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterRecruiting('recruiting')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterRecruiting === 'recruiting'
                ? 'bg-amber-500 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🟢 Открытые
          </button>
          {currentFaction && (
            <button
              type="button"
              onClick={() => setFilterRecruiting('my')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterRecruiting === 'my'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ⭐ Моя
            </button>
          )}
        </div>
      </div>

      {/* Factions Cards Grid */}
      {filteredFactions.length === 0 ? (
        <div className="p-10 rounded-3xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-3">
          <Shield className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold font-heading text-zinc-400">
            {factions.length === 0
              ? 'В Пустоши пока не создано ни одной фракции'
              : 'Фракции не найдены по вашему запросу'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {isAdmin
              ? 'Нажмите кнопку «Создать фракцию» вверху, чтобы зарегистрировать первую фракцию с уникальным стилем, лором и должностями!'
              : 'Администрация еще не зарегистрировала новые фракции.'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingFaction(null);
                setFactionModalMode('create');
              }}
              className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-heading font-black uppercase inline-flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Создать фракцию
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFactions.map(faction => {
            const isUserMember = currentUser.factionId === faction.id;

            return (
              <div
                key={faction.id}
                className={`rounded-3xl border text-left overflow-hidden flex flex-col justify-between relative transform transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] group ${
                  isUserMember
                    ? 'border-amber-400/80 bg-zinc-950/90 shadow-[0_4px_20px_rgba(245,158,11,0.15)] hover:border-amber-300 hover:shadow-[0_12px_35px_rgba(245,158,11,0.35),0_0_25px_rgba(245,158,11,0.25)]'
                    : 'border-zinc-800 bg-zinc-950/70 shadow-xl hover:border-amber-400/60 hover:bg-zinc-950/90 hover:shadow-[0_12px_35px_rgba(245,158,11,0.22),0_0_20px_rgba(245,158,11,0.15)]'
                }`}
              >
                {/* Hover Glow Light Sheen */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-b from-amber-400/10 via-transparent to-amber-500/5 z-0" />

                {/* Header Banner */}
                <div className={`relative h-28 w-full overflow-hidden bg-gradient-to-r ${faction.bgGradient || 'from-zinc-900 to-black'}`}>
                  {faction.bannerUrl && (
                    <img
                      src={faction.bannerUrl}
                      alt={faction.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-110 group-hover:opacity-50 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                  {/* Badges in top corners */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 border border-white/20 text-[10px] font-mono-pip font-bold text-amber-300">
                      [{faction.tag}]
                    </span>
                    {isUserMember && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-heading font-black uppercase flex items-center gap-1 shadow">
                        <CheckCircle2 className="w-3 h-3" /> Моя фракция
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-pip font-bold ${
                      faction.isRecruiting
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}>
                      {faction.isRecruiting ? '🟢 Открытый набор' : '🔴 Закрыта'}
                    </span>
                  </div>

                  {/* Emblem floating */}
                  <div className="absolute -bottom-5 left-4 z-10 w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400/80 bg-zinc-950 shadow-xl group-hover:border-amber-300 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-300">
                    <img
                      src={faction.logoUrl}
                      alt={faction.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Content body */}
                <div className="pt-7 px-4 pb-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className={`text-base font-black truncate font-heading ${faction.textColor || 'text-white'}`}>
                      {faction.name}
                    </h3>

                    {faction.motto && (
                      <p className="text-xs text-zinc-300 italic mt-0.5 line-clamp-1">
                        «{faction.motto}»
                      </p>
                    )}

                    {faction.description && (
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                        {faction.description}
                      </p>
                    )}
                  </div>

                  {/* Stats and buttons */}
                  <div className="pt-2 border-t border-zinc-850 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono-pip text-zinc-300">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        {faction.members?.length || 0} бойцов
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        +{faction.dailySalary || 10} ℰQ/день
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFaction(faction);
                          setFactionModalMode('view');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-heading font-bold uppercase transition flex items-center justify-center gap-1"
                      >
                        Профиль фракции <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {!isUserMember && faction.isRecruiting && (
                        <button
                          type="button"
                          onClick={() => onJoinFaction(faction.id)}
                          className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-heading font-black uppercase transition shadow"
                        >
                          Вступить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW FACTION PROFILE MODAL */}
      {factionModalMode === 'view' && selectedFaction && (
        <FactionProfileModal
          faction={selectedFaction}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onJoinFaction={id => {
            onJoinFaction(id);
            // Refresh local selected faction
            const updated = factions.find(f => f.id === id);
            if (updated) setSelectedFaction(updated);
          }}
          onLeaveFaction={id => {
            onLeaveFaction(id);
            const updated = factions.find(f => f.id === id);
            if (updated) setSelectedFaction(updated);
          }}
          onUpdateMemberRole={(id, uid, role, color) => {
            onUpdateMemberRole(id, uid, role, color);
            const updated = factions.find(f => f.id === id);
            if (updated) setSelectedFaction(updated);
          }}
          onKickMember={(id, uid) => {
            onKickMember(id, uid);
            const updated = factions.find(f => f.id === id);
            if (updated) setSelectedFaction(updated);
          }}
          onEditFaction={fac => {
            setEditingFaction(fac);
            setFactionModalMode('edit');
          }}
          onDeleteFaction={id => {
            onDeleteFaction(id);
            setFactionModalMode(null);
            setSelectedFaction(null);
          }}
          onSelectMemberProfile={onSelectMemberProfile}
          onClose={() => {
            setFactionModalMode(null);
            setSelectedFaction(null);
          }}
        />
      )}

      {/* CREATE OR EDIT FACTION MODAL */}
      {(factionModalMode === 'create' || factionModalMode === 'edit') && (
        <AdminFactionModal
          factionToEdit={editingFaction}
          currentUserId={currentUser.id}
          currentUsername={currentUser.username}
          onSave={factionData => {
            if (editingFaction) {
              onUpdateFaction(factionData);
            } else {
              onCreateFaction(factionData);
            }
            setFactionModalMode(null);
            setEditingFaction(null);
          }}
          onClose={() => {
            setFactionModalMode(null);
            setEditingFaction(null);
          }}
        />
      )}
    </div>
  );
};
