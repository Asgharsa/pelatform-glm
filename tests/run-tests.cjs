/* ============================================================
   نوا — آزمون‌های منطق (اجرای Node، بدون مرورگر)
   node tests/run-tests.cjs
   فایل‌های هسته در یک زمینهٔ vm بارگذاری و از Node آزموده می‌شوند.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* ---------- زمینهٔ شبیه مرورگر (بدون localStorage واقعی) ---------- */
const ctx = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  navigator: {},
  location: { hash: '' },
  matchMedia: undefined,
  requestAnimationFrame: undefined
};
ctx.window = ctx;
ctx.self = ctx;
vm.createContext(ctx);

const CORE_FILES = [
  'js/core/utils.js',
  'js/core/icons.js',
  'js/core/store.js',
  'js/core/theme.js',
  'js/core/router.js',
  'js/core/ui.js',
  'js/data/options.js',
  'js/core/builders.js',
  'js/data/seed.js',
  'js/views/dashboard.js',
  'js/views/content-center.js',
  'js/views/article-list.js',
  'js/views/article-editor.js',
  'js/views/article-panel.js',
  'js/views/photo.js',
  'js/views/video.js',
  'js/views/text-tools.js',
  'js/views/generator.js',
  'js/views/brand.js',
  'js/views/library.js',
  'js/views/chats.js',
  'js/views/comments.js',
  'js/views/org.js',
  'js/views/settings.js'
];

let loaded = 0;
for (const f of CORE_FILES) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  try {
    vm.runInContext(src, ctx, { filename: f });
    loaded += 1;
  } catch (e) {
    console.error('✗ بارگذاری شکست خورد:', f, '\n ', e.message);
    process.exit(1);
  }
}

const N = ctx.Nova;
const U = N.utils;
const B = N.builders;
const O = N.options;

/* ---------- بک‌اند حافظه برای store ---------- */
function memoryBackend(limitBytes) {
  const map = new Map();
  let total = 0;
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      const s = String(v);
      const prev = map.has(k) ? map.get(k).length : 0;
      total += s.length - prev;
      if (limitBytes && total > limitBytes) {
        total -= s.length - prev;
        throw Object.assign(new Error('QuotaExceeded'), { name: 'QuotaExceededError' });
      }
      map.set(k, s);
    },
    removeItem: k => { if (map.has(k)) { total -= map.get(k).length; map.delete(k); } }
  };
}

/* ---------- چارچوب آزمون ---------- */
let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try {
    fn();
    pass += 1;
    console.log('  ✓', name);
  } catch (e) {
    fail += 1;
    failures.push({ name, e });
    console.error('  ✗', name, '\n     ', e.message);
  }
}
function eq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'مقایسه') + ' → دریافت: ' + JSON.stringify(a) + ' | انتظار: ' + JSON.stringify(b));
}
function ok(v, msg) { if (!v) throw new Error(msg || 'باید درست باشد'); }
function near(a, b, msg) { if (Math.abs(a - b) > 0.51) throw new Error((msg || 'تقریب') + ' → ' + a + ' !== ' + b); }

console.log('\n== بارگذاری ==');
t('همهٔ فایل‌ها بارگذاری شدند', () => eq(loaded, CORE_FILES.length, 'تعداد فایل'));
t('فضای نام Nova ساخته شد', () => ok(N && N.utils && N.store && N.builders));

