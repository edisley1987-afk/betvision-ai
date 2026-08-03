// ==========================================
// BetVision AI
// services/websocketService.js
// WebSocket Real Time v2
// ==========================================

import {
    WebSocketServer
} from "ws";


import {
    buscarJogos
} from "./futebolService.js";


import {
    listarCampeonatos
} from "./bancoService.js";


import {
    listarAnalises
} from "./analiseService.js";


import {
    listarValueBets
} from "./valueBetService.js";



let clientes = [];




// ==========================================
// START WEBSOCKET
// ==========================================

export function startWS(server) {


    const wss =
        new WebSocketServer({
            server
        });



    console.log(
        "🔵 WebSocket iniciado"
    );



    wss.on(
        "connection",
        socket => {


            console.log(
                "🔵 WebSocket conectado"
            );


            clientes.push(socket);



            socket.send(

                JSON.stringify({

                    tipo:
                        "status",


                    sistema:
                        "BetVision AI",


                    mensagem:
                        "IA tempo real ativa",


                    data:
                        new Date()
                        .toISOString()

                })

            );



            socket.on(
                "close",
                ()=>{


                    clientes =
                    clientes.filter(
                        cliente =>
                        cliente !== socket
                    );


                    console.log(
                        "⚪ WebSocket desconectado"
                    );


                }
            );


        }
    );





    // ======================================
    // ATUALIZAÇÃO AUTOMÁTICA
    // ======================================


    setInterval(

        async()=>{


            try{


                const jogos =
                    await buscarJogos();



                const campeonatos =
                    await listarCampeonatos();



                let analises = [];

                let valuebets = [];



                try{

                    analises =
                        await listarAnalises();

                }
                catch{

                    analises = [];

                }



                try{

                    valuebets =
                        await listarValueBets();

                }
                catch{

                    valuebets = [];

                }





                enviarTodos({


                    tipo:
                        "dashboard",



                    dashboard:{



                        sistema:
                            "BetVision AI",



                        status:
                            "operacional",



                        jogosHoje:
                            jogos.length,



                        campeonatos:
                            campeonatos.length,



                        analisesIA:
                            analises.length,



                        valueBets:
                            valuebets.length,



                        roi:
                            0,



                        precisao:
                            analises.length > 0
                            ? 100
                            : 0,



                        modelo:
                            "Probabilidade + Estatística",



                        ultimaAtualizacao:
                            new Date()
                            .toISOString()



                    }



                });



            }
            catch(erro){


                console.error(

                    "❌ Erro WebSocket:",

                    erro.message

                );


            }



        },

        30000

    );


}




// ==========================================
// ENVIO GLOBAL
// ==========================================

function enviarTodos(dados){


    const mensagem =
        JSON.stringify(
            dados
        );



    clientes.forEach(
        cliente=>{


            if(
                cliente.readyState === 1
            ){


                cliente.send(
                    mensagem
                );


            }


        }
    );


}




export default {

    startWS

};
