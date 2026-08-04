// ==========================================
// BetVision AI
// services/oddsApi.js
// The Odds API
// ==========================================

import axios from "axios";

const API_KEY = process.env.ODDS_API_KEY;

const BASE_URL =
    process.env.ODDS_API_URL ||
    "https://api.the-odds-api.com/v4";

export async function obterOdds() {

    try {

        if (!API_KEY) {

            console.error("❌ ODDS_API_KEY não configurada.");

            return [];

        }

        console.log("💰 Buscando odds na The Odds API...");

        const resposta = await axios.get(

            `${BASE_URL}/sports/soccer/odds`,

            {

                params: {

                    apiKey: API_KEY,

                    regions: "eu",

                    markets: "h2h",

                    oddsFormat: "decimal"

                },

                timeout: 30000

            }

        );

        const jogos = resposta.data || [];

        console.log(`✅ Odds recebidas: ${jogos.length}`);

        return jogos.map(jogo => ({

            id: jogo.id,

            esporte: jogo.sport_title,

            casa: jogo.home_team,

            fora: jogo.away_team,

            inicio: jogo.commence_time,

            casas: jogo.bookmakers || []

        }));

    } catch (erro) {

        console.error("❌ Erro ao buscar odds:");

        if (erro.response) {

            console.error(erro.response.status);

            console.error(erro.response.data);

        } else {

            console.error(erro.message);

        }

        return [];

    }

}

export default {

    obterOdds

};