console.log('\n== اعداد و تقویم جلالی ==');
t('faNum', () => { eq(U.faNum(123), '۱۲۳'); eq(U.faNum('a1b'), 'a۱b'); });
t('نوروز ۱۴۰۳ = 2024-03-20', () => {
  const g = U.toGregorian(1403, 1, 1);
  eq(g.gy + '-' + g.gm + '-' + g.gd, '2024-3-20');
});
t('نوروز ۱۴۰۴ = 2025-03-21', () => {
  const g = U.toGregorian(1404, 1, 1);
  eq(g.gy + '-' + g.gm + '-' + g.gd, '2025-3-21');
});
t('نوروز ۱۴۰۵ = 2026-03-21', () => {
  const g = U.toGregorian(1405, 1, 1);
  eq(g.gy + '-' + g.gm + '-' + g.gd, '2026-3-21');
});
t('2026-10-14 = 1405-07-22 (امروز نمونه)', () => {
  const j = U.toJalaali(new Date(2026, 9, 14));
  eq(j.jy + '/' + j.jm + '/' + j.jd, '1405/7/22');
});
t('۱۴۰۳ کبیسه است، ۱۴۰۴ و ۱۴۰۵ نه', () => {
  eq(U.isLeapJalaali(1403), true);
  eq(U.isLeapJalaali(1404), false);
  eq(U.isLeapJalaali(1405), false);
  eq(U.jalaaliMonthLength(1403, 12), 30);
  eq(U.jalaaliMonthLength(1404, 12), 29);
});
t('رفت‌وبرگشت تصادفی ۲۰۰۰ روز', () => {
  let d = new Date(2000, 0, 1).getTime();
  const step = Math.floor((new Date(2030, 0, 1).getTime() - d) / 2000);
  for (let i = 0; i < 2000; i++) {
    d += step;
    const date = new Date(d);
    const j = U.toJalaali(date);
    const g = U.toGregorian(j.jy, j.jm, j.jd);
    if (g.gy !== date.getFullYear() || g.gm !== date.getMonth() + 1 || g.gd !== date.getDate()) {
      throw new Error('ناهماهنگی در ' + date.toISOString());
    }
  }
});
t('سازگاری d2j/g2d با جفت معلوم (1399/1/1 = 2020-03-20)', () => {
  const g = U.toGregorian(1399, 1, 1);
  eq(g.gy + '-' + g.gm + '-' + g.gd, '2020-3-20');
});

console.log('\n== متن و امنیت ==');
t('escapeHtml همهٔ نویسه‌های خطرناک', () => {
  eq(U.escapeHtml('<img src=x onerror=alert(1)>&"\''), '&lt;img src=x onerror=alert(1)&gt;&amp;&quot;&#39;');
});
t('sanitizeRich: اجازهٔ b/strong/i/em/br/a امن', () => {
  const out = U.sanitizeRich('سلام <b>دنیا</b> <em>زیبا</em> <a href="https://x.ir">لینک</a> <br>');
  ok(out.indexOf('<b>دنیا</b>') > -1, 'b باید بماند: ' + out);
  ok(out.indexOf('<em>زیبا</em>') > -1, 'em باید بماند');
  ok(out.indexOf('href="https://x.ir"') > -1, 'href امن باید بماند');
  ok(out.indexOf('rel="noopener nofollow"') > -1, 'rel باید اضافه شود');
  ok(out.indexOf('<br>') > -1);
});
t('sanitizeRich: حذف اسکریپت، رویداد و javascript:', () => {
  let out = U.sanitizeRich('<script>alert(1)</script>سلام');
  ok(out.indexOf('<script') === -1 && out.indexOf('alert(1)') === -1, 'اسکریپت باید کاملاً حذف شود: ' + out);
  ok(out.indexOf('سلام') > -1);
  out = U.sanitizeRich('<style>body{}</style>متن');
  ok(out.indexOf('style') === -1 && out.indexOf('body') === -1, 'استایل باید حذف شود: ' + out);
  out = U.sanitizeRich('<a href="javascript:alert(1)">کلیک</a>');
  ok(out.indexOf('<a ') === -1, 'لینک javascript: باید حذف شود: ' + out);
  ok(out.indexOf('کلیک') > -1, 'متن لینک باید بماند');
  out = U.sanitizeRich('<b onclick="x()">متن</b>');
  ok(out.indexOf('onclick') === -1, 'ویژگی رویداد باید حذف شود');
  ok(out.indexOf('<b>متن</b>') > -1);
});
t('stripHtml بدون DOM', () => {
  eq(U.stripHtml('<p>سلام <b>دنیا</b></p>'), 'سلام دنیا');
  eq(U.stripHtml('a<br>b'), 'a b');
});
t('countWords و readingMinutes', () => {
  eq(U.countWords('سلام دنیا  خوش آمدید'), 4);
  eq(U.countWords(''), 0);
  eq(U.readingMinutes(0), 1);
  eq(U.readingMinutes(360), 2);
});
t('slugify و isValidSlug', () => {
  ok(U.slugify('سلام دنیا Hello World 123!').indexOf('سلام-دنیا-hello-world-123') > -1);
  ok(U.isValidSlug('hello-world-123'));
  ok(!U.isValidSlug('سلام دنیا'));
  ok(!U.isValidSlug('ab'));
});
t('اعتبارسنجی ایمیل و دامنه', () => {
  ok(U.validateEmail('a@b.co'));
  ok(!U.validateEmail('a@b'));
  ok(U.validateDomain('caferasta.ir'));
  ok(U.validateDomain('blog.caferasta.ir'));
  ok(!U.validateDomain('-bad.ir'));
  ok(!U.validateDomain('bad'));
});

