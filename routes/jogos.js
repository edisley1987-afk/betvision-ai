// ==========================================
// BetVision AI
// routes/jogos.js
// Versão 4.0
// ==========================================


import express from "express";

import db from "../database/database.js";

import { 
    buscarJogosComAnalise 
} from "../services/futebolService.js";

import { 
    buscarOdds 
} from "../services/oddsService.js";

import { 
    calcularValueBet 
} from "../services/valueBetService.js";



const router = express.Router();





// ==========================================
// LISTAR JOGOS + IA + VALUE BET
// ==========================================


router.get("/", async (req,res)=>{


    try {



        const jogos = 
        await buscarJogosComAnalise();





        for(const jogo of jogos){



            /*
            =================================
            SALVAR JOGO
            =================================
            */


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
                DO NOTHING

                `,

                [

                    jogo.id,

                    jogo.campeonato,

                    jogo.casa,

                    jogo.fora,

                    jogo.horario,

                    jogo.estadio,

                    jogo.status

                ]);


            }

            catch(error){


                console.log(

                    "Erro salvando jogo:",
                    error.message

                );


            }






            /*
            =================================
            ANALISE IA
            =================================
            */


            if(jogo.analiseIA){



                const ia =
                jogo.analiseIA;





                try {



                    const existe =
                    await db.query(

                    `
                    SELECT id

                    FROM analises

                    WHERE jogo=$1

                    LIMIT 1

                    `,

                    [

                        ia.jogo

                    ]

                    );





                    if(
                        existe.rows.length === 0
                    ){



                        await db.query(

                        `
                        INSERT INTO analises

                        (

                            jogo,

                            probabilidade_casa,

                            probabilidade_empate,

                            probabilidade_fora,

                            gols_esperados,

                            placar_previsto,

                            value_bet,

                            confianca,

                            algoritmo

                        )


                        VALUES

                        ($1,$2,$3,$4,$5,$6,$7,$8,$9)

                        `,


                        [


                            ia.jogo,


                            ia.probabilidadeVitoriaCasa,


                            25,


                            100 -
                            ia.probabilidadeVitoriaCasa -
                            25,


                            2.1,


                            "2x1",


                            false,


                            ia.confianca || "Média",


                            "BetVision AI v4.0"



                        ]

                        );


                    }



                }

                catch(error){


                    console.log(

                        "Erro salvando IA:",
                        error.message

                    );


                }







                /*
                =================================
                VALUE BET
                =================================
                */


                try{


                    const odds =
                    await buscarOdds(

                        jogo.id

                    );



                    const value =
                    await calcularValueBet(

                        jogo,

                        ia,

                        odds

                    );



                    jogo.valueBet =
                    value;



                }


                catch(error){


                    console.log(

                        "Erro Value Bet:",
                        error.message

                    );


                }



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
            error

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
