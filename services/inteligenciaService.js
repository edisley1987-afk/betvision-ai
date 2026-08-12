// ==================================================
// BETVISION AI
// services/inteligenciaService.js
//
// MOTOR DE INTELIGÊNCIA ESTATÍSTICA v10.0
//
// CORREÇÕES:
//
// - Histórico real utilizado na análise
// - Forma recente utilizada corretamente
// - Gols marcados utilizados corretamente
// - Gols sofridos utilizados corretamente
// - H2H interpretado corretamente
// - Compatibilidade com vários formatos de histórico
// - Probabilidades diferentes por jogo
// - XG individual por equipe
// - Mando de campo
// - Poisson
// - Confiança
// - Value Bet
// - Atualização pelo api_id
// - Proteção contra concorrência
// - Compatibilidade PostgreSQL / NeonDB
// - Somente análises de jogos de hoje
// - Sem reaproveitar análise antiga como resultado
// ==================================================

import {
    salvarAnalise,
    salvarValueBet,
    buscarAnalisePorApiId,
    buscarAnalisePorNome
} from "./bancoService.js";

import {
    query
} from "../database/database.js";


// ==================================================
// TRAVA DE PROCESSAMENTO
// ==================================================

const analisesEmProcessamento = new Set();


// ==================================================
// UTILITÁRIOS
// ==================================================

function numeroSeguro(valor, padrao = 0) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return padrao;
    }

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : padrao;
}


// ==================================================
// PRIMEIRO NÚMERO VÁLIDO
// ==================================================

function primeiroNumero(...valores) {

    for (const valor of valores) {

        if (
            valor === undefined ||
            valor === null ||
            valor === ""
        ) {
            continue;
        }

        const numero = Number(valor);

        if (Number.isFinite(numero)) {
            return numero;
        }
    }

    return null;
}


// ==================================================
// LIMITAR
// ==================================================

function limitar(
    valor,
    minimo = 0,
    maximo = 100
) {

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return minimo;
    }

    return Math.max(
        minimo,
        Math.min(
            maximo,
            numero
        )
    );
}


// ==================================================
// ARREDONDAR
// ==================================================

function arredondar(
    valor,
    casas = 2
) {

    return Number(
        Number(valor || 0).toFixed(casas)
    );
}


// ==================================================
// NORMALIZAR API ID
// ==================================================

function normalizarApiId(valor) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return null;
    }

    const numero = Number(valor);

    if (
        !Number.isInteger(numero) ||
        numero <= 0
    ) {
        return null;
    }

    return numero;
}


// ==================================================
// OBTER API ID
// ==================================================

function obterApiId(jogo) {

    if (
        !jogo ||
        typeof jogo !== "object"
    ) {
        return null;
    }

    return normalizarApiId(

        jogo.api_id ??
        jogo.apiId ??
        jogo.fixture_id ??
        jogo.fixtureId ??
        jogo.id_api ??
        jogo.external_id ??
        jogo.externalId

    );
}


// ==================================================
// OBTER NOME DO JOGO
// ==================================================

function obterNomeJogo(jogo) {

    const nomeCasa =

        jogo?.time_casa ??
        jogo?.timeCasa ??
        jogo?.casa ??
        jogo?.home_team ??
        jogo?.homeTeam?.name ??
        jogo?.home_team?.name ??
        jogo?.home?.name ??
        jogo?.teams?.home?.name ??
        null;


    const nomeFora =

        jogo?.time_fora ??
        jogo?.timeFora ??
        jogo?.fora ??
        jogo?.away_team ??
        jogo?.awayTeam?.name ??
        jogo?.away_team?.name ??
        jogo?.away?.name ??
        jogo?.teams?.away?.name ??
        null;


    if (
        !nomeCasa ||
        !nomeFora
    ) {

        throw new Error(
            "Não foi possível identificar os times do jogo"
        );

    }


    const casa =
        String(nomeCasa).trim();


    const fora =
        String(nomeFora).trim();


    if (
        !casa ||
        !fora
    ) {

        throw new Error(
            "Nome dos times inválido"
        );

    }


    return {

        nomeCasa: casa,

        nomeFora: fora,

        nomeJogo:
            `${casa} x ${fora}`

    };
}


// ==================================================
// VALIDAR JOGO
// ==================================================

function validarJogo(jogo) {

    if (!jogo) {

        return {
            valido: false,
            erro: "Jogo não informado"
        };

    }


    const apiId =
        obterApiId(jogo);


    if (!apiId) {

        return {
            valido: false,
            erro: "api_id inválido ou ausente"
        };

    }


    let nomes;

    try {

        nomes =
            obterNomeJogo(jogo);

    }

    catch (erro) {

        return {
            valido: false,
            erro: erro.message
        };

    }


    const casa =
        nomes.nomeCasa
            .toLowerCase()
            .trim();


    const fora =
        nomes.nomeFora
            .toLowerCase()
            .trim();


    const nomesInvalidos = [

        "casa",
        "fora",
        "time a",
        "time b",
        "time 1",
        "time 2",
        "home",
        "away",
        "home team",
        "away team",
        "undefined",
        "null"

    ];


    if (
        nomesInvalidos.includes(casa) ||
        nomesInvalidos.includes(fora)
    ) {

        return {
            valido: false,
            erro: "Times fictícios ou de fallback"
        };

    }


    if (casa === fora) {

        return {
            valido: false,
            erro: "Time da casa e visitante são iguais"
        };

    }


    return {
        valido: true,
        erro: null
    };
}


