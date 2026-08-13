// ==================================================
// BETVISION AI
// ai/analiseJogo.js
//
// Motor local de análise
// Versão 2.0
//
// IMPORTANTE:
//
// Este arquivo NÃO usa Math.random().
//
// O motor principal do sistema é:
//
// services/inteligenciaService.js
//
// Este módulo existe para manter compatibilidade
// com chamadas antigas do projeto.
// ==================================================

// ==================================================
// NORMALIZAR NÚMERO
// ==================================================

function numeroSeguro(
    valor,
    padrao = 0
) {

    const numero =
        Number(valor);

    return Number.isFinite(
        numero
    )
        ? numero
        : padrao;

}

// ==================================================
// LIMITAR
// ==================================================

function limitar(
    valor,
    minimo,
    maximo
) {

    const numero =
        numeroSeguro(
            valor,
            minimo
        );

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
        numeroSeguro(
            valor,
            0
        ).toFixed(casas)
    );

}

// ==================================================
// NORMALIZAR JOGO
// ==================================================

function normalizarJogo(
    jogo
) {

    if (
        !jogo ||
        typeof jogo !== "object"
    ) {

        throw new Error(
            "Jogo inválido"
        );

    }

    const casa =
        jogo.time_casa ??
        jogo.timeCasa ??
        jogo.casa ??
        jogo.home ??
        jogo.homeTeam?.name;

    const fora =
        jogo.time_fora ??
        jogo.timeFora ??
        jogo.fora ??
        jogo.away ??
        jogo.awayTeam?.name;

    if (
        !casa ||
        !fora
    ) {

        throw new Error(
            "Times do jogo não identificados"
        );

    }

    return {

        casa:
            String(casa)
                .trim(),

        fora:
            String(fora)
                .trim()

    };

}

// ==================================================
// PROBABILIDADE BASE
// ==================================================

function calcularProbabilidadeBase(
    dados = {}
) {

    const forcaCasa =
        limitar(
            dados.forcaCasa ??
            dados.ataqueCasa ??
            dados.formaCasa ??
            50,
            0,
            100
        );

    const forcaFora =
        limitar(
            dados.forcaFora ??
            dados.ataqueFora ??
            dados.formaFora ??
            50,
            0,
            100
        );

    const total =
        forcaCasa +
        forcaFora;

    let casa;
    let fora;

    if (
        total > 0
    ) {

        casa =
            (
                forcaCasa /
                total
            ) * 70;

        fora =
            (
                forcaFora /
                total
            ) * 30;

    }

    else {

        casa = 35;
        fora = 30;

    }

    // Mando de campo

    casa += 8;

    // Empate calculado de acordo
    // com equilíbrio entre as equipes.

    const diferenca =
        Math.abs(
            forcaCasa -
            forcaFora
        );

    let empate =
        30 -
        (
            diferenca *
            0.08
        );

    empate =
        limitar(
            empate,
            18,
            30
        );

    const soma =
        casa +
        empate +
        fora;

    return {

        casa:
            (casa / soma) * 100,

        empate:
            (empate / soma) * 100,

        fora:
            (fora / soma) * 100

    };

}

// ==================================================
// GOLS ESPERADOS
// ==================================================

function calcularGols(
    dados = {}
) {

    const golsCasa =
        numeroSeguro(
            dados.mediaGolsCasa ??
            dados.golsCasa ??
            dados.ataqueCasa,
            1.20
        );

    const golsFora =
        numeroSeguro(
            dados.mediaGolsFora ??
            dados.golsFora ??
            dados.ataqueFora,
            1.10
        );

    const sofridosCasa =
        numeroSeguro(
            dados.mediaGolsSofridosCasa ??
            dados.mediaSofridosCasa,
            1.20
        );

    const sofridosFora =
        numeroSeguro(
            dados.mediaGolsSofridosFora ??
            dados.mediaSofridosFora,
            1.20
        );

    let xgCasa =
        (
            golsCasa * 0.60
        )
        +
        (
            sofridosFora * 0.40
        );

    let xgFora =
        (
            golsFora * 0.60
        )
        +
        (
            sofridosCasa * 0.40
        );

    // Mando

    xgCasa *= 1.08;

    xgFora *= 0.94;

    xgCasa =
        limitar(
            xgCasa,
            0.35,
            4.50
        );

    xgFora =
        limitar(
            xgFora,
            0.35,
            4.50
        );

    return {

        casa:
            arredondar(
                xgCasa
            ),

        fora:
            arredondar(
                xgFora
            ),

        total:
            arredondar(
                xgCasa +
                xgFora
            )

    };

}

