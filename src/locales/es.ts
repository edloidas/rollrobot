import { playground, reference } from './links';
import type { Messages } from './types';

export const es: Messages = {
  inline: { roll: 'Tirada', full: 'Desglose', random: 'Aleatoria', help: 'Cómo se usa' },

  help: `Tira los dados como nadie — notación de rol completa con mantener/descartar, dados explosivos, nuevas tiradas, reservas de éxitos y pruebas.

<b>Comandos</b>
/roll [notación] — tira y muestra el total (atajo: /r)
/full [notación] — tira con el desglose dado a dado (atajo: /f)
/random — tira d100 (<code>d%</code>)
/help — esta guía

En línea: escribe @rollrobot [notación] en cualquier chat, o elige una opción de la lista.

<b>Notación</b>
<code>2d20+5</code> — dados y aritmética: + - * / y paréntesis
<code>4d6kh3</code> — mantén los 3 más altos (también kl, dh, dl)
<code>d8!</code> — dados explosivos
<code>2d6r&lt;3</code> — vuelve a tirar por debajo de 3 (ro — solo una vez)
<code>4d6min2</code> — pon un mínimo de 2 en cada dado (también max)
<code>6d10&gt;=6f1</code> — cuenta éxitos, resta los unos como fallos
<code>1d20+7 vs 15</code> — prueba contra una CD con grados de éxito
<code>4dF</code> — dados Fate, <code>d%</code> — porcentual
<code>2d6+floor(1d4/2)</code> — funciones: floor, ceil, round, abs, min, max, sqrt, pow

Notación abreviada: <code>/roll 20</code> tira d20, <code>/roll 2 10 -1</code> tira 2d10-1.

Nombra una tirada citándola al final: <code>/roll 2d20+1 "Percepción"</code>.

Comprueba la notación en vivo en el ${playground('área de pruebas')}, o consulta la ${reference('referencia completa')}.`,

  commands: [
    { command: 'roll', description: 'Tira dados — /roll 2d20kh1+5' },
    { command: 'full', description: 'Tira con desglose — /full 4d6kh3' },
    { command: 'random', description: 'Tira d100' },
    { command: 'help', description: 'Guía de notación y enlaces' },
  ],

  shortDescription:
    'Dados de rol en cualquier chat — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Notación de dados de rol, tirada en cualquier chat.

4d6kh3 para características, 2d20kh1+7 con ventaja, 1d20+12 vs 20 para una prueba de Pathfinder, 7d10>=6f1 para una reserva de Storyteller, {1d8!, 1d6!}kh1 para Savage Worlds, 4dF para Fate, d% para Call of Cthulhu.

/roll da el total, /full el desglose dado a dado, /help la guía de notación. Escribe @rollrobot en cualquier chat para tirar sin añadir el bot.`,
};
