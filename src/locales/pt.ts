import { manual, manualUrl, playground, reference } from './links';
import type { Messages } from './types';

export const pt: Messages = {
  inline: {
    roll: 'Rolagem',
    full: 'Detalhada',
    random: 'Aleatória',
    ask: 'Pergunta',
    pick: 'Escolha',
    answer: 'Responde Yes ou No',
    help: 'Como usar',
  },

  pick: {
    usage: 'Dê pelo menos duas opções — /pick Patrulha de goblins | Sala vazia',
    tooMany: 'Opções demais — no máximo 100.',
    spaceSplit: 'Cada palavra virou uma opção — use , ou | para manter frases inteiras.',
  },

  help: `Notação de dados de RPG para rolar em qualquer conversa.

${manual('Guia completo', 'pt')}

<b>Comandos</b>
/roll [notação] — rola e mostra o total
/full [notação] — rola com o detalhe dado a dado
/random — rola d100 (<code>d%</code>)
/ask [pergunta] — responde Yes ou No
/pick [opções] — escolhe uma ao acaso (beta)
/help — este guia

Inline: digite @rollrobot [notação] em qualquer conversa, ou use um dos exemplos prontos da lista.

<b>Notação</b>
<code>2d20+5</code> — dados e aritmética: + - * / e parênteses
<code>4d6kh3</code> — mantém os 3 maiores (também kl, dh, dl)
<code>d8!</code> — dados explosivos
<code>2d6r&lt;3</code> — rola de novo abaixo de 3 (ro — rola de novo uma vez)
<code>4d6min2</code> — eleva cada dado para no mínimo 2 (também max)
<code>6d10&gt;=6f1</code> — conta sucessos, subtrai cada 1 como falha
<code>1d20+7 vs 15</code> — teste contra uma CD, graus de sucesso do Pathfinder 2e
<code>4dF</code> — dados Fate
<code>d%</code> — dado percentual
<code>2d6+floor(1d4/2)</code> — funções: floor, ceil, round, abs, min, max, sqrt, pow

<b>Perguntar e escolher</b>
<code>/ask A porta está armadilhada?</code> — tudo depois do comando é a pergunta
<code>/pick Patrulha de goblins | Sala vazia</code> — duas ou mais opções, separadas por , | ; ou quebra de linha

Teste a notação no ${playground('playground')} ou leia a ${reference('referência completa')}.`,

  commands: [
    { command: 'roll', description: 'Role dados — /roll 2d20kh1+5' },
    { command: 'full', description: 'Role dado a dado — /full 4d6kh3' },
    { command: 'random', description: 'Role d100' },
    { command: 'ask', description: 'Responda Yes ou No — /ask Vamos atacar?' },
    {
      command: 'pick',
      description: 'Escolha uma ao acaso — /pick Patrulha de goblins | Sala vazia',
    },
    { command: 'help', description: 'Guia de notação e links' },
  ],

  shortDescription:
    'Dados de RPG em qualquer conversa — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Notação de dados de RPG para rolar em qualquer conversa.
${manualUrl('pt')}

4d6kh3 para atributos
2d20kh1+7 com vantagem
1d20+12 vs 20 para um teste do Pathfinder 2e
7d10>=6f1 para uma parada de dados do Storyteller
{1d8!, 1d6!}kh1 para Savage Worlds
4dF para Fate
d% para Call of Cthulhu

/roll dá o total, /full o detalhe dado a dado, /ask um Yes ou No, /pick uma opção ao acaso (beta), /help o guia de notação. Digite @rollrobot em qualquer conversa para rolar sem adicionar o bot.`,
};
