// ==========================================
// BetVision AI
// services/futebolService.js
// API-FOOTBALL REAL
// ==========================================


import axios from "axios";



const BASE_URL =
process.env.API_FOOTBALL_URL ||
"https://v3.football.api-sports.io";



const API_KEY =
process.env.API_FOOTBALL_KEY;



// ==========================================
// BUSCAR JOGOS DO DIA
// ==========================================


export async function buscarJogos(){


try{


if(!API_KEY){


console.warn(
"API_FOOTBALL_KEY não configurada"
);


return [];

}



const hoje =
new Date()
.toISOString()
.split("T")[0];




const resposta = await axios.get(

`${BASE_URL}/fixtures`,

{


headers:{


"x-apisports-key":

API_KEY


},



params:{


date:hoje


},


timeout:15000


}


);





if(

!resposta.data.response

){


return [];

}





const jogos =

resposta.data.response.map(

(item)=>({



id:

item.fixture.id,



campeonato:

item.league.name,



pais:

item.league.country,



casa:

item.teams.home.name,



fora:

item.teams.away.name,



horario:

item.fixture.date,



estadio:

item.fixture.venue?.name || "-",



status:

item.fixture.status.long,



escudos:{


casa:

item.teams.home.logo,


fora:

item.teams.away.logo


}



})


);




console.log(

`⚽ ${jogos.length} jogos reais encontrados`

);



return jogos;



}

catch(error){



console.error(

"Erro API Football Jogos:",

error.message

);



return [];


}


}
