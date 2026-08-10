// ==========================================
// BetVision AI
// services/oddsService.js
// Versão 4.1
// Motor de Odds Reais
// PostgreSQL NeonDB
//
// Estrutura real da tabela odds:
//
// id
// partida_id
// mercado
// selecao
// odd
// casa_aposta
// criado_em
// atualizado_em
// ==========================================

import {
    query
} from "../database/database.js";


// ==========================================
// NORMALIZAR NÚMERO
// ==========================================

function numero(valor) {

    const n = Number(valor);

    return Number.isFinite(n)
        ? n
        : 0;

}


// ==========================================
// SALVAR ODD
// ==========================================
// POST/INSERÇÃO DE UMA ODD
// ==========================================

export async function salvarOdd(odd) {

    try {

        if (!odd) {

            console.warn(
                "⚠️ ODD inválida"
            );

            return null;

        }


        const partidaId =
            odd.partida_id ??
            odd.partidaId ??
            odd.jogo_id ??
            odd.jogoId;


        const mercado =
            odd.mercado ??
            "Não informado";


        const selecao =
            odd.selecao ??
            "Não informado";


        const oddValor =
            numero(
                odd.odd
            );


        const casaAposta =
            odd.casa_aposta ??
            odd.bookmaker ??
            odd.casaAposta ??
            "Não informado";


        // ======================================
        // VALIDAÇÃO
        // ======================================

        if (!partidaId) {

            console.warn(
                "⚠️ ODD ignorada: partida_id não informado"
            );

            return null;

        }


        if (oddValor <= 0) {

            console.warn(
                "⚠️ ODD ignorada: valor inválido"
            );

            return null;

        }


        // ======================================
        // VERIFICAR SE JÁ EXISTE
        // ======================================

        const existente =
            await query(
                `
                SELECT id

                FROM odds

                WHERE partida_id = $1

                  AND mercado = $2

                  AND selecao = $3

                  AND casa_aposta = $4

                LIMIT 1
                `,
                [

                    partidaId,

                    mercado,

                    selecao,

                    casaAposta

                ]
            );


        // ======================================
        // ATUALIZAR ODD EXISTENTE
        // ======================================

        if (
            existente.rows.length > 0
        ) {

            const resultado =
                await query(
                    `
                    UPDATE odds

                    SET

                        odd = $1,

                        atualizado_em =
                            CURRENT_TIMESTAMP

                    WHERE id = $2

                    RETURNING *
                    `,
                    [

                        oddValor,

                        existente.rows[0].id

                    ]
                );


            return resultado.rows[0] || null;

        }


        // ======================================
        // INSERIR NOVA ODD
        // ======================================

        const resultado =
            await query(
                `
                INSERT INTO odds
                (
                    partida_id,
                    mercado,
                    selecao,
                    odd,
                    casa_aposta,
                    criado_em,
                    atualizado_em
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )

                RETURNING *
                `,
                [

                    partidaId,

                    mercado,

                    selecao,

                    oddValor,

                    casaAposta

                ]
            );


        return resultado.rows[0] || null;

    }

    catch (error) {

        console.error(
            "❌ Erro salvar odd:",
            error.message
        );

        return null;

    }

}


// ==========================================
// SALVAR VÁRIAS ODDS
// ==========================================

export async function salvarOdds(odds) {

    try {

        if (
            !Array.isArray(odds) ||
            odds.length === 0
        ) {

            return [];

        }


        const resultados = [];


        for (
            const odd of odds
        ) {

            const resultado =
                await salvarOdd(
                    odd
                );


            if (resultado) {

                resultados.push(
                    resultado
                );

            }

        }


        console.log(
            `💎 ${resultados.length} odds salvas/atualizadas`
        );


        return resultados;

    }

    catch (error) {

        console.error(
            "❌ Erro salvar várias odds:",
            error.message
        );

        return [];

    }

}


// ==========================================
// BUSCAR ODDS POR PARTIDA
// ==========================================
//
// Compatibilidade:
//
// buscarOddsJogo(jogo_id)
//
// O banco utiliza:
//
// odds.partida_id
//
// Neste momento o identificador recebido
// será tratado como partida_id.
//
// Isso evita gerar odds falsas ou assumir
// relacionamento inexistente.
//

