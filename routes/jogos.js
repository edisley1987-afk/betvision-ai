// ==========================================
// BetVision AI
// routes/jogos.js
// Buscar jogos reais
// API Jogos do Dia v2
// ==========================================

import express from "express";

import {
    buscarJogos
} from "../services/futebolService.js";


import {
    salvarListaJogos
} from "../services/jogoBancoService.js";



const router = express.Router();



// ==========================================
// GET JOGOS DO DIA
// ==========================================

router.get(
"/",
async (req,res)=>{


    try{


        console.log("");
        console.log(
            "===================================="
        );

        console.log(
            "⚽ API JOGOS DO DIA"
        );


        console.log(
            "===================================="
        );



        // Buscar jogos reais

        const jogos =
            await buscarJogos();



        console.log(
            `⚽ Jogos encontrados: ${jogos.length}`
        );



        // ==================================
        // SALVAR NO BANCO
        // NÃO BLOQUEIA RESPOSTA
        // ==================================

        if(jogos.length > 0){


            try{


                await salvarListaJogos(
                    jogos
                );


                console.log(
                    "💾 Jogos salvos PostgreSQL"
                );


            }
            catch(erro){


                console.error(
                    "⚠️ Erro salvando jogos:",
                    erro.message
                );


            }


        }



        // ==================================
        // RESPOSTA FRONTEND
        // ==================================

        return res.json({


            sucesso:
                true,


            total:
                jogos.length,


            jogos:
                jogos,


            atualizadoEm:
                new Date()
                .toISOString()



        });



    }
    catch(error){



        console.error(
            "❌ Erro rota jogos:",
            error.message
        );



        return res.status(500).json({


            sucesso:
                false,


            total:
                0,


            jogos:
                [],


            erro:
                error.message



        });


    }


});



export default router;
