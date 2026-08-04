// ==========================================
// BetVision AI
// services/futebolService.js
// Busca jogos reais
// ==========================================

import fs from "fs/promises";
import path from "path";
import {
    fileURLToPath
} from "url";


const __filename =
fileURLToPath(import.meta.url);


const __dirname =
path.dirname(__filename);



const FILE =

path.join(
    __dirname,
    "../data/jogos.json"
);





async function carregarArquivo(){


try{


const dados =

await fs.readFile(
    FILE,
    "utf8"
);



const json =

JSON.parse(dados);



if(Array.isArray(json)){

return json;

}



if(json.jogos){

return json.jogos;

}



return [];



}

catch(error){


console.log(
"⚠️ Jogos.json não encontrado"
);


return [];

}



}






function normalizar(jogo){


return {


id:

jogo.id ||

jogo.idEvent,



campeonato:

jogo.campeonato ||

jogo.league ||

"Futebol",



casa:

jogo.casa ||

jogo.homeTeam ||
jogo.strHomeTeam,



fora:

jogo.fora ||
jogo.awayTeam ||
jogo.strAwayTeam,



horario:

jogo.horario ||
jogo.dateEvent ||
jogo.utcDate,



status:

jogo.status ||
"SCHEDULED"



};


}








export async function buscarJogos(){



const jogos =

await carregarArquivo();




const resultado =

jogos.map(normalizar)

.filter(

j =>

j.casa &&
j.fora

);





console.log(

`⚽ ${resultado.length} jogos carregados`

);



return resultado;



}







export default {

buscarJogos

};
