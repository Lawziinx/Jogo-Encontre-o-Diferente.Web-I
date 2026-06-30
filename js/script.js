// ============================================================
// ODD ONE OUT — script.js
// Mecânica: Encontre o Diferente
// Cliente: Jogador Hardcore
//
// Decisões de design importantes:
// - Usei dataset para guardar qual célula é o diferente,
//   evitando variáveis globais soltas
// - Cada função tem responsabilidade única: iniciarJogo,
//   gerarGrade, iniciarTimer, registrarClique, atualizarPontuacao
// - O diferencial (embaralhamento) está isolado em embaralharGrade()
// ============================================================

// ─── CONFIGURAÇÃO DO JOGO ────────────────────────────────────
// Decidi deixar tudo aqui em cima em vez de espalhado,
// porque facilita ajuste sem caçar constante no meio do código.

const CONFIG = {
  // Grade começa menor e cresce com as rodadas
  grade: {
    inicial: { colunas: 3, linhas: 3 },  // 3×3 = 9 elementos
    maxColunas: 6,
    maxLinhas: 6,
  },
  // Tempo em ms por rodada — diminui conforme avança
  tempo: {
    inicial: 6000,
    minimo: 1800,
    reducaoPorRodada: 350,
  },
  // Fórmula de pontuação:
  // acerto rápido = mais pontos; erro = penalidade pesada
  pontuacao: {
    baseAcerto: 100,
    bonusVelocidade: 80,   // multiplica pelo % de tempo restante
    penalidadeErro: 60,    // desconta pontos no erro
    penalidadeTimeout: 40, // desconta ao acabar o tempo sem clicar
  },
  // Embaralhamento: a grade "embaralha" os emojis periodicamente
  // (meu diferencial — a grade não fica parada esperando)
  embaralhamento: {
    intervaloInicial: 2200,  // ms entre embaralhamentos na rodada 1
    intervaloMinimo: 900,
    reducaoPorRodada: 200,
  },
};

// ─── ESTADO DO JOGO ──────────────────────────────────────────
let estado = {
  nomeJogador: '',
  rodada: 1,
  pontos: 0,
  totalAcertos: 0,
  totalErros: 0,
  indexDiferente: -1,   // qual célula é a diferente na rodada atual
  timerRodada: null,    // setInterval do tempo
  timerEmbaralha: null, // setInterval do embaralhamento
  tempoRestante: 0,
  tempoTotal: 0,
  jogando: false,
  emojisAtual: [],      // array de emojis na grade atual (com ordem atualizada)
};

// ─── POOLS DE EMOJIS ─────────────────────────────────────────
// Escolhi emojis porque são visualmente distintos sem depender de cor,
// o que torna acessível para daltônicos também.
// O "diferente" é sempre um emoji da mesma categoria mas visivelmente diferente.

const CONJUNTOS = [
  { iguais: '🐶', diferente: '🐱' },
  { iguais: '⭐', diferente: '🌙' },
  { iguais: '🍎', diferente: '🍊' },
  { iguais: '🔥', diferente: '💧' },
  { iguais: '👁️', diferente: '👅' },
  { iguais: '⚡', diferente: '❄️' },
  { iguais: '🎯', diferente: '🎲' },
  { iguais: '💀', diferente: '👾' },
  { iguais: '🦊', diferente: '🐺' },
  { iguais: '🔴', diferente: '🟡' },
  { iguais: '🏔️', diferente: '🌊' },
  { iguais: '🗡️', diferente: '🛡️' },
];

// ─── SELETORES DOM ───────────────────────────────────────────
// Busco tudo de uma vez para não fazer querySelector repetido dentro de funções.

const telaInicio  = document.getElementById('tela-inicio');
const telaJogo    = document.getElementById('tela-jogo');
const telaFim     = document.getElementById('tela-fim');
const inputNome   = document.getElementById('input-nome');
const btnJogar    = document.getElementById('btn-jogar');
const btnNovoJogo = document.getElementById('btn-novo-jogo');
const btnVoltarInicio = document.getElementById('btn-voltar-inicio');
const hudRodada   = document.getElementById('hud-rodada');
const hudPontos   = document.getElementById('hud-pontos');
const barraTemp   = document.getElementById('barra-tempo');
const gradeEl     = document.getElementById('grade');
const feedbackEl  = document.getElementById('feedback-msg');
const listaRanking = document.getElementById('lista-ranking');
const finPontos   = document.getElementById('fim-pontos');
const finTitulo   = document.getElementById('fim-titulo');
const finEyebrow  = document.getElementById('fim-eyebrow');
const finNome     = document.getElementById('fim-nome');
const finStats    = document.getElementById('fim-stats');

