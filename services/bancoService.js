// ==========================================================
// BETVISION AI
// services/bancoService.js
//
// VERSÃO 8.1
//
// PostgreSQL / NeonDB
//
// RESPONSABILIDADES:
//
// - Campeonatos
// - Times
// - Jogos
// - Análises
// - Value Bets
// - Dashboard
//
// REGRAS:
//
// - Jogos exibidos = HOJE + AMANHÃ
// - Histórico permanece no banco
// - IA pode utilizar histórico antigo
// - api_id = INTEGER
// - Não cria jogos fictícios
// - Não cria análises fictícias
// - Proteção contra análise duplicada
// - Timezone = America/Sao_Paulo
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


// ==========================================================
// DATA HOJE BRASIL
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

    catch (erro) {

        console.error(
            "❌ Erro obtendo data Brasil:",
            erro.message
        );

        return null;

    }

}


// ==========================================================
// DATA AMANHÃ BRASIL
// ==========================================================

function obterDataAmanhaBrasil() {

    try {

        const hoje =
            obterDataHojeBrasil();

        if (!hoje) {
            return null;
        }


        const partes =
            hoje.split("-");


        const ano =
            Number(
                partes[0]
            );

        const mes =
            Number(
                partes[1]
            ) - 1;

        const dia =
            Number(
                partes[2]
            );


        const data =
            new Date(
                Date.UTC(
                    ano,
                    mes,
                    dia
                )
            );


        data.setUTCDate(
            data.getUTCDate() + 1
        );


        return data
            .toISOString()
            .slice(
                0,
                10
            );

    }

    catch (erro) {

        console.error(
            "❌ Erro obtendo amanhã:",
            erro.message
        );

        return null;

    }

}


// ==========================================================
// NORMALIZAR ID
// ==========================================================

function normalizarId(
    valor
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return null;

    }


    const numero =
        Number(valor);


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
// NORMALIZAR API ID
// ==========================================================

function normalizarApiId(
    valor
) {

    return normalizarId(
        valor
    );

}


// ==========================================================
// CAMPEONATOS
// ==========================================================

export async function listarCampeonatos() {

    try {

        const resultado =
            await query(

                `
                SELECT *

                FROM campeonatos

                ORDER BY nome ASC
                `

            );


        return (
            resultado.rows ||
            []
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listar campeonatos:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// INSERIR CAMPEONATO
// ==========================================================

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
        normalizarId(
            id
        );


    if (!campeonatoId) {

        throw new Error(
            "ID do campeonato inválido"
        );

    }


    const apiId =
        normalizarApiId(
            api_id
        );


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
                COALESCE(
                    $8::boolean,
                    true
                )
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

                nome ??
                    null,

                pais ??
                    null,

                continente ??
                    null,

                temporada ??
                    null,

                apiId,

                logo ??
                    null,

                ativo ??
                    true

            ]

        );


    return (
        resultado.rows[0] ||
        null
    );

}


// ==========================================================
// TIMES
// ==========================================================

export async function listarTimes() {

    try {

        const resultado =
            await query(

                `
                SELECT *

                FROM times

                ORDER BY nome ASC
                `

            );


        return (
            resultado.rows ||
            []
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listar times:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// INSERIR TIME
// ==========================================================

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
        normalizarId(
            id
        );


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
            : normalizarId(
                campeonato_id
            );


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

                nome ??
                    null,

                pais ??
                    null

            ]

        );


    return (
        resultado.rows[0] ||
        null
    );

}


// ==========================================================
// JOGOS DE HOJE
// ==========================================================

