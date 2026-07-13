import express from "express";
import { gerarAnalise } from "../services/iaService.js";


const router = express.Router();



/*
 Gerar análise IA
*/

router.post("/", async(req,res)=>{


    try{


        const resultado = await gerarAnalise(
            req.body
        );


        res.json(resultado);



    }catch(error){


        res.status(500).json({

            erro:"Falha na análise IA",

            detalhe:error.message

        });


    }


});



export default router;
