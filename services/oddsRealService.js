import {
    consultarAPI
}
from "./apiFootballService.js";



export async function buscarOddsReal(
    partida
){


    const odds =

    await consultarAPI(

        "/odds",

        {

            fixture:
            partida

        }

    );



    return odds;


}
