// ==================================================
// BETVISION AI
// services/bancoService.js
//
// VERSÃO 13.0
//
// PostgreSQL / NeonDB
//
// CORREÇÃO PRINCIPAL:
// - schema.sql real mostra que ANALISES já possui jogo_id,
//   api_id, time_casa, time_fora, confianca, algoritmo etc.
//   O código anterior nunca preenchia essas colunas e
//   dependia de casar strings de nome de jogo (frágil).
// - salvarAnalise() agora popula jogo_id/api_id/time_casa/
//   time_fora/confianca/algoritmo e faz UPSERT por api_id
//   (usa o índice único idx_analises_api_id_unico).
// - Todos os JOINs voltam a ser ON a.jogo_id = j.id (direto),
//   sem regex nem casamento por nome.
// ==================================================

import {
    query
} from "../database/database.js";


const TIMEZONE = "America/Sao_Paulo";


export function obterDataHojeBrasil() {

    try {

        return new Intl.DateTimeFormat(
            "en-CA",
            { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }
        ).format(new Date());

    } catch (erro) {

        console.error("❌ Erro data Brasil:", erro.message);

        return new Date().toISOString().slice(0, 10);
    }
}


export function obterDataAmanhaBrasil() {

    const hoje = obterDataHojeBrasil();

    const partes = hoje.split("-");

    const data = new Date(
        Date.UTC(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
    );

    data.setUTCDate(data.getUTCDate() + 1);

    return data.toISOString().slice(0, 10);
}


export function normalizarId(valor) {

    if (valor === undefined || valor === null || valor === "") {
        return null;
    }

    const numero = Number(valor);

    if (!Number.isInteger(numero) || numero <= 0) {
        return null;
    }

    return numero;
}


export function normalizarApiId(valor) {
    return normalizarId(valor);
}


// ==================================================
// CAMPEONATOS
// ==================================================

export async function listarCampeonatos() {

    const resultado = await query(
        `SELECT * FROM campeonatos ORDER BY nome ASC`
    );

    console.log(`🏆 Campeonatos encontrados: ${resultado.rows.length}`);

    return resultado.rows;
}


export async function inserirCampeonato(campeonato) {

    if (!campeonato) {
        throw new Error("Campeonato não informado");
    }

    const { id, nome, pais, continente, temporada, api_id, logo, ativo } = campeonato;

    const campeonatoId = normalizarId(id);

    if (!campeonatoId) {
        throw new Error("ID do campeonato inválido");
    }

    const apiId = normalizarApiId(api_id);

    const resultado = await query(
        `
        INSERT INTO campeonatos
        (id, nome, pais, continente, temporada, api_id, logo, ativo)
        VALUES
        ($1::integer, $2::text, $3::text, $4::text, $5::text, $6::integer, $7::text, COALESCE($8::boolean, true))
        ON CONFLICT(id)
        DO UPDATE SET
            nome = EXCLUDED.nome,
            pais = EXCLUDED.pais,
            continente = EXCLUDED.continente,
            temporada = EXCLUDED.temporada,
            api_id = EXCLUDED.api_id,
            logo = EXCLUDED.logo,
            ativo = EXCLUDED.ativo
        RETURNING *
        `,
        [campeonatoId, nome ?? null, pais ?? null, continente ?? null, temporada ?? null, apiId, logo ?? null, ativo ?? true]
    );

    return resultado.rows[0] || null;
}


// ==================================================
// TIMES
// ==================================================

export async function listarTimes() {

    const resultado = await query(`SELECT * FROM times ORDER BY nome ASC`);

    return resultado.rows;
}


export async function inserirTime(time) {

    if (!time) {
        throw new Error("Time não informado");
    }

    const { id, campeonato_id, nome, pais } = time;

    const timeId = normalizarId(id);

    if (!timeId) {
        throw new Error("ID do time inválido");
    }

    const campeonatoId =
        (campeonato_id === null || campeonato_id === undefined || campeonato_id === "")
            ? null
            : normalizarId(campeonato_id);

    const resultado = await query(
        `
        INSERT INTO times (id, campeonato_id, nome, pais)
        VALUES ($1::integer, $2::integer, $3::text, $4::text)
        ON CONFLICT(id)
        DO UPDATE SET
            campeonato_id = EXCLUDED.campeonato_id,
            nome = EXCLUDED.nome,
            pais = EXCLUDED.pais
        RETURNING *
        `,
        [timeId, campeonatoId, nome ?? null, pais ?? null]
    );

    return resultado.rows[0] || null;
}


// ==================================================
// JOGOS DE HOJE
// ==================================================

export async function listarJogosHoje() {

    try {

        const hoje = obterDataHojeBrasil();

        const resultado = await query(
            `
            SELECT * FROM jogos
            WHERE data_jogo IS NOT NULL
            AND (data_jogo AT TIME ZONE $1)::date = $2::date
            ORDER BY data_jogo ASC
            `,
            [TIMEZONE, hoje]
        );

        console.log(`⚽ ${resultado.rows.length} jogos encontrados para hoje`);

        return resultado.rows;

    } catch (erro) {

        console.error("❌ Erro jogos hoje:", erro);
        throw erro;
    }
}


export async function listarJogosAmanha() {

    try {

        const amanha = obterDataAmanhaBrasil();

        const resultado = await query(
            `
            SELECT * FROM jogos
            WHERE data_jogo IS NOT NULL
            AND (data_jogo AT TIME ZONE $1)::date = $2::date
            ORDER BY data_jogo ASC
            `,
            [TIMEZONE, amanha]
        );

        console.log(`⚽ ${resultado.rows.length} jogos encontrados para amanhã`);

        return resultado.rows;

    } catch (erro) {

        console.error("❌ Erro jogos amanhã:", erro);
        throw erro;
    }
}


export async function listarJogosDisponiveis() {

    try {

        const hoje = obterDataHojeBrasil();
        const amanha = obterDataAmanhaBrasil();

        const resultado = await query(
            `
            SELECT * FROM jogos
            WHERE data_jogo IS NOT NULL
            AND (data_jogo AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
            ORDER BY data_jogo ASC
            `,
            [TIMEZONE, hoje, amanha]
        );

        console.log(`⚽ ${resultado.rows.length} jogos encontrados hoje + amanhã`);

        return resultado.rows;

    } catch (erro) {

        console.error("❌ Erro jogos disponíveis:", erro);
        throw erro;
    }
}


export async function listarJogosHojeEAmanha() {
    return listarJogosDisponiveis();
}


export async function buscarJogoPorId(id) {

    const jogoId = normalizarId(id);

    if (!jogoId) {
        return null;
    }

    const resultado = await query(
        `SELECT * FROM jogos WHERE id = $1::integer LIMIT 1`,
        [jogoId]
    );

    return resultado.rows[0] || null;
}


export async function buscarJogoPorApiId(api_id) {

    const apiId = normalizarApiId(api_id);

    if (!apiId) {
        return null;
    }

    const resultado = await query(
        `SELECT * FROM jogos WHERE api_id = $1::integer LIMIT 1`,
        [apiId]
    );

    return resultado.rows[0] || null;
}


export async function buscarJogoPorNomes(timeCasa, timeFora) {

    if (!timeCasa || !timeFora) {
        return null;
    }

    try {

        const resultado = await query(
            `
            SELECT * FROM jogos
            WHERE LOWER(TRIM(time_casa)) = LOWER(TRIM($1::text))
            AND LOWER(TRIM(time_fora)) = LOWER(TRIM($2::text))
            ORDER BY data_jogo DESC
            LIMIT 1
            `,
            [timeCasa, timeFora]
        );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error("❌ Erro buscar jogo por nomes:", erro);
        return null;
    }
}


// ==================================================
// HISTÓRICO REAL
// ==================================================

export async function buscarHistoricoTime(nomeTime, limite = 10, dataLimite = null) {

    if (!nomeTime) {
        return [];
    }

    try {

        const resultado = await query(
            `
            SELECT id, api_id, campeonato, time_casa, time_fora, data_jogo, estadio, status, gols_casa, gols_fora
            FROM jogos
            WHERE
            (
                LOWER(TRIM(time_casa)) = LOWER(TRIM($1::text))
                OR LOWER(TRIM(time_fora)) = LOWER(TRIM($1::text))
            )
            AND gols_casa IS NOT NULL
            AND gols_fora IS NOT NULL
            AND ($2::timestamp IS NULL OR data_jogo < $2::timestamp)
            ORDER BY data_jogo DESC
            LIMIT $3::integer
            `,
            [nomeTime, dataLimite, Number(limite) || 10]
        );

        console.log(`📚 Histórico ${nomeTime}: ${resultado.rows.length}`);

        return resultado.rows;

    } catch (erro) {

        console.error(`❌ Erro histórico ${nomeTime}:`, erro);
        throw erro;
    }
}


export async function buscarH2H(timeCasa, timeFora, limite = 10, dataLimite = null) {

    if (!timeCasa || !timeFora) {
        return [];
    }

    try {

        const resultado = await query(
            `
            SELECT id, api_id, campeonato, time_casa, time_fora, data_jogo, estadio, status, gols_casa, gols_fora
            FROM jogos
            WHERE
            (
                (LOWER(TRIM(time_casa)) = LOWER(TRIM($1::text)) AND LOWER(TRIM(time_fora)) = LOWER(TRIM($2::text)))
                OR
                (LOWER(TRIM(time_casa)) = LOWER(TRIM($2::text)) AND LOWER(TRIM(time_fora)) = LOWER(TRIM($1::text)))
            )
            AND gols_casa IS NOT NULL
            AND gols_fora IS NOT NULL
            AND ($3::timestamp IS NULL OR data_jogo < $3::timestamp)
            ORDER BY data_jogo DESC
            LIMIT $4::integer
            `,
            [timeCasa, timeFora, dataLimite, Number(limite) || 10]
        );

        console.log(`⚔️ H2H ${timeCasa} x ${timeFora}: ${resultado.rows.length}`);

        return resultado.rows;

    } catch (erro) {

        console.error("❌ Erro H2H:", erro);
        throw erro;
    }
}


// ==================================================
// ANÁLISES — BUSCAS DE APOIO
// ==================================================

export async function buscarAnalisePorNome(jogo) {

    if (!jogo) {
        return null;
    }

    try {

        const resultado = await query(
            `
            SELECT * FROM analises
            WHERE LOWER(TRIM(jogo)) = LOWER(TRIM($1::text))
            ORDER BY id DESC
            LIMIT 1
            `,
            [jogo]
        );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error("❌ Erro análise por nome:", erro);
        throw erro;
    }
}


export async function buscarAnalisePorJogoId(jogo_id) {

    const jogoId = normalizarId(jogo_id);

    if (!jogoId) {
        return null;
    }

    try {

        const resultado = await query(
            `SELECT * FROM analises WHERE jogo_id = $1::integer ORDER BY id DESC LIMIT 1`,
            [jogoId]
        );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error("❌ Erro análise por jogo_id:", erro);
        throw erro;
    }
}


// Busca DIRETO na coluna analises.api_id (não em jogos.api_id).
// Usa o índice único idx_analises_api_id_unico.
export async function buscarAnalisePorApiIdDireto(api_id) {

    const apiId = normalizarApiId(api_id);

    if (!apiId) {
        return null;
    }

    try {

        const resultado = await query(
            `SELECT * FROM analises WHERE api_id = $1::integer LIMIT 1`,
            [apiId]
        );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error("❌ Erro análise por api_id:", erro);
        throw erro;
    }
}


export async function buscarAnalisePorId(id) {

    const analiseId = normalizarId(id);

    if (!analiseId) {
        return null;
    }

    try {

        const resultado = await query(
            `
            SELECT
                a.*,
                j.data_jogo,
                j.campeonato,
                j.time_casa AS jogo_time_casa,
                j.time_fora AS jogo_time_fora,
                j.estadio,
                j.status,
                j.gols_casa,
                j.gols_fora,
                j.api_id AS jogo_api_id
            FROM analises a
            LEFT JOIN jogos j ON j.id = a.jogo_id
            WHERE a.id = $1::integer
            LIMIT 1
            `,
            [analiseId]
        );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error("❌ Erro buscar análise ID:", erro);
        throw erro;
    }
}


// ==================================================
// LISTAR ANÁLISES DE HOJE
//
// JOIN direto por jogo_id (chave real, com FK).
// ==================================================

export async function listarAnalisesHoje() {

    try {

        const hoje = obterDataHojeBrasil();

        console.log("==========================================");
        console.log("🤖 BUSCANDO ANÁLISES DE HOJE");
        console.log(`📅 ${hoje}`);
        console.log(`🌎 ${TIMEZONE}`);

        const resultado = await query(
            `
            SELECT
                a.id AS analise_id,
                a.jogo,
                a.jogo_id,
                a.api_id,
                a.time_casa,
                a.time_fora,
                a.favorito,
                a.probabilidade_casa,
                a.probabilidade_empate,
                a.probabilidade_fora,
                a.gols_esperados,
                a.placar_previsto,
                a.value_bet,
                a.confianca,
                a.algoritmo,
                a.criado_em,
                j.data_jogo,
                j.campeonato,
                j.estadio,
                j.status,
                j.gols_casa,
                j.gols_fora
            FROM analises a
            INNER JOIN jogos j ON j.id = a.jogo_id
            WHERE
                j.data_jogo IS NOT NULL
                AND (j.data_jogo AT TIME ZONE $1)::date = $2::date
            ORDER BY j.data_jogo ASC, a.id DESC
            `,
            [TIMEZONE, hoje]
        );

        console.log(`🤖 ${resultado.rows.length} análises encontradas`);

        return resultado.rows;

    } catch (erro) {

        console.error("❌ ERRO SQL listarAnalisesHoje:");
        console.error(erro);
        throw erro;
    }
}


export async function listarAnalises() {

    try {

        const resultado = await query(`SELECT * FROM analises ORDER BY id DESC`);

        return resultado.rows;

    } catch (erro) {

        console.error("❌ Erro listar análises:", erro);
        throw erro;
    }
}


// ==================================================
// SALVAR ANÁLISE
//
// Agora popula jogo_id, api_id, time_casa, time_fora,
// confianca e algoritmo — colunas que já existem na
// tabela mas nunca eram preenchidas.
//
// Deduplicação: prioriza api_id (índice único) via
// UPSERT; cai para jogo_id, depois para nome, se
// api_id não vier.
// ==================================================

export async function salvarAnalise(analise) {

    if (!analise || typeof analise !== "object") {
        throw new Error("Dados da análise inválidos");
    }

    const nomeJogo = String(analise.jogo ?? "").trim();

    if (!nomeJogo) {
        throw new Error("Nome do jogo obrigatório");
    }

    const jogoId = normalizarId(analise.jogo_id);
    const apiId = normalizarApiId(analise.api_id);

    const timeCasa = analise.time_casa ?? null;
    const timeFora = analise.time_fora ?? null;
    const favorito = analise.favorito ?? null;

    const probabilidadeCasa =
        analise.probabilidade_casa ?? analise.probabilidades?.casa ?? null;

    const probabilidadeEmpate =
        analise.probabilidade_empate ?? analise.probabilidades?.empate ?? null;

    const probabilidadeFora =
        analise.probabilidade_fora ?? analise.probabilidades?.fora ?? null;

    let golsEsperados = analise.gols_esperados ?? analise.golsEsperados ?? null;

    if (golsEsperados && typeof golsEsperados === "object") {

        if (golsEsperados.total !== undefined && golsEsperados.total !== null) {
            golsEsperados = Number(golsEsperados.total);
        } else {
            const casa = Number(golsEsperados.casa ?? 0);
            const fora = Number(golsEsperados.fora ?? 0);
            golsEsperados = casa + fora;
        }
    }

    golsEsperados = Number.isFinite(Number(golsEsperados)) ? Number(golsEsperados) : null;

    const valorValueBet = analise.value_bet ?? analise.valueBet ?? false;

    let valueBet = false;

    if (typeof valorValueBet === "boolean") {
        valueBet = valorValueBet;
    } else if (Array.isArray(valorValueBet)) {
        valueBet = valorValueBet.length > 0;
    } else if (valorValueBet && typeof valorValueBet === "object") {
        valueBet = true;
    } else if (typeof valorValueBet === "string") {
        valueBet = ["true", "1", "sim", "yes"].includes(valorValueBet.toLowerCase().trim());
    }

    let placar = analise.placar_previsto ?? analise.placarPrevisto ?? null;

    if (placar && typeof placar === "object") {
        placar = JSON.stringify(placar);
    }

    // confianca é VARCHAR(50) no schema — aceita número ou texto
    const confiancaValor = analise.confianca ?? analise.confianca?.percentual ?? null;
    const confianca = confiancaValor === null ? null : String(confiancaValor);

    const algoritmo = analise.algoritmo ?? null;

    // ==================================================
    // UPSERT quando temos api_id (índice único garante isso)
    // ==================================================

    if (apiId) {

        try {

            const resultado = await query(
                `
                INSERT INTO analises
                (
                    jogo, jogo_id, api_id, time_casa, time_fora, favorito,
                    probabilidade_casa, probabilidade_empate, probabilidade_fora,
                    gols_esperados, placar_previsto, value_bet, confianca, algoritmo
                )
                VALUES
                (
                    $1::text, $2::integer, $3::integer, $4::text, $5::text, $6::text,
                    $7::numeric, $8::numeric, $9::numeric,
                    $10::numeric, $11::text, $12::boolean, $13::varchar, $14::varchar
                )
                ON CONFLICT (api_id) WHERE api_id IS NOT NULL
                DO UPDATE SET
                    jogo = EXCLUDED.jogo,
                    jogo_id = EXCLUDED.jogo_id,
                    time_casa = EXCLUDED.time_casa,
                    time_fora = EXCLUDED.time_fora,
                    favorito = EXCLUDED.favorito,
                    probabilidade_casa = EXCLUDED.probabilidade_casa,
                    probabilidade_empate = EXCLUDED.probabilidade_empate,
                    probabilidade_fora = EXCLUDED.probabilidade_fora,
                    gols_esperados = EXCLUDED.gols_esperados,
                    placar_previsto = EXCLUDED.placar_previsto,
                    value_bet = EXCLUDED.value_bet,
                    confianca = EXCLUDED.confianca,
                    algoritmo = EXCLUDED.algoritmo,
                    atualizado_em = CURRENT_TIMESTAMP
                RETURNING *
                `,
                [
                    nomeJogo, jogoId, apiId, timeCasa, timeFora, favorito,
                    probabilidadeCasa, probabilidadeEmpate, probabilidadeFora,
                    golsEsperados, placar, valueBet, confianca, algoritmo
                ]
            );

            const salva = resultado.rows[0] || null;

            if (salva) {
                console.log("==========================================");
                console.log(`💾 ANÁLISE SALVA (upsert por api_id)`);
                console.log(`🆔 ID: ${salva.id} | jogo_id: ${salva.jogo_id ?? "NULL"} | api_id: ${salva.api_id ?? "NULL"}`);
                console.log(`⚽ ${salva.jogo}`);
                console.log("==========================================");
            }

            return salva;

        } catch (erro) {

            console.error("❌ ERRO SQL SALVAR ANÁLISE (upsert api_id):");
            console.error(erro);
            throw erro;
        }
    }

    // ==================================================
    // SEM api_id: dedupe por jogo_id, depois por nome
    // ==================================================

    const existente =
        jogoId
            ? await buscarAnalisePorJogoId(jogoId)
            : await buscarAnalisePorNome(nomeJogo);

    if (existente) {

        console.log(`♻️ Análise já existe: ${nomeJogo}`);

        return existente;
    }

    try {

        const resultado = await query(
            `
            INSERT INTO analises
            (
                jogo, jogo_id, time_casa, time_fora, favorito,
                probabilidade_casa, probabilidade_empate, probabilidade_fora,
                gols_esperados, placar_previsto, value_bet, confianca, algoritmo
            )
            VALUES
            (
                $1::text, $2::integer, $3::text, $4::text, $5::text,
                $6::numeric, $7::numeric, $8::numeric,
                $9::numeric, $10::text, $11::boolean, $12::varchar, $13::varchar
            )
            RETURNING *
            `,
            [
                nomeJogo, jogoId, timeCasa, timeFora, favorito,
                probabilidadeCasa, probabilidadeEmpate, probabilidadeFora,
                golsEsperados, placar, valueBet, confianca, algoritmo
            ]
        );

        const salva = resultado.rows[0] || null;

        if (salva) {
            console.log("==========================================");
            console.log(`💾 ANÁLISE SALVA`);
            console.log(`🆔 ID: ${salva.id} | jogo_id: ${salva.jogo_id ?? "NULL"}`);
            console.log(`⚽ ${salva.jogo}`);
            console.log("==========================================");
        }

        return salva;

    } catch (erro) {

        console.error("❌ ERRO SQL SALVAR ANÁLISE:");
        console.error(erro);
        throw erro;
    }
}


// ==================================================
// ANÁLISES HOJE + AMANHÃ
// ==================================================

export async function listarAnalisesDisponiveis() {

    try {

        const resultado = await query(
            `
            SELECT
                a.id AS analise_id,
                a.jogo,
                a.jogo_id,
                a.api_id,
                a.time_casa,
                a.time_fora,
                a.probabilidade_casa,
                a.probabilidade_empate,
                a.probabilidade_fora,
                a.gols_esperados,
                a.placar_previsto,
                a.value_bet,
                a.confianca,
                j.data_jogo,
                j.campeonato,
                j.estadio,
                j.status,
                j.gols_casa,
                j.gols_fora
            FROM analises a
            INNER JOIN jogos j ON j.id = a.jogo_id
            WHERE
                j.data_jogo IS NOT NULL
                AND (j.data_jogo AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
            ORDER BY j.data_jogo ASC, a.id DESC
            `,
            [TIMEZONE, obterDataHojeBrasil(), obterDataAmanhaBrasil()]
        );

        return resultado.rows;

    } catch (erro) {

        console.error("❌ Erro análises disponíveis:", erro);
        throw erro;
    }
}


export async function buscarAnalisePorApiId(api_id) {

    // Agora busca direto na coluna analises.api_id, com LEFT JOIN
    // em jogos apenas para enriquecer com dados da partida.
    const apiId = normalizarApiId(api_id);

    if (!apiId) {
        return null;
    }

    try {

        const resultado = await query(
            `
            SELECT
                a.*,
                j.data_jogo,
                j.time_casa AS jogo_time_casa,
                j.time_fora AS jogo_time_fora,
                j.campeonato,
                j.estadio,
                j.status
            FROM analises a
            LEFT JOIN jogos j ON j.id = a.jogo_id
            WHERE a.api_id = $1::integer
            ORDER BY a.id DESC
            LIMIT 1
            `,
            [apiId]
        );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error("❌ Erro análise API:", erro);
        throw erro;
    }
}


// ==================================================
// VALUE BETS
// ==================================================

export async function salvarValueBet(valueBet) {

    if (!valueBet) {
        return null;
    }

    const { jogo_id, mercado, selecao, odd_mercado, probabilidade, valor_estimado, ativo } = valueBet;

    const jogoId = normalizarId(jogo_id);

    if (!jogoId) {
        throw new Error("jogo_id inválido");
    }

    try {

        const resultado = await query(
            `
            INSERT INTO value_bets
            (jogo_id, mercado, selecao, odd_mercado, probabilidade, valor_estimado, ativo)
            VALUES ($1::integer, $2::text, $3::text, $4::numeric, $5::numeric, $6::numeric, COALESCE($7::boolean, true))
            RETURNING *
            `,
            [jogoId, mercado ?? "N/A", selecao ?? null, odd_mercado ?? null, probabilidade ?? null, valor_estimado ?? null, ativo ?? true]
        );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error("❌ Erro salvar Value Bet:", erro);
        throw erro;
    }
}


export async function listarValueBetsDisponiveis() {

    try {

        const hoje = obterDataHojeBrasil();
        const amanha = obterDataAmanhaBrasil();

        const resultado = await query(
            `
            SELECT
                vb.*,
                j.api_id, j.time_casa, j.time_fora, j.data_jogo, j.campeonato, j.estadio, j.status
            FROM value_bets vb
            INNER JOIN jogos j ON j.id = vb.jogo_id
            WHERE
                COALESCE(vb.ativo, true) = true
                AND j.data_jogo IS NOT NULL
                AND (j.data_jogo AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
            ORDER BY vb.valor_estimado DESC NULLS LAST, j.data_jogo ASC
            LIMIT 100
            `,
            [TIMEZONE, hoje, amanha]
        );

        console.log(`💰 Value Bets encontradas: ${resultado.rows.length}`);

        return resultado.rows;

    } catch (erro) {

        console.error("❌ ERRO SQL VALUE BETS:");
        console.error(erro);
        throw erro;
    }
}


// ==================================================
// DASHBOARD
// ==================================================

export async function buscarDashboard() {

    try {

        const hoje = obterDataHojeBrasil();
        const amanha = obterDataAmanhaBrasil();

        const resultado = await query(
            `
            SELECT
                (SELECT COUNT(*) FROM campeonatos)::integer AS campeonatos,
                (SELECT COUNT(*) FROM times)::integer AS times,
                (SELECT COUNT(*) FROM jogos)::integer AS jogos_historico,
                (
                    SELECT COUNT(*) FROM jogos
                    WHERE data_jogo IS NOT NULL
                    AND (data_jogo AT TIME ZONE $1)::date = $2::date
                )::integer AS jogos_hoje,
                (
                    SELECT COUNT(*) FROM jogos
                    WHERE data_jogo IS NOT NULL
                    AND (data_jogo AT TIME ZONE $1)::date = $3::date
                )::integer AS jogos_amanha,
                (SELECT COUNT(*) FROM analises)::integer AS analises,
                (SELECT COUNT(*) FROM value_bets WHERE COALESCE(ativo, true) = true)::integer AS valuebets,
                (
                    SELECT COUNT(*)
                    FROM analises a
                    INNER JOIN jogos j ON j.id = a.jogo_id
                    WHERE j.data_jogo IS NOT NULL
                    AND (j.data_jogo AT TIME ZONE $1)::date = $2::date
                )::integer AS analises_hoje
            `,
            [TIMEZONE, hoje, amanha]
        );

        const dados = resultado.rows[0] || {};

        return {
            ...dados,
            status: "operacional",
            sistema: "BetVision AI",
            timezone: TIMEZONE,
            data: hoje
        };

    } catch (erro) {

        console.error("❌ ERRO SQL DASHBOARD:");
        console.error(erro);
        throw erro;
    }
}


export async function estatisticasBanco() {

    try {

        const resultado = await query(
            `
            SELECT
                (SELECT COUNT(*) FROM campeonatos) AS campeonatos,
                (SELECT COUNT(*) FROM times) AS times,
                (SELECT COUNT(*) FROM jogos) AS jogos_historico,
                (
                    SELECT COUNT(*) FROM jogos
                    WHERE data_jogo IS NOT NULL
                    AND (data_jogo AT TIME ZONE $1)::date = $2::date
                ) AS jogos_hoje,
                (
                    SELECT COUNT(*) FROM jogos
                    WHERE data_jogo IS NOT NULL
                    AND (data_jogo AT TIME ZONE $1)::date = $3::date
                ) AS jogos_amanha,
                (SELECT COUNT(*) FROM analises) AS analises,
                (SELECT COUNT(*) FROM value_bets WHERE COALESCE(ativo, true) = true) AS valuebets_ativas
            `,
            [TIMEZONE, obterDataHojeBrasil(), obterDataAmanhaBrasil()]
        );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error("❌ Erro estatísticas:", erro);
        throw erro;
    }
}


export default {
    listarCampeonatos,
    inserirCampeonato,
    listarTimes,
    inserirTime,
    listarJogosHoje,
    listarJogosAmanha,
    listarJogosDisponiveis,
    listarJogosHojeEAmanha,
    buscarJogoPorId,
    buscarJogoPorApiId,
    buscarJogoPorNomes,
    buscarHistoricoTime,
    buscarH2H,
    buscarAnalisePorApiId,
    buscarAnalisePorApiIdDireto,
    buscarAnalisePorId,
    buscarAnalisePorNome,
    buscarAnalisePorJogoId,
    salvarAnalise,
    listarAnalises,
    listarAnalisesHoje,
    listarAnalisesDisponiveis,
    salvarValueBet,
    listarValueBetsDisponiveis,
    buscarDashboard,
    estatisticasBanco,
    obterDataHojeBrasil,
    obterDataAmanhaBrasil
};
