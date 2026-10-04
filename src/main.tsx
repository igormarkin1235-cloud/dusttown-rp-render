import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary] Caught uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('dt_app_state');
      localStorage.removeItem('dt_current_user_id');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-zinc-900 border border-amber-500/40 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
              ☢️
            </div>
            <h1 className="text-xl font-bold font-heading text-amber-400">
              Сбой терминала Пустоши
            </h1>
            <p className="text-xs text-zinc-400 font-mono-pip leading-relaxed">
              Произошла непредвиденная ошибка в интерфейсе. Нажмите кнопку ниже, чтобы перезагрузить терминал и восстановить соединение.
            </p>
            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 text-[10px] text-zinc-500 font-mono text-left max-h-24 overflow-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase text-xs font-mono-pip tracking-wider shadow hover:brightness-110 active:scale-95 transition"
            >
              🔄 Перезагрузить терминал
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