// ==================================================
// PREVER PLACAR
// ==================================================

function preverPlacar(
    gols
) {

    const casa =
        Math.max(
            0,
            Math.round(
                numeroSeguro(
                    gols?.casa,
                    1
                )
            )
        );

    const fora =
        Math.max(
            0,
            Math.round(
                numeroSeguro(
                    gols?.fora,
                    1
                )
            )
        );

    return {

        casa,

        fora,

        texto:
            `${casa}x${fora}`

    };

}

// ==================================================
// VALUE BET
//
// Aqui só analisamos probabilidade.
//
// Não usamos "maior que 55%" como
// value bet verdadeiro.
//
// Value Bet real precisa de odd.
// ==================================================

function detectarValor(
    probabilidades,
    odds = {}
) {

    const mercados = [

        {
            nome: "Casa",

            probabilidade:
                probabilidades.casa,

            odd:
                odds.casa
        },

        {
            nome: "Empate",

            probabilidade:
                probabilidades.empate,

            odd:
                odds.empate
        },

        {
            nome: "Fora",

            probabilidade:
                probabilidades.fora,

            odd:
                odds.fora
        }

    ];

    const oportunidades =
        mercados
            .filter(
                mercado => {

                    const odd =
                        Number(
                            mercado.odd
                        );

                    const prob =
                        Number(
                            mercado.probabilidade
                        );

                    if (
                        !Number.isFinite(
                            odd
                        ) ||
                        odd <= 1
                    ) {

                        return false;

                    }

                    if (
                        !Number.isFinite(
                            prob
                        ) ||
                        prob <= 0
                    ) {

                        return false;

                    }

                    const valor =
                        (
                            odd *
                            (
                                prob / 100
                            )
                        ) - 1;

                    return valor > 0.05;

                }
            );

    if (
        oportunidades.length === 0
    ) {

        return {

            possui:
                false,

            mercado:
                null

        };

    }

    const melhor =
        oportunidades
            .sort(
                (
                    a,
                    b
                ) => {

                    const valorA =
                        (
                            Number(a.odd) *
                            (
                                Number(
                                    a.probabilidade
                                ) / 100
                            )
                        ) - 1;

                    const valorB =
                        (
                            Number(b.odd) *
                            (
                                Number(
                                    b.probabilidade
                                ) / 100
                            )
                        ) - 1;

                    return valorB - valorA;

                }
            )[0];

    return {

        possui:
            true,

        mercado:
            melhor.nome,

        odd:
            Number(
                melhor.odd
            ),

        probabilidade:
            Number(
                melhor.probabilidade
            )

    };

}

// ==================================================
// CONFIANÇA
// ==================================================

function calcularConfianca(
    probabilidades
) {

    const maior =
        Math.max(
            probabilidades.casa,
            probabilidades.empate,
            probabilidades.fora
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
// FUNÇÃO PRINCIPAL
// ==================================================

export function analisarJogo(
    jogo,
    dados = {}
) {

    const times =
        normalizarJogo(
            jogo
        );

    const probabilidades =
        calcularProbabilidadeBase(
            dados
        );

    const gols =
        calcularGols(
            dados
        );

    const placar =
        preverPlacar(
            gols
        );

    const valueBet =
        detectarValor(
            probabilidades,
            dados.odds ||
            {}
        );

    const confianca =
        calcularConfianca(
            probabilidades
        );

    return {

        jogo:
            `${times.casa} x ${times.fora}`,

        probabilidadeCasa:
            arredondar(
                probabilidades.casa
            ),

        probabilidadeEmpate:
            arredondar(
                probabilidades.empate
            ),

        probabilidadeFora:
            arredondar(
                probabilidades.fora
            ),

        golsEsperados:
            gols.total,

        xgCasa:
            gols.casa,

        xgFora:
            gols.fora,

        placarPrevisto:
            placar.texto,

        valueBet:
            valueBet.possui,

        mercadoValueBet:
            valueBet.mercado,

        confianca:

            confianca,

        algoritmo:
            "BetVision Statistical AI v2.0"

    };

}

// ==================================================
// EXPORTS
// ==================================================

export default {

    analisarJogo

};
