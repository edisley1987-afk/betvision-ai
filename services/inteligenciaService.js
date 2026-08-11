// ==================================================
// BETVISION AI
// services/inteligenciaService.js
//
// Motor de Inteligência Estatística v9.0
// PostgreSQL + NeonDB
//
// NOVA VERSÃO:
//
// - Probabilidades realmente diferentes por jogo
// - Ataque
// - Defesa
// - Forma recente
// - Média de gols
// - H2H
// - Mando de campo
// - Poisson
// - Amostra histórica
// - Proteção contra dados insuficientes
// - api_id como identificador principal
// - Não cria análise duplicada
// - Reutiliza análise existente
// - Trava contra processamento simultâneo
// - Compatível com bancoService.js
// - Compatível com jogoBancoService.js
// - Compatível com jogos.js v15
// - Probabilidades sempre somam 100%
//
// IMPORTANTE:
//
// Esta versão NÃO usa:
//
// 35% Casa
// 34% Fora
// 30% Empate
//
// Cada jogo recebe cálculo próprio.
//
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

const analisesEmProcessamento =
    new Set();


// ==================================================
// CONSTANTES DO MODELO
// ==================================================

const MODELO =
    "BetVision Statistical AI v9.0";


// Peso do modelo Poisson
const PESO_POISSON =
    0.50;


// Peso do modelo estatístico
const PESO_ESTATISTICO =
    0.35;


// Peso do H2H
const PESO_H2H =
    0.15;


// Mando de campo
const BONUS_MANDO =
    0.10;


// Número máximo de gols analisados
const MAX_GOLS_POISSON =
    8;


// ==================================================
// LIMITAR
// ==================================================

