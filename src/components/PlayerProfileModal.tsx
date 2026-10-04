import React, { useState } from 'react';
import { UserProfile, Award, CharacterSheet, AdminInfo } from '../types';
import { AvatarWithFrame } from './AvatarWithFrame';
import { PlayerCardFrame } from './PlayerCardFrame';
import { ProfileAnimatedTheme } from './ProfileAnimatedTheme';
import { ProfilePinnedArtsShowcase } from './ProfilePinnedArtsShowcase';
import {
  Award as AwardIcon,
  Sparkles,
  Shield,
  Coins,
  Calendar,
  X,
  ExternalLink,
  Crown,
  UserCheck,
  UserX,
  History,
  MessageCircle,
  Package,
  Settings,
  Info,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';

interface PlayerProfileModalProps {
  user: UserProfile | null;
  awards: Award[];
  characters: CharacterSheet[];
  currentUser: UserProfile;
  admins: AdminInfo[];
  isAdmin: boolean;
  onClose: () => void;
  onSelectCharacter?: (char: CharacterSheet) => void;
  onQuickGrantMoney?: (userId: string, amount: number) => void;
  onToggleAdmin?: (username: string, makeAdmin: boolean) => void;
  onIssueLotteryTicket?: (userId: string, ticketItem: any) => void;
  onStartChat?: (user: UserProfile) => void;
}

type ProfileModalTab = 'info' | 'characters' | 'awards' | 'inventory' | 'admin';

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  user,
  awards,
  characters,
  currentUser,
  admins,
  isAdmin,
  onClose,
  onSelectCharacter,
  onQuickGrantMoney,
  onToggleAdmin,
  onIssueLotteryTicket,
  onStartChat
}) => {
  const [activeTab, setActiveTab] = useState<ProfileModalTab>('info');

  if (!user) return null;

  const isOwner = user.username.toLowerCase() === '@mrwhitepio';
  const isTargetAdmin = !isOwner && admins.some(a => a.username.toLowerCase() === user.username.toLowerCase());
  const amIOwner = currentUser.username.toLowerCase() === '@mrwhitepio';

  const userAwards = awards.filter(a => a.recipientUsername.toLowerCase() === user.username.toLowerCase());
  const userCharacters = characters.filter(c => c.creatorTelegram.toLowerCase() === user.username.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Background backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl">
        <PlayerCardFrame
          frameId={user.activeCardFrame || user.activeAvatarFrame}
          isOwner={isOwner}
          isAdmin={isTargetAdmin}
          className="w-full shadow-2xl transition-all duration-300"
        >
          <div className={`relative w-full max-h-[92dvh] sm:max-h-[88vh] overflow-hidden rounded-t-3xl sm:rounded-3xl border shadow-2xl text-zinc-100 flex flex-col ${
            user.activeTextBg || 'bg-zinc-950 border-zinc-800'
          }`}>
            {/* Mobile Swipe Bar Handle */}
            <div
              className="sm:hidden pt-2.5 pb-1 flex justify-center cursor-pointer active:opacity-60"
              onClick={onClose}
            >
              <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 active:bg-amber-400 transition" />
            </div>

            {/* Sticky Close Button */}
            <button
              onClick={onClose}
              aria-label="Закрыть профиль"
              className="absolute top-3 right-3 z-30 w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition shadow-lg active:scale-95 touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Compact Top Profile Header with Applied Theme & Cosmetics */}
            <div className={`relative px-4 py-4 sm:px-6 sm:py-5 overflow-hidden shrink-0 ${user.activeTextBg || 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800'}`}>
              <ProfileAnimatedTheme
                themeId={user.activeThemeId || 'default'}
                customBgUrl={user.customBgUrl}
                customBgEffect={user.customBgEffect}
                customBgPosition={user.customBgPosition}
              />

              <div className="relative z-10 flex items-center gap-3.5 sm:gap-5 pr-8">
                {/* Avatar & Badges with full custom positioning & frame */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <AvatarWithFrame
                    avatarUrl={user.avatarUrl}
                    frameId={user.activeAvatarFrame}
                    size="lg"
                    fitMode={user.avatarFitMode || 'cover'}
                    zoom={user.avatarZoom || 1}
                    offsetY={user.avatarOffsetY || 0}
                    offsetX={user.avatarOffsetX || 0}
                  />
                  {isOwner && (
                    <div className="mt-1 badge-owner-shimmer text-black font-black text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-20">
                      <Crown className="w-2.5 h-2.5 text-black" />
                      <span>Создатель</span>
                    </div>
                  )}
                  {isTargetAdmin && (
                    <div className="mt-1 badge-admin-shimmer text-white font-black text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-20">
                      <Shield className="w-2.5 h-2.5 text-white" />
                      <span>Админ</span>
                    </div>
                  )}
                </div>

                {/* User Meta with Applied Custom Text Style */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className={`text-base sm:text-xl font-black font-heading truncate ${user.activeTextColor || 'text-white'}`}>
                      {user.displayName}
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 font-mono-pip border border-zinc-700/60 shrink-0">
                      {user.username}
                    </span>
                  </div>

                  {/* Faction & Role Badge */}
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {user.factionName && (
                      <div className="px-2 py-0.5 rounded-lg bg-zinc-900/90 border border-amber-500/40 text-[10px] flex items-center gap-1 shadow">
                        <Shield className="w-3 h-3 text-amber-400" />
                        <span className="font-bold text-zinc-100 font-heading">
                          {user.factionName}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-amber-300 font-mono-pip">
                          {user.factionRole || 'Боец'}
                        </span>
                      </div>
                    )}

                    {/* Balance Badge */}
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-mono-pip text-[11px] font-bold ${
                        user.equivaxes < 0
                          ? 'bg-rose-950/80 border-rose-500/80 text-rose-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <Coins className={`w-3 h-3 ${user.equivaxes < 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                      <span>
                        {user.isInfiniteEquivaxes || isOwner
                          ? '∞ ℰQ'
                          : user.equivaxes < 0
                          ? `ДОЛГ: ${user.equivaxes.toLocaleString()} ℰQ`
                          : `${user.equivaxes.toLocaleString()} ℰQ`}
                      </span>
                    </div>
                  </div>

                  {/* Cosmetics & Aura Status Indicators */}
                  {(user.activeCardFrame || (user.activeAvatarFrame && user.activeAvatarFrame !== 'frame_none') || (user.activeThemeId && user.activeThemeId !== 'default') || user.hasNeonAura || user.hasVip || user.hasHonoredCitizen) && (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[10px] font-mono-pip">
                      {user.hasNeonAura && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                          <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                          <span>Неоновая аура</span>
                        </span>
                      )}
                      {user.hasVip && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/50 text-amber-300 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          <span>VIP</span>
                        </span>
                      )}
                      {user.hasHonoredCitizen && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-400/50 text-purple-300 flex items-center gap-1">
                          <span>🎖️ Почётный гражданин</span>
                        </span>
                      )}
                      {user.activeCardFrame && user.activeCardFrame !== 'card_frame_none' && (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 flex items-center gap-1">
                          <span>🖼️ Рамка</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quick DM Button */}
                  {onStartChat && user.id !== currentUser.id && (
                    <div className="mt-1.5">
                      <button
                        onClick={() => onStartChat(user)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-700/60 bg-cyan-950/60 px-2.5 py-1 text-[11px] font-bold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-900/80 active:scale-95"
                      >
                        <MessageCircle className="h-3 w-3 text-cyan-400" /> Написать в ЛС
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

        {/* Mobile Navigation Segmented Tabs Bar */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-900/90 px-2 py-1.5 gap-1 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'info'
                ? 'bg-amber-500 text-black shadow font-black'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Инфо</span>
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'characters'
                ? 'bg-amber-500 text-black shadow font-black'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Анкеты ({userCharacters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('awards')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'awards'
                ? 'bg-amber-500 text-black shadow font-black'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <AwardIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Заслуги ({userAwards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-black shadow font-black'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>Вещи ({user.inventory?.length || 0})</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-2 px-3 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-red-500 text-white shadow font-black animate-pulse'
                  : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30'
              }`}
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>Админ ⚙️</span>
            </button>
          )}
        </div>

        {/* Tab Content Body (Scrollable, mobile safe padding) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 pb-12 sm:pb-6">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <div className="text-xl font-bold font-mono-pip text-amber-400">{user.eventsAttended}</div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Ивентов</div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <div className="text-xl font-bold font-mono-pip text-cyan-400">{user.plannedRpsAttended}</div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">РП-Сессий</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('characters')}
                  className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center hover:bg-zinc-800/60 transition active:scale-95"
                >
                  <div className="text-xl font-bold font-mono-pip text-emerald-400">{userCharacters.length}</div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold flex items-center justify-center gap-0.5">
                    <span>Анкет</span> <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              </div>

              {/* Bio / Quote Card */}
              {user.bio ? (
                <div className={`p-3.5 rounded-2xl border ${user.activeTextBg ? 'bg-zinc-950/70 border-zinc-700/60' : 'bg-zinc-900/40 border-zinc-800/80'}`}>
                  <span className="text-[10px] font-mono-pip text-zinc-500 uppercase tracking-wider block mb-1">
                    О себе:
                  </span>
                  <p className={`text-xs leading-relaxed italic ${user.activeTextColor || 'text-zinc-300'}`}>
                    "{user.bio}"
                  </p>
                </div>
              ) : null}

              {/* Wasteland Member Date */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/60 text-xs text-zinc-400">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Зарегистрирован в Пустоши: <strong>{new Date(user.joinedAt).toLocaleDateString('ru-RU')}</strong></span>
              </div>

              {/* Pinned Arts Showcase */}
              {user.pinnedArts && user.pinnedArts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider font-heading text-zinc-400 mb-2">
                    Закреплённые работы сталкера
                  </h4>
                  <ProfilePinnedArtsShowcase currentUser={user} isReadOnly={true} />
                </div>
              )}

              {/* User Recent Transactions Log */}
              {user.transactions && user.transactions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider font-heading text-zinc-300">
                        Недавние операции
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono-pip text-zinc-500">
                      {user.transactions.length} операций
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {user.transactions.slice(0, 3).map(tx => {
                      const isPositive = tx.amount > 0;
                      return (
                        <div
                          key={tx.id}
                          className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-heading font-bold text-zinc-200 truncate text-[11px]">
                              {tx.title}
                            </div>
                            <div className="text-[9px] text-zinc-500 font-mono-pip truncate">
                              {new Date(tx.timestamp).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {tx.description ? ` • ${tx.description}` : ''}
                            </div>
                          </div>

                          <div
                            className={`font-mono-pip font-bold text-xs shrink-0 ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} ℰQ
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHARACTERS (АНКЕТЫ) */}
          {activeTab === 'characters' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Анкеты персонажей ({userCharacters.length})</span>
                </span>
              </div>

              {userCharacters.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                  У этого сталкера ещё нет созданных анкет персонажей.
                </div>
              ) : (
                <div className="space-y-2">
                  {userCharacters.map(char => (
                    <div
                      key={char.id}
                      onClick={() => onSelectCharacter && onSelectCharacter(char)}
                      className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between gap-3 cursor-pointer transition active:scale-98 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={char.avatarIcon || char.photoUrl}
                          alt={char.name}
                          className="w-11 h-11 rounded-xl object-cover border border-amber-500/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-amber-300 font-heading truncate">
                            {char.name} {char.surname !== '—' ? char.surname : ''} {char.nickname && `«${char.nickname}»`}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono-pip truncate mt-0.5">
                            {char.race} • {char.faction} • {char.age}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono-pip shrink-0 flex items-center gap-1">
                        Открыть <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AWARDS (ЗАСЛУГИ) */}
          {activeTab === 'awards' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AwardIcon className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold tracking-wider uppercase shimmer-neon-text font-heading">
                  ✦ Заслуги и ордена Пустоши ✦ ({userAwards.length})
                </h4>
              </div>

              {userAwards.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                  У сталкера пока нет врученных наград.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {userAwards.map(award => (
                    <div
                      key={award.id}
                      className={`p-3 rounded-2xl border bg-gradient-to-br ${award.cardBg} transition shadow`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl shrink-0 filter drop-shadow">
                          {award.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-bold font-heading truncate ${award.titleColor}`}>
                            {award.title}
                          </div>
                          <p className={`text-[11px] mt-1 leading-snug line-clamp-3 ${award.textColor}`}>
                            {award.description}
                          </p>
                          <div className="mt-2 text-[9px] text-zinc-400 font-mono-pip flex justify-between">
                            <span>От: {award.awardedBy}</span>
                            <span>{new Date(award.awardedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INVENTORY (ВЕЩИ) */}
          {activeTab === 'inventory' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider font-heading text-zinc-300">
                Инвентарь и косметика ({user.inventory?.length || 0})
              </h4>

              {(!user.inventory || user.inventory.length === 0) ? (
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                  Инвентарь пуст. Предметы можно приобрести в Магазине или получить из Кейсов.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {user.inventory.map(item => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border bg-gradient-to-br ${item.bgStyle} flex flex-col items-center text-center`}
                    >
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        className="w-12 h-12 object-contain rounded-lg drop-shadow"
                      />
                      <span className={`text-[11px] mt-1.5 line-clamp-1 font-bold ${item.textStyle}`}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ADMIN MANAGEMENT (Только для администраторов) */}
          {isAdmin && activeTab === 'admin' && (
            <div className="space-y-4 p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-heading font-black uppercase">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Панель управления сталкером</span>
              </div>

              {/* Quick Money Granting */}
              {onQuickGrantMoney && (
                <div className="space-y-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[11px] font-mono-pip text-amber-300 font-bold block">
                    💰 Начислить Эквиваксы (ℰQ):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onQuickGrantMoney(user.id, 50)}
                      className="py-2.5 px-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 text-xs font-mono font-bold border border-amber-500/40 active:scale-95 transition"
                    >
                      +50 ℰQ
                    </button>
                    <button
                      onClick={() => onQuickGrantMoney(user.id, 200)}
                      className="py-2.5 px-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 text-xs font-mono font-bold border border-amber-500/40 active:scale-95 transition"
                    >
                      +200 ℰQ
                    </button>
                    <button
                      onClick={() => onQuickGrantMoney(user.id, 1000)}
                      className="py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-black shadow active:scale-95 transition"
                    >
                      +1,000 ℰQ
                    </button>
                  </div>
                </div>
              )}

              {/* Lottery Ticket Issuance */}
              {onIssueLotteryTicket && (
                <div className="space-y-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[11px] font-mono-pip text-cyan-300 font-bold block">
                    🎰 Выдать билет удачи:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        const ticket = {
                          id: 'inv_ticket_' + Date.now(),
                          itemId: 'lotto_' + Date.now(),
                          name: '🍀 Билет Удачи Сталкера',
                          photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80',
                          bgStyle: 'from-emerald-950 via-zinc-950 to-green-950 border-emerald-500',
                          textStyle: 'text-emerald-300 font-bold',
                          rarity: 'common',
                          type: 'lottery_ticket',
                          acquiredAt: new Date().toISOString(),
                          lotteryData: {
                            prizeEquivaxes: 100,
                            ticketSerial: 'DT-' + Math.floor(100000 + Math.random() * 900000),
                            themeTitle: '🍀 Билет Удачи Сталкера'
                          }
                        };
                        onIssueLotteryTicket(user.id, ticket);
                        alert(`Билет удачи (100 ℰQ) выдан сталкеру ${user.displayName}!`);
                      }}
                      className="py-2 px-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold active:scale-95 transition text-center"
                    >
                      🍀 100 ℰQ
                    </button>

                    <button
                      onClick={() => {
                        const ticket = {
                          id: 'inv_ticket_' + Date.now(),
                          itemId: 'lotto_' + Date.now(),
                          name: '💎 Джекпот Сьерра-Мадре 777',
                          photoUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80',
                          bgStyle: 'from-purple-950 via-zinc-950 to-fuchsia-950 border-fuchsia-500',
                          textStyle: 'text-fuchsia-300 font-bold',
                          rarity: 'epic',
                          type: 'lottery_ticket',
                          acquiredAt: new Date().toISOString(),
                          lotteryData: {
                            prizeEquivaxes: 777,
                            ticketSerial: 'DT-' + Math.floor(100000 + Math.random() * 900000),
                            themeTitle: '💎 Джекпот Сьерра-Мадре 777'
                          }
                        };
                        onIssueLotteryTicket(user.id, ticket);
                        alert(`Билет «Джекпот 777» выдан сталкеру ${user.displayName}!`);
                      }}
                      className="py-2 px-1.5 rounded-xl bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-fuchsia-300 text-[11px] font-mono font-bold active:scale-95 transition text-center"
                    >
                      💎 777 ℰQ
                    </button>

                    <button
                      onClick={() => {
                        const ticket = {
                          id: 'inv_ticket_' + Date.now(),
                          itemId: 'lotto_' + Date.now(),
                          name: '👑 Золотой Реактор 999',
                          photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=200&q=80',
                          bgStyle: 'from-amber-950 via-zinc-950 to-yellow-950 border-amber-500',
                          textStyle: 'text-amber-300 font-bold',
                          rarity: 'legendary',
                          type: 'lottery_ticket',
                          acquiredAt: new Date().toISOString(),
                          lotteryData: {
                            prizeEquivaxes: 2500,
                            ticketSerial: 'DT-' + Math.floor(100000 + Math.random() * 900000),
                            themeTitle: '👑 Золотой Реактор 999'
                          }
                        };
                        onIssueLotteryTicket(user.id, ticket);
                        alert(`Легендарный билет (2500 ℰQ) выдан сталкеру ${user.displayName}!`);
                      }}
                      className="py-2 px-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-mono font-black active:scale-95 transition text-center shadow"
                    >
                      👑 2500 ℰQ
                    </button>
                  </div>
                </div>
              )}

              {/* Owner Role Management */}
              {amIOwner && !isOwner && onToggleAdmin && (
                <div className="pt-2 border-t border-zinc-700/50">
                  {isTargetAdmin ? (
                    <button
                      onClick={() => onToggleAdmin(user.username, false)}
                      className="w-full py-2.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-bold font-heading flex items-center justify-center gap-2 transition shadow active:scale-95"
                    >
                      <UserX className="w-4 h-4 text-red-400" />
                      <span>Снять права Администратора</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleAdmin(user.username, true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-xs font-bold font-heading flex items-center justify-center gap-2 transition shadow active:scale-95"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>Выдать права Администратора</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Close Bar */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-heading font-black uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98"
          >
            <X className="w-4 h-4 text-zinc-400" />
            <span>Закрыть</span>
          </button>
        </div>
          </div>
        </PlayerCardFrame>
      </div>
    </div>
  );
};
