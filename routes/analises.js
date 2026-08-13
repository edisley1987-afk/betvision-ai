// ==================================================
// BETVISION AI
// routes/analises.js
//
// Rotas de Análises IA v5.4
//
// PostgreSQL + Inteligência Estatística
//
// GET  /api/analises
// GET  /api/analises/:id
// POST /api/analises
// POST /api/analises/prever
//
// Compatível com America/Sao_Paulo
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
// ==================================================

router.get(
    "/",
    async (req, res) => {

        try {

            const resultado =
                await listarAnalises();

            const dados =
                Array.isArray(resultado)
                    ? resultado
                    : [];

            console.log(
                `🤖 Análises recebidas: ${dados.length}`
            );

            res.json({

                sucesso: true,

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

            res.status(500)
                .json({

                    sucesso: false,

                    total: 0,

                    dados: [],

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
// ==================================================

router.post(
    "/",
    async (req, res) => {

        try {

            const {
                jogo,
                dados = {}
            } = req.body || {};

            if (
                !jogo ||
                typeof jogo !== "string" ||
                !jogo.trim()
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "Jogo obrigatório"

                    });

            }

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

            res.status(500)
                .json({

                    sucesso: false,

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
// ==================================================

router.post(
    "/prever",
    async (req, res) => {

        try {

            const {
                jogo,
                dados = {}
            } = req.body || {};

            if (
                !jogo ||
                typeof jogo !== "string" ||
                !jogo.trim()
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "Jogo obrigatório"

                    });

            }

            const resultado =
                await gerarAnaliseIA(
                    jogo.trim(),
                    dados
                );

            res.json({

                sucesso: true,

                resultado:
                    resultado

            });

        }

        catch (erro) {

            console.error(
                "❌ Erro análise direta IA:",
                erro.message
            );

            res.status(500)
                .json({

                    sucesso: false,

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
// Observação:
// atualmente depende de listarAnalises().
// ==================================================

router.get(
    "/:id",
    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "ID da análise inválido"

                    });

            }

            const lista =
                await listarAnalises();

            const analise =
                Array.isArray(lista)
                    ? lista.find(
                        item =>
                            Number(item.id) === id
                    )
                    : null;

            if (!analise) {

                return res.status(404)
                    .json({

                        sucesso: false,

                        erro:
                            "Análise não encontrada"

                    });

            }

            res.json({

                sucesso: true,

                dados:
                    analise

            });

        }

        catch (erro) {

            console.error(
                "❌ Erro buscando análise:",
                erro.message
            );

            res.status(500)
                .json({

                    sucesso: false,

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
