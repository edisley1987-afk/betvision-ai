import axios from "axios";
import fs from "fs";


const config = JSON.parse(

    fs.readFileSync(
        "./config/providers.json"
    )

);



const api = axios.create({

    baseURL:
    config.futebolApi.baseUrl,

    timeout:
    config.futebolApi.timeout,

    headers:{

        "x-apisports-key":

        config.futebolApi.apiKey

    }

});



export async function consultarAPI(endpoint,params={}){


    try{


        const resposta =
        await api.get(

            endpoint,

            {
                params
            }

        );


        return resposta.data.response;



    }

    catch(error){


        console.error(

            "Erro API Futebol",

            error.message

        );


        return [];


    }


}
