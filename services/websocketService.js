// ==========================================
// BetVision AI
// services/websocketService.js
// WebSocket Real Time v1.0
// ==========================================

import { WebSocketServer } from "ws";

import { buscarJogos } from "./futebolService.js";

import { listarCampeonatos } from "./bancoService.js";


// clientes conectados

let clientes = [];



// ==========================================
// INICIAR WEBSOCKET
// ==========================================

export function startWS(server) {


    const wss =
        new WebSocketServer({
            server
        });



    console.log("🔵 WebSocket iniciado");



    wss.on(
        "connection",
        (socket) => {


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
                () => {


                    clientes =
                        clientes.filter(
                            c => c !== socket
                        );


                    console.log(
                        "⚪ WebSocket desconectado"
                    );


                }
            );



        }
    );



    // Atualiza dashboard

    setInterval(

        async () => {


            try {


                const jogos =
                    await buscarJogos();



                const campeonatos =
                    await listarCampeonatos();



                const dados = {


                    tipo:
                        "dashboard",



                    dashboard: {


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


                };



                enviarTodos(dados);



            }

            catch (erro) {


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
// ENVIAR PARA TODOS
// ==========================================

function enviarTodos(dados) {


    const mensagem =
        JSON.stringify(dados);



    clientes.forEach(

        cliente => {


            if (
                cliente.readyState === 1
            ) {


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
