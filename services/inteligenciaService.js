// ==========================================
// BetVision AI
// services/inteligenciaService.js
// Integração IA + Histórico + Odds + Value Bets
// ==========================================


import {
    buscarOddsReais
} from "./providers/oddsApiProvider.js";


import {
    calcularValueBet
} from "./valueBetService.js";


import {
    preverPartida
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



        const jogos =
            jogosBrutos.map(jogo=>{


                return {


                    id:
                    jogo.id,


                    esporte:
                    jogo.esporte,


                    horario:
                    jogo.horario,


                    casa:
                    jogo.casa,


                    fora:
                    jogo.fora,


                    odds:
                    jogo.odds || {


                        casa:0,

                        empate:0,

                        fora:0


                    }


                };


            });




        if(!jogos.length){


            console.log(
                "⚠️ Nenhum jogo para analisar"
            );


            return [];


        }



        const resultados=[];



        for(const jogo of jogos){



            console.log(

                "📊 Analisando:",
                jogo.casa,
                "x",
                jogo.fora

            );




            // ==============================
            // BUSCA HISTÓRICO DOS TIMES
            // ==============================


            const {

                historicoCasa,

                historicoFora


            } = await buscarHistoricoJogo(

                jogo.casa,

                jogo.fora

            );





            // ==============================
            // MOTOR DE PREVISÃO IA
            // ==============================


            const previsao =

    previsaoRapida({

        id:jogo.id,

        casa:jogo.casa,

        fora:jogo.fora,

        campeonato:jogo.esporte,

        horario:jogo.horario

    });

                    historicoCasa,


                    historicoFora


                });







            const mercados=[



                {


                    selecao:
                    jogo.casa,


                    odd:
                    jogo.odds.casa,


                    probabilidade:
                    previsao.probabilidadeCasa


                },



                {


                    selecao:
                    "Empate",


                    odd:
                    jogo.odds.empate,


                    probabilidade:
                    previsao.probabilidadeEmpate


                },



                {


                    selecao:
                    jogo.fora,


                    odd:
                    jogo.odds.fora,


                    probabilidade:
                    previsao.probabilidadeFora


                }



            ];







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






export default {


    analisarMercado


};
