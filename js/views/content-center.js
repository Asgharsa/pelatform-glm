/* ============================================================
   نوا — مرکز تولید محتوا: سه مسیر اصلی + ابزارهای متنی
   ============================================================ */
window.Nova = window.Nova || {};

Nova.contentCenter = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui;

  var PATHS = [
    {
      icon: 'fileText', accent: 'article', title: 'مقاله و وبلاگ', sub: 'ویرایشگر بلوکی شبیه وردپرس؛ تنظیمات نوشته، بررسی‌های سادهٔ ساختار، خروجی HTML و پشتیبان JSON.',
      href: '#/content/article', btn: 'ورود به فهرست مقاله‌ها'
    },
    {
      icon: 'image', accent: 'photo', title: 'ساخت عکس', sub: 'استودیوی پرامپت‌سازی تصویر؛ سبک، نور، دوربین، نسبت تصویر، تصویر مرجع و قالب‌های آماده.',
      href: '#/content/photo', btn: 'ورود به استودیوی عکس'
    },
    {
      icon: 'video', accent: 'video', title: 'ساخت ویدیو', sub: 'بریف کامل ویدیو؛ شات‌بندی با زمان، گویندگی، موسیقی و پرامپت هر شات.',
      href: '#/content/video', btn: 'ورود به استودیوی ویدیو'
    }
  ];

  var TOOLS = [
    { icon: 'hash', accent: 'text', title: 'کپشن شبکهٔ اجتماعی', sub: 'اینستاگرام، لینکدین، ایکس و تلگرام', kind: 'caption' },
    { icon: 'mail', accent: 'text', title: 'ایمیل', sub: 'خبرنامه، خوش‌آمدگویی، پیشنهاد و پیگیری', kind: 'email' },
    { icon: 'briefcase', accent: 'text', title: 'توضیح محصول', sub: 'ویژگی‌ها، مزیت و مخاطب هدف', kind: 'product' },
    { icon: 'megaphone', accent: 'text', title: 'متن تبلیغاتی', sub: 'گوگل، شبکهٔ اجتماعی و بنر', kind: 'ad' }
  ];

  function render(container) {
    var paths = PATHS.map(function (p) {
      return '<a class="path-card" href="' + p.href + '">' +
        '<div class="path-tile" style="background:var(--acc-' + p.accent + '-soft);color:var(--acc-' + p.accent + ')">' + Nova.icon(p.icon) + '</div>' +
        '<div class="grow"><h3>' + p.title + '</h3><p>' + p.sub + '</p></div>' +
        '<span class="btn btn-soft btn-sm" style="align-self:center">' + p.btn + '</span></a>';
    }).join('');

    var tools = TOOLS.map(function (t) {
      return '<a class="mini-tool-card" href="#/content/text?tool=' + t.kind + '">' +
        '<div class="quick-tile" style="background:var(--acc-' + t.accent + '-soft);color:var(--acc-' + t.accent + ');width:36px;height:36px;border-radius:10px">' + Nova.icon(t.icon) + '</div>' +
        '<div class="mt-title">' + t.title + '</div><div class="mt-sub">' + t.sub + '</div></a>';
    }).join('');

    container.innerHTML =
      '<div class="page-head view-enter">' +
      '<h1>مرکز تولید محتوا</h1>' +
      '<div class="page-sub">هر مسیر، تنظیمات و گردش کار مخصوص خودش را دارد.</div>' +
      '</div>' +

      ui.banner('info', 'خروجی این مراکز <b>پرامپت و بریف قالبی</b> است؛ تولید واقعی محتوا پس از اتصال سرویس انجام می‌شود و همیشه با برچسب مشخص تفکیک می‌گردد.') +

      '<div class="stack-lg">' +
      '<div class="stack">' + paths + '</div>' +

      '<div><div class="card-title" style="margin-bottom:10px">ابزارهای متنی <span class="caption">— بخش فرعی</span></div>' +
      '<div class="grid grid-4">' + tools + '</div></div>' +
      '</div>';
  }

  return { render: render };
})();
