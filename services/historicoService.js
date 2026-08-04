// ==========================================
// BetVision AI
// services/historicoService.js
// Histórico dos Times via PostgreSQL
// ==========================================


import db from "../database/database.js";



// ==========================================
// BUSCAR ID DO TIME
// ==========================================

async function buscarTime(nome){


    try{


        const resultado = await db.query(

            `
            SELECT 
                id,
                nome
            FROM times
            WHERE LOWER(nome) = LOWER($1)
            LIMIT 1
            `,
            [
                nome
            ]

        );


        if(resultado.rows.length){

            return resultado.rows[0];

        }


        console.log(
            "⚠️ Time não encontrado:",
            nome
        );


        return null;


    }
    catch(error){


        console.error(

            "Erro buscar time:",

            error.message

        );


        return null;


    }


}




// ==========================================
// BUSCAR ÚLTIMOS JOGOS DO TIME
// ==========================================


async function buscarJogosTime(timeId){


    try{


        const resultado = await db.query(

            `
            SELECT

                p.id,

                p.data_partida,

                tc.nome AS casa,

                tf.nome AS fora,

                p.gols_casa,

                p.gols_fora


            FROM partidas p


            JOIN times tc

                ON tc.id = p.time_casa


            JOIN times tf

                ON tf.id = p.time_fora


            WHERE

                (
                    p.time_casa = $1
                    OR
                    p.time_fora = $1
                )

            AND

                p.status = 'finalizado'


            ORDER BY

                p.data_partida DESC


            LIMIT 10

            `,
            [
                timeId
            ]

        );



        return resultado.rows.map(jogo=>{


            return {


                data:

                jogo.data_partida,



                casa:

                jogo.casa,



                fora:

                jogo.fora,



                placar:{


                    casa:

                    Number(jogo.gols_casa || 0),


                    fora:

                    Number(jogo.gols_fora || 0)


                }


            };


        });



    }
    catch(error){


        console.error(

            "Erro buscar jogos:",
            error.message

        );


        return [];


    }


}




// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================


export async function buscarHistoricoJogo(

    timeCasa,

    timeFora

){


    console.log(

        "📊 Buscando histórico:",
        timeCasa

    );


    const casa =

        await buscarTime(timeCasa);



    const fora =

        await buscarTime(timeFora);




    let historicoCasa=[];

    let historicoFora=[];




    if(casa){


        historicoCasa =

            await buscarJogosTime(

                casa.id

            );


    }



    if(fora){


        historicoFora =

            await buscarJogosTime(

                fora.id

            );


    }





    return {


        historicoCasa,

        historicoFora


    };


}





export default {


    buscarHistoricoJogo


};
