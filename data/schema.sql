CREATE TABLE IF NOT EXISTS campeonatos (

    id INTEGER PRIMARY KEY,

    nome TEXT NOT NULL,

    pais TEXT,

    continente TEXT,

    temporada TEXT,

    ativo INTEGER DEFAULT 1,

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP

);



CREATE TABLE IF NOT EXISTS times (

    id INTEGER PRIMARY KEY,

    campeonato_id INTEGER,

    nome TEXT NOT NULL,

    pais TEXT,

    ataque INTEGER DEFAULT 50,

    defesa INTEGER DEFAULT 50,

    FOREIGN KEY(campeonato_id)

    REFERENCES campeonatos(id)

);



CREATE TABLE IF NOT EXISTS jogadores (

    id INTEGER PRIMARY KEY,

    time_id INTEGER,

    nome TEXT NOT NULL,

    gols INTEGER DEFAULT 0,

    assistencias INTEGER DEFAULT 0,

    FOREIGN KEY(time_id)

    REFERENCES times(id)

);



CREATE TABLE IF NOT EXISTS partidas (

    id INTEGER PRIMARY KEY,

    campeonato_id INTEGER,

    time_casa INTEGER,

    time_fora INTEGER,

    data TEXT,

    gols_casa INTEGER DEFAULT 0,

    gols_fora INTEGER DEFAULT 0,

    status TEXT DEFAULT 'agendada',

    FOREIGN KEY(campeonato_id)

    REFERENCES campeonatos(id)

);



CREATE TABLE IF NOT EXISTS odds (

    id INTEGER PRIMARY KEY,

    partida_id INTEGER,

    mercado TEXT,

    selecao TEXT,

    odd REAL,

    casa_aposta TEXT,

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(partida_id)

    REFERENCES partidas(id)

);



CREATE TABLE IF NOT EXISTS analises_ia (

    id INTEGER PRIMARY KEY,

    partida_id INTEGER,

    probabilidade_casa REAL,

    probabilidade_empate REAL,

    probabilidade_fora REAL,

    recomendacao TEXT,

    valor_esperado REAL,

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(partida_id)

    REFERENCES partidas(id)

);



CREATE TABLE IF NOT EXISTS apostas_historico (

    id INTEGER PRIMARY KEY,

    partida_id INTEGER,

    mercado TEXT,

    valor REAL,

    odd REAL,

    resultado TEXT,

    lucro REAL,

    data DATETIME DEFAULT CURRENT_TIMESTAMP

);



CREATE TABLE IF NOT EXISTS usuarios (

    id INTEGER PRIMARY KEY,

    nome TEXT,

    email TEXT UNIQUE,

    senha TEXT,

    nivel TEXT DEFAULT 'usuario',

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP

);
