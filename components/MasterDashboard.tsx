import React, { useState } from 'react';
import { AdminUser } from '../types';

interface MasterDashboardProps {
  admins: AdminUser[];
  onAddAdmin: (admin: AdminUser) => void;
  onDeleteAdmin: (id: string) => void;
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({ admins, onAddAdmin, onDeleteAdmin }) => {
  const [newAdmin, setNewAdmin] = useState<AdminUser>({ id: '', login: '', name: '', password: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.login || !newAdmin.name || !newAdmin.password) return;

    if (admins.some(a => a.login === newAdmin.login)) {
      alert('Login já cadastrado!');
      return;
    }

    onAddAdmin({ ...newAdmin, id: Date.now().toString() });
    setNewAdmin({ id: '', login: '', name: '', password: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja realmente excluir este gestor?')) {
      onDeleteAdmin(id);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-4xl mx-auto lg:mx-0">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-user-plus text-indigo-500"></i>
          Cadastrar Novo Gestor
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nome Completo</label>
            <input 
              required 
              placeholder="Ex: Maria Souza" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              value={newAdmin.name} 
              onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Login</label>
            <input 
              required 
              placeholder="Ex: maria.admin" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              value={newAdmin.login} 
              onChange={e => setNewAdmin({...newAdmin, login: e.target.value})} 
            />
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Senha</label>
            <input 
              required 
              type="password" 
              placeholder="***" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              value={newAdmin.password} 
              onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} 
            />
          </div>
          <button className="md:col-span-2 lg:col-span-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 mt-4">
            Cadastrar Gestor
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-4xl mx-auto lg:mx-0">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-users-cog text-slate-400"></i>
          Gestores Cadastrados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {admins.length > 0 ? (
            admins.map(admin => (
              <div key={admin.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all">
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-800 truncate">{admin.name}</p>
                  <p className="text-sm text-slate-500 font-mono mt-1 break-all">Login: {admin.login}</p>
                </div>
                <button 
                  onClick={() => handleDelete(admin.id)} 
                  className="ml-4 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                  title="Excluir Gestor"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          ) : (
            <p className="md:col-span-2 text-center text-slate-400 py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Nenhum gestor cadastrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
};
