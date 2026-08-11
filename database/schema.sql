-- ============================================================
-- BETVISION AI
-- schema.sql
-- Versão 7.0
-- PostgreSQL / NeonDB
----------------------

-- OBJETIVOS:
-- 1. Manter compatibilidade com banco existente
-- 2. Evitar jogos duplicados
-- 3. Evitar análises duplicadas
-- 4. Relacionar análises aos jogos
-- 5. Melhorar integridade dos dados
-- 6. Preparar banco para Value Bets
------------------------------------

-- IMPORTANTE:
-- Este arquivo NÃO apaga dados existentes.
-------------------------------------------

-- Antes de executar:
-- Faça backup do banco caso esteja em produção.
-- ============================================================

-- ============================================================
-- EXTENSÃO
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- SEQUÊNCIAS
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS campeonatos_id_seq;

CREATE SEQUENCE IF NOT EXISTS times_id_seq;

CREATE SEQUENCE IF NOT EXISTS jogos_id_seq;

CREATE SEQUENCE IF NOT EXISTS partidas_id_seq;

CREATE SEQUENCE IF NOT EXISTS odds_id_seq;

CREATE SEQUENCE IF NOT EXISTS analises_id_seq;

CREATE SEQUENCE IF NOT EXISTS value_bets_id_seq;

CREATE SEQUENCE IF NOT EXISTS valuebets_id_seq;

CREATE SEQUENCE IF NOT EXISTS usuarios_id_seq;

-- ============================================================
-- TABELA: CAMPEONATOS
-- ============================================================

CREATE TABLE IF NOT EXISTS campeonatos (

```
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
```

);

ALTER TABLE campeonatos
ADD COLUMN IF NOT EXISTS id INTEGER;

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
-- SEQUENCE CAMPEONATOS
-- ============================================================

ALTER SEQUENCE campeonatos_id_seq
OWNED BY campeonatos.id;

ALTER TABLE campeonatos
ALTER COLUMN id SET DEFAULT nextval('campeonatos_id_seq');

SELECT setval(
'campeonatos_id_seq',
GREATEST(
COALESCE(
(SELECT MAX(id) FROM campeonatos),
0
),
1
),
true
);

-- ============================================================
-- ÍNDICES CAMPEONATOS
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_campeonatos_api_id
ON campeonatos(api_id)
WHERE api_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
idx_campeonatos_nome
ON campeonatos(nome);

CREATE INDEX IF NOT EXISTS
idx_campeonatos_ativo
ON campeonatos(ativo);

CREATE INDEX IF NOT EXISTS
idx_campeonatos_pais
ON campeonatos(pais);

-- ============================================================
-- TABELA: TIMES
-- ============================================================

CREATE TABLE IF NOT EXISTS times (

```
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
```

);

ALTER TABLE times
ADD COLUMN IF NOT EXISTS id INTEGER;

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

-- ============================================================
-- SEQUENCE TIMES
-- ============================================================

ALTER SEQUENCE times_id_seq
OWNED BY times.id;

ALTER TABLE times
ALTER COLUMN id SET DEFAULT nextval('times_id_seq');

SELECT setval(
'times_id_seq',
GREATEST(
COALESCE(
(SELECT MAX(id) FROM times),
0
),
1
),
true
);

-- ============================================================
-- ÍNDICES TIMES
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_times_api_id
ON times(api_id)
WHERE api_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
idx_times_nome
ON times(nome);

CREATE INDEX IF NOT EXISTS
idx_times_pais
ON times(pais);

CREATE INDEX IF NOT EXISTS
idx_times_ativo
ON times(ativo);

-- ============================================================
-- TABELA PRINCIPAL: JOGOS
-- ============================================================

CREATE TABLE IF NOT EXISTS jogos (

```
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
```

);

-- ============================================================
-- GARANTIR COLUNAS JOGOS
-- ============================================================

ALTER TABLE jogos
ADD COLUMN IF NOT EXISTS id INTEGER;

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
-- SEQUENCE JOGOS
-- ============================================================

ALTER SEQUENCE jogos_id_seq
OWNED BY jogos.id;

ALTER TABLE jogos
ALTER COLUMN id SET DEFAULT nextval('jogos_id_seq');

SELECT setval(
'jogos_id_seq',
GREATEST(
COALESCE(
(SELECT MAX(id) FROM jogos),
0
),
1
),
true
);

-- ============================================================
-- ÍNDICE PRINCIPAL DE JOGOS
----------------------------

-- IMPORTANTE:
-- api_id identifica exclusivamente a partida na API.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_jogos_api_id
ON jogos(api_id)
WHERE api_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
idx_jogos_data
ON jogos(data_jogo);

