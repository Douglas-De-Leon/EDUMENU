export interface School {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Student {
  matricula: string;
  name: string;
  password?: string;
  turno: string;
  sala: string;
  turma?: string;
  schoolId?: string; // Optional for backward compatibility with existing records
}

export interface AdminUser {
  id: string;
  login: string;
  name: string;
  password?: string;
  schoolId?: string; // Which school this admin belongs to
}

export interface MealOption {
  id: string;
  name: string;
  description: string;
  category: 'Alimentação' | 'Gremio' | 'Representante' | 'Outros';
  calories?: string;
  active?: boolean;
  schoolId?: string;
}

export interface Selection {
  matricula: string;
  mealId: string;
  category: 'Alimentação' | 'Gremio' | 'Representante' | 'Outros';
  timestamp: string;
  turno: string;
  sala: string;
  turma?: string;
  schoolId?: string;
  votingSessionId?: string;
}

export interface VotingSession {
  id: string;
  title: string;
  description?: string;
  category: 'Alimentação' | 'Gremio' | 'Representante' | 'Outros';
  date: string; // YYYY-MM-DD
  optionIds: string[]; // IDs of the selected enabled MealOptions
  active: boolean;
  schoolId?: string;
  createdAt?: string;
}

export interface AppState {
  currentStudent: Student | null;
  selections: Selection[];
  registeredStudents: Student[];
  mealOptions: MealOption[];
  votingSessions?: VotingSession[];
  schools: School[];
}
