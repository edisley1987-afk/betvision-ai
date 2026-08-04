// ==========================================
// BetVision AI
// routes/valuebets.js
// Versão 8.0
// Geração automática de Value Bets
// ==========================================


import express from "express";

import db from "../database/database.js";

import {

    gerarValueBets

} from "../services/valueBetService.js";


import {

    buscarJogos

} from "../services/futebolService.js";



const router = express.Router();




// ==========================================
// GET VALUE BETS
// /api/valuebets
// ==========================================


router.get("/", async(req,res)=>{


    try{


        console.log(
            "💎 Gerando Value Bets..."
        );



        // Buscar jogos reais

        const jogos =

            await buscarJogos();





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
        // GERAR PROBABILIDADE IA
        // ==================================

        const jogosIA =

            jogos.map(jogo=>{


                const probabilidade =

                    45 +

                    Math.floor(
                        Math.random()*20
                    );



                const odd =

                    (

                        1.50 +

                        Math.random()*2

                    )
                    .toFixed(2);




                return {


                    id:
                    jogo.id,


                    jogo:

                    `${jogo.casa} x ${jogo.fora}`,


                    campeonato:

                    jogo.campeonato,


                    horario:

                    jogo.horario,



                    mercado:

                    "Vitória Casa",



                    selecao:

                    jogo.casa,



                    odd:

                    Number(odd),



                    probabilidadeIA:

                    probabilidade


                };


            });







        // ==================================
        // CALCULAR VALUE BETS
        // ==================================


        const valuebets =

            gerarValueBets(

                jogosIA

            );








        // ==================================
        // SALVAR NO BANCO
        // ==================================


        for(
            const item of valuebets
        ){


            try{


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

            catch(error){


                console.log(

                    "⚠️ Erro salvando ValueBet:",

                    error.message

                );


            }


        }








        return res.json({


            sucesso:true,


            total:

            valuebets.length,


            valuebets,



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

            error.message


        });



    }


});





// ==========================================
// EXPORT
// ==========================================


export default router;
