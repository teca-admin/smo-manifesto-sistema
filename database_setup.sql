
-- =============================================================================
-- SISTEMA DE MANIFESTO OPERACIONAL (SMO) - SCRIPT DE ATUALIZAÇÃO V2.5
-- =============================================================================

-- 1. GARANTE A ESTRUTURA DA TABELA PRINCIPAL
CREATE TABLE IF NOT EXISTS public."SMO_Sistema" (
    id bigint primary key generated always as identity,
    "ID_Manifesto" text unique not null,
    "Usuario_Sistema" text,
    "CIA" text not null,
    "Manifesto_Puxado" text,
    "Manifesto_Recebido" text,
    "Status" text default 'Manifesto Recebido',
    "Turno" text,
    "Carimbo_Data/HR" text,
    "Usuario_Ação" text,
    created_at timestamptz default now()
);

-- 2. ADIÇÃO DE COLUNAS FALTANTES (CASO A TABELA JÁ EXISTA)
-- O comando 'DO $$' evita erros se as colunas já existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SMO_Sistema' AND column_name='Representante_CIA') THEN
        ALTER TABLE public."SMO_Sistema" ADD COLUMN "Representante_CIA" text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SMO_Sistema' AND column_name='Manifesto_Entregue') THEN
        ALTER TABLE public."SMO_Sistema" ADD COLUMN "Manifesto_Entregue" text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SMO_Sistema' AND column_name='Usuario_Operação') THEN
        ALTER TABLE public."SMO_Sistema" ADD COLUMN "Usuario_Operação" text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SMO_Sistema' AND column_name='Manifesto_Iniciado') THEN
        ALTER TABLE public."SMO_Sistema" ADD COLUMN "Manifesto_Iniciado" text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SMO_Sistema' AND column_name='Manifesto_Completo') THEN
        ALTER TABLE public."SMO_Sistema" ADD COLUMN "Manifesto_Completo" text;
    END IF;
END $$;

-- 3. TABELA DE FUNCIONÁRIOS (RELAÇÃO WFS)
CREATE TABLE IF NOT EXISTS public."Funcionarios_WFS" (
    id bigint primary key generated always as identity,
    "Nome" text not null,
    "Cargo" text,
    "Ativo" boolean default true,
    created_at timestamptz default now()
);

-- 4. LIMPEZA E INSERÇÃO MASSIVA DE FUNCIONÁRIOS (CONFORME LISTA FORNECIDA)
TRUNCATE TABLE public."Funcionarios_WFS";

