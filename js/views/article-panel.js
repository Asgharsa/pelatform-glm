/* ============================================================
   نوا — پنل کناری ویرایشگر مقاله
   تب‌ها: تنظیمات نوشته، سئو، دستیار نگارش، خروجی و نسخه‌ها
   ============================================================ */
window.Nova = window.Nova || {};

Nova.articlePanel = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui, B = Nova.builders;
  var root = null;
  var art = null;
  var tab = 'settings';

  /* ---------- کمکی ---------- */

  function domainHint() {
    var doms = Nova.store.getList('domains');
    var d = doms.filter(function (x) { return x.status === 'verified'; })[0] || doms[0];
    return d ? d.domain : 'example.ir';
  }

  function setField(key, value) {
    art.settings = art.settings || {};
    art.settings[key] = value;
    Nova.articleEditor.notifyChanged();
  }

  /* ---------- تب: تنظیمات نوشته ---------- */

  function tabSettings() {
    var s = art.settings || {};
    var tags = (s.tags || []).map(function (t) {
      return '<span class="chip on">' + ui.esc(t) + '<button type="button" class="x" data-tag-del="' + ui.esc(t) + '" aria-label="حذف برچسب">×</button></span>';
    }).join('');
    var imgOk = B.safeImgSrc(s.featuredImage);
    return '<div class="stack">' +
      ui.fieldHtml({ key: 'author', label: 'نویسنده', value: s.author || '', placeholder: 'نام نویسنده', hint: 'در پیش‌نمایش و خروجی نمایش داده می‌شود.' }) +
      ui.fieldHtml({ key: 'category', label: 'دسته‌بندی', type: 'select', value: s.category || 'general', options: Nova.options.categories.map(function (c) { return { value: c.id, label: c.fa }; }) }) +
      '<div class="field"><span class="field-label">برچسب‌ها</span>' +
      '<div class="chips">' + tags +
      '<span class="chip chip-add" id="tag-add" role="button" tabindex="0">+ افزودن برچسب</span></div>' +
      '<div class="field-hint">با Enter برچسب را ثبت کنید.</div></div>' +
      '<div class="field"><label class="field-label" for="f-excerpt">چکیده</label>' +
      '<textarea class="textarea" id="f-excerpt" data-field="excerpt" placeholder="خلاصهٔ دو تا سه خطی مقاله برای آرشیو و شبکه‌های اجتماعی">' + ui.esc(s.excerpt || '') + '</textarea>' +
      '<div class="field-hint">' + U.faNum(String(s.excerpt || '').length) + ' نویسه (بازهٔ پیشنهادی ۸۰ تا ۱۶۰)</div></div>' +
      '<div class="field"><label class="field-label" for="f-fimg">تصویر شاخص</label>' +
      '<input class="input" id="f-fimg" dir="ltr" style="text-align:left" placeholder="https://…" value="' + ui.esc(s.featuredImage || '') + '">' +
      (imgOk ? '<img src="' + ui.esc(s.featuredImage) + '" alt="پیش‌نمایش تصویر شاخص" style="border-radius:12px;margin-top:8px;max-height:140px;object-fit:cover">' : (s.featuredImage ? '<div class="field-error">نشانی تصویر معتبر نیست.</div>' : '')) + '</div>' +
      ui.fieldHtml({ key: 'featuredAlt', label: 'متن جایگزین تصویر شاخص', value: s.featuredAlt || '', placeholder: 'توضیح تصویر برای دسترس‌پذیری' }) +
      '<div class="field"><label class="field-label" for="f-pdate">تاریخ پیشنهادی انتشار</label>' +
      '<input class="input" type="date" id="f-pdate" value="' + ui.esc(s.publishDate || '') + '">' +
      '<div class="row" style="margin-top:6px"><button type="button" class="btn btn-ghost btn-sm" id="suggest-date">پیشنهاد: سه روز دیگر</button>' +
      (s.publishDate ? '<span class="caption">' + U.faDate(new Date(s.publishDate)) + '</span>' : '') + '</div>' +
      '<div class="field-hint">تقویم محتوایی نوا این تاریخ را در برنامهٔ انتشار نشان می‌دهد.</div></div>' +
      '</div>';
  }

  /* ---------- تب: سئو ---------- */

  function tabSeo() {
    var s = art.settings || {};
    var checks = B.seoChecks(art);
    var ok = checks.filter(function (c) { return c.status === 'ok'; }).length;
    var iconFor = { ok: 'checkCircle', warn: 'alertTriangle', fail: 'alertCircle' };
    var title = s.seoTitle || art.title || 'عنوان مقاله اینجا نمایش داده می‌شود';
    var desc = s.metaDesc || s.excerpt || 'توضیحات متا یا ابتدای چکیدهٔ مقاله در نتایج جست‌وجو دیده می‌شود؛ اگر خالی باشد، موتور جست‌وجو متنی انتخاب می‌کند.';
    return '<div class="stack">' +
      '<div class="field"><label class="field-label" for="f-slug">نامک (نشانی مقاله)</label>' +
      '<div class="row" style="flex-wrap:nowrap">' +
      '<input class="input" id="f-slug" dir="ltr" style="text-align:left;font-family:var(--font-mono);font-size:13px" placeholder="my-post-slug" value="' + ui.esc(s.slug || '') + '">' +
      '<button type="button" class="btn btn-ghost btn-sm" id="slug-gen" title="ساخت خودکار از عنوان">ساخت از عنوان</button></div>' +
      (s.slug && !U.isValidSlug(s.slug) ? '<div class="field-error" role="alert">نامک فقط حروف لاتین کوچک، عدد و خط تیره (-) مجاز است.</div>' : '<div class="field-hint">در وردپرس به نشانی مقاله تبدیل می‌شود.</div>') +
      '</div>' +
      '<div class="field"><label class="field-label" for="f-seotitle">عنوان سئو</label>' +
      '<input class="input" id="f-seotitle" placeholder="عنوانی که در نتایج جست‌وجو دیده می‌شود" value="' + ui.esc(s.seoTitle || '') + '">' +
      '<div class="field-hint">' + U.faNum(String(s.seoTitle || '').length) + ' نویسه (پیشنهاد ۳۰ تا ۶۰)</div></div>' +
      '<div class="field"><label class="field-label" for="f-metadesc">توضیحات متا</label>' +
      '<textarea class="textarea" id="f-metadesc" placeholder="توضیح کوتاه برای موتورهای جست‌وجو">' + ui.esc(s.metaDesc || '') + '</textarea>' +
      '<div class="field-hint">' + U.faNum(String(s.metaDesc || '').length) + ' نویسه (پیشنهاد ۸۰ تا ۱۶۰)</div></div>' +
      ui.fieldHtml({ key: 'keyword', label: 'کلمهٔ کلیدی کانونی', value: s.keyword || '', placeholder: 'مثلاً: عکاسی محصول', hint: 'صرفاً برای بررسی ساختاری این مقاله استفاده می‌شود.' }) +

      '<div><div class="field-label" style="margin-bottom:6px">پیش‌نمایش نتیجهٔ جست‌وجو</div>' +
      '<div class="serp-preview">' +
      '<div class="serp-url"><span class="serp-fav">ن</span><span class="ltr-embed">' + ui.esc(domainHint() + ' › blog › ' + (s.slug || 'post')) + '</span></div>' +
      '<div class="serp-title">' + ui.esc(title) + '</div>' +
      '<div class="serp-desc">' + ui.esc(String(desc).slice(0, 170)) + '</div>' +
      '</div>' +
      '<div class="field-hint">نمایش تقریبی است؛ ظاهر واقعی به موتور جست‌وجو بستگی دارد.</div></div>' +

      '<div id="seo-checks">' +
      '<div class="row-between" style="margin-bottom:4px"><span class="field-label">بررسی‌های سادهٔ ساختار و خوانایی</span>' +
      '<span class="caption">' + U.faNum(ok) + ' از ' + U.faNum(checks.length) + ' موارد</span></div>' +
      checks.map(function (c) {
        return '<div class="seo-check ' + c.status + '">' + Nova.icon(iconFor[c.status]) + '<div><div>' + ui.esc(c.label) + '</div><div class="why">' + ui.esc(c.why) + '</div></div></div>';
      }).join('') +
      '<div class="field-hint" style="margin-top:6px">این بررسی‌ها صرفاً ساختاری‌اند؛ <b>امتیاز سئو یا تضمین رتبه ارائه نمی‌کنند</b>.</div></div>' +
      '</div>';
  }

  function checksHtml() {
    var checks = B.seoChecks(art);
    var ok = checks.filter(function (c) { return c.status === 'ok'; }).length;
    var iconFor = { ok: 'checkCircle', warn: 'alertTriangle', fail: 'alertCircle' };
    return '<div class="row-between" style="margin-bottom:4px"><span class="field-label">بررسی‌های سادهٔ ساختار و خوانایی</span>' +
      '<span class="caption">' + U.faNum(ok) + ' از ' + U.faNum(checks.length) + ' مورد</span></div>' +
      checks.map(function (c) {
        return '<div class="seo-check ' + c.status + '">' + Nova.icon(iconFor[c.status]) + '<div><div>' + ui.esc(c.label) + '</div><div class="why">' + ui.esc(c.why) + '</div></div></div>';
      }).join('') +
      '<div class="field-hint" style="margin-top:6px">این بررسی‌ها صرفاً ساختاری‌اند؛ <b>امتیاز سئو یا تضمین رتبه ارائه نمی‌کنند</b>.</div>';
  }

  /* ---------- تب: دستیار ---------- */

  function tabAssistant() {
    var b = art.brief = art.brief || {};
    var brands = Nova.app.visibleList('brands');
    var brandSel = brands.length
      ? '<div class="field"><label class="field-label" for="f-brand">هم‌راستا با برند</label><select class="select" id="f-brand"><option value="">— انتخاب برند —</option>' +
      brands.map(function (br) { return '<option value="' + br.id + '"' + (b.brandId === br.id ? ' selected' : '') + '>' + ui.esc(br.name) + (br.demo ? ' (نمونه)' : '') + '</option>'; }).join('') + '</select>' +
      '<div class="field-hint">لحن و مخاطب برند انتخابی، فرم زیر را تکمیل می‌کند.</div></div>'
      : '';
    return '<div class="stack">' +
      '<div class="field"><span class="field-label">نوع مقاله</span>' +
      ui.optCards('brief-type', Nova.options.articleTypes.map(function (t) { return { id: t.id, label: t.fa }; }), b.type || '') + '</div>' +
      '<div class="grid grid-2">' +
      ui.fieldHtml({ key: 'brief-lang', label: 'زبان', type: 'select', value: b.lang || 'fa', options: Nova.options.articleLangs.map(function (x) { return { value: x.id, label: x.fa }; }) }) +
      ui.fieldHtml({ key: 'brief-tone', label: 'لحن', type: 'select', value: b.tone || 'friendly', options: Nova.options.tones.map(function (x) { return { value: x.id, label: x.fa }; }) }) +
      ui.fieldHtml({ key: 'brief-audience', label: 'مخاطب', type: 'select', value: b.audience || 'general', options: Nova.options.audiences.map(function (x) { return { value: x.id, label: x.fa }; }) }) +
      ui.fieldHtml({ key: 'brief-goal', label: 'هدف', type: 'select', value: b.goal || 'edu', options: Nova.options.contentGoals.map(function (x) { return { value: x.id, label: x.fa }; }) }) +
      '</div>' +
      ui.fieldHtml({ key: 'brief-length', label: 'حجم متن', type: 'select', value: b.length || 'medium', options: Nova.options.lengths.map(function (x) { return { value: x.id, label: x.fa }; }) }) +
      ui.fieldHtml({ key: 'brief-topic', label: 'موضوع / زاویهٔ اصلی', value: b.topic || '', placeholder: 'مثلاً: چطور با نور طبیعی عکس محصول بگیریم', full: true }) +
      ui.fieldHtml({ key: 'brief-points', label: 'نکات ضروری (هر خط یک نکته)', type: 'textarea', value: b.points || '', placeholder: 'نکتهٔ اول\nنکتهٔ دوم', full: true }) +
      ui.fieldHtml({ key: 'brief-sources', label: 'منابع (هر خط یک منبع)', type: 'textarea', value: b.sources || '', placeholder: 'لینک یا نام منبع', full: true }) +
      ui.fieldHtml({ key: 'brief-forbidden', label: 'واژگان ممنوع / ادعاهای ممنوع', value: b.forbidden || '', placeholder: 'با کاما جدا کنید', full: true }) +
      '<div class="field"><span class="field-label">سایر گزینه‌ها</span><div class="stack-sm">' +
      ui.switchHtml('brief-faq', !!b.faq, 'شامل بخش پرسش‌های متداول') +
      '</div></div>' +
      ui.fieldHtml({ key: 'brief-cta', label: 'دعوت به اقدام پایانی', type: 'select', value: b.cta || '', placeholder: '— بدون دعوت به اقدام —', options: Nova.options.ctaTypes.map(function (x) { return { value: x.id, label: x.fa }; }) }) +
      '<button class="btn btn-primary" id="brief-make">' + Nova.icon('wand') + ' آماده‌سازی بریف و ساختار</button>' +

      '<div class="banner banner-info" style="margin:6px 0 0">' + Nova.icon('info') + '<div>خروجی دستیار <b>قالبی</b> است: بریف و طرح ساختار. تولید متن واقعی در جای مشخص پایین، به اتصال سرویس وابسته است.</div></div>' +
      '<div class="card" style="background:var(--surface-2);box-shadow:none">' +
      '<div class="row-between"><div class="card-title" style="font-size:var(--fs-small)">تولید و بازنویسی با هوش مصنوعی</div>' + ui.badge('badge-conn', 'نیازمند اتصال') + '</div>' +
      '<p class="caption" style="margin:6px 0 10px;line-height:1.7">در نسخهٔ فعلی هیچ متنی تولید نمی‌شود و کلید API لازم نیست. پس از اتصال سرویس (سمت سرور)، همین بریف به مدل ارسال خواهد شد.</p>' +
      '<button class="btn btn-ghost btn-sm" id="ai-info">وضعیت اتصال را ببین</button></div>' +
      '</div>';
  }

  /* ---------- تب: خروجی ---------- */

  function tabExport() {
    var htmlOut = B.buildArticleHtml(art);
    var jsonOut = JSON.stringify({ app: 'nova-article', schema: 1, exportedAt: new Date().toISOString(), title: art.title, blocks: art.blocks, settings: art.settings, brief: art.brief }, null, 2);
    var slug = (art.settings && art.settings.slug) || art.id;
    var revs = (art.revisions || []).map(function (rv, i) {
      var words = U.countWords((rv.blocks || []).map(function (b) {
        return b.data && (b.data.text || b.data.html || (b.data.items || []).join(' ')) || '';
      }).join(' '));
      return '<div class="row-between" style="padding:8px 0;border-bottom:1px solid var(--border)">' +
        '<div><div class="small" style="font-weight:600">' + U.faDateTime(new Date(rv.ts)) + '</div>' +
        '<div class="caption">' + U.faNum(words) + ' کلمه · ' + ui.esc(rv.title || 'بدون عنوان') + '</div></div>' +
        '<button class="btn btn-ghost btn-sm" data-restore="' + i + '">بازیابی</button></div>';
    }).join('');
    return '<div class="stack">' +
      '<div><div class="row-between" style="margin-bottom:8px"><div class="card-title" style="font-size:var(--fs-small)">خروجی HTML برای وردپرس</div>' + ui.badge('badge-template', 'خروجی قالبی') + '</div>' +
      '<div class="code-block" id="html-out">' + ui.esc(htmlOut) + '</div>' +
      '<div class="row" style="margin-top:8px">' +
      '<button class="btn btn-soft btn-sm" data-export="copy-html">' + Nova.icon('copy') + ' کپی</button>' +
      '<button class="btn btn-ghost btn-sm" data-export="dl-html">' + Nova.icon('download') + ' دانلود .html</button>' +
      '</div>' +
      '<div class="field-hint" style="margin-top:6px">بدنهٔ بلوکی + نظرگذاری عنوان/نامک؛ مستقیم در ویرایشگر وردپرس (حالت HTML) جای‌گذاری کنید.</div></div>' +

      '<div><div class="row-between" style="margin-bottom:8px"><div class="card-title" style="font-size:var(--fs-small)">پشتیبان JSON</div></div>' +
      '<div class="row">' +
      '<button class="btn btn-soft btn-sm" data-export="copy-json">' + Nova.icon('copy') + ' کپی JSON</button>' +
      '<button class="btn btn-ghost btn-sm" data-export="dl-json">' + Nova.icon('download') + ' دانلود .json</button>' +
      '<button class="btn btn-ghost btn-sm" data-export="import-json">' + Nova.icon('upload') + ' واردکردن (از فهرست مقاله‌ها)</button>' +
      '</div>' +
      '<div class="field-hint" style="margin-top:6px">فایل JSON شامل بلوک‌ها، تنظیمات و بریف است و از فهرست مقاله‌ها قابل واردکردن مجدد است.</div></div>' +

      '<div><div class="card-title" style="font-size:var(--fs-small);margin-bottom:4px">نسخه‌های ذخیرهٔ خودکار</div>' +
      (revs ? revs : '<div class="caption" style="padding:8px 0">هنوز نسخه‌ای ثبت نشده؛ پس از نخستین ذخیرهٔ خودکار این‌جا دیده می‌شود.</div>') +
      '<div class="field-hint">هر تغییر مهم (حداکثر هر ۹۰ ثانیه) یک نسخهٔ قابل بازیابی ذخیره می‌شود؛ ۱۰ نسخهٔ اخیر نگه داشته می‌شود.</div></div>' +
      '</div>';
  }

  /* ---------- رندر ---------- */

  function render(container, article) {
    root = container;
    art = article;
    paint();
  }

  function refresh(article) {
    if (!root || !root.isConnected) return;
    art = article;
    var ae = document.activeElement;
    if (ae && root.contains(ae) && ae.matches('input, textarea, select')) return; /* در حال تایپ؛ بازرسم نکن */
    if (tab === 'seo') paint();
  }

  function onSaved(article) {
    if (!root || !root.isConnected) return;
    if (tab === 'export') paint(); /* نسخه‌های خودکار تازه شوند */
  }

  function paint() {
    if (!root) return;
    var tabs = [
      { id: 'settings', label: 'تنظیمات نوشته' },
      { id: 'seo', label: 'سئو' },
      { id: 'assistant', label: 'دستیار' },
      { id: 'export', label: 'خروجی و نسخه‌ها' }
    ];
    root.innerHTML =
      '<div class="card">' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) {
        return '<button class="tab' + (tab === t.id ? ' on' : '') + '" data-tab="' + t.id + '" role="tab" aria-selected="' + (tab === t.id) + '">' + t.label + '</button>';
      }).join('') + '</div>' +
      '<div id="panel-body"></div></div>';
    var body = root.querySelector('#panel-body');
    if (tab === 'settings') body.innerHTML = tabSettings();
    else if (tab === 'seo') body.innerHTML = tabSeo();
    else if (tab === 'assistant') { body.innerHTML = tabAssistant(); ui.initSelectors(body); }
    else body.innerHTML = tabExport();

    ui.bind(root, 'click', '[data-tab]', function (e, btn) {
      tab = btn.getAttribute('data-tab');
      paint();
    });

    wireBody(body);
  }

  function wireBody(body) {
    if (!body) return;
    var s = art.settings || {};

    /* فیلدهای ساده با id مستقیم */
    function bindValue(sel, key, transform) {
      var el = body.querySelector(sel);
      if (!el) return;
      el.addEventListener('input', function () {
        setField(key, transform ? transform(el.value) : el.value);
        if (key === 'excerpt' || key === 'seoTitle' || key === 'metaDesc') {
          var hint = el.closest('.field').querySelector('.field-hint');
          if (hint) hint.textContent = U.faNum(String(el.value).length) + ' نویسه';
        }
      });
    }
    bindValue('#f-excerpt', 'excerpt');
    bindValue('#f-seotitle', 'seoTitle');
    bindValue('#f-metadesc', 'metaDesc');

    body.querySelector('#f-slug') && body.querySelector('#f-slug').addEventListener('input', function (e) {
      setField('slug', e.target.value.trim().toLowerCase());
      var err = e.target.closest('.field').querySelector('.field-error');
      if (err && e.target.value && !U.isValidSlug(e.target.value)) err.textContent = 'نامک فقط حروف لاتین کوچک، عدد و خط تیره (-) مجاز است.';
      else if (err) err.textContent = '';
    });
    body.querySelector('#slug-gen') && body.querySelector('#slug-gen').addEventListener('click', function () {
      var slug = U.slugify(art.title || '').replace(/[\u0600-\u06FF]/g, '');
      slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '') || 'post-' + Date.now().toString(36);
      setField('slug', slug);
      paint();
      ui.toast('نامک ساخته شد. اگر عنوان فارسی است، نامک را دستی تکمیل کنید.', 'info');
    });
    body.querySelector('#f-seotitle') && body.querySelector('#f-seotitle').addEventListener('input', function (e) { setField('seoTitle', e.target.value); });
    body.querySelector('#f-metadesc') && body.querySelector('#f-metadesc').addEventListener('input', function (e) { setField('metaDesc', e.target.value); });

    /* کلیدواژه — به‌روزرسانی جراحیی بررسی‌ها بدون از دست رفتن فوکوس */
    var kw = body.querySelector('[data-field="keyword"]');
    kw && kw.addEventListener('input', function () {
      setField('keyword', kw.value);
      var checksEl = body.querySelector('#seo-checks');
      if (checksEl) checksEl.innerHTML = checksHtml();
    });

    /* تنظیمات نوشته */
    var author = body.querySelector('[data-field="author"]');
    author && author.addEventListener('input', function () { setField('author', author.value); });
    var cat = body.querySelector('[data-field="category"]');
    cat && cat.addEventListener('change', function () { setField('category', cat.value); });
    var fimg = body.querySelector('#f-fimg');
    fimg && fimg.addEventListener('input', U.debounce(function () {
      setField('featuredImage', fimg.value.trim());
      if (B.safeImgSrc(fimg.value.trim())) paint();
    }, 700));
    var falt = body.querySelector('[data-field="featuredAlt"]');
    falt && falt.addEventListener('input', function () { setField('featuredAlt', falt.value); });
    var pdate = body.querySelector('#f-pdate');
    pdate && pdate.addEventListener('change', function () { setField('publishDate', pdate.value); });
    var suggest = body.querySelector('#suggest-date');
    suggest && suggest.addEventListener('click', function () {
      var d = new Date();
      d.setDate(d.getDate() + 3);
      setField('publishDate', d.toISOString().slice(0, 10));
      paint();
    });

    /* برچسب‌ها */
    var tagAdd = body.querySelector('#tag-add');
    if (tagAdd) {
      tagAdd.addEventListener('click', function () {
        var input = document.createElement('input');
        input.className = 'input';
        input.style.width = '130px';
        input.style.padding = '4px 10px';
        input.placeholder = 'برچسب و Enter';
        tagAdd.parentNode.replaceChild(input, tagAdd);
        input.focus();
        function commit() {
          var v = input.value.trim();
          if (v && (s.tags || []).indexOf(v) === -1) {
            setField('tags', (s.tags || []).concat([v]));
          }
          paint();
        }
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
        input.addEventListener('blur', commit);
      });
      ui.bind(body, 'click', '[data-tag-del]', function (e, btn) {
        var t = btn.getAttribute('data-tag-del');
        setField('tags', (s.tags || []).filter(function (x) { return x !== t; }));
        paint();
      });
    }

    /* دستیار */
    var briefMap = {
      'brief-type': 'type', 'brief-lang': 'lang', 'brief-tone': 'tone', 'brief-audience': 'audience',
      'brief-goal': 'goal', 'brief-length': 'length', 'brief-topic': 'topic', 'brief-points': 'points',
      'brief-sources': 'sources', 'brief-forbidden': 'forbidden', 'brief-cta': 'cta', 'brief-faq': 'faq'
    };
    Object.keys(briefMap).forEach(function (field) {
      var el = body.querySelector('[data-field="' + field + '"]');
      if (!el) return;
      var key = briefMap[field];
      var evName = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(evName, function () {
        art.brief = art.brief || {};
        art.brief[key] = el.type === 'checkbox' ? el.checked : el.value;
        Nova.articleEditor.notifyChanged();
      });
    });
    var brandSel = body.querySelector('#f-brand');
    brandSel && brandSel.addEventListener('change', function () {
      art.brief = art.brief || {};
      art.brief.brandId = brandSel.value;
      var br = Nova.store.getById('brands', brandSel.value);
      if (br) {
        art.brief.tone = (br.tones || [])[0] || art.brief.tone;
        art.brief.forbidden = br.forbidden || art.brief.forbidden;
      }
      Nova.articleEditor.notifyChanged();
      paint();
      if (br) ui.toast('لحن و واژگان ممنوع برند «' + br.name + '» اعمال شد.', 'success');
    });
    var makeBtn = body.querySelector('#brief-make');
    makeBtn && makeBtn.addEventListener('click', function () {
      Nova.articleEditor.syncAllBlocks();
      art.brief = art.brief || {};
      var briefText = B.buildArticleBrief(art.brief);
      var m = ui.modal({
        title: 'بریف و ساختار مقاله ' + ui.badge('badge-template', 'قالبی'),
        body: '<div class="stack">' +
          '<pre class="code-block" data-rtl="1" style="direction:rtl;text-align:right;font-family:var(--font-sans);white-space:pre-wrap;max-height:320px">' + ui.esc(briefText) + '</pre>' +
          '<div class="row">' +
          '<button class="btn btn-soft btn-sm" id="brief-copy">' + Nova.icon('copy') + ' کپی بریف</button>' +
          '<button class="btn btn-primary btn-sm" id="brief-insert">' + Nova.icon('plus') + ' درج ساختار در مقاله</button>' +
          '</div></div>'
      });
      m.body.querySelector('#brief-copy').addEventListener('click', function () {
        U.copyText(briefText, function (ok) { ui.toast(ok ? 'بریف کپی شد.' : 'کپی انجام نشد؛ متن را دستی انتخاب و کپی کنید.', ok ? 'success' : 'error'); });
      });
      m.body.querySelector('#brief-insert').addEventListener('click', function () {
        var blocks = B.buildOutlineBlocks(art.brief.type || 'guide');
        art.blocks = art.blocks.concat(blocks);
        Nova.articleEditor.rerenderBlocks();
        Nova.articleEditor.notifyChanged();
        m.close();
        ui.toast('ساختار پیشنهادی با ' + U.faNum(blocks.length) + ' تیتر H2 به انتهای مقاله اضافه شد.', 'success');
      });
    });
    var aiInfo = body.querySelector('#ai-info');
    aiInfo && aiInfo.addEventListener('click', function () {
      ui.modal({
        title: 'اتصال سرویس تولید متن',
        body: ui.banner('warn', '<b>این قابلیت هنوز متصل نیست.</b> نوا در نسخهٔ نمایشی بدون کلید API کار می‌کند و ادعای تولید متن ندارد. اتصال آینده از سمت سرور انجام می‌شود و کلید محرمانه هرگز در کد مرورگر قرار نمی‌گیرد.') +
          '<ol class="small muted" style="padding-inline-start:18px;line-height:2">' +
          '<li>یک سرویس واسط سرور برای نوا راه می‌افتد.</li>' +
          '<li>کلید سرویس در متغیر محیطی سرور قرار می‌گیرد.</li>' +
          '<li>مرورگر فقط با سرور خودتان گفت‌وگو می‌کند.</li></ol>',
        footer: '<a class="btn btn-soft" href="#/settings" data-close="1">تنظیمات اتصال‌ها</a>'
      });
    });

    /* خروجی */
    ui.bind(body, 'click', '[data-export]', function (e, btn) {
      var what = btn.getAttribute('data-export');
      Nova.articleEditor.syncAllBlocks();
      if (what === 'copy-html') {
        U.copyText(B.buildArticleHtml(art), function (ok) { ui.toast(ok ? 'کد HTML کپی شد.' : 'کپی انجام نشد.', ok ? 'success' : 'error'); });
      } else if (what === 'dl-html') {
        U.download('nova-' + ((art.settings && art.settings.slug) || art.id) + '.html', B.buildArticleHtml(art), 'text/html');
        ui.toast('فایل HTML دانلود شد.', 'success');
      } else if (what === 'copy-json') {
        U.copyText(JSON.stringify({ app: 'nova-article', schema: 1, exportedAt: new Date().toISOString(), title: art.title, blocks: art.blocks, settings: art.settings, brief: art.brief }, null, 2), function (ok) { ui.toast(ok ? 'JSON کپی شد.' : 'کپی انجام نشد.', ok ? 'success' : 'error'); });
      } else if (what === 'dl-json') {
        U.download('nova-article-' + ((art.settings && art.settings.slug) || art.id) + '.json', JSON.stringify({ app: 'nova-article', schema: 1, exportedAt: new Date().toISOString(), title: art.title, blocks: art.blocks, settings: art.settings, brief: art.brief }, null, 2), 'application/json');
        ui.toast('فایل پشتیبان JSON دانلود شد.', 'success');
      } else if (what === 'import-json') {
        Nova.router.navigate('/content/article');
        ui.toast('برای واردکردن، در فهرست مقاله‌ها از دکمهٔ «واردکردن JSON» استفاده کنید.', 'info');
      }
    });
    ui.bind(body, 'click', '[data-restore]', function (e, btn) {
      var i = parseInt(btn.getAttribute('data-restore'), 10);
      var rv = (art.revisions || [])[i];
      if (!rv) return;
      ui.confirmDialog({
        title: 'بازیابی نسخهٔ خودکار',
        message: 'محتوای فعلی مقاله با نسخهٔ «' + U.faDateTime(new Date(rv.ts)) + '» جایگزین می‌شود. (نسخهٔ فعلی هم به‌عنوان یک نسخهٔ خودکار ذخیره می‌شود.)',
        confirmText: 'بازیابی کن'
      }).then(function (yes) {
        if (!yes) return;
        art.title = rv.title;
        art.blocks = JSON.parse(JSON.stringify(rv.blocks));
        art.settings = Object.assign({}, art.settings, rv.settings);
        Nova.articleEditor.rerenderBlocks();
        Nova.articleEditor.notifyChanged();
        ui.toast('نسخهٔ خودکار بازیابی شد.', 'success');
        paint();
      });
    });
  }

  return {
    render: render,
    refresh: refresh,
    onSaved: onSaved
  };
})();
