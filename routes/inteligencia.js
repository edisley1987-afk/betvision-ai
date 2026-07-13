import express from "express";


import {
analisarJogo
}
from "../ai/analiseJogo.js";


const router =
express.Router();



router.post(

"/analisar",

(req,res)=>{


    const resultado =

    analisarJogo(

        req.body

    );


    res.json(resultado);


}

);



export default router;
