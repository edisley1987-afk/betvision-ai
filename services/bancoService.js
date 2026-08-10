// ==================================================
// BETVISION AI
// services/bancoService.js
// Serviço central PostgreSQL v6.0
// Neon PostgreSQL
// ==================================================

import {
    query
} from "../database/database.js";



// ==================================================
// CAMPEONATOS
// ==================================================

export async function listarCampeonatos() {

    const resultado = await query(`
        SELECT
            id,
            nome,
            pais,
            continente,
            temporada,
            api_id,
            logo,
            ativo
        FROM campeonatos
        ORDER BY nome
    `);

    return resultado.rows || [];
}



// ==================================================
// INSERIR / ATUALIZAR CAMPEONATO
// ==================================================

export async function inserirCampeonato(campeonato) {

    try {

        const {

            id,
            api_id,
            nome,
            pais,
            continente,
            temporada,
            logo,
            ativo = true

        } = campeonato || {};



        // --------------------------------------------------
        // O ID do banco é gerado automaticamente.
        // O ID da Football-Data vai para api_id.
        // --------------------------------------------------

        const identificadorApi =
            api_id ??
            id ??
            null;



        if (!identificadorApi) {

            console.warn(
                "⚠ Campeonato ignorado: api_id não informado"
            );

            return null;

        }



        if (!nome) {

            console.warn(
                "⚠ Campeonato ignorado: nome não informado"
            );

            return null;

        }



        // --------------------------------------------------
        // Verifica se já existe pelo api_id
        // --------------------------------------------------

        const existente = await query(
            `
            SELECT id
            FROM campeonatos
            WHERE api_id = $1
            LIMIT 1
            `,
            [
                identificadorApi
            ]
        );



        // --------------------------------------------------
        // ATUALIZA
        // --------------------------------------------------

        if (existente.rows.length > 0) {

            const resultado = await query(
                `
                UPDATE campeonatos

                SET

                    nome = $1,
                    pais = $2,
                    continente = $3,
                    temporada = $4,
                    logo = $5,
                    ativo = $6

                WHERE api_id = $7

                RETURNING *
                `,
                [

                    nome,

                    pais || null,

                    continente || null,

                    temporada != null
                        ? String(temporada)
                        : null,

                    logo || null,

                    ativo,

                    identificadorApi

                ]
            );



            return resultado.rows[0] || null;

        }



        // --------------------------------------------------
        // INSERE
        // --------------------------------------------------
        // NÃO inserimos id.
        // PostgreSQL gera automaticamente.
        // --------------------------------------------------

        const resultado = await query(
            `
            INSERT INTO campeonatos

            (
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
                $7
            )

            RETURNING *
            `,
            [

                nome,

                pais || null,

                continente || null,

                temporada != null
                    ? String(temporada)
                    : null,

                identificadorApi,

                logo || null,

                ativo

            ]
        );



        return resultado.rows[0] || null;

    }

    catch (erro) {

        console.error(
            "❌ Erro salvar campeonato:",
            erro.message
        );

        return null;

    }

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

    return resultado.rows || [];

}



// ==================================================
// INSERIR / ATUALIZAR TIME
// ==================================================

export async function inserirTime(time) {

    try {

        const {

            id,
            api_id,
            campeonato_id,
            campeonato_api_id,
            nome,
            pais,
            logo

        } = time || {};



        if (!nome) {

            console.warn(
                "⚠ Time ignorado: nome não informado"
            );

            return null;

        }



        // --------------------------------------------------
        // Compatibilidade com estruturas antigas
        // --------------------------------------------------

        const identificadorApi =
            api_id ??
            id ??
            null;



        // --------------------------------------------------
        // Se existir api_id na tabela, utiliza.
        // Caso contrário, usa o id antigo.
        // --------------------------------------------------

        if (identificadorApi) {

            try {

                const existente = await query(
                    `
                    SELECT id
                    FROM times
                    WHERE api_id = $1
                    LIMIT 1
                    `,
                    [
                        identificadorApi
                    ]
                );



                if (existente.rows.length > 0) {

                    const resultado = await query(
                        `
                        UPDATE times

                        SET

                            nome = $1,
                            pais = $2,
                            campeonato_id = $3,
                            logo = COALESCE($4, logo)

                        WHERE api_id = $5

                        RETURNING *
                        `,
                        [

                            nome,

                            pais || null,

                            campeonato_id || null,

                            logo || null,

                            identificadorApi

                        ]
                    );



                    return resultado.rows[0] || null;

                }

            }

            catch (erroApiId) {

                // --------------------------------------------------
                // Caso a tabela antiga não tenha api_id,
                // continua para o método compatível.
                // --------------------------------------------------

                if (
                    !String(
                        erroApiId.message || ""
                    ).toLowerCase().includes("api_id")
                ) {

                    throw erroApiId;

                }

            }

        }



        // --------------------------------------------------
        // TABELA TIMES COM API_ID
        // --------------------------------------------------

        if (identificadorApi) {

            try {

                const resultado = await query(
                    `
                    INSERT INTO times

                    (
                        nome,
                        pais,
                        campeonato_id,
                        api_id,
                        logo
                    )

                    VALUES

                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )

                    RETURNING *
                    `,
                    [

                        nome,

                        pais || null,

                        campeonato_id || null,

                        identificadorApi,

                        logo || null

                    ]
                );



                return resultado.rows[0] || null;

            }

            catch (erro) {

                // --------------------------------------------------
                // Se api_id não existir na estrutura atual,
                // tenta estrutura antiga.
                // --------------------------------------------------

                if (
                    !String(
                        erro.message || ""
                    ).toLowerCase().includes("api_id")
                ) {

                    throw erro;

                }

            }

        }



        // --------------------------------------------------
        // ESTRUTURA ANTIGA
        // --------------------------------------------------

        const resultado = await query(
            `
            INSERT INTO times

            (
                nome,
                pais,
                campeonato_id
            )

            VALUES

            (
                $1,
                $2,
                $3
            )

            RETURNING *
            `,
            [

                nome,

                pais || null,

                campeonato_id || null

            ]
        );



        return resultado.rows[0] || null;

    }

    catch (erro) {

        console.error(
            "❌ Erro salvar time:",
            erro.message
        );

        return null;

    }

}



