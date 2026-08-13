// ==================================================
// BETVISION AI
// services/jogoBancoService.js
//
// Versão 9.0
// Motor Estatístico v6
// PostgreSQL / NeonDB
//
// RESPONSABILIDADES:
//
// - Salvar jogos recebidos da API
// - Atualizar jogos existentes
// - Buscar jogos de hoje
// - Buscar jogos de amanhã
// - Buscar jogos de hoje + amanhã
// - Manter histórico completo no banco
// - Nunca criar jogos fictícios
// - api_id tratado como INTEGER
// - Compatível com NeonDB
// - Timezone: America/Sao_Paulo
//
// CORREÇÃO PRINCIPAL:
//
// O banco mantém todo o histórico.
//
// A aplicação exibe:
//
// HOJE
// +
// AMANHÃ
//
// A consulta de data NÃO usa mais:
//
// data_jogo AT TIME ZONE America/Sao_Paulo
//
// diretamente sobre a coluna.
//
// Em vez disso, calculamos a janela UTC
// correspondente ao calendário de São Paulo.
//
// Isso evita o problema:
//
// "1 jogo salvo"
// +
// "0 jogos de hoje retornados"
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
// DATA HOJE — BRASIL
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
            "❌ Erro data Brasil:",
            erro.message
        );

        return null;

    }

}


// ==================================================
// DATA AMANHÃ — BRASIL
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
            .substring(
                0,
                10
            );

    }

    catch (erro) {

        console.error(
            "❌ Erro data amanhã:",
            erro.message
        );

        return null;

    }

}


// ==================================================
// CONVERTER DATA BRASIL PARA UTC
//
// America/Sao_Paulo em 2026:
//
// UTC-03:00
//
// Exemplo:
//
// 2026-08-13 00:00 Brasil
// =
// 2026-08-13 03:00 UTC
//
// ==================================================

function dataBrasilParaUTC(
    dataBrasil
) {

    if (!dataBrasil) {

        return null;

    }

    try {

        return new Date(
            `${dataBrasil}T00:00:00-03:00`
        );

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
// OBTER JANELA DE UM DIA
//
// Retorna:
//
// início UTC
// fim UTC
//
// Exemplo:
//
// Brasil:
// 2026-08-13 00:00
// até
// 2026-08-14 00:00
//
// UTC:
// 2026-08-13 03:00
// até
// 2026-08-14 03:00
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
// FORMATAR DATA PARA POSTGRES
//
// Retorna uma string UTC sem ambiguidade.
//
// Exemplo:
//
// 2026-08-13T03:00:00.000Z
//
// ==================================================

function formatarUTC(
    data
) {

    if (!(data instanceof Date)) {

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
// NORMALIZAR ID
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
            jogo.id

        );


    const id =
        normalizarId(
            jogo.id
        );


    const timeCasa =

        jogo.time_casa ??
        jogo.timeCasa ??
        jogo.casa ??
        jogo.homeTeam?.name ??
        jogo.home_team?.name ??
        null;


    const timeFora =

        jogo.time_fora ??
        jogo.timeFora ??
        jogo.fora ??
        jogo.awayTeam?.name ??
        jogo.away_team?.name ??
        null;


    const campeonato =

        jogo.campeonato ??
        jogo.competicao ??
        jogo.competition?.name ??
        "Futebol";


    const dataJogo =

        jogo.data_jogo ??
        jogo.dataJogo ??
        jogo.utcDate ??
        jogo.horario ??
        jogo.data ??
        null;


    const estadio =

        jogo.estadio ??
        jogo.stadium ??
        jogo.venue ??
        null;


    const status =

        jogo.status ??
        "SCHEDULED";


    return {

        id,

        api_id:
            apiId,

        campeonato,

        time_casa:
            timeCasa,

        time_fora:
            timeFora,

        data_jogo:
            dataJogo,

        estadio,

        status

    };

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
        !jogo.data_jogo
    ) {

        return false;

    }


    return true;

}


// ==================================================
// BUSCAR JOGO PELO API ID
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

                WHERE
                    api_id = $1::integer

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
// Se já existe:
// UPDATE
//
// Se não existe:
// INSERT
//
// Nunca cria jogo fictício.
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
    // ATUALIZAR
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

                        campeonato =
                            $1::text,

                        time_casa =
                            $2::text,

                        time_fora =
                            $3::text,

                        data_jogo =
                            $4,

                        estadio =
                            $5::text,

                        status =
                            $6::text

                    WHERE
                        api_id =
                        $7::integer

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

                `❌ Erro atualizar jogo ` +
                `${normalizado.api_id}:`,

                erro.message

            );

            throw erro;

        }

    }


    // ==================================================
    // INSERIR NOVO JOGO
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

        // ==================================================
        // POSSÍVEL DUPLICIDADE
        // ==================================================

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

                return recuperado;

            }

        }


        console.error(

            `❌ Erro inserir jogo ` +
            `${normalizado.api_id}:`,

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

        `💾 ${salvos.length} jogos ` +
        `salvos/atualizados`

    );


    return salvos;

}


