
-- =============================================================================
-- SISTEMA DE MANIFESTO OPERACIONAL (SMO) - VERSÃO 2.5 (WFS & CIA)
-- =============================================================================

-- 1. TABELA DE USUÁRIOS E PERFIS
CREATE TABLE IF NOT EXISTS public."Cadastro_de_Perfil" (
    id bigint primary key generated always as identity,
    "Usuario" text unique not null,
    "Senha" text not null,
    "Nome_Completo" text,
    "sesson_id" text,
    "Session_Data/HR" text,
    created_at timestamptz default now()
);

-- 2. TABELA PRINCIPAL DE MANIFESTOS (Mestre) - Versão 2.5
CREATE TABLE IF NOT EXISTS public."SMO_Sistema" (
    id bigint primary key generated always as identity,
    "ID_Manifesto" text unique not null,
    "Usuario_Sistema" text,
    "CIA" text not null,
    "Manifesto_Puxado" text,
    "Manifesto_Recebido" text,
    "Representante_CIA" text, -- Marco temporal do Representante
    "Manifesto_Entregue" text,  -- Marco temporal da Entrega Final
    "Cargas_(IN/H)" integer default 0,
    "Cargas_(IZ)" integer default 0,
    "Status" text default 'Manifesto Recebido',
    "Turno" text,
    "Carimbo_Data/HR" text,
    "Usuario_Ação" text,
    "Usuario_Operação" text,
    "Manifesto_Iniciado" text,
    "Manifesto_Disponivel" text,
    "Manifesto_em_Conferência" text,
    "Manifesto_Pendente" text,
    "Manifesto_Completo" text,
    created_at timestamptz default now(),
    constraint cia_valida check ("CIA" in ('Azul', 'Gol', 'Latam', 'Modern', 'Total'))
);

-- 3. TABELA DE REGISTROS OPERACIONAIS (Log de Eventos)
CREATE TABLE IF NOT EXISTS public."SMO_Operacional" (
    id bigint primary key generated always as identity,
    "ID_Manifesto" text references public."SMO_Sistema"("ID_Manifesto") on delete cascade,
    "Ação" text not null,
    "Usuario" text not null,
    "Cargas_(IN/H)" integer,
    "Cargas_(IZ)" integer,
    "Justificativa" text,
    "Created_At_BR" text,
    created_at timestamptz default now()
);

-- 4. TABELA DE FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS public."Funcionarios_WFS" (
    id bigint primary key generated always as identity,
    "Nome" text not null,
    "Cargo" text,
    "Ativo" boolean default true,
    created_at timestamptz default now()
);

-- 5. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_ops_manifesto_id ON public."SMO_Operacional" ("ID_Manifesto");
CREATE INDEX IF NOT EXISTS idx_sys_manifesto_id ON public."SMO_Sistema" ("ID_Manifesto");

-- 6. DADOS INICIAIS
INSERT INTO public."Cadastro_de_Perfil" ("Usuario", "Senha", "Nome_Completo") 
VALUES ('Rafael Rodrigues', '123456', 'Rafael Rodrigues')
ON CONFLICT ("Usuario") DO UPDATE SET "Senha" = EXCLUDED."Senha";

-- POLICIES
ALTER TABLE public."SMO_Operacional" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for now" ON public."SMO_Operacional" FOR ALL USING (true) WITH CHECK (true);
