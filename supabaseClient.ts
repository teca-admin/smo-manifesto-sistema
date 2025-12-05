
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURAÇÃO SUPABASE (EASYPANEL / SELF-HOSTED)
// ------------------------------------------------------------------
// Substitua as variáveis abaixo pelos dados do seu Supabase no Easypanel.
//
// ONDE ENCONTRAR:
// 1. Abra o Supabase Studio (Dashboard do seu Supabase no Easypanel).
// 2. Vá em "Settings" (ícone de engrenagem) -> "API".
// 3. Copie a URL do projeto e a chave "anon" / "public".
// ------------------------------------------------------------------

const SUPABASE_URL = 'https://teca-admin-supabase.ly7t0m.easypanel.host/'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

// Define o schema do banco de dados onde estão as tabelas do sistema
export const DB_SCHEMA = 'SMO_Sistema_de_Manifesto_Operacional';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true, // Mantém a sessão salva no navegador
    autoRefreshToken: true, // Tenta renovar o token automaticamente
    detectSessionInUrl: true
  },
  db: {
    schema: DB_SCHEMA // Define o schema padrão para todas as consultas
  }
});
