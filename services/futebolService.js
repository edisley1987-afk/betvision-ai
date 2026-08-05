// ==========================================
// BetVision AI
// services/futebolService.js
// Versão 12.0
// Serviço Futebol Integrado
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


        console.log(
            "================================"
        );


        console.log(
            "⚽ BUSCANDO JOGOS DO DIA"
        );


        console.log(
            "================================"
        );





        // ===============================
        // SEM API KEY
        // ===============================


        if(!API_KEY){


            console.log(

                "⚠️ Football-Data sem chave"

            );


            return jogosFallback();


        }







        const resposta =

        await fetch(

            `${API_URL}/matches`,

            {


                method:"GET",


                headers:{


                    "X-Auth-Token":

                    API_KEY


                }


            }

        );







        // ===============================
        // ERRO API
        // ===============================


        if(!resposta.ok){


            const erro =

            await resposta.json()

            .catch(()=>({}));




            console.log(

                "❌ Football-Data erro:",

                erro

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

            partida=>{


                return {


                    id:

                    partida.id,



                    campeonato:

                    partida.competition?.name

                    ||

                    "Futebol",





                    casa:

                    partida.homeTeam?.name

                    ||

                    "Time Casa",





                    fora:

                    partida.awayTeam?.name

                    ||

                    "Time Fora",





                    horario:

                    partida.utcDate

                    ||

                    new Date(),





                    status:

                    partida.status

                    ||

                    "SCHEDULED"



                };


            }

        );








        console.log(

            `⚽ ${jogos.length} jogos carregados`

        );




        return jogos;





    }

    catch(error){



        console.log(

            "❌ Erro futebolService:",

            error.message

        );



        return jogosFallback();



    }



}









// ==========================================
// BUSCAR TODOS JOGOS
// COMPATIBILIDADE
// ==========================================


export async function buscarJogos(){


    return await buscarJogosDia();


}









// ==========================================
// BUSCAR EVENTOS
// COMPATIBILIDADE ANTIGA
// ==========================================


export async function buscarEventos(){


    return await buscarJogosDia();


}









// ==========================================
// FALLBACK LOCAL
// QUANDO API FALHA
// ==========================================


function jogosFallback(){



    return [


        {


            id:

            Date.now(),



            campeonato:

            "Brasileirão",



            casa:

            "Time A",



            fora:

            "Time B",



            horario:

            new Date(

                Date.now()+

                7200000

            ),



            status:

            "SCHEDULED"



        }



    ];



}









// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    buscarJogosDia,

    buscarJogos,

    buscarEventos


};
