// ==================================================
// BETVISION AI
// services/inteligenciaService.js
//
// MOTOR ESTATÍSTICO v6
//
// Objetivos:
//
// - Análise estatística real
// - Sem Math.random()
// - Considerar somente jogos de hoje e amanhã
// - Probabilidades 1X2
// - Gols esperados
// - Previsão de placar
// - Over/Under
// - Ambas Marcam
// - Value Bet baseada em odd real
// - Confiança estatística
// - Histórico das equipes quando disponível
// - Compatível PostgreSQL / NeonDB
//
// ==================================================

import {
    query
} from "../database/database.js";


// ==================================================
// CONFIGURAÇÕES
// ==================================================

const TIMEZONE =
    "America/Sao_Paulo";

const LIMITE_JOGOS =
    100;

const MINIMO_JOGOS_HISTORICO =
    3;


// ==================================================
// UTILITÁRIOS
// ==================================================

function numero(valor, padrao = 0) {

    const n =
        Number(valor);

    return Number.isFinite(n)
        ? n
        : padrao;
}


function limitar(
    valor,
    minimo,
    maximo
) {

    return Math.min(
        maximo,
        Math.max(
            minimo,
            valor
        )
    );
}


function arredondar(
    valor,
    casas = 2
) {

    const fator =
        10 ** casas;

    return Math.round(
        valor * fator
    ) / fator;
}


// ==================================================
// DISTRIBUIÇÃO DE POISSON
// ==================================================

function fatorial(n) {

    if (n <= 1) {
        return 1;
    }

    let resultado = 1;

    for (
        let i = 2;
        i <= n;
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
        lambda <= 0 ||
        gols < 0
    ) {

        return 0;

    }

    return (
        Math.exp(-lambda) *
        Math.pow(lambda, gols)
    ) /
        fatorial(gols);
}


// ==================================================
// PROBABILIDADE DE GOLS
// ==================================================

function probabilidadeGolsAte(
    limite,
    lambda
) {

    let probabilidade = 0;

    for (
        let gols = 0;
        gols <= limite;
        gols++
    ) {

        probabilidade +=
            poisson(
                gols,
                lambda
            );

    }

    return probabilidade;
}


// ==================================================
// PROBABILIDADE OVER
// ==================================================

function probabilidadeOver(
    linha,
    lambda
) {

    const limite =
        Math.floor(linha);

    return limitar(
        1 -
        probabilidadeGolsAte(
            limite,
            lambda
        ),
        0,
        1
    );

}


// ==================================================
// PROBABILIDADE UNDER
// ==================================================

function probabilidadeUnder(
    linha,
    lambda
) {

    return limitar(
        1 -
        probabilidadeOver(
            linha,
            lambda
        ),
        0,
        1
    );

}


// ==================================================
// ESTIMAR MÉDIA DA EQUIPE
// ==================================================

function calcularMedia(
    valores
) {

    const lista =
        valores
            .map(numero)
            .filter(
                valor =>
                    Number.isFinite(valor)
            );

    if (
        lista.length === 0
    ) {

        return 0;

    }

    return (
        lista.reduce(
            (total, valor) =>
                total + valor,
            0
        )
        /
        lista.length
    );

}


// ==================================================
// DADOS HISTÓRICOS
// ==================================================

async function buscarHistoricoEquipe(
    nomeEquipe
) {

    if (
        !nomeEquipe
    ) {

        return [];

    }

    try {

        const resultado =
            await query(
                `
                SELECT

                    time_casa,
                    time_fora,
                    gols_casa,
                    gols_fora,
                    data_jogo,
                    status

                FROM jogos

                WHERE
                    (
                        LOWER(time_casa)
                        =
                        LOWER($1)

                        OR

                        LOWER(time_fora)
                        =
                        LOWER($1)
                    )

                    AND data_jogo <
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )

                ORDER BY
                    data_jogo DESC

                LIMIT 10
                `,
                [
                    nomeEquipe
                ]
            );

        return resultado.rows || [];

    }

    catch (erro) {

        console.error(
            "❌ Erro histórico:",
            erro.message
        );

        return [];

    }

}


