// =======================================
// BETVISION AI
// ai/analiseJogo.js
//
// MOTOR DE ENTRADA DA ANÁLISE
//
// IMPORTANTE:
// Este arquivo NÃO calcula mais probabilidades
// aleatórias.
//
// Todo cálculo estatístico real é delegado para:
//
// services/inteligenciaService.js
//
// Recursos utilizados:
//
// - XG
// - Poisson
// - forma recente
// - gols marcados
// - gols sofridos
// - mando de campo
// - H2H com peso controlado
// - placar previsto
// - confiança
// - Value Bet
// - PostgreSQL / NeonDB
//
// =======================================

import {
    calcularXG,
    calcularProbabilidades,
    calcularPlacar,
    calcularConfianca,
    calcularValueBet
} from "../services/inteligenciaService.js";


// =======================================
// CONVERTER NÚMERO COM SEGURANÇA
// =======================================

function numeroSeguro(valor, padrao = 0) {

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : padrao;

}


// =======================================
// PEGAR PRIMEIRO VALOR VÁLIDO
// =======================================

function primeiroValor(...valores) {

    for (const valor of valores) {

        if (
            valor !== undefined &&
            valor !== null &&
            valor !== ""
        ) {

            return valor;

        }

    }

    return undefined;

}


// =======================================
// NORMALIZAR NOME DO TIME
// =======================================

function obterNomeTime(jogo, lado) {

    if (!jogo || typeof jogo !== "object") {

        return null;

    }

    if (lado === "casa") {

        return primeiroValor(

            jogo.time_casa,

            jogo.timeCasa,

            jogo.casa,

            jogo.homeTeam?.name,

            jogo.home_team?.name,

            jogo.home?.name,

            jogo.home?.team?.name

        );

    }


    return primeiroValor(

        jogo.time_fora,

        jogo.timeFora,

        jogo.fora,

        jogo.awayTeam?.name,

        jogo.away_team?.name,

        jogo.away?.name,

        jogo.away?.team?.name

    );

}


// =======================================
// OBTER API ID
// =======================================

function obterApiId(jogo) {

    if (!jogo || typeof jogo !== "object") {

        return null;

    }

    const valor = primeiroValor(

        jogo.api_id,

        jogo.apiId,

        jogo.fixture_id,

        jogo.fixtureId,

        jogo.id_api,

        jogo.external_id

    );


    const numero = Number(valor);


    if (
        !Number.isInteger(numero) ||
        numero <= 0
    ) {

        return null;

    }


    return numero;

}


// =======================================
// EXTRAIR ESTATÍSTICAS DO JOGO
//
// O frontend/API pode entregar os dados
// em estruturas diferentes.
//
// Este adaptador tenta aproveitar todas.
// =======================================

