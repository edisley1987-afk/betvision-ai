// ==================================================
// BETVISION AI
// routes/analises.js
//
// Rotas de Análises IA
//
// CORREÇÃO V6
//
// - Usa bancoService para listar análises
// - Hoje + amanhã
// - Mantém histórico no PostgreSQL
// - Vincula análise ao jogo por api_id
// - Compatível America/Sao_Paulo
// ==================================================

import express from "express";

import {
    analisarMercado,
    gerarAnaliseIA
} from "../services/inteligenciaService.js";

import {
    listarAnalisesDisponiveis,
    listarAnalisesHoje
} from "../services/bancoService.js";

const router = express.Router();


// ==================================================
// LISTAR ANÁLISES DISPONÍVEIS
//
// GET /api/analises
//
// SOMENTE:
// HOJE + AMANHÃ
//
// A data é obtida da tabela JOGOS.
// Não depende de data_jogo dentro de ANALISES.
// ==================================================

router.get(
    "/",
    async (req, res) => {

        try {

            console.log(
                "🤖 Buscando análises disponíveis..."
            );

            const dados =
                await listarAnalisesDisponiveis();

            const lista =
                Array.isArray(dados)
                    ? dados
                    : [];

            console.log(
                `🤖 Análises encontradas: ${lista.length}`
            );

            res.json({

                sucesso: true,

                total:
                    lista.length,

                dados:
                    lista

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
// LISTAR SOMENTE ANÁLISES DE HOJE
//
// GET /api/analises/hoje
//
// IMPORTANTE:
// Esta rota precisa ficar ANTES de /:id
// ==================================================

router.get(
    "/hoje",
    async (req, res) => {

        try {

            console.log(
                "📅 Buscando análises de hoje..."
            );

            const dados =
                await listarAnalisesHoje();

            const lista =
                Array.isArray(dados)
                    ? dados
                    : [];

            console.log(
                `📅 Análises de hoje: ${lista.length}`
            );

            res.json({

                sucesso: true,

                total:
                    lista.length,

                dados:
                    lista

            });

        }

        catch (erro) {

            console.error(
                "❌ Erro análises de hoje:",
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

            console.log(
                `🤖 Analisando jogo: ${jogo.trim()}`
            );

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

            console.log(
                `🔮 Prevendo análise: ${jogo.trim()}`
            );

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
// Busca entre as análises disponíveis
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
                await listarAnalisesDisponiveis();

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
