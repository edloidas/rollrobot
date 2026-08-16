import { manual, manualUrl, playground, reference } from './links';
import type { Messages } from './types';

export const be: Messages = {
  inline: {
    roll: 'Кідок',
    full: 'Падрабязны',
    random: 'Выпадковы',
    ask: 'Пытанне',
    pick: 'Выбар',
    answer: 'Адказвае Yes або No',
    help: 'Як карыстацца',
  },

  pick: {
    usage: 'Дай прынамсі два варыянты — /pick Патруль гоблінаў | Пусты пакой',
    tooMany: 'Занадта шмат варыянтаў — не больш за 100.',
    spaceSplit: 'Кожнае слова стала варыянтам — выкарыстоўвай , або | для цэлых фраз.',
  },

  help: `Натацыя кубікаў для настолак — кідай у любым чаце.

${manual('Поўны дапаможнік', 'be')}

<b>Каманды</b>
/roll [натацыя] — кідок і сума
/full [натацыя] — кідок з разборам па кубіках
/random — кідок d100 (<code>d%</code>)
/ask [пытанне] — адказ Yes або No
/pick [варыянты] — выбар наўздагад (бета)
/help — гэтая даведка

Інлайн: напішы @rollrobot [натацыя] ў любым чаце або абяры загатоўку са спіса.

<b>Натацыя</b>
<code>2d20+5</code> — кубікі і арыфметыка: + - * / і дужкі
<code>4d6kh3</code> — пакінуць 3 найбольшыя (таксама kl, dh, dl)
<code>d8!</code> — выбуховыя кубікі
<code>2d6r&lt;3</code> — перакід значэнняў, меншых за 3 (ro — перакід адзін раз)
<code>4d6min2</code> — падняць кожны кубік прынамсі да 2 (таксама max)
<code>6d10&gt;=6f1</code> — падлік поспехаў, адзінкі адымаюцца як правалы
<code>1d20+7 vs 15</code> — праверка супраць складанасці, ступені поспеху Pathfinder 2e
<code>4dF</code> — кубікі Fate
<code>d%</code> — працэнтны кубік
<code>2d6+floor(1d4/2)</code> — функцыі: floor, ceil, round, abs, min, max, sqrt, pow

<b>Пытанне і выбар</b>
<code>/ask На дзвярах пастка?</code> — пытаннем становіцца ўсё пасля каманды
<code>/pick Патруль гоблінаў | Пусты пакой</code> — прынамсі два варыянты, раздзяляй , | ; або пераносам радка

Паспрабуй натацыю ў ${playground('пясочніцы')} або адкрый ${reference('поўны даведнік натацыі')}.`,

  commands: [
    { command: 'roll', description: 'Кідок кубікаў — /roll 2d20kh1+5' },
    { command: 'full', description: 'Кідок з разборам — /full 4d6kh3' },
    { command: 'random', description: 'Кідок d100' },
    { command: 'ask', description: 'Адказ Yes або No — /ask Атакуем?' },
    { command: 'pick', description: 'Выбар наўздагад — /pick Патруль гоблінаў | Пусты пакой' },
    { command: 'help', description: 'Даведка па натацыі і спасылкі' },
  ],

  shortDescription:
    'Кубікі для настолак у любым чаце — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Натацыя кубікаў для настолак — кідай у любым чаце.
${manualUrl('be')}

4d6kh3 для характарыстык
2d20kh1+7 з перавагай
1d20+12 vs 20 для праверкі ў Pathfinder 2e
7d10>=6f1 для пулу Storyteller
{1d8!, 1d6!}kh1 для Savage Worlds
4dF для Fate
d% для Call of Cthulhu

/roll дае суму, /full — разбор па кубіках, /ask — Yes або No, /pick — варыянт наўздагад (бета), /help — даведку па натацыі. Напішы @rollrobot у любым чаце, каб кінуць кубікі, не дадаючы бота.`,
};
