// ==========================================
// BetVision AI
// services/futebolService.js
// Versão 14.0
// Serviço Futebol Integrado
// Football-Data.org v4
// Neon PostgreSQL
// ==========================================

import dotenv from "dotenv";

dotenv.config();


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const API_KEY =
    process.env.API_FOOTBALL_KEY ||
    process.env.FOOTBALL_DATA_KEY ||
    "";

const API_URL =
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";


// ==========================================
// TIMEOUT DA API
// ==========================================

const API_TIMEOUT = 15000;


// ==========================================
// BUSCAR JOGOS DO DIA
// ==========================================

export async function buscarJogosDia() {

    try {

        console.log(
            "================================"
        );

        console.log(
            "⚽ BUSCANDO JOGOS DO DIA"
        );

        console.log(
            "================================"
        );


        // ==========================================
        // VALIDAR API KEY
        // ==========================================

        if (!API_KEY) {

            console.warn(
                "⚠️ Football-Data sem chave"
            );

            console.warn(
                "⚠️ API_FOOTBALL_KEY não configurada"
            );

            console.warn(
                "⚠️ Nenhum jogo fictício será criado"
            );

            return [];

        }


        // ==========================================
        // ABORT CONTROLLER
        // ==========================================

        const controller =
            new AbortController();

        const timeout =
            setTimeout(
                () => controller.abort(),
                API_TIMEOUT
            );


        // ==========================================
        // CONSULTAR FOOTBALL-DATA
        // ==========================================

        let resposta;

        try {

            resposta = await fetch(

                `${API_URL}/matches`,

                {

                    method: "GET",

                    headers: {

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

            clearTimeout(timeout);

        }


        // ==========================================
        // TRATAMENTO DE ERRO DA API
        // ==========================================

        if (!resposta.ok) {

            let erro = {};

            try {

                erro =
                    await resposta.json();

            }

            catch {

                erro = {};

            }


            console.error(
                "❌ Football-Data erro:",
                resposta.status,
                erro
            );


            if (resposta.status === 401) {

                console.error(
                    "🔑 API KEY inválida ou não autorizada"
                );

            }


            if (resposta.status === 403) {

                console.error(
                    "🚫 Acesso negado pela Football-Data.org"
                );

            }


            if (resposta.status === 429) {

                console.error(
                    "⏳ Limite da API atingido"
                );

            }


            return [];

        }


        // ==========================================
        // LER RESPOSTA
        // ==========================================

        const dados =
            await resposta.json();


        const partidas =
            Array.isArray(
                dados?.matches
            )
                ? dados.matches
                : [];


        console.log(
            `⚽ ${partidas.length} jogos recebidos da API`
        );


        // ==========================================
        // NENHUM JOGO
        // ==========================================

        if (!partidas.length) {

            console.log(
                "⚽ 0 jogos encontrados"
            );

            return [];

        }


        // ==========================================
        // NORMALIZAR JOGOS
        // ==========================================

        const jogos = partidas

            .map((partida) => {

                // ==================================
                // API ID
                // ==================================

                const apiId =
                    Number(
                        partida?.id
                    );


                // ==================================
                // TIMES
                // ==================================

                const timeCasa =
                    partida?.homeTeam?.name ||
                    null;


                const timeFora =
                    partida?.awayTeam?.name ||
                    null;


                // ==================================
                // CAMPEONATO
                // ==================================

                const campeonato =
                    partida?.competition?.name ||
                    "Futebol";


                // ==================================
                // DATA
                // ==================================

                const horario =
                    partida?.utcDate ||
                    null;


                // ==================================
                // STATUS
                // ==================================

                const status =
                    partida?.status ||
                    "SCHEDULED";


                // ==================================
                // ESTÁDIO
                // ==================================

                const estadio =
                    partida?.venue ||
                    null;


                // ==================================
                // VALIDAR API ID
                // ==================================

                if (
                    !Number.isInteger(apiId) ||
                    apiId <= 0
                ) {

                    console.warn(
                        "⚠️ Jogo ignorado: api_id inválido"
                    );

                    return null;

                }


                // ==================================
                // VALIDAR TIMES
                // ==================================

                if (
                    !timeCasa ||
                    !timeFora
                ) {

                    console.warn(
                        `⚠️ Jogo ${apiId} ignorado: times inválidos`
                    );

                    return null;

                }


                // ==================================
                // VALIDAR DATA
                // ==================================

                if (!horario) {

                    console.warn(
                        `⚠️ Jogo ${apiId} ignorado: data inválida`
                    );

                    return null;

                }


                // ==================================
                // OBJETO PADRONIZADO
                // ==================================

                return {

                    // ID da Football-Data
                    api_id:
                        apiId,


                    // Compatibilidade
                    id:
                        apiId,


                    // Campeonato
                    campeonato:
                        campeonato,


                    // Time mandante
                    time_casa:
                        timeCasa,


                    // Time visitante
                    time_fora:
                        timeFora,


                    // Compatibilidade com IA
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


                    // Estádio
                    estadio:
                        estadio,


                    // Status Football-Data
                    status:
                        status

                };

            })

            .filter(Boolean);


        // ==========================================
        // RESULTADO
        // ==========================================

        console.log(
            `⚽ ${jogos.length} jogos válidos carregados`
        );


        if (!jogos.length) {

            console.log(
                "⚠️ Nenhum jogo válido após normalização"
            );

        }


        // ==========================================
        // MOSTRAR PRIMEIRO JOGO NO LOG
        // ==========================================

        if (jogos.length > 0) {

            const primeiro =
                jogos[0];

            console.log(
                `⚽ Exemplo: ${primeiro.time_casa} x ${primeiro.time_fora}`
            );

        }


        return jogos;


    }

    catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            console.error(
                "⏱️ Timeout Football-Data:",
                `${API_TIMEOUT}ms`
            );

        }

        else {

            console.error(
                "❌ Erro futebolService:",
                error.message
            );

        }


        return [];

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
