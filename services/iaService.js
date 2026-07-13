/*
 Motor inicial de inteligência
*/


export async function gerarAnalise(dados){


    const {

        timeCasa,

        timeFora,

        golsCasaMedia,

        golsForaMedia

    } = dados;



    let probabilidade = 50;



    if(golsCasaMedia > golsForaMedia){

        probabilidade += 15;

    }



    if(golsForaMedia > golsCasaMedia){

        probabilidade -= 10;

    }



    return {


        jogo:

        `${timeCasa} x ${timeFora}`,



        probabilidadeVitoriaCasa:

        probabilidade,



        recomendacao:

            probabilidade >=65

            ?

            "Possível valor"

            :

            "Sem vantagem clara"



    };


}
