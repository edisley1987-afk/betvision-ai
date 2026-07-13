import express from "express";
import { buscarOdds } from "../services/oddsService.js";


const router = express.Router();



/*
 Buscar odds de um jogo
*/

router.get("/:id", async(req,res)=>{


    try{


        const odds = await buscarOdds(
            req.params.id
        );


        res.json({

            jogo:req.params.id,

            odds

        });



    }catch(error){


        res.status(500).json({

            erro:"Erro ao consultar odds",

            detalhe:error.message

        });


    }


});


export default router;
