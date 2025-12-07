import { User } from './types';

/**
 * LISTA DE USUÁRIOS AUTORIZADOS
 * Adicione aqui os nomes EXATOS (Login) que podem ver o monitoramento.
 * A verificação é EXATA (Case-sensitive e sem variações).
 */
const PERFORMANCE_MONITOR_ALLOWLIST = [
  'Rafael Rodrigues',
  'Rick Claudio'
];

/**
 * Verifica se o usuário atual tem permissão para acessar o Monitor de Performance.
 * @param user Objeto do usuário logado
 * @returns boolean
 */
export const canAccessPerformanceMonitor = (user: User | null): boolean => {
  if (!user) return false;

  // Verificação Exata (Login)
  // Se o Login for exatamente igual a um dos nomes da lista
  if (user.Usuario && PERFORMANCE_MONITOR_ALLOWLIST.includes(user.Usuario)) {
    return true;
  }

  return false;
};