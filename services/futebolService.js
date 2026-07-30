// ==========================================
// BetVision AI
// services/futebolService.js
// API-FOOTBALL REAL v4.1
// ==========================================


import axios from "axios";



const BASE_URL =
process.env.API_FOOTBALL_URL ||
"https://v3.football.api-sports.io";



const API_KEY =
process.env.API_FOOTBALL_KEY;





// ==========================================
// BUSCAR JOGOS REAIS
// ==========================================


export async function buscarJogos(){


try{


if(!API_KEY){


console.warn(
"⚠ API_FOOTBALL_KEY não configurada"
);


return [];

}




const hoje =
new Date()
.toISOString()
.split("T")[0];




console.log(
"📅 Buscando jogos:",
hoje
);





const resposta =
await axios.get(


`${BASE_URL}/fixtures`,


{


headers:{


"x-apisports-key":

API_KEY


},


params:{


date:

hoje


},


timeout:

15000


}



);






console.log(

"API STATUS:",

resposta.status

);





if(

resposta.data.errors &&

Object.keys(
resposta.data.errors
).length

){


console.log(

"Erro API-Football:",

resposta.data.errors

);


return [];

}







const lista =

resposta.data.response || [];





const jogos =

lista.map(

(item)=>({



id:

item.fixture.id,



campeonato:

item.league.name,



pais:

item.league.country,



temporada:

item.league.season,



casa:

item.teams.home.name,



fora:

item.teams.away.name,



placarCasa:

item.goals.home,



placarFora:

item.goals.away,



horario:

item.fixture.date,



estadio:

item.fixture.venue?.name || "-",



status:

item.fixture.status.long,



minuto:

item.fixture.status.elapsed || 0,



escudos:{


casa:

item.teams.home.logo,


fora:

item.teams.away.logo


}



})

);






console.log(

`⚽ ${jogos.length} jogos encontrados`

);




return jogos;



}



catch(error){


console.error(


"❌ Erro API-Football:",

error.response?.data ||

error.message


);



return [];

}



}
