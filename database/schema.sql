/*
==================================================
BETVISION AI
PostgreSQL Schema v5.0
==================================================
*/

-- ==========================================
-- REMOVER VIEWS ANTIGAS
-- ==========================================

DROP VIEW IF EXISTS analises CASCADE;

-- ==========================================
-- REMOVER TABELAS ANTIGAS
-- ==========================================

DROP TABLE IF EXISTS apostas_historico CASCADE;
DROP TABLE IF EXISTS previsoes_ia CASCADE;
DROP TABLE IF EXISTS odds CASCADE;
DROP TABLE IF EXISTS analises_ia CASCADE;
DROP TABLE IF EXISTS partidas CASCADE;

-- ==========================================
-- CAMPEONATOS
-- ==========================================

CREATE TABLE IF NOT EXISTS campeonatos (

    id INTEGER PRIMARY KEY,

    nome VARCHAR(150) NOT NULL,

    pais VARCHAR(100),

    continente VARCHAR(100),

    temporada VARCHAR(20),

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================
-- TIMES
-- ==========================================

CREATE TABLE IF NOT EXISTS times (

    id INTEGER PRIMARY KEY,

    campeonato_id INTEGER
        REFERENCES campeonatos(id)
        ON DELETE CASCADE,

    nome VARCHAR(150) NOT NULL,

    pais VARCHAR(100),

    ataque INTEGER DEFAULT 50,

    defesa INTEGER DEFAULT 50,

    forma NUMERIC(5,2) DEFAULT 50,

    media_gols NUMERIC(5,2) DEFAULT 0,

    media_sofridos NUMERIC(5,2) DEFAULT 0,

    vitorias INTEGER DEFAULT 0,

    empates INTEGER DEFAULT 0,

    derrotas INTEGER DEFAULT 0,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================
-- JOGOS
-- ==========================================

CREATE TABLE IF NOT EXISTS jogos (

    id SERIAL PRIMARY KEY,

    api_id BIGINT UNIQUE,

    campeonato VARCHAR(150),

    time_casa VARCHAR(150),

    time_fora VARCHAR(150),

    data_jogo TIMESTAMP,

    status VARCHAR(40) DEFAULT 'SCHEDULED',

    gols_casa INTEGER DEFAULT 0,

    gols_fora INTEGER DEFAULT 0,

    rodada INTEGER,

    estadio VARCHAR(150),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================
-- ANALISES IA
-- ==========================================

CREATE TABLE IF NOT EXISTS analises (

    id SERIAL PRIMARY KEY,

    jogo_id INTEGER
        REFERENCES jogos(id)
        ON DELETE CASCADE,

    jogo VARCHAR(250),

    probabilidade_casa NUMERIC(5,2),

    probabilidade_empate NUMERIC(5,2),

    probabilidade_fora NUMERIC(5,2),

    gols_esperados NUMERIC(5,2),

    placar_previsto VARCHAR(20),

    value_bet BOOLEAN DEFAULT FALSE,

    confianca VARCHAR(30),

    algoritmo VARCHAR(100),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
-- ==========================================
-- ODDS
-- ==========================================

CREATE TABLE IF NOT EXISTS odds (

    id SERIAL PRIMARY KEY,

    jogo_id INTEGER
        REFERENCES jogos(id)
        ON DELETE CASCADE,

    casa VARCHAR(100),

    mercado VARCHAR(100),

    odd NUMERIC(8,2),

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- PREVISÕES IA
-- ==========================================

CREATE TABLE IF NOT EXISTS previsoes_ia (

    id SERIAL PRIMARY KEY,

    jogo_id INTEGER
        REFERENCES jogos(id)
        ON DELETE CASCADE,

    modelo VARCHAR(100),

    previsao VARCHAR(100),

    probabilidade NUMERIC(5,2),

    precisao NUMERIC(5,2),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- VALUE BETS
-- ==========================================

CREATE TABLE IF NOT EXISTS value_bets (

    id SERIAL PRIMARY KEY,

    jogo_id INTEGER
        REFERENCES jogos(id)
        ON DELETE CASCADE,

    mercado VARCHAR(100),

    odd_mercado NUMERIC(8,2),

    probabilidade_real NUMERIC(5,2),

    valor_esperado NUMERIC(8,2),

    confianca VARCHAR(30),

    status VARCHAR(30) DEFAULT 'ATIVA',

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- APOSTAS HISTÓRICO
-- ==========================================

CREATE TABLE IF NOT EXISTS apostas_historico (

    id SERIAL PRIMARY KEY,

    jogo_id INTEGER
        REFERENCES jogos(id)
        ON DELETE CASCADE,

    mercado VARCHAR(100),

    odd NUMERIC(8,2),

    resultado VARCHAR(30),

    lucro NUMERIC(10,2),

    roi NUMERIC(8,2),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- CONFIGURAÇÃO DO SISTEMA
-- ==========================================

CREATE TABLE IF NOT EXISTS configuracoes (

    id SERIAL PRIMARY KEY,

    chave VARCHAR(100) UNIQUE,

    valor TEXT,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
-- ==========================================
-- ÍNDICES DE PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_jogos_data
ON jogos(data_jogo);


CREATE INDEX IF NOT EXISTS idx_jogos_status
ON jogos(status);


CREATE INDEX IF NOT EXISTS idx_jogos_campeonato
ON jogos(campeonato);


CREATE INDEX IF NOT EXISTS idx_times_campeonato
ON times(campeonato_id);


CREATE INDEX IF NOT EXISTS idx_analises_jogo
ON analises(jogo_id);


CREATE INDEX IF NOT EXISTS idx_odds_jogo
ON odds(jogo_id);


CREATE INDEX IF NOT EXISTS idx_valuebets_status
ON value_bets(status);



-- ==========================================
-- DADOS INICIAIS
-- ==========================================

INSERT INTO configuracoes
(
    chave,
    valor
)

VALUES

(
    'modelo_ia',
    'Probabilidade + Estatística'
),

(
    'versao_sistema',
    'BetVision AI v5.0'
),

(
    'precisao_meta',
    '75'
)

ON CONFLICT (chave)
DO NOTHING;



-- ==========================================
-- VIEW DASHBOARD
-- ==========================================

CREATE OR REPLACE VIEW dashboard_status AS

SELECT

    (
        SELECT COUNT(*)
        FROM jogos
        WHERE DATE(data_jogo)=CURRENT_DATE
    )
    AS jogos_hoje,


    (
        SELECT COUNT(*)
        FROM campeonatos
    )
    AS campeonatos,


    (
        SELECT COUNT(*)
        FROM analises
    )
    AS analises_ia,


    (
        SELECT COUNT(*)
        FROM value_bets
        WHERE status='ATIVA'
    )
    AS value_bets,


    (
        SELECT COALESCE(AVG(precisao),0)
        FROM previsoes_ia
    )
    AS precisao_ia;
-- ==========================================
-- FUNÇÕES AUXILIARES
-- ==========================================

CREATE OR REPLACE FUNCTION atualizar_timestamp()

RETURNS TRIGGER AS $$

BEGIN

    NEW.atualizado_em = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$ LANGUAGE plpgsql;



-- ==========================================
-- TRIGGER CONFIGURAÇÕES
-- ==========================================

DROP TRIGGER IF EXISTS trigger_configuracoes_update
ON configuracoes;


CREATE TRIGGER trigger_configuracoes_update

BEFORE UPDATE
ON configuracoes

FOR EACH ROW

EXECUTE FUNCTION atualizar_timestamp();



-- ==========================================
-- FINALIZAÇÃO SCHEMA BETVISION AI v5.0
-- ==========================================

SELECT

    'BetVision AI Database Schema v5.0 instalado com sucesso'
    AS status;
