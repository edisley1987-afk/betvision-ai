// ==========================================================
// BETVISION AI
// routes/inteligencia.js
//
// VERSÃO 2.1 - CORRIGIDA
//
// CORREÇÕES NESTA VERSÃO:
// - POST /analisar agora SALVA a análise no banco (antes
//   só retornava o resultado sem persistir nada)
// - Usa jogo_id/api_id para JOIN, mesma lógica validada
//   em routes/analises.js
// - Extratores ajustados ao formato real de
//   ai/analiseJogo.js (v6.1):
//   - resultado.jogo = { id, casa, fora } — SEM campo "nome"
//   - resultado.valueBet = { encontrada, melhor, oportunidades }
//     (objeto, NÃO array/boolean — bug corrigido: antes
//     Boolean(objeto) era sempre true, mesmo com
//     encontrada: false)
//   - resultado.confianca = string "Alta"/"Média"/"Baixa"
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
// Aceita { jogo: {...} } ou o objeto direto no body.
// Preserva o body original (req.body) intacto para
// passar pra analisarJogo(), que tem seu próprio parser
// (normalizarJogo) mais flexível ainda.
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
            jogo.timeCasa ??
            jogo.home_team ??
            jogo.homeTeam ??
            jogo.home ??
            null;


        const fora =
            jogo.time_fora ??
            jogo.fora ??
            jogo.timeFora ??
            jogo.away_team ??
            jogo.awayTeam ??
            jogo.away ??
            null;


        return {

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
// EXTRAIR NOME DO JOGO
//
// Prioriza resultado.jogo.casa/fora (nomes já resolvidos
// pelo motor, com fallback "Casa"/"Fora" quando ausentes),
// depois os nomes que o cliente enviou.
// ==========================================================

function extrairNomeJogo(resultado, jogoNormalizado) {

    const casa =
        resultado?.jogo?.casa ??
        jogoNormalizado?.time_casa ??
        "Casa";


    const fora =
        resultado?.jogo?.fora ??
        jogoNormalizado?.time_fora ??
        "Fora";


    return `${casa} x ${fora}`.trim();
}


// ==========================================================
// EXTRAIR VALUE BET
//
// resultado.valueBet é OBJETO: { encontrada, melhor,
// oportunidades }. NÃO é array nem boolean.
// ==========================================================

function extrairValueBet(resultado) {

    return Boolean(
        resultado?.valueBet?.encontrada
    );
}


// ==========================================================
// PREPARAR ANÁLISE PARA BANCO
// ==========================================================

function prepararAnaliseParaBanco(
    resultado,
    jogoNormalizado
) {

    if (!resultado) {

        console.warn(
            "⚠️ [inteligencia] Resultado vazio, nada para salvar."
        );

        return null;
    }


    const nomeJogo =
        extrairNomeJogo(
            resultado,
            jogoNormalizado
        );


    return {

        jogo:
            nomeJogo,

        jogo_id:
            jogoNormalizado?.jogo_id ??
            resultado?.jogo?.id ??
            null,

        api_id:
            jogoNormalizado?.api_id ??
            null,

        time_casa:
            resultado?.jogo?.casa ??
            jogoNormalizado?.time_casa ??
            null,

        time_fora:
            resultado?.jogo?.fora ??
            jogoNormalizado?.time_fora ??
            null,

        data_jogo:
            obterDataHojeBrasil(),

        confianca:
            resultado?.confianca ??
            null,

        algoritmo:
            resultado?.algoritmo ??
            null,

        probabilidade_casa:
            resultado?.probabilidades?.casa ??
            null,

        probabilidade_empate:
            resultado?.probabilidades?.empate ??
            null,

        probabilidade_fora:
            resultado?.probabilidades?.fora ??
            null,

        gols_esperados:
            resultado?.golsEsperados?.total ??
            null,

        placar_previsto:
            resultado?.placarPrevisto ??
            null,

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

            const jogoNormalizado =
                normalizarJogoRecebido(
                    req.body
                );


            if (
                !jogoNormalizado ||
                (
                    !jogoNormalizado.time_casa &&
                    !jogoNormalizado.jogo
                )
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "Jogo obrigatório (time_casa/time_fora ou jogo_id)"
                });
            }


            console.log(
                `🤖 [inteligencia] Analisando: ${jogoNormalizado.time_casa ?? "?"} x ${jogoNormalizado.time_fora ?? "?"}`
            );


            // analisarJogo() tem seu próprio parser interno
            // (normalizarJogo), então passamos req.body direto
            // pra não perder nenhum campo (estatísticas, odds).
            const resultado =
                analisarJogo(
                    req.body?.jogo ??
                    req.body?.partida ??
                    req.body?.match ??
                    req.body
                );


            // ------------------------------------------------
            // SALVAR NO BANCO
            // ------------------------------------------------

            try {

                const paraSalvar =
                    prepararAnaliseParaBanco(
                        resultado,
                        jogoNormalizado
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
