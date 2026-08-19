// ==========================================================
// BETVISION AI
// routes/analises.js
//
// VERSÃO 9.0 CORRIGIDA
//
// ROTAS DE ANÁLISES IA
//
// REGRAS:
//
// - TIMEZONE America/Sao_Paulo
// - ANÁLISES SOMENTE DE HOJE
// - JOGOS NÃO SÃO CRIADOS AQUI
// - RESULTADOS NÃO SÃO FICTÍCIOS
// - API ID vem de jogos
// - JOGO ID vem de jogos
// - Compatível com tabela analises atual
// - Compatível com probabilidades em objeto
// - Compatível com golsEsperados em objeto
// - Remove duplicadas
// - Normaliza datas
//
// ROTAS:
//
// GET  /api/analises
// GET  /api/analises/hoje
// GET  /api/analises/:id
// POST /api/analises
// POST /api/analises/prever
//
// ==========================================================

import express from "express";

import {
    analisarMercado,
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

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {

        return null;
    }


    try {

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


        const texto =
            String(valor).trim();


        if (!texto) {
            return null;
        }


        // YYYY-MM-DD

        const iso =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );


        if (iso) {

            return (
                `${iso[1]}-${iso[2]}-${iso[3]}`
            );
        }


        // DD/MM/YYYY

        const br =
            texto.match(
                /^(\d{2})\/(\d{2})\/(\d{4})/
            );


        if (br) {

            return (
                `${br[3]}-${br[2]}-${br[1]}`
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
// EXTRAIR DATA DA ANÁLISE
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

        analise.jogo?.data_jogo,
        analise.jogo?.dataJogo,
        analise.jogo?.jogo_data,

        analise.jogo?.data,
        analise.jogo?.inicio,
        analise.jogo?.kickoff,

        analise.jogo?.date,
        analise.jogo?.datetime,

        analise.fixture?.date,
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


            return data === hoje;
        }
    );
}


// ==========================================================
// API ID
// ==========================================================

