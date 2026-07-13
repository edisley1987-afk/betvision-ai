import axios from "axios";


/*
 Serviço de odds
*/


export async function buscarOdds(idJogo){


    return {


        jogo:idJogo,


        mercado:{


            vencedor:


            {


                casa:2.10,

                empate:3.20,

                fora:3.80


            },


            gols:


            {

                over25:1.90,

                under25:1.85

            }


        }


    };


}
