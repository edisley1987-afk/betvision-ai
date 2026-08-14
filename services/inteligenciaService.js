// ==================================================
// BETVISION AI
// services/inteligenciaService.js
//
// MOTOR ESTATÍSTICO v7.0
//
// CORREÇÕES:
//
// - Sem Math.random()
// - Histórico real do PostgreSQL
// - Histórico NÃO é apagado
// - Jogos atuais não contaminam histórico
// - Probabilidade 1X2
// - Gols esperados
// - Placar provável
// - Over / Under
// - Ambas Marcam
// - Value Bet
// - Confiança
// - Qualidade dos dados
// - API ID preservado quando fornecido
// - Timezone America/Sao_Paulo
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

const MAX_HISTORICO =
    10;

const MAX_GOLS =
    8;


// ==================================================
// UTILITÁRIOS
// ==================================================

function numero(
    valor,
    padrao = 0
) {

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
// DATA BRASIL
// ==================================================

function obterDataHojeBrasil() {

    try {

        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: TIMEZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(
            new Date()
        );

    }
    catch {

        return new Date()
            .toISOString()
            .slice(0, 10);

    }

}


// ==================================================
// FATORIAL
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


// ==================================================
// POISSON
// ==================================================

function poisson(
    gols,
    lambda
) {

    if (
        gols < 0 ||
        lambda <= 0
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
// PROBABILIDADE DE GOLS ATÉ LIMITE
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


    return limitar(
        probabilidade,
        0,
        1
    );

}


// ==================================================
// OVER
//
// Para Over 2.5:
//
// P(3+)
//
// Para Over 1.5:
//
// P(2+)
// ==================================================

function probabilidadeOver(
    linha,
    lambda
) {

    const limite =
        Math.floor(
            linha
        );


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
// UNDER
// ==================================================

function probabilidadeUnder(
    linha,
    lambda
) {

    const limite =
        Math.floor(
            linha
        );


    return limitar(
        probabilidadeGolsAte(
            limite,
            lambda
        ),
        0,
        1
    );

}


// ==================================================
// MÉDIA
// ==================================================

function calcularMedia(
    valores
) {

    if (!Array.isArray(valores)) {

        return 0;

    }


    const lista =
        valores
            .map(
                valor =>
                    numero(
                        valor,
                        NaN
                    )
            )
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
            (
                total,
                valor
            ) =>
                total + valor,
            0
        )
        /
        lista.length
    );

}


// ==================================================
// SEPARAR JOGO
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


    const texto =
        jogo.trim();


    const separadores = [

        " x ",
        " X ",
        " vs ",
        " VS ",
        " v ",
        " V ",
        " - "

    ];


    for (
        const separador
        of separadores
    ) {

        const indice =
            texto.indexOf(
                separador
            );


        if (
            indice !== -1
        ) {

            return {

                casa:
                    texto
                        .slice(
                            0,
                            indice
                        )
                        .trim(),

                fora:
                    texto
                        .slice(
                            indice +
                            separador.length
                        )
                        .trim()

            };

        }

    }


    return {

        casa:
            texto,

        fora:
            ""

    };

}


// ==================================================
// HISTÓRICO DA EQUIPE
//
// Somente partidas anteriores.
//
// A IA pode utilizar ontem,
// semana passada, mês passado etc.
//
// Jogos futuros nunca entram.
// ==================================================

