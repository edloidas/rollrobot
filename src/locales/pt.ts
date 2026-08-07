import { playground, reference } from './links';
import type { Messages } from './types';

export const pt: Messages = {
  inline: { roll: 'Rolagem', full: 'Detalhada', random: 'Aleatória' },

  help: `Role os dados como ninguém — notação de RPG completa com manter/descartar, dados explosivos, novas rolagens, reservas de sucessos e testes.

<b>Comandos</b>
/roll [notação] — rola e mostra o total (atalho: /r)
/full [notação] — rola com o detalhe dado a dado (atalho: /f)
/random — rola d100 (<code>d%</code>)
/help — este guia

Inline: digite @rollrobot [notação] em qualquer conversa, ou escolha uma opção da lista.

<b>Notação</b>
<code>2d20+5</code> — dados e aritmética: + - * / e parênteses
<code>4d6kh3</code> — mantém os 3 maiores (também kl, dh, dl)
<code>d8!</code> — dados explosivos
<code>2d6r&lt;3</code> — rola de novo abaixo de 3 (ro — rola de novo uma vez)
<code>4d6min2</code> — fixa cada dado em pelo menos 2 (também max)
<code>6d10&gt;=6f1</code> — conta sucessos, subtrai os 1s como falhas
<code>1d20+7 vs 15</code> — teste contra uma CD com graus de sucesso
<code>4dF</code> — dados Fate, <code>d%</code> — percentual
<code>2d6+floor(1d4/2)</code> — funções: floor, ceil, round, abs, min, max, sqrt, pow

Notação abreviada: <code>/roll 20</code> rola d20, <code>/roll 2 10 -1</code> rola 2d10-1.

Teste a notação no ${playground('playground')}, ou leia a ${reference('referência completa')}.`,

  commands: [
    { command: 'roll', description: 'Role dados — /roll 2d20kh1+5' },
    { command: 'full', description: 'Role com detalhe — /full 4d6kh3' },
    { command: 'random', description: 'Role d100' },
    { command: 'help', description: 'Guia de notação e links' },
  ],

  shortDescription:
    'Dados de RPG em qualquer conversa — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Notação de dados de RPG, rolada em qualquer conversa.

4d6kh3 para atributos, 2d20kh1+7 com vantagem, 1d20+12 vs 20 para um teste de Pathfinder, 7d10>=6f1 para uma reserva de Storyteller, {1d8!, 1d6!}kh1 para Savage Worlds, 4dF para Fate, d% para Call of Cthulhu.

/roll dá o total, /full o detalhe dado a dado, /help o guia de notação. Digite @rollrobot em qualquer conversa para rolar sem adicionar o bot.`,
};
