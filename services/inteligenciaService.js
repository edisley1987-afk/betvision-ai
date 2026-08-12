// ==================================================
// BETVISION AI
// services/inteligenciaService.js
//
// MOTOR DE INTELIGÊNCIA ESTATÍSTICA v10.0
//
// CORREÇÕES:
//
// - Recalcula análise sempre
// - Não reutiliza análise antiga
// - Atualiza análise pelo api_id
// - Proteção contra concorrência
// - Histórico real
// - Forma recente
// - Gols marcados e sofridos
// - Mando de campo
// - H2H com peso controlado
// - H2H pequeno NÃO domina o modelo
// - XG mais robusto
// - Evita XG artificialmente próximo de zero
// - Probabilidades realmente diferentes
// - Probabilidades normalizadas em 100%
// - Placar previsto
// - Confiança
// - Value Bet
// - PostgreSQL / NeonDB
// - Somente análises de jogos de hoje
// - Sem jogos fictícios
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
// CONFIGURAÇÕES DO MODELO
// ==================================================

const CONFIG_MODELO = {

    // Peso principal do modelo estatístico
    PESO_XG: 0.70,

    // Forma recente
    PESO_FORMA: 0.25,

    // H2H
    PESO_H2H: 0.05,

    // Quantidade mínima para H2H ter peso normal
    H2H_AMOSTRA_FORTE: 5,

    // Mínimo de peso do H2H
    H2H_PESO_MINIMO: 0.01,

    // Máximo de peso do H2H
    H2H_PESO_MAXIMO: 0.05,

    // Mando
    FATOR_MANDO_CASA: 1.08,
    FATOR_MANDO_FORA: 0.94,

    // Limites de XG
    XG_MINIMO: 0.35,
    XG_MAXIMO: 4.50,

    // Média base quando os dados históricos são insuficientes
    MEDIA_BASE_GOLS: 1.20

};


// ==================================================
// UTILITÁRIOS
// ==================================================

function numeroSeguro(valor, padrao = 0) {

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : padrao;

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
        jogo.external_id

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
        jogo?.homeTeam?.name ??
        jogo?.home_team?.name ??
        jogo?.home?.name ??
        null;


    const nomeFora =

        jogo?.time_fora ??
        jogo?.timeFora ??
        jogo?.fora ??
        jogo?.awayTeam?.name ??
        jogo?.away_team?.name ??
        jogo?.away?.name ??
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

            erro:
                "Jogo não informado"

        };

    }


    const apiId =
        obterApiId(jogo);


    if (!apiId) {

        return {

            valido: false,

            erro:
                "api_id inválido ou ausente"

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

            erro:
                erro.message

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
        "home",
        "away",
        "home team",
        "away team",
        "undefined",
        "null",
        "undefined x undefined"

    ];


    if (

        nomesInvalidos.includes(casa) ||
        nomesInvalidos.includes(fora)

    ) {

        return {

            valido: false,

            erro:
                "Times fictícios ou de fallback"

        };

    }


    if (
        casa === fora
    ) {

        return {

            valido: false,

            erro:
                "Time da casa e visitante são iguais"

        };

    }


    return {

        valido: true,

        erro: null

    };

}


// ==================================================
// EXTRAIR ESTATÍSTICAS
// ==================================================

