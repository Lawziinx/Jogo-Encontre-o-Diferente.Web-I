# ODD ONE OUT

**Seu nome completo:** [Coloque seu nome aqui]

---

## Mecânica escolhida e tema

**Mecânica:** Encontre o Diferente — uma grade de emojis aparece na tela, e um deles é diferente dos outros. O jogador precisa clicar nele antes do tempo acabar.

**Tema:** Emojis variados (animais, comida, elementos, símbolos).

---

## Briefing do cliente

**Público-alvo escolhido:** Jogador hardcore

O jogo foi pensado para quem gosta de desafio real. Sem tutorial, sem mão na massa, sem mensagem motivacional. A dificuldade cresce rápido, o tempo é curto, o erro tem penalidade pesada. A estética é escura e agressiva — amarelo ácido em fundo preto, tipografia monospace, sem frescura.

**Como esse cliente moldou as decisões:**
- Grade começa 3×3 mas cresce até 6×6 com o tempo
- Tempo começa em 6s e chega em 1,8s nas rodadas avançadas
- Erros custam 60 pontos, timeout custa 40
- Não há vidas — um timeout encerra o jogo
- Sem animações desnecessárias, sem efeitos de vitória exagerados

---

## Regras do jogo

- Clique no emoji **diferente** dos demais antes o tempo acabar
- Cada acerto rápido vale mais pontos (bônus de velocidade)
- Cada erro desconta 60 pontos
- Acabou o tempo sem clicar? Desconta 40 pontos e o jogo termina
- A grade **cresce a cada 3 rodadas**, tornando mais difícil achar o diferente
- O **tempo por rodada diminui** conforme você avança

**Fórmula de pontuação:**
```
Acerto = 100 + (80 × % do tempo restante)
Erro   = −60 pontos
Timeout = −40 pontos e fim de jogo
```
Exemplo: acertar com 75% do tempo restante = 100 + (80 × 0.75) = **160 pontos**

---

## Seu diferencial — A grade embaralha

A mecânica original que criei é o **embaralhamento periódico da grade**.

Enquanto o jogador tenta encontrar o elemento diferente, a posição dos emojis **troca de lugar** automaticamente. Isso significa que você não pode simplesmente localizar o diferente e clicar — ele pode se mover antes de você reagir.

**Como funciona no código:**
1. A função `iniciarEmbaralhamento()` cria um `setInterval` com intervalo que diminui conforme as rodadas avançam (começa em 2200ms, chega em 900ms)
2. A cada disparo, `embaralharGrade()` aplica o algoritmo **Fisher-Yates** no array `estado.emojisAtual`
3. Após o shuffle, recalcula onde o emoji diferente foi parar (`arr.indexOf(emojiDiferente)`) e atualiza `estado.indexDiferente`
4. Atualiza só o `textContent` de cada célula — sem recriar elementos, mantendo os event listeners
5. Uma microanimação de `scale(0.85)` por 180ms sinaliza visualmente que a grade acabou de embaralhar

O intervalo entre embaralhamentos também diminui por rodada, então nas rodadas avançadas a grade quase não para de se mover.

---

## Como jogar

1. Digite seu nome
2. Clique em **JOGAR**
3. Encontre o emoji diferente dos outros e clique nele
4. Não deixe o tempo acabar — e cuidado, a grade embaralha!

---

## Como executar

Clone o repositório e abra o `index.html` no navegador. Não há dependências externas além de fontes do Google Fonts (carregadas via CDN).

```
git clone [url-do-repositório]
cd odd-one-out
# Abra index.html no navegador
```

---

## Reflexão obrigatória

**1. Qual foi o bug mais chato e como resolveu?**
O bug mais irritante foi no embaralhamento: quando a grade embaralhava, o `indexDiferente` ficava apontando para a posição antiga. O clique certo virava errado porque o índice não acompanhava o shuffle. Resolvi rastreando o emoji diferente pelo seu valor (`emojiDiferente = emojisAtual[indexDiferente]`) e depois usando `arr.indexOf(emojiDiferente)` para achar onde ele foi parar após o shuffle.

