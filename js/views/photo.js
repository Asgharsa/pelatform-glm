/* ============================================================
   نوا — استودیوی عکس
   فرم بخش‌بندی‌شده، پرامپت‌ساز از انتخاب‌ها، قالب‌های آماده،
   تصویر مرجع با اعتبارسنجی، خروجی قابل کپی/دانلود/ذخیره.
   ============================================================ */
window.Nova = window.Nova || {};

Nova.photoStudio = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui, B = Nova.builders, O = Nova.options;
  var state = null;
  var refUrl = null; /* پیش‌نمایش فقط برای همین نشست */
  var refMeta = null;
  var root = null;

  function defaultState() {
    return {
      subject: '', use: 'post', scene: '',
      style: 'realistic', quality: 'high', ratio: '1:1', w: 1080, h: 1080,
      lighting: 'soft', palette: 'warm', background: 'studio', composition: 'centered',
      angle: 'eye', lens: '50', textSpace: 'no', textPos: 'bottom',
      negative: '', freedom: 50, promptLang: 'fa', outputFormat: 'jpeg'
    };
  }

  function sel(name, items, val, placeholder) {
    return '<select class="select" data-field="' + name + '">' +
      (placeholder ? '<option value="">' + placeholder + '</option>' : '') +
      items.map(function (x) { return '<option value="' + x.id + '"' + (x.id === val ? ' selected' : '') + '>' + ui.esc(x.fa) + '</option>'; }).join('') +
      '</select>';
  }

  function section(icon, accent, title, sub, inner) {
    return '<div class="card studio-section"><div class="card-head"><div class="row">' +
      '<div class="stat-tile ' + accent + '" style="width:36px;height:36px;border-radius:10px">' + Nova.icon(icon) + '</div>' +
      '<div><div class="card-title" style="font-size:var(--fs-small)">' + title + '</div><div class="card-sub">' + sub + '</div></div>' +
      '</div></div>' + inner + '</div>';
  }

  /* ---------- پرامپت ---------- */

  function renderPrompt() {
    var out = root.querySelector('#photo-prompt');
    if (!out) return;
    var p = B.buildPhotoPrompt(state);
    if (out.dataset.touched !== '1') {
      out.value = p;
      out.dataset.rtl = state.promptLang === 'en' ? '0' : '1';
    }
    var dims = B.ratioLabel(state);
    root.querySelector('#photo-meta').innerHTML =
      'نسبت: ' + (dims || '—') + ' · آزادی خلاقیت: ' + B.creativeWord(state.freedom).fa + ' · زبان: ' + (state.promptLang === 'en' ? 'انگلیسی' : 'فارسی');
  }

  /* ---------- رندر ---------- */

  function render(container) {
    root = container;
    if (Nova.app.pending && Nova.app.pending.type === 'photo') {
      state = Object.assign(defaultState(), Nova.app.pending.state);
      Nova.app.pending = null;
      ui.toast('تنظیمات ذخیره‌شده در فرم بارگذاری شد.', 'info');
    } else if (!state || Nova.studioReset) {
      state = defaultState();
      Nova.studioReset = false;
    }
    refUrl = null; refMeta = null;

    var templates = O.photoTemplates.map(function (t) {
      return '<button type="button" class="opt-card" data-tpl="' + t.id + '"><span class="tick">' + Nova.icon('check') + '</span>' + Nova.icon(t.icon) + '<span>' + ui.esc(t.name) + '</span><span class="caption">' + ui.esc(t.desc) + '</span></button>';
    }).join('');

    var ratios = O.ratios.map(function (r) {
      if (r.id === 'custom') {
        return '<button type="button" class="ratio-card" data-ratio="custom"><div class="ratio-shape" style="width:14px;height:14px"></div><span class="label">سفارشی</span></button>';
      }
      var scale = 18 / Math.max(r.w, r.h);
      var w = Math.round(r.w * scale), h = Math.round(r.h * scale);
      return '<button type="button" class="ratio-card" data-ratio="' + r.id + '"><div class="ratio-shape" style="width:' + w + 'px;height:' + h + 'px"></div><span class="label">' + r.id + '</span></button>';
    }).join('');

    container.innerHTML =
      '<div class="page-head view-enter row-between">' +
      '<div><h1>استودیوی عکس</h1><div class="page-sub">پرامپت دقیق تصویر بسازید — بدون ادعای تولید واقعی</div></div>' +
      '</div>' +
      ui.banner('info', 'خروجی این استودیو <b>پرامپت قالبی</b> است؛ تولید واقعی تصویر پس از اتصال سرویس انجام می‌شود و همیشه با برچسب مشخص است.') +

      '<div class="studio-layout">' +
      '<div>' +

      section('zap', '', 'قالب‌های آماده', 'شروع سریع با تنظیمات پیشنهادی', '<div class="opt-cards">' + templates + '</div>') +

      section('target', '', 'موضوع و کاربرد', 'چه چیزی و برای چه کاری؟',
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">موضوع</span><input class="input" data-field="subject" placeholder="مثلاً: فنجان قهوه روی میز چوبی"></div>' +
        '<div class="field"><span class="field-label">کاربرد</span>' + sel('use', O.photoUses, state.use) + '</div>' +
        '<div class="field full"><span class="field-label">شرح صحنه</span><textarea class="textarea" data-field="scene" placeholder="جزئیات صحنه، عناصر، حس و حال…"></textarea></div>' +
        '</div>') +

      section('palette', '', 'سبک و ظاهر', 'هویت بصری تصویر',
        '<div class="field" style="margin-bottom:12px"><span class="field-label">سبک</span>' +
        ui.optCards('style', O.photoStyles.map(function (s) { return { id: s.id, label: s.fa, icon: s.icon }; }), state.style) + '</div>' +
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">کیفیت هدف</span>' + sel('quality', O.quality, state.quality) + '</div>' +
        '<div class="field"><span class="field-label">نورپردازی</span>' + sel('lighting', O.lighting, state.lighting) + '</div>' +
        '<div class="field"><span class="field-label">پالت رنگ</span>' + sel('palette', O.palettes, state.palette) + '</div>' +
        '<div class="field"><span class="field-label">پس‌زمینه</span>' + sel('background', O.backgrounds, state.background) + '</div>' +
        '<div class="field"><span class="field-label">ترکیب‌بندی</span>' + sel('composition', O.compositions, state.composition) + '</div>' +
        '</div>') +

      section('camera', '', 'دوربین', 'زاویهٔ دید و لنز',
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">زاویهٔ دوربین</span>' + sel('angle', O.angles, state.angle) + '</div>' +
        '<div class="field"><span class="field-label">لنز</span>' + sel('lens', O.lenses, state.lens) + '</div>' +
        '</div>') +

      section('typeText', '', 'نسبت تصویر و فضای متن', 'ابعاد و چیدمان',
        '<div class="field" style="margin-bottom:12px"><span class="field-label">نسبت تصویر</span><div class="ratio-cards">' + ratios + '</div>' +
        '<div class="row" id="custom-dims" style="margin-top:9px;display:' + (state.ratio === 'custom' ? 'flex' : 'none') + '">' +
        '<input class="input" type="number" data-field="w" style="max-width:110px" aria-label="عرض پیکسل" value="' + state.w + '">' +
        '<span class="faint">×</span>' +
        '<input class="input" type="number" data-field="h" style="max-width:110px" aria-label="ارتفاع پیکسل" value="' + state.h + '">' +
        '<span class="caption">پیکسل — بین ۶۴ تا ۴۰۹۶</span>' +
        '<span class="field-error" id="dims-error" role="alert"></span></div></div>' +
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">فضای متن</span>' + sel('textSpace', O.textSpace, state.textSpace) + '</div>' +
        '<div class="field"><span class="field-label">جای متن</span>' + sel('textPos', O.textPositions, state.textPos) + '</div>' +
        '</div>') +

      section('image', '', 'تصویر مرجع', 'اختیاری — برای هدایت سبک یا سوژه',
        '<div id="ref-zone">' + refZoneHtml() + '</div>' +
        '<div class="field" style="margin-top:10px"><span class="field-label">نقش تصویر مرجع</span>' +
        sel('refRole', O.refRoles, '', '— بدون نقش —') + '</div>' +
        '<div class="field-hint" style="margin-top:6px">پیش‌نمایش فقط محلی است؛ برای سرویس واقعی، بارگذاری سمت سرور لازم است و هیچ فایلی از این مرورگر ارسال نمی‌شود.</div>') +

      section('shield', '', 'کنترل و خروجی', 'پرامپت منفی، آزادی خلاقیت و زبان',
        '<div class="studio-grid">' +
        '<div class="field full"><span class="field-label">پرامپت منفی</span><textarea class="textarea" data-field="negative" placeholder="چیزهایی که نباید در تصویر باشد؛ مثلاً: متن، واترمارک، دست"></textarea></div>' +
        '<div class="field full"><span class="field-label">میزان آزادی خلاقیت</span>' +
        '<input type="range" class="range" min="0" max="100" step="5" data-field="freedom" value="' + state.freedom + '">' +
        '<div class="range-labels"><span>وفادار به ورودی</span><span>آزاد و خلاق</span></div></div>' +
        '<div class="field"><span class="field-label">زبان پرامپت</span>' +
        sel('promptLang', [{ id: 'fa', fa: 'فارسی' }, { id: 'en', fa: 'انگلیسی' }], state.promptLang) + '</div>' +
        '<div class="field"><span class="field-label">فرمت خروجی هدف</span>' + sel('outputFormat', O.imgFormats, state.outputFormat) + '</div>' +
        '</div>' +
        '<div id="lang-warn"></div>') +

      '</div>' +

      '<div class="prompt-card">' +
      '<div class="card">' +
      '<div class="card-head"><div class="card-title" style="font-size:var(--fs-small)">پرامپت نهایی</div>' + ui.badge('badge-template', 'قالبی') + '</div>' +
      '<textarea class="textarea prompt-out" id="photo-prompt" rows="7"></textarea>' +
      '<div class="caption" id="photo-meta" style="margin:8px 0 10px"></div>' +
      '<div class="row">' +
      '<button class="btn btn-primary btn-sm" data-act="copy">' + Nova.icon('copy') + ' کپی</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="download">' + Nova.icon('download') + ' دانلود</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="save">' + Nova.icon('save') + ' ذخیره در کتابخانه</button>' +
      '<button class="btn btn-plain btn-sm" data-act="rebuild">' + Nova.icon('refresh') + ' بازسازی</button>' +
      '</div>' +
      '<div class="field-hint" style="margin-top:8px">می‌توانید متن پرامپت را مستقیم ویرایش کنید؛ با «بازسازی» از روی فرم دوباره ساخته می‌شود.</div>' +
      '</div></div>' +
      '</div>' +

      '<div class="studio-sticky-bar">' +
      '<button class="btn btn-primary grow" data-act="copy">' + Nova.icon('copy') + ' کپی پرامپت</button>' +
      '<button class="btn btn-ghost" data-act="save">' + Nova.icon('save') + ' ذخیره</button>' +
      '</div>';

    setFieldValues(container, state);
    ui.initSelectors(container);
    renderPrompt();
    renderLangWarn();

    /* --- رویدادها --- */
    container.addEventListener('input', U.debounce(function () {
      readForm();
      renderPrompt();
      renderLangWarn();
    }, 250));
    container.addEventListener('formchange', function () {
      readForm();
      renderPrompt();
      renderLangWarn();
      /* نمایش ابعاد سفارشی */
      var cd = root.querySelector('#custom-dims');
      if (cd) cd.style.display = state.ratio === 'custom' ? 'flex' : 'none';
      ui.qsa('.ratio-card', root).forEach(function (c) {
        c.classList.toggle('on', c.getAttribute('data-ratio') === state.ratio);
      });
    });

    ui.bind(container, 'click', '.ratio-card', function (e, card) {
      state.ratio = card.getAttribute('data-ratio');
      ui.qsa('.ratio-card', root).forEach(function (c) {
        c.classList.toggle('on', c === card);
      });
      var cd = root.querySelector('#custom-dims');
      if (cd) cd.style.display = state.ratio === 'custom' ? 'flex' : 'none';
      renderPrompt();
    });

    ui.bind(container, 'click', '[data-tpl]', function (e, card) {
      var t = O.byId(O.photoTemplates, card.getAttribute('data-tpl'));
      if (!t) return;
      Object.assign(state, t.patch);
      setFieldValues(container, state);
      ui.qsa('[data-tpl]', root).forEach(function (c) { c.classList.toggle('on', c === card); });
      renderPrompt();
      var cd = root.querySelector('#custom-dims');
      if (cd) cd.style.display = state.ratio === 'custom' ? 'flex' : 'none';
      ui.qsa('.ratio-card', root).forEach(function (c) {
        c.classList.toggle('on', c.getAttribute('data-ratio') === state.ratio);
      });
      ui.toast('قالب «' + t.name + '» اعمال شد.', 'success');
    });

    ui.bind(container, 'click', '[data-act="ref-remove"]', function () {
      if (refUrl) { URL.revokeObjectURL(refUrl); refUrl = null; refMeta = null; }
      var zone = root.querySelector('#ref-zone');
      if (zone) zone.innerHTML = refZoneHtml();
    });

    ui.bind(container, 'change', '#ref-file', function (e, input) {
      var f = input.files && input.files[0];
      if (!f) return;
      var check = B.validateRefFile(f);
      if (!check.ok) {
        ui.toast(check.error, 'error');
        input.value = '';
        return;
      }
      if (refUrl) URL.revokeObjectURL(refUrl);
      refUrl = URL.createObjectURL(f);
      refMeta = { name: f.name, size: U.formatBytes(f.size) };
      var zone = root.querySelector('#ref-zone');
      zone.innerHTML = refZoneHtml();
      input.value = '';
      ui.toast('تصویر مرجع به‌صورت محلی پیش‌نمایش شد.', 'success');
    });

    ui.bind(container, 'click', '[data-act]', function (e, btn) {
      var act = btn.getAttribute('data-act');
      readForm();
      var p = root.querySelector('#photo-prompt').value;
      if (act === 'copy') {
        U.copyText(p, function (ok) { ui.toast(ok ? 'پرامپت کپی شد.' : 'کپی انجام نشد؛ متن را دستی انتخاب کنید.', ok ? 'success' : 'error'); });
      } else if (act === 'download') {
        U.download('nova-photo-prompt.txt', p, 'text/plain');
        ui.toast('فایل پرامپت دانلود شد.', 'success');
      } else if (act === 'rebuild') {
        var out = root.querySelector('#photo-prompt');
        out.dataset.touched = '0';
        renderPrompt();
        ui.toast('پرامپت از روی فرم بازسازی شد.', 'info');
      } else if (act === 'save') {
        saveBrief();
      }
    });

    /* ویرایش دستی پرامپت */
    var out = root.querySelector('#photo-prompt');
    out.addEventListener('input', function () { out.dataset.touched = '1'; });
  }

  function refZoneHtml() {
    if (refUrl) {
      return '<div class="ref-preview"><img src="' + refUrl + '" alt="پیش‌نمایش تصویر مرجع">' +
        '<button type="button" class="ref-remove" data-act="ref-remove" aria-label="حذف تصویر مرجع">' + Nova.icon('x') + '</button>' +
        '<div class="ref-meta">' + ui.esc(refMeta.name) + ' · ' + ui.esc(refMeta.size) + '</div></div>';
    }
    return '<label class="ref-upload" for="ref-file">' + Nova.icon('upload') +
      '<div>انتخاب تصویر مرجع</div><div class="caption">PNG، JPEG، WebP — حداکثر ۸ مگابایت</div></label>' +
      '<input type="file" id="ref-file" accept="image/png,image/jpeg,image/webp,image/gif" class="visually-hidden">';
  }

  function readForm() {
    var vals = ui.collectForm(root);
    Object.keys(vals).forEach(function (k) {
      if (k in state) state[k] = vals[k];
    });
    var fe = root.querySelector('#dims-error');
    if (fe) fe.textContent = '';
  }

  function setFieldValues(container, st) {
    ui.qsa('[data-field]', container).forEach(function (el) {
      var k = el.getAttribute('data-field');
      if (k in st && st[k] != null) el.value = st[k];
    });
    ui.qsa('.opt-cards[data-field]', container).forEach(function (g) {
      var k = g.getAttribute('data-field');
      ui.qsa('.opt-card', g).forEach(function (c) {
        c.classList.toggle('on', c.getAttribute('data-value') === st[k]);
      });
    });
    ui.qsa('.ratio-card', container).forEach(function (c) {
      c.classList.toggle('on', c.getAttribute('data-ratio') === st.ratio);
    });
  }

  function renderLangWarn() {
    var w = root.querySelector('#lang-warn');
    if (!w) return;
    w.innerHTML = state.promptLang === 'en'
      ? ui.banner('warn', '<b>محدودیت ترجمه:</b> بخش‌های ساختاری پرامپت به انگلیسی ساخته می‌شوند، اما «موضوع» و «شرح صحنه» که خودتان فارسی نوشته‌اید عیناً و بدون ترجمه در پرامپت می‌مانند. برای بهترین نتیجه، این دو فیلد را خودتان انگلیسی بنویسید.')
      : '';
  }

  function saveBrief() {
    if (!String(state.subject || '').trim() && !String(state.scene || '').trim()) {
      ui.toast('برای ذخیره، دست‌کم موضوع یا شرح صحنه را بنویسید.', 'warn');
      return;
    }
    var item = {
      id: U.uid('ph'), demo: false,
      title: String(state.subject || 'پرامپت عکس').slice(0, 70),
      state: JSON.parse(JSON.stringify(state)),
      prompt: root.querySelector('#photo-prompt').value,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    var r = Nova.store.insert('photoBriefs', item);
    if (!r.result.ok) {
      ui.toast('ذخیره انجام نشد؛ فضای ذخیره‌سازی مرورگر پر است.', 'error');
      return;
    }
    ui.toast('پرامپت در کتابخانه ذخیره شد.', 'success');
  }

  return { render: render };
})();
