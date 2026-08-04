// ==========================================
// BetVision AI
// services/historicoService.js
// Histórico dos Times via PostgreSQL
// Versão corrigida v2.0
// ==========================================


import db from "../database/database.js";



// ==========================================
// BUSCAR TIME PELO NOME
// ==========================================

async function buscarTime(nome){


    if(!nome){

        return null;

    }


    try{


        const resultado = await db.query(

            `
            SELECT
                id,
                nome
            FROM times
            WHERE
                LOWER(nome)
                LIKE
                LOWER($1)
            LIMIT 1
            `,
            [
                `%${nome}%`
            ]

        );



        if(resultado.rows.length){


            return resultado.rows[0];


        }



        console.log(

            "⚠️ Time não cadastrado:",
            nome

        );


        return null;



    }
    catch(error){


        console.error(

            "❌ Erro buscar time:",
            error.message

        );


        return null;


    }


}




// ==========================================
// BUSCAR PARTIDAS DO TIME
// ==========================================


async function buscarJogosTime(timeId){



    if(!timeId){


        return [];


    }




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



            INNER JOIN times tc

            ON tc.id = p.time_casa



            INNER JOIN times tf

            ON tf.id = p.time_fora



            WHERE


            (

                p.time_casa = $1

                OR

                p.time_fora = $1

            )

            AND


            (

                p.status = 'finalizado'

                OR

                p.status = 'FINISHED'

            )



            ORDER BY

                p.data_partida DESC



            LIMIT 10


            `,


            [

                timeId

            ]

        );





        return resultado.rows.map(jogo=>({



            data:

            jogo.data_partida,



            casa:

            jogo.casa,



            fora:

            jogo.fora,



            placar:{


                casa:

                Number(

                    jogo.gols_casa || 0

                ),



                fora:

                Number(

                    jogo.gols_fora || 0

                )

            }



        }));



    }
    catch(error){


        console.error(

            "❌ Erro buscar partidas:",
            error.message

        );



        return [];

    }



}





// ==========================================
// HISTÓRICO PADRÃO VAZIO
// ==========================================

function historicoVazio(){


    return {


        historicoCasa: [],


        historicoFora: []


    };


}




// ==========================================
// BUSCAR HISTÓRICO COMPLETO
// ==========================================


export async function buscarHistoricoJogo(


    timeCasa,


    timeFora


){



    console.log(

        "📊 Buscando histórico:",

        timeCasa

    );



    try{



        const equipeCasa =

            await buscarTime(

                timeCasa

            );



        const equipeFora =

            await buscarTime(

                timeFora

            );





        let historicoCasa=[];


        let historicoFora=[];




        if(equipeCasa){


            historicoCasa =

                await buscarJogosTime(

                    equipeCasa.id

                );


        }




        if(equipeFora){


            historicoFora =

                await buscarJogosTime(

                    equipeFora.id

                );


        }





        return {


            historicoCasa,


            historicoFora



        };



    }
    catch(error){



        console.error(

            "❌ Erro histórico:",

            error.message

        );



        return historicoVazio();



    }



}





// ==========================================
// EXPORTS
// ==========================================


export {


    buscarTime,

    buscarJogosTime


};



export default {


    buscarHistoricoJogo,

    buscarTime,

    buscarJogosTime


};
