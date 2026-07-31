// ==========================================
// BetVision AI
// services/jogoBancoService.js
// Salvar jogos PostgreSQL
// ==========================================


import db from "../database/database.js";



// ==========================================
// SALVAR UM JOGO
// ==========================================

export async function salvarJogo(jogo){


    try{


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


            campeonato = EXCLUDED.campeonato,


            time_casa = EXCLUDED.time_casa,


            time_fora = EXCLUDED.time_fora,


            data_jogo = EXCLUDED.data_jogo,


            status = EXCLUDED.status


        `,


        [


            jogo.id,


            jogo.campeonato || "-",


            jogo.casa || "-",


            jogo.fora || "-",


            jogo.horario || null,


            jogo.status || "agendado"


        ]

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

        await salvarJogo(jogo);



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

        SELECT

            *

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





export default {


    salvarJogo,

    salvarListaJogos,

    listarJogos


};
