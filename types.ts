
export interface Student {
  matricula: string;
  name: string;
  password?: string;
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
  category: 'Padrao' | 'Vegetariana' | 'Especial';
  calories?: string;
  active?: boolean;
}

export interface Selection {
  matricula: string;
  mealId: string;
  timestamp: string; // ISO format
}

export interface AppState {
  currentStudent: Student | null;
  selections: Selection[];
  registeredStudents: Student[];
  mealOptions: MealOption[];
}
