// ==========================================
// BetVision AI
// services/partidasService.js
// Football-Data.org v4
// ==========================================


import {
    consultarAPI
} from "./apiFootballService.js";



// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data){

    return data
        .toISOString()
        .split("T")[0];

}



// ==========================================
// BUSCAR JOGOS DE HOJE
// ==========================================

export async function buscarJogosHoje(){


    try{


        const hoje = new Date();


        const data = formatarData(hoje);



        console.log(
            "📅 Buscando jogos:",
            data
        );



        const resposta = await consultarAPI(

            "/matches",

            {

                dateFrom:data,

                dateTo:data

            }

        );



        const partidas =

            resposta.matches || [];



        console.log(

            `⚽ Football-Data retornou ${partidas.length} jogos`

        );



        const jogos = partidas.map(

            jogo => ({


                id:
                    jogo.id,



                campeonato:
                    jogo.competition?.name || "-",



                pais:
                    jogo.area?.name || "-",



                casa:
                    jogo.homeTeam?.name || "-",



                fora:
                    jogo.awayTeam?.name || "-",



                horario:
                    jogo.utcDate,



                status:
                    jogo.status || "SCHEDULED",



                rodada:
                    jogo.matchday || null,



                placar: {


                    casa:

                        jogo.score?.fullTime?.home ?? null,


                    fora:

                        jogo.score?.fullTime?.away ?? null


                },


                escudos:{


                    casa:

                        jogo.homeTeam?.crest || "",


                    fora:

                        jogo.awayTeam?.crest || ""


                }



            })

        );



        return jogos;



    }


    catch(error){


        console.error(

            "❌ Erro buscarJogosHoje:",

            error.message

        );


        return [];

    }


}



// ==========================================
// BUSCAR TODOS OS JOGOS
// ==========================================

export async function buscarTodosJogos(){


    return await buscarJogosHoje();


}



// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {


    buscarJogosHoje,

    buscarTodosJogos


};
