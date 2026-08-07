//
// ==================================================
// BETVISION AI
// services/inteligenciaService.js
// Motor Inteligência Estatística v5.1
// Compatibilidade Rotas Antigas + Novas
// ==================================================


import {

    salvarAnalise,

    salvarValueBet

} from "./bancoService.js";




// ==================================================
// LIMITAR VALORES
// ==================================================

function limitar(

    valor,

    minimo = 0,

    maximo = 100

){

    return Math.max(

        minimo,

        Math.min(

            maximo,

            Number(valor) || 0

        )

    );

}




// ==================================================
// CALCULAR PROBABILIDADES
// ==================================================

export function calcularProbabilidades(

    dados = {}

){


    const {


        ataqueCasa = 50,

        defesaCasa = 50,

        ataqueFora = 50,

        defesaFora = 50,

        formaCasa = 50,

        formaFora = 50,

        mediaGolsCasa = 1,

        mediaGolsFora = 1


    } = dados;



    const forcaCasa =


        (ataqueCasa * 0.30)

        +

        (defesaFora * 0.20)

        +

        (formaCasa * 0.30)

        +

        (mediaGolsCasa * 10);



    const forcaFora =


        (ataqueFora * 0.30)

        +

        (defesaCasa * 0.20)

        +

        (formaFora * 0.30)

        +

        (mediaGolsFora * 10);



    const total =

        forcaCasa +

        forcaFora;



    let casa =

        (forcaCasa / total) * 70;



    let fora =

        (forcaFora / total) * 70;



    let empate =

        30 -

        Math.abs(

            casa - fora

        ) / 2;



    return {


        casa:

            Number(

                limitar(casa)

                .toFixed(2)

            ),


        empate:

            Number(

                limitar(empate)

                .toFixed(2)

            ),


        fora:

            Number(

                limitar(fora)

                .toFixed(2)

            )


    };


}




// ==================================================
// PLACAR PREVISTO
// ==================================================

export function calcularPlacar(

    dados = {}

){


    const {


        mediaGolsCasa = 1.2,

        mediaGolsFora = 1


    } = dados;



    return {


        casa:

            Math.max(

                0,

                Math.round(

                    mediaGolsCasa

                )

            ),


        fora:

            Math.max(

                0,

                Math.round(

                    mediaGolsFora

                )

            )


    };


}




// ==================================================
// CONFIANÇA IA
// ==================================================

export function calcularConfianca(

    probabilidades

){


    const maior = Math.max(


        probabilidades.casa,

        probabilidades.empate,

        probabilidades.fora


    );



    if(maior >= 65)

        return "ALTA";



    if(maior >= 50)

        return "MEDIA";



    return "BAIXA";


}




// ==================================================
// GERAR ANÁLISE IA
// ==================================================

export async function gerarAnaliseIA(

    jogo,

    dados = {}

){


    const probabilidades =


        calcularProbabilidades(

            dados

        );



    const placar =


        calcularPlacar(

            dados

        );



    const confianca =


        calcularConfianca(

            probabilidades

        );




    const analise = {


        jogo_id:

            jogo.id,


        jogo:


            `${jogo.time_casa} x ${jogo.time_fora}`,



        probabilidade_casa:

            probabilidades.casa,



        probabilidade_empate:

            probabilidades.empate,



        probabilidade_fora:

            probabilidades.fora,



        gols_esperados:

            Number(

                (

                    dados.mediaGolsCasa || 1

                    +

                    dados.mediaGolsFora || 1

                )

                .toFixed(2)

            ),



        placar_previsto:


            `${placar.casa}x${placar.fora}`,



        value_bet:false,



        confianca,



        algoritmo:


            "Probabilidade + Estatística"


    };



    return await salvarAnalise(

        analise

    );


}




// ==================================================
// ANALISAR MERCADO
// COMPATIBILIDADE ROTAS ANTIGAS
// ==================================================

export async function analisarMercado(

    jogo,

    dados = {}

){


    const resultado =


        await gerarAnaliseIA(

            jogo,

            dados

        );



    return {


        sucesso:true,


        analise:resultado


    };


}




// ==================================================
// CALCULAR VALUE BET
// ==================================================

export function calcularValueBet(

    odd,

    probabilidade

){


    const valorEsperado =


        (

            odd *

            (

                probabilidade / 100

            )

        )

        -

        1;



    return {


        valor:


            Number(

                valorEsperado

                .toFixed(3)

            ),



        possui:


            valorEsperado > 0.05


    };


}




// ==================================================
// GERAR VALUE BET
// ==================================================

export async function gerarValueBet(

    jogo,

    mercado,

    odd,

    probabilidade

){


    const resultado =


        calcularValueBet(

            odd,

            probabilidade

        );



    if(!resultado.possui)

        return null;



    return await salvarValueBet({


        jogo_id:jogo.id,


        mercado,


        odd_mercado:odd,


        probabilidade_real:probabilidade,


        valor_esperado:

            resultado.valor,


        confianca:"ALTA"


    });


}




// ==================================================
// EXPORT FINAL
// ==================================================

export default {


    calcularProbabilidades,


    calcularPlacar,


    calcularConfianca,


    gerarAnaliseIA,


    analisarMercado,


    calcularValueBet,


    gerarValueBet


};
