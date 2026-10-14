/* ============================================================
   نوا — کتابخانه و تقویم محتوا
   کتابخانه: جست‌وجو، فیلتر نوع و منبع، مشاهده/ویرایش/تکثیر/حذف/خروجی
   تقویم: برنامهٔ محلی جلالی — انتشار واقعی انجام نمی‌شود
   ============================================================ */
window.Nova = window.Nova || {};

Nova.library = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui, B = Nova.builders;
  var tab = 'library';
  var cal = { jy: 0, jm: 0 };
  var filter = { q: '', type: 'all', source: 'all' };

  /* ---------- کتابخانه ---------- */

  function collectItems() {
    var items = [];
    Nova.app.visibleList('articles').forEach(function (a) {
      items.push({
        id: a.id, demo: !!a.demo, type: 'article', title: a.title || 'بدون عنوان',
        meta: (a.status === 'done' ? 'تکمیل‌شده' : 'پیش‌نویس') + ' · ' + U.faRelative(a.updatedAt || Date.now()),
        preview: (a.settings && a.settings.excerpt) || stripBlocksPreview(a),
        route: '#/content/article/edit/' + a.id, item: a
      });
    });
    Nova.app.visibleList('photoBriefs').forEach(function (p) {
      items.push({ id: p.id, demo: !!p.demo, type: 'photo', title: p.title, meta: U.faRelative(p.updatedAt || p.createdAt || Date.now()), preview: p.prompt || '', route: '#/content/photo', item: p });
    });
    Nova.app.visibleList('videoBriefs').forEach(function (v) {
      items.push({ id: v.id, demo: !!v.demo, type: 'video', title: v.title, meta: U.faRelative(v.updatedAt || v.createdAt || Date.now()), preview: v.prompt || '', route: '#/content/video', item: v });
    });
    Nova.app.visibleList('textBriefs').forEach(function (t) {
      items.push({ id: t.id, demo: !!t.demo, type: 'text', title: t.title, meta: U.faRelative(t.updatedAt || t.createdAt || Date.now()), preview: t.prompt || '', route: '#/content/text', item: t });
    });
    return items;
  }

  function stripBlocksPreview(a) {
    var texts = (a.blocks || []).slice(0, 3).map(function (b) {
      var d = b.data || {};
      return d.text || U.stripHtml(d.html || '') || (d.items || []).join(' ') || (b.type === 'img' ? '[تصویر]' : (b.type === 'link' ? (d.text || '') : ''));
    }).filter(Boolean);
    return texts.join(' — ').slice(0, 180);
  }

  var TYPE_META = {
    article: { label: 'مقاله', icon: 'fileText' },
    photo: { label: 'عکس', icon: 'image' },
    video: { label: 'ویدیو', icon: 'video' },
    text: { label: 'متن', icon: 'pen' }
  };

  function filtered() {
    var items = collectItems();
    if (filter.type !== 'all') items = items.filter(function (i) { return i.type === filter.type; });
    if (filter.source === 'user') items = items.filter(function (i) { return !i.demo; });
    if (filter.source === 'demo') items = items.filter(function (i) { return i.demo; });
    if (filter.q) {
      var q = U.norm(filter.q);
      items = items.filter(function (i) { return U.norm(i.title + ' ' + i.preview).indexOf(q) > -1; });
    }
    return items;
  }

  function libGridHtml() {
    var items = filtered();
    if (!items.length) {
      return '<div class="card">' + ui.emptyState({
        icon: 'search', title: filter.q ? 'نتیجه‌ای پیدا نشد' : 'کتابخانه خالی است',
        desc: filter.q ? 'برای «' + ui.esc(filter.q) + '» چیزی یافت نشد. عبارت دیگری امتحان کنید.' : 'با ساخت اولین مقاله یا پرامپت، آیتم‌ها این‌جا جمع می‌شوند.',
        action: '<a class="btn btn-primary" href="#/generator">' + Nova.icon('wand') + ' شروع از مولد هوشمند</a>'
      }) + '</div>';
    }
    return '<div class="grid grid-3">' + items.map(function (i) {
      var tm = TYPE_META[i.type];
      return '<div class="lib-card" data-id="' + i.id + '" data-libtype="' + i.type + '">' +
        '<div class="row-between"><div class="lib-tile" style="background:var(--acc-' + (i.type === 'text' ? 'text' : i.type) + '-soft);color:var(--acc-' + (i.type === 'text' ? 'text' : i.type) + ')">' + Nova.icon(tm.icon) + '</div>' +
        '<div class="row" style="gap:4px">' + (i.demo ? ui.badge('badge-demo', 'نمونه') : '') + '<span class="badge badge-local">' + tm.label + '</span></div></div>' +
        '<div class="lib-title clamp-2">' + ui.esc(i.title) + '</div>' +
        '<div class="lib-preview" data-rtl="1">' + ui.esc(i.preview || '—') + '</div>' +
        '<div class="row-between"><span class="lib-meta">' + i.meta + '</span>' +
        '<div class="row-actions">' +
        ui.iconBtn('view', 'eye', 'مشاهده') +
        ui.iconBtn('edit', 'pen', 'ویرایش', 'primary') +
        ui.iconBtn('dup', 'copy', 'تکثیر') +
        ui.iconBtn('export', 'download', 'خروجی') +
        (i.demo ? '' : ui.iconBtn('del', 'trash', 'حذف', 'danger')) +
        '</div></div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function findItem(card) {
    var id = card.getAttribute('data-id');
    var type = card.getAttribute('data-libtype');
    var storeKey = type === 'article' ? 'articles' : type === 'photo' ? 'photoBriefs' : type === 'video' ? 'videoBriefs' : 'textBriefs';
    return { item: Nova.store.getById(storeKey, id), storeKey: storeKey, type: type };
  }

  function openViewer(i) {
    var body = '';
    if (i.type === 'article') {
      body = '<div class="article-preview" style="padding:6px 2px"><h1 style="font-size:var(--fs-xl)">' + ui.esc(i.item.title || '') + '</h1>' +
        (i.item.blocks || []).map(B.blockToHtml).join('') + '</div>';
    } else {
      body = '<pre class="code-block" style="direction:rtl;text-align:right;white-space:pre-wrap;font-family:var(--font-sans)">' + ui.esc(i.item.prompt || '') + '</pre>';
    }
    var m = ui.modal({
      title: 'مشاهده ' + (i.demo ? ui.badge('badge-demo', 'نمونه') : ''),
      size: 'lg',
      body: body,
      footer: '<button class="btn btn-soft btn-sm" id="lib-copy">' + Nova.icon('copy') + ' کپی</button>'
    });
    ui.bind(m.footer, 'click', '#lib-copy', function () {
      U.copyText(i.type === 'article' ? B.buildArticleHtml(i.item) : (i.item.prompt || ''), function (ok) { ui.toast(ok ? 'کپی شد.' : 'کپی انجام نشد.', ok ? 'success' : 'error'); });
    });
  }

  function paintLibrary(container) {
    var grid = container.querySelector('#lib-grid');
    if (grid) grid.innerHTML = libGridHtml();
  }

  /* ---------- تقویم ---------- */

  function ensureCal() {
    if (!cal.jy) {
      var j = U.toJalaali(new Date());
      cal.jy = j.jy; cal.jm = j.jm;
    }
  }

  function plansForDay(jd) {
    return Nova.app.visibleList('calendarPlans').filter(function (p) {
      var d = new Date(p.date);
      var j = U.toJalaali(d);
      return j.jy === cal.jy && j.jm === cal.jm && j.jd === jd;
    });
  }

  function calendarHtml() {
    ensureCal();
    var first = U.toGregorian(cal.jy, cal.jm, 1);
    var firstDate = new Date(first.gy, first.gm - 1, first.gd);
    var startCol = (firstDate.getDay() + 1) % 7; /* شنبه = ۰ */
    var len = U.jalaaliMonthLength(cal.jy, cal.jm);
    var today = U.toJalaali(new Date());
    var cells = '';
    for (var i = 0; i < startCol; i++) cells += '<div class="cal-day out"></div>';
    for (var d = 1; d <= len; d++) {
      var plans = plansForDay(d);
      var isToday = today.jy === cal.jy && today.jm === cal.jm && today.jd === d;
      cells += '<div class="cal-day' + (isToday ? ' today' : '') + (plans.length ? ' has-ev' : '') + '" data-day="' + d + '" role="button" tabindex="0" aria-label="' + U.faNum(d) + ' ' + U.faMonths[cal.jm - 1] + '">' +
        '<div class="day-num">' + U.faNum(d) + '</div>' +
        '<div class="cal-ev">' + plans.slice(0, 2).map(function (p) {
          return '<span class="cal-chip ' + (p.type === 'article' ? '' : p.type) + '" data-plan="' + p.id + '" title="' + ui.esc(p.title) + '">' + ui.esc(p.title) + '</span>';
        }).join('') + (plans.length > 2 ? '<span class="cal-chip other">+' + U.faNum(plans.length - 2) + '</span>' : '') + '</div></div>';
    }
    return '<div class="cal-nav">' +
      '<button class="icon-btn" data-cal="prev" aria-label="ماه قبل">' + Nova.icon('chevronStart') + '</button>' +
      '<div class="cal-title">' + U.faMonths[cal.jm - 1] + ' ' + U.faNum(cal.jy) + '</div>' +
      '<button class="icon-btn" data-cal="next" aria-label="ماه بعد">' + Nova.icon('chevronEnd') + '</button>' +
      '<button class="btn btn-ghost btn-sm" data-cal="today">امروز</button>' +
      '</div>' +
      '<div class="cal-grid">' +
      U.faWeekdays.map(function (w) { return '<div class="cal-dow">' + w + '</div>'; }).join('') +
      cells + '</div>' +
      '<div class="field-hint" style="margin-top:10px">روی یک روز کلیک کنید تا برنامهٔ محتوایی اضافه کنید. داده‌ها فقط در همین مرورگر ذخیره می‌شوند.</div>';
  }

  function openPlanModal(jd) {
    var plans = plansForDay(jd);
    var listHtml = plans.map(function (p) {
      return '<div class="row-between" style="padding:7px 0;border-bottom:1px solid var(--border)" data-planrow="' + p.id + '">' +
        '<div class="row"><span class="badge badge-tool ' + (p.type === 'article' ? '' : p.type) + '">' + (TYPE_META[p.type] ? TYPE_META[p.type].label : 'سایر') + '</span>' +
        '<span class="small" style="font-weight:600">' + ui.esc(p.title) + '</span>' + (p.demo ? ui.badge('badge-demo', 'نمونه') : '') + '</div>' +
        (p.demo ? '' : ui.iconBtn('plan-del', 'trash', 'حذف برنامه', 'danger').replace('data-action="plan-del"', 'data-action="plan-del" data-pid="' + p.id + '"')) +
        '</div>';
    }).join('');
    var m = ui.modal({
      title: 'برنامهٔ روز ' + U.faNum(jd) + ' ' + U.faMonths[cal.jm - 1],
      body: '<div class="stack">' +
        (plans.length ? '<div>' + listHtml + '</div>' : '<div class="caption">برنامه‌ای برای این روز ثبت نشده.</div>') +
        '<div class="grid grid-2">' +
        '<div class="field"><span class="field-label">عنوان برنامه</span><input class="input" id="plan-title" placeholder="مثلاً: انتشار ریلز دمنوش"></div>' +
        '<div class="field"><span class="field-label">نوع</span><select class="select" id="plan-type">' +
        '<option value="article">مقاله</option><option value="photo">عکس</option><option value="video">ویدیو</option><option value="text">متن</option><option value="other">سایر</option>' +
        '</select></div>' +
        '<div class="field full"><span class="field-label">یادداشت</span><input class="input" id="plan-notes" placeholder="اختیاری"></div>' +
        '</div>' +
        '<button class="btn btn-primary btn-sm" id="plan-add">' + Nova.icon('plus') + ' افزودن برنامه</button>' +
        '</div>'
    });
    m.body.querySelector('#plan-add').addEventListener('click', function () {
      var title = m.body.querySelector('#plan-title').value.trim();
      if (!title) { ui.toast('عنوان برنامه را بنویسید.', 'warn'); return; }
      var type = m.body.querySelector('#plan-type').value;
      var notes = m.body.querySelector('#plan-notes').value.trim();
      var g = U.toGregorian(cal.jy, cal.jm, jd);
      var d = new Date(g.gy, g.gm - 1, g.gd);
      var r = Nova.store.insert('calendarPlans', { id: U.uid('cp'), demo: false, date: d.toISOString(), type: type, title: title, notes: notes });
      if (!r.result.ok) { ui.toast('ذخیره انجام نشد.', 'error'); return; }
      ui.toast('برنامه ثبت شد (فقط محلی — انتشار واقعی انجام نمی‌شود).', 'success');
      paint();
      m.close();
    });
    ui.bind(m.body, 'click', '[data-action="plan-del"]', function (e, btn) {
      var pid = btn.getAttribute('data-pid');
      if (!pid) return;
      Nova.store.removeById('calendarPlans', pid);
      ui.toast('برنامه حذف شد.', 'success');
      paint();
      m.close();
      openPlanModal(jd);
    });
  }

  /* ---------- رندر کلی ---------- */

  function paint() {
    var container = document.getElementById('view-root');
    if (!container) return;
    var urlTab = (location.hash.split('?')[1] || '').split('=');
    if (urlTab[0] === 'tab' && (urlTab[1] === 'calendar' || urlTab[1] === 'library')) tab = urlTab[1];

    container.innerHTML =
      '<div class="page-head view-enter row-between">' +
      '<div><h1>کتابخانه و تقویم محتوا</h1><div class="page-sub">همهٔ مقاله‌ها و پرامپت‌های ذخیره‌شده + برنامهٔ انتشار محلی</div></div>' +
      '</div>' +
      (tab === 'calendar'
        ? ui.banner('warn', '<b>این تقویم صرفاً برنامهٔ محلی است.</b> هیچ انتشار واقعی انجام نمی‌شود و هیچ چیزی به سرویس خارجی ارسال نمی‌شود.') +
          '<div class="card">' + calendarHtml() + '</div>'
        : '<div class="card" style="padding:12px 14px;margin-bottom:14px"><div class="row">' +
          '<div class="searchbox grow" style="max-width:320px">' + Nova.icon('search') +
          '<input type="search" id="lib-search" placeholder="جست‌وجو در عنوان و متن…" value="' + ui.esc(filter.q) + '" aria-label="جست‌وجو در کتابخانه"></div>' +
          '<div class="chips" data-field="libtype">' +
          ['all', 'article', 'photo', 'video', 'text'].map(function (t) {
            var label = t === 'all' ? 'همه' : TYPE_META[t].label;
            return '<button type="button" class="chip' + (filter.type === t ? ' on' : '') + '" data-libfilter="' + t + '">' + label + '</button>';
          }).join('') + '</div>' +
          '<div class="chips">' +
          '<button type="button" class="chip' + (filter.source === 'all' ? ' on' : '') + '" data-srcfilter="all">همهٔ منابع</button>' +
          '<button type="button" class="chip' + (filter.source === 'user' ? ' on' : '') + '" data-srcfilter="user">دادهٔ من</button>' +
          '<button type="button" class="chip' + (filter.source === 'demo' ? ' on' : '') + '" data-srcfilter="demo">نمونه</button>' +
          '</div></div></div>' +
          '<div id="lib-grid">' + libGridHtml() + '</div>');

    /* تب‌سوییچ در صفحهٔ اصلی + شمارنده در ناوبری */
    var tabsRow = '<div class="row" style="margin-bottom:14px">' +
      '<div class="chips"><button type="button" class="chip' + (tab === 'library' ? ' on' : '') + '" data-maintab="library">' + Nova.icon('books') + ' کتابخانه</button>' +
      '<button type="button" class="chip' + (tab === 'calendar' ? ' on' : '') + '" data-maintab="calendar">' + Nova.icon('calendar') + ' تقویم محتوا</button></div></div>';
    container.insertAdjacentHTML('afterbegin', tabsRow);

    ui.bind(container, 'click', '[data-maintab]', function (e, btn) {
      tab = btn.getAttribute('data-maintab');
      history.replaceState(null, '', '#/library' + (tab === 'calendar' ? '?tab=calendar' : ''));
      paint();
    });

    if (tab === 'library') {
      var search = container.querySelector('#lib-search');
      search && search.addEventListener('input', U.debounce(function () {
        filter.q = search.value.trim();
        paintLibrary(container);
      }, 180));
      ui.bind(container, 'click', '[data-libfilter]', function (e, btn) {
        filter.type = btn.getAttribute('data-libfilter');
        ui.qsa('[data-libfilter]', container).forEach(function (c) { c.classList.toggle('on', c === btn); });
        paintLibrary(container);
      });
      ui.bind(container, 'click', '[data-srcfilter]', function (e, btn) {
        filter.source = btn.getAttribute('data-srcfilter');
        ui.qsa('[data-srcfilter]', container).forEach(function (c) { c.classList.toggle('on', c === btn); });
        paintLibrary(container);
      });

      ui.bind(container, 'click', '[data-action]', function (e, btn) {
        var card = btn.closest('.lib-card');
        if (!card) return;
        var found = findItem(card);
        if (!found.item) return;
        var act = btn.getAttribute('data-action');
        if (act === 'view') {
          openViewer(found);
        } else if (act === 'edit') {
          if (found.type === 'article') Nova.router.navigate('/content/article/edit/' + found.item.id);
          else if (found.type === 'photo') {
            Nova.app.pending = { type: 'photo', state: found.item.state };
            Nova.router.navigate('/content/photo');
            ui.toast('تنظیمات پرامپت در استودیو بارگذاری شد؛ ذخیرهٔ جدید می‌سازد، نسخهٔ قبلی دست‌نخورده می‌ماند.', 'info');
          } else if (found.type === 'video') {
            Nova.app.pending = { type: 'video', state: found.item.state };
            Nova.router.navigate('/content/video');
            ui.toast('بریف در استودیو بارگذاری شد.', 'info');
          } else {
            Nova.app.pending = { type: 'text', tool: found.item.kind, state: found.item.state };
            Nova.router.navigate('/content/text');
          }
        } else if (act === 'dup') {
          var copy = JSON.parse(JSON.stringify(found.item));
          copy.id = U.uid('lib');
          copy.demo = false;
          copy.title = (found.item.title || 'بدون عنوان') + ' (کپی)';
          copy.createdAt = copy.updatedAt = Date.now();
          var r = Nova.store.insert(found.storeKey, copy);
          if (!r.result.ok) { ui.toast('ذخیره انجام نشد.', 'error'); return; }
          ui.toast('کپی ساخته شد.', 'success');
          paintLibrary(container);
        } else if (act === 'export') {
          var it = found.item;
          if (found.type === 'article') {
            U.download('nova-article-' + ((it.settings && it.settings.slug) || it.id) + '.json', JSON.stringify({ app: 'nova-article', schema: 1, title: it.title, blocks: it.blocks, settings: it.settings, brief: it.brief }, null, 2), 'application/json');
          } else {
            U.download('nova-' + found.type + '-' + it.id + '.txt', it.prompt || '', 'text/plain');
          }
          ui.toast('خروجی دانلود شد.', 'success');
        } else if (act === 'del') {
          ui.confirmDialog({
            title: 'حذف از کتابخانه',
            message: '«' + ui.esc(found.item.title || 'بدون عنوان') + '» حذف می‌شود. این عمل بازگشت‌پذیر نیست.',
            confirmText: 'حذف کن', danger: true
          }).then(function (yes) {
            if (!yes) return;
            Nova.store.removeById(found.storeKey, found.item.id);
            ui.toast('حذف شد.', 'success');
            paintLibrary(container);
          });
        }
      });
    } else {
      ui.bind(container, 'click', '[data-cal]', function (e, btn) {
        var w = btn.getAttribute('data-cal');
        if (w === 'prev') { cal.jm -= 1; if (cal.jm < 1) { cal.jm = 12; cal.jy -= 1; } }
        else if (w === 'next') { cal.jm += 1; if (cal.jm > 12) { cal.jm = 1; cal.jy += 1; } }
        else { var j = U.toJalaali(new Date()); cal.jy = j.jy; cal.jm = j.jm; }
        paint();
      });
      ui.bind(container, 'click', '.cal-day[data-day]', function (e, cell) {
        if (e.target.closest('[data-plan]')) return;
        openPlanModal(parseInt(cell.getAttribute('data-day'), 10));
      });
      ui.bind(container, 'click', '[data-plan]', function (e, chip) {
        var pid = chip.getAttribute('data-plan');
        var day = chip.closest('.cal-day').getAttribute('data-day');
        ui.confirmDialog({
          title: 'حذف برنامه',
          message: 'برنامهٔ «' + ui.esc(chip.textContent) + '» از تقویم حذف می‌شود.',
          confirmText: 'حذف کن', danger: true
        }).then(function (yes) {
          if (!yes) return;
          Nova.store.removeById('calendarPlans', pid);
          ui.toast('برنامه حذف شد.', 'success');
          paint();
        });
      });
    }
  }

  return { render: paint };
})();
