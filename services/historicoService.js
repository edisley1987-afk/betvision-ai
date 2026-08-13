// ==========================================================
// BETVISION AI
// services/historicoService.js
//
// VERSÃO 10.0
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
// - Compatível com PostgreSQL / NeonDB
// - api_id tratado como INTEGER
// - Timezone: America/Sao_Paulo
//
// CORREÇÕES:
//
// 1. Histórico usa somente partidas já realizadas
// 2. Jogos futuros são ignorados
// 3. Jogos de hoje ainda não encerrados são ignorados
// 4. H2H é calculado a partir do banco real
// 5. Nomes dos times são comparados de forma segura
// 6. Evita duplicação de partidas
// 7. Retorna estrutura compatível com routes/jogos.js
// 8. Não depende de jogo_id
// 9. Não apaga histórico
// 10. Não cria dados artificiais
// ==========================================================

import {
    query
} from "../database/database.js";


// ==========================================================
// CONFIGURAÇÃO
// ==========================================================

const TIMEZONE =
    "America/Sao_Paulo";


// Quantidade máxima de jogos históricos
// utilizados pela IA para cada time.
//
// 20 é suficiente para manter o processamento
// rápido e ainda fornecer histórico relevante.

const LIMITE_HISTORICO =
    20;


// Limite máximo de H2H

const LIMITE_H2H =
    20;


// ==========================================================
// DATA/HORA ATUAL
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
// NORMALIZAR NOME DO TIME
//
// Serve apenas para comparação.
//
// NÃO altera o nome salvo no banco.
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
        .toLowerCase();

}


// ==========================================================
// VALIDAR NOME DO TIME
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
        "undefined"

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

    const numero =
        Number(
            valor
        );


    if (
        Number.isFinite(
            numero
        )
    ) {

        return numero;

    }


    return padrao;

}


// ==========================================================
// OBTER GOLS
//
// Compatível com diferentes formatos existentes
// no banco/API.
// ==========================================================

function obterGols(
    jogo
) {

    if (
        !jogo
    ) {

        return {

            casa: 0,

            fora: 0

        };

    }


    const golsCasa =
        numeroSeguro(

            jogo.gols_casa ??
            jogo.golsCasa ??
            jogo.home_goals ??
            jogo.homeGoals ??
            jogo.placar?.casa ??
            jogo.placar?.home ??
            jogo.score?.fullTime?.home ??
            jogo.score?.fulltime?.home ??
            jogo.score?.home ??
            0

        );


    const golsFora =
        numeroSeguro(

            jogo.gols_fora ??
            jogo.golsFora ??
            jogo.away_goals ??
            jogo.awayGoals ??
            jogo.placar?.fora ??
            jogo.placar?.away ??
            jogo.score?.fullTime?.away ??
            jogo.score?.fulltime?.away ??
            jogo.score?.away ??
            0

        );


    return {

        casa:
            Math.max(
                0,
                golsCasa
            ),

        fora:
            Math.max(
                0,
                golsFora
            )

    };

}


// ==========================================================
// VERIFICAR SE O JOGO JÁ FOI REALIZADO
//
// REGRA MUITO IMPORTANTE:
//
// O histórico da IA NÃO pode usar:
//
// - jogos futuros
// - jogos de amanhã
// - jogos ainda não iniciados
//
// Somente partidas cuja data já passou entram
// automaticamente no histórico.
//
// ==========================================================

function jogoJaRealizado(
    jogo
) {

    if (
        !jogo?.data_jogo
    ) {

        return false;

    }


    const data =
        new Date(
            jogo.data_jogo
        );


    if (
        Number.isNaN(
            data.getTime()
        )
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
        data.getTime() <
        agora.getTime()
    );

}


// ==========================================================
// VERIFICAR STATUS DO JOGO
//
// Alguns provedores retornam partidas futuras com
// horários anteriores por problemas de timezone.
// Por isso também verificamos status.
//
// ==========================================================

function statusPermiteHistorico(
    jogo
) {

    if (
        !jogo
    ) {

        return false;

    }


    const status =
        String(

            jogo.status ??
            jogo.status_short ??
            jogo.statusShort ??
            ""

        )
        .trim()
        .toUpperCase();


    // Se não houver status, a data será a principal
    // proteção.

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
        "UPCOMING"

    ];


    if (
        futuros.includes(
            status
        )
    ) {

        return false;

    }


    // Status normalmente encerrados

    const encerrados = [

        "FT",
        "AET",
        "PEN",
        "FINISHED",
        "ENDED",
        "COMPLETE",
        "COMPLETED"

    ];


    if (
        encerrados.includes(
            status
        )
    ) {

        return true;

    }


    // Estados de partida em andamento.
    //
    // Como o histórico estatístico precisa de
    // resultado final, não usamos jogos ao vivo.

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
        "FIRST_HALF"

    ];


    if (
        aoVivo.includes(
            status
        )
    ) {

        return false;

    }


    // Para status desconhecido, a data precisa
    // estar no passado.
    //
    // Não bloqueamos automaticamente porque bancos
    // antigos podem não possuir status padronizado.

    return true;

}


