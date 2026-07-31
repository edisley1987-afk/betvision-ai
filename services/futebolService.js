// ==========================================
// BetVision AI
// services/futebolService.js
// Football-Data.org v4
// ==========================================

import axios from "axios";

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const API_KEY =
    process.env.FOOTBALL_DATA_KEY ||
    process.env.API_FOOTBALL_KEY;

const BASE_URL =
    process.env.FOOTBALL_DATA_URL ||
    "https://api.football-data.org/v4";

// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data) {
    return data.toISOString().split("T")[0];
}

// ==========================================
// MONTAR OBJETO DO JOGO
// ==========================================

function converterPartida(match) {

    return {

        id: match.id,

        campeonato: match.competition?.name || "-",

        pais: match.area?.name || "-",

        casa: match.homeTeam?.name || "-",

        fora: match.awayTeam?.name || "-",

        horario: match.utcDate,

        status: match.status,

        rodada: match.matchday || null,

        escudos: {

            casa: match.homeTeam?.crest || "",

            fora: match.awayTeam?.crest || ""

        }

    };

}

// ==========================================
// BUSCAR JOGOS
// ==========================================

export async function buscarJogos() {

    try {

        console.log("======================================");
        console.log("⚽ FOOTBALL-DATA");
        console.log("======================================");

        if (!API_KEY) {

            console.error("❌ FOOTBALL_DATA_KEY não configurada.");

            return [];

        }

        console.log("✅ API KEY carregada.");

        console.log("🌍 URL:", BASE_URL);

        const hoje = new Date();

        const daqui7dias = new Date();
        daqui7dias.setDate(hoje.getDate() + 7);

        const dataInicial = formatarData(hoje);
        const dataFinal = formatarData(daqui7dias);

        console.log("📅 Buscando partidas:");
        console.log("De:", dataInicial);
        console.log("Até:", dataFinal);

        const resposta = await axios.get(

            `${BASE_URL}/matches`,

            {

                headers: {

                    "X-Auth-Token": API_KEY

                },

                params: {

                    dateFrom: dataInicial,

                    dateTo: dataFinal

                },

                timeout: 30000

            }

        );

        console.log("HTTP:", resposta.status);

        const partidas = resposta.data.matches || [];

        console.log(`⚽ API retornou ${partidas.length} partidas.`);

        const jogos = partidas.map(converterPartida);

        return jogos;

    }
    catch (error) {

        console.error("======================================");
        console.error("❌ ERRO FOOTBALL-DATA");
        console.error("======================================");

        if (error.response) {

            console.error("Status:", error.response.status);
            console.error("Resposta:", error.response.data);

        } else {

            console.error("Mensagem:", error.message);

        }

        console.error("======================================");

        return [];

    }

}

export default {

    buscarJogos

};
