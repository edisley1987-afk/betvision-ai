// ==================================================
// BETVISION AI
// services/bancoService.js
//
// VERSÃO 9.0
//
// PostgreSQL / NeonDB
//
// RESPONSABILIDADES:
// - Campeonatos
// - Times
// - Jogos
// - Histórico
// - H2H
// - Análises
// - Value Bets
// - Dashboard
//
// REGRAS:
// - Jogos disponíveis = HOJE + AMANHÃ
// - Análises exibidas = SOMENTE HOJE
// - Histórico permanece no banco
// - IA pode consultar histórico
// - api_id = INTEGER
// - Não cria jogos fictícios
// - Não cria resultados fictícios
// - Proteção contra análise duplicada
// - Timezone = America/Sao_Paulo
// ==================================================

import {
    query
} from "../database/database.js";


// ==================================================
// CONFIGURAÇÃO
// ==================================================

const TIMEZONE = "America/Sao_Paulo";


// ==================================================
// DATA HOJE BRASIL
// ==================================================

export function obterDataHojeBrasil() {

    try {

        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: TIMEZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(new Date());

    } catch (erro) {

        console.error(
            "❌ Erro data Brasil:",
            erro.message
        );

        return new Date()
            .toISOString()
            .slice(0, 10);
    }
}


// ==================================================
// DATA AMANHÃ BRASIL
// ==================================================

export function obterDataAmanhaBrasil() {

    const hoje =
        obterDataHojeBrasil();

    const partes =
        hoje.split("-");

    const data =
        new Date(
            Date.UTC(
                Number(partes[0]),
                Number(partes[1]) - 1,
                Number(partes[2])
            )
        );

    data.setUTCDate(
        data.getUTCDate() + 1
    );

    return data
        .toISOString()
        .slice(0, 10);
}


// ==================================================
// NORMALIZAR INTEGER
// ==================================================

export function normalizarId(valor) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {

        return null;
    }

    const numero =
        Number(valor);

    if (
        !Number.isInteger(numero) ||
        numero <= 0
    ) {

        return null;
    }

    return numero;
}


// ==================================================
// NORMALIZAR API ID
// ==================================================

export function normalizarApiId(valor) {

    return normalizarId(valor);
}


// ==================================================
// CAMPEONATOS
// ==================================================

export async function listarCampeonatos() {

    try {

        const resultado =
            await query(`
                SELECT *
                FROM campeonatos
                ORDER BY nome ASC
            `);

        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro listar campeonatos:",
            erro.message
        );

        return [];
    }
}


// ==================================================
// INSERIR CAMPEONATO
// ==================================================

export async function inserirCampeonato(
    campeonato
) {

    if (!campeonato) {

        throw new Error(
            "Campeonato não informado"
        );
    }

    const {
        id,
        nome,
        pais,
        continente,
        temporada,
        api_id,
        logo,
        ativo
    } = campeonato;

    const campeonatoId =
        normalizarId(id);

    if (!campeonatoId) {

        throw new Error(
            "ID do campeonato inválido"
        );
    }

    const apiId =
        normalizarApiId(api_id);

    const resultado =
        await query(
            `
            INSERT INTO campeonatos
            (
                id,
                nome,
                pais,
                continente,
                temporada,
                api_id,
                logo,
                ativo
            )
            VALUES
            (
                $1::integer,
                $2::text,
                $3::text,
                $4::text,
                $5::text,
                $6::integer,
                $7::text,
                COALESCE($8::boolean, true)
            )

            ON CONFLICT(id)

            DO UPDATE SET

                nome = EXCLUDED.nome,
                pais = EXCLUDED.pais,
                continente = EXCLUDED.continente,
                temporada = EXCLUDED.temporada,
                api_id = EXCLUDED.api_id,
                logo = EXCLUDED.logo,
                ativo = EXCLUDED.ativo

            RETURNING *
            `,
            [
                campeonatoId,
                nome ?? null,
                pais ?? null,
                continente ?? null,
                temporada ?? null,
                apiId,
                logo ?? null,
                ativo ?? true
            ]
        );

    return resultado.rows[0] || null;
}


