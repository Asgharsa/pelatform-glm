/* ============================================================
   نوا — داشبورد: مسیرهای شروع سریع، پیش‌نویس‌های اخیر، آمار واقعی
   آمار از دادهٔ واقعی همین مرورگر محاسبه می‌شود؛ دادهٔ نمونه جدا شمرده می‌شود.
   ============================================================ */
window.Nova = window.Nova || {};

Nova.dashboard = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui;

  function greeting() {
    var h = new Date().getHours();
    if (h < 5) return 'شب بخیر';
    if (h < 12) return 'صبح بخیر';
    if (h < 17) return 'وقت بخیر';
    if (h < 21) return 'عصر بخیر';
    return 'شب بخیر';
  }

  function countSplit(key) {
    var all = Nova.store.getList(key);
    var user = all.filter(function (x) { return !x.demo; }).length;
    var demo = all.length - user;
    return { user: user, demo: demo };
  }

  function statCard(icon, tileCls, label, split, route) {
    return '<a class="card card-hover stat-card" href="#' + route + '" style="text-decoration:none;color:inherit">' +
      '<div class="stat-tile ' + tileCls + '">' + Nova.icon(icon) + '</div>' +
      '<div class="grow">' +
      '<div class="stat-num">' + U.faNum(split.user) + '</div>' +
      '<div class="stat-label">' + label + '</div>' +
      '<div class="stat-sub">دادهٔ شما: ' + U.faNum(split.user) + ' · دادهٔ نمونه: ' + U.faNum(split.demo) + '</div>' +
      '</div></a>';
  }

  function quickCards() {
    return [
      { icon: 'fileText', cls: '', title: 'مقالهٔ جدید', sub: 'ویرایشگر بلوکی با تنظیمات سئو', href: '#/content/article/new', accent: 'article' },
      { icon: 'image', cls: 'photo', title: 'عکس جدید', sub: 'ساخت پرامپت دقیق با قالب‌های آماده', href: '#/content/photo', accent: 'photo' },
      { icon: 'video', cls: 'video', title: 'ویدیوی جدید', sub: 'بریف کامل، شات‌بندی و گویندگی', href: '#/content/video', accent: 'video' },
      { icon: 'pen', cls: 'text', title: 'ابزار متنی', sub: 'کپشن، ایمیل، محصول و تبلیغ', href: '#/content/text', accent: 'text' }
    ].map(function (q) {
      return '<a class="quick-card" href="' + q.href + '">' +
        '<div class="quick-tile" style="background:var(--acc-' + q.accent + '-soft);color:var(--acc-' + q.accent + ')">' + Nova.icon(q.icon) + '</div>' +
        '<div class="qc-title">' + q.title + '</div>' +
        '<div class="qc-sub">' + q.sub + '</div></a>';
    }).join('');
  }

  function draftRows() {
    var arts = Nova.app.visibleList('articles');
    if (!arts.length) {
      return ui.emptyState({
        icon: 'fileText', title: 'هنوز مقاله‌ای ندارید',
        desc: 'اولین مقالهٔ وبلاگ را با ویرایشگر بلوکی نوا بنویسید؛ ذخیرهٔ خودکار نگرانی از دست رفتن متن را برطرف می‌کند.',
        action: '<a class="btn btn-primary" href="#/content/article/new">' + Nova.icon('plus') + ' شروع مقالهٔ جدید</a>'
      });
    }
    var recent = arts.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); }).slice(0, 5);
    return recent.map(function (a) {
      var st = Nova.builders.articleStats(a);
      return '<a class="draft-row" href="#/content/article/edit/' + a.id + '">' +
        '<div class="icon-tile">' + Nova.icon('fileText') + '</div>' +
        '<div class="grow">' +
        '<div class="dr-title truncate">' + ui.esc(a.title || 'بدون عنوان') + ' ' + (a.demo ? ui.badge('badge-demo', 'نمونه') : '') + '</div>' +
        '<div class="dr-meta">' + (a.status === 'done' ? 'تکمیل‌شده' : 'پیش‌نویس') + ' · ' + U.faNum(st.words) + ' کلمه · ' + U.faRelative(a.updatedAt || Date.now()) + '</div>' +
        '</div>' +
        '<span class="btn btn-ghost btn-sm">ادامهٔ ویرایش</span>' +
        '</a>';
    }).join('');
  }

  function checklist() {
    var items = [
      { done: Nova.app.visibleList('brands').length > 0, label: 'هویت و لحن برند را کامل کنید', href: '#/brand' },
      { done: Nova.store.getList('articles').some(function (a) { return !a.demo; }), label: 'اولین مقالهٔ خودتان را بنویسید', href: '#/content/article/new' },
      { done: Nova.store.getList('photoBriefs').some(function (a) { return !a.demo; }), label: 'یک پرامپت عکس بسازید و ذخیره کنید', href: '#/content/photo' },
      { done: Nova.store.getList('videoBriefs').some(function (a) { return !a.demo; }), label: 'بریف یک ویدیو را آماده کنید', href: '#/content/video' },
      { done: Nova.store.getList('calendarPlans').length > 0, label: 'برنامهٔ تقویم محتوایی را بچینید', href: '#/library?tab=calendar' }
    ];
    var doneCount = items.filter(function (i) { return i.done; }).length;
    return items.map(function (it) {
      return '<div class="check-item' + (it.done ? ' done' : '') + '">' +
        '<span class="cicon">' + Nova.icon(it.done ? 'check' : 'clock') + '</span>' +
        '<div class="grow"><a href="' + it.href + '">' + it.label + '</a></div>' +
        (it.done ? ui.badge('badge-ok', 'انجام شد') : '') +
        '</div>';
    }).join('') +
      '<div class="caption" style="margin-top:8px">' + U.faNum(doneCount) + ' از ' + U.faNum(items.length) + ' مرحله کامل شده است.</div>';
  }

  function render(container) {
    var allArticles = countSplit('articles');
    var html =
      '<div class="page-head view-enter">' +
      '<h1>' + greeting() + '</h1>' +
      '<div class="page-sub">' + U.faDate(new Date()) + ' — آمار این صفحه از دادهٔ واقعی همین مرورگر محاسبه می‌شود.</div>' +
      '</div>' +

      '<div class="grid grid-4" style="margin-bottom:18px">' + quickCards() + '</div>' +

      ui.banner('info', '<b>نسخهٔ نمایشی محلی.</b> نوا بدون اتصال به سرویس خارجی کار می‌کند: تولید مقاله، عکس و ویدیو واقعی انجام نمی‌شود و خروجی‌ها «بریف و پرامپت قالبی» با برچسب مشخص هستند. برای این نسخه هیچ کلید API لازم نیست.') +

      '<div class="grid grid-4" style="margin-bottom:18px">' +
      statCard('fileText', 'article', 'مقاله‌ها', allArticles, '/content/article') +
      statCard('image', 'photo', 'پرامپت‌های عکس', countSplit('photoBriefs'), '/content/photo') +
      statCard('video', 'video', 'بریف‌های ویدیو', countSplit('videoBriefs'), '/content/video') +
      statCard('books', '', 'آیتم‌های کتابخانه', countSplit('textBriefs'), '/library') +
      '</div>' +

      '<div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)" id="dash-cols">' +
      '<div class="card"><div class="card-head"><div><div class="card-title">پیش‌نویس‌های اخیر</div><div class="card-sub">آخرین مقاله‌هایی که ویرایش کرده‌اید</div></div>' +
      '<a class="btn btn-soft btn-sm" href="#/content/article">همهٔ مقاله‌ها</a></div>' +
      '<div>' + draftRows() + '</div></div>' +

      '<div class="card"><div class="card-head"><div><div class="card-title">مسیر شروع</div><div class="card-sub">پنج قدم برای راه‌اندازی فضای کاری</div></div></div>' +
      checklist() + '</div>' +
      '</div>';

    container.innerHTML = html;
    if (window.matchMedia && window.matchMedia('(max-width: 980px)').matches) {
      var cols = container.querySelector('#dash-cols');
      if (cols) { cols.style.gridTemplateColumns = 'minmax(0,1fr)'; }
    }
  }

  return { render: render };
})();
