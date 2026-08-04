// ==========================================
// BetVision AI
// services/sincronizacaoService.js
// Sincronização Campeonatos + Times
// Versão 10.0
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
// DELAY
// ==========================================

function esperar(ms){

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );

}






// ==========================================
// SINCRONIZAÇÃO PRINCIPAL
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
        ===============================
        BUSCA CAMPEONATOS
        ===============================
        */


        const campeonatos =
            await buscarCampeonatos();



        if(!Array.isArray(campeonatos)){


            throw new Error(
                "Campeonatos inválidos"
            );


        }



        console.log(

            `🏆 Campeonatos encontrados: ${campeonatos.length}`

        );






        /*
        ===============================
        TIMES EXISTENTES
        ===============================
        */


        const timesExistentes =
            await listarTimes();



        const idsTimes =
            new Set(

                timesExistentes.map(
                    time => time.id
                )

            );







        /*
        ===============================
        PROCESSAR CAMPEONATOS
        ===============================
        */


        for(const campeonato of campeonatos){



            try{


                console.log(
                    `🏆 ${campeonato.nome}`
                );



                await inserirCampeonato(
                    campeonato
                );



                totalCampeonatos++;






                /*
                ===============================
                BUSCAR TIMES
                ===============================
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



                        // evita duplicação

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
                                time.pais || ""


                        });





                        idsTimes.add(
                            time.id
                        );



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





                    await esperar(150);



                }






                /*
                ===============================
                CONTROLE API
                ===============================
                */


                await esperar(12000);





            }
            catch(error){



                erros++;


                console.error(

                    `Erro campeonato ${campeonato.nome}:`,
                    error.message

                );




                /*
                Se API limitar
                */


                if(
                    error.response?.status === 429
                ){

                    console.log(
                        "⏳ Aguardando limite API..."
                    );


                    await esperar(15000);


                }



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

                `${totalCampeonatos} campeonatos sincronizados`


        };






    }
    catch(error){



        console.error(

            "❌ Erro sincronização:",

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
