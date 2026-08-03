// ==========================================
// BetVision AI
// services/futebolService.js
// Football-Data.org v4
// Serviço central de partidas
// Versão corrigida
// ==========================================

import axios from "axios";


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const API_KEY =
    process.env.FOOTBALL_DATA_KEY ||
    process.env.API_FOOTBALL_KEY;


const BASE_URL =
    process.env.FOOTBALL_DATA_URL ||
    "https://api.football-data.org/v4";



// ==========================================
// COMPETIÇÕES FREE
// ==========================================

const COMPETICOES_FREE = [

    "PL",
    "BL1",
    "BSA",
    "CL",
    "SA",
    "PD",
    "FL1",
    "PPL"

];



// ==========================================
// DATA ISO
// ==========================================

function dataISO(data){

    return data
        .toISOString()
        .split("T")[0];

}



// ==========================================
// CONVERTER PARTIDA
// ==========================================

function converter(match){

    return {

        id:
            match.id,


        campeonato:
            match.competition?.name || "-",


        codigoCompeticao:
            match.competition?.code || "-",


        pais:
            match.area?.name || "-",


        casa:
            match.homeTeam?.name || "-",


        fora:
            match.awayTeam?.name || "-",


        horario:
            match.utcDate,


        status:
            match.status || "SCHEDULED",


        rodada:
            match.matchday || null,


        estadio:
            match.venue || "-",



        escudos:{


            casa:
                match.homeTeam?.crest || "",


            fora:
                match.awayTeam?.crest || ""

        },


        placar:{


            casa:
                match.score?.fullTime?.home ?? null,


            fora:
                match.score?.fullTime?.away ?? null


        }


    };

}



// ==========================================
// CONSULTAR FOOTBALL DATA
// ==========================================

async function consultarPeriodo(
    inicio,
    fim
){

    const resposta =
        await axios.get(

            `${BASE_URL}/matches`,

            {


                headers:{


                    "X-Auth-Token":
                        API_KEY


                },


                params:{


                    competitions:
                        COMPETICOES_FREE.join(","),


                    dateFrom:
                        inicio,


                    dateTo:
                        fim


                },


                timeout:
                    30000


            }

        );


    return resposta.data.matches || [];

}



// ==========================================
// BUSCAR JOGOS
// ==========================================

export async function buscarJogos(){


    try{


        console.log("");
        console.log("==============================");
        console.log("⚽ BUSCANDO JOGOS FOOTBALL DATA");
        console.log("==============================");



        if(!API_KEY){


            console.error(
                "❌ API KEY ausente"
            );


            return [];

        }




        const hoje =
            new Date();



        const dataHoje =
            dataISO(hoje);



        console.log(
            "📅 Hoje:",
            dataHoje
        );



        let partidas =
            await consultarPeriodo(

                dataHoje,

                dataHoje

            );



        console.log(
            `📦 Jogos hoje: ${partidas.length}`
        );



        // =====================================
        // FALLBACK 3 DIAS
        // =====================================


        if(partidas.length === 0){


            const futuro =
                new Date();


            futuro.setDate(
                futuro.getDate()+3
            );



            const dataFutura =
                dataISO(
                    futuro
                );



            console.log(
                "🔎 Nenhum jogo hoje."
            );


            console.log(
                "📅 Buscando próximos dias:",
                dataFutura
            );



            partidas =
                await consultarPeriodo(

                    dataHoje,

                    dataFutura

                );



            console.log(
                `📦 Próximos jogos encontrados: ${partidas.length}`
            );


        }




        const STATUS_VALIDOS = [


            "SCHEDULED",

            "TIMED",

            "LIVE",

            "IN_PLAY",

            "PAUSED"


        ];




        const jogos =


            partidas


            .filter(

                jogo =>

                STATUS_VALIDOS.includes(
                    jogo.status
                )

            )


            .map(
                converter
            );




        console.log(
            `✅ Jogos enviados: ${jogos.length}`
        );



        return jogos;



    }


    catch(error){


        console.error(

            "❌ Erro Football-Data:",

            error.response?.data ||
            error.message

        );


        return [];


    }


}



// ==========================================
// COMPATIBILIDADE
// ==========================================

export async function buscarJogosHoje(){

    return await buscarJogos();

}



// ==========================================
// EXPORT
// ==========================================

export default {


    buscarJogos,

    buscarJogosHoje


};
