// ==========================================
// BetVision AI
// services/inteligenciaService.js
// Versão 8.0
// IA + Histórico + Odds + Value Bets
// ==========================================


import {
    buscarOddsReais
}
from "./providers/oddsApiProvider.js";



import {
    calcularValueBet
}
from "./valueBetService.js";



import {
    preverPartida
}
from "./predictionService.js";



import {
    buscarHistoricoJogo
}
from "./historicoService.js";






// ==========================================
// ANALISAR MERCADO
// ==========================================


export async function analisarMercado(){


    console.log(
        "🤖 Iniciando análise IA..."
    );



    try{



        const jogosBrutos =
            await buscarOddsReais();




        if(
            !Array.isArray(jogosBrutos)
            ||
            jogosBrutos.length === 0
        ){


            console.log(
                "⚠️ Nenhum jogo encontrado"
            );


            return [];


        }






        const resultados=[];






        for(const jogo of jogosBrutos){



            try{



                console.log(

                    "📊 Analisando:",

                    jogo.casa,

                    "x",

                    jogo.fora

                );






                /*
                ===============================
                HISTÓRICO
                ===============================
                */


                let historicoCasa=[];

                let historicoFora=[];





                const historico =

                    await buscarHistoricoJogo(

                        jogo.casa,

                        jogo.fora

                    );







                if(historico){


                    historicoCasa =

                        historico.casa?.jogos
                        ||
                        [];



                    historicoFora =

                        historico.fora?.jogos
                        ||
                        [];


                }








                /*
                ===============================
                OBJETO PARTIDA
                ===============================
                */


                const jogoAnalise={


                    id:

                        jogo.id
                        ||
                        Date.now(),



                    casa:

                        jogo.casa,



                    fora:

                        jogo.fora,



                    campeonato:

                        jogo.campeonato
                        ||
                        jogo.esporte
                        ||
                        "Futebol",



                    horario:

                        jogo.horario
                        ||
                        null



                };







                /*
                ===============================
                PREVISÃO IA
                ===============================
                */


                const previsao =

                    await preverPartida({


                        jogo:

                            jogoAnalise,


                        historicoCasa,


                        historicoFora



                    });









                /*
                ===============================
                MERCADOS
                ===============================
                */


                const mercados=[



                    {


                        selecao:

                            jogo.casa,


                        odd:

                            Number(
                                jogo.odds?.casa
                                ||
                                0
                            ),


                        probabilidade:

                            previsao.probabilidadeCasa



                    },



                    {


                        selecao:

                            "Empate",


                        odd:

                            Number(
                                jogo.odds?.empate
                                ||
                                0
                            ),


                        probabilidade:

                            previsao.probabilidadeEmpate



                    },



                    {


                        selecao:

                            jogo.fora,


                        odd:

                            Number(
                                jogo.odds?.fora
                                ||
                                0
                            ),


                        probabilidade:

                            previsao.probabilidadeFora



                    }


                ];








                /*
                ===============================
                VALUE BET
                ===============================
                */


                for(
                    const mercado
                    of mercados
                ){



                    if(
                        mercado.odd <= 0
                    ){

                        continue;

                    }






                    const value =

                        calcularValueBet({


                            jogo:

                                `${jogo.casa} x ${jogo.fora}`,



                            mercado:

                                "Resultado Final",



                            selecao:

                                mercado.selecao,



                            odd:

                                mercado.odd,



                            probabilidadeIA:

                                mercado.probabilidade



                        });







                    if(
                        value?.possuiValor
                    ){


                        resultados.push({


                            ...value,


                            campeonato:

                                jogoAnalise.campeonato,



                            horario:

                                jogoAnalise.horario,



                            previsao



                        });



                    }




                }






            }
            catch(errorJogo){



                console.error(

                    "❌ Erro analisando jogo:",

                    jogo.casa,

                    "x",

                    jogo.fora,

                    errorJogo.message

                );


            }



        }







        console.log(

            `🎯 Value Bets encontradas: ${resultados.length}`

        );




        return resultados;




    }
    catch(error){



        console.error(

            "❌ Erro inteligência:",

            error.message

        );



        return [];


    }


}








// ==========================================
// EXPORT
// ==========================================


export default {


    analisarMercado


};
