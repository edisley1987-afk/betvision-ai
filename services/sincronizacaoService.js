// ==========================================
// BetVision AI
// services/sincronizacaoService.js
// Versão 12.0
// Sincronização Football-Data
// Campeonatos + Times
// ==========================================


import {

    buscarCompeticoes,

    buscarTimesCompeticao,

    normalizarTime

}
from "./apiFootballService.js";



import {

    inserirCampeonato,

    inserirTime

}
from "./bancoService.js";





// ==========================================
// DELAY
// ==========================================


function esperar(ms){

    return new Promise(resolve=>

        setTimeout(resolve,ms)

    );

}





// ==========================================
// SINCRONIZAÇÃO
// ==========================================


export async function sincronizarSistema(){



console.log("================================");
console.log("🌎 INICIANDO SINCRONIZAÇÃO");
console.log("================================");



let totalCampeonatos = 0;

let totalTimes = 0;

let erros = 0;





try{



const campeonatosAPI =

await buscarCompeticoes();




if(!Array.isArray(campeonatosAPI)){


throw new Error(
"API não retornou campeonatos"
);


}





console.log(

`🏆 Campeonatos encontrados: ${campeonatosAPI.length}`

);





for(const campeonatoAPI of campeonatosAPI){



try{



const campeonato = {


id:

Number(campeonatoAPI.id),



nome:

campeonatoAPI.name ||

"Sem nome",



pais:

campeonatoAPI.area?.name ||

"",



codigo:

campeonatoAPI.code || ""



};






console.log(

`🏆 ${campeonato.nome}`

);






await inserirCampeonato(

campeonato

);



totalCampeonatos++;







await esperar(1500);







let timesAPI=[];



try{



timesAPI =

await buscarTimesCompeticao(

campeonato.id

);



}

catch(error){



console.log(

"⚠️ Erro buscando times:",

error.message

);



await esperar(5000);



continue;


}






if(!Array.isArray(timesAPI)){


continue;


}






console.log(

`⚽ ${timesAPI.length} times encontrados`

);








for(const item of timesAPI){



try{



const time =

normalizarTime(item);






if(!time || !time.id){


continue;


}






await inserirTime({



id:

Number(time.id),



campeonato_id:

Number(campeonato.id),



nome:

time.nome || "Sem nome",



pais:

time.pais || ""



});






totalTimes++;





}

catch(error){



erros++;


console.log(

"❌ Erro salvar time:",

error.message

);



}





await esperar(300);



}







}

catch(error){



erros++;


console.log(

"❌ Erro campeonato:",

campeonatoAPI.name,

error.message

);



}







// pausa entre campeonatos

await esperar(3000);



}








console.log("================================");
console.log("✅ SINCRONIZAÇÃO CONCLUÍDA");

console.log(

`🏆 Campeonatos: ${totalCampeonatos}`

);


console.log(

`⚽ Times cadastrados: ${totalTimes}`

);


console.log(

`⚠️ Erros: ${erros}`

);

console.log("================================");







return {


sucesso:true,


campeonatos:

totalCampeonatos,


times:

totalTimes,


erros



};






}
catch(error){



console.error(

"❌ Falha sincronização:",

error.message

);





return {


sucesso:false,


campeonatos:0,


times:0,


erros:1


};



}



}





export default {


sincronizarSistema


};
