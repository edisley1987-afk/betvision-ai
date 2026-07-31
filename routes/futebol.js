// ==========================================
// BetVision AI
// routes/jogos.js
// Integração partidasService
// ==========================================

import express from "express";

import {
    buscarJogosHoje
} from "../services/partidasService.js";


import {
    gerarAnalise
} from "../services/iaService.js";


import {
    buscarOdds
} from "../services/oddsService.js";


import {
    calcularValueBet
} from "../services/valueBetService.js";


const router = express.Router();



// ==========================================
// LISTAR JOGOS DO DIA
// ==========================================

router.get("/", async (req,res)=>{


    try {


        const jogos =
            await buscarJogosHoje();



        for (const jogo of jogos) {



            const analise =
                await gerarAnalise(jogo);



            jogo.analiseIA =
                analise;



            const odds =
                await buscarOdds(jogo.id);



            jogo.odds =
                odds;



            jogo.valueBet =
                calcularValueBet({


                    jogo:
                        jogo.id,


                    mercado:
                        "Vencedor",


                    selecao:
                        jogo.casa,


                    odd:
                        odds?.mercado?.vencedor?.casa || 0,


                    probabilidadeIA:
                        analise.probabilidadeCasa


                });



        }



        res.json({


            total:
                jogos.length,


            jogos


        });



    }

    catch(erro){


        console.error(
            "Erro jogos:",
            erro.message
        );


        res.status(500).json({

            erro:
                "Erro ao buscar jogos"

        });


    }


});



export default router;
