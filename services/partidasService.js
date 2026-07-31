// ==========================================
// BetVision AI
// services/partidasService.js
// Football-Data.org
// ==========================================


import axios from "axios";


const API_KEY =
    process.env.API_FOOTBALL_KEY;


const BASE_URL =
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";




// ==========================================
// BUSCAR JOGOS DE HOJE
// ==========================================

export async function buscarJogosHoje(){


    try{


        if(!API_KEY){


            console.warn(
                "API_FOOTBALL_KEY não configurada"
            );


            return [];


        }



        const data =

            new Date()
            .toISOString()
            .slice(0,10);




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
                        15000

                }

            );




        const jogos =

            resposta.data.matches || [];




        console.log(

            `⚽ ${jogos.length} jogos encontrados`

        );




        return jogos.map(jogo=>({



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
                jogo.status



        }));



    }


    catch(erro){



        console.error(

            "Erro buscar jogos:",

            erro.response?.data ||
            erro.message

        );



        return [];

    }



}




export default {


    buscarJogosHoje


};
