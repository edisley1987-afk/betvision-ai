// ==========================================
// BETVISION AI
// routes/jogos.js
// Versao 13.0
// API Jogos
// PostgreSQL / Neon
// ==========================================

import express from "express";

import jogoBancoService from "../services/jogoBancoService.js";

import { buscarJogosDia } from "../services/futebolService.js";

import { gerarAnaliseIA } from "../services/inteligenciaService.js";


const router = express.Router();


// ==========================================
// GET /api/jogos
// ==========================================

router.get("/", async (req, res) => {

    try {

        console.log("API JOGOS");

        let jogos = [];


        // ==========================================
        // BUSCAR JOGOS NA API
        // ==========================================

        try {

            jogos = await buscarJogosDia();

        } catch (error) {

            console.error(
                "Erro API futebol:",
                error.message
            );

            jogos = [];

        }


        // ==========================================
        // GARANTIR ARRAY
        // ==========================================

        if (!Array.isArray(jogos)) {

            jogos = [];

        }


        // ==========================================
        // SALVAR NO BANCO
        // ==========================================

        if (jogos.length > 0) {

            try {

                await jogoBancoService.salvarListaJogos(
                    jogos
                );

                console.log(
                    "Jogos salvos:",
                    jogos.length
                );

            } catch (error) {

                console.error(
                    "Erro salvar jogos:",
                    error.message
                );

            }


            // ==========================================
            // ANALISE IA
            // ==========================================

            try {

                await gerarAnaliseIA(jogos);

                console.log(
                    "Analises IA geradas"
                );

            } catch (error) {

                console.error(
                    "Erro analise IA:",
                    error.message
                );

            }

        }


        // ==========================================
        // BUSCAR BANCO
        // ==========================================

        const banco =
            await jogoBancoService.listarJogos();


        // ==========================================
        // FORMATAR RESPOSTA
        // ==========================================

        const resposta =
            banco.map((jogo) => {

                return {

                    id: jogo.id,

                    api_id: jogo.api_id,

                    campeonato:
                        jogo.campeonato || "Futebol",

                    casa:
                        jogo.time_casa || null,

                    fora:
                        jogo.time_fora || null,

                    horario:
                        jogo.data_jogo || null,

                    estadio:
                        jogo.estadio || null,

                    status:
                        jogo.status || "SCHEDULED"

                };

            });


        // ==========================================
        // RESPOSTA JSON
        // ==========================================

        return res.json({

            sucesso: true,

            total: resposta.length,

            jogos: resposta

        });

    } catch (error) {

        console.error(
            "Erro API jogos:",
            error.message
        );


        return res.status(500).json({

            sucesso: false,

            erro: error.message

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


        return res.json({

            sucesso: true,

            total: jogos.length,

            jogos: jogos

        });

    } catch (error) {

        console.error(
            "Erro banco jogos:",
            error.message
        );


        return res.status(500).json({

            sucesso: false,

            erro: error.message

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


        return res.json({

            sucesso: true,

            total: jogos.length,

            jogos: jogos

        });

    } catch (error) {

        console.error(
            "Erro jogos hoje:",
            error.message
        );


        return res.status(500).json({

            sucesso: false,

            erro: error.message

        });

    }

});


// ==========================================
// GET /api/jogos/proximos
// ==========================================

router.get("/proximos", async (req, res) => {

    try {

        const limite =
            Number(req.query.limite) || 20;


        const jogos =
            await jogoBancoService.buscarProximosJogos(
                limite
            );


        return res.json({

            sucesso: true,

            total: jogos.length,

            jogos: jogos

        });

    } catch (error) {

        console.error(
            "Erro proximos jogos:",
            error.message
        );


        return res.status(500).json({

            sucesso: false,

            erro: error.message

        });

    }

});


// ==========================================
// GET /api/jogos/estatisticas
// ==========================================

router.get("/estatisticas", async (req, res) => {

    try {

        const estatisticas =
            await jogoBancoService.estatisticasJogos();


        return res.json({

            sucesso: true,

            estatisticas: estatisticas

        });

    } catch (error) {

        console.error(
            "Erro estatisticas jogos:",
            error.message
        );


        return res.status(500).json({

            sucesso: false,

            erro: error.message

        });

    }

});


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default router;
