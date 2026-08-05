// ==========================================
// BetVision AI
// routes/valuebets.js
// Versão 10.0
// Engine Value Bets corrigida
// Compatível PostgreSQL
// ==========================================


import express from "express";

import db from "../database/database.js";


import {
    gerarValueBets
} from "../services/valueBetService.js";


import {
    listarJogos
} from "../services/jogoBancoService.js";



const router = express.Router();





// ==========================================
// GET /api/valuebets
// Gerar Value Bets
// ==========================================


router.get("/", async(req,res)=>{


    try{


        console.log(
            "💎 Calculando Value Bets..."
        );



        const jogos = await listarJogos();



        if(
            !jogos ||
            jogos.length === 0
        ){


            return res.json({

                sucesso:true,

                total:0,

                valuebets:[]

            });


        }





        // ==================================
        // Preparar jogos para IA
        // ==================================


        const jogosAnalise = jogos.map(jogo=>{


            const probabilidadeIA =

                45 +

                Math.floor(

                    Math.random() * 20

                );



            const odd =

                Number(

                    (

                        1.50 +

                        Math.random()*2

                    )

                    .toFixed(2)

                );



            return {


                id:

                jogo.id,



                jogo:


                `${jogo.time_casa} x ${jogo.time_fora}`,



                campeonato:


                jogo.campeonato || "Futebol",



                horario:


                jogo.data_jogo || "",



                mercado:

                "Vitória Casa",



                selecao:


                jogo.time_casa,



                odd,



                probabilidadeIA


            };


        });







        // ==================================
        // Gerar Value Bets
        // ==================================


        const resultado =

    await gerarValueBets();






        // ==================================
        // Salvar no PostgreSQL
        // ==================================


        for(

            const item of resultado

        ){


            try{


                const existe =

                await db.query(

                `

                SELECT id

                FROM valuebets

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

                    INSERT INTO valuebets

                    (

                        jogo,

                        mercado,

                        odd_mercado,

                        odd_justa,

                        valor_percentual,

                        confianca

                    )


                    VALUES

                    (

                        $1,

                        $2,

                        $3,

                        $4,

                        $5,

                        $6

                    )

                    `,


                    [


                        item.jogo,


                        item.mercado,


                        item.odd,


                        item.oddJusta,


                        item.edge,


                        item.classificacao


                    ]

                    );


                }



            }

            catch(error){


                console.log(

                    "⚠️ Erro salvar ValueBet:",

                    error.message

                );


            }


        }







        // ==================================
        // Resposta Dashboard
        // ==================================


        res.json({


            sucesso:true,


            total:


            resultado.length,



            valuebets:


            resultado.map(item=>({


                jogo:item.jogo,


                campeonato:item.campeonato,


                horario:item.horario,


                mercado:item.mercado,


                selecao:item.selecao,


                odd:item.odd,


                oddJusta:item.oddJusta,


                edge:item.edge,


                roi:item.roi,


                kelly:item.kelly,


                classificacao:item.classificacao,


                recomendacao:item.recomendacao


            })),



            atualizadoEm:

            new Date()


        });





    }


    catch(error){



        console.error(

            "❌ Erro Value Bets:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:

            error.message


        });


    }



});









// ==========================================
// GET VALUE BETS SALVAS
// /api/valuebets/salvas
// ==========================================
router.get("/salvas", async(req,res)=>{

    try{

        const resultado = await db.query(`
            SELECT *
            FROM valuebets
            ORDER BY id DESC
            LIMIT 50
        `);


        res.json({

            sucesso:true,

            total:resultado.rows.length,

            valuebets:resultado.rows

        });


    }
    catch(error){

        res.status(500).json({

            sucesso:false,

            erro:error.message

        });

    }

});



// ==========================================
// EXPORT ROUTER
// ==========================================

export default router;
