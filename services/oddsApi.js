// ==========================================
// BetVision AI
// services/oddsApi.js
// The Odds API
// ==========================================

import axios from "axios";


const API_KEY = process.env.ODDS_API_KEY;


const BASE_URL =
    "https://api.the-odds-api.com";



// ==========================================
// LISTAR ESPORTES DISPONÍVEIS
// ==========================================

export async function listarEsportes(){

    try {

        const resposta = await axios.get(

            `${BASE_URL}/v4/sports/`,

            {
                params:{
                    apiKey: API_KEY
                },

                timeout:30000
            }

        );


        console.log(
            "✅ Esportes encontrados:",
            resposta.data.length
        );


        return resposta.data;


    } catch(error){

        console.error(
            "❌ Erro esportes:",
            error.response?.data ||
            error.message
        );


        return [];

    }

}




// ==========================================
// BUSCAR ODDS FUTEBOL
// ==========================================

export async function getOdds(){


    try {


        if(!API_KEY){

            console.log(
                "❌ ODDS_API_KEY ausente"
            );

            return [];

        }



        const resposta = await axios.get(

            `${BASE_URL}/v4/sports/soccer_epl/odds/`,

            {

                params:{

                    apiKey:API_KEY,

                    regions:"eu",

                    markets:"h2h",

                    oddsFormat:"decimal"

                },

                timeout:30000

            }

        );



        console.log(

            `✅ Odds recebidas: ${resposta.data.length}`

        );


        return resposta.data;



    }

    catch(error){


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

    obterOdds,

    listarEsportes

};