// ==========================================================
// VERIFICAR SE POSSUI RESULTADO
//
// Evita considerar jogo futuro sem placar.
//
// IMPORTANTE:
//
// 0 x 0 é resultado válido.
//
// ==========================================================

function possuiResultado(
    jogo
) {

    if (
        !jogo
    ) {

        return false;

    }


    // Se houver campos explícitos de gols,
    // consideramos que existe resultado.

    const campos = [

        jogo.gols_casa,
        jogo.gols_fora,
        jogo.golsCasa,
        jogo.golsFora,
        jogo.home_goals,
        jogo.away_goals,
        jogo.homeGoals,
        jogo.awayGoals

    ];


    if (
        campos.some(
            valor =>
                valor !== undefined &&
                valor !== null &&
                valor !== ""
        )
    ) {

        return true;

    }


    // Verificar objetos de placar

    const placar =
        jogo.placar;


    if (
        placar &&
        (
            placar.casa !== undefined ||
            placar.fora !== undefined ||
            placar.home !== undefined ||
            placar.away !== undefined
        )
    ) {

        return true;

    }


    const score =
        jogo.score;


    if (
        score?.fullTime &&
        (
            score.fullTime.home !== undefined ||
            score.fullTime.away !== undefined
        )
    ) {

        return true;

    }


    return false;

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
        jogo.time_casa ??
        jogo.casa ??
        jogo.home_team ??
        jogo.homeTeam?.name ??
        "";


    const fora =
        jogo.time_fora ??
        jogo.fora ??
        jogo.away_team ??
        jogo.awayTeam?.name ??
        "";


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
        casaNormalizada ===
        foraNormalizada
    ) {

        return false;

    }


    if (
        !jogo.data_jogo
    ) {

        return false;

    }


    // ==================================================
    // REGRA PRINCIPAL
    //
    // O jogo obrigatoriamente precisa estar no passado.
    // ==================================================

    if (
        !jogoJaRealizado(
            jogo
        )
    ) {

        return false;

    }


    // ==================================================
    // NÃO usar partidas em andamento/futuras
    // ==================================================

    if (
        !statusPermiteHistorico(
            jogo
        )
    ) {

        return false;

    }


    // ==================================================
    // Resultado
    //
    // Não exigimos placar obrigatoriamente para manter
    // compatibilidade com bancos antigos.
    //
    // Porém, para estatísticas, jogos sem resultado
    // serão ignorados posteriormente.
    // ==================================================

    return true;

}


// ==========================================================
// NORMALIZAR JOGO HISTÓRICO
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
            jogo.id

        );


    const casa =

        jogo.time_casa ??
        jogo.casa ??
        jogo.home_team ??
        jogo.homeTeam?.name ??
        jogo.teams?.home?.name ??
        null;


    const fora =

        jogo.time_fora ??
        jogo.fora ??
        jogo.away_team ??
        jogo.awayTeam?.name ??
        jogo.teams?.away?.name ??
        null;


    const data =

        jogo.data_jogo ??
        jogo.dataJogo ??
        jogo.utcDate ??
        jogo.horario ??
        jogo.data ??
        jogo.fixture?.date ??
        null;


    const gols =
        obterGols(
            jogo
        );


    return {

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

        gols_casa:
            gols.casa,

        gols_fora:
            gols.fora,

        status:
            jogo.status ??
            "FINISHED"

    };

}


// ==========================================================
// REMOVER DUPLICADOS
//
// Prioridade:
//
// 1. api_id
// 2. id
// 3. combinação de times + data
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
            jogo.id
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


            const data =
                String(
                    jogo.data_jogo ??
                    ""
                );


            chave =
                `${casa}|${fora}|${data}`;

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

    return [

        ...jogos

    ]
        .sort(
            (
                a,
                b
            ) => {

                const dataA =
                    new Date(
                        a?.data_jogo
                    ).getTime();


                const dataB =
                    new Date(
                        b?.data_jogo
                    ).getTime();


                return (
                    dataB -
                    dataA
                );

            }
        );

}


// ==========================================================
// FILTRAR HISTÓRICO COM RESULTADO
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

            if (
                !jogoHistoricoValido(
                    jogo
                )
            ) {

                return false;

            }


            if (
                !possuiResultado(
                    jogo
                )
            ) {

                return false;

            }


            return true;

        }

    );

}


