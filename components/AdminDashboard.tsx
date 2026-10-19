import React, { useState } from 'react';
import { Selection, MealOption, Student, VotingSession, AttendanceRecord } from '../types';
import { VotingManagement } from './VotingManagement';
import { IntelligentVotingDashboard } from './IntelligentVotingDashboard';
import { IntelligentAttendanceDashboard } from './IntelligentAttendanceDashboard';
import { IntelligentDecisionDashboard } from './IntelligentDecisionDashboard';

interface AdminDashboardProps {
  selections: Selection[];
  mealOptions: MealOption[];
  votingSessions?: VotingSession[];
  onAddMeal: (meal: MealOption) => void;
  onUpdateMeal: (meal: MealOption) => void;
  onDeleteMeal: (id: string) => void;
  onAddVotingSession?: (session: VotingSession) => void;
  onUpdateVotingSession?: (session: VotingSession) => void;
  onDeleteVotingSession?: (id: string) => void;
  students: Student[];
  attendanceRecords?: AttendanceRecord[];
  onSaveAttendance?: (date: string, presentMatriculas: string[]) => Promise<void> | void;
  currentSchoolId?: string | null;
  onSyncDatabase?: () => void;
  isSyncing?: boolean;
  lastSync?: string | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  selections,
  mealOptions,
  votingSessions = [],
  onAddMeal,
  onUpdateMeal,
  onDeleteMeal,
  onAddVotingSession,
  onUpdateVotingSession,
  onDeleteVotingSession,
  students,
  attendanceRecords = [],
  onSaveAttendance,
  currentSchoolId,
  onSyncDatabase,
  isSyncing = false,
  lastSync
}) => {
  // Exatamente as 4 abas solicitadas pelo usuário:
  // 1. Criar Votação ("DEIXE A ABA CRIAR VOTAÇÃO")
  // 2. Dashboard Inteligente de Votações ("CRIE APENAS UM DASHBOARD INTELIGENTE PARA VOTAÇÕES.")
  // 3. Dashboard Inteligente de Frequências ("CRIE APENAS UM DASHBOARD INTELIGENTE PARA AS FREQUÊNCIAS.")
  // 4. Dashboard Inteligente para Tomada de Decisão ("CRIE APENAS UM DASHBOARD INTELIGENTEPARA TOMADA DE DECISÃO EM RELAÇÃO AS CATEGORIAS CRIADAS.")
  const [activeTab, setActiveTab] = useState<'criar_votacao' | 'dashboard_votacoes' | 'dashboard_frequencias' | 'dashboard_decisao'>('criar_votacao');

  const totalGlobalVotes = selections.length;
  const totalRegisteredStudents = students.length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Barra de Navegação Exclusiva das 4 Abas Oficiais */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200/60 shadow-inner">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {/* Aba 1: Criar Votação */}
          <button
            type="button"
            onClick={() => setActiveTab('criar_votacao')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'criar_votacao'
                ? 'bg-white shadow-sm text-indigo-700 font-black ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <i className="fas fa-calendar-plus text-indigo-600"></i>
            <span>Criar Votação</span>
            {votingSessions.length > 0 && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                {votingSessions.length}
              </span>
            )}
          </button>

          {/* Aba 2: Dashboard Inteligente de Votações */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard_votacoes')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'dashboard_votacoes'
                ? 'bg-white shadow-sm text-indigo-700 font-black ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <i className="fas fa-chart-pie text-indigo-600"></i>
            <span>Dashboard Inteligente de Votações</span>
          </button>

          {/* Aba 3: Dashboard Inteligente de Frequências */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard_frequencias')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'dashboard_frequencias'
                ? 'bg-white shadow-sm text-emerald-700 font-black ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <i className="fas fa-user-check text-emerald-600"></i>
            <span>Dashboard Inteligente de Frequências</span>
          </button>

          {/* Aba 4: Dashboard Inteligente para Tomada de Decisão */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard_decisao')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'dashboard_decisao'
                ? 'bg-white shadow-sm text-purple-700 font-black ring-2 ring-purple-400/40'
                : 'text-purple-700 hover:text-purple-900 bg-purple-50/60 font-extrabold'
            }`}
          >
            <i className="fas fa-brain text-purple-600"></i>
            <span>Dashboard Inteligente para Tomada de Decisão</span>
          </button>
        </div>

        {/* Status rápido de quórum */}
        <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 self-end lg:self-auto font-mono tabular-nums shadow-2xs">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span>{totalGlobalVotes} votos apurados / {totalRegisteredStudents} estudantes</span>
        </div>
      </div>

      {/* RENDERIZAÇÃO EXCLUSIVA DE CADA UMA DAS 4 ABAS */}

      {/* 1. Criar Votação */}
      {activeTab === 'criar_votacao' && (
        <VotingManagement
          mealOptions={mealOptions}
          votingSessions={votingSessions}
          onAddVotingSession={onAddVotingSession || (() => {})}
          onUpdateVotingSession={onUpdateVotingSession || (() => {})}
          onDeleteVotingSession={onDeleteVotingSession || (() => {})}
          onAddMeal={onAddMeal}
        />
      )}

      {/* 2. Dashboard Inteligente de Votações */}
      {activeTab === 'dashboard_votacoes' && (
        <IntelligentVotingDashboard
          selections={selections}
          mealOptions={mealOptions}
          votingSessions={votingSessions}
          students={students}
          attendanceRecords={attendanceRecords}
          lastSync={lastSync}
          onRefresh={onSyncDatabase}
          isSyncing={isSyncing}
        />
      )}

      {/* 3. Dashboard Inteligente de Frequências */}
      {activeTab === 'dashboard_frequencias' && (
        <IntelligentAttendanceDashboard
          students={students}
          attendanceRecords={attendanceRecords}
          onSaveAttendance={onSaveAttendance || (async () => {})}
          selections={selections}
          currentSchoolId={currentSchoolId}
        />
      )}

      {/* 4. Dashboard Inteligente para Tomada de Decisão */}
      {activeTab === 'dashboard_decisao' && (
        <IntelligentDecisionDashboard
          selections={selections}
          mealOptions={mealOptions}
          votingSessions={votingSessions}
          students={students}
          attendanceRecords={attendanceRecords}
          onNavigateToVoting={() => setActiveTab('criar_votacao')}
          onReuseVoting={(session, targetDate) => {
            if (onAddVotingSession) {
              const [y, m, d] = targetDate.split('-').map(Number);
              const targetDateBR = new Date(y, m - 1, d).toLocaleDateString('pt-BR');
              const newSession: VotingSession = {
                id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                title: `${session.title} (Medição ${targetDateBR})`,
                description: session.description,
                category: session.category,
                date: targetDate,
                optionIds: [...session.optionIds],
                active: true,
                parentSessionId: session.parentSessionId || session.id,
                createdAt: new Date().toISOString()
              };
              onAddVotingSession(newSession);
              setActiveTab('criar_votacao');
            }
          }}
        />
      )}
    </div>
  );
};
