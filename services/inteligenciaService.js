// ==================================================
// BETVISION AI
// services/inteligenciaService.js
//
// MOTOR ESTATÍSTICO v7
//
// CORREÇÃO COMPLETA
//
// PRINCIPAIS OBJETIVOS:
//
// - Análise estatística real
// - SEM Math.random()
// - Histórico real das equipes
// - Histórico somente de partidas encerradas
// - Considera timezone America/Sao_Paulo
// - Probabilidades 1X2
// - Gols esperados
// - Previsão de placar
// - Over / Under
// - Ambas Marcam
// - Value Bet baseada em odd real
// - Confiança estatística
// - Qualidade dos dados
// - PostgreSQL / NeonDB
// - API ID preservado
// - Data do jogo preservada
// - Compatível com routes/analises.js
//
// IMPORTANTE:
//
// O dashboard deve exibir somente JOGOS DE HOJE.
//
// O histórico usado para calcular a análise,
// entretanto, utiliza partidas ANTIGAS e finalizadas.
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


const LIMITE_HISTORICO =
    10;


const MINIMO_JOGOS_HISTORICO =
    3;


// ==================================================
// UTILITÁRIOS
// ==================================================

function numero(
    valor,
    padrao = 0
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return padrao;

    }


    const n =
        Number(valor);


    return Number.isFinite(n)
        ? n
        : padrao;

}


// ==================================================

function limitar(
    valor,
    minimo,
    maximo
) {

    return Math.min(
        maximo,
        Math.max(
            minimo,
            numero(valor)
        )
    );

}


// ==================================================

function arredondar(
    valor,
    casas = 2
) {

    const numeroValor =
        numero(valor);


    const fator =
        10 ** casas;


    return Math.round(
        numeroValor * fator
    ) / fator;

}


// ==================================================
// NORMALIZAR NOME DE EQUIPE
// ==================================================

function normalizarNomeEquipe(
    nome
) {

    return String(
        nome || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        );

}


// ==================================================
// DATA ATUAL NO BRASIL
// ==================================================

function obterDataHojeBrasil() {

    try {

        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    TIMEZONE,

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
            }
        ).format(
            new Date()
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro data Brasil:",
            erro.message
        );


        return new Date()
            .toISOString()
            .slice(
                0,
                10
            );

    }

}


// ==================================================
// DISTRIBUIÇÃO DE POISSON
// ==================================================

function fatorial(
    n
) {

    const inteiro =
        Math.max(
            0,
            Math.floor(
                numero(n)
            )
        );


    if (
        inteiro <= 1
    ) {

        return 1;

    }


    let resultado =
        1;


    for (
        let i = 2;
        i <= inteiro;
        i++
    ) {

        resultado *= i;

    }


    return resultado;

}


// ==================================================

function poisson(
    gols,
    lambda
) {

    const golsInteiros =
        Math.floor(
            numero(gols)
        );


    const media =
        numero(lambda);


    if (
        media <= 0 ||
        golsInteiros < 0
    ) {

        return 0;

    }


    return (
        Math.exp(-media) *
        Math.pow(
            media,
            golsInteiros
        )
    ) /
    fatorial(
        golsInteiros
    );

}


// ==================================================
// PROBABILIDADE DE GOLS ATÉ LIMITE
// ==================================================

