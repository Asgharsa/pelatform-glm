/* ============================================================
   نوا — استودیوی ویدیو
   متن‌به‌ویدیو / تصویر‌به‌ویدیو، شات‌بندی با زمان، گویندگی،
   بررسی پشتیبانی سرویس نمونه، پرامپت کلی و هر شات.
   ============================================================ */
window.Nova = window.Nova || {};

Nova.videoStudio = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui, B = Nova.builders, O = Nova.options;
  var state = null;
  var root = null;
  var startUrl = null, endUrl = null, startMeta = null, endMeta = null;

  function defaultState() {
    return {
      mode: 'text', subject: '', goal: 'awareness', audience: 'general', idea: '',
      style: 'cinematic', light: 'natural', color: 'warm', ratio: '16:9',
      duration: 30, resolution: '1080p', fps: '30', format: 'mp4',
      camera: 'dollyin', moveIntensity: 'balanced', transition: 'fade',
      shots: [{ desc: '', dur: 5, cam: 'static', trans: 'cut' }],
      music: 'ambient', musicVolume: 40, sfx: [],
      voiceover: false, voiceLang: 'fa', voiceGender: 'female', voiceSpeed: '1', voiceText: '',
      subtitles: false, subLang: 'fa',
      ctaType: '', ctaText: '',
      negative: '', keepSubject: true, keepStyle: true,
      service: 'demo-a', promptLang: 'fa'
    };
  }

  function sel(name, items, val, placeholder) {
    return '<select class="select" data-field="' + name + '">' +
      (placeholder ? '<option value="">' + placeholder + '</option>' : '') +
      items.map(function (x) { return '<option value="' + x.id + '"' + (x.id === val ? ' selected' : '') + '>' + ui.esc(x.fa) + '</option>'; }).join('') +
      '</select>';
  }

  function section(icon, title, sub, inner) {
    return '<div class="card studio-section"><div class="card-head"><div class="row">' +
      '<div class="stat-tile video" style="width:36px;height:36px;border-radius:10px">' + Nova.icon(icon) + '</div>' +
      '<div><div class="card-title" style="font-size:var(--fs-small)">' + title + '</div><div class="card-sub">' + sub + '</div></div>' +
      '</div></div>' + inner + '</div>';
  }

  function shotRowHtml(sh, i, total) {
    return '<div class="shot-row" data-shot="' + i + '">' +
      '<div class="shot-num">' + U.faNum(i + 1) + '</div>' +
      '<div class="field"><textarea class="textarea" data-sh="desc" placeholder="چه اتفاقی در این شات می‌افتد؟">' + ui.esc(sh.desc || '') + '</textarea></div>' +
      '<div class="field"><input class="input" type="number" min="1" max="60" data-sh="dur" value="' + (sh.dur || 3) + '" aria-label="مدت شات به ثانیه"><span class="caption">ثانیه</span></div>' +
      '<div class="field f-cam">' + sel2('cam', O.cameraMoves, sh.cam) + '</div>' +
      '<div class="field f-trans">' + sel2('trans', O.transitions, sh.trans) + '</div>' +
      '<div class="shot-actions row" style="gap:2px">' +
      (i > 0 ? ui.iconBtn('sup', 'arrowUp', 'بالا') : '') +
      (i < total - 1 ? ui.iconBtn('sdown', 'arrowDown', 'پایین') : '') +
      ui.iconBtn('sdup', 'copy', 'تکثیر شات') +
      ui.iconBtn('sdel', 'trash', 'حذف شات', 'danger') +
      '</div>' +
      '<div class="shot-prompt" data-sh-prompt="' + i + '"></div>' +
      '</div>';
  }

  function sel2(name, items, val) {
    return '<select class="select" data-sh="' + name + '">' +
      items.map(function (x) { return '<option value="' + x.id + '"' + (x.id === val ? ' selected' : '') + '>' + ui.esc(x.fa) + '</option>'; }).join('') +
      '</select>';
  }

  function renderShots() {
    var el = root.querySelector('#shots-area');
    if (!el) return;
    el.innerHTML = (state.shots || []).map(function (sh, i) { return shotRowHtml(sh, i, state.shots.length); }).join('') +
      '<button type="button" class="add-block-btn" data-act="add-shot">' + Nova.icon('plus') + ' افزودن شات</button>';
    updateShotPrompts();
    updateTotals();
  }

  function updateShotPrompts() {
    ui.qsa('[data-sh-prompt]', root).forEach(function (el) {
      var i = parseInt(el.getAttribute('data-sh-prompt'), 10);
      var sh = state.shots[i];
      if (!sh) return;
      var p = B.buildShotPrompt(state, { n: i + 1, desc: sh.desc, dur: sh.dur, cam: sh.cam, trans: sh.trans });
      el.textContent = p;
      el.dataset.rtl = '1';
    });
  }

  function updateTotals() {
    var total = B.shotsTotal(state);
    var target = Number(state.duration) || 0;
    var el = root.querySelector('#shot-total');
    if (!el) return;
    el.className = 'shot-total ' + (Math.abs(total - target) < 1 ? 'ok' : (total > target ? 'over' : ''));
    el.textContent = 'مجموع شات‌ها: ' + U.faNum(total) + ' ثانیه از هدف ' + U.faNum(target) + ' ثانیه' +
      (total > target ? ' — بیش از هدف' : (Math.abs(total - target) < 1 ? ' — دقیقاً منطبق' : ''));
  }

  function updateIssues() {
    var el = root.querySelector('#svc-issues');
    if (!el) return;
    var issues = B.serviceIssues(state.service, state);
    el.innerHTML = issues.length
      ? '<div class="stack-sm">' + issues.map(function (x) {
        return '<div class="row" style="gap:7px">' + Nova.icon('alertTriangle') + '<span class="small">' + ui.esc(x.text) + '</span></div>';
      }).join('') + '</div>'
      : '<div class="row" style="gap:7px;color:var(--success)">' + Nova.icon('checkCircle') + '<span class="small">همهٔ تنظیمات فعلی با این سرویس سازگار است.</span></div>';
  }

  function renderPrompt() {
    var out = root.querySelector('#video-prompt');
    if (!out) return;
    if (out.dataset.touched !== '1') out.value = B.buildVideoPrompt(state);
    updateShotPrompts();
    updateTotals();
    updateIssues();
  }

  function refZone(id, url, meta, label) {
    if (url) {
      return '<div class="ref-preview"><img src="' + url + '" alt="پیش‌نمایش ' + label + '">' +
        '<button type="button" class="ref-remove" data-act="' + id + '-remove" aria-label="حذف">' + Nova.icon('x') + '</button>' +
        '<div class="ref-meta">' + ui.esc(meta.name) + ' · ' + ui.esc(meta.size) + '</div></div>';
    }
    return '<label class="ref-upload" for="' + id + '">' + Nova.icon('upload') +
      '<div>' + label + '</div><div class="caption">PNG، JPEG — حداکثر ۸ مگابایت</div></label>' +
      '<input type="file" id="' + id + '" accept="image/png,image/jpeg,image/webp" class="visually-hidden">';
  }

  function render(container) {
    root = container;
    if (Nova.app.pending && Nova.app.pending.type === 'video') {
      state = Object.assign(defaultState(), Nova.app.pending.state);
      Nova.app.pending = null;
      ui.toast('تنظیمات ذخیره‌شده در فرم بارگذاری شد.', 'info');
    } else if (!state || Nova.studioReset) {
      state = defaultState();
      Nova.studioReset = false;
    }
    startUrl = endUrl = null; startMeta = endMeta = null;

    var templates = O.videoTemplates.map(function (t) {
      return '<button type="button" class="opt-card" data-tpl="' + t.id + '"><span class="tick">' + Nova.icon('check') + '</span>' + Nova.icon(t.icon) + '<span>' + ui.esc(t.name) + '</span><span class="caption">' + ui.esc(t.desc) + '</span></button>';
    }).join('');

    container.innerHTML =
      '<div class="page-head view-enter"><h1>استودیوی ویدیو</h1>' +
      '<div class="page-sub">بریف کامل ویدیو با شات‌بندی — خروجی، پرامپت قالبی است</div></div>' +
      ui.banner('info', 'خروجی این استودیو <b>پرامپت و بریف قالبی</b> است. پشتیبانی واقعی هر تنظیم به سرویس انتخابی بستگی دارد و در پایین بخش سرویس به‌صورت شفاف اعلام می‌شود.') +

      '<div class="studio-layout"><div>' +

      section('zap', 'قالب‌های آماده', 'شروع سریع', '<div class="opt-cards">' + templates + '</div>') +

      section('target', 'نوع تولید و ایده', 'متن‌به‌ویدیو یا تصویر‌به‌ویدیو',
        '<div class="field" style="margin-bottom:12px"><span class="field-label">نوع تولید</span>' +
        ui.optCards('mode', [{ id: 'text', label: 'متن به ویدیو', icon: 'typeText' }, { id: 'image', label: 'تصویر به ویدیو', icon: 'image' }], state.mode) + '</div>' +
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">موضوع</span><input class="input" data-field="subject" placeholder="مثلاً: معرفی دمنوش پاییزی"></div>' +
        '<div class="field"><span class="field-label">هدف</span>' + sel('goal', O.videoGoals, state.goal) + '</div>' +
        '<div class="field"><span class="field-label">مخاطب</span>' + sel('audience', O.videoAudiences, state.audience) + '</div>' +
        '<div class="field full"><span class="field-label">شرح ایده</span><textarea class="textarea" data-field="idea" placeholder="قصهٔ کوتاه ویدیو در چند خط…"></textarea></div>' +
        '</div>') +

      section('palette', 'سبک و ظاهر', 'حال‌وهوای بصری',
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">سبک</span>' + sel('style', O.videoStyles, state.style) + '</div>' +
        '<div class="field"><span class="field-label">نور</span>' + sel('light', O.videoLights, state.light) + '</div>' +
        '<div class="field"><span class="field-label">رنگ</span>' + sel('color', O.videoColors, state.color) + '</div>' +
        '<div class="field"><span class="field-label">نسبت تصویر</span>' + sel('ratio', O.ratios.filter(function (r) { return r.id !== 'custom'; }).map(function (r) { return { id: r.id, fa: r.id }; }), state.ratio) + '</div>' +
        '</div>') +

      section('settings', 'مشخصات فنی', 'خروجی فایل',
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">مدت هدف (ثانیه)</span><input class="input" type="number" min="3" max="120" data-field="duration" value="' + state.duration + '"><span class="field-error" id="dur-error" role="alert"></span></div>' +
        '<div class="field"><span class="field-label">رزولوشن</span>' + sel('resolution', O.videoResolutions, state.resolution) + '</div>' +
        '<div class="field"><span class="field-label">فریم‌ریت</span>' + sel('fps', O.videoFps, state.fps) + '</div>' +
        '<div class="field"><span class="field-label">فرمت</span>' + sel('format', O.videoFormats, state.format) + '</div>' +
        '</div>') +

      section('camera', 'حرکت دوربین', 'شدت و انتقال شات‌ها',
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">حرکت پیش‌فرض دوربین</span>' + sel('camera', O.cameraMoves, state.camera) + '</div>' +
        '<div class="field"><span class="field-label">شدت حرکت</span>' + sel('moveIntensity', O.moveIntensity, state.moveIntensity) + '</div>' +
        '<div class="field"><span class="field-label">نوع انتقال شات‌ها</span>' + sel('transition', O.transitions, state.transition) + '</div>' +
        '</div>') +

      section('fileText', 'سناریو و شات‌بندی', 'زمان هر شات را مشخص کنید',
        '<div class="row-between" style="margin-bottom:9px"><span class="caption">پرامپت هر شات زیر همان ردیف ساخته می‌شود.</span>' +
        '<span id="shot-total" class="shot-total"></span></div>' +
        '<div id="shots-area"></div>') +

      section('image', 'تصاویر مرجع', 'فریم شروع/پایان برای تصویر‌به‌ویدیو',
        '<div class="grid grid-2">' +
        '<div><span class="field-label">تصویر مرجع / فریم شروع</span><div style="margin-top:6px" id="zone-start">' + refZone('ref-start', null, null, 'انتخاب فریم شروع') + '</div></div>' +
        '<div><span class="field-label">فریم پایان (اختیاری)</span><div style="margin-top:6px" id="zone-end">' + refZone('ref-end', null, null, 'انتخاب فریم پایان') + '</div></div>' +
        '</div>' +
        '<div class="field-hint" style="margin-top:8px">پیش‌نمایش محلی است؛ برای سرویس واقعی بارگذاری سمت سرور لازم است.</div>') +

      section('music', 'صدا', 'موسیقی، افکت و گویندگی',
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">موسیقی</span>' + sel('music', O.musicGenres, state.music) + '</div>' +
        '<div class="field"><span class="field-label">بلندی موسیقی</span><input type="range" class="range" min="0" max="100" step="5" data-field="musicVolume" value="' + state.musicVolume + '"></div>' +
        '<div class="field full"><span class="field-label">افکت‌های صوتی</span>' + ui.chipsHtml('sfx', O.sfx, state.sfx) + '</div>' +
        '</div>' +
        '<div style="margin:10px 0">' + ui.switchHtml('voiceover', state.voiceover, 'گویندگی دارد') + '</div>' +
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">زبان گویندگی</span>' + sel('voiceLang', O.voiceLangs, state.voiceLang) + '</div>' +
        '<div class="field"><span class="field-label">جنسیت صدا</span>' + sel('voiceGender', O.voiceGenders, state.voiceGender) + '</div>' +
        '<div class="field"><span class="field-label">سرعت</span>' + sel('voiceSpeed', O.voiceSpeeds, state.voiceSpeed) + '</div>' +
        '</div>' +
        '<div class="field" style="margin-top:9px"><span class="field-label">متن گویندگی</span>' +
        '<textarea class="textarea" data-field="voiceText" placeholder="متن گفتار گوینده…"></textarea>' +
        '<div class="field-hint" id="vo-est"></div></div>' +
        '<div style="margin:10px 0">' + ui.switchHtml('subtitles', state.subtitles, 'زیرنویس دارد') + '</div>' +
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">زبان زیرنویس</span>' + sel('subLang', O.voiceLangs, state.subLang) + '</div>' +
        '</div>') +

      section('target', 'پایان‌بندی و کنترل', 'دعوت به اقدام، ثبات و پرامپت منفی',
        '<div class="studio-grid">' +
        '<div class="field"><span class="field-label">نوع دعوت به اقدام</span>' + sel('ctaType', O.ctaTypes, state.ctaType, '— بدون —') + '</div>' +
        '<div class="field"><span class="field-label">متن دعوت به اقدام</span><input class="input" data-field="ctaText" placeholder="مثلاً: امروز سفارش بده"></div>' +
        '<div class="field full"><span class="field-label">پرامپت منفی</span><textarea class="textarea" data-field="negative" placeholder="موارد ناخواسته در ویدیو"></textarea></div>' +
        '</div>' +
        '<div class="stack-sm" style="margin-top:10px">' +
        ui.switchHtml('keepSubject', state.keepSubject, 'حفظ ثبات سوژه در همهٔ شات‌ها') +
        ui.switchHtml('keepStyle', state.keepStyle, 'حفظ ثبات سبک و رنگ در همهٔ شات‌ها') +
        '</div>') +

      section('server', 'سرویس هدف', 'سازگاری تنظیمات را بررسی کنید',
        sel('service', O.videoServices, state.service) +
        '<div id="svc-issues" style="margin-top:10px"></div>' +
        '<div class="field-hint" style="margin-top:8px">سرویس‌ها نمونه‌اند تا وابستگی تنظیمات به سرویس شفاف شود؛ در نسخهٔ واقعی فهرست سرویس‌های متصل از تنظیمات می‌آید.</div>') +

      '</div>' +

      '<div class="prompt-card"><div class="card">' +
      '<div class="card-head"><div class="card-title" style="font-size:var(--fs-small)">پرامپت کلی ویدیو</div>' + ui.badge('badge-template', 'قالبی') + '</div>' +
      '<textarea class="textarea prompt-out" id="video-prompt" rows="9"></textarea>' +
      '<div class="row" style="margin-top:10px">' +
      '<button class="btn btn-primary btn-sm" data-act="copy">' + Nova.icon('copy') + ' کپی پرامپت کلی</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="copy-shots">' + Nova.icon('copy') + ' کپی پرامپت شات‌ها</button>' +
      '</div>' +
      '<div class="row" style="margin-top:7px">' +
      '<button class="btn btn-ghost btn-sm" data-act="download">' + Nova.icon('download') + ' دانلود بریف</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="save">' + Nova.icon('save') + ' ذخیره در کتابخانه</button>' +
      '<button class="btn btn-plain btn-sm" data-act="rebuild">' + Nova.icon('refresh') + ' بازسازی</button>' +
      '</div>' +
      '<div class="field-hint" style="margin-top:8px">پرامپت هر شات زیر ردیف همان شات دیده می‌شود و قابل کپی است.</div>' +
      '</div></div>' +
      '</div>' +

      '<div class="studio-sticky-bar">' +
      '<button class="btn btn-primary grow" data-act="copy">' + Nova.icon('copy') + ' کپی پرامپت</button>' +
      '<button class="btn btn-ghost" data-act="save">' + Nova.icon('save') + ' ذخیره</button></div>';

    setFieldValues(state);
    renderShots();
    ui.initSelectors(container);
    renderPrompt();
    updateVoEst();

    container.addEventListener('input', U.debounce(function () {
      readForm();
      renderPrompt();
      updateVoEst();
    }, 300));
    container.addEventListener('change', function (e) {
      if (e.target.matches('[data-field="duration"]')) {
        var v = B.validateDuration(state.duration);
        var err = root.querySelector('#dur-error');
        if (err) err.textContent = v.ok ? '' : v.error;
      }
      if (e.target.matches('input[type="file"]')) {
        var id = e.target.id;
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var check = B.validateRefFile(f);
        if (!check.ok) { ui.toast(check.error, 'error'); e.target.value = ''; return; }
        var url = URL.createObjectURL(f);
        var meta = { name: f.name, size: U.formatBytes(f.size) };
        if (id === 'ref-start') { if (startUrl) URL.revokeObjectURL(startUrl); startUrl = url; startMeta = meta; root.querySelector('#zone-start').innerHTML = refZone('ref-start', startUrl, startMeta, 'انتخاب فریم شروع'); }
        else { if (endUrl) URL.revokeObjectURL(endUrl); endUrl = url; endMeta = meta; root.querySelector('#zone-end').innerHTML = refZone('ref-end', endUrl, endMeta, 'انتخاب فریم پایان'); }
        e.target.value = '';
        ui.toast('تصویر به‌صورت محلی پیش‌نمایش شد.', 'success');
      }
    });

    ui.bind(container, 'click', '[data-act="ref-start-remove"]', function () {
      if (startUrl) { URL.revokeObjectURL(startUrl); startUrl = null; startMeta = null; }
      root.querySelector('#zone-start').innerHTML = refZone('ref-start', null, null, 'انتخاب فریم شروع');
    });
    ui.bind(container, 'click', '[data-act="ref-end-remove"]', function () {
      if (endUrl) { URL.revokeObjectURL(endUrl); endUrl = null; endMeta = null; }
      root.querySelector('#zone-end').innerHTML = refZone('ref-end', null, null, 'انتخاب فریم پایان');
    });

    ui.bind(container, 'click', '[data-tpl]', function (e, card) {
      var t = O.byId(O.videoTemplates, card.getAttribute('data-tpl'));
      if (!t) return;
      Object.assign(state, JSON.parse(JSON.stringify(t.patch)));
      setFieldValues(state);
      ui.qsa('[data-tpl]', root).forEach(function (c) { c.classList.toggle('on', c === card); });
      renderShots();
      renderPrompt();
      updateVoEst();
      ui.toast('قالب «' + t.name + '» اعمال شد.', 'success');
    });

    /* رویدادهای شات‌ها */
    ui.bind(container, 'click', '.shot-actions [data-action], [data-act="add-shot"]', function (e, btn) {
      var act = btn.getAttribute('data-action') || btn.getAttribute('data-act');
      var row = btn.closest('.shot-row');
      var idx = row ? parseInt(row.getAttribute('data-shot'), 10) : -1;
      if (act === 'add-shot') {
        state.shots.push({ desc: '', dur: 3, cam: state.camera || 'static', trans: state.transition || 'cut' });
        renderShots();
      } else if (act === 'sdup' && idx > -1) {
        var c = JSON.parse(JSON.stringify(state.shots[idx]));
        state.shots.splice(idx + 1, 0, c);
        renderShots();
      } else if (act === 'sdel' && idx > -1) {
        if (state.shots.length === 1) { ui.toast('حداقل یک شات لازم است.', 'warn'); return; }
        state.shots.splice(idx, 1);
        renderShots();
      } else if (act === 'sup' && idx > 0) {
        var t1 = state.shots[idx - 1]; state.shots[idx - 1] = state.shots[idx]; state.shots[idx] = t1;
        renderShots();
      } else if (act === 'sdown' && idx > -1 && idx < state.shots.length - 1) {
        var t2 = state.shots[idx + 1]; state.shots[idx + 1] = state.shots[idx]; state.shots[idx] = t2;
        renderShots();
      }
      readForm();
      renderPrompt();
    });

    container.addEventListener('input', function (e) {
      if (e.target.matches('[data-sh]')) {
        readShots();
        updateShotPrompts();
        updateTotals();
      }
    });

    ui.bind(container, 'click', '[data-act]', function (e, btn) {
      var act = btn.getAttribute('data-act');
      if (['copy', 'copy-shots', 'download', 'save', 'rebuild'].indexOf(act) === -1) return;
      readForm(); readShots();
      var p = root.querySelector('#video-prompt').value;
      if (act === 'copy') {
        U.copyText(p, function (ok) { ui.toast(ok ? 'پرامپت کلی کپی شد.' : 'کپی انجام نشد.', ok ? 'success' : 'error'); });
      } else if (act === 'copy-shots') {
        var shots = state.shots.map(function (sh, i) { return B.buildShotPrompt(state, { n: i + 1, desc: sh.desc, dur: sh.dur, cam: sh.cam, trans: sh.trans }); }).join('\n\n');
        U.copyText(shots, function (ok) { ui.toast(ok ? 'پرامپت شات‌ها کپی شد.' : 'کپی انجام نشد.', ok ? 'success' : 'error'); });
      } else if (act === 'download') {
        var brief = p + '\n\n———— پرامپت شات‌ها ————\n\n' + state.shots.map(function (sh, i) { return B.buildShotPrompt(state, { n: i + 1, desc: sh.desc, dur: sh.dur, cam: sh.cam, trans: sh.trans }); }).join('\n\n');
        U.download('nova-video-brief.txt', brief, 'text/plain');
        ui.toast('بریف ویدیو دانلود شد.', 'success');
      } else if (act === 'rebuild') {
        var out = root.querySelector('#video-prompt');
        out.dataset.touched = '0';
        renderPrompt();
        ui.toast('پرامپت از روی فرم بازسازی شد.', 'info');
      } else if (act === 'save') {
        saveBrief();
      }
    });

    var out = root.querySelector('#video-prompt');
    out.addEventListener('input', function () { out.dataset.touched = '1'; });
  }

  function readForm() {
    var vals = ui.collectForm(root);
    Object.keys(vals).forEach(function (k) { if (k in state) state[k] = vals[k]; });
  }

  function readShots() {
    ui.qsa('.shot-row', root).forEach(function (row) {
      var i = parseInt(row.getAttribute('data-shot'), 10);
      if (!state.shots[i]) return;
      var desc = row.querySelector('[data-sh="desc"]');
      var dur = row.querySelector('[data-sh="dur"]');
      var cam = row.querySelector('[data-sh="cam"]');
      var trans = row.querySelector('[data-sh="trans"]');
      state.shots[i].desc = desc ? desc.value : '';
      state.shots[i].dur = dur ? (Number(dur.value) || 0) : 0;
      state.shots[i].cam = cam ? cam.value : '';
      state.shots[i].trans = trans ? trans.value : '';
    });
  }

  function setFieldValues(st) {
    ui.qsa('[data-field]', root).forEach(function (el) {
      var k = el.getAttribute('data-field');
      if (el.type === 'checkbox') { if (k in st) el.checked = !!st[k]; return; }
      if (k in st && st[k] != null && el.type !== 'file') el.value = st[k];
    });
    ui.qsa('.chips[data-field]', root).forEach(function (g) {
      var k = g.getAttribute('data-field');
      ui.qsa('.chip', g).forEach(function (c) {
        var on = (st[k] || []).indexOf(c.getAttribute('data-value')) > -1;
        c.classList.toggle('on', on);
      });
    });
  }

  function updateVoEst() {
    var el = root.querySelector('#vo-est');
    if (!el) return;
    var sec = B.voiceoverEstimate(state.voiceText || '', state.voiceSpeed);
    el.textContent = sec
      ? 'تخمین مدت گویندگی: حدود ' + U.faNum(sec) + ' ثانیه (هدف ویدیو: ' + U.faNum(state.duration) + ' ثانیه)' + (sec > state.duration ? ' — متن بلندتر از مدت ویدیوست.' : '')
      : 'متن گویندگی خالی است — تخمین پس از نوشتن متن نشان داده می‌شود.';
  }

  function saveBrief() {
    if (!String(state.subject || '').trim()) {
      ui.toast('برای ذخیره، موضوع ویدیو را بنویسید.', 'warn');
      return;
    }
    var item = {
      id: U.uid('vd'), demo: false,
      title: String(state.subject).slice(0, 70),
      state: JSON.parse(JSON.stringify(state)),
      prompt: root.querySelector('#video-prompt').value,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    var r = Nova.store.insert('videoBriefs', item);
    if (!r.result.ok) { ui.toast('ذخیره انجام نشد؛ فضای مرورگر پر است.', 'error'); return; }
    ui.toast('بریف ویدیو در کتابخانه ذخیره شد.', 'success');
  }

  return { render: render };
})();
