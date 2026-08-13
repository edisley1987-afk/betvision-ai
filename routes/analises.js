// ==================================================
// BETVISION AI
// routes/analises.js
//
// Rotas de Análises IA
//
// CORREÇÃO V7
//
// PRINCIPAIS CORREÇÕES:
//
// - GET /api/analises
//      SOMENTE JOGOS DE HOJE
//
// - GET /api/analises/hoje
//      SOMENTE JOGOS DE HOJE
//
// - NÃO exibe jogos de ontem
// - NÃO exibe jogos de amanhã
// - Mantém histórico no PostgreSQL
// - Vincula análise ao jogo por api_id
// - Compatível com America/Sao_Paulo
// - Evita conflito entre /hoje e /:id
// - Validação de parâmetros
// - Respostas JSON padronizadas
// - Mantém POST /api/analises
// - Mantém POST /api/analises/prever
// ==================================================

import express from "express";

import {
    analisarMercado,
    gerarAnaliseIA
} from "../services/inteligenciaService.js";

import {
    listarAnalisesHoje
} from "../services/bancoService.js";

const router = express.Router();


// ==================================================
// CONFIGURAÇÃO DE TIMEZONE
// ==================================================

const TIMEZONE = "America/Sao_Paulo";


// ==================================================
// OBTER DATA ATUAL NO BRASIL
//
// Retorna:
// YYYY-MM-DD
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
        ).format(
            new Date()
        );

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
// NORMALIZAR DATA
//
// Aceita:
// YYYY-MM-DD
// YYYY-MM-DDTHH:mm:ss
// ISO completo
// Date
//
// Retorna:
// YYYY-MM-DD
// ==================================================

