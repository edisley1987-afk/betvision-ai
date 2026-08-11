// ==========================================
// BetVision AI
// services/futebolService.js
//
// Versão 16.0
//
// Serviço Futebol Integrado
// Football-Data.org v4
// Neon PostgreSQL
//
// CORREÇÕES V16:
//
// - Busca jogos do DIA ATUAL no Brasil
// - Fuso America/Sao_Paulo
// - Busca janela UTC ampliada
// - Filtro local obrigatório pela data brasileira
// - Não traz jogos de ontem
// - Não traz jogos de amanhã
// - Busca jogos de TODOS os países/competições
//   disponíveis para a API KEY
// - Não limita a apenas Brasil
// - Não limita a apenas Libertadores
// - Usa limit=500
// - Paginação automática quando necessário
// - Remove duplicidades
// - Valida api_id
// - Valida times
// - Valida data
// - Não cria jogos fictícios
// - Mantém compatibilidade com IA
// - Mantém compatibilidade com jogoBancoService.js
// - Mantém compatibilidade com versões anteriores
// ==========================================

import dotenv from "dotenv";

dotenv.config();

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const API_KEY =
    process.env.FOOTBALL_DATA_KEY ||
    process.env.API_FOOTBALL_KEY ||
    "";


// ==========================================
// URL OFICIAL
// ==========================================

const API_URL =
    process.env.FOOTBALL_DATA_URL ||
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";


// ==========================================
// FUSO HORÁRIO
// ==========================================

const TIMEZONE =
    "America/Sao_Paulo";


// ==========================================
// TIMEOUT
// ==========================================

const API_TIMEOUT =
    15000;


// ==========================================
// LIMITE POR REQUISIÇÃO
// Football-Data permite até 500
// ==========================================

const API_LIMIT =
    500;


// ==========================================
// LIMITE DE PÁGINAS DE SEGURANÇA
// ==========================================

const MAX_PAGINAS =
    10;


// ==========================================
// OBTER DATA ATUAL DO BRASIL
// ==========================================

function obterDataHojeBrasil() {

    try {

        const agora =
            new Date();


        const formatter =
            new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone:
                        TIMEZONE,

                    year:
                        "numeric",

                    month:
                        "2-digit",

                    day:
                        "2-digit"
                }
            );


        return formatter.format(
            agora
        );

    }

    catch (error) {

        console.error(
            "❌ Erro ao obter data do Brasil:",
            error.message
        );

        return null;

    }

}


// ==========================================
// VALIDAR DATA
// ==========================================

function dataValida(data) {

    if (
        typeof data !==
        "string"
    ) {

        return false;

    }


    return /^\d{4}-\d{2}-\d{2}$/
        .test(data);

}


// ==========================================
// CONVERTER YYYY-MM-DD
// PARA OBJETO UTC
// ==========================================

function criarDataUTC(data) {

    if (
        !dataValida(
            data
        )
    ) {

        return null;

    }


    const partes =
        data.split("-");


    const ano =
        Number(
            partes[0]
        );


    const mes =
        Number(
            partes[1]
        );


    const dia =
        Number(
            partes[2]
        );


    const resultado =
        new Date(
            Date.UTC(
                ano,
                mes - 1,
                dia
            )
        );


    if (
        Number.isNaN(
            resultado.getTime()
        )
    ) {

        return null;

    }


    return resultado;

}


// ==========================================
// FORMATAR DATA UTC
// ==========================================

function formatarDataUTC(
    data
) {

    if (
        !data ||
        Number.isNaN(
            data.getTime()
        )
    ) {

        return null;

    }


    const ano =
        data
            .getUTCFullYear()
            .toString()
            .padStart(
                4,
                "0"
            );


    const mes =
        (
            data
                .getUTCMonth() + 1
        )
            .toString()
            .padStart(
                2,
                "0"
            );


    const dia =
        data
            .getUTCDate()
            .toString()
            .padStart(
                2,
                "0"
            );


    return (
        `${ano}-${mes}-${dia}`
    );

}


// ==========================================
// DATA ANTERIOR
// ==========================================

function obterDataAnterior(
    data
) {

    try {

        const dataObj =
            criarDataUTC(
                data
            );


        if (!dataObj) {

            return null;

        }


        dataObj.setUTCDate(
            dataObj.getUTCDate() - 1
        );


        return formatarDataUTC(
            dataObj
        );

    }

    catch {

        return null;

    }

}


// ==========================================
// DATA SEGUINTE
// ==========================================

