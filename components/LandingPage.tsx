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
  ComposedChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface LandingPageProps {
  onEnterApp: () => void;
  onSelectRole?: (role: 'student' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onSelectRole }) => {
  // Aba ativa na demonstração interativa do sistema
  const [activeDemoTab, setActiveDemoTab] = useState<'votacoes' | 'frequencias' | 'alimentacao' | 'urna'>('votacoes');

  // Estado interativo para a demonstração da Urna Eleitoral do Aluno
  const [selectedUrnaMeal, setSelectedUrnaMeal] = useState<string | null>(null);
  const [urnaVoted, setUrnaVoted] = useState<boolean>(false);
  const [urnaHash, setUrnaHash] = useState<string>('');

  // Estado interativo da carne selecionada no módulo de nutrição
  const [selectedDemoMeat, setSelectedDemoMeat] = useState<'vermelha' | 'branca' | 'peixe' | 'figado'>('vermelha');
  const [demoPortionsCount, setDemoPortionsCount] = useState<number>(320);

  // Calculadora Interativa de Impacto e Economia Escolar
  const [calcStudents, setCalcStudents] = useState<number>(650);
  const [calcAbsenceRate, setCalcAbsenceRate] = useState<number>(18); // % de ausência média diária
  const [calcMealCost, setCalcMealCost] = useState<number>(6.50);     // Custo médio unitário (R$)
  const [calcVegShare, setCalcVegShare] = useState<number>(14);       // % preferência vegetariana

  // Aba ativa no fluxo de tarefas da gestão
  const [activeTaskTab, setActiveTaskTab] = useState<number>(1);

  // Cálculos matemáticos em tempo real do sistema
  const calcMetrics = useMemo(() => {
    const presentStudents = Math.round(calcStudents * (1 - calcAbsenceRate / 100));
    const absentStudents = calcStudents - presentStudents;

    const mealsAvoidedPerDay = absentStudents;
    const kgSavedPerDay = Number((mealsAvoidedPerDay * 0.38).toFixed(1));
    const brlSavedPerDay = Number((mealsAvoidedPerDay * calcMealCost).toFixed(2));

    const monthlyKgSaved = Math.round(kgSavedPerDay * 22);
    const monthlyBrlSaved = Math.round(brlSavedPerDay * 22);
    const annualBrlSaved = Math.round(brlSavedPerDay * 200);
    const annualMealsSaved = mealsAvoidedPerDay * 200;

    const vegPortions = Math.round(presentStudents * (calcVegShare / 100));
    const regularLunchPortions = Math.round(presentStudents * (1 - calcVegShare / 100));
    const snackPortions = Math.round(presentStudents * 0.75);
    const dessertPortions = Math.round(presentStudents * 0.85);

    return {
      presentStudents,
      absentStudents,
      mealsAvoidedPerDay,
      kgSavedPerDay,
      brlSavedPerDay,
      monthlyKgSaved,
      monthlyBrlSaved,
      annualBrlSaved,
      annualMealsSaved,
      vegPortions,
      regularLunchPortions,
      snackPortions,
      dessertPortions
    };
  }, [calcStudents, calcAbsenceRate, calcMealCost, calcVegShare]);

  // Dados reais dos gráficos do sistema (Demonstração 1: Votações em Tempo Real)
  const votingResultsData = [
    { name: 'Carne Vermelha', votos: 138, porc: 48, fill: '#E11D48' },
    { name: 'Carne Branca (Frango)', votos: 86, porc: 30, fill: '#F59E0B' },
    { name: 'Peixe Assado', votos: 42, porc: 15, fill: '#0284C7' },
    { name: 'Fígado Acebolado', votos: 20, porc: 7, fill: '#9333EA' },
  ];

  const votingPieData = [
    { name: 'Carne Vermelha', value: 138, fill: '#E11D48' },
    { name: 'Carne Branca', value: 86, fill: '#F59E0B' },
    { name: 'Peixe', value: 42, fill: '#0284C7' },
    { name: 'Fígado', value: 20, fill: '#9333EA' },
  ];

  // Dados reais dos gráficos do sistema (Demonstração 2: Frequência & Chamada)
  const attendanceComparisonData = [
    { serie: '1º Ano A', matriculados: 40, presentes: 36, taxa: 90 },
    { serie: '1º Ano B', matriculados: 38, presentes: 33, taxa: 87 },
    { serie: '2º Ano A', matriculados: 42, presentes: 38, taxa: 90 },
    { serie: '2º Ano B', matriculados: 39, presentes: 31, taxa: 79 },
    { serie: '3º Ano A', matriculados: 36, presentes: 34, taxa: 94 },
    { serie: '3º Ano B', matriculados: 35, presentes: 32, taxa: 91 },
  ];

  // Demonstração 3: Dados das Carnes e Prato Balanceado
  const demoMeatData = {
    vermelha: {
      name: 'Carne Vermelha (Patinho Moído com Cenoura)',
      calorias: 540,
      proteina: 32,
      ferro: '3.2 mg',
      kgTotal: ((demoPortionsCount * 0.10)).toFixed(1),
      destaque: 'Rica em Ferro Heme e Vitamina B12 para reposição energética de adolescentes.'
    },
    branca: {
      name: 'Carne Branca (Filé de Frango com Milho & Ervas)',
      calorias: 495,
      proteina: 36,
      ferro: '1.2 mg',
      kgTotal: ((demoPortionsCount * 0.11)).toFixed(1),
      destaque: 'Proteína magra de digestibilidade rápida e baixíssimo teor de gordura saturada.'
    },
    peixe: {
      name: 'Peixe Fresco (Filé de Tilápia Assada ao Limão)',
      calorias: 465,
      proteina: 28,
      ferro: '1.0 mg',
      kgTotal: ((demoPortionsCount * 0.12)).toFixed(1),
      destaque: 'Fonte nobre de Ômega-3, fósforo e iodo que estimulam foco e cognição.'
    },
    figado: {
      name: 'Fígado Bovino (Acebolado com Couve Refogada)',
      calorias: 515,
      proteina: 31,
      ferro: '6.8 mg',
      kgTotal: ((demoPortionsCount * 0.09)).toFixed(1),
      destaque: 'Superalimento estratégico com 500% IDR de Vitamina A e o dobro de ferro para combate à anemia.'
    }
  };

  const currentDemoMeatObj = demoMeatData[selectedDemoMeat];

  // Ação de votar na simulação da Urna do Aluno
  const handleVoteInDemoUrna = (mealName: string) => {
    setSelectedUrnaMeal(mealName);
    const mockHash = 'EDU-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
    setUrnaHash(mockHash);
    setUrnaVoted(true);
  };

  return (
    <div className="w-full bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 2. HERO SECTION DE ALTO IMPACTO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 xl:px-10 border-b border-indigo-900/40 w-full">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="w-full relative z-10 max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-4 py-1.5 rounded-full border border-emerald-800 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Democracia Estudantil com Gestão Nutricional Desperdício Zero (PNAE/FNDE)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
              O sistema completo que conecta a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                frequência escolar
              </span>{' '}
              às urnas da merenda e à democracia da escola.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              O <strong>EDUVOTAÇÃO</strong> resolve o maior desafio da gestão pública da educação: impede que a cozinha prepare comida para alunos faltosos, viabiliza eleições de cardápio com horário de bloqueio rigoroso e garante pratos balanceados para cada estudante presente.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={onEnterApp}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/25 transition-all text-base flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Acessar o EDUVOTAÇÃO Agora</span>
                <i className="fas fa-arrow-right"></i>
              </button>

              <a
                href="#demonstracao"
                className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl border border-white/20 transition-all text-sm flex items-center justify-center gap-2"
              >
                <i className="fas fa-chart-pie text-amber-300"></i>
                <span>Ver Demonstração Interativa dos Gráficos</span>
              </a>
            </div>
          </div>

          {/* Cards Rápidos de Impacto Visual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">Zero</div>
              <div className="text-xs text-slate-300 font-bold mt-1">Sobras Limpas Descartadas</div>
              <div className="text-[11px] text-slate-500 mt-1">Preparo calibrado pelo quórum de presentes</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">100%</div>
              <div className="text-xs text-slate-300 font-bold mt-1">Presença Exigida para Votar</div>
              <div className="text-[11px] text-slate-500 mt-1">Quem falta na aula não agenda prato</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">4 Carnes</div>
              <div className="text-xs text-slate-300 font-bold mt-1">Cédulas Técnicas Nutricionais</div>
              <div className="text-[11px] text-slate-500 mt-1">Vermelha, Branca, Peixe e Fígado</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">10:00</div>
              <div className="text-xs text-slate-300 font-bold mt-1">Trava Automática de Horário</div>
              <div className="text-[11px] text-slate-500 mt-1">Tempo hábil para a equipe da cozinha</div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. DEMONSTRAÇÃO INTERATIVA DOS GRÁFICOS E MÓDULOS DO SISTEMA */}
      <section id="demonstracao" className="py-20 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-7xl mx-auto w-full scroll-mt-12">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Experimente em Tempo Real
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Demonstração Interativa dos Módulos do Sistema
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Navegue pelas abas abaixo para ver como operam os dashboards reais do EDUVOTAÇÃO com apuração em gráficos interativos Recharts e a urna estudantil.
          </p>
        </div>

        {/* Tab Selector da Demonstração */}
        <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto mb-8 overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveDemoTab('votacoes')}
            className={`flex-1 min-w-[190px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeDemoTab === 'votacoes'
                ? 'bg-slate-900 text-white shadow-md font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-chart-pie text-indigo-400"></i>
            <span>1. Dashboard de Votações</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDemoTab('frequencias')}
            className={`flex-1 min-w-[190px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeDemoTab === 'frequencias'
                ? 'bg-slate-900 text-white shadow-md font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-user-check text-emerald-400"></i>
            <span>2. Dashboard de Frequências</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDemoTab('alimentacao')}
            className={`flex-1 min-w-[190px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeDemoTab === 'alimentacao'
                ? 'bg-slate-900 text-white shadow-md font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-utensils text-orange-400"></i>
            <span>3. Nutrição & Carnes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDemoTab('urna')}
            className={`flex-1 min-w-[190px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeDemoTab === 'urna'
                ? 'bg-slate-900 text-white shadow-md font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-check-to-slot text-amber-400"></i>
            <span>4. Urna do Aluno (Simular)</span>
          </button>
        </div>

        {/* CONTAINER DO MÓDULO SELECIONADO NA DEMONSTRAÇÃO */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          
          {/* DEMO 1: DASHBOARD INTELIGENTE DE VOTAÇÕES */}
          {activeDemoTab === 'votacoes' && (
            <div className="space-y-6 p-6 sm:p-8 animate-fadeIn">
              {/* Banner Escuro com a Identidade Real do Sistema */}
              <div className="bg-[#0F172A] rounded-2xl p-6 text-white space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                      Apuração em Tempo Real &bull; Recharts
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                      Dashboard Inteligente de Votações & Apuração
                    </h3>
                    <p className="text-xs text-slate-400">
                      Controle qualitativo e quantitativo das escolhas dos alunos com auditoria de presença.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                      Votação em Andamento &bull; Trava às 10:00
                    </span>
                  </div>
                </div>

                {/* Métricas Topo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-left">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Votos Apurados:</span>
                    <div className="text-2xl font-black text-white font-mono">286</div>
                    <span className="text-[10px] text-emerald-400">100% auditados</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Eleitores Ativos:</span>
                    <div className="text-2xl font-black text-white font-mono">89,3%</div>
                    <span className="text-[10px] text-slate-400">Quórum em sala</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Opção em Destaque:</span>
                    <div className="text-lg font-black text-rose-400">CARNE VERMELHA</div>
                    <span className="text-[10px] text-slate-400">138 votos (48%)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Presença no Dia:</span>
                    <div className="text-2xl font-black text-emerald-400 font-mono">320</div>
                    <span className="text-[10px] text-slate-400">Alunos presentes</span>
                  </div>
                </div>
              </div>

              {/* Gráficos Recharts (Barra + Pizza Lado a Lado) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                <div className="lg:col-span-7 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Votos Computados por Cédula / Prato</span>
                    <span className="text-[10px] text-slate-500 font-normal">Visualização em Barras</span>
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={votingResultsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }} />
                        <Bar dataKey="votos" radius={[6, 6, 0, 0]}>
                          {votingResultsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Divisão Percentual de Escolhas
                  </h4>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={votingPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {votingPieData.map((entry, index) => (
                            <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legenda dos Votos */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                    {votingResultsData.map(v => (
                      <div key={v.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.fill }}></span>
                        <span className="font-semibold text-slate-700 truncate">{v.name}:</span>
                        <span className="font-bold text-slate-900 font-mono">{v.porc}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEMO 2: DASHBOARD INTELIGENTE DE FREQUÊNCIAS */}
          {activeDemoTab === 'frequencias' && (
            <div className="space-y-6 p-6 sm:p-8 animate-fadeIn">
              <div className="bg-[#064E3B] rounded-2xl p-6 text-white space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-emerald-200 bg-emerald-900 px-2.5 py-1 rounded-full border border-emerald-700">
                      Frequência & Presença Escolar em Tempo Real
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                      Dashboard Inteligente de Frequências
                    </h3>
                    <p className="text-xs text-emerald-100">
                      A regra de ouro: apenas alunos com presença confirmada em sala podem votar na merenda.
                    </p>
                  </div>
                  <div className="bg-emerald-900/80 px-4 py-2 rounded-xl border border-emerald-700 text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-300 block">Presença Média Geral</span>
                    <span className="text-xl font-black text-white font-mono">88.5% de Assiduidade</span>
                  </div>
                </div>
              </div>

              {/* Gráfico de Presença por Turma */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Assiduidade por Turma & Matrículas Confirmadas
                  </h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Chamada Diária Oficial
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={attendanceComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="serie" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#064E3B', color: '#fff', borderRadius: '12px', border: 'none' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="matriculados" name="Matriculados" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="presentes" name="Presentes em Sala" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="taxa" name="% Assiduidade" stroke="#F59E0B" strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* DEMO 3: DASHBOARD DE ALIMENTAÇÃO & NUTRIÇÃO */}
          {activeDemoTab === 'alimentacao' && (
            <div className="space-y-6 p-6 sm:p-8 animate-fadeIn">
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-6 text-white space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                  Categoria Oficial: Alimentação
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Dashboard de Alimentação & Cardápio Nutricional
                </h3>
                <p className="text-xs text-orange-100 max-w-2xl">
                  Selecione uma das 4 carnes para calcular instantaneamente o impacto nutricional e o dimensionamento para a cozinha.
                </p>
              </div>

              {/* Seletor das 4 Carnes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'vermelha', name: 'Carne Vermelha', icone: 'fa-drumstick-bite', cor: 'text-rose-600 border-rose-300' },
                  { id: 'branca', name: 'Carne Branca', icone: 'fa-feather-pointed', cor: 'text-amber-600 border-amber-300' },
                  { id: 'peixe', name: 'Peixe Fresco', icone: 'fa-fish', cor: 'text-sky-600 border-sky-300' },
                  { id: 'figado', name: 'Fígado Bovino', icone: 'fa-shield-halved', cor: 'text-purple-600 border-purple-300' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDemoMeat(item.id as any)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      selectedDemoMeat === item.id
                        ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-200'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <i className={`fas ${item.icone} text-lg ${item.cor.split(' ')[0]}`}></i>
                      {selectedDemoMeat === item.id && (
                        <span className="text-[10px] font-black text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">Ativo</span>
                      )}
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-slate-800">{item.name}</div>
                  </button>
                ))}
              </div>

              {/* Ficha Técnica Dinâmica do Prato Selecionado */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 items-center">
                <div className="md:col-span-7 space-y-3">
                  <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Ficha Técnica do Prato:</span>
                  <h4 className="text-lg font-black text-slate-900">{currentDemoMeatObj.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{currentDemoMeatObj.destaque}</p>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">Calorias / Prato</span>
                      <span className="font-mono font-black text-orange-600 text-base">{currentDemoMeatObj.calorias} kcal</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">Proteína Líquida</span>
                      <span className="font-mono font-black text-rose-600 text-base">{currentDemoMeatObj.proteina}g</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">Ferro Heme</span>
                      <span className="font-mono font-black text-slate-800 text-base">{currentDemoMeatObj.ferro}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Simulação de Cozinha:</span>
                    <span className="font-mono font-black text-orange-600">{demoPortionsCount} alunos</span>
                  </div>

                  <input
                    type="range"
                    min="100"
                    max="800"
                    step="20"
                    value={demoPortionsCount}
                    onChange={e => setDemoPortionsCount(Number(e.target.value))}
                    className="w-full accent-orange-600 cursor-pointer"
                  />

                  <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Proteína a descongelar:</span>
                      <span className="font-mono font-black text-slate-900">{currentDemoMeatObj.kgTotal} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Legumes higienizados:</span>
                      <span className="font-mono font-black text-slate-900">{(demoPortionsCount * 0.16).toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Arroz & Feijão cozidos:</span>
                      <span className="font-mono font-black text-slate-900">{(demoPortionsCount * 0.18).toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Frutas frescas (sobremesa):</span>
                      <span className="font-mono font-black text-slate-900">{demoPortionsCount} unidades</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEMO 4: URNA ELEITORAL DO ALUNO (SIMULADOR INTERATIVO) */}
          {activeDemoTab === 'urna' && (
            <div className="space-y-6 p-6 sm:p-8 animate-fadeIn">
              <div className="bg-indigo-900 rounded-2xl p-6 text-white space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-800 text-indigo-200 px-2.5 py-1 rounded-full">
                  Simulador da Urna Digital
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Como o Estudante Vota na Escola
                </h3>
                <p className="text-xs text-indigo-200 max-w-2xl">
                  O aluno presente acessa a urna com matrícula e senha individual, escolhe seu prato ou candidato e recebe na hora o comprovante criptografado.
                </p>
              </div>

              {/* Cédula Interativa na Tela */}
              <div className="max-w-xl mx-auto bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <i className="fas fa-vote-yea text-indigo-600"></i>
                    <span>Cédula: Cardápio do Almoço de Hoje</span>
                  </div>
                  <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Trava às 10:00
                  </span>
                </div>

                {!urnaVoted ? (
                  <div className="space-y-2.5">
                    {[
                      { id: 'opcao1', title: 'Carne Vermelha com Legumes no Vapor', desc: '540 kcal &bull; Patinho magro ensopado + Sobremesa: Laranja' },
                      { id: 'opcao2', title: 'Filé de Frango Grelhado com Milho', desc: '495 kcal &bull; Peito selecionado + Sobremesa: Banana' },
                      { id: 'opcao3', title: 'Filé de Tilápia Assada com Abóbora', desc: '465 kcal &bull; Peixe rico em Ômega-3 + Sobremesa: Maçã' },
                      { id: 'opcao4', title: 'Fígado Bovino Acebolado com Couve', desc: '515 kcal &bull; Riquíssimo em ferro e vitaminas' },
                    ].map(opt => (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedUrnaMeal === opt.title
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="demo_urna_option"
                            checked={selectedUrnaMeal === opt.title}
                            onChange={() => setSelectedUrnaMeal(opt.title)}
                            className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{opt.title}</span>
                            <span className="text-[10px] text-slate-500 block" dangerouslySetInnerHTML={{ __html: opt.desc }}></span>
                          </div>
                        </div>
                      </label>
                    ))}

                    <button
                      type="button"
                      disabled={!selectedUrnaMeal}
                      onClick={() => selectedUrnaMeal && handleVoteInDemoUrna(selectedUrnaMeal)}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="fas fa-check"></i>
                      <span>Confirmar Voto na Urna</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3 animate-scaleIn">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl shadow-lg shadow-emerald-500/20">
                      <i className="fas fa-check"></i>
                    </div>
                    <h4 className="text-base font-black text-emerald-950">Voto Confirmado com Sucesso!</h4>
                    <p className="text-xs text-emerald-800">
                      Você escolheu: <strong>{selectedUrnaMeal}</strong>. Sua refeição está reservada para o almoço de hoje.
                    </p>

                    <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-mono text-slate-600 text-left space-y-1">
                      <div className="flex justify-between">
                        <span>Código do Comprovante:</span>
                        <strong className="text-emerald-700">{urnaHash}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Autenticação:</span>
                        <span>Assinatura Digital Válida</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="text-emerald-600 font-bold">100% Auditado</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUrnaVoted(false);
                        setSelectedUrnaMeal(null);
                      }}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline pt-1 cursor-pointer"
                    >
                      Simular Outro Voto
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 4. OS GRANDES BENEFÍCIOS DO SISTEMA EDUVOTAÇÃO */}
      <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 xl:px-10 bg-slate-100/70 border-y border-slate-200/80 w-full scroll-mt-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Impacto & Eficiência Pública
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Os 5 Pilares de Benefícios do EDUVOTAÇÃO
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              O sistema foi concebido por especialistas em gestão escolar e nutrição pública para modernizar a rotina das escolas e secretarias de educação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Benefício 1 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
                <i className="fas fa-recycle"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900">Desperdício Zero de Alimentos</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Elimina o descarte diário de sobras limpas. A cozinha só descongelará e cozinhará para a quantidade exata de alunos presentes na chamada da manhã.
              </p>
              <div className="pt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <i className="fas fa-arrow-trend-down"></i>
                <span>Economia de até 38% no volume de compras</span>
              </div>
            </div>

            {/* Benefício 2 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900">Trava & Bloqueio por Horário</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                O gestor agenda o encerramento automático da urna (ex: 10:00). Ao atingir o horário, o sistema bloqueia novos votos e entrega a ordem pronta para as merendeiras.
              </p>
              <div className="pt-2 text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                <i className="fas fa-clock"></i>
                <span>Previsibilidade total para o pré-preparo</span>
              </div>
            </div>

            {/* Benefício 3 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
                <i className="fas fa-scale-balanced"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900">Conformidade Total com o PNAE</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Auxilia no cumprimento de 30% da verba com a Agricultura Familiar, atende a Lei 11.947/2009 e gera relatórios auditáveis para o CAE e FNDE.
              </p>
              <div className="pt-2 text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                <i className="fas fa-file-shield"></i>
                <span>Prestação de contas 100% digital</span>
              </div>
            </div>

            {/* Benefício 4 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl">
                <i className="fas fa-apple-whole"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900">Nutrição Balanceada com 4 Carnes</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Fichas técnicas para Carne Vermelha, Branca, Peixe e Fígado associadas a legumes no vapor e frutas de sobremesa para absorção máxima de ferro.
              </p>
              <div className="pt-2 text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <i className="fas fa-heart-pulse"></i>
                <span>Combate eficaz à anemia e fadiga escolar</span>
              </div>
            </div>

            {/* Benefício 5 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl">
                <i className="fas fa-shield-halved"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900">Segurança de Dados & LGPD</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Voto secreto com emissão de hash comprovatório, senhas protegidas e nenhuma exposição de CPFs ou dados pessoais sensíveis de estudantes e responsáveis.
              </p>
              <div className="pt-2 text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                <i className="fas fa-check-double"></i>
                <span>Auditoria e proteção jurídica total</span>
              </div>
            </div>

            {/* Benefício 6 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl">
                <i className="fas fa-users-viewfinder"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900">Democracia Ativa & Engajamento</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                O estudante desenvolve consciência cívica participando das votações do cardápio, grêmio escolar, representantes de turma e projetos extracurriculares.
              </p>
              <div className="pt-2 text-xs font-semibold text-sky-700 flex items-center gap-1.5">
                <i className="fas fa-graduation-cap"></i>
                <span>Cultura democrática desde o ensino básico</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. GUIA DAS PRINCIPAIS FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-20 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-7xl mx-auto w-full scroll-mt-12">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Recursos da Plataforma
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tudo o que sua escola precisa em um único sistema
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Desenvolvido com tecnologia de ponta para funcionar perfeitamente em telas cheias, computadores, tablets e smartphones de qualquer tamanho.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl shrink-0 mt-1">
              <i className="fas fa-calendar-plus"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">Cadastro Unificado de Votações</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Crie votações com categorias personalizadas (Alimentação, Grêmio, Representante, etc.), data de aplicação, horário automático de bloqueio e adicione opções na mesma tela.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0 mt-1">
              <i className="fas fa-user-check"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">Chamada Escolar com Bloqueio de Ausentes</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Lançamento rápido por série (1º, 2º e 3º ano) e turno (Integral, Manhã, Tarde). O aluno ausente é automaticamente excluído da votação da merenda para evitar desperdício.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center text-xl shrink-0 mt-1">
              <i className="fas fa-drumstick-bite"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">Cédulas Oficiais para Carnes & Legumes</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Módulo completo para carne vermelha, carne branca, peixe e fígado, com opções de legumes no vapor e frutas de sobremesa, calibrado para a cota calórica do PNAE (450 a 650 kcal).
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0 mt-1">
              <i className="fas fa-redo-alt"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">Reutilização em Múltiplos Dias</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Reaproveite uma votação ou cardápio bem avaliado para novas datas com apenas 1 clique, mantendo o histórico de aceitação e aplicando a regra de presença da nova data.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl shrink-0 mt-1">
              <i className="fas fa-folder-closed"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">Arquivo de Votações Finalizadas</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Assim que a data ou horário expiram, a votação é oculta da urna dos alunos e arquivada na aba de filtros "Votações Finalizadas", mantendo a tela do estudante sempre limpa e organizada.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl shrink-0 mt-1">
              <i className="fas fa-key"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">Atualização Cadastral e de Senha pelo Aluno</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Modais na barra superior do portal do aluno para atualizar contatos do responsável e redefinir a própria senha de acesso de forma autônoma e segura.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 6. CALCULADORA INTERATIVA DE ROI E ECONOMIA DA ESCOLA */}
      <section id="calculadora" className="py-24 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-7xl mx-auto w-full scroll-mt-12">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-indigo-500/30 shadow-2xl space-y-10">
          
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
              Calculadora Dinâmica do Sistema
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Calcule a economia real e o desperdício evitado na sua escola
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Arraste os controles abaixo para simular os ganhos da sua instituição ao substituir o preparo cego pelo dimensionamento automatizado do EDUVOTAÇÃO.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Controles de Simulação */}
            <div className="lg:col-span-6 space-y-6 bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10">
              
              {/* Slider 1: Número de Alunos */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Total de Alunos Matriculados:</span>
                  <span className="font-mono text-emerald-400 text-sm font-black">{calcStudents} alunos</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2500"
                  step="50"
                  value={calcStudents}
                  onChange={e => setCalcStudents(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>100 alunos</span>
                  <span>1.000 alunos</span>
                  <span>2.500 alunos</span>
                </div>
              </div>

              {/* Slider 2: Taxa Média de Ausência */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Taxa Média de Ausência Escolar (Faltas):</span>
                  <span className="font-mono text-amber-300 text-sm font-black">{calcAbsenceRate}% ({calcMetrics.absentStudents} ausências/dia)</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  value={calcAbsenceRate}
                  onChange={e => setCalcAbsenceRate(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>5% (Mínima)</span>
                  <span>18% (Média Nacional)</span>
                  <span>35% (Alta evasão)</span>
                </div>
              </div>

              {/* Input Custo Médio da Refeição */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Custo Médio / Refeição (R$):</label>
                  <input
                    type="number"
                    step="0.50"
                    min="3"
                    max="15"
                    value={calcMealCost}
                    onChange={e => setCalcMealCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Opção Vegetariana (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={calcVegShare}
                    onChange={e => setCalcVegShare(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Painel de Resultados Projetados */}
            <div className="lg:col-span-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Comida Poupada / Mês
                  </span>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 block">
                    {calcMetrics.monthlyKgSaved.toLocaleString('pt-BR')} kg
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Alimentos não descartados
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                    Economia Anual Projetada
                  </span>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-amber-300 block">
                    R$ {calcMetrics.annualBrlSaved.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    200 dias letivos no ano
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <i className="fas fa-check-circle"></i>
                  <span>Ordem de Preparo Recomendada para Hoje ({calcMetrics.presentStudents} presentes):</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Almoço</span>
                    <span className="font-mono font-bold text-white text-sm">{calcMetrics.regularLunchPortions}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Vegetariano</span>
                    <span className="font-mono font-bold text-cyan-300 text-sm">{calcMetrics.vegPortions}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Lanches</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">{calcMetrics.snackPortions}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Sobremesas</span>
                    <span className="font-mono font-bold text-pink-300 text-sm">{calcMetrics.dessertPortions}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onEnterApp}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl shadow-xl transition-all text-base flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Aplicar Esse Dimensionamento na Minha Escola</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 7. PERGUNTAS FREQUENTES (FAQ) */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-5xl mx-auto w-full scroll-mt-12">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Perguntas Frequentes da Gestão Escolar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tudo o que você precisa saber sobre a implementação do EDUVOTAÇÃO.
          </p>
        </div>

        <div className="space-y-4">
          <details className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <summary className="font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center text-sm">
              <span>Como o sistema impede o desperdício de alimentos se o aluno faltar?</span>
              <i className="fas fa-chevron-down text-slate-400 group-open:rotate-180 transition-transform"></i>
            </summary>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed border-t border-slate-100 pt-3">
              Por padrão, todos os estudantes iniciam como faltosos. Apenas quando a chamada oficial é confirmada pela coordenação, os alunos presentes são habilitados para votar nas urnas. O cálculo de preparo da cozinha desconta automaticamente as faltas do dia.
            </p>
          </details>

          <details className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <summary className="font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center text-sm">
              <span>Como funciona a trava e bloqueio de horário da votação?</span>
              <i className="fas fa-chevron-down text-slate-400 group-open:rotate-180 transition-transform"></i>
            </summary>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed border-t border-slate-100 pt-3">
              Ao cadastrar uma votação de cardápio, a gestão define um horário limite (por exemplo, 10:00). Assim que o horário chega, a urna é travada imediatamente para os discentes e o sistema consolida as porções para que as cozinheiras tenham tempo hábil de preparo antes do almoço.
            </p>
          </details>

          <details className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <summary className="font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center text-sm">
              <span>O sistema atende aos requisitos do PNAE e FNDE?</span>
              <i className="fas fa-chevron-down text-slate-400 group-open:rotate-180 transition-transform"></i>
            </summary>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed border-t border-slate-100 pt-3">
              Sim. O EDUVOTAÇÃO possui relatórios compatíveis com as diretrizes da Lei 11.947/2009 e Resolução FNDE nº 06/2020, auxiliando no cumprimento de no mínimo 30% de compras da agricultura familiar, controle de alérgenos e limitação de açúcares adicionados.
            </p>
          </details>

          <details className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <summary className="font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center text-sm">
              <span>Como as 4 carnes e os nutrientes são calculados?</span>
              <i className="fas fa-chevron-down text-slate-400 group-open:rotate-180 transition-transform"></i>
            </summary>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed border-t border-slate-100 pt-3">
              O sistema conta com fichas técnicas nutricionais para Carne Vermelha, Carne Branca, Peixe e Fígado bovino, associadas a legumes no vapor e frutas de sobremesa (com vitamina C sinérgica), garantindo a meta calórica PNAE de 450 a 650 kcal por prato e cálculo em kg dos insumos para a cozinha.
            </p>
          </details>
        </div>
      </section>

      {/* 8. CTA FINAL DE ALTA CONVERSÃO */}
      <section className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white py-20 px-4 sm:px-6 lg:px-8 xl:px-10 border-t border-indigo-900/60 w-full">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto shadow-inner border border-emerald-500/30">
            <i className="fas fa-check-to-slot"></i>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Pronto para transformar a gestão e a merenda da sua escola?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Elimine o desperdício, valorize a voz dos alunos e tenha controle absoluto da frequência e da produção alimentar escolar.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              type="button"
              onClick={onEnterApp}
              className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/25 transition-all text-base flex items-center gap-3 cursor-pointer"
            >
              <span>Acessar a Plataforma EDUVOTAÇÃO</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER INSTITUCIONAL */}
      <footer className="bg-slate-950 text-slate-500 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs border-t border-slate-900 space-y-3 w-full">
        <div className="flex items-center justify-center space-x-2 text-white">
          <i className="fas fa-ticket-alt text-amber-300"></i>
          <span className="font-black text-sm tracking-tight">EDUVOTAÇÃO</span>
        </div>
        <p className="font-semibold text-slate-400">
          Sistema Integrado de Decisão Democrática Estudantil & Gestão Nutricional da Merenda
        </p>
        <p>
          Desenvolvido com foco no combate ao desperdício de alimentos (PNAE/FNDE) e auditoria transparente &bull; &copy; {new Date().getFullYear()}
        </p>
      </footer>

    </div>
  );
};
