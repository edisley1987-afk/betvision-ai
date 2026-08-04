// ==========================================
// BetVision AI
// routes/odds.js
// Versão 7.0
// ==========================================

import express from "express";

import {
    buscarOdds,
    buscarOddsJogos
} from "../services/oddsService.js";

import {
    buscarJogos
} from "../services/futebolService.js";

const router = express.Router();
// ==========================================
// TODAS AS ODDS DOS JOGOS DO DIA
// GET /api/odds
// ==========================================

router.get("/", async (req, res) => {

    try {

        const jogos = await buscarJogos();

        const odds = await buscarOddsJogos(jogos);

        res.json(odds);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            erro: "Erro ao buscar odds",

            detalhe: error.message

        });

    }

});

// ==========================================
// ODDS DE UM JOGO
// GET /api/odds/:id
// ==========================================

router.get("/:id", async (req, res) => {

    try {

        const odds = await buscarOdds(req.params.id);

        res.json({

            jogo: req.params.id,

            odds

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            erro: "Erro ao consultar odds",

            detalhe: error.message

        });

    }

});

// ==========================================
// EXPORTAÇÃO
// ==========================================

export default router;
