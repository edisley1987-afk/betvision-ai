// ==================================================
// BETVISION AI
// routes/valuebets.js
//
// Motor Value Bets
// Versão 5.1
//
// PostgreSQL + NeonDB
//
// Tabela oficial:
// value_bets
//
// Rotas:
// GET    /api/valuebets
// GET    /api/valuebets/:id
// POST   /api/valuebets
// PUT    /api/valuebets/:id/desativar
// PUT    /api/valuebets/:id/ativar
//
// IMPORTANTE:
// Este arquivo está em:
// routes/valuebets.js
//
// O banco está em:
// database/database.js
//
// Portanto o import correto é:
// ../database/database.js
// ==================================================

import express from "express";

import {
    query
} from "../database/database.js";

const router =
    express.Router();

// ==================================================
// LISTAR VALUE BETS
//
// GET /api/valuebets
//
// Também funciona através do alias:
//
// GET /api/value-bets
//
// O alias é configurado no server.js.
// ==================================================

router.get(
    "/",
    async (req, res) => {

        try {

            console.log(
                "💎 Buscando Value Bets..."
            );

            const resultado =
                await query(
                    `
                    SELECT

                        vb.id,

                        vb.jogo_id,

                        vb.mercado,

                        vb.selecao,

                        vb.odd_mercado,

                        vb.probabilidade,

                        vb.valor_estimado,

                        vb.ativo,

                        vb.criado_em,

                        j.time_casa,

                        j.time_fora,

                        j.data_jogo,

                        j.campeonato,

                        j.estadio,

                        j.status

                    FROM value_bets vb

                    LEFT JOIN jogos j
                        ON j.id = vb.jogo_id

                    WHERE vb.ativo = true

                    ORDER BY
                        vb.valor_estimado DESC

                    LIMIT 100
                    `
                );

            console.log(
                `💎 ${resultado.rows.length} Value Bets encontradas`
            );

            return res.json({

                sucesso: true,

                total:
                    resultado.rows.length,

                valuebets:
                    resultado.rows

            });

        }

        catch (erro) {

            console.error(
                "❌ Erro Value Bets:",
                erro.message
            );

            return res.status(500)
                .json({

                    sucesso: false,

                    total: 0,

                    erro:
                        erro.message,

                    valuebets: []

                });

        }

    }
);

// ==================================================
// BUSCAR VALUE BET POR ID
//
// GET /api/valuebets/:id
//
// Também funciona:
//
// GET /api/value-bets/:id
//
// através do alias do server.js.
// ==================================================

router.get(
    "/:id",
    async (req, res) => {

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

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "ID da Value Bet inválido"

                    });

            }

            // ==================================================
            // BUSCAR
            // ==================================================

            const resultado =
                await query(
                    `
                    SELECT

                        vb.*,

                        j.time_casa,

                        j.time_fora,

                        j.data_jogo,

                        j.campeonato,

                        j.estadio,

                        j.status

                    FROM value_bets vb

                    LEFT JOIN jogos j
                        ON j.id = vb.jogo_id

                    WHERE vb.id = $1

                    LIMIT 1
                    `,
                    [
                        id
                    ]
                );

            // ==================================================
            // NÃO ENCONTRADA
            // ==================================================

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404)
                    .json({

                        sucesso: false,

                        erro:
                            "Value Bet não encontrada"

                    });

            }

            // ==================================================
            // RETORNO
            // ==================================================

            return res.json({

                sucesso: true,

                valuebet:
                    resultado.rows[0]

            });

        }

        catch (erro) {

            console.error(
                "❌ Erro buscar Value Bet:",
                erro.message
            );

            return res.status(500)
                .json({

                    sucesso: false,

                    erro:
                        erro.message

                });

        }

    }
);

// ==================================================
// CRIAR VALUE BET
//
// POST /api/valuebets
//
// Body:
//
// {
//     "jogo_id": 123,
//     "mercado": "Casa",
//     "selecao": "Palmeiras",
//     "odd_mercado": 2.10,
//     "probabilidade": 58,
//     "valor_estimado": 21.8
// }
// ==================================================

