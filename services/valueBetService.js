// ==========================================
// BetVision AI
// services/valueBetService.js
// Versão 6.0
// Motor Value Bets + Odds Reais
// ==========================================


import db from "../database/database.js";


import {
    listarAnalises
}
from "./inteligenciaService.js";


import {
    buscarOddsJogo
}
from "./oddsService.js";




// ==========================================
// CONFIGURAÇÃO
// ==========================================


const EDGE_MINIMO = 5;


const ODD_MINIMA = 1.30;


const ODD_MAXIMA = 8.00;






// ==========================================
// NORMALIZAÇÃO
// ==========================================


function numero(valor){


    const n = Number(valor);


    return Number.isFinite(n)

        ? n

        : 0;


}






// ==========================================
// ODD JUSTA
// ==========================================


function calcularOddJusta(probabilidade){


    if(

        probabilidade <= 0

    ){

        return 0;

    }



    return Number(

        (

            100 /

            probabilidade

        )

        .toFixed(2)

    );


}






// ==========================================
// EDGE
// ==========================================


function calcularEdge(

    oddMercado,

    oddJusta

){


    if(

        oddMercado <= 0 ||

        oddJusta <= 0

    ){

        return 0;

    }




    return Number(

        (

            (

                oddMercado /

                oddJusta

            )

            -1

        )

        *

        100

    )

    .toFixed(2);


}






// ==========================================
// CLASSIFICAÇÃO
// ==========================================


function nivelValue(edge){


    if(edge >= 20){

        return "⭐⭐⭐⭐ Muito Boa";

    }


    if(edge >= 10){

        return "⭐⭐⭐ Boa";

    }


    if(edge >= 5){

        return "⭐⭐ Moderada";

    }


    return "Sem Valor";


}






// ==========================================
// KELLY
// ==========================================


function calcularKelly(

    probabilidade,

    odd

){


    const p =

        probabilidade / 100;



    const q =

        1-p;



    const b =

        odd - 1;




    if(b <=0){

        return 0;

    }



    let kelly =

        (

            (

                b*p

            )

            -

            q

        )

        /

        b;



    if(kelly <0){

        kelly=0;

    }




    // proteção banca

    if(kelly >0.10){

        kelly=0.10;

    }



    return Number(

        (

            kelly*100

        )

        .toFixed(2)

    );


}
// ==========================================
// CALCULAR VALUE BETS
// Odds reais + IA
// ==========================================


export async function calcularValueBets(){


    try{


        console.log(
            "💎 Calculando Value Bets..."
        );



        const analises =

            await listarAnalises();





        if(

            !Array.isArray(analises)

            ||

            analises.length === 0

        ){


            console.log(

                "⚠️ Nenhuma análise IA encontrada"

            );


            return [];


        }





        const resultados=[];







        for(

            const analise of analises

        ){



            const probCasa =

                numero(

                    analise.probabilidade_casa

                );



            const probFora =

                numero(

                    analise.probabilidade_fora

                );




            let probabilidade;

            let mercado;

            let selecao;







            if(

                probCasa >= probFora

            ){



                mercado =

                    "Vitória Casa";



                selecao =

                    analise.jogo

                    ?

                    analise.jogo.split(" x ")[0]

                    :

                    "Casa";



                probabilidade =

                    probCasa;



            }

            else{



                mercado =

                    "Vitória Fora";



                selecao =

                    analise.jogo

                    ?

                    analise.jogo.split(" x ")[1]

                    :

                    "Fora";



                probabilidade =

                    probFora;



            }









            const oddJusta =

                calcularOddJusta(

                    probabilidade

                );







            /*
            
            Buscar odd real cadastrada

            */


            let odds=[];





            if(

                analise.jogo_id

            ){


                odds =

                    await buscarOddsJogo(

                        analise.jogo_id

                    );


            }







            /*
            
            Caso ainda não exista API de odds,
            não gerar odd falsa como real.

            */


            if(

                !Array.isArray(odds)

                ||

                odds.length===0

            ){


                continue;


            }









            for(

                const odd of odds

            ){





                const oddMercado =

                    numero(

                        odd.odd

                    );






                if(

                    oddMercado < ODD_MINIMA

                    ||

                    oddMercado > ODD_MAXIMA

                ){


                    continue;


                }







                const edge =

                    calcularEdge(

                        oddMercado,

                        oddJusta

                    );






                if(

                    edge < EDGE_MINIMO

                ){


                    continue;


                }








                const roi =

                    Number(

                        (

                            (

                                (

                                    probabilidade /100

                                )

                                *

                                oddMercado

                                -

                                1

                            )

                            *

                            100

                        )

                        .toFixed(2)

                    );







                const kelly =

                    calcularKelly(

                        probabilidade,

                        oddMercado

                    );







                resultados.push({



                    jogo:

                    analise.jogo,



                    jogo_id:

                    analise.jogo_id,



                    mercado,



                    selecao,



                    bookmaker:

                    odd.bookmaker || "Não informado",




                    odd:

                    oddMercado,



                    oddMercado,



                    oddJusta,



                    probabilidade,



                    edge,



                    roi,



                    kelly,



                    valueBet:true,



                    classificacao:

                    nivelValue(

                        edge

                    ),



                    fonte:

                    odd.bookmaker

                    ?

                    "API Odds"

                    :

                    "BetVision AI"




                });



            }



        }







        resultados.sort(

            (a,b)=>

            b.edge-a.edge

        );







        console.log(

            `💎 ${resultados.length} Value Bets encontradas`

        );






        return resultados;



    }


    catch(error){



        console.error(

            "❌ Erro Value Bets:",

            error.message

        );



        return [];

    }


}
// ==========================================
// COMPATIBILIDADE COM ROTAS ANTIGAS
// ==========================================


