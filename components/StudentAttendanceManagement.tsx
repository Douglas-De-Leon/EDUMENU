import React, { useState, useMemo, useEffect } from 'react';
import { Student, AttendanceRecord } from '../types';

interface StudentAttendanceManagementProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onSaveAttendance: (date: string, presentMatriculas: string[]) => Promise<void> | void;
  currentSchoolId?: string | null;
}

export const StudentAttendanceManagement: React.FC<StudentAttendanceManagementProps> = ({
  students,
  attendanceRecords,
  onSaveAttendance,
  currentSchoolId
}) => {
  // Today's date YYYY-MM-DD
  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayDateStr();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // State for the dropdown ("lista suspensa dos alunos com caixa de seleção")
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [selectedSala, setSelectedSala] = useState<string>('all');
  const [selectedTurno, setSelectedTurno] = useState<string>('all');
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'present' | 'absent'>('all');

  // Currently selected present student matriculas for the selectedDate
  const [presentMatriculas, setPresentMatriculas] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Load existing attendance record for selectedDate
  useEffect(() => {
    const existing = attendanceRecords.find(a => a.date === selectedDate);
    if (existing) {
      setPresentMatriculas(existing.presentMatriculas || []);
    } else {
      // By default when no attendance recorded yet, we can initialize with all students present or empty
      // Setting all present by default allows admin to quickly uncheck the absent ones!
      setPresentMatriculas(students.map(s => s.matricula));
    }
  }, [selectedDate, attendanceRecords, students]);

  // Existing record check
  const currentRecord = useMemo(() => {
    return attendanceRecords.find(a => a.date === selectedDate) || null;
  }, [attendanceRecords, selectedDate]);

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

  // Filter students for the dropdown
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedSala !== 'all' && student.sala !== selectedSala) return false;
      if (selectedTurno !== 'all' && student.turno !== selectedTurno) return false;

      const isPresent = presentMatriculas.includes(student.matricula);
      if (activeViewTab === 'present' && !isPresent) return false;
      if (activeViewTab === 'absent' && isPresent) return false;

      if (dropdownSearch.trim()) {
        const q = dropdownSearch.toLowerCase();
        const matchName = student.name.toLowerCase().includes(q);
        const matchMat = student.matricula.includes(q);
        const matchSala = (student.sala || '').toLowerCase().includes(q);
        const matchTurma = (student.turma || '').toLowerCase().includes(q);
        return matchName || matchMat || matchSala || matchTurma;
      }

      return true;
    });
  }, [students, selectedSala, selectedTurno, activeViewTab, dropdownSearch, presentMatriculas]);

  // Metrics
  const totalStudents = students.length;
  const presentCount = presentMatriculas.length;
  const absentCount = Math.max(0, totalStudents - presentCount);
  const presentPercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const absentPercentage = totalStudents > 0 ? Math.round((absentCount / totalStudents) * 100) : 0;

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      await onSaveAttendance(selectedDate, presentMatriculas);
      setSaveFeedback(`Frequência de ${selectedDate.split('-').reverse().join('/')} salva com sucesso! ${presentCount} alunos habilitados e ${absentCount} faltosos bloqueados.`);
      setTimeout(() => setSaveFeedback(null), 5000);
    } catch (err) {
      console.error(err);
      setSaveFeedback("Erro ao salvar frequência. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }, [selectedDate]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-400/30">
              <i className="fas fa-user-check"></i>
              Controle Eleitoral de Presença Escolar
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Frequência de Alunos & Habilitação de Voto
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-2xl">
              Defina quais discentes estão presentes no dia da eleição. <strong>Alunos não selecionados são classificados como faltosos</strong> e terão o acesso às urnas eletrônicas bloqueado nesta data.
            </p>
          </div>

          {/* Seletor de Data da Frequência */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
              <i className="fas fa-calendar-alt text-emerald-400"></i>
              Data da Votação / Chamada:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-white text-slate-900 font-black text-xs px-3 py-2 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 w-full"
              />
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-3 py-2 rounded-xl transition-all shadow-md shrink-0"
              >
                Hoje
              </button>
            </div>
            <span className="text-[10px] text-emerald-200/80 capitalize">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Cards de Resumo e Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Cadastrado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl shrink-0">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Total de Estudantes</span>
            <span className="text-2xl font-black text-slate-900">{totalStudents}</span>
            <span className="text-[10px] text-slate-500 block font-medium">matriculados na unidade</span>
          </div>
        </div>

        {/* Presentes / Habilitados */}
        <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-emerald-600/20">
            <i className="fas fa-check"></i>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">Presentes (Habilitados)</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-200/70 px-2 py-0.5 rounded-full">{presentPercentage}%</span>
            </div>
            <span className="text-2xl font-black text-emerald-900">{presentCount}</span>
            <span className="text-[10px] text-emerald-700 block font-bold">aptos a votar no dia {selectedDate.split('-').reverse().join('/')}</span>
          </div>
        </div>

        {/* Faltosos / Bloqueados */}
        <div className="bg-rose-50/70 rounded-2xl p-5 border border-rose-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-rose-600/20">
            <i className="fas fa-user-slash"></i>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 block">Faltosos (Bloqueados)</span>
              <span className="text-xs font-black text-rose-700 bg-rose-200/70 px-2 py-0.5 rounded-full">{absentPercentage}%</span>
            </div>
            <span className="text-2xl font-black text-rose-900">{absentCount}</span>
            <span className="text-[10px] text-rose-700 block font-bold">não poderão realizar votação nesta data</span>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {saveFeedback && (
        <div className={`p-4 rounded-2xl text-xs font-black flex items-center gap-3 animate-fadeIn ${
          saveFeedback.includes('sucesso') 
            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
            : 'bg-rose-100 text-rose-900 border border-rose-300'
        }`}>
          <i className={`fas ${saveFeedback.includes('sucesso') ? 'fa-check-circle text-emerald-600' : 'fa-exclamation-triangle text-rose-600'} text-base`}></i>
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Status da Frequência Gravada */}
      {currentRecord ? (
        <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-indigo-900 font-bold">
            <i className="fas fa-info-circle text-indigo-600 text-base"></i>
            <span>
              Frequência registrada para esta data em: <strong>{new Date(currentRecord.updatedAt).toLocaleString('pt-BR')}</strong>
            </span>
          </div>
          <span className="text-[11px] font-extrabold bg-indigo-200/70 text-indigo-800 px-3 py-1 rounded-full self-start sm:self-auto">
            {currentRecord.presentMatriculas.length} alunos habilitados
          </span>
        </div>
      ) : (
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-900 font-bold">
          <i className="fas fa-exclamation-circle text-amber-600 text-base"></i>
          <span>
            Ainda não foi gravada uma frequência definitiva para {formattedDate}. Faça as marcações abaixo e clique em <strong>"Salvar Frequência e Habilitar Alunos"</strong>.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPONENTE PRINCIPAL: LISTA SUSPENSA DOS ALUNOS COM CAIXA DE SELEÇÃO */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Botão da Lista Suspensa (Header Dropdown) */}
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-slate-50 hover:bg-slate-100/80 p-5 cursor-pointer flex items-center justify-between border-b border-slate-200 transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-sm">
              <i className="fas fa-list-check"></i>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                Lista Suspensa dos Alunos com Caixa de Seleção
                <span className="text-xs font-extrabold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                  {presentCount} de {totalStudents} presentes
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isDropdownOpen ? 'Clique para recolher a lista' : 'Clique para expandir e selecionar os alunos presentes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-indigo-600 hidden sm:inline">
              {isDropdownOpen ? 'Recolher Lista' : 'Expandir Lista'}
            </span>
            <div className={`w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
              <i className="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
        </div>

        {/* Conteúdo Expansível da Lista Suspensa */}
        {isDropdownOpen && (
          <div className="p-5 sm:p-6 space-y-5 animate-fadeIn">
            {/* Barra de Ações Rápidas em Massa */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                >
                  <i className="fas fa-check-double"></i>
                  Marcar Todos Presentes
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                >
                  <i className="fas fa-times"></i>
                  Marcar Todos como Faltosos
                </button>
                <button
                  type="button"
                  onClick={invertSelection}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5"
                >
                  <i className="fas fa-retweet"></i>
                  Inverter Seleção
                </button>
              </div>

              {/* Botão de Salvar Destacado */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                {isSaving ? 'Gravando...' : 'Salvar Frequência e Habilitar Alunos'}
              </button>
            </div>

            {/* Filtros e Busca dentro da Lista Suspensa */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 relative">
                <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Pesquisar por nome do aluno ou matrícula..."
                  value={dropdownSearch}
                  onChange={e => setDropdownSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>

              <div>
                <select
                  value={selectedSala}
                  onChange={e => setSelectedSala(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                >
                  <option value="all">Todas as Séries / Salas</option>
                  <option value="1º Ano">1º Ano</option>
                  <option value="2º Ano">2º Ano</option>
                  <option value="3º Ano">3º Ano</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedTurno}
                  onChange={e => setSelectedTurno(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                >
                  <option value="all">Todos os Turnos</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Integral">Integral</option>
                  <option value="Noite">Noite</option>
                </select>
              </div>
            </div>

            {/* Abas Rápidas: Todos / Apenas Presentes / Apenas Faltosos */}
            <div className="flex gap-2 border-b border-slate-150 pb-2">
              <button
                onClick={() => setActiveViewTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeViewTab === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todos ({totalStudents})
              </button>
              <button
                onClick={() => setActiveViewTab('present')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeViewTab === 'present'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <i className="fas fa-check"></i>
                Presentes Habilitados ({presentCount})
              </button>
              <button
                onClick={() => setActiveViewTab('absent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeViewTab === 'absent'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <i className="fas fa-user-times"></i>
                Faltosos Bloqueados ({absentCount})
              </button>
            </div>

            {/* Lista dos Alunos com Caixas de Seleção */}
            <div className="max-h-96 overflow-y-auto pr-1 divide-y divide-slate-100 border border-slate-200 rounded-2xl">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const isPresent = presentMatriculas.includes(student.matricula);

                  return (
                    <label
                      key={student.matricula}
                      className={`flex items-center justify-between p-3.5 cursor-pointer transition-all ${
                        isPresent
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/70'
                          : 'bg-rose-50/20 hover:bg-rose-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 overflow-hidden">
                        {/* Caixa de Seleção Personalizada */}
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={isPresent}
                            onChange={() => toggleStudentPresence(student.matricula)}
                            className="w-5 h-5 text-emerald-600 bg-white border-2 border-slate-300 rounded-md focus:ring-emerald-500 focus:ring-offset-0 transition-all cursor-pointer"
                          />
                        </div>

                        {/* Detalhes do Aluno */}
                        <div className="overflow-hidden">
                          <span className={`text-sm font-black block truncate ${isPresent ? 'text-slate-900' : 'text-slate-600 line-through'}`}>
                            {student.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                              Matrícula: {student.matricula}
                            </span>
                            <span>•</span>
                            <span>{student.sala} {student.turma ? `(Turma ${student.turma})` : ''}</span>
                            <span>•</span>
                            <span>{student.turno}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Visual do Voto */}
                      <div className="shrink-0 pl-3">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <i className="fas fa-check-circle"></i>
                            Presente (Apto a Votar)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-200">
                            <i className="fas fa-ban"></i>
                            Faltoso (Voto Bloqueado)
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <i className="fas fa-search text-2xl mb-2 block"></i>
                  <p className="text-xs font-bold">Nenhum aluno encontrado para os filtros selecionados.</p>
                </div>
              )}
            </div>

            {/* Rodapé da Lista com Botão de Confirmação */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <span className="text-xs text-slate-500 font-medium">
                Mostrando {filteredStudents.length} de {totalStudents} discentes registrados.
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                Salvar Frequência e Habilitar Alunos do Dia
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
