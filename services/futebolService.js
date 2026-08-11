// ==========================================
// BetVision AI
// services/futebolService.js
// Versão 15.0
// Serviço Futebol Integrado
// Football-Data.org v4
// Neon PostgreSQL
//
// CORREÇÕES V15:
// - Busca SOMENTE jogos da data atual
// - Fuso horário America/Sao_Paulo
// - Filtro de data no servidor da API
// - Segunda validação local obrigatória
// - Bloqueia jogos de ontem
// - Bloqueia jogos de amanhã
// - Mantém compatibilidade com IA
// - Mantém compatibilidade com versões anteriores
// - Não cria jogos fictícios
// ==========================================

import dotenv from "dotenv";

dotenv.config();


// ==========================================
// CONFIGURAÇÃO
// ==========================================

// Chave oficial do Football-Data.org
//
// Mantemos API_FOOTBALL_KEY como fallback
// para não quebrar seu .env atual.
//

const API_KEY =
    process.env.FOOTBALL_DATA_KEY ||
    process.env.API_FOOTBALL_KEY ||
    "";


// URL oficial Football-Data.org v4
//

const API_URL =
    process.env.FOOTBALL_DATA_URL ||
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";


// ==========================================
// CONFIGURAÇÃO DE DATA
// ==========================================

const TIMEZONE =
    "America/Sao_Paulo";


// ==========================================
// TIMEOUT DA API
// ==========================================

const API_TIMEOUT =
    15000;


// ==========================================
// OBTER DATA ATUAL DO BRASIL
// ==========================================
//
// Retorna:
// YYYY-MM-DD
//
// Exemplo:
// 2026-08-11
//

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

        const data =
            formatter.format(agora);

        return data;

    }

    catch (error) {

        console.error(
            "❌ Erro ao obter data do Brasil:",
            error.message
        );

        return null;

    }

}


// ==========================================
// VALIDAR DATA YYYY-MM-DD
// ==========================================

function dataValida(data) {

    if (
        typeof data !==
        "string"
    ) {

        return false;

    }


    return /^\d{4}-\d{2}-\d{2}$/
        .test(data);

}


// ==========================================
// OBTER DATA DO JOGO
// ==========================================
//
// Converte utcDate da API para a data
// no fuso America/Sao_Paulo.
//
// IMPORTANTE:
// O jogo pode estar em UTC em um dia
// e no Brasil em outro.
//

function obterDataJogoBrasil(
    utcDate
) {

    try {

        if (!utcDate) {

            return null;

        }


        const data =
            new Date(utcDate);


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return null;

        }


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
            data
        );

    }

    catch {

        return null;

    }

}


// ==========================================
// VALIDAR HORÁRIO DO JOGO
// ==========================================

function validarHorario(
    horario
) {

    if (!horario) {

        return false;

    }


    const timestamp =
        new Date(horario)
            .getTime();


    return Number.isFinite(
        timestamp
    );

}


// ==========================================
// BUSCAR JOGOS DO DIA
// ==========================================

