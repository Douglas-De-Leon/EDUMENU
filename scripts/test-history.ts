import { Selection } from '../types';

const selections: Selection[] = [
  { matricula: '1', mealId: 'm1', category: 'Alimentação', timestamp: '2023-10-01T10:00:00Z', turno: '', sala: '' },
  { matricula: '2', mealId: 'm1', category: 'Alimentação', timestamp: '2023-10-01T11:00:00Z', turno: '', sala: '' },
  { matricula: '3', mealId: 'm2', category: 'Alimentação', timestamp: '2023-10-01T12:00:00Z', turno: '', sala: '' },
  { matricula: '1', mealId: 'm2', category: 'Alimentação', timestamp: '2023-10-02T10:00:00Z', turno: '', sala: '' },
];

const grouped = selections.reduce((acc, selection) => {
  const dateStr = new Date(selection.timestamp).toLocaleDateString('pt-BR');
  if (!acc[dateStr]) acc[dateStr] = [];
  acc[dateStr].push(selection);
  return acc;
}, {} as Record<string, Selection[]>);

console.log(grouped);
