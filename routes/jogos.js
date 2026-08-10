// ==========================================
// BETVISION AI
// routes/jogos.js
//
// Versão 14.0
// API de Jogos
// PostgreSQL / Neon
//
// CORREÇÕES:
// - Processa cada jogo individualmente
// - Não envia array para gerarAnaliseIA()
// - Não gera "Casa x Fora"
// - Não gera "Time A x Time B"
// - Salva jogos no PostgreSQL
// - Gera análise IA para cada jogo real
// - Mantém compatibilidade das rotas existentes
// ==========================================

import express from "express";

import jogoBancoService from "../services/jogoBancoService.js";

import {
    buscarJogosDia
} from "../services/futebolService.js";

import {
    gerarAnaliseIA
} from "../services/inteligenciaService.js";

const router = express.Router();


// ==========================================
// FUNÇÃO AUXILIAR
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
        "Futebol";

    const timeCasa =
        jogo.time_casa ??
        jogo.casa ??
        jogo.homeTeam ??
        null;

    const timeFora =
        jogo.time_fora ??
        jogo.fora ??
        jogo.awayTeam ??
        null;

    const dataJogo =
        jogo.data_jogo ??
        jogo.horario ??
        jogo.data ??
        null;

    const status =
        jogo.status ??
        "SCHEDULED";

    return {

        ...jogo,

        api_id: apiId,

        campeonato,

        time_casa: timeCasa,

        time_fora: timeFora,

        data_jogo: dataJogo,

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
        ).trim();

    const fora =
        String(
            jogo.time_fora ??
            jogo.fora ??
            ""
        ).trim();

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

    // Evita dados de fallback/teste
    if (
        casa.toLowerCase() === "casa" ||
        fora.toLowerCase() === "fora"
    ) {
        return false;
    }

    if (
        casa.toLowerCase() === "time a" ||
        fora.toLowerCase() === "time b"
    ) {
        return false;
    }

    return true;

}


// ==========================================
// GERAR DADOS ESTATÍSTICOS INICIAIS
//
// Enquanto o sistema ainda não possui histórico
// detalhado por equipe, utilizamos valores neutros.
//
// IMPORTANTE:
// Esses valores NÃO criam jogos fictícios.
// Servem somente como entrada inicial do modelo.
// ==========================================

function gerarDadosEstatisticos(jogo) {

    return {

        ataqueCasa:
            Number(
                jogo.ataque_casa ??
                jogo.ataqueCasa ??
                50
            ),

        defesaCasa:
            Number(
                jogo.defesa_casa ??
                jogo.defesaCasa ??
                50
            ),

        ataqueFora:
            Number(
                jogo.ataque_fora ??
                jogo.ataqueFora ??
                50
            ),

        defesaFora:
            Number(
                jogo.defesa_fora ??
                jogo.defesaFora ??
                50
            ),

        formaCasa:
            Number(
                jogo.forma_casa ??
                jogo.formaCasa ??
                50
            ),

        formaFora:
            Number(
                jogo.forma_fora ??
                jogo.formaFora ??
                50
            ),

        mediaGolsCasa:
            Number(
                jogo.media_gols_casa ??
                jogo.mediaGolsCasa ??
                1
            ),

        mediaGolsFora:
            Number(
                jogo.media_gols_fora ??
                jogo.mediaGolsFora ??
                1
            )

    };

}


// ==========================================
// GERAR ANÁLISE DE UM JOGO
// ==========================================

