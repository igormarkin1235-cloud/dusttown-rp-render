import React, { useState } from 'react';
import { InventoryItem, Rarity } from '../types';
import {
  Sparkles,
  Coins,
  X,
  Zap,
  CheckCircle2,
  Trophy,
  Ticket,
  Percent
} from 'lucide-react';

export interface LotteryOutcome {
  tier: 'major' | 'minor' | 'loss';
  numbers: [number, number, number];
  prizeEquivaxes: number;
  isWinner: boolean;
  ticketSerial: string;
  themeTitle: string;
  tierLabel: string;
}

/**
 * Определяет исход лотерейного билета исходя из фиксированных шансов:
 * - 10% шанс на крупный выигрыш (джекпот билета, высшая комбинация трёх цифр: 777, 888, 999)
 * - 40% шанс на мелкий выигрыш (35% от джекпота, комбинация средних цифр: 222, 333, 444, 555)
 * - 50% шанс на проигрыш (0 ℰQ, числа не совпадают)
 */
export function determineLotteryOutcome(ticketItem: InventoryItem): LotteryOutcome {
  const rand = Math.random(); // Случайное число [0, 1)

  // Базовый максимальный куш билета по редкости или переданным параметрам
  const baseJackpot =
    ticketItem.lotteryData?.prizeEquivaxes && ticketItem.lotteryData.prizeEquivaxes > 0
      ? ticketItem.lotteryData.prizeEquivaxes
      : ticketItem.rarity === 'legendary'
      ? 2500
      : ticketItem.rarity === 'epic'
      ? 777
      : ticketItem.rarity === 'rare'
      ? 350
      : 100;

  const serial =
    ticketItem.lotteryData?.ticketSerial ||
    'DT-' + Math.floor(100000 + Math.random() * 900000);

  const themeTitle = ticketItem.name || 'Лотерейный билет Пустошей';

  if (rand < 0.10) {
    // 10% - Крупный выигрыш (джекпот)
    const topNum =
      ticketItem.rarity === 'legendary'
        ? 9
        : ticketItem.rarity === 'epic'
        ? 7
        : [7, 8, 9][Math.floor(Math.random() * 3)];

    return {
      tier: 'major',
      numbers: [topNum, topNum, topNum],
      prizeEquivaxes: baseJackpot,
      isWinner: true,
      ticketSerial: serial,
      themeTitle,
      tierLabel: 'Крупный выигрыш (10%)'
    };
  } else if (rand < 0.50) {
    // 40% - Мелкий выигрыш (0.10 <= rand < 0.50)
    const minorNum = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
    const minorPrize = Math.max(20, Math.round((baseJackpot * 0.35) / 5) * 5);

    return {
      tier: 'minor',
      numbers: [minorNum, minorNum, minorNum],
      prizeEquivaxes: minorPrize,
      isWinner: true,
      ticketSerial: serial,
      themeTitle,
      tierLabel: 'Мелкий выигрыш (40%)'
    };
  } else {
    // 50% - Проигрыш (rand >= 0.50)
    let numbers: [number, number, number];
    const isNearMiss = Math.random() < 0.5;

    if (isNearMiss) {
      // Интригующее почти совпадение (две одинаковые и одна отличная)
      const matchNum = [3, 7, 9][Math.floor(Math.random() * 3)];
      let diffNum = Math.floor(1 + Math.random() * 9);
      while (diffNum === matchNum) {
        diffNum = Math.floor(1 + Math.random() * 9);
      }
      const pool = [matchNum, matchNum, diffNum];
      pool.sort(() => Math.random() - 0.5);
      numbers = [pool[0], pool[1], pool[2]];
    } else {
      // Три случайных различных числа
      const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      numbers = [digits[0], digits[1], digits[2]];
      // Гарантируем, что числа не все одинаковы
      if (numbers[0] === numbers[1] && numbers[1] === numbers[2]) {
        numbers[2] = (numbers[2] % 9) + 1;
      }
    }

    return {
      tier: 'loss',
      numbers,
      prizeEquivaxes: 0,
      isWinner: false,
      ticketSerial: serial,
      themeTitle,
      tierLabel: 'Без выигрыша (50%)'
    };
  }
}

interface LotteryScratchModalProps {
  ticketItem: InventoryItem;
  onClaimPrize: (ticketId: string, prizeEquivaxes: number) => void;
  onClose: () => void;
}

