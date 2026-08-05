// ==========================================
// BetVision AI
// routes/analises.js
// Versão 12.0
// API Análises IA
// PostgreSQL
// ==========================================

import express from "express";

import db from "../database/database.js";

import {
    analisarMercado,
    listarAnalises
} from "../services/inteligenciaService.js";



const router = express.Router();





// ==========================================
// GET /api/analises
//
// Retorna análises salvas
// Não recria IA a cada chamada
// ==========================================

router.get("/", async(req,res)=>{


    try{


        console.log(

            "🤖 Buscando análises IA..."

        );




        const resultado =

            await listarAnalises();





        res.json({


            sucesso:true,


            total:

            resultado.length,


            analises:

            resultado



        });




    }

    catch(error){


        console.error(

            "❌ Erro buscar análises:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });


    }


});








// ==========================================
// GET /api/analises/gerar
//
// Executa IA manualmente
// ==========================================

router.get(

"/gerar",

async(req,res)=>{


    try{


        console.log(

            "🤖 Gerando novas análises IA..."

        );





        const analises =

            await analisarMercado();





        res.json({


            sucesso:true,


            total:

            analises.length,


            analises



        });



    }

    catch(error){


        console.error(

            "❌ Erro gerar análises:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });


    }



});

// ==========================================
// GET /api/analises/salvas
//
// Histórico das análises IA
// ==========================================

router.get(

"/salvas",

async(req,res)=>{


    try{


        const resultado =

        await db.query(`


            SELECT


                id,

                jogo,


                probabilidade_casa,

                probabilidade_empate,

                probabilidade_fora,


                gols_esperados,

                placar_previsto,


                value_bet,

                confianca,


                algoritmo,


                criado_em


            FROM analises


            ORDER BY id DESC


            LIMIT 100



        `);






        const analises =

        resultado.rows.map(item=>({


            id:item.id,


            jogo:item.jogo,



            favorito:

            descobrirFavorito(

                item

            ),



            probabilidade:

            maiorProbabilidade(

                item

            ),



            probabilidadeCasa:

            Number(

                item.probabilidade_casa

            ),



            probabilidadeEmpate:

            Number(

                item.probabilidade_empate

            ),



            probabilidadeFora:

            Number(

                item.probabilidade_fora

            ),



            golsEsperados:

            Number(

                item.gols_esperados

            ),



            placar:

            item.placar_previsto,



            confianca:

            item.confianca,



            valueBet:

            item.value_bet,



            algoritmo:

            item.algoritmo,



            criadoEm:

            item.criado_em



        }));







        res.json({


            sucesso:true,


            total:

            analises.length,


            analises



        });




    }

    catch(error){



        console.error(

            "❌ Erro análises salvas:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });


    }


});









// ==========================================
// FUNÇÃO FAVORITO
// ==========================================

function descobrirFavorito(item){



    const casa =

        Number(

            item.probabilidade_casa

        );



    const fora =

        Number(

            item.probabilidade_fora

        );





    if(casa > fora){


        return item.jogo

            .split(" x ")[0];


    }




    if(fora > casa){


        return item.jogo

            .split(" x ")[1];


    }




    return "Empate";


}








// ==========================================
// MAIOR PROBABILIDADE
// ==========================================

function maiorProbabilidade(item){



    return Math.max(


        Number(

            item.probabilidade_casa

        ),


        Number(

            item.probabilidade_empate

        ),


        Number(

            item.probabilidade_fora

        )



    );



}

// ==========================================
// GET /api/analises/:id
//
// Buscar análise específica
// ==========================================

router.get(

"/:id",

async(req,res)=>{


    try{


        const resultado =

        await db.query(`


            SELECT *

            FROM analises

            WHERE id=$1


        `,

        [

            req.params.id

        ]);





        if(

            resultado.rows.length === 0

        ){


            return res.status(404).json({


                sucesso:false,


                erro:

                "Análise não encontrada"


            });


        }






        const item =

            resultado.rows[0];






        res.json({


            sucesso:true,


            analise:{


                id:item.id,


                jogo:item.jogo,



                favorito:

                descobrirFavorito(

                    item

                ),



                probabilidade:

                maiorProbabilidade(

                    item

                ),



                probabilidadeCasa:

                Number(

                    item.probabilidade_casa

                ),



                probabilidadeEmpate:

                Number(

                    item.probabilidade_empate

                ),



                probabilidadeFora:

                Number(

                    item.probabilidade_fora

                ),



                golsEsperados:

                Number(

                    item.gols_esperados

                ),



                placar:

                item.placar_previsto,



                confianca:

                item.confianca,



                algoritmo:

                item.algoritmo



            }



        });




    }

    catch(error){



        console.error(

            "❌ Erro buscar análise:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });



    }


});









// ==========================================
// DELETE /api/analises/limpar
//
// Limpa análises antigas
// ==========================================

router.delete(

"/limpar",

async(req,res)=>{


    try{


        const resultado =

        await db.query(`


            DELETE FROM analises

            WHERE criado_em <

            NOW() - INTERVAL '30 days'


            RETURNING id



        `);






        res.json({


            sucesso:true,


            removidas:

            resultado.rows.length



        });



    }

    catch(error){


        console.error(

            "❌ Erro limpar análises:",

            error.message

        );



        res.status(500).json({


            sucesso:false,


            erro:error.message


        });


    }


});









// ==========================================
// EXPORT ROUTER
// ==========================================

export default router;
