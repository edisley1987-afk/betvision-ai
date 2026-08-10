// ==========================================
// BetVision AI
// services/valueBetService.js
// Versão 7.1
// Motor Value Bets + Odds Reais
// PostgreSQL NeonDB
//
// Tabela oficial:
// value_bets
// ==========================================

import {
    query
} from "../database/database.js";

import {
    listarAnalises
} from "./inteligenciaService.js";

import {
    buscarOddsJogo
} from "./oddsService.js";


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const EDGE_MINIMO = 5;

const ODD_MINIMA = 1.30;

const ODD_MAXIMA = 8.00;


// ==========================================
// NORMALIZAÇÃO NUMÉRICA
// ==========================================

function numero(valor) {

    const n = Number(valor);

    return Number.isFinite(n)
        ? n
        : 0;

}


// ==========================================
// ODD JUSTA
// ==========================================

function calcularOddJusta(probabilidade) {

    if (
        probabilidade <= 0
    ) {
        return 0;
    }

    return Number(
        (
            100 / probabilidade
        ).toFixed(2)
    );

}


// ==========================================
// EDGE
// ==========================================

function calcularEdge(
    oddMercado,
    oddJusta
) {

    if (
        oddMercado <= 0 ||
        oddJusta <= 0
    ) {
        return 0;
    }

    return Number(
        (
            (
                oddMercado / oddJusta
            ) - 1
        ) * 100
    .toFixed(2));

}


// ==========================================
// ROI / VALOR ESPERADO
// ==========================================

function calcularROI(
    probabilidade,
    odd
) {

    if (
        probabilidade <= 0 ||
        odd <= 0
    ) {
        return 0;
    }

    const p =
        probabilidade / 100;

    return Number(
        (
            (
                p * odd
            ) - 1
        ) * 100
    .toFixed(2));

}


// ==========================================
// CLASSIFICAÇÃO
// ==========================================

function nivelValue(edge) {

    if (edge >= 20) {

        return "⭐⭐⭐⭐ Muito Boa";

    }

    if (edge >= 10) {

        return "⭐⭐⭐ Boa";

    }

    if (edge >= 5) {

        return "⭐⭐ Moderada";

    }

    return "Sem Valor";

}


// ==========================================
// KELLY
// ==========================================

function calcularKelly(
    probabilidade,
    odd
) {

    const p =
        probabilidade / 100;

    const q =
        1 - p;

    const b =
        odd - 1;

    if (b <= 0) {

        return 0;

    }

    let kelly =
        (
            (b * p) - q
        ) / b;

    if (kelly < 0) {

        kelly = 0;

    }

    // Proteção da banca
    // Máximo de 10%

    if (kelly > 0.10) {

        kelly = 0.10;

    }

    return Number(
        (
            kelly * 100
        ).toFixed(2)
    );

}


// ==========================================
// EXTRAIR TIMES DO JOGO
// ==========================================

function extrairTimes(jogo) {

    if (
        !jogo ||
        typeof jogo !== "string"
    ) {

        return {

            casa: "Casa",

            fora: "Fora"

        };

    }

    const partes =
        jogo.split(/\s+x\s+/i);

    return {

        casa:
            partes[0]?.trim() ||
            "Casa",

        fora:
            partes[1]?.trim() ||
            "Fora"

    };

}


// ==========================================
// BUSCAR ODDS COM SEGURANÇA
// ==========================================

async function buscarOddsComSeguranca(
    jogoId
) {

    if (!jogoId) {

        return [];

    }

    try {

        const odds =
            await buscarOddsJogo(
                jogoId
            );

        return Array.isArray(odds)
            ? odds
            : [];

    }

    catch (erro) {

        console.error(
            `⚠️ Erro ao buscar odds do jogo ${jogoId}:`,
            erro.message
        );

        return [];

    }

}


// ==========================================
// CALCULAR VALUE BETS
// Odds reais + IA
// ==========================================

