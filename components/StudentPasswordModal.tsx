import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface StudentPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSave: (updatedStudent: Student) => Promise<void> | void;
}

export const StudentPasswordModal: React.FC<StudentPasswordModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [successSaved, setSuccessSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setFeedbackError(null);
      setSuccessSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);

    // Validação da senha atual se o estudante já tiver senha cadastrada
    if (student.password && student.password.trim() !== '') {
      if (!currentPassword) {
        setFeedbackError('Por favor, informe a sua senha atual para validação de segurança.');
        return;
      }
      if (currentPassword.trim() !== student.password.trim()) {
        setFeedbackError('A senha atual informada está incorreta.');
        return;
      }
    }

    if (!newPassword.trim()) {
      setFeedbackError('Por favor, informe a nova senha.');
      return;
    }

    if (newPassword.trim().length < 3) {
      setFeedbackError('A nova senha deve conter no mínimo 3 caracteres.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setFeedbackError('A confirmação não coincide com a nova senha digitada.');
      return;
    }

    if (student.password && newPassword.trim() === student.password.trim()) {
      setFeedbackError('A nova senha deve ser diferente da sua senha atual.');
      return;
    }

    const updatedStudent: Student = {
      ...student,
      password: newPassword.trim()
    };

    setIsSubmitting(true);
    try {
      await onSave(updatedStudent);
      setSuccessSaved(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err);
      setFeedbackError(err.message || 'Erro ao registrar nova senha no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-md w-full overflow-hidden transition-all transform scale-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white p-6 relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl font-black text-white shadow-inner">
                <i className="fas fa-key"></i>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block">
                  Segurança da Conta
                </span>
                <h3 className="text-xl font-black tracking-tight">Atualizar Senha</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-xs"
              title="Fechar"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <p className="text-indigo-100 text-xs mt-2 leading-relaxed">
            Altere sua senha de acesso pessoal utilizada para entrar no portal e votar nas urnas.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Identificação do Aluno */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estudante</span>
              <p className="font-bold text-slate-800 truncate max-w-[220px]">{student.name}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matrícula</span>
              <span className="font-mono font-bold text-indigo-600">{student.matricula}</span>
            </div>
          </div>

          {/* Feedback de Erro */}
          {feedbackError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start gap-2 animate-shake">
              <i className="fas fa-exclamation-circle text-base mt-0.5 shrink-0"></i>
              <span className="font-semibold leading-relaxed">{feedbackError}</span>
            </div>
          )}

          {/* Feedback de Sucesso */}
          {successSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fadeIn font-bold">
              <i className="fas fa-check-circle text-emerald-600 text-base shrink-0"></i>
              <span>Senha atualizada com sucesso no banco de dados!</span>
            </div>
          )}

          {/* Senha Atual (apenas se aluno possuir senha prévia) */}
          {student.password && student.password.trim() !== '' && (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  disabled={isSubmitting || successSaved}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 text-xs transition-colors p-1"
                  title={showCurrentPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  <i className={`fas ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          )}

          {/* Nova Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha (mínimo 3 dígitos)"
                disabled={isSubmitting || successSaved}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 text-xs transition-colors p-1"
                title={showNewPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {/* Confirmar Nova Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                disabled={isSubmitting || successSaved}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 text-xs transition-colors p-1"
                title={showConfirmPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || successSaved}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || successSaved}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Salvando...</span>
                </>
              ) : successSaved ? (
                <>
                  <i className="fas fa-check"></i>
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  <span>Salvar Senha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
