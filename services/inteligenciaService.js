// ==========================================================
// BETVISION AI
// services/inteligenciaService.js
//
// MOTOR ESTATÍSTICO v8
//
// CORREÇÕES:
//
// - Aceita jogo STRING ou OBJETO
// - Compatibilidade gerarAnaliseInteligente()
// - Histórico real PostgreSQL
// - H2H
// - Probabilidades 1X2
// - xG
// - Placar
// - Over/Under
// - Ambas Marcam
// - Value Bet
// - Confiança
// - Sem Math.random()
// - api_id preservado
// - data_jogo preservada
//
// ==========================================================

import {
    query
} from "../database/database.js";


// ==========================================================
// CONFIGURAÇÃO
// ==========================================================

const TIMEZONE =
    "America/Sao_Paulo";

const MAX_HISTORICO =
    10;

const MAX_H2H =
    10;

const MINIMO_HISTORICO =
    3;


// ==========================================================
// UTILITÁRIOS
// ==========================================================

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

    return (
        Math.round(
            numero(valor) * fator
        ) / fator
    );
}


// ==========================================================
// DATA BRASIL
// ==========================================================

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

    } catch {

        return new Date()
            .toISOString()
            .slice(0, 10);
    }
}


// ==========================================================
// EXTRAIR INFORMAÇÕES DO JOGO
//
// ACEITA:
//
// "Palmeiras x Flamengo"
//
// OU:
//
// {
//    api_id,
//    time_casa,
//    time_fora,
//    data_jogo
// }
// ==========================================================

function normalizarJogo(
    jogo
) {

    if (
        typeof jogo === "string"
    ) {

        const texto =
            jogo.trim();

        if (!texto) {

            throw new Error(
                "Jogo não informado"
            );
        }


        const partes =
            separarJogo(
                texto
            );


        return {

            nome:
                texto,

            casa:
                partes.casa,

            fora:
                partes.fora,

            api_id:
                null,

            data_jogo:
                null,

            campeonato:
                null,

            status:
                null,

            odds:
                {}

        };
    }


    if (
        jogo &&
        typeof jogo === "object"
    ) {

        const casa =
            jogo.time_casa ??
            jogo.casa ??
            jogo.home_team ??
            jogo.homeTeam ??
            jogo.jogo?.time_casa ??
            jogo.jogo?.casa ??
            "";

        const fora =
            jogo.time_fora ??
            jogo.fora ??
            jogo.away_team ??
            jogo.awayTeam ??
            jogo.jogo?.time_fora ??
            jogo.jogo?.fora ??
            "";


        let nome =
            jogo.jogo_nome ??
            jogo.nome ??
            jogo.jogo ??
            jogo.name ??
            jogo.fixture_name ??
            "";


        if (
            typeof nome !== "string"
        ) {

            nome = "";
        }


        if (
            !nome.trim() &&
            casa &&
            fora
        ) {

            nome =
                `${casa} x ${fora}`;
        }


        if (
            !casa ||
            !fora
        ) {

            if (nome) {

                const partes =
                    separarJogo(
                        nome
                    );

                return {

                    nome:
                        nome.trim(),

                    casa:
                        partes.casa,

                    fora:
                        partes.fora,

                    api_id:
                        jogo.api_id ??
                        jogo.apiId ??
                        jogo.id_api ??
                        jogo.fixture_id ??
                        jogo.jogo?.api_id ??
                        null,

                    data_jogo:
                        jogo.data_jogo ??
                        jogo.dataJogo ??
                        jogo.date ??
                        jogo.kickoff ??
                        jogo.jogo?.data_jogo ??
                        null,

                    campeonato:
                        jogo.campeonato ??
                        jogo.league_name ??
                        null,

                    status:
                        jogo.status ??
                        null,

                    odds:
                        jogo.odds ??
                        {}
                };
            }


            throw new Error(
                "Jogo não informado"
            );
        }


        return {

            nome:
                `${String(casa).trim()} x ` +
                `${String(fora).trim()}`,

            casa:
                String(casa).trim(),

            fora:
                String(fora).trim(),

            api_id:
                jogo.api_id ??
                jogo.apiId ??
                jogo.id_api ??
                jogo.fixture_id ??
                jogo.jogo?.api_id ??
                null,

            data_jogo:
                jogo.data_jogo ??
                jogo.dataJogo ??
                jogo.date ??
                jogo.kickoff ??
                jogo.jogo?.data_jogo ??
                null,

            campeonato:
                jogo.campeonato ??
                jogo.league_name ??
                null,

            status:
                jogo.status ??
                null,

            odds:
                jogo.odds ??
                {}
        };
    }


    throw new Error(
        "Jogo não informado"
    );
}


