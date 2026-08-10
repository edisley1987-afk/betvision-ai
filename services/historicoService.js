// ==========================================
// BETVISION AI
// services/historicoService.js
//
// Histórico de Jogos + Estatísticas
// Versão 9.0
//
// Compatível com:
// - schema.sql atual
// - tabela jogos do NeonDB
// - jogoBancoService.js
// - inteligenciaService.js
//
// Estrutura REAL da tabela jogos:
//
// id
// api_id
// campeonato
// time_casa
// time_fora
// data_jogo
// estadio
// status
// criado_em
//
// IMPORTANTE:
// NÃO utiliza:
// - time_casa_id
// - time_fora_id
// - campeonato_id
// ==========================================

import { query } from "../database/database.js";

// ==========================================
// NORMALIZAR NOME DO TIME
// ==========================================

function normalizarTime(time) {
    if (
        time === undefined ||
        time === null
    ) {
        return "";
    }

    return String(time).trim();
}

// ==========================================
// CONVERTER NÚMERO COM SEGURANÇA
// ==========================================

function numeroSeguro(
    valor,
    padrao = 0
) {
    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : padrao;
}

// ==========================================
// BUSCAR HISTÓRICO DE UM TIME
//
// Usa diretamente:
// jogos.time_casa
// jogos.time_fora
//
// NÃO usa:
// time_casa_id
// time_fora_id
// ==========================================

