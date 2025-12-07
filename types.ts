

export interface Manifesto {
  id: string;
  usuario: string;
  cia: string;
  dataHoraPuxado: string;
  dataHoraRecebido: string;
  cargasINH: number;
  cargasIZ: number;
  status: string;
  turno: string;
  isDuplicata?: boolean;
  baseId?: string;
  carimboDataHR?: string; // Novo campo
  usuarioOperacao?: string; // Novo campo mapeado
  usuarioAcao?: string; // Novo campo solicitado
  
  // Novos campos de Timeline mapeados de colunas específicas
  dataHoraIniciado?: string;
  dataHoraDisponivel?: string;
  dataHoraConferencia?: string;
  dataHoraPendente?: string;
  dataHoraCompleto?: string;
}

export interface ManifestoLog {
  timestamp: string;
  usuario: string;
  acao: string;
  justificativa?: string;
  idManifesto: string;
}

export interface PerformanceLogDB {
  data: string;
  total_requisicoes: number;
  total_n8n: number;
  banda_mb: number;
  usuarios_unicos: string[]; // JSONB array no banco
  // Novos campos para detalhamento
  total_cadastro?: number;
  total_edicao?: number;
  total_cancelamento?: number;
  total_anulacao?: number;
  total_login?: number;
  total_logoff?: number;
}

// Interface atualizada conforme sua tabela 'Cadastro_de_Perfil' no Supabase e CSV fornecido
export interface User {
  id: number; // int8
  Usuario: string; // text - Coluna usada para Login
  Senha: number | string; // int8 - Coluna usada para Senha
  Nome_Completo: string; // text - Coluna usada para exibição
  
  // 🚨 CRITICAL: NÃO RENOMEAR ESTE CAMPO. 🚨
  // Ele deve ser EXATAMENTE 'sesson_id' para corresponder à coluna do banco de dados (CSV).
  // A lógica de "kick" de sessão em App.tsx depende disso.
  sesson_id?: string; 
  
  "Session_Data/HR"?: string; // ATUALIZADO: Nome exato da coluna no DB
}

// Interface exata da tabela SMO_Sistema no Supabase para mapeamento
export interface SMO_Sistema_DB {
  id: number;
  Usuario_Sistema: string;
  CIA: string;
  Manifesto_Puxado: string;
  Manifesto_Recebido: string;
  "Cargas_(IN/H)": number;
  "Cargas_(IZ)": number;
  Status: string;
  ID_Manifesto: string;
  Turno: string;
  "Carimbo_Data/HR"?: string; // Novo campo mapeado do banco
  "Usuario_Operação"?: string; // Novo campo mapeado do banco
  Usuario_Action?: string; // Novo campo mapeado do banco
  "Usuario_Ação"?: string; // Coluna específica com acento conforme banco de dados
  
  // Colunas específicas de datas da Timeline
  Manifesto_Iniciado?: string;
  Manifesto_Disponivel?: string;
  "Manifesto_em_Conferência"?: string; // Corrigido para nome exato da coluna no banco
  Manifesto_Pendente?: string;
  Manifesto_Completo?: string;
}

export const CIAS = ["Azul", "Gol", "Latam", "Modern", "Total"];