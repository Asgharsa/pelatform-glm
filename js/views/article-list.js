/* ============================================================
   نوا — فهرست مقاله‌ها و واردکردن JSON
   ============================================================ */
window.Nova = window.Nova || {};

Nova.articleList = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui;

  function statusBadge(a) {
    return a.status === 'done' ? ui.badge('done', 'تکمیل‌شده') : ui.badge('draft', 'پیش‌نویس');
  }

  function row(a) {
    var st = Nova.builders.articleStats(a);
    var cat = Nova.options.label(Nova.options.categories, a.settings && a.settings.category);
    return '<tr data-id="' + a.id + '">' +
      '<td data-label="عنوان"><div class="row" style="flex-wrap:nowrap"><span class="truncate" style="max-width:280px;font-weight:600">' + ui.esc(a.title || 'بدون عنوان') + '</span>' + (a.demo ? ui.badge('badge-demo', 'نمونه') : '') + '</div></td>' +
      '<td data-label="وضعیت">' + statusBadge(a) + '</td>' +
      '<td data-label="دسته‌بندی">' + ui.esc(cat || '—') + '</td>' +
      '<td data-label="نویسنده">' + ui.esc((a.settings && a.settings.author) || '—') + '</td>' +
      '<td data-label="حجم">' + U.faNum(st.words) + ' کلمه</td>' +
      '<td data-label="بروزرسانی">' + U.faRelative(a.updatedAt || Date.now()) + '</td>' +
      '<td data-label="عملیات"><div class="row-actions">' +
      '<a class="icon-btn primary" href="#/content/article/edit/' + a.id + '" title="ویرایش" aria-label="ویرایش">' + Nova.icon('pen') + '</a>' +
      ui.iconBtn('dup', 'copy', 'تکثیر', 'primary') +
      ui.iconBtn('export', 'download', 'خروجی JSON', 'primary') +
      (a.demo ? '' : ui.iconBtn('del', 'trash', 'حذف', 'danger')) +
      '</div></td>' +
      '</tr>';
  }

  function render(container) {
    container.innerHTML =
      '<div class="page-head view-enter row-between">' +
      '<div><h1>مقاله و وبلاگ</h1><div class="page-sub">ویرایشگر بلوکی، تنظیمات سئو و خروجی وردپرس</div></div>' +
      '<div class="row">' +
      '<button class="btn btn-ghost" data-action="import">' + Nova.icon('upload') + ' واردکردن JSON</button>' +
      '<a class="btn btn-primary" href="#/content/article/new">' + Nova.icon('plus') + ' مقالهٔ جدید</a>' +
      '</div></div>' +
      '<input type="file" accept=".json,application/json" class="visually-hidden" id="art-import-file">' +
      '<div class="card" style="padding:12px 14px;margin-bottom:14px"><div class="row">' +
      '<div class="searchbox grow" style="max-width:340px;position:relative">' +
      Nova.icon('search') +
      '<input type="search" id="art-search" placeholder="جست‌وجو در عنوان، برچسب و نویسنده…" aria-label="جست‌وجو در مقاله‌ها">' +
      '</div></div></div>' +
      '<div id="art-list"></div>';

    function listHtml(filter) {
      var arts = Nova.app.visibleList('articles');
      if (filter) {
        var f = U.norm(filter);
        arts = arts.filter(function (a) {
          var hay = U.norm([a.title, a.settings && a.settings.author, (a.settings && a.settings.tags || []).join(' ')].join(' '));
          return hay.indexOf(f) > -1;
        });
      }
      if (!arts.length) {
        return '<div class="card">' + ui.emptyState({
          icon: filter ? 'search' : 'fileText',
          title: filter ? 'نتیجه‌ای پیدا نشد' : 'هنوز مقاله‌ای نیست',
          desc: filter ? 'برای «' + filter + '» مقاله‌ای یافت نشد. عبارت دیگری را امتحان کنید یا مقالهٔ جدید بسازید.' : 'اولین مقالهٔ وبلاگ خود را بسازید؛ ویرایشگر بلوکی با ذخیرهٔ خودکار و خروجی وردپرس منتظر شماست.',
          action: '<a class="btn btn-primary" href="#/content/article/new">' + Nova.icon('plus') + ' مقالهٔ جدید</a>'
        }) + '</div>';
      }
      arts.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      return '<div class="table-wrap"><table class="table"><thead><tr>' +
        '<th>عنوان</th><th>وضعیت</th><th>دسته‌بندی</th><th>نویسنده</th><th>حجم</th><th>بروزرسانی</th><th></th>' +
        '</tr></thead><tbody>' + arts.map(row).join('') + '</tbody></table></div>';
    }

    var listEl = container.querySelector('#art-list');
    listEl.innerHTML = listHtml('');

    var searchEl = container.querySelector('#art-search');
    searchEl.addEventListener('input', U.debounce(function () {
      listEl.innerHTML = listHtml(searchEl.value.trim());
    }, 180));

    var fileEl = container.querySelector('#art-import-file');
    fileEl.addEventListener('change', function () {
      var file = fileEl.files && fileEl.files[0];
      fileEl.value = '';
      if (!file) return;
      if (file.size > 1024 * 1024) { ui.toast('فایل بیش از ۱ مگابایت است؛ فایل پشتیبان مقاله نباید این‌قدر بزرگ باشد.', 'error'); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var payload;
        try { payload = JSON.parse(reader.result); }
        catch (e) { ui.toast('فایل JSON قابل خواندن نیست: ساختار متن معتبر نیست.', 'error'); return; }
        var check = Nova.builders.validateArticleImport(payload);
        if (!check.ok) { ui.toast('واردکردن انجام نشد — ' + check.reason, 'error'); return; }
        var art = {
          id: U.uid('art'),
          demo: false,
          status: 'draft',
          title: String(payload.title || 'مقالهٔ واردشده'),
          blocks: payload.blocks,
          settings: payload.settings || {},
          brief: payload.brief || null,
          revisions: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          importedAt: true
        };
        var r = Nova.store.insert('articles', art);
        if (!r.result.ok) { ui.toast('ذخیره انجام نشد؛ فضای ذخیره‌سازی مرورگر ممکن است پر باشد.', 'error'); return; }
        ui.toast('مقالهٔ «' + art.title + '» با موفقیت وارد شد.', 'success');
        Nova.router.navigate('/content/article/edit/' + art.id);
      };
      reader.onerror = function () { ui.toast('خواندن فایل شکست خورد؛ دوباره تلاش کنید.', 'error'); };
      reader.readAsText(file, 'utf-8');
    });

    ui.bind(container, 'click', '[data-action]', function (e, btn) {
      var tr = btn.closest('tr');
      var id = tr && tr.getAttribute('data-id');
      if (!id) return;
      var action = btn.getAttribute('data-action');
      if (action === 'dup') {
        var src = Nova.store.getById('articles', id);
        if (!src) return;
        var copy = JSON.parse(JSON.stringify(src));
        copy.id = U.uid('art');
        copy.demo = false;
        copy.status = 'draft';
        copy.title = (src.title || 'بدون عنوان') + ' (کپی)';
        copy.createdAt = copy.updatedAt = Date.now();
        copy.revisions = [];
        var r = Nova.store.insert('articles', copy);
        if (r.result.ok) {
          ui.toast('نسخهٔ کپی ساخته شد.', 'success');
          listEl.innerHTML = listHtml(searchEl.value.trim());
        } else {
          ui.toast('ذخیره انجام نشد؛ فضای ذخیره‌سازی پر است.', 'error');
        }
      } else if (action === 'export') {
        var art = Nova.store.getById('articles', id);
        if (!art) return;
        var payload = { app: 'nova-article', schema: 1, exportedAt: new Date().toISOString(), title: art.title, blocks: art.blocks, settings: art.settings, brief: art.brief };
        U.download('nova-article-' + (art.settings && art.settings.slug || art.id) + '.json', JSON.stringify(payload, null, 2), 'application/json');
        ui.toast('فایل پشتیبان JSON دانلود شد.', 'success');
      } else if (action === 'del') {
        var art2 = Nova.store.getById('articles', id);
        ui.confirmDialog({
          title: 'حذف مقاله',
          message: 'مقالهٔ «' + ui.esc(art2 ? art2.title : '') + '» و تاریخچهٔ ذخیرهٔ خودکارش برای همیشه حذف می‌شود. این عمل بازگشت‌پذیر نیست.',
          confirmText: 'حذف کن',
          danger: true
        }).then(function (yes) {
          if (!yes) return;
          Nova.store.removeById('articles', id);
          ui.toast('مقاله حذف شد.', 'success');
          listEl.innerHTML = listHtml(searchEl.value.trim());
        });
      }
    });

    /* ردیف‌ها data-id را مستقیماً در HTML دارند */
  }

  return { render: render };
})();
