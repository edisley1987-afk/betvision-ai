// ==========================================
// BetVision AI
// services/oddsService.js
// Normalizador de Odds
// Versão IA 2.0
// ==========================================


import {

    buscarOddsReais,
    buscarOddsJogo

} from "./providers/oddsApiProvider.js";



// ==========================================
// CALCULAR MÉDIA DAS ODDS
// ==========================================


function calcularMedia(valores = []){


    if(!valores.length){

        return 0;

    }


    const soma =
        valores.reduce(
            (a,b)=>a+b,
            0
        );


    return Number(
        (soma / valores.length)
        .toFixed(2)
    );


}



// ==========================================
// NORMALIZAR UM JOGO
// ==========================================


function normalizarOdds(jogo){


    const casa = [];
    const empate = [];
    const fora = [];



    jogo.bookmakers?.forEach(bookmaker=>{


        bookmaker.mercados?.forEach(mercado=>{


            if(
                mercado.tipo !== "h2h"
            ){

                return;

            }



            mercado.selecoes?.forEach(sel=>{


                if(
                    sel.name === jogo.casa
                ){

                    casa.push(
                        Number(sel.price)
                    );

                }



                else if(
                    sel.name === jogo.fora
                ){

                    fora.push(
                        Number(sel.price)
                    );

                }



                else if(
                    sel.name === "Draw"
                ){

                    empate.push(
                        Number(sel.price)
                    );

                }


            });


        });


    });



    const oddCasa =
        calcularMedia(casa);


    const oddEmpate =
        calcularMedia(empate);


    const oddFora =
        calcularMedia(fora);



    const probCasa =
        oddCasa
        ?
        1 / oddCasa
        :
        0;



    const probEmpate =
        oddEmpate
        ?
        1 / oddEmpate
        :
        0;



    const probFora =
        oddFora
        ?
        1 / oddFora
        :
        0;



    const margem =
        probCasa +
        probEmpate +
        probFora;



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



        odds:{


            casa:
            oddCasa,


            empate:
            oddEmpate,


            fora:
            oddFora


        },



        probabilidades:{


            casa:
            Number(
                (
                probCasa / margem * 100
                )
                .toFixed(2)
            ),



            empate:
            Number(
                (
                probEmpate / margem * 100
                )
                .toFixed(2)
            ),



            fora:
            Number(
                (
                probFora / margem * 100
                )
                .toFixed(2)
            )


        }



    };


}





// ==========================================
// BUSCAR UMA ODD
// ==========================================


export async function buscarOdds(
    idJogo=null
){


    try{


        if(idJogo){


            const jogo =
            await buscarOddsJogo(
                idJogo
            );


            return normalizarOdds(jogo);


        }



        const jogos =
        await buscarOddsReais();



        if(!jogos.length){


            return null;


        }



        return normalizarOdds(
            jogos[0]
        );



    }
    catch(error){


        console.error(
            "❌ Erro buscarOdds:",
            error.message
        );


        return null;


    }


}





// ==========================================
// BUSCAR TODOS OS JOGOS
// ==========================================


export async function buscarOddsJogos(){


    try{


        const jogos =
        await buscarOddsReais();



        return jogos.map(
            jogo =>
            normalizarOdds(jogo)
        );



    }
    catch(error){


        console.error(
            "❌ Erro buscarOddsJogos:",
            error.message
        );


        return [];


    }


}




export default {


    buscarOdds,

    buscarOddsJogos


};
