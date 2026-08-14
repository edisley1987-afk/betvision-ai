// ==========================================================
// BETVISION AI
// routes/analises.js
//
// ROTAS DE ANÁLISES IA
//
// VERSÃO 8.2
//
// CORREÇÕES:
//
// - SALVA data_jogo CORRETAMENTE
// - TIMEZONE America/Sao_Paulo
// - SOMENTE JOGOS DE HOJE
// - REMOVE DUPLICADAS
// - NORMALIZA DATAS
// - ACEITA fixture.date
// - ACEITA data_jogo / dataJogo / date / datetime
// - MANTÉM api_id
// - MANTÉM jogo_id
// - GET /api/analises
// - GET /api/analises/hoje
// - GET /api/analises/:id
// - POST /api/analises
// - POST /api/analises/prever
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


// ==========================================================
// NORMALIZAR DATA BRASIL
// ==========================================================

function normalizarDataBrasil(valor) {

    if (!valor) {
        return null;
    }

    try {

        // --------------------------------------------------
        // DATE
        // --------------------------------------------------

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


        // --------------------------------------------------
        // TEXTO
        // --------------------------------------------------

        const texto =
            String(valor).trim();

        if (!texto) {
            return null;
        }


        // --------------------------------------------------
        // YYYY-MM-DD
        //
        // IMPORTANTE:
        // NÃO converter novamente para Date.
        // Isso evita problemas de UTC.
        // --------------------------------------------------

        const match =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (match) {

            return (
                `${match[1]}-${match[2]}-${match[3]}`
            );

        }


        // --------------------------------------------------
        // DATA DD/MM/YYYY
        // --------------------------------------------------

        const matchBR =
            texto.match(
                /^(\d{2})\/(\d{2})\/(\d{4})/
            );

        if (matchBR) {

            return (
                `${matchBR[3]}-` +
                `${matchBR[2]}-` +
                `${matchBR[1]}`
            );

        }


        // --------------------------------------------------
        // ISO / DATETIME
        // --------------------------------------------------

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
            "⚠️ Erro normalizando data:",
            erro.message
        );

        return null;

    }

}


// ==========================================================
// EXTRAIR DATA DO JOGO
//
// Aceita:
//
// data_jogo
// dataJogo
// jogo_data
// data
// inicio
// kickoff
// date
// datetime
// fixture.date
// fixture.data
// match.date
//
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


    for (
        const campo of campos
    ) {

        const data =
            normalizarDataBrasil(
                campo
            );

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


    for (
        const campo of campos
    ) {

        const data =
            normalizarDataBrasil(
                campo
            );

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


            return (
                data === hoje
            );

        }
    );

}


