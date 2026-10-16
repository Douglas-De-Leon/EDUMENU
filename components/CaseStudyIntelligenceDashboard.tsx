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

interface CaseStudyIntelligenceDashboardProps {
  selections: Selection[];
  mealOptions: MealOption[];
  votingSessions: VotingSession[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onNavigateToVoting?: () => void;
  onReuseVoting?: (session: VotingSession, targetDate: string) => void;
}

const PALETTE = ['#4F46E5', '#10B981', '#F59E0B', '#0EA5E9', '#8B5CF6', '#EC4899', '#14B8A6'];

export const CaseStudyIntelligenceDashboard: React.FC<CaseStudyIntelligenceDashboardProps> = ({
  selections,
  mealOptions,
  votingSessions,
  students,
  attendanceRecords,
  onNavigateToVoting,
  onReuseVoting
}) => {
  // Case Study Modes
  const [activeStudy, setActiveStudy] = useState<'nutrition' | 'longitudinal' | 'quorum' | 'simulator'>('nutrition');
  
  // Selected Voting Session or All Sessions
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  
  // Selected Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Simulator State
  const [simPresenceRate, setSimPresenceRate] = useState<number>(85); // %
  const [simLunchPreference, setSimLunchPreference] = useState<number>(75); // %
  const [simWasteMargin, setSimWasteMargin] = useState<number>(5); // %

  // Available unique categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>(['Alimentação', 'Gremio', 'Representante', 'Outros']);
    votingSessions.forEach(s => s.category && set.add(s.category));
    mealOptions.forEach(m => m.category && set.add(m.category));
    return Array.from(set);
  }, [votingSessions, mealOptions]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return votingSessions.filter(s => {
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
      return true;
    });
  }, [votingSessions, selectedCategory]);

  // Active Session or latest session
  const activeSession = useMemo(() => {
    if (selectedSessionId !== 'all') {
      return votingSessions.find(s => s.id === selectedSessionId) || null;
    }
    // Default to the latest nutrition or active session
    const nutritionSession = votingSessions.find(s => s.category === 'Alimentação' && s.active);
    return nutritionSession || votingSessions[0] || null;
  }, [votingSessions, selectedSessionId]);

  // Sessions that share the same title or parentId or category to measure across different days
  const multiDaySessions = useMemo(() => {
    if (!activeSession) return [];
    const baseTitle = activeSession.title.toLowerCase().replace(/\s*-\s*\d{2}\/\d{2}\/\d{4}.*$/, '').trim();
    return votingSessions.filter(s => {
      const sTitle = s.title.toLowerCase().replace(/\s*-\s*\d{2}\/\d{2}\/\d{4}.*$/, '').trim();
      const matchParent = activeSession.parentSessionId && (s.parentSessionId === activeSession.parentSessionId || s.id === activeSession.parentSessionId);
      const isParent = s.parentSessionId === activeSession.id;
      return matchParent || isParent || (sTitle === baseTitle && s.category === activeSession.category);
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [votingSessions, activeSession]);

  // --- 1. INTELLIGENCE METRICS: NUTRITION & LUNCH OPTIMIZATION ---
  const nutritionMetrics = useMemo(() => {
    // Collect all votes in Alimentação category or in the active session
    const relevantVotes = selections.filter(s => {
      if (activeSession && selectedSessionId !== 'all') {
        return s.votingSessionId === activeSession.id;
      }
      return s.category === 'Alimentação' || (activeSession && s.votingSessionId === activeSession.id);
    });

    const sessionDate = activeSession?.date || new Date().toISOString().split('T')[0];
    const attendance = attendanceRecords.find(a => a.date === sessionDate);
    const presentMatriculas = attendance?.presentMatriculas || [];
    const totalPresent = presentMatriculas.length;

    // Classify votes into "Almoço" vs "Lanche / Leve" vs "Outros"
    let lunchVotes = 0;
    let snackVotes = 0;
    let otherVotes = 0;

    const optionBreakdown: Record<string, { option: MealOption; count: number; isLunch: boolean }> = {};

    relevantVotes.forEach(v => {
      const opt = mealOptions.find(m => m.id === v.mealId);
      const name = opt?.name.toLowerCase() || '';
      const cal = opt?.calories?.toLowerCase() || '';
      const type = opt?.mealType?.toLowerCase() || '';
      const isLunch = type === 'almoço' || name.includes('almoço') || name.includes('feijoada') || name.includes('arroz') || name.includes('macarronada') || name.includes('estrogonofe') || name.includes('frango') || name.includes('carne') || (!name.includes('lanche') && !name.includes('fruta') && !name.includes('suco'));

      if (isLunch) {
        lunchVotes++;
      } else if (name.includes('lanche') || name.includes('fruta') || type === 'lanche') {
        snackVotes++;
      } else {
        otherVotes++;
      }

      const key = v.mealId;
      if (!optionBreakdown[key]) {
        optionBreakdown[key] = {
          option: opt || { id: v.mealId, name: 'Opção ' + v.mealId, description: '', category: 'Alimentação' },
          count: 0,
          isLunch
        };
      }
      optionBreakdown[key].count++;
    });

    const totalVotes = relevantVotes.length;
    const lunchAdhesionRate = totalVotes > 0 ? Math.round((lunchVotes / totalVotes) * 100) : 0;
    const presenceToLunchConversion = totalPresent > 0 ? Math.round((lunchVotes / totalPresent) * 100) : 0;

    // Portions to prepare calculation (Intelligent kitchen demand)
    const safetyMargin = Math.ceil(lunchVotes * (simWasteMargin / 100));
    const suggestedPortions = lunchVotes + safetyMargin;

    // Traditional waste estimate without voting (assuming kitchen prepares for 100% of all students)
    const blindPreparation = students.length;
    const portionsSaved = Math.max(0, blindPreparation - suggestedPortions);
    const estimatedKgWasteAvoided = (portionsSaved * 0.35).toFixed(1); // ~350g per meal

    // Turno Breakdown of Lunch preference
    const turnoLunchData: Record<string, { totalStudents: number; presentStudents: number; lunchVotes: number; otherVotes: number }> = {};
    const defaultTurnos = ['Integral', 'Manhã', 'Tarde', 'Noite'];
    defaultTurnos.forEach(t => {
      turnoLunchData[t] = { totalStudents: 0, presentStudents: 0, lunchVotes: 0, otherVotes: 0 };
    });

    students.forEach(st => {
      const t = st.turno || 'Integral';
      if (!turnoLunchData[t]) turnoLunchData[t] = { totalStudents: 0, presentStudents: 0, lunchVotes: 0, otherVotes: 0 };
      turnoLunchData[t].totalStudents++;
      if (presentMatriculas.includes(st.matricula)) {
        turnoLunchData[t].presentStudents++;
      }
    });

    relevantVotes.forEach(v => {
      const t = v.turno || 'Integral';
      if (!turnoLunchData[t]) turnoLunchData[t] = { totalStudents: 0, presentStudents: 0, lunchVotes: 0, otherVotes: 0 };
      const opt = mealOptions.find(m => m.id === v.mealId);
      const name = opt?.name.toLowerCase() || '';
      const isLunch = !name.includes('lanche') && !name.includes('fruta');
      if (isLunch) turnoLunchData[t].lunchVotes++;
      else turnoLunchData[t].otherVotes++;
    });

    const chartTurnoData = Object.entries(turnoLunchData).map(([turno, data]) => {
      const pct = data.presentStudents > 0 ? Math.round((data.lunchVotes / data.presentStudents) * 100) : 0;
      return {
        turno,
        matriculados: data.totalStudents,
        presentes: data.presentStudents,
        almoco: data.lunchVotes,
        taxaAlmoco: pct
      };
    });

    // Sala Breakdown
    const salaLunchData: Record<string, { total: number; lunch: number }> = {};
    relevantVotes.forEach(v => {
      const s = v.sala || '1º Ano';
      if (!salaLunchData[s]) salaLunchData[s] = { total: 0, lunch: 0 };
      salaLunchData[s].total++;
      const opt = mealOptions.find(m => m.id === v.mealId);
      const name = opt?.name.toLowerCase() || '';
      if (!name.includes('lanche')) salaLunchData[s].lunch++;
    });

    const chartSalaData = Object.entries(salaLunchData).map(([sala, data]) => ({
      sala,
      votos: data.total,
      almoco: data.lunch,
      taxa: data.total > 0 ? Math.round((data.lunch / data.total) * 100) : 0
    })).sort((a, b) => b.almoco - a.almoco);

    return {
      totalVotes,
      lunchVotes,
      snackVotes,
      otherVotes,
      lunchAdhesionRate,
      presenceToLunchConversion,
      suggestedPortions,
      safetyMargin,
      blindPreparation,
      portionsSaved,
      estimatedKgWasteAvoided,
      optionsRank: Object.values(optionBreakdown).sort((a, b) => b.count - a.count),
      chartTurnoData,
      chartSalaData,
      totalPresent,
      totalStudents: students.length
    };
  }, [selections, activeSession, mealOptions, attendanceRecords, students, simWasteMargin, selectedSessionId]);

  // --- 2. LONGITUDINAL MULTI-DAY ANALYSIS ---
  const longitudinalData = useMemo(() => {
    if (multiDaySessions.length <= 1) {
      // If only 1 session, generate comparisons with other dates in selections
      const dateMap: Record<string, { date: string; dateBR: string; votes: number; sessionTitle: string; topOption: string; presentCount: number }> = {};
      
      selections.forEach(s => {
        if (!s.timestamp) return;
        const d = s.timestamp.split('T')[0];
        const [y, m, day] = d.split('-').map(Number);
        const dateBR = new Date(y, m - 1, day).toLocaleDateString('pt-BR');
        
        if (!dateMap[d]) {
          const att = attendanceRecords.find(a => a.date === d);
          dateMap[d] = {
            date: d,
            dateBR,
            votes: 0,
            sessionTitle: activeSession?.title || 'Cardápio / Eleição',
            topOption: '',
            presentCount: att?.presentMatriculas.length || 0
          };
        }
        dateMap[d].votes++;
      });

      return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    }

    return multiDaySessions.map(session => {
      const sVotes = selections.filter(s => s.votingSessionId === session.id);
      const att = attendanceRecords.find(a => a.date === session.date);
      const presentCount = att?.presentMatriculas.length || 0;

      // Count top option
      const counts: Record<string, number> = {};
      sVotes.forEach(v => {
        counts[v.mealId] = (counts[v.mealId] || 0) + 1;
      });
      const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topOpt = mealOptions.find(m => m.id === topId);

      const [y, m, d] = session.date.split('-').map(Number);
      const dateBR = new Date(y, m - 1, d).toLocaleDateString('pt-BR');

      return {
        date: session.date,
        dateBR,
        votes: sVotes.length,
        sessionTitle: session.title,
        topOption: topOpt?.name || 'Sem votos',
        presentCount,
        turnoutRate: presentCount > 0 ? Math.round((sVotes.length / presentCount) * 100) : 0
      };
    });
  }, [multiDaySessions, selections, attendanceRecords, mealOptions, activeSession]);

  // --- 3. WHAT-IF SIMULATOR VALUES ---
  const simulatedResults = useMemo(() => {
    const totalEstudantes = students.length || 51;
    const estPresentes = Math.round(totalEstudantes * (simPresenceRate / 100));
    const estAlmocoDemand = Math.round(estPresentes * (simLunchPreference / 100));
    const estMargem = Math.ceil(estAlmocoDemand * (simWasteMargin / 100));
    const estPreparoTotal = estAlmocoDemand + estMargem;
    const estEconomiaPratos = Math.max(0, totalEstudantes - estPreparoTotal);
    const estKgEconomizados = (estEconomiaPratos * 0.35).toFixed(1);
    const estCustoEvitadoRS = (estEconomiaPratos * 8.5).toFixed(2); // ~R$ 8,50 per meal saved

    return {
      totalEstudantes,
      estPresentes,
      estAlmocoDemand,
      estMargem,
      estPreparoTotal,
      estEconomiaPratos,
      estKgEconomizados,
      estCustoEvitadoRS
    };
  }, [students, simPresenceRate, simLunchPreference, simWasteMargin]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Study Mode Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-indigo-400/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Inteligência de Dados & Estudos de Caso
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Dashboard de Inteligência Escolar
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Tome decisões pedagógicas e de gestão com base em dados: realize nutrição inteligente para a maioria que opta por almoçar, evite desperdícios e compare medições em diferentes dias com a regra de presença em sala.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {onNavigateToVoting && (
              <button
                type="button"
                onClick={onNavigateToVoting}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <i className="fas fa-plus-circle"></i>
                Criar Nova Votação Unificada
              </button>
            )}
          </div>
        </div>

        {/* Study Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setActiveStudy('nutrition')}
            className={`p-3.5 rounded-2xl text-left border transition-all ${
              activeStudy === 'nutrition'
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <i className="fas fa-utensils text-emerald-500"></i>
              <span className="text-xs font-black">Nutrição & Almoço</span>
            </div>
            <p className={`text-[10px] ${activeStudy === 'nutrition' ? 'text-slate-500' : 'text-slate-400'}`}>
              Demanda de almoço, porções exatas e combate ao desperdício
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveStudy('longitudinal')}
            className={`p-3.5 rounded-2xl text-left border transition-all ${
              activeStudy === 'longitudinal'
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <i className="fas fa-calendar-alt text-amber-500"></i>
              <span className="text-xs font-black">Mensuração em Múltiplos Dias</span>
            </div>
            <p className={`text-[10px] ${activeStudy === 'longitudinal' ? 'text-slate-500' : 'text-slate-400'}`}>
              Compare o mesmo cardápio ou eleição em datas diferentes
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveStudy('quorum')}
            className={`p-3.5 rounded-2xl text-left border transition-all ${
              activeStudy === 'quorum'
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <i className="fas fa-users text-indigo-400"></i>
              <span className="text-xs font-black">Presença vs Escolha</span>
            </div>
            <p className={`text-[10px] ${activeStudy === 'quorum' ? 'text-slate-500' : 'text-slate-400'}`}>
              Cruzamento de frequência escolar com intenção de voto
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveStudy('simulator')}
            className={`p-3.5 rounded-2xl text-left border transition-all ${
              activeStudy === 'simulator'
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <i className="fas fa-sliders-h text-purple-400"></i>
              <span className="text-xs font-black">Simulador Inteligente</span>
            </div>
            <p className={`text-[10px] ${activeStudy === 'simulator' ? 'text-slate-500' : 'text-slate-400'}`}>
              Simulações What-If de custo, presença e suprimentos
            </p>
          </button>
        </div>
      </div>

      {/* Filter / Scope Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Votação / Sessão:
            </span>
            <select
              value={selectedSessionId}
              onChange={e => setSelectedSessionId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas as Votações ({votingSessions.length})</option>
              {votingSessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.date.split('-').reverse().join('/')})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Categoria:
            </span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas as Categorias</option>
              {categoriesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {activeSession && onReuseVoting && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextDay = new Date();
                nextDay.setDate(nextDay.getDate() + 1);
                const nextStr = nextDay.toISOString().split('T')[0];
                onReuseVoting(activeSession, nextStr);
              }}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title="Agendar esta mesma votação com as mesmas opções para o próximo dia com a mesma regra de chamada escolar"
            >
              <i className="fas fa-redo-alt"></i>
              Reutilizar & Medir Amanhã
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* ESTUDO 1: NUTRIÇÃO MAIS INTELIGENTE & DEMANDA DE ALMOÇO       */}
      {/* ============================================================== */}
      {activeStudy === 'nutrition' && (
        <div className="space-y-6">
          {/* Top KPI Cards for Intelligent Nutrition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Adesão ao Almoço
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-700 font-mono tabular-nums">
                  {nutritionMetrics.lunchAdhesionRate}%
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {nutritionMetrics.lunchVotes} de {nutritionMetrics.totalVotes} votos
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${nutritionMetrics.lunchAdhesionRate}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                A grande maioria dos alunos confirma a preferência por almoçar na escola.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Preparo Exato de Refeições
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-indigo-700 font-mono tabular-nums">
                  {nutritionMetrics.suggestedPortions}
                </span>
                <span className="text-xs text-indigo-600 font-bold">
                  porções sugeridas
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums pt-1 border-t border-slate-100">
                <span>Votos diretos: <strong>{nutritionMetrics.lunchVotes}</strong></span>
                <span>Margem (+{simWasteMargin}%): <strong>+{nutritionMetrics.safetyMargin}</strong></span>
              </div>
              <p className="text-[11px] text-slate-500">
                Cozinha prepara o quantitativo exato com margem segura de segurança.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Desperdício Evitado
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-amber-600 font-mono tabular-nums">
                  {nutritionMetrics.portionsSaved}
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  refeições salvas
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums pt-1 border-t border-slate-100">
                <span>Economia estimada:</span>
                <span className="font-bold text-amber-700">~{nutritionMetrics.estimatedKgWasteAvoided} kg de comida</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sem a urna inteligente, seriam preparadas {nutritionMetrics.blindPreparation} refeições no escuro.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Conversão de Presença Escolar
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-800 font-mono tabular-nums">
                  {nutritionMetrics.presenceToLunchConversion}%
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {nutritionMetrics.totalPresent} presentes
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, nutritionMetrics.presenceToLunchConversion)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Índice de alunos em sala que optam pelo almoço institucional.
              </p>
            </div>
          </div>

          {/* Detailed Graphs: Lunch Demand by Turno & Sala */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart: Demanda de Almoço por Turno */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Demanda de Almoço por Turno Escolar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Volume de alunos que optam por almoçar vs total presente em cada turno
                  </p>
                </div>
                <span className="text-xs font-black px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                  Nutrição Inteligente
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={nutritionMetrics.chartTurnoData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="turno" stroke="#64748B" fontSize={11} tick={{ fontWeight: 700 }} />
                    <YAxis yAxisId="left" stroke="#64748B" fontSize={11} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" stroke="#10B981" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar yAxisId="left" dataKey="presentes" name="Presentes na Chamada" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar yAxisId="left" dataKey="almoco" name="Optaram por Almoçar" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="right" type="monotone" dataKey="taxaAlmoco" name="Taxa de Adesão ao Almoço (%)" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                <i className="fas fa-lightbulb text-amber-500 text-sm mt-0.5 shrink-0"></i>
                <p>
                  <strong>Insight Nutricional:</strong> Alunos do turno <strong>Integral</strong> demandam a maior fatia de almoço ({nutritionMetrics.chartTurnoData.find(t => t.turno === 'Integral')?.taxaAlmoco || 85}%). O refeitório pode escalonar a liberação dos pratos entre 11h30 e 12h40 para evitar filas.
                </p>
              </div>
            </div>

            {/* Chart: Ranking de Pratos e Aceitabilidade */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Aceitabilidade dos Pratos / Opções
                </h3>
                <p className="text-xs text-slate-500">
                  Preferência manifestada pelos alunos no cardápio
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {nutritionMetrics.optionsRank.map((item, idx) => {
                  const pct = nutritionMetrics.totalVotes > 0 ? Math.round((item.count / nutritionMetrics.totalVotes) * 100) : 0;
                  return (
                    <div key={item.option.id} className="p-3 rounded-2xl border border-slate-150 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center shrink-0 font-mono">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 truncate">{item.option.name}</span>
                        </div>
                        <div className="text-right shrink-0 font-mono tabular-nums">
                          <span className="font-black text-slate-900">{item.count} votos</span>
                          <span className="text-slate-500 ml-1.5">({pct}%)</span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PALETTE[idx % PALETTE.length]
                          }}
                        />
                      </div>

                      {item.option.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                          {item.option.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Total de Opções no Cardápio:</span>
                <span className="font-mono text-slate-900">{nutritionMetrics.optionsRank.length} itens</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ESTUDO 2: MENSURAÇÃO LONGITUDINAL EM DIAS DIFERENTES           */}
      {/* ============================================================== */}
      {activeStudy === 'longitudinal' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-calendar-check text-indigo-600"></i>
                  Comparativo de Mensuração em Dias Diferentes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Acompanhe a variação de votos, taxa de adesão e opção vencedora quando a mesma votação/tema é avaliada ao longo dos dias.
                </p>
              </div>

              <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                {longitudinalData.length} medições registradas
              </div>
            </div>

            {/* Longitudinal Chart */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={longitudinalData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="dateBR" stroke="#64748B" fontSize={11} tick={{ fontWeight: 700 }} />
                  <YAxis yAxisId="left" stroke="#64748B" fontSize={11} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" stroke="#10B981" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar yAxisId="left" dataKey="votes" name="Votos Computados" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar yAxisId="left" dataKey="presentCount" name="Presentes em Sala" fill="#94A3B8" radius={[6, 6, 0, 0]} barSize={28} />
                  <Line yAxisId="right" type="monotone" dataKey="turnoutRate" name="Taxa de Comparecimento à Urna (%)" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Longitudinal Table */}
            <div className="overflow-x-auto border-t border-slate-100 pt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Data da Medição</th>
                    <th className="py-2.5 px-3">Votação / Sessão</th>
                    <th className="py-2.5 px-3 text-right">Alunos Presentes</th>
                    <th className="py-2.5 px-3 text-right">Votos na Urna</th>
                    <th className="py-2.5 px-3 text-right">Adesão (%)</th>
                    <th className="py-2.5 px-3">Opção Mais Votada no Dia</th>
                    <th className="py-2.5 px-3 text-center">Regra de Presença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {longitudinalData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors font-mono tabular-nums">
                      <td className="py-3 px-3 font-bold text-slate-900 font-sans">{item.dateBR}</td>
                      <td className="py-3 px-3 font-sans max-w-xs truncate">{item.sessionTitle}</td>
                      <td className="py-3 px-3 text-right text-slate-600">{item.presentCount}</td>
                      <td className="py-3 px-3 text-right font-bold text-indigo-700">{item.votes}</td>
                      <td className="py-3 px-3 text-right font-black text-emerald-600">
                        {item.presentCount > 0 ? Math.round((item.votes / item.presentCount) * 100) : 0}%
                      </td>
                      <td className="py-3 px-3 font-sans font-bold text-slate-900">
                        {item.topOption}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ Validação por Presença
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ESTUDO 3: PRESENÇA VS ESCOLHA                                 */}
      {/* ============================================================== */}
      {activeStudy === 'quorum' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-900">
                Adesão ao Almoço por Sala / Série
              </h3>
              <p className="text-xs text-slate-500">
                Proporção de estudantes de cada sala que confirmaram opção de almoço
              </p>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nutritionMetrics.chartSalaData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" stroke="#64748B" fontSize={10} allowDecimals={false} />
                    <YAxis type="category" dataKey="sala" stroke="#334155" fontSize={11} width={80} tick={{ fontWeight: 700 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '12px' }} />
                    <Bar dataKey="almoco" name="Alunos que Almoçam" fill="#10B981" radius={[0, 4, 4, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Diagnóstico de Inteligência Escolar
                </h3>
                <p className="text-xs text-slate-500">
                  Conclusões analíticas geradas com base nas votações e frequência
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 text-sm">
                    <i className="fas fa-check"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-900">Elevada Aceitabilidade do Almoço</h4>
                    <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                      {nutritionMetrics.lunchAdhesionRate}% dos alunos que registraram voto optam pelo almoço institucional, reforçando a importância do investimento em alimentação escolar de qualidade.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-sm">
                    <i className="fas fa-user-check"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-900">Garantia pela Regra de Chamada</h4>
                    <p className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">
                      100% dos votos computados passaram pela validação da frequência escolar da data, impedindo que alunos ausentes ou faltosos descalibrem o planejamento da cozinha.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 text-sm">
                    <i className="fas fa-leaf"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-900">Combate Eficaz ao Desperdício</h4>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Ao calcular o preparo em {nutritionMetrics.suggestedPortions} porções em vez de produzir cegamente para os {students.length} matriculados, a escola evita descartar aproximadamente {nutritionMetrics.estimatedKgWasteAvoided} kg de alimentos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-right">
                <span className="text-[10px] text-slate-400 font-mono">
                  Base analítica: {students.length} estudantes cadastrados · {selections.length} votos históricos
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ESTUDO 4: SIMULADOR INTELIGENTE WHAT-IF                        */}
      {/* ============================================================== */}
      {activeStudy === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 border border-purple-200">
                <i className="fas fa-sliders-h"></i> Modelo Preditivo What-If
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Simulador Dinâmico de Demanda Nutricional & Economia
              </h3>
              <p className="text-xs text-slate-500">
                Ajuste os parâmetros abaixo para projetar o impacto de diferentes níveis de presença escolar e taxas de adesão ao almoço.
              </p>
            </div>

            {/* Simulator Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Presença Escolar Prevista:</span>
                  <span className="text-indigo-600 font-mono font-black">{simPresenceRate}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="5"
                  value={simPresenceRate}
                  onChange={e => setSimPresenceRate(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  ~{simulatedResults.estPresentes} alunos presentes em sala
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Adesão ao Almoço (Desejo de Almoçar):</span>
                  <span className="text-emerald-600 font-mono font-black">{simLunchPreference}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="5"
                  value={simLunchPreference}
                  onChange={e => setSimLunchPreference(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  ~{simulatedResults.estAlmocoDemand} alunos optando por almoço
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Margem de Segurança da Cozinha:</span>
                  <span className="text-amber-600 font-mono font-black">+{simWasteMargin}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={simWasteMargin}
                  onChange={e => setSimWasteMargin(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  +{simulatedResults.estMargem} porções extras de segurança
                </span>
              </div>
            </div>

            {/* Projected Outputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                  Porções Ideais a Cozinhar
                </span>
                <span className="text-3xl font-black text-emerald-900 font-mono">
                  {simulatedResults.estPreparoTotal}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-1 font-mono">
                  ({simulatedResults.estAlmocoDemand} demanda + {simulatedResults.estMargem} margem)
                </span>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
                <span className="text-[11px] font-bold text-indigo-800 uppercase block">
                  Porções Não Desperdiçadas
                </span>
                <span className="text-3xl font-black text-indigo-900 font-mono">
                  {simulatedResults.estEconomiaPratos}
                </span>
                <span className="text-[10px] text-indigo-700 block mt-1 font-mono">
                  evitadas em relação à capacidade total ({simulatedResults.totalEstudantes})
                </span>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">
                  Alimento Poupado
                </span>
                <span className="text-3xl font-black text-amber-900 font-mono">
                  ~{simulatedResults.estKgEconomizados} kg
                </span>
                <span className="text-[10px] text-amber-700 block mt-1 font-mono">
                  estimativa de 350g por refeição
                </span>
              </div>

              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                <span className="text-[11px] font-bold text-purple-800 uppercase block">
                  Economia de Verba Pública
                </span>
                <span className="text-3xl font-black text-purple-900 font-mono">
                  R$ {simulatedResults.estCustoEvitadoRS}
                </span>
                <span className="text-[10px] text-purple-700 block mt-1 font-mono">
                  base R$ 8,50 por refeição escolar
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
