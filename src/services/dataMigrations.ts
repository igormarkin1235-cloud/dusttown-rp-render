import { AppStateData, RPEvent, UserProfile } from '../types';
import {
  INITIAL_ACHIEVEMENTS,
  INITIAL_ADMINS,
  INITIAL_AUCTION_LISTINGS,
  INITIAL_AWARDS,
  INITIAL_CASES,
  INITIAL_CASE_ITEMS,
  INITIAL_CHARACTERS,
  INITIAL_EVENTS,
  INITIAL_FACTIONS,
  INITIAL_PROFILES,
  INITIAL_WEEKLY_SHOP_ITEMS
} from './storage';
import { INITIAL_ARTWORKS, INITIAL_BOT_VERSIONS, INITIAL_NOTIFICATIONS } from './galleryAndNotificationsData';

export const CURRENT_DATA_SCHEMA_VERSION = 1;
export const DEPRECATED_BACKGROUND_REFUND = 150;

const supportedThemeIds = new Set([
  'default', 'custom', 'bg_custom_photo', 'black_tree', 'rad_storm', 'rad_core',
  'quantum_pulse', 'cyber_neon', 'solar_gold', 'bg_sparkle_cola', 'bg_pinkie_watching',
  'bg_mowt_hero', 'bg_mowt_halo', 'bg_mop_fluttershy', 'bg_mop_poster', 'bg_stable_tec',
  'bg_foe_heroes', 'bg_blizzard_tower', 'bg_rad_dna', 'bg_rad_glitch',
  'bg_alien_mushrooms', 'bg_fog_hellhound', 'bg_crimson_canyon', 'bg_moonlit_forest',
  'bg_sunset_peaks', 'bg_wasteland_art_1', 'bg_wasteland_art_2'
]);

const supportedTextBackgrounds = new Set([
  ...INITIAL_CASE_ITEMS
    .filter(item => item.type === 'profile_text_bg' && item.appliedValue)
    .map(item => item.appliedValue as string),
  ...INITIAL_ACHIEVEMENTS
    .filter(item => (item.rewardType === 'profile_bg' || item.rewardType === 'both') && item.rewardCosmeticId)
    .map(item => item.rewardCosmeticId as string)
]);

const initialCollections: Partial<Record<keyof AppStateData, unknown[]>> = {
  profiles: INITIAL_PROFILES,
  admins: INITIAL_ADMINS,
  characters: INITIAL_CHARACTERS,
  events: INITIAL_EVENTS,
  awards: INITIAL_AWARDS,
  cases: INITIAL_CASES,
  caseItems: INITIAL_CASE_ITEMS,
  weeklyShopItems: INITIAL_WEEKLY_SHOP_ITEMS,
  auctionListings: INITIAL_AUCTION_LISTINGS,
  achievements: INITIAL_ACHIEVEMENTS,
  factions: INITIAL_FACTIONS,
  artworks: INITIAL_ARTWORKS,
  activityLogs: [],
  notifications: INITIAL_NOTIFICATIONS,
  botVersions: INITIAL_BOT_VERSIONS,
  preReleasePosts: []
};

function isEventCompatible(event: RPEvent): boolean {
  return Boolean(
    event &&
    typeof event.id === 'string' && event.id.trim() &&
    ['event', 'collab', 'planned_rp'].includes(event.type) &&
    typeof event.title === 'string' && event.title.trim() &&
    typeof event.description === 'string' &&
    typeof event.location === 'string' &&
    typeof event.faction === 'string' &&
    typeof event.hasGM === 'boolean' &&
    typeof event.bannerUrl === 'string' &&
    typeof event.startTime === 'string' && Number.isFinite(Date.parse(event.startTime)) &&
    Array.isArray(event.participants) &&
    typeof event.isPaused === 'boolean' &&
    typeof event.isCompleted === 'boolean' &&
    Number.isFinite(event.rewardEquivaxes) && event.rewardEquivaxes >= 0
  );
}

