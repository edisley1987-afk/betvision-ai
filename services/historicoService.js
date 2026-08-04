// ==========================================
// BetVision AI
// services/historicoService.js
// Histórico de equipes com fallback seguro
// ==========================================


import axios from "axios";


// cache memória
const cacheHistorico = new Map();


// ==========================================
// BUSCAR TIME
// ==========================================

async function buscarTime(nome){

    try{

        if(!nome){

            return null;

        }


        console.log(
            "📊 Buscando histórico:",
            nome
        );


        const cache = cacheHistorico.get(nome);


        if(cache){

            return cache;

        }



        const resposta = await axios.get(

            "https://api.football-data.org/v4/teams",

            {

                params:{

                    name:nome

                },

                timeout:8000

            }

        );



        if(
            resposta.data &&
            resposta.data.teams &&
            resposta.data.teams.length
        ){

            const time =
                resposta.data.teams[0];


            cacheHistorico.set(
                nome,
                time
            );


            return time;

        }


        console.log(
            "⚠️ Time não encontrado:",
            nome
        );


        return null;



    }
    catch(error){


        console.log(
            "⚠️ API histórico indisponível:",
            error.response?.status ||
            error.message
        );


        return null;

    }


}




// ==========================================
// HISTÓRICO DE JOGOS
// ==========================================


export async function buscarHistoricoJogo(

    casa,

    fora

){


    try{


        const timeCasa =
            await buscarTime(casa);



        const timeFora =
            await buscarTime(fora);



        let historicoCasa=[];

        let historicoFora=[];



        /*
        Aqui entra consulta futura
        de partidas dos times.

        Por enquanto retorna
        estrutura compatível
        com IA.
        */



        return {


            historicoCasa,

            historicoFora,

            timeCasa,

            timeFora


        };



    }
    catch(error){


        console.error(

            "Erro histórico:",

            error.message

        );


        return {


            historicoCasa:[],

            historicoFora:[]


        };


    }



}




export default {


    buscarHistoricoJogo


};
