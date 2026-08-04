// ==========================================
// BetVision AI
// services/inteligenciaService.js
// Versão corrigida 7.0
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

export async function analisarMercado() {


    console.log(
        "🤖 Iniciando análise IA..."
    );


    try {


        const jogosBrutos =

            await buscarOddsReais();



        if (

            !Array.isArray(jogosBrutos) ||

            jogosBrutos.length === 0

        ) {


            console.log(
                "⚠️ Nenhum jogo encontrado"
            );


            return [];

        }



        const resultados = [];



        for (const jogo of jogosBrutos) {


            try {


                console.log(
                    "📊 Analisando:",
                    jogo.casa,
                    "x",
                    jogo.fora
                );



                let historicoCasa = [];

                let historicoFora = [];



                // ===============================
                // BUSCAR HISTÓRICO
                // ===============================


                try {


                    const historico =

                        await buscarHistoricoJogo(

                            jogo.casa,

                            jogo.fora

                        );



                    historicoCasa =

                        Array.isArray(
                            historico?.historicoCasa
                        )

                        ?

                        historico.historicoCasa

                        :

                        [];



                    historicoFora =

                        Array.isArray(
                            historico?.historicoFora
                        )

                        ?

                        historico.historicoFora

                        :

                        [];



                }

                catch (erro) {


                    console.log(

                        "⚠️ Histórico indisponível:",
                        erro.message

                    );


                }




                // ===============================
                // OBJETO PADRÃO DO JOGO
                // ===============================


                const jogoAnalise = {


                    id:
                        jogo.id || Date.now(),


                    casa:
                        jogo.casa,


                    fora:
                        jogo.fora,


                    campeonato:
                        jogo.esporte || "Futebol",


                    pais:
                        jogo.pais || "",


                    horario:
                        jogo.horario || null


                };




                // ===============================
                // MOTOR DE PREVISÃO IA
                // ===============================


                const previsao =


                    preverPartida({


                        jogo:
                            jogoAnalise,


                        historicoCasa,


                        historicoFora


                    });





                // ===============================
                // MERCADOS
                // ===============================


                const mercados = [


                    {

                        selecao:
                            jogo.casa,


                        odd:
                            Number(
                                jogo.odds?.casa || 0
                            ),


                        probabilidade:
                            previsao.probabilidadeCasa

                    },


                    {

                        selecao:
                            "Empate",


                        odd:
                            Number(
                                jogo.odds?.empate || 0
                            ),


                        probabilidade:
                            previsao.probabilidadeEmpate

                    },


                    {

                        selecao:
                            jogo.fora,


                        odd:
                            Number(
                                jogo.odds?.fora || 0
                            ),


                        probabilidade:
                            previsao.probabilidadeFora

                    }


                ];





                // ===============================
                // CALCULAR VALUE BET
                // ===============================


                for (const mercado of mercados) {



                    if (

                        mercado.odd <= 0

                    ) {


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





                    if (

                        value?.possuiValor

                    ) {


                        resultados.push({


                            ...value,


                            campeonato:

                                jogo.esporte || "Futebol",


                            horario:

                                jogo.horario,


                            previsao


                        });


                    }



                }



            }

            catch (erroJogo) {


                console.error(

                    "❌ Erro analisando jogo:",

                    jogo.casa,

                    "x",

                    jogo.fora,

                    erroJogo.message

                );


            }



        }




        console.log(

            `🎯 Value Bets encontradas: ${resultados.length}`

        );



        return resultados;



    }

    catch (erro) {


        console.error(

            "Erro inteligência:",

            erro.message

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
