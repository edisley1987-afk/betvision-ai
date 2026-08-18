// ==========================================
// BETVISION AI
// routes/jogos.js
//
// VERSÃO 18.0
// API DE JOGOS
// PostgreSQL / NeonDB
//
// REGRAS:
//
// /api/jogos
//     SOMENTE JOGOS DE HOJE
//
// /api/jogos/hoje
//     SOMENTE JOGOS DE HOJE
//
// /api/jogos/banco
//     TODO O HISTÓRICO
//
// /api/jogos/proximos
//     RESTANTE DE HOJE + AMANHÃ
//
// /api/jogos/estatisticas
//     CONTADORES DO BANCO
//
// HISTÓRICO:
//
// - Nunca apagar automaticamente
// - IA continua usando histórico real
//
// IDENTIFICAÇÃO:
//
// - api_id = identificador externo principal
// - Não depende de jogo_id para análise
//
// DATA:
//
// - America/Sao_Paulo
// - Jogos antigos permanecem no banco
// - Dashboard principal não mostra jogos antigos
//
// ==========================================
//
// CORREÇÕES V18:
//
// - CORRIGIDO bug crítico: analisarJogo() calculava a
//   análise (Poisson, 1X2, value bet, confiança) e
//   simplesmente RETORNAVA o resultado sem nunca
//   gravá-lo na tabela `analises`. Por isso o dashboard
//   sempre mostrava "0 análises", mesmo com o log
//   confirmando "🤖 Análises: 4/4" a cada acesso.
//
// - ADICIONADA persistência: após gerarAnaliseIA()
//   retornar com sucesso, o resultado agora é formatado
//   com prepararAnaliseParaBanco() e gravado através de
//   salvarAnalise() (services/bancoService.js) — a MESMA
//   função já usada por routes/analises.js, garantindo
//   que os dois fluxos gravem exatamente na mesma tabela
//   e no mesmo formato.
//
// - A extração de campos (prepararAnaliseParaBanco e
//   funções auxiliares) foi replicada aqui a partir de
//   routes/analises.js. Idealmente deveria ser movida
//   para um módulo compartilhado (ex.:
//   services/analiseFormatador.js) para eliminar a
//   duplicação — sinalizado como próximo passo.
//
// - Erros ao salvar são logados mas NUNCA interrompem a
//   resposta ao usuário: a rota continua respondendo
//   normalmente mesmo se o salvamento falhar, para não
//   piorar a disponibilidade do endpoint.
//
// ==========================================

import express from "express";

import jogoBancoService
    from "../services/jogoBancoService.js";

import {
    buscarJogosDia
} from "../services/futebolService.js";

import {
    gerarAnaliseIA
} from "../services/inteligenciaService.js";

import {
    buscarHistoricoJogo
} from "../services/historicoService.js";

import {
    salvarAnalise
} from "../services/bancoService.js";


const router =
    express.Router();


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const TIMEZONE =
    "America/Sao_Paulo";


// ==========================================
// DATA HOJE BRASIL
// ==========================================

function obterDataHojeBrasil() {

    try {

        const agora =
            new Date();

        return new Intl.DateTimeFormat(
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
        ).format(
            agora
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro data Brasil:",
            erro.message
        );

        return null;

    }

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
        )
        ||
        numero <= 0
    ) {

        return null;

    }

    return numero;

}


// ==========================================
// NORMALIZAR JOGO
// ==========================================

