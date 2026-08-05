// ==========================================
// BetVision AI
// services/futebolService.js
// Versão 11.0
// Serviço Futebol
// Busca jogos e normaliza dados
// ==========================================


import dotenv from "dotenv";

dotenv.config();





// ==========================================
// CONFIGURAÇÃO
// ==========================================


const API_KEY =

process.env.FOOTBALL_DATA_KEY;



const API_URL =

"https://api.football-data.org/v4";






// ==========================================
// BUSCAR JOGOS DO DIA
// ==========================================


export async function buscarJogosDia(){


    try{


        if(!API_KEY){


            console.log(

                "⚠️ Football-Data sem chave API"

            );


            return jogosFallback();


        }






        const resposta =

        await fetch(

            `${API_URL}/matches`,

            {


                headers:{


                    "X-Auth-Token":

                    API_KEY


                }


            }

        );





        if(!resposta.ok){


            console.log(

                "❌ Football-Data erro:",

                resposta.status

            );


            return jogosFallback();


        }






        const dados =

        await resposta.json();






        if(

            !dados.matches ||

            dados.matches.length === 0

        ){


            console.log(

                "⚽ 0 jogos encontrados"

            );


            return jogosFallback();


        }






        const jogos =

        dados.matches.map(

            jogo=>({



                id:

                jogo.id,



                campeonato:

                jogo.competition?.name ||

                "Futebol",



                casa:

                jogo.homeTeam?.name ||

                "Casa",



                fora:

                jogo.awayTeam?.name ||

                "Fora",



                horario:

                jogo.utcDate,



                status:

                jogo.status || "SCHEDULED"



            })

        );







        console.log(

            `⚽ ${jogos.length} jogos carregados`

        );




        return jogos;





    }

    catch(error){


        console.log(

            "❌ Erro futebol:",

            error.message

        );


        return jogosFallback();


    }



}







// ==========================================
// FALLBACK LOCAL
// ==========================================


function jogosFallback(){


    return [


        {


            id:999001,


            campeonato:"Brasileirão",


            casa:"Time A",


            fora:"Time B",


            horario:

            new Date(

                Date.now()+

                3600000

            ),


            status:"SCHEDULED"


        }


    ];



}








// ==========================================
// ALIAS COMPATIBILIDADE
// ==========================================


export async function buscarEventos(){


    return buscarJogosDia();


}





export default {


    buscarJogosDia,

    buscarEventos


};
