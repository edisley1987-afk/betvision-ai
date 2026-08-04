// ==========================================
// BetVision AI
// routes/valuebets.js
// Versão 9.0
// Value Bets usando Odds reais
// ==========================================


import express from "express";

import db from "../database/database.js";

import {

    buscarOddsJogos

} from "../services/oddsService.js";


import {

    calcularValueBet

} from "../services/valueBetService.js";



const router = express.Router();





// ==========================================
// GET VALUE BETS
// /api/valuebets
// ==========================================


router.get("/", async(req,res)=>{


    try{


        console.log(
            "💎 Calculando Value Bets..."
        );



        const jogos =

            await buscarOddsJogos();





        if(
            !Array.isArray(jogos) ||
            jogos.length === 0
        ){


            return res.json({

                sucesso:true,

                total:0,

                valuebets:[]

            });


        }





        const oportunidades = [];





        for(
            const jogo of jogos
        ){



            const odd =

                jogo.odds?.casa || 0;



            const probabilidade =

                jogo.probabilidades?.casa || 0;






            const resultado =

                calcularValueBet({


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


                    odd,


                    probabilidadeIA:

                    probabilidade


                });






            if(
                resultado.valueBet
            ){

                oportunidades.push(
                    resultado
                );

            }



        }







        // ordenar melhores primeiro

        oportunidades.sort(

            (a,b)=>

            b.edge-a.edge

        );








        // salvar banco

        for(
            const item of oportunidades
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

            )

            .catch(err=>{


                console.log(

                "Erro banco ValueBet:",

                err.message

                );


            });



        }









        res.json({


            sucesso:true,


            total:

            oportunidades.length,


            valuebets:

            oportunidades,



            atualizadoEm:

            new Date()

            .toISOString()



        });






    }


    catch(error){


        console.error(

            "Erro Value Bets:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });


    }



});






export default router;
