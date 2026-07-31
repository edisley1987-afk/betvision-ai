// ==========================================
// BetVision AI
// services/valueBetService.js
// ==========================================

/*
    Serviço responsável por calcular Value Bets
    baseado na probabilidade estimada pela IA
    comparada com as odds do mercado.
*/

function normalizarNumero(valor) {

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return 0;
    }

    return numero;
}

// ==========================================
// Converter odd em probabilidade
// ==========================================

export function probabilidadeMercado(odd) {

    odd = normalizarNumero(odd);

    if (odd <= 0) {
        return 0;
    }

    return 100 / odd;
}

// ==========================================
// Calcular Edge
// ==========================================

export function calcularEdge(probIA, odd) {

    probIA = normalizarNumero(probIA);
    odd = normalizarNumero(odd);

    const mercado = probabilidadeMercado(odd);

    return Number((probIA - mercado).toFixed(2));
}

// ==========================================
// EV (Expected Value)
// ==========================================

export function calcularEV(probIA, odd) {

    probIA = normalizarNumero(probIA);
    odd = normalizarNumero(odd);

    const p = probIA / 100;

    const ev = (p * odd) - 1;

    return Number(ev.toFixed(4));
}

// ==========================================
// ROI Esperado
// ==========================================

export function calcularROI(probIA, odd) {

    const ev = calcularEV(probIA, odd);

    return Number((ev * 100).toFixed(2));
}

// ==========================================
// Kelly Criterion
// ==========================================

export function calcularKelly(probIA, odd) {

    probIA = normalizarNumero(probIA);
    odd = normalizarNumero(odd);

    const p = probIA / 100;
    const b = odd - 1;

    if (b <= 0) {

        return 0;

    }

    const kelly = ((b * p) - (1 - p)) / b;

    if (kelly < 0) {

        return 0;

    }

    return Number((kelly * 100).toFixed(2));

}

// ==========================================
// Classificação
// ==========================================

export function classificarValue(edge) {

    edge = normalizarNumero(edge);

    if (edge >= 20) {

        return "⭐⭐⭐⭐⭐ Excelente";

    }

    if (edge >= 15) {

        return "⭐⭐⭐⭐ Muito Boa";

    }

    if (edge >= 10) {

        return "⭐⭐⭐ Boa";

    }

    if (edge >= 5) {

        return "⭐⭐ Moderada";

    }

    if (edge >= 2) {

        return "⭐ Pequena";

    }

    return "Sem Valor";

}

// ==========================================
// Calcular Value Bet
// ==========================================

export function calcularValueBet({

    jogo,
    mercado,
    selecao,
    odd,
    probabilidadeIA

}) {

    odd = normalizarNumero(odd);
    probabilidadeIA = normalizarNumero(probabilidadeIA);

    const probMercado = probabilidadeMercado(odd);

    const edge = calcularEdge(probabilidadeIA, odd);

    const ev = calcularEV(probabilidadeIA, odd);

    const roi = calcularROI(probabilidadeIA, odd);

    const kelly = calcularKelly(probabilidadeIA, odd);

    const possuiValor = edge >= 5 && ev > 0;

    return {

        jogo,

        mercado,

        selecao,

        odd,

        probabilidadeIA,

        probabilidadeMercado: Number(probMercado.toFixed(2)),

        edge,

        expectedValue: ev,

        roi,

        kelly,

        possuiValor,

        classificacao: classificarValue(edge),

        recomendacao: possuiValor
            ? "APOSTAR"
            : "NÃO APOSTAR"

    };

}

// ==========================================
// Lista de Value Bets
// ==========================================

export function gerarValueBets(lista = []) {

    if (!Array.isArray(lista)) {

        return [];

    }

    return lista
        .map(calcularValueBet)
        .filter(item => item.possuiValor)
        .sort((a, b) => b.edge - a.edge);

}

export default {

    probabilidadeMercado,

    calcularEdge,

    calcularEV,

    calcularROI,

    calcularKelly,

    calcularValueBet,

    gerarValueBets,

    classificarValue

};
