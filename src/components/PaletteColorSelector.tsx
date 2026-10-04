import React, { useState } from 'react';
import {
  ALL_TEXT_COLORS,
  ALL_BG_COLORS,
  PaletteColorOption,
  PaletteBgOption,
  isTextColorUnlocked,
  isTextBgUnlocked
} from '../services/palette';
import { Check, Sparkles, Lock, Flame } from 'lucide-react';
import { UserProfile } from '../types';

interface PaletteColorSelectorProps {
  type: 'text' | 'bg';
  selectedValue?: string;
  onSelect: (value: string, label: string) => void;
  sampleText?: string;
  currentUser?: UserProfile;
  onLockedClick?: (itemLabel: string) => void;
}

export const PaletteColorSelector: React.FC<PaletteColorSelectorProps> = ({
  type,
  selectedValue = '',
  onSelect,
  sampleText = 'Даст Таун',
  currentUser,
  onLockedClick
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'standard' | 'shimmer' | 'gradient' | 'special'>('all');

  const items = type === 'text' ? ALL_TEXT_COLORS : ALL_BG_COLORS;
  const filtered = items.filter(i => activeCategory === 'all' || i.category === activeCategory);

  const checkUnlocked = (valOrId: string) => {
    if (!currentUser) return true; // in admin selector or fallback
    return type === 'text' ? isTextColorUnlocked(currentUser, valOrId) : isTextBgUnlocked(currentUser, valOrId);
  };

  const handleClick = (val: string, label: string, unlocked: boolean) => {
    if (!unlocked) {
      if (onLockedClick) {
        onLockedClick(label);
      } else {
        alert(`🔒 «${label}» заблокирован! В начале доступны только 3 базовых стиля. Вы можете купить его в Магазине или выбить из Сундука.`);
      }
      return;
    }
    onSelect(val, label);
  };

  return (
    <div className="space-y-3">
      {/* Category selector pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono-pip">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-2.5 py-1 rounded-xl transition ${
            activeCategory === 'all'
              ? 'bg-amber-500 text-black font-bold shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Все ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('standard')}
          className={`px-2.5 py-1 rounded-xl transition ${
            activeCategory === 'standard'
              ? 'bg-amber-500 text-black font-bold shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Базовые & Стандарт
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('shimmer')}
          className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
            activeCategory === 'shimmer'
              ? 'bg-purple-500 text-white font-bold shadow'
              : 'text-purple-300 hover:text-purple-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Анимированные</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('gradient')}
          className={`px-2.5 py-1 rounded-xl transition ${
            activeCategory === 'gradient'
              ? 'bg-cyan-500 text-black font-bold shadow'
              : 'text-cyan-300 hover:text-cyan-200'
          }`}
        >
          Градиенты
        </button>
        {type === 'text' && (
          <button
            type="button"
            onClick={() => setActiveCategory('special')}
            className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
              activeCategory === 'special'
                ? 'bg-rose-500 text-white font-bold shadow'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Особенные</span>
          </button>
        )}
      </div>

      {/* Grid of options */}
      {type === 'text' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
          {(filtered as PaletteColorOption[]).map(tc => {
            const isSelected = selectedValue === tc.value;
            const unlocked = checkUnlocked(tc.id);
            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => handleClick(tc.value, tc.label, unlocked)}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition group relative ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40 text-amber-200'
                    : unlocked
                    ? 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                    : 'bg-zinc-950/70 border-zinc-900 text-zinc-500 opacity-70 hover:opacity-100 hover:border-zinc-700'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className={`text-sm truncate ${tc.value}`}>
                    {sampleText}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono-pip truncate flex items-center gap-1">
                    <span>{tc.label}</span>
                    {!unlocked && (
                      <span className="text-[9px] text-amber-500 font-semibold flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Заблокировано
                      </span>
                    )}
                  </div>
                </div>
                {isSelected ? (
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                ) : !unlocked ? (
                  <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                ) : (
                  <span className="text-xs shrink-0 opacity-60 group-hover:opacity-100">{tc.icon}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {(filtered as PaletteBgOption[]).map(bg => {
            const isSelected = selectedValue === bg.value;
            const unlocked = checkUnlocked(bg.id);
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => handleClick(bg.value, bg.label, unlocked)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                    : unlocked
                    ? 'border-zinc-800 hover:border-zinc-700'
                    : 'border-zinc-900 opacity-65 hover:opacity-100'
                } ${bg.value}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[11px] font-bold text-zinc-100 line-clamp-2 leading-tight">
                    {bg.label}
                  </span>
                  {!unlocked && (
                    <Lock className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono-pip text-zinc-400">
                  <span>{bg.icon}</span>
                  {isSelected ? (
                    <span className="text-amber-300 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Выбран
                    </span>
                  ) : !unlocked ? (
                    <span className="text-[9px] text-amber-400 font-mono-pip">Магазин/Кейс</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
