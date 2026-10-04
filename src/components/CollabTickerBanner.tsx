import React, { useState, useEffect } from 'react';
import { RPEvent } from '../types';
import { Handshake, Sparkles, ChevronRight, ChevronLeft, ArrowUpRight } from 'lucide-react';

interface CollabTickerBannerProps {
  collabs: RPEvent[];
  onSelectCollab: (collab: RPEvent) => void;
}

export const CollabTickerBanner: React.FC<CollabTickerBannerProps> = ({
  collabs,
  onSelectCollab
}) => {
  const activeCollabs = collabs.filter(c => c.type === 'collab' && !c.isCompleted);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cycle through multiple collabs every 8 seconds if there are several
  useEffect(() => {
    if (activeCollabs.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeCollabs.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [activeCollabs.length]);

  if (activeCollabs.length === 0) return null;

  const current = activeCollabs[currentIndex] || activeCollabs[0];

  return (
    <div className="w-full bg-gradient-to-r from-amber-950 via-zinc-950 to-amber-950 border-b border-amber-500/50 shadow-md relative z-20 overflow-hidden select-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-3 py-1.5 gap-2">
        {/* Fixed Left Tag */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-mono-pip font-extrabold uppercase tracking-wider flex items-center gap-1 shadow">
            <Handshake className="w-3 h-3 text-black" />
            <span className="hidden sm:inline">СОБЫТИЕ-КОЛЛАБОРАЦИЯ</span>
            <span className="sm:hidden">СОБЫТИЕ</span>
          </span>
          {activeCollabs.length > 1 && (
            <span className="text-[9px] font-mono-pip text-zinc-400">
              ({currentIndex + 1}/{activeCollabs.length})
            </span>
          )}
        </div>

        {/* Running Marquee Text / Clickable Area */}
        <button
          onClick={() => onSelectCollab(current)}
          className="flex-1 overflow-hidden relative text-left group flex items-center"
          title="Нажмите, чтобы открыть подробности события"
        >
          <div className="ticker-wrap w-full flex items-center whitespace-nowrap">
            <div className="ticker-move flex items-center gap-4 text-xs font-mono-pip">
              <span
                className={`font-heading font-black tracking-wide ${
                  current.hasRainbowText
                    ? 'rainbow-text'
                    : 'text-amber-300 group-hover:text-amber-200'
                }`}
              >
                ★ {current.title} ★
              </span>

              {current.collabClanName && (
                <span className="text-zinc-300 flex items-center gap-1 font-bold">
                  🤝 Клан: <span className="text-amber-400">{current.collabClanName}</span>
                </span>
              )}

              <span className="text-zinc-400">
                • Локация: <strong className="text-zinc-200">{current.location}</strong>
              </span>

              <span className="text-amber-400 font-bold">
                • Награда: +{current.rewardEquivaxes} ℰQ
              </span>

              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/60 text-zinc-300 border border-amber-500/40 group-hover:border-amber-400 flex items-center gap-1">
                Нажмите для описания <ArrowUpRight className="w-3 h-3 text-amber-400" />
              </span>
            </div>
          </div>
        </button>

        {/* Carousel controls if more than 1 */}
        {activeCollabs.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() =>
                setCurrentIndex(
                  prev => (prev - 1 + activeCollabs.length) % activeCollabs.length
                )
              }
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() =>
                setCurrentIndex(prev => (prev + 1) % activeCollabs.length)
              }
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .ticker-wrap {
          overflow: hidden;
        }
        .ticker-move {
          display: inline-flex;
          animation: ticker-slide 24s linear infinite;
        }
        .ticker-wrap:hover .ticker-move {
          animation-play-state: paused;
        }
        @keyframes ticker-slide {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
};
