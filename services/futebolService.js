// ==========================================
// BetVision AI
// services/futebolService.js
// Football-Data.org v4
// ==========================================

import axios from "axios";

const API_KEY = process.env.API_FOOTBALL_KEY;

const BASE_URL =
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";

// ==========================================
// FORMATAR DATA YYYY-MM-DD
// ==========================================

function formatarData(data) {

    return data.toISOString().split("T")[0];

}

// ==========================================
// BUSCAR JOGOS
// ==========================================

export async function buscarJogos() {

    try {

        if (!API_KEY) {

            console.warn("⚠ API_FOOTBALL_KEY não configurada.");

            return [];

        }

        const hoje = new Date();

        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);

        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);

        const resposta = await axios.get(

            `${BASE_URL}/matches`,

            {

                headers: {

                    "X-Auth-Token": API_KEY

                },

                params: {

                    dateFrom: formatarData(ontem),
                    dateTo: formatarData(amanha)

                },

                timeout: 20000

            }

        );

        const partidas = resposta.data?.matches || [];

        console.log(`📡 API retornou ${partidas.length} partidas`);

        const jogos = partidas.map(match => ({

            id: match.id,

            campeonato:
                match.competition?.name || "-",

            pais:
                match.area?.name || "-",

            casa:
                match.homeTeam?.name || "-",

            fora:
                match.awayTeam?.name || "-",

            horario:
                match.utcDate,

            status:
                match.status,

            rodada:
                match.matchday || null,

            estadio:
                match.venue || "-",

            escudos: {

                casa:
                    match.homeTeam?.crest || "",

                fora:
                    match.awayTeam?.crest || ""

            }

        }));

        console.log(`⚽ ${jogos.length} jogos carregados`);

        return jogos;

    } catch (erro) {

        console.error(

            "❌ Erro Football-Data:",

            erro.response?.status,

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
