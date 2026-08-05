/*
==================================================
BETVISION AI
database/criarTabelas.js
Versão PostgreSQL v4.1
==================================================
*/

import db from "./database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



async function criarTabelas(){


    try {


        console.log("🚀 Inicializando banco BetVision AI");


        // caminho do schema.sql

        const schemaPath = path.join(
            __dirname,
            "schema.sql"
        );


        const schema = fs.readFileSync(
            schemaPath,
            "utf8"
        );



        console.log("📄 Schema carregado");



        // executa todas as tabelas

        await db.query(schema);



        console.log("");


        console.log("================================");
        console.log("✅ Banco BetVision AI pronto");
        console.log("================================");


        console.log("");


        // valida tabelas principais


        const tabelas = [

            "campeonatos",

            "times",

            "jogadores",

            "partidas",

            "odds",

            "analises_ia",

            "valuebets",

            "previsoes_ia",

            "apostas_historico",

            "usuarios"

        ];



        for(const tabela of tabelas){


            const resultado = await db.query(

                `
                SELECT EXISTS (

                    SELECT FROM information_schema.tables

                    WHERE table_name=$1

                );
                `,

                [tabela]

            );



            if(resultado.rows[0].exists){

                console.log(
                    `✅ Tabela ${tabela} OK`
                );

            } else {

                console.log(
                    `❌ Falha tabela ${tabela}`
                );

            }


        }



        console.log("");

        console.log(
            "🎯 Estrutura PostgreSQL finalizada"
        );



        await db.end();


        process.exit(0);



    } catch(error){


        console.error(
            "❌ Erro criando banco:",
            error
        );


        await db.end();


        process.exit(1);


    }


}



criarTabelas();
