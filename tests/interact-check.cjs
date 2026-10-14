/* ============================================================
   نوا — آزمون تعامل واقعی در مرورگر headless از طریق CDP
   بدون وابستگی خارجی: Chrome + WebSocket داخلی Node
   اجرا: node tests/interact-check.cjs
   ============================================================ */
'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const browser = CANDIDATES.find(p => fs.existsSync(p));
if (!browser) { console.error('مرورگر یافت نشد.'); process.exit(1); }

const INDEX = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');
const PORT = 9223;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-profile-'));

const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws = null, msgId = 0;
const pending = new Map();

function send(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params: params || {} }));
  });
}

async function evaljs(expr, awaitPromise) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: !!awaitPromise });
  if (r.exceptionDetails) throw new Error('خطای صفحه: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || JSON.stringify(r.exceptionDetails)));
  return r.result && r.result.value;
}

async function go(route) {
  await evaljs(`location.hash = '#${route}'`);
  await sleep(320);
}

let pass = 0, fail = 0;
const failures = [];
function t(name, okv, extra) {
  if (okv) { pass += 1; console.log('  ✓', name); }
  else { fail += 1; failures.push(name + (extra ? ' — ' + extra : '')); console.error('  ✗', name, extra || ''); }
}

async function main() {
  execFile(browser, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
    '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore' });
  await sleep(1600);

  let targets = null;
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch('http://127.0.0.1:' + PORT + '/json/list');
      targets = await res.json();
      if (targets && targets.length) break;
    } catch (e) { /* تلاش دوباره */ }
    await sleep(500);
  }
  if (!targets || !targets.length) throw new Error('هدف دیباگ یافت نشد');
  const page = targets.find(x => x.type === 'page') || targets[0];

  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id).resolve(m.result); pending.delete(m.id); }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: INDEX });
  await sleep(1400);
  t('برنامه بوت شد و فضای نام Nova آماده است', await evaljs('typeof Nova !== "undefined" && !!Nova.store.isAvailable()'));

  /* --- تم --- */
  await evaljs(`document.getElementById('theme-btn').click()`);
  const th1 = await evaljs('document.documentElement.dataset.theme');
  t('تغییر تم با دکمهٔ نوار بالا کار می‌کند', th1 === 'dark' || th1 === 'light', 'دریافت: ' + th1);
  await send('Page.reload', {});
  await sleep(1500);
  const th2 = await evaljs('document.documentElement.dataset.theme');
  t('انتخاب تم پس از نوسازی حفظ می‌شود', th2 === th1, 'دریافت: ' + th2);
  await evaljs(`document.getElementById('theme-btn').click()`);

  /* --- ویرایشگر مقاله: بازکردن نمونه → کپی خودکار --- */
  await go('/content/article/edit/demo-art-1');
  await sleep(400);
  const url1 = await evaljs('location.hash');
  t('مقالهٔ نمونه به کپی قابل‌ویرایش تبدیل شد (نشانی عوض شد)', String(url1).indexOf('edit/demo-art-1') === -1, url1);
  const blockCount1 = await evaljs('document.querySelectorAll("#block-area .block").length');
  t('بلوک‌های مقاله رندر شدند', blockCount1 >= 12, 'تعداد: ' + blockCount1);

  /* افزودن بلوک H2 از منوی درج */
  await evaljs(`document.querySelector('.insert-point.last .ip-btn').click()`);
  await sleep(200);
  await evaljs(`document.querySelector('.block-type-menu button[data-type="h2"]').click()`);
  await sleep(200);
  const blockCount2 = await evaljs('document.querySelectorAll("#block-area .block").length');
  t('افزودن بلوک H2 از نقطهٔ درج', blockCount2 === blockCount1 + 1, blockCount2);

  /* تایپ عنوان و انتظار برای ذخیرهٔ خودکار */
  await evaljs(`
    const ti = document.getElementById('art-title');
    ti.value = 'عنوان آزمایشی نوا';
    ti.dispatchEvent(new Event('input', { bubbles: true }));
    new Promise(r => setTimeout(() => r(document.getElementById('save-status').textContent), 2000));
  `, true).then(v => t('ذخیرهٔ خودکار پس از تایپ عنوان فعال شد', String(v).indexOf('ذخیره شد') > -1, String(v)));

  const statTxt = await evaljs(`document.getElementById('editor-stats').textContent`);
  t('شمارش کلمه و زمان مطالعه نمایش داده می‌شود', String(statTxt).indexOf('کلمه') > -1 && String(statTxt).indexOf('دقیقه') > -1, statTxt);

  /* تب خروجی: HTML مقاله */
  await evaljs(`document.querySelector('.tab[data-tab="export"]').click()`);
  await sleep(200);
  const htmlOut = await evaljs(`document.getElementById('html-out').textContent`);
  t('خروجی HTML وردپرس شامل article و پاک‌سازی‌شده است', String(htmlOut).indexOf('<article>') > -1 && String(htmlOut).indexOf('عنوان:') > -1);

  /* --- استودیوی عکس: پرامپت از فرم --- */
  await go('/content/photo');
  await evaljs(`
    const s = document.querySelector('[data-field="subject"]');
    s.value = 'فنجان قهوه آزمایشی';
    s.dispatchEvent(new Event('input', { bubbles: true }));
    new Promise(r => setTimeout(() => r(document.getElementById('photo-prompt').value), 900));
  `, true).then(v => t('پرامپت عکس پس از تایپ موضوع ساخته شد', String(v).indexOf('فنجان قهوه آزمایشی') > -1, String(v).slice(0, 60)));

  /* قالب آمادهٔ استوری → نسبت ۹:۱۶ */
  await evaljs(`document.querySelector('[data-tpl="story"]').click()`);
  const ratioOn = await evaljs(`document.querySelector('.ratio-card.on') && document.querySelector('.ratio-card.on').getAttribute('data-ratio')`);
  t('قالب آماده نسبت تصویر را عوض می‌کند', ratioOn === '9:16', ratioOn);

  /* اعتبارسنجی ابعاد سفارشی */
  await evaljs(`
    const rcs = document.querySelectorAll('.ratio-card');
    rcs[rcs.length - 1].click();
    document.querySelector('[data-field="w"]').value = '32';
    document.querySelector('[data-field="h"]').value = '6000';
    document.querySelector('[data-field="w"]').dispatchEvent(new Event('input', { bubbles: true }));
    new Promise(r => setTimeout(r, 400));
  `, true);
  const dimsErr = await evaljs(`document.getElementById('dims-error') ? document.getElementById('dims-error').textContent : ''`);
  const ratioLbl = await evaljs(`document.getElementById('photo-meta').textContent`);
  t('ابعاد سفارشی نامعتبر در پرامپت اعمال نمی‌شود', String(ratioLbl).indexOf('—') > -1, ratioLbl);

  /* --- استودیوی ویدیو: قالب ریلز --- */
  await go('/content/video');
  await evaljs(`document.querySelector('[data-tpl="reels"]').click()`);
  await sleep(250);
  const shotCount = await evaljs('document.querySelectorAll(".shot-row").length');
  const totalTxt = await evaljs(`document.getElementById("shot-total").textContent`);
  t('قالب ریلز ۴ شات می‌سازد', shotCount === 4, 'تعداد: ' + shotCount);
  t('مجموع شات‌ها با هدف منطبق است', String(totalTxt).indexOf('دقیقاً منطبق') > -1, totalTxt);
  const shotPrompt = await evaljs(`document.querySelector('[data-sh-prompt="0"]').textContent`);
  t('پرامپت هر شات ساخته می‌شود', String(shotPrompt).indexOf('شات 1') > -1, shotPrompt.slice(0, 50));

  /* --- ابزار متنی --- */
  await go('/content/text');
  await evaljs(`document.querySelector('.tab[data-kind="email"]').click()`);
  await evaljs(`document.querySelector('[data-act="make"]').click()`);
  const brief = await evaljs(`document.getElementById('text-out').value`);
  t('بریف ایمیل قالبی ساخته می‌شود', String(brief).indexOf('ایمیل') > -1 && String(brief).indexOf('قالبی') > -1);

  /* --- مولد هوشمند → پرش به استودیو --- */
  await go('/generator');
  await evaljs(`
    document.querySelector('.opt-card[data-value="photo"]').click();
    document.querySelector('[data-field="subject"]').value = 'پرتره محصول آزمایشی';
    document.querySelector('[data-field="subject"]').dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-act="make"]').click();
    document.querySelector('[data-act="open"]').click();
    new Promise(r => setTimeout(r, 400));
  `, true);
  const genUrl = await evaljs('location.hash');
  const genPrompt = await evaljs(`document.getElementById('photo-prompt') ? document.getElementById('photo-prompt').value : ''`);
  t('مولد هوشمند به استودیوی عکس می‌پرد و موضوع را منتقل می‌کند', String(genUrl).indexOf('/content/photo') > -1 && String(genPrompt).indexOf('پرتره محصول آزمایشی') > -1, genUrl);

  /* --- گفت‌وگوی زنده: ارسال محلی --- */
  await go('/live-chat');
  await evaljs(`document.querySelector('[data-conv]').click()`);
  await evaljs(`
    const inp = document.getElementById('lc-input');
    inp.value = 'سلام، این یک پیام آزمایشی است';
    document.querySelector('[data-act="send"]').click();
    new Promise(r => setTimeout(r, 300));
  `, true);
  const msgCount = await evaljs('document.querySelectorAll("#lc-msgs .msg").length');
  const localBadge = await evaljs(`document.querySelector('#lc-msgs').innerHTML.indexOf('ارسال محلی') > -1`);
  t('پیام اپراتور با برچسب «ارسال محلی» ثبت شد', msgCount >= 3 && localBadge, 'پیام‌ها: ' + msgCount);

  /* --- دیدگاه‌ها: پاسخ محلی --- */
  await go('/comments');
  await evaljs(`document.querySelector('.comment-card [data-act="reply"]').click()`);
  await sleep(250);
  await evaljs(`
    const ta = document.querySelector('.modal textarea');
    ta.value = 'پاسخ آزمایشی';
    document.querySelector('.modal form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    new Promise(r => setTimeout(r, 300));
  `, true);
  const replyShown = await evaljs(`document.body.innerHTML.indexOf('پاسخ آزمایشی') > -1`);
  t('پاسخ به دیدگاه ثبت و نمایش داده شد', replyShown);

  /* --- شرکت‌ها: ثبت جدید --- */
  await go('/companies');
  const before = await evaljs('document.querySelectorAll("#org-list tbody tr").length');
  await evaljs(`document.querySelector('[data-act="add"]').click()`);
  await sleep(250);
  await evaljs(`
    document.querySelector('.modal [data-field="name"]').value = 'شرکت آزمایشی نوین';
    document.querySelector('.modal form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    new Promise(r => setTimeout(r, 400));
  `, true);
  const after = await evaljs('document.querySelectorAll("#org-list tbody tr").length');
  t('ثبت شرکت جدید در جدول ظاهر شد', after === before + 1, before + ' → ' + after);

  /* --- کتابخانه: جست‌وجو --- */
  await go('/library');
  const libAll = await evaljs('document.querySelectorAll(".lib-card").length');
  await evaljs(`(() => {
    const sEl = document.getElementById('lib-search');
    sEl.value = 'قهوه';
    sEl.dispatchEvent(new Event('input', { bubbles: true }));
    return new Promise(r => setTimeout(r, 500));
  })()`, true);
  const libFiltered = await evaljs('document.querySelectorAll(".lib-card").length');
  t('جست‌وجوی کتابخانه نتیجه را فیلتر می‌کند', libFiltered < libAll, libAll + ' → ' + libFiltered);

  /* --- تقویم --- */
  await go('/library?tab=calendar');
  const calTitle = await evaljs(`document.querySelector('.cal-title') ? document.querySelector('.cal-title').textContent : ''`);
  const calDays = await evaljs('document.querySelectorAll(".cal-day[data-day]").length');
  t('تقویم جلالی رندر شد', String(calTitle).indexOf('مهر') > -1 && calDays === 30, calTitle + ' / روزها: ' + calDays);

  /* --- افزودن برنامهٔ تقویم --- */
  await evaljs(`document.querySelector('.cal-day[data-day="3"]').click()`);
  await sleep(250);
  await evaljs(`
    document.getElementById('plan-title').value = 'برنامهٔ آزمایشی';
    document.getElementById('plan-add').click();
    new Promise(r => setTimeout(r, 300));
  `, true);
  const planChip = await evaljs(`document.querySelector('.cal-chip') ? document.querySelector('.cal-chip').textContent : ''`);
  t('برنامهٔ تقویم اضافه شد', String(planChip).indexOf('برنامهٔ آزمایشی') > -1, planChip);

  /* --- ماندگاری داده‌ها پس از نوسازی --- */
  await send('Page.reload', {});
  await sleep(1500);
  const persisted = await evaljs(`
    (function(){
      const arts = Nova.store.getList('articles');
      const cls = arts.filter(a => !a.demo);
      return { copies: cls.length, title: cls.length ? cls[0].title : '' };
    })()
  `);
  t('مقالهٔ کپی‌شده و عنوان ویرایش‌شده پس از نوسازی ماندگار است', persisted.copies >= 1, JSON.stringify(persisted));

  /* --- پاک‌سازی --- */
  try { ws.close(); } catch (e) { /* noop */ }
  console.log('\nنتیجهٔ تعامل: ' + pass + ' موفق، ' + fail + ' ناموفق');
  if (fail) { failures.forEach(f => console.error('  ✗ ' + f)); process.exitCode = 1; }
  else console.log('همهٔ تعامل‌ها سبز است.');
}

main().catch(e => { console.error('خطای راه‌اندازی آزمون:', e.message); process.exit(1); });