function normalizarDataBrasil(valor) {

    if (!valor) {

        return null;

    }

    try {

        // ------------------------------------------
        // Se for Date
        // ------------------------------------------

        if (
            valor instanceof Date &&
            !Number.isNaN(
                valor.getTime()
            )
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


        // ------------------------------------------
        // Converter para string
        // ------------------------------------------

        const texto =
            String(valor)
                .trim();


        if (!texto) {

            return null;

        }


        // ------------------------------------------
        // YYYY-MM-DD
        //
        // NÃO converter através de Date,
        // pois isso pode causar deslocamento
        // de dia dependendo do timezone.
        // ------------------------------------------

        const matchData =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (matchData) {

            return (
                `${matchData[1]}-` +
                `${matchData[2]}-` +
                `${matchData[3]}`
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
// VERIFICAR SE A ANÁLISE É DE HOJE
//
// A função procura várias possibilidades de campo
// porque diferentes versões do banco podem retornar:
//
// data_jogo
// data
// dataJogo
// inicio
// kickoff
// date
// jogo_data
//
// Também verifica campos internos do objeto jogo.
// ==================================================

function analiseEhDeHoje(analise) {

    if (!analise) {

        return false;

    }

    const hoje =
        obterDataHojeBrasil();


    // ------------------------------------------
    // Possíveis campos na análise
    // ------------------------------------------

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

        analise.horario,

        analise.jogo?.data_jogo,

        analise.jogo?.dataJogo,

        analise.jogo?.data,

        analise.jogo?.inicio,

        analise.jogo?.kickoff,

        analise.jogo?.date

    ];


    for (const campo of campos) {

        const data =
            normalizarDataBrasil(
                campo
            );

        if (
            data === hoje
        ) {

            return true;

        }

    }


    return false;

}


// ==================================================
// FILTRAR SOMENTE HOJE
//
// Segurança adicional.
//
// Mesmo que o banco retorne hoje + amanhã,
// esta camada impede que amanhã ou ontem
// cheguem ao frontend.
// ==================================================

function filtrarSomenteHoje(lista) {

    if (!Array.isArray(lista)) {

        return [];

    }

    const hoje =
        obterDataHojeBrasil();


    const resultado =
        lista.filter(
            analise => {

                if (!analise) {

                    return false;

                }


                // ----------------------------------
                // Primeiro tenta verificar data
                // diretamente.
                // ----------------------------------

                if (
                    analiseEhDeHoje(
                        analise
                    )
                ) {

                    return true;

                }


                // ----------------------------------
                // Caso o serviço do banco já tenha
                // retornado apenas hoje, algumas
                // estruturas podem possuir somente
                // o campo data como string.
                // ----------------------------------

                const possiveisCampos = [

                    "data_jogo",
                    "dataJogo",
                    "jogo_data",
                    "data",
                    "inicio",
                    "kickoff",
                    "date",
                    "datetime",
                    "data_hora",
                    "dataHora"

                ];


                for (
                    const campo
                    of possiveisCampos
                ) {

                    if (
                        campo in analise
                    ) {

                        const data =
                            normalizarDataBrasil(
                                analise[campo]
                            );

                        if (
                            data === hoje
                        ) {

                            return true;

                        }

                    }

                }


                // ----------------------------------
                // Se não existir nenhuma data,
                // NÃO liberar a análise.
                //
                // Isso evita que registros antigos
                // apareçam indevidamente.
                // ----------------------------------

                return false;

            }
        );


    return resultado;

}


// ==================================================
// ORDENAR ANÁLISES
//
// Ordena por horário do jogo quando disponível.
// ==================================================

function ordenarAnalises(lista) {

    if (!Array.isArray(lista)) {

        return [];

    }

    return [
        ...lista
    ].sort(
        (a, b) => {

            const dataA =
                obterDataOrdenacao(
                    a
                );

            const dataB =
                obterDataOrdenacao(
                    b
                );

            return (
                dataA - dataB
            );

        }
    );

}


// ==================================================
// OBTER DATA PARA ORDENAÇÃO
// ==================================================

function obterDataOrdenacao(analise) {

    if (!analise) {

        return Number.MAX_SAFE_INTEGER;

    }

    const campos = [

        analise.data_jogo,

        analise.dataJogo,

        analise.jogo_data,

        analise.data,

        analise.inicio,

        analise.kickoff,

        analise.datetime,

        analise.data_hora,

        analise.dataHora,

        analise.jogo?.data_jogo,

        analise.jogo?.dataJogo,

        analise.jogo?.data,

        analise.jogo?.inicio,

        analise.jogo?.kickoff

    ];


    for (const campo of campos) {

        if (!campo) {

            continue;

        }

        const timestamp =
            new Date(
                campo
            ).getTime();

        if (
            !Number.isNaN(
                timestamp
            )
        ) {

            return timestamp;

        }

    }


    return Number.MAX_SAFE_INTEGER;

}


// ==================================================
// REMOVER DUPLICADAS
//
// Usa api_id quando disponível.
//
// Isso evita que a mesma partida apareça
// duas vezes na tela.
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
            analise.api_id ??
            analise.apiId ??
            analise.jogo_api_id ??
            analise.jogo?.api_id ??
            analise.jogo?.apiId;


        const id =
            analise.id ??
            analise.analise_id;


        const chave =

            apiId !== undefined &&
            apiId !== null

                ? `api:${apiId}`

                : id !== undefined &&
                  id !== null

                    ? `id:${id}`

                    : (

                        `${analise.casa ?? ""}|` +
                        `${analise.fora ?? ""}|` +
                        `${analise.data_jogo ?? ""}`

                    );


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
// PREPARAR LISTA FINAL
//
// Fluxo:
//
// banco
// ↓
// array
// ↓
// somente hoje
// ↓
// remover duplicadas
// ↓
// ordenar
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


    const ordenada =
        ordenarAnalises(
            semDuplicadas
        );


    return ordenada;

}


// ==================================================
// GET /api/analises
//
// IMPORTANTE:
//
// ANTES:
// listarAnalisesDisponiveis()
// → HOJE + AMANHÃ
//
// AGORA:
// listarAnalisesHoje()
// → SOMENTE HOJE
//
// Este é o endpoint principal usado pelo
// dashboard.
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
                "🤖 BUSCANDO ANÁLISES"
            );

            console.log(
                `📅 Data Brasil: ${hoje}`
            );

            console.log(
                `🌎 Timezone: ${TIMEZONE}`
            );

            console.log(
                "🎯 Filtro: SOMENTE HOJE"
            );


            // --------------------------------------
            // BUSCAR SOMENTE ANÁLISES DE HOJE
            // --------------------------------------

            const dados =
                await listarAnalisesHoje();


            // --------------------------------------
            // PROTEÇÃO FINAL
            // --------------------------------------

            const lista =
                prepararListaAnalises(
                    dados
                );


            console.log(
                `🤖 Análises encontradas hoje: ${lista.length}`
            );


            if (
                lista.length > 0
            ) {

                for (
                    const analise
                    of lista
                ) {

                    const apiId =
                        analise.api_id ??
                        analise.apiId ??
                        analise.jogo_api_id ??
                        "N/A";


                    const casa =
                        analise.casa ??
                        analise.time_casa ??
                        analise.home_team ??
                        analise.jogo?.casa ??
                        "Casa";


                    const fora =
                        analise.fora ??
                        analise.time_fora ??
                        analise.away_team ??
                        analise.jogo?.fora ??
                        "Fora";


                    console.log(
                        `⚽ ${casa} x ${fora} | API: ${apiId}`
                    );

                }

            }


            console.log(
                "=========================================="
            );


            return res.json({

                sucesso: true,

                data: hoje,

                timezone:
                    TIMEZONE,

                somenteHoje: true,

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
                "📅 Buscando análises de hoje..."
            );

            console.log(
                `📅 Hoje Brasil: ${hoje}`
            );


            const dados =
                await listarAnalisesHoje();


            const lista =
                prepararListaAnalises(
                    dados
                );


            console.log(
                `📅 Análises válidas de hoje: ${lista.length}`
            );


            return res.json({

                sucesso: true,

                data:
                    hoje,

                timezone:
                    TIMEZONE,

                somenteHoje: true,

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

                    somenteHoje: true,

                    total: 0,

                    dados: [],

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
// ANÁLISE DIRETA
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
// BUSCAR UMA ANÁLISE ESPECÍFICA
//
// IMPORTANTE:
//
// Esta rota não utiliza o filtro de hoje.
//
// Assim, uma análise histórica pode ser consultada
// diretamente pelo ID sem precisar aparecer no
// dashboard de análises de hoje.
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


            // --------------------------------------
            // Como a listagem pública é somente hoje,
            // a busca individual tenta usar a mesma
            // fonte disponível.
            //
            // Se o bancoService possuir futuramente
            // buscarAnalisePorId(), esta rota poderá
            // ser ligada diretamente a ele.
            // --------------------------------------

            const dados =
                await listarAnalisesHoje();


            const lista =
                Array.isArray(dados)
                    ? dados
                    : [];


            const analise =
                lista.find(
                    item =>
                        Number(
                            item?.id
                        ) === id
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
