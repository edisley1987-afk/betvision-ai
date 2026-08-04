// ==========================================
// BetVision AI
// services/futebolService.js
// Versão 9.0
// Serviço central de partidas
// ==========================================


import fs from "fs/promises";
import path from "path";
import {
    fileURLToPath
} from "url";


// ==========================================
// CONFIGURAÇÃO
// ==========================================


const __filename =
    fileURLToPath(import.meta.url);


const __dirname =
    path.dirname(__filename);



const ARQUIVO_JOGOS =

    path.join(

        __dirname,

        "../data/jogos.json"

    );




// ==========================================
// LER CACHE LOCAL DE JOGOS
// ==========================================


async function carregarJogosArquivo(){


    try{


        const dados =

            await fs.readFile(

                ARQUIVO_JOGOS,

                "utf-8"

            );



        const jogos =

            JSON.parse(dados);



        if(!Array.isArray(jogos)){


            return [];


        }



        return jogos;



    }

    catch(error){


        console.log(

            "⚠️ Erro lendo jogos.json:",

            error.message

        );


        return [];

    }


}






// ==========================================
// NORMALIZAR JOGO
// ==========================================


function normalizarJogo(jogo){


    return {


        id:

        jogo.id ||

        jogo.idEvent ||

        Date.now(),



        campeonato:

        jogo.campeonato ||

        jogo.strLeague ||

        jogo.league ||

        "Futebol",




        pais:

        jogo.pais ||

        jogo.country ||

        "",




        casa:

        jogo.casa ||

        jogo.homeTeam ||

        jogo.strHomeTeam ||

        "Casa",




        fora:

        jogo.fora ||

        jogo.awayTeam ||

        jogo.strAwayTeam ||

        "Fora",




        horario:

        jogo.horario ||

        jogo.dateEvent ||

        jogo.utcDate ||

        new Date().toISOString(),




        status:

        jogo.status ||

        "SCHEDULED",




        escudos:

        jogo.escudos ||

        {

            casa:

            jogo.homeLogo || "",


            fora:

            jogo.awayLogo || ""

        }




    };


}








// ==========================================
// BUSCAR TODOS OS JOGOS
// ==========================================


export async function buscarJogos(){



    try{



        const jogos =

            await carregarJogosArquivo();





        const resultado =

            jogos.map(

                normalizarJogo

            );





        console.log(

            `⚽ ${resultado.length} jogos carregados`

        );





        return resultado;



    }

    catch(error){



        console.error(

            "❌ Erro buscarJogos:",

            error.message

        );



        return [];


    }



}








// ==========================================
// BUSCAR JOGO POR ID
// ==========================================


export async function buscarJogoPorId(id){



    const jogos =

        await buscarJogos();




    return jogos.find(

        jogo =>

        String(jogo.id)

        ===

        String(id)

    )
    ||
    null;



}








// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    buscarJogos,


    buscarJogoPorId


};
