// ==========================================
// BetVision AI
// services/historicoService.js
// Histórico de Times + Football Data API
// Versão corrigida
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
// CACHE
// ==========================================


const cacheTimes = {};

const cacheHistorico = {};





// ==========================================
// LIMITADOR DE REQUISIÇÕES
// ==========================================


function esperar(ms){

    return new Promise(resolve =>

        setTimeout(resolve, ms)

    );

}





// ==========================================
// MAPA INICIAL DE TIMES
// ==========================================
// Evita excesso de chamadas
// Football Data usa IDs internos


const TIMES = {


    "FC Ararat-Armenia": 558,

    "NK Celje": 610,


    "Mjällby AIF": 446,

    "ŠK Slovan Bratislava": 524,


    "PFC Levski Sofia": 523,

    "FC Kairat": 1016,


    "Hapoel Be'er Sheva": 594,

    "Red Star Belgrade": 728,


    "Union Saint-Gilloise": 98,

    "Bodø/Glimt": 1187,


    "Dinamo Zagreb": 620,

    "FK Kauno Žalgiris": 641,


    "Sparta Prague": 524,

    "Lyon": 523,


    "Olympiakos Piraeus": 645,

    "NEC Nijmegen": 1910


};





// ==========================================
// BUSCAR TIME
// ==========================================


export async function buscarTime(nome){


    try{


        if(cacheTimes[nome]){


            return cacheTimes[nome];


        }




        console.log(

            "📊 Buscando histórico:",

            nome

        );




        // primeiro tenta mapa local


        if(TIMES[nome]){


            const time = {


                id: TIMES[nome],

                nome


            };


            cacheTimes[nome] = time;


            return time;


        }





        // se não existir tenta API


        if(!API_KEY){


            console.log(

                "⚠️ API KEY não encontrada"

            );


            return null;


        }




        await esperar(1200);




        const resposta = await axios.get(


            `${API_URL}/teams`,


            {


                params:{


                    name:nome


                },


                headers:{


                    "X-Auth-Token":

                    API_KEY


                },


                timeout:15000


            }


        );




        const timeEncontrado =

            resposta.data?.teams?.[0];





        if(!timeEncontrado){


            console.log(

                "⚠️ Time não encontrado:",

                nome

            );


            return null;


        }





        const time = {


            id:

            timeEncontrado.id,


            nome:

            timeEncontrado.name


        };




        cacheTimes[nome] = time;




        return time;




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
// BUSCAR ÚLTIMOS JOGOS DO TIME
// ==========================================


export async function buscarHistoricoTime(nome){



    try{


        const time =

            await buscarTime(nome);




        if(!time){


            return [];


        }





        if(cacheHistorico[time.id]){


            return cacheHistorico[time.id];


        }





        await esperar(1200);





        const resposta = await axios.get(


            `${API_URL}/teams/${time.id}/matches`,


            {


                params:{


                    status:

                    "FINISHED",


                    limit:

                    5


                },


                headers:{


                    "X-Auth-Token":

                    API_KEY


                },


                timeout:15000


            }


        );





        const jogos =

            resposta.data.matches || [];





        const historico = jogos.map(jogo=>{


            return {


                data:

                jogo.utcDate,



                casa:

                jogo.homeTeam.name,



                fora:

                jogo.awayTeam.name,



                placar:{


                    casa:

                    jogo.score.fullTime.home || 0,



                    fora:

                    jogo.score.fullTime.away || 0


                }



            };


        });





        cacheHistorico[time.id] = historico;



        console.log(

            "✅ Histórico encontrado:",

            historico.length,

            "jogos"

        );




        return historico;




    }


    catch(error){


        console.error(

            "Erro histórico:",

            error.message

        );


        return [];


    }


}







// ==========================================
// BUSCAR HISTÓRICO DO CONFRONTO
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


    Object.keys(cacheTimes)

        .forEach(k=>delete cacheTimes[k]);



    Object.keys(cacheHistorico)

        .forEach(k=>delete cacheHistorico[k]);



    console.log(

        "🧹 Cache histórico limpo"

    );


}






// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    buscarTime,


    buscarHistoricoTime,


    buscarHistoricoJogo,


    limparCacheHistorico


};
