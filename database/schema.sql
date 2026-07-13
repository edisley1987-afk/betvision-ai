/*
==================================================
BETVISION AI - PostgreSQL Schema v4.0
==================================================
*/

CREATE TABLE IF NOT EXISTS campeonatos (

    id INTEGER PRIMARY KEY,

    nome VARCHAR(150) NOT NULL,

    pais VARCHAR(100),

    continente VARCHAR(100),

    temporada VARCHAR(20),

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE IF NOT EXISTS times (

    id INTEGER PRIMARY KEY,

    campeonato_id INTEGER,

    nome VARCHAR(150) NOT NULL,

    pais VARCHAR(100),

    ataque INTEGER DEFAULT 50,

    defesa INTEGER DEFAULT 50,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_times_campeonato
        FOREIGN KEY (campeonato_id)
        REFERENCES campeonatos(id)
        ON DELETE CASCADE

);

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

CREATE TABLE IF NOT EXISTS partidas (

    id INTEGER PRIMARY KEY,

    campeonato_id INTEGER,

    time_casa INTEGER,

    time_fora INTEGER,

    data_partida TIMESTAMP,

    gols_casa INTEGER DEFAULT 0,

    gols_fora INTEGER DEFAULT 0,

    status VARCHAR(30) DEFAULT 'agendada',

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

CREATE TABLE IF NOT EXISTS analises_ia (

    id SERIAL PRIMARY KEY,

    partida_id INTEGER NOT NULL,

    probabilidade_casa NUMERIC(5,2),

    probabilidade_empate NUMERIC(5,2),

    probabilidade_fora NUMERIC(5,2),

    recomendacao TEXT,

    valor_esperado NUMERIC(8,2),

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_analise_partida
        FOREIGN KEY (partida_id)
        REFERENCES partidas(id)
        ON DELETE CASCADE

);

CREATE TABLE IF NOT EXISTS apostas_historico (

    id SERIAL PRIMARY KEY,

    partida_id INTEGER,

    mercado VARCHAR(100),

    valor NUMERIC(12,2),

    odd NUMERIC(8,2),

    resultado VARCHAR(50),

    lucro NUMERIC(12,2),

    data_aposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historico_partida
        FOREIGN KEY (partida_id)
        REFERENCES partidas(id)

);

CREATE TABLE IF NOT EXISTS usuarios (

    id SERIAL PRIMARY KEY,

    nome VARCHAR(150) NOT NULL,

    email VARCHAR(200) UNIQUE NOT NULL,

    senha TEXT NOT NULL,

    nivel VARCHAR(30) DEFAULT 'usuario',

    premium BOOLEAN DEFAULT FALSE,

    ativo BOOLEAN DEFAULT TRUE,

    ultimo_login TIMESTAMP,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE INDEX IF NOT EXISTS idx_campeonato_nome
ON campeonatos(nome);

CREATE INDEX IF NOT EXISTS idx_times_nome
ON times(nome);

CREATE INDEX IF NOT EXISTS idx_partidas_data
ON partidas(data_partida);

CREATE INDEX IF NOT EXISTS idx_odds_partida
ON odds(partida_id);

CREATE INDEX IF NOT EXISTS idx_analises_partida
ON analises_ia(partida_id);

CREATE INDEX IF NOT EXISTS idx_usuario_email
ON usuarios(email);
