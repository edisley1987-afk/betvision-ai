// ==========================================
// BetVision AI
// services/partidasService.js
// API-Football v3
// ==========================================


import {
    consultarAPI
} from "./apiFootballService.js";




// ==========================================
// BUSCAR JOGOS DE HOJE
// ==========================================

export async function buscarJogosHoje(){


    try{


        const data =
            new Date()
            .toISOString()
            .slice(0,10);



        console.log(
            "📅 Buscando jogos:",
            data
        );



        const jogosAPI =

            await consultarAPI(

                "/fixtures",

                {

                    date:data

                }

            );



        console.log(

            `⚽ API retornou ${jogosAPI.length} jogos`

        );



        const jogos = jogosAPI.map(jogo => ({



            id:
                jogo.fixture.id,



            campeonato:
                jogo.league?.name || "-",



            pais:
                jogo.league?.country || "-",



            casa:
                jogo.teams?.home?.name || "-",



            fora:
                jogo.teams?.away?.name || "-",



            horario:
                jogo.fixture?.date,



            status:
                jogo.fixture?.status?.long || "-",



            escudos:{


                casa:
                    jogo.teams?.home?.logo || "",


                fora:
                    jogo.teams?.away?.logo || ""


            }



        }));



        console.log(

            "✅ Jogos formatados:",
            jogos.length

        );



        return jogos;



    }


    catch(erro){


        console.error(

            "❌ Erro buscarJogosHoje:",
            erro.message

        );


        return [];

    }



}





export default {


    buscarJogosHoje


};
