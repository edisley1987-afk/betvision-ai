// ==========================================
// BetVision AI
// services/iaService.js
// Motor IA v7.0
// Integração jogos reais
// ==========================================



// ==========================================
// GERAR ANÁLISE IA
// ==========================================


export async function gerarAnalise(jogo = {}) {



    const casa =

        jogo.casa ||

        jogo.homeTeam ||

        "Casa";



    const fora =

        jogo.fora ||

        jogo.awayTeam ||

        "Fora";




    const campeonato =

        jogo.campeonato ||

        "Futebol";




    // ===============================
    // MODELO ESTATÍSTICO BASE
    // ===============================


    let probCasa = 45;

    let probEmpate = 28;

    let probFora = 27;



    // ajuste simples pelo tamanho do nome

    if(casa.length > fora.length){

        probCasa += 6;

        probFora -= 6;

    }



    if(fora.length > casa.length + 5){

        probFora += 6;

        probCasa -= 6;

    }




    // normalizar


    const total =

        probCasa +

        probEmpate +

        probFora;



    probCasa =

        Number(

            ((probCasa / total) * 100)

            .toFixed(2)

        );



    probEmpate =

        Number(

            ((probEmpate / total) * 100)

            .toFixed(2)

        );



    probFora =

        Number(

            (

            100 -

            probCasa -

            probEmpate

            )

            .toFixed(2)

        );






    // ===============================
    // FAVORITO
    // ===============================


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






    // ===============================
    // PLACAR IA
    // ===============================


    let placar = "1x1";


    if(favorito === casa){

        placar="2x1";

    }


    if(favorito === fora){

        placar="1x2";

    }



    if(maior >= 65){


        placar =

        favorito === casa

        ?

        "3x1"

        :

        "1x3";


    }






    // ===============================
    // GOLS ESPERADOS
    // ===============================


    const golsEsperados =

        Number(

            (

            1.8 +

            Math.random()*1

            )

            .toFixed(2)

        );






    // ===============================
    // CONFIANÇA
    // ===============================


    let confianca="Baixa";


    if(maior >=55){

        confianca="Média";

    }


    if(maior >=65){

        confianca="Alta";

    }






    // ===============================
    // VALUE BET
    // ===============================


    const valueBet =

        maior >=58;







    return {


        jogo:

        `${casa} x ${fora}`,


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



        confianca,



        algoritmo:

        "BetVision Statistical AI v7.0"



    };


}





export default {

    gerarAnalise

};
