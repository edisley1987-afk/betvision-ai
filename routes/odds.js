// ==========================================
// BetVision AI
// routes/odds.js
// API de Odds
// Versão corrigida 9.0
// ==========================================


import express from "express";


import {

    buscarOdds

} from "../services/oddsService.js";



const router = express.Router();




// ==========================================
// TODAS AS ODDS
// GET /api/odds
// ==========================================


router.get(

"/",

async (req,res)=>{


    try{


        console.log("");

        console.log(
            "================================="
        );


        console.log(
            "💰 API ODDS BETVISION AI"
        );


        console.log(
            "================================="
        );




        const odds =

            await buscarOdds();





        console.log(

            `💎 Odds retornadas: ${odds.length}`

        );






        return res.json({


            sucesso:

                true,



            total:

                odds.length,



            jogos:

                odds,



            atualizadoEm:

                new Date()

                .toISOString()



        });





    }

    catch(error){



        console.error(


            "❌ Erro rota odds:",


            error.message


        );





        return res.status(500).json({



            sucesso:

                false,



            total:

                0,



            jogos:

                [],



            erro:

                error.message



        });



    }


}

);









// ==========================================
// ODDS POR ID
// GET /api/odds/:id
// ==========================================


router.get(

"/:id",

async(req,res)=>{


    try{


        const odds =

            await buscarOdds();





        const jogo =

            odds.find(


                item =>


                String(item.id) ===

                String(req.params.id)



            );






        return res.json(


            jogo ||

            null


        );




    }

    catch(error){



        console.error(

            "❌ Erro consultar odd:",

            error.message

        );



        return res.status(500).json({



            erro:

                "Erro consultar odd"



        });



    }


}

);









// ==========================================
// EXPORTAÇÃO
// ==========================================


export default router;