function probabilidadeGolsAte(
    limite,
    lambda
) {

    let probabilidade =
        0;


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
// PROBABILIDADE OVER
//
// Exemplo:
//
// Over 2.5
//
// 1 - P(0,1,2)
//
// ==================================================

function probabilidadeOver(
    linha,
    lambda
) {

    const linhaNumerica =
        numero(
            linha
        );


    const limite =
        Math.floor(
            linhaNumerica
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
// MÉDIA
// ==================================================

function calcularMedia(
    valores
) {

    if (
        !Array.isArray(
            valores
        ) ||
        valores.length === 0
    ) {

        return 0;

    }


    const lista =
        valores
            .map(
                valor =>
                    numero(
                        valor
                    )
            )
            .filter(
                valor =>
                    Number.isFinite(
                        valor
                    )
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
// BUSCAR HISTÓRICO DA EQUIPE
//
// IMPORTANTE:
//
// Somente partidas anteriores à data/hora atual.
//
// Evita que jogos futuros sejam usados
// como histórico.
//
// Também tenta considerar apenas partidas
// que já possuem placar.
// ==================================================

async function buscarHistoricoEquipe(
    nomeEquipe
) {

    const equipe =
        normalizarNomeEquipe(
            nomeEquipe
        );


    if (!equipe) {

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
                            TRIM($1)
                        )

                        OR

                        LOWER(
                            TRIM(time_fora)
                        )
                        =
                        LOWER(
                            TRIM($1)
                        )
                    )

                    AND

                    data_jogo IS NOT NULL

                    AND

                    data_jogo <
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )

                    AND

                    gols_casa IS NOT NULL

                    AND

                    gols_fora IS NOT NULL

                ORDER BY
                    data_jogo DESC

                LIMIT $2
                `,
                [
                    equipe,
                    LIMITE_HISTORICO
                ]
            );


        return (
            resultado?.rows ||
            []
        );

    }

    catch (erro) {

        console.error(
            `❌ Erro histórico ${equipe}:`,
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
        !Array.isArray(
            historico
        ) ||
        historico.length === 0
    ) {

        return {

            jogos:
                0,

            golsMarcados:
                0,

            golsSofridos:
                0,

            vitorias:
                0,

            empates:
                0,

            derrotas:
                0,

            aproveitamento:
                0,

            mediaGolsMarcados:
                0,

            mediaGolsSofridos:
                0

        };

    }


    const nomeEquipe =
        normalizarNomeEquipe(
            equipe
        )
        .toLowerCase();


    const golsMarcados =
        [];

    const golsSofridos =
        [];


    let vitorias =
        0;

    let empates =
        0;

    let derrotas =
        0;


    for (
        const jogo
        of historico
    ) {

        if (!jogo) {

            continue;

        }


        const casa =
            normalizarNomeEquipe(
                jogo.time_casa
            );


        const fora =
            normalizarNomeEquipe(
                jogo.time_fora
            );


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
            nomeEquipe;


        const ehFora =
            fora.toLowerCase()
            ===
            nomeEquipe;


        // ------------------------------------------
        // Ignorar registro que não pertence à equipe
        // ------------------------------------------

        if (
            !ehCasa &&
            !ehFora
        ) {

            continue;

        }


        if (ehCasa) {

            golsMarcados.push(
                golsCasa
            );


            golsSofridos.push(
                golsFora
            );


            if (
                golsCasa >
                golsFora
            ) {

                vitorias++;

            }

            else if (
                golsCasa ===
                golsFora
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
                golsFora >
                golsCasa
            ) {

                vitorias++;

            }

            else if (
                golsFora ===
                golsCasa
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

        return {

            jogos:
                0,

            golsMarcados:
                0,

            golsSofridos:
                0,

            vitorias:
                0,

            empates:
                0,

            derrotas:
                0,

            aproveitamento:
                0,

            mediaGolsMarcados:
                0,

            mediaGolsSofridos:
                0

        };

    }


    const aproveitamento =
        (
            vitorias * 3 +
            empates
        )
        /
        (jogos * 3);


    const mediaMarcados =
        calcularMedia(
            golsMarcados
        );


    const mediaSofridos =
        calcularMedia(
            golsSofridos
        );


    return {

        jogos,

        golsMarcados:
            arredondar(
                mediaMarcados,
                3
            ),

        golsSofridos:
            arredondar(
                mediaSofridos,
                3
            ),

        vitorias,

        empates,

        derrotas,

        aproveitamento:
            arredondar(
                aproveitamento,
                4
            ),

        mediaGolsMarcados:
            arredondar(
                mediaMarcados,
                3
            ),

        mediaGolsSofridos:
            arredondar(
                mediaSofridos,
                3
            )

    };

}


// ==================================================
// FORÇA OFENSIVA
//
// Quando não há histórico:
//
// usa 1.00 como referência neutra.
//
// Quando há histórico:
//
// usa média de gols marcados.
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
// Quanto maior o número de gols sofridos,
// pior a defesa.
//
// Mantemos a média para cálculo do confronto.
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
    // Ataque da casa + defesa do adversário
    // ----------------------------------------------

    let lambdaCasa =
        (
            ataqueCasa +
            defesaFora
        )
        /
        2;


    // ----------------------------------------------
    // Ataque do visitante + defesa da casa
    // ----------------------------------------------

    let lambdaFora =
        (
            ataqueFora +
            defesaCasa
        )
        /
        2;


    // ----------------------------------------------
    // MANDO DE CAMPO
    // ----------------------------------------------

    lambdaCasa *=
        1.10;


    lambdaFora *=
        0.95;


    // ----------------------------------------------
    // LIMITES
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
// PROBABILIDADE 1X2
// ==================================================

function calcularProbabilidadesResultado(
    golsCasa,
    golsFora
) {

    let casa =
        0;

    let empate =
        0;

    let fora =
        0;


    const MAX_GOLS =
        8;


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

                casa +=
                    prob;

            }

            else if (
                gc === gf
            ) {

                empate +=
                    prob;

            }

            else {

                fora +=
                    prob;

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
                0.3333,

            empate:
                0.3333,

            fora:
                0.3334

        };

    }


    return {

        casa:
            limitar(
                casa / total,
                0,
                1
            ),

        empate:
            limitar(
                empate / total,
                0,
                1
            ),

        fora:
            limitar(
                fora / total,
                0,
                1
            )

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
                maiorProbabilidade *
                100,
                2
            )

    };

}


// ==================================================
// AMBAS MARCAM
//
// P(Ambas marcam)
//
// = 1 - P(casa 0) - P(fora 0)
//   + P(casa 0 e fora 0)
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

        numero(
            probabilidades?.casa
        ),

        numero(
            probabilidades?.empate
        ),

        numero(
            probabilidades?.fora
        )

    ]
        .sort(
            (
                a,
                b
            ) =>
                b - a
        );


    const maior =
        valores[0] || 0;


    const segundo =
        valores[1] || 0;


    const margem =
        maior -
        segundo;


    let confianca =
        35;


    // ----------------------------------------------
    // Quanto maior a diferença entre o primeiro
    // e o segundo resultado, maior a confiança.
    // ----------------------------------------------

    confianca +=
        margem * 100;


    // ----------------------------------------------
    // Qualidade da amostra
    // ----------------------------------------------

    if (
        amostra >= 8
    ) {

        confianca +=
            10;

    }

    else if (
        amostra >= 5
    ) {

        confianca +=
            5;

    }

    else if (
        amostra >= 3
    ) {

        confianca +=
            2;

    }

    else {

        confianca -=
            5;

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
        numero(
            odd
        );


    if (
        valor <= 1
    ) {

        return 0;

    }


    return limitar(
        1 / valor,
        0,
        1
    );

}


// ==================================================
// VALUE BET
// ==================================================

function calcularValueBet(
    probabilidade,
    odd
) {

    const prob =
        limitar(
            numero(
                probabilidade
            ),
            0,
            1
        );


    const oddNumerica =
        numero(
            odd
        );


    if (
        oddNumerica <= 1 ||
        prob <= 0
    ) {

        return {

            valueBet:
                false,

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
        prob -
        probabilidadeMercado;


    const valorEstimado =
        (
            prob *
            oddNumerica
        ) -
        1;


    const oddJusta =
        1 /
        prob;


    return {

        valueBet:
            edge >= 0.05,

        valor:
            arredondar(
                valorEstimado *
                100,
                2
            ),

        edge:
            arredondar(
                edge *
                100,
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

            casa:
                "",

            fora:
                ""

        };

    }


    const texto =
        jogo
            .trim()
            .replace(
                /\s+/g,
                " "
            );


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

        if (
            texto.includes(
                separador
            )
        ) {

            const partes =
                texto.split(
                    separador
                );


            const casa =
                partes[0]
                    ?.trim() || "";


            const fora =
                partes
                    .slice(1)
                    .join(
                        separador
                    )
                    .trim() || "";


            return {

                casa,

                fora

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
// EXTRAIR API ID
// ==================================================

function extrairApiId(
    dados
) {

    if (!dados) {

        return null;

    }


    const candidatos = [

        dados.api_id,

        dados.apiId,

        dados.jogo_api_id,

        dados.fixture_id,

        dados.fixtureId,

        dados.match_id,

        dados.matchId,

        dados.jogo?.api_id,

        dados.jogo?.apiId,

        dados.jogo?.fixture_id,

        dados.jogo?.fixtureId,

        dados.fixture?.id

    ];


    for (
        const valor
        of candidatos
    ) {

        if (
            valor !== null &&
            valor !== undefined &&
            String(valor).trim() !== ""
        ) {

            return valor;

        }

    }


    return null;

}


// ==================================================
// EXTRAIR DATA DO JOGO
// ==================================================

function extrairDataJogo(
    dados
) {

    if (!dados) {

        return null;

    }


    const candidatos = [

        dados.data_jogo,

        dados.dataJogo,

        dados.jogo_data,

        dados.data,

        dados.kickoff,

        dados.date,

        dados.datetime,

        dados.data_hora,

        dados.dataHora,

        dados.inicio,

        dados.jogo?.data_jogo,

        dados.jogo?.dataJogo,

        dados.jogo?.data,

        dados.jogo?.kickoff,

        dados.jogo?.date,

        dados.jogo?.datetime,

        dados.fixture?.date,

        dados.fixture?.data

    ];


    for (
        const valor
        of candidatos
    ) {

        if (
            valor !== null &&
            valor !== undefined &&
            String(valor).trim() !== ""
        ) {

            return valor;

        }

    }


    return null;

}


// ==================================================
// EXTRAIR ODDS
// ==================================================

function extrairOdds(
    dados
) {

    if (!dados) {

        return {};

    }


    const odds =
        dados.odds || {};


    return {

        casa:
            odds.casa ??
            odds.home ??
            dados.odd_casa ??
            dados.oddCasa ??
            null,

        empate:
            odds.empate ??
            odds.draw ??
            dados.odd_empate ??
            dados.oddEmpate ??
            null,

        fora:
            odds.fora ??
            odds.away ??
            dados.odd_fora ??
            dados.oddFora ??
            null,

        over15:
            odds.over15 ??
            odds.over_15 ??
            null,

        over25:
            odds.over25 ??
            odds.over_25 ??
            null,

        over35:
            odds.over35 ??
            odds.over_35 ??
            null

    };

}


// ==================================================
// ANALISAR MERCADO
// ==================================================

export async function analisarMercado(
    jogo,
    dados = {}
) {

    try {

        // ==========================================
        // VALIDAR JOGO
        // ==========================================

        if (
            typeof jogo !== "string" ||
            !jogo.trim()
        ) {

            throw new Error(
                "Jogo obrigatório para análise"
            );

        }


        const nomeJogo =
            jogo.trim();


        // ==========================================
        // SEPARAR EQUIPES
        // ==========================================

        const equipes =
            separarJogo(
                nomeJogo
            );


        if (
            !equipes.casa ||
            !equipes.fora
        ) {

            throw new Error(
                "Não foi possível identificar as duas equipes do jogo"
            );

        }


        console.log(
            `📊 Buscando histórico: ${equipes.casa} x ${equipes.fora}`
        );


        // ==========================================
        // HISTÓRICO
        // ==========================================

        const [
            historicoCasa,
            historicoFora
        ] = await Promise.all([

            buscarHistoricoEquipe(
                equipes.casa
            ),

            buscarHistoricoEquipe(
                equipes.fora
            )

        ]);


        // ==========================================
        // ESTATÍSTICAS
        // ==========================================

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


        // ==========================================
        // GOLS ESPERADOS
        // ==========================================

        const gols =
            calcularGolsEsperados(
                estatisticasCasa,
                estatisticasFora
            );


        // ==========================================
        // PROBABILIDADES 1X2
        // ==========================================

        const probabilidades =
            calcularProbabilidadesResultado(
                gols.casa,
                gols.fora
            );


        // ==========================================
        // PLACAR
        // ==========================================

        const placar =
            preverPlacar(
                gols.casa,
                gols.fora
            );


        // ==========================================
        // AMBAS MARCAM
        // ==========================================

        const ambasMarcam =
            calcularAmbasMarcam(
                gols.casa,
                gols.fora
            );


        // ==========================================
        // OVER / UNDER
        // ==========================================

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


        const under15 =
            probabilidadeUnder(
                1.5,
                gols.total
            );


        const under25 =
            probabilidadeUnder(
                2.5,
                gols.total
            );


        const under35 =
            probabilidadeUnder(
                3.5,
                gols.total
            );


        // ==========================================
        // AMOSTRA
        // ==========================================

        const amostra =
            Math.min(
                estatisticasCasa.jogos,
                estatisticasFora.jogos
            );


        // ==========================================
        // CONFIANÇA
        // ==========================================

        const confianca =
            calcularConfianca(
                probabilidades,
                amostra
            );


        // ==========================================
        // ODDS
        // ==========================================

        const odds =
            extrairOdds(
                dados
            );


        // ==========================================
        // VALUE BET CASA
        // ==========================================

        const valueCasa =
            calcularValueBet(
                probabilidades.casa,
                odds.casa
            );


        // ==========================================
        // VALUE BET EMPATE
        // ==========================================

        const valueEmpate =
            calcularValueBet(
                probabilidades.empate,
                odds.empate
            );


        // ==========================================
        // VALUE BET FORA
        // ==========================================

        const valueFora =
            calcularValueBet(
                probabilidades.fora,
                odds.fora
            );


        const valueBets =
            [];


        // ==========================================
        // VALUE CASA
        // ==========================================

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
                        probabilidades.casa *
                        100,
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


        // ==========================================
        // VALUE EMPATE
        // ==========================================

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
                        probabilidades.empate *
                        100,
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


        // ==========================================
        // VALUE FORA
        // ==========================================

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
                        probabilidades.fora *
                        100,
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


        // ==========================================
        // METADADOS DO JOGO
        // ==========================================

        const apiId =
            extrairApiId(
                dados
            );


        const dataJogo =
            extrairDataJogo(
                dados
            );


        // ==========================================
        // RETORNO FINAL
        // ==========================================

        return {

            sucesso:
                true,

            algoritmo:
                "BetVision AI Motor Estatístico v7",

            api_id:
                apiId,

            data_jogo:
                dataJogo,

            jogo: {

                nome:
                    nomeJogo,

                casa:
                    equipes.casa,

                fora:
                    equipes.fora,

                api_id:
                    apiId,

                data_jogo:
                    dataJogo

            },

            dataAnalise:
                new Date(),

            probabilidades: {

                casa:
                    arredondar(
                        probabilidades.casa *
                        100,
                        2
                    ),

                empate:
                    arredondar(
                        probabilidades.empate *
                        100,
                        2
                    ),

                fora:
                    arredondar(
                        probabilidades.fora *
                        100,
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
                        over15 *
                        100,
                        2
                    ),

                over25:
                    arredondar(
                        over25 *
                        100,
                        2
                    ),

                over35:
                    arredondar(
                        over35 *
                        100,
                        2
                    ),

                under15:
                    arredondar(
                        under15 *
                        100,
                        2
                    ),

                under25:
                    arredondar(
                        under25 *
                        100,
                        2
                    ),

                under35:
                    arredondar(
                        under35 *
                        100,
                        2
                    ),

                ambasMarcam:
                    arredondar(
                        ambasMarcam *
                        100,
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
                amostra >=
                MINIMO_JOGOS_HISTORICO

                    ? "Boa"

                    : "Limitada"

        };

    }

    catch (erro) {

        console.error(
            "❌ Erro analisarMercado:",
            erro
        );


        return {

            sucesso:
                false,

            erro:
                erro.message ||
                "Erro ao realizar análise estatística",

            algoritmo:
                "BetVision AI Motor Estatístico v7"

        };

    }

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
// IMPORTANTE:
//
// SOMENTE JOGOS DE HOJE.
//
// Não retorna amanhã.
//
// Não retorna ontem.
//
// Não usa criado_em.
//
// O filtro é feito pela DATA DA PARTIDA.
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

                    api_id,

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

                    data_jogo IS NOT NULL

                    AND

                    DATE(
                        data_jogo
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )
                    =
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )::date

                ORDER BY
                    data_jogo ASC

                LIMIT $1
                `,
                [
                    LIMITE_JOGOS
                ]
            );


        const linhas =
            resultado?.rows ||
            [];


        console.log(
            `🤖 listarAnalises(): ${linhas.length} análises de hoje`
        );


        return linhas;

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