export async function gerarValueBets(){


    return await calcularValueBets();


}







// ==========================================
// SALVAR VALUE BETS NO BANCO
// ==========================================


export async function salvarValueBets(){


    try{


        const valueBets =

            await calcularValueBets();





        if(

            !Array.isArray(valueBets)

            ||

            valueBets.length===0

        ){


            console.log(

                "💎 Nenhuma Value Bet para salvar"

            );


            return [];


        }







        for(

            const bet of valueBets

        ){



            await db.query(`


                INSERT INTO valuebets


                (


                    jogo,


                    mercado,


                    selecao,


                    odd_mercado,


                    odd_justa,


                    probabilidade,


                    edge,


                    roi,


                    kelly,


                    classificacao,


                    bookmaker,


                    origem


                )


                VALUES


                (

                    $1,

                    $2,

                    $3,

                    $4,

                    $5,

                    $6,

                    $7,

                    $8,

                    $9,

                    $10,

                    $11,

                    $12

                )


            `,[



                bet.jogo,


                bet.mercado,


                bet.selecao,


                bet.oddMercado,


                bet.oddJusta,


                bet.probabilidade,


                bet.edge,


                bet.roi,


                bet.kelly,


                bet.classificacao,


                bet.bookmaker,


                bet.fonte



            ]);




        }







        console.log(

            `💎 ${valueBets.length} Value Bets salvas`

        );






        return valueBets;




    }


    catch(error){



        console.error(

            "❌ Erro salvar Value Bets:",

            error.message

        );



        return [];

    }


}








// ==========================================
// LISTAR VALUE BETS
// ==========================================


export async function listarValueBets(){


    try{


        const resultado =

        await db.query(`



            SELECT *


            FROM valuebets


            ORDER BY id DESC


            LIMIT 50



        `);






        return resultado.rows || [];



    }


    catch(error){



        console.error(

            "❌ Erro listar Value Bets:",

            error.message

        );



        return [];

    }


}








// ==========================================
// LIMPAR VALUE BETS ANTIGAS
// ==========================================


export async function limparValueBets(){


    try{



        await db.query(`



            DELETE FROM valuebets


            WHERE criado_em <

            NOW() - INTERVAL '30 days'



        `);






        console.log(

            "🧹 Value Bets antigas removidas"

        );




    }


    catch(error){



        console.error(

            "❌ Erro limpar Value Bets:",

            error.message

        );


    }


}








// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {



    calcularValueBets,


    gerarValueBets,


    salvarValueBets,


    listarValueBets,


    limparValueBets



};
