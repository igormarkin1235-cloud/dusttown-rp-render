export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

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

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  photoUrl: string;
  bgStyle: string;
  textStyle: string;
  rarity: Rarity;
  type: 'item' | 'profile_theme' | 'profile_text_color' | 'profile_text_bg' | 'avatar_frame';
  appliedValue?: string;
  acquiredAt: string;
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

export interface RPEvent {
  id: string;
  type: 'event' | 'planned_rp';
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
}
