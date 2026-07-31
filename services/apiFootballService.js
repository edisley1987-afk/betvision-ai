// ==========================================
// BetVision AI
// services/apiFootballService.js
// Football-Data.org Adapter
// ==========================================


import axios from "axios";



const BASE_URL =

    process.env.API_FOOTBALL_URL ||

    "https://api.football-data.org/v4";



const API_KEY =

    process.env.API_FOOTBALL_KEY;




const api = axios.create({


    baseURL: BASE_URL,


    timeout: 15000,


    headers:{


        "X-Auth-Token":
            API_KEY


    }


});





// ==========================================
// CONSULTAR API
// ==========================================

export async function consultarAPI(

    endpoint,

    params = {}

){


    try{


        const resposta =

            await api.get(

                endpoint,

                {

                    params

                }

            );



        return resposta.data;



    }


    catch(error){


        console.error(


            "Erro Football-Data:",


            error.response?.data ||

            error.message


        );


        return {};

    }


}





export default {


    consultarAPI


};
