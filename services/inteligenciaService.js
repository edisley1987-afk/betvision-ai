// ==========================================
// BetVision AI
// services/inteligenciaService.js
// Versão 11.0
// Motor Inteligência IA Estatística
// ==========================================


import db from "../database/database.js";

import {
    listarJogos
} from "./jogoBancoService.js";



// ==========================================
// CONTROLE
// ==========================================

let ultimaAnalise = 0;

const INTERVALO_ANALISE = 30000;




// ==========================================
// NORMALIZAÇÃO
// ==========================================

function numero(valor){

    const n = Number(valor);

    return Number.isFinite(n)
        ? n
        : 0;

}




// ==========================================
// FORÇA DOS TIMES
// Modelo base
// ==========================================

function calcularForcaTime(nome=""){


    if(!nome){

        return 50;

    }


    let hash = 0;


    for(
        let i = 0;
        i < nome.length;
        i++
    ){

        hash +=
        nome.charCodeAt(i);

    }


    return (

        45 +

        (
            hash % 40
        )

    );


}




// ==========================================
// ATAQUE E DEFESA
// ==========================================

function calcularAtaque(forca){

    return Number(

        (
            forca / 50

        )
        .toFixed(2)

    );

}



function calcularDefesa(forca){

    return Number(

        (
            forca / 55

        )
        .toFixed(2)

    );

}




// ==========================================
// GOLS ESPERADOS
// ==========================================

function calcularGolsEsperados(

    ataqueCasa,

    defesaCasa,

    ataqueFora,

    defesaFora

){


    const golsCasa =

        1.1 +

        (ataqueCasa * 0.45)

        -

        (defesaFora * 0.20);



    const golsFora =


        0.8 +

        (ataqueFora * 0.35)

        -

        (defesaCasa * 0.18);



    return {


        casa:

        Math.max(

            0.2,

            Number(
                golsCasa.toFixed(2)
            )

        ),



        fora:

        Math.max(

            0.2,

            Number(
                golsFora.toFixed(2)
            )

        )

    };


}



// ==========================================
// POISSON SIMPLIFICADO
// ==========================================

function limitar(valor,min,max){

    return Math.min(
        Math.max(valor,min),
        max
    );

}
    // ==========================================
// PROBABILIDADES IA
// ==========================================

function calcularProbabilidades(

    forcaCasa,

    forcaFora

){


    const diferenca =

        forcaCasa -

        forcaFora;



    let casa =

        50 +

        (diferenca * 0.8);



    let fora =

        50 -

        (diferenca * 0.8);



    let empate =

        25 -

        Math.abs(diferenca) * 0.25;




    casa = limitar(

        casa,

        15,

        75

    );


    fora = limitar(

        fora,

        10,

        60

    );


    empate = limitar(

        empate,

        10,

        35

    );





    const total =

        casa +

        empate +

        fora;



    return {


        casa:

        Number(

            (

                casa /

                total *

                100

            )

            .toFixed(2)

        ),



        empate:

        Number(

            (

                empate /

                total *

                100

            )

            .toFixed(2)

        ),



        fora:

        Number(

            (

                fora /

                total *

                100

            )

            .toFixed(2)

        )



    };


}





// ==========================================
// GERAR PLACAR PROVÁVEL
// ==========================================

function gerarPlacar(

    golsCasa,

    golsFora

){


    let casa =

        Math.round(

            golsCasa

        );



    let fora =

        Math.round(

            golsFora

        );



    casa = limitar(

        casa,

        0,

        5

    );


    fora = limitar(

        fora,

        0,

        5

    );



    return `${casa} x ${fora}`;


}





// ==========================================
// CONFIANÇA
// ==========================================

function calcularConfianca(

    probabilidade

){


    if(

        probabilidade >= 65

    ){

        return "Alta";


    }


    if(

        probabilidade >= 50

    ){

        return "Média";


    }



    return "Baixa";


}





// ==========================================
// ANALISAR JOGO INDIVIDUAL
// ==========================================

