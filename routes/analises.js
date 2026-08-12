// ==================================================
// BETVISION AI
// routes/analises.js
//
// Rotas de Análises IA v5.3
// PostgreSQL + Inteligência Estatística
//
// CORREÇÕES:
//
// - GET /api/analises
//   Lista análises dos jogos de hoje
//
// - GET /api/analises/:id
//   Busca análise específica
//
// - POST /api/analises
//   Analisa jogo
//
// - POST /api/analises/prever
//   Análise IA direta
//
// - Compatível com America/Sao_Paulo
// - Não cria dados fictícios
// ==================================================

import express from "express";

import {
    analisarMercado,
    listarAnalises,
    gerarAnaliseIA
} from "../services/inteligenciaService.js";

const router =
    express.Router();


// ==================================================
// LISTAR ANÁLISES
//
// GET /api/analises
//
// IMPORTANTE:
//
// A função listarAnalises() do
// inteligenciaService.js deve retornar
// as análises dos jogos de hoje.
//
// Data considerada:
// America/Sao_Paulo
//
// Exemplo:
// 12/08/2026
// ==================================================

router.get(

    "/",

    async (
        req,
        res
    ) => {

        try {

            const resultado =
                await listarAnalises();


            const dados =
                Array.isArray(
                    resultado
                )
                    ? resultado
                    : [];


            res.json({

                sucesso:
                    true,

                total:
                    dados.length,

                dados:
                    dados

            });

        }

        catch (erro) {

            console.error(

                "❌ Erro listar análises:",

                erro.message

            );


            res.status(500).json({

                sucesso:
                    false,

                total:
                    0,

                dados:
                    [],

                erro:
                    erro.message

            });

        }

    }

);


// ==================================================
// ANALISAR JOGO
//
// POST /api/analises
//
// Body:
//
// {
//     "jogo": "SE Palmeiras x Club Cerro Porteño",
//     "dados": {}
// }
// ==================================================

router.post(

    "/",

    async (
        req,
        res
    ) => {

        try {

            const {

                jogo,

                dados = {}

            } = req.body || {};


            // ==================================================
            // VALIDAR JOGO
            // ==================================================

            if (
                !jogo ||
                typeof jogo !== "string" ||
                !jogo.trim()
            ) {

                return res.status(400).json({

                    sucesso:
                        false,

                    erro:
                        "Jogo obrigatório"

                });

            }


            // ==================================================
            // GERAR ANÁLISE
            // ==================================================

            const resultado =

                await analisarMercado(

                    jogo.trim(),

                    dados

                );


            res.json(

                resultado

            );

        }

        catch (erro) {

            console.error(

                "❌ Erro análise IA:",

                erro.message

            );


            res.status(500).json({

                sucesso:
                    false,

                erro:
                    erro.message

            });

        }

    }

);


// ==================================================
// ANÁLISE DIRETA
//
// POST /api/analises/prever
//
// Body:
//
// {
//     "jogo": "SE Palmeiras x Club Cerro Porteño",
//     "dados": {}
// }
// ==================================================

router.post(

    "/prever",

    async (
        req,
        res
    ) => {

        try {

            const {

                jogo,

                dados = {}

            } = req.body || {};


            // ==================================================
            // VALIDAR JOGO
            // ==================================================

            if (
                !jogo ||
                typeof jogo !== "string" ||
                !jogo.trim()
            ) {

                return res.status(400).json({

                    sucesso:
                        false,

                    erro:
                        "Jogo obrigatório"

                });

            }


            // ==================================================
            // GERAR ANÁLISE IA
            // ==================================================

            const resultado =

                await gerarAnaliseIA(

                    jogo.trim(),

                    dados

                );


            res.json({

                sucesso:
                    true,

                resultado:
                    resultado

            });

        }

        catch (erro) {

            console.error(

                "❌ Erro análise direta IA:",

                erro.message

            );


            res.status(500).json({

                sucesso:
                    false,

                erro:
                    erro.message

            });

        }

    }

);


// ==================================================
// BUSCAR ANÁLISE POR ID
//
// GET /api/analises/:id
//
// IMPORTANTE:
//
// Esta rota não deve depender da lista
// somente de hoje.
//
// Porém, como atualmente o
// inteligenciaService.js expõe apenas
// listarAnalises(), usamos a lista disponível.
//
// Quando houver buscarAnalisePorId()
// no service, pode ser substituída por
// uma consulta direta.
// ==================================================

router.get(

    "/:id",

    async (
        req,
        res
    ) => {

        try {

            const id =
                Number(
                    req.params.id
                );


            // ==================================================
            // VALIDAR ID
            // ==================================================

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {

                return res.status(400).json({

                    sucesso:
                        false,

                    erro:
                        "ID da análise inválido"

                });

            }


            // ==================================================
            // BUSCAR LISTA
            // ==================================================

            const lista =
                await listarAnalises();


            const analise =

                Array.isArray(lista)

                    ? lista.find(

                        item =>
                            Number(
                                item.id
                            ) === id

                    )

                    : null;


            // ==================================================
            // NÃO ENCONTRADA
            // ==================================================

            if (!analise) {

                return res.status(404).json({

                    sucesso:
                        false,

                    erro:
                        "Análise não encontrada"

                });

            }


            // ==================================================
            // RETORNO
            // ==================================================

            res.json({

                sucesso:
                    true,

                dados:
                    analise

            });

        }

        catch (erro) {

            console.error(

                "❌ Erro buscando análise:",

                erro.message

            );


            res.status(500).json({

                sucesso:
                    false,

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
