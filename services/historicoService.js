// ==========================================
// BetVision AI
// services/historicoService.js
// Histórico de Times + Football Data API
// Versão 7.0
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
// CONTROLE DE REQUISIÇÕES
// ==========================================


let ultimaConsulta = 0;



async function aguardarAPI(){


    const agora = Date.now();


    const diferenca =

        agora - ultimaConsulta;



    if(diferenca < 5000){


        await new Promise(resolve =>

            setTimeout(

                resolve,

                5000 - diferenca

            )

        );


    }


    ultimaConsulta = Date.now();


}





// ==========================================
// MAPA DE TIMES
// ==========================================


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
// FALLBACK HISTÓRICO
// ==========================================
// usado quando API bloquear
// ==========================================


const FALLBACK = {

};






// ==========================================
// BUSCAR TIME
// ==========================================


export async function buscarTime(nome){


    try{


        if(cacheTimes[nome]){


            return cacheTimes[nome];


        }




        if(TIMES[nome]){


            const time = {


                id:

                TIMES[nome],


                nome

            };



            cacheTimes[nome] = time;



            return time;


        }




        console.log(

            "⚠️ Time sem ID:",

            nome

        );



        return null;



    }


    catch(error){


        console.error(

            "Erro buscarTime:",

            error.message

        );


        return null;


    }


}







// ==========================================
// BUSCAR HISTÓRICO DO TIME
// ==========================================


export async function buscarHistoricoTime(nome){


    try{


        console.log(

            "📊 Buscando histórico:",

            nome

        );





        const time =

            await buscarTime(nome);





        if(!time){


            console.log(

                "⚠️ Sem ID histórico:",

                nome

            );


            return [];

        }






        if(cacheHistorico[time.id]){


            return cacheHistorico[time.id];


        }






        if(FALLBACK[nome]){


            console.log(

                "📦 Usando histórico local:",

                nome

            );


            cacheHistorico[time.id] =

                FALLBACK[nome];


            return FALLBACK[nome];


        }






        await aguardarAPI();





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


                timeout:

                15000


            }


        );





        const jogos =

            resposta.data.matches || [];







        const historico = jogos.map(jogo => {



            return {


                data:

                jogo.utcDate,



                casa:

                jogo.homeTeam.name,



                fora:

                jogo.awayTeam.name,



                placar:{


                    casa:

                    jogo.score?.fullTime?.home || 0,



                    fora:

                    jogo.score?.fullTime?.away || 0


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



        console.log(

            "⚠️ API histórico indisponível:",

            error.response?.status ||

            error.message

        );



        // fallback vazio

        return [];



    }


}








// ==========================================
// HISTÓRICO DO JOGO
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

    .forEach(

        item => delete cacheTimes[item]

    );



    Object.keys(cacheHistorico)

    .forEach(

        item => delete cacheHistorico[item]

    );



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

        Object.keys(cacheTimes).length,


        historicosCacheados:

        Object.keys(cacheHistorico).length


    };


}





// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    buscarTime,

    buscarHistoricoTime,

    buscarHistoricoJogo,

    limparCacheHistorico,

    statusHistorico


};
