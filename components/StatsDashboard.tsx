import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Selection, MealOption } from '../types';

interface StatsDashboardProps {
  selections: Selection[];
  mealOptions: MealOption[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ selections, mealOptions }) => {
  const [selectedCategory, setSelectedCategory] = useState<'Gremio' | 'Representante' | 'Alimentação' | 'Outros'>('Gremio');

  // Filter options and votes based on category
  const activeOptions = useMemo(() => {
    return mealOptions.filter(option => option.category === selectedCategory && option.active);
  }, [mealOptions, selectedCategory]);

  const catSelections = useMemo(() => {
    return selections.filter(s => s.category === selectedCategory);
  }, [selections, selectedCategory]);

  const data = useMemo(() => {
    return activeOptions.map(option => ({
      name: option.name,
      count: catSelections.filter(s => s.mealId === option.id).length,
      color: selectedCategory === 'Gremio' ? '#4F46E5' : 
             selectedCategory === 'Representante' ? '#F59E0B' : 
             selectedCategory === 'Alimentação' ? '#10B981' : '#8B5CF6'
    })).sort((a, b) => b.count - a.count);
  }, [activeOptions, catSelections, selectedCategory]);

  const total = catSelections.length;
  const mostPopular = data.length > 0 ? data[0] : null;

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Gremio': return 'Grêmio Escolar';
      case 'Representante': return 'Representante';
      case 'Alimentação': return 'Refeição do Dia';
      case 'Outros': return 'Sustentabilidade/Outros';
      default: return cat;
    }
  };

  return (
    <div className="space-y-4">
      {/* Category selector pill bar */}
      <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200 shadow-inner">
        {(['Gremio', 'Representante', 'Alimentação', 'Outros'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-1 text-[10px] sm:text-xs font-black py-1.5 rounded-lg transition-all ${
              selectedCategory === cat 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {cat === 'Gremio' ? 'Grêmio' : cat === 'Representante' ? 'Repre.' : cat === 'Alimentação' ? 'Refeição' : 'Outros'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-sm font-sans flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Votos Apurados</p>
            <p className="text-3xl font-black">{total}</p>
          </div>
          <p className="text-[9px] mt-1 text-indigo-300 font-bold uppercase tracking-wider">Na categoria atual</p>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Líder Atual</p>
            <p className="text-base font-extrabold text-slate-800 truncate leading-tight mt-1">
              {total > 0 && mostPopular ? mostPopular.name : '-'}
            </p>
          </div>
          <p className="text-[9px] text-indigo-600 font-black uppercase tracking-wider mt-2">
            {total > 0 && mostPopular ? `${mostPopular.count} votos` : 'Sem votos'}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <i className="fas fa-chart-bar text-indigo-500"></i>
            Apuração: {getCategoryLabel(selectedCategory)}
          </h3>
          <span className="text-[9px] font-bold uppercase bg-green-50 text-green-700 px-2 py-0.5 rounded-md">LIVE</span>
        </div>

        {activeOptions.length > 0 ? (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  fontSize={9} 
                  tick={{ fill: '#475569', fontWeight: 'bold' }} 
                  width={75}
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-slate-400 py-10 flex flex-col items-center justify-center">
            <i className="fas fa-ban text-2xl mb-2"></i>
            <p className="text-xs">Não há opções ativas cadastradas.</p>
          </div>
        )}
      </div>
    </div>
  );
};
