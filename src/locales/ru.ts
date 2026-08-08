import { playground, reference } from './links';
import type { Messages } from './types';

export const ru: Messages = {
  inline: { roll: 'Бросок', full: 'Разбор', random: 'Наугад', help: 'Как пользоваться' },

  help: `Бросай кубики как никто другой — полная ролевая нотация: оставить/отбросить, взрывающиеся кубики, перебросы, пулы успехов и проверки.

<b>Команды</b>
/roll [нотация] — бросок с суммой (сокращение: /r)
/full [нотация] — бросок с разбором по кубикам (сокращение: /f)
/random — бросок d100 (<code>d%</code>)
/help — эта справка

Инлайн: напиши @rollrobot [нотация] в любом чате или выбери вариант из списка.

<b>Нотация</b>
<code>2d20+5</code> — кубики и арифметика: + - * / и скобки
<code>4d6kh3</code> — оставить 3 наибольших (также kl, dh, dl)
<code>d8!</code> — взрывающиеся кубики
<code>2d6r&lt;3</code> — переброс значений меньше 3 (ro — переброс один раз)
<code>4d6min2</code> — поднять каждый кубик минимум до 2 (также max)
<code>6d10&gt;=6f1</code> — подсчёт успехов, единицы вычитаются как провалы
<code>1d20+7 vs 15</code> — проверка против сложности со степенями успеха
<code>4dF</code> — кубики Fate, <code>d%</code> — процентный кубик
<code>2d6+floor(1d4/2)</code> — функции: floor, ceil, round, abs, min, max, sqrt, pow

Короткая запись: <code>/roll 20</code> бросает d20, <code>/roll 2 10 -1</code> бросает 2d10-1.

Назови бросок, взяв название в кавычки в конце: <code>/roll 2d20+1 "Внимательность"</code>.

Попробуй нотацию в ${playground('песочнице')} или открой ${reference('полный справочник по нотации')}.`,

  commands: [
    { command: 'roll', description: 'Бросок кубиков — /roll 2d20kh1+5' },
    { command: 'full', description: 'Бросок с разбором — /full 4d6kh3' },
    { command: 'random', description: 'Бросок d100' },
    { command: 'help', description: 'Справка по нотации и ссылки' },
  ],

  shortDescription:
    'Кубики для настолок в любом чате — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Нотация кубиков для настольных ролевых игр — в любом чате.

4d6kh3 для характеристик, 2d20kh1+7 с преимуществом, 1d20+12 vs 20 для проверки в Pathfinder, 7d10>=6f1 для пула Storyteller, {1d8!, 1d6!}kh1 для Savage Worlds, 4dF для Fate, d% для Call of Cthulhu.

/roll даёт сумму, /full — разбор по кубикам, /help — справку по нотации. Напиши @rollrobot в любом чате, чтобы бросить кубики без добавления бота.`,
};
