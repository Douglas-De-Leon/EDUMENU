import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area
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
  // Tabs for managing options or viewing results
  const [activeTab, setActiveTab] = useState<'analytics' | 'options'>('analytics');
  
  // Category filter for the results dashboard
  const [selectedCategory, setSelectedCategory] = useState<'Gremio' | 'Representante' | 'Alimentação' | 'Outros'>('Gremio');

  // New option form state
  const [newMeal, setNewMeal] = useState<Partial<MealOption>>({
    category: 'Gremio',
    active: true
  });
  
  const [mealToDelete, setMealToDelete] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');

  // Auxiliary category labels
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Gremio': return 'Grêmio Escolar';
      case 'Representante': return 'Representante de Classe';
      case 'Alimentação': return 'Alimentação / Merenda';
      case 'Outros': return 'Outros Assuntos';
      default: return cat;
    }
  };

  const getCategoryThemeColor = (cat: string) => {
    switch (cat) {
      case 'Gremio': return '#4F46E5'; // Indigo
      case 'Representante': return '#F59E0B'; // Amber
      case 'Alimentação': return '#10B981'; // Emerald
      case 'Outros': return '#8B5CF6'; // Violet
      default: return '#64748B';
    }
  };

  const categoryOptions = ['Gremio', 'Representante', 'Alimentação', 'Outros'] as const;

  // --- Calculations for the Selected Category ---
  const currentCategoryStats = useMemo(() => {
    // Filter options & selections for active category
    const catOptions = mealOptions.filter(m => m.category === selectedCategory);
    const catSelections = selections.filter(s => s.category === selectedCategory);

    // Votes per Option/Candidate
    const votesByOption = catOptions.map(option => {
      const voteCount = catSelections.filter(s => s.mealId === option.id).length;
      return {
        id: option.id,
        name: option.name,
        identificador: option.calories || 'N/A',
        count: voteCount,
      };
    }).sort((a, b) => b.count - a.count);

    // Votes per Shift (Turno)
    const shifts = ['Manhã', 'Tarde', 'Noite'] as const;
    const votesByShift = shifts.map(shift => {
      const count = catSelections.filter(s => s.turno === shift).length;
      return { name: shift, value: count };
    });

    // Votes per Class (Turma)
    const seriesMap: Record<string, number> = {};
    catSelections.forEach(s => {
      const sName = (s.sala || 'Não definida') + (s.turma ? ` - Turma ${s.turma}` : '');
      seriesMap[sName] = (seriesMap[sName] || 0) + 1;
    });
    const votesByClass = Object.entries(seriesMap).map(([name, count]) => ({
      name,
      votos: count
    })).sort((a, b) => b.votos - a.votos);

    // General Metrics
    const totalVotes = catSelections.length;
    const activeCandidatesCount = catOptions.filter(m => m.active).length;
    const winningOption = votesByOption[0]?.count > 0 ? votesByOption[0] : null;
    
    // Voter turn-out participation percent
    const participationRate = students.length > 0
      ? ((totalVotes / students.length) * 100).toFixed(1)
      : '0.0';

    return {
      votesByOption,
      votesByShift,
      votesByClass,
      totalVotes,
      activeCandidatesCount,
      winningOption,
      participationRate
    };
  }, [selections, mealOptions, selectedCategory, students]);

  // Daily Frequency of all Votes (General history trend)
  const votesTrendData = useMemo(() => {
    const dailyCounts: Record<string, number> = {};
    selections.forEach(s => {
      const dateStr = s.timestamp ? s.timestamp.split('T')[0] : 'Indefinido';
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selections]);

  // Overall statistics and temporal metrics
  const totalGlobalVotes = selections.length;
  const totalRegisteredStudents = students.length;

  const temporalStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Start of the week (Sunday)
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    // Start of the month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Start of the year
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let votesToday = 0;
    let votesWeek = 0;
    let votesMonth = 0;
    let votesYear = 0;

    // Unique voters per period (could count unique matriculas, but assuming 1 vote per category per student, we will count total votes cast in period)
    const uniqueVotersToday = new Set();
    const uniqueVotersWeek = new Set();
    const uniqueVotersMonth = new Set();
    const uniqueVotersYear = new Set();

    let catVotesToday = 0;
    let catVotesWeek = 0;
    let catVotesMonth = 0;
    let catVotesYear = 0;

    selections.forEach(s => {
      const voteDate = new Date(s.timestamp);
      const isToday = s.timestamp && s.timestamp.startsWith(todayStr);
      const isWeek = voteDate >= startOfWeek;
      const isMonth = voteDate >= startOfMonth;
      const isYear = voteDate >= startOfYear;
      const isCategory = s.category === selectedCategory;
      
      if (isToday) {
        votesToday++;
        uniqueVotersToday.add(s.matricula);
        if (isCategory) catVotesToday++;
      }
      if (isWeek) {
        votesWeek++;
        uniqueVotersWeek.add(s.matricula);
        if (isCategory) catVotesWeek++;
      }
      if (isMonth) {
        votesMonth++;
        uniqueVotersMonth.add(s.matricula);
        if (isCategory) catVotesMonth++;
      }
      if (isYear) {
        votesYear++;
        uniqueVotersYear.add(s.matricula);
        if (isCategory) catVotesYear++;
      }
    });

    return {
      votesToday, catVotesToday,
      uniqueVotersToday: uniqueVotersToday.size,
      votesWeek, catVotesWeek,
      uniqueVotersWeek: uniqueVotersWeek.size,
      votesMonth, catVotesMonth,
      uniqueVotersMonth: uniqueVotersMonth.size,
      votesYear, catVotesYear,
      uniqueVotersYear: uniqueVotersYear.size,
    };
  }, [selections, selectedCategory]);

  const handleAddMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeal.name || !newMeal.description) return;
    
    const mealToAdd: MealOption = {
      id: 'opt_' + Date.now().toString(),
      name: newMeal.name,
      description: newMeal.description,
      category: newMeal.category as any,
      calories: newMeal.calories || 'N/A',
      active: true
    };

    onAddMeal(mealToAdd);
    setNewMeal({ category: selectedCategory, active: true, name: '', description: '', calories: '' });
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

  const currentCategoryVotersList = useMemo(() => {
    return selections
      .filter(s => s.category === selectedCategory)
      .map(s => {
        const studentInfo = students.find(stud => stud.matricula === s.matricula);
        const optionInfo = mealOptions.find(o => o.id === s.mealId);
        return {
          id: s.matricula + '_' + s.timestamp,
          matricula: s.matricula,
          studentName: studentInfo ? studentInfo.name : 'Aluno Removido',
          sala: s.sala || (studentInfo ? studentInfo.sala : 'N/A'),
          turma: s.turma || (studentInfo ? studentInfo.turma : 'N/A'),
          turno: s.turno || (studentInfo ? studentInfo.turno : 'N/A'),
          votedFor: optionInfo ? optionInfo.name : 'Opção Removida',
          category: s.category,
          timestamp: s.timestamp
        };
      })
      .filter(item => 
        item.studentName.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.votedFor.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.matricula.includes(historySearch) ||
        item.sala.toLowerCase().includes(historySearch.toLowerCase()) ||
        (item.turma && item.turma.toLowerCase().includes(historySearch.toLowerCase()))
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [selections, mealOptions, selectedCategory, students, historySearch]);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Delete Option Modal */}
      {mealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border border-slate-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <i className="fas fa-trash-alt text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Permanente?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Esta ação apagará esta opção de voto/candidato. Votos vinculados a este identificador podem aparecer desvinculados.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setMealToDelete(null)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={executeDeleteMeal}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab Controller Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200/60 shadow-inner">
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'analytics' 
                ? 'bg-white shadow-sm text-indigo-700 font-black' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <i className="fas fa-chart-pie"></i>
            Apuração Geral e Gráficos
          </button>
          <button 
            onClick={() => setActiveTab('options')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'options' 
                ? 'bg-white shadow-sm text-indigo-700 font-black' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <i className="fas fa-vote-yea"></i>
            Gerenciar Candidatos / Opções
          </button>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
          <span>{totalGlobalVotes} votos totais de {totalRegisteredStudents} estudantes</span>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Global Temporal Metrics Row */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-globe-americas"></i> Engajamento Global vs Categoria ({getCategoryLabel(selectedCategory)})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-5 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-between">
                <i className="fas fa-calendar-day absolute -bottom-2 -right-2 text-6xl opacity-10"></i>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-100 mb-1">Hoje</p>
                <div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-extrabold">{temporalStats.votesToday}</span>
                    <span className="text-xs font-medium text-indigo-100 mb-1.5 uppercase tracking-wide">Votos Totais</span>
                  </div>
                  <p className="text-xs font-medium text-indigo-100 bg-black/10 inline-block px-2 py-0.5 rounded-full mb-3">
                    {temporalStats.uniqueVotersToday} alunos ({((temporalStats.uniqueVotersToday / (totalRegisteredStudents || 1)) * 100).toFixed(1)}%)
                  </p>
                  <div className="border-t border-white/20 pt-2 flex justify-between items-center text-sm">
                    <span className="font-medium text-indigo-100">Nesta Categoria:</span>
                    <span className="font-bold">{temporalStats.catVotesToday} ({temporalStats.votesToday > 0 ? ((temporalStats.catVotesToday / temporalStats.votesToday) * 100).toFixed(0) : 0}%)</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-between">
                <i className="fas fa-calendar-week absolute -bottom-2 -right-2 text-6xl opacity-10"></i>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-100 mb-1">Na Semana</p>
                <div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-extrabold">{temporalStats.votesWeek}</span>
                    <span className="text-xs font-medium text-emerald-100 mb-1.5 uppercase tracking-wide">Votos Totais</span>
                  </div>
                  <p className="text-xs font-medium text-emerald-100 bg-black/10 inline-block px-2 py-0.5 rounded-full mb-3">
                    {temporalStats.uniqueVotersWeek} alunos ({((temporalStats.uniqueVotersWeek / (totalRegisteredStudents || 1)) * 100).toFixed(1)}%)
                  </p>
                  <div className="border-t border-white/20 pt-2 flex justify-between items-center text-sm">
                    <span className="font-medium text-emerald-100">Nesta Categoria:</span>
                    <span className="font-bold">{temporalStats.catVotesWeek} ({temporalStats.votesWeek > 0 ? ((temporalStats.catVotesWeek / temporalStats.votesWeek) * 100).toFixed(0) : 0}%)</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-between">
                <i className="fas fa-calendar-alt absolute -bottom-2 -right-2 text-6xl opacity-10"></i>
                <p className="text-xs font-black uppercase tracking-widest text-amber-100 mb-1">No Mês</p>
                <div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-extrabold">{temporalStats.votesMonth}</span>
                    <span className="text-xs font-medium text-amber-100 mb-1.5 uppercase tracking-wide">Votos Totais</span>
                  </div>
                  <p className="text-xs font-medium text-amber-100 bg-black/10 inline-block px-2 py-0.5 rounded-full mb-3">
                    {temporalStats.uniqueVotersMonth} alunos ({((temporalStats.uniqueVotersMonth / (totalRegisteredStudents || 1)) * 100).toFixed(1)}%)
                  </p>
                  <div className="border-t border-white/20 pt-2 flex justify-between items-center text-sm">
                    <span className="font-medium text-amber-100">Nesta Categoria:</span>
                    <span className="font-bold">{temporalStats.catVotesMonth} ({temporalStats.votesMonth > 0 ? ((temporalStats.catVotesMonth / temporalStats.votesMonth) * 100).toFixed(0) : 0}%)</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-5 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-between">
                <i className="fas fa-calendar absolute -bottom-2 -right-2 text-6xl opacity-10"></i>
                <p className="text-xs font-black uppercase tracking-widest text-purple-100 mb-1">No Ano</p>
                <div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-extrabold">{temporalStats.votesYear}</span>
                    <span className="text-xs font-medium text-purple-100 mb-1.5 uppercase tracking-wide">Votos Totais</span>
                  </div>
                  <p className="text-xs font-medium text-purple-100 bg-black/10 inline-block px-2 py-0.5 rounded-full mb-3">
                    {temporalStats.uniqueVotersYear} alunos ({((temporalStats.uniqueVotersYear / (totalRegisteredStudents || 1)) * 100).toFixed(1)}%)
                  </p>
                  <div className="border-t border-white/20 pt-2 flex justify-between items-center text-sm">
                    <span className="font-medium text-purple-100">Nesta Categoria:</span>
                    <span className="font-bold">{temporalStats.catVotesYear} ({temporalStats.votesYear > 0 ? ((temporalStats.catVotesYear / temporalStats.votesYear) * 100).toFixed(0) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Horizontal Interactive Switcher */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Filtrar Apuração por Categoria</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categoryOptions.map((cat) => {
                const isActive = selectedCategory === cat;
                const themeColor = getCategoryThemeColor(cat);
                const votesCount = selections.filter(s => s.category === cat).length;
                
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ borderColor: isActive ? themeColor : undefined }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      isActive 
                        ? 'bg-white ring-4 ring-indigo-500/5' 
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        cat === 'Gremio' ? 'bg-indigo-50 text-indigo-600' :
                        cat === 'Representante' ? 'bg-amber-50 text-amber-600' :
                        cat === 'Alimentação' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        <i className={`fas ${
                          cat === 'Gremio' ? 'fa-id-badge' :
                          cat === 'Representante' ? 'fa-user-friends' :
                          cat === 'Alimentação' ? 'fa-apple-alt' : 'fa-clipboard-list'
                        }`}></i>
                      </span>
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {votesCount} {votesCount === 1 ? 'voto' : 'votos'}
                      </span>
                    </div>
                    <span className="block font-black text-slate-800 text-sm leading-tight">
                      {getCategoryLabel(cat)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Participação na Categoria</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-800">{currentCategoryStats.participationRate}%</span>
                </div>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, parseFloat(currentCategoryStats.participationRate))}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Votos Registrados</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800">{currentCategoryStats.totalVotes}</span>
                <span className="text-slate-400 text-xs font-medium">de {totalRegisteredStudents} alunos</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Opções Habilitadas</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800">{currentCategoryStats.activeCandidatesCount}</span>
                <span className="text-slate-400 text-xs font-medium">candidatos ativos</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm" style={{ borderLeft: `4px solid ${getCategoryThemeColor(selectedCategory)}` }}>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Líder Atual</p>
              <p className="text-lg font-bold text-slate-800 truncate">
                {currentCategoryStats.winningOption ? currentCategoryStats.winningOption.name : 'Nenhum voto'}
              </p>
              <p className="text-xs text-indigo-600 font-bold mt-1 font-mono">
                {currentCategoryStats.winningOption ? `${currentCategoryStats.winningOption.count} votos (${((currentCategoryStats.winningOption.count / (currentCategoryStats.totalVotes || 1)) * 100).toFixed(0)}%)` : '-'}
              </p>
            </div>
          </div>

          {/* Graphical Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Bar Chart: Candidates distribution */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Resultado das Urnas</h3>
                  <p className="text-xs text-slate-400">Distribuição quantitativa de votos para {getCategoryLabel(selectedCategory)}</p>
                </div>
                <span className="bg-indigo-50 text-indigo-600 font-bold text-xs p-1 px-2.5 rounded-full uppercase tracking-wider">Tempo Real</span>
              </div>
              <div className="h-72 w-full pt-4">
                {currentCategoryStats.votesByOption.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentCategoryStats.votesByOption} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
                      <XAxis type="number" scale="linear" allowDecimals={false} stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={90} 
                        fontSize={10} 
                        tick={{ fill: '#475569', fontWeight: 'bold' }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(val: any) => [`${val} votos`, 'Contagem']}
                      />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                        {currentCategoryStats.votesByOption.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <i className="fas fa-box-open text-4xl mb-2"></i>
                    <p className="text-sm">Nenhuma opção cadastrada nesta categoria.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shift Breakdown (Turnos) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Participação por Turno</h3>
                <p className="text-xs text-slate-400">Comparação de engajamento por período</p>
              </div>

              <div className="h-48 w-full flex items-center justify-center">
                {currentCategoryStats.totalVotes > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentCategoryStats.votesByShift}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {currentCategoryStats.votesByShift.map((entry, index) => {
                          const shiftColors: Record<string, string> = { 'Manhã': '#0EA5E9', 'Tarde': '#F43F5E', 'Noite': '#6366F1' };
                          return <Cell key={`cell-${index}`} fill={shiftColors[entry.name] || COLORS[index]} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val} votos`]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-400 py-10">
                    <i className="fas fa-history text-3xl mb-2"></i>
                    <p className="text-xs">Nenhum voto computado ainda</p>
                  </div>
                )}
              </div>

              <div className="flex justify-around border-t border-slate-50 pt-4">
                {currentCategoryStats.votesByShift.map((entry, idx) => {
                  const shiftColorsText: Record<string, string> = { 'Manhã': 'text-sky-500', 'Tarde': 'text-rose-500', 'Noite': 'text-indigo-500' };
                  const percent = currentCategoryStats.totalVotes > 0 
                    ? ((entry.value / currentCategoryStats.totalVotes) * 100).toFixed(0) 
                    : 0;
                  return (
                    <div key={entry.name} className="text-center">
                      <p className="text-xs text-slate-400 font-bold">{entry.name}</p>
                      <p className={`text-sm font-black ${shiftColorsText[entry.name]}`}>{percent}%</p>
                      <span className="text-[10px] text-slate-400 font-mono">({entry.value} v)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Class Breakdown (Séries) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Ranking por Turmas</h3>
                <p className="text-xs text-slate-400">As turmas com maior índice de votos participativos</p>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {currentCategoryStats.votesByClass.length > 0 ? (
                  currentCategoryStats.votesByClass.map((sala, idx) => {
                    const totalPot = currentCategoryStats.totalVotes || 1;
                    const percent = ((sala.votos / totalPot) * 100).toFixed(0);
                    return (
                      <div key={sala.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{sala.name}</span>
                          <span>{sala.votos} votos ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${percent}%`,
                              backgroundColor: COLORS[idx % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-400 py-12">
                    <p className="text-sm">Aguardando votos das séries.</p>
                  </div>
                )}
              </div>
            </div>

            {/* General historical voting frequency tracker */}
            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Frequência Histórica (Série Temporal)</h3>
                <p className="text-xs text-slate-400">Total de votos diários monitorados pelo sistema</p>
              </div>
              <div className="h-56 w-full pt-2">
                {votesTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={votesTrendData}>
                      <defs>
                        <linearGradient id="gradientVotes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" fontSize={9} tick={{ fill: '#64748b' }} axisLine={false} />
                      <YAxis fontSize={9} tick={{ fill: '#64748b' }} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#gradientVotes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    Histórico vazio. Registre votos para popular a série temporal.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed audit list / Histórico de Votos */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-history text-indigo-500"></i>
                  Auditoria / Log Histórico de Votos
                </h3>
                <p className="text-xs text-slate-400">Lista cronológica dos votos apurados na categoria selecionada</p>
              </div>
              <div className="relative w-full sm:w-80">
                <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Buscar por aluno, série ou candidato..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-150">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Matrícula</th>
                    <th className="p-4">Estudante</th>
                    <th className="p-4">Série</th>
                    <th className="p-4">Turma</th>
                    <th className="p-4">Turno</th>
                    <th className="p-4">Candidato / Prato Escolhido</th>
                    <th className="p-4">Carimbo de Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {currentCategoryVotersList.length > 0 ? (
                    currentCategoryVotersList.map(vote => (
                      <tr key={vote.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs">{vote.matricula}</td>
                        <td className="p-4 font-bold text-slate-800">{vote.studentName}</td>
                        <td className="p-4 text-slate-600 font-semibold">{vote.sala}</td>
                        <td className="p-4 text-slate-600 font-semibold">{vote.turma || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            vote.turno === 'Manhã' ? 'bg-sky-100 text-sky-700' :
                            vote.turno === 'Tarde' ? 'bg-rose-100 text-rose-700' :
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {vote.turno}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-900 border-l-2" style={{ borderLeftColor: getCategoryThemeColor(selectedCategory) }}>
                          {vote.votedFor}
                        </td>
                        <td className="p-4 text-xs font-mono text-slate-400">
                          {new Date(vote.timestamp).toLocaleDateString('pt-BR')} {new Date(vote.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Nenhum registro de voto encontrado para a busca atual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'options' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form to Register New Options */}
          <section className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit sticky top-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-plus-circle text-indigo-500"></i>
              Criar Nova Opção de Voto
            </h3>
            
            <form onSubmit={handleAddMealSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Nome Completo / Título</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={newMeal.name || ''}
                  onChange={e => setNewMeal({...newMeal, name: e.target.value})}
                  required
                  placeholder="Ex: Chapa A, João da Silva, Feijoada..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Categoria de Votação</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={newMeal.category || 'Gremio'}
                    onChange={e => setNewMeal({...newMeal, category: e.target.value as any})}
                    required
                  >
                    <option value="Gremio">🗳️ Grêmio Escolar</option>
                    <option value="Representante">👤 Representante de Classe</option>
                    <option value="Alimentação">🍎 Alimentação / Merenda</option>
                    <option value="Outros">📋 Outros Assuntos</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Capa / Identificador Único</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={newMeal.calories || ''}
                    onChange={e => setNewMeal({...newMeal, calories: e.target.value})}
                    placeholder="Ex: Chapa 10, Nº 205, Opção B"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Propostas / Descrição Detalhada</label>
                <textarea 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-28 text-sm"
                  value={newMeal.description || ''}
                  onChange={e => setNewMeal({...newMeal, description: e.target.value})}
                  required
                  placeholder="Descreva as intenções, propostas, pratos ou detalhes dessa candidatura..."
                />
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 text-sm">
                Gravar Opção na Urna
              </button>
            </form>
          </section>

          {/* Active Candidates / Options list */}
          <section className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-list-ul text-slate-400"></i>
              Lista de Opções Cadastradas
              <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full ml-2">
                {mealOptions.length}
              </span>
            </h3>

            <div className="space-y-4">
              {categoryOptions.map(cat => {
                const filteredOptions = mealOptions.filter(m => m.category === cat);
                if (filteredOptions.length === 0) return null;

                return (
                  <div key={cat} className="space-y-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryThemeColor(cat) }}></span>
                      {getCategoryLabel(cat)}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredOptions.map(m => (
                        <div key={m.id} className="flex flex-col justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150/80">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                m.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {m.active ? 'ATIVO' : 'SUSPENSO'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ID: {m.calories || 'N/A'}</span>
                            </div>
                            <h5 className="font-bold text-slate-800 leading-tight mb-1">{m.name}</h5>
                            <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed">{m.description}</p>
                          </div>

                          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200/50">
                            <button 
                              type="button"
                              onClick={() => toggleMealStatus(m.id)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                                m.active 
                                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700' 
                                  : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'
                              }`}
                            >
                              <i className={`fas ${m.active ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              {m.active ? 'Suspender' : 'Habilitar'}
                            </button>
                            <button 
                              type="button"
                              onClick={() => confirmDeleteMeal(m.id)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center gap-1.5 transition-colors"
                            >
                              <i className="fas fa-trash"></i>
                              Deletar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      )}
    </div>
  );
};
