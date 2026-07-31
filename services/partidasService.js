// ==========================================
// BetVision AI
// services/partidasService.js
// DEBUG Football-Data.org
// ==========================================


import {
    consultarAPI
} from "./apiFootballService.js";



export async function buscarJogosHoje(){


    try{


        const data =
            new Date()
            .toISOString()
            .slice(0,10);



        console.log(
            "📅 Data consultada:",
            data
        );



        const resposta =

            await consultarAPI(

                "/matches",

                {

                    dateFrom:data,

                    dateTo:data

                }

            );



        console.log(
            "📡 Resposta Football:",
            JSON.stringify(
                resposta,
                null,
                2
            )
        );



        const jogos =

            resposta.matches || [];



        console.log(

            `⚽ TOTAL JOGOS: ${jogos.length}`

        );



        return jogos.map(jogo=>({


            id:
                jogo.id,


            campeonato:
                jogo.competition?.name || "-",


            casa:
                jogo.homeTeam?.name || "-",


            fora:
                jogo.awayTeam?.name || "-",


            horario:
                jogo.utcDate,


            status:
                jogo.status


        }));



    }

    catch(erro){


        console.error(

            "Erro buscarJogosHoje:",
            erro.message

        );


        return [];

    }


}
