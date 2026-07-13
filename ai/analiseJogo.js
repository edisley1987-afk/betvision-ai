// =======================================
// BetVision AI
// Motor de Análise de Jogos
// =======================================



export function analisarJogo(jogo){



    /*
       MODELO INICIAL

       Futuramente receberá:

       - histórico equipes
       - últimos 5 jogos
       - gols marcados
       - gols sofridos
       - mando campo
       - odds
       - estatísticas

    */



    const probabilidadeCasa =
        calcularCasa();



    const probabilidadeEmpate =
        calcularEmpate(
            probabilidadeCasa
        );



    const probabilidadeFora =
        100 -
        probabilidadeCasa -
        probabilidadeEmpate;



    const golsEsperados =
        calcularGols();



    const placar =
        preverPlacar(
            golsEsperados
        );



    const valueBet =
        detectarValor(
            probabilidadeCasa,
            probabilidadeEmpate,
            probabilidadeFora
        );




    return {


        jogo:jogo.casa 
            +" x "+
            jogo.fora,


        probabilidadeCasa,


        probabilidadeEmpate,


        probabilidadeFora,



        golsEsperados,



        placarPrevisto:
            placar,



        valueBet,



        confianca:
            calcularConfianca(
                probabilidadeCasa,
                probabilidadeFora
            ),



        algoritmo:
            "Probabilidade + Estatística"



    };



}





// =======================================
// Probabilidade Casa
// =======================================

function calcularCasa(){


    return Math.floor(
        Math.random() * 
        (65-35)
        +35
    );


}





// =======================================
// Empate
// =======================================

function calcularEmpate(casa){


    if(casa > 55){

        return 20;

    }


    return 30;


}





// =======================================
// Gols Esperados
// =======================================

function calcularGols(){


    return Number(
        (
        Math.random()*1.8
        +0.8
        )
        .toFixed(2)
    );


}





// =======================================
// Previsão Placar
// =======================================

function preverPlacar(gols){



    if(gols < 1.5){

        return "1x0";

    }



    if(gols < 2.5){

        return "2x1";

    }



    return "2x2";


}





// =======================================
// Detector Value Bet
// =======================================

function detectarValor(
    casa,
    empate,
    fora
){



    const maior =
        Math.max(
            casa,
            empate,
            fora
        );



    return maior >= 55;



}





// =======================================
// Confiança IA
// =======================================

function calcularConfianca(
    casa,
    fora
){


    const diferenca =
        Math.abs(
            casa - fora
        );


    if(diferenca >=30){

        return "Alta";

    }


    if(diferenca >=15){

        return "Média";

    }



    return "Baixa";


}