// ==================================================
// TIMES
// ==================================================

export async function listarTimes() {

    try {

        const resultado =
            await query(`
                SELECT *
                FROM times
                ORDER BY nome ASC
            `);

        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro listar times:",
            erro.message
        );

        return [];
    }
}


// ==================================================
// INSERIR / ATUALIZAR TIME
// ==================================================

export async function inserirTime(
    time
) {

    if (!time) {

        throw new Error(
            "Time não informado"
        );
    }

    const {
        id,
        campeonato_id,
        nome,
        pais
    } = time;

    const timeId =
        normalizarId(id);

    if (!timeId) {

        throw new Error(
            "ID do time inválido"
        );
    }

    const campeonatoId =
        campeonato_id === null ||
        campeonato_id === undefined ||
        campeonato_id === ""
            ? null
            : normalizarId(campeonato_id);

    const resultado =
        await query(
            `
            INSERT INTO times
            (
                id,
                campeonato_id,
                nome,
                pais
            )
            VALUES
            (
                $1::integer,
                $2::integer,
                $3::text,
                $4::text
            )

            ON CONFLICT(id)

            DO UPDATE SET

                campeonato_id =
                    EXCLUDED.campeonato_id,

                nome =
                    EXCLUDED.nome,

                pais =
                    EXCLUDED.pais

            RETURNING *
            `,
            [
                timeId,
                campeonatoId,
                nome ?? null,
                pais ?? null
            ]
        );

    return resultado.rows[0] || null;
}


// ==================================================
// JOGOS DE HOJE
// ==================================================

export async function listarJogosHoje() {

    try {

        const resultado =
            await query(
                `
                SELECT *
                FROM jogos

                WHERE data_jogo IS NOT NULL

                AND (
                    data_jogo AT TIME ZONE $1
                )::date = $2::date

                ORDER BY data_jogo ASC
                `,
                [
                    TIMEZONE,
                    obterDataHojeBrasil()
                ]
            );

        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro jogos hoje:",
            erro.message
        );

        return [];
    }
}


// ==================================================
// JOGOS AMANHÃ
// ==================================================

export async function listarJogosAmanha() {

    try {

        const resultado =
            await query(
                `
                SELECT *
                FROM jogos

                WHERE data_jogo IS NOT NULL

                AND (
                    data_jogo AT TIME ZONE $1
                )::date = $2::date

                ORDER BY data_jogo ASC
                `,
                [
                    TIMEZONE,
                    obterDataAmanhaBrasil()
                ]
            );

        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro jogos amanhã:",
            erro.message
        );

        return [];
    }
}


// ==================================================
// JOGOS HOJE + AMANHÃ
// ==================================================

export async function listarJogosDisponiveis() {

    try {

        const hoje =
            obterDataHojeBrasil();

        const amanha =
            obterDataAmanhaBrasil();

        const resultado =
            await query(
                `
                SELECT *
                FROM jogos

                WHERE data_jogo IS NOT NULL

                AND (
                    data_jogo AT TIME ZONE $1
                )::date BETWEEN $2::date AND $3::date

                ORDER BY data_jogo ASC
                `,
                [
                    TIMEZONE,
                    hoje,
                    amanha
                ]
            );

        console.log(
            `⚽ ${resultado.rows.length} jogos encontrados para hoje + amanhã`
        );

        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro jogos disponíveis:",
            erro.message
        );

        return [];
    }
}


export async function listarJogosHojeEAmanha() {

    return listarJogosDisponiveis();
}


// ==================================================
// BUSCAR JOGO POR ID
// ==================================================

export async function buscarJogoPorId(
    id
) {

    const jogoId =
        normalizarId(id);

    if (!jogoId) {
        return null;
    }

    try {

        const resultado =
            await query(
                `
                SELECT *
                FROM jogos
                WHERE id = $1::integer
                LIMIT 1
                `,
                [jogoId]
            );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error(
            "❌ Erro buscar jogo:",
            erro.message
        );

        return null;
    }
}


