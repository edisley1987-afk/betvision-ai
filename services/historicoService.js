// ==========================================
// BetVision AI
// services/historicoService.js
// Histórico de Times
// Versão corrigida 3.0
// ==========================================


import axios from "axios";

import dotenv from "dotenv";

dotenv.config();



// ==========================================
// CONFIGURAÇÕES
// ==========================================


const API_URL =

    process.env.API_FOOTBALL_URL ||

    "https://api.football-data.org/v4";



const API_KEY =

    process.env.API_FOOTBALL_KEY || "";




const CACHE = new Map();



const CACHE_TIME =

    1000 * 60 * 30; // 30 minutos





// ==========================================
// NORMALIZAR NOME
// ==========================================


function normalizarNome(nome){


    return String(nome || "")

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g,"")

        .toLowerCase()

        .trim();


}







// ==========================================
// BUSCAR TIME
// ==========================================


async function buscarTime(nome){


    try{


        if(!nome){

            return null;

        }




        const chave =

            `time_${normalizarNome(nome)}`;



        const cache = CACHE.get(chave);



        if(cache && Date.now() - cache.data < CACHE_TIME){


            return cache.valor;


        }






        const resposta = await axios.get(


            `${API_URL}/teams`,


            {


                headers:{


                    "X-Auth-Token":

                    API_KEY


                },


                timeout:10000



            }


        );





        const times =

            resposta.data.teams || [];





        const encontrado =

            times.find(time =>



                normalizarNome(time.name)

                ===

                normalizarNome(nome)



            );







        CACHE.set(

            chave,

            {


                data:Date.now(),

                valor:encontrado || null


            }


        );





        return encontrado || null;



    }


    catch(error){



        console.warn(


            "⚠️ API times indisponível:",


            error.response?.status || error.message


        );



        return null;



    }



}








// ==========================================
// BUSCAR JOGOS DO TIME
// ==========================================


async function buscarJogosTime(timeId){


    try{



        if(!timeId){


            return [];


        }






        const resposta = await axios.get(


            `${API_URL}/teams/${timeId}/matches`,


            {



                headers:{


                    "X-Auth-Token":

                    API_KEY


                },


                params:{


                    status:

                    "FINISHED",



                    limit:

                    10


                },


                timeout:10000


            }


        );





        return resposta.data.matches || [];




    }


    catch(error){



        console.warn(


            "⚠️ Histórico indisponível:",


            error.response?.status || error.message


        );



        return [];



    }



}







// ==========================================
// CONVERTER JOGO
// ==========================================


function converterHistorico(

    jogos,

    nomeTime

){


    if(!Array.isArray(jogos)){


        return [];


    }





    return jogos.map(jogo=>{


        const casa =

            jogo.homeTeam?.name;



        const fora =

            jogo.awayTeam?.name;





        return {


            data:

            jogo.utcDate,



            casa,



            fora,



            placar:{



                casa:

                jogo.score?.fullTime?.home || 0,



                fora:

                jogo.score?.fullTime?.away || 0



            }



        };



    })

    .filter(jogo =>

        jogo.casa && jogo.fora

    )

    .slice(0,5);



}







// ==========================================
// BUSCAR HISTÓRICO COMPLETO
// ==========================================


export async function buscarHistoricoJogo(

    timeCasa,

    timeFora

){



    console.log(

        "📊 Buscando histórico:",

        timeCasa


    );



    console.log(

        "📊 Buscando histórico:",

        timeFora


    );







    try{



        const cacheKey =


            `${normalizarNome(timeCasa)}_${normalizarNome(timeFora)}`;






        const cache = CACHE.get(cacheKey);





        if(cache && Date.now()-cache.data < CACHE_TIME){



            return cache.valor;


        }






        const equipeCasa =

            await buscarTime(timeCasa);




        const equipeFora =

            await buscarTime(timeFora);







        const jogosCasa =

            await buscarJogosTime(

                equipeCasa?.id

            );






        const jogosFora =

            await buscarJogosTime(

                equipeFora?.id

            );








        const resultado = {



            historicoCasa:

            converterHistorico(

                jogosCasa,

                timeCasa

            ),



            historicoFora:

            converterHistorico(

                jogosFora,

                timeFora

            )



        };







        CACHE.set(


            cacheKey,


            {


                data:Date.now(),


                valor:resultado


            }



        );






        console.log(

            "✅ Histórico:",

            resultado.historicoCasa.length,

            resultado.historicoFora.length


        );






        return resultado;






    }


    catch(error){



        console.error(

            "Erro histórico:",

            error.message

        );




        return {



            historicoCasa:[],


            historicoFora:[]



        };



    }



}







// ==========================================
// LIMPAR CACHE
// ==========================================


export function limparCacheHistorico(){


    CACHE.clear();


}





// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {



    buscarHistoricoJogo,


    limparCacheHistorico



};