function normalizarJogo(
    jogo
) {

    if (!jogo) {

        return null;

    }


    const apiId =
        normalizarApiId(

            jogo.api_id ??
            jogo.apiId ??
            jogo.fixture?.id ??
            jogo.id

        );


    const campeonato =

        jogo.campeonato ??
        jogo.competicao ??
        jogo.competition?.name ??
        jogo.league?.name ??
        jogo.fixture?.league?.name ??
        "Futebol";


    const timeCasa =

        jogo.time_casa ??
        jogo.timeCasa ??
        jogo.casa ??
        jogo.homeTeam?.name ??
        jogo.home_team?.name ??
        jogo.teams?.home?.name ??
        jogo.fixture?.teams?.home?.name ??
        null;


    const timeFora =

        jogo.time_fora ??
        jogo.timeFora ??
        jogo.fora ??
        jogo.awayTeam?.name ??
        jogo.away_team?.name ??
        jogo.teams?.away?.name ??
        jogo.fixture?.teams?.away?.name ??
        null;


    const dataJogo =

        jogo.data_jogo ??
        jogo.dataJogo ??
        jogo.utcDate ??
        jogo.horario ??
        jogo.data ??
        jogo.fixture?.date ??
        null;


    let status =
        jogo.status;


    if (
        typeof status === "object"
        &&
        status !== null
    ) {

        status =

            status.short ??
            status.type ??
            status.name ??
            "SCHEDULED";

    }


    if (!status) {

        status =
            "SCHEDULED";

    }


    return {

        ...jogo,

        api_id:
            apiId,

        campeonato:
            campeonato
                ? String(
                    campeonato
                ).trim()
                : "Futebol",

        time_casa:
            timeCasa
                ? String(
                    timeCasa
                ).trim()
                : null,

        time_fora:
            timeFora
                ? String(
                    timeFora
                ).trim()
                : null,

        data_jogo:
            dataJogo,

        status:
            String(
                status
            ).trim()

    };

}


// ==========================================
// VALIDAR JOGO
// ==========================================

function jogoValido(
    jogo
) {

    if (!jogo) {

        return false;

    }


    const apiId =
        normalizarApiId(
            jogo.api_id
        );


    if (!apiId) {

        return false;

    }


    const casa =
        String(
            jogo.time_casa ??
            ""
        )
        .trim();


    const fora =
        String(
            jogo.time_fora ??
            ""
        )
        .trim();


    if (
        !casa ||
        !fora
    ) {

        return false;

    }


    if (
        casa.toLowerCase() ===
        fora.toLowerCase()
    ) {

        return false;

    }


    const nomesInvalidos = [

        "casa",
        "fora",
        "home",
        "away",
        "home team",
        "away team",
        "time a",
        "time b"

    ];


    if (

        nomesInvalidos.includes(
            casa.toLowerCase()
        )

        ||

        nomesInvalidos.includes(
            fora.toLowerCase()
        )

    ) {

        return false;

    }


    if (
        !jogo.data_jogo
    ) {

        return false;

    }


    const data =
        new Date(
            jogo.data_jogo
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return false;

    }


    return true;

}


// ==========================================
// JOGO É DE HOJE?
//
// A comparação é feita usando
// America/Sao_Paulo.
//
// Isso evita que um jogo UTC
// seja classificado no dia errado.
// ==========================================

function jogoEhHoje(
    jogo
) {

    if (
        !jogo?.data_jogo
    ) {

        return false;

    }


    const hoje =
        obterDataHojeBrasil();


    if (!hoje) {

        return false;

    }


    try {

        const data =
            new Date(
                jogo.data_jogo
            );


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return false;

        }


        const dataLocal =
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
            ).format(
                data
            );


        return (
            dataLocal ===
            hoje
        );

    }

    catch (erro) {

        console.error(

            "⚠️ Erro verificar data jogo:",
            erro.message

        );

        return false;

    }

}


// ==========================================
// REMOVER DUPLICADOS
//
// api_id é a chave externa.
// ==========================================

function removerDuplicados(
    jogos = []
) {

    if (
        !Array.isArray(
            jogos
        )
    ) {

        return [];

    }


    const mapa =
        new Map();


    for (
        const jogo of jogos
    ) {

        const apiId =
            normalizarApiId(
                jogo?.api_id
            );


        if (!apiId) {

            continue;

        }


        if (
            !mapa.has(
                apiId
            )
        ) {

            mapa.set(
                apiId,
                jogo
            );

        }

    }


    return Array.from(
        mapa.values()
    );

}


// ==========================================
// FORMATAR JOGO PARA API
// ==========================================

function formatarJogo(
    jogo
) {

    if (!jogo) {

        return null;

    }


    const apiId =
        normalizarApiId(
            jogo.api_id ??
            jogo.apiId ??
            jogo.id
        );


    return {

        id:
            jogo.id ??
            null,

        api_id:
            apiId,

        campeonato:
            jogo.campeonato ??
            "Futebol",

        time_casa:
            jogo.time_casa ??
            null,

        time_fora:
            jogo.time_fora ??
            null,

        casa:
            jogo.time_casa ??
            null,

        fora:
            jogo.time_fora ??
            null,

        data_jogo:
            jogo.data_jogo ??
            null,

        horario:
            jogo.data_jogo ??
            null,

        estadio:
            jogo.estadio ??
            null,

        status:
            jogo.status ??
            "SCHEDULED"

    };

}


