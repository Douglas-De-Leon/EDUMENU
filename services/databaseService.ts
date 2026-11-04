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
    if (names.length === 0) {
      // Deixa cadastrada a categoria ALIMENTAÇÃO por padrão
      return ['ALIMENTAÇÃO'];
    }
    // Garante que ALIMENTAÇÃO esteja na lista
    if (!names.some(n => n.toUpperCase().includes('ALIMENTA'))) {
      names.unshift('ALIMENTAÇÃO');
    }
    return names;
  } catch (e) {
    console.warn('Erro ao carregar categorias do Firestore:', e);
    return ['ALIMENTAÇÃO'];
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
 * Verificação de integridade sem inserção de dados de demonstração ou PII.
 * O sistema opera exclusivamente com dados cadastrados pelos usuários legítimos.
 */
export async function dbAutoInitIfEmpty(): Promise<boolean> {
  return false;
}

/**
 * Atualiza o banco de dados Firestore com a nova atualização da Categoria ALIMENTAÇÃO:
 * - Registra a categoria oficial 'ALIMENTAÇÃO'
 * - Cadastra as 4 opções oficiais de carnes (Vermelha, Branca, Peixe, Fígado) com dados nutricionais
 * - Cadastra a sessão de votação ativa na Categoria Alimentação
 */
export async function dbSyncNutritionUpdate(schoolId?: string | null): Promise<{
  success: boolean;
  mealsCreated: number;
  sessionCreated: boolean;
  timestamp: string;
}> {
  const cleanSchoolId = schoolId || '';
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. Garante que a Categoria ALIMENTAÇÃO está gravada no Firestore
  await setDoc(doc(db, 'categories', 'alimentacao'), {
    id: 'alimentacao',
    name: 'ALIMENTAÇÃO',
    createdAt: now.toISOString()
  });

  // 2. As 4 Cédulas Oficiais de Carnes solicitadas (Vermelha, Branca, Peixe, Fígado)
  const officialMeals: MealOption[] = [
    {
      id: 'alim-carne-vermelha',
      name: 'Carne Vermelha: Iscas de Patinho com Cenoura & Ervas',
      description: 'Carne bovina magra com cenoura e vagem no vapor. Rica em ferro heme e vitamina B12. Sobremesa: Laranja em gomos.',
      category: 'Alimentação',
      calories: '540 kcal',
      active: true,
      mealType: 'Almoço',
      schoolId: cleanSchoolId || undefined
    },
    {
      id: 'alim-carne-branca',
      name: 'Carne Branca: Filé de Frango Grelhado com Milho',
      description: 'Peito de frango selecionado com ervas finas e brócolis ao alho. Proteína magra de alto valor biológico. Sobremesa: Banana Prata.',
      category: 'Alimentação',
      calories: '495 kcal',
      active: true,
      mealType: 'Almoço',
      schoolId: cleanSchoolId || undefined
    },
    {
      id: 'alim-peixe',
      name: 'Peixe: Filé de Tilápia Assada ao Limão & Azeite',
      description: 'Pescado fresco assado com azeite e purê de abóbora cabotiá. Fonte de Ômega-3 e fósforo para concentração. Sobremesa: Maçã.',
      category: 'Alimentação',
      calories: '465 kcal',
      active: true,
      mealType: 'Almoço',
      schoolId: cleanSchoolId || undefined
    },
    {
      id: 'alim-figado',
      name: 'Fígado: Fígado Bovino Acebolado com Cheiro-Verde',
      description: 'Fígado bovino marinado no limão com couve refogada no azeite. 6.8mg de ferro e 500% IDR de Vitamina A. Sobremesa: Laranja em gomos.',
      category: 'Alimentação',
      calories: '515 kcal',
      active: true,
      mealType: 'Almoço',
      schoolId: cleanSchoolId || undefined
    }
  ];

  for (const meal of officialMeals) {
    await setDoc(doc(db, 'meals', meal.id), meal);
  }

  // 3. Cadastra ou atualiza a Sessão de Votação da Merenda na Categoria Alimentação
  const sessionId = `session-alim-nutricao-${todayStr}`;
  const sessionDoc: VotingSession = {
    id: sessionId,
    title: 'Cardápio Escolar: Escolha da Proteína da Merenda',
    description: 'Votação oficial para escolha do cardápio balanceado: Carne Vermelha, Carne Branca, Peixe ou Fígado.',
    category: 'Alimentação',
    date: todayStr,
    closingTime: '11:30',
    optionIds: officialMeals.map(m => m.id),
    active: true,
    schoolId: cleanSchoolId || undefined,
    createdAt: now.toISOString()
  };

  await setDoc(doc(db, 'voting_sessions', sessionId), sessionDoc);

  return {
    success: true,
    mealsCreated: officialMeals.length,
    sessionCreated: true,
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
}
