// ==========================================
// BETVISION AI
// services/historicoService.js
//
// Histórico de Jogos + Estatísticas
// Versão 10.0
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
// NÃO utiliza:
// - time_casa_id
// - time_fora_id
// - campeonato_id
// - gols_casa
// - gols_fora
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
// NORMALIZAR VALOR
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
// Pesquisa diretamente pelos nomes:
//
// jogos.time_casa
// jogos.time_fora
//
// NÃO utiliza IDs de times.
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

                        OR

                        LOWER(TRIM(j.time_fora))
                        =
                        LOWER(TRIM($1))
                    )

                    AND

                    j.data_jogo IS NOT NULL

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
//
// historicoCasa
// historicoFora
// h2h
//
// Também retorna contadores básicos.
//
// Como o schema atual não possui gols,
// não inventamos resultados.
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

                h2h: [],

                confrontos: 0,

                vitoriasCasa: 0,

                empates: 0,

                vitoriasFora: 0

            };

        }

        console.log(
            `📊 Buscando histórico: ${casa} x ${fora}`
        );

        // ======================================
        // HISTÓRICO DA CASA
        // ======================================

        const historicoCasa =
            await buscarHistoricoTime(
                casa
            );

        // ======================================
        // HISTÓRICO DO FORA
        // ======================================

        const historicoFora =
            await buscarHistoricoTime(
                fora
            );

        // ======================================
        // H2H
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

                AND

                    j.data_jogo IS NOT NULL

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
        //
        // O schema atual não possui:
        //
        // gols_casa
        // gols_fora
        //
        // Portanto não é possível determinar
        // vitória/empate/derrota pelo placar.
        //
        // Mantemos os contadores em zero para
        // não fabricar informações.
        // ======================================

        const vitoriasCasa = 0;

        const empates = 0;

        const vitoriasFora = 0;

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
// Utiliza somente as colunas existentes:
//
// id
// api_id
// campeonato
// time_casa
// time_fora
// data_jogo
// estadio
// status
//
// NÃO utiliza gols.
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
        // ATUALIZAR PELO API_ID
        // ======================================

        if (
            apiId !== null &&
            apiId !== undefined
        ) {

            const existente =
                await query(
                    `
                    SELECT
                        id

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
        //
        // A tabela atual não possui DEFAULT
        // confirmado para id.
        //
        // Por isso mantemos a geração manual.
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
// Como o schema atual não possui gols,
// não retornamos placares inventados.
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
// O schema atual não possui placares.
//
// Portanto:
// - jogos = calculado
// - jogosCasa = calculado
// - jogosFora = calculado
// - forma = 50 como neutro
// - mediaGols = 1 como neutro
//
// Esses valores neutros serão substituídos
// quando o banco possuir dados de resultado.
// ==========================================

export async function estatisticasTime(
    time
) {

    try {

        const nomeTime =
            normalizarTime(
                time
            );

        const jogos =
            await buscarHistoricoTime(
                nomeTime
            );

        let jogosCasa = 0;

        let jogosFora = 0;

        for (
            const jogo of jogos
        ) {

            const casa =
                normalizarTime(
                    jogo.time_casa
                ).toLowerCase();

            const fora =
                normalizarTime(
                    jogo.time_fora
                ).toLowerCase();

            if (
                casa ===
                nomeTime.toLowerCase()
            ) {

                jogosCasa++;

            }
            else if (
                fora ===
                nomeTime.toLowerCase()
            ) {

                jogosFora++;

            }

        }

        const total =
            jogos.length;

        return {

            time:
                nomeTime,

            jogos:
                numeroSeguro(
                    total
                ),

            jogosCasa:
                numeroSeguro(
                    jogosCasa
                ),

            jogosFora:
                numeroSeguro(
                    jogosFora
                ),

            forma:
                50,

            mediaGols:
                1

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

