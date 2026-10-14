/* ============================================================
   نوا — تنظیمات و اتصال‌ها
   ظاهر و دادهٔ نمونه، مدیریت داده (خروجی/ورودی/پاک‌سازی)،
   اتصال‌های آینده با توضیح شفاف سمت سرور، درباره
   ============================================================ */
window.Nova = window.Nova || {};

Nova.settings = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui;
  var tab = 'general';

  var SERVICES = [
    { id: 'text', icon: 'pen', name: 'تولید متن (هوش مصنوعی)', desc: 'تولید و بازنویسی مقاله، ابزارهای متنی' },
    { id: 'image', icon: 'image', name: 'تولید تصویر', desc: 'تبدیل پرامپت‌های استودیوی عکس به تصویر واقعی' },
    { id: 'video', icon: 'video', name: 'تولید ویدیو', desc: 'اجرای بریف‌های استودیوی ویدیو روی سرویس ویدیو' },
    { id: 'livechat', icon: 'chat', name: 'گفت‌وگوی زنده', desc: 'پیام‌رسانی واقعی با بازدیدکنندگان سایت' },
    { id: 'team', icon: 'users', name: 'گفت‌وگوی تیمی', desc: 'پیام‌رسان تیمی متصل به سرور' },
    { id: 'wordpress', icon: 'external', name: 'انتشار وردپرس', desc: 'ارسال مستقیم مقاله‌ها به سایت وردپرسی' },
    { id: 'email', icon: 'mail', name: 'خبرنامه و ایمیل', desc: 'ارسال ایمیل‌های ابزار متنی' }
  ];

  function generalHtml() {
    var meta = Nova.store.read('meta', {});
    var theme = meta.theme || 'system';
    return '<div class="stack">' +
      '<div><div class="card-title" style="font-size:var(--fs-small);margin-bottom:8px">تم ظاهری</div>' +
      '<div class="chips" id="theme-chips">' +
      [{ id: 'light', fa: 'روشن' }, { id: 'dark', fa: 'تیره' }, { id: 'system', fa: 'هماهنگ با سیستم' }].map(function (t) {
        return '<button type="button" class="chip' + (theme === t.id ? ' on' : '') + '" data-theme-set="' + t.id + '">' + t.fa + '</button>';
      }).join('') + '</div>' +
      '<div class="field-hint" style="margin-top:6px">انتخاب شما حفظ می‌شود و در بار بعدی هم اعمال است.</div></div>' +

      '<div class="row-between" style="padding:10px 0;border-top:1px solid var(--border)">' +
      '<div><div style="font-weight:600;font-size:var(--fs-small)">نمایش داده‌های نمونه</div>' +
      '<div class="caption">آیتم‌های نمونه در داشبورد، کتابخانه و فهرست‌ها دیده شوند</div></div>' +
      '<div id="demo-switch">' + ui.switchHtml('showDemoToggle', meta.showDemo !== false, '') + '</div></div>' +

      '<div class="row-between" style="padding:10px 0;border-top:1px solid var(--border)">' +
      '<div><div style="font-weight:600;font-size:var(--fs-small);color:var(--danger)">پاک‌کردن داده‌های نمونه</div>' +
      '<div class="caption">فقط آیتم‌های «نمونه» حذف می‌شوند؛ داده‌های شما باقی می‌ماند.</div></div>' +
      '<button class="btn btn-danger btn-sm" data-act="clear-demo">پاک‌سازی نمونه‌ها</button></div>' +
      '</div>';
  }

  function dataHtml(estimate) {
    return '<div class="stack">' +
      '<div><div class="card-title" style="font-size:var(--fs-small)">فضای ذخیره‌سازی مرورگر</div>' +
      '<div class="caption" id="storage-line">' + estimate + '</div></div>' +
      '<div class="row-between" style="padding:10px 0;border-top:1px solid var(--border)">' +
      '<div><div style="font-weight:600;font-size:var(--fs-small)">خروجی کامل داده‌ها</div>' +
      '<div class="caption">یک فایل JSON از همهٔ مقاله‌ها، پرامپت‌ها، برندها و تنظیمات</div></div>' +
      '<button class="btn btn-soft btn-sm" data-act="export-all">' + Nova.icon('download') + ' دانلود پشتیبان</button></div>' +
      '<div class="row-between" style="padding:10px 0;border-top:1px solid var(--border)">' +
      '<div><div style="font-weight:600;font-size:var(--fs-small)">بازگردانی از فایل پشتیبان</div>' +
      '<div class="caption">داده‌های موجود با محتوای فایل جایگزین می‌شوند</div></div>' +
      '<button class="btn btn-ghost btn-sm" data-act="import-all">' + Nova.icon('upload') + ' انتخاب فایل JSON</button>' +
      '<input type="file" id="import-all-file" accept=".json,application/json" class="visually-hidden"></div>' +
      '<div class="row-between" style="padding:10px 0;border-top:1px solid var(--border)">' +
      '<div><div style="font-weight:600;font-size:var(--fs-small);color:var(--danger)">پاک‌کردن همهٔ داده‌های من</div>' +
      '<div class="caption">همهٔ مقاله‌ها، پرامپت‌ها و رکوردهای شما حذف می‌شود</div></div>' +
      '<button class="btn btn-danger btn-sm" data-act="wipe">حذف کامل</button></div>' +
      '</div>';
  }

  function connsHtml() {
    return '<div class="stack">' +
      ui.banner('warn', '<b>اصول اتصال آینده:</b> اتصال‌ها فقط از سمت سرور انجام می‌شوند و کلید محرمانه هرگز در کد مرورگر قرار نمی‌گیرد. برای نسخهٔ فعلی دریافت کلید API لازم نیست و هیچ کلیدی ذخیره نمی‌شود.') +
      SERVICES.map(function (s) {
        return '<div class="conn-item">' +
          '<div class="ci-icon">' + Nova.icon(s.icon) + '</div>' +
          '<div class="grow"><div class="row"><span class="ci-name">' + s.name + '</span>' +
          '<span class="badge badge-conn">متصل نیست</span></div>' +
          '<div class="ci-desc">' + s.desc + '</div></div>' +
          '<button class="btn btn-ghost btn-sm" data-act="config" data-svc="' + s.id + '">پیکربندی</button>' +
          '</div>';
      }).join('') + '</div>';
  }

  function aboutHtml() {
    return '<div class="stack">' +
      '<div class="row"><div class="brand-mark" style="background:var(--primary);color:var(--on-primary)">ن</div>' +
      '<div><div style="font-weight:800;font-size:var(--fs-lg)">نوا</div><div class="caption">پلتفرم تولید محتوا و مدیریت کسب‌وکار — نسخهٔ نمایشی ۱٫۰</div></div></div>' +
      ui.banner('info', '<b>تعهد صداقت عملکرد:</b> در این نسخه هیچ تولید واقعی مقاله، عکس یا ویدیو ادعا نمی‌شود؛ خروجی قالبی همیشه با برچسب از خروجی هوش مصنوعی تفکیک می‌شود؛ داده‌های نمونه مشخص هستند و ارسال محلی با ارسال واقعی اشتباه گرفته نمی‌شود.') +
      '<div class="small muted" style="line-height:2">' +
      'ذخیره‌سازی: کامل محلی در مرورگر (localStorage) با مقاومت در برابر دادهٔ خراب و پرشدن سهمیه.<br>' +
      'امنیت: نمایش محتوای کاربر با گریز و پاک‌سازی HTML؛ خروجی امن.<br>' +
      'حریم خصوصی: هیچ داده‌ای از مرورگر شما به بیرون ارسال نمی‌شود.' +
      '</div></div>';
  }

  function paint() {
    var container = document.getElementById('view-root');
    if (!container) return;
    var tabs = [
      { id: 'general', label: 'عمومی', icon: 'settings' },
      { id: 'data', label: 'داده‌ها', icon: 'database' },
      { id: 'conns', label: 'اتصال‌ها', icon: 'server' },
      { id: 'about', label: 'درباره', icon: 'info' }
    ];

    container.innerHTML =
      '<div class="page-head view-enter"><h1>تنظیمات و اتصال‌ها</h1>' +
      '<div class="page-sub">شخصی‌سازی نوا و مدیریت شفاف داده‌ها</div></div>' +
      '<div class="settings-grid">' +
      '<div class="settings-nav">' + tabs.map(function (t) {
        return '<button data-tab="' + t.id + '" class="' + (tab === t.id ? 'on' : '') + '">' + Nova.icon(t.icon) + t.label + '</button>';
      }).join('') + '</div>' +
      '<div class="card" id="settings-body"></div></div>';

    var body = container.querySelector('#settings-body');
    if (tab === 'general') body.innerHTML = generalHtml();
    else if (tab === 'data') {
      body.innerHTML = dataHtml('<span class="skeleton" style="display:inline-block;width:180px;height:12px"></span> در حال اندازه‌گیری…');
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(function (est) {
          var line = container.querySelector('#storage-line');
          if (line) line.textContent = 'مصرف فعلی: حدود ' + U.formatBytes(est.usage || 0) + ' از سهمیهٔ حدود ' + U.formatBytes(est.quota || 0);
        }).catch(function () {
          var line = container.querySelector('#storage-line');
          if (line) line.textContent = 'اندازه‌گیری سهمیه در این مرورگر ممکن نیست؛ داده‌ها در localStorage ذخیره می‌شوند.';
        });
      } else {
        var line = container.querySelector('#storage-line');
        if (line) line.textContent = 'این مرورگر سهمیهٔ دقیق گزارش نمی‌کند؛ داده‌ها در localStorage ذخیره می‌شوند.';
      }
    } else if (tab === 'conns') body.innerHTML = connsHtml();
    else body.innerHTML = aboutHtml();

    ui.bind(container, 'click', '[data-tab]', function (e, btn) {
      tab = btn.getAttribute('data-tab');
      paint();
    });

    ui.bind(container, 'click', '[data-theme-set]', function (e, btn) {
      Nova.theme.set(btn.getAttribute('data-theme-set'));
      paint();
    });

    var demoSw = container.querySelector('[data-field="showDemoToggle"]');
    demoSw && demoSw.addEventListener('change', function () {
      var meta = Nova.store.read('meta', {});
      meta.showDemo = demoSw.checked;
      Nova.store.write('meta', meta);
      Nova.router.render();
    });

    ui.bind(container, 'click', '[data-act]', function (e, btn) {
      var act = btn.getAttribute('data-act');
      if (act === 'clear-demo') {
        ui.confirmDialog({
          title: 'پاک‌کردن داده‌های نمونه',
          message: 'همهٔ آیتم‌های برچسب «نمونه» از همهٔ ماژول‌ها حذف می‌شوند. داده‌های خودتان دست‌نخورده می‌ماند.',
          confirmText: 'پاک‌سازی', danger: true
        }).then(function (yes) {
          if (!yes) return;
          Nova.store.clearDemo();
          ui.toast('داده‌های نمونه پاک شد.', 'success');
          Nova.router.render();
        });
      } else if (act === 'export-all') {
        U.download('nova-backup.json', JSON.stringify(Nova.store.exportAll(), null, 2), 'application/json');
        ui.toast('فایل پشتیبان کامل دانلود شد.', 'success');
      } else if (act === 'import-all') {
        container.querySelector('#import-all-file').click();
      } else if (act === 'wipe') {
        ui.confirmDialog({
          title: 'حذف کامل داده‌های شما',
          message: 'همهٔ مقاله‌ها، پرامپت‌ها، برندها و رکوردهایی که خودتان ساخته‌اید برای همیشه حذف می‌شوند. داده‌های نمونه باقی می‌مانند.',
          extra: '<div class="banner banner-danger">' + Nova.icon('alertTriangle') + '<div>این عمل بازگشت‌پذیر نیست. اگر می‌خواهید نگه دارید، اول «خروجی کامل داده‌ها» را بگیرید.</div></div>',
          confirmText: 'بله، حذف کامل', danger: true
        }).then(function (yes) {
          if (!yes) return;
          Nova.store.clearAllUser();
          ui.toast('داده‌های شما حذف شد.', 'success');
          Nova.router.render();
        });
      } else if (act === 'config') {
        var svc = SERVICES.filter(function (s) { return s.id === btn.getAttribute('data-svc'); })[0];
        ui.modal({
          title: 'پیکربندی ' + svc.name,
          body: ui.banner('warn', '<b>در نسخهٔ نمایشی فعلاً امکان اتصال وجود ندارد.</b> نوا کلید API نمی‌گیرد و نباید هم بگیرد: کلید محرمانه در مرورگر ناامن است.') +
            '<ol class="small muted" style="padding-inline-start:18px;line-height:2.1">' +
            '<li>یک سرویس واسط روی سرور خودتان راه می‌افتد.</li>' +
            '<li>کلید سرویس در متغیر محیطی سرور ذخیره می‌شود.</li>' +
            '<li>مرورگر فقط با سرور واسط گفت‌وگو می‌کند.</li>' +
            '<li>در تنظیمات، نشانی سرور واسط ثبت می‌شود (نه کلید).</li></ol>' +
            '<div class="caption">این مسیر از نشت کلید در کد مرورگر جلوگیری می‌کند.</div>',
          footer: '<button class="btn btn-ghost" data-close-modal="1">متوجه شدم</button>'
        });
      }
    });

    ui.bind(container, 'change', '#import-all-file', function (e, input) {
      var f = input.files && input.files[0];
      input.value = '';
      if (!f) return;
      if (f.size > 4 * 1024 * 1024) { ui.toast('فایل بیش از ۴ مگابایت است.', 'error'); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var payload;
        try { payload = JSON.parse(reader.result); }
        catch (err) { ui.toast('فایل JSON معتبر نیست.', 'error'); return; }
        ui.confirmDialog({
          title: 'بازگردانی پشتیبان',
          message: 'داده‌های فعلی با محتوای فایل جایگزین می‌شوند. ادامه می‌دهید؟',
          confirmText: 'بازگردانی', danger: true
        }).then(function (yes) {
          if (!yes) return;
          var r = Nova.store.importAll(payload);
          if (!r.ok) { ui.toast('بازگردانی انجام نشد — ' + r.reason, 'error'); return; }
          Nova.theme.init();
          ui.toast('بازگردانی کامل شد (' + U.faNum(r.counts.restored) + ' بخش.' + (r.counts.skipped ? ' ' + U.faNum(r.counts.skipped) + ' مورد نامعتبر رد شد.)' : ')'), 'success');
          Nova.router.render();
        });
      };
      reader.readAsText(f, 'utf-8');
    });

    ui.bind(container, 'click', '[data-close-modal]', function () {
      var back = document.querySelector('.modal-backdrop');
      if (back) back.querySelector('.icon-btn').click();
    });
  }

  return { render: paint };
})();
