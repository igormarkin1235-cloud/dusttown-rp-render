import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Radio, Search, Send, ShieldAlert, Users, Zap } from 'lucide-react';
import { ChatMessage, NukeBroadcastAlert, UserProfile } from '../types';
import { fetchChatMessages, fetchNukeAlerts, sendChatMessage, sendNukeMessage } from '../services/chat';
import { playNukeSiren } from '../services/uiSound';
import { AvatarWithFrame } from './AvatarWithFrame';

interface ChatViewProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  selectedRecipient: UserProfile | null;
  onRecipientChange: (profile: UserProfile | null) => void;
  onOpenProfile?: (profile: UserProfile) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  profiles,
  selectedRecipient,
  onRecipientChange,
  onOpenProfile
}) => {
  const [mode, setMode] = useState<'public' | 'private'>(selectedRecipient ? 'private' : 'public');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isNukeMode, setIsNukeMode] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const isInfinite = currentUser.isInfiniteEquivaxes || currentUser.username.toLowerCase() === '@mrwhitepio';
  const canAffordNuke = isInfinite || currentUser.equivaxes >= 100;

  useEffect(() => {
    if (selectedRecipient) setMode('private');
  }, [selectedRecipient?.id]);

  useEffect(() => {
    let isMounted = true;
    const loadMessages = async () => {
      if (mode === 'private' && !selectedRecipient) {
        setMessages([]);
        return;
      }
      try {
        const fresh = await fetchChatMessages(mode === 'private' ? selectedRecipient?.id : undefined);
        if (isMounted) {
          setMessages(fresh);
          setError('');
        }
      } catch (loadError: any) {
        if (isMounted) setError(loadError.message || 'Не удалось загрузить сообщения');
      }
    };
    loadMessages();
    const timer = window.setInterval(loadMessages, 2500);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [mode, selectedRecipient?.id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const visibleProfiles = profiles
    .filter(profile => profile.id !== currentUser.id)
    .filter(profile => `${profile.displayName} ${profile.username}`.toLowerCase().includes(search.toLowerCase()))
    .sort((left, right) => left.displayName.localeCompare(right.displayName));

  const submitMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setError('');
    try {
      if (isNukeMode && mode === 'public') {
        await sendNukeMessage(content);
        setIsNukeMode(false);
      } else {
        await sendChatMessage({
          content,
          ...(mode === 'private' && selectedRecipient ? { recipientId: selectedRecipient.id } : {})
        });
      }
      setDraft('');
      setMessages(await fetchChatMessages(mode === 'private' ? selectedRecipient?.id : undefined));
    } catch (sendError: any) {
      setError(sendError.message || 'Не удалось отправить сообщение');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="chat-surface relative min-h-[65dvh] flex flex-col border border-zinc-800 bg-zinc-950/80 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-25 filter blur-[2.5px] scale-105"
        style={{ backgroundImage: `url('/backgrounds/chat_bg.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/85 pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-400" />
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold text-zinc-100">Связь Пустоши</h2>
            <p className="truncate text-xs text-zinc-500">
              {mode === 'public' ? 'Общий канал сталкеров' : selectedRecipient ? `Личная переписка с ${selectedRecipient.displayName}` : 'Выберите собеседника'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-zinc-800 bg-black/40 p-1" role="tablist" aria-label="Режим чата">
          <button
            role="tab"
            aria-selected={mode === 'public'}
            onClick={() => { setMode('public'); onRecipientChange(null); setIsNukeMode(false); }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold ${mode === 'public' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            <Users className="h-3.5 w-3.5" /> Общий
          </button>
          <button
            role="tab"
            aria-selected={mode === 'private'}
            onClick={() => { setMode('private'); setIsNukeMode(false); }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold ${mode === 'private' ? 'bg-cyan-300 text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            <MessageCircle className="h-3.5 w-3.5" /> Личные
          </button>
        </div>
      </header>

        {mode === 'private' && !selectedRecipient ? (
          <div className="flex-1 p-4">
          <label className="mb-3 flex items-center gap-2 border-b border-zinc-800 pb-2 text-zinc-400">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Найти игрока"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />
          </label>
          <div className="divide-y divide-zinc-900">
            {visibleProfiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => onRecipientChange(profile)}
                className="flex w-full items-center gap-3 py-3 text-left hover:bg-zinc-900/70"
              >
                <AvatarWithFrame avatarUrl={profile.avatarUrl} frameId={profile.activeAvatarFrame} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-100">{profile.displayName}</span>
                  <span className="block truncate text-xs text-zinc-500">{profile.username}</span>
                </span>
                <MessageCircle className="h-4 w-4 text-cyan-300" />
              </button>
            ))}
            {visibleProfiles.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Игроки не найдены</p>}
          </div>
        </div>
        ) : (
          <>
          {mode === 'private' && selectedRecipient && (
            <div className="flex items-center gap-2 border-b border-zinc-900 px-4 py-2">
              <button onClick={() => onRecipientChange(null)} className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5" /> Другой игрок
              </button>
                <span className="ml-auto text-[11px] text-zinc-500">Переписка видна только вам двоим</span>
              </div>
            )}

            <div className="chat-message-list min-h-64 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
            {messages.map(message => {
              const sender = profiles.find(profile => profile.id === message.senderId);
              const isMine = message.senderId === currentUser.id;
              const isNuke = message.type === 'nuke';
              return (
                <article key={message.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                  {sender ? (
                    <button onClick={() => onOpenProfile?.(sender)} aria-label={`Открыть профиль ${message.senderDisplayName}`} className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                      <AvatarWithFrame avatarUrl={message.senderAvatarUrl || sender.avatarUrl} frameId={message.senderFrameId} size="sm" />
                    </button>
                  ) : <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-800" />}
                  <div className={`max-w-[84%] min-w-0 ${isMine ? 'text-right' : ''}`}>
                    <div className={`mb-1 flex items-baseline gap-2 text-[10px] text-zinc-500 ${isMine ? 'justify-end' : ''}`}>
                      <button onClick={() => sender && onOpenProfile?.(sender)} className="truncate font-semibold text-zinc-300 hover:text-white">
                        {message.senderDisplayName}
                      </button>
                      <time dateTime={message.timestamp}>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                    <div
                      className={`chat-message-bubble inline-block max-w-full break-words rounded-xl border px-3 py-2 text-left text-sm ${!isNuke ? message.style?.profileTextBg || '' : ''} ${!isNuke ? message.style?.profileTextColor || '' : ''} ${
                        isNuke
                          ? 'chat-nuke-message border-emerald-300/70 font-bold text-emerald-50'
                          : isMine
                          ? 'border-emerald-700/50 bg-emerald-950/40'
                          : 'border-zinc-700 bg-zinc-900'
                      }`}
                      style={!isNuke && message.style?.customBgUrl ? {
                        backgroundImage: `linear-gradient(rgba(0,0,0,.48), rgba(0,0,0,.6)), url("${message.style.customBgUrl.replaceAll('"', '')}")`,
                        backgroundPosition: message.style.customBgPosition || 'center',
                        backgroundSize: 'cover'
                      } : undefined}
                    >
                      {isNuke && <span className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-emerald-200"><ShieldAlert className="h-3.5 w-3.5" /> Ядерное сообщение</span>}
                      {message.content}
                    </div>
                  </div>
                </article>
              );
            })}
            {messages.length === 0 && !error && (
              <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 text-center text-zinc-600">
                <Radio className="h-7 w-7 text-zinc-700" />
                <p className="text-sm">Пока тихо. Начните разговор.</p>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          <form onSubmit={submitMessage} className="border-t border-zinc-800 bg-black/30 p-3 sm:p-4">
            {isNukeMode && mode === 'public' && (
              <div className="mb-2 flex items-center justify-between gap-3 border-l-2 border-emerald-400 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-100">
                <span>Глобальный сигнал · 100 ℰQ{!canAffordNuke && ' · недостаточно средств'}</span>
                <button type="button" onClick={() => setIsNukeMode(false)} className="text-emerald-300 hover:text-white">Отмена</button>
              </div>
            )}
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value.slice(0, isNukeMode ? 400 : 800))}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={isNukeMode ? 400 : 800}
              placeholder={isNukeMode ? 'Текст глобального сигнала...' : 'Сообщение...'}
              rows={2}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-700"
              disabled={isSending}
            />
            {error && <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-600">Enter — отправить · Shift+Enter — новая строка</span>
              <div className="flex items-center gap-2">
                {mode === 'public' && (
                  <button
                    type="button"
                    onClick={() => setIsNukeMode(value => !value)}
                    aria-pressed={isNukeMode}
                    disabled={!canAffordNuke && !isNukeMode}
                    title="Глобальное сообщение за 100 ℰQ"
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40 ${isNukeMode ? 'border-emerald-300 bg-emerald-400 text-black' : 'border-emerald-800 text-emerald-300 hover:bg-emerald-950'}`}
                  >
                    <Zap className="h-3.5 w-3.5" /> Ядерка · 100 ℰQ
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!draft.trim() || isSending || (isNukeMode && !canAffordNuke)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" /> {isSending ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
};

export const NukeBroadcastOverlay: React.FC = () => {
  const [alerts, setAlerts] = useState<NukeBroadcastAlert[]>([]);
  const seenAlertIdsRef = useRef(new Set<string>());

  useEffect(() => {
    let isMounted = true;
    const pollAlerts = async () => {
      try {
        const fresh = await fetchNukeAlerts();
        if (isMounted) {
          for (const alert of fresh) {
            if (!seenAlertIdsRef.current.has(alert.id)) {
              seenAlertIdsRef.current.add(alert.id);
              playNukeSiren();
            }
          }
          setAlerts(fresh);
        }
      } catch {
        if (isMounted) setAlerts([]);
      }
    };
    pollAlerts();
    const timer = window.setInterval(pollAlerts, 1500);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!alerts.length) return null;
  return (
    <>
      <div className="nuke-screen-frame" aria-hidden="true">
        <span className="nuke-orbit-light nuke-orbit-top" />
        <span className="nuke-orbit-light nuke-orbit-right" />
        <span className="nuke-orbit-light nuke-orbit-bottom" />
        <span className="nuke-orbit-light nuke-orbit-left" />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 p-4" aria-live="assertive">
        {alerts.map(alert => (
          <div key={alert.id} className="chat-nuke-overlay w-full max-w-2xl border border-emerald-200/80 px-5 py-5 text-center shadow-[0_0_60px_rgba(16,185,129,.55)] sm:px-10 sm:py-8">
            <p className="mb-2 flex items-center justify-center gap-2 text-xs font-black uppercase text-emerald-200"><ShieldAlert className="h-4 w-4" /> Глобальный сигнал Пустоши</p>
            <p className="chat-nuke-title break-words text-2xl font-black sm:text-4xl">{alert.message}</p>
            <p className="mt-3 text-xs text-emerald-100/80">{alert.senderDisplayName} · {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        ))}
      </div>
    </>
  );
};