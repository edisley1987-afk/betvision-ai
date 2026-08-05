// ==========================================
// BetVision AI
// routes/analises.js
// Versão 11.0
// API Análises IA
// Compatível PostgreSQL
// ==========================================


import express from "express";

import db from "../database/database.js";


import {
    analisarJogo
} from "../services/inteligenciaService.js";


import {
    listarJogos
} from "../services/jogoBancoService.js";



const router = express.Router();





// ==========================================
// GET /api/analises
// Gerar e listar análises IA
// ==========================================


router.get("/", async(req,res)=>{


    try{


        console.log(

            "🤖 Buscando análises IA..."

        );



        const jogos =

        await listarJogos();





        if(

            !jogos ||

            jogos.length === 0

        ){


            return res.json({


                sucesso:true,


                total:0,


                analises:[]


            });


        }






        const analises=[];






        for(

            const jogo of jogos.slice(0,20)

        ){


            const analise =

            await analisarJogo(jogo);




            if(analise){


                analises.push(analise);


            }



        }







        res.json({


            sucesso:true,


            total:

            analises.length,



            analises



        });






    }


    catch(error){



        console.error(

            "❌ Erro API análises:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });



    }



});









// ==========================================
// GET /api/analises/salvas
// Buscar histórico IA
// ==========================================


router.get(

"/salvas",

async(req,res)=>{


    try{


        const resultado =

        await db.query(`


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



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });


    }



});









// ==========================================
// GET /api/analises/:id
// Buscar análise específica
// ==========================================


router.get(

"/:id",

async(req,res)=>{


    try{


        const resultado =

        await db.query(`


            SELECT *

            FROM analises

            WHERE id=$1


        `,

        [

            req.params.id

        ]);





        if(

            resultado.rows.length===0

        ){


            return res.status(404).json({


                sucesso:false,


                erro:

                "Análise não encontrada"


            });


        }





        res.json({


            sucesso:true,


            analise:

            resultado.rows[0]


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
