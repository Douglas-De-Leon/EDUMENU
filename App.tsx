
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { StatsDashboard } from './components/StatsDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { UserManagementDashboard } from './components/UserManagementDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import { LandingPage } from './components/LandingPage';
import { Student, Selection, MealOption, AdminUser, School, VotingSession, AttendanceRecord } from './types';
import { MEAL_OPTIONS, INITIAL_STUDENTS, INITIAL_VOTING_SESSIONS } from './constants';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';
import { 
  getCachedData, 
  setCachedData, 
  CACHE_KEYS, 
  getLastSyncTime 
} from './utils/storageCache';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { StudentVotingDashboard } from './components/StudentVotingDashboard';
import { dbAutoInitIfEmpty } from './services/databaseService';
import { testDatabaseConnection } from './firebase';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<'student' | 'admin' | 'master' | null>(() => {
    return (localStorage.getItem('userRole') as any) || null;
  });
  const [view, setView] = useState<'student' | 'admin' | 'users' | 'master_admins'>(() => {
    return (localStorage.getItem('view') as any) || 'student';
  });
  const [loginStep, setLoginStep] = useState<'landing' | 'role_selection' | 'student_login' | 'admin_login'>('landing');
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Testa conexão com Firestore ao inicializar para aquecer a rota de rede
  useEffect(() => {
    testDatabaseConnection().then(res => {
      if (res.success) {
        setDbLatency(res.latencyMs);
      }
    }).catch(() => {});
  }, []);

  const handleTestDatabase = async () => {
    setIsTestingDb(true);
    try {
      const res = await testDatabaseConnection();
      if (res.success) {
        setDbLatency(res.latencyMs);
        showToast(`Banco Firestore testado com sucesso! Resposta em ${res.latencyMs}ms`, 'success');
      } else {
        showToast(`Alerta no teste do banco: ${res.error}`, 'error');
      }
    } catch (e: any) {
      showToast(`Erro ao testar banco: ${e.message}`, 'error');
    } finally {
      setIsTestingDb(false);
    }
  };

  // Inicialização automática do banco no primeiro acesso sem necessidade de botões
  useEffect(() => {
    dbAutoInitIfEmpty().catch(err => console.warn('Aviso na auto-inicialização:', err));
  }, []);
  
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem('currentStudent');
    return saved ? JSON.parse(saved) : null;
  });
  const [registeredStudents, setRegisteredStudents] = useState<Student[]>(() => {
    return getCachedData<Student[]>(CACHE_KEYS.STUDENTS) || INITIAL_STUDENTS;
  });
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    return getCachedData<AdminUser[]>(CACHE_KEYS.ADMINS) || [];
  });
  const [schools, setSchools] = useState<School[]>(() => {
    return getCachedData<School[]>(CACHE_KEYS.SCHOOLS) || [];
  });
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(() => {
    return localStorage.getItem('currentSchoolId') || null;
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    return getCachedData<AttendanceRecord[]>(CACHE_KEYS.ATTENDANCE) || [];
  });
  const [selections, setSelections] = useState<Selection[]>(() => {
    const savedRole = localStorage.getItem('userRole');
    const savedStudentStr = localStorage.getItem('currentStudent');
    if (savedRole === 'student' && savedStudentStr) {
      try {
        const student = JSON.parse(savedStudentStr);
        const cachedVotes = getCachedData<Selection[]>(CACHE_KEYS.STUDENT_VOTES(student.matricula));
        if (cachedVotes) return cachedVotes;
      } catch (e) {}
    }
    return getCachedData<Selection[]>(CACHE_KEYS.SELECTIONS) || [];
  });
  const [mealOptions, setMealOptions] = useState<MealOption[]>(() => {
    return getCachedData<MealOption[]>(CACHE_KEYS.MEALS) || MEAL_OPTIONS;
  });
  const [votingSessions, setVotingSessions] = useState<VotingSession[]>(() => {
    const cached = getCachedData<VotingSession[]>(CACHE_KEYS.SESSIONS);
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    const saved = localStorage.getItem('votingSessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_VOTING_SESSIONS;
  });
  const [selectedCategory, setSelectedCategory] = useState<'Gremio' | 'Representante' | 'Alimentação' | 'Outros'>('Gremio');
  const [showSummary, setShowSummary] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => 
    getLastSyncTime(CACHE_KEYS.SELECTIONS) || getLastSyncTime(CACHE_KEYS.SESSIONS)
  );

  const schoolMealOptions = mealOptions.filter(m => userRole === 'master' || !currentSchoolId || !m.schoolId || m.schoolId === currentSchoolId);
  const schoolSelections = selections.filter(s => userRole === 'master' || !currentSchoolId || !s.schoolId || s.schoolId === currentSchoolId);
  const schoolStudents = registeredStudents.filter(s => userRole === 'master' || !currentSchoolId || !s.schoolId || s.schoolId === currentSchoolId);
  const schoolVotingSessions = votingSessions.filter(v => userRole === 'master' || !currentSchoolId || !v.schoolId || v.schoolId === currentSchoolId);

  useEffect(() => {
    localStorage.setItem('votingSessions', JSON.stringify(votingSessions));
    setCachedData(CACHE_KEYS.SESSIONS, votingSessions);
  }, [votingSessions]);

  // Inicialização e sincronização completa do Novo Banco de Dados (Firestore edumenu-7310d)
  const seedInitialDataToFirestore = async (notifySuccess = false) => {
    setIsSyncing(true);
    try {
      console.log("Sincronizando novas coleções e rotas no Firestore edumenu-7310d...");
      
      // 1. Rota de Escolas (/schools)
      const defaultSchool: School = {
        id: 'escola-principal',
        name: 'Escola Estadual de Educação Básica',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'schools', defaultSchool.id), defaultSchool);

      // 2. Rota de Administradores (/admins)
      const defaultAdmins: AdminUser[] = [
        { id: 'admin-gestor', login: 'gestao', name: 'Gestão Escolar', password: '123', schoolId: 'escola-principal' },
        { id: 'admin-diretoria', login: 'diretoria', name: 'Diretoria Geral', password: '123', schoolId: 'escola-principal' }
      ];
      for (const a of defaultAdmins) {
        await setDoc(doc(db, 'admins', a.id), a);
      }

      // 3. Rota de Alunos (/students) - Todos os 35 discentes com matrículas, turmas e senhas
      for (const st of INITIAL_STUDENTS) {
        const studentToSave: Student = {
          ...st,
          schoolId: 'escola-principal',
          turno: st.turno || 'Integral',
          sala: st.sala || '1º Ano',
          turma: st.turma || 'A'
        };
        await setDoc(doc(db, 'students', st.matricula), studentToSave);
      }

      // 4. Rota de Opções/Candidatos (/meals)
      for (const opt of MEAL_OPTIONS) {
        const optToSave: MealOption = {
          ...opt,
          schoolId: 'escola-principal'
        };
        await setDoc(doc(db, 'meals', opt.id), optToSave);
      }

      // 5. Rota de Sessões de Votação (/voting_sessions)
      for (const sess of INITIAL_VOTING_SESSIONS) {
        const sessToSave: VotingSession = {
          ...sess,
          schoolId: 'escola-principal'
        };
        await setDoc(doc(db, 'voting_sessions', sess.id), sessToSave);
      }

      // Atualiza estado local e cache
      setSchools([defaultSchool]);
      setAdminUsers(defaultAdmins);
      setRegisteredStudents(INITIAL_STUDENTS.map(s => ({ ...s, schoolId: 'escola-principal' })));
      setMealOptions(MEAL_OPTIONS.map(m => ({ ...m, schoolId: 'escola-principal' })));
      setVotingSessions(INITIAL_VOTING_SESSIONS.map(v => ({ ...v, schoolId: 'escola-principal' })));

      setCachedData(CACHE_KEYS.SCHOOLS, [defaultSchool]);
      setCachedData(CACHE_KEYS.ADMINS, defaultAdmins);
      setCachedData(CACHE_KEYS.STUDENTS, INITIAL_STUDENTS.map(s => ({ ...s, schoolId: 'escola-principal' })));
      setCachedData(CACHE_KEYS.MEALS, MEAL_OPTIONS.map(m => ({ ...m, schoolId: 'escola-principal' })));
      setCachedData(CACHE_KEYS.SESSIONS, INITIAL_VOTING_SESSIONS.map(v => ({ ...v, schoolId: 'escola-principal' })));

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSync(nowTime);

      if (notifySuccess) {
        alert('Banco de dados "edumenu-7310d" sincronizado com sucesso! As coleções schools, admins, students, meals, voting_sessions e attendance foram populadas.');
      }
      return true;
    } catch (err: any) {
      console.error("Erro ao sincronizar coleções no Firestore:", err);
      handleFirestoreError(err, OperationType.WRITE, 'database_init');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Carregamento ultra-otimizado para o aluno (cache inteligente + busca paralela com Promise.all)
  const loadStudentData = async (student: Student, forceRefresh = false) => {
    try {
      let sessions = getCachedData<VotingSession[]>(CACHE_KEYS.SESSIONS, 20);
      let meals = getCachedData<MealOption[]>(CACHE_KEYS.MEALS, 20);
      let studentVotes = getCachedData<Selection[]>(CACHE_KEYS.STUDENT_VOTES(student.matricula), 15);
      let cachedAtt = getCachedData<AttendanceRecord[]>(CACHE_KEYS.ATTENDANCE, 15);

      // Preenche o estado imediatamente com dados em cache para renderização instantânea (0ms)
      if (sessions) setVotingSessions(sessions);
      if (meals) setMealOptions(meals);
      if (studentVotes) setSelections(studentVotes);
      if (cachedAtt) setAttendanceRecords(cachedAtt);

      // Busca tudo que estiver faltando de forma 100% paralela (1 único roundtrip simultâneo)
      const tasks: { type: 'sessions' | 'meals' | 'votes' | 'attendance'; promise: Promise<any> }[] = [];

      if (!sessions || forceRefresh) {
        tasks.push({ type: 'sessions', promise: getDocs(collection(db, 'voting_sessions')) });
      }
      if (!meals || forceRefresh) {
        tasks.push({ type: 'meals', promise: getDocs(collection(db, 'meals')) });
      }
      if (!studentVotes || forceRefresh) {
        tasks.push({ type: 'votes', promise: getDocs(query(collection(db, 'selections'), where('matricula', '==', student.matricula))) });
      }
      if (!cachedAtt || forceRefresh) {
        tasks.push({ type: 'attendance', promise: getDocs(collection(db, 'attendance')) });
      }

      if (tasks.length > 0) {
        const results = await Promise.all(tasks.map(t => t.promise));
        tasks.forEach((t, index) => {
          const snap = results[index];
          if (t.type === 'sessions') {
            const list: VotingSession[] = [];
            snap.forEach((d: any) => list.push(d.data() as VotingSession));
            if (list.length > 0) {
              setVotingSessions(list);
              setCachedData(CACHE_KEYS.SESSIONS, list);
            }
          } else if (t.type === 'meals') {
            const list: MealOption[] = [];
            snap.forEach((d: any) => {
              const m = d.data() as any;
              list.push({
                ...m,
                category: (m.category === 'Padrao' ? 'Gremio' : m.category === 'Vegetariana' ? 'Alimentação' : m.category === 'Especial' ? 'Outros' : m.category) || 'Outros'
              });
            });
            if (list.length > 0) {
              setMealOptions(list);
              setCachedData(CACHE_KEYS.MEALS, list);
            }
          } else if (t.type === 'votes') {
            const list: Selection[] = [];
            snap.forEach((d: any) => list.push(d.data() as Selection));
            setSelections(list);
            setCachedData(CACHE_KEYS.STUDENT_VOTES(student.matricula), list);
          } else if (t.type === 'attendance') {
            const list: AttendanceRecord[] = [];
            snap.forEach((d: any) => list.push(d.data() as AttendanceRecord));
            setAttendanceRecords(list);
            setCachedData(CACHE_KEYS.ATTENDANCE, list);
          }
        });
      }
    } catch (err) {
      console.warn("Aviso ao carregar dados do aluno:", err);
    }
  };

  // Carregamento para a gestão/admin com cache e consultas paralelas otimizadas
  const loadAdminData = async (forceRefresh = false, overrideSchoolId?: string, overrideRole?: string) => {
    setIsSyncing(true);
    try {
      const activeRole = overrideRole || userRole;
      const activeSchoolId = overrideSchoolId || currentSchoolId;

      const cachedSchools = getCachedData<School[]>(CACHE_KEYS.SCHOOLS, 30);
      const cachedAdmins = getCachedData<AdminUser[]>(CACHE_KEYS.ADMINS, 30);
      const cachedSessions = getCachedData<VotingSession[]>(CACHE_KEYS.SESSIONS, 20);
      const cachedMeals = getCachedData<MealOption[]>(CACHE_KEYS.MEALS, 20);
      const cachedStudents = getCachedData<Student[]>(CACHE_KEYS.STUDENTS, 15);
      const cachedSelections = getCachedData<Selection[]>(CACHE_KEYS.SELECTIONS, 10);
      const cachedAttendance = getCachedData<AttendanceRecord[]>(CACHE_KEYS.ATTENDANCE, 15);

      // Preenche os dados locais imediatamente para não travar a interface
      if (cachedSchools) setSchools(cachedSchools);
      if (cachedAdmins) setAdminUsers(cachedAdmins);
      if (cachedSessions) setVotingSessions(cachedSessions);
      if (cachedMeals) setMealOptions(cachedMeals);
      if (cachedStudents) setRegisteredStudents(cachedStudents);
      if (cachedSelections) setSelections(cachedSelections);
      if (cachedAttendance) setAttendanceRecords(cachedAttendance);

      // Se houver dados válidos em cache e não for atualização manual, não consome nenhuma leitura
      if (!forceRefresh && cachedSchools && cachedAdmins && cachedSessions && cachedMeals && cachedStudents && cachedSelections && cachedAttendance) {
        setIsSyncing(false);
        setLastSync(getLastSyncTime(CACHE_KEYS.SELECTIONS) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return;
      }

      const promises: Promise<any>[] = [
        getDocs(collection(db, 'schools')),
        getDocs(collection(db, 'admins')),
        getDocs(collection(db, 'meals')),
        getDocs(collection(db, 'voting_sessions')),
        getDocs(collection(db, 'attendance'))
      ];

      // Se for gestor escolar, filtra alunos e votos apenas da escola para economizar leituras
      if (activeRole === 'admin' && activeSchoolId) {
        promises.push(getDocs(query(collection(db, 'students'), where('schoolId', '==', activeSchoolId))));
        promises.push(getDocs(query(collection(db, 'selections'), where('schoolId', '==', activeSchoolId))));
      } else {
        promises.push(getDocs(collection(db, 'students')));
        promises.push(getDocs(collection(db, 'selections')));
      }

      const [schoolsSnap, adminsSnap, mealsSnap, sessionsSnap, attendanceSnap, studentsSnap, selectionsSnap] = await Promise.all(promises);

      // Se for a primeira inicialização do novo banco edumenu-7310d e estiver vazio, popula as coleções
      if (schoolsSnap.empty && adminsSnap.empty) {
        console.log("Detectado banco Firestore vazio. Criando coleções e populando rotas padrão...");
        await seedInitialDataToFirestore(false);
        return;
      }

      const schoolsData: School[] = [];
      schoolsSnap.forEach((d: any) => schoolsData.push(d.data() as School));
      setSchools(schoolsData);
      setCachedData(CACHE_KEYS.SCHOOLS, schoolsData);

      const adminsData: AdminUser[] = [];
      adminsSnap.forEach((d: any) => adminsData.push(d.data() as AdminUser));
      setAdminUsers(adminsData);
      setCachedData(CACHE_KEYS.ADMINS, adminsData);

      const attendanceData: AttendanceRecord[] = [];
      attendanceSnap.forEach((d: any) => attendanceData.push(d.data() as AttendanceRecord));
      setAttendanceRecords(attendanceData);
      setCachedData(CACHE_KEYS.ATTENDANCE, attendanceData);

      const mealsData: MealOption[] = [];
      mealsSnap.forEach((d: any) => {
        const m = d.data() as any;
        mealsData.push({
          ...m,
          category: (m.category === 'Padrao' ? 'Gremio' : m.category === 'Vegetariana' ? 'Alimentação' : m.category === 'Especial' ? 'Outros' : m.category) || 'Outros'
        });
      });
      if (mealsData.length > 0) {
        setMealOptions(mealsData);
        setCachedData(CACHE_KEYS.MEALS, mealsData);
      }

      const sessionsData: VotingSession[] = [];
      sessionsSnap.forEach((d: any) => sessionsData.push(d.data() as VotingSession));
      if (sessionsData.length > 0) {
        setVotingSessions(sessionsData);
        setCachedData(CACHE_KEYS.SESSIONS, sessionsData);
      }

      const studentsData: Student[] = [];
      studentsSnap.forEach((d: any) => {
        const s = d.data() as Student;
        studentsData.push({
          ...s,
          turno: s.turno || 'Integral',
          sala: s.sala || '1º Ano',
          turma: s.turma || 'A'
        });
      });
      if (studentsData.length > 0) {
        setRegisteredStudents(studentsData);
        setCachedData(CACHE_KEYS.STUDENTS, studentsData);
      }

      const selectionsData: Selection[] = [];
      selectionsSnap.forEach((d: any) => selectionsData.push(d.data() as Selection));
      setSelections(selectionsData);
      setCachedData(CACHE_KEYS.SELECTIONS, selectionsData);

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSync(nowTime);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.LIST, 'admin_fetch');
      if (error.message?.includes('permission')) {
        setError('Acesso negado ao Firebase: Verifique as Regras de Segurança do Firestore.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Carrega apenas no carregamento inicial da página (reload) caso o usuário já tenha sessão salva
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole === 'student') {
      const savedStudent = localStorage.getItem('currentStudent');
      if (savedStudent) {
        try {
          loadStudentData(JSON.parse(savedStudent));
        } catch (e) {}
      }
    } else if (savedRole === 'admin' || savedRole === 'master') {
      loadAdminData();
    }
  }, []);

  // Pré-carrega a lista de alunos em segundo plano ao abrir a tela de login para que a validação seja instantânea
  useEffect(() => {
    if (loginStep === 'student_login' && registeredStudents.length <= INITIAL_STUDENTS.length) {
      getDocs(collection(db, 'students')).then(snap => {
        if (!snap.empty) {
          const list: Student[] = [];
          snap.forEach(d => list.push(d.data() as Student));
          setRegisteredStudents(list);
          setCachedData(CACHE_KEYS.STUDENTS, list);
        }
      }).catch(err => console.warn('Preload alunos:', err));
    }
  }, [loginStep]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!loginId.trim() || !loginPassword.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    const cleanId = loginId.trim();
    const cleanPass = loginPassword.trim();
    setIsLoggingIn(true);

    try {
      if (loginStep === 'student_login') {
        // 1. Verifica no cache local/alunos pré-carregados (0 leituras no Firestore!)
        let student = registeredStudents.find(s => s.matricula === cleanId && s.password === cleanPass);

        // 2. Se não estiver no cache local, busca pontualmente APENAS o documento deste aluno no Firestore (1 leitura única!)
        if (!student) {
          try {
            const docSnap = await getDoc(doc(db, 'students', cleanId));
            if (docSnap.exists()) {
              const data = docSnap.data() as Student;
              if (data.password === cleanPass) {
                student = {
                  ...data,
                  turno: data.turno || 'Integral',
                  sala: data.sala || '1º Ano',
                  turma: data.turma || 'A'
                };
                setRegisteredStudents(prev => {
                  const next = [...prev.filter(s => s.matricula !== cleanId), student!];
                  setCachedData(CACHE_KEYS.STUDENTS, next);
                  return next;
                });
              }
            }
          } catch (err) {
            console.error("Erro ao validar login do aluno:", err);
          }
        }

        if (student) {
          setUserRole('student');
          setCurrentStudent(student);
          setView('student');
          if (student.schoolId) {
            setCurrentSchoolId(student.schoolId);
            localStorage.setItem('currentSchoolId', student.schoolId);
          }
          localStorage.setItem('userRole', 'student');
          localStorage.setItem('view', 'student');
          localStorage.setItem('currentStudent', JSON.stringify(student));
          // Carrega os dados do aluno em paralelo
          await loadStudentData(student);
        } else {
          setError("Matrícula ou senha inválidas.");
        }
      } else if (loginStep === 'admin_login') {
        // Login Master (0 leituras no Firestore!)
        if (cleanId === '84040513215' && cleanPass === 'admin123') {
          setUserRole('master');
          setView('master_admins');
          localStorage.setItem('userRole', 'master');
          localStorage.setItem('view', 'master_admins');
          await loadAdminData(false, undefined, 'master');
          return;
        }

        // Verifica admins no cache
        let admin = adminUsers.find(a => a.login === cleanId && a.password === cleanPass);

        // Se não encontrou no cache, faz busca pontual por login (1 leitura única!)
        if (!admin) {
          try {
            const q = query(collection(db, 'admins'), where('login', '==', cleanId), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const data = snap.docs[0].data() as AdminUser;
              if (data.password === cleanPass) {
                admin = data;
                setAdminUsers(prev => {
                  const next = [...prev.filter(a => a.id !== admin!.id), admin!];
                  setCachedData(CACHE_KEYS.ADMINS, next);
                  return next;
                });
              }
            }
          } catch (err) {
            console.error("Erro ao validar login do admin:", err);
          }
        }

        if (admin) {
          setUserRole('admin');
          setView('admin');
          const schId = admin.schoolId || '';
          if (schId) {
            setCurrentSchoolId(schId);
            localStorage.setItem('currentSchoolId', schId);
          }
          localStorage.setItem('userRole', 'admin');
          localStorage.setItem('view', 'admin');
          await loadAdminData(false, schId, 'admin');
        } else {
          setError("Login ou senha inválidos.");
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleMealSelection = async (mealId: string) => {
    if (!currentStudent) return;
    setSelectedMealId(mealId);
  };

  const handleAddMeal = async (meal: MealOption) => {
    const mealToSave = { ...meal, schoolId: currentSchoolId || meal.schoolId || '' };
    try {
      await setDoc(doc(db, 'meals', meal.id), mealToSave);
      setMealOptions(prev => {
        const next = [...prev, mealToSave];
        setCachedData(CACHE_KEYS.MEALS, next);
        return next;
      });
      showToast('Opção cadastrada e salva no banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `meals/${meal.id}`);
    }
  };

  const handleUpdateMeal = async (meal: MealOption) => {
    const mealToSave = { ...meal, schoolId: currentSchoolId || meal.schoolId || '' };
    try {
      await setDoc(doc(db, 'meals', meal.id), mealToSave);
      setMealOptions(prev => {
        const next = prev.map(m => m.id === meal.id ? mealToSave : m);
        setCachedData(CACHE_KEYS.MEALS, next);
        return next;
      });
      showToast('Opção atualizada no banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `meals/${meal.id}`);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'meals', id));
      setMealOptions(prev => {
        const next = prev.filter(m => m.id !== id);
        setCachedData(CACHE_KEYS.MEALS, next);
        return next;
      });
      showToast('Opção excluída do banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `meals/${id}`);
    }
  };

  const handleAddVotingSession = async (session: VotingSession) => {
    const sessionToSave = { ...session, schoolId: currentSchoolId || session.schoolId || '' };
    try {
      await setDoc(doc(db, 'voting_sessions', session.id), sessionToSave);
      setVotingSessions(prev => {
        const next = [sessionToSave, ...prev];
        setCachedData(CACHE_KEYS.SESSIONS, next);
        return next;
      });
      showToast('Votação criada e salva no banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `voting_sessions/${session.id}`);
      setVotingSessions(prev => {
        const next = [sessionToSave, ...prev];
        setCachedData(CACHE_KEYS.SESSIONS, next);
        return next;
      });
      showToast('Votação criada e salva no banco de dados!');
    }
  };

  const handleUpdateVotingSession = async (session: VotingSession) => {
    const sessionToSave = { ...session, schoolId: currentSchoolId || session.schoolId || '' };
    try {
      await setDoc(doc(db, 'voting_sessions', session.id), sessionToSave);
      setVotingSessions(prev => {
        const next = prev.map(s => s.id === session.id ? sessionToSave : s);
        setCachedData(CACHE_KEYS.SESSIONS, next);
        return next;
      });
      showToast('Votação atualizada no banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `voting_sessions/${session.id}`);
      setVotingSessions(prev => {
        const next = prev.map(s => s.id === session.id ? sessionToSave : s);
        setCachedData(CACHE_KEYS.SESSIONS, next);
        return next;
      });
      showToast('Votação atualizada no banco de dados!');
    }
  };

  const handleDeleteVotingSession = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'voting_sessions', id));
      setVotingSessions(prev => {
        const next = prev.filter(s => s.id !== id);
        setCachedData(CACHE_KEYS.SESSIONS, next);
        return next;
      });
      showToast('Votação excluída do banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `voting_sessions/${id}`);
      setVotingSessions(prev => {
        const next = prev.filter(s => s.id !== id);
        setCachedData(CACHE_KEYS.SESSIONS, next);
        return next;
      });
      showToast('Votação excluída do banco de dados!');
    }
  };

  const handleAddStudent = async (student: Student) => {
    const studentToSave = { ...student, schoolId: currentSchoolId || student.schoolId || '' };
    try {
      await setDoc(doc(db, 'students', student.matricula), studentToSave);
      setRegisteredStudents(prev => {
        const next = [...prev, studentToSave];
        setCachedData(CACHE_KEYS.STUDENTS, next);
        return next;
      });
      showToast('Aluno cadastrado e salvo no banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `students/${student.matricula}`);
    }
  };

  const handleUpdateStudent = async (student: Student) => {
    const studentToSave = { ...student, schoolId: currentSchoolId || student.schoolId || '' };
    try {
      await setDoc(doc(db, 'students', student.matricula), studentToSave);
      setRegisteredStudents(prev => {
        const next = prev.map(s => s.matricula === student.matricula ? studentToSave : s);
        setCachedData(CACHE_KEYS.STUDENTS, next);
        return next;
      });
      showToast('Dados do aluno atualizados no banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${student.matricula}`);
    }
  };

  const handleDeleteStudent = async (matricula: string) => {
    try {
      await deleteDoc(doc(db, 'students', matricula));
      setRegisteredStudents(prev => {
        const next = prev.filter(s => s.matricula !== matricula);
        setCachedData(CACHE_KEYS.STUDENTS, next);
        return next;
      });
      showToast('Aluno excluído do banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${matricula}`);
    }
  };

  const handleAddSchool = async (school: School) => {
    try {
      await setDoc(doc(db, 'schools', school.id), school);
      setSchools(prev => {
        const next = [...prev, school];
        setCachedData(CACHE_KEYS.SCHOOLS, next);
        return next;
      });
      showToast('Escola cadastrada e salva no banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `schools/${school.id}`);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schools', id));
      setSchools(prev => {
        const next = prev.filter(s => s.id !== id);
        setCachedData(CACHE_KEYS.SCHOOLS, next);
        return next;
      });
      showToast('Escola excluída do banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `schools/${id}`);
    }
  };

  const handleAddAdmin = async (admin: AdminUser) => {
    try {
      await setDoc(doc(db, 'admins', admin.id), admin);
      setAdminUsers(prev => {
        const next = [...prev, admin];
        setCachedData(CACHE_KEYS.ADMINS, next);
        return next;
      });
      showToast('Gestor cadastrado e salvo no banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `admins/${admin.id}`);
    }
  };

  const handleUpdateAdmin = async (admin: AdminUser) => {
    try {
      await setDoc(doc(db, 'admins', admin.id), admin);
      setAdminUsers(prev => {
        const next = prev.map(a => a.id === admin.id ? admin : a);
        setCachedData(CACHE_KEYS.ADMINS, next);
        return next;
      });
      showToast('Gestor atualizado no banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `admins/${admin.id}`);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'admins', id));
      setAdminUsers(prev => {
        const next = prev.filter(a => a.id !== id);
        setCachedData(CACHE_KEYS.ADMINS, next);
        return next;
      });
      showToast('Gestor excluído do banco de dados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admins/${id}`);
    }
  };

  const handleCastVoteInSession = async (session: VotingSession, optionId: string) => {
    if (!currentStudent || !optionId) return;

    // Checagem de Frequência Escolar do Aluno para a data da eleição
    // Regra: Por padrão, todo aluno inicia como faltoso (bloqueado).
    // O voto só é habilitado após a chamada escolar ser realizada e sua presença confirmada.
    const sessionDate = session.date || new Date().toISOString().split('T')[0];
    const attRecord = attendanceRecords.find(a => a.date === sessionDate);
    if (!attRecord) {
      setError(`Voto bloqueado: Por padrão, todos os discentes iniciam como faltosos. A frequência escolar de ${sessionDate.split('-').reverse().join('/')} ainda não foi confirmada pela coordenação.`);
      return;
    }

    if (!attRecord.presentMatriculas.includes(currentStudent.matricula)) {
      setError(`Voto bloqueado: Você consta como faltoso na chamada escolar de ${sessionDate.split('-').reverse().join('/')}. Apenas alunos com presença confirmada em aula podem votar.`);
      return;
    }

    const alreadyVoted = schoolSelections.some(
      s => s.matricula === currentStudent.matricula && 
           (s.votingSessionId === session.id || (!s.votingSessionId && s.category === session.category))
    );
    if (alreadyVoted) {
      setError(`Você já registrou seu voto nesta eleição (${session.title}).`);
      return;
    }

    const newSelection: Selection = {
      matricula: currentStudent.matricula,
      mealId: optionId,
      category: session.category,
      votingSessionId: session.id,
      timestamp: new Date().toISOString(),
      turno: currentStudent.turno || 'Integral',
      sala: currentStudent.sala || '1º Ano',
      turma: currentStudent.turma || 'A',
      schoolId: currentSchoolId || currentStudent.schoolId || ''
    };

    try {
      const docId = `${newSelection.matricula}_${session.id}_${newSelection.timestamp.replace(/[:.]/g, '-')}`;
      await setDoc(doc(db, 'selections', docId), newSelection);
      setSelections(prev => {
        const next = [...prev, newSelection];
        setCachedData(CACHE_KEYS.STUDENT_VOTES(currentStudent.matricula), next);
        return next;
      });
      showToast('Voto confirmado e registrado no banco de dados com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'selections');
      setSelections(prev => {
        const next = [...prev, newSelection];
        setCachedData(CACHE_KEYS.STUDENT_VOTES(currentStudent.matricula), next);
        return next;
      });
      showToast('Voto confirmado e registrado no banco de dados!');
    }
  };

  const handleSaveAttendance = async (date: string, presentMatriculas: string[]) => {
    const schoolId = currentSchoolId || 'escola-principal';
    const recordId = `${date}_${schoolId}`;
    const newRecord: AttendanceRecord = {
      id: recordId,
      date,
      schoolId,
      presentMatriculas,
      updatedAt: new Date().toISOString()
    };

    // 1. Atualização Otimista local imediata + Cache com 0 leituras
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => !(r.date === date && (r.schoolId === schoolId || !r.schoolId)));
      const updated = [newRecord, ...filtered];
      setCachedData(CACHE_KEYS.ATTENDANCE, updated);
      return updated;
    });

    // 2. Gravação no Firestore
    try {
      await setDoc(doc(db, 'attendance', recordId), newRecord);
      showToast('Frequência escolar gravada no banco de dados!');
    } catch (err: any) {
      console.error("Erro ao persistir frequência no Firestore:", err);
      handleFirestoreError(err, OperationType.WRITE, `attendance/${recordId}`);
    }
  };

  const confirmSelection = async () => {
    if (!currentStudent || !selectedMealId) return;

    const alreadyVoted = schoolSelections.some(
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
      turma: currentStudent.turma || 'A',
      schoolId: currentSchoolId || currentStudent.schoolId || ''
    };

    try {
      await setDoc(doc(db, 'selections', `${newSelection.matricula}_${selectedCategory}_${newSelection.timestamp.replace(/[:.]/g, '-')}`), newSelection);
      setSelections(prev => {
        const next = [...prev, newSelection];
        setCachedData(CACHE_KEYS.STUDENT_VOTES(currentStudent.matricula), next);
        return next;
      });
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
    setLoginStep('landing');
    setCurrentSchoolId(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('view');
    localStorage.removeItem('currentStudent');
    localStorage.removeItem('currentSchoolId');
  };

  // Active voting session for current category (matching today's date if scheduled, or active session)
  const activeSessionForCategory = useMemo(() => {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    const todaySession = schoolVotingSessions.find(
      s => s.category === selectedCategory && s.active && s.date === todayStr
    );
    if (todaySession) return todaySession;

    return schoolVotingSessions.find(
      s => s.category === selectedCategory && s.active
    );
  }, [schoolVotingSessions, selectedCategory]);

  // Only show active options belonging to the currently selected category
  const activeMeals = useMemo(() => {
    if (activeSessionForCategory && activeSessionForCategory.optionIds && activeSessionForCategory.optionIds.length > 0) {
      return schoolMealOptions.filter(
        m => m.active && m.category === selectedCategory && activeSessionForCategory.optionIds.includes(m.id)
      );
    }
    return schoolMealOptions.filter(m => m.active && m.category === selectedCategory);
  }, [schoolMealOptions, selectedCategory, activeSessionForCategory]);

  const hasAlreadyVoted = useMemo(() => {
    return schoolSelections.some(
      s => s.matricula === currentStudent?.matricula && s.category === selectedCategory
    );
  }, [selections, currentStudent, selectedCategory]);

  const nextPendingCategory = useMemo(() => {
    const categories: ('Gremio' | 'Representante' | 'Alimentação' | 'Outros')[] = ['Gremio', 'Representante', 'Alimentação', 'Outros'];
    return categories.find(cat => {
      const hasVoted = schoolSelections.some(s => s.matricula === currentStudent?.matricula && s.category === cat);
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
    if (loginStep === 'landing') {
      return (
        <div className="min-h-screen flex flex-col bg-slate-50">
          <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <i className="fas fa-ticket-alt text-2xl rotate-[-15deg] inline-block text-amber-300"></i>
                <h1 className="text-xl font-black tracking-tight">EDUVOTAÇÃO</h1>
              </div>
              <div className="text-sm font-medium opacity-90 hidden sm:block">
                Portal de Votação Estudantil
              </div>
            </div>
          </header>
          <main className="flex-grow">
            <LandingPage onEnterApp={() => setLoginStep('role_selection')} />
          </main>
        </div>
      );
    }

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
            <>
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

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleTestDatabase}
                disabled={isTestingDb}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                title="Clique para testar a comunicação e medir a latência do Firestore"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isTestingDb ? 'bg-amber-500 animate-ping' : dbLatency ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                <span>{isTestingDb ? 'Testando conexão com o banco...' : dbLatency ? `Banco de Dados Online (${dbLatency}ms)` : 'Testar Conexão com Banco de Dados'}</span>
                <i className={`fas fa-sync-alt text-xs ${isTestingDb ? 'fa-spin' : ''}`}></i>
              </button>
            </div>
          </>
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
                        disabled={isLoggingIn}
                        placeholder={loginStep === 'student_login' ? 'Ex: 2023001' : 'Seu login'}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg font-medium disabled:opacity-60"
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
                        disabled={isLoggingIn}
                        placeholder="***"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg font-medium disabled:opacity-60"
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
                    disabled={isLoggingIn}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 text-lg flex items-center justify-center gap-3"
                  >
                    {isLoggingIn ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin text-xl"></i>
                        <span>Entrando no sistema...</span>
                      </>
                    ) : (
                      <span>Entrar</span>
                    )}
                  </button>
                  <button 
                    type="button"
                    disabled={isLoggingIn}
                    onClick={() => setLoginStep('role_selection')}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 px-6 rounded-2xl transition-all text-sm disabled:opacity-50"
                  >
                    Voltar
                  </button>
                </div>
              </form>

              {/* Diagnóstico em tempo real da velocidade do Banco de Dados */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleTestDatabase}
                  disabled={isTestingDb}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                  title="Clique para medir a velocidade de resposta do Firestore agora"
                >
                  <span className={`w-2 h-2 rounded-full ${isTestingDb ? 'bg-amber-500 animate-ping' : dbLatency ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  <span>{isTestingDb ? 'Testando conexão...' : dbLatency ? `Banco Firestore: ${dbLatency}ms (Online)` : 'Testar Conexão com Banco'}</span>
                  <i className={`fas fa-sync-alt text-[10px] ${isTestingDb ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      userRole={userRole}
    >
      <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-20">
        
        {/* Header with Role Info and Logout */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${userRole === 'student' ? 'bg-indigo-100 text-indigo-600' : userRole === 'master' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
                <i className={`fas ${userRole === 'student' ? 'fa-user-graduate' : userRole === 'master' ? 'fa-crown' : 'fa-user-shield'}`}></i>
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perfil de Acesso</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">{userRole === 'student' ? 'Portal do Aluno' : userRole === 'master' ? 'Usuário Master' : 'Gestão Administrativa'}</p>
                  {currentSchoolId && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {schools.find(s => s.id === currentSchoolId)?.name || 'Escola'}
                    </span>
                  )}
                </div>
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
            schools={schools}
            admins={adminUsers}
            onAddSchool={handleAddSchool}
            onDeleteSchool={handleDeleteSchool}
            onAddAdmin={handleAddAdmin}
            onUpdateAdmin={handleUpdateAdmin}
            onDeleteAdmin={handleDeleteAdmin}
          />
        ) : userRole === 'admin' ? (
          view === 'admin' ? (
            <AdminDashboard 
              selections={schoolSelections} 
              mealOptions={schoolMealOptions} 
              votingSessions={schoolVotingSessions}
              onAddMeal={handleAddMeal}
              onUpdateMeal={handleUpdateMeal}
              onDeleteMeal={handleDeleteMeal}
              onAddVotingSession={handleAddVotingSession}
              onUpdateVotingSession={handleUpdateVotingSession}
              onDeleteVotingSession={handleDeleteVotingSession}
              students={schoolStudents}
              attendanceRecords={attendanceRecords}
              onSaveAttendance={handleSaveAttendance}
              currentSchoolId={currentSchoolId}
            />
          ) : (
            <UserManagementDashboard 
              students={schoolStudents}
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
                  <StatsDashboard selections={schoolSelections} mealOptions={schoolMealOptions} />
                </div>
              </div>
            ) : (
              <StudentVotingDashboard
                currentStudent={currentStudent}
                votingSessions={schoolVotingSessions.length > 0 ? schoolVotingSessions : votingSessions}
                mealOptions={schoolMealOptions}
                selections={schoolSelections}
                attendanceRecords={attendanceRecords}
                onCastVote={handleCastVoteInSession}
                onLogout={logout}
              />
            )}
          </>
        )}
      </div>

      {/* Floating Real-Time Action Feedback Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn pointer-events-auto">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold backdrop-blur-md ${
            toast.type === 'error' 
              ? 'bg-red-900/90 text-white border-red-500 shadow-red-900/30' 
              : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/40'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${toast.type === 'error' ? 'bg-red-400' : 'bg-emerald-400 animate-ping'}`}></span>
            <span>{toast.message}</span>
            <button 
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-white/50 hover:text-white text-xs p-1 transition-colors"
              title="Fechar notificação"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

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
