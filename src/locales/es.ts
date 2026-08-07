import { playground, reference } from './links';
import type { Messages } from './types';

export const es: Messages = {
  inline: { roll: 'Tirada', full: 'Desglose', random: 'Aleatoria' },

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

Comprueba la notación en vivo en el ${playground('área de pruebas')}, o consulta la ${reference('referencia completa')}.`,

  commands: [
    { command: 'roll', description: 'Tira dados — /roll 2d20kh1+5' },
    { command: 'full', description: 'Tira con desglose — /full 4d6kh3' },
    { command: 'random', description: 'Tira d100' },
    { command: 'help', description: 'Guía de notación y enlaces' },
  ],

  shortDescription:
    'Tira dados de rol con notación completa — mantener/descartar, dados explosivos, reservas de éxitos.',

  description:
    'Tira los dados como nadie. Notación de rol completa: mantener/descartar, dados explosivos, nuevas tiradas, reservas de éxitos y pruebas contra una CD. Usa /roll para el total, /full para el desglose dado a dado, o escribe @rollrobot en cualquier chat.',
};
