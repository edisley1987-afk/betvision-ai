import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let config = {
    futebolApi: {
        baseUrl: "https://v3.football.api-sports.io",
        apiKey: ""
    }
};

// Carrega providers.json caso exista
try {

    const caminho = path.join(
        __dirname,
        "../config/providers.json"
    );

    if (fs.existsSync(caminho)) {

        config = JSON.parse(
            fs.readFileSync(caminho, "utf8")
        );

    }

} catch (erro) {

    console.warn(
        "⚠ providers.json não encontrado. Utilizando configurações padrão."
    );

}

// Prioriza variável de ambiente do Render
const API_KEY =
    process.env.API_FOOTBALL_KEY ||
    config.futebolApi.apiKey;

const BASE_URL =
    process.env.API_FOOTBALL_URL ||
    config.futebolApi.baseUrl;

/*
====================================
BUSCAR CAMPEONATOS
====================================
*/

export async function buscarCampeonatos() {

    try {

        if (!API_KEY) {

            console.warn(
                "⚠ API_KEY não configurada. Utilizando base local."
            );

            return campeonatosBase();

        }

        console.log("🌎 Buscando campeonatos...");

        const resposta = await axios.get(

            `${BASE_URL}/leagues`,

            {

                headers: {

                    "x-apisports-key": API_KEY

                },

                timeout: 15000

            }

        );

console.log("STATUS:", resposta.status);
console.log("HEADERS:", resposta.headers);
console.log("BODY:", JSON.stringify(resposta.data, null, 2));

        if (!resposta.data.response) {

            return campeonatosBase();

        }

        const lista = resposta.data.response.map((liga) => ({

            id: liga.league.id,

            nome: liga.league.name,

            pais: liga.country.name,

            continente: liga.country.code || "",

            logo: liga.league.logo,

            tipo: liga.league.type,

            temporada:

                liga.seasons?.length
                    ? liga.seasons[liga.seasons.length - 1].year
                    : new Date().getFullYear()

        }));

        console.log(`✅ ${lista.length} campeonatos encontrados`);

        return lista;

    } catch (erro) {

        console.error(
            "Erro API Football:",
            erro.message
        );

        return campeonatosBase();

    }

}

/*
====================================
BUSCAR CAMPEONATO POR ID
====================================
*/

export async function buscarCampeonato(id) {

    const lista = await buscarCampeonatos();

    return lista.find(

        campeonato => campeonato.id == id

    ) || null;

}

/*
====================================
BUSCAR POR NOME
====================================
*/

export async function buscarCampeonatoNome(nome) {

    const lista = await buscarCampeonatos();

    return lista.find(

        campeonato =>

            campeonato.nome
                .toLowerCase()
                .includes(nome.toLowerCase())

    ) || null;

}

/*
====================================
CAMPEONATOS BASE
====================================
*/

function campeonatosBase() {

    return [

        {
            id: 71,
            nome: "Brasileirão Série A",
            pais: "Brasil",
            continente: "South America",
            temporada: 2026,
            tipo: "League"
        },

        {
            id: 72,
            nome: "Brasileirão Série B",
            pais: "Brasil",
            continente: "South America",
            temporada: 2026,
            tipo: "League"
        },

        {
            id: 39,
            nome: "Premier League",
            pais: "Inglaterra",
            continente: "Europe",
            temporada: 2026,
            tipo: "League"
        },

        {
            id: 140,
            nome: "La Liga",
            pais: "Espanha",
            continente: "Europe",
            temporada: 2026,
            tipo: "League"
        },

        {
            id: 135,
            nome: "Serie A",
            pais: "Itália",
            continente: "Europe",
            temporada: 2026,
            tipo: "League"
        },

        {
            id: 78,
            nome: "Bundesliga",
            pais: "Alemanha",
            continente: "Europe",
            temporada: 2026,
            tipo: "League"
        },

        {
            id: 61,
            nome: "Ligue 1",
            pais: "França",
            continente: "Europe",
            temporada: 2026,
            tipo: "League"
        },

        {
            id: 94,
            nome: "Primeira Liga",
            pais: "Portugal",
            continente: "Europe",
            temporada: 2026,
            tipo: "League"
        },

        {
            id: 88,
            nome: "Eredivisie",
            pais: "Holanda",
            continente: "Europe",
            temporada: 2026,
            tipo: "League"
        },

        {
            id: 2,
            nome: "Champions League",
            pais: "Europa",
            continente: "Europe",
            temporada: 2026,
            tipo: "Cup"
        },

        {
            id: 3,
            nome: "Europa League",
            pais: "Europa",
            continente: "Europe",
            temporada: 2026,
            tipo: "Cup"
        }

    ];

}

export default {

    buscarCampeonatos,
    buscarCampeonato,
    buscarCampeonatoNome

};
