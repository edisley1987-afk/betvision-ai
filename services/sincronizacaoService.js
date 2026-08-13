// ==================================================
// BETVISION AI
// services/sincronizacaoService.js
//
// MOTOR ESTATÍSTICO v6
//
// Neon PostgreSQL + Football-Data.org v4
//
// RESPONSABILIDADES:
//
// - Sincronizar campeonatos
// - Sincronizar jogos
// - Buscar somente jogos de HOJE + AMANHÃ
// - America/Sao_Paulo
// - Evitar jogos antigos
// - Evitar duplicação
// - Atualizar jogos existentes
// - Preparar dados para o Motor Estatístico v6
// - Agendamento automático
//
// ==================================================

import axios from "axios";
import cron from "node-cron";

import {
    query
} from "../database/database.js";


// ==================================================
// CONFIGURAÇÃO
// ==================================================

const TIMEZONE =
    "America/Sao_Paulo";


const API_URL =
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";


const API_KEY =
    process.env.API_FOOTBALL_KEY;


// ==================================================
// LIMITES
// ==================================================

const LIMITE_CAMPEONATOS =
    1000;


const LIMITE_JOGOS =
    500;


// ==================================================
// DATA ATUAL EM SÃO PAULO
// ==================================================

function obterDataBrasil() {

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

}


// ==================================================
// DATA DE AMANHÃ
// ==================================================

function obterDataAmanha() {

    const agora =
        new Date();


    const partes =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: TIMEZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).formatToParts(
            agora
        );


    let ano = "";
    let mes = "";
    let dia = "";


    for (
        const parte of partes
    ) {

        if (
            parte.type === "year"
        ) {

            ano = parte.value;

        }

        if (
            parte.type === "month"
        ) {

            mes = parte.value;

        }

        if (
            parte.type === "day"
        ) {

            dia = parte.value;

        }

    }


    const data =
        new Date(
            `${ano}-${mes}-${dia}T12:00:00`
        );


    data.setDate(
        data.getDate() + 1
    );


    return (
        data
            .toISOString()
            .substring(0, 10)
    );

}


// ==================================================
// JANELA DE JOGOS
// ==================================================

function obterJanelaJogos() {

    const hoje =
        obterDataBrasil();

    const amanha =
        obterDataAmanha();


    return {

        hoje,

        amanha

    };

}


// ==================================================
// VERIFICAR API
// ==================================================

function apiDisponivel() {

    if (!API_KEY) {

        console.log(
            "⚠️ API_FOOTBALL_KEY não configurada"
        );

        return false;

    }

    return true;

}


// ==================================================
// HEADERS
// ==================================================

function headersAPI() {

    return {

        "X-Auth-Token":
            API_KEY,

        "Accept":
            "application/json"

    };

}


// ==================================================
// BUSCAR CAMPEONATOS NA API
// ==================================================

export async function buscarCampeonatosAPI() {

    try {

        if (
            !apiDisponivel()
        ) {

            return [];

        }


        console.log(
            "🌍 Consultando campeonatos Football-Data..."
        );


        const resposta =
            await axios.get(

                `${API_URL}/competitions`,

                {

                    headers:
                        headersAPI(),

                    timeout:
                        15000

                }

            );


        const competicoes =
            resposta
                .data
                ?.competitions ||
            [];


        console.log(
            `🌍 ${competicoes.length} campeonatos recebidos`
        );


        return competicoes;

    }

    catch (error) {

        console.error(
            "❌ Erro buscar campeonatos:",
            error.response?.data ||
            error.message
        );


        return [];

    }

}


// ==================================================
// NORMALIZAR CAMPEONATO
// ==================================================

