import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  School, 
  AdminUser, 
  Student, 
  MealOption, 
  VotingSession, 
  AttendanceRecord, 
  Selection 
} from '../types';
import { INITIAL_STUDENTS, MEAL_OPTIONS, INITIAL_VOTING_SESSIONS } from '../constants';

/**
 * Serviço centralizado do banco de dados Firebase Firestore (edumenu-7310d).
 * Garante que qualquer criação, edição, atualização ou exclusão confirmada
 * pelo usuário nos botões de ação seja gravada imediatamente no banco de dados.
 */

// --- ESCOLAS (/schools) ---
export async function dbSaveSchool(school: School): Promise<School> {
  await setDoc(doc(db, 'schools', school.id), school);
  return school;
}

export async function dbDeleteSchool(schoolId: string): Promise<void> {
  await deleteDoc(doc(db, 'schools', schoolId));
}

// --- ADMINISTRADORES E GESTORES (/admins) ---
export async function dbSaveAdmin(admin: AdminUser): Promise<AdminUser> {
  await setDoc(doc(db, 'admins', admin.id), admin);
  return admin;
}

export async function dbDeleteAdmin(adminId: string): Promise<void> {
  await deleteDoc(doc(db, 'admins', adminId));
}

// --- ALUNOS E DISCENTES (/students) ---
export async function dbSaveStudent(student: Student): Promise<Student> {
  await setDoc(doc(db, 'students', student.matricula), student);
  return student;
}

export async function dbDeleteStudent(matricula: string): Promise<void> {
  await deleteDoc(doc(db, 'students', matricula));
}

// --- OPÇÕES E CANDIDATOS (/meals) ---
export async function dbSaveMealOption(option: MealOption): Promise<MealOption> {
  await setDoc(doc(db, 'meals', option.id), option);
  return option;
}

export async function dbDeleteMealOption(optionId: string): Promise<void> {
  await deleteDoc(doc(db, 'meals', optionId));
}

// --- SESSÕES DE VOTAÇÃO (/voting_sessions) ---
export async function dbSaveVotingSession(session: VotingSession): Promise<VotingSession> {
  await setDoc(doc(db, 'voting_sessions', session.id), session);
  return session;
}

export async function dbDeleteVotingSession(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, 'voting_sessions', sessionId));
}

// --- FREQUÊNCIA ESCOLAR (/attendance) ---
export async function dbSaveAttendance(record: AttendanceRecord): Promise<AttendanceRecord> {
  await setDoc(doc(db, 'attendance', record.id), record);
  return record;
}

// --- VOTOS COMPUTADOS (/selections) ---
export async function dbSaveSelection(selection: Selection): Promise<Selection> {
  const docId = `${selection.matricula}_${selection.votingSessionId || selection.category}_${selection.timestamp.replace(/[:.]/g, '-')}`;
  await setDoc(doc(db, 'selections', docId), selection);
  return selection;
}

// --- CATEGORIAS PERSONALIZADAS (/categories) ---
export interface VotingCategory {
  id: string;
  name: string;
  createdAt: string;
}

export async function dbSaveCategory(name: string): Promise<string> {
  const cleanName = name.trim();
  const id = cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  await setDoc(doc(db, 'categories', id), {
    id,
    name: cleanName,
    createdAt: new Date().toISOString()
  });
  return cleanName;
}

export async function dbDeleteCategory(name: string): Promise<void> {
  const id = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  await deleteDoc(doc(db, 'categories', id));
}

export async function dbClearAllCategories(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    const promises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(promises);
  } catch (err) {
    console.warn('Aviso ao limpar categorias do Firestore:', err);
  }
}

export async function dbFetchCategories(): Promise<string[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    const names: string[] = [];
    snap.forEach(d => {
      const data = d.data();
      if (data && data.name) names.push(data.name);
    });
    return names;
  } catch (e) {
    console.warn('Erro ao carregar categorias do Firestore:', e);
    return [];
  }
}

// --- BUSCA GERAL DE TODAS AS INFORMAÇÕES SALVAS NO BANCO ---
export interface AllDatabaseData {
  schools: School[];
  admins: AdminUser[];
  students: Student[];
  meals: MealOption[];
  votingSessions: VotingSession[];
  attendance: AttendanceRecord[];
  selections: Selection[];
}