console.log('\n== اعتبارسنجی استودیو ==');
t('validateCustomDims', () => {
  ok(B.validateCustomDims(1080, 1080).ok);
  ok(B.validateCustomDims(4096, 1024).ok, '۴:۱ مجاز است');
  ok(!B.validateCustomDims(32, 1080).ok, 'کمتر از ۶۴');
  ok(!B.validateCustomDims(5000, 1080).ok, 'بیش از ۴۰۹۶');
  ok(!B.validateCustomDims('a', 'b').ok);
  ok(!B.validateCustomDims(4096, 400).ok, 'نسبت بیش از ۸ به ۱');
});
t('validateRefFile', () => {
  ok(B.validateRefFile({ type: 'image/png', size: 1024 }).ok);
  ok(!B.validateRefFile({ type: 'text/plain', size: 10 }).ok);
  ok(!B.validateRefFile({ type: 'image/png', size: 9 * 1024 * 1024 }).ok, 'بیش از ۸ مگ');
});
t('creativeWord', () => {
  eq(B.creativeWord(10).fa, 'وفادار به ورودی');
  eq(B.creativeWord(50).fa, 'متعادل');
  eq(B.creativeWord(90).fa, 'آزاد و خلاق');
});

console.log('\n== پرامپت‌ساز عکس ==');
t('پرامپت فارسی شامل اجزا', () => {
  const p = B.buildPhotoPrompt({
    subject: 'فنجان قهوه', scene: 'میز چوبی', style: 'cinematic', quality: 'high',
    ratio: '16:9', lighting: 'golden', palette: 'warm', background: 'bokeh',
    composition: 'thirds', angle: 'eye', lens: '85', textSpace: 'yes', textPos: 'bottom',
    negative: 'متن واترمارک', freedom: 40, promptLang: 'fa', outputFormat: 'jpeg', refRole: '', use: 'cover'
  });
  ok(p.indexOf('موضوع: فنجان قهوه') > -1, p);
  ok(p.indexOf('سبک: سینمایی') > -1);
  ok(p.indexOf('نسبت تصویر: 16:9') > -1);
  ok(p.indexOf('پرامپت منفی: متن واترمارک') > -1);
  ok(p.indexOf('JPEG') > -1);
});
t('پرامپت انگلیسی شامل بخش‌های ساختاری و متن آزادِ فارسیِ دست‌نخورده', () => {
  const p = B.buildPhotoPrompt({
    subject: 'فنجان قهوه', style: 'cinematic', ratio: '1:1', promptLang: 'en',
    textSpace: 'no', freedom: 50, outputFormat: 'png', use: 'post'
  });
  ok(p.indexOf('cinematic still') > -1, p);
  ok(p.indexOf('no text, no letters') > -1);
  ok(p.indexOf('PNG') > -1);
  ok(p.indexOf('فنجان قهوه') > -1, 'متن آزاد کاربر باید عیناً بماند (محدودیت ترجمه صادقانه)');
});
t('نسبت سفارشی در برچسب', () => {
  eq(B.ratioLabel({ ratio: 'custom', w: 1200, h: 628 }), '1200×628 px');
  eq(B.ratioLabel({ ratio: '16:9' }), '16:9');
});