// ==========================================
// OBTER HORÁRIO BRASIL
// ==========================================

function obterHorarioBrasil(
    dataJogo
) {

    if (!dataJogo) {

        return "N/A";

    }


    try {

        const data =
            new Date(
                dataJogo
            );


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return "N/A";

        }


        return new Intl.DateTimeFormat(
            "pt-BR",
            {
                timeZone:
                    TIMEZONE,

                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        ).format(
            data
        );

    }

    catch {

        return "N/A";

    }

}


// ==========================================
// OBTER NÚMERO SEGURO
// ==========================================

function numeroSeguro(
    valor,
    padrao = 0
) {

    const numero =
        Number(
            valor
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : padrao;

}


// ==========================================
// OBTER GOLS
// ==========================================

function obterGols(
    jogo
) {

    const golsCasa =
        numeroSeguro(

            jogo.gols_casa ??
            jogo.golsCasa ??
            jogo.placar?.casa ??
            jogo.score?.fullTime?.home ??
            jogo.score?.fulltime?.home ??
            0

        );


    const golsFora =
        numeroSeguro(

            jogo.gols_fora ??
            jogo.golsFora ??
            jogo.placar?.fora ??
            jogo.score?.fullTime?.away ??
            jogo.score?.fulltime?.away ??
            0

        );


    return {

        casa:
            golsCasa,

        fora:
            golsFora

    };

}


// ==========================================
// ESTATÍSTICAS DO TIME
// ==========================================

function calcularEstatisticasTime(
    jogos = [],
    nomeTime
) {

    const padrao = {

        jogos: 0,

        vitorias: 0,

        empates: 0,

        derrotas: 0,

        pontos: 0,

        forma: 50,

        golsMarcados: 0,

        golsSofridos: 0,

        mediaGolsMarcados: 1,

        mediaGolsSofridos: 1,

        ataque: 50,

        defesa: 50

    };


    if (

        !Array.isArray(
            jogos
        )

        ||

        jogos.length === 0

        ||

        !nomeTime

    ) {

        return padrao;

    }


    const nome =
        String(
            nomeTime
        )
        .trim()
        .toLowerCase();


    let vitorias = 0;

    let empates = 0;

    let derrotas = 0;

    let pontos = 0;

    let golsMarcados = 0;

    let golsSofridos = 0;

    let processados = 0;


    for (
        const jogo of jogos
    ) {

        const casa =
            String(
                jogo?.time_casa ??
                jogo?.casa ??
                ""
            )
            .trim();


        const fora =
            String(
                jogo?.time_fora ??
                jogo?.fora ??
                ""
            )
            .trim();


        const casaNormalizada =
            casa.toLowerCase();


        const foraNormalizada =
            fora.toLowerCase();


        if (

            casaNormalizada !== nome

            &&

            foraNormalizada !== nome

        ) {

            continue;

        }


        const gols =
            obterGols(
                jogo
            );


        const emCasa =
            casaNormalizada === nome;


        const golsTime =
            emCasa
                ? gols.casa
                : gols.fora;


        const golsAdversario =
            emCasa
                ? gols.fora
                : gols.casa;


        golsMarcados +=
            golsTime;


        golsSofridos +=
            golsAdversario;


        processados++;


        if (
            golsTime >
            golsAdversario
        ) {

            vitorias++;

            pontos += 3;

        }

        else if (
            golsTime ===
            golsAdversario
        ) {

            empates++;

            pontos++;

        }

        else {

            derrotas++;

        }

    }


    if (
        processados === 0
    ) {

        return padrao;

    }


    const forma =
        (
            pontos /
            (
                processados *
                3
            )
        ) *
        100;


    const mediaGolsMarcados =
        golsMarcados /
        processados;


    const mediaGolsSofridos =
        golsSofridos /
        processados;


    const ataque =
        Math.max(
            0,
            Math.min(
                100,
                mediaGolsMarcados *
                33.33
            )
        );


    const defesa =
        Math.max(
            0,
            Math.min(
                100,
                100 -
                (
                    mediaGolsSofridos *
                    33.33
                )
            )
        );


    return {

        jogos:
            processados,

        vitorias,

        empates,

        derrotas,

        pontos,

        forma:
            Number(
                forma.toFixed(2)
            ),

        golsMarcados,

        golsSofridos,

        mediaGolsMarcados:
            Number(
                mediaGolsMarcados.toFixed(2)
            ),

        mediaGolsSofridos:
            Number(
                mediaGolsSofridos.toFixed(2)
            ),

        ataque:
            Number(
                ataque.toFixed(2)
            ),

        defesa:
            Number(
                defesa.toFixed(2)
            )

    };

}


// ==========================================
// H2H
// ==========================================

function calcularConfrontoDireto(
    jogos = [],
    timeCasa,
    timeFora
) {

    const resultado = {

        jogos: 0,

        vitoriasCasa: 0,

        empates: 0,

        vitoriasFora: 0,

        golsCasa: 0,

        golsFora: 0

    };


    if (

        !Array.isArray(
            jogos
        )

        ||

        !timeCasa

        ||

        !timeFora

    ) {

        return resultado;

    }


    const casaNome =
        String(
            timeCasa
        )
        .trim()
        .toLowerCase();


    const foraNome =
        String(
            timeFora
        )
        .trim()
        .toLowerCase();


    for (
        const jogo of jogos
    ) {

        const casa =
            String(
                jogo?.time_casa ??
                jogo?.casa ??
                ""
            )
            .trim()
            .toLowerCase();


        const fora =
            String(
                jogo?.time_fora ??
                jogo?.fora ??
                ""
            )
            .trim()
            .toLowerCase();


        const normal =
            casa === casaNome &&
            fora === foraNome;


        const invertido =
            casa === foraNome &&
            fora === casaNome;


        if (
            !normal &&
            !invertido
        ) {

            continue;

        }


        const gols =
            obterGols(
                jogo
            );


        resultado.jogos++;


        if (normal) {

            resultado.golsCasa +=
                gols.casa;

            resultado.golsFora +=
                gols.fora;


            if (
                gols.casa >
                gols.fora
            ) {

                resultado.vitoriasCasa++;

            }

            else if (
                gols.casa ===
                gols.fora
            ) {

                resultado.empates++;

            }

            else {

                resultado.vitoriasFora++;

            }

        }

        else {

            resultado.golsCasa +=
                gols.fora;

            resultado.golsFora +=
                gols.casa;


            if (
                gols.fora >
                gols.casa
            ) {

                resultado.vitoriasCasa++;

            }

            else if (
                gols.fora ===
                gols.casa
            ) {

                resultado.empates++;

            }

            else {

                resultado.vitoriasFora++;

            }

        }

    }


    return resultado;

}


// ==========================================
// GERAR DADOS ESTATÍSTICOS
// ==========================================

async function gerarDadosEstatisticos(
    jogo
) {

    const timeCasa =
        jogo.time_casa;


    const timeFora =
        jogo.time_fora;


    console.log(
        `📊 Buscando histórico: ${timeCasa} x ${timeFora}`
    );


    let historico = {

        historicoCasa: [],

        historicoFora: []

    };


    try {

        historico =
            await buscarHistoricoJogo(
                timeCasa,
                timeFora
            );

    }

    catch (erro) {

        console.error(

            "⚠️ Erro buscando histórico:",
            erro.message

        );

    }


    const historicoCasa =

        Array.isArray(
            historico?.historicoCasa
        )

            ? historico.historicoCasa

            : [];


    const historicoFora =

        Array.isArray(
            historico?.historicoFora
        )

            ? historico.historicoFora

            : [];


    const estatisticasCasa =
        calcularEstatisticasTime(
            historicoCasa,
            timeCasa
        );


    const estatisticasFora =
        calcularEstatisticasTime(
            historicoFora,
            timeFora
        );


    const confrontos = [

        ...historicoCasa,

        ...historicoFora

    ];


    const h2h =
        calcularConfrontoDireto(
            confrontos,
            timeCasa,
            timeFora
        );


    console.log(

        `📊 ${timeCasa}: ` +
        `${estatisticasCasa.jogos} jogos | ` +
        `forma ${estatisticasCasa.forma}% | ` +
        `gols ${estatisticasCasa.mediaGolsMarcados}`

    );


    console.log(

        `📊 ${timeFora}: ` +
        `${estatisticasFora.jogos} jogos | ` +
        `forma ${estatisticasFora.forma}% | ` +
        `gols ${estatisticasFora.mediaGolsMarcados}`

    );


    console.log(

        `⚔️ H2H: ${h2h.jogos} confrontos | ` +
        `Casa ${h2h.vitoriasCasa} vitórias | ` +
        `Empates ${h2h.empates} | ` +
        `Fora ${h2h.vitoriasFora}`

    );


    return {

        ataqueCasa:
            estatisticasCasa.ataque,

        defesaCasa:
            estatisticasCasa.defesa,

        formaCasa:
            estatisticasCasa.forma,

        mediaGolsCasa:
            estatisticasCasa.mediaGolsMarcados,


        ataqueFora:
            estatisticasFora.ataque,

        defesaFora:
            estatisticasFora.defesa,

        formaFora:
            estatisticasFora.forma,

        mediaGolsFora:
            estatisticasFora.mediaGolsMarcados,


        historicoCasa,

        historicoFora,


        confrontoDireto:
            h2h,

        h2hJogos:
            h2h.jogos,

        h2hVitoriasCasa:
            h2h.vitoriasCasa,

        h2hEmpates:
            h2h.empates,

        h2hVitoriasFora:
            h2h.vitoriasFora,


        possuiHistorico:

            (
                estatisticasCasa.jogos > 0
                ||
                estatisticasFora.jogos > 0
            ),

        possuiH2H:
            h2h.jogos > 0

    };

}


// ==========================================
// PREPARAR ANÁLISE PARA BANCO
//
// NOVO (V18):
//
// Replicado de routes/analises.js para que a análise
// gerada aqui (dentro de /api/jogos) possa ser salva
// na tabela `analises` usando exatamente o mesmo
// formato usado pela rota POST /api/analises.
//
// TODO: mover para um módulo compartilhado
// (ex.: services/analiseFormatador.js) e importar
// dos dois lugares, eliminando esta duplicação.
// ==========================================

function normalizarDataBrasilAnalise(
    valor
) {

    if (!valor) {

        return null;

    }


    try {

        if (
            valor instanceof Date &&
            !Number.isNaN(
                valor.getTime()
            )
        ) {

            return new Intl.DateTimeFormat(
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
            ).format(
                valor
            );

        }


        const texto =
            String(
                valor
            ).trim();


        if (!texto) {

            return null;

        }


        const match =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (match) {

            return (
                `${match[1]}-${match[2]}-${match[3]}`
            );

        }


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


        const data =
            new Date(
                texto
            );

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
                timeZone:
                    TIMEZONE,

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
            }
        ).format(
            data
        );

    }

    catch (erro) {

        console.error(

            "⚠️ Erro normalizando data (análise):",
            erro.message

        );

        return null;

    }

}


