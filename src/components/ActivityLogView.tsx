import React, { useState, useEffect } from 'react';
import { ActivityLogEntry, ActivityLogCategory, TabType, UserProfile } from '../types';
import { AvatarWithFrame } from './AvatarWithFrame';
import {
  Activity,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  Calendar,
  Coins,
  Palette,
  User,
  ShoppingBag,
  ExternalLink,
  Flame,
  CheckCircle2,
  Clock,
  Radio,
  Layers
} from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLogEntry[];
  currentUser: UserProfile;
  onRefreshLogs?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  logs = [],
  currentUser,
  onRefreshLogs,
  onNavigateTab
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toLocaleTimeString());

  // Auto-refresh interval every 5 seconds if enabled
  useEffect(() => {
    if (!isAutoRefresh || !onRefreshLogs) return;
    const interval = setInterval(() => {
      onRefreshLogs();
      setLastUpdatedTime(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, onRefreshLogs]);

  const handleManualRefresh = () => {
    if (onRefreshLogs) onRefreshLogs();
    setLastUpdatedTime(new Date().toLocaleTimeString());
  };

  // Filter logs by category and search
  const filteredLogs = logs.filter(log => {
    // Category match
    if (activeCategory === 'events') {
      if (!['event_join', 'event_leave', 'event_create', 'event_complete'].includes(log.category)) {
        return false;
      }
    } else if (activeCategory === 'market') {
      if (!['shop_purchase', 'case_open', 'auction_bid', 'financial_tx'].includes(log.category)) {
        return false;
      }
    } else if (activeCategory === 'art') {
      if (!['art_publish', 'art_tip'].includes(log.category)) {
        return false;
      }
    } else if (activeCategory === 'profile') {
      if (!['profile_update', 'faction_action', 'award_grant'].includes(log.category)) {
        return false;
      }
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = log.title?.toLowerCase().includes(q);
      const matchDesc = log.description?.toLowerCase().includes(q);
      const matchUser = log.username?.toLowerCase().includes(q);
      const matchHandshake = log.handshakeId?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchUser && !matchHandshake) {
        return false;
      }
    }

    return true;
  });

  const getCategoryConfig = (category: ActivityLogCategory) => {
    switch (category) {
      case 'event_join':
      case 'event_leave':
      case 'event_create':
      case 'event_complete':
        return {
          label: 'ИВЕНТ / РП',
          badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
          icon: <Calendar className="w-3.5 h-3.5 text-emerald-400" />,
          targetTab: 'events' as TabType
        };
      case 'shop_purchase':
      case 'case_open':
      case 'auction_bid':
      case 'financial_tx':
        return {
          label: 'ТОРГОВЛЯ / ℰQ',
          badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
          icon: <Coins className="w-3.5 h-3.5 text-amber-400" />,
          targetTab: 'market' as TabType
        };
      case 'art_publish':
      case 'art_tip':
        return {
          label: 'АРТ-ГАЛЕРЕЯ',
          badgeClass: 'bg-violet-950/80 text-violet-300 border-violet-500/50',
          icon: <Palette className="w-3.5 h-3.5 text-violet-400" />,
          targetTab: 'gallery' as TabType
        };
      case 'profile_update':
      case 'faction_action':
      case 'award_grant':
      default:
        return {
          label: 'ПРОФИЛЬ / СТАЛКЕР',
          badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50',
          icon: <User className="w-3.5 h-3.5 text-cyan-400" />,
          targetTab: 'profile' as TabType
        };
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const time = new Date(isoString).getTime();
      const diff = Date.now() - time;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Только что';
      if (mins < 60) return `${mins} мин назад`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} ч назад`;
      return new Date(isoString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Недавно';
    }
  };

  // Metrics
  const totalVerifiedActions = logs.filter(l => l.serverVerified).length;
  const totalFinancialActions = logs.filter(l => l.category === 'shop_purchase' || l.category === 'case_open' || l.category === 'art_tip').length;
  const totalEventActions = logs.filter(l => l.category === 'event_join' || l.category === 'event_complete').length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner / Radar Terminal Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-5 sm:p-7 border border-emerald-500/40 shadow-2xl overflow-hidden">
        {/* Radar background glow & grid */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono-pip font-extrabold flex items-center gap-1.5 shadow-sm animate-pulse">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>REAL-TIME SERVER STREAM</span>
              </span>
              <span className="text-[10px] font-mono-pip text-zinc-500">
                Синхронизировано: {lastUpdatedTime}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-heading uppercase text-white flex items-center gap-2.5 tracking-wider">
              <Activity className="w-6 h-6 text-emerald-400" />
              <span>Журнал действий сервера</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Все действия на сервере (запись на ивенты, покупка экипировки, донаты художникам и обновления профиля) валидируются через серверное рукопожатие (Handshake Verification) с защитой от рассинхронизации.
            </p>
          </div>

          {/* Quick Refresh Actions */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-3 py-2 rounded-xl border text-xs font-mono-pip font-bold flex items-center gap-1.5 transition ${
                isAutoRefresh
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/40'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Автообновление ленты в реальном времени"
            >
              <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
              <span>Авто (5с)</span>
            </button>

            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-heading font-bold flex items-center gap-1.5 transition active:scale-95 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Обновить</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-zinc-800/80">
          <div className="p-3 rounded-2xl bg-black/50 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 font-mono-pip uppercase tracking-wider">
              Всего действий
            </div>
            <div className="text-lg sm:text-xl font-mono-pip font-black text-white mt-0.5">
              {logs.length}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/50 border border-zinc-800">
            <div className="text-[10px] text-emerald-400/90 font-mono-pip uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Подтверждено</span>
            </div>
            <div className="text-lg sm:text-xl font-mono-pip font-black text-emerald-300 mt-0.5">
              {totalVerifiedActions} (100%)
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/50 border border-zinc-800">
            <div className="text-[10px] text-amber-400/90 font-mono-pip uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>Финансы и Маркет</span>
            </div>
            <div className="text-lg sm:text-xl font-mono-pip font-black text-amber-300 mt-0.5">
              {totalFinancialActions}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/50 border border-zinc-800">
            <div className="text-[10px] text-cyan-400/90 font-mono-pip uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span>Ивенты и РП</span>
            </div>
            <div className="text-lg sm:text-xl font-mono-pip font-black text-cyan-300 mt-0.5">
              {totalEventActions}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Все действия ({logs.length})
          </button>
          <button
            onClick={() => setActiveCategory('events')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'events'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Ивенты и РП</span>
          </button>
          <button
            onClick={() => setActiveCategory('market')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'market'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Финансы и Маркет</span>
          </button>
          <button
            onClick={() => setActiveCategory('art')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'art'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-950/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Арт-Галерея</span>
          </button>
          <button
            onClick={() => setActiveCategory('profile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'profile'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Профили</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по сталкеру или действию..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Activity Stream Feed */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
          <Activity className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold font-heading text-zinc-300">
            Действий в выбранной категории не найдено
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Попробуйте сбросить фильтр или выполните действие на сервере (запись на ивент, покупка в магазине или публикация арта).
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono-pip text-zinc-300 transition"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => {
            const config = getCategoryConfig(log.category);
            const isMe = log.username.toLowerCase() === currentUser.username.toLowerCase();

            return (
              <div
                key={log.id}
                className="group relative rounded-2xl bg-zinc-950/90 border border-zinc-800/90 hover:border-zinc-700 p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
              >
                {/* Left: Icon, User Avatar & Action Body */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <AvatarWithFrame
                      avatarUrl={
                        log.userAvatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      size="md"
                    />
                    {isMe && (
                      <span className="absolute -top-1 -left-1 px-1 rounded-full bg-amber-500 text-black text-[8px] font-mono-pip font-extrabold uppercase shadow">
                        ВЫ
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[9px] font-mono-pip font-extrabold tracking-wider uppercase flex items-center gap-1 ${config.badgeClass}`}
                      >
                        {config.icon}
                        <span>{config.label}</span>
                      </span>

                      <span className="text-xs font-bold font-heading text-white truncate">
                        {log.displayName || log.username}
                      </span>
                      <span className="text-[11px] font-mono-pip text-zinc-500">
                        {log.username}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition">
                      {log.title}
                    </h4>

                    <p className="text-xs text-zinc-400 leading-snug">
                      {log.description}
                    </p>

                    {/* Metadata details row */}
                    <div className="flex items-center gap-3 pt-0.5 text-[10px] font-mono-pip text-zinc-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{formatRelativeTime(log.timestamp)}</span>
                      </span>

                      {log.serverVerified && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Handshake Verified</span>
                          {log.handshakeId && (
                            <span className="text-zinc-500 font-normal">[{log.handshakeId.slice(0, 10)}]</span>
                          )}
                        </span>
                      )}

                      {log.details?.amount !== undefined && (
                        <span
                          className={`font-bold ${
                            log.details.amount > 0 ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {log.details.amount > 0 ? `+${log.details.amount}` : log.details.amount} ℰQ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Jump Button */}
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(config.targetTab)}
                    className="shrink-0 self-end sm:self-center px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 hover:text-white text-xs font-mono-pip transition flex items-center gap-1.5 shadow-sm active:scale-95"
                    title={`Перейти в раздел: ${config.label}`}
                  >
                    <span>Перейти</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
