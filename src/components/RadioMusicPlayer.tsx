import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  ListMusic,
  Tv,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Send,
  X
} from 'lucide-react';

export interface RadioTrack {
  id: string; // YouTube video ID
  url: string;
  title: string;
  author: string;
}

interface RadioMusicPlayerProps {
  username?: string;
}

interface AssistantMessage {
  role: 'user' | 'assistant';
  text: string;
}

const DEFAULT_TRACKS: RadioTrack[] = [
  {
    id: 'd741JHtavVs',
    url: 'https://youtu.be/d741JHtavVs?si=UlYaBs4jawWkvHeF',
    title: 'Wasteland Wailers - Step Around (feat. Brittany Church as Velvet Remedy)',
    author: 'OvermareStudios'
  },
  {
    id: '8pqX8kAbZZ4',
    url: 'https://youtu.be/8pqX8kAbZZ4?si=zPE6TQXevfkSaxih',
    title: 'Danny Farrant & Paul Rawson - In The Pines',
    author: 'Mir Galad'
  },
  {
    id: 'z0NfI2NeDHI',
    url: 'https://youtu.be/z0NfI2NeDHI?si=9RPidKSORgABF1Do',
    title: 'Rammstein - Radio (Official Video)',
    author: 'Rammstein Official'
  },
  {
    id: 'jFZmgsnXal4',
    url: 'https://youtu.be/jFZmgsnXal4?si=al_cpHxAHxlEtYDn',
    title: 'Fallout 4 Soundtrack - The Five Stars - Atom Bomb Baby',
    author: 'FalloutMusicChannel'
  },
  {
    id: 'n_axmYF2q1E',
    url: 'https://youtu.be/n_axmYF2q1E?si=9VRgKjJ4ETYeBoNA',
    title: 'Fallout - I Don\'t Want To Set The World On Fire (Tribute)',
    author: 'Onnuj_'
  },
  {
    id: 'GXLsnmwlYlY',
    url: 'https://youtu.be/GXLsnmwlYlY?si=WIImU9F3plR-BAMe',
    title: 'Even Blurry Videos - Скованные одной цепью (English cover)',
    author: 'Even Blurry Videos'
  }
];

