// ==================================================
// BETVISION AI
// services/inteligenciaService.js
// Motor Inteligência Estatística v7.0
// PostgreSQL + NeonDB
//
// Correções:
// - Proteção contra análise duplicada
// - Reutilização de análise existente
// - Compatibilidade com tabela analises atual
// - Probabilidades normalizadas para 100%
// - Sem criação de jogos fictícios
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
        proporcaoCasa * 70;


    const foraBruta =
        proporcaoFora * 70;


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
        (diferenca * 0.5);


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
        ) * 100;


    const empate =
        (
            empateBruto /
            totalBruto
        ) * 100;


    const fora =
        (
            foraBruta /
            totalBruto
        ) * 100;


    // ==========================================
    // AJUSTE DE ARREDONDAMENTO
    // ==========================================

    const casaFinal =
        Number(
            limitar(casa)
                .toFixed(2)
        );


    const empateFinal =
        Number(
            limitar(empate)
                .toFixed(2)
        );


    let foraFinal =
        Number(
            limitar(fora)
                .toFixed(2)
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
                probabilidades?.casa || 0
            ),

            Number(
                probabilidades?.empate || 0
            ),

            Number(
                probabilidades?.fora || 0
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
// VERIFICAR ANÁLISE EXISTENTE
//
// A tabela analises atual não possui jogo_id.
// Portanto usamos o nome do jogo.
//
// Isso impede que chamadas repetidas de
// /api/jogos criem milhares de análises iguais.
// ==================================================

async function buscarAnaliseExistente(
    nomeJogo
) {

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
                    criado_em

                FROM analises

                WHERE LOWER(TRIM(jogo))
                    = LOWER(TRIM($1))

                ORDER BY criado_em DESC, id DESC

                LIMIT 1
                `,

                [
                    nomeJogo
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


        return null;

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


    console.log(
        `🤖 Gerando análise: ${nomeJogo}`
    );


    // ==========================================
    // VERIFICAR ANÁLISE EXISTENTE
    // ==========================================

    const existente =
        await buscarAnaliseExistente(
            nomeJogo
        );


    if (
        existente
    ) {

        console.log(

            `♻️ Análise já existente: ${nomeJogo}`

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
    // OBJETO DA ANÁLISE
    // ==========================================

    const analise = {

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
            "BetVision Statistical AI v3.0"

    };


    console.log(
        `🤖 Criando nova análise IA: ${nomeCasa} x ${nomeFora}`
    );


    // ==========================================
    // SALVAR
    // ==========================================

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
        `✅ Análise salva: ${nomeJogo}`
    );


    return salva;

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

                    criado_em

                FROM analises

                ORDER BY criado_em DESC, id DESC
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

    calcularValueBet,

    gerarValueBet

};
