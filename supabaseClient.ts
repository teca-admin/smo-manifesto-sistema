
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURAÇÃO SUPABASE (NOVO PROJETO)
// ------------------------------------------------------------------

const SUPABASE_URL = 'https://wntkbpnnpvpdpvvjygkr.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudGticG5ucHZwZHB2dmp5Z2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzI0NDEsImV4cCI6MjA4NDQwODQ0MX0.Rr-7duorP381G2DEFK5vUOgb55U5dmcBx9LhgMGSVwc';

// Define o schema do banco de dados como o padrão do Supabase
export const DB_SCHEMA = 'public';

// Schema used for Performance Monitor tables and RPCs
export const PERFORMANCE_SCHEMA = 'public';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true, // Mantém a sessão salva no navegador
    autoRefreshToken: true, // Tenta renovar o token automaticamente
    detectSessionInUrl: true
  },
  db: {
    schema: DB_SCHEMA // Define o schema padrão (public) para todas as consultas
  }
});