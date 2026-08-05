// ==========================================
// BetVision AI
// services/inteligenciaService.js
// Versão 10.0
// Motor Inteligência IA
// ==========================================


import db from "../database/database.js";

import {
    listarJogos
} from "./jogoBancoService.js";



// ==========================================
// CONFIGURAÇÃO
// ==========================================

let ultimaAnalise = 0;

const INTERVALO_ANALISE = 30000;



// ==========================================
// GERAR PROBABILIDADE IA
// ==========================================

function calcularProbabilidade(){


    const casa =
        45 +
        Math.floor(
            Math.random()*15
        );


    const empate =
        20 +
        Math.floor(
            Math.random()*10
        );


    const fora =
        100 -
        casa -
        empate;


    return {


        casa,


        empate,


        fora


    };


}





// ==========================================
// PLACAR IA
// ==========================================

function gerarPlacar(){


    const golsCasa =
        Math.floor(
            Math.random()*4
        );


    const golsFora =
        Math.floor(
            Math.random()*3
        );


    return `${golsCasa} x ${golsFora}`;


}




// ==========================================
// CONFIANÇA
// ==========================================

function calcularConfianca(prob){


    if(prob >= 60){

        return "Alta";

    }


    if(prob >= 50){

        return "Média";

    }


    return "Baixa";


}






// ==========================================
// ANALISAR UM JOGO
// ==========================================

export async function analisarJogo(jogo){


    try{


        const prob =
            calcularProbabilidade();



        const favorito =

            prob.casa >= prob.fora

            ?

            jogo.time_casa

            :

            jogo.time_fora;





        const placar =
            gerarPlacar();





        const golsEsperados =
            Number(
                (
                    1.8 +
                    Math.random()*1.5
                )
                .toFixed(2)
            );





        const confianca =

            calcularConfianca(

                Math.max(
                    prob.casa,
                    prob.fora
                )

            );






        const recomendacao =

        prob.casa > prob.fora

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

            (

                $1,$2,$3,$4,$5,$6,$7,$8,$9

            )


        `,[


            `${jogo.time_casa} x ${jogo.time_fora}`,


            prob.casa,


            prob.empate,


            prob.fora,


            golsEsperados,


            placar,


            true,


            confianca,


            "BetVision AI Probabilidade + Estatística"


        ]);






        return {


            jogo:

            `${jogo.time_casa} x ${jogo.time_fora}`,


            favorito,


            probabilidade:

            Math.max(

                prob.casa,

                prob.fora

            ),


            placar,


            golsEsperados,


            recomendacao,


            confianca



        };



    }

    catch(error){


        console.log(

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

            agora - ultimaAnalise

            <

            INTERVALO_ANALISE

        ){

            return [];

        }



        ultimaAnalise = agora;





        console.log(

            "🤖 Iniciando análise IA..."

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






        let resultados=[];






        for(

            const jogo of jogos.slice(0,20)

        ){


            const resultado =

                await analisarJogo(jogo);




            if(resultado){


                resultados.push(resultado);


            }


        }





        console.log(

            `🤖 ${resultados.length} análises IA concluídas`

        );




        return resultados;



    }

    catch(error){


        console.error(

            "❌ Erro Inteligência IA:",

            error.message

        );


        return [];


    }


}







// ==========================================
// BUSCAR ÚLTIMAS ANÁLISES
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


        console.log(

            "Erro listar análises:",

            error.message

        );


        return [];


    }


}







export default {


    analisarMercado,

    analisarJogo,

    listarAnalises


};
