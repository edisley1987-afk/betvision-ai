// ==================================================
// BETVISION AI
// services/inteligenciaService.js
//
// MOTOR DE INTELIGÊNCIA ESTATÍSTICA v9.0
//
// CORREÇÕES PRINCIPAIS:
//
// - Probabilidades realmente diferentes por jogo
// - Não reutiliza cegamente análise antiga
// - Recalcula análise dos jogos atuais
// - Atualiza análise existente pelo api_id
// - Mantém proteção contra concorrência
// - Mantém compatibilidade com PostgreSQL / NeonDB
// - Histórico real
// - Forma recente
// - Gols marcados e sofridos
// - Mando de campo
// - H2H
// - XG individual
// - Probabilidades normalizadas
// - Placar previsto
// - Confiança
// - Value Bet
// - Somente jogos de hoje na listagem
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
        Math.min(maximo, numero)
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


    const casa = String(
        nomeCasa
    ).trim();


    const fora = String(
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
        "null"

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
//
// Aceita diversos nomes de campos para manter
// compatibilidade com o restante do projeto.
// ==================================================

function extrairEstatisticas(dados = {}) {

    const ataqueCasa = numeroSeguro(

        dados.ataqueCasa ??
        dados.forcaAtaqueCasa ??
        dados.mediaAtaqueCasa ??
        dados.golsCasa ??
        dados.mediaGolsCasa,

        1

    );


    const ataqueFora = numeroSeguro(

        dados.ataqueFora ??
        dados.forcaAtaqueFora ??
        dados.mediaAtaqueFora ??
        dados.golsFora ??
        dados.mediaGolsFora,

        1

    );


    const defesaCasa = numeroSeguro(

        dados.defesaCasa ??
        dados.forcaDefesaCasa ??
        dados.mediaDefesaCasa ??
        dados.golsSofridosCasa ??
        dados.mediaGolsSofridosCasa,

        1

    );


    const defesaFora = numeroSeguro(

        dados.defesaFora ??
        dados.forcaDefesaFora ??
        dados.mediaDefesaFora ??
        dados.golsSofridosFora ??
        dados.mediaGolsSofridosFora,

        1

    );


    const formaCasa = numeroSeguro(

        dados.formaCasa ??
        dados.percentualFormaCasa ??
        dados.formaCasaPercentual,

        50

    );


    const formaFora = numeroSeguro(

        dados.formaFora ??
        dados.percentualFormaFora ??
        dados.formaForaPercentual,

        50

    );


    const mediaGolsCasa = numeroSeguro(

        dados.mediaGolsCasa ??
        dados.golsCasa ??
        dados.mediaCasa,

        1

    );


    const mediaGolsFora = numeroSeguro(

        dados.mediaGolsFora ??
        dados.golsFora ??
        dados.mediaFora,

        1

    );


    const mediaSofridosCasa = numeroSeguro(

        dados.mediaGolsSofridosCasa ??
        dados.golsSofridosCasa ??
        dados.mediaSofridosCasa,

        1

    );


    const mediaSofridosFora = numeroSeguro(

        dados.mediaGolsSofridosFora ??
        dados.golsSofridosFora ??
        dados.mediaSofridosFora,

        1

    );


    const jogosCasa = numeroSeguro(

        dados.jogosCasa ??
        dados.historicoCasa ??
        dados.totalJogosCasa ??
        dados.historico?.casa,

        0

    );


    const jogosFora = numeroSeguro(

        dados.jogosFora ??
        dados.historicoFora ??
        dados.totalJogosFora ??
        dados.historico?.fora,

        0

    );


    const h2h = numeroSeguro(

        dados.h2h ??
        dados.totalH2H ??
        dados.confrontosH2H ??
        dados.historicoH2H,

        0

    );


    const vitoriasCasaH2H = numeroSeguro(

        dados.vitoriasCasaH2H ??
        dados.h2hCasa ??
        dados.h2h?.casa,

        0

    );


    const empatesH2H = numeroSeguro(

        dados.empatesH2H ??
        dados.h2hEmpates ??
        dados.h2h?.empates,

        0

    );


    const vitoriasForaH2H = numeroSeguro(

        dados.vitoriasForaH2H ??
        dados.h2hFora ??
        dados.h2h?.fora,

        0

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
// XG
//
// Modelo:
//
// ataque próprio
// +
// defesa adversária
// +
// forma
// +
// mando
// +
// ajuste de amostra
// ==================================================

export function calcularXG(dados = {}) {

    const estatisticas =
        extrairEstatisticas(dados);


    const {

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


    // ----------------------------------------------
    // BASE CASA
    // ----------------------------------------------

    const baseCasa =

        (
            mediaGolsCasa * 0.40
        )

        +

        (
            ataqueCasa * 0.20
        )

        +

        (
            mediaSofridosFora * 0.20
        )

        +

        (
            defesaFora * 0.20
        );


    // ----------------------------------------------
    // BASE FORA
    // ----------------------------------------------

    const baseFora =

        (
            mediaGolsFora * 0.40
        )

        +

        (
            ataqueFora * 0.20
        )

        +

        (
            mediaSofridosCasa * 0.20
        )

        +

        (
            defesaCasa * 0.20
        );


    // ----------------------------------------------
    // NORMALIZAÇÃO DOS INDICADORES
    //
    // ataque/defesa podem estar em escala 0-100
    // ou escala próxima de gols.
    // ----------------------------------------------

    let xgCasa =
        baseCasa;


    let xgFora =
        baseFora;


    if (
        ataqueCasa > 10 ||
        ataqueFora > 10 ||
        defesaCasa > 10 ||
        defesaFora > 10
    ) {

        xgCasa =

            (
                ataqueCasa * 0.010
            )

            +

            (
                defesaFora * 0.006
            )

            +

            (
                mediaGolsCasa * 0.35
            );


        xgFora =

            (
                ataqueFora * 0.010
            )

            +

            (
                defesaCasa * 0.006
            )

            +

            (
                mediaGolsFora * 0.35
            );

    }


    // ----------------------------------------------
    // FORMA
    // ----------------------------------------------

    xgCasa *=

        0.85
        +
        (
            limitar(
                formaCasa,
                0,
                100
            )
            / 100
            * 0.30
        );


    xgFora *=

        0.85
        +
        (
            limitar(
                formaFora,
                0,
                100
            )
            / 100
            * 0.30
        );


    // ----------------------------------------------
    // MANDO DE CAMPO
    // ----------------------------------------------

    xgCasa *= 1.08;

    xgFora *= 0.94;


    // ----------------------------------------------
    // LIMITES
    // ----------------------------------------------

    xgCasa =
        limitar(
            xgCasa,
            0.20,
            4.50
        );


    xgFora =
        limitar(
            xgFora,
            0.20,
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
// PROBABILIDADE DE POISSON
// ==================================================

function fatorial(numero) {

    if (numero <= 1) {

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


    // ----------------------------------------------
    // 0x0 até 8x8
    // ----------------------------------------------

    for (
        let golsCasa = 0;
        golsCasa <= 8;
        golsCasa++
    ) {

        for (
            let golsFora = 0;
            golsFora <= 8;
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
                golsCasa > golsFora
            ) {

                probCasa += prob;

            }

            else if (
                golsCasa === golsFora
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
//
// Combina:
//
// 1. XG
// 2. Forma
// 3. H2H
// 4. Mando
//
// H2H recebe peso baixo para não distorcer.
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


    // ----------------------------------------------
    // FORMA
    // ----------------------------------------------

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


    let formaCasaScore =
        formaCasa;


    let formaForaScore =
        formaFora;


    // ----------------------------------------------
    // H2H
    // ----------------------------------------------

    let h2hCasaScore = 33.33;
    let h2hForaScore = 33.33;
    let h2hEmpateScore = 33.34;


    if (
        estatisticas.h2h > 0
    ) {

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

    }


    // ----------------------------------------------
    // FORMA → PROBABILIDADE
    // ----------------------------------------------

    const formaTotal =

        formaCasa +
        formaFora;


    let formaCasaProb = 33.33;
    let formaForaProb = 33.33;


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


    // ----------------------------------------------
    // EMPATE BASE
    // ----------------------------------------------

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


    // ----------------------------------------------
    // COMBINAÇÃO
    //
    // XG = 65%
    // Forma = 25%
    // H2H = 10%
    // ----------------------------------------------

    let casa =

        (
            poissonProb.casa * 0.65
        )

        +

        (
            formaCasaProb * 0.25
        )

        +

        (
            h2hCasaScore * 0.10
        );


    let fora =

        (
            poissonProb.fora * 0.65
        )

        +

        (
            formaForaProb * 0.25
        )

        +

        (
            h2hForaScore * 0.10
        );


    let empate =

        (
            poissonProb.empate * 0.65
        )

        +

        (
            empateForma * 0.25
        )

        +

        (
            h2hEmpateScore * 0.10
        );


    // ----------------------------------------------
    // MANDO DE CAMPO
    //
    // Pequeno ajuste.
    // ----------------------------------------------

    casa *= 1.05;

    fora *= 0.97;


    // ----------------------------------------------
    // NORMALIZAÇÃO
    // ----------------------------------------------

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

            xgCasa: xg.casa,
            xgFora: xg.fora

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


    // ----------------------------------------------
    // LIMITES
    //
    // Evita resultados absurdos.
    // ----------------------------------------------

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


    // ----------------------------------------------
    // NORMALIZA NOVAMENTE
    // ----------------------------------------------

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


    // ----------------------------------------------
    // ARREDONDAMENTO
    // ----------------------------------------------

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


    // ----------------------------------------------
    // GARANTIR 100%
    // ----------------------------------------------

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
        `   H2H: ${estatisticas.h2h}`
    );


    return {

        casa: casaFinal,

        empate: empateFinal,

        fora: foraFinal,

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


    // ------------------------------------------------
    // SOMENTE análise antiga SEM api_id
    // ------------------------------------------------

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
//
// IMPORTANTE:
//
// Antes o sistema encontrava a análise e fazia:
//
// return existente;
//
// Isso fazia a IA nunca recalcular.
//
// Agora:
//
// UPDATE analises
// SET ...
// WHERE api_id = $1
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


    try {

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

    catch (erro) {

        console.error(

            `❌ Erro atualizando análise API ${apiId}:`,
            erro.message

        );


        throw erro;

    }

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
            `${validacao.erro}`

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

        // ==============================================
        // ESTATÍSTICAS
        // ==============================================

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


        // ==============================================
        // XG
        // ==============================================

        const xg =
            calcularXG(
                dados
            );


        // ==============================================
        // PROBABILIDADES
        // ==============================================

        const probabilidades =

            calcularProbabilidades(
                dados
            );


        // ==============================================
        // PLACAR
        // ==============================================

        const placar =

            calcularPlacar(
                dados
            );


        // ==============================================
        // GOLS ESPERADOS
        // ==============================================

        const golsEsperados =

            arredondar(

                xg.casa +
                xg.fora,

                2

            );


        // ==============================================
        // CONFIANÇA
        // ==============================================

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


        // ==============================================
        // OBJETO DA ANÁLISE
        // ==============================================

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
                "BetVision Statistical AI v9.0"

        };


        // ==============================================
        // VERIFICAR SE EXISTE
        // ==============================================

        const existente =

            await buscarAnaliseExistente(
                nomeJogo,
                apiId
            );


        // ==============================================
        // SE EXISTE COM MESMO API ID
        //
        // AGORA ATUALIZA.
        // NÃO RETORNA A ANTIGA.
        // ==============================================

        if (
            existente &&
            Number(
                existente.api_id
            ) === Number(
                apiId
            )
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

                    `✅ Análise atualizada: API ${apiId} ` +
                    `| ID ${atualizada.id}`

                );


                return atualizada;

            }

        }


        // ==============================================
        // ANÁLISE ANTIGA SEM API ID
        //
        // Vincula somente se for realmente antiga.
        // ==============================================

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

                            probabilidade_casa = $2,

                            probabilidade_empate = $3,

                            probabilidade_fora = $4,

                            gols_esperados = $5,

                            placar_previsto = $6,

                            value_bet = $7,

                            confianca = $8,

                            algoritmo = $9,

                            criado_em = CURRENT_TIMESTAMP

                        WHERE

                            id = $10

                        RETURNING *

                        `,

                        [

                            apiId,

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


        // ==============================================
        // CRIAR NOVA
        // ==============================================

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
// LISTAR ANÁLISES DE HOJE
//
// Usa data do jogo e não criado_em.
//
// IMPORTANTE:
// PostgreSQL interpreta CURRENT_DATE no timezone
// configurado na conexão.
//
// Como seu projeto usa America/Sao_Paulo,
// também fazemos conversão explícita.
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
                        j.data_jogo AT TIME ZONE
                        'America/Sao_Paulo'
                    )::date

                    =

                    (
                        CURRENT_TIMESTAMP AT TIME ZONE
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

                    WHERE

                        api_id = $1

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