router.post(
    "/",
    async (req, res) => {

        try {

            const {

                jogo_id,

                mercado,

                selecao,

                odd_mercado,

                probabilidade,

                valor_estimado

            } = req.body || {};

            // ==================================================
            // VALIDAR JOGO
            // ==================================================

            if (
                jogo_id === undefined ||
                jogo_id === null ||
                jogo_id === ""
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "jogo_id é obrigatório"

                    });

            }

            // ==================================================
            // VALIDAR MERCADO
            // ==================================================

            if (
                !mercado ||
                typeof mercado !== "string"
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "mercado é obrigatório"

                    });

            }

            // ==================================================
            // VALIDAR SELEÇÃO
            // ==================================================

            if (
                !selecao ||
                typeof selecao !== "string"
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "selecao é obrigatória"

                    });

            }

            // ==================================================
            // VALIDAR ODD
            // ==================================================

            if (
                odd_mercado !== undefined &&
                odd_mercado !== null &&
                (
                    Number.isNaN(
                        Number(
                            odd_mercado
                        )
                    ) ||
                    Number(
                        odd_mercado
                    ) <= 0
                )
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "odd_mercado inválida"

                    });

            }

            // ==================================================
            // VALIDAR PROBABILIDADE
            // ==================================================

            if (
                probabilidade !== undefined &&
                probabilidade !== null &&
                (
                    Number.isNaN(
                        Number(
                            probabilidade
                        )
                    ) ||
                    Number(
                        probabilidade
                    ) < 0 ||
                    Number(
                        probabilidade
                    ) > 100
                )
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "probabilidade deve estar entre 0 e 100"

                    });

            }

            // ==================================================
            // INSERIR
            // ==================================================

            const resultado =
                await query(
                    `
                    INSERT INTO value_bets
                    (
                        jogo_id,
                        mercado,
                        selecao,
                        odd_mercado,
                        probabilidade,
                        valor_estimado,
                        ativo
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        true
                    )

                    RETURNING *
                    `,
                    [

                        jogo_id,

                        mercado.trim(),

                        selecao.trim(),

                        odd_mercado !== undefined &&
                        odd_mercado !== null
                            ? Number(
                                odd_mercado
                            )
                            : null,

                        probabilidade !== undefined &&
                        probabilidade !== null
                            ? Number(
                                probabilidade
                            )
                            : null,

                        valor_estimado !== undefined &&
                        valor_estimado !== null
                            ? Number(
                                valor_estimado
                            )
                            : null

                    ]
                );

            console.log(
                "💎 Value Bet criada:",
                resultado.rows[0]?.id
            );

            return res.status(201)
                .json({

                    sucesso: true,

                    valuebet:
                        resultado.rows[0]

                });

        }

        catch (erro) {

            console.error(
                "❌ Erro criar Value Bet:",
                erro.message
            );

            return res.status(500)
                .json({

                    sucesso: false,

                    erro:
                        erro.message

                });

        }

    }
);

// ==================================================
// DESATIVAR VALUE BET
//
// PUT /api/valuebets/:id/desativar
// ==================================================

router.put(
    "/:id/desativar",
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
                            "ID da Value Bet inválido"

                    });

            }

            const resultado =
                await query(
                    `
                    UPDATE value_bets

                    SET ativo = false

                    WHERE id = $1

                    RETURNING *
                    `,
                    [
                        id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404)
                    .json({

                        sucesso: false,

                        erro:
                            "Value Bet não encontrada"

                    });

            }

            console.log(
                "💎 Value Bet desativada:",
                id
            );

            return res.json({

                sucesso: true,

                valuebet:
                    resultado.rows[0]

            });

        }

        catch (erro) {

            console.error(
                "❌ Erro desativar Value Bet:",
                erro.message
            );

            return res.status(500)
                .json({

                    sucesso: false,

                    erro:
                        erro.message

                });

        }

    }
);

// ==================================================
// ATIVAR VALUE BET
//
// PUT /api/valuebets/:id/ativar
// ==================================================

router.put(
    "/:id/ativar",
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
                            "ID da Value Bet inválido"

                    });

            }

            const resultado =
                await query(
                    `
                    UPDATE value_bets

                    SET ativo = true

                    WHERE id = $1

                    RETURNING *
                    `,
                    [
                        id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404)
                    .json({

                        sucesso: false,

                        erro:
                            "Value Bet não encontrada"

                    });

            }

            console.log(
                "💎 Value Bet ativada:",
                id
            );

            return res.json({

                sucesso: true,

                valuebet:
                    resultado.rows[0]

            });

        }

        catch (erro) {

            console.error(
                "❌ Erro ativar Value Bet:",
                erro.message
            );

            return res.status(500)
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
