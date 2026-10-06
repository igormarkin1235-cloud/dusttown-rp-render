import React, { useState } from 'react';
import {
  RPEvent,
  UserProfile,
  AdminInfo,
  Award,
  CaseBox,
  CaseItemDefinition,
  CompletionOutcome,
  Achievement,
  Faction
} from '../types';
import { AdminEventsManager } from './AdminEventsManager';
import { AdminAdminsManager } from './AdminAdminsManager';
import { AdminUsersManager } from './AdminUsersManager';
import { AdminAwardsManager } from './AdminAwardsManager';
import { AdminCasesManager } from './AdminCasesManager';
import { AdminAchievementsManager } from './AdminAchievementsManager';
import { AdminFactionsManager } from './AdminFactionsManager';
import { AdminBlackjackPanel } from './AdminBlackjackPanel';
import { Shield, Calendar, Users, Award as AwardIcon, Package, Lock, Trophy, Flag, ShieldAlert } from 'lucide-react';

interface AdminPanelProps {
  currentUser: UserProfile;
  admins: AdminInfo[];
  events: RPEvent[];
  profiles: UserProfile[];
  awards: Award[];
  cases: CaseBox[];
  caseItems: CaseItemDefinition[];
  achievements?: Achievement[];
  factions?: Faction[];
  onCreateEvent: (event: RPEvent) => void;
  onTogglePauseEvent: (eventId: string) => void;
  onCompleteEvent: (outcome: CompletionOutcome) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddAdmin: (admin: AdminInfo) => void;
  onRemoveAdmin: (username: string) => void;
  onUpdateAdminTags: (username: string, tags: string[]) => void;
  onGrantMoney: (userId: string, amount: number) => void;
  onSetInfiniteMoney: (userId: string, isInfinite: boolean) => void;
  onIssueAward: (award: Award) => void;
  onRevokeAward: (awardId: string) => void;
  onCreateCase: (newCase: CaseBox) => void;
  onDeleteCase: (caseId: string) => void;
  onCreateItem: (newItem: CaseItemDefinition) => void;
  onSelectProfile: (profile: UserProfile) => void;
  onIssueLotteryTicket: (userId: string, ticketItem: any) => void;
  onCreateAchievement?: (achievement: Achievement) => void;
  onDeleteAchievement?: (achievementId: string) => void;
  onCreateFaction?: (faction: Faction) => void;
  onUpdateFaction?: (faction: Faction) => void;
  onDeleteFaction?: (factionId: string) => void;
  onUpdateMemberRole?: (factionId: string, targetUserId: string, newRoleTitle: string, newRoleColor?: string) => void;
  onKickMember?: (factionId: string, targetUserId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  admins,
  events,
  profiles,
  awards,
  cases,
  caseItems,
  achievements = [],
  factions = [],
  onCreateEvent,
  onTogglePauseEvent,
  onCompleteEvent,
  onDeleteEvent,
  onAddAdmin,
  onRemoveAdmin,
  onUpdateAdminTags,
  onGrantMoney,
  onSetInfiniteMoney,
  onIssueAward,
  onRevokeAward,
  onCreateCase,
  onDeleteCase,
  onCreateItem,
  onSelectProfile,
  onIssueLotteryTicket,
  onCreateAchievement,
  onDeleteAchievement,
  onCreateFaction,
  onUpdateFaction,
  onDeleteFaction,
  onUpdateMemberRole,
  onKickMember
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'blackjack' | 'factions' | 'admins' | 'users' | 'awards' | 'cases' | 'achievements'>('events');

  const isAdmin =
    admins.some(a => a.username.toLowerCase() === currentUser.username.toLowerCase()) ||
    currentUser.username.toLowerCase() === '@mrwhitepio';

  if (!isAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-zinc-950 border border-red-500/40 text-center space-y-3">
        <Lock className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold font-heading text-red-400 uppercase">
          Доступ ограничен
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Управление доступно только владельцу проекта (@MrWhitePio) и назначенным администраторам. Переключитесь на профиль администратора в верхнем меню.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Panel Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-heading text-amber-400 uppercase tracking-wide">
              Центр управления Даст Таун Колектив
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-300">
            Вы авторизованы как <strong className="text-amber-300 font-mono-pip">{currentUser.username}</strong>
            {currentUser.username.toLowerCase() === '@mrwhitepio' && ' (Главный Создатель)'}.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
            activeTab === 'events'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>События и РП</span>
        </button>

        <button
          onClick={() => setActiveTab('blackjack')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
            activeTab === 'blackjack'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
              : 'bg-zinc-900 text-red-400 hover:text-red-300 border border-red-900/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>ИИ-Боты: Блэкджек & Пипка</span>
        </button>

        <button
          onClick={() => setActiveTab('factions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
            activeTab === 'factions'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Фракции ({factions.length})</span>
        </button>

        {/* Admins manager is strictly visible to the Owner (@MrWhitePio) */}
        {currentUser.username.toLowerCase() === '@mrwhitepio' && (
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
              activeTab === 'admins'
                ? 'badge-owner-shimmer text-black shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Назначение Админов (Создатель)</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
            activeTab === 'users'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Балансы сталкеров</span>
        </button>

        <button
          onClick={() => setActiveTab('awards')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
            activeTab === 'awards'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <AwardIcon className="w-3.5 h-3.5" />
          <span>Заслуги и Ордена</span>
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
            activeTab === 'cases'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Кейсы и Лут</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
            activeTab === 'achievements'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Достижения ({achievements.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'events' && (
        <AdminEventsManager
          currentUser={currentUser}
          events={events}
          profiles={profiles}
          onCreateEvent={onCreateEvent}
          onTogglePauseEvent={onTogglePauseEvent}
          onCompleteEvent={onCompleteEvent}
          onDeleteEvent={onDeleteEvent}
        />
      )}

      {activeTab === 'blackjack' && (
        <AdminBlackjackPanel currentUserAdminTag={currentUser.username} />
      )}

      {activeTab === 'factions' && (
        <AdminFactionsManager
          factions={factions}
          profiles={profiles}
          currentUserId={currentUser.id}
          currentUsername={currentUser.username}
          onCreateFaction={onCreateFaction || (() => {})}
          onUpdateFaction={onUpdateFaction || (() => {})}
          onDeleteFaction={onDeleteFaction || (() => {})}
          onUpdateMemberRole={onUpdateMemberRole || (() => {})}
          onKickMember={onKickMember || (() => {})}
        />
      )}

      {activeTab === 'admins' && (
        <AdminAdminsManager
          admins={admins}
          onAddAdmin={onAddAdmin}
          onRemoveAdmin={onRemoveAdmin}
          onUpdateAdminTags={onUpdateAdminTags}
        />
      )}

      {activeTab === 'users' && (
        <AdminUsersManager
          profiles={profiles}
          onGrantMoney={onGrantMoney}
          onSetInfiniteMoney={onSetInfiniteMoney}
          onSelectProfile={onSelectProfile}
          onIssueLotteryTicket={onIssueLotteryTicket}
        />
      )}

      {activeTab === 'awards' && (
        <AdminAwardsManager
          awards={awards}
          profiles={profiles}
          currentAdminUsername={currentUser.username}
          onIssueAward={onIssueAward}
          onRevokeAward={onRevokeAward}
        />
      )}

      {activeTab === 'cases' && (
        <AdminCasesManager
          cases={cases}
          caseItems={caseItems}
          onCreateCase={onCreateCase}
          onDeleteCase={onDeleteCase}
          onCreateItem={onCreateItem}
        />
      )}

      {activeTab === 'achievements' && (
        <AdminAchievementsManager
          achievements={achievements}
          profiles={profiles}
          currentAdminUsername={currentUser.username}
          onCreateAchievement={ach => onCreateAchievement && onCreateAchievement(ach)}
          onDeleteAchievement={id => onDeleteAchievement && onDeleteAchievement(id)}
        />
      )}
    </div>
  );
};
