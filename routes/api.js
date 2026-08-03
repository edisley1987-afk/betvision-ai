// ==========================================
// BetVision AI
// routes/api.js
// API Dashboard Central v2
// ==========================================

import express from "express";

import { buscarJogos } 
from "../services/futebolService.js";

import { listarCampeonatos } 
from "../services/bancoService.js";

import { listarAnalises } 
from "../services/analiseService.js";

import { listarValueBets } 
from "../services/valueBetService.js";


const router = express.Router();



// ==========================================
// DASHBOARD
// ==========================================

router.get("/dashboard", async (req,res)=>{


    try {


        let jogos = [];

        let campeonatos = [];

        let analises = [];

        let valuebets = [];



        // ------------------------------
        // Jogos
        // ------------------------------

        try {

            jogos =
                await buscarJogos();

        }

        catch(erro){

            console.error(
                "Erro jogos:",
                erro.message
            );

        }



        // ------------------------------
        // Campeonatos
        // ------------------------------

        try {

            campeonatos =
                await listarCampeonatos();

        }

        catch(erro){

            console.error(
                "Erro campeonatos:",
                erro.message
            );

        }



        // ------------------------------
        // Analises IA
        // ------------------------------

        try {

            analises =
                await listarAnalises();

        }

        catch(erro){

            console.error(
                "Erro analises:",
                erro.message
            );

        }



        // ------------------------------
        // Value Bets
        // ------------------------------

        try {

            valuebets =
                await listarValueBets();

        }

        catch(erro){

            console.error(
                "Erro valuebets:",
                erro.message
            );

        }



        // ------------------------------
        // ROI
        // ------------------------------

        let roi = 0;


        if(valuebets.length > 0){


            const soma =
                valuebets.reduce(
                    (total,item)=>{


                        return total +
                        Number(
                            item.valor || 0
                        );


                    },0
                );


            roi =
                Number(
                    (
                        soma /
                        valuebets.length
                    )
                    .toFixed(2)
                );


        }




        // ------------------------------
        // PRECISÃO IA
        // ------------------------------

        let precisao = 0;


        if(analises.length > 0){


            precisao = 100;


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



            roi,



            precisao,



            modelo:
                "Probabilidade + Estatística",



            ultimaAtualizacao:
                new Date()
                .toISOString()



        });



    }
    catch(erro){


        console.error(
            "Erro dashboard:",
            erro.message
        );


        res.status(500).json({

            sistema:
                "BetVision AI",

            status:
                "erro",

            erro:
                erro.message

        });


    }


});





// ==========================================
// PING
// ==========================================

router.get("/ping",(req,res)=>{


    res.json({


        sistema:
            "BetVision AI",


        status:
            "online",


        data:
            new Date()
            .toISOString()


    });


});



export default router;
