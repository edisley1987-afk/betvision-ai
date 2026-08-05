// ==========================================
// BetVision AI
// routes/analises.js
// Versão 12.0
// API Análises IA Corrigida
// ==========================================


import express from "express";

import db from "../database/database.js";

import {
    analisarJogo,
    listarAnalises
}
from "../services/inteligenciaService.js";


import {
    listarJogos
}
from "../services/jogoBancoService.js";



const router = express.Router();




// ==========================================
// GET /api/analises
// Apenas consultar análises salvas
// ==========================================

router.get("/", async(req,res)=>{


    try{


        console.log(
            "📊 Consultando análises IA..."
        );



        const dados =

            await listarAnalises();




        res.json({


            sucesso:true,


            total:

            dados.length,


            analises:

            dados



        });




    }


    catch(error){


        console.error(

            "❌ Erro consultar análises:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message



        });



    }


});
// ==========================================
// POST /api/analises/gerar
// Executar nova análise IA
// ==========================================

router.post("/gerar", async(req,res)=>{


    try{


        console.log(

            "🤖 Gerando novas análises IA..."

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






        const resultados = [];






        for(

            const jogo of jogos.slice(0,20)

        ){



            const analise =

                await analisarJogo(

                    jogo

                );





            if(analise){


                resultados.push(

                    analise

                );


            }



        }





        res.json({



            sucesso:true,



            total:

            resultados.length,



            analises:

            resultados



        });





    }


    catch(error){



        console.error(

            "❌ Erro gerar análises:",

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
// Histórico IA PostgreSQL
// ==========================================

router.get("/salvas", async(req,res)=>{


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



        console.error(

            "❌ Erro buscar histórico:",

            error.message

        );



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

router.get("/:id", async(req,res)=>{


    try{


        const resultado =

        await db.query(`


            SELECT *

            FROM analises

            WHERE id = $1

            LIMIT 1


        `,[


            req.params.id


        ]);





        if(

            resultado.rows.length === 0

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



        console.error(

            "❌ Erro buscar análise:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message



        });



    }



});








// ==========================================
// DELETE /api/analises/limpar
// Limpar análises antigas
// ==========================================

router.delete("/limpar", async(req,res)=>{


    try{


        const resultado =

        await db.query(`


            DELETE FROM analises

            WHERE criado_em < NOW() - INTERVAL '30 days'


        `);





        res.json({



            sucesso:true,



            removidos:

            resultado.rowCount



        });





    }


    catch(error){



        console.error(

            "❌ Erro limpar análises:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message



        });



    }



});









// ==========================================
// EXPORT
// ==========================================

export default router;
