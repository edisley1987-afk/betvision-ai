// ==================================================
// BETVISION AI
// services/bancoService.js
//
// VERSÃO 11.0
//
// PostgreSQL / NeonDB
//
// CORREÇÕES:
//
// - PostgreSQL compatível
// - NeonDB
// - TIMEZONE America/Sao_Paulo
// - Jogos HOJE + AMANHÃ
// - Análises SOMENTE HOJE
// - H2H REAL
// - Histórico REAL
// - Não cria jogos fictícios
// - Não cria resultados fictícios
// - Tabela analises atual preservada
// - api_id vem de jogos
// - jogo_id vem de jogos
// - Dashboard não depende de dashboard_status
// - Probabilidades compatíveis com objeto
// - Value Bets protegidas contra erro
// - Consultas protegidas
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
// NORMALIZAR ID
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

    return normalizarId(
        valor
    );
}


// ==================================================
// CAMPEONATOS
// ==========================================================

export async function listarCampeonatos() {

    const resultado =
        await query(
            `
            SELECT *
            FROM campeonatos
            ORDER BY nome ASC
            `
        );


    console.log(
        `🏆 Campeonatos encontrados: ${resultado.rows.length}`
    );


    return resultado.rows;
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


// ==================================================
// TIMES
// ==================================================

export async function listarTimes() {

    const resultado =
        await query(
            `
            SELECT *
            FROM times
            ORDER BY nome ASC
            `
        );


    return resultado.rows;
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
        (
            campeonato_id === null ||
            campeonato_id === undefined ||
            campeonato_id === ""
        )
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


// ==================================================
// CONDIÇÃO DE DATA
//
// Funciona para timestamp/timestamptz
// mantendo America/Sao_Paulo.
//
// ==================================================

const EXPRESSAO_DATA_BRASIL = `
    (
        data_jogo AT TIME ZONE $1
    )::date
`;


// ==================================================
// JOGOS DE HOJE
// ==================================================

export async function listarJogosHoje() {

    try {

        const hoje =
            obterDataHojeBrasil();


        const resultado =
            await query(
                `
                SELECT *
                FROM jogos

                WHERE data_jogo IS NOT NULL

                AND
                (
                    data_jogo AT TIME ZONE $1
                )::date = $2::date

                ORDER BY data_jogo ASC
                `,
                [
                    TIMEZONE,
                    hoje
                ]
            );


        console.log(
            `⚽ ${resultado.rows.length} jogos encontrados para hoje`
        );


        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro jogos hoje:",
            erro
        );

        throw erro;
    }
}


// ==================================================
// JOGOS AMANHÃ
// ==================================================

export async function listarJogosAmanha() {

    try {

        const amanha =
            obterDataAmanhaBrasil();


        const resultado =
            await query(
                `
                SELECT *
                FROM jogos

                WHERE data_jogo IS NOT NULL

                AND
                (
                    data_jogo AT TIME ZONE $1
                )::date = $2::date

                ORDER BY data_jogo ASC
                `,
                [
                    TIMEZONE,
                    amanha
                ]
            );


        console.log(
            `⚽ ${resultado.rows.length} jogos encontrados para amanhã`
        );


        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro jogos amanhã:",
            erro
        );

        throw erro;
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

                AND
                (
                    data_jogo AT TIME ZONE $1
                )::date
                BETWEEN $2::date
                AND $3::date

                ORDER BY data_jogo ASC
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


        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro jogos disponíveis:",
            erro
        );

        throw erro;
    }
}


// ==================================================
// ALIAS
// ==================================================

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


// ==================================================
// BUSCAR JOGO POR API ID
// ==================================================

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


// ==================================================
// HISTÓRICO REAL
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

                AND
                (
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
            `📚 Histórico ${nomeTime}: ${resultado.rows.length}`
        );


        return resultado.rows;

    } catch (erro) {

        console.error(
            `❌ Erro histórico ${nomeTime}:`,
            erro
        );

        throw erro;
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

    if (
        !timeCasa ||
        !timeFora
    ) {

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

                AND
                (
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
            `⚔️ H2H ${timeCasa} x ${timeFora}: ${resultado.rows.length}`
        );


        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro H2H:",
            erro
        );

        throw erro;
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

                WHERE
                    LOWER(TRIM(jogo))
                    =
                    LOWER(TRIM($1::text))

                ORDER BY id DESC

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
            erro
        );

        throw erro;
    }
}


