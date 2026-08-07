// ==================================================
// BetVision AI
// services/sincronizacaoService.js
//
// Versão 5.0
// Neon PostgreSQL + Football-Data.org v4
//
// Sincronização automática de campeonatos
// ==================================================


import axios from "axios";

import cron from "node-cron";


import db from "../database/database.js";



// ==================================================
// CONFIGURAÇÃO FOOTBALL-DATA
// ==================================================

const API_URL =

    process.env.API_FOOTBALL_URL ||

    "https://api.football-data.org/v4";



const API_KEY =

    process.env.API_FOOTBALL_KEY;





// ==================================================
// BUSCAR CAMPEONATOS API
// ==================================================

export async function buscarCampeonatosAPI(){


    try{


        if(!API_KEY){


            console.log(

                "⚠️ API_FOOTBALL_KEY não configurada"

            );


            return [];


        }




        const resposta =

            await axios.get(

                `${API_URL}/competitions`,

                {


                    headers:{


                        "X-Auth-Token":

                            API_KEY


                    },


                    timeout:

                        15000


                }

            );



        return (

            resposta.data.competitions ||

            []

        );



    }

    catch(error){


        console.error(

            "❌ Erro Football-Data:",

            error.message

        );


        return [];


    }


}
// ==================================================
// NORMALIZAR CAMPEONATO
// ==================================================

function normalizarCampeonato(campeonato){


    return {


        api_id:

            campeonato.id || null,



        nome:

            campeonato.name ||

            "Desconhecido",



        pais:

            campeonato.area?.name ||

            "Internacional",



        continente:

            campeonato.area?.code ||

            null,



        temporada:

            campeonato.currentSeason?.startDate

                ?.substring(0,4)

            ||

            null,



        logo:

            campeonato.emblem ||

            null,



        ativo:

            true


    };


}





// ==================================================
// SALVAR CAMPEONATO POSTGRESQL
// ==================================================

async function salvarCampeonato(campeonato){


    try{


        const resultado =

            await db.query(


                `

                INSERT INTO campeonatos

                (

                    api_id,

                    nome,

                    pais,

                    continente,

                    temporada,

                    logo,

                    ativo

                )


                VALUES

                (

                    $1,

                    $2,

                    $3,

                    $4,

                    $5,

                    $6,

                    $7

                )


                ON CONFLICT (api_id)

                DO UPDATE SET


                    nome = EXCLUDED.nome,


                    pais = EXCLUDED.pais,


                    continente = EXCLUDED.continente,


                    temporada = EXCLUDED.temporada,


                    logo = EXCLUDED.logo,


                    ativo = EXCLUDED.ativo



                RETURNING *;

                `,


                [


                    campeonato.api_id,


                    campeonato.nome,


                    campeonato.pais,


                    campeonato.continente,


                    campeonato.temporada,


                    campeonato.logo,


                    campeonato.ativo


                ]


            );



        return resultado.rows[0];



    }


    catch(error){


        console.error(


            "❌ Erro salvar campeonato:",

            error.message

        );


        return null;


    }


}





// ==================================================
// SINCRONIZAR CAMPEONATOS
// ==================================================

export async function sincronizarCampeonatos(){


    console.log(

        "🌍 Iniciando sincronização de campeonatos..."

    );



    const lista =

        await buscarCampeonatosAPI();




    if(!lista.length){


        console.log(

            "⚠️ Nenhum campeonato recebido"

        );



        return {


            sucesso:false,


            total:0


        };


    }





    let salvos = 0;



    for(const item of lista){


        const campeonato =

            normalizarCampeonato(

                item

            );



        const resultado =

            await salvarCampeonato(

                campeonato

            );



        if(resultado){


            salvos++;


        }


    }





    console.log(

        `🏆 ${salvos} campeonatos sincronizados`

    );



    return {


        sucesso:true,


        total:salvos


    };


}
// ==================================================
// INICIAR SINCRONIZAÇÃO AO SUBIR SISTEMA
// ==================================================

export async function iniciarSincronizacao(){


    console.log(

        "🚀 Iniciando serviço de sincronização..."

    );



    try{


        const resultado =

            await sincronizarCampeonatos();



        console.log(

            "📊 Resultado sincronização:",

            resultado

        );



        return resultado;



    }

    catch(error){


        console.error(

            "❌ Erro inicial sincronização:",

            error.message

        );



        return {


            sucesso:false,


            erro:

                error.message


        };


    }


}





// ==================================================
// AGENDAMENTO AUTOMÁTICO
// Executa todos os dias às 03:00
// ==================================================

export function ativarAgendamento(){


    cron.schedule(


        "0 3 * * *",


        async()=>{


            console.log(

                "🔄 Atualização automática campeonatos"

            );



            await sincronizarCampeonatos();



        }


    );



    console.log(

        "⏰ Agendamento de campeonatos ativo"

    );


}
// ==================================================
// EXPORTS
// ==================================================

export default {


    buscarCampeonatosAPI,


    sincronizarCampeonatos,


    iniciarSincronizacao,


    ativarAgendamento


};
