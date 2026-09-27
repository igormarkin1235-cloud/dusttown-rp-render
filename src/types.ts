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
  // VIP & Privileges (unlocks Pre-Release tab, trader perks & cosmetics)
  hasVip?: boolean;
  vipExpiresAt?: string;
  hasTraderLicense?: boolean;
  hasNeonAura?: boolean;
  hasHonoredCitizen?: boolean;
  // Transactions log
  transactions?: Transaction[];
  // Completed & claimed achievements
  claimedAchievementIds?: string[];
}

export type AchievementType =
  | 'events_count'       // Поучаствовать в N ивентах/событиях
  | 'rp_count'           // Поучаствовать в N запланированных РП
  | 'any_event_count'    // Общее число участий в ивентах и РП
  | 'time_in_bot_days'   // Провести N дней в боте/городе
  | 'rare_cases_count'   // Получить N редких/эпических/легендарных предметов с кейсов
  | 'cases_opened_count' // Открыть N кейсов
  | 'characters_count'   // Создать N анкет персонажей
  | 'equivaxes_balance'  // Накопить баланс от N Эквиваксов (ℰQ)
  | 'auction_deals'      // Совершить N покупок или продаж на аукционе
  | 'lottery_tickets'    // Стереть N лотерейных билетов
  | 'awards_count';      // Заслужить N орденов/заслуг

export type AchievementRewardType =
  | 'equivaxes'
  | 'text_color'
  | 'profile_bg'
  | 'both';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  targetValue: number;
  iconUrl: string; // PNG icon (uploaded or chosen PNG)
  rewardType: AchievementRewardType;
  rewardAmount?: number; // Equivaxes amount
  rewardCosmeticId?: string; // cosmetic value / style class
  rewardCosmeticName?: string; // e.g. "Неоновый Лазурный 💎"
  createdAt: string;
  createdBy: string;
}

export type TransactionType =
  | 'income_event'
  | 'income_rp'
  | 'income_auction'
  | 'income_pawnshop'
  | 'income_lottery'
  | 'income_admin'
  | 'expense_market'
  | 'expense_auction'
  | 'expense_case'
  | 'expense_lottery'
  | 'expense_privilege'
  | 'expense_penalty';

export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Positive for credit (+), negative for debit (-)
  type: TransactionType;
  title: string;
  description?: string;
  timestamp: string; // ISO string
  balanceAfter?: number;
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
  isPreRelease?: boolean; // Выставлено в закрытую вкладку «Пред-релиз»
  authorUsername?: string; // Ник администратора, создавшего РП-сессию
  authorDisplayName?: string; // Отображаемое имя администратора
  textColor?: string; // Настройка цвета обычного текста
  bgGradient?: string; // Настройка фона карточки/текста
}

export interface PreReleasePost {
  id: string;
  title: string;
  content: string;
  bannerUrl?: string;
  textColor?: string;
  bgGradient?: string;
  createdAt: string;
  authorUsername: string;
  authorDisplayName: string;
}

export interface CompletionOutcome {
  eventId: string;
  attendedUserIds: string[];
  absentUserIds: string[];
  excusedUserIds?: string[];
  rewardAmount: number;
  penaltyAmount: number;
  sendGroupReport?: boolean;
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
  preReleasePosts?: PreReleasePost[];
  achievements?: Achievement[];
}
