import { MealOption, Student } from './types';

export const MEAL_OPTIONS: MealOption[] = [
  // Category 'Gremio'
  {
    id: 'gremio-1',
    name: 'Chapa A: Renovação e Voz Estudantil',
    description: 'Propostas para modernizar o grêmio, abrir espaço para saraus de poesia e música no intervalo, organizar ligas de e-Sports interclasses, e implementar clubes de estudos colaborativos.',
    category: 'Gremio',
    calories: 'Chapa 10',
    active: true
  },
  {
    id: 'gremio-2',
    name: 'Chapa B: Força Jovem e Esporte',
    description: 'Foco na renovação dos materiais esportivos, ampliação dos campeonatos escolares, criação de um fórum semanal de sugestões dos alunos e intercâmbio de ideias com outras escolas.',
    category: 'Gremio',
    calories: 'Chapa 20',
    active: true
  },

  // Category 'Representante'
  {
    id: 'rep-1',
    name: 'Candidato: Pedro Henrique (1º Ano)',
    description: 'Com compromisso com a transparência de datas de avaliações, organização de grupos de estudo antes do boletim, e canal direto semanal de diálogo com a coordenação.',
    category: 'Representante',
    calories: 'Número 101',
    active: true
  },
  {
    id: 'rep-2',
    name: 'Candidata: Mariana Souza (2º Ano)',
    description: 'Propõe a criação de uma ouvidoria de sala para conciliar conflitos, mutirões de organização do pátio e acompanhamento próximo do calendário de trabalhos finais.',
    category: 'Representante',
    calories: 'Número 102',
    active: true
  },

  // Category 'Alimentação'
  {
    id: 'food-1',
    name: 'Prato do Dia: Feijoada Escolar Light',
    description: 'Arroz branco fresquinho, feijão preto com carnes magras grelhadas, couve refogada no alho, rodelas de laranja doce e farofinha artesanal.',
    category: 'Alimentação',
    calories: 'Opção 01',
    active: true
  },
  {
    id: 'food-2',
    name: 'Prato do Dia: Massa Penne ao Molho Cremoso com Brócolis',
    description: 'Penne integral ao creme de queijo leve, brócolis cozido no vapor salpicado com alho frito, lombo desfiado ou almôndegas de lentilha para vegetarianos.',
    category: 'Alimentação',
    calories: 'Opção 02',
    active: true
  },

  // Category 'Outros'
  {
    id: 'other-1',
    name: 'Festival Cultural: Tecnologia e Ficção Científica',
    description: 'Votação para o tema do Festival de Ciências e Cultura. Esta opção traz robótica viva, expositores interativos, palestras sobre IA e inteligência artificial no pátio.',
    category: 'Outros',
    calories: 'Tema 88',
    active: true
  },
  {
    id: 'other-2',
    name: 'Projeto de Sustentabilidade: Horta Hidropônica Coletiva',
    description: 'Construção coletiva de um viveiro autossustentável de legumes e verduras no pátio, irrigado por sistema automatizado com reaproveitamento de água da chuva.',
    category: 'Outros',
    calories: 'Tema 99',
    active: true
  }
];

export const INITIAL_STUDENTS: Student[] = [
  { matricula: '2023001', name: 'Ana Silva', password: '123', turno: 'Manhã', sala: '1º Ano A' },
  { matricula: '2023002', name: 'Bruno Gomes', password: '123', turno: 'Tarde', sala: '2º Ano B' },
  { matricula: '2023003', name: 'Carla Dias', password: '123', turno: 'Noite', sala: '3º Ano A' },
  { matricula: '2023004', name: 'David Souza', password: '123', turno: 'Manhã', sala: '1º Ano B' },
  { matricula: '2023005', name: 'Elena Torres', password: '123', turno: 'Tarde', sala: '2º Ano A' },
  { matricula: '2023006', name: 'Felipe Melo', password: '123', turno: 'Noite', sala: '3º Ano B' },
  { matricula: '2023007', name: 'Gustavo Lima', password: '123', turno: 'Manhã', sala: '1º Ano A' },
  { matricula: '2023008', name: 'Helena Costa', password: '123', turno: 'Tarde', sala: '2º Ano B' },
  { matricula: '2023009', name: 'Igor Rocha', password: '123', turno: 'Noite', sala: '3º Ano A' }
];
