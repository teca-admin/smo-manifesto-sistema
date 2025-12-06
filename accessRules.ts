
import { User } from './types';

/**
 * LISTA DE USUÁRIOS AUTORIZADOS
 * Adicione aqui os nomes de usuário (Login) que podem ver o monitoramento.
 * A verificação não diferencia maiúsculas de minúsculas (case-insensitive).
 */
const PERFORMANCE_MONITOR_ALLOWLIST = [
  'Rafael',
  'Rick'
];

/**
 * Verifica se o usuário atual tem permissão para acessar o Monitor de Performance.
 * @param user Objeto do usuário logado
 * @returns boolean
 */
export const canAccessPerformanceMonitor = (user: User | null): boolean => {
  if (!user || !user.Usuario) return false;
  
  // Normaliza para minúsculas para evitar erros de digitação
  const currentLogin = user.Usuario.toLowerCase().trim();
  
  // Verifica se o login atual CONTÉM algum dos nomes permitidos
  // Ex: "Rafael Rodrigues" contém "Rafael" -> Aprovado
  // Ex: "Rick" contém "Rick" -> Aprovado
  return PERFORMANCE_MONITOR_ALLOWLIST.some(
    allowedLogin => currentLogin.includes(allowedLogin.toLowerCase())
  );
};
