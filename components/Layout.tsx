
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <i className="fas fa-ticket-alt text-2xl rotate-[-15deg] inline-block text-amber-300"></i>
            <h1 className="text-xl font-bold tracking-tight">EDUVOTAÇÃO</h1>
          </div>
          <div className="text-sm font-medium opacity-90 hidden sm:block">
            Portal da Merenda Escolar
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} EDUVOTAÇÃO. Sistema de Gestão de Refeitório.
        </div>
      </footer>
    </div>
  );
};