CREATE INDEX IF NOT EXISTS
idx_jogos_status
ON jogos(status);

CREATE INDEX IF NOT EXISTS
idx_jogos_time_casa
ON jogos(time_casa);

CREATE INDEX IF NOT EXISTS
idx_jogos_time_fora
ON jogos(time_fora);

CREATE INDEX IF NOT EXISTS
idx_jogos_casa_fora
ON jogos(time_casa, time_fora);

CREATE INDEX IF NOT EXISTS
idx_jogos_data_status
ON jogos(data_jogo, status);

-- ============================================================
-- TABELA: PARTIDAS
-------------------

-- Mantida por compatibilidade.
-- A tabela principal utilizada pelo sistema é JOGOS.
-- ============================================================

CREATE TABLE IF NOT EXISTS partidas (

```
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
```

);

ALTER TABLE partidas
ADD COLUMN IF NOT EXISTS id INTEGER;

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

ALTER SEQUENCE partidas_id_seq
OWNED BY partidas.id;

ALTER TABLE partidas
ALTER COLUMN id SET DEFAULT nextval('partidas_id_seq');

SELECT setval(
'partidas_id_seq',
GREATEST(
COALESCE(
(SELECT MAX(id) FROM partidas),
0
),
1
),
true
);

CREATE INDEX IF NOT EXISTS
idx_partidas_api_id
ON partidas(api_id);

CREATE INDEX IF NOT EXISTS
idx_partidas_data
ON partidas(data_jogo);

CREATE INDEX IF NOT EXISTS
idx_partidas_status
ON partidas(status);

-- ============================================================
-- TABELA: ODDS
-- ============================================================

CREATE TABLE IF NOT EXISTS odds (

```
id INTEGER NOT NULL,

jogo_id INTEGER,

api_id INTEGER,

bookmaker VARCHAR(255),

mercado VARCHAR(255),

selecao VARCHAR(255),

odd NUMERIC(10,4),

data_coleta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

);

ALTER TABLE odds
ADD COLUMN IF NOT EXISTS id INTEGER;

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

ALTER SEQUENCE odds_id_seq
OWNED BY odds.id;

ALTER TABLE odds
ALTER COLUMN id SET DEFAULT nextval('odds_id_seq');

SELECT setval(
'odds_id_seq',
GREATEST(
COALESCE(
(SELECT MAX(id) FROM odds),
0
),
1
),
true
);

CREATE INDEX IF NOT EXISTS
idx_odds_jogo_id
ON odds(jogo_id);

CREATE INDEX IF NOT EXISTS
idx_odds_api_id
ON odds(api_id);

CREATE INDEX IF NOT EXISTS
idx_odds_mercado
ON odds(mercado);

CREATE INDEX IF NOT EXISTS
idx_odds_data
ON odds(data_coleta);

-- ============================================================
-- TABELA PRINCIPAL: ANALISES
-- ============================================================

CREATE TABLE IF NOT EXISTS analises (

```
id INTEGER NOT NULL,

jogo_id INTEGER,

api_id INTEGER,

jogo VARCHAR(500),

time_casa VARCHAR(255),

time_fora VARCHAR(255),

favorito VARCHAR(255),

probabilidade_casa NUMERIC(7,4),

probabilidade_empate NUMERIC(7,4),

probabilidade_fora NUMERIC(7,4),

placar_previsto VARCHAR(50),

placar_casa INTEGER,

placar_fora INTEGER,

gols_esperados NUMERIC(10,4),

over_15 BOOLEAN,

over_25 BOOLEAN,

over_35 BOOLEAN,

btts BOOLEAN,

value_bet BOOLEAN DEFAULT FALSE,

confianca VARCHAR(50),

algoritmo VARCHAR(255),

dados_historicos JSONB,

resultado JSONB,

criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

);

-- ============================================================
-- GARANTIR COLUNAS ANALISES
-- ============================================================

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS id INTEGER;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS jogo_id INTEGER;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS api_id INTEGER;

ALTER TABLE analises
ADD COLUMN IF NOT EXISTS jogo VARCHAR(500);

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
ADD COLUMN IF NOT EXISTS placar_previsto VARCHAR(50);

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
ADD COLUMN IF NOT EXISTS value_bet BOOLEAN DEFAULT FALSE;

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

-- ============================================================
-- SEQUENCE ANALISES
-- ============================================================

ALTER SEQUENCE analises_id_seq
OWNED BY analises.id;

ALTER TABLE analises
ALTER COLUMN id SET DEFAULT nextval('analises_id_seq');

