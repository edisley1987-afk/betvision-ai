// ==========================================
// BetVision AI
// services/websocketService.js
// WebSocket Real Time
// ==========================================

import { WebSocketServer } from "ws";

import {
    buscarJogosHoje
} from "./partidasService.js";

import {
    listarCampeonatos
} from "./bancoService.js";


let clientes = [];



// ==========================================
// START WEBSOCKET
// ==========================================

export function startWS(server) {


    const wss =
        new WebSocketServer({
            server
        });



    console.log("🔵 WebSocket iniciado");



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
                        new Date().toISOString()

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




    // Atualização automática

    setInterval(
        async()=>{


            try{


                const jogos =
                    await buscarJogosHoje();



                const campeonatos =
                    await listarCampeonatos();



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
                            6,


                        valueBets:
                            1,


                        modelo:
                            "Probabilidade + Estatística",


                        ultimaAtualizacao:
                            new Date().toISOString()


                    }


                });



            }
            catch(erro){


                console.error(
                    "Erro WebSocket:",
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
        JSON.stringify(dados);



    clientes.forEach(cliente=>{


        if(cliente.readyState === 1){


            cliente.send(
                mensagem
            );


        }


    });


}



export default {

    startWS

};
