-- ==================================================
-- BETVISION AI
-- PostgreSQL Schema v3.0
-- NeonDB
-- ==================================================


-- ==================================================
-- CAMPEONATOS
-- ==================================================

CREATE TABLE IF NOT EXISTS campeonatos (

    id SERIAL PRIMARY KEY,

    api_id INTEGER UNIQUE,

    nome VARCHAR(150) NOT NULL,

    pais VARCHAR(100),

    continente VARCHAR(100),

    temporada VARCHAR(20),

    logo TEXT,

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



-- ==================================================
-- TIMES
-- ==================================================

CREATE TABLE IF NOT EXISTS times (

    id SERIAL PRIMARY KEY,

    api_id INTEGER UNIQUE,

    campeonato_id INTEGER,

    nome VARCHAR(150) NOT NULL,

    pais VARCHAR(100),

    logo TEXT,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_time_campeonato

    FOREIGN KEY(campeonato_id)

    REFERENCES campeonatos(id)

    ON DELETE CASCADE

);





-- ==================================================
-- JOGOS
-- ==================================================

CREATE TABLE IF NOT EXISTS jogos (

    id SERIAL PRIMARY KEY,


    api_id INTEGER UNIQUE,


    campeonato_id INTEGER,


    time_casa_id INTEGER,


    time_fora_id INTEGER,


    data_jogo TIMESTAMP,


    status VARCHAR(50),


    gols_casa INTEGER DEFAULT 0,


    gols_fora INTEGER DEFAULT 0,


    temporada VARCHAR(20),


    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(campeonato_id)

    REFERENCES campeonatos(id),



    FOREIGN KEY(time_casa_id)

    REFERENCES times(id),



    FOREIGN KEY(time_fora_id)

    REFERENCES times(id)

);






-- ==================================================
-- ODDS
-- ==================================================

CREATE TABLE IF NOT EXISTS odds (

    id SERIAL PRIMARY KEY,


    jogo_id INTEGER NOT NULL,


    casa_aposta VARCHAR(100),


    mercado VARCHAR(100),


    selecao VARCHAR(100),


    odd NUMERIC(6,2),


    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(jogo_id)

    REFERENCES jogos(id)

    ON DELETE CASCADE

);






-- ==================================================
-- ANALISES IA
-- ==================================================

CREATE TABLE IF NOT EXISTS analises (

    id SERIAL PRIMARY KEY,


    jogo_id INTEGER NOT NULL,


    probabilidade_casa NUMERIC(5,2),


    probabilidade_empate NUMERIC(5,2),


    probabilidade_fora NUMERIC(5,2),


    previsao VARCHAR(100),


    confianca NUMERIC(5,2),


    modelo VARCHAR(100),


    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(jogo_id)

    REFERENCES jogos(id)

    ON DELETE CASCADE

);







-- ==================================================
-- VALUE BETS
-- ==================================================

CREATE TABLE IF NOT EXISTS value_bets (

    id SERIAL PRIMARY KEY,


    jogo_id INTEGER,


    mercado VARCHAR(100),


    odd_mercado NUMERIC(6,2),


    probabilidade NUMERIC(5,2),


    odd_justa NUMERIC(6,2),


    valor_esperado NUMERIC(6,2),


    recomendacao VARCHAR(100),


    ativo BOOLEAN DEFAULT TRUE,


    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(jogo_id)

    REFERENCES jogos(id)

    ON DELETE CASCADE

);







-- ==================================================
-- HISTÓRICO DE PREVISÕES
-- ==================================================

CREATE TABLE IF NOT EXISTS historico_previsoes (

    id SERIAL PRIMARY KEY,


    jogo_id INTEGER,


    previsao VARCHAR(100),


    resultado_real VARCHAR(100),


    acertou BOOLEAN,


    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(jogo_id)

    REFERENCES jogos(id)

);







-- ==================================================
-- LOG DE SINCRONIZAÇÃO
-- ==================================================

CREATE TABLE IF NOT EXISTS sincronizacao (

    id SERIAL PRIMARY KEY,


    servico VARCHAR(100),


    ultima_execucao TIMESTAMP,


    registros INTEGER DEFAULT 0,


    status VARCHAR(50),


    mensagem TEXT

);






-- ==================================================
-- ÍNDICES
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_jogos_data

ON jogos(data_jogo);



CREATE INDEX IF NOT EXISTS idx_jogos_status

ON jogos(status);



CREATE INDEX IF NOT EXISTS idx_valuebets_ativo

ON value_bets(ativo);



CREATE INDEX IF NOT EXISTS idx_campeonatos_api

ON campeonatos(api_id);



-- ==================================================
-- FINAL
-- ==================================================

INSERT INTO sincronizacao
(
servico,
ultima_execucao,
status,
mensagem
)

VALUES

(
'BetVision AI',
NOW(),
'instalado',
'Banco criado com sucesso'
)

ON CONFLICT DO NOTHING;
