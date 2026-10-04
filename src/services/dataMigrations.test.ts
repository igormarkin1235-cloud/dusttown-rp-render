import assert from 'node:assert/strict';
import test from 'node:test';
import { AppStateData } from '../types';
import { DEPRECATED_BACKGROUND_REFUND, migrateAppState } from './dataMigrations';
import { INITIAL_CASE_ITEMS } from './storage';

test('migration sells unsupported profile backgrounds once and preserves current backgrounds', () => {
  const supportedBackground = INITIAL_CASE_ITEMS.find(item => item.type === 'profile_text_bg')!.appliedValue!;
  const state = {
    profiles: [{
      id: 'player-1', username: '@player1', displayName: 'Player One', avatarUrl: '',
      equivaxes: 200, joinedAt: '2025-01-01T00:00:00Z', eventsAttended: 0, plannedRpsAttended: 0,
      activeTextBg: 'old-background', activeThemeId: 'removed_theme',
      unlockedTextBgs: ['old-background', supportedBackground],
      inventory: [
        { id: 'old-bg', itemId: 'old-bg', name: 'Старый фон', photoUrl: '', bgStyle: '', textStyle: '', rarity: 'rare' as const, type: 'profile_text_bg' as const, appliedValue: 'old-background', acquiredAt: '2025-01-01T00:00:00Z' },
        { id: 'old-bg-copy', itemId: 'old-bg', name: 'Старый фон', photoUrl: '', bgStyle: '', textStyle: '', rarity: 'rare' as const, type: 'profile_text_bg' as const, appliedValue: 'old-background', acquiredAt: '2025-02-01T00:00:00Z' },
        { id: 'old-theme', itemId: 'old-theme', name: 'Старая тема', photoUrl: '', bgStyle: '', textStyle: '', rarity: 'rare' as const, type: 'profile_theme' as const, appliedValue: 'removed_theme', acquiredAt: '2025-01-01T00:00:00Z' },
        { id: 'current-bg', itemId: 'current-bg', name: 'Актуальный фон', photoUrl: '', bgStyle: '', textStyle: '', rarity: 'rare' as const, type: 'profile_text_bg' as const, appliedValue: supportedBackground, acquiredAt: '2025-01-01T00:00:00Z' }
      ]
    }],
    events: [], admins: [], characters: [], awards: [], cases: [], caseItems: [], weeklyShopItems: [], auctionListings: []
  } as unknown as AppStateData;

  const firstRun = migrateAppState(state, '2026-09-30T00:00:00.000Z');
  const migratedProfile = firstRun.data.profiles[0];
  assert.equal(firstRun.refundedBackgrounds, 2);
  assert.equal(migratedProfile.equivaxes, 200 + DEPRECATED_BACKGROUND_REFUND * 2);
  assert.equal(migratedProfile.activeTextBg, undefined);
  assert.equal(migratedProfile.activeThemeId, 'default');
  assert.deepEqual(migratedProfile.inventory.map(item => item.id), ['current-bg']);
  assert.deepEqual(migratedProfile.unlockedTextBgs, [supportedBackground]);
  assert.deepEqual(migratedProfile.transactions?.slice(0, 2).map(transaction => transaction.balanceAfter), [350, 500]);

  const secondRun = migrateAppState(firstRun.data, '2026-09-30T00:00:01.000Z');
  assert.equal(secondRun.refundedBackgrounds, 0);
  assert.equal(secondRun.data.profiles[0].equivaxes, migratedProfile.equivaxes);
});

test('migration removes events that do not meet the active event contract', () => {
  const state = {
    profiles: [], admins: [], characters: [], awards: [], cases: [], caseItems: [], weeklyShopItems: [], auctionListings: [],
    events: [
      {
        id: 'valid', type: 'event', title: 'Valid event', description: '', location: '', faction: '', hasGM: false,
        bannerUrl: '', startTime: '2026-10-01T00:00:00.000Z', participants: [], rewardEquivaxes: 10,
        isPaused: false, isCompleted: false
      },
      { id: 'invalid', type: 'unsupported', title: 'Old mechanic', startTime: 'not-a-date', participants: null, rewardEquivaxes: -1 }
    ]
  } as unknown as AppStateData;

  const result = migrateAppState(state);
  assert.equal(result.removedEvents, 1);
  assert.deepEqual(result.data.events.map(event => event.id), ['valid']);
});

test('legacy imports fill missing collections without restoring intentionally empty lists', () => {
  const state = {
    profiles: [{
      id: 'player-1', username: '@player1', displayName: 'Player One', avatarUrl: '',
      equivaxes: 200, joinedAt: '2025-01-01T00:00:00Z', eventsAttended: 0, plannedRpsAttended: 0,
      inventory: []
    }],
    events: []
  } as unknown as AppStateData;

  const result = migrateAppState(state);
  assert.equal(result.data.profiles.length, 1);
  assert.deepEqual(result.data.events, []);
  assert.ok(result.data.caseItems.length > 0);
  assert.ok((result.data.achievements || []).length > 0);
  assert.deepEqual(result.data.preReleasePosts, []);
});