import React, { useState } from 'react';
import { RPEvent, UserProfile } from '../types';
import {
  X,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Coins,
  AlertTriangle,
  UserCheck,
  UserX,
  Plus,
  Shield,
  Search,
  Sparkles,
  Flame,
  Handshake,
  Calendar
} from 'lucide-react';

export interface CompletionOutcome {
  eventId: string;
  attendedUserIds: string[];
  absentUserIds: string[];
  excusedUserIds: string[];
  rewardAmount: number;
  penaltyAmount: number;
  sendGroupReport: boolean;
}

interface EventCompletionModalProps {
  event: RPEvent;
  profiles: UserProfile[];
  onConfirm: (outcome: CompletionOutcome) => void;
  onClose: () => void;
}

type AttendanceStatus = 'attended' | 'absent' | 'excused';

export const EventCompletionModal: React.FC<EventCompletionModalProps> = ({
  event,
  profiles,
  onConfirm,
  onClose
}) => {
  const [rewardAmount, setRewardAmount] = useState<number>(event.rewardEquivaxes || 150);
  const [penaltyAmount, setPenaltyAmount] = useState<number>(event.rewardEquivaxes || 150);
  const [sendGroupReport, setSendGroupReport] = useState<boolean>(true);

  // Match event.participants to actual profiles
  const initialParticipantProfiles: UserProfile[] = [];
  event.participants.forEach(p => {
    const found = profiles.find(
      u =>
        u.id === p ||
        u.username.toLowerCase() === p.toLowerCase() ||
        u.username.toLowerCase() === ('@' + p.replace(/^@/, '')).toLowerCase()
    );
    if (found && !initialParticipantProfiles.some(item => item.id === found.id)) {
      initialParticipantProfiles.push(found);
    }
  });

  const [participantList, setParticipantList] = useState<UserProfile[]>(initialParticipantProfiles);
  // Default: all registered participants marked as 'attended'
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    initialParticipantProfiles.forEach(p => {
      map[p.id] = 'attended';
    });
    return map;
  });

  // Extra player search for adding players who came without prior registration
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const setStatus = (userId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [userId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    participantList.forEach(p => {
      updated[p.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleAddPlayer = (user: UserProfile) => {
    if (!participantList.some(p => p.id === user.id)) {
      setParticipantList(prev => [...prev, user]);
      setAttendanceMap(prev => ({ ...prev, [user.id]: 'attended' }));
    }
    setSearchQuery('');
    setShowAddPlayer(false);
  };

  const handleRemovePlayer = (userId: string) => {
    setParticipantList(prev => prev.filter(p => p.id !== userId));
    setAttendanceMap(prev => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
  };

  const handleFinish = () => {
    const attendedUserIds: string[] = [];
    const absentUserIds: string[] = [];
    const excusedUserIds: string[] = [];

    participantList.forEach(p => {
      const status = attendanceMap[p.id] || 'attended';
      if (status === 'attended') attendedUserIds.push(p.id);
      else if (status === 'absent') absentUserIds.push(p.id);
      else excusedUserIds.push(p.id);
    });

    onConfirm({
      eventId: event.id,
      attendedUserIds,
      absentUserIds,
      excusedUserIds,
      rewardAmount: Number(rewardAmount) || 0,
      penaltyAmount: Number(penaltyAmount) || 0,
      sendGroupReport
    });
  };

  const attendedCount = participantList.filter(p => attendanceMap[p.id] === 'attended').length;
  const absentCount = participantList.filter(p => attendanceMap[p.id] === 'absent').length;
  const excusedCount = participantList.filter(p => attendanceMap[p.id] === 'excused').length;

  const availableToAdd = profiles.filter(
    p =>
      !participantList.some(item => item.id === p.id) &&
      (p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-950 border border-amber-500/60 shadow-2xl p-5 sm:p-7 flex flex-col space-y-4 my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-mono-pip font-extrabold uppercase tracking-wider flex items-center gap-1 shadow">
              <Shield className="w-3 h-3 text-black" />
              <span>Панель Администрации</span>
            </span>

            {event.type === 'collab' ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono-pip font-bold flex items-center gap-1">
                <Handshake className="w-3 h-3" /> Коллаборация
              </span>
            ) : event.type === 'planned_rp' ? (
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[9px] font-mono-pip font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> РП-Сессия
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono-pip font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" /> Ивент
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black font-heading tracking-wide uppercase text-amber-400">
            Подведение итогов: {event.title}
          </h3>
          <p className="text-xs text-zinc-400">
            Отметьте, кто из игроков реально присутствовал на игре, а кто записался, но не пришёл (прогул).
          </p>
        </div>

        {/* Reward and Penalty Settings */}
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-mono-pip text-emerald-400 font-bold mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Награда за участие каждому (+ℰQ):</span>
            </label>
            <input
              type="number"
              min="0"
              value={rewardAmount}
              onChange={e => setRewardAmount(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono-pip font-bold focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-mono-pip text-rose-400 font-bold mb-1">
              <UserX className="w-3.5 h-3.5" />
              <span>Штраф за неявку прогульщикам (-ℰQ):</span>
            </label>
            <input
              type="number"
              min="0"
              value={penaltyAmount}
              onChange={e => setPenaltyAmount(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-rose-500/40 text-rose-300 text-xs font-mono-pip font-bold focus:outline-none focus:border-rose-400"
            />
            <p className="text-[10px] text-zinc-500 font-mono-pip mt-0.5">
              С баланса неявившихся спишется указанная сумма (может уйти в минус/долг).
            </p>
          </div>
        </div>

        {/* Quick Batch Actions & Add player button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 font-mono-pip">Быстрые действия:</span>
            <button
              type="button"
              onClick={() => handleMarkAll('attended')}
              className="px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono-pip font-bold transition"
            >
              Все были
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('absent')}
              className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-[10px] font-mono-pip font-bold transition"
            >
              Все не пришли
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[10px] font-mono-pip font-bold border border-zinc-700 transition"
          >
            <Plus className="w-3 h-3 text-amber-400" />
            <span>Добавить игрока вручную</span>
          </button>
        </div>

        {/* Add Player Dropdown Search */}
        {showAddPlayer && (
          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/40 space-y-2 animate-fade-in">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск сталкера по нику или имени..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1">
              {availableToAdd.length === 0 ? (
                <div className="p-2 text-center text-xs text-zinc-500">
                  {searchQuery ? 'Игроки не найдены' : 'Все доступные игроки уже в списке'}
                </div>
              ) : (
                availableToAdd.slice(0, 10).map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleAddPlayer(u)}
                    className="w-full p-1.5 rounded-xl hover:bg-zinc-800 flex items-center justify-between text-left text-xs transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={u.avatarUrl}
                        alt={u.username}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                      <span className="font-heading font-bold text-zinc-200 truncate">
                        {u.displayName}
                      </span>
                      <span className="text-zinc-500 font-mono-pip text-[10px]">{u.username}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono-pip text-[9px] font-bold shrink-0">
                      + Добавить
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Participants Table / List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono-pip text-zinc-400 uppercase tracking-wider px-1">
            <span>Участники события ({participantList.length})</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">Был: {attendedCount}</span>
              <span className="text-rose-400 font-bold">Прогул: {absentCount}</span>
              {excusedCount > 0 && <span className="text-zinc-400">Без штрафа: {excusedCount}</span>}
            </div>
          </div>

          {participantList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
              <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
              <p>На этот ивент никто не регистрировался предварительно.</p>
              <p className="text-[10px] text-zinc-600 mt-1">
                Нажмите «Добавить игрока вручную» выше, чтобы отметить тех, кто играл.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {participantList.map(player => {
                const status = attendanceMap[player.id] || 'attended';
                const currentBalance = player.equivaxes;
                const isInf = player.isInfiniteEquivaxes || player.username === '@MrWhitePio';

                let projectedBalance = currentBalance;
                if (!isInf) {
                  if (status === 'attended') projectedBalance = currentBalance + rewardAmount;
                  else if (status === 'absent') projectedBalance = currentBalance - penaltyAmount;
                }

                return (
                  <div
                    key={player.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      status === 'attended'
                        ? 'bg-emerald-950/20 border-emerald-500/50'
                        : status === 'absent'
                        ? 'bg-rose-950/25 border-rose-500/60'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    {/* Player Info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={player.avatarUrl}
                        alt={player.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-xs text-zinc-100 truncate">
                            {player.displayName}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono-pip truncate">
                            {player.username}
                          </span>
                        </div>

                        {/* Projected Balance with Debt Indicator */}
                        <div className="flex items-center gap-2 text-[10px] font-mono-pip mt-0.5">
                          <span className="text-zinc-400">
                            Баланс: {isInf ? '∞' : `${currentBalance.toLocaleString()} ℰQ`}
                          </span>
                          <span className="text-zinc-600">➔</span>
                          <span
                            className={`font-bold ${
                              isInf
                                ? 'text-amber-400'
                                : projectedBalance < 0
                                ? 'text-rose-400 font-black'
                                : 'text-emerald-300'
                            }`}
                          >
                            {isInf
                              ? '∞'
                              : projectedBalance < 0
                              ? `${projectedBalance.toLocaleString()} ℰQ (ДОЛГ)`
                              : `${projectedBalance.toLocaleString()} ℰQ`}
                          </span>
                          {!isInf && status === 'attended' && (
                            <span className="text-emerald-400 font-bold">(+{rewardAmount})</span>
                          )}
                          {!isInf && status === 'absent' && (
                            <span className="text-rose-400 font-bold">(-{penaltyAmount})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Switchers */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setStatus(player.id, 'attended')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition flex items-center gap-1 ${
                          status === 'attended'
                            ? 'bg-emerald-500 text-black shadow-md ring-1 ring-emerald-300'
                            : 'bg-zinc-800 text-zinc-400 hover:text-emerald-300 border border-zinc-700'
                        }`}
                        title="Присутствовал: получает награду"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Был</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(player.id, 'absent')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition flex items-center gap-1 ${
                          status === 'absent'
                            ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-300'
                            : 'bg-zinc-800 text-zinc-400 hover:text-rose-300 border border-zinc-700'
                        }`}
                        title="Не пришёл: штраф (баланс уходит в минус/долг)"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Прогул</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(player.id, 'excused')}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-mono-pip transition flex items-center gap-1 ${
                          status === 'excused'
                            ? 'bg-zinc-700 text-zinc-200 border border-zinc-500'
                            : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="Уважительная причина: без наград и без штрафа"
                      >
                        <MinusCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Без штрафа</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(player.id)}
                        className="p-1 rounded-lg text-zinc-600 hover:text-red-400 transition"
                        title="Удалить из списка"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Telegram Group Report Option */}
        <label className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
          <input
            type="checkbox"
            checked={sendGroupReport}
            onChange={e => setSendGroupReport(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 bg-zinc-950 border-zinc-700 focus:ring-amber-500 focus:ring-offset-zinc-950"
          />
          <div className="text-xs">
            <span className="font-bold text-zinc-200">
              📢 Опубликовать отчёт с наградами и штрафами в Telegram-группу
            </span>
            <p className="text-[10px] text-zinc-400">
              Бот отправит в @DustTownCollective список присутствовавших и оштрафованных участников.
            </p>
          </div>
        </label>

        {/* Confirm Footer */}
        <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs font-mono-pip text-zinc-400">
            Итог: <strong className="text-emerald-400">+{rewardAmount} ℰQ</strong> ({attendedCount} игроков),{' '}
            <strong className="text-rose-400">-{penaltyAmount} ℰQ</strong> ({absentCount} игроков)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-heading font-bold uppercase transition"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-heading font-black uppercase tracking-wider shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Подтвердить и завершить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
