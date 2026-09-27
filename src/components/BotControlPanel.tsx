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
  Cloud
} from 'lucide-react';

interface BotControlPanelProps {
  onOpenMiniApp: () => void;
}

export const BotControlPanel: React.FC<BotControlPanelProps> = ({ onOpenMiniApp }) => {
  const [isPolling, setIsPolling] = useState(true);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [logs, setLogs] = useState<Array<{ id: string; time: string; type: string; text: string }>>([
    { id: '1', time: '12:00:00', type: 'info', text: 'Сервер DustTown RP запущен' },
    { id: '2', time: '12:00:01', type: 'info', text: 'Панель управления Telegram-ботом готова' }
  ]);
  const [tokenConfigured, setTokenConfigured] = useState(false);
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
        setTokenConfigured(Boolean(data.tokenConfigured));
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

  const handleDownloadZip = () => {
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = '/api/download-render-zip';
    link.download = 'dusttown-rp-render.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 5000);
    }, 1200);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim()) return;

    const userMsgId = 'usr_' + Date.now();
    const newChat = [...chatMessages, { id: userMsgId, sender: 'user' as const, text }];
    setChatMessages(newChat);
    setInputMsg('');

    // Simulate bot response to /start
    if (text.trim().startsWith('/start')) {
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
              { label: '⚠️ Сообщить о проблеме', url: 'https://t.me/MrWhitePio' },
              { label: '👥 Присоединиться к комьюнити', url: 'https://t.me/DustTownCollective' }
            ]
          }
        ]);
      }, 500);
    } else {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            sender: 'bot',
            text: `Команда принята. Для входа в игровое меню используйте команду /start.
По всем вопросам обращайтесь к создателю: @MrWhitePio`
          }
        ]);
      }, 500);
    }
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
                DustTown RP Bot • Токен: {tokenConfigured ? 'настроен' : 'не настроен'}
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Download for Render & Start/Stop */}
          <div className="flex flex-wrap items-center gap-2">
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
            <span className="text-[10px] text-zinc-500 font-mono-pip uppercase">Комьюнити DustTown</span>
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

          {/* Big Download Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
                downloadDone
                  ? 'bg-emerald-500 text-black shadow-emerald-950/50'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-950/50 hover:scale-[1.02]'
              }`}
            >
              {downloadDone ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Архив успешно скачан!</span>
                </>
              ) : isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Формирование архива...</span>
                </>
              ) : (
                <>
                  <FileArchive className="w-4 h-4" />
                  <span>Скачать все файлы для Render (.ZIP)</span>
                </>
              )}
            </button>

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
              В <a href="https://render.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Render.com</a> выберите репозиторий (Build: <code className="text-amber-300">npm run build</code>, Start: <code className="text-amber-300">npm start</code>).
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

        {/* Environment Variables */}
        <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono-pip relative z-10">
          <div className="space-y-1">
            <span className="text-zinc-500 uppercase text-[10px]">Переменная окружения для Render (Environment Variables):</span>
            <div className="text-zinc-200 font-bold">
              <span className="text-indigo-400">TELEGRAM_BOT_TOKEN</span> = задайте секрет в настройках Render
            </div>
          </div>
        </div>
      </div>

      {/* 3. Telegram Chat Simulator (Visualizing the 3 buttons upon /start) */}
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
              <div className="text-[10px] text-emerald-400 font-mono-pip">бот онлайн</div>
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

        {/* Input Bar */}
        <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-2">
          <button
            onClick={() => handleSendMessage('/start')}
            className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono-pip text-xs font-bold border border-amber-500/40 flex-shrink-0"
          >
            /start
          </button>
          <input
            type="text"
            placeholder="Напишите команду или сообщение..."
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

      {/* 4. Bot Polling Logs */}
      <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold font-mono-pip text-zinc-400 uppercase">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Логи сервера Telegram Бота</span>
        </div>

        <div className="p-3 rounded-2xl bg-black font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto text-zinc-400 border border-zinc-800">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-2">
              <span className="text-zinc-600">[{log.time}]</span>
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
  );
};
