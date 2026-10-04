import React, { useState, useEffect } from 'react';

interface RunningPonyProps {
  isRunning: boolean;
  className?: string;
  speedMs?: number;
}

// Multi-frame ASCII art of a galloping / running pony
const RUNNING_FRAMES = [
  // Frame 1
  `  (\\\\___//)
  ( ='.' )   ~*  
  c(")(")-*  *
  //   \\\\  `,

  // Frame 2
  `  (\\\\___//)
  ( ='.' )  ~o 
   / ) ( \\    *
  / /   \\ \\ `,

  // Frame 3
  `  (\\\\___//)
  ( ='.' )   ~. 
  c(") (")   *
   \\\\   //  `,

  // Frame 4
  `  (\\\\___//)
  ( ='.' )  ~* 
   / / \\ \\  .
  c(")  (")  `
];

// High detail ASCII Pony galloping frames
const DETAILED_PONY_FRAMES = [
  `
     ,\\/\"\"\"/\\_
  _\\/  .  .  \\
  (____      /     ..~*
   / /\"\"\"\"\\ \\    *
  /_/      \\_\\
  `,
  `
     ,\\/\"\"\"/\\_
  _\\/  ^  ^  \\
  (____      /    *~o
    \\\\     //    .
    //     \\\\
  `,
  `
     ,\\/\"\"\"/\\_
  _\\/  *  *  \\
  (____      /   .~*
   ( (    ) )   *
   / /    \\ \\
  `,
  `
     ,\\/\"\"\"/\\_
  _\\/  -  -  \\
  (____      /    ~..
   \\ \\    / /   *
   /_/    \\_\\
  `
];

const IDLE_FRAME = `
     ,\\/\"\"\"/\\_
  _\\/  -  -  \\  zzz
  (____      /  Zzz
   ||      ||
  _||______||_
`;

export const RunningPony: React.FC<RunningPonyProps> = ({
  isRunning,
  className = '',
  speedMs = 220
}) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % DETAILED_PONY_FRAMES.length);
    }, speedMs);

    return () => clearInterval(interval);
  }, [isRunning, speedMs]);

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-950/80 border border-emerald-500/30 font-mono select-none overflow-hidden ${className}`}>
      <div className="flex items-center justify-between w-full mb-1 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5 font-bold text-emerald-400">
          <span className="text-sm">🐎</span>
          <span>{isRunning ? 'Пони бежит (Воркер активен)' : 'Пони отдыхает (Спящий режим)'}</span>
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isRunning ? 'bg-emerald-500/20 text-emerald-300 animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
          {isRunning ? 'SPEED: 220ms' : 'PAUSED'}
        </span>
      </div>

      {/* ASCII Art display */}
      <pre className={`text-xs sm:text-sm font-black leading-tight tracking-wider transition-colors duration-200 py-1 ${isRunning ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'text-zinc-600'}`}>
        {isRunning ? DETAILED_PONY_FRAMES[frameIndex] : IDLE_FRAME}
      </pre>

      {/* Dust trail */}
      <div className="w-full text-center text-[10px] font-mono text-zinc-500 tracking-widest mt-1">
        {isRunning ? '· · · ═══════════ [ ДАСТ ТАУН В ЭФИРЕ ] ═══════════ · · ·' : '· · · ═══════════ [ СИСТЕМА ОЖИДАЕТ ] ═══════════ · · ·'}
      </div>
    </div>
  );
};
