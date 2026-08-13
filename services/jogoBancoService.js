// ==================================================
// BETVISION AI
// services/jogoBancoService.js
//
// VERSÃO 10.0
// MOTOR DE BANCO DE JOGOS
// PostgreSQL / NeonDB
//
// RESPONSABILIDADES:
//
// - Salvar jogos recebidos das APIs
// - Atualizar jogos existentes
// - Buscar jogos de hoje
// - Buscar jogos de amanhã
// - Buscar jogos de hoje + amanhã
// - Buscar próximos jogos
// - Manter histórico completo
// - Nunca criar jogos fictícios
// - api_id tratado como INTEGER
// - Evitar duplicidade
// - Compatível com PostgreSQL / NeonDB
// - Fuso oficial: America/Sao_Paulo
//
// REGRA PRINCIPAL:
//
// O BANCO MANTÉM TODO O HISTÓRICO.
//
// O DASHBOARD NÃO DEVE USAR listarJogos()
//
// Para datas:
//
// HOJE:
// [00:00 Brasil, amanhã 00:00 Brasil)
//
// AMANHÃ:
// [00:00 amanhã Brasil, depois de amanhã 00:00 Brasil)
//
// A consulta é convertida para UTC antes
// de consultar o PostgreSQL.
//
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
// OBTER DATA HOJE NO BRASIL
//
// Retorna:
//
// YYYY-MM-DD
//
// Exemplo:
//
// 2026-08-13
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
            "❌ Erro obter data Brasil:",
            erro.message
        );

        return null;

    }

}


// ==================================================
// OBTER DATA AMANHÃ NO BRASIL
// ==================================================

