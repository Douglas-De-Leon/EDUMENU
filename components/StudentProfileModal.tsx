import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSave: (updatedStudent: Student) => Promise<void> | void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave
}) => {
  // O discente só pode atualizar seu e-mail e os dados do responsável (nome, telefone e e-mail)
  const [email, setEmail] = useState(student.email || '');
  const [responsibleName, setResponsibleName] = useState(student.responsibleName || '');
  const [responsiblePhone, setResponsiblePhone] = useState(student.responsiblePhone || '');
  const [responsibleEmail, setResponsibleEmail] = useState(student.responsibleEmail || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [successSaved, setSuccessSaved] = useState(false);

  // Sincroniza sempre que o modal abre ou os dados do discente mudarem
  useEffect(() => {
    if (isOpen) {
      setEmail(student.email || '');
      setResponsibleName(student.responsibleName || '');
      setResponsiblePhone(student.responsiblePhone || '');
      setResponsibleEmail(student.responsibleEmail || '');
      setFeedbackError(null);
      setSuccessSaved(false);
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);

    // Validação básica de formato de e-mail quando preenchido
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFeedbackError('Por favor, informe um endereço de e-mail válido para o aluno.');
      return;
    }

    if (responsibleEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(responsibleEmail.trim())) {
      setFeedbackError('Por favor, informe um endereço de e-mail válido para o responsável.');
      return;
    }

    // Monta o discente mantendo todos os dados acadêmicos e matrícula estritamente intactos
    const updatedStudent: Student = {
      ...student,
      matricula: student.matricula,
      name: student.name,
      password: student.password,
      sala: student.sala,
      turma: student.turma,
      turno: student.turno,
      schoolId: student.schoolId,
      // Apenas os dados permitidos para o aluno atualizar:
      email: email.trim(),
      responsibleName: responsibleName.trim(),
      responsiblePhone: responsiblePhone.trim(),
      responsibleEmail: responsibleEmail.trim()
    };

    setIsSubmitting(true);
    try {
      await onSave(updatedStudent);
      setSuccessSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao salvar contatos do aluno:', err);
      setFeedbackError(err.message || 'Erro ao registrar atualizações no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-2xl w-full overflow-hidden transition-all transform scale-100 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white p-6 sm:p-7 relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl font-black text-white shadow-inner">
                <i className="fas fa-address-book"></i>
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200 block">
                  Portal do Aluno • Contatos
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Atualizar Dados de Contato
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-indigo-100 mt-2 font-medium leading-relaxed">
            Você pode atualizar seu <strong>e-mail</strong> e os dados de contato do seu <strong>responsável legal</strong> (nome, telefone e e-mail). Matrícula e registros escolares são bloqueados por segurança.
          </p>
        </div>

        {/* Formulário com rolagem suave */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1">
          {feedbackError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-rose-500"></i>
              <span>{feedbackError}</span>
            </div>
          )}

          {successSaved && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-700 flex items-center gap-2 animate-pulse">
              <i className="fas fa-check-circle text-emerald-500"></i>
              <span>Dados de contato atualizados com sucesso no sistema!</span>
            </div>
          )}

          {/* Seção 1: Dados Acadêmicos Oficiais (Não Editáveis pelo Aluno) */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 relative">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <i className="fas fa-id-card-clip text-indigo-600 text-sm"></i>
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Identificação Escolar Oficial
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-300 flex items-center gap-1">
                <i className="fas fa-lock text-[9px] text-slate-500"></i>
                Bloqueado para Edição
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Matrícula */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Número de Matrícula
                </label>
                <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-700 select-all flex items-center justify-between">
                  <span>{student.matricula}</span>
                  <i className="fas fa-shield-alt text-slate-400 text-xs" title="Identificador oficial na urna"></i>
                </div>
              </div>

              {/* Nome do Aluno */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nome Completo
                </label>
                <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 truncate">
                  {student.name}
                </div>
              </div>

              {/* Série / Ano */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Série / Ano
                </label>
                <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                  {student.sala || 'Não informada'}
                </div>
              </div>

              {/* Turma e Turno */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Turma & Turno
                </label>
                <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span>Turma: <strong className="font-mono">{student.turma || '-'}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Turno: {student.turno || '-'}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1 font-medium">
              <i className="fas fa-info-circle text-indigo-500 text-xs"></i>
              Para retificar nome, turma ou dados escolares, procure a secretaria ou coordenação da instituição.
            </p>
          </div>

          {/* Seção 2: E-mail do Aluno (Editável) */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                <i className="fas fa-envelope"></i>
              </div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Seu E-mail de Contato
              </h4>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                E-mail do Aluno
              </label>
              <div className="relative">
                <i className="fas fa-at absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo.aluno@escola.gov.br"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Utilizado para o recebimento de notificações e comprovantes das votações escolares.
              </p>
            </div>
          </div>

          {/* Seção 3: Dados do Responsável Legal (Editáveis) */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 rounded-2xl border border-indigo-100/90 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-950 font-black text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shadow-xs">
                  <i className="fas fa-user-shield"></i>
                </div>
                <span>Dados do Responsável Legal</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                Pai, Mãe ou Tutor
              </span>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Mantenha o nome, telefone e e-mail do seu responsável legal sempre atualizados para fins de comunicação escolar institucional.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nome do Responsável */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Nome do Responsável
                </label>
                <div className="relative">
                  <i className="fas fa-user-tie absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Ex: Maria de Santana (Mãe/Pai/Tutor)"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Telefone do Responsável */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Telefone / WhatsApp do Responsável
                </label>
                <div className="relative">
                  <i className="fas fa-phone-alt absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="tel"
                    value={responsiblePhone}
                    onChange={(e) => setResponsiblePhone(e.target.value)}
                    placeholder="(91) 98765-4321"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* E-mail do Responsável */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  E-mail do Responsável
                </label>
                <div className="relative">
                  <i className="fas fa-envelope-open-text absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="email"
                    value={responsibleEmail}
                    onChange={(e) => setResponsibleEmail(e.target.value)}
                    placeholder="responsavel@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ações do Rodapé */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-circle-notch fa-spin text-xs"></i>
                  <span>Salvando no Banco...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save text-xs"></i>
                  <span>Salvar Dados de Contato</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
