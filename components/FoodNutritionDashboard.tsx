import React, { useState, useMemo } from 'react';
import { MealOption, VotingSession, Student, AttendanceRecord } from '../types';

interface FoodNutritionDashboardProps {
  students: Student[];
  attendanceRecords?: AttendanceRecord[];
  mealOptions: MealOption[];
  votingSessions?: VotingSession[];
  onAddMeal: (meal: MealOption) => void;
  onAddVotingSession?: (session: VotingSession) => void;
  currentSchoolId?: string | null;
}

// 1. Tipos de Carnes Pré-definidos com Perfil Nutricional Técnico (baseado em TACO/PNAE)
interface MeatTypeConfig {
  id: 'vermelha' | 'branca' | 'peixe' | 'figado';
  name: string;
  categoryLabel: string;
  badgeColor: string;
  icon: string;
  sampleDish: string;
  description: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  ironMg: number;
  keyNutrient: string;
  nutritionalHighlight: string;
  recommendedPortionGrams: number; // Porção per capita recomendada na merenda escolar
}

const MEAT_TYPES: MeatTypeConfig[] = [
  {
    id: 'vermelha',
    name: 'Carne Vermelha',
    categoryLabel: 'Bovino Magro',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: 'fa-drumstick-bite',
    sampleDish: 'Iscas de Patinho Bovino com Cenoura & Ervas',
    description: 'Corte magro bovino ensopado ou grelhado com temperos naturais e legumes.',
    caloriesPer100g: 219,
    proteinPer100g: 27,
    fatPer100g: 11,
    ironMg: 3.2,
    keyNutrient: 'Ferro Heme & Vitamina B12',
    nutritionalHighlight: 'Alta biodisponibilidade de ferro para prevenção de anemia e suporte ao crescimento muscular.',
    recommendedPortionGrams: 100
  },
  {
    id: 'branca',
    name: 'Carne Branca',
    categoryLabel: 'Aves / Peito de Frango',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: 'fa-feather-pointed',
    sampleDish: 'Filé de Frango Grelhado com Ervas Finas & Milho',
    description: 'Peito de frango selecionado, grelhado com cúrcuma, orégano e fio de azeite.',
    caloriesPer100g: 165,
    proteinPer100g: 31,
    fatPer100g: 3.6,
    ironMg: 1.1,
    keyNutrient: 'Proteína Magra & Niacina',
    nutritionalHighlight: 'Digestibilidade rápida e alto teor proteico com baixíssimo índice de gorduras saturadas.',
    recommendedPortionGrams: 110
  },
  {
    id: 'peixe',
    name: 'Peixe',
    categoryLabel: 'Pescado Fresco',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    icon: 'fa-fish',
    sampleDish: 'Filé de Tilápia Assada ao Limão & Azeite',
    description: 'Pescado fresco de água doce ou salgada, assado ao forno com ervas aromáticas e tomate.',
    caloriesPer100g: 128,
    proteinPer100g: 24,
    fatPer100g: 2.7,
    ironMg: 0.9,
    keyNutrient: 'Ômega-3, Fósforo & Iodo',
    nutritionalHighlight: 'Ácidos graxos essenciais que estimulam o foco cognitivo, a memória e a saúde cerebral dos estudantes.',
    recommendedPortionGrams: 120
  },
  {
    id: 'figado',
    name: 'Fígado',
    categoryLabel: 'Bovino Selecionado',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: 'fa-shield-halved',
    sampleDish: 'Fígado Bovino Acebolado com Cheiro-Verde',
    description: 'Corte tradicional em tiras macias, marinado no limão e salteado com cebola roxa e cheiro-verde.',
    caloriesPer100g: 165,
    proteinPer100g: 26,
    fatPer100g: 4.8,
    ironMg: 6.8, // Mais que o dobro da carne vermelha!
    keyNutrient: 'Ferro Concentrado & Vitamina A (500% IDR)',
    nutritionalHighlight: 'Superalimento estratégico da merenda escolar: máxima absorção de ferro contra fadiga e deficiências.',
    recommendedPortionGrams: 90
  }
];