function extrairApiIdAnalise(
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


function extrairJogoIdAnalise(
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
        null

    );

}


function extrairNomeJogoAnalise(
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


    const casa =
        jogo?.time_casa ??
        jogo?.casa ??
        "";


    const fora =
        jogo?.time_fora ??
        jogo?.fora ??
        "";


    return (
        `${casa} x ${fora}`
    ).trim();

}


function extrairDataJogoParaBancoAnalise(
    resultado,
    jogo
) {

    const camposResultado = [

        resultado?.jogo?.data_jogo,
        resultado?.jogo?.dataJogo,
        resultado?.jogo?.date

    ];


    for (
        const campo of camposResultado
    ) {

        const data =
            normalizarDataBrasilAnalise(
                campo
            );

        if (data) {

            return data;

        }

    }


    const camposJogo = [

        jogo?.data_jogo,
        jogo?.dataJogo,
        jogo?.jogo_data,

        jogo?.data,
        jogo?.inicio,
        jogo?.kickoff,

        jogo?.date,
        jogo?.datetime,

        jogo?.fixture?.date

    ];


    for (
        const campo of camposJogo
    ) {

        const data =
            normalizarDataBrasilAnalise(
                campo
            );

        if (data) {

            return data;

        }

    }


    return null;

}


function extrairConfiancaAnalise(
    resultado
) {

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
                    .replace(
                        "%",
                        ""
                    )
                    .replace(
                        ",",
                        "."
                    )

            );


        if (
            Number.isFinite(
                numero
            )
        ) {

            return numero;

        }

    }


    return null;

}


