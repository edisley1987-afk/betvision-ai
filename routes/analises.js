// ==========================================================
// BETVISION AI
// routes/analises.js
//
// ROTAS DE ANÁLISES IA
//
// VERSÃO 8.0
//
// REGRAS:
//
// GET  /api/analises
//      SOMENTE JOGOS DE HOJE
//
// GET  /api/analises/hoje
//      SOMENTE JOGOS DE HOJE
//
// GET  /api/analises/:id
//      CONSULTA INDIVIDUAL
//
// POST /api/analises
//      ANÁLISE DE MERCADO
//
// POST /api/analises/prever
//      PREVISÃO DIRETA
//
// ==========================================================

import express from "express";

import {
    analisarMercado,
    gerarAnaliseIA,
    gerarAnaliseInteligente
} from "../services/inteligenciaService.js";

import {
    listarAnalisesHoje,
    buscarAnalisePorId,
    salvarAnalise
} from "../services/bancoService.js";

const router = express.Router();


// ==========================================================
// CONFIGURAÇÃO
// ==========================================================

const TIMEZONE = "America/Sao_Paulo";


// ==========================================================
// DATA DE HOJE NO BRASIL
// ==========================================================

function obterDataHojeBrasil() {

    try {

        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: TIMEZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(new Date());

    } catch (erro) {

        console.error(
            "❌ Erro obtendo data Brasil:",
            erro.message
        );

        return new Date()
            .toISOString()
            .slice(0, 10);
    }
}


// ==========================================================
// NORMALIZAR DATA
// ==========================================================

function normalizarDataBrasil(valor) {

    if (!valor) {
        return null;
    }

    try {

        if (
            valor instanceof Date &&
            !Number.isNaN(valor.getTime())
        ) {

            return new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone: TIMEZONE,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }
            ).format(valor);
        }


        const texto =
            String(valor).trim();

        if (!texto) {
            return null;
        }


        // YYYY-MM-DD
        const match =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (match) {

            return (
                `${match[1]}-${match[2]}-${match[3]}`
            );
        }


        const data =
            new Date(texto);

        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return null;
        }


        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: TIMEZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(data);

    } catch (erro) {

        return null;
    }
}


// ==========================================================
// OBTER DATA DA ANÁLISE
// ==========================================================

function obterDataAnalise(analise) {

    if (!analise) {
        return null;
    }

    const campos = [

        analise.data_jogo,
        analise.dataJogo,
        analise.jogo_data,

        analise.data,
        analise.inicio,
        analise.kickoff,
        analise.date,
        analise.datetime,

        analise.data_hora,
        analise.dataHora,

        analise.jogo?.data_jogo,
        analise.jogo?.dataJogo,
        analise.jogo?.jogo_data,

        analise.jogo?.data,
        analise.jogo?.inicio,
        analise.jogo?.kickoff,
        analise.jogo?.date

    ];

    for (const campo of campos) {

        const data =
            normalizarDataBrasil(campo);

        if (data) {
            return data;
        }
    }

    return null;
}


// ==========================================================
// FILTRAR SOMENTE HOJE
// ==========================================================

function filtrarSomenteHoje(lista) {

    if (!Array.isArray(lista)) {
        return [];
    }

    const hoje =
        obterDataHojeBrasil();

    return lista.filter(
        analise => {

            const data =
                obterDataAnalise(
                    analise
                );

            return data === hoje;
        }
    );
}


// ==========================================================
// OBTER API ID
// ==========================================================

function obterApiId(analise) {

    return (
        analise?.api_id ??
        analise?.apiId ??
        analise?.jogo_api_id ??
        analise?.jogo?.api_id ??
        analise?.jogo?.apiId ??
        null
    );
}


// ==========================================================
// OBTER NOME CASA
// ==========================================================

function obterCasa(analise) {

    return (
        analise?.time_casa ??
        analise?.casa ??
        analise?.home_team ??
        analise?.jogo?.time_casa ??
        analise?.jogo?.casa ??
        analise?.jogo?.home_team ??
        "Casa"
    );
}


