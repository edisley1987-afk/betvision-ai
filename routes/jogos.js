```javascript
// ==========================================
// BetVision AI
// routes/jogos.js
// Versão 12.1
// API Jogos + IA
// Compatível PostgreSQL / Neon
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
// GET /api/jogos
// Jogos do dia
// ==========================================

router.get("/", async (req, res) => {

    try {

        console.log("⚽ API JOGOS DO DIA");


        let jogos = [];


        // ==========================================
        // BUSCAR JOGOS NA API DE FUTEBOL
        // ==========================================

        try {

            jogos = await buscarJogosDia();

        }

        catch (error) {

            console.log(
                "⚠️ API futebol indisponível:",
                error.message
            );

        }


        // ==========================================
        // SALVAR JOGOS NO POSTGRESQL
        // ==========================================

        if (
            Array.isArray(jogos) &&
            jogos.length > 0
        ) {

            try {

                await jogoBancoService.salvarListaJogos(
                    jogos
                );


                console.log(
                    `💾 ${jogos.length} jogos processados no PostgreSQL`
                );

            }

            catch (error) {

                console.log(
                    "⚠️ Erro salvar jogos:",
                    error.message
                );

            }


            // ==========================================
            // GERAR ANÁLISES IA
            // ==========================================

            try {

                await gerarAnaliseIA(jogos);


                console.log(
                    "🤖 Análises IA geradas"
                );

            }

            catch (error) {

                console.log(
                    "⚠️ Erro gerar análises IA:",
                    error.message
                );

            }

        }


        // ==========================================
        // BUSCAR BANCO ATUALIZADO
        // ==========================================

        const banco =
            await jogoBancoService.listarJogos();


        // ==========================================
        // RESPOSTA
        // ==========================================

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

    }

    catch (error) {

        console.error(
            "❌ Erro jogos:",
            error
        );


        res.status(500).json({

            sucesso: false,

            erro: error.message

        });

    }

});


// ==========================================
// GET /api/jogos/banco
// Somente PostgreSQL
// ==========================================

router.get("/banco", async (req, res) => {

    try {

        const jogos =
            await jogoBancoService.listarJogos();


        res.json({

            sucesso: true,

            total: jogos.length,

            jogos

        });

    }

    catch (error) {

        console.error(
            "❌ Erro buscar jogos do banco:",
            error.message
        );


        res.status(500).json({

            sucesso: false,

            erro: error.message

        });

    }

});


// ==========================================
// GET /api/jogos/hoje
// Jogos registrados hoje no PostgreSQL
// ==========================================

router.get("/hoje", async (req, res) => {

    try {

        const jogos =
            await jogoBancoService.buscarJogosDoDia();


        res.json({

            sucesso: true,

            total: jogos.length,

            jogos

        });

    }

    catch (error) {

        console.error(
            "❌ Erro jogos de hoje:",
            error.message
        );


        res.status(500).json({

            sucesso: false,

            erro: error.message

        });

    }

});


// ==========================================
// GET /api/jogos/proximos
// Próximos jogos
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

            jogos

        });

    }

    catch (error) {

        console.error(
            "❌ Erro próximos jogos:",
            error.message
        );


        res.status(500).json({

            sucesso: false,

            erro: error.message

        });

    }

});


// ==========================================
// EXPORTAÇÃO
// ==========================================

export default router;
```
