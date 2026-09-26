import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Coins, Search, UserCheck, Sparkles, Shield, ArrowUpRight, ArrowDownRight, Infinity } from 'lucide-react';

interface AdminUsersManagerProps {
  profiles: UserProfile[];
  onGrantMoney: (userId: string, amount: number) => void;
  onSetInfiniteMoney: (userId: string, isInfinite: boolean) => void;
  onSelectProfile: (profile: UserProfile) => void;
}

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({
  profiles,
  onGrantMoney,
  onSetInfiniteMoney,
  onSelectProfile
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(profiles[0]?.id || '');
  const [amountInput, setAmountInput] = useState<number>(100);
  const [search, setSearch] = useState('');

  const selectedUser = profiles.find(p => p.id === selectedUserId);

  const filteredProfiles = profiles.filter(
    p =>
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleApplyAmount = (multiplier: number) => {
    if (!selectedUserId) return;
    const finalAmount = amountInput * multiplier;
    onGrantMoney(selectedUserId, finalAmount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold font-heading text-amber-400 uppercase tracking-wide">
          Экономика и Балансы игроков
        </h3>
        <p className="text-xs text-zinc-400">
          Выберите игрока из списка созданных профилей или найдите по никнейму/юзернейму, чтобы начислить или списать Эквиваксы.
        </p>
      </div>

      {/* Grant / Deduct Box */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold font-heading text-amber-300">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Начисление Эквиваксов (ℰQ)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* User selector dropdown */}
          <div>
            <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
              Выберите сталкера из базы:
            </label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono-pip"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.displayName} ({p.username}) — {p.isInfiniteEquivaxes || p.username === '@MrWhitePio' ? '∞ ℰQ' : `${p.equivaxes} ℰQ`}
                </option>
              ))}
            </select>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
              Количество Эквиваксов:
            </label>
            <input
              type="number"
              min="1"
              value={amountInput}
              onChange={e => setAmountInput(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono-pip"
            />
          </div>
        </div>

        {/* Selected User Preview Banner */}
        {selectedUser && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedUser.avatarUrl}
                alt={selectedUser.displayName}
                className="w-10 h-10 rounded-xl object-cover border border-amber-500/50"
              />
              <div>
                <div className="text-xs font-bold text-zinc-100 font-heading">
                  {selectedUser.displayName}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono-pip">
                  Текущий баланс:{' '}
                  <span className="text-amber-400 font-bold">
                    {selectedUser.isInfiniteEquivaxes || selectedUser.username === '@MrWhitePio'
                      ? '∞ БЕСКОНЕЧНО'
                      : `${selectedUser.equivaxes.toLocaleString()} ℰQ`}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Infinite Toggle */}
            <button
              onClick={() => onSetInfiniteMoney(selectedUser.id, !selectedUser.isInfiniteEquivaxes)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono-pip font-bold flex items-center gap-1 transition ${
                selectedUser.isInfiniteEquivaxes || selectedUser.username === '@MrWhitePio'
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700'
              }`}
              title="Включить бесконечный запас денег"
            >
              <Infinity className="w-3.5 h-3.5" />
              <span>
                {selectedUser.isInfiniteEquivaxes || selectedUser.username === '@MrWhitePio'
                  ? 'Бесконечно (Активно)'
                  : 'Сделать бесконечным'}
              </span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            onClick={() => handleApplyAmount(-1)}
            className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800 text-xs font-mono-pip font-bold flex items-center gap-1.5 transition"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Списать -{amountInput} ℰQ</span>
          </button>

          <button
            onClick={() => handleApplyAmount(1)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow flex items-center gap-1.5 transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Начислить +{amountInput} ℰQ</span>
          </button>
        </div>
      </div>

      {/* Players List with Quick Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono-pip text-zinc-400 uppercase tracking-wider font-bold">
            Все сталкеры DustTown ({profiles.length}):
          </h4>
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="space-y-2">
          {filteredProfiles.map(p => (
            <div
              key={p.id}
              className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.avatarUrl}
                  alt={p.displayName}
                  className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200 font-heading">
                      {p.displayName}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono-pip">
                      {p.username}
                    </span>
                    {p.username === '@MrWhitePio' && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black text-[9px] font-bold">
                        Владелец
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono-pip mt-0.5">
                    Баланс:{' '}
                    <span className="text-amber-400 font-bold">
                      {p.isInfiniteEquivaxes || p.username === '@MrWhitePio'
                        ? '∞ ℰQ'
                        : `${p.equivaxes.toLocaleString()} ℰQ`}
                    </span>{' '}
                    • Ивентов: {p.eventsAttended} • РП: {p.plannedRpsAttended}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedUserId(p.id); onGrantMoney(p.id, 100); }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 text-xs font-mono-pip border border-zinc-700 transition"
                >
                  +100 ℰQ
                </button>
                <button
                  onClick={() => onSelectProfile(p)}
                  className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono-pip transition"
                >
                  Профиль
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
