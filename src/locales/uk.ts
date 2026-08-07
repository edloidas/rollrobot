import { playground, reference } from './links';
import type { Messages } from './types';

export const uk: Messages = {
  inline: { roll: 'Кидок', full: 'Докладно', random: 'Випадковий' },

  help: `Кидай кубики як ніхто інший — повна рольова нотація: утримання/відкидання, вибухові кубики, перекидання, пул успіху і перевірки.

<b>Команди</b>
/roll [нотація] — кидок і сума (скорочення: /r)
/full [нотація] — кидок з розбором по кубиках (скорочення: /f)
/random — кидок d100 (<code>d%</code>)
/help — ця довідка

Інлайн: напиши @rollrobot [нотація] у будь-якому чаті або вибери варіант зі списку.

<b>Нотація</b>
<code>2d20+5</code> — кубики й арифметика: + - * / і дужки
<code>4d6kh3</code> — залишити 3 найбільші (також kl, dh, dl)
<code>d8!</code> — вибухові кубики
<code>2d6r&lt;3</code> — перекидання значень менших за 3 (ro — перекидання один раз)
<code>4d6min2</code> — підняти кожен кубик щонайменше до 2 (також max)
<code>6d10&gt;=6f1</code> — підрахунок успіхів, одиниці віднімаються як провали
<code>1d20+7 vs 15</code> — перевірка проти складності зі ступенями успіху
<code>4dF</code> — кубики Fate, <code>d%</code> — відсотковий
<code>2d6+floor(1d4/2)</code> — функції: floor, ceil, round, abs, min, max, sqrt, pow

Коротка форма: <code>/roll 20</code> кидає d20, <code>/roll 2 10 -1</code> кидає 2d10-1.

Спробуй нотацію наживо в ${playground('пісочниці')} або відкрий ${reference('повний довідник')}.`,

  commands: [
    { command: 'roll', description: 'Кидок кубиків — /roll 2d20kh1+5' },
    { command: 'full', description: 'Кидок з розбором — /full 4d6kh3' },
    { command: 'random', description: 'Кидок d100' },
    { command: 'help', description: 'Довідка з нотації та посилання' },
  ],

  shortDescription:
    'Кубики для настолок у будь-якому чаті — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Нотація кубиків для настільних рольових ігор — у будь-якому чаті.

4d6kh3 для характеристик, 2d20kh1+7 з перевагою, 1d20+12 vs 20 для перевірки в Pathfinder, 7d10>=6f1 для пулу Storyteller, {1d8!, 1d6!}kh1 для Savage Worlds, 4dF для Fate, d% для Call of Cthulhu.

/roll дає суму, /full — розбір по кубиках, /help — довідку з нотації. Напиши @rollrobot у будь-якому чаті, щоб кинути кубики без додавання бота.`,
};
