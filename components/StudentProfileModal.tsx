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
  const [formData, setFormData] = useState({
    name: student.name || '',
    password: student.password || '',
    sala: student.sala || '1º Ano',
    turma: student.turma || '',
    turno: student.turno || 'Integral',
    email: student.email || '',
    responsibleName: student.responsibleName || '',
    responsibleEmail: student.responsibleEmail || '',
    responsiblePhone: student.responsiblePhone || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isCustomTurno, setIsCustomTurno] = useState(false);
  const [customTurnoInput, setCustomTurnoInput] = useState('');
  const [isCustomSala, setIsCustomSala] = useState(false);
  const [customSalaInput, setCustomSalaInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [successSaved, setSuccessSaved] = useState(false);

  // Sync state whenever student changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: student.name || '',
        password: student.password || '',
        sala: student.sala || '1º Ano',
        turma: student.turma || '',
        turno: student.turno || 'Integral',
        email: student.email || '',
        responsibleName: student.responsibleName || '',
        responsibleEmail: student.responsibleEmail || '',
        responsiblePhone: student.responsiblePhone || ''
      });
      setIsCustomTurno(false);
      setIsCustomSala(false);
      setFeedbackError(null);
      setSuccessSaved(false);
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const standardSalas = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '9º Ano', 'EJA', 'Ensino Médio Integrado'];
  const standardTurnos = ['Integral', 'Manhã', 'Tarde', 'Noite', 'Matutino', 'Vespertino', 'Noturno'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);

    if (!formData.name.trim()) {
      setFeedbackError('Por favor, informe seu nome completo.');
      return;
    }

    const updatedStudent: Student = {
      ...student,
      // Matrícula permanece estritamente intocada
      matricula: student.matricula,
      name: formData.name.trim(),
      password: formData.password.trim(),
      sala: (isCustomSala && customSalaInput.trim()) ? customSalaInput.trim() : formData.sala,
      turma: (formData.turma || '').trim().slice(0, 10).toUpperCase(),
      turno: (isCustomTurno && customTurnoInput.trim()) ? customTurnoInput.trim() : formData.turno,
      email: (formData.email || '').trim(),
      responsibleName: (formData.responsibleName || '').trim(),
      responsibleEmail: (formData.responsibleEmail || '').trim(),
      responsiblePhone: (formData.responsiblePhone || '').trim(),
      schoolId: student.schoolId
    };

    setIsSubmitting(true);
    try {
      await onSave(updatedStudent);
      setSuccessSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao atualizar dados do discente:', err);
      setFeedbackError(err.message || 'Erro ao salvar alterações no banco de dados.');
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
                <i className="fas fa-user-edit"></i>
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200 block">
                  Perfil do Aluno
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Atualizar Meus Dados Cadastrais
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
            Mantenha suas informações pessoais e contatos em dia. Por diretriz de segurança e integridade eleitoral, a matrícula não pode ser alterada.
          </p>
        </div>

        {/* Scrollable Form Body */}
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
              <span>Dados cadastrais atualizados com sucesso no sistema!</span>
            </div>
          )}

          {/* Campo de Matrícula (Bloqueado/Imutável como exigido na instrução) */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fas fa-id-card text-indigo-600"></i>
                Número de Matrícula
              </label>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200/90 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-300 flex items-center gap-1">
                <i className="fas fa-lock text-slate-500 text-[10px]"></i>
                Campo Não Editável
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={student.matricula}
                disabled
                readOnly
                className="w-full px-4 py-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl font-mono text-sm font-bold cursor-not-allowed select-none shadow-inner"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="fas fa-shield-alt text-sm"></i>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <i className="fas fa-info-circle text-indigo-500 text-xs"></i>
              A matrícula é a identidade oficial da sua cédula eleitoral e registro acadêmico.
            </p>
          </div>

          {/* Dados Principais do Aluno */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Nome Completo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Senha de Acesso */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Senha de Acesso à Urna
              </label>
              <div className="relative">
                <i className="fas fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Sua senha de login"
                  className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 text-sm p-1 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Utilizada para entrar e confirmar seu voto na urna eletrônica.
              </p>
            </div>

            {/* Série / Ano */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Série / Ano
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSala(!isCustomSala)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {isCustomSala ? 'Escolher da lista' : '+ Digitar outra'}
                </button>
              </div>
              {!isCustomSala ? (
                <div className="relative">
                  <i className="fas fa-graduation-cap absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <select
                    value={formData.sala}
                    onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {standardSalas.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    {!standardSalas.includes(formData.sala) && (
                      <option value={formData.sala}>{formData.sala}</option>
                    )}
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  value={customSalaInput}
                  onChange={(e) => setCustomSalaInput(e.target.value)}
                  placeholder="Ex: 5º Módulo, Especial..."
                  className="w-full px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
              )}
            </div>

            {/* Turma (Até 10 caracteres) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Turma
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {formData.turma.length}/10 caracteres
                </span>
              </div>
              <div className="relative">
                <i className="fas fa-users-class absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.turma}
                  onChange={(e) => setFormData({ ...formData, turma: e.target.value.slice(0, 10).toUpperCase() })}
                  placeholder="Ex: M3L9LP01, 101, A"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 uppercase focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Turno */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Turno
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomTurno(!isCustomTurno)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {isCustomTurno ? 'Escolher da lista' : '+ Digitar outro'}
                </button>
              </div>
              {!isCustomTurno ? (
                <div className="relative">
                  <i className="fas fa-clock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <select
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {standardTurnos.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    {!standardTurnos.includes(formData.turno) && (
                      <option value={formData.turno}>{formData.turno}</option>
                    )}
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  value={customTurnoInput}
                  onChange={(e) => setCustomTurnoInput(e.target.value)}
                  placeholder="Ex: Semi-integral, Noturno B..."
                  className="w-full px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
              )}
            </div>

            {/* E-mail do Aluno */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                E-mail do Aluno
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aluno@escola.gov.br"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Bloco de Contato do Responsável */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/70 to-purple-50/50 rounded-2xl border border-indigo-100/80 space-y-3.5">
            <div className="flex items-center gap-2 text-indigo-950 font-black text-xs uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
                <i className="fas fa-user-shield"></i>
              </div>
              <span>Contato do Responsável Legal</span>
            </div>
            <p className="text-slate-500 text-xs">
              Informações utilizadas pela gestão escolar para comunicações institucionais e notificações.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Nome do Responsável
                </label>
                <div className="relative">
                  <i className="fas fa-user-tie absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={formData.responsibleName}
                    onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                    placeholder="Ex: Patrícia de Santana (Mãe/Pai/Tutor)"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  E-mail do Responsável
                </label>
                <div className="relative">
                  <i className="fas fa-at absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="email"
                    value={formData.responsibleEmail}
                    onChange={(e) => setFormData({ ...formData, responsibleEmail: e.target.value })}
                    placeholder="responsavel@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Telefone / WhatsApp do Responsável
                </label>
                <div className="relative">
                  <i className="fas fa-phone-alt absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="tel"
                    value={formData.responsiblePhone}
                    onChange={(e) => setFormData({ ...formData, responsiblePhone: e.target.value })}
                    placeholder="(91) 98765-4321"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
                  <span>Salvar Meus Dados</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