// ==================================================
// CONVERTER FORMA
//
// Aceita:
// 0-1
// 0-100
// percentual
// pontos
// ==================================================

function normalizarForma(valor, padrao = 50) {

    const numero =
        Number(valor);


    if (
        !Number.isFinite(numero)
    ) {

        return padrao;

    }


    // Forma em escala 0-1
    if (
        numero >= 0 &&
        numero <= 1
    ) {

        return numero * 100;

    }


    return limitar(
        numero,
        0,
        100
    );
}


// ==================================================
// EXTRAIR ESTATÍSTICAS
//
// Esta é a parte principal da correção.
//
// Aceita diferentes estruturas:
//
// dados.formaCasa
// dados.forma.casa
// dados.casa.forma
// dados.historicoCasa
// dados.historico.casa
// dados.historicoCasa.jogos
// dados.timeCasa.jogos
// etc.
// ==================================================

function extrairEstatisticas(dados = {}) {

    const casa =
        dados.casa ||
        dados.timeCasa ||
        dados.home ||
        dados.homeTeam ||
        dados.historico?.casa ||
        dados.historicoCasa ||
        {};


    const fora =
        dados.fora ||
        dados.timeFora ||
        dados.away ||
        dados.awayTeam ||
        dados.historico?.fora ||
        dados.historicoFora ||
        {};


    // ==================================================
    // JOGOS
    // ==================================================

    const jogosCasa =
        primeiroNumero(

            dados.jogosCasa,
            dados.totalJogosCasa,

            dados.historicoCasa?.jogos,
            dados.historicoCasa?.totalJogos,

            dados.historico?.casa?.jogos,
            dados.historico?.casa?.totalJogos,

            dados.formaCasa?.jogos,

            casa.jogos,
            casa.totalJogos,
            casa.partidas,
            casa.total

        );


    const jogosFora =
        primeiroNumero(

            dados.jogosFora,
            dados.totalJogosFora,

            dados.historicoFora?.jogos,
            dados.historicoFora?.totalJogos,

            dados.historico?.fora?.jogos,
            dados.historico?.fora?.totalJogos,

            dados.formaFora?.jogos,

            fora.jogos,
            fora.totalJogos,
            fora.partidas,
            fora.total

        );


    // ==================================================
    // GOLS MARCADOS
    // ==================================================

    const golsCasa =
        primeiroNumero(

            dados.golsCasa,
            dados.golsMarcadosCasa,
            dados.totalGolsCasa,

            dados.historicoCasa?.gols,
            dados.historicoCasa?.golsMarcados,
            dados.historicoCasa?.totalGols,

            dados.historico?.casa?.gols,
            dados.historico?.casa?.golsMarcados,

            casa.gols,
            casa.golsMarcados,
            casa.golsFeitos,
            casa.totalGols

        );


    const golsFora =
        primeiroNumero(

            dados.golsFora,
            dados.golsMarcadosFora,
            dados.totalGolsFora,

            dados.historicoFora?.gols,
            dados.historicoFora?.golsMarcados,
            dados.historicoFora?.totalGols,

            dados.historico?.fora?.gols,
            dados.historico?.fora?.golsMarcados,

            fora.gols,
            fora.golsMarcados,
            fora.golsFeitos,
            fora.totalGols

        );


    // ==================================================
    // GOLS SOFRIDOS
    // ==================================================

    const golsSofridosCasa =
        primeiroNumero(

            dados.golsSofridosCasa,
            dados.golsContraCasa,

            dados.historicoCasa?.golsSofridos,
            dados.historicoCasa?.golsContra,

            dados.historico?.casa?.golsSofridos,
            dados.historico?.casa?.golsContra,

            casa.golsSofridos,
            casa.golsContra,
            casa.golsRecebidos

        );


    const golsSofridosFora =
        primeiroNumero(

            dados.golsSofridosFora,
            dados.golsContraFora,

            dados.historicoFora?.golsSofridos,
            dados.historicoFora?.golsContra,

            dados.historico?.fora?.golsSofridos,
            dados.historico?.fora?.golsContra,

            fora.golsSofridos,
            fora.golsContra,
            fora.golsRecebidos

        );


    // ==================================================
    // MÉDIA DE GOLS
    // ==================================================

    let mediaGolsCasa =
        primeiroNumero(

            dados.mediaGolsCasa,
            dados.mediaCasa,

            dados.historicoCasa?.mediaGols,
            dados.historicoCasa?.mediaGolsMarcados,

            dados.historico?.casa?.mediaGols,

            casa.mediaGols,
            casa.mediaGolsMarcados

        );


    let mediaGolsFora =
        primeiroNumero(

            dados.mediaGolsFora,
            dados.mediaFora,

            dados.historicoFora?.mediaGols,
            dados.historicoFora?.mediaGolsMarcados,

            dados.historico?.fora?.mediaGols,

            fora.mediaGols,
            fora.mediaGolsMarcados

        );


    // ==================================================
    // CALCULAR MÉDIA A PARTIR DOS GOLS
    // ==================================================

    if (
        mediaGolsCasa === null &&
        golsCasa !== null &&
        jogosCasa > 0
    ) {

        mediaGolsCasa =
            golsCasa / jogosCasa;

    }


    if (
        mediaGolsFora === null &&
        golsFora !== null &&
        jogosFora > 0
    ) {

        mediaGolsFora =
            golsFora / jogosFora;

    }


    // ==================================================
    // MÉDIA DE GOLS SOFRIDOS
    // ==================================================

    let mediaSofridosCasa =
        primeiroNumero(

            dados.mediaGolsSofridosCasa,
            dados.mediaSofridosCasa,

            dados.historicoCasa?.mediaGolsSofridos,

            dados.historico?.casa?.mediaGolsSofridos,

            casa.mediaGolsSofridos

        );


    let mediaSofridosFora =
        primeiroNumero(

            dados.mediaGolsSofridosFora,
            dados.mediaSofridosFora,

            dados.historicoFora?.mediaGolsSofridos,

            dados.historico?.fora?.mediaGolsSofridos,

            fora.mediaGolsSofridos

        );


    if (
        mediaSofridosCasa === null &&
        golsSofridosCasa !== null &&
        jogosCasa > 0
    ) {

        mediaSofridosCasa =
            golsSofridosCasa / jogosCasa;

    }


    if (
        mediaSofridosFora === null &&
        golsSofridosFora !== null &&
        jogosFora > 0
    ) {

        mediaSofridosFora =
            golsSofridosFora / jogosFora;

    }


    // ==================================================
    // FORMA
    // ==================================================

    const formaCasaValor =
        primeiroNumero(

            dados.formaCasa,
            dados.percentualFormaCasa,
            dados.formaCasaPercentual,

            dados.historicoCasa?.forma,
            dados.historicoCasa?.percentualForma,

            dados.historico?.casa?.forma,
            dados.historico?.casa?.percentualForma,

            casa.forma,
            casa.percentualForma

        );


    const formaForaValor =
        primeiroNumero(

            dados.formaFora,
            dados.percentualFormaFora,
            dados.formaForaPercentual,

            dados.historicoFora?.forma,
            dados.historicoFora?.percentualForma,

            dados.historico?.fora?.forma,
            dados.historico?.fora?.percentualForma,

            fora.forma,
            fora.percentualForma

        );


    const formaCasa =
        normalizarForma(
            formaCasaValor,
            jogosCasa > 0 ? 0 : 50
        );


    const formaFora =
        normalizarForma(
            formaForaValor,
            jogosFora > 0 ? 0 : 50
        );


    // ==================================================
    // H2H
    // ==================================================

    let h2h =
        primeiroNumero(

            dados.h2h,
            dados.totalH2H,
            dados.confrontosH2H,
            dados.historicoH2H?.total,
            dados.historicoH2H?.jogos,
            dados.h2h?.total,
            dados.h2h?.jogos

        );


    let vitoriasCasaH2H =
        primeiroNumero(

            dados.vitoriasCasaH2H,
            dados.h2hCasa,
            dados.h2h?.casa?.vitorias,
            dados.h2h?.casa,
            dados.historicoH2H?.casa?.vitorias

        );


    let empatesH2H =
        primeiroNumero(

            dados.empatesH2H,
            dados.h2hEmpates,
            dados.h2h?.empates,
            dados.historicoH2H?.empates

        );


    let vitoriasForaH2H =
        primeiroNumero(

            dados.vitoriasForaH2H,
            dados.h2hFora,
            dados.h2h?.fora?.vitorias,
            dados.h2h?.fora,
            dados.historicoH2H?.fora?.vitorias

        );


    vitoriasCasaH2H =
        vitoriasCasaH2H ?? 0;


    empatesH2H =
        empatesH2H ?? 0;


    vitoriasForaH2H =
        vitoriasForaH2H ?? 0;


    const totalH2HCalculado =

        vitoriasCasaH2H +
        empatesH2H +
        vitoriasForaH2H;


    if (
        h2h === null &&
        totalH2HCalculado > 0
    ) {

        h2h =
            totalH2HCalculado;

    }


    h2h =
        h2h ?? 0;


    // ==================================================
    // ATAQUE
    // ==================================================

    const ataqueCasa =
        primeiroNumero(

            dados.ataqueCasa,
            dados.forcaAtaqueCasa,
            dados.mediaAtaqueCasa,

            casa.ataque,
            casa.forcaAtaque,

            mediaGolsCasa

        ) ?? 1;


    const ataqueFora =
        primeiroNumero(

            dados.ataqueFora,
            dados.forcaAtaqueFora,
            dados.mediaAtaqueFora,

            fora.ataque,
            fora.forcaAtaque,

            mediaGolsFora

        ) ?? 1;


    // ==================================================
    // DEFESA
    // ==================================================

    const defesaCasa =
        primeiroNumero(

            dados.defesaCasa,
            dados.forcaDefesaCasa,
            dados.mediaDefesaCasa,

            casa.defesa,
            casa.forcaDefesa,

            mediaSofridosCasa

        ) ?? 1;


    const defesaFora =
        primeiroNumero(

            dados.defesaFora,
            dados.forcaDefesaFora,
            dados.mediaDefesaFora,

            fora.defesa,
            fora.forcaDefesa,

            mediaSofridosFora

        ) ?? 1;


    return {

        ataqueCasa,
        ataqueFora,

        defesaCasa,
        defesaFora,

        formaCasa,
        formaFora,

        mediaGolsCasa:
            mediaGolsCasa ?? 1,

        mediaGolsFora:
            mediaGolsFora ?? 1,

        mediaSofridosCasa:
            mediaSofridosCasa ?? 1,

        mediaSofridosFora:
            mediaSofridosFora ?? 1,

        jogosCasa:
            jogosCasa ?? 0,

        jogosFora:
            jogosFora ?? 0,

        golsCasa:
            golsCasa ?? 0,

        golsFora:
            golsFora ?? 0,

        golsSofridosCasa:
            golsSofridosCasa ?? 0,

        golsSofridosFora:
            golsSofridosFora ?? 0,

        h2h,

        vitoriasCasaH2H,

        empatesH2H,

        vitoriasForaH2H

    };
}