**2. Por que escolheu essa fórmula de pontuação?**
Escolhi `100 + 80 × %tempo` porque queria recompensar reação rápida de forma proporcional, não binária. Um jogador que acerta com 90% do tempo restante merece bem mais do que quem acertou com 5%. O bônus máximo é 180 pontos (acerto imediato) e o mínimo é 100 (acerto no último segundo). Para hardcore isso faz sentido: cada décimo de segundo conta.

**3. Como o briefing do cliente mudou suas decisões?**
Com um cliente "criança de 6 anos" eu teria grade menor, mais tempo, emojis grandes e coloridos. Para o hardcore, escolhi o oposto: grade que cresce rápido, tempo curto, penalidade sem piedade e design agressivo. O embaralhamento também foi consequência do briefing — jogador hardcore precisa de pressão extra além do timer.

**4. Se tivesse mais uma semana, o que mudaria?**
Adicionaria sons de feedback (acerto com som metálico, erro com som grave) e implementaria um modo com dois níveis diferentes na mesma grade — alguns emojis quase iguais ao diferente para criar mais confusão visual.

**5. Uma função que ficou boa e o que ela faz:**
`embaralharGrade()` — ela aplica Fisher-Yates no array de emojis, descobre onde o diferente foi parar após o shuffle, atualiza o DOM só pelo textContent (sem recriar elementos) e dispara uma microanimação. Resolve o problema todo em poucas linhas sem variáveis globais extras.

---

## Minhas Decisões

| Item | Escolha | Por quê |
|---|---|---|
| Tamanho e formato do grid | 3×3 inicial, cresce até 6×6 a cada 3 rodadas | Progressão natural de dificuldade sem travar logo de cara |
| Quantidade de cores/elementos | 12 conjuntos de emojis, alternados aleatoriamente | Variedade mantém o jogo fresco sem complicar a lógica |
| Fórmula de pontuação | 100 + 80×%tempo; −60 erro; −40 e fim no timeout | Recompensa velocidade proporcionalmente; penalidade pesada combina com o perfil hardcore |
| Critérios de tempo | Começa 6s, −350ms por rodada, mínimo 1,8s | Curva de dificuldade crescente mas não impossível nas primeiras rodadas |
| Curva de dificuldade | Grade cresce + tempo diminui + embaralhamento acelera | Três variáveis de dificuldade independentes que se combinam |
| Condição de término | Timeout encerra o jogo (sem vidas) | Jogador hardcore não merece segunda chance — cometeu erro, sentiu o peso |

---

## Bônus aplicados

**1. Mecânica original — Embaralhamento da grade**
Descrito em detalhes na seção "Seu diferencial" acima.

**2. Ranking dos melhores jogadores**
Armazenado em `localStorage` com a chave `ooRanking`. Guarda os top 5, ordenados por pontuação decrescente. Visível na tela inicial.

**3. Jogo responsivo e jogável no celular**
Grade usa `grid` com `1fr` em cada coluna, `aspect-ratio: 1` nas células e `clamp()` nas fontes. O layout se adapta de desktop a telas de 360px. Testado em viewport mobile via DevTools.

---

## Declaração de uso de IA

Usei IA (Claude) como apoio na geração da estrutura inicial do código e no CSS.

**Para quê:** Gerar o boilerplate do HTML/CSS e a estrutura inicial das funções JS.

**O que aprendi:** A lógica do embaralhamento (rastrear o emoji pelo valor, não pelo índice) foi o ponto que mais entendi na prática. O Fisher-Yates eu já conhecia, mas aplicar o rastreamento pós-shuffle dentro de uma atualização de DOM foi algo que consolidei aqui.

Qualquer parte do código entregue eu sei explicar — se houver dúvida na defesa, é só perguntar.

---

## Créditos

- Fontes: [Space Mono + Space Grotesk](https://fonts.google.com/) — Google Fonts (SIL Open Font License)
- Algoritmo de embaralhamento: Fisher-Yates (domínio público)
- Emojis: Unicode padrão do sistema

---

## Licença

MIT License — pode usar, modificar e distribuir à vontade.
