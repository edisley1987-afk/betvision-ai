// ==========================================
// BetVision AI
// routes/odds.js
// Versão 8.0
// Integração direta The Odds API
// ==========================================


import express from "express";

import {

    buscarOdds

} from "../services/oddsService.js";


const router = express.Router();



// ==========================================
// TODAS AS ODDS DISPONÍVEIS
// GET /api/odds
// ==========================================


router.get("/", async (req, res) => {


    try {


        console.log(
            "💰 Consultando odds..."
        );


        const odds = await buscarOdds();



        res.json(odds || []);



    } catch (error) {


        console.error(

            "❌ Erro rota odds:",

            error.message

        );


        res.status(500).json({


            erro:

            "Erro ao buscar odds",


            detalhe:

            error.message



        });


    }



});




// ==========================================
// ODDS POR ID
// GET /api/odds/:id
// ==========================================


router.get("/:id", async (req, res) => {


    try {


        const todasOdds = await buscarOdds();



        const jogo = todasOdds.find(

            item =>

            String(item.id) ===

            String(req.params.id)

        );



        res.json(

            jogo || null

        );



    } catch(error){



        console.error(

            error.message

        );



        res.status(500).json({


            erro:

            "Erro consultar odd"



        });



    }



});




// ==========================================
// EXPORTAÇÃO
// ==========================================


export default router;
