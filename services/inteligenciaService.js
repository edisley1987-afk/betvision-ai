// ==========================================
// BetVision AI
// services/inteligenciaService.js
// Fase 3
// Motor de Inteligência Artificial
// Compatibilidade:
// - listarAnalises
// - analisarMercado
// - salvarAnalise
// - gerarAnaliseIA
// ==========================================


import db from "../database/database.js";

import {
    calcularProbabilidades
}
from "./probabilidadesService.js";




// ==========================================
// CONFIGURAÇÃO
// ==========================================


const CONFIANCA_MINIMA = 40;

const GOLS_BASE = 2.5;





// ==========================================
// NORMALIZAÇÃO
// ==========================================


function numero(valor){


    const n = Number(valor);


    return Number.isFinite(n)

        ? n

        : 0;


}







function texto(valor){


    return valor

        ? String(valor)

        : "";

}








// ==========================================
// GERAR FAVORITO
// ==========================================


function definirFavorito(prob){


    if(
        prob.casa >
        prob.fora
        &&
        prob.casa >
        prob.empate
    ){

        return "Casa";

    }



    if(
        prob.fora >
        prob.casa
        &&
        prob.fora >
        prob.empate
    ){

        return "Fora";

    }



    return "Empate";


}








// ==========================================
// GERAR CONFIANÇA
// ==========================================


function calcularConfianca(prob){


    const maior = Math.max(

        prob.casa,

        prob.empate,

        prob.fora

    );



    if(maior >= 65){

        return "Alta";

    }


    if(maior >= 50){

        return "Média";

    }


    return "Baixa";


}








// ==========================================
// MODELO IA BASE
// ==========================================


function modeloIA(jogo){


    const forcaCasa =

        50 +

        numero(jogo.forcaCasa);



    const forcaFora =

        50 +

        numero(jogo.forcaFora);





    const probabilidades =

        calcularProbabilidades({


            forcaCasa,


            forcaFora,


            vantagemCasa:5



        });





    return {


        probabilidades,


        favorito:

            definirFavorito(

                probabilidades

            ),


        confianca:

            calcularConfianca(

                probabilidades

            )



    };


}






// ==========================================
// CONTINUA NA PARTE 2
// ==========================================
// ==========================================
// ANALISAR JOGO INDIVIDUAL
// ==========================================


export async function analisarJogo(jogo){


    try{


        const nomeCasa =

            texto(

                jogo.time_casa ||

                jogo.casa ||

                "Casa"

            );



        const nomeFora =

            texto(

                jogo.time_fora ||

                jogo.fora ||

                "Fora"

            );





        const modelo =

            modeloIA({

                forcaCasa:

                    nomeCasa.length,

                forcaFora:

                    nomeFora.length

            });






        const prob =

            modelo.probabilidades;






        const golsEsperados =

            Number(

                (

                    (

                        prob.casa *

                        0.03

                    )

                    +

                    (

                        prob.fora *

                        0.025

                    )

                    +

                    1.2

                )

                .toFixed(2)

            );






        const placar =


            prob.casa > prob.fora

                ?

            "2 x 1"


                :

            prob.fora > prob.casa

                ?

            "1 x 2"


                :

            "1 x 1";







        const jogoNome =


            `${nomeCasa} x ${nomeFora}`;









        await salvarAnalise({


            jogo:

                jogoNome,


            probabilidade_casa:

                prob.casa,


            probabilidade_empate:

                prob.empate,


            probabilidade_fora:

                prob.fora,


            gols_esperados:

                golsEsperados,


            placar_previsto:

                placar,


            value_bet:

                Math.max(

                    prob.casa,

                    prob.fora

                ) >= 55,



            confianca:

                modelo.confianca,



            algoritmo:

                "BetVision AI Fase 3"


        });








        return {


            jogo:

                jogoNome,


            favorito:

                modelo.favorito,


            probabilidadeCasa:

                prob.casa,


            probabilidadeEmpate:

                prob.empate,


            probabilidadeFora:

                prob.fora,


            golsEsperados,


            placar,


            confianca:

                modelo.confianca



        };



    }


    catch(error){



        console.error(

            "❌ Erro analisar jogo:",

            error.message

        );



        return null;


    }


}









// ==========================================
// ANALISAR MERCADO
// Chamado pelo routes/analises.js
// ==========================================


export async function analisarMercado(){


    try{


        console.log(

            "🤖 Buscando análises IA..."

        );



        const resultado =


            await db.query(`



                SELECT *


                FROM analises


                ORDER BY id DESC


                LIMIT 50



            `);





        return resultado.rows || [];



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
// SALVAR ANÁLISE
// ==========================================


export async function salvarAnalise(dados){


    try{


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



            dados.jogo,


            dados.probabilidade_casa,


            dados.probabilidade_empate,


            dados.probabilidade_fora,


            dados.gols_esperados,


            dados.placar_previsto,


            dados.value_bet,


            dados.confianca,


            dados.algoritmo



        ]);



        return true;


    }


    catch(error){


        console.error(

            "❌ Erro salvar análise:",

            error.message

        );


        return false;


    }


}
// ==========================================
// GERAR ANÁLISES IA
// Compatibilidade com processos automáticos
// ==========================================


export async function gerarAnaliseIA(jogos=[]){


    try{


        const resultados = [];



        for(

            const jogo of jogos

        ){


            const analise =

                await analisarJogo(

                    jogo

                );



            if(analise){


                resultados.push(

                    analise

                );


            }


        }





        return resultados;



    }


    catch(error){


        console.error(

            "❌ Erro gerar análise IA:",

            error.message

        );


        return [];


    }


}









// ==========================================
// LISTAR ÚLTIMAS ANÁLISES
// Usado pelo valueBetService
// ==========================================


export async function listarAnalises(){


    try{


        const resultado =


            await db.query(`


                SELECT *


                FROM analises


                ORDER BY id DESC


                LIMIT 200



            `);





        return resultado.rows || [];



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

            NOW() - INTERVAL '30 days'



        `);



        console.log(

            "🧹 Análises antigas removidas"

        );



    }


    catch(error){


        console.error(

            "❌ Erro limpar análises:",

            error.message

        );


    }


}









// ==========================================
// STATUS MOTOR IA
// ==========================================


export function statusIA(){


    return {


        sistema:

            "BetVision AI",



        motor:

            "Probabilidade Estatística",



        fase:

            "3",



        status:

            "ativo",



        data:

            new Date()

                .toISOString()


    };


}









// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    analisarJogo,


    analisarMercado,


    gerarAnaliseIA,


    listarAnalises,


    salvarAnalise,


    limparAnalises,


    statusIA


};
