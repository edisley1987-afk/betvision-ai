// ==========================================
// BetVision AI
// routes/jogos.js
// Versão 4.0 corrigida
// Jogos reais API-Football
// ==========================================


import express from "express";

import {
    buscarJogos
} from "../services/futebolService.js";


import db from "../database/database.js";



const router = express.Router();




// ==========================================
// LISTAR JOGOS REAIS
// API-FOOTBALL
// ==========================================


router.get("/", async (req,res)=>{


    try {



        const jogos = await buscarJogos();




        // ==================================
        // SALVAR JOGOS NO BANCO
        // ==================================


        for(const jogo of jogos){


            try {



                await db.query(

                `
                INSERT INTO jogos

                (

                    api_id,

                    campeonato,

                    time_casa,

                    time_fora,

                    data_jogo,

                    estadio,

                    status

                )


                VALUES

                ($1,$2,$3,$4,$5,$6,$7)


                ON CONFLICT(api_id)

                DO UPDATE SET


                    campeonato =
                    EXCLUDED.campeonato,


                    time_casa =
                    EXCLUDED.time_casa,


                    time_fora =
                    EXCLUDED.time_fora,


                    data_jogo =
                    EXCLUDED.data_jogo,


                    estadio =
                    EXCLUDED.estadio,


                    status =
                    EXCLUDED.status

                `,


                [


                    jogo.id,


                    jogo.campeonato,


                    jogo.casa,


                    jogo.fora,


                    jogo.horario,


                    jogo.estadio,


                    jogo.status || "Agendado"


                ]


                );



            }


            catch(error){


                console.log(

                    "Erro salvando jogo:",

                    error.message

                );


            }



        }







        res.json({



            total:

            jogos.length,



            jogos



        });





    }


    catch(error){



        console.error(

            "Erro rota jogos:",

            error.message

        );



        res.status(500).json({



            erro:

            "Erro ao carregar jogos",



            detalhe:

            error.message



        });



    }




});







export default router;
