// ==========================================
// BetVision AI
// services/futebolService.js
// Football-Data.org
// ==========================================

import axios from "axios";

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL =
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";

// ==========================================
// BUSCAR JOGOS DO DIA
// ==========================================

export async function buscarJogos() {

    try {

        if (!API_KEY) {

            console.warn("API_FOOTBALL_KEY não configurada.");

            return [];

        }

        const hoje = new Date().toISOString().split("T")[0];

        const resposta = await axios.get(

            `${BASE_URL}/matches`,

            {

                headers: {

                    "X-Auth-Token": API_KEY

                },

                params: {

                    dateFrom: hoje,
                    dateTo: hoje

                },

                timeout: 15000

            }

        );

        const partidas = resposta.data.matches || [];

        const jogos = partidas.map(match => ({

            id: match.id,

            campeonato: match.competition?.name || "-",

            pais: match.area?.name || "-",

            casa: match.homeTeam?.name || "-",

            fora: match.awayTeam?.name || "-",

            horario: match.utcDate,

            estadio: match.venue || "-",

            status: match.status,

            escudos: {

                casa: match.homeTeam?.crest || "",

                fora: match.awayTeam?.crest || ""

            }

        }));

        console.log(`⚽ ${jogos.length} jogos encontrados`);

        return jogos;

    } catch (erro) {

        console.error(
            "Erro Football-Data:",
            erro.response?.data || erro.message
        );

        return [];

    }

}

// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {

    buscarJogos

};
