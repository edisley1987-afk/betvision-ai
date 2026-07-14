// ==========================================
// BetVision AI
// services/sincronizacaoService.js
// ==========================================


import { buscarCampeonatos } from "./campeonatoService.js";
import { inserirCampeonato } from "./bancoService.js";



// ==========================================
// SINCRONIZAR CAMPEONATOS
// ==========================================

export async function sincronizarSistema() {


    console.log("Sincronizando campeonatos...");


    try {


        const campeonatos = await buscarCampeonatos();



        console.log(
            `${campeonatos.length} campeonatos encontrados na API`
        );



        for (const campeonato of campeonatos) {


            try {


                await inserirCampeonato(campeonato);



            } catch (erro) {


                console.error(
                    `Erro ao salvar ${campeonato.nome}:`,
                    erro.message
                );


            }


        }



        console.log(
            "✅ Sincronização concluída"
        );



        return campeonatos;



    } catch (erro) {


        console.error(
            "Erro na sincronização:",
            erro.message
        );


        throw erro;


    }


}
