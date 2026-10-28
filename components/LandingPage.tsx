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

interface LandingPageProps {
  onEnterApp: () => void;
  onSelectRole?: (role: 'student' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onSelectRole }) => {
  // Calculadora Interativa de Impacto e Economia Escolar
  const [calcStudents, setCalcStudents] = useState<number>(600);
  const [calcAbsenceRate, setCalcAbsenceRate] = useState<number>(18); // % de ausência média diária
  const [calcMealCost, setCalcMealCost] = useState<number>(6.50);     // Custo médio unitário (R$)
  const [calcVegShare, setCalcVegShare] = useState<number>(14);       // % preferência vegetariana

  // Aba ativa nas tarefas da gestão
  const [activeTaskTab, setActiveTaskTab] = useState<number>(1);

  // Aba ativa nas 4 subcategorias
  const [activeSubcatTab, setActiveSubcatTab] = useState<'almoco' | 'lanche' | 'veg' | 'sobremesa'>('almoco');

  // Cálculos matemáticos em tempo real do sistema
  const calcMetrics = useMemo(() => {
    // Alunos presentes reais esperados por dia
    const presentStudents = Math.round(calcStudents * (1 - calcAbsenceRate / 100));
    const absentStudents = calcStudents - presentStudents;

    // Em uma escola tradicional sem o EDUVOTAÇÃO, a cozinha prepara cegamente para 100% dos alunos matriculados
    // Com o EDUVOTAÇÃO, a preparação é calibrada estritamente para os presentes confirmados
    const mealsAvoidedPerDay = absentStudents;
    const kgSavedPerDay = Number((mealsAvoidedPerDay * 0.38).toFixed(1));
    const brlSavedPerDay = Number((mealsAvoidedPerDay * calcMealCost).toFixed(2));

    // Projeções mensais (22 dias letivos) e anuais (200 dias letivos)
    const monthlyKgSaved = Math.round(kgSavedPerDay * 22);
    const monthlyBrlSaved = Math.round(brlSavedPerDay * 22);
    const annualBrlSaved = Math.round(brlSavedPerDay * 200);
    const annualMealsSaved = mealsAvoidedPerDay * 200;

    // Subdivisão da produção diária recomendada
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

  // Dados para o mini-gráfico interativo do Hero
  const heroDistributionData = [
    { name: 'Almoço Completo', porcoes: 385, color: '#10B981' },
    { name: 'Lanche / Fruta', porcoes: 420, color: '#F59E0B' },
    { name: 'Vegetariano', porcoes: 85, color: '#06B6D4' },
    { name: 'Sobremesa', porcoes: 460, color: '#EC4899' },
  ];

  return (
    <div className="bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. HERO SECTION DE ALTA CONVERSÃO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Header Tag / Editorial Kicker */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Tecnologia de Gestão Escolar & Merenda Desperdício Zero (PNAE/FNDE)</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <i className="fas fa-shield-halved text-emerald-400"></i>
              <span>Conformidade com a Lei Federal 11.947/2009</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Coluna Esquerda: Proposta de Valor e Conversão */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                Viabilize a merenda escolar com{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                  precisão matemática diária
                </span>{' '}
                baseada na frequência real.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                O <strong>EDUVOTAÇÃO</strong> resolve o maior desafio da gestão pública: conecta a chamada escolar em tempo real às urnas estudantis, gerando a ordem de cocção exata para as 4 subcategorias (Almoço, Lanche, Vegetariano e Sobremesa) e eliminando até <strong>38% de desperdício de alimentos</strong>.
              </p>

              {/* Botões de Ação Principal e Secundário */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/25 transition-all text-base flex items-center justify-center gap-3 cursor-pointer"
                >
                  <span>Acessar Plataforma EDUVOTAÇÃO</span>
                  <i className="fas fa-arrow-right"></i>
                </button>

                <a
                  href="#calculadora"
                  className="px-6 py-4 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl border border-white/15 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <i className="fas fa-calculator text-amber-300"></i>
                  <span>Simular Economia da Minha Escola</span>
                </a>
              </div>

              {/* Acesso Direto aos Perfis */}
              <div className="pt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Entrada Rápida:</span>
                <button
                  type="button"
                  onClick={() => onSelectRole ? onSelectRole('student') : onEnterApp()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fas fa-user-graduate text-xs text-indigo-400"></i>
                  <span>Portal do Aluno (Urna)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectRole ? onSelectRole('admin') : onEnterApp()}
                  className="px-3 py-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 border border-amber-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fas fa-user-shield text-xs text-amber-400"></i>
                  <span>Gestão & Nutrição</span>
                </button>
              </div>

              {/* Indicadores Chave de Impacto */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-indigo-900/60">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white font-mono">Zero</p>
                  <p className="text-xs text-slate-400 mt-0.5">Sobras Limpas Descartadas</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">100%</p>
                  <p className="text-xs text-slate-400 mt-0.5">Auditoria e Frequência</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">30%+</p>
                  <p className="text-xs text-slate-400 mt-0.5">Agricultura Familiar</p>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Live Engine Preview (Visualização Operacional) */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-2xl space-y-6 relative">
                
                {/* Header do Widget */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                      <i className="fas fa-kitchen-set"></i>
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-white">Dimensionamento da Merenda</h3>
                      <p className="text-[11px] text-slate-400">Status em tempo real das urnas</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                    Ao Vivo
                  </span>
                </div>

                {/* KPI Cards em Miniatura */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matrículas Totais</span>
                    <span className="text-xl font-black text-white font-mono">850 alunos</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Corpo discente regular</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Presentes Hoje</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">722 presentes</span>
                    <span className="text-[10px] text-emerald-300/80 block mt-0.5">85% na chamada oficial</span>
                  </div>
                </div>

                {/* Ficha Técnica de Produção por Subcategoria */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ordem de Produção por Subcategoria:
                  </span>

                  <div className="space-y-2">
                    {heroDistributionData.map(item => (
                      <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="font-semibold text-slate-200">{item.name}</span>
                        </div>
                        <span className="font-mono font-black text-white">{item.porcoes} porções</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Economia Diária Calculada */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-800/80 border border-emerald-500/30 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Sobras Limpas Evitadas Hoje:</span>
                    <span className="text-base font-black text-emerald-400 font-mono">128 refeições (48,6 kg)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Economia do Dia:</span>
                    <span className="text-base font-black text-amber-300 font-mono">R$ 832,00</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. AS 4 TAREFAS CRÍTICAS DA GESTÃO ESCOLAR (FLUXO OPERACIONAL) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Fluxo de Gestão Diária
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Como a gestão escolar viabiliza a merenda no dia a dia
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Elimine planilhas manuais e suposições da cozinha. O EDUVOTAÇÃO estrutura a rotina da escola em 4 etapas sincronizadas que garantem alimentação saudável, sem sobras e 100% auditável.
          </p>
        </div>

        {/* Tab Selector de Tarefas */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto mb-10 overflow-x-auto gap-1">
          {[
            { id: 1, label: '01. Chamada & Presença', icon: 'fa-user-check' },
            { id: 2, label: '02. Votação com Trava', icon: 'fa-vote-yea' },
            { id: 3, label: '03. Ordem de Cocção', icon: 'fa-fire-burner' },
            { id: 4, label: '04. Auditoria PNAE', icon: 'fa-file-invoice' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTaskTab(tab.id)}
              className={`flex-1 min-w-[170px] py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTaskTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo Dinâmico da Tarefa Selecionada */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          {activeTaskTab === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fadeIn">
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Rotina das 07:30 às 08:30 &bull; Sala de Aula
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Frequência Escolar Automatizada: Por padrão, alunos iniciam como faltosos
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Para impedir que a cozinha cozinhe para estudantes ausentes, o sistema aplica uma regra rígida: nenhum aluno pode votar ou ter refeição computada antes que a chamada da sua turma seja lançada pela coordenação.
                </p>
                <div className="space-y-3 pt-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Lista suspensa por turma e série:</strong> Chamada rápida com filtros por 1º, 2º e 3º ano e turnos (Integral, Manhã, Tarde).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Bloqueio imediato de abstenções:</strong> Quem faltou não entra no cálculo de compras nem na cota de descongelamento da proteína.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Auditoria criptografada no banco:</strong> Dados sincronizados com o Firestore para conferência diária da direção.</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
                  <span className="font-bold text-slate-700">Chamada do Dia 28/10</span>
                  <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Confirmada</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-600">1º Ano A (Integral)</span>
                    <span className="font-bold text-slate-900">32 presentes / 3 faltas</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-600">2º Ano B (Manhã)</span>
                    <span className="font-bold text-slate-900">28 presentes / 5 faltas</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-600">3º Ano A (Integral)</span>
                    <span className="font-bold text-slate-900">34 presentes / 1 falta</span>
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-900 text-xs font-semibold">
                  <i className="fas fa-info-circle mr-1 text-indigo-600"></i>
                  Total de 94 refeições salvas apenas no turno da manhã com base na chamada.
                </div>
              </div>
            </div>
          )}

          {activeTaskTab === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fadeIn">
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                  Rotina das 08:30 às 10:00 &bull; Urnas dos Estudantes
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Urna Estudantil com Trava e Bloqueio Automático de Horário
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Os estudantes presentes acessam a urna pelo celular ou terminal da escola. A gestão cadastra um <strong>horário limite rigoroso</strong> (ex: 10:00). Ao atingir o horário, a urna trava automaticamente para consolidar a ordem de cocção para as merendeiras.
                </p>
                <div className="space-y-3 pt-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Bloqueio de eleição encerrada:</strong> Dias anteriores e votações finalizadas são ocultadas da tela do aluno e arquivadas na aba "Votações Finalizadas".</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Confirmação com opção única:</strong> Mesmo com apenas uma opção, o sistema nunca vota sozinho; o discente confirma seu próprio prato.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Comprovante com hash eleitoral:</strong> Segurança contra votos duplicados com emissão de recibo digital.</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                  <span className="font-bold text-amber-400">Cardápio do Dia: Almoço Saudável</span>
                  <span className="font-black text-rose-400 bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-800">Trava às 10:00</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-white/10 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">Opção 1: Carne Moída com Legumes</span>
                      <span className="text-[10px] text-slate-400">420 kcal &bull; Almoço Completo</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">68%</span>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">Opção 2: Ovos Cozidos com Grão-de-Bico</span>
                      <span className="text-[10px] text-slate-400">380 kcal &bull; Vegetariano</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-400">32%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Urna travada às 10:00. Dados enviados diretamente para a cozinha escolar.
                </p>
              </div>
            </div>
          )}

          {activeTaskTab === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fadeIn">
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Rotina das 10:15 &bull; Cozinha & Nutricionista
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Cálculo Automatizado da Ficha Técnica de Insumos da Merenda
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A nutricionista não precisa mais estimar quantos quilos de arroz ou carne descongelar. O sistema calcula a quantidade exata de insumos e porções necessárias para cada uma das 4 subcategorias cadastradas.
                </p>
                <div className="space-y-3 pt-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Gramatura calibrada pelo PNAE:</strong> 120g de arroz cru, 60g de feijão cru e 180g de carne limpa por prato servido.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Ficha técnica das 4 subcategorias:</strong> Ordens separadas para Almoço Completo, Lanche / Fruta, Vegetariano e Sobremesa.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Descongelamento seguro com 24h:</strong> Previsão antecipada para evitar o uso de alimentos congelados às pressas.</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-emerald-200">
                  <span className="font-bold text-emerald-950">Ordem de Insumos para 722 Alunos</span>
                  <span className="font-bold text-emerald-800">Cozinha Central</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-emerald-100">
                    <span className="font-semibold text-slate-700">Arroz Agulhinha Tipo 1</span>
                    <span className="font-mono font-bold text-slate-900">86,6 kg</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-emerald-100">
                    <span className="font-semibold text-slate-700">Feijão Carioca</span>
                    <span className="font-mono font-bold text-slate-900">43,3 kg</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-emerald-100">
                    <span className="font-semibold text-slate-700">Proteína Animal (Carne Moída)</span>
                    <span className="font-mono font-bold text-slate-900">129,9 kg</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-emerald-100">
                    <span className="font-semibold text-slate-700">Leguminosas / Opção Vegetariana</span>
                    <span className="font-mono font-bold text-slate-900">22,8 kg</span>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-800 font-medium text-center">
                  Cálculo com margem técnica de segurança de 5% inclusa.
                </p>
              </div>
            </div>
          )}

          {activeTaskTab === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fadeIn">
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
                  Rotina das 14:00 &bull; Secretaria & Prestação de Contas
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Auditoria, Indicadores PNAE e Exportação de Relatórios Oficiais
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A direção da escola e os conselhos de alimentação escolar (CAE) acompanham os gráficos consolidados em tempo real, gerando relatórios em CSV e PDF para comprovação de gastos públicos e metas do FNDE.
                </p>
                <div className="space-y-3 pt-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Comprovação de 30% da Agricultura Familiar:</strong> Rastreabilidade de itens adquiridos de cooperativas de pequenos produtores.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Exportação CSV com um clique:</strong> Dados brutos para integração com sistemas municipais e estaduais de educação.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <i className="fas fa-check-circle text-emerald-600 text-base mt-0.5"></i>
                    <span><strong>Medição longitudinal comparativa:</strong> Avalie a aceitação de pratos ao longo de semanas e meses para aperfeiçoar o cardápio.</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-purple-50/70 p-6 rounded-2xl border border-purple-200 space-y-4">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-purple-200">
                  <span className="font-bold text-purple-950">Relatório Consolidado do Mês</span>
                  <span className="font-black text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200">CAE / PNAE</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-purple-100 flex justify-between items-center">
                    <span className="text-slate-600">Alimentos Poupados no Mês:</span>
                    <span className="font-black text-emerald-600 font-mono text-sm">+1.070 kg</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100 flex justify-between items-center">
                    <span className="text-slate-600">Economia Financeira Gerada:</span>
                    <span className="font-black text-purple-700 font-mono text-sm">R$ 18.304,00</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100 flex justify-between items-center">
                    <span className="text-slate-600">Índice Médio de Aceitação:</span>
                    <span className="font-black text-slate-800 font-mono text-sm">92,4%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. AS 4 SUBCATEGORIAS OFICIAIS & FÓRMULAS DE CÁLCULO */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-100/70 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Engenharia Nutricional
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              As 4 Subcategorias Oficiais e Seus Cálculos Matemáticos
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              O EDUVOTAÇÃO segmenta a produção por subcategorias específicas, evitando o preparo genérico e garantindo inclusão alimentar para todos os perfis de alunos.
            </p>
          </div>

          {/* Cards das 4 Subcategorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. Almoço Completo */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
                  <i className="fas fa-bowl-food"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900">Almoço Completo</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Prato principal com arroz, feijão, proteína animal e legumes.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gramatura / Aluno:</span>
                    <span className="font-bold text-slate-800">420g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Custo Médio Unitário:</span>
                    <span className="font-bold text-emerald-700 font-mono">R$ 6,80</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Insumos Críticos:</span>
                    <span className="font-bold text-slate-800">Arroz, Feijão, Carnes</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl text-[11px] text-emerald-900 font-medium">
                <strong>Fórmula de Produção:</strong> Presentes &times; % Adesão &times; 1,05 (margem técnica)
              </div>
            </div>

            {/* 2. Lanche / Fruta */}
            <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
                  <i className="fas fa-sandwich"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900">Lanche / Fruta</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kits individuais para o intervalo com pães integrais, frutas e sucos naturais.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gramatura / Aluno:</span>
                    <span className="font-bold text-slate-800">220g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Custo Médio Unitário:</span>
                    <span className="font-bold text-amber-700 font-mono">R$ 3,40</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Insumos Críticos:</span>
                    <span className="font-bold text-slate-800">Pães, Frutas, Leite</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl text-[11px] text-amber-900 font-medium">
                <strong>Fórmula de Produção:</strong> Presentes &times; % Lanche (foco em perecíveis)
              </div>
            </div>

            {/* 3. Vegetariano */}
            <div className="bg-white p-6 rounded-3xl border border-cyan-200 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-2xl">
                  <i className="fas fa-seedling"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900">Vegetariano</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Substituição proteica com lentilhas, grão-de-bico, ovos caipiras e tofu.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gramatura / Aluno:</span>
                    <span className="font-bold text-slate-800">380g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Custo Médio Unitário:</span>
                    <span className="font-bold text-cyan-700 font-mono">R$ 5,90</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Insumos Críticos:</span>
                    <span className="font-bold text-slate-800">Leguminosas, Ovos</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cyan-50/70 rounded-xl text-[11px] text-cyan-900 font-medium">
                <strong>Fórmula de Produção:</strong> Demanda nominal exata (Zero contaminação cruzada)
              </div>
            </div>

            {/* 4. Sobremesa */}
            <div className="bg-white p-6 rounded-3xl border border-pink-200 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-2xl">
                  <i className="fas fa-apple-whole"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900">Sobremesa</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Frutas da safra regional da agricultura familiar e doces com açúcar reduzido.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gramatura / Aluno:</span>
                    <span className="font-bold text-slate-800">150g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Custo Médio Unitário:</span>
                    <span className="font-bold text-pink-700 font-mono">R$ 2,20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Insumos Críticos:</span>
                    <span className="font-bold text-slate-800">Banana, Maçã, Melão</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-pink-50/70 rounded-xl text-[11px] text-pink-900 font-medium">
                <strong>Fórmula de Produção:</strong> Presentes &times; Unidades individuais da safra
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. CALCULADORA INTERATIVA DE ROI E ECONOMIA DA ESCOLA (HIGH-CONVERSION WIDGET) */}
      <section id="calculadora" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-12">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-indigo-500/30 shadow-2xl space-y-10">
          
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
              Calculadora Dinâmica do Sistema
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Calcule a economia real e o desperdício evitado na sua escola
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Arraste os controles abaixo para simular os ganhos da sua instituição de ensino ao substituir a preparação cega pelo dimensionamento automatizado do EDUVOTAÇÃO.
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

              {/* Slider 2: Taxa Média de Falta/Ausência */}
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

      {/* 5. PROVAS SOCIAIS & DEPOIMENTOS DE GESTORES ESCOLARES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
            Casos de Sucesso
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Quem gerencia a escola com dados não volta para o papel
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-1 text-xs">
                <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                "Reduzimos em 34% o descarte de sobras limpas logo no primeiro mês. O sistema permitiu que nossos 12 alunos vegetarianos tivessem refeições exclusivas e nutritivas sem que faltasse comida para ninguém."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                MR
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Maria Regina Souza</p>
                <p className="text-[11px] text-slate-400">Diretora Pedagógica &bull; E.E. Dr. Miguel</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-1 text-xs">
                <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                "A ficha técnica de insumos automatizada me poupa 6 horas semanais de cálculos de porções. Agora compro a quantidade exata de hortifrúti da agricultura familiar cumprindo a meta do PNAE."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                CP
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Camila Pinheiro</p>
                <p className="text-[11px] text-slate-400">Nutricionista RT (CRN-7)</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-1 text-xs">
                <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                "A regra de só poder votar na merenda se o aluno tiver presença confirmada na aula melhorou a pontualidade na primeira aula. Além disso, a urna é intuitiva e o estudante sente que sua voz conta."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                JS
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">João Silva</p>
                <p className="text-[11px] text-slate-400">Coordenador de Turno Integral</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. PERGUNTAS FREQUENTES (FAQ ESTRATÉGICO) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
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
              <span>As opções vegetarianas e dietas especiais são atendidas?</span>
              <i className="fas fa-chevron-down text-slate-400 group-open:rotate-180 transition-transform"></i>
            </summary>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed border-t border-slate-100 pt-3">
              Sim! A subcategoria Vegetariano dimensiona o número nominal exato de porções vegetais, permitindo à cozinha separar panelas e utensílios para evitar contaminação cruzada e garantir o aporte adequado de ferro e proteínas vegetais.
            </p>
          </details>
        </div>
      </section>

      {/* 7. CTA FINAL (FECHAMENTO DE ALTA CONVERSÃO) */}
      <section className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-indigo-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Pronto para transformar a gestão da merenda da sua escola?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Elimine o desperdício, valorize a participação dos alunos e ofereça uma gestão transparente para toda a comunidade escolar.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              type="button"
              onClick={onEnterApp}
              className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/25 transition-all text-base flex items-center gap-3 cursor-pointer"
            >
              <span>Acessar o EDUVOTAÇÃO Agora</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Footer Editorial Limpo */}
      <footer className="bg-slate-950 text-slate-500 py-8 px-4 text-center text-xs border-t border-slate-900 space-y-2">
        <p className="font-semibold text-slate-400">
          EDUVOTAÇÃO &bull; Sistema de Gestão Eleitoral Estudantil e Merenda Escolar Inteligente
        </p>
        <p>
          Desenvolvido com foco no combate ao desperdício de alimentos e transparência pública escolar &bull; &copy; {new Date().getFullYear()}
        </p>
      </footer>

    </div>
  );
};