console.log('\n== پرامپت‌ساز ویدیو ==');
t('shotsTotal و normalizeShots', () => {
  const s = { shots: [{ desc: 'الف', dur: 3 }, { desc: 'ب', dur: 4.5 }, { desc: 'ج', dur: 2 }] };
  near(B.shotsTotal(s), 9.5);
});
t('validateDuration', () => {
  ok(B.validateDuration(15).ok);
  ok(!B.validateDuration(2).ok);
  ok(!B.validateDuration(200).ok);
});
t('buildVideoPrompt شامل ثبات سوژه/سبک', () => {
  const p = B.buildVideoPrompt({
    mode: 'image', subject: 'دمنوش', goal: 'sales', audience: 'young', idea: '',
    style: 'cinematic', light: 'golden', color: 'warm', ratio: '9:16', duration: 15,
    resolution: '1080p', fps: '30', format: 'mp4', moveIntensity: 'dynamic', transition: 'whip',
    keepSubject: true, keepStyle: true, music: 'ambient', musicVolume: 40,
    sfx: ['nature'], voiceover: true, voiceLang: 'fa', voiceGender: 'female', voiceSpeed: '1',
    voiceText: 'سلام', subtitles: true, subLang: 'fa', ctaType: 'buy', ctaText: 'سفارش بده',
    negative: '', service: 'demo-a', promptLang: 'fa'
  });
  ok(p.indexOf('تصویر به ویدیو') > -1, p);
  ok(p.indexOf('ثبات سوژه') > -1);
  ok(p.indexOf('ثبات سبک') > -1);
  ok(p.indexOf('سفارش بده') > -1);
});
t('buildShotPrompt با ثبات', () => {
  const s = { style: 'cinematic', moveIntensity: 'calm', keepSubject: true, keepStyle: false };
  const p = B.buildShotPrompt(s, { n: 2, desc: 'کلوزآپ بخار', dur: 4, cam: 'static', trans: 'cut' });
  ok(p.indexOf('شات 2') > -1, p);
  ok(p.indexOf('کلوزآپ بخار') > -1);
  ok(p.indexOf('ثبات سوژه') > -1);
  ok(p.indexOf('ثبات سبک') === -1);
});
t('serviceIssues: تشخیص ناسازگاری با سرویس نمونهٔ ب', () => {
  const s = { duration: 30, resolution: '1080p', fps: '30', format: 'mp4', voiceover: true, subtitles: true, music: 'ambient', mode: 'text', transition: 'fade' };
  const issues = B.serviceIssues('demo-b', s);
  ok(issues.some(i => i.key === 'duration'), 'مدت ۳۰ > ۱۵');
  ok(issues.some(i => i.key === 'voiceover'));
  ok(issues.some(i => i.key === 'music'));
  const s2 = { duration: 10, resolution: '1080p', fps: '30', format: 'mp4', voiceover: false, subtitles: true, music: 'none', mode: 'text', transition: 'cut' };
  eq(B.serviceIssues('demo-b', s2).length, 0);
});
t('voiceoverEstimate', () => {
  const sec = B.voiceoverEstimate('یک دو سه چهار پنج شش هفت هشت نه ده', '1');
  near(sec, 4);
  eq(B.voiceoverEstimate('', '1'), 0);
});

