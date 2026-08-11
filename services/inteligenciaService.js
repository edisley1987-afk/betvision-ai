// ==================================================
// BETVISION AI
// services/inteligenciaService.js
// Motor Inteligência Estatística v8.0
// PostgreSQL + NeonDB
//
// CORREÇÕES:
// - Usa api_id como identificador único da análise
// - Não usa mais nome do jogo para identificar análise
// - Reutiliza análise existente pelo api_id
// - Compatível com índice UNIQUE(api_id)
// - Compatível com tabela analises atual
// - Probabilidades normalizadas para 100%
// - Sem criação de jogos fictícios
// - Rejeita jogos sem api_id válido
// - Mantém compatibilidade com análises antigas sem api_id
// ==================================================

import {
    salvarAnalise,
    salvarValueBet
} from "./bancoService.js";

import {
    query
} from "../database/database.js";


// ==================================================
// LIMITADOR
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
// NORMALIZAR NÚMERO
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
// PROBABILIDADES
// ==================================================

export function calcularProbabilidades(
    dados = {}
) {

    const {

        ataqueCasa = 50,

        defesaCasa = 50,

        ataqueFora = 50,

        defesaFora = 50,

        formaCasa = 50,

        formaFora = 50,

        mediaGolsCasa = 1,

        mediaGolsFora = 1

    } = dados;


    const forcaCasa =

        (
            numeroSeguro(
                ataqueCasa,
                50
            ) * 0.30
        )

        +

        (
            numeroSeguro(
                defesaFora,
                50
            ) * 0.20
        )

        +

        (
            numeroSeguro(
                formaCasa,
                50
            ) * 0.30
        )

        +

        (
            numeroSeguro(
                mediaGolsCasa,
                1
            ) * 10
        );


    const forcaFora =

        (
            numeroSeguro(
                ataqueFora,
                50
            ) * 0.30
        )

        +

        (
            numeroSeguro(
                defesaCasa,
                50
            ) * 0.20
        )

        +

        (
            numeroSeguro(
                formaFora,
                50
            ) * 0.30
        )

        +

        (
            numeroSeguro(
                mediaGolsFora,
                1
            ) * 10
        );


    const totalForcas =
        forcaCasa +
        forcaFora;


    if (
        totalForcas <= 0
    ) {

        return {

            casa: 33.33,

            empate: 33.34,

            fora: 33.33

        };

    }


    // ==========================================
    // PROBABILIDADE BASE
    // ==========================================

    const proporcaoCasa =
        forcaCasa /
        totalForcas;


    const proporcaoFora =
        forcaFora /
        totalForcas;


    // ==========================================
    // DISTRIBUIR 70% ENTRE CASA/FORA
    // ==========================================

    const casaBruta =
        proporcaoCasa *
        70;


    const foraBruta =
        proporcaoFora *
        70;


    // ==========================================
    // EMPATE
    // ==========================================

    const diferenca =
        Math.abs(
            casaBruta -
            foraBruta
        );


    let empateBruto =
        30 -
        (
            diferenca *
            0.5
        );


    empateBruto =
        limitar(
            empateBruto,
            10,
            30
        );


    // ==========================================
    // NORMALIZAÇÃO FINAL
    // Garante soma = 100%
    // ==========================================

    const totalBruto =

        casaBruta +
        empateBruto +
        foraBruta;


    if (
        totalBruto <= 0
    ) {

        return {

            casa: 33.33,

            empate: 33.34,

            fora: 33.33

        };

    }


    const casa =
        (
            casaBruta /
            totalBruto
        ) *
        100;


    const empate =
        (
            empateBruto /
            totalBruto
        ) *
        100;


    const fora =
        (
            foraBruta /
            totalBruto
        ) *
        100;


    // ==========================================
    // AJUSTE DE ARREDONDAMENTO
    // ==========================================

    const casaFinal =
        Number(
            limitar(
                casa
            ).toFixed(2)
        );


    const empateFinal =
        Number(
            limitar(
                empate
            ).toFixed(2)
        );


    let foraFinal =
        Number(
            limitar(
                fora
            ).toFixed(2)
        );


    const soma =
        casaFinal +
        empateFinal +
        foraFinal;


    const ajuste =
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
                ajuste
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
// PLACAR PREVISTO
// ==================================================

export function calcularPlacar(
    dados = {}
) {

    const golsCasa =
        numeroSeguro(
            dados.mediaGolsCasa,
            1
        );


    const golsFora =
        numeroSeguro(
            dados.mediaGolsFora,
            1
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
            )

    };

}