// ==========================================================
// OBTER NOME FORA
// ==========================================================

function obterFora(analise) {

    return (
        analise?.time_fora ??
        analise?.fora ??
        analise?.away_team ??
        analise?.jogo?.time_fora ??
        analise?.jogo?.fora ??
        analise?.jogo?.away_team ??
        "Fora"
    );
}


// ==========================================================
// REMOVER DUPLICADAS
// ==========================================================

function removerDuplicadas(lista) {

    if (!Array.isArray(lista)) {
        return [];
    }

    const mapa = new Map();

    for (const analise of lista) {

        if (!analise) {
            continue;
        }

        const apiId =
            obterApiId(analise);

        const id =
            analise.id ??
            analise.analise_id ??
            null;

        let chave;

        if (apiId !== null) {

            chave =
                `api:${apiId}`;

        } else if (id !== null) {

            chave =
                `id:${id}`;

        } else {

            chave =
                `${obterCasa(analise)}|` +
                `${obterFora(analise)}|` +
                `${obterDataAnalise(analise)}`;
        }

        if (!mapa.has(chave)) {

            mapa.set(
                chave,
                analise
            );
        }
    }

    return Array.from(
        mapa.values()
    );
}


// ==========================================================
// DATA DE ORDENAÇÃO
// ==========================================================

function obterDataOrdenacao(analise) {

    const campos = [

        analise?.data_jogo,
        analise?.dataJogo,
        analise?.jogo_data,

        analise?.data,
        analise?.inicio,
        analise?.kickoff,
        analise?.date,
        analise?.datetime,

        analise?.jogo?.data_jogo,
        analise?.jogo?.data,
        analise?.jogo?.inicio,
        analise?.jogo?.kickoff

    ];

    for (const campo of campos) {

        if (!campo) {
            continue;
        }

        const timestamp =
            new Date(campo).getTime();

        if (
            !Number.isNaN(timestamp)
        ) {

            return timestamp;
        }
    }

    return Number.MAX_SAFE_INTEGER;
}


// ==========================================================
// ORDENAR
// ==========================================================

function ordenarAnalises(lista) {

    return [
        ...lista
    ].sort(
        (
            a,
            b
        ) =>
            obterDataOrdenacao(a) -
            obterDataOrdenacao(b)
    );
}


// ==========================================================
// PREPARAR LISTA
// ==========================================================

function prepararListaAnalises(dados) {

    const lista =
        Array.isArray(dados)
            ? dados
            : [];

    return ordenarAnalises(
        removerDuplicadas(
            filtrarSomenteHoje(
                lista
            )
        )
    );
}


// ==========================================================
// GET /api/analises
//
// SOMENTE HOJE
// ==========================================================

router.get(
    "/",
    async (
        req,
        res
    ) => {

        try {

            const hoje =
                obterDataHojeBrasil();

            console.log(
                "=========================================="
            );

            console.log(
                "🤖 BUSCANDO ANÁLISES IA"
            );

            console.log(
                `📅 Data Brasil: ${hoje}`
            );

            console.log(
                `🌎 Fuso: ${TIMEZONE}`
            );

            console.log(
                "🎯 Regra: SOMENTE HOJE"
            );


            const dados =
                await listarAnalisesHoje();


            const lista =
                prepararListaAnalises(
                    dados
                );


            console.log(
                `🤖 ${lista.length} análises válidas`
            );


            for (
                const analise of lista
            ) {

                console.log(
                    `⚽ ${obterCasa(analise)} ` +
                    `x ${obterFora(analise)} ` +
                    `| API: ${obterApiId(analise) ?? "N/A"}`
                );
            }


            console.log(
                "=========================================="
            );


            return res.json({

                sucesso: true,

                data: hoje,

                timezone: TIMEZONE,

                somenteHoje: true,

                total: lista.length,

                dados: lista
            });

        } catch (erro) {

            console.error(
                "❌ Erro listar análises:",
                erro
            );

            return res
                .status(500)
                .json({

                    sucesso: false,

                    data:
                        obterDataHojeBrasil(),

                    timezone:
                        TIMEZONE,

                    somenteHoje: true,

                    total: 0,

                    dados: [],

                    erro:
                        erro.message ||
                        "Erro ao listar análises"
                });
        }
    }
);