console.log('\n== بریف متنی و مقاله ==');
t('buildTextBrief برای هر چهار نوع', () => {
  ok(B.buildTextBrief('caption', { platform: 'instagram', subject: 'دمنوش', tone: 'friendly', goal: 'sales', lengthHint: '', hashtags: '', cta: 'buy', notes: '' }).indexOf('بریف کپشن') > -1);
  ok(B.buildTextBrief('email', { kind: 'newsletter', subject: 's', audience: 'general', tone: 'friendly', message: 'm', cta: '', notes: '' }).indexOf('ایمیل') > -1);
  ok(B.buildTextBrief('product', { name: 'x', audience: 'general', tone: 'friendly', features: 'f', advantage: 'a', notes: '' }).indexOf('توضیح محصول') > -1);
  ok(B.buildTextBrief('ad', { kind: 'social', subject: 'x', audience: 'general', tone: 'friendly', promise: 'p', cta: '', notes: '' }).indexOf('تبلیغاتی') > -1);
  ok(B.buildTextBrief('caption', { platform: 'instagram' }).indexOf('قالبی است') > -1, 'برچسب صداقت باید باشد');
});
t('buildOutlineBlocks', () => {
  const blocks = B.buildOutlineBlocks('edu');
  eq(blocks.length, 6);
  ok(blocks.every(b => b.type === 'h2' && b.data.text));
  const ids = new Set(blocks.map(b => b.id));
  eq(ids.size, 6, 'شناسه‌ها یکتا');
});
t('buildArticleBrief', () => {
  const txt = B.buildArticleBrief({ type: 'guide', lang: 'fa', tone: 'friendly', audience: 'beginner', goal: 'edu', length: 'medium', topic: 'قهوه', points: 'n1', sources: '', forbidden: 'ف', faq: true, cta: 'comment' });
  ok(txt.indexOf('راهنما') > -1);
  ok(txt.indexOf('قالبی است') > -1);
});
t('blockToHtml: نگاشت صحیح همهٔ بلوک‌ها', () => {
  eq(B.blockToHtml({ type: 'h2', data: { text: 'تیتر' } }), '<h2>تیتر</h2>');
  eq(B.blockToHtml({ type: 'ul', data: { items: ['الف', 'ب'] } }), '<ul><li>الف</li><li>ب</li></ul>');
  ok(B.blockToHtml({ type: 'quote', data: { text: 'ق', cite: 'منبع' } }).indexOf('<cite>منبع</cite>') > -1);
  ok(B.blockToHtml({ type: 'img', data: { url: 'https://x.ir/i.png', alt: 'alt', caption: 'cap' } }).indexOf('loading="lazy"') > -1);
  ok(B.blockToHtml({ type: 'img', data: { url: 'javascript:alert(1)', alt: '' } }).indexOf('<!-- تصویر بدون نشانی معتبر حذف شد -->') > -1, 'نشانی ناامن حذف شود');
  ok(B.blockToHtml({ type: 'p', data: { html: 'متن <b>پررنگ</b>' } }).indexOf('<p>متن <b>پررنگ</b></p>') > -1);
});
t('buildArticleHtml شامل سرآمد نظر و عنوان', () => {
  const html = B.buildArticleHtml({
    title: 'تیتر مقاله',
    blocks: [{ type: 'p', data: { html: 'سلام' } }],
    settings: { slug: 'my-slug', seoTitle: 'سئو', metaDesc: 'توضیح' }
  });
  ok(html.indexOf('<!-- نوا') > -1);
  ok(html.indexOf('<!-- نامک: my-slug -->') > -1);
  ok(html.indexOf('<h1>تیتر مقاله</h1>') > -1);
  ok(html.indexOf('<article>') > -1);
});
t('articleStats', () => {
  const a = {
    title: 'تیتر مقاله با چند کلمه',
    blocks: [
      { type: 'p', data: { html: 'این یک پاراگراف آزمایشی با حدود ده کلمه است که برای شمارش نوشته شده' } },
      { type: 'h2', data: { text: 'بخش دوم' } },
      { type: 'ul', data: { items: ['مورد یک', 'مورد دو'] } }
    ],
    settings: { excerpt: 'چکیدهٔ کوتاه' }
  };
  const st = B.articleStats(a);
  ok(st.words > 20, 'words=' + st.words);
  eq(st.blocks, 3);
  eq(st.minutes, 1);
});
t('seoChecks: وضعیت‌ها منطقی', () => {
  const empty = B.seoChecks({ title: '', blocks: [], settings: {} });
  const t1 = empty.find(c => c.id === 'title');
  eq(t1.status, 'fail');
  const good = B.seoChecks({
    title: 'راهنمای کامل عکاسی محصول برای فروشگاه‌های اینترنتی',
    blocks: [{ type: 'h2', data: { text: 'بخش' } }, { type: 'p', data: { html: 'کلمه '.repeat(320) } }],
    settings: { slug: 'product-photo-guide', excerpt: 'عکاسی محصول با نور طبیعی برای افزایش فروش و نرخ کلیک فروشگاه اینترنتی شما', keyword: 'عکاسی محصول', seoTitle: 'راهنمای عکاسی محصول', metaDesc: 'توضیحات متا کامل برای نتایج جست‌وجو' }
  });
  eq(good.find(c => c.id === 'title').status, 'ok');
  eq(good.find(c => c.id === 'h2').status, 'ok');
  eq(good.find(c => c.id === 'slug').status, 'ok');
  eq(good.find(c => c.id === 'keyword').status, 'ok', 'کلمه کلیدی در عنوان و چکیده هست');
  const len = good.find(c => c.id === 'length');
  eq(len.status, 'ok');
});
t('validateArticleImport', () => {
  ok(B.validateArticleImport({ title: 't', blocks: [{ type: 'p', data: { html: 'x' } }], settings: {} }).ok);
  ok(!B.validateArticleImport({}).ok, 'بدون blocks');
  ok(!B.validateArticleImport({ blocks: [{ type: 'bad', data: {} }] }).ok, 'نوع نامعتبر');
  ok(!B.validateArticleImport({ blocks: [{ type: 'p', data: 'notobject' }] }).ok);
});

