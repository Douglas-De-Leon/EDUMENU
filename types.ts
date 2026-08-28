
export interface Student {
  matricula: string;
  name: string;
  password?: string;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  sala: string; // e.g. '1º Ano A', '1º Ano B', '2º Ano A', '2º Ano B', '3º Ano A', '3º Ano B'
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
  turno: 'Manhã' | 'Tarde' | 'Noite';
  sala: string;
}

export interface AppState {
  currentStudent: Student | null;
  selections: Selection[];
  registeredStudents: Student[];
  mealOptions: MealOption[];
}

