// ==========================================
// BetVision AI
// services/historicoService.js
// Histórico dos Times via PostgreSQL
// Versão 8.0
// ==========================================


import db from "../database/database.js";



// ==========================================
// NORMALIZAR NOME DO TIME
// ==========================================

function normalizarNome(nome = ""){


    return nome

        .toLowerCase()

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g,"")

        .replace(/\b(fc|fk|sk|afc|cf|sc|ac)\b/g,"")

        .replace(/[^a-z0-9 ]/g,"")

        .replace(/\s+/g," ")

        .trim();


}



// ==========================================
// BUSCAR TIME
// ==========================================

async function buscarTime(nome){


    try{


        if(!nome){

            return null;

        }


        const nomeNormalizado =
            normalizarNome(nome);



        const resultado =
            await db.query(

            `

            SELECT

                id,

                nome

            FROM times


            WHERE

                LOWER(nome) LIKE LOWER($1)


            LIMIT 1


            `,


            [

                `%${nomeNormalizado}%`

            ]);


        if(resultado.rows.length){


            return resultado.rows[0];


        }



        /*
        ======================================
        SEGUNDA TENTATIVA
        Busca removendo prefixos
        ======================================
        */


        const palavras =
            nomeNormalizado.split(" ");



        const resultado2 =
            await db.query(

            `

            SELECT

                id,

                nome

            FROM times


            WHERE

                LOWER(nome) LIKE LOWER($1)


            LIMIT 1


            `,


            [

                `%${palavras[palavras.length-1]}%`

            ]);



        if(resultado2.rows.length){


            return resultado2.rows[0];


        }



        console.log(

            "⚠️ Time não cadastrado:",

            nome

        );



        return null;



    }catch(error){


        console.error(

            "Erro buscar time:",

            error.message

        );


        return null;


    }


}





// ==========================================
// BUSCAR ÚLTIMOS JOGOS
// ==========================================


async function buscarJogosTime(timeId){


    try{


        const resultado =
            await db.query(

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

            ]);




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

                        Number(
                            jogo.gols_casa || 0
                        ),


                    fora:

                        Number(
                            jogo.gols_fora || 0
                        )


                }


            };


        });



    }catch(error){


        console.error(

            "Erro buscar jogos time:",

            error.message

        );


        return [];


    }


}





// ==========================================
// HISTÓRICO COMPLETO DA PARTIDA
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





// ==========================================
// EXPORT
// ==========================================


export default {


    buscarHistoricoJogo


};
