// ==========================================
// BetVision AI
// routes/jogos.js
// API-Football + IA + Odds + ValueBet + Banco
// ==========================================


import express from "express";


import {
    buscarJogosHoje
} from "../services/partidasService.js";


import {
    gerarAnalise
} from "../services/iaService.js";


import {
    buscarOdds
} from "../services/oddsService.js";


import {
    calcularValueBet
} from "../services/valueBetService.js";


import {
    salvarListaJogos
} from "../services/jogoBancoService.js";



const router = express.Router();




// ==========================================
// LISTAR JOGOS DO DIA
// ==========================================

router.get("/", async (req, res) => {


    try {


        // Buscar jogos reais API-Football

        const jogos = await buscarJogosHoje();



        // Salvar jogos no PostgreSQL

        await salvarListaJogos(jogos);



        const resultado = [];



        for (const jogo of jogos) {



            // ==============================
            // ANALISE IA
            // ==============================

            const analise =
                await gerarAnalise(jogo);




            // ==============================
            // ODDS
            // ==============================

            const odds =
                await buscarOdds(jogo.id);




            // ==============================
            // VALUE BET
            // ==============================

            let valueBet = null;



            if (odds) {


                valueBet =
                    calcularValueBet({


                        jogo:
                            `${jogo.casa} x ${jogo.fora}`,



                        mercado:
                            "Vitória Casa",



                        selecao:
                            jogo.casa,



                        odd:
                            odds.mercado
                                ?.vencedor
                                ?.casa || 0,



                        probabilidadeIA:
                            analise
                                .probabilidadeVitoriaCasa


                    });


            }





            resultado.push({


                id:
                    jogo.id,


                campeonato:
                    jogo.campeonato,


                casa:
                    jogo.casa,


                fora:
                    jogo.fora,


                horario:
                    jogo.horario,


                status:
                    jogo.status,



                analiseIA:
                    analise,



                odds:
                    odds,



                valueBet:
                    valueBet



            });



        }





        res.json({


            total:
                resultado.length,


            jogos:
                resultado



        });




    }


    catch (erro) {


        console.error(

            "❌ Erro rota jogos:",

            erro.message

        );



        res.status(500).json({


            erro:
                "Erro ao buscar jogos",



            detalhe:
                erro.message



        });



    }



});





export default router;
