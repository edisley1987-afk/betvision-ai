import express from "express";
import cors from "cors";
import compression from "compression";

import api from "./routes/api.js";
import jogos from "./routes/jogos.js";

const app = express();

const PORT = process.env.PORT || 3000;

// ===============================
// MIDDLEWARES
// ===============================

app.use(cors());

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Log das requisições
app.use((req, res, next) => {
    console.log(
        `[${new Date().toLocaleString("pt-BR")}] ${req.method} ${req.url}`
    );
    next();
});

// ===============================
// ARQUIVOS ESTÁTICOS
// ===============================

app.use(express.static("public"));

// ===============================
// ROTAS
// ===============================

app.use("/api", api);

app.use("/api/jogos", jogos);

// ===============================
// ROTA PRINCIPAL
// ===============================

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/public/index.html");
});

// ===============================
// 404
// ===============================

app.use((req, res) => {

    res.status(404).json({

        erro: true,

        mensagem: "Rota não encontrada."

    });

});

// ===============================
// ERROS
// ===============================

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({

        erro: true,

        mensagem: "Erro interno do servidor."

    });

});

// ===============================
// INICIAR SERVIDOR
// ===============================

app.listen(PORT, () => {

    console.log("");

    console.log("=======================================");

    console.log("⚽ BETVISION AI");

    console.log("Servidor iniciado com sucesso");

    console.log("Porta:", PORT);

    console.log("URL Local: http://localhost:" + PORT);

    console.log("API Ping: /api/ping");

    console.log("API Dashboard: /api/dashboard");

    console.log("API Jogos: /api/jogos");

    console.log("=======================================");

});