export async function analisarJogo(jogo){


    try{



        const timeCasa =

            jogo.time_casa ||

            "Casa";



        const timeFora =

            jogo.time_fora ||

            "Fora";






        // Força calculada dos clubes

        const forcaCasa =

            calcularForcaTime(

                timeCasa

            );



        const forcaFora =

            calcularForcaTime(

                timeFora

            );





        const ataqueCasa =

            calcularAtaque(

                forcaCasa

            );


        const defesaCasa =

            calcularDefesa(

                forcaCasa

            );



        const ataqueFora =

            calcularAtaque(

                forcaFora

            );


        const defesaFora =

            calcularDefesa(

                forcaFora

            );






        // Gols esperados

        const gols =

            calcularGolsEsperados(

                ataqueCasa,

                defesaCasa,

                ataqueFora,

                defesaFora

            );





        // Probabilidades

        const prob =

            calcularProbabilidades(

                forcaCasa,

                forcaFora

            );





        const placar =

            gerarPlacar(

                gols.casa,

                gols.fora

            );





        const favorito =


            prob.casa >= prob.fora

            ?

            timeCasa

            :

            timeFora;





        const maiorProb =

            Math.max(

                prob.casa,

                prob.fora,

                prob.empate

            );





        const confianca =

            calcularConfianca(

                maiorProb

            );






        const recomendacao =


            prob.casa >

            prob.fora


            ?


            "Vitória Casa"


            :


            "Vitória Fora";



        await db.query(`

            INSERT INTO analises

            (

                jogo,

                probabilidade_casa,

                probabilidade_empate,

                probabilidade_fora,

                gols_esperados,

                placar_previsto,

                value_bet,

                confianca,

                algoritmo

            )

            VALUES

            ($1,$2,$3,$4,$5,$6,$7,$8,$9)

        `,[



            `${timeCasa} x ${timeFora}`,



            prob.casa,



            prob.empate,



            prob.fora,



            Number(

                (

                    gols.casa +

                    gols.fora

                )

                .toFixed(2)

            ),



            placar,



            maiorProb >= 55,



            confianca,



            "BetVision AI Estatística v11"



        ]);




        return {


            jogo:

            `${timeCasa} x ${timeFora}`,


            favorito,


            probabilidadeCasa:

            prob.casa,


            probabilidadeEmpate:

            prob.empate,


            probabilidadeFora:

            prob.fora,


            golsEsperados:

            Number(

                (

                    gols.casa +

                    gols.fora

                )

                .toFixed(2)

            ),


            placar,


            recomendacao,


            confianca


        };



    }

    catch(error){


        console.error(

            "❌ Erro análise jogo:",

            error.message

        );


        return null;


    }


}
    // ==========================================
// ANALISAR MERCADO
// Chamado pelo server.js
// ==========================================

export async function analisarMercado(){


    try{


        const agora =

            Date.now();



        if(

            agora -

            ultimaAnalise

            <

            INTERVALO_ANALISE

        ){

            return [];

        }



        ultimaAnalise = agora;




        console.log(
            "🤖 Iniciando análise IA estatística..."
        );





        const jogos =

            await listarJogos();





        if(

            !jogos ||

            jogos.length === 0

        ){


            console.log(
                "⚠️ Nenhum jogo disponível"
            );


            return [];


        }






        const resultados = [];





        for(

            const jogo of jogos.slice(0,20)

        ){


            const resultado =

                await analisarJogo(

                    jogo

                );




            if(resultado){


                resultados.push(

                    resultado

                );


            }


        }





        console.log(

            `🤖 ${resultados.length} análises IA concluídas`

        );




        return resultados;



    }


    catch(error){



        console.error(

            "❌ Erro analisar mercado:",

            error.message

        );



        return [];

    }



}







// ==========================================
// LISTAR ÚLTIMAS ANÁLISES
// ==========================================

export async function listarAnalises(){


    try{


        const resultado =

        await db.query(`


            SELECT *

            FROM analises

            ORDER BY id DESC

            LIMIT 50


        `);



        return resultado.rows;



    }


    catch(error){



        console.error(

            "Erro listar análises:",

            error.message

        );


        return [];


    }


}







// ==========================================
// LIMPAR ANÁLISES ANTIGAS
// ==========================================

export async function limparAnalises(){


    try{


        await db.query(`


            DELETE FROM analises

            WHERE criado_em < NOW() - INTERVAL '30 days'


        `);



        console.log(

            "🧹 Análises antigas removidas"

        );



    }


    catch(error){


        console.error(

            "Erro limpar análises:",

            error.message

        );


    }


}

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {


    analisarMercado,

    analisarJogo,

    listarAnalises,

    limparAnalises


};
