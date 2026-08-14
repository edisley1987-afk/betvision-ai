// ==================================================
// BETVISION AI
// routes/analises.js
//
// ROTAS DE ANÁLISES IA
//
// VERSÃO 8.0 - CORREÇÃO DEFINITIVA
//
// REGRAS:
//
// - GET /api/analises
//      SOMENTE JOGOS DE HOJE
//
// - GET /api/analises/hoje
//      SOMENTE JOGOS DE HOJE
//
// - GET /api/analises/:id
//      CONSULTA INDIVIDUAL
//      PODE CONSULTAR HISTÓRICO
//
// - POST /api/analises
//      ANÁLISE DE MERCADO
//
// - POST /api/analises/prever
//      PREVISÃO IA
//
// IMPORTANTE:
//
// A DATA DA ANÁLISE NÃO É USADA PARA DEFINIR
// SE O JOGO É DE HOJE.
//
// A DATA OFICIAL VEM DA TABELA:
//
//      jogos.data_jogo
//
// através do:
//
//      api_id
//
// TIMEZONE:
//      America/Sao_Paulo
//
// ==================================================

import express from "express";

import {
    analisarMercado,
    gerarAnaliseIA
} from "../services/inteligenciaService.js";

import {
    listarAnalisesHoje,
    buscarAnalisePorId
} from "../services/bancoService.js";

const router = express.Router();


// ==================================================
// CONFIGURAÇÃO
// ==================================================

const TIMEZONE = "America/Sao_Paulo";


// ==================================================
// DATA DE HOJE NO BRASIL
// ==================================================

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

    }
    catch (erro) {

        console.error(
            "❌ Erro obtendo data Brasil:",
            erro.message
        );

        return new Date()
            .toISOString()
            .slice(0, 10);

    }

}


// ==================================================
// NORMALIZAR DATA PARA BRASIL
//
// Retorna:
// YYYY-MM-DD
//
// IMPORTANTE:
//
// Se receber YYYY-MM-DD diretamente,
// não passa pelo new Date(),
// evitando deslocamento de dia.
// ==================================================

function normalizarDataBrasil(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return null;

    }

    try {

        // ------------------------------------------
        // Date
        // ------------------------------------------

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


        // ------------------------------------------
        // YYYY-MM-DD
        // YYYY-MM-DDTHH:mm...
        // ------------------------------------------

        const match =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );


        if (match) {

            return (
                `${match[1]}-` +
                `${match[2]}-` +
                `${match[3]}`
            );

        }


        // ------------------------------------------
        // Outros formatos
        // ------------------------------------------

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

    }
    catch (erro) {

        console.error(
            "❌ Erro normalizando data:",
            erro.message
        );

        return null;

    }

}


// ==================================================
// OBTER DATA OFICIAL DA ANÁLISE
//
// PRIORIDADE:
//
// 1. data_jogo
// 2. jogo.data_jogo
// 3. demais campos
//
// IMPORTANTE:
//
// O bancoService já retorna:
//
//      j.data_jogo
//
// portanto esse campo será o principal.
// ==================================================