// ==================================================
// XG
// ==================================================

export function calcularXG(dados = {}) {

    const estatisticas =
        extrairEstatisticas(
            dados
        );


    let {

        ataqueCasa,
        ataqueFora,

        defesaCasa,
        defesaFora,

        formaCasa,
        formaFora,

        mediaGolsCasa,
        mediaGolsFora,

        mediaSofridosCasa,
        mediaSofridosFora

    } = estatisticas;


    // ==================================================
    // PROTEÇÃO CONTRA ESCALA 0-100
    // ==================================================

    if (
        ataqueCasa > 10
    ) {

        ataqueCasa =
            ataqueCasa / 100;

    }


    if (
        ataqueFora > 10
    ) {

        ataqueFora =
            ataqueFora / 100;

    }


    if (
        defesaCasa > 10
    ) {

        defesaCasa =
            defesaCasa / 100;

    }


    if (
        defesaFora > 10
    ) {

        defesaFora =
            defesaFora / 100;

    }


    // ==================================================
    // BASE ESTATÍSTICA
    // ==================================================

    let xgCasa =

        (
            mediaGolsCasa *
            0.45
        )

        +

        (
            ataqueCasa *
            0.20
        )

        +

        (
            mediaSofridosFora *
            0.20
        )

        +

        (
            defesaFora *
            0.15
        );


    let xgFora =

        (
            mediaGolsFora *
            0.45
        )

        +

        (
            ataqueFora *
            0.20
        )

        +

        (
            mediaSofridosCasa *
            0.20
        )

        +

        (
            defesaCasa *
            0.15
        );


    // ==================================================
    // FORMA
    // ==================================================

    xgCasa *=

        0.90
        +

        (
            formaCasa /
            100 *
            0.25
        );


    xgFora *=

        0.90
        +

        (
            formaFora /
            100 *
            0.25
        );


    // ==================================================
    // MANDO
    // ==================================================

    xgCasa *= 1.10;

    xgFora *= 0.95;


    // ==================================================
    // LIMITES
    // ==================================================

    xgCasa =
        limitar(
            xgCasa,
            0.15,
            4.50
        );


    xgFora =
        limitar(
            xgFora,
            0.15,
            4.50
        );


    return {

        casa:
            arredondar(
                xgCasa,
                2
            ),

        fora:
            arredondar(
                xgFora,
                2
            )

    };
}


