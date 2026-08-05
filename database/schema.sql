/*
==================================================
BETVISION AI
PostgreSQL Schema v4.1
Banco completo produção
==================================================
*/


-- =================================================
-- TABELA CAMPEONATOS
-- =================================================

CREATE TABLE IF NOT EXISTS campeonatos (

    id INTEGER PRIMARY KEY,

    nome VARCHAR(150) NOT NULL,

    pais VARCHAR(100),

    continente VARCHAR(100),

    temporada VARCHAR(20),

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



-- =================================================
-- TABELA TIMES
-- =================================================

CREATE TABLE IF NOT EXISTS times (

    id INTEGER PRIMARY KEY,

    campeonato_id INTEGER,

    nome VARCHAR(150) NOT NULL,

    pais VARCHAR(100),


    -- Estatísticas base IA

    ataque INTEGER DEFAULT 50,

    defesa INTEGER DEFAULT 50,


    -- Métricas preditivas

    forma NUMERIC(5,2) DEFAULT 50,

    media_gols NUMERIC(5,2) DEFAULT 0,

    media_sofridos NUMERIC(5,2) DEFAULT 0,


    -- Histórico

    vitorias INTEGER DEFAULT 0,

    derrotas INTEGER DEFAULT 0,

    empates INTEGER DEFAULT 0,


    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_times_campeonato

        FOREIGN KEY (campeonato_id)

        REFERENCES campeonatos(id)

        ON DELETE CASCADE

);



-- =================================================
-- TABELA JOGADORES
-- =================================================

CREATE TABLE IF NOT EXISTS jogadores (

    id INTEGER PRIMARY KEY,

    time_id INTEGER,


    nome VARCHAR(150) NOT NULL,


    gols INTEGER DEFAULT 0,

    assistencias INTEGER DEFAULT 0,


    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_jogadores_time

        FOREIGN KEY (time_id)

        REFERENCES times(id)

        ON DELETE CASCADE

);



-- =================================================
-- TABELA PARTIDAS
-- =================================================

CREATE TABLE IF NOT EXISTS partidas (

    id INTEGER PRIMARY KEY,


    -- ID externo API-Football / TheSportsDB

    api_id VARCHAR(100),


    campeonato_id INTEGER,


    time_casa INTEGER,

    time_fora INTEGER,


    data_partida TIMESTAMP,


    rodada INTEGER,


    estadio VARCHAR(150),



    gols_casa INTEGER DEFAULT 0,

    gols_fora INTEGER DEFAULT 0,


    status VARCHAR(30)

        DEFAULT 'agendada',



    -- Controle IA

    previsao_status VARCHAR(30),



    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    CONSTRAINT fk_partidas_campeonato

        FOREIGN KEY (campeonato_id)

        REFERENCES campeonatos(id),



    CONSTRAINT fk_partidas_time_casa

        FOREIGN KEY (time_casa)

        REFERENCES times(id),



    CONSTRAINT fk_partidas_time_fora

        FOREIGN KEY (time_fora)

        REFERENCES times(id)

);
/*
==================================================
BETVISION AI
PostgreSQL Schema v4.1
PARTE 2/3
==================================================
*/


-- =================================================
-- TABELA ODDS
-- =================================================

CREATE TABLE IF NOT EXISTS odds (

    id SERIAL PRIMARY KEY,


    partida_id INTEGER NOT NULL,


    mercado VARCHAR(100),


    selecao VARCHAR(150),


    odd NUMERIC(8,2),


    casa_aposta VARCHAR(100),



    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    CONSTRAINT fk_odds_partida

        FOREIGN KEY (partida_id)

        REFERENCES partidas(id)

        ON DELETE CASCADE

);




-- =================================================
-- TABELA ANALISES IA
-- =================================================

CREATE TABLE IF NOT EXISTS analises_ia (

    id SERIAL PRIMARY KEY,


    partida_id INTEGER NOT NULL,



    probabilidade_casa NUMERIC(5,2),


    probabilidade_empate NUMERIC(5,2),


    probabilidade_fora NUMERIC(5,2),



    recomendacao TEXT,



    valor_esperado NUMERIC(8,2),



    confianca NUMERIC(5,2),



    modelo VARCHAR(100)

        DEFAULT 'Probabilidade + Estatística',



    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    CONSTRAINT fk_analise_partida

        FOREIGN KEY (partida_id)

        REFERENCES partidas(id)

        ON DELETE CASCADE

);




-- =================================================
-- VIEW DE COMPATIBILIDADE
-- Mantém rotas antigas funcionando
-- /api/analises
-- =================================================

CREATE OR REPLACE VIEW analises AS

SELECT

    id,

    partida_id,

    probabilidade_casa,

    probabilidade_empate,

    probabilidade_fora,

    recomendacao,

    valor_esperado,

    confianca,

    modelo,

    criado_em


FROM analises_ia;





-- =================================================
-- TABELA VALUE BETS
-- =================================================

CREATE TABLE IF NOT EXISTS valuebets (

    id SERIAL PRIMARY KEY,



    partida_id INTEGER NOT NULL,



    mercado VARCHAR(100),



    selecao VARCHAR(150),



    odd NUMERIC(8,2),



    probabilidade NUMERIC(5,2),



    valor_esperado NUMERIC(8,2),



    confianca NUMERIC(5,2),



    status VARCHAR(30)

        DEFAULT 'ativa',



    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    CONSTRAINT fk_valuebet_partida

        FOREIGN KEY (partida_id)

        REFERENCES partidas(id)

        ON DELETE CASCADE

);





-- =================================================
-- TABELA PREVISÕES IA
-- =================================================

CREATE TABLE IF NOT EXISTS previsoes_ia (

    id SERIAL PRIMARY KEY,



    partida_id INTEGER NOT NULL,



    modelo VARCHAR(100),



    probabilidade NUMERIC(5,2),



    placar_previsto VARCHAR(20),



    mercado_recomendado VARCHAR(100),



    confianca NUMERIC(5,2),



    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    CONSTRAINT fk_previsao_partida

        FOREIGN KEY (partida_id)

        REFERENCES partidas(id)

        ON DELETE CASCADE

);
/*
==================================================
BETVISION AI
PostgreSQL Schema v4.1
PARTE 3/3
==================================================
*/


-- =================================================
-- HISTÓRICO DE APOSTAS
-- =================================================

CREATE TABLE IF NOT EXISTS apostas_historico (

    id SERIAL PRIMARY KEY,


    partida_id INTEGER,


    mercado VARCHAR(100),


    selecao VARCHAR(150),


    valor NUMERIC(12,2),


    odd NUMERIC(8,2),


    resultado VARCHAR(50),


    lucro NUMERIC(12,2),


    roi NUMERIC(8,2),



    data_aposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    CONSTRAINT fk_historico_partida

        FOREIGN KEY (partida_id)

        REFERENCES partidas(id)

        ON DELETE SET NULL

);




-- =================================================
-- USUÁRIOS
-- =================================================

CREATE TABLE IF NOT EXISTS usuarios (

    id SERIAL PRIMARY KEY,


    nome VARCHAR(150) NOT NULL,


    email VARCHAR(200) UNIQUE NOT NULL,


    senha TEXT NOT NULL,


    nivel VARCHAR(30)

        DEFAULT 'usuario',



    premium BOOLEAN

        DEFAULT FALSE,



    ativo BOOLEAN

        DEFAULT TRUE,



    token_reset TEXT,



    ultimo_ip VARCHAR(100),



    ultimo_login TIMESTAMP,



    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);





-- =================================================
-- ÍNDICES DE PERFORMANCE
-- =================================================


CREATE INDEX IF NOT EXISTS idx_campeonato_nome

ON campeonatos(nome);



CREATE INDEX IF NOT EXISTS idx_campeonato_pais

ON campeonatos(pais);




CREATE INDEX IF NOT EXISTS idx_times_nome

ON times(nome);



CREATE INDEX IF NOT EXISTS idx_times_campeonato

ON times(campeonato_id);




CREATE INDEX IF NOT EXISTS idx_jogadores_time

ON jogadores(time_id);




CREATE INDEX IF NOT EXISTS idx_partidas_data

ON partidas(data_partida);



CREATE INDEX IF NOT EXISTS idx_partidas_campeonato

ON partidas(campeonato_id);



CREATE INDEX IF NOT EXISTS idx_partidas_api

ON partidas(api_id);




CREATE INDEX IF NOT EXISTS idx_odds_partida

ON odds(partida_id);




CREATE INDEX IF NOT EXISTS idx_analises_partida

ON analises_ia(partida_id);




CREATE INDEX IF NOT EXISTS idx_valuebets_partida

ON valuebets(partida_id);



CREATE INDEX IF NOT EXISTS idx_valuebets_status

ON valuebets(status);




CREATE INDEX IF NOT EXISTS idx_previsoes_partida

ON previsoes_ia(partida_id);




CREATE INDEX IF NOT EXISTS idx_historico_partida

ON apostas_historico(partida_id);




CREATE INDEX IF NOT EXISTS idx_usuario_email

ON usuarios(email);





-- =================================================
-- CONFIGURAÇÕES FINAIS
-- =================================================


-- Atualização automática de timestamp
-- preparada para futuras triggers IA


COMMENT ON TABLE campeonatos IS

'Competições monitoradas pelo BetVision AI';



COMMENT ON TABLE analises_ia IS

'Resultados do modelo de inteligência artificial';



COMMENT ON TABLE valuebets IS

'Oportunidades com valor esperado positivo';



COMMENT ON TABLE previsoes_ia IS

'Previsões estatísticas e probabilísticas do sistema';



/*
==================================================
FIM BETVISION AI DATABASE v4.1
==================================================
*/
