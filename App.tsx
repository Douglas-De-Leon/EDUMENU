
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { StatsDashboard } from './components/StatsDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { UserManagementDashboard } from './components/UserManagementDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import { Student, Selection, MealOption, AdminUser } from './types';
import { MEAL_OPTIONS, INITIAL_STUDENTS } from './constants';
import { getNutritionalTip, getDailyStatsInsight } from './services/geminiService';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<'student' | 'admin' | 'master' | null>(null);
  const [view, setView] = useState<'student' | 'admin' | 'users' | 'master_admins'>('student');
  const [loginStep, setLoginStep] = useState<'role_selection' | 'student_login' | 'admin_login'>('role_selection');
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [registeredStudents, setRegisteredStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [mealOptions, setMealOptions] = useState<MealOption[]>(MEAL_OPTIONS);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string>('');
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Persistence (Firestore)
  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        studentsData.push(doc.data() as Student);
      });
      if (studentsData.length > 0) {
        setRegisteredStudents(studentsData);
      } else {
        // Initialize with default if empty
        INITIAL_STUDENTS.forEach(student => {
          setDoc(doc(db, 'students', student.matricula), student).catch(e => handleFirestoreError(e, OperationType.CREATE, 'students'));
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });

    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const adminsData: AdminUser[] = [];
      snapshot.forEach((doc) => {
        adminsData.push(doc.data() as AdminUser);
      });
      setAdminUsers(adminsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'admins');
    });

    const unsubMeals = onSnapshot(collection(db, 'meals'), (snapshot) => {
      const mealsData: MealOption[] = [];
      snapshot.forEach((doc) => {
        mealsData.push(doc.data() as MealOption);
      });
      if (mealsData.length > 0) {
        setMealOptions(mealsData);
      } else {
        // Initialize with default if empty
        MEAL_OPTIONS.forEach(meal => {
          setDoc(doc(db, 'meals', meal.id), meal).catch(e => handleFirestoreError(e, OperationType.CREATE, 'meals'));
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'meals');
    });

    const unsubSelections = onSnapshot(collection(db, 'selections'), (snapshot) => {
      const selectionsData: Selection[] = [];
      snapshot.forEach((doc) => {
        selectionsData.push(doc.data() as Selection);
      });
      setSelections(selectionsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'selections');
    });

    return () => {
      unsubStudents();
      unsubAdmins();
      unsubMeals();
      unsubSelections();
    };
  }, []);

  useEffect(() => {
    updateInsight();
  }, [selections]);

  const updateInsight = async () => {
    if (selections.length > 0) {
      const counts = mealOptions.reduce((acc: any, meal) => {
        acc[meal.name] = selections.filter(s => s.mealId === meal.id).length;
        return acc;
      }, {});
      const text = await getDailyStatsInsight(selections.length, counts);
      setInsight(text);
    }
  };

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
      } else {
        setError("Matrícula ou senha inválidas.");
      }
    } else if (loginStep === 'admin_login') {
      if (loginId === '84040513215' && loginPassword === 'admin123') {
        setUserRole('master');
        setView('master_admins');
      } else {
        const admin = adminUsers.find(a => a.login === loginId && a.password === loginPassword);
        if (admin) {
          setUserRole('admin');
          setView('admin');
        } else {
          setError("Login ou senha inválidos.");
        }
      }
    }
  };

  const handleMealSelection = async (mealId: string) => {
    if (!currentStudent) return;
    setLoading(true);
    setSelectedMealId(mealId);
    
    const meal = mealOptions.find(m => m.id === mealId);
    if (meal) {
      const tip = await getNutritionalTip(meal.name);
      setAiTip(tip);
    }
    setLoading(false);
  };

  const handleUpdateMeals = async (newMeals: MealOption[]) => {
    // Find deleted meals
    const deletedMeals = mealOptions.filter(m => !newMeals.find(nm => nm.id === m.id));
    for (const meal of deletedMeals) {
      try {
        await deleteDoc(doc(db, 'meals', meal.id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `meals/${meal.id}`);
      }
    }

    // Update or add meals
    for (const meal of newMeals) {
      try {
        await setDoc(doc(db, 'meals', meal.id), meal);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `meals/${meal.id}`);
      }
    }
  };

  const handleUpdateStudents = async (newStudents: Student[]) => {
    // Find deleted students
    const deletedStudents = registeredStudents.filter(s => !newStudents.find(ns => ns.matricula === s.matricula));
    for (const student of deletedStudents) {
      try {
        await deleteDoc(doc(db, 'students', student.matricula));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `students/${student.matricula}`);
      }
    }

    // Update or add students
    for (const student of newStudents) {
      try {
        await setDoc(doc(db, 'students', student.matricula), student);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `students/${student.matricula}`);
      }
    }
  };

  const handleUpdateAdmins = async (newAdmins: AdminUser[]) => {
    // Find deleted admins
    const deletedAdmins = adminUsers.filter(a => !newAdmins.find(na => na.id === a.id));
    for (const admin of deletedAdmins) {
      try {
        await deleteDoc(doc(db, 'admins', admin.id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `admins/${admin.id}`);
      }
    }

    // Update or add admins
    for (const admin of newAdmins) {
      try {
        await setDoc(doc(db, 'admins', admin.id), admin);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `admins/${admin.id}`);
      }
    }
  };

  const confirmSelection = async () => {
    if (!currentStudent || !selectedMealId) return;

    const today = new Date().toISOString().split('T')[0];
    const alreadyVoted = selections.some(s => s.matricula === currentStudent.matricula && s.timestamp.startsWith(today));
    if (alreadyVoted) {
      setError("Você já registrou sua opção hoje.");
      return;
    }

    const newSelection: Selection = {
      matricula: currentStudent.matricula,
      mealId: selectedMealId,
      timestamp: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'selections', `${newSelection.matricula}_${newSelection.timestamp}`), newSelection);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'selections');
    }
  };

  const logout = () => {
    setCurrentStudent(null);
    setLoginId('');
    setLoginPassword('');
    setSelectedMealId(null);
    setAiTip('');
    setError(null);
    setLoginStep('role_selection');
  };

  const activeMeals = useMemo(() => mealOptions.filter(m => m.active), [mealOptions]);
  const hasAlreadyVoted = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return selections.some(s => s.matricula === currentStudent?.matricula && s.timestamp.startsWith(today));
  }, [selections, currentStudent]);

  const handleRoleSelect = (role: 'student' | 'admin') => {
    setLoginStep(role === 'student' ? 'student_login' : 'admin_login');
    setError(null);
    setLoginId('');
    setLoginPassword('');
  };

  const handleExit = () => {
    setUserRole(null);
    setView('student');
    logout();
  };

  if (!userRole) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-fadeIn py-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">Bem-vindo ao EduMenu</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              {loginStep === 'role_selection' ? 'Selecione seu perfil de acesso para continuar.' : 'Faça login para acessar o sistema.'}
            </p>
          </div>
          
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
                  <p className="text-slate-500 text-sm">Acesse o portal para registrar sua presença e escolher sua refeição.</p>
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
                  <p className="text-slate-500 text-sm">Gerencie o cardápio, visualize estatísticas e administre usuários.</p>
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
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${userRole === 'student' ? 'bg-indigo-100 text-indigo-600' : userRole === 'master' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
                <i className={`fas ${userRole === 'student' ? 'fa-user-graduate' : userRole === 'master' ? 'fa-crown' : 'fa-user-shield'}`}></i>
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perfil de Acesso</p>
                <p className="font-bold text-slate-800">{userRole === 'student' ? 'Portal do Aluno' : userRole === 'master' ? 'Usuário Master' : 'Gestão Administrativa'}</p>
             </div>
          </div>
          
          {userRole === 'admin' && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'admin' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Cozinha</button>
               <button onClick={() => setView('users')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'users' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Usuários</button>
            </div>
          )}

          <button onClick={handleExit} className="text-slate-400 hover:text-red-500 transition-colors px-4 py-2 font-medium text-sm flex items-center gap-2">
             <i className="fas fa-sign-out-alt"></i>
             <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        {userRole === 'master' ? (
          <MasterDashboard 
            admins={adminUsers}
            onUpdateAdmins={handleUpdateAdmins}
          />
        ) : userRole === 'admin' ? (
          view === 'admin' ? (
            <AdminDashboard 
              selections={selections} 
              mealOptions={mealOptions} 
              onUpdateMeals={handleUpdateMeals}
              students={registeredStudents}
            />
          ) : (
            <UserManagementDashboard 
              students={registeredStudents}
              onUpdateStudents={handleUpdateStudents}
            />
          )
        ) : (
          <>
            {/* Header Section */}
            <div className="text-center space-y-3">
              <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
                Sistema de Merenda
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">EduMenu Escolar</h2>
              <p className="text-slate-500 max-w-xl mx-auto text-lg">
                Registre sua presença no almoço para garantir uma alimentação equilibrada e sem desperdícios.
              </p>
            </div>

            {!currentStudent ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                <div className="order-2 md:order-1">
                  <StatsDashboard selections={selections.filter(s => s.timestamp.startsWith(new Date().toISOString().split('T')[0]))} mealOptions={activeMeals} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* User Selection Section */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                        {currentStudent.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{currentStudent.name}</h3>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Matrícula: {currentStudent.matricula}</p>
                      </div>
                    </div>
                    <button onClick={logout} className="text-slate-400 hover:text-red-500 p-2 transition-colors flex flex-col items-center">
                      <i className="fas fa-power-off text-lg"></i>
                      <span className="text-[10px] uppercase font-bold mt-1">Sair</span>
                    </button>
                  </div>

                  {hasAlreadyVoted ? (
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-10 rounded-3xl text-center text-white shadow-xl animate-fadeIn">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto text-4xl mb-6">
                        <i className="fas fa-heart"></i>
                      </div>
                      <h3 className="text-3xl font-black mb-2">Opção Confirmada!</h3>
                      <p className="text-white/80 text-lg mb-8">Obrigado por registrar sua escolha. Sua refeição está garantida.</p>
                      <button 
                        onClick={logout} 
                        className="bg-white text-emerald-600 font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                      >
                        Finalizar e Sair
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-slate-800">Cardápio do Dia</h3>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                          ESCOLHA ÚNICA
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {activeMeals.map((meal) => (
                          <button
                            key={meal.id}
                            onClick={() => handleMealSelection(meal.id)}
                            className={`text-left p-6 rounded-3xl border-2 transition-all relative group overflow-hidden ${
                              selectedMealId === meal.id 
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-4 ring-indigo-500/5' 
                                : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm'
                            }`}
                          >
                            {selectedMealId === meal.id && (
                              <div className="absolute top-4 right-4 text-indigo-600 animate-fadeIn">
                                <i className="fas fa-check-circle text-2xl"></i>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                                meal.category === 'Padrao' ? 'bg-indigo-100 text-indigo-600' :
                                meal.category === 'Vegetariana' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {meal.category}
                              </span>
                              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{meal.calories}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-xl mb-2 group-hover:text-indigo-600 transition-colors">{meal.name}</h4>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-lg">{meal.description}</p>
                          </button>
                        ))}
                      </div>

                      {selectedMealId && (
                        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl animate-fadeIn space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-10">
                            <i className="fas fa-utensils text-8xl -rotate-12"></i>
                          </div>
                          
                          <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-3 text-indigo-400">
                              <i className="fas fa-sparkles"></i>
                              <span className="text-xs font-black uppercase tracking-widest">Dica da Nutrição IA</span>
                            </div>
                            <p className="text-xl font-medium leading-tight text-indigo-50 italic">
                              "{loading ? "Consultando a nutricionista digital..." : aiTip}"
                            </p>
                          </div>
                          
                          <div className="pt-2">
                            <button 
                              onClick={confirmSelection}
                              disabled={loading}
                              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-5 rounded-2xl shadow-lg transition-all active:scale-[0.98] text-xl flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                              CONFIRMAR ESTE PRATO
                              <i className="fas fa-arrow-right text-sm"></i>
                            </button>
                            <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">
                              Após confirmar, você não poderá alterar sua escolha.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                   <StatsDashboard selections={selections.filter(s => s.timestamp.startsWith(new Date().toISOString().split('T')[0]))} mealOptions={activeMeals} />
                   
                   <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-lg space-y-4">
                     <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                       <i className="fas fa-brain"></i>
                       EduInsight IA
                     </div>
                     <p className="text-slate-300 italic text-sm leading-relaxed">
                       "{insight || "Gerando insights sobre o consumo da merenda hoje..."}"
                     </p>
                   </div>
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