// ==================================================
// FATORIAL
// ==================================================

function fatorial(numero) {

    if (
        numero <= 1
    ) {
        return 1;
    }


    let resultado = 1;


    for (
        let i = 2;
        i <= numero;
        i++
    ) {

        resultado *= i;

    }


    return resultado;
}


// ==================================================
// POISSON
// ==================================================

function poisson(
    gols,
    lambda
) {

    if (
        lambda <= 0
    ) {
        return 0;
    }


    return (

        Math.exp(-lambda) *

        Math.pow(
            lambda,
            gols
        )

        /

        fatorial(gols)

    );
}


// ==================================================
// PROBABILIDADES POR XG
// ==================================================

function probabilidadesPorXG(
    xgCasa,
    xgFora
) {

    let probCasa = 0;

    let probEmpate = 0;

    let probFora = 0;


    for (
        let golsCasa = 0;
        golsCasa <= 10;
        golsCasa++
    ) {

        for (
            let golsFora = 0;
            golsFora <= 10;
            golsFora++
        ) {

            const prob =

                poisson(
                    golsCasa,
                    xgCasa
                )

                *

                poisson(
                    golsFora,
                    xgFora
                );


            if (
                golsCasa >
                golsFora
            ) {

                probCasa += prob;

            }

            else if (
                golsCasa ===
                golsFora
            ) {

                probEmpate += prob;

            }

            else {

                probFora += prob;

            }

        }

    }


    const total =

        probCasa +
        probEmpate +
        probFora;


    if (
        total <= 0
    ) {

        return {

            casa: 33.33,
            empate: 33.34,
            fora: 33.33

        };

    }


    return {

        casa:
            (
                probCasa /
                total
            ) * 100,

        empate:
            (
                probEmpate /
                total
            ) * 100,

        fora:
            (
                probFora /
                total
            ) * 100

    };
}


// ==================================================
// PROBABILIDADES
// ==================================================