function limitar(
    valor,
    minimo = 0,
    maximo = 100
) {

    const numero =
        Number(valor);

    if (
        !Number.isFinite(numero)
    ) {

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
// NÚMERO SEGURO
// ==================================================

function numeroSeguro(
    valor,
    padrao = 0
) {

    const numero =
        Number(valor);

    return Number.isFinite(numero)
        ? numero
        : padrao;

}


// ==================================================
// NORMALIZAR API ID
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
// NORMALIZAR PROBABILIDADES
// ==================================================

function normalizarProbabilidades(
    casa,
    empate,
    fora
) {

    let pCasa =
        Math.max(
            0,
            numeroSeguro(casa, 0)
        );

    let pEmpate =
        Math.max(
            0,
            numeroSeguro(empate, 0)
        );

    let pFora =
        Math.max(
            0,
            numeroSeguro(fora, 0)
        );


    const total =
        pCasa +
        pEmpate +
        pFora;


    if (
        total <= 0
    ) {

        return {

            casa: 33.33,

            empate: 33.34,

            fora: 33.33

        };

    }


    pCasa =
        (
            pCasa /
            total
        ) *
        100;


    pEmpate =
        (
            pEmpate /
            total
        ) *
        100;


    pFora =
        (
            pFora /
            total
        ) *
        100;


    let casaFinal =
        Number(
            pCasa.toFixed(2)
        );


    let empateFinal =
        Number(
            pEmpate.toFixed(2)
        );


    let foraFinal =
        Number(
            pFora.toFixed(2)
        );


    const soma =
        Number(
            (
                casaFinal +
                empateFinal +
                foraFinal
            ).toFixed(2)
        );


    const diferenca =
        Number(
            (
                100 -
                soma
            ).toFixed(2)
        );


    foraFinal =
        Number(
            (
                foraFinal +
                diferenca
            ).toFixed(2)
        );


    return {

        casa:
            casaFinal,

        empate:
            empateFinal,

        fora:
            foraFinal

    };

}


// ==================================================
// MÉDIA SEGURA
// ==================================================

function mediaSegura(
    valor,
    padrao = 1
) {

    const numero =
        Number(valor);

    if (
        !Number.isFinite(numero)
    ) {

        return padrao;

    }

    return Math.max(
        0,
        numero
    );

}


// ==================================================
// DISTRIBUIÇÃO DE POISSON
// ==================================================

function poisson(
    lambda,
    gols
) {

    lambda =
        Math.max(
            0.01,
            numeroSeguro(
                lambda,
                1
            )
        );


    let fatorial = 1;


    for (
        let i = 1;
        i <= gols;
        i++
    ) {

        fatorial *= i;

    }


    return (

        Math.exp(
            -lambda
        ) *

        Math.pow(
            lambda,
            gols
        )

        /

        fatorial

    );

}


// ==================================================
// MODELO POISSON
//
// Usa gols esperados dos dois times.
//
// Retorna:
// Casa
// Empate
// Fora
// ==================================================

function calcularPoisson(
    golsCasa,
    golsFora
) {

    const lambdaCasa =
        Math.max(
            0.05,
            mediaSegura(
                golsCasa,
                1
            )
        );


    const lambdaFora =
        Math.max(
            0.05,
            mediaSegura(
                golsFora,
                1
            )
        );


    let probCasa =
        0;

    let probEmpate =
        0;

    let probFora =
        0;


    for (
        let golsC = 0;
        golsC <= MAX_GOLS_POISSON;
        golsC++
    ) {

        const pC =
            poisson(
                lambdaCasa,
                golsC
            );


        for (
            let golsF = 0;
            golsF <= MAX_GOLS_POISSON;
            golsF++
        ) {

            const pF =
                poisson(
                    lambdaFora,
                    golsF
                );


            const prob =
                pC * pF;


            if (
                golsC > golsF
            ) {

                probCasa +=
                    prob;

            }

            else if (
                golsC === golsF
            ) {

                probEmpate +=
                    prob;

            }

            else {

                probFora +=
                    prob;

            }

        }

    }


    return normalizarProbabilidades(

        probCasa,

        probEmpate,

        probFora

    );

}


// ==================================================
// PROBABILIDADE H2H
// ==================================================

function calcularProbabilidadeH2H(
    dados
) {

    const h2hJogos =
        Number(
            dados.h2hJogos ||
            dados.confrontoDireto?.jogos ||
            0
        );


    const vitoriasCasa =
        Number(
            dados.h2hVitoriasCasa ||
            dados.confrontoDireto?.vitoriasCasa ||
            0
        );


    const empates =
        Number(
            dados.h2hEmpates ||
            dados.confrontoDireto?.empates ||
            0
        );


    const vitoriasFora =
        Number(
            dados.h2hVitoriasFora ||
            dados.confrontoDireto?.vitoriasFora ||
            0
        );


    if (
        h2hJogos <= 0
    ) {

        return null;

    }


    return normalizarProbabilidades(

        vitoriasCasa,

        empates,

        vitoriasFora

    );

}


// ==================================================
// CALCULAR PROBABILIDADES
//
// MODELO PRINCIPAL
// ==================================================

export function calcularProbabilidades(
    dados = {}
) {

    // ==============================================
    // DADOS DOS TIMES
    // ==============================================

    const ataqueCasa =
        limitar(
            numeroSeguro(
                dados.ataqueCasa,
                50
            )
        );


    const defesaCasa =
        limitar(
            numeroSeguro(
                dados.defesaCasa,
                50
            )
        );


    const ataqueFora =
        limitar(
            numeroSeguro(
                dados.ataqueFora,
                50
            )
        );


    const defesaFora =
        limitar(
            numeroSeguro(
                dados.defesaFora,
                50
            )
        );


    const formaCasa =
        limitar(
            numeroSeguro(
                dados.formaCasa,
                50
            )
        );


    const formaFora =
        limitar(
            numeroSeguro(
                dados.formaFora,
                50
            )
        );


    const mediaCasa =
        mediaSegura(
            dados.mediaGolsCasa,
            1
        );


    const mediaFora =
        mediaSegura(
            dados.mediaGolsFora,
            1
        );


    // ==============================================
    // AMOSTRA HISTÓRICA
    // ==============================================

    const jogosCasa =
        Math.max(
            0,
            Number(
                dados.historicoCasa?.length ||
                0
            )
        );


    const jogosFora =
        Math.max(
            0,
            Number(
                dados.historicoFora?.length ||
                0
            )
        );


    const h2hJogos =
        Math.max(
            0,
            Number(
                dados.h2hJogos ||
                dados.confrontoDireto?.jogos ||
                0
            )
        );


    const possuiHistorico =
        Boolean(
            dados.possuiHistorico ||
            jogosCasa > 0 ||
            jogosFora > 0
        );


    // ==============================================
    // ATAQUE × DEFESA
    //
    // A força ofensiva é comparada
    // diretamente com a defesa adversária.
    // ==============================================

    const ataqueRelativoCasa =

        (
            ataqueCasa *
            0.65
        )

        +

        (
            defesaFora *
            0.35
        );


    const ataqueRelativoFora =

        (
            ataqueFora *
            0.65
        )

        +

        (
            defesaCasa *
            0.35
        );


    // ==============================================
    // FORMA
    // ==============================================

    const formaRelativaCasa =
        formaCasa;


    const formaRelativaFora =
        formaFora;


    // ==============================================
    // GOLS
    // ==============================================

    const golsCasaNormalizado =
        limitar(
            mediaCasa * 30,
            0,
            100
        );


    const golsForaNormalizado =
        limitar(
            mediaFora * 30,
            0,
            100
        );


    // ==============================================
    // FORÇA ESTATÍSTICA
    // ==============================================

    let forcaCasa =

        (
            ataqueRelativoCasa *
            0.38
        )

        +

        (
            formaRelativaCasa *
            0.30
        )

        +

        (
            golsCasaNormalizado *
            0.22
        )

        +

        (
            defesaCasa *
            0.10
        );


    let forcaFora =

        (
            ataqueRelativoFora *
            0.38
        )

        +

        (
            formaRelativaFora *
            0.30
        )

        +

        (
            golsForaNormalizado *
            0.22
        )

        +

        (
            defesaFora *
            0.10
        );


    // ==============================================
    // MANDO DE CAMPO
    // ==============================================

    forcaCasa *=
        1 +
        BONUS_MANDO;


    // ==============================================
    // IMPACTO DA AMOSTRA
    //
    // Se existe histórico real,
    // reduzimos o peso dos defaults.
    // ==============================================

    const amostraCasa =
        limitar(
            jogosCasa / 10,
            0,
            1
        );


    const amostraFora =
        limitar(
            jogosFora / 10,
            0,
            1
        );


    const confiabilidadeHistorico =

        (
            amostraCasa +
            amostraFora
        ) / 2;


    // ==============================================
    // PROBABILIDADE ESTATÍSTICA
    // ==============================================

    let estatisticaCasa =
        forcaCasa;


    let estatisticaFora =
        forcaFora;


    // ==============================================
    // EMPATE ESTATÍSTICO
    //
    // Quanto mais equilibradas as forças,
    // maior tende a ser o empate.
    // ==============================================

    const diferencaForca =
        Math.abs(
            forcaCasa -
            forcaFora
        );


    let empateEstatistico =

        34 -

        (
            diferencaForca *
            0.20
        );


    empateEstatistico =
        limitar(
            empateEstatistico,
            16,
            34
        );


    // ==============================================
    // NORMALIZAR MODELO ESTATÍSTICO
    // ==============================================

    const estatistica =
        normalizarProbabilidades(

            estatisticaCasa,

            empateEstatistico,

            estatisticaFora

        );


    // ==============================================
    // MODELO POISSON
    //
    // Estima gols esperados considerando:
    //
    // ataque próprio
    // defesa adversária
    // média histórica
    // ==============================================

    let xGCasa =

        (
            mediaCasa *
            0.55
        )

        +

        (
            (
                ataqueCasa /
                50
            )
            *
            1.20
            *
            0.25
        )

        +

        (
            (
                defesaFora /
                50
            )
            *
            1.10
            *
            0.20
        );


    let xGFora =

        (
            mediaFora *
            0.55
        )

        +

        (
            (
                ataqueFora /
                50
            )
            *
            1.20
            *
            0.25
        )

        +

        (
            (
                defesaCasa /
                50
            )
            *
            1.10
            *
            0.20
        );


    // ==============================================
    // MANDO DE CAMPO NO XG
    // ==============================================

    xGCasa *=
        1.08;


    xGFora *=
        0.96;


    // ==============================================
    // LIMITAR XG
    // ==============================================

    xGCasa =
        Math.max(
            0.20,
            Math.min(
                4.50,
                xGCasa
            )
        );


    xGFora =
        Math.max(
            0.20,
            Math.min(
                4.50,
                xGFora
            )
        );


    const poissonModelo =
        calcularPoisson(
            xGCasa,
            xGFora
        );


    // ==============================================
    // H2H
    // ==============================================

    const h2h =
        calcularProbabilidadeH2H(
            dados
        );


    // ==============================================
    // COMBINAÇÃO FINAL
    // ==============================================

    let pesoPoisson =
        PESO_POISSON;


    let pesoEstatistico =
        PESO_ESTATISTICO;


    let pesoH2H =
        h2h
            ? PESO_H2H
            : 0;


    // ==============================================
    // SEM H2H
    //
    // Redistribui o peso do H2H.
    // ==============================================

    if (
        !h2h
    ) {

        pesoEstatistico +=
            PESO_H2H;

    }


    // ==============================================
    // HISTÓRICO INSUFICIENTE
    //
    // Se não temos histórico real,
    // não fingimos que temos precisão.
    // ==============================================

    if (
        !possuiHistorico
    ) {

        pesoPoisson =
            0.65;

        pesoEstatistico =
            0.35;

        pesoH2H =
            0;

    }


    // ==============================================
    // PESOS
    // ==============================================

    const somaPesos =

        pesoPoisson +
        pesoEstatistico +
        pesoH2H;


    pesoPoisson /=
        somaPesos;


    pesoEstatistico /=
        somaPesos;


    pesoH2H /=
        somaPesos;


    // ==============================================
    // PROBABILIDADES COMBINADAS
    // ==============================================

    let probCasa =

        (
            poissonModelo.casa *
            pesoPoisson
        )

        +

        (
            estatistica.casa *
            pesoEstatistico
        );


    let probEmpate =

        (
            poissonModelo.empate *
            pesoPoisson
        )

        +

        (
            estatistica.empate *
            pesoEstatistico
        );


    let probFora =

        (
            poissonModelo.fora *
            pesoPoisson
        )

        +

        (
            estatistica.fora *
            pesoEstatistico
        );


    // ==============================================
    // ADICIONAR H2H
    // ==============================================

    if (
        h2h
    ) {

        probCasa +=
            h2h.casa *
            pesoH2H;


        probEmpate +=
            h2h.empate *
            pesoH2H;


        probFora +=
            h2h.fora *
            pesoH2H;

    }


    // ==============================================
    // AJUSTE PELO EQUILÍBRIO
    //
    // Evita que pequenos erros de arredondamento
    // produzam resultados artificiais.
    // ==============================================

    const vantagemCasa =
        probCasa -
        probFora;


    if (
        vantagemCasa > 25
    ) {

        probEmpate *=
            0.92;

    }

    else if (
        vantagemCasa < -25
    ) {

        probEmpate *=
            0.92;

    }


    // ==============================================
    // NORMALIZAÇÃO FINAL
    // ==============================================

    const probabilidades =
        normalizarProbabilidades(

            probCasa,

            probEmpate,

            probFora

        );


    // ==============================================
    // LOG DO MODELO
    // ==============================================

    console.log(
        "📊 MODELO ESTATÍSTICO"
    );


    console.log(
        `   Casa: ${probabilidades.casa}%`
    );


    console.log(
        `   Empate: ${probabilidades.empate}%`
    );


    console.log(
        `   Fora: ${probabilidades.fora}%`
    );


    console.log(
        `   XG Casa: ${xGCasa.toFixed(2)}`
    );


    console.log(
        `   XG Fora: ${xGFora.toFixed(2)}`
    );


    console.log(
        `   Histórico Casa: ${jogosCasa}`
    );


    console.log(
        `   Histórico Fora: ${jogosFora}`
    );


    console.log(
        `   H2H: ${h2hJogos}`
    );


    return {

        casa:
            probabilidades.casa,

        empate:
            probabilidades.empate,

        fora:
            probabilidades.fora,

        xGCasa:
            Number(
                xGCasa.toFixed(2)
            ),

        xGFora:
            Number(
                xGFora.toFixed(2)
            ),

        amostraCasa:
            jogosCasa,

        amostraFora:
            jogosFora,

        h2hJogos:

            h2hJogos,

        confiabilidadeHistorico:
            Number(
                (
                    confiabilidadeHistorico *
                    100
                ).toFixed(2)
            )

    };

}


// ==================================================
// PLACAR PREVISTO
// ==================================================

export function calcularPlacar(
    dados = {}
) {

    const probabilidades =
        calcularProbabilidades(
            dados
        );


    const golsCasa =
        numeroSeguro(
            probabilidades.xGCasa,
            numeroSeguro(
                dados.mediaGolsCasa,
                1
            )
        );


    const golsFora =
        numeroSeguro(
            probabilidades.xGFora,
            numeroSeguro(
                dados.mediaGolsFora,
                1
            )
        );


    return {

        casa:

            Math.max(
                0,
                Math.round(
                    golsCasa
                )
            ),

        fora:

            Math.max(
                0,
                Math.round(
                    golsFora
                )
            ),

        xGCasa:
            Number(
                golsCasa.toFixed(2)
            ),

        xGFora:
            Number(
                golsFora.toFixed(2)
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
                probabilidades.casa ||
                0
            ),

            Number(
                probabilidades.empate ||
                0
            ),

            Number(
                probabilidades.fora ||
                0
            )

        );


    const amostraCasa =
        Number(
            probabilidades.amostraCasa ||
            0
        );


    const amostraFora =
        Number(
            probabilidades.amostraFora ||
            0
        );


    const h2h =
        Number(
            probabilidades.h2hJogos ||
            0
        );


    const dadosSuficientes =

        amostraCasa >= 5 &&
        amostraFora >= 5;


    if (
        maior >= 65 &&
        dadosSuficientes
    ) {

        return "ALTA";

    }


    if (
        maior >= 55 &&
        (
            dadosSuficientes ||
            h2h >= 3
        )
    ) {

        return "MEDIA";

    }


    return "BAIXA";

}


// ==================================================
// OBTER API ID
// ==================================================

function obterApiId(
    jogo
) {

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
        jogo.id

    );

}


// ==================================================
// NORMALIZAR NOME DO JOGO
// ==================================================

function obterNomeJogo(
    jogo
) {

    const nomeCasa =

        jogo?.time_casa ||
        jogo?.timeCasa ||
        jogo?.casa ||
        jogo?.homeTeam?.name ||
        jogo?.home_team?.name ||
        null;


    const nomeFora =

        jogo?.time_fora ||
        jogo?.timeFora ||
        jogo?.fora ||
        jogo?.awayTeam?.name ||
        jogo?.away_team?.name ||
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
        String(
            nomeCasa
        ).trim();


    const fora =
        String(
            nomeFora
        ).trim();


    if (
        !casa ||
        !fora
    ) {

        throw new Error(
            "Nome dos times inválido"
        );

    }


    return {

        nomeCasa:
            casa,

        nomeFora:
            fora,

        nomeJogo:
            `${casa} x ${fora}`

    };

}


// ==================================================
// VALIDAR JOGO
// ==================================================

function validarJogo(
    jogo
) {

    if (!jogo) {

        return {

            valido:
                false,

            erro:
                "Jogo não informado"

        };

    }


    const apiId =
        obterApiId(
            jogo
        );


    if (!apiId) {

        return {

            valido:
                false,

            erro:
                "api_id inválido ou ausente"

        };

    }


    let nomes;


    try {

        nomes =
            obterNomeJogo(
                jogo
            );

    }

    catch (erro) {

        return {

            valido:
                false,

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

        "away team"

    ];


    if (

        nomesInvalidos.includes(casa) ||
        nomesInvalidos.includes(fora)

    ) {

        return {

            valido:
                false,

            erro:
                "Times fictícios ou de fallback"

        };

    }


    if (
        casa === fora
    ) {

        return {

            valido:
                false,

            erro:
                "Time da casa e visitante são iguais"

        };

    }


    return {

        valido:
            true,

        erro:
            null

    };

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

                "❌ Erro buscando análise por api_id:",
                erro.message

            );

        }

    }


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

                "❌ Erro buscando análise antiga por nome:",
                erro.message

            );

        }

    }


    return null;

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


    console.log(
        `🤖 Gerando análise inteligente: ${nomeJogo}`
    );


    console.log(
        `🤖 API ID: ${apiId}`
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
            `${validacao.erro}`

        );

    }


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

                "⚠️ Erro consultando análise durante trava:",
                erro.message

            );

        }


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
        // VERIFICAR ANÁLISE EXISTENTE
        // ==========================================

        const existente =

            await buscarAnaliseExistente(
                nomeJogo,
                apiId
            );


        if (
            existente
        ) {

            console.log(
                `♻️ Análise já existente: ${nomeJogo}`
            );


            console.log(
                `♻️ API ID: ${apiId}`
            );


            // ======================================
            // VINCULAR ANÁLISE ANTIGA
            // ======================================

            if (

                existente.api_id === null ||
                existente.api_id === undefined

            ) {

                try {

                    const vinculada =

                        await query(

                            `
                            UPDATE analises

                            SET api_id = $1

                            WHERE id = $2

                              AND api_id IS NULL

                            RETURNING *
                            `,

                            [

                                apiId,

                                existente.id

                            ]

                        );


                    if (
                        vinculada.rows[0]
                    ) {

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


            // ======================================
            // IMPORTANTE
            //
            // Não recalcula análise já existente.
            // ======================================

            return existente;

        }


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
        // MÉDIAS
        // ==========================================

        const mediaCasa =

            numeroSeguro(
                dados.mediaGolsCasa,
                1
            );


        const mediaFora =

            numeroSeguro(
                dados.mediaGolsFora,
                1
            );


        const golsEsperados =

            Number(

                (
                    probabilidades.xGCasa +
                    probabilidades.xGFora
                )
                .toFixed(2)

            );


        // ==========================================
        // CONFIANÇA
        // ==========================================

        const confianca =

            calcularConfianca(
                probabilidades
            );


        // ==========================================
        // INDICADOR HISTÓRICO
        // ==========================================

        const possuiHistorico =
            Boolean(
                dados.possuiHistorico
            );


        const possuiH2H =
            Boolean(
                dados.possuiH2H ||
                probabilidades.h2hJogos > 0
            );


        // ==========================================
        // ANÁLISE
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
                MODELO

        };


        console.log(
            "=========================================="
        );


        console.log(
            `🤖 ANÁLISE: ${nomeCasa} x ${nomeFora}`
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
            `⚽ XG: ${placar.xGCasa} x ${placar.xGFora}`
        );


        console.log(
            `🎯 Placar: ${placar.casa} x ${placar.fora}`
        );


        console.log(
            `📚 Histórico: ${possuiHistorico ? "SIM" : "NÃO"}`
        );


        console.log(
            `⚔️ H2H: ${possuiH2H ? "SIM" : "NÃO"}`
        );


        console.log(
            `🎯 Confiança: ${confianca}`
        );


        console.log(
            "=========================================="
        );


        // ==========================================
        // SALVAR
        // ==========================================

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
            `API ${apiId} | ID ${salva.id}`

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
// LISTAR ANÁLISES
//
// SOMENTE JOGOS DE HOJE
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

                    AND DATE(
                        j.data_jogo
                    ) = CURRENT_DATE

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

        oddNumero <= 0

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
        - 1;


    return {

        valor:

            Number(

                valorEsperado
                    .toFixed(3)

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
