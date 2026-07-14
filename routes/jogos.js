import express from "express";
import { buscarJogos } from "../services/futebolService.js";
import db from "../database/database.js";
import { buscarOdds } from "../services/oddsService.js";
import { calcularValueBet } from "../services/valueBetService.js";


const router = express.Router();



/*
====================================
 LISTA JOGOS DISPONÍVEIS

 Fluxo:

 Jogos
   ↓
 IA
   ↓
 Odds
   ↓
 Value Bet
   ↓
 Banco

====================================
*/


router.get("/", async (req,res)=>{


    try{


        const jogos = await buscarJogos();



        for (const jogo of jogos) {



            if (!jogo.analiseIA) {

                continue;

            }



            const analise =
            jogo.analiseIA;




            /*
            ====================================
            SALVAR ANÁLISE IA
            ====================================
            */


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





            /*
            ====================================
            CALCULAR VALUE BET
            ====================================
            */


            try{


                const odds =
                await buscarOdds(
                    jogo.id
                );



                const resultadoValueBet =

                await calcularValueBet(

                    jogo,

                    analise,

                    odds

                );




                jogo.valueBet =
                resultadoValueBet;



            }

            catch(error){


                console.log(

                    "Erro calculando Value Bet:",
                    error.message

                );


            }



        }





        res.json({

            total:jogos.length,

            jogos

        });





    }

    catch(error){



        console.error(error);



        res.status(500).json({

            erro:
            "Erro ao buscar jogos",

            detalhe:
            error.message

        });



    }


});



export default router;