// ==========================================================
// SEPARAR JOGO
// ==========================================================

function separarJogo(
    jogo
) {

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


// ==========================================================
// POISSON
// ==========================================================

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


// ==========================================================
// HISTÓRICO DA EQUIPE
//
// Somente jogos já encerrados
// e com placar válido.
// ==========================================================

async function buscarHistoricoEquipe(
    nomeEquipe
) {

    if (!nomeEquipe) {
        return [];
    }


    try {

        console.log(
            `📚 Consultando histórico do time: ${nomeEquipe}`
        );


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
                        LOWER(TRIM(time_casa))
                        =
                        LOWER(TRIM($1))

                        OR

                        LOWER(TRIM(time_fora))
                        =
                        LOWER(TRIM($1))
                    )

                    AND gols_casa IS NOT NULL

                    AND gols_fora IS NOT NULL

                    AND data_jogo IS NOT NULL

                    AND data_jogo < CURRENT_TIMESTAMP

                ORDER BY
                    data_jogo DESC

                LIMIT $2
                `,
                [
                    nomeEquipe,
                    MAX_HISTORICO
                ]
            );


        console.log(
            `📚 Banco retornou ${resultado.rows.length} registros para ${nomeEquipe}`
        );


        const validos =
            resultado.rows.filter(
                jogo => {

                    const gc =
                        Number(
                            jogo.gols_casa
                        );

                    const gf =
                        Number(
                            jogo.gols_fora
                        );

                    return (
                        Number.isFinite(gc) &&
                        Number.isFinite(gf) &&
                        gc >= 0 &&
                        gf >= 0
                    );
                }
            );


        console.log(
            `📊 Histórico válido ${nomeEquipe}: ${validos.length} jogos`
        );


        return validos;

    } catch (erro) {

        console.error(
            `❌ Erro histórico ${nomeEquipe}:`,
            erro.message
        );

        return [];
    }
}


// ==========================================================
// H2H
// ==========================================================

async function buscarH2H(
    casa,
    fora
) {

    if (!casa || !fora) {
        return [];
    }


    try {

        console.log(
            `⚔️ Consultando H2H: ${casa} x ${fora}`
        );


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

                        (
                            LOWER(TRIM(time_casa))
                            =
                            LOWER(TRIM($1))

                            AND

                            LOWER(TRIM(time_fora))
                            =
                            LOWER(TRIM($2))
                        )

                        OR

                        (
                            LOWER(TRIM(time_casa))
                            =
                            LOWER(TRIM($2))

                            AND

                            LOWER(TRIM(time_fora))
                            =
                            LOWER(TRIM($1))
                        )

                    )

                    AND gols_casa IS NOT NULL

                    AND gols_fora IS NOT NULL

                    AND data_jogo IS NOT NULL

                    AND data_jogo < CURRENT_TIMESTAMP

                ORDER BY
                    data_jogo DESC

                LIMIT $3
                `,
                [
                    casa,
                    fora,
                    MAX_H2H
                ]
            );


        console.log(
            `⚔️ H2H banco: ${resultado.rows.length} registros encontrados`
        );


        return resultado.rows.filter(
            jogo => {

                const gc =
                    Number(
                        jogo.gols_casa
                    );

                const gf =
                    Number(
                        jogo.gols_fora
                    );

                return (
                    Number.isFinite(gc) &&
                    Number.isFinite(gf)
                );
            }
        );

    } catch (erro) {

        console.error(
            "❌ Erro H2H:",
            erro.message
        );

        return [];
    }
}


// ==========================================================
// ESTATÍSTICAS DA EQUIPE
// ==========================================================

