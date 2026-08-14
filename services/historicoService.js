// ==========================================================
// BETVISION AI
// services/historicoService.js
//
// VERSÃO 11.0
// MOTOR DE HISTÓRICO ESTATÍSTICO
// PostgreSQL / NeonDB
//
// RESPONSABILIDADES:
//
// - Buscar histórico real dos times
// - Histórico do time mandante
// - Histórico do time visitante
// - Confrontos diretos H2H
// - Nunca criar jogos fictícios
// - Nunca usar jogos futuros como histórico
// - Nunca usar jogos de hoje como histórico
// - Somente jogos com resultado real
// - Compatível com PostgreSQL / NeonDB
// - api_id tratado como INTEGER
// - Timezone: America/Sao_Paulo
//
// CORREÇÕES V11:
//
// 1. Não transforma ausência de placar em 0 x 0
// 2. Somente jogos com resultado real entram nas estatísticas
// 3. Jogos futuros são ignorados
// 4. Jogos de hoje são ignorados
// 5. Jogos em andamento são ignorados
// 6. H2H usa somente partidas concluídas
// 7. Normalização de nomes mais robusta
// 8. Evita duplicação
// 9. Não depende de jogo_id
// 10. api_id é preservado
// 11. Limite é aplicado depois dos filtros
// 12. Compatível com routes/jogos.js
// 13. Não cria dados artificiais
// 14. Não apaga histórico
// ==========================================================

import {
    query
} from "../database/database.js";


// ==========================================================
// CONFIGURAÇÃO
// ==========================================================

const TIMEZONE =
    "America/Sao_Paulo";


const LIMITE_HISTORICO =
    20;


const LIMITE_H2H =
    20;


// Quantidade maior buscada inicialmente.
// Depois os registros inválidos são removidos.
// Isso evita que jogos sem placar ocupem o limite.
const LIMITE_BUSCA_HISTORICO =
    100;


const LIMITE_BUSCA_H2H =
    100;


// ==========================================================
// DATA ATUAL
// ==========================================================

function obterAgora() {

    const agora =
        new Date();


    if (
        Number.isNaN(
            agora.getTime()
        )
    ) {

        return null;

    }


    return agora;

}


// ==========================================================
// DATA DE HOJE NO BRASIL
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

    }

    catch (
        erro
    ) {

        console.error(
            "❌ Erro data Brasil:",
            erro.message
        );

        return null;

    }

}


// ==========================================================
// NORMALIZAR NOME
//
// Usado somente para comparação.
//
// Não altera o nome original salvo no banco.
// ==========================================================

function normalizarNomeTime(
    nome
) {

    if (
        nome === undefined ||
        nome === null
    ) {

        return "";

    }


    return String(
        nome
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase();

}


// ==========================================================
// VALIDAR NOME
// ==========================================================

function nomeTimeValido(
    nome
) {

    const normalizado =
        normalizarNomeTime(
            nome
        );


    if (
        !normalizado
    ) {

        return false;

    }


    const invalidos = [

        "casa",
        "fora",
        "home",
        "away",
        "home team",
        "away team",
        "time a",
        "time b",
        "null",
        "undefined",
        "n/a",
        "na"

    ];


    return !invalidos.includes(
        normalizado
    );

}


// ==========================================================
// NORMALIZAR API ID
// ==========================================================

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
        Number(
            valor
        );


    if (
        !Number.isInteger(
            numero
        )
        ||
        numero <= 0
    ) {

        return null;

    }


    return numero;

}


// ==========================================================
// CONVERTER NÚMERO
// ==========================================================

function numeroSeguro(
    valor,
    padrao = 0
) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {

        return padrao;

    }


    const numero =
        Number(
            valor
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : padrao;

}


// ==========================================================
// OBTER DATA DO JOGO
// ==========================================================

function obterDataJogo(
    jogo
) {

    if (
        !jogo
    ) {

        return null;

    }


    return (

        jogo.data_jogo ??

        jogo.dataJogo ??

        jogo.utcDate ??

        jogo.horario ??

        jogo.data ??

        jogo.fixture?.date ??

        null

    );

}


// ==========================================================
// OBTER STATUS
// ==========================================================

