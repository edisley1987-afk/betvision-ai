// ==========================================
// BetVision AI
// routes/analises.js
// Versão 9.0
// Engine IA + Jogos Reais + PostgreSQL
// ==========================================


import express from "express";

import {
    gerarAnalise
} from "../services/iaService.js";


import {
    buscarJogos
} from "../services/futebolService.js";


import db from "../database/database.js";


const router = express.Router();





// ==========================================
// LISTAR ANÁLISES
// GET /api/analises
// ==========================================


router.get("/", async(req,res)=>{


try{


const resultado = await db.query(`

SELECT *

FROM analises

ORDER BY id DESC

LIMIT 50

`);




res.json({

sucesso:true,

total:
resultado.rows.length,

analises:
resultado.rows


});



}

catch(error){


console.error(
error.message
);


res.status(500).json({

erro:
"Erro buscar análises",

detalhe:
error.message

});


}



});









// ==========================================
// GERAR TODAS AS ANÁLISES DOS JOGOS
// GET /api/analises/gerar
// ==========================================


router.get("/gerar", async(req,res)=>{


try{



const jogos =

await buscarJogos();





let salvas = 0;





for(const jogo of jogos){



const analise =

await gerarAnalise(

jogo

);





await db.query(

`

INSERT INTO analises

(

jogo,

favorito,

probabilidade,

probabilidade_casa,

probabilidade_empate,

probabilidade_fora,

placar_previsto,

gols_esperados,

value_bet,

confianca,

algoritmo

)


VALUES

($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)

`,

[


analise.jogo,


analise.favorito,


analise.probabilidade,


analise.probabilidade_casa,


analise.probabilidade_empate,


analise.probabilidade_fora,


analise.placar_previsto,


analise.gols_esperados,


analise.value_bet,


analise.confianca,


analise.algoritmo



]


);



salvas++;


}





res.json({

sucesso:true,

mensagem:
"Análises IA atualizadas",

total:
salvas


});





}

catch(error){


console.error(

"Erro gerar análises:",

error.message

);



res.status(500).json({

erro:
error.message

});


}



});









// ==========================================
// GERAR UMA ANÁLISE MANUAL
// POST /api/analises
// ==========================================


router.post("/", async(req,res)=>{


try{


const resultado =

await gerarAnalise(

req.body

);





await db.query(

`

INSERT INTO analises

(

jogo,

favorito,

probabilidade,

probabilidade_casa,

probabilidade_empate,

probabilidade_fora,

placar_previsto,

gols_esperados,

value_bet,

confianca,

algoritmo

)

VALUES

($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)

`,

[


resultado.jogo,


resultado.favorito,


resultado.probabilidade,


resultado.probabilidade_casa,


resultado.probabilidade_empate,


resultado.probabilidade_fora,


resultado.placar_previsto,


resultado.gols_esperados,


resultado.value_bet,


resultado.confianca,


resultado.algoritmo



]

);




res.json({

sucesso:true,

analise:resultado

});




}

catch(error){


res.status(500).json({

erro:
error.message

});


}



});







// ==========================================
// BUSCAR POR ID
// ==========================================


router.get("/:id", async(req,res)=>{


try{


const resultado =

await db.query(

`

SELECT *

FROM analises

WHERE id=$1

`

,

[req.params.id]

);




if(!resultado.rows.length){

return res.status(404).json({

erro:
"Análise não encontrada"

});

}



res.json(

resultado.rows[0]

);



}

catch(error){


res.status(500).json({

erro:error.message

});


}



});






export default router;
