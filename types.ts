
export interface Student {
  matricula: string;
  name: string;
  password?: string;
  turno: string;
  sala: string; // e.g. '1º Ano', '2º Ano', '3º Ano'
  turma?: string; // e.g. 'A', 'B', 'C'
}

export interface AdminUser {
  id: string;
  login: string;
  name: string;
  password?: string;
}

export interface MealOption {
  id: string;
  name: string;
  description: string;
  category: 'Alimentação' | 'Gremio' | 'Representante' | 'Outros';
  calories?: string; // Identification (e.g. 'Chapa 10', 'Opção 1')
  active?: boolean;
}

export interface Selection {
  matricula: string;
  mealId: string; // Pointing to the MealOption id
  category: 'Alimentação' | 'Gremio' | 'Representante' | 'Outros';
  timestamp: string; // ISO format
  turno: string;
  sala: string;
  turma?: string;
}

export interface AppState {
  currentStudent: Student | null;
  selections: Selection[];
  registeredStudents: Student[];
  mealOptions: MealOption[];
}

