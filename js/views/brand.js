/* ============================================================
   نوا — هویت و لحن برند
   کارت‌های برند + فرم ثبت/ویرایش + حذف با تأیید
   ============================================================ */
window.Nova = window.Nova || {};

Nova.brand = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui, O = Nova.options;

  function toneLabels(tones) {
    return (tones || []).map(function (t) { return O.label(O.tones, t) || t; }).join('، ');
  }

  function brandCard(b) {
    var c = b.colors || [];
    return '<div class="card brand-card" data-id="' + b.id + '">' +
      '<div class="brand-swatch" style="background:' + ui.esc(c[0] || 'var(--primary)') + '">' + ui.esc((b.name || 'ب').slice(0, 1)) + '</div>' +
      '<div class="grow"><div class="row">' +
      '<div class="card-title" style="font-size:var(--fs-body)">' + ui.esc(b.name) + '</div>' + (b.demo ? ui.badge('badge-demo', 'نمونه') : '') +
      '</div>' +
      '<div class="small muted">' + ui.esc(b.field || '') + '</div>' +
      '<div class="caption" style="margin-top:6px"><b>مخاطب:</b> ' + ui.esc(b.audience || '—') + '</div>' +
      '<div class="caption"><b>لحن:</b> ' + ui.esc(toneLabels(b.tones) || '—') + '</div>' +
      '<div class="caption"><b>ارزش‌ها:</b> ' + ui.esc((b.values || []).join('، ') || '—') + '</div>' +
      '<div class="row" style="margin-top:8px">' + c.map(function (hex) { return '<span class="color-dot" style="background:' + ui.esc(hex) + '" title="' + ui.esc(hex) + '"></span>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="row-actions" style="align-self:flex-start">' +
      ui.iconBtn('edit', 'pen', 'ویرایش', 'primary') +
      (b.demo ? '' : ui.iconBtn('dup', 'copy', 'تکثیر')) +
      (b.demo ? '' : ui.iconBtn('del', 'trash', 'حذف', 'danger')) +
      '</div></div>';
  }

  function openForm(existing) {
    var b = existing || {};
    return ui.formModal({
      title: existing ? 'ویرایش برند' : 'برند جدید',
      submitText: 'ذخیره برند',
      size: 'lg',
      fields: [
        { key: 'name', label: 'نام برند', required: true, value: b.name || '', full: true },
        { key: 'field', label: 'حوزهٔ فعالیت', value: b.field || '', placeholder: 'مثلاً: کافه و رستوران' },
        { key: 'tonesText', label: 'لحن (با کاما جدا کنید)', value: (b.tones || []).map(function (t) { return O.label(O.tones, t) || t; }).join('، '), placeholder: 'صمیمی، انگیزشی' },
        { key: 'audience', label: 'مخاطب هدف', type: 'textarea', value: b.audience || '', full: true },
        { key: 'valuesText', label: 'ارزش‌ها (با کاما)', value: (b.values || []).join('، '), full: true },
        { key: 'colorsText', label: 'رنگ‌ها (کد هگز با کاما)', value: (b.colors || []).join('، '), placeholder: '#6c42d8, #221d40', dirLtr: true, full: true, validate: function (v) {
          var parts = String(v).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
          for (var i = 0; i < parts.length; i++) { if (!/^#[0-9a-f]{3,8}$/i.test(parts[i])) return 'هر رنگ باید کد هگز معتبر باشد؛ مثل #6c42d8'; }
          return '';
        } },
        { key: 'preferredWords', label: 'واژگان ترجیحی', type: 'textarea', value: b.preferredWords || '', full: true, hint: 'واژه‌هایی که لحن برند با آن‌ها گره خورده است.' },
        { key: 'forbidden', label: 'ادعاهای ممنوع و واژگان ممنوع', type: 'textarea', value: b.forbidden || '', full: true, hint: 'مثلاً: «بهترین جهان»، ادعای درمانی، تخفیف دائمی.' }
      ]
    }).then(function (values) {
      if (!values) return;
      var item = {
        id: b.id || U.uid('brand'),
        demo: false,
        name: values.name.trim(),
        field: values.field.trim(),
        audience: values.audience.trim(),
        tones: values.tonesText.split(/[،,]/).map(function (x) { return x.trim(); }).filter(Boolean),
        values: values.valuesText.split(/[،,]/).map(function (x) { return x.trim(); }).filter(Boolean),
        colors: values.colorsText.split(/[،,]/).map(function (x) { return x.trim(); }).filter(Boolean),
        preferredWords: values.preferredWords.trim(),
        forbidden: values.forbidden.trim(),
        updatedAt: Date.now()
      };
      var list = Nova.store.getList('brands');
      var idx = -1;
      for (var i = 0; i < list.length; i++) if (list[i].id === item.id) idx = i;
      if (idx > -1) list[idx] = item; else list.push(item);
      var r = Nova.store.saveList('brands', list);
      if (!r.ok) { ui.toast('ذخیره انجام نشد؛ فضای مرورگر پر است.', 'error'); return; }
      ui.toast(existing ? 'برند به‌روزرسانی شد.' : 'برند جدید ثبت شد.', 'success');
      Nova.router.render();
    });
  }

  function render(container) {
    var brands = Nova.app.visibleList('brands');
    container.innerHTML =
      '<div class="page-head view-enter row-between">' +
      '<div><h1>هویت و لحن برند</h1><div class="page-sub">لحن، ارزش‌ها و واژگان مرجع برای همهٔ ابزارهای تولید</div></div>' +
      '<button class="btn btn-primary" data-act="add">' + Nova.icon('plus') + ' برند جدید</button></div>' +
      (brands.length
        ? '<div class="stack">' + brands.map(brandCard).join('') + '</div>'
        : '<div class="card">' + ui.emptyState({
          icon: 'palette', title: 'هویت برندی ثبت نشده',
          desc: 'با ثبت هویت برند، لحن و واژگان آن به دستیار مقاله و ابزارهای متنی پیشنهاد می‌شود.',
          action: '<button class="btn btn-primary" data-act="add">' + Nova.icon('plus') + ' ثبت هویت برند</button>'
        }) + '</div>');

    ui.bind(container, 'click', '[data-action]', function (e, btn) {
      var card = btn.closest('.brand-card');
      if (!card) return;
      var b = Nova.store.getById('brands', card.getAttribute('data-id'));
      if (!b) return;
      var act = btn.getAttribute('data-action');
      if (act === 'edit') {
        if (b.demo) {
          ui.toast('برند نمونه دست‌نخورده می‌ماند؛ یک کپی ساخته می‌شود تا ویرایش کنید.', 'info');
          var copy = JSON.parse(JSON.stringify(b));
          copy.id = U.uid('brand'); copy.demo = false; copy.name += ' (کپی من)';
          Nova.store.insert('brands', copy);
          openForm(copy);
        } else openForm(b);
      } else if (act === 'dup') {
        var c2 = JSON.parse(JSON.stringify(b));
        c2.id = U.uid('brand'); c2.demo = false; c2.name += ' (کپی)';
        Nova.store.insert('brands', c2);
        ui.toast('کپی ساخته شد.', 'success');
        Nova.router.render();
      } else if (act === 'del') {
        ui.confirmDialog({
          title: 'حذف برند',
          message: 'هویت برند «' + ui.esc(b.name) + '» حذف می‌شود. مقاله‌ها و پرامپت‌های قبلی بدون تغییر می‌مانند.',
          confirmText: 'حذف کن', danger: true
        }).then(function (yes) {
          if (!yes) return;
          Nova.store.removeById('brands', b.id);
          ui.toast('برند حذف شد.', 'success');
          Nova.router.render();
        });
      }
    });
    ui.bind(container, 'click', '[data-act="add"]', function () { openForm(null); });
  }

  return { render: render };
})();
