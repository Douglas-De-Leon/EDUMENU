import React, { useState } from 'react';
import { AdminUser, School } from '../types';

interface MasterDashboardProps {
  schools: School[];
  admins: AdminUser[];
  onAddSchool: (school: School) => void;
  onDeleteSchool: (id: string) => void;
  onAddAdmin: (admin: AdminUser) => void;
  onDeleteAdmin: (id: string) => void;
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({ 
  schools, 
  admins, 
  onAddSchool, 
  onDeleteSchool, 
  onAddAdmin, 
  onDeleteAdmin 
}) => {
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newAdmin, setNewAdmin] = useState<AdminUser>({ id: '', login: '', name: '', password: '', schoolId: '' });
  const [activeTab, setActiveTab] = useState<'schools' | 'admins'>('schools');

  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;
    
    onAddSchool({
      id: Date.now().toString(),
      name: newSchoolName.trim(),
      createdAt: new Date().toISOString()
    });
    setNewSchoolName('');
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.login || !newAdmin.name || !newAdmin.password || !newAdmin.schoolId) return;
    
    if (admins.some(a => a.login === newAdmin.login)) {
      alert('Login já cadastrado!');
      return;
    }
    
    onAddAdmin({ ...newAdmin, id: Date.now().toString() });
    setNewAdmin({ id: '', login: '', name: '', password: '', schoolId: '' });
  };

  const handleDeleteSchool = (id: string) => {
    if (window.confirm('Atenção: Excluir uma escola não exclui os alunos e votos automaticamente neste MVP. Deseja realmente excluir esta escola?')) {
      onDeleteSchool(id);
    }
  };

  const handleDeleteAdmin = (id: string) => {
    if (window.confirm('Deseja realmente excluir este gestor?')) {
      onDeleteAdmin(id);
    }
  };

  const getSchoolName = (schoolId?: string) => {
    return schools.find(s => s.id === schoolId)?.name || 'Desconhecida';
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      <div className="flex space-x-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('schools')}
          className={`py-3 px-6 font-bold text-sm rounded-t-xl transition-colors ${
            activeTab === 'schools' 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <i className="fas fa-school mr-2"></i> Escolas
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`py-3 px-6 font-bold text-sm rounded-t-xl transition-colors ${
            activeTab === 'admins' 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <i className="fas fa-users-cog mr-2"></i> Gestores
        </button>
      </div>

      {activeTab === 'schools' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i className="fas fa-plus-circle text-indigo-500"></i>
              Cadastrar Nova Escola
            </h3>
            
            <form onSubmit={handleAddSchool} className="flex gap-4 items-end">
              <div className="flex-grow space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nome da Escola</label>
                <input 
                  required
                  placeholder="Ex: Escola Estadual Machado de Assis"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={newSchoolName}
                  onChange={e => setNewSchoolName(e.target.value)}
                />
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 h-[50px] rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap">
                Cadastrar Escola
              </button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i className="fas fa-building text-slate-400"></i>
              Escolas Cadastradas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schools.length > 0 ? (
                schools.map(school => (
                  <div key={school.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all">
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate">{school.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        ID: {school.id} • {admins.filter(a => a.schoolId === school.id).length} gestor(es)
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteSchool(school.id)}
                      className="ml-4 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                      title="Excluir Escola"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))
              ) : (
                <p className="md:col-span-2 text-center text-slate-400 py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Nenhuma escola cadastrada ainda.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admins' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i className="fas fa-user-plus text-indigo-500"></i>
              Cadastrar Novo Gestor
            </h3>
            
            {schools.length === 0 ? (
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm border border-amber-200">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Você precisa cadastrar pelo menos uma escola antes de adicionar gestores.
              </div>
            ) : (
              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Escola</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                    value={newAdmin.schoolId}
                    onChange={e => setNewAdmin({...newAdmin, schoolId: e.target.value})}
                  >
                    <option value="" disabled>Selecione a Escola</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
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
                
                <div className="space-y-1">
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
                
                <button className="md:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 mt-2">
                  Cadastrar Gestor
                </button>
              </form>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
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
                      <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-1 truncate">
                        {getSchoolName(admin.schoolId)}
                      </p>
                      <p className="text-sm text-slate-500 font-mono mt-1 break-all">Login: {admin.login}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="ml-4 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                      title="Excluir Gestor"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))
              ) : (
                <p className="md:col-span-2 text-center text-slate-400 py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Nenhum gestor cadastrado ainda.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