async function analisarJogo(jogo) {

    if (!jogoValido(jogo)) {

        console.log(
            "⚠️ Jogo inválido ignorado:",
            jogo
        );

        return null;

    }

    const jogoNormalizado =
        normalizarJogo(jogo);

    const dados =
        gerarDadosEstatisticos(
            jogoNormalizado
        );

    const nomeJogo =
        `${jogoNormalizado.time_casa} x ${jogoNormalizado.time_fora}`;

    console.log(
        `🤖 Gerando análise: ${nomeJogo}`
    );

    try {

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
// Fluxo:
//
// Football-Data
//      ↓
// valida jogos
//      ↓
// PostgreSQL
//      ↓
// análise IA individual
//      ↓
// PostgreSQL
//      ↓
// resposta
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
                "=========================================="
            );


            // ======================================
            // BUSCAR JOGOS NA API
            // ======================================

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


            // ======================================
            // GARANTIR ARRAY
            // ======================================

            if (!Array.isArray(jogosAPI)) {

                jogosAPI = [];

            }


            // ======================================
            // NORMALIZAR E VALIDAR
            // ======================================

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


            // ======================================
            // SALVAR JOGOS
            // ======================================

            let jogosSalvos = [];

            if (
                jogosValidos.length > 0
            ) {

                try {

                    jogosSalvos =
                        await jogoBancoService.salvarListaJogos(
                            jogosValidos
                        );

                    console.log(
                        `💾 Jogos salvos no PostgreSQL: ${jogosSalvos.length}`
                    );

                }

                catch (error) {

                    console.error(
                        "❌ Erro salvar jogos:",
                        error.message
                    );

                }

            }


            // ======================================
            // GERAR ANÁLISES IA
            //
            // IMPORTANTE:
            // NÃO fazer:
            //
            // gerarAnaliseIA(jogosValidos)
            //
            // Porque gerarAnaliseIA() recebe
            // apenas um jogo.
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

                    if (resultado) {

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


            // ======================================
            // RESULTADO DAS ANÁLISES
            // ======================================

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


            // ======================================
            // BUSCAR JOGOS DO BANCO
            // ======================================

            const banco =
                await jogoBancoService.listarJogos();


            // ======================================
            // GARANTIR ARRAY
            // ======================================

            const jogosBanco =
                Array.isArray(banco)
                    ? banco
                    : [];


            // ======================================
            // FORMATAR RESPOSTA
            // ======================================

            const resposta =
                jogosBanco.map(
                    (jogo) => {

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


            // ======================================
            // RESPOSTA
            // ======================================

            return res.json({

                sucesso: true,

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

                sucesso: false,

                erro:
                    error.message

            });

        }

    }
);


// ==========================================
// GET /api/jogos/banco
//
// Lista somente jogos já salvos.
// Não consulta API externa.
// Não gera análise.
// ==========================================

router.get(
    "/banco",
    async (req, res) => {

        try {

            const jogos =
                await jogoBancoService.listarJogos();


            return res.json({

                sucesso: true,

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

                sucesso: false,

                erro:
                    error.message

            });

        }

    }
);


// ==========================================
// GET /api/jogos/hoje
//
// Lista jogos do dia no PostgreSQL.
// ==========================================

router.get(
    "/hoje",
    async (req, res) => {

        try {

            const jogos =
                await jogoBancoService.buscarJogosDoDia();


            return res.json({

                sucesso: true,

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

                sucesso: false,

                erro:
                    error.message

            });

        }

    }
);


// ==========================================
// GET /api/jogos/proximos
//
// Exemplo:
// /api/jogos/proximos?limite=20
// ==========================================

router.get(
    "/proximos",
    async (req, res) => {

        try {

            let limite =
                Number(
                    req.query.limite
                ) || 20;


            // Proteção contra valores absurdos

            if (limite < 1) {

                limite = 20;

            }

            if (limite > 100) {

                limite = 100;

            }


            const jogos =
                await jogoBancoService.buscarProximosJogos(
                    limite
                );


            return res.json({

                sucesso: true,

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

                sucesso: false,

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
                await jogoBancoService.estatisticasJogos();


            return res.json({

                sucesso: true,

                estatisticas

            });

        }

        catch (error) {

            console.error(
                "❌ Erro estatísticas jogos:",
                error.message
            );


            return res.status(500).json({

                sucesso: false,

                erro:
                    error.message

            });

        }

    }
);


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default router;