// ==========================================================
// BUSCAR TODOS OS JOGOS DO TIME
//
// IMPORTANTE:
//
// A consulta traz somente partidas anteriores
// ao momento atual.
//
// O filtro final também é feito em JavaScript
// como segunda camada de proteção.
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

                    LIMITE_HISTORICO * 3

                ]

            );


        const jogos =
            Array.isArray(
                resultado?.rows
            )
                ? resultado.rows
                : [];


        const normalizados =

            jogos

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


        return ordenados.slice(
            0,
            LIMITE_HISTORICO
        );

    }

    catch (erro) {

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
//
// Retorna somente jogos já realizados entre os dois times.
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

                    LIMITE_H2H * 2

                ]

            );


        const jogos =
            Array.isArray(
                resultado?.rows
            )
                ? resultado.rows
                : [];


        const normalizados =

            jogos

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


        return ordenados.slice(
            0,
            LIMITE_H2H
        );

    }

    catch (erro) {

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

        jogos: 0,

        vitoriasCasa: 0,

        empates: 0,

        vitoriasFora: 0,

        golsCasa: 0,

        golsFora: 0

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
                jogo.time_casa
            );


        const foraJogo =
            normalizarNomeTime(
                jogo.time_fora
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


        resultado.jogos++;


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

        else {

            // Jogo antigo foi disputado com
            // os mandos invertidos.

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
// BUSCAR HISTÓRICO COMPLETO DO CONFRONTO
//
// FUNÇÃO PRINCIPAL USADA POR routes/jogos.js
//
// Retorna:
//
// historicoCasa
// historicoFora
// confrontoDireto
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

            historicoCasa: [],

            historicoFora: [],

            confrontoDireto: {

                jogos: 0,

                vitoriasCasa: 0,

                empates: 0,

                vitoriasFora: 0,

                golsCasa: 0,

                golsFora: 0

            }

        };

    }


    console.log(

        `📊 Buscando histórico: ` +
        `${timeCasa} x ${timeFora}`

    );


    try {

        // ==================================================
        // BUSCAS PARALELAS
        // ==================================================

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
            `${historicoCasa.length} jogos históricos`

        );


        console.log(

            `📊 ${timeFora}: ` +
            `${historicoFora.length} jogos históricos`

        );


        console.log(

            `⚔️ H2H: ` +
            `${resumoH2H.jogos} confrontos`

        );


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

    catch (erro) {

        console.error(

            `❌ Erro gerar histórico ` +
            `${timeCasa} x ${timeFora}:`,

            erro.message

        );


        return {

            historicoCasa: [],

            historicoFora: [],

            confrontoDireto: {

                jogos: 0,

                vitoriasCasa: 0,

                empates: 0,

                vitoriasFora: 0,

                golsCasa: 0,

                golsFora: 0

            },

            h2hJogos: 0,

            h2hVitoriasCasa: 0,

            h2hEmpates: 0,

            h2hVitoriasFora: 0

        };

    }

}


// ==========================================================
// BUSCAR HISTÓRICO DE UM TIME
//
// Função pública para outras partes do sistema.
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
// ESTATÍSTICAS DE UM TIME
//
// Retorna estatísticas básicas para o motor IA.
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

            jogos: 0,

            vitorias: 0,

            empates: 0,

            derrotas: 0,

            pontos: 0,

            golsMarcados: 0,

            golsSofridos: 0,

            mediaGolsMarcados: 0,

            mediaGolsSofridos: 0,

            aproveitamento: 0

        };

    }


    let vitorias = 0;

    let empates = 0;

    let derrotas = 0;

    let pontos = 0;

    let golsMarcados = 0;

    let golsSofridos = 0;

    let processados = 0;


    const nomeNormalizado =
        normalizarNomeTime(
            nomeTime
        );


    for (
        const jogo of jogos
    ) {

        const casa =
            normalizarNomeTime(
                jogo.time_casa
            );


        const fora =
            normalizarNomeTime(
                jogo.time_fora
            );


        if (
            casa !== nomeNormalizado &&
            fora !== nomeNormalizado
        ) {

            continue;

        }


        const gols =
            obterGols(
                jogo
            );


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

            pontos += 3;

        }

        else if (
            golsTime ===
            golsAdversario
        ) {

            empates++;

            pontos += 1;

        }

        else {

            derrotas++;

        }

    }


    if (
        processados === 0
    ) {

        return {

            jogos: 0,

            vitorias: 0,

            empates: 0,

            derrotas: 0,

            pontos: 0,

            golsMarcados: 0,

            golsSofridos: 0,

            mediaGolsMarcados: 0,

            mediaGolsSofridos: 0,

            aproveitamento: 0

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
                ).toFixed(2)
            ),

        mediaGolsSofridos:
            Number(
                (
                    golsSofridos /
                    processados
                ).toFixed(2)
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
                    ) *
                    100
                ).toFixed(2)
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
                dados.confrontoDireto?.jogos >
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
// LIMPEZA DE CACHE
//
// Mantido por compatibilidade.
//
// O serviço não utiliza cache atualmente.
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
