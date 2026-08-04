// ==========================================
// BetVision AI
// services/sincronizacaoService.js
// Sincronização Campeonatos + Times
// Versão 9.0
// ==========================================


import { buscarCampeonatos }
from "./campeonatoService.js";


import { buscarTimes }
from "./timesService.js";


import {
    inserirCampeonato,
    inserirTime
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


        const campeonatos =
            await buscarCampeonatos();



        if(
            !Array.isArray(campeonatos)
        ){

            throw new Error(
                "Campeonatos inválidos"
            );

        }




        console.log(

            `🏆 Campeonatos encontrados: ${campeonatos.length}`

        );





        for(const campeonato of campeonatos){



            try{



                console.log(
                    `🏆 ${campeonato.nome}`
                );



                // salva campeonato

                await inserirCampeonato(
                    campeonato
                );


                totalCampeonatos++;






                /*
                ==============================
                BUSCAR TIMES
                ==============================
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


                        await inserirTime({

                            id:
                                time.id,


                            campeonato_id:
                                campeonato.id,


                            nome:
                                time.nome,


                            pais:
                                time.pais || ""

                        });



                        totalTimes++;



                    }
                    catch(error){


                        erros++;


                        console.error(

                            "Erro salvar time:",
                            time.nome,
                            error.message

                        );


                    }




                    // evita sobrecarga banco

                    await esperar(100);



                }





                /*
                ===============================
                ESPERA API FOOTBALL-DATA
                ===============================
                */


                await esperar(3000);



            }
            catch(error){


                erros++;


                console.error(

                    `Erro campeonato ${campeonato.nome}:`,
                    error.message

                );


                await esperar(5000);


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




    }
    catch(error){



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




export default {


    sincronizarSistema


};