export async function dbFetchAllData(): Promise<AllDatabaseData> {
  const [
    schoolsSnap,
    adminsSnap,
    studentsSnap,
    mealsSnap,
    sessionsSnap,
    attendanceSnap,
    selectionsSnap
  ] = await Promise.all([
    getDocs(collection(db, 'schools')),
    getDocs(collection(db, 'admins')),
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'meals')),
    getDocs(collection(db, 'voting_sessions')),
    getDocs(collection(db, 'attendance')),
    getDocs(collection(db, 'selections'))
  ]);

  const schools: School[] = [];
  schoolsSnap.forEach(d => schools.push(d.data() as School));

  const admins: AdminUser[] = [];
  adminsSnap.forEach(d => admins.push(d.data() as AdminUser));

  const students: Student[] = [];
  studentsSnap.forEach(d => {
    const s = d.data() as Student;
    students.push({
      ...s,
      turno: s.turno || 'Integral',
      sala: s.sala || '1º Ano',
      turma: s.turma || 'A'
    });
  });

  const meals: MealOption[] = [];
  mealsSnap.forEach(d => {
    const m = d.data() as any;
    meals.push({
      ...m,
      category: (m.category === 'Padrao' ? 'Gremio' : m.category === 'Vegetariana' ? 'Alimentação' : m.category === 'Especial' ? 'Outros' : m.category) || 'Outros'
    });
  });

  const votingSessions: VotingSession[] = [];
  sessionsSnap.forEach(d => votingSessions.push(d.data() as VotingSession));

  const attendance: AttendanceRecord[] = [];
  attendanceSnap.forEach(d => attendance.push(d.data() as AttendanceRecord));

  const selections: Selection[] = [];
  selectionsSnap.forEach(d => selections.push(d.data() as Selection));

  return {
    schools,
    admins,
    students,
    meals,
    votingSessions,
    attendance,
    selections
  };
}

/**
 * Script de inicialização automática em segundo plano:
 * Verifica se o banco de dados está vazio e, caso esteja, popula
 * todas as informações padrão (escolas, admins, alunos, opções e votações)
 * de forma transparente, sem exibir botões ou exigir cliques do usuário.
 */
export async function dbAutoInitIfEmpty(): Promise<boolean> {
  // Evita re-executar consultas de inicialização caso o banco já tenha sido verificado nesta sessão do navegador
  if (typeof window !== 'undefined' && localStorage.getItem('edumenu_db_verified') === 'true') {
    return false;
  }

  try {
    const schoolsSnap = await getDocs(collection(db, 'schools'));
    const adminsSnap = await getDocs(collection(db, 'admins'));

    if (schoolsSnap.empty && adminsSnap.empty) {
      console.log('Detectado banco vazio. Executando script de gravação inicial...');

      // 1. Escola
      const defaultSchool: School = {
        id: 'escola-principal',
        name: 'Escola Estadual de Educação Básica',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'schools', defaultSchool.id), defaultSchool);

      // 2. Admins
      const defaultAdmins: AdminUser[] = [
        { id: 'admin-gestor', login: 'gestao', name: 'Gestão Escolar', password: '123', schoolId: 'escola-principal' },
        { id: 'admin-diretoria', login: 'diretoria', name: 'Diretoria Geral', password: '123', schoolId: 'escola-principal' }
      ];
      for (const a of defaultAdmins) {
        await setDoc(doc(db, 'admins', a.id), a);
      }

      // 3. Alunos
      for (const st of INITIAL_STUDENTS) {
        await setDoc(doc(db, 'students', st.matricula), {
          ...st,
          schoolId: 'escola-principal',
          turno: st.turno || 'Integral',
          sala: st.sala || '1º Ano',
          turma: st.turma || 'A'
        });
      }

      // Mantém as categorias, opções e sessões de votação limpas no banco de dados para criação sob demanda do usuário
      console.log('Banco de dados inicializado com sucesso (escolas, administradores e discentes).');

      console.log('Script de gravação inicial concluído com sucesso.');
      if (typeof window !== 'undefined') {
        localStorage.setItem('edumenu_db_verified', 'true');
      }
      return true;
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('edumenu_db_verified', 'true');
    }
    return false;
  } catch (err) {
    console.warn('Aviso durante verificação automática do banco:', err);
    return false;
  }
}