console.log('\n== لایهٔ ذخیره‌سازی ==');
t('خواندن/نوشتن پایه', () => {
  N.store.setBackend(memoryBackend());
  const r = N.store.write('articles', [{ id: 'a1' }]);
  ok(r.ok);
  eq(N.store.getList('articles').length, 1);
  eq(N.store.getById('articles', 'a1').id, 'a1');
});
t('دادهٔ خراب → بازگشت پیش‌فرض و ذخیرهٔ پشتیبان', () => {
  const be = memoryBackend();
  N.store.setBackend(be);
  be.setItem('nova.v1.comments', '{ناتمام');
  const list = N.store.getList('comments');
  eq(list.length, 0, 'باید پیش‌فرض برگردد');
  ok(be.getItem('nova.v1.comments') === null, 'کلید خراب باید پاک شود');
  /* پشتیبان با قلاب موقت بررسی می‌شود چون کلیدش مُهر زمانی دارد */
  const probe = memoryBackend();
  N.store.setBackend(probe);
  probe.setItem('nova.v1.articles', 'شکسته');
  let backedUp = null;
  const origSet = probe.setItem;
  probe.setItem = (k, v) => { if (k.indexOf('nova.v1.corrupt.articles') === 0) backedUp = k; origSet(k, v); };
  N.store.getList('articles');
  ok(backedUp !== null, 'نسخهٔ پشتیبان دادهٔ خراب باید ذخیره شود');
});
t('خطای سهمیه → ok:false', () => {
  const be = memoryBackend(50000);
  N.store.setBackend(be);
  let res = { ok: true };
  for (let i = 0; i < 200 && res.ok; i++) {
    res = N.store.write('junk' + i, { data: 'y'.repeat(1000) });
  }
  eq(res.ok, false, 'باید به ok:false برسد');
  ok(res.error && /Quota/i.test(res.error.name), 'خطا باید از نوع سهمیه باشد');
});
t('import/export گردش کامل', () => {
  N.store.setBackend(memoryBackend());
  N.store.write('articles', [{ id: 'a1', demo: false, title: 'تست' }]);
  const dump = N.store.exportAll();
  eq(dump.app, 'nova');
  N.store.setBackend(memoryBackend());
  const r = N.store.importAll(dump);
  ok(r.ok);
  eq(N.store.getById('articles', 'a1').title, 'تست');
  ok(!N.store.importAll({ app: 'other' }).ok);
  ok(!N.store.importAll(null).ok);
});
t('clearDemo فقط نمونه‌ها و clearAllUser فقط دادهٔ کاربر را حذف می‌کند', () => {
  N.store.setBackend(memoryBackend());
  N.store.write('articles', [{ id: 'd1', demo: true }, { id: 'u1', demo: false }]);
  N.store.clearAllUser();
  let list = N.store.getList('articles');
  eq(list.length, 1, 'پس از پاک‌کردن دادهٔ کاربر');
  eq(list[0].id, 'd1');
  N.store.write('articles', [{ id: 'd1', demo: true }, { id: 'u1', demo: false }]);
  N.store.clearDemo();
  list = N.store.getList('articles');
  eq(list.length, 1, 'پس از پاک‌کردن نمونه‌ها');
  eq(list[0].id, 'u1');
});
t('updateById و removeById', () => {
  N.store.setBackend(memoryBackend());
  N.store.write('brands', [{ id: 'b1', name: 'قدیم' }]);
  N.store.updateById('brands', 'b1', { name: 'جدید' });
  eq(N.store.getById('brands', 'b1').name, 'جدید');
  N.store.removeById('brands', 'b1');
  eq(N.store.getById('brands', 'b1'), null);
});

