// ==================================================
// BETVISION AI
// routes/analises.js
//
// ROTAS DE ANÁLISES IA
//
// VERSÃO V8 - CORREÇÃO COMPLETA
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
// - Remove duplicidades
// - Ordena por horário do jogo
// - Reconhece vários formatos de data
// - Reconhece data dentro do objeto jogo
// - Reconhece estruturas aninhadas
// - POST /api/analises mantido
// - POST /api/analises/prever mantido
//
// IMPORTANTE:
//
// O FILTRO DE HOJE É FEITO NOVAMENTE NESTA ROTA,
// MESMO QUE O bancoService JÁ FAÇA O FILTRO.
//
// Isso cria uma segunda camada de proteção.
//
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
// CONFIGURAÇÃO
// ==================================================

const TIMEZONE = "America/Sao_Paulo";


// ==================================================
// FUNÇÃO: OBTER DATA DE HOJE NO BRASIL
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
        ).format(new Date());

    } catch (erro) {

        console.error(
            "❌ Erro obtendo data Brasil:",
            erro.message
        );

        // ------------------------------------------
        // Fallback
        // ------------------------------------------

        return new Date()
            .toLocaleDateString(
                "sv-SE",
                {
                    timeZone: TIMEZONE
                }
            );

    }

}


// ==================================================
// FUNÇÃO: NORMALIZAR DATA
//
// Aceita:
//
// YYYY-MM-DD
// YYYY-MM-DD HH:mm:ss
// YYYY-MM-DDTHH:mm:ss
// ISO completo
// Date
// timestamp
//
// Retorna:
//
// YYYY-MM-DD
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
        // DATE
        // ------------------------------------------

        if (
            valor instanceof Date
        ) {

            if (
                Number.isNaN(
                    valor.getTime()
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
            ).format(valor);

        }


        // ------------------------------------------
        // NÚMERO
        //
        // Pode ser timestamp.
        // ------------------------------------------

        if (
            typeof valor === "number"
        ) {

            const data =
                new Date(valor);

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


        // ------------------------------------------
        // STRING
        // ------------------------------------------

        const texto =
            String(valor)
                .trim();


        if (!texto) {

            return null;

        }


        // ------------------------------------------
        // FORMATO YYYY-MM-DD
        //
        // IMPORTANTE:
        //
        // Não passar diretamente pelo new Date()
        // para evitar deslocamento de dia.
        // ------------------------------------------

        const matchISO =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );


        if (matchISO) {

            const ano =
                Number(matchISO[1]);

            const mes =
                Number(matchISO[2]);

            const dia =
                Number(matchISO[3]);


            // --------------------------------------
            // Validação básica
            // --------------------------------------

            if (
                ano >= 2000 &&
                mes >= 1 &&
                mes <= 12 &&
                dia >= 1 &&
                dia <= 31
            ) {

                return (
                    `${String(ano).padStart(4, "0")}-` +
                    `${String(mes).padStart(2, "0")}-` +
                    `${String(dia).padStart(2, "0")}`
                );

            }

        }


        // ------------------------------------------
        // FORMATO DD/MM/YYYY
        // ------------------------------------------

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


        // ------------------------------------------
        // TENTAR COMO DATA NORMAL
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
// FUNÇÃO: OBTER TODOS OS POSSÍVEIS CAMPOS DE DATA
//
// Aqui está uma das principais correções.
//
// O jogo pode vir como:
//
// analise.data_jogo
// analise.dataJogo
// analise.jogo_data
// analise.data
// analise.inicio
// analise.kickoff
// analise.date
// analise.datetime
// analise.data_hora
// analise.dataHora
//
// ou:
//
// analise.jogo.data_jogo
// analise.jogo.data
// analise.jogo.fixture.date
// analise.jogo.fixture.data
//
// etc.
// ==================================================

function obterValoresDeData(analise) {

    if (!analise) {

        return [];

    }


    const valores = [];


    // ==================================================
    // FUNÇÃO INTERNA
    // ==================================================

    function adicionar(valor) {

        if (
            valor !== null &&
            valor !== undefined &&
            valor !== ""
        ) {

            valores.push(valor);

        }

    }


    // ==================================================
    // NÍVEL PRINCIPAL
    // ==================================================

    adicionar(analise.data_jogo);
    adicionar(analise.dataJogo);
    adicionar(analise.jogo_data);
    adicionar(analise.data);
    adicionar(analise.inicio);
    adicionar(analise.kickoff);
    adicionar(analise.date);
    adicionar(analise.datetime);
    adicionar(analise.data_hora);
    adicionar(analise.dataHora);
    adicionar(analise.horario);
    adicionar(analise.fixture_date);
    adicionar(analise.fixtureDate);
    adicionar(analise.match_date);
    adicionar(analise.matchDate);


    // ==================================================
    // OBJETO JOGO
    // ==================================================

    if (
        analise.jogo &&
        typeof analise.jogo === "object"
    ) {

        const jogo =
            analise.jogo;


        adicionar(jogo.data_jogo);
        adicionar(jogo.dataJogo);
        adicionar(jogo.jogo_data);
        adicionar(jogo.data);
        adicionar(jogo.inicio);
        adicionar(jogo.kickoff);
        adicionar(jogo.date);
        adicionar(jogo.datetime);
        adicionar(jogo.data_hora);
        adicionar(jogo.dataHora);
        adicionar(jogo.horario);
        adicionar(jogo.fixture_date);
        adicionar(jogo.fixtureDate);
        adicionar(jogo.match_date);
        adicionar(jogo.matchDate);


        // ------------------------------------------
        // fixture
        // ------------------------------------------

        if (
            jogo.fixture &&
            typeof jogo.fixture === "object"
        ) {

            adicionar(
                jogo.fixture.date
            );

            adicionar(
                jogo.fixture.data
            );

            adicionar(
                jogo.fixture.datetime
            );

            adicionar(
                jogo.fixture.kickoff
            );

        }


        // ------------------------------------------
        // partida
        // ------------------------------------------

        if (
            jogo.partida &&
            typeof jogo.partida === "object"
        ) {

            adicionar(
                jogo.partida.data
            );

            adicionar(
                jogo.partida.data_jogo
            );

            adicionar(
                jogo.partida.date
            );

            adicionar(
                jogo.partida.kickoff
            );

        }

    }


    // ==================================================
    // OBJETO PARTIDA
    // ==================================================

    if (
        analise.partida &&
        typeof analise.partida === "object"
    ) {

        adicionar(
            analise.partida.data
        );

        adicionar(
            analise.partida.data_jogo
        );

        adicionar(
            analise.partida.dataJogo
        );

        adicionar(
            analise.partida.date
        );

        adicionar(
            analise.partida.kickoff
        );

    }


    // ==================================================
    // OBJETO MATCH
    // ==================================================

    if (
        analise.match &&
        typeof analise.match === "object"
    ) {

        adicionar(
            analise.match.date
        );

        adicionar(
            analise.match.data
        );

        adicionar(
            analise.match.data_jogo
        );

        adicionar(
            analise.match.kickoff
        );

    }


    return valores;

}


// ==================================================
// FUNÇÃO: OBTER DATA DO JOGO
//
// Retorna a primeira data válida encontrada.
// ==================================================

function obterDataDoJogo(analise) {

    const valores =
        obterValoresDeData(
            analise
        );


    for (
        const valor
        of valores
    ) {

        const data =
            normalizarDataBrasil(
                valor
            );


        if (data) {

            return data;

        }

    }


    return null;

}


// ==================================================
// VERIFICAR SE ANÁLISE É DE HOJE
// ==================================================

function analiseEhDeHoje(analise) {

    if (!analise) {

        return false;

    }


    const hoje =
        obterDataHojeBrasil();


    const dataJogo =
        obterDataDoJogo(
            analise
        );


    return (
        dataJogo === hoje
    );

}


// ==================================================
// FILTRAR SOMENTE HOJE
//
// REGRA ABSOLUTA:
//
// data do jogo === data do Brasil
//
// Não usa created_at.
// Não usa updated_at.
// Não usa data da análise.
//
// O QUE IMPORTA É A DATA DA PARTIDA.
// ==================================================

function filtrarSomenteHoje(lista) {

    if (
        !Array.isArray(lista)
    ) {

        return [];

    }


    const hoje =
        obterDataHojeBrasil();


    const resultado = [];


    for (
        const analise
        of lista
    ) {

        if (!analise) {

            continue;

        }


        const dataJogo =
            obterDataDoJogo(
                analise
            );


        // ------------------------------------------
        // SEM DATA = NÃO EXIBIR
        // ------------------------------------------

        if (!dataJogo) {

            console.warn(
                "⚠️ Análise ignorada: jogo sem data identificável",
                {
                    id:
                        analise.id ??
                        analise.analise_id ??
                        null,

                    api_id:
                        analise.api_id ??
                        analise.apiId ??
                        analise.jogo_api_id ??
                        null
                }
            );

            continue;

        }


        // ------------------------------------------
        // SOMENTE HOJE
        // ------------------------------------------

        if (
            dataJogo !== hoje
        ) {

            continue;

        }


        resultado.push(
            analise
        );

    }


    return resultado;

}


// ==================================================
// ORDENAR ANÁLISES
//
// Ordena pelo horário/data da partida.
// ==================================================

function ordenarAnalises(lista) {

    if (
        !Array.isArray(lista)
    ) {

        return [];

    }


    return [
        ...lista
    ].sort(
        (
            a,
            b
        ) => {

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


    const valores =
        obterValoresDeData(
            analise
        );


    for (
        const valor
        of valores
    ) {

        if (
            valor instanceof Date
        ) {

            const timestamp =
                valor.getTime();


            if (
                !Number.isNaN(
                    timestamp
                )
            ) {

                return timestamp;

            }

            continue;

        }


        const texto =
            String(valor)
                .trim();


        if (!texto) {

            continue;

        }


        // ------------------------------------------
        // Se for apenas YYYY-MM-DD,
        // não existe horário.
        // ------------------------------------------

        if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                texto
            )
        ) {

            const partes =
                texto.split("-");


            const data =
                new Date(
                    Number(partes[0]),
                    Number(partes[1]) - 1,
                    Number(partes[2]),
                    0,
                    0,
                    0
                );


            const timestamp =
                data.getTime();


            if (
                !Number.isNaN(
                    timestamp
                )
            ) {

                return timestamp;

            }

        }


        const timestamp =
            new Date(
                texto
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
// Prioridade:
//
// 1. api_id
// 2. id
// 3. nome + data
// ==================================================

function removerDuplicadas(lista) {

    if (
        !Array.isArray(lista)
    ) {

        return [];

    }


    const mapa =
        new Map();


    for (
        const analise
        of lista
    ) {

        if (!analise) {

            continue;

        }


        const apiId =
            analise.api_id ??
            analise.apiId ??
            analise.jogo_api_id ??
            analise.jogo?.api_id ??
            analise.jogo?.apiId ??
            analise.partida?.api_id ??
            analise.partida?.apiId;


        const id =
            analise.id ??
            analise.analise_id;


        const casa =
            analise.casa ??
            analise.time_casa ??
            analise.home_team ??
            analise.homeTeam ??
            analise.jogo?.casa ??
            analise.jogo?.home_team ??
            analise.jogo?.homeTeam ??
            analise.partida?.casa ??
            "";


        const fora =
            analise.fora ??
            analise.time_fora ??
            analise.away_team ??
            analise.awayTeam ??
            analise.jogo?.fora ??
            analise.jogo?.away_team ??
            analise.jogo?.awayTeam ??
            analise.partida?.fora ??
            "";


        const data =
            obterDataDoJogo(
                analise
            ) || "";


        let chave;


        if (
            apiId !== null &&
            apiId !== undefined &&
            String(apiId).trim() !== ""
        ) {

            chave =
                `api:${String(apiId).trim()}`;

        }

        else if (
            id !== null &&
            id !== undefined
        ) {

            chave =
                `id:${String(id)}`;

        }

        else {

            chave =
                [
                    String(casa)
                        .trim()
                        .toLowerCase(),

                    String(fora)
                        .trim()
                        .toLowerCase(),

                    data
                ].join("|");

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
// PREPARAR LISTA FINAL
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


    const hoje =
        obterDataHojeBrasil();


    console.log(
        `📦 Registros recebidos do banco: ${lista.length}`
    );


    const somenteHoje =
        filtrarSomenteHoje(
            lista
        );


    console.log(
        `📅 Registros de hoje após filtro: ${somenteHoje.length}`
    );


    const semDuplicadas =
        removerDuplicadas(
            somenteHoje
        );


    console.log(
        `♻️ Após remover duplicadas: ${semDuplicadas.length}`
    );


    const ordenada =
        ordenarAnalises(
            semDuplicadas
        );


    console.log(
        `✅ Lista final de análises: ${ordenada.length}`
    );


    return ordenada;

}


// ==================================================
// FUNÇÃO AUXILIAR:
// LOGAR ANÁLISES
// ==================================================

function logarAnalises(lista) {

    if (
        !Array.isArray(lista) ||
        lista.length === 0
    ) {

        return;

    }


    for (
        const analise
        of lista
    ) {

        const apiId =
            analise.api_id ??
            analise.apiId ??
            analise.jogo_api_id ??
            analise.jogo?.api_id ??
            analise.jogo?.apiId ??
            "N/A";


        const casa =
            analise.casa ??
            analise.time_casa ??
            analise.home_team ??
            analise.homeTeam ??
            analise.jogo?.casa ??
            analise.jogo?.home_team ??
            analise.jogo?.homeTeam ??
            "Casa";


        const fora =
            analise.fora ??
            analise.time_fora ??
            analise.away_team ??
            analise.awayTeam ??
            analise.jogo?.fora ??
            analise.jogo?.away_team ??
            analise.jogo?.awayTeam ??
            "Fora";


        const data =
            obterDataDoJogo(
                analise
            ) || "SEM DATA";


        console.log(
            `⚽ ${casa} x ${fora} | ` +
            `📅 ${data} | ` +
            `API: ${apiId}`
        );

    }

}


// ==================================================
// GET /api/analises
//
// SOMENTE JOGOS DE HOJE
//
// Este é o endpoint principal do dashboard.
// ==================================================

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
                "🤖 BETVISION AI - ANÁLISES"
            );

            console.log(
                `📅 Data Brasil: ${hoje}`
            );

            console.log(
                `🌎 Timezone: ${TIMEZONE}`
            );

            console.log(
                "🎯 Filtro: SOMENTE JOGOS DE HOJE"
            );


            // --------------------------------------
            // BUSCAR DO BANCO
            // --------------------------------------

            const dados =
                await listarAnalisesHoje();


            // --------------------------------------
            // FILTRO FINAL
            // --------------------------------------

            const lista =
                prepararListaAnalises(
                    dados
                );


            console.log(
                `🤖 Análises exibidas hoje: ${lista.length}`
            );


            logarAnalises(
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
// SOMENTE JOGOS DE HOJE
// ==================================================

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
                "=========================================="
            );

            console.log(
                "📅 BUSCANDO ANÁLISES DE HOJE"
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


            logarAnalises(
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


            // --------------------------------------
            // VALIDAÇÃO
            // --------------------------------------

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
// ANÁLISE DIRETA
// ==================================================

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


            // --------------------------------------
            // VALIDAÇÃO
            // --------------------------------------

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
// BUSCAR UMA ANÁLISE ESPECÍFICA
//
// IMPORTANTE:
//
// Esta consulta é INDIVIDUAL.
//
// Portanto, não aplica o filtro "somente hoje"
// da listagem principal.
//
// A listagem do dashboard continua somente hoje.
// ==================================================

router.get(
    "/:id",
    async (
        req,
        res
    ) => {

        try {

            const idTexto =
                String(
                    req.params.id ?? ""
                ).trim();


            // --------------------------------------
            // SOMENTE ID NUMÉRICO
            // --------------------------------------

            if (
                !/^\d+$/.test(
                    idTexto
                )
            ) {

                return res.status(400)
                    .json({

                        sucesso: false,

                        erro:
                            "ID da análise inválido"

                    });

            }


            const id =
                Number(
                    idTexto
                );


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


            // --------------------------------------
            // IMPORTANTE
            //
            // Como o bancoService atual disponibiliza
            // listarAnalisesHoje(), usamos essa fonte
            // para localizar o registro.
            //
            // Se futuramente existir buscarAnalisePorId()
            // no bancoService, ela poderá substituir
            // esta consulta sem alterar o restante
            // da rota.
            // --------------------------------------

            const dados =
                await listarAnalisesHoje();


            const lista =
                Array.isArray(dados)
                    ? dados
                    : [];


            const analise =
                lista.find(
                    item => {

                        if (!item) {

                            return false;

                        }


                        return (
                            Number(
                                item.id
                            ) === id
                            ||
                            Number(
                                item.analise_id
                            ) === id
                        );

                    }
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
