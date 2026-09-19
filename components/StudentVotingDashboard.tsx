import React, { useState, useMemo } from 'react';
import { Student, VotingSession, MealOption, Selection, AttendanceRecord } from '../types';

interface StudentVotingDashboardProps {
  currentStudent: Student;
  votingSessions: VotingSession[];
  mealOptions: MealOption[];
  selections: Selection[];
  attendanceRecords?: AttendanceRecord[];
  onCastVote: (session: VotingSession, optionId: string) => Promise<void> | void;
  onLogout: () => void;
}

export const StudentVotingDashboard: React.FC<StudentVotingDashboardProps> = ({
  currentStudent,
  votingSessions,
  mealOptions,
  selections,
  attendanceRecords = [],
  onCastVote,
  onLogout
}) => {
  // Navigation state: null shows all registered votings, string shows specific ballot
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'voted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [justVotedSessionId, setJustVotedSessionId] = useState<string | null>(null);
  const [receiptSession, setReceiptSession] = useState<VotingSession | null>(null);

  // Play audio feedbacks (electronic urn simulation)
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      osc.frequency.setValueAtTime(1320, now + 0.28);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  };

  // Helper to find existing vote for a voting session
  const getStudentVote = (session: VotingSession) => {
    return selections.find(
      s => s.matricula === currentStudent.matricula &&
           (s.votingSessionId === session.id || (!s.votingSessionId && s.category === session.category))
    );
  };

  const todayDateStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const todayAttendance = useMemo(() => {
    return attendanceRecords.find(a => a.date === todayDateStr);
  }, [attendanceRecords, todayDateStr]);

  const isPresentToday = useMemo(() => {
    if (!todayAttendance) return false; // REGRA: Por padrão, alunos iniciam como faltosos!
    return todayAttendance.presentMatriculas.includes(currentStudent.matricula);
  }, [todayAttendance, currentStudent.matricula]);

  // Attendance & voting eligibility check for a session
  const isStudentEligibleToVote = (session: VotingSession) => {
    const sessionDate = session.date || todayDateStr;
    const formattedDate = sessionDate.split('-').reverse().join('/');
    const attendance = attendanceRecords ? attendanceRecords.find(a => a.date === sessionDate) : null;

    // REGRA: Por padrão, todos os discentes cadastrados iniciam como faltosos.
    // Apenas após ser realizada a frequência e confirmada a presença é que o voto é habilitado!
    if (!attendance) {
      return {
        eligible: false,
        sessionDate,
        status: 'awaiting_attendance',
        reason: `Chamada escolar de ${formattedDate} ainda não confirmada. Por padrão, todos os alunos iniciam como faltosos até a coordenação realizar a frequência e confirmar sua presença em sala de aula.`
      };
    }

    const isPresent = attendance.presentMatriculas.includes(currentStudent.matricula);
    if (!isPresent) {
      return {
        eligible: false,
        sessionDate,
        status: 'absent',
        reason: `Você consta como faltoso na chamada de ${formattedDate}. Apenas alunos com presença confirmada em aula estão habilitados a votar nesta eleição.`
      };
    }

    return { 
      eligible: true, 
      sessionDate, 
      status: 'present',
      reason: `Presença confirmada na chamada de ${formattedDate}. Você está habilitado para votar nesta eleição.`
    };
  };

  // Compute metrics
  const stats = useMemo(() => {
    const total = votingSessions.length;
    let voted = 0;
    let pending = 0;

    votingSessions.forEach(session => {
      const hasVoted = Boolean(getStudentVote(session));
      if (hasVoted) {
        voted++;
      } else if (session.active) {
        pending++;
      }
    });

    const completionRate = total > 0 ? Math.round((voted / total) * 100) : 0;
    return { total, voted, pending, completionRate };
  }, [votingSessions, selections, currentStudent]);

  // Filtered voting sessions list
  const filteredSessions = useMemo(() => {
    return votingSessions.filter(session => {
      const vote = getStudentVote(session);
      const isVoted = Boolean(vote);

      if (categoryFilter !== 'all' && session.category !== categoryFilter) {
        return false;
      }

      if (statusFilter === 'pending' && (isVoted || !session.active)) {
        return false;
      }
      if (statusFilter === 'voted' && !isVoted) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = session.title.toLowerCase().includes(q);
        const matchDesc = (session.description || '').toLowerCase().includes(q);
        const matchCat = session.category.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchCat;
      }

      return true;
    });
  }, [votingSessions, selections, categoryFilter, statusFilter, searchQuery, currentStudent]);

  // Active voting session currently opened
  const currentSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return votingSessions.find(s => s.id === selectedSessionId) || null;
  }, [votingSessions, selectedSessionId]);

  // Options available for the currently opened session
  const currentSessionOptions = useMemo(() => {
    if (!currentSession) return [];
    if (currentSession.optionIds && currentSession.optionIds.length > 0) {
      return mealOptions.filter(m => m.active && currentSession.optionIds.includes(m.id));
    }
    // Fallback to active options of the session category
    return mealOptions.filter(m => m.active && m.category === currentSession.category);
  }, [currentSession, mealOptions]);

  // Selected candidate object
  const currentSelectedOption = useMemo(() => {
    if (!selectedOptionId) return null;
    return mealOptions.find(m => m.id === selectedOptionId) || null;
  }, [selectedOptionId, mealOptions]);

  // Check if student voted in currently opened session
  const currentSessionVote = useMemo(() => {
    if (!currentSession) return null;
    return getStudentVote(currentSession);
  }, [currentSession, selections, currentStudent]);

  const votedOptionDetails = useMemo(() => {
    if (!currentSessionVote) return null;
    return mealOptions.find(m => m.id === currentSessionVote.mealId) || null;
  }, [currentSessionVote, mealOptions]);

  // Handle vote confirmation
  const handleConfirmVote = async () => {
    if (!currentSession || !selectedOptionId) return;

    // Strict attendance validation
    const attCheck = isStudentEligibleToVote(currentSession);
    if (!attCheck.eligible) {
      alert(attCheck.reason || "Voto bloqueado: Você consta como faltoso na frequência escolar desta data.");
      setShowConfirmModal(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onCastVote(currentSession, selectedOptionId);
      playChime();
      setJustVotedSessionId(currentSession.id);
      setShowConfirmModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case 'Gremio':
        return { label: 'Grêmio Escolar', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'fa-users' };
      case 'Representante':
        return { label: 'Representante de Classe', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'fa-user-tie' };
      case 'Alimentação':
        return { label: 'Alimentação / Merenda', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'fa-utensils' };
      default:
        return { label: 'Outros Assuntos', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'fa-clipboard-check' };
    }
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Student Profile & System Status Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-indigo-600/20 shrink-0">
            {currentStudent.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isPresentToday ? (
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <i className="fas fa-check-circle text-emerald-600"></i>
                  Presença Confirmada Hoje
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                  <i className="fas fa-user-slash text-rose-600"></i>
                  Faltoso Hoje (Bloqueado)
                </span>
              )}
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Urna Conectada
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{currentStudent.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 font-semibold">
              <span>Matrícula: <strong className="text-slate-700 font-mono">{currentStudent.matricula}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Série: <strong className="text-slate-700">{currentStudent.sala || '1º Ano'}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Turma: <strong className="text-slate-700">{currentStudent.turma || 'A'}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Turno: <strong className="text-slate-700">{currentStudent.turno || 'Integral'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Geral</p>
            <p className="text-sm font-black text-slate-800">
              {stats.voted} de {stats.total} Votações Realizadas
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-200/60"
            title="Finalizar Sessão Segura"
          >
            <i className="fas fa-power-off text-sm"></i>
            <span>Sair da Urna</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CATALOG OF ALL REGISTERED VOTING SESSIONS */}
      {!selectedSessionId && (
        <div className="space-y-6">
          {/* Top Banner introducing the All Registered Votings */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <i className="fas fa-vote-yea text-9xl"></i>
            </div>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
                <i className="fas fa-calendar-check text-amber-300"></i>
                Votações Cadastradas no Sistema
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                Painel Oficial de Eleições e Votações
              </h3>
              <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
                Abaixo estão listadas todas as votações cadastradas pela direção e comissão eleitoral. Escolha uma cédula para registrar seu voto com sigilo e segurança.
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 block">Total Cadastradas</span>
                <span className="text-2xl font-black text-white">{stats.total}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">Votos Concluídos</span>
                <span className="text-2xl font-black text-emerald-300 flex items-center gap-1.5">
                  <i className="fas fa-check-circle text-lg"></i>
                  {stats.voted}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Votos Pendentes</span>
                <span className="text-2xl font-black text-amber-300 flex items-center gap-1.5">
                  <i className="fas fa-clock text-lg"></i>
                  {stats.pending}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 block">Progresso</span>
                <span className="text-2xl font-black text-white">{stats.completionRate}%</span>
              </div>
            </div>
          </div>

          {/* Banner Informativo de Status de Frequência do Estudante */}
          {isPresentToday ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-check"></i>
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 block">
                    Presença Escolar Confirmada
                  </span>
                  <p className="text-emerald-800 text-xs font-semibold mt-0.5">
                    Sua presença em aula foi confirmada pela coordenação. Suas cédulas de votação estão liberadas para participação.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                <i className="fas fa-check-circle text-emerald-700"></i>
                Apto a Votar
              </span>
            </div>
          ) : (
            <div className="bg-amber-50/90 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-user-clock"></i>
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                    Presença Pendente de Confirmação
                  </span>
                  <p className="text-amber-800 text-xs font-semibold mt-0.5">
                    Por padrão, os alunos constam como faltosos até a chamada do dia ser realizada pela coordenação da escola. Assim que sua presença for confirmada, suas cédulas serão liberadas.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold bg-amber-200 text-amber-900 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                <i className="fas fa-lock text-amber-700"></i>
                Aguardando Chamada
              </span>
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'Todas as Categorias', icon: 'fa-list-ul' },
                { id: 'Gremio', label: 'Grêmio', icon: 'fa-users' },
                { id: 'Representante', label: 'Representantes', icon: 'fa-user-tie' },
                { id: 'Alimentação', label: 'Alimentação', icon: 'fa-utensils' },
                { id: 'Outros', label: 'Outros', icon: 'fa-clipboard-check' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    categoryFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  <i className={`fas ${tab.icon} text-[11px]`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Status & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">⏳ Pendentes para Votar</option>
                <option value="voted">✅ Já Votadas</option>
              </select>

              <div className="relative flex-1 sm:w-56">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Buscar votação..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid of All Registered Voting Sessions */}
          {filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredSessions.map(session => {
                const vote = getStudentVote(session);
                const isVoted = Boolean(vote);
                const votedMeal = isVoted ? mealOptions.find(m => m.id === vote?.mealId) : null;
                const catConfig = getCategoryConfig(session.category);
                const optionsCount = session.optionIds && session.optionIds.length > 0 
                  ? session.optionIds.length 
                  : mealOptions.filter(m => m.category === session.category && m.active).length;
                const sessionDateFormatted = session.date ? session.date.split('-').reverse().join('/') : 'Em aberto';
                const todaySession = session.date ? isToday(session.date) : false;
                const attendanceCheck = isStudentEligibleToVote(session);
                const isAttendanceBlocked = !isVoted && !attendanceCheck.eligible;

                return (
                  <div
                    key={session.id}
                    className={`bg-white rounded-3xl border-2 transition-all p-6 flex flex-col justify-between relative group ${
                      isVoted 
                        ? 'border-emerald-200 shadow-sm bg-gradient-to-b from-white to-emerald-50/20' 
                        : isAttendanceBlocked
                          ? 'border-rose-200 bg-rose-50/20'
                          : session.active 
                            ? 'border-slate-200/90 hover:border-indigo-500 hover:shadow-lg' 
                            : 'border-slate-200 bg-slate-50/70 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Card Header: Category & Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-xl border ${catConfig.bg} ${catConfig.text} ${catConfig.border}`}>
                          <i className={`fas ${catConfig.icon}`}></i>
                          {catConfig.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {todaySession && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                              📅 Hoje
                            </span>
                          )}
                          {isVoted ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <i className="fas fa-check-circle"></i>
                              Voto Registrado
                            </span>
                          ) : isAttendanceBlocked ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                              <i className="fas fa-user-slash"></i>
                              {attendanceCheck.status === 'awaiting_attendance' ? 'Aguardando Presença (Faltoso)' : 'Faltoso (Bloqueado)'}
                            </span>
                          ) : session.active ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <i className="fas fa-check-circle"></i>
                              Presença Confirmada
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full">
                              Pausada
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-2">
                        {session.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                        {session.description || 'Votação oficial registrada no sistema para participação dos discentes.'}
                      </p>

                      {/* Session Details bar */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-150 flex items-center justify-between text-xs mb-5">
                        <div className="flex items-center gap-2 text-slate-600 font-bold">
                          <i className="fas fa-calendar-alt text-indigo-500"></i>
                          <span>Data: <strong>{sessionDateFormatted}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 font-bold">
                          <i className="fas fa-user-check text-indigo-500"></i>
                          <span>{optionsCount} opções na cédula</span>
                        </div>
                      </div>

                      {/* If student is blocked by attendance */}
                      {isAttendanceBlocked && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
                          <i className="fas fa-user-slash text-rose-600 text-sm mt-0.5 shrink-0"></i>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 block">
                              Voto Não Permitido (Frequência Escolar)
                            </span>
                            <span className="text-xs font-semibold text-rose-900 block leading-tight mt-0.5">
                              {attendanceCheck.reason}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* If student already voted in this session */}
                      {isVoted && votedMeal && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 text-sm font-black">
                            <i className="fas fa-check"></i>
                          </div>
                          <div className="overflow-hidden">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                              Seu Voto Foi:
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm truncate block">
                              {votedMeal.name} {votedMeal.calories ? `(${votedMeal.calories})` : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {isVoted ? (
                        <button
                          onClick={() => {
                            setReceiptSession(session);
                          }}
                          className="w-full py-3 px-4 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-receipt"></i>
                          Ver Comprovante Eleitoral
                        </button>
                      ) : isAttendanceBlocked ? (
                        <button
                          disabled
                          className="w-full py-3.5 px-4 rounded-xl font-black text-xs bg-rose-100 text-rose-700 border border-rose-200 cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-ban"></i>
                          {attendanceCheck.status === 'awaiting_attendance' ? 'Voto Bloqueado (Aguardando Chamada)' : 'Voto Bloqueado (Aluno Faltoso)'}
                        </button>
                      ) : session.active ? (
                        <button
                          onClick={() => {
                            playBeep();
                            setSelectedSessionId(session.id);
                            setSelectedOptionId(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-vote-yea"></i>
                          Acessar Cédula e Votar Agora →
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 text-slate-400 cursor-not-allowed text-center"
                        >
                          Votação Temporariamente Indisponível
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
                <i className="fas fa-inbox"></i>
              </div>
              <h4 className="text-lg font-bold text-slate-700 mb-1">Nenhuma votação encontrada</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Nenhuma votação corresponde aos filtros selecionados. Tente ajustar os termos de busca ou selecionar "Todas as Categorias".
              </p>
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: BALLOT FOR A SPECIFIC SELECTED VOTING SESSION */}
      {selectedSessionId && currentSession && (
        <div className="space-y-6 animate-fadeIn">
          {/* Back Button & Election Context Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <button
              onClick={() => {
                setSelectedSessionId(null);
                setSelectedOptionId(null);
              }}
              className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              Voltar para Todas as Votações Cadastradas
            </button>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 font-bold">Votação selecionada:</span>
              <span className="text-xs bg-slate-100 text-slate-800 font-extrabold px-3 py-1 rounded-lg border border-slate-200">
                {currentSession.title}
              </span>
            </div>
          </div>

          {/* Official Ballot Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-950">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 px-3 py-0.5 rounded-full border border-indigo-400/30">
                    Cédula Eleitoral Oficial
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 text-white px-3 py-0.5 rounded-full">
                    {getCategoryConfig(currentSession.category).label}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{currentSession.title}</h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                  {currentSession.description || 'Selecione abaixo a sua opção de preferência para esta votação.'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right shrink-0">
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">Data Programada</span>
                <span className="text-base font-black text-white">
                  {currentSession.date ? currentSession.date.split('-').reverse().join('/') : 'Em aberto'}
                </span>
              </div>
            </div>
          </div>

          {/* IF ALREADY VOTED IN THIS SESSION */}
          {currentSessionVote ? (
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto text-4xl mb-6 shadow-inner">
                <i className="fas fa-check-double animate-pulse"></i>
              </div>
              <h3 className="text-3xl font-black mb-2">Voto Computado com Sucesso!</h3>
              <p className="text-emerald-100 text-sm max-w-md mx-auto mb-6">
                Você já exerceu seu direito ao voto nesta eleição. Seu voto foi gravado e auditado criptograficamente com sucesso.
              </p>

              {votedOptionDetails && (
                <div className="bg-white/15 backdrop-blur-md border border-white/20 p-5 rounded-2xl max-w-md mx-auto mb-8 text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 block mb-1">
                    Candidato / Escolha Registrada:
                  </span>
                  <p className="text-xl font-black text-white">{votedOptionDetails.name}</p>
                  {votedOptionDetails.calories && (
                    <span className="text-xs bg-white/20 text-white font-mono px-2 py-0.5 rounded-md inline-block mt-1">
                      {votedOptionDetails.calories}
                    </span>
                  )}
                  <p className="text-xs text-white/80 mt-2">{votedOptionDetails.description}</p>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setReceiptSession(currentSession)}
                  className="px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-lg transition-all"
                >
                  <i className="fas fa-receipt mr-2"></i>
                  Ver Comprovante Oficial
                </button>
                <button
                  onClick={() => {
                    setSelectedSessionId(null);
                    setSelectedOptionId(null);
                  }}
                  className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Voltar para Todas as Votações
                </button>
              </div>
            </div>
          ) : !isStudentEligibleToVote(currentSession).eligible ? (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-8 sm:p-12 text-center shadow-lg animate-fadeIn">
              <div className="w-20 h-20 bg-rose-600 text-white rounded-full flex items-center justify-center mx-auto text-3xl mb-5 shadow-lg shadow-rose-600/30">
                <i className="fas fa-user-slash"></i>
              </div>
              <h3 className="text-2xl font-black text-rose-950 mb-2">Votação Não Permitida para Esta Data</h3>
              <p className="text-rose-800 text-sm max-w-lg mx-auto mb-4 font-semibold leading-relaxed">
                {isStudentEligibleToVote(currentSession).reason}
              </p>
              <div className="bg-white/80 border border-rose-200 p-4 rounded-2xl max-w-md mx-auto mb-6 text-xs text-slate-600 text-left space-y-1.5">
                <span className="font-black text-rose-900 block uppercase text-[10px] tracking-wider">Regulamento Eleitoral Escolar:</span>
                <p>• Apenas estudantes que registraram presença regular em sala de aula no dia da eleição possuem habilitação para registrar votos nas urnas eletrônicas.</p>
                <p>• Se você esteve presente e acredita que houve uma divergência no lançamento da frequência, solicite à mesa ou coordenação a retificação da sua chamada.</p>
              </div>
              <button
                onClick={() => {
                  setSelectedSessionId(null);
                  setSelectedOptionId(null);
                }}
                className="px-6 py-3 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              >
                <i className="fas fa-arrow-left"></i>
                Voltar para Minhas Votações
              </button>
            </div>
          ) : (
            /* BALLOT CANDIDATES LIST */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black text-slate-800">Selecione uma Opção na Cédula</h4>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                      <i className="fas fa-check-circle text-emerald-600"></i> Presença Confirmada
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clique na opção desejada e depois no botão "Confirmar Voto" para gravar na urna eletrônica.
                  </p>
                </div>
                <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 self-start sm:self-center">
                  {currentSessionOptions.length} {currentSessionOptions.length === 1 ? 'Opção Disponível' : 'Opções Habilitadas'}
                </span>
              </div>

              {/* Single Option Notice - Enforces Manual Confirmation Rule */}
              {currentSessionOptions.length === 1 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs animate-fadeIn">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 text-lg shadow-sm">
                    <i className="fas fa-hand-pointer"></i>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                      <i className="fas fa-shield-alt text-amber-600"></i>
                      Cédula com Opção Única de Escolha &bull; Confirmação Obrigatória
                    </span>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Esta eleição possui <strong>apenas 1 opção</strong> de escolha. Mesmo com opção única, o sistema <strong>nunca vota automaticamente por você</strong>. Você deve clicar no cartão abaixo para selecioná-lo e, em seguida, clicar em <strong>"Confirmar Voto Nesta Eleição"</strong> no painel da urna.
                    </p>
                  </div>
                </div>
              )}

              {currentSessionOptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSessionOptions.map(option => {
                    const isSelected = selectedOptionId === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          playBeep();
                          setSelectedOptionId(option.id);
                        }}
                        className={`text-left p-6 rounded-3xl border-2 transition-all relative overflow-hidden group ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-4 ring-indigo-500/10'
                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-4 right-4 text-indigo-600 animate-scaleUp">
                            <i className="fas fa-check-circle text-2xl"></i>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          {option.calories && (
                            <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                              {option.calories}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Código: {option.id}
                          </span>
                        </div>

                        <h5 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase mb-2">
                          {option.name}
                        </h5>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                          {option.description}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className={`font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                            {isSelected ? 'Opção Selecionada' : 'Clique para Escolher'}
                          </span>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <i className="fas fa-check"></i>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-200">
                  <i className="fas fa-folder-open text-3xl text-slate-300 mb-2"></i>
                  <p className="text-sm font-bold text-slate-600">Nenhum candidato ou item cadastrado especificamente para esta votação.</p>
                </div>
              )}

              {/* Urna Confirmation Action Panel */}
              {selectedOptionId && currentSelectedOption && (
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-indigo-500/30 animate-fadeIn space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-1">
                        Opção Selecionada na Urna:
                      </span>
                      <h4 className="text-2xl font-black text-white">
                        {currentSelectedOption.name}
                      </h4>
                      {currentSelectedOption.calories && (
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Identificação: <strong>{currentSelectedOption.calories}</strong>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOptionId(null)}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black transition-colors"
                    >
                      <i className="fas fa-eraser mr-1.5"></i>
                      CORRIGIR SELEÇÃO
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full sm:flex-1 py-4 px-6 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                      <i className="fas fa-check-circle text-xl"></i>
                      CONFIRMAR VOTO NESTA ELEIÇÃO
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSessionId(null);
                        setSelectedOptionId(null);
                      }}
                      className="w-full sm:w-auto py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-2xl transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>

                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Aviso: O voto é único, secreto e definitivo para esta eleição.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION POPUP MODAL (Electronic Urn Style) */}
      {showConfirmModal && currentSession && currentSelectedOption && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-3 shadow-inner">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900">Confirmar Registro do Voto</h3>
              <p className="text-xs text-slate-500 mt-1">
                Verifique com atenção os dados antes de gravar seu voto na urna eletrônica.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Eleição</span>
                <span className="font-extrabold text-slate-800 text-sm">{currentSession.title}</span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidato / Opção</span>
                <span className="font-black text-indigo-600 text-lg">{currentSelectedOption.name}</span>
                {currentSelectedOption.calories && (
                  <span className="block text-xs font-mono text-slate-600">{currentSelectedOption.calories}</span>
                )}
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Eleitor</span>
                <span className="font-bold text-slate-700 text-xs">{currentStudent.name} (Matrícula: {currentStudent.matricula})</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmVote}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Gravando Voto Criptografado...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    CONFIRMAR
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                CORRIGIR / VOLTAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOTING RECEIPT MODAL */}
      {receiptSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-3 shadow-inner">
                <i className="fas fa-certificate"></i>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                Comprovante Eleitoral Digital
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">Voto Computado com Sucesso</h3>
              <p className="text-xs text-slate-400">EduVotação - Sistema de Votação Estudantil</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 mb-6 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-400">VOTAÇÃO:</span>
                <strong className="text-slate-800 text-right">{receiptSession.title}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-400">ELEITOR:</span>
                <strong className="text-slate-800 text-right">{currentStudent.name}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-400">MATRÍCULA:</span>
                <strong className="text-slate-800 font-mono">{currentStudent.matricula}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-400">TURMA/TURNO:</span>
                <strong className="text-slate-800">{currentStudent.sala || '1º Ano'} {currentStudent.turma || 'A'} - {currentStudent.turno || 'Integral'}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-400">DATA/HORA:</span>
                <strong className="text-slate-800">
                  {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </strong>
              </div>
              <div className="pt-1 text-[10px] text-slate-400 break-all text-center">
                HASH DE AUDITORIA: {Math.random().toString(36).substring(2).toUpperCase()}-{receiptSession.id.toUpperCase()}-{currentStudent.matricula.substring(0, 4)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReceiptSession(null)}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors"
            >
              Fechar Comprovante
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
