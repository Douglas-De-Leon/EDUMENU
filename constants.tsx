
import { MealOption, Student } from './types';

export const MEAL_OPTIONS: MealOption[] = [
  {
    id: '1',
    name: 'Prato do Dia: Feijoada Leve',
    description: 'Arroz branco, feijão preto com carnes magras, couve refogada e farofa.',
    category: 'Padrao',
    calories: '550 kcal'
  },
  {
    id: '2',
    name: 'Espaguete à Bolonhesa de Lentilha',
    description: 'Massa integral com molho de tomate artesanal e lentilhas temperadas.',
    category: 'Vegetariana',
    calories: '420 kcal'
  },
  {
    id: '3',
    name: 'Frango Grelhado com Legumes',
    description: 'Peito de frango grelhado, purê de mandioquinha e mix de legumes no vapor.',
    category: 'Especial',
    calories: '380 kcal'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  { matricula: '2023001', name: 'Ana Silva', password: '123' },
  { matricula: '2023002', name: 'Bruno Gomes', password: '123' },
  { matricula: '2023003', name: 'Carla Dias', password: '123' }
];
