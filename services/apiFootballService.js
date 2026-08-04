// ==========================================
// BetVision AI
// services/apiFootballService.js
// Versão 2.0
// Football-Data.org v4
// ==========================================


import axios from "axios";
import fs from "fs";




// ==========================================
// CARREGAR CONFIGURAÇÃO
// ==========================================


let config = {};


try {


    config = JSON.parse(

        fs.readFileSync(

            "./config/providers.json",

            "utf8"

        )

    );


}

catch(error){


    console.error(

        "❌ Erro lendo providers.json:",

        error.message

    );


}





const futebolConfig =

    config.futebolApi || {};





// ==========================================
// CLIENTE API
// ==========================================


const api = axios.create({


    baseURL:

        futebolConfig.baseUrl ||


        "https://api.football-data.org/v4",



    timeout:

        futebolConfig.timeout || 10000,



    headers:{


        "X-Auth-Token":

            futebolConfig.apiKey || ""


    }


});







// ==========================================
// CONSULTA GENÉRICA
// ==========================================


export async function consultarAPI(

    endpoint,

    params = {}

){



    try {



        const resposta = await api.get(

            endpoint,

            {

                params

            }

        );



        console.log(

            "📡 Football-Data OK:",

            endpoint

        );



        return resposta.data;



    }



    catch(error){



        console.error(

            "❌ Football-Data erro:",

            error.response?.data ||

            error.message

        );



        return {};



    }


}









// ==========================================
// BUSCAR COMPETIÇÕES
// ==========================================


export async function buscarCompeticoes(){


    const dados = await consultarAPI(

        "/competitions"

    );


    return dados.competitions || [];


}









// ==========================================
// BUSCAR JOGOS DA COMPETIÇÃO
// ==========================================


export async function buscarJogosCompeticao(

    codigo

){


    if(!codigo){

        return [];

    }



    const dados = await consultarAPI(

        `/competitions/${codigo}/matches`

    );



    return dados.matches || [];


}









// ==========================================
// BUSCAR TIMES DA COMPETIÇÃO
// ==========================================


export async function buscarTimesCompeticao(

    codigo

){



    if(!codigo){

        return [];

    }



    const dados = await consultarAPI(


        `/competitions/${codigo}/teams`


    );



    return dados.teams || [];



}









// ==========================================
// BUSCAR ELENCO DE UM TIME
// ==========================================


export async function buscarJogadoresTime(

    idTime

){



    if(!idTime){

        return [];

    }



    const dados = await consultarAPI(


        `/teams/${idTime}`


    );



    return dados.squad || [];



}









// ==========================================
// NORMALIZAR TIME
// ==========================================


export function normalizarTime(

    time = {}

){



    return {



        id:

            time.id || null,



        nome:

            time.name || "Sem nome",



        sigla:

            time.tla || "",



        pais:

            time.area?.name || "",



        fundacao:

            time.founded || null



    };



}









// ==========================================
// NORMALIZAR JOGADOR
// ==========================================


export function normalizarJogador(

    jogador = {}

){



    return {



        id:

            jogador.id || null,



        nome:

            jogador.name || "Sem nome",



        posicao:

            jogador.position || "",



        nascimento:

            jogador.dateOfBirth || null,



        nacionalidade:

            jogador.nationality || ""



    };


}









// ==========================================
// TESTE DE CONEXÃO
// ==========================================


export async function testarAPI(){



    const resposta =

        await consultarAPI(

            "/competitions"

        );



    return {


        online:

            Array.isArray(

                resposta.competitions

            ),



        total:

            resposta.competitions?.length || 0



    };


}









// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    consultarAPI,


    buscarCompeticoes,


    buscarJogosCompeticao,


    buscarTimesCompeticao,


    buscarJogadoresTime,


    normalizarTime,


    normalizarJogador,


    testarAPI


};