function obterStatus(
    jogo
) {

    if (
        !jogo
    ) {

        return "";

    }


    const status =
        jogo.status;


    if (
        typeof status ===
        "string"
    ) {

        return status
            .trim()
            .toUpperCase();

    }


    if (
        status &&
        typeof status ===
        "object"
    ) {

        return String(

            status.short ??
            status.type ??
            status.long ??
            ""

        )
            .trim()
            .toUpperCase();

    }


    return String(

        jogo.status_short ??
        jogo.statusShort ??
        jogo.status_type ??
        ""

    )
        .trim()
        .toUpperCase();

}


// ==========================================================
// OBTER TIMES
// ==========================================================

function obterTimeCasa(
    jogo
) {

    if (
        !jogo
    ) {

        return null;

    }


    return (

        jogo.time_casa ??

        jogo.timeCasa ??

        jogo.casa ??

        jogo.home_team ??

        jogo.homeTeam?.name ??

        jogo.teams?.home?.name ??

        null

    );

}


function obterTimeFora(
    jogo
) {

    if (
        !jogo
    ) {

        return null;

    }


    return (

        jogo.time_fora ??

        jogo.timeFora ??

        jogo.fora ??

        jogo.away_team ??

        jogo.awayTeam?.name ??

        jogo.teams?.away?.name ??

        null

    );

}


// ==========================================================
// OBTER GOLS
//
// IMPORTANTE:
//
// Esta função retorna null quando o placar NÃO existe.
//
// Nunca converte ausência de placar para 0 x 0.
// ==========================================================

function obterGols(
    jogo
) {

    if (
        !jogo
    ) {

        return {

            possui:
                false,

            casa:
                null,

            fora:
                null

        };

    }


    // ======================================================
    // FORMATO DIRETO
    // ======================================================

    const camposDiretos = [

        [
            jogo.gols_casa,
            jogo.gols_fora
        ],

        [
            jogo.golsCasa,
            jogo.golsFora
        ],

        [
            jogo.home_goals,
            jogo.away_goals
        ],

        [
            jogo.homeGoals,
            jogo.awayGoals
        ]

    ];


    for (
        const [
            casa,
            fora
        ]
        of camposDiretos
    ) {

        if (

            casa !== undefined &&
            casa !== null &&
            casa !== "" &&

            fora !== undefined &&
            fora !== null &&
            fora !== ""

        ) {

            const golsCasa =
                Number(
                    casa
                );


            const golsFora =
                Number(
                    fora
                );


            if (

                Number.isFinite(
                    golsCasa
                )

                &&

                Number.isFinite(
                    golsFora
                )

                &&

                golsCasa >= 0

                &&

                golsFora >= 0

            ) {

                return {

                    possui:
                        true,

                    casa:
                        golsCasa,

                    fora:
                        golsFora

                };

            }

        }

    }


    // ======================================================
    // PLACAR
    // ======================================================

    const placar =
        jogo.placar;


    if (
        placar
    ) {

        const casa =
            placar.casa ??
            placar.home;


        const fora =
            placar.fora ??
            placar.away;


        if (

            casa !== undefined &&
            casa !== null &&

            fora !== undefined &&
            fora !== null

        ) {

            const golsCasa =
                Number(
                    casa
                );


            const golsFora =
                Number(
                    fora
                );


            if (

                Number.isFinite(
                    golsCasa
                )

                &&

                Number.isFinite(
                    golsFora
                )

                &&

                golsCasa >= 0

                &&

                golsFora >= 0

            ) {

                return {

                    possui:
                        true,

                    casa:
                        golsCasa,

                    fora:
                        golsFora

                };

            }

        }

    }


    // ======================================================
    // SCORE
    // ======================================================

    const score =
        jogo.score;


    if (
        score
    ) {

        const fullTime =
            score.fullTime ??
            score.fulltime ??
            null;


        if (
            fullTime
        ) {

            const casa =
                fullTime.home;


            const fora =
                fullTime.away;


            if (

                casa !== undefined &&
                casa !== null &&

                fora !== undefined &&
                fora !== null

            ) {

                const golsCasa =
                    Number(
                        casa
                    );


                const golsFora =
                    Number(
                        fora
                    );


                if (

                    Number.isFinite(
                        golsCasa
                    )

                    &&

                    Number.isFinite(
                        golsFora
                    )

                    &&

                    golsCasa >= 0

                    &&

                    golsFora >= 0

                ) {

                    return {

                        possui:
                            true,

                        casa:
                            golsCasa,

                        fora:
                            golsFora

                    };

                }

            }

        }


        // Alguns formatos

        const casa =
            score.home;


        const fora =
            score.away;


        if (

            casa !== undefined &&
            casa !== null &&

            fora !== undefined &&
            fora !== null

        ) {

            const golsCasa =
                Number(
                    casa
                );


            const golsFora =
                Number(
                    fora
                );


            if (

                Number.isFinite(
                    golsCasa
                )

                &&

                Number.isFinite(
                    golsFora
                )

                &&

                golsCasa >= 0

                &&

                golsFora >= 0

            ) {

                return {

                    possui:
                        true,

                    casa:
                        golsCasa,

                    fora:
                        golsFora

                };

            }

        }

    }


    // ======================================================
    // NÃO EXISTE RESULTADO
    // ======================================================

    return {

        possui:
            false,

        casa:
            null,

        fora:
            null

    };

}


