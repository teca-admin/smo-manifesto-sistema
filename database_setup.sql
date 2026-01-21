
-- =============================================================================
-- SISTEMA DE MANIFESTO OPERACIONAL (SMO) - SCRIPT DE ESTRUTURA COMPLETO V2.5
-- Este script atualiza as tabelas para suportar a Guia de Eficiência Operacional
-- =============================================================================

-- 1. TABELA PRINCIPAL DE MONITORAMENTO (SMO_Sistema)
-- Responsável pelo estado atual e carimbos de Lead Time (SLA).
CREATE TABLE IF NOT EXISTS public."SMO_Sistema" (
    id bigint primary key generated always as identity,
    "ID_Manifesto" text unique not null,
    "Usuario_Sistema" text,                 -- Operador que realizou o cadastro inicial
    "CIA" text not null,                    -- Companhia Aérea (AZUL, GOL, LATAM, etc)
    
    -- Carimbos de Tempo para Cálculo de Lead Time (SLA)
    "Manifesto_Puxado" text,                -- Quando a carga foi liberada pela CIA
    "Manifesto_Recebido" text,              -- Quando a carga chegou no terminal
    "Manifesto_Iniciado" text,              -- Início efetivo da operação (Puxe)
    "Manifesto_Disponivel" text,            -- Carga disponível para conferência
    "Manifesto_em_Conferência" text,        -- Início da conferência
    "Manifesto_Pendente" text,              -- Caso haja pendência documental/física
    "Manifesto_Completo" text,              -- Operação finalizada pelo operador
    "Representante_CIA" text,               -- Assinatura/Timestamp do Repr. da CIA
    "Manifesto_Entregue" text,              -- Finalização total do processo
    
    -- Metadados de Controle
    "Status" text default 'Manifesto Recebido',
    "Turno" text,                           -- 1º, 2º ou 3º Turno
    "Carimbo_Data/HR" text,                 -- Última atualização (String formatada BR)
    "Usuario_Ação" text,                    -- Último operador que interagiu com o registro
    "Usuario_Operação" text,                -- Operador atribuído para a execução física
    
    created_at timestamptz default now()
);

-- 2. TABELA DE AUDITORIA E LOGS (SMO_Operacional)
-- Crucial para a Guia de Eficiência e Histórico de Rastreabilidade.
CREATE TABLE IF NOT EXISTS public."SMO_Operacional" (
    id bigint primary key generated always as identity,
    "ID_Manifesto" text not null,           -- FK conceitual para ID_Manifesto
    "Ação" text not null,                   -- Status ou Ação realizada
    "Usuario" text not null,                -- Quem realizou a ação
    "Justificativa" text,                   -- Obrigatório em edições manuais
    "Created_At_BR" text,                   -- Timestamp formatado DD/MM/YYYY HH:MM:SS
    created_at timestamptz default now()
);

-- 3. TABELA DE PERFIS DE ACESSO (Cadastro_de_Perfil)
-- Gerenciamento de acesso ao Terminal de Cadastro.
CREATE TABLE IF NOT EXISTS public."Cadastro_de_Perfil" (
    id bigint primary key generated always as identity,
    "Usuario" text unique not null,         -- ID Curto (ex: R)
    "Senha" text not null,                  -- Senha numérica ou texto
    "Nome_Completo" text,                   -- Nome exibido no Dashboard
    "sesson_id" text,
    "Session_Data/HR" text,
    created_at timestamptz default now()
);

-- 4. TABELA DE FUNCIONÁRIOS (Funcionarios_WFS)
-- Lista de colaboradores para atribuição de responsabilidade no Puxe.
CREATE TABLE IF NOT EXISTS public."Funcionarios_WFS" (
    id bigint primary key generated always as identity,
    "Nome" text not null,                   -- Nome completo do colaborador
    "Cargo" text,                           -- Cargo operacional
    "Ativo" boolean default true,           -- Filtro de busca
    created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- CARGA INICIAL DE TESTES (OPCIONAL)
-- Execute se desejar resetar ou iniciar os acessos básicos
-- -----------------------------------------------------------------------------

/*
-- Usuário para teste na aba CADASTRO:
INSERT INTO public."Cadastro_de_Perfil" ("Usuario", "Senha", "Nome_Completo") 
VALUES ('ADMIN', '1', 'ADMINISTRADOR SISTEMA');

-- Operadores para teste na aba PUXE:
INSERT INTO public."Funcionarios_WFS" ("Nome", "Cargo") VALUES ('RAFAEL RODRIGUES', 'OPERADOR LOGÍSTICO');
INSERT INTO public."Funcionarios_WFS" ("Nome", "Cargo") VALUES ('MAX MILLER SANTOS', 'OPERADOR DE CARGA');
INSERT INTO public."Funcionarios_WFS" ("Nome", "Cargo") VALUES ('RAFAEL ABRAAO', 'LÍDER OPERACIONAL');
*/

-- =============================================================================
-- FIM DO SCRIPT DE ATUALIZAÇÃO V2.5
-- =============================================================================