// ==========================================================
// API ID
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


    const mapa =
        new Map();


    for (
        const analise of lista
    ) {

        if (!analise) {
            continue;
        }


        const apiId =
            obterApiId(
                analise
            );


        const jogoId =
            obterJogoId(
                analise
            );


        const id =
            analise.id ??
            analise.analise_id ??
            null;


        let chave;


        // --------------------------------------------------
        // PRIORIDADE 1
        // API ID
        // --------------------------------------------------

        if (
            apiId !== null &&
            apiId !== undefined
        ) {

            chave =
                `api:${apiId}`;

        }


        // --------------------------------------------------
        // PRIORIDADE 2
        // JOGO ID
        // --------------------------------------------------

        else if (
            jogoId !== null &&
            jogoId !== undefined
        ) {

            chave =
                `jogo:${jogoId}`;

        }


        // --------------------------------------------------
        // PRIORIDADE 3
        // ID DA ANÁLISE
        // --------------------------------------------------

        else if (
            id !== null &&
            id !== undefined
        ) {

            chave =
                `id:${id}`;

        }


        // --------------------------------------------------
        // FALLBACK
        // --------------------------------------------------

        else {

            chave =
                `${obterCasa(analise)}|` +
                `${obterFora(analise)}|` +
                `${obterDataAnalise(analise)}`;

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


// ==========================================================
// DATA ORDENAÇÃO
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
        analise?.jogo?.kickoff,

        analise?.jogo?.date,
        analise?.jogo?.datetime

    ];


    for (
        const campo of campos
    ) {

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


// ==========================================================
// NORMALIZAR JOGO RECEBIDO
// ==========================================================

function normalizarJogoRecebido(body) {

    if (!body) {
        return null;
    }


    const jogo =
        body.jogo ??
        body.partida ??
        body.match ??
        body;


    // ------------------------------------------------------
    // STRING
    // ------------------------------------------------------

    if (
        typeof jogo === "string"
    ) {

        if (
            !jogo.trim()
        ) {

            return null;

        }


        return jogo.trim();

    }


    // ------------------------------------------------------
    // OBJETO
    // ------------------------------------------------------

    if (
        jogo &&
        typeof jogo === "object"
    ) {

        const casa =
            jogo.time_casa ??
            jogo.casa ??
            jogo.home_team ??
            jogo.homeTeam ??
            jogo.home ??
            jogo.fixture?.teams?.home?.name;


        const fora =
            jogo.time_fora ??
            jogo.fora ??
            jogo.away_team ??
            jogo.awayTeam ??
            jogo.away ??
            jogo.fixture?.teams?.away?.name;


        if (
            casa &&
            fora
        ) {

            return {

                ...jogo,

                time_casa:
                    String(
                        casa
                    ).trim(),

                time_fora:
                    String(
                        fora
                    ).trim()

            };

        }


        const nome =
            jogo.nome ??
            jogo.jogo ??
            jogo.name;


        if (
            nome
        ) {

            return {

                ...jogo,

                jogo:
                    String(
                        nome
                    ).trim()

            };

        }

    }


    return null;

}


// ==========================================================
// EXTRAIR API ID
// ==========================================================

function extrairApiId(resultado, jogo) {

    return (

        resultado?.jogo?.api_id ??

        resultado?.jogo?.apiId ??

        resultado?.api_id ??

        resultado?.apiId ??

        jogo?.api_id ??

        jogo?.apiId ??

        jogo?.fixture?.id ??

        jogo?.id ??

        null

    );

}


// ==========================================================
// EXTRAIR JOGO ID
// ==========================================================

function extrairJogoId(resultado, jogo) {

    return (

        resultado?.jogo?.jogo_id ??

        resultado?.jogo?.jogoId ??

        resultado?.jogo_id ??

        resultado?.jogoId ??

        jogo?.jogo_id ??

        jogo?.jogoId ??

        null

    );

}


// ==========================================================
// NOME DO JOGO
// ==========================================================

function extrairNomeJogo(resultado, jogo) {

    if (
        resultado?.jogo?.nome
    ) {

        return String(
            resultado.jogo.nome
        ).trim();

    }


    if (
        resultado?.jogo?.jogo
    ) {

        return String(
            resultado.jogo.jogo
        ).trim();

    }


    if (
        typeof jogo === "string"
    ) {

        return jogo.trim();

    }


    const casa =
        jogo?.time_casa ??
        jogo?.casa ??
        jogo?.home_team ??
        jogo?.homeTeam ??
        jogo?.fixture?.teams?.home?.name ??
        "";


    const fora =
        jogo?.time_fora ??
        jogo?.fora ??
        jogo?.away_team ??
        jogo?.awayTeam ??
        jogo?.fixture?.teams?.away?.name ??
        "";


    return (
        `${casa} x ${fora}`
    ).trim();

}


// ==========================================================
// EXTRAIR DATA DO JOGO PARA BANCO
// ==========================================================

function extrairDataJogoParaBanco(
    resultado,
    jogo
) {

    // ------------------------------------------------------
    // PRIMEIRO RESULTADO
    // ------------------------------------------------------

    const dataResultado =
        extrairDataJogo(
            resultado?.jogo
        );


    if (dataResultado) {
        return dataResultado;
    }


    // ------------------------------------------------------
    // DEPOIS JOGO ORIGINAL
    // ------------------------------------------------------

    const dataJogo =
        extrairDataJogo(
            jogo
        );


    if (dataJogo) {
        return dataJogo;
    }


    // ------------------------------------------------------
    // DATA DIRETA DO RESULTADO
    // ------------------------------------------------------

    const campos = [

        resultado?.data_jogo,
        resultado?.dataJogo,
        resultado?.jogo_data,

        resultado?.data,
        resultado?.inicio,
        resultado?.kickoff,

        resultado?.date,
        resultado?.datetime

    ];


    for (
        const campo of campos
    ) {

        const data =
            normalizarDataBrasil(
                campo
            );


        if (data) {
            return data;
        }

    }


    return null;

}


// ==========================================================
// EXTRAIR VALOR JSON
// ==========================================================

function prepararJson(valor) {

    if (
        valor === undefined ||
        valor === null
    ) {

        return null;

    }


    return valor;

}


// ==========================================================
// EXTRAIR VALOR DE CONFIANÇA
// ==========================================================

function extrairConfianca(resultado) {

    const valor =
        resultado?.confianca?.percentual ??
        resultado?.confianca?.valor ??
        resultado?.confianca?.nivel ??
        resultado?.confianca ??
        null;


    if (
        typeof valor === "number"
    ) {

        return valor;

    }


    if (
        typeof valor === "string"
    ) {

        const numero =
            Number(
                valor.replace(
                    "%",
                    ""
                ).replace(
                    ",",
                    "."
                )
            );


        if (
            Number.isFinite(numero)
        ) {

            return numero;

        }

    }


    return null;

}


// ==========================================================
// EXTRAIR VALORES PARA SALVAMENTO
// ==========================================================

function prepararAnaliseParaBanco(
    resultado,
    jogo
) {

    if (
        !resultado ||
        !resultado.sucesso
    ) {

        console.log(
            "⚠️ Resultado da análise não possui sucesso."
        );

        return null;

    }


    const probabilidades =
        resultado.probabilidades ||
        {};


    const gols =
        resultado.golsEsperados ||
        {};


    const valueBets =
        Array.isArray(
            resultado.valueBets
        )
            ? resultado.valueBets
            : [];


    const apiId =
        extrairApiId(
            resultado,
            jogo
        );


    const jogoId =
        extrairJogoId(
            resultado,
            jogo
        );


    const dataJogo =
        extrairDataJogoParaBanco(
            resultado,
            jogo
        );


    const nomeJogo =
        extrairNomeJogo(
            resultado,
            jogo
        );


    console.log(
        "💾 PREPARANDO ANÁLISE PARA BANCO:"
    );

    console.log(
        `⚽ Jogo: ${nomeJogo}`
    );

    console.log(
        `🆔 API ID: ${apiId ?? "NULL"}`
    );

    console.log(
        `🆔 Jogo ID: ${jogoId ?? "NULL"}`
    );

    console.log(
        `📅 Data jogo: ${dataJogo ?? "NULL"}`
    );


    if (!dataJogo) {

        console.warn(
            "⚠️ ATENÇÃO: análise sem data_jogo."
        );

    }


    return {

        // --------------------------------------------------
        // IDENTIFICAÇÃO
        // --------------------------------------------------

        api_id:
            apiId,

        jogo_id:
            jogoId,


        // --------------------------------------------------
        // JOGO
        // --------------------------------------------------

        jogo:
            nomeJogo,


        // --------------------------------------------------
        // DATA
        // --------------------------------------------------

        data_jogo:
            dataJogo,


        // --------------------------------------------------
        // PROBABILIDADES
        // --------------------------------------------------

        probabilidades: {
            casa:
                probabilidades.casa ??
                null,

            empate:
                probabilidades.empate ??
                null,

            fora:
                probabilidades.fora ??
                null
        },


        // --------------------------------------------------
        // GOLS ESPERADOS
        // --------------------------------------------------

        gols_esperados: {

            casa:
                gols.casa ??
                null,

            fora:
                gols.fora ??
                null,

            total:
                gols.total ??
                null

        },


        // --------------------------------------------------
        // PLACAR
        // --------------------------------------------------

        placar_previsto:
            prepararJson(
                resultado.placarPrevisto ??
                null
            ),


        // --------------------------------------------------
        // VALUE BET
        // --------------------------------------------------

        value_bet:
            valueBets,


        // --------------------------------------------------
        // CONFIANÇA
        // --------------------------------------------------

        confianca:
            extrairConfianca(
                resultado
            ),


        // --------------------------------------------------
        // ALGORITMO
        // --------------------------------------------------

        algoritmo:
            resultado.algoritmo ??
            "BetVision AI Motor Estatístico v8.2"

    };

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


            console.log(
                `📦 Registros recebidos do banco: ${
                    Array.isArray(dados)
                        ? dados.length
                        : 0
                }`
            );


            const lista =
                prepararListaAnalises(
                    dados
                );


            console.log(
                `🤖 ${lista.length} análises válidas para hoje`
            );


            for (
                const analise of lista
            ) {

                console.log(

                    `⚽ ${obterCasa(analise)} ` +
                    `x ${obterFora(analise)} ` +

                    ` | Data: ${
                        obterDataAnalise(
                            analise
                        ) ?? "N/A"
                    }` +

                    ` | API: ${
                        obterApiId(
                            analise
                        ) ?? "N/A"
                    }`

                );

            }


            console.log(
                "=========================================="
            );


            return res.json({

                sucesso:
                    true,

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


            return res
                .status(500)
                .json({

                    sucesso:
                        false,

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


            console.log(
                `🤖 Buscando análises de hoje: ${hoje}`
            );


            const dados =
                await listarAnalisesHoje();


            const lista =
                prepararListaAnalises(
                    dados
                );


            console.log(
                `🤖 Análises de hoje encontradas: ${lista.length}`
            );


            return res.json({

                sucesso:
                    true,

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
                "❌ Erro análises hoje:",
                erro.message
            );


            return res
                .status(500)
                .json({

                    sucesso:
                        false,

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
//
// ANÁLISE DE MERCADO
// ==========================================================

router.post(
    "/",
    async (
        req,
        res
    ) => {

        try {

            const body =
                req.body ||
                {};


            const jogo =
                normalizarJogoRecebido(
                    body
                );


            const dados =
                body.dados ||
                {};


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


            console.log(
                `🤖 Analisando jogo: ${
                    typeof jogo === "string"
                        ? jogo
                        : (
                            `${jogo.time_casa} x ` +
                            `${jogo.time_fora}`
                        )
                }`
            );


            const resultado =
                await analisarMercado(
                    jogo,
                    dados
                );


            // ==================================================
            // SALVAR ANÁLISE
            // ==================================================

            try {

                const paraSalvar =
                    prepararAnaliseParaBanco(
                        resultado,
                        jogo
                    );


                if (
                    paraSalvar
                ) {

                    console.log(
                        "💾 Salvando análise..."
                    );


                    const salva =
                        await salvarAnalise(
                            paraSalvar
                        );


                    if (
                        salva
                    ) {

                        resultado.id =
                            salva.id;

                        resultado.api_id =
                            salva.api_id;

                        resultado.jogo_id =
                            salva.jogo_id;

                        resultado.data_jogo =
                            salva.data_jogo;


                        console.log(
                            `✅ Análise salva: ID ${salva.id}`
                        );

                        console.log(
                            `📅 data_jogo: ${
                                salva.data_jogo ??
                                "NULL"
                            }`
                        );

                    }

                }

            }

            catch (erroBanco) {

                console.error(
                    "⚠️ Erro salvando análise:",
                    erroBanco.message
                );

            }


            return res.json(
                resultado
            );

        }

        catch (erro) {

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
//
// PREVISÃO DIRETA
// ==========================================================

router.post(
    "/prever",
    async (
        req,
        res
    ) => {

        try {

            const body =
                req.body ||
                {};


            const jogo =
                normalizarJogoRecebido(
                    body
                );


            const dados =
                body.dados ||
                {};


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


            console.log(
                `🤖 PREVISÃO IA: ${
                    typeof jogo === "string"
                        ? jogo
                        : (
                            `${jogo.time_casa} x ` +
                            `${jogo.time_fora}`
                        )
                }`
            );


            const resultado =
                await gerarAnaliseInteligente(
                    jogo,
                    dados
                );


            return res.json({

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

        }

        catch (erro) {

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