function prepararAnaliseParaBanco(
    resultado,
    jogo
) {

    if (
        !resultado ||
        !resultado.sucesso
    ) {

        console.log(

            "⚠️ Resultado da análise não possui sucesso. " +
            "Não será salvo."

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
        extrairApiIdAnalise(
            resultado,
            jogo
        );


    const jogoId =
        extrairJogoIdAnalise(
            resultado,
            jogo
        );


    const dataJogo =
        extrairDataJogoParaBancoAnalise(
            resultado,
            jogo
        );


    const nomeJogo =
        extrairNomeJogoAnalise(
            resultado,
            jogo
        );


    if (!dataJogo) {

        console.warn(

            "⚠️ ATENÇÃO: análise sem data_jogo " +
            `(${nomeJogo}).`

        );

    }


    return {

        api_id:
            apiId,

        jogo_id:
            jogoId,

        jogo:
            nomeJogo,

        data_jogo:
            dataJogo,

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

        placar_previsto:
            resultado.placarPrevisto ??
            null,

        value_bet:
            valueBets,

        confianca:
            extrairConfiancaAnalise(
                resultado
            ),

        algoritmo:
            resultado.algoritmo ??
            "BetVision AI Motor Estatístico"

    };

}


// ==========================================
// SALVAR ANÁLISE (COM PROTEÇÃO)
//
// Nunca lança erro para cima — falha ao salvar
// não deve derrubar a geração/resposta da análise.
// ==========================================

async function salvarAnaliseComProtecao(
    resultado,
    jogo,
    nomeJogo
) {

    try {

        const paraSalvar =
            prepararAnaliseParaBanco(
                resultado,
                jogo
            );


        if (
            !paraSalvar
        ) {

            return;

        }


        const salva =
            await salvarAnalise(
                paraSalvar
            );


        if (
            salva
        ) {

            console.log(

                `💾 Análise salva: ` +
                `${nomeJogo} (ID ${salva.id})`

            );

        }

    }

    catch (erro) {

        console.error(

            `⚠️ Erro salvando análise ${nomeJogo}:`,
            erro.message

        );

    }

}


// ==========================================
// ANALISAR JOGO
// ==========================================

async function analisarJogo(
    jogo
) {

    if (
        !jogoValido(
            jogo
        )
    ) {

        console.log(
            "⚠️ Jogo inválido ignorado"
        );

        return null;

    }


    const jogoNormalizado =
        normalizarJogo(
            jogo
        );


    if (
        !jogoNormalizado
    ) {

        return null;

    }


    const nomeJogo =

        `${jogoNormalizado.time_casa} x ` +
        `${jogoNormalizado.time_fora}`;


    console.log(
        `🤖 Preparando análise inteligente: ${nomeJogo}`
    );


    try {

        const dados =
            await gerarDadosEstatisticos(
                jogoNormalizado
            );


        const resultado =
            await gerarAnaliseIA(
                jogoNormalizado,
                dados
            );


        // ==================================================
        // SALVAR NO BANCO
        //
        // Só tenta salvar se a análise foi gerada com
        // sucesso. Falha ao salvar não afeta o retorno.
        // ==================================================

        if (
            resultado?.sucesso
        ) {

            await salvarAnaliseComProtecao(
                resultado,
                jogoNormalizado,
                nomeJogo
            );

        }


        return resultado;

    }

    catch (erro) {

        console.error(

            `❌ Erro análise ${nomeJogo}:`,
            erro.message

        );

        return null;

    }

}


// ==========================================
// GET /api/jogos
//
// REGRA:
//
// SOMENTE JOGOS DE HOJE.
//
// A API externa pode retornar vários dias.
// O filtro local é obrigatório.
// ==========================================

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
                "⚽ BETVISION AI - API JOGOS"
            );

            console.log(
                `📅 SOMENTE HOJE: ${hoje}`
            );

            console.log(
                `🌎 Fuso: ${TIMEZONE}`
            );

            console.log(
                "=========================================="
            );


            // ======================================
            // BUSCAR API EXTERNA
            // ======================================

            let jogosAPI = [];


            try {

                jogosAPI =
                    await buscarJogosDia();

            }

            catch (erro) {

                console.error(

                    "❌ Erro API futebol:",
                    erro.message

                );

                jogosAPI = [];

            }


            if (
                !Array.isArray(
                    jogosAPI
                )
            ) {

                jogosAPI = [];

            }


            console.log(

                `📡 API externa retornou ` +
                `${jogosAPI.length} registros`

            );


            // ======================================
            // NORMALIZAR
            // ======================================

            const normalizados =

                jogosAPI

                    .map(
                        normalizarJogo
                    )

                    .filter(
                        jogo =>
                            jogoValido(
                                jogo
                            )
                    );


            // ======================================
            // FILTRAR HOJE
            // ======================================

            const jogosHoje =

                normalizados

                    .filter(
                        jogo =>
                            jogoEhHoje(
                                jogo
                            )
                    );


            // ======================================
            // REMOVER DUPLICADOS
            // ======================================

            const jogosValidos =
                removerDuplicados(
                    jogosHoje
                );


            console.log(

                `⚽ ${jogosValidos.length} ` +
                `jogos válidos para ${hoje}`

            );


            // ======================================
            // MOSTRAR LOG DOS JOGOS
            // ======================================

            jogosValidos.forEach(

                (
                    jogo,
                    indice
                ) => {

                    console.log(

                        `⚽ ${indice + 1}. ` +
                        `${jogo.time_casa} x ` +
                        `${jogo.time_fora} | ` +
                        `${jogo.campeonato} | ` +
                        `${obterHorarioBrasil(jogo.data_jogo)} | ` +
                        `API ${jogo.api_id}`

                    );

                }

            );


            // ======================================
            // SALVAR NO BANCO
            // ======================================

            let jogosSalvos = [];


            if (
                jogosValidos.length > 0
            ) {

                try {

                    jogosSalvos =

                        await jogoBancoService
                            .salvarListaJogos(
                                jogosValidos
                            );


                    if (
                        !Array.isArray(
                            jogosSalvos
                        )
                    ) {

                        jogosSalvos = [];

                    }


                    console.log(

                        `💾 ${jogosSalvos.length} ` +
                        `jogos salvos/atualizados no PostgreSQL`

                    );

                }

                catch (erro) {

                    console.error(

                        "❌ Erro salvar jogos:",
                        erro.message

                    );

                }

            }


            // ======================================
            // GERAR ANÁLISES
            //
            // SOMENTE OS JOGOS DE HOJE.
            //
            // Histórico usado somente como
            // fonte estatística.
            //
            // A partir da V18, cada análise gerada
            // com sucesso é também PERSISTIDA na
            // tabela `analises` (ver analisarJogo()).
            // ======================================

            let analisesProcessadas = 0;

            let errosAnalise = 0;


            for (
                const jogo of jogosValidos
            ) {

                try {

                    const resultado =
                        await analisarJogo(
                            jogo
                        );


                    if (
                        resultado
                    ) {

                        analisesProcessadas++;

                    }

                }

                catch (erro) {

                    errosAnalise++;


                    console.error(

                        `❌ Erro processamento análise:`,
                        erro.message

                    );

                }

            }


            console.log(

                `🤖 Análises: ` +
                `${analisesProcessadas}/${jogosValidos.length}`

            );


            // ======================================
            // BUSCAR NOVAMENTE DO BANCO
            //
            // IMPORTANTE:
            //
            // NÃO usar listarJogos().
            //
            // listarJogos() contém histórico.
            // ======================================

            let bancoHoje = [];


            try {

                bancoHoje =
                    await jogoBancoService
                        .buscarJogosDoDia();

            }

            catch (erro) {

                console.error(

                    "❌ Erro buscando jogos de hoje:",
                    erro.message

                );

                bancoHoje = [];

            }


            if (
                !Array.isArray(
                    bancoHoje
                )
            ) {

                bancoHoje = [];

            }


            // ======================================
            // PROTEÇÃO FINAL
            // ======================================

            const jogosBancoHoje =

                bancoHoje

                    .map(
                        normalizarJogo
                    )

                    .filter(
                        jogo =>
                            jogoValido(
                                jogo
                            )
                    )

                    .filter(
                        jogo =>
                            jogoEhHoje(
                                jogo
                            )
                    );


            const resposta =
                removerDuplicados(
                    jogosBancoHoje
                )
                    .map(
                        formatarJogo
                    )
                    .filter(
                        Boolean
                    );


            console.log(

                `⚽ ${resposta.length} jogos de hoje retornados`

            );


            return res.json({

                sucesso:
                    true,

                data:
                    hoje,

                timezone:
                    TIMEZONE,

                total:
                    resposta.length,

                jogos:
                    resposta

            });

        }

        catch (erro) {

            console.error(

                "❌ Erro API /api/jogos:",
                erro.message

            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                erro:
                    erro.message,

                data:
                    obterDataHojeBrasil(),

                timezone:
                    TIMEZONE,

                total:
                    0,

                jogos:
                    []

            });

        }

    }
);