INSERT INTO public."Funcionarios_WFS" ("Nome", "Cargo") VALUES
('EDSON MESQUITA NOGUEIRA', 'GERENTE'),
('LUIZ D''CLAUDIS ARAUJO MARTINS', 'COORDENADOR'),
('MAX MILLER SANTOS DA SILVA', 'TÉCNICO DE SEGURANÇA'),
('ARLISON DE ALMEIDA CARVALHO', 'TÉCNICO DE SEGURANÇA'),
('ADRIANA BASILIO DA SILVA', 'AUX LIMPEZA'),
('RAFAEL ABRAAO DE SOUZA RODRIGUES', 'ANALISTA MELHORIA'),
('RICK CLAUDIO FERREIRA DOS SANTOS', 'AUX'),
('DIEGO NEVES DA SILVA', 'LIDER'),
('HELIO PEREIRA ANDRADE JUNIOR', 'LIDER'),
('PEDRO HEANES PINTO DE SOUZA', 'LIDER'),
('RODRIGO DE ALMEIDA', 'LIDER'),
('GUSTAVO HENRIQUE LIMA DA SILVA', 'LIDER'),
('ANDRE PEREIRA BENTES', 'AUX'),
('IAGO FELIPE MELO GADELHA', 'AUX'),
('MARCELO RODRIGUES PAES', 'AUX'),
('FRANCISCO EDGAR DA SILVA COSTA', 'AUX'),
('EM CONTRATAÇÃO - ARLY', 'AUX'),
('JOSE RAIMUNDO MELO GOMES', 'AUX'),
('WENDEL ALVES BALIEIRO', 'AUX'),
('DENIS COSTA SARMENTO', 'AUX'),
('SEVERINO ALMEIDA DE OLIVEIRA', 'AUX'),
('PEDRO GAMA DE MIRANDA', 'AUX'),
('ADRIANO MIRANDA DE FREITAS', 'AUX'),
('WALTER MONTEIRO PEREIRA', 'AUX'),
('EDUARDO JOSE TORRES FERREIRA', 'AUX'),
('MARCIO DOS SANTOS NASCIMENTO', 'AUX'),
('VANDERLEY DA SILVA TORRES', 'AUX'),
('RUSIVALDO CARDOSO QUEIROZ', 'AUX'),
('DIHEGO CAMPOS FIGUEIREREDO', 'AUX'),
('MARCOS ANTONIO MENDES DE OLIVEIRA', 'AUX'),
('ALYSSON DOS SANTOS PAES', 'AUX'),
('CARLOS EDUARDO MERUOCA RUNA', 'AUX'),
('WILMA APARECIDA PEREIRA DA SILVA BRITO', 'AUX'),
('EDIMARA BRAGA CAMPOS', 'AUX'),
('HERIC MASLOWN DA COSTA AZEVEDO', 'AUX'),
('CARLOS ALBERTO DA SILVA GONÇALVES', 'OP.EQUIP'),
('RAIMUNDO NONATO GONÇALVES P SILVA', 'OP.EQUIP'),
('LEANDRO OLIVEIRA DE SOUZA', 'OP.EQUIP'),
('FRANCISCO FERNANDO CARVALHO DE SOUZA', 'OP.EQUIP'),
('LUCIANO DO VALE DA SILVA SANTOS', 'OP.EQUIP'),
('VANDEMBERG FLORES DAMASCENO', 'OP.EQUIP'),
('ALEXANDRE SILVA DOS ANJOS', 'OP.EQUIP'),
('JACKSON SILVA DOS SANTOS', 'OP.EQUIP'),
('DANIEL MARTINS SARMENTO', 'AUX'),
('PATRICIA GOMES DA SILVA', 'AUX'),
('SIDNEY MARIANO DE SOUZA', 'AUX'),
('LINIKER DE SOUZA PALHETA', 'AUX'),
('EDCARLOS FERNANDES RODRIGUES', 'AUX'),
('RENIER LUCIO DE LIMA', 'AUX'),
('EMERSON ACÁCIO GUEDES', 'AUX'),
('ANTONIO FREDERICO DA SILVA', 'AUX'),
('IZAQUE ALVES DE OLIVEIRA', 'AUX'),
('WALDEMAR FERREIRA DA SILVA', 'AUX'),
('ANSELMO LINHARES DO NASCIMENTO', 'OP.EQUIP'),
('ROBERTO CESAR RAMOS RODRIGUES', 'OP.EQUIP'),
('RAIMUNDO NONATO P. DE S. FILHO', 'OP.EQUIP'),
('LUIZ CARLOS ARAÚJO DA SILVA', 'OP.EQUIP'),
('IVANETE MOURA MEDEIROS', 'AUX'),
('JOSINEY MACHADO DE MELO', 'AUX'),
('ROSANA PRADO MEDEIROS', 'AUX'),
('VANESSA CARDOSO MAQUINÉ', 'OP.EQUIP'),
('MATHEUS LIMA PEREIRA', 'AUX'),
('ADRYA PATRICIA DA SILVA FERREIRA', 'AUX'),
('FRANK NASCIMENTO EVANGELISTA', 'AUX'),
('EMANUEL RAMALHO', 'AUX'),
('FABULO SANTOS DA SILVA', 'AUX'),
('MARCELE GOMES DAS CHAGAS', 'AUX'),
('RAFAEL RIBEIRO AZEVEDO', 'AUX'),
('ALINA DAS NEVES PERINI', 'AUX'),
('LEANDRO DE SOUZA PALHETA', 'AUX'),
('FRANK DOS SANTOS RIBEIRO', 'AUX'),
('ERIMAR COSTA DA SILVA', 'AUX'),
('MARIO JORGE VIANA LOPES JUNIOR', 'AUX'),
('GILMAR FREITAS LALOR', 'AUX'),
('EDSON DE SOUZA OLIVEIRA', 'AUX'),
('ALEXANDRE SOUZA DA COSTA', 'AUX'),
('ANTONIO WILSON DOS SANTOS LEITÃO', 'AUX'),
('ALTAIR DA ENCARNACAO PIRES', 'AUX'),
('FERNANDO HELION ALVES MENDONÇA', 'AUX'),
('FABIO FEITOZA DA SILVA', 'AUX'),
('CAIQUE ROGGER GOMES BARBOSA', 'AUX'),
('PABLO YURI SIMAS DA SILVA', 'AUX'),
('RAIMUNDO ANTONIO ROCHA DE SOUZA', 'AUX'),
('JOÃO PAIXÃO PEREIRA CARRIL', 'AUX'),
('MARCIO RENE LIMA DA SILVA', 'AUX'),
('ARCLEYDSON REIS MOREIRA', 'AUX'),
('MARLON DA SILVA BRAGA', 'AUX'),
('RODRIGO RICARDO COSTA PINHEIRO', 'AUX'),
('JOEL DA SILVA DOS SANTOS JUNIOR', 'AUX'),
('DARLISON SOUSA DE MELO', 'AUX'),
('CARLOS AUGUSTO SOUSA DE MORAES', 'AUX'),
('DAVID DE CASTRO REIS', 'AUX'),
('EDER LINHARES DO NASCIMENTO', 'AUX'),
('ALMIR BARBOSA REIS', 'OP.EQUIP'),
('RUDINEI DA SILVA BARBOSA', 'OP.EQUIP'),
('CLAUDIO DOS SANTOS GUIMARAES FILHO', 'OP.EQUIP'),
('WELLINGTON VEIGA DA SILVA', 'OP.EQUIP'),
('ANTONIO ALMEIDA DE CARVALHO', 'OP.EQUIP'),
('LEANDRO GOMES LACERDA', 'OP.EQUIP'),
('LUCIANO GOMES LACERDA', 'OP.EQUIP'),
('ROGERIO DE SOUZA RIBEIRO', 'OP.EQUIP'),
('OSCAR HAYDEN FILHO', 'AUX'),
('FRANCISCO EVALDO DUARTE MOUTA', 'AUX'),
('JOSE DIDIMO NASCIMENTO', 'AUX'),
('ADEMIR BEZERRA DE MELO', 'AUX'),
('MARCOS DE SOUZA FIGUEIREDO', 'AUX'),
('GILVAN PINTO DE SOUZA', 'AUX'),
('MARIZIO SIQUEIRA DA SILVA', 'OP.EQUIP'),
('JÚLIO CÉSAR FERMIM', 'OP.EQUIP'),
('GLAUCIO MARTINS DA SILVA', 'OP.EQUIP'),
('CLAUDIA CRISTIANE DE ARAUJO FROIS', 'AUX'),
('FRANCISCO JOSINALDO SILVA BARBOSA', 'AUX'),
('HERMANO HERBERT DE CARVALHO LIMA', 'OP.EQUIP'),
('PRISCILA FERNANDA PEREIRA', 'OP.EQUIP'),
('LUCIO FILIPE MARQUES FERREIRA', 'AUX'),
('RICHARDSON QUEIROZ COELHO', 'AUX'),
('SIMONE FERREIRA DE FREITAS', 'AUX'),
('ANDERSON DE CASTRO GURGEL', 'AUX'),
('ALEXSANDRO RODRIGUES BRAGA', 'AUX'),
('RILK EMANUEL ROCHA DO CARMO', 'AUX'),
('WITILAS PINHEIRO MACHADO', 'AUX'),
('ALEX OLIVEIRA DE SOUZA', 'AUX'),
('EDVÃ SERRÃO ANDURAND', 'AUX'),
('NEILSON DE OLIVEIRA JORDÃO', 'AUX'),
('CARLOS GAMA RODRIGUES', 'AUX'),
('ALONSO MACHADO PEREIRA', 'AUX'),
('RAYSSOM FELIPE BATISTA FRAZÃO DA SILVA', 'AUX'),
('FRANCINALDO SILVA MENDES', 'AUX'),
('MARCIO RIBEIRO DA SILVA', 'AUX'),
('FLORIANO DOS SANTOS BERNARDO', 'AUX'),
('AFRANIO SERGIO BATISTA FRAZÃO', 'AUX'),
('JUNIOR DOS SANTOS LIMA', 'AUX'),
('JULIO CEZAR NEVES DE MELO', 'AUX'),
('LUCIANO PEREIRA DOS REIS', 'AUX'),
('THIAGO OLIVEIRA DE SOUZA', 'AUX'),
('ANTONIO ROCHA JUNIOR', 'AUX'),
('ANTONIO FERNANDES DA SILVA', 'AUX'),
('GIVANILDO LEAO DE OLIVEIRA', 'AUX'),
('JOSE RENATO RAMOS DA SILVA', 'AUX'),
('JOSÉ RODRIGUES DE SOUZA', 'OP.EQUIP'),
('MARCIO ALEXANDRE LEMOS BERNARDES', 'OP.EQUIP'),
('AUGUSTO ENCARNAÇÃO DO NASCIMENTO NETO', 'OP.EQUIP'),
('ALEXANDRE SADIM DA SILVA', 'OP.EQUIP'),
('ERMESON COSTA DA SILVA', 'OP.EQUIP'),
('EDIVAN ALVES SARGES', 'OP.EQUIP'),
('JOSE BACELAR FERREIRA', 'OP.EQUIP'),
('FRANCISCO JAMIL DE OLIVEIRA PEREIRA', 'OP.EQUIP'),
('FLAVIO MENDES E SILVA', 'OP.EQUIP'),
('CLEITON ELIAS DE FREITAS SILVA', 'AUX'),
('PAULO SILVANO MENDONÇA MARINHO', 'AUX');