SELECT setval(
'analises_id_seq',
GREATEST(
COALESCE(
(SELECT MAX(id) FROM analises),
0
),
1
),
true
);

-- ============================================================
-- ÍNDICES ANALISES
-- ============================================================

CREATE INDEX IF NOT EXISTS
idx_analises_jogo_id
ON analises(jogo_id);

CREATE INDEX IF NOT EXISTS
idx_analises_api_id
ON analises(api_id);

CREATE INDEX IF NOT EXISTS
idx_analises_data
ON analises(criado_em);

CREATE INDEX IF NOT EXISTS
idx_analises_times
ON analises(time_casa, time_fora);

-- ============================================================
-- PROTEÇÃO CONTRA ANÁLISES DUPLICADAS
--------------------------------------

-- Uma partida da API deve possuir apenas uma análise.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_analises_api_id_unico
ON analises(api_id)
WHERE api_id IS NOT NULL;

-- ============================================================
-- ÍNDICE PARA ANÁLISES LEGADAS
-------------------------------

-- Utilizado quando registros antigos não possuem api_id.
-- ============================================================

CREATE INDEX IF NOT EXISTS
idx_analises_jogo_nome
ON analises(jogo);

-- ============================================================
-- TABELA: VALUE_BETS
-- ============================================================

CREATE TABLE IF NOT EXISTS value_bets (

```
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
```

);

ALTER TABLE value_bets
ADD COLUMN IF NOT EXISTS id INTEGER;

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

ALTER SEQUENCE value_bets_id_seq
OWNED BY value_bets.id;

ALTER TABLE value_bets
ALTER COLUMN id SET DEFAULT nextval('value_bets_id_seq');

SELECT setval(
'value_bets_id_seq',
GREATEST(
COALESCE(
(SELECT MAX(id) FROM value_bets),
0
),
1
),
true
);

CREATE INDEX IF NOT EXISTS
idx_value_bets_jogo_id
ON value_bets(jogo_id);

CREATE INDEX IF NOT EXISTS
idx_value_bets_api_id
ON value_bets(api_id);

CREATE INDEX IF NOT EXISTS
idx_value_bets_status
ON value_bets(status);

CREATE INDEX IF NOT EXISTS
idx_value_bets_mercado
ON value_bets(mercado);

-- ============================================================
-- TABELA LEGADA: VALUEBETS
-- ============================================================

CREATE TABLE IF NOT EXISTS valuebets (

```
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
```

);

ALTER TABLE valuebets
ADD COLUMN IF NOT EXISTS id INTEGER;

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

ALTER SEQUENCE valuebets_id_seq
OWNED BY valuebets.id;

ALTER TABLE valuebets
ALTER COLUMN id SET DEFAULT nextval('valuebets_id_seq');

SELECT setval(
'valuebets_id_seq',
GREATEST(
COALESCE(
(SELECT MAX(id) FROM valuebets),
0
),
1
),
true
);

CREATE INDEX IF NOT EXISTS
idx_valuebets_jogo_id
ON valuebets(jogo_id);

CREATE INDEX IF NOT EXISTS
idx_valuebets_api_id
ON valuebets(api_id);

CREATE INDEX IF NOT EXISTS
idx_valuebets_status
ON valuebets(status);

-- ============================================================
-- TABELA: USUARIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (

```
id INTEGER NOT NULL,

nome VARCHAR(255),

email VARCHAR(255),

senha TEXT,

ativo BOOLEAN DEFAULT TRUE,

criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

);

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS id INTEGER;

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

ALTER SEQUENCE usuarios_id_seq
OWNED BY usuarios.id;

ALTER TABLE usuarios
ALTER COLUMN id SET DEFAULT nextval('usuarios_id_seq');

SELECT setval(
'usuarios_id_seq',
GREATEST(
COALESCE(
(SELECT MAX(id) FROM usuarios),
0
),
1
),
true
);

CREATE UNIQUE INDEX IF NOT EXISTS
idx_usuarios_email
ON usuarios(email)
WHERE email IS NOT NULL;

-- ============================================================
-- TABELA DE COMPATIBILIDADE NEON
-- ============================================================

CREATE TABLE IF NOT EXISTS playing_with_neon (

```
id INTEGER,

nome TEXT,

criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

);

-- ============================================================
-- RELACIONAMENTOS
------------------

-- Não utilizamos CASCADE para não apagar dados históricos
-- acidentalmente.
-- ============================================================

DO $$

BEGIN

