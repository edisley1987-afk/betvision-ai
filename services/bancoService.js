// ==================================================
// BETVISION AI
// services/bancoService.js
// Serviço central PostgreSQL v6.0
// Compatível com NeonDB
//
// CORREÇÕES:
// - salvarAnalise() agora grava api_id
// - Compatível com UNIQUE(api_id)
// - Evita duplicação de análises
// - Recupera análise existente em caso de concorrência
// - Mantém compatibilidade com análises antigas sem api_id
// - PostgreSQL / NeonDB
// ==================================================

import {
    query
} from "../database/database.js";


// ==================================================
// CAMPEONATOS
// ==================================================

export async function listarCampeonatos() {

    const resultado =
        await query(
            `
            SELECT *

            FROM campeonatos

            ORDER BY nome
            `
        );

    return resultado.rows;

}


// ==================================================
// INSERIR / ATUALIZAR CAMPEONATO
// ==================================================

export async function inserirCampeonato(
    campeonato
) {

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


    const resultado =
        await query(

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

                nome =
                    EXCLUDED.nome,

                pais =
                    EXCLUDED.pais,

                continente =
                    EXCLUDED.continente,

                temporada =
                    EXCLUDED.temporada,

                api_id =
                    EXCLUDED.api_id,

                logo =
                    EXCLUDED.logo,

                ativo =
                    EXCLUDED.ativo

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

    const resultado =
        await query(

            `
            SELECT *

            FROM times

            ORDER BY nome
            `

        );


    return resultado.rows;

}


// ==================================================
// INSERIR / ATUALIZAR TIME
// ==================================================

export async function inserirTime(
    time
) {

    const {

        id,

        campeonato_id,

        nome,

        pais

    } = time;


    const resultado =
        await query(

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

                nome =
                    EXCLUDED.nome,

                campeonato_id =
                    EXCLUDED.campeonato_id,

                pais =
                    EXCLUDED.pais

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

    const resultado =
        await query(

            `
            SELECT *

            FROM jogos

            WHERE DATE(data_jogo)
                = CURRENT_DATE

            ORDER BY data_jogo
            `

        );


    return resultado.rows;

}


// ==================================================
// BUSCAR JOGO POR API_ID
// ==================================================

export async function buscarJogoPorApiId(
    api_id
) {

    if (

        api_id === undefined ||

        api_id === null ||

        api_id === ""

    ) {

        return null;

    }


    const resultado =
        await query(

            `
            SELECT *

            FROM jogos

            WHERE api_id = $1

            LIMIT 1
            `,

            [

                api_id

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
// Estrutura:
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
// REGRA:
//
// 1 api_id = 1 análise
//
// As análises antigas com api_id NULL
// continuam permitidas.
// ==================================================


// ==================================================
// NORMALIZAR API ID DA ANÁLISE
// ==================================================

function normalizarApiId(
    valor
) {

    if (

        valor === undefined ||

        valor === null ||

        valor === ""

    ) {

        return null;

    }


    const numero =
        Number(valor);


    if (

        !Number.isInteger(numero) ||

        numero <= 0

    ) {

        return null;

    }


    return numero;

}


// ==================================================
// BUSCAR ANÁLISE POR API ID
// ==================================================

export async function buscarAnalisePorApiId(
    api_id
) {

    const apiId =
        normalizarApiId(
            api_id
        );


    if (
        !apiId
    ) {

        return null;

    }


    const resultado =
        await query(

            `
            SELECT *

            FROM analises

            WHERE api_id = $1

            LIMIT 1
            `,

            [

                apiId

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
// FLUXO:
//
// 1. Valida api_id
// 2. Verifica análise existente
// 3. Se existir -> reutiliza
// 4. Se não existir -> INSERT
// 5. Se houver concorrência -> recupera
//
// IMPORTANTE:
//
// O índice:
//
// idx_analises_api_id_unique
//
// impede duplicações no PostgreSQL.
// ==================================================

export async function salvarAnalise(
    analise
) {

    if (

        !analise ||

        typeof analise !== "object"

    ) {

        throw new Error(
            "Dados da análise inválidos"
        );

    }


    const {

        jogo,

        api_id,

        probabilidade_casa,

        probabilidade_empate,

        probabilidade_fora,

        gols_esperados,

        placar_previsto,

        value_bet,

        confianca,

        algoritmo

    } = analise;


    const apiId =
        normalizarApiId(
            api_id
        );


    // ==========================================
    // NOVAS ANÁLISES DEVEM POSSUIR API ID
    // ==========================================

    if (
        !apiId
    ) {

        throw new Error(
            "api_id é obrigatório para salvar uma nova análise"
        );

    }


    // ==========================================
    // VERIFICAR SE JÁ EXISTE
    // ==========================================

    const existente =
        await buscarAnalisePorApiId(
            apiId
        );


    if (
        existente
    ) {

        console.log(

            `♻️ Análise existente reutilizada: API ${apiId} | ID ${existente.id}`

        );


        return existente;

    }


    // ==========================================
    // INSERIR NOVA ANÁLISE
    // ==========================================

    try {

        const resultado =
            await query(

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

                    apiId

                ]

            );


        const salva =
            resultado.rows[0];


        if (
            salva
        ) {

            console.log(

                `💾 Nova análise salva: API ${apiId} | ID ${salva.id}`

            );

        }


        return salva;

    }

    catch (erro) {

        // ======================================
        // CONCORRÊNCIA
        //
        // Outra requisição pode ter inserido
        // o mesmo api_id entre o SELECT e
        // o INSERT.
        //
        // PostgreSQL retornará erro 23505.
        // ======================================

        if (
            erro?.code === "23505"
        ) {

            console.log(

                `♻️ Análise criada por outra requisição: API ${apiId}`

            );


            const recuperada =
                await buscarAnalisePorApiId(
                    apiId
                );


            if (
                recuperada
            ) {

                return recuperada;

            }

        }


        console.error(

            "❌ Erro ao salvar análise:",

            erro.message

        );


        throw erro;

    }

}


// ==================================================
// LISTAR ANÁLISES
// ==================================================

export async function listarAnalises() {

    const resultado =
        await query(

            `
            SELECT *

            FROM analises

            ORDER BY

                criado_em DESC,

                id DESC
            `

        );


    return resultado.rows;

}


// ==================================================
// VALUE BETS
// ==================================================

export async function salvarValueBet(
    valueBet
) {

    const {

        jogo_id,

        mercado,

        odd_mercado,

        probabilidade_real,

        valor_esperado,

        confianca

    } = valueBet;


    const resultado =
        await query(

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

    const resultado =
        await query(

            `
            SELECT *

            FROM dashboard_status
            `

        );


    return resultado.rows[0];

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

    salvarAnalise,

    buscarAnalisePorApiId,

    listarAnalises,

    salvarValueBet,

    buscarDashboard

};

