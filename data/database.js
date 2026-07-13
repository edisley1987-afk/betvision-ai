import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);



sqlite3.verbose();



const caminhoBanco = path.join(

    __dirname,

    "../data",

    "betvision.db"

);



/*
 Criar pasta data
*/


if(!fs.existsSync(

    path.dirname(caminhoBanco)

)){

    fs.mkdirSync(

        path.dirname(caminhoBanco),

        {
            recursive:true
        }

    );

}



const db = new sqlite3.Database(

    caminhoBanco,

    (erro)=>{


        if(erro){

            console.error(

                "Erro banco:",
                erro

            );

        }
        else{

            console.log(

                "🗄️ SQLite conectado"

            );

        }


    }

);




/*
 Executar schema
*/


const schema = fs.readFileSync(

    path.join(

        __dirname,

        "schema.sql"

    ),

    "utf8"

);



db.exec(

    schema,

    (erro)=>{


        if(erro){

            console.error(

                "Erro criando tabelas",

                erro

            );

        }

        else{

            console.log(

                "✅ Banco estruturado"

            );

        }


    }

);




export default db;
