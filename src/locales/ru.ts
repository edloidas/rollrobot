import { manual, manualUrl, playground, reference } from './links';
import type { Messages } from './types';

export const ru: Messages = {
  inline: {
    roll: 'Бросок',
    full: 'Разбор',
    random: 'Наугад',
    ask: 'Вопрос',
    pick: 'Выбор',
    answer: 'Отвечает Yes или No',
    help: 'Как пользоваться',
  },

  pick: {
    usage: 'Нужно хотя бы два варианта — /pick Патруль гоблинов | Пустая комната',
    tooMany: 'Слишком много вариантов — не больше 100.',
    spaceSplit: 'Каждое слово стало вариантом — используй , или | для целых фраз.',
  },

  help: `Нотация кубиков для настольных ролевых игр — в любом чате.

${manual('Полное руководство', 'ru')}

<b>Команды</b>
/roll [нотация] — бросок и сумма
/full [нотация] — бросок с разбором по кубикам
/random — бросок d100 (<code>d%</code>)
/ask [вопрос] — ответ Yes или No
/pick [варианты] — выбор наугад (бета)
/help — эта справка

Инлайн: напиши @rollrobot [нотация] в любом чате или выбери заготовку из списка.

<b>Нотация</b>
<code>2d20+5</code> — кубики и арифметика: + - * / и скобки
<code>4d6kh3</code> — оставить 3 наибольших (также kl, dh, dl)
<code>d8!</code> — взрывающиеся кубики
<code>2d6r&lt;3</code> — переброс значений меньше 3 (ro — переброс один раз)
<code>4d6min2</code> — поднять каждый кубик минимум до 2 (также max)
<code>6d10&gt;=6f1</code> — подсчёт успехов, единицы вычитаются как провалы
<code>1d20+7 vs 15</code> — проверка против сложности со степенями успеха Pathfinder 2e
<code>4dF</code> — кубики Fate
<code>d%</code> — процентный кубик
<code>2d6+floor(1d4/2)</code> — функции: floor, ceil, round, abs, min, max, sqrt, pow

<b>Вопрос и выбор</b>
<code>/ask На двери ловушка?</code> — всё после команды становится вопросом
<code>/pick Патруль гоблинов | Пустая комната</code> — минимум два варианта через , | ; или перенос строки

Попробуй нотацию в ${playground('песочнице')} или открой ${reference('полный справочник по нотации')}.`,

  commands: [
    { command: 'roll', description: 'Бросок кубиков — /roll 2d20kh1+5' },
    { command: 'full', description: 'Бросок с разбором — /full 4d6kh3' },
    { command: 'random', description: 'Бросок d100' },
    { command: 'ask', description: 'Ответ Yes или No — /ask Атакуем?' },
    { command: 'pick', description: 'Выбор наугад — /pick Патруль гоблинов | Пустая комната' },
    { command: 'help', description: 'Справка по нотации и ссылки' },
  ],

  shortDescription:
    'Кубики для настолок в любом чате — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Нотация кубиков для настольных ролевых игр — в любом чате.
${manualUrl('ru')}

4d6kh3 для характеристик
2d20kh1+7 с преимуществом
1d20+12 vs 20 для проверки в Pathfinder 2e
7d10>=6f1 для пула Storyteller
{1d8!, 1d6!}kh1 для Savage Worlds
4dF для Fate
d% для Call of Cthulhu

/roll даёт сумму, /full — разбор по кубикам, /ask — Yes или No, /pick — вариант наугад (бета), /help — справку по нотации. Напиши @rollrobot в любом чате, чтобы бросить кубики, не добавляя бота.`,
};
