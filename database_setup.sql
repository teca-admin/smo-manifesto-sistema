
-- =============================================================================
-- SISTEMA DE MANIFESTO OPERACIONAL (SMO) - SCRIPT DE ESTRUTURA V2.5
-- =============================================================================

-- 1. TABELA PRINCIPAL DE MONITORAMENTO (SMO_Sistema)
CREATE TABLE IF NOT EXISTS public."SMO_Sistema" (
    id bigint primary key generated always as identity,
    "ID_Manifesto" text unique not null,
    "Usuario_Sistema" text,
    "CIA" text not null,
    "Manifesto_Puxado" text,
    "Manifesto_Recebido" text,
    "Manifesto_Iniciado" text,
    "Manifesto_Disponivel" text,
    "Manifesto_em_Conferência" text,
    "Manifesto_Pendente" text,
    "Manifesto_Completo" text,
    "Representante_CIA" text,
    "Manifesto_Entregue" text,
    "Status" text default 'Manifesto Recebido',
    "Turno" text,
    "Carimbo_Data/HR" text,
    "Usuario_Ação" text,
    "Usuario_Operação" text,
    created_at timestamptz default now()
);

-- 2. TABELA DE AUDITORIA E LOGS (SMO_Operacional)
-- Esta tabela armazena o histórico que aparece no modal "DETALHES / LOG"
CREATE TABLE IF NOT EXISTS public."SMO_Operacional" (
    id bigint primary key generated always as identity,
    "ID_Manifesto" text not null,
    "Ação" text not null,
    "Usuario" text not null,
    "Justificativa" text,
    "Created_At_BR" text,
    created_at timestamptz default now()
);

-- 3. TABELA DE PERFIS DE ACESSO (Cadastro_de_Perfil)
CREATE TABLE IF NOT EXISTS public."Cadastro_de_Perfil" (
    id bigint primary key generated always as identity,
    "Usuario" text unique not null,
    "Senha" text not null,
    "Nome_Completo" text,
    "sesson_id" text,
    "Session_Data/HR" text,
    created_at timestamptz default now()
);

-- 4. TABELA DE FUNCIONÁRIOS WFS (Funcionarios_WFS)
CREATE TABLE IF NOT EXISTS public."Funcionarios_WFS" (
    id bigint primary key generated always as identity,
    "Nome" text not null,
    "Cargo" text,
    "Ativo" boolean default true,
    created_at timestamptz default now()
);

-- 5. TABELA DE MÉTRICAS DE PERFORMANCE (Log_Performance_SMO_Sistema)
CREATE TABLE IF NOT EXISTS public."Log_Performance_SMO_Sistema" (
    data date primary key,
    total_requisicoes bigint default 0,
    total_n8n bigint default 0,
    banda_mb numeric default 0,
    usuarios_unicos text[] default '{}',
    ultima_atualizacao timestamptz,
    total_cadastro bigint default 0,
    total_edicao bigint default 0,
    total_cancelamento bigint default 0,
    total_anulacao bigint default 0,
    total_login bigint default 0,
    total_logoff bigint default 0,
    detalhes_hora jsonb default '{}'::jsonb
);

-- 6. FUNÇÃO RPC PARA REGISTRO DE MÉTRICAS (Performance Monitor)
CREATE OR REPLACE FUNCTION public.registrar_metricas(
    p_reqs int, 
    p_n8n int, 
    p_banda numeric, 
    p_usuario text, 
    p_hora text, 
    p_timestamp_iso timestamptz,
    p_cadastro int default 0, 
    p_edicao int default 0, 
    p_cancelamento int default 0, 
    p_anulacao int default 0,
    p_login int default 0, 
    p_logoff int default 0,
    p_data_local date default null
) returns void as $$
DECLARE
    v_data date := coalesce(p_data_local, current_date);
BEGIN
    -- Garante que a linha do dia existe
    INSERT INTO public."Log_Performance_SMO_Sistema" (data)
    VALUES (v_data) ON CONFLICT (data) DO NOTHING;

    -- Atualiza os contadores
    UPDATE public."Log_Performance_SMO_Sistema"
    SET 
      total_requisicoes = total_requisicoes + p_reqs,
      total_n8n = total_n8n + p_n8n,
      banda_mb = banda_mb + p_banda,
      ultima_atualizacao = p_timestamp_iso,
      total_cadastro = total_cadastro + p_cadastro,
      total_edicao = total_edicao + p_edicao,
      total_cancelamento = total_cancelamento + p_cancelamento,
      total_anulacao = total_anulacao + p_anulacao,
      total_login = total_login + p_login,
      total_logoff = total_logoff + p_logoff,
      -- Adiciona usuário à lista de únicos se não existir
      usuarios_unicos = array_remove(array_append(usuarios_unicos, p_usuario), p_usuario) || p_usuario,
      -- Atualiza o mapa de calor por hora
      detalhes_hora = jsonb_set(
        coalesce(detalhes_hora, '{}'::jsonb),
        array[p_hora],
        (coalesce((detalhes_hora->>p_hora)::int, 0) + p_reqs)::text::jsonb
      )
    WHERE data = v_data;
END;
$$ language plpgsql;

-- 7. EXEMPLO DE INSERÇÃO DE USUÁRIO ADMINISTRADOR (Opcional)
-- INSERT INTO public."Cadastro_de_Perfil" ("Usuario", "Senha", "Nome_Completo") 
-- VALUES ('Rafael Rodrigues', '123456', 'Rafael Rodrigues') ON CONFLICT DO NOTHING;
