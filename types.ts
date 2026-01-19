
export interface Manifesto {
  id: string;
  usuario: string;
  cia: string;
  dataHoraPuxado: string;
  dataHoraRecebido: string;
  status: string;
  turno: string;
  carimboDataHR?: string;
  usuarioOperacao?: string;
  usuarioAcao?: string;
  
  dataHoraIniciado?: string;
  dataHoraDisponivel?: string;
  dataHoraConferencia?: string;
  dataHoraPendente?: string;
  dataHoraCompleto?: string;
}

export interface OperationalLog {
  id: number;
  idManifesto: string;
  acao: string;
  usuario: string;
  justificativa?: string;
  createdAtBR: string;
}

export interface User {
  id: number;
  Usuario: string;
  Senha: number | string;
  Nome_Completo: string;
  sesson_id?: string; 
  "Session_Data/HR"?: string;
}

export interface SMO_Sistema_DB {
  id: number;
  Usuario_Sistema: string;
  CIA: string;
  Manifesto_Puxado: string;
  Manifesto_Recebido: string;
  Status: string;
  ID_Manifesto: string;
  Turno: string;
  "Carimbo_Data/HR"?: string;
  "Usuario_Operação"?: string;
  "Usuario_Ação"?: string;
  Manifesto_Iniciado?: string;
  Manifesto_Disponivel?: string;
  "Manifesto_em_Conferência"?: string;
  Manifesto_Pendente?: string;
  Manifesto_Completo?: string;
}

// Added PerformanceLogDB interface for performance monitoring metrics
export interface PerformanceLogDB {
  data: string;
  total_requisicoes: number;
  total_n8n: number;
  banda_mb: number;
  usuarios_unicos: string[];
  ultima_atualizacao: string;
  total_cadastro: number;
  total_edicao: number;
  total_cancelamento: number;
  total_anulacao: number;
  total_login: number;
  total_logoff: number;
  detalhes_hora?: Record<string, number>;
}

export const CIAS = ["Azul", "Gol", "Latam", "Modern", "Total"];
