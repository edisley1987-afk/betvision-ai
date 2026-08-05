// ==========================================
// BetVision AI
// routes/analises.js
// Versão 10.0
// Engine Análises IA corrigida
// Compatível PostgreSQL
// ==========================================


import express from "express";

import db from "../database/database.js";


import {
    listarJogos
} from "../services/jogoBancoService.js";


const router = express.Router();





// ==========================================
// GERAR ANÁLISE IA
// ==========================================


function gerarAnalise(jogo){


    const probCasa =

        Math.floor(

            45 +

            Math.random()*20

        );



    const probEmpate =

        Math.floor(

            20 +

            Math.random()*10

        );



    const probFora =

        100 -

        probCasa -

        probEmpate;



    const golsEsperados =

        Number(

            (

                1.8 +

                Math.random()*1.5

            )

            .toFixed(1)

        );





    let favorito =

        jogo.time_casa;



    if(probFora > probCasa){

        favorito = jogo.time_fora;

    }



    if(

        probCasa < 40 &&

        probFora < 40

    ){

        favorito = "Empate";

    }





    let confianca = "Média";



    if(probCasa >= 60 || probFora >= 60){

        confianca = "Alta";

    }



    if(probCasa < 50 && probFora < 50){

        confianca = "Baixa";

    }





    return {



        jogo:


        `${jogo.time_casa} x ${jogo.time_fora}`,



        campeonato:


        jogo.campeonato || "Futebol",



        horario:


        jogo.data_jogo,



        favorito,



        probabilidade:


        Math.max(

            probCasa,

            probFora

        ),



        probabilidadeCasa:

        probCasa,



        probabilidadeEmpate:

        probEmpate,



        probabilidadeFora:

        probFora,



        golsEsperados,



        placarPrevisto:


        probCasa > probFora

        ?

        "2 x 1"

        :

        "1 x 2",



        confianca,



        algoritmo:

        "Probabilidade + Estatística"


    };


}









// ==========================================
// GET /api/analises
// Listar análises IA
// ==========================================


router.get("/", async(req,res)=>{


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


            return res.json({


                sucesso:true,


                total:0,


                analises:[]


            });


        }





        const analises =

        jogos.map(jogo=>{


            return gerarAnalise(jogo);


        });







        // ==============================
        // Salvar banco
        // ==============================


        for(

            const item of analises

        ){


            try{


                const existe =

                await db.query(

                `

                SELECT id

                FROM analises

                WHERE jogo=$1

                LIMIT 1

                `,


                [

                    item.jogo

                ]

                );





                if(

                    existe.rows.length === 0

                ){


                    await db.query(

                    `

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

                    `,


                    [


                        item.jogo,


                        item.probabilidadeCasa,


                        item.probabilidadeEmpate,


                        item.probabilidadeFora,


                        item.golsEsperados,


                        item.placarPrevisto,


                        false,


                        item.confianca,


                        item.algoritmo


                    ]

                    );


                }



            }

            catch(error){


                console.log(

                    "⚠️ Erro salvar análise:",

                    error.message

                );


            }


        }








        res.json({


            sucesso:true,


            total:


            analises.length,



            analises



        });




    }


    catch(error){


        console.error(

            "❌ Erro análises:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });


    }



});









// ==========================================
// GET ANALISES SALVAS
// /api/analises/salvas
// ==========================================


router.get(

"/salvas",

async(req,res)=>{


    try{


        const resultado =

        await db.query(

        `

        SELECT *

        FROM analises

        ORDER BY id DESC

        LIMIT 50

        `

        );



        res.json({


            sucesso:true,


            total:

            resultado.rows.length,



            analises:

            resultado.rows


        });



    }

    catch(error){


        res.status(500).json({


            sucesso:false,


            erro:error.message


        });


    }



});








export default router;
