// ==========================================
// BETVISION AI
// routes/jogos.js
//
// Versão 16.1
// API DE JOGOS
// PostgreSQL / NeonDB
//
// REGRAS:
//
// - /api/jogos mostra SOMENTE jogos de hoje
// - /api/jogos/hoje mostra SOMENTE jogos de hoje
// - /api/jogos/banco mostra todo o histórico
// - /api/jogos/proximos mostra somente próximos jogos
// - Jogos antigos continuam no banco
// - Histórico não é apagado
// - IA continua usando histórico real
// - api_id é o identificador principal externo
// - Não cria jogos fictícios
// - Não duplica jogos
// - Normaliza api_id antes de salvar
// - Não depende de jogo_id para análise
// - Compatível com PostgreSQL / NeonDB
// - Fuso oficial: America/Sao_Paulo
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

const router = express.Router();


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const TIMEZONE =
    "America/Sao_Paulo";


// ==========================================
// DATA DE HOJE NO BRASIL
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

    catch (erro) {

        console.error(
            "❌ Erro obtendo data Brasil:",
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
            jogo.id ??
            null

        );


    const campeonato =

        jogo.campeonato ??
        jogo.competicao ??
        jogo.competition?.name ??
        jogo.league?.name ??
        "Futebol";


    const timeCasa =

        jogo.time_casa ??
        jogo.timeCasa ??
        jogo.casa ??
        jogo.homeTeam?.name ??
        jogo.home_team?.name ??
        jogo.teams?.home?.name ??
        null;


    const timeFora =

        jogo.time_fora ??
        jogo.timeFora ??
        jogo.fora ??
        jogo.awayTeam?.name ??
        jogo.away_team?.name ??
        jogo.teams?.away?.name ??
        null;


    const dataJogo =

        jogo.data_jogo ??
        jogo.dataJogo ??
        jogo.horario ??
        jogo.data ??
        jogo.utcDate ??
        jogo.fixture?.date ??
        null;


    const status =

        jogo.status?.short ??
        jogo.status?.type ??
        jogo.status ??
        "SCHEDULED";


    return {

        ...jogo,

        api_id:
            apiId,

        campeonato:
            campeonato,

        time_casa:
            timeCasa,

        time_fora:
            timeFora,

        data_jogo:
            dataJogo,

        status:
            status

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


    const casa =

        String(
            jogo.time_casa ??
            jogo.casa ??
            ""
        )
        .trim();


    const fora =

        String(
            jogo.time_fora ??
            jogo.fora ??
            ""
        )
        .trim();


    const apiId =

        normalizarApiId(
            jogo.api_id ??
            jogo.apiId ??
            jogo.id
        );


    if (!apiId) {

        return false;

    }


    if (!casa || !fora) {

        return false;

    }


    const casaNormalizada =
        casa.toLowerCase();


    const foraNormalizada =
        fora.toLowerCase();


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

        ||

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
// CONVERTER NÚMERO
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
// OBTER GOLS DE UM JOGO
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
// CALCULAR ESTATÍSTICAS DO TIME
// ==========================================

function calcularEstatisticasTime(
    jogos = [],
    nomeTime
) {

    if (

        !Array.isArray(jogos) ||
        jogos.length === 0 ||
        !nomeTime

    ) {

        return {

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

    }


    let vitorias = 0;

    let empates = 0;

    let derrotas = 0;

    let pontos = 0;

    let golsMarcados = 0;

    let golsSofridos = 0;

    let jogosProcessados = 0;


    for (
        const jogo of jogos
    ) {

        const casa =

            String(
                jogo.time_casa ??
                jogo.casa ??
                ""
            )
            .trim();


        const fora =

            String(
                jogo.time_fora ??
                jogo.fora ??
                ""
            )
            .trim();


        if (

            casa !== nomeTime &&
            fora !== nomeTime

        ) {

            continue;

        }


        const gols =
            obterGols(
                jogo
            );


        const emCasa =
            casa === nomeTime;


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


        jogosProcessados++;


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

            pontos += 1;

        }

        else {

            derrotas++;

        }

    }


    if (
        jogosProcessados === 0
    ) {

        return {

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

    }


    const forma =

        (
            pontos /
            (
                jogosProcessados *
                3
            )
        ) *
        100;


    const mediaGolsMarcados =

        golsMarcados /
        jogosProcessados;


    const mediaGolsSofridos =

        golsSofridos /
        jogosProcessados;


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
            jogosProcessados,

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
// CALCULAR CONFRONTO DIRETO
// ==========================================

function calcularConfrontoDireto(
    jogos = [],
    timeCasa,
    timeFora
) {

    if (

        !Array.isArray(jogos) ||
        !timeCasa ||
        !timeFora

    ) {

        return {

            jogos: 0,

            vitoriasCasa: 0,

            empates: 0,

            vitoriasFora: 0,

            golsCasa: 0,

            golsFora: 0

        };

    }


    let vitoriasCasa = 0;

    let empates = 0;

    let vitoriasFora = 0;

    let golsCasa = 0;

    let golsFora = 0;

    let total = 0;


    for (
        const jogo of jogos
    ) {

        const casa =

            String(
                jogo.time_casa ??
                jogo.casa ??
                ""
            )
            .trim();


        const fora =

            String(
                jogo.time_fora ??
                jogo.fora ??
                ""
            )
            .trim();


        const confrontoNormal =

            casa === timeCasa &&
            fora === timeFora;


        const confrontoInvertido =

            casa === timeFora &&
            fora === timeCasa;


        if (

            !confrontoNormal &&
            !confrontoInvertido

        ) {

            continue;

        }


        const gols =
            obterGols(
                jogo
            );


        total++;


        if (
            confrontoNormal
        ) {

            golsCasa +=
                gols.casa;

            golsFora +=
                gols.fora;


            if (
                gols.casa >
                gols.fora
            ) {

                vitoriasCasa++;

            }

            else if (
                gols.casa ===
                gols.fora
            ) {

                empates++;

            }

            else {

                vitoriasFora++;

            }

        }

        else {

            golsCasa +=
                gols.fora;

            golsFora +=
                gols.casa;


            if (
                gols.fora >
                gols.casa
            ) {

                vitoriasCasa++;

            }

            else if (
                gols.fora ===
                gols.casa
            ) {

                empates++;

            }

            else {

                vitoriasFora++;

            }

        }

    }


    return {

        jogos:
            total,

        vitoriasCasa,

        empates,

        vitoriasFora,

        golsCasa,

        golsFora

    };

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

    catch (error) {

        console.error(
            "⚠️ Erro buscando histórico:",
            error.message
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
                estatisticasCasa.jogos > 0 ||
                estatisticasFora.jogos > 0
            ),

        possuiH2H:
            h2h.jogos > 0

    };

}


// ==========================================
// ANALISAR JOGO
// ==========================================

async function analisarJogo(
    jogo
) {

    if (
        !jogoValido(jogo)
    ) {

        console.log(
            "⚠️ Jogo inválido ignorado:",
            jogo
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


        return resultado;

    }

    catch (error) {

        console.error(

            `❌ Erro análise ${nomeJogo}:`,
            error.message

        );


        return null;

    }

}


// ==========================================
// FILTRAR SOMENTE HOJE
//
// Proteção adicional no route.
//
// Mesmo que a API externa devolva uma
// janela de vários dias, somente jogos
// cuja data local seja HOJE continuam.
// ==========================================

function jogoEhHoje(
    jogo
) {

    if (
        !jogo?.data_jogo
    ) {

        return false;

    }


    const dataHoje =
        obterDataHojeBrasil();


    if (
        !dataHoje
    ) {

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
            dataHoje
        );

    }

    catch (error) {

        console.error(
            "⚠️ Erro filtrando data do jogo:",
            error.message
        );

        return false;

    }

}


// ==========================================
// FORMATAR JOGO PARA API
// ==========================================

function formatarJogo(
    jogo
) {

    if (
        !jogo
    ) {

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
            jogo.competicao ??
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
// GET /api/jogos
//
// SOMENTE JOGOS DE HOJE
// ==========================================

router.get(
    "/",
    async (
        req,
        res
    ) => {

        try {

            console.log(
                "=========================================="
            );

            console.log(
                "⚽ API JOGOS"
            );

            console.log(
                "📅 SOMENTE JOGOS DE HOJE"
            );

            console.log(
                `🌎 Fuso: ${TIMEZONE}`
            );

            console.log(
                `📅 Data: ${obterDataHojeBrasil()}`
            );

            console.log(
                "=========================================="
            );


            // ==================================
            // BUSCAR API EXTERNA
            // ==================================

            let jogosAPI = [];


            try {

                jogosAPI =
                    await buscarJogosDia();

            }

            catch (error) {

                console.error(
                    "❌ Erro API futebol:",
                    error.message
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


            // ==================================
            // NORMALIZAR
            // ==================================

            const jogosNormalizados =

                jogosAPI

                    .map(
                        normalizarJogo
                    )

                    .filter(
                        jogo =>
                            jogoValido(jogo)
                    );


            // ==================================
            // FILTRAR DATA
            // ==================================

            const jogosValidos =

                jogosNormalizados

                    .filter(
                        jogo =>
                            jogoEhHoje(jogo)
                    );


            console.log(

                `⚽ ${jogosValidos.length} jogos ` +
                `válidos para ${obterDataHojeBrasil()}`

            );


            // ==================================
            // LISTAR EXEMPLO
            // ==================================

            if (
                jogosValidos.length > 0
            ) {

                jogosValidos.forEach(
                    (
                        jogo,
                        indice
                    ) => {

                        let horario =
                            "N/A";


                        try {

                            const data =
                                new Date(
                                    jogo.data_jogo
                                );


                            if (
                                !Number.isNaN(
                                    data.getTime()
                                )
                            ) {

                                horario =
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
                                    ).format(
                                        data
                                    );

                            }

                        }

                        catch {

                            horario =
                                "N/A";

                        }


                        console.log(

                            `⚽ ${indice + 1}. ` +
                            `${jogo.time_casa} x ` +
                            `${jogo.time_fora} | ` +
                            `${jogo.campeonato} | ` +
                            `${horario} | ` +
                            `API ${jogo.api_id}`

                        );

                    }
                );

            }


            // ==================================
            // SALVAR / ATUALIZAR
            // ==================================

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

                        `💾 ${jogosSalvos.length} jogos ` +
                        `salvos/atualizados no PostgreSQL`

                    );

                }

                catch (error) {

                    console.error(

                        "❌ Erro salvar jogos:",
                        error.message

                    );

                }

            }


            // ==================================
            // GERAR ANÁLISES
            //
            // Somente jogos válidos de hoje.
            // ==================================

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

                catch (error) {

                    errosAnalise++;

                    console.error(

                        "❌ Erro processamento análise:",
                        error.message

                    );

                }

            }


            console.log(
                "🤖 Resultado análises:",
                {

                    total:
                        jogosValidos.length,

                    processados:
                        analisesProcessadas,

                    erros:
                        errosAnalise,

                    sucesso:
                        errosAnalise === 0

                }
            );


            // ==================================
            // BUSCAR DO BANCO
            //
            // IMPORTANTE:
            //
            // Não usar listarJogos(),
            // pois contém histórico.
            // ==================================

            let banco = [];


            try {

                banco =

                    await jogoBancoService
                        .buscarJogosDoDia();

            }

            catch (error) {

                console.error(

                    "❌ Erro buscando jogos do dia:",
                    error.message

                );

                banco = [];

            }


            if (
                !Array.isArray(
                    banco
                )
            ) {

                banco = [];

            }


            // ==================================
            // PROTEÇÃO FINAL DE DATA
            //
            // O banco também precisa devolver
            // somente jogos de hoje.
            // ==================================

            const jogosBanco =

                banco

                    .map(
                        normalizarJogo
                    )

                    .filter(
                        jogo =>
                            jogoValido(jogo)
                    )

                    .filter(
                        jogo =>
                            jogoEhHoje(jogo)
                    );


            // ==================================
            // FORMATAR RESPOSTA
            // ==================================

            const resposta =

                jogosBanco

                    .map(
                        formatarJogo
                    )

                    .filter(
                        Boolean
                    );


            // ==================================
            // REMOVER DUPLICADOS POR API ID
            // ==================================

            const mapa =
                new Map();


            for (
                const jogo of resposta
            ) {

                if (
                    !jogo.api_id
                ) {

                    continue;

                }


                if (
                    !mapa.has(
                        jogo.api_id
                    )
                ) {

                    mapa.set(
                        jogo.api_id,
                        jogo
                    );

                }

            }


            const respostaFinal =
                Array.from(
                    mapa.values()
                );


            // ==================================
            // LOG FINAL
            // ==================================

            console.log(

                `⚽ ${respostaFinal.length} jogos ` +
                `de hoje retornados`

            );


            return res.json({

                sucesso:
                    true,

                data:
                    obterDataHojeBrasil(),

                timezone:
                    TIMEZONE,

                total:
                    respostaFinal.length,

                jogos:
                    respostaFinal

            });

        }

        catch (error) {

            console.error(
                "❌ Erro API jogos:",
                error.message
            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                erro:
                    error.message,

                jogos:
                    []

            });

        }

    }
);


// ==========================================
// GET /api/jogos/banco
//
// TODOS OS JOGOS DO BANCO
//
// Inclui histórico.
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


            return res.json({

                sucesso:
                    true,

                total:
                    Array.isArray(jogos)
                        ? jogos.length
                        : 0,

                jogos:
                    Array.isArray(jogos)
                        ? jogos
                        : []

            });

        }

        catch (error) {

            console.error(

                "❌ Erro banco jogos:",
                error.message

            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                erro:
                    error.message,

                jogos:
                    []

            });

        }

    }
);