// ==========================================================
// VERIFICAR DATA
// ==========================================================

function obterTimestamp(
    valor
) {

    if (
        !valor
    ) {

        return null;

    }


    const data =
        new Date(
            valor
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return null;

    }


    return data.getTime();

}


// ==========================================================
// JOGO É ANTERIOR A AGORA
// ==========================================================

function jogoJaRealizado(
    jogo
) {

    const data =
        obterTimestamp(
            obterDataJogo(
                jogo
            )
        );


    if (
        data === null
    ) {

        return false;

    }


    const agora =
        obterAgora();


    if (
        !agora
    ) {

        return false;

    }


    return (
        data <
        agora.getTime()
    );

}


// ==========================================================
// VERIFICAR SE É HOJE NO BRASIL
// ==========================================================

function jogoEhHoje(
    jogo
) {

    const valor =
        obterDataJogo(
            jogo
        );


    if (
        !valor
    ) {

        return false;

    }


    const data =
        new Date(
            valor
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return false;

    }


    const hoje =
        obterDataHojeBrasil();


    if (
        !hoje
    ) {

        return false;

    }


    const dataLocal =
        new Intl.DateTimeFormat(
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
            data
        );


    return (
        dataLocal ===
        hoje
    );

}


// ==========================================================
// STATUS PERMITE HISTÓRICO
// ==========================================================

function statusPermiteHistorico(
    jogo
) {

    const status =
        obterStatus(
            jogo
        );


    // ======================================================
    // SEM STATUS
    //
    // A data + resultado serão as proteções.
    // ======================================================

    if (
        !status
    ) {

        return true;

    }


    const futuros = [

        "NS",
        "TBD",
        "TBA",
        "SCHEDULED",
        "TIMED",
        "NOT_STARTED",
        "UPCOMING",
        "POSTPONED",
        "CANCELLED",
        "CANCELED",
        "PST",
        "CANC",
        "ABD"

    ];


    if (
        futuros.includes(
            status
        )
    ) {

        return false;

    }


    const aoVivo = [

        "LIVE",
        "1H",
        "2H",
        "HT",
        "ET",
        "P",
        "BT",
        "IN_PLAY",
        "PAUSED",
        "INT",
        "2ND_HALF",
        "FIRST_HALF",
        "BREAK"

    ];


    if (
        aoVivo.includes(
            status
        )
    ) {

        return false;

    }


    const encerrados = [

        "FT",
        "AET",
        "PEN",
        "FINISHED",
        "ENDED",
        "COMPLETE",
        "COMPLETED",
        "FINAL",
        "FULL_TIME"

    ];


    if (
        encerrados.includes(
            status
        )
    ) {

        return true;

    }


    // Status desconhecido:
    //
    // A data passada + placar real serão
    // suficientes para permitir o jogo.

    return true;

}


// ==========================================================
// NORMALIZAR JOGO HISTÓRICO
//
// IMPORTANTE:
//
// NÃO cria gols_casa/gols_fora artificiais.
// ==========================================================

