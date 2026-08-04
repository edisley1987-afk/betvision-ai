// ==========================================
// BetVision AI
// services/oddsService.js
// The Odds API v4
// Versão Real
// ==========================================

import {

    buscarOddsReais,
    buscarOddsJogo

} from "./providers/oddsApiProvider.js";



// ==========================================
// BUSCAR ODDS DE UM JOGO
// ==========================================

export async function buscarOdds(idJogo = null) {


    try {


        if (idJogo) {


            return await buscarOddsJogo(
                idJogo
            );


        }


        const jogos =
            await buscarOddsReais();



        if (!jogos.length) {


            console.warn(
                "⚠️ Nenhuma odd encontrada"
            );


            return null;


        }



        return jogos[0];


    }


    catch(error) {


        console.error(

            "❌ Erro buscarOdds:",

            error.message

        );


        return null;


    }


}




// ==========================================
// BUSCAR ODDS DE TODOS OS JOGOS
// ==========================================

export async function buscarOddsJogos(
    listaJogos = []
) {


    try {


        if(
            !Array.isArray(listaJogos)
        ){

            return [];

        }



        const oddsAPI =
            await buscarOddsReais();



        return listaJogos.map(jogo=>{


            const encontrado =
                oddsAPI.find(odd =>


                    odd.casa === jogo.casa
                    &&
                    odd.fora === jogo.fora


                );



            return {


                ...jogo,


                odds:
                    encontrado || null


            };


        });



    }


    catch(error){


        console.error(

            "❌ Erro buscarOddsJogos:",

            error.message

        );


        return [];


    }


}



// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {


    buscarOdds,

    buscarOddsJogos


};
