
export interface Manifesto {
  id: string;
  usuario: string;
  cia: string;
  dataHoraPuxado: string;
  dataHoraRecebido: string;
  dataHoraRepresentanteCIA?: string; 
  dataHoraEntregue?: string;        
  status: string;
  turno: string;
  carimboDataHR?: string;
  usuarioOperacao?: string;
  usuarioAcao?: string;
  usuarioResponsavel?: string; 
  
  dataHoraIniciado?: string;
  dataHoraDisponivel?: string;
  dataHoraConferencia?: string;
  dataHoraPendente?: string;
  dataHoraCompleto?: string;
}

export interface Funcionario {
  id: number;
  Nome: string;
  Cargo?: string;
  Ativo: boolean;
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
  Representante_CIA?: string; 
  Manifesto_Entregue?: string;  
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

export const CIAS = ["Azul", "Gol", "Latam", "Modern", "Total"];
