```javascript id="r7f2km"
// ==========================================
// BetVision AI
// routes/jogos.js
// Versao 12.3
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

        try {

            jogos = await buscarJogosDia();

        } catch (error) {

            console.log(
                "Erro API futebol:",
                error.message
            );

            jogos = [];

        }


        if (!Array.isArray(jogos)) {

            jogos = [];

        }


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

                console.log(
                    "Erro salvar jogos:",
                    error.message
                );

            }


            try {

                await gerarAnaliseIA(jogos);

                console.log(
                    "Analises IA geradas"
                );

            } catch (error) {

                console.log(
                    "Erro analise IA:",
                    error.message
                );

            }

        }


        const banco =
            await jogoBancoService.listarJogos();


        res.json({

            sucesso: true,

            total: banco.length,

            jogos: banco.map(jogo => ({

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

            }))

        });

    } catch (error) {

        console.error(
            "Erro jogos:",
            error.message
        );

        res.status(500).json({

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

        res.json({

            sucesso: true,

            total: jogos.length,

            jogos: jogos

        });

    } catch (error) {

        res.status(500).json({

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

        res.json({

            sucesso: true,

            total: jogos.length,

            jogos: jogos

        });

    } catch (error) {

        res.status(500).json({

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

        res.json({

            sucesso: true,

            total: jogos.length,

            jogos: jogos

        });

    } catch (error) {

        res.status(500).json({

            sucesso: false,

            erro: error.message

        });

    }

});


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default router;
```
