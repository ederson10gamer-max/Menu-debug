// 1. Variáveis de monitorização (com atualização a cada 1000ms)
let framesNoUltimoSegundo = 0;
let temposDosFrames = [];
let ultimoTempo = performance.now();

// Histórico de FPS para desenhar no gráfico (guarda os últimos 30 segundos)
let historicoFPS = Array(30).fill(60); 

// Loop leve para contagem em segundo plano
function loopContador(tempoAtual) {
    framesNoUltimoSegundo++;
    const delta = tempoAtual - ultimoTempo;
    ultimoTempo = tempoAtual;
    temposDosFrames.push(delta);
    requestAnimationFrame(loopContador);
}
requestAnimationFrame(loopContador);

// 2. Configuração do Canvas Nativo
const canvas = document.getElementById('perfChart');
const ctx = canvas.getContext('2d');

function desenharGrafico() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    // Ajusta a resolução interna do canvas para não ficar pixelizado
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    // Limpa o gráfico anterior
    ctx.clearRect(0, 0, width, height);

    // Desenha linhas de fundo (Grid guia de 30fps e 60fps)
    ctx.strokeStyle = 'rgba(74, 255, 8, 0.15)';
    ctx.lineWidth = 1;
    
    // Linha de 60 FPS
    const y60 = height - (60 / 75) * height;
    ctx.beginPath(); ctx.moveTo(0, y60); ctx.lineTo(width, y60); ctx.stroke();
    
    // Linha de 30 FPS
    const y30 = height - (30 / 75) * height;
    ctx.beginPath(); ctx.moveTo(0, y30); ctx.lineTo(width, y30); ctx.stroke();

    // Desenha a linha do histórico de FPS
    ctx.strokeStyle = '#4aff08';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const totalPontos = historicoFPS.length;
    const espacoX = width / (totalPontos - 1);

    for (let i = 0; i < totalPontos; i++) {
        // Mapeia o FPS (0 a 75) para a altura do Canvas (invertido no eixo Y)
        const fps = Math.min(75, Math.max(0, historicoFPS[i]));
        const x = i * espacoX;
        const y = height - (fps / 75) * height;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// Inicializa o primeiro desenho vazio
desenharGrafico();

// 3. Atualização visual e lógica em lote (a cada 1000ms exatamente)
setInterval(() => {
    if (temposDosFrames.length === 0) return;

    const fpsAtual = framesNoUltimoSegundo;
    
    // Cálculo do Slowdown
    const somaDeltas = temposDosFrames.reduce((a, b) => a + b, 0);
    const mediaDelta = somaDeltas / temposDosFrames.length;
    const slowdown = Math.max(0, mediaDelta - (1000 / 60));

    // Cálculo do 1% Low FPS
    const ordenados = [...temposDosFrames].sort((a, b) => b - a);
    const corteUmPorCento = Math.max(1, Math.floor(ordenados.length * 0.01));
    const piorMediaTempo = ordenados.slice(0, corteUmPorCento).reduce((a, b) => a + b, 0) / corteUmPorCento;
    const umPorCentoLow = Math.round(1000 / piorMediaTempo);

    // Atualiza os textos no HTML
    document.getElementById('debug-fps').innerText = fpsAtual;
    document.getElementById('fps-low').innerText = Math.min(fpsAtual, umPorCentoLow);
    document.getElementById('slowdown').innerText = `${slowdown.toFixed(1)}ms`;

    // Medidor de Memória RAM (Chromium)
    if (performance.memory) {
        const usado = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        document.getElementById('memory').innerText = `${usado}MB`;
    } else {
        document.getElementById('memory').innerText = "N/A";
    }

    // Adiciona o novo dado ao histórico e remove o mais antigo
    historicoFPS.push(fpsAtual);
    historicoFPS.shift();

    // Redesenha o gráfico nativo com o novo dado
    desenharGrafico();

    // Limpa contadores temporários para o próximo segundo
    framesNoUltimoSegundo = 0;
    temposDosFrames = [];
}, 1000);
