import { manual, manualUrl, playground, reference } from './links';
import type { Messages } from './types';

export const es: Messages = {
  inline: {
    roll: 'Tirada',
    full: 'Desglose',
    random: 'Aleatoria',
    ask: 'Pregunta',
    pick: 'Elección',
    answer: 'Responde Yes o No',
    help: 'Cómo se usa',
  },

  pick: {
    usage: 'Dame al menos dos opciones — /pick Patrulla de goblins | Sala vacía',
    tooMany: 'Demasiadas opciones — 100 como máximo.',
    spaceSplit:
      'Cada palabra se ha convertido en una opción — usa , o | para no partir las frases.',
  },

  help: `Notación de dados de rol, para tirar en cualquier chat.

${manual('Guía completa', 'es')}

<b>Comandos</b>
/roll [notación] — tira y muestra el total
/full [notación] — tira y muestra el desglose dado a dado
/random — tira d100 (<code>d%</code>)
/ask [pregunta] — responde Yes o No
/pick [opciones] — elige una al azar (beta)
/help — esta guía

Modo en línea: escribe @rollrobot [notación] en cualquier chat, o elige una sugerencia de la lista.

<b>Notación</b>
<code>2d20+5</code> — dados y aritmética: + - * / y paréntesis
<code>4d6kh3</code> — conserva los 3 más altos (también kl, dh, dl)
<code>d8!</code> — dados explosivos
<code>2d6r&lt;3</code> — vuelve a tirar por debajo de 3 (ro — una sola vez)
<code>4d6min2</code> — pon un mínimo de 2 en cada dado (también max)
<code>6d10&gt;=6f1</code> — cuenta éxitos, resta los unos como fallos
<code>1d20+7 vs 15</code> — prueba contra una CD, grados de éxito de Pathfinder 2e
<code>4dF</code> — dados Fate
<code>d%</code> — dado porcentual
<code>2d6+floor(1d4/2)</code> — funciones: floor, ceil, round, abs, min, max, sqrt, pow

<b>Preguntar y elegir</b>
<code>/ask ¿La puerta tiene trampa?</code> — todo lo que sigue al comando es la pregunta
<code>/pick Patrulla de goblins | Sala vacía</code> — dos opciones o más, separadas por , | ; o un salto de línea

Prueba la notación en vivo en el ${playground('área de pruebas')}, o consulta la ${reference('referencia completa')}.`,

  commands: [
    { command: 'roll', description: 'Tira dados — /roll 2d20kh1+5' },
    { command: 'full', description: 'Tira con desglose — /full 4d6kh3' },
    { command: 'random', description: 'Tira d100' },
    { command: 'ask', description: 'Responde Yes o No — /ask ¿Atacamos?' },
    {
      command: 'pick',
      description: 'Elige una opción al azar — /pick Patrulla de goblins | Sala vacía',
    },
    { command: 'help', description: 'Guía de notación y enlaces' },
  ],

  shortDescription:
    'Dados de rol en cualquier chat — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Notación de dados de rol, para tirar en cualquier chat.
${manualUrl('es')}

4d6kh3 para puntuaciones de característica
2d20kh1+7 con ventaja
1d20+12 vs 20 para una prueba de Pathfinder 2e
7d10>=6f1 para una reserva de Storyteller
{1d8!, 1d6!}kh1 para Savage Worlds
4dF para Fate
d% para Call of Cthulhu

/roll da el total, /full el desglose dado a dado, /ask un Yes o No, /pick una opción al azar (beta), /help la guía de notación. Escribe @rollrobot en cualquier chat para tirar sin añadir el bot.`,
};
