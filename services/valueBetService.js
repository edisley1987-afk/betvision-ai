// ==========================================
// BetVision AI
// services/valueBetService.js
// Versão 8.0
// Engine profissional de Value Bets
// ==========================================


/**
 * Motor de cálculo Value Bets
 *
 * Entrada:
 *  - odd mercado
 *  - probabilidade IA
 *
 * Saída:
 *  - odd justa
 *  - edge
 *  - ROI
 *  - EV
 *  - Kelly
 *  - classificação
 *  - valueBet
 */



// ==========================================
// UTILIDADE
// ==========================================


function numero(valor){


    const n = Number(valor);


    return Number.isFinite(n)
        ?
        n
        :
        0;


}




// ==========================================
// PROBABILIDADE MERCADO
// ==========================================


export function probabilidadeMercado(odd){


    odd = numero(odd);



    if(odd <= 0){

        return 0;

    }



    return Number(

        (
            100 / odd
        )
        .toFixed(2)

    );


}




// ==========================================
// ODD JUSTA IA
// ==========================================


export function calcularOddJusta(probabilidadeIA){


    probabilidadeIA =
        numero(probabilidadeIA);



    if(probabilidadeIA <= 0){

        return 0;

    }



    return Number(

        (
            100 /
            probabilidadeIA

        )
        .toFixed(2)

    );


}





// ==========================================
// EDGE
// ==========================================


export function calcularEdge(

    probabilidadeIA,

    odd

){


    const mercado =

        probabilidadeMercado(
            odd
        );



    return Number(

        (

            numero(probabilidadeIA)

            -

            mercado

        )
        .toFixed(2)

    );


}




// ==========================================
// EXPECTED VALUE
// ==========================================


export function calcularEV(

    probabilidadeIA,

    odd

){


    odd =
        numero(odd);



    if(odd <= 0){

        return 0;

    }



    const p =

        numero(probabilidadeIA)
        /
        100;



    return Number(

        (

            (p * odd)
            -
            1

        )
        .toFixed(4)

    );


}




// ==========================================
// ROI
// ==========================================


export function calcularROI(

    probabilidadeIA,

    odd

){


    return Number(

        (

            calcularEV(

                probabilidadeIA,

                odd

            )

            *

            100

        )
        .toFixed(2)

    );


}





// ==========================================
// KELLY
// ==========================================


export function calcularKelly(

    probabilidadeIA,

    odd

){


    odd =
        numero(odd);



    if(odd <= 1){

        return 0;

    }



    const p =

        numero(probabilidadeIA)
        /
        100;



    const b =

        odd - 1;



    const kelly =

        (

            (b * p)

            -

            (1-p)

        )

        /

        b;



    return Number(

        (

            Math.max(

                0,

                kelly

            )

            *

            100

        )

        .toFixed(2)

    );


}





// ==========================================
// CLASSIFICAÇÃO
// ==========================================


export function classificarValue(edge){


    edge =
        numero(edge);



    if(edge >= 50){

        return "⭐⭐⭐⭐⭐ Excelente";

    }


    if(edge >= 25){

        return "⭐⭐⭐⭐ Muito Boa";

    }


    if(edge >= 15){

        return "⭐⭐⭐ Boa";

    }


    if(edge >= 5){

        return "⭐⭐ Moderada";

    }



    return "Sem Valor";


}





// ==========================================
// CALCULAR VALUE BET
// ==========================================


export function calcularValueBet(dados={}){


    const {


        id=null,

        jogo="",

        campeonato="",

        horario="",

        mercado="",

        selecao="",


        odd=0,

        probabilidadeIA=0



    } = dados;





    const oddNormalizada =

        numero(odd);



    const probIA =

        numero(probabilidadeIA);





    const oddJusta =

        calcularOddJusta(

            probIA

        );





    const probMercado =

        probabilidadeMercado(

            oddNormalizada

        );





    const edge =

        calcularEdge(

            probIA,

            oddNormalizada

        );





    const ev =

        calcularEV(

            probIA,

            oddNormalizada

        );





    const roi =

        calcularROI(

            probIA,

            oddNormalizada

        );





    const kelly =

        calcularKelly(

            probIA,

            oddNormalizada

        );





    // ==================================
    // FILTRO VALUE BET
    // ==================================
    //
    // Edge mínimo 5%
    // EV positivo
    //
    // Sem limite máximo
    // pois odds altas podem gerar grande valor
    // ==================================


    const valueBet =

        edge >= 5

        &&

        ev > 0;







    return {


        id,


        jogo,


        campeonato,


        horario,


        mercado,


        selecao,



        odd:

        oddNormalizada,



        oddJusta,



        probabilidade:

        probIA,



        probabilidadeMercado:

        probMercado,



        edge,



        roi,



        expectedValue:

        ev,



        kelly,



        valueBet,



        classificacao:

        classificarValue(edge),



        recomendacao:

        valueBet

        ?

        "APOSTAR"

        :

        "NÃO APOSTAR",



        fonte:

        "BetVision AI"


    };


}





// ==========================================
// GERAR LISTA VALUE BETS
// ==========================================


export function gerarValueBets(lista=[]){



    if(!Array.isArray(lista)){


        return [];


    }




    return lista


    .map(

        item =>

        calcularValueBet(item)

    )


    .filter(

        item =>

        item.valueBet === true

    )


    .sort(

        (a,b)=>

        b.edge -

        a.edge

    );


}





// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    probabilidadeMercado,

    calcularOddJusta,

    calcularEdge,

    calcularEV,

    calcularROI,

    calcularKelly,

    classificarValue,

    calcularValueBet,

    gerarValueBets


};
