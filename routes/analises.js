// ==========================================================
// BETVISION AI
// routes/analises.js
//
// VERSÃO 11.0 - CORRIGIDA E COMPLETA
//
// CORREÇÕES NESTA VERSÃO:
// - jogo_id, api_id, time_casa, time_fora, data_jogo,
//   confianca e algoritmo agora são enviados para
//   salvarAnalise() (schema real já suporta essas colunas)
// - Fallback: análises sem data_jogo reconhecível não são
//   mais descartadas do dashboard (schema legado / registros
//   antigos sem jogo_id)
// - Mantém 100% de compatibilidade com o schema atual
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
// DATA HOJE BRASIL
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


        const texto = String(valor).trim();


        if (!texto) {
            return null;
        }


        // ==================================================
        // YYYY-MM-DD
        // ==================================================

        const matchISO =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (matchISO) {

            return (
                `${matchISO[1]}-${matchISO[2]}-${matchISO[3]}`
            );
        }


        // ==================================================
        // DD/MM/YYYY
        // ==================================================

        const matchBR =
            texto.match(
                /^(\d{2})\/(\d{2})\/(\d{4})/
            );

        if (matchBR) {

            return (
                `${matchBR[3]}-${matchBR[2]}-${matchBR[1]}`
            );
        }


        // ==================================================
        // OUTROS FORMATOS
        // ==================================================

        const data = new Date(texto);


        if (
            Number.isNaN(data.getTime())
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

        console.error(
            "⚠️ Erro normalizando data:",
            erro.message
        );

        return null;
    }
}


// ==========================================================
// EXTRAIR DATA DO JOGO
// ==========================================================