function obterDataSeguinte(
    data
) {

    try {

        const dataObj =
            criarDataUTC(
                data
            );


        if (!dataObj) {

            return null;

        }


        dataObj.setUTCDate(
            dataObj.getUTCDate() + 1
        );


        return formatarDataUTC(
            dataObj
        );

    }

    catch {

        return null;

    }

}


// ==========================================
// OBTER DATA DO JOGO NO BRASIL
// ==========================================

function obterDataJogoBrasil(
    utcDate
) {

    try {

        if (!utcDate) {

            return null;

        }


        const data =
            new Date(
                utcDate
            );


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return null;

        }


        const formatter =
            new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone:
                        TIMEZONE,

                    year:
                        "numeric",

                    month:
                        "2-digit",

                    day:
                        "2-digit"
                }
            );


        return formatter.format(
            data
        );

    }

    catch {

        return null;

    }

}


// ==========================================
// OBTER HORA NO BRASIL
// ==========================================

function obterHorarioBrasil(
    utcDate
) {

    try {

        if (!utcDate) {

            return null;

        }


        const data =
            new Date(
                utcDate
            );


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return null;

        }


        const formatter =
            new Intl.DateTimeFormat(
                "pt-BR",
                {
                    timeZone:
                        TIMEZONE,

                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );


        return formatter.format(
            data
        );

    }

    catch {

        return null;

    }

}


// ==========================================
// VALIDAR HORÁRIO
// ==========================================

function validarHorario(
    horario
) {

    if (!horario) {

        return false;

    }


    const timestamp =
        new Date(
            horario
        ).getTime();


    return Number.isFinite(
        timestamp
    );

}


// ==========================================
// NORMALIZAR TEXTO
// ==========================================

function normalizarTexto(
    valor
) {

    if (
        valor === undefined ||
        valor === null
    ) {

        return null;

    }


    const texto =
        String(
            valor
        ).trim();


    return texto ||
        null;

}


// ==========================================
// NORMALIZAR API ID
// ==========================================

function normalizarApiId(
    valor
) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {

        return null;

    }


    const numero =
        Number(
            valor
        );


    if (
        !Number.isInteger(
            numero
        ) ||
        numero <= 0
    ) {

        return null;

    }


    return numero;

}


// ==========================================
// VALIDAR TIMES
// ==========================================

function validarTimes(
    timeCasa,
    timeFora
) {

    const casa =
        normalizarTexto(
            timeCasa
        );


    const fora =
        normalizarTexto(
            timeFora
        );


    if (
        !casa ||
        !fora
    ) {

        return false;

    }


    const casaNormalizada =
        casa
            .toLowerCase()
            .trim();


    const foraNormalizada =
        fora
            .toLowerCase()
            .trim();


    const nomesInvalidos = [

        "casa",
        "fora",
        "time a",
        "time b",
        "home",
        "away",
        "home team",
        "away team"

    ];


    if (
        nomesInvalidos.includes(
            casaNormalizada
        )
    ) {

        return false;

    }


    if (
        nomesInvalidos.includes(
            foraNormalizada
        )
    ) {

        return false;

    }


    if (
        casaNormalizada ===
        foraNormalizada
    ) {

        return false;

    }


    return true;

}


// ==========================================
// MONTAR URL
// ==========================================
//
// IMPORTANTE:
//
// O Football-Data trabalha o dateTo
// como limite exclusivo.
//
// Para garantir todos os jogos do
// dia brasileiro, buscamos:
//
// ontem UTC -> amanhã UTC
//
// e depois fazemos o filtro local
// America/Sao_Paulo.
//
// ==========================================

function montarURL(
    dateFrom,
    dateTo,
    offset = 0
) {

    const parametros =
        new URLSearchParams();


    parametros.set(
        "dateFrom",
        dateFrom
    );


    parametros.set(
        "dateTo",
        dateTo
    );


    parametros.set(
        "limit",
        String(
            API_LIMIT
        )
    );


    if (
        offset > 0
    ) {

        parametros.set(
            "offset",
            String(
                offset
            )
        );

    }


    return (
        `${API_URL}/matches?` +
        parametros.toString()
    );

}


// ==========================================
// CONSULTAR UMA PÁGINA
// ==========================================

