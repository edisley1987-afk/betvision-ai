import {
    consultarAPI
}
from "./apiFootballService.js";



export async function buscarTimes(
    campeonato
){


    const times =

    await consultarAPI(

        "/teams",

        {

            league:
            campeonato,

            season:
            2026

        }

    );



    return times.map(item=>({


        id:
        item.team.id,


        nome:
        item.team.name,


        pais:
        item.team.country,


        logo:
        item.team.logo



    }));


}
