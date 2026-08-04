// ==========================================
// BetVision AI
// services/bancoService.js
// PostgreSQL
// Versão 8.0
// ==========================================


import db from "../database/database.js";




// ==========================================
// LISTAR CAMPEONATOS
// ==========================================


export async function listarCampeonatos(){


    try{


        const resultado =

            await db.query(`

                SELECT
                    id,
                    nome,
                    pais,
                    continente,
                    temporada

                FROM campeonatos

                ORDER BY nome

            `);



        return resultado.rows;



    }catch(error){


        console.error(

            "Erro listar campeonatos:",

            error.message

        );


        return [];

    }


}





// ==========================================
// INSERIR CAMPEONATO
// ==========================================


export async function inserirCampeonato(dados){


    try{


        const resultado =

            await db.query(

            `

            INSERT INTO campeonatos

            (

                id,
                nome,
                pais,
                continente,
                temporada

            )


            VALUES

            ($1,$2,$3,$4,$5)


            ON CONFLICT(id)

            DO UPDATE SET


                nome = EXCLUDED.nome,

                pais = EXCLUDED.pais,

                continente = EXCLUDED.continente,

                temporada = EXCLUDED.temporada



            RETURNING id;


            `,


            [

                dados.id,

                dados.nome,

                dados.pais || "",

                dados.continente || "",

                dados.temporada || "2026"

            ]

        );



        return resultado.rows[0];



    }catch(error){


        console.error(

            "Erro inserir campeonato:",

            error.message

        );


        throw error;


    }


}





// ==========================================
// LISTAR TIMES
// ==========================================


export async function listarTimes(){


    try{


        const resultado =

            await db.query(`

                SELECT

                    id,
                    campeonato_id,
                    nome,
                    pais

                FROM times

            `);



        return resultado.rows;



    }catch(error){



        console.error(

            "Erro listar times:",

            error.message

        );



        return [];

    }


}





// ==========================================
// INSERIR TIME
// ==========================================


export async function inserirTime(dados){


    try{


        const resultado =

            await db.query(

            `

            INSERT INTO times

            (

                id,

                campeonato_id,

                nome,

                pais


            )


            VALUES

            ($1,$2,$3,$4)


            ON CONFLICT(id)

            DO UPDATE SET


                nome = EXCLUDED.nome,

                pais = EXCLUDED.pais,

                campeonato_id = EXCLUDED.campeonato_id



            RETURNING id;


            `,


            [

                dados.id,

                dados.campeonato_id,

                dados.nome,

                dados.pais || ""

            ]

        );



        return resultado.rows[0];



    }catch(error){



        console.error(

            "Erro inserir time:",

            error.message

        );


        throw error;


    }


}





// ==========================================
// BUSCAR CAMPEONATO
// ==========================================


export async function buscarCampeonato(id){


    try{


        const resultado =

            await db.query(

            `

            SELECT *

            FROM campeonatos

            WHERE id=$1

            `,

            [

                id

            ]

        );



        return resultado.rows[0] || null;



    }catch(error){



        console.error(

            "Erro buscar campeonato:",

            error.message

        );


        return null;


    }


}





// ==========================================
// REMOVER CAMPEONATO
// ==========================================


export async function removerCampeonato(id){


    try{


        await db.query(

            `

            DELETE FROM campeonatos

            WHERE id=$1

            `,

            [

                id

            ]

        );


        return true;



    }catch(error){



        console.error(

            "Erro remover campeonato:",

            error.message

        );


        return false;


    }


}





// ==========================================
// EXPORT DEFAULT
// ==========================================


export default {


    listarCampeonatos,

    inserirCampeonato,

    listarTimes,

    inserirTime,

    buscarCampeonato,

    removerCampeonato


};
