import React, { useState, useEffect, useRef } from 'react';
import {
  ChatMessage,
  ChatMessageStyle,
  UserProfile,
  NukeBroadcastAlert
} from '../types';
import {
  Send,
  Radio,
  MessageSquare,
  Sparkles,
  Flame,
  Zap,
  Eye,
  Search,
  User,
  Shield,
  Volume2,
  AlertTriangle,
  Palette,
  Check,
  Clock,
  Trash2,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { AvatarWithFrame } from './AvatarWithFrame';

interface ChatInterfaceProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  messages: ChatMessage[];
  onSendMessage: (payload: {
    content: string;
    recipientId?: string;
    recipientUsername?: string;
    recipientDisplayName?: string;
    style?: ChatMessageStyle;
  }) => Promise<boolean>;
  onSendNuke: (content: string) => Promise<{ success: boolean; error?: string }>;
  onViewProfile?: (user: UserProfile) => void;
  initialDirectRecipientId?: string | null;
  onClearInitialRecipient?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUser,
  profiles,
  messages,
  onSendMessage,
  onSendNuke,
  onViewProfile,
  initialDirectRecipientId,
  onClearInitialRecipient
}) => {
  const myUserId = currentUser.id || '';

  // Navigation mode: 'general' (public wasteland radio) or 'direct' (private DMs)
  const [chatMode, setChatMode] = useState<'general' | 'direct'>(
    initialDirectRecipientId ? 'direct' : 'general'
  );

  // Direct recipient selection
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(
    initialDirectRecipientId || null
  );
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);

  // Message input state
  const [inputContent, setInputContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Nuclear Strike Modal
  const [showNukeModal, setShowNukeModal] = useState(false);
  const [nukeMessage, setNukeMessage] = useState('');
  const [isNukeLoading, setIsNukeLoading] = useState(false);
  const [nukeError, setNukeError] = useState<string | null>(null);

  // Message styling state
  const [useProfileStyle, setUseProfileStyle] = useState(true);
  const [customEffect, setCustomEffect] = useState<'none' | 'embers' | 'radiation' | 'glitch' | 'dust' | 'cyber' | 'vignette'>('none');
  const [showStylePicker, setShowStylePicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMode, selectedRecipientId]);

  // Handle prop updates for direct messaging from external buttons (e.g. PlayerProfileModal)
  useEffect(() => {
    if (initialDirectRecipientId) {
      setChatMode('direct');
      setSelectedRecipientId(initialDirectRecipientId);
      if (onClearInitialRecipient) onClearInitialRecipient();
    }
  }, [initialDirectRecipientId, onClearInitialRecipient]);

  // Determine current active style
  const activeStyle: ChatMessageStyle = useProfileStyle
    ? {
        customBgUrl: currentUser.customBgUrl,
        customBgEffect: currentUser.customBgEffect || 'none',
        customBgPosition: currentUser.customBgPosition || 'center'
      }
    : {
        customBgEffect: customEffect
      };

  // Filter messages based on active mode
  const currentMessages = messages.filter(m => {
    if (chatMode === 'general') {
      return !m.recipientId;
    } else {
      if (!selectedRecipientId) return false;
      return (
        (m.recipientId === selectedRecipientId && m.senderId === myUserId) ||
        (m.recipientId === myUserId && m.senderId === selectedRecipientId)
      );
    }
  });

  // Calculate unique DM chat participants for sidebar
  const directConversations = React.useMemo(() => {
    const participantIds = new Set<string>();
    messages.forEach(m => {
      if (m.recipientId) {
        if (m.senderId === myUserId) participantIds.add(m.recipientId);
        if (m.recipientId === myUserId) participantIds.add(m.senderId);
      }
    });
    return Array.from(participantIds);
  }, [messages, myUserId]);

  const selectedRecipient = profiles.find(p => p.id === selectedRecipientId);

  // Send standard text message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || isSubmitting) return;

    if (chatMode === 'direct' && !selectedRecipientId) {
      setErrorMessage('Выберите собеседника для личного сообщения');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const ok = await onSendMessage({
        content: inputContent.trim(),
        recipientId: chatMode === 'direct' ? selectedRecipientId || undefined : undefined,
        recipientUsername: chatMode === 'direct' ? selectedRecipient?.username : undefined,
        recipientDisplayName: chatMode === 'direct' ? selectedRecipient?.displayName : undefined,
        style: activeStyle
      });

      if (ok) {
        setInputContent('');
      } else {
        setErrorMessage('Не удалось доставить сообщение');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка отправки');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Launch Nuclear Strike
  const handleConfirmNuke = async () => {
    if (!nukeMessage.trim() || isNukeLoading) return;
    if ((currentUser.equivaxes || 0) < 100) {
      setNukeError('Недостаточно Эквиваксов! Требуется 100 ℰQ.');
      return;
    }

    setNukeError(null);
    setIsNukeLoading(true);

    try {
      const res = await onSendNuke(nukeMessage.trim());
      if (res.success) {
        setShowNukeModal(false);
        setNukeMessage('');
      } else {
        setNukeError(res.error || 'Ошибка запуска ядерного удара');
      }
    } catch (err: any) {
      setNukeError(err.message || 'Ошибка соединения');
    } finally {
      setIsNukeLoading(false);
    }
  };

  // Quick style options
  const effectOptions: Array<{ id: ChatMessageStyle['customBgEffect']; label: string; icon: string }> = [
    { id: 'none', label: 'Обычный', icon: '⚪' },
    { id: 'radiation', label: 'Радиация', icon: '☢️' },
    { id: 'embers', label: 'Искры', icon: '🔥' },
    { id: 'glitch', label: 'Глитч', icon: '⚡' },
    { id: 'cyber', label: 'Кибер', icon: '💻' },
    { id: 'dust', label: 'Буря Пустоши', icon: '🌪️' },
    { id: 'vignette', label: 'Виньетка', icon: '🌌' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-w-5xl mx-auto rounded-3xl bg-zinc-950/90 border border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Top Header & Channel Switcher */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-900/60 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-2xl bg-zinc-950 border border-zinc-800">
            <button
              onClick={() => setChatMode('general')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold font-heading transition-all ${
                chatMode === 'general'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Радио Даст Таун</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
            </button>

            <button
              onClick={() => setChatMode('direct')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold font-heading transition-all ${
                chatMode === 'direct'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Личные сообщения (ЛС)</span>
              {directConversations.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300">
                  {directConversations.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Nuclear Strike Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNukeModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-lime-500 via-emerald-500 to-green-600 text-black font-black font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(74,222,128,0.5)] hover:scale-105 active:scale-95 transition-all border border-lime-300"
            title="Сбросить ядерку на терминалы всех жителей за 100 ℰQ!"
          >
            <span className="text-base animate-bounce">☢️</span>
            <span>СКИ HYTЬ ЯДЕРКУ</span>
            <span className="px-1.5 py-0.5 rounded bg-black/25 text-[10px] font-mono font-bold">
              100 ℰQ
            </span>
          </button>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Direct Messages Contact Sidebar (When in 'direct' mode) */}
        {chatMode === 'direct' && (
          <div className="w-64 border-r border-zinc-800/80 bg-zinc-950/70 flex flex-col shrink-0">
            <div className="p-3 border-b border-zinc-800/80">
              <button
                onClick={() => setShowRecipientSelector(!showRecipientSelector)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Написать новому игроку</span>
              </button>
            </div>

            {/* Recipient Picker Dropdown */}
            {showRecipientSelector && (
              <div className="p-3 border-b border-zinc-800 bg-zinc-900/90 space-y-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Поиск по никнейму..."
                  value={recipientSearchQuery}
                  onChange={e => setRecipientSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {profiles
                    .filter(
                      p =>
                        p.id !== myUserId &&
                        (p.username.toLowerCase().includes(recipientSearchQuery.toLowerCase()) ||
                          p.displayName.toLowerCase().includes(recipientSearchQuery.toLowerCase()))
                    )
                    .map(p => {
                      const pId = p.id || '';
                      return (
                        <button
                          key={pId}
                          onClick={() => {
                            setSelectedRecipientId(pId);
                            setShowRecipientSelector(false);
                            setRecipientSearchQuery('');
                          }}
                          className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-800 text-left text-xs transition"
                        >
                          <AvatarWithFrame
                            avatarUrl={p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            frameId={p.activeAvatarFrame}
                            size="sm"
                          />
                          <div className="truncate min-w-0">
                            <div className="text-white font-bold truncate">{p.displayName}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">{p.username}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Active Dialogues List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {directConversations.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500 font-mono px-3">
                  У вас пока нет открытых диалогов. Нажмите «Написать новому игроку» или найдите профиль в городе!
                </div>
              ) : (
                directConversations.map(userId => {
                  const user = profiles.find(p => p.id === userId);
                  const isSelected = selectedRecipientId === userId;
                  const lastMsg = [...messages]
                    .reverse()
                    .find(
                      m =>
                        (m.senderId === userId && m.recipientId === myUserId) ||
                        (m.senderId === myUserId && m.recipientId === userId)
                    );

                  return (
                    <button
                      key={userId}
                      onClick={() => setSelectedRecipientId(userId)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-white'
                          : 'hover:bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <AvatarWithFrame
                        avatarUrl={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        frameId={user?.activeAvatarFrame}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{user?.displayName || 'Игрок'}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {lastMsg ? lastMsg.content : 'Диалог открыт'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Message Feed Container */}
        <div className="flex-1 flex flex-col h-full bg-zinc-950/60 overflow-hidden">
          {/* Direct Chat Active Header */}
          {chatMode === 'direct' && (
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              {selectedRecipient ? (
                <div className="flex items-center gap-3">
                  <AvatarWithFrame
                    avatarUrl={selectedRecipient.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    frameId={selectedRecipient.activeAvatarFrame}
                    size="sm"
                  />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{selectedRecipient.displayName}</span>
                      <span className="text-xs font-mono text-emerald-400 font-normal">
                        {selectedRecipient.username}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Личный зашифрованный канал связи
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 font-mono">
                  Выберите контакт из списка слева для начала общения
                </div>
              )}

              {selectedRecipient && onViewProfile && (
                <button
                  onClick={() => onViewProfile(selectedRecipient)}
                  className="px-3 py-1 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Профиль</span>
                </button>
              )}
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                  <Radio className="w-7 h-7 text-amber-500/70" />
                </div>
                <h3 className="text-base font-bold text-zinc-300 font-heading">
                  {chatMode === 'general' ? 'Эфир свободен' : 'Здесь пока нет сообщений'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm">
                  {chatMode === 'general'
                    ? 'Станьте первым, кто подаст сигнал в общую радиоволну Даст Таун! Сообщения оформляются в стиле вашего профиля.'
                    : 'Напишите первое сообщение вашему собеседнику.'}
                </p>
              </div>
            ) : (
              currentMessages.map(msg => {
                const isMe = msg.senderId === myUserId;
                const isNukeMsg = msg.isNuke;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Author Avatar with frame */}
                    <div
                      className="cursor-pointer shrink-0 hover:scale-105 transition"
                      onClick={() => {
                        const author = profiles.find(p => p.id === msg.senderId);
                        if (author && onViewProfile) onViewProfile(author);
                      }}
                      title="Открыть профиль игрока"
                    >
                      <AvatarWithFrame
                        avatarUrl={msg.senderAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        frameId={msg.senderFrameId}
                        size="md"
                        className={isNukeMsg ? 'ring-2 ring-lime-400 shadow-[0_0_15px_rgba(74,222,128,0.7)]' : ''}
                      />
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[78%] rounded-3xl p-4 transition-all relative overflow-hidden ${
                        isNukeMsg
                          ? 'bg-gradient-to-br from-lime-950 via-zinc-950 to-emerald-950 border-2 border-lime-400 shadow-[0_0_30px_rgba(74,222,128,0.4)]'
                          : msg.style?.customBgEffect === 'radiation'
                          ? 'bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-green-950/70 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : msg.style?.customBgEffect === 'embers'
                          ? 'bg-gradient-to-br from-orange-950/80 via-zinc-900 to-red-950/70 border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                          : msg.style?.customBgEffect === 'cyber'
                          ? 'bg-gradient-to-br from-cyan-950/80 via-zinc-900 to-blue-950/70 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : isMe
                          ? 'bg-gradient-to-br from-amber-950/50 via-zinc-900 to-zinc-900 border border-amber-500/40 text-zinc-100'
                          : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200'
                      }`}
                      style={{
                        backgroundImage: msg.style?.customBgUrl ? `url(${msg.style.customBgUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: msg.style?.customBgPosition || 'center'
                      }}
                    >
                      {/* Ambient background blur overlay if customBgUrl is present */}
                      {msg.style?.customBgUrl && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-none" />
                      )}

                      {/* Header in bubble */}
                      <div className="relative flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => {
                              const author = profiles.find(p => p.id === msg.senderId);
                              if (author && onViewProfile) onViewProfile(author);
                            }}
                            className={`text-xs font-bold cursor-pointer hover:underline ${
                              isNukeMsg
                                ? 'text-lime-300 font-mono uppercase font-black'
                                : 'text-amber-400'
                            }`}
                          >
                            {msg.senderDisplayName}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {msg.senderUsername}
                          </span>
                          {isNukeMsg && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-lime-500 text-black shadow-[0_0_8px_#84cc16]">
                              ☢️ ЯДЕРНЫЙ УДАР
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="relative">
                        {isNukeMsg ? (
                          <p className="text-sm sm:text-base font-black font-mono leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-200 to-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.9)] animate-pulse break-words">
                            «{msg.content}»
                          </p>
                        ) : (
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words text-zinc-100">
                            {msg.content}
                          </p>
                        )}
                      </div>

                      {/* Quick action to open DM if clicking on someone else's message in general */}
                      {!isMe && chatMode === 'general' && (
                        <div className="relative mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-end">
                          <button
                            onClick={() => {
                              setChatMode('direct');
                              setSelectedRecipientId(msg.senderId);
                            }}
                            className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Написать в ЛС</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Style Customizer Bar */}
          <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                Стиль сообщений:
              </span>
              <button
                type="button"
                onClick={() => setUseProfileStyle(!useProfileStyle)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                  useProfileStyle
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {useProfileStyle ? <Check className="w-3 h-3" /> : null}
                <span>Как в профиле</span>
              </button>

              {!useProfileStyle && (
                <button
                  type="button"
                  onClick={() => setShowStylePicker(!showStylePicker)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] flex items-center gap-1.5 border border-zinc-700"
                >
                  <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                  <span>Эффект: {effectOptions.find(e => e.id === customEffect)?.label}</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-zinc-400 font-mono">
              Баланс: <span className="font-bold text-amber-400">{currentUser.equivaxes || 0} ℰQ</span>
            </div>
          </div>

          {/* Style Picker Dropdown */}
          {showStylePicker && !useProfileStyle && (
            <div className="p-3 bg-zinc-900 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
              {effectOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setCustomEffect(opt.id || 'none');
                    setShowStylePicker(false);
                  }}
                  className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-2 transition ${
                    customEffect === opt.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Box Bar */}
          <form onSubmit={handleSend} className="p-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center gap-2">
            <input
              type="text"
              value={inputContent}
              onChange={e => setInputContent(e.target.value)}
              placeholder={
                chatMode === 'general'
                  ? 'Сообщение в радиоволну Даст Таун...'
                  : selectedRecipient
                  ? `Личное сообщение для ${selectedRecipient.displayName}...`
                  : 'Выберите собеседника...'
              }
              disabled={isSubmitting || (chatMode === 'direct' && !selectedRecipientId)}
              className="flex-1 px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all font-sans"
            />

            <button
              type="submit"
              disabled={!inputContent.trim() || isSubmitting || (chatMode === 'direct' && !selectedRecipientId)}
              className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {errorMessage && (
            <div className="px-4 py-1.5 bg-red-950/60 border-t border-red-500/40 text-red-400 text-xs font-mono text-center">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* NUCLEAR STRIKE LAUNCH MODAL */}
      {showNukeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border-2 border-lime-400 p-6 shadow-[0_0_50px_rgba(74,222,128,0.4)] overflow-hidden space-y-4">
            {/* Ambient radiation glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-lime-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-500/20 border border-lime-400 flex items-center justify-center text-lime-400 text-2xl shadow-[0_0_15px_#84cc16]">
                  ☢️
                </div>
                <div>
                  <h3 className="text-lg font-black font-mono text-lime-300 uppercase tracking-wide">
                    Запуск Ядерного Удара
                  </h3>
                  <p className="text-xs font-mono text-zinc-400">
                    Глобальная трансляция поверх всех окон
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNukeModal(false)}
                className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Warning Banner */}
            <div className="p-3.5 rounded-2xl bg-lime-950/40 border border-lime-500/40 space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-lime-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-lime-400" />
                <span>ВНИМАНИЕ: ЭКСТРЕННОЕ ОПОВЕЩЕНИЕ</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Ваше сообщение появится у всех игроков Пустоши с переливающимся неоновым текстом и сигналом ядерной сирены, независимо от того, в какой вкладке они находятся!
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400 border-t border-lime-500/20">
                <span>Стоимость сброса:</span>
                <span className="font-bold text-lime-300 font-mono text-sm">100 ℰQ</span>
              </div>
            </div>

            {/* Input Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 flex items-center justify-between">
                <span>Текст ядерного сообщения:</span>
                <span className="text-[11px] text-zinc-500">{nukeMessage.length}/150</span>
              </label>
              <textarea
                value={nukeMessage}
                onChange={e => setNukeMessage(e.target.value.slice(0, 150))}
                rows={3}
                placeholder="Пример: ВНИМАНИЕ ВСЕМ СТАЛКЕРАМ! СЕГОДНЯ В 20:00 В БУНКЕРЕ СРЭ ОБЩИЙ СБОР!"
                className="w-full p-3 rounded-2xl bg-black border border-lime-500/60 text-sm text-lime-200 placeholder-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 font-mono"
              />
            </div>

            {nukeError && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-mono text-center">
                {nukeError}
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNukeModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-mono font-bold transition"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmNuke}
                disabled={!nukeMessage.trim() || isNukeLoading || (currentUser.equivaxes || 0) < 100}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime-500 via-emerald-500 to-green-600 text-black font-black font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(74,222,128,0.5)] hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isNukeLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>☢️ ЗАПУСТИТЬ УДАР (100 ℰQ)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
