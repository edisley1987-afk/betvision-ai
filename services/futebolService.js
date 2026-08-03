// ==========================================
// BetVision AI
// services/futebolService.js
// Football-Data.org v4
// Serviço central de partidas
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
// DATA
// ==========================================

function dataISO(data){

    return data
        .toISOString()
        .split("T")[0];

}



// ==========================================
// CONVERTER JOGO
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
// BUSCAR JOGOS
// ==========================================

export async function buscarJogos(){


    try{


        console.log(
            "⚽ Buscando jogos Football-Data"
        );


        if(!API_KEY){

            console.error(
                "❌ API KEY ausente"
            );

            return [];

        }



        const hoje =
            dataISO(new Date());



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
                            hoje,


                        dateTo:
                            hoje

                    },


                    timeout:
                        30000

                }

            );



        const partidas =
            resposta.data.matches || [];



        console.log(
            `📦 Partidas API: ${partidas.length}`
        );



        const validos = [

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
                validos.includes(
                    jogo.status
                )

            )

            .map(converter);



        console.log(
            `✅ Jogos enviados: ${jogos.length}`
        );



        return jogos;



    }
    catch(error){


        console.error(

            "❌ Erro Football-Data:",
            error.message

        );


        return [];

    }


}



// ==========================================
// COMPATIBILIDADE WEBSOCKET
// ==========================================

export async function buscarJogosHoje(){

    return await buscarJogos();

}



// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    buscarJogos,

    buscarJogosHoje

};