function normalizarJogoHistorico(
    jogo
) {

    if (
        !jogo
    ) {

        return null;

    }


    const apiId =
        normalizarApiId(

            jogo.api_id ??

            jogo.apiId ??

            jogo.fixture?.id ??

            null

        );


    const casa =
        obterTimeCasa(
            jogo
        );


    const fora =
        obterTimeFora(
            jogo
        );


    const data =
        obterDataJogo(
            jogo
        );


    const gols =
        obterGols(
            jogo
        );


    const resultado = {

        ...jogo,

        id:
            jogo.id ??
            null,

        api_id:
            apiId,

        time_casa:
            casa,

        time_fora:
            fora,

        data_jogo:
            data,

        status:
            obterStatus(
                jogo
            ) || "FINISHED",

        possui_resultado:
            gols.possui

    };


    // ======================================================
    // Somente adiciona gols se eles realmente existem.
    // ======================================================

    if (
        gols.possui
    ) {

        resultado.gols_casa =
            gols.casa;

        resultado.gols_fora =
            gols.fora;

    }


    return resultado;

}


// ==========================================================
// VALIDAR JOGO HISTÓRICO
// ==========================================================

function jogoHistoricoValido(
    jogo
) {

    if (
        !jogo
    ) {

        return false;

    }


    const casa =
        obterTimeCasa(
            jogo
        );


    const fora =
        obterTimeFora(
            jogo
        );


    if (
        !nomeTimeValido(
            casa
        )
        ||
        !nomeTimeValido(
            fora
        )
    ) {

        return false;

    }


    const casaNormalizada =
        normalizarNomeTime(
            casa
        );


    const foraNormalizada =
        normalizarNomeTime(
            fora
        );


    if (
        !casaNormalizada ||
        !foraNormalizada
    ) {

        return false;

    }


    if (
        casaNormalizada ===
        foraNormalizada
    ) {

        return false;

    }


    const data =
        obterTimestamp(
            obterDataJogo(
                jogo
            )
        );


    if (
        data === null
    ) {

        return false;

    }


    // ======================================================
    // NUNCA USAR JOGO DE HOJE
    // ======================================================

    if (
        jogoEhHoje(
            jogo
        )
    ) {

        return false;

    }


    // ======================================================
    // NUNCA USAR FUTURO
    // ======================================================

    if (
        !jogoJaRealizado(
            jogo
        )
    ) {

        return false;

    }


    // ======================================================
    // NUNCA USAR JOGO NÃO ENCERRADO
    // ======================================================

    if (
        !statusPermiteHistorico(
            jogo
        )
    ) {

        return false;

    }


    // ======================================================
    // RESULTADO REAL OBRIGATÓRIO
    //
    // Essa é uma das principais correções.
    // ======================================================

    const gols =
        obterGols(
            jogo
        );


    if (
        !gols.possui
    ) {

        return false;

    }


    return true;

}


// ==========================================================
// REMOVER DUPLICADOS
//
// Prioridade:
//
// 1. api_id
// 2. id
// 3. times + data
// ==========================================================

function removerDuplicados(
    jogos = []
) {

    if (
        !Array.isArray(
            jogos
        )
    ) {

        return [];

    }


    const mapa =
        new Map();


    for (
        const jogo of jogos
    ) {

        if (
            !jogo
        ) {

            continue;

        }


        const apiId =
            normalizarApiId(
                jogo.api_id
            );


        let chave;


        if (
            apiId
        ) {

            chave =
                `api:${apiId}`;

        }

        else if (
            jogo.id !== undefined &&
            jogo.id !== null
        ) {

            chave =
                `id:${jogo.id}`;

        }

        else {

            const casa =
                normalizarNomeTime(
                    jogo.time_casa
                );


            const fora =
                normalizarNomeTime(
                    jogo.time_fora
                );


            const timestamp =
                obterTimestamp(
                    jogo.data_jogo
                );


            chave =
                [
                    casa,
                    fora,
                    timestamp ??
                    jogo.data_jogo ??
                    ""
                ].join(
                    "|"
                );

        }


        if (
            !mapa.has(
                chave
            )
        ) {

            mapa.set(
                chave,
                jogo
            );

        }

    }


    return Array.from(
        mapa.values()
    );

}


// ==========================================================
// ORDENAR HISTÓRICO
//
// Mais recente primeiro.
// ==========================================================

function ordenarHistorico(
    jogos = []
) {

    if (
        !Array.isArray(
            jogos
        )
    ) {

        return [];

    }


    return [

        ...jogos

    ]
        .sort(
            (
                a,
                b
            ) => {

                const dataA =
                    obterTimestamp(
                        a?.data_jogo
                    ) ??
                    0;


                const dataB =
                    obterTimestamp(
                        b?.data_jogo
                    ) ??
                    0;


                return (
                    dataB -
                    dataA
                );

            }
        );

}


