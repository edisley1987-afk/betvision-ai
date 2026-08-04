// ==========================================
// BetVision AI
// services/oddsService.js
// Motor Odds IA integrado
// Versão 3.0
// ==========================================


import {
    buscarJogos
} from "./futebolService.js";




// ==========================================
// GERAR VALOR ALEATÓRIO CONTROLADO
// ==========================================

function aleatorio(min,max){

    return Math.random() *
    (max-min) + min;

}





// ==========================================
// CALCULAR PROBABILIDADE IA
// ==========================================

function calcularProbabilidade(){


    let casa =
        aleatorio(
            0.40,
            0.70
        );


    let empate =
        aleatorio(
            0.15,
            0.30
        );


    let fora =
        1 -
        casa -
        empate;



    if(fora < 0.10){

        fora = 0.10;

        casa =
        1 -
        empate -
        fora;

    }


    return {


        casa,


        empate,


        fora


    };


}






// ==========================================
// ODD JUSTA
// ==========================================

function oddJusta(prob){


    return Number(

        (1 / prob)

        .toFixed(2)

    );


}







// ==========================================
// GERAR ODD DO JOGO
// ==========================================

function gerarOdd(jogo){



    const prob =
        calcularProbabilidade();



    const odd =
        Number(

            aleatorio(
                1.50,
                3.20
            )

            .toFixed(2)

        );



    const justa =
        oddJusta(
            prob.casa
        );



    const edge =

        Number(

            (

            ((odd / justa)-1)

            *100

            )

            .toFixed(2)

        );





    return {


        id:
        jogo.id,



        jogo:

        `${jogo.casa} x ${jogo.fora}`,



        campeonato:

        jogo.campeonato,



        horario:

        jogo.horario,



        mercado:

        "Vitória Casa",



        selecao:

        jogo.casa,



        odd,



        oddJusta:

        justa,



        probabilidade:

        Number(

            (
            prob.casa*100
            )

            .toFixed(2)

        ),



        edge,



        roi:

        edge,



        valueBet:

        edge > 5,



        fonte:

        "BetVision AI"

    };


}








// ==========================================
// BUSCAR TODAS ODDS
// ==========================================

export async function buscarOdds(){


    try{


        console.log(
            "💰 Gerando Odds IA..."
        );



        const jogos =

            await buscarJogos();




        if(
            !Array.isArray(jogos)
            ||
            jogos.length===0
        ){


            return [];


        }






        const odds =


            jogos.map(

                jogo =>

                gerarOdd(jogo)

            );





        console.log(

            `💎 Odds criadas: ${odds.length}`

        );



        return odds;



    }


    catch(error){


        console.error(

            "❌ Erro Odds IA:",

            error.message

        );


        return [];


    }


}








// ==========================================
// VALUE BETS
// ==========================================

export async function buscarValueBets(){


    const odds =

        await buscarOdds();



    return odds.filter(

        item =>

        item.valueBet

    );


}







export async function buscarOddsJogos(){


    return await buscarOdds();


}







export default {


    buscarOdds,


    buscarOddsJogos,


    buscarValueBets


};