function extrairEstatisticas(dados = {}) {

    const ataqueCasa =
        numeroSeguro(

            dados.ataqueCasa ??
            dados.forcaAtaqueCasa ??
            dados.mediaAtaqueCasa ??
            dados.mediaGolsCasa,

            1

        );


    const ataqueFora =
        numeroSeguro(

            dados.ataqueFora ??
            dados.forcaAtaqueFora ??
            dados.mediaAtaqueFora ??
            dados.mediaGolsFora,

            1

        );


    const defesaCasa =
        numeroSeguro(

            dados.defesaCasa ??
            dados.forcaDefesaCasa ??
            dados.mediaDefesaCasa ??
            dados.mediaGolsSofridosCasa,

            1

        );


    const defesaFora =
        numeroSeguro(

            dados.defesaFora ??
            dados.forcaDefesaFora ??
            dados.mediaGolsSofridosFora ??
            dados.mediaSofridosFora,

            1

        );


    const formaCasa =
        limitar(

            numeroSeguro(

                dados.formaCasa ??
                dados.percentualFormaCasa ??
                dados.formaCasaPercentual,

                50

            ),

            0,
            100

        );


    const formaFora =
        limitar(

            numeroSeguro(

                dados.formaFora ??
                dados.percentualFormaFora ??
                dados.formaForaPercentual,

                50

            ),

            0,
            100

        );


    const mediaGolsCasa =
        Math.max(

            0,

            numeroSeguro(

                dados.mediaGolsCasa ??
                dados.golsCasa ??
                dados.mediaCasa,

                0

            )

        );


    const mediaGolsFora =
        Math.max(

            0,

            numeroSeguro(

                dados.mediaGolsFora ??
                dados.golsFora ??
                dados.mediaFora,

                0

            )

        );


    const mediaSofridosCasa =
        Math.max(

            0,

            numeroSeguro(

                dados.mediaGolsSofridosCasa ??
                dados.golsSofridosCasa ??
                dados.mediaSofridosCasa,

                0

            )

        );


    const mediaSofridosFora =
        Math.max(

            0,

            numeroSeguro(

                dados.mediaGolsSofridosFora ??
                dados.golsSofridosFora ??
                dados.mediaSofridosFora,

                0

            )

        );


    const jogosCasa =
        Math.max(

            0,

            numeroSeguro(

                dados.jogosCasa ??
                dados.historicoCasa ??
                dados.totalJogosCasa ??
                dados.historico?.casa,

                0

            )

        );


    const jogosFora =
        Math.max(

            0,

            numeroSeguro(

                dados.jogosFora ??
                dados.historicoFora ??
                dados.totalJogosFora ??
                dados.historico?.fora,

                0

            )

        );


    const h2h =
        Math.max(

            0,

            numeroSeguro(

                dados.h2h ??
                dados.totalH2H ??
                dados.confrontosH2H ??
                dados.historicoH2H,

                0

            )

        );


    const vitoriasCasaH2H =
        Math.max(

            0,

            numeroSeguro(

                dados.vitoriasCasaH2H ??
                dados.h2hCasa ??
                dados.h2h?.casa,

                0

            )

        );


    const empatesH2H =
        Math.max(

            0,

            numeroSeguro(

                dados.empatesH2H ??
                dados.h2hEmpates ??
                dados.h2h?.empates,

                0

            )

        );


    const vitoriasForaH2H =
        Math.max(

            0,

            numeroSeguro(

                dados.vitoriasForaH2H ??
                dados.h2hFora ??
                dados.h2h?.fora,

                0

            )

        );


    return {

        ataqueCasa,
        ataqueFora,

        defesaCasa,
        defesaFora,

        formaCasa,
        formaFora,

        mediaGolsCasa,
        mediaGolsFora,

        mediaSofridosCasa,
        mediaSofridosFora,

        jogosCasa,
        jogosFora,

        h2h,

        vitoriasCasaH2H,
        empatesH2H,
        vitoriasForaH2H

    };

}


// ==================================================
// FORÇA DE FORMA
//
// Converte forma 0-100 para fator de ataque.
//
// 50% = neutro
// 33% = abaixo da média
// 66% = acima da média
// ==================================================

function fatorForma(percentual) {

    const forma =
        limitar(
            percentual,
            0,
            100
        );


    return (

        0.75 +

        (
            forma / 100
        ) * 0.50

    );

}


// ==================================================
// CALCULAR XG
//
// Modelo robusto:
//
// 1. média de gols
// 2. gols sofridos adversário
// 3. forma
// 4. mando
// 5. amostra histórica
//
// Quando histórico é insuficiente,
// utiliza média estatística + forma.
// ==================================================