function extrairDadosDoJogo(jogo = {}) {

    const estatisticas =
        jogo.estatisticas ??
        jogo.estatisticasJogo ??
        jogo.statistics ??
        jogo.stats ??
        {};


    const historico =
        jogo.historico ??
        jogo.historicoTimes ??
        jogo.history ??
        {};


    const casa =
        historico.casa ??
        historico.home ??
        estatisticas.casa ??
        estatisticas.home ??
        {};


    const fora =
        historico.fora ??
        historico.away ??
        estatisticas.fora ??
        estatisticas.away ??
        {};


    const h2h =
        jogo.h2h ??
        jogo.H2H ??
        estatisticas.h2h ??
        estatisticas.H2H ??
        {};


    const dados = {

        // ==================================
        // ATAQUE
        // ==================================

        ataqueCasa:

            primeiroValor(

                jogo.ataqueCasa,

                jogo.forcaAtaqueCasa,

                jogo.mediaAtaqueCasa,

                casa.ataque,

                casa.forcaAtaque,

                casa.mediaAtaque

            ),


        ataqueFora:

            primeiroValor(

                jogo.ataqueFora,

                jogo.forcaAtaqueFora,

                jogo.mediaAtaqueFora,

                fora.ataque,

                fora.forcaAtaque,

                fora.mediaAtaque

            ),


        // ==================================
        // DEFESA
        // ==================================

        defesaCasa:

            primeiroValor(

                jogo.defesaCasa,

                jogo.forcaDefesaCasa,

                jogo.mediaDefesaCasa,

                casa.defesa,

                casa.forcaDefesa,

                casa.mediaDefesa

            ),


        defesaFora:

            primeiroValor(

                jogo.defesaFora,

                jogo.forcaDefesaFora,

                jogo.mediaDefesaFora,

                fora.defesa,

                fora.forcaDefesa,

                fora.mediaDefesa

            ),


        // ==================================
        // FORMA
        // ==================================

        formaCasa:

            primeiroValor(

                jogo.formaCasa,

                jogo.percentualFormaCasa,

                jogo.formaCasaPercentual,

                casa.forma,

                casa.percentualForma,

                casa.formaPercentual

            ),


        formaFora:

            primeiroValor(

                jogo.formaFora,

                jogo.percentualFormaFora,

                jogo.formaForaPercentual,

                fora.forma,

                fora.percentualForma,

                fora.formaPercentual

            ),


        // ==================================
        // GOLS MARCADOS
        // ==================================

        mediaGolsCasa:

            primeiroValor(

                jogo.mediaGolsCasa,

                jogo.golsCasa,
                
                jogo.mediaCasa,

                casa.mediaGols,

                casa.mediaGolsMarcados,

                casa.golsMarcados,

                casa.media

            ),


        mediaGolsFora:

            primeiroValor(

                jogo.mediaGolsFora,

                jogo.golsFora,

                jogo.mediaFora,

                fora.mediaGols,

                fora.mediaGolsMarcados,

                fora.golsMarcados,

                fora.media

            ),


        // ==================================
        // GOLS SOFRIDOS
        // ==================================

        mediaGolsSofridosCasa:

            primeiroValor(

                jogo.mediaGolsSofridosCasa,

                jogo.golsSofridosCasa,

                jogo.mediaSofridosCasa,

                casa.mediaGolsSofridos,

                casa.golsSofridos,

                casa.mediaSofridos

            ),


        mediaGolsSofridosFora:

            primeiroValor(

                jogo.mediaGolsSofridosFora,

                jogo.golsSofridosFora,

                jogo.mediaSofridosFora,

                fora.mediaGolsSofridos,

                fora.golsSofridos,

                fora.mediaSofridos

            ),


        // ==================================
        // HISTÓRICO
        // ==================================

        jogosCasa:

            primeiroValor(

                jogo.jogosCasa,

                jogo.historicoCasa,

                jogo.totalJogosCasa,

                casa.jogos,

                casa.totalJogos,

                casa.total

            ),


        jogosFora:

            primeiroValor(

                jogo.jogosFora,

                jogo.historicoFora,

                jogo.totalJogosFora,

                fora.jogos,

                fora.totalJogos,

                fora.total

            ),


        // ==================================
        // H2H
        // ==================================

        h2h,

        totalH2H:

            primeiroValor(

                jogo.totalH2H,

                jogo.confrontosH2H,

                h2h.total,

                h2h.totalConfrontos

            ),


        vitoriasCasaH2H:

            primeiroValor(

                jogo.vitoriasCasaH2H,

                jogo.h2hCasa,

                h2h.vitoriasCasa,

                h2h.casa

            ),


        empatesH2H:

            primeiroValor(

                jogo.empatesH2H,

                jogo.h2hEmpates,

                h2h.empates,

                h2h.draws

            ),


        vitoriasForaH2H:

            primeiroValor(

                jogo.vitoriasForaH2H,

                jogo.h2hFora,

                h2h.vitoriasFora,

                h2h.fora

            )

    };


    // ==================================
    // REMOVER PROPRIEDADES UNDEFINED
    // ==================================

    for (const chave of Object.keys(dados)) {

        if (
            dados[chave] === undefined
        ) {

            delete dados[chave];

        }

    }


    return dados;

}


