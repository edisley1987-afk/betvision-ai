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
// - schema.sql v3.0
// - tabela jogos
// - tabela times
// - tabela historico_previsoes
// - inteligenciaService.js
// - jogoBancoService.js
//
// CORREÇÕES:
// - Não utiliza time_casa em jogos
// - Não utiliza time_fora em jogos
// - Utiliza time_casa_id
// - Utiliza time_fora_id
// - Busca nomes através da tabela times
// - Não cria jogos fictícios
// - Não utiliza ID manual
// - Compatível com SERIAL do PostgreSQL
// - Histórico por equipe
// - Histórico de confronto
// - Últimos resultados
// - Estatísticas da equipe
// ==========================================

import { query } from "../database/database.js";


// ==========================================
// NORMALIZAR NOME
// ==========================================

function normalizarNome(nome) {

    if (
        nome === undefined ||
        nome === null
    ) {
        return "";
    }

    return String(nome)
        .trim()
        .toLowerCase();

}


// ==========================================
// VALIDAR TIME
// ==========================================

function validarTime(time) {

    const nome =
        String(time ?? "").trim();

    return nome.length > 0;

}


// ==========================================
// BUSCAR TIME POR ID
// ==========================================

export async function buscarTimePorId(
    timeId
) {

    try {

        if (
            timeId === undefined ||
            timeId === null ||
            timeId === ""
        ) {

            return null;

        }

        const resultado =
            await query(

                `
                SELECT
                    id,
                    api_id,
                    campeonato_id,
                    nome,
                    pais,
                    logo,
                    criado_em

                FROM times

                WHERE id = $1

                LIMIT 1
                `,

                [
                    timeId
                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (error) {

        console.error(
            "❌ Erro buscar time por ID:",
            error.message
        );

        return null;

    }

}


// ==========================================
// BUSCAR TIME POR API_ID
// ==========================================

export async function buscarTimePorApiId(
    apiId
) {

    try {

        if (
            apiId === undefined ||
            apiId === null ||
            apiId === ""
        ) {

            return null;

        }

        const resultado =
            await query(

                `
                SELECT
                    id,
                    api_id,
                    campeonato_id,
                    nome,
                    pais,
                    logo,
                    criado_em

                FROM times

                WHERE api_id = $1

                LIMIT 1
                `,

                [
                    apiId
                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (error) {

        console.error(
            "❌ Erro buscar time por API ID:",
            error.message
        );

        return null;

    }

}


// ==========================================
// BUSCAR TIME PELO NOME
// ==========================================

export async function buscarTimePorNome(
    nome
) {

    try {

        if (
            !validarTime(nome)
        ) {

            return null;

        }

        const nomeNormalizado =
            normalizarNome(nome);


        const resultado =
            await query(

                `
                SELECT
                    id,
                    api_id,
                    campeonato_id,
                    nome,
                    pais,
                    logo,
                    criado_em

                FROM times

                WHERE LOWER(TRIM(nome)) = $1

                LIMIT 1
                `,

                [
                    nomeNormalizado
                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (error) {

        console.error(
            "❌ Erro buscar time por nome:",
            error.message
        );

        return null;

    }

}


// ==========================================
// BUSCAR HISTÓRICO DE UM TIME
//
// A tabela jogos utiliza:
//
// time_casa_id
// time_fora_id
//
// Os nomes são obtidos através da tabela times.
//
// Não utiliza colunas inexistentes:
// time_casa
// time_fora
// ==========================================

export async function buscarHistoricoTime(
    time
) {

    try {

        if (
            !validarTime(time)
        ) {

            return [];

        }


        const timeInformado =
            String(time).trim();


        let resultado;


        // ======================================
        // SE FOR ID NUMÉRICO
        // ======================================

        if (
            /^\d+$/.test(
                timeInformado
            )
        ) {

            resultado =
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
                        j.time_casa_id = $1
                        OR
                        j.time_fora_id = $1

                    ORDER BY
                        j.data_jogo DESC NULLS LAST,
                        j.id DESC

                    LIMIT 10
                    `,

                    [
                        Number(
                            timeInformado
                        )
                    ]

                );

        }

        else {

            // ==================================
            // BUSCAR PELO NOME
            // ==================================

            const nome =
                normalizarNome(
                    timeInformado
                );


            resultado =
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
                        LOWER(TRIM(tc.nome)) = $1

                        OR

                        LOWER(TRIM(tf.nome)) = $1

                    ORDER BY
                        j.data_jogo DESC NULLS LAST,
                        j.id DESC

                    LIMIT 10
                    `,

                    [
                        nome
                    ]

                );

        }


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
// Retorna confrontos entre dois times.
//
// Exemplo:
//
// CD Santa Clara x CD Nacional
//
// Importante:
// somente jogos realmente existentes
// no banco são retornados.
// ==========================================

export async function buscarHistoricoJogo(
    timeCasa,
    timeFora
) {

    try {

        if (
            !validarTime(timeCasa) ||
            !validarTime(timeFora)
        ) {

            return {

                historicoCasa: [],

                historicoFora: [],

                confrontosDiretos: []

            };

        }


        console.log(
            `📊 Buscando histórico: ${timeCasa} x ${timeFora}`
        );


        const casa =
            await buscarHistoricoTime(
                timeCasa
            );


        const fora =
            await buscarHistoricoTime(
                timeFora
            );


        // ======================================
        // NORMALIZAÇÃO DOS NOMES
        // ======================================

        const casaNormalizada =
            normalizarNome(
                timeCasa
            );


        const foraNormalizada =
            normalizarNome(
                timeFora
            );


        // ======================================
        // CONFRONTOS DIRETOS
        // ======================================

        const confrontosDiretos =
            casa.filter(
                jogo => {

                    const nomeCasa =
                        normalizarNome(
                            jogo.time_casa
                        );

                    const nomeFora =
                        normalizarNome(
                            jogo.time_fora
                        );


                    return (

                        (
                            nomeCasa ===
                            casaNormalizada

                            &&

                            nomeFora ===
                            foraNormalizada
                        )

                        ||

                        (
                            nomeCasa ===
                            foraNormalizada

                            &&

                            nomeFora ===
                            casaNormalizada
                        )

                    );

                }
            );


        return {

            historicoCasa:
                casa,

            historicoFora:
                fora,

            confrontosDiretos

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

            confrontosDiretos: []

        };

    }

}


// ==========================================
// RESOLVER ID DO TIME
//
// Aceita:
// - ID interno
// - API ID
// - nome
// ==========================================

async function resolverTimeId(
    valor
) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {

        return null;

    }


    // ======================================
    // TENTAR ID INTERNO
    // ======================================

    if (
        /^\d+$/.test(
            String(valor)
        )
    ) {

        const porId =
            await buscarTimePorId(
                Number(valor)
            );


        if (
            porId
        ) {

            return porId.id;

        }


        // ==================================
        // TENTAR API_ID
        // ==================================

        const porApiId =
            await buscarTimePorApiId(
                Number(valor)
            );


        if (
            porApiId
        ) {

            return porApiId.id;

        }

    }


    // ======================================
    // TENTAR NOME
    // ======================================

    const porNome =
        await buscarTimePorNome(
            valor
        );


    if (
        porNome
    ) {

        return porNome.id;

    }


    return null;

}


// ==========================================
// SALVAR HISTÓRICO DE JOGO
//
// Compatível com:
//
// CREATE TABLE jogos
//
// id SERIAL
// api_id UNIQUE
// campeonato_id
// time_casa_id
// time_fora_id
// data_jogo
// status
// gols_casa
// gols_fora
// temporada
//
// Não cria time automaticamente.
// Não cria jogo fictício.
// ==========================================

export async function salvarHistoricoJogo(
    dados = {}
) {

    try {

        if (
            !dados ||
            typeof dados !== "object"
        ) {

            return false;

        }


        // ======================================
        // IDENTIFICAR TIMES
        // ======================================

        const timeCasaValor =
            dados.time_casa_id ??
            dados.timeCasaId ??
            dados.time_casa ??
            dados.casa ??
            null;


        const timeForaValor =
            dados.time_fora_id ??
            dados.timeForaId ??
            dados.time_fora ??
            dados.fora ??
            null;


        const timeCasaId =
            await resolverTimeId(
                timeCasaValor
            );


        const timeForaId =
            await resolverTimeId(
                timeForaValor
            );


        // ======================================
        // NÃO SALVAR SEM TIMES
        // ======================================

        if (
            !timeCasaId ||
            !timeForaId
        ) {

            console.warn(
                "⚠️ Histórico ignorado: times não encontrados",
                {
                    timeCasa:
                        timeCasaValor,

                    timeFora:
                        timeForaValor
                }
            );


            return false;

        }


        // ======================================
        // API ID
        // ======================================

        const apiId =
            dados.api_id ??
            dados.apiId ??
            null;


        // ======================================
        // OUTROS DADOS
        // ======================================

        const campeonatoId =
            dados.campeonato_id ??
            dados.campeonatoId ??
            null;


        const dataJogo =
            dados.data_jogo ??
            dados.dataJogo ??
            dados.data ??
            null;


        const status =
            dados.status ??
            "FINISHED";


        const golsCasa =
            Number(
                dados.gols_casa ??
                dados.golsCasa ??
                0
            );


        const golsFora =
            Number(
                dados.gols_fora ??
                dados.golsFora ??
                0
            );


        const temporada =
            dados.temporada ??
            null;


        // ======================================
        // VALIDAR GOLS
        // ======================================

        const golsCasaFinal =
            Number.isFinite(
                golsCasa
            )
                ? Math.max(
                    0,
                    Math.floor(
                        golsCasa
                    )
                )
                : 0;


        const golsForaFinal =
            Number.isFinite(
                golsFora
            )
                ? Math.max(
                    0,
                    Math.floor(
                        golsFora
                    )
                )
                : 0;


        // ======================================
        // SE POSSUI API_ID
        // FAZER UPSERT
        // ======================================

        if (
            apiId !== null &&
            apiId !== undefined &&
            apiId !== ""
        ) {

            const resultado =
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

                    RETURNING *
                    `,

                    [

                        Number(apiId),

                        campeonatoId,

                        timeCasaId,

                        timeForaId,

                        dataJogo,

                        status,

                        golsCasaFinal,

                        golsForaFinal,

                        temporada

                    ]

                );


            return Boolean(
                resultado.rows[0]
            );

        }


        // ======================================
        // SEM API_ID
        //
        // Só insere se houver data válida.
        // O PostgreSQL gera o ID.
        // ======================================

        const resultado =
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

                RETURNING *
                `,

                [

                    campeonatoId,

                    timeCasaId,

                    timeForaId,

                    dataJogo,

                    status,

                    golsCasaFinal,

                    golsForaFinal,

                    temporada

                ]

            );


        return Boolean(
            resultado.rows[0]
        );

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
//
// Retorna somente partidas já encerradas
// quando o status estiver disponível.
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
            jogo => {

                const golsCasa =
                    Number(
                        jogo.gols_casa ?? 0
                    );


                const golsFora =
                    Number(
                        jogo.gols_fora ?? 0
                    );


                let resultado =
                    "EMPATE";


                // ==================================
                // IDENTIFICAR TIME CONSULTADO
                // ==================================

                const nomeTime =
                    normalizarNome(
                        time
                    );


                const nomeCasa =
                    normalizarNome(
                        jogo.time_casa
                    );


                const nomeFora =
                    normalizarNome(
                        jogo.time_fora
                    );


                if (
                    nomeCasa ===
                    nomeTime
                ) {

                    if (
                        golsCasa >
                        golsFora
                    ) {

                        resultado = "VITORIA";

                    }

                    else if (
                        golsCasa <
                        golsFora
                    ) {

                        resultado = "DERROTA";

                    }

                }

                else if (
                    nomeFora ===
                    nomeTime
                ) {

                    if (
                        golsFora >
                        golsCasa
                    ) {

                        resultado = "VITORIA";

                    }

                    else if (
                        golsFora <
                        golsCasa
                    ) {

                        resultado = "DERROTA";

                    }

                }


                return {

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

                    golsCasa,

                    golsFora,

                    resultado,

                    status:
                        jogo.status

                };

            }
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
// ESTATÍSTICAS DO TIME
//
// Usado como base para a inteligência.
// ==========================================

export async function estatisticasTime(
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

                mediaGolsMarcados: 0,

                mediaGolsSofridos: 0,

                aproveitamento: 0

            };

        }


        const nomeTime =
            normalizarNome(
                time
            );


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
                normalizarNome(
                    jogo.time_casa
                );


            const nomeFora =
                normalizarNome(
                    jogo.time_fora
                );


            if (
                nomeCasa ===
                nomeTime
            ) {

                golsMarcados +=
                    golsCasa;

                golsSofridos +=
                    golsFora;


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

            else if (
                nomeFora ===
                nomeTime
            ) {

                golsMarcados +=
                    golsFora;

                golsSofridos +=
                    golsCasa;


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


        const total =
            vitorias +
            empates +
            derrotas;


        const mediaGolsMarcados =
            total > 0
                ? golsMarcados / total
                : 0;


        const mediaGolsSofridos =
            total > 0
                ? golsSofridos / total
                : 0;


        const pontos =
            (
                vitorias * 3
            ) +
            empates;


        const aproveitamento =
            total > 0
                ? (
                    pontos /
                    (
                        total * 3
                    )
                ) * 100
                : 0;


        return {

            jogos:
                total,

            vitorias,

            empates,

            derrotas,

            golsMarcados,

            golsSofridos,

            mediaGolsMarcados:
                Number(
                    mediaGolsMarcados.toFixed(2)
                ),

            mediaGolsSofridos:
                Number(
                    mediaGolsSofridos.toFixed(2)
                ),

            aproveitamento:
                Number(
                    aproveitamento.toFixed(2)
                )

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

            mediaGolsMarcados: 0,

            mediaGolsSofridos: 0,

            aproveitamento: 0

        };

    }

}


// ==========================================
// SALVAR RESULTADO DA PREVISÃO
//
// Tabela:
//
// historico_previsoes
//
// Não altera jogos.
// Não cria partidas.
// ==========================================

export async function salvarHistoricoPrevisao(
    dados = {}
) {

    try {

        const jogoId =
            dados.jogo_id ??
            dados.jogoId ??
            null;


        if (
            !jogoId
        ) {

            console.warn(
                "⚠️ Histórico de previsão ignorado: jogo_id ausente"
            );

            return null;

        }


        const resultado =
            await query(

                `
                INSERT INTO historico_previsoes
                (
                    jogo_id,
                    previsao,
                    resultado_real,
                    acertou
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4
                )

                RETURNING *
                `,

                [

                    jogoId,

                    dados.previsao ??
                        null,

                    dados.resultado_real ??
                        dados.resultadoReal ??
                        null,

                    dados.acertou ??
                        null

                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (error) {

        console.error(
            "❌ Erro salvar histórico previsão:",
            error.message
        );


        return null;

    }

}


// ==========================================
// BUSCAR HISTÓRICO DE PREVISÕES
// ==========================================

export async function buscarHistoricoPrevisoes(
    limite = 50
) {

    try {

        let limiteFinal =
            Number(limite);


        if (
            !Number.isFinite(
                limiteFinal
            )
        ) {

            limiteFinal = 50;

        }


        limiteFinal =
            Math.max(
                1,
                Math.min(
                    500,
                    Math.floor(
                        limiteFinal
                    )
                )
            );


        const resultado =
            await query(

                `
                SELECT

                    hp.id,

                    hp.jogo_id,

                    hp.previsao,

                    hp.resultado_real,

                    hp.acertou,

                    hp.criado_em,

                    j.api_id,

                    j.data_jogo,

                    tc.nome AS time_casa,

                    tf.nome AS time_fora,

                    j.gols_casa,

                    j.gols_fora

                FROM historico_previsoes hp

                LEFT JOIN jogos j
                    ON j.id = hp.jogo_id

                LEFT JOIN times tc
                    ON tc.id = j.time_casa_id

                LEFT JOIN times tf
                    ON tf.id = j.time_fora_id

                ORDER BY
                    hp.criado_em DESC,
                    hp.id DESC

                LIMIT $1
                `,

                [
                    limiteFinal
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
            "❌ Erro buscar histórico previsões:",
            error.message
        );


        return [];

    }

}


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    buscarTimePorId,

    buscarTimePorApiId,

    buscarTimePorNome,

    buscarHistoricoTime,

    buscarHistoricoJogo,

    salvarHistoricoJogo,

    ultimosResultados,

    estatisticasTime,

    salvarHistoricoPrevisao,

    buscarHistoricoPrevisoes

};