export function calcularXG(dados = {}) {

    const estatisticas =
        extrairEstatisticas(dados);


    const {

        formaCasa,
        formaFora,

        mediaGolsCasa,
        mediaGolsFora,

        mediaSofridosCasa,
        mediaSofridosFora,

        jogosCasa,
        jogosFora,

        ataqueCasa,
        ataqueFora

    } = estatisticas;


    // ==============================================
    // BASE CASA
    // ==============================================

    let ataqueBaseCasa;


    if (
        jogosCasa > 0 &&
        mediaGolsCasa > 0
    ) {

        ataqueBaseCasa =
            mediaGolsCasa;

    }

    else if (
        ataqueCasa > 0 &&
        ataqueCasa !== 1
    ) {

        ataqueBaseCasa =
            ataqueCasa;

    }

    else {

        ataqueBaseCasa =
            CONFIG_MODELO.MEDIA_BASE_GOLS;

    }


    // ==============================================
    // BASE FORA
    // ==============================================

    let ataqueBaseFora;


    if (
        jogosFora > 0 &&
        mediaGolsFora > 0
    ) {

        ataqueBaseFora =
            mediaGolsFora;

    }

    else if (
        ataqueFora > 0 &&
        ataqueFora !== 1
    ) {

        ataqueBaseFora =
            ataqueFora;

    }

    else {

        ataqueBaseFora =
            CONFIG_MODELO.MEDIA_BASE_GOLS;

    }


    // ==============================================
    // DEFESA ADVERSÁRIA
    // ==============================================

    let defesaBaseCasa;


    if (
        jogosFora > 0 &&
        mediaSofridosFora > 0
    ) {

        defesaBaseCasa =
            mediaSofridosFora;

    }

    else {

        defesaBaseCasa =
            CONFIG_MODELO.MEDIA_BASE_GOLS;

    }


    let defesaBaseFora;


    if (
        jogosCasa > 0 &&
        mediaSofridosCasa > 0
    ) {

        defesaBaseFora =
            mediaSofridosCasa;

    }

    else {

        defesaBaseFora =
            CONFIG_MODELO.MEDIA_BASE_GOLS;

    }


    // ==============================================
    // COMBINA ATAQUE + DEFESA
    // ==============================================

    let xgCasa =

        (
            ataqueBaseCasa * 0.60
        )

        +

        (
            defesaBaseCasa * 0.40
        );


    let xgFora =

        (
            ataqueBaseFora * 0.60
        )

        +

        (
            defesaBaseFora * 0.40
        );


    // ==============================================
    // FORMA
    // ==============================================

    xgCasa *=
        fatorForma(
            formaCasa
        );


    xgFora *=
        fatorForma(
            formaFora
        );


    // ==============================================
    // MANDO
    // ==============================================

    xgCasa *=
        CONFIG_MODELO.FATOR_MANDO_CASA;


    xgFora *=
        CONFIG_MODELO.FATOR_MANDO_FORA;


    // ==============================================
    // PEQUENO AJUSTE DE AMOSTRA
    //
    // Se os dois times têm poucos jogos,
    // aproxima suavemente da média da liga.
    // ==============================================

    if (
        jogosCasa < 3
    ) {

        xgCasa =

            (
                xgCasa * 0.70
            )

            +

            (
                CONFIG_MODELO.MEDIA_BASE_GOLS *
                0.30
            );

    }


    if (
        jogosFora < 3
    ) {

        xgFora =

            (
                xgFora * 0.70
            )

            +

            (
                CONFIG_MODELO.MEDIA_BASE_GOLS *
                0.30
            );

    }


    // ==============================================
    // LIMITES
    // ==============================================

    xgCasa =
        limitar(

            xgCasa,

            CONFIG_MODELO.XG_MINIMO,

            CONFIG_MODELO.XG_MAXIMO

        );


    xgFora =
        limitar(

            xgFora,

            CONFIG_MODELO.XG_MINIMO,

            CONFIG_MODELO.XG_MAXIMO

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
// PESO H2H
//
// CORREÇÃO IMPORTANTE:
//
// 1 ou 2 confrontos não podem decidir o jogo.
//
// 1 jogo  -> 1%
// 2 jogos -> 2%
// 3 jogos -> 3%
// 4 jogos -> 4%
// 5+      -> 5%
// ==================================================

function calcularPesoH2H(totalH2H) {

    const jogos =
        Math.max(
            0,
            Number(totalH2H || 0)
        );


    if (
        jogos <= 0
    ) {

        return 0;

    }


    return limitar(

        jogos / 100,

        CONFIG_MODELO.H2H_PESO_MINIMO,

        CONFIG_MODELO.H2H_PESO_MAXIMO

    );

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


    // ==============================================
    // FORMA
    // ==============================================

    const formaCasa =
        estatisticas.formaCasa;

    const formaFora =
        estatisticas.formaFora;


    const formaTotal =
        formaCasa +
        formaFora;


    let formaCasaProb = 33.33;
    let formaForaProb = 33.33;
    let formaEmpateProb = 33.34;


    if (
        formaTotal > 0
    ) {

        const diferenca =
            Math.abs(
                formaCasa -
                formaFora
            );


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


        formaEmpateProb =
            limitar(

                30 -
                (
                    diferenca *
                    0.08
                ),

                20,
                30

            );

    }


    // ==============================================
    // H2H
    // ==============================================

    let h2hCasa =
        33.33;

    let h2hEmpate =
        33.34;

    let h2hFora =
        33.33;


    const totalConfrontos =

        estatisticas.vitoriasCasaH2H +
        estatisticas.empatesH2H +
        estatisticas.vitoriasForaH2H;


    if (
        totalConfrontos > 0
    ) {

        h2hCasa =

            (
                estatisticas.vitoriasCasaH2H /
                totalConfrontos
            ) * 100;


        h2hEmpate =

            (
                estatisticas.empatesH2H /
                totalConfrontos
            ) * 100;


        h2hFora =

            (
                estatisticas.vitoriasForaH2H /
                totalConfrontos
            ) * 100;

    }


    // ==============================================
    // PESOS
    // ==============================================

    const pesoH2H =
        calcularPesoH2H(
            totalConfrontos
        );


    const pesoForma =
        CONFIG_MODELO.PESO_FORMA;


    const pesoXG =
        1 -
        pesoForma -
        pesoH2H;


    // ==============================================
    // COMBINAÇÃO
    // ==============================================

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
            h2hCasa *
            pesoH2H
        );


    let empate =

        (
            poissonProb.empate *
            pesoXG
        )

        +

        (
            formaEmpateProb *
            pesoForma
        )

        +

        (
            h2hEmpate *
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
            h2hFora *
            pesoH2H
        );


    // ==============================================
    // MANDO DE CAMPO
    // ==============================================

    casa *=
        1.04;

    fora *=
        0.98;


    // ==============================================
    // NORMALIZAÇÃO
    // ==============================================

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


    // ==============================================
    // LIMITES
    // ==============================================

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


    // ==============================================
    // NORMALIZAÇÃO FINAL
    // ==============================================

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


    // ==============================================
    // ARREDONDAMENTO
    // ==============================================

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


    // ==============================================
    // GARANTIR 100%
    // ==============================================

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
            foraFinal +
            ajuste,
            2
        );


    // ==============================================
    // LOG
    // ==============================================

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
        `   Gols Casa: ${estatisticas.mediaGolsCasa}`
    );


    console.log(
        `   Gols Fora: ${estatisticas.mediaGolsFora}`
    );


    console.log(
        `   H2H: ${totalConfrontos}`
    );


    console.log(
        `   Peso H2H: ${(pesoH2H * 100).toFixed(2)}%`
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

    const casa =
        Number(
            probabilidades.casa || 0
        );

    const empate =
        Number(
            probabilidades.empate || 0
        );

    const fora =
        Number(
            probabilidades.fora || 0
        );


    const maior =
        Math.max(
            casa,
            empate,
            fora
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

    if (apiId) {

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


    // ==============================================
    // SOMENTE registros antigos sem api_id
    // ==============================================

    if (nomeJogo) {

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

    if (!apiId) {

        return null;

    }


    const resultado =

        await query(

            `

            UPDATE analises

            SET

                jogo = $2,

                probabilidade_casa = $3,

                probabilidade_empate = $4,

                probabilidade_fora = $5,

                gols_esperados = $6,

                placar_previsto = $7,

                value_bet = $8,

                confianca = $9,

                algoritmo = $10,

                criado_em = CURRENT_TIMESTAMP

            WHERE api_id = $1

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
        obterApiId(
            jogo
        );


    if (!apiId) {

        throw new Error(
            "api_id é obrigatório para gerar análise"
        );

    }


    const {

        nomeCasa,
        nomeFora,
        nomeJogo

    } =
        obterNomeJogo(
            jogo
        );


    const validacao =
        validarJogo(
            jogo
        );


    if (
        !validacao.valido
    ) {

        throw new Error(

            `Jogo inválido para análise: ` +
            validacao.erro

        );

    }


    console.log(
        `🤖 Gerando análise inteligente: ${nomeJogo}`
    );


    console.log(
        `🤖 API ID: ${apiId}`
    );


    // ==============================================
    // TRAVA
    // ==============================================

    if (
        analisesEmProcessamento.has(
            apiId
        )
    ) {

        console.log(

            `⏳ API ${apiId} já está em processamento`

        );


        return null;

    }


    analisesEmProcessamento.add(
        apiId
    );


    console.log(
        `🔒 Trava ativada: API ${apiId}`
    );


    try {

        // ==========================================
        // ESTATÍSTICAS
        // ==========================================

        const estatisticas =
            extrairEstatisticas(
                dados
            );


        console.log(
            `📊 Dados recebidos para ${nomeJogo}`
        );


        console.log(
            `   Forma Casa: ${estatisticas.formaCasa}%`
        );


        console.log(
            `   Forma Fora: ${estatisticas.formaFora}%`
        );


        console.log(
            `   Gols Casa: ${estatisticas.mediaGolsCasa}`
        );


        console.log(
            `   Gols Fora: ${estatisticas.mediaGolsFora}`
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


        // ==========================================
        // XG
        // ==========================================

        const xg =
            calcularXG(
                dados
            );


        // ==========================================
        // PROBABILIDADES
        // ==========================================

        const probabilidades =
            calcularProbabilidades(
                dados
            );


        // ==========================================
        // PLACAR
        // ==========================================

        const placar =
            calcularPlacar(
                dados
            );


        // ==========================================
        // GOLS ESPERADOS
        // ==========================================

        const golsEsperados =
            arredondar(

                xg.casa +
                xg.fora,

                2

            );


        // ==========================================
        // CONFIANÇA
        // ==========================================

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


        // ==========================================
        // OBJETO DA ANÁLISE
        // ==========================================

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


        // ==========================================
        // VERIFICAR EXISTÊNCIA
        // ==========================================

        const existente =

            await buscarAnaliseExistente(
                nomeJogo,
                apiId
            );


        // ==========================================
        // ATUALIZAR PELO API ID
        // ==========================================

        if (

            existente &&

            Number(
                existente.api_id
            ) ===
            Number(apiId)

        ) {

            console.log(

                `🔄 Atualizando análise existente: ` +
                `${nomeJogo}`

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

                    `✅ Análise atualizada: ` +
                    `API ${apiId} | ` +
                    `ID ${atualizada.id}`

                );


                return atualizada;

            }

        }


        // ==========================================
        // ANÁLISE ANTIGA SEM API ID
        // ==========================================

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

                            api_id = $1,

                            jogo = $2,

                            probabilidade_casa = $3,

                            probabilidade_empate = $4,

                            probabilidade_fora = $5,

                            gols_esperados = $6,

                            placar_previsto = $7,

                            value_bet = $8,

                            confianca = $9,

                            algoritmo = $10,

                            criado_em =
                                CURRENT_TIMESTAMP

                        WHERE id = $11

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

                        `🔗 Análise antiga vinculada ` +
                        `à API ${apiId}`

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


        // ==========================================
        // CRIAR NOVA
        // ==========================================

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

            `✅ Análise salva: ${nomeJogo} | ` +
            `API ${apiId} | ` +
            `ID ${salva.id}`

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

            valorEsperado >
            0.05

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

    if (!jogo) {

        return null;

    }


    const apiId =
        obterApiId(
            jogo
        );


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

            `⚠️ Value Bet ignorada: ` +
            `jogo ${apiId} não encontrado`

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
            Number(odd),

        probabilidade_real:
            Number(probabilidade),

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
