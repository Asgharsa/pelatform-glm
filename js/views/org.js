/* ============================================================
   نوا — ماژول‌های مدیریتی: شرکت‌ها، تیم‌ها، دامنه‌ها، کاربران
   یک کارخانهٔ CRUD مشترک با اعتبارسنجی و تأیید حذف
   ============================================================ */
window.Nova = window.Nova || {};

Nova.org = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui;

  function companyOptions() {
    return Nova.app.visibleList('companies').map(function (c) { return { value: c.id, label: c.name + (c.demo ? ' (نمونه)' : '') }; });
  }
  function teamOptions() {
    return Nova.app.visibleList('teams').map(function (t) { return { value: t.id, label: t.name + (t.demo ? ' (نمونه)' : '') }; });
  }
  function companyName(id) {
    var c = Nova.store.getById('companies', id);
    return c ? c.name : '—';
  }
  function teamName(id) {
    var t = Nova.store.getById('teams', id);
    return t ? t.name : '—';
  }

  var STATUS_LABELS = {
    active: { fa: 'فعال', badge: 'badge-ok' },
    invited: { fa: 'دعوت‌شده', badge: 'badge-warn' },
    inactive: { fa: 'غیرفعال', badge: 'badge-local' },
    verified: { fa: 'تأییدشده', badge: 'badge-ok' },
    pending: { fa: 'در انتظار تأیید', badge: 'badge-warn' }
  };

  var CONFIGS = {
    companies: {
      title: 'شرکت‌ها', sub: 'ثبت و مدیریت شرکت‌ها', icon: 'building', singular: 'شرکت',
      fields: function () {
        return [
          { key: 'name', label: 'نام شرکت', required: true },
          { key: 'industry', label: 'صنعت', placeholder: 'مثلاً: کافه و رستوران' },
          { key: 'website', label: 'وب‌سایت', type: 'url', dirLtr: true, placeholder: 'https://example.ir' },
          { key: 'status', label: 'وضعیت', type: 'select', value: 'active', options: [{ value: 'active', label: 'فعال' }, { value: 'inactive', label: 'غیرفعال' }] },
          { key: 'desc', label: 'توضیحات', type: 'textarea', full: true }
        ];
      },
      columns: function (item) {
        return [
          { label: 'نام', html: '<b>' + ui.esc(item.name) + '</b>' },
          { label: 'صنعت', html: ui.esc(item.industry || '—') },
          { label: 'وب‌سایت', html: item.website ? '<span class="ltr-embed small">' + ui.esc(item.website) + '</span>' : '—' },
          { label: 'وضعیت', html: '<span class="badge ' + (STATUS_LABELS[item.status] || STATUS_LABELS.active).badge + '">' + (STATUS_LABELS[item.status] || { fa: item.status }).fa + '</span>' }
        ];
      }
    },
    teams: {
      title: 'تیم‌ها', sub: 'تیم‌های کاری و عضویت', icon: 'users', singular: 'تیم',
      fields: function () {
        return [
          { key: 'name', label: 'نام تیم', required: true },
          { key: 'companyId', label: 'شرکت', type: 'select', options: companyOptions(), placeholder: '— بدون شرکت —' },
          { key: 'desc', label: 'توضیحات', type: 'textarea', full: true }
        ];
      },
      columns: function (item) {
        return [
          { label: 'نام تیم', html: '<b>' + ui.esc(item.name) + '</b>' },
          { label: 'شرکت', html: ui.esc(companyName(item.companyId)) },
          { label: 'اعضا', html: U.faNum(Nova.store.getList('users').filter(function (u) { return u.teamId === item.id; }).length) + ' نفر' },
          { label: 'توضیح', html: '<span class="truncate" style="max-width:220px;display:inline-block">' + ui.esc(item.desc || '—') + '</span>' }
        ];
      }
    },
    domains: {
      title: 'دامنه‌ها', sub: 'دامنه‌های متصل به کسب‌وکار', icon: 'globe', singular: 'دامنه',
      fields: function () {
        return [
          { key: 'domain', label: 'دامنه', required: true, dirLtr: true, placeholder: 'example.ir', hint: 'نمونه: caferasta.ir', validate: function (v) { return U.validateDomain(v) ? '' : 'قالب دامنه معتبر نیست؛ مثل example.ir'; } },
          { key: 'companyId', label: 'شرکت', type: 'select', options: companyOptions(), placeholder: '— بدون شرکت —' },
          { key: 'type', label: 'نوع', type: 'select', value: 'main', options: [{ value: 'main', label: 'اصلی' }, { value: 'sub', label: 'زیردامنه' }] },
          { key: 'status', label: 'وضعیت', type: 'select', value: 'pending', options: [{ value: 'verified', label: 'تأییدشده' }, { value: 'pending', label: 'در انتظار تأیید' }], hint: 'تأیید واقعی دامنه نیازمند رکورد DNS و فرایند سمت سرور است؛ اینجا فقط وضعیت ثبت می‌شود.' }
        ];
      },
      columns: function (item) {
        return [
          { label: 'دامنه', html: '<b class="ltr-embed">' + ui.esc(item.domain) + '</b>' },
          { label: 'شرکت', html: ui.esc(companyName(item.companyId)) },
          { label: 'نوع', html: item.type === 'main' ? 'اصلی' : 'زیردامنه' },
          { label: 'وضعیت', html: '<span class="badge ' + (STATUS_LABELS[item.status] || STATUS_LABELS.pending).badge + '">' + (STATUS_LABELS[item.status] || { fa: item.status }).fa + '</span>' }
        ];
      }
    },
    users: {
      title: 'کاربران', sub: 'اعضا، نقش‌ها و وضعیت', icon: 'user', singular: 'کاربر',
      fields: function () {
        return [
          { key: 'name', label: 'نام', required: true },
          { key: 'email', label: 'ایمیل', required: true, type: 'email', dirLtr: true },
          { key: 'role', label: 'نقش', type: 'select', value: 'writer', options: [{ value: 'manager', label: 'مدیر' }, { value: 'editor', label: 'ویراستار' }, { value: 'writer', label: 'نویسنده' }, { value: 'viewer', label: 'بیننده' }] },
          { key: 'teamId', label: 'تیم', type: 'select', options: teamOptions(), placeholder: '— بدون تیم —' },
          { key: 'status', label: 'وضعیت', type: 'select', value: 'active', options: [{ value: 'active', label: 'فعال' }, { value: 'invited', label: 'دعوت‌شده' }, { value: 'inactive', label: 'غیرفعال' }], hint: 'دعوت واقعی با ارسال ایمیل، کاری سمت سرور است.' }
        ];
      },
      columns: function (item) {
        return [
          { label: 'نام', html: '<b>' + ui.esc(item.name) + '</b>' },
          { label: 'ایمیل', html: '<span class="ltr-embed small">' + ui.esc(item.email || '—') + '</span>' },
          { label: 'نقش', html: ({ manager: 'مدیر', editor: 'ویراستار', writer: 'نویسنده', viewer: 'بیننده' })[item.role] || item.role },
          { label: 'تیم', html: ui.esc(teamName(item.teamId)) },
          { label: 'وضعیت', html: '<span class="badge ' + (STATUS_LABELS[item.status] || STATUS_LABELS.active).badge + '">' + (STATUS_LABELS[item.status] || { fa: item.status }).fa + '</span>' }
        ];
      }
    }
  };

  function crud(module) {
    return {
      render: function (container) {
        var cfg = CONFIGS[module];
        var items = Nova.app.visibleList(module);
        var q = '';

        function rowsHtml() {
          var list = items;
          if (q) {
            var f = U.norm(q);
            list = list.filter(function (it) { return U.norm(JSON.stringify(it)).indexOf(f) > -1; });
          }
          if (!list.length) {
            return '<div class="card">' + ui.emptyState({
              icon: cfg.icon, title: q ? 'نتیجه‌ای پیدا نشد' : 'هنوز ' + cfg.singular + 'ی ثبت نشده',
              desc: q ? 'عبارت دیگری را امتحان کنید.' : 'با دکمهٔ «' + cfg.singular + ' جدید» شروع کنید.',
              action: q ? '' : '<button class="btn btn-primary" data-act="add">' + Nova.icon('plus') + ' ' + cfg.singular + ' جدید</button>'
            }) + '</div>';
          }
          return '<div class="table-wrap"><table class="table"><thead><tr>' +
            cfg.columns(items[0]).map(function (c) { return '<th>' + c.label + '</th>'; }).join('') +
            '<th></th></tr></thead><tbody>' +
            list.map(function (it) {
              return '<tr data-id="' + it.id + '">' +
                cfg.columns(it).map(function (c) { return '<td data-label="' + c.label + '">' + c.html + '</td>'; }).join('') +
                '<td data-label="عملیات"><div class="row-actions">' +
                ui.iconBtn('edit', 'pen', 'ویرایش', 'primary') +
                (it.demo ? '' : ui.iconBtn('dup', 'copy', 'تکثیر')) +
                (it.demo ? '' : ui.iconBtn('del', 'trash', 'حذف', 'danger')) +
                '</div></td></tr>';
            }).join('') + '</tbody></table></div>';
        }

        container.innerHTML =
          '<div class="page-head view-enter row-between">' +
          '<div><h1>' + cfg.title + '</h1><div class="page-sub">' + cfg.sub + '</div></div>' +
          '<button class="btn btn-primary" data-act="add">' + Nova.icon('plus') + ' ' + cfg.singular + ' جدید</button></div>' +
          '<div class="card" style="padding:12px 14px;margin-bottom:14px"><div class="searchbox" style="max-width:340px">' + Nova.icon('search') +
          '<input type="search" id="org-search" placeholder="جست‌وجو…" aria-label="جست‌وجو در ' + cfg.title + '"></div></div>' +
          '<div id="org-list">' + rowsHtml() + '</div>';

        function currentList() { return Nova.app.visibleList(module); }
        function findIt(id) { return Nova.store.getById(module, id); }

        function openForm(existing) {
          var fields = cfg.fields();
          if (existing) fields.forEach(function (f) { if (f.value == null) f.value = existing[f.key] != null ? existing[f.key] : ''; });
          ui.formModal({ title: existing ? 'ویرایش ' + cfg.singular : cfg.singular + ' جدید', submitText: 'ذخیره', fields: fields })
            .then(function (values) {
              if (!values) return;
              var item = existing ? Object.assign({}, existing, values) : Object.assign({ id: U.uid(module.slice(0, 4)), demo: false, createdAt: Date.now() }, values);
              item.updatedAt = Date.now();
              var list = Nova.store.getList(module);
              var idx = -1;
              for (var i = 0; i < list.length; i++) if (list[i].id === item.id) idx = i;
              if (idx > -1) list[idx] = item; else list.push(item);
              var r = Nova.store.saveList(module, list);
              if (!r.ok) { ui.toast('ذخیره انجام نشد؛ فضای مرورگر پر است.', 'error'); return; }
              ui.toast(existing ? cfg.singular + ' به‌روزرسانی شد.' : cfg.singular + ' جدید ثبت شد.', 'success');
              Nova.router.render();
            });
        }

        ui.bind(container, 'click', '[data-act="add"]', function () { openForm(null); });

        var search = container.querySelector('#org-search');
        search && search.addEventListener('input', U.debounce(function () {
          q = search.value.trim();
          container.querySelector('#org-list').innerHTML = rowsHtml();
        }, 180));

        ui.bind(container, 'click', '[data-action]', function (e, btn) {
          var tr = btn.closest('tr');
          if (!tr) return;
          var it = findIt(tr.getAttribute('data-id'));
          if (!it) return;
          var act = btn.getAttribute('data-action');
          if (act === 'edit') {
            if (it.demo) {
              ui.toast('رکورد نمونه دست‌نخورده می‌ماند؛ یک کپی ساخته می‌شود.', 'info');
              var copy = JSON.parse(JSON.stringify(it));
              copy.id = U.uid(module.slice(0, 4)); copy.demo = false; copy.name = (copy.name || copy.domain || copy.email || 'کپی') + ' (کپی من)';
              Nova.store.insert(module, copy);
              openForm(copy);
            } else openForm(it);
          } else if (act === 'dup') {
            var c2 = JSON.parse(JSON.stringify(it));
            c2.id = U.uid(module.slice(0, 4)); c2.demo = false;
            if (c2.name) c2.name += ' (کپی)'; else if (c2.domain) c2.domain = 'copy.' + c2.domain; else if (c2.email) c2.email = 'copy+' + c2.email;
            Nova.store.insert(module, c2);
            ui.toast('کپی ساخته شد.', 'success');
            Nova.router.render();
          } else if (act === 'del') {
            ui.confirmDialog({
              title: 'حذف ' + cfg.singular,
              message: '«' + ui.esc(it.name || it.domain || it.email || '') + '» حذف می‌شود. این عمل بازگشت‌پذیر نیست.',
              confirmText: 'حذف کن', danger: true
            }).then(function (yes) {
              if (!yes) return;
              Nova.store.removeById(module, it.id);
              ui.toast(cfg.singular + ' حذف شد.', 'success');
              Nova.router.render();
            });
          }
        });
      }
    };
  }

  return {
    companies: crud('companies'),
    teams: crud('teams'),
    domains: crud('domains'),
    users: crud('users')
  };
})();
