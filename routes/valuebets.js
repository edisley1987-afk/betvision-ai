// ==========================================
// BetVision AI
// routes/valuebets.js
// Versão 9.0
// Engine Value Bets Integrada
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
// Gerar e listar Value Bets
// ==========================================


router.get("/", async(req,res)=>{


    try{


        console.log(
            "💎 Calculando Value Bets..."
        );



        // ================================
        // Buscar jogos cadastrados
        // ================================


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





        // ================================
        // Criar probabilidades IA
        // ================================


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
                        Math.random() * 2

                    )
                    .toFixed(2)

                );



            return {


                id:
                jogo.id,


                jogo:

                `${jogo.casa} x ${jogo.fora}`,


                campeonato:

                jogo.campeonato || 
                "Futebol",



                horario:

                jogo.horario || "",



                mercado:

                "Vitória Casa",



                selecao:

                jogo.casa,



                odd,



                probabilidadeIA


            };


        });






        // ================================
        // Calcular Value Bets
        // ================================


        const resultado =

            gerarValueBets(

                jogosAnalise

            );






        // ================================
        // Salvar oportunidades
        // ================================


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

                    ($1,$2,$3,$4,$5,$6)

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





        // ================================
        // Resposta Dashboard
        // ================================


        res.json({


            sucesso:true,


            total:

            resultado.length,



            valuebets:



            resultado,



            atualizadoEm:

            new Date()
            .toISOString()


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

            "Erro ao calcular Value Bets",



            detalhe:

            error.message


        });



    }



});








// ==========================================
// GET BANCO
// /api/valuebets/salvas
// ==========================================


router.get("/salvas", async(req,res)=>{


    try{


        const resultado =

        await db.query(

        `

        SELECT *

        FROM valuebets

        ORDER BY id DESC

        LIMIT 50


        `

        );



        res.json({


            sucesso:true,


            total:

            resultado.rows.length,


            valuebets:

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
