import axios from "axios";
import fs from "fs";


const config = JSON.parse(

    fs.readFileSync(
        "./config/providers.json"
    )

);



export async function buscarCampeonatos(){


    try{


        if(
            !config.futebolApi.apiKey
        ){

            return campeonatosBase();

        }



        const resposta =
        await axios.get(

            `${config.futebolApi.baseUrl}/leagues`,

            {

                headers:{

                    "x-apisports-key":

                    config.futebolApi.apiKey

                }

            }

        );



        return resposta.data.response;



    }catch(error){


        console.error(

            "Erro campeonato API",

            error.message

        );


        return campeonatosBase();


    }


}



/*
 Base de segurança
 caso API esteja indisponível
*/


function campeonatosBase(){


    return [

        {

            id:71,

            nome:"Brasileirão Série A",

            pais:"Brasil"

        },

        {

            id:39,

            nome:"Premier League",

            pais:"Inglaterra"

        },

        {

            id:140,

            nome:"La Liga",

            pais:"Espanha"

        },

        {

            id:135,

            nome:"Serie A",

            pais:"Itália"

        },

        {

            id:78,

            nome:"Bundesliga",

            pais:"Alemanha"

        },

        {

            id:2,

            nome:"Champions League",

            pais:"Europa"

        }

    ];


}
