// ==========================================
// BetVision AI
// routes/api.js
// API Central Dashboard
// ==========================================

import express from "express";

import { buscarJogos } from "../services/futebolService.js";
import { listarCampeonatos } from "../services/bancoService.js";
import { listarAnalises } from "../services/bancoService.js";
import { listarValueBets } from "../services/bancoService.js";


const router = express.Router();


// ==========================================
// DASHBOARD
// ==========================================

router.get("/dashboard", async (req, res) => {

    try {

        const jogos =
            await buscarJogos();


        let campeonatos = [];

        let analises = [];

        let valuebets = [];


        try {

            campeonatos =
                await listarCampeonatos();

        } catch {

            campeonatos = [];

        }



        try {

            analises =
                await listarAnalises();

        } catch {

            analises = [];

        }



        try {

            valuebets =
                await listarValueBets();

        } catch {

            valuebets = [];

        }



        res.json({

            sistema:
                "BetVision AI",


            status:
                "operacional",


            jogosHoje:
                jogos.length,


            campeonatos:
                campeonatos.length,


            analisesIA:
                analises.length,


            valueBets:
                valuebets.length,


            modelo:
                "Probabilidade + Estatística",


            ultimaAtualizacao:
                new Date().toISOString()

        });


    }

    catch (erro) {


        console.error(
            "Erro dashboard:",
            erro.message
        );


        res.status(500).json({

            erro:
                "Falha no dashboard"


        });


    }


});



// ==========================================
// STATUS
// ==========================================

router.get("/status", (req,res)=>{


    res.json({

        sistema:
            "BetVision AI",

        status:
            "online",

        data:
            new Date().toISOString()

    });


});



export default router;
