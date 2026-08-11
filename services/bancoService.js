// ==================================================
// BETVISION AI
// services/bancoService.js
//
// Serviço central PostgreSQL v6.0
// Compatível com NeonDB
//
// CORREÇÕES:
// - análises vinculadas ao api_id do jogo
// - prevenção de análise duplicada
// - compatibilidade com análises antigas sem api_id
// - jogos vinculados por api_id
// - PostgreSQL / NeonDB
// ==================================================

import {
    query
} from "../database/database.js";

// ==================================================
// CAMPEONATOS
// ==================================================

export async function listarCampeonatos() {

    const resultado = await query(`
        SELECT *
        FROM campeonatos
        ORDER BY nome
    `);

    return resultado.rows;
}

// ==================================================
// INSERIR / ATUALIZAR CAMPEONATO
// ==================================================

export async function inserirCampeonato(campeonato) {

    const {
        id,
        nome,
        pais,
        continente,
        temporada,
        api_id,
        logo,
        ativo
    } = campeonato;

    const resultado = await query(
        `
        INSERT INTO campeonatos
        (
            id,
            nome,
            pais,
            continente,
            temporada,
            api_id,
            logo,
            ativo
        )

        VALUES
        (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            COALESCE($8, true)
        )

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
        [
            id,
            nome,
            pais,
            continente,
            temporada,
            api_id ?? id,
            logo ?? null,
            ativo ?? true
        ]
    );

    return resultado.rows[0];
}

// ==================================================
// TIMES
// ==================================================

export async function listarTimes() {

    const resultado = await query(`
        SELECT *
        FROM times
        ORDER BY nome
    `);

    return resultado.rows;
}

// ==================================================
// INSERIR / ATUALIZAR TIME
// ==================================================

export async function inserirTime(time) {

    const {
        id,
        campeonato_id,
        nome,
        pais
    } = time;

    const resultado = await query(
        `
        INSERT INTO times
        (
            id,
            campeonato_id,
            nome,
            pais
        )

        VALUES
        (
            $1,
            $2,
            $3,
            $4
        )

        ON CONFLICT(id)
        DO UPDATE SET

            nome = EXCLUDED.nome,

            campeonato_id = EXCLUDED.campeonato_id,

            pais = EXCLUDED.pais

        RETURNING *
        `,
        [
            id,
            campeonato_id,
            nome,
            pais
        ]
    );

    return resultado.rows[0];
}

// ==================================================
// JOGOS DO DIA
// ==================================================

export async function listarJogosHoje() {

    const resultado = await query(
        `
        SELECT *

        FROM jogos

        WHERE DATE(data_jogo) = CURRENT_DATE

        ORDER BY data_jogo
        `
    );

    return resultado.rows;
}

// ==================================================
// BUSCAR JOGO POR API_ID
// ==================================================

export async function buscarJogoPorApiId(api_id) {

    if (
        api_id === undefined ||
        api_id === null ||
        api_id === ""
    ) {

        return null;
    }

    const apiIdNumero = Number(api_id);

    if (
        !Number.isInteger(apiIdNumero) ||
        apiIdNumero <= 0
    ) {

        return null;
    }

    const resultado = await query(
        `
        SELECT *

        FROM jogos

        WHERE api_id = $1

        LIMIT 1
        `,
        [
            apiIdNumero
        ]
    );

    return (
        resultado.rows[0] ||
        null
    );
}

// ==================================================
// ANÁLISES IA
//
// Estrutura atual:
//
// id
// jogo
// probabilidade_casa
// probabilidade_empate
// probabilidade_fora
// gols_esperados
// placar_previsto
// value_bet
// confianca
// algoritmo
// criado_em
// api_id
//
// IMPORTANTE:
// api_id é o identificador do jogo externo.
// ==================================================

// ==================================================
// BUSCAR ANÁLISE POR API_ID
// ==================================================

export async function buscarAnalisePorApiId(api_id) {

    if (
        api_id === undefined ||
        api_id === null ||
        api_id === ""
    ) {

        return null;
    }

    const apiIdNumero = Number(api_id);

    if (
        !Number.isInteger(apiIdNumero) ||
        apiIdNumero <= 0
    ) {

        return null;
    }

    const resultado = await query(
        `
        SELECT *

        FROM analises

        WHERE api_id = $1

        ORDER BY criado_em DESC, id DESC

        LIMIT 1
        `,
        [
            apiIdNumero
        ]
    );

    return (
        resultado.rows[0] ||
        null
    );
}

// ==================================================
// BUSCAR ANÁLISE PELO NOME
//
// Compatibilidade com as 323 análises antigas
// que ainda não possuem api_id.
// ==================================================

export async function buscarAnalisePorNome(jogo) {

    if (
        !jogo ||
        typeof jogo !== "string"
    ) {

        return null;
    }

    const resultado = await query(
        `
        SELECT *

        FROM analises

        WHERE
            api_id IS NULL

            AND LOWER(TRIM(jogo))
                =
            LOWER(TRIM($1))

        ORDER BY criado_em DESC, id DESC

        LIMIT 1
        `,
        [
            jogo
        ]
    );

    return (
        resultado.rows[0] ||
        null
    );
}

// ==================================================
// SALVAR ANÁLISE
//
// Agora grava api_id.
//
// Compatível com chamadas antigas:
// se api_id não existir, será NULL.
// ==================================================

export async function salvarAnalise(analise) {

    if (
        !analise ||
        typeof analise !== "object"
    ) {

        throw new Error(
            "Dados da análise inválidos"
        );
    }

    const {
        api_id,
        jogo,
        probabilidade_casa,
        probabilidade_empate,
        probabilidade_fora,
        gols_esperados,
        placar_previsto,
        value_bet,
        confianca,
        algoritmo
    } = analise;

    let apiIdNumero = null;

    if (
        api_id !== undefined &&
        api_id !== null &&
        api_id !== ""
    ) {

        const numero =
            Number(api_id);

        if (
            Number.isInteger(numero) &&
            numero > 0
        ) {

            apiIdNumero = numero;

        }

    }

    // ==================================================
    // PROTEÇÃO EXTRA
    //
    // Antes de INSERT, verifica se já existe análise
    // para esse api_id.
    // ==================================================

    if (apiIdNumero !== null) {

        const existente =
            await buscarAnalisePorApiId(
                apiIdNumero
            );

        if (existente) {

            console.log(
                `♻️ salvarAnalise: análise já existe para API ${apiIdNumero} - ID ${existente.id}`
            );

            return existente;
        }
    }

    const resultado = await query(
        `
        INSERT INTO analises

        (
            jogo,
            probabilidade_casa,
            probabilidade_empate,
            probabilidade_fora,
            gols_esperados,
            placar_previsto,
            value_bet,
            confianca,
            algoritmo,
            api_id
        )

        VALUES

        (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            COALESCE($7, false),
            $8,
            $9,
            $10
        )

        RETURNING *
        `,
        [
            jogo ?? null,

            probabilidade_casa ?? null,

            probabilidade_empate ?? null,

            probabilidade_fora ?? null,

            gols_esperados ?? null,

            placar_previsto ?? null,

            value_bet ?? false,

            confianca ?? null,

            algoritmo ??
                "BetVision Statistical AI",

            apiIdNumero
        ]
    );

    return resultado.rows[0];
}

// ==================================================
// LISTAR ANÁLISES
// ==================================================

export async function listarAnalises() {

    const resultado = await query(
        `
        SELECT *

        FROM analises

        ORDER BY criado_em DESC, id DESC
        `
    );

    return resultado.rows;
}

// ==================================================
// VALUE BETS
// ==================================================

export async function salvarValueBet(valueBet) {

    const {
        jogo_id,
        mercado,
        odd_mercado,
        probabilidade_real,
        valor_esperado,
        confianca
    } = valueBet;

    const resultado = await query(
        `
        INSERT INTO value_bets

        (
            jogo_id,
            mercado,
            odd_mercado,
            probabilidade_real,
            valor_esperado,
            confianca
        )

        VALUES

        (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
        )

        RETURNING *
        `,
        [
            jogo_id,
            mercado,
            odd_mercado,
            probabilidade_real,
            valor_esperado,
            confianca
        ]
    );

    return resultado.rows[0];
}

// ==================================================
// DASHBOARD
// ==================================================

export async function buscarDashboard() {

    const resultado = await query(
        `
        SELECT *

        FROM dashboard_status
        `
    );

    return (
        resultado.rows[0] ||
        null
    );
}

// ==================================================
// EXPORT FINAL
// ==================================================

export default {

    listarCampeonatos,

    inserirCampeonato,

    listarTimes,

    inserirTime,

    listarJogosHoje,

    buscarJogoPorApiId,

    buscarAnalisePorApiId,

    buscarAnalisePorNome,

    salvarAnalise,

    listarAnalises,

    salvarValueBet,

    buscarDashboard

};