function calcularEstatisticasEquipe(
    historico,
    equipe
) {

    if (
        !Array.isArray(historico) ||
        historico.length === 0
    ) {

        return {

            jogos:
                0,

            golsMarcados:
                1,

            golsSofridos:
                1,

            vitorias:
                0,

            empates:
                0,

            derrotas:
                0,

            aproveitamento:
                0.5,

            forma:
                50
        };
    }


    let golsMarcados = 0;
    let golsSofridos = 0;

    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;


    const nome =
        String(equipe)
            .trim()
            .toLowerCase();


    for (
        const jogo of historico
    ) {

        const casa =
            String(
                jogo.time_casa || ""
            )
            .trim()
            .toLowerCase();

        const fora =
            String(
                jogo.time_fora || ""
            )
            .trim()
            .toLowerCase();


        const gc =
            numero(
                jogo.gols_casa
            );

        const gf =
            numero(
                jogo.gols_fora
            );


        if (casa === nome) {

            golsMarcados += gc;

            golsSofridos += gf;


            if (gc > gf) {

                vitorias++;

            } else if (gc === gf) {

                empates++;

            } else {

                derrotas++;
            }

        } else if (fora === nome) {

            golsMarcados += gf;

            golsSofridos += gc;


            if (gf > gc) {

                vitorias++;

            } else if (gf === gc) {

                empates++;

            } else {

                derrotas++;
            }
        }
    }


    const jogos =
        historico.length;


    const mediaMarcados =
        golsMarcados /
        jogos;


    const mediaSofridos =
        golsSofridos /
        jogos;


    const aproveitamento =
        (
            vitorias * 3 +
            empates
        ) /
        (
            jogos * 3
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

        forma:
            arredondar(
                aproveitamento * 100,
                1
            )
    };
}


// ==========================================================
// ESTATÍSTICA H2H
// ==========================================================

function calcularEstatisticasH2H(
    h2h,
    casa,
    fora
) {

    let vitoriasCasa = 0;
    let empates = 0;
    let vitoriasFora = 0;

    let golsCasa = 0;
    let golsFora = 0;


    const nomeCasa =
        String(casa)
            .trim()
            .toLowerCase();

    const nomeFora =
        String(fora)
            .trim()
            .toLowerCase();


    for (
        const jogo of h2h
    ) {

        const tc =
            String(
                jogo.time_casa || ""
            )
            .trim()
            .toLowerCase();

        const tf =
            String(
                jogo.time_fora || ""
            )
            .trim()
            .toLowerCase();


        const gc =
            numero(
                jogo.gols_casa
            );

        const gf =
            numero(
                jogo.gols_fora
            );


        if (
            tc === nomeCasa &&
            tf === nomeFora
        ) {

            golsCasa += gc;
            golsFora += gf;


            if (gc > gf) {

                vitoriasCasa++;

            } else if (gc === gf) {

                empates++;

            } else {

                vitoriasFora++;
            }

        } else {

            golsCasa += gf;
            golsFora += gc;


            if (gf > gc) {

                vitoriasCasa++;

            } else if (gf === gc) {

                empates++;

            } else {

                vitoriasFora++;
            }
        }
    }


    return {

        jogos:
            h2h.length,

        vitoriasCasa,

        empates,

        vitoriasFora,

        golsCasa:
            h2h.length
                ? arredondar(
                    golsCasa /
                    h2h.length,
                    2
                )
                : 0,

        golsFora:
            h2h.length
                ? arredondar(
                    golsFora /
                    h2h.length,
                    2
                )
                : 0
    };
}


// ==========================================================
// GOLS ESPERADOS
// ==========================================================

function calcularGolsEsperados(
    estatCasa,
    estatFora,
    h2h
) {

    const ataqueCasa =
        numero(
            estatCasa.golsMarcados,
            1
        );

    const defesaCasa =
        numero(
            estatCasa.golsSofridos,
            1
        );

    const ataqueFora =
        numero(
            estatFora.golsMarcados,
            1
        );

    const defesaFora =
        numero(
            estatFora.golsSofridos,
            1
        );


    let lambdaCasa =
        (
            ataqueCasa +
            defesaFora
        ) / 2;


    let lambdaFora =
        (
            ataqueFora +
            defesaCasa
        ) / 2;


    // H2H entra somente quando há amostra.
    if (
        h2h &&
        h2h.jogos >= 2
    ) {

        lambdaCasa =
            (
                lambdaCasa * 0.85 +
                h2h.golsCasa * 0.15
            );

        lambdaFora =
            (
                lambdaFora * 0.85 +
                h2h.golsFora * 0.15
            );
    }


    // Mando
    lambdaCasa *= 1.10;
    lambdaFora *= 0.95;


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


// ==========================================================
// PROBABILIDADE 1X2
// ==========================================================

function calcularProbabilidadesResultado(
    lambdaCasa,
    lambdaFora
) {

    let casa = 0;
    let empate = 0;
    let fora = 0;


    const MAX_GOLS = 8;


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
                    lambdaCasa
                ) *
                poisson(
                    gf,
                    lambdaFora
                );


            if (gc > gf) {

                casa += prob;

            } else if (gc === gf) {

                empate += prob;

            } else {

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
                0.3333,

            empate:
                0.3333,

            fora:
                0.3334
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


// ==========================================================
// PLACAR
// ==========================================================

function preverPlacar(
    lambdaCasa,
    lambdaFora
) {

    let maior = 0;

    let placar =
        "0x0";


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
                    lambdaCasa
                ) *
                poisson(
                    gf,
                    lambdaFora
                );


            if (
                prob > maior
            ) {

                maior =
                    prob;

                placar =
                    `${gc}x${gf}`;
            }
        }
    }


    return {

        placar,

        probabilidade:
            arredondar(
                maior * 100,
                2
            )
    };
}


