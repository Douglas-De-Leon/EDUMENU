import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  // Mock Data for the Dashboard Preview
  const mockBarData = [
    { name: 'Estrogonofe', count: 420 },
    { name: 'Macarronada', count: 350 },
    { name: 'Feijoada', count: 280 },
    { name: 'Salada', count: 150 },
  ];

  const mockPieData = [
    { name: '1º Ano', value: 45 },
    { name: '2º Ano', value: 35 },
    { name: '3º Ano', value: 20 },
  ];
  const pieColors = ['#0EA5E9', '#F43F5E', '#6366F1'];

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 text-white py-20 px-6 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="lg:w-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-100 text-xs font-bold uppercase tracking-wider">
              <i className="fas fa-star text-amber-400"></i>
              <span>Revolução na Gestão Escolar</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              A Voz do Aluno, <br />
              <span className="text-amber-400">Dados para a Gestão.</span>
            </h1>
            <p className="text-lg text-indigo-100/90 leading-relaxed max-w-xl">
              EduVotação é o sistema definitivo para escolas modernas. Garanta lisura nas eleições de representantes, minere dados para o cardápio da merenda e acompanhe o engajamento estudantil em tempo real.
            </p>
            <div className="pt-4">
              <button 
                onClick={onEnterApp}
                className="bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-amber-400/20 transition-all active:scale-95 text-lg flex items-center gap-3"
              >
                Acessar o Sistema
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-indigo-700/50">
              <div>
                <p className="text-3xl font-black text-white">98%</p>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mt-1">Engajamento</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">100%</p>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mt-1">Lisura</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">+5k</p>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mt-1">Votos Auditados</p>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-3xl blur opacity-30 animate-pulse"></div>
              {/* Dashboard Mock UI */}
              <div className="relative bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl space-y-6">
                
                {/* Header Mock */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-white font-bold flex items-center gap-2">
                      <i className="fas fa-chart-line text-amber-400"></i> Painel de Desempenho
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Dados atualizados em tempo real</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    Live
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bar Chart Mock */}
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                    <h4 className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-4">Preferência Alimentar</h4>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockBarData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" fontSize={10} tick={{ fill: '#94a3b8' }} width={80} axisLine={false} tickLine={false} />
                          <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Pie Chart Mock */}
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                    <h4 className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-4">Participação por Série</h4>
                    <div className="h-32 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={mockPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                            {mockPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between mt-2">
                      {mockPieData.map((d, i) => (
                        <div key={d.name} className="text-center">
                          <p className="text-[9px] text-slate-400 uppercase">{d.name}</p>
                          <p className="text-xs font-bold text-white" style={{ color: pieColors[i] }}>{d.value}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Info Section */}
      <section className="bg-white py-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-800">Transforme Votos em Dados Estratégicos</h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              Com o EduVotação, a direção da escola e os gestores não recebem apenas o vencedor de uma eleição. Você tem acesso a um dashboard completo de Business Intelligence (BI) para mineração de dados educacionais.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                <div>
                  <h4 className="font-bold text-slate-800">Previsibilidade na Merenda</h4>
                  <p className="text-slate-500 text-sm">Diminua o desperdício de alimentos entendendo matematicamente a preferência dos alunos.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                <div>
                  <h4 className="font-bold text-slate-800">Mapeamento de Engajamento</h4>
                  <p className="text-slate-500 text-sm">Identifique quais séries ou turmas estão mais engajadas com as atividades escolares.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner">
            <h3 className="font-bold text-slate-800 mb-6 text-xl">Exemplo de Insights Extraídos</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Refeição Campeã - 3º Ano</p>
                  <p className="text-lg font-black text-slate-800 mt-1">Macarronada (68% dos votos)</p>
                </div>
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-arrow-up"></i>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Série com Menor Engajamento</p>
                  <p className="text-lg font-black text-slate-800 mt-1">2º Ano B (35% de abstenção)</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-black text-slate-800">Por que adotar o EduVotação?</h2>
          <p className="text-slate-500 text-lg">Um sistema projetado para trazer inteligência, agilidade e transparência para a comunidade escolar.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Benefit 1 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fas fa-utensils"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Escolha das Refeições</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Minere dados estatísticos sobre a preferência alimentar dos alunos. Reduza o desperdício e garanta um melhor aproveitamento na compra e distribuição da merenda escolar.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fas fa-balance-scale"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Lisura nas Eleições</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Garante total transparência e segurança criptográfica na escolha de Grêmio e Representantes de Classe, promovendo a cidadania e eliminando fraudes no processo.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fas fa-bolt"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Agilidade e Facilidade</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Diga adeus às cédulas de papel. O sistema é ágil e extremamente fácil de usar, permitindo que as votações sejam concluídas rapidamente por qualquer aluno ou professor.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fas fa-chart-pie"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Métricas de Engajamento</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Vá além da simples contagem de votos. Mensure a participação e acompanhe a frequência de engajamento dos alunos segmentada por série (ano) e por turma em tempo real.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            <i className="fas fa-check-double"></i>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Pronto para digitalizar sua escola?</h2>
          <p className="text-slate-500 text-lg mb-8 max-w-2xl mx-auto">Acesse agora o sistema e faça parte das escolas que já usam dados reais para tomar decisões inteligentes e transparentes.</p>
          <button 
            onClick={onEnterApp}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-5 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-indigo-600/20 transition-all active:scale-95 text-lg"
          >
            Acessar Plataforma EduVotação
          </button>
        </div>
      </section>
      
      {/* Simple Footer */}
      <footer className="text-center py-8 text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} EduVotação. Inovação para Gestão Escolar.</p>
      </footer>
    </div>
  );
};
