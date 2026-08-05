// ==========================================
// BetVision AI
// services/inteligenciaService.js
// Versão 12.0
// Motor Inteligência IA Estatística
// Correções:
// - Placar variável
// - Probabilidade consistente
// - Modelo sem resultados repetidos
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
// UTILIDADES
// ==========================================

function limitar(valor,min,max){

    return Math.min(
        Math.max(valor,min),
        max
    );

}



function arredondar(valor){

    return Number(
        Number(valor).toFixed(2)
    );

}




// ==========================================
// FORÇA DOS TIMES
// Modelo determinístico
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



    return limitar(

        40 +

        (hash % 60),

        40,

        100

    );


}





// ==========================================
// ATAQUE E DEFESA
// ==========================================

function calcularAtaque(forca){


    return arredondar(

        0.8 +

        (forca / 45)

    );


}



function calcularDefesa(forca){


    return arredondar(

        0.8 +

        (forca / 55)

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


    let casa =


        0.5 +

        (ataqueCasa * 0.55)

        -

        (defesaFora * 0.20);




    let fora =


        0.4 +

        (ataqueFora * 0.50)

        -

        (defesaCasa * 0.18);





    return {


        casa:

        limitar(

            arredondar(casa),

            0.2,

            5

        ),



        fora:

        limitar(

            arredondar(fora),

            0.2,

            5

        )

    };


}





// ==========================================
// PROBABILIDADE IA
// ==========================================

function calcularProbabilidades(

    forcaCasa,

    forcaFora

){


    const diferenca =

        forcaCasa -

        forcaFora;



    let casa =

        45 +

        diferenca * 0.55;



    let fora =

        45 -

        diferenca * 0.55;



    let empate =

        20 -

        Math.abs(diferenca)*0.20;



    casa = limitar(
        casa,
        10,
        80
    );


    fora = limitar(
        fora,
        10,
        70
    );


    empate = limitar(
        empate,
        5,
        35
    );



    const total =

        casa +

        empate +

        fora;



    return {


        casa:

        arredondar(
            casa / total * 100
        ),



        empate:

        arredondar(
            empate / total * 100
        ),



        fora:

        arredondar(
            fora / total * 100
        )


    };


}
// ==========================================
// GERADOR DE PLACAR IA
// Modelo baseado em gols esperados
// ==========================================

function gerarPlacar(

    golsCasa,

    golsFora

){


    let casa =
        Math.floor(golsCasa);


    let fora =
        Math.floor(golsFora);



    // Pequena variação estatística
    const variacao =
        Math.random();



    if(variacao > 0.75){

        casa++;

    }


    if(variacao < 0.25){

        fora++;

    }




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


    if(probabilidade >= 65){

        return "Alta";

    }



    if(probabilidade >= 50){

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

            jogo.casa ||

            "Casa";



        const timeFora =

            jogo.time_fora ||

            jogo.fora ||

            "Fora";





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






        const gols =

            calcularGolsEsperados(

                ataqueCasa,

                defesaCasa,

                ataqueFora,

                defesaFora

            );





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





        const maiorProb =

            Math.max(

                prob.casa,

                prob.empate,

                prob.fora

            );





        let favorito;



        if(

            maiorProb === prob.casa

        ){

            favorito = timeCasa;


        }

        else if(

            maiorProb === prob.fora

        ){

            favorito = timeFora;


        }

        else{


            favorito = "Empate";


        }






        const confianca =

            calcularConfianca(

                maiorProb

            );






        const recomendacao =



            prob.casa > prob.fora

            ?


            "Vitória Casa"


            :


            prob.fora > prob.casa


            ?


            "Vitória Fora"


            :


            "Empate";





        const golsEsperados =

            arredondar(

                gols.casa +

                gols.fora

            );







        // Salva análise

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



            golsEsperados,



            placar,



            maiorProb >= 55,



            confianca,



            "BetVision AI Estatística v12"


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


            golsEsperados,


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


        const agora = Date.now();



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

                "⚠️ Nenhum jogo encontrado"

            );


            return [];

        }






        const resultados=[];





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

            "❌ Erro análise mercado:",

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

            "❌ Erro listar análises:",

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

            WHERE criado_em <

            NOW() -

            INTERVAL '30 days'


        `);



        console.log(

            "🧹 Análises antigas removidas"

        );



    }

    catch(error){


        console.error(

            "❌ Erro limpeza análises:",

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