// ==================================================
// BUSCAR JOGO API ID
// ==================================================

export async function buscarJogoPorApiId(
    api_id
) {

    const apiId =
        normalizarApiId(api_id);

    if (!apiId) {
        return null;
    }

    try {

        const resultado =
            await query(
                `
                SELECT *
                FROM jogos
                WHERE api_id = $1::integer
                LIMIT 1
                `,
                [apiId]
            );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error(
            "❌ Erro buscar jogo API:",
            erro.message
        );

        return null;
    }
}


// ==================================================
// HISTÓRICO REAL DE UM TIME
//
// IMPORTANTE:
// Somente jogos que possuem:
// - gols_casa
// - gols_fora
//
// Jogos sem placar não são considerados.
// Nenhum resultado é inventado.
// ==================================================

export async function buscarHistoricoTime(
    nomeTime,
    limite = 10,
    dataLimite = null
) {

    if (!nomeTime) {
        return [];
    }

    try {

        const resultado =
            await query(
                `
                SELECT

                    id,
                    api_id,
                    campeonato,
                    time_casa,
                    time_fora,
                    data_jogo,
                    estadio,
                    status,
                    gols_casa,
                    gols_fora

                FROM jogos

                WHERE

                    (
                        LOWER(TRIM(time_casa))
                        =
                        LOWER(TRIM($1::text))

                        OR

                        LOWER(TRIM(time_fora))
                        =
                        LOWER(TRIM($1::text))
                    )

                    AND gols_casa IS NOT NULL
                    AND gols_fora IS NOT NULL

                    AND (
                        $2::timestamp IS NULL
                        OR data_jogo < $2::timestamp
                    )

                ORDER BY data_jogo DESC

                LIMIT $3::integer
                `,
                [
                    nomeTime,
                    dataLimite,
                    Number(limite) || 10
                ]
            );

        console.log(
            `📚 Banco retornou ${resultado.rows.length} registros para ${nomeTime}`
        );

        return resultado.rows;

    } catch (erro) {

        console.error(
            `❌ Erro histórico ${nomeTime}:`,
            erro.message
        );

        return [];
    }
}


// ==================================================
// H2H REAL
// ==================================================

export async function buscarH2H(
    timeCasa,
    timeFora,
    limite = 10,
    dataLimite = null
) {

    if (!timeCasa || !timeFora) {
        return [];
    }

    try {

        const resultado =
            await query(
                `
                SELECT

                    id,
                    api_id,
                    campeonato,
                    time_casa,
                    time_fora,
                    data_jogo,
                    estadio,
                    status,
                    gols_casa,
                    gols_fora

                FROM jogos

                WHERE

                    (

                        (
                            LOWER(TRIM(time_casa))
                            =
                            LOWER(TRIM($1::text))

                            AND

                            LOWER(TRIM(time_fora))
                            =
                            LOWER(TRIM($2::text))
                        )

                        OR

                        (
                            LOWER(TRIM(time_casa))
                            =
                            LOWER(TRIM($2::text))

                            AND

                            LOWER(TRIM(time_fora))
                            =
                            LOWER(TRIM($1::text))
                        )

                    )

                    AND gols_casa IS NOT NULL
                    AND gols_fora IS NOT NULL

                    AND (
                        $3::timestamp IS NULL
                        OR data_jogo < $3::timestamp
                    )

                ORDER BY data_jogo DESC

                LIMIT $4::integer
                `,
                [
                    timeCasa,
                    timeFora,
                    dataLimite,
                    Number(limite) || 10
                ]
            );

        console.log(
            `⚔️ H2H banco: ${resultado.rows.length} registros encontrados`
        );

        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro H2H:",
            erro.message
        );

        return [];
    }
}


// ==================================================
// BUSCAR ANÁLISE POR API ID
// ==================================================

