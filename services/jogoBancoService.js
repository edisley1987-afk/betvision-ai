// ==========================================
// BetVision AI
// services/jogoBancoService.js
// Salvar jogos PostgreSQL
// ==========================================

import db from "../database/database.js";


// ==========================================
// SALVAR JOGO
// ==========================================

export async function salvarJogo(jogo) {


    try {


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

            ($1,$2,$3,$4,$5,$6)

            ON CONFLICT (api_id)

            DO UPDATE SET

            campeonato = EXCLUDED.campeonato,

            time_casa = EXCLUDED.time_casa,

            time_fora = EXCLUDED.time_fora,

            data_jogo = EXCLUDED.data_jogo,

            status = EXCLUDED.status

            `,


            [

                jogo.id,

                jogo.campeonato || "",

                jogo.casa || "",

                jogo.fora || "",

                jogo.horario,

                jogo.status || "agendado"

            ]

        );


        return true;


    }


    catch(error){


        console.error(

            "Erro salvar jogo:",

            error.message

        );


        return false;


    }


}



// ==========================================
// SALVAR LISTA DE JOGOS
// ==========================================

export async function salvarListaJogos(lista = []) {


    if(!Array.isArray(lista)){


        return 0;


    }



    let total = 0;



    for(const jogo of lista){


        const salvo =
            await salvarJogo(jogo);



        if(salvo){

            total++;

        }


    }



    console.log(

        `⚽ ${total} jogos salvos no banco`

    );



    return total;


}



export default {


    salvarJogo,

    salvarListaJogos


};
