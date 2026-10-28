import type { Category, Prompt, Store } from "../types";

const DAY = 86400000;
const now = Date.now();

type PromptOverrides = Partial<Prompt> &
  Pick<Prompt, "title" | "content" | "categoryId"> & {
    v1Content?: string;
    vNote?: string;
  };

function mkPrompt(id: string, overrides: PromptOverrides): Prompt {
  const created = overrides.createdAt ?? now - Math.floor(Math.random() * 20 + 2) * DAY;
  const v1 = overrides.v1Content;
  const versions = v1
    ? [
        { id: id + "-v2", n: 2, content: overrides.content, note: overrides.vNote ?? "", createdAt: created + DAY * 2 },
        { id: id + "-v1", n: 1, content: v1, note: "", createdAt: created },
      ]
    : [{ id: id + "-v1", n: 1, content: overrides.content, note: "", createdAt: created }];
  return {
    id,
    desc: "",
    tags: [],
    favorite: false,
    usage: Math.floor(Math.random() * 30),
    createdAt: created,
    updatedAt: overrides.updatedAt ?? created + DAY,
    defaults: {},
    ...overrides,
    versions,
  };
}

export const SEED_CATEGORIES: Category[] = [
  { id: "c-writing", label: { fa: "نوشتن", en: "Writing" }, icon: "pen", color: "#2dd4bf" },
  { id: "c-code", label: { fa: "کد و توسعه", en: "Code" }, icon: "code", color: "#38bdf8" },
  { id: "c-marketing", label: { fa: "مارکتینگ", en: "Marketing" }, icon: "mega", color: "#fbbf24" },
  { id: "c-learning", label: { fa: "یادگیری", en: "Learning" }, icon: "grad", color: "#a78bfa" },
  { id: "c-analysis", label: { fa: "تحلیل و داده", en: "Analysis" }, icon: "chart", color: "#fb7185" },
  { id: "c-life", label: { fa: "زندگی روزمره", en: "Everyday" }, icon: "coffee", color: "#a3e635" },
];