function obterDataAmanhaBrasil() {

    try {

        const hoje =
            obterDataHojeBrasil();

        if (!hoje) {

            return null;

        }

        const [
            ano,
            mes,
            dia
        ] =
            hoje
                .split("-")
                .map(Number);

        const data =
            new Date(
                Date.UTC(
                    ano,
                    mes - 1,
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
            "❌ Erro obter amanhã:",
            erro.message
        );

        return null;

    }

}


// ==================================================
// OBTER DATA DEPOIS DE AMANHÃ
// ==================================================

function obterDataDepoisDeAmanhaBrasil() {

    try {

        const amanha =
            obterDataAmanhaBrasil();

        if (!amanha) {

            return null;

        }

        const [
            ano,
            mes,
            dia
        ] =
            amanha
                .split("-")
                .map(Number);

        const data =
            new Date(
                Date.UTC(
                    ano,
                    mes - 1,
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
            "❌ Erro obter depois de amanhã:",
            erro.message
        );

        return null;

    }

}


// ==================================================
// CONVERTER DATA BRASIL PARA UTC
//
// Brasil:
//
// 2026-08-13 00:00
//
// UTC:
//
// 2026-08-13 03:00
//
// ==================================================

function dataBrasilParaUTC(
    dataBrasil
) {

    if (!dataBrasil) {

        return null;

    }

    try {

        const data =
            new Date(
                `${dataBrasil}T00:00:00-03:00`
            );

        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return null;

        }

        return data;

    }

    catch (erro) {

        console.error(
            "❌ Erro converter data Brasil para UTC:",
            erro.message
        );

        return null;

    }

}


// ==================================================
// OBTER JANELA UTC DE UM DIA
//
// Retorna:
//
// início
// fim
//
// ==================================================

function obterJanelaUTC(
    dataBrasil
) {

    try {

        const inicio =
            dataBrasilParaUTC(
                dataBrasil
            );

        if (!inicio) {

            return null;

        }

        const fim =
            new Date(
                inicio.getTime()
                +
                (
                    24 *
                    60 *
                    60 *
                    1000
                )
            );

        return {

            inicio,

            fim

        };

    }

    catch (erro) {

        console.error(
            "❌ Erro janela UTC:",
            erro.message
        );

        return null;

    }

}


// ==================================================
// FORMATAR UTC
// ==================================================

function formatarUTC(
    data
) {

    if (
        !(data instanceof Date)
    ) {

        return null;

    }

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return null;

    }

    return data.toISOString();

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
// NORMALIZAR ID INTERNO
// ==================================================

function normalizarId(
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
// OBTER NOME DO TIME CASA
// ==================================================

function obterTimeCasa(
    jogo
) {

    return (

        jogo?.time_casa ??
        jogo?.timeCasa ??
        jogo?.casa ??
        jogo?.homeTeam?.name ??
        jogo?.home_team?.name ??
        jogo?.teams?.home?.name ??
        jogo?.fixture?.teams?.home?.name ??
        null

    );

}


// ==================================================
// OBTER NOME DO TIME FORA
// ==================================================

function obterTimeFora(
    jogo
) {

    return (

        jogo?.time_fora ??
        jogo?.timeFora ??
        jogo?.fora ??
        jogo?.awayTeam?.name ??
        jogo?.away_team?.name ??
        jogo?.teams?.away?.name ??
        jogo?.fixture?.teams?.away?.name ??
        null

    );

}


// ==================================================
// OBTER CAMPEONATO
// ==================================================

function obterCampeonato(
    jogo
) {

    return (

        jogo?.campeonato ??
        jogo?.competicao ??
        jogo?.competition?.name ??
        jogo?.league?.name ??
        jogo?.fixture?.league?.name ??
        "Futebol"

    );

}


// ==================================================
// OBTER DATA DO JOGO
// ==================================================

function obterDataJogo(
    jogo
) {

    return (

        jogo?.data_jogo ??
        jogo?.dataJogo ??
        jogo?.utcDate ??
        jogo?.horario ??
        jogo?.data ??
        jogo?.fixture?.date ??
        null

    );

}


// ==================================================
// OBTER ESTÁDIO
// ==================================================

function obterEstadio(
    jogo
) {

    return (

        jogo?.estadio ??
        jogo?.stadium ??
        jogo?.venue?.name ??
        jogo?.venue ??
        null

    );

}


// ==================================================
// OBTER STATUS
// ==================================================

function obterStatus(
    jogo
) {

    if (
        typeof jogo?.status === "object"
        &&
        jogo.status !== null
    ) {

        return (

            jogo.status.short ??
            jogo.status.type ??
            jogo.status.name ??
            "SCHEDULED"

        );

    }

    return (
        jogo?.status ??
        "SCHEDULED"
    );

}


// ==================================================
// NORMALIZAR JOGO
// ==================================================

function normalizarJogo(
    jogo
) {

    if (!jogo) {

        return null;

    }


    const apiId =
        normalizarApiId(

            jogo.api_id ??
            jogo.apiId ??
            jogo.fixture?.id ??
            jogo.id

        );


    const id =
        normalizarId(
            jogo.id
        );


    const timeCasa =
        obterTimeCasa(
            jogo
        );


    const timeFora =
        obterTimeFora(
            jogo
        );


    const campeonato =
        obterCampeonato(
            jogo
        );


    const dataJogo =
        obterDataJogo(
            jogo
        );


    const estadio =
        obterEstadio(
            jogo
        );


    const status =
        obterStatus(
            jogo
        );


    return {

        id,

        api_id:
            apiId,

        campeonato:
            campeonato
                ? String(campeonato).trim()
                : "Futebol",

        time_casa:
            timeCasa
                ? String(timeCasa).trim()
                : null,

        time_fora:
            timeFora
                ? String(timeFora).trim()
                : null,

        data_jogo:
            dataJogo,

        estadio:
            estadio
                ? String(estadio).trim()
                : null,

        status:
            status
                ? String(status).trim()
                : "SCHEDULED"

    };

}


// ==================================================
// VALIDAR DATA
// ==================================================

function dataJogoValida(
    dataJogo
) {

    if (!dataJogo) {

        return false;

    }

    const data =
        new Date(
            dataJogo
        );

    return (
        !Number.isNaN(
            data.getTime()
        )
    );

}


// ==================================================
// VALIDAR JOGO
// ==================================================

function jogoValido(
    jogo
) {

    if (!jogo) {

        return false;

    }


    if (
        !jogo.api_id
    ) {

        return false;

    }


    const casa =
        String(
            jogo.time_casa ??
            ""
        )
        .trim();


    const fora =
        String(
            jogo.time_fora ??
            ""
        )
        .trim();


    if (
        !casa ||
        !fora
    ) {

        return false;

    }


    if (
        casa.toLowerCase() ===
        fora.toLowerCase()
    ) {

        return false;

    }


    const nomesInvalidos = [

        "casa",
        "fora",
        "home",
        "away",
        "home team",
        "away team",
        "time a",
        "time b"

    ];


    if (
        nomesInvalidos.includes(
            casa.toLowerCase()
        )
        ||
        nomesInvalidos.includes(
            fora.toLowerCase()
        )
    ) {

        return false;

    }


    if (
        !dataJogoValida(
            jogo.data_jogo
        )
    ) {

        return false;

    }


    return true;

}


// ==================================================
// BUSCAR JOGO POR API ID
// ==================================================

export async function buscarJogoPorApiId(
    apiId
) {

    const id =
        normalizarApiId(
            apiId
        );

    if (!id) {

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
                    id
                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(

            `❌ Erro buscar jogo API ${id}:`,
            erro.message

        );

        return null;

    }

}


// ==================================================
// SALVAR JOGO
//
// UPDATE se já existir.
// INSERT se não existir.
//
// ==================================================

export async function salvarJogo(
    jogo
) {

    const normalizado =
        normalizarJogo(
            jogo
        );


    if (
        !jogoValido(
            normalizado
        )
    ) {

        console.log(
            "⚠️ Jogo inválido ignorado"
        );

        return null;

    }


    const existente =
        await buscarJogoPorApiId(
            normalizado.api_id
        );


    // ==================================================
    // UPDATE
    // ==================================================

    if (
        existente
    ) {

        try {

            const resultado =
                await query(

                    `
                    UPDATE jogos

                    SET

                        campeonato = $1::text,

                        time_casa = $2::text,

                        time_fora = $3::text,

                        data_jogo = $4,

                        estadio = $5::text,

                        status = $6::text

                    WHERE
                        api_id = $7::integer

                    RETURNING *
                    `,

                    [

                        normalizado.campeonato,

                        normalizado.time_casa,

                        normalizado.time_fora,

                        normalizado.data_jogo,

                        normalizado.estadio,

                        normalizado.status,

                        normalizado.api_id

                    ]

                );


            console.log(

                `🔄 Jogo atualizado: ` +
                `${normalizado.time_casa} x ` +
                `${normalizado.time_fora} ` +
                `(API ${normalizado.api_id})`

            );


            return (
                resultado.rows[0] ||
                existente
            );

        }

        catch (erro) {

            console.error(

                `❌ Erro atualizar jogo ${normalizado.api_id}:`,
                erro.message

            );

            throw erro;

        }

    }


    // ==================================================
    // INSERT
    // ==================================================

    try {

        const resultado =
            await query(

                `
                INSERT INTO jogos
                (
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
                    $1::integer,
                    $2::text,
                    $3::text,
                    $4::text,
                    $5,
                    $6::text,
                    $7::text
                )

                RETURNING *
                `,

                [

                    normalizado.api_id,

                    normalizado.campeonato,

                    normalizado.time_casa,

                    normalizado.time_fora,

                    normalizado.data_jogo,

                    normalizado.estadio,

                    normalizado.status

                ]

            );


        console.log(

            `💾 Jogo salvo: ` +
            `${normalizado.time_casa} x ` +
            `${normalizado.time_fora} ` +
            `(API ${normalizado.api_id})`

        );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        // ==============================================
        // DUPLICIDADE
        // ==============================================

        if (
            erro?.code === "23505"
        ) {

            const recuperado =
                await buscarJogoPorApiId(
                    normalizado.api_id
                );


            if (
                recuperado
            ) {

                console.log(

                    `ℹ️ Jogo já existia: ` +
                    `${normalizado.api_id}`

                );


                return recuperado;

            }

        }


        console.error(

            `❌ Erro inserir jogo ${normalizado.api_id}:`,
            erro.message

        );


        throw erro;

    }

}


// ==================================================
// SALVAR LISTA DE JOGOS
// ==================================================

export async function salvarListaJogos(
    jogos = []
) {

    if (
        !Array.isArray(jogos)
    ) {

        return [];

    }


    const salvos = [];


    for (
        const jogo of jogos
    ) {

        try {

            const salvo =
                await salvarJogo(
                    jogo
                );


            if (
                salvo
            ) {

                salvos.push(
                    salvo
                );

            }

        }

        catch (erro) {

            console.error(

                "❌ Erro salvar jogo da lista:",
                erro.message

            );

        }

    }


    console.log(

        `💾 ${salvos.length} jogos salvos/atualizados`

    );


    return salvos;

}


// ==================================================
// BUSCAR JOGOS DE HOJE
//
// SOMENTE CALENDÁRIO BRASILEIRO DE HOJE
// ==================================================

export async function buscarJogosDoDia() {

    try {

        const hoje =
            obterDataHojeBrasil();


        const janela =
            obterJanelaUTC(
                hoje
            );


        if (
            !janela
        ) {

            return [];

        }


        const inicio =
            formatarUTC(
                janela.inicio
            );


        const fim =
            formatarUTC(
                janela.fim
            );


        console.log(
            `📅 Buscando jogos de hoje: ${hoje}`
        );


        console.log(
            `🕐 Janela UTC: ${inicio} até ${fim}`
        );


        const resultado =
            await query(

                `
                SELECT *

                FROM jogos

                WHERE
                    data_jogo IS NOT NULL

                    AND

                    data_jogo >= $1

                    AND

                    data_jogo < $2

                ORDER BY
                    data_jogo ASC
                `,

                [
                    inicio,
                    fim
                ]

            );


        console.log(

            `⚽ ${resultado.rows.length} jogos de hoje retornados`

        );


        return resultado.rows;

    }

    catch (erro) {

        console.error(

            "❌ Erro buscar jogos de hoje:",
            erro.message

        );

        return [];

    }

}


// ==================================================
// BUSCAR JOGOS DE AMANHÃ
// ==================================================

export async function buscarJogosAmanha() {

    try {

        const amanha =
            obterDataAmanhaBrasil();


        const janela =
            obterJanelaUTC(
                amanha
            );


        if (
            !janela
        ) {

            return [];

        }


        const inicio =
            formatarUTC(
                janela.inicio
            );


        const fim =
            formatarUTC(
                janela.fim
            );


        console.log(
            `📅 Buscando jogos de amanhã: ${amanha}`
        );


        const resultado =
            await query(

                `
                SELECT *

                FROM jogos

                WHERE
                    data_jogo IS NOT NULL

                    AND

                    data_jogo >= $1

                    AND

                    data_jogo < $2

                ORDER BY
                    data_jogo ASC
                `,

                [
                    inicio,
                    fim
                ]

            );


        console.log(

            `⚽ ${resultado.rows.length} jogos de amanhã retornados`

        );


        return resultado.rows;

    }

    catch (erro) {

        console.error(

            "❌ Erro buscar jogos amanhã:",
            erro.message

        );

        return [];

    }

}


// ==================================================
// BUSCAR HOJE + AMANHÃ
// ==================================================

export async function buscarJogosDisponiveis() {

    try {

        const hoje =
            obterDataHojeBrasil();


        const amanha =
            obterDataAmanhaBrasil();


        const janelaHoje =
            obterJanelaUTC(
                hoje
            );


        const janelaAmanha =
            obterJanelaUTC(
                amanha
            );


        if (
            !janelaHoje ||
            !janelaAmanha
        ) {

            return [];

        }


        const inicio =
            formatarUTC(
                janelaHoje.inicio
            );


        const fim =
            formatarUTC(
                janelaAmanha.fim
            );


        const resultado =
            await query(

                `
                SELECT *

                FROM jogos

                WHERE
                    data_jogo IS NOT NULL

                    AND

                    data_jogo >= $1

                    AND

                    data_jogo < $2

                ORDER BY
                    data_jogo ASC
                `,

                [
                    inicio,
                    fim
                ]

            );


        console.log(

            `⚽ ${resultado.rows.length} jogos disponíveis: hoje + amanhã`

        );


        return resultado.rows;

    }

    catch (erro) {

        console.error(

            "❌ Erro buscar jogos disponíveis:",
            erro.message

        );

        return [];

    }

}


// ==================================================
// ALIAS
// ==================================================

export async function buscarJogosHojeEAmanha() {

    return await buscarJogosDisponiveis();

}


// ==================================================
// LISTAR TODO O HISTÓRICO
//
// ATENÇÃO:
// Não usar no dashboard principal.
// ==================================================

export async function listarJogos() {

    try {

        const resultado =
            await query(

                `
                SELECT *

                FROM jogos

                ORDER BY
                    data_jogo DESC NULLS LAST,
                    id DESC
                `

            );


        return resultado.rows;

    }

    catch (erro) {

        console.error(

            "❌ Erro listar histórico:",
            erro.message

        );

        return [];

    }

}


// ==================================================
// BUSCAR PRÓXIMOS JOGOS
//
// Restante de hoje
// +
// amanhã
//
// Não retorna datas depois de amanhã.
//
// ==================================================

export async function buscarProximosJogos(
    limite = 20
) {

    let quantidade =
        Number(
            limite
        );


    if (
        !Number.isInteger(
            quantidade
        )
        ||
        quantidade < 1
    ) {

        quantidade = 20;

    }


    if (
        quantidade > 100
    ) {

        quantidade = 100;

    }


    try {

        const amanha =
            obterDataAmanhaBrasil();


        const janelaAmanha =
            obterJanelaUTC(
                amanha
            );


        if (
            !janelaAmanha
        ) {

            return [];

        }


        const agora =
            new Date();


        const inicio =
            formatarUTC(
                agora
            );


        const fim =
            formatarUTC(
                janelaAmanha.fim
            );


        const resultado =
            await query(

                `
                SELECT *

                FROM jogos

                WHERE

                    data_jogo IS NOT NULL

                    AND

                    data_jogo >= $1

                    AND

                    data_jogo < $2

                ORDER BY
                    data_jogo ASC

                LIMIT $3::integer
                `,

                [
                    inicio,
                    fim,
                    quantidade
                ]

            );


        return resultado.rows;

    }

    catch (erro) {

        console.error(

            "❌ Erro buscar próximos jogos:",
            erro.message

        );

        return [];

    }

}


// ==================================================
// ESTATÍSTICAS
// ==================================================

export async function estatisticasJogos() {

    try {

        const hoje =
            obterDataHojeBrasil();


        const amanha =
            obterDataAmanhaBrasil();


        const janelaHoje =
            obterJanelaUTC(
                hoje
            );


        const janelaAmanha =
            obterJanelaUTC(
                amanha
            );


        if (
            !janelaHoje ||
            !janelaAmanha
        ) {

            return null;

        }


        const inicioHoje =
            formatarUTC(
                janelaHoje.inicio
            );


        const fimHoje =
            formatarUTC(
                janelaHoje.fim
            );


        const inicioAmanha =
            formatarUTC(
                janelaAmanha.inicio
            );


        const fimAmanha =
            formatarUTC(
                janelaAmanha.fim
            );


        const resultado =
            await query(

                `
                SELECT

                    (
                        SELECT COUNT(*)
                        FROM jogos
                    ) AS total_historico,


                    (
                        SELECT COUNT(*)
                        FROM jogos

                        WHERE
                            data_jogo IS NOT NULL
                            AND data_jogo >= $1
                            AND data_jogo < $2

                    ) AS hoje,


                    (
                        SELECT COUNT(*)
                        FROM jogos

                        WHERE
                            data_jogo IS NOT NULL
                            AND data_jogo >= $3
                            AND data_jogo < $4

                    ) AS amanha,


                    (
                        SELECT COUNT(*)
                        FROM jogos

                        WHERE
                            data_jogo IS NOT NULL
                            AND data_jogo >= $1
                            AND data_jogo < $4

                    ) AS disponiveis

                `,

                [

                    inicioHoje,
                    fimHoje,
                    inicioAmanha,
                    fimAmanha

                ]

            );


        return (
            resultado.rows[0] ||
            null
        );

    }

    catch (erro) {

        console.error(

            "❌ Erro estatísticas:",
            erro.message

        );

        return null;

    }

}


// ==================================================
// ENCONTRAR JOGOS INVÁLIDOS
//
// NÃO APAGA.
//
// ==================================================

export async function encontrarJogosInvalidos() {

    try {

        const resultado =
            await query(

                `
                SELECT *

                FROM jogos

                WHERE

                    api_id IS NULL

                    OR

                    time_casa IS NULL

                    OR

                    time_fora IS NULL

                    OR

                    data_jogo IS NULL

                    OR

                    TRIM(
                        time_casa
                    ) = ''

                    OR

                    TRIM(
                        time_fora
                    ) = ''

                ORDER BY
                    id DESC
                `

            );


        return resultado.rows;

    }

    catch (erro) {

        console.error(

            "❌ Erro verificar jogos inválidos:",
            erro.message

        );

        return [];

    }

}


// ==================================================
// EXPORT DEFAULT
// ==================================================

export default {

    buscarJogoPorApiId,

    salvarJogo,

    salvarListaJogos,

    buscarJogosDoDia,

    buscarJogosAmanha,

    buscarJogosDisponiveis,

    buscarJogosHojeEAmanha,

    listarJogos,

    buscarProximosJogos,

    estatisticasJogos,

    encontrarJogosInvalidos

};
