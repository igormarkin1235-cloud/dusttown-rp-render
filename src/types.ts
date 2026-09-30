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
  // Unlocked cosmetics (Players start with 3 basic items in each category; rest must be bought or won from chests)
  unlockedThemes?: string[];
  unlockedFrames?: string[];
  unlockedTextColors?: string[];
  unlockedTextBgs?: string[];
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
  // Faction membership & role
  factionId?: string;
  factionName?: string;
  factionRole?: string; // Title/position in faction (e.g., "Командир", "Штурмовик", "Главврач", "Новобранец")
  factionRoleColor?: string; // Color styling for the role badge
  factionJoinedAt?: string;
  lastFactionSalaryDate?: string; // YYYY-MM-DD to track daily 10 ℰQ salary distribution
  // Transactions log
  transactions?: Transaction[];
  // Completed & claimed achievements
  claimedAchievementIds?: string[];
  // Pinned arts / photos showcase (up to 3 artworks or photos)
  pinnedArts?: Array<{ id: string; url: string; title?: string; fitMode?: 'contain' | 'cover' }>;
  // Custom photo background & effects
  customBgUrl?: string;
  customBgEffect?: 'none' | 'embers' | 'radiation' | 'glitch' | 'dust' | 'cyber' | 'vignette';
  customBgPosition?: 'center' | 'top' | 'bottom';
  // Avatar cropping and framing customization
  avatarFitMode?: 'cover' | 'contain';
  avatarZoom?: number; // 1 to 2.5
  avatarOffsetY?: number; // -50 to 50
  avatarOffsetX?: number; // -50 to 50
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
  | 'income_art_tip'
  | 'expense_market'
  | 'expense_auction'
  | 'expense_case'
  | 'expense_lottery'
  | 'expense_privilege'
  | 'expense_penalty'
  | 'expense_art_tip'
  | 'expense_other';

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
  numbers?: [number, number, number];
  isWinner?: boolean;
  ticketSerial?: string;
  themeTitle?: string;
  tier?: 'major' | 'minor' | 'loss';
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

export interface FactionMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  roleTitle: string; // e.g. "Глава Фракции", "Командир разведки", "Штурмовик", "Старший Медик", "Интендант", "Рядовой", "Новобранец"
  roleColor?: string; // text-amber-400, text-cyan-400, text-rose-400, text-emerald-400, etc.
  joinedAt: string;
  isLeader?: boolean;
}

export interface Faction {
  id: string;
  name: string;
  tag: string; // e.g. "СРЭ", "BOS", "NCR", "ТГ"
  motto?: string;
  description: string;
  logoUrl: string; // Preview photo / emblem
  bannerUrl?: string; // Header background photo
  // Styling settings
  accentColor: string; // hex or tailwind class
  bgGradient: string; // CSS gradient class
  textColor: string; // text style class
  borderColor?: string;
  // Leadership & roster
  leaderUserId: string;
  leaderUsername: string;
  members: FactionMember[];
  isRecruiting: boolean;
  dailySalary: number; // default 10 Equivaxes
  createdAt: string;
  createdBy: string;
}

export type TabType =
  | 'events'
  | 'planned_rp'
  | 'prerelease'
  | 'factions'
  | 'market'
  | 'characters'
  | 'profile'
  | 'cases'
  | 'admin'
  | 'gallery'
  | 'activity'
  | 'chat';

export type ChatMessageType = 'text' | 'nuke' | 'system';

export interface ChatMessageStyle {
  customBgUrl?: string;
  customBgEffect?: 'none' | 'embers' | 'radiation' | 'glitch' | 'dust' | 'cyber' | 'vignette';
  customBgPosition?: 'center' | 'top' | 'bottom';
  textColorClass?: string;
  profileTextBg?: string;
  profileTextColor?: string;
  bubbleBorderTheme?: string;
  themePreset?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  senderFrameId?: string;
  senderRole?: string;
  content: string;
  timestamp: string; // ISO string
  type: ChatMessageType;
  style?: ChatMessageStyle;
  isNuke?: boolean;
  nukePricePaid?: number;
  recipientId?: string; // If set, this is a private message
  recipientUsername?: string;
  recipientDisplayName?: string;
}

export interface NukeBroadcastAlert {
  id: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  senderFrameId?: string;
  message: string;
  timestamp: string;
  expiresAt: number;
}

export interface ArtworkPost {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  artistName: string;
  artistUsername: string; // e.g. "@starlight_art"
  artistAvatarUrl?: string;
  likesCount: number;
  likedByUserIds: string[];
  tipsReceived: number; // total tips in ℰQ
  tags: string[];
  createdAt: string; // ISO string
  isWeeklyTop?: boolean;
  promoBadge?: string; // e.g. "🏆 Арт Недели #1", "🥈 Топ-2 Недели", "🥉 Топ-3 Недели"
  viewsCount?: number;
  fitMode?: 'contain' | 'cover'; // Presentation preference for uncropped vs filled card
}

export type ActivityLogCategory =
  | 'event_join'
  | 'event_leave'
  | 'event_create'
  | 'event_complete'
  | 'shop_purchase'
  | 'case_open'
  | 'auction_bid'
  | 'art_publish'
  | 'art_tip'
  | 'profile_update'
  | 'faction_action'
  | 'award_grant'
  | 'financial_tx';

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO string
  userId?: string;
  username: string; // e.g. @MrWhitePio
  displayName?: string;
  userAvatarUrl?: string;
  category: ActivityLogCategory;
  title: string;
  description: string;
  details?: {
    amount?: number;
    targetName?: string;
    targetId?: string;
    badge?: string;
    txType?: string;
    handshakeToken?: string;
  };
  serverVerified: boolean;
  handshakeId?: string;
}

export type NotificationType =
  | 'new_art'
  | 'bot_update'
  | 'auction'
  | 'event'
  | 'new_user'
  | 'faction'
  | 'case'
  | 'new_vip'
  | 'new_admin';

export interface BotFileChange {
  fileName: string;
  changeType: 'created' | 'modified' | 'refactored';
  description: string;
}

export interface BotVersionRecord {
  version: string;
  releaseDate: string;
  title: string;
  description: string;
  changedFiles: BotFileChange[];
  highlights: string[];
  targetTab?: TabType;
  targetActionLabel?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  targetTab: TabType;
  targetId?: string;
  iconEmoji?: string;
  badge?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
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
  factions?: Faction[];
  artworks?: ArtworkPost[];
  activityLogs?: ActivityLogEntry[];
  notifications?: AppNotification[];
  botVersions?: BotVersionRecord[];
  lastUpdated?: string;
  syncVersion?: number;
}
