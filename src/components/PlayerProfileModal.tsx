import React from 'react';
import { UserProfile, Award, CharacterSheet, AdminInfo } from '../types';
import { AvatarWithFrame } from './AvatarWithFrame';
import { ProfileAnimatedTheme } from './ProfileAnimatedTheme';
import { ProfilePinnedArtsShowcase } from './ProfilePinnedArtsShowcase';
import { Award as AwardIcon, Sparkles, Shield, Coins, Calendar, X, ExternalLink, Crown, UserCheck, UserX, History } from 'lucide-react';

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
}

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
  onIssueLotteryTicket
}) => {
  if (!user) return null;

  const isOwner = user.username.toLowerCase() === '@mrwhitepio';
  const isTargetAdmin = !isOwner && admins.some(a => a.username.toLowerCase() === user.username.toLowerCase());
  const amIOwner = currentUser.username.toLowerCase() === '@mrwhitepio';

  const userAwards = awards.filter(a => a.recipientUsername.toLowerCase() === user.username.toLowerCase());
  const userCharacters = characters.filter(c => c.creatorTelegram.toLowerCase() === user.username.toLowerCase());
  const isBlackTreeTheme = user.activeThemeId === 'black_tree';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Background backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl max-h-[94dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl text-zinc-100 flex flex-col z-10">
        {/* Mobile Swipe Bar Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-12 h-1 rounded-full bg-zinc-700/80" />
        </div>

        {/* Sticky Close Button */}
        <button
          onClick={onClose}
          aria-label="Закрыть профиль"
          className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition shadow-lg active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Profile Card with Applied Theme & Cosmetics */}
        <div className={`relative p-5 sm:p-6 rounded-t-3xl overflow-hidden ${user.activeTextBg || 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800'}`}>
          <ProfileAnimatedTheme
            themeId={user.activeThemeId || 'default'}
            customBgUrl={user.customBgUrl}
            customBgEffect={user.customBgEffect}
            customBgPosition={user.customBgPosition}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar & Badges */}
            <div className="relative flex flex-col items-center">
              <AvatarWithFrame
                avatarUrl={user.avatarUrl}
                frameId={user.activeAvatarFrame}
                size="lg"
              />
              {isOwner && (
                <div className="mt-2 badge-owner-shimmer text-black font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-20">
                  <Crown className="w-3 h-3 text-black" />
                  <span>Создатель</span>
                </div>
              )}
              {isTargetAdmin && (
                <div className="mt-2 badge-admin-shimmer text-white font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-20">
                  <Shield className="w-3 h-3 text-white" />
                  <span>Админ</span>
                </div>
              )}
            </div>

            {/* User Meta with Applied Custom Text Style */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className={`text-xl font-bold font-heading ${user.activeTextColor || 'text-white'}`}>
                  {user.displayName}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 font-mono-pip border border-zinc-700/60">
                  {user.username}
                </span>
              </div>

              {user.bio && (
                <p className="mt-2 text-xs text-zinc-300 leading-relaxed italic max-w-md">
                  "{user.bio}"
                </p>
              )}

              {/* Faction & Role Badge */}
              {user.factionName && (
                <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  <div className="px-2.5 py-1 rounded-xl bg-zinc-900/90 border border-amber-500/40 text-xs flex items-center gap-1.5 shadow">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-zinc-100 font-heading">
                      {user.factionName}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[10px] font-black font-heading uppercase">
                      🎖️ {user.factionRole || 'Боец'}
                    </span>
                  </div>
                </div>
              )}

              {/* Balance & Date */}
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono-pip font-bold ${
                    user.equivaxes < 0
                      ? 'bg-rose-950/80 border-rose-500/80 text-rose-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <Coins className={`w-3.5 h-3.5 ${user.equivaxes < 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                  <span>
                    {user.isInfiniteEquivaxes || isOwner
                      ? '∞ ℰQ'
                      : user.equivaxes < 0
                      ? `ДОЛГ: ${user.equivaxes.toLocaleString()} ℰQ`
                      : `${user.equivaxes.toLocaleString()} ℰQ`}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400 text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>В Пустоши с {new Date(user.joinedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Owner Management Controls: Grant/Revoke Admin Rights */}
              {amIOwner && !isOwner && onToggleAdmin && (
                <div className="mt-3.5 pt-3 border-t border-zinc-700/60 flex items-center justify-center sm:justify-start gap-2">
                  {isTargetAdmin ? (
                    <button
                      onClick={() => onToggleAdmin(user.username, false)}
                      className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-bold font-heading flex items-center gap-1.5 transition shadow"
                    >
                      <UserX className="w-3.5 h-3.5 text-red-400" />
                      <span>Снять права Администратора</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleAdmin(user.username, true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-xs font-bold font-heading flex items-center gap-1.5 transition shadow"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Выдать права Администратора</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Admin Money & Lottery Buttons */}
          {isAdmin && (
            <div className="relative z-10 mt-4 pt-3 border-t border-zinc-700/50 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono-pip text-amber-400 font-semibold">
                  ⚙️ Начисление Эквиваксов:
                </span>
                {onQuickGrantMoney && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickGrantMoney(user.id, 50)}
                      className="px-2 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-mono font-bold border border-amber-500/40"
                    >
                      +50 ℰQ
                    </button>
                    <button
                      onClick={() => onQuickGrantMoney(user.id, 200)}
                      className="px-2 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-mono font-bold border border-amber-500/40"
                    >
                      +200 ℰQ
                    </button>
                    <button
                      onClick={() => onQuickGrantMoney(user.id, 1000)}
                      className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold shadow"
                    >
                      +1,000 ℰQ
                    </button>
                  </div>
                )}
              </div>

              {onIssueLotteryTicket && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-700/40">
                  <span className="text-[11px] font-mono-pip text-cyan-400 font-semibold">
                    🎰 Выдать билет удачи:
                  </span>
                  <div className="flex items-center gap-1.5">
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
                        alert(`Билет удачи (куш до 100 ℰQ) выдан сталкеру ${user.displayName}!`);
                      }}
                      className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold"
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
                        alert(`Билет «Джекпот 777» (куш до 777 ℰQ) выдан сталкеру ${user.displayName}!`);
                      }}
                      className="px-2 py-1 rounded bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-fuchsia-300 text-[11px] font-mono font-bold"
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
                        alert(`Легендарный билет (куш до 2,500 ℰQ) выдан сталкеру ${user.displayName}!`);
                      }}
                      className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-mono font-black shadow"
                    >
                      👑 2500 ℰQ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Body with Mobile Safe Bottom Padding */}
        <div className="p-4 sm:p-6 space-y-6 pb-28 sm:pb-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-xl font-bold font-mono-pip text-amber-400">{user.eventsAttended}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Ивентов</div>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-xl font-bold font-mono-pip text-cyan-400">{user.plannedRpsAttended}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">РП-Сессий</div>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-xl font-bold font-mono-pip text-emerald-400">{userCharacters.length}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Анкет</div>
            </div>
          </div>

          {/* Pinned Arts / Photos Showcase */}
          {user.pinnedArts && user.pinnedArts.length > 0 && (
            <ProfilePinnedArtsShowcase currentUser={user} isReadOnly={true} />
          )}

          {/* Awards Section («ЗАСЛУГИ») */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AwardIcon className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold tracking-wider uppercase shimmer-neon-text font-heading">
                ✦ ЗАСЛУГИ И ОРДЕНА ✦
              </h4>
              <span className="text-xs text-zinc-400 font-mono-pip">({userAwards.length})</span>
            </div>

            {userAwards.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                У сталкера пока нет врученных наград.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userAwards.map(award => (
                  <div
                    key={award.id}
                    className={`p-3.5 rounded-2xl border bg-gradient-to-br ${award.cardBg} transition-all duration-300 hover:scale-[1.02] shadow-md`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
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

          {/* User Characters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold uppercase tracking-wider font-heading text-zinc-200">
                  Анкеты персонажей ({userCharacters.length})
                </h4>
              </div>
            </div>

            {userCharacters.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                Персонажи ещё не созданы.
              </div>
            ) : (
              <div className="space-y-2">
                {userCharacters.map(char => (
                  <div
                    key={char.id}
                    onClick={() => onSelectCharacter && onSelectCharacter(char)}
                    className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 flex items-center justify-between gap-3 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={char.avatarIcon || char.photoUrl}
                        alt={char.name}
                        className="w-10 h-10 rounded-xl object-cover border border-amber-500/40"
                      />
                      <div>
                        <div className="text-xs font-bold text-amber-300 font-heading">
                          {char.name} {char.surname !== '—' ? char.surname : ''} {char.nickname && `«${char.nickname}»`}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono-pip">
                          {char.race} • {char.faction} • {char.age}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-amber-400 flex items-center gap-1 font-mono-pip">
                      Анкета <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Inventory Preview */}
          {user.inventory && user.inventory.length > 0 && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider font-heading text-zinc-200 mb-3">
                Инвентарь ({user.inventory.length})
              </h4>
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
                    <span className={`text-[11px] mt-1.5 line-clamp-1 ${item.textStyle}`}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Recent Transactions Log */}
          {user.transactions && user.transactions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold uppercase tracking-wider font-heading text-zinc-200">
                    История операций ℰQ
                  </h4>
                </div>
                <span className="text-[10px] font-mono-pip text-zinc-500">
                  {user.transactions.length} операций
                </span>
              </div>

              <div className="space-y-1.5">
                {user.transactions.slice(0, 4).map(tx => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-heading font-bold text-zinc-200 truncate">
                          {tx.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono-pip truncate">
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

          {/* Bottom Close Action Button for Mobile Convenience */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-heading font-black uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98 shadow"
            >
              <X className="w-4 h-4 text-zinc-400" />
              <span>Закрыть профиль</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
