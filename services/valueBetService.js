// ==========================================
// BetVision AI
// services/valueBetService.js
// Versão 6.0
// ==========================================

/**
 * Serviço responsável pelo cálculo de Value Bets
 * baseado na probabilidade estimada pela IA.
 */

// ==========================================
// UTILIDADES
// ==========================================

function normalizarNumero(valor) {

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : 0;

}

// ==========================================
// PROBABILIDADE IMPLÍCITA DO MERCADO
// ==========================================

export function probabilidadeMercado(odd) {

    odd = normalizarNumero(odd);

    if (odd <= 0) {
        return 0;
    }

    return 100 / odd;
}

// ==========================================
// EDGE
// ==========================================

export function calcularEdge(probabilidadeIA, odd) {

    probabilidadeIA = normalizarNumero(probabilidadeIA);

    const mercado = probabilidadeMercado(odd);

    return Number((probabilidadeIA - mercado).toFixed(2));

}

// ==========================================
// EXPECTED VALUE (EV)
// ==========================================

export function calcularEV(probabilidadeIA, odd) {

    probabilidadeIA = normalizarNumero(probabilidadeIA);
    odd = normalizarNumero(odd);

    if (odd <= 0) {
        return 0;
    }

    const p = probabilidadeIA / 100;

    return Number(((p * odd) - 1).toFixed(4));

}

// ==========================================
// ROI ESPERADO
// ==========================================

export function calcularROI(probabilidadeIA, odd) {

    return Number((calcularEV(probabilidadeIA, odd) * 100).toFixed(2));

}

// ==========================================
// CRITÉRIO DE KELLY
// ==========================================

export function calcularKelly(probabilidadeIA, odd) {

    probabilidadeIA = normalizarNumero(probabilidadeIA);
    odd = normalizarNumero(odd);

    if (odd <= 1) {
        return 0;
    }

    const p = probabilidadeIA / 100;
    const b = odd - 1;

    const kelly = ((b * p) - (1 - p)) / b;

    return Number((Math.max(0, kelly) * 100).toFixed(2));

}

// ==========================================
// CLASSIFICAÇÃO
// ==========================================

export function classificarValue(edge) {

    edge = normalizarNumero(edge);

    if (edge >= 20) return "⭐⭐⭐⭐⭐ Excelente";
    if (edge >= 15) return "⭐⭐⭐⭐ Muito Boa";
    if (edge >= 10) return "⭐⭐⭐ Boa";
    if (edge >= 5) return "⭐⭐ Moderada";
    if (edge >= 2) return "⭐ Pequena";

    return "Sem Valor";

}

// ==========================================
// CALCULAR VALUE BET
// ==========================================

export function calcularValueBet(dados = {}) {

    const {

        jogo = null,
        mercado = "",
        selecao = "",
        odd = 0,
        probabilidadeIA = 0

    } = dados;

    const oddNormalizada = normalizarNumero(odd);
    const probIA = normalizarNumero(probabilidadeIA);

    const probMercado = probabilidadeMercado(oddNormalizada);
    const edge = calcularEdge(probIA, oddNormalizada);
    const ev = calcularEV(probIA, oddNormalizada);
    const roi = calcularROI(probIA, oddNormalizada);
    const kelly = calcularKelly(probIA, oddNormalizada);

    const possuiValor = edge >= 5 && ev > 0;

    return {

        jogo,

        mercado,

        selecao,

        odd: oddNormalizada,

        probabilidadeIA: probIA,

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
// GERAR VALUE BETS
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

// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {

    probabilidadeMercado,
    calcularEdge,
    calcularEV,
    calcularROI,
    calcularKelly,
    classificarValue,
    calcularValueBet,
    gerarValueBets

};
