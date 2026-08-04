// ==========================================
// BetVision AI
// services/timesService.js
// Football-Data.org v4
// Versão 8.0
// ==========================================


import { consultarAPI } from "./apiFootballService.js";




// ==========================================
// DELAY
// ==========================================

function esperar(ms){

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );

}




// ==========================================
// BUSCAR TIMES DA COMPETIÇÃO
// ==========================================


export async function buscarTimes(codigoCompeticao){


    try{


        console.log(

            `⚽ Buscando times da competição ${codigoCompeticao}`

        );



        const resposta =

            await consultarAPI(

                `/competitions/${codigoCompeticao}/teams`

            );




        const times =

            resposta.teams || [];





        console.log(

            `✅ ${times.length} times encontrados`

        );





        return times.map(time => ({



            id:

                time.id,



            nome:

                time.name,



            nomeCurto:

                time.shortName || time.name,



            sigla:

                time.tla || "",



            pais:

                time.area?.name || "",



            fundacao:

                time.founded || null,



            estadio:

                time.venue || "",



            treinador:

                time.coach?.name || "",



            website:

                time.website || "",



            cores:

                time.clubColors || "",



            logo:

                time.crest || "",



            elenco:

                time.squad || []



        }));



    }catch(error){



        if(
            error.response?.status === 429
        ){


            console.warn(

                "⏳ Limite Football-Data atingido. Aguardando..."

            );


            await esperar(12000);



        }



        console.error(

            "❌ Erro buscar times:",

            error.response?.data ||
            error.message

        );



        return [];



    }



}





// ==========================================
// BUSCAR UM TIME
// ==========================================


export async function buscarTime(idTime){


    try{


        const resposta =

            await consultarAPI(

                `/teams/${idTime}`

            );





        return {



            id:

                resposta.id,



            nome:

                resposta.name,



            nomeCurto:

                resposta.shortName || "",



            sigla:

                resposta.tla || "",



            pais:

                resposta.area?.name || "",



            fundacao:

                resposta.founded || null,



            estadio:

                resposta.venue || "",



            treinador:

                resposta.coach?.name || "",



            website:

                resposta.website || "",



            cores:

                resposta.clubColors || "",



            logo:

                resposta.crest || "",



            elenco:

                resposta.squad || []



        };



    }catch(error){



        console.error(

            "❌ Erro buscar time:",

            error.message

        );



        return null;



    }



}





// ==========================================
// BUSCAR ELENCO
// ==========================================


export async function buscarElenco(idTime){


    try{


        const time =

            await buscarTime(
                idTime
            );



        if(!time){

            return [];

        }



        return time.elenco || [];



    }catch(error){


        console.error(

            "Erro buscar elenco:",

            error.message

        );


        return [];


    }


}





// ==========================================
// BUSCAR ÚLTIMOS JOGOS
// ==========================================


export async function buscarUltimosJogos(

    idTime,

    limite = 10

){



    try{



        const resposta =

            await consultarAPI(

                `/teams/${idTime}/matches`,

                {

                    limit: limite

                }

            );




        return resposta.matches || [];




    }catch(error){



        console.error(

            "❌ Erro buscar histórico:",

            error.message

        );



        return [];

    }



}





// ==========================================
// RESUMO COMPLETO DO TIME
// ==========================================


export async function buscarResumoTime(idTime){



    const time =

        await buscarTime(
            idTime
        );



    const jogos =

        await buscarUltimosJogos(
            idTime
        );



    return {


        time,


        jogos



    };



}





// ==========================================
// PREPARAR JOGADORES PARA BANCO
// ==========================================


export function prepararJogadores(

    timeId,

    elenco = []

){


    return elenco.map(jogador => ({


        id:

            jogador.id,


        time_id:

            timeId,


        nome:

            jogador.name,


        posicao:

            jogador.position || "",


        nacionalidade:

            jogador.nationality || "",


        nascimento:

            jogador.dateOfBirth || null



    }));



}





// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {



    buscarTimes,


    buscarTime,


    buscarElenco,


    buscarUltimosJogos,


    buscarResumoTime,


    prepararJogadores



};
