import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, MealOption } from '../types';

// ============================================================================
// SCRIPT DE MIGRAÇÃO / POPULAÇÃO DE DADOS (SEED)
// ============================================================================
// Utilize este script para cadastrar alunos e opções reais diretamente no
// banco de dados Firestore.
// ============================================================================

// 1. INSIRA AQUI OS SEUS ALUNOS REAIS
const realStudentsToSeed: Student[] = [
  // Exemplo de formato:
  // { matricula: '2024001', name: 'João Silva', password: '123', turno: 'Manhã', sala: '1º Ano A' },
  // { matricula: '2024002', name: 'Maria Souza', password: '123', turno: 'Tarde', sala: '2º Ano B' },
];

// 2. INSIRA AQUI AS OPÇÕES/CHAPAS/CANDIDATOS REAIS
const realOptionsToSeed: MealOption[] = [
  // Exemplo de formato:
  // {
  //   id: 'gremio-1',
  //   name: 'Chapa C: Nova Geração',
  //   description: 'Foco na tecnologia e modernização do pátio escolar.',
  //   category: 'Gremio',
  //   calories: 'Número 30',
  //   active: true
  // },
];

// Função principal de salvamento
async function seedDatabase() {
  console.log('Iniciando o salvamento de dados reais no Firebase...');
  console.log('----------------------------------------------------');

  try {
    let studentCount = 0;
    for (const student of realStudentsToSeed) {
      await setDoc(doc(db, 'students', student.matricula), student);
      studentCount++;
      console.log(`[ALUNO] ${student.name} (Matrícula: ${student.matricula}) salvo com sucesso.`);
    }

    let optionCount = 0;
    for (const option of realOptionsToSeed) {
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
