// ==========================================================
// BETVISION AI
// services/bancoService.js
//
// VERSÃO 9.0
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
// JOGOS:
//   HOJE + AMANHÃ
//
// ANÁLISES:
//   DASHBOARD = SOMENTE HOJE
//
// HISTÓRICO:
//   PERMANECE NO BANCO
//
// IA:
//   PODE USAR HISTÓRICO
//
// API ID:
//   INTEGER
//
// TIMEZONE:
//   America/Sao_Paulo
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
// DATA HOJE
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


// ==========================================================
// DATA AMANHÃ
// ==========================================================

function obterDataAmanhaBrasil() {

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


    const n =
        Number(valor);


    if (
        !Number.isInteger(n) ||
        n <= 0
    ) {

        return null;
    }


    return n;
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


        return resultado.rows || [];

    } catch (erro) {

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


    const id =
        normalizarId(
            campeonato.id
        );

    const apiId =
        normalizarApiId(
            campeonato.api_id
        );


    if (!id) {

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

                id,

                campeonato.nome ??
                    null,

                campeonato.pais ??
                    null,

                campeonato.continente ??
                    null,

                campeonato.temporada ??
                    null,

                apiId,

                campeonato.logo ??
                    null,

                campeonato.ativo ??
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


        return resultado.rows || [];

    } catch (erro) {

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


    const id =
        normalizarId(
            time.id
        );


    if (!id) {

        throw new Error(
            "ID do time inválido"
        );
    }


    const campeonatoId =
        time.campeonato_id === null ||
        time.campeonato_id === undefined ||
        time.campeonato_id === ""

            ? null

            : normalizarId(
                time.campeonato_id
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

                campeonato_id =
                    EXCLUDED.campeonato_id,

                nome =
                    EXCLUDED.nome,

                pais =
                    EXCLUDED.pais

            RETURNING *
            `,
            [

                id,

                campeonatoId,

                time.nome ??
                    null,

                time.pais ??
                    null
            ]
        );


    return (
        resultado.rows[0] ||
        null
    );
}


// ==========================================================
// JOGOS HOJE
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

                    = $2::date

                ORDER BY
                    data_jogo ASC
                `,
                [
                    TIMEZONE,
                    hoje
                ]
            );


        return resultado.rows || [];

    } catch (erro) {

        console.error(
            "❌ Erro jogos hoje:",
            erro.message
        );

        return [];
    }
}


