/* ============================================================
   نوا — راه‌انداز برنامه: پوسته، منو، نوار بالا، جست‌وجو، مسیرها
   یک سراسری: window.Nova
   ============================================================ */
window.Nova = window.Nova || {};

Nova.app = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui;

  var NAV = [
    {
      label: 'اصلی', items: [
        { route: '/dashboard', icon: 'home', title: 'داشبورد' },
        { route: '/content', icon: 'layers', title: 'مرکز تولید محتوا' },
        { route: '/generator', icon: 'sparkles', title: 'مولد هوشمند' }
      ]
    },
    {
      label: 'برند و محتوا', items: [
        { route: '/brand', icon: 'palette', title: 'هویت و لحن برند' },
        { route: '/library', icon: 'books', title: 'کتابخانه و تقویم محتوا' }
      ]
    },
    {
      label: 'ارتباط', items: [
        { route: '/live-chat', icon: 'chat', title: 'گفت‌وگوی زنده', count: function () { return Nova.store.getList('liveChats').filter(function (c) { return c.status === 'waiting'; }).length; } },
        { route: '/team-chat', icon: 'messages', title: 'گفت‌وگوی تیمی' },
        { route: '/comments', icon: 'inbox', title: 'پاسخ‌گویی به دیدگاه‌ها', count: function () { return Nova.store.getList('comments').filter(function (c) { return c.status === 'pending'; }).length; } }
      ]
    },
    {
      label: 'مدیریت', items: [
        { route: '/companies', icon: 'building', title: 'شرکت‌ها' },
        { route: '/teams', icon: 'users', title: 'تیم‌ها' },
        { route: '/domains', icon: 'globe', title: 'دامنه‌ها' },
        { route: '/users', icon: 'user', title: 'کاربران' }
      ]
    },
    {
      label: 'سیستم', items: [
        { route: '/settings', icon: 'settings', title: 'تنظیمات و اتصال‌ها' }
      ]
    }
  ];

  var TITLES = [
    ['/dashboard', 'داشبورد', 'مرکز فرماندهی محتوای شما'],
    ['/content/article/edit', 'ویرایشگر مقاله', 'ذخیرهٔ خودکار فعال است'],
    ['/content/article/new', 'مقالهٔ جدید', 'در حال ساخت…'],
    ['/content/article', 'مقاله و وبلاگ', 'فهرست و ویرایشگر'],
    ['/content/photo', 'استودیوی عکس', 'پرامپت‌ساز تصویر'],
    ['/content/video', 'استودیوی ویدیو', 'بریف و شات‌بندی'],
    ['/content/text', 'ابزارهای متنی', 'کپشن، ایمیل، محصول، تبلیغ'],
    ['/content', 'مرکز تولید محتوا', 'سه مسیر اصلی تولید'],
    ['/generator', 'مولد هوشمند', 'شروع سریع'],
    ['/brand', 'هویت و لحن برند', 'لحن و واژگان مرجع'],
    ['/library', 'کتابخانه و تقویم محتوا', 'آرشیو و برنامهٔ انتشار'],
    ['/live-chat', 'گفت‌وگوی زنده', 'حالت آزمایشی'],
    ['/team-chat', 'گفت‌وگوی تیمی', 'حالت آزمایشی'],
    ['/comments', 'پاسخ‌گویی به دیدگاه‌ها', 'صف پاسخ‌گویی'],
    ['/companies', 'شرکت‌ها', 'مدیریت شرکت‌ها'],
    ['/teams', 'تیم‌ها', 'مدیریت تیم‌ها'],
    ['/domains', 'دامنه‌ها', 'مدیریت دامنه‌ها'],
    ['/users', 'کاربران', 'اعضا و نقش‌ها'],
    ['/settings', 'تنظیمات و اتصال‌ها', 'شخصی‌سازی و اتصال‌ها']
  ];

  function titleFor(path) {
    for (var i = 0; i < TITLES.length; i++) {
      if (path === TITLES[i][0] || path.indexOf(TITLES[i][0] + '/') === 0 || path.indexOf(TITLES[i][0] + '?') === 0) return TITLES[i];
    }
    return ['نوا', ''];
  }

  /* ---------------- دادهٔ قابل نمایش ---------------- */

  function visibleList(key) {
    var meta = Nova.store.read('meta', {});
    var showDemo = meta.showDemo !== false;
    var list = Nova.store.getList(key);
    return showDemo ? list : list.filter(function (x) { return !x.demo; });
  }

  /* ---------------- پوسته ---------------- */

  function sidebarHtml() {
    var path = Nova.router.path() || '/dashboard';
    return '<aside class="sidebar" id="sidebar" aria-label="ناوبری اصلی">' +
      '<div class="sidebar-brand">' +
      '<div class="brand-mark">ن</div>' +
      '<div><div class="brand-name">نوا</div></div>' +
      '<span class="brand-badge">نسخهٔ نمایشی</span>' +
      '</div>' +
      '<nav class="sidebar-nav">' +
      NAV.map(function (g) {
        return '<div class="nav-group-label">' + g.label + '</div>' + g.items.map(function (it) {
          var active = path === it.route || path.indexOf(it.route + '/') === 0 || path.indexOf(it.route + '?') === 0;
          var count = it.count ? it.count() : 0;
          return '<a class="nav-item' + (active ? ' active' : '') + '" href="#' + it.route + '"' + (active ? ' aria-current="page"' : '') + '>' +
            Nova.icon(it.icon) + '<span>' + it.title + '</span>' +
            (count ? '<span class="nav-count">' + U.faNum(count) + '</span>' : '') +
            '</a>';
        }).join('');
      }).join('') +
      '</nav>' +
      '<div class="sidebar-foot">' +
      '<div class="conn-line"><span class="dot dot-off"></span> بدون اتصال سرویس خارجی</div>' +
      '<div style="margin-top:6px">ذخیره‌سازی محلی · بدون ارسال داده</div>' +
      '</div>' +
      '</aside>';
  }

  function topbarHtml() {
    var path = Nova.router.path() || '/dashboard';
    var t = titleFor(path);
    return '<header class="topbar">' +
      '<button class="icon-btn menu-toggle" id="menu-toggle" aria-label="باز کردن منو">' + Nova.icon('menu') + '</button>' +
      '<div class="grow"><div class="topbar-title">' + t[1] + '</div>' +
      '<div class="topbar-sub">' + t[2] + '</div></div>' +
      '<button class="icon-btn topbar-search-btn" id="mobile-search" aria-label="جست‌وجو">' + Nova.icon('search') + '</button>' +
      '<div class="searchbox" id="searchbox">' + Nova.icon('search') +
      '<input type="search" id="global-search" placeholder="جست‌وجوی ماژول‌ها و محتوا…" aria-label="جست‌وجوی سراسری" autocomplete="off">' +
      '<div class="search-pop" id="search-pop" hidden></div>' +
      '</div>' +
      '<button class="conn-chip" id="conn-chip" aria-haspopup="true"><span class="dot dot-off"></span>بدون اتصال</button>' +
      '<button class="icon-btn" id="theme-btn" aria-label="تغییر تم روشن/تیره">' + (Nova.theme.resolved() === 'dark' ? Nova.icon('sun') : Nova.icon('moon')) + '</button>' +
      '<div class="avatar" title="کاربر مهمان (نمونه)">م</div>' +
      '<div class="conn-pop" id="conn-pop" hidden>' +
      '<div style="font-weight:700;font-size:var(--fs-small);margin-bottom:8px">وضعیت اتصال‌ها</div>' +
      ['تولید متن', 'تولید تصویر', 'تولید ویدیو', 'گفت‌وگوی زنده', 'انتشار وردپرس'].map(function (s) {
        return '<div class="row-between" style="padding:5px 0"><span class="small">' + s + '</span><span class="badge badge-conn">متصل نیست</span></div>';
      }).join('') +
      '<div class="banner banner-info" style="margin:10px 0 0">' + Nova.icon('info') + '<div>اتصال‌ها در نسخهٔ واقعی از سمت سرور انجام می‌شود؛ کلید در مرورگر نگه داشته نمی‌شود.</div></div>' +
      '<a class="btn btn-soft btn-sm" style="margin-top:10px" href="#/settings">تنظیمات اتصال‌ها</a>' +
      '</div>' +
      '</header>';
  }

  function renderShell() {
    var rootEl = document.getElementById('app-root');
    rootEl.innerHTML =
      '<div class="app-shell">' +
      sidebarHtml() +
      '<div class="main-col">' +
      topbarHtml() +
      '<main class="workspace" id="view-root"></main>' +
      '</div></div>' +
      '<div class="backdrop" id="nav-backdrop"></div>';
    bindShell();
  }

  function bindShell() {
    var rootEl = document.getElementById('app-root');

    document.getElementById('menu-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('nav-backdrop').addEventListener('click', closeSidebar);

    var themeBtn = document.getElementById('theme-btn');
    themeBtn.addEventListener('click', function () {
      Nova.theme.toggle();
    });
    Nova.theme.onChange(function () {
      themeBtn.innerHTML = Nova.theme.resolved() === 'dark' ? Nova.icon('sun') : Nova.icon('moon');
    });

    /* اعلان وضعیت اتصال */
    var chip = document.getElementById('conn-chip');
    var pop = document.getElementById('conn-pop');
    chip.addEventListener('click', function (e) {
      e.stopPropagation();
      pop.hidden = !pop.hidden;
    });
    document.addEventListener('click', function (e) {
      if (!pop.hidden && !pop.contains(e.target) && e.target !== chip) pop.hidden = true;
    });

    /* جست‌وجوی سراسری */
    var box = document.getElementById('searchbox');
    var input = document.getElementById('global-search');
    var popSearch = document.getElementById('search-pop');
    document.getElementById('mobile-search').addEventListener('click', function () {
      box.classList.toggle('mobile-open');
      if (box.classList.contains('mobile-open')) input.focus();
    });

    function searchIndex() {
      var items = [];
      NAV.forEach(function (g) {
        g.items.forEach(function (it) {
          items.push({ title: it.title, sub: 'ماژول', icon: it.icon, route: it.route });
        });
      });
      items.push({ title: 'مقالهٔ جدید', sub: 'اقدام', icon: 'plus', route: '/content/article/new' });
      items.push({ title: 'استودیوی عکس', sub: 'ماژول', icon: 'image', route: '/content/photo' });
      items.push({ title: 'استودیوی ویدیو', sub: 'ماژول', icon: 'video', route: '/content/video' });
      items.push({ title: 'ابزارهای متنی — کپشن', sub: 'ابزار', icon: 'hash', route: '/content/text?tool=caption' });
      items.push({ title: 'ابزارهای متنی — ایمیل', sub: 'ابزار', icon: 'mail', route: '/content/text?tool=email' });
      items.push({ title: 'ابزارهای متنی — توضیح محصول', sub: 'ابزار', icon: 'briefcase', route: '/content/text?tool=product' });
      items.push({ title: 'ابزارهای متنی — متن تبلیغاتی', sub: 'ابزار', icon: 'megaphone', route: '/content/text?tool=ad' });
      items.push({ title: 'تقویم محتوا', sub: 'بخشی از کتابخانه', icon: 'calendar', route: '/library?tab=calendar' });
      visibleList('articles').slice(0, 8).forEach(function (a) {
        items.push({ title: a.title || 'بدون عنوان', sub: 'مقاله' + (a.demo ? ' (نمونه)' : ''), icon: 'fileText', route: '/content/article/edit/' + a.id });
      });
      return items;
    }

    function renderResults() {
      var q = U.norm(input.value.trim());
      var all = searchIndex();
      var results = q ? all.filter(function (it) { return U.norm(it.title).indexOf(q) > -1; }) : all.slice(0, 7);
      if (!results.length) {
        popSearch.innerHTML = '<div class="search-item" style="cursor:default"><span class="si-sub">نتیجه‌ای برای «' + ui.esc(input.value) + '» پیدا نشد</span></div>';
      } else {
        popSearch.innerHTML = results.slice(0, 9).map(function (it, i) {
          return '<button class="search-item' + (i === 0 ? ' sel' : '') + '" data-route="' + it.route + '">' +
            Nova.icon(it.icon) + '<span class="grow">' + ui.esc(it.title) + '</span><span class="si-sub">' + it.sub + '</span></button>';
        }).join('');
      }
      popSearch.hidden = false;
    }

    input.addEventListener('input', U.debounce(renderResults, 120));
    input.addEventListener('focus', renderResults);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { popSearch.hidden = true; input.blur(); }
      if (e.key === 'Enter') {
        var first = popSearch.querySelector('.search-item[data-route]');
        if (first) {
          popSearch.hidden = true;
          input.value = '';
          Nova.router.navigate(first.getAttribute('data-route'));
        }
      }
    });
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) popSearch.hidden = true;
    });
    ui.bind(popSearch, 'click', '[data-route]', function (e, btn) {
      popSearch.hidden = true;
      input.value = '';
      Nova.router.navigate(btn.getAttribute('data-route'));
    });
  }

  function toggleSidebar() {
    var sb = document.getElementById('sidebar');
    var back = document.getElementById('nav-backdrop');
    sb.classList.toggle('open');
    back.classList.toggle('show', sb.classList.contains('open'));
  }
  function closeSidebar() {
    var sb = document.getElementById('sidebar');
    var back = document.getElementById('nav-backdrop');
    if (sb) sb.classList.remove('open');
    if (back) back.classList.remove('show');
  }

  function setActiveNav(path) {
    ui.qsa('.nav-item').forEach(function (a) {
      var route = a.getAttribute('href').slice(1);
      var active = path === route || path.indexOf(route + '/') === 0 || path.indexOf(route + '?') === 0;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var t = titleFor(path);
    var tt = document.querySelector('.topbar-title');
    var ts = document.querySelector('.topbar-sub');
    if (tt) tt.textContent = t[1];
    if (ts) ts.textContent = t[2];
    refreshNavCounts();
  }

  function refreshNavCounts() {
    NAV.forEach(function (g) {
      g.items.forEach(function (it) {
        if (!it.count) return;
        var n = it.count();
        var el = document.querySelector('.nav-item[href="#' + it.route + '"] .nav-count');
        if (el) {
          if (n) el.textContent = U.faNum(n);
          else el.remove();
        } else if (n) {
          var a = document.querySelector('.nav-item[href="#' + it.route + '"]');
          if (a) a.insertAdjacentHTML('beforeend', '<span class="nav-count">' + U.faNum(n) + '</span>');
        }
      });
    });
  }

  /* ---------------- خوش‌آمد اولین اجرا ---------------- */

  function onboardIfNeeded() {
    var meta = Nova.store.read('meta', {});
    if (meta.onboarded) return;
    var m = ui.modal({
      title: 'به نوا خوش آمدید',
      size: 'lg',
      body: '<div class="stack">' +
        '<p class="small" style="line-height:1.9">نوا یک پلتفرم فارسی برای تولید محتوا و مدیریت کسب‌وکار است. این نسخه، <b>نمونه‌کار تعاملی کاملاً محلی</b> است و صادقانه باید بدانید:</p>' +
        '<div class="banner banner-info">' + Nova.icon('info') + '<div>بدون اتصال API کار می‌کند؛ تولید واقعی مقاله/عکس/ویدیو انجام نمی‌شود و خروجی‌ها <b>بریف و پرامپت قالبی</b> با برچسب مشخص هستند.</div></div>' +
        '<div class="banner banner-success">' + Nova.icon('checkCircle') + '<div>داده‌های نمونه از قبل کاشته شده‌اند (با برچسب «نمونه») و داده‌های شما جدا نگه داشته می‌شود. همه‌چیز در مرورگر خودتان ذخیره می‌شود.</div></div>' +
        '</div>',
      footer: '<a class="btn btn-primary" href="#/dashboard" data-start="1">شروع کنید</a>' +
        '<a class="btn btn-ghost" href="#/generator" data-start="1">امتحان مولد هوشمند</a>',
      onClose: function () {
        var mt = Nova.store.read('meta', {});
        mt.onboarded = true;
        Nova.store.write('meta', mt);
      }
    });
    ui.bind(m.footer, 'click', '[data-start]', function () { m.close(); });
  }

  /* ---------------- ثبت مسیرها ---------------- */

  function registerRoutes() {
    var R = Nova.router;
    R.add('/dashboard', Nova.dashboard.render);
    R.add('/content', Nova.contentCenter.render);
    R.add('/content/article/new', function () {
      Nova.articleEditor.createNew();
    });
    R.add('/content/article/edit/:id', Nova.articleEditor.render);
    R.add('/content/article', Nova.articleList.render);
    R.add('/content/photo', Nova.photoStudio.render);
    R.add('/content/video', Nova.videoStudio.render);
    R.add('/content/text', Nova.textTools.render);
    R.add('/generator', Nova.generator.render);
    R.add('/brand', Nova.brand.render);
    R.add('/library', Nova.library.render);
    R.add('/live-chat', Nova.liveChat.render);
    R.add('/team-chat', Nova.teamChat.render);
    R.add('/comments', Nova.comments.render);
    R.add('/companies', Nova.org.companies.render);
    R.add('/teams', Nova.org.teams.render);
    R.add('/domains', Nova.org.domains.render);
    R.add('/users', Nova.org.users.render);
    R.add('/settings', Nova.settings.render);
  }

  /* ---------------- شروع ---------------- */

  function boot() {
    /* ثبت خطاهای غیرمنتظره برای شفافیت */
    window.addEventListener('error', function (e) {
      Nova.log('خطای سراسری: ' + (e.message || ''), e.error);
      if (document.querySelector('.toast-zone')) {
        ui.toast('خطای غیرمنتظره‌ای رخ داد؛ جزئیات در کنسول مرورگر ثبت شد.', 'error');
      }
    });

    if (!Nova.store.isAvailable()) {
      document.body.innerHTML = '<div style="max-width:520px;margin:15vh auto;padding:20px;font-family:inherit">' +
        '<h1 style="font-size:20px">ذخیره‌سازی مرورگر در دسترس نیست</h1>' +
        '<p style="line-height:2;color:#555">نوا برای نگهداری داده‌ها به localStorage نیاز دارد. حالت ناشناس/private مرورگر یا محدودیت کوکی ممکن است مانع شده باشد. لطفاً در حالت عادی مرورگر باز کنید.</p></div>';
      return;
    }

    var seeded = Nova.seed.seedIfEmpty();
    Nova.theme.init();
    renderShell();
    registerRoutes();
    Nova.articleEditor.initFormatBar();
    Nova.router.start();
    onboardIfNeeded();
  }

  return {
    boot: boot,
    visibleList: visibleList,
    setActiveNav: setActiveNav,
    closeSidebar: closeSidebar,
    pending: null
  };
})();

/* گزارش خطا (بدون نمایش به کاربر نهایی) */
Nova.log = function (msg, err) {
  try { console.warn('[نوا]', msg, err || ''); } catch (e) { /* noop */ }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Nova.app.boot);
} else {
  Nova.app.boot();
}
