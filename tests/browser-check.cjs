/* ============================================================
   نوا — آزمون رندر مرورگر واقعی (headless Chrome/Edge)
   هر مسیر با Chrome بی‌سری رندر و DOM خروجی با نشانگرهای
   اختصاصی همان صفحه بررسی می‌شود؛ بنر «خطای غیرمنتظره» در هیچ
   مسیری نباید ظاهر شود.
   اجرا: node tests/browser-check.cjs
   ============================================================ */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const browser = CANDIDATES.find(p => fs.existsSync(p));
if (!browser) { console.error('مرورگر Chrome/Edge یافت نشد.'); process.exit(1); }

const INDEX = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');

const ROUTES = [
  ['/dashboard', ['پیش‌نویس‌های اخیر', 'مسیر شروع', 'دادهٔ نمونه']],
  ['/content', ['مرکز تولید محتوا', 'ابزارهای متنی', 'مقاله و وبلاگ']],
  ['/content/article', ['واردکردن JSON', 'تقویم محتوایی سه‌ماهه']],
  ['/content/photo', ['استودیوی عکس', 'قالب‌های آماده', 'پرامپت نهایی', 'پرامپت منفی']],
  ['/content/video', ['استودیوی ویدیو', 'سناریو و شات‌بندی', 'سرویس هدف']],
  ['/content/text', ['ابزارهای متنی', 'بریف خروجی']],
  ['/generator', ['مولد هوشمند', 'قالبی']],
  ['/brand', ['هویت و لحن برند', 'کافه رستا']],
  ['/library', ['کتابخانه و تقویم محتوا', 'دادهٔ من']],
  ['/library?tab=calendar', ['امروز', 'مهر']],
  ['/live-chat', ['حالت آزمایشی', 'بازدیدکنندهٔ ناشناس']],
  ['/team-chat', ['کانال‌ها', 'عمومی']],
  ['/comments', ['پاسخ‌گویی به دیدگاه‌ها', 'مهدی']],
  ['/companies', ['شرکت‌ها', 'استودیو نارون']],
  ['/teams', ['تیم‌ها', 'تیم محتوا']],
  ['/domains', ['دامنه‌ها', 'caferasta.ir']],
  ['/users', ['کاربران', 'سارا محمدی']],
  ['/settings', ['تنظیمات و اتصال‌ها', 'متصل نیست']]
];

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-headless-'));
let pass = 0, fail = 0;
const failures = [];

for (const [route, markers] of ROUTES) {
  const file = path.join(outDir, route.replace(/[^a-z0-9]/gi, '_') + '.html');
  try {
    execFileSync(browser, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
      '--virtual-time-budget=6000', '--dump-dom', INDEX + '#' + route
    ], { stdio: ['ignore', fs.openSync(file, 'w'), 'ignore'], timeout: 45000 });
  } catch (e) {
    fail += 1; failures.push([route, 'اجرای مرورگر شکست خورد: ' + e.message]); continue;
  }
  const dom = fs.readFileSync(file, 'utf8');
  if (dom.length < 5000) { fail += 1; failures.push([route, 'DOM بسیار کوچک است — احتمالاً رندر نشد']); continue; }
  if (dom.indexOf('خطای غیرمنتظره در نمایش') !== -1) { fail += 1; failures.push([route, 'بنر خطای رندر در DOM هست']); continue; }
  const missing = markers.filter(m => dom.indexOf(m) === -1);
  if (missing.length) { fail += 1; failures.push([route, 'نشانگرهای غایب: ' + missing.join('، ')]); continue; }
  pass += 1;
  console.log('  ✓', route, '— همهٔ نشانگرها حاضرند (' + Math.round(dom.length / 1024) + 'KB)');
}

console.log('\nنتیجهٔ رندر مرورگر: ' + pass + ' مسیر موفق، ' + fail + ' ناموفق');
if (fail) {
  failures.forEach(([r, why]) => console.error('  ✗ ' + r + ' → ' + why));
  process.exit(1);
}
console.log('هیچ مسیری بنر خطای رندر ندارد.');
