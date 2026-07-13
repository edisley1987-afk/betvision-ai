import { Router } from "express";

import {
    listarAnalises,
    buscarAnalise,
    listarValueBets,
    estatisticasDashboard
} from "../services/analiseService.js";

const router = Router();

// ===================================
// Todas as análises
// GET /api/analises
// ===================================
router.get("/", (req, res) => {

    res.json(listarAnalises());

});

// ===================================
// Buscar análise por ID
// GET /api/analises/1
// ===================================
router.get("/:id", (req, res) => {

    const jogo = buscarAnalise(req.params.id);

    if (!jogo) {

        return res.status(404).json({

            erro: true,

            mensagem: "Jogo não encontrado."

        });

    }

    res.json(jogo);

});

// ===================================
// Value Bets
// GET /api/analises/valuebets
// ===================================
router.get("/valuebets/lista", (req, res) => {

    res.json(listarValueBets());

});

// ===================================
// Dashboard
// GET /api/analises/dashboard
// ===================================
router.get("/dashboard/resumo", (req, res) => {

    res.json(estatisticasDashboard());

});

export default router;