// ─── FUNÇÕES DE TELA ─────────────────────────────────────────

function mostrarTela(tela) {
  // Troca qual tela está visível — uso classes ao invés de display
  // para poder animar com opacity via CSS
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  tela.classList.add('ativa');
}

// ─── RANKING (localStorage) ──────────────────────────────────

function carregarRanking() {
  try {
    return JSON.parse(localStorage.getItem('ooRanking')) || [];
  } catch {
    return [];
  }
}

function salvarRanking(nome, pontos) {
  const ranking = carregarRanking();
  ranking.push({ nome, pontos });
  // Ordena do maior para o menor e guarda só os top 5
  ranking.sort((a, b) => b.pontos - a.pontos);
  ranking.splice(5);
  localStorage.setItem('ooRanking', JSON.stringify(ranking));
}

function renderizarRanking() {
  const ranking = carregarRanking();
  listaRanking.innerHTML = '';
  if (ranking.length === 0) {
    listaRanking.innerHTML = '<li style="color:#444;font-size:0.75rem;">Nenhuma partida ainda.</li>';
    return;
  }
  ranking.forEach((entry, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${i + 1}. ${entry.nome}</span><span class="rank-pts">${entry.pontos} pts</span>`;
    listaRanking.appendChild(li);
  });
}

// ─── INICIAR JOGO ────────────────────────────────────────────

function iniciarJogo() {
  const nome = inputNome.value.trim();
  if (!nome) {
    inputNome.focus();
    inputNome.style.borderBottomColor = '#ff3c3c';
    setTimeout(() => { inputNome.style.borderBottomColor = ''; }, 800);
    return;
  }

  estado.nomeJogador = nome;
  estado.rodada = 1;
  estado.pontos = 0;
  estado.totalAcertos = 0;
  estado.totalErros = 0;
  estado.jogando = true;

  atualizarHud();
  mostrarTela(telaJogo);

  // Pequeno delay para a transição ficar suave antes de gerar a grade
  setTimeout(iniciarRodada, 300);
}

// ─── RODADA ──────────────────────────────────────────────────

function iniciarRodada() {
  pararTimers();
  limparFeedback();

  const { colunas, linhas } = calcularTamanhoGrade();
  const total = colunas * linhas;

  // Escolhe conjunto de emojis aleatório
  const conjunto = CONJUNTOS[Math.floor(Math.random() * CONJUNTOS.length)];

  // Posição do diferente — escolhida aleatoriamente, mas nunca a mesma duas vezes seguidas
  let indexDif;
  do {
    indexDif = Math.floor(Math.random() * total);
  } while (indexDif === estado.indexDiferente && total > 1);

  estado.indexDiferente = indexDif;

  // Monta array de emojis
  estado.emojisAtual = Array.from({ length: total }, (_, i) =>
    i === indexDif ? conjunto.diferente : conjunto.iguais
  );

  gerarGrade(colunas, linhas);
  iniciarTimer();
  iniciarEmbaralhamento();
}

function calcularTamanhoGrade() {
  // Grade cresce a cada 3 rodadas, com limite máximo
  const passo = Math.floor((estado.rodada - 1) / 3);
  const colunas = Math.min(CONFIG.grade.inicial.colunas + passo, CONFIG.grade.maxColunas);
  const linhas  = Math.min(CONFIG.grade.inicial.linhas  + passo, CONFIG.grade.maxLinhas);
  return { colunas, linhas };
}

// ─── GERAR GRADE ─────────────────────────────────────────────
// Crio os elementos via DOM (não innerHTML) conforme exigido nas restrições técnicas

function gerarGrade(colunas, linhas) {
  gradeEl.innerHTML = '';
  gradeEl.style.gridTemplateColumns = `repeat(${colunas}, 1fr)`;

  estado.emojisAtual.forEach((emoji, index) => {
    const celula = document.createElement('div');
    celula.classList.add('celula');
    celula.dataset.index = index; // uso dataset para saber qual célula é qual
    celula.textContent = emoji;

    // Cor de fundo levemente diferente para criar textura visual
    const shade = Math.floor(Math.random() * 12) + 18; // #121212 a #242424
    celula.style.backgroundColor = `rgb(${shade}, ${shade}, ${shade})`;

    celula.addEventListener('click', registrarClique);
    gradeEl.appendChild(celula);
  });
}

// ─── REGISTRAR CLIQUE ────────────────────────────────────────

function registrarClique(e) {
  if (!estado.jogando) return;

  const celula = e.currentTarget;
  const index = parseInt(celula.dataset.index);
  const acertou = index === estado.indexDiferente;

  if (acertou) {
    processarAcerto(celula);
  } else {
    processarErro(celula);
  }
}

function processarAcerto(celula) {
  const percentualRestante = estado.tempoRestante / estado.tempoTotal;
  const pontosGanhos = Math.round(
    CONFIG.pontuacao.baseAcerto + CONFIG.pontuacao.bonusVelocidade * percentualRestante
  );

  estado.pontos += pontosGanhos;
  estado.totalAcertos++;

  celula.classList.add('acerto-anim');
  mostrarFeedback(`+${pontosGanhos} pts`, 'acerto');
  atualizarHud();

  pararTimers();

  setTimeout(() => {
    estado.rodada++;
    iniciarRodada();
  }, 600);
}

function processarErro(celula) {
  estado.pontos = Math.max(0, estado.pontos - CONFIG.pontuacao.penalidadeErro);
  estado.totalErros++;

  celula.classList.add('erro-anim');
  mostrarFeedback(`−${CONFIG.pontuacao.penalidadeErro} pts — ERROU`, 'erro');
  atualizarHud();

  // Remove animação depois de um tempo
  setTimeout(() => celula.classList.remove('erro-anim'), 500);
}

// ─── TIMER ───────────────────────────────────────────────────

function iniciarTimer() {
  const tempoMs = Math.max(
    CONFIG.tempo.inicial - CONFIG.tempo.reducaoPorRodada * (estado.rodada - 1),
    CONFIG.tempo.minimo
  );

  estado.tempoTotal = tempoMs;
  estado.tempoRestante = tempoMs;
  const intervalo = 50; // atualiza a cada 50ms para barra suave

  atualizarBarraTempo();

  estado.timerRodada = setInterval(() => {
    estado.tempoRestante -= intervalo;

    if (estado.tempoRestante <= 0) {
      estado.tempoRestante = 0;
      atualizarBarraTempo();
      clearInterval(estado.timerRodada);
      processarTimeout();
    } else {
      atualizarBarraTempo();
    }
  }, intervalo);
}

function atualizarBarraTempo() {
  const pct = (estado.tempoRestante / estado.tempoTotal) * 100;
  barraTemp.style.width = `${pct}%`;
  // Fica vermelha no último terço — sinaliza urgência sem texto
  barraTemp.classList.toggle('urgente', pct < 33);
}

function processarTimeout() {
  estado.jogando = false;
  pararTimers();

  // Revela qual era o diferente — busco pelo dataset.index porque após
  // o embaralhamento a posição física no DOM não corresponde mais ao índice
  const celulaCorreta = gradeEl.querySelector(`.celula[data-index="${estado.indexDiferente}"]`);
  if (celulaCorreta) {
    celulaCorreta.classList.add('acerto-anim');
  }

  mostrarFeedback('TEMPO ESGOTADO', 'erro');
  estado.pontos = Math.max(0, estado.pontos - CONFIG.pontuacao.penalidadeTimeout);
  atualizarHud();

  setTimeout(encerrarJogo, 1200);
}

// ─── DIFERENCIAL: EMBARALHAMENTO DA GRADE ────────────────────
// Esta é a mecânica original que criei: a grade embaralha os emojis
// periodicamente enquanto o jogador tenta encontrar o diferente.
// O índice do diferente é atualizado junto com o embaralhamento,
// então o jogo continua correto mesmo após a troca.
// A função embaralha usando o algoritmo Fisher-Yates para ser justo.

function iniciarEmbaralhamento() {
  const intervalo = Math.max(
    CONFIG.embaralhamento.intervaloInicial - CONFIG.embaralhamento.reducaoPorRodada * (estado.rodada - 1),
    CONFIG.embaralhamento.intervaloMinimo
  );

  estado.timerEmbaralha = setInterval(embaralharGrade, intervalo);
}

function embaralharGrade() {
  if (!estado.jogando) return;

  // Fisher-Yates shuffle no array de emojis
  const arr = [...estado.emojisAtual];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Descobre onde o diferente foi parar depois do shuffle
  // Pego o emoji diferente (o que estava em indexDiferente antes)
  const emojiDiferente = estado.emojisAtual[estado.indexDiferente];
  estado.emojisAtual = arr;
  estado.indexDiferente = arr.indexOf(emojiDiferente);

  // Atualiza o DOM — só troca o textContent, não recria os elementos
  // Isso mantém os event listeners e é mais performático
  const celulas = gradeEl.querySelectorAll('.celula');
  celulas.forEach((celula, i) => {
    celula.textContent = arr[i];
    celula.dataset.index = i;
    // Pequena animação visual para chamar atenção ao embaralhamento
    celula.style.transform = 'scale(0.85)';
    setTimeout(() => { celula.style.transform = ''; }, 180);
  });
}

// ─── HUD & FEEDBACK ──────────────────────────────────────────

function atualizarHud() {
  hudRodada.textContent = estado.rodada;
  hudPontos.textContent = estado.pontos;
}

function mostrarFeedback(msg, tipo) {
  feedbackEl.textContent = msg;
  feedbackEl.className = `feedback-msg ${tipo}`;
}

function limparFeedback() {
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback-msg';
}

// ─── ENCERRAR JOGO ───────────────────────────────────────────

function encerrarJogo() {
  estado.jogando = false;
  pararTimers();

  salvarRanking(estado.nomeJogador, estado.pontos);

  finPontos.textContent = estado.pontos;
  finNome.textContent = estado.nomeJogador;

  // Mensagem varia conforme performance
  if (estado.rodada > 10) {
    finTitulo.textContent = 'LENDÁRIO';
    finEyebrow.textContent = 'INALCANÇÁVEL';
  } else if (estado.rodada > 6) {
    finTitulo.textContent = 'SOBREVIVEU';
    finEyebrow.textContent = 'RESPEITÁVEL';
  } else {
    finTitulo.textContent = 'ELIMINADO';
    finEyebrow.textContent = 'FIM DE JOGO';
  }

  finStats.innerHTML = `
    Rodada ${estado.rodada - 1} &nbsp;·&nbsp;
    ${estado.totalAcertos} acerto(s) &nbsp;·&nbsp;
    ${estado.totalErros} erro(s)
  `;

  mostrarTela(telaFim);
}

// ─── PARAR TIMERS ────────────────────────────────────────────

function pararTimers() {
  clearInterval(estado.timerRodada);
  clearInterval(estado.timerEmbaralha);
  estado.timerRodada = null;
  estado.timerEmbaralha = null;
}

// ─── EVENTOS DOS BOTÕES ──────────────────────────────────────

btnJogar.addEventListener('click', iniciarJogo);

inputNome.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') iniciarJogo();
});

btnNovoJogo.addEventListener('click', () => {
  estado.jogando = true;
  estado.rodada = 1;
  estado.pontos = 0;
  estado.totalAcertos = 0;
  estado.totalErros = 0;
  estado.indexDiferente = -1; // reseta para não herdar posição do jogo anterior
  atualizarHud();
  mostrarTela(telaJogo);
  setTimeout(iniciarRodada, 300);
});

btnVoltarInicio.addEventListener('click', () => {
  pararTimers();
  renderizarRanking();
  mostrarTela(telaInicio);
});

// ─── INIT ────────────────────────────────────────────────────

renderizarRanking();
mostrarTela(telaInicio);
