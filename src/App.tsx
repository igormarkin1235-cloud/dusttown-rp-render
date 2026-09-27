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
  AdminInfo,
  ShopWeeklyItem,
  AuctionListing
} from './types';
import {
  loadAppState,
  saveAppState,
  fetchServerState,
  syncUserWithServer,
  toggleAdminRoleOnServer,
  notifyTelegramGroupAboutEvent
} from './services/storage';
import { ProfilesTopBar } from './components/ProfilesTopBar';
import { MiniAppHeader } from './components/MiniAppHeader';
import { NavigationDock, TabType } from './components/NavigationDock';
import { EventsView } from './components/EventsView';
import { PlannedRPView } from './components/PlannedRPView';
import { MarketView } from './components/MarketView';
import { CharactersView } from './components/CharactersView';
import { ProfileView } from './components/ProfileView';
import { CasesView } from './components/CasesView';
import { AdminPanel } from './components/AdminPanel';
import { BotControlPanel } from './components/BotControlPanel';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { LotteryScratchModal } from './components/LotteryScratchModal';
import { CollabTickerBanner } from './components/CollabTickerBanner';
import { CollabDetailModal } from './components/CollabDetailModal';
import {
  Smartphone,
  Bot,
  Columns
} from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppStateData>(loadAppState());

  // By default in clean browser, use a visitor profile or first registered profile
  // If Telegram WebApp is present, it binds directly to the real Telegram user
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('dt_current_user_id');
    if (saved && appState.profiles.some(p => p.id === saved)) return saved;
    return appState.profiles[0]?.id || 'owner_mrwhitepio';
  });

  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [viewMode, setViewMode] = useState<'miniapp' | 'bot_panel' | 'split'>('miniapp');

  // Modals
  const [inspectedProfile, setInspectedProfile] = useState<UserProfile | null>(null);
  const [inspectedCharacter, setInspectedCharacter] = useState<CharacterSheet | null>(null);
  const [activeLotteryTicket, setActiveLotteryTicket] = useState<InventoryItem | null>(null);
  const [selectedCollab, setSelectedCollab] = useState<RPEvent | null>(null);

  // Initial Sync + Background Polling of shared server state
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
          tg.ready();
          tg.expand();
        }

        const tgUser = tg?.initDataUnsafe?.user;
        if (tgUser) {
          // Auto-register and sync this Telegram user with server
          const { profile, fullData } = await syncUserWithServer(tgUser);
          if (isMounted) {
            if (fullData) {
              setAppState(fullData);
            }
            if (profile) {
              setCurrentUserId(profile.id);
              localStorage.setItem('dt_current_user_id', profile.id);
            }
          }
        } else {
          // Regular browser environment: load shared database from server
          const serverData = await fetchServerState();
          if (isMounted && serverData) {
            setAppState(serverData);
          }
        }
      } catch (err) {
        console.error('Failed to init/sync with server:', err);
      }
    }

    init();

    // Background polling every 6 seconds so all players see newly registered participants & events in real-time
    const interval = setInterval(async () => {
      try {
        const fresh = await fetchServerState();
        if (isMounted && fresh) {
          setAppState(prev => {
            if (
              fresh.profiles.length !== prev.profiles.length ||
              fresh.characters.length !== prev.characters.length ||
              fresh.events.length !== prev.events.length ||
              fresh.admins.length !== prev.admins.length ||
              (fresh.auctionListings?.length || 0) !== (prev.auctionListings?.length || 0) ||
              (fresh.weeklyShopItems?.length || 0) !== (prev.weeklyShopItems?.length || 0)
            ) {
              return fresh;
            }
            return prev;
          });
        }
      } catch (e) {
        // silent
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const currentUser = appState.profiles.find(p => p.id === currentUserId) || appState.profiles[0];
  const isOwner = currentUser?.username?.toLowerCase() === '@mrwhitepio';
  const isAdmin =
    isOwner ||
    appState.admins.some(a => a.username.toLowerCase() === currentUser?.username?.toLowerCase());

  // Security: If not admin, redirect away from admin tab
  useEffect(() => {
    if (!isAdmin && activeTab === 'admin') {
      setActiveTab('events');
    }
  }, [isAdmin, activeTab]);

  // Security: If not owner, force miniapp viewMode
  useEffect(() => {
    if (!isOwner && viewMode !== 'miniapp') {
      setViewMode('miniapp');
    }
  }, [isOwner, viewMode]);

  // Owner Secret PIN Unlock
  const handleUnlockOwner = (pin: string): boolean => {
    if (pin === '1235' || pin.toLowerCase() === 'dusttown') {
      const owner = appState.profiles.find(p => p.username.toLowerCase() === '@mrwhitepio');
      if (owner) {
        setCurrentUserId(owner.id);
        localStorage.setItem('dt_current_user_id', owner.id);
        return true;
      }
    }
    return false;
  };

  // Persistence Helper
  const updateState = (updater: (prev: AppStateData) => AppStateData) => {
    setAppState(prev => {
      const next = updater(prev);
      saveAppState(next);
      return next;
    });
  };

  // Owner Admin Rights Toggle
  const handleToggleAdmin = async (targetUsername: string, makeAdmin: boolean) => {
    if (!isOwner) return;

    await toggleAdminRoleOnServer('@MrWhitePio', targetUsername, makeAdmin ? 'add' : 'remove', ['Администратор']);

    updateState(prev => {
      const formatted = targetUsername.startsWith('@') ? targetUsername : `@${targetUsername}`;
      let updatedAdmins = [...prev.admins];
      if (makeAdmin) {
        if (!updatedAdmins.some(a => a.username.toLowerCase() === formatted.toLowerCase())) {
          updatedAdmins.push({
            username: formatted,
            tags: ['Администратор', 'Мастер'],
            addedAt: new Date().toISOString(),
            isMainCreator: formatted.toLowerCase() === '@mrwhitepio'
          });
        }
      } else {
        if (formatted.toLowerCase() !== '@mrwhitepio') {
          updatedAdmins = updatedAdmins.filter(a => a.username.toLowerCase() !== formatted.toLowerCase());
        }
      }
      return {
        ...prev,
        admins: updatedAdmins
      };
    });
  };

  // Market: Buy Weekly Item
  const handleBuyWeeklyItem = (item: ShopWeeklyItem) => {
    updateState(prev => {
      const isInfinite = currentUser.isInfiniteEquivaxes || isOwner;
      if (!isInfinite && currentUser.equivaxes < item.price) {
        alert('Недостаточно Эквиваксов для покупки!');
        return prev;
      }

      const invItem: InventoryItem = {
        id: 'inv_' + Date.now(),
        itemId: item.itemId || item.id,
        name: item.name,
        photoUrl: item.photoUrl,
        bgStyle: item.bgStyle || '',
        textStyle: item.textStyle || '',
        rarity: item.rarity,
        type: item.type,
        appliedValue: item.appliedValue,
        acquiredAt: new Date().toISOString()
      };

      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          return {
            ...p,
            equivaxes: isInfinite ? p.equivaxes : p.equivaxes - item.price,
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

  // Market: Add Weekly Item (Admin/Owner)
  const handleAddWeeklyItem = (newItem: ShopWeeklyItem) => {
    updateState(prev => ({
      ...prev,
      weeklyShopItems: [newItem, ...(prev.weeklyShopItems || [])]
    }));
  };

  // Market: Remove Weekly Item (Admin/Owner)
  const handleRemoveWeeklyItem = (itemId: string) => {
    updateState(prev => ({
      ...prev,
      weeklyShopItems: (prev.weeklyShopItems || []).filter(i => i.id !== itemId)
    }));
  };

  // Market: List on Auction
  const handleListItemOnAuction = (item: InventoryItem, price: number) => {
    updateState(prev => {
      // Remove from seller's inventory
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          return {
            ...p,
            inventory: (p.inventory || []).filter(i => i.id !== item.id)
          };
        }
        return p;
      });

      const listing: AuctionListing = {
        id: 'auc_' + Date.now(),
        sellerId: currentUser.id,
        sellerUsername: currentUser.username,
        sellerDisplayName: currentUser.displayName,
        sellerAvatarUrl: currentUser.avatarUrl,
        sellerThemeBg: currentUser.activeTextBg,
        item,
        price,
        listedAt: new Date().toISOString()
      };

      return {
        ...prev,
        profiles: updatedProfiles,
        auctionListings: [listing, ...(prev.auctionListings || [])]
      };
    });
  };

  // Market: Cancel Auction Listing
  const handleCancelAuctionListing = (listingId: string) => {
    updateState(prev => {
      const listing = (prev.auctionListings || []).find(l => l.id === listingId);
      if (!listing) return prev;

      // Return item back to seller's inventory
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === listing.sellerId) {
          return {
            ...p,
            inventory: [listing.item, ...(p.inventory || [])]
          };
        }
        return p;
      });

      return {
        ...prev,
        profiles: updatedProfiles,
        auctionListings: (prev.auctionListings || []).filter(l => l.id !== listingId)
      };
    });
  };

  // Market: Buy from Auction
  const handleBuyAuctionItem = (listing: AuctionListing) => {
    updateState(prev => {
      const isInfinite = currentUser.isInfiniteEquivaxes || isOwner;
      if (!isInfinite && currentUser.equivaxes < listing.price) {
        alert('Недостаточно Эквиваксов для покупки на аукционе!');
        return prev;
      }

      // Transfer money to seller, deduct from buyer, transfer item to buyer
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          return {
            ...p,
            equivaxes: isInfinite ? p.equivaxes : p.equivaxes - listing.price,
            inventory: [listing.item, ...(p.inventory || [])]
          };
        }
        if (p.id === listing.sellerId) {
          return {
            ...p,
            equivaxes: p.equivaxes + listing.price
          };
        }
        return p;
      });

      return {
        ...prev,
        profiles: updatedProfiles,
        auctionListings: (prev.auctionListings || []).filter(l => l.id !== listing.id)
      };
    });
  };

  // Sell item to pawnshop directly from profile
  const handleSellItemToPawnshop = (itemId: string, payout: number) => {
    updateState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          return {
            ...p,
            equivaxes: p.equivaxes + payout,
            inventory: (p.inventory || []).filter(i => i.id !== itemId)
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

  // Issue Lottery Ticket to Player (Admin/Owner)
  const handleIssueLotteryTicket = (userId: string, ticketItem: InventoryItem) => {
    updateState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === userId) {
          return {
            ...p,
            inventory: [ticketItem, ...(p.inventory || [])]
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

  // Claim Lottery Prize when scratched
  const handleClaimLotteryPrize = (ticketId: string, prizeEquivaxes: number) => {
    updateState(prev => {
      const isInfinite = currentUser.isInfiniteEquivaxes || isOwner;
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          return {
            ...p,
            equivaxes: isInfinite ? p.equivaxes : p.equivaxes + prizeEquivaxes,
            inventory: (p.inventory || []).filter(i => i.id !== ticketId)
          };
        }
        return p;
      });

      return {
        ...prev,
        profiles: updatedProfiles
      };
    });

    setTimeout(() => {
      setActiveLotteryTicket(null);
    }, 1200);
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

      const updatedEvents = prev.events.map(e =>
        e.id === eventId ? { ...e, participants: [...e.participants, currentUser.username] } : e
      );

      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          return {
            ...p,
            equivaxes: p.isInfiniteEquivaxes || isOwner ? p.equivaxes : p.equivaxes + reward,
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
          const isInfinite = p.isInfiniteEquivaxes || isOwner;
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

  // Admin Actions
  const handleCreateEvent = (newEvent: RPEvent) => {
    updateState(prev => ({ ...prev, events: [newEvent, ...prev.events] }));
    // Automatically announce new event/collab/RP to Telegram community group
    notifyTelegramGroupAboutEvent(newEvent).catch(err => {
      console.warn('Failed to notify group about event:', err);
    });
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

  const handleAddAdmin = (admin: AdminInfo) => {
    if (!isOwner) return;
    updateState(prev => ({ ...prev, admins: [...prev.admins, admin] }));
  };

  const handleRemoveAdmin = (username: string) => {
    if (!isOwner) return;
    if (username.toLowerCase() === '@mrwhitepio') return;
    updateState(prev => ({
      ...prev,
      admins: prev.admins.filter(a => a.username.toLowerCase() !== username.toLowerCase())
    }));
  };

  const handleUpdateAdminTags = (username: string, tags: string[]) => {
    if (!isOwner) return;
    updateState(prev => ({
      ...prev,
      admins: prev.admins.map(a =>
        a.username.toLowerCase() === username.toLowerCase() ? { ...a, tags } : a
      )
    }));
  };

  const handleGrantMoney = (userId: string, amount: number) => {
    updateState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p =>
        p.id === userId ? { ...p, equivaxes: Math.max(0, p.equivaxes + amount) } : p
      )
    }));
  };

  const handleSetInfiniteMoney = (userId: string, isInfinite: boolean) => {
    updateState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p =>
        p.id === userId ? { ...p, isInfiniteEquivaxes: isInfinite } : p
      )
    }));
  };

  const handleIssueAward = (award: Award) => {
    updateState(prev => ({ ...prev, awards: [award, ...prev.awards] }));
  };

  const handleRevokeAward = (awardId: string) => {
    updateState(prev => ({
      ...prev,
      awards: prev.awards.filter(a => a.id !== awardId)
    }));
  };

  const handleCreateCase = (newCase: CaseBox) => {
    updateState(prev => ({ ...prev, cases: [newCase, ...prev.cases] }));
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

  const activeEventsCount = appState.events.filter(e => e.type === 'event' && !e.isCompleted).length;
  const activePlannedRpsCount = appState.events.filter(e => e.type === 'planned_rp' && !e.isCompleted).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative selection:bg-amber-500 selection:text-black">
      {/* Top Mode Switcher Bar: STRICTLY VISIBLE ONLY TO OWNER */}
      {isOwner && (
        <div className="w-full bg-zinc-900 border-b border-zinc-800 px-3 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-amber-400 tracking-wider">
              ДАСТ ТАУН КОЛЕКТИВ
            </span>
            <span className="hidden sm:inline text-zinc-500 font-mono-pip">•</span>
            <span className="hidden sm:inline text-zinc-400 font-mono-pip">
              Панель Главного Создателя:
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
                  ? 'badge-owner-shimmer text-black shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Панель Управления Ботом</span>
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
      )}

      {/* Main View Container */}
      <div className="flex-1 flex flex-col">
        {isOwner && viewMode === 'bot_panel' && (
          <main className="p-4 sm:p-6 flex-1">
            <BotControlPanel onOpenMiniApp={() => setViewMode('miniapp')} />
          </main>
        )}

        {isOwner && viewMode === 'split' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
            {/* Left Column: Telegram Bot Control & Chat */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-screen">
              <BotControlPanel onOpenMiniApp={() => setViewMode('miniapp')} />
            </div>

            {/* Right Column: Mini App View */}
            <div className="flex flex-col bg-black/40 overflow-y-auto max-h-screen relative">
              {/* Collab Ticker Running Banner (События-коллаборации) */}
              <CollabTickerBanner
                collabs={appState.events}
                onSelectCollab={collab => setSelectedCollab(collab)}
              />

              <ProfilesTopBar
                profiles={appState.profiles}
                admins={appState.admins}
                currentUserId={currentUserId}
                onSelectProfile={profile => setInspectedProfile(profile)}
              />

              <MiniAppHeader
                currentUser={currentUser}
                admins={appState.admins}
                onOpenMyProfile={() => setActiveTab('profile')}
                onOpenCases={() => setActiveTab('cases')}
                onUnlockOwner={handleUnlockOwner}
              />

              {/* Only the sleek side/corner HUD panel */}
              <NavigationDock
                activeTab={activeTab}
                onTabChange={t => setActiveTab(t)}
                isAdmin={isAdmin}
                eventsCount={activeEventsCount}
                plannedRpsCount={activePlannedRpsCount}
                casesCount={appState.cases.length}
                marketItemsCount={(appState.weeklyShopItems?.length || 0) + (appState.auctionListings?.length || 0)}
              />

              <div className="p-4 sm:p-6 flex-1 pr-12 sm:pr-14">
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
                {activeTab === 'market' && (
                  <MarketView
                    currentUser={currentUser}
                    profiles={appState.profiles}
                    weeklyItems={appState.weeklyShopItems || []}
                    auctionListings={appState.auctionListings || []}
                    caseItems={appState.caseItems || []}
                    isAdmin={isAdmin}
                    onBuyWeeklyItem={handleBuyWeeklyItem}
                    onAddWeeklyItem={handleAddWeeklyItem}
                    onRemoveWeeklyItem={handleRemoveWeeklyItem}
                    onListItemOnAuction={handleListItemOnAuction}
                    onCancelAuctionListing={handleCancelAuctionListing}
                    onBuyAuctionItem={handleBuyAuctionItem}
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
                    onSellItemToPawnshop={handleSellItemToPawnshop}
                    onOpenLotteryTicket={ticket => setActiveLotteryTicket(ticket)}
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
                {isAdmin && activeTab === 'admin' && (
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
                    onIssueLotteryTicket={handleIssueLotteryTicket}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'miniapp' && (
          <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto relative">
            {/* Collab Ticker Running Banner (События-коллаборации) */}
            <CollabTickerBanner
              collabs={appState.events}
              onSelectCollab={collab => setSelectedCollab(collab)}
            />

            {/* Profiles Top Bar */}
            <ProfilesTopBar
              profiles={appState.profiles}
              admins={appState.admins}
              currentUserId={currentUserId}
              onSelectProfile={profile => setInspectedProfile(profile)}
            />

            {/* Mini App Header */}
            <MiniAppHeader
              currentUser={currentUser}
              admins={appState.admins}
              onOpenMyProfile={() => setActiveTab('profile')}
              onOpenCases={() => setActiveTab('cases')}
              onUnlockOwner={handleUnlockOwner}
            />

            {/* Sleek Right-Corner HUD Navigation Panel («на угол правый, половина сверху половина сбоку») */}
            <NavigationDock
              activeTab={activeTab}
              onTabChange={t => setActiveTab(t)}
              isAdmin={isAdmin}
              eventsCount={activeEventsCount}
              plannedRpsCount={activePlannedRpsCount}
              casesCount={appState.cases.length}
              marketItemsCount={(appState.weeklyShopItems?.length || 0) + (appState.auctionListings?.length || 0)}
            />

            {/* Tab Body */}
            <main className="p-4 sm:p-6 flex-1 pb-16 pr-12 sm:pr-14">
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
              {activeTab === 'market' && (
                <MarketView
                  currentUser={currentUser}
                  profiles={appState.profiles}
                  weeklyItems={appState.weeklyShopItems || []}
                  auctionListings={appState.auctionListings || []}
                  caseItems={appState.caseItems || []}
                  isAdmin={isAdmin}
                  onBuyWeeklyItem={handleBuyWeeklyItem}
                  onAddWeeklyItem={handleAddWeeklyItem}
                  onRemoveWeeklyItem={handleRemoveWeeklyItem}
                  onListItemOnAuction={handleListItemOnAuction}
                  onCancelAuctionListing={handleCancelAuctionListing}
                  onBuyAuctionItem={handleBuyAuctionItem}
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
                  onSellItemToPawnshop={handleSellItemToPawnshop}
                  onOpenLotteryTicket={ticket => setActiveLotteryTicket(ticket)}
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
              {isAdmin && activeTab === 'admin' && (
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
                  onIssueLotteryTicket={handleIssueLotteryTicket}
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
          admins={appState.admins}
          isAdmin={isAdmin}
          onClose={() => setInspectedProfile(null)}
          onSelectCharacter={c => {
            setInspectedProfile(null);
            setInspectedCharacter(c);
          }}
          onQuickGrantMoney={isAdmin ? (userId, amt) => handleGrantMoney(userId, amt) : undefined}
          onToggleAdmin={isOwner ? handleToggleAdmin : undefined}
          onIssueLotteryTicket={handleIssueLotteryTicket}
        />
      )}

      {/* Inspected Character Sheet Modal */}
      {inspectedCharacter && (
        <CharacterDetailModal
          character={inspectedCharacter}
          onClose={() => setInspectedCharacter(null)}
        />
      )}

      {/* Interactive Lottery Scratch Modal */}
      {activeLotteryTicket && (
        <LotteryScratchModal
          ticketItem={activeLotteryTicket}
          onClaimPrize={handleClaimLotteryPrize}
          onClose={() => setActiveLotteryTicket(null)}
        />
      )}

      {/* Collaboration Event Detail Modal */}
      {selectedCollab && (
        <CollabDetailModal
          event={selectedCollab}
          currentUser={currentUser}
          onJoinEvent={handleJoinEvent}
          onClose={() => setSelectedCollab(null)}
        />
      )}
    </div>
  );
}