// ==================================================
// ESTATÍSTICAS DA EQUIPE
// ==================================================

function calcularEstatisticasEquipe(
    historico,
    equipe
) {

    if (
        !Array.isArray(historico)
        ||
        historico.length === 0
    ) {

        return {

            jogos: 0,

            golsMarcados: 0,

            golsSofridos: 0,

            vitorias: 0,

            empates: 0,

            derrotas: 0,

            aproveitamento: 0

        };

    }

    const golsMarcados = [];
    const golsSofridos = [];

    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;

    for (
        const jogo of historico
    ) {

        const casa =
            String(
                jogo.time_casa || ""
            ).trim();

        const fora =
            String(
                jogo.time_fora || ""
            ).trim();

        const golsCasa =
            numero(
                jogo.gols_casa
            );

        const golsFora =
            numero(
                jogo.gols_fora
            );

        const ehCasa =
            casa.toLowerCase()
            ===
            String(equipe)
                .toLowerCase();

        if (ehCasa) {

            golsMarcados.push(
                golsCasa
            );

            golsSofridos.push(
                golsFora
            );

            if (
                golsCasa > golsFora
            ) {

                vitorias++;

            }
            else if (
                golsCasa === golsFora
            ) {

                empates++;

            }
            else {

                derrotas++;

            }

        }
        else {

            golsMarcados.push(
                golsFora
            );

            golsSofridos.push(
                golsCasa
            );

            if (
                golsFora > golsCasa
            ) {

                vitorias++;

            }
            else if (
                golsFora === golsCasa
            ) {

                empates++;

            }
            else {

                derrotas++;

            }

        }

    }

    const jogos =
        historico.length;

    const aproveitamento =
        (
            vitorias * 3 +
            empates
        )
        /
        (jogos * 3);

    return {

        jogos,

        golsMarcados:
            arredondar(
                calcularMedia(
                    golsMarcados
                ),
                3
            ),

        golsSofridos:
            arredondar(
                calcularMedia(
                    golsSofridos
                ),
                3
            ),

        vitorias,

        empates,

        derrotas,

        aproveitamento:
            arredondar(
                aproveitamento,
                4
            )

    };

}


// ==================================================
// FORÇA OFENSIVA
// ==================================================

function calcularForcaOfensiva(
    estatisticas
) {

    if (
        !estatisticas
        ||
        estatisticas.jogos === 0
    ) {

        return 1;

    }

    return limitar(
        estatisticas.golsMarcados,
        0.25,
        4
    );

}


// ==================================================
// FORÇA DEFENSIVA
// ==================================================

function calcularForcaDefensiva(
    estatisticas
) {

    if (
        !estatisticas
        ||
        estatisticas.jogos === 0
    ) {

        return 1;

    }

    return limitar(
        estatisticas.golsSofridos,
        0.25,
        4
    );

}


// ==================================================
// GOLS ESPERADOS
// ==================================================

function calcularGolsEsperados(
    casa,
    fora
) {

    const ataqueCasa =
        calcularForcaOfensiva(
            casa
        );

    const defesaCasa =
        calcularForcaDefensiva(
            casa
        );

    const ataqueFora =
        calcularForcaOfensiva(
            fora
        );

    const defesaFora =
        calcularForcaDefensiva(
            fora
        );


    let lambdaCasa =
        (
            ataqueCasa +
            defesaFora
        )
        /
        2;


    let lambdaFora =
        (
            ataqueFora +
            defesaCasa
        )
        /
        2;


    // ==============================================
    // MANDO DE CAMPO
    // ==============================================

    lambdaCasa *= 1.10;

    lambdaFora *= 0.95;


    // ==============================================
    // LIMITES DE SEGURANÇA
    // ==============================================

    lambdaCasa =
        limitar(
            lambdaCasa,
            0.20,
            4.50
        );

    lambdaFora =
        limitar(
            lambdaFora,
            0.20,
            4.50
        );


    return {

        casa:
            arredondar(
                lambdaCasa,
                2
            ),

        fora:
            arredondar(
                lambdaFora,
                2
            ),

        total:
            arredondar(
                lambdaCasa +
                lambdaFora,
                2
            )

    };

}


