// =======================================
// BETVISION AI
// ai/analiseJogo.js
//
// COMPATIBILIDADE DO MOTOR DE IA
// =======================================
//
// O motor estatístico oficial está em:
//
// services/inteligenciaService.js
//
// Este arquivo NÃO calcula mais:
// - Math.random()
// - probabilidades fictícias
// - gols aleatórios
// - placares aleatórios
// - Value Bet baseado apenas na maior probabilidade
//
// Ele apenas encaminha a análise para
// o motor estatístico oficial.
// =======================================

"use strict";


// =======================================
// IMPORTAR MOTOR OFICIAL
// =======================================

import {
    gerarAnaliseIA,
    analisarMercado,
    calcularXG,
    calcularProbabilidades,
    calcularPlacar,
    calcularConfianca,
    calcularValueBet,
    gerarValueBet,
    listarAnalises,
    estatisticasAnalises
} from "../services/inteligenciaService.js";


// =======================================
// ANALISAR JOGO
// =======================================
//
// Compatibilidade com chamadas antigas:
//
// analisarJogo(jogo)
//
// ou:
//
// analisarJogo(jogo, dados)
//
// A análise real é feita pelo
// inteligenciaService.
// =======================================

export async function analisarJogo(
    jogo,
    dados = {}
) {

    if (!jogo) {

        throw new Error(
            "Jogo é obrigatório para análise"
        );

    }


    console.log(
        "🤖 BetVision AI:",
        "encaminhando análise para",
        "inteligenciaService.js"
    );


    const resultado =
        await gerarAnaliseIA(
            jogo,
            dados
        );


    if (!resultado) {

        return null;

    }


    return resultado;

}


// =======================================
// ANALISAR MERCADO
// =======================================

export {
    analisarMercado
};


// =======================================
// FUNÇÕES DO MOTOR OFICIAL
// =======================================

export {

    calcularXG,

    calcularProbabilidades,

    calcularPlacar,

    calcularConfianca,

    calcularValueBet,

    gerarValueBet,

    listarAnalises,

    estatisticasAnalises

};


// =======================================
// EXPORT DEFAULT
// =======================================

export default {

    analisarJogo,

    analisarMercado,

    calcularXG,

    calcularProbabilidades,

    calcularPlacar,

    calcularConfianca,

    calcularValueBet,

    gerarValueBet,

    listarAnalises,

    estatisticasAnalises

};
