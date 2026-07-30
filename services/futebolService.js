// ==========================================
// BetVision AI
// services/futebolService.js
// Versão 4.0
// ==========================================


import { buscarJogosReais } 
from "./providers/theSportsDB.js";

import { gerarAnalise } 
from "./iaService.js";



// ==========================================
// BUSCAR JOGOS
// ==========================================


export async function buscarJogos(){


    try {


        const eventos = await buscarJogosReais();



        if(
            !eventos ||
            eventos.length === 0
        ){


            console.warn(
                "⚠ Nenhum jogo encontrado no provider"
            );


            return [];

        }





        const jogos = eventos.map(

            evento => ({


                id:
                evento.idEvent,



                campeonato:
                evento.strLeague || "Desconhecido",



                casa:
                evento.strHomeTeam,



                fora:
                evento.strAwayTeam,



                horario:
                evento.dateEvent,



                estadio:
                evento.strVenue || "-",



                status:
                evento.strStatus || "Agendado"


            })

        );





        return jogos;



    }

    catch(error){


        console.error(

            "Erro buscando jogos:",
            error.message

        );


        return [];

    }


}







// ==========================================
// BUSCAR JOGOS COM IA
// ==========================================


export async function buscarJogosComAnalise(){


    const jogos =
    await buscarJogos();



    return jogos.map(


        jogo => {



            const analise =

            gerarAnalise({


                timeCasa:
                jogo.casa,


                timeFora:
                jogo.fora,


                golsCasaMedia:
                1.8,


                golsForaMedia:
                1.3


            });




            return {


                ...jogo,


                analiseIA:analise



            };



        }


    );


}