// ==================================================
// BUSCAR ANÁLISE POR ID
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

                LEFT JOIN jogos j

                    ON LOWER(TRIM(a.jogo))
                    =
                    LOWER(
                        TRIM(
                            COALESCE(j.time_casa, '')
                            ||
                            ' x '
                            ||
                            COALESCE(j.time_fora, '')
                        )
                    )

                WHERE a.id = $1::integer

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
            "❌ Erro buscar análise ID:",
            erro
        );

        throw erro;
    }
}


// ==================================================
// LISTAR ANÁLISES DE HOJE
// ==================================================

export async function listarAnalisesHoje() {

    try {

        const hoje =
            obterDataHojeBrasil();


        console.log(
            "=========================================="
        );

        console.log(
            "🤖 BUSCANDO ANÁLISES DE HOJE"
        );

        console.log(
            `📅 ${hoje}`
        );

        console.log(
            `🌎 ${TIMEZONE}`
        );


        const resultado =
            await query(
                `
                SELECT

                    a.id AS analise_id,

                    a.jogo,

                    a.probabilidade_casa,

                    a.probabilidade_empate,

                    a.probabilidade_fora,

                    a.gols_esperados,

                    a.placar_previsto,

                    a.value_bet,

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

                    ON

                    LOWER(TRIM(a.jogo))
                    =
                    LOWER(
                        TRIM(
                            COALESCE(j.time_casa, '')
                            ||
                            ' x '
                            ||
                            COALESCE(j.time_fora, '')
                        )
                    )

                WHERE

                    j.data_jogo IS NOT NULL

                    AND

                    (
                        j.data_jogo AT TIME ZONE $1
                    )::date = $2::date

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
            `🤖 ${resultado.rows.length} análises encontradas`
        );


        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ ERRO SQL listarAnalisesHoje:"
        );

        console.error(
            erro
        );

        throw erro;
    }
}


// ==================================================
// LISTAR TODAS AS ANÁLISES
// ==================================================

export async function listarAnalises() {

    try {

        const resultado =
            await query(
                `
                SELECT *
                FROM analises
                ORDER BY id DESC
                `
            );


        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ Erro listar análises:",
            erro
        );

        throw erro;
    }
}


// ==================================================
// SALVAR ANÁLISE
//
// TABELA ATUAL:
//
// id
// jogo
// probabilidade_casa
// probabilidade_empate
// probabilidade_fora
// gols_esperados
// placar_previsto
// value_bet
//
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


    const nomeJogo =
        String(
            analise.jogo ??
            ""
        ).trim();


    if (!nomeJogo) {

        throw new Error(
            "Nome do jogo obrigatório"
        );
    }


    // ==================================================
    // PROBABILIDADES
    // ==================================================

    const probabilidadeCasa =
        analise.probabilidade_casa ??
        analise.probabilidades?.casa ??
        null;


    const probabilidadeEmpate =
        analise.probabilidade_empate ??
        analise.probabilidades?.empate ??
        null;


    const probabilidadeFora =
        analise.probabilidade_fora ??
        analise.probabilidades?.fora ??
        null;


    // ==================================================
    // GOLS ESPERADOS
    // ==================================================

    let golsEsperados =
        analise.gols_esperados ??
        analise.golsEsperados ??
        null;


    if (
        golsEsperados &&
        typeof golsEsperados === "object"
    ) {

        if (
            golsEsperados.total !== undefined &&
            golsEsperados.total !== null
        ) {

            golsEsperados =
                Number(
                    golsEsperados.total
                );

        } else {

            const casa =
                Number(
                    golsEsperados.casa ??
                    0
                );


            const fora =
                Number(
                    golsEsperados.fora ??
                    0
                );


            golsEsperados =
                casa + fora;
        }
    }


    if (
        !Number.isFinite(
            Number(golsEsperados)
        )
    ) {

        golsEsperados =
            null;

    } else {

        golsEsperados =
            Number(
                golsEsperados
            );
    }


    // ==================================================
    // VALUE BET
    // ==================================================

    const valorValueBet =
        analise.value_bet ??
        analise.valueBet ??
        false;


    let valueBet =
        false;


    if (
        typeof valorValueBet === "boolean"
    ) {

        valueBet =
            valorValueBet;

    } else if (
        Array.isArray(
            valorValueBet
        )
    ) {

        valueBet =
            valorValueBet.length > 0;

    } else if (
        valorValueBet &&
        typeof valorValueBet === "object"
    ) {

        valueBet =
            true;

    } else if (
        typeof valorValueBet === "string"
    ) {

        valueBet =
            [
                "true",
                "1",
                "sim",
                "yes"
            ].includes(
                valorValueBet
                    .toLowerCase()
                    .trim()
            );
    }


    // ==================================================
    // PLACAR
    // ==================================================

    let placar =
        analise.placar_previsto ??
        analise.placarPrevisto ??
        null;


    if (
        placar &&
        typeof placar === "object"
    ) {

        placar =
            JSON.stringify(
                placar
            );
    }


    // ==================================================
    // VERIFICAR EXISTENTE
    // ==================================================

    const existente =
        await buscarAnalisePorNome(
            nomeJogo
        );


    if (existente) {

        console.log(
            `♻️ Análise já existe: ${nomeJogo}`
        );

        return existente;
    }


    // ==================================================
    // INSERIR
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
                    value_bet
                )

                VALUES
                (
                    $1::text,
                    $2::numeric,
                    $3::numeric,
                    $4::numeric,
                    $5::numeric,
                    $6::text,
                    $7::boolean
                )

                RETURNING *
                `,
                [

                    nomeJogo,

                    probabilidadeCasa,

                    probabilidadeEmpate,

                    probabilidadeFora,

                    golsEsperados,

                    placar,

                    valueBet

                ]
            );


        const salva =
            resultado.rows[0] ||
            null;


        if (salva) {

            console.log(
                "=========================================="
            );

            console.log(
                `💾 ANÁLISE SALVA`
            );

            console.log(
                `🆔 ID: ${salva.id}`
            );

            console.log(
                `⚽ ${salva.jogo}`
            );

            console.log(
                `🏠 ${salva.probabilidade_casa}`
            );

            console.log(
                `🤝 ${salva.probabilidade_empate}`
            );

            console.log(
                `✈️ ${salva.probabilidade_fora}`
            );

            console.log(
                "=========================================="
            );
        }


        return salva;

    } catch (erro) {

        console.error(
            "❌ ERRO SQL SALVAR ANÁLISE:"
        );

        console.error(
            erro
        );

        throw erro;
    }
}


