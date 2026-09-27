import React, { useState } from 'react';
import {
  ALL_TEXT_COLORS,
  ALL_BG_COLORS,
  PaletteColorOption,
  PaletteBgOption
} from '../services/palette';
import { Check, Sparkles } from 'lucide-react';

interface PaletteColorSelectorProps {
  type: 'text' | 'bg';
  selectedValue?: string;
  onSelect: (value: string, label: string) => void;
  sampleText?: string;
}

export const PaletteColorSelector: React.FC<PaletteColorSelectorProps> = ({
  type,
  selectedValue = '',
  onSelect,
  sampleText = 'Даст Таун'
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'standard' | 'shimmer' | 'gradient'>('all');

  const items = type === 'text' ? ALL_TEXT_COLORS : ALL_BG_COLORS;
  const filtered = items.filter(i => activeCategory === 'all' || i.category === activeCategory);

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
          Все (20)
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
          10 Стандартных
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
          <span>5 Переливающихся</span>
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
          5 Градиентов
        </button>
      </div>

      {/* Grid of options */}
      {type === 'text' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
          {(filtered as PaletteColorOption[]).map(tc => {
            const isSelected = selectedValue === tc.value;
            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => onSelect(tc.value, tc.label)}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition group ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40 text-amber-200'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className={`text-sm truncate ${tc.value}`}>
                    {sampleText}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono-pip truncate">
                    {tc.label}
                  </div>
                </div>
                {isSelected ? (
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <span className="text-xs shrink-0 opacity-60 group-hover:opacity-100">{tc.icon}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {(filtered as PaletteBgOption[]).map(bg => {
            const isSelected = selectedValue === bg.value;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => onSelect(bg.value, bg.label)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                    : 'border-zinc-800 hover:border-zinc-700'
                } ${bg.value}`}
              >
                <span className="text-[11px] font-bold text-zinc-100 line-clamp-2 leading-tight">
                  {bg.label}
                </span>
                <div className="flex items-center justify-between text-[10px] font-mono-pip text-zinc-400">
                  <span>{bg.icon}</span>
                  {isSelected && (
                    <span className="text-amber-300 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Выбран
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
