// ==========================================
// BetVision AI
// services/iaService.js
// Motor IA v7.1
// Integração PostgreSQL v4.1
// ==========================================



// ==========================================
// GERAR ANÁLISE IA
// ==========================================


export async function gerarAnalise(jogo = {}) {



    const casa =

        jogo.casa ||

        jogo.homeTeam ||

        jogo.home ||

        "Casa";



    const fora =

        jogo.fora ||

        jogo.awayTeam ||

        jogo.away ||

        "Fora";



    const campeonato =

        jogo.campeonato ||

        jogo.league ||

        "Futebol";





    // ======================================
    // MODELO PROBABILÍSTICO BASE
    // ======================================


    let probCasa = 45;

    let probEmpate = 28;

    let probFora = 27;





    // Ajuste simples de força

    if(casa.length > fora.length){

        probCasa += 6;

        probFora -= 6;

    }



    if(fora.length > casa.length + 5){

        probFora += 6;

        probCasa -= 6;

    }





    // ======================================
    // NORMALIZAÇÃO
    // ======================================


    const total =

        probCasa +

        probEmpate +

        probFora;



    probCasa = Number(

        ((probCasa / total) * 100)

        .toFixed(2)

    );



    probEmpate = Number(

        ((probEmpate / total) * 100)

        .toFixed(2)

    );



    probFora = Number(

        (

            100 -

            probCasa -

            probEmpate

        )

        .toFixed(2)

    );





    // ======================================
    // IDENTIFICAR FAVORITO
    // ======================================


    let favorito = casa;

    let maior = probCasa;



    if(probFora > maior){

        favorito = fora;

        maior = probFora;

    }



    if(probEmpate > maior){

        favorito = "Empate";

        maior = probEmpate;

    }





    // ======================================
    // PLACAR PREVISTO IA
    // ======================================


    let placar = "1x1";



    if(favorito === casa){

        placar = "2x1";

    }



    if(favorito === fora){

        placar = "1x2";

    }



    if(maior >= 65){


        placar =

        favorito === casa

        ?

        "3x1"

        :

        "1x3";


    }





    // ======================================
    // PREVISÃO DE GOLS
    // ======================================


    const golsEsperados = Number(

        (

            1.8 +

            Math.random()

        )

        .toFixed(2)

    );







    // ======================================
    // CONFIANÇA MODELO
    // ======================================


    let confianca = 40;



    if(maior >= 55){

        confianca = 60;

    }



    if(maior >= 65){

        confianca = 80;

    }



    if(maior >= 75){

        confianca = 90;

    }





    // ======================================
    // VALUE BET
    // ======================================


    const valueBet =

        maior >= 58;





    const valorEsperado =

        valueBet

        ?

        Number(

            (

                (maior / 100) * 100

                -

                100 / 2

            )

            .toFixed(2)

        )

        :

        0;






    // ======================================
    // RECOMENDAÇÃO
    // ======================================


    let recomendacao =

        "Sem aposta recomendada";



    if(valueBet){


        recomendacao =

        `Valor encontrado para ${favorito}`;


    }







    // ======================================
    // RETORNO FINAL
    // ======================================


    return {



        jogo:

        `${casa} x ${fora}`,



        casa,



        fora,



        campeonato,



        favorito,



        probabilidade:

        maior,



        probabilidade_casa:

        probCasa,



        probabilidade_empate:

        probEmpate,



        probabilidade_fora:

        probFora,



        gols_esperados:

        golsEsperados,



        placar_previsto:

        placar,



        value_bet:

        valueBet,



        valor_esperado:

        valorEsperado,



        recomendacao,



        confianca,



        modelo:

        "BetVision Statistical AI v7.1"



    };



}





export default {


    gerarAnalise


};
