
import { createClient } from '@supabase/supabase-js';

// Credenciais fornecidas para o projeto SMO
// IMPORTANTE: Se o Row Level Security (RLS) estiver ativo no Supabase sem policies, 
// a conexão funcionará mas as consultas retornarão vazio.
const PROVIDED_URL = 'https://uenyphrkihqrxvygceqn.supabase.co'.trim();
const PROVIDED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbnlwaHJraWhxcnh2eWdjZXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDgyMjIsImV4cCI6MjA3OTU4NDIyMn0.54hKp2bE9_wbQSE0PYSrv7v-2ojgLo7KatGOzEL2q8Q'.trim();

export const supabase = createClient(PROVIDED_URL, PROVIDED_KEY);
