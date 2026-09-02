import { MealOption, Student } from './types';

export const MEAL_OPTIONS: MealOption[] = [
  { id: 'gremio-chapa-a', name: 'Chapa A - Inovação', description: 'Por uma escola mais tecnológica e inclusiva.', category: 'Gremio', calories: 'Chapa 10', active: true },
  { id: 'gremio-chapa-b', name: 'Chapa B - Ação Jovem', description: 'Foco no esporte, cultura e eventos estudantis.', category: 'Gremio', calories: 'Chapa 20', active: true },
  { id: 'rep-joao', name: 'João Silva', description: 'Propostas para melhoria da infraestrutura da sala.', category: 'Representante', calories: 'Nº 15', active: true },
  { id: 'rep-maria', name: 'Maria Souza', description: 'Diálogo e eventos para a turma.', category: 'Representante', calories: 'Nº 22', active: true },
  { id: 'alim-1', name: 'Estrogonofe de Frango', description: 'Com arroz e batata palha', category: 'Alimentação', calories: '450 kcal', active: true },
  { id: 'alim-2', name: 'Macarronada', description: 'Ao sugo com carne moída', category: 'Alimentação', calories: '500 kcal', active: true },
  { id: 'outros-1', name: 'Projeto Feira de Ciências', description: 'Aprovação para realização da feira no próximo mês.', category: 'Outros', calories: 'Sim', active: true },
  { id: 'outros-2', name: 'Adiar Gincana', description: 'Votação para adiar a gincana para o próximo semestre.', category: 'Outros', calories: 'Não', active: true }
];

export const INITIAL_STUDENTS: Student[] = [
  { matricula: '07971933240', name: 'ADAILSON DA SILVA LEAL', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '09284266297', name: 'ALESSANDRA VICTORIA PINTO DA SILVA', password: '57208728', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '05390865251', name: 'ALEX DA SILVA OLIVEIRA', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '07247660228', name: 'ALEXSANDRO DE SOUZA SILVA', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '09607610202', name: 'ANA BEATRIZ SOUZA DA FONSECA', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '09509270237', name: 'ANALLYCE DE SOUZA SANTOS', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '10581416279', name: 'ANGELICA CIBELY DE LIMA ALVES', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '08928874270', name: 'ANTONIO DOS SANTOS RODRIGUES FILHO', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '03969648262', name: 'CARLA NAYANE DOS SANTOS SILVA', password: '57208728', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '15368488912', name: 'CARLOS GABRIEL BRAGA DE SOUZA', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '08751071258', name: 'DANIEL JOHNIS SILVA DA SILVA', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '10486358216', name: 'DANIEL MEDEIROS DE LIMA', password: '57208728', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '08005328214', name: 'DEIVISON LUCIANO DE OLIVEIRA DOS SANTOS', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '10996493239', name: 'DIEGO BRITO MIRANDA', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '08780863230', name: 'EDIVAN BARROS DO VALE', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '06924254209', name: 'JESSE CORREA DOS SANTOS', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '08825326262', name: 'JHAMILLY DE AVIZ DO ROSARIO', password: '5896465', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '09527924278', name: 'JOAO VICTOR MARQUES SILVA', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '08151212292', name: 'JOSIELTON DO ROSARIO FIGUEREDO', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '08865441224', name: 'KAYLON THALYSON CORREA DOS SANTOS', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '09348440209', name: 'KEILA LARISSA NOGUEIRA SMITH', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '12162749246', name: 'KEVELYN BEATRIZ DA COSTA MORAES', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '08268321210', name: 'LUCAS VINICIUS DE SOUZA DA SILVA', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '07097715251', name: 'MARIA CLEISIANE SILVA TEIXEIRA', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '07232115237', name: 'MARIA EDUARDA DA COSTA RIBEIRO', password: '57208728', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '10486377270', name: 'MIGUEL MEDEIROS DE LIMA', password: '57208728', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '09940800266', name: 'NAYLA SILVA DO ROSARIO', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '09559155202', name: 'PAOLA RAQUEL PEREIRA MEDEIRO', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '08014807286', name: 'RAIMUNDA VITORIA CARDOSO DA SILVA (PCD)', password: '5896465', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '06940879200', name: 'SAMILLY DA SILVA MONTEIRO', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '07931138228', name: 'STEFANNY GOMES DA COSTA', password: '5896465', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '07963387282', name: 'STHEFANNY LEAL SE SOUZA', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '09902398294', name: 'VANIELSON OLIVEIRA DOS SANTOS', password: '57211393', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '11638003254', name: 'VINICIUS DA COSTA DE SOUZA', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' },
  { matricula: '08742628288', name: 'WENDEL AUGUSTO MORAES OLIVEIRA', password: '57211364', turno: 'Integral', sala: '1º Ano', turma: 'A' }
];

