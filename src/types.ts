export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export function getItemPawnPrice(rarity: Rarity): number {
  switch (rarity) {
    case 'common':
      return 20; // 20% от средней награды за 1 РП (100 EQ)
    case 'rare':
      return 60; // 60% от РП
    case 'epic':
      return 180; // ~1.8 РП
    case 'legendary':
      return 450; // ~4.5 РП
    default:
      return 25;
  }
}

export interface ShopWeeklyItem {
  id: string;
  itemId?: string;
  name: string;
  description: string;
  photoUrl: string;
  bgStyle?: string;
  textStyle?: string;
  rarity: Rarity;
  type: 'item' | 'profile_theme' | 'profile_text_color' | 'profile_text_bg' | 'avatar_frame';
  appliedValue?: string;
  price: number; // in Equivaxes
  oldPrice?: number;
  badge?: string; // e.g. "ХИТ НЕДЕЛИ", "ЛИМИТИРОВАННЫЙ"
  stock?: number;
  addedBy: string;
  addedAt: string;
}

export interface AuctionListing {
  id: string;
  sellerId: string;
  sellerUsername: string;
  sellerDisplayName: string;
  sellerAvatarUrl: string;
  sellerThemeBg?: string;
  item: InventoryItem;
  price: number; // in Equivaxes
  listedAt: string;
}

export interface UserProfile {
  id: string;
  username: string; // e.g. @MrWhitePio
  displayName: string;
  avatarUrl: string;
  bio?: string;
  equivaxes: number;
  isInfiniteEquivaxes?: boolean;
  joinedAt: string;
  // Selected cosmetics
  activeThemeId?: string; // 'default' | 'black_tree' | 'rad_storm' | 'rad_core' | 'quantum_pulse' | 'cyber_neon' | etc.
  activeTextColor?: string;
  activeTextBg?: string;
  activeAvatarFrame?: string; // 'frame_none' | 'frame_gold_3d' | 'frame_rad_pulse' | 'frame_cyber_glitch' | etc.
  // Stats
  eventsAttended: number;
  plannedRpsAttended: number;
  inventory: InventoryItem[];
}

export interface LotteryTicketData {
  prizeEquivaxes: number;
  numbers: [number, number, number];
  isWinner: boolean;
  ticketSerial: string;
  themeTitle?: string;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  photoUrl: string;
  bgStyle: string;
  textStyle: string;
  rarity: Rarity;
  type: 'item' | 'profile_theme' | 'profile_text_color' | 'profile_text_bg' | 'avatar_frame' | 'lottery_ticket';
  appliedValue?: string;
  acquiredAt: string;
  lotteryData?: LotteryTicketData;
}

export interface AdminInfo {
  username: string;
  tags: string[];
  addedAt: string;
  isMainCreator?: boolean;
}

export interface CharacterSheet {
  id: string;
  creatorTelegram: string;
  creatorDustTownName: string;
  name: string;
  surname: string;
  patronymic: string;
  nickname: string;
  age: string;
  race: string;
  cutieMark: string;
  magic: string;
  hobby: string;
  job: string;
  faction: string;
  relatives: string;
  character: string;
  biography: string;
  features: string;
  track: string;
  voice: string;
  photoUrl: string;
  plusCustom: string;
  avatarIcon: string;
  createdAt: string;
  status: 'approved' | 'pending';
}

export type EventCategory = 'event' | 'collab' | 'planned_rp';

export interface RPEvent {
  id: string;
  type: EventCategory;
  title: string;
  description: string;
  location: string;
  faction: string;
  hasGM: boolean;
  bannerUrl: string;
  startTime: string; // ISO string
  rewardEquivaxes: number;
  isPaused: boolean;
  isCompleted: boolean;
  completedAt?: string;
  hasRainbowText?: boolean;
  participants: string[]; // usernames or profile IDs
  collabClanName?: string; // Название клана-партнёра (для событий-коллабораций)
  collabClanUrl?: string; // Ссылка на группу/канал клана-партнёра
}

export interface Award {
  id: string;
  recipientUsername: string;
  icon: string; // 🎖️, ⭐, 🪶, 💖, 💀, ⚙️, ☢️, 👑, ⚡, 📟
  title: string;
  description: string;
  titleColor: string;
  textColor: string;
  cardBg: string;
  awardedBy: string;
  awardedAt: string;
}

export interface CaseItemDefinition {
  id: string;
  name: string;
  photoUrl: string;
  bgStyle: string;
  textStyle: string;
  rarity: Rarity;
  type: 'item' | 'profile_theme' | 'profile_text_color' | 'profile_text_bg' | 'avatar_frame';
  appliedValue?: string;
}

export interface CaseBox {
  id: string;
  name: string;
  price: number;
  description: string;
  skinType: 'supply_crate' | 'quantum_crystal' | 'reliquary' | 'cosmetic_box';
  animationType: 'shake_burst' | 'crystal_split' | 'golden_unfold';
  dropItemIds: string[];
}

export interface AppStateData {
  profiles: UserProfile[];
  admins: AdminInfo[];
  characters: CharacterSheet[];
  events: RPEvent[];
  awards: Award[];
  cases: CaseBox[];
  caseItems: CaseItemDefinition[];
  weeklyShopItems: ShopWeeklyItem[];
  auctionListings: AuctionListing[];
}
