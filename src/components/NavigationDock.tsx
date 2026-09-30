import React, { useState } from 'react';
import { TabType } from '../types';
import {
  Calendar,
  Sparkles,
  User,
  Package,
  Shield,
  ShoppingBag,
  ChevronRight,
  Menu,
  Eye,
  Crown,
  Palette,
  Activity,
  MessageCircle,
  Volume2,
  VolumeX
} from 'lucide-react';

interface NavigationDockProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin: boolean;
  eventsCount?: number;
  plannedRpsCount?: number;
  factionsCount?: number;
  casesCount?: number;
  marketItemsCount?: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  activeTab,
  onTabChange,
  isAdmin,
  eventsCount = 0,
  plannedRpsCount = 0,
  factionsCount = 0,
  casesCount = 0,
  marketItemsCount = 0,
  soundEnabled,
  onToggleSound
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const tabs: Array<{
    id: TabType;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    adminOnly?: boolean;
  }> = [
    {
      id: 'events',
      label: 'Ивенты',
      icon: <Calendar className="w-4 h-4 text-amber-400" />,
      badge: eventsCount > 0 ? eventsCount : undefined
    },
    {
      id: 'planned_rp',
      label: 'РП-Сессии',
      icon: <Sparkles className="w-4 h-4 text-pink-400" />,
      badge: plannedRpsCount > 0 ? plannedRpsCount : undefined
    },
    {
      id: 'prerelease',
      label: 'Пред-релиз',
      icon: <Eye className="w-4 h-4 text-purple-400" />,
      badge: 'VIP'
    },
    {
      id: 'factions',
      label: 'Фракции',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      badge: factionsCount > 0 ? factionsCount : undefined
    },
    {
      id: 'market',
      label: 'Магазин',
      icon: <ShoppingBag className="w-4 h-4 text-amber-300" />,
      badge: marketItemsCount > 0 ? marketItemsCount : undefined
    },
    {
      id: 'characters',
      label: 'Анкеты',
      icon: <span className="text-sm">📜</span>
    },
    {
      id: 'gallery',
      label: 'Арт-Лента',
      icon: <Palette className="w-4 h-4 text-violet-400" />,
      badge: 'АРТ'
    },
    {
      id: 'cases',
      label: 'Кейсы',
      icon: <Package className="w-4 h-4 text-emerald-400" />,
      badge: casesCount > 0 ? casesCount : undefined
    },
    {
      id: 'activity',
      label: 'Журнал',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      badge: 'LIVE'
    },
    {
      id: 'chat',
      label: 'Чат',
      icon: <MessageCircle className="w-4 h-4 text-emerald-300" />
    },
    {
      id: 'profile',
      label: 'Профиль',
      icon: <User className="w-4 h-4 text-cyan-400" />
    },
    {
      id: 'admin',
      label: 'Админка',
      icon: <Shield className="w-4 h-4 text-red-400" />,
      adminOnly: true
    }
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin);

  return (
    /* Side / Corner Right-Hand HUD Dock («на угол правый, половина сверху половина сбоку») */
    <aside
      className={`fixed top-20 right-2 z-40 transition-all duration-300 ease-out flex items-center select-none ${
        isExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-14px)]'
      }`}
      aria-label="Боковая панель навигации Даст Таун Колектив"
    >
      {/* Retractable Toggle Handle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-6 h-14 rounded-l-xl bg-zinc-950/95 border-l border-y border-amber-500/50 hover:bg-zinc-900 flex flex-col items-center justify-center text-amber-400 shadow-2xl backdrop-blur-md transition-all active:scale-95 group"
        title={isExpanded ? 'Свернуть панель' : 'Развернуть панель'}
      >
        <ChevronRight
          className={`w-4 h-4 transition-transform duration-200 ${
            isExpanded ? '' : 'rotate-180 text-amber-300 animate-pulse'
          }`}
        />
      </button>

      {/* Main HUD Cluster Menu */}
      <div className="bg-zinc-950/95 border border-amber-500/40 rounded-2xl rounded-tr-none p-2 shadow-2xl backdrop-blur-xl flex flex-col gap-1.5 w-36 border-r-2 border-r-amber-500 ring-1 ring-black/80">
        <div className="px-2 py-1 border-b border-zinc-800/80 flex items-center justify-between">
          <span className="text-[9px] font-mono-pip font-extrabold uppercase text-amber-400 tracking-widest flex items-center gap-1">
            <Menu className="w-2.5 h-2.5" /> МЕНЮ
          </span>
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Выключить звуки кнопок' : 'Включить звуки кнопок'}
            aria-pressed={soundEnabled}
            title={soundEnabled ? 'Выключить звуки кнопок' : 'Включить звуки кнопок'}
            className="rounded p-1 text-zinc-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse" />
        </div>

        <nav className="flex flex-col gap-1">
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-black transition-all duration-200 text-left ${
                  isActive
                    ? tab.id === 'planned_rp'
                      ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-lg ring-1 ring-pink-400'
                      : tab.id === 'market'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg ring-1 ring-amber-300'
                      : tab.id === 'admin'
                      ? 'badge-admin-shimmer text-white shadow-lg ring-1 ring-red-400'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg ring-1 ring-amber-300'
                    : 'bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800/70 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={isActive ? 'scale-110 drop-shadow' : 'opacity-80'}>
                    {tab.icon}
                  </span>
                  <span className="truncate tracking-wide">{tab.label}</span>
                </div>

                {tab.badge !== undefined && (
                  <span
                    className={`text-[9px] font-mono-pip px-1.5 py-0.2 rounded-full font-black ${
                      isActive
                        ? 'bg-black/40 text-white'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