// ==================================================
// PROBABILIDADE 1X2
// ==================================================

function calcularProbabilidadesResultado(
    golsCasa,
    golsFora
) {

    let casa = 0;
    let empate = 0;
    let fora = 0;


    const MAX_GOLS = 7;


    for (
        let gc = 0;
        gc <= MAX_GOLS;
        gc++
    ) {

        for (
            let gf = 0;
            gf <= MAX_GOLS;
            gf++
        ) {

            const prob =
                poisson(
                    gc,
                    golsCasa
                )
                *
                poisson(
                    gf,
                    golsFora
                );


            if (
                gc > gf
            ) {

                casa += prob;

            }
            else if (
                gc === gf
            ) {

                empate += prob;

            }
            else {

                fora += prob;

            }

        }

    }


    const total =
        casa +
        empate +
        fora;


    if (
        total <= 0
    ) {

        return {

            casa: 0.3333,

            empate: 0.3333,

            fora: 0.3334

        };

    }


    return {

        casa:
            casa / total,

        empate:
            empate / total,

        fora:
            fora / total

    };

}


// ==================================================
// PLACAR MAIS PROVÁVEL
// ==================================================

function preverPlacar(
    golsCasa,
    golsFora
) {

    let melhorPlacar =
        "0x0";

    let maiorProbabilidade =
        0;


    for (
        let gc = 0;
        gc <= 6;
        gc++
    ) {

        for (
            let gf = 0;
            gf <= 6;
            gf++
        ) {

            const prob =
                poisson(
                    gc,
                    golsCasa
                )
                *
                poisson(
                    gf,
                    golsFora
                );


            if (
                prob >
                maiorProbabilidade
            ) {

                maiorProbabilidade =
                    prob;

                melhorPlacar =
                    `${gc}x${gf}`;

            }

        }

    }


    return {

        placar:
            melhorPlacar,

        probabilidade:
            arredondar(
                maiorProbabilidade * 100,
                2
            )

    };

}


// ==================================================
// AMBAS MARCAM
// ==================================================

function calcularAmbasMarcam(
    golsCasa,
    golsFora
) {

    const casaNaoMarca =
        poisson(
            0,
            golsCasa
        );

    const foraNaoMarca =
        poisson(
            0,
            golsFora
        );


    const probabilidade =
        1 -
        casaNaoMarca -
        foraNaoMarca +
        (
            casaNaoMarca *
            foraNaoMarca
        );


    return limitar(
        probabilidade,
        0,
        1
    );

}


// ==================================================
// CONFIANÇA
// ==================================================

function calcularConfianca(
    probabilidades,
    amostra
) {

    const maior =
        Math.max(
            probabilidades.casa,
            probabilidades.empate,
            probabilidades.fora
        );


    const margem =
        maior -
        Math.max(
            ...[
                probabilidades.casa,
                probabilidades.empate,
                probabilidades.fora
            ].filter(
                valor =>
                    valor !== maior
            )
        );


    let confianca =
        35;


    confianca +=
        margem * 100;


    if (
        amostra >= 8
    ) {

        confianca += 10;

    }
    else if (
        amostra >= 5
    ) {

        confianca += 5;

    }


    confianca =
        limitar(
            confianca,
            20,
            95
        );


    let nivel =
        "Baixa";


    if (
        confianca >= 70
    ) {

        nivel =
            "Alta";

    }
    else if (
        confianca >= 50
    ) {

        nivel =
            "Média";

    }


    return {

        percentual:
            arredondar(
                confianca,
                1
            ),

        nivel

    };

}


