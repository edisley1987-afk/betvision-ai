// services/sincronizacaoService.js

import { buscarCampeonatos } from "./campeonatoService.js";
import { inserirCampeonato } from "./bancoService.js";

import { buscarJogosHoje } from "./futebolService.js";
import { inserirJogo } from "./jogoService.js";


export async function sincronizarSistema() {


    console.log("=================================");
    console.log("🚀 INICIANDO SINCRONIZAÇÃO");
    console.log("=================================");



    /*
    ================================
    CAMPEONATOS
    ================================
    */


    try {


        console.log("🏆 Sincronizando campeonatos...");


        const campeonatos = await buscarCampeonatos();


        console.log(
            `${campeonatos.length} campeonatos encontrados`
        );


        for (const campeonato of campeonatos) {

            try {

                await inserirCampeonato(campeonato);

            } catch (erro) {

                console.error(
                    "Erro campeonato:",
                    campeonato.nome,
                    erro.message
                );

            }

        }


    } catch (erro) {

        console.error(
            "Erro geral campeonatos:",
            erro.message
        );

    }



    /*
    ================================
    JOGOS DO DIA
    ================================
    */


    try {


        console.log("⚽ Buscando jogos de hoje...");


        const jogos = await buscarJogosHoje();



        console.log(
            `${jogos.length} jogos encontrados`
        );



        for (const jogo of jogos) {


            try {


                await inserirJogo(jogo);


            } catch (erro) {


                console.error(
                    "Erro jogo:",
                    erro.message
                );


            }


        }


    } catch (erro) {


        console.error(
            "Erro geral jogos:",
            erro.message
        );


    }



    console.log("=================================");
    console.log("✅ SINCRONIZAÇÃO FINALIZADA");
    console.log("=================================");


}
