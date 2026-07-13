import {
    consultarAPI
}
from "./apiFootballService.js";



export async function buscarJogadores(
    time
){


    const jogadores =

    await consultarAPI(

        "/players",

        {

            team:
            time,

            season:
            2026

        }

    );



    return jogadores.map(item=>({


        id:
        item.player.id,


        nome:
        item.player.name,


        idade:
        item.player.age,


        nacionalidade:
        item.player.nationality



    }));


}