function obterApiId(analise) {

    return (

        analise?.jogo_api_id ??
        analise?.api_id ??
        analise?.apiId ??
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
// TIME CASA
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
// TIME FORA
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
            analise.analise_id ??
            analise.id ??
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
                `${obterCasa(analise)}|` +
                `${obterFora(analise)}`;

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
// DATA PARA ORDENAÇÃO
// ==========================================================

function obterDataOrdenacao(analise) {

    const campos = [

        analise?.data_jogo,
        analise?.jogo_data,
        analise?.data,

        analise?.jogo?.data_jogo,
        analise?.jogo?.data,

        analise?.jogo?.date,
        analise?.date,

        analise?.datetime,
        analise?.jogo?.datetime

    ];


    for (
        const campo of campos
    ) {

        if (!campo) {
            continue;
        }


        const timestamp =
            new Date(campo).getTime();


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


    // ======================================================
    // STRING
    // ======================================================

    if (
        typeof jogo === "string"
    ) {

        const texto =
            jogo.trim();


        if (!texto) {
            return null;
        }


        return texto;
    }


    // ======================================================
    // OBJETO
    // ======================================================

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


        if (nome) {

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

function extrairApiId(
    resultado,
    jogo
) {

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

function extrairJogoId(
    resultado,
    jogo
) {

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
// EXTRAIR NOME DO JOGO
// ==========================================================

function extrairNomeJogo(
    resultado,
    jogo
) {

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
// EXTRAIR DATA PARA BANCO
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
        extrairDataJogo(
            jogo
        );


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
// EXTRAIR CONFIANÇA
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
                valor
                    .replace("%", "")
                    .replace(",", ".")
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
// PREPARAR ANÁLISE PARA BANCO
// ==========================================================

function prepararAnaliseParaBanco(
    resultado,
    jogo
) {

    if (
        !resultado ||
        resultado.sucesso === false
    ) {

        console.log(
            "⚠️ Resultado não possui dados válidos."
        );

        return null;
    }


    const probabilidades =
        resultado.probabilidades ||
        resultado.probability ||
        {};


    const gols =
        resultado.golsEsperados ||
        resultado.gols_esperados ||
        {};


    const valueBets =
        Array.isArray(
            resultado.valueBets
        )
            ? resultado.valueBets
            : (
                Array.isArray(
                    resultado.value_bets
                )
                    ? resultado.value_bets
                    : []
            );


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


    const probabilidadeCasa =
        probabilidades.casa ??
        probabilidades.home ??
        resultado.probabilidade_casa ??
        resultado.probabilidadeCasa ??
        null;


    const probabilidadeEmpate =
        probabilidades.empate ??
        probabilidades.draw ??
        resultado.probabilidade_empate ??
        resultado.probabilidadeEmpate ??
        null;


    const probabilidadeFora =
        probabilidades.fora ??
        probabilidades.away ??
        resultado.probabilidade_fora ??
        resultado.probabilidadeFora ??
        null;


    let golsEsperados = null;


    if (
        gols &&
        typeof gols === "object"
    ) {

        if (
            gols.total !== undefined &&
            gols.total !== null
        ) {

            golsEsperados =
                Number(
                    gols.total
                );

        } else {

            const casa =
                Number(
                    gols.casa ??
                    gols.home ??
                    0
                );


            const fora =
                Number(
                    gols.fora ??
                    gols.away ??
                    0
                );


            if (
                Number.isFinite(casa) &&
                Number.isFinite(fora)
            ) {

                golsEsperados =
                    casa + fora;
            }
        }

    } else {

        const numero =
            Number(gols);


        if (
            Number.isFinite(numero)
        ) {

            golsEsperados =
                numero;
        }
    }


    console.log(
        "=========================================="
    );

    console.log(
        "💾 PREPARANDO ANÁLISE PARA BANCO"
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

    console.log(
        `🏠 Prob. casa: ${probabilidadeCasa ?? "NULL"}`
    );

    console.log(
        `🤝 Prob. empate: ${probabilidadeEmpate ?? "NULL"}`
    );

    console.log(
        `✈️ Prob. fora: ${probabilidadeFora ?? "NULL"}`
    );

    console.log(
        `⚽ Gols esperados: ${golsEsperados ?? "NULL"}`
    );

    console.log(
        "=========================================="
    );


    return {

        api_id:
            apiId,

        jogo_id:
            jogoId,

        jogo:
            nomeJogo,

        data_jogo:
            dataJogo,

        probabilidade_casa:
            probabilidadeCasa,

        probabilidade_empate:
            probabilidadeEmpate,

        probabilidade_fora:
            probabilidadeFora,

        gols_esperados:
            golsEsperados,

        placar_previsto:
            resultado.placarPrevisto ??
            resultado.placar_previsto ??
            null,

        value_bet:
            valueBets,

        confianca:
            extrairConfianca(
                resultado
            ),

        algoritmo:
            resultado.algoritmo ??
            "BetVision AI Motor Estatístico v9.0"

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


            const dados =
                await listarAnalisesHoje();


            console.log(
                `📦 Banco: ${
                    Array.isArray(dados)
                        ? dados.length
                        : 0
                } registros`
            );


            const lista =
                prepararListaAnalises(
                    dados
                );


            console.log(
                `🤖 ${lista.length} análises válidas para hoje`
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

        } catch (erro) {

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


            const dados =
                await listarAnalisesHoje();


            const lista =
                prepararListaAnalises(
                    dados
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

        } catch (erro) {

            console.error(
                "❌ Erro análises hoje:",
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
                        "Erro análises hoje"

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
                        : `${jogo.time_casa} x ${jogo.time_fora}`
                }`
            );


            const resultado =
                await analisarMercado(
                    jogo,
                    dados
                );


            // ==================================================
            // SALVAR
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

                    const salva =
                        await salvarAnalise(
                            paraSalvar
                        );


                    if (salva) {

                        resultado.id =
                            salva.id;

                        resultado.data_jogo =
                            paraSalvar.data_jogo;

                        resultado.api_id =
                            paraSalvar.api_id;

                        resultado.jogo_id =
                            paraSalvar.jogo_id;


                        console.log(
                            `✅ Análise salva/recuperada: ID ${salva.id}`
                        );
                    }
                }

            } catch (erroBanco) {

                console.error(
                    "⚠️ Erro salvando análise:",
                    erroBanco
                );
            }


            return res.json(
                resultado
            );

        } catch (erro) {

            console.error(
                "❌ Erro análise IA:",
                erro
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

        } catch (erro) {

            console.error(
                "❌ Erro previsão IA:",
                erro
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

        } catch (erro) {

            console.error(
                "❌ Erro buscando análise:",
                erro
            );


            return res
                .status(500)
                .json({

                    sucesso:
                        false,

                    erro:
                        erro.message ||
                        "Erro ao buscar análise"

                });
        }
    }
);


// ==========================================================
// EXPORT
// ==========================================================

export default router;