// =======================================
// NORMALIZAR DADOS EXTERNOS
//
// Permite:
//
// analisarJogo(jogo)
//
// ou:
//
// analisarJogo(jogo, dados)
//
// =======================================

function normalizarDados(jogo, dados = {}) {

    const dadosDoJogo =
        extrairDadosDoJogo(jogo);


    return {

        ...dadosDoJogo,

        ...(dados || {})

    };

}


// =======================================
// VALIDAR JOGO
// =======================================

function validarJogo(jogo) {

    if (
        !jogo ||
        typeof jogo !== "object"
    ) {

        throw new Error(
            "Jogo inválido"
        );

    }


    const casa =
        obterNomeTime(
            jogo,
            "casa"
        );


    const fora =
        obterNomeTime(
            jogo,
            "fora"
        );


    if (
        !casa ||
        !fora
    ) {

        throw new Error(
            "Não foi possível identificar os times do jogo"
        );

    }


    const casaNormalizada =
        String(casa)
            .trim()
            .toLowerCase();


    const foraNormalizada =
        String(fora)
            .trim()
            .toLowerCase();


    if (
        casaNormalizada ===
        foraNormalizada
    ) {

        throw new Error(
            "Os times da casa e visitante são iguais"
        );

    }


    const nomesInvalidos = [

        "casa",
        "fora",
        "home",
        "away",
        "home team",
        "away team",
        "time a",
        "time b",
        "undefined",
        "null"

    ];


    if (
        nomesInvalidos.includes(
            casaNormalizada
        )
        ||
        nomesInvalidos.includes(
            foraNormalizada
        )
    ) {

        throw new Error(
            "Times fictícios ou de fallback"
        );

    }


    const apiId =
        obterApiId(
            jogo
        );


    return {

        apiId,

        casa:
            String(casa).trim(),

        fora:
            String(fora).trim()

    };

}


// =======================================
// ANALISAR JOGO
//
// Esta é a função principal usada pelo
// código antigo.
//
// NÃO USA RANDOM.
//
// NÃO GERA PROBABILIDADE ARTIFICIAL.
//
// Usa exclusivamente o motor estatístico
// central.
// =======================================