export async function calcularValueBets() {

    try {

        console.log(
            "💎 Calculando Value Bets..."
        );


        // ======================================
        // BUSCAR ANÁLISES IA
        // ======================================

        const analises =
            await listarAnalises();


        if (
            !Array.isArray(analises) ||
            analises.length === 0
        ) {

            console.log(
                "⚠️ Nenhuma análise IA encontrada"
            );

            return [];

        }


        const resultados = [];


        // ======================================
        // PROCESSAR ANÁLISES
        // ======================================

        for (
            const analise of analises
        ) {

            const probCasa =
                numero(
                    analise.probabilidade_casa
                );

            const probFora =
                numero(
                    analise.probabilidade_fora
                );


            // ==================================
            // VALIDAR PROBABILIDADES
            // ==================================

            if (
                probCasa <= 0 &&
                probFora <= 0
            ) {

                continue;

            }


            let probabilidade;

            let mercado;

            let selecao;


            // ==================================
            // IDENTIFICAR MELHOR SELEÇÃO
            // ==================================

            const times =
                extrairTimes(
                    analise.jogo
                );


            if (
                probCasa >= probFora
            ) {

                mercado =
                    "Vitória Casa";

                selecao =
                    times.casa;

                probabilidade =
                    probCasa;

            }

            else {

                mercado =
                    "Vitória Fora";

                selecao =
                    times.fora;

                probabilidade =
                    probFora;

            }


            // ==================================
            // VALIDAR PROBABILIDADE
            // ==================================

            if (
                probabilidade <= 0 ||
                probabilidade > 100
            ) {

                continue;

            }


            // ==================================
            // ODD JUSTA
            // ==================================

            const oddJusta =
                calcularOddJusta(
                    probabilidade
                );


            if (
                oddJusta <= 0
            ) {

                continue;

            }


            // ==================================
            // ODDS REAIS
            // ==================================

            const odds =
                await buscarOddsComSeguranca(
                    analise.jogo_id
                );


            // ==================================
            // SEM ODDS = NÃO CRIAR VALUE BET
            // ==================================

            if (
                odds.length === 0
            ) {

                continue;

            }


            // ==================================
            // PROCESSAR ODDS
            // ==================================

            for (
                const odd of odds
            ) {

                const oddMercado =
                    numero(
                        odd?.odd
                    );


                // ==================================
                // VALIDAR ODD
                // ==================================

                if (
                    oddMercado < ODD_MINIMA ||
                    oddMercado > ODD_MAXIMA
                ) {

                    continue;

                }


                // ==================================
                // EDGE
                // ==================================

                const edge =
                    calcularEdge(
                        oddMercado,
                        oddJusta
                    );


                if (
                    edge < EDGE_MINIMO
                ) {

                    continue;

                }


                // ==================================
                // ROI
                // ==================================

                const roi =
                    calcularROI(
                        probabilidade,
                        oddMercado
                    );


                // ==================================
                // KELLY
                // ==================================

                const kelly =
                    calcularKelly(
                        probabilidade,
                        oddMercado
                    );


                // ==================================
                // RESULTADO
                // ==================================

                resultados.push({

                    jogo:
                        analise.jogo ||
                        `${times.casa} x ${times.fora}`,

                    jogo_id:
                        analise.jogo_id,

                    mercado,

                    selecao,

                    bookmaker:
                        odd?.bookmaker ||
                        "Não informado",

                    odd:
                        oddMercado,

                    oddMercado:
                        oddMercado,

                    oddJusta,

                    probabilidade,

                    edge,

                    roi,

                    kelly,

                    valueBet:
                        true,

                    classificacao:
                        nivelValue(
                            edge
                        ),

                    fonte:
                        odd?.bookmaker
                            ? "API Odds"
                            : "BetVision AI"

                });

            }

        }


        // ======================================
        // ORDENAR POR EDGE
        // ======================================

        resultados.sort(
            (a, b) =>
                Number(b.edge) -
                Number(a.edge)
        );


        console.log(
            `💎 ${resultados.length} Value Bets encontradas`
        );


        return resultados;

    }

    catch (error) {

        console.error(
            "❌ Erro Value Bets:",
            error.message
        );

        return [];

    }

}


