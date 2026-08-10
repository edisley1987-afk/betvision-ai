```javascript
// ==========================================
// BetVision AI
// services/campeonatoService.js
// Football-Data.org v4
// Versão corrigida
// ==========================================

import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ==========================================
// CAMINHO DO ARQUIVO
// ==========================================

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


// ==========================================
// CONFIGURAÇÃO PADRÃO
// ==========================================

let config = {

    futebolApi: {

        baseUrl:
            "https://api.football-data.org/v4",

        apiKey: ""

    }

};


// ==========================================
// CARREGAR providers.json
// ==========================================

try {

    const arquivo =
        path.join(
            __dirname,
            "../config/providers.json"
        );

    if (
        fs.existsSync(arquivo)
    ) {

        const configuracao =
            JSON.parse(
                fs.readFileSync(
                    arquivo,
                    "utf8"
                )
            );

        if (
            configuracao &&
            configuracao.futebolApi
        ) {

            config = {

                ...config,

                ...configuracao,

                futebolApi: {

                    ...config.futebolApi,

                    ...configuracao.futebolApi

                }

            };

        }

    }

}
catch (erro) {

    console.warn(
        "⚠️ Não foi possível carregar providers.json:",
        erro.message
    );

}


// ==========================================
// CONFIGURAÇÃO DA API
// ==========================================

const API_KEY =
    process.env.API_FOOTBALL_KEY ||
    config.futebolApi?.apiKey ||
    "";

const BASE_URL =
    process.env.API_FOOTBALL_URL ||
    config.futebolApi?.baseUrl ||
    "https://api.football-data.org/v4";


// ==========================================
// NORMALIZAR CAMPEONATO
// ==========================================

function normalizarCampeonato(comp) {

    if (!comp) {

        return null;

    }

    const apiId =
        Number(comp.id);

    if (
        !Number.isFinite(apiId) ||
        apiId <= 0
    ) {

        return null;

    }

    const temporada =
        comp.currentSeason?.startDate
            ? new Date(
                comp.currentSeason.startDate
            ).getFullYear()
            : new Date().getFullYear();


    return {

        // IMPORTANTE:
        // NÃO usar "id" aqui.
        // O id interno é gerado pelo PostgreSQL.

        api_id:
            apiId,

        nome:
            comp.name ||
            "Campeonato não informado",

        pais:
            comp.area?.name ||
            "",

        continente:
            comp.area?.code ||
            "",

        temporada:
            String(temporada),

        logo:
            comp.emblem ||
            comp.logo ||
            null,

        tipo:
            comp.type ||
            "LEAGUE"

    };

}


// ==========================================
// BUSCAR CAMPEONATOS
// ==========================================

export async function buscarCampeonatos() {

    try {

        // ======================================
        // SEM API KEY
        // ======================================

        if (!API_KEY) {

            console.warn(
                "⚠️ API_FOOTBALL_KEY não configurada."
            );

            console.warn(
                "📦 Utilizando campeonatos locais."
            );

            return campeonatosBase();

        }


        console.log(
            "🌎 Buscando campeonatos Football-Data..."
        );


        // ======================================
        // CONSULTAR API
        // ======================================

        const resposta =
            await axios.get(

                `${BASE_URL}/competitions`,

                {

                    headers: {

                        "X-Auth-Token":
                            API_KEY

                    },

                    timeout:
                        15000

                }

            );


        const competicoes =
            resposta.data?.competitions ||
            [];


        // ======================================
        // NENHUM RESULTADO
        // ======================================

        if (
            !Array.isArray(
                competicoes
            ) ||
            competicoes.length === 0
        ) {

            console.warn(
                "⚠️ Nenhum campeonato retornado pela API."
            );

            console.warn(
                "📦 Utilizando campeonatos locais."
            );

            return campeonatosBase();

        }


        // ======================================
        // NORMALIZAR
        // ======================================

        const mapa =
            new Map();


        for (
            const competicao
            of competicoes
        ) {

            const campeonato =
                normalizarCampeonato(
                    competicao
                );


            if (
                !campeonato
            ) {

                continue;

            }


            // Evita duplicação pelo api_id

            if (
                !mapa.has(
                    campeonato.api_id
                )
            ) {

                mapa.set(

                    campeonato.api_id,

                    campeonato

                );

            }

        }


        const lista =
            Array.from(
                mapa.values()
            );


        console.log(
            `✅ ${lista.length} campeonatos encontrados`
        );


        return lista;

    }
    catch (erro) {

        console.error(

            "❌ Erro Football-Data:",

            erro.response?.data ||
            erro.message

        );


        console.warn(
            "📦 Utilizando campeonatos locais."
        );


        return campeonatosBase();

    }

}


// ==========================================
// BUSCAR CAMPEONATO POR API ID
// ==========================================

export async function buscarCampeonato(
    id
) {

    const lista =
        await buscarCampeonatos();


    const apiId =
        Number(id);


    return (

        lista.find(

            campeonato =>

                Number(
                    campeonato.api_id
                ) === apiId

        ) || null

    );

}


// ==========================================
// BUSCAR CAMPEONATO POR NOME
// ==========================================

export async function buscarCampeonatoNome(
    nome
) {

    if (
        !nome
    ) {

        return null;

    }


    const lista =
        await buscarCampeonatos();


    const termo =
        String(nome)
            .trim()
            .toLowerCase();


    return (

        lista.find(

            campeonato =>

                String(
                    campeonato.nome ||
                    ""
                )
                .toLowerCase()
                .includes(
                    termo
                )

        ) || null

    );

}


// ==========================================
// CAMPEONATOS LOCAIS
// ==========================================
//
// IMPORTANTE:
// "api_id" representa o ID externo.
// O "id" interno NÃO é definido aqui.
// O PostgreSQL gera automaticamente.
// ==========================================

function campeonatosBase() {

    return [

        {

            api_id: 2013,

            nome:
                "Brasileirão Série A",

            pais:
                "Brazil",

            continente:
                "BRA",

            temporada:
                "2026",

            tipo:
                "LEAGUE",

            logo:
                null

        },

        {

            api_id: 2014,

            nome:
                "Brasileirão Série B",

            pais:
                "Brazil",

            continente:
                "BRA",

            temporada:
                "2026",

            tipo:
                "LEAGUE",

            logo:
                null

        },

        {

            api_id: 2021,

            nome:
                "Premier League",

            pais:
                "England",

            continente:
                "ENG",

            temporada:
                "2026",

            tipo:
                "LEAGUE",

            logo:
                null

        },

        {

            api_id: 2014,

            nome:
                "La Liga",

            pais:
                "Spain",

            continente:
                "ESP",

            temporada:
                "2026",

            tipo:
                "LEAGUE",

            logo:
                null

        },

        {

            api_id: 2019,

            nome:
                "Serie A",

            pais:
                "Italy",

            continente:
                "ITA",

            temporada:
                "2026",

            tipo:
                "LEAGUE",

            logo:
                null

        },

        {

            api_id: 2002,

            nome:
                "Bundesliga",

            pais:
                "Germany",

            continente:
                "GER",

            temporada:
                "2026",

            tipo:
                "LEAGUE",

            logo:
                null

        },

        {

            api_id: 2015,

            nome:
                "Ligue 1",

            pais:
                "France",

            continente:
                "FRA",

            temporada:
                "2026",

            tipo:
                "LEAGUE",

            logo:
                null

        },

        {

            api_id: 2017,

            nome:
                "Primeira Liga",

            pais:
                "Portugal",

            continente:
                "POR",

            temporada:
                "2026",

            tipo:
                "LEAGUE",

            logo:
                null

        },

        {

            api_id: 2003,

            nome:
                "Eredivisie",

            pais:
                "Netherlands",

            continente:
                "NED",

            temporada:
                "2026",

            tipo:
                "LEAGUE",

            logo:
                null

        },

        {

            api_id: 2001,

            nome:
                "UEFA Champions League",

            pais:
                "Europe",

            continente:
                "EUR",

            temporada:
                "2026",

            tipo:
                "CUP",

            logo:
                null

        },

        {

            api_id: 2146,

            nome:
                "UEFA Europa League",

            pais:
                "Europe",

            continente:
                "EUR",

            temporada:
                "2026",

            tipo:
                "CUP",

            logo:
                null

        }

    ];

}


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    buscarCampeonatos,

    buscarCampeonato,

    buscarCampeonatoNome

};
```
