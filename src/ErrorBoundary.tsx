import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, UploadCloud, RotateCcw, FileArchive } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showMigrationModal: boolean;
  ghToken: string;
  isPushing: boolean;
  pushResult: { success?: boolean; message?: string; error?: string } | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showMigrationModal: false,
    ghToken: localStorage.getItem('dusttown_gh_token') || '',
    isPushing: false,
    pushResult: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetCache = () => {
    try {
      localStorage.removeItem('dusttown_rp_app_state_v3_clean');
      localStorage.removeItem('dt_current_user_id');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  private handlePushFromError = async () => {
    if (!this.state.ghToken.trim()) {
      alert('Укажите ваш GitHub токен (PAT)');
      return;
    }

    this.setState({ isPushing: true, pushResult: null });
    try {
      localStorage.setItem('dusttown_gh_token', this.state.ghToken.trim());
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.state.ghToken.trim(),
          commitMessage: 'fix: repair Dockerfile, npm ci, package.json dependencies and Render deployment'
        })
      });
      const data = await res.json();
      this.setState({ pushResult: data });
    } catch (err: any) {
      this.setState({
        pushResult: {
          success: false,
          error: err?.message || 'Ошибка связи с сервером при отправке в GitHub'
        }
      });
    } finally {
      this.setState({ isPushing: false });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 font-mono-pip">
          <div className="max-w-2xl w-full bg-zinc-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Режим восстановления студии DustTown</h1>
                <p className="text-xs text-zinc-400">Обнаружена ошибка интерфейса. Панель миграции доступна ниже:</p>
              </div>
            </div>

            {/* Error Message */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-red-900/50 text-xs text-red-300 font-mono overflow-x-auto max-h-32">
              <p className="font-bold text-red-400 mb-1">{this.state.error?.name || 'Error'}: {this.state.error?.message}</p>
              <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap">{this.state.error?.stack?.slice(0, 300)}</pre>
            </div>

            {/* Direct Migration Section right from the error screen! */}
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3">
              <div className="flex items-center gap-2 text-blue-300 text-sm font-bold">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                <span>Прямая отправка в GitHub (Render подхватит сразу)</span>
              </div>
              <p className="text-xs text-zinc-300">
                Все файлы в репозитории (включая фикс <code>Dockerfile</code>, <code>package.json</code>, <code>render.yaml</code>) готовы к коммиту.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-bold block">GitHub Personal Access Token (PAT):</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={this.state.ghToken}
                    onChange={(e) => this.setState({ ghToken: e.target.value })}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    onClick={this.handlePushFromError}
                    disabled={this.state.isPushing || !this.state.ghToken.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0"
                  >
                    {this.state.isPushing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>Отправить в GitHub</span>
                  </button>
                </div>
              </div>

              {this.state.pushResult && (
                <div className={`p-3 rounded-xl border text-xs ${this.state.pushResult.success ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200' : 'bg-red-950/70 border-red-500 text-red-200'}`}>
                  {this.state.pushResult.success ? (
                    <div>
                      <p className="font-bold">✅ Успешно отправлено на GitHub!</p>
                      <p className="text-[11px] mt-1 text-zinc-300">Render уже начал автоматический деплой с исправленным Dockerfile.</p>
                      <a href="https://dashboard.render.com/" target="_blank" rel="noreferrer" className="text-amber-400 underline font-bold mt-1 inline-block text-xs">
                        Открыть Render Dashboard
                      </a>
                    </div>
                  ) : (
                    <p>❌ Ошибка: {this.state.pushResult.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800">
              <a
                href="/api/updates/download-patch"
                download="dusttown-update-patch.zip"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <FileArchive className="w-3.5 h-3.5 text-amber-400" />
                <span>Скачать Patch .ZIP</span>
              </a>

              <button
                onClick={this.handleResetCache}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сбросить кэш браузера и перезагрузить</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
