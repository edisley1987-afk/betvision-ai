import express from "express";
import { buscarJogos } from "../services/futebolService.js";

const router = express.Router();


/*
 Lista jogos disponíveis
*/

router.get("/", async (req,res)=>{

    try{

        const jogos = await buscarJogos();

        res.json({

            total:jogos.length,

            jogos

        });


    }catch(error){

        res.status(500).json({

            erro:"Erro ao buscar jogos",

            detalhe:error.message

        });

    }

});


export default router;
