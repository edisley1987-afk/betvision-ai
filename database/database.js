import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


sqlite3.verbose();


const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);



const pastaData = path.join(
    __dirname,
    "../data"
);



if(!fs.existsSync(pastaData)){

    fs.mkdirSync(
        pastaData,
        {
            recursive:true
        }
    );

}



const caminhoBanco = path.join(
    pastaData,
    "betvision.db"
);



const db = new sqlite3.Database(

    caminhoBanco,

    (erro)=>{

        if(erro){

            console.error(
                "Erro SQLite:",
                erro
            );

        }else{

            console.log(
                "🗄️ SQLite conectado"
            );

        }

    }

);



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
                "Erro criando tabelas:",
                erro
            );

        }else{

            console.log(
                "✅ Banco estruturado"
            );

        }

    }

);



export default db;