// ==========================================
// GET /api/jogos/banco
//
// HISTÓRICO COMPLETO.
//
// NÃO FILTRAR DATA.
//
// ==========================================

router.get(
    "/banco",
    async (
        req,
        res
    ) => {

        try {

            const jogos =
                await jogoBancoService
                    .listarJogos();


            const lista =
                Array.isArray(
                    jogos
                )
                    ? jogos
                    : [];


            return res.json({

                sucesso:
                    true,

                total:
                    lista.length,

                jogos:
                    lista

            });

        }

        catch (erro) {

            console.error(

                "❌ Erro banco jogos:",
                erro.message

            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                erro:
                    erro.message,

                total:
                    0,

                jogos:
                    []

            });

        }

    }
);


// ==========================================
// GET /api/jogos/hoje
//
// SOMENTE BANCO.
//
// Não chama API externa.
//
// ==========================================

router.get(
    "/hoje",
    async (
        req,
        res
    ) => {

        try {

            const jogos =
                await jogoBancoService
                    .buscarJogosDoDia();


            const filtrados =

                (
                    Array.isArray(
                        jogos
                    )
                        ? jogos
                        : []
                )

                    .map(
                        normalizarJogo
                    )

                    .filter(
                        jogo =>
                            jogoValido(
                                jogo
                            )
                    )

                    .filter(
                        jogo =>
                            jogoEhHoje(
                                jogo
                            )
                    );


            const resposta =
                removerDuplicados(
                    filtrados
                )
                    .map(
                        formatarJogo
                    )
                    .filter(
                        Boolean
                    );


            return res.json({

                sucesso:
                    true,

                data:
                    obterDataHojeBrasil(),

                timezone:
                    TIMEZONE,

                total:
                    resposta.length,

                jogos:
                    resposta

            });

        }

        catch (erro) {

            console.error(

                "❌ Erro jogos hoje:",
                erro.message

            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                erro:
                    erro.message,

                data:
                    obterDataHojeBrasil(),

                timezone:
                    TIMEZONE,

                total:
                    0,

                jogos:
                    []

            });

        }

    }
);