// 2. Opções de Legumes e Vegetais Pré-cadastrados
interface VegetableOption {
  id: string;
  name: string;
  calories: number;
  fibersG: number;
  portionG: number;
  highlight: string;
}

const VEGETABLE_OPTIONS: VegetableOption[] = [
  { id: 'leg-cenoura-vagem', name: 'Cenoura & Vagem no Vapor', calories: 45, fibersG: 3.2, portionG: 120, highlight: 'Betacaroteno & Fibras insolúveis' },
  { id: 'leg-brocolis-couveflor', name: 'Brócolis & Couve-flor ao Alho', calories: 38, fibersG: 3.8, portionG: 120, highlight: 'Cálcio vegetal & Sulforafano' },
  { id: 'leg-pure-abobora', name: 'Purê de Abóbora Cabotiá', calories: 55, fibersG: 2.6, portionG: 100, highlight: 'Antioxidantes & Potássio' },
  { id: 'leg-salada-colorida', name: 'Salada Crua: Beterraba, Tomate & Alface', calories: 30, fibersG: 2.4, portionG: 80, highlight: 'Hidratação celular & Licopeno' },
  { id: 'leg-couve-refogada', name: 'Couve Manteiga Refogada no Azeite', calories: 42, fibersG: 3.5, portionG: 90, highlight: 'Clorofila, Ácido Fólico & Magnésio' }
];

// 3. Opções de Frutas Pré-cadastradas para Sobremesa Nutritiva
interface FruitOption {
  id: string;
  name: string;
  calories: number;
  vitCMg: number;
  portionG: number;
  highlight: string;
}

const FRUIT_OPTIONS: FruitOption[] = [
  { id: 'fruta-laranja', name: 'Laranja Pêra em Gomos', calories: 47, vitCMg: 53, portionG: 120, highlight: 'Vitamina C que multiplica absorção do Ferro' },
  { id: 'fruta-banana', name: 'Banana Prata', calories: 89, vitCMg: 9, portionG: 100, highlight: 'Potássio & Energia gradual' },
  { id: 'fruta-maca', name: 'Maçã Nacional', calories: 52, vitCMg: 6, portionG: 110, highlight: 'Pectina solúvel & Saciedade' },
  { id: 'fruta-melancia', name: 'Melancia Fresca Fatiada', calories: 30, vitCMg: 8, portionG: 130, highlight: 'Hidratação (92% de água) & Licopeno' },
  { id: 'fruta-tangerina', name: 'Tangerina / Mexerica da Estação', calories: 53, vitCMg: 27, portionG: 110, highlight: 'Refrescante & Rica em Fibras' }
];

// 4. Base de Carboidratos Padrão Merenda Escolar (Arroz & Feijão)
const CARB_BASE = {
  name: 'Arroz Integral/Branco com Feijão Carioca',
  calories: 240,
  proteinG: 7.5,
  carbG: 46,
  fiberG: 6.2,
  portionG: 180,
  description: 'Dupla tradicional PNAE com todos os aminoácidos essenciais (lisina + metionina).'
};