export async function listarJogosHoje() {

    try {

        const hoje =
            obterDataHojeBrasil();


        const resultado =
            await query(

                `
                SELECT *

                FROM jogos

                WHERE

                    data_jogo IS NOT NULL

                    AND

                    (
                        data_jogo
                        AT TIME ZONE
                        $1
                    )::date

                    =

                    $2::date

                ORDER BY
                    data_jogo ASC
                `,

                [
                    TIMEZONE,
                    hoje
                ]

            );


        return (
            resultado.rows ||
            []
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listar jogos hoje:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// JOGOS DE AMANHÃ
// ==========================================================

export async function listarJogosAmanha() {

    try {

        const amanha =
            obterDataAmanhaBrasil();


        const resultado =
            await query(

                `
                SELECT *

                FROM jogos

                WHERE

                    data_jogo IS NOT NULL

                    AND

                    (
                        data_jogo
                        AT TIME ZONE
                        $1
                    )::date

                    =

                    $2::date

                ORDER BY
                    data_jogo ASC
                `,

                [
                    TIMEZONE,
                    amanha
                ]

            );


        return (
            resultado.rows ||
            []
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listar jogos amanhã:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// JOGOS DISPONÍVEIS
//
// HOJE + AMANHÃ
// ==========================================================

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

                WHERE

                    data_jogo IS NOT NULL

                    AND

                    (
                        data_jogo
                        AT TIME ZONE
                        $1
                    )::date

                    BETWEEN

                    $2::date

                    AND

                    $3::date

                ORDER BY
                    data_jogo ASC
                `,

                [

                    TIMEZONE,

                    hoje,

                    amanha

                ]

            );


        console.log(
            `⚽ ${resultado.rows.length} ` +
            `jogos encontrados para hoje + amanhã`
        );


        return (
            resultado.rows ||
            []
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listar jogos disponíveis:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// ALIAS
// ==========================================================

export async function listarJogosHojeEAmanha() {

    return await listarJogosDisponiveis();

}


// ==========================================================
// BUSCAR JOGO POR ID
// ==========================================================

export async function buscarJogoPorId(
    id
) {

    const jogoId =
        normalizarId(
            id
        );


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

                [
                    jogoId
                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro buscar jogo:",
            erro.message
        );

        return null;

    }

}


// ==========================================================
// BUSCAR JOGO POR API ID
// ==========================================================

export async function buscarJogoPorApiId(
    api_id
) {

    const apiId =
        normalizarApiId(
            api_id
        );


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

                [
                    apiId
                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(
            `❌ Erro buscando jogo API ${apiId}:`,
            erro.message
        );

        return null;

    }

}


// ==========================================================
// BUSCAR ANÁLISE POR ID
//
// ESTA FUNÇÃO ESTAVA FALTANDO NA VERSÃO ENVIADA.
// ==========================================================

export async function buscarAnalisePorId(
    id
) {

    const analiseId =
        normalizarId(
            id
        );


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

                [
                    analiseId
                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro buscando análise por ID:",
            erro.message
        );

        return null;

    }

}


// ==========================================================
// BUSCAR ANÁLISE POR API ID
// ==========================================================

export async function buscarAnalisePorApiId(
    api_id
) {

    const apiId =
        normalizarApiId(
            api_id
        );


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

                    criado_em DESC NULLS LAST,

                    id DESC

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

    catch (erro) {

        console.error(
            `❌ Erro análise API ${apiId}:`,
            erro.message
        );

        return null;

    }

}


// ==========================================================
// BUSCAR ANÁLISE POR NOME
// ==========================================================

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
                        TRIM(
                            $1::text
                        )
                    )

                ORDER BY

                    criado_em DESC NULLS LAST,

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


// ==========================================================
// SALVAR ANÁLISE SEM API ID
// ==========================================================

async function salvarAnaliseSemApiId(
    analise
) {

    const {

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

                jogo ??
                    null,

                probabilidade_casa ??
                    null,

                probabilidade_empate ??
                    null,

                probabilidade_fora ??
                    null,

                gols_esperados ??
                    null,

                placar_previsto ??
                    null,

                value_bet ??
                    false,

                confianca ??
                    null,

                algoritmo ??
                    "BetVision AI Motor Estatístico v8.0"

            ]

        );


    return (
        resultado.rows[0] ||
        null
    );

}


// ==========================================================
// SALVAR ANÁLISE
// ==========================================================

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
        normalizarApiId(
            api_id
        );


    // ======================================================
    // SEM API ID
    // ======================================================

    if (
        apiId === null
    ) {

        return await salvarAnaliseSemApiId(
            analise
        );

    }


    // ======================================================
    // VERIFICAR EXISTENTE
    // ======================================================

    const existente =
        await buscarAnalisePorApiId(
            apiId
        );


    if (
        existente
    ) {

        console.log(
            `♻️ Análise já existe para API ${apiId} ` +
            `- ID ${existente.id}`
        );


        return existente;

    }


    // ======================================================
    // INSERIR
    // ======================================================

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

                    WHERE api_id = $10::integer

                )

                RETURNING *
                `,

                [

                    jogo ??
                        null,

                    probabilidade_casa ??
                        null,

                    probabilidade_empate ??
                        null,

                    probabilidade_fora ??
                        null,

                    gols_esperados ??
                        null,

                    placar_previsto ??
                        null,

                    value_bet ??
                        false,

                    confianca ??
                        null,

                    algoritmo ??
                        "BetVision AI Motor Estatístico v8.0",

                    apiId

                ]

            );


        if (
            resultado.rows[0]
        ) {

            console.log(
                `💾 Análise salva para API ${apiId} ` +
                `- ID ${resultado.rows[0].id}`
            );


            return resultado.rows[0];

        }


        const depois =
            await buscarAnalisePorApiId(
                apiId
            );


        if (
            depois
        ) {

            return depois;

        }


        throw new Error(
            `Não foi possível salvar análise para API ${apiId}`
        );

    }

    catch (erro) {

        if (
            erro?.code === "23505"
        ) {

            const recuperada =
                await buscarAnalisePorApiId(
                    apiId
                );


            if (
                recuperada
            ) {

                return recuperada;

            }

        }


        console.error(
            `❌ Erro salvando análise API ${apiId}:`,
            erro.message
        );


        throw erro;

    }

}


// ==========================================================
// LISTAR TODAS AS ANÁLISES
// ==========================================================

export async function listarAnalises() {

    try {

        const resultado =
            await query(

                `
                SELECT *

                FROM analises

                ORDER BY

                    criado_em DESC NULLS LAST,

                    id DESC
                `

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
// LISTAR ANÁLISES DE HOJE
// ==========================================================

export async function listarAnalisesHoje() {

    try {

        const hoje =
            obterDataHojeBrasil();


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

                    ON

                    j.api_id =
                    a.api_id

                WHERE

                    j.data_jogo IS NOT NULL

                    AND

                    (
                        j.data_jogo
                        AT TIME ZONE
                        $1
                    )::date

                    =

                    $2::date

                ORDER BY

                    j.data_jogo ASC,

                    a.criado_em DESC NULLS LAST,

                    a.id DESC
                `,

                [

                    TIMEZONE,

                    hoje

                ]

            );


        return (
            resultado.rows ||
            []
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listar análises hoje:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// LISTAR ANÁLISES DISPONÍVEIS
//
// HOJE + AMANHÃ
// ==========================================================

export async function listarAnalisesDisponiveis() {

    try {

        const hoje =
            obterDataHojeBrasil();

        const amanha =
            obterDataAmanhaBrasil();


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

                    ON

                    j.api_id =
                    a.api_id

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

                    a.criado_em DESC NULLS LAST,

                    a.id DESC
                `,

                [

                    TIMEZONE,

                    hoje,

                    amanha

                ]

            );


        return (
            resultado.rows ||
            []
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro análises disponíveis:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// SALVAR VALUE BET
// ==========================================================

export async function salvarValueBet(
    valueBet
) {

    if (
        !valueBet ||
        typeof valueBet !== "object"
    ) {

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
        jogo_id === null ||
        jogo_id === undefined ||
        jogo_id === ""
            ? null
            : normalizarId(
                jogo_id
            );


    if (
        jogo_id !== null &&
        jogo_id !== undefined &&
        jogo_id !== "" &&
        !jogoId
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

                COALESCE(
                    $7::boolean,
                    true
                )

            )

            RETURNING *
            `,

            [

                jogoId,

                mercado ??
                    "N/A",

                selecao ??
                    null,

                odd_mercado ??
                    null,

                probabilidade ??
                    null,

                valor_estimado ??
                    null,

                ativo ??
                    true

            ]

        );


    return (
        resultado.rows[0] ||
        null
    );

}


// ==========================================================
// VALUE BETS DISPONÍVEIS
//
// HOJE + AMANHÃ
// ==========================================================

export async function listarValueBetsDisponiveis() {

    try {

        const hoje =
            obterDataHojeBrasil();

        const amanha =
            obterDataAmanhaBrasil();


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

                    ON

                    j.id =
                    vb.jogo_id

                WHERE

                    vb.ativo = true

                    AND

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

                    vb.valor_estimado DESC NULLS LAST,

                    j.data_jogo ASC

                LIMIT 100
                `,

                [

                    TIMEZONE,

                    hoje,

                    amanha

                ]

            );


        return (
            resultado.rows ||
            []
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listar Value Bets:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// DASHBOARD
// ==========================================================

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
            "❌ Erro dashboard:",
            erro.message
        );

        return null;

    }

}


// ==========================================================
// ESTATÍSTICAS BANCO
// ==========================================================

export async function estatisticasBanco() {

    try {

        const hoje =
            obterDataHojeBrasil();

        const amanha =
            obterDataAmanhaBrasil();


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

                        WHERE

                            data_jogo IS NOT NULL

                            AND

                            (
                                data_jogo
                                AT TIME ZONE
                                $1
                            )::date

                            =

                            $2::date

                    ) AS jogos_hoje,


                    (

                        SELECT COUNT(*)

                        FROM jogos

                        WHERE

                            data_jogo IS NOT NULL

                            AND

                            (
                                data_jogo
                                AT TIME ZONE
                                $1
                            )::date

                            =

                            $3::date

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

                    hoje,

                    amanha

                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro estatísticas banco:",
            erro.message
        );

        return null;

    }

}


// ==========================================================
// EXPORT DEFAULT
// ==========================================================

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

    buscarAnalisePorId,

    buscarAnalisePorApiId,

    buscarAnalisePorNome,

    salvarAnalise,

    listarAnalises,

    listarAnalisesHoje,

    listarAnalisesDisponiveis,

    salvarValueBet,

    listarValueBetsDisponiveis,

    buscarDashboard,

    estatisticasBanco

};