// ==========================================================
// GET /api/analises/hoje
// ==========================================================

router.get(
    "/hoje",
    async (
        req,
        res
    ) => {

        try {

            const hoje =
                obterDataHojeBrasil();

            const dados =
                await listarAnalisesHoje();

            const lista =
                prepararListaAnalises(
                    dados
                );

            return res.json({

                sucesso: true,

                data:
                    hoje,

                timezone:
                    TIMEZONE,

                somenteHoje:
                    true,

                total:
                    lista.length,

                dados:
                    lista

            });

        } catch (erro) {

            console.error(
                "❌ Erro análises hoje:",
                erro.message
            );

            return res
                .status(500)
                .json({

                    sucesso: false,

                    data:
                        obterDataHojeBrasil(),

                    timezone:
                        TIMEZONE,

                    somenteHoje:
                        true,

                    total:
                        0,

                    dados: [],

                    erro:
                        erro.message
                });
        }
    }
);


// ==========================================================
// POST /api/analises
// ==========================================================

router.post(
    "/",
    async (
        req,
        res
    ) => {

        try {

            const body =
                req.body || {};

            const jogo =
                body.jogo;

            const dados =
                body.dados || {};


            if (
                !jogo
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso:
                            false,

                        erro:
                            "Jogo obrigatório"
                    });
            }


            const resultado =
                await analisarMercado(
                    jogo,
                    dados
                );


            return res.json(
                resultado
            );

        } catch (erro) {

            console.error(
                "❌ Erro análise IA:",
                erro.message
            );

            return res
                .status(500)
                .json({

                    sucesso:
                        false,

                    erro:
                        erro.message ||
                        "Erro ao realizar análise IA"
                });
        }
    }
);


// ==========================================================
// POST /api/analises/prever
// ==========================================================

router.post(
    "/prever",
    async (
        req,
        res
    ) => {

        try {

            const body =
                req.body || {};

            const jogo =
                body.jogo;

            const dados =
                body.dados || {};


            if (!jogo) {

                return res
                    .status(400)
                    .json({

                        sucesso:
                            false,

                        erro:
                            "Jogo obrigatório"
                    });
            }


            const resultado =
                await gerarAnaliseIA(
                    jogo,
                    dados
                );


            return res.json({

                sucesso:
                    true,

                resultado:
                    resultado
            });

        } catch (erro) {

            console.error(
                "❌ Erro análise direta IA:",
                erro.message
            );

            return res
                .status(500)
                .json({

                    sucesso:
                        false,

                    erro:
                        erro.message ||
                        "Erro ao gerar análise IA"
                });
        }
    }
);


// ==========================================================
// GET /api/analises/:id
//
// IMPORTANTE:
// /hoje está acima desta rota.
// ==========================================================

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


            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso:
                            false,

                        erro:
                            "ID da análise inválido"
                    });
            }


            const analise =
                await buscarAnalisePorId(
                    id
                );


            if (!analise) {

                return res
                    .status(404)
                    .json({

                        sucesso:
                            false,

                        erro:
                            "Análise não encontrada"
                    });
            }


            return res.json({

                sucesso:
                    true,

                dados:
                    analise
            });

        } catch (erro) {

            console.error(
                "❌ Erro buscando análise:",
                erro.message
            );

            return res
                .status(500)
                .json({

                    sucesso:
                        false,

                    erro:
                        erro.message
                });
        }
    }
);


// ==========================================================
// EXPORT
// ==========================================================

export default router;
