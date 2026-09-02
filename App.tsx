
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { StatsDashboard } from './components/StatsDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { UserManagementDashboard } from './components/UserManagementDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import { Student, Selection, MealOption, AdminUser } from './types';
import { MEAL_OPTIONS, INITIAL_STUDENTS } from './constants';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<'student' | 'admin' | 'master' | null>(() => {
    return (localStorage.getItem('userRole') as any) || null;
  });
  const [view, setView] = useState<'student' | 'admin' | 'users' | 'master_admins'>(() => {
    return (localStorage.getItem('view') as any) || 'student';
  });
  const [loginStep, setLoginStep] = useState<'role_selection' | 'student_login' | 'admin_login'>('role_selection');
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem('currentStudent');
    return saved ? JSON.parse(saved) : null;
  });
  const [registeredStudents, setRegisteredStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [mealOptions, setMealOptions] = useState<MealOption[]>(MEAL_OPTIONS);
  const [selectedCategory, setSelectedCategory] = useState<'Gremio' | 'Representante' | 'Alimentação' | 'Outros'>('Gremio');
  const [showSummary, setShowSummary] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persistence (Firestore)
  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        const s = doc.data() as Student;
        studentsData.push({
          ...s,
          turno: s.turno || 'Integral',
          sala: s.sala || '1º Ano',
          turma: s.turma || 'A'
        });
      });
      if (studentsData.length > 0) {
        setRegisteredStudents(studentsData);
      } else {
        setRegisteredStudents([]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
      if (error.message?.includes('permission')) {
        setError('Acesso negado ao Firebase: Leia as instruções do assistente para alterar as Regras de Segurança do Firestore.');
      }
    });

    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const adminsData: AdminUser[] = [];
      snapshot.forEach((doc) => {
        adminsData.push(doc.data() as AdminUser);
      });
      setAdminUsers(adminsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'admins');
      if (error.message?.includes('permission')) {
        setError('Acesso negado ao Firebase: Leia as instruções do assistente para alterar as Regras de Segurança do Firestore.');
      }
    });

    const unsubMeals = onSnapshot(collection(db, 'meals'), (snapshot) => {
      const mealsData: MealOption[] = [];
      snapshot.forEach((doc) => {
        const m = doc.data() as any;
        mealsData.push({
          ...m,
          category: (m.category === 'Padrao' ? 'Gremio' : m.category === 'Vegetariana' ? 'Alimentação' : m.category === 'Especial' ? 'Outros' : m.category) || 'Outros'
        });
      });
      if (mealsData.length > 0) {
        setMealOptions(mealsData);
      } else {
        setMealOptions([]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'meals');
      if (error.message?.includes('permission')) {
        setError('Acesso negado ao Firebase: Leia as instruções do assistente para alterar as Regras de Segurança do Firestore.');
      }
    });

    const unsubSelections = onSnapshot(collection(db, 'selections'), (snapshot) => {
      const selectionsData: Selection[] = [];
      snapshot.forEach((doc) => {
        const s = doc.data() as any;
        selectionsData.push({
          ...s,
          category: s.category || 'Gremio',
          turno: s.turno || 'Integral',
          sala: s.sala || '1º Ano',
          turma: s.turma || 'A'
        });
      });
      setSelections(selectionsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'selections');
      if (error.message?.includes('permission')) {
        setError('Acesso negado ao Firebase: Leia as instruções do assistente para alterar as Regras de Segurança do Firestore.');
      }
    });

    return () => {
      unsubStudents();
      unsubAdmins();
      unsubMeals();
      unsubSelections();
    };
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!loginId.trim() || !loginPassword.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (loginStep === 'student_login') {
      const student = registeredStudents.find(s => s.matricula === loginId && s.password === loginPassword);
      if (student) {
        setUserRole('student');
        setCurrentStudent(student);
        setView('student');
        localStorage.setItem('userRole', 'student');
        localStorage.setItem('view', 'student');
        localStorage.setItem('currentStudent', JSON.stringify(student));
      } else {
        setError("Matrícula ou senha inválidas.");
      }
    } else if (loginStep === 'admin_login') {
      if (loginId === '84040513215' && loginPassword === 'admin123') {
        setUserRole('master');
        setView('master_admins');
        localStorage.setItem('userRole', 'master');
        localStorage.setItem('view', 'master_admins');
      } else {
        const admin = adminUsers.find(a => a.login === loginId && a.password === loginPassword);
        if (admin) {
          setUserRole('admin');
          setView('admin');
          localStorage.setItem('userRole', 'admin');
          localStorage.setItem('view', 'admin');
        } else {
          setError("Login ou senha inválidos.");
        }
      }
    }
  };

  const handleMealSelection = async (mealId: string) => {
    if (!currentStudent) return;
    setSelectedMealId(mealId);
  };

  const handleAddMeal = async (meal: MealOption) => {
    try {
      await setDoc(doc(db, 'meals', meal.id), meal);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `meals/${meal.id}`);
    }
  };

  const handleUpdateMeal = async (meal: MealOption) => {
    try {
      await setDoc(doc(db, 'meals', meal.id), meal);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `meals/${meal.id}`);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'meals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `meals/${id}`);
    }
  };

  const handleAddStudent = async (student: Student) => {
    try {
      await setDoc(doc(db, 'students', student.matricula), student);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `students/${student.matricula}`);
    }
  };

  const handleUpdateStudent = async (student: Student) => {
    try {
      await setDoc(doc(db, 'students', student.matricula), student);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${student.matricula}`);
    }
  };

  const handleDeleteStudent = async (matricula: string) => {
    try {
      await deleteDoc(doc(db, 'students', matricula));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${matricula}`);
    }
  };

  const handleAddAdmin = async (admin: AdminUser) => {
    try {
      await setDoc(doc(db, 'admins', admin.id), admin);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `admins/${admin.id}`);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'admins', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admins/${id}`);
    }
  };

  const confirmSelection = async () => {
    if (!currentStudent || !selectedMealId) return;

    const alreadyVoted = selections.some(
      s => s.matricula === currentStudent.matricula && s.category === selectedCategory
    );
    if (alreadyVoted) {
      setError(`Você já registrou seu voto na categoria ${selectedCategory === 'Gremio' ? 'Grêmio Escolar' : selectedCategory === 'Representante' ? 'Representante de Classe' : selectedCategory === 'Alimentação' ? 'Alimentação / Merenda' : 'Outros'}.`);
      return;
    }

    const newSelection: Selection = {
      matricula: currentStudent.matricula,
      mealId: selectedMealId,
      category: selectedCategory,
      timestamp: new Date().toISOString(),
      turno: currentStudent.turno || 'Integral',
      sala: currentStudent.sala || '1º Ano',
      turma: currentStudent.turma || 'A'
    };

    try {
      await setDoc(doc(db, 'selections', `${newSelection.matricula}_${selectedCategory}_${newSelection.timestamp.replace(/[:.]/g, '-')}`), newSelection);
      setSelectedMealId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'selections');
    }
  };

  const logout = () => {
    setUserRole(null);
    setCurrentStudent(null);
    setLoginId('');
    setLoginPassword('');
    setSelectedMealId(null);
    setError(null);
    setLoginStep('role_selection');
    localStorage.removeItem('userRole');
    localStorage.removeItem('view');
    localStorage.removeItem('currentStudent');
  };

  // Only show active options belonging to the currently selected category
  const activeMeals = useMemo(() => {
    return mealOptions.filter(m => m.active && m.category === selectedCategory);
  }, [mealOptions, selectedCategory]);

  const hasAlreadyVoted = useMemo(() => {
    return selections.some(
      s => s.matricula === currentStudent?.matricula && s.category === selectedCategory
    );
  }, [selections, currentStudent, selectedCategory]);

  const nextPendingCategory = useMemo(() => {
    const categories: ('Gremio' | 'Representante' | 'Alimentação' | 'Outros')[] = ['Gremio', 'Representante', 'Alimentação', 'Outros'];
    return categories.find(cat => {
      const hasVoted = selections.some(s => s.matricula === currentStudent?.matricula && s.category === cat);
      return !hasVoted;
    });
  }, [selections, currentStudent]);


  const handleRoleSelect = (role: 'student' | 'admin') => {
    setLoginStep(role === 'student' ? 'student_login' : 'admin_login');
    setError(null);
    setLoginId('');
    setLoginPassword('');
  };

  const handleExit = () => {
    logout();
  };

  if (!userRole) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-fadeIn py-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">Bem-vindo ao EDUVOTAÇÃO</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              {loginStep === 'role_selection' ? 'Selecione seu perfil de acesso para continuar.' : 'Faça login para acessar o sistema.'}
            </p>
          </div>

          {error && error.includes('Firebase') && (
            <div className="max-w-2xl mx-auto mb-8 bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-2xl shadow-sm flex items-start gap-4">
               <i className="fas fa-exclamation-triangle mt-1 text-red-600 text-2xl"></i>
               <div>
                  <h4 className="font-bold text-red-900 text-lg">Erro de Banco de Dados</h4>
                  <p className="text-sm mt-1 leading-relaxed">{error}</p>
               </div>
            </div>
          )}
          
          {loginStep === 'role_selection' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
              <button 
                onClick={() => handleRoleSelect('student')}
                className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-indigo-200 transition-all duration-300 text-left flex flex-col items-center justify-center gap-6 h-64"
              >
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-user-graduate text-4xl text-indigo-600"></i>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Sou Aluno</h3>
                  <p className="text-slate-500 text-sm">Acesse o portal para exercer sua cidadania e votar nas opções vigentes.</p>
                </div>
              </button>

              <button 
                onClick={() => handleRoleSelect('admin')}
                className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-amber-200 transition-all duration-300 text-left flex flex-col items-center justify-center gap-6 h-64"
              >
                <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-user-shield text-4xl text-amber-600"></i>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-amber-600 transition-colors">Sou Gestão</h3>
                  <p className="text-slate-500 text-sm">Gere enquetes, revise os resultados e administre os eleitores.</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-indigo-100 border border-slate-100 w-full max-w-md animate-fadeIn">
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-2 text-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className={`fas ${loginStep === 'student_login' ? 'fa-user-graduate' : 'fa-user-shield'} text-2xl text-indigo-600`}></i>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {loginStep === 'student_login' ? 'Login do Aluno' : 'Login da Gestão'}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                      {loginStep === 'student_login' ? 'Matrícula' : 'Login'}
                    </label>
                    <div className="relative">
                      <i className={`fas ${loginStep === 'student_login' ? 'fa-id-card' : 'fa-user'} absolute left-4 top-1/2 -translate-y-1/2 text-slate-400`}></i>
                      <input 
                        type="text" 
                        required
                        placeholder={loginStep === 'student_login' ? 'Ex: 2023001' : 'Seu login'}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg font-medium"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Senha</label>
                    <div className="relative">
                      <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input 
                        type="password" 
                        required
                        placeholder="***"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg font-medium"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3 animate-shake">
                    <i className="fas fa-exclamation-triangle mt-1"></i>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 text-lg"
                  >
                    Entrar
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLoginStep('role_selection')}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 px-6 rounded-2xl transition-all text-sm"
                  >
                    Voltar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-20">
        
        {/* Header with Role Info and Logout */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${userRole === 'student' ? 'bg-indigo-100 text-indigo-600' : userRole === 'master' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
                <i className={`fas ${userRole === 'student' ? 'fa-user-graduate' : userRole === 'master' ? 'fa-crown' : 'fa-user-shield'}`}></i>
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perfil de Acesso</p>
                <p className="font-bold text-slate-800">{userRole === 'student' ? 'Portal do Aluno' : userRole === 'master' ? 'Usuário Master' : 'Gestão Administrativa'}</p>
             </div>
          </div>
          
          {userRole === 'admin' && (
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
               <button onClick={() => setView('admin')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'admin' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Opções / Resultados</button>
               <button onClick={() => setView('users')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'users' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Usuários</button>
            </div>
          )}

          <button onClick={handleExit} className="text-slate-400 hover:text-red-500 transition-colors px-4 py-2 font-medium text-sm flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
             <i className="fas fa-sign-out-alt"></i>
             <span>Sair</span>
          </button>
        </div>

        {userRole === 'master' ? (
          <MasterDashboard 
            admins={adminUsers}
            onAddAdmin={handleAddAdmin}
            onDeleteAdmin={handleDeleteAdmin}
          />
        ) : userRole === 'admin' ? (
          view === 'admin' ? (
            <AdminDashboard 
              selections={selections} 
              mealOptions={mealOptions} 
              onAddMeal={handleAddMeal}
              onUpdateMeal={handleUpdateMeal}
              onDeleteMeal={handleDeleteMeal}
              students={registeredStudents}
            />
          ) : (
            <UserManagementDashboard 
              students={registeredStudents}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          )
        ) : (
          <>
            {/* Header Section */}
            <div className="text-center space-y-3">
              <div className="inline-block bg-indigo-150 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-1 shadow-sm border border-indigo-200">
                🎫 Portal EduVotação
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">EDUVOTAÇÃO GERAL</h2>
              <p className="text-slate-500 max-w-xl mx-auto text-base">
                Plataforma democrática escolar. Escolha uma categoria abaixo para exercer sua cidadania e registrar sua voz nas decisões escolares.
              </p>
            </div>

            {!currentStudent ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                <div className="order-2 md:order-1 md:col-span-2">
                  <StatsDashboard selections={selections} mealOptions={mealOptions} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* User Selection Section */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Student profile info card */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                        {currentStudent.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{currentStudent.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Matrícula: {currentStudent.matricula}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">Série: {currentStudent.sala || 'N/A'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">Turma: {currentStudent.turma || 'N/A'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-md">Turno: {currentStudent.turno || 'Integral'}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={logout} className="text-slate-400 hover:text-red-500 p-2 transition-colors flex flex-col items-center">
                      <i className="fas fa-power-off text-lg"></i>
                      <span className="text-[10px] uppercase font-bold mt-1">Sair</span>
                    </button>
                  </div>

                  {/* Student Ballot Category Switcher */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cédulas Disponíveis</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['Gremio', 'Representante', 'Alimentação', 'Outros'] as const).map((cat) => {
                        const votedInThisCat = selections.some(
                          s => s.matricula === currentStudent.matricula && s.category === cat
                        );
                        const isSelected = selectedCategory === cat && !showSummary;
                        
                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setSelectedMealId(null);
                              setShowSummary(false);
                            }}
                            className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                                : 'bg-white border-slate-150 hover:border-indigo-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="block font-black text-xs leading-none mb-1">
                              {cat === 'Gremio' ? 'Grêmio' : cat === 'Representante' ? 'Representante' : cat === 'Alimentação' ? 'Alimentação' : 'Outros'}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              votedInThisCat 
                                ? isSelected ? 'bg-white/20 text-white' : 'bg-green-150 text-green-700'
                                : isSelected ? 'bg-white/10 text-indigo-100' : 'bg-amber-100 text-amber-700'
                            }`}>
                              <i className={`fas ${votedInThisCat ? 'fa-check' : 'fa-hourglass-half'}`}></i>
                              {votedInThisCat ? 'Votado' : 'Pendente'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {showSummary ? (
                    <div className="bg-slate-50 p-8 sm:p-12 rounded-3xl border-2 border-slate-200 shadow-sm animate-fadeIn">
                      <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-6 shadow-inner">
                          <i className="fas fa-clipboard-check"></i>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 mb-2">Resumo das Votações</h3>
                        <p className="text-slate-500 max-w-md mx-auto">Confira abaixo os votos que você registrou nesta urna. Eles já foram computados criptograficamente.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['Gremio', 'Representante', 'Alimentação', 'Outros'] as const).map((cat) => {
                          const vote = selections.find(s => s.matricula === currentStudent.matricula && s.category === cat);
                          const meal = vote ? mealOptions.find(m => m.id === vote.mealId) : null;
                          
                          return (
                            <div key={cat} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${vote ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                <i className={`fas ${cat === 'Gremio' ? 'fa-users' : cat === 'Representante' ? 'fa-user-tie' : cat === 'Alimentação' ? 'fa-utensils' : 'fa-clipboard-list'} text-xl`}></i>
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{cat === 'Gremio' ? 'Grêmio Escolar' : cat === 'Representante' ? 'Representante de Classe' : cat === 'Alimentação' ? 'Alimentação' : 'Outros'}</p>
                                <p className={`font-bold truncate ${vote ? 'text-slate-800 text-base' : 'text-slate-400 italic text-sm'}`}>
                                  {meal ? meal.name : 'Pendente (Não votou)'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-10 flex justify-center">
                        <button 
                          onClick={logout} 
                          className="bg-slate-800 text-white font-extrabold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-900 transition-all active:scale-95 text-sm flex items-center gap-3"
                        >
                          <i className="fas fa-sign-out-alt"></i>
                          Finalizar e Sair do Sistema
                        </button>
                      </div>
                    </div>
                  ) : hasAlreadyVoted ? (
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-10 rounded-3xl text-center text-white shadow-xl animate-fadeIn">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto text-4xl mb-6">
                        <i className="fas fa-check-double animate-pulse"></i>
                      </div>
                      <h3 className="text-3xl font-black mb-2">Voto Registrado no Sistema!</h3>
                      <p className="text-white/80 text-base mb-8 max-w-md mx-auto">
                        Seu voto para <strong>{selectedCategory === 'Gremio' ? 'Grêmio Escolar' : selectedCategory === 'Representante' ? 'Representante de Classe' : selectedCategory === 'Alimentação' ? 'Alimentação / Merenda' : 'Outros Assuntos'}</strong> já foi computado criptograficamente com sucesso nesta urna. Escolha outra aba acima ou finalize sua sessão.
                      </p>
                      {nextPendingCategory ? (
                        <button 
                          onClick={() => {
                            setSelectedCategory(nextPendingCategory);
                            setSelectedMealId(null);
                          }} 
                          className="bg-white text-emerald-600 font-extrabold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm"
                        >
                          Ir para Próxima Votação
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowSummary(true)} 
                          className="bg-white text-emerald-600 font-extrabold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm"
                        >
                          Concluir e Voltar ao Início
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-800">
                          {selectedCategory === 'Gremio' ? 'Candidatos do Grêmio Escolar' : 
                           selectedCategory === 'Representante' ? 'Representantes de Classe' : 
                           selectedCategory === 'Alimentação' ? 'Selecione a Opção de Refeição' : 
                           'Projetos e Assuntos Gerais'}
                        </h3>
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-150 uppercase tracking-wider">
                          Uso Individual
                        </span>
                      </div>
                      
                      {activeMeals.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {activeMeals.map((meal) => (
                            <button
                              key={meal.id}
                              onClick={() => handleMealSelection(meal.id)}
                              className={`text-left p-6 rounded-3xl border-2 transition-all relative group overflow-hidden ${
                                selectedMealId === meal.id 
                                  ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-4 ring-indigo-500/5' 
                                  : 'border-slate-150 bg-white hover:border-indigo-200 hover:shadow-sm'
                              }`}
                            >
                              {selectedMealId === meal.id && (
                                <div className="absolute top-4 right-4 text-indigo-600 animate-fadeIn">
                                  <i className="fas fa-check-circle text-2xl animate-scaleUp"></i>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">{meal.calories}</span>
                              </div>
                              <h4 className="font-extrabold text-slate-900 text-xl mb-2 group-hover:text-indigo-600 transition-colors uppercase">{meal.name}</h4>
                              <p className="text-slate-500 text-sm leading-relaxed max-w-xl">{meal.description}</p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-12 text-center rounded-3xl border-2 border-dashed border-slate-200">
                          <i className="fas fa-folder-open text-4xl text-slate-300 mb-3"></i>
                          <p className="text-slate-500 font-bold">Nenhum candidato ou opção cadastrada nesta categoria no momento.</p>
                        </div>
                      )}

                      {selectedMealId && (
                        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl animate-fadeIn space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-10">
                            <i className="fas fa-ticket-alt text-8xl -rotate-12 text-slate-800"></i>
                          </div>
                          
                          <div className="pt-2">
                            <button 
                              onClick={confirmSelection}
                              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-5 rounded-2xl shadow-lg transition-all active:scale-[0.98] text-xl flex items-center justify-center gap-3"
                            >
                              CONFIRMAR SEU VOTO
                              <i className="fas fa-arrow-right text-sm"></i>
                            </button>
                            <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">
                              Ao confirmar, sua decisão será gravada para esta cédula de voto.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                   <StatsDashboard selections={selections} mealOptions={mealOptions} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </Layout>
  );
};

export default App;
