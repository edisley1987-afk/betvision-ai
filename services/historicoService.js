// ==========================================
// BETVISION AI
// services/historicoService.js
//
// Histórico de Jogos + Estatísticas
// Versão 9.0
//
// PostgreSQL / NeonDB
//
// Compatível com:
// - schema.sql atual
// - jogoBancoService.js
// - inteligenciaService.js
//
// IMPORTANTE:
//
// A tabela jogos NÃO possui:
//
// time_casa
// time_fora
//
// Ela possui:
//
// time_casa_id
// time_fora_id
//
// Os nomes dos times estão na tabela:
//
// times
//
// Portanto este serviço utiliza JOIN.
// ==========================================

import { query } from "../database/database.js";


// ==========================================
// NORMALIZAR NOME DO TIME
// ==========================================

function normalizarNomeTime(time) {

    if (
        time === undefined ||
        time === null
    ) {

        return "";

    }

    return String(time)
        .trim();

}


// ==========================================
// BUSCAR HISTÓRICO DE UM TIME
//
// Recebe o nome do time.
//
// Exemplo:
//
// buscarHistoricoTime("CD Santa Clara")
//
// Busca jogos onde o time aparece:
//
// time_casa_id
// OU
// time_fora_id
//
// JOIN com tabela times para obter os nomes.
// ==========================================

