// ==========================================
// BetVision AI
// routes/jogos.js
// Football-Data.org + IA + Value Bets
// ==========================================

import express from "express";

import { buscarJogos } from "../services/futebolService.js";
import { gerarAnalise } from "../services/iaService.js";
import { buscarOdds } from "../services/oddsService.js";
import { calcularValueBet } from "../services/valueBetService.js";

const router = express.Router();


// ==========================================
// LISTAR JOGOS
// ==========================================

router.get("/", async (req, res) => {

    try {

        const jogos = await buscarJogos();


        for (const jogo of jogos) {


            // ==========================
            // INTELIGÊNCIA ARTIFICIAL
            // ==========================

            const analise = await gerarAnalise(jogo);

            jogo.analiseIA = analise;



            // ==========================
            // ODDS
            // ==========================

            const odds = await buscarOdds(jogo.id);

            jogo.odds = odds;



            // ==========================
            // VALUE BET
            // ==========================

            const oddCasa =
                odds?.mercado?.vencedor?.casa || 0;


            const probabilidadeIA =
                analise?.probabilidade || 0;



            jogo.valueBet = calcularValueBet({

                jogo:
                    `${jogo.casa} x ${jogo.fora}`,

                mercado:
                    "Vencedor",

                selecao:
                    jogo.casa,

                odd:
                    oddCasa,

                probabilidadeIA

            });


        }



        res.json({

            total: jogos.length,

            jogos

        });


    }

    catch (erro) {


        console.error(
            "Erro rota jogos:",
            erro
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
