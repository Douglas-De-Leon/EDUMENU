import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Student } from '../types';

interface UserManagementDashboardProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (matricula: string) => void;
}

export const UserManagementDashboard: React.FC<UserManagementDashboardProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent
}) => {
  const initialStudentState: Student = {
    matricula: '',
    name: '',
    password: '',
    turno: 'Integral',
    sala: '1º Ano',
    turma: 'A',
    email: '',
    responsibleName: '',
    responsibleEmail: '',
    responsiblePhone: ''
  };

  const [newStudent, setNewStudent] = useState<Student>(initialStudentState);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Dynamic Series & Turnos State
  const [customSeries, setCustomSeries] = useState<string[]>([]);
  const [customTurnos, setCustomTurnos] = useState<string[]>([]);
  const [isCreatingSerie, setIsCreatingSerie] = useState(false);
  const [newSerieInput, setNewSerieInput] = useState('');
  const [isCreatingTurno, setIsCreatingTurno] = useState(false);
  const [newTurnoInput, setNewTurnoInput] = useState('');

  // Selected student for quick contact detail modal
  const [selectedContactStudent, setSelectedContactStudent] = useState<Student | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const editingMatricula = editingStudent?.matricula;

  useEffect(() => {
    if (editingMatricula && nameInputRef.current) {
      nameInputRef.current.focus();
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingMatricula]);

  // Derived available series
  const availableSeries = useMemo(() => {
    const defaultList = ['1º Ano', '2º Ano', '3º Ano'];
    const set = new Set<string>([...defaultList, ...customSeries]);
    students.forEach(s => {
      if (s.sala) set.add(s.sala);
    });
    return Array.from(set);
  }, [students, customSeries]);

  // Derived available turnos
  const availableTurnos = useMemo(() => {
    const defaultList = ['Integral', 'Manhã', 'Tarde', 'Noite'];
    const set = new Set<string>([...defaultList, ...customTurnos]);
    students.forEach(s => {
      if (s.turno) set.add(s.turno);
    });
    return Array.from(set);
  }, [students, customTurnos]);

  // Add new custom Série
  const handleAddNewSerie = () => {
    const val = newSerieInput.trim();
    if (!val) return;
    if (!availableSeries.includes(val)) {
      setCustomSeries(prev => [...prev, val]);
    }
    if (editingStudent) {
      setEditingStudent(prev => prev ? { ...prev, sala: val } : null);
    } else {
      setNewStudent(prev => ({ ...prev, sala: val }));
    }
    setNewSerieInput('');
    setIsCreatingSerie(false);
  };

  // Add new custom Turno
  const handleAddNewTurno = () => {
    const val = newTurnoInput.trim();
    if (!val) return;
    if (!availableTurnos.includes(val)) {
      setCustomTurnos(prev => [...prev, val]);
    }
    if (editingStudent) {
      setEditingStudent(prev => prev ? { ...prev, turno: val } : null);
    } else {
      setNewStudent(prev => ({ ...prev, turno: val }));
    }
    setNewTurnoInput('');
    setIsCreatingTurno(false);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newStudent.matricula.trim() || !newStudent.name.trim() || !newStudent.sala) {
      setFormError('Por favor preencha os campos obrigatórios (Matrícula, Nome e Série).');
      return;
    }

    if (students.some(s => s.matricula.trim() === newStudent.matricula.trim())) {
      setFormError('Matrícula já cadastrada para outro aluno!');
      return;
    }

    // Clean turma to up to 10 characters
    const cleanStudent: Student = {
      ...newStudent,
      matricula: newStudent.matricula.trim(),
      name: newStudent.name.trim(),
      turma: (newStudent.turma || '').slice(0, 10).trim(),
      email: (newStudent.email || '').trim(),
      responsibleName: (newStudent.responsibleName || '').trim(),
      responsibleEmail: (newStudent.responsibleEmail || '').trim(),
      responsiblePhone: (newStudent.responsiblePhone || '').trim()
    };

    onAddStudent(cleanStudent);
    setNewStudent(initialStudentState);
  };

  const handleUpdateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.name.trim() || !editingStudent.sala) return;

    const cleanStudent: Student = {
      ...editingStudent,
      name: editingStudent.name.trim(),
      turma: (editingStudent.turma || '').slice(0, 10).trim(),
      email: (editingStudent.email || '').trim(),
      responsibleName: (editingStudent.responsibleName || '').trim(),
      responsibleEmail: (editingStudent.responsibleEmail || '').trim(),
      responsiblePhone: (editingStudent.responsiblePhone || '').trim()
    };

    onUpdateStudent(cleanStudent);
    setEditingStudent(null);
  };

  const confirmDeleteStudent = (matricula: string) => {
    setStudentToDelete(matricula);
  };

  const handleDeleteStudentSubmit = () => {
    if (studentToDelete) {
      onDeleteStudent(studentToDelete);
      if (editingStudent?.matricula === studentToDelete) {
        setEditingStudent(null);
      }
      setStudentToDelete(null);
    }
  };

  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return students;
    return students.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.matricula.includes(q) ||
      (s.sala || '').toLowerCase().includes(q) ||
      (s.turma || '').toLowerCase().includes(q) ||
      (s.turno || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.responsibleName || '').toLowerCase().includes(q) ||
      (s.responsibleEmail || '').toLowerCase().includes(q) ||
      (s.responsiblePhone || '').toLowerCase().includes(q)
    );
  }, [students, searchTerm]);

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header Overview Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-indigo-400/30 mb-2">
            <i className="fas fa-user-graduate"></i>
            Cadastro & Gestão Discente
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Gestão de Alunos e Responsáveis
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/90 font-medium max-w-2xl mt-1">
            Cadastre novos alunos com turmas flexíveis (até 10 caracteres), séries e turnos personalizáveis, e gerencie informações de contato direto dos responsáveis.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-sm self-stretch md:self-auto justify-between md:justify-start">
          <div className="text-right">
            <span className="text-[10px] text-indigo-200 uppercase font-black tracking-wider block">Total de Alunos</span>
            <span className="text-2xl font-black text-white">{students.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center text-white text-lg">
            <i className="fas fa-users"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <section ref={formRef} className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit lg:sticky lg:top-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <i className={`fas ${editingStudent ? 'fa-edit text-amber-500' : 'fa-user-plus text-indigo-500'}`}></i>
              {editingStudent ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
            </h3>
            {editingStudent && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Em Edição
              </span>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2 animate-shake">
              <i className="fas fa-exclamation-circle text-base shrink-0"></i>
              <span>{formError}</span>
            </div>
          )}
          
          <form onSubmit={editingStudent ? handleUpdateStudentSubmit : handleAddStudent} className="space-y-4">
            {/* Matrícula */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Matrícula <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm ${editingStudent ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                value={editingStudent ? editingStudent.matricula : newStudent.matricula}
                onChange={e => !editingStudent && setNewStudent({...newStudent, matricula: e.target.value})}
                disabled={!!editingStudent}
                required
                placeholder="Ex: 2026001 ou CPF"
              />
            </div>

            {/* Nome Completo */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input 
                ref={nameInputRef}
                type="text" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                value={editingStudent ? editingStudent.name : newStudent.name}
                onChange={e => editingStudent 
                  ? setEditingStudent({...editingStudent, name: e.target.value})
                  : setNewStudent({...newStudent, name: e.target.value})
                }
                required
                placeholder="Ex: João da Silva Santos"
              />
            </div>

            {/* E-mail do Aluno */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                E-mail do Aluno
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input 
                  type="email" 
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={editingStudent ? (editingStudent.email || '') : (newStudent.email || '')}
                  onChange={e => editingStudent 
                    ? setEditingStudent({...editingStudent, email: e.target.value})
                    : setNewStudent({...newStudent, email: e.target.value})
                  }
                  placeholder="aluno@escola.edu.br"
                />
              </div>
            </div>
            
            {/* Série, Turno e Turma */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3.5">
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider block flex items-center gap-1.5">
                <i className="fas fa-chalkboard-teacher text-indigo-500"></i>
                Classificação Escolar
              </span>

              {/* Série com opção de Criar Série */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Série <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingSerie(prev => !prev)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                  >
                    <i className={`fas ${isCreatingSerie ? 'fa-times' : 'fa-plus'}`}></i>
                    {isCreatingSerie ? 'Cancelar' : '+ Criar Série'}
                  </button>
                </div>

                {!isCreatingSerie ? (
                  <select 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-800"
                    value={editingStudent ? editingStudent.sala : newStudent.sala}
                    onChange={e => editingStudent 
                      ? setEditingStudent({...editingStudent, sala: e.target.value})
                      : setNewStudent({...newStudent, sala: e.target.value})
                    }
                    required
                  >
                    {availableSeries.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-1.5 animate-fadeIn">
                    <input
                      type="text"
                      value={newSerieInput}
                      onChange={e => setNewSerieInput(e.target.value)}
                      placeholder="Ex: 4º Ano, 9º Ano EF..."
                      className="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewSerie}
                      disabled={!newSerieInput.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </div>

              {/* Turno com opção de Criar Turno */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Turno <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingTurno(prev => !prev)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                  >
                    <i className={`fas ${isCreatingTurno ? 'fa-times' : 'fa-plus'}`}></i>
                    {isCreatingTurno ? 'Cancelar' : '+ Criar Turno'}
                  </button>
                </div>

                {!isCreatingTurno ? (
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-800"
                    value={editingStudent ? editingStudent.turno : newStudent.turno}
                    onChange={e => editingStudent 
                      ? setEditingStudent({...editingStudent, turno: e.target.value})
                      : setNewStudent({...newStudent, turno: e.target.value})
                    }
                    required
                  >
                    {availableTurnos.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-1.5 animate-fadeIn">
                    <input
                      type="text"
                      value={newTurnoInput}
                      onChange={e => setNewTurnoInput(e.target.value)}
                      placeholder="Ex: Intermediário, Vespertino..."
                      className="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewTurno}
                      disabled={!newTurnoInput.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </div>

              {/* Turma (Permitir string com até 10 caracteres) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Turma
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {((editingStudent ? editingStudent.turma : newStudent.turma) || '').length}/10 caracteres
                  </span>
                </div>
                <input 
                  type="text" 
                  maxLength={10}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800 uppercase"
                  value={editingStudent ? (editingStudent.turma || '') : (newStudent.turma || '')}
                  onChange={e => {
                    const val = e.target.value.slice(0, 10);
                    if (editingStudent) {
                      setEditingStudent({...editingStudent, turma: val});
                    } else {
                      setNewStudent({...newStudent, turma: val});
                    }
                  }}
                  placeholder="Ex: 101, A, INFO-A"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Permite identificadores com até 10 caracteres (ex: 101, A, B-2, TI-01).
                </p>
              </div>
            </div>

            {/* Contato do Responsável (Nome, E-mail, Telefone) */}
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                <i className="fas fa-user-friends text-indigo-600"></i>
                <span>Contato do Responsável</span>
              </div>
              
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Nome do Responsável
                </label>
                <div className="relative">
                  <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input 
                    type="text" 
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-800"
                    value={editingStudent ? (editingStudent.responsibleName || '') : (newStudent.responsibleName || '')}
                    onChange={e => editingStudent 
                      ? setEditingStudent({...editingStudent, responsibleName: e.target.value})
                      : setNewStudent({...newStudent, responsibleName: e.target.value})
                    }
                    placeholder="Ex: Maria de Souza (Mãe/Pai/Tutor)"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  E-mail do Responsável
                </label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input 
                    type="email" 
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-800"
                    value={editingStudent ? (editingStudent.responsibleEmail || '') : (newStudent.responsibleEmail || '')}
                    onChange={e => editingStudent 
                      ? setEditingStudent({...editingStudent, responsibleEmail: e.target.value})
                      : setNewStudent({...newStudent, responsibleEmail: e.target.value})
                    }
                    placeholder="responsavel@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Telefone / WhatsApp do Responsável
                </label>
                <div className="relative">
                  <i className="fas fa-phone-alt absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input 
                    type="tel" 
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono font-medium text-slate-800"
                    value={editingStudent ? (editingStudent.responsiblePhone || '') : (newStudent.responsiblePhone || '')}
                    onChange={e => editingStudent 
                      ? setEditingStudent({...editingStudent, responsiblePhone: e.target.value})
                      : setNewStudent({...newStudent, responsiblePhone: e.target.value})
                    }
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Senha de Acesso à Urna <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none pr-10 text-sm font-mono"
                  value={editingStudent ? (editingStudent.password || '') : (newStudent.password || '')}
                  onChange={e => editingStudent 
                    ? setEditingStudent({...editingStudent, password: e.target.value})
                    : setNewStudent({...newStudent, password: e.target.value})
                  }
                  required
                  placeholder="Senha para autenticação do voto"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button 
                type="submit"
                className={`flex-1 ${editingStudent ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2`}
              >
                <i className={`fas ${editingStudent ? 'fa-check' : 'fa-user-check'}`}></i>
                {editingStudent ? 'Atualizar Aluno' : 'Cadastrar Aluno'}
              </button>
              
              {editingStudent && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingStudent(null);
                    setFormError(null);
                  }}
                  className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-xl transition-all text-sm"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* List Section */}
        <section className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-users text-slate-400"></i>
                Alunos Matriculados
                <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full ml-2 font-bold">
                  {filteredStudents.length} {filteredStudents.length === 1 ? 'aluno' : 'alunos'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Lista de discentes com turmas e contatos dos responsáveis</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Buscar por nome, matrícula, turma, responsável..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-semibold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 whitespace-nowrap sm:whitespace-normal">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Matrícula / Nome</th>
                  <th className="p-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Série & Turma</th>
                  <th className="p-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Turno</th>
                  <th className="p-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Responsável & Contato</th>
                  <th className="p-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <tr 
                      key={student.matricula} 
                      className={`transition-colors ${editingStudent?.matricula === student.matricula ? 'bg-amber-50/70' : 'hover:bg-slate-50/80'}`}
                    >
                      {/* Matrícula & Nome & Email */}
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-indigo-700 font-bold">{student.matricula}</span>
                          <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                          {student.email ? (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <i className="fas fa-envelope text-[10px] text-slate-400"></i>
                              {student.email}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sem e-mail cadastrado</span>
                          )}
                          {editingStudent?.matricula === student.matricula && (
                            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">
                              ● Editando agora
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Série & Turma (até 10 caracteres) */}
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{student.sala || 'N/A'}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 max-w-[120px] truncate" title={student.turma}>
                              Turma {student.turma || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Turno */}
                      <td className="p-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
                          (student.turno || 'Integral') === 'Integral' 
                            ? 'bg-sky-100 text-sky-800' 
                            : (student.turno || '') === 'Manhã'
                            ? 'bg-amber-100 text-amber-800'
                            : (student.turno || '') === 'Tarde'
                            ? 'bg-orange-100 text-orange-800'
                            : (student.turno || '') === 'Noite'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {student.turno || 'Integral'}
                        </span>
                      </td>

                      {/* Responsável & Contato */}
                      <td className="p-3.5">
                        {student.responsibleName || student.responsiblePhone || student.responsibleEmail ? (
                          <div className="space-y-1">
                            {student.responsibleName && (
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <i className="fas fa-user-circle text-indigo-500 text-[11px]"></i>
                                <span className="truncate max-w-[150px]">{student.responsibleName}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {student.responsiblePhone && (
                                <a 
                                  href={`tel:${student.responsiblePhone}`}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors"
                                  title="Ligar para responsável"
                                >
                                  <i className="fas fa-phone-alt text-[9px]"></i>
                                  {student.responsiblePhone}
                                </a>
                              )}
                              {student.responsibleEmail && (
                                <a 
                                  href={`mailto:${student.responsibleEmail}`}
                                  className="inline-flex items-center gap-1 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 transition-colors"
                                  title="Enviar e-mail ao responsável"
                                >
                                  <i className="fas fa-envelope text-[9px]"></i>
                                  E-mail
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingStudent(student)}
                            className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-medium transition-colors"
                          >
                            <i className="fas fa-plus-circle text-[10px]"></i>
                            Adicionar responsável
                          </button>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {(student.responsibleName || student.responsiblePhone || student.responsibleEmail || student.email) && (
                          <button
                            type="button"
                            onClick={() => setSelectedContactStudent(student)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ver detalhes de contato"
                          >
                            <i className="fas fa-address-card"></i>
                          </button>
                        )}
                        <button 
                          onClick={() => setEditingStudent(student)}
                          className={`p-2 rounded-lg transition-colors ${editingStudent?.matricula === student.matricula ? 'text-amber-600 bg-amber-100' : 'text-amber-500 hover:bg-amber-50'}`}
                          title="Editar aluno"
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </button>
                        <button 
                          onClick={() => confirmDeleteStudent(student.matricula)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir aluno"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      <i className="fas fa-search text-3xl mb-2 opacity-50 block"></i>
                      Nenhum aluno encontrado para os critérios de busca.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Contact Details Modal */}
      {selectedContactStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-scaleIn space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl">
                  <i className="fas fa-id-badge"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedContactStudent.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Matrícula: {selectedContactStudent.matricula}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedContactStudent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* Informações Escolares */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Série</span>
                  <span className="text-xs font-bold text-slate-800">{selectedContactStudent.sala || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Turma</span>
                  <span className="text-xs font-bold text-indigo-700">{selectedContactStudent.turma || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Turno</span>
                  <span className="text-xs font-bold text-slate-800">{selectedContactStudent.turno || 'Integral'}</span>
                </div>
              </div>

              {/* Contato do Aluno */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <i className="fas fa-envelope text-indigo-500"></i>
                  E-mail do Aluno
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedContactStudent.email || 'Não informado'}
                </p>
              </div>

              {/* Contato do Responsável */}
              <div className="p-5 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <i className="fas fa-user-friends text-indigo-600"></i>
                  Dados do Responsável
                </span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-indigo-100/70">
                    <span className="text-slate-500">Nome:</span>
                    <span className="font-bold text-slate-900">{selectedContactStudent.responsibleName || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-100/70">
                    <span className="text-slate-500">Telefone:</span>
                    {selectedContactStudent.responsiblePhone ? (
                      <a href={`tel:${selectedContactStudent.responsiblePhone}`} className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1">
                        <i className="fas fa-phone-alt text-[10px]"></i>
                        {selectedContactStudent.responsiblePhone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">E-mail:</span>
                    {selectedContactStudent.responsibleEmail ? (
                      <a href={`mailto:${selectedContactStudent.responsibleEmail}`} className="font-bold text-indigo-700 hover:underline flex items-center gap-1">
                        <i className="fas fa-envelope text-[10px]"></i>
                        {selectedContactStudent.responsibleEmail}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(selectedContactStudent);
                  setSelectedContactStudent(null);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-pencil-alt"></i>
                Editar Dados
              </button>
              <button
                type="button"
                onClick={() => setSelectedContactStudent(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-center text-slate-800 mb-2">Excluir Aluno?</h3>
            <p className="text-center text-slate-500 mb-8 text-sm">
              Tem certeza que deseja excluir o aluno com matrícula <strong>{studentToDelete}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setStudentToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteStudentSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 text-sm"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
