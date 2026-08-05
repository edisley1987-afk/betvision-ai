// ==========================================
// BetVision AI
// routes/odds.js
// Fase 3
// API Odds
// ==========================================


import express from "express";


import {

    salvarOdd,

    buscarOddsJogo,

    listarOdds

}

from "../services/oddsService.js";




const router = express.Router();





// ==========================================
// GET /api/odds
// Lista odds disponíveis
// ==========================================


router.get("/", async(req,res)=>{


    try{


        const odds =

            await listarOdds();



        res.json({


            sucesso:true,


            total:odds.length,


            odds



        });



    }


    catch(error){



        console.error(

            "❌ Erro API odds:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });


    }



});







// ==========================================
// GET /api/odds/:jogo_id
// Odds de um jogo
// ==========================================


router.get("/:jogo_id", async(req,res)=>{


    try{


        const odds =


            await buscarOddsJogo(

                req.params.jogo_id

            );




        res.json({


            sucesso:true,


            total:odds.length,


            odds



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
// POST /api/odds
// Inserir odd
// Preparado para API externa
// ==========================================


router.post("/", async(req,res)=>{


    try{


        const resultado =


            await salvarOdd(

                req.body

            );




        res.json({


            sucesso:resultado



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
