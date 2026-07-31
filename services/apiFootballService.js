// ==========================================
// BetVision AI
// services/apiFootballService.js
// Football-Data.org v4
// ==========================================

import axios from "axios";
import fs from "fs";


const config = JSON.parse(

    fs.readFileSync(
        "./config/providers.json",
        "utf8"
    )

);


const api = axios.create({

    baseURL:
        config.futebolApi.baseUrl,

    timeout:
        config.futebolApi.timeout,


    headers: {

        "X-Auth-Token":
            config.futebolApi.apiKey

    }

});



export async function consultarAPI(
    endpoint,
    params = {}
){


    try {


        const resposta = await api.get(

            endpoint,

            {
                params
            }

        );


       console.log(
    "📡 RESPOSTA FOOTBALL-DATA:",
    JSON.stringify(
        resposta.data,
        null,
        2
    )
);


return resposta.data;


    }


    catch(error){


        console.error(

            "❌ Erro Football-Data:",

            error.response?.data ||
            error.message

        );


        return {

            matches: []

        };


    }


}
