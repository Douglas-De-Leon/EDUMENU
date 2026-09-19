import React, { useState } from 'react';
import { AdminUser, School } from '../types';

interface MasterDashboardProps {
  schools: School[];
  admins: AdminUser[];
  onAddSchool: (school: School) => void;
  onDeleteSchool: (id: string) => void;
  onAddAdmin: (admin: AdminUser) => void;
  onUpdateAdmin?: (admin: AdminUser) => void;
  onDeleteAdmin: (id: string) => void;
  onSyncDatabase?: () => void;
  isSyncing?: boolean;
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({ 
  schools, 
  admins, 
  onAddSchool, 
  onDeleteSchool, 
  onAddAdmin, 
  onUpdateAdmin,
  onDeleteAdmin,
  onSyncDatabase,
  isSyncing = false
}) => {
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newAdmin, setNewAdmin] = useState<AdminUser>({ id: '', login: '', name: '', password: '', schoolId: '' });
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'schools' | 'admins'>('schools');
  const [schoolToDelete, setSchoolToDelete] = useState<string | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

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
    setAdminError(null);
    if (!newAdmin.login || !newAdmin.name || !newAdmin.password || !newAdmin.schoolId) return;
    
    if (admins.some(a => a.login === newAdmin.login)) {
      setAdminError('Login já cadastrado!');
      return;
    }
    
    onAddAdmin({ ...newAdmin, id: Date.now().toString() });
    setNewAdmin({ id: '', login: '', name: '', password: '', schoolId: '' });
  };

  const handleUpdateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    if (!editingAdmin || !editingAdmin.login || !editingAdmin.name || !editingAdmin.schoolId) return;
    
    if (admins.some(a => a.login === editingAdmin.login && a.id !== editingAdmin.id)) {
      setAdminError('Login já cadastrado para outro gestor!');
      return;
    }
    
    if (onUpdateAdmin) {
      onUpdateAdmin(editingAdmin);
    }
    setEditingAdmin(null);
  };

  const confirmDeleteSchool = (id: string) => {
    setSchoolToDelete(id);
  };

  const confirmDeleteAdmin = (id: string) => {
    setAdminToDelete(id);
  };

  const executeDeleteSchool = () => {
    if (schoolToDelete) {
      onDeleteSchool(schoolToDelete);
      setSchoolToDelete(null);
    }
  };

  const executeDeleteAdmin = () => {
    if (adminToDelete) {
      onDeleteAdmin(adminToDelete);
      setAdminToDelete(null);
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
                      onClick={() => confirmDeleteSchool(school.id)}
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

            {adminError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
                <i className="fas fa-exclamation-circle"></i>
                <span>{adminError}</span>
              </div>
            )}
            
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
                  editingAdmin?.id === admin.id ? (
                    <div key={admin.id} className="md:col-span-2 p-5 bg-white rounded-2xl border-2 border-indigo-500 shadow-lg">
                      <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Editar Gestor</h4>
                      <form onSubmit={handleUpdateAdminSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nome do Gestor</label>
                          <input 
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={editingAdmin.name}
                            onChange={e => setEditingAdmin({...editingAdmin, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Escola</label>
                          <select 
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={editingAdmin.schoolId}
                            onChange={e => setEditingAdmin({...editingAdmin, schoolId: e.target.value})}
                          >
                            <option value="">Selecione a Escola</option>
                            {schools.map(school => (
                              <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Login</label>
                          <input 
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={editingAdmin.login}
                            onChange={e => setEditingAdmin({...editingAdmin, login: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nova Senha (Opcional)</label>
                          <input 
                            type="password"
                            placeholder="Deixe em branco para manter"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={editingAdmin.password || ''}
                            onChange={e => setEditingAdmin({...editingAdmin, password: e.target.value})}
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                          <button 
                            type="button" 
                            onClick={() => setEditingAdmin(null)}
                            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit"
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all"
                          >
                            Salvar Alterações
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div key={admin.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all">
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-800 truncate">{admin.name}</p>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-1 truncate">
                          {getSchoolName(admin.schoolId)}
                        </p>
                        <p className="text-sm text-slate-500 font-mono mt-1 break-all">Login: {admin.login}</p>
                      </div>
                      <div className="flex">
                        <button 
                          onClick={() => setEditingAdmin(admin)}
                          className="ml-2 flex-shrink-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                          title="Editar Gestor"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => confirmDeleteAdmin(admin.id)}
                          className="ml-2 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                          title="Excluir Gestor"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  )
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

      {/* Delete School Confirmation Modal */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-800">Confirmar Exclusão de Escola</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir esta escola? Essa ação removerá o registro da escola do banco de dados imediatamente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSchoolToDelete(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteSchool}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20 transition-all"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Admin Confirmation Modal */}
      {adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto">
              <i className="fas fa-user-times"></i>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-800">Confirmar Exclusão de Gestor</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir o acesso deste gestor escolar? Ele não poderá mais acessar o painel administrativo.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteAdmin}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20 transition-all"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
