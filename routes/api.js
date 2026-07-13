import { Router } from "express";

const router = Router();

router.get("/ping",(req,res)=>{

res.json({

status:"online",

sistema:"BetVision AI",

versao:"1.0.0",

data:new Date()

});

});

router.get("/dashboard",(req,res)=>{

res.json({

jogosHoje:0,

valueBets:0,

assertividade:0,

roi:0,

bankroll:0

});

});

export default router;
