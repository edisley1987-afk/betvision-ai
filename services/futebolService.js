// ==========================================
// BetVision AI
// services/futebolService.js
// Football-Data.org v4
// ==========================================

import axios from "axios";


// ==========================================
// CONFIGURAÇÃO
// ==========================================


const API_KEY =
    process.env.FOOTBALL_DATA_KEY ||
    process.env.API_FOOTBALL_KEY;



const BASE_URL =
    process.env.FOOTBALL_DATA_URL ||
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";



// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data){

    return data
        .toISOString()
        .split("T")[0];

}



// ==========================================
// BUSCAR JOGOS
// ==========================================

export async function buscarJogos(){


    try{


        if(!API_KEY){


            console.warn(
                "⚠ Football-Data API KEY não configurada"
            );


            return [];

        }



        const hoje =
            new Date();



        const data =
            formatarData(hoje);



        console.log(
            "📅 Buscando jogos:",
            data
        );



        const resposta =
        await axios.get(


            `${BASE_URL}/matches`,


            {


                headers:{


                    "X-Auth-Token":
                        API_KEY


                },


                params:{


                    dateFrom:
                        data,


                    dateTo:
                        data


                },


                timeout:
                    20000


            }


        );



        const partidas =
            resposta.data.matches || [];



        console.log(

            `⚽ Football-Data retornou ${partidas.length} jogos`

        );



        const jogos = partidas.map(match=>({



            id:
                match.id,



            campeonato:
                match.competition?.name || "-",



            pais:
                match.area?.name || "-",



            casa:
                match.homeTeam?.name || "-",



            fora:
                match.awayTeam?.name || "-",



            horario:
                match.utcDate,



            status:
                match.status,



            rodada:
                match.matchday || null,



            escudos:{


                casa:
                    match.homeTeam?.crest || "",


                fora:
                    match.awayTeam?.crest || ""

            }



        }));



        return jogos;



    }

    catch(error){



        console.error(

            "❌ Erro Football-Data:",

            error.response?.status ||
            "",


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

    buscarJogos

};
