import db from "../database/database.js";



export function inserirCampeonato(dados){


    return new Promise(

        (resolve,reject)=>{


            db.run(

            `
            INSERT INTO campeonatos
            (
            id,
            nome,
            pais,
            continente,
            temporada
            )

            VALUES(?,?,?,?,?)
            `,


            [

                dados.id,

                dados.nome,

                dados.pais,

                dados.continente || "",

                dados.temporada || "2026"

            ],


            function(erro){


                if(erro)

                    reject(erro);


                else

                    resolve(this.lastID);


            });


        }

    );

}



export function listarCampeonatos(){


    return new Promise(

        (resolve,reject)=>{


            db.all(

            `
            SELECT *

            FROM campeonatos

            ORDER BY nome

            `,


            [],


            (erro,rows)=>{


                if(erro)

                    reject(erro);


                else

                    resolve(rows);


            });


        }

    );


}
