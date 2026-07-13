import express from "express";
import cors from "cors";
import compression from "compression";

const app = express();

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

app.get("/api/ping", (req, res) => {
    res.json({
        status: "online",
        sistema: "BetVision AI",
        versao: "1.0.0",
        data: new Date()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 BetVision AI iniciado na porta ${PORT}`);
});
