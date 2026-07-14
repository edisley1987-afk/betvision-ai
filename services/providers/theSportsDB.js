import axios from "axios";


const BASE_URL =
"https://www.thesportsdb.com/api/v1/json/123";



export async function buscarEventosLiga(idLiga){


    try{


        const resposta = await axios.get(

            `${BASE_URL}/eventsnextleague.php?id=${idLiga}`

        );


        console.log(
            "Resposta TheSportsDB:",
            resposta.data
        );


        if(
            Array.isArray(resposta.data.events)
        ){

            return resposta.data.events;

        }


        return [];


    }

    catch(error){


        console.error(

            "Erro TheSportsDB:",
            error.message

        );


        return [];

    }


}