// ==================================================
// JOGOS
// ==================================================

export async function listarJogosHoje() {

    const resultado = await query(`
        SELECT *

        FROM jogos

        WHERE DATE(data_jogo) = CURRENT_DATE

        ORDER BY data_jogo
    `);

    return resultado.rows || [];

}



// ==================================================
// LISTAR JOGOS
// ==================================================

export async function listarJogos() {

    const resultado = await query(`
        SELECT *

        FROM jogos

        ORDER BY data_jogo DESC

        LIMIT 500
    `);

    return resultado.rows || [];

}



// ==================================================
// BUSCAR JOGO POR API ID
// ==================================================

export async function buscarJogoPorApiId(api_id) {

    if (!api_id) {

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
            api_id
        ]
    );



    return resultado.rows[0] || null;

}



// ==================================================
// ANÁLISES IA
// ==================================================
// IMPORTANTE:
//
// A tabela "analises" atual NÃO possui jogo_id.
//
// Estrutura informada:
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
//
// Portanto usamos somente "jogo".
// ==================================================

export async function salvarAnalise(analise) {

    try {

        const {

            jogo,
            probabilidade_casa,
            probabilidade_empate,
            probabilidade_fora,
            gols_esperados,
            placar_previsto,
            value_bet = false,
            confianca,
            algoritmo

        } = analise || {};



        if (!jogo) {

            console.warn(
                "⚠ Análise ignorada: jogo não informado"
            );

            return null;

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
                algoritmo
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
                $8,
                $9
            )

            RETURNING *
            `,
            [

                jogo,

                probabilidade_casa ?? null,

                probabilidade_empate ?? null,

                probabilidade_fora ?? null,

                gols_esperados ?? null,

                placar_previsto || null,

                Boolean(value_bet),

                confianca || "BAIXA",

                algoritmo ||
                "Probabilidade + Estatística"

            ]
        );



        return resultado.rows[0] || null;

    }

    catch (erro) {

        console.error(
            "❌ Erro salvar análise IA:",
            erro.message
        );

        return null;

    }

}



// ==================================================
// LISTAR ANÁLISES
// ==================================================

export async function listarAnalises() {

    try {

        const resultado = await query(
            `
            SELECT *

            FROM analises

            ORDER BY criado_em DESC

            LIMIT 500
            `
        );



        return resultado.rows || [];

    }

    catch (erro) {

        console.error(
            "❌ Erro listar análises:",
            erro.message
        );

        return [];

    }

}



// ==================================================
// VALUE BETS
// ==================================================

export async function salvarValueBet(valueBet) {

    try {

        const {

            jogo_id,
            mercado,
            odd_mercado,
            probabilidade_real,
            valor_esperado,
            confianca

        } = valueBet || {};



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

                jogo_id ?? null,

                mercado || null,

                odd_mercado ?? null,

                probabilidade_real ?? null,

                valor_esperado ?? null,

                confianca || "MEDIA"

            ]
        );



        return resultado.rows[0] || null;

    }

    catch (erro) {

        console.error(
            "❌ Erro salvar Value Bet:",
            erro.message
        );

        return null;

    }

}



// ==================================================
// LISTAR VALUE BETS
// ==================================================

export async function listarValueBets() {

    try {

        const resultado = await query(
            `
            SELECT *

            FROM value_bets

            ORDER BY id DESC

            LIMIT 500
            `
        );



        return resultado.rows || [];

    }

    catch (erro) {

        console.error(
            "❌ Erro listar Value Bets:",
            erro.message
        );

        return [];

    }

}



// ==================================================
// DASHBOARD
// ==================================================

export async function buscarDashboard() {

    try {

        const resultado = await query(
            `
            SELECT *

            FROM dashboard_status
            `
        );



        return resultado.rows[0] || null;

    }

    catch (erro) {

        console.error(
            "❌ Erro dashboard_status:",
            erro.message
        );

        return null;

    }

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

    listarJogos,

    buscarJogoPorApiId,

    salvarAnalise,

    listarAnalises,

    salvarValueBet,

    listarValueBets,

    buscarDashboard

};
