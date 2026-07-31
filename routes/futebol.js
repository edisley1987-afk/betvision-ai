// ==========================================
// BetVision AI
// routes/futebol.js
// Football-Data.org v4
// ==========================================

import express from "express";

import {
    buscarJogos
} from "../services/futebolService.js";


const router = express.Router();



// ==========================================
// JOGOS DO DIA
// ==========================================

router.get("/jogos", async(req,res)=>{


    try{


        const jogos =
            await buscarJogos();



        res.json({


            total:
                jogos.length,


            jogos



        });



    }
    catch(error){


        console.error(
            "Erro futebol:",
            error.message
        );


        res.status(500).json({


            erro:
                "Erro ao buscar jogos",


            detalhe:
                error.message


        });



    }



});



export default router;
