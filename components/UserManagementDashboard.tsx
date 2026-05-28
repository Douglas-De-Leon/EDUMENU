import React, { useState, useRef, useEffect } from 'react';
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
  const [newStudent, setNewStudent] = useState<Student>({ matricula: '', name: '', password: '' });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingStudent && nameInputRef.current) {
      nameInputRef.current.focus();
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingStudent]);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.matricula || !newStudent.name) return;

    if (students.some(s => s.matricula === newStudent.matricula)) {
      alert('Matrícula já cadastrada!');
      return;
    }

    onAddStudent(newStudent);
    setNewStudent({ matricula: '', name: '', password: '' });
  };

  const handleUpdateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.name) return;

    onUpdateStudent(editingStudent);
    setEditingStudent(null);
    setNewStudent({ matricula: '', name: '', password: '' }); // Clear any partial new student data
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

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matricula.includes(searchTerm)
  );

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <section ref={formRef} className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit sticky top-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className={`fas ${editingStudent ? 'fa-edit text-amber-500' : 'fa-user-plus text-indigo-500'}`}></i>
            {editingStudent ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
          </h3>
          
          <form onSubmit={editingStudent ? handleUpdateStudentSubmit : handleAddStudent} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Matrícula</label>
              <input 
                type="text" 
                className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${editingStudent ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={editingStudent ? editingStudent.matricula : newStudent.matricula}
                onChange={e => !editingStudent && setNewStudent({...newStudent, matricula: e.target.value})}
                disabled={!!editingStudent}
                required
                placeholder="Ex: 2023001"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome Completo</label>
              <input 
                ref={nameInputRef}
                type="text" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={editingStudent ? editingStudent.name : newStudent.name}
                onChange={e => editingStudent 
                  ? setEditingStudent({...editingStudent, name: e.target.value})
                  : setNewStudent({...newStudent, name: e.target.value})
                }
                required
                placeholder="Ex: João da Silva"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Senha</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={editingStudent ? (editingStudent.password || '') : (newStudent.password || '')}
                onChange={e => editingStudent 
                  ? setEditingStudent({...editingStudent, password: e.target.value})
                  : setNewStudent({...newStudent, password: e.target.value})
                }
                required
                placeholder="***"
              />
            </div>
            
            <div className="flex gap-2">
              <button className={`flex-1 ${editingStudent ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95`}>
                {editingStudent ? 'Atualizar' : 'Cadastrar'}
              </button>
              
              {editingStudent && (
                <button 
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* List Section */}
        <section className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-users text-slate-400"></i>
              Alunos Cadastrados
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full ml-2">
                {students.length}
              </span>
            </h3>
            
            <div className="relative w-full sm:w-64">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Buscar por nome ou matrícula..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 whitespace-nowrap sm:whitespace-normal">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Matrícula</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <tr 
                      key={student.matricula} 
                      className={`transition-colors ${editingStudent?.matricula === student.matricula ? 'bg-amber-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="p-4 font-mono text-sm text-slate-600">{student.matricula}</td>
                      <td className="p-4 font-medium text-slate-800">
                        {student.name}
                        {editingStudent?.matricula === student.matricula && (
                          <span className="ml-2 text-xs text-amber-600 font-bold uppercase tracking-wider">(Editando)</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => setEditingStudent(student)}
                          className={`p-2 rounded-lg transition-colors ${editingStudent?.matricula === student.matricula ? 'text-amber-600 bg-amber-100' : 'text-amber-500 hover:bg-amber-50'}`}
                          title="Editar"
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </button>
                        <button 
                          onClick={() => confirmDeleteStudent(student.matricula)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      Nenhum aluno encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-center text-slate-800 mb-2">Excluir Aluno?</h3>
            <p className="text-center text-slate-500 mb-8">
              Tem certeza que deseja excluir o aluno com matrícula <strong>{studentToDelete}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setStudentToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteStudentSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
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