export function calcularProbabilidades(
    dados = {}
) {

    const estatisticas =
        extrairEstatisticas(
            dados
        );


    const xg =
        calcularXG(
            dados
        );


    const poissonProb =
        probabilidadesPorXG(
            xg.casa,
            xg.fora
        );


    // ==================================================
    // FORMA
    // ==================================================

    const formaCasa =
        limitar(
            estatisticas.formaCasa,
            0,
            100
        );


    const formaFora =
        limitar(
            estatisticas.formaFora,
            0,
            100
        );


    const formaTotal =
        formaCasa +
        formaFora;


    let formaCasaProb =
        33.33;


    let formaForaProb =
        33.33;


    if (
        formaTotal > 0
    ) {

        formaCasaProb =
            (
                formaCasa /
                formaTotal
            ) * 70;


        formaForaProb =
            (
                formaFora /
                formaTotal
            ) * 70;

    }


    // ==================================================
    // H2H
    // ==================================================

    let h2hCasaScore =
        33.33;


    let h2hEmpateScore =
        33.34;


    let h2hForaScore =
        33.33;


    const totalH2H =

        estatisticas.vitoriasCasaH2H +
        estatisticas.empatesH2H +
        estatisticas.vitoriasForaH2H;


    if (
        totalH2H > 0
    ) {

        h2hCasaScore =

            (
                estatisticas.vitoriasCasaH2H /
                totalH2H
            ) * 100;


        h2hEmpateScore =

            (
                estatisticas.empatesH2H /
                totalH2H
            ) * 100;


        h2hForaScore =

            (
                estatisticas.vitoriasForaH2H /
                totalH2H
            ) * 100;

    }


    // ==================================================
    // EMPATE BASE
    // ==================================================

    const diferencaForma =

        Math.abs(
            formaCasa -
            formaFora
        );


    const empateForma =

        limitar(

            32 -
            (
                diferencaForma *
                0.10
            ),

            20,
            34

        );


    // ==================================================
    // PESOS DINÂMICOS
    //
    // Se não existe H2H real,
    // não damos 10% para um H2H fictício.
    // ==================================================

    let pesoXG =
        0.70;


    let pesoForma =
        0.30;


    let pesoH2H =
        0;


    if (
        totalH2H >= 2
    ) {

        pesoXG =
            0.65;

        pesoForma =
            0.25;

        pesoH2H =
            0.10;

    }


    // ==================================================
    // COMBINAÇÃO
    // ==================================================

    let casa =

        (
            poissonProb.casa *
            pesoXG
        )

        +

        (
            formaCasaProb *
            pesoForma
        )

        +

        (
            h2hCasaScore *
            pesoH2H
        );


    let fora =

        (
            poissonProb.fora *
            pesoXG
        )

        +

        (
            formaForaProb *
            pesoForma
        )

        +

        (
            h2hForaScore *
            pesoH2H
        );


    let empate =

        (
            poissonProb.empate *
            pesoXG
        )

        +

        (
            empateForma *
            pesoForma
        )

        +

        (
            h2hEmpateScore *
            pesoH2H
        );


    // ==================================================
    // MANDO
    // ==================================================

    casa *= 1.05;

    fora *= 0.97;


    // ==================================================
    // NORMALIZAR
    // ==================================================

    const total =
        casa +
        empate +
        fora;


    if (
        total <= 0
    ) {

        return {

            casa: 33.33,

            empate: 33.34,

            fora: 33.33,

            xgCasa:
                xg.casa,

            xgFora:
                xg.fora

        };

    }


    let casaFinal =
        (
            casa /
            total
        ) * 100;


    let empateFinal =
        (
            empate /
            total
        ) * 100;


    let foraFinal =
        (
            fora /
            total
        ) * 100;


    // ==================================================
    // LIMITES
    // ==================================================

    casaFinal =
        limitar(
            casaFinal,
            5,
            85
        );


    empateFinal =
        limitar(
            empateFinal,
            5,
            60
        );


    foraFinal =
        limitar(
            foraFinal,
            5,
            85
        );


    // ==================================================
    // NORMALIZAR NOVAMENTE
    // ==================================================

    const somaLimitada =

        casaFinal +
        empateFinal +
        foraFinal;


    casaFinal =
        (
            casaFinal /
            somaLimitada
        ) * 100;


    empateFinal =
        (
            empateFinal /
            somaLimitada
        ) * 100;


    foraFinal =
        (
            foraFinal /
            somaLimitada
        ) * 100;


    // ==================================================
    // ARREDONDAMENTO
    // ==================================================

    casaFinal =
        arredondar(
            casaFinal,
            2
        );


    empateFinal =
        arredondar(
            empateFinal,
            2
        );


    foraFinal =
        arredondar(
            foraFinal,
            2
        );


    // ==================================================
    // GARANTIR 100%
    // ==================================================

    const soma =

        casaFinal +
        empateFinal +
        foraFinal;


    const ajuste =

        arredondar(
            100 - soma,
            2
        );


    foraFinal =
        arredondar(
            foraFinal + ajuste,
            2
        );


    // ==================================================
    // LOG
    // ==================================================

    console.log(
        "📊 MODELO ESTATÍSTICO"
    );


    console.log(
        `   Casa: ${casaFinal}%`
    );


    console.log(
        `   Empate: ${empateFinal}%`
    );


    console.log(
        `   Fora: ${foraFinal}%`
    );


    console.log(
        `   XG Casa: ${xg.casa}`
    );


    console.log(
        `   XG Fora: ${xg.fora}`
    );


    console.log(
        `   Histórico Casa: ${estatisticas.jogosCasa}`
    );


    console.log(
        `   Histórico Fora: ${estatisticas.jogosFora}`
    );


    console.log(
        `   Gols Casa: ${estatisticas.golsCasa}`
    );


    console.log(
        `   Gols Fora: ${estatisticas.golsFora}`
    );


    console.log(
        `   H2H: ${estatisticas.h2h}`
    );


    return {

        casa:
            casaFinal,

        empate:
            empateFinal,

        fora:
            foraFinal,

        xgCasa:
            xg.casa,

        xgFora:
            xg.fora

    };
}


