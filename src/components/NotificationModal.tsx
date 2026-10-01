import React, { useState } from 'react';
import { AppNotification, NotificationType, BotVersionRecord, TabType } from '../types';
import {
  Bell,
  X,
  CheckCheck,
  ExternalLink,
  Sparkles,
  Palette,
  Hammer,
  Calendar,
  Shield,
  Package,
  Crown,
  UserCheck,
  Layers,
  FileCode2,
  GitCommit,
  Clock,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Award
} from 'lucide-react';

interface NotificationModalProps {
  notifications: AppNotification[];
  botVersions: BotVersionRecord[];
  onClose: () => void;
  onNotificationClick: (notif: AppNotification) => void;
  onMarkAllAsRead: () => void;
  onNavigateToTab: (tab: TabType) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications,
  botVersions,
  onClose,
  onNotificationClick,
  onMarkAllAsRead,
  onNavigateToTab
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'bot_files'>('feed');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedVersion, setSelectedVersion] = useState<BotVersionRecord | null>(botVersions[0] || null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'art') return n.type === 'new_art';
    if (filterType === 'bot') return n.type === 'bot_update';
    if (filterType === 'market') return n.type === 'auction' || n.type === 'case';
    if (filterType === 'events') return n.type === 'event';
    if (filterType === 'community') return n.type === 'new_user' || n.type === 'new_vip' || n.type === 'new_admin' || n.type === 'faction' || n.type === 'achievement';
    return true;
  });

  const getCategoryIcon = (type: NotificationType) => {
    switch (type) {
      case 'new_art':
        return <Palette className="w-4 h-4 text-violet-400" />;
      case 'bot_update':
        return <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />;
      case 'auction':
        return <Hammer className="w-4 h-4 text-amber-400" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-pink-400" />;
      case 'faction':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'case':
        return <Package className="w-4 h-4 text-cyan-400" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-amber-300" />;
      case 'new_vip':
        return <Crown className="w-4 h-4 text-amber-300" />;
      case 'new_admin':
        return <Shield className="w-4 h-4 text-rose-400" />;
      case 'new_user':
      default:
        return <UserCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'только что';
    if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    return `${diffDays} дн. назад`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Bell className="w-5 h-5 animate-wiggle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-heading uppercase text-white tracking-wider">
                  Центр Уведомлений
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono-pip font-bold animate-pulse">
                    {unreadCount} новых
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Кликабельные переходы к событиям, артам, аукциону и обновлениям
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono-pip transition"
                title="Отметить все как прочитанные"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Прочитать все</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher: Feed vs Bot Files Tracker */}
        <div className="px-4 sm:px-5 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition flex items-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Лента Уведомлений</span>
            </button>

            <button
              onClick={() => setActiveTab('bot_files')}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition flex items-center gap-1.5 ${
                activeTab === 'bot_files'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Файлы & Версии Бота</span>
              <span className="text-[9px] font-mono-pip bg-black/40 px-1.5 py-0.2 rounded-full border border-white/20 text-amber-300">
                v3.0
              </span>
            </button>
          </div>

          {activeTab === 'feed' && unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="sm:hidden text-[10px] text-emerald-400 font-mono-pip hover:underline"
            >
              Прочитать все
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: NOTIFICATIONS FEED                                */}
        {/* ======================================================== */}
        {activeTab === 'feed' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Category filter pills */}
            <div className="px-4 sm:px-5 py-2.5 flex items-center gap-1.5 overflow-x-auto border-b border-zinc-800/60 bg-zinc-900/30 scrollbar-none">
              {[
                { id: 'all', label: 'Все' },
                { id: 'art', label: '🎨 Арты' },
                { id: 'bot', label: '⚡ Бот' },
                { id: 'market', label: '🔨 Рынок & Кейсы' },
                { id: 'events', label: '☢️ Ивенты' },
                { id: 'community', label: '👥 Сообщество' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono-pip whitespace-nowrap transition ${
                    filterType === f.id
                      ? 'bg-zinc-800 text-white border border-zinc-600 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 max-h-[58vh]">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Bell className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-heading text-zinc-400">Уведомлений в этой категории нет</p>
                  <p className="text-xs text-zinc-500">
                    Следите за обновлениями, новыми артами и аукционами!
                  </p>
                </div>
              ) : (
                filteredNotifications.map(notif => {
                  return (
                    <div
                      key={notif.id}
                      onClick={() => onNotificationClick(notif)}
                      className={`group p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 ${
                        notif.isRead
                          ? 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                          : 'bg-zinc-900 border-amber-500/40 hover:border-amber-400 shadow-md ring-1 ring-amber-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Icon circle */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            notif.isRead
                              ? 'bg-zinc-800/70 border-zinc-700'
                              : 'bg-amber-500/10 border-amber-500/40'
                          }`}
                        >
                          {getCategoryIcon(notif.type)}
                        </div>

                        {/* Text info */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-xs sm:text-sm font-bold font-heading group-hover:text-amber-300 transition ${
                                notif.isRead ? 'text-zinc-200' : 'text-white'
                              }`}
                            >
                              {notif.title}
                            </h4>
                            {notif.badge && (
                              <span className="text-[9px] font-mono-pip font-extrabold uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {notif.badge}
                              </span>
                            )}
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-zinc-400 leading-snug line-clamp-2">
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono-pip pt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{getTimeAgo(notif.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right-hand clickable action CTA */}
                      <div className="shrink-0 flex items-center gap-1 text-xs text-amber-400 group-hover:translate-x-1 transition font-heading font-bold self-center">
                        <span className="hidden sm:inline text-[11px]">
                          {notif.actionLabel || 'Перейти'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: BOT CHANGELOG & FILE TRACKER                      */}
        {/* (Отслеживание старых и новых файлов кода бота)           */}
        {/* ======================================================== */}
        {activeTab === 'bot_files' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 max-h-[68vh]">
            {/* System Status Tracker Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/80 via-zinc-900 to-zinc-950 border border-violet-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono-pip font-black uppercase text-amber-300">
                    Система мониторинга исходных файлов
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono-pip border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Активно • v3.0.0
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Бот автоматически фиксирует хронологию версий, добавленные и измененные файлы компонентов, а также ключевые механики сообщества.
              </p>
            </div>

            {/* Version list selector */}
            <div className="space-y-3">
              <span className="text-xs font-heading font-bold text-zinc-400 uppercase tracking-wider block">
                История Версий и Модификаций Файлов:
              </span>

              <div className="space-y-4">
                {botVersions.map(ver => {
                  const isCurrent = ver.version === 'v3.0.0';

                  return (
                    <div
                      key={ver.version}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-zinc-900/90 border-amber-500/60 shadow-lg'
                          : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black font-mono-pip font-black text-xs">
                              {ver.version}
                            </span>
                            <span className="text-xs text-zinc-400 font-mono-pip">
                              {ver.releaseDate}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono-pip">
                                ТЕКУЩАЯ ВЕРСИЯ
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm sm:text-base font-bold font-heading text-white mt-1">
                            {ver.title}
                          </h4>
                        </div>

                        {ver.targetTab && (
                          <button
                            onClick={() => {
                              onClose();
                              onNavigateToTab(ver.targetTab!);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-heading font-bold transition flex items-center gap-1.5 shrink-0"
                          >
                            <span>{ver.targetActionLabel || 'Открыть'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                        {ver.description}
                      </p>

                      {/* Highlights */}
                      <div className="mb-3 space-y-1 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80">
                        <span className="text-[10px] font-heading font-black text-amber-300 uppercase tracking-wider block">
                          Ключевые изменения:
                        </span>
                        <ul className="text-xs text-zinc-300 space-y-0.5">
                          {ver.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-400">•</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Changed files list */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono-pip text-zinc-400 uppercase tracking-wider block">
                          Затронутые файлы проекта ({ver.changedFiles.length}):
                        </span>
                        <div className="space-y-1">
                          {ver.changedFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono-pip"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileCode2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="text-zinc-200 font-bold truncate">
                                  {file.fileName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${
                                    file.changeType === 'created'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                      : file.changeType === 'refactored'
                                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                                  }`}
                                >
                                  {file.changeType === 'created'
                                    ? 'СОЗДАН'
                                    : file.changeType === 'refactored'
                                    ? 'ПЕРЕРАБОТАН'
                                    : 'ОБНОВЛЁН'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
