import React, { useState } from 'react';
import { UserProfile, AdminInfo } from '../types';
import { AvatarWithFrame } from './AvatarWithFrame';
import { Shield, Coins, Crown, KeyRound, X, Bell } from 'lucide-react';

interface MiniAppHeaderProps {
  currentUser: UserProfile;
  admins: AdminInfo[];
  onOpenMyProfile: () => void;
  onOpenCases: () => void;
  onUnlockOwner?: (pin: string) => boolean;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export const MiniAppHeader: React.FC<MiniAppHeaderProps> = ({
  currentUser,
  admins,
  onOpenMyProfile,
  onOpenCases,
  onUnlockOwner,
  onOpenNotifications,
  unreadNotificationsCount = 0
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const isOwner = currentUser.username.toLowerCase() === '@mrwhitepio';
  const isAdmin = isOwner || admins.some(
    a => a.username.toLowerCase() === currentUser.username.toLowerCase()
  );

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUnlockOwner && onUnlockOwner(pinInput.trim())) {
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <header className="w-full bg-zinc-950/95 border-b border-zinc-800/80 sticky top-0 z-30 backdrop-blur-md px-3 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-900/30 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <span className="text-amber-400 font-extrabold text-sm font-mono-pip">DT</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-heading font-black text-sm sm:text-base tracking-wider text-amber-400 uppercase leading-none">
                Даст Таун Колектив
              </h1>
              {isOwner ? (
                <span className="badge-owner-shimmer text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <Crown className="w-2.5 h-2.5 text-black" /> СОЗДАТЕЛЬ
                </span>
              ) : isAdmin ? (
                <span className="badge-admin-shimmer text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <Shield className="w-2.5 h-2.5 text-white" /> АДМИН
                </span>
              ) : null}
            </div>
            <p className="text-[10px] text-zinc-400 font-mono-pip leading-none mt-1">
              Fallout: Equestria • Группа Колектива
            </p>
          </div>
        </div>

        {/* Right Controls: Balance + User Profile Trigger */}
        <div className="flex items-center gap-2">
          {/* Equivaxes Balance Pill */}
          <button
            onClick={onOpenCases}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono-pip text-xs font-bold transition shadow-sm ${
              currentUser.equivaxes < 0
                ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/60 text-rose-300'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
            }`}
            title={currentUser.equivaxes < 0 ? 'У вас задолженность за пропуск РП' : 'Открыть кейсы и потратить Эквиваксы'}
          >
            <Coins className={`w-3.5 h-3.5 ${currentUser.equivaxes < 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <span>
              {currentUser.isInfiniteEquivaxes || isOwner
                ? '∞ ℰQ'
                : currentUser.equivaxes < 0
                ? `${currentUser.equivaxes.toLocaleString()} ℰQ (Долг)`
                : `${currentUser.equivaxes.toLocaleString()} ℰQ`}
            </span>
          </button>

          {/* Notification Bell with Badge */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-amber-400 transition"
              title="Центр уведомлений Даст Таун"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono-pip font-extrabold flex items-center justify-center border-2 border-zinc-950 animate-pulse shadow-md">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              ) : null}
            </button>
          )}

          {/* User Profile Button */}
          <button
            onClick={onOpenMyProfile}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition"
            title="Открыть мой профиль"
          >
            <AvatarWithFrame
              avatarUrl={currentUser.avatarUrl}
              frameId={currentUser.activeAvatarFrame}
              size="sm"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className={`text-xs font-bold line-clamp-1 font-heading ${currentUser.activeTextColor || 'text-zinc-200'}`}>
                {currentUser.displayName}
              </span>
              <span className="text-[9px] text-zinc-400 font-mono-pip -mt-0.5">
                {currentUser.username}
              </span>
            </div>
          </button>

          {/* Discreet Owner Pin Unlock button if in desktop browser */}
          {!isOwner && onUnlockOwner && (
            <button
              onClick={() => setShowPinModal(true)}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 hover:text-amber-400 transition"
              title="Вход для Создателя (PIN)"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Secret Owner PIN Unlock Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl bg-zinc-900 border border-amber-500/50 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-heading font-bold text-sm">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Авторизация Создателя</span>
              </div>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Введите мастер-PIN владельца группы Даст Таун Колектив (@MrWhitePio):
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="Мастер-PIN"
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className={`w-full px-3 py-2 text-center text-sm tracking-widest rounded-xl bg-zinc-950 border font-mono ${
                  pinError ? 'border-red-500 text-red-300' : 'border-zinc-700 text-zinc-100 focus:border-amber-400'
                } focus:outline-none`}
                autoFocus
              />

              {pinError && (
                <p className="text-[11px] text-red-400 text-center font-mono">
                  Неверный PIN-код!
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-xs uppercase tracking-wider transition shadow"
              >
                Подтвердить
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
