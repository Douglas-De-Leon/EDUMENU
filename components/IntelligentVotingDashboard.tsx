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

interface IntelligentVotingDashboardProps {
  selections: Selection[];
  mealOptions: MealOption[];
  votingSessions?: VotingSession[];
  students: Student[];
  attendanceRecords?: AttendanceRecord[];
  lastSync?: string | null;
  onRefresh?: () => void;
  isSyncing?: boolean;
}

const BAR_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#0EA5E9', // Sky
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316'  // Orange
];

export const IntelligentVotingDashboard: React.FC<IntelligentVotingDashboardProps> = ({
  selections,
  mealOptions,
  votingSessions = [],
  students,
  attendanceRecords = [],
  lastSync,
  onRefresh,
  isSyncing = false
}) => {
  // Current Date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [dateScope, setDateScope] = useState<'all' | 'today' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [selectedTurno, setSelectedTurno] = useState<string>('all');
  const [selectedSala, setSelectedSala] = useState<string>('all');
  const [searchAuditQuery, setSearchAuditQuery] = useState<string>('');

  // Dynamic Categories from sessions, meals and default
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    votingSessions.forEach(s => s.category && set.add(s.category));
    mealOptions.forEach(m => m.category && set.add(m.category));
    selections.forEach(s => s.category && set.add(s.category));
    return ['Todas', ...Array.from(set)];
  }, [votingSessions, mealOptions, selections]);

  // Target Date comparison string
  const targetDateBR = useMemo(() => {
    if (dateScope === 'today') {
      const [y, m, d] = todayStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
    }
    if (dateScope === 'custom' && customDate) {
      const [y, m, d] = customDate.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
    }
    return null;
  }, [dateScope, todayStr, customDate]);

  // Filtered Sessions matching selected Category
  const sessionsInSelectedCategory = useMemo(() => {
    return votingSessions.filter(s => {
      if (selectedCategory !== 'Todas' && s.category !== selectedCategory) return false;
      return true;
    });
  }, [votingSessions, selectedCategory]);

  // Active Session if specific session is selected
  const activeSession = useMemo(() => {
    if (selectedSessionId === 'all') return null;
    return votingSessions.find(s => s.id === selectedSessionId) || null;
  }, [votingSessions, selectedSessionId]);

  // Filtered Votes (Selections) based on all controls
  const filteredSelections = useMemo(() => {
    return selections.filter(s => {
      // Category filter
      if (selectedCategory !== 'Todas' && s.category !== selectedCategory) return false;

      // Session filter
      if (selectedSessionId !== 'all') {
        if (s.votingSessionId !== selectedSessionId) {
          // Fallback matching by category & session date if session lacks explicit votingSessionId
          if (!activeSession || s.category !== activeSession.category) return false;
        }
      }

      // Date filter
      if (targetDateBR) {
        if (!s.timestamp) return false;
        const voteDateBR = new Date(s.timestamp).toLocaleDateString('pt-BR');
        if (voteDateBR !== targetDateBR) return false;
      }

      // Turno filter
      const student = students.find(st => st.matricula === s.matricula);
      const voteTurno = s.turno || student?.turno || 'Integral';
      if (selectedTurno !== 'all' && voteTurno !== selectedTurno) return false;

      // Sala filter
      const voteSala = s.sala || student?.sala || '1º Ano';
      if (selectedSala !== 'all' && voteSala !== selectedSala) return false;

      return true;
    });
  }, [selections, selectedCategory, selectedSessionId, activeSession, targetDateBR, selectedTurno, selectedSala, students]);

  // Attendance for the chosen date scope (for turnout comparison)
  const activeAttendanceRecord = useMemo(() => {
    const targetDate = dateScope === 'today' ? todayStr : dateScope === 'custom' ? customDate : todayStr;
    return attendanceRecords.find(a => a.date === targetDate) || null;
  }, [attendanceRecords, dateScope, todayStr, customDate]);

  const presentCountOnDay = activeAttendanceRecord ? activeAttendanceRecord.presentMatriculas.length : 0;

  // 1. CHART DATA: Results per Option / Candidate
  const optionResultsData = useMemo(() => {
    // Determine relevant options
    let relevantOptions: MealOption[] = [];
    if (activeSession && activeSession.optionIds && activeSession.optionIds.length > 0) {
      relevantOptions = mealOptions.filter(m => activeSession.optionIds.includes(m.id));
    } else if (selectedCategory !== 'Todas') {
      relevantOptions = mealOptions.filter(m => m.category === selectedCategory);
    } else {
      relevantOptions = mealOptions;
    }

    const counts: Record<string, number> = {};
    filteredSelections.forEach(s => {
      counts[s.mealId] = (counts[s.mealId] || 0) + 1;
    });

    const totalVotes = filteredSelections.length;

    // Map each relevant option
    const result = relevantOptions.map((opt, idx) => {
      const votes = counts[opt.id] || 0;
      const pct = totalVotes > 0 ? Number(((votes / totalVotes) * 100).toFixed(1)) : 0;
      return {
        id: opt.id,
        name: opt.name,
        identificador: opt.calories || 'N/A',
        category: opt.category,
        votos: votes,
        percentual: pct,
        fillColor: BAR_COLORS[idx % BAR_COLORS.length]
      };
    });

    // Also include any options that received votes but might not be in relevantOptions
    Object.keys(counts).forEach(mId => {
      if (!result.some(r => r.id === mId)) {
        const found = mealOptions.find(m => m.id === mId);
        const votes = counts[mId];
        const pct = totalVotes > 0 ? Number(((votes / totalVotes) * 100).toFixed(1)) : 0;
        result.push({
          id: mId,
          name: found ? found.name : 'Opção Registrada',
          identificador: found?.calories || 'N/A',
          category: found?.category || 'Geral',
          votos: votes,
          percentual: pct,
          fillColor: BAR_COLORS[result.length % BAR_COLORS.length]
        });
      }
    });

    return result.sort((a, b) => b.votos - a.votos);
  }, [filteredSelections, activeSession, selectedCategory, mealOptions]);

  // Leading option
  const leadingOption = optionResultsData.length > 0 && optionResultsData[0].votos > 0 ? optionResultsData[0] : null;

  // 2. CHART DATA: Participation by Série (Ano)
  const votesBySerieData = useMemo(() => {
    const map: Record<string, number> = { '1º Ano': 0, '2º Ano': 0, '3º Ano': 0 };
    filteredSelections.forEach(s => {
      const sala = s.sala || '1º Ano';
      map[sala] = (map[sala] || 0) + 1;
    });

    const total = filteredSelections.length || 1;
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      percentage: Number(((value / total) * 100).toFixed(1))
    }));
  }, [filteredSelections]);

  // 3. CHART DATA: Participation by Turno
  const votesByTurnoData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSelections.forEach(s => {
      const student = students.find(st => st.matricula === s.matricula);
      const turno = s.turno || student?.turno || 'Integral';
      map[turno] = (map[turno] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [filteredSelections, students]);

  // 4. CHART DATA: Timeline (Temporal progression of votes)
  const timeSeriesData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSelections.forEach(s => {
      if (!s.timestamp) return;
      // If filtering by specific date, group by hour
      if (targetDateBR) {
        const dateObj = new Date(s.timestamp);
        const hourStr = `${String(dateObj.getHours()).padStart(2, '0')}:00`;
        map[hourStr] = (map[hourStr] || 0) + 1;
      } else {
        // Group by day YYYY-MM-DD
        const dayStr = s.timestamp.split('T')[0];
        map[dayStr] = (map[dayStr] || 0) + 1;
      }
    });

    return Object.entries(map)
      .map(([label, votos]) => ({ label, votos }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredSelections, targetDateBR]);

  // 5. CHART DATA: Ranking by Turmas (Classes)
  const rankingTurmasData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSelections.forEach(s => {
      const student = students.find(st => st.matricula === s.matricula);
      const sName = (s.sala || student?.sala || '1º Ano') + (s.turma || student?.turma ? ` - Turma ${s.turma || student?.turma}` : '');
      map[sName] = (map[sName] || 0) + 1;
    });

    const total = filteredSelections.length || 1;
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        percentual: Number(((count / total) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredSelections, students]);

  // Turnout Rate calculation
  const totalStudentsCount = students.length;
  const uniqueVoterMatriculas = useMemo(() => {
    return new Set(filteredSelections.map(s => s.matricula)).size;
  }, [filteredSelections]);

  const turnoutPercentage = totalStudentsCount > 0
    ? ((uniqueVoterMatriculas / totalStudentsCount) * 100).toFixed(1)
    : '0.0';

  // Audit list of votes with search filter
  const auditList = useMemo(() => {
    return filteredSelections
      .map(s => {
        const student = students.find(st => st.matricula === s.matricula);
        const option = mealOptions.find(m => m.id === s.mealId);
        return {
          id: `${s.matricula}_${s.timestamp}`,
          matricula: s.matricula,
          studentName: student ? student.name : 'Aluno Removido',
          sala: s.sala || student?.sala || 'N/A',
          turma: s.turma || student?.turma || 'N/A',
          turno: s.turno || student?.turno || 'Integral',
          category: s.category,
          votedFor: option ? option.name : 'Opção Removida',
          identificador: option?.calories || 'N/A',
          timestamp: s.timestamp
        };
      })
      .filter(item => {
        if (!searchAuditQuery.trim()) return true;
        const q = searchAuditQuery.toLowerCase();
        return (
          item.studentName.toLowerCase().includes(q) ||
          item.matricula.toLowerCase().includes(q) ||
          item.votedFor.toLowerCase().includes(q) ||
          item.sala.toLowerCase().includes(q) ||
          item.turma.toLowerCase().includes(q) ||
          item.turno.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [filteredSelections, students, mealOptions, searchAuditQuery]);

  // Export to CSV functionality
  const handleExportCSV = () => {
    if (auditList.length === 0) return;
    const headers = ['Matricula', 'Aluno', 'Serie', 'Turma', 'Turno', 'Categoria', 'Opcao_Votada', 'Data_Hora'];
    const rows = auditList.map(item => [
      `"${item.matricula}"`,
      `"${item.studentName}"`,
      `"${item.sala}"`,
      `"${item.turma}"`,
      `"${item.turno}"`,
      `"${item.category}"`,
      `"${item.votedFor}"`,
      `"${new Date(item.timestamp).toLocaleString('pt-BR')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apuracao_votacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SERIE_COLORS: Record<string, string> = {
    '1º Ano': '#0EA5E9',
    '2º Ano': '#F43F5E',
    '3º Ano': '#6366F1'
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                Apuração em Tempo Real
              </span>
              {lastSync && (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Última sincronização: {lastSync}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Dashboard Inteligente de Votações
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl mt-1">
              Controle quantitativo e qualitativo das urnas escolares com visualização Recharts, gráficos interativos e auditoria completa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 cursor-pointer disabled:opacity-50"
                title="Sincronizar com banco de dados agora"
              >
                <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`}></i>
                <span>{isSyncing ? 'Atualizando...' : 'Atualizar Urnas'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={auditList.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              title="Exportar dados da apuração para CSV"
            >
              <i className="fas fa-file-csv"></i>
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Global KPI Strip inside header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Votos Filtrados</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{filteredSelections.length}</p>
            <p className="text-[11px] text-indigo-300">Total apurado no recorte</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Eleitores Ativos</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{uniqueVoterMatriculas}</p>
            <p className="text-[11px] text-emerald-300">{turnoutPercentage}% do corpo discente</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Opção em Destaque</p>
            <p className="text-base sm:text-lg font-bold text-white truncate mt-1">
              {leadingOption ? leadingOption.name : 'Aguardando votos'}
            </p>
            <p className="text-[11px] text-amber-300 font-mono">
              {leadingOption ? `${leadingOption.votos} votos (${leadingOption.percentual}%)` : '-'}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Presença na Data</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              {presentCountOnDay > 0 ? presentCountOnDay : 'N/D'}
            </p>
            <p className="text-[11px] text-sky-300">
              {presentCountOnDay > 0 ? 'Alunos presentes na chamada' : 'Sem chamada registrada'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Filter Control Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-filter text-indigo-600"></i>
            Filtros Dinâmicos da Apuração
          </h3>
          {(selectedCategory !== 'Todas' || selectedSessionId !== 'all' || dateScope !== 'all' || selectedTurno !== 'all' || selectedSala !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory('Todas');
                setSelectedSessionId('all');
                setDateScope('all');
                setSelectedTurno('all');
                setSelectedSala('all');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline transition-colors"
            >
              Limpar Todos os Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Categoria</label>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedSessionId('all');
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat === 'Todas' ? 'Todas as Categorias' : cat}</option>
              ))}
            </select>
          </div>

          {/* 2. Specific Voting Session */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Eleição / Sessão</label>
            <select
              value={selectedSessionId}
              onChange={e => setSelectedSessionId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas as Eleições ({sessionsInSelectedCategory.length})</option>
              {sessionsInSelectedCategory.map(sess => (
                <option key={sess.id} value={sess.id}>
                  {sess.title} {sess.date ? `(${sess.date.split('-').reverse().join('/')})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Date Scope */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Período</label>
            <select
              value={dateScope}
              onChange={e => setDateScope(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todo o Histórico</option>
              <option value="today">Apenas Hoje ({new Date().toLocaleDateString('pt-BR')})</option>
              <option value="custom">Data Específica...</option>
            </select>
          </div>

          {/* 4. Turno */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Turno</label>
            <select
              value={selectedTurno}
              onChange={e => setSelectedTurno(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos os Turnos</option>
              <option value="Integral">Integral</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
            </select>
          </div>

          {/* 5. Série */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Série</label>
            <select
              value={selectedSala}
              onChange={e => setSelectedSala(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas as Séries</option>
              <option value="1º Ano">1º Ano</option>
              <option value="2º Ano">2º Ano</option>
              <option value="3º Ano">3º Ano</option>
            </select>
          </div>
        </div>

        {/* Date input shown when custom date is chosen */}
        {dateScope === 'custom' && (
          <div className="pt-2 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600">Escolha a data da apuração:</span>
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Bar Chart: Votos por Opção/Candidato */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fas fa-poll text-indigo-600"></i>
                Resultado Geral das Urnas
              </h3>
              <p className="text-xs text-slate-500">
                Distribuição de votos computados por opção ou candidato no recorte selecionado
              </p>
            </div>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-mono">
              {filteredSelections.length} votos
            </span>
          </div>

          <div className="h-80 w-full pt-2">
            {optionResultsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={optionResultsData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} fontSize={11} stroke="#94a3b8" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={130}
                    fontSize={11}
                    tick={{ fill: '#334155', fontWeight: 'bold' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} votos (${item.payload.percentual}%)`,
                      'Votos Computados'
                    ]}
                  />
                  <Bar dataKey="votos" radius={[0, 8, 8, 0]} barSize={26}>
                    {optionResultsData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fillColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <i className="fas fa-inbox text-4xl mb-2 text-slate-300"></i>
                <p className="text-sm font-semibold">Nenhum voto registrado para o filtro aplicado.</p>
              </div>
            )}
          </div>

          {/* Option Pills Summary */}
          {optionResultsData.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              {optionResultsData.slice(0, 6).map((item, idx) => (
                <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {item.identificador}</p>
                  </div>
                  <span className="text-xs font-black text-indigo-600 font-mono shrink-0">
                    {item.votos} ({item.percentual}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Pie Chart: Participação por Série (Ano) */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-chart-pie text-emerald-600"></i>
              Engajamento por Série
            </h3>
            <p className="text-xs text-slate-500">
              Distribuição proporcional de votos por ano escolar
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {filteredSelections.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={votesBySerieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {votesBySerieData.map((entry) => (
                      <Cell key={entry.name} fill={SERIE_COLORS[entry.name] || '#64748B'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val} votos`]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 py-10">
                <i className="fas fa-chart-pie text-3xl mb-2 text-slate-300"></i>
                <p className="text-xs">Aguardando votos</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
            {votesBySerieData.map(entry => (
              <div key={entry.name} className="text-center p-2 rounded-xl bg-slate-50">
                <p className="text-[11px] font-bold text-slate-500">{entry.name}</p>
                <p className="text-sm font-black text-slate-800">{entry.percentage}%</p>
                <span className="text-[10px] text-slate-400 font-mono">({entry.value} v)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Analytics Row: Timeline + Ranking de Turmas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. Timeline / Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fas fa-chart-line text-indigo-600"></i>
                Fluxo Temporal da Votação
              </h3>
              <p className="text-xs text-slate-500">
                {targetDateBR
                  ? `Volume horário de votos no dia ${targetDateBR}`
                  : 'Evolução diária de votos no histórico'}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono bg-slate-50 px-3 py-1 rounded-full">
              {timeSeriesData.length} pontos temporais
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradientVotacao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} tick={{ fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.1)' }}
                    formatter={(val: any) => [`${val} votos`, 'Votos Registrados']}
                  />
                  <Area
                    type="monotone"
                    dataKey="votos"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#areaGradientVotacao)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Nenhum dado temporal registrado no período.
              </div>
            )}
          </div>
        </div>

        {/* 4. Ranking de Turmas */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-trophy text-amber-500"></i>
              Ranking de Turmas
            </h3>
            <p className="text-xs text-slate-500">
              Turmas com maior participação percentual nas urnas
            </p>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {rankingTurmasData.length > 0 ? (
              rankingTurmasData.map((item, idx) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-mono">
                        {idx + 1}
                      </span>
                      <span>{item.name}</span>
                    </span>
                    <span className="font-mono text-indigo-600">{item.count} votos ({item.percentual}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentual}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 py-12 text-sm">
                Sem votos computados para exibir o ranking.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Complete Audit Trail & Log Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-history text-indigo-600"></i>
              Auditoria & Log Histórico de Votos
            </h3>
            <p className="text-xs text-slate-500">
              Registro nominal cronológico de votos com identificação escolar, categoria e data/hora
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="Buscar por estudante, matrícula, turma..."
              value={searchAuditQuery}
              onChange={e => setSearchAuditQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-150">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Matrícula</th>
                <th className="p-3.5">Estudante</th>
                <th className="p-3.5">Série</th>
                <th className="p-3.5">Turma</th>
                <th className="p-3.5">Turno</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Opção Escolhida</th>
                <th className="p-3.5">Carimbo de Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {auditList.length > 0 ? (
                auditList.slice(0, 100).map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono text-slate-500">{item.matricula}</td>
                    <td className="p-3.5 font-bold text-slate-900">{item.studentName}</td>
                    <td className="p-3.5 font-semibold text-slate-600">{item.sala}</td>
                    <td className="p-3.5 text-slate-600">{item.turma}</td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.turno === 'Manhã' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        item.turno === 'Tarde' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {item.turno}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-indigo-700">
                      {item.votedFor}
                    </td>
                    <td className="p-3.5 text-[11px] font-mono text-slate-400">
                      {new Date(item.timestamp).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhum registro de voto encontrado para a busca ou filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {auditList.length > 100 && (
          <p className="text-xs text-center text-slate-400 font-medium">
            Mostrando os 100 registros mais recentes de um total de {auditList.length}. Exporte para CSV para ver o conjunto completo.
          </p>
        )}
      </div>
    </div>
  );
};
