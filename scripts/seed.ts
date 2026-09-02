import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, MealOption } from '../types';
import { INITIAL_STUDENTS, MEAL_OPTIONS } from '../constants';

// Função principal de salvamento
async function seedDatabase() {
  console.log('Iniciando o salvamento de dados padrão no Firebase...');
  console.log('----------------------------------------------------');

  try {
    let studentCount = 0;
    for (const student of INITIAL_STUDENTS) {
      await setDoc(doc(db, 'students', student.matricula), student);
      studentCount++;
      console.log(`[ALUNO] ${student.name} (Matrícula: ${student.matricula}) salvo com sucesso.`);
    }

    let optionCount = 0;
    for (const option of MEAL_OPTIONS) {
      await setDoc(doc(db, 'meals', option.id), option);
      optionCount++;
      console.log(`[OPÇÃO] ${option.name} (Categoria: ${option.category}) salvo com sucesso.`);
    }

    console.log('----------------------------------------------------');
    console.log(`Concluído! Foram salvos ${studentCount} alunos e ${optionCount} opções no Firestore.`);
    
    // Encerra o script com sucesso
    process.exit(0);
  } catch (error) {
    console.error('Erro ao salvar no banco de dados:', error);
    process.exit(1);
  }
}

// Executa a função
seedDatabase();

