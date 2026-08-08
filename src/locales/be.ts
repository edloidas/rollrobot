import { playground, reference } from './links';
import type { Messages } from './types';

export const be: Messages = {
  inline: { roll: 'Кідок', full: 'Падрабязны', random: 'Выпадковы', help: 'Як карыстацца' },

  help: `Кідай кубікі як ніхто іншы — поўная ролевая натацыя: захаванне/скід, выбуховыя кубікі, перакіды, пулы поспехаў і праверкі.

<b>Каманды</b>
/roll [натацыя] — кідок і сума (скарот: /r)
/full [натацыя] — кідок з разборам па кубіках (скарот: /f)
/random — кідок d100 (<code>d%</code>)
/help — гэтая даведка

Інлайн: напішы @rollrobot [натацыя] ў любым чаце або абяры варыянт са спіса.

<b>Натацыя</b>
<code>2d20+5</code> — кубікі і арыфметыка: + - * / і дужкі
<code>4d6kh3</code> — пакінуць 3 найбольшыя (таксама kl, dh, dl)
<code>d8!</code> — выбуховыя кубікі
<code>2d6r&lt;3</code> — перакід значэнняў меншых за 3 (ro — перакід адзін раз)
<code>4d6min2</code> — падняць кожны кубік як мінімум да 2 (таксама max)
<code>6d10&gt;=6f1</code> — падлік поспехаў, адзінкі адымаюцца як правалы
<code>1d20+7 vs 15</code> — праверка супраць складанасці са ступенямі поспеху
<code>4dF</code> — кубікі Fate, <code>d%</code> — працэнтны
<code>2d6+floor(1d4/2)</code> — функцыі: floor, ceil, round, abs, min, max, sqrt, pow

Кароткі запіс: <code>/roll 20</code> кідае d20, <code>/roll 2 10 -1</code> кідае 2d10-1.

Паспрабуй натацыю ў ${playground('пясочніцы')} або адкрый ${reference('поўны даведнік')}.`,

  commands: [
    { command: 'roll', description: 'Кідок кубікаў — /roll 2d20kh1+5' },
    { command: 'full', description: 'Кідок з разборам — /full 4d6kh3' },
    { command: 'random', description: 'Кідок d100' },
    { command: 'help', description: 'Даведка па натацыі і спасылкі' },
  ],

  shortDescription:
    'Кубікі для настолак у любым чаце — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Натацыя кубікаў для настольных ролевых гульняў — у любым чаце.

4d6kh3 для характарыстык, 2d20kh1+7 з перавагай, 1d20+12 vs 20 для праверкі ў Pathfinder, 7d10>=6f1 для пула Storyteller, {1d8!, 1d6!}kh1 для Savage Worlds, 4dF для Fate, d% для Call of Cthulhu.

/roll дае суму, /full — разбор па кубіках, /help — даведку па натацыі. Напішы @rollrobot у любым чаце, каб кінуць кубікі без дадавання бота.`,
};
