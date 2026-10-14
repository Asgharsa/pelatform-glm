/* ============================================================
   نوا — مولد هوشمند
   مسیر سریع: انتخاب نوع خروجی → فرم کوتاه → بریف/پرامپت قالبی
   با امکان ادامهٔ کار در استودیوی مربوطه.
   ============================================================ */
window.Nova = window.Nova || {};

Nova.generator = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui, B = Nova.builders, O = Nova.options;

  var TYPES = [
    { id: 'article', label: 'مقاله', icon: 'fileText', accent: 'article' },
    { id: 'photo', label: 'عکس', icon: 'image', accent: 'photo' },
    { id: 'video', label: 'ویدیو', icon: 'video', accent: 'video' },
    { id: 'caption', label: 'کپشن', icon: 'hash', accent: 'text' },
    { id: 'email', label: 'ایمیل', icon: 'mail', accent: 'text' },
    { id: 'product', label: 'توضیح محصول', icon: 'briefcase', accent: 'text' },
    { id: 'ad', label: 'متن تبلیغاتی', icon: 'megaphone', accent: 'text' }
  ];

  var st = { type: 'article', subject: '', tone: 'friendly', audience: 'general', length: 'medium', style: 'realistic', ratio: '1:1', duration: 15 };

  function sel(name, items, val) {
    return '<select class="select" data-field="' + name + '">' +
      items.map(function (x) { return '<option value="' + x.id + '"' + (x.id === val ? ' selected' : '') + '>' + ui.esc(x.fa) + '</option>'; }).join('') +
      '</select>';
  }

  function build() {
    var t = st.type;
    if (t === 'article') {
      return B.buildArticleBrief({
        type: 'guide', lang: 'fa', tone: st.tone, audience: st.audience,
        goal: '', length: st.length, topic: st.subject, points: '', sources: '', forbidden: '', faq: false, cta: ''
      });
    }
    if (t === 'photo') {
      return B.buildPhotoPrompt(Object.assign({
        subject: st.subject, use: 'post', scene: '', style: st.style, quality: 'high',
        ratio: st.ratio, w: 0, h: 0, lighting: '', palette: '', background: '', composition: '',
        angle: '', lens: '', textSpace: 'no', textPos: 'bottom', negative: '', freedom: 50,
        promptLang: 'fa', outputFormat: 'jpeg', refRole: ''
      }));
    }
    if (t === 'video') {
      return B.buildVideoPrompt({
        mode: 'text', subject: st.subject, goal: '', audience: st.audience, idea: '',
        style: st.style, light: '', color: '', ratio: st.ratio, duration: st.duration,
        resolution: '1080p', fps: '30', format: 'mp4', camera: '', moveIntensity: '', transition: '',
        shots: [], music: 'none', sfx: [], voiceover: false, voiceText: '', subtitles: false,
        ctaType: '', ctaText: '', negative: '', keepSubject: true, keepStyle: true, service: '', promptLang: 'fa'
      });
    }
    /* ابزارهای متنی */
    var s = { tone: st.tone, audience: st.audience, subject: st.subject, cta: '', notes: '' };
    if (t === 'caption') Object.assign(s, { platform: 'instagram', goal: '', lengthHint: '', hashtags: '' });
    if (t === 'email') { Object.assign(s, { kind: 'newsletter', message: '' }); delete s.subject; s.subject = st.subject; }
    if (t === 'product') Object.assign(s, { name: st.subject, features: '', advantage: '' });
    if (t === 'ad') Object.assign(s, { kind: 'social', promise: '' });
    return B.buildTextBrief(t, s);
  }

  function studioState() {
    var t = st.type;
    if (t === 'photo') {
      return { type: 'photo', state: { subject: st.subject, style: st.style, ratio: st.ratio } };
    }
    if (t === 'video') {
      return { type: 'video', state: { subject: st.subject, style: st.style, ratio: st.ratio, duration: st.duration } };
    }
    return { type: 'text', tool: t, state: { subject: st.subject, tone: st.tone, audience: st.audience } };
  }

  function render(container) {
    var output = '';

    function formHtml() {
      var f = '<div class="grid grid-2">';
      f += '<div class="field full"><span class="field-label">موضوع / موضوع اصلی</span><input class="input" data-field="subject" placeholder="مثلاً: معرفی دمنوش پاییزی کافه رستا" value="' + ui.esc(st.subject) + '"></div>';
      f += '<div class="field"><span class="field-label">لحن</span>' + sel('tone', O.tones, st.tone) + '</div>';
      f += '<div class="field"><span class="field-label">مخاطب</span>' + sel('audience', O.audiences, st.audience) + '</div>';
      if (st.type === 'article') f += '<div class="field"><span class="field-label">حجم</span>' + sel('length', O.lengths, st.length) + '</div>';
      if (st.type === 'photo') f += '<div class="field"><span class="field-label">سبک تصویر</span>' + sel('style', O.photoStyles, st.style) + '</div>' +
        '<div class="field"><span class="field-label">نسبت</span>' + sel('ratio', O.ratios.filter(function (r) { return r.id !== 'custom'; }).map(function (r) { return { id: r.id, fa: r.id }; }), st.ratio) + '</div>';
      if (st.type === 'video') f += '<div class="field"><span class="field-label">سبک ویدیو</span>' + sel('style', O.videoStyles, st.style) + '</div>' +
        '<div class="field"><span class="field-label">مدت (ثانیه)</span><input class="input" type="number" min="3" max="120" data-field="duration" value="' + st.duration + '"></div>';
      f += '</div>';
      return f;
    }

    function paint() {
      container.innerHTML =
        '<div class="page-head view-enter"><h1>مولد هوشمند</h1>' +
        '<div class="page-sub">یک نقطهٔ شروع سریع برای همهٔ نوع‌های محتوا</div></div>' +
        ui.banner('warn', '<b>شفاف باشیم:</b> این مولد «بریف و پرامپت قالبی» می‌سازد، نه محتوای نهایی. متن/تصویر/ویدیوی واقعی پس از اتصال سرویس تولید می‌شود و همیشه با برچسب جدا خواهد شد.') +
        '<div class="field" style="margin-bottom:14px"><span class="field-label">نوع خروجی</span>' +
        '<div class="opt-cards" data-field="type">' + TYPES.map(function (t) {
          return '<button type="button" class="opt-card' + (t.id === st.type ? ' on' : '') + '" data-value="' + t.id + '"><span class="tick">' + Nova.icon('check') + '</span>' + Nova.icon(t.icon) + '<span>' + t.label + '</span></button>';
        }).join('') + '</div></div>' +
        '<div class="studio-layout"><div class="card">' +
        formHtml() +
        '<div class="row" style="margin-top:14px"><button class="btn btn-primary" data-act="make">' + Nova.icon('wand') + ' ساخت خروجی</button></div>' +
        '</div>' +
        '<div class="prompt-card"><div class="card">' +
        '<div class="card-head"><div class="card-title" style="font-size:var(--fs-small)">خروجی</div>' + ui.badge('badge-template', 'قالبی') + '</div>' +
        '<textarea class="textarea prompt-out" id="gen-out" data-rtl="1" rows="9" placeholder="…"></textarea>' +
        '<div class="row" style="margin-top:10px">' +
        '<button class="btn btn-primary btn-sm" data-act="copy">' + Nova.icon('copy') + ' کپی</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="save">' + Nova.icon('save') + ' ذخیره</button>' +
        '<button class="btn btn-soft btn-sm" data-act="open">' + Nova.icon('external') + ' ادامه در ابزار تخصصی</button>' +
        '</div></div></div></div>';

      ui.initSelectors(container);
      ui.qsa('[data-field]', container).forEach(function (el) {
        var k = el.getAttribute('data-field');
        if (k in st && st[k] != null) el.value = st[k];
      });

      ui.bind(container, 'click', '.opt-card', function (e, card) {
        st.type = card.getAttribute('data-value');
        paint();
      });
      container.addEventListener('input', U.debounce(function () {
        var vals = ui.collectForm(container);
        Object.keys(vals).forEach(function (k) { if (k in st) st[k] = vals[k]; });
      }, 200));

      ui.bind(container, 'click', '[data-act]', function (e, btn) {
        var act = btn.getAttribute('data-act');
        var out = container.querySelector('#gen-out');
        var vals = ui.collectForm(container);
        Object.keys(vals).forEach(function (k) { if (k in st) st[k] = vals[k]; });
        if (act === 'make') {
          if (!String(st.subject || '').trim()) { ui.toast('موضوع را بنویسید.', 'warn'); return; }
          output = build();
          out.value = output;
          ui.toast('خروجی قالبی ساخته شد.', 'success');
        } else if (act === 'copy') {
          if (!out.value) { ui.toast('اول «ساخت خروجی» را بزنید.', 'warn'); return; }
          U.copyText(out.value, function (ok) { ui.toast(ok ? 'کپی شد.' : 'کپی انجام نشد.', ok ? 'success' : 'error'); });
        } else if (act === 'save') {
          if (!out.value) { ui.toast('اول «ساخت خروجی» را بزنید.', 'warn'); return; }
          var item = {
            id: U.uid('tx'), demo: false, kind: 'brief',
            title: ('بریف ' + (TYPES.filter(function (t) { return t.id === st.type; })[0] || {}).label + ' — ' + st.subject).slice(0, 70),
            state: { type: st.type }, prompt: out.value,
            createdAt: Date.now(), updatedAt: Date.now()
          };
          var r = Nova.store.insert('textBriefs', item);
          if (!r.result.ok) { ui.toast('ذخیره انجام نشد.', 'error'); return; }
          ui.toast('در کتابخانه ذخیره شد.', 'success');
        } else if (act === 'open') {
          var s = studioState();
          if (s.type === 'photo') {
            Nova.app.pending = { type: 'photo', state: s.state };
            Nova.router.navigate('/content/photo');
          } else if (s.type === 'video') {
            Nova.app.pending = { type: 'video', state: s.state };
            Nova.router.navigate('/content/video');
          } else {
            Nova.app.pending = { type: 'text', tool: s.tool, state: s.state };
            Nova.router.navigate('/content/text');
            ui.toast('در ابزار متنی، مقادیر پایه از این‌جا می‌آید؛ فرم را کامل کنید.', 'info');
          }
        }
      });
    }

    paint();
  }

  return { render: render };
})();
