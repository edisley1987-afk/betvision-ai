// ==========================================
// BetVision AI
// services/futebolService.js
// Versão 13.0
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
        // CONSULTAR FOOTBALL-DATA
        // ==========================================

        const resposta = await fetch(

            `${API_URL}/matches`,

            {

                method: "GET",

                headers: {

                    "X-Auth-Token":
                        API_KEY,

                    "Accept":
                        "application/json"

                }

            }

        );


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

            .map(partida => {

                const apiId =
                    Number(
                        partida?.id
                    );


                const timeCasa =
                    partida?.homeTeam?.name ||
                    null;


                const timeFora =
                    partida?.awayTeam?.name ||
                    null;


                const campeonato =
                    partida?.competition?.name ||
                    "Futebol";


                const horario =
                    partida?.utcDate ||
                    null;


                const status =
                    partida?.status ||
                    "SCHEDULED";


                // ==================================
                // VALIDAR JOGO
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


                if (
                    !timeCasa ||
                    !timeFora
                ) {

                    console.warn(
                        `⚠️ Jogo ${apiId} ignorado: times inválidos`
                    );

                    return null;

                }


                return {

                    // ID da API
                    api_id:
                        apiId,


                    // Mantido para compatibilidade
                    id:
                        apiId,


                    campeonato:


                        campeonato,


                    time_casa:


                        timeCasa,


                    time_fora:


                        timeFora,


                    // Compatibilidade com predictionService
                    casa:


                        timeCasa,


                    fora:


                        timeFora,


                    data_jogo:


                        horario,


                    horario:


                        horario,


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


        return jogos;


    }

    catch (error) {

        console.error(
            "❌ Erro futebolService:",
            error.message
        );


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
