// ==========================================
// BetVision AI
// routes/analises.js
// Versão 8.0
// Engine IA + PostgreSQL
// ==========================================


import express from "express";

import {
    gerarAnalise
} from "../services/iaService.js";


import db from "../database/database.js";


const router = express.Router();





// ==========================================
// LISTAR ANÁLISES IA
// GET /api/analises
// ==========================================


router.get("/", async(req,res)=>{


    try{


        const resultado = await db.query(`

            SELECT *

            FROM analises

            ORDER BY id DESC

            LIMIT 50

        `);




        res.json({


            sucesso:true,


            total:

            resultado.rows.length,


            analises:

            resultado.rows


        });



    }

    catch(error){


        console.error(

            "❌ Erro buscar análises:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:

            "Erro ao buscar análises",


            detalhe:

            error.message


        });



    }


});







// ==========================================
// GERAR ANÁLISE IA
// POST /api/analises
// ==========================================


router.post("/", async(req,res)=>{


    try{



        const dados = req.body;




        const resultado =

            await gerarAnalise(

                dados

            );






        // salvar banco


        await db.query(

        `

        INSERT INTO analises

        (

            jogo,

            favorito,

            probabilidade,

            placar_previsto,

            gols_esperados,

            over25,

            confianca

        )


        VALUES

        ($1,$2,$3,$4,$5,$6,$7)


        `,


        [


            resultado.jogo || "Não informado",


            resultado.favorito || "-",


            resultado.probabilidade || 0,


            resultado.placar || "2 x 1",


            resultado.golsEsperados || 2.5,


            resultado.over25 || "SIM",


            resultado.confianca || "Média"


        ]


        );





        res.json({


            sucesso:true,


            analise:

            resultado



        });





    }

    catch(error){



        console.error(

            "❌ Erro gerar análise IA:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:

            "Falha na análise IA",


            detalhe:

            error.message



        });



    }


});







// ==========================================
// ANÁLISE AUTOMÁTICA DE JOGO
// GET /api/analises/:id
// ==========================================


router.get("/:id", async(req,res)=>{


    try{



        const resultado = await db.query(

        `

        SELECT *

        FROM analises

        WHERE id=$1

        `,


        [

            req.params.id

        ]


        );





        if(

            resultado.rows.length===0

        ){


            return res.status(404).json({


                erro:

                "Análise não encontrada"


            });


        }





        res.json(

            resultado.rows[0]

        );




    }

    catch(error){



        res.status(500).json({


            erro:

            error.message


        });


    }



});





// ==========================================
// EXPORT
// ==========================================


export default router;
