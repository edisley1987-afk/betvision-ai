// ==========================================
// BetVision AI
// routes/jogos.js
// Football-Data.org v4
// ==========================================

import express from "express";

import {
    buscarJogos
} from "../services/futebolService.js";


const router = express.Router();


// ==========================================
// LISTAR JOGOS
// ==========================================

router.get("/", async (req,res)=>{


    try{


        const jogos = await buscarJogos();


        console.log(
            "⚽ Jogos enviados:",
            jogos.length
        );


        res.json({

            total:jogos.length,

            jogos

        });



    }
    catch(error){


        console.error(
            "Erro rota jogos:",
            error.message
        );


        res.status(500).json({

            erro:"Erro buscar jogos"

        });


    }


});


export default router;
