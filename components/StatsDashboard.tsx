import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Selection, MealOption } from '../types';

interface StatsDashboardProps {
  selections: Selection[];
  mealOptions: MealOption[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ selections, mealOptions }) => {
  const [selectedCategory, setSelectedCategory] = useState<'Gremio' | 'Representante' | 'Alimentação' | 'Outros'>('Gremio');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  });

  // Filter options and votes based on category
  const activeOptions = useMemo(() => {
    return mealOptions.filter(option => option.category === selectedCategory && option.active);
  }, [mealOptions, selectedCategory]);

  const catSelections = useMemo(() => {
    return selections.filter(s => s.category === selectedCategory);
  }, [selections, selectedCategory]);

  const todaySelections = useMemo(() => {
    // Parse selectedDate properly in local timezone
    const [year, month, day] = selectedDate.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const targetDateStr = targetDate.toLocaleDateString('pt-BR');
    
    return catSelections.filter(s => {
      if (!s.timestamp) return false;
      const voteDate = new Date(s.timestamp);
      return voteDate.toLocaleDateString('pt-BR') === targetDateStr;
    });
  }, [catSelections, selectedDate]);

  const data = useMemo(() => {
    return activeOptions.map(option => ({
      name: option.name,
      Participantes: todaySelections.filter(s => s.mealId === option.id).length,
      color: selectedCategory === 'Gremio' ? '#4F46E5' : 
             selectedCategory === 'Representante' ? '#F59E0B' : 
             selectedCategory === 'Alimentação' ? '#10B981' : '#8B5CF6'
    })).sort((a, b) => b.Participantes - a.Participantes);
  }, [activeOptions, todaySelections, selectedCategory]);

  const historyByDay = useMemo(() => {
    // Apenas considerar votos para opções que ainda existem (não foram excluídas)
    const validSelections = catSelections.filter(selection => 
      mealOptions.some(m => m.id === selection.mealId)
    );

    const grouped = validSelections.reduce((acc, selection) => {
      // Usar fuso horário local para agrupar corretamente
      const date = new Date(selection.timestamp).toLocaleDateString('pt-BR');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(selection);
      return acc;
    }, {} as Record<string, Selection[]>);

    return Object.entries(grouped).map(([date, daySelections]) => {
      const voteCounts = daySelections.reduce((acc, selection) => {
        acc[selection.mealId] = (acc[selection.mealId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      let topMealId = '';
      let maxVotes = -1;
      for (const [mealId, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          topMealId = mealId;
        }
      }

      const topMealName = mealOptions.find(m => m.id === topMealId)?.name || 'Opção Desconhecida';
      const originalDate = new Date(daySelections[0].timestamp).getTime();

      return {
        date,
        totalVotes: daySelections.length,
        winner: topMealName,
        originalDate
      };
    }).sort((a, b) => b.originalDate - a.originalDate); // Mais recentes primeiro
  }, [catSelections, mealOptions]);

  const total = todaySelections.length;
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

      {/* Date Filter */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <i className="fas fa-calendar-alt"></i> Data da Apuração
        </label>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-transparent border-none outline-none text-sm font-black text-slate-800 cursor-pointer text-right w-32"
        />
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
            {total > 0 && mostPopular ? `${mostPopular.Participantes} votos` : 'Sem votos'}
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
                <Bar dataKey="Participantes" radius={[0, 4, 4, 0]} barSize={16}>
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <i className="fas fa-history text-slate-500"></i>
            Histórico de Votação
          </h3>
        </div>
        
        {historyByDay.length > 0 ? (
          <div className="space-y-2">
            {historyByDay.map((day, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <i className="far fa-calendar-alt text-sm"></i>
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{day.date}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/50 rounded-md">
                    <i className="fas fa-users text-slate-400 text-xs"></i>
                    <span className="font-bold text-slate-700">{day.totalVotes} votos</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-md">
                    <i className="fas fa-crown text-amber-500 text-xs"></i>
                    <span className="font-bold text-amber-700 truncate max-w-[120px] sm:max-w-[150px]">{day.winner}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-6 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <i className="fas fa-inbox text-2xl mb-2 opacity-50"></i>
            <p className="text-xs">Nenhum histórico disponível.</p>
          </div>
        )}
      </div>
    </div>
  );
};
