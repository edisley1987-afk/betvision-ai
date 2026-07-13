import express from "express";
import cors from "cors";
import compression from "compression";

import api from "./routes/api.js";
import jogos from "./routes/jogos.js";
import analises from "./routes/analises.js";

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   MIDDLEWARES
===================================================== */

app.use(cors());

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/* =====================================================
   LOG DAS REQUISIÇÕES
===================================================== */

app.use((req, res, next) => {

    const data = new Date().toLocaleString("pt-BR");

    console.log(`[${data}] ${req.method} ${req.originalUrl}`);

    next();

});

/* =====================================================
   ARQUIVOS ESTÁTICOS
===================================================== */

app.use(express.static("public"));

/* =====================================================
   ROTAS DA API
===================================================== */

app.use("/api", api);

app.use("/api/jogos", jogos);

app.use("/api/analises", analises);

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/health", (req, res) => {

    res.json({

        status: "online",

        sistema: "BetVision AI",

        versao: "1.0.0",

        servidor: process.env.RENDER
            ? "Render"
            : "Local",

        data: new Date()

    });

});

/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {

    res.sendFile(process.cwd() + "/public/index.html");

});

/* =====================================================
   404
===================================================== */

app.use((req, res) => {

    res.status(404).json({

        erro: true,

        mensagem: "Rota não encontrada."

    });

});

/* =====================================================
   TRATAMENTO DE ERROS
===================================================== */

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({

        erro: true,

        mensagem: "Erro interno do servidor."

    });

});

/* =====================================================
   INICIAR SERVIDOR
===================================================== */

app.listen(PORT, () => {

    console.log("");

    console.log("==============================================");

    console.log("⚽ BETVISION AI");

    console.log("Servidor iniciado com sucesso");

    console.log("");

    console.log("Porta:", PORT);

    console.log("");

    console.log("Rotas disponíveis:");

    console.log("GET  /");

    console.log("GET  /health");

    console.log("GET  /api/ping");

    console.log("GET  /api/dashboard");

    console.log("GET  /api/jogos");

    console.log("GET  /api/analises");

    console.log("");

    console.log("==============================================");

});
