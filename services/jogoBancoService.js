// ==========================================
// BetVision AI
// routes/jogos.js
// Football-Data.org + PostgreSQL
// Versão corrigida
// ==========================================

import express from "express";

import {
    buscarJogos
} from "../services/futebolService.js";


import {
    salvarListaJogos
} from "../services/jogoBancoService.js";


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
// LISTAR JOGOS
// ==========================================


router.get("/", async (req,res)=>{


    try {


        console.log(
            "⚽ Buscando jogos Football-Data..."
        );



        const jogos = await buscarJogos();



        console.log(

            `⚽ ${jogos.length} jogos encontrados`

        );



        // ==================================
        // SALVAR NO POSTGRESQL
        // ==================================


        await salvarListaJogos(jogos);




        // ==================================
        // PROCESSAR IA + ODDS + VALUE BET
        // ==================================


        for(const jogo of jogos){



            // IA

            const analise =

            await gerarAnalise(jogo);



            jogo.analiseIA = analise;




            // ODDS

            const odds =

            await buscarOdds(
                jogo.id
            );



            jogo.odds = odds;




            // VALUE BET

            const value =

            await calcularValueBet(

                jogo,

                analise,

                odds

            );



            jogo.valueBet = value;



        }




        console.log(

            `🤖 ${jogos.length} jogos analisados`

        );





        res.json({

            total:jogos.length,

            jogos


        });





    }

    catch(error){



        console.error(

            "❌ Erro rota jogos:",

            error.message

        );



        res.status(500).json({


            erro:
            "Erro ao buscar jogos",


            detalhe:
            error.message


        });



    }



});





export default router;