// ==================================================
// PLACAR PREVISTO
// ==================================================

export function calcularPlacar(
    dados = {}
) {

    const xg =
        calcularXG(
            dados
        );


    return {

        casa:
            Math.max(
                0,
                Math.round(
                    xg.casa
                )
            ),

        fora:
            Math.max(
                0,
                Math.round(
                    xg.fora
                )
            )

    };
}


// ==================================================
// CONFIANÇA
// ==================================================

export function calcularConfianca(
    probabilidades = {}
) {

    const maior =

        Math.max(

            Number(
                probabilidades.casa || 0
            ),

            Number(
                probabilidades.empate || 0
            ),

            Number(
                probabilidades.fora || 0
            )

        );


    if (
        maior >= 65
    ) {

        return "ALTA";

    }


    if (
        maior >= 50
    ) {

        return "MEDIA";

    }


    return "BAIXA";
}


// ==================================================
// BUSCAR ANÁLISE EXISTENTE
// ==================================================

async function buscarAnaliseExistente(
    nomeJogo,
    apiId
) {

    if (
        apiId
    ) {

        try {

            const existente =

                await buscarAnalisePorApiId(
                    apiId
                );


            if (
                existente
            ) {

                return existente;

            }

        }

        catch (erro) {

            console.error(
                "⚠️ Erro buscando análise por API ID:",
                erro.message
            );

        }

    }


    // ==================================================
    // SOMENTE ANÁLISES ANTIGAS SEM API_ID
    // ==================================================

    if (
        nomeJogo
    ) {

        try {

            const antiga =

                await buscarAnalisePorNome(
                    nomeJogo
                );


            if (
                antiga
            ) {

                return antiga;

            }

        }

        catch (erro) {

            console.error(
                "⚠️ Erro buscando análise antiga:",
                erro.message
            );

        }

    }


    return null;
}


// ==================================================
// ATUALIZAR ANÁLISE EXISTENTE
// ==================================================

async function atualizarAnaliseExistente(
    apiId,
    analise
) {

    if (
        !apiId
    ) {

        return null;

    }


    const resultado =

        await query(

            `

            UPDATE analises

            SET

                jogo =
                    $2,

                probabilidade_casa =
                    $3,

                probabilidade_empate =
                    $4,

                probabilidade_fora =
                    $5,

                gols_esperados =
                    $6,

                placar_previsto =
                    $7,

                value_bet =
                    $8,

                confianca =
                    $9,

                algoritmo =
                    $10,

                criado_em =
                    CURRENT_TIMESTAMP

            WHERE
                api_id = $1

            RETURNING *

            `,

            [

                apiId,

                analise.jogo,

                analise.probabilidade_casa,

                analise.probabilidade_empate,

                analise.probabilidade_fora,

                analise.gols_esperados,

                analise.placar_previsto,

                analise.value_bet ?? false,

                analise.confianca,

                analise.algoritmo

            ]

        );


    return (
        resultado.rows[0] ||
        null
    );
}


// ==================================================
// GERAR ANÁLISE IA
// ==================================================

