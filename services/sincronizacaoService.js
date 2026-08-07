// ==================================================
// BetVision AI
// services/sincronizacaoService.js
// Versão Neon PostgreSQL + Football-Data.org v4
// Sincronização de Campeonatos Reais
// ==================================================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
    conectarBanco
} from "./services/bancoService.js";


import {
    iniciarSincronizacao,
    ativarAgendamento
} from "./services/sincronizacaoService.js";
// ==================================================
// CONFIGURAÇÃO API
// ==================================================

const API_URL =
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";


const API_KEY =
    process.env.API_FOOTBALL_KEY;



// ==================================================
// BUSCAR CAMPEONATOS NA API
// ==================================================

export async function buscarCampeonatosAPI(){

    try {


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
                        "X-Auth-Token": API_KEY
                    },

                    timeout:15000

                }
            );


        return resposta.data.competitions || [];


    } catch(error){


        console.error(
            "Erro API Football-Data:",
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
            campeonato.name || "Desconhecido",


        pais:
            campeonato.area?.name || "Internacional",


        continente:
            campeonato.area?.code || null,


        temporada:
            campeonato.currentSeason?.startDate
                ?.substring(0,4)
                || null,


        logo:
            campeonato.emblem || null,


        ativo:true


    };


}
// ==================================================
// INSERIR / ATUALIZAR CAMPEONATO NO POSTGRESQL
// ==================================================

async function salvarCampeonato(campeonato){


    const sql = `

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

    `;



    try{


        const resultado =
            await query(
                sql,
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



    }catch(error){


        console.error(
            "Erro ao salvar campeonato:",
            error.message
        );


        return null;


    }


}




// ==================================================
// SINCRONIZAR TODOS OS CAMPEONATOS
// ==================================================

export async function sincronizarCampeonatos(){


    console.log(
        "🌍 Iniciando sincronização de campeonatos..."
    );



    const lista =
        await buscarCampeonatosAPI();



    if(!lista.length){


        console.log(
            "⚠️ Nenhum campeonato recebido da API"
        );


        return {

            sucesso:false,

            total:0

        };


    }



    let salvos = 0;



    for(const item of lista){


        const campeonato =
            normalizarCampeonato(item);



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
// SINCRONIZAÇÃO AUTOMÁTICA
// ==================================================

import cron from "node-cron";


// ==================================================
// EXECUTAR AO INICIAR O SISTEMA
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


    }catch(error){


        console.error(
            "Erro inicial sincronização:",
            error.message
        );


    }


}



// ==================================================
// CRON
// Atualiza a cada 24 horas
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
