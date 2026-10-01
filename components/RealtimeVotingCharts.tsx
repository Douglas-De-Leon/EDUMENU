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
  AreaChart,
  Area
} from 'recharts';
import { Selection, MealOption, Student, VotingSession, AttendanceRecord } from '../types';

interface RealtimeVotingChartsProps {
  selections: Selection[];
  mealOptions: MealOption[];
  votingSessions?: VotingSession[];
  students: Student[];
  attendanceRecords?: AttendanceRecord[];
  lastSync?: string | null;
  onRefresh?: () => void;
  isSyncing?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  Todas: 'Todas as Categorias',
  Gremio: 'Grêmio Escolar',
  Representante: 'Representante de Classe',
  Alimentação: 'Alimentação / Merenda',
  Outros: 'Outros Assuntos'
};

const CATEGORY_COLORS: Record<string, string> = {
  Gremio: '#4F46E5',
  Representante: '#D97706',
  Alimentação: '#059669',
  Outros: '#7C3AED',
  Todas: '#0F172A'
};

const BAR_PALETTE = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#0284C7', // Sky
  '#7C3AED', // Violet
  '#E11D48', // Rose
  '#0D9488', // Teal
  '#EA580C'  // Orange
];

export const RealtimeVotingCharts: React.FC<RealtimeVotingChartsProps> = ({
  selections,
  mealOptions,
  votingSessions = [],
  students,
  attendanceRecords = [],
  lastSync,
  onRefresh,
  isSyncing = false
}) => {
  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayDateStr();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | 'Gremio' | 'Representante' | 'Alimentação' | 'Outros'>('Todas');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [dateScope, setDateScope] = useState<'all' | 'today' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [salaGrouping, setSalaGrouping] = useState<'sala' | 'turma'>('sala');
  const [turnoFilter, setTurnoFilter] = useState<string>('all');
  const [salaFilter, setSalaFilter] = useState<string>('all');

  // Active Date string when filtering by today or custom date
  const effectiveDateStr = useMemo(() => {
    if (dateScope === 'today') return todayStr;
    if (dateScope === 'custom') return customDate;
    return null;
  }, [dateScope, todayStr, customDate]);

  const effectiveDateBR = useMemo(() => {
    if (!effectiveDateStr) return null;
    const [y, m, d] = effectiveDateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
  }, [effectiveDateStr]);

  // Sessions matching category filter
  const availableSessions = useMemo(() => {
    return votingSessions.filter(s => selectedCategory === 'Todas' || s.category === selectedCategory);
  }, [votingSessions, selectedCategory]);

  // Filtered students for Turno / Sala global filters
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const stTurno = st.turno || 'Integral';
      const stSala = st.sala || '1º Ano';
      if (turnoFilter !== 'all' && stTurno !== turnoFilter) return false;
      if (salaFilter !== 'all' && stSala !== salaFilter) return false;
      return true;
    });
  }, [students, turnoFilter, salaFilter]);

  // Attendance record for effective date (or today if dateScope === 'all')
  const activeAttendanceRecord = useMemo(() => {
    const targetDate = effectiveDateStr || todayStr;
    return attendanceRecords.find(a => a.date === targetDate) || null;
  }, [attendanceRecords, effectiveDateStr, todayStr]);

  const presentSet = useMemo(() => {
    return new Set(activeAttendanceRecord?.presentMatriculas || []);
  }, [activeAttendanceRecord]);

  // Filtered selections (votes) based on active filters
  const filteredSelections = useMemo(() => {
    return selections.filter(s => {
      if (selectedCategory !== 'Todas' && s.category !== selectedCategory) return false;
      if (selectedSessionId !== 'all' && s.votingSessionId !== selectedSessionId) return false;

      if (effectiveDateBR) {
        if (!s.timestamp) return false;
        const voteDateBR = new Date(s.timestamp).toLocaleDateString('pt-BR');
        if (voteDateBR !== effectiveDateBR) return false;
      }

      const student = students.find(st => st.matricula === s.matricula);
      const voteTurno = s.turno || student?.turno || 'Integral';
      const voteSala = s.sala || student?.sala || '1º Ano';

      if (turnoFilter !== 'all' && voteTurno !== turnoFilter) return false;
      if (salaFilter !== 'all' && voteSala !== salaFilter) return false;

      return true;
    });
  }, [selections, selectedCategory, selectedSessionId, effectiveDateBR, students, turnoFilter, salaFilter]);

  // 1. DADOS DE VOTOS POR CANDIDATO / OPÇÃO
  const candidateChartData = useMemo(() => {
    // Filter options matching selected category & session
    const activeSession = selectedSessionId !== 'all'
      ? votingSessions.find(vs => vs.id === selectedSessionId)
      : null;

    let relevantOptions = mealOptions.filter(opt => {
      if (selectedCategory !== 'Todas' && opt.category !== selectedCategory) return false;
      if (activeSession && activeSession.optionIds && activeSession.optionIds.length > 0) {
        return activeSession.optionIds.includes(opt.id);
      }
      return true;
    });

    const voteCounts: Record<string, number> = {};
    filteredSelections.forEach(s => {
      voteCounts[s.mealId] = (voteCounts[s.mealId] || 0) + 1;
    });

    const totalVotesInScope = filteredSelections.length;

    const rows = relevantOptions.map((opt, idx) => {
      const votos = voteCounts[opt.id] || 0;
      const percentual = totalVotesInScope > 0 ? Number(((votos / totalVotesInScope) * 100).toFixed(1)) : 0;
      return {
        id: opt.id,
        name: opt.name,
        shortName: opt.name.length > 22 ? opt.name.substring(0, 20) + '…' : opt.name,
        identificador: opt.calories || 'Sem ID',
        categoria: CATEGORY_LABELS[opt.category] || opt.category,
        categoryKey: opt.category,
        votos,
        percentual,
        active: opt.active !== false,
        color: selectedCategory === 'Todas'
          ? (CATEGORY_COLORS[opt.category] || BAR_PALETTE[idx % BAR_PALETTE.length])
          : BAR_PALETTE[idx % BAR_PALETTE.length]
      };
    });

    // Also include any voted option that might have been removed from mealOptions
    Object.entries(voteCounts).forEach(([mealId, count]) => {
      if (!rows.some(r => r.id === mealId)) {
        const percentual = totalVotesInScope > 0 ? Number(((count / totalVotesInScope) * 100).toFixed(1)) : 0;
        rows.push({
          id: mealId,
          name: `Opção (${mealId.slice(0, 8)})`,
          shortName: `Opção (${mealId.slice(0, 8)})`,
          identificador: 'Histórico',
          categoria: 'Arquivado',
          categoryKey: 'Outros',
          votos: count,
          percentual,
          active: false,
          color: '#94A3B8'
        });
      }
    });

    return rows.sort((a, b) => b.votos - a.votos);
  }, [mealOptions, votingSessions, selectedCategory, selectedSessionId, filteredSelections]);

  // 2. DADOS DE PARTICIPAÇÃO POR TURNO
  const turnoParticipationData = useMemo(() => {
    const defaultTurnos = ['Manhã', 'Tarde', 'Integral', 'Noite'];
    const turnosSet = new Set<string>(defaultTurnos);
    students.forEach(s => {
      if (s.turno) turnosSet.add(s.turno);
    });
    selections.forEach(s => {
      if (s.turno) turnosSet.add(s.turno);
    });

    return Array.from(turnosSet).map(turno => {
      const studentsInTurno = students.filter(st => (st.turno || 'Integral') === turno && (salaFilter === 'all' || (st.sala || '1º Ano') === salaFilter));
      const totalAlunos = studentsInTurno.length;
      const presentes = studentsInTurno.filter(st => presentSet.has(st.matricula)).length;

      // Votantes únicos neste turno dentro do escopo filtrado
      const votesInTurno = selections.filter(s => {
        if (selectedCategory !== 'Todas' && s.category !== selectedCategory) return false;
        if (selectedSessionId !== 'all' && s.votingSessionId !== selectedSessionId) return false;
        if (effectiveDateBR) {
          if (!s.timestamp) return false;
          if (new Date(s.timestamp).toLocaleDateString('pt-BR') !== effectiveDateBR) return false;
        }
        const st = students.find(stud => stud.matricula === s.matricula);
        const sTurno = s.turno || st?.turno || 'Integral';
        const sSala = s.sala || st?.sala || '1º Ano';
        if (sTurno !== turno) return false;
        if (salaFilter !== 'all' && sSala !== salaFilter) return false;
        return true;
      });

      const uniqueVoters = new Set(votesInTurno.map(v => v.matricula)).size;
      const totalVotos = votesInTurno.length;

      const taxaParticipacao = totalAlunos > 0
        ? Number(((uniqueVoters / totalAlunos) * 100).toFixed(1))
        : (uniqueVoters > 0 ? 100 : 0);

      const taxaPresenca = presentes > 0
        ? Number(((uniqueVoters / presentes) * 100).toFixed(1))
        : 0;

      return {
        turno,
        totalAlunos,
        presentes,
        votantes: uniqueVoters,
        abstencao: Math.max(0, totalAlunos - uniqueVoters),
        totalVotos,
        taxaParticipacao,
        taxaPresenca
      };
    }).filter(item => item.totalAlunos > 0 || item.votantes > 0 || defaultTurnos.includes(item.turno));
  }, [students, selections, selectedCategory, selectedSessionId, effectiveDateBR, salaFilter, presentSet]);

  // 3. DADOS DE PARTICIPAÇÃO POR SALA / SÉRIE OU TURMA
  const salaParticipationData = useMemo(() => {
    const groupsMap = new Map<string, { label: string; sala: string; turma?: string; students: Student[] }>();

    if (salaGrouping === 'sala') {
      ['1º Ano', '2º Ano', '3º Ano'].forEach(s => {
        groupsMap.set(s, { label: s, sala: s, students: [] });
      });
    }

    students.forEach(st => {
      const stTurno = st.turno || 'Integral';
      if (turnoFilter !== 'all' && stTurno !== turnoFilter) return;

      const s = st.sala || '1º Ano';
      const t = st.turma || 'A';
      const key = salaGrouping === 'sala' ? s : `${s} - Turma ${t}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, { label: key, sala: s, turma: salaGrouping === 'turma' ? t : undefined, students: [] });
      }
      groupsMap.get(key)!.students.push(st);
    });

    // Also ensure any sala/turma present in votes is represented
    selections.forEach(sel => {
      const st = students.find(stud => stud.matricula === sel.matricula);
      const selTurno = sel.turno || st?.turno || 'Integral';
      if (turnoFilter !== 'all' && selTurno !== turnoFilter) return;

      const s = sel.sala || st?.sala || '1º Ano';
      const t = sel.turma || st?.turma || 'A';
      const key = salaGrouping === 'sala' ? s : `${s} - Turma ${t}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { label: key, sala: s, turma: salaGrouping === 'turma' ? t : undefined, students: [] });
      }
    });

    return Array.from(groupsMap.values()).map(group => {
      const totalAlunos = group.students.length;
      const presentes = group.students.filter(st => presentSet.has(st.matricula)).length;

      const votesInGroup = selections.filter(sel => {
        if (selectedCategory !== 'Todas' && sel.category !== selectedCategory) return false;
        if (selectedSessionId !== 'all' && sel.votingSessionId !== selectedSessionId) return false;
        if (effectiveDateBR) {
          if (!sel.timestamp) return false;
          if (new Date(sel.timestamp).toLocaleDateString('pt-BR') !== effectiveDateBR) return false;
        }
        const st = students.find(stud => stud.matricula === sel.matricula);
        const selTurno = sel.turno || st?.turno || 'Integral';
        if (turnoFilter !== 'all' && selTurno !== turnoFilter) return false;

        const s = sel.sala || st?.sala || '1º Ano';
        const t = sel.turma || st?.turma || 'A';
        if (salaGrouping === 'sala') return s === group.sala;
        return s === group.sala && t === group.turma;
      });

      const uniqueVoters = new Set(votesInGroup.map(v => v.matricula)).size;
      const totalVotos = votesInGroup.length;
      const taxaParticipacao = totalAlunos > 0
        ? Number(((uniqueVoters / totalAlunos) * 100).toFixed(1))
        : (uniqueVoters > 0 ? 100 : 0);

      const taxaPresenca = presentes > 0
        ? Number(((uniqueVoters / presentes) * 100).toFixed(1))
        : 0;

      return {
        name: group.label,
        totalAlunos,
        presentes,
        votantes: uniqueVoters,
        abstencao: Math.max(0, totalAlunos - uniqueVoters),
        totalVotos,
        taxaParticipacao,
        taxaPresenca
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selections, salaGrouping, turnoFilter, selectedCategory, selectedSessionId, effectiveDateBR, presentSet]);

  // 4. PROGRESSO TEMPORAL EM TEMPO REAL (FLUXO DE VOTOS)
  const timelineProgressData = useMemo(() => {
    if (filteredSelections.length === 0) return [];

    // Sort votes chronologically
    const sorted = [...filteredSelections]
      .filter(s => Boolean(s.timestamp))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const bucketsMap = new Map<string, { label: string; votosNoPeriodo: number; acumulado: number }>();
    let cumulative = 0;

    sorted.forEach(s => {
      const d = new Date(s.timestamp);
      const label = effectiveDateStr
        ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

      cumulative += 1;
      const existing = bucketsMap.get(label);
      if (existing) {
        existing.votosNoPeriodo += 1;
        existing.acumulado = cumulative;
      } else {
        bucketsMap.set(label, {
          label,
          votosNoPeriodo: 1,
          acumulado: cumulative
        });
      }
    });

    return Array.from(bucketsMap.values());
  }, [filteredSelections, effectiveDateStr]);

  // 5. KPIs GERAIS DO ESCOPO
  const summaryMetrics = useMemo(() => {
    const totalStudentsCount = filteredStudents.length;
    const uniqueVotersCount = new Set(filteredSelections.map(s => s.matricula)).size;
    const presentStudentsCount = filteredStudents.filter(s => presentSet.has(s.matricula)).length;

    const overallTurnoutPct = totalStudentsCount > 0
      ? Number(((uniqueVotersCount / totalStudentsCount) * 100).toFixed(1))
      : 0;

    const presentTurnoutPct = presentStudentsCount > 0
      ? Number(((uniqueVotersCount / presentStudentsCount) * 100).toFixed(1))
      : 0;

    const leader = candidateChartData.length > 0 && candidateChartData[0].votos > 0
      ? candidateChartData[0]
      : null;

    const runnerUp = candidateChartData.length > 1 && candidateChartData[1].votos > 0
      ? candidateChartData[1]
      : null;

    return {
      totalStudentsCount,
      uniqueVotersCount,
      presentStudentsCount,
      totalVotesCast: filteredSelections.length,
      overallTurnoutPct,
      presentTurnoutPct,
      abstentionCount: Math.max(0, totalStudentsCount - uniqueVotersCount),
      leader,
      runnerUp
    };
  }, [filteredStudents, filteredSelections, presentSet, candidateChartData]);

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Monitoramento Eleitoral em Tempo Real</span>
            {lastSync && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-500 font-mono tabular-nums">Sincronizado às {lastSync}</span>
              </>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Progresso da Votação: Votos por Candidato e Participação por Turno/Sala
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Acompanhe ao vivo a apuração comparativa entre candidatos e o índice de comparecimento estudantil estratificado por turno, série e turma.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Scope Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setDateScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                dateScope === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tempo Real (Geral)
            </button>
            <button
              type="button"
              onClick={() => setDateScope('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                dateScope === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoje ({todayStr.split('-').reverse().slice(0, 2).join('/')})
            </button>
            <button
              type="button"
              onClick={() => setDateScope('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                dateScope === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por Data
            </button>
          </div>

          {dateScope === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <i className={`fas fa-sync-alt text-[11px] ${isSyncing ? 'fa-spin' : ''}`}></i>
              <span>{isSyncing ? 'Sincronizando...' : 'Atualizar Agora'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Filter Bar: Category, Session, Turno, Sala */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            Categoria Eleitoral
          </label>
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value as any);
              setSelectedSessionId('all');
            }}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Todas">Todas as Categorias</option>
            <option value="Gremio">Grêmio Escolar</option>
            <option value="Representante">Representante de Classe</option>
            <option value="Alimentação">Alimentação / Merenda</option>
            <option value="Outros">Outros Assuntos</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            Sessão de Votação (Urna)
          </label>
          <select
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas as Sessões ({availableSessions.length})</option>
            {availableSessions.map(sess => (
              <option key={sess.id} value={sess.id}>
                {sess.title} ({sess.date.split('-').reverse().join('/')})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            Filtrar por Turno
          </label>
          <select
            value={turnoFilter}
            onChange={e => setTurnoFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os Turnos</option>
            <option value="Integral">Integral</option>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
            <option value="Noite">Noite</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            Filtrar por Série / Sala
          </label>
          <select
            value={salaFilter}
            onChange={e => setSalaFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas as Salas / Séries</option>
            <option value="1º Ano">1º Ano</option>
            <option value="2º Ano">2º Ano</option>
            <option value="3º Ano">3º Ano</option>
          </select>
        </div>
      </div>

      {/* Real-Time Progress KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Taxa de Participação Global */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Taxa de Participação (Alunos)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">
                {summaryMetrics.overallTurnoutPct}%
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {summaryMetrics.uniqueVotersCount} / {summaryMetrics.totalStudentsCount} alunos
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, summaryMetrics.overallTurnoutPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
              <span>Votantes: {summaryMetrics.uniqueVotersCount}</span>
              <span>Abstenção: {summaryMetrics.abstentionCount}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Conversão sobre Presença Confirmada */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Participação dos Presentes na Chamada
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-emerald-700 font-mono tabular-nums">
                {summaryMetrics.presentStudentsCount > 0 ? `${summaryMetrics.presentTurnoutPct}%` : '—'}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {summaryMetrics.presentStudentsCount} presentes
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, summaryMetrics.presentTurnoutPct)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {summaryMetrics.presentStudentsCount > 0
                ? `${summaryMetrics.uniqueVotersCount} de ${summaryMetrics.presentStudentsCount} alunos presentes já votaram`
                : 'Chamada do dia ainda sem presenças confirmadas'}
            </p>
          </div>
        </div>

        {/* Card 3: Total de Votos Computados */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Cédulas / Votos Computados
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">
                {summaryMetrics.totalVotesCast}
              </span>
              <span className="text-xs text-indigo-600 font-semibold">
                {CATEGORY_LABELS[selectedCategory]}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Opções na disputa:</span>
            <span className="font-mono tabular-nums font-bold text-slate-800">
              {candidateChartData.length} candidatos/opções
            </span>
          </div>
        </div>

        {/* Card 4: Candidato / Opção Líder */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Candidato / Opção Líder em Tempo Real
            </span>
            <p className="text-base font-black text-slate-900 truncate mt-1" title={summaryMetrics.leader?.name}>
              {summaryMetrics.leader ? summaryMetrics.leader.name : 'Aguardando votos'}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            {summaryMetrics.leader ? (
              <>
                <span className="font-mono tabular-nums font-bold text-indigo-600">
                  {summaryMetrics.leader.votos} votos ({summaryMetrics.leader.percentual}%)
                </span>
                {summaryMetrics.runnerUp && (
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    +{summaryMetrics.leader.votos - summaryMetrics.runnerUp.votos} de vantagem
                  </span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-slate-400">Nenhum voto registrado no filtro</span>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CHARTS GRID: VOTOS POR CANDIDATO vs TAXA DE PARTICIPAÇÃO POR SALA/TURNO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: Número de Votos por Candidato (7 columns on desktop) */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Comparativo de Votos por Candidato / Opção
              </h3>
              <p className="text-xs text-slate-500">
                Volume de votos recebidos e participação percentual de cada candidato em tempo real
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              Total: <strong className="text-slate-900">{summaryMetrics.totalVotesCast}</strong> votos
            </div>
          </div>

          {candidateChartData.length > 0 ? (
            <>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={candidateChartData}
                    layout="vertical"
                    margin={{ top: 8, right: 28, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#F1F5F9" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis
                      dataKey="shortName"
                      type="category"
                      width={135}
                      stroke="#334155"
                      fontSize={11}
                      tick={{ fill: '#1E293B', fontWeight: 700 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#F8FAFC' }}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        color: '#F8FAFC',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: string, props: any) => {
                        if (name === 'votos') {
                          return [`${value} votos (${props.payload.percentual}%)`, 'Votos Computados'];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label: any, payload: any) => {
                        if (payload && payload[0]?.payload) {
                          const p = payload[0].payload;
                          return `${p.name} · ${p.identificador} (${p.categoria})`;
                        }
                        return label;
                      }}
                    />
                    <Bar dataKey="votos" name="votos" radius={[0, 6, 6, 0]} barSize={22}>
                      {candidateChartData.map((entry, idx) => (
                        <Cell key={`cand-cell-${entry.id}-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Candidate Breakdown Table with Tabular Numerals */}
              <div className="pt-3 border-t border-slate-100 space-y-2 max-h-52 overflow-y-auto pr-1">
                {candidateChartData.map((cand, index) => (
                  <div key={cand.id} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono tabular-nums font-bold text-slate-400 w-5">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: cand.color }}
                      />
                      <span className="font-bold text-slate-800 truncate">{cand.name}</span>
                      <span className="text-slate-400 hidden sm:inline">·</span>
                      <span className="text-slate-500 font-mono text-[11px] hidden sm:inline truncate">
                        {cand.identificador}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, cand.percentual)}%`, backgroundColor: cand.color }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 w-16 text-right">
                        {cand.votos} {cand.votos === 1 ? 'voto' : 'votos'}
                      </span>
                      <span className="text-slate-500 w-12 text-right">
                        {cand.percentual}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
              <i className="fas fa-chart-bar text-2xl mb-2 text-slate-300"></i>
              <p className="text-sm font-bold text-slate-600">Nenhum candidato ou opção encontrada para este filtro</p>
              <p className="text-xs text-slate-400 mt-1">
                Cadastre opções de votação ou selecione outra categoria eleitoral acima.
              </p>
            </div>
          )}
        </div>

        {/* CHART 2: Taxa de Participação por Turno (5 columns on desktop) */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Taxa de Participação por Turno
              </h3>
              <p className="text-xs text-slate-500">
                Alunos matriculados vs. votantes e taxa de adesão (%) por turno
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={turnoParticipationData}
                margin={{ top: 10, right: 12, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="turno"
                  stroke="#64748B"
                  fontSize={11}
                  tick={{ fill: '#1E293B', fontWeight: 700 }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  unit="%"
                  stroke="#4F46E5"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Taxa de Participação (%)') return [`${value}%`, name];
                    return [`${value} alunos`, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="totalAlunos"
                  name="Matriculados"
                  fill="#CBD5E1"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  yAxisId="left"
                  dataKey="votantes"
                  name="Votantes"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="taxaParticipacao"
                  name="Taxa de Participação (%)"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#FFFFFF' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Turno Breakdown List */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
            {turnoParticipationData.map(item => (
              <div
                key={item.turno}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.turno}</span>
                  <span className="font-mono tabular-nums font-black text-indigo-600">
                    {item.taxaParticipacao}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden my-1.5">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, item.taxaParticipacao)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                  <span>{item.votantes}/{item.totalAlunos} alunos</span>
                  <span>{item.presentes} pres.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECOND ROW: TAXA DE PARTICIPAÇÃO POR SALA / TURMA & EVOLUÇÃO EM TEMPO REAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 3: Taxa de Participação por Sala / Série ou Turma (7 columns) */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 bg-white space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Taxa de Participação por Sala / Série e Turma
              </h3>
              <p className="text-xs text-slate-500">
                Comparativo entre total de alunos da sala, presentes na chamada, votantes e % de participação
              </p>
            </div>

            {/* Grouping Switcher: Por Sala/Série vs Por Turma */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSalaGrouping('sala')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  salaGrouping === 'sala' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Série / Sala
              </button>
              <button
                type="button"
                onClick={() => setSalaGrouping('turma')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  salaGrouping === 'turma' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Sala + Turma
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={salaParticipationData}
                margin={{ top: 10, right: 16, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={11}
                  tick={{ fill: '#1E293B', fontWeight: 700 }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  unit="%"
                  stroke="#D97706"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Taxa de Participação (%)') return [`${value}%`, name];
                    return [`${value} alunos`, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="totalAlunos"
                  name="Total na Sala"
                  fill="#CBD5E1"
                  radius={[4, 4, 0, 0]}
                  barSize={22}
                />
                <Bar
                  yAxisId="left"
                  dataKey="presentes"
                  name="Presentes na Chamada"
                  fill="#38BDF8"
                  radius={[4, 4, 0, 0]}
                  barSize={22}
                />
                <Bar
                  yAxisId="left"
                  dataKey="votantes"
                  name="Votos Computados"
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                  barSize={22}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="taxaParticipacao"
                  name="Taxa de Participação (%)"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#D97706', strokeWidth: 2, stroke: '#FFFFFF' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Sala / Turma Tabular Summary */}
          <div className="overflow-x-auto border-t border-slate-100 pt-3">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-3 font-bold">Sala / Turma</th>
                  <th className="py-2 px-3 font-bold text-right">Matriculados</th>
                  <th className="py-2 px-3 font-bold text-right">Presentes</th>
                  <th className="py-2 px-3 font-bold text-right">Votantes</th>
                  <th className="py-2 px-3 font-bold text-right">Abstenção</th>
                  <th className="py-2 pl-3 font-bold text-right">Participação (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {salaParticipationData.map(row => (
                  <tr key={row.name} className="hover:bg-slate-50">
                    <td className="py-2 pr-3 font-sans font-bold text-slate-800">{row.name}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{row.totalAlunos}</td>
                    <td className="py-2 px-3 text-right text-sky-700 font-semibold">{row.presentes}</td>
                    <td className="py-2 px-3 text-right text-indigo-700 font-bold">{row.votantes}</td>
                    <td className="py-2 px-3 text-right text-slate-500">{row.abstencao}</td>
                    <td className="py-2 pl-3 text-right">
                      <span className="font-bold text-slate-900">{row.taxaParticipacao}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CHART 4: Curva de Progresso Acumulado de Votos em Tempo Real (5 columns) */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">
              Evolução Acumulada de Votos em Tempo Real
            </h3>
            <p className="text-xs text-slate-500">
              Curva de crescimento da apuração conforme os estudantes registram seus votos
            </p>
          </div>

          {timelineProgressData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineProgressData}
                  margin={{ top: 10, right: 14, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="realtimeCumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="label"
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'acumulado') return [`${value} votos acumulados`, 'Total Acumulado'];
                      return [`${value} novos votos`, 'No Horário'];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="acumulado"
                    name="acumulado"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#realtimeCumulativeGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
              <i className="fas fa-chart-area text-2xl mb-2 text-slate-300"></i>
              <p className="text-sm font-bold text-slate-600">Aguardando novos votos para traçar a curva temporal</p>
              <p className="text-xs text-slate-400 mt-1">
                Assim que os alunos votarem, o gráfico exibirá a progressão horária e acumulada em tempo real.
              </p>
            </div>
          )}

          {/* Meta de Quórum Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Progresso de Quórum Escolar</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {summaryMetrics.uniqueVotersCount} de {summaryMetrics.totalStudentsCount} estudantes ({summaryMetrics.overallTurnoutPct}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, summaryMetrics.overallTurnoutPct)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Os gráficos acima atualizam automaticamente via Firestore sempre que um aluno confirma o voto na urna.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
