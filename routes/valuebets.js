```javascript
// ==================================================
// BETVISION AI
// routes/valuebets.js
// Motor Value Bets
// Versão 5.0
// Compatível PostgreSQL NeonDB
// Tabela oficial: value_bets
// ==================================================

import express from "express";

import {
    query
} from "../database/database.js";

const router = express.Router();


// ==================================================
// LISTAR VALUE BETS
// GET /api/valuebets
// ==================================================

router.get(
    "/",
    async (req, res) => {

        try {

            console.log(
                "💎 Buscando Value Bets..."
            );

            const resultado = await query(
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

            res.json({

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

            res.status(500)
                .json({

                    sucesso: false,

                    erro:
                        erro.message,

                    valuebets: []

                });

        }

    }
);


// ==================================================
// BUSCAR VALUE BET POR ID
// GET /api/valuebets/:id
// ==================================================

router.get(
    "/:id",
    async (req, res) => {

        try {

            const resultado = await query(
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
                    req.params.id
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

            res.json({

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
// CRIAR VALUE BET
// POST /api/valuebets
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

            } = req.body;


            if (!jogo_id) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "jogo_id é obrigatório"

                    });

            }


            if (!mercado) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "mercado é obrigatório"

                    });

            }


            if (!selecao) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "selecao é obrigatória"

                    });

            }


            const resultado = await query(
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

                    mercado,

                    selecao,

                    odd_mercado,

                    probabilidade,

                    valor_estimado

                ]
            );


            res.status(201)
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
// DESATIVAR VALUE BET
// PUT /api/valuebets/:id/desativar
// ==================================================

router.put(
    "/:id/desativar",
    async (req, res) => {

        try {

            const resultado = await query(
                `
                UPDATE value_bets

                SET ativo = false

                WHERE id = $1

                RETURNING *
                `,
                [
                    req.params.id
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


            res.json({

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
// ATIVAR VALUE BET
// PUT /api/valuebets/:id/ativar
// ==================================================

router.put(
    "/:id/ativar",
    async (req, res) => {

        try {

            const resultado = await query(
                `
                UPDATE value_bets

                SET ativo = true

                WHERE id = $1

                RETURNING *
                `,
                [
                    req.params.id
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


            res.json({

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
```
