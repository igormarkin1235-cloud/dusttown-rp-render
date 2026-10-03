import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileArchive,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldCheck,
  Server,
  Sparkles,
  Smartphone,
  Bot,
  Columns,
  RefreshCw,
  Clock,
  Layers,
  UploadCloud,
  GitBranch,
  Key,
  X
} from 'lucide-react';

interface PatchStatus {
  hasUpdates: boolean;
  changedFiles: string[];
  addedFiles: string[];
  deletedFiles: string[];
  totalChanged: number;
  lastCheckpointIso?: string | null;
  isInitial?: boolean;
}

interface PatchManagerBarProps {
  viewMode: 'miniapp' | 'bot_panel' | 'split';
  onChangeViewMode: (mode: 'miniapp' | 'bot_panel' | 'split') => void;
}

export const PatchManagerBar: React.FC<PatchManagerBarProps> = ({
  viewMode,
  onChangeViewMode
}) => {
  const [updateStatus, setUpdateStatus] = useState<PatchStatus>({
    hasUpdates: false,
    changedFiles: [],
    addedFiles: [],
    deletedFiles: [],
    totalChanged: 0,
    lastCheckpointIso: null
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [showFileList, setShowFileList] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isChecked, setIsChecked] = useState(false);

  // GitHub direct migration state
  const [showGitModal, setShowGitModal] = useState(false);
  const [ghToken, setGhToken] = useState(() => {
    try {
      return localStorage.getItem('dusttown_gh_token') || '';
    } catch {
      return '';
    }
  });
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    commitHash?: string;
  } | null>(null);

  // Poll update status from server
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/updates/status');
      if (res.ok) {
        const data = await res.json();
        setUpdateStatus(data);
      }
    } catch {
      // offline / starting up
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3500);
    return () => clearInterval(interval);
  }, []);

  // Download patch handler
  const handleDownloadPatch = async () => {
    setIsDownloading(true);
    setPatchError(null);
    setDownloadSuccessNotice(false);

    try {
      // 1. Try base64 endpoint for direct in-browser download
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
          link.setAttribute('download', data.filename || 'dusttown-update-patch.zip');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);

          setDownloadSuccessNotice(true);
          return;
        }
      }

      // Fallback: direct download route
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

      setDownloadSuccessNotice(true);
    } catch (err: any) {
      setPatchError(err?.message || 'Ошибка генерации патча');
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct GitHub Push handler
  const handleGitPush = async () => {
    if (!ghToken.trim()) {
      alert('Укажите ваш GitHub Personal Access Token');
      return;
    }

    setIsPushing(true);
    setPushResult(null);

    try {
      localStorage.setItem('dusttown_gh_token', ghToken.trim());
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: ghToken.trim(),
          commitMessage: 'feat: sync updates and Blackjack AI agent directly from studio'
        })
      });

      const data = await res.json();
      setPushResult(data);

      if (data.success) {
        setIsChecked(true);
        await fetchStatus();
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        error: err?.message || 'Не удалось связаться с сервером для пуша'
      });
    } finally {
      setIsPushing(false);
    }
  };

  // Confirm sync handler (resets checkpoint and clears button/checkbox)
  const handleConfirmSync = async () => {
    setIsConfirming(true);
    setPatchError(null);

    try {
      const res = await fetch('/api/updates/confirm-sync', { method: 'POST' });
      if (res.ok) {
        // Reset local checkbox and success states immediately
        setIsChecked(false);
        setDownloadSuccessNotice(false);
        setSyncNotice('✅ Синхронизация подтверждена! Контрольная точка зафиксирована, кнопка очищена и ожидает новый патч.');
        setTimeout(() => setSyncNotice(null), 6000);
        await fetchStatus();
      } else {
        throw new Error('Ошибка подтверждения синхронизации');
      }
    } catch (err: any) {
      setPatchError(err?.message || 'Не удалось зафиксировать синхронизацию');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCheckboxToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    if (checked) {
      // User ticked the checkbox that patch is downloaded: trigger confirm and auto-clear!
      await handleConfirmSync();
    }
  };

  const formatCheckpointTime = (isoString?: string | null) => {
    if (!isoString) return 'Нет зафиксированных точек';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  const hasFiles = updateStatus.totalChanged > 0;

  return (
    <div className="w-full bg-zinc-950 border-b border-amber-500/20 shadow-xl relative z-40">
      {/* Top Main Status Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Project Branding & Live Render Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono-pip text-xs font-bold shrink-0">
            <FileArchive className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="tracking-wide">DustTown Patch Hub</span>
          </div>

          {/* Render Bot Status Badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono-pip"
            title="Telegram-бот запущен и круглосуточно хостится на Render. В AI Studio локальный polling отключен во избежание конфликтов."
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="font-semibold">Бот на Render</span>
            <span className="hidden lg:inline text-emerald-400/80">(polling тут выключен)</span>
          </div>

          {/* Patch changes status indicator */}
          <div className="flex items-center gap-1.5 text-xs font-mono-pip">
            {hasFiles ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Патч готов ({updateStatus.totalChanged} файлов)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Синхронизировано (0 изменений)</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick View Switcher & Collapse Button */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs font-mono-pip">
            <button
              onClick={() => onChangeViewMode('miniapp')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition ${
                viewMode === 'miniapp'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Открыть превью Mini App"
            >
              <Smartphone className="w-3 h-3" />
              <span>Mini App</span>
            </button>
            <button
              onClick={() => onChangeViewMode('bot_panel')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition ${
                viewMode === 'bot_panel'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Открыть панель управления ботом и Littlepip"
            >
              <Bot className="w-3 h-3" />
              <span>Панель Бота</span>
            </button>
            <button
              onClick={() => onChangeViewMode('split')}
              className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded transition ${
                viewMode === 'split'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Разделенный экран: Mini App + Панель управления"
            >
              <Columns className="w-3 h-3" />
              <span>Сплит</span>
            </button>
          </div>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
            title={isExpanded ? 'Свернуть панель патчей' : 'Развернуть панель патчей'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Patch Action Section */}
      {isExpanded && (
        <div className="bg-zinc-900/90 border-t border-zinc-800/80 px-3 sm:px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Action Buttons Column */}
            <div className="flex flex-wrap items-center gap-2">
              {/* PRIMARY: DOWNLOAD PATCH BUTTON */}
              <button
                onClick={handleDownloadPatch}
                disabled={isDownloading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono-pip font-bold tracking-wide transition shadow-lg ${
                  hasFiles
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black ring-2 ring-amber-400/40 ring-offset-1 ring-offset-zinc-950 animate-bounce-subtle'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                    <span>Сборка архива...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>
                      {hasFiles
                        ? `Скачать патч (${updateStatus.totalChanged} файлов .ZIP)`
                        : 'Скачать архив изменений (.ZIP)'}
                    </span>
                  </>
                )}
              </button>

              {/* DIRECT GITHUB MIGRATION BUTTON */}
              <button
                onClick={() => setShowGitModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono-pip font-bold tracking-wide transition shadow-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40"
              >
                <UploadCloud className="w-4 h-4" />
                <span>🚀 Отправить в GitHub (миграция)</span>
              </button>

              {/* PRIMARY: "PATCH DOWNLOADED" CHECKBOX / CONFIRM BUTTON */}
              <label
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer select-none transition ${
                  isChecked || isConfirming
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30'
                    : downloadSuccessNotice
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 animate-pulse'
                    : 'bg-zinc-950 border-zinc-700 hover:border-zinc-500 text-zinc-300'
                }`}
                title="Поставьте галочку, когда скачали патч: контрольная точка зафиксируется, и кнопка очистится для ожидания следующего патча"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={handleCheckboxToggle}
                  disabled={isConfirming}
                  className="w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500/40 bg-zinc-900 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 text-xs font-mono-pip">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isChecked || isConfirming ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  <span className="font-semibold">
                    {isConfirming ? 'Сброс и фиксация...' : 'Патч скачан (сбросить)'}
                  </span>
                </div>
              </label>

              {/* Direct confirm button (alternative to checkbox) */}
              <button
                onClick={handleConfirmSync}
                disabled={isConfirming}
                className="px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition text-xs font-mono-pip flex items-center gap-1.5"
                title="Сбросить статус изменений и зафиксировать текущую точку"
              >
                <RotateCcw className={`w-3 h-3 ${isConfirming ? 'animate-spin' : ''}`} />
                <span>Очистить статус</span>
              </button>

              {/* Files preview button */}
              {hasFiles && (
                <button
                  onClick={() => setShowFileList(!showFileList)}
                  className="px-2.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-amber-300/90 border border-amber-500/30 hover:border-amber-500/60 transition text-xs font-mono-pip flex items-center gap-1"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Файлы ({updateStatus.totalChanged})</span>
                  {showFileList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {/* Checkpoint & Instructions info */}
            <div className="text-[11px] font-mono-pip text-zinc-400 flex flex-wrap items-center gap-2">
              <span className="text-zinc-500">Последняя синхронизация:</span>
              <span className="text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                {formatCheckpointTime(updateStatus.lastCheckpointIso)}
              </span>
            </div>
          </div>

          {/* Feedback Toasts / Notices */}
          {downloadSuccessNotice && (
            <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-mono-pip flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Патч успешно скачан! Распакуйте его в ваш репозиторий GitHub и поставьте галочку <b>«Патч скачан (сбросить)»</b> выше.
                </span>
              </div>
              <button
                onClick={() => setDownloadSuccessNotice(false)}
                className="text-emerald-400 hover:text-white px-2 py-0.5 text-[10px] underline"
              >
                Понятно
              </button>
            </div>
          )}

          {syncNotice && (
            <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-mono-pip flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          {patchError && (
            <div className="mt-2.5 p-2 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-mono-pip flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{patchError}</span>
            </div>
          )}

          {/* Collapsible Files List */}
          {showFileList && hasFiles && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-zinc-950 border border-amber-500/30 text-xs font-mono-pip max-h-48 overflow-y-auto">
              <div className="text-amber-400 font-bold mb-1.5 flex items-center justify-between">
                <span>Список измененных файлов в будущем патче:</span>
                <span className="text-zinc-500 text-[10px]">{updateStatus.changedFiles.length} шт.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-zinc-300">
                {updateStatus.changedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800/80">
                    <FileCode className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GITHUB DIRECT MIGRATION MODAL */}
      {showGitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative font-mono-pip">
            <button
              onClick={() => setShowGitModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-950/50">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Миграция файлов в GitHub в 1 клик</h3>
                <p className="text-zinc-400 text-xs">Прямой пуш в igormarkin1235-cloud/dusttown-rp-render</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 space-y-2 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-blue-300">
                <Key className="w-4 h-4" />
                <span>Бесплатные токены GitHub:</span>
              </div>
              <p>
                GitHub токены (Personal Access Token) <b>абсолютно бесплатны и бесконечны</b>. Если старый токен истёк или утерян, новый создаётся бесплатно за 20 секунд:
              </p>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=DustTown-Render-AutoPush"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 underline font-bold"
              >
                <span>👉 Создать новый токен на GitHub (готовая ссылка с правами repo)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-[11px] text-zinc-400">
                (Просто перейдите по ссылке выше, прокрутите вниз, нажмите зелёную кнопку <b>Generate token</b> и скопируйте сюда токен начинающийся на <code>ghp_...</code>)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-300 font-bold block">
                GitHub Personal Access Token (PAT):
              </label>
              <input
                type="password"
                value={ghToken}
                onChange={e => setGhToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[10px] text-zinc-500 block">
                Токен сохраняется в вашем браузере, чтобы не вводить его каждый раз.
              </span>
            </div>

            {pushResult && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  pushResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/60 border-red-500/50 text-red-200'
                }`}
              >
                {pushResult.success ? (
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{pushResult.message || 'Успешно отправлено!'}</span>
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      Render уже подхватил коммит и начал автоматический деплой Блэкджек.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-red-300">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Ошибка пуша:</span>
                    </p>
                    <p className="text-[11px] whitespace-pre-wrap">{pushResult.error}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGitModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={handleGitPush}
                disabled={isPushing || !ghToken.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-950/50"
              >
                {isPushing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Синхронизация и отправка...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Запустить миграцию на GitHub</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
