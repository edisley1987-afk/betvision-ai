// ==========================================================
// BETVISION AI
// services/inteligenciaService.js
//
// MOTOR ESTATÍSTICO v8.0
//
// CORREÇÕES:
//
// - gerarAnaliseInteligente EXISTE
// - gerarAnaliseIA mantida para compatibilidade
// - aceita STRING ou OBJETO de jogo
// - nunca analisa jogo vazio
// - histórico real PostgreSQL
// - H2H real PostgreSQL
// - somente histórico anterior ao jogo
// - Poisson
// - 1X2
// - Gols esperados
// - Placar provável
// - Over / Under
// - Ambas Marcam
// - Value Bet
// - Confiança
// - Sem Math.random()
// - America/Sao_Paulo
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

const MINIMO_JOGOS_HISTORICO =
    3;

const LIMITE_HISTORICO =
    10;

const LIMITE_H2H =
    10;

const MAX_GOLS_POISSON =
    10;


// ==========================================================
// UTILITÁRIOS
// ==========================================================

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


function arredondar(
    valor,
    casas = 2
) {

    const n =
        numero(valor);

    const fator =
        10 ** casas;

    return Math.round(
        n * fator
    ) / fator;

}


function texto(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }

    return String(valor)
        .trim();

}


// ==========================================================
// DATA BRASIL
// ==========================================================