export const FoodNutritionDashboard: React.FC<FoodNutritionDashboardProps> = ({
  students,
  attendanceRecords = [],
  mealOptions,
  votingSessions = [],
  onAddMeal,
  onAddVotingSession,
  currentSchoolId
}) => {
  // Data atual no formato YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Alunos presentes no dia de hoje (baseado na chamada realizada)
  const attendanceToday = useMemo(() => {
    const record = attendanceRecords.find(a => a.date === todayStr);
    if (record && record.presentMatriculas) {
      return record.presentMatriculas.length;
    }
    // Fallback: se hoje ainda não teve chamada, busca o último registro disponível
    if (attendanceRecords.length > 0) {
      const sorted = [...attendanceRecords].sort((a, b) => b.date.localeCompare(a.date));
      return sorted[0].presentMatriculas?.length || 0;
    }
    return 0;
  }, [attendanceRecords, todayStr]);

  const defaultStudentsCount = attendanceToday > 0 ? attendanceToday : (students.length > 0 ? students.length : 30);

  // Estados do Simulador
  const [simulatedStudents, setSimulatedStudents] = useState<number>(defaultStudentsCount);
  const [selectedMeatId, setSelectedMeatId] = useState<'vermelha' | 'branca' | 'peixe' | 'figado'>('vermelha');
  const [selectedVegetableId, setSelectedVegetableId] = useState<string>('leg-cenoura-vagem');
  const [selectedFruitId, setSelectedFruitId] = useState<string>('fruta-laranja');
  const [activeSubTab, setActiveSubTab] = useState<'cedulas' | 'prato_balanceado' | 'simulador'>('cedulas');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Objetos selecionados atualmente
  const currentMeat = useMemo(() => MEAT_TYPES.find(m => m.id === selectedMeatId)!, [selectedMeatId]);
  const currentVegetable = useMemo(() => VEGETABLE_OPTIONS.find(v => v.id === selectedVegetableId)!, [selectedVegetableId]);
  const currentFruit = useMemo(() => FRUIT_OPTIONS.find(f => f.id === selectedFruitId)!, [selectedFruitId]);

  // Cálculos Nutricionais por Prato Individual
  const plateNutrition = useMemo(() => {
    const meatCalories = Math.round((currentMeat.caloriesPer100g * currentMeat.recommendedPortionGrams) / 100);
    const meatProtein = Math.round((currentMeat.proteinPer100g * currentMeat.recommendedPortionGrams) / 100);
    const meatFat = Math.round((currentMeat.fatPer100g * currentMeat.recommendedPortionGrams) / 100);

    const totalCalories = meatCalories + CARB_BASE.calories + currentVegetable.calories + currentFruit.calories;
    const totalProtein = meatProtein + CARB_BASE.proteinG + 2; // +2g vegetais
    const totalCarbs = CARB_BASE.carbG + 10 + 15; // arroz/feijão + legumes + fruta
    const totalFat = meatFat + 3; // gorduras totais incluindo azeite/preparo
    const totalFibers = CARB_BASE.fiberG + currentVegetable.fibersG + 2; // fibras totais

    const totalIron = (currentMeat.ironMg + 2.1).toFixed(1); // carne + feijão

    // Faixa recomendada pelo PNAE (FNDE) para refeição escolar: 450 a 650 kcal
    let statusLabel = 'Equilíbrio Ideal PNAE';
    let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (totalCalories < 450) {
      statusLabel = 'Leve / Complementar';
      statusColor = 'text-sky-700 bg-sky-50 border-sky-200';
    } else if (totalCalories > 650) {
      statusLabel = 'Alta Densidade Energética';
      statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
    }

    return {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFibers,
      totalIron,
      statusLabel,
      statusColor
    };
  }, [currentMeat, currentVegetable, currentFruit]);

  // Cálculos em Escala Coletiva para os Alunos (Simulação de Cozinha)
  const collectiveScale = useMemo(() => {
    const count = Math.max(1, simulatedStudents);

    // Quantidades brutas recomendadas com fator de cocção/perda de aparas
    const meatKg = ((currentMeat.recommendedPortionGrams * count) / 1000).toFixed(1);
    const vegKg = ((currentVegetable.portionG * count) / 1000).toFixed(1);
    const riceKg = (((CARB_BASE.portionG * 0.5) * count) / 1000).toFixed(1);
    const beansKg = (((CARB_BASE.portionG * 0.3) * count) / 1000).toFixed(1);
    const fruitsUnits = count;
    const totalCaloriesCollective = (plateNutrition.totalCalories * count).toLocaleString('pt-BR');

    return {
      count,
      meatKg,
      vegKg,
      riceKg,
      beansKg,
      fruitsUnits,
      totalCaloriesCollective
    };
  }, [simulatedStudents, currentMeat, currentVegetable, plateNutrition.totalCalories]);

  // Mensagem temporária de feedback
  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // 1. Ação para Criar Cédula de Votação individual para uma Carne
  const handleCreateMeatBallot = (meat: MeatTypeConfig) => {
    const newMeal: MealOption = {
      id: `meal-carne-${meat.id}-${Date.now()}`,
      name: meat.sampleDish,
      description: `${meat.description} Acompanha ${currentVegetable.name} e fruta fresca (${currentFruit.name}).`,
      category: 'Alimentação',
      calories: `${Math.round((meat.caloriesPer100g * meat.recommendedPortionGrams) / 100 + CARB_BASE.calories + currentVegetable.calories)} kcal`,
      active: true,
      mealType: 'Almoço',
      schoolId: currentSchoolId || undefined
    };

    onAddMeal(newMeal);

    // Se houver manipulador de sessão de votação, cria a sessão na categoria Alimentação
    if (onAddVotingSession) {
      const newSession: VotingSession = {
        id: `session-alim-${meat.id}-${Date.now()}`,
        title: `Cardápio Escolar: ${meat.name} (${meat.categoryLabel})`,
        description: `Votação para escolha da merenda balanceada com ${meat.sampleDish}.`,
        category: 'Alimentação',
        date: todayStr,
        closingTime: '11:30',
        active: true,
        optionIds: [newMeal.id],
        schoolId: currentSchoolId || undefined,
        createdAt: new Date().toISOString()
      };
      onAddVotingSession(newSession);
    }

    showFeedback(`Cédula de votação para "${meat.name}" criada com sucesso na Categoria ALIMENTAÇÃO!`);
  };

  // 2. Ação para Criar Votação Completa do Prato Simulado
  const handlePublishSimulatedPlate = () => {
    const mealName = `Prato Nutritivo: ${currentMeat.name} com ${currentVegetable.name}`;
    const newMeal: MealOption = {
      id: `meal-simulado-${Date.now()}`,
      name: mealName,
      description: `Proteína: ${currentMeat.sampleDish}. Legumes: ${currentVegetable.name}. Sobremesa: ${currentFruit.name}. Base: ${CARB_BASE.name}.`,
      category: 'Alimentação',
      calories: `${plateNutrition.totalCalories} kcal`,
      active: true,
      mealType: 'Almoço',
      schoolId: currentSchoolId || undefined
    };

    onAddMeal(newMeal);

    if (onAddVotingSession) {
      const newSession: VotingSession = {
        id: `session-simulado-${Date.now()}`,
        title: `Votação do Cardápio: ${currentMeat.name} Balanceado`,
        description: `Refeição planejada para ${simulatedStudents} alunos. ${plateNutrition.totalCalories} kcal com ${plateNutrition.totalProtein}g de proteína.`,
        category: 'Alimentação',
        date: todayStr,
        closingTime: '12:00',
        active: true,
        optionIds: [newMeal.id],
        schoolId: currentSchoolId || undefined,
        createdAt: new Date().toISOString()
      };
      onAddVotingSession(newSession);
    }

    showFeedback(`Prato balanceado publicado na urna de votação da escola para ${simulatedStudents} alunos!`);
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn min-w-0 pb-12">
      {/* Toast de Feedback */}
      {feedbackMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-semibold text-sm animate-bounce">
          <i className="fas fa-check-circle text-lg"></i>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* CABEÇALHO DO DASHBOARD DE ALIMENTAÇÃO */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 text-white pointer-events-none">
          <i className="fas fa-utensils text-9xl"></i>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/30 flex items-center gap-1.5">
                <i className="fas fa-apple-whole text-amber-300"></i>
                Categoria Oficial: Alimentação
              </span>
              <span className="bg-emerald-500/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                Padrão Nutricional PNAE
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Dashboard de Alimentação & Cardápio Inteligente
            </h1>
            <p className="text-orange-100 text-xs sm:text-sm leading-relaxed">
              Gestão de carnes (vermelha, branca, peixe e fígado), legumes e frutas. Planejamento de pratos balanceados para a quantidade de alunos presentes e simulador calórico da cozinha escolar.
            </p>
          </div>

          {/* Card Rápido de Presença Escolar Hoje */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4 min-w-[240px]">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white text-xl shadow-inner">
              <i className="fas fa-user-check"></i>
            </div>
            <div>
              <div className="text-[11px] font-bold text-orange-200 uppercase tracking-wide">
                Frequência Confirmada Hoje
              </div>
              <div className="text-2xl font-black text-white">
                {attendanceToday} <span className="text-xs font-medium text-orange-200">alunos presentes</span>
              </div>
              <div className="text-[10px] text-white/80">
                {students.length} estudantes matriculados
              </div>
            </div>
          </div>
        </div>

        {/* SUB-ABAS DE NAVEGAÇÃO INTERNA */}
        <div className="mt-8 pt-4 border-t border-white/20 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('cedulas')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'cedulas'
                ? 'bg-white text-orange-700 shadow-md font-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <i className="fas fa-id-card-clip"></i>
            <span>1. Cédulas de Carnes & Alimentos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('prato_balanceado')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'prato_balanceado'
                ? 'bg-white text-orange-700 shadow-md font-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <i className="fas fa-circle-dot"></i>
            <span>2. Prato Balanceado da Nutricionista</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('simulador')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'simulador'
                ? 'bg-white text-orange-700 shadow-md font-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <i className="fas fa-calculator"></i>
            <span>3. Simulador de Calorias & Porções</span>
          </button>
        </div>
      </div>

      {/* CONTEÚDO 1: CÉDULAS DE CARNES E OPÇÕES DA CATEGORIA ALIMENTAÇÃO */}
      {activeSubTab === 'cedulas' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fas fa-drumstick-bite text-orange-600"></i>
                Cédulas Oficiais para Carnes e Proteínas
              </h2>
              <p className="text-xs text-slate-500">
                Escolha o tipo de carne para cadastrar cédula imediata na urna da Categoria ALIMENTAÇÃO.
              </p>
            </div>
            <div className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Legumes ativos: <span className="font-black text-slate-800">{currentVegetable.name}</span> | Fruta: <span className="font-black text-slate-800">{currentFruit.name}</span>
            </div>
          </div>

          {/* Grid das 4 Cédulas de Carnes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {MEAT_TYPES.map(meat => {
              const isSelected = selectedMeatId === meat.id;
              const caloriesPortion = Math.round((meat.caloriesPer100g * meat.recommendedPortionGrams) / 100);

              return (
                <div
                  key={meat.id}
                  className={`bg-white rounded-2xl p-5 border-2 transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                    isSelected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${meat.badgeColor}`}>
                        {meat.categoryLabel}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <i className={`fas ${meat.icon}`}></i>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                        {meat.name}
                      </h3>
                      <p className="text-xs font-semibold text-orange-600 mt-0.5">
                        {meat.sampleDish}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {meat.description}
                    </p>

                    {/* Ficha Técnica Rápida */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span>Porção escolar:</span>
                        <span className="font-bold text-slate-800">{meat.recommendedPortionGrams}g</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Energia:</span>
                        <span className="font-bold text-slate-800">{caloriesPortion} kcal</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Proteínas:</span>
                        <span className="font-bold text-emerald-700">{Math.round((meat.proteinPer100g * meat.recommendedPortionGrams) / 100)}g</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Ferro:</span>
                        <span className="font-bold text-rose-700">{meat.ironMg} mg</span>
                      </div>
                      <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500 font-medium">
                        Destaque: <span className="text-slate-700 font-bold">{meat.keyNutrient}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação na Cédula */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMeatId(meat.id)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ Selecionada no Simulador' : 'Selecionar Carne'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateMeatBallot(meat)}
                      className="w-full py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <i className="fas fa-plus-circle"></i>
                      <span>Criar Cédula de Votação</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seleção Rápida de Legumes e Frutas Pré-cadastrados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Legumes Pré-cadastrados */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <i className="fas fa-carrot text-amber-500"></i>
                  Legumes e Acompanhamentos Pré-cadastrados
                </h3>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                  {VEGETABLE_OPTIONS.length} opções
                </span>
              </div>

              <div className="space-y-2">
                {VEGETABLE_OPTIONS.map(veg => (
                  <label
                    key={veg.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedVegetableId === veg.id
                        ? 'border-amber-500 bg-amber-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="vegetable_choice"
                        checked={selectedVegetableId === veg.id}
                        onChange={() => setSelectedVegetableId(veg.id)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">{veg.name}</div>
                        <div className="text-[10px] text-slate-500">{veg.highlight}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-700">{veg.calories} kcal</span>
                      <div className="text-[10px] text-slate-400">{veg.portionG}g porção</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Frutas Pré-cadastradas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <i className="fas fa-apple-whole text-rose-500"></i>
                  Frutas Pré-cadastradas para Sobremesa
                </h3>
                <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                  {FRUIT_OPTIONS.length} frutas
                </span>
              </div>

              <div className="space-y-2">
                {FRUIT_OPTIONS.map(fruit => (
                  <label
                    key={fruit.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedFruitId === fruit.id
                        ? 'border-rose-500 bg-rose-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="fruit_choice"
                        checked={selectedFruitId === fruit.id}
                        onChange={() => setSelectedFruitId(fruit.id)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">{fruit.name}</div>
                        <div className="text-[10px] text-slate-500">{fruit.highlight}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-rose-700">{fruit.calories} kcal</span>
                      <div className="text-[10px] text-slate-400">{fruit.vitCMg}mg Vit. C</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO 2: PRATOS BALANCEADOS PARA A QUANTIDADE DE ALUNOS PRESENTES NO DIA */}
      {activeSubTab === 'prato_balanceado' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Diretriz Técnica PNAE / Nutricionista
                </span>
                <h2 className="text-xl font-black text-slate-800 mt-2">
                  Prato Balanceado para os Alunos Presentes Hoje
                </h2>
                <p className="text-xs text-slate-500">
                  Dimensionamento exato de compras e cocção para evitar sobras e desperdício de alimentos.
                </p>
              </div>

              {/* Botão de sincronizar com a chamada */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Alunos Presentes no Dia:</div>
                  <div className="text-lg font-black text-slate-800 font-mono">
                    {attendanceToday > 0 ? attendanceToday : simulatedStudents} alunos
                  </div>
                </div>
                {attendanceToday === 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded">
                    Simulação ativa
                  </span>
                )}
              </div>
            </div>

            {/* A REGRA DE OURO DO PRATO BALANCEADO */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-emerald-950">
                <div className="text-xs font-black uppercase text-emerald-700 tracking-wider">50% do Prato</div>
                <div className="text-sm font-black mt-1">Legumes & Vegetais</div>
                <div className="text-xs text-emerald-800 mt-1">
                  Fibras, micronutrientes, vitaminas A, C e minerais para imunidade e digestão.
                </div>
                <div className="mt-3 text-xs font-bold text-emerald-900 bg-white/70 px-2.5 py-1 rounded-lg inline-block">
                  {currentVegetable.name}
                </div>
              </div>

              <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 text-rose-950">
                <div className="text-xs font-black uppercase text-rose-700 tracking-wider">25% do Prato</div>
                <div className="text-sm font-black mt-1">Proteínas de Alto Valor</div>
                <div className="text-xs text-rose-800 mt-1">
                  Construção tecidual, reparo muscular e reserva de ferro heme essencial.
                </div>
                <div className="mt-3 text-xs font-bold text-rose-900 bg-white/70 px-2.5 py-1 rounded-lg inline-block">
                  {currentMeat.name} ({currentMeat.recommendedPortionGrams}g)
                </div>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-amber-950">
                <div className="text-xs font-black uppercase text-amber-700 tracking-wider">25% do Prato</div>
                <div className="text-sm font-black mt-1">Carboidratos Complexos</div>
                <div className="text-xs text-amber-800 mt-1">
                  Arroz e feijão com perfil completo de aminoácidos para energia sustentada.
                </div>
                <div className="mt-3 text-xs font-bold text-amber-900 bg-white/70 px-2.5 py-1 rounded-lg inline-block">
                  Arroz & Feijão (180g)
                </div>
              </div>

              <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 text-sky-950">
                <div className="text-xs font-black uppercase text-sky-700 tracking-wider">+ Sobremesa</div>
                <div className="text-sm font-black mt-1">Fruta da Estação</div>
                <div className="text-xs text-sky-800 mt-1">
                  Vitamina C sinérgica que potencializa em 4x a absorção de ferro da refeição.
                </div>
                <div className="mt-3 text-xs font-bold text-sky-900 bg-white/70 px-2.5 py-1 rounded-lg inline-block">
                  {currentFruit.name}
                </div>
              </div>
            </div>

            {/* TABELA DE DIMENSIONAMENTO DA COZINHA PARA OS ALUNOS PRESENTES */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                <i className="fas fa-kitchen-set text-orange-600"></i>
                Planejamento de Preparo na Cozinha (Para {attendanceToday > 0 ? attendanceToday : simulatedStudents} Alunos)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold uppercase">Carne / Proteína Bruta:</div>
                  <div className="text-2xl font-black text-rose-700 mt-1">
                    {collectiveScale.meatKg} <span className="text-xs font-medium text-slate-600">kg</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Tipo: {currentMeat.name}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold uppercase">Legumes Frescos:</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">
                    {collectiveScale.vegKg} <span className="text-xs font-medium text-slate-600">kg</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{currentVegetable.name}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold uppercase">Arroz & Feijão (Cozidos):</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {(Number(collectiveScale.riceKg) + Number(collectiveScale.beansKg)).toFixed(1)} <span className="text-xs font-medium text-slate-600">kg</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Base completa de grãos</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold uppercase">Frutas de Sobremesa:</div>
                  <div className="text-2xl font-black text-sky-700 mt-1">
                    {collectiveScale.fruitsUnits} <span className="text-xs font-medium text-slate-600">unidades</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{currentFruit.name}</div>
                </div>
              </div>

              {/* Botão de Ação Direta */}
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={handlePublishSimulatedPlate}
                  className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <i className="fas fa-check-to-slot"></i>
                  <span>Publicar Cardápio Balanceado para Votação</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO 3: SIMULADOR DE CALORIAS E PRATOS PARA UMA CERTA QUANTIDADE DE ALUNOS */}
      {activeSubTab === 'simulador' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                Simulador Nutricional Coletivo
              </span>
              <h2 className="text-xl font-black text-slate-800 mt-2">
                Simulador de Calorias, Nutrientes & Dimensionamento
              </h2>
              <p className="text-xs text-slate-500">
                Ajuste a quantidade de alunos para estimar instantaneamente calorias totais, gramaturas e rendimento da cozinha.
              </p>
            </div>

            {/* SELETOR INTERATIVO DE QUANTIDADE DE ALUNOS */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-users text-orange-600"></i>
                  Quantidade de Alunos a Simular:
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-orange-600 font-mono">
                    {simulatedStudents}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">pratos</span>
                </div>
              </div>

              {/* Slider Numérico */}
              <input
                type="range"
                min="1"
                max={Math.max(100, students.length * 2)}
                value={simulatedStudents}
                onChange={e => setSimulatedStudents(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />

              {/* Atalhos Rápidos */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[15, 30, 50, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSimulatedStudents(val)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      simulatedStudents === val
                        ? 'bg-orange-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val} alunos
                  </button>
                ))}

                {attendanceToday > 0 && (
                  <button
                    type="button"
                    onClick={() => setSimulatedStudents(attendanceToday)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                  >
                    <i className="fas fa-user-check"></i>
                    <span>Usar Presentes de Hoje ({attendanceToday})</span>
                  </button>
                )}

                {students.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSimulatedStudents(students.length)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-900"
                  >
                    Total Escola ({students.length})
                  </button>
                )}
              </div>
            </div>

            {/* SELETORES DO PRATO NO SIMULADOR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Carne */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  1. Tipo de Carne / Proteína:
                </label>
                <select
                  value={selectedMeatId}
                  onChange={e => setSelectedMeatId(e.target.value as any)}
                  className="w-full p-2.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                >
                  {MEAT_TYPES.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.categoryLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Legumes */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  2. Acompanhamento de Legumes:
                </label>
                <select
                  value={selectedVegetableId}
                  onChange={e => setSelectedVegetableId(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                >
                  {VEGETABLE_OPTIONS.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.calories} kcal)
                    </option>
                  ))}
                </select>
              </div>

              {/* Fruta */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  3. Fruta Sobremesa:
                </label>
                <select
                  value={selectedFruitId}
                  onChange={e => setSelectedFruitId(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                >
                  {FRUIT_OPTIONS.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.calories} kcal)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PAINEL DE RESULTADOS NUTRICIONAIS (INDIVIDUAL & COLETIVO) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Card 1: Por Prato Individual */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800">
                    Composição Nutricional (1 Prato Individual)
                  </h3>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${plateNutrition.statusColor}`}>
                    {plateNutrition.statusLabel}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase">Calorias do Prato:</div>
                    <div className="text-3xl font-black text-orange-600 font-mono">
                      {plateNutrition.totalCalories} <span className="text-sm font-medium text-slate-500">kcal</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>PNAE Refeição: <strong>450 - 650 kcal</strong></div>
                    <div className="text-emerald-600 font-bold">✓ Adequação Completa</div>
                  </div>
                </div>

                {/* Macronutrientes */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">Proteínas</div>
                    <div className="text-sm font-black text-rose-700">{plateNutrition.totalProtein}g</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">Carboidratos</div>
                    <div className="text-sm font-black text-amber-700">{plateNutrition.totalCarbs}g</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">Gorduras</div>
                    <div className="text-sm font-black text-slate-700">{plateNutrition.totalFat}g</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">Fibras</div>
                    <div className="text-sm font-black text-emerald-700">{plateNutrition.totalFibers.toFixed(1)}g</div>
                  </div>
                </div>

                {/* Parecer da Nutricionista */}
                <div className="bg-orange-50/60 p-3.5 rounded-xl border border-orange-200 text-xs text-orange-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-orange-800">
                    <i className="fas fa-user-doctor"></i>
                    Parecer Nutricional:
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {currentMeat.nutritionalHighlight} Combinado com {currentFruit.name}, a refeição fornece ferro ({plateNutrition.totalIron}mg) com elevada absorção.
                  </p>
                </div>
              </div>

              {/* Card 2: Em Escala Coletiva (Cozinha da Escola) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800">
                      Total da Cozinha ({simulatedStudents} Estudantes)
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Meta Desperdício Zero
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-bold uppercase">Energia Total Servida:</div>
                    <div className="text-2xl font-black text-slate-800 font-mono">
                      {collectiveScale.totalCaloriesCollective} <span className="text-xs font-medium text-slate-500">kcal total</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
                      <span className="text-slate-600 font-medium">Carne ({currentMeat.name}):</span>
                      <span className="font-black text-rose-700 font-mono">{collectiveScale.meatKg} kg</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
                      <span className="text-slate-600 font-medium">Legumes ({currentVegetable.name}):</span>
                      <span className="font-black text-amber-700 font-mono">{collectiveScale.vegKg} kg</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
                      <span className="text-slate-600 font-medium">Arroz & Feijão (Cozidos):</span>
                      <span className="font-black text-emerald-700 font-mono">
                        {(Number(collectiveScale.riceKg) + Number(collectiveScale.beansKg)).toFixed(1)} kg
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
                      <span className="text-slate-600 font-medium">Frutas Frescas ({currentFruit.name}):</span>
                      <span className="font-black text-sky-700 font-mono">{collectiveScale.fruitsUnits} unidades</span>
                    </div>
                  </div>
                </div>

                {/* Botão de Envio para a Urna */}
                <button
                  type="button"
                  onClick={handlePublishSimulatedPlate}
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <i className="fas fa-plus-circle"></i>
                  <span>Criar Cédula de Votação com este Prato Simulado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
