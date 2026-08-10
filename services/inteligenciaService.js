// ==================================================
// BETVISION AI
// services/inteligenciaService.js
// Motor Inteligência Estatística v6.0
// Compatível com PostgreSQL NeonDB
// Estrutura atual da tabela analises
// ==================================================

import {
    salvarAnalise,
    salvarValueBet
} from "./bancoService.js";


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

        (Number(ataqueCasa) * 0.30)

        +

        (Number(defesaFora) * 0.20)

        +

        (Number(formaCasa) * 0.30)

        +

        (Number(mediaGolsCasa) * 10);


    const forcaFora =

        (Number(ataqueFora) * 0.30)

        +

        (Number(defesaCasa) * 0.20)

        +

        (Number(formaFora) * 0.30)

        +

        (Number(mediaGolsFora) * 10);


    const total =
        forcaCasa + forcaFora;


    if (
        total <= 0
    ) {

        return {

            casa: 33.33,

            empate: 33.34,

            fora: 33.33

        };

    }


    const casa =

        (forcaCasa / total) * 70;


    const fora =

        (forcaFora / total) * 70;


    const empate =

        30 -
        Math.abs(casa - fora) / 2;


    return {

        casa:
            Number(
                limitar(casa)
                    .toFixed(2)
            ),

        empate:
            Number(
                limitar(empate)
                    .toFixed(2)
            ),

        fora:
            Number(
                limitar(fora)
                    .toFixed(2)
            )

    };

}


// ==================================================
// PLACAR PREVISTO
// ==================================================

export function calcularPlacar(
    dados = {}
) {

    const golsCasa =
        Number(
            dados.mediaGolsCasa
        );

    const golsFora =
        Number(
            dados.mediaGolsFora
        );


    return {

        casa:
            Math.max(
                0,
                Math.round(
                    Number.isFinite(
                        golsCasa
                    )
                        ? golsCasa
                        : 1
                )
            ),

        fora:
            Math.max(
                0,
                Math.round(
                    Number.isFinite(
                        golsFora
                    )
                        ? golsFora
                        : 1
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


    const probabilidades =
        calcularProbabilidades(
            dados
        );


    const placar =
        calcularPlacar(
            dados
        );


    // ==================================================
    // IMPORTANTE
    // A tabela analises NÃO possui jogo_id.
    // Portanto NÃO enviar jogo_id.
    // ==================================================

    const nomeCasa =
        jogo.time_casa ||
        jogo.casa ||
        "Casa";


    const nomeFora =
        jogo.time_fora ||
        jogo.fora ||
        "Fora";


    const nomeJogo =
        `${nomeCasa} x ${nomeFora}`;


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
            Number(

                (

                    Number(
                        dados.mediaGolsCasa || 1
                    )

                    +

                    Number(
                        dados.mediaGolsFora || 1
                    )

                )

                .toFixed(2)

            ),

        placar_previsto:
            `${placar.casa}x${placar.fora}`,

        value_bet:
            false,

        confianca:
            calcularConfianca(
                probabilidades
            ),

        algoritmo:
            "BetVision Statistical AI v2.0"

    };


    console.log(
        `🤖 Gerando análise IA: ${nomeJogo}`
    );


    return await salvarAnalise(
        analise
    );

}


// ==================================================
// ANALISAR MERCADO
// COMPATIBILIDADE
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

        const modulo =
            await import(
                "./bancoService.js"
            );


        const resultado =
            await modulo.listarAnalises();


        return Array.isArray(
            resultado
        )
            ? resultado
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
        !Number.isFinite(oddNumero) ||
        !Number.isFinite(probabilidadeNumero) ||
        oddNumero <= 0 ||
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


    // ==================================================
    // ATENÇÃO
    // A tabela value_bets e valuebets possuem
    // estruturas diferentes no projeto.
    //
    // Mantemos a compatibilidade com salvarValueBet(),
    // mas não usamos jogo_id na tabela analises.
    // ==================================================

    return await salvarValueBet({

        jogo_id:
            jogo?.id || null,

        jogo:
            jogo
                ? `${jogo.time_casa || "Casa"} x ${jogo.time_fora || "Fora"}`
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