export function analisarJogo(
    jogo,
    dados = {}
) {

    const validacao =
        validarJogo(
            jogo
        );


    const dadosEstatisticos =
        normalizarDados(
            jogo,
            dados
        );


    console.log(
        "=========================================="
    );


    console.log(
        "🤖 BETVISION AI"
    );


    console.log(
        `⚽ ${validacao.casa} x ${validacao.fora}`
    );


    console.log(
        `🆔 API ID: ${validacao.apiId || "não informado"}`
    );


    console.log(
        "📊 Executando motor estatístico central..."
    );


    // ==================================
    // XG
    // ==================================

    const xg =
        calcularXG(
            dadosEstatisticos
        );


    // ==================================
    // PROBABILIDADES
    // ==================================

    const probabilidades =
        calcularProbabilidades(
            dadosEstatisticos
        );


    // ==================================
    // PLACAR
    // ==================================

    const placar =
        calcularPlacar(
            dadosEstatisticos
        );


    // ==================================
    // CONFIANÇA
    // ==================================

    const confianca =
        calcularConfianca(
            probabilidades
        );


    // ==================================
    // FAVORITO
    // ==================================

    let favorito =
        "Empate";


    if (
        probabilidades.casa >
        probabilidades.empate &&
        probabilidades.casa >
        probabilidades.fora
    ) {

        favorito =
            validacao.casa;

    }


    else if (
        probabilidades.fora >
        probabilidades.empate &&
        probabilidades.fora >
        probabilidades.casa
    ) {

        favorito =
            validacao.fora;

    }


    // ==================================
    // RESULTADO COMPATÍVEL COM
    // O SERVIÇO CENTRAL
    // ==================================

    const resultado = {

        api_id:
            validacao.apiId,

        jogo:
            `${validacao.casa} x ${validacao.fora}`,

        casa:
            validacao.casa,

        fora:
            validacao.fora,


        probabilidadeCasa:
            probabilidades.casa,

        probabilidadeEmpate:
            probabilidades.empate,

        probabilidadeFora:
            probabilidades.fora,


        // aliases compatíveis

        probabilidade_casa:
            probabilidades.casa,

        probabilidade_empate:
            probabilidades.empate,

        probabilidade_fora:
            probabilidades.fora,


        golsEsperados:
            Number(
                (
                    xg.casa +
                    xg.fora
                ).toFixed(2)
            ),


        golsEsperadosCasa:
            xg.casa,

        golsEsperadosFora:
            xg.fora,


        placarPrevisto:
            `${placar.casa}x${placar.fora}`,

        placar_previsto:
            `${placar.casa}x${placar.fora}`,


        favorito,


        confianca,


        valueBet:
            false,


        algoritmo:
            "BetVision Statistical AI v10.0"

    };


    // ==================================
    // LOG
    // ==================================

    console.log(
        `🏠 Casa: ${resultado.probabilidadeCasa}%`
    );


    console.log(
        `🤝 Empate: ${resultado.probabilidadeEmpate}%`
    );


    console.log(
        `✈️ Fora: ${resultado.probabilidadeFora}%`
    );


    console.log(
        `⚽ XG: ${xg.casa} x ${xg.fora}`
    );


    console.log(
        `🎯 Placar: ${resultado.placarPrevisto}`
    );


    console.log(
        `🏆 Favorito: ${favorito}`
    );


    console.log(
        `🎯 Confiança: ${confianca}`
    );


    console.log(
        "=========================================="
    );


    return resultado;

}


// =======================================
// ANALISAR JOGO + VALUE BET
//
// Função auxiliar para quem já possui
// odd e mercado.
// =======================================

export function analisarJogoComOdd(
    jogo,
    dados = {},
    mercado = null,
    odd = null
) {

    const analise =
        analisarJogo(
            jogo,
            dados
        );


    if (
        !mercado ||
        !Number.isFinite(
            Number(odd)
        )
    ) {

        return analise;

    }


    let probabilidade;


    const mercadoNormalizado =
        String(mercado)
            .toLowerCase()
            .trim();


    if (
        mercadoNormalizado === "casa" ||
        mercadoNormalizado === "home" ||
        mercadoNormalizado === "1"
    ) {

        probabilidade =
            analise.probabilidadeCasa;

    }


    else if (
        mercadoNormalizado === "empate" ||
        mercadoNormalizado === "draw" ||
        mercadoNormalizado === "x"
    ) {

        probabilidade =
            analise.probabilidadeEmpate;

    }


    else if (
        mercadoNormalizado === "fora" ||
        mercadoNormalizado === "away" ||
        mercadoNormalizado === "2"
    ) {

        probabilidade =
            analise.probabilidadeFora;

    }


    else {

        return {

            ...analise,

            valueBet:
                false

        };

    }


    const resultadoValueBet =
        calcularValueBet(
            odd,
            probabilidade
        );


    return {

        ...analise,

        valueBet:
            resultadoValueBet.possui,

        valueBetDetalhes: {

            mercado,

            odd:
                Number(odd),

            probabilidade:
                Number(probabilidade),

            valorEsperado:
                resultadoValueBet.valor,

            possui:
                resultadoValueBet.possui

        }

    };

}


// =======================================
// EXPORT DEFAULT
// =======================================

export default {

    analisarJogo,

    analisarJogoComOdd

};
