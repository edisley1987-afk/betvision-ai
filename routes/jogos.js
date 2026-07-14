import express from "express";
import { buscarJogos } from "../services/futebolService.js";
import db from "../database/database.js";

const router = express.Router();



/*
====================================
 Lista jogos disponíveis
 Salva análises IA e Value Bets
====================================
*/

router.get("/", async (req,res)=>{

    try{

        const jogos = await buscarJogos();


        for (const jogo of jogos) {


            if (!jogo.analiseIA) {
                continue;
            }


            const analise = jogo.analiseIA;



            // Salvar análise IA

            await db.query(

                `
                INSERT INTO analises (

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

                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)

                `,

                [

                    analise.jogo,

                    analise.probabilidadeCasa,

                    analise.probabilidadeEmpate,

                    analise.probabilidadeFora,

                    analise.golsEsperados,

                    analise.placarPrevisto,

                    analise.valueBet,

                    analise.confianca,

                    analise.algoritmo

                ]

            );




            // Se for Value Bet, salvar também

            if (analise.valueBet === true) {


                await db.query(

                    `
                    INSERT INTO valuebets (

                        jogo,

                        mercado,

                        confianca

                    )

                    VALUES ($1,$2,$3)

                    `,

                    [

                        analise.jogo,

                        "Resultado Final",

                        analise.confianca

                    ]

                );


            }


        }



        res.json({

            total:jogos.length,

            jogos

        });



    }catch(error){


        console.error(error);


        res.status(500).json({

            erro:"Erro ao buscar jogos",

            detalhe:error.message

        });


    }

});



export default router;
