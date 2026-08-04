// ==========================================
// BetVision AI
// services/historicoService.js
// Histórico dos Times
// Football Data API v4
// ==========================================

import axios from "axios";


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const API_URL =
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";


const API_KEY =
    process.env.API_FOOTBALL_KEY;



// ==========================================
// MAPA CACHE
// ==========================================

const cacheHistorico = new Map();



// ==========================================
// BUSCAR TIME PELO NOME
// ==========================================

export async function buscarTime(nome) {


    try {


        const resposta =
            await axios.get(

                `${API_URL}/teams`,

                {

                    headers:{

                        "X-Auth-Token":
                            API_KEY

                    },

                    timeout:15000

                }

            );


        const times =
            resposta.data.teams || [];



        const encontrado =
            times.find(

                time =>

                time.name
                .toLowerCase()
                .includes(

                    nome
                    .toLowerCase()

                )

            );



        return encontrado || null;



    }
    catch(error){


        console.error(

            "Erro buscar time:",
            error.message

        );


        return null;


    }


}




// ==========================================
// BUSCAR ID DO TIME
// ==========================================

async function obterIdTime(nome){


    const time =
        await buscarTime(nome);



    if(!time){

        return null;

    }


    return time.id;


}




// ==========================================
// ÚLTIMOS JOGOS DO TIME
// ==========================================

export async function buscarHistoricoTime(nomeTime){


    try{


        if(
            cacheHistorico.has(nomeTime)
        ){

            return cacheHistorico.get(nomeTime);

        }



        console.log(

            "📊 Buscando histórico:",
            nomeTime

        );



        const id =
            await obterIdTime(nomeTime);



        if(!id){


            console.log(

                "⚠️ Time não encontrado:",
                nomeTime

            );


            return [];


        }



        const resposta =
            await axios.get(

                `${API_URL}/teams/${id}/matches`,

                {

                    headers:{

                        "X-Auth-Token":
                            API_KEY

                    },

                    params:{


                        status:
                        "FINISHED",


                        limit:
                        5


                    },


                    timeout:
                    15000


                }

            );



        const jogosAPI =
            resposta.data.matches || [];



        const jogos =
            jogosAPI.map(jogo=>{


                const casa =
                    jogo.homeTeam.name;


                const fora =
                    jogo.awayTeam.name;



                return {


                    data:
                    jogo.utcDate,



                    casa,



                    fora,



                    placar:{


                        casa:

                        jogo.score.fullTime.home
                        ||0,



                        fora:

                        jogo.score.fullTime.away
                        ||0


                    }


                };


            });



        cacheHistorico.set(

            nomeTime,

            jogos

        );



        return jogos;



    }
    catch(error){


        console.error(

            "❌ Erro histórico:",
            error.response?.data
            ||
            error.message

        );


        return [];


    }


}



// ==========================================
// BUSCAR HISTÓRICO DOS DOIS TIMES
// ==========================================

export async function buscarHistoricoJogo(

    timeCasa,

    timeFora

){


    const historicoCasa =
        await buscarHistoricoTime(

            timeCasa

        );



    const historicoFora =
        await buscarHistoricoTime(

            timeFora

        );



    return {


        historicoCasa,


        historicoFora


    };


}



// ==========================================
// LIMPAR CACHE
// ==========================================

export function limparCacheHistorico(){


    cacheHistorico.clear();


    console.log(

        "🧹 Cache histórico limpo"

    );


}



// ==========================================
// STATUS
// ==========================================

export function statusHistorico(){


    return {


        timesCacheados:
        cacheHistorico.size,


        atualizado:
        new Date()


    };


}




export default {


    buscarTime,

    buscarHistoricoTime,

    buscarHistoricoJogo,

    limparCacheHistorico,

    statusHistorico


};
