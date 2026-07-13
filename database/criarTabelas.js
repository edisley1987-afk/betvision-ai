import db from "./database.js";

async function criarTabelas(){

    try {

        await db.query(`
            CREATE TABLE IF NOT EXISTS campeonatos (

                id INTEGER PRIMARY KEY,

                nome VARCHAR(150) NOT NULL,

                pais VARCHAR(100),

                continente VARCHAR(100),

                temporada VARCHAR(20)

            );
        `);

        console.log("Tabela campeonatos criada/verificada!");

        process.exit();

    } catch(error){

        console.error("Erro criando tabela:", error);

        process.exit(1);

    }

}

criarTabelas();
