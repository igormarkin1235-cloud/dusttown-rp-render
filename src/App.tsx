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
  AuctionListing,
  CompletionOutcome,
  PreReleasePost,
  Transaction,
  TransactionType,
  Faction,
  ArtworkPost,
  AppNotification,
  TabType
} from './types';
import {
  loadAppState,
  saveAppState,
  fetchServerState,
  syncUserWithServer,
  toggleAdminRoleOnServer,
  updateUserProfileOnServer,
  joinEventOnServer,
  completeEventOnServer,
  restoreServerData,
  notifyTelegramGroupAboutEvent,
  notifyTelegramGroupAboutCompletion,
  addArtworkOnServer,
  likeArtworkOnServer,
  tipArtworkOnServer,
  serverHandshakeBuyItem,
  serverHandshakeOpenCase
} from './services/storage';
import { processDailyFactionSalaries } from './services/factionSalary';
import { ProfilesTopBar } from './components/ProfilesTopBar';
import { MiniAppHeader } from './components/MiniAppHeader';
import { NavigationDock } from './components/NavigationDock';
import { RadioMusicPlayer } from './components/RadioMusicPlayer';
import { EventsView } from './components/EventsView';
import { PlannedRPView } from './components/PlannedRPView';
import { PreReleaseView } from './components/PreReleaseView';
import { FactionsView } from './components/FactionsView';
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
import { ArtGalleryView } from './components/ArtGalleryView';
import { ActivityLogView } from './components/ActivityLogView';
import { NotificationModal } from './components/NotificationModal';
import { ChatView, NukeBroadcastOverlay } from './components/ChatView';
import { installGlobalButtonSounds, setButtonSoundsEnabled } from './services/uiSound';
import {
  Smartphone,
  Bot,
  Columns,
  Coins,
  X
} from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppStateData>(loadAppState());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('dusttown_button_sounds') !== 'false';
    } catch {
      return true;
    }
  });
  
  // By default in clean browser, use a visitor profile or first registered profile
  // If Telegram WebApp is present, it binds directly to the real Telegram user
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('dt_current_user_id');
    const profiles = appState?.profiles || [];
    if (saved && profiles.some(p => p && p.id === saved)) return saved;
    return profiles[0]?.id || 'owner_mrwhitepio';
  });

  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [viewMode, setViewMode] = useState<'miniapp' | 'bot_panel' | 'split'>('miniapp');

  // Modals
  const [inspectedProfile, setInspectedProfile] = useState<UserProfile | null>(null);
  const [inspectedCharacter, setInspectedCharacter] = useState<CharacterSheet | null>(null);
  const [activeLotteryTicket, setActiveLotteryTicket] = useState<InventoryItem | null>(null);
  const [selectedCollab, setSelectedCollab] = useState<RPEvent | null>(null);
  const [salaryNotice, setSalaryNotice] = useState<{ amount: number; days: number; factionName: string } | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [selectedArtIdForFocus, setSelectedArtIdForFocus] = useState<string | null>(null);
  const [chatRecipient, setChatRecipient] = useState<UserProfile | null>(null);

  useEffect(() => {
    setButtonSoundsEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => installGlobalButtonSounds(), []);

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

    // Background real-time polling every 2 seconds with active force-sync mechanism
    // Broadcasted server snapshot actively overwrites local state to guarantee immediate reflection
    // of all participants, event registrations, balances, and profile updates across all connected users
    const interval = setInterval(async () => {
      try {
        const fresh = await fetchServerState();
        if (isMounted && fresh && Array.isArray(fresh.profiles) && fresh.profiles.length > 0) {
          setAppState(prev => {
            // Self-healing: if server rebooted with empty data and client has stored profiles/events, restore to server
            if (fresh.profiles.length <= 1 && prev.profiles.length > 1) {
              restoreServerData(prev);
              return prev;
            }

            const prevUpdated = prev.lastUpdated;
            const freshUpdated = fresh.lastUpdated;
            const prevSync = prev.syncVersion;
            const freshSync = fresh.syncVersion;

            // Force-sync check: if server has an updated syncVersion, timestamp, or any participant / event / profile mutation,
            // actively overwrite local state with the authoritative server broadcast
            const hasUpdate =
              freshSync !== prevSync ||
              freshUpdated !== prevUpdated ||
              fresh.profiles.length !== prev.profiles.length ||
              fresh.events.length !== prev.events.length ||
              fresh.characters.length !== prev.characters.length ||
              fresh.admins.length !== prev.admins.length ||
              (fresh.auctionListings?.length || 0) !== (prev.auctionListings?.length || 0) ||
              (fresh.weeklyShopItems?.length || 0) !== (prev.weeklyShopItems?.length || 0) ||
              (fresh.factions?.length || 0) !== (prev.factions?.length || 0) ||
              (fresh.artworks?.length || 0) !== (prev.artworks?.length || 0) ||
              JSON.stringify(fresh.events) !== JSON.stringify(prev.events) ||
              JSON.stringify(fresh.profiles) !== JSON.stringify(prev.profiles) ||
              JSON.stringify(fresh.characters) !== JSON.stringify(prev.characters) ||
              JSON.stringify(fresh.artworks) !== JSON.stringify(prev.artworks) ||
              JSON.stringify(fresh.factions) !== JSON.stringify(prev.factions);

            if (hasUpdate) {
              // Force-sync: actively overwrite local state with broadcasted server snapshot
              return fresh;
            }
            return prev;
          });
        }
      } catch (e) {
        // silent
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const profilesList = Array.isArray(appState?.profiles) ? appState.profiles : [];
  const fallbackProfile: UserProfile = {
    id: 'owner_mrwhitepio',
    username: '@MrWhitePio',
    displayName: 'MrWhitePio [Создатель]',
    avatarUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80',
    bio: 'Главный Архитектор и Создатель DustTown RP.',
    equivaxes: 9999999,
    isInfiniteEquivaxes: true,
    joinedAt: '2026-01-01T00:00:00Z',
    eventsAttended: 12,
    plannedRpsAttended: 8,
    inventory: []
  };

  const currentUser: UserProfile = profilesList.find(p =>
    p && (
      p.id === currentUserId ||
      (currentUserId === 'user_mrwhite' && (p.id === 'owner_mrwhitepio' || p.username?.toLowerCase() === '@mrwhitepio'))
    )
  ) || profilesList.find(p => p && p.username?.toLowerCase() === '@mrwhitepio') || profilesList[0] || fallbackProfile;

  const isOwner = currentUser?.username?.toLowerCase() === '@mrwhitepio' || currentUser?.id === 'owner_mrwhitepio';
  const isAdmin =
    isOwner ||
    (Array.isArray(appState?.admins) ? appState.admins : []).some(
      a => a && a.username && a.username.toLowerCase() === currentUser?.username?.toLowerCase()
    );

  const openDirectChat = (profile: UserProfile) => {
    setInspectedProfile(null);
    setChatRecipient(profile);
    setActiveTab('chat');
  };

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

  // Check and distribute daily faction salaries automatically (even offline)
  useEffect(() => {
    if (appState.factions && appState.factions.length > 0 && appState.profiles?.length > 0) {
      const result = processDailyFactionSalaries(appState.profiles, appState.factions, currentUserId);
      if (result.updatedProfiles !== appState.profiles) {
        updateState(prev => ({
          ...prev,
          profiles: result.updatedProfiles
        }));
      }
      if (result.grantsForCurrentUser) {
        setSalaryNotice(result.grantsForCurrentUser);
      }
    }
  }, [appState.factions, currentUserId]);

  // Financial Transaction Recorder Helper
  const applyTx = (
    profile: UserProfile,
    amount: number,
    type: TransactionType,
    title: string,
    description?: string
  ): UserProfile => {
    const isInf = profile.isInfiniteEquivaxes || profile.username.toLowerCase() === '@mrwhitepio';
    const newBal = isInf ? profile.equivaxes : profile.equivaxes + amount;
    const tx: Transaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: profile.id,
      amount,
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      balanceAfter: newBal
    };
    return {
      ...profile,
      equivaxes: newBal,
      transactions: [tx, ...(profile.transactions || [])].slice(0, 100)
    };
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

  // Market: Buy Weekly Item (Server-Side Handshake Verification)
  const handleBuyWeeklyItem = async (item: ShopWeeklyItem) => {
    const isInfinite = currentUser.isInfiniteEquivaxes || isOwner;
    if (!isInfinite && currentUser.equivaxes < item.price) {
      alert(`Недостаточно Эквиваксов для покупки «${item.name}»! Требуется: ${item.price} ℰQ.`);
      return;
    }

    const handshakeResult = await serverHandshakeBuyItem(item.id, currentUser.id, currentUser.username);
    if (handshakeResult.success && handshakeResult.fullData) {
      setAppState(handshakeResult.fullData);
      return;
    }

    if (handshakeResult.error) {
      alert(handshakeResult.error);
      return;
    }

    updateState(prev => {
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
          const profileWithTx = applyTx(
            p,
            -item.price,
            'expense_market',
            `Покупка: ${item.name}`,
            'Торговый пост Даст Таун'
          );
          return {
            ...profileWithTx,
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
          const profileWithTx = applyTx(
            p,
            -listing.price,
            'expense_auction',
            `Покупка: ${listing.item.name}`,
            `Торговец аукциона: ${listing.sellerDisplayName}`
          );
          return {
            ...profileWithTx,
            inventory: [listing.item, ...(p.inventory || [])]
          };
        }
        if (p.id === listing.sellerId) {
          return applyTx(
            p,
            listing.price,
            'income_auction',
            `Продажа: ${listing.item.name}`,
            `Покупатель: ${currentUser.displayName}`
          );
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
      const targetItem = currentUser.inventory?.find(i => i.id === itemId);
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          const profileWithTx = applyTx(
            p,
            payout,
            'income_pawnshop',
            `Скупщик: ${targetItem?.name || 'Предмет'}`,
            'Сдача снаряжения на металлолом в Пустошах'
          );
          return {
            ...profileWithTx,
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
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          const profileWithTx =
            prizeEquivaxes > 0
              ? applyTx(
                  p,
                  prizeEquivaxes,
                  'income_lottery',
                  'Выигрыш в Лотерее Пустошей',
                  `Стёрт защитный слой билета (+${prizeEquivaxes} ℰQ)`
                )
              : applyTx(
                  p,
                  0,
                  'income_lottery',
                  'Лотерея Пустошей (без выигрыша)',
                  'Стёрт защитный слой билета (числа не совпали, 0 ℰQ)'
                );
          return {
            ...profileWithTx,
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

  // Art Gallery & Creators Handlers
  const handleLikeArtwork = async (artId: string) => {
    updateState(prev => {
      const artworks = (prev.artworks || []).map(art => {
        if (art.id === artId) {
          const isLiked = art.likedByUserIds.includes(currentUser.id);
          const newLiked = isLiked
            ? art.likedByUserIds.filter(id => id !== currentUser.id)
            : [...art.likedByUserIds, currentUser.id];
          return {
            ...art,
            likedByUserIds: newLiked,
            likesCount: Math.max(0, (art.likesCount || 0) + (isLiked ? -1 : 1))
          };
        }
        return art;
      });
      return { ...prev, artworks };
    });

    const serverResult = await likeArtworkOnServer(artId, currentUser.id);
    if (serverResult && Array.isArray(serverResult.artworks)) {
      updateState(prev => ({
        ...prev,
        artworks: serverResult.artworks,
        lastUpdated: serverResult.lastUpdated || new Date().toISOString()
      }));
    }
  };

  const handleTipArtwork = async (artId: string, amount: number): Promise<boolean> => {
    if (amount <= 0) return false;
    const isInf = currentUser.isInfiniteEquivaxes || isOwner;
    if (!isInf && (currentUser.equivaxes || 0) < amount) {
      return false;
    }

    updateState(prev => {
      const art = (prev.artworks || []).find(a => a.id === artId);
      const artistUsername = art?.artistUsername?.replace(/^@/, '').toLowerCase();
      const artistDisplayName = art?.artistName?.toLowerCase();

      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          return applyTx(
            p,
            -amount,
            'expense_art_tip',
            'Чаевые художнику',
            `Поддержка творчества автора ${art?.artistUsername || 'художника'} за арт «${art?.title || 'Без названия'}»`
          );
        }
        // Author / Artist receives the tip
        const pUsername = p.username?.replace(/^@/, '').toLowerCase();
        const pDisplay = p.displayName?.toLowerCase();
        if (artistUsername && (pUsername === artistUsername || pDisplay === artistDisplayName)) {
          return applyTx(
            p,
            +amount,
            'income_art_tip',
            'Чаевые за авторский арт',
            `Получены чаевые от сталкера ${currentUser.username} за арт «${art?.title || 'Без названия'}»`
          );
        }
        return p;
      });

      const artworks = (prev.artworks || []).map(a => {
        if (a.id === artId) {
          return {
            ...a,
            tipsReceived: (a.tipsReceived || 0) + amount
          };
        }
        return a;
      });

      return {
        ...prev,
        profiles: updatedProfiles,
        artworks
      };
    });

    const serverResult = await tipArtworkOnServer(artId, currentUser.id, currentUser.username, amount);
    if (serverResult && Array.isArray(serverResult.profiles)) {
      updateState(prev => ({
        ...prev,
        profiles: serverResult.profiles,
        artworks: serverResult.artworks || prev.artworks,
        lastUpdated: serverResult.lastUpdated || new Date().toISOString()
      }));
    }

    return true;
  };

  const handleAddArtwork = async (newArt: ArtworkPost) => {
    updateState(prev => {
      const newNotif: AppNotification = {
        id: 'notif_art_' + Date.now(),
        type: 'new_art',
        title: '🎨 Новый арт в Галерее!',
        message: `${newArt.artistName} (${newArt.artistUsername}) опубликовал работу «${newArt.title}». Загляните в Арт-Ленту!`,
        timestamp: new Date().toISOString(),
        isRead: false,
        targetTab: 'gallery',
        targetId: newArt.id,
        iconEmoji: '🎨',
        badge: 'АРТ',
        actionLabel: 'Смотреть Арт'
      };

      return {
        ...prev,
        artworks: [newArt, ...(prev.artworks || [])],
        notifications: [newNotif, ...(prev.notifications || [])]
      };
    });

    const serverResult = await addArtworkOnServer(newArt);
    if (serverResult && Array.isArray(serverResult.artworks)) {
      updateState(prev => ({
        ...prev,
        artworks: serverResult.artworks,
        lastUpdated: serverResult.lastUpdated || new Date().toISOString()
      }));
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    // Mark as read
    updateState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n =>
        n.id === notif.id ? { ...n, isRead: true } : n
      )
    }));

    setIsNotificationModalOpen(false);

    // Deep navigation based on notification target
    if (notif.targetTab === 'gallery') {
      setActiveTab('gallery');
      if (notif.targetId) {
        setSelectedArtIdForFocus(notif.targetId);
      }
    } else if (notif.targetTab === 'events' || notif.targetTab === 'planned_rp') {
      setActiveTab(notif.targetTab);
      if (notif.targetId) {
        const ev = appState.events.find(e => e.id === notif.targetId);
        if (ev) setSelectedCollab(ev);
      }
    } else if (notif.targetTab === 'profile') {
      if (notif.targetId) {
        const prof = appState.profiles.find(
          p => p.id === notif.targetId || p.username.toLowerCase() === notif.targetId?.toLowerCase()
        );
        if (prof) {
          setInspectedProfile(prof);
          return;
        }
      }
      setActiveTab('profile');
    } else if (notif.targetTab) {
      setActiveTab(notif.targetTab);
    }
  };

  const handleMarkAllNotificationsRead = () => {
    updateState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => ({ ...n, isRead: true }))
    }));
  };

  // Buy Privilege Pass or Perk
  const handleBuyPrivilege = (
    privilegeKey: 'hasVip' | 'hasTraderLicense' | 'hasNeonAura' | 'hasHonoredCitizen',
    price: number
  ): boolean => {
    const isInf = currentUser.isInfiniteEquivaxes || isOwner;
    const userBal = currentUser.equivaxes || 0;
    if (!isInf && userBal < price) {
      return false;
    }

    const privilegeTitles: Record<string, string> = {
      hasVip: 'VIP-Статус «Властелин Пустоши»',
      hasTraderLicense: 'Лицензия Караванщика',
      hasNeonAura: 'Неоновая Аура Сталкера',
      hasHonoredCitizen: 'Почётный Гражданин Даст Таун'
    };
    const title = privilegeTitles[privilegeKey] || 'Премиум Привилегия';

    updateState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          const profileWithTx = applyTx(
            p,
            -price,
            'expense_privilege',
            `Привилегия: ${title}`,
            'Активация статуса в Даст Таун'
          );
          return {
            ...profileWithTx,
            [privilegeKey]: true
          };
        }
        return p;
      });

      return {
        ...prev,
        profiles: updatedProfiles
      };
    });
    return true;
  };

  // Buy VIP Privilege Pass (unlocks Pre-Release tab)
  const handleBuyVip = () => {
    handleBuyPrivilege('hasVip', 500);
  };

  // Create Pre-Release Post / Teaser
  const handleCreatePreReleasePost = (post: PreReleasePost) => {
    updateState(prev => ({
      ...prev,
      preReleasePosts: [post, ...(prev.preReleasePosts || [])]
    }));
  };

  // Delete Pre-Release Post
  const handleDeletePreReleasePost = (postId: string) => {
    updateState(prev => ({
      ...prev,
      preReleasePosts: (prev.preReleasePosts || []).filter(p => p.id !== postId)
    }));
  };

  // Event Handlers
  const handleJoinEvent = async (eventId: string) => {
    // Notify server immediately for atomic participant synchronization and immediate force-sync
    const serverResult = await joinEventOnServer(eventId, currentUser.id, currentUser.username, 'join');
    if (serverResult && Array.isArray(serverResult.profiles) && serverResult.profiles.length > 0) {
      setAppState(serverResult);
      return;
    }

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
          const profileWithTx =
            reward > 0
              ? applyTx(
                  p,
                  reward,
                  targetEvent.type === 'planned_rp' ? 'income_rp' : 'income_event',
                  `Регистрация: ${targetEvent.title}`,
                  'Стартовое довольствие за запись на вылазку'
                )
              : p;
          return {
            ...profileWithTx,
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
  const handleUpdateProfile = async (updated: UserProfile) => {
    updateState(prev => {
      const isOwner = updated.username?.toLowerCase() === '@mrwhitepio' || updated.id === 'owner_mrwhitepio' || updated.id === 'user_mrwhite';
      return {
        ...prev,
        profiles: prev.profiles.map(p => {
          const match = p.id === updated.id || (isOwner && (p.id === 'owner_mrwhitepio' || p.id === 'user_mrwhite' || p.username?.toLowerCase() === '@mrwhitepio'));
          return match ? { ...p, ...updated, id: p.id } : p;
        })
      };
    });
    // Sync single profile directly to server so all other players see changes immediately
    const serverResult = await updateUserProfileOnServer(updated.id, updated);
    if (serverResult && Array.isArray(serverResult.profiles) && serverResult.profiles.length > 0) {
      setAppState(serverResult);
    }
  };

  // Case Opening Handler (Server-Side Handshake Verification)
  const handleOpenCase = async (box: CaseBox, wonDef: CaseItemDefinition) => {
    const isInfinite = currentUser.isInfiniteEquivaxes || isOwner;
    if (!isInfinite && currentUser.equivaxes < box.price) {
      alert(`Недостаточно Эквиваксов для открытия кейса «${box.name}»! Требуется: ${box.price} ℰQ.`);
      return;
    }

    const handshakeResult = await serverHandshakeOpenCase(box.id, currentUser.id, wonDef);
    if (handshakeResult.success && handshakeResult.fullData) {
      setAppState(handshakeResult.fullData);
      return;
    }

    if (handshakeResult.error) {
      alert(handshakeResult.error);
      return;
    }

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
          const profileWithTx = applyTx(
            p,
            -box.price,
            'expense_case',
            `Кейс: ${box.name}`,
            `Получен предмет «${wonDef.name}» (${wonDef.rarity})`
          );
          return {
            ...profileWithTx,
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

  const handleCompleteEvent = async (outcome: CompletionOutcome) => {
    // Authoritatively process completion and reward distribution on server for all players
    const serverResult = await completeEventOnServer(outcome);
    if (serverResult && Array.isArray(serverResult.profiles) && serverResult.profiles.length > 0) {
      setAppState(serverResult);
    }

    const targetEvent = appState.events.find(e => e.id === outcome.eventId);
    if (!targetEvent) return;

    const attendedSet = new Set(outcome.attendedUserIds);
    const absentSet = new Set(outcome.absentUserIds);

    updateState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        const isAttended = attendedSet.has(p.id);
        const isAbsent = absentSet.has(p.id);

        if (!isAttended && !isAbsent) return p;

        const isInfinite = p.isInfiniteEquivaxes || p.username.toLowerCase() === '@mrwhitepio';
        let newEquivaxes = p.equivaxes;

        if (!isInfinite) {
          if (isAttended) {
            newEquivaxes += outcome.rewardAmount;
          } else if (isAbsent) {
            // Deduct penalty; balance can go negative into debt (e.g. -150)
            newEquivaxes -= outcome.penaltyAmount;
          }
        }

        const isPlannedRp = targetEvent.type === 'planned_rp';
        let profileWithTx = p;
        if (isAttended && outcome.rewardAmount > 0) {
          profileWithTx = applyTx(
            p,
            outcome.rewardAmount,
            isPlannedRp ? 'income_rp' : 'income_event',
            `Завершение: ${targetEvent.title}`,
            'Успешное участие в миссии Даст Таун'
          );
        } else if (isAbsent && outcome.penaltyAmount > 0) {
          profileWithTx = applyTx(
            p,
            -outcome.penaltyAmount,
            'expense_penalty',
            `Штраф за неявку: ${targetEvent.title}`,
            'Неявка на зарегистрированное мероприятие'
          );
        }

        return {
          ...profileWithTx,
          eventsAttended: isAttended && !isPlannedRp ? (p.eventsAttended || 0) + 1 : p.eventsAttended,
          plannedRpsAttended: isAttended && isPlannedRp ? (p.plannedRpsAttended || 0) + 1 : p.plannedRpsAttended
        };
      });

      const updatedEvents = prev.events.map(e =>
        e.id === outcome.eventId
          ? {
              ...e,
              isCompleted: true,
              completedAt: new Date().toISOString()
            }
          : e
      );

      return {
        ...prev,
        profiles: updatedProfiles,
        events: updatedEvents
      };
    });

    // Notify Telegram group if requested
    if (outcome.sendGroupReport) {
      const attendedUsernames = appState.profiles
        .filter(p => attendedSet.has(p.id))
        .map(p => `${p.displayName} (${p.username})`);

      const absentUsernames = appState.profiles
        .filter(p => absentSet.has(p.id))
        .map(p => `${p.displayName} (${p.username})`);

      notifyTelegramGroupAboutCompletion({
        eventTitle: targetEvent.title,
        eventType: targetEvent.type,
        attendedUsernames,
        absentUsernames,
        rewardAmount: outcome.rewardAmount,
        penaltyAmount: outcome.penaltyAmount
      }).catch(err => {
        console.warn('Failed to send group completion report:', err);
      });
    }
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
        p.id === userId
          ? applyTx(
              p,
              amount,
              'income_admin',
              amount >= 0 ? 'Начисление от администрации' : 'Списание администрацией',
              `Коррекция баланса администратором @MrWhitePio (${amount >= 0 ? '+' : ''}${amount} ℰQ)`
            )
          : p
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

  // ==========================================
  // ФРАКЦИИ: ОБРАБОТЧИКИ ДЕЙСТВИЙ
  // ==========================================
  const handleCreateFaction = (newFaction: Faction) => {
    updateState(prev => {
      const existingFactions = prev.factions || [];
      const updatedFactions = [newFaction, ...existingFactions];

      // Update creator's profile if they are the leader
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === newFaction.leaderUserId) {
          return {
            ...p,
            factionId: newFaction.id,
            factionName: newFaction.name,
            factionRole: 'Глава Фракции',
            factionRoleColor: 'text-amber-400',
            factionJoinedAt: new Date().toISOString()
          };
        }
        return p;
      });

      return {
        ...prev,
        factions: updatedFactions,
        profiles: updatedProfiles
      };
    });
  };

  const handleUpdateFaction = (updatedFaction: Faction) => {
    updateState(prev => {
      const updatedFactions = (prev.factions || []).map(f =>
        f.id === updatedFaction.id ? updatedFaction : f
      );

      // Keep member profile faction names in sync
      const updatedProfiles = prev.profiles.map(p => {
        if (p.factionId === updatedFaction.id) {
          return {
            ...p,
            factionName: updatedFaction.name
          };
        }
        return p;
      });

      return {
        ...prev,
        factions: updatedFactions,
        profiles: updatedProfiles
      };
    });
  };

  const handleDeleteFaction = (factionId: string) => {
    updateState(prev => {
      const updatedFactions = (prev.factions || []).filter(f => f.id !== factionId);
      const updatedProfiles = prev.profiles.map(p => {
        if (p.factionId === factionId) {
          return {
            ...p,
            factionId: undefined,
            factionName: undefined,
            factionRole: undefined,
            factionRoleColor: undefined,
            factionJoinedAt: undefined
          };
        }
        return p;
      });

      return {
        ...prev,
        factions: updatedFactions,
        profiles: updatedProfiles
      };
    });
  };

  const handleJoinFaction = (factionId: string) => {
    const targetFaction = (appState.factions || []).find(f => f.id === factionId);
    if (!targetFaction) return;

    const joinedAt = new Date().toISOString();
    const newMember = {
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      roleTitle: 'Новобранец',
      roleColor: 'text-amber-400',
      joinedAt,
      isLeader: false
    };

    updateState(prev => {
      const updatedFactions = (prev.factions || []).map(f => {
        if (f.id === factionId) {
          const filteredMembers = (f.members || []).filter(m => m.userId !== currentUser.id);
          return {
            ...f,
            members: [...filteredMembers, newMember]
          };
        }
        // If user was member of another faction, remove them
        return {
          ...f,
          members: (f.members || []).filter(m => m.userId !== currentUser.id)
        };
      });

      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id) {
          return {
            ...p,
            factionId: targetFaction.id,
            factionName: targetFaction.name,
            factionRole: 'Новобранец',
            factionRoleColor: 'text-amber-400',
            factionJoinedAt: joinedAt
          };
        }
        return p;
      });

      return {
        ...prev,
        factions: updatedFactions,
        profiles: updatedProfiles
      };
    });
  };

  const handleLeaveFaction = (factionId: string) => {
    updateState(prev => {
      const updatedFactions = (prev.factions || []).map(f => {
        if (f.id === factionId) {
          return {
            ...f,
            members: (f.members || []).filter(m => m.userId !== currentUser.id)
          };
        }
        return f;
      });

      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === currentUser.id && p.factionId === factionId) {
          return {
            ...p,
            factionId: undefined,
            factionName: undefined,
            factionRole: undefined,
            factionRoleColor: undefined,
            factionJoinedAt: undefined
          };
        }
        return p;
      });

      return {
        ...prev,
        factions: updatedFactions,
        profiles: updatedProfiles
      };
    });
  };

  const handleUpdateMemberRole = (
    factionId: string,
    targetUserId: string,
    newRoleTitle: string,
    newRoleColor?: string
  ) => {
    updateState(prev => {
      const updatedFactions = (prev.factions || []).map(f => {
        if (f.id === factionId) {
          return {
            ...f,
            members: (f.members || []).map(m =>
              m.userId === targetUserId
                ? { ...m, roleTitle: newRoleTitle, roleColor: newRoleColor || m.roleColor }
                : m
            )
          };
        }
        return f;
      });

      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === targetUserId) {
          return {
            ...p,
            factionRole: newRoleTitle,
            factionRoleColor: newRoleColor || p.factionRoleColor
          };
        }
        return p;
      });

      return {
        ...prev,
        factions: updatedFactions,
        profiles: updatedProfiles
      };
    });
  };

  const handleKickMember = (factionId: string, targetUserId: string) => {
    updateState(prev => {
      const updatedFactions = (prev.factions || []).map(f => {
        if (f.id === factionId) {
          return {
            ...f,
            members: (f.members || []).filter(m => m.userId !== targetUserId)
          };
        }
        return f;
      });

      const updatedProfiles = prev.profiles.map(p => {
        if (p.id === targetUserId && p.factionId === factionId) {
          return {
            ...p,
            factionId: undefined,
            factionName: undefined,
            factionRole: undefined,
            factionRoleColor: undefined,
            factionJoinedAt: undefined
          };
        }
        return p;
      });

      return {
        ...prev,
        factions: updatedFactions,
        profiles: updatedProfiles
      };
    });
  };

  const eventsList = Array.isArray(appState?.events) ? appState.events : [];
  const activeEventsCount = eventsList.filter(e => e && e.type === 'event' && !e.isCompleted).length;
  const activePlannedRpsCount = eventsList.filter(e => e && e.type === 'planned_rp' && !e.isCompleted).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative selection:bg-amber-500 selection:text-black">
      <NukeBroadcastOverlay />
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
                onOpenNotifications={() => setIsNotificationModalOpen(true)}
                unreadNotificationsCount={(appState.notifications || []).filter(n => !n.isRead).length}
              />

              <RadioMusicPlayer username={currentUser?.username} />

              {/* Only the sleek side/corner HUD panel */}
              <NavigationDock
                activeTab={activeTab}
                onTabChange={t => setActiveTab(t)}
                isAdmin={isAdmin}
                eventsCount={activeEventsCount}
                plannedRpsCount={activePlannedRpsCount}
                factionsCount={appState.factions?.length || 0}
                casesCount={appState.cases.length}
                marketItemsCount={(appState.weeklyShopItems?.length || 0) + (appState.auctionListings?.length || 0)}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(enabled => !enabled)}
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
                {activeTab === 'prerelease' && (
                  <PreReleaseView
                    currentUser={currentUser}
                    events={appState.events}
                    profiles={appState.profiles}
                    preReleasePosts={appState.preReleasePosts || []}
                    isAdmin={isAdmin}
                    onBuyVip={handleBuyVip}
                    onOpenProfile={p => setInspectedProfile(p)}
                    onCreatePost={handleCreatePreReleasePost}
                    onDeletePost={handleDeletePreReleasePost}
                  />
                )}
                {activeTab === 'factions' && (
                  <FactionsView
                    factions={appState.factions || []}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    onJoinFaction={handleJoinFaction}
                    onLeaveFaction={handleLeaveFaction}
                    onUpdateMemberRole={handleUpdateMemberRole}
                    onKickMember={handleKickMember}
                    onCreateFaction={handleCreateFaction}
                    onUpdateFaction={handleUpdateFaction}
                    onDeleteFaction={handleDeleteFaction}
                    onSelectMemberProfile={p => setInspectedProfile(p)}
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
                    onBuyVip={handleBuyVip}
                    onBuyPrivilege={handleBuyPrivilege}
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
                    artworks={appState.artworks}
                    onUpdateProfile={handleUpdateProfile}
                    onSelectCharacter={c => setInspectedCharacter(c)}
                    onOpenCases={() => setActiveTab('cases')}
                    onOpenFactions={() => setActiveTab('factions')}
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
                {activeTab === 'gallery' && (
                  <ArtGalleryView
                    artworks={appState.artworks || []}
                    currentUser={currentUser}
                    onLikeArtwork={handleLikeArtwork}
                    onTipArtwork={handleTipArtwork}
                    onAddArtwork={handleAddArtwork}
                    selectedArtIdToFocus={selectedArtIdForFocus}
                  />
                )}
                {activeTab === 'activity' && (
                  <ActivityLogView
                    logs={appState.activityLogs || []}
                    currentUser={currentUser}
                    onRefreshLogs={async () => {
                      const fresh = await fetchServerState();
                      if (fresh) setAppState(fresh);
                    }}
                    onNavigateTab={tab => setActiveTab(tab)}
                  />
                )}
                {activeTab === 'chat' && (
                  <ChatView
                    currentUser={currentUser}
                    profiles={appState.profiles}
                    selectedRecipient={chatRecipient}
                    onRecipientChange={setChatRecipient}
                    onOpenProfile={profile => setInspectedProfile(profile)}
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
                    factions={appState.factions || []}
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
                    onCreateFaction={handleCreateFaction}
                    onUpdateFaction={handleUpdateFaction}
                    onDeleteFaction={handleDeleteFaction}
                    onUpdateMemberRole={handleUpdateMemberRole}
                    onKickMember={handleKickMember}
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
              onOpenNotifications={() => setIsNotificationModalOpen(true)}
              unreadNotificationsCount={(appState.notifications || []).filter(n => !n.isRead).length}
            />

            {/* Sleek Right-Corner HUD Navigation Panel («на угол правый, половина сверху половина сбоку») */}
            <RadioMusicPlayer username={currentUser?.username} />

            <NavigationDock
              activeTab={activeTab}
              onTabChange={t => setActiveTab(t)}
              isAdmin={isAdmin}
              eventsCount={activeEventsCount}
              plannedRpsCount={activePlannedRpsCount}
              factionsCount={appState.factions?.length || 0}
              casesCount={appState.cases.length}
              marketItemsCount={(appState.weeklyShopItems?.length || 0) + (appState.auctionListings?.length || 0)}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(enabled => !enabled)}
            />

            {/* Floating Faction Daily Salary Notification */}
            {salaryNotice && (
              <div className="fixed top-16 right-4 z-50 p-4 rounded-2xl bg-zinc-950/95 border-2 border-emerald-500/80 shadow-2xl animate-fade-in flex items-start gap-3 max-w-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold font-heading text-emerald-300 uppercase">
                      Жалование фракции
                    </h4>
                    <button
                      onClick={() => setSalaryNotice(null)}
                      className="text-zinc-500 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 mt-0.5">
                    Вам начислено <strong>+{salaryNotice.amount} ℰQ</strong> за {salaryNotice.days} дн. службы во фракции «{salaryNotice.factionName}»!
                  </p>
                </div>
              </div>
            )}

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
              {activeTab === 'prerelease' && (
                <PreReleaseView
                  currentUser={currentUser}
                  events={appState.events}
                  profiles={appState.profiles}
                  preReleasePosts={appState.preReleasePosts || []}
                  isAdmin={isAdmin}
                  onBuyVip={handleBuyVip}
                  onOpenProfile={p => setInspectedProfile(p)}
                  onCreatePost={handleCreatePreReleasePost}
                  onDeletePost={handleDeletePreReleasePost}
                />
              )}
              {activeTab === 'factions' && (
                <FactionsView
                  factions={appState.factions || []}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  onJoinFaction={handleJoinFaction}
                  onLeaveFaction={handleLeaveFaction}
                  onUpdateMemberRole={handleUpdateMemberRole}
                  onKickMember={handleKickMember}
                  onCreateFaction={handleCreateFaction}
                  onUpdateFaction={handleUpdateFaction}
                  onDeleteFaction={handleDeleteFaction}
                  onSelectMemberProfile={p => setInspectedProfile(p)}
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
                  onBuyVip={handleBuyVip}
                  onBuyPrivilege={handleBuyPrivilege}
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
                  artworks={appState.artworks}
                  onUpdateProfile={handleUpdateProfile}
                  onSelectCharacter={c => setInspectedCharacter(c)}
                  onOpenCases={() => setActiveTab('cases')}
                  onOpenFactions={() => setActiveTab('factions')}
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
              {activeTab === 'gallery' && (
                <ArtGalleryView
                  artworks={appState.artworks || []}
                  currentUser={currentUser}
                  onLikeArtwork={handleLikeArtwork}
                  onTipArtwork={handleTipArtwork}
                  onAddArtwork={handleAddArtwork}
                  selectedArtIdToFocus={selectedArtIdForFocus}
                />
              )}
              {activeTab === 'activity' && (
                <ActivityLogView
                  logs={appState.activityLogs || []}
                  currentUser={currentUser}
                  onRefreshLogs={async () => {
                    const fresh = await fetchServerState();
                    if (fresh) setAppState(fresh);
                  }}
                  onNavigateTab={tab => setActiveTab(tab)}
                />
              )}
              {activeTab === 'chat' && (
                <ChatView
                  currentUser={currentUser}
                  profiles={appState.profiles}
                  selectedRecipient={chatRecipient}
                  onRecipientChange={setChatRecipient}
                  onOpenProfile={profile => setInspectedProfile(profile)}
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
                  factions={appState.factions || []}
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
                  onCreateFaction={handleCreateFaction}
                  onUpdateFaction={handleUpdateFaction}
                  onDeleteFaction={handleDeleteFaction}
                  onUpdateMemberRole={handleUpdateMemberRole}
                  onKickMember={handleKickMember}
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
          user={appState.profiles.find(p => p.id === inspectedProfile.id) || inspectedProfile}
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
          onStartChat={openDirectChat}
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
          event={appState.events.find(e => e.id === selectedCollab.id) || selectedCollab}
          currentUser={currentUser}
          onJoinEvent={handleJoinEvent}
          onClose={() => setSelectedCollab(null)}
        />
      )}

      {/* Interactive Notification Center (Звоночек) Modal */}
      {isNotificationModalOpen && (
        <NotificationModal
          notifications={appState.notifications || []}
          botVersions={appState.botVersions || []}
          onClose={() => setIsNotificationModalOpen(false)}
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
          onNavigateToTab={tab => setActiveTab(tab)}
        />
      )}
    </div>
  );
}
