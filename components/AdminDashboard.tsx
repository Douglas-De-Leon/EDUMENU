import React, { useState } from 'react';
import { Selection, MealOption, Student, VotingSession, AttendanceRecord } from '../types';
import { VotingManagement } from './VotingManagement';
import { IntelligentVotingDashboard } from './IntelligentVotingDashboard';
import { IntelligentAttendanceDashboard } from './IntelligentAttendanceDashboard';
import { FoodNutritionDashboard } from './FoodNutritionDashboard';

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
  // As 4 abas oficiais da gestão escolar:
  // 1. Criar Votação
  // 2. Dashboard Inteligente de Votações
  // 3. Dashboard Inteligente de Frequências
  // 4. Dashboard de Alimentação
  const [activeTab, setActiveTab] = useState<'criar_votacao' | 'dashboard_votacoes' | 'dashboard_frequencias' | 'dashboard_alimentacao'>('criar_votacao');

  const totalGlobalVotes = selections.length;
  const totalRegisteredStudents = students.length;

  return (
    <div className="w-full space-y-6 animate-fadeIn min-w-0">
      {/* Barra Superior com Extensão Total da Tela */}
      <div className="w-full bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        {/* Linha de Título e Quórum Integrado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Painel Integrado de Decisão & Gestão Escolar
            </span>
          </div>

          <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 font-mono tabular-nums shadow-2xs self-stretch sm:self-auto justify-center sm:justify-start">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0"></span>
            <span className="truncate">{totalGlobalVotes} votos apurados / {totalRegisteredStudents} discentes</span>
          </div>
        </div>

        {/* 4 Abas Oficiais com Extensão Total Perfeitamente Enquadradas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
          {/* Aba 1: Criar Votação */}
          <button
            type="button"
            onClick={() => setActiveTab('criar_votacao')}
            className={`w-full min-w-0 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'criar_votacao'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black ring-2 ring-indigo-600/30'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <i className="fas fa-calendar-plus shrink-0"></i>
            <span className="truncate">Criar Votação</span>
            {votingSessions.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black shrink-0 ${
                activeTab === 'criar_votacao' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {votingSessions.length}
              </span>
            )}
          </button>

          {/* Aba 2: Dashboard Inteligente de Votações */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard_votacoes')}
            className={`w-full min-w-0 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard_votacoes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black ring-2 ring-indigo-600/30'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <i className="fas fa-chart-pie shrink-0"></i>
            <span className="truncate">Dashboard de Votações</span>
          </button>

          {/* Aba 3: Dashboard Inteligente de Frequências */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard_frequencias')}
            className={`w-full min-w-0 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard_frequencias'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black ring-2 ring-emerald-600/30'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <i className="fas fa-user-check shrink-0"></i>
            <span className="truncate">Dashboard de Frequências</span>
          </button>

          {/* Aba 4: Dashboard de Alimentação */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard_alimentacao')}
            className={`w-full min-w-0 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard_alimentacao'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20 font-black ring-2 ring-orange-600/30'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <i className="fas fa-utensils shrink-0"></i>
            <span className="truncate">Dashboard de Alimentação</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
              activeTab === 'dashboard_alimentacao' ? 'bg-white text-orange-700' : 'bg-orange-100 text-orange-800'
            }`}>
              Nutrição
            </span>
          </button>
        </div>
      </div>

      {/* RENDERIZAÇÃO EXCLUSIVA DAS 3 ABAS OFICIAIS */}

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

      {/* 4. Dashboard de Alimentação & Nutrição */}
      {activeTab === 'dashboard_alimentacao' && (
        <FoodNutritionDashboard
          students={students}
          attendanceRecords={attendanceRecords}
          mealOptions={mealOptions}
          votingSessions={votingSessions}
          onAddMeal={onAddMeal}
          onAddVotingSession={onAddVotingSession}
          currentSchoolId={currentSchoolId}
        />
      )}
    </div>
  );
};
