// ==========================================
// BetVision AI
// routes/jogos.js
// Versão 11.0
// API Jogos corrigida
// Compatível PostgreSQL
// ==========================================


import express from "express";

import {

    salvarListaJogos,

    listarJogos

} from "../services/jogoBancoService.js";

import {

    buscarJogosDia

} from "../services/futebolService.js";



const router = express.Router();







// ==========================================
// GET /api/jogos
// Jogos do dia
// ==========================================


router.get("/", async(req,res)=>{


    try{


        console.log(

            "⚽ API JOGOS DO DIA"

        );





        let jogos=[];





        // ==============================
        // Buscar API Futebol
        // ==============================


        try{


            jogos =

            await buscarJogosDia();



        }

        catch(error){


            console.log(

                "⚠️ API futebol indisponível:",

                error.message

            );


        }







        // ==============================
        // Salvar banco
        // ==============================


        if(

            jogos.length > 0

        ){


            await salvarListaJogos(jogos);



            console.log(

                "💾 Jogos salvos PostgreSQL"

            );


        }








        // ==============================
        // Buscar banco atualizado
        // ==============================


        const banco =

        await listarJogos();





        res.json({


            sucesso:true,


            total:

            banco.length,



            jogos:


            banco.map(jogo=>({



                id:

                jogo.id,



                campeonato:

                jogo.campeonato || "Futebol",



                casa:

                jogo.time_casa,



                fora:

                jogo.time_fora,



                horario:

                jogo.data_jogo,



                status:

                jogo.status || "agendado"



            }))



        });





    }

    catch(error){



        console.error(

            "❌ Erro jogos:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });



    }



});









// ==========================================
// GET /api/jogos/banco
// Somente PostgreSQL
// ==========================================


router.get(

"/banco",

async(req,res)=>{


    try{


        const jogos =

        await listarJogos();




        res.json({


            sucesso:true,


            total:

            jogos.length,


            jogos



        });



    }

    catch(error){



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });



    }



});








export default router;