export async function buscarJogosDia() {

    try {

        console.log(
            "=========================================="
        );

        console.log(
            "⚽ BETVISION AI"
        );

        console.log(
            "⚽ BUSCANDO JOGOS DE HOJE"
        );

        console.log(
            "=========================================="
        );


        // ======================================
        // DATA ATUAL
        // ======================================

        const hoje =
            obterDataHojeBrasil();


        if (
            !dataValida(
                hoje
            )
        ) {

            console.error(
                "❌ Não foi possível determinar a data atual"
            );

            return [];

        }


        console.log(
            `📅 Data considerada: ${hoje}`
        );

        console.log(
            `🌎 Fuso horário: ${TIMEZONE}`
        );


        // ======================================
        // VALIDAR API KEY
        // ======================================

        if (!API_KEY) {

            console.warn(
                "⚠️ Football-Data sem chave"
            );

            console.warn(
                "⚠️ Configure FOOTBALL_DATA_KEY no .env"
            );

            console.warn(
                "⚠️ Nenhum jogo fictício será criado"
            );

            return [];

        }


        // ======================================
        // MONTAR URL
        // ======================================
        //
        // O dateTo é o dia seguinte porque
        // a API trata dateTo como limite exclusivo.
        //

        const dataSeguinte =
            obterDataSeguinte(
                hoje
            );


        if (
            !dataValida(
                dataSeguinte
            )
        ) {

            console.error(
                "❌ Não foi possível calcular a data seguinte"
            );

            return [];

        }


        const url =
            `${API_URL}/matches` +
            `?dateFrom=${encodeURIComponent(hoje)}` +
            `&dateTo=${encodeURIComponent(dataSeguinte)}`;


        console.log(
            "🌐 Football-Data URL:"
        );

        console.log(
            url
        );


        // ======================================
        // ABORT CONTROLLER
        // ======================================

        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                () => {

                    controller.abort();

                },
                API_TIMEOUT
            );


        // ======================================
        // CONSULTAR FOOTBALL-DATA
        // ======================================

        let resposta;


        try {

            resposta =
                await fetch(
                    url,
                    {

                        method:
                            "GET",

                        headers:
                            {

                                "X-Auth-Token":
                                    API_KEY,

                                "Accept":
                                    "application/json"

                            },

                        signal:
                            controller.signal

                    }
                );

        }

        finally {

            clearTimeout(
                timeout
            );

        }


        // ======================================
        // TRATAMENTO DE ERRO
        // ======================================

        if (
            !resposta.ok
        ) {

            let erro =
                {};

            try {

                erro =
                    await resposta.json();

            }

            catch {

                erro =
                    {};

            }


            console.error(
                "❌ Football-Data erro:",
                resposta.status,
                erro
            );


            // ==================================
            // ERRO 400
            // ==================================

            if (
                resposta.status ===
                400
            ) {

                console.error(
                    "⚠️ Requisição inválida para Football-Data"
                );

            }


            // ==================================
            // ERRO 401
            // ==================================

            if (
                resposta.status ===
                401
            ) {

                console.error(
                    "🔑 API KEY inválida ou não autorizada"
                );

            }


            // ==================================
            // ERRO 403
            // ==================================

            if (
                resposta.status ===
                403
            ) {

                console.error(
                    "🚫 Acesso negado pela Football-Data.org"
                );

            }


            // ==================================
            // ERRO 404
            // ==================================

            if (
                resposta.status ===
                404
            ) {

                console.error(
                    "❌ Endpoint Football-Data não encontrado"
                );

                console.error(
                    "🌐 URL:",
                    url
                );

            }


            // ==================================
            // ERRO 429
            // ==================================

            if (
                resposta.status ===
                429
            ) {

                console.error(
                    "⏳ Limite da API atingido"
                );

            }


            return [];

        }


        // ======================================
        // LER RESPOSTA
        // ======================================

        const dados =
            await resposta.json();


        // ======================================
        // VALIDAR ARRAY
        // ======================================

        const partidas =
            Array.isArray(
                dados?.matches
            )
                ? dados.matches
                : [];


        console.log(
            `⚽ ${partidas.length} jogos recebidos da API`
        );


        // ======================================
        // NENHUM JOGO
        // ======================================

        if (
            !partidas.length
        ) {

            console.log(
                `ℹ️ Nenhum jogo encontrado para ${hoje}`
            );

            return [];

        }


        // ======================================
        // NORMALIZAR JOGOS
        // ======================================

        const jogos =
            partidas

                .map(
                    (partida) => {

                        // ======================
                        // API ID
                        // ======================

                        const apiId =
                            Number(
                                partida?.id
                            );


                        // ======================
                        // TIMES
                        // ======================

                        const timeCasa =
                            partida
                                ?.homeTeam
                                ?.name ||
                            null;


                        const timeFora =
                            partida
                                ?.awayTeam
                                ?.name ||
                            null;


                        // ======================
                        // CAMPEONATO
                        // ======================

                        const campeonato =
                            partida
                                ?.competition
                                ?.name ||
                            "Futebol";


                        // ======================
                        // CÓDIGO CAMPEONATO
                        // ======================

                        const codigoCampeonato =
                            partida
                                ?.competition
                                ?.code ||
                            null;


                        // ======================
                        // ID CAMPEONATO
                        // ======================

                        const campeonatoId =
                            Number(
                                partida
                                    ?.competition
                                    ?.id
                            ) ||
                            null;


                        // ======================
                        // DATA UTC
                        // ======================

                        const horario =
                            partida
                                ?.utcDate ||
                            null;


                        // ======================
                        // STATUS
                        // ======================

                        const status =
                            partida
                                ?.status ||
                            "SCHEDULED";


                        // ======================
                        // ESTÁDIO
                        // ======================

                        const estadio =
                            partida
                                ?.venue ||
                            null;


                        // ======================
                        // DATA NO BRASIL
                        // ======================

                        const dataJogoBrasil =
                            obterDataJogoBrasil(
                                horario
                            );


                        // ======================
                        // VALIDAR API ID
                        // ======================

                        if (
                            !Number.isInteger(
                                apiId
                            ) ||
                            apiId <= 0
                        ) {

                            console.warn(
                                "⚠️ Jogo ignorado: api_id inválido"
                            );

                            return null;

                        }


                        // ======================
                        // VALIDAR TIMES
                        // ======================

                        if (
                            !timeCasa ||
                            !timeFora
                        ) {

                            console.warn(
                                `⚠️ Jogo ${apiId} ignorado: times inválidos`
                            );

                            return null;

                        }


                        // ======================
                        // VALIDAR DATA
                        // ======================

                        if (
                            !validarHorario(
                                horario
                            )
                        ) {

                            console.warn(
                                `⚠️ Jogo ${apiId} ignorado: data inválida`
                            );

                            return null;

                        }


                        // ======================
                        // PROTEÇÃO CONTRA
                        // JOGOS DE OUTRO DIA
                        // ======================

                        if (
                            dataJogoBrasil !==
                            hoje
                        ) {

                            console.warn(
                                `🚫 Jogo ${apiId} descartado: data ${dataJogoBrasil} diferente de hoje ${hoje}`
                            );

                            return null;

                        }


                        // ======================
                        // OBJETO PADRONIZADO
                        // ======================

                        return {

                            // ID Football-Data
                            api_id:
                                apiId,


                            // Compatibilidade
                            id:
                                apiId,


                            // Campeonato
                            campeonato:
                                campeonato,


                            // Código campeonato
                            campeonato_codigo:
                                codigoCampeonato,


                            // ID campeonato
                            campeonato_id:
                                campeonatoId,


                            // Mandante
                            time_casa:
                                timeCasa,


                            // Visitante
                            time_fora:
                                timeFora,


                            // Compatibilidade IA
                            casa:
                                timeCasa,


                            fora:
                                timeFora,


                            // Data oficial UTC
                            data_jogo:
                                horario,


                            // Compatibilidade
                            horario:
                                horario,


                            // Data no Brasil
                            data_jogo_brasil:
                                dataJogoBrasil,


                            // Estádio
                            estadio:
                                estadio,


                            // Status
                            status:
                                status

                        };

                    }
                )

                .filter(Boolean);


        // ======================================
        // RESULTADO
        // ======================================

        console.log(
            `⚽ ${jogos.length} jogos válidos para ${hoje}`
        );


        // ======================================
        // NENHUM JOGO APÓS FILTRO
        // ======================================

        if (
            !jogos.length
        ) {

            console.log(
                "⚠️ Nenhum jogo válido após filtro de data"
            );

            return [];

        }


        // ======================================
        // MOSTRAR JOGOS
        // ======================================

        jogos.forEach(
            (
                jogo,
                indice
            ) => {

                console.log(
                    `⚽ ${indice + 1}. ` +
                    `${jogo.time_casa} x ` +
                    `${jogo.time_fora} | ` +
                    `${jogo.campeonato} | ` +
                    `${jogo.data_jogo}`
                );

            }
        );


        // ======================================
        // PRIMEIRO JOGO
        // ======================================

        const primeiro =
            jogos[0];


        console.log(
            `⚽ Exemplo: ${primeiro.time_casa} x ${primeiro.time_fora}`
        );


        // ======================================
        // RETORNAR
        // ======================================

        return jogos;

    }

    catch (error) {

        // ======================================
        // TIMEOUT
        // ======================================

        if (
            error?.name ===
            "AbortError"
        ) {

            console.error(
                "⏱️ Timeout Football-Data:",
                `${API_TIMEOUT}ms`
            );

        }

        // ======================================
        // ERRO GERAL
        // ======================================

        else {

            console.error(
                "❌ Erro futebolService:",
                error?.message ||
                error
            );

        }


        return [];

    }

}