// ==========================================
// GET /api/jogos/hoje
//
// SOMENTE JOGOS DE HOJE
//
// Não consulta API externa.
// Consulta somente banco.
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


            const jogosFiltrados =

                (
                    Array.isArray(jogos)
                        ? jogos
                        : []
                )

                    .map(
                        normalizarJogo
                    )

                    .filter(
                        jogo =>
                            jogoValido(jogo)
                    )

                    .filter(
                        jogo =>
                            jogoEhHoje(jogo)
                    )

                    .map(
                        formatarJogo
                    );


            return res.json({

                sucesso:
                    true,

                data:
                    obterDataHojeBrasil(),

                timezone:
                    TIMEZONE,

                total:
                    jogosFiltrados.length,

                jogos:
                    jogosFiltrados

            });

        }

        catch (error) {

            console.error(

                "❌ Erro jogos hoje:",
                error.message

            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                erro:
                    error.message,

                jogos:
                    []

            });

        }

    }
);


// ==========================================
// GET /api/jogos/proximos
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
                ) || 20;


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


            return res.json({

                sucesso:
                    true,

                timezone:
                    TIMEZONE,

                total:
                    Array.isArray(jogos)
                        ? jogos.length
                        : 0,

                jogos:
                    Array.isArray(jogos)
                        ? jogos
                        : []

            });

        }

        catch (error) {

            console.error(

                "❌ Erro próximos jogos:",
                error.message

            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                erro:
                    error.message,

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

                estatisticas:
                    estatisticas || {}

            });

        }

        catch (error) {

            console.error(

                "❌ Erro estatísticas jogos:",
                error.message

            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                erro:
                    error.message,

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
