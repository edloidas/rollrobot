import { playground, reference } from './links';
import type { Messages } from './types';

// ! Line structure is load-bearing here — do not reflow. Anything holding notation, a
//   `/command` or an `@mention` must open with a Latin character, or the line resolves
//   right-to-left and strands the leading `/` or `@` at the far end. Notation must not
//   follow Persian directly either: an Arabic letter reclassifies the digit after it and
//   splits `2d10-1` in two. All of it assumes the client resolves direction per line.

export const fa: Messages = {
  inline: { roll: 'پرتاب', full: 'جزئیات', random: 'پرتاب تصادفی', help: 'راهنما' },

  help: `مثل هیچ‌کس دیگری تاس بینداز — نمادگذاری کامل بازی‌های نقش‌آفرینی: نگه‌داشتن و کنار گذاشتن، تاس انفجاری، پرتاب مجدد، شمارش موفقیت‌ها و چک در برابر درجهٔ سختی.

<b>دستورها</b>
/roll 2d20+5 — پرتاب و نمایش مجموع، میان‌بر /r
/full 4d6kh3 — پرتاب با جزئیات هر تاس، میان‌بر /f
/random — پرتاب تاس d100 (<code>d%</code>)
/help — همین راهنما

Inline: @rollrobot را در هر گفت‌وگو همراه با نمادگذاری بنویس، یا از فهرست انتخاب کن

<b>نمادگذاری</b>
<code>2d20+5</code> — تاس و محاسبات: + - * / و پرانتز
<code>4d6kh3</code> — نگه‌داشتن سه تاس با بالاترین مقدار، همچنین (kl, dh, dl)
<code>d8!</code> — تاس انفجاری
<code>2d6r&lt;3</code> — پرتاب مجدد مقادیر کمتر از سه (ro — فقط یک پرتاب مجدد)
<code>4d6min2</code> — حداقل مقدار هر تاس دو می‌شود، همچنین (max)
<code>6d10&gt;=6f1</code> — شمارش موفقیت‌ها، یک‌ها به‌عنوان شکست کم می‌شوند
<code>1d20+7 vs 15</code> — چک در برابر درجهٔ سختی، با درجات موفقیت
<code>4dF</code> — تاس Fate
<code>d%</code> — تاس درصدی
<code>2d6+floor(1d4/2)</code> — توابع: floor, ceil, round, abs, min, max, sqrt, pow

<code>/roll 20</code> — کوتاه‌نویسی، همان d20
<code>2d10-1</code> — با کوتاه‌نویسی <code>/roll 2 10 -1</code>

<code>/roll 2d20+1 «ادراک»</code>
نام پرتاب را داخل گیومه و در پایان بنویس.

نمادگذاری را در ${playground('محیط آزمایش')} امتحان کن، یا ${reference('راهنمای کامل نمادگذاری')} را بخوان.`,

  commands: [
    { command: 'roll', description: '/roll 2d20kh1+5 — پرتاب تاس' },
    { command: 'full', description: '/full 4d6kh3 — پرتاب با جزئیات' },
    { command: 'random', description: '/random — پرتاب تاس d100' },
    { command: 'help', description: 'راهنمای نمادگذاری و پیوندها' },
  ],

  shortDescription:
    'تاس نقش‌آفرینی رومیزی در هر گفت‌وگو — D&D, Pathfinder, World of Darkness, Shadowrun, Fate',

  description: `نمادگذاری تاس برای بازی‌های نقش‌آفرینی رومیزی، در هر گفت‌وگو.

4d6kh3 برای ویژگی‌ها
2d20kh1+7 با برتری
1d20+12 vs 20 برای چک در Pathfinder
7d10>=6f1 برای مجموعهٔ تاس Storyteller
{1d8!, 1d6!}kh1 برای Savage Worlds
4dF برای Fate
d% برای Call of Cthulhu

/roll — مجموع را می‌دهد
/full — جزئیات هر تاس
/help — راهنمای نمادگذاری

@rollrobot را در هر گفت‌وگو بنویس تا بدون افزودن ربات تاس بیندازی`,
};
