import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { Selection, MealOption, Student, VotingSession, AttendanceRecord } from '../types';

interface IntelligentDecisionDashboardProps {
  selections: Selection[];
  mealOptions: MealOption[];
  votingSessions: VotingSession[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onNavigateToVoting?: () => void;
  onReuseVoting?: (session: VotingSession, targetDate: string) => void;
}

const PALETTE = ['#4F46E5', '#10B981', '#F59E0B', '#0EA5E9', '#8B5CF6', '#EC4899', '#14B8A6'];

export const IntelligentDecisionDashboard: React.FC<IntelligentDecisionDashboardProps> = ({
  selections,
  mealOptions,
  votingSessions,
  students,
  attendanceRecords,
  onNavigateToVoting,
  onReuseVoting
}) => {
  // Decision Study Modes
  const [activeDecisionTab, setActiveDecisionTab] = useState<'nutrition' | 'strategic' | 'longitudinal' | 'simulator'>('nutrition');

  // Dynamic Categories from available data
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    votingSessions.forEach(s => s.category && set.add(s.category));
    mealOptions.forEach(m => m.category && set.add(m.category));
    selections.forEach(s => s.category && set.add(s.category));
    const list = Array.from(set);
    return list.length > 0 ? list : ['Alimentação', 'Gremio', 'Representante', 'Outros'];
  }, [votingSessions, mealOptions, selections]);

  // Selected Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return availableCategories.includes('Alimentação') ? 'Alimentação' : availableCategories[0] || 'Geral';
  });

  // Selected specific session (or all in category)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');

  // Replication modal/input state
  const [targetReplicationDate, setTargetReplicationDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [replicationSuccess, setReplicationSuccess] = useState<string | null>(null);

  // Simulator Sliders State
  const [simPresenceRate, setSimPresenceRate] = useState<number>(85);
  const [simOptionPreference, setSimOptionPreference] = useState<number>(75);
  const [simSafetyMargin, setSimSafetyMargin] = useState<number>(5);

  // Filtered Sessions for the selected Category
  const sessionsInCategory = useMemo(() => {
    return votingSessions.filter(s => s.category === selectedCategory);
  }, [votingSessions, selectedCategory]);

  // Active Session
  const activeSession = useMemo(() => {
    if (selectedSessionId !== 'all') {
      return votingSessions.find(s => s.id === selectedSessionId) || null;
    }
    return sessionsInCategory[0] || null;
  }, [votingSessions, selectedSessionId, sessionsInCategory]);

  // Total Students
  const totalStudents = students.length;

  // Latest attendance record
  const latestAttendance = useMemo(() => {
    if (attendanceRecords.length === 0) return null;
    const sorted = [...attendanceRecords].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0];
  }, [attendanceRecords]);

  const latestPresentCount = latestAttendance ? latestAttendance.presentMatriculas.length : Math.round(totalStudents * 0.85);

  // 1. INTELLIGENCE ENGINE: NUTRITION & LUNCH OPTIMIZATION
  const nutritionIntelligence = useMemo(() => {
    // Votes in Alimentação or current session
    const nutritionVotes = selections.filter(s => {
      if (activeSession && selectedSessionId !== 'all') {
        return s.votingSessionId === activeSession.id;
      }
      return s.category === 'Alimentação' || s.category === selectedCategory;
    });

    const voteCounts: Record<string, number> = {};
    nutritionVotes.forEach(v => {
      voteCounts[v.mealId] = (voteCounts[v.mealId] || 0) + 1;
    });

    const totalVotesInScope = nutritionVotes.length;

    // Detect options with "Almoço", "Almoco", "Sim", "Comer", "Merenda"
    let lunchOptionVotes = 0;
    const optionAnalysis = mealOptions
      .filter(m => m.category === selectedCategory || (activeSession && activeSession.optionIds.includes(m.id)))
      .map(opt => {
        const count = voteCounts[opt.id] || 0;
        const pct = totalVotesInScope > 0 ? (count / totalVotesInScope) * 100 : 0;
        const isLunch = /almoç|almoc|sim|quero|refeiç|cardápio/i.test(opt.name);
        if (isLunch) lunchOptionVotes += count;

        return {
          id: opt.id,
          name: opt.name,
          count,
          pct: Number(pct.toFixed(1)),
          isLunch
        };
      }).sort((a, b) => b.count - a.count);

    const lunchAdhesionRate = totalVotesInScope > 0
      ? (lunchOptionVotes / totalVotesInScope)
      : 0.78; // 78% default realistic estimation

    // Projected meals based on confirmed presence in classroom
    const estimatedMealsToPrepare = Math.round(latestPresentCount * lunchAdhesionRate);
    const unservedMealsAvoided = Math.max(0, totalStudents - estimatedMealsToPrepare);

    // Waste reduction estimates: 0.35kg of food and R$ 6.50 per meal saved
    const foodSavedKg = Number((unservedMealsAvoided * 0.35).toFixed(1));
    const budgetSavedBRL = Number((unservedMealsAvoided * 6.50).toFixed(2));

    // Ingredient breakdown per 100 meals
    const ratio = estimatedMealsToPrepare / 100;
    const ingredients = [
      { item: 'Arroz Polido', qtd: (12 * ratio).toFixed(1), unit: 'kg' },
      { item: 'Feijão Carioca', qtd: (6 * ratio).toFixed(1), unit: 'kg' },
      { item: 'Proteína Principal (Carne/Frango)', qtd: (18 * ratio).toFixed(1), unit: 'kg' },
      { item: 'Legumes e Hortaliças', qtd: (14 * ratio).toFixed(1), unit: 'kg' },
      { item: 'Sobremesa / Fruta da Estação', qtd: estimatedMealsToPrepare, unit: 'unidades' }
    ];

    return {
      totalVotesInScope,
      optionAnalysis,
      lunchOptionVotes,
      lunchAdhesionRate: Number((lunchAdhesionRate * 100).toFixed(1)),
      estimatedMealsToPrepare,
      unservedMealsAvoided,
      foodSavedKg,
      budgetSavedBRL,
      ingredients
    };
  }, [selections, activeSession, selectedSessionId, selectedCategory, mealOptions, totalStudents, latestPresentCount]);

  // 2. STRATEGIC DECISION RECOMMENDATIONS ENGINE
  const strategicRecommendations = useMemo(() => {
    const votesInCat = selections.filter(s => s.category === selectedCategory);
    const uniqueVoters = new Set(votesInCat.map(s => s.matricula)).size;
    const quorumPct = totalStudents > 0 ? (uniqueVoters / totalStudents) * 100 : 0;

    const list: Array<{ title: string; category: string; description: string; priority: 'Alta' | 'Média' | 'Informativa'; icon: string; color: string }> = [];

    if (selectedCategory === 'Alimentação') {
      list.push({
        title: 'Dimensionamento Otimizado da Merenda Escolar',
        category: selectedCategory,
        description: `Com base em ${nutritionIntelligence.lunchAdhesionRate}% de adesão dos discentes presentes, preparar exatamente ${nutritionIntelligence.estimatedMealsToPrepare} refeições para evitar o desperdício de ${nutritionIntelligence.foodSavedKg} kg de alimentos.`,
        priority: 'Alta',
        icon: 'fa-utensils',
        color: 'emerald'
      });
      list.push({
        title: 'Planejamento de Compras com Fornecedores Locais',
        category: selectedCategory,
        description: `A economia orçamentária projetada é de R$ ${nutritionIntelligence.budgetSavedBRL}. Utilize a previsão quantificada de insumos para fechar pedidos com a agricultura familiar semanalmente.`,
        priority: 'Média',
        icon: 'fa-shopping-basket',
        color: 'amber'
      });
    } else {
      list.push({
        title: `Índice de Participação Democrática em ${selectedCategory}`,
        category: selectedCategory,
        description: `A adesão registrada é de ${quorumPct.toFixed(1)}% (${uniqueVoters} de ${totalStudents} alunos). ${quorumPct >= 60 ? 'Quórum representativo atingido!' : 'Recomenda-se incentivar a participação nas turmas com menor frequência.'}`,
        priority: quorumPct < 50 ? 'Alta' : 'Informativa',
        icon: 'fa-vote-yea',
        color: 'indigo'
      });
    }

    // Engagement per serie check
    const seriesVotes: Record<string, number> = { '1º Ano': 0, '2º Ano': 0, '3º Ano': 0 };
    votesInCat.forEach(s => {
      if (s.sala && seriesVotes[s.sala] !== undefined) seriesVotes[s.sala]++;
    });

    const lowestSerie = Object.entries(seriesVotes).sort((a, b) => a[1] - b[1])[0];
    if (lowestSerie && lowestSerie[1] < uniqueVoters * 0.2 && uniqueVoters > 10) {
      list.push({
        title: `Reforço de Engajamento no ${lowestSerie[0]}`,
        category: selectedCategory,
        description: `O ${lowestSerie[0]} registrou apenas ${lowestSerie[1]} votos na categoria ${selectedCategory}. Agendar comunicação nas salas durante o início do turno.`,
        priority: 'Média',
        icon: 'fa-bullhorn',
        color: 'rose'
      });
    }

    return list;
  }, [selections, selectedCategory, totalStudents, nutritionIntelligence]);

  // 3. LONGITUDINAL MEASUREMENT (Multi-day comparison of sessions in the same category)
  const longitudinalData = useMemo(() => {
    const sessions = sessionsInCategory.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    if (sessions.length <= 1) {
      // Build points based on dates recorded in selections for this category
      const datesMap: Record<string, number> = {};
      selections.filter(s => s.category === selectedCategory).forEach(s => {
        const d = s.timestamp ? s.timestamp.split('T')[0] : 'Geral';
        datesMap[d] = (datesMap[d] || 0) + 1;
      });

      return Object.entries(datesMap).map(([date, votos]) => {
        const [y, m, d] = date.split('-').map(Number);
        const label = !isNaN(y) ? new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : date;
        return {
          date: label,
          votos,
          quorum: totalStudents > 0 ? Number(((votos / totalStudents) * 100).toFixed(1)) : 0
        };
      }).sort((a, b) => a.date.localeCompare(b.date));
    }

    return sessions.map(sess => {
      const sessVotes = selections.filter(s => s.votingSessionId === sess.id || (!s.votingSessionId && s.category === sess.category && s.timestamp?.startsWith(sess.date)));
      const count = sessVotes.length;
      const [y, m, d] = (sess.date || '').split('-').map(Number);
      const label = !isNaN(y) ? new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : sess.title.slice(0, 15);
      return {
        date: label,
        sessionTitle: sess.title,
        votos: count,
        quorum: totalStudents > 0 ? Number(((count / totalStudents) * 100).toFixed(1)) : 0
      };
    });
  }, [sessionsInCategory, selections, selectedCategory, totalStudents]);

  // 4. SIMULATOR CALCULATIONS
  const simResults = useMemo(() => {
    const simPresentCount = Math.round(totalStudents * (simPresenceRate / 100));
    const simAdhesionCount = Math.round(simPresentCount * (simOptionPreference / 100));
    const simSafetyBuffer = Math.round(simAdhesionCount * (simSafetyMargin / 100));
    const simFinalPreparation = simAdhesionCount + simSafetyBuffer;
    const simAvoided = Math.max(0, totalStudents - simFinalPreparation);
    const simKgSaved = Number((simAvoided * 0.35).toFixed(1));
    const simBrlSaved = Number((simAvoided * 6.50).toFixed(2));

    return {
      simPresentCount,
      simAdhesionCount,
      simSafetyBuffer,
      simFinalPreparation,
      simAvoided,
      simKgSaved,
      simBrlSaved
    };
  }, [totalStudents, simPresenceRate, simOptionPreference, simSafetyMargin]);

  // Handle Reuse / Replicate Voting Session
  const handleExecuteReuse = () => {
    if (!activeSession) return;
    if (onReuseVoting) {
      onReuseVoting(activeSession, targetReplicationDate);
      setReplicationSuccess(`Votação replicada para ${targetReplicationDate.split('-').reverse().join('/')} com sucesso!`);
      setTimeout(() => setReplicationSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-purple-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-widest text-purple-300 bg-purple-950/80 px-3 py-1 rounded-full border border-purple-800">
                Tomada de Decisão & Estudos de Caso
              </span>
              <span className="text-xs text-purple-200 font-mono">
                Categoria: {selectedCategory}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Dashboard Inteligente para Tomada de Decisão
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl mt-1">
              Tratamento analítico avançado das votações por categoria, dimensionamento inteligente de merenda, reutilização de sessões com regra de presença e simulação de cenários.
            </p>
          </div>

          {/* Category Selector */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-2.5 flex items-center gap-3 w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-300 uppercase shrink-0">Categoria:</span>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedSessionId('all');
              }}
              className="bg-purple-900/90 text-white font-bold text-xs p-2 rounded-xl outline-none border border-purple-700 w-full"
            >
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Refeições Necessárias</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              {nutritionIntelligence.estimatedMealsToPrepare}
            </p>
            <p className="text-[11px] text-emerald-300">Baseado em alunos presentes</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Alimentos Poupados</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
              {nutritionIntelligence.foodSavedKg} kg
            </p>
            <p className="text-[11px] text-slate-300">Desperdício prevenido</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Economia Prevista</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5 font-mono">
              R$ {nutritionIntelligence.budgetSavedBRL}
            </p>
            <p className="text-[11px] text-slate-300">Otimização de custos</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Adesão na Categoria</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-300 mt-0.5">
              {nutritionIntelligence.lunchAdhesionRate}%
            </p>
            <p className="text-[11px] text-slate-300">Taxa de escolha</p>
          </div>
        </div>
      </div>

      {/* Decision Subtabs Navigation Bar */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveDecisionTab('nutrition')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeDecisionTab === 'nutrition'
              ? 'bg-white text-emerald-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-apple-alt text-emerald-600"></i>
          Nutrição & Merenda Inteligente
        </button>

        <button
          type="button"
          onClick={() => setActiveDecisionTab('strategic')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeDecisionTab === 'strategic'
              ? 'bg-white text-indigo-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-lightbulb text-indigo-600"></i>
          Recomendações da Gestão
        </button>

        <button
          type="button"
          onClick={() => setActiveDecisionTab('longitudinal')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeDecisionTab === 'longitudinal'
              ? 'bg-white text-purple-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-calendar-check text-purple-600"></i>
          Medição em Múltiplos Dias
        </button>

        <button
          type="button"
          onClick={() => setActiveDecisionTab('simulator')}
          className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeDecisionTab === 'simulator'
              ? 'bg-white text-amber-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-sliders-h text-amber-600"></i>
          Simulador de Cenários
        </button>
      </div>

      {/* 1. NUTRIÇÃO & MERENDA INTELIGENTE */}
      {activeDecisionTab === 'nutrition' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Panel: Cálculo Inteligente de Cardápio */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                    <i className="fas fa-utensils text-emerald-600"></i>
                    Dimensionamento Produtivo da Cozinha Escolar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cruzamento em tempo real: alunos com presença confirmada em sala x opção por almoçar
                  </p>
                </div>
                <span className="text-xs font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 font-mono">
                  {latestPresentCount} alunos presentes
                </span>
              </div>

              {/* Big Highlight Box */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-widest block mb-1">
                    Meta de Produção Diária
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-950 font-mono">
                      {nutritionIntelligence.estimatedMealsToPrepare}
                    </span>
                    <span className="text-sm font-bold text-emerald-800">
                      pratos balanceados a servir
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-2">
                    Taxa calculada: {nutritionIntelligence.lunchAdhesionRate}% dos alunos presentes optaram por almoçar na data.
                  </p>
                </div>

                <div className="sm:border-l sm:border-emerald-200 sm:pl-6 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <i className="fas fa-check-circle text-emerald-600"></i>
                    <span>Desperdício zero de sobras limpas</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <i className="fas fa-leaf text-emerald-600"></i>
                    <span>{nutritionIntelligence.foodSavedKg} kg de alimento poupados</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <i className="fas fa-coins text-emerald-600"></i>
                    <span>R$ {nutritionIntelligence.budgetSavedBRL} em economia direta</span>
                  </div>
                </div>
              </div>

              {/* Insumos Sugeridos */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-clipboard-list text-indigo-600"></i>
                  Lista Automatizada de Insumos para os {nutritionIntelligence.estimatedMealsToPrepare} Alunos
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {nutritionIntelligence.ingredients.map(ing => (
                    <div key={ing.item} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">{ing.item}</p>
                      <p className="text-lg font-black text-slate-800 font-mono mt-0.5">
                        {ing.qtd} <span className="text-xs font-semibold text-slate-400">{ing.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Distribution by Option Pie */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                  <i className="fas fa-pie-chart text-emerald-600"></i>
                  Adesão ao Cardápio
                </h3>
                <p className="text-xs text-slate-500">
                  Distribuição das escolhas alimentares dos discentes
                </p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                {nutritionIntelligence.optionAnalysis.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={nutritionIntelligence.optionAnalysis}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {nutritionIntelligence.optionAnalysis.map((entry, idx) => (
                          <Cell key={entry.id} fill={PALETTE[idx % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val} alunos`, 'Opções Escolhidas']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-400 py-10">
                    <i className="fas fa-utensils text-3xl mb-2 text-slate-300"></i>
                    <p className="text-xs">Aguardando votos da alimentação</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                {nutritionIntelligence.optionAnalysis.map((opt, idx) => (
                  <div key={opt.id} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}></span>
                      <span className="font-bold text-slate-700 truncate">{opt.name}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 shrink-0">
                      {opt.count} ({opt.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RECOMENDAÇÕES ESTRATÉGICAS DA GESTÃO */}
      {activeDecisionTab === 'strategic' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-brain text-indigo-600"></i>
              Insights e Tomada de Decisão Acionável
            </h3>
            <p className="text-xs text-slate-500">
              Recomendações automáticas derivadas dos dados empíricos de presença e votação para a categoria <strong>{selectedCategory}</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {strategicRecommendations.map((rec, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        rec.priority === 'Alta' ? 'bg-rose-100 text-rose-800' :
                        rec.priority === 'Média' ? 'bg-amber-100 text-amber-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        Prioridade {rec.priority}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {rec.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <i className={`fas ${rec.icon} text-indigo-600`}></i>
                      {rec.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/50 flex justify-end">
                    <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                      Ação Recomendada pela Gestão <i className="fas fa-arrow-right text-[9px]"></i>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. MEDIÇÃO EM MÚLTIPLOS DIAS & REUTILIZAÇÃO DA VOTAÇÃO */}
      {activeDecisionTab === 'longitudinal' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart: Longitudinal Evolution */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                    <i className="fas fa-chart-line text-purple-600"></i>
                    Comparativo Histórico entre Dias / Edições
                  </h3>
                  <p className="text-xs text-slate-500">
                    Acompanhamento temporal da categoria {selectedCategory} em datas sucessivas
                  </p>
                </div>
                <span className="text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-mono">
                  {longitudinalData.length} medições
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                {longitudinalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={longitudinalData} margin={{ left: -10, right: 20, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" fontSize={11} tick={{ fill: '#475569', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} tick={{ fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.1)' }}
                        formatter={(val: any) => [`${val} votos`, 'Participação Computada']}
                      />
                      <Bar dataKey="votos" radius={[8, 8, 0, 0]} fill="#8B5CF6" barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    Registre votações em dias diferentes para visualizar a série longitudinal.
                  </div>
                )}
              </div>
            </div>

            {/* Tool: Reutilizar Votação para Novo Dia */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                  <i className="fas fa-redo text-indigo-600"></i>
                  Reutilizar Votação
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Replicar esta votação para um novo dia escolar mantendo as opções e a mesma regra de presença.
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Votação Base</label>
                  <p className="text-xs font-black text-slate-800 truncate">
                    {activeSession ? activeSession.title : 'Selecione uma votação'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Data da Nova Medição</label>
                  <input
                    type="date"
                    value={targetReplicationDate}
                    onChange={e => setTargetReplicationDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {replicationSuccess && (
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    {replicationSuccess}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleExecuteReuse}
                  disabled={!activeSession}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-copy"></i>
                  <span>Replicar Votação para Nova Data</span>
                </button>
              </div>

              {onNavigateToVoting && (
                <button
                  type="button"
                  onClick={onNavigateToVoting}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-edit"></i>
                  <span>Ir para Aba Criar Votação</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SIMULADOR DE CENÁRIOS (WHAT-IF) */}
      {activeDecisionTab === 'simulator' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-sliders-h text-amber-500"></i>
              Simulador Preditivo de Tomada de Decisão
            </h3>
            <p className="text-xs text-slate-500">
              Ajuste as taxas de assiduidade e adesão para prever o impacto na cozinha, nos custos e na representatividade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200/70">
            {/* Slider 1: Presença em Aula */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span>Taxa de Presença Escolar</span>
                <span className="text-indigo-600 font-mono">{simPresenceRate}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={simPresenceRate}
                onChange={e => setSimPresenceRate(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Projeção: {simResults.simPresentCount} discentes presentes em sala
              </p>
            </div>

            {/* Slider 2: Adesão à Opção / Almoço */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span>Taxa de Adesão ao Almoço</span>
                <span className="text-emerald-600 font-mono">{simOptionPreference}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={simOptionPreference}
                onChange={e => setSimOptionPreference(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Projeção: {simResults.simAdhesionCount} votos a favor da refeição
              </p>
            </div>

            {/* Slider 3: Margem de Segurança */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span>Margem de Segurança da Cozinha</span>
                <span className="text-amber-600 font-mono">+{simSafetyMargin}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={simSafetyMargin}
                onChange={e => setSimSafetyMargin(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Reserva técnica: +{simResults.simSafetyBuffer} porções sob demanda
              </p>
            </div>
          </div>

          {/* Results Cards from Simulation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200">
              <p className="text-[11px] font-bold text-indigo-700 uppercase">Previsão de Produção</p>
              <p className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono mt-1">
                {simResults.simFinalPreparation}
              </p>
              <p className="text-[11px] text-indigo-600">Refeições exatas no dia</p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Sobras Evitadas</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono mt-1">
                {simResults.simAvoided}
              </p>
              <p className="text-[11px] text-emerald-600">Pratos a menos descartados</p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Economia de Alimentos</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-950 font-mono mt-1">
                {simResults.simKgSaved} kg
              </p>
              <p className="text-[11px] text-amber-600">Preservação de insumos</p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
              <p className="text-[11px] font-bold text-purple-700 uppercase">Economia Financeira</p>
              <p className="text-2xl sm:text-3xl font-black text-purple-950 font-mono mt-1">
                R$ {simResults.simBrlSaved}
              </p>
              <p className="text-[11px] text-purple-600">Recursos poupados</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