```
IF NOT EXISTS (

    SELECT 1

    FROM pg_constraint

    WHERE conname = 'fk_analises_jogo'

) THEN

    BEGIN

        ALTER TABLE analises

        ADD CONSTRAINT fk_analises_jogo

        FOREIGN KEY (jogo_id)

        REFERENCES jogos(id);

    EXCEPTION

        WHEN foreign_key_violation THEN

            RAISE NOTICE
                'FK analises -> jogos não criada devido a dados existentes.';

    END;

END IF;
```

END $$;

DO $$

BEGIN

```
IF NOT EXISTS (

    SELECT 1

    FROM pg_constraint

    WHERE conname = 'fk_odds_jogo'

) THEN

    BEGIN

        ALTER TABLE odds

        ADD CONSTRAINT fk_odds_jogo

        FOREIGN KEY (jogo_id)

        REFERENCES jogos(id);

    EXCEPTION

        WHEN foreign_key_violation THEN

            RAISE NOTICE
                'FK odds -> jogos não criada devido a dados existentes.';

    END;

END IF;
```

END $$;

DO $$

BEGIN

```
IF NOT EXISTS (

    SELECT 1

    FROM pg_constraint

    WHERE conname = 'fk_value_bets_jogo'

) THEN

    BEGIN

        ALTER TABLE value_bets

        ADD CONSTRAINT fk_value_bets_jogo

        FOREIGN KEY (jogo_id)

        REFERENCES jogos(id);

    EXCEPTION

        WHEN foreign_key_violation THEN

            RAISE NOTICE
                'FK value_bets -> jogos não criada devido a dados existentes.';

    END;

END IF;
```

END $$;

-- ============================================================
-- TRIGGER PARA ATUALIZADO_EM
-- ============================================================

CREATE OR REPLACE FUNCTION atualizar_timestamp()

RETURNS TRIGGER

LANGUAGE plpgsql

AS $$

BEGIN

```
NEW.atualizado_em = CURRENT_TIMESTAMP;

RETURN NEW;
```

END;

$$;

DROP TRIGGER IF EXISTS
trg_campeonatos_atualizado
ON campeonatos;

CREATE TRIGGER
trg_campeonatos_atualizado

BEFORE UPDATE ON campeonatos

FOR EACH ROW

EXECUTE FUNCTION atualizar_timestamp();

DROP TRIGGER IF EXISTS
trg_times_atualizado
ON times;

CREATE TRIGGER
trg_times_atualizado

BEFORE UPDATE ON times

FOR EACH ROW

EXECUTE FUNCTION atualizar_timestamp();

DROP TRIGGER IF EXISTS
trg_analises_atualizado
ON analises;

CREATE TRIGGER
trg_analises_atualizado

BEFORE UPDATE ON analises

FOR EACH ROW

EXECUTE FUNCTION atualizar_timestamp();

-- ============================================================
-- VIEW: JOGOS DO DIA
---------------------

-- Esta view será útil para o endpoint /api/jogos.
-- ============================================================

CREATE OR REPLACE VIEW vw_jogos_do_dia AS

SELECT

```
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
```

FROM jogos j

WHERE DATE(j.data_jogo) = CURRENT_DATE

ORDER BY j.data_jogo ASC;

-- ============================================================
-- VIEW: JOGOS FUTUROS
-- ============================================================

CREATE OR REPLACE VIEW vw_jogos_futuros AS

SELECT

```
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
```

FROM jogos j

WHERE j.data_jogo >= CURRENT_TIMESTAMP

ORDER BY j.data_jogo ASC;

-- ============================================================
-- VIEW: JOGOS FINALIZADOS
-- ============================================================

CREATE OR REPLACE VIEW vw_jogos_finalizados AS

SELECT

```
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
```

FROM jogos j

WHERE

```
UPPER(COALESCE(j.status, ''))

IN (

    'FINISHED',

    'FINALIZADO',

    'FT'

)

AND j.gols_casa IS NOT NULL

AND j.gols_fora IS NOT NULL;
```

-- ============================================================
-- VIEW: HISTÓRICO DOS TIMES
-- ============================================================

CREATE OR REPLACE VIEW vw_historico_times AS

SELECT

```
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
```

FROM jogos j

WHERE

```
j.gols_casa IS NOT NULL

AND j.gols_fora IS NOT NULL;
```

-- ============================================================
-- VIEW: ANÁLISES RECENTES
-- ============================================================

CREATE OR REPLACE VIEW vw_analises_recentes AS

SELECT

