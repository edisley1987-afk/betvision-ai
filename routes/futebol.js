import express from "express";


import {
buscarJogosHoje
}
from "../services/partidasService.js";


import {
buscarTimes
}
from "../services/timesService.js";


import {
buscarJogadores
}
from "../services/jogadoresService.js";


import {
buscarOddsReal
}
from "../services/oddsRealService.js";



const router = express.Router();



router.get(

"/jogos",

async(req,res)=>{


    const jogos =
    await buscarJogosHoje();


    res.json(jogos);


}

);



router.get(

"/times/:liga",

async(req,res)=>{


    const dados =

    await buscarTimes(

        req.params.liga

    );


    res.json(dados);


}

);



router.get(

"/jogadores/:time",

async(req,res)=>{


    const dados =

    await buscarJogadores(

        req.params.time

    );


    res.json(dados);


}

);



router.get(

"/odds/:partida",

async(req,res)=>{


    const dados =

    await buscarOddsReal(

        req.params.partida

    );


    res.json(dados);


}

);



export default router;