// ==========================================================
// FILTRAR PARA ESTATÍSTICA
// ==========================================================

function filtrarParaEstatistica(
    jogos = []
) {

    if (
        !Array.isArray(
            jogos
        )
    ) {

        return [];

    }


    return jogos.filter(

        jogo => {

            return jogoHistoricoValido(
                jogo
            );

        }

    );

}


// ==========================================================
// BUSCAR HISTÓRICO DO TIME
// ==========================================================

async function buscarHistoricoTime(
    nomeTime
) {

    if (
        !nomeTimeValido(
            nomeTime
        )
    ) {

        return [];

    }


    const nomeOriginal =
        String(
            nomeTime
        ).trim();


    try {

        const agora =
            obterAgora();


        if (
            !agora
        ) {

            return [];

        }


        console.log(

            `📚 Consultando histórico ` +
            `do time: ${nomeOriginal}`

        );


        const resultado =
            await query(

                `
                SELECT *

                FROM jogos

                WHERE

                    data_jogo IS NOT NULL

                    AND

                    data_jogo < $1

                    AND

                    (

                        LOWER(
                            TRIM(
                                time_casa
                            )
                        ) =
                        LOWER(
                            TRIM(
                                $2::text
                            )
                        )

                        OR

                        LOWER(
                            TRIM(
                                time_fora
                            )
                        ) =
                        LOWER(
                            TRIM(
                                $2::text
                            )
                        )

                    )

                ORDER BY
                    data_jogo DESC

                LIMIT $3::integer
                `,

                [

                    agora.toISOString(),

                    nomeOriginal,

                    LIMITE_BUSCA_HISTORICO

                ]

            );


        const rows =
            Array.isArray(
                resultado?.rows
            )
                ? resultado.rows
                : [];


        console.log(

            `📚 Banco retornou ` +
            `${rows.length} registros para ${nomeOriginal}`

        );


        // ==================================================
        // NORMALIZA
        // ==================================================

        const normalizados =

            rows

                .map(
                    normalizarJogoHistorico
                )

                .filter(
                    Boolean
                );


        // ==================================================
        // FILTRA SOMENTE HISTÓRICO REAL
        // ==================================================

        const validos =

            filtrarParaEstatistica(
                normalizados
            );


        // ==================================================
        // REMOVE DUPLICADOS
        // ==================================================

        const unicos =
            removerDuplicados(
                validos
            );


        // ==================================================
        // ORDENA
        // ==================================================

        const ordenados =
            ordenarHistorico(
                unicos
            );


        // ==================================================
        // LIMITE FINAL
        // ==================================================

        const finais =
            ordenados.slice(
                0,
                LIMITE_HISTORICO
            );


        console.log(

            `📊 Histórico válido ${nomeOriginal}: ` +
            `${finais.length} jogos`

        );


        return finais;

    }

    catch (
        erro
    ) {

        console.error(

            `❌ Erro histórico ` +
            `${nomeOriginal}:`,

            erro.message

        );


        return [];

    }

}


// ==========================================================
// BUSCAR H2H
// ==========================================================