// ==================================================
// PROBABILIDADE IMPLÍCITA DA ODD
// ==================================================

function probabilidadeImplicita(
    odd
) {

    const valor =
        numero(odd);


    if (
        valor <= 1
    ) {

        return 0;

    }


    return 1 / valor;

}


// ==================================================
// VALUE BET
// ==================================================

function calcularValueBet(
    probabilidade,
    odd
) {

    const oddNumerica =
        numero(odd);


    if (
        oddNumerica <= 1 ||
        probabilidade <= 0
    ) {

        return {

            valueBet: false,

            valor:
                0,

            edge:
                0,

            oddJusta:
                0

        };

    }


    const probabilidadeMercado =
        probabilidadeImplicita(
            oddNumerica
        );


    const edge =
        probabilidade -
        probabilidadeMercado;


    const valorEstimado =
        (
            probabilidade *
            oddNumerica
        ) - 1;


    const oddJusta =
        1 /
        probabilidade;


    return {

        valueBet:
            edge >= 0.05,

        valor:
            arredondar(
                valorEstimado * 100,
                2
            ),

        edge:
            arredondar(
                edge * 100,
                2
            ),

        oddJusta:
            arredondar(
                oddJusta,
                2
            )

    };

}


// ==================================================
// EXTRAIR EQUIPES
// ==================================================

function separarJogo(
    jogo
) {

    if (
        typeof jogo !== "string"
    ) {

        return {

            casa: "",

            fora: ""

        };

    }


    const separadores = [
        " x ",
        " X ",
        " vs ",
        " VS ",
        " v ",
        " - "
    ];


    for (
        const separador
        of separadores
    ) {

        if (
            jogo.includes(
                separador
            )
        ) {

            const partes =
                jogo.split(
                    separador
                );


            return {

                casa:
                    partes[0]
                        ?.trim() || "",

                fora:
                    partes
                        .slice(1)
                        .join(
                            separador
                        )
                        .trim() || ""

            };

        }

    }


    return {

        casa:
            jogo.trim(),

        fora:
            ""

    };

}


// ==================================================
// ANALISAR JOGO
// ==================================================

