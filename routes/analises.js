// ==================================================
// BETVISION AI
// routes/analises.js
//
// Rotas de Análises IA v5.4
//
// Correções:
// - GET /api/analises
// - GET /api/analises/:id
// - POST /api/analises
// - POST /api/analises/prever
// - Aceita jogo por objeto
// - Aceita jogo por texto
// - Resolve jogo no PostgreSQL
// - America/Sao_Paulo
// - Sem dados fictícios
// ==================================================

import express from "express";

import {
    query
} from "../database/database.js";

import {
    analisarMercado,
    listarAnalises,
    gerarAnaliseIA
} from "../services/inteligenciaService.js";

const router =
    express.Router();

// ==================================================
// NORMALIZAR TEXTO
// ==================================================

function normalizarTexto(valor) {

    if (
        valor === undefined ||
        valor === null
    ) {

        return "";

    }

    return String(
        valor
    )
        .trim();

}

// ==================================================
// BUSCAR JOGO POR ID
// ==================================================

async function buscarJogoPorId(id) {

    const numero =
        Number(id);

    if (
        !Number.isInteger(numero) ||
        numero <= 0
    ) {

        return null;

    }

    const resultado =
        await query(
            `
            SELECT
                id,
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                estadio,
                status,
                criado_em
            FROM jogos
            WHERE
                id = $1
                OR api_id = $1
            LIMIT 1
            `,
            [
                numero
            ]
        );

    return (
        resultado.rows[0] ||
        null
    );

}

// ==================================================
// BUSCAR JOGO PELO NOME
// ==================================================

async function buscarJogoPorNome(nome) {

    const texto =
        normalizarTexto(
            nome
        );

    if (!texto) {

        return null;

    }

    // --------------------------------------------------
    // Tenta separar:
    //
    // CASA x FORA
    // --------------------------------------------------

    const partes =
        texto
            .split(/\s+x\s+/i)
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    if (
        partes.length !== 2
    ) {

        return null;

    }

    const casa =
        partes[0];

    const fora =
        partes[1];

    const resultado =
        await query(
            `
            SELECT
                id,
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                estadio,
                status,
                criado_em
            FROM jogos
            WHERE

                (
                    LOWER(TRIM(time_casa))
                    =
                    LOWER(TRIM($1))
                    AND
                    LOWER(TRIM(time_fora))
                    =
                    LOWER(TRIM($2))
                )

                OR

                (
                    LOWER(TRIM(time_casa))
                    LIKE LOWER(TRIM($1))
                    || '%'
                    AND
                    LOWER(TRIM(time_fora))
                    LIKE LOWER(TRIM($2))
                    || '%'
                )

            ORDER BY
                data_jogo DESC

            LIMIT 1
            `,
            [
                casa,
                fora
            ]
        );

    return (
        resultado.rows[0] ||
        null
    );

}

// ==================================================
// RESOLVER JOGO
// ==================================================

