# design-bilingual-prompts-library
Design Bilingual Prompts Library is a lightweight Progressive Web App (PWA) for organizing and managing prompts in multiple languages. It can be installed on desktop and Android devices directly from the browser and supports offline access through a service worker.
سایت را در مرورگر باز کنید
از سایدبار روی «نصب اپلیکیشن» بزنید (یا در اندروید/دسکتاپ آیکون نصب نوار آدرس)
اپ روی صفحه اصلی/لیست برنامه‌ها می‌نشیند و از این پس مستقل و آفلاین کار می‌کند
خروجی نهایی: index.html تک‌فایل + منیفست + سرویس‌ورکر + آیکون‌ها — type-check تمیز و build موفق انجام شد.


قبل از هر دستور دیگه باید یک بار نصب کنی:

npm install
صبر کن تموم بشه (۱-۲ دقیقه)، بعد:
npm run dev

و آدرس http://localhost:5173 رو باز کن. ✅

برای نسخه نهایی هم بعداً:

npm run build
npm run preview
اگه npm install هم خطا داد، این‌ها رو چک کن:

نسخه Node.js — باید ۱۸ یا بالاتر باشه:

node -v
اگه قدیمیه از nodejs.org نسخه LTS رو نصب کن.

نصب تمیز از نو — اگه قبلاً نصفه‌نیمه نصب شده:

rmdir /s /q node_modules
del package-lock.json
npm install
فقط مطمئن شو ترمینال رو توی همین پوشه پروژه باز کردی (که الان کردی ✅ — نکته: قسمت «app project» فاصله داره ولی مشکلی ایجاد نمی‌کنه).
