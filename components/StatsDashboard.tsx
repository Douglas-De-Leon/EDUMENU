
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Selection, MealOption } from '../types';

interface StatsDashboardProps {
  selections: Selection[];
  mealOptions: MealOption[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ selections, mealOptions }) => {
  const data = mealOptions.map(option => ({
    name: option.name.split(':')[0],
    count: selections.filter(s => s.mealId === option.id).length,
    color: option.category === 'Padrao' ? '#4F46E5' : option.category === 'Vegetariana' ? '#10B981' : '#F59E0B'
  }));

  const total = selections.length;
  const mostPopular = [...data].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-sm">
          <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Total de Alunos</p>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-[10px] mt-1 opacity-70">vão comer hoje</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mais Pedido</p>
          <p className="text-lg font-bold text-slate-800 truncate">{total > 0 ? mostPopular.name : '-'}</p>
          <p className="text-[10px] text-indigo-500 font-semibold mt-1">Preferência Atual</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <i className="fas fa-chart-bar text-indigo-500"></i>
            Distribuição por Prato
          </h3>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                fontSize={10} 
                tick={{ fill: '#64748b' }} 
                width={70}
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
