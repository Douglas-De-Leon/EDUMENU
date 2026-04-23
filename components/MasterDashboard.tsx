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
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-user-plus text-indigo-500"></i>
          Cadastrar Novo Gestor
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome Completo</label>
            <input 
              required 
              placeholder="Ex: Maria Souza" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={newAdmin.name} 
              onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Login</label>
            <input 
              required 
              placeholder="Ex: maria.admin" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={newAdmin.login} 
              onChange={e => setNewAdmin({...newAdmin, login: e.target.value})} 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Senha</label>
            <input 
              required 
              type="password" 
              placeholder="***" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={newAdmin.password} 
              onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} 
            />
          </div>
          <button className="md:col-span-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 mt-2">
            Cadastrar Gestor
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-users-cog text-slate-400"></i>
          Gestores Cadastrados
        </h3>
        <div className="space-y-4">
          {admins.length > 0 ? (
            admins.map(admin => (
              <div key={admin.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                <div>
                  <p className="font-bold text-slate-800">{admin.name}</p>
                  <p className="text-sm text-slate-500 font-mono">Login: {admin.login}</p>
                </div>
                <button 
                  onClick={() => handleDelete(admin.id)} 
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Excluir Gestor"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 py-4">Nenhum gestor cadastrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
};