function normalizarCampeonato(
    campeonato
) {

    if (
        !campeonato
    ) {

        return null;

    }


    const apiId =
        Number(
            campeonato.id
        );


    if (
        !Number.isFinite(apiId)
        ||
        apiId <= 0
    ) {

        return null;

    }


    return {

        api_id:
            apiId,

        nome:
            campeonato.name ||
            "Desconhecido",

        pais:
            campeonato.area?.name ||
            "Internacional",

        continente:
            campeonato.area?.code ||
            null,

        temporada:
            campeonato
                .currentSeason
                ?.startDate
                ?.substring(
                    0,
                    4
                ) ||
            null,

        logo:
            campeonato.emblem ||
            null,

        ativo:
            true

    };

}


// ==================================================
// PRÓXIMO ID CAMPEONATO
// ==================================================

async function obterProximoId() {

    const resultado =
        await query(
            `
            SELECT
                COALESCE(
                    MAX(id),
                    0
                ) + 1 AS proximo_id

            FROM campeonatos
            `
        );


    return Number(
        resultado
            .rows[0]
            ?.proximo_id ||
        1
    );

}


// ==================================================
// SALVAR CAMPEONATO
// ==================================================

async function salvarCampeonato(
    campeonato
) {

    try {

        if (
            !campeonato
            ||
            !campeonato.api_id
        ) {

            return null;

        }


        const existente =
            await query(
                `
                SELECT
                    id

                FROM campeonatos

                WHERE api_id = $1

                LIMIT 1
                `,
                [
                    campeonato.api_id
                ]
            );


        if (
            existente.rows.length
            > 0
        ) {

            const id =
                existente
                    .rows[0]
                    .id;


            const resultado =
                await query(
                    `
                    UPDATE campeonatos

                    SET

                        nome = $1,

                        pais = $2,

                        continente = $3,

                        temporada = $4,

                        logo = $5,

                        ativo = $6

                    WHERE id = $7

                    RETURNING *
                    `,
                    [

                        campeonato.nome,

                        campeonato.pais,

                        campeonato.continente,

                        campeonato.temporada,

                        campeonato.logo,

                        campeonato.ativo,

                        id

                    ]
                );


            return (
                resultado
                    .rows[0] ||
                null
            );

        }


        const novoId =
            await obterProximoId();


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
                    $1,
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

                    novoId,

                    campeonato.nome,

                    campeonato.pais,

                    campeonato.continente,

                    campeonato.temporada,

                    campeonato.api_id,

                    campeonato.logo,

                    campeonato.ativo

                ]
            );


        return (
            resultado
                .rows[0] ||
            null
        );

    }

    catch (error) {

        console.error(
            `❌ Erro salvar campeonato ${campeonato?.nome || ""}:`,
            error.message
        );


        return null;

    }

}


// ==================================================
// SINCRONIZAR CAMPEONATOS
// ==================================================

export async function sincronizarCampeonatos() {

    console.log(
        "=============================================="
    );

    console.log(
        "🌍 SINCRONIZAÇÃO DE CAMPEONATOS"
    );

    console.log(
        "=============================================="
    );


    const lista =
        await buscarCampeonatosAPI();


    if (
        !lista.length
    ) {

        return {

            sucesso:
                false,

            total:
                0,

            erros:
                0,

            mensagem:
                "Nenhum campeonato recebido"

        };

    }


    let salvos = 0;
    let erros = 0;


    for (
        const item of lista
    ) {

        try {

            const campeonato =
                normalizarCampeonato(
                    item
                );


            if (
                !campeonato
            ) {

                erros++;

                continue;

            }


            const salvo =
                await salvarCampeonato(
                    campeonato
                );


            if (
                salvo
            ) {

                salvos++;

            }
            else {

                erros++;

            }

        }

        catch (error) {

            erros++;

            console.error(
                "❌ Erro campeonato:",
                error.message
            );

        }

    }


    console.log(
        `🏆 Campeonatos processados: ${salvos}`
    );


    console.log(
        `⚠️ Erros: ${erros}`
    );


    return {

        sucesso:
            true,

        total:
            salvos,

        erros

    };

}


// ==================================================
// BUSCAR JOGOS DE HOJE + AMANHÃ
// ==================================================

