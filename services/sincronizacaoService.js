import {
    buscarCampeonatos
}
from "./campeonatoService.js";



export async function sincronizarSistema(){


    console.log(
        "Sincronizando campeonatos..."
    );



    const campeonatos =
        await buscarCampeonatos();



    console.log(

        `${campeonatos.length} campeonatos carregados`

    );



    return campeonatos;


}
