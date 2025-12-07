import { User } from './types';

/**
 * LISTA DE USUÁRIOS AUTORIZADOS
 * Adicione aqui os nomes EXATOS (Login ou Nome Completo) que podem ver o monitoramento.
 * A verificação é EXATA (Case-sensitive e sem variações).
 */
const PERFORMANCE_MONITOR_ALLOWLIST = [
  'Rafael Rodrigues',
  'Rafael Abraão Souza Rodrigues',
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

  // Verificação Exata (Nome Completo)
  // Se o Nome Completo for exatamente igual a um dos nomes da lista
  if (user.Nome_Completo && PERFORMANCE_MONITOR_ALLOWLIST.includes(user.Nome_Completo)) {
    return true;
  }

  return false;
};