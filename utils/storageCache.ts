/**
 * Cache inteligente local para o Firestore
 * Reduz drasticamente o consumo de leituras (reads) evitando requisições repetidas
 * para coleções estáticas ou dados já sincronizados recentemente.
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export const CACHE_KEYS = {
  SESSIONS: 'eduvotacao_cache_sessions',
  MEALS: 'eduvotacao_cache_meals',
  SCHOOLS: 'eduvotacao_cache_schools',
  ADMINS: 'eduvotacao_cache_admins',
  STUDENTS: 'eduvotacao_cache_students',
  SELECTIONS: 'eduvotacao_cache_selections',
  ATTENDANCE: 'eduvotacao_cache_attendance',
  STUDENT_VOTES: (matricula: string) => `eduvotacao_student_votes_${matricula}`
};

export const DEFAULT_TTL_MINUTES = 20; // 20 minutos de cache padrão

export function getCachedData<T>(key: string, maxAgeMinutes: number = DEFAULT_TTL_MINUTES): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: CacheItem<T> = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== 'number') return null;

    const ageInMinutes = (Date.now() - parsed.timestamp) / (1000 * 60);
    if (ageInMinutes > maxAgeMinutes) {
      // Expirou
      return null;
    }

    return parsed.data;
  } catch (e) {
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    console.warn('Erro ao salvar no cache local:', e);
  }
}

export function clearCache(key?: string): void {
  try {
    if (key) {
      localStorage.removeItem(key);
    } else {
      Object.values(CACHE_KEYS).forEach(k => {
        if (typeof k === 'string') {
          localStorage.removeItem(k);
        }
      });
    }
  } catch (e) {}
}

export function getLastSyncTime(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: CacheItem<any> = JSON.parse(raw);
    if (!parsed || !parsed.timestamp) return null;
    const d = new Date(parsed.timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return null;
  }
}