export async function buscarAnalisePorApiId(
    api_id
) {

    const apiId =
        normalizarApiId(api_id);

    if (!apiId) {
        return null;
    }

    try {

        const resultado =
            await query(
                `
                SELECT *
                FROM analises

                WHERE api_id = $1::integer

                ORDER BY
                    id DESC

                LIMIT 1
                `,
                [apiId]
            );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error(
            "❌ Erro buscar análise API:",
            erro.message
        );

        return null;
    }
}


// ==================================================
// BUSCAR ANÁLISE POR ID INTERNO
// ==================================================

export async function buscarAnalisePorId(
    id
) {

    const analiseId =
        normalizarId(id);

    if (!analiseId) {
        return null;
    }

    try {

        const resultado =
            await query(
                `
                SELECT *
                FROM analises
                WHERE id = $1::integer
                LIMIT 1
                `,
                [analiseId]
            );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error(
            "❌ Erro buscar análise por ID:",
            erro.message
        );

        return null;
    }
}


// ==================================================
// BUSCAR ANÁLISE POR NOME
// ==================================================

export async function buscarAnalisePorNome(
    jogo
) {

    if (!jogo) {
        return null;
    }

    try {

        const resultado =
            await query(
                `
                SELECT *
                FROM analises

                WHERE LOWER(TRIM(jogo))
                    =
                    LOWER(TRIM($1::text))

                ORDER BY id DESC

                LIMIT 1
                `,
                [jogo]
            );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error(
            "❌ Erro análise por nome:",
            erro.message
        );

        return null;
    }
}


// ==================================================
// SALVAR ANÁLISE
//
// Proteção por índice UNIQUE api_id.
// ==================================================

export async function salvarAnalise(
    analise
) {

    if (
        !analise ||
        typeof analise !== "object"
    ) {

        throw new Error(
            "Dados da análise inválidos"
        );
    }

    const {

        api_id,
        jogo,

        probabilidade_casa,
        probabilidade_empate,
        probabilidade_fora,

        gols_esperados,
        placar_previsto,

        value_bet,
        confianca,
        algoritmo

    } = analise;

    const apiId =
        normalizarApiId(api_id);


    // ==================================================
    // ANÁLISE SEM API ID
    // ==================================================

    if (apiId === null) {

        const resultado =
            await query(
                `
                INSERT INTO analises
                (
                    jogo,
                    probabilidade_casa,
                    probabilidade_empate,
                    probabilidade_fora,
                    gols_esperados,
                    placar_previsto,
                    value_bet,
                    confianca,
                    algoritmo
                )

                VALUES
                (
                    $1::text,
                    $2::numeric,
                    $3::numeric,
                    $4::numeric,
                    $5::numeric,
                    $6::text,
                    COALESCE($7::boolean, false),
                    $8::text,
                    $9::text
                )

                RETURNING *
                `,
                [
                    jogo ?? null,
                    probabilidade_casa ?? null,
                    probabilidade_empate ?? null,
                    probabilidade_fora ?? null,
                    gols_esperados ?? null,
                    placar_previsto ?? null,
                    value_bet ?? false,
                    confianca ?? null,
                    algoritmo ??
                        "BetVision Statistical AI v9"
                ]
            );

        return resultado.rows[0] || null;
    }


    // ==================================================
    // VERIFICAR EXISTENTE
    // ==================================================

    const existente =
        await buscarAnalisePorApiId(apiId);

    if (existente) {

        console.log(
            `♻️ Análise já existe para API ${apiId} - ID ${existente.id}`
        );

        return existente;
    }


    // ==================================================
    // INSERÇÃO PROTEGIDA
    // ==================================================

    try {

        const resultado =
            await query(
                `
                INSERT INTO analises
                (
                    jogo,
                    probabilidade_casa,
                    probabilidade_empate,
                    probabilidade_fora,
                    gols_esperados,
                    placar_previsto,
                    value_bet,
                    confianca,
                    algoritmo,
                    api_id
                )

                VALUES
                (
                    $1::text,
                    $2::numeric,
                    $3::numeric,
                    $4::numeric,
                    $5::numeric,
                    $6::text,
                    COALESCE($7::boolean, false),
                    $8::text,
                    $9::text,
                    $10::integer
                )

                ON CONFLICT (api_id)
                WHERE api_id IS NOT NULL
                DO NOTHING

                RETURNING *
                `,
                [
                    jogo ?? null,
                    probabilidade_casa ?? null,
                    probabilidade_empate ?? null,
                    probabilidade_fora ?? null,
                    gols_esperados ?? null,
                    placar_previsto ?? null,
                    value_bet ?? false,
                    confianca ?? null,
                    algoritmo ??
                        "BetVision Statistical AI v9",
                    apiId
                ]
            );

        if (resultado.rows[0]) {

            console.log(
                `💾 Análise salva API ${apiId} - ID ${resultado.rows[0].id}`
            );

            return resultado.rows[0];
        }


        const recuperada =
            await buscarAnalisePorApiId(apiId);

        if (recuperada) {
            return recuperada;
        }

        throw new Error(
            `Não foi possível salvar análise API ${apiId}`
        );

    } catch (erro) {

        console.error(
            `❌ Erro salvando análise API ${apiId}:`,
            erro.message
        );

        throw erro;
    }
}


