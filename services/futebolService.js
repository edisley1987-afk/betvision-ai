import axios from "axios";


/*
 Serviço responsável por buscar jogos
*/


export async function buscarJogos(){


    /*
      Futuramente integrar:
      
      API-Football
      Sofascore
      Flashscore
      Sportmonks
      
    */


    return [

        {

            id:1,

            campeonato:"Brasileirão",

            casa:"Time A",

            fora:"Time B",

            horario:"20:00"

        }

    ];


}
