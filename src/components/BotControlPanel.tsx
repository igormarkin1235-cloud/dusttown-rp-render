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
  Eye,
  EyeOff,
  Sparkles,
  Download,
  Check,
  Copy,
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
  MessageSquare
} from 'lucide-react';
import { RunningPony } from './RunningPony';

interface BotControlPanelProps {
  onOpenMiniApp: () => void;
}

export const BotControlPanel: React.FC<BotControlPanelProps> = ({ onOpenMiniApp }) => {
  const [isPolling, setIsPolling] = useState(true);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [logs, setLogs] = useState<Array<{ id: string; time: string; type: string; text: string }>>([
    { id: '1', time: '12:00:00', type: 'info', text: 'Сервер DustTown RP запущен' },
    { id: '2', time: '12:00:01', type: 'info', text: 'Telegram Long-Polling активен (Токен: 8987511998...)' }
  ]);
  const [showToken, setShowToken] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

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

  const BOT_TOKEN = '8987511998:AAFZ5TWBa1w855MH23LmD9y5SV2z9jOjGVA';

  // Fetch status from server
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) {
        const data = await res.json();
        setIsPolling(data.isPolling);
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

  const handleCopyToken = () => {
    navigator.clipboard.writeText(BOT_TOKEN);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
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

  useEffect(() => {
    fetchUpdateStatus();
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

  // GitHub Direct Live-Sync (igormarkin1235-cloud / dusttown-rp-render)
  const [githubLiveStatus, setGithubLiveStatus] = useState<{
    success?: boolean;
    sha?: string;
    shortSha?: string;
    message?: string;
    author?: string;
    date?: string;
    error?: string;
  } | null>(null);
  const [isPullingFromGithub, setIsPullingFromGithub] = useState(false);
  const [githubPullNotice, setGithubPullNotice] = useState<string | null>(null);

  const fetchGithubLiveStatus = async () => {
    try {
      const res = await fetch('/api/github/status');
      if (res.ok) {
        const data = await res.json();
        setGithubLiveStatus(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchGithubLiveStatus();
    const interval = setInterval(fetchGithubLiveStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePullFromGithub = async () => {
    setIsPullingFromGithub(true);
    setGithubPullNotice(null);
    try {
      const res = await fetch('/api/github/pull', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setGithubPullNotice(`Успешно! Обновлено файлов: ${data.updatedCount || 0}. Коммит: ${data.commit?.shortSha || ''} («${data.commit?.message || ''}»)`);
        setTimeout(() => setGithubPullNotice(null), 8000);
        await fetchGithubLiveStatus();
        await fetchUpdateStatus();
      } else {
        setGithubPullNotice('Ошибка синхронизации: ' + (data.error || 'Не удалось применить'));
      }
    } catch (err: any) {
      setGithubPullNotice('Ошибка соединения: ' + (err?.message || err));
    } finally {
      setIsPullingFromGithub(false);
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
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isPolling ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
                  {isPolling ? 'ПОДКЛЮЧЕН (ПОЛЛИНГ)' : 'ОСТАНОВЛЕН'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono-pip mt-0.5">
                DustTown RP Bot • Токен: {showToken ? BOT_TOKEN : '8987511998:AAFZ5TWBa1w855...'}
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
              onClick={() => setShowToken(!showToken)}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
              title={showToken ? 'Скрыть токен' : 'Показать токен'}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

        {/* Ready Environment Variables Snippet */}
        <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono-pip relative z-10">
          <div className="space-y-1">
            <span className="text-zinc-500 uppercase text-[10px]">Переменная окружения для Render (Environment Variables):</span>
            <div className="text-zinc-200 font-bold">
              <span className="text-indigo-400">TELEGRAM_BOT_TOKEN</span> = <span className="text-amber-300">{BOT_TOKEN}</span>
            </div>
          </div>
          <button
            onClick={handleCopyToken}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition text-[11px]"
          >
            {copiedToken ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Скопировать токен</span>
              </>
            )}
          </button>
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

        {/* GitHub Live Repository Two-Way Connection Block */}
        <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 space-y-3 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-200 font-mono-pip">
                    igormarkin1235-cloud / dusttown-rp-render
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono-pip font-bold">
                    main
                  </span>
                </div>
                {githubLiveStatus?.shortSha && (
                  <p className="text-[10px] text-zinc-400 font-mono-pip truncate max-w-md mt-0.5">
                    Последний коммит: <code className="text-amber-300 font-bold">{githubLiveStatus.shortSha}</code> — {githubLiveStatus.message} ({githubLiveStatus.author})
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePullFromGithub}
                disabled={isPullingFromGithub}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs font-heading flex items-center justify-center gap-1.5 transition shadow-lg active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPullingFromGithub ? 'animate-spin' : ''}`} />
                <span>{isPullingFromGithub ? 'Стягивание с GitHub...' : 'Стянуть обновления из GitHub'}</span>
              </button>
            </div>
          </div>

          {githubPullNotice && (
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-xs text-amber-200 font-mono-pip animate-fade-in flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{githubPullNotice}</span>
            </div>
          )}
        </div>
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

        {/* Commands & Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
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
              <code className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                /pip_bind
              </code>
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <h4 className="text-xs font-bold text-zinc-200 font-heading">Привязка к вкладке</h4>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Привязывает Литлпип к конкретной теме/топику супергруппы Telegram (<code className="text-purple-300">message_thread_id</code>).
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
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs relative z-10 flex-wrap">
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
