// ==========================================
// BetVision AI
// services/historicoService.js
// Histórico de Jogos + Estatísticas
// Versão 8.0
// ==========================================


import db from "../database/database.js";




// ==========================================
// BUSCAR HISTÓRICO DE UM TIME
// ==========================================

export async function buscarHistoricoTime(
    time
){

    try{


        const resultado =

            await db.query(
                `
                SELECT
                    *
                FROM jogos
                WHERE
                    time_casa = $1
                    OR
                    time_fora = $1
                ORDER BY data_jogo DESC
                LIMIT 10
                `,
                [
                    time
                ]
            );



        return resultado.rows;



    }
    catch(error){


        console.error(
            "Erro histórico time:",
            error.message
        );


        return [];


    }


}





// ==========================================
// BUSCAR HISTÓRICO DO CONFRONTO
// ==========================================

export async function buscarHistoricoJogo(

    timeCasa,

    timeFora

){


    try{


        console.log(
            `📊 Buscando histórico: ${timeCasa}`
        );



        const casa =

            await buscarHistoricoTime(
                timeCasa
            );



        const fora =

            await buscarHistoricoTime(
                timeFora
            );





        return {


            historicoCasa:

                casa,


            historicoFora:

                fora



        };



    }
    catch(error){


        console.error(

            "Erro buscar histórico jogo:",
            error.message

        );



        return {


            historicoCasa: [],


            historicoFora: []

        };


    }


}






// ==========================================
// SALVAR HISTÓRICO
// ==========================================

export async function salvarHistoricoJogo(
    dados
){


    try{


        await db.query(

            `
            INSERT INTO jogos
            (
                id,
                time_casa,
                time_fora,
                gols_casa,
                gols_fora,
                data_jogo
            )

            VALUES
            ($1,$2,$3,$4,$5,$6)

            ON CONFLICT(id)

            DO NOTHING
            `,

            [

                dados.id,

                dados.time_casa,

                dados.time_fora,

                dados.gols_casa || 0,

                dados.gols_fora || 0,

                dados.data_jogo

            ]

        );



        return true;



    }
    catch(error){


        console.error(

            "Erro salvar histórico:",
            error.message

        );


        return false;


    }


}







// ==========================================
// ÚLTIMOS RESULTADOS
// ==========================================

export async function ultimosResultados(
    time
){


    try{


        const jogos =

            await buscarHistoricoTime(
                time
            );



        return jogos.map(jogo => ({


            data:

                jogo.data_jogo,


            casa:

                jogo.time_casa,


            fora:

                jogo.time_fora,


            golsCasa:

                jogo.gols_casa,


            golsFora:

                jogo.gols_fora



        }));



    }
    catch(error){


        console.error(
            "Erro resultados:",
            error.message
        );


        return [];


    }


}







// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {


    buscarHistoricoJogo,


    buscarHistoricoTime,


    salvarHistoricoJogo,


    ultimosResultados


};