// ==================================================
// LISTAR TODAS
// ==================================================

export async function listarAnalises() {

    try {

        const resultado =
            await query(`
                SELECT *
                FROM analises
                ORDER BY id DESC
            `);

        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro listar análises:",
            erro.message
        );

        return [];
    }
}


// ==================================================
// LISTAR ANÁLISES DE HOJE
// ==================================================

export async function listarAnalisesHoje() {

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
                    j.status,

                    j.gols_casa,
                    j.gols_fora

                FROM analises a

                INNER JOIN jogos j
                    ON j.api_id = a.api_id

                WHERE

                    j.data_jogo IS NOT NULL

                    AND (
                        j.data_jogo AT TIME ZONE $1
                    )::date = $2::date

                ORDER BY

                    j.data_jogo ASC,
                    a.id DESC
                `,
                [
                    TIMEZONE,
                    obterDataHojeBrasil()
                ]
            );

        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro análises hoje:",
            erro.message
        );

        return [];
    }
}


// ==================================================
// LISTAR ANÁLISES HOJE + AMANHÃ
// ==================================================

export async function listarAnalisesDisponiveis() {

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
                    j.status,

                    j.gols_casa,
                    j.gols_fora

                FROM analises a

                INNER JOIN jogos j
                    ON j.api_id = a.api_id

                WHERE

                    j.data_jogo IS NOT NULL

                    AND (
                        j.data_jogo AT TIME ZONE $1
                    )::date BETWEEN $2::date AND $3::date

                ORDER BY

                    j.data_jogo ASC,
                    a.id DESC
                `,
                [
                    TIMEZONE,
                    obterDataHojeBrasil(),
                    obterDataAmanhaBrasil()
                ]
            );

        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro análises disponíveis:",
            erro.message
        );

        return [];
    }
}


// ==================================================
// SALVAR VALUE BET
// ==================================================

export async function salvarValueBet(
    valueBet
) {

    if (!valueBet) {
        return null;
    }

    const {

        jogo_id,
        mercado,
        selecao,
        odd_mercado,
        probabilidade,
        valor_estimado,
        ativo

    } = valueBet;

    const jogoId =
        normalizarId(jogo_id);

    if (!jogoId) {

        throw new Error(
            "jogo_id inválido"
        );
    }

    const resultado =
        await query(
            `
            INSERT INTO value_bets
            (
                jogo_id,
                mercado,
                selecao,
                odd_mercado,
                probabilidade,
                valor_estimado,
                ativo
            )

            VALUES
            (
                $1::integer,
                $2::text,
                $3::text,
                $4::numeric,
                $5::numeric,
                $6::numeric,
                COALESCE($7::boolean, true)
            )

            RETURNING *
            `,
            [
                jogoId,
                mercado ?? "N/A",
                selecao ?? null,
                odd_mercado ?? null,
                probabilidade ?? null,
                valor_estimado ?? null,
                ativo ?? true
            ]
        );

    return resultado.rows[0] || null;
}


