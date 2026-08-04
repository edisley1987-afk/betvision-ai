// ==========================================
// BetVision AI
// services/sincronizacaoService.js
// Sincronização Campeonatos + Times
// Versão 8.0
// ==========================================


import { buscarCampeonatos } 
from "./campeonatoService.js";


import { buscarTimes } 
from "./timesService.js";


import { 
    inserirCampeonato,
    inserirTime,
    listarTimes
} 
from "./bancoService.js";




// ==========================================
// DELAY ENTRE REQUISIÇÕES
// ==========================================

function esperar(ms){

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );

}




// ==========================================
// SINCRONIZAR SISTEMA
// ==========================================


export async function sincronizarSistema(){


    console.log(
        "================================"
    );


    console.log(
        "🌎 INICIANDO SINCRONIZAÇÃO"
    );


    console.log(
        "================================"
    );



    let totalCampeonatos = 0;

    let totalTimes = 0;

    let erros = 0;



    try{


        /*
        =====================================
        BUSCAR CAMPEONATOS
        =====================================
        */


        const campeonatos =
            await buscarCampeonatos();



        if(!Array.isArray(campeonatos)){


            throw new Error(
                "Lista de campeonatos inválida"
            );


        }




        console.log(

            `🏆 Campeonatos encontrados: ${campeonatos.length}`

        );




        /*
        =====================================
        TIMES EXISTENTES NO BANCO
        =====================================
        */


        const timesBanco =
            await listarTimes();



        const idsTimes =
            new Set(

                timesBanco.map(
                    t => t.id
                )

            );





        /*
        =====================================
        PROCESSAR CAMPEONATOS
        =====================================
        */


        for(const campeonato of campeonatos){



            try{


                await inserirCampeonato(
                    campeonato
                );


                totalCampeonatos++;



                console.log(

                    `🏆 ${campeonato.nome}`

                );




                /*
                =================================
                BUSCAR TIMES
                =================================
                */


                const times =

                    await buscarTimes(
                        campeonato.id
                    );




                console.log(

                    `⚽ ${times.length} times encontrados em ${campeonato.nome}`

                );




                for(const time of times){



                    try{


                        /*
                        Evita gravar novamente
                        */

                        if(
                            idsTimes.has(
                                time.id
                            )
                        ){

                            continue;

                        }




                        await inserirTime({


                            id:
                                time.id,


                            campeonato_id:
                                campeonato.id,


                            nome:
                                time.nome,


                            pais:
                                time.pais



                        });



                        idsTimes.add(
                            time.id
                        );



                        totalTimes++;



                    }catch(error){


                        erros++;


                        console.error(

                            "Erro salvar time:",

                            time.nome,

                            error.message

                        );


                    }



                    /*
                    pausa pequena
                    */

                    await esperar(150);



                }




                /*
                Evita limite da API
                */

                await esperar(1200);



            }catch(error){



                erros++;


                console.error(

                    `Erro campeonato ${campeonato.nome}:`,

                    error.message

                );



            }



        }





        console.log(
            "================================"
        );


        console.log(
            "✅ SINCRONIZAÇÃO CONCLUÍDA"
        );


        console.log(

            `🏆 Campeonatos: ${totalCampeonatos}`

        );


        console.log(

            `⚽ Times cadastrados: ${totalTimes}`

        );


        console.log(

            `⚠️ Erros: ${erros}`

        );


        console.log(
            "================================"
        );





        return {


            campeonatos:
                totalCampeonatos,


            times:
                totalTimes,


            erros



        };





    }catch(error){



        console.error(

            "❌ Erro sincronização:",

            error.message

        );



        return {


            campeonatos:0,

            times:0,

            erros:1


        };


    }



}





// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    sincronizarSistema


};
