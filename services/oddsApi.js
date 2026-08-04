// ==========================================
// BetVision AI
// services/oddsApi.js
// The Odds API v4
// ==========================================

import axios from "axios";


const API_KEY =
    process.env.ODDS_API_KEY;


const BASE_URL =
    "https://api.the-odds-api.com/v4";



// ==========================================
// BUSCAR ESPORTES DISPONÍVEIS
// ==========================================

async function listarEsportes(){

    try{

        const resposta =
            await axios.get(

                `${BASE_URL}/sports`,

                {

                    params:{
                        apiKey:API_KEY
                    }

                }

            );


        return resposta.data;


    }catch(error){

        console.error(
            "Erro esportes:",
            error.message
        );

        return [];

    }

}



// ==========================================
// BUSCAR ODDS FUTEBOL
// ==========================================

export async function getOdds(){


    try{


        if(!API_KEY){

            console.error(
                "❌ ODDS_API_KEY ausente"
            );

            return [];

        }



        console.log(
            "💰 Consultando The Odds API"
        );



        const resposta =

        await axios.get(


            `${BASE_URL}/sports/soccer_epl/odds`,

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

            "Jogos Odds:",
            resposta.data.length

        );



        return resposta.data;



    }

    catch(error){


        console.error(

            "Erro The Odds API:",
            error.response?.data ||
            error.message

        );


        return [];


    }


}




// ==========================================
// COMPATIBILIDADE
// ==========================================

export async function obterOdds(){

    return await getOdds();

}




// ==========================================
// TESTE THE ODDS API
// ==========================================

export async function testarOddsAPI(){

    try{

        const resposta = await axios.get(

            `${BASE_URL}/sports`,

            {

                params:{

                    apiKey: API_KEY

                }

            }

        );


        console.log(
            "ESPORTES DISPONÍVEIS:",
            resposta.data.map(
                s => s.key
            )
        );


        return resposta.data;


    }catch(error){


        console.error(

            "ERRO TESTE ODDS API:",
            error.response?.data ||
            error.message

        );


        return [];

    }

}



// ==========================================
// TESTE THE ODDS API
// ==========================================

export async function testarOddsAPI(){

    try{

        const resposta = await axios.get(

            `${BASE_URL}/sports`,

            {

                params:{

                    apiKey: API_KEY

                }

            }

        );


        console.log(
            "ESPORTES DISPONÍVEIS:",
            resposta.data.map(
                s => s.key
            )
        );


        return resposta.data;


    }catch(error){


        console.error(

            "ERRO TESTE ODDS API:",
            error.response?.data ||
            error.message

        );


        return [];

    }

}



// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {

    getOdds,

    obterOdds,

    testarOddsAPI

};
