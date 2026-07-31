// ==========================================
// BetVision AI
// services/sincronizacaoService.js
// Versão 6.0
// ==========================================

import { buscarCampeonatos } from "./campeonatoService.js";
import { inserirCampeonato } from "./bancoService.js";

// ==========================================
// SINCRONIZAR CAMPEONATOS
// ==========================================

export async function sincronizarSistema() {

    console.log("🌎 Iniciando sincronização dos campeonatos...");

    try {

        const campeonatos = await buscarCampeonatos();

        if (!Array.isArray(campeonatos)) {

            throw new Error(
                "buscarCampeonatos() não retornou um array."
            );

        }

        console.log(
            `📦 ${campeonatos.length} campeonatos encontrados`
        );

        let inseridos = 0;
        let erros = 0;

        for (const campeonato of campeonatos) {

            try {

                await inserirCampeonato(campeonato);

                inseridos++;

            } catch (erro) {

                erros++;

                console.error(
                    `❌ ${campeonato.nome}: ${erro.message}`
                );

            }

        }

        console.log(
            `✅ Sincronização concluída`
        );

        console.log(
            `✔ ${inseridos} campeonatos processados`
        );

        if (erros > 0) {

            console.log(
                `⚠ ${erros} erros durante a sincronização`
            );

        }

        return {

            total: campeonatos.length,
            inseridos,
            erros,
            campeonatos

        };

    } catch (erro) {

        console.error(
            "❌ Erro na sincronização:",
            erro.message
        );

        return {

            total: 0,
            inseridos: 0,
            erros: 1,
            campeonatos: []

        };

    }

}

export default {

    sincronizarSistema

};
