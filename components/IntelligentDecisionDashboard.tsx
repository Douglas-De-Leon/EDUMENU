import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { Selection, MealOption, Student, VotingSession, AttendanceRecord } from '../types';

interface IntelligentDecisionDashboardProps {
  selections: Selection[];
  mealOptions: MealOption[];
  votingSessions: VotingSession[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onNavigateToVoting?: () => void;
  onReuseVoting?: (session: VotingSession, targetDate: string) => void;
}

export type FoodSubcategory = 'Almoço Completo' | 'Lanche / Fruta' | 'Vegetariano' | 'Sobremesa';

// Constantes oficiais das 4 subcategorias cadastradas no sistema
export const SUBCATEGORIES: Array<{
  id: FoodSubcategory;
  label: string;
  icon: string;
  color: string;
  bgLight: string;
  badgeBg: string;
  costPerMeal: number; // R$ custo médio por porção
  kgPerMeal: number;   // kg médio por porção
}> = [
  {
    id: 'Almoço Completo',
    label: 'Almoço Completo',
    icon: 'fa-bowl-food',
    color: '#10B981', // Emerald
    bgLight: 'bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    costPerMeal: 6.80,
    kgPerMeal: 0.42
  },
  {
    id: 'Lanche / Fruta',
    label: 'Lanche / Fruta',
    icon: 'fa-sandwich',
    color: '#F59E0B', // Amber
    bgLight: 'bg-amber-50',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    costPerMeal: 3.40,
    kgPerMeal: 0.22
  },
  {
    id: 'Vegetariano',
    label: 'Vegetariano',
    icon: 'fa-seedling',
    color: '#06B6D4', // Cyan
    bgLight: 'bg-cyan-50',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    costPerMeal: 5.90,
    kgPerMeal: 0.38
  },
  {
    id: 'Sobremesa',
    label: 'Sobremesa',
    icon: 'fa-apple-whole',
    color: '#EC4899', // Pink
    bgLight: 'bg-pink-50',
    badgeBg: 'bg-pink-100 text-pink-800 border-pink-200',
    costPerMeal: 2.20,
    kgPerMeal: 0.15
  }
];

// Helper para detectar com precisão a categoria ALIMENTAÇÃO (tolerante a maiúsculas/acentos)
export function isAlimentacaoCategory(cat?: string): boolean {
  if (!cat) return false;
  const normalized = cat.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return normalized === 'ALIMENTACAO' || normalized.includes('ALIMENTA') || normalized.includes('MERENDA');
}

// Helper para mapear qualquer opção para uma das 4 subcategorias oficiais
export function getOptionSubcategory(opt: MealOption): FoodSubcategory {
  const type = (opt.mealType || '').toLowerCase();
  const name = (opt.name || '').toLowerCase();
  const desc = (opt.description || '').toLowerCase();
  const cal = (opt.calories || '').toLowerCase();

  if (
    type.includes('vegetar') ||
    name.includes('vegetar') ||
    desc.includes('vegetar') ||
    cal.includes('vegetar') ||
    name.includes('tofu') ||
    name.includes('grão-de-bico') ||
    name.includes('soja') ||
    name.includes('lentilha') ||
    name.includes('salada')
  ) {
    return 'Vegetariano';
  }

  if (
    type.includes('sobremesa') ||
    name.includes('sobremesa') ||
    desc.includes('sobremesa') ||
    cal.includes('sobremesa') ||
    name.includes('pudim') ||
    name.includes('gelatina') ||
    name.includes('doce') ||
    name.includes('fruta da estação') ||
    name.includes('manga') ||
    name.includes('melancia')
  ) {
    return 'Sobremesa';
  }

  if (
    type.includes('lanche') ||
    name.includes('lanche') ||
    desc.includes('lanche') ||
    cal.includes('lanche') ||
    name.includes('sandu') ||
    name.includes('pão') ||
    name.includes('biscoito') ||
    name.includes('suco') ||
    name.includes('vitamina') ||
    name.includes('iogurte')
  ) {
    return 'Lanche / Fruta';
  }

  // Padrão de refeição quente
  return 'Almoço Completo';
}

export const IntelligentDecisionDashboard: React.FC<IntelligentDecisionDashboardProps> = ({
  selections,
  mealOptions,
  votingSessions,
  students,
  attendanceRecords,
  onNavigateToVoting,
  onReuseVoting
}) => {
  // Aba ativa: Visão Geral ou uma das 4 Subcategorias ou Simulador / Diretrizes
  const [activeSubcategoryTab, setActiveSubcategoryTab] = useState<'all' | FoodSubcategory | 'simulator' | 'guidelines'>('all');

  // Filtro de sessão de votação específica (restrito exclusivamente à categoria ALIMENTAÇÃO)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');

  // Estado do Simulador de Cenários
  const [simPresenceRate, setSimPresenceRate] = useState<number>(85); // Presença em %
  const [simSafetyMargin, setSimSafetyMargin] = useState<number>(5);  // Margem de segurança da cozinha em %
  const [simLunchRatio, setSimLunchRatio] = useState<number>(65);     // % que escolhe Almoço Completo
  const [simVegRatio, setSimVegRatio] = useState<number>(15);        // % que escolhe Vegetariano
  const [simSnackRatio, setSimSnackRatio] = useState<number>(70);      // % que consome Lanche
  const [simDessertRatio, setSimDessertRatio] = useState<number>(80);    // % que consome Sobremesa

  // 1. Filtragem estrita: apenas dados da Categoria ALIMENTAÇÃO
  const alimentacaoSessions = useMemo(() => {
    return votingSessions.filter(s => isAlimentacaoCategory(s.category));
  }, [votingSessions]);

  const activeSession = useMemo(() => {
    if (selectedSessionId !== 'all') {
      return alimentacaoSessions.find(s => s.id === selectedSessionId) || null;
    }
    return alimentacaoSessions[0] || null;
  }, [alimentacaoSessions, selectedSessionId]);

  // Opções de refeição da categoria ALIMENTAÇÃO
  const alimentacaoOptions = useMemo(() => {
    return mealOptions.filter(m => isAlimentacaoCategory(m.category));
  }, [mealOptions]);

  // Votos registrados exclusivamente para ALIMENTAÇÃO
  const alimentacaoVotes = useMemo(() => {
    return selections.filter(s => {
      if (!isAlimentacaoCategory(s.category)) return false;
      if (selectedSessionId !== 'all' && activeSession) {
        return s.votingSessionId === activeSession.id;
      }
      return true;
    });
  }, [selections, selectedSessionId, activeSession]);

  // Total de estudantes cadastrados
  const totalStudents = students.length;

  // Registro de frequência escolar mais recente (ou da data da sessão)
  const relevantAttendance = useMemo(() => {
    if (attendanceRecords.length === 0) return null;
    if (activeSession && activeSession.date) {
      const match = attendanceRecords.find(a => a.date === activeSession.date);
      if (match) return match;
    }
    const sorted = [...attendanceRecords].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0];
  }, [attendanceRecords, activeSession]);

