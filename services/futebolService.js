// =======================================
// BetVision AI
// Serviço de Futebol
// =======================================


import axios from "axios";

import { analisarJogo } from "../ai/analiseJogo.js";




// =======================================
// Buscar Jogos
// =======================================

export async function buscarJogos(){


    let jogos = [];



    try{


        /*
          FUTURO:

          API-FOOTBALL
          SOFASCORE
          SPORTMONKS

          Exemplo:

          const resposta = await axios.get(
             "https://api-football.com/jogos"
          );

          jogos = resposta.data;

        */



        // MOCK TEMPORÁRIO

        jogos = [

            {

                id:1,

                campeonato:"Brasileirão",

                casa:"Time A",

                fora:"Time B",

                horario:"20:00"


            },


            {

                id:2,

                campeonato:"Champions League",

                casa:"Time C",

                fora:"Time D",

                horario:"21:00"


            }


        ];



        /*
          Executa Inteligência Artificial
        */


        const jogosAnalisados = jogos.map(jogo=>{


            return {


                ...jogo,


                analiseIA:
                    analisarJogo(jogo)



            };


        });



        return jogosAnalisados;



    }catch(error){


        console.error(
            "Erro futebolService:",
            error.message
        );


        return [];


    }



}
