
-- =============================================================================
-- SISTEMA DE MANIFESTO OPERACIONAL (SMO) - SCRIPT DE ESTRUTURA V2.5
-- Limpo, sem rastros de "Gestão de Performance"
-- =============================================================================

-- 1. TABELA PRINCIPAL DE MONITORAMENTO (SMO_Sistema)
-- Armazena o estado atual de cada manifesto e seus carimbos de tempo.
CREATE TABLE IF NOT EXISTS public."SMO_Sistema" (
    id bigint primary key generated always as identity,
    "ID_Manifesto" text unique not null,
    "Usuario_Sistema" text,                 -- Quem cadastrou ( Dashboard )
    "CIA" text not null,                     -- Companhia Aérea
    "Manifesto_Puxado" text,                -- Timestamp Puxado
    "Manifesto_Recebido" text,              -- Timestamp Recebido
    "Manifesto_Iniciado" text,              -- Timestamp Início Operação
    "Manifesto_Disponivel" text,            -- Timestamp Disponível
    "Manifesto_em_Conferência" text,        -- Timestamp Conferência
    "Manifesto_Pendente" text,              -- Timestamp Pendente
    "Manifesto_Completo" text,              -- Timestamp Operação Finalizada
    "Representante_CIA" text,               -- Timestamp Assinatura Representante
    "Manifesto_Entregue" text,              -- Timestamp Entrega Final
    "Status" text default 'Manifesto Recebido',
    "Turno" text,
    "Carimbo_Data/HR" text,                 -- Última atualização (String formatada BR)
    "Usuario_Ação" text,                    -- Último usuário que mexeu no registro
    "Usuario_Operação" text,                -- Responsável atribuído no Puxe
    created_at timestamptz default now()
);

-- 2. TABELA DE AUDITORIA E LOGS (SMO_Operacional)
-- Registra o histórico completo de todas as ações tomadas em cada manifesto.
CREATE TABLE IF NOT EXISTS public."SMO_Operacional" (
    id bigint primary key generated always as identity,
    "ID_Manifesto" text not null,
    "Ação" text not null,
    "Usuario" text not null,
    "Justificativa" text,                   -- Obrigatório para edições manuais
    "Created_At_BR" text,                   -- Data/Hora formatada para o frontend
    created_at timestamptz default now()
);

-- 3. TABELA DE PERFIS DE ACESSO (Cadastro_de_Perfil)
-- Utilizada para o Login da aba "Cadastro de Manifesto".
CREATE TABLE IF NOT EXISTS public."Cadastro_de_Perfil" (
    id bigint primary key generated always as identity,
    "Usuario" text unique not null,         -- ID de Usuário (Ex: R)
    "Senha" text not null,                  -- Código de Segurança (Ex: 1)
    "Nome_Completo" text,                   -- Nome que aparece no terminal
    "sesson_id" text,
    "Session_Data/HR" text,
    created_at timestamptz default now()
);

-- 4. TABELA DE FUNCIONÁRIOS WFS (Funcionarios_WFS)
-- Utilizada para a identificação via Busca (Gate) na aba "Puxe de Manifesto".
CREATE TABLE IF NOT EXISTS public."Funcionarios_WFS" (
    id bigint primary key generated always as identity,
    "Nome" text not null,                   -- Nome completo do colaborador
    "Cargo" text,
    "Ativo" boolean default true,
    created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- EXEMPLOS DE INSERÇÃO (OPCIONAL)
-- Use estes comandos para criar seu primeiro acesso se o banco estiver vazio:
-- -----------------------------------------------------------------------------

/*
-- Criar usuário para a aba de Cadastro:
INSERT INTO public."Cadastro_de_Perfil" ("Usuario", "Senha", "Nome_Completo") 
VALUES ('ADMIN', '1234', 'ADMINISTRADOR DO SISTEMA');

-- Criar funcionários para a aba de Puxe:
INSERT INTO public."Funcionarios_WFS" ("Nome", "Cargo") 
VALUES ('RAFAEL RODRIGUES', 'OPERADOR LOGÍSTICO');
INSERT INTO public."Funcionarios_WFS" ("Nome", "Cargo") 
VALUES ('RICK CLAUDIO', 'LÍDER DE OPERAÇÕES');
*/

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