export async function buscarHistoricoTime(
    time
) {

    try {

        const nomeTime =
            normalizarNomeTime(time);


        if (!nomeTime) {

            return [];

        }


        console.log(
            `📊 Buscando histórico: ${nomeTime}`
        );


        const resultado =
            await query(

                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato_id,

                    j.time_casa_id,

                    j.time_fora_id,

                    tc.nome AS time_casa,

                    tf.nome AS time_fora,

                    j.data_jogo,

                    j.status,

                    j.gols_casa,

                    j.gols_fora,

                    j.temporada,

                    j.criado_em

                FROM jogos j

                LEFT JOIN times tc
                    ON tc.id = j.time_casa_id

                LEFT JOIN times tf
                    ON tf.id = j.time_fora_id

                WHERE

                    LOWER(TRIM(tc.nome))
                        = LOWER(TRIM($1))

                    OR

                    LOWER(TRIM(tf.nome))
                        = LOWER(TRIM($1))

                ORDER BY
                    j.data_jogo DESC NULLS LAST,
                    j.id DESC

                LIMIT 10
                `,

                [
                    nomeTime
                ]

            );


        return Array.isArray(
            resultado.rows
        )
            ? resultado.rows
            : [];


    }

    catch (error) {

        console.error(
            "❌ Erro histórico time:",
            error.message
        );


        return [];

    }

}


// ==========================================
// BUSCAR HISTÓRICO DO CONFRONTO
//
// Retorna:
//
// historicoCasa
// historicoFora
//
// E também calcula H2H.
//
// O H2H considera somente confrontos
// onde os dois times participaram do mesmo jogo.
// ==========================================

export async function buscarHistoricoJogo(
    timeCasa,
    timeFora
) {

    try {

        const nomeCasa =
            normalizarNomeTime(
                timeCasa
            );


        const nomeFora =
            normalizarNomeTime(
                timeFora
            );


        console.log(
            `📊 Buscando histórico: ${nomeCasa} x ${nomeFora}`
        );


        // ======================================
        // HISTÓRICO INDIVIDUAL
        // ======================================

        const historicoCasa =
            await buscarHistoricoTime(
                nomeCasa
            );


        const historicoFora =
            await buscarHistoricoTime(
                nomeFora
            );


        // ======================================
        // H2H
        //
        // Procura confrontos diretos entre
        // os dois times.
        // ======================================

        let confrontos = [];


        if (
            nomeCasa &&
            nomeFora
        ) {

            const resultadoH2H =
                await query(

                    `
                    SELECT

                        j.id,

                        j.api_id,

                        j.data_jogo,

                        j.status,

                        j.gols_casa,

                        j.gols_fora,

                        j.temporada,

                        tc.nome AS time_casa,

                        tf.nome AS time_fora

                    FROM jogos j

                    INNER JOIN times tc
                        ON tc.id = j.time_casa_id

                    INNER JOIN times tf
                        ON tf.id = j.time_fora_id

                    WHERE

                    (

                        LOWER(TRIM(tc.nome))
                            = LOWER(TRIM($1))

                        AND

                        LOWER(TRIM(tf.nome))
                            = LOWER(TRIM($2))

                    )

                    OR

                    (

                        LOWER(TRIM(tc.nome))
                            = LOWER(TRIM($2))

                        AND

                        LOWER(TRIM(tf.nome))
                            = LOWER(TRIM($1))

                    )

                    ORDER BY
                        j.data_jogo DESC NULLS LAST,
                        j.id DESC

                    LIMIT 10
                    `,

                    [
                        nomeCasa,
                        nomeFora
                    ]

                );


            confrontos =
                Array.isArray(
                    resultadoH2H.rows
                )
                    ? resultadoH2H.rows
                    : [];

        }


        // ======================================
        // CALCULAR RESULTADOS DO H2H
        // ======================================

        let vitoriasCasa = 0;

        let empates = 0;

        let vitoriasFora = 0;


        for (
            const jogo of confrontos
        ) {

            const golsCasa =
                Number(
                    jogo.gols_casa
                );


            const golsFora =
                Number(
                    jogo.gols_fora
                );


            if (
                !Number.isFinite(
                    golsCasa
                )
                ||
                !Number.isFinite(
                    golsFora
                )
            ) {

                continue;

            }


            const casaEhTimeCasa =
                String(
                    jogo.time_casa || ""
                )
                    .trim()
                    .toLowerCase()
                    ===
                nomeCasa
                    .trim()
                    .toLowerCase();


            if (
                golsCasa === golsFora
            ) {

                empates++;

            }

            else if (
                golsCasa > golsFora
            ) {

                if (
                    casaEhTimeCasa
                ) {

                    vitoriasCasa++;

                }

                else {

                    vitoriasFora++;

                }

            }

            else {

                if (
                    casaEhTimeCasa
                ) {

                    vitoriasFora++;

                }

                else {

                    vitoriasCasa++;

                }

            }

        }


        console.log(
            `⚔️ H2H: ${confrontos.length} confrontos | Casa ${vitoriasCasa} vitórias | Empates ${empates} | Fora ${vitoriasFora}`
        );


        return {

            historicoCasa,

            historicoFora,

            confrontos,

            h2h: {

                total:
                    confrontos.length,

                vitoriasCasa,

                empates,

                vitoriasFora

            }

        };


    }

    catch (error) {

        console.error(
            "❌ Erro buscar histórico jogo:",
            error.message
        );


        return {

            historicoCasa: [],

            historicoFora: [],

            confrontos: [],

            h2h: {

                total: 0,

                vitoriasCasa: 0,

                empates: 0,

                vitoriasFora: 0

            }

        };

    }

}


// ==========================================
// SALVAR HISTÓRICO DE JOGO
//
// IMPORTANTE:
//
// O schema atual da tabela jogos exige:
//
// campeonato_id
// time_casa_id
// time_fora_id
//
// Portanto não podemos inserir:
//
// time_casa
// time_fora
//
// diretamente.
//
// Este método tenta localizar os IDs dos times
// pelo nome e salva o jogo corretamente.
// ==========================================

export async function salvarHistoricoJogo(
    dados
) {

    try {

        if (!dados) {

            return false;

        }


        const apiId =
            dados.api_id ??
            dados.apiId ??
            dados.id ??
            null;


        const nomeCasa =
            normalizarNomeTime(
                dados.time_casa ??
                dados.casa
            );


        const nomeFora =
            normalizarNomeTime(
                dados.time_fora ??
                dados.fora
            );


        if (
            !nomeCasa ||
            !nomeFora
        ) {

            console.error(
                "❌ Histórico sem nomes dos times"
            );

            return false;

        }


        // ======================================
        // LOCALIZAR TIME DA CASA
        // ======================================

        const buscaCasa =
            await query(

                `
                SELECT id
                FROM times
                WHERE LOWER(TRIM(nome))
                    = LOWER(TRIM($1))
                LIMIT 1
                `,

                [
                    nomeCasa
                ]

            );


        // ======================================
        // LOCALIZAR TIME DE FORA
        // ======================================

        const buscaFora =
            await query(

                `
                SELECT id
                FROM times
                WHERE LOWER(TRIM(nome))
                    = LOWER(TRIM($1))
                LIMIT 1
                `,

                [
                    nomeFora
                ]

            );


        const timeCasaId =
            buscaCasa.rows[0]?.id ||
            null;


        const timeForaId =
            buscaFora.rows[0]?.id ||
            null;


        if (
            !timeCasaId ||
            !timeForaId
        ) {

            console.error(
                `❌ Times não encontrados: ${nomeCasa} x ${nomeFora}`
            );

            return false;

        }


        // ======================================
        // CAMPEONATO
        // ======================================

        let campeonatoId =
            dados.campeonato_id ??
            null;


        // ======================================
        // INSERIR / ATUALIZAR
        //
        // api_id é UNIQUE no schema.
        // ======================================

        if (
            apiId !== null
        ) {

            await query(

                `
                INSERT INTO jogos
                (
                    api_id,
                    campeonato_id,
                    time_casa_id,
                    time_fora_id,
                    data_jogo,
                    status,
                    gols_casa,
                    gols_fora,
                    temporada
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9
                )

                ON CONFLICT(api_id)

                DO UPDATE SET

                    campeonato_id =
                        EXCLUDED.campeonato_id,

                    time_casa_id =
                        EXCLUDED.time_casa_id,

                    time_fora_id =
                        EXCLUDED.time_fora_id,

                    data_jogo =
                        EXCLUDED.data_jogo,

                    status =
                        EXCLUDED.status,

                    gols_casa =
                        EXCLUDED.gols_casa,

                    gols_fora =
                        EXCLUDED.gols_fora,

                    temporada =
                        EXCLUDED.temporada

                `,

                [

                    apiId,

                    campeonatoId,

                    timeCasaId,

                    timeForaId,

                    dados.data_jogo ??
                    dados.horario ??
                    dados.data ??
                    null,

                    dados.status ??
                    "SCHEDULED",

                    Number(
                        dados.gols_casa ?? 0
                    ),

                    Number(
                        dados.gols_fora ?? 0
                    ),

                    dados.temporada ??
                    null

                ]

            );

        }

        else {

            await query(

                `
                INSERT INTO jogos
                (
                    campeonato_id,
                    time_casa_id,
                    time_fora_id,
                    data_jogo,
                    status,
                    gols_casa,
                    gols_fora,
                    temporada
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8
                )

                `,

                [

                    campeonatoId,

                    timeCasaId,

                    timeForaId,

                    dados.data_jogo ??
                    dados.horario ??
                    dados.data ??
                    null,

                    dados.status ??
                    "SCHEDULED",

                    Number(
                        dados.gols_casa ?? 0
                    ),

                    Number(
                        dados.gols_fora ?? 0
                    ),

                    dados.temporada ??
                    null

                ]

            );

        }


        console.log(
            `💾 Histórico salvo: ${nomeCasa} x ${nomeFora}`
        );


        return true;


    }

    catch (error) {

        console.error(
            "❌ Erro salvar histórico:",
            error.message
        );


        return false;

    }

}


// ==========================================
// ÚLTIMOS RESULTADOS
// ==========================================

export async function ultimosResultados(
    time
) {

    try {

        const jogos =
            await buscarHistoricoTime(
                time
            );


        return jogos.map(
            (jogo) => ({

                id:
                    jogo.id,

                api_id:
                    jogo.api_id,

                data:
                    jogo.data_jogo,

                casa:
                    jogo.time_casa,

                fora:
                    jogo.time_fora,

                golsCasa:
                    Number(
                        jogo.gols_casa ?? 0
                    ),

                golsFora:
                    Number(
                        jogo.gols_fora ?? 0
                    ),

                status:
                    jogo.status,

                temporada:
                    jogo.temporada

            })
        );


    }

    catch (error) {

        console.error(
            "❌ Erro resultados:",
            error.message
        );


        return [];

    }

}


// ==========================================
// ESTATÍSTICAS BÁSICAS DE UM TIME
//
// Usado pelo motor de inteligência.
// ==========================================

export async function calcularEstatisticasTime(
    time
) {

    try {

        const jogos =
            await buscarHistoricoTime(
                time
            );


        if (
            !jogos.length
        ) {

            return {

                jogos: 0,

                vitorias: 0,

                empates: 0,

                derrotas: 0,

                golsMarcados: 0,

                golsSofridos: 0,

                mediaGolsMarcados: 1,

                mediaGolsSofridos: 1,

                forma: 50

            };

        }


        const nomeTime =
            normalizarNomeTime(
                time
            )
                .toLowerCase();


        let vitorias = 0;

        let empates = 0;

        let derrotas = 0;

        let golsMarcados = 0;

        let golsSofridos = 0;


        for (
            const jogo of jogos
        ) {

            const golsCasa =
                Number(
                    jogo.gols_casa ?? 0
                );


            const golsFora =
                Number(
                    jogo.gols_fora ?? 0
                );


            const nomeCasa =
                String(
                    jogo.time_casa || ""
                )
                    .trim()
                    .toLowerCase();


            const nomeFora =
                String(
                    jogo.time_fora || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                nomeCasa === nomeTime
            ) {

                golsMarcados +=
                    golsCasa;

                golsSofridos +=
                    golsFora;


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

            else if (
                nomeFora === nomeTime
            ) {

                golsMarcados +=
                    golsFora;

                golsSofridos +=
                    golsCasa;


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


        const total =
            jogos.length;


        const mediaGolsMarcados =
            Number(
                (
                    golsMarcados /
                    total
                ).toFixed(2)
            );


        const mediaGolsSofridos =
            Number(
                (
                    golsSofridos /
                    total
                ).toFixed(2)
            );


        // ======================================
        // FORMA
        //
        // Vitória = 100
        // Empate = 50
        // Derrota = 0
        // ======================================

        const pontosForma =
            (
                vitorias * 3
            )
            +
            (
                empates * 1
            );


        const pontosMaximos =
            total * 3;


        const forma =
            pontosMaximos > 0

                ? Number(
                    (
                        (
                            pontosForma /
                            pontosMaximos
                        ) * 100
                    ).toFixed(2)
                )

                : 50;


        return {

            jogos: total,

            vitorias,

            empates,

            derrotas,

            golsMarcados,

            golsSofridos,

            mediaGolsMarcados,

            mediaGolsSofridos,

            forma

        };


    }

    catch (error) {

        console.error(
            "❌ Erro estatísticas time:",
            error.message
        );


        return {

            jogos: 0,

            vitorias: 0,

            empates: 0,

            derrotas: 0,

            golsMarcados: 0,

            golsSofridos: 0,

            mediaGolsMarcados: 1,

            mediaGolsSofridos: 1,

            forma: 50

        };

    }

}


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    buscarHistoricoJogo,

    buscarHistoricoTime,

    salvarHistoricoJogo,

    ultimosResultados,

    calcularEstatisticasTime

};

