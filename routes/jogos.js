// ==========================================
// BetVision AI
// routes/jogos.js
// Versão Football-Data.org
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

            // IA
            const analise = await gerarAnalise(jogo);

            jogo.analiseIA = analise;

            // Odds
            const odds = await buscarOdds(jogo.id);

            jogo.odds = odds;

            // Value Bet
            const value = await calcularValueBet(

                jogo,
                analise,
                odds

            );

            jogo.valueBet = value;

        }

        res.json({

            total: jogos.length,

            jogos

        });

    }

    catch (erro) {

        console.error(erro);

        res.status(500).json({

            erro: "Erro ao buscar jogos",

            detalhe: erro.message

        });

    }

});

export default router;