async function consultarPagina(
    url
) {

    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () => {

                controller.abort();

            },
            API_TIMEOUT
        );


    try {

        const resposta =
            await fetch(
                url,
                {

                    method:
                        "GET",

                    headers:
                        {

                            "X-Auth-Token":
                                API_KEY,

                            "Accept":
                                "application/json"

                        },

                    signal:
                        controller.signal

                }
            );


        if (
            !resposta.ok
        ) {

            let erro =
                {};


            try {

                erro =
                    await resposta.json();

            }

            catch {

                erro =
                    {};

            }


            console.error(
                "❌ Football-Data erro:",
                resposta.status,
                erro
            );


            if (
                resposta.status ===
                400
            ) {

                console.error(
                    "⚠️ Requisição inválida"
                );

            }


            if (
                resposta.status ===
                401
            ) {

                console.error(
                    "🔑 API KEY inválida"
                );

            }


            if (
                resposta.status ===
                403
            ) {

                console.error(
                    "🚫 Acesso negado pela Football-Data.org"
                );

                console.error(
                    "🚫 Verifique as competições disponíveis no seu plano"
                );

            }


            if (
                resposta.status ===
                429
            ) {

                console.error(
                    "⏳ Limite de requisições atingido"
                );

            }


            return {

                sucesso:
                    false,

                matches:
                    [],

                count:
                    0,

                erro:
                    resposta.status

            };

        }


        const dados =
            await resposta.json();


        const matches =
            Array.isArray(
                dados?.matches
            )
                ? dados.matches
                : [];


        const count =
            Number(
                dados?.resultSet?.count ??
                dados?.count ??
                matches.length
            );


        return {

            sucesso:
                true,

            matches:
                matches,

            count:
                Number.isFinite(
                    count
                )
                    ? count
                    : matches.length,

            dados:
                dados

        };

    }

    catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            console.error(
                `⏱️ Timeout Football-Data: ${API_TIMEOUT}ms`
            );

        }

        else {

            console.error(
                "❌ Erro consultando Football-Data:",
                error?.message ||
                error
            );

        }


        return {

            sucesso:
                false,

            matches:
                [],

            count:
                0,

            erro:
                error

        };

    }

    finally {

        clearTimeout(
            timeout
        );

    }

}


// ==========================================
// BUSCAR TODAS AS PÁGINAS
// ==========================================

async function buscarTodasAsPartidas(
    dateFrom,
    dateTo
) {

    const partidas =
        [];


    let offset =
        0;


    let pagina =
        1;


    while (
        pagina <=
        MAX_PAGINAS
    ) {

        const url =
            montarURL(
                dateFrom,
                dateTo,
                offset
            );


        console.log(
            `🌐 Football-Data página ${pagina}:`
        );


        console.log(
            url
        );


        const resposta =
            await consultarPagina(
                url
            );


        if (
            !resposta.sucesso
        ) {

            break;

        }


        const lista =
            resposta.matches;


        if (
            !lista.length
        ) {

            break;

        }


        partidas.push(
            ...lista
        );


        console.log(
            `📦 Página ${pagina}: ${lista.length} jogos`
        );


        // ======================================
        // NÃO HÁ MAIS RESULTADOS
        // ======================================

        if (
            lista.length <
            API_LIMIT
        ) {

            break;

        }


        offset +=
            API_LIMIT;


        pagina++;

    }


    return partidas;

}


// ==========================================
// BUSCAR JOGOS DO DIA
// ==========================================