function refundDeprecatedBackgrounds(
  profile: UserProfile,
  now: string,
  supportedThemes: Set<string>,
  currentTextBackgrounds: Set<string>
): number {
  const inventory = Array.isArray(profile.inventory) ? profile.inventory : [];
  const obsoleteItems = inventory.filter(item => {
    if (!item.appliedValue) return false;
    if (item.type === 'profile_text_bg') return !currentTextBackgrounds.has(item.appliedValue);
    if (item.type === 'profile_theme') return !supportedThemes.has(item.appliedValue);
    return false;
  });

  const saleEntries: Array<{ key: string; title: string }> = [];
  const alreadyCovered = new Set<string>();
  for (const item of obsoleteItems) {
    const key = `${item.type}:${item.appliedValue}`;
    if (alreadyCovered.has(key)) continue;
    alreadyCovered.add(key);
    saleEntries.push({ key, title: item.name || 'Устаревший фон профиля' });
  }

  for (const value of profile.unlockedTextBgs || []) {
    const key = `profile_text_bg:${value}`;
    if (!currentTextBackgrounds.has(value) && !alreadyCovered.has(key)) {
      saleEntries.push({ key, title: 'Устаревший разблокированный фон профиля' });
      alreadyCovered.add(key);
    }
  }
  for (const value of profile.unlockedThemes || []) {
    const key = `profile_theme:${value}`;
    if (!supportedThemes.has(value) && !alreadyCovered.has(key)) {
      saleEntries.push({ key, title: 'Устаревшая разблокированная тема профиля' });
      alreadyCovered.add(key);
    }
  }

  if (profile.activeTextBg && !currentTextBackgrounds.has(profile.activeTextBg)) {
    const key = `profile_text_bg:${profile.activeTextBg}`;
    if (!alreadyCovered.has(key)) saleEntries.push({ key, title: 'Устаревший фон карточки профиля' });
  }
  if (profile.activeThemeId && !supportedThemes.has(profile.activeThemeId)) {
    const key = `profile_theme:${profile.activeThemeId}`;
    if (!alreadyCovered.has(key)) saleEntries.push({ key, title: 'Устаревшая тема профиля' });
  }

  if (saleEntries.length === 0) return 0;

  const soldKeys = new Set(saleEntries.map(entry => entry.key));
  profile.inventory = inventory.filter(item => !(
    item.appliedValue && soldKeys.has(`${item.type}:${item.appliedValue}`) &&
    (item.type === 'profile_text_bg' || item.type === 'profile_theme')
  ));
  profile.unlockedTextBgs = (profile.unlockedTextBgs || []).filter(value => currentTextBackgrounds.has(value));
  profile.unlockedThemes = (profile.unlockedThemes || []).filter(value => supportedThemes.has(value));
  if (profile.activeTextBg && !currentTextBackgrounds.has(profile.activeTextBg)) profile.activeTextBg = undefined;
  if (profile.activeThemeId && !supportedThemes.has(profile.activeThemeId)) profile.activeThemeId = 'default';

  const isInfinite = profile.isInfiniteEquivaxes || profile.username.toLowerCase() === '@mrwhitepio';
  if (!isInfinite) {
    const startingBalance = profile.equivaxes || 0;
    profile.transactions = [...saleEntries.map((entry, index) => ({
      id: `migration_bg_v1_${profile.id}_${index}`,
      userId: profile.id,
      amount: DEPRECATED_BACKGROUND_REFUND,
      type: 'income_admin' as const,
      title: 'Возврат за устаревшую косметику',
      description: `${entry.title}: автоматическая продажа при обновлении каталога`,
      timestamp: now,
      balanceAfter: startingBalance + DEPRECATED_BACKGROUND_REFUND * (index + 1)
    })), ...(profile.transactions || [])].slice(0, 100);
    profile.equivaxes = startingBalance + DEPRECATED_BACKGROUND_REFUND * saleEntries.length;
  }

  return saleEntries.length;
}

export function migrateAppState(input: AppStateData, now = new Date().toISOString()) {
  const data = structuredClone(input);
  for (const [key, fallback] of Object.entries(initialCollections) as Array<[keyof AppStateData, unknown[]]>) {
    if (!Array.isArray(data[key])) (data as any)[key] = structuredClone(fallback);
  }
  const fromVersion = Number.isInteger(data.schemaVersion) ? data.schemaVersion as number : 0;
  let refundedBackgrounds = 0;
  let removedEvents = 0;

  if (fromVersion < 1) {
    const supportedThemes = new Set(supportedThemeIds);
    const currentTextBackgrounds = new Set(supportedTextBackgrounds);
    for (const item of [...(data.caseItems || []), ...(data.weeklyShopItems || [])]) {
      if (item.type === 'profile_theme' && item.appliedValue) supportedThemes.add(item.appliedValue);
      if (item.type === 'profile_text_bg' && item.appliedValue) currentTextBackgrounds.add(item.appliedValue);
    }
    for (const achievement of data.achievements || []) {
      if ((achievement.rewardType === 'profile_bg' || achievement.rewardType === 'both') && achievement.rewardCosmeticId) {
        currentTextBackgrounds.add(achievement.rewardCosmeticId);
      }
    }
    for (const profile of data.profiles || []) {
      refundedBackgrounds += refundDeprecatedBackgrounds(profile, now, supportedThemes, currentTextBackgrounds);
    }
    const compatibleEvents = (data.events || []).filter(isEventCompatible);
    removedEvents = (data.events || []).length - compatibleEvents.length;
    data.events = compatibleEvents;
    data.schemaVersion = 1;
  }

  return { data, fromVersion, refundedBackgrounds, removedEvents };
}