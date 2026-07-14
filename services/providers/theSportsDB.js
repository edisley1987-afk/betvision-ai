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


        return resposta.data.events || [];


    }

    catch(error){


        console.error(

            "Erro TheSportsDB:",
            error.message

        );


        return [];

    }


}