export async function analisarMercado(
    jogo,
    dados = {}
) {

    const equipes =
        separarJogo(
            jogo
        );


    const historicoCasa =
        await buscarHistoricoEquipe(
            equipes.casa
        );


    const historicoFora =
        await buscarHistoricoEquipe(
            equipes.fora
        );


    const estatisticasCasa =
        calcularEstatisticasEquipe(
            historicoCasa,
            equipes.casa
        );


    const estatisticasFora =
        calcularEstatisticasEquipe(
            historicoFora,
            equipes.fora
        );


    const gols =
        calcularGolsEsperados(
            estatisticasCasa,
            estatisticasFora
        );


    const probabilidades =
        calcularProbabilidadesResultado(
            gols.casa,
            gols.fora
        );


    const placar =
        preverPlacar(
            gols.casa,
            gols.fora
        );


    const ambasMarcam =
        calcularAmbasMarcam(
            gols.casa,
            gols.fora
        );


    const over15 =
        probabilidadeOver(
            1.5,
            gols.total
        );


    const over25 =
        probabilidadeOver(
            2.5,
            gols.total
        );


    const over35 =
        probabilidadeOver(
            3.5,
            gols.total
        );


    const under25 =
        probabilidadeUnder(
            2.5,
            gols.total
        );


    const amostra =
        Math.min(
            estatisticasCasa.jogos,
            estatisticasFora.jogos
        );


    const confianca =
        calcularConfianca(
            probabilidades,
            amostra
        );


    // ==============================================
    // ODDS RECEBIDAS
    // ==============================================

    const odds =
        dados?.odds || {};


    const valueCasa =
        calcularValueBet(
            probabilidades.casa,
            odds.casa
        );


    const valueEmpate =
        calcularValueBet(
            probabilidades.empate,
            odds.empate
        );


    const valueFora =
        calcularValueBet(
            probabilidades.fora,
            odds.fora
        );


    const valueBets = [];


    if (
        valueCasa.valueBet
    ) {

        valueBets.push({

            mercado:
                "1X2",

            selecao:
                "Casa",

            odd:
                numero(
                    odds.casa
                ),

            probabilidade:
                arredondar(
                    probabilidades.casa * 100,
                    2
                ),

            edge:
                valueCasa.edge,

            valorEstimado:
                valueCasa.valor

        });

    }


    if (
        valueEmpate.valueBet
    ) {

        valueBets.push({

            mercado:
                "1X2",

            selecao:
                "Empate",

            odd:
                numero(
                    odds.empate
                ),

            probabilidade:
                arredondar(
                    probabilidades.empate * 100,
                    2
                ),

            edge:
                valueEmpate.edge,

            valorEstimado:
                valueEmpate.valor

        });

    }


    if (
        valueFora.valueBet
    ) {

        valueBets.push({

            mercado:
                "1X2",

            selecao:
                "Fora",

            odd:
                numero(
                    odds.fora
                ),

            probabilidade:
                arredondar(
                    probabilidades.fora * 100,
                    2
                ),

            edge:
                valueFora.edge,

            valorEstimado:
                valueFora.valor

        });

    }


    return {

        sucesso:
            true,

        algoritmo:
            "BetVision AI Motor Estatístico v6",

        jogo: {

            nome:
                jogo,

            casa:
                equipes.casa,

            fora:
                equipes.fora

        },

        dataAnalise:
            new Date(),

        probabilidades: {

            casa:
                arredondar(
                    probabilidades.casa * 100,
                    2
                ),

            empate:
                arredondar(
                    probabilidades.empate * 100,
                    2
                ),

            fora:
                arredondar(
                    probabilidades.fora * 100,
                    2
                )

        },

        golsEsperados: {

            casa:
                gols.casa,

            fora:
                gols.fora,

            total:
                gols.total

        },

        placarPrevisto:
            placar.placar,

        probabilidadePlacar:
            placar.probabilidade,

        mercados: {

            over15:
                arredondar(
                    over15 * 100,
                    2
                ),

            over25:
                arredondar(
                    over25 * 100,
                    2
                ),

            over35:
                arredondar(
                    over35 * 100,
                    2
                ),

            under25:
                arredondar(
                    under25 * 100,
                    2
                ),

            ambasMarcam:
                arredondar(
                    ambasMarcam * 100,
                    2
                )

        },

        estatisticas: {

            casa:
                estatisticasCasa,

            fora:
                estatisticasFora,

            amostra:
                amostra

        },

        valueBets,

        confianca,

        qualidadeDados:
            amostra >= MINIMO_JOGOS_HISTORICO
                ? "Boa"
                : "Limitada"

    };

}


// ==================================================
// GERAR ANÁLISE IA
// ==================================================

export async function gerarAnaliseIA(
    jogo,
    dados = {}
) {

    return await analisarMercado(
        jogo,
        dados
    );

}


// ==================================================
// LISTAR ANÁLISES
//
// SOMENTE:
//
// HOJE
// +
// AMANHÃ
//
// America/Sao_Paulo
// ==================================================

export async function listarAnalises() {

    try {

        const resultado =
            await query(
                `
                SELECT

                    id,

                    jogo_id,

                    jogo,

                    data_jogo,

                    probabilidades,

                    gols_esperados,

                    placar_previsto,

                    confianca,

                    criado_em

                FROM analises

                WHERE

                    DATE(
                        data_jogo
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )
                    BETWEEN

                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )::date

                    AND

                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )::date + 1

                ORDER BY
                    data_jogo ASC

                LIMIT $1
                `,
                [
                    LIMITE_JOGOS
                ]
            );


        return resultado.rows || [];

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
// EXPORT DEFAULT
// ==================================================

export default {

    analisarMercado,

    gerarAnaliseIA,

    listarAnalises

};