// ==================================================
// CONFIANÇA
// ==================================================

export function calcularConfianca(
    probabilidades
) {

    const maior =
        Math.max(

            Number(
                probabilidades?.casa ||
                0
            ),

            Number(
                probabilidades?.empate ||
                0
            ),

            Number(
                probabilidades?.fora ||
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
// NORMALIZAR NOME DO JOGO
// ==================================================

function obterNomeJogo(
    jogo
) {

    const nomeCasa =
        jogo?.time_casa ||
        jogo?.casa ||
        jogo?.homeTeam?.name ||
        null;


    const nomeFora =
        jogo?.time_fora ||
        jogo?.fora ||
        jogo?.awayTeam?.name ||
        null;


    if (
        !nomeCasa ||
        !nomeFora
    ) {

        throw new Error(
            "Não foi possível identificar os times do jogo"
        );

    }


    return {

        nomeCasa,

        nomeFora,

        nomeJogo:
            `${nomeCasa} x ${nomeFora}`

    };

}


// ==================================================
// OBTER API ID DO JOGO
// ==================================================

function obterApiId(
    jogo
) {

    const apiId =
        normalizarApiId(

            jogo?.api_id ??
            jogo?.apiId ??
            jogo?.external_id ??
            jogo?.externalId

        );


    if (
        !apiId
    ) {

        throw new Error(
            "Jogo não possui api_id válido"
        );

    }


    return apiId;

}


// ==================================================
// VERIFICAR ANÁLISE EXISTENTE
//
// REGRA:
//
// 1 api_id = 1 análise
//
// O nome do jogo NÃO é mais utilizado
// como identificador.
// ==================================================

async function buscarAnaliseExistente(
    api_id
) {

    const apiId =
        normalizarApiId(
            api_id
        );


    if (
        !apiId
    ) {

        return null;

    }


    try {

        const resultado =
            await query(

                `
                SELECT

                    id,

                    jogo,

                    probabilidade_casa,

                    probabilidade_empate,

                    probabilidade_fora,

                    gols_esperados,

                    placar_previsto,

                    value_bet,

                    confianca,

                    algoritmo,

                    criado_em,

                    api_id

                FROM analises

                WHERE api_id = $1

                LIMIT 1
                `,

                [

                    apiId

                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(

            "❌ Erro verificando análise existente:",

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

    if (
        !jogo
    ) {

        throw new Error(
            "Jogo é obrigatório para gerar análise"
        );

    }


    // ==========================================
    // IDENTIFICAR JOGO
    // ==========================================

    const {

        nomeCasa,

        nomeFora,

        nomeJogo

    } =
        obterNomeJogo(
            jogo
        );


    // ==========================================
    // IDENTIFICAR API ID
    // ==========================================

    const apiId =
        obterApiId(
            jogo
        );


    console.log(
        `🤖 Analisando: ${nomeJogo} (API ${apiId})`
    );


    // ==========================================
    // VERIFICAR ANÁLISE EXISTENTE
    // ==========================================

    const existente =
        await buscarAnaliseExistente(
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

        console.log(

            `♻️ ID da análise: ${existente.id}`

        );


        return existente;

    }


    // ==========================================
    // CALCULAR PROBABILIDADES
    // ==========================================

    const probabilidades =
        calcularProbabilidades(
            dados
        );


    // ==========================================
    // CALCULAR PLACAR
    // ==========================================

    const placar =
        calcularPlacar(
            dados
        );


    // ==========================================
    // GOLS ESPERADOS
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
                mediaCasa +
                mediaFora
            ).toFixed(2)

        );


    // ==========================================
    // CONFIANÇA
    // ==========================================

    const confianca =
        calcularConfianca(
            probabilidades
        );


    // ==========================================
    // OBJETO DA ANÁLISE
    // ==========================================

    const analise = {

        jogo:
            nomeJogo,

        api_id:
            apiId,

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
            "BetVision Statistical AI v3.0"

    };


    console.log(

        `🤖 Criando análise IA: ${nomeCasa} x ${nomeFora} (API ${apiId})`

    );


    // ==========================================
    // SALVAR
    //
    // bancoService.js utiliza:
    //
    // UNIQUE(api_id)
    //
    // para impedir duplicação.
    // ==========================================

    try {

        const salva =
            await salvarAnalise(
                analise
            );


        if (
            !salva
        ) {

            throw new Error(
                "Não foi possível salvar a análise"
            );

        }


        console.log(

            `✅ Análise salva: ${nomeJogo} (API ${apiId})`

        );


        return salva;

    }

    catch (erro) {

        // ======================================
        // CONCORRÊNCIA
        //
        // Caso outra requisição tenha criado
        // a análise entre a verificação acima
        // e o INSERT, buscamos novamente.
        // ======================================

        console.warn(

            `⚠️ Não foi possível inserir análise ${apiId}: ${erro.message}`

        );


        const recuperada =
            await buscarAnaliseExistente(
                apiId
            );


        if (
            recuperada
        ) {

            console.log(

                `♻️ Análise recuperada após concorrência: API ${apiId}`

            );


            return recuperada;

        }


        throw erro;

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
// ==================================================

export async function listarAnalises() {

    try {

        const resultado =
            await query(

                `
                SELECT

                    id,

                    jogo,

                    probabilidade_casa,

                    probabilidade_empate,

                    probabilidade_fora,

                    gols_esperados,

                    placar_previsto,

                    value_bet,

                    confianca,

                    algoritmo,

                    criado_em,

                    api_id

                FROM analises

                ORDER BY

                    criado_em DESC,

                    id DESC
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
// BUSCAR ANÁLISE POR API ID
// ==================================================

export async function buscarAnalisePorApiId(
    api_id
) {

    const apiId =
        normalizarApiId(
            api_id
        );


    if (
        !apiId
    ) {

        return null;

    }


    try {

        const resultado =
            await query(

                `
                SELECT

                    id,

                    jogo,

                    probabilidade_casa,

                    probabilidade_empate,

                    probabilidade_fora,

                    gols_esperados,

                    placar_previsto,

                    value_bet,

                    confianca,

                    algoritmo,

                    criado_em,

                    api_id

                FROM analises

                WHERE api_id = $1

                LIMIT 1
                `,

                [

                    apiId

                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(

            "❌ Erro buscando análise por api_id:",

            erro.message

        );


        return null;

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

    ) {

        return {

            valor: 0,

            possui: false

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


    return await salvarValueBet({

        jogo_id:
            jogo?.id ||
            jogo?.api_id ||
            null,

        jogo:
            jogo
                ? `${jogo.time_casa || jogo.casa || "Casa"} x ${jogo.time_fora || jogo.fora || "Fora"}`
                : "Jogo não informado",

        mercado,

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
// EXPORT FINAL
// ==================================================

export default {

    calcularProbabilidades,

    calcularPlacar,

    calcularConfianca,

    gerarAnaliseIA,

    analisarMercado,

    listarAnalises,

    buscarAnalisePorApiId,

    calcularValueBet,

    gerarValueBet

};