export const RadioMusicPlayer: React.FC<RadioMusicPlayerProps> = ({ username = 'сталкер' }) => {
  const [tracks, setTracks] = useState<RadioTrack[]>(DEFAULT_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Autoplay on app start
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Retractable on the left
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [assistantDraft, setAssistantDraft] = useState('');
  const [isAssistantSending, setIsAssistantSending] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    try {
      return localStorage.getItem('dusttown_littlepip_voice') !== 'false';
    } catch {
      return true;
    }
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const assistantEndRef = useRef<HTMLDivElement>(null);
  const voiceEnabledRef = useRef(isVoiceEnabled);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceObjectUrlRef = useRef<string | null>(null);
  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  useEffect(() => {
    assistantEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [assistantMessages, isAssistantOpen]);

  useEffect(() => () => {
    voiceAudioRef.current?.pause();
    if (voiceObjectUrlRef.current) URL.revokeObjectURL(voiceObjectUrlRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  // 1. Fetch fresh official titles via YouTube oEmbed API
  useEffect(() => {
    let isMounted = true;
    const fetchTitles = async () => {
      const updated = await Promise.all(
        DEFAULT_TRACKS.map(async track => {
          try {
            const res = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${track.id}&format=json`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.title) {
                return {
                  ...track,
                  title: data.title,
                  author: data.author_name || track.author
                };
              }
            }
          } catch (_) {}
          return track;
        })
      );
      if (isMounted) {
        setTracks(updated);
      }
    };

    fetchTitles();
    return () => {
      isMounted = false;
    };
  }, []);

  // PostMessage helper for YouTube IFrame without mutating React DOM
  const sendYtCommand = useCallback((func: string, args: any = '') => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      }
    } catch (_) {}
  }, []);

  const handleNext = useCallback(() => {
    setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const handlePrev = useCallback(() => {
    setCurrentTrackIndex(prev => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      sendYtCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      sendYtCommand('playVideo');
      setIsPlaying(true);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sendYtCommand(nextMuted ? 'mute' : 'unMute');
  };

  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setShowPlaylist(false);
  };

  const stopLittlepipVoice = () => {
    voiceAudioRef.current?.pause();
    voiceAudioRef.current = null;
    if (voiceObjectUrlRef.current) {
      URL.revokeObjectURL(voiceObjectUrlRef.current);
      voiceObjectUrlRef.current = null;
    }
    window.speechSynthesis?.cancel();
  };

  const speakWithBrowserVoice = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const russianVoices = synth.getVoices().filter(voice => voice.lang.toLowerCase().startsWith('ru'));
    utterance.voice = russianVoices.find(voice => /female|жен|milena|alena|irina/i.test(voice.name)) || russianVoices[0] || null;
    utterance.lang = 'ru-RU';
    utterance.pitch = 1.22;
    utterance.rate = 1.02;
    utterance.volume = 0.95;
    synth.speak(utterance);
  };

  const speakLittlepipReply = async (text: string) => {
    if (!voiceEnabledRef.current) return;
    stopLittlepipVoice();

    try {
      const response = await fetch('/api/littlepip/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!response.ok) throw new Error('Neural voice unavailable');

      const audioUrl = URL.createObjectURL(await response.blob());
      if (!voiceEnabledRef.current) {
        URL.revokeObjectURL(audioUrl);
        return;
      }

      voiceObjectUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      voiceAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        voiceObjectUrlRef.current = null;
        voiceAudioRef.current = null;
      };
      await audio.play();
    } catch {
      stopLittlepipVoice();
      if (voiceEnabledRef.current) speakWithBrowserVoice(text);
    }
  };

  const handleToggleVoice = () => {
    const enabled = !isVoiceEnabled;
    voiceEnabledRef.current = enabled;
    setIsVoiceEnabled(enabled);
    try {
      localStorage.setItem('dusttown_littlepip_voice', String(enabled));
    } catch {}
    if (!enabled) stopLittlepipVoice();
  };

  const handleSendAssistantMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = assistantDraft.trim();
    if (!text || isAssistantSending) return;

    const previousMessages = assistantMessages.slice(-10);
    setAssistantMessages(previous => [...previous, { role: 'user', text }].slice(-20));
    setAssistantDraft('');
    setIsAssistantSending(true);

    try {
      const response = await fetch('/api/littlepip/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, username, mode: 'chat', history: previousMessages })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Пипка сейчас не может ответить.');

      setAssistantMessages(previous => [
        ...previous,
        { role: 'assistant', text: data.reply || 'Я тут, но эфир что-то проглотил мой ответ.' }
      ].slice(-20));
      void speakLittlepipReply(data.reply || 'Я тут, но эфир что-то проглотил мой ответ.');

      if (data.track?.id && data.track?.title) {
        const track: RadioTrack = {
          id: String(data.track.id),
          url: String(data.track.url || `https://www.youtube.com/watch?v=${data.track.id}`),
          title: String(data.track.title),
          author: String(data.track.author || 'YouTube')
        };
        const existingIndex = tracks.findIndex(item => item.id === track.id);
        if (existingIndex >= 0) {
          const updatedTracks = [...tracks];
          updatedTracks[existingIndex] = track;
          setTracks(updatedTracks);
          setCurrentTrackIndex(existingIndex);
        } else {
          setTracks(previous => [...previous, track]);
          setCurrentTrackIndex(tracks.length);
        }
        setIsPlaying(true);
        setShowVideo(true);
      }
    } catch (error: any) {
      setAssistantMessages(previous => [
        ...previous,
        { role: 'assistant', text: error?.message || 'Связь с радио прервалась. Попробуй ещё раз.' }
      ].slice(-20));
    } finally {
      setIsAssistantSending(false);
    }
  };

  // Listen to postMessage from YouTube for state updates
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      try {
        if (typeof e.data === 'string') {
          const data = JSON.parse(e.data);
          if (data.event === 'infoDelivery' && data.info) {
            if (data.info.playerState === 1) setIsPlaying(true);
            if (data.info.playerState === 2) setIsPlaying(false);
            if (data.info.playerState === 0) handleNext();
          }
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [handleNext]);

  // Autoplay fallback for strict mobile/safari interaction
  useEffect(() => {
    const unlock = () => {
      sendYtCommand('playVideo');
      setIsPlaying(true);
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [sendYtCommand]);

  const isTitleLong = currentTrack.title.length > 20;

  return (
    /* Left-Hand Side Standalone Floating HUD Player */
    <aside
      className={`fixed top-20 left-2 z-40 transition-all duration-300 ease-out flex items-start select-none ${
        isExpanded ? 'translate-x-0' : '-translate-x-[calc(100%-14px)]'
      }`}
      aria-label="Музыкальный плеер Радио Даст Таун"
    >
      {/* Player Main Body */}
      <div className={`bg-zinc-950/95 border border-amber-500/50 rounded-2xl rounded-tl-none p-2 shadow-2xl backdrop-blur-xl flex flex-col gap-1.5 ${isAssistantOpen ? 'w-[min(19rem,calc(100vw-3rem))]' : 'w-48'} border-l-2 border-l-amber-500 ring-1 ring-black/80 text-zinc-200`}>
        {/* Radio Header & Equalizer */}
        <div className="px-1 py-0.5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-[10px] font-mono-pip font-extrabold uppercase text-amber-400 tracking-wider">
              РАДИО 98.7 • ДАСТ ТАУН
            </span>
          </div>

          {/* Animated Equalizer Bars */}
          <div className="flex items-end gap-0.5 h-3.5">
            {isPlaying ? (
              <>
                <div className="w-0.5 bg-emerald-400 rounded-full animate-eq-bar-1" />
                <div className="w-0.5 bg-emerald-400 rounded-full animate-eq-bar-2" />
                <div className="w-0.5 bg-amber-400 rounded-full animate-eq-bar-3" />
                <div className="w-0.5 bg-emerald-400 rounded-full animate-eq-bar-4" />
                <div className="w-0.5 bg-amber-400 rounded-full animate-eq-bar-5" />
              </>
            ) : (
              <>
                <div className="w-0.5 h-1 bg-zinc-600 rounded-full" />
                <div className="w-0.5 h-1.5 bg-zinc-600 rounded-full" />
                <div className="w-0.5 h-1 bg-zinc-600 rounded-full" />
                <div className="w-0.5 h-2 bg-zinc-600 rounded-full" />
                <div className="w-0.5 h-1 bg-zinc-600 rounded-full" />
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-1.5">
          <span className="relative w-9 h-9 rounded-full shrink-0 overflow-hidden border border-emerald-400/70 bg-zinc-900 flex items-center justify-center text-[10px] font-mono-pip font-bold text-emerald-300">
            <span aria-hidden="true">LP</span>
            <img
              src="/avatars/littlepip.gif"
              alt="Литлпип"
              className="absolute inset-0 w-full h-full object-contain"
              onError={event => { event.currentTarget.style.display = 'none'; }}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-heading font-bold text-emerald-300 truncate">Литлпип</div>
            <div className="text-[8px] font-mono-pip text-zinc-500 truncate">НА СВЯЗИ • РАДИО 98.7</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`w-8 h-8 grid place-items-center rounded-lg border transition-colors ${isVoiceEnabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-zinc-700 bg-zinc-900 text-zinc-500'}`}
              title={isVoiceEnabled ? 'Выключить голос Пипки' : 'Включить голос Пипки'}
              aria-label={isVoiceEnabled ? 'Выключить голос Пипки' : 'Включить голос Пипки'}
              aria-pressed={isVoiceEnabled}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsAssistantOpen(open => !open)}
              className={`w-8 h-8 grid place-items-center rounded-lg border transition-colors ${isAssistantOpen ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300' : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-emerald-300'}`}
              title={isAssistantOpen ? 'Закрыть чат с Литлпип' : 'Открыть чат с Литлпип'}
              aria-label={isAssistantOpen ? 'Закрыть чат с Литлпип' : 'Открыть чат с Литлпип'}
              aria-expanded={isAssistantOpen}
            >
              {isAssistantOpen ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isAssistantOpen && (
          <section className="rounded-lg border border-emerald-500/25 bg-black/70 p-2 space-y-2" aria-label="Чат с Литлпип">
            <div className="max-h-44 min-h-20 overflow-y-auto space-y-2 pr-1 scrollbar-thin" role="log" aria-live="polite">
              {assistantMessages.length === 0 && (
                <p className="text-[10px] leading-relaxed text-zinc-400">
                  Привет, {username}! Я тут. Спрашивай про Даст Таун или попроси найти песню.
                </p>
              )}
              {assistantMessages.map((message, index) => (
                <div
                  key={`${index}-${message.role}`}
                  className={`max-w-[92%] rounded-lg px-2 py-1.5 text-[10px] leading-relaxed whitespace-pre-wrap break-words ${
                    message.role === 'user'
                      ? 'ml-auto bg-amber-500/15 border border-amber-500/25 text-amber-100'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {isAssistantSending && (
                <div className="text-[9px] font-mono-pip text-emerald-400 animate-pulse">ПИПКА ОТВЕЧАЕТ...</div>
              )}
              <div ref={assistantEndRef} />
            </div>
            <form onSubmit={handleSendAssistantMessage} className="flex items-center gap-1.5">
              <input
                value={assistantDraft}
                onChange={event => setAssistantDraft(event.target.value)}
                placeholder="Скажи Пипке..."
                aria-label="Сообщение для Литлпип"
                maxLength={1000}
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-[11px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/70"
              />
              <button
                type="submit"
                disabled={isAssistantSending || !assistantDraft.trim()}
                className="w-9 h-9 grid place-items-center rounded-lg bg-emerald-600 text-zinc-950 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Отправить сообщение"
                aria-label="Отправить сообщение"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </section>
        )}

        {/* Pip-Buck CRT Video Screen (Pure React Iframe, never mutating React DOM) */}
        <div
          className={`relative w-full rounded-lg overflow-hidden border transition-all duration-200 bg-black ${
            showVideo
              ? 'aspect-video border-amber-500/40 shadow-inner'
              : 'h-1 border-transparent opacity-5 overflow-hidden pointer-events-none'
          }`}
        >
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${currentTrack.id}?autoplay=1&enablejsapi=1&playsinline=1&controls=1&modestbranding=1&rel=0`}
            title={currentTrack.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Marquee Ticker Track Title (Бегущая строка) */}
        <div className="relative w-full overflow-hidden bg-black/70 rounded-lg px-2 py-1 border border-zinc-800/80">
          <div className="text-[10px] font-mono-pip text-amber-300 font-bold whitespace-nowrap overflow-hidden">
            {isTitleLong ? (
              <div className="animate-marquee-smooth flex items-center">
                <span>{currentTrack.title}</span>
                <span className="mx-3 text-zinc-500">•</span>
                <span>{currentTrack.title}</span>
                <span className="mx-3 text-zinc-500">•</span>
              </div>
            ) : (
              <div className="truncate text-center">{currentTrack.title}</div>
            )}
          </div>
          <div className="text-[8px] font-mono-pip text-zinc-500 truncate text-center leading-none mt-0.5">
            {currentTrack.author}
          </div>
        </div>

        {/* Tactile Playback Controls Bar */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800/80 active:scale-90 transition-all"
            title="Предыдущий трек"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center font-bold text-xs shadow-md transition-all active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30'
                : 'bg-zinc-850 hover:bg-zinc-800 text-amber-400 border border-amber-500/40 hover:border-amber-400'
            }`}
            title={isPlaying ? 'Поставить на паузу' : 'Воспроизвести'}
          >
            {isPlaying ? (
              <div className="flex items-center gap-1.5">
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="text-[10px] font-mono-pip uppercase tracking-wider">ПАУЗА</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span className="text-[10px] font-mono-pip uppercase tracking-wider">ИГРАТЬ</span>
              </div>
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800/80 active:scale-90 transition-all"
            title="Следующий трек"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Secondary Controls (Mute, Video toggle, Playlist) */}
        <div className="flex items-center justify-between px-1 pt-0.5 border-t border-zinc-900 text-zinc-400 text-[10px] font-mono-pip">
          <button
            onClick={handleToggleMute}
            className={`p-1 rounded hover:text-amber-400 transition-colors flex items-center gap-1 ${
              isMuted ? 'text-red-400' : 'text-zinc-400'
            }`}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            <span>{isMuted ? 'МУТ' : 'ЗВУК'}</span>
          </button>

          <button
            onClick={() => setShowVideo(!showVideo)}
            className={`p-1 rounded hover:text-amber-400 transition-colors flex items-center gap-1 ${
              showVideo ? 'text-amber-400' : 'text-zinc-500'
            }`}
            title={showVideo ? 'Скрыть экран' : 'Показать экран'}
          >
            <Tv className="w-3 h-3" />
            <span>{showVideo ? 'ЭКРАН' : 'МИНИ'}</span>
          </button>

          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`p-1 rounded hover:text-amber-400 transition-colors flex items-center gap-1 ${
              showPlaylist ? 'text-amber-400' : 'text-zinc-400'
            }`}
            title="Список треков (6)"
          >
            <ListMusic className="w-3 h-3" />
            <span className="font-bold">
              {currentTrackIndex + 1}/{tracks.length}
            </span>
          </button>
        </div>

        {/* Interactive Playlist Dropdown */}
        {showPlaylist && (
          <div className="mt-1 p-1 bg-black/95 border border-amber-500/30 rounded-xl space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 animate-fade-in text-[9px] font-mono-pip">
            <div className="px-1.5 py-0.5 text-amber-400/80 font-bold uppercase flex items-center justify-between border-b border-zinc-900">
              <span>Плейлист (6)</span>
              <button
                onClick={() => setShowPlaylist(false)}
                className="text-zinc-400 hover:text-white"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {tracks.map((t, idx) => {
              const isCurrent = idx === currentTrackIndex;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTrack(idx)}
                  className={`w-full text-left px-1.5 py-1 rounded flex items-center justify-between gap-1 transition-colors ${
                    isCurrent
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="truncate">
                    {idx + 1}. {t.title}
                  </span>
                  {isCurrent && isPlaying && (
                    <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Retractable Toggle Handle on the RIGHT of the left-side player */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-6 h-16 rounded-r-xl bg-zinc-950/95 border-r border-y border-amber-500/50 hover:bg-zinc-900 flex flex-col items-center justify-center text-amber-400 shadow-2xl backdrop-blur-md transition-all active:scale-95 group mt-4 shrink-0"
        title={isExpanded ? 'Свернуть плеер влево' : 'Развернуть плеер'}
      >
        <ChevronLeft
          className={`w-4 h-4 transition-transform duration-200 ${
            isExpanded ? '' : 'rotate-180 text-amber-300 animate-pulse'
          }`}
        />
      </button>
    </aside>
  );
};
