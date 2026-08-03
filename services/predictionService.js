// ==========================================
// BetVision AI
// services/predictionService.js
// Motor de Probabilidade v1
// ==========================================


// ==========================================
// CALCULAR PROBABILIDADE
// ==========================================

export function prever(jogo = {}) {


    let casa = 33;
    let empate = 33;
    let fora = 34;



    // ======================================
    // VANTAGEM MANDO DE CAMPO
    // ======================================

    if(jogo.casa){

        casa += 10;
        fora -= 5;
        empate -= 5;

    }



    // ======================================
    // NORMALIZAR
    // ======================================

    const total =
        casa +
        empate +
        fora;



    casa =
        Math.round(
            (casa / total) * 100
        );


    empate =
        Math.round(
            (empate / total) * 100
        );


    fora =
        100 -
        casa -
        empate;



    return {


        casa,

        empate,

        fora,


        confianca:

            casa > 55
                ? "Alta"
                :
            casa > 45
                ? "Média"
                :
                "Baixa"



    };


}



// ==========================================
// PREVISÃO COMPLETA
// ==========================================

export function gerarAnalise(jogo){


    const probabilidade =
        prever(jogo);



    return {


        jogo:

            `${jogo.casa} x ${jogo.fora}`,


        probabilidade_casa:

            probabilidade.casa,


        probabilidade_empate:

            probabilidade.empate,


        probabilidade_fora:

            probabilidade.fora,


        gols_esperados:

            (
                1.5 +
                Math.random()
            )
            .toFixed(2),



        placar_previsto:


            probabilidade.casa >
            probabilidade.fora

            ?

            "2x1"

            :

            "1x2",



        confianca:

            probabilidade.confianca,


        algoritmo:

            "Probabilidade Estatística v1"



    };


}



export default {

    prever,

    gerarAnalise

};