export function seedStore(): Store {
  const prompts: Prompt[] = [
    mkPrompt("p-summarize", {
      title: "خلاصه‌ساز سه‌لایه",
      categoryId: "c-writing",
      desc: "خلاصه دقیق و ساختاریافته از هر متن در سه سطح.",
      favorite: true,
      tags: ["خلاصه", "مقاله", "مطالعه"],
      updatedAt: now - DAY,
      defaults: { "تعداد جمله": "۵", لحن: "رسمی و روان" },
      usage: 47,
      content: `متن زیر را بخوان و خلاصه را در سه سطح ارائه بده:

متن:
«{{متن}}»

خروجی:
۱) خلاصه یک‌جمله‌ای
۲) خلاصه پاراگرافی در حداکثر {{تعداد جمله}} جمله
۳) سه نکته کلیدی به‌صورت بولت

لحن: {{لحن}} — از تکرار و حاشیه پرهیز کن.`,
      v1Content: `این متن را خلاصه کن و نکته‌های مهمش را بولت بده:
«{{متن}}»`,
      vNote: "افزودن سه سطح و متغیر لحن",
    }),
    mkPrompt("p-rewrite", {
      title: "بازنویسی حرفه‌ای",
      categoryId: "c-writing",
      desc: "متن را رسمی و روان می‌کند بدون تغییر معنا.",
      tags: ["بازنویسی", "لحن"],
      updatedAt: now - 2 * DAY,
      usage: 23,
      content: `متن زیر را بازنویسی کن تا حرفه‌ای، روان و بی‌نقص شود؛ معنای اصلی را تغییر نده.

متن اولیه:
«{{متن}}»

مخاطب: {{مخاطب}}
اگر بخشی مبهم بود، دو نسخه بده و تفاوتش را یک‌خطی توضیح بده.`,
    }),
    mkPrompt("p-coderev", {
      title: "Senior Code Reviewer",
      categoryId: "c-code",
      desc: "Strict, kind code review with concrete fixes.",
      favorite: true,
      tags: ["review", "quality", "refactor"],
      updatedAt: now - DAY / 2,
      usage: 61,
      defaults: { language: "TypeScript" },
      content: `Review the following {{language}} code like a senior engineer who is strict but kind.

Code:
\`\`\`{{language}}
{{code}}
\`\`\`

Focus on, in order:
1. Correctness & edge cases
2. Time/space complexity
3. Security pitfalls
4. Readability & naming

For each issue: quote the line, explain why it matters, then show the fix as a minimal diff. End with a one-paragraph verdict.`,
      v1Content: `Please review this {{language}} code and tell me what to improve:
{{code}}`,
      vNote: "Structured the review output",
    }),
    mkPrompt("p-regex", {
      title: "Regex Whisperer",
      categoryId: "c-code",
      desc: "Explains any regex token by token, then builds yours.",
      tags: ["regex", "explain"],
      updatedAt: now - 5 * DAY,
      usage: 12,
      content: `I will give you a regular expression in {{dialect}} dialect.

Pattern:
{{pattern}}

Do two things:
1. Explain it token by token in a table (token • meaning • example match).
2. Give 3 test strings: one that matches, one that fails, one tricky edge case.

Then suggest a readable alternative if the pattern can be simplified.`,
    }),
    mkPrompt("p-coldmail", {
      title: "ایمیل سرد که جواب می‌گیرد",
      categoryId: "c-marketing",
      desc: "ایمیل کوتاه، انسانی و هدفمند برای شروع گفت‌وگو.",
      favorite: true,
      tags: ["ایمیل", "فروش", "B2B"],
      updatedAt: now - 3 * DAY,
      usage: 34,
      defaults: { "نام محصول": "محصول ما" },
      content: `یک ایمیل سرد بنویس که واقعاً جواب بگیرد.

درباره گیرنده:
- نقش: {{نقش مخاطب}}
- دردی که احتمالاً دارد: {{درد مخاطب}}

درباره ما: {{نام محصول}} — {{مزیت اصلی}}

قوانین:
- حداکثر ۹۰ کلمه
- جمله اول شخصی‌سازی‌شده، نه کلیشه
- فقط یک CTA مشخص و کم‌هزینه (مثلاً پاسخ به همین ایمیل)
- موضوع ایمیل را هم بده (دو پیشنهاد)`,
      v1Content: `یک ایمیل فروش بنویس برای {{نقش مخاطب}} درباره {{نام محصول}}`,
    }),
    mkPrompt("p-brand", {
      title: "Brand Voice Kit",
      categoryId: "c-marketing",
      desc: "Distills a brand voice into reusable rules.",
      tags: ["brand", "copywriting"],
      updatedAt: now - 6 * DAY,
      usage: 9,
      content: `You are a brand strategist. Create a voice kit for {{brand}} in the {{industry}} space.

Deliver:
1. Voice in 3 adjectives (each with a one-line rationale)
2. We say / We never say — 6 pairs
3. Sentence rhythm: 3 rules with before→after rewrites
4. One hero tagline + 3 alternates

Audience: {{audience}}. Ban any jargon they would not use at a dinner table.`,
    }),
    mkPrompt("p-feynman", {
      title: "Feynman Tutor",
      categoryId: "c-learning",
      desc: "Teaches by making you explain, then fixing gaps.",
      favorite: false,
      tags: ["tutor", "study"],
      updatedAt: now - DAY / 3,
      usage: 40,
      defaults: { level: "high-school" },
      content: `Be my Feynman tutor for the topic: {{topic}}. My level: {{level}}.

Protocol:
1. Explain the core idea in under 120 words, with one everyday analogy.
2. Ask me to explain it back in my own words.
3. After I do, grade my explanation (A–F), point out exactly where my mental model breaks, and re-explain only that part with a better analogy.
4. Finish with 3 spaced-repetition questions.

Wait for my answer at step 2 before continuing.`,
    }),
    mkPrompt("p-sql", {
      title: "همراه SQL",
      categoryId: "c-analysis",
      desc: "از سوال محاوره‌ای تا کوئری امن و توضیح‌دار.",
      tags: ["SQL", "داده"],
      updatedAt: now - 4 * DAY,
      usage: 18,
      defaults: { "دیتابیس": "PostgreSQL" },
      content: `دیتابیس من {{دیتابیس}} است. ساختار جدول‌ها:
{{اسکیما}}

سؤال من:
«{{سؤال}}»

خروجی موردنظر:
۱) کوئری آماده اجرا با کامنت خط‌به‌خط
۲) توضیح کوتاه منطق JOINها و فیلترها
۳) یک هشدار درباره عملکرد اگر جدول بزرگ باشد`,
    }),
    mkPrompt("p-travel", {
      title: "برنامه‌ریز سفر هوشمند",
      categoryId: "c-life",
      desc: "برنامه سفر روزبه‌روز متناسب با بودجه و سلیقه.",
      tags: ["سفر", "برنامه‌ریزی"],
      updatedAt: now - 8 * DAY,
      usage: 15,
      content: `برای سفر من برنامه‌ریزی کن.

مقصد: {{مقصد}}
مدت: {{تعداد روز}} روز — بودجه روزانه: {{بودجه}}
سلیقه: {{علاقه‌مندی‌ها}}

خروجی:
- برنامه روزبه‌روز با منطق مسافتی (کارهای نزدیک به هم در یک روز)
- برای هر روز: صبح / ظهر / عصر + یک پیشنهاد پنهان و غیرتوریستی
- لیست وسایل مخصوص همین سفر
- به‌جای رستوران‌های معروف، گزینه محلی با رتبه خوب معرفی کن`,
      v1Content: `یک برنامه سفر {{تعداد روز}} روزه برای {{مقصد}} بنویس.`,
    }),
    mkPrompt("p-story", {
      title: "Story Sparks",
      categoryId: "c-writing",
      desc: "Ten conflict-first story seeds in any genre.",
      tags: ["fiction", "ideas"],
      updatedAt: now - 10 * DAY,
      usage: 7,
      content: `Generate 10 story seeds in the {{genre}} genre. Each seed is exactly three lines:

- Line 1: A protagonist who wants something badly (one vivid detail).
- Line 2: The conflict that makes getting it nearly impossible.
- Line 3: A twist that re-frames lines 1–2.

Theme to weave through all ten: {{theme}}.
No chosen ones, no amnesia, no "it was all a dream".`,
    }),
  ];
  return { prompts, categories: SEED_CATEGORIES };
}
