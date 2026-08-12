// ==================================================
// BETVISION AI
// services/bancoService.js
//
// Serviço central PostgreSQL v7.1
// Compatível com NeonDB
//
// CORREÇÕES V7.1:
//
// - api_id sempre convertido para INTEGER
// - Proteção explícita INTEGER = INTEGER
// - Corrige "operator does not exist: integer = text"
// - Busca de jogo por api_id corrigida
// - Busca de análise por api_id corrigida
// - Salvamento de análise protegido
// - Não duplica análise por api_id
// - Compatibilidade com análises antigas
// - Listagem de jogos usando America/Sao_Paulo
// - Listagem de análises dos jogos de hoje
// - Última análise ordenada por criado_em
// - Compatibilidade com bancoService anterior
// - Não cria dados fictícios
// - PostgreSQL / NeonDB
// ==================================================

import {
    query
} from "../database/database.js";

// ==================================================
// CONFIGURAÇÃO
// ==================================================

const TIMEZONE =
    "America/Sao_Paulo";

// ==================================================
// DATA ATUAL DO BRASIL
// ==================================================

function obterDataHojeBrasil() {

    try {

        const agora =
            new Date();

        const formatter =
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
            );

        return formatter.format(
            agora
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro obtendo data Brasil:",
            erro.message
        );

        return null;

    }

}

// ==================================================
// NORMALIZAR API ID
// ==================================================

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

// ==================================================
// CAMPEONATOS
// ==================================================

export async function listarCampeonatos() {

    try {

        const resultado =
            await query(`

                SELECT *

                FROM campeonatos

                ORDER BY nome

            `);

        return resultado.rows;

    }

    catch (erro) {

        console.error(
            "❌ Erro listar campeonatos:",
            erro.message
        );

        return [];

    }

}

