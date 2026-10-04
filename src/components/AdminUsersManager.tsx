import React, { useState } from 'react';
import { UserProfile, InventoryItem, Rarity } from '../types';
import {
  Coins,
  Search,
  UserCheck,
  Sparkles,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Infinity,
  Ticket,
  Check,
  Trophy
} from 'lucide-react';

interface AdminUsersManagerProps {
  profiles: UserProfile[];
  onGrantMoney: (userId: string, amount: number) => void;
  onSetInfiniteMoney: (userId: string, isInfinite: boolean) => void;
  onSelectProfile: (profile: UserProfile) => void;
  onIssueLotteryTicket: (userId: string, ticketItem: InventoryItem) => void;
}

const LOTTERY_PRESETS = [
  {
    name: '🍀 Скретч Удачи Сталкера',
    rarity: 'common' as const,
    prize: 100,
    numbers: [3, 3, 3] as [number, number, number],
    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: '⚡ Квантовый Лото-Скретч Спарка',
    rarity: 'rare' as const,
    prize: 300,
    numbers: [5, 5, 5] as [number, number, number],
    photoUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: '💎 Джекпот Сьерра-Мадре 777',
    rarity: 'epic' as const,
    prize: 777,
    numbers: [7, 7, 7] as [number, number, number],
    photoUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: '👑 Золотой Реактор Пустошей 999',
    rarity: 'legendary' as const,
    prize: 2500,
    numbers: [9, 9, 9] as [number, number, number],
    photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=200&q=80'
  }
];

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({
  profiles,
  onGrantMoney,
  onSetInfiniteMoney,
  onSelectProfile,
  onIssueLotteryTicket
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(profiles[0]?.id || '');
  const [amountInput, setAmountInput] = useState<number>(100);
  const [search, setSearch] = useState('');

  // Lottery ticket issuance state
  const [ticketName, setTicketName] = useState('💎 Джекпот Сьерра-Мадре 777');
  const [ticketRarity, setTicketRarity] = useState<Rarity>('epic');
  const [ticketPrize, setTicketPrize] = useState<number>(777);
  const [ticketNumber, setTicketNumber] = useState<number>(7);
  const [issuedNotification, setIssuedNotification] = useState<string | null>(null);

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

  const handleSelectPreset = (preset: typeof LOTTERY_PRESETS[0]) => {
    setTicketName(preset.name);
    setTicketRarity(preset.rarity);
    setTicketPrize(preset.prize);
    setTicketNumber(preset.numbers[0]);
  };

  const handleIssueTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const num = Math.max(1, Math.min(9, ticketNumber));
    const prize = Math.max(1, ticketPrize);

    const ticketItem: InventoryItem = {
      id: 'inv_ticket_' + Date.now(),
      itemId: 'lotto_' + Date.now(),
      name: ticketName.trim() || '🎰 Лотерейный Билет DustTown',
      photoUrl:
        ticketRarity === 'legendary'
          ? 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=200&q=80'
          : ticketRarity === 'epic'
          ? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80'
          : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80',
      bgStyle:
        ticketRarity === 'legendary'
          ? 'from-amber-950 via-zinc-950 to-yellow-950 border-amber-500'
          : ticketRarity === 'epic'
          ? 'from-purple-950 via-zinc-950 to-fuchsia-950 border-fuchsia-500'
          : 'from-emerald-950 via-zinc-950 to-green-950 border-emerald-500',
      textStyle:
        ticketRarity === 'legendary'
          ? 'text-amber-300 font-bold'
          : ticketRarity === 'epic'
          ? 'text-fuchsia-300 font-bold'
          : 'text-emerald-300 font-bold',
      rarity: ticketRarity,
      type: 'lottery_ticket',
      acquiredAt: new Date().toISOString(),
      lotteryData: {
        prizeEquivaxes: prize,
        ticketSerial: 'DT-' + Math.floor(100000 + Math.random() * 900000),
        themeTitle: ticketName
      }
    };

    onIssueLotteryTicket(selectedUserId, ticketItem);

    setIssuedNotification(`Билет «${ticketItem.name}» на ${prize} ℰQ успешно выдан сталкеру ${selectedUser?.displayName}!`);
    setTimeout(() => setIssuedNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold font-heading text-amber-400 uppercase tracking-wide">
          Экономика и Выдача Лотерейных Билетов
        </h3>
        <p className="text-xs text-zinc-400">
          Управляйте балансами сталкеров или выдавайте интерактивные лотерейные билеты со стираемым слоем и настраиваемым выигрышем.
        </p>
      </div>

      {/* Target User Selector Box */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-700 space-y-3">
        <label className="block text-xs font-mono-pip text-zinc-300">
          Выберите целевого сталкера для начисления баланса или выдачи билета:
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

      {/* 1. Grant / Deduct Box */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold font-heading text-amber-300">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Прямое начисление Эквиваксов (ℰQ)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="flex items-end gap-2">
            <button
              onClick={() => handleApplyAmount(1)}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-heading font-black uppercase transition flex items-center justify-center gap-1 shadow"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Начислить +{amountInput}</span>
            </button>
            <button
              onClick={() => handleApplyAmount(-1)}
              className="flex-1 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-heading font-black uppercase transition flex items-center justify-center gap-1 shadow"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Списать -{amountInput}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ISSUE LOTTERY TICKET (INTERACTIVE SCRATCH CARD) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/50 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold font-heading text-amber-300">
            <Ticket className="w-4 h-4 text-amber-400" />
            <span>🎰 Выдача Лотерейного Билета в инвентарь игрока</span>
          </div>
          <span className="text-[10px] font-mono-pip text-zinc-400">
            Игрок сможет стереть защитный слой
          </span>
        </div>

        {issuedNotification && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-mono-pip flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{issuedNotification}</span>
          </div>
        )}

        {/* Presets Grid */}
        <div>
          <label className="block text-xs font-mono-pip text-zinc-400 mb-2">
            Быстрые пресеты лотереи:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LOTTERY_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-xl border text-left text-xs transition ${
                  ticketName === preset.name
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="font-heading font-bold text-[11px] truncate">
                  {preset.name}
                </div>
                <div className="text-[10px] text-amber-400 font-mono-pip mt-1">
                  Куш: {preset.prize} ℰQ
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Ticket Form */}
        <form onSubmit={handleIssueTicketSubmit} className="space-y-3 pt-2 border-t border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Название билета:
              </label>
              <input
                type="text"
                value={ticketName}
                onChange={e => setTicketName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 font-heading focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Редкость (влияет на цвет свечения чисел):
              </label>
              <select
                value={ticketRarity}
                onChange={e => setTicketRarity(e.target.value as Rarity)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 font-mono-pip focus:outline-none focus:border-amber-400"
              >
                <option value="common">Обычный (Зеленый)</option>
                <option value="rare">Редкий (Лазурный неон)</option>
                <option value="epic">Эпический (Фиолетовый)</option>
                <option value="legendary">Легендарный (Золотой 777)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Сумма выигрыша в Эквиваксах (ℰQ):
              </label>
              <input
                type="number"
                min={1}
                value={ticketPrize}
                onChange={e => setTicketPrize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Числа выигрыша (все 3 совпадут):
              </label>
              <input
                type="number"
                min={1}
                max={9}
                value={ticketNumber}
                onChange={e => setTicketNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-1.5"
          >
            <Ticket className="w-4 h-4 text-black" />
            <span>Выдать билет в инвентарь {selectedUser ? `(${selectedUser.displayName})` : ''}</span>
          </button>
        </form>
      </div>

      {/* Players List with Quick +100 EQ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono-pip text-zinc-400 uppercase tracking-wider">
            База сталкеров ({profiles.length})
          </span>
          <div className="relative w-44">
            <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filteredProfiles.map(p => (
            <div
              key={p.id}
              className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.avatarUrl}
                  alt={p.displayName}
                  className="w-9 h-9 rounded-xl object-cover border border-zinc-700"
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
                        Создатель
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono-pip mt-0.5">
                    Баланс:{' '}
                    <span className="text-amber-400 font-bold">
                      {p.isInfiniteEquivaxes || p.username === '@MrWhitePio'
                        ? '∞ ℰQ'
                        : `${p.equivaxes.toLocaleString()} ℰQ`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedUserId(p.id);
                    onGrantMoney(p.id, 100);
                  }}
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
