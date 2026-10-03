let soundEnabled = true;
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  audioContext ||= new AudioContextConstructor();
  return audioContext;
}

export function setButtonSoundsEnabled(enabled: boolean) {
  soundEnabled = enabled;
  try {
    localStorage.setItem('dusttown_button_sounds', String(enabled));
  } catch {
    // Sound preferences are optional when storage is unavailable.
  }
}

export function installGlobalButtonSounds(): () => void {
  const unlockAudio = () => {
    if (!soundEnabled) return;
    const context = getAudioContext();
    if (context?.state === 'suspended') void context.resume().catch(() => undefined);
  };

  const playForButton = (event: MouseEvent) => {
    if (!soundEnabled || !(event.target instanceof Element)) return;
    const button = event.target.closest('button');
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' || button.dataset.sound === 'off') return;

    const context = getAudioContext();
    if (!context) return;
    if (context.state === 'suspended') void context.resume().catch(() => undefined);

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(740, now);
    oscillator.frequency.exponentialRampToValueAtTime(430, now + 0.035);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  };

  document.addEventListener('pointerdown', unlockAudio, { passive: true });
  document.addEventListener('keydown', unlockAudio);
  document.addEventListener('click', playForButton, true);
  return () => {
    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
    document.removeEventListener('click', playForButton, true);
  };
}

export function playNukeSiren() {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;

  const context = audioContext;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(520, now);
  for (let cycle = 0; cycle < 4; cycle += 1) {
    oscillator.frequency.linearRampToValueAtTime(920, now + cycle * 0.8 + 0.4);
    oscillator.frequency.linearRampToValueAtTime(520, now + cycle * 0.8 + 0.8);
  }
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1250, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.045, now + 0.12);
  gain.gain.setValueAtTime(0.045, now + 2.9);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 3.25);
}