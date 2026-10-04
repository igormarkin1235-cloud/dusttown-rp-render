import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Shield,
  VolumeX,
  Volume2,
  Ban,
  Terminal,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Bot,
  ExternalLink,
  BookOpen,
  Users,
  Search,
  MessageSquare,
  Sparkles,
  Key,
  Layers,
  ChevronRight
} from 'lucide-react';

interface MuteRecord {
  id: string;
  targetUser: string;
  targetDisplayName?: string;
  adminUser: string;
  reason: string;
  durationMinutes: number;
  mutedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
}

interface BanRecord {
  id: string;
  targetUser: string;
  adminUser: string;
  reason: string;
  bannedAt: string;
  status: 'active' | 'revoked';
}

interface BotBlockRecord {
  id: string;
  targetUser: string;
  adminUser: string;
  reason: string;
  blockedAt: string;
  status: 'active' | 'revoked';
}

interface AdminBlackjackPanelProps {
  currentUserAdminTag?: string;
}

export const AdminBlackjackPanel: React.FC<AdminBlackjackPanelProps> = ({
  currentUserAdminTag = '@MrWhitePio'
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'blacklist' | 'topics' | 'synergy' | 'wiki'>('terminal');
  const [promptText, setPromptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Array<{
    id: string;
    sender: 'admin' | 'blackjack';
    text: string;
    actionTaken?: string;
    timestamp: string;
  }>>([
    {
      id: 'init',
      sender: 'blackjack',
      text: '🚬 **Блэкджек на дежурстве.** Дробовик заряжен, наручники начищены. Пиши мне напрямую на русском языке: замутить дебошира, показать черный список или снять ограничения. Без причины амнистии не даю!',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Blacklist Data
  const [mutes, setMutes] = useState<MuteRecord[]>([]);
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [botBlocks, setBotBlocks] = useState<BotBlockRecord[]>([]);
  const [blacklistSubTab, setBlacklistSubTab] = useState<'mutes' | 'bans' | 'botblocks'>('mutes');

  // Manual Form States
  const [manualUser, setManualUser] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualDuration, setManualDuration] = useState(10);
  const [unmuteReasonPrompt, setUnmuteReasonPrompt] = useState<{ target: string; type: 'mute' | 'ban' | 'block' } | null>(null);
  const [unmuteReasonInput, setUnmuteReasonInput] = useState('');

  // Config States
  const [botToken, setBotToken] = useState('8818102467:AAGCBUGpBf2_pTwBhogsG-5Wt3mujzlgNjE');
  const [allowedTopics, setAllowedTopics] = useState('general, main, moderation');
  const [readOnlyTopics, setReadOnlyTopics] = useState('news, announcements');
  const [forbiddenTopics, setForbiddenTopics] = useState('private_staff, archive');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Fetch status & blacklist
  const refreshData = async () => {
    try {
      const res = await fetch('/api/blackjack/blacklist');
      if (res.ok) {
        const data = await res.json();
        setMutes(data.activeMutes || []);
        setBans(data.activeBans || []);
        setBotBlocks(data.activeBotBlocks || []);
      }
      const stRes = await fetch('/api/blackjack/status');
      if (stRes.ok) {
        const stData = await stRes.json();
        if (stData.config?.telegramBotToken) {
          setBotToken(stData.config.telegramBotToken);
        }
        if (Array.isArray(stData.config?.allowedTopicIds)) {
          setAllowedTopics(stData.config.allowedTopicIds.join(', '));
        }
        if (Array.isArray(stData.config?.readOnlyTopicIds)) {
          setReadOnlyTopics(stData.config.readOnlyTopicIds.join(', '));
        }
        if (Array.isArray(stData.config?.forbiddenTopicIds)) {
          setForbiddenTopics(stData.config.forbiddenTopicIds.join(', '));
        }
      }
    } catch (e) {
      // offline
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Send Command to Blackjack
  const handleSendCommand = async (customPrompt?: string) => {
    const textToSend = (customPrompt || promptText).trim();
    if (!textToSend || isProcessing) return;

    const newLogItem = {
      id: `usr_${Date.now()}`,
      sender: 'admin' as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatLog(prev => [...prev, newLogItem]);
    if (!customPrompt) setPromptText('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/blackjack/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          username: currentUserAdminTag
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatLog(prev => [
          ...prev,
          {
            id: `bj_${Date.now()}`,
            sender: 'blackjack',
            text: data.replyText,
            actionTaken: data.actionTaken,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        await refreshData();
      } else {
        throw new Error('Ошибка связи с сервером');
      }
    } catch (err: any) {
      setChatLog(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'blackjack',
          text: `⚠️ Ошибка: ${err?.message || 'Не удалось обработать команду'}.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Action: Manual Unmute with required reason
  const handleConfirmUnmute = async () => {
    if (!unmuteReasonPrompt) return;
    if (!unmuteReasonInput.trim()) {
      alert('Блэкджек требует указать причину амнистии!');
      return;
    }

    const { target, type } = unmuteReasonPrompt;
    try {
      let endpoint = '/api/blackjack/unmute';
      if (type === 'ban') endpoint = '/api/blackjack/unban';
      if (type === 'block') endpoint = '/api/blackjack/bot-unblock';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUser: target,
          adminUser: currentUserAdminTag,
          reason: unmuteReasonInput.trim()
        })
      });

      if (res.ok) {
        setChatLog(prev => [
          ...prev,
          {
            id: `un_${Date.now()}`,
            sender: 'blackjack',
            text: `🔓 Сняла ${type === 'mute' ? 'мут' : type === 'ban' ? 'бан' : 'блокировку в боте'} с ${target}. Причина: ${unmuteReasonInput.trim()}`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        setUnmuteReasonPrompt(null);
        setUnmuteReasonInput('');
        await refreshData();
      }
    } catch (e) {
      alert('Ошибка при снятии ограничений');
    }
  };

  // Save Config
  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/blackjack/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramBotToken: botToken.trim(),
          allowedTopicIds: allowedTopics.split(',').map(s => s.trim()).filter(Boolean),
          readOnlyTopicIds: readOnlyTopics.split(',').map(s => s.trim()).filter(Boolean),
          forbiddenTopicIds: forbiddenTopics.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        setSaveSuccessNotice('Настройки топиков и прав Блэкджек сохранены!');
        setTimeout(() => setSaveSuccessNotice(null), 4000);
      }
    } catch {
      alert('Ошибка сохранения');
    }
  };

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/80 via-zinc-900 to-amber-950/50 border-b border-zinc-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 p-0.5 shadow-lg shadow-red-950/50">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-xl text-white tracking-wide">
                  БЛЭКДЖЕК (Blackjack)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono-pip font-bold">
                  PROJECT HORIZONS · АДМИН ИИ
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono-pip mt-0.5">
                Офицер безопасности Стойла 99 / Боевой помощник шерифов и модератор
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-pip">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-400">Токен:</span>
              <span className="text-zinc-200 truncate max-w-[110px]" title={botToken}>
                {botToken ? `${botToken.substring(0, 8)}...` : 'Не задан'}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 flex items-center gap-1.5 font-bold">
              <VolumeX className="w-3.5 h-3.5" />
              <span>Мутов: {mutes.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-5 overflow-x-auto pb-1 text-xs font-mono-pip">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition font-bold ${
              activeTab === 'terminal'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>ИИ-Терминал команд</span>
          </button>

          <button
            onClick={() => setActiveTab('blacklist')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition font-bold ${
              activeTab === 'blacklist'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Чёрный список ({mutes.length + bans.length + botBlocks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('topics')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition font-bold ${
              activeTab === 'topics'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Топики & Права Telegram</span>
          </button>

          <button
            onClick={() => setActiveTab('synergy')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition font-bold ${
              activeTab === 'synergy'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Связка с Пипкой (Анти-луп)</span>
          </button>

          <button
            onClick={() => setActiveTab('wiki')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition font-bold ${
              activeTab === 'wiki'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Лор из Fandom Wiki</span>
          </button>
        </div>
      </div>

      {/* Main Body Content */}
      <div className="p-4 sm:p-6">
        {/* TAB 1: INTERACTIVE NATURAL LANGUAGE AI TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="space-y-4">
            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-2 text-xs font-mono-pip">
              <span className="text-zinc-500 self-center">Быстрые команды:</span>
              <button
                onClick={() => handleSendCommand('Блэкджек, покажи черный список')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
              >
                📋 Черный список
              </button>
              <button
                onClick={() => handleSendCommand('Блэкджек, какие у тебя команды модерации?')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
              >
                ❓ Помощь
              </button>
              <button
                onClick={() => handleSendCommand('Блэкджек, чето @MrWhitePio, слишком дохуя умный, выдай ему мут на минут так 10')}
                className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 transition"
              >
                🔇 Пример команды пользователя: мут на 10 мин
              </button>
            </div>

            {/* Chat Log Window */}
            <div className="h-80 sm:h-96 overflow-y-auto bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3 font-mono-pip text-xs">
              {chatLog.map(item => (
                <div
                  key={item.id}
                  className={`flex flex-col ${
                    item.sender === 'admin' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-1">
                    <span className="font-bold text-zinc-400">
                      {item.sender === 'admin' ? `Шериф (${currentUserAdminTag})` : 'Офицер Блэкджек'}
                    </span>
                    <span>•</span>
                    <span>{item.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-md leading-relaxed whitespace-pre-wrap ${
                      item.sender === 'admin'
                        ? 'bg-red-950/80 text-red-100 border border-red-500/30 rounded-tr-none'
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-700/80 rounded-tl-none'
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono-pip animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                  <span>Блэкджек взводит курок и оформляет протокол...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendCommand();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  placeholder="Блэкджек, замуть @пользователь на 10 минут за провокации..."
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs font-mono-pip text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !promptText.trim()}
                className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-mono-pip font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-red-950/50"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Отправить</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: BLACKLIST (MUTES, BANS, BOT BLOCKS) */}
        {activeTab === 'blacklist' && (
          <div className="space-y-4 font-mono-pip">
            {/* Sub-tabs */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setBlacklistSubTab('mutes')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  blacklistSubTab === 'mutes'
                    ? 'bg-red-950/80 border-red-500 text-red-200 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                🔇 Муты ({mutes.length})
              </button>
              <button
                onClick={() => setBlacklistSubTab('bans')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  blacklistSubTab === 'bans'
                    ? 'bg-red-950/80 border-red-500 text-red-200 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                ⛔ Баны ({bans.length})
              </button>
              <button
                onClick={() => setBlacklistSubTab('botblocks')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  blacklistSubTab === 'botblocks'
                    ? 'bg-red-950/80 border-red-500 text-red-200 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                🤖 Блокировки в боте ({botBlocks.length})
              </button>
            </div>

            {/* Sub-tab 1: Mutes */}
            {blacklistSubTab === 'mutes' && (
              <div className="space-y-2">
                {mutes.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl text-xs">
                    Нет активных мутов. Все ведут себя спокойно.
                  </div>
                ) : (
                  mutes.map(m => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-300">{m.targetUser}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                            до {new Date(m.expiresAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-[11px]">
                          Причина: <span className="text-zinc-200">{m.reason}</span> • Выдал:{' '}
                          <span className="text-amber-400">{m.adminUser}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => setUnmuteReasonPrompt({ target: m.targetUser, type: 'mute' })}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Снять мут</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-tab 2: Bans */}
            {blacklistSubTab === 'bans' && (
              <div className="space-y-2">
                {bans.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl text-xs">
                    В бане никого нет.
                  </div>
                ) : (
                  bans.map(b => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-red-400">{b.targetUser}</span>
                        <p className="text-zinc-400 text-[11px]">
                          Причина: <span className="text-zinc-200">{b.reason}</span> • Выдал:{' '}
                          <span className="text-amber-400">{b.adminUser}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => setUnmuteReasonPrompt({ target: b.targetUser, type: 'ban' })}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Снять бан</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-tab 3: Bot Blocks */}
            {blacklistSubTab === 'botblocks' && (
              <div className="space-y-2">
                {botBlocks.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl text-xs">
                    Нет активных блокировок функционала бота.
                  </div>
                ) : (
                  botBlocks.map(bb => (
                    <div
                      key={bb.id}
                      className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-amber-300">{bb.targetUser}</span>
                        <p className="text-zinc-400 text-[11px]">
                          Причина: <span className="text-zinc-200">{bb.reason}</span> • Выдал:{' '}
                          <span className="text-amber-400">{bb.adminUser}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => setUnmuteReasonPrompt({ target: bb.targetUser, type: 'block' })}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Снять блок</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Required Reason Dialog for Unmute */}
            {unmuteReasonPrompt && (
              <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/60 space-y-3">
                <div className="flex items-center gap-2 text-red-200 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Блэкджек требует указать причину амнистии для {unmuteReasonPrompt.target}:</span>
                </div>
                <input
                  type="text"
                  value={unmuteReasonInput}
                  onChange={e => setUnmuteReasonInput(e.target.value)}
                  placeholder="Например: осознал вину, извинился перед игроками, истек срок..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-red-500/40 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => {
                      setUnmuteReasonPrompt(null);
                      setUnmuteReasonInput('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleConfirmUnmute}
                    disabled={!unmuteReasonInput.trim()}
                    className="px-4 py-1.5 rounded-lg bg-red-600 disabled:opacity-50 text-white font-bold text-xs"
                  >
                    Подтвердить и снять
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TOPICS & PERMISSIONS */}
        {activeTab === 'topics' && (
          <div className="space-y-4 font-mono-pip text-xs">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <h3 className="font-bold text-white text-sm">Управление топиками в Telegram супергруппе:</h3>
              <p className="text-zinc-400 text-[11px]">
                Укажите через запятую ID или названия топиков (веток), чтобы разграничить доступ Блэкджек.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-emerald-400 font-bold block mb-1">
                    🟢 Разрешенные топики (активный ответ и модерация):
                  </label>
                  <input
                    type="text"
                    value={allowedTopics}
                    onChange={e => setAllowedTopics(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-200"
                    placeholder="general, main, rp, chat"
                  />
                </div>

                <div>
                  <label className="text-amber-400 font-bold block mb-1">
                    🟡 Только чтение (наблюдение без ответов):
                  </label>
                  <input
                    type="text"
                    value={readOnlyTopics}
                    onChange={e => setReadOnlyTopics(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-200"
                    placeholder="news, rules, announcements"
                  />
                </div>

                <div>
                  <label className="text-red-400 font-bold block mb-1">
                    🔴 Запретные топики (Блэкджек полностью игнорирует):
                  </label>
                  <input
                    type="text"
                    value={forbiddenTopics}
                    onChange={e => setForbiddenTopics(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-200"
                    placeholder="private_staff, admin_secret"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">
                    🔑 Токен Telegram Бота Блэкджек:
                  </label>
                  <input
                    type="text"
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Сохранить настройки</span>
                </button>
                {saveSuccessNotice && (
                  <span className="text-emerald-400">{saveSuccessNotice}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYNERGY & ANTI-LOOP (LITTLEPIP + BLACKJACK) */}
        {activeTab === 'synergy' && (
          <div className="space-y-4 font-mono-pip text-xs">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Автоматический дуэт: Литлпип (Пипка) & Блэкджек</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-zinc-300 leading-relaxed text-[11px]">
                <p>
                  <b>1. Фиксация нарушения:</b> Когда Литлпип фиксирует нарушение правил чата (оскорбления, реклама, спам, 18+), она выносит публичное предупреждение и сразу вызывает Блэкджек:
                </p>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-emerald-300">
                  <i>«🚨 @Blackjack (Блэкджек), у нас тут нарушитель @username! Зафиксировано нарушение правила №1...»</i>
                </div>
                <p>
                  <b>2. Исполнение наказания:</b> Блэкджек моментально выписывает 10 минут мута нарушителю, заносит в чёрный список и пингует шерифов чата:
                </p>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-red-300">
                  <i>«💥 Зафиксировано, Пипка! Нарушитель @username отправлен в мут на 10 минут. 👮‍♂️ Внимание шерифов: @MrWhitePio — проверьте инцидент!»</i>
                </div>
                <p>
                  <b>3. Защита от зацикливания (Anti-Loop Guard):</b> Боты обмениваются ровно одной триггерной репликой (<i>«Блэкджек: хэй пипка ты видела как я отработала?»</i> / <i>«Пипка: видела, Джеки, пусть остынет»</i>). Кулак блокировки (cooldown 60с) намертво исключает бесконечные циклы между ботами.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LORE & WIKI */}
        {activeTab === 'wiki' && (
          <div className="space-y-4 font-mono-pip text-xs">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Каноническое досье: Somber — Project Horizons</h3>
                <a
                  href="https://falloutequestria.fandom.com/ru/wiki/%D0%91%D0%BB%D1%8D%D0%BA%D0%B4%D0%B6%D0%B5%D0%BA_(Project_Horizons)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px]"
                >
                  <span>Статья на Fandom Wiki</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 uppercase">Происхождение</span>
                  <p className="text-zinc-200">Стойло 99, Хуффингтон. Охранник службы безопасности.</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 uppercase">Метка (Cutie Mark)</span>
                  <p className="text-zinc-200">Туз и Валет (комбинация Блэкджек, 21 очко).</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 uppercase">Вооружение</span>
                  <p className="text-zinc-200">Двуствольный дробовик, Магнум .44 («Любимец»), кибер-лезвия.</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 uppercase">Модификации</span>
                  <p className="text-zinc-200">Шасси EC-1101, бионические конечности, кибернетический глаз.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
