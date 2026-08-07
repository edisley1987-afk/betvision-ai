// ==================================================
// BETVISION AI
// database/database.js
// PostgreSQL NeonDB
// Versão 3.0
// ==================================================

import pg from "pg";
import dotenv from "dotenv";


dotenv.config();



const { Pool } = pg;



// ==================================================
// CONFIGURAÇÃO POOL POSTGRESQL
// ==================================================

const pool = new Pool({

    connectionString:
        process.env.DATABASE_URL,


    ssl:

        process.env.NODE_ENV === "production"

            ? {

                rejectUnauthorized:false

            }

            : false,


    max:10,


    idleTimeoutMillis:30000,


    connectionTimeoutMillis:10000


});





// ==================================================
// TESTE DE CONEXÃO
// ==================================================

export async function conectarBanco(){


    const cliente =
        await pool.connect();


    try{


        const resultado =
            await cliente.query(

                "SELECT NOW()"

            );


        console.log(

            "🟢 PostgreSQL OK:",

            resultado.rows[0].now

        );



    }
    finally{


        cliente.release();


    }


}





// ==================================================
// QUERY PADRÃO
// ==================================================

export async function query(

    texto,

    parametros=[]

){


    return await pool.query(

        texto,

        parametros

    );


}





// ==================================================
// EXPORTAR POOL
// ==================================================

export default pool;
