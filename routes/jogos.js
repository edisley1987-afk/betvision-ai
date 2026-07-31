// ==========================================
// BetVision AI
// routes/jogos.js
// Buscar jogos reais
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

async(req,res)=>{


    try{


        console.log(
            "📅 Buscando jogos..."
        );



        const jogos =

        await buscarJogos();



        console.log(

            `⚽ Jogos encontrados API: ${jogos.length}`

        );



        if(jogos.length > 0){


            await salvarListaJogos(
                jogos
            );


        }



        res.json({

            total:
            jogos.length,

            jogos

        });



    }

    catch(error){


        console.error(

            "Erro rota jogos:",

            error.message

        );


        res.status(500).json({

            erro:
            error.message

        });


    }


}


);



export default router;