function extrairDataJogo(jogo) {

    if (!jogo) {
        return null;
    }

    const campos = [

        jogo.data_jogo,
        jogo.dataJogo,
        jogo.jogo_data,

        jogo.data,
        jogo.inicio,
        jogo.kickoff,

        jogo.date,
        jogo.datetime,

        jogo.fixture?.date,
        jogo.fixture?.data,
        jogo.fixture?.datetime,

        jogo.match?.date,
        jogo.match?.datetime,

        jogo.jogo?.data_jogo,
        jogo.jogo?.dataJogo,
        jogo.jogo?.jogo_data,

        jogo.jogo?.data,
        jogo.jogo?.inicio,
        jogo.jogo?.kickoff,

        jogo.jogo?.date,
        jogo.jogo?.datetime,

        jogo.jogo?.fixture?.date
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
// DATA DA ANÁLISE
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

        analise.criado_em,
        analise.created_at,
        analise.createdAt,

        analise.fixture?.date,

        analise.jogo?.data_jogo,
        analise.jogo?.dataJogo,
        analise.jogo?.jogo_data,

        analise.jogo?.data,
        analise.jogo?.inicio,
        analise.jogo?.kickoff,

        analise.jogo?.date,
        analise.jogo?.datetime,

        analise.jogo?.fixture?.date
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
// API ID
// ==========================================================

function obterApiId(analise) {

    return (
        analise?.api_id ??
        analise?.apiId ??
        analise?.jogo_api_id ??
        analise?.jogo_apiId ??
        analise?.jogo?.api_id ??
        analise?.jogo?.apiId ??
        null
    );
}


// ==========================================================
// JOGO ID
// ==========================================================

function obterJogoId(analise) {

    return (
        analise?.jogo_id ??
        analise?.jogoId ??
        analise?.jogo?.jogo_id ??
        analise?.jogo?.jogoId ??
        null
    );
}


// ==========================================================
// CASA
// ==========================================================

function obterCasa(analise) {

    return (
        analise?.time_casa ??
        analise?.casa ??
        analise?.home_team ??
        analise?.homeTeam ??
        analise?.jogo?.time_casa ??
        analise?.jogo?.casa ??
        analise?.jogo?.home_team ??
        analise?.jogo?.homeTeam ??
        "Casa"
    );
}


// ==========================================================
// FORA
// ==========================================================

function obterFora(analise) {

    return (
        analise?.time_fora ??
        analise?.fora ??
        analise?.away_team ??
        analise?.awayTeam ??
        analise?.jogo?.time_fora ??
        analise?.jogo?.fora ??
        analise?.jogo?.away_team ??
        analise?.jogo?.awayTeam ??
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

        const jogoId =
            obterJogoId(analise);

        const id =
            analise.id ??
            analise.analise_id ??
            null;


        let chave;


        if (
            apiId !== null &&
            apiId !== undefined
        ) {

            chave =
                `api:${apiId}`;

        } else if (
            jogoId !== null &&
            jogoId !== undefined
        ) {

            chave =
                `jogo:${jogoId}`;

        } else if (id) {

            chave =
                `id:${id}`;

        } else {

            chave =
                `temp:${Math.random()}`;
        }


        if (!mapa.has(chave)) {
            mapa.set(chave, analise);
        }
    }


    return Array.from(mapa.values());
}


// ==========================================================
// ENDPOINT: LISTAR HOJE
// ==========================================================

router.get("/hoje", async (req, res) => {

    try {

        const dataHoje =
            obterDataHojeBrasil();

        const analisesBanco =
            await listarAnalisesHoje(dataHoje) ?? [];


        const analisesProcessadas =
            analisesBanco.map(analise => {

                return {

                    ...analise,

                    jogo_id:
                        obterJogoId(analise),

                    api_id:
                        obterApiId(analise),

                    time_casa:
                        obterCasa(analise),

                    time_fora:
                        obterFora(analise),

                    data_jogo:
                        obterDataAnalise(analise) ??
                        dataHoje
                };
            });


        const analisesFiltradas =
            removerDuplicadas(
                analisesProcessadas
            );


        return res.json({

            sucesso: true,

            data: dataHoje,

            total:
                analisesFiltradas.length,

            analises:
                analisesFiltradas
        });

    } catch (erro) {

        console.error(
            "❌ Erro na rota /hoje:",
            erro.message
        );


        return res.status(500).json({

            sucesso: false,

            erro:
                "Erro interno ao listar análises de hoje."
        });
    }
});


// ==========================================================
// ENDPOINT: BUSCAR POR ID
// ==========================================================

router.get("/:id", async (req, res) => {

    try {

        const { id } =
            req.params;


        const analise =
            await buscarAnalisePorId(id);


        if (!analise) {

            return res.status(404).json({

                sucesso: false,

                erro:
                    "Análise não encontrada."
            });
        }


        return res.json({

            sucesso: true,

            analise: {

                ...analise,

                jogo_id:
                    obterJogoId(analise),

                api_id:
                    obterApiId(analise),

                time_casa:
                    obterCasa(analise),

                time_fora:
                    obterFora(analise),

                data_jogo:
                    obterDataAnalise(analise)
            }
        });

    } catch (erro) {

        console.error(
            "❌ Erro na rota /:id:",
            erro.message
        );


        return res.status(500).json({

            sucesso: false,

            erro:
                "Erro interno ao buscar análise por ID."
        });
    }
});


// ==========================================================
// ENDPOINT: GERAR NOVA ANÁLISE (IA)
// ==========================================================

router.post("/gerar", async (req, res) => {

    try {

        const { jogo } =
            req.body;


        if (!jogo) {

            return res.status(400).json({

                sucesso: false,

                erro:
                    "Dados do jogo são obrigatórios."
            });
        }


        // ==================================================
        // ANALISAR MERCADO
        // ==================================================

        const mercado =
            await analisarMercado(jogo);


        // ==================================================
        // GERAR ANÁLISE IA
        // ==================================================

        const resultadoIA =
            await gerarAnaliseIA(
                jogo,
                mercado
            );


        // ==================================================
        // GERAR ANÁLISE INTELIGENTE
        // ==================================================

        const analiseInteligente =
            await gerarAnaliseInteligente(
                jogo,
                resultadoIA
            );


        // ==================================================
        // DADOS DO JOGO
        // ==================================================

        const dataJogo =
            extrairDataJogo(jogo) ??
            obterDataHojeBrasil();


        const jogoId =
            obterJogoId(jogo);


        const apiId =
            obterApiId(jogo);


        const casa =
            obterCasa(jogo);


        const fora =
            obterFora(jogo);


        // ==================================================
        // MONTAR NOVA ANÁLISE
        // ==================================================

        const novaAnalise = {

            ...analiseInteligente,

            jogo_id:
                jogoId,

            api_id:
                apiId,

            time_casa:
                casa,

            time_fora:
                fora,

            data_jogo:
                dataJogo,

            confianca:
                analiseInteligente.confianca ??
                analiseInteligente.assertividade ??
                50,

            algoritmo:
                analiseInteligente.algoritmo ??
                "BetVision-AI-v11"
        };


        // ==================================================
        // SALVAR NO BANCO
        // ==================================================

        const analiseSalva =
            await salvarAnalise(
                novaAnalise
            );


        // ==================================================
        // RESPOSTA
        // ==================================================

        return res.status(201).json({

            sucesso: true,

            analise:
                analiseSalva ??
                novaAnalise
        });

    } catch (erro) {

        console.error(
            "❌ Erro na rota /gerar:",
            erro.message
        );


        return res.status(500).json({

            sucesso: false,

            erro:
                "Erro interno ao gerar análise de mercado."
        });
    }
});


// ==========================================================
// EXPORTAR ROUTER
// ==========================================================

export default router;
