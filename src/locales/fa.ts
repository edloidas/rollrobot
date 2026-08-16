import { manual, manualUrl, playground, reference } from './links';
import type { Messages } from './types';

// ! Line structure is load-bearing here — do not reflow. Anything holding notation, a
//   `/command` or an `@mention` must open with a Latin character, or the line resolves
//   right-to-left and strands the leading `/` or `@` at the far end. Notation must not
//   follow Persian directly either: an Arabic letter reclassifies the digit after it and
//   splits `2d10-1` in two. All of it assumes the client resolves direction per line.
// ! Mirrored punctuation is the other trap. Guillemets carry no Bidi_Paired_Bracket_Type, so
//   a `«…»` pair split across an LTR run and an RTL one resolves to two levels and the closing
//   mark renders mirrored — keep a quoted example on a line of its own, away from the prose
//   that explains it. Same reason `manual()` ornaments the guide link with one glyph twice.

export const fa: Messages = {
  inline: {
    roll: 'پرتاب',
    full: 'جزئیات',
    random: 'پرتاب تصادفی',
    ask: 'پرسش',
    pick: 'انتخاب',
    answer: 'پاسخ Yes یا No',
    help: 'راهنما',
  },

  pick: {
    usage: '/pick گشت گابلین‌ها | اتاق خالی — دست‌کم دو گزینه بده',
    tooMany: 'گزینه‌ها بیش از حد زیادند — حداکثر 100 مورد',
    spaceSplit: 'هر واژه یک گزینه شد — برای نگه‌داشتن عبارت‌ها از ، یا | استفاده کن',
  },

  help: `نمادگذاری تاس برای بازی‌های نقش‌آفرینی رومیزی، در هر گفت‌وگو.

${manual('راهنمای کامل', 'fa')}

<b>دستورها</b>
/roll 2d20+5 — پرتاب و نمایش مجموع
/full 4d6kh3 — پرتاب با جزئیات، تاس به تاس
/random — پرتاب تاس d100 (<code>d%</code>)
/ask — پاسخ Yes یا No
/pick — انتخاب تصادفی یک گزینه، آزمایشی
/help — همین راهنما

Inline: @rollrobot را همراه با نمادگذاری در هر گفت‌وگو بنویس، یا یکی از گزینه‌های آماده را از فهرست انتخاب کن

<b>نمادگذاری</b>
<code>2d20+5</code> — تاس و محاسبات: پرانتز و عملگرهای + - * /
<code>4d6kh3</code> — نگه‌داشتن سه تاس با بالاترین مقدار، همچنین (kl, dh, dl)
<code>d8!</code> — تاس انفجاری
<code>2d6r&lt;3</code> — پرتاب مجدد مقادیر کمتر از سه (ro — فقط یک بار)
<code>4d6min2</code> — حداقل مقدار هر تاس دو می‌شود، همچنین (max)
<code>6d10&gt;=6f1</code> — شمارش موفقیت‌ها، یک‌ها به‌عنوان شکست کم می‌شوند
<code>1d20+7 vs 15</code> — چک در برابر درجهٔ سختی، با درجات موفقیت Pathfinder 2e
<code>4dF</code> — تاس Fate
<code>d%</code> — تاس درصدی
<code>2d6+floor(1d4/2)</code> — توابع: floor, ceil, round, abs, min, max, sqrt, pow

<b>پرسش و انتخاب</b>
<code>/ask آیا در تله دارد؟</code> — هر چه پس از دستور بیاید، پرسش است
<code>/pick گشت گابلین‌ها | اتاق خالی</code> — دو گزینه یا بیشتر، جدا با کاما، خط عمودی، نقطه‌ویرگول یا خط جدید

نمادگذاری را در ${playground('محیط آزمایش')} امتحان کن، یا ${reference('مرجع کامل نمادگذاری')} را بخوان.`,

  commands: [
    { command: 'roll', description: '/roll 2d20kh1+5 — پرتاب تاس' },
    { command: 'full', description: '/full 4d6kh3 — پرتاب با جزئیات' },
    { command: 'random', description: '/random — پرتاب تاس d100' },
    { command: 'ask', description: '/ask — پاسخ Yes یا No' },
    { command: 'pick', description: '/pick — انتخاب تصادفی یک گزینه' },
    { command: 'help', description: 'راهنمای نمادگذاری و پیوندها' },
  ],

  shortDescription:
    'تاس نقش‌آفرینی رومیزی در هر گفت‌وگو — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu',

  description: `نمادگذاری تاس برای بازی‌های نقش‌آفرینی رومیزی، در هر گفت‌وگو.
${manualUrl('fa')}

4d6kh3 برای ویژگی‌ها
2d20kh1+7 با برتری
1d20+12 vs 20 برای چک در Pathfinder 2e
7d10>=6f1 برای مجموعهٔ تاس Storyteller
{1d8!, 1d6!}kh1 برای Savage Worlds
4dF برای Fate
d% برای Call of Cthulhu

/roll — مجموع را می‌دهد
/full — جزئیات هر تاس
/ask — پاسخ Yes یا No
/pick — انتخاب تصادفی، آزمایشی
/help — راهنمای نمادگذاری

@rollrobot را در هر گفت‌وگو بنویس تا بدون افزودن ربات تاس بیندازی`,
};