// ==========================================================
// PROBABILIDADE TOTAL DE GOLS
// ==========================================================

function probabilidadeGolsAte(
    limite,
    lambda
) {

    let total = 0;


    for (
        let gols = 0;
        gols <= limite;
        gols++
    ) {

        total +=
            poisson(
                gols,
                lambda
            );
    }


    return total;
}


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


// ==========================================================
// AMBAS MARCAM
// ==========================================================

function calcularAmbasMarcam(
    lambdaCasa,
    lambdaFora
) {

    const p0Casa =
        poisson(
            0,
            lambdaCasa
        );

    const p0Fora =
        poisson(
            0,
            lambdaFora
        );


    return limitar(
        1 -
        p0Casa -
        p0Fora +
        (
            p0Casa *
            p0Fora
        ),
        0,
        1
    );
}


// ==========================================================
// CONFIANÇA
// ==========================================================

function calcularConfianca(
    probabilidades,
    amostraCasa,
    amostraFora,
    h2hJogos
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
        ordenados[0];

    const segundo =
        ordenados[1];


    const margem =
        maior -
        segundo;


    const amostra =
        Math.min(
            amostraCasa,
            amostraFora
        );


    let confianca =
        35 +
        margem * 100;


    if (
        amostra >= 10
    ) {

        confianca += 12;

    } else if (
        amostra >= 7
    ) {

        confianca += 8;

    } else if (
        amostra >= 5
    ) {

        confianca += 5;
    }


    if (
        h2hJogos >= 3
    ) {

        confianca += 3;
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

    } else if (
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


// ==========================================================
// VALUE BET
// ==========================================================

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


    const probMercado =
        1 /
        oddNumerica;


    const edge =
        probabilidade -
        probMercado;


    const valor =
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
                valor * 100,
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


// ==========================================================
// ANALISAR MERCADO
// ==========================================================

export async function analisarMercado(
    jogo,
    dados = {}
) {

    const info =
        normalizarJogo(
            jogo
        );


    console.log(
        "=================================================="
    );

    console.log(
        `📊 BUSCANDO HISTÓRICO REAL: ${info.nome}`
    );

    console.log(
        `📅 Data Brasil: ${obterDataHojeBrasil()}`
    );

    console.log(
        `🌎 Fuso: ${TIMEZONE}`
    );

    console.log(
        "=================================================="
    );


    const [
        historicoCasa,
        historicoFora,
        h2h
    ] =
        await Promise.all([

            buscarHistoricoEquipe(
                info.casa
            ),

            buscarHistoricoEquipe(
                info.fora
            ),

            buscarH2H(
                info.casa,
                info.fora
            )

        ]);


    const estatisticasCasa =
        calcularEstatisticasEquipe(
            historicoCasa,
            info.casa
        );


    const estatisticasFora =
        calcularEstatisticasEquipe(
            historicoFora,
            info.fora
        );


    const estatisticasH2H =
        calcularEstatisticasH2H(
            h2h,
            info.casa,
            info.fora
        );


    console.log(
        `📊 ${info.casa}: ` +
        `${estatisticasCasa.jogos} jogos históricos válidos`
    );

    console.log(
        `📊 ${info.fora}: ` +
        `${estatisticasFora.jogos} jogos históricos válidos`
    );

    console.log(
        `⚔️ H2H: ${estatisticasH2H.jogos} confrontos`
    );


    const gols =
        calcularGolsEsperados(
            estatisticasCasa,
            estatisticasFora,
            estatisticasH2H
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


    const confianca =
        calcularConfianca(
            probabilidades,
            estatisticasCasa.jogos,
            estatisticasFora.jogos,
            estatisticasH2H.jogos
        );


    const odds =
        dados?.odds ??
        info.odds ??
        {};


    const valueCasa =
        calcularValueBet(
            probabilidades.casa,
            odds.casa ??
            odds.home
        );


    const valueEmpate =
        calcularValueBet(
            probabilidades.empate,
            odds.empate ??
            odds.draw
        );


    const valueFora =
        calcularValueBet(
            probabilidades.fora,
            odds.fora ??
            odds.away
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
                    odds.casa ??
                    odds.home
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
                    odds.empate ??
                    odds.draw
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
                    odds.fora ??
                    odds.away
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


    const resultado = {

        sucesso:
            true,

        algoritmo:
            "BetVision AI Motor Estatístico v8",

        api_id:
            info.api_id,

        data_jogo:
            info.data_jogo,

        jogo: {

            nome:
                info.nome,

            casa:
                info.casa,

            fora:
                info.fora
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

            h2h:
                estatisticasH2H,

            amostra:
                Math.min(
                    estatisticasCasa.jogos,
                    estatisticasFora.jogos
                )
        },

        h2h:
            estatisticasH2H,

        valueBets,

        confianca,

        qualidadeDados:

            Math.min(
                estatisticasCasa.jogos,
                estatisticasFora.jogos
            ) >= MINIMO_HISTORICO

                ? "Boa"

                : "Limitada"
    };


    console.log(
        `📊 ${info.casa}: ` +
        `${estatisticasCasa.jogos} jogos | ` +
        `forma ${estatisticasCasa.forma}% | ` +
        `gols ${estatisticasCasa.golsMarcados}`
    );


    console.log(
        `📊 ${info.fora}: ` +
        `${estatisticasFora.jogos} jogos | ` +
        `forma ${estatisticasFora.forma}% | ` +
        `gols ${estatisticasFora.golsMarcados}`
    );


    console.log(
        `⚔️ H2H: ${estatisticasH2H.jogos} confrontos | ` +
        `Casa ${estatisticasH2H.vitoriasCasa} vitórias | ` +
        `Empates ${estatisticasH2H.empates} | ` +
        `Fora ${estatisticasH2H.vitoriasFora}`
    );


    return resultado;
}


// ==========================================================
// GERAR ANÁLISE IA
// ==========================================================

export async function gerarAnaliseIA(
    jogo,
    dados = {}
) {

    return await analisarMercado(
        jogo,
        dados
    );
}


// ==========================================================
// COMPATIBILIDADE COM O SINCRONIZADOR
//
// MUITO IMPORTANTE:
//
// O sincronizador pode chamar:
//
// gerarAnaliseInteligente(jogo)
//
// onde "jogo" é um OBJETO.
//
// Esta função agora aceita o objeto.
// ==========================================================

export async function gerarAnaliseInteligente(
    jogo,
    dados = {}
) {

    try {

        const info =
            normalizarJogo(
                jogo
            );


        console.log(
            `📊 Buscando histórico: ${info.nome}`
        );


        const resultado =
            await analisarMercado(
                info,
                dados
            );


        return resultado;

    } catch (erro) {

        console.error(
            `❌ Erro análise ${

                typeof jogo === "string"

                    ? jogo

                    : jogo?.nome ??
                      jogo?.jogo ??
                      `${jogo?.time_casa ?? ""} x ` +
                      `${jogo?.time_fora ?? ""}`

            }: ${erro.message}`
        );


        throw erro;
    }
}


// ==========================================================
// LISTAR ANÁLISES
//
// Mantém compatibilidade.
//
// SOMENTE HOJE + AMANHÃ.
// ==========================================================

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

                    BETWEEN

                    $2::date

                    AND

                    $3::date

                ORDER BY

                    j.data_jogo ASC,

                    a.criado_em DESC,

                    a.id DESC

                LIMIT 100
                `,
                [
                    TIMEZONE,
                    obterDataHojeBrasil(),
                    (() => {

                        const hoje =
                            new Date(
                                `${obterDataHojeBrasil()}T00:00:00`
                            );

                        hoje.setDate(
                            hoje.getDate() + 1
                        );

                        return hoje
                            .toISOString()
                            .slice(0, 10);

                    })()
                ]
            );


        return resultado.rows || [];

    } catch (erro) {

        console.error(
            "❌ Erro listar análises:",
            erro.message
        );

        return [];
    }
}


// ==========================================================
// EXPORT DEFAULT
// ==========================================================

export default {

    analisarMercado,

    gerarAnaliseIA,

    gerarAnaliseInteligente,

    listarAnalises

};