// ==================================================
// BUSCAR JOGOS DE HOJE
//
// CORREÇÃO:
//
// Não usamos:
//
// data_jogo AT TIME ZONE $1
//
// A consulta usa uma janela UTC.
//
// Isso funciona corretamente quando a API
// fornece utcDate e o banco armazena esse
// instante em UTC.
// ==================================================

export async function buscarJogosDoDia() {

    try {

        const dataHoje =
            obterDataHojeBrasil();


        const janela =
            obterJanelaUTC(
                dataHoje
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
            `📅 Buscando jogos de hoje: ${dataHoje}`
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

            `⚽ ${resultado.rows.length} ` +
            `jogos de hoje retornados`

        );


        return resultado.rows;

    }

    catch (erro) {

        console.error(

            "❌ Erro buscar jogos do dia:",

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

        const dataAmanha =
            obterDataAmanhaBrasil();


        const janela =
            obterJanelaUTC(
                dataAmanha
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
            `📅 Buscando jogos de amanhã: ${dataAmanha}`
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

            `⚽ ${resultado.rows.length} ` +
            `jogos de amanhã retornados`

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
// BUSCAR JOGOS HOJE + AMANHÃ
//
// PRINCIPAL MÉTODO PARA O FRONTEND
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

            `⚽ ${resultado.rows.length} ` +
            `jogos disponíveis: hoje + amanhã`

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
//
// Compatibilidade com código anterior.
// ==================================================

export async function buscarJogosHojeEAmanha() {

    return await buscarJogosDisponiveis();

}


// ==================================================
// LISTAR TODOS OS JOGOS
//
// SOMENTE HISTÓRICO / ADMIN
//
// NÃO usar no dashboard principal.
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

            "❌ Erro listar histórico de jogos:",

            erro.message

        );

        return [];

    }

}


// ==================================================
// PRÓXIMOS JOGOS
//
// Restante de hoje
// +
// amanhã
//
// Não retorna datas além de amanhã.
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


        const agoraUTC =
            new Date();


        const agora =
            formatarUTC(
                agoraUTC
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

                    agora,

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
// ESTATÍSTICAS DOS JOGOS
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


        const inicioDisponiveis =
            inicioHoje;


        const fimDisponiveis =
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

                            AND

                            data_jogo >= $1

                            AND

                            data_jogo < $2

                    ) AS hoje,


                    (

                        SELECT COUNT(*)

                        FROM jogos

                        WHERE

                            data_jogo IS NOT NULL

                            AND

                            data_jogo >= $3

                            AND

                            data_jogo < $4

                    ) AS amanha,


                    (

                        SELECT COUNT(*)

                        FROM jogos

                        WHERE

                            data_jogo IS NOT NULL

                            AND

                            data_jogo >= $5

                            AND

                            data_jogo < $6

                    ) AS disponiveis

                `,

                [

                    inicioHoje,

                    fimHoje,

                    inicioAmanha,

                    fimAmanha,

                    inicioDisponiveis,

                    fimDisponiveis

                ]

            );


        return (

            resultado.rows[0] ||
            null

        );

    }

    catch (erro) {

        console.error(

            "❌ Erro estatísticas jogos:",

            erro.message

        );

        return null;

    }

}


// ==================================================
// ENCONTRAR JOGOS INVÁLIDOS
//
// NÃO APAGA AUTOMATICAMENTE.
//
// Serve apenas para manutenção.
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