```
a.id,

a.jogo_id,

a.api_id,

a.jogo,

a.time_casa,

a.time_fora,

a.favorito,

a.probabilidade_casa,

a.probabilidade_empate,

a.probabilidade_fora,

a.placar_previsto,

a.gols_esperados,

a.value_bet,

a.confianca,

a.algoritmo,

a.criado_em
```

FROM analises a

ORDER BY a.criado_em DESC;

-- ============================================================
-- VIEW: VALUE BETS ATIVAS
-- ============================================================

CREATE OR REPLACE VIEW vw_value_bets_ativas AS

SELECT

```
v.id,

v.jogo_id,

v.api_id,

v.time_casa,

v.time_fora,

v.mercado,

v.selecao,

v.odd,

v.odd_justa,

v.probabilidade,

v.edge,

v.roi,

v.kelly,

v.classificacao,

v.status,

v.criado_em
```

FROM value_bets v

WHERE

```
UPPER(COALESCE(v.status, ''))

NOT IN (

    'ENCERRADA',

    'CANCELADA',

    'PERDIDA'

);
```

-- ============================================================
-- ÍNDICES ADICIONAIS PARA DASHBOARD
-- ============================================================

CREATE INDEX IF NOT EXISTS
idx_jogos_dashboard
ON jogos(data_jogo, status, api_id);

CREATE INDEX IF NOT EXISTS
idx_analises_dashboard
ON analises(criado_em, api_id);

CREATE INDEX IF NOT EXISTS
idx_value_bets_dashboard
ON value_bets(criado_em, status);

-- ============================================================
-- CONSULTAS DE DIAGNÓSTICO
-- ============================================================

-- Total de jogos
SELECT
COUNT(*) AS total_jogos
FROM jogos;

-- Jogos com API ID
SELECT
COUNT(*) AS jogos_com_api_id
FROM jogos
WHERE api_id IS NOT NULL;

-- Total de análises
SELECT
COUNT(*) AS total_analises
FROM analises;

-- Análises relacionadas a jogo
SELECT
COUNT(*) AS analises_com_jogo
FROM analises
WHERE jogo_id IS NOT NULL;

-- Análises com API ID
SELECT
COUNT(*) AS analises_com_api_id
FROM analises
WHERE api_id IS NOT NULL;

-- Value Bets
SELECT
COUNT(*) AS total_value_bets
FROM value_bets;

-- ============================================================
-- DETECTAR DUPLICAÇÃO DE JOGOS
-- ============================================================

SELECT

```
api_id,

COUNT(*) AS quantidade
```

FROM jogos

WHERE api_id IS NOT NULL

GROUP BY api_id

HAVING COUNT(*) > 1

ORDER BY quantidade DESC;

-- ============================================================
-- DETECTAR DUPLICAÇÃO DE ANÁLISES
-- ============================================================

SELECT

```
api_id,

COUNT(*) AS quantidade
```

FROM analises

WHERE api_id IS NOT NULL

GROUP BY api_id

HAVING COUNT(*) > 1

ORDER BY quantidade DESC;

-- ============================================================
-- LISTAR TABELAS DO BETVISION
-- ============================================================

SELECT

```
table_name
```

FROM information_schema.tables

WHERE table_schema = 'public'

AND table_name IN (

```
'campeonatos',

'times',

'jogos',

'partidas',

'odds',

'analises',

'value_bets',

'valuebets',

'usuarios',

'playing_with_neon'
```

)

ORDER BY table_name;

-- ============================================================
-- VERIFICAÇÃO DAS COLUNAS JOGOS
-- ============================================================

SELECT

```
column_name,

data_type,

is_nullable,

column_default
```

FROM information_schema.columns

WHERE table_schema = 'public'

AND table_name = 'jogos'

ORDER BY ordinal_position;

-- ============================================================
-- VERIFICAÇÃO DAS COLUNAS ANALISES
-- ============================================================

SELECT

```
column_name,

data_type,

is_nullable,

column_default
```

FROM information_schema.columns

WHERE table_schema = 'public'

AND table_name = 'analises'

ORDER BY ordinal_position;

-- ============================================================
-- VERIFICAÇÃO DOS ÍNDICES JOGOS
-- ============================================================

SELECT

```
indexname,

indexdef
```

FROM pg_indexes

WHERE schemaname = 'public'

AND tablename = 'jogos'

ORDER BY indexname;

-- ============================================================
-- VERIFICAÇÃO DOS ÍNDICES ANALISES
-- ============================================================

SELECT

```
indexname,

indexdef
```

FROM pg_indexes

WHERE schemaname = 'public'

AND tablename = 'analises'

ORDER BY indexname;

-- ============================================================
-- FIM DO SCHEMA BETVISION AI
-- ============================================================