async function buscarH2H(
    timeCasa,
    timeFora
) {

    if (
        !nomeTimeValido(
            timeCasa
        )
        ||
        !nomeTimeValido(
            timeFora
        )
    ) {

        return [];

    }


    const casaOriginal =
        String(
            timeCasa
        ).trim();


    const foraOriginal =
        String(
            timeFora
        ).trim();


    try {

        const agora =
            obterAgora();


        if (
            !agora
        ) {

            return [];

        }


        console.log(

            `⚔️ Consultando H2H: ` +
            `${casaOriginal} x ${foraOriginal}`

        );


        const resultado =
            await query(

                `
                SELECT *

                FROM jogos

                WHERE

                    data_jogo IS NOT NULL

                    AND

                    data_jogo < $1

                    AND

                    (

                        (

                            LOWER(
                                TRIM(
                                    time_casa
                                )
                            ) =
                            LOWER(
                                TRIM(
                                    $2::text
                                )
                            )

                            AND

                            LOWER(
                                TRIM(
                                    time_fora
                                )
                            ) =
                            LOWER(
                                TRIM(
                                    $3::text
                                )
                            )

                        )

                        OR

                        (

                            LOWER(
                                TRIM(
                                    time_casa
                                )
                            ) =
                            LOWER(
                                TRIM(
                                    $3::text
                                )
                            )

                            AND

                            LOWER(
                                TRIM(
                                    time_fora
                                )
                            ) =
                            LOWER(
                                TRIM(
                                    $2::text
                                )
                            )

                        )

                    )

                ORDER BY
                    data_jogo DESC

                LIMIT $4::integer
                `,

                [

                    agora.toISOString(),

                    casaOriginal,

                    foraOriginal,

                    LIMITE_BUSCA_H2H

                ]

            );


        const rows =
            Array.isArray(
                resultado?.rows
            )
                ? resultado.rows
                : [];


        console.log(

            `⚔️ H2H banco: ` +
            `${rows.length} registros encontrados`

        );


        const normalizados =

            rows

                .map(
                    normalizarJogoHistorico
                )

                .filter(
                    Boolean
                );


        const validos =

            filtrarParaEstatistica(
                normalizados
            );


        const unicos =
            removerDuplicados(
                validos
            );


        const ordenados =
            ordenarHistorico(
                unicos
            );


        const finais =
            ordenados.slice(
                0,
                LIMITE_H2H
            );


        console.log(

            `⚔️ H2H válido: ` +
            `${finais.length} confrontos`

        );


        return finais;

    }

    catch (
        erro
    ) {

        console.error(

            `❌ Erro H2H ` +
            `${casaOriginal} x ${foraOriginal}:`,

            erro.message

        );


        return [];

    }

}


// ==========================================================
// CALCULAR RESUMO H2H
// ==========================================================

function calcularResumoH2H(
    jogos,
    timeCasa,
    timeFora
) {

    const resultado = {

        jogos:
            0,

        vitoriasCasa:
            0,

        empates:
            0,

        vitoriasFora:
            0,

        golsCasa:
            0,

        golsFora:
            0

    };


    if (
        !Array.isArray(
            jogos
        )
    ) {

        return resultado;

    }


    const casaNormalizada =
        normalizarNomeTime(
            timeCasa
        );


    const foraNormalizada =
        normalizarNomeTime(
            timeFora
        );


    for (
        const jogo of jogos
    ) {

        const casaJogo =
            normalizarNomeTime(
                obterTimeCasa(
                    jogo
                )
            );


        const foraJogo =
            normalizarNomeTime(
                obterTimeFora(
                    jogo
                )
            );


        const confrontoNormal =

            casaJogo ===
            casaNormalizada

            &&

            foraJogo ===
            foraNormalizada;


        const confrontoInvertido =

            casaJogo ===
            foraNormalizada

            &&

            foraJogo ===
            casaNormalizada;


        if (
            !confrontoNormal &&
            !confrontoInvertido
        ) {

            continue;

        }


        const gols =
            obterGols(
                jogo
            );


        if (
            !gols.possui
        ) {

            continue;

        }


        resultado.jogos++;


        // ==================================================
        // CONFRONTO NORMAL
        // ==================================================

        if (
            confrontoNormal
        ) {

            resultado.golsCasa +=
                gols.casa;


            resultado.golsFora +=
                gols.fora;


            if (
                gols.casa >
                gols.fora
            ) {

                resultado.vitoriasCasa++;

            }

            else if (
                gols.casa ===
                gols.fora
            ) {

                resultado.empates++;

            }

            else {

                resultado.vitoriasFora++;

            }

        }

        // ==================================================
        // CONFRONTO INVERTIDO
        // ==================================================

        else {

            resultado.golsCasa +=
                gols.fora;


            resultado.golsFora +=
                gols.casa;


            if (
                gols.fora >
                gols.casa
            ) {

                resultado.vitoriasCasa++;

            }

            else if (
                gols.fora ===
                gols.casa
            ) {

                resultado.empates++;

            }

            else {

                resultado.vitoriasFora++;

            }

        }

    }


    return resultado;

}


// ==========================================================
// BUSCAR HISTÓRICO COMPLETO DO JOGO
//
// FUNÇÃO UTILIZADA POR routes/jogos.js
// ==========================================================

