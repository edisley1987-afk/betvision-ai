//
// ==================================================
// BETVISION AI
// routes/analises.js
// Rotas de Análises IA v5.2
// PostgreSQL + Inteligência Estatística
// ==================================================


import express from "express";

import {

    analisarMercado,

    listarAnalises

} from "../services/inteligenciaService.js";


import {

    gerarAnaliseIA

} from "../services/inteligenciaService.js";


const router = express.Router();



// ==================================================
// LISTAR TODAS AS ANÁLISES
// GET /api/analises
// ==================================================

router.get(

    "/",

    async (req,res)=>{


        try{


            const resultado =

                await listarAnalises();



            res.json({

                sucesso:true,

                total:

                    resultado.length,


                dados:

                    resultado


            });



        }catch(erro){


            console.error(

                "Erro listar análises:",

                erro.message

            );


            res.status(500).json({

                sucesso:false,

                erro:

                    erro.message

            });


        }


    }

);





// ==================================================
// ANALISAR JOGO
// POST /api/analises
// ==================================================

router.post(

    "/",

    async(req,res)=>{


        try{


            const {


                jogo,

                dados = {}


            } = req.body;



            if(!jogo){


                return res.status(400).json({

                    sucesso:false,

                    erro:

                    "Jogo obrigatório"

                });


            }



            const resultado =


                await analisarMercado(

                    jogo,

                    dados

                );



            res.json(

                resultado

            );



        }catch(erro){


            console.error(

                "Erro análise IA:",

                erro.message

            );


            res.status(500).json({

                sucesso:false,

                erro:

                    erro.message

            });


        }


    }

);





// ==================================================
// ANALISE DIRETA
// POST /api/analises/prever
// ==================================================

router.post(

    "/prever",

    async(req,res)=>{


        try{


            const {


                jogo,

                dados={}


            } = req.body;



            const resultado =


                await gerarAnaliseIA(

                    jogo,

                    dados

                );



            res.json({

                sucesso:true,

                resultado


            });



        }catch(erro){


            res.status(500).json({

                sucesso:false,

                erro:

                    erro.message

            });


        }


    }

);





// ==================================================
// BUSCAR ANÁLISE POR ID
// GET /api/analises/:id
// ==================================================

router.get(

    "/:id",

    async(req,res)=>{


        try{


            const lista =

                await listarAnalises();



            const analise =

                lista.find(

                    item =>

                    item.id == req.params.id

                );



            if(!analise){


                return res.status(404).json({

                    sucesso:false,

                    erro:

                    "Análise não encontrada"

                });


            }



            res.json({

                sucesso:true,

                dados:

                    analise

            });



        }catch(erro){


            res.status(500).json({

                sucesso:false,

                erro:

                    erro.message

            });


        }


    }

);




// ==================================================
// EXPORT
// ==================================================

export default router;
