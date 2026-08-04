// ==========================================
// BetVision AI
// services/jogoBancoService.js
// Salvar jogos PostgreSQL
// Versão 2.0 - Corrigido Timestamp
// ==========================================


import db from "../database/database.js";



// ==========================================
// NORMALIZAR DATA DO JOGO
// ==========================================

function normalizarDataJogo(valor){


    if(!valor){

        return null;

    }



    // Já é timestamp ISO

    if(
        valor.includes("T")
    ){

        return valor;

    }



    // Formato somente hora
    // Ex: 20:00

    if(
        /^\d{2}:\d{2}$/.test(valor)
    ){


        const data =

            new Date()
            .toISOString()
            .split("T")[0];



        return `${data}T${valor}:00`;


    }



    // Caso venha outro formato

    return valor;


}





// ==========================================
// SALVAR UM JOGO
// ==========================================


export async function salvarJogo(jogo){


    try{


        const dataJogo =

            normalizarDataJogo(
                jogo.horario
            );



        await db.query(


        `

        INSERT INTO jogos

        (

            api_id,

            campeonato,

            time_casa,

            time_fora,

            data_jogo,

            status

        )


        VALUES

        (

            $1,

            $2,

            $3,

            $4,

            $5,

            $6

        )


        ON CONFLICT(api_id)

        DO UPDATE SET


            campeonato =
            EXCLUDED.campeonato,


            time_casa =
            EXCLUDED.time_casa,


            time_fora =
            EXCLUDED.time_fora,


            data_jogo =
            EXCLUDED.data_jogo,


            status =
            EXCLUDED.status


        `,


        [


            jogo.id || null,


            jogo.campeonato || "-",


            jogo.casa || "-",


            jogo.fora || "-",


            dataJogo,


            jogo.status || "SCHEDULED"


        ]


        );



        console.log(

            "💾 Jogo salvo:",

            jogo.casa,

            "x",

            jogo.fora

        );



        return true;



    }


    catch(error){


        console.error(


            "❌ Erro salvar jogo:",

            error.message

        );


        return false;


    }


}







// ==========================================
// SALVAR LISTA DE JOGOS
// ==========================================


export async function salvarListaJogos(

    jogos = []

){


    if(
        !Array.isArray(jogos)
    ){


        console.log(

            "⚠ Lista de jogos inválida"

        );


        return 0;


    }



    let total = 0;



    for(
        const jogo of jogos
    ){


        const salvo =

            await salvarJogo(
                jogo
            );



        if(salvo){

            total++;

        }


    }



    console.log(

        `⚽ ${total} jogos salvos no PostgreSQL`

    );



    return total;


}







// ==========================================
// LISTAR JOGOS BANCO
// ==========================================


export async function listarJogos(){


    try{


        const resultado =

            await db.query(


            `

            SELECT *

            FROM jogos

            ORDER BY data_jogo ASC


            `


            );



        return resultado.rows;



    }


    catch(error){


        console.error(


            "❌ Erro listar jogos:",

            error.message

        );


        return [];


    }


}







// ==========================================
// EXPORT
// ==========================================


export default {


    salvarJogo,

    salvarListaJogos,

    listarJogos


};
