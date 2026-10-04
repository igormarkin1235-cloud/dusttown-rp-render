import React, { useEffect, useState, useRef } from 'react';
import { NukeBroadcastAlert } from '../types';
import { Volume2, VolumeX, X, AlertTriangle, ShieldAlert, Radio } from 'lucide-react';
import { AvatarWithFrame } from './AvatarWithFrame';

interface NuclearAlertOverlayProps {
  alert: NukeBroadcastAlert | null;
  onDismiss: () => void;
}

export const NuclearAlertOverlay: React.FC<NuclearAlertOverlayProps> = ({ alert, onDismiss }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play sci-fi siren sweep using Web Audio API
  useEffect(() => {
    if (!alert) return;

    if (soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;

          // Oscillator 1 - siren sweep
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          const now = ctx.currentTime;

          // Siren pitch oscillation
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
          osc.frequency.exponentialRampToValueAtTime(440, now + 1.0);
          osc.frequency.exponentialRampToValueAtTime(780, now + 1.6);
          osc.frequency.exponentialRampToValueAtTime(300, now + 2.4);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 2.5);
        }
      } catch (e) {
        // audio autoplay policy or disabled
      }
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
    };
  }, [alert, soundEnabled]);

  // Timer countdown
  useEffect(() => {
    if (!alert) return;
    const calculateTime = () => {
      const remainingMs = Math.max(0, alert.expiresAt - Date.now());
      const seconds = Math.ceil(remainingMs / 1000);
      setTimeLeft(seconds);
      if (remainingMs <= 0) {
        onDismiss();
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 500);
    return () => clearInterval(interval);
  }, [alert, onDismiss]);

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      {/* Radioactive Emergency Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-lime-500/25 via-emerald-600/30 to-green-500/20 rounded-full blur-[110px] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
        {/* Flashing Hazard Stripes */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_15px,#000_15px,#000_30px)] shadow-[0_0_20px_#eab308]" />
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_15px,#000_15px,#000_30px)] shadow-[0_0_20px_#eab308]" />
      </div>

      {/* Main Strike Card */}
      <div className="relative w-full max-w-xl bg-zinc-950/95 border-2 border-lime-400 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(74,222,128,0.5),inset_0_0_35px_rgba(34,197,94,0.2)] overflow-hidden">
        {/* Scanlines Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-40" />

        {/* Top Header Banner */}
        <div className="relative flex items-center justify-between pb-4 border-b border-lime-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-500/20 border border-lime-400/60 flex items-center justify-center text-lime-400 shadow-[0_0_15px_rgba(74,222,128,0.7)] animate-bounce">
              <span className="text-2xl">☢️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] uppercase font-black tracking-widest bg-lime-500 text-black rounded-full font-mono shadow-[0_0_10px_#84cc16]">
                  CRITICAL BROADCAST
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs text-red-400 font-mono font-bold tracking-wider animate-pulse">
                  ТРЕВОГА 5-Й СТЕПЕНИ
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide text-lime-300 font-mono uppercase mt-0.5">
                СИРЕНА МЕГАЗАКЛИНАНИЙ: ВЫБРОС!
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Отключить звук тревоги' : 'Включить звук тревоги'}
              className="p-2 rounded-xl bg-zinc-900 border border-lime-500/40 text-lime-400 hover:bg-zinc-800 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>
            <button
              onClick={onDismiss}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sender Info Bar */}
        <div className="relative my-4 flex items-center gap-3 bg-lime-950/40 border border-lime-500/30 rounded-2xl p-3">
          <AvatarWithFrame
            avatarUrl={alert.senderAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            frameId={alert.senderFrameId}
            size="md"
            className="ring-2 ring-lime-400/80 shadow-[0_0_15px_rgba(74,222,128,0.5)]"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-lime-400/80 font-mono tracking-wider uppercase flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-lime-400 animate-spin" />
              Инициатор ядерного удара:
            </div>
            <div className="text-base font-bold text-white truncate flex items-center gap-2">
              <span>{alert.senderDisplayName}</span>
              <span className="text-xs font-mono text-lime-400 font-normal">{alert.senderUsername}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-lime-500/20 text-lime-300 border border-lime-500/40 rounded-lg shadow-[0_0_10px_rgba(74,222,128,0.3)]">
              -100 ℰQ
            </span>
          </div>
        </div>

        {/* Radiation Pulsing Message Box with Shimmering Neon Green Text */}
        <div className="relative my-4 p-5 rounded-2xl bg-gradient-to-b from-zinc-900 via-black to-zinc-900 border-2 border-lime-400/80 shadow-[inset_0_0_20px_rgba(34,197,94,0.3)] overflow-hidden">
          {/* Animated Neon Light Glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-lime-500/30 rounded-full blur-2xl animate-pulse pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/30 rounded-full blur-2xl animate-pulse pointer-events-none" />

          {/* Shimmering Neon Green Radiant Text */}
          <p className="relative text-lg sm:text-2xl font-black text-center leading-relaxed tracking-wide font-mono text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-200 to-green-400 drop-shadow-[0_0_18px_rgba(74,222,128,0.95)] animate-pulse break-words">
            «{alert.message}»
          </p>
        </div>

        {/* Countdown & Dismiss Button */}
        <div className="relative pt-2 space-y-3">
          {/* Progress bar */}
          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-lime-500/30">
            <div
              className="h-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all duration-500 shadow-[0_0_10px_#84cc16]"
              style={{ width: `${Math.min(100, Math.max(0, (timeLeft / 20) * 100))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-lime-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              Трансляция во все терминалы Пустоши
            </span>
            <span className="font-bold text-lime-300">
              {timeLeft} сек.
            </span>
          </div>

          <button
            onClick={onDismiss}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-lime-500 via-emerald-500 to-lime-600 text-black font-black font-mono tracking-wider uppercase text-sm shadow-[0_0_25px_rgba(74,222,128,0.6)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>☢️</span>
            <span>УКРЫТЬСЯ В БУНКЕРЕ [ЗАКРЫТЬ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
