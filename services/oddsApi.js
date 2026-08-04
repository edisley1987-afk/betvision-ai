// ==========================================
// BetVision AI
// services/oddsApi.js
// The Odds API v4
// ==========================================

import axios from "axios";

const API_KEY = process.env.ODDS_API_KEY;

const BASE_URL =
    process.env.ODDS_API_URL ||
    "https://api.the-odds-api.com/v4";

// ==========================================
// BUSCAR ODDS
// ==========================================

export async function getOdds() {

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

        console.log(`✅ ${jogos.length} jogos com odds encontrados.`);

        return jogos;

    }

    catch (erro) {

        console.error("❌ Erro na The Odds API");

        if (erro.response) {

            console.error("Status:", erro.response.status);
            console.error(erro.response.data);

        } else {

            console.error(erro.message);

        }

        return [];

    }

}

// ==========================================
// COMPATIBILIDADE
// ==========================================

export async function obterOdds() {

    return await getOdds();

}

// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {

    getOdds,

    obterOdds

};