export async function buscarHistoricoJogo(
    timeCasa,
    timeFora
) {

    if (
        !nomeTimeValido(
            timeCasa
        )
        ||
        !nomeTimeValido(
            timeFora
        )
    ) {

        console.log(
            "⚠️ Times inválidos para histórico"
        );


        return {

            historicoCasa:
                [],

            historicoFora:
                [],

            confrontoDireto: {

                jogos:
                    0,

                vitoriasCasa:
                    0,

                empates:
                    0,

                vitoriasFora:
                    0,

                golsCasa:
                    0,

                golsFora:
                    0

            }

        };

    }


    console.log(
        "=================================================="
    );


    console.log(

        `📊 BUSCANDO HISTÓRICO REAL: ` +
        `${timeCasa} x ${timeFora}`

    );


    console.log(

        `📅 Data Brasil: ` +
        `${obterDataHojeBrasil()}`

    );


    console.log(
        `🌎 Fuso: ${TIMEZONE}`
    );


    console.log(
        "=================================================="
    );


    try {

        const [

            historicoCasa,

            historicoFora,

            h2h

        ] =

            await Promise.all([

                buscarHistoricoTime(
                    timeCasa
                ),

                buscarHistoricoTime(
                    timeFora
                ),

                buscarH2H(
                    timeCasa,
                    timeFora
                )

            ]);


        const resumoH2H =
            calcularResumoH2H(
                h2h,
                timeCasa,
                timeFora
            );


        console.log(

            `📊 ${timeCasa}: ` +
            `${historicoCasa.length} jogos históricos válidos`

        );


        console.log(

            `📊 ${timeFora}: ` +
            `${historicoFora.length} jogos históricos válidos`

        );


        console.log(

            `⚔️ H2H: ` +
            `${resumoH2H.jogos} confrontos válidos`

        );


        // ==================================================
        // MOSTRAR ÚLTIMOS JOGOS NO LOG
        // ==================================================

        if (
            historicoCasa.length > 0
        ) {

            const ultimo =
                historicoCasa[0];


            const gols =
                obterGols(
                    ultimo
                );


            console.log(

                `📝 Último ${timeCasa}: ` +
                `${ultimo.time_casa} ${gols.casa} x ` +
                `${gols.fora} ${ultimo.time_fora}`

            );

        }


        if (
            historicoFora.length > 0
        ) {

            const ultimo =
                historicoFora[0];


            const gols =
                obterGols(
                    ultimo
                );


            console.log(

                `📝 Último ${timeFora}: ` +
                `${ultimo.time_casa} ${gols.casa} x ` +
                `${gols.fora} ${ultimo.time_fora}`

            );

        }


        return {

            historicoCasa,

            historicoFora,

            confrontoDireto:
                resumoH2H,

            h2hJogos:
                resumoH2H.jogos,

            h2hVitoriasCasa:
                resumoH2H.vitoriasCasa,

            h2hEmpates:
                resumoH2H.empates,

            h2hVitoriasFora:
                resumoH2H.vitoriasFora

        };

    }

    catch (
        erro
    ) {

        console.error(

            `❌ Erro gerar histórico ` +
            `${timeCasa} x ${timeFora}:`,

            erro.message

        );


        return {

            historicoCasa:
                [],

            historicoFora:
                [],

            confrontoDireto: {

                jogos:
                    0,

                vitoriasCasa:
                    0,

                empates:
                    0,

                vitoriasFora:
                    0,

                golsCasa:
                    0,

                golsFora:
                    0

            },

            h2hJogos:
                0,

            h2hVitoriasCasa:
                0,

            h2hEmpates:
                0,

            h2hVitoriasFora:
                0

        };

    }

}


// ==========================================================
// BUSCAR HISTÓRICO DE UM TIME
//
// FUNÇÃO PÚBLICA
// ==========================================================

export async function buscarHistoricoTimePublico(
    nomeTime
) {

    return await buscarHistoricoTime(
        nomeTime
    );

}


// ==========================================================
// BUSCAR H2H PÚBLICO
// ==========================================================

export async function buscarConfrontosDiretos(
    timeCasa,
    timeFora
) {

    const jogos =
        await buscarH2H(
            timeCasa,
            timeFora
        );


    const resumo =
        calcularResumoH2H(
            jogos,
            timeCasa,
            timeFora
        );


    return {

        jogos,

        resumo

    };

}


// ==========================================================
// CALCULAR ESTATÍSTICAS HISTÓRICAS
// ==========================================================

