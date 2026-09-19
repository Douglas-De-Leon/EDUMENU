import React, { useState, useMemo } from 'react';
import { MealOption, VotingSession } from '../types';

interface VotingManagementProps {
  mealOptions: MealOption[];
  votingSessions: VotingSession[];
  onAddVotingSession: (session: VotingSession) => void;
  onUpdateVotingSession: (session: VotingSession) => void;
  onDeleteVotingSession: (id: string) => void;
  onNavigateToOptions?: () => void;
}

export const VotingManagement: React.FC<VotingManagementProps> = ({
  mealOptions,
  votingSessions,
  onAddVotingSession,
  onUpdateVotingSession,
  onDeleteVotingSession,
  onNavigateToOptions
}) => {
  // Today formatted as YYYY-MM-DD for initial default
  const getTodayStr = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Gremio' | 'Representante' | 'Alimentação' | 'Outros'>('Gremio');
  const [votingDate, setVotingDate] = useState<string>(getTodayStr);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [currentSelectedDropdownOption, setCurrentSelectedDropdownOption] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Helper Labels & Colors
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Gremio': return 'Grêmio Escolar';
      case 'Representante': return 'Representante de Classe';
      case 'Alimentação': return 'Alimentação / Merenda';
      case 'Outros': return 'Outros Assuntos';
      default: return cat;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Gremio': return 'fa-users text-indigo-500';
      case 'Representante': return 'fa-user-tie text-amber-500';
      case 'Alimentação': return 'fa-utensils text-emerald-500';
      case 'Outros': return 'fa-clipboard-list text-purple-500';
      default: return 'fa-vote-yea text-slate-500';
    }
  };

  const getCategoryThemeColor = (cat: string) => {
    switch (cat) {
      case 'Gremio': return '#4F46E5';
      case 'Representante': return '#F59E0B';
      case 'Alimentação': return '#10B981';
      case 'Outros': return '#8B5CF6';
      default: return '#64748B';
    }
  };

  // Filter ONLY items registered and enabled (active === true) for the selected category
  const enabledOptionsForCategory = useMemo(() => {
    return mealOptions.filter(m => m.category === category && m.active !== false);
  }, [mealOptions, category]);

  // Handle category change: reset selected options or keep valid ones
  const handleCategoryChange = (newCat: 'Gremio' | 'Representante' | 'Alimentação' | 'Outros') => {
    setCategory(newCat);
    setCurrentSelectedDropdownOption('');
    // Filter down selected IDs that belong to the new category
    const validIds = mealOptions
      .filter(m => m.category === newCat && m.active !== false)
      .map(m => m.id);
    setSelectedOptionIds(prev => prev.filter(id => validIds.includes(id)));
    setFormError(null);
  };

  // Add option from dropdown
  const handleAddOptionFromDropdown = (optionIdToAdd?: string) => {
    const idToAdd = optionIdToAdd || currentSelectedDropdownOption;
    if (!idToAdd) return;
    if (!selectedOptionIds.includes(idToAdd)) {
      setSelectedOptionIds(prev => [...prev, idToAdd]);
    }
    setCurrentSelectedDropdownOption('');
    setFormError(null);
  };

  // Select all enabled options in this category
  const handleSelectAllEnabled = () => {
    const allIds = enabledOptionsForCategory.map(o => o.id);
    setSelectedOptionIds(allIds);
    setFormError(null);
  };

  // Remove option from selected list
  const handleRemoveOption = (idToRemove: string) => {
    setSelectedOptionIds(prev => prev.filter(id => id !== idToRemove));
  };

  // Quick date pickers
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    setVotingDate(dateStr);
  };

  // Submit new voting
  const handleCreateVoting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!votingDate) {
      setFormError('Por favor, selecione uma data específica para a votação.');
      return;
    }
    if (selectedOptionIds.length === 0) {
      setFormError('Selecione pelo menos uma opção cadastrada e habilitada para esta votação.');
      return;
    }

    const defaultTitle = title.trim() || `Votação de ${getCategoryLabel(category)} - ${new Date(votingDate + 'T12:00:00').toLocaleDateString('pt-BR')}`;

    const newSession: VotingSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: defaultTitle,
      description: description.trim() || undefined,
      category,
      date: votingDate,
      optionIds: selectedOptionIds,
      active: true,
      createdAt: new Date().toISOString()
    };

    onAddVotingSession(newSession);

    // Reset Form
    setTitle('');
    setDescription('');
    setSelectedOptionIds([]);
    setCurrentSelectedDropdownOption('');
    setFormError(null);
  };

  // Toggle active status
  const handleToggleActive = (session: VotingSession) => {
    onUpdateVotingSession({
      ...session,
      active: !session.active
    });
  };

  // Filtered voting sessions list
  const filteredSessions = useMemo(() => {
    let list = [...votingSessions];
    if (filterCategory !== 'all') {
      list = list.filter(s => s.category === filterCategory);
    }
    // Sort by date descending (newest first)
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [votingSessions, filterCategory]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Data não definida';
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateObj);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (diffDays === 0) return `${formatted} (Hoje)`;
    if (diffDays === 1) return `${formatted} (Amanhã)`;
    if (diffDays === -1) return `${formatted} (Ontem)`;
    if (diffDays > 1) return `${formatted} (em ${diffDays} dias)`;
    return `${formatted} (Encerrada)`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 animate-scaleIn">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fas fa-trash-alt"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Votação?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Esta ação removerá esta sessão de votação agendada. Os votos já registrados no banco histórico permanecerão arquivados.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteVotingSession(sessionToDelete);
                  setSessionToDelete(null);
                }}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/20 text-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left = Create Voting Form, Right = List of Created Votings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM PANEL: Criar Nova Votação */}
        <section className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit lg:sticky lg:top-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full mb-2">
              <i className="fas fa-calendar-plus"></i> Agendamento & Urna
            </div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              Criar Nova Votação
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure o dia específico e selecione quais opções habilitadas participarão da cédula.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-shake">
              <i className="fas fa-exclamation-circle text-base mt-0.5 shrink-0"></i>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateVoting} className="space-y-4">
            
            {/* 1. Category Selection */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
                1. Categoria da Votação
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-800"
                value={category}
                onChange={e => handleCategoryChange(e.target.value as any)}
                required
              >
                <option value="Gremio">🗳️ Grêmio Escolar</option>
                <option value="Representante">👤 Representante de Classe</option>
                <option value="Alimentação">🍎 Alimentação / Merenda</option>
                <option value="Outros">📋 Outros Assuntos</option>
              </select>
            </div>

            {/* 2. Specific Date Picker */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                  2. Data Específica da Votação
                </label>
                <span className="text-[10px] text-indigo-600 font-bold uppercase">Obrigatório</span>
              </div>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-800"
                value={votingDate}
                onChange={e => {
                  setVotingDate(e.target.value);
                  setFormError(null);
                }}
                required
              />
              {/* Quick Date Shortcuts */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition-colors"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition-colors"
                >
                  Amanhã
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition-colors"
                >
                  Em 7 dias
                </button>
              </div>
            </div>

            {/* 3. Title / Label (Optional or Auto) */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
                3. Título da Votação
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder:text-slate-400"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={`Ex: Eleição de ${getCategoryLabel(category)}`}
              />
              <p className="text-[10px] text-slate-400 mt-1">Se deixar em branco, o sistema gerará o título automaticamente com a categoria e a data.</p>
            </div>

            {/* 4. DROPDOWN (LISTA SUSPENSA) PARA ITENS CADASTRADOS E HABILITADOS */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                  4. Itens Cadastrados e Habilitados
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {enabledOptionsForCategory.length} habilitados
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Filtrado automaticamente pela categoria <strong>{getCategoryLabel(category)}</strong>:
              </p>

              {enabledOptionsForCategory.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-800"
                      value={currentSelectedDropdownOption}
                      onChange={e => {
                        const val = e.target.value;
                        setCurrentSelectedDropdownOption(val);
                        if (val) {
                          handleAddOptionFromDropdown(val);
                        }
                      }}
                    >
                      <option value="">Selecione um item/candidato da lista suspensa...</option>
                      {enabledOptionsForCategory.map(opt => {
                        const isAlreadySelected = selectedOptionIds.includes(opt.id);
                        return (
                          <option key={opt.id} value={opt.id} disabled={isAlreadySelected}>
                            {opt.name} {opt.calories ? `(ID/Chapa: ${opt.calories})` : ''} {isAlreadySelected ? '✓ (Já incluído)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    
                    <button
                      type="button"
                      onClick={() => handleAddOptionFromDropdown()}
                      disabled={!currentSelectedDropdownOption || selectedOptionIds.includes(currentSelectedDropdownOption)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                      title="Adicionar à votação"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>

                  {/* Quick Select All Button */}
                  <div className="flex justify-between items-center pt-1">
                    <button
                      type="button"
                      onClick={handleSelectAllEnabled}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                    >
                      <i className="fas fa-check-double"></i> Incluir todos os {enabledOptionsForCategory.length} habilitados
                    </button>
                    {selectedOptionIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedOptionIds([])}
                        className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Limpar seleção
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <i className="fas fa-info-circle text-amber-600"></i>
                    Nenhum item habilitado em {getCategoryLabel(category)}!
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Você precisa cadastrar ou habilitar opções nesta categoria para poder incluí-las na votação.
                  </p>
                  {onNavigateToOptions && (
                    <button
                      type="button"
                      onClick={onNavigateToOptions}
                      className="w-full text-center font-bold text-indigo-700 bg-white border border-amber-300 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      Ir para Cadastro de Opções →
                    </button>
                  )}
                </div>
              )}

              {/* Selected Options Chips/Cards Preview */}
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>Itens Selecionados para a Cédula ({selectedOptionIds.length})</span>
                </div>

                {selectedOptionIds.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedOptionIds.map(optId => {
                      const opt = mealOptions.find(m => m.id === optId);
                      if (!opt) return null;
                      return (
                        <div
                          key={opt.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryThemeColor(opt.category) }}></span>
                            <div className="truncate">
                              <span className="font-bold text-slate-800 block truncate">{opt.name}</span>
                              {opt.calories && (
                                <span className="text-[10px] text-slate-400 font-mono">ID: {opt.calories}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(opt.id)}
                            className="text-slate-400 hover:text-red-500 p-1 transition-colors shrink-0"
                            title="Remover da cédula"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic bg-slate-50/70 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                    Nenhum item selecionado ainda. Escolha no menu suspenso acima.
                  </p>
                )}
              </div>
            </div>

            {/* 5. Description (Optional) */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
                5. Descrição / Instruções aos Alunos (Opcional)
              </label>
              <textarea
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs h-20 placeholder:text-slate-400"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Orientações aos votantes, regras ou horários..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={selectedOptionIds.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <i className="fas fa-check-circle"></i>
              Criar e Agendar Votação
            </button>
          </form>
        </section>

        {/* LIST PANEL: Votações Criadas e Agendadas */}
        <section className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <i className="fas fa-calendar-check text-indigo-500"></i>
                Votações Cadastradas e Agendadas
                <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full ml-2">
                  {votingSessions.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Votações abertas, agendadas por data e seus itens participantes
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterCategory === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Todas ({votingSessions.length})
              </button>
              {(['Gremio', 'Representante', 'Alimentação', 'Outros'] as const).map(cat => {
                const count = votingSessions.filter(s => s.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterCategory === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {cat === 'Gremio' ? 'Grêmio' : cat === 'Representante' ? 'Rep.' : cat === 'Alimentação' ? 'Alim.' : 'Outros'} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Votings Cards List */}
          <div className="space-y-4">
            {filteredSessions.length > 0 ? (
              filteredSessions.map(session => {
                const includedOptions = mealOptions.filter(m => session.optionIds.includes(m.id));
                const todayStr = getTodayStr();
                const isToday = session.date === todayStr;

                return (
                  <div
                    key={session.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      session.active 
                        ? 'bg-slate-50/70 border-slate-200 hover:border-indigo-300' 
                        : 'bg-slate-100/50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-200/60">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: getCategoryThemeColor(session.category) }}
                          >
                            {getCategoryLabel(session.category)}
                          </span>
                          
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            session.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {session.active ? '● Ativa para Voto' : '○ Suspensa'}
                          </span>

                          {isToday && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 animate-pulse">
                              ★ Votação do Dia
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-extrabold text-slate-800">{session.title}</h4>
                        {session.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">{session.description}</p>
                        )}
                      </div>

                      {/* Date Badge */}
                      <div className="sm:text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data da Votação</span>
                        <span className="text-sm font-black text-slate-800 flex items-center sm:justify-end gap-1.5">
                          <i className="far fa-calendar-alt text-indigo-500"></i>
                          {formatDateDisplay(session.date)}
                        </span>
                      </div>
                    </div>

                    {/* Participating Options / Candidates */}
                    <div className="pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Itens / Candidatos na Cédula ({includedOptions.length}):
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {includedOptions.map(opt => (
                          <span
                            key={opt.id}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border ${
                              opt.active 
                                ? 'bg-white text-slate-700 border-slate-200 shadow-2xs' 
                                : 'bg-slate-200/70 text-slate-500 border-slate-300'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryThemeColor(opt.category) }}></span>
                            <span>{opt.name}</span>
                            {opt.calories && (
                              <span className="text-[10px] text-slate-400 font-mono">({opt.calories})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(session)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                          session.active
                            ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                        }`}
                      >
                        <i className={`fas ${session.active ? 'fa-pause' : 'fa-play'}`}></i>
                        {session.active ? 'Pausar Votação' : 'Ativar Votação'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSessionToDelete(session.id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center gap-1.5 transition-colors"
                      >
                        <i className="fas fa-trash"></i>
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  <i className="fas fa-calendar-plus"></i>
                </div>
                <h4 className="text-base font-bold text-slate-700 mb-1">Nenhuma votação configurada</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Use o formulário ao lado para escolher a categoria, selecionar o dia específico e os itens habilitados para criar uma votação.
                </p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-800">Confirmar Exclusão de Votação</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir esta sessão de votação? Essa ação removerá a sessão do banco de dados imediatamente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteVotingSession(sessionToDelete);
                  setSessionToDelete(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20 transition-all"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
