import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, MealOption, School, AdminUser, VotingSession, AttendanceRecord } from '../types';
import { INITIAL_STUDENTS, MEAL_OPTIONS, INITIAL_VOTING_SESSIONS } from '../constants';

/**
 * Novo script do sistema para salvar todas as informações no banco de dados Firestore (edumenu-7310d).
 * Salva e sincroniza:
 * 1. Escolas (/schools)
 * 2. Administradores (/admins)
 * 3. Alunos (/students) - 35 discentes com matrículas, turmas e senhas
 * 4. Opções / Candidatos (/meals)
 * 5. Sessões de Votação (/voting_sessions)
 * 6. Frequência Escolar (/attendance)
 */
export async function seedAllToDatabase(notifyInConsole = true) {
  if (notifyInConsole) {
    console.log('====================================================');
    console.log('🚀 Iniciando script de salvamento total no Firebase edumenu-7310d...');
    console.log('====================================================');
  }

  const results = {
    schools: 0,
    admins: 0,
    students: 0,
    meals: 0,
    votingSessions: 0,
    attendance: 0
  };

  try {
    // 1. Escolas (/schools)
    const defaultSchool: School = {
      id: 'escola-principal',
      name: 'Escola Estadual de Educação Básica',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'schools', defaultSchool.id), defaultSchool);
    results.schools++;
    if (notifyInConsole) console.log(`[ESCOLA] ${defaultSchool.name} salva.`);

    // 2. Administradores (/admins)
    const defaultAdmins: AdminUser[] = [
      { id: 'admin-gestor', login: 'gestao', name: 'Gestão Escolar', password: '123', schoolId: 'escola-principal' },
      { id: 'admin-diretoria', login: 'diretoria', name: 'Diretoria Geral', password: '123', schoolId: 'escola-principal' }
    ];
    for (const admin of defaultAdmins) {
      await setDoc(doc(db, 'admins', admin.id), admin);
      results.admins++;
      if (notifyInConsole) console.log(`[ADMIN] ${admin.name} (${admin.login}) salvo.`);
    }

    // 3. Alunos (/students)
    for (const student of INITIAL_STUDENTS) {
      const studentToSave: Student = {
        ...student,
        schoolId: 'escola-principal',
        turno: student.turno || 'Integral',
        sala: student.sala || '1º Ano',
        turma: student.turma || 'A'
      };
      await setDoc(doc(db, 'students', student.matricula), studentToSave);
      results.students++;
    }
    if (notifyInConsole) console.log(`[ALUNOS] ${results.students} estudantes salvos com sucesso.`);

    // 4. Opções / Candidatos (/meals)
    for (const option of MEAL_OPTIONS) {
      const optionToSave: MealOption = {
        ...option,
        schoolId: 'escola-principal'
      };
      await setDoc(doc(db, 'meals', option.id), optionToSave);
      results.meals++;
    }
    if (notifyInConsole) console.log(`[OPÇÕES] ${results.meals} opções/candidatos salvos.`);

    // 5. Sessões de Votação (/voting_sessions)
    for (const session of INITIAL_VOTING_SESSIONS) {
      const sessionToSave: VotingSession = {
        ...session,
        schoolId: 'escola-principal'
      };
      await setDoc(doc(db, 'voting_sessions', session.id), sessionToSave);
      results.votingSessions++;
    }
    if (notifyInConsole) console.log(`[VOTAÇÕES] ${results.votingSessions} sessões de votação salvas.`);

    // 6. Frequência Escolar Padrão (/attendance)
    const todayStr = new Date().toISOString().split('T')[0];
    const initialAttendance: AttendanceRecord = {
      id: `${todayStr}_escola-principal`,
      date: todayStr,
      schoolId: 'escola-principal',
      presentMatriculas: ['2023001', '2023002', '2023003', '2023004', '2023005'],
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'attendance', initialAttendance.id), initialAttendance);
    results.attendance++;
    if (notifyInConsole) console.log(`[FREQUÊNCIA] Registro de frequência padrão salvo para ${todayStr}.`);

    if (notifyInConsole) {
      console.log('====================================================');
      console.log('✅ TODAS AS INFORMAÇÕES FORAM SALVAS COM SUCESSO NO BANCO DE DADOS!');
      console.log(`Resumo: ${results.schools} escola, ${results.admins} administradores, ${results.students} alunos, ${results.meals} opções, ${results.votingSessions} votações e ${results.attendance} frequência.`);
      console.log('====================================================');
    }

    return results;
  } catch (error) {
    console.error('❌ Erro ao salvar informações no banco de dados:', error);
    throw error;
  }
}

// Se for executado diretamente via linha de comando
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('seed')) {
  seedAllToDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
