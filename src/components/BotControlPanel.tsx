import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Bot,
  Terminal,
  Send,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Download,
  Check,
  FileArchive,
  Globe,
  Server,
  Cloud,
  GitBranch,
  GitPullRequest,
  GitCommit,
  FileCode,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Layers,
  ArrowDownToLine,
  Radio,
  MessageSquare,
  Sliders,
  Eye,
  EyeOff,
  UserCheck,
  Heart,
  Smile,
  ShieldAlert,
  Volume2,
  Plus,
  Trash2,
  Users,
  Award,
  BookOpen
} from 'lucide-react';
import { RunningPony } from './RunningPony';

interface BotControlPanelProps {
  onOpenMiniApp: () => void;
}

interface AvailablePipTopic {
  chatId: number | string;
  chatTitle: string;
  threadId: number;
  title: string;
  lastSeenAt: string;
}

export const BotControlPanel: React.FC<BotControlPanelProps> = ({ onOpenMiniApp }) => {
  const [isPolling, setIsPolling] = useState(false);
  const [telegramBotConfigured, setTelegramBotConfigured] = useState(false);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [logs, setLogs] = useState<Array<{ id: string; time: string; type: string; text: string }>>([
    { id: '1', time: '12:00:00', type: 'info', text: 'Сервер DustTown RP запущен' },
    { id: '2', time: '12:00:01', type: 'info', text: 'Ожидание статуса Telegram polling' }
  ]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'bot'; text: string; buttons?: any[] }>>([
    {
      id: 'init_welcome',
      sender: 'bot',
      text: `👋 Добро пожаловать в DustTown RP (Fallout: Equestria)!

🏛️ DustTown — укреплённый город на перепутье выжженных пустошей. Сталкеры, единороги, пегасы и стальные рейнджеры находят здесь убежище и выходят на опасные вылазки.

🎮 Нажмите «Открыть приложение», чтобы войти в Mini App:`,
      buttons: [
        { label: '🎮 Открыть приложение', action: 'open_app', primary: true },
        { label: '⚠️ Сообщить о проблеме', url: 'https://t.me/MrWhitePio' },
        { label: '👥 Присоединиться к комьюнити', url: 'https://t.me/DustTownCollective' }
      ]
    }
  ]);
  const [inputMsg, setInputMsg] = useState('/start');
  const [loading, setLoading] = useState(false);

  // Fetch status from server
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) {
        const data = await res.json();
        setIsPolling(data.isPolling);
        setTelegramBotConfigured(Boolean(data.telegramBotConfigured));
        if (data.botInfo) setBotInfo(data.botInfo);
        if (Array.isArray(data.logs) && data.logs.length > 0) setLogs(data.logs);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePolling = async () => {
    setLoading(true);
    try {
      const endpoint = isPolling ? '/api/bot/stop' : '/api/bot/start';
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsPolling(data.isPolling);
      }
    } catch (e) {
      setIsPolling(!isPolling);
    } finally {
      setLoading(false);
    }
  };

  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      // 1. Try to fetch base64 from server for 100% reliable binary blob generation
      const res = await fetch('/api/get-zip-base64');
      if (res.ok) {
        const data = await res.json();
        if (data.base64) {
          const byteCharacters = atob(data.base64);
          const byteNumbers = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([byteNumbers], { type: 'application/zip' });
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', 'dusttown-rp-render.zip');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);

          setDownloadDone(true);
          setTimeout(() => setDownloadDone(false), 5000);
          return;
        }
      }

      // Fallback: standard binary fetch
      const fallbackRes = await fetch('/api/download-render-zip');
      if (!fallbackRes.ok) throw new Error('Не удалось получить архив от сервера');
      const blob = await fallbackRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'dusttown-rp-render.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);

      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 5000);
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadError(err?.message || 'Ошибка загрузки');
    } finally {
      setIsDownloading(false);
    }
  };

  // Incremental Update / GitHub Patch states
  const [updateStatus, setUpdateStatus] = useState<{
    hasUpdates: boolean;
    changedFiles: string[];
    addedFiles?: string[];
    deletedFiles?: string[];
    totalChanged: number;
    lastCheckpointIso: string | null;
  } | null>(null);
  const [isDownloadingPatch, setIsDownloadingPatch] = useState(false);
  const [patchDownloaded, setPatchDownloaded] = useState(false);
  const [isConfirmingSync, setIsConfirmingSync] = useState(false);
  const [syncConfirmedNotice, setSyncConfirmedNotice] = useState<string | null>(null);
  const [showFilesList, setShowFilesList] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);

  // Fetch update status
  const fetchUpdateStatus = async () => {
    try {
      const res = await fetch('/api/updates/status');
      if (res.ok) {
        const data = await res.json();
        setUpdateStatus(data);
      }
    } catch (e) {}
  };

  // Littlepip Control, Topics & Reputation States
  const [pipActiveTab, setPipActiveTab] = useState<'personality' | 'topics' | 'reputation' | 'commands'>('personality');
  const [pipSettings, setPipSettings] = useState<any>({
    boldnessLevel: 'saucy',
    allowProfanity: true,
    allowFlirting: true,
    flirtChanceAdmins: 35,
    flirtChanceRegular: 10,
    useMemesAndQuotes: true,
    empathySupport: true,
    model: 'gemini-2.5-flash',
    temperature: 0.84,
    topics: {}
  });
  const [pipSettingsSaving, setPipSettingsSaving] = useState(false);
  const [pipSettingsSavedNotice, setPipSettingsSavedNotice] = useState<string | null>(null);

  // Topics management
  const [newTopicThreadId, setNewTopicThreadId] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicChatId, setNewTopicChatId] = useState('');
  const [newTopicPermission, setNewTopicPermission] = useState<'read_write' | 'read_only' | 'blocked'>('read_only');
  const [newTopicNotes, setNewTopicNotes] = useState('');
  const [availablePipTopics, setAvailablePipTopics] = useState<AvailablePipTopic[]>([]);
  const [loadingPipTopics, setLoadingPipTopics] = useState(false);
  const [pipTopicsError, setPipTopicsError] = useState<string | null>(null);

  // Reputation management
  const [reputationList, setReputationList] = useState<any[]>([]);
  const [loadingReputation, setLoadingReputation] = useState(false);
  const [reputationSearch, setReputationSearch] = useState('');

  const fetchPipConfig = async () => {
    try {
      const res = await fetch('/api/littlepip/config');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setPipSettings(data.settings);
      }
    } catch (e) {}
  };

  const fetchAvailablePipTopics = async () => {
    setLoadingPipTopics(true);
    setPipTopicsError(null);
    try {
      const res = await fetch('/api/littlepip/topics/available');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось загрузить топики.');
      setAvailablePipTopics(Array.isArray(data.topics) ? data.topics : []);
    } catch (error) {
      setPipTopicsError(error instanceof Error ? error.message : 'Не удалось загрузить топики.');
    } finally {
      setLoadingPipTopics(false);
    }
  };

  const handleSavePipSettings = async () => {
    setPipSettingsSaving(true);
    try {
      const res = await fetch('/api/littlepip/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pipSettings)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setPipSettings(data.settings);
        setPipSettingsSavedNotice('Настройки характера Пипки сохранены!');
        setTimeout(() => setPipSettingsSavedNotice(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPipSettingsSaving(false);
    }
  };

  const fetchReputationList = async () => {
    setLoadingReputation(true);
    try {
      const res = await fetch('/api/littlepip/reputation');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.players)) setReputationList(data.players);
      }
    } catch (e) {} finally {
      setLoadingReputation(false);
    }
  };

  const handleAdjustReputation = async (userId: string | number, deltaScore: number, reason: string) => {
    try {
      const res = await fetch('/api/littlepip/reputation/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, deltaScore, reason })
      });
      if (res.ok) {
        fetchReputationList();
      }
    } catch (e) {}
  };

  const handleForgivePlayer = async (userId: string | number) => {
    try {
      const res = await fetch('/api/littlepip/reputation/forgive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        fetchReputationList();
      }
    } catch (e) {}
  };

  const handleSetTopic = async (
    threadId: string | number,
    title: string,
    permission: 'read_write' | 'read_only' | 'blocked',
    notes?: string,
    chatId?: string | number,
    chatTitle?: string
  ) => {
    if (!threadId) return;
    try {
      const res = await fetch('/api/littlepip/topics/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          title: title || `Топик #${threadId}`,
          permission,
          enabled: true,
          notes,
          chatId: chatId || undefined,
          chatTitle
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось сохранить режим топика.');
      if (data.settings) setPipSettings(data.settings);
      setNewTopicThreadId('');
      setNewTopicTitle('');
      setNewTopicChatId('');
      setNewTopicNotes('');
      setPipTopicsError(null);
    } catch (error) {
      setPipTopicsError(error instanceof Error ? error.message : 'Не удалось сохранить режим топика.');
    }
  };

  const handleRemoveTopic = async (threadId: string | number, chatId?: string | number) => {
    try {
      const query = chatId === undefined ? '' : `?chatId=${encodeURIComponent(chatId)}`;
      const res = await fetch(`/api/littlepip/topics/${encodeURIComponent(threadId)}${query}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось удалить настройку топика.');
      if (data.settings) setPipSettings(data.settings);
    } catch (error) {
      setPipTopicsError(error instanceof Error ? error.message : 'Не удалось удалить настройку топика.');
    }
  };

  useEffect(() => {
    fetchUpdateStatus();
    fetchPipConfig();
    fetchAvailablePipTopics();
    fetchReputationList();
    const interval = setInterval(fetchUpdateStatus, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadPatch = async () => {
    setIsDownloadingPatch(true);
    setPatchError(null);
    try {
      // 1. Try base64 endpoint for 100% reliable in-browser blob download
      const res = await fetch('/api/updates/get-patch-base64');
      if (res.ok) {
        const data = await res.json();
        if (data.base64) {
          const byteCharacters = atob(data.base64);
          const byteNumbers = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([byteNumbers], { type: 'application/zip' });
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          const patchName = data.filename || `dusttown-update-patch-${new Date().toISOString().slice(0, 10)}.zip`;
          link.setAttribute('download', patchName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);

          setPatchDownloaded(true);
          return;
        }
      }

      // Fallback: direct download link
      const fallbackRes = await fetch('/api/updates/download-patch');
      if (!fallbackRes.ok) throw new Error('Не удалось сгенерировать патч обновлений');
      const blob = await fallbackRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'dusttown-update-patch.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);

      setPatchDownloaded(true);
    } catch (e: any) {
      console.error('Patch download error:', e);
      setPatchError(e?.message || 'Ошибка загрузки патча');
    } finally {
      setIsDownloadingPatch(false);
    }
  };

  const handleConfirmSync = async () => {
    setIsConfirmingSync(true);
    try {
      const res = await fetch('/api/updates/confirm-sync', { method: 'POST' });
      if (res.ok) {
        setPatchDownloaded(false);
        setSyncConfirmedNotice('Синхронизация подтверждена! Кнопка сброшена и ожидает следующих обновлений.');
        setTimeout(() => setSyncConfirmedNotice(null), 5000);
        await fetchUpdateStatus();
      }
    } catch (e) {
      console.error('Confirm sync error:', e);
    } finally {
      setIsConfirmingSync(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim()) return;

    const userMsgId = 'usr_' + Date.now();
    const newChat = [...chatMessages, { id: userMsgId, sender: 'user' as const, text }];
    setChatMessages(newChat);
    setInputMsg('');

    const lower = text.trim().toLowerCase();

    // 1. Standard /start
    if (lower.startsWith('/start')) {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            sender: 'bot',
            text: `👋 Добро пожаловать в DustTown RP (Fallout: Equestria)!

🏛️ DustTown — укреплённый город на перепутье выжженных пустошей. Сталкеры, единороги, пегасы и стальные рейнджеры находят здесь убежище и выходят на опасные вылазки.

🎮 Нажмите «Открыть приложение», чтобы войти в Mini App:`,
            buttons: [
              { label: '🎮 Открыть приложение', action: 'open_app', primary: true },
              { label: '🦄 Поговорить с Литлпип (/pip_start)', action: 'talk_pip' },
              { label: '🛠️ Техподдержка (/support)', action: 'support_pip' },
              { label: '👥 Присоединиться к комьюнити', url: 'https://t.me/DustTownCollective' }
            ]
          }
        ]);
      }, 300);
      return;
    }

    // 2. Real Neural Littlepip AI query via server endpoint (/api/littlepip/chat)
    const typingId = 'typing_' + Date.now();
    setChatMessages(prev => [
      ...prev,
      {
        id: typingId,
        sender: 'bot',
        text: '🦄 *Литлпип настраивает волну Pip-Buck и думает над ответом...*'
      }
    ]);

    try {
      const mode = lower.includes('support') ? 'support' : 'chat';
      const res = await fetch('/api/littlepip/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          username: '@MrWhitePio',
          mode
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setChatMessages(prev =>
            prev.map(m =>
              m.id === typingId
                ? {
                    id: 'bot_' + Date.now(),
                    sender: 'bot',
                    text: data.reply
                  }
                : m
            )
          );
          return;
        }
      }
    } catch (e) {
      console.error('Littlepip chat error:', e);
    }

    // Fallback if network takes too long
    setChatMessages(prev =>
      prev.map(m =>
        m.id === typingId
          ? {
              id: 'bot_' + Date.now(),
              sender: 'bot',
              text: `🦄 **Литлпип:** Принято, сталкер! Радиосигнал чистый, Макинтош смазан. Продолжай, я слушаю тебя через волну Даст Таун!`
            }
          : m
      )
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Bot Server Control Card */}
      <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading text-amber-400 uppercase tracking-wide">
                  Панель управления Telegram Ботом
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono-pip font-bold flex items-center gap-1 ${
                    isPolling
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : telegramBotConfigured
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isPolling ? 'bg-emerald-400 animate-ping' : telegramBotConfigured ? 'bg-red-400' : 'bg-amber-300'}`} />
                  {isPolling ? 'ПОДКЛЮЧЕН (ПОЛЛИНГ)' : telegramBotConfigured ? 'ОСТАНОВЛЕН' : 'НЕТ TELEGRAM_BOT_TOKEN'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono-pip mt-0.5">
                DustTown RP Bot • токен задаётся в Render Environment Variables
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Download for Render, Incremental Updates, & Start/Stop */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Incremental Updates / GitHub Patch Download Button */}
            <button
              onClick={handleDownloadPatch}
              disabled={isDownloadingPatch || (!updateStatus?.hasUpdates && !patchDownloaded)}
              className={`px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow ${
                updateStatus?.hasUpdates
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-950/50 animate-pulse border border-amber-300'
                  : patchDownloaded
                  ? 'bg-emerald-500 text-black shadow-emerald-950/50'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-default'
              }`}
              title={
                updateStatus?.hasUpdates
                  ? `Скачать только последние обновления (${updateStatus.totalChanged} файлов для GitHub)`
                  : 'Все обновления уже синхронизированы с GitHub'
              }
            >
              {isDownloadingPatch ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Патч...</span>
                </>
              ) : patchDownloaded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950 font-black" />
                  <span>Патч скачан!</span>
                </>
              ) : updateStatus?.hasUpdates ? (
                <>
                  <GitPullRequest className="w-4 h-4" />
                  <span>Обновления ({updateStatus.totalChanged})</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Синхронно (0)</span>
                </>
              )}
            </button>

            {/* Full Render ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className={`px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow ${
                downloadDone
                  ? 'bg-emerald-500 text-black'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50'
              }`}
              title="Скачать все файлы в ZIP для размещения на Render.com"
            >
              {downloadDone ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Скачано!</span>
                </>
              ) : isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Упаковка...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Скачать для Render (.ZIP)</span>
                </>
              )}
            </button>

            <button
              disabled={loading}
              onClick={handleTogglePolling}
              className={`px-4 py-2.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg ${
                isPolling
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-950/50'
              }`}
            >
              {isPolling ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>Остановить бота</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Запустить бота</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Links & Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono-pip uppercase">Администратор бота</span>
            <div className="text-xs font-bold text-amber-300 font-mono-pip flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>@MrWhitePio</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono-pip uppercase">Группа Даст Таун Колектив</span>
            <a
              href="https://t.me/DustTownCollective"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-cyan-300 font-mono-pip hover:underline flex items-center gap-1"
            >
              <span>t.me/DustTownCollective</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono-pip uppercase">Быстрый запуск Mini App</span>
            <button
              onClick={onOpenMiniApp}
              className="text-xs font-bold text-amber-400 font-heading hover:underline flex items-center gap-1"
            >
              <span>Открыть игровое приложение →</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PROMINENT RENDER DEPLOYMENT HUB */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-zinc-950 to-purple-950/50 border-2 border-indigo-500/50 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden">
        {/* Background glow accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-heading text-indigo-200 uppercase tracking-wide">
                  Размещение на Render.com (Публичный доступ 24/7)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono-pip font-bold">
                  БЕЗ ОГРАНИЧЕНИЙ GOOGLE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Скачайте все файлы проекта в один клик и загрузите на Render — игроки смогут заходить в Mini App в Telegram без ошибок доступа.
              </p>
            </div>
          </div>

          {/* Big Download Button & Direct Fallback */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className={`px-6 py-3 rounded-2xl font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
                downloadDone
                  ? 'bg-emerald-500 text-black shadow-emerald-950/50'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-950/50 hover:scale-[1.02]'
              }`}
            >
              {downloadDone ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Архив (.ZIP) скачан!</span>
                </>
              ) : isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Формирование Blob (.ZIP)...</span>
                </>
              ) : (
                <>
                  <FileArchive className="w-4 h-4" />
                  <span>Скачать архив (.ZIP)</span>
                </>
              )}
            </button>

            <a
              href="/api/download-render-zip"
              target="_blank"
              rel="noopener noreferrer"
              download="dusttown-rp-render.zip"
              className="px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition flex items-center justify-center gap-1.5 text-xs font-mono-pip"
              title="Открыть прямое скачивание в отдельной вкладке (без iframe)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Прямая ссылка</span>
            </a>

            <a
              href="https://dashboard.render.com/select-repo?type=web"
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition flex items-center justify-center"
              title="Открыть Render.com в новой вкладке"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {downloadError && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>Ошибка скачивания: {downloadError}. Попробуйте кнопку «Прямая ссылка» рядом или встроенный экспорт Google AI Studio.</span>
          </div>
        )}

        {/* AI Studio Built-in Export Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-zinc-300 leading-relaxed">
            <strong className="text-amber-300 font-bold">Самый надёжный способ (Встроенный в Google AI Studio):</strong>{' '}
            В самом верху справа экрана AI Studio нажмите на кнопку со значком экспорта{' '}
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-amber-300 font-mono">Export / GitHub</span>.
            Там можно в 1 клик выгрузить чистый ZIP-архив проекта или отправить проект напрямую в ваш репозиторий GitHub без скачивания на диск!
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 relative z-10">
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono-pip text-[10px] font-bold flex items-center justify-center">
                1
              </span>
              <FileArchive className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <h4 className="text-xs font-bold text-zinc-200 font-heading">Скачайте архив</h4>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Нажмите кнопку выше — скачается готовый файл <code className="text-amber-300">dusttown-rp-render.zip</code> со всеми исходниками.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono-pip text-[10px] font-bold flex items-center justify-center">
                2
              </span>
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <h4 className="text-xs font-bold text-zinc-200 font-heading">Загрузите на GitHub</h4>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Распакуйте архив и загрузите файлы в свой репозиторий на <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">GitHub</a>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono-pip text-[10px] font-bold flex items-center justify-center">
                3
              </span>
              <Server className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <h4 className="text-xs font-bold text-zinc-200 font-heading">Создайте Web Service</h4>
            <p className="text-[11px] text-zinc-400 leading-snug">
              В <a href="https://render.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Render.com</a> выберите репозиторий (Build: <code className="text-amber-300">npm install && npm run build</code>, Start: <code className="text-amber-300">npm start</code>).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono-pip text-[10px] font-bold flex items-center justify-center">
                4
              </span>
              <Bot className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <h4 className="text-xs font-bold text-zinc-200 font-heading">Вставьте в @BotFather</h4>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Получите публичный HTTPS-адрес от Render и укажите его в @BotFather (настройки кнопки Menu Button).
            </p>
          </div>
        </div>

        {/* Render Cache Tip & Diagnostics */}
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2 text-xs relative z-10">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Не обновляется на Render? Проверьте 2 простых шага:</span>
          </div>
          <ul className="text-zinc-300 text-[11px] space-y-1 list-disc list-inside">
            <li>
              <strong className="text-amber-200">Сброс кеша Render:</strong> на странице вашего Web Service нажмите синюю кнопку{' '}
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono">Manual Deploy</span> →{' '}
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono">Clear build cache & deploy</span>.
            </li>
            <li>
              <strong className="text-amber-200">Кеш Telegram:</strong> Telegram внутри приложения держит кеш страницы. Нажмите три точки в окне бота → «Перезагрузить страницу» (Reload) или полностью перезапустите Telegram.
            </li>
            <li>
              <strong className="text-amber-200">Проверка версии онлайн:</strong> откройте{' '}
              <a href="/api/version" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-mono">
                /api/version
              </a>{' '}
              на вашем Render-домене, чтобы увидеть точную дату сборки и список активных модулей.
            </li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 text-xs font-mono-pip relative z-10">
          <span className="text-zinc-300">
            Добавьте <strong className="text-indigo-400">TELEGRAM_BOT_TOKEN</strong> в Environment Variables сервиса Render. Не вставляйте токен в чат или исходный код.
          </span>
        </div>
      </div>

      {/* 3. GITHUB INCREMENTAL PATCH & TWO-AI SYNC HUB */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-zinc-950 to-orange-950/30 border-2 border-amber-500/50 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden">
        {/* Background glow accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-heading text-amber-200 uppercase tracking-wide">
                  Синхронизация с GitHub (Патч для 2-х ИИ)
                </h3>
                {updateStatus?.hasUpdates ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[9px] font-mono-pip font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    ЕСТЬ ОБНОВЛЕНИЯ ({updateStatus.totalChanged})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono-pip font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    СИНХРОНИЗИРОВАНО С GITHUB
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Инкрементальный режим: скачивает лёгкий ZIP только с последними изменёнными файлами для быстрой синхронизации с вашим GitHub-репозиторием.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {syncConfirmedNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2 animate-fade-in relative z-10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{syncConfirmedNotice}</span>
          </div>
        )}

        {patchError && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 flex items-center gap-2 relative z-10">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{patchError}</span>
          </div>
        )}

        {/* Interactive Updates Block */}
        {updateStatus?.hasUpdates ? (
          <div className="space-y-4 relative z-10">
            {/* File List Summary & Toggle */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-pip">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>
                    Файлы, готовые к переносу в GitHub: <strong className="text-amber-300">{updateStatus.totalChanged}</strong>
                  </span>
                </span>
                <button
                  onClick={() => setShowFilesList(!showFilesList)}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px] transition"
                >
                  <span>{showFilesList ? 'Скрыть список' : 'Показать файлы'}</span>
                  {showFilesList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showFilesList && (
                <div className="max-h-44 overflow-y-auto space-y-1.5 pt-2 border-t border-zinc-800 text-[11px] font-mono text-zinc-400">
                  {updateStatus.changedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800/80 transition">
                      <span className="text-zinc-200 truncate">{file}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase shrink-0 ml-2">
                        обновлён
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons: Big Download Button & Direct Fallback */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleDownloadPatch}
                disabled={isDownloadingPatch}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
                  patchDownloaded
                    ? 'bg-emerald-500 text-black shadow-emerald-950/50'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-950/50 hover:scale-[1.01]'
                }`}
              >
                {isDownloadingPatch ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Упаковка патча...</span>
                  </>
                ) : patchDownloaded ? (
                  <>
                    <Check className="w-4 h-4 text-black font-black" />
                    <span>✓ Патч скачан! Теперь отметьте галочку ниже ↓</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Скачать последние обновления ({updateStatus.totalChanged} файлов в .ZIP)</span>
                  </>
                )}
              </button>

              <a
                href="/api/updates/download-patch"
                target="_blank"
                rel="noopener noreferrer"
                download="dusttown-update-patch.zip"
                className="px-4 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition flex items-center justify-center gap-1.5 text-xs font-mono-pip"
                title="Прямая ссылка на скачивание патча"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Прямая ссылка</span>
              </a>
            </div>

            {/* Confirmation Checkbox Container */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                patchDownloaded
                  ? 'bg-emerald-950/40 border-emerald-500/70 ring-2 ring-emerald-500/30'
                  : 'bg-zinc-900/80 border-zinc-700/80 hover:border-zinc-600'
              }`}
            >
              <label className="flex items-start gap-3.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isConfirmingSync}
                  onChange={handleConfirmSync}
                  disabled={isConfirmingSync}
                  className="w-5 h-5 mt-0.5 rounded-lg text-emerald-500 accent-emerald-500 bg-zinc-950 border-zinc-700 cursor-pointer"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-heading text-white uppercase tracking-wide">
                      Подтвердить перенос в GitHub
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono-pip font-bold">
                      Сброс кнопки
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    Поставьте эту галочку после того, как распаковали архив и сделали коммит в репозиторий GitHub. Кнопка сразу сбросится до 0 и перейдёт в режим ожидания следующих обновлений.
                  </p>
                </div>
              </label>
            </div>
          </div>
        ) : (
          /* Waiting / Peaceful Synced State */
          <div className="p-5 rounded-2xl bg-black/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold font-heading text-emerald-300 uppercase tracking-wide">
                  Все файлы синхронизированы с GitHub
                </h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Кнопка находится в режиме ожидания. Как только вы или ИИ внесёте любые изменения в код, здесь автоматически появится количество новых файлов и кнопка скачивания патча.
                </p>
                {updateStatus?.lastCheckpointIso && (
                  <div className="text-[10px] text-zinc-500 font-mono-pip pt-0.5">
                    Контрольная точка: {new Date(updateStatus.lastCheckpointIso).toLocaleString('ru-RU')}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={fetchUpdateStatus}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-mono-pip flex items-center gap-1.5 transition shrink-0"
              title="Перепроверить состояние файлов"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Перепроверить</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. LITTLEPIP AI AGENT SHOWCASE & COMMANDS HUB */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-zinc-950 to-purple-950/40 border-2 border-cyan-500/50 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-heading text-cyan-200 uppercase tracking-wide">
                  ИИ-Агент Литлпип (Стойло 2)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono-pip font-bold">
                  FALLOUT: EQUESTRIA 🦄
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono-pip font-bold hidden sm:inline">
                  АВТОНОМНЫЙ + GEMINI
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Кобылка-сталкерша с тонким чувством юмора, знанием всех файлов бота и режимами диалога, техподдержки и привязки к темам/вкладкам группы.
              </p>
            </div>
          </div>
        </div>

        {/* Subtabs for Littlepip Control */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto scrollbar-none relative z-10">
          <button
            onClick={() => setPipActiveTab('personality')}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              pipActiveTab === 'personality'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-950/40'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Характер и Поведение</span>
          </button>

          <button
            onClick={() => setPipActiveTab('topics')}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              pipActiveTab === 'topics'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-950/40'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Вкладки группы (Топики)</span>
            {Object.keys(pipSettings?.topics || {}).length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-900/80 text-[10px] text-purple-200 border border-purple-400/40 font-mono">
                {Object.keys(pipSettings?.topics || {}).length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setPipActiveTab('reputation');
              fetchReputationList();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              pipActiveTab === 'reputation'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-950/40'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Репутация участников</span>
            {reputationList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-900/80 text-[10px] text-emerald-200 border border-emerald-400/40 font-mono">
                {reputationList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setPipActiveTab('commands')}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              pipActiveTab === 'commands'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-950/40'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Команды и Триггеры</span>
          </button>
        </div>

        {/* TAB 1: PERSONALITY & BEHAVIOR SETTINGS */}
        {pipActiveTab === 'personality' && (
          <div className="space-y-5 animate-fade-in relative z-10">
            {/* Boldness Level Selection */}
            <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 font-heading uppercase tracking-wide">
                    Уровень дерзости Пипки
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Определяет напор, уровень сарказма и подколов в ответах.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold uppercase">
                  {pipSettings?.boldnessLevel || 'saucy'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'moderate', title: 'Умеренная', desc: 'Любознательная, вежливая, шутит мягко, без жестких подколов' },
                  { id: 'saucy', title: 'Дерзкая (Канон)', desc: 'Ирония, колкие шутки, может осадить наглеца, живой юмор Пустошей' },
                  { id: 'hardcore', title: 'Боевая (Стойло 2)', desc: 'Резкий отпор, прямота, боевой сарказм бывалой сталкерши' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPipSettings({ ...pipSettings, boldnessLevel: opt.id })}
                    className={`p-3 rounded-xl border text-left transition ${
                      pipSettings?.boldnessLevel === opt.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-bold font-heading">{opt.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 leading-snug">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox toggles grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 flex items-start gap-3 cursor-pointer hover:border-zinc-700 transition">
                <input
                  type="checkbox"
                  checked={Boolean(pipSettings?.allowProfanity)}
                  onChange={e => setPipSettings({ ...pipSettings, allowProfanity: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded accent-amber-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-200">Сочный мат к месту</div>
                  <div className="text-[11px] text-zinc-400 leading-snug">
                    Разрешить крепкое словцо в драматические моменты или при перепалке (без бессмысленной грязи).
                  </div>
                </div>
              </label>

              <label className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 flex items-start gap-3 cursor-pointer hover:border-zinc-700 transition">
                <input
                  type="checkbox"
                  checked={Boolean(pipSettings?.allowFlirting)}
                  onChange={e => setPipSettings({ ...pipSettings, allowFlirting: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded accent-pink-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-pink-300">Флирт и кокетство</div>
                  <div className="text-[11px] text-zinc-400 leading-snug">
                    Пипка может игриво подмигивать, смущаться или делать милые комплименты друзьям.
                  </div>
                </div>
              </label>

              <label className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 flex items-start gap-3 cursor-pointer hover:border-zinc-700 transition">
                <input
                  type="checkbox"
                  checked={Boolean(pipSettings?.useMemesAndQuotes)}
                  onChange={e => setPipSettings({ ...pipSettings, useMemesAndQuotes: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded accent-cyan-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-cyan-300">Цитаты мемов и анекдотов</div>
                  <div className="text-[11px] text-zinc-400 leading-snug">
                    Органично вворачивает популярные мемы («ГОТОВЬ ЕБАЛЬНИК», сидор, вороны, гномы, шашлык) и байки.
                  </div>
                </div>
              </label>

              <label className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 flex items-start gap-3 cursor-pointer hover:border-zinc-700 transition">
                <input
                  type="checkbox"
                  checked={Boolean(pipSettings?.empathySupport)}
                  onChange={e => setPipSettings({ ...pipSettings, empathySupport: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded accent-emerald-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-emerald-300">Эмпатия и поддержка</div>
                  <div className="text-[11px] text-zinc-400 leading-snug">
                    Если участник пишет, что всё плохо или устал — Пипка откладывает сарказм и тепло поддерживает.
                  </div>
                </div>
              </label>
            </div>

            {/* Sliders for Flirt & Model Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300">Шанс флирта с админами</span>
                  <span className="font-mono font-bold text-pink-400">{pipSettings?.flirtChanceAdmins ?? 35}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pipSettings?.flirtChanceAdmins ?? 35}
                  onChange={e => setPipSettings({ ...pipSettings, flirtChanceAdmins: Number(e.target.value) })}
                  className="w-full accent-pink-500 cursor-pointer"
                />
                <div className="text-[10px] text-zinc-500">К админам шанс кокетства по просьбе создателей повышен</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300">Шанс флирта с остальными</span>
                  <span className="font-mono font-bold text-amber-400">{pipSettings?.flirtChanceRegular ?? 10}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pipSettings?.flirtChanceRegular ?? 10}
                  onChange={e => setPipSettings({ ...pipSettings, flirtChanceRegular: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="text-[10px] text-zinc-500">Для обычных собеседников в чате</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300">Креативность (Temperature)</span>
                  <span className="font-mono font-bold text-cyan-400">{pipSettings?.temperature ?? 0.84}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.2"
                  step="0.05"
                  value={pipSettings?.temperature ?? 0.84}
                  onChange={e => setPipSettings({ ...pipSettings, temperature: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="text-[10px] text-zinc-500">0.84 — оптимальный баланс юмора и канона</div>
              </div>
            </div>

            {/* Model Selector & Save Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-zinc-400 font-mono-pip shrink-0">Модель:</span>
                <select
                  value={pipSettings?.model || 'gemini-2.5-flash'}
                  onChange={e => setPipSettings({ ...pipSettings, model: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Рекомендуется — быстрая, дерзкая)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Максимальный контекст и глубина)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Стабильная классика)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {pipSettingsSavedNotice && (
                  <span className="text-xs text-emerald-400 font-mono-pip flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{pipSettingsSavedNotice}</span>
                  </span>
                )}
                <button
                  onClick={handleSavePipSettings}
                  disabled={pipSettingsSaving}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-amber-950/40 disabled:opacity-50"
                >
                  {pipSettingsSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Сохранить настройки Пипки</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TELEGRAM FORUM TOPICS & PERMISSIONS */}
        {pipActiveTab === 'topics' && (
          <div className="space-y-5 animate-fade-in relative z-10">
            {/* Info notice about Read-Only and Write topics */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 text-xs text-purple-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold font-heading uppercase text-purple-300">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>Управление вкладками (топиками) группы Telegram</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Выберите обнаруженный топик группы, чтобы его ID и название подставились автоматически, затем задайте режим Пипки.
                <br />
                • <strong className="text-amber-300">Только чтение (Read-only)</strong>: например топик «Правила» или «Лор» — Пипка внимательно всё читает, впитывает в память и обновляет репутацию участников, но писать туда ей <strong className="text-red-400">СТРОГО ЗАПРЕЩЕНО</strong>!
                <br />
                • <strong className="text-emerald-300">Чтение и ответы (Read & Write)</strong>: обычный живой диалог, общение, ответы на вопросы и команды.
                <br />
                • <strong className="text-red-300">Запрет (Blocked)</strong>: Пипка полностью игнорирует сообщения из этой вкладки.
                <br />
                Список пополняется автоматически по мере того, как бот-администратор получает сообщения в топиках. Telegram Bot API не предоставляет полный перечень топиков, поэтому ранее неактивные ветки появятся после первого нового сообщения в них.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold font-heading text-purple-300 uppercase tracking-wide">
                    Топики групп, где Пипка — администратор
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Найдено: {availablePipTopics.length}. Ветка появляется здесь после сообщения в ней.
                  </p>
                </div>
                <button
                  onClick={fetchAvailablePipTopics}
                  disabled={loadingPipTopics}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPipTopics ? 'animate-spin' : ''}`} />
                  Обновить список
                </button>
              </div>
              <select
                value=""
                onChange={event => {
                  const selectedTopic = availablePipTopics.find(
                    topic => `${topic.chatId}:${topic.threadId}` === event.target.value
                  );
                  if (!selectedTopic) return;
                  setNewTopicChatId(String(selectedTopic.chatId));
                  setNewTopicThreadId(String(selectedTopic.threadId));
                  setNewTopicTitle(selectedTopic.title);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
              >
                <option value="">
                  {loadingPipTopics
                    ? 'Загрузка списка топиков...'
                    : availablePipTopics.length
                      ? 'Выберите группу и топик для настройки'
                      : 'Пока нет обнаруженных топиков'}
                </option>
                {availablePipTopics.map(topic => (
                  <option key={`${topic.chatId}:${topic.threadId}`} value={`${topic.chatId}:${topic.threadId}`}>
                    {topic.chatTitle} — {topic.title} (ID: {topic.threadId})
                  </option>
                ))}
              </select>
              {pipTopicsError && (
                <p role="alert" className="text-xs text-red-300">{pipTopicsError}</p>
              )}
            </div>

            {/* List of configured topics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono-pip">
                <span>Сконфигурированные топики:</span>
                <span>Всего: {Object.keys(pipSettings?.topics || {}).length}</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {Object.entries(pipSettings?.topics || {}).map(([key, topic]: [string, any]) => (
                  <div
                    key={key}
                    className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold font-heading text-zinc-100">{topic.title}</span>
                        {topic.chatTitle && (
                          <span className="text-[10px] text-purple-300">{topic.chatTitle}</span>
                        )}
                        <code className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
                          ID: {topic.threadId}
                        </code>
                        {topic.permission === 'read_only' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono-pip font-bold flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>ТОЛЬКО ЧТЕНИЕ (ПИСАТЬ ЗАПРЕЩЕНО)</span>
                          </span>
                        )}
                        {topic.permission === 'read_write' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono-pip font-bold flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>ЧТЕНИЕ И ОТВЕТЫ</span>
                          </span>
                        )}
                        {topic.permission === 'blocked' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-mono-pip font-bold flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            <span>ЗАБЛОКИРОВАН</span>
                          </span>
                        )}
                      </div>
                      {topic.notes && (
                        <p className="text-[11px] text-zinc-400 leading-snug">{topic.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={topic.permission}
                        onChange={e =>
                          handleSetTopic(topic.threadId, topic.title, e.target.value as any, topic.notes, topic.chatId, topic.chatTitle)
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
                      >
                        <option value="read_only">👁️ Только чтение</option>
                        <option value="read_write">💬 Чтение и ответы</option>
                        <option value="blocked">🚫 Заблокировать</option>
                      </select>

                      {key !== 'root' && (
                        <button
                          onClick={() => handleRemoveTopic(topic.threadId, topic.chatId)}
                          className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-red-200 transition"
                          title="Удалить топик из настроек"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Topic Form */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="text-xs font-bold font-heading text-purple-300 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Добавить новую вкладку (топик супергруппы)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-mono-pip">ID ветки / Thread ID:</label>
                  <input
                    type="text"
                    placeholder="Например: 42"
                    value={newTopicThreadId}
                    onChange={e => setNewTopicThreadId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-mono-pip">ID группы:</label>
                  <input
                    type="text"
                    placeholder="Автоматически из списка"
                    value={newTopicChatId}
                    onChange={e => setNewTopicChatId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-mono-pip">Название вкладки:</label>
                  <input
                    type="text"
                    placeholder="Например: Правила и Законы"
                    value={newTopicTitle}
                    onChange={e => setNewTopicTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-mono-pip focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-mono-pip">Режим доступа:</label>
                  <select
                    value={newTopicPermission}
                    onChange={e => setNewTopicPermission(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
                  >
                    <option value="read_only">👁️ Только чтение (Запрет на ответы)</option>
                    <option value="read_write">💬 Чтение и ответы (Диалог)</option>
                    <option value="blocked">🚫 Заблокирован (Игнор)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    onClick={() => {
                      const selectedGroup = availablePipTopics.find(
                        topic => String(topic.chatId) === newTopicChatId
                      );
                      handleSetTopic(
                        newTopicThreadId,
                        newTopicTitle,
                        newTopicPermission,
                        newTopicNotes,
                        newTopicChatId || undefined,
                        selectedGroup?.chatTitle
                      );
                    }}
                    disabled={!newTopicThreadId.trim()}
                    className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-heading font-black text-xs uppercase tracking-wider transition shadow-md shadow-purple-950/50 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase font-mono-pip">Заметки / Назначение для ИИ (Опционально):</label>
                <input
                  type="text"
                  placeholder="Например: База правил чата, Пипка запоминает регламент и цитирует при нарушении"
                  value={newTopicNotes}
                  onChange={e => setNewTopicNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-300 font-mono-pip focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REPUTATION & PLAYER MEMORY */}
        {pipActiveTab === 'reputation' && (
          <div className="space-y-5 animate-fade-in relative z-10">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-emerald-300 font-heading uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Память и Отношение Литлпип к игрокам чата</span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Пипка автоматически запоминает отношение к себе: похвалу, подгоны сидра, шутки, оскорбления и обиды.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Поиск по нику или ID..."
                  value={reputationSearch}
                  onChange={e => setReputationSearch(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  onClick={fetchReputationList}
                  disabled={loadingReputation}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition"
                  title="Обновить список репутации"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingReputation ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Players reputation list */}
            {reputationList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-black/40 border border-zinc-800 text-center space-y-2">
                <Award className="w-8 h-8 text-zinc-600 mx-auto" />
                <div className="text-xs font-bold text-zinc-300">База репутации пока пуста</div>
                <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                  Как только участники группы начнут общаться с Пипкой или упоминать её в чате, здесь появятся их персональные досье с баллами дружбы, обидами и заметками.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {reputationList
                  .filter(p =>
                    !reputationSearch ||
                    (p.username && p.username.toLowerCase().includes(reputationSearch.toLowerCase())) ||
                    String(p.userId).includes(reputationSearch)
                  )
                  .map((player: any) => {
                    const score = Number(player.score) || 0;
                    const isOffended = Boolean(player.grudgeUntil && player.grudgeUntil > Date.now());

                    let badgeColor = 'bg-zinc-800 text-zinc-300 border-zinc-700';
                    let attitudeLabel = 'Нейтрал';
                    if (player.attitude === 'best_friend') {
                      badgeColor = 'bg-pink-500/20 text-pink-300 border-pink-500/40';
                      attitudeLabel = '💖 Любимчик (+50..+100)';
                    } else if (player.attitude === 'friend') {
                      badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                      attitudeLabel = '🤝 Проверенный сталкер (+20..+49)';
                    } else if (player.attitude === 'suspicious') {
                      badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                      attitudeLabel = '🧐 Подозрительный тип (-11..-30)';
                    } else if (player.attitude === 'offended') {
                      badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
                      attitudeLabel = '🥺 Обидчик (Пипка дуется)';
                    } else if (player.attitude === 'nemesis') {
                      badgeColor = 'bg-red-500/20 text-red-300 border-red-500/40';
                      attitudeLabel = '☠️ Заклятый враг';
                    }

                    return (
                      <div
                        key={player.userId}
                        className="p-4 rounded-2xl bg-black/60 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold font-heading text-white flex items-center gap-1.5">
                                <span>@{player.username || 'Сталкер'}</span>
                                {isOffended && (
                                  <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-500/50 text-[9px] text-red-300 font-mono">
                                    Обижена 💢
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono">ID: {player.userId}</span>
                            </div>

                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono-pip font-bold ${badgeColor}`}>
                                {attitudeLabel}
                              </span>
                              <div className="text-xs font-mono font-bold mt-1 text-zinc-200">
                                Очки: <span className={score >= 0 ? 'text-emerald-400' : 'text-red-400'}>{score > 0 ? `+${score}` : score}</span>
                              </div>
                            </div>
                          </div>

                          {/* Stats and Last Impression */}
                          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                            <span>Похвал: <strong className="text-emerald-400">{player.praises || 0}</strong></span>
                            <span>Обид / Страйков: <strong className="text-red-400">{player.strikes || 0}</strong></span>
                          </div>

                          {player.lastImpression && (
                            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-300 italic">
                              «{player.lastImpression}»
                            </div>
                          )}

                          {player.notes && player.notes.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] text-zinc-500 uppercase font-mono-pip">Заметки Пипки:</span>
                              <div className="flex flex-wrap gap-1">
                                {player.notes.slice(-3).map((note: string, idx: number) => (
                                  <span key={idx} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono-pip">
                                    • {note}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-850 text-xs">
                          <button
                            onClick={() => handleAdjustReputation(player.userId, 10, 'Похвала от админа')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono-pip transition"
                            title="Добавить +10 к репутации"
                          >
                            +10 Хвалить
                          </button>
                          <button
                            onClick={() => handleAdjustReputation(player.userId, -15, 'Наказание от админа')}
                            className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/30 text-[10px] font-mono-pip transition"
                            title="Снизить репутацию на 15"
                          >
                            -15 Наказать
                          </button>
                          <button
                            onClick={() => handleForgivePlayer(player.userId)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono-pip transition"
                            title="Снять обиду и вернуть нейтралитет"
                          >
                            🕊️ Снять обиду
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMMANDS & CAPABILITIES GRID */}
        {pipActiveTab === 'commands' && (
          <div className="space-y-4 animate-fade-in relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <code className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                    /pip_start
                  </code>
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="text-xs font-bold text-zinc-200 font-heading">Обычный старт (Диалог)</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Запускает живое общение с Литлпип. Шутки, сталкерские байки, характер героини из Стойла 2.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <code className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                    /support
                  </code>
                  <Terminal className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-xs font-bold text-zinc-200 font-heading">Техподдержка</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Пипка изучает файлы бота (<code className="text-cyan-300">server.ts</code>, <code className="text-cyan-300">types.ts</code>), помогает с ошибками и экономикой ℰQ.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <code className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                    /pip_rep
                  </code>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-xs font-bold text-zinc-200 font-heading">Досье репутации</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Показывает игроку его текущее отношение Пипки: баллы, похвалу, обиды и воспоминания.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <code className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-xs font-bold">
                    /stop
                  </code>
                  <Shield className="w-4 h-4 text-red-400" />
                </div>
                <h4 className="text-xs font-bold text-zinc-200 font-heading">Радиомолчание</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Останавливает ИИ в чате или вкладке. Переводит Pip-Buck в спящий режим до новой команды.
                </p>
              </div>
            </div>

            {/* Mentions Pill Note */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-cyan-400 font-bold">💬 Имена в чате:</span>
                <span className="text-zinc-300">Литлпип отвечает на:</span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-cyan-300 font-mono font-bold">
                  Литлпип, Пипка, Литка, Лилька, Littlepip
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono-pip">
                Файл агента: <code className="text-amber-300">src/services/littlepipAgent.ts</code>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Telegram Chat Simulator */}
      <div className="rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Telegram Chat Header */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center font-black font-mono-pip text-black text-sm">
              DT
            </div>
            <div>
              <div className="text-sm font-bold font-heading text-zinc-100 flex items-center gap-1.5">
                <span>DustTown RP Bot</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-[10px] text-emerald-400 font-mono-pip">бот онлайн • Литлпип слушает эфир</div>
            </div>
          </div>

          <span className="text-[11px] text-zinc-400 font-mono-pip hidden sm:inline">
            Интерактивный симулятор чата
          </span>
        </div>

        {/* Message Stream */}
        <div className="p-5 space-y-4 max-h-96 overflow-y-auto bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:16px_16px]">
          {chatMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>

              {/* Bot Inline Buttons */}
              {msg.buttons && (
                <div className="mt-2 flex flex-col gap-1.5 w-full max-w-[85%] animate-fade-in">
                  {msg.buttons.map((btn, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (btn.action === 'open_app') {
                          onOpenMiniApp();
                        } else if (btn.action === 'talk_pip') {
                          handleSendMessage('/pip_start');
                        } else if (btn.action === 'support_pip') {
                          handleSendMessage('/support');
                        } else if (btn.url) {
                          window.open(btn.url, '_blank');
                        }
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-heading font-black tracking-wide uppercase transition flex items-center justify-center gap-1.5 shadow ${
                        btn.primary
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-950/40'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80'
                      }`}
                    >
                      <span>{btn.label}</span>
                      {btn.url && <ExternalLink className="w-3 h-3 text-zinc-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Command Pills for Testing */}
        <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-850 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono-pip scrollbar-none">
          <span className="text-zinc-500 text-[10px] shrink-0">Тест команд:</span>
          <button
            onClick={() => handleSendMessage('/start')}
            className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-800 shrink-0"
          >
            /start
          </button>
          <button
            onClick={() => handleSendMessage('/pip_start')}
            className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shrink-0 font-bold"
          >
            /pip_start 🦄
          </button>
          <button
            onClick={() => handleSendMessage('/support')}
            className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shrink-0 font-bold"
          >
            /support 🛠️
          </button>
          <button
            onClick={() => handleSendMessage('Пипка, расскажи анекдот про Стойло 2!')}
            className="px-2 py-0.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 shrink-0"
          >
            Пипка, анекдот! 😂
          </button>
          <button
            onClick={() => handleSendMessage('/stop')}
            className="px-2 py-0.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 shrink-0"
          >
            /stop 📻
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Напишите команду или обратитесь к Пипке..."
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono-pip"
          />
          <button
            onClick={() => handleSendMessage()}
            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Running Pony & Bot Polling Logs */}
      <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold font-mono-pip text-zinc-400 uppercase">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Статус Воркера и Логи Telegram Бота</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
            <span>Хостинг:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
              Render.com Cloud Worker 🚀
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Left: Running Pony ASCII animation */}
          <div className="md:col-span-5 h-full">
            <RunningPony isRunning={isPolling} />
          </div>

          {/* Right: Bot server logs */}
          <div className="md:col-span-7 p-3 rounded-2xl bg-black font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto text-zinc-400 border border-zinc-800">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-2">
                <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'message'
                      ? 'text-cyan-400'
                      : 'text-emerald-400'
                  }
                >
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