// ==========================================================
// JOGOS AMANHÃ
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

                    = $2::date

                ORDER BY
                    data_jogo ASC
                `,
                [
                    TIMEZONE,
                    amanha
                ]
            );


        return resultado.rows || [];

    } catch (erro) {

        console.error(
            "❌ Erro jogos amanhã:",
            erro.message
        );

        return [];
    }
}


// ==========================================================
// JOGOS DISPONÍVEIS
//
// SOMENTE HOJE + AMANHÃ
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
            `⚽ ${resultado.rows.length} jogos encontrados hoje + amanhã`
        );


        return resultado.rows || [];

    } catch (erro) {

        console.error(
            "❌ Erro jogos disponíveis:",
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
                [
                    jogoId
                ]
            );


        return (
            resultado.rows[0] ||
            null
        );

    } catch (erro) {

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

    } catch (erro) {

        console.error(
            "❌ Erro buscar jogo API:",
            erro.message
        );

        return null;
    }
}


// ==========================================================
// BUSCAR ANÁLISE POR ID
//
// USADA PELO /api/analises/:id
// ==========================================================

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

                LEFT JOIN jogos j

                    ON j.api_id = a.api_id

                WHERE
                    a.id = $1::integer

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

    } catch (erro) {

        console.error(
            "❌ Erro buscar análise por ID:",
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

                    criado_em DESC,

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

    } catch (erro) {

        console.error(
            "❌ Erro buscar análise API:",
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

                    AND LOWER(TRIM(jogo))
                    =
                    LOWER(TRIM($1::text))

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

    } catch (erro) {

        console.error(
            "❌ Erro análise por nome:",
            erro.message
        );

        return null;
    }
}


// ==========================================================
// SALVAR ANÁLISE
//
// Compatível com:
//
// {
//   api_id,
//   jogo,
//   probabilidades,
//   golsEsperados,
//   placarPrevisto,
//   confianca
// }
//
// E também com formato antigo.
//
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


    const apiId =
        normalizarApiId(
            analise.api_id ??
            analise.apiId ??
            analise.jogo_api_id
        );


    const nomeJogo =
        typeof analise.jogo === "string"

            ? analise.jogo

            : analise.jogo?.nome ??
              (
                analise.jogo?.casa &&
                analise.jogo?.fora

                    ? `${analise.jogo.casa} x ` +
                      `${analise.jogo.fora}`

                    : null
              );


    const probabilidades =
        analise.probabilidades ||
        {};


    const gols =
        analise.golsEsperados ||
        {};


    const valorValueBet =
        Array.isArray(
            analise.valueBets
        )
        &&
        analise.valueBets.length > 0;


    const valueBet =
        analise.value_bet ??
        valorValueBet;


    const probCasa =
        analise.probabilidade_casa ??
        probabilidades.casa ??
        null;


    const probEmpate =
        analise.probabilidade_empate ??
        probabilidades.empate ??
        null;


    const probFora =
        analise.probabilidade_fora ??
        probabilidades.fora ??
        null;


    const golsEsperados =
        analise.gols_esperados ??
        gols.total ??
        null;


    const placarPrevisto =
        analise.placar_previsto ??
        analise.placarPrevisto ??
        null;


    const confianca =
        analise.confianca?.percentual ??
        analise.confianca ??
        null;


    const algoritmo =
        analise.algoritmo ??
        "BetVision AI Motor Estatístico v8";


    if (!nomeJogo) {

        throw new Error(
            "Jogo não informado"
        );
    }


    // ======================================================
    // SEM API ID
    // ======================================================

    if (!apiId) {

        const existente =
            await buscarAnalisePorNome(
                nomeJogo
            );


        if (existente) {

            return existente;
        }


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

                    $8::numeric,

                    $9::text,

                    NULL
                )

                RETURNING *
                `,
                [

                    nomeJogo,

                    probCasa,
                    probEmpate,
                    probFora,

                    golsEsperados,
                    placarPrevisto,

                    valueBet,

                    confianca,

                    algoritmo
                ]
            );


        return (
            resultado.rows[0] ||
            null
        );
    }


    // ======================================================
    // PROTEÇÃO DUPLICAÇÃO
    // ======================================================

    const existente =
        await buscarAnalisePorApiId(
            apiId
        );


    if (existente) {

        console.log(
            `♻️ Análise já existe API ${apiId}`
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

                VALUES

                (
                    $1::text,

                    $2::numeric,
                    $3::numeric,
                    $4::numeric,

                    $5::numeric,
                    $6::text,

                    COALESCE($7::boolean, false),

                    $8::numeric,

                    $9::text,

                    $10::integer
                )

                ON CONFLICT DO NOTHING

                RETURNING *
                `,
                [

                    nomeJogo,

                    probCasa,
                    probEmpate,
                    probFora,

                    golsEsperados,
                    placarPrevisto,

                    valueBet,

                    confianca,

                    algoritmo,

                    apiId
                ]
            );


        if (
            resultado.rows[0]
        ) {

            console.log(
                `💾 Análise salva API ${apiId} ` +
                `ID ${resultado.rows[0].id}`
            );


            return resultado.rows[0];
        }


        const recuperada =
            await buscarAnalisePorApiId(
                apiId
            );


        if (recuperada) {
            return recuperada;
        }


        throw new Error(
            `Não foi possível salvar análise API ${apiId}`
        );

    } catch (erro) {

        if (
            erro?.code === "23505"
        ) {

            const recuperada =
                await buscarAnalisePorApiId(
                    apiId
                );


            if (recuperada) {
                return recuperada;
            }
        }


        console.error(
            "❌ Erro salvando análise:",
            erro.message
        );


        throw erro;
    }
}


// ==========================================================
// LISTAR TODAS AS ANÁLISES
//
// HISTÓRICO COMPLETO
// ==========================================================

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


        return resultado.rows || [];

    } catch (erro) {

        console.error(
            "❌ Erro listar análises:",
            erro.message
        );

        return [];
    }
}


// ==========================================================
// LISTAR ANÁLISES DE HOJE
//
// REGRA ABSOLUTA:
//
// somente jogos cuja data brasileira
// seja exatamente hoje.
//
// ==========================================================

export async function listarAnalisesHoje() {

    try {

        const hoje =
            obterDataHojeBrasil();


        console.log(
            `📅 Buscando análises de hoje: ${hoje}`
        );


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

                    ON j.api_id = a.api_id

                WHERE

                    j.data_jogo IS NOT NULL

                    AND

                    (
                        j.data_jogo
                        AT TIME ZONE
                        $1
                    )::date

                    = $2::date

                ORDER BY

                    j.data_jogo ASC,

                    a.id DESC
                `,
                [
                    TIMEZONE,
                    hoje
                ]
            );


        console.log(
            `🤖 ${resultado.rows.length} análises retornadas para hoje`
        );


        return resultado.rows || [];

    } catch (erro) {

        console.error(
            "❌ Erro listar análises hoje:",
            erro.message
        );

        return [];
    }
}


// ==========================================================
// LISTAR ANÁLISES HOJE + AMANHÃ
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

                    ON j.api_id = a.api_id

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

                    a.id DESC
                `,
                [
                    TIMEZONE,
                    hoje,
                    amanha
                ]
            );


        return resultado.rows || [];

    } catch (erro) {

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


    const jogoId =
        valueBet.jogo_id === null ||
        valueBet.jogo_id === undefined ||
        valueBet.jogo_id === ""

            ? null

            : normalizarId(
                valueBet.jogo_id
            );


    if (
        valueBet.jogo_id !== null &&
        valueBet.jogo_id !== undefined &&
        valueBet.jogo_id !== "" &&
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
                COALESCE($7::boolean, true)
            )

            RETURNING *
            `,
            [

                jogoId,

                valueBet.mercado ??
                    "N/A",

                valueBet.selecao ??
                    null,

                valueBet.odd_mercado ??
                    null,

                valueBet.probabilidade ??
                    null,

                valueBet.valor_estimado ??
                    null,

                valueBet.ativo ??
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

                    ON j.id = vb.jogo_id

                WHERE

                    vb.ativo = true

                    AND j.data_jogo IS NOT NULL

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


        return resultado.rows || [];

    } catch (erro) {

        console.error(
            "❌ Erro Value Bets:",
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

    } catch (erro) {

        console.error(
            "❌ Erro dashboard:",
            erro.message
        );

        return null;
    }
}


// ==========================================================
// ESTATÍSTICAS DO BANCO
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

                            = $2::date

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

                            = $3::date

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

    } catch (erro) {

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
