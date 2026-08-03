// ==========================================
// BetVision AI
// services/futebolService.js
// Football-Data.org v4
// Jogos somente de hoje
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
// FORMATAR DATA
// ==========================================

function formatarData(data) {

    return data.toISOString()
        .split("T")[0];

}



// ==========================================
// DATA BRASIL
// ==========================================

function dataBrasil(dataUTC) {


    return new Date(dataUTC)
        .toLocaleDateString(
            "pt-BR",
            {
                timeZone:"America/Sao_Paulo"
            }
        );

}



// ==========================================
// VERIFICAR SE É HOJE
// ==========================================

function ehHoje(dataUTC) {


    const hoje = new Date()
        .toLocaleDateString(
            "pt-BR",
            {
                timeZone:"America/Sao_Paulo"
            }
        );


    const jogo = dataBrasil(dataUTC);


    return hoje === jogo;

}



// ==========================================
// FORMATAR JOGO
// ==========================================

function converterPartida(match) {


    return {


        id: match.id,


        campeonato:
            match.competition?.name || "-",


        pais:
            match.area?.name || "-",


        casa:
            match.homeTeam?.name || "-",


        fora:
            match.awayTeam?.name || "-",


        horario:
            match.utcDate,


        status:
            match.status,


        rodada:
            match.matchday || null,


        estadio:
            match.venue || "-",



        escudos:{


            casa:
                match.homeTeam?.crest || "",


            fora:
                match.awayTeam?.crest || ""

        }


    };


}



// ==========================================
// BUSCAR JOGOS DE HOJE
// ==========================================

export async function buscarJogos() {


    try {


        console.log("");
        console.log("====================================");
        console.log("⚽ BETVISION AI");
        console.log("📅 BUSCANDO JOGOS DE HOJE");
        console.log("====================================");



        if(!API_KEY){


            console.error(
                "❌ API KEY FOOTBALL DATA AUSENTE"
            );


            return [];

        }



        console.log(
            "✅ API KEY carregada"
        );



        // ==================================
        // DATA ATUAL
        // ==================================

        const hoje = new Date();


        const dataHoje =
            formatarData(hoje);



        console.log(
            "📅 Data consulta:",
            dataHoje
        );




        // ==================================
        // CONSULTA API
        // SOMENTE HOJE
        // ==================================

        const resposta =
            await axios.get(


                `${BASE_URL}/matches`,


                {


                    headers:{


                        "X-Auth-Token":
                            API_KEY

                    },


                    params:{


                        dateFrom:
                            dataHoje,


                        dateTo:
                            dataHoje


                    },


                    timeout:
                        30000


                }


            );




        const partidas =
            resposta.data.matches || [];



        console.log(
            `📦 API retornou ${partidas.length} partidas`
        );





        // ==================================
        // STATUS ACEITOS
        // ==================================

        const STATUS_VALIDOS = [


            "SCHEDULED",
            "TIMED",
            "LIVE",
            "IN_PLAY",
            "PAUSED"


        ];




        let jogos =
            partidas.filter(partida =>


                STATUS_VALIDOS.includes(
                    partida.status
                )


            );




        console.log(
            `✅ Após status: ${jogos.length}`
        );





        // ==================================
        // GARANTIR HORÁRIO BRASIL
        // ==================================

        jogos =
            jogos.filter(jogo =>


                ehHoje(
                    jogo.utcDate
                )


            );




        console.log(
            `🇧🇷 Jogos hoje Brasil: ${jogos.length}`
        );





        // ==================================
        // ORDENAR HORÁRIO
        // ==================================

        jogos.sort((a,b)=>


            new Date(a.utcDate)
            -
            new Date(b.utcDate)


        );






        // ==================================
        // CONVERTER
        // ==================================

        const resultado =

            jogos.map(
                converterPartida
            );






        console.log(
            `⚽ Jogos enviados: ${resultado.length}`
        );



        console.log(
            "===================================="
        );



        return resultado;



    }
    catch(erro){



        console.error("");
        console.error(
            "❌ ERRO FOOTBALL DATA"
        );



        if(erro.response){


            console.error(
                "Status:",
                erro.response.status
            );


            console.error(
                erro.response.data
            );


        }
        else{


            console.error(
                erro.message
            );


        }



        return [];

    }


}



// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {


    buscarJogos

};
