// ==========================================
// BetVision AI
// services/oddsService.js
// Fase 3
// Motor de Odds Reais
// ==========================================


import db from "../database/database.js";




// ==========================================
// SALVAR ODDS
// ==========================================


export async function salvarOdd(odd){


    try{


        await db.query(`


            INSERT INTO odds


            (

                jogo_id,

                jogo,

                mercado,

                selecao,

                odd,

                bookmaker


            )


            VALUES

            (

                $1,

                $2,

                $3,

                $4,

                $5,

                $6

            )


        `,[


            odd.jogo_id,


            odd.jogo,


            odd.mercado,


            odd.selecao,


            odd.odd,


            odd.bookmaker


        ]);



        return true;


    }


    catch(error){


        console.error(

            "❌ Erro salvar odd:",

            error.message

        );


        return false;


    }


}








// ==========================================
// BUSCAR ODDS POR JOGO
// ==========================================


export async function buscarOddsJogo(jogo_id){


    try{


        const resultado =


        await db.query(`


            SELECT *


            FROM odds


            WHERE jogo_id=$1


            ORDER BY odd DESC



        `,[

            jogo_id

        ]);



        return resultado.rows || [];


    }


    catch(error){


        console.error(

            "❌ Erro buscar odds:",

            error.message

        );


        return [];

    }


}








// ==========================================
// LISTAR TODAS ODDS
// ==========================================


export async function listarOdds(){


    try{


        const resultado =


        await db.query(`


            SELECT *


            FROM odds


            ORDER BY atualizado_em DESC


            LIMIT 500



        `);



        return resultado.rows || [];


    }


    catch(error){


        console.error(

            "❌ Erro listar odds:",

            error.message

        );


        return [];

    }


}








export default {


    salvarOdd,


    buscarOddsJogo,


    listarOdds


};
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