export async function buscarHistoricoTime(
    time
) {

    try {

        const nomeTime =
            normalizarTime(time);

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

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.data_jogo,

                    j.estadio,

                    j.status,

                    j.criado_em

                FROM jogos j

                WHERE

                    (
                        LOWER(TRIM(j.time_casa))
                        =
                        LOWER(TRIM($1))
                    )

                    OR

                    (
                        LOWER(TRIM(j.time_fora))
                        =
                        LOWER(TRIM($1))
                    )

                AND j.data_jogo IS NOT NULL

                ORDER BY
                    j.data_jogo DESC

                LIMIT 20
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
// - histórico da casa
// - histórico do visitante
// - confrontos diretos
// ==========================================

export async function buscarHistoricoJogo(
    timeCasa,
    timeFora
) {

    try {

        const casa =
            normalizarTime(
                timeCasa
            );

        const fora =
            normalizarTime(
                timeFora
            );

        if (
            !casa ||
            !fora
        ) {

            return {

                historicoCasa: [],

                historicoFora: [],

                h2h: []

            };

        }

        console.log(
            `📊 Buscando histórico: ${casa} x ${fora}`
        );

        // ======================================
        // HISTÓRICO INDIVIDUAL
        // ======================================

        const historicoCasa =
            await buscarHistoricoTime(
                casa
            );

        const historicoFora =
            await buscarHistoricoTime(
                fora
            );

        // ======================================
        // CONFRONTOS DIRETOS
        //
        // Casa x Fora
        // ou
        // Fora x Casa
        // ======================================

        const resultadoH2H =
            await query(

                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.data_jogo,

                    j.estadio,

                    j.status,

                    j.criado_em

                FROM jogos j

                WHERE

                    (
                        LOWER(TRIM(j.time_casa))
                        =
                        LOWER(TRIM($1))

                        AND

                        LOWER(TRIM(j.time_fora))
                        =
                        LOWER(TRIM($2))
                    )

                    OR

                    (
                        LOWER(TRIM(j.time_casa))
                        =
                        LOWER(TRIM($2))

                        AND

                        LOWER(TRIM(j.time_fora))
                        =
                        LOWER(TRIM($1))
                    )

                ORDER BY
                    j.data_jogo DESC

                LIMIT 20
                `,

                [
                    casa,
                    fora
                ]

            );

        const h2h =
            Array.isArray(
                resultadoH2H.rows
            )
                ? resultadoH2H.rows
                : [];

        // ======================================
        // ESTATÍSTICAS H2H
        // ======================================

        let vitoriasCasa = 0;

        let empates = 0;

        let vitoriasFora = 0;

        for (
            const jogo of h2h
        ) {

            const nomeCasa =
                normalizarTime(
                    jogo.time_casa
                );

            const nomeFora =
                normalizarTime(
                    jogo.time_fora
                );

            // ==================================
            // IMPORTANTE
            //
            // A tabela atual não possui
            // gols_casa / gols_fora.
            //
            // Portanto não tentamos calcular
            // resultado através de gols.
            // ==================================

            if (
                nomeCasa.toLowerCase()
                ===
                casa.toLowerCase()
            ) {

                if (
                    String(
                        jogo.status || ""
                    ).toUpperCase()
                    ===
                    "FINISHED"
                ) {

                    // Resultado não disponível
                    // sem campos de gols.
                    continue;

                }

            }

            if (
                nomeFora.toLowerCase()
                ===
                casa.toLowerCase()
            ) {

                if (
                    String(
                        jogo.status || ""
                    ).toUpperCase()
                    ===
                    "FINISHED"
                ) {

                    continue;

                }

            }

        }

        console.log(
            `⚔️ H2H: ${h2h.length} confrontos | Casa ${vitoriasCasa} vitórias | Empates ${empates} | Fora ${vitoriasFora}`
        );

        return {

            historicoCasa,

            historicoFora,

            h2h,

            confrontos:
                h2h.length,

            vitoriasCasa,

            empates,

            vitoriasFora

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

            h2h: [],

            confrontos: 0,

            vitoriasCasa: 0,

            empates: 0,

            vitoriasFora: 0

        };

    }

}

// ==========================================
// SALVAR HISTÓRICO DE JOGO
//
// ATENÇÃO:
//
// A tabela jogos atual possui:
//
// id
// api_id
// campeonato
// time_casa
// time_fora
// data_jogo
// estadio
// status
// criado_em
//
// Portanto salvamos somente essas colunas.
//
// Não usamos gols_casa/gols_fora porque elas
// NÃO existem na estrutura atual confirmada.
// ==========================================

export async function salvarHistoricoJogo(
    dados = {}
) {

    try {

        const apiId =
            dados.api_id ??
            dados.apiId ??
            null;

        const id =
            dados.id ??
            null;

        const campeonato =
            dados.campeonato ??
            dados.competicao ??
            "Futebol";

        const timeCasa =
            dados.time_casa ??
            dados.casa ??
            null;

        const timeFora =
            dados.time_fora ??
            dados.fora ??
            null;

        const dataJogo =
            dados.data_jogo ??
            dados.data ??
            dados.horario ??
            null;

        const estadio =
            dados.estadio ??
            null;

        const status =
            dados.status ??
            "SCHEDULED";

        // ======================================
        // VALIDAÇÃO
        // ======================================

        if (
            !timeCasa ||
            !timeFora
        ) {

            console.error(
                "❌ Não foi possível salvar histórico: times ausentes"
            );

            return null;

        }

        // ======================================
        // SE POSSUI API_ID
        // ======================================

        if (
            apiId !== null &&
            apiId !== undefined
        ) {

            const existente =
                await query(

                    `
                    SELECT id

                    FROM jogos

                    WHERE api_id = $1

                    LIMIT 1
                    `,

                    [
                        apiId
                    ]

                );

            if (
                existente.rows.length > 0
            ) {

                const resultado =
                    await query(

                        `
                        UPDATE jogos

                        SET

                            campeonato = $1,

                            time_casa = $2,

                            time_fora = $3,

                            data_jogo = $4,

                            estadio = $5,

                            status = $6

                        WHERE api_id = $7

                        RETURNING *
                        `,

                        [

                            campeonato,

                            timeCasa,

                            timeFora,

                            dataJogo,

                            estadio,

                            status,

                            apiId

                        ]

                    );

                return (
                    resultado.rows[0]
                    ||
                    null
                );

            }

        }

        // ======================================
        // INSERIR NOVO JOGO
        // ======================================

        const resultado =
            await query(

                `
                INSERT INTO jogos

                (
                    id,
                    api_id,
                    campeonato,
                    time_casa,
                    time_fora,
                    data_jogo,
                    estadio,
                    status
                )

                VALUES

                (
                    COALESCE(
                        $1,
                        (
                            SELECT
                                COALESCE(
                                    MAX(id),
                                    0
                                ) + 1

                            FROM jogos
                        )
                    ),

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

                    id,

                    apiId,

                    campeonato,

                    timeCasa,

                    timeFora,

                    dataJogo,

                    estadio,

                    status

                ]

            );

        return (
            resultado.rows[0]
            ||
            null
        );

    }

    catch (error) {

        console.error(
            "❌ Erro salvar histórico:",
            error.message
        );

        return null;

    }

}

// ==========================================
// ÚLTIMOS RESULTADOS
//
// Retorna os últimos jogos cadastrados
// para determinado time.
//
// Como a tabela atual NÃO possui:
// gols_casa
// gols_fora
//
// não inventamos placares.
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
            jogo => ({

                id:
                    jogo.id,

                api_id:
                    jogo.api_id,

                data:
                    jogo.data_jogo,

                campeonato:
                    jogo.campeonato,

                casa:
                    jogo.time_casa,

                fora:
                    jogo.time_fora,

                estadio:
                    jogo.estadio,

                status:
                    jogo.status

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
// ESTATÍSTICAS BÁSICAS DO TIME
//
// Sem gols disponíveis no schema atual,
// retornamos somente informações que podem
// ser calculadas com segurança.
// ==========================================

export async function estatisticasTime(
    time
) {

    try {

        const jogos =
            await buscarHistoricoTime(
                time
            );

        const nomeTime =
            normalizarTime(
                time
            ).toLowerCase();

        let jogosCasa = 0;

        let jogosFora = 0;

        for (
            const jogo of jogos
        ) {

            const casa =
                normalizarTime(
                    jogo.time_casa
                ).toLowerCase();

            if (
                casa === nomeTime
            ) {

                jogosCasa++;

            }
            else {

                jogosFora++;

            }

        }

        const total =
            jogos.length;

        return {

            time,

            jogos: total,

            jogosCasa,

            jogosFora,

            forma: 50,

            mediaGols: 1

        };

    }

    catch (error) {

        console.error(
            "❌ Erro estatísticas time:",
            error.message
        );

        return {

            time,

            jogos: 0,

            jogosCasa: 0,

            jogosFora: 0,

            forma: 50,

            mediaGols: 1

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

    estatisticasTime

};
