// ==========================================
// BetVision AI
// services/iaService.js
// Motor IA Probabilidade + Estatística
// Versão 4.0
// ==========================================



export async function gerarAnalise(dados){



    const {


        timeCasa,

        timeFora,

        golsCasaMedia = 1.5,

        golsForaMedia = 1.2


    } = dados;





    let probCasa = 50;



    /*
    ======================================
    MODELO BASE
    ======================================
    */


    if(golsCasaMedia > golsForaMedia){


        probCasa += 15;


    }



    if(golsForaMedia > golsCasaMedia){


        probCasa -= 10;


    }






    /*
    ======================================
    AJUSTE LIMITES
    ======================================
    */


    if(probCasa > 85){

        probCasa = 85;

    }



    if(probCasa < 20){

        probCasa = 20;

    }







    const probEmpate = 25;



    const probFora =

    100 -
    probCasa -
    probEmpate;








    /*
    ======================================
    GOLS ESPERADOS
    ======================================
    */


    const golsEsperados =


        Number(

            (

            (

                golsCasaMedia +

                golsForaMedia

            )

            /

            2

            )

            .toFixed(2)

        );







    /*
    ======================================
    PLACAR PROVÁVEL
    ======================================
    */


    let placarCasa = 1;

    let placarFora = 0;



    if(golsEsperados >= 2){


        placarCasa = 2;

        placarFora = 1;


    }



    if(probFora > probCasa){


        placarCasa = 1;

        placarFora = 2;


    }







    /*
    ======================================
    CONFIANÇA IA
    ======================================
    */


    let confianca = "Baixa";



    if(probCasa >= 65){

        confianca = "Alta";

    }


    else if(probCasa >= 50){


        confianca = "Média";


    }









    /*
    ======================================
    RESULTADO FINAL IA
    ======================================
    */


    return {



        jogo:

        `${timeCasa} x ${timeFora}`,





        probabilidadeCasa:

        probCasa,




        probabilidadeEmpate:

        probEmpate,




        probabilidadeFora:

        probFora,




        golsEsperados,




        placarPrevisto:

        `${placarCasa}x${placarFora}`,




        valueBet:

        probCasa >= 65,




        confianca,




        algoritmo:

        "Probabilidade + Estatística BetVision AI v4.0"




    };



}
