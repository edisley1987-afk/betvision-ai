import axios from "axios";


const BASE_URL =
"https://www.thesportsdb.com/api/v1/json/123";



export async function buscarJogosReais(){


    try{


        const resposta =
        await axios.get(

            `${BASE_URL}/eventsnextleague.php?id= Brazilian Serie A`

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
