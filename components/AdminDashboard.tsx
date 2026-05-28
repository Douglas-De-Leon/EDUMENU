
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { Selection, MealOption, Student } from '../types';

interface AdminDashboardProps {
  selections: Selection[];
  mealOptions: MealOption[];
  onAddMeal: (meal: MealOption) => void;
  onUpdateMeal: (meal: MealOption) => void;
  onDeleteMeal: (id: string) => void;
  students: Student[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  selections, 
  mealOptions, 
  onAddMeal,
  onUpdateMeal,
  onDeleteMeal,
  students 
}) => {
  const [newMeal, setNewMeal] = useState<Partial<MealOption>>({
    category: 'Padrao',
    active: true
  });
  const [mealToDelete, setMealToDelete] = useState<string | null>(null);

  // --- Analytics Logic ---
  const stats = useMemo(() => {
    const mealCounts = mealOptions.map(m => ({
      name: m.name.split(':')[0],
      count: selections.filter(s => s.mealId === m.id).length,
      category: m.category
    })).sort((a, b) => b.count - a.count);

    // Group by day for attendance chart
    const dailyAttendance: Record<string, number> = {};
    selections.forEach(s => {
      const date = s.timestamp.split('T')[0];
      dailyAttendance[date] = (dailyAttendance[date] || 0) + 1;
    });

    const attendanceData = Object.entries(dailyAttendance)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const avgStudents = attendanceData.length > 0 
      ? (attendanceData.reduce((acc, curr) => acc + curr.count, 0) / attendanceData.length).toFixed(1)
      : 0;

    return { mealCounts, attendanceData, avgStudents };
  }, [selections, mealOptions]);

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeal.name || !newMeal.description) return;
    
    const mealToAdd: MealOption = {
      id: Date.now().toString(),
      name: newMeal.name,
      description: newMeal.description,
      category: newMeal.category as any,
      calories: newMeal.calories || 'N/A',
      active: true
    };

    onAddMeal(mealToAdd);
    setNewMeal({ category: 'Padrao', active: true });
  };

  const toggleMealStatus = (id: string) => {
    const targetMeal = mealOptions.find(m => m.id === id);
    if (targetMeal) {
      onUpdateMeal({ ...targetMeal, active: !targetMeal.active });
    }
  };

  const confirmDeleteMeal = (id: string) => {
    setMealToDelete(id);
  };

  const executeDeleteMeal = () => {
    if (mealToDelete) {
      onDeleteMeal(mealToDelete);
      setMealToDelete(null);
    }
  };

  const cancelDeleteMeal = () => {
    setMealToDelete(null);
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Delete Confirmation Modal */}
      {mealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-3xl shadow-xl max-w-sm w-full mx-4 transform transition-all scale-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Tem Certeza?</h3>
              <p className="text-slate-500 text-sm">
                Esta ação não pode ser desfeita. A refeição será removida permanentemente do sistema.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={cancelDeleteMeal}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeDeleteMeal}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Média de Alunos/Dia</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-indigo-600">{stats.avgStudents}</span>
            <span className="text-slate-400 font-medium">estudantes</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total de Pedidos</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-600">{selections.length}</span>
            <span className="text-slate-400 font-medium">refeições</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Alunos Cadastrados</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-600">{students.length}</span>
            <span className="text-slate-400 font-medium">perfis</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Meal Management */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-plus-circle text-indigo-500"></i>
            Cadastrar Nova Refeição
          </h3>
          <form onSubmit={handleAddMeal} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome do Prato</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newMeal.name || ''}
                  onChange={e => setNewMeal({...newMeal, name: e.target.value})}
                  required
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Calorias (aprox)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newMeal.calories || ''}
                  onChange={e => setNewMeal({...newMeal, calories: e.target.value})}
                  placeholder="Ex: 450 kcal"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Descrição/Ingredientes</label>
              <textarea 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                value={newMeal.description || ''}
                onChange={e => setNewMeal({...newMeal, description: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Categoria</label>
              <div className="flex flex-wrap gap-4">
                {['Padrao', 'Vegetariana', 'Especial'].map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="category"
                      checked={newMeal.category === cat}
                      onChange={() => setNewMeal({...newMeal, category: cat as any})}
                      className="text-indigo-600"
                    />
                    <span className="text-sm font-medium text-slate-600">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95">
              Salvar Refeição
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Pratos Ativos no Sistema</h4>
            <div className="space-y-3">
              {mealOptions.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${m.active ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                      <h5 className="font-bold text-slate-800">{m.name}</h5>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-xs">{m.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleMealStatus(m.id)}
                      className={`p-2 rounded-lg transition-colors ${m.active ? 'text-green-600 hover:bg-green-100' : 'text-slate-400 hover:bg-slate-200'}`}
                      title={m.active ? "Desativar" : "Ativar"}
                    >
                      <i className={`fas ${m.active ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </button>
                    <button 
                      onClick={() => confirmDeleteMeal(m.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="space-y-8">
          {/* Historical Attendance */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i className="fas fa-users text-emerald-500"></i>
              Frequência de Alunos
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.attendanceData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} />
                  <YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#10B981" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center font-bold uppercase tracking-widest">Acompanhamento Diário de Refeições</p>
          </div>

          {/* Popularity Ranking */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i className="fas fa-trophy text-amber-500"></i>
              Rank de Popularidade
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.mealCounts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats.mealCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.category === 'Padrao' ? '#4F46E5' : entry.category === 'Vegetariana' ? '#10B981' : '#F59E0B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center font-bold uppercase tracking-widest">Os pratos mais pedidos na história do portal</p>
          </div>
        </section>
      </div>
    </div>
  );
};
