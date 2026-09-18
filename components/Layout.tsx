
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: 'student' | 'admin' | 'master' | null;
  onSync?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children,
  userRole,
  onSync,
  isSyncing = false,
  lastSyncTime
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <i className="fas fa-ticket-alt text-2xl rotate-[-15deg] inline-block text-amber-300"></i>
            <span className="text-xl font-black tracking-tight">EDUVOTAÇÃO</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Economia de Leituras & Botão de Sincronização para Gestores */}
            {(userRole === 'admin' || userRole === 'master') && onSync && (
              <div className="flex items-center gap-2 bg-indigo-700/60 border border-indigo-400/30 px-3 py-1.5 rounded-xl text-xs">
                <span className="hidden md:inline-flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                  <i className="fas fa-shield-alt text-xs"></i>
                  Economia de Leituras Ativa
                </span>
                {lastSyncTime && (
                  <span className="hidden sm:inline text-indigo-200 text-[11px]">
                    • Atualizado às {lastSyncTime}
                  </span>
                )}
                <button
                  onClick={onSync}
                  disabled={isSyncing}
                  title="Sincronizar dados em tempo real com o Firebase"
                  className="bg-white/15 hover:bg-white/25 active:scale-95 disabled:opacity-50 text-white font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-[11px] shadow-xs"
                >
                  <i className={`fas fa-sync-alt ${isSyncing ? 'animate-spin' : ''}`}></i>
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>
              </div>
            )}

            <div className="text-xs font-medium opacity-90 hidden lg:block text-indigo-100">
              Portal de Votação Estudantil
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} EDUVOTAÇÃO. Portal de Decisão e Participação Escolar.
        </div>
      </footer>
    </div>
  );
};

