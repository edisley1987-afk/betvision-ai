import {
    buscarEventosLiga
}
from "./providers/theSportsDB.js";



/*
====================================
 FUTEBOL REAL
 THE SPORTS DB
====================================
*/


export async function buscarJogos(){


    const eventos =

    await buscarEventosLiga(
        4351
    );



    if(!Array.isArray(eventos)){


        console.log(
            "Nenhum evento retornado"
        );


        return [];

    }



    return eventos.map(evento=>({


        id:
        evento.idEvent,


        campeonato:
        evento.strLeague || "Futebol",


        casa:
        evento.strHomeTeam,


        fora:
        evento.strAwayTeam,


        horario:
        evento.dateEvent,


        hora:
        evento.strTime,


        estadio:
        evento.strVenue || null,


        status:
        evento.strStatus || "Agendado"



    }));


}
