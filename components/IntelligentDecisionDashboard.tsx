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
  Pie
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
  // Aba ativa: Inicia por padrão na aba "Prato Balanceado & Fórmula Nutricional"
  const [activeSubcategoryTab, setActiveSubcategoryTab] = useState<'nutri_formula' | 'people_sim' | 'all' | FoodSubcategory | 'simulator' | 'guidelines'>('nutri_formula');

  // Filtro de sessão de votação específica (restrito exclusivamente à categoria ALIMENTAÇÃO)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');

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

  // Registro de frequência escolar mais recente
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

  // Mapeamento de estudantes por matrícula
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(st => map.set(st.matricula, st));
    return map;
  }, [students]);

  // -------------------------------------------------------------
  // MÓDULO 1: NUTRICIONISTA PROFISSIONAL & FÓRMULA DO PRATO ADULTO
  // -------------------------------------------------------------
  // Gramaturas em gramas (g) do prato individual do adulto
  const [plateVeggies, setPlateVeggies] = useState<number>(250);  // 50% = 250g
  const [plateCarbs, setPlateCarbs] = useState<number>(125);      // 25% = 125g
  const [plateLegumes, setPlateLegumes] = useState<number>(65);   // 12.5% = 65g
  const [plateProtein, setPlateProtein] = useState<number>(100);  // 12.5% = 100g
  const [plateFat, setPlateFat] = useState<number>(10);           // 10g azeite
  const [plateFruit, setPlateFruit] = useState<number>(120);      // 120g fruta cítrica

  // Cálculos bioquímicos e nutricionais do prato do adulto
  const adultPlateNutrition = useMemo(() => {
    // Calorias e Macros por componente (baseado na Tabela TACO - Unicamp & USDA)
    // 1. Vegetais (Hortaliças cruas + cozidas)
    const vegKcal = plateVeggies * 0.22;
    const vegCarbs = plateVeggies * 0.04;
    const vegProt = plateVeggies * 0.015;
    const vegFat = plateVeggies * 0.002;
    const vegFiber = plateVeggies * 0.025;

    // 2. Carboidratos Complexos (Arroz integral ou tubérculo)
    const carbKcal = plateCarbs * 1.30;
    const carbCarbs = plateCarbs * 0.28;
    const carbProt = plateCarbs * 0.026;
    const carbFat = plateCarbs * 0.009;
    const carbFiber = plateCarbs * 0.022;

    // 3. Leguminosas (Feijão/Lentilha/Grão-de-bico)
    const legKcal = plateLegumes * 0.92;
    const legCarbs = plateLegumes * 0.15;
    const legProt = plateLegumes * 0.065;
    const legFat = plateLegumes * 0.005;
    const legFiber = plateLegumes * 0.065;

    // 4. Proteína Nobre (Frango sem pele/Peixe/Carne magra ou Ovos/Tofu)
    const protKcal = plateProtein * 1.65;
    const protCarbs = plateProtein * 0.00;
    const protProt = plateProtein * 0.29;
    const protFat = plateProtein * 0.045;
    const protFiber = 0;

    // 5. Lipídio Saudável (Azeite extravirgem)
    const fatKcal = plateFat * 8.84;
    const fatCarbs = 0;
    const fatProt = 0;
    const fatFat = plateFat * 0.99;
    const fatFiber = 0;

    // 6. Fruta Cítrica (Sobremesa in natura)
    const fruitKcal = plateFruit * 0.50;
    const fruitCarbs = plateFruit * 0.12;
    const fruitProt = plateFruit * 0.008;
    const fruitFat = plateFruit * 0.002;
    const fruitFiber = plateFruit * 0.020;

    // Totais
    const totalGramsPlate = plateVeggies + plateCarbs + plateLegumes + plateProtein;
    const totalMealGrams = totalGramsPlate + plateFat + plateFruit;

    const totalKcal = Math.round(vegKcal + carbKcal + legKcal + protKcal + fatKcal + fruitKcal);
    const totalProt = Number((vegProt + carbProt + legProt + protProt + fatProt + fruitProt).toFixed(1));
    const totalCarb = Number((vegCarbs + carbCarbs + legCarbs + protCarbs + fatCarbs + fruitCarbs).toFixed(1));
    const totalFat = Number((vegFat + carbFat + legFat + protFat + fatFat + fruitFat).toFixed(1));
    const totalFiber = Number((vegFiber + carbFiber + legFiber + protFiber + fatFiber + fruitFiber).toFixed(1));
    const totalSodium = Math.round(plateVeggies * 0.15 + plateCarbs * 0.10 + plateLegumes * 0.35 + plateProtein * 0.65 + 150); // ~420mg com tempero natural

    // Percentuais calóricos dos macronutrientes (AMDR - Acceptable Macronutrient Distribution Ranges)
    const kcalFromProt = totalProt * 4;
    const kcalFromCarb = totalCarb * 4;
    const kcalFromFat = totalFat * 9;
    const sumKcalMacros = kcalFromProt + kcalFromCarb + kcalFromFat || 1;

    const pctProtKcal = Math.round((kcalFromProt / sumKcalMacros) * 100);
    const pctCarbKcal = Math.round((kcalFromCarb / sumKcalMacros) * 100);
    const pctFatKcal = Math.round((kcalFromFat / sumKcalMacros) * 100);

    // Proporções Visuais do Prato Salgado
    const vegPlatePct = totalGramsPlate > 0 ? Math.round((plateVeggies / totalGramsPlate) * 100) : 50;
    const carbPlatePct = totalGramsPlate > 0 ? Math.round((plateCarbs / totalGramsPlate) * 100) : 25;
    const legPlatePct = totalGramsPlate > 0 ? Math.round((plateLegumes / totalGramsPlate) * 100) : 12.5;
    const protPlatePct = totalGramsPlate > 0 ? Math.round((plateProtein / totalGramsPlate) * 100) : 12.5;

    // FÓRMULA MATEMÁTICA: Índice de Balanceamento Nutricional (IBN de 0 a 100)
    // Penaliza desvios da proporção áurea (50% veg, 25% carb, 12.5% leg, 12.5% prot)
    const devVeg = Math.abs(vegPlatePct - 50);
    const devCarb = Math.abs(carbPlatePct - 25);
    const devLeg = Math.abs(legPlatePct - 12.5);
    const devProt = Math.abs(protPlatePct - 12.5);

    let ibnScore = Math.round(100 - (devVeg * 0.8 + devCarb * 0.8 + devLeg * 1.0 + devProt * 0.9));
    if (totalFiber < 10) ibnScore -= 10;
    if (totalSodium > 600) ibnScore -= 8;
    ibnScore = Math.max(10, Math.min(100, ibnScore));

    // Parecer Técnico da Nutricionista
    let clinicalVerdict = 'Excelente Equilíbrio Nutricional (Padrão Ouro CFN/OMS)';
    let clinicalBadgeBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    let clinicalAdvice = 'A refeição atinge a proporção ideal para um adulto saudável. Aporte proteico adequado para síntese tecidual e pico glicêmico amortecido pelas fibras.';

    if (ibnScore < 70) {
      clinicalVerdict = 'Atenção Nutricional: Desvio das Proporções Recomendadas';
      clinicalBadgeBg = 'bg-rose-100 text-rose-900 border-rose-300';
      clinicalAdvice = 'Recomenda-se aumentar a porção de vegetais para 50% do prato e moderar carboidratos ou proteínas para evitar sobrecarga renal e hepática.';
    } else if (ibnScore < 85) {
      clinicalVerdict = 'Bom Balanceamento com Pequenos Ajustes';
      clinicalBadgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
      clinicalAdvice = 'A refeição está bem direcionada. Considere incluir mais vegetais folhosos crus e garantir uma fruta cítrica para otimizar o ferro.';
    }

    // Dados para o gráfico de pizza do prato
    const plateDonutData = [
      { name: 'Vegetais & Hortaliças (50%)', value: vegPlatePct, grams: plateVeggies, fill: '#10B981' },
      { name: 'Carboidratos Complexos (25%)', value: carbPlatePct, grams: plateCarbs, fill: '#F59E0B' },
      { name: 'Leguminosas / Feijões (12.5%)', value: legPlatePct, grams: plateLegumes, fill: '#06B6D4' },
      { name: 'Proteína Nobre (12.5%)', value: protPlatePct, grams: plateProtein, fill: '#EC4899' }
    ];

    return {
      totalMealGrams,
      totalGramsPlate,
      totalKcal,
      totalProt,
      totalCarb,
      totalFat,
      totalFiber,
      totalSodium,
      pctProtKcal,
      pctCarbKcal,
      pctFatKcal,
      vegPlatePct,
      carbPlatePct,
      legPlatePct,
      protPlatePct,
      ibnScore,
      clinicalVerdict,
      clinicalBadgeBg,
      clinicalAdvice,
      plateDonutData
    };
  }, [plateVeggies, plateCarbs, plateLegumes, plateProtein, plateFat, plateFruit]);

  // -------------------------------------------------------------
  // MÓDULO 2: SIMULADOR DE PRATOS PARA UMA CERTA QUANTIDADE DE PESSOAS
  // -------------------------------------------------------------
  const [simPeopleCount, setSimPeopleCount] = useState<number>(() => {
    return presentCount > 0 ? presentCount : 50;
  });
  const [mealProfile, setMealProfile] = useState<'standard' | 'high_protein' | 'vegetarian' | 'light'>('standard');
  const [peopleSafetyMargin, setPeopleSafetyMargin] = useState<number>(5); // 5% de margem técnica

  const scaledSimulation = useMemo(() => {
    const people = Math.max(1, simPeopleCount);
    const marginMult = 1 + (peopleSafetyMargin / 100);
    const effectiveMeals = Math.round(people * marginMult);

    // Ajusta gramaturas de acordo com o perfil nutricional escolhido para adultos
    let perCapitaVeggiesKg = 0.250;
    let perCapitaCarbRawKg = 0.050; // 50g cru rende 125g cozido
    let perCapitaBeanRawKg = 0.030; // 30g cru rende 65g cozido
    let perCapitaMeatRawKg = 0.130; // 130g cru rende 100g cozido (fator de cocção ~0.77)
    let perCapitaFatLiters = 0.010; // 10ml azeite
    let perCapitaFruitKg = 0.120;   // 1 unidade fruta (120g)
    let costPerPlate = 7.20;        // R$ por prato

    if (mealProfile === 'high_protein') {
      perCapitaMeatRawKg = 0.170; // 170g cru (rende 130g)
      costPerPlate = 8.80;
    } else if (mealProfile === 'vegetarian') {
      perCapitaMeatRawKg = 0.000;
      perCapitaBeanRawKg = 0.070; // 70g cru (rende 150g leguminosas + tofu/ovos)
      perCapitaVeggiesKg = 0.300;
      costPerPlate = 6.40;
    } else if (mealProfile === 'light') {
      perCapitaCarbRawKg = 0.035;
      perCapitaVeggiesKg = 0.300;
      costPerPlate = 6.90;
    }

    // Totais em Quilos / Litros para a quantidade de pessoas
    const totalVeggiesKg = Number((effectiveMeals * perCapitaVeggiesKg).toFixed(1));
    const totalCarbRawKg = Number((effectiveMeals * perCapitaCarbRawKg).toFixed(1));
    const totalBeanRawKg = Number((effectiveMeals * perCapitaBeanRawKg).toFixed(1));
    const totalMeatRawKg = Number((effectiveMeals * perCapitaMeatRawKg).toFixed(1));
    const totalFatLiters = Number((effectiveMeals * perCapitaFatLiters).toFixed(2));
    const totalFruitKg = Number((effectiveMeals * perCapitaFruitKg).toFixed(1));
    const totalFruitUnits = effectiveMeals;

    const totalWeightKg = Number((
      totalVeggiesKg + (totalCarbRawKg * 2.5) + (totalBeanRawKg * 2.3) + (totalMeatRawKg * 0.77) + (totalFatLiters * 0.9) + totalFruitKg
    ).toFixed(1));

    const totalBudgetBRL = Number((effectiveMeals * costPerPlate).toFixed(2));
    const totalCaloriesMcal = Number(((effectiveMeals * adultPlateNutrition.totalKcal) / 1000).toFixed(1));
    const totalProteinKg = Number(((effectiveMeals * adultPlateNutrition.totalProt) / 1000).toFixed(1));
    const totalFiberKg = Number(((effectiveMeals * adultPlateNutrition.totalFiber) / 1000).toFixed(1));

    // Tempo de pré-preparo e panelas industriais recomendadas
    const industrialPansNeeded = Math.max(1, Math.ceil(effectiveMeals / 60));
    const prepStaffHours = (effectiveMeals * 0.08).toFixed(1);

    return {
      people,
      effectiveMeals,
      costPerPlate,
      totalVeggiesKg,
      totalCarbRawKg,
      totalBeanRawKg,
      totalMeatRawKg,
      totalFatLiters,
      totalFruitKg,
      totalFruitUnits,
      totalWeightKg,
      totalBudgetBRL,
      totalCaloriesMcal,
      totalProteinKg,
      totalFiberKg,
      industrialPansNeeded,
      prepStaffHours
    };
  }, [simPeopleCount, mealProfile, peopleSafetyMargin, adultPlateNutrition]);

  // -------------------------------------------------------------
  // MÓDULO 3: DADOS CONSOLIDADOS POR SUBCATEGORIA DE ALIMENTAÇÃO
  // -------------------------------------------------------------
  const subcategoryAnalytics = useMemo(() => {
    const totalVotes = alimentacaoVotes.length;

    const optionVoteCounts: Record<string, number> = {};
    alimentacaoVotes.forEach(v => {
      optionVoteCounts[v.mealId] = (optionVoteCounts[v.mealId] || 0) + 1;
    });

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
      adhesionRate: number;
      estimatedPortions: number;
      avoidedWasteKg: number;
      budgetSavedBRL: number;
      byTurno: Record<string, number>;
      bySala: Record<string, number>;
    }> = {
      'Almoço Completo': { options: [], totalVotes: 0, adhesionRate: 0, estimatedPortions: 0, avoidedWasteKg: 0, budgetSavedBRL: 0, byTurno: {}, bySala: {} },
      'Lanche / Fruta': { options: [], totalVotes: 0, adhesionRate: 0, estimatedPortions: 0, avoidedWasteKg: 0, budgetSavedBRL: 0, byTurno: {}, bySala: {} },
      'Vegetariano': { options: [], totalVotes: 0, adhesionRate: 0, estimatedPortions: 0, avoidedWasteKg: 0, budgetSavedBRL: 0, byTurno: {}, bySala: {} },
      'Sobremesa': { options: [], totalVotes: 0, adhesionRate: 0, estimatedPortions: 0, avoidedWasteKg: 0, budgetSavedBRL: 0, byTurno: {}, bySala: {} }
    };

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

    alimentacaoVotes.forEach(v => {
      const opt = alimentacaoOptions.find(m => m.id === v.mealId);
      const sub = opt ? getOptionSubcategory(opt) : 'Almoço Completo';
      const st = studentMap.get(v.matricula);

      const turno = st?.turno || v.turno || 'Integral';
      const sala = st?.sala || v.sala || '1º Ano';

      subcatMap[sub].byTurno[turno] = (subcatMap[sub].byTurno[turno] || 0) + 1;
      subcatMap[sub].bySala[sala] = (subcatMap[sub].bySala[sala] || 0) + 1;
    });

    SUBCATEGORIES.forEach(cfg => {
      const item = subcatMap[cfg.id];
      const adhesion = totalVotes > 0 ? item.totalVotes / totalVotes : 0.25;
      item.adhesionRate = Number((adhesion * 100).toFixed(1));

      const effectiveRatio = totalVotes > 0
        ? adhesion
        : cfg.id === 'Almoço Completo' ? 0.70 : cfg.id === 'Vegetariano' ? 0.15 : 0.50;

      item.estimatedPortions = Math.round(presentCount * effectiveRatio);

      const unservedAvoided = Math.max(0, totalStudents - item.estimatedPortions);
      item.avoidedWasteKg = Number((unservedAvoided * cfg.kgPerMeal).toFixed(1));
      item.budgetSavedBRL = Number((unservedAvoided * cfg.costPerMeal).toFixed(2));
    });

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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Card - Exclusivo Categoria ALIMENTAÇÃO & Nutricionista Profissional */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-700">
                Nutricionista RT &bull; Tomada de Decisão Baseada em Evidências
              </span>
              <span className="text-[11px] text-emerald-200 font-bold bg-white/10 px-2.5 py-0.5 rounded-md">
                Padrão CFN / Guia Alimentar
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Dashboard de Decisão Nutricional & Fórmula do Prato Saudável
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-3xl mt-1 leading-relaxed">
              Desenvolvido com embasamento técnico de <strong>Nutricionista Profissional</strong>: fórmula matemática para balancear pratos de adultos com macro e micronutrientes essenciais, e <strong>simulador em escala para qualquer quantidade de pessoas</strong>.
            </p>
          </div>

          {/* Session Selector */}
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
            <p className="text-[11px] text-emerald-300/80">Opções apuradas nas urnas</p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Desperdício Zero Poupado</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5 font-mono">
              {subcategoryAnalytics.subcatMap['Almoço Completo'].avoidedWasteKg} kg
            </p>
            <p className="text-[11px] text-emerald-300/80">Sobras limpas prevenidas</p>
          </div>
        </div>
      </div>

      {/* Navegação Superior de Abas: Destaque na Nutrição Balanceada e Simulador por Pessoas */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto gap-1">
        {/* Nova Aba Principal 1: Prato Balanceado & Fórmula da Nutricionista */}
        <button
          type="button"
          onClick={() => setActiveSubcategoryTab('nutri_formula')}
          className={`flex-1 min-w-[210px] flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubcategoryTab === 'nutri_formula'
              ? 'bg-emerald-600 text-white shadow-sm font-black'
              : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <i className="fas fa-certificate text-amber-300"></i>
          <span>Fórmula do Prato (Adulto)</span>
        </button>

        {/* Nova Aba Principal 2: Simulador de Pratos por Quantidade de Pessoas */}
        <button
          type="button"
          onClick={() => setActiveSubcategoryTab('people_sim')}
          className={`flex-1 min-w-[210px] flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubcategoryTab === 'people_sim'
              ? 'bg-indigo-600 text-white shadow-sm font-black'
              : 'text-slate-700 hover:text-indigo-700 hover:bg-indigo-50'
          }`}
        >
          <i className="fas fa-users-gear"></i>
          <span>Simulador para N Pessoas</span>
        </button>

        {/* Aba Visão Consolidada */}
        <button
          type="button"
          onClick={() => setActiveSubcategoryTab('all')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubcategoryTab === 'all'
              ? 'bg-white text-slate-900 shadow-sm font-black ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-chart-pie text-indigo-600"></i>
          <span>Visão Consolidada</span>
        </button>

        {/* 4 Subcategorias Oficiais */}
        {SUBCATEGORIES.map(cfg => {
          const isActive = activeSubcategoryTab === cfg.id;
          return (
            <button
              key={cfg.id}
              type="button"
              onClick={() => setActiveSubcategoryTab(cfg.id)}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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

        {/* Diretrizes CFN / PNAE */}
        <button
          type="button"
          onClick={() => setActiveSubcategoryTab('guidelines')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubcategoryTab === 'guidelines'
              ? 'bg-white text-purple-700 shadow-sm font-black ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-book-medical text-purple-600"></i>
          <span>Diretrizes CFN</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ABA 1: FÓRMULA DO PRATO SAUDÁVEL PARA ADULTO (NUTRICIONISTA)   */}
      {/* ------------------------------------------------------------- */}
      {activeSubcategoryTab === 'nutri_formula' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Card Teórico & Clínico da Nutricionista */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl">
                  <i className="fas fa-stethoscope"></i>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Metodologia Clínica & Coletiva
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    Fórmula da Nutrição Balanceada para o Adulto
                  </h3>
                </div>
              </div>

              <div className="text-right self-end sm:self-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Referência Oficial</span>
                <span className="text-xs font-black text-slate-800">Guia Alimentar MS &bull; CFN &bull; Harvard HSPH</span>
              </div>
            </div>

            {/* A Fórmula em Destaque Visual */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 p-6 rounded-2xl space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                <i className="fas fa-square-root-variable text-emerald-700"></i>
                Equação Áurea do Prato de um Adulto (Almoço / Jantar ~600 a 700 kcal):
              </span>

              <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs font-mono text-xs sm:text-sm font-bold text-slate-800 leading-relaxed overflow-x-auto">
                <div className="text-emerald-900 font-extrabold text-sm sm:text-base">
                  Prato Balanceado = 50% Vegetais/Hortaliças (250g) + 25% Carboidratos Complexos (125g) + 12.5% Leguminosas (65g) + 12.5% Proteína Nobre (100g) + 10g Lipídios Bons + Fruta Cítrica (120g)
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-900 block">50% Hortaliças (250g)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Folhosos crus (fibras/potássio) + legumes cozidos coloridos (vitamina A, C e antioxidantes).</p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-amber-100">
                  <span className="font-bold text-amber-900 block">25% Carboidratos (125g)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Arroz integral/parboilizado, batata-doce ou mandioca. Energia limpa de absorção lenta.</p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-cyan-100">
                  <span className="font-bold text-cyan-900 block">12.5% Leguminosas (65g)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Feijões, lentilha ou grão-de-bico. Fornece aminoácido lisina, ferro não-heme e fibras solúveis.</p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-pink-100">
                  <span className="font-bold text-pink-900 block">12.5% Proteína (100g)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Frango, peixe, carne magra, ovos ou tofu. Síntese e reparação muscular, ferro heme e B12.</p>
                </div>
              </div>
            </div>

            {/* Painel Duplo: Simulador Interativo do Prato vs Diagnóstico Bioquímico */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              
              {/* Coluna 1: Sliders de Montagem do Prato */}
              <div className="lg:col-span-7 space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Ajuste as Gramaturas para um Adulto:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPlateVeggies(250);
                      setPlateCarbs(125);
                      setPlateLegumes(65);
                      setPlateProtein(100);
                      setPlateFat(10);
                      setPlateFruit(120);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    Restaurar Padrão Ouro
                  </button>
                </div>

                {/* 1. Vegetais */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-800">🥦 Vegetais & Hortaliças (Meta: 250g / 50%):</span>
                    <span className="font-mono text-emerald-700 font-black">{plateVeggies}g ({adultPlateNutrition.vegPlatePct}%)</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    step="10"
                    value={plateVeggies}
                    onChange={e => setPlateVeggies(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* 2. Carboidratos */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-amber-800">🍚 Carboidratos Complexos (Meta: 125g / 25%):</span>
                    <span className="font-mono text-amber-700 font-black">{plateCarbs}g ({adultPlateNutrition.carbPlatePct}%)</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="300"
                    step="5"
                    value={plateCarbs}
                    onChange={e => setPlateCarbs(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* 3. Leguminosas */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-cyan-800">🫘 Leguminosas / Feijões (Meta: 65g / 12.5%):</span>
                    <span className="font-mono text-cyan-700 font-black">{plateLegumes}g ({adultPlateNutrition.legPlatePct}%)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="160"
                    step="5"
                    value={plateLegumes}
                    onChange={e => setPlateLegumes(Number(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                {/* 4. Proteína Nobre */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-pink-800">🍗 Proteína Nobre / Animal (Meta: 100g / 12.5%):</span>
                    <span className="font-mono text-pink-700 font-black">{plateProtein}g ({adultPlateNutrition.protPlatePct}%)</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="220"
                    step="5"
                    value={plateProtein}
                    onChange={e => setPlateProtein(Number(e.target.value))}
                    className="w-full accent-pink-600 cursor-pointer"
                  />
                </div>

                {/* 5 e 6: Gorduras e Fruta */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Azeite / Lipídios (g):</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={plateFat}
                      onChange={e => setPlateFat(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Fruta / Vit C (g):</label>
                    <input
                      type="number"
                      min="0"
                      max="250"
                      value={plateFruit}
                      onChange={e => setPlateFruit(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Coluna 2: Parecer Clínico da Nutricionista & Gráfico Donut */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-lg border border-slate-800 space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Diagnóstico Nutricional
                    </span>
                    <span className="text-xs font-bold text-slate-300 font-mono">
                      {adultPlateNutrition.totalMealGrams}g totais
                    </span>
                  </div>

                  {/* Score IBN */}
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Índice de Balanceamento</span>
                      <span className="text-4xl font-black font-mono text-white">
                        {adultPlateNutrition.ibnScore}<span className="text-lg font-normal text-slate-400">/100</span>
                      </span>
                    </div>

                    <div className="w-24 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={adultPlateNutrition.plateDonutData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={26}
                            outerRadius={40}
                            paddingAngle={3}
                          >
                            {adultPlateNutrition.plateDonutData.map((d, i) => (
                              <Cell key={`cell-${i}`} fill={d.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Badge de Parecer */}
                  <div className={`p-3 rounded-xl border text-xs font-bold mt-2 ${adultPlateNutrition.clinicalBadgeBg}`}>
                    <div className="flex items-center gap-1.5">
                      <i className="fas fa-user-doctor"></i>
                      <span>{adultPlateNutrition.clinicalVerdict}</span>
                    </div>
                    <p className="text-[11px] font-normal mt-1 leading-relaxed opacity-90">
                      {adultPlateNutrition.clinicalAdvice}
                    </p>
                  </div>
                </div>

                {/* Métricas de Macronutrientes por Prato */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-xs">
                  <div className="bg-white/10 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block">Energia</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">{adultPlateNutrition.totalKcal} kcal</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block">Proteína</span>
                    <span className="font-mono font-bold text-pink-300 text-sm">{adultPlateNutrition.totalProt}g</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block">Fibras</span>
                    <span className="font-mono font-bold text-emerald-300 text-sm">{adultPlateNutrition.totalFiber}g</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block">Sódio Est.</span>
                    <span className="font-mono font-bold text-slate-200 text-sm">{adultPlateNutrition.totalSodium}mg</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 2: SIMULADOR DE PRATOS PARA UMA CERTA QUANTIDADE DE PESSOAS */}
      {/* ------------------------------------------------------------- */}
      {activeSubcategoryTab === 'people_sim' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-2">
              <i className="fas fa-users-gear"></i> Escala & Produção em Coletividade
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Simulador de Produção de Pratos para Múltiplas Pessoas
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Defina a quantidade de comensais adultos para converter a fórmula nutricional em <strong>quilos de alimentos crus</strong>, lista de compras e ordem de pré-preparo para as cozinheiras.
            </p>
          </div>

          {/* Painel de Controles da Escala */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6">
              
              {/* Slider de Pessoas */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-700 uppercase tracking-wider">
                    Quantidade de Pessoas (Comensais):
                  </span>
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm border border-indigo-200">
                    {simPeopleCount} pessoas
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="1500"
                  step="5"
                  value={simPeopleCount}
                  onChange={e => setSimPeopleCount(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />

                {/* Atalhos Rápidos */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '1 Pessoa', val: 1 },
                    { label: `Chamada Hoje (${presentCount})`, val: presentCount || 16 },
                    { label: '50 Pessoas', val: 50 },
                    { label: '100 Pessoas', val: 100 },
                    { label: '300 Pessoas', val: 300 },
                    { label: '500 Pessoas', val: 500 },
                    { label: '1.000 Pessoas', val: 1000 }
                  ].map(sc => (
                    <button
                      key={sc.label}
                      type="button"
                      onClick={() => setSimPeopleCount(sc.val)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                        simPeopleCount === sc.val
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Perfil Nutricional da Refeição */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Perfil Nutricional do Cardápio:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'standard', title: 'Almoço Balanceado Padrão', desc: 'Frango/Carne + Arroz + Feijão + Salada' },
                    { id: 'high_protein', title: 'Hiperproteico (+130g carne)', desc: 'Para atividades físicas ou esportivas' },
                    { id: 'vegetarian', title: 'Vegetariano Estrito', desc: 'Leguminosas nobres, ovos e tofu' },
                    { id: 'light', title: 'Baixo Carboidrato / Leve', desc: 'Mais hortaliças e menos amiláceos' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setMealProfile(p.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        mealProfile === p.id
                          ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300/40 text-indigo-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200'
                      }`}
                    >
                      <span className="block font-black text-xs">{p.title}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Margem de Segurança da Cozinha */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">Margem Técnica de Segurança da Cozinha:</span>
                  <span className="font-mono font-bold text-emerald-700">+{peopleSafetyMargin}% ({scaledSimulation.effectiveMeals} pratos)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={peopleSafetyMargin}
                  onChange={e => setPeopleSafetyMargin(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

            </div>

            {/* Coluna de Resultados Consolidados da Escala */}
            <div className="lg:col-span-6 space-y-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Ordem de Produção Consolidada
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {scaledSimulation.effectiveMeals} refeições prontas
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
                  <div className="bg-white/10 p-3 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Peso Cozido</span>
                    <span className="text-xl font-black font-mono text-white mt-0.5">{scaledSimulation.totalWeightKg} kg</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Energia Total</span>
                    <span className="text-xl font-black font-mono text-amber-300 mt-0.5">{scaledSimulation.totalCaloriesMcal} Mcal</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Proteína Pura</span>
                    <span className="text-xl font-black font-mono text-pink-300 mt-0.5">{scaledSimulation.totalProteinKg} kg</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Orçamento Total</span>
                    <span className="text-xl font-black font-mono text-emerald-400 mt-0.5">R$ {scaledSimulation.totalBudgetBRL}</span>
                  </div>
                </div>
              </div>

              {/* Ficha Técnica de Insumos para N Pessoas */}
              <div className="space-y-2 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block mb-2">
                  Lista de Insumos Brutos (Ordem de Compras & Descongelamento):
                </span>

                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                    <span className="text-slate-300">🥬 Hortaliças, Folhosos & Legumes:</span>
                    <span className="text-emerald-400 font-bold">{scaledSimulation.totalVeggiesKg} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                    <span className="text-slate-300">🍚 Arroz Agulhinha Cru:</span>
                    <span className="text-amber-300 font-bold">{scaledSimulation.totalCarbRawKg} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                    <span className="text-slate-300">🫘 Feijão Carioca / Preto Cru:</span>
                    <span className="text-cyan-300 font-bold">{scaledSimulation.totalBeanRawKg} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                    <span className="text-slate-300">🍗 Proteína Nobre Crua (Carnes/Frango):</span>
                    <span className="text-pink-300 font-bold">{scaledSimulation.totalMeatRawKg} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                    <span className="text-slate-300">🫒 Azeite Extravirgem / Óleo Saudável:</span>
                    <span className="text-slate-200 font-bold">{scaledSimulation.totalFatLiters} L</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-300">🍊 Frutas Cítricas da Época:</span>
                    <span className="text-emerald-300 font-bold">{scaledSimulation.totalFruitUnits} un ({scaledSimulation.totalFruitKg} kg)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Capacidade operacional: {scaledSimulation.industrialPansNeeded} caldeirões industriais</span>
                <span>Tempo est. de cocção: ~2h30min</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 3: VISÃO CONSOLIDADA DA ALIMENTAÇÃO                       */}
      {/* ------------------------------------------------------------- */}
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

      {/* ------------------------------------------------------------- */}
      {/* ABAS ESPECÍFICAS: ALMOÇO COMPLETO, LANCHE, VEGETARIANO, SOBREMESA */}
      {/* ------------------------------------------------------------- */}
      {activeSubcategoryTab !== 'all' && activeSubcategoryTab !== 'simulator' && activeSubcategoryTab !== 'guidelines' && activeSubcategoryTab !== 'nutri_formula' && activeSubcategoryTab !== 'people_sim' && (
        <SubcategoryDetailView
          subcategory={activeSubcategoryTab}
          data={subcategoryAnalytics.subcatMap[activeSubcategoryTab]}
          presentCount={presentCount}
          totalStudents={totalStudents}
          ingredients={getSubcategoryIngredients(activeSubcategoryTab, subcategoryAnalytics.subcatMap[activeSubcategoryTab].estimatedPortions)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 8: DIRETRIZES PNAE & CFN                                  */}
      {/* ------------------------------------------------------------- */}
      {activeSubcategoryTab === 'guidelines' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full mb-2">
              <i className="fas fa-certificate"></i> CFN &bull; PNAE / FNDE
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Diretrizes Técnicas e Normas Clínicas da Nutricionista
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Orientações operacionais para atendimento integral às resoluções do Conselho Federal de Nutricionistas (CFN) e Lei Federal da Merenda Escolar (Lei 11.947/2009).
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

// Insumos técnicos recomendados por subcategoria
function getSubcategoryIngredients(subcat: FoodSubcategory, portions: number) {
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
}
