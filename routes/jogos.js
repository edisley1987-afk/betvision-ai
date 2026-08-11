// ==========================================
// BETVISION AI
// routes/jogos.js
//
// Versão 16.0
// API DE JOGOS
// PostgreSQL / NeonDB
//
// CORREÇÕES:
//
// - /api/jogos mostra SOMENTE jogos de hoje
// - /api/jogos/hoje mostra SOMENTE jogos de hoje
// - /api/jogos/proximos mostra somente próximos
// - Jogos antigos continuam no banco
// - Histórico não é apagado
// - IA continua usando histórico real
// - api_id continua como identificador principal
// - Não cria jogos fictícios
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
// NORMALIZAR JOGO
// ==========================================

function normalizarJogo(jogo) {

    if (!jogo) {

        return null;

    }


    const apiId =

        jogo.api_id ??
        jogo.apiId ??
        jogo.id ??
        null;


    const campeonato =

        jogo.campeonato ??
        jogo.competicao ??
        jogo.competition?.name ??
        "Futebol";


    const timeCasa =

        jogo.time_casa ??
        jogo.timeCasa ??
        jogo.casa ??
        jogo.homeTeam?.name ??
        jogo.home_team?.name ??
        null;


    const timeFora =

        jogo.time_fora ??
        jogo.timeFora ??
        jogo.fora ??
        jogo.awayTeam?.name ??
        jogo.away_team?.name ??
        null;


    const dataJogo =

        jogo.data_jogo ??
        jogo.dataJogo ??
        jogo.horario ??
        jogo.data ??
        jogo.utcDate ??
        null;


    const status =

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

function jogoValido(jogo) {

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

        jogo.api_id ??
        jogo.apiId ??
        jogo.id;


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
        Number(valor);


    return Number.isFinite(
        numero
    )
        ? numero
        : padrao;

}


// ==========================================
// OBTER GOLS DE UM JOGO
// ==========================================

function obterGols(jogo) {

    const golsCasa =

        numeroSeguro(

            jogo.gols_casa ??
            jogo.golsCasa ??
            jogo.placar?.casa ??
            jogo.score?.fullTime?.home ??
            0

        );


    const golsFora =

        numeroSeguro(

            jogo.gols_fora ??
            jogo.golsFora ??
            jogo.placar?.fora ??
            jogo.score?.fullTime?.away ??
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
            obterGols(jogo);


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
            golsTime > golsAdversario
        ) {

            vitorias++;

            pontos += 3;

        }

        else if (
            golsTime === golsAdversario
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
            obterGols(jogo);


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
        normalizarJogo(jogo);


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
// GET /api/jogos
//
// IMPORTANTE:
//
// A API externa traz somente hoje.
//
// O banco possui histórico.
//
// Portanto, aqui usamos
// buscarJogosDoDia() e NÃO listarJogos().
// ==========================================

router.get(
    "/",
    async (req, res) => {

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
                "=========================================="
            );


            // ==================================
            // BUSCAR API
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
                !Array.isArray(jogosAPI)
            ) {

                jogosAPI = [];

            }


            // ==================================
            // NORMALIZAR E VALIDAR
            // ==================================

            const jogosValidos =

                jogosAPI

                    .map(
                        normalizarJogo
                    )

                    .filter(
                        jogoValido
                    );


            console.log(
                `⚽ ${jogosValidos.length} jogos válidos carregados`
            );


            // ==================================
            // SALVAR / ATUALIZAR BANCO
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
            // Somente os jogos recebidos hoje.
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
            // IMPORTANTE:
            //
            // NÃO usar listarJogos()
            //
            // pois ele retorna histórico inteiro.
            //
            // Aqui queremos somente HOJE.
            // ==================================

            const banco =

                await jogoBancoService
                    .buscarJogosDoDia();


            const jogosBanco =

                Array.isArray(banco)
                    ? banco
                    : [];


            // ==================================
            // FORMATAR RESPOSTA
            // ==================================

            const resposta =

                jogosBanco.map(
                    jogo => {

                        return {

                            id:
                                jogo.id,

                            api_id:
                                jogo.api_id,

                            campeonato:
                                jogo.campeonato ||
                                "Futebol",

                            time_casa:
                                jogo.time_casa ||
                                null,

                            time_fora:
                                jogo.time_fora ||
                                null,

                            casa:
                                jogo.time_casa ||
                                null,

                            fora:
                                jogo.time_fora ||
                                null,

                            data_jogo:
                                jogo.data_jogo ||
                                null,

                            horario:
                                jogo.data_jogo ||
                                null,

                            estadio:
                                jogo.estadio ||
                                null,

                            status:
                                jogo.status ||
                                "SCHEDULED"

                        };

                    }
                );


            return res.json({

                sucesso:
                    true,

                total:
                    resposta.length,

                jogos:
                    resposta

            });

        }

        catch (error) {

            console.error(
                "❌ Erro API jogos:",
                error.message
            );


            return res.status(500).json({

                sucesso:
                    false,

                erro:
                    error.message

            });

        }

    }
);


// ==========================================
// GET /api/jogos/banco
//
// Este endpoint continua mostrando
// todos os jogos armazenados.
//
// Útil para histórico/admin.
// ==========================================

router.get(
    "/banco",
    async (req, res) => {

        try {

            const jogos =
                await jogoBancoService
                    .listarJogos();


            return res.json({

                sucesso:
                    true,

                total:
                    jogos.length,

                jogos

            });

        }

        catch (error) {

            console.error(
                "❌ Erro banco jogos:",
                error.message
            );


            return res.status(500).json({

                sucesso:
                    false,

                erro:
                    error.message

            });

        }

    }
);


// ==========================================
// GET /api/jogos/hoje
// ==========================================

router.get(
    "/hoje",
    async (req, res) => {

        try {

            const jogos =

                await jogoBancoService
                    .buscarJogosDoDia();


            return res.json({

                sucesso:
                    true,

                total:
                    jogos.length,

                jogos

            });

        }

        catch (error) {

            console.error(
                "❌ Erro jogos hoje:",
                error.message
            );


            return res.status(500).json({

                sucesso:
                    false,

                erro:
                    error.message

            });

        }

    }
);


// ==========================================
// GET /api/jogos/proximos
// ==========================================

router.get(
    "/proximos",
    async (req, res) => {

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

                total:
                    jogos.length,

                jogos

            });

        }

        catch (error) {

            console.error(
                "❌ Erro próximos jogos:",
                error.message
            );


            return res.status(500).json({

                sucesso:
                    false,

                erro:
                    error.message

            });

        }

    }
);


// ==========================================
// GET /api/jogos/estatisticas
// ==========================================

router.get(
    "/estatisticas",
    async (req, res) => {

        try {

            const estatisticas =

                await jogoBancoService
                    .estatisticasJogos();


            return res.json({

                sucesso:
                    true,

                estatisticas

            });

        }

        catch (error) {

            console.error(
                "❌ Erro estatísticas jogos:",
                error.message
            );


            return res.status(500).json({

                sucesso:
                    false,

                erro:
                    error.message

            });

        }

    }
);


// ==========================================
// EXPORT
// ==========================================

export default router;