export async function gerarAnaliseIA(
    jogo,
    dados = {}
) {

    if (!jogo) {

        throw new Error(
            "Jogo é obrigatório para gerar análise"
        );

    }


    const apiId =
        obterApiId(jogo);


    if (!apiId) {

        throw new Error(
            "api_id é obrigatório para gerar análise"
        );

    }


    const {

        nomeCasa,
        nomeFora,
        nomeJogo

    } = obterNomeJogo(jogo);


    const validacao =
        validarJogo(jogo);


    if (
        !validacao.valido
    ) {

        throw new Error(
            `Jogo inválido para análise: ${validacao.erro}`
        );

    }


    console.log(
        `🤖 Gerando análise inteligente: ${nomeJogo}`
    );


    console.log(
        `🤖 API ID: ${apiId}`
    );


    // ==================================================
    // TRAVA
    // ==================================================

    if (
        analisesEmProcessamento.has(apiId)
    ) {

        console.log(
            `⏳ API ${apiId} já está em processamento`
        );

        return null;

    }


    analisesEmProcessamento.add(apiId);


    console.log(
        `🔒 Trava ativada: API ${apiId}`
    );


    try {

        // ==================================================
        // ESTATÍSTICAS
        // ==================================================

        const estatisticas =
            extrairEstatisticas(
                dados
            );


        console.log(
            `📊 Dados recebidos para ${nomeJogo}`
        );


        console.log(
            `   Forma Casa: ${estatisticas.formaCasa.toFixed(2)}%`
        );


        console.log(
            `   Forma Fora: ${estatisticas.formaFora.toFixed(2)}%`
        );


        console.log(
            `   Gols Casa: ${estatisticas.golsCasa}`
        );


        console.log(
            `   Gols Fora: ${estatisticas.golsFora}`
        );


        console.log(
            `   Jogos Casa: ${estatisticas.jogosCasa}`
        );


        console.log(
            `   Jogos Fora: ${estatisticas.jogosFora}`
        );


        console.log(
            `   H2H: ${estatisticas.h2h}`
        );


        console.log(
            `   H2H Casa: ${estatisticas.vitoriasCasaH2H}`
        );


        console.log(
            `   H2H Empates: ${estatisticas.empatesH2H}`
        );


        console.log(
            `   H2H Fora: ${estatisticas.vitoriasForaH2H}`
        );


        // ==================================================
        // XG
        // ==================================================

        const xg =
            calcularXG(
                dados
            );


        // ==================================================
        // PROBABILIDADES
        // ==================================================

        const probabilidades =
            calcularProbabilidades(
                dados
            );


        // ==================================================
        // PLACAR
        // ==================================================

        const placar =
            calcularPlacar(
                dados
            );


        // ==================================================
        // GOLS ESPERADOS
        // ==================================================

        const golsEsperados =
            arredondar(

                xg.casa +
                xg.fora,

                2

            );


        // ==================================================
        // CONFIANÇA
        // ==================================================

        const confianca =
            calcularConfianca(
                probabilidades
            );


        console.log(
            "=========================================="
        );


        console.log(
            `🤖 ANÁLISE: ${nomeJogo}`
        );


        console.log(
            `🏠 Casa: ${probabilidades.casa}%`
        );


        console.log(
            `🤝 Empate: ${probabilidades.empate}%`
        );


        console.log(
            `✈️ Fora: ${probabilidades.fora}%`
        );


        console.log(
            `⚽ XG: ${xg.casa} x ${xg.fora}`
        );


        console.log(
            `🎯 Placar: ${placar.casa} x ${placar.fora}`
        );


        console.log(
            `📚 Histórico: ${
                (
                    estatisticas.jogosCasa > 0 ||
                    estatisticas.jogosFora > 0
                )
                    ? "SIM"
                    : "NÃO"
            }`
        );


        console.log(
            `⚔️ H2H: ${
                estatisticas.h2h > 0
                    ? "SIM"
                    : "NÃO"
            }`
        );


        console.log(
            `🎯 Confiança: ${confianca}`
        );


        console.log(
            "=========================================="
        );


        // ==================================================
        // OBJETO DA ANÁLISE
        // ==================================================

        const analise = {

            api_id:
                apiId,

            jogo:
                nomeJogo,

            probabilidade_casa:
                probabilidades.casa,

            probabilidade_empate:
                probabilidades.empate,

            probabilidade_fora:
                probabilidades.fora,

            gols_esperados:
                golsEsperados,

            placar_previsto:
                `${placar.casa}x${placar.fora}`,

            value_bet:
                false,

            confianca:
                confianca,

            algoritmo:
                "BetVision Statistical AI v10.0"

        };


        // ==================================================
        // VERIFICAR EXISTENTE
        // ==================================================

        const existente =

            await buscarAnaliseExistente(
                nomeJogo,
                apiId
            );


        // ==================================================
        // EXISTE PELO API_ID
        //
        // SEMPRE RECALCULA E ATUALIZA
        // ==================================================

        if (
            existente &&
            Number(existente.api_id) ===
            Number(apiId)
        ) {

            console.log(
                `🔄 Atualizando análise existente: ${nomeJogo}`
            );


            const atualizada =

                await atualizarAnaliseExistente(
                    apiId,
                    analise
                );


            if (
                atualizada
            ) {

                console.log(
                    `✅ Análise atualizada: API ${apiId} | ID ${atualizada.id}`
                );


                return atualizada;

            }

        }


        // ==================================================
        // ANÁLISE ANTIGA SEM API_ID
        //
        // Só vincula se realmente não possui API_ID.
        // ==================================================

        if (

            existente &&

            (
                existente.api_id === null ||
                existente.api_id === undefined
            )

        ) {

            try {

                const vinculada =

                    await query(

                        `

                        UPDATE analises

                        SET

                            api_id =
                                $1,

                            jogo =
                                $2,

                            probabilidade_casa =
                                $3,

                            probabilidade_empate =
                                $4,

                            probabilidade_fora =
                                $5,

                            gols_esperados =
                                $6,

                            placar_previsto =
                                $7,

                            value_bet =
                                $8,

                            confianca =
                                $9,

                            algoritmo =
                                $10,

                            criado_em =
                                CURRENT_TIMESTAMP

                        WHERE
                            id = $11

                        AND
                            api_id IS NULL

                        RETURNING *

                        `,

                        [

                            apiId,

                            analise.jogo,

                            analise.probabilidade_casa,

                            analise.probabilidade_empate,

                            analise.probabilidade_fora,

                            analise.gols_esperados,

                            analise.placar_previsto,

                            false,

                            analise.confianca,

                            analise.algoritmo,

                            existente.id

                        ]

                    );


                if (
                    vinculada.rows[0]
                ) {

                    console.log(
                        `🔗 Análise antiga vinculada à API ${apiId}`
                    );


                    return vinculada.rows[0];

                }

            }

            catch (erro) {

                console.error(
                    "⚠️ Erro vinculando análise antiga:",
                    erro.message
                );

            }

        }


        // ==================================================
        // CRIAR NOVA
        // ==================================================

        console.log(
            `💾 Criando nova análise: ${nomeJogo}`
        );


        const salva =
            await salvarAnalise(
                analise
            );


        if (!salva) {

            throw new Error(
                "Não foi possível salvar a análise"
            );

        }


        console.log(
            `✅ Análise salva: ${nomeJogo} | API ${apiId} | ID ${salva.id}`
        );


        return salva;

    }

    catch (erro) {

        console.error(
            `❌ Erro gerar análise API ${apiId}:`,
            erro.message
        );


        throw erro;

    }

    finally {

        analisesEmProcessamento.delete(
            apiId
        );


        console.log(
            `🔓 Trava liberada para API ${apiId}`
        );

    }
}