export const LotteryScratchModal: React.FC<LotteryScratchModalProps> = ({
  ticketItem,
  onClaimPrize,
  onClose
}) => {
  // Определяем исход лотерейного билета по фиксированным шансам при открытии/использовании
  const [outcome] = useState<LotteryOutcome>(() => determineLotteryOutcome(ticketItem));

  const [scratched, setScratched] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [isScratchingAll, setIsScratchingAll] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const allScratched = scratched[0] && scratched[1] && scratched[2];

  // Scratch a single cell
  const handleScratchCell = (index: 0 | 1 | 2) => {
    if (scratched[index]) return;
    setScratched(prev => {
      const next = [...prev] as [boolean, boolean, boolean];
      next[index] = true;
      return next;
    });
  };

  // Fast sequential scratch
  const handleQuickScratchAll = () => {
    if (isScratchingAll || allScratched) return;
    setIsScratchingAll(true);

    setTimeout(() => {
      setScratched(prev => [true, prev[1], prev[2]]);
      setTimeout(() => {
        setScratched(prev => [prev[0], true, prev[2]]);
        setTimeout(() => {
          setScratched([true, true, true]);
          setIsScratchingAll(false);
        }, 300);
      }, 300);
    }, 180);
  };

  const handleClaim = () => {
    if (claimed) return;
    setClaimed(true);
    onClaimPrize(ticketItem.id, outcome.prizeEquivaxes);
  };

  // Color theme according to rarity
  const getThemeStyles = (rarity: Rarity) => {
    switch (rarity) {
      case 'legendary':
        return {
          border: 'border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.4)]',
          badge: 'bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300 text-black',
          glowText: 'text-amber-300 drop-shadow-[0_0_12px_#f59e0b]',
          numColor: 'text-amber-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.9)]',
          cardBg: 'from-amber-950/90 via-zinc-950 to-yellow-950/70',
          foilBg: 'from-amber-500/30 via-yellow-400/20 to-amber-600/30'
        };
      case 'epic':
        return {
          border: 'border-fuchsia-500/80 shadow-[0_0_30px_rgba(217,70,239,0.4)]',
          badge: 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white',
          glowText: 'text-fuchsia-300 drop-shadow-[0_0_12px_#d946ef]',
          numColor: 'text-fuchsia-400 drop-shadow-[0_0_16px_rgba(217,70,239,0.9)]',
          cardBg: 'from-purple-950/90 via-zinc-950 to-fuchsia-950/70',
          foilBg: 'from-fuchsia-500/30 via-purple-400/20 to-pink-600/30'
        };
      case 'rare':
        return {
          border: 'border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.4)]',
          badge: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black',
          glowText: 'text-cyan-300 drop-shadow-[0_0_12px_#06b6d4]',
          numColor: 'text-cyan-400 drop-shadow-[0_0_16px_rgba(6,182,212,0.9)]',
          cardBg: 'from-cyan-950/90 via-zinc-950 to-blue-950/70',
          foilBg: 'from-cyan-500/30 via-blue-400/20 to-teal-600/30'
        };
      default:
        return {
          border: 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
          badge: 'bg-gradient-to-r from-emerald-400 to-lime-500 text-black',
          glowText: 'text-emerald-300 drop-shadow-[0_0_10px_#10b981]',
          numColor: 'text-emerald-400 drop-shadow-[0_0_14px_rgba(16,185,129,0.9)]',
          cardBg: 'from-emerald-950/90 via-zinc-950 to-green-950/70',
          foilBg: 'from-emerald-500/30 via-lime-400/20 to-green-600/30'
        };
    }
  };

  const theme = getThemeStyles(ticketItem.rarity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 sm:p-7 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono-pip font-extrabold uppercase tracking-widest mb-1.5 shadow border border-white/10 bg-zinc-900 text-zinc-300">
            <Ticket className="w-3 h-3 text-amber-400" />
            <span>Лотерея «Даст Таун Колектив»</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black font-heading tracking-wide uppercase text-white">
            {ticketItem.name}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Сотрите защитный слой трёх ячеек, чтобы забрать призовой куш!
          </p>

          {/* Probabilities banner */}
          <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono-pip bg-black/50 border border-white/10 text-zinc-300 shadow-inner">
              <Percent className="w-3 h-3 text-amber-400" />
              <span>
                Шансы: <b className="text-amber-400">10%</b> Крупный куш • <b className="text-emerald-400">40%</b> Мелкий куш • <b className="text-zinc-400">50%</b> Проигрыш
              </span>
            </div>
          </div>
        </div>

        {/* THE TICKET BODY */}
        <div
          className={`relative w-full rounded-3xl border-2 ${theme.border} bg-gradient-to-b ${theme.cardBg} p-5 sm:p-6 overflow-hidden transition-all duration-300 shadow-2xl`}
        >
          {/* Decorative Corner Watermark */}
          <div className="absolute top-2 left-3 text-[9px] font-mono-pip text-zinc-500 uppercase tracking-widest">
            № {outcome.ticketSerial}
          </div>
          <div className="absolute top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono-pip font-black uppercase tracking-wider border border-white/20 backdrop-blur-sm bg-black/40 text-amber-300">
            {ticketItem.rarity.toUpperCase()} TIER
          </div>

          {/* Ticket Header Graphic */}
          <div className="text-center my-3 pb-2 border-b border-white/10">
            <span className="text-xs font-heading font-black tracking-widest text-zinc-300 uppercase">
              ★ СТИРАЕМОЕ ПОЛЕ УДАЧИ ★
            </span>
            <div className="text-[10px] text-zinc-400 font-mono-pip mt-0.5">
              Возможный джекпот:{' '}
              <strong className="text-amber-300">
                {ticketItem.lotteryData?.prizeEquivaxes || (ticketItem.rarity === 'legendary' ? 2500 : ticketItem.rarity === 'epic' ? 777 : ticketItem.rarity === 'rare' ? 350 : 100)} ℰQ
              </strong>
            </div>
          </div>

          {/* 3 SCRATCH CELLS */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 my-5">
            {outcome.numbers.map((num, idx) => {
              const isCellScratched = scratched[idx as 0 | 1 | 2];

              return (
                <div
                  key={idx}
                  onClick={() => handleScratchCell(idx as 0 | 1 | 2)}
                  className={`relative h-28 sm:h-32 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 overflow-hidden ${
                    isCellScratched
                      ? 'bg-zinc-950/90 border-white/20 shadow-inner'
                      : 'border-zinc-700 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 hover:scale-105 hover:border-amber-400/80 shadow-lg'
                  }`}
                >
                  {isCellScratched ? (
                    /* REVEALED NUMBER */
                    <div className="animate-fade-in flex flex-col items-center justify-center px-2 text-center">
                      <span
                        className={`text-4xl sm:text-5xl font-black font-heading transition-all duration-300 ${
                          allScratched
                            ? outcome.isWinner
                              ? `${theme.numColor} animate-bounce scale-110`
                              : 'text-zinc-500 opacity-60'
                            : theme.numColor
                        }`}
                      >
                        {num}
                      </span>
                      <span className="text-[9px] font-mono-pip uppercase mt-1 tracking-wider">
                        {allScratched ? (
                          outcome.isWinner ? (
                            <span className="text-emerald-400 font-black">✓ СОВПАДЕНИЕ</span>
                          ) : (
                            <span className="text-rose-400/80">НЕ СОВПАЛО</span>
                          )
                        ) : (
                          <span className="text-zinc-400">ЯЧЕЙКА #{idx + 1}</span>
                        )}
                      </span>
                    </div>
                  ) : (
                    /* SCRATCHABLE PROTECTIVE FOIL */
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 border-2 border-dashed border-zinc-600">
                      <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow mb-1 opacity-80" />
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-200 leading-tight">
                        ПОТРИТЕ
                      </span>
                      <span className="text-[8px] font-mono-pip text-zinc-400 mt-0.5">
                        Ячейка #{idx + 1}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Fast Scratch Trigger */}
          {!allScratched && (
            <div className="text-center">
              <button
                onClick={handleQuickScratchAll}
                disabled={isScratchingAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 text-amber-300 text-xs font-heading font-bold uppercase tracking-wider transition shadow active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{isScratchingAll ? 'Стираем...' : '⚡ Стереть весь билет сразу'}</span>
              </button>
            </div>
          )}

          {/* ALL SCRATCHED WIN / LOSS BANNER */}
          {allScratched && (
            <div className="animate-fade-in pt-3 border-t border-white/10 text-center space-y-3">
              {outcome.isWinner ? (
                <>
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-heading font-black text-sm uppercase tracking-wider shadow-lg ${
                      outcome.tier === 'major'
                        ? 'bg-amber-500/25 border-2 border-amber-400 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                        : 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {outcome.tier === 'major' ? (
                      <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
                    ) : (
                      <Coins className="w-5 h-5 text-emerald-400 animate-pulse" />
                    )}
                    <span>
                      {outcome.tier === 'major' ? '👑 КРУПНЫЙ ДЖЕКПОТ:' : '🍀 ВЫИГРЫШ:'} +{outcome.prizeEquivaxes} ℰQ!
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300">
                    {outcome.tier === 'major'
                      ? `Невероятная удача! Выпала высшая комбинация трёх цифр [${outcome.numbers.join(' - ')}]!`
                      : `Три совпавших числа [${outcome.numbers.join(' - ')}] принесли вам малый призовой куш!`}
                  </p>

                  <div>
                    <button
                      onClick={handleClaim}
                      disabled={claimed}
                      className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-heading font-black uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-2 ${
                        claimed
                          ? 'bg-emerald-600 text-white cursor-default'
                          : outcome.tier === 'major'
                          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-950/60 active:scale-98 animate-pulse'
                          : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-emerald-950/60 active:scale-98 animate-pulse'
                      }`}
                    >
                      <Coins className="w-4 h-4 text-black" />
                      <span>
                        {claimed
                          ? '✓ Награда зачислена в профиль!'
                          : `Забрать приз (+${outcome.prizeEquivaxes} ℰQ)`}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-zinc-300 font-heading font-black text-xs uppercase tracking-wider shadow">
                    <X className="w-4 h-4 text-rose-400" />
                    <span>БЕЗ ВЫИГРЫША (0 ℰQ)</span>
                  </div>

                  <p className="text-xs text-zinc-400">
                    Числа [{outcome.numbers.join(' - ')}] не совпали. В Пустоши фортуна капризна — повезёт в следующий раз!
                  </p>

                  <div>
                    <button
                      onClick={handleClaim}
                      disabled={claimed}
                      className={`w-full py-2.5 rounded-2xl text-xs sm:text-sm font-heading font-bold uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 ${
                        claimed
                          ? 'bg-zinc-800 text-zinc-500 cursor-default'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-98'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                      <span>
                        {claimed ? '✓ Билет списан' : 'Завершить (списать использованный билет)'}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