// ==========================================
// COMPATIBILIDADE COM ROTAS ANTIGAS
// ==========================================

export async function gerarValueBets() {

    return await calcularValueBets();

}


// ==========================================
// SALVAR VALUE BETS
// TABELA OFICIAL: value_bets
// ==========================================

export async function salvarValueBets() {

    try {

        const valueBets =
            await calcularValueBets();


        if (
            !Array.isArray(valueBets) ||
            valueBets.length === 0
        ) {

            console.log(
                "💎 Nenhuma Value Bet para salvar"
            );

            return [];

        }


        const salvas = [];


        // ======================================
        // SALVAR CADA VALUE BET
        // ======================================

        for (
            const bet of valueBets
        ) {

            if (
                !bet.jogo_id
            ) {

                console.warn(
                    "⚠️ Value Bet sem jogo_id ignorada"
                );

                continue;

            }


            // ==================================
            // EVITAR DUPLICAÇÃO
            // ==================================

            const existente =
                await query(
                    `
                    SELECT id

                    FROM value_bets

                    WHERE jogo_id = $1

                      AND mercado = $2

                      AND selecao = $3

                      AND odd_mercado = $4

                      AND ativo = true

                    LIMIT 1
                    `,
                    [

                        bet.jogo_id,

                        bet.mercado,

                        bet.selecao,

                        bet.oddMercado

                    ]
                );


            if (
                existente.rows.length > 0
            ) {

                continue;

            }


            // ==================================
            // INSERIR VALUE BET
            // ==================================

            const resultado =
                await query(
                    `
                    INSERT INTO value_bets
                    (
                        jogo_id,
                        mercado,
                        selecao,
                        odd_mercado,
                        probabilidade,
                        valor_estimado,
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
                        true
                    )

                    RETURNING *
                    `,
                    [

                        bet.jogo_id,

                        bet.mercado,

                        bet.selecao,

                        bet.oddMercado,

                        bet.probabilidade,

                        bet.roi

                    ]
                );


            if (
                resultado.rows.length > 0
            ) {

                salvas.push(
                    resultado.rows[0]
                );

            }

        }


        console.log(
            `💎 ${salvas.length} novas Value Bets salvas`
        );


        return salvas;

    }

    catch (error) {

        console.error(
            "❌ Erro salvar Value Bets:",
            error.message
        );

        return [];

    }

}


// ==========================================
// LISTAR VALUE BETS
// TABELA OFICIAL: value_bets
// ==========================================

export async function listarValueBets() {

    try {

        const resultado =
            await query(
                `
                SELECT

                    vb.*,

                    j.time_casa,

                    j.time_fora,

                    j.data_jogo,

                    j.campeonato,

                    j.estadio,

                    j.status

                FROM value_bets vb

                LEFT JOIN jogos j
                    ON j.id = vb.jogo_id

                WHERE vb.ativo = true

                ORDER BY
                    vb.valor_estimado DESC

                LIMIT 100
                `
            );


        return (
            resultado.rows ||
            []
        );

    }

    catch (error) {

        console.error(
            "❌ Erro listar Value Bets:",
            error.message
        );

        return [];

    }

}


// ==========================================
// LIMPAR VALUE BETS ANTIGAS
// ==========================================

export async function limparValueBets() {

    try {

        const resultado =
            await query(
                `
                DELETE FROM value_bets

                WHERE criado_em <
                    NOW() - INTERVAL '30 days'

                RETURNING id
                `
            );


        console.log(
            `🧹 ${resultado.rowCount || 0} Value Bets antigas removidas`
        );


        return (
            resultado.rowCount ||
            0
        );

    }

    catch (error) {

        console.error(
            "❌ Erro limpar Value Bets:",
            error.message
        );

        return 0;

    }

}


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    calcularValueBets,

    gerarValueBets,

    salvarValueBets,

    listarValueBets,

    limparValueBets

};
