// ==========================================
// BetVision AI
// services/oddsApi.js
// The Odds API v4
// Versão 7.0
// ==========================================

import axios from "axios";


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const API_KEY =
    process.env.ODDS_API_KEY;


const BASE_URL =
    process.env.ODDS_API_URL ||
    "https://api.the-odds-api.com/v4";


// ==========================================
// CONFIGURAÇÕES DE MERCADO
// ==========================================

const ESPORTE = "soccer";

const REGIAO = "eu";

const MERCADO = "h2h";

const FORMATO_ODDS = "decimal";



// ==========================================
// BUSCAR ODDS DA API
// ==========================================

export async function getOdds() {


    try {


        if(!API_KEY){


            console.error(
                "❌ ODDS_API_KEY não configurada."
            );


            return [];


        }



        console.log(
            "💰 Buscando odds The Odds API..."
        );



        const resposta = await axios.get(


            `${BASE_URL}/sports/${ESPORTE}/odds`,


            {


                params:{


                    apiKey: API_KEY,


                    regions: REGIAO,


                    markets: MERCADO,


                    oddsFormat: FORMATO_ODDS


                },


                timeout:30000


            }


        );



        const jogos =
            resposta.data || [];



        console.log(

            `✅ ${jogos.length} jogos com odds encontrados`

        );



        return jogos;



    }


    catch(error){



        console.error(
            "❌ Erro The Odds API:"
        );



        if(error.response){


            console.error(
                "Status:",
                error.response.status
            );


            console.error(
                error.response.data
            );


        }

        else{


            console.error(
                error.message
            );


        }



        return [];

    }


}



// ==========================================
// FORMATAR ODDS PARA O BETVISION AI
// ==========================================

export function formatarOdds(jogo){


    if(!jogo){


        return null;


    }



    return {


        id:
            jogo.id,



        esporte:
            jogo.sport_title || "Soccer",



        campeonato:
            jogo.league_title || "-",



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

                    book.markets?.map(
                        
                        mercado=>({


                            tipo:
                                mercado.key,


                            selecoes:
                                mercado.outcomes


                        })

                    )


            })) || []



    };


}



// ==========================================
// BUSCAR ODDS FORMATADAS
// ==========================================

export async function obterOdds(){



    const dados =
        await getOdds();



    return dados.map(
        
        formatarOdds

    );



}



// ==========================================
// BUSCAR UM JOGO PELO ID
// ==========================================

export async function buscarOddPorId(id){



    const jogos =
        await obterOdds();



    return jogos.find(

        jogo =>
            String(jogo.id)
            ===
            String(id)

    ) || null;



}



// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {


    getOdds,

    obterOdds,

    buscarOddPorId,

    formatarOdds


};
