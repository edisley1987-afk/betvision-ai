// ==========================================
// BetVision AI
// routes/api.js
// API Dashboard Central
// ==========================================

import express from "express";

import { buscarJogos } from "../services/futebolService.js";
import { listarCampeonatos } from "../services/bancoService.js";

import { listarAnalises } from "../services/analiseService.js";
import { listarValueBets } from "../services/valueBetService.js";


const router = express.Router();



// ==========================================
// DASHBOARD
// ==========================================

router.get("/dashboard", async (req, res) => {

    try {


        const jogos =
            await buscarJogos();



        const campeonatos =
            await listarCampeonatos();



        let analises = [];

        let valuebets = [];



        try {

            analises =
                await listarAnalises();

        }

        catch {

            analises = [];

        }



        try {

            valuebets =
                await listarValueBets();

        }

        catch {

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
                "Erro ao carregar dashboard"

        });


    }


});





// ==========================================
// PING
// ==========================================

router.get("/ping", (req,res)=>{


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
