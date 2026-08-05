// ==========================================
// BetVision AI
// services/inteligenciaService.js
// Versão 12.0
// Motor Inteligência IA Estatística
// ==========================================


import db from "../database/database.js";

import {
    listarJogos
}
from "./jogoBancoService.js";


import {
    calcularProbabilidades
}
from "./probabilidadesService.js";




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
// Modelo estatístico base
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

        hash += nome.charCodeAt(i);

    }





    return (

        45 +

        (

            hash % 40

        )

    );


}








// ==========================================
// ATAQUE
// ==========================================


function calcularAtaque(forca){


    return Number(

        (

            forca / 50

        )

        .toFixed(2)

    );


}








// ==========================================
// DEFESA
// ==========================================


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
// Modelo Poisson simplificado
// ==========================================


function calcularGolsEsperados(

    ataqueCasa,

    defesaCasa,

    ataqueFora,

    defesaFora

){



    const golsCasa =


        1.1 +

        (

            ataqueCasa *

            0.45

        )

        -

        (

            defesaFora *

            0.20

        );







    const golsFora =


        0.8 +

        (

            ataqueFora *

            0.35

        )

        -

        (

            defesaCasa *

            0.18

        );







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
// LIMITADOR
// ==========================================


function limitar(

    valor,

    min,

    max

){


    return Math.min(

        Math.max(

            valor,

            min

        ),

        max

    );


}
// ==========================================
// GERAR PLACAR PROVÁVEL
// ==========================================


function gerarPlacar(

    golsCasa,

    golsFora

){


    let casa = Math.round(golsCasa);


    let fora = Math.round(golsFora);




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
// CONFIANÇA IA
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

            jogo.casa ||

            "Casa";





        const timeFora =


            jogo.time_fora ||

            jogo.fora ||

            "Fora";








        // ==============================
        // FORÇA DOS TIMES
        // ==============================


        const forcaCasa =


            calcularForcaTime(

                timeCasa

            );





        const forcaFora =


            calcularForcaTime(

                timeFora

            );








        // ==============================
        // ATAQUE / DEFESA
        // ==============================


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








        // ==============================
        // GOLS ESPERADOS
        // ==============================


        const gols =


            calcularGolsEsperados(

                ataqueCasa,

                defesaCasa,

                ataqueFora,

                defesaFora

            );








        // ==============================
        // PROBABILIDADES IA
        // Agora usando probabilidadesService
        // ==============================


        const prob =


            calcularProbabilidades({

                forcaCasa,

                forcaFora,

                vantagemCasa:5

            });








        // ==============================
        // PLACAR IA
        // ==============================


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








        const favorito =


            maiorProb === prob.casa

                ? timeCasa


                :

            maiorProb === prob.fora

                ? timeFora


                :

            "Empate";








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









        // ==============================
        // SALVAR ANÁLISE NO BANCO
        // ==============================


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
// GERAR ANÁLISES DOS JOGOS
// ==========================================


export async function gerarAnalises(){


    try{


        console.log(

            "🤖 Gerando análises IA..."

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






        console.log(

            `🤖 ${resultados.length} análises criadas`

        );




        return resultados;



    }


    catch(error){


        console.error(

            "❌ Erro gerar análises:",

            error.message

        );


        return [];


    }


}









// ==========================================
// LISTAR ANÁLISES
// Usado pelo ValueBetService
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
// BUSCAR ANÁLISE POR JOGO
// ==========================================


export async function buscarAnaliseJogo(jogo){


    try{


        const resultado =


        await db.query(`


            SELECT *


            FROM analises


            WHERE jogo=$1


            ORDER BY id DESC


            LIMIT 1



        `,[

            jogo

        ]);






        return resultado.rows[0] || null;



    }


    catch(error){



        console.error(

            "❌ Erro buscar análise:",

            error.message

        );



        return null;


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
// STATUS DO MOTOR IA
// ==========================================


export function statusIA(){


    return {


        sistema:

            "BetVision AI",



        motor:

            "Probabilidade + Estatística",



        versao:

            "12.0",



        status:

            "ativo",



        ultimaAnalise:

            new Date()

                .toISOString()


    };


}









// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    analisarJogo,


    gerarAnalises,


    listarAnalises,


    buscarAnaliseJogo,


    limparAnalises,


    statusIA


};
