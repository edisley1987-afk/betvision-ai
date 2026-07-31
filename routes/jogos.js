// ==========================================
// BetVision AI
// routes/jogos.js
// Football-Data.org v4
// ==========================================

import express from "express";

import {
    buscarJogos
} from "../services/futebolService.js";


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

router.get("/", async(req,res)=>{


    try{


        const jogos =
            await buscarJogos();



        const lista = [];



        for(const jogo of jogos){



            const analise =
                await gerarAnalise(jogo);



            const odds =
                await buscarOdds(jogo.id);



            let valueBet = null;



            if(odds?.mercado?.vencedor){



                valueBet =
                calcularValueBet({


                    jogo:
                        `${jogo.casa} x ${jogo.fora}`,


                    mercado:
                        "Vencedor",


                    selecao:
                        "Casa",


                    odd:
                        odds.mercado.vencedor.casa,


                    probabilidadeIA:
                        analise.probabilidadeCasa



                });



            }




            lista.push({


                ...jogo,


                analiseIA:
                    analise,


                odds,


                valueBet



            });



        }



        res.json({


            total:
                lista.length,


            jogos:
                lista



        });



    }

    catch(error){


        console.error(
            "Erro jogos:",
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
