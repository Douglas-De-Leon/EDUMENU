import React, { useState, useMemo } from 'react';
import { Selection, MealOption, Student, VotingSession, AttendanceRecord } from '../types';

interface VotingTrackingDashboardProps {
  selections: Selection[];
  mealOptions: MealOption[];
  votingSessions?: VotingSession[];
  students: Student[];
  attendanceRecords?: AttendanceRecord[];
}

export const VotingTrackingDashboard: React.FC<VotingTrackingDashboardProps> = ({
  selections,
  mealOptions,
  votingSessions = [],
  students,
  attendanceRecords = []
}) => {
  // Today's date string YYYY-MM-DD
  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayDateStr();

  // State for the historical/date-filtered list
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterCategory, setFilterCategory] = useState<'Todas' | 'Gremio' | 'Representante' | 'Alimentação' | 'Outros'>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTurno, setFilterTurno] = useState<string>('all');
  const [filterSala, setFilterSala] = useState<string>('all');

  const categories = [
    { id: 'Gremio', name: 'Grêmio Escolar', icon: 'fa-users', color: 'indigo', border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700', badgeBg: 'bg-indigo-600' },
    { id: 'Representante', name: 'Representante de Classe', icon: 'fa-user-tie', color: 'amber', border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', badgeBg: 'bg-amber-500' },
    { id: 'Alimentação', name: 'Alimentação / Merenda', icon: 'fa-utensils', color: 'emerald', border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', badgeBg: 'bg-emerald-600' },
    { id: 'Outros', name: 'Outros Assuntos', icon: 'fa-clipboard-check', color: 'purple', border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', badgeBg: 'bg-purple-600' }
  ] as const;

  // 1. ACOMPANHAMENTO DO DIA POR CATEGORIA
  const todayMetricsByCategory = useMemo(() => {
    // Parse local date of each vote
    const todayBR = new Date().toLocaleDateString('pt-BR');

    return categories.map(cat => {
      // Votes today for this category
      const votesInCatToday = selections.filter(s => {
        if (s.category !== cat.id) return false;
        if (!s.timestamp) return false;
        const voteDate = new Date(s.timestamp);
        return voteDate.toLocaleDateString('pt-BR') === todayBR;
      });

      // Active sessions today for this category
      const catSessionsToday = votingSessions.filter(vs => vs.category === cat.id && vs.active && (!vs.date || vs.date === todayStr));

      // Options / candidates in this category
      const optionsInCat = mealOptions.filter(m => m.category === cat.id && m.active);

      // Ranking of votes today
      const optionCounts: Record<string, number> = {};
      votesInCatToday.forEach(v => {
        optionCounts[v.mealId] = (optionCounts[v.mealId] || 0) + 1;
      });

      const sortedOptions = Object.entries(optionCounts)
        .map(([id, count]) => {
          const opt = mealOptions.find(m => m.id === id);
          return {
            id,
            name: opt?.name || 'Opção Desconhecida',
            identificador: opt?.calories || '',
            count,
            percentage: votesInCatToday.length > 0 ? Math.round((count / votesInCatToday.length) * 100) : 0
          };
        })
        .sort((a, b) => b.count - a.count);

      const leadingOption = sortedOptions[0] || null;

      // Unique voters
      const uniqueStudents = new Set(votesInCatToday.map(s => s.matricula)).size;

      // Turnout rate based on total school students
      const turnoutRate = students.length > 0
        ? Math.round((uniqueStudents / students.length) * 100)
        : 0;

      return {
        ...cat,
        totalVotesToday: votesInCatToday.length,
        uniqueStudents,
        turnoutRate,
        leadingOption,
        optionsCount: optionsInCat.length,
        activeSessionsCount: catSessionsToday.length,
        topThree: sortedOptions.slice(0, 3)
      };
    });
  }, [selections, mealOptions, votingSessions, students, todayStr]);

  // Overall today totals
  const todayTotalVotes = useMemo(() => {
    const todayBR = new Date().toLocaleDateString('pt-BR');
    return selections.filter(s => {
      if (!s.timestamp) return false;
      return new Date(s.timestamp).toLocaleDateString('pt-BR') === todayBR;
    }).length;
  }, [selections]);

  // 2. LISTA DE VOTAÇÕES REALIZADAS POR DATA SELECIONADA E CATEGORIA
  const targetDateBR = useMemo(() => {
    if (!selectedDate) return '';
    const [year, month, day] = selectedDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  }, [selectedDate]);

  // Filtered votes on selected date and category
  const filteredVotesList = useMemo(() => {
    return selections
      .filter(s => {
        if (!s.timestamp) return false;
        const voteDate = new Date(s.timestamp).toLocaleDateString('pt-BR');
        if (voteDate !== targetDateBR) return false;

        if (filterCategory !== 'Todas' && s.category !== filterCategory) return false;
        if (filterTurno !== 'all' && s.turno !== filterTurno) return false;
        if (filterSala !== 'all' && s.sala !== filterSala) return false;

        return true;
      })
      .map(s => {
        const student = students.find(stud => stud.matricula === s.matricula);
        const meal = mealOptions.find(m => m.id === s.mealId);
        const session = s.votingSessionId ? votingSessions.find(vs => vs.id === s.votingSessionId) : null;
        const voteTime = new Date(s.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        return {
          id: `${s.matricula}_${s.timestamp}`,
          matricula: s.matricula,
          studentName: student?.name || 'Aluno Não Cadastrado',
          turno: s.turno || student?.turno || 'Integral',
          sala: s.sala || student?.sala || '1º Ano',
          turma: s.turma || student?.turma || 'A',
          optionName: meal?.name || 'Opção Removida',
          optionIdent: meal?.calories || '',
          category: s.category,
          sessionTitle: session?.title || 'Votação Padrão',
          timestamp: s.timestamp,
          voteTime
        };
      })
      .filter(v => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          v.studentName.toLowerCase().includes(q) ||
          v.matricula.includes(q) ||
          v.optionName.toLowerCase().includes(q) ||
          v.sala.toLowerCase().includes(q) ||
          v.turma.toLowerCase().includes(q) ||
          v.sessionTitle.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [selections, students, mealOptions, votingSessions, targetDateBR, filterCategory, filterTurno, filterSala, searchQuery]);

  // Breakdown of votes by candidate on selected date
  const selectedDateCandidateBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; name: string; category: string; ident: string }> = {};
    filteredVotesList.forEach(v => {
      const key = v.optionName;
      if (!counts[key]) {
        counts[key] = { count: 0, name: v.optionName, category: v.category, ident: v.optionIdent };
      }
      counts[key].count++;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [filteredVotesList]);

  // Total eligible attendance on selected date
  const selectedDateAttendance = useMemo(() => {
    return attendanceRecords.find(a => a.date === selectedDate);
  }, [attendanceRecords, selectedDate]);

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* ========================================================= */}
      {/* SEÇÃO 1: ACOMPANHAMENTO DE VOTAÇÃO DO DIA POR CATEGORIA */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-indigo-400/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Acompanhamento do Dia em Tempo Real
            </div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
              <i className="fas fa-chart-line text-indigo-400"></i>
              Monitoramento das Votações de Hoje
            </h3>
            <p className="text-xs text-slate-300 font-medium max-w-2xl">
              Acompanhe a participação dos alunos e a apuração parcial para cada categoria eleitoral neste dia ({new Date().toLocaleDateString('pt-BR')}).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/15 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center text-xl shadow-lg">
              <i className="fas fa-vote-yea"></i>
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">Total de Votos Hoje</span>
              <span className="text-3xl font-black text-white">{todayTotalVotes}</span>
              <span className="text-[10px] text-indigo-200 block font-medium">todas as categorias</span>
            </div>
          </div>
        </div>

        {/* Grade com os 4 Cards de Categoria */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {todayMetricsByCategory.map(cat => (
            <div
              key={cat.id}
              className={`bg-white rounded-3xl border-2 ${cat.border} p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div className="space-y-4">
                {/* Header do Card */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-xl ${cat.bg} ${cat.text}`}>
                    <i className={`fas ${cat.icon}`}></i>
                    {cat.name}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                    {cat.activeSessionsCount > 0 ? '🟢 Urna Ativa' : '⚪ Sem Sessão'}
                  </span>
                </div>

                {/* Métricas Principais */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-150">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-3xl font-black text-slate-900">{cat.totalVotesToday}</span>
                    <span className="text-xs font-bold text-slate-500">votos hoje</span>
                  </div>

                  {/* Barra de Progresso de Participação */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Participação:</span>
                      <span className="text-indigo-600">{cat.turnoutRate}% ({cat.uniqueStudents}/{students.length})</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cat.badgeBg} transition-all duration-500`}
                        style={{ width: `${Math.min(cat.turnoutRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Líder Atual na Categoria */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                    {cat.totalVotesToday > 0 ? '🏆 Opção Mais Votada Hoje' : '📊 Status da Cédula'}
                  </span>

                  {cat.leadingOption ? (
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                      <div className="overflow-hidden">
                        <span className="text-xs font-black text-slate-800 block truncate">
                          {cat.leadingOption.name}
                        </span>
                        {cat.leadingOption.identificador && (
                          <span className="text-[10px] font-bold text-emerald-700 block truncate">
                            {cat.leadingOption.identificador}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg block">
                          {cat.leadingOption.count} votos
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {cat.leadingOption.percentage}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200 text-center">
                      Nenhum voto registrado hoje nesta categoria.
                    </p>
                  )}
                </div>

                {/* Top 3 Resumo */}
                {cat.topThree.length > 1 && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Outras Opções:
                    </span>
                    {cat.topThree.slice(1).map((opt, i) => (
                      <div key={opt.id} className="flex justify-between items-center text-xs text-slate-600">
                        <span className="truncate pr-2">{i + 2}º {opt.name}</span>
                        <span className="font-bold text-slate-700 shrink-0">{opt.count} v</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>{cat.optionsCount} opções disponíveis</span>
                <button
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setFilterCategory(cat.id);
                    const el = document.getElementById('historico-votacoes-secao');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1"
                >
                  Ver Cédulas <i className="fas fa-arrow-down text-[10px]"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 2: LISTA DE VOTAÇÕES REALIZADAS POR DATA E CATEGORIA */}
      {/* ========================================================= */}
      <div id="historico-votacoes-secao" className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Cabeçalho da Seção de Histórico com Seletores */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-indigo-100">
              <i className="fas fa-history"></i>
              Auditoria e Registro Eleitoral
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <i className="fas fa-list-check text-indigo-600"></i>
              Votações Realizadas por Data e Categoria
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Consulte e audite cada voto computado no sistema filtrando por dia específico e categoria eleitoral.
            </p>
          </div>

          {/* Seletor de Data & Atalhos */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-black text-slate-600 flex items-center gap-1.5 pl-1">
              <i className="fas fa-calendar-day text-indigo-600"></i>
              Data:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-300 font-black text-xs text-slate-800 rounded-xl px-3 py-2 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                selectedDate === todayStr 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
                setSelectedDate(yStr);
              }}
              className="px-3 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
            >
              Ontem
            </button>
          </div>
        </div>

        {/* Filtro de Categorias em Abas */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2">
            Categoria:
          </span>
          <button
            onClick={() => setFilterCategory('Todas')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              filterCategory === 'Todas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <i className="fas fa-layer-group"></i>
            Todas as Categorias
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                filterCategory === cat.id
                  ? `${cat.badgeBg} text-white shadow-xs`
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <i className={`fas ${cat.icon}`}></i>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Barra de Filtros Adicionais & Busca */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="relative sm:col-span-2">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="Buscar aluno, matrícula, turma ou candidato..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <select
              value={filterSala}
              onChange={e => setFilterSala(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              <option value="all">Todas as Séries / Salas</option>
              <option value="1º Ano">1º Ano</option>
              <option value="2º Ano">2º Ano</option>
              <option value="3º Ano">3º Ano</option>
            </select>
          </div>

          <div>
            <select
              value={filterTurno}
              onChange={e => setFilterTurno(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              <option value="all">Todos os Turnos</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Integral">Integral</option>
              <option value="Noite">Noite</option>
            </select>
          </div>
        </div>

        {/* Resumo da Data Selecionada */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">Votos Realizados na Data</span>
            <span className="text-2xl font-black text-indigo-900">{filteredVotesList.length}</span>
            <span className="text-[10px] text-indigo-600 block font-semibold">{targetDateBR}</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Opções Distintas Votadas</span>
            <span className="text-2xl font-black text-emerald-900">{selectedDateCandidateBreakdown.length}</span>
            <span className="text-[10px] text-emerald-600 block font-semibold">candidatos/chapas</span>
          </div>

          <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">Alunos Votantes</span>
            <span className="text-2xl font-black text-purple-900">
              {new Set(filteredVotesList.map(v => v.matricula)).size}
            </span>
            <span className="text-[10px] text-purple-600 block font-semibold">participantes únicos</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">Frequência da Data</span>
            <span className="text-2xl font-black text-amber-900">
              {selectedDateAttendance ? `${selectedDateAttendance.presentMatriculas.length} Presentes` : 'Sem Chamada'}
            </span>
            <span className="text-[10px] text-amber-600 block font-semibold">
              {selectedDateAttendance ? 'Alunos habilitados para o dia' : 'Frequência não registrada'}
            </span>
          </div>
        </div>

        {/* Mini Distribuição dos Votos da Data */}
        {selectedDateCandidateBreakdown.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fas fa-chart-bar text-indigo-600"></i>
              Distribuição dos Votos Registrados em {targetDateBR} ({filterCategory})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
              {selectedDateCandidateBreakdown.map((item, idx) => {
                const pct = filteredVotesList.length > 0 ? Math.round((item.count / filteredVotesList.length) * 100) : 0;
                return (
                  <div key={item.name} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div className="overflow-hidden pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-800 truncate block">{item.name}</span>
                      </div>
                      {item.ident && <span className="text-[10px] text-slate-400 font-bold ml-6 block truncate">{item.ident}</span>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-indigo-600 block">{item.count} votos</span>
                      <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabela de Votos Realizados */}
        {filteredVotesList.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 uppercase text-[11px] font-black tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Horário</th>
                  <th className="py-3 px-4">Estudante</th>
                  <th className="py-3 px-4">Matrícula</th>
                  <th className="py-3 px-4">Série / Turma</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Voto Registrado</th>
                  <th className="py-3 px-4">Votação / Eleição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs font-medium text-slate-700">
                {filteredVotesList.map((vote) => (
                  <tr key={vote.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <i className="far fa-clock text-indigo-500"></i>
                        <span>{vote.voteTime}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{vote.studentName}</div>
                      <div className="text-[10px] text-slate-400">{vote.turno}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                      {vote.matricula}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                        {vote.sala} {vote.turma ? `(${vote.turma})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded-lg text-[10px] border border-indigo-200/60 uppercase">
                        {vote.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black text-emerald-700 flex items-center gap-1.5">
                        <i className="fas fa-check-circle text-xs text-emerald-500"></i>
                        <span>{vote.optionName}</span>
                      </div>
                      {vote.optionIdent && (
                        <span className="text-[10px] text-slate-500 block">{vote.optionIdent}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold max-w-xs truncate">
                      {vote.sessionTitle}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 space-y-3">
            <div className="w-14 h-14 bg-white text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl shadow-xs border border-slate-200">
              <i className="fas fa-inbox"></i>
            </div>
            <h4 className="text-sm font-bold text-slate-700">Nenhum voto encontrado para esta data e categoria</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Não há votos computados em {targetDateBR} para os filtros selecionados. Tente selecionar outra data ou categoria acima.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
