import React, { useState, useEffect } from 'react';
import {
  AppStateData,
  UserProfile,
  RPEvent,
  CharacterSheet,
  Award,
  CaseBox,
  CaseItemDefinition,
  InventoryItem,
  AdminInfo
} from './types';
import { loadAppState, saveAppState } from './services/storage';
import { ProfilesTopBar } from './components/ProfilesTopBar';
import { MiniAppHeader } from './components/MiniAppHeader';
import { EventsView } from './components/EventsView';
import { PlannedRPView } from './components/PlannedRPView';
import { CharactersView } from './components/CharactersView';
import { ProfileView } from './components/ProfileView';
import { CasesView } from './components/CasesView';
import { AdminPanel } from './components/AdminPanel';
import { BotControlPanel } from './components/BotControlPanel';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import {
  Calendar,
  Sparkles,
  User,
  Package,
  Shield,
  Bot,
  Smartphone,
  Columns
} from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppStateData>(loadAppState());
  const [currentUserId, setCurrentUserId] = useState<string>(
    appState.profiles.find(p => p.username.toLowerCase() === '@mrwhitepio')?.id || appState.profiles[0]?.id
  );
  const [activeTab, setActiveTab] = useState<'events' | 'planned_rp' | 'characters' | 'profile' | 'cases' | 'admin'>('events');
  const [viewMode, setViewMode] = useState<'miniapp' | 'bot_panel' | 'split'>('miniapp');

  // Modals
  const [inspectedProfile, setInspectedProfile] = useState<UserProfile | null>(null);
  const [inspectedCharacter, setInspectedCharacter] = useState<CharacterSheet | null>(null);

  // Check Telegram WebApp environment for automatic zero-login profile binding
  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();

        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          const formattedUsername = tgUser.username ? `@${tgUser.username}` : `@id${tgUser.id}`;
          
          setAppState(prev => {
            const existing = prev.profiles.find(
              p => p.username.toLowerCase() === formattedUsername.toLowerCase()
            );

            if (existing) {
              setCurrentUserId(existing.id);
              return prev;
            }

            // Automatically create profile for Telegram user without asking for registration
            const isOwner = formattedUsername.toLowerCase() === '@mrwhitepio';
            const newProfile: UserProfile = {
              id: 'tg_user_' + tgUser.id,
              username: formattedUsername,
              displayName: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
              avatarUrl: tgUser.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
              bio: 'Выживший в Пустоши DustTown.',
              equivaxes: isOwner ? 9999999 : 150,
              isInfiniteEquivaxes: isOwner,
              joinedAt: new Date().toISOString(),
              eventsAttended: 0,
              plannedRpsAttended: 0,
              inventory: []
            };

            const updatedProfiles = [...prev.profiles, newProfile];
            setCurrentUserId(newProfile.id);
            const newState = { ...prev, profiles: updatedProfiles };
            saveAppState(newState);
            return newState;
          });
        }
      }
    } catch (e) {
      console.warn('Telegram WebApp init check:', e);
    }
  }, []);

  const currentUser = appState.profiles.find(p => p.id === currentUserId) || appState.profiles[0];
  const isAdmin =
    appState.admins.some(a => a.username.toLowerCase() === currentUser?.username.toLowerCase()) ||
    currentUser?.username.toLowerCase() === '@mrwhitepio';

  // Persistence Helper
  const updateState = (updater: (prev: AppStateData) => AppStateData) => {
    setAppState(prev => {
      const next = updater(prev);
      saveAppState(next);
      return next;
    });
  };

  // Event Handlers
  const handleJoinEvent = (eventId: string) => {
    updateState(prev => {
      const targetEvent = prev.events.find(e => e.id === eventId);
      if (!targetEvent || targetEvent.isCompleted || targetEvent.isPaused) return prev;

      const isAlreadyJoined = targetEvent.participants.some(
        p => p.toLowerCase() === currentUser.username.toLowerCase() || p === currentUser.id
      );
      if (isAlreadyJoined) return prev;

      const reward = targetEvent.rewardEquivaxes || 0;

      // Update event participants
      const updatedEvents = prev.events.map(e =>
        e.id === eventId ? { ...e, participants: [...e.participants, currentUser.username] } : e
      );

      // Reward player with Equivaxes & update attendance count
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          return {
            ...p,
            equivaxes: p.isInfiniteEquivaxes ? p.equivaxes : p.equivaxes + reward,
            eventsAttended: targetEvent.type === 'event' ? p.eventsAttended + 1 : p.eventsAttended,
            plannedRpsAttended: targetEvent.type === 'planned_rp' ? p.plannedRpsAttended + 1 : p.plannedRpsAttended
          };
        }
        return p;
      });

      return {
        ...prev,
        events: updatedEvents,
        profiles: updatedProfiles
      };
    });
  };

  // Character Sheet Handler
  const handleCreateCharacter = (newChar: CharacterSheet) => {
    updateState(prev => ({
      ...prev,
      characters: [newChar, ...prev.characters]
    }));
  };

  // Profile Update Handler
  const handleUpdateProfile = (updated: UserProfile) => {
    updateState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => (p.id === updated.id ? updated : p))
    }));
  };

  // Case Opening Handler
  const handleOpenCase = (box: CaseBox, wonDef: CaseItemDefinition) => {
    updateState(prev => {
      const invItem: InventoryItem = {
        id: 'inv_' + Date.now(),
        itemId: wonDef.id,
        name: wonDef.name,
        photoUrl: wonDef.photoUrl,
        bgStyle: wonDef.bgStyle,
        textStyle: wonDef.textStyle,
        rarity: wonDef.rarity,
        type: wonDef.type,
        appliedValue: wonDef.appliedValue,
        acquiredAt: new Date().toISOString()
      };

      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          const isInfinite = p.isInfiniteEquivaxes || p.username === '@MrWhitePio';
          const newBalance = isInfinite ? p.equivaxes : Math.max(0, p.equivaxes - box.price);
          return {
            ...p,
            equivaxes: newBalance,
            inventory: [invItem, ...(p.inventory || [])]
          };
        }
        return p;
      });

      return {
        ...prev,
        profiles: updatedProfiles
      };
    });
  };

  // Apply Cosmetic Directly
  const handleApplyCosmeticDirectly = (wonDef: CaseItemDefinition) => {
    updateState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          if (wonDef.type === 'profile_theme') {
            return { ...p, activeThemeId: wonDef.appliedValue || 'rad_core' };
          } else if (wonDef.type === 'profile_text_color') {
            return { ...p, activeTextColor: wonDef.appliedValue || wonDef.textStyle };
          } else if (wonDef.type === 'profile_text_bg') {
            return { ...p, activeTextBg: wonDef.appliedValue || wonDef.bgStyle };
          } else if (wonDef.type === 'avatar_frame') {
            return { ...p, activeAvatarFrame: wonDef.appliedValue || 'frame_rad_pulse' };
          }
        }
        return p;
      });
      return { ...prev, profiles: updatedProfiles };
    });
  };

  // Admin Event Actions
  const handleCreateEvent = (newEvent: RPEvent) => {
    updateState(prev => ({ ...prev, events: [newEvent, ...prev.events] }));
  };

  const handleTogglePauseEvent = (eventId: string) => {
    updateState(prev => ({
      ...prev,
      events: prev.events.map(e => (e.id === eventId ? { ...e, isPaused: !e.isPaused } : e))
    }));
  };

  const handleCompleteEvent = (eventId: string) => {
    updateState(prev => ({
      ...prev,
      events: prev.events.map(e =>
        e.id === eventId
          ? {
              ...e,
              isCompleted: true,
              completedAt: new Date().toISOString()
            }
          : e
      )
    }));
  };

  const handleDeleteEvent = (eventId: string) => {
    updateState(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== eventId)
    }));
  };

  // Admin Role Management
  const handleAddAdmin = (admin: AdminInfo) => {
    updateState(prev => ({
      ...prev,
      admins: [...prev.admins, admin]
    }));
  };

  const handleRemoveAdmin = (username: string) => {
    updateState(prev => ({
      ...prev,
      admins: prev.admins.filter(a => a.username.toLowerCase() !== username.toLowerCase())
    }));
  };

  const handleUpdateAdminTags = (username: string, tags: string[]) => {
    updateState(prev => ({
      ...prev,
      admins: prev.admins.map(a =>
        a.username.toLowerCase() === username.toLowerCase() ? { ...a, tags } : a
      )
    }));
  };

  // Admin Economy Management
  const handleGrantMoney = (userId: string, amount: number) => {
    updateState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p =>
        p.id === userId
          ? {
              ...p,
              equivaxes: p.isInfiniteEquivaxes ? p.equivaxes : Math.max(0, p.equivaxes + amount)
            }
          : p
      )
    }));
  };

  const handleSetInfiniteMoney = (userId: string, isInfinite: boolean) => {
    updateState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p =>
        p.id === userId
          ? {
              ...p,
              isInfiniteEquivaxes: isInfinite,
              equivaxes: isInfinite ? 9999999 : p.equivaxes
            }
          : p
      )
    }));
  };

  // Admin Awards Management
  const handleIssueAward = (award: Award) => {
    updateState(prev => ({
      ...prev,
      awards: [award, ...prev.awards]
    }));
  };

  const handleRevokeAward = (awardId: string) => {
    updateState(prev => ({
      ...prev,
      awards: prev.awards.filter(a => a.id !== awardId)
    }));
  };

  // Admin Case Management
  const handleCreateCase = (newCase: CaseBox) => {
    updateState(prev => ({
      ...prev,
      cases: [newCase, ...prev.cases]
    }));
  };

  const handleDeleteCase = (caseId: string) => {
    updateState(prev => ({
      ...prev,
      cases: prev.cases.filter(c => c.id !== caseId)
    }));
  };

  const handleCreateItem = (newItem: CaseItemDefinition) => {
    updateState(prev => ({
      ...prev,
      caseItems: [newItem, ...prev.caseItems]
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Universal Mode Switcher Bar */}
      <div className="w-full bg-zinc-900 border-b border-zinc-800 px-3 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-heading font-black text-amber-400 tracking-wider">
            DUSTTOWN RP
          </span>
          <span className="hidden sm:inline text-zinc-500 font-mono-pip">•</span>
          <span className="hidden sm:inline text-zinc-400 font-mono-pip">
            Режим предварительного просмотра:
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode('miniapp')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono-pip font-bold transition ${
              viewMode === 'miniapp'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mini App</span>
          </button>

          <button
            onClick={() => setViewMode('bot_panel')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono-pip font-bold transition ${
              viewMode === 'bot_panel'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Панель Бота</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono-pip font-bold transition ${
              viewMode === 'split'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Разделенный экран</span>
          </button>
        </div>
      </div>

      {/* Main View Container */}
      <div className="flex-1 flex flex-col">
        {viewMode === 'bot_panel' && (
          <main className="p-4 sm:p-6 flex-1">
            <BotControlPanel onOpenMiniApp={() => setViewMode('miniapp')} />
          </main>
        )}

        {viewMode === 'split' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
            {/* Left Column: Telegram Bot Control & Chat */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-screen">
              <BotControlPanel onOpenMiniApp={() => setViewMode('miniapp')} />
            </div>

            {/* Right Column: Mini App View */}
            <div className="flex flex-col bg-black/40 overflow-y-auto max-h-screen">
              {/* Profiles Top Bar */}
              <ProfilesTopBar
                profiles={appState.profiles}
                currentUserId={currentUserId}
                onSelectProfile={profile => setInspectedProfile(profile)}
              />

              {/* Mini App Header */}
              <MiniAppHeader
                currentUser={currentUser}
                profiles={appState.profiles}
                admins={appState.admins}
                onSwitchUser={id => setCurrentUserId(id)}
                onOpenMyProfile={() => setActiveTab('profile')}
                onOpenCases={() => setActiveTab('cases')}
              />

              {/* Navigation Tabs */}
              <div className="sticky top-[57px] z-20 bg-zinc-950/95 border-b border-zinc-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none backdrop-blur-md">
                <button
                  onClick={() => setActiveTab('events')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                    activeTab === 'events' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>События/Ивенты</span>
                </button>

                <button
                  onClick={() => setActiveTab('planned_rp')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                    activeTab === 'planned_rp'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                      : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Запланированные РП</span>
                </button>

                <button
                  onClick={() => setActiveTab('characters')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                    activeTab === 'characters' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  <span>📜 Анкеты</span>
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                    activeTab === 'profile' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Профиль</span>
                </button>

                <button
                  onClick={() => setActiveTab('cases')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                    activeTab === 'cases' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Кейсы</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                      activeTab === 'admin' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Админ-панель</span>
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6 flex-1">
                {activeTab === 'events' && (
                  <EventsView
                    events={appState.events}
                    profiles={appState.profiles}
                    currentUser={currentUser}
                    onJoinEvent={handleJoinEvent}
                    onOpenProfile={p => setInspectedProfile(p)}
                    onOpenAdminPanel={() => setActiveTab('admin')}
                    isAdmin={isAdmin}
                  />
                )}
                {activeTab === 'planned_rp' && (
                  <PlannedRPView
                    events={appState.events}
                    profiles={appState.profiles}
                    currentUser={currentUser}
                    onJoinEvent={handleJoinEvent}
                    onOpenProfile={p => setInspectedProfile(p)}
                    onOpenAdminPanel={() => setActiveTab('admin')}
                    isAdmin={isAdmin}
                  />
                )}
                {activeTab === 'characters' && (
                  <CharactersView
                    characters={appState.characters}
                    currentUser={currentUser}
                    onCreateCharacter={handleCreateCharacter}
                    onSelectCharacter={c => setInspectedCharacter(c)}
                  />
                )}
                {activeTab === 'profile' && (
                  <ProfileView
                    currentUser={currentUser}
                    awards={appState.awards}
                    characters={appState.characters}
                    onUpdateProfile={handleUpdateProfile}
                    onSelectCharacter={c => setInspectedCharacter(c)}
                    onOpenCases={() => setActiveTab('cases')}
                  />
                )}
                {activeTab === 'cases' && (
                  <CasesView
                    cases={appState.cases}
                    caseItems={appState.caseItems}
                    currentUser={currentUser}
                    onOpenCase={handleOpenCase}
                    onApplyCosmeticDirectly={handleApplyCosmeticDirectly}
                    onOpenAdminPanel={() => setActiveTab('admin')}
                    isAdmin={isAdmin}
                  />
                )}
                {activeTab === 'admin' && (
                  <AdminPanel
                    currentUser={currentUser}
                    admins={appState.admins}
                    events={appState.events}
                    profiles={appState.profiles}
                    awards={appState.awards}
                    cases={appState.cases}
                    caseItems={appState.caseItems}
                    onCreateEvent={handleCreateEvent}
                    onTogglePauseEvent={handleTogglePauseEvent}
                    onCompleteEvent={handleCompleteEvent}
                    onDeleteEvent={handleDeleteEvent}
                    onAddAdmin={handleAddAdmin}
                    onRemoveAdmin={handleRemoveAdmin}
                    onUpdateAdminTags={handleUpdateAdminTags}
                    onGrantMoney={handleGrantMoney}
                    onSetInfiniteMoney={handleSetInfiniteMoney}
                    onIssueAward={handleIssueAward}
                    onRevokeAward={handleRevokeAward}
                    onCreateCase={handleCreateCase}
                    onDeleteCase={handleDeleteCase}
                    onCreateItem={handleCreateItem}
                    onSelectProfile={p => setInspectedProfile(p)}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'miniapp' && (
          <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
            {/* Profiles Top Bar above all tabs */}
            <ProfilesTopBar
              profiles={appState.profiles}
              currentUserId={currentUserId}
              onSelectProfile={profile => setInspectedProfile(profile)}
            />

            {/* Mini App Header */}
            <MiniAppHeader
              currentUser={currentUser}
              profiles={appState.profiles}
              admins={appState.admins}
              onSwitchUser={id => setCurrentUserId(id)}
              onOpenMyProfile={() => setActiveTab('profile')}
              onOpenCases={() => setActiveTab('cases')}
            />

            {/* Navigation Tabs */}
            <div className="sticky top-[57px] z-20 bg-zinc-950/95 border-b border-zinc-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none backdrop-blur-md">
              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                  activeTab === 'events'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>События/Ивенты</span>
              </button>

              <button
                onClick={() => setActiveTab('planned_rp')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                  activeTab === 'planned_rp'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Запланированные РП</span>
              </button>

              <button
                onClick={() => setActiveTab('characters')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                  activeTab === 'characters'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <span>📜 Анкеты персонажей</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                  activeTab === 'profile'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Профиль игрока</span>
              </button>

              <button
                onClick={() => setActiveTab('cases')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                  activeTab === 'cases'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Кейсы</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                    activeTab === 'admin'
                      ? 'bg-amber-500 text-black shadow'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Админ-панель</span>
                </button>
              )}
            </div>

            {/* Tab Body */}
            <main className="p-4 sm:p-6 flex-1 pb-16">
              {activeTab === 'events' && (
                <EventsView
                  events={appState.events}
                  profiles={appState.profiles}
                  currentUser={currentUser}
                  onJoinEvent={handleJoinEvent}
                  onOpenProfile={p => setInspectedProfile(p)}
                  onOpenAdminPanel={() => setActiveTab('admin')}
                  isAdmin={isAdmin}
                />
              )}
              {activeTab === 'planned_rp' && (
                <PlannedRPView
                  events={appState.events}
                  profiles={appState.profiles}
                  currentUser={currentUser}
                  onJoinEvent={handleJoinEvent}
                  onOpenProfile={p => setInspectedProfile(p)}
                  onOpenAdminPanel={() => setActiveTab('admin')}
                  isAdmin={isAdmin}
                />
              )}
              {activeTab === 'characters' && (
                <CharactersView
                  characters={appState.characters}
                  currentUser={currentUser}
                  onCreateCharacter={handleCreateCharacter}
                  onSelectCharacter={c => setInspectedCharacter(c)}
                />
              )}
              {activeTab === 'profile' && (
                <ProfileView
                  currentUser={currentUser}
                  awards={appState.awards}
                  characters={appState.characters}
                  onUpdateProfile={handleUpdateProfile}
                  onSelectCharacter={c => setInspectedCharacter(c)}
                  onOpenCases={() => setActiveTab('cases')}
                />
              )}
              {activeTab === 'cases' && (
                <CasesView
                  cases={appState.cases}
                  caseItems={appState.caseItems}
                  currentUser={currentUser}
                  onOpenCase={handleOpenCase}
                  onApplyCosmeticDirectly={handleApplyCosmeticDirectly}
                  onOpenAdminPanel={() => setActiveTab('admin')}
                  isAdmin={isAdmin}
                />
              )}
              {activeTab === 'admin' && (
                <AdminPanel
                  currentUser={currentUser}
                  admins={appState.admins}
                  events={appState.events}
                  profiles={appState.profiles}
                  awards={appState.awards}
                  cases={appState.cases}
                  caseItems={appState.caseItems}
                  onCreateEvent={handleCreateEvent}
                  onTogglePauseEvent={handleTogglePauseEvent}
                  onCompleteEvent={handleCompleteEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onAddAdmin={handleAddAdmin}
                  onRemoveAdmin={handleRemoveAdmin}
                  onUpdateAdminTags={handleUpdateAdminTags}
                  onGrantMoney={handleGrantMoney}
                  onSetInfiniteMoney={handleSetInfiniteMoney}
                  onIssueAward={handleIssueAward}
                  onRevokeAward={handleRevokeAward}
                  onCreateCase={handleCreateCase}
                  onDeleteCase={handleDeleteCase}
                  onCreateItem={handleCreateItem}
                  onSelectProfile={p => setInspectedProfile(p)}
                />
              )}
            </main>
          </div>
        )}
      </div>

      {/* Inspected Player Profile Modal */}
      {inspectedProfile && (
        <PlayerProfileModal
          user={inspectedProfile}
          awards={appState.awards}
          characters={appState.characters}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onClose={() => setInspectedProfile(null)}
          onSelectCharacter={c => {
            setInspectedProfile(null);
            setInspectedCharacter(c);
          }}
          onQuickGrantMoney={isAdmin ? (userId, amt) => handleGrantMoney(userId, amt) : undefined}
        />
      )}

      {/* Inspected Character Sheet Modal */}
      {inspectedCharacter && (
        <CharacterDetailModal
          character={inspectedCharacter}
          onClose={() => setInspectedCharacter(null)}
        />
      )}
    </div>
  );
}
