import { hasPersian, normalize } from "./utils";

export type TransformId = "structure" | "condense" | "role" | "steps" | "varify";

export const TRANSFORMS: TransformId[] = [
  "structure",
  "condense",
  "role",
  "steps",
  "varify",
];

const EN_STOP = new Set(
  "the a an and or but with from that this these those your you for into are was were will would should could please make write give about have has been their there here what when where which while".split(
    " "
  )
);
const FA_STOP = new Set(
  "از با که در به را این آن برای تا است هست شد می شود نمی یک یکی های تر بیش هر چه اگر هم یا نیز کنید بده بدهد لطفاً لطفا".split(
    " "
  )
);

function structure(text: string, fa: boolean): string {
  return fa
    ? `نقش: تو یک متخصص باتجربه هستی که خروجی‌های دقیق و کاربردی می‌سازد.

زمینه و داده‌ها:
«${text}»

وظیفه:
- درخواست بالا را به دقیق‌ترین شکل ممکن اجرا کن.
- اگر چیزی مبهم بود، ابتدا حداکثر ۳ سؤال روشن‌کننده بپرس.

قیود:
- پاسخ مستقیم و بدون حاشیه باشد.
- لحن: حرفه‌ای اما روان.

قالب خروجی:
۱) جمع‌بندی یک‌خطی
۲) بدنه اصلی
۳) گام بعدی پیشنهادی`
    : `Role: You are a seasoned expert who produces precise, actionable output.

Context & input:
"${text}"

Task:
- Fulfill the request above as precisely as possible.
- If anything is ambiguous, ask up to 3 clarifying questions first.

Constraints:
- Be direct; no fluff or filler.
- Tone: professional yet natural.

Output format:
1) One-line summary
2) Main body
3) Suggested next step`;
}

const FILLERS_EN = ["actually", "basically", "really", "very", "just", "quite", "simply", "literally"];
const FILLERS_FA = ["در واقع", "به طور کلی", "لطفاً حتماً", "به هر حال", "واقعاً"];

function condense(text: string, fa: boolean): string {
  let out = text.replace(/\s+/g, " ").trim();
  const fillers = fa ? FILLERS_FA : FILLERS_EN;
  fillers.forEach((f) => {
    out = out.split(f).join(" ");
  });
  out = out.replace(
    /\b(please|kindly)\s/gi,
    ""
  );
  out = out.replace(/\s{2,}/g, " ").replace(/\s+([.,؛،!؟?])/g, "$1").trim();
  const sentences = out.match(/[^.!؟?\n]+[.!؟?]*/g) || [out];
  const kept = sentences.filter((s) => s.trim().length > 3);
  const body = kept.join(fa ? " " : " ").trim();
  return fa
    ? `${body}\n\nخروجی را حداکثر در نصف طول متن اولیه و فقط با نکات ضروری بنویس.`
    : `${body}\n\nAnswer in at most half the length of the original, keeping only the essentials.`;
}

function role(text: string, fa: boolean): string {
  return fa
    ? `به‌عنوان یک مشاور ارشد با ۱۵ سال سابقه در این حوزه عمل کن و پاسخ را از دید یک حرفه‌ای واقعی بده؛ نه یک مقاله کلیشه‌ای.

درخواست من:
«${text}»

معیار کیفیت: مشخص، عملی و بدون کلی‌گویی. با یک مثال واقعی پاسخ را زمینی کن.`
    : `Act as a senior consultant with 15 years of hands-on experience in this field. Answer like a real practitioner — not a generic article.

My request:
"${text}"

Quality bar: specific, actionable, zero boilerplate. Ground the answer with one concrete example.`;
}

function steps(text: string, fa: boolean): string {
  return fa
    ? `${text}

راهنمای اجرا:
- مسئله را به ۵ تا ۷ گام روشن تقسیم کن.
- هر گام را با «گام n» شروع کن و معیار تکمیل آن را بنویس.
- ترتیب گام‌ها را از مهم‌ترین به جزئی‌ترین رعایت کن.
- در پایان یک چک‌لیست کوتاه برای بررسی نهایی بده.`
    : `${text}

Execution guide:
- Break the problem into 5 to 7 clear steps.
- Start each step with "Step n" and state its completion criterion.
- Order steps from most critical to most detailed.
- End with a short final checklist.`;
}

function varify(text: string): { out: string; found: number } {
  const words = text.match(/[\p{L}\p{N}_-]{4,}/gu) || [];
  const freq = new Map<string, number>();
  words.forEach((w) => {
    const key = normalize(w);
    if (EN_STOP.has(key) || FA_STOP.has(key)) return;
    if (/^\d+$/.test(key)) return;
    freq.set(key, (freq.get(key) || 0) + 1);
  });
  const candidates = [...freq.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  let out = text;
  candidates.forEach(([word]) => {
    const safe = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safe, "gi"), (m) =>
      m === m.toUpperCase() && m.length > 1 ? m : `{{${word}}}`
    );
  });
  return { out, found: candidates.length };
}

export function runTransform(id: TransformId, text: string): string {
  const fa = hasPersian(text);
  switch (id) {
    case "structure":
      return structure(text, fa);
    case "condense":
      return condense(text, fa);
    case "role":
      return role(text, fa);
    case "steps":
      return steps(text, fa);
    case "varify": {
      const { out, found } = varify(text);
      if (found > 0) return out;
      return fa
        ? `${text}\n\n— متغیرهای پیشنهادی (دستی جای‌گذاری کنید): {{موضوع}} · {{مخاطب}} · {{لحن}}`
        : `${text}\n\n— Suggested variables (place them manually): {{topic}} · {{audience}} · {{tone}}`;
    }
  }
}
