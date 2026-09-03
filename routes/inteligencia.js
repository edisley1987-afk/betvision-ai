// ==========================================================
// BETVISION AI
// routes/inteligencia.js
//
// VERSÃO 2.0 - CORRIGIDA
//
// CORREÇÃO PRINCIPAL:
// - POST /analisar agora SALVA a análise no banco (antes
//   só retornava o resultado sem persistir nada)
// - Usa a mesma lógica de jogo_id/api_id já validada em
//   routes/analises.js, evitando o bug de JOIN por string
// ==========================================================

import express from "express";

import {
    analisarJogo
} from "../ai/analiseJogo.js";

import {
    salvarAnalise
} from "../services/bancoService.js";

const router = express.Router();


// ==========================================================
// CONFIGURAÇÃO
// ==========================================================

const TIMEZONE = "America/Sao_Paulo";


// ==========================================================
// DATA HOJE BRASIL
// ==========================================================

function obterDataHojeBrasil() {

    try {

        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: TIMEZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(new Date());

    } catch (erro) {

        console.error(
            "❌ Erro obtendo data Brasil:",
            erro.message
        );

        return new Date()
            .toISOString()
            .slice(0, 10);
    }
}


// ==========================================================
// NORMALIZAR ID
// ==========================================================

function normalizarId(valor) {

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


// ==========================================================
// NORMALIZAR JOGO RECEBIDO
//
// Aceita tanto { jogo: {...} } quanto o objeto direto no
// body, igual routes/analises.js.
// ==========================================================

function normalizarJogoRecebido(body) {

    if (!body) {
        return null;
    }


    const jogo =
        body.jogo ??
        body.partida ??
        body.match ??
        body;


    if (
        typeof jogo === "string"
    ) {

        if (!jogo.trim()) {
            return null;
        }

        return {
            jogo: jogo.trim()
        };
    }


    if (
        jogo &&
        typeof jogo === "object"
    ) {

        const casa =
            jogo.time_casa ??
            jogo.casa ??
            jogo.home_team ??
            jogo.homeTeam ??
            jogo.home ??
            jogo.fixture?.teams?.home?.name ??
            null;


        const fora =
            jogo.time_fora ??
            jogo.fora ??
            jogo.away_team ??
            jogo.awayTeam ??
            jogo.away ??
            jogo.fixture?.teams?.away?.name ??
            null;


        return {

            ...jogo,

            time_casa:
                casa
                    ? String(casa).trim()
                    : null,

            time_fora:
                fora
                    ? String(fora).trim()
                    : null,

            jogo_id:
                normalizarId(
                    jogo.jogo_id ??
                    jogo.jogoId ??
                    jogo.id
                ),

            api_id:
                normalizarId(
                    jogo.api_id ??
                    jogo.apiId ??
                    jogo.fixture?.id
                )
        };
    }


    return null;
}


// ==========================================================
// EXTRAIR PROBABILIDADES
//
// Tolerante a diferentes formatos de retorno de
// ai/analiseJogo.js. Ajustar aqui se o shape real for
// diferente do assumido.
// ==========================================================

function extrairProbabilidades(resultado) {

    const p =
        resultado?.probabilidades ??
        resultado?.probabilities ??
        {};


    return {

        casa:
            p.casa ??
            p.home ??
            p.vitoriaCasa ??
            null,

        empate:
            p.empate ??
            p.draw ??
            null,

        fora:
            p.fora ??
            p.away ??
            p.vitoriaFora ??
            null
    };
}


// ==========================================================
// EXTRAIR GOLS ESPERADOS
// ==========================================================

function extrairGolsEsperados(resultado) {

    const g =
        resultado?.golsEsperados ??
        resultado?.expectedGoals ??
        resultado?.xg ??
        {};


    if (typeof g === "number") {

        return g;
    }


    if (
        g.total !== undefined &&
        g.total !== null
    ) {

        return Number(g.total);
    }


    const casa =
        Number(g.casa ?? g.home ?? 0);

    const fora =
        Number(g.fora ?? g.away ?? 0);


    return casa + fora;
}


// ==========================================================
// EXTRAIR PLACAR PREVISTO
// ==========================================================

function extrairPlacarPrevisto(resultado) {

    const placar =
        resultado?.placarPrevisto ??
        resultado?.predictedScore ??
        resultado?.placar ??
        null;


    if (!placar) {
        return null;
    }


    if (typeof placar === "string") {
        return placar;
    }


    try {

        return JSON.stringify(placar);

    } catch {

        return null;
    }
}


// ==========================================================
// EXTRAIR CONFIANÇA
// ==========================================================

function extrairConfianca(resultado) {

    const valor =
        resultado?.confianca?.percentual ??
        resultado?.confianca?.valor ??
        resultado?.confianca ??
        resultado?.confidence ??
        null;


    if (
        valor === null ||
        valor === undefined
    ) {

        return null;
    }


    return String(valor);
}


// ==========================================================
// EXTRAIR ALGORITMO
// ==========================================================

function extrairAlgoritmo(resultado) {

    return (
        resultado?.algoritmo ??
        resultado?.modelo ??
        resultado?.model ??
        "ai/analiseJogo.js"
    );
}


// ==========================================================
// EXTRAIR VALUE BET
// ==========================================================

function extrairValueBet(resultado) {

    const valor =
        resultado?.valueBets ??
        resultado?.valueBet ??
        false;


    if (Array.isArray(valor)) {

        return valor.length > 0;
    }


    if (typeof valor === "boolean") {

        return valor;
    }


    return Boolean(valor);
}


// ==========================================================
// PREPARAR ANÁLISE PARA BANCO
// ==========================================================

function prepararAnaliseParaBanco(
    resultado,
    jogo
) {

    const nomeJogo =
        resultado?.jogo?.nome ??
        (
            jogo.time_casa && jogo.time_fora
                ? `${jogo.time_casa} x ${jogo.time_fora}`
                : jogo.jogo
        );


    if (!nomeJogo) {

        console.warn(
            "⚠️ Não foi possível determinar o nome do jogo para salvar."
        );

        return null;
    }


    const probabilidades =
        extrairProbabilidades(
            resultado
        );


    return {

        jogo:
            String(nomeJogo).trim(),

        jogo_id:
            jogo.jogo_id ??
            null,

        api_id:
            jogo.api_id ??
            null,

        time_casa:
            jogo.time_casa ??
            null,

        time_fora:
            jogo.time_fora ??
            null,

        data_jogo:
            obterDataHojeBrasil(),

        confianca:
            extrairConfianca(
                resultado
            ),

        algoritmo:
            extrairAlgoritmo(
                resultado
            ),

        probabilidade_casa:
            probabilidades.casa,

        probabilidade_empate:
            probabilidades.empate,

        probabilidade_fora:
            probabilidades.fora,

        gols_esperados:
            extrairGolsEsperados(
                resultado
            ),

        placar_previsto:
            extrairPlacarPrevisto(
                resultado
            ),

        value_bet:
            extrairValueBet(
                resultado
            )
    };
}


// ==========================================================
// POST /analisar
// ==========================================================

router.post(
    "/analisar",
    async (req, res) => {

        try {

            const jogo =
                normalizarJogoRecebido(
                    req.body
                );


            if (
                !jogo ||
                (
                    !jogo.time_casa &&
                    !jogo.jogo
                )
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "Jogo obrigatório (time_casa/time_fora ou jogo_id)"
                });
            }


            console.log(
                `🤖 [inteligencia] Analisando: ${jogo.time_casa ?? jogo.jogo} x ${jogo.time_fora ?? ""}`
            );


            const resultado =
                analisarJogo(
                    req.body
                );


            // ------------------------------------------------
            // SALVAR NO BANCO
            // ------------------------------------------------

            try {

                const paraSalvar =
                    prepararAnaliseParaBanco(
                        resultado,
                        jogo
                    );


                if (paraSalvar) {

                    const salva =
                        await salvarAnalise(
                            paraSalvar
                        );


                    if (salva) {

                        resultado.id =
                            salva.id;

                        resultado.jogo_id =
                            salva.jogo_id;

                        resultado.data_jogo =
                            paraSalvar.data_jogo;

                        console.log(
                            `✅ [inteligencia] Análise salva: ID ${salva.id}`
                        );
                    }

                } else {

                    console.warn(
                        "⚠️ [inteligencia] Análise não pôde ser preparada para salvar (sem nome de jogo)."
                    );
                }

            } catch (erroBanco) {

                console.error(
                    "⚠️ [inteligencia] Banco não conseguiu salvar análise:",
                    erroBanco.message
                );

                // NÃO derruba a resposta.
            }


            return res.json(
                resultado
            );

        } catch (erro) {

            console.error(
                "❌ [inteligencia] Erro ao analisar jogo:",
                erro.message
            );


            return res.status(500).json({

                sucesso: false,

                erro:
                    erro.message ||
                    "Erro ao analisar jogo"
            });
        }
    }
);


// ==========================================================
// EXPORT
// ==========================================================

export default router;