  const presentCount = relevantAttendance
    ? relevantAttendance.presentMatriculas.length
    : Math.round(totalStudents * 0.85);

  // Mapeamento de estudantes por matrícula para análises demográficas
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(st => map.set(st.matricula, st));
    return map;
  }, [students]);

  // 2. CONSOLIDAÇÃO ANALÍTICA POR SUBCATEGORIA
  const subcategoryAnalytics = useMemo(() => {
    const totalVotes = alimentacaoVotes.length;

    // Contagem de votos por ID de opção
    const optionVoteCounts: Record<string, number> = {};
    alimentacaoVotes.forEach(v => {
      optionVoteCounts[v.mealId] = (optionVoteCounts[v.mealId] || 0) + 1;
    });

    // Mapeamento por subcategoria
    const subcatMap: Record<FoodSubcategory, {
      options: Array<{
        id: string;
        name: string;
        description: string;
        calories?: string;
        votes: number;
        pct: number;
      }>;
      totalVotes: number;
      adhesionRate: number;      // % sobre o total de votos
      estimatedPortions: number; // Porções necessárias baseadas no quórum presente
      avoidedWasteKg: number;    // Quilos poupados de sobras limpas
      budgetSavedBRL: number;    // Economia financeira em R$
      byTurno: Record<string, number>;
      bySala: Record<string, number>;
    }> = {
      'Almoço Completo': { options: [], totalVotes: 0, adhesionRate: 0, estimatedPortions: 0, avoidedWasteKg: 0, budgetSavedBRL: 0, byTurno: {}, bySala: {} },
      'Lanche / Fruta': { options: [], totalVotes: 0, adhesionRate: 0, estimatedPortions: 0, avoidedWasteKg: 0, budgetSavedBRL: 0, byTurno: {}, bySala: {} },
      'Vegetariano': { options: [], totalVotes: 0, adhesionRate: 0, estimatedPortions: 0, avoidedWasteKg: 0, budgetSavedBRL: 0, byTurno: {}, bySala: {} },
      'Sobremesa': { options: [], totalVotes: 0, adhesionRate: 0, estimatedPortions: 0, avoidedWasteKg: 0, budgetSavedBRL: 0, byTurno: {}, bySala: {} }
    };

    // Agrupa as opções nas subcategorias
    alimentacaoOptions.forEach(opt => {
      const sub = getOptionSubcategory(opt);
      const count = optionVoteCounts[opt.id] || 0;
      const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;

      subcatMap[sub].options.push({
        id: opt.id,
        name: opt.name,
        description: opt.description,
        calories: opt.calories,
        votes: count,
        pct: Number(pct.toFixed(1))
      });
      subcatMap[sub].totalVotes += count;
    });

    // Se alguma subcategoria não tiver opções explícitas, inclui placeholder analítico
    SUBCATEGORIES.forEach(cfg => {
      if (subcatMap[cfg.id].options.length === 0) {
        subcatMap[cfg.id].options.push({
          id: `default_${cfg.id}`,
          name: `Cardápio Padrão - ${cfg.label}`,
          description: `Opção padrão recomendada pela nutricionista para ${cfg.label}`,
          votes: 0,
          pct: 0
        });
      }
      subcatMap[cfg.id].options.sort((a, b) => b.votes - a.votes);
    });

    // Distribuição demográfica de votos por turno e série
    alimentacaoVotes.forEach(v => {
      const opt = alimentacaoOptions.find(m => m.id === v.mealId);
      const sub = opt ? getOptionSubcategory(opt) : 'Almoço Completo';
      const st = studentMap.get(v.matricula);

      const turno = st?.turno || v.turno || 'Integral';
      const sala = st?.sala || v.sala || '1º Ano';

      subcatMap[sub].byTurno[turno] = (subcatMap[sub].byTurno[turno] || 0) + 1;
      subcatMap[sub].bySala[sala] = (subcatMap[sub].bySala[sala] || 0) + 1;
    });

    // Cálculos de dimensionamento da cozinha, desperdício zero e economia
    SUBCATEGORIES.forEach(cfg => {
      const item = subcatMap[cfg.id];
      const adhesion = totalVotes > 0 ? item.totalVotes / totalVotes : 0.25;
      item.adhesionRate = Number((adhesion * 100).toFixed(1));

      // Porções projetadas baseadas em presença escolar confirmada
      // Se houver votos, usa a proporção real; senão usa estimativa balanceada do PNAE
      const effectiveRatio = totalVotes > 0
        ? adhesion
        : cfg.id === 'Almoço Completo' ? 0.70 : cfg.id === 'Vegetariano' ? 0.15 : 0.50;

      item.estimatedPortions = Math.round(presentCount * effectiveRatio);

      // Desperdício evitado: cálculo de refeições não excedentes que iriam pro lixo
      const unservedAvoided = Math.max(0, totalStudents - item.estimatedPortions);
      item.avoidedWasteKg = Number((unservedAvoided * cfg.kgPerMeal).toFixed(1));
      item.budgetSavedBRL = Number((unservedAvoided * cfg.costPerMeal).toFixed(2));
    });

    // Dados consolidados para gráficos comparativos
    const comparativeChartData = SUBCATEGORIES.map(cfg => {
      const data = subcatMap[cfg.id];
      return {
        name: cfg.label,
        votos: data.totalVotes,
        porcoesProjetadas: data.estimatedPortions,
        kgPoupados: data.avoidedWasteKg,
        economiaBRL: data.budgetSavedBRL,
        fill: cfg.color
      };
    });

    return {
      subcatMap,
      comparativeChartData,
      totalAlimentacaoVotes: totalVotes
    };
  }, [alimentacaoOptions, alimentacaoVotes, presentCount, totalStudents, studentMap]);

  // 3. Ficha Técnica e Insumos por Subcategoria
  const getSubcategoryIngredients = (subcat: FoodSubcategory, portions: number) => {
    const ratio = portions / 100;
    switch (subcat) {
      case 'Almoço Completo':
        return [
          { item: 'Arroz Agulhinha Tipo 1', qtd: (12 * ratio).toFixed(1), unit: 'kg', detail: 'Cocção 20 min' },
          { item: 'Feijão Carioca / Preto', qtd: (6 * ratio).toFixed(1), unit: 'kg', detail: 'Deixar de molho 12h' },
          { item: 'Proteína Principal (Carne Bovina / Frango)', qtd: (18 * ratio).toFixed(1), unit: 'kg', detail: 'Descongelamento seguro' },
          { item: 'Legumes e Hortaliças da Horta', qtd: (14 * ratio).toFixed(1), unit: 'kg', detail: 'Agricultura familiar' },
          { item: 'Óleo Vegetal e Temperos Naturais', qtd: (2.5 * ratio).toFixed(1), unit: 'kg/L', detail: 'Baixo teor de sódio' }
        ];
      case 'Lanche / Fruta':
        return [
          { item: 'Pão Francês / Forma Integral', qtd: Math.round(portions * 1.1), unit: 'unidades', detail: 'Entrega matutina' },
          { item: 'Frutas Frescas In Natura (Banana/Maçã)', qtd: Math.round(portions * 1.05), unit: 'unidades', detail: 'Higienização clorada' },
          { item: 'Leite Pasteurizado Integral / Bebida Láctea', qtd: (20 * ratio).toFixed(1), unit: 'litros', detail: 'Temperatura < 4°C' },
          { item: 'Polpa de Fruta Natural p/ Suco', qtd: (5 * ratio).toFixed(1), unit: 'kg', detail: 'Sem adição de açúcar' }
        ];
      case 'Vegetariano':
        return [
          { item: 'Leguminosas (Lentilha / Grão-de-Bico)', qtd: (10 * ratio).toFixed(1), unit: 'kg', detail: 'Rico em ferro e fibras' },
          { item: 'Proteína Vegetal / Ovos Caipiras', qtd: (8 * ratio).toFixed(1), unit: 'kg/unid', detail: 'Substituição proteica' },
          { item: 'Arroz Integral / Cereais', qtd: (9 * ratio).toFixed(1), unit: 'kg', detail: 'Grãos selecionados' },
          { item: 'Mix de Folhas Verdes e Tofu Temperado', qtd: (7 * ratio).toFixed(1), unit: 'kg', detail: 'Preparo separado' }
        ];
      case 'Sobremesa':
        return [
          { item: 'Frutas da Safra Higienizadas', qtd: Math.round(portions * 1.02), unit: 'unidades', detail: 'Servir resfriado' },
          { item: 'Doce em Compota / Gelatina com Frutas', qtd: (6 * ratio).toFixed(1), unit: 'kg', detail: 'Redução de açúcares' },
          { item: 'Porções Individuais Seladas', qtd: portions, unit: 'unidades', detail: 'Distribuição rápida' }
        ];
    }
  };

  // 4. Métricas do Simulador de Cenários
  const simResults = useMemo(() => {
    const simPresentCount = Math.round(totalStudents * (simPresenceRate / 100));
    const safetyMult = 1 + (simSafetyMargin / 100);

    const lunchPortions = Math.round(simPresentCount * (simLunchRatio / 100) * safetyMult);
    const vegPortions = Math.round(simPresentCount * (simVegRatio / 100) * safetyMult);
    const snackPortions = Math.round(simPresentCount * (simSnackRatio / 100) * safetyMult);
    const dessertPortions = Math.round(simPresentCount * (simDessertRatio / 100) * safetyMult);

    const totalEstimatedCookedKg = Number((
      lunchPortions * 0.42 +
      vegPortions * 0.38 +
      snackPortions * 0.22 +
      dessertPortions * 0.15
    ).toFixed(1));

    // Economia comparada à preparação cega para 100% dos alunos
    const blindTotalKg = Number((totalStudents * (0.42 + 0.38 + 0.22 + 0.15) * 0.8).toFixed(1));
    const kgSaved = Math.max(0, Number((blindTotalKg - totalEstimatedCookedKg).toFixed(1)));
    const brlSaved = Number((kgSaved * 16.50).toFixed(2));

    return {
      simPresentCount,
      lunchPortions,
      vegPortions,
      snackPortions,
      dessertPortions,
      totalEstimatedCookedKg,
      kgSaved,
      brlSaved
    };
  }, [totalStudents, simPresenceRate, simSafetyMargin, simLunchRatio, simVegRatio, simSnackRatio, simDessertRatio]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Card - Exclusivo Categoria ALIMENTAÇÃO */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-700">
                Categoria Exclusiva: ALIMENTAÇÃO
              </span>
              <span className="text-[11px] text-emerald-200 font-bold bg-white/10 px-2.5 py-0.5 rounded-md">
                4 Subcategorias Oficiais
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Dashboard Inteligente para Tomada de Decisão Nutricional
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
              Tratamento analítico avançado exclusivo da <strong>ALIMENTAÇÃO ESCOLAR</strong>, com dimensionamento por subcategorias (<strong>Almoço Completo</strong>, <strong>Lanche / Fruta</strong>, <strong>Vegetariano</strong> e <strong>Sobremesa</strong>), prevenção de desperdício e planejamento de compras do PNAE.
            </p>
          </div>

          {/* Session Selector (Dentro de Alimentação) */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 flex flex-col gap-1 w-full lg:w-auto shrink-0">
            <label className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
              Votação / Cardápio em Análise:
            </label>
            <select
              value={selectedSessionId}
              onChange={e => setSelectedSessionId(e.target.value)}
              className="bg-emerald-900/90 text-white font-bold text-xs p-2.5 rounded-xl outline-none border border-emerald-700 min-w-[240px]"
            >
              <option value="all">Todas as Votações de Alimentação</option>
              {alimentacaoSessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.date ? s.date.split('-').reverse().join('/') : 'Em aberto'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Corpo Discente</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5 font-mono">
              {totalStudents} <span className="text-xs font-normal text-emerald-200">alunos</span>
            </p>
            <p className="text-[11px] text-emerald-300/80">Matrículas ativas na escola</p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Presença em Sala Hoje</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5 font-mono">
              {presentCount} <span className="text-xs font-normal text-emerald-200">presentes</span>
            </p>
            <p className="text-[11px] text-emerald-300/80">
              {totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(0) : 0}% de frequência confirmada
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Votos Computados</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5 font-mono">
              {subcategoryAnalytics.totalAlimentacaoVotes}
            </p>
            <p className="text-[11px] text-emerald-300/80">Opções selecionadas nas urnas</p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Meta Desperdício Zero</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5 font-mono">
              {subcategoryAnalytics.subcatMap['Almoço Completo'].avoidedWasteKg} kg
            </p>
            <p className="text-[11px] text-emerald-300/80">Economia estimada em sobras</p>
          </div>
        </div>
      </div>

      {/* Navegação por Subcategorias Cadastradas */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveSubcategoryTab('all')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubcategoryTab === 'all'
              ? 'bg-white text-slate-900 shadow-sm font-black ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-chart-pie text-indigo-600"></i>
          <span>Visão Consolidada</span>
        </button>

        {SUBCATEGORIES.map(cfg => {
          const isActive = activeSubcategoryTab === cfg.id;
          return (
            <button
              key={cfg.id}
              type="button"
              onClick={() => setActiveSubcategoryTab(cfg.id)}
              className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-white shadow-sm font-black ring-2'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              style={{
                color: isActive ? cfg.color : undefined,
                borderColor: isActive ? cfg.color : undefined
              }}
            >
              <i className={`fas ${cfg.icon}`} style={{ color: cfg.color }}></i>
              <span>{cfg.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-slate-200/80 text-slate-700">
                {subcategoryAnalytics.subcatMap[cfg.id].totalVotes}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setActiveSubcategoryTab('simulator')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubcategoryTab === 'simulator'
              ? 'bg-white text-amber-700 shadow-sm font-black ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-sliders-h text-amber-600"></i>
          <span>Simulador Cozinha</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubcategoryTab('guidelines')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubcategoryTab === 'guidelines'
              ? 'bg-white text-purple-700 shadow-sm font-black ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-clipboard-check text-purple-600"></i>
          <span>Diretrizes PNAE</span>
        </button>
      </div>

      {/* ABA 1: VISÃO CONSOLIDADA DA ALIMENTAÇÃO */}
      {activeSubcategoryTab === 'all' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Grid dos 4 Cards das Subcategorias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBCATEGORIES.map(cfg => {
              const data = subcatMapData(subcategoryAnalytics.subcatMap, cfg.id);
              return (
                <div
                  key={cfg.id}
                  onClick={() => setActiveSubcategoryTab(cfg.id)}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-emerald-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-xs"
                      style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                    >
                      <i className={`fas ${cfg.icon}`}></i>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${cfg.badgeBg}`}>
                      {data.adhesionRate}% Adesão
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-800 group-hover:text-emerald-700 transition-colors">
                    {cfg.label}
                  </h3>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Porções a Preparar:</span>
                      <span className="font-black text-slate-800 font-mono text-sm">{data.estimatedPortions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Votos Apurados:</span>
                      <span className="font-bold text-slate-600 font-mono">{data.totalVotes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Desperdício Poupado:</span>
                      <span className="font-bold text-emerald-600 font-mono">{data.avoidedWasteKg} kg</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-between text-[11px] font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    <span>Ver Análise Detalhada</span>
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráfico Comparativo: Demanda e Porções por Subcategoria */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <i className="fas fa-chart-column text-emerald-600"></i>
                    Comparativo de Demanda das 4 Subcategorias
                  </h3>
                  <p className="text-xs text-slate-500">
                    Volume de votos reais apurados vs. porções recomendadas a cozinhar para os alunos presentes
                  </p>
                </div>
                <span className="text-xs font-black bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-mono self-start sm:self-auto">
                  {presentCount} presentes na data
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subcategoryAnalytics.comparativeChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                      formatter={(val: any, name: string) => [val, name === 'votos' ? 'Votos Apurados' : 'Porções Recomendadas']}
                    />
                    <Legend />
                    <Bar dataKey="votos" name="Votos na Urna" fill="#6366F1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="porcoesProjetadas" name="Porções a Preparar" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribuição Proporcional (Pizza) */}
            <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fas fa-pie-chart text-purple-600"></i>
                Divisão da Preferência
              </h3>
              <p className="text-xs text-slate-500">
                Proporção das escolhas dos alunos entre Almoço, Lanche, Vegetariano e Sobremesa.
              </p>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subcategoryAnalytics.comparativeChartData}
                      dataKey="porcoesProjetadas"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {subcategoryAnalytics.comparativeChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                {SUBCATEGORIES.map(cfg => {
                  const data = subcatMapData(subcategoryAnalytics.subcatMap, cfg.id);
                  return (
                    <div key={cfg.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }}></span>
                        <span className="font-bold text-slate-700">{cfg.label}</span>
                      </div>
                      <span className="font-black font-mono text-slate-800">{data.estimatedPortions} porções</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABAS ESPECÍFICAS: ALMOÇO COMPLETO, LANCHE / FRUTA, VEGETARIANO, SOBREMESA */}
      {activeSubcategoryTab !== 'all' && activeSubcategoryTab !== 'simulator' && activeSubcategoryTab !== 'guidelines' && (
        <SubcategoryDetailView
          subcategory={activeSubcategoryTab}
          data={subcategoryAnalytics.subcatMap[activeSubcategoryTab]}
          presentCount={presentCount}
          totalStudents={totalStudents}
          ingredients={getSubcategoryIngredients(activeSubcategoryTab, subcategoryAnalytics.subcatMap[activeSubcategoryTab].estimatedPortions)}
        />
      )}

      {/* ABA 6: SIMULADOR INTERATIVO DA COZINHA */}
      {activeSubcategoryTab === 'simulator' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-8 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-2">
              <i className="fas fa-sliders-h"></i> Previsibilidade & Otimização
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Simulador Interativo de Produção e Custos da Merenda
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Ajuste as réguas de presença em sala de aula e de margem técnica da cozinha para simular em tempo real as porções a descongelar e cozinhar para cada uma das 4 subcategorias (Almoço, Lanche, Vegetariano e Sobremesa).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Controles do Simulador */}
            <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-700 uppercase tracking-wider">
                    Taxa de Presença Estimada dos Alunos:
                  </span>
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {simPresenceRate}% ({simResults.simPresentCount} discentes)
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="1"
                  value={simPresenceRate}
                  onChange={e => setSimPresenceRate(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-700 uppercase tracking-wider">
                    Margem de Segurança da Cozinha (Sobras Controladas):
                  </span>
                  <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    +{simSafetyMargin}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={simSafetyMargin}
                  onChange={e => setSimSafetyMargin(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Almoço Completo (%):</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={simLunchRatio}
                    onChange={e => setSimLunchRatio(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Vegetariano (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={simVegRatio}
                    onChange={e => setSimVegRatio(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Lanche / Fruta (%):</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={simSnackRatio}
                    onChange={e => setSimSnackRatio(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Sobremesa (%):</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={simDessertRatio}
                    onChange={e => setSimDessertRatio(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Resultados da Simulação */}
            <div className="space-y-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                Resultado Projetado da Ordem de Cocção
              </span>
              <h4 className="text-2xl font-black">Previsão Exata por Subcategoria</h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-emerald-300 block">🍱 Almoço Completo</span>
                  <span className="text-2xl font-black text-white font-mono">{simResults.lunchPortions}</span>
                  <span className="text-[10px] text-slate-300 block">pratos principais</span>
                </div>

                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-cyan-300 block">🥗 Vegetariano</span>
                  <span className="text-2xl font-black text-white font-mono">{simResults.vegPortions}</span>
                  <span className="text-[10px] text-slate-300 block">pratos vegetais</span>
                </div>

                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-amber-300 block">🥪 Lanche / Fruta</span>
                  <span className="text-2xl font-black text-white font-mono">{simResults.snackPortions}</span>
                  <span className="text-[10px] text-slate-300 block">kits individuais</span>
                </div>

                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-pink-300 block">🍎 Sobremesa</span>
                  <span className="text-2xl font-black text-white font-mono">{simResults.dessertPortions}</span>
                  <span className="text-[10px] text-slate-300 block">unidades de fruta</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Alimento Evitado de Sobras:</span>
                  <span className="font-black text-emerald-400 text-lg font-mono">+{simResults.kgSaved} kg</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase">Economia Direta Estimada:</span>
                  <span className="font-black text-amber-300 text-lg font-mono">R$ {simResults.brlSaved}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 7: DIRETRIZES PNAE & PLANO DE AÇÃO */}
      {activeSubcategoryTab === 'guidelines' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full mb-2">
              <i className="fas fa-certificate"></i> PNAE / FNDE
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Diretrizes Técnicas e Plano de Ação para a Nutricionista
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Orientações operacionais para alinhamento com a legislação da merenda escolar brasileira (Lei 11.947/2009 e Resolução CD/FNDE nº 6/2020).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                <i className="fas fa-tractor text-emerald-600"></i>
                <span>Aquisição da Agricultura Familiar (Mínimo 30%)</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Utilize os dados de projeção de consumo das subcategorias <strong>Lanche / Fruta</strong> e <strong>Sobremesa</strong> para fechar contratos prioritários com cooperativas locais de pequenos agricultores da região.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                <i className="fas fa-heart-pulse text-indigo-600"></i>
                <span>Controle de Açúcares e Ultraprocessados</span>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                A subcategoria <strong>Sobremesa</strong> prioriza frutas frescas in natura. Proibida a oferta de refrigerantes, refrescos artificiais ou guloseimas com altos teores de açúcares adicionados e gorduras trans.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-2">
              <div className="flex items-center gap-2 text-cyan-900 font-black text-sm">
                <i className="fas fa-seedling text-cyan-600"></i>
                <span>Garantia de Opção Vegetariana Inclusiva</span>
              </div>
              <p className="text-xs text-cyan-800 leading-relaxed">
                Garantir que os alunos cadastrados na subcategoria <strong>Vegetariano</strong> tenham preparo exclusivo com utensílios higienizados separadamente, assegurando aporte de 18% a 20% das necessidades diárias de ferro e proteínas vegetais.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                <i className="fas fa-temperature-arrow-down text-amber-600"></i>
                <span>Descongelamento & Frio Controlado (Almoço Completo)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Para o <strong>Almoço Completo</strong>, o descongelamento das carnes deve ocorrer sob refrigeração a no máximo 4°C por 24 horas antes do preparo térmico acima de 70°C no centro geométrico do alimento.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de visualização aprofundada de uma Subcategoria Específica
interface SubcategoryDetailViewProps {
  subcategory: FoodSubcategory;
  data: {
    options: Array<{
      id: string;
      name: string;
      description: string;
      calories?: string;
      votes: number;
      pct: number;
    }>;
    totalVotes: number;
    adhesionRate: number;
    estimatedPortions: number;
    avoidedWasteKg: number;
    budgetSavedBRL: number;
    byTurno: Record<string, number>;
    bySala: Record<string, number>;
  };
  presentCount: number;
  totalStudents: number;
  ingredients: Array<{ item: string; qtd: string | number; unit: string; detail: string }>;
}

const SubcategoryDetailView: React.FC<SubcategoryDetailViewProps> = ({
  subcategory,
  data,
  presentCount,
  totalStudents,
  ingredients
}) => {
  const config = SUBCATEGORIES.find(s => s.id === subcategory) || SUBCATEGORIES[0];

  // Preparação de dados de série para gráfico de barras
  const salaChartData = useMemo(() => {
    return Object.entries(data.bySala).map(([sala, votos]) => ({
      sala,
      votos
    }));
  }, [data.bySala]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner da Subcategoria */}
      <div className={`p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs ${config.bgLight} space-y-4`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm bg-white"
              style={{ color: config.color }}
            >
              <i className={`fas ${config.icon}`}></i>
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.badgeBg}`}>
                Subcategoria de Alimentação
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {config.label}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-mono shadow-2xs">
              {data.totalVotes} votos apurados
            </span>
            <span className="text-xs font-black px-3.5 py-1.5 rounded-xl text-white shadow-xs" style={{ backgroundColor: config.color }}>
              {data.estimatedPortions} porções a produzir
            </span>
          </div>
        </div>

        {/* Big Dimensioning Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Adesão na Merenda</span>
            <span className="text-lg font-black text-slate-800 font-mono">{data.adhesionRate}%</span>
            <span className="text-[10px] text-slate-500 block">dos votos em alimentação</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Alimento Poupado</span>
            <span className="text-lg font-black text-emerald-600 font-mono">+{data.avoidedWasteKg} kg</span>
            <span className="text-[10px] text-slate-500 block">desperdício zero</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Economia Direta</span>
            <span className="text-lg font-black text-amber-600 font-mono">R$ {data.budgetSavedBRL}</span>
            <span className="text-[10px] text-slate-500 block">otimização de compras</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Presença Escolar</span>
            <span className="text-lg font-black text-indigo-600 font-mono">{presentCount}</span>
            <span className="text-[10px] text-slate-500 block">alunos na chamada</span>
          </div>
        </div>
      </div>

      {/* Grid: Esquerda = Ranking de Pratos da Subcategoria, Direita = Lista de Insumos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Pratos e Opções Votadas dentro da Subcategoria */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-list-ol text-emerald-600"></i>
              Pratos e Opções de {config.label}
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {data.options.length} {data.options.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
            </span>
          </div>

          <div className="space-y-3">
            {data.options.map((opt, idx) => (
              <div
                key={opt.id}
                className="p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all bg-slate-50/50 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h5 className="font-black text-slate-900 text-sm">{opt.name}</h5>
                    </div>
                    {opt.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{opt.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black font-mono text-slate-800">{opt.votes} votos</span>
                    <span className="text-[10px] font-bold text-emerald-600 block">{opt.pct}%</span>
                  </div>
                </div>

                {opt.calories && (
                  <span className="inline-block text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                    {opt.calories}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ficha Técnica e Insumos Automatizados da Cozinha */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Ficha Técnica Operacional
            </span>
            <h4 className="text-base font-black text-slate-800 mt-1 flex items-center gap-2">
              <i className="fas fa-kitchen-set text-emerald-600"></i>
              Insumos para as {data.estimatedPortions} Porções
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Cálculo exato de porcionamento para o setor de compras e cozinheiras.
            </p>
          </div>

          <div className="space-y-2.5">
            {ingredients.map(ing => (
              <div key={ing.item} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{ing.item}</span>
                  <span className="text-[10px] text-slate-400">{ing.detail}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 font-mono text-sm">{ing.qtd}</span>
                  <span className="text-[10px] font-semibold text-slate-500 ml-1">{ing.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper simples para evitar erros de tipagem
function subcatMapData(map: Record<FoodSubcategory, any>, id: FoodSubcategory) {
  return map[id] || {
    options: [],
    totalVotes: 0,
    adhesionRate: 0,
    estimatedPortions: 0,
    avoidedWasteKg: 0,
    budgetSavedBRL: 0,
    byTurno: {},
    bySala: {}
  };
}