async function buscarHistoricoEquipe(
    nomeEquipe
) {

    if (
        !nomeEquipe ||
        typeof nomeEquipe !== "string"
    ) {

        return [];

    }


    try {

        const resultado =
            await query(

                `

                SELECT

                    id,

                    api_id,

                    time_casa,

                    time_fora,

                    gols_casa,

                    gols_fora,

                    data_jogo,

                    status

                FROM jogos

                WHERE

                    (

                        LOWER(
                            TRIM(time_casa)
                        )
                        =
                        LOWER(
                            TRIM($1::text)
                        )

                        OR

                        LOWER(
                            TRIM(time_fora)
                        )
                        =
                        LOWER(
                            TRIM($1::text)
                        )

                    )

                    AND

                    data_jogo IS NOT NULL

                    AND

                    (

                        data_jogo
                        AT TIME ZONE
                        $2

                    )::date

                    <

                    $3::date

                    AND

                    gols_casa IS NOT NULL

                    AND

                    gols_fora IS NOT NULL

                ORDER BY

                    data_jogo DESC

                LIMIT $4

                `,

                [

                    nomeEquipe,

                    TIMEZONE,

                    obterDataHojeBrasil(),

                    MAX_HISTORICO

                ]

            );


        return (
            resultado.rows || []
        );

    }
    catch (erro) {

        console.error(
            `❌ Erro histórico ${nomeEquipe}:`,
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

    const resultadoBase = {

        jogos: 0,

        golsMarcados: 0,

        golsSofridos: 0,

        vitorias: 0,

        empates: 0,

        derrotas: 0,

        aproveitamento: 0

    };


    if (
        !Array.isArray(historico) ||
        historico.length === 0
    ) {

        return resultadoBase;

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
                jogo.gols_casa,
                NaN
            );


        const golsFora =
            numero(
                jogo.gols_fora,
                NaN
            );


        if (
            !Number.isFinite(golsCasa) ||
            !Number.isFinite(golsFora)
        ) {

            continue;

        }


        const ehCasa =
            casa.toLowerCase()
            ===
            String(equipe)
                .trim()
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
        golsMarcados.length;


    if (
        jogos === 0
    ) {

        return resultadoBase;

    }


    const aproveitamento =
        (
            vitorias * 3 +
            empates
        )
        /
        (
            jogos * 3
        );


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
        !estatisticas ||
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
//
// Quanto mais gols sofre,
// maior é a vulnerabilidade.
//
// É utilizada diretamente na combinação
// para estimar gols do adversário.
// ==================================================

function calcularForcaDefensiva(
    estatisticas
) {

    if (
        !estatisticas ||
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


    // ----------------------------------------------
    // Combinação ataque x defesa
    // ----------------------------------------------

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


    // ----------------------------------------------
    // Mando de campo
    // ----------------------------------------------

    lambdaCasa *= 1.10;

    lambdaFora *= 0.95;


    // ----------------------------------------------
    // Limites
    // ----------------------------------------------

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
// PROBABILIDADES 1X2
// ==================================================

function calcularProbabilidadesResultado(
    golsCasa,
    golsFora
) {

    let casa = 0;
    let empate = 0;
    let fora = 0;


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

            casa:
                1 / 3,

            empate:
                1 / 3,

            fora:
                1 / 3

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
        gc <= 7;
        gc++
    ) {

        for (
            let gf = 0;
            gf <= 7;
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

    const valores = [

        probabilidades.casa,

        probabilidades.empate,

        probabilidades.fora

    ];


    const ordenados =
        [...valores]
            .sort(
                (a, b) =>
                    b - a
            );


    const maior =
        ordenados[0] ?? 0;


    const segundo =
        ordenados[1] ?? 0;


    const margem =
        Math.max(
            0,
            maior - segundo
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
    else if (
        amostra >= 3
    ) {

        confianca += 2;

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
// ODD -> PROBABILIDADE IMPLÍCITA
// ==================================================

function probabilidadeImplicita(
    odd
) {

    const valor =
        numero(
            odd
        );


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
        numero(
            odd
        );


    if (
        oddNumerica <= 1 ||
        probabilidade <= 0
    ) {

        return {

            valueBet: false,

            valor: 0,

            edge: 0,

            oddJusta: 0

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
// NORMALIZAR ODDS
// ==================================================

function extrairOdds(
    dados
) {

    const odds =
        dados?.odds || {};


    return {

        casa:
            numero(
                odds.casa,
                0
            ),

        empate:
            numero(
                odds.empate,
                0
            ),

        fora:
            numero(
                odds.fora,
                0
            )

    };

}


// ==================================================
// ANALISAR MERCADO
// ==================================================

export async function analisarMercado(
    jogo,
    dados = {}
) {

    if (
        typeof jogo !== "string" ||
        !jogo.trim()
    ) {

        throw new Error(
            "Jogo não informado"
        );

    }


    const nomeJogo =
        jogo.trim();


    const equipes =
        separarJogo(
            nomeJogo
        );


    if (
        !equipes.casa ||
        !equipes.fora
    ) {

        throw new Error(
            "Não foi possível identificar os dois times"
        );

    }


    console.log(
        `📊 Buscando histórico: ` +
        `${equipes.casa} x ${equipes.fora}`
    );


    const [
        historicoCasa,
        historicoFora
    ] =
        await Promise.all([

            buscarHistoricoEquipe(
                equipes.casa
            ),

            buscarHistoricoEquipe(
                equipes.fora
            )

        ]);


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


    const odds =
        extrairOdds(
            dados
        );


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
                odds.casa,

            probabilidade:
                arredondar(
                    probabilidades.casa * 100,
                    2
                ),

            edge:
                valueCasa.edge,

            valorEstimado:
                valueCasa.valor,

            oddJusta:
                valueCasa.oddJusta

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
                odds.empate,

            probabilidade:
                arredondar(
                    probabilidades.empate * 100,
                    2
                ),

            edge:
                valueEmpate.edge,

            valorEstimado:
                valueEmpate.valor,

            oddJusta:
                valueEmpate.oddJusta

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
                odds.fora,

            probabilidade:
                arredondar(
                    probabilidades.fora * 100,
                    2
                ),

            edge:
                valueFora.edge,

            valorEstimado:
                valueFora.valor,

            oddJusta:
                valueFora.oddJusta

        });

    }


    return {

        sucesso:
            true,

        algoritmo:
            "BetVision AI Motor Estatístico v7",

        jogo: {

            nome:
                nomeJogo,

            casa:
                equipes.casa,

            fora:
                equipes.fora

        },

        dataAnalise:
            new Date(),

        dataBrasil:
            obterDataHojeBrasil(),

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

        odds,

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

    return analisarMercado(
        jogo,
        dados
    );

}


// ==================================================
// LISTAR ANÁLISES
//
// MANTIDO PARA COMPATIBILIDADE.
//
// AGORA SOMENTE HOJE.
//
// A data oficial vem de jogos.data_jogo.
// ==================================================

export async function listarAnalises() {

    try {

        const resultado =
            await query(

                `

                SELECT

                    a.*,

                    j.id AS jogo_id,

                    j.api_id AS jogo_api_id,

                    j.data_jogo,

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.estadio,

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
                        $1

                    )::date

                    =

                    $2::date

                ORDER BY

                    j.data_jogo ASC,

                    a.criado_em DESC,

                    a.id DESC

                LIMIT $3

                `,

                [

                    TIMEZONE,

                    obterDataHojeBrasil(),

                    LIMITE_JOGOS

                ]

            );


        return (
            resultado.rows || []
        );

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