function obterDataHojeBrasil() {

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


// ==========================================================
// NORMALIZAR DATA PARA SQL
// ==========================================================

function normalizarDataJogo(
    jogo
) {

    const candidatos = [

        jogo?.data_jogo,
        jogo?.dataJogo,
        jogo?.jogo_data,

        jogo?.data,
        jogo?.inicio,
        jogo?.kickoff,

        jogo?.date,
        jogo?.datetime,

        jogo?.fixture?.date

    ];

    for (
        const valor of candidatos
    ) {

        if (!valor) {
            continue;
        }

        const data =
            new Date(valor);

        if (
            !Number.isNaN(
                data.getTime()
            )
        ) {

            return data;

        }

    }

    return null;

}


// ==========================================================
// EXTRAIR EQUIPES
//
// Aceita:
//
// "Palmeiras x Flamengo"
//
// ou:
//
// {
//   time_casa: "...",
//   time_fora: "..."
// }
//
// ou formatos da API.
//
// ==========================================================

function extrairEquipes(
    jogo
) {

    if (
        jogo &&
        typeof jogo === "object"
    ) {

        const casa =
            texto(
                jogo.time_casa ??
                jogo.casa ??
                jogo.home_team ??
                jogo.homeTeam ??
                jogo.home ??
                jogo.equipe_casa ??
                jogo.equipeCasa ??
                jogo.fixture?.teams?.home?.name
            );

        const fora =
            texto(
                jogo.time_fora ??
                jogo.fora ??
                jogo.away_team ??
                jogo.awayTeam ??
                jogo.away ??
                jogo.equipe_fora ??
                jogo.equipeFora ??
                jogo.fixture?.teams?.away?.name
            );

        if (
            casa &&
            fora
        ) {

            return {
                casa,
                fora
            };

        }

        const nome =
            texto(
                jogo.jogo ??
                jogo.nome ??
                jogo.name
            );

        if (nome) {

            return separarJogo(
                nome
            );

        }

    }


    return separarJogo(
        texto(jogo)
    );

}


// ==========================================================
// SEPARAR JOGO STRING
// ==========================================================

function separarJogo(
    jogo
) {

    const valor =
        texto(jogo);

    if (!valor) {

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
        " Vs ",

        " v ",
        " V ",

        " - "

    ];


    for (
        const separador
        of separadores
    ) {

        if (
            valor.includes(
                separador
            )
        ) {

            const partes =
                valor.split(
                    separador
                );

            const casa =
                texto(
                    partes.shift()
                );

            const fora =
                texto(
                    partes.join(
                        separador
                    )
                );

            return {
                casa,
                fora
            };

        }

    }


    return {
        casa: valor,
        fora: ""
    };

}


// ==========================================================
// NOME DO JOGO
// ==========================================================

function montarNomeJogo(
    casa,
    fora
) {

    if (
        casa &&
        fora
    ) {

        return `${casa} x ${fora}`;

    }

    return (
        casa ||
        fora ||
        ""
    );

}


// ==========================================================
// POISSON
// ==========================================================

function fatorial(
    n
) {

    if (
        n <= 1
    ) {

        return 1;

    }

    let resultado =
        1;

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

    const k =
        Number(gols);

    const media =
        numero(lambda);

    if (
        !Number.isInteger(k) ||
        k < 0 ||
        media <= 0
    ) {

        return 0;

    }

    return (
        Math.exp(-media) *
        Math.pow(media, k)
    ) /
    fatorial(k);

}


// ==========================================================
// MÉDIA
// ==========================================================

function calcularMedia(
    valores
) {

    if (
        !Array.isArray(valores) ||
        valores.length === 0
    ) {

        return 0;

    }

    const lista =
        valores
            .map(
                valor =>
                    numero(valor)
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


// ==========================================================
// HISTÓRICO DA EQUIPE
//
// IMPORTANTE:
// somente jogos anteriores ao jogo analisado.
// ==========================================================

async function buscarHistoricoEquipe(
    nomeEquipe,
    dataJogo = null
) {

    if (!nomeEquipe) {

        return [];

    }


    try {

        let resultado;


        if (
            dataJogo
        ) {

            resultado =
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

                        AND data_jogo IS NOT NULL

                        AND data_jogo < $2

                    ORDER BY
                        data_jogo DESC

                    LIMIT $3
                    `,

                    [
                        nomeEquipe,
                        dataJogo,
                        LIMITE_HISTORICO
                    ]

                );

        }

        else {

            resultado =
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

                        AND data_jogo IS NOT NULL

                        AND data_jogo <
                        CURRENT_TIMESTAMP

                    ORDER BY
                        data_jogo DESC

                    LIMIT $2
                    `,

                    [
                        nomeEquipe,
                        LIMITE_HISTORICO
                    ]

                );

        }


        const linhas =
            resultado?.rows || [];


        console.log(
            `📚 Banco retornou ${linhas.length} ` +
            `registros para ${nomeEquipe}`
        );


        return linhas;

    }

    catch (erro) {

        console.error(
            `❌ Erro histórico ${nomeEquipe}:`,
            erro.message
        );

        return [];

    }

}


// ==========================================================
// VALIDAR HISTÓRICO
// ==========================================================

function jogoHistoricoValido(
    jogo
) {

    if (!jogo) {
        return false;
    }

    const golsCasa =
        Number(
            jogo.gols_casa
        );

    const golsFora =
        Number(
            jogo.gols_fora
        );

    if (
        !Number.isFinite(golsCasa) ||
        !Number.isFinite(golsFora)
    ) {

        return false;

    }

    if (
        golsCasa < 0 ||
        golsFora < 0
    ) {

        return false;

    }

    return true;

}


// ==========================================================
// FILTRAR HISTÓRICO VÁLIDO
// ==========================================================

function filtrarHistoricoValido(
    historico
) {

    if (
        !Array.isArray(historico)
    ) {

        return [];

    }

    return historico.filter(
        jogo =>
            jogoHistoricoValido(
                jogo
            )
    );

}


// ==========================================================
// ESTATÍSTICAS DA EQUIPE
// ==========================================================

function calcularEstatisticasEquipe(
    historico,
    equipe
) {

    const jogos =
        filtrarHistoricoValido(
            historico
        );


    if (
        jogos.length === 0
    ) {

        return {

            jogos: 0,

            golsMarcados: 1,

            golsSofridos: 1,

            vitorias: 0,

            empates: 0,

            derrotas: 0,

            aproveitamento: 0.5,

            forma: 0.5

        };

    }


    const golsMarcados = [];
    const golsSofridos = [];

    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;


    const nomeEquipe =
        texto(equipe)
            .toLowerCase();


    for (
        const jogo of jogos
    ) {

        const casa =
            texto(
                jogo.time_casa
            );

        const fora =
            texto(
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


    const totalJogos =
        jogos.length;


    const aproveitamento =
        (
            vitorias * 3 +
            empates
        )
        /
        (
            totalJogos * 3
        );


    const pontosForma = [];


    for (
        const jogo of jogos
    ) {

        const casa =
            texto(
                jogo.time_casa
            )
            .toLowerCase();

        const equipeEhCasa =
            casa ===
            nomeEquipe;


        const gc =
            numero(
                jogo.gols_casa
            );

        const gf =
            numero(
                jogo.gols_fora
            );


        let pontos =
            0;


        if (equipeEhCasa) {

            if (
                gc > gf
            ) {

                pontos = 1;

            }
            else if (
                gc === gf
            ) {

                pontos = 0.5;

            }

        }
        else {

            if (
                gf > gc
            ) {

                pontos = 1;

            }
            else if (
                gf === gc
            ) {

                pontos = 0.5;

            }

        }


        pontosForma.push(
            pontos
        );

    }


    return {

        jogos:
            totalJogos,

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
            ),

        forma:
            arredondar(
                calcularMedia(
                    pontosForma
                ),
                4
            )

    };

}


// ==========================================================
// H2H
// ==========================================================

async function buscarH2H(
    casa,
    fora,
    dataJogo = null
) {

    if (
        !casa ||
        !fora
    ) {

        return [];

    }


    try {

        let resultado;


        if (
            dataJogo
        ) {

            resultado =
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

                                LOWER(
                                    TRIM(time_casa)
                                )
                                =
                                LOWER(
                                    TRIM($1)
                                )

                                AND

                                LOWER(
                                    TRIM(time_fora)
                                )
                                =
                                LOWER(
                                    TRIM($2)
                                )

                            )

                            OR

                            (

                                LOWER(
                                    TRIM(time_casa)
                                )
                                =
                                LOWER(
                                    TRIM($2)
                                )

                                AND

                                LOWER(
                                    TRIM(time_fora)
                                )
                                =
                                LOWER(
                                    TRIM($1)
                                )

                            )

                        )

                        AND data_jogo IS NOT NULL

                        AND data_jogo < $3

                    ORDER BY
                        data_jogo DESC

                    LIMIT $4
                    `,

                    [
                        casa,
                        fora,
                        dataJogo,
                        LIMITE_H2H
                    ]

                );

        }

        else {

            resultado =
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

                                LOWER(
                                    TRIM(time_casa)
                                )
                                =
                                LOWER(
                                    TRIM($1)
                                )

                                AND

                                LOWER(
                                    TRIM(time_fora)
                                )
                                =
                                LOWER(
                                    TRIM($2)
                                )

                            )

                            OR

                            (

                                LOWER(
                                    TRIM(time_casa)
                                )
                                =
                                LOWER(
                                    TRIM($2)
                                )

                                AND

                                LOWER(
                                    TRIM(time_fora)
                                )
                                =
                                LOWER(
                                    TRIM($1)
                                )

                            )

                        )

                        AND data_jogo IS NOT NULL

                        AND data_jogo <
                        CURRENT_TIMESTAMP

                    ORDER BY
                        data_jogo DESC

                    LIMIT $3
                    `,

                    [
                        casa,
                        fora,
                        LIMITE_H2H
                    ]

                );

        }


        const linhas =
            resultado?.rows || [];


        console.log(
            `⚔️ H2H banco: ${linhas.length} ` +
            `registros encontrados`
        );


        return filtrarHistoricoValido(
            linhas
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro H2H:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// ESTATÍSTICAS H2H
// ==========================================================

function calcularEstatisticasH2H(
    historico,
    casa,
    fora
) {

    const jogos =
        filtrarHistoricoValido(
            historico
        );


    let vitoriasCasa = 0;
    let empates = 0;
    let vitoriasFora = 0;


    const golsCasa = [];
    const golsFora = [];


    for (
        const jogo of jogos
    ) {

        const nomeCasa =
            texto(
                jogo.time_casa
            );


        const gc =
            numero(
                jogo.gols_casa
            );

        const gf =
            numero(
                jogo.gols_fora
            );


        const casaFoiMandante =
            nomeCasa
                .toLowerCase()
                ===
                texto(casa)
                    .toLowerCase();


        if (casaFoiMandante) {

            golsCasa.push(gc);
            golsFora.push(gf);

            if (gc > gf) {
                vitoriasCasa++;
            }
            else if (gc === gf) {
                empates++;
            }
            else {
                vitoriasFora++;
            }

        }
        else {

            golsCasa.push(gf);
            golsFora.push(gc);

            if (gf > gc) {
                vitoriasCasa++;
            }
            else if (gf === gc) {
                empates++;
            }
            else {
                vitoriasFora++;
            }

        }

    }


    return {

        jogos:
            jogos.length,

        casaVitorias:
            vitoriasCasa,

        empates,

        foraVitorias:
            vitoriasFora,

        golsCasa:
            arredondar(
                calcularMedia(
                    golsCasa
                ),
                3
            ),

        golsFora:
            arredondar(
                calcularMedia(
                    golsFora
                ),
                3
            )

    };

}


// ==========================================================
// FORÇA OFENSIVA
// ==========================================================

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


// ==========================================================
// FORÇA DEFENSIVA
//
// Aqui usamos gols sofridos como referência.
//
// Quanto maior o número de gols sofridos,
// maior a vulnerabilidade defensiva.
// ==========================================================

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


// ==========================================================
// GOLS ESPERADOS
// ==========================================================

function calcularGolsEsperados(
    casa,
    fora,
    h2h = null
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


    // ======================================================
    // PEQUENO AJUSTE H2H
    //
    // Somente quando existem confrontos válidos.
    // Peso baixo para não dominar o modelo.
    // ======================================================

    if (
        h2h &&
        h2h.jogos >= 3
    ) {

        const mediaH2HCasa =
            numero(
                h2h.golsCasa
            );

        const mediaH2HFora =
            numero(
                h2h.golsFora
            );


        lambdaCasa =
            (
                lambdaCasa * 0.80
            )
            +
            (
                mediaH2HCasa * 0.20
            );


        lambdaFora =
            (
                lambdaFora * 0.80
            )
            +
            (
                mediaH2HFora * 0.20
            );

    }


    // ======================================================
    // MANDO DE CAMPO
    // ======================================================

    lambdaCasa *=
        1.10;

    lambdaFora *=
        0.95;


    // ======================================================
    // LIMITES
    // ======================================================

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
// PROBABILIDADE DE GOLS ATÉ
// ==========================================================

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


// ==========================================================
// OVER
// ==========================================================

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


// ==========================================================
// UNDER
// ==========================================================

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
// 1X2
// ==========================================================

function calcularProbabilidadesResultado(
    golsCasa,
    golsFora
) {

    let casa = 0;
    let empate = 0;
    let fora = 0;


    for (
        let gc = 0;
        gc <= MAX_GOLS_POISSON;
        gc++
    ) {

        for (
            let gf = 0;
            gf <= MAX_GOLS_POISSON;
            gf++
        ) {

            const probCasa =
                poisson(
                    gc,
                    golsCasa
                );

            const probFora =
                poisson(
                    gf,
                    golsFora
                );


            const prob =
                probCasa *
                probFora;


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
// PLACAR PROVÁVEL
// ==========================================================

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
                maiorProbabilidade *
                100,
                2
            )

    };

}


// ==========================================================
// AMBAS MARCAM
// ==========================================================

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

        numero(
            probabilidades.casa
        ),

        numero(
            probabilidades.empate
        ),

        numero(
            probabilidades.fora
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


    const amostra =
        Math.min(
            numero(
                amostraCasa
            ),
            numero(
                amostraFora
            )
        );


    let confianca =
        35;


    confianca +=
        margem * 100;


    if (
        amostra >= 10
    ) {

        confianca += 12;

    }
    else if (
        amostra >= 8
    ) {

        confianca += 10;

    }
    else if (
        amostra >= 5
    ) {

        confianca += 6;

    }
    else if (
        amostra >= 3
    ) {

        confianca += 3;

    }


    if (
        h2hJogos >= 5
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


// ==========================================================
// PROBABILIDADE IMPLÍCITA
// ==========================================================

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


// ==========================================================
// VALUE BET
// ==========================================================

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
        probabilidade -
        probabilidadeMercado;


    const valorEstimado =
        (
            probabilidade *
            oddNumerica
        ) -
        1;


    const oddJusta =
        1 /
        probabilidade;


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


// ==========================================================
// NORMALIZAR ODDS
// ==========================================================

function extrairOdds(
    dados
) {

    const odds =
        dados?.odds ||
        dados?.odd ||
        {};


    return {

        casa:
            numero(
                odds.casa ??
                odds.home ??
                odds.home_win ??
                dados?.odd_casa
            ),

        empate:
            numero(
                odds.empate ??
                odds.draw ??
                dados?.odd_empate
            ),

        fora:
            numero(
                odds.fora ??
                odds.away ??
                odds.away_win ??
                dados?.odd_fora
            )

    };

}


// ==========================================================
// ANÁLISE PRINCIPAL
// ==========================================================

export async function analisarMercado(
    jogo,
    dados = {}
) {

    // ======================================================
    // ACEITAR OBJETO OU STRING
    // ======================================================

    const equipes =
        extrairEquipes(
            jogo
        );


    if (
        !equipes.casa ||
        !equipes.fora
    ) {

        throw new Error(
            "Jogo não informado"
        );

    }


    const nomeJogo =
        montarNomeJogo(
            equipes.casa,
            equipes.fora
        );


    const dataJogo =
        normalizarDataJogo(
            jogo
        );


    console.log(
        "=================================================="
    );

    console.log(
        `📊 BUSCANDO HISTÓRICO REAL: ${nomeJogo}`
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


    // ======================================================
    // HISTÓRICO
    // ======================================================

    console.log(
        `📚 Consultando histórico do time: ${equipes.casa}`
    );

    const historicoCasa =
        await buscarHistoricoEquipe(
            equipes.casa,
            dataJogo
        );


    console.log(
        `📚 Consultando histórico do time: ${equipes.fora}`
    );

    const historicoFora =
        await buscarHistoricoEquipe(
            equipes.fora,
            dataJogo
        );


    const historicoCasaValido =
        filtrarHistoricoValido(
            historicoCasa
        );

    const historicoForaValido =
        filtrarHistoricoValido(
            historicoFora
        );


    console.log(
        `📊 ${equipes.casa}: ` +
        `${historicoCasaValido.length} jogos históricos válidos`
    );

    console.log(
        `📊 ${equipes.fora}: ` +
        `${historicoForaValido.length} jogos históricos válidos`
    );


    // ======================================================
    // H2H
    // ======================================================

    console.log(
        `⚔️ Consultando H2H: ${nomeJogo}`
    );


    const h2hHistorico =
        await buscarH2H(
            equipes.casa,
            equipes.fora,
            dataJogo
        );


    const h2h =
        calcularEstatisticasH2H(
            h2hHistorico,
            equipes.casa,
            equipes.fora
        );


    console.log(
        `⚔️ H2H válido: ${h2h.jogos} confrontos`
    );

    console.log(
        `⚔️ H2H: ${h2h.jogos} confrontos | ` +
        `Casa ${h2h.casaVitorias} vitórias | ` +
        `Empates ${h2h.empates} | ` +
        `Fora ${h2h.foraVitorias}`
    );


    // ======================================================
    // ESTATÍSTICAS
    // ======================================================

    const estatisticasCasa =
        calcularEstatisticasEquipe(
            historicoCasaValido,
            equipes.casa
        );


    const estatisticasFora =
        calcularEstatisticasEquipe(
            historicoForaValido,
            equipes.fora
        );


    console.log(
        `📊 ${equipes.casa}: ` +
        `${estatisticasCasa.jogos} jogos | ` +
        `forma ${arredondar(
            estatisticasCasa.forma * 100,
            1
        )}% | ` +
        `gols ${estatisticasCasa.golsMarcados}`
    );


    console.log(
        `📊 ${equipes.fora}: ` +
        `${estatisticasFora.jogos} jogos | ` +
        `forma ${arredondar(
            estatisticasFora.forma * 100,
            1
        )}% | ` +
        `gols ${estatisticasFora.golsMarcados}`
    );


    // ======================================================
    // GOLS ESPERADOS
    // ======================================================

    const gols =
        calcularGolsEsperados(
            estatisticasCasa,
            estatisticasFora,
            h2h
        );


    // ======================================================
    // 1X2
    // ======================================================

    const probabilidades =
        calcularProbabilidadesResultado(
            gols.casa,
            gols.fora
        );


    // ======================================================
    // PLACAR
    // ======================================================

    const placar =
        preverPlacar(
            gols.casa,
            gols.fora
        );


    // ======================================================
    // AMBAS MARCAM
    // ======================================================

    const ambasMarcam =
        calcularAmbasMarcam(
            gols.casa,
            gols.fora
        );


    // ======================================================
    // MERCADOS
    // ======================================================

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


    // ======================================================
    // AMOSTRA
    // ======================================================

    const amostra =
        Math.min(
            estatisticasCasa.jogos,
            estatisticasFora.jogos
        );


    // ======================================================
    // CONFIANÇA
    // ======================================================

    const confianca =
        calcularConfianca(
            probabilidades,
            estatisticasCasa.jogos,
            estatisticasFora.jogos,
            h2h.jogos
        );


    // ======================================================
    // ODDS
    // ======================================================

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
                odds.empate,

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
                odds.fora,

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


    // ======================================================
    // RESULTADO
    // ======================================================

    return {

        sucesso:
            true,

        algoritmo:
            "BetVision AI Motor Estatístico v8.0",

        jogo: {

            nome:
                nomeJogo,

            casa:
                equipes.casa,

            fora:
                equipes.fora,

            api_id:
                jogo?.api_id ??
                jogo?.apiId ??
                null,

            data_jogo:
                jogo?.data_jogo ??
                jogo?.dataJogo ??
                null

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

            h2h,

            amostra

        },

        odds,

        valueBets,

        confianca,

        qualidadeDados:
            amostra >=
            MINIMO_JOGOS_HISTORICO
                ? "Boa"
                : "Limitada"

    };

}


// ==========================================================
// GERAR ANÁLISE IA
//
// Compatibilidade antiga.
//
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
// GERAR ANÁLISE INTELIGENTE
//
// ESTA É A FUNÇÃO QUE routes/analises.js IMPORTA.
//
// ==========================================================

export async function gerarAnaliseInteligente(
    jogo,
    dados = {}
) {

    if (
        !jogo
    ) {

        throw new Error(
            "Jogo não informado"
        );

    }


    return await analisarMercado(
        jogo,
        dados
    );

}


// ==========================================================
// LISTAR ANÁLISES
//
// Compatibilidade de serviço.
//
// SOMENTE HOJE + AMANHÃ.
//
// ==========================================================

export async function listarAnalises() {

    try {

        const resultado =
            await query(

                `
                SELECT *

                FROM analises

                WHERE

                    data_jogo IS NOT NULL

                    AND

                    (
                        data_jogo
                        AT TIME ZONE
                        $1
                    )::date

                    BETWEEN

                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        $1
                    )::date

                    AND

                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        $1
                    )::date + 1

                ORDER BY
                    data_jogo ASC

                LIMIT 100
                `,

                [
                    TIMEZONE
                ]

            );


        return (
            resultado.rows ||
            []
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


// ==========================================================
// EXPORT DEFAULT
// ==========================================================

export default {

    analisarMercado,

    gerarAnaliseIA,

    gerarAnaliseInteligente,

    listarAnalises

};
