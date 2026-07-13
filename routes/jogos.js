import { Router } from "express";

import { listarJogos } from "../services/jogosService.js";

const router = Router();

router.get("/", (req, res) => {

    const jogos = listarJogos();

    res.json(jogos);

});

export default router;
