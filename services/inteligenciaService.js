// ==========================================
// BetVision AI
// services/inteligenciaService.js
// Integração IA + Histórico + Odds + Value Bets
// Versão corrigida 8.0
// ==========================================


import {

    buscarOddsReais

} from "./providers/oddsApiProvider.js";



import {

    calcularValueBet

} from "./valueBetService.js";



import {
    previsaoRapida
} from "./predictionService.js";


import {

    buscarHistoricoJogo

} from "./historicoService.js";





// ==========================================
// ANALISAR MERCADO
// ==========================================


export async function analisarMercado(){


    try{


        console.log(

            "🤖 Iniciando análise IA..."

        );





        const jogosBrutos =

            await buscarOddsReais();





        if(

            !Array.isArray(jogosBrutos) ||

            jogosBrutos.length === 0

        ){


            console.log(

                "⚠️ Nenhum jogo encontrado"

            );


            return [];


        }





        const resultados = [];





        for(const jogo of jogosBrutos){



            console.log(

                "📊 Analisando:",

                jogo.casa,

                "x",

                jogo.fora

            );





            // ==================================
            // HISTÓRICO DOS TIMES
            // ==================================


            const {


                historicoCasa,


                historicoFora



            } = await buscarHistoricoJogo(


                jogo.casa,


                jogo.fora


            );







            // ==================================
            // MOTOR DE PREVISÃO IA
            // ==================================


          const previsao =

    previsaoRapida({

        id: jogo.id,

        casa: jogo.casa,

        fora: jogo.fora,

        campeonato: jogo.esporte,

        horario: jogo.horario,

        historicoCasa,

        historicoFora

    });

            // ==================================
            // MERCADOS ANALISADOS
            // ==================================


            const mercados = [



                {


                    selecao:

                    jogo.casa,


                    odd:

                    jogo.odds?.casa || 0,


                    probabilidade:

                    previsao.probabilidadeCasa



                },



                {


                    selecao:

                    "Empate",


                    odd:

                    jogo.odds?.empate || 0,


                    probabilidade:

                    previsao.probabilidadeEmpate



                },



                {


                    selecao:

                    jogo.fora,


                    odd:

                    jogo.odds?.fora || 0,


                    probabilidade:

                    previsao.probabilidadeFora



                }



            ];







            // ==================================
            // CALCULAR VALUE BET
            // ==================================


            for(const mercado of mercados){



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







                if(value.possuiValor){



                    resultados.push({



                        ...value,



                        campeonato:

                        jogo.esporte,



                        horario:

                        jogo.horario,



                        previsao



                    });



                }



            }




        }







        console.log(


            `🎯 Value Bets encontradas: ${resultados.length}`


        );







        return resultados;





    }


    catch(error){



        console.error(


            "Erro inteligência:",


            error.message


        );



        return [];



    }



}






// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    analisarMercado


};