// ==========================================
// GET /api/jogos/proximos
//
// RESTANTE DE HOJE + AMANHÃ.
//
// ==========================================

router.get(
    "/proximos",
    async (
        req,
        res
    ) => {

        try {

            let limite =
                Number(
                    req.query.limite
                );


            if (
                !Number.isInteger(
                    limite
                )
            ) {

                limite = 20;

            }


            if (
                limite < 1
            ) {

                limite = 20;

            }


            if (
                limite > 100
            ) {

                limite = 100;

            }


            const jogos =
                await jogoBancoService
                    .buscarProximosJogos(
                        limite
                    );


            const lista =
                Array.isArray(
                    jogos
                )
                    ? jogos
                    : [];


            return res.json({

                sucesso:
                    true,

                data:
                    obterDataHojeBrasil(),

                timezone:
                    TIMEZONE,

                total:
                    lista.length,

                jogos:
                    lista

            });

        }

        catch (erro) {

            console.error(

                "❌ Erro próximos jogos:",
                erro.message

            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                erro:
                    erro.message,

                total:
                    0,

                jogos:
                    []

            });

        }

    }
);


// ==========================================
// GET /api/jogos/estatisticas
// ==========================================

router.get(
    "/estatisticas",
    async (
        req,
        res
    ) => {

        try {

            const estatisticas =
                await jogoBancoService
                    .estatisticasJogos();


            return res.json({

                sucesso:
                    true,

                data:
                    obterDataHojeBrasil(),

                timezone:
                    TIMEZONE,

                estatisticas:
                    estatisticas || {}

            });

        }

        catch (erro) {

            console.error(

                "❌ Erro estatísticas:",
                erro.message

            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                erro:
                    erro.message,

                estatisticas:
                    {}

            });

        }

    }
);


// ==========================================
// EXPORT
// ==========================================

export default router;
