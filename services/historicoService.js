// ==========================================
// BetVision AI
// services/historicoService.js
// Histórico de times e jogos
// Versão 10.0
// ==========================================


import db from "../database/database.js";





// ==========================================
// NORMALIZAR NOME DO TIME
// ==========================================


function normalizarNome(nome = ""){


    return nome

        .toLowerCase()

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .replace(
            /[^a-z0-9 ]/g,
            ""
        )

        .trim();


}







// ==========================================
// BUSCAR TIME POR NOME
// ==========================================


export async function buscarTimePorNome(nome){


    try{


        const nomeLimpo =
            normalizarNome(nome);



        const resultado = await db.query(`

            SELECT *

            FROM times

            WHERE

                LOWER(
                    TRANSLATE(
                        nome,
                        'áàãâäéèêëíìîïóòõôöúùûüç',
                        'aaaaaeeeeiiiiooooouuuuc'
                    )
                )

                LIKE $1


            LIMIT 1


        `,
        [

            `%${nomeLimpo}%`

        ]);





        if(resultado.rows.length){

            return resultado.rows[0];

        }





        /*
        Segunda tentativa:
        procura parecido
        */


        const todos =
            await db.query(`

                SELECT *

                FROM times

            `);




        const encontrado =
            todos.rows.find(time => {


                const banco =
                    normalizarNome(
                        time.nome
                    );


                return (

                    banco.includes(nomeLimpo)

                    ||

                    nomeLimpo.includes(banco)

                );


            });





        return encontrado || null;




    }
    catch(error){


        console.error(

            "Erro buscar time histórico:",

            error.message

        );


        return null;


    }


}








// ==========================================
// BUSCAR HISTÓRICO DO TIME
// ==========================================


export async function buscarHistoricoTime(nomeTime){



    try{



        console.log(

            `📊 Buscando histórico: ${nomeTime}`

        );





        const time =

            await buscarTimePorNome(
                nomeTime
            );





        if(!time){


            console.warn(

                `⚠️ Time não cadastrado: ${nomeTime}`

            );


            return {


                time:null,


                jogos:[],


                estatisticas:{



                    vitorias:0,

                    empates:0,

                    derrotas:0,

                    golsMarcados:0,

                    golsSofridos:0



                }



            };


        }







        /*
        Busca jogos futuros/passados
        */


        const jogos =
            await db.query(`


                SELECT *

                FROM jogos

                WHERE

                    mandante_id=$1

                    OR

                    visitante_id=$1


                ORDER BY data DESC


                LIMIT 10


            `,
            [

                time.id

            ]);







        return {


            time,


            jogos:

                jogos.rows,



            estatisticas:

                calcularEstatisticas(
                    jogos.rows,
                    time.id
                )



        };






    }
    catch(error){



        console.error(

            "Erro histórico time:",

            error.message

        );


        return {


            time:null,

            jogos:[],

            estatisticas:{}


        };


    }



}









// ==========================================
// CALCULAR ESTATÍSTICAS
// ==========================================


function calcularEstatisticas(

    jogos,

    timeId

){



    let vitorias = 0;

    let empates = 0;

    let derrotas = 0;

    let golsMarcados = 0;

    let golsSofridos = 0;





    for(const jogo of jogos){



        const mandante =
            jogo.mandante_id == timeId;



        const golsPro =
            mandante

            ?

            jogo.gols_mandante

            :

            jogo.gols_visitante;





        const golsContra =
            mandante

            ?

            jogo.gols_visitante

            :

            jogo.gols_mandante;






        golsMarcados +=
            golsPro || 0;



        golsSofridos +=
            golsContra || 0;






        if(
            golsPro >
            golsContra
        ){

            vitorias++;

        }

        else if(
            golsPro ===
            golsContra
        ){

            empates++;

        }

        else{

            derrotas++;

        }



    }





    return {


        jogos:

            jogos.length,


        vitorias,


        empates,


        derrotas,


        golsMarcados,


        golsSofridos



    };


}







// ==========================================
// EXPORT
// ==========================================


export default {


    buscarTimePorNome,

    buscarHistoricoTime


};
