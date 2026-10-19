import React, { useState, useMemo, useEffect } from 'react';
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
import { Student, AttendanceRecord, Selection } from '../types';

interface IntelligentAttendanceDashboardProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onSaveAttendance: (date: string, presentMatriculas: string[]) => Promise<void> | void;
  selections?: Selection[];
  currentSchoolId?: string | null;
}

const SERIE_COLORS: Record<string, string> = {
  '1º Ano': '#0EA5E9',
  '2º Ano': '#10B981',
  '3º Ano': '#6366F1'
};

const TURNO_COLORS: Record<string, string> = {
  'Integral': '#8B5CF6',
  'Manhã': '#0EA5E9',
  'Tarde': '#F59E0B',
  'Noite': '#64748B'
};

export const IntelligentAttendanceDashboard: React.FC<IntelligentAttendanceDashboardProps> = ({
  students,
  attendanceRecords,
  onSaveAttendance,
  selections = [],
  currentSchoolId
}) => {
  // Current date in YYYY-MM-DD
  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayDateStr();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Attendance management state for the selected date
  const [presentMatriculas, setPresentMatriculas] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // List filters
  const [activeListTab, setActiveListTab] = useState<'all' | 'present' | 'absent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSala, setSelectedSala] = useState<string>('all');
  const [selectedTurno, setSelectedTurno] = useState<string>('all');
  const [isListExpanded, setIsListExpanded] = useState(true);

  // Load existing attendance record for selectedDate
  useEffect(() => {
    const existing = attendanceRecords.find(a => a.date === selectedDate);
    if (existing) {
      setPresentMatriculas(existing.presentMatriculas || []);
    } else {
      // REGRA DE OURO: Por padrão, todo discente inicia como FALTOSO (desmarcado / bloqueado).
      setPresentMatriculas([]);
    }
    setSaveFeedback(null);
  }, [selectedDate, attendanceRecords]);

  // Current record
  const currentRecord = useMemo(() => {
    return attendanceRecords.find(a => a.date === selectedDate) || null;
  }, [attendanceRecords, selectedDate]);

  // Unique Salas and Turnos
  const availableSalas = useMemo(() => {
    const set = new Set<string>(['1º Ano', '2º Ano', '3º Ano']);
    students.forEach(s => s.sala && set.add(s.sala));
    return Array.from(set);
  }, [students]);

  const availableTurnos = useMemo(() => {
    const set = new Set<string>(['Integral', 'Manhã', 'Tarde', 'Noite']);
    students.forEach(s => s.turno && set.add(s.turno));
    return Array.from(set);
  }, [students]);

  // Toggle single student presence
  const toggleStudentPresence = (matricula: string) => {
    setPresentMatriculas(prev => {
      if (prev.includes(matricula)) {
        return prev.filter(m => m !== matricula);
      } else {
        return [...prev, matricula];
      }
    });
  };

  // Bulk actions
  const selectAll = () => {
    setPresentMatriculas(students.map(s => s.matricula));
  };

  const deselectAll = () => {
    setPresentMatriculas([]);
  };

  const invertSelection = () => {
    setPresentMatriculas(prev => {
      return students
        .map(s => s.matricula)
        .filter(m => !prev.includes(m));
    });
  };

  // Save attendance
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveAttendance(selectedDate, presentMatriculas);
      setSaveFeedback('Chamada escolar salva no banco com sucesso!');
      setTimeout(() => setSaveFeedback(null), 4000);
    } catch (err: any) {
      setSaveFeedback('Erro ao salvar presença: ' + (err.message || 'Falha na rede'));
    } finally {
      setIsSaving(false);
    }
  };

  // Target Date in PT-BR
  const [sY, sM, sD] = selectedDate.split('-').map(Number);
  const selectedDateBR = new Date(sY, sM - 1, sD).toLocaleDateString('pt-BR');

  // Votes cast on this date
  const votesOnSelectedDate = useMemo(() => {
    return selections.filter(s => {
      if (!s.timestamp) return false;
      const vDateBR = new Date(s.timestamp).toLocaleDateString('pt-BR');
      return vDateBR === selectedDateBR;
    });
  }, [selections, selectedDateBR]);

  const uniqueVoterMatriculasOnDate = useMemo(() => {
    return new Set(votesOnSelectedDate.map(s => s.matricula));
  }, [votesOnSelectedDate]);

  // Key Attendance Metrics for the Day
  const totalStudents = students.length;
  const presentCount = presentMatriculas.length;
  const absentCount = totalStudents - presentCount;
  const presenceRate = totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0;
  const votedCount = uniqueVoterMatriculasOnDate.size;
  const voteConversionRate = presentCount > 0 ? Number(((votedCount / presentCount) * 100).toFixed(1)) : 0;

  // Filtered Students for the interactive list
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedSala !== 'all' && student.sala !== selectedSala) return false;
      if (selectedTurno !== 'all' && student.turno !== selectedTurno) return false;

      const isPresent = presentMatriculas.includes(student.matricula);
      if (activeListTab === 'present' && !isPresent) return false;
      if (activeListTab === 'absent' && isPresent) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = student.name.toLowerCase().includes(q);
        const matchMat = student.matricula.toLowerCase().includes(q);
        const matchTurma = student.turma ? student.turma.toLowerCase().includes(q) : false;
        return matchName || matchMat || matchTurma;
      }

      return true;
    });
  }, [students, selectedSala, selectedTurno, activeListTab, searchQuery, presentMatriculas]);

  // 1. RECHARTS DATA: Historical Attendance Trend (across all recorded dates)
  const attendanceHistoryTrend = useMemo(() => {
    if (attendanceRecords.length === 0) {
      return [{ date: selectedDateBR, taxa: presenceRate, presentes: presentCount, total: totalStudents }];
    }

    const sorted = [...attendanceRecords].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map(rec => {
      const [y, m, d] = rec.date.split('-').map(Number);
      const dateLabel = new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const presCount = rec.presentMatriculas ? rec.presentMatriculas.length : 0;
      const rate = totalStudents > 0 ? Number(((presCount / totalStudents) * 100).toFixed(1)) : 0;
      return {
        date: dateLabel,
        rawDate: rec.date,
        taxa: rate,
        presentes: presCount,
        total: totalStudents
      };
    });
  }, [attendanceRecords, totalStudents, presenceRate, presentCount, selectedDateBR]);

  // 2. RECHARTS DATA: Attendance Rate by Série (Ano)
  const attendanceBySerieData = useMemo(() => {
    const seriesList = ['1º Ano', '2º Ano', '3º Ano'];
    return seriesList.map(serie => {
      const serieStudents = students.filter(s => s.sala === serie);
      const seriePresent = serieStudents.filter(s => presentMatriculas.includes(s.matricula)).length;
      const total = serieStudents.length;
      const rate = total > 0 ? Number(((seriePresent / total) * 100).toFixed(1)) : 0;
      return {
        serie,
        presentes: seriePresent,
        faltosos: total - seriePresent,
        total,
        taxa: rate,
        fillColor: SERIE_COLORS[serie] || '#6366F1'
      };
    });
  }, [students, presentMatriculas]);

  // 3. RECHARTS DATA: Attendance by Turno
  const attendanceByTurnoData = useMemo(() => {
    const turnos = ['Integral', 'Manhã', 'Tarde', 'Noite'];
    return turnos.map(turno => {
      const tStudents = students.filter(s => s.turno === turno);
      const tPresent = tStudents.filter(s => presentMatriculas.includes(s.matricula)).length;
      const total = tStudents.length;
      const rate = total > 0 ? Number(((tPresent / total) * 100).toFixed(1)) : 0;
      return {
        turno,
        presentes: tPresent,
        total,
        taxa: rate,
        fillColor: TURNO_COLORS[turno] || '#0EA5E9'
      };
    }).filter(t => t.total > 0);
  }, [students, presentMatriculas]);

  // Low attendance warning detection
  const lowAttendanceSeries = useMemo(() => {
    return attendanceBySerieData.filter(s => s.total > 0 && s.taxa < 75);
  }, [attendanceBySerieData]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                Gestão da Frequência Escolar
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Data Ativa: {selectedDateBR}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Dashboard Inteligente de Frequências
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl mt-1">
              Chamada escolar integrada, monitoramento da assiduidade e validação de presença obrigatória para habilitação nas urnas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 flex items-center gap-2">
              <i className="fas fa-calendar-day text-emerald-400"></i>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-300">Data da Chamada</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-bold text-white cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-upload-alt text-base"></i>
                  <span>Salvar Frequência</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Matriculados</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{totalStudents}</p>
            <p className="text-[11px] text-slate-300">Total de alunos da escola</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Presentes Hoje</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">{presentCount}</p>
            <p className="text-[11px] text-emerald-200">{presenceRate}% de assiduidade</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">Faltosos (Bloqueados)</p>
            <p className="text-2xl sm:text-3xl font-black text-rose-300 mt-0.5">{absentCount}</p>
            <p className="text-[11px] text-slate-300">Inaptos para votar hoje</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Conversão em Voto</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-300 mt-0.5">{votedCount}</p>
            <p className="text-[11px] text-slate-300">{voteConversionRate}% dos presentes votaram</p>
          </div>
        </div>
      </div>

      {/* Regra de Presença Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl flex items-start gap-4 text-amber-900 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 text-lg">
          <i className="fas fa-shield-alt"></i>
        </div>
        <div className="text-xs sm:text-sm">
          <p className="font-black text-amber-950 uppercase tracking-wide">
            Regra Fundamental de Cidadania & Presença
          </p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            Por padrão de segurança eleitoral, <strong>todo aluno inicia como faltoso (bloqueado para votar)</strong>.
            Apenas os discentes com a caixa de presença marcada nesta chamada escolar ficam habilitados a registrar votos nas eleições escolares da data.
          </p>
        </div>
      </div>

      {saveFeedback && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 animate-fadeIn ${
          saveFeedback.includes('sucesso')
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <i className={`fas ${saveFeedback.includes('sucesso') ? 'fa-check-circle text-emerald-600' : 'fa-exclamation-triangle text-red-600'}`}></i>
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Analytical Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Assiduidade Histórica */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fas fa-chart-area text-emerald-600"></i>
                Evolução da Taxa de Assiduidade Escolar
              </h3>
              <p className="text-xs text-slate-500">
                Histórico diário da porcentagem de presença ao longo dos dias registrados
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-mono">
              Hoje: {presenceRate}%
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceHistoryTrend} margin={{ left: -10, right: 20, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradientPresenca" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.1)' }}
                  formatter={(val: any) => [`${val}%`, 'Taxa de Presença']}
                />
                <Area
                  type="monotone"
                  dataKey="taxa"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaGradientPresenca)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Assiduidade por Série */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-layer-group text-indigo-600"></i>
              Frequência por Série
            </h3>
            <p className="text-xs text-slate-500">
              Assiduidade comparativa entre 1º, 2º e 3º ano
            </p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceBySerieData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="serie" fontSize={11} tick={{ fill: '#475569', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.1)' }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% (${item.payload.presentes} de ${item.payload.total} presentes)`,
                    'Assiduidade'
                  ]}
                />
                <Bar dataKey="taxa" radius={[6, 6, 0, 0]} barSize={34}>
                  {attendanceBySerieData.map(entry => (
                    <Cell key={entry.serie} fill={entry.fillColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
            {attendanceBySerieData.map(entry => (
              <div key={entry.serie} className="text-center p-2 rounded-xl bg-slate-50">
                <p className="text-[11px] font-bold text-slate-500">{entry.serie}</p>
                <p className="text-sm font-black text-slate-800">{entry.taxa}%</p>
                <p className="text-[10px] text-slate-400 font-mono">{entry.presentes}/{entry.total}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Attendance Alerta se houver */}
      {lowAttendanceSeries.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-exclamation-circle text-rose-500 text-xl"></i>
            <div>
              <p className="text-xs font-black text-rose-900 uppercase">
                Alerta de Frequência Abaixo da Média
              </p>
              <p className="text-xs text-rose-700">
                {lowAttendanceSeries.map(s => `${s.serie} (${s.taxa}%)`).join(', ')} apresenta assiduidade inferior a 75%. Recomenda-se contato com os responsáveis.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black text-rose-700 bg-rose-100 px-3 py-1 rounded-full shrink-0">
            Atenção Pedagógica
          </span>
        </div>
      )}

      {/* Interactive Student Calling Panel (Chamada de Sala) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Header with expand toggle */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-800">
                Registro Nominal da Chamada Escolar
              </h3>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono">
                {presentCount} de {totalStudents} presentes
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Marque os alunos presentes para liberar o acesso individual à cabine de votação
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-bold px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors border border-emerald-200"
            >
              <i className="fas fa-check-double mr-1.5"></i>
              Todos Presentes
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="text-xs font-bold px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors border border-rose-200"
            >
              <i className="fas fa-times-circle mr-1.5"></i>
              Todos Faltosos
            </button>
            <button
              type="button"
              onClick={invertSelection}
              className="text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-200"
            >
              <i className="fas fa-exchange-alt mr-1.5"></i>
              Inverter
            </button>
            <button
              type="button"
              onClick={() => setIsListExpanded(!isListExpanded)}
              className="text-xs font-bold px-3 py-2 bg-white text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              <i className={`fas ${isListExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} mr-1`}></i>
              {isListExpanded ? 'Recolher Lista' : 'Expandir Lista'}
            </button>
          </div>
        </div>

        {isListExpanded && (
          <div className="p-6 space-y-4">
            {/* Filter and Tab bar for the calling list */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              {/* Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveListTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeListTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Todos ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveListTab('present')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeListTab === 'present'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  Presentes ({presentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveListTab('absent')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeListTab === 'absent'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-700 hover:text-rose-900'
                  }`}
                >
                  Faltosos ({absentCount})
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    placeholder="Filtrar aluno..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={selectedSala}
                  onChange={e => setSelectedSala(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="all">Todas as Séries</option>
                  {availableSalas.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select
                  value={selectedTurno}
                  onChange={e => setSelectedTurno(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="all">Todos os Turnos</option>
                  {availableTurnos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const isPresent = presentMatriculas.includes(student.matricula);
                  const hasVoted = uniqueVoterMatriculasOnDate.has(student.matricula);

                  return (
                    <div
                      key={student.matricula}
                      onClick={() => toggleStudentPresence(student.matricula)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isPresent
                          ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/10'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 border border-slate-300'
                        }`}>
                          {isPresent && <i className="fas fa-check"></i>}
                        </div>
                        <div className="truncate">
                          <p className={`text-xs font-bold truncate ${isPresent ? 'text-emerald-950 font-black' : 'text-slate-700'}`}>
                            {student.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                            <span>{student.matricula}</span>
                            <span>•</span>
                            <span>{student.sala} {student.turma ? `T.${student.turma}` : ''}</span>
                            <span>•</span>
                            <span>{student.turno}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isPresent
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isPresent ? 'PRESENTE' : 'FALTOSO'}
                        </span>
                        {hasVoted && (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                            <i className="fas fa-vote-yea mr-1"></i>Já Votou
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <i className="fas fa-user-slash text-3xl mb-2 text-slate-300"></i>
                  <p className="text-xs">Nenhum aluno encontrado para os filtros selecionados.</p>
                </div>
              )}
            </div>

            {/* Bottom Actions inside list */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Mostrando <strong>{filteredStudents.length}</strong> discentes de {totalStudents}.
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Gravando no banco...' : 'Confirmar e Salvar Chamada'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
