// ==========================================
// BetVision AI
// services/oddsApi.js
// The Odds API v4
// ==========================================

import axios from "axios";


const API_KEY = process.env.ODDS_API_KEY;


const BASE_URL =
    process.env.ODDS_API_URL ||
    "https://api.the-odds-api.com";



// ==========================================
// BUSCAR ODDS
// ==========================================

export async function getOdds(){

    try {


        if(!API_KEY){

            console.error(
                "❌ ODDS_API_KEY não configurada"
            );

            return [];

        }


        console.log(
            "💰 Consultando The Odds API..."
        );


        const resposta = await axios.get(

            `${BASE_URL}/v4/sports/soccer/odds`,

            {

                params:{

                    apiKey: API_KEY,

                    regions:"eu",

                    markets:"h2h",

                    oddsFormat:"decimal"

                },

                timeout:30000

            }

        );


        const jogos = resposta.data || [];


        console.log(
            `✅ Odds encontradas: ${jogos.length}`
        );


        return jogos;


    }catch(error){


        console.error(
            "❌ Erro The Odds API:",
            error.response?.data ||
            error.message
        );


        return [];

    }

}



export async function obterOdds(){

    return await getOdds();

}



export default {

    getOdds,
    obterOdds

};
