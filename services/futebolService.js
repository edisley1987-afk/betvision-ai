// ==========================================
// BetVision AI
// services/futebolService.js
// Serviço central de partidas
// Football-Data.org v4
// Versão corrigida PRO
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
// COMPETIÇÕES SUPORTADAS
// ==========================================


const COMPETICOES_FREE = [


    "PL",     // Inglaterra


    "BL1",    // Alemanha


    "BSA",    // Brasil


    "CL",     // Champions


    "SA",     // Itália


    "PD",     // Espanha


    "FL1",    // França


    "PPL"     // Portugal


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
// CONVERSÃO PARTIDA
// ==========================================


function converter(match){


    return {


        id:

            match.id,



        campeonato:

            match.competition?.name ||

            "Futebol",



        codigoCompeticao:

            match.competition?.code ||

            "",



        pais:

            match.area?.name ||

            "",



        casa:

            match.homeTeam?.name ||

            "Casa",



        fora:

            match.awayTeam?.name ||

            "Fora",



        horario:

            match.utcDate || null,



        status:

            match.status ||

            "SCHEDULED",



        rodada:

            match.matchday || null,



        estadio:

            match.venue || "",



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
// CONSULTA FOOTBALL DATA
// ==========================================


async function consultarPeriodo(

    inicio,

    fim

){


    try{


        const resposta = await axios.get(


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


    catch(error){


        console.error(

            "❌ Erro consulta Football-Data:",

            error.response?.data ||

            error.message

        );



        return [];

    }


}









// ==========================================
// BUSCAR JOGOS
// ==========================================


export async function buscarJogos(){



    console.log("");

    console.log(

        "===================================="

    );

    console.log(

        "⚽ BUSCANDO JOGOS FOOTBALL DATA"

    );

    console.log(

        "===================================="

    );





    if(!API_KEY){


        console.error(

            "❌ FOOTBALL_DATA_KEY não configurada"

        );


        console.error(

            "Configure a variável no Render"

        );


        return [];

    }







    try{



        const hoje =

            new Date();



        const inicio =

            dataISO(hoje);





        console.log(

            "📅 Data inicial:",

            inicio

        );





        let partidas =

            await consultarPeriodo(

                inicio,

                inicio

            );





        console.log(

            `📦 Jogos hoje: ${partidas.length}`

        );









        // ==================================
        // BUSCA FUTURO 7 DIAS
        // ==================================


        if(partidas.length===0){



            const futuro =

                new Date();



            futuro.setDate(

                futuro.getDate()+7

            );





            const fim =

                dataISO(futuro);





            console.log(

                "🔎 Buscando próximos 7 dias:",

                fim

            );





            partidas =

                await consultarPeriodo(

                    inicio,

                    fim

                );





            console.log(

                `📦 Jogos encontrados período: ${partidas.length}`

            );



        }









        // ==================================
        // STATUS
        // ==================================


        const STATUS_VALIDOS = [


            "SCHEDULED",


            "TIMED",


            "IN_PLAY",


            "LIVE",


            "PAUSED",


            "FINISHED"


        ];









        const jogos =


            partidas


            .filter(jogo=>{


                return STATUS_VALIDOS.includes(

                    jogo.status

                );


            })


            .map(converter);









        console.log(

            `✅ Jogos enviados: ${jogos.length}`

        );





        if(jogos.length===0){


            console.log(

                "⚠️ Nenhuma partida encontrada no período"

            );


        }






        return jogos;





    }


    catch(error){


        console.error(

            "❌ Falha buscar jogos:",

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
// EXPORT DEFAULT
// ==========================================


export default {


    buscarJogos,


    buscarJogosHoje


};
