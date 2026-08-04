// ==========================================
// BetVision AI
// services/sincronizacaoService.js
// Versão 11.0
// Sincronização Football-Data.org
// Campeonatos + Times
// ==========================================


import {

    buscarCompeticoes,

    buscarTimesCompeticao,

    normalizarTime

}
from "./apiFootballService.js";



import {

    inserirCampeonato,

    inserirTime,

    listarTimes

}
from "./bancoService.js";






// ==========================================
// DELAY
// ==========================================


function esperar(ms){


    return new Promise(resolve =>

        setTimeout(resolve, ms)

    );


}






// ==========================================
// SINCRONIZAÇÃO
// ==========================================


export async function sincronizarSistema(){



    console.log("================================");

    console.log(
        "🌎 INICIANDO SINCRONIZAÇÃO"
    );

    console.log("================================");




    let totalCampeonatos = 0;

    let totalTimes = 0;

    let erros = 0;





    try{



        /*
        ==================================
        BUSCAR CAMPEONATOS
        ==================================
        */


        const campeonatosAPI =

            await buscarCompeticoes();




        if(

            !Array.isArray(campeonatosAPI)

        ){


            throw new Error(

                "Nenhum campeonato retornado pela API"

            );


        }





        console.log(

            `🏆 Campeonatos encontrados: ${campeonatosAPI.length}`

        );








        /*
        ==================================
        TIMES JÁ SALVOS
        ==================================
        */


        const timesBanco =

            await listarTimes();




        const idsTimes =

            new Set(

                timesBanco.map(

                    t => Number(t.id)

                )

            );








        /*
        ==================================
        PROCESSAR CAMPEONATOS
        ==================================
        */


        for(

            const campeonatoAPI of campeonatosAPI

        ){



            try{





                const campeonato = {



                    id:

                        campeonatoAPI.id,



                    nome:

                        campeonatoAPI.name || 
                        "Sem nome",



                    pais:

                        campeonatoAPI.area?.name || "",



                    codigo:

                        campeonatoAPI.code || ""



                };








                console.log(

                    `🏆 ${campeonato.nome}`

                );






                await inserirCampeonato(

                    campeonato

                );



                totalCampeonatos++;









                /*
                =============================
                BUSCAR TIMES
                =============================
                */



                const timesAPI =


                    await buscarTimesCompeticao(

                        campeonato.id

                    );






                console.log(

                    `⚽ ${timesAPI.length} times encontrados`

                );








                for(

                    const item of timesAPI

                ){



                    try{



                        const time =

                            normalizarTime(

                                item

                            );





                        if(

                            idsTimes.has(

                                Number(time.id)

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

                            Number(time.id)

                        );



                        totalTimes++;





                    }

                    catch(error){



                        erros++;


                        console.error(

                            "❌ Erro salvar time:",

                            error.message

                        );


                    }







                    await esperar(200);




                }









                /*
                ==================================
                CONTROLE API
                ==================================
                */


                await esperar(1000);





            }


            catch(error){



                erros++;



                console.error(

                    "❌ Erro campeonato:",

                    campeonatoAPI.name,

                    error.message

                );




            }





        }









        console.log("================================");


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



        console.log("================================");








        return {



            sucesso:true,


            campeonatos:

                totalCampeonatos,


            times:

                totalTimes,


            erros,



            mensagem:

                "Sincronização concluída"



        };







    }



    catch(error){



        console.error(

            "❌ Falha sincronização:",

            error.message

        );




        return {



            sucesso:false,


            campeonatos:0,


            times:0,


            erros:1,


            mensagem:

                error.message



        };



    }



}







// ==========================================
// EXPORT
// ==========================================


export default {


    sincronizarSistema


};