-- 5. FUNÇÃO PARA REGISTRO DE MÉTRICAS (GARANTE QUE O CACHE SEJA ATUALIZADO)
CREATE OR REPLACE FUNCTION public.registrar_metricas(
    p_reqs int, p_n8n int, p_banda numeric, p_usuario text, p_hora text, p_timestamp_iso timestamptz,
    p_cadastro int default 0, p_edicao int default 0, p_cancelamento int default 0, p_anulacao int default 0,
    p_login int default 0, p_logoff int default 0,
    p_data_local date default null
) returns void as $$
begin
    insert into public."Log_Performance_SMO_Sistema" (data)
    values (coalesce(p_data_local, current_date)) on conflict (data) do nothing;

    update public."Log_Performance_SMO_Sistema"
    set 
      total_requisicoes = total_requisicoes + p_reqs,
      total_n8n = total_n8n + p_n8n,
      banda_mb = banda_mb + p_banda,
      ultima_atualizacao = p_timestamp_iso,
      total_cadastro = total_cadastro + p_cadastro,
      total_edicao = total_edicao + p_edicao,
      total_cancelamento = total_cancelamento + p_cancelamento,
      total_anulacao = total_anulacao + p_anulacao,
      total_login = total_login + p_login,
      total_logoff = total_logoff + p_logoff
    where data = coalesce(p_data_local, current_date);
end;
$$ language plpgsql;
