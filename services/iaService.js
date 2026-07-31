// ==========================================
// BetVision AI
// services/iaService.js
// Motor IA v6.0
// ==========================================


// ==========================================
// GERAR ANÁLISE IA
// ==========================================

export async function gerarAnalise(jogo = {}) {


    const casa =
        jogo.casa || "Casa";


    const fora =
        jogo.fora || "Fora";


    // ==================================
    // PROBABILIDADE BASE
    // ==================================

    let probCasa = 45;

    let probEmpate = 28;

    let probFora = 27;



    // ==================================
    // AJUSTE SIMPLES IA
    // ==================================

    if (casa.length > fora.length) {

        probCasa += 5;

        probFora -= 5;

    }


    if (fora.length > casa.length + 5) {

        probCasa -= 5;

        probFora += 5;

    }



    // ==================================
    // NORMALIZAÇÃO
    // ==================================

    const soma =
        probCasa +
        probEmpate +
        probFora;


    probCasa =
        Number(
            ((probCasa / soma) * 100)
            .toFixed(1)
        );


    probEmpate =
        Number(
            ((probEmpate / soma) * 100)
            .toFixed(1)
        );


    probFora =
        Number(
            (100 -
            probCasa -
            probEmpate)
            .toFixed(1)
        );



    // ==================================
    // MAIOR PROBABILIDADE
    // ==================================

    let vencedor =
        casa;


    let maior =
        probCasa;


    if (probFora > maior) {

        vencedor = fora;

        maior = probFora;

    }


    if (probEmpate > maior) {

        vencedor = "Empate";

        maior = probEmpate;

    }



    // ==================================
    // PLACAR PREVISTO
    // ==================================

    let placar =
        "1x1";


    if (vencedor === casa) {

        placar = "2x1";

    }


    if (vencedor === fora) {

        placar = "1x2";

    }


    if (maior >= 65) {

        placar =
            vencedor === casa
                ? "3x1"
                : "1x3";

    }



    // ==================================
    // CONFIANÇA
    // ==================================

    let confianca =
        "Baixa";


    if (maior >= 55) {

        confianca =
            "Média";

    }


    if (maior >= 65) {

        confianca =
            "Alta";

    }



    // ==================================
    // VALUE BET IA
    // ==================================

    const valueBet =
        maior >= 58;



    return {


        jogo:
            `${casa} x ${fora}`,


        // compatibilidade com ValueBet

        probabilidade:
            maior,


        probabilidadeCasa:
            probCasa,


        probabilidadeEmpate:
            probEmpate,


        probabilidadeFora:
            probFora,


        probabilidadeVitoriaCasa:
            probCasa,


        vencedorProvavel:
            vencedor,


        golsEsperados:
            2.6,


        placarPrevisto:
            placar,


        valueBet,


        confianca,


        algoritmo:
            "BetVision AI v6.0"


    };


}


// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {

    gerarAnalise

};