export async function buscarOddsJogo(
    jogoId
) {

    try {

        if (!jogoId) {

            return [];

        }


        const resultado =
            await query(
                `
                SELECT

                    id,

                    partida_id,

                    mercado,

                    selecao,

                    odd,

                    casa_aposta,

                    casa_aposta AS bookmaker,

                    criado_em,

                    atualizado_em

                FROM odds

                WHERE partida_id = $1

                ORDER BY odd DESC
                `,
                [
                    jogoId
                ]
            );


        return resultado.rows || [];

    }

    catch (error) {

        console.error(
            "❌ Erro buscar odds:",
            error.message
        );

        return [];

    }

}


// ==========================================
// BUSCAR ODDS POR PARTIDA_ID
// ==========================================

export async function buscarOddsPartida(
    partidaId
) {

    return await buscarOddsJogo(
        partidaId
    );

}


// ==========================================
// LISTAR TODAS AS ODDS
// ==========================================

export async function listarOdds() {

    try {

        const resultado =
            await query(
                `
                SELECT

                    id,

                    partida_id,

                    mercado,

                    selecao,

                    odd,

                    casa_aposta,

                    criado_em,

                    atualizado_em

                FROM odds

                ORDER BY criado_em DESC

                LIMIT 500
                `
            );


        return resultado.rows || [];

    }

    catch (error) {

        console.error(
            "❌ Erro listar odds:",
            error.message
        );

        return [];

    }

}


// ==========================================
// MELHORES ODDS
// ==========================================

export async function melhoresOdds() {

    try {

        const resultado =
            await query(
                `
                SELECT

                    id,

                    partida_id,

                    mercado,

                    selecao,

                    odd,

                    casa_aposta,

                    criado_em,

                    atualizado_em

                FROM odds

                WHERE odd IS NOT NULL

                ORDER BY odd DESC

                LIMIT 50
                `
            );


        return resultado.rows || [];

    }

    catch (error) {

        console.error(
            "❌ Erro melhores odds:",
            error.message
        );

        return [];

    }

}


// ==========================================
// ODDS DE UM MERCADO
// ==========================================

export async function listarOddsMercado(
    partidaId,
    mercado
) {

    try {

        if (
            !partidaId ||
            !mercado
        ) {

            return [];

        }


        const resultado =
            await query(
                `
                SELECT

                    id,

                    partida_id,

                    mercado,

                    selecao,

                    odd,

                    casa_aposta,

                    criado_em,

                    atualizado_em

                FROM odds

                WHERE partida_id = $1

                  AND mercado = $2

                ORDER BY odd DESC
                `,
                [

                    partidaId,

                    mercado

                ]
            );


        return resultado.rows || [];

    }

    catch (error) {

        console.error(
            "❌ Erro listar odds do mercado:",
            error.message
        );

        return [];

    }

}


// ==========================================
// REMOVER ODDS DE UMA PARTIDA
// ==========================================

export async function removerOddsPartida(
    partidaId
) {

    try {

        if (!partidaId) {

            return 0;

        }


        const resultado =
            await query(
                `
                DELETE FROM odds

                WHERE partida_id = $1

                RETURNING id
                `,
                [
                    partidaId
                ]
            );


        const quantidade =
            resultado.rowCount || 0;


        console.log(
            `🗑️ ${quantidade} odds removidas da partida ${partidaId}`
        );


        return quantidade;

    }

    catch (error) {

        console.error(
            "❌ Erro remover odds:",
            error.message
        );

        return 0;

    }

}


// ==========================================
// LIMPAR ODDS ANTIGAS
// ==========================================

export async function limparOddsAntigas() {

    try {

        const resultado =
            await query(
                `
                DELETE FROM odds

                WHERE criado_em <
                    NOW() - INTERVAL '30 days'

                RETURNING id
                `
            );


        const quantidade =
            resultado.rowCount || 0;


        console.log(
            `🧹 ${quantidade} odds antigas removidas`
        );


        return quantidade;

    }

    catch (error) {

        console.error(
            "❌ Erro limpar odds antigas:",
            error.message
        );

        return 0;

    }

}


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    salvarOdd,

    salvarOdds,

    buscarOddsJogo,

    buscarOddsPartida,

    listarOdds,

    melhoresOdds,

    listarOddsMercado,

    removerOddsPartida,

    limparOddsAntigas

};