export async function buscarJogosAPI() {

    try {

        if (
            !apiDisponivel()
        ) {

            return [];

        }


        const {
            hoje,
            amanha
        } =
            obterJanelaJogos();


        console.log(
            `⚽ Buscando jogos: ${hoje} + ${amanha}`
        );


        const datas = [
            hoje,
            amanha
        ];


        const jogos = [];


        for (
            const data of datas
        ) {

            try {

                const resposta =
                    await axios.get(

                        `${API_URL}/matches`,

                        {

                            params: {

                                dateFrom:
                                    data,

                                dateTo:
                                    data

                            },

                            headers:
                                headersAPI(),

                            timeout:
                                15000

                        }

                    );


                const lista =
                    resposta
                        .data
                        ?.matches ||
                    [];


                console.log(
                    `⚽ ${data}: ${lista.length} jogos`
                );


                jogos.push(
                    ...lista
                );

            }

            catch (error) {

                console.error(
                    `❌ Erro jogos ${data}:`,
                    error.response?.data ||
                    error.message
                );

            }

        }


        return jogos
            .slice(
                0,
                LIMITE_JOGOS
            );

    }

    catch (error) {

        console.error(
            "❌ Erro buscar jogos:",
            error.message
        );


        return [];

    }

}


// ==================================================
// NORMALIZAR JOGO
// ==================================================

function normalizarJogo(
    jogo
) {

    if (
        !jogo
    ) {

        return null;

    }


    const apiId =
        Number(
            jogo.id
        );


    if (
        !Number.isFinite(apiId)
        ||
        apiId <= 0
    ) {

        return null;

    }


    const dataJogo =
        jogo.utcDate ||
        null;


    if (
        !dataJogo
    ) {

        return null;

    }


    return {

        api_id:
            apiId,

        time_casa:
            jogo.homeTeam?.name ||
            "Desconhecido",

        time_fora:
            jogo.awayTeam?.name ||
            "Desconhecido",

        data_jogo:
            dataJogo,

        campeonato:
            jogo.competition?.name ||
            "Desconhecido",

        campeonato_api_id:
            Number(
                jogo.competition?.id
            ) ||
            null,

        estadio:
            jogo.venue ||
            null,

        status:
            jogo.status ||
            "SCHEDULED",

        gols_casa:
            Number.isFinite(
                Number(
                    jogo.score
                        ?.fullTime
                        ?.home
                )
            )
                ? Number(
                    jogo.score
                        .fullTime
                        .home
                )
                : null,

        gols_fora:
            Number.isFinite(
                Number(
                    jogo.score
                        ?.fullTime
                        ?.away
                )
            )
                ? Number(
                    jogo.score
                        .fullTime
                        .away
                )
                : null

    };

}


// ==================================================
// VERIFICAR SE JOGO É HOJE OU AMANHÃ
// ==================================================

function jogoDentroDaJanela(
    dataJogo
) {

    if (
        !dataJogo
    ) {

        return false;

    }


    const data =
        new Date(
            dataJogo
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return false;

    }


    const dataBrasil =
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
        ).format(
            data
        );


    const {
        hoje,
        amanha
    } =
        obterJanelaJogos();


    return (
        dataBrasil === hoje
        ||
        dataBrasil === amanha
    );

}


// ==================================================
// SALVAR JOGO
//
// Usa api_id quando disponível.
//
// Caso a tabela jogos não tenha api_id,
// tenta localizar pelo confronto + data.
// ==================================================

