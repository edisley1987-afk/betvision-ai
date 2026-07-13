import {
    consultarAPI
}
from "./apiFootballService.js";



export async function buscarJogosHoje(){


    const data =
    new Date()
    .toISOString()
    .slice(0,10);



    const jogos =

    await consultarAPI(

        "/fixtures",

        {

            date:data

        }

    );



    return jogos.map(jogo=>({


        id:
        jogo.fixture.id,


        campeonato:
        jogo.league.name,


        casa:
        jogo.teams.home.name,


        fora:
        jogo.teams.away.name,


        horario:
        jogo.fixture.date,


        status:
        jogo.fixture.status.long



    }));


}
