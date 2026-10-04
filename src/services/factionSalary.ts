import { UserProfile, Faction, Transaction } from '../types';

export interface FactionSalaryGrantResult {
  updatedProfiles: UserProfile[];
  grantsForCurrentUser?: {
    days: number;
    amount: number;
    factionName: string;
  } | null;
}

/**
 * Checks all profiles and distributes daily salary (+10 ℰQ/day) to members of factions.
 * Accounts for all elapsed days even if player was offline for multiple days.
 */
export function processDailyFactionSalaries(
  profiles: UserProfile[],
  factions: Faction[],
  currentUserId?: string
): FactionSalaryGrantResult {
  if (!profiles || !factions || factions.length === 0) {
    return { updatedProfiles: profiles, grantsForCurrentUser: null };
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const factionsMap = new Map<string, Faction>(factions.map(f => [f.id, f]));

  let hasChanges = false;
  let currentGrant: { days: number; amount: number; factionName: string } | null = null;

  const updatedProfiles = profiles.map(profile => {
    if (!profile.factionId) return profile;

    const faction = factionsMap.get(profile.factionId);
    if (!faction) return profile;

    const dailySalary = faction.dailySalary || 10;

    // Check last salary date
    const lastDateStr = profile.lastFactionSalaryDate || profile.factionJoinedAt?.slice(0, 10);

    if (!lastDateStr) {
      // First time setting salary date to today, grant 1 day of salary
      hasChanges = true;
      const amount = dailySalary;
      const tx: Transaction = {
        id: 'tx_fac_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        userId: profile.id,
        amount,
        type: 'income_admin',
        title: 'Жалование фракции',
        description: `Ежедневное довольствие во фракции «${faction.name}» (+${amount} ℰQ)`,
        timestamp: now.toISOString(),
        balanceAfter: (profile.equivaxes || 0) + amount
      };

      if (profile.id === currentUserId) {
        currentGrant = { days: 1, amount, factionName: faction.name };
      }

      return {
        ...profile,
        equivaxes: (profile.equivaxes || 0) + amount,
        lastFactionSalaryDate: todayStr,
        transactions: [tx, ...(profile.transactions || [])]
      };
    }

    if (lastDateStr === todayStr) {
      // Already collected today
      return profile;
    }

    // Calculate elapsed full days
    const lastDate = new Date(lastDateStr + 'T00:00:00Z');
    const todayDate = new Date(todayStr + 'T00:00:00Z');
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysPassed <= 0) return profile;

    // Grant salary for all missed days (even if offline for a week!)
    hasChanges = true;
    const amount = daysPassed * dailySalary;
    const tx: Transaction = {
      id: 'tx_fac_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId: profile.id,
      amount,
      type: 'income_admin',
      title: 'Жалование фракции',
      description: `Ежедневное довольствие во фракции «${faction.name}» за ${daysPassed} дн. (+${amount} ℰQ)`,
      timestamp: now.toISOString(),
      balanceAfter: (profile.equivaxes || 0) + amount
    };

    if (profile.id === currentUserId) {
      currentGrant = { days: daysPassed, amount, factionName: faction.name };
    }

    return {
      ...profile,
      equivaxes: (profile.equivaxes || 0) + amount,
      lastFactionSalaryDate: todayStr,
      transactions: [tx, ...(profile.transactions || [])]
    };
  });

  return {
    updatedProfiles: hasChanges ? updatedProfiles : profiles,
    grantsForCurrentUser: currentGrant
  };
}