export async function calcularEstatisticasHistoricas(
    nomeTime
) {

    const jogos =
        await buscarHistoricoTime(
            nomeTime
        );


    if (
        !jogos.length
    ) {

        return {

            jogos:
                0,

            vitorias:
                0,

            empates:
                0,

            derrotas:
                0,

            pontos:
                0,

            golsMarcados:
                0,

            golsSofridos:
                0,

            mediaGolsMarcados:
                0,

            mediaGolsSofridos:
                0,

            aproveitamento:
                0

        };

    }


    let vitorias =
        0;


    let empates =
        0;


    let derrotas =
        0;


    let pontos =
        0;


    let golsMarcados =
        0;


    let golsSofridos =
        0;


    let processados =
        0;


    const nomeNormalizado =
        normalizarNomeTime(
            nomeTime
        );


    for (
        const jogo of jogos
    ) {

        const casa =
            normalizarNomeTime(
                obterTimeCasa(
                    jogo
                )
            );


        const fora =
            normalizarNomeTime(
                obterTimeFora(
                    jogo
                )
            );


        if (

            casa !==
            nomeNormalizado

            &&

            fora !==
            nomeNormalizado

        ) {

            continue;

        }


        const gols =
            obterGols(
                jogo
            );


        // Segurança adicional

        if (
            !gols.possui
        ) {

            continue;

        }


        const ehCasa =
            casa ===
            nomeNormalizado;


        const golsTime =

            ehCasa

                ? gols.casa

                : gols.fora;


        const golsAdversario =

            ehCasa

                ? gols.fora

                : gols.casa;


        golsMarcados +=
            golsTime;


        golsSofridos +=
            golsAdversario;


        processados++;


        if (
            golsTime >
            golsAdversario
        ) {

            vitorias++;

            pontos +=
                3;

        }

        else if (
            golsTime ===
            golsAdversario
        ) {

            empates++;

            pontos +=
                1;

        }

        else {

            derrotas++;

        }

    }


    if (
        processados === 0
    ) {

        return {

            jogos:
                0,

            vitorias:
                0,

            empates:
                0,

            derrotas:
                0,

            pontos:
                0,

            golsMarcados:
                0,

            golsSofridos:
                0,

            mediaGolsMarcados:
                0,

            mediaGolsSofridos:
                0,

            aproveitamento:
                0

        };

    }


    return {

        jogos:
            processados,

        vitorias,

        empates,

        derrotas,

        pontos,

        golsMarcados,

        golsSofridos,

        mediaGolsMarcados:

            Number(

                (
                    golsMarcados /
                    processados
                ).toFixed(
                    2
                )

            ),

        mediaGolsSofridos:

            Number(

                (
                    golsSofridos /
                    processados
                ).toFixed(
                    2
                )

            ),

        aproveitamento:

            Number(

                (

                    (
                        pontos /
                        (
                            processados *
                            3
                        )
                    )

                    *

                    100

                ).toFixed(
                    2
                )

            )

    };

}


// ==========================================================
// VERIFICAR HISTÓRICO DISPONÍVEL
// ==========================================================

export async function verificarHistorico(
    timeCasa,
    timeFora
) {

    const dados =
        await buscarHistoricoJogo(
            timeCasa,
            timeFora
        );


    return {

        possuiHistorico:

            (

                dados.historicoCasa.length >
                0

                ||

                dados.historicoFora.length >
                0

            ),

        possuiH2H:

            (

                (
                    dados.confrontoDireto?.jogos ??
                    0
                )

                >

                0

            ),

        jogosCasa:

            dados.historicoCasa.length,

        jogosFora:

            dados.historicoFora.length,

        h2h:

            dados.confrontoDireto?.jogos ??
            0

    };

}


// ==========================================================
// LIMPAR CACHE
//
// Mantido por compatibilidade.
// Atualmente não existe cache.
// ==========================================================

export function limparCacheHistorico() {

    console.log(
        "ℹ️ Histórico não utiliza cache."
    );

}


// ==========================================================
// EXPORT DEFAULT
// ==========================================================

export default {

    buscarHistoricoJogo,

    buscarHistoricoTime:
        buscarHistoricoTimePublico,

    buscarConfrontosDiretos,

    calcularEstatisticasHistoricas,

    verificarHistorico,

    limparCacheHistorico

};
