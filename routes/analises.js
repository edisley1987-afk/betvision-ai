import express from "express";
import { gerarAnalise } from "../services/iaService.js";
import db from "../database/database.js";


const router = express.Router();



/*
====================================
 LISTAR ANÁLISES IA
====================================
*/

router.get("/", async(req,res)=>{

    try{


        const resultado = await db.query(`

            SELECT *
            FROM analises
            ORDER BY id DESC

        `);


        res.json({

            total:
            resultado.rows.length,


            analises:
            resultado.rows

        });



    }catch(error){


        res.status(500).json({

            erro:
            "Erro ao buscar análises",

            detalhe:
            error.message

        });


    }


});




/*
====================================
 GERAR ANÁLISE IA
====================================
*/

router.post("/", async(req,res)=>{


    try{


        const resultado = await gerarAnalise(
            req.body
        );


        res.json(resultado);



    }catch(error){


        res.status(500).json({

            erro:
            "Falha na análise IA",

            detalhe:
            error.message

        });


    }


});



export default router;
