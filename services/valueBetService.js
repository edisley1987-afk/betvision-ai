// ==========================================
// BetVision AI
// services/valueBetService.js
// Versão 6.0
// Motor Value Bets Profissional
// Preparado para Odds Reais
// ==========================================


import db from "../database/database.js";


import {
    listarAnalises
}
from "./inteligenciaService.js";





// ==========================================
// CONFIGURAÇÃO
// ==========================================


const EDGE_MINIMO = 5;


const ODD_MINIMA = 1.30;


const ODD_MAXIMA = 10.00;





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
// ODD JUSTA IA
//
// Probabilidade 60%
// Odd justa = 100 / 60
// Resultado 1.66
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
// EDGE REAL
//
// Quanto a odd mercado
// está acima da odd justa
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

            -

            1

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



    if(

        edge >= 25

    ){

        return "⭐⭐⭐⭐⭐ Excelente";

    }




    if(

        edge >= 15

    ){

        return "⭐⭐⭐⭐ Muito Boa";

    }




    if(

        edge >= 10

    ){

        return "⭐⭐⭐ Boa";

    }




    if(

        edge >= 5

    ){

        return "⭐⭐ Moderada";

    }




    return "Sem Valor";


}









// ==========================================
// KELLY CRITÉRIO
// Gestão de banca
// ==========================================


function calcularKelly(

    probabilidade,

    odd

){



    const p =

        probabilidade / 100;



    const q =

        1 - p;



    const b =

        odd - 1;




    if(

        b <= 0

    ){

        return 0;

    }






    let kelly =


        (

            (

                b *

                p

            )

            -

            q

        )

        /

        b;






    if(

        kelly < 0

    ){

        kelly = 0;

    }




    // segurança máxima 10%

    if(

        kelly > 0.10

    ){

        kelly = 0.10;

    }




    return Number(

        (

            kelly *

            100

        )

        .toFixed(2)

    );


}
// ==========================================
// GERAR VALUE BETS
// Motor principal
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

                "⚠️ Nenhuma análise disponível"

            );


            return [];

        }







        const resultados = [];






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






            let probabilidade = 0;


            let mercado = "";






            // ==================================
            // ESCOLHER FAVORITO
            // ==================================


            if(

                probCasa >= probFora

            ){


                probabilidade = probCasa;


                mercado =

                "Vitória Casa";


            }

            else{


                probabilidade = probFora;


                mercado =

                "Vitória Fora";


            }







            if(

                probabilidade <= 0

            ){

                continue;

            }







            const oddJusta =

                calcularOddJusta(

                    probabilidade

                );







            /*
            
            IMPORTANTE

            Neste momento não existe
            API de odds conectada.

            Portanto não vamos criar
            odds falsas.

            A Value Bet somente será
            criada quando existir
            odd real.

            */


            const oddMercado =

                numero(

                    analise.odd_mercado

                );







            if(

                oddMercado <= 0

            ){


                continue;


            }







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







            const kelly =

                calcularKelly(

                    probabilidade,

                    oddMercado

                );







            const roi =

                Number(

                    (

                        (

                            (

                                probabilidade /

                                100

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







            resultados.push({



                jogo:

                analise.jogo,




                mercado,




                probabilidade,




                oddMercado,




                oddJusta,




                edge,




                roi,




                kelly,




                classificacao:

                nivelValue(

                    edge

                ),




                origem:

                "Modelo IA + Odds Real"




            });




        }







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

            valueBets.length === 0

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

                    odd_mercado,

                    odd_justa,

                    edge,

                    roi,

                    kelly,

                    classificacao,

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

                    $9

                )


            `,[



                bet.jogo,



                bet.mercado,



                bet.oddMercado,



                bet.oddJusta,



                bet.edge,



                bet.roi,



                bet.kelly,



                bet.classificacao,



                bet.origem



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