// ==================================================
// INSERIR / ATUALIZAR CAMPEONATO
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
        Number(
            id
        );

    const apiId =
        normalizarApiId(
            api_id ?? id
        );

    if (
        !Number.isInteger(
            campeonatoId
        )
        ||
        campeonatoId <= 0
    ) {

        throw new Error(
            "ID do campeonato inválido"
        );

    }

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
                $2,
                $3,
                $4,
                $5,
                $6::integer,
                $7,
                COALESCE($8, true)
            )

            ON CONFLICT(id)

            DO UPDATE SET

                nome =
                    EXCLUDED.nome,

                pais =
                    EXCLUDED.pais,

                continente =
                    EXCLUDED.continente,

                temporada =
                    EXCLUDED.temporada,

                api_id =
                    EXCLUDED.api_id,

                logo =
                    EXCLUDED.logo,

                ativo =
                    EXCLUDED.ativo

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

                ORDER BY nome

            `);

        return resultado.rows;

    }

    catch (erro) {

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
        Number(
            id
        );

    const campeonatoId =
        campeonato_id === null ||
        campeonato_id === undefined ||
        campeonato_id === ""
            ? null
            : Number(
                campeonato_id
            );

    if (
        !Number.isInteger(
            timeId
        )
        ||
        timeId <= 0
    ) {

        throw new Error(
            "ID do time inválido"
        );

    }

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
                $3,
                $4
            )

            ON CONFLICT(id)

            DO UPDATE SET

                nome =
                    EXCLUDED.nome,

                campeonato_id =
                    EXCLUDED.campeonato_id,

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
//
// IMPORTANTE:
//
// Não usamos simplesmente:
//
// DATE(data_jogo) = CURRENT_DATE
//
// porque o servidor pode estar em UTC.
//
// A comparação abaixo usa explicitamente
// America/Sao_Paulo.
// ==================================================

export async function listarJogosHoje() {

    try {

        const resultado =
            await query(

                `

                SELECT *

                FROM jogos

                WHERE

                    data_jogo IS NOT NULL

                    AND

                    DATE(
                        data_jogo
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )

                    =

                    CURRENT_DATE AT TIME ZONE
                    'America/Sao_Paulo'

                ORDER BY
                    data_jogo ASC

                `

            );

        return resultado.rows;

    }

    catch (erro) {

        console.error(
            "❌ Erro listar jogos de hoje:",
            erro.message
        );

        return [];

    }

}

// ==================================================
// BUSCAR JOGO POR API ID
// ==================================================

export async function buscarJogoPorApiId(
    api_id
) {

    const apiIdNumero =
        normalizarApiId(
            api_id
        );

    if (!apiIdNumero) {

        return null;

    }

    try {

        const resultado =
            await query(

                `

                SELECT *

                FROM jogos

                WHERE

                    api_id =
                    $1::integer

                LIMIT 1

                `,

                [
                    apiIdNumero
                ]

            );

        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(

            `❌ Erro buscando jogo API ${apiIdNumero}:`,

            erro.message

        );

        return null;

    }

}

// ==================================================
// BUSCAR ANÁLISE POR API ID
// ==================================================

export async function buscarAnalisePorApiId(
    api_id
) {

    const apiIdNumero =
        normalizarApiId(
            api_id
        );

    if (!apiIdNumero) {

        return null;

    }

    try {

        const resultado =
            await query(

                `

                SELECT *

                FROM analises

                WHERE

                    api_id =
                    $1::integer

                ORDER BY

                    criado_em DESC,

                    id DESC

                LIMIT 1

                `,

                [
                    apiIdNumero
                ]

            );

        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(

            `❌ Erro buscando análise API ${apiIdNumero}:`,

            erro.message

        );

        return null;

    }

}

// ==================================================
// BUSCAR ANÁLISE PELO NOME
//
// SOMENTE análises antigas sem api_id.
// ==================================================

export async function buscarAnalisePorNome(
    jogo
) {

    if (
        !jogo ||
        typeof jogo !== "string"
    ) {

        return null;

    }

    try {

        const resultado =
            await query(

                `

                SELECT *

                FROM analises

                WHERE

                    api_id IS NULL

                    AND

                    LOWER(
                        TRIM(jogo)
                    )

                    =

                    LOWER(
                        TRIM($1::text)
                    )

                ORDER BY

                    criado_em DESC,

                    id DESC

                LIMIT 1

                `,

                [
                    jogo
                ]

            );

        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(

            "❌ Erro buscando análise antiga:",

            erro.message

        );

        return null;

    }

}

// ==================================================
// SALVAR ANÁLISE
//
// CORREÇÃO PRINCIPAL:
//
// Todas as comparações de api_id agora possuem:
//
// $10::integer
//
// Isso elimina:
//
// operator does not exist:
// integer = text
//
// Além disso:
//
// 1 jogo = 1 análise por api_id
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

    const apiIdNumero =
        normalizarApiId(
            api_id
        );

    // ==================================================
    // SEM API ID
    // ==================================================

    if (
        apiIdNumero === null
    ) {

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

                    COALESCE(
                        $7::boolean,
                        false
                    ),

                    $8::text,
                    $9::text,

                    NULL
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
                        "BetVision Statistical AI"
                ]

            );

        return (
            resultado.rows[0] ||
            null
        );

    }

    // ==================================================
    // COM API ID
    // ==================================================

    const existente =
        await buscarAnalisePorApiId(
            apiIdNumero
        );

    if (
        existente
    ) {

        console.log(

            `♻️ Análise já existe para API ` +
            `${apiIdNumero} - ID ${existente.id}`

        );

        return existente;

    }

    // ==================================================
    // INSERIR NOVA ANÁLISE
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

                SELECT

                    $1::text,

                    $2::numeric,
                    $3::numeric,
                    $4::numeric,

                    $5::numeric,
                    $6::text,

                    COALESCE(
                        $7::boolean,
                        false
                    ),

                    $8::text,
                    $9::text,

                    $10::integer

                WHERE NOT EXISTS (

                    SELECT 1

                    FROM analises

                    WHERE

                        api_id =
                        $10::integer

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
                        "BetVision Statistical AI",

                    apiIdNumero
                ]

            );

        if (
            resultado.rows[0]
        ) {

            console.log(

                `💾 Nova análise salva para API ` +
                `${apiIdNumero} - ID ` +
                `${resultado.rows[0].id}`

            );

            return resultado.rows[0];

        }

        // ==================================================
        // OUTRA REQUISIÇÃO PODE TER INSERIDO
        // ==================================================

        const depois =
            await buscarAnalisePorApiId(
                apiIdNumero
            );

        if (
            depois
        ) {

            console.log(

                `♻️ Análise recuperada para API ` +
                `${apiIdNumero} - ID ${depois.id}`

            );

            return depois;

        }

        throw new Error(

            `Não foi possível salvar análise ` +
            `para API ${apiIdNumero}`

        );

    }

    catch (erro) {

        // ==================================================
        // DUPLICIDADE
        // ==================================================

        if (
            erro?.code === "23505"
        ) {

            const recuperada =
                await buscarAnalisePorApiId(
                    apiIdNumero
                );

            if (
                recuperada
            ) {

                return recuperada;

            }

        }

        console.error(

            `❌ Erro salvando análise API ` +
            `${apiIdNumero}:`,

            erro.message

        );

        throw erro;

    }

}

// ==================================================
// LISTAR ANÁLISES
//
// IMPORTANTE:
//
// Mantém a função genérica.
//
// Retorna todas as análises.
//
// Para o Dashboard de hoje, usar:
//
// listarAnalisesHoje()
// ==================================================

export async function listarAnalises() {

    try {

        const resultado =
            await query(

                `

                SELECT *

                FROM analises

                ORDER BY

                    criado_em DESC,

                    id DESC

                `

            );

        return resultado.rows;

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
// LISTAR ANÁLISES DOS JOGOS DE HOJE
//
// Usa a data do jogo e não criado_em.
//
// Fuso:
// America/Sao_Paulo
//
// Em 12/08/2026:
//
// retorna somente jogos de 12/08/2026.
//
// A ordenação usa criado_em DESC para que
// a análise mais recente apareça primeiro.
// ==================================================

export async function listarAnalisesHoje() {

    try {

        const resultado =
            await query(

                `

                SELECT

                    a.*,

                    j.data_jogo,

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.status

                FROM analises a

                INNER JOIN jogos j

                    ON

                    j.api_id =
                    a.api_id

                WHERE

                    j.data_jogo IS NOT NULL

                    AND

                    DATE(
                        j.data_jogo
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

                    a.criado_em DESC,

                    a.id DESC

                `

            );

        return resultado.rows;

    }

    catch (erro) {

        console.error(

            "❌ Erro listar análises de hoje:",

            erro.message

        );

        return [];

    }

}

// ==================================================
// VALUE BETS
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
        odd_mercado,
        probabilidade_real,
        valor_esperado,
        confianca
    } = valueBet;

    const jogoIdNumero =

        jogo_id === null ||
        jogo_id === undefined ||
        jogo_id === ""

            ? null

            : Number(
                jogo_id
            );

    if (
        jogoIdNumero !== null
        &&
        (
            !Number.isInteger(
                jogoIdNumero
            )
            ||
            jogoIdNumero <= 0
        )
    ) {

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
                odd_mercado,
                probabilidade_real,
                valor_esperado,
                confianca
            )

            VALUES

            (
                $1::integer,
                $2::text,
                $3::numeric,
                $4::numeric,
                $5::numeric,
                $6::text
            )

            RETURNING *

            `,

            [
                jogoIdNumero,

                mercado ??
                    "N/A",

                odd_mercado ??
                    null,

                probabilidade_real ??
                    null,

                valor_esperado ??
                    null,

                confianca ??
                    null
            ]

        );

    return (
        resultado.rows[0] ||
        null
    );

}

// ==================================================
// DASHBOARD
// ==================================================

export async function buscarDashboard() {

    try {

        const resultado =
            await query(

                `

                SELECT *

                FROM dashboard_status

                `

            );

        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(

            "❌ Erro buscar dashboard:",

            erro.message

        );

        return null;

    }

}

// ==================================================
// EXPORT FINAL
// ==================================================

export default {

    listarCampeonatos,

    inserirCampeonato,

    listarTimes,

    inserirTime,

    listarJogosHoje,

    buscarJogoPorApiId,

    buscarAnalisePorApiId,

    buscarAnalisePorNome,

    salvarAnalise,

    listarAnalises,

    listarAnalisesHoje,

    salvarValueBet,

    buscarDashboard

};
