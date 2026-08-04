// ==========================================
// BetVision AI
// services/sincronizacaoService.js
// Versão 7.0
// Campeonatos + Times
// ==========================================


import {

    buscarCampeonatos

} from "./campeonatoService.js";


import {

    buscarTimes

} from "./timesService.js";


import {

    inserirCampeonato,

    inserirTime

} from "./bancoService.js";




// ==========================================
// SINCRONIZAR SISTEMA COMPLETO
// ==========================================


export async function sincronizarSistema(){


    console.log(
        "🌎 Iniciando sincronização completa..."
    );



    let totalCampeonatos = 0;

    let totalTimes = 0;

    let erros = 0;



    try {



        // ==============================
        // CAMPEONATOS
        // ==============================


        const campeonatos =

            await buscarCampeonatos();



        if(!Array.isArray(campeonatos)){


            throw new Error(

                "Lista de campeonatos inválida"

            );


        }



        console.log(

            `📦 ${campeonatos.length} campeonatos encontrados`

        );




        for(const campeonato of campeonatos){



            try{


                await inserirCampeonato(

                    campeonato

                );


                totalCampeonatos++;




                // ==============================
                // TIMES
                // ==============================


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

                            time.pais


                        });



                        totalTimes++;



                    }

                    catch(erro){


                        erros++;


                        console.error(

                            "Erro inserir time:",

                            time.nome

                        );


                    }



                }




            }

            catch(erro){


                erros++;


                console.error(

                    `Erro campeonato ${campeonato.nome}:`,

                    erro.message

                );


            }



        }




        console.log(
            "================================"
        );


        console.log(
            "✅ Sincronização concluída"
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

    catch(erro){


        console.error(

            "❌ Falha sincronização:",

            erro.message

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
