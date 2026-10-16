import React, { useState, useMemo } from 'react';
import { MealOption, VotingSession } from '../types';

interface VotingManagementProps {
  mealOptions: MealOption[];
  votingSessions: VotingSession[];
  onAddVotingSession: (session: VotingSession) => void;
  onUpdateVotingSession: (session: VotingSession) => void;
  onDeleteVotingSession: (id: string) => void;
  onNavigateToOptions?: () => void;
  onAddMeal?: (meal: MealOption) => void;
}

export const VotingManagement: React.FC<VotingManagementProps> = ({
  mealOptions,
  votingSessions,
  onAddVotingSession,
  onUpdateVotingSession,
  onDeleteVotingSession,
  onNavigateToOptions,
  onAddMeal
}) => {
  // Today formatted as YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  // Standard predefined categories
  const standardCategories = ['Alimentação', 'Gremio', 'Representante', 'Outros'] as const;

  // Extract all existing categories dynamically from sessions and meal options
  const allAvailableCategories = useMemo(() => {
    const set = new Set<string>(standardCategories);
    votingSessions.forEach(s => s.category && set.add(s.category));
    mealOptions.forEach(m => m.category && set.add(m.category));
    return Array.from(set);
  }, [votingSessions, mealOptions]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Alimentação');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [votingDate, setVotingDate] = useState<string>(getTodayStr);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [currentSelectedDropdownOption, setCurrentSelectedDropdownOption] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Inline Option Creation State (Permitir criar uma ou mais opções no mesmo cadastro!)
  const [showAddOptionForm, setShowAddOptionForm] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionDesc, setNewOptionDesc] = useState('');
  const [newOptionIdent, setNewOptionIdent] = useState('');
  const [newOptionType, setNewOptionType] = useState<string>('Almoço');

  // Multi-day reuse modal state (Reutilizar em dias diferentes com a mesma regra de presença)
  const [reuseModalSession, setReuseModalSession] = useState<VotingSession | null>(null);
  const [reuseTargetDate, setReuseTargetDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  });
  const [reuseTitle, setReuseTitle] = useState('');

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

  const getCategoryThemeColor = (cat: string) => {
    switch (cat) {
      case 'Gremio': return '#4F46E5';
      case 'Representante': return '#F59E0B';
      case 'Alimentação': return '#10B981';
      case 'Outros': return '#8B5CF6';
      default: return '#0284C7';
    }
  };

  // Filter ONLY items registered and enabled for the selected category
  const enabledOptionsForCategory = useMemo(() => {
    return mealOptions.filter(m => m.category === category && m.active !== false);
  }, [mealOptions, category]);

  // Handle category change
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    setIsCreatingNewCategory(false);
    setCurrentSelectedDropdownOption('');
    const validIds = mealOptions
      .filter(m => m.category === newCat && m.active !== false)
      .map(m => m.id);
    setSelectedOptionIds(prev => prev.filter(id => validIds.includes(id)));
    setFormError(null);
  };

  // Confirm custom category creation
  const handleApplyCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    setCategory(trimmed);
    setIsCreatingNewCategory(false);
    setCustomCategoryInput('');
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

  // Quick Select All
  const handleSelectAllEnabled = () => {
    const allIds = enabledOptionsForCategory.map(o => o.id);
    setSelectedOptionIds(allIds);
    setFormError(null);
  };

  // Remove option from selected list
  const handleRemoveOption = (idToRemove: string) => {
    setSelectedOptionIds(prev => prev.filter(id => id !== idToRemove));
  };

  // Create & Add New Option right inside this form!
  const handleCreateAndAttachOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim()) {
      setFormError('Informe o nome da nova opção.');
      return;
    }

    const newId = 'opt_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);
    const newMeal: MealOption = {
      id: newId,
      name: newOptionName.trim(),
      description: newOptionDesc.trim() || 'Opção cadastrada diretamente na votação',
      category: category as any,
      calories: newOptionIdent.trim() || (category === 'Alimentação' ? newOptionType : 'Candidato'),
      active: true,
      mealType: newOptionType
    };

    if (onAddMeal) {
      onAddMeal(newMeal);
    }

    // Attach to current selection
    setSelectedOptionIds(prev => [...prev, newId]);

    // Reset inline option form
    setNewOptionName('');
    setNewOptionDesc('');
    setNewOptionIdent('');
    setShowAddOptionForm(false);
    setFormError(null);
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
      setFormError('Selecione ou crie pelo menos uma opção para esta votação.');
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

  // Reutilizar / Medir em Novo Dia (Multi-Day Measurement)
  const handleConfirmReuse = () => {
    if (!reuseModalSession || !reuseTargetDate) return;

    const baseTitle = reuseTitle.trim() || reuseModalSession.title;
    const [y, m, d] = reuseTargetDate.split('-').map(Number);
    const targetDateBR = new Date(y, m - 1, d).toLocaleDateString('pt-BR');

    const newReusedSession: VotingSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: `${baseTitle} (Medição ${targetDateBR})`,
      description: reuseModalSession.description,
      category: reuseModalSession.category,
      date: reuseTargetDate,
      optionIds: [...reuseModalSession.optionIds],
      active: true,
      parentSessionId: reuseModalSession.parentSessionId || reuseModalSession.id,
      createdAt: new Date().toISOString()
    };

    onAddVotingSession(newReusedSession);
    setReuseModalSession(null);
    setReuseTitle('');
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
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

      {/* Modal: Reutilizar Votação para Outro Dia (Multi-Day Measurement) */}
      {reuseModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 animate-scaleIn">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
                <i className="fas fa-redo-alt"></i> Mensuração em Dias Diferentes
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Reutilizar Votação para Novo Dia
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Programe esta mesma votação com as mesmas opções de votos ({reuseModalSession.optionIds.length} opções) para ser mensurada em uma nova data. A <strong>regra de presença em sala de aula</strong> será exigida para os alunos na nova data escolhida.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Votação Base:</span>
              <p className="font-bold text-slate-800">{reuseModalSession.title}</p>
              <p className="text-slate-500">Categoria: <strong>{getCategoryLabel(reuseModalSession.category)}</strong></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1">
                  Selecione a Nova Data para a Medição:
                </label>
                <input
                  type="date"
                  value={reuseTargetDate}
                  onChange={e => setReuseTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1">
                  Título Personalizado (Opcional):
                </label>
                <input
                  type="text"
                  placeholder={reuseModalSession.title}
                  value={reuseTitle}
                  onChange={e => setReuseTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReuseModalSession(null)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReuse}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-sm flex items-center justify-center gap-2"
              >
                <i className="fas fa-calendar-check"></i>
                Agendar Medição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left = Single Unified Registration Form, Right = List of Created Votings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORM PANEL: Cadastro Unificado de Votação (Formulário Único) */}
        <section className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6 h-fit lg:sticky lg:top-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full mb-2">
              <i className="fas fa-layer-group"></i> Cadastro Unificado
            </div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Criar Nova Votação
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cadastre a votação, crie categorias personalizadas e adicione uma ou mais opções diretamente nesta mesma tela.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-shake">
              <i className="fas fa-exclamation-circle text-base mt-0.5 shrink-0"></i>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateVoting} className="space-y-5">
            
            {/* 1. Category Selection & Creation */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                  1. Categoria da Votação
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewCategory(prev => !prev)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <i className={`fas ${isCreatingNewCategory ? 'fa-times' : 'fa-plus'}`}></i>
                  {isCreatingNewCategory ? 'Escolher existente' : '+ Criar Categoria'}
                </button>
              </div>

              {!isCreatingNewCategory ? (
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-800"
                  value={category}
                  onChange={e => handleCategoryChange(e.target.value)}
                  required
                >
                  {allAvailableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={e => setCustomCategoryInput(e.target.value)}
                    placeholder="Ex: Almoço Saudável, Projetos, etc..."
                    className="flex-1 px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomCategory}
                    disabled={!customCategoryInput.trim()}
                    className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                  >
                    Usar
                  </button>
                </div>
              )}
            </div>

            {/* 2. Specific Date Picker */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                  2. Data da Votação
                </label>
                <span className="text-[10px] text-indigo-600 font-bold uppercase">Obrigatório</span>
              </div>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-800 font-mono"
                value={votingDate}
                onChange={e => {
                  setVotingDate(e.target.value);
                  setFormError(null);
                }}
                required
              />
              {/* Quick Date Shortcuts */}
              <div className="flex gap-2 pt-1">
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

            {/* 3. Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                3. Título da Votação
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder:text-slate-400 font-medium text-slate-800"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={`Ex: Votação de ${getCategoryLabel(category)}`}
              />
            </div>

            {/* 4. UNIFIED OPTIONS: PICK EXISTING OR CREATE NEW RIGHT HERE! */}
            <div className="pt-3 border-t border-slate-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    4. Opções de Voto da Cédula
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Crie opções no ato ou selecione as já cadastradas:
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddOptionForm(prev => !prev)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <i className={`fas ${showAddOptionForm ? 'fa-minus' : 'fa-plus'}`}></i>
                  <span>{showAddOptionForm ? 'Fechar Cadastro' : '+ Criar Opção Aqui'}</span>
                </button>
              </div>

              {/* INLINE OPTION CREATOR: Criar nova opção no mesmo cadastro! */}
              {showAddOptionForm && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fas fa-plus-circle text-indigo-600"></i>
                      Nova Opção de Voto / Prato
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                      Categoria: {getCategoryLabel(category)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nome da Opção / Prato / Candidato (Ex: Feijoada Especial, Salada Completa...)"
                      value={newOptionName}
                      onChange={e => setNewOptionName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newOptionType}
                        onChange={e => setNewOptionType(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      >
                        <option value="Almoço">🍛 Almoço Completo</option>
                        <option value="Lanche">🥪 Lanche / Fruta</option>
                        <option value="Vegetariano">🥗 Vegetariano</option>
                        <option value="Sobremesa">🍎 Sobremesa</option>
                        <option value="Candidato">👤 Candidato / Chapa</option>
                        <option value="Geral">📋 Opção Geral</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Identificador / Calorias (Ex: 450 kcal, Nº 10)"
                        value={newOptionIdent}
                        onChange={e => setNewOptionIdent(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <textarea
                      placeholder="Descrição, ingredientes ou propostas..."
                      value={newOptionDesc}
                      onChange={e => setNewOptionDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none h-16 placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={handleCreateAndAttachOption}
                      disabled={!newOptionName.trim()}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <i className="fas fa-check"></i>
                      Salvar e Incluir Nesta Votação
                    </button>
                  </div>
                </div>
              )}

              {/* Dropdown de opções existentes */}
              {enabledOptionsForCategory.length > 0 && (
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-800"
                    value={currentSelectedDropdownOption}
                    onChange={e => {
                      const val = e.target.value;
                      setCurrentSelectedDropdownOption(val);
                      if (val) handleAddOptionFromDropdown(val);
                    }}
                  >
                    <option value="">Selecione uma opção já cadastrada...</option>
                    {enabledOptionsForCategory.map(opt => {
                      const isAlreadySelected = selectedOptionIds.includes(opt.id);
                      return (
                        <option key={opt.id} value={opt.id} disabled={isAlreadySelected}>
                          {opt.name} {opt.calories ? `(${opt.calories})` : ''} {isAlreadySelected ? '✓ (Incluído)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleAddOptionFromDropdown()}
                    disabled={!currentSelectedDropdownOption || selectedOptionIds.includes(currentSelectedDropdownOption)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              )}

              {/* Selected Options Chips */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>Opções na Cédula ({selectedOptionIds.length}):</span>
                  {selectedOptionIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedOptionIds([])}
                      className="text-slate-400 hover:text-red-500"
                    >
                      Limpar
                    </button>
                  )}
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
                    Nenhuma opção incluída ainda. Crie uma nova opção acima ou selecione uma existente.
                  </p>
                )}
              </div>
            </div>

            {/* 5. Description */}
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                5. Descrição / Instruções aos Alunos (Opcional)
              </label>
              <textarea
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs h-18 placeholder:text-slate-400"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Refeição do dia com sobremesa inclusa..."
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

        {/* LIST PANEL: Votações Cadastradas & Reutilização para Medição em Dias Diferentes */}
        <section className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-calendar-check text-indigo-500"></i>
                Votações Cadastradas e Agendadas
                <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full ml-2 font-mono">
                  {votingSessions.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Votações abertas, agendadas por data e opções para mensurar em dias diferentes
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterCategory === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Todas ({votingSessions.length})
              </button>
              {allAvailableCategories.slice(0, 4).map(cat => {
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
                    {cat.substring(0, 5)}. ({count})
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

                          {session.parentSessionId && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <i className="fas fa-link text-[9px] mr-1"></i> Medição Recorrente
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
                        <span className="text-sm font-black text-slate-800 flex items-center sm:justify-end gap-1.5 font-mono">
                          <i className="far fa-calendar-alt text-indigo-500"></i>
                          {formatDateDisplay(session.date)}
                        </span>
                      </div>
                    </div>

                    {/* Participating Options */}
                    <div className="pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Itens / Opções na Cédula ({includedOptions.length}):
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

                    {/* Card Actions: Reutilizar para Outro Dia, Pausar, Excluir */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => {
                          setReuseModalSession(session);
                          setReuseTitle(session.title);
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors"
                        title="Reutilizar esta votação com as mesmas opções para mensurar em outra data"
                      >
                        <i className="fas fa-redo-alt"></i>
                        Reutilizar em Outro Dia
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(session)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
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
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center gap-1.5 transition-colors"
                        >
                          <i className="fas fa-trash"></i>
                          Excluir
                        </button>
                      </div>
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
                  Use o formulário ao lado para cadastrar uma votação unificada, criar opções na hora e agendar as datas de medição.
                </p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};
