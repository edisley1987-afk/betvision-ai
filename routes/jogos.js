// ==========================================
// BetVision AI
// routes/jogos.js
// API-Football v3 + IA + Odds + ValueBet
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

router.get("/", async (req, res) => {


    try {


        const jogos = await buscarJogosHoje();



        const resultado = [];



        for (const jogo of jogos) {



            // ==========================
            // IA
            // ==========================

            const analise =
                await gerarAnalise(jogo);



            // ==========================
            // ODDS
            // ==========================

            const odds =
                await buscarOdds(jogo.id);



            // ==========================
            // VALUE BET
            // ==========================

            let valueBet = null;



            if (odds) {


                valueBet =
                    calcularValueBet({


                        jogo:
                            `${jogo.casa} x ${jogo.fora}`,


                        mercado:
                            "Vitória Casa",


                        selecao:
                            jogo.casa,


                        odd:
                            odds.mercado?.vencedor?.casa || 0,


                        probabilidadeIA:
                            analise.probabilidadeVitoriaCasa


                    });


            }



            resultado.push({


                ...jogo,


                analiseIA:
                    analise,


                odds,


                valueBet



            });



        }



        res.json({


            total:
                resultado.length,


            jogos:
                resultado



        });



    }


    catch (erro) {


        console.error(
            "Erro rota jogos:",
            erro.message
        );



        res.status(500).json({


            erro:
                "Erro ao buscar jogos",


            detalhe:
                erro.message



        });


    }



});





export default router;
