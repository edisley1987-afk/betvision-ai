// ==================================================
// BETVISION AI
// routes/campeonatos.js
// API de Campeonatos
// ==================================================

import express from "express";
import { query } from "../database/database.js";


const router = express.Router();



// ==================================================
// LISTAR CAMPEONATOS
// ==================================================

router.get(
    "/",
    async (req,res)=>{


        try{


            const resultado =
                await query(
                    `
                    SELECT

                    id,
                    api_id,
                    nome,
                    pais,
                    continente,
                    temporada,
                    logo,
                    ativo

                    FROM campeonatos

                    ORDER BY nome ASC

                    `
                );



            res.json({

                sucesso:true,

                total:
                    resultado.rows.length,

                campeonatos:
                    resultado.rows

            });



        }
        catch(erro){


            console.error(
                "Erro campeonatos:",
                erro.message
            );


            res.status(500)
            .json({

                sucesso:false,

                erro:
                    erro.message

            });


        }


    }

);




export default router;