async function resolverJogo(
    jogo
) {

    // --------------------------------------------------
    // JÁ É OBJETO
    // --------------------------------------------------

    if (
        jogo &&
        typeof jogo === "object" &&
        !Array.isArray(jogo)
    ) {

        // Se já tem api_id e nomes,
        // usamos diretamente.

        if (
            jogo.api_id &&
            (
                jogo.time_casa ||
                jogo.timeCasa ||
                jogo.casa
            ) &&
            (
                jogo.time_fora ||
                jogo.timeFora ||
                jogo.fora
            )
        ) {

            return jogo;

        }

        // Se possui ID,
        // buscamos no banco.

        if (
            jogo.id ||
            jogo.apiId
        ) {

            const encontrado =
                await buscarJogoPorId(
                    jogo.id ||
                    jogo.apiId
                );

            if (
                encontrado
            ) {

                return {
                    ...encontrado,
                    ...jogo
                };

            }

        }

    }

    // --------------------------------------------------
    // É STRING
    // --------------------------------------------------

    if (
        typeof jogo === "string"
    ) {

        return await buscarJogoPorNome(
            jogo
        );

    }

    return null;

}

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
                Array.isArray(
                    resultado
                )
                    ? resultado
                    : [];

            console.log(
                `🤖 Análises hoje: ${dados.length}`
            );

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

            res.status(500)
                .json({

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
// ==================================================

router.post(
    "/",
    async (req, res) => {

        try {

            const body =
                req.body || {};

            const jogoRecebido =
                body.jogo ??
                body.jogo_id ??
                body.jogoId;

            const dados =
                body.dados &&
                typeof body.dados === "object"
                    ? body.dados
                    : {};

            if (
                !jogoRecebido
            ) {

                return res.status(400)
                    .json({

                        sucesso:
                            false,

                        erro:
                            "Jogo obrigatório"

                    });

            }

            // --------------------------------------------------
            // RESOLVER JOGO REAL
            // --------------------------------------------------

            const jogo =
                await resolverJogo(
                    jogoRecebido
                );

            if (
                !jogo
            ) {

                return res.status(404)
                    .json({

                        sucesso:
                            false,

                        erro:
                            "Jogo não encontrado no banco de dados"

                    });

            }

            if (
                !jogo.api_id
            ) {

                return res.status(400)
                    .json({

                        sucesso:
                            false,

                        erro:
                            "O jogo não possui api_id"

                    });

            }

            // --------------------------------------------------
            // ANALISAR
            // --------------------------------------------------

            const resultado =
                await analisarMercado(
                    jogo,
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
// ==================================================

router.post(
    "/prever",
    async (req, res) => {

        try {

            const body =
                req.body || {};

            const jogoRecebido =
                body.jogo ??
                body.jogo_id ??
                body.jogoId;

            const dados =
                body.dados &&
                typeof body.dados === "object"
                    ? body.dados
                    : {};

            if (
                !jogoRecebido
            ) {

                return res.status(400)
                    .json({

                        sucesso:
                            false,

                        erro:
                            "Jogo obrigatório"

                    });

            }

            // --------------------------------------------------
            // RESOLVER JOGO REAL
            // --------------------------------------------------

            const jogo =
                await resolverJogo(
                    jogoRecebido
                );

            if (
                !jogo
            ) {

                return res.status(404)
                    .json({

                        sucesso:
                            false,

                        erro:
                            "Jogo não encontrado no banco de dados"

                    });

            }

            // --------------------------------------------------
            // GERAR IA
            // --------------------------------------------------

            const resultado =
                await gerarAnaliseIA(
                    jogo,
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

            res.status(500)
                .json({

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

                        sucesso:
                            false,

                        erro:
                            "ID da análise inválido"

                    });

            }

            // --------------------------------------------------
            // BUSCA DIRETA NO BANCO
            //
            // Melhor que procurar somente
            // na lista de jogos de hoje.
            // --------------------------------------------------

            const resultado =
                await query(
                    `
                    SELECT

                        a.id,
                        a.api_id,
                        a.jogo,

                        a.probabilidade_casa,

                        a.probabilidade_empate,

                        a.probabilidade_fora,

                        a.gols_esperados,

                        a.placar_previsto,

                        a.value_bet,

                        a.confianca,

                        a.algoritmo,

                        a.criado_em,

                        j.data_jogo,

                        j.campeonato,

                        j.time_casa,

                        j.time_fora,

                        j.status

                    FROM analises a

                    LEFT JOIN jogos j
                        ON
                        j.api_id =
                        a.api_id

                    WHERE
                        a.id = $1

                    LIMIT 1
                    `,
                    [
                        id
                    ]
                );

            const analise =
                resultado.rows[0] ||
                null;

            if (
                !analise
            ) {

                return res.status(404)
                    .json({

                        sucesso:
                            false,

                        erro:
                            "Análise não encontrada"

                    });

            }

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

            res.status(500)
                .json({

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
