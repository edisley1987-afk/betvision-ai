// ==========================================
// BetVision AI
// services/oddsService.js
// Motor de Odds + Value Bets IA
// Versão 9.0
// ==========================================


import {
    buscarJogos
} from "./futebolService.js";





// ==========================================
// GERAR NÚMERO ALEATÓRIO CONTROLADO
// ==========================================


function variar(min, max){


    return Math.random() *

    (max - min)

    + min;


}







// ==========================================
// PROBABILIDADE NORMALIZADA
// ==========================================


function normalizar(valor){


    return Number(

        valor.toFixed(2)

    );


}







// ==========================================
// CALCULAR PROBABILIDADES IA
// ==========================================


function calcularProbabilidades(jogo){



    let casa = variar(

        0.35,

        0.65

    );



    let empate = variar(

        0.20,

        0.32

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


        casa:

            normalizar(casa),



        empate:

            normalizar(empate),



        fora:

            normalizar(fora)



    };



}









// ==========================================
// CALCULAR ODDS JUSTAS
// ==========================================


function calcularOddJusta(probabilidade){


    if(probabilidade <= 0)

        return 0;



    return Number(

        (

            1 /

            probabilidade

        )

        .toFixed(2)

    );


}









// ==========================================
// GERAR ODDS ARTIFICIAIS
// ==========================================


function gerarMercados(jogo){



    const probabilidades =

        calcularProbabilidades(jogo);





    const mercadoCasa = {



        id:

            jogo.id,



        jogo:


            `${jogo.casa} x ${jogo.fora}`,



        campeonato:

            jogo.campeonato,



        mercado:

            "Vitória Casa",



        selecao:

            jogo.casa,



        probabilidade:


            Number(

                (

                probabilidades.casa *

                100

                )

                .toFixed(1)

            ),





        oddJusta:


            calcularOddJusta(

                probabilidades.casa

            ),





        odd:


            Number(

                variar(

                    1.50,

                    3.50

                )

                .toFixed(2)

            ),





        fonte:

            "BetVision AI"

    };






    const edge =


        (

            mercadoCasa.odd /

            mercadoCasa.oddJusta

        -

        1

        )

        *100;





    mercadoCasa.edge =

        Number(

            edge.toFixed(1)

        );





    mercadoCasa.valueBet =


        mercadoCasa.edge > 5;






    mercadoCasa.roi =

        mercadoCasa.edge;





    return mercadoCasa;



}









// ==========================================
// BUSCAR ODDS
// ==========================================


export async function buscarOdds(){



    try{



        console.log(

            "💰 Gerando odds BetVision AI..."

        );





        const jogos =

            await buscarJogos();





        console.log(

            `⚽ Jogos recebidos: ${jogos.length}`

        );





        if(!jogos ||

            jogos.length === 0){



            console.log(

                "⚠️ Nenhum jogo para calcular odds"

            );



            return [];

        }







        const odds =


            jogos.map(

                jogo =>

                    gerarMercados(jogo)

            );







        console.log(

            `💎 Odds geradas: ${odds.length}`

        );





        return odds;





    }


    catch(error){



        console.error(

            "❌ Erro gerar odds:",

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

            item.valueBet === true

    );



}









// ==========================================
// EXPORT
// ==========================================


export default {


    buscarOdds,


    buscarValueBets


};