// ==================================================
// ANÁLISES HOJE + AMANHÃ
// ==================================================

export async function listarAnalisesDisponiveis() {

    try {

        const resultado =
            await query(
                `
                SELECT

                    a.id AS analise_id,

                    a.jogo,

                    a.probabilidade_casa,

                    a.probabilidade_empate,

                    a.probabilidade_fora,

                    a.gols_esperados,

                    a.placar_previsto,

                    a.value_bet,

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

                    ON

                    LOWER(TRIM(a.jogo))
                    =
                    LOWER(
                        TRIM(
                            COALESCE(j.time_casa, '')
                            ||
                            ' x '
                            ||
                            COALESCE(j.time_fora, '')
                        )
                    )

                WHERE

                    j.data_jogo IS NOT NULL

                    AND

                    (
                        j.data_jogo AT TIME ZONE $1
                    )::date

                    BETWEEN $2::date
                    AND $3::date

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
            erro
        );

        throw erro;
    }
}


// ==================================================
// BUSCAR ANÁLISE POR API ID
// ==================================================

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
                SELECT

                    a.*,

                    j.id AS jogo_id,

                    j.api_id AS jogo_api_id,

                    j.data_jogo,

                    j.time_casa,

                    j.time_fora,

                    j.campeonato,

                    j.estadio,

                    j.status

                FROM analises a

                INNER JOIN jogos j

                    ON

                    LOWER(TRIM(a.jogo))
                    =
                    LOWER(
                        TRIM(
                            COALESCE(j.time_casa, '')
                            ||
                            ' x '
                            ||
                            COALESCE(j.time_fora, '')
                        )
                    )

                WHERE j.api_id = $1::integer

                ORDER BY a.id DESC

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
            "❌ Erro análise API:",
            erro
        );

        throw erro;
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
        normalizarId(
            jogo_id
        );


    if (!jogoId) {

        throw new Error(
            "jogo_id inválido"
        );
    }


    try {

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

    } catch (erro) {

        console.error(
            "❌ Erro salvar Value Bet:",
            erro
        );

        throw erro;
    }
}


// ==================================================
// VALUE BETS HOJE + AMANHÃ
// ==================================================

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

                    COALESCE(vb.ativo, true)
                    = true

                    AND j.data_jogo IS NOT NULL

                    AND

                    (
                        j.data_jogo AT TIME ZONE $1
                    )::date

                    BETWEEN $2::date
                    AND $3::date

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


        console.log(
            `💰 Value Bets encontradas: ${resultado.rows.length}`
        );


        return resultado.rows;

    } catch (erro) {

        console.error(
            "❌ ERRO SQL VALUE BETS:"
        );

        console.error(
            erro
        );

        throw erro;
    }
}


// ==================================================
// DASHBOARD
//
// Não depende mais obrigatoriamente de
// dashboard_status.
//
// ==================================================

export async function buscarDashboard() {

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
                    )::integer
                    AS campeonatos,

                    (
                        SELECT COUNT(*)
                        FROM times
                    )::integer
                    AS times,

                    (
                        SELECT COUNT(*)
                        FROM jogos
                    )::integer
                    AS jogos_historico,

                    (
                        SELECT COUNT(*)
                        FROM jogos

                        WHERE data_jogo IS NOT NULL

                        AND
                        (
                            data_jogo AT TIME ZONE $1
                        )::date = $2::date

                    )::integer
                    AS jogos_hoje,

                    (
                        SELECT COUNT(*)
                        FROM jogos

                        WHERE data_jogo IS NOT NULL

                        AND
                        (
                            data_jogo AT TIME ZONE $1
                        )::date = $3::date

                    )::integer
                    AS jogos_amanha,

                    (
                        SELECT COUNT(*)
                        FROM analises
                    )::integer
                    AS analises,

                    (
                        SELECT COUNT(*)
                        FROM value_bets
                        WHERE COALESCE(ativo, true) = true
                    )::integer
                    AS valuebets,

                    (
                        SELECT COUNT(*)
                        FROM analises a

                        INNER JOIN jogos j

                            ON LOWER(TRIM(a.jogo))
                            =
                            LOWER(
                                TRIM(
                                    COALESCE(j.time_casa, '')
                                    ||
                                    ' x '
                                    ||
                                    COALESCE(j.time_fora, '')
                                )
                            )

                        WHERE

                            j.data_jogo IS NOT NULL

                            AND
                            (
                                j.data_jogo AT TIME ZONE $1
                            )::date = $2::date

                    )::integer
                    AS analises_hoje

                `,
                [

                    TIMEZONE,

                    hoje,

                    amanha

                ]
            );


        const dados =
            resultado.rows[0] ||
            {};


        return {

            ...dados,

            status:
                "operacional",

            sistema:
                "BetVision AI",

            timezone:
                TIMEZONE,

            data:
                hoje

        };

    } catch (erro) {

        console.error(
            "❌ ERRO SQL DASHBOARD:"
        );

        console.error(
            erro
        );

        throw erro;
    }
}


// ==================================================
// ESTATÍSTICAS BANCO
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

                        AND
                        (
                            data_jogo AT TIME ZONE $1
                        )::date = $2::date

                    ) AS jogos_hoje,

                    (
                        SELECT COUNT(*)
                        FROM jogos

                        WHERE data_jogo IS NOT NULL

                        AND
                        (
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

                        WHERE
                            COALESCE(ativo, true)
                            = true

                    ) AS valuebets_ativas

                `,
                [

                    TIMEZONE,

                    obterDataHojeBrasil(),

                    obterDataAmanhaBrasil()

                ]
            );


        return (
            resultado.rows[0] ||
            null
        );

    } catch (erro) {

        console.error(
            "❌ Erro estatísticas:",
            erro
        );

        throw erro;
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