// ==================================================
// VALUE BETS HOJE + AMANHÃ
// ==================================================

export async function listarValueBetsDisponiveis() {

    try {

        const resultado =
            await query(
                `
                SELECT

                    vb.*,

                    j.api_id,
                    j.time_casa,
                    j.time_fora,
                    j.data_jogo,
                    j.campeonato,
                    j.estadio,
                    j.status

                FROM value_bets vb

                INNER JOIN jogos j
                    ON j.id = vb.jogo_id

                WHERE

                    vb.ativo = true

                    AND j.data_jogo IS NOT NULL

                    AND (
                        j.data_jogo AT TIME ZONE $1
                    )::date BETWEEN $2::date AND $3::date

                ORDER BY

                    vb.valor_estimado DESC NULLS LAST,
                    j.data_jogo ASC

                LIMIT 100
                `,
                [
                    TIMEZONE,
                    obterDataHojeBrasil(),
                    obterDataAmanhaBrasil()
                ]
            );

        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro Value Bets:",
            erro.message
        );

        return [];
    }
}


// ==================================================
// DASHBOARD
// ==================================================

export async function buscarDashboard() {

    try {

        const resultado =
            await query(`
                SELECT *
                FROM dashboard_status
            `);

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error(
            "❌ Erro dashboard:",
            erro.message
        );

        return null;
    }
}


// ==================================================
// ESTATÍSTICAS
// ==================================================

export async function estatisticasBanco() {

    try {

        const resultado =
            await query(
                `
                SELECT

                    (
                        SELECT COUNT(*)
                        FROM campeonatos
                    ) AS campeonatos,

                    (
                        SELECT COUNT(*)
                        FROM times
                    ) AS times,

                    (
                        SELECT COUNT(*)
                        FROM jogos
                    ) AS jogos_historico,

                    (
                        SELECT COUNT(*)
                        FROM jogos

                        WHERE data_jogo IS NOT NULL

                        AND (
                            data_jogo AT TIME ZONE $1
                        )::date = $2::date
                    ) AS jogos_hoje,

                    (
                        SELECT COUNT(*)
                        FROM jogos

                        WHERE data_jogo IS NOT NULL

                        AND (
                            data_jogo AT TIME ZONE $1
                        )::date = $3::date
                    ) AS jogos_amanha,

                    (
                        SELECT COUNT(*)
                        FROM analises
                    ) AS analises,

                    (
                        SELECT COUNT(*)
                        FROM value_bets
                        WHERE ativo = true
                    ) AS valuebets_ativas

                `,
                [
                    TIMEZONE,
                    obterDataHojeBrasil(),
                    obterDataAmanhaBrasil()
                ]
            );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error(
            "❌ Erro estatísticas:",
            erro.message
        );

        return null;
    }
}


// ==================================================
// EXPORT DEFAULT
// ==================================================

export default {

    listarCampeonatos,
    inserirCampeonato,

    listarTimes,
    inserirTime,

    listarJogosHoje,
    listarJogosAmanha,
    listarJogosDisponiveis,
    listarJogosHojeEAmanha,

    buscarJogoPorId,
    buscarJogoPorApiId,

    buscarHistoricoTime,
    buscarH2H,

    buscarAnalisePorApiId,
    buscarAnalisePorId,
    buscarAnalisePorNome,

    salvarAnalise,

    listarAnalises,
    listarAnalisesHoje,
    listarAnalisesDisponiveis,

    salvarValueBet,
    listarValueBetsDisponiveis,

    buscarDashboard,
    estatisticasBanco,

    obterDataHojeBrasil,
    obterDataAmanhaBrasil
};
