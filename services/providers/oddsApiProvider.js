// ==========================================
// BetVision AI
// services/providers/oddsApiProvider.js
// Integração The Odds API
// ==========================================

import axios from "axios";


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const API_KEY =
    process.env.ODDS_API_KEY;


const BASE_URL =
    process.env.ODDS_API_URL ||
    "https://api.the-odds-api.com";


// ==========================================
// ESPORTES SUPORTADOS
// ==========================================

const SPORT =
    "soccer";


const REGIONS =
    "eu";


const MARKETS =
    "h2h";


// ==========================================
// BUSCAR ODDS REAIS
// ==========================================

export async function buscarOddsReais(){


    try {


        if(!API_KEY){

            console.error(
                "❌ ODDS_API_KEY não configurada"
            );

            return [];

        }



        const resposta =
            await axios.get(

                `${BASE_URL}/v4/sports/${SPORT}/odds`,

                {

                    params:{

                        apiKey: API_KEY,

                        regions: REGIONS,

                        markets: MARKETS,

                        oddsFormat:"decimal"

                    },


                    timeout:30000

                }

            );



        const jogos =
            resposta.data || [];



        console.log(
            `💰 Odds encontradas: ${jogos.length}`
        );



        return jogos.map(jogo=>({


            id:

                jogo.id,


            esporte:

                jogo.sport_title,


            campeonato:

                jogo.league_title,


            horario:

                jogo.commence_time,


            casa:

                jogo.home_team,


            fora:

                jogo.away_team,


            bookmakers:

                jogo.bookmakers?.map(book=>({


                    nome:

                        book.title,


                    mercados:

                        book.markets?.map(m=>({


                            tipo:

                                m.key,


                            selecoes:

                                m.outcomes


                        }))


                })) || []



        }));



    }

    catch(error){


        console.error(

            "❌ Erro The Odds API:",

            error.response?.data ||
            error.message

        );


        return [];

    }


}



// ==========================================
// BUSCAR ODDS DE UM JOGO
// ==========================================

export async function buscarOddsJogo(id){


    const jogos =
        await buscarOddsReais();


    return jogos.find(

        jogo =>
        jogo.id === id

    ) || null;


}



// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    buscarOddsReais,

    buscarOddsJogo

};
