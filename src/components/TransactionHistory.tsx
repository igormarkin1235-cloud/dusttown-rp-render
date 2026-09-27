import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Search,
  Calendar,
  Sparkles,
  ShoppingBag,
  Package,
  Award,
  Crown,
  AlertTriangle,
  Radio,
  Trash2,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText
} from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  currentEquivaxes: number;
  isInfiniteEquivaxes?: boolean;
  onClearHistory?: () => void;
}

type FilterCategory = 'all' | 'income' | 'expense' | 'events' | 'market' | 'cases';

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions = [],
  currentEquivaxes,
  isInfiniteEquivaxes = false,
  onClearHistory
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Compute summary metrics
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      if (t.amount > 0) {
        totalIncome += t.amount;
      } else {
        totalExpense += Math.abs(t.amount);
      }
    }

    return {
      totalIncome,
      totalExpense,
      netFlow: totalIncome - totalExpense,
      count: transactions.length
    };
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        // Category filter
        if (activeFilter === 'income' && t.amount <= 0) return false;
        if (activeFilter === 'expense' && t.amount >= 0) return false;
        if (activeFilter === 'events' && !(t.type === 'income_event' || t.type === 'income_rp' || t.type === 'expense_penalty')) {
          return false;
        }
        if (
          activeFilter === 'market' &&
          !(
            t.type === 'expense_market' ||
            t.type === 'income_auction' ||
            t.type === 'expense_auction' ||
            t.type === 'income_pawnshop'
          )
        ) {
          return false;
        }
        if (
          activeFilter === 'cases' &&
          !(
            t.type === 'expense_case' ||
            t.type === 'income_lottery' ||
            t.type === 'expense_lottery'
          )
        ) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q) || false;
          if (!matchTitle && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, activeFilter, searchQuery]);

  // Copy statement to clipboard
  const handleCopyStatement = () => {
    if (!transactions.length) return;
    const lines = [
      `=== ВЫПИСКА ПИП-БОЯ: БАЛАНС ЭКВИВАКСОВ (ℰQ) ===`,
      `Текущий баланс: ${isInfiniteEquivaxes ? 'Бесконечно (∞)' : `${currentEquivaxes.toLocaleString()} ℰQ`}`,
      `Всего зачислено: +${stats.totalIncome.toLocaleString()} ℰQ`,
      `Всего списано: -${stats.totalExpense.toLocaleString()} ℰQ`,
      `Всего транзакций: ${stats.count}`,
      `----------------------------------------------`,
      ...transactions.slice(0, 30).map(t => {
        const sign = t.amount > 0 ? '+' : '';
        const date = new Date(t.timestamp).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        return `[${date}] ${sign}${t.amount} ℰQ | ${t.title}${t.description ? ` (${t.description})` : ''}`;
      })
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Helper for icons and colors
  const getTransactionVisuals = (t: Transaction) => {
    switch (t.type) {
      case 'income_event':
        return {
          icon: <Award className="w-4 h-4 text-amber-400" />,
          badgeBg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
          label: 'Ивент'
        };
      case 'income_rp':
        return {
          icon: <Radio className="w-4 h-4 text-cyan-400" />,
          badgeBg: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300',
          label: 'РП-Сессия'
        };
      case 'income_auction':
        return {
          icon: <ArrowDownLeft className="w-4 h-4 text-emerald-400" />,
          badgeBg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
          label: 'Продажа на аукционе'
        };
      case 'income_pawnshop':
        return {
          icon: <Coins className="w-4 h-4 text-emerald-400" />,
          badgeBg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
          label: 'Скупщик Пустошей'
        };
      case 'income_lottery':
        return {
          icon: <Sparkles className="w-4 h-4 text-yellow-400" />,
          badgeBg: 'bg-yellow-950/60 border-yellow-500/40 text-yellow-300',
          label: 'Выигрыш в лотерее'
        };
      case 'income_admin':
        return {
          icon: <Crown className="w-4 h-4 text-purple-400" />,
          badgeBg: 'bg-purple-950/60 border-purple-500/40 text-purple-300',
          label: 'Администрация'
        };
      case 'expense_market':
        return {
          icon: <ShoppingBag className="w-4 h-4 text-sky-400" />,
          badgeBg: 'bg-sky-950/60 border-sky-500/40 text-sky-300',
          label: 'Рынок'
        };
      case 'expense_auction':
        return {
          icon: <ArrowUpRight className="w-4 h-4 text-rose-400" />,
          badgeBg: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
          label: 'Покупка на аукционе'
        };
      case 'expense_case':
        return {
          icon: <Package className="w-4 h-4 text-amber-400" />,
          badgeBg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
          label: 'Открытие кейса'
        };
      case 'expense_lottery':
        return {
          icon: <Coins className="w-4 h-4 text-amber-400" />,
          badgeBg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
          label: 'Лотерейный билет'
        };
      case 'expense_privilege':
        return {
          icon: <Crown className="w-4 h-4 text-fuchsia-400" />,
          badgeBg: 'bg-fuchsia-950/60 border-fuchsia-500/40 text-fuchsia-300',
          label: 'Привилегия / VIP'
        };
      case 'expense_penalty':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          badgeBg: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
          label: 'Штраф / Неявка'
        };
      default:
        return {
          icon: t.amount > 0 ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : <ArrowUpRight className="w-4 h-4 text-rose-400" />,
          badgeBg: t.amount > 0 ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border-rose-500/40 text-rose-300',
          label: t.amount > 0 ? 'Начисление' : 'Расход'
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card: Summary Metrics */}
      <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading uppercase tracking-wide text-amber-400 flex items-center gap-2">
                <span>Бортовой Журнал Транзакций</span>
                <span className="text-[10px] font-mono-pip px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  {transactions.length} записей
                </span>
              </h3>
              <p className="text-xs font-mono-pip text-zinc-400 mt-0.5">
                Полная история финансовых операций сталкера в Эквиваксах (ℰQ).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyStatement}
              disabled={!transactions.length}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono-pip text-zinc-300 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Скопировать выписку транзакций в буфер"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Выписка Пип-боя</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-heading uppercase tracking-wider text-emerald-400/80 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Всего заработано</span>
              </div>
              <div className="text-xl font-bold font-mono-pip text-emerald-400">
                +{stats.totalIncome.toLocaleString()} ℰQ
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-heading uppercase tracking-wider text-rose-400/80 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-rose-400" />
                <span>Всего потрачено</span>
              </div>
              <div className="text-xl font-bold font-mono-pip text-rose-400">
                -{stats.totalExpense.toLocaleString()} ℰQ
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-heading uppercase tracking-wider text-amber-400/80 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>Текущий Баланс</span>
              </div>
              <div className="text-xl font-bold font-mono-pip text-amber-300">
                {isInfiniteEquivaxes ? '∞ ℰQ' : `${currentEquivaxes.toLocaleString()} ℰQ`}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по описанию, ивенту, предмету или аукциону..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono-pip text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-mono-pip"
            >
              Сброс
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono-pip">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeFilter === 'all'
                ? 'bg-amber-500 text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Все ({transactions.length})
          </button>
          <button
            onClick={() => setActiveFilter('income')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              activeFilter === 'income'
                ? 'bg-emerald-500 text-black font-bold shadow'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Начисления (+)</span>
          </button>
          <button
            onClick={() => setActiveFilter('expense')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              activeFilter === 'expense'
                ? 'bg-rose-500 text-black font-bold shadow'
                : 'text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Расходы (-)</span>
          </button>
          <button
            onClick={() => setActiveFilter('events')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeFilter === 'events'
                ? 'bg-cyan-500 text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Ивенты & РП
          </button>
          <button
            onClick={() => setActiveFilter('market')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeFilter === 'market'
                ? 'bg-sky-500 text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Рынок & Торги
          </button>
          <button
            onClick={() => setActiveFilter('cases')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeFilter === 'cases'
                ? 'bg-yellow-500 text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Кейсы & Удача
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-10 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-heading font-bold uppercase text-zinc-300">
              Записей не обнаружено
            </h4>
            <p className="text-xs font-mono-pip text-zinc-500 max-w-md mx-auto">
              {searchQuery
                ? `По запросу «${searchQuery}» ничего не найдено в журнале операций.`
                : 'В выбранной категории пока нет совершённых транзакций. Участвуйте в событиях и вылазках, продавайте лут на аукционе или открывайте кейсы!'}
            </p>
          </div>
        ) : (
          filtered.map(item => {
            const visuals = getTransactionVisuals(item);
            const isPositive = item.amount > 0;

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 hover:border-zinc-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                      isPositive
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
                        : 'bg-rose-950/50 border-rose-500/40 text-rose-400'
                    }`}
                  >
                    {visuals.icon}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-bold text-sm text-zinc-100 truncate group-hover:text-amber-300 transition">
                        {item.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono-pip font-extrabold uppercase px-2 py-0.5 rounded-full border ${visuals.badgeBg}`}
                      >
                        {visuals.label}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs font-mono-pip text-zinc-400 truncate max-w-xl">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] font-mono-pip text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(item.timestamp)}</span>
                      </span>
                      {item.balanceAfter !== undefined && (
                        <span>
                          Остаток:{' '}
                          <strong className="text-zinc-400 font-mono-pip">
                            {item.balanceAfter.toLocaleString()} ℰQ
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount Delta */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-900 shrink-0">
                  <div
                    className={`text-base sm:text-lg font-bold font-mono-pip ${
                      isPositive
                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                        : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? `+${item.amount.toLocaleString()}` : item.amount.toLocaleString()} ℰQ
                  </div>
                  <span className="text-[9px] font-mono-pip text-zinc-500 uppercase">
                    {isPositive ? 'Зачислено' : 'Списано'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