function obterDataAnalise(analise) {

    if (!analise) {

        return null;

    }


    const campos = [

        analise.data_jogo,

        analise.jogo_data,

        analise.dataJogo,

        analise.jogo?.data_jogo,

        analise.jogo?.jogo_data,

        analise.jogo?.dataJogo,

        analise.data,

        analise.inicio,

        analise.kickoff,

        analise.date,

        analise.datetime,

        analise.data_hora,

        analise.dataHora

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


// ==================================================
// VERIFICAR SE É DE HOJE
// ==================================================

function analiseEhDeHoje(analise) {

    const hoje =
        obterDataHojeBrasil();


    const data =
        obterDataAnalise(
            analise
        );


    return (
        data !== null &&
        data === hoje
    );

}


// ==================================================
// FILTRAR SOMENTE HOJE
//
// SEGURANÇA FINAL DO BACKEND.
//
// Mesmo que alguma consulta futura retorne
// registros errados, eles são bloqueados aqui.
// ==================================================

function filtrarSomenteHoje(lista) {

    if (!Array.isArray(lista)) {

        return [];

    }


    return lista.filter(
        analise =>
            analiseEhDeHoje(
                analise
            )
    );

}


// ==================================================
// OBTER DATA DE ORDENAÇÃO
// ==================================================

function obterDataOrdenacao(analise) {

    const campos = [

        analise?.data_jogo,

        analise?.jogo_data,

        analise?.dataJogo,

        analise?.jogo?.data_jogo,

        analise?.data,

        analise?.inicio,

        analise?.kickoff,

        analise?.date,

        analise?.datetime

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


// ==================================================
// ORDENAR
// ==================================================

function ordenarAnalises(lista) {

    if (!Array.isArray(lista)) {

        return [];

    }


    return [...lista].sort(
        (a, b) =>
            obterDataOrdenacao(a) -
            obterDataOrdenacao(b)
    );

}


// ==================================================
// OBTER API ID
// ==================================================

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


// ==================================================
// REMOVER DUPLICADAS
//
// Prioridade:
//
// api_id
// depois id
// depois combinação de times + data
// ==================================================

function removerDuplicadas(lista) {

    if (!Array.isArray(lista)) {

        return [];

    }


    const mapa =
        new Map();


    for (const analise of lista) {

        if (!analise) {

            continue;

        }


        const apiId =
            obterApiId(
                analise
            );


        const id =
            analise.id ??
            analise.analise_id ??
            null;


        const data =
            obterDataAnalise(
                analise
            ) || "";


        const casa =
            analise.time_casa ??
            analise.casa ??
            analise.home_team ??
            "";


        const fora =
            analise.time_fora ??
            analise.fora ??
            analise.away_team ??
            "";


        let chave;


        if (
            apiId !== null &&
            apiId !== undefined &&
            apiId !== ""
        ) {

            chave =
                `api:${apiId}`;

        }
        else if (
            id !== null &&
            id !== undefined &&
            id !== ""
        ) {

            chave =
                `id:${id}`;

        }
        else {

            chave =
                `${String(casa).trim().toLowerCase()}|` +
                `${String(fora).trim().toLowerCase()}|` +
                `${data}`;

        }


        if (
            !mapa.has(chave)
        ) {

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


// ==================================================
// PREPARAR LISTA
//
// BANCO
// ↓
// SOMENTE HOJE
// ↓
// DUPLICADAS
// ↓
// ORDENAÇÃO
// ==================================================

function prepararListaAnalises(dados) {

    const lista =
        Array.isArray(dados)
            ? dados
            : [];


    const somenteHoje =
        filtrarSomenteHoje(
            lista
        );


    const semDuplicadas =
        removerDuplicadas(
            somenteHoje
        );


    return ordenarAnalises(
        semDuplicadas
    );

}


// ==================================================
// LOG RESUMIDO
// ==================================================

function registrarLogAnalises(lista) {

    for (const analise of lista) {

        const apiId =
            obterApiId(
                analise
            ) ?? "N/A";


        const casa =
            analise.time_casa ??
            analise.casa ??
            analise.home_team ??
            "Casa";


        const fora =
            analise.time_fora ??
            analise.fora ??
            analise.away_team ??
            "Fora";


        const data =
            obterDataAnalise(
                analise
            ) ?? "SEM DATA";


        console.log(
            `⚽ ${casa} x ${fora} | ` +
            `Data: ${data} | ` +
            `API: ${apiId}`
        );

    }

}


// ==================================================
// GET /api/analises
//
// SOMENTE HOJE
// ==================================================

router.get(
    "/",
    async (req, res) => {

        try {

            const hoje =
                obterDataHojeBrasil();


            console.log(
                "=========================================="
            );

            console.log(
                "🤖 BETVISION AI - ANÁLISES"
            );

            console.log(
                `📅 Hoje Brasil: ${hoje}`
            );

            console.log(
                `🌎 Timezone: ${TIMEZONE}`
            );

            console.log(
                "🎯 Filtro: SOMENTE HOJE"
            );


            const dados =
                await listarAnalisesHoje();


            const lista =
                prepararListaAnalises(
                    dados
                );


            console.log(
                `🤖 Análises válidas: ${lista.length}`
            );


            registrarLogAnalises(
                lista
            );


            console.log(
                "=========================================="
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

        }
        catch (erro) {

            console.error(
                "❌ Erro listar análises:",
                erro
            );


            return res.status(500)
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

                    dados:
                        [],

                    erro:
                        erro.message ||
                        "Erro ao listar análises"

                });

        }

    }
);


// ==================================================
// GET /api/analises/hoje
//
// SOMENTE HOJE
// ==================================================

router.get(
    "/hoje",
    async (req, res) => {

        try {

            const hoje =
                obterDataHojeBrasil();


            console.log(
                `📅 Buscando análises de hoje: ${hoje}`
            );


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

        }
        catch (erro) {

            console.error(
                "❌ Erro análises de hoje:",
                erro
            );


            return res.status(500)
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

                    dados:
                        [],

                    erro:
                        erro.message ||
                        "Erro ao buscar análises de hoje"

                });

        }

    }
);


// ==================================================
// POST /api/analises
//
// ANALISAR MERCADO
// ==================================================

router.post(
    "/",
    async (req, res) => {

        try {

            const body =
                req.body || {};


            const jogo =
                body.jogo;


            const dados =
                body.dados || {};


            if (
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


            const nomeJogo =
                jogo.trim();


            console.log(
                `🤖 Analisando mercado: ${nomeJogo}`
            );


            const resultado =
                await analisarMercado(
                    nomeJogo,
                    dados
                );


            return res.json(
                resultado
            );

        }
        catch (erro) {

            console.error(
                "❌ Erro análise IA:",
                erro
            );


            return res.status(500)
                .json({

                    sucesso: false,

                    erro:
                        erro.message ||
                        "Erro ao realizar análise IA"

                });

        }

    }
);


// ==================================================
// POST /api/analises/prever
//
// PREVISÃO DIRETA
// ==================================================

router.post(
    "/prever",
    async (req, res) => {

        try {

            const body =
                req.body || {};


            const jogo =
                body.jogo;


            const dados =
                body.dados || {};


            if (
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


            const nomeJogo =
                jogo.trim();


            console.log(
                `🔮 Prevendo análise: ${nomeJogo}`
            );


            const resultado =
                await gerarAnaliseIA(
                    nomeJogo,
                    dados
                );


            return res.json({

                sucesso: true,

                resultado:
                    resultado

            });

        }
        catch (erro) {

            console.error(
                "❌ Erro análise direta IA:",
                erro
            );


            return res.status(500)
                .json({

                    sucesso: false,

                    erro:
                        erro.message ||
                        "Erro ao gerar análise IA"

                });

        }

    }
);


// ==================================================
// GET /api/analises/:id
//
// CONSULTA INDIVIDUAL
//
// Diferente da listagem:
// pode consultar análise histórica.
//
// IMPORTANTE:
//
// Esta rota está depois de /hoje e /prever.
// ==================================================

router.get(
    "/:id",
    async (req, res) => {

        try {

            const idTexto =
                String(
                    req.params.id || ""
                ).trim();


            if (
                !/^\d+$/.test(idTexto)
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "ID da análise inválido"

                    });

            }


            const id =
                Number(idTexto);


            if (
                !Number.isSafeInteger(id) ||
                id <= 0
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "ID da análise inválido"

                    });

            }


            const analise =
                await buscarAnalisePorId(
                    id
                );


            if (!analise) {

                return res.status(404)
                    .json({

                        sucesso: false,

                        erro:
                            "Análise não encontrada"

                    });

            }


            return res.json({

                sucesso: true,

                dados:
                    analise

            });

        }
        catch (erro) {

            console.error(
                "❌ Erro buscando análise:",
                erro
            );


            return res.status(500)
                .json({

                    sucesso: false,

                    erro:
                        erro.message ||
                        "Erro ao buscar análise"

                });

        }

    }
);


// ==================================================
// EXPORT
// ==================================================

export default router;
