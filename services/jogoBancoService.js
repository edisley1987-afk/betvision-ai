// ==================================================
// BETVISION AI
// services/jogoBancoService.js
//
// Versão 8.0
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
// REGRA PRINCIPAL:
//
// O banco mantém todo o histórico.
//
// A aplicação exibe somente:
//
// HOJE
// +
// AMANHÃ
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

                    api_id =
                    $1::integer

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
// Se o jogo já existe:
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
            `${normalizado.time_fora}`

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
// ==================================================

export async function buscarJogosDoDia() {

    try {

        const dataHoje =
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

                    dataHoje

                ]

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

                    dataAmanha

                ]

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
// ESTE É O PRINCIPAL MÉTODO PARA O FRONTEND.
// ==================================================

export async function buscarJogosDisponiveis() {

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
// ATENÇÃO:
//
// Este método é SOMENTE para histórico/admin.
//
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

            "❌ Erro listar histórico de jogos:",

            erro.message

        );

        return [];

    }

}


// ==================================================
// PRÓXIMOS JOGOS
//
// Agora "próximos" significa:
//
// restante de hoje
// +
// amanhã
//
// Não retorna jogos de datas futuras além de amanhã.
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

                    AND

                    data_jogo >=
                    CURRENT_TIMESTAMP

                ORDER BY

                    data_jogo ASC

                LIMIT $4::integer

                `,

                [

                    TIMEZONE,

                    hoje,

                    amanha,

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

                            (

                                data_jogo
                                AT TIME ZONE
                                $1

                            )::date

                            =

                            $2::date

                    ) AS hoje,


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

                    ) AS amanha,


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

                            BETWEEN

                            $2::date

                            AND

                            $3::date

                    ) AS disponiveis

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

            "❌ Erro estatísticas jogos:",

            erro.message

        );

        return null;

    }

}


// ==================================================
// REMOVER JOGOS FICTÍCIOS
//
// NÃO APAGA histórico real.
//
// Esta função NÃO é executada automaticamente.
//
// Serve apenas para manutenção caso existam
// registros obviamente inválidos.
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

                ORDER BY id DESC

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
