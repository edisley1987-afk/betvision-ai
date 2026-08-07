// ==================================================
// BETVISION AI
// routes/odds.js
// API de Odds
// Versão 3.0
// ==================================================

import express from "express";

import { query } from "../database/database.js";


const router = express.Router();



// ==================================================
// LISTAR ODDS
// ==================================================

router.get(
    "/",
    async (req,res)=>{


        try{


            const resultado =

                await query(

                    `
                    SELECT

                    o.id,

                    o.jogo_id,

                    o.casa_aposta,

                    o.mercado,

                    o.selecao,

                    o.odd,

                    o.atualizado_em,


                    j.data_jogo,


                    c.nome AS campeonato


                    FROM odds o


                    LEFT JOIN jogos j

                    ON j.id = o.jogo_id


                    LEFT JOIN campeonatos c

                    ON c.id = j.campeonato_id


                    ORDER BY o.atualizado_em DESC


                    LIMIT 100

                    `

                );



            res.json({

                sucesso:true,

                total:
                    resultado.rows.length,

                odds:
                    resultado.rows

            });



        }
        catch(erro){


            console.error(

                "Erro odds:",

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





// ==================================================
// BUSCAR ODDS POR JOGO
// ==================================================

router.get(
    "/jogo/:id",

    async(req,res)=>{


        try{


            const resultado =

                await query(

                    `
                    SELECT *

                    FROM odds

                    WHERE jogo_id = $1

                    ORDER BY odd DESC

                    `,

                    [
                        req.params.id
                    ]

                );



            res.json({

                sucesso:true,

                odds:
                    resultado.rows

            });



        }
        catch(erro){


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
