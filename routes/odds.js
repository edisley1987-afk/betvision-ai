// ==========================================
// BetVision AI
// routes/odds.js
// Versão 8.0
// Rotas de Odds Reais
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

import {
    listarEsportes
} from "../services/oddsApi.js";

// ==========================================
// STATUS DA API DE ODDS
// GET /api/odds/status
// ==========================================

router.get("/status", async (req,res)=>{


    res.json({


        sistema:
            "BetVision AI",


        servico:
            "The Odds API",


        status:
            "online",


        horario:
            new Date().toISOString()


    });


});




// ==========================================
// TODAS AS ODDS DOS JOGOS
// GET /api/odds
// ==========================================

router.get("/", async(req,res)=>{


    try{


        console.log(
            "💰 Consultando odds..."
        );



        const jogos =
            await buscarJogos();



        const resultado =
            await buscarOddsJogos(
                jogos
            );



        res.json(resultado);



    }


    catch(error){


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
// ODDS DE UM JOGO ESPECÍFICO
// GET /api/odds/:id
// ==========================================

router.get("/:id", async(req,res)=>{


    try{


        const id =
            req.params.id;



        console.log(

            `💰 Buscando odd jogo ${id}`

        );



        const odds =
            await buscarOdds(id);



        if(!odds){


            return res.status(404).json({


                erro:
                    "Odds não encontradas"



            });


        }



        res.json({


            jogo:
                id,


            odds



        });



    }


    catch(error){



        console.error(

            "❌ Erro consultar odd:",

            error.message

        );



        res.status(500).json({


            erro:
                "Erro ao consultar odds",



            detalhe:
                error.message



        });



    }



});


router.get("/sports", async(req,res)=>{

    const esportes = await listarEsportes();

    res.json(esportes);

});

// ==========================================
// EXPORTAÇÃO
// ==========================================

export default router;
