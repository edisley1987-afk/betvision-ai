// ==========================================
// BetVision AI
// services/campeonatoService.js
// Football-Data.org v4
// ==========================================

import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ==========================================
// CONFIGURAÇÃO PADRÃO
// ==========================================

let config = {
    futebolApi: {
        baseUrl: "https://api.football-data.org/v4",
        apiKey: ""
    }
};

// ==========================================
// CARREGAR providers.json (opcional)
// ==========================================

try {

    const arquivo = path.join(
        __dirname,
        "../config/providers.json"
    );

    if (fs.existsSync(arquivo)) {

        config = JSON.parse(
            fs.readFileSync(arquivo, "utf8")
        );

    }

} catch {

    console.warn(
        "⚠ providers.json não encontrado."
    );

}

const API_KEY =
    process.env.API_FOOTBALL_KEY ||
    config.futebolApi.apiKey;

const BASE_URL =
    process.env.API_FOOTBALL_URL ||
    config.futebolApi.baseUrl;

// ==========================================
// BUSCAR CAMPEONATOS
// ==========================================

export async function buscarCampeonatos() {

    try {

        if (!API_KEY) {

            console.warn("⚠ API_FOOTBALL_KEY não configurada.");
            console.warn("📦 Utilizando campeonatos locais.");

            return campeonatosBase();

        }

        console.log("🌎 Buscando campeonatos...");

        const resposta = await axios.get(

            `${BASE_URL}/competitions`,

            {

                headers: {

                    "X-Auth-Token": API_KEY

                },

                timeout: 15000

            }

        );

        const competicoes =
            resposta.data?.competitions || [];

        if (!competicoes.length) {

            console.warn(
                "⚠ Nenhum campeonato retornado."
            );

            return campeonatosBase();

        }

        const lista = competicoes.map(comp => ({

            id: comp.id,

            nome: comp.name,

            pais: comp.area?.name || "",

            continente:
                comp.area?.code || "",

            logo: null,

            tipo: comp.type,

            temporada:
                comp.currentSeason?.startDate
                    ? new Date(
                        comp.currentSeason.startDate
                    ).getFullYear()
                    : new Date().getFullYear()

        }));

        console.log(
            `✅ ${lista.length} campeonatos encontrados`
        );

        return lista;

    } catch (erro) {

        console.error(
            "❌ Erro Football-Data:",
            erro.response?.data || erro.message
        );

        console.warn(
            "📦 Utilizando campeonatos locais."
        );

        return campeonatosBase();

    }

}

// ==========================================
// BUSCAR POR ID
// ==========================================

export async function buscarCampeonato(id) {

    const lista =
        await buscarCampeonatos();

    return (
        lista.find(c => c.id == id) || null
    );

}

// ==========================================
// BUSCAR POR NOME
// ==========================================

export async function buscarCampeonatoNome(nome) {

    const lista =
        await buscarCampeonatos();

    return (

        lista.find(

            c =>

                c.nome
                    .toLowerCase()
                    .includes(
                        nome.toLowerCase()
                    )

        ) || null

    );

}

// ==========================================
// CAMPEONATOS LOCAIS
// ==========================================

function campeonatosBase() {

    return [

        {
            id: 2013,
            nome: "Brasileirão Série A",
            pais: "Brazil",
            continente: "BRA",
            temporada: 2026,
            tipo: "LEAGUE"
        },

        {
            id: 2014,
            nome: "Brasileirão Série B",
            pais: "Brazil",
            continente: "BRA",
            temporada: 2026,
            tipo: "LEAGUE"
        },

        {
            id: 2021,
            nome: "Premier League",
            pais: "England",
            continente: "ENG",
            temporada: 2026,
            tipo: "LEAGUE"
        },

        {
            id: 2014,
            nome: "La Liga",
            pais: "Spain",
            continente: "ESP",
            temporada: 2026,
            tipo: "LEAGUE"
        },

        {
            id: 2019,
            nome: "Serie A",
            pais: "Italy",
            continente: "ITA",
            temporada: 2026,
            tipo: "LEAGUE"
        },

        {
            id: 2002,
            nome: "Bundesliga",
            pais: "Germany",
            continente: "GER",
            temporada: 2026,
            tipo: "LEAGUE"
        },

        {
            id: 2015,
            nome: "Ligue 1",
            pais: "France",
            continente: "FRA",
            temporada: 2026,
            tipo: "LEAGUE"
        },

        {
            id: 2017,
            nome: "Primeira Liga",
            pais: "Portugal",
            continente: "POR",
            temporada: 2026,
            tipo: "LEAGUE"
        },

        {
            id: 2003,
            nome: "Eredivisie",
            pais: "Netherlands",
            continente: "NED",
            temporada: 2026,
            tipo: "LEAGUE"
        },

        {
            id: 2001,
            nome: "UEFA Champions League",
            pais: "Europe",
            continente: "EUR",
            temporada: 2026,
            tipo: "CUP"
        },

        {
            id: 2146,
            nome: "UEFA Europa League",
            pais: "Europe",
            continente: "EUR",
            temporada: 2026,
            tipo: "CUP"
        }

    ];

}

// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {

    buscarCampeonatos,
    buscarCampeonato,
    buscarCampeonatoNome

};