// ==========================================
// OBTER DATA SEGUINTE
// ==========================================
//
// Entrada:
// YYYY-MM-DD
//
// Saída:
// YYYY-MM-DD
//

function obterDataSeguinte(
    data
) {

    try {

        if (
            !dataValida(
                data
            )
        ) {

            return null;

        }


        const partes =
            data.split("-");


        const ano =
            Number(
                partes[0]
            );


        const mes =
            Number(
                partes[1]
            );


        const dia =
            Number(
                partes[2]
            );


        const dataObj =
            new Date(
                Date.UTC(
                    ano,
                    mes - 1,
                    dia
                )
            );


        dataObj.setUTCDate(
            dataObj.getUTCDate() + 1
        );


        const novoAno =
            dataObj
                .getUTCFullYear()
                .toString()
                .padStart(
                    4,
                    "0"
                );


        const novoMes =
            (
                dataObj
                    .getUTCMonth() + 1
            )
                .toString()
                .padStart(
                    2,
                    "0"
                );


        const novoDia =
            dataObj
                .getUTCDate()
                .toString()
                .padStart(
                    2,
                    "0"
                );


        return (
            `${novoAno}-${novoMes}-${novoDia}`
        );

    }

    catch {

        return null;

    }

}


// ==========================================
// BUSCAR TODOS OS JOGOS
// COMPATIBILIDADE
// ==========================================

export async function buscarJogos() {

    return await buscarJogosDia();

}


// ==========================================
// BUSCAR EVENTOS
// COMPATIBILIDADE ANTIGA
// ==========================================

export async function buscarEventos() {

    return await buscarJogosDia();

}


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    buscarJogosDia,

    buscarJogos,

    buscarEventos

};
