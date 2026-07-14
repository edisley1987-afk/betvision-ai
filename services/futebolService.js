import { buscarJogosReais }
from "./providers/theSportsDB.js";


export async function buscarJogos(){


    const eventos =
    await buscarJogosReais();



    return eventos.map(evento=>({


        id:
        evento.idEvent,


        campeonato:
        evento.strLeague,


        casa:
        evento.strHomeTeam,


        fora:
        evento.strAwayTeam,


        horario:
        evento.dateEvent,


        estadio:
        evento.strVenue


    }));


}
