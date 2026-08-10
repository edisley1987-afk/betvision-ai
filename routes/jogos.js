// ==========================================
// BETVISION AI
// routes/jogos.js
// Versão 14.0
// API Jogos
// PostgreSQL / NeonDB
//
// CORREÇÕES:
// 1. Não envia array para gerarAnaliseIA()
// 2. Gera análise individual por jogo
// 3. Evita análise falsa "Casa x Fora"
// 4. Mantém integração com jogoBancoService
// 5. Mantém endpoints existentes
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

const router = express.Router();


// ==========================================
// FUNÇÃO AUXILIAR
// GERAR ANÁLISE PARA CADA JOGO
// ==========================================

async function gerarAnalisesDosJogos(jogos) {

    if (!Array.isArray(jogos) || jogos.length === 0) {

        return {
            total: 0,
            sucesso: true
        };

    }


    let processados = 0;

    let erros = 0;


    for (const jogo of jogos) {

        try {

            if (!jogo) {

                continue;

            }


            const casa =
                jogo.time_casa ||
                jogo.casa;

            const fora =
                jogo.time_fora ||
                jogo.fora;


            // ==========================================
            // NÃO ANALISAR JOGO SEM TIMES
            // ==========================================

            if (!casa || !fora) {

                console.log(
                    "⚠️ Jogo ignorado: times não identificados"
                );

                continue;

            }


            // ==========================================
            // OBJETO COMPATÍVEL COM inteligenciaService
            // ==========================================

            const jogoNormalizado = {

                id:
                    jogo.id ||
                    jogo.api_id ||
                    null,

                api_id:
                    jogo.api_id ||
                    jogo.id ||
                    null,

                time_casa:
                    casa,

                time_fora:
                    fora,

                casa:
                    casa,

                fora:
                    fora,

                campeonato:
                    jogo.campeonato ||
                    "Futebol",

                data_jogo:
                    jogo.data_jogo ||
                    jogo.horario ||
                    null,

                status:
                    jogo.status ||
                    "SCHEDULED"

            };


            // ==========================================
            // DADOS ESTATÍSTICOS BASE
            //
            // Enquanto o motor estatístico não recebe
            // histórico detalhado dos times, usamos
            // valores neutros.
            // ==========================================

            const dados = {

                ataqueCasa: 50,

                defesaCasa: 50,

                ataqueFora: 50,

                defesaFora: 50,

                formaCasa: 50,

                formaFora: 50,

                mediaGolsCasa: 1,

                mediaGolsFora: 1

            };


            console.log(
                `🤖 Gerando análise: ${casa} x ${fora}`
            );


            await gerarAnaliseIA(
                jogoNormalizado,
                dados
            );


            processados++;


        } catch (error) {

            erros++;


            console.error(
                "❌ Erro análise do jogo:",
                error.message
            );

        }

    }


    return {

        total:
            jogos.length,

        processados,

        erros,

        sucesso:
            erros === 0

    };

}


// ==========================================
// GET /api/jogos
//
// Busca jogos na Football-Data,
// salva no PostgreSQL,
// gera análise individual,
// depois retorna banco.
// ==========================================

router.get("/", async (req, res) => {

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


        let jogosAPI = [];


        // ==========================================
        // BUSCAR JOGOS NA API
        // ==========================================

        try {

            jogosAPI =
                await buscarJogosDia();

        } catch (error) {

            console.error(
                "❌ Erro API futebol:",
                error.message
            );

            jogosAPI = [];

        }


        // ==========================================
        // GARANTIR ARRAY
        // ==========================================

        if (!Array.isArray(jogosAPI)) {

            jogosAPI = [];

        }


        console.log(
            `⚽ Jogos recebidos da API: ${jogosAPI.length}`
        );


        // ==========================================
        // SALVAR JOGOS
        // ==========================================

        if (jogosAPI.length > 0) {

            try {

                await jogoBancoService.salvarListaJogos(
                    jogosAPI
                );


                console.log(
                    `💾 Jogos salvos no PostgreSQL: ${jogosAPI.length}`
                );


            } catch (error) {

                console.error(
                    "❌ Erro salvar jogos:",
                    error.message
                );

            }


            // ==========================================
            // GERAR ANÁLISES
            //
            // IMPORTANTE:
            // NÃO enviar jogosAPI inteiro.
            // A função agora processa um jogo por vez.
            // ==========================================

            try {

                const resultadoAnalises =
                    await gerarAnalisesDosJogos(
                        jogosAPI
                    );


                console.log(
                    "🤖 Resultado análises:",
                    resultadoAnalises
                );


            } catch (error) {

                console.error(
                    "❌ Erro análises IA:",
                    error.message
                );

            }

        }


        // ==========================================
        // BUSCAR JOGOS DO BANCO
        // ==========================================

        const banco =
            await jogoBancoService.listarJogos();


        // ==========================================
        // GARANTIR ARRAY
        // ==========================================

        const listaBanco =
            Array.isArray(banco)
                ? banco
                : [];


        // ==========================================
        // FORMATAR RESPOSTA
        // ==========================================

        const resposta =
            listaBanco.map((jogo) => {

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

            });


        // ==========================================
        // RESPOSTA
        // ==========================================

        return res.json({

            sucesso: true,

            total:
                resposta.length,

            jogos:
                resposta

        });


    } catch (error) {

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

});


// ==========================================
// GET /api/jogos/banco
// ==========================================

router.get("/banco", async (req, res) => {

    try {

        const jogos =
            await jogoBancoService.listarJogos();


        const lista =
            Array.isArray(jogos)
                ? jogos
                : [];


        return res.json({

            sucesso: true,

            total:
                lista.length,

            jogos:
                lista

        });


    } catch (error) {

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

});


// ==========================================
// GET /api/jogos/hoje
// ==========================================

router.get("/hoje", async (req, res) => {

    try {

        const jogos =
            await jogoBancoService.buscarJogosDoDia();


        const lista =
            Array.isArray(jogos)
                ? jogos
                : [];


        return res.json({

            sucesso: true,

            total:
                lista.length,

            jogos:
                lista

        });


    } catch (error) {

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

});


// ==========================================
// GET /api/jogos/proximos
// ==========================================

router.get("/proximos", async (req, res) => {

    try {

        let limite =
            Number(req.query.limite);


        if (
            !Number.isFinite(limite) ||
            limite <= 0
        ) {

            limite = 20;

        }


        // Limite de segurança

        limite =
            Math.min(
                limite,
                100
            );


        const jogos =
            await jogoBancoService.buscarProximosJogos(
                limite
            );


        const lista =
            Array.isArray(jogos)
                ? jogos
                : [];


        return res.json({

            sucesso: true,

            total:
                lista.length,

            jogos:
                lista

        });


    } catch (error) {

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

});


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

                estatisticas:
                    estatisticas

            });


        } catch (error) {

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
// EXPORT
// ==========================================

export default router;
