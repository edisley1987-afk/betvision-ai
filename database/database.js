// ==================================================
// BETVISION AI
// database/database.js
// PostgreSQL Connection v5.0
// ==================================================

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;


// ==================================================
// CONFIGURAÇÃO POSTGRESQL
// ==================================================

const pool = new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl:
        process.env.NODE_ENV === "production"
            ? {
                rejectUnauthorized: false
            }
            : false,


    max: 10,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 15000

});


// ==================================================
// EVENTOS DO BANCO
// ==================================================

pool.on(
    "connect",
    () => {

        console.log(
            "🟢 PostgreSQL conectado"
        );

    }
);


pool.on(
    "error",
    (erro) => {

        console.error(
            "🔴 Erro inesperado PostgreSQL:",
            erro.message
        );

    }
);



// ==================================================
// TESTE DE CONEXÃO
// ==================================================

export async function conectarBanco(){

    try{


        const resultado = await pool.query(
            "SELECT NOW() AS data"
        );


        console.log(
            "✅ Banco operacional:",
            resultado.rows[0].data
        );


        return true;


    }catch(erro){


        console.error(
            "❌ Falha conexão banco:",
            erro.message
        );


        throw erro;

    }

}



// ==================================================
// EXECUTAR QUERY PADRÃO
// ==================================================

export async function query(
    texto,
    parametros = []
){

    const inicio = Date.now();


    try{


        const resultado =
            await pool.query(
                texto,
                parametros
            );


        const tempo =
            Date.now() - inicio;


        if(
            process.env.NODE_ENV !== "production"
        ){

            console.log(
                `SQL executado ${tempo}ms`
            );

        }


        return resultado;


    }catch(erro){


        console.error(
            "Erro SQL:",
            erro.message
        );


        throw erro;

    }

}



// ==================================================
// TRANSAÇÃO
// ==================================================

export async function executarTransacao(
    callback
){

    const cliente =
        await pool.connect();


    try{


        await cliente.query(
            "BEGIN"
        );


        const resultado =
            await callback(cliente);


        await cliente.query(
            "COMMIT"
        );


        return resultado;


    }catch(erro){


        await cliente.query(
            "ROLLBACK"
        );


        throw erro;


    }finally{


        cliente.release();

    }

}



// ==================================================
// ENCERRAMENTO SEGURO
// ==================================================

export async function fecharBanco(){

    await pool.end();

    console.log(
        "Banco PostgreSQL encerrado"
    );

}



// ==================================================
// EXPORT PADRÃO
// ==================================================

export default pool;
