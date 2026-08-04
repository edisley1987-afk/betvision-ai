// ==========================================
// BetVision AI
// database/database.js
// PostgreSQL Connection + Auto Migration
// Versão 3.0
// ==========================================


import pkg from "pg";

const { Pool } = pkg;



// ==========================================
// CONEXÃO POSTGRESQL
// ==========================================

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




// ==========================================
// CRIAR TABELAS
// ==========================================


async function criarTabelas(){


    const client = await pool.connect();


    try{


        console.log(
            "🛠️ Verificando tabelas PostgreSQL..."
        );



        await client.query(`



        CREATE TABLE IF NOT EXISTS campeonatos (


            id INTEGER PRIMARY KEY,


            nome VARCHAR(150) NOT NULL,


            pais VARCHAR(100),


            continente VARCHAR(100),


            temporada VARCHAR(20),


            ativo BOOLEAN DEFAULT TRUE,


            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP


        );





        CREATE TABLE IF NOT EXISTS times (


            id INTEGER PRIMARY KEY,


            campeonato_id INTEGER,


            nome VARCHAR(150) NOT NULL,


            pais VARCHAR(100),


            ataque INTEGER DEFAULT 50,


            defesa INTEGER DEFAULT 50,


            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP


        );





        CREATE TABLE IF NOT EXISTS partidas (


            id INTEGER PRIMARY KEY,


            campeonato_id INTEGER,


            time_casa INTEGER,


            time_fora INTEGER,


            data_partida TIMESTAMP,


            gols_casa INTEGER DEFAULT 0,


            gols_fora INTEGER DEFAULT 0,


            status VARCHAR(30) DEFAULT 'agendada',


            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP


        );





        CREATE TABLE IF NOT EXISTS jogos (


            id SERIAL PRIMARY KEY,


            campeonato VARCHAR(150),


            casa VARCHAR(150),


            fora VARCHAR(150),


            horario TIMESTAMP,


            status VARCHAR(50),


            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP


        );





        CREATE TABLE IF NOT EXISTS odds (


            id SERIAL PRIMARY KEY,


            partida_id INTEGER,


            mercado VARCHAR(100),


            selecao VARCHAR(150),


            odd NUMERIC(8,2),


            casa_aposta VARCHAR(100),


            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP


        );





        CREATE TABLE IF NOT EXISTS analises (


            id SERIAL PRIMARY KEY,


            partida_id INTEGER,


            probabilidade_casa NUMERIC(5,2),


            probabilidade_empate NUMERIC(5,2),


            probabilidade_fora NUMERIC(5,2),


            recomendacao TEXT,


            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP


        );





        CREATE TABLE IF NOT EXISTS valuebets (


            id SERIAL PRIMARY KEY,


            jogo TEXT,


            mercado VARCHAR(100),


            selecao VARCHAR(150),


            odd NUMERIC(8,2),


            probabilidade NUMERIC(5,2),


            valor_esperado NUMERIC(8,2),


            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP


        );





        CREATE TABLE IF NOT EXISTS usuarios (


            id SERIAL PRIMARY KEY,


            nome VARCHAR(150),


            email VARCHAR(200) UNIQUE,


            senha TEXT,


            nivel VARCHAR(30) DEFAULT 'usuario',


            premium BOOLEAN DEFAULT FALSE,


            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP


        );




        CREATE INDEX IF NOT EXISTS idx_times_nome

        ON times(nome);




        CREATE INDEX IF NOT EXISTS idx_partidas_data

        ON partidas(data_partida);




        CREATE INDEX IF NOT EXISTS idx_campeonatos_nome

        ON campeonatos(nome);



        `);



        console.log(
            "✅ Tabelas PostgreSQL verificadas"
        );



    }
    catch(error){


        console.error(

            "❌ Erro criando tabelas:",

            error.message

        );


        throw error;


    }
    finally{


        client.release();


    }



}





// ==========================================
// CONEXÃO PRINCIPAL
// ==========================================


export async function conectarBanco(){


    try{


        const client = await pool.connect();


        console.log(
            "🐘 PostgreSQL conectado"
        );


        client.release();



        await criarTabelas();



    }
    catch(error){


        console.error(

            "❌ Erro PostgreSQL:",

            error.message

        );


        process.exit(1);


    }



}





// ==========================================
// TESTE DE BANCO
// ==========================================


export async function testarBanco(){


    try{


        const resultado = await pool.query(

            "SELECT NOW()"

        );


        return resultado.rows[0];



    }
    catch(error){


        console.error(error);


        return null;


    }


}





// ==========================================
// EXPORT
// ==========================================


export default pool;