async function salvarJogo(
    jogo
) {

    try {

        if (
            !jogo
        ) {

            return null;

        }


        // ==========================================
        // PROCURAR PELO API ID
        // ==========================================

        let existente =
            await query(
                `
                SELECT
                    id

                FROM jogos

                WHERE api_id = $1

                LIMIT 1
                `,
                [
                    jogo.api_id
                ]
            );


        // ==========================================
        // FALLBACK
        // ==========================================

        if (
            existente.rows.length
            === 0
        ) {

            existente =
                await query(
                    `
                    SELECT
                        id

                    FROM jogos

                    WHERE

                        LOWER(time_casa)
                        =
                        LOWER($1)

                        AND

                        LOWER(time_fora)
                        =
                        LOWER($2)

                        AND

                        DATE(data_jogo)
                        =
                        DATE($3::timestamptz)

                    LIMIT 1
                    `,
                    [

                        jogo.time_casa,

                        jogo.time_fora,

                        jogo.data_jogo

                    ]
                );

        }


        // ==========================================
        // ATUALIZAR
        // ==========================================

        if (
            existente.rows.length
            > 0
        ) {

            const id =
                existente
                    .rows[0]
                    .id;


            const resultado =
                await query(
                    `
                    UPDATE jogos

                    SET

                        time_casa = $1,

                        time_fora = $2,

                        data_jogo = $3,

                        campeonato = $4,

                        estadio = $5,

                        status = $6,

                        gols_casa = $7,

                        gols_fora = $8,

                        api_id = $9

                    WHERE id = $10

                    RETURNING *
                    `,
                    [

                        jogo.time_casa,

                        jogo.time_fora,

                        jogo.data_jogo,

                        jogo.campeonato,

                        jogo.estadio,

                        jogo.status,

                        jogo.gols_casa,

                        jogo.gols_fora,

                        jogo.api_id,

                        id

                    ]
                );


            return (
                resultado
                    .rows[0] ||
                null
            );

        }


        // ==========================================
        // INSERIR NOVO
        // ==========================================

        const resultado =
            await query(
                `
                INSERT INTO jogos
                (
                    api_id,
                    time_casa,
                    time_fora,
                    data_jogo,
                    campeonato,
                    estadio,
                    status,
                    gols_casa,
                    gols_fora
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9
                )

                RETURNING *
                `,
                [

                    jogo.api_id,

                    jogo.time_casa,

                    jogo.time_fora,

                    jogo.data_jogo,

                    jogo.campeonato,

                    jogo.estadio,

                    jogo.status,

                    jogo.gols_casa,

                    jogo.gols_fora

                ]
            );


        return (
            resultado
                .rows[0] ||
            null
        );

    }

    catch (error) {

        console.error(
            `❌ Erro salvar jogo ${jogo?.time_casa || ""} x ${jogo?.time_fora || ""}:`,
            error.message
        );


        return null;

    }

}


// ==================================================
// SINCRONIZAR JOGOS
// ==================================================

export async function sincronizarJogos() {

    console.log(
        "=============================================="
    );

    console.log(
        "⚽ SINCRONIZAÇÃO DE JOGOS"
    );

    console.log(
        "=============================================="
    );


    const {
        hoje,
        amanha
    } =
        obterJanelaJogos();


    console.log(
        `📅 Janela: ${hoje} até ${amanha}`
    );


    const lista =
        await buscarJogosAPI();


    if (
        !lista.length
    ) {

        console.log(
            "⚠️ Nenhum jogo recebido"
        );


        return {

            sucesso:
                true,

            total:
                0,

            erros:
                0

        };

    }


    let salvos = 0;
    let erros = 0;
    let ignorados = 0;


    for (
        const item of lista
    ) {

        try {

            const jogo =
                normalizarJogo(
                    item
                );


            if (
                !jogo
            ) {

                ignorados++;

                continue;

            }


            // ======================================
            // FILTRO DEFINITIVO
            // ======================================

            if (
                !jogoDentroDaJanela(
                    jogo.data_jogo
                )
            ) {

                ignorados++;

                continue;

            }


            const salvo =
                await salvarJogo(
                    jogo
                );


            if (
                salvo
            ) {

                salvos++;

            }
            else {

                erros++;

            }

        }

        catch (error) {

            erros++;

            console.error(
                "❌ Erro processamento jogo:",
                error.message
            );

        }

    }


    console.log(
        `⚽ ${salvos} jogos sincronizados`
    );


    console.log(
        `🚫 ${ignorados} jogos fora da janela`
    );


    console.log(
        `⚠️ ${erros} erros`
    );


    return {

        sucesso:
            true,

        total:
            salvos,

        ignorados,

        erros,

        hoje,

        amanha

    };

}