console.log('\n== دادهٔ نمونه ==');
t('ساخت و شکل دادهٔ نمونه', () => {
  const d = N.seed.make();
  ok(d.meta.seeded === true);
  eq(d.articles.length, 2);
  ok(d.articles.every(a => a.demo === true && Array.isArray(a.blocks) && a.blocks.length > 5));
  ok(d.photoBriefs[0].prompt.length > 30, 'پرامپت عکس نمونه ساخته شده');
  ok(d.videoBriefs[0].prompt.length > 30, 'پرامپت ویدیو نمونه ساخته شده');
  ok(d.videoBriefs[0].state.shots.length === 4);
  ok(d.textBriefs[0].prompt.indexOf('قالبی') > -1);
  ok(d.companies.length === 2 && d.teams.length === 2 && d.domains.length === 2 && d.users.length === 3);
  ok(d.comments.length === 4);
  ok(d.liveChats.length === 2 && d.teamChat.channels.length === 2);
  ok(d.calendarPlans.length === 4);
  ok(Object.keys(d).length === N.store.KEYS.length, 'کلیدها با store هم‌خوان: ' + Object.keys(d).join(','));
});
t('نام‌های یکتا در نمونه', () => {
  const d = N.seed.make();
  const ids = [
    ...d.articles.map(x => x.id), ...d.photoBriefs.map(x => x.id),
    ...d.videoBriefs.map(x => x.id), ...d.textBriefs.map(x => x.id)
  ];
  eq(new Set(ids).size, ids.length);
});

console.log('\n== گزینه‌ها ==');
t('کاتالوگ‌ها کامل‌اند', () => {
  eq(O.photoStyles.length, 8, '۸ سبک عکس');
  eq(O.ratios.map(r => r.id).join(','), '1:1,4:5,9:16,16:9,3:2,custom');
  eq(O.videoTemplates.length, 4);
  ok(O.videoTemplates.every(t => t.patch.shots.reduce((a, s) => a + s.dur, 0) === t.patch.duration), 'مجموع شات‌های هر قالب = مدت');
  eq(O.videoServices.length, 3);
  ok(O.byId(O.photoStyles, 'cinematic').en.length > 3);
});
t('label برای شناسهٔ ناشناخته خالی است', () => eq(O.label(O.tones, 'nope'), ''));

console.log('\n== بهداشت فضای نام سراسری ==');
t('فقط Nova به window اضافه شده (بدون تداخل با نام‌های رزرو مرورگر)', () => {
  const base = new Set(['console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'navigator', 'location', 'matchMedia', 'requestAnimationFrame', 'window', 'self', 'Nova', 'globalThis']);
  const extras = Object.getOwnPropertyNames(ctx).filter(k => !base.has(k));
  if (extras.length) throw new Error('متغیرهای سراسری اضافه: ' + extras.join(', '));
});

console.log('\n----------------------------------------');
console.log('نتیجه: ' + pass + ' موفق، ' + fail + ' ناموفق');
if (fail) {
  failures.forEach(f => console.error('✗ ' + f.name + ' → ' + f.e.message));
  process.exit(1);
}
console.log('همهٔ آزمون‌ها سبز است.');
