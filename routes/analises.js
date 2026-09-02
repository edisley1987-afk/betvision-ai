// ==========================================================
// BETVISION AI
// routes/analises.js
//
// VERSÃO 10.0 - CORRIGIDA
//
// CORREÇÕES NESTA VERSÃO:
// - jogo_id, api_id, data_jogo e confianca voltam a ser
//   enviados para salvarAnalise() (antes eram descartados)
// - Fallback: análises sem data_jogo NÃO são mais descartadas
//   do dashboard (schema antigo / registros legados)
// - Mantém 100% de compatibilidade com banco atual
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


        const texto =
            String(valor).trim();


        if (!texto) {
            return null;
        }


        // YYYY-MM-DD
        const matchISO =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (matchISO) {

            return (
                `${matchISO[1]}-${matchISO[2]}-${matchISO[3]}`
            );
        }


        // DD/MM/YYYY
        const matchBR =
            texto.match(
                /^(\d{2})\/(\d{2})\/(\d{4})/
            );

        if (matchBR) {

            return (
                `${matchBR[3]}-${matchBR[2]}-${matchBR[1]}`
            );
        }


        const data =
            new Date(texto);


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


// ============================================// ==========================================================
// BETVISION AI
// routes/analises.js
//
// VERSÃO 10.0 - CORRIGIDA
//
// CORREÇÕES NESTA VERSÃO:
// - jogo_id, api_id, data_jogo e confianca voltam a ser
//   enviados para salvarAnalise() (antes eram descartados)
// - Fallback: análises sem data_jogo NÃO são mais descartadas
//   do dashboard (schema antigo / registros legados)
// - Mantém 100% de compatibilidade com banco atual
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


        const texto =
            String(valor).trim();


        if (!texto) {
            return null;
        }


        // YYYY-MM-DD
        const matchISO =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (matchISO) {

            return (
                `${matchISO[1]}-${matchISO[2]}-${matchISO[3]}`
            );
        }


        // DD/MM/YYYY
        const matchBR =
            texto.match(
                /^(\d{2})\/(\d{2})\/(\d{4})/
            );

        if (matchBR) {

            return (
                `${matchBR[3]}-${matchBR[2]}-${matchBR[1]}`
            );
        }


        const data =
            new Date(texto);


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

        } else if (
            id !== null &&
            id !== undefined
        ) {

            chave =
                `id:${id}`;

        } else {

            chave =
                `${String(obterCasa(analise)).trim().toLowerCase()}|` +
                `${String(obterFora(analise)).trim().toLowerCase()}|` +
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

        analise?.criado_em,
        analise?.created_at,
        analise?.createdAt,

        analise?.jogo?.data_jogo,
        analise?.jogo?.data,

        analise?.jogo?.inicio,
        analise?.jogo?.kickoff,

        analise?.jogo?.date,
        analise?.jogo?.datetime
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
        (a, b) =>
            obterDataOrdenacao(a) -
            obterDataOrdenacao(b)
    );
}


// ==========================================================
// PREPARAR LISTA
//
// CORREÇÃO PRINCIPAL:
//
// Antes, análises sem nenhum campo de data reconhecível
// eram DESCARTADAS (obterDataAnalise() retornava null,
// e null !== hoje). Como a tabela ANALISES não estava
// salvando data_jogo, TODAS as análises somem do dashboard.
//
// Agora: analises SEM data são mantidas (tratadas como
// "de hoje"), e um aviso é logado para você identificar
// registros legados que precisam de data_jogo preenchida.
// ==========================================================

function prepararListaAnalises(dados) {

    if (!Array.isArray(dados)) {
        return [];
    }


    const hoje =
        obterDataHojeBrasil();


    let semDataCount = 0;


    const somenteHoje =
        dados.filter(
            analise => {

                const data =
                    obterDataAnalise(analise);

                if (data === null) {

                    semDataCount++;

                    // Fallback: mantém a análise em vez de
                    // descartá-la (comportamento antigo).
                    return true;
                }

                return data === hoje;
            }
        );


    if (semDataCount > 0) {

        console.warn(
            `⚠️ ${semDataCount} análise(s) sem data_jogo reconhecível ` +
            `(mantidas por fallback). Recomenda-se migrar o schema ` +
            `e fazer backfill da coluna data_jogo.`
        );
    }


    return ordenarAnalises(
        removerDuplicadas(
            somenteHoje
        )
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


    if (
        typeof jogo === "string"
    ) {

        if (!jogo.trim()) {
            return null;
        }

        return jogo.trim();
    }


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


        if (casa && fora) {

            return {

                ...jogo,

                time_casa:
                    String(casa).trim(),

                time_fora:
                    String(fora).trim()
            };
        }


        const nome =
            jogo.nome ??
            jogo.jogo ??
            jogo.name;


        if (nome) {

            return {

                ...jogo,

                jogo:
                    String(nome).trim()
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
        jogo?.id ??

        null
    );
}


// ==========================================================
// NOME DO JOGO
// ==========================================================

function extrairNomeJogo(resultado, jogo) {

    if (resultado?.jogo?.nome) {

        return String(
            resultado.jogo.nome
        ).trim();
    }


    if (resultado?.jogo?.jogo) {

        return String(
            resultado.jogo.jogo
        ).trim();
    }


    if (typeof jogo === "string") {

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
// EXTRAIR DATA
// ==========================================================

function extrairDataJogoParaBanco(
    resultado,
    jogo
) {

    const dataResultado =
        extrairDataJogo(
            resultado?.jogo
        );

    if (dataResultado) {
        return dataResultado;
    }


    const dataJogo =
        extrairDataJogo(jogo);

    if (dataJogo) {
        return dataJogo;
    }


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


    for (const campo of campos) {

        const data =
            normalizarDataBrasil(campo);

        if (data) {
            return data;
        }
    }


    // Última tentativa: assume hoje, para nunca deixar
    // a análise "órfã" de data (evita o bug anterior).
    return obterDataHojeBrasil();
}


// ==========================================================
// CONFIANÇA
// ==========================================================

function extrairConfianca(resultado) {

    const valor =
        resultado?.confianca?.percentual ??
        resultado?.confianca?.valor ??
        resultado?.confianca?.nivel ??
        resultado?.confianca ??
        null;


    if (typeof valor === "number") {
        return valor;
    }


    if (typeof valor === "string") {

        const numero =
            Number(
                valor
                    .replace("%", "")
                    .replace(",", ".")
                    .trim()
            );


        if (Number.isFinite(numero)) {
            return numero;
        }
    }


    return null;
}


// ==========================================================
// PREPARAR JSON
// ==========================================================

function prepararJson(valor) {

    if (
        valor === undefined ||
        valor === null
    ) {
        return null;
    }


    if (
        typeof valor === "object"
    ) {

        try {

            return JSON.stringify(
                valor
            );

        } catch {

            return null;
        }
    }


    return String(valor);
}


// ==========================================================
// PREPARAR ANÁLISE PARA BANCO
//
// CORREÇÃO PRINCIPAL:
//
// Agora envia jogo_id, api_id, data_jogo e confianca junto
// com os campos que já eram salvos. Isso é essencial para
// que /api/analises consiga filtrar "análises de hoje"
//
