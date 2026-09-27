import React, { useState, useMemo } from 'react';
import {
  Achievement,
  AchievementType,
  UserProfile,
  RPEvent,
  CharacterSheet,
  Award
} from '../types';
import {
  Trophy,
  X,
  CheckCircle2,
  Sparkles,
  Coins,
  Gift,
  Filter,
  Check,
  Flame,
  Clock,
  Layers,
  Award as AwardIcon
} from 'lucide-react';

interface AchievementsListProps {
  achievements: Achievement[];
  currentUser: UserProfile;
  events: RPEvent[];
  characters: CharacterSheet[];
  awards: Award[];
  onClaimReward: (achievement: Achievement) => void;
}

export const AchievementsList: React.FC<AchievementsListProps> = ({
  achievements = [],
  currentUser,
  events,
  characters,
  awards,
  onClaimReward
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute player's progress for a given achievement
  const getProgress = (ach: Achievement): { current: number; target: number; completed: boolean } => {
    let current = 0;
    const target = ach.targetValue || 1;

    switch (ach.type) {
      case 'events_count':
        current = currentUser.eventsAttended || 0;
        break;
      case 'rp_count':
        current = currentUser.plannedRpsAttended || 0;
        break;
      case 'any_event_count':
        current = (currentUser.eventsAttended || 0) + (currentUser.plannedRpsAttended || 0);
        break;
      case 'time_in_bot_days': {
        const joinDate = currentUser.joinedAt ? new Date(currentUser.joinedAt).getTime() : Date.now();
        const days = Math.max(1, Math.floor((Date.now() - joinDate) / (1000 * 60 * 60 * 24)));
        current = days;
        break;
      }
      case 'rare_cases_count':
        current = (currentUser.inventory || []).filter(
          i => i.rarity === 'rare' || i.rarity === 'epic' || i.rarity === 'legendary'
        ).length;
        break;
      case 'cases_opened_count':
        current = (currentUser.transactions || []).filter(t => t.type === 'expense_case').length;
        break;
      case 'characters_count':
        current = characters.filter(
          c => c.creatorTelegram.toLowerCase() === currentUser.username.toLowerCase()
        ).length;
        break;
      case 'equivaxes_balance':
        current = currentUser.isInfiniteEquivaxes ? target : (currentUser.equivaxes || 0);
        break;
      case 'auction_deals':
        current = (currentUser.transactions || []).filter(
          t => t.type === 'expense_auction' || t.type === 'income_auction'
        ).length;
        break;
      case 'lottery_tickets':
        current = (currentUser.transactions || []).filter(t => t.type === 'income_lottery').length;
        break;
      case 'awards_count':
        current = awards.filter(
          a => a.recipientUsername.toLowerCase() === currentUser.username.toLowerCase()
        ).length;
        break;
      default:
        current = 0;
    }

    return {
      current,
      target,
      completed: current >= target
    };
  };

  const getConditionDescription = (type: AchievementType, target: number) => {
    switch (type) {
      case 'events_count':
        return `Поучаствовать в ${target} ивентах или вылазках`;
      case 'rp_count':
        return `Поучаствовать в ${target} запланированных РП-сессиях`;
      case 'any_event_count':
        return `Поучаствовать в ${target} событиях или РП Даст Таун`;
      case 'time_in_bot_days':
        return `Провести в сообществе от ${target} дней`;
      case 'rare_cases_count':
        return `Получить ${target} редких/эпических наград из кейсов`;
      case 'cases_opened_count':
        return `Открыть ${target} кейсов с лутом`;
      case 'characters_count':
        return `Создать ${target} анкет персонажей в гильдии`;
      case 'equivaxes_balance':
        return `Накопить баланс от ${target.toLocaleString()} ℰQ`;
      case 'auction_deals':
        return `Совершить ${target} сделок на аукционе Даст Таун`;
      case 'lottery_tickets':
        return `Стереть ${target} билетов лотереи Пустошей`;
      case 'awards_count':
        return `Заслужить ${target} орденов или медалей от администрации`;
      default:
        return `Выполнить условие (${target})`;
    }
  };

  const handleClaim = (ach: Achievement) => {
    onClaimReward(ach);
    const rewardName = ach.rewardAmount
      ? `+${ach.rewardAmount} ℰQ`
      : ach.rewardCosmeticName || 'награда';
    setToastMessage(`🎉 Награда за «${ach.title}» (${rewardName}) получена!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Overall metrics
  const stats = useMemo(() => {
    let completedCount = 0;
    let claimedCount = 0;

    for (const ach of achievements) {
      const prog = getProgress(ach);
      if (prog.completed) {
        completedCount++;
        if (currentUser.claimedAchievementIds?.includes(ach.id)) {
          claimedCount++;
        }
      }
    }

    return {
      total: achievements.length,
      completed: completedCount,
      claimed: claimedCount,
      percent: achievements.length ? Math.round((completedCount / achievements.length) * 100) : 0
    };
  }, [achievements, currentUser, events, characters, awards]);

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter(ach => {
      const { completed } = getProgress(ach);
      if (filter === 'completed') return completed;
      if (filter === 'in_progress') return !completed;
      return true;
    });
  }, [achievements, filter, currentUser, events, characters, awards]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/95 border border-emerald-500 text-emerald-200 text-xs font-mono-pip flex items-center justify-between shadow-2xl animate-bounce">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Metric Card */}
      <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading uppercase tracking-wide text-amber-400 flex items-center gap-2">
                <span>Достижения Пустошей Даст Таун</span>
                <span className="text-[10px] font-mono-pip px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  {stats.completed} из {stats.total} выполнено ({stats.percent}%)
                </span>
              </h3>
              <p className="text-xs font-mono-pip text-zinc-400 mt-0.5">
                Выполняйте испытания, открывайте кейсы, участвуйте в РП-сессиях и забирайте эксклюзивные награды!
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-mono-pip">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === 'all'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Все ({achievements.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                filter === 'completed'
                  ? 'bg-emerald-500 text-black font-bold shadow'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Выполненные ({stats.completed})</span>
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                filter === 'in_progress'
                  ? 'bg-rose-500 text-black font-bold shadow'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              <span>В процессе ({stats.total - stats.completed})</span>
            </button>
          </div>
        </div>

        {/* Total Progress Bar */}
        <div className="pt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono-pip">
            <span className="text-zinc-400">Общий прогресс сталкера:</span>
            <span className="text-amber-300 font-bold">{stats.completed} / {stats.total} ({stats.percent}%)</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.map(ach => {
          const { current, target, completed } = getProgress(ach);
          const isClaimed = Boolean(currentUser.claimedAchievementIds?.includes(ach.id));
          const progressPercent = Math.min(100, Math.round((current / target) * 100));

          return (
            <div
              key={ach.id}
              className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden ${
                completed
                  ? 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/20 border-emerald-500/60 shadow-emerald-950/20'
                  : 'bg-zinc-950/90 border-zinc-800 hover:border-zinc-700 opacity-90'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Achievement Icon */}
                <div className="relative shrink-0">
                  <div
                    className={`w-16 h-16 rounded-2xl border p-2 flex items-center justify-center transition-all ${
                      completed
                        ? 'bg-zinc-900 border-emerald-400/80 shadow-lg shadow-emerald-500/20'
                        : 'bg-zinc-950 border-rose-500/40'
                    }`}
                  >
                    <img
                      src={ach.iconUrl}
                      alt={ach.title}
                      className={`w-full h-full object-contain drop-shadow transition-all ${
                        completed ? 'filter-none scale-105' : 'grayscale opacity-30 contrast-75'
                      }`}
                    />
                  </div>

                  {/* NOT COMPLETED: BIG PROMINENT RED CROSS ON THE ICON */}
                  {!completed && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl border border-rose-500/60 shadow-lg shadow-rose-950/80"
                      title="Достижение ещё не выполнено"
                    >
                      <X className="w-9 h-9 text-rose-500 stroke-[3.5] drop-shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse" />
                    </div>
                  )}

                  {/* COMPLETED: GREEN CHECKMARK BADGE */}
                  {completed && (
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg border-2 border-zinc-900">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Achievement Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-base font-bold font-heading truncate ${
                        completed ? 'text-zinc-100' : 'text-zinc-300'
                      }`}
                    >
                      {ach.title}
                    </h4>

                    {completed ? (
                      <span className="text-[10px] font-mono-pip font-extrabold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 shrink-0">
                        Выполнено!
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono-pip font-extrabold px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/60 text-rose-400 shrink-0 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        <span>Не выполнено</span>
                      </span>
                    )}
                  </div>

                  {ach.description && (
                    <p className="text-xs font-mono-pip text-zinc-400 line-clamp-2">
                      {ach.description}
                    </p>
                  )}

                  {/* PROMINENT CONDITION BANNER (условие) */}
                  <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono-pip mt-2 space-y-1">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>
                        <strong className="text-amber-400">Условие:</strong>{' '}
                        {getConditionDescription(ach.type, target)}
                      </span>
                    </div>

                    {/* Progress Bar & Value */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-zinc-400">
                        Прогресс:{' '}
                        <strong
                          className={completed ? 'text-emerald-400' : 'text-amber-300'}
                        >
                          {current.toLocaleString()} / {target.toLocaleString()}
                        </strong>
                      </span>
                      <span className="text-zinc-400 font-bold">{progressPercent}%</span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          completed
                            ? 'bg-emerald-400'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Rewards & Claim Action */}
              <div className="border-t border-zinc-900 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Reward preview tag */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono-pip">
                  <span className="text-zinc-500">Награда:</span>
                  {ach.rewardAmount && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      <span>+{ach.rewardAmount} ℰQ</span>
                    </span>
                  )}
                  {ach.rewardCosmeticName && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{ach.rewardCosmeticName}</span>
                    </span>
                  )}
                </div>

                {/* Claim or Status Button */}
                <div>
                  {completed ? (
                    isClaimed ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-mono-pip font-bold flex items-center gap-1.5 border border-zinc-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Награда получена</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaim(ach)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-heading font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-1.5 active:scale-95 animate-pulse"
                      >
                        <Gift className="w-4 h-4" />
                        <span>Забрать награду!</span>
                      </button>
                    )
                  ) : (
                    <div className="text-[11px] font-mono-pip text-zinc-500 italic">
                      Заблокировано (не выполнено)
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
