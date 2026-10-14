/* ============================================================
   نوا — ابزارهای متنی: کپشن، ایمیل، توضیح محصول، متن تبلیغاتی
   خروجی: بریف قالبی با برچسب صریح (نه متن تولیدشده)
   ============================================================ */
window.Nova = window.Nova || {};

Nova.textTools = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui, B = Nova.builders, O = Nova.options;

  var KINDS = {
    caption: { title: 'کپشن شبکهٔ اجتماعی', icon: 'hash' },
    email: { title: 'ایمیل', icon: 'mail' },
    product: { title: 'توضیح محصول', icon: 'briefcase' },
    ad: { title: 'متن تبلیغاتی', icon: 'megaphone' }
  };

  function sel(name, items, val, placeholder) {
    return '<select class="select" data-field="' + name + '">' +
      (placeholder ? '<option value="">' + placeholder + '</option>' : '') +
      items.map(function (x) { return '<option value="' + x.id + '"' + (x.id === val ? ' selected' : '') + '>' + ui.esc(x.fa) + '</option>'; }).join('') +
      '</select>';
  }

  function fieldsHtml(kind, st) {
    if (kind === 'caption') {
      return '<div class="grid grid-2">' +
        '<div class="field"><span class="field-label">پلتفرم</span>' + sel('platform', O.captionPlatforms, st.platform) + '</div>' +
        '<div class="field"><span class="field-label">لحن</span>' + sel('tone', O.tones, st.tone) + '</div>' +
        '<div class="field"><span class="field-label">هدف</span>' + sel('goal', O.contentGoals, st.goal) + '</div>' +
        '<div class="field"><span class="field-label">دعوت به اقدام</span>' + sel('cta', O.ctaTypes, st.cta, '— بدون —') + '</div>' +
        '<div class="field full"><span class="field-label">موضوع کپشن</span><input class="input" data-field="subject" placeholder="مثلاً: معرفی دمنوش پاییزی"></div>' +
        '<div class="field full"><span class="field-label">حجم و هشتگ‌ها</span><input class="input" data-field="lengthHint" placeholder="مثلاً: ۲ تا ۳ خط + ۳ هشتگ"></div>' +
        '<div class="field full"><span class="field-label">هشتگ‌های پیشنهادی</span><input class="input" data-field="hashtags" placeholder="#برند #محصول"></div>' +
        '<div class="field full"><span class="field-label">نکات</span><textarea class="textarea" data-field="notes" placeholder="هر نکته‌ای که باید در متن رعایت شود"></textarea></div>' +
        '</div>';
    }
    if (kind === 'email') {
      return '<div class="grid grid-2">' +
        '<div class="field"><span class="field-label">نوع ایمیل</span>' + sel('kind', O.emailKinds, st.kind) + '</div>' +
        '<div class="field"><span class="field-label">گیرنده</span>' + sel('audience', O.audiences, st.audience) + '</div>' +
        '<div class="field"><span class="field-label">لحن</span>' + sel('tone', O.tones, st.tone) + '</div>' +
        '<div class="field"><span class="field-label">دعوت به اقدام</span>' + sel('cta', O.ctaTypes, st.cta, '— بدون —') + '</div>' +
        '<div class="field full"><span class="field-label">موضوع ایمیل</span><input class="input" data-field="subject" placeholder="مثلاً: دعوت به رویداد پاییزی"></div>' +
        '<div class="field full"><span class="field-label">پیام اصلی</span><textarea class="textarea" data-field="message" placeholder="پیام کلیدی ایمیل در دو سه خط"></textarea></div>' +
        '<div class="field full"><span class="field-label">نکات</span><textarea class="textarea" data-field="notes"></textarea></div>' +
        '</div>';
    }
    if (kind === 'product') {
      return '<div class="grid grid-2">' +
        '<div class="field"><span class="field-label">مخاطب</span>' + sel('audience', O.audiences, st.audience) + '</div>' +
        '<div class="field"><span class="field-label">لحن</span>' + sel('tone', O.tones, st.tone) + '</div>' +
        '<div class="field full"><span class="field-label">نام محصول</span><input class="input" data-field="name" placeholder="مثلاً: دمنوش زعفران و بهارنارنج"></div>' +
        '<div class="field full"><span class="field-label">ویژگی‌های کلیدی</span><textarea class="textarea" data-field="features" placeholder="هر خط یک ویژگی"></textarea></div>' +
        '<div class="field full"><span class="field-label">مزیت رقابتی</span><textarea class="textarea" data-field="advantage" placeholder="چرا این محصول و نه جایگزین‌ها؟"></textarea></div>' +
        '<div class="field full"><span class="field-label">نکات</span><textarea class="textarea" data-field="notes"></textarea></div>' +
        '</div>';
    }
    /* ad */
    return '<div class="grid grid-2">' +
      '<div class="field"><span class="field-label">نوع تبلیغ</span>' + sel('kind', O.adKinds, st.kind) + '</div>' +
      '<div class="field"><span class="field-label">مخاطب</span>' + sel('audience', O.audiences, st.audience) + '</div>' +
      '<div class="field"><span class="field-label">لحن</span>' + sel('tone', O.tones, st.tone) + '</div>' +
      '<div class="field"><span class="field-label">دعوت به اقدام</span>' + sel('cta', O.ctaTypes, st.cta, '— بدون —') + '</div>' +
      '<div class="field full"><span class="field-label">محصول / خدمت</span><input class="input" data-field="subject" placeholder="چه چیزی تبلیغ می‌شود؟"></div>' +
      '<div class="field full"><span class="field-label">وعدهٔ اصلی</span><textarea class="textarea" data-field="promise" placeholder="مهم‌ترین وعدهٔ تبلیغ — بدون اغراق"></textarea></div>' +
      '<div class="field full"><span class="field-label">محدودیت‌ها</span><textarea class="textarea" data-field="notes" placeholder="مثلاً: بدون ادعای سلامت‌محور"></textarea></div>' +
      '</div>';
  }

  function defaultState(kind) {
    var base = { tone: 'friendly', cta: '', notes: '' };
    if (kind === 'caption') return Object.assign(base, { platform: 'instagram', goal: 'sales', subject: '', lengthHint: '', hashtags: '' });
    if (kind === 'email') return Object.assign(base, { kind: 'newsletter', audience: 'general', subject: '', message: '' });
    if (kind === 'product') return Object.assign(base, { audience: 'general', name: '', features: '', advantage: '' });
    return Object.assign(base, { kind: 'social', audience: 'general', subject: '', promise: '' });
  }

  function render(container) {
    /* kind از کوئری مسیر */
    var q = (location.hash.split('?')[1] || '');
    var params = {};
    q.split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) params[kv[0]] = decodeURIComponent(kv[1] || ''); });
    var kind = KINDS[params.tool] ? params.tool : 'caption';
    var st = defaultState(kind);
    if (Nova.app.pending && Nova.app.pending.type === 'text' && KINDS[Nova.app.pending.tool]) {
      kind = Nova.app.pending.tool;
      st = Object.assign(defaultState(kind), Nova.app.pending.state || {});
      Nova.app.pending = null;
    }

    function tabsHtml() {
      return Object.keys(KINDS).map(function (k) {
        return '<button class="tab' + (k === kind ? ' on' : '') + '" data-kind="' + k + '">' + KINDS[k].title + '</button>';
      }).join('');
    }

    function paint() {
      container.innerHTML =
        '<div class="page-head view-enter"><h1>ابزارهای متنی</h1>' +
        '<div class="page-sub">بریف آمادهٔ تولید بسازید — خروجی، قالبی است نه متن نهایی</div></div>' +
        ui.banner('info', 'این ابزارها <b>بریف قالبی</b> تولید می‌کنند: مشخصات، لحن و چارچوب متن. خودِ متن پس از اتصال سرویس تولید می‌شود و با برچسب «هوش مصنوعی» از این خروجی جدا خواهد شد.') +
        '<div class="tabs">' + tabsHtml() + '</div>' +
        '<div class="studio-layout"><div class="card">' +
        '<div class="card-head"><div class="row"><div class="stat-tile text" style="width:36px;height:36px;border-radius:10px">' + Nova.icon(KINDS[kind].icon) + '</div>' +
        '<div class="card-title" style="font-size:var(--fs-small)">' + KINDS[kind].title + '</div></div></div>' +
        fieldsHtml(kind, st) +
        '<div class="row" style="margin-top:14px"><button class="btn btn-primary" data-act="make">' + Nova.icon('wand') + ' ساخت بریف</button></div>' +
        '</div>' +
        '<div class="prompt-card"><div class="card">' +
        '<div class="card-head"><div class="card-title" style="font-size:var(--fs-small)">بریف خروجی</div>' + ui.badge('badge-template', 'قالبی') + '</div>' +
        '<textarea class="textarea prompt-out" id="text-out" data-rtl="1" rows="10" placeholder="با «ساخت بریف» این‌جا پر می‌شود…"></textarea>' +
        '<div class="row" style="margin-top:10px">' +
        '<button class="btn btn-primary btn-sm" data-act="copy">' + Nova.icon('copy') + ' کپی</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="download">' + Nova.icon('download') + ' دانلود</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="save">' + Nova.icon('save') + ' ذخیره در کتابخانه</button>' +
        '</div></div></div></div>';

      ui.qsa('[data-field]', container).forEach(function (el) {
        var k = el.getAttribute('data-field');
        if (k in st && st[k] != null) el.value = st[k];
      });

      ui.bind(container, 'click', '.tab', function (e, btn) {
        kind = btn.getAttribute('data-kind');
        st = defaultState(kind);
        paint();
      });

      ui.bind(container, 'click', '[data-act]', function (e, btn) {
        var act = btn.getAttribute('data-act');
        var out = container.querySelector('#text-out');
        if (act === 'make') {
          var vals = ui.collectForm(container);
          Object.keys(vals).forEach(function (k) { if (k in st) st[k] = vals[k]; });
          out.value = B.buildTextBrief(kind, st);
          out.dataset.touched = '1';
          ui.toast('بریف قالبی ساخته شد.', 'success');
        } else if (act === 'copy') {
          if (!out.value) { ui.toast('اول بریف را بسازید.', 'warn'); return; }
          U.copyText(out.value, function (ok) { ui.toast(ok ? 'کپی شد.' : 'کپی انجام نشد.', ok ? 'success' : 'error'); });
        } else if (act === 'download') {
          if (!out.value) { ui.toast('اول بریف را بسازید.', 'warn'); return; }
          U.download('nova-text-brief.txt', out.value, 'text/plain');
        } else if (act === 'save') {
          if (!out.value) { ui.toast('اول بریف را بسازید.', 'warn'); return; }
          var item = {
            id: U.uid('tx'), demo: false, kind: kind,
            title: (KINDS[kind].title + ' — ' + (st.subject || st.name || st.kind || '')).slice(0, 70),
            state: JSON.parse(JSON.stringify(st)),
            prompt: out.value,
            createdAt: Date.now(), updatedAt: Date.now()
          };
          var r = Nova.store.insert('textBriefs', item);
          if (!r.result.ok) { ui.toast('ذخیره انجام نشد؛ فضای مرورگر پر است.', 'error'); return; }
          ui.toast('بریف در کتابخانه ذخیره شد.', 'success');
        }
      });
    }

    paint();
  }

  return { render: render };
})();
