// ==========================================
// BetVision AI
// services/futebolService.js
// Serviço Futebol
// Versão 8.0
// Jogos + Banco + Fallback
// ==========================================


import fs from "fs";

import {
    salvarListaJogos
}
from "./jogoBancoService.js";

// ==========================================
// ARQUIVO CACHE LOCAL
// ==========================================


const CACHE_FILE =

    "./data/jogos.json";






// ==========================================
// NORMALIZAR HORÁRIO
// ==========================================


function normalizarHorario(valor){


    if(!valor){

        return null;

    }



    // Já vem ISO

    if(
        valor.includes("T")
    ){

        return valor;

    }



    // Somente HH:mm

    if(
        /^\d{2}:\d{2}$/.test(valor)
    ){


        const hoje =

            new Date()
            .toISOString()
            .split("T")[0];



        return `${hoje}T${valor}:00`;


    }



    return valor;


}







// ==========================================
// LER CACHE LOCAL
// ==========================================


function carregarCache(){


    try{


        if(
            fs.existsSync(
                CACHE_FILE
            )
        ){


            return JSON.parse(

                fs.readFileSync(

                    CACHE_FILE,

                    "utf8"

                )

            );


        }


    }

    catch(error){


        console.log(

            "⚠ Erro lendo cache:",

            error.message

        );


    }



    return [];

}







// ==========================================
// SALVAR CACHE
// ==========================================


function salvarCache(jogos){


    try{


        fs.writeFileSync(

            CACHE_FILE,

            JSON.stringify(

                jogos,

                null,

                2

            )

        );


    }

    catch(error){


        console.log(

            "⚠ Erro salvar cache:",

            error.message

        );


    }


}








// ==========================================
// BUSCAR JOGOS
// ==========================================


export async function buscarJogos(){


    console.log(
        "===================================="
    );


    console.log(
        "⚽ API JOGOS DO DIA"
    );


    console.log(
        "===================================="
    );




    let jogos = [];





    try{


        /*
        ==============================
        AQUI ENTRA API FUTEBOL
        ==============================
        
        Futuramente:
        API-Football
        Football-Data
        TheSportsDB
        
        */


        // exemplo temporário
        // substitui quando API estiver ativa


        jogos = [

            {

                id:1,

                campeonato:
                "Brasileirão",


                casa:
                "Time A",


                fora:
                "Time B",


                horario:
                "20:00",


                status:
                "SCHEDULED"

            }

        ];



    }

    catch(error){


        console.error(

            "❌ Erro buscar jogos:",

            error.message

        );


    }






    // =================================
    // FALLBACK CACHE
    // =================================


    if(
        !jogos ||
        jogos.length === 0
    ){


        console.log(

            "⚠ Usando cache local"

        );


        jogos =
            carregarCache();


    }





    // =================================
    // NORMALIZAÇÃO
    // =================================


    jogos = jogos.map(

        jogo => ({


            id:
            jogo.id,


            campeonato:
            jogo.campeonato || "Futebol",



            casa:
            jogo.casa || "-",



            fora:
            jogo.fora || "-",



            horario:

            normalizarHorario(

                jogo.horario

            ),



            status:

            jogo.status ||
            "SCHEDULED"



        })


    );






    console.log(

        `⚽ ${jogos.length} jogos carregados`

    );





    // salva cache

    salvarCache(
        jogos
    );





    // salva PostgreSQL

    await salvarListaJogos(

        jogos

    );





    console.log(

        "💾 Jogos salvos PostgreSQL"

    );





    return jogos;


}







// ==========================================
// EXPORT
// ==========================================


export default {


    buscarJogos


};
