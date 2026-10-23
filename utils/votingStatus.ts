import { VotingSession } from '../types';

export interface SessionTimingStatus {
  isPastDay: boolean;        // session.date < today (o dia da votação já finalizou)
  isFutureDay: boolean;      // session.date > today
  isToday: boolean;          // session.date === today
  isTimeExpired: boolean;    // isToday and currentTime >= closingTime (bloqueada pelo horário)
  isFinalized: boolean;      // isPastDay || isTimeExpired (finalizada)
  isLocked: boolean;         // isFinalized || !session.active
  canVote: boolean;          // isToday && !isTimeExpired && session.active
  statusLabel: string;
  badgeBg: string;
  badgeText: string;
}

/**
 * Avalia o status temporal e bloqueio de uma sessão de votação:
 * - Se a data já passou (dia finalizado): votação encerrada/finalizada.
 * - Se for hoje e tiver horário cadastrado: bloqueia a votação assim que o horário limite for atingido.
 * - Se for no futuro: agendada.
 */
export function getSessionTimingStatus(session: VotingSession, now: Date = new Date()): SessionTimingStatus {
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;

  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  const sessionDate = session.date || todayStr;
  const isPastDay = sessionDate < todayStr;
  const isFutureDay = sessionDate > todayStr;
  const isToday = sessionDate === todayStr;

  let isTimeExpired = false;
  if (isToday && session.closingTime) {
    // Comparação de HH:mm no formato 24 horas (ex: "14:30" <= "15:00")
    isTimeExpired = currentTimeStr >= session.closingTime;
  }

  const isFinalized = isPastDay || isTimeExpired;
  const isLocked = isFinalized || !session.active;
  const canVote = isToday && !isTimeExpired && session.active;

  let statusLabel = 'Ativa para Voto';
  let badgeBg = 'bg-emerald-100 text-emerald-800';
  let badgeText = 'text-emerald-800';

  if (!session.active) {
    statusLabel = 'Pausada';
    badgeBg = 'bg-slate-200 text-slate-600';
    badgeText = 'text-slate-600';
  } else if (isPastDay) {
    statusLabel = 'Dia Finalizado';
    badgeBg = 'bg-slate-200 text-slate-700';
    badgeText = 'text-slate-700';
  } else if (isTimeExpired) {
    statusLabel = `Bloqueada (${session.closingTime})`;
    badgeBg = 'bg-rose-100 text-rose-800';
    badgeText = 'text-rose-800';
  } else if (isFutureDay) {
    statusLabel = `Agendada (${sessionDate.split('-').reverse().join('/')})`;
    badgeBg = 'bg-blue-100 text-blue-800';
    badgeText = 'text-blue-800';
  } else if (isToday) {
    statusLabel = session.closingTime 
      ? `Aberta até ${session.closingTime}` 
      : 'Aberta Hoje';
    badgeBg = 'bg-emerald-100 text-emerald-800';
    badgeText = 'text-emerald-800';
  }

  return {
    isPastDay,
    isFutureDay,
    isToday,
    isTimeExpired,
    isFinalized,
    isLocked,
    canVote,
    statusLabel,
    badgeBg,
    badgeText
  };
}