// ==================================================
// LIMPAR JOGOS ANTIGOS
//
// NÃO apaga jogos do banco.
//
// Apenas desativa/atualiza status quando
// a estrutura permitir.
//
// O frontend deverá filtrar por data.
//
// ==================================================

export async function limparJogosAntigos() {

    try {

        const resultado =
            await query(
                `
                UPDATE jogos

                SET status =

                    CASE

                        WHEN
                            status IS NULL
                        THEN
                            'FINISHED'

                        ELSE
                            status

                    END

                WHERE
                    data_jogo <
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )::date

                RETURNING id
                `
            );


        console.log(
            `🧹 ${resultado.rowCount || 0} jogos antigos verificados`
        );


        return {

            sucesso:
                true,

            total:
                resultado.rowCount || 0

        };

    }

    catch (error) {

        console.error(
            "❌ Erro limpeza jogos:",
            error.message
        );


        return {

            sucesso:
                false,

            total:
                0,

            erro:
                error.message

        };

    }

}


// ==================================================
// SINCRONIZAÇÃO COMPLETA
// ==================================================

export async function sincronizarTudo() {

    console.log(
        "=============================================="
    );

    console.log(
        "🚀 BETVISION AI v6"
    );

    console.log(
        "🚀 SINCRONIZAÇÃO COMPLETA"
    );

    console.log(
        "=============================================="
    );


    const inicio =
        Date.now();


    const campeonatos =
        await sincronizarCampeonatos();


    const jogos =
        await sincronizarJogos();


    const limpeza =
        await limparJogosAntigos();


    const tempo =
        Date.now() -
        inicio;


    console.log(
        `⏱️ Sincronização concluída em ${tempo} ms`
    );


    return {

        sucesso:
            true,

        campeonatos,

        jogos,

        limpeza,

        tempo

    };

}


// ==================================================
// INICIAR SINCRONIZAÇÃO
//
// Mantém compatibilidade com server.js
// ==================================================

export async function iniciarSincronizacao() {

    console.log(
        "🚀 Iniciando serviço de sincronização v6..."
    );


    try {

        const resultado =
            await sincronizarTudo();


        console.log(
            "📊 Resultado sincronização:",
            resultado
        );


        return resultado;

    }

    catch (error) {

        console.error(
            "❌ Erro inicial sincronização:",
            error.message
        );


        return {

            sucesso:
                false,

            erro:
                error.message,

            total:
                0

        };

    }

}


// ==================================================
// AGENDAMENTO
//
// 03:00
// 09:00
// 15:00
// 21:00
//
// Isso mantém os jogos de hoje/amanhã
// atualizados ao longo do dia.
// ==================================================

export function ativarAgendamento() {

    cron.schedule(

        "0 3,9,15,21 * * *",

        async () => {

            console.log(
                "=============================================="
            );

            console.log(
                "⏰ SINCRONIZAÇÃO AUTOMÁTICA v6"
            );

            console.log(
                "=============================================="
            );


            try {

                const resultado =
                    await sincronizarTudo();


                console.log(
                    "📊 Atualização automática concluída:",
                    resultado
                );

            }

            catch (error) {

                console.error(
                    "❌ Erro atualização automática:",
                    error.message
                );

            }

        },

        {

            timezone:
                TIMEZONE

        }

    );


    console.log(
        "⏰ Agendamento v6 ativo: 03:00 / 09:00 / 15:00 / 21:00"
    );

}


// ==================================================
// EXPORT DEFAULT
// ==================================================

export default {

    buscarCampeonatosAPI,

    sincronizarCampeonatos,

    buscarJogosAPI,

    sincronizarJogos,

    limparJogosAntigos,

    sincronizarTudo,

    iniciarSincronizacao,

    ativarAgendamento

};
