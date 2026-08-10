-- ============================================================
-- BETVISION AI
-- schema.sql
--
-- VERSÃO 6.0
-- PostgreSQL / NeonDB
--
-- Estrutura compatível com:
-- - server.js
-- - jogoBancoService.js
-- - historicoService.js
-- - inteligenciaService.js
-- - campeonatoService.js
-- - valueBetService.js
-- - sincronizacaoService.js
--
-- IMPORTANTE:
-- Este arquivo NÃO apaga dados existentes.
-- ============================================================


-- ============================================================
-- EXTENSÃO
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- TABELA: CAMPEONATOS
-- ============================================================

CREATE TABLE IF NOT EXISTS campeonatos (

    id INTEGER NOT NULL,

    nome VARCHAR(255),

    pais VARCHAR(255),

    continente VARCHAR(100),

    temporada VARCHAR(20),

    api_id INTEGER,

    logo TEXT,

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ============================================================
-- GARANTIR COLUNAS DA TABELA CAMPEONATOS
-- ============================================================

ALTER TABLE campeonatos
ADD COLUMN IF NOT EXISTS nome VARCHAR(255);

ALTER TABLE campeonatos
ADD COLUMN IF NOT EXISTS pais VARCHAR(255);

ALTER TABLE campeonatos
ADD COLUMN IF NOT EXISTS continente VARCHAR(100);

ALTER TABLE campeonatos
ADD COLUMN IF NOT EXISTS temporada VARCHAR(20);

ALTER TABLE campeonatos
ADD COLUMN IF NOT EXISTS api_id INTEGER;

ALTER TABLE campeonatos
ADD COLUMN IF NOT EXISTS logo TEXT;

ALTER TABLE campeonatos
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

ALTER TABLE campeonatos
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE campeonatos
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- ============================================================
-- ÍNDICE CAMPEONATOS
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_campeonatos_api_id
ON campeonatos(api_id);


CREATE INDEX IF NOT EXISTS
idx_campeonatos_nome
ON campeonatos(nome);


CREATE INDEX IF NOT EXISTS
idx_campeonatos_ativo
ON campeonatos(ativo);


-- ============================================================
-- TABELA: TIMES
-- ============================================================

CREATE TABLE IF NOT EXISTS times (

    id INTEGER NOT NULL,

    api_id INTEGER,

    nome VARCHAR(255),

    nome_curto VARCHAR(255),

    sigla VARCHAR(50),

    pais VARCHAR(255),

    continente VARCHAR(100),

    logo TEXT,

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ============================================================
-- GARANTIR COLUNAS TIMES
-- ============================================================

ALTER TABLE times
ADD COLUMN IF NOT EXISTS api_id INTEGER;

ALTER TABLE times
ADD COLUMN IF NOT EXISTS nome VARCHAR(255);

ALTER TABLE times
ADD COLUMN IF NOT EXISTS nome_curto VARCHAR(255);

ALTER TABLE times
ADD COLUMN IF NOT EXISTS sigla VARCHAR(50);

ALTER TABLE times
ADD COLUMN IF NOT EXISTS pais VARCHAR(255);

ALTER TABLE times
ADD COLUMN IF NOT EXISTS continente VARCHAR(100);

ALTER TABLE times
ADD COLUMN IF NOT EXISTS logo TEXT;

ALTER TABLE times
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

ALTER TABLE times
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE times
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE UNIQUE INDEX IF NOT EXISTS
idx_times_api_id
ON times(api_id);


CREATE INDEX IF NOT EXISTS
idx_times_nome
ON times(nome);


-- ============================================================
-- TABELA PRINCIPAL: JOGOS
-- ============================================================

CREATE TABLE IF NOT EXISTS jogos (

    id INTEGER NOT NULL,

    api_id INTEGER,

    campeonato VARCHAR(255),

    time_casa VARCHAR(255),

    time_fora VARCHAR(255),

    data_jogo TIMESTAMP,

    estadio VARCHAR(255),

    status VARCHAR(100),

    gols_casa INTEGER,

    gols_fora INTEGER,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ============================================================
-- GARANTIR COLUNAS DA TABELA JOGOS
-- ============================================================

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS api_id INTEGER;

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS campeonato VARCHAR(255);

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS time_casa VARCHAR(255);

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS time_fora VARCHAR(255);

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS data_jogo TIMESTAMP;

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS estadio VARCHAR(255);

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS status VARCHAR(100);

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS gols_casa INTEGER;

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS gols_fora INTEGER;

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- ============================================================
-- ÍNDICES JOGOS
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_jogos_api_id
ON jogos(api_id)
WHERE api_id IS NOT NULL;


CREATE INDEX IF NOT EXISTS
idx_jogos_data
ON jogos(data_jogo);


CREATE INDEX IF NOT EXISTS
idx_jogos_time_casa
ON jogos(time_casa);


CREATE INDEX IF NOT EXISTS
idx_jogos_time_fora
ON jogos(time_fora);


CREATE INDEX IF NOT EXISTS
idx_jogos_status
ON jogos(status);


CREATE INDEX IF NOT EXISTS
idx_jogos_casa_fora
ON jogos(time_casa, time_fora);


-- ============================================================
-- TABELA: PARTIDAS
--
-- Mantida para compatibilidade com versões anteriores.
-- ============================================================

CREATE TABLE IF NOT EXISTS partidas (

    id INTEGER NOT NULL,

    api_id INTEGER,

    campeonato VARCHAR(255),

    time_casa VARCHAR(255),

    time_fora VARCHAR(255),

    data_jogo TIMESTAMP,

    estadio VARCHAR(255),

    status VARCHAR(100),

    gols_casa INTEGER,

    gols_fora INTEGER,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS api_id INTEGER;

ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS campeonato VARCHAR(255);

ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS time_casa VARCHAR(255);

ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS time_fora VARCHAR(255);

ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS data_jogo TIMESTAMP;

ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS estadio VARCHAR(255);

ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS status VARCHAR(100);

ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS gols_casa INTEGER;

ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS gols_fora INTEGER;

ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS
idx_partidas_api_id
ON partidas(api_id);


CREATE INDEX IF NOT EXISTS
idx_partidas_data
ON partidas(data_jogo);


-- ============================================================
-- TABELA: ODDS
-- ============================================================

CREATE TABLE IF NOT EXISTS odds (

    id INTEGER NOT NULL,

    jogo_id INTEGER,

    api_id INTEGER,

    bookmaker VARCHAR(255),

    mercado VARCHAR(255),

    selecao VARCHAR(255),

    odd NUMERIC(10,4),

    data_coleta TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


ALTER TABLE odds
ADD COLUMN IF NOT EXISTS jogo_id INTEGER;

ALTER TABLE odds
ADD COLUMN IF NOT EXISTS api_id INTEGER;

ALTER TABLE odds
ADD COLUMN IF NOT EXISTS bookmaker VARCHAR(255);

ALTER TABLE odds
ADD COLUMN IF NOT EXISTS mercado VARCHAR(255);

ALTER TABLE odds
ADD COLUMN IF NOT EXISTS selecao VARCHAR(255);

ALTER TABLE odds
ADD COLUMN IF NOT EXISTS odd NUMERIC(10,4);

ALTER TABLE odds
ADD COLUMN IF NOT EXISTS data_coleta TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS
idx_odds_jogo_id
ON odds(jogo_id);


CREATE INDEX IF NOT EXISTS
idx_odds_api_id
ON odds(api_id);


-- ============================================================
-- TABELA: ANALISES
-- ============================================================

CREATE TABLE IF NOT EXISTS analises (

    id INTEGER NOT NULL,

    jogo_id INTEGER,

    api_id INTEGER,

    time_casa VARCHAR(255),

    time_fora VARCHAR(255),

    favorito VARCHAR(255),

    probabilidade_casa NUMERIC(7,4),

    probabilidade_empate NUMERIC(7,4),

    probabilidade_fora NUMERIC(7,4),

    placar_casa INTEGER,

    placar_fora INTEGER,

    gols_esperados NUMERIC(10,4),

    over_15 BOOLEAN,

    over_25 BOOLEAN,

    over_35 BOOLEAN,

    btts BOOLEAN,

    confianca VARCHAR(50),

    algoritmo VARCHAR(255),

    dados_historicos JSONB,

    resultado JSONB,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ============================================================
-- GARANTIR COLUNAS ANALISES
-- ============================================================

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS jogo_id INTEGER;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS api_id INTEGER;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS time_casa VARCHAR(255);

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS time_fora VARCHAR(255);

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS favorito VARCHAR(255);

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS probabilidade_casa NUMERIC(7,4);

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS probabilidade_empate NUMERIC(7,4);

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS probabilidade_fora NUMERIC(7,4);

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS placar_casa INTEGER;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS placar_fora INTEGER;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS gols_esperados NUMERIC(10,4);

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS over_15 BOOLEAN;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS over_25 BOOLEAN;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS over_35 BOOLEAN;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS btts BOOLEAN;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS confianca VARCHAR(50);

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS algoritmo VARCHAR(255);

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS dados_historicos JSONB;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS resultado JSONB;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS
idx_analises_jogo_id
ON analises(jogo_id);


CREATE INDEX IF NOT EXISTS
idx_analises_api_id
ON analises(api_id);


CREATE INDEX IF NOT EXISTS
idx_analises_data
ON analises(criado_em);


-- ============================================================
-- TABELA: VALUE_BETS
-- ============================================================

CREATE TABLE IF NOT EXISTS value_bets (

    id INTEGER NOT NULL,

    jogo_id INTEGER,

    api_id INTEGER,

    time_casa VARCHAR(255),

    time_fora VARCHAR(255),

    mercado VARCHAR(255),

    selecao VARCHAR(255),

    odd NUMERIC(10,4),

    odd_justa NUMERIC(10,4),

    probabilidade NUMERIC(10,4),

    edge NUMERIC(10,4),

    roi NUMERIC(10,4),

    kelly NUMERIC(10,4),

    classificacao VARCHAR(100),

    status VARCHAR(50),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS jogo_id INTEGER;

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS api_id INTEGER;

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS time_casa VARCHAR(255);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS time_fora VARCHAR(255);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS mercado VARCHAR(255);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS selecao VARCHAR(255);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS odd NUMERIC(10,4);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS odd_justa NUMERIC(10,4);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS probabilidade NUMERIC(10,4);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS edge NUMERIC(10,4);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS roi NUMERIC(10,4);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS kelly NUMERIC(10,4);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS classificacao VARCHAR(100);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS
idx_value_bets_jogo_id
ON value_bets(jogo_id);


CREATE INDEX IF NOT EXISTS
idx_value_bets_api_id
ON value_bets(api_id);


CREATE INDEX IF NOT EXISTS
idx_value_bets_status
ON value_bets(status);


-- ============================================================
-- TABELA: VALUEBETS
--
-- Mantida para compatibilidade com versões anteriores
-- do projeto.
-- ============================================================

CREATE TABLE IF NOT EXISTS valuebets (

    id INTEGER NOT NULL,

    jogo_id INTEGER,

    api_id INTEGER,

    mercado VARCHAR(255),

    selecao VARCHAR(255),

    odd NUMERIC(10,4),

    odd_justa NUMERIC(10,4),

    probabilidade NUMERIC(10,4),

    edge NUMERIC(10,4),

    roi NUMERIC(10,4),

    kelly NUMERIC(10,4),

    classificacao VARCHAR(100),

    status VARCHAR(50),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS jogo_id INTEGER;

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS api_id INTEGER;

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS mercado VARCHAR(255);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS selecao VARCHAR(255);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS odd NUMERIC(10,4);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS odd_justa NUMERIC(10,4);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS probabilidade NUMERIC(10,4);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS edge NUMERIC(10,4);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS roi NUMERIC(10,4);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS kelly NUMERIC(10,4);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS classificacao VARCHAR(100);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS
idx_valuebets_jogo_id
ON valuebets(jogo_id);


CREATE INDEX IF NOT EXISTS
idx_valuebets_api_id
ON valuebets(api_id);


-- ============================================================
-- TABELA: USUARIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (

    id INTEGER NOT NULL,

    nome VARCHAR(255),

    email VARCHAR(255),

    senha TEXT,

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS nome VARCHAR(255);

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS senha TEXT;

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE UNIQUE INDEX IF NOT EXISTS
idx_usuarios_email
ON usuarios(email);


-- ============================================================
-- COMPATIBILIDADE
-- TABELA DE TESTE EXISTENTE NO NEON
-- ============================================================

CREATE TABLE IF NOT EXISTS playing_with_neon (

    id INTEGER,

    nome TEXT,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ============================================================
-- AJUSTES FINAIS DA TABELA JOGOS
-- ============================================================

-- Garante que jogos sem resultado permaneçam com NULL.
-- NÃO colocar DEFAULT 0 nos gols, pois:
--
-- NULL = resultado ainda desconhecido
-- 0   = time realmente marcou zero gols
--
-- Isso é importante para a inteligência artificial.


-- ============================================================
-- VIEWS AUXILIARES
-- ============================================================

CREATE OR REPLACE VIEW vw_jogos_finalizados AS

SELECT

    j.id,

    j.api_id,

    j.campeonato,

    j.time_casa,

    j.time_fora,

    j.data_jogo,

    j.estadio,

    j.status,

    j.gols_casa,

    j.gols_fora,

    j.criado_em

FROM jogos j

WHERE

    UPPER(COALESCE(j.status, ''))
    IN (
        'FINISHED',
        'FINALIZADO',
        'FT'
    )

    AND j.gols_casa IS NOT NULL

    AND j.gols_fora IS NOT NULL;


-- ============================================================
-- VIEW: HISTÓRICO DOS TIMES
-- ============================================================

CREATE OR REPLACE VIEW vw_historico_times AS

SELECT

    j.id,

    j.api_id,

    j.campeonato,

    j.time_casa,

    j.time_fora,

    j.data_jogo,

    j.status,

    j.gols_casa,

    j.gols_fora,

    CASE

        WHEN j.gols_casa > j.gols_fora
        THEN j.time_casa

        WHEN j.gols_fora > j.gols_casa
        THEN j.time_fora

        ELSE 'EMPATE'

    END AS vencedor

FROM jogos j

WHERE

    j.gols_casa IS NOT NULL

    AND j.gols_fora IS NOT NULL;


-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

SELECT

    table_name

FROM information_schema.tables

WHERE table_schema = 'public'

AND table_name IN (

    'campeonatos',
    'times',
    'jogos',
    'partidas',
    'odds',
    'analises',
    'value_bets',
    'valuebets',
    'usuarios'

)

ORDER BY table_name;


-- ============================================================
-- VERIFICAÇÃO DAS COLUNAS DE JOGOS
-- ============================================================

SELECT

    column_name,

    data_type,

    is_nullable

FROM information_schema.columns

WHERE table_schema = 'public'

AND table_name = 'jogos'

ORDER BY ordinal_position;


-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