// ==================================================
// ANALISAR MERCADO
// ==================================================

export async function analisarMercado(
    jogo,
    dados = {}
) {

    const resultado =
        await gerarAnaliseIA(
            jogo,
            dados
        );


    return {

        sucesso:
            true,

        analise:
            resultado

    };
}


// ==================================================
// LISTAR ANÁLISES DE HOJE
// ==================================================

export async function listarAnalises() {

    try {

        const resultado =

            await query(

                `

                SELECT

                    a.id,

                    a.api_id,

                    a.jogo,

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

                    j.time_casa,

                    j.time_fora,

                    j.status

                FROM analises a

                INNER JOIN jogos j

                    ON j.api_id = a.api_id

                WHERE

                    j.data_jogo IS NOT NULL

                AND

                    (

                        j.data_jogo
                        AT TIME ZONE
                        'America/Sao_Paulo'

                    )::date

                    =

                    (

                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        'America/Sao_Paulo'

                    )::date

                ORDER BY

                    j.data_jogo ASC,

                    a.id DESC

                `

            );


        return Array.isArray(
            resultado.rows
        )

            ? resultado.rows

            : [];

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
// VALUE BET
// ==================================================

export function calcularValueBet(
    odd,
    probabilidade
) {

    const oddNumero =
        Number(odd);


    const probabilidadeNumero =
        Number(probabilidade);


    if (

        !Number.isFinite(
            oddNumero
        )

        ||

        !Number.isFinite(
            probabilidadeNumero
        )

        ||

        oddNumero <= 1

        ||

        probabilidadeNumero <= 0

        ||

        probabilidadeNumero > 100

    ) {

        return {

            valor:
                0,

            possui:
                false

        };

    }


    const valorEsperado =

        (
            oddNumero *
            (
                probabilidadeNumero /
                100
            )
        )

        -

        1;


    return {

        valor:
            arredondar(
                valorEsperado,
                3
            ),

        possui:
            valorEsperado > 0.05

    };
}


// ==================================================
// GERAR VALUE BET
// ==================================================

export async function gerarValueBet(
    jogo,
    mercado,
    odd,
    probabilidade
) {

    if (
        !jogo
    ) {

        return null;

    }


    const apiId =
        obterApiId(jogo);


    const resultado =

        calcularValueBet(
            odd,
            probabilidade
        );


    if (
        !resultado.possui
    ) {

        return null;

    }


    let jogoId =
        jogo?.id ||
        null;


    if (
        !jogoId &&
        apiId
    ) {

        try {

            const encontrado =

                await query(

                    `

                    SELECT id

                    FROM jogos

                    WHERE api_id = $1

                    LIMIT 1

                    `,

                    [
                        apiId
                    ]

                );


            jogoId =

                encontrado
                    .rows[0]
                    ?.id ||

                null;

        }

        catch (erro) {

            console.error(
                "⚠️ Erro buscando jogo para Value Bet:",
                erro.message
            );

        }

    }


    if (
        !jogoId
    ) {

        console.warn(
            `⚠️ Value Bet ignorada: jogo ${apiId} não encontrado`
        );


        return null;

    }


    return await salvarValueBet({

        jogo_id:
            jogoId,

        mercado:
            mercado ||
            "N/A",

        odd_mercado:
            Number(
                odd
            ),

        probabilidade_real:
            Number(
                probabilidade
            ),

        valor_esperado:
            resultado.valor,

        confianca:
            "ALTA"

    });
}


// ==================================================
// ESTATÍSTICAS DAS ANÁLISES
// ==================================================

export async function estatisticasAnalises() {

    try {

        const resultado =

            await query(

                `

                SELECT

                    COUNT(*)::integer
                        AS total,

                    COUNT(

                        CASE

                            WHEN api_id IS NOT NULL
                            THEN 1

                        END

                    )::integer
                        AS com_api_id,

                    COUNT(

                        CASE

                            WHEN api_id IS NULL
                            THEN 1

                        END

                    )::integer
                        AS sem_api_id

                FROM analises

                `

            );


        return (

            resultado.rows[0]

            ||

            {

                total:
                    0,

                com_api_id:
                    0,

                sem_api_id:
                    0

            }

        );

    }

    catch (erro) {

        console.error(
            "❌ Erro estatísticas análises:",
            erro.message
        );


        return {

            total:
                0,

            com_api_id:
                0,

            sem_api_id:
                0

        };

    }
}


// ==================================================
// EXPORT DEFAULT
// ==================================================

export default {

    calcularXG,

    calcularProbabilidades,

    calcularPlacar,

    calcularConfianca,

    gerarAnaliseIA,

    analisarMercado,

    listarAnalises,

    calcularValueBet,

    gerarValueBet,

    estatisticasAnalises

};
