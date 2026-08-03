// ==========================================
// BetVision AI
// services/partidasService.js
// Football-Data.org v4
// Buscar partidas reais
// ==========================================


import {
    consultarAPI
} from "./apiFootballService.js";



// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data) {

    return data
        .toISOString()
        .split("T")[0];

}



// ==========================================
// BUSCAR JOGOS DE HOJE
// ==========================================

export async function buscarJogosHoje() {


    try {


        const hoje = new Date();


        const data =
            formatarData(hoje);



        console.log(
            "📅 Consultando jogos:",
            data
        );



        const resposta = await consultarAPI(

            "/matches",

            {

                dateFrom: data,

                dateTo: data


            }

        );



        if (!resposta) {


            console.log(
                "⚠️ API sem resposta"
            );


            return [];

        }



        const partidas =
            resposta.matches || [];



        console.log(

            `⚽ Football-Data encontrou ${partidas.length} partidas`

        );



        const jogos = partidas.map(

            jogo => ({


                id:
                    jogo.id,



                campeonato:
                    jogo.competition?.name || "-",



                codigoCompeticao:
                    jogo.competition?.code || "-",



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
                    jogo.matchday || "-",



                placar:{


                    casa:

                        jogo.score?.fullTime?.home ?? 0,


                    fora:

                        jogo.score?.fullTime?.away ?? 0


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



    catch(error) {


        console.error(

            "❌ Erro partidasService:",

            error.message

        );


        return [];

    }


}




// ==========================================
// BUSCAR TODOS OS JOGOS
// ==========================================

export async function buscarTodosJogos() {


    return await buscarJogosHoje();


}



// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {


    buscarJogosHoje,

    buscarTodosJogos


};