export async function buscarJogosDia() {

    try {

        console.log(
            "=========================================="
        );


        console.log(
            "⚽ BETVISION AI"
        );


        console.log(
            "⚽ BUSCANDO JOGOS DE HOJE"
        );


        console.log(
            "🌎 TODOS OS PAÍSES / COMPETIÇÕES DISPONÍVEIS"
        );


        console.log(
            "=========================================="
        );


        // ======================================
        // DATA BRASIL
        // ======================================

        const hoje =
            obterDataHojeBrasil();


        if (
            !dataValida(
                hoje
            )
        ) {

            console.error(
                "❌ Data brasileira inválida"
            );

            return [];

        }


        console.log(
            `📅 Data considerada: ${hoje}`
        );


        console.log(
            `🌎 Fuso horário: ${TIMEZONE}`
        );


        // ======================================
        // API KEY
        // ======================================

        if (!API_KEY) {

            console.warn(
                "⚠️ Football-Data sem API KEY"
            );


            console.warn(
                "⚠️ Configure FOOTBALL_DATA_KEY no .env"
            );


            console.warn(
                "⚠️ Nenhum jogo fictício será criado"
            );


            return [];

        }


        // ======================================
        // JANELA DE BUSCA
        // ======================================
        //
        // Buscamos:
        //
        // ontem -> amanhã
        //
        // porque o horário UTC pode ser
        // diferente do horário brasileiro.
        //
        // Depois filtramos exatamente
        // pela data brasileira.
        //
        // ======================================

        const dataFrom =
            obterDataAnterior(
                hoje
            );


        const dataTo =
            obterDataSeguinte(
                hoje
            );


        if (
            !dataFrom ||
            !dataTo
        ) {

            console.error(
                "❌ Não foi possível calcular janela de datas"
            );


            return [];

        }


        console.log(
            `📡 Janela UTC consultada: ${dataFrom} até ${dataTo}`
        );


        console.log(
            "🌍 Nenhum país está sendo filtrado pelo código"
        );


        console.log(
            "🌍 A API retornará todas as competições permitidas pela API KEY"
        );


        // ======================================
        // BUSCAR PARTIDAS
        // ======================================

        const partidas =
            await buscarTodasAsPartidas(
                dataFrom,
                dataTo
            );


        console.log(
            `⚽ ${partidas.length} jogos recebidos da API`
        );


        // ======================================
        // NENHUM JOGO
        // ======================================

        if (
            !partidas.length
        ) {

            console.log(
                `ℹ️ Nenhum jogo recebido pela API`
            );


            console.log(
                `ℹ️ Data Brasil: ${hoje}`
            );


            return [];

        }


        // ======================================
        // REMOVER DUPLICADOS DA API
        // ======================================

        const idsProcessados =
            new Set();


        const jogos =
            partidas

                .map(
                    (partida) => {

                        // ==============================
                        // API ID
                        // ==============================

                        const apiId =
                            normalizarApiId(
                                partida?.id
                            );


                        if (!apiId) {

                            console.warn(
                                "⚠️ Jogo ignorado: api_id inválido"
                            );


                            return null;

                        }


                        // ==============================
                        // DUPLICIDADE
                        // ==============================

                        if (
                            idsProcessados.has(
                                apiId
                            )
                        ) {

                            console.warn(
                                `♻️ Jogo duplicado ignorado: API ${apiId}`
                            );


                            return null;

                        }


                        idsProcessados.add(
                            apiId
                        );


                        // ==============================
                        // TIMES
                        // ==============================

                        const timeCasa =
                            normalizarTexto(
                                partida
                                    ?.homeTeam
                                    ?.name
                            );


                        const timeFora =
                            normalizarTexto(
                                partida
                                    ?.awayTeam
                                    ?.name
                            );


                        if (
                            !validarTimes(
                                timeCasa,
                                timeFora
                            )
                        ) {

                            console.warn(
                                `⚠️ Jogo ${apiId} ignorado: times inválidos`
                            );


                            return null;

                        }


                        // ==============================
                        // CAMPEONATO
                        // ==============================

                        const campeonato =
                            normalizarTexto(
                                partida
                                    ?.competition
                                    ?.name
                            ) ||
                            "Futebol";


                        // ==============================
                        // CÓDIGO
                        // ==============================

                        const codigoCampeonato =
                            normalizarTexto(
                                partida
                                    ?.competition
                                    ?.code
                            );


                        // ==============================
                        // ID CAMPEONATO
                        // ==============================

                        const campeonatoId =
                            normalizarApiId(
                                partida
                                    ?.competition
                                    ?.id
                            );


                        // ==============================
                        // PAÍS / ÁREA
                        // ==============================

                        const pais =
                            normalizarTexto(
                                partida
                                    ?.area
                                    ?.name
                            );


                        const codigoPais =
                            normalizarTexto(
                                partida
                                    ?.area
                                    ?.code
                            );


                        // ==============================
                        // ESTÁDIO
                        // ==============================

                        const estadio =
                            normalizarTexto(
                                partida
                                    ?.venue
                            );


                        // ==============================
                        // DATA UTC
                        // ==============================

                        const horario =
                            partida
                                ?.utcDate ||
                            null;


                        if (
                            !validarHorario(
                                horario
                            )
                        ) {

                            console.warn(
                                `⚠️ Jogo ${apiId} ignorado: data inválida`
                            );


                            return null;

                        }


                        // ==============================
                        // DATA BRASIL
                        // ==============================

                        const dataJogoBrasil =
                            obterDataJogoBrasil(
                                horario
                            );


                        // ==============================
                        // FILTRO PRINCIPAL
                        // ==============================

                        if (
                            dataJogoBrasil !==
                            hoje
                        ) {

                            console.log(
                                `🚫 Jogo ${apiId} descartado: ${dataJogoBrasil} != ${hoje}`
                            );


                            return null;

                        }


                        // ==============================
                        // HORÁRIO BRASIL
                        // ==============================

                        const horarioBrasil =
                            obterHorarioBrasil(
                                horario
                            );


                        // ==============================
                        // STATUS
                        // ==============================

                        const status =
                            normalizarTexto(
                                partida?.status
                            ) ||
                            "SCHEDULED";


                        // ==============================
                        // OBJETO PADRONIZADO
                        // ==============================

                        return {

                            // ID externo
                            api_id:
                                apiId,


                            // Compatibilidade
                            id:
                                apiId,


                            // País
                            pais:
                                pais,


                            pais_codigo:
                                codigoPais,


                            // Campeonato
                            campeonato:
                                campeonato,


                            campeonato_codigo:
                                codigoCampeonato,


                            campeonato_id:
                                campeonatoId,


                            // Times
                            time_casa:
                                timeCasa,


                            time_fora:
                                timeFora,


                            // Compatibilidade IA
                            casa:
                                timeCasa,


                            fora:
                                timeFora,


                            // Data oficial UTC
                            data_jogo:
                                horario,


                            horario:
                                horario,


                            // Data Brasil
                            data_jogo_brasil:
                                dataJogoBrasil,


                            // Horário Brasil
                            horario_brasil:
                                horarioBrasil,


                            // Estádio
                            estadio:
                                estadio,


                            // Status
                            status:
                                status

                        };

                    }
                )

                .filter(
                    Boolean
                );


        // ======================================
        // ORDENAR POR HORÁRIO
        // ======================================

        jogos.sort(
            (
                a,
                b
            ) => {

                const dataA =
                    new Date(
                        a.data_jogo
                    ).getTime();


                const dataB =
                    new Date(
                        b.data_jogo
                    ).getTime();


                return (
                    dataA -
                    dataB
                );

            }
        );


        // ======================================
        // RESULTADO
        // ======================================

        console.log(
            `⚽ ${jogos.length} jogos válidos para ${hoje}`
        );


        // ======================================
        // NENHUM JOGO APÓS FILTRO
        // ======================================

        if (
            !jogos.length
        ) {

            console.log(
                "⚠️ Nenhum jogo válido após filtro de data brasileira"
            );


            return [];

        }


        // ======================================
        // MOSTRAR TODOS OS JOGOS
        // ======================================

        jogos.forEach(
            (
                jogo,
                indice
            ) => {

                console.log(

                    `⚽ ${indice + 1}. ` +

                    `${jogo.time_casa} x ` +

                    `${jogo.time_fora} | ` +

                    `${jogo.pais || "País não informado"} | ` +

                    `${jogo.campeonato} | ` +

                    `${jogo.horario_brasil || "--:--"} | ` +

                    `API ${jogo.api_id}`

                );

            }
        );


        // ======================================
        // RESUMO POR PAÍS
        // ======================================

        const porPais =
            new Map();


        jogos.forEach(
            (
                jogo
            ) => {

                const pais =
                    jogo.pais ||
                    "País não informado";


                porPais.set(

                    pais,

                    (
                        porPais.get(
                            pais
                        ) ||
                        0
                    ) + 1

                );

            }
        );


        console.log(
            "=========================================="
        );


        console.log(
            "🌍 JOGOS POR PAÍS"
        );


        for (
            const [
                pais,
                quantidade
            ]
            of
            porPais
        ) {

            console.log(
                `🌍 ${pais}: ${quantidade} jogo(s)`
            );

        }


        console.log(
            "=========================================="
        );


        // ======================================
        // PRIMEIRO JOGO
        // ======================================

        const primeiro =
            jogos[0];


        if (
            primeiro
        ) {

            console.log(

                `⚽ Exemplo: ` +

                `${primeiro.time_casa} x ` +

                `${primeiro.time_fora}`

            );

        }


        // ======================================
        // RETORNAR
        // ======================================

        return jogos;

    }

    catch (error) {

        console.error(
            "❌ Erro futebolService:",
            error?.message ||
            error
        );


        return [];

    }

}


// ==========================================
// COMPATIBILIDADE
// ==========================================

export async function buscarJogos() {

    return await buscarJogosDia();

}


// ==========================================
// COMPATIBILIDADE ANTIGA
// ==========================================

export async function buscarEventos() {

    return await buscarJogosDia();

}


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    buscarJogosDia,

    buscarJogos,

    buscarEventos

};
