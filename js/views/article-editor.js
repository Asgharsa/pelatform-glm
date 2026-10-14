/* ============================================================
   نوا — ویرایشگر مقالهٔ بلوکی
   بلوک‌ها: پاراگراف غنی، H2/H3، فهرست ساده/شماره‌دار، نقل‌قول،
   تصویر، لینک + افزودن/حذف/تکثیر/جابه‌جایی + ذخیرهٔ خودکار با
   تاریخچهٔ نسخه و بازیابی + پیش‌نمایش + شمارش کلمه.
   ============================================================ */
window.Nova = window.Nova || {};

Nova.articleEditor = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui;
  var art = null;               /* مقالهٔ در حال ویرایش */
  var saveTimer = null;
  var save = { status: 'saved', lastAt: null, errNotified: false };
  var statsTimer = null;
  var containerRef = null;

  var BLOCK_TYPES = [
    { id: 'p', label: 'پاراگراف', icon: 'typeText' },
    { id: 'h2', label: 'تیتر H2', icon: 'typeH2' },
    { id: 'h3', label: 'تیتر H3', icon: 'typeH3' },
    { id: 'ul', label: 'فهرست ساده', icon: 'listUl' },
    { id: 'ol', label: 'فهرست شماره‌دار', icon: 'listOl' },
    { id: 'quote', label: 'نقل‌قول', icon: 'quote' },
    { id: 'img', label: 'تصویر', icon: 'image' },
    { id: 'link', label: 'لینک', icon: 'link' }
  ];

  function newBlock(type) {
    var data = null;
    if (type === 'p') data = { html: '' };
    else if (type === 'h2' || type === 'h3' || type === 'quote') data = { text: '', cite: '' };
    else if (type === 'ul' || type === 'ol') data = { items: [''] };
    else if (type === 'img') data = { url: '', alt: '', caption: '' };
    else if (type === 'link') data = { text: '', url: '' };
    return { id: U.uid('blk'), type: type, data: data };
  }

  /* ---------------- ذخیرهٔ خودکار ---------------- */

  function setSaveStatus(status) {
    save.status = status;
    var el = containerRef && containerRef.querySelector('#save-status');
    if (!el) return;
    var cls = 'save-status ' + status;
    var inner = '';
    if (status === 'saving') inner = '<span class="spinner" style="width:10px;height:10px;border-width:1.5px"></span> در حال ذخیره…';
    else if (status === 'saved') inner = Nova.icon('check', '') + ' ذخیره شد' + (save.lastAt ? ' · ' + U.faTime(new Date(save.lastAt)) : '');
    else if (status === 'error') inner = Nova.icon('alertCircle') + ' خطا در ذخیره‌سازی';
    else inner = Nova.icon('clock') + ' آمادهٔ ذخیره';
    el.className = cls;
    el.innerHTML = inner;
  }

  function scheduleSave() {
    if (save.status !== 'error') setSaveStatus('saving');
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, 1200);
  }

  function pushRevision() {
    var now = Date.now();
    var last = art.revisions && art.revisions.length ? art.revisions[0] : null;
    if (last && now - last.ts < 90000) return; /* هر ۹۰ ثانیه یک نسخه */
    var snap = { ts: now, title: art.title, blocks: JSON.parse(JSON.stringify(art.blocks)), settings: JSON.parse(JSON.stringify(art.settings || {})) };
    art.revisions = [snap].concat(art.revisions || []).slice(0, 10);
  }

  function doSave() {
    saveTimer = null;
    if (!art) return;
    pushRevision();
    art.updatedAt = Date.now();
    var r = Nova.store.updateById('articles', art.id, art);
    if (r.result.ok) {
      save.lastAt = Date.now();
      save.errNotified = false;
      setSaveStatus('saved');
    } else {
      setSaveStatus('error');
      if (!save.errNotified) {
        save.errNotified = true;
        ui.toast('ذخیرهٔ خودکار انجام نشد: فضای ذخیره‌سازی مرورگر پر است یا در دسترس نیست. از «خروجی» نسخهٔ پشتیبان بگیرید.', 'error', { duration: 9000 });
      }
    }
    Nova.articlePanel && Nova.articlePanel.onSaved(art);
  }

  function touch() {
    scheduleSave();
    scheduleStats();
  }

  function scheduleStats() {
    if (statsTimer) clearTimeout(statsTimer);
    statsTimer = setTimeout(updateStats, 500);
  }

  function updateStats() {
    if (!containerRef) return;
    var el = containerRef.querySelector('#editor-stats');
    if (el && art) {
      var st = Nova.builders.articleStats(art);
      el.textContent = U.faNum(st.words) + ' کلمه · حدود ' + U.faNum(st.minutes) + ' دقیقه مطالعه · ' + U.faNum(st.blocks) + ' بلوک';
    }
  }

  /* ---------------- رندر بلوک‌ها ---------------- */

  function blockLabel(type) {
    var t = BLOCK_TYPES.filter(function (b) { return b.id === type; })[0];
    return t ? t.label : type;
  }

  function renderBlock(b) {
    var body = '';
    if (b.type === 'p') {
      body = '<div class="editable" contenteditable="true" data-rich="1" data-placeholder="متن پاراگراف را بنویسید…">' + (U.sanitizeRich(b.data.html) || '') + '</div>';
    } else if (b.type === 'h2' || b.type === 'h3') {
      body = '<div class="editable" contenteditable="true" data-plain="1" data-placeholder="' + (b.type === 'h2' ? 'تیتر بخش…' : 'زیرتیتر…') + '">' + ui.esc(b.data.text || '') + '</div>';
    } else if (b.type === 'ul' || b.type === 'ol') {
      body = '<div class="editable" contenteditable="true" data-list="1" data-placeholder="مورد فهرست…"><' + (b.type === 'ul' ? 'ul' : 'ol') + '>' +
        (b.data.items || ['']).map(function (it) { return '<li>' + ui.esc(it) + '</li>'; }).join('') +
        '</' + (b.type === 'ul' ? 'ul' : 'ol') + '></div>' +
        '<button type="button" class="list-add-item" data-action="add-item">+ افزودن مورد</button>';
    } else if (b.type === 'quote') {
      body = '<div class="editable" contenteditable="true" data-plain="1" data-placeholder="متن نقل‌قول…">' + ui.esc(b.data.text || '') + '</div>' +
        '<div class="quote-cite">— <input class="input" style="max-width:280px;display:inline-block;padding:4px 10px;font-size:12px" data-cite="1" placeholder="منبع (اختیاری)" value="' + ui.esc(b.data.cite || '') + '"></div>';
    } else if (b.type === 'img') {
      var d = b.data;
      var safe = Nova.builders.safeImgSrc(d.url);
      body = (safe
        ? '<div class="img-frame"><img src="' + ui.esc(d.url) + '" alt="' + ui.esc(d.alt || '') + '"></div>'
        : (d.url ? '<div class="img-err">نشانی تصویر معتبر نیست (فقط http/https یا data:image).</div>' : '<div class="img-err" style="color:var(--fg-faint)">تصویری انتخاب نشده — نشانی را وارد کنید.</div>')) +
        '<div class="img-fields">' +
        '<div class="field"><label class="field-label">نشانی تصویر</label><input class="input" data-img="url" dir="ltr" style="text-align:left" placeholder="https://…" value="' + ui.esc(d.url || '') + '"></div>' +
        '<div class="field"><label class="field-label">متن جایگزین</label><input class="input" data-img="alt" placeholder="توضیح تصویر برای دسترس‌پذیری" value="' + ui.esc(d.alt || '') + '"></div>' +
        '<div class="field"><label class="field-label">شرح کوتاه</label><input class="input" data-img="caption" placeholder="زیرنویس (اختیاری)" value="' + ui.esc(d.caption || '') + '"></div>' +
        '</div>';
    } else if (b.type === 'link') {
      var l = b.data;
      var shown = U.norm(l.url || '');
      body = '<div class="link-card"><div class="link-fav">' + Nova.icon('link') + '</div>' +
        '<div class="link-meta"><div class="link-title">' + (l.text ? ui.esc(l.text) : 'بدون عنوان') + '</div>' +
        '<div class="link-url">' + (l.url ? ui.esc(l.url) : 'https://') + '</div></div></div>' +
        '<div class="img-fields" style="margin-top:8px;max-width:520px">' +
        '<div class="field"><label class="field-label">متن لینک</label><input class="input" data-link="text" placeholder="عنوان قابل کلیک" value="' + ui.esc(l.text || '') + '"></div>' +
        '<div class="field"><label class="field-label">نشانی</label><input class="input" data-link="url" dir="ltr" style="text-align:left" placeholder="https://…" value="' + ui.esc(l.url || '') + '"></div></div>';
    }
    return '<div class="block block-' + b.type + '" data-block="' + b.id + '">' +
      '<div class="block-head"><span class="block-type">' + blockLabel(b.type) + '</span>' +
      '<div class="block-actions">' +
      ui.iconBtn('bup', 'arrowUp', 'بالا بردن بلوک') +
      ui.iconBtn('bdown', 'arrowDown', 'پایین آوردن بلوک') +
      ui.iconBtn('bdup', 'copy', 'تکثیر بلوک') +
      ui.iconBtn('bdel', 'trash', 'حذف بلوک', 'danger') +
      '</div></div>' +
      '<div class="block-body">' + body + '</div></div>';
  }

  function renderBlocks() {
    var el = containerRef.querySelector('#block-area');
    if (!el) return;
    var html = '';
    (art.blocks || []).forEach(function (b, i) {
      html += renderBlock(b);
      html += '<div class="insert-point"><button type="button" class="ip-btn" data-insert-at="' + i + '" title="افزودن بلوک" aria-label="افزودن بلوک بعد از این">' + Nova.icon('plus') + '</button></div>';
    });
    html += '<div class="insert-point last"><button type="button" class="ip-btn" data-insert-at="' + (art.blocks || []).length + '" title="افزودن بلوک" aria-label="افزودن بلوک در پایان">' + Nova.icon('plus') + '</button></div>';
    el.innerHTML = html;
  }

  /* ---------------- خواندن بلوک‌ها از DOM ---------------- */

  function syncBlockFromDom(blockEl) {
    var id = blockEl.getAttribute('data-block');
    var b = art.blocks.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    if (b.type === 'p') {
      var ed = blockEl.querySelector('[data-rich]');
      b.data.html = U.sanitizeRich(ed ? ed.innerHTML : '');
    } else if (b.type === 'h2' || b.type === 'h3' || b.type === 'quote') {
      var ed2 = blockEl.querySelector('[data-plain]');
      b.data.text = ed2 ? ed2.textContent.trim() : '';
      var cite = blockEl.querySelector('[data-cite]');
      if (cite) b.data.cite = cite.value.trim();
    } else if (b.type === 'ul' || b.type === 'ol') {
      var ed3 = blockEl.querySelector('[data-list]');
      if (ed3) {
        b.data.items = Array.prototype.map.call(ed3.querySelectorAll('li'), function (li) { return li.textContent.trim(); });
      }
    } else if (b.type === 'img') {
      b.data.url = (blockEl.querySelector('[data-img="url"]') || {}).value || '';
      b.data.alt = (blockEl.querySelector('[data-img="alt"]') || {}).value || '';
      b.data.caption = (blockEl.querySelector('[data-img="caption"]') || {}).value || '';
    } else if (b.type === 'link') {
      b.data.text = (blockEl.querySelector('[data-link="text"]') || {}).value || '';
      b.data.url = (blockEl.querySelector('[data-link="url"]') || {}).value || '';
    }
  }

  function syncAllBlocks() {
    ui.qsa('.block', containerRef).forEach(syncBlockFromDom);
  }

  function findBlockIndex(id) {
    for (var i = 0; i < art.blocks.length; i++) if (art.blocks[i].id === id) return i;
    return -1;
  }

  /* ---------------- منوی افزودن بلوک ---------------- */

  function openInsertMenu(anchorBtn, insertIndex) {
    var menu = document.createElement('div');
    menu.className = 'block-type-menu';
    menu.innerHTML = BLOCK_TYPES.map(function (t) {
      return '<button type="button" data-type="' + t.id + '">' + Nova.icon(t.icon) + ui.esc(t.label) + '</button>';
    }).join('');
    document.body.appendChild(menu);
    var rect = anchorBtn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = Math.min(rect.left, window.innerWidth - 230) + 'px';
    menu.style.top = Math.min(rect.top - 6, window.innerHeight - 320) + 'px';
    function closeMenu() { if (menu.parentNode) menu.parentNode.removeChild(menu); document.removeEventListener('mousedown', onDoc, true); }
    function onDoc(e) { if (!menu.contains(e.target)) closeMenu(); }
    setTimeout(function () { document.addEventListener('mousedown', onDoc, true); }, 0);
    menu.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var type = btn.getAttribute('data-type');
      closeMenu();
      art.blocks.splice(insertIndex, 0, newBlock(type));
      renderBlocks();
      touch();
      var newEl = containerRef.querySelector('.block[data-block="' + art.blocks[insertIndex].id + '"] .editable, .block[data-block="' + art.blocks[insertIndex].id + '"] [data-img="url"]');
      if (newEl) newEl.focus();
    });
  }

  /* ---------------- نوار قالب‌بندی شناور ---------------- */

  function initFormatBar() {
    var bar = document.createElement('div');
    bar.className = 'format-bar';
    bar.style.display = 'none';
    bar.innerHTML =
      '<button type="button" data-fmt="bold" aria-label="پررنگ" title="پررنگ (Ctrl+B)">' + Nova.icon('bold') + '</button>' +
      '<button type="button" data-fmt="italic" aria-label="کج" title="کج (Ctrl+I)">' + Nova.icon('italic') + '</button>' +
      '<span class="sep"></span>' +
      '<button type="button" data-fmt="link" aria-label="تبدیل به لینک" title="تبدیل به لینک">' + Nova.icon('link') + '</button>' +
      '<button type="button" data-fmt="unlink" aria-label="حذف لینک" title="حذف لینک">' + Nova.icon('x') + '</button>';
    document.body.appendChild(bar);

    function activeEditable() {
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      var node = sel.anchorNode;
      var el = node && node.nodeType === 3 ? node.parentElement : node;
      return el && el.closest && el.closest('.editable[data-rich]');
    }

    document.addEventListener('selectionchange', function () {
      var ed = activeEditable();
      if (!ed) { bar.style.display = 'none'; return; }
      var sel = window.getSelection();
      var range = sel.getRangeAt(0);
      var r = range.getBoundingClientRect();
      if (!r || (!r.width && !r.height)) { bar.style.display = 'none'; return; }
      bar.style.display = 'flex';
      var top = r.top - 46;
      if (top < 8) top = r.bottom + 10;
      bar.style.left = Math.min(Math.max(10, r.left + r.width / 2), window.innerWidth - 150) + 'px';
      bar.style.top = top + 'px';
    });

    bar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var fmt = btn.getAttribute('data-fmt');
      var ed = activeEditable();
      if (!ed) return;
      ed.focus();
      if (fmt === 'bold') { document.execCommand('bold'); }
      else if (fmt === 'italic') { document.execCommand('italic'); }
      else if (fmt === 'unlink') { document.execCommand('unlink'); }
      else if (fmt === 'link') {
        var cur = document.queryCommandValue('createLink') || '';
        ui.formModal({
          title: 'افزودن لینک',
          grid: false,
          submitText: 'اعمال',
          fields: [{ key: 'url', label: 'نشانی', type: 'url', required: true, dirLtr: true, value: cur === 'false' ? '' : cur, hint: 'فقط نشانی http/https یا ایمیل' }]
        }).then(function (values) {
          if (!values) return;
          document.execCommand('createLink', false, values.url.trim());
        });
      }
      var ev = new Event('input', { bubbles: true });
      ed.dispatchEvent(ev);
    });
  }

  /* ---------------- پیش‌نمایش ---------------- */

  function openPreview() {
    syncAllBlocks();
    var st = Nova.builders.articleStats(art);
    var set = art.settings || {};
    var body = (art.blocks || []).map(Nova.builders.blockToHtml).join('\n');
    var featured = set.featuredImage && Nova.builders.safeImgSrc(set.featuredImage)
      ? '<figure><img src="' + ui.esc(set.featuredImage) + '" alt="' + ui.esc(set.featuredAlt || '') + '"></figure>' : '';
    var meta = '<span class="badge badge-tool">' + ui.esc(Nova.options.label(Nova.options.categories, set.category) || 'عمومی') + '</span>' +
      '<span>' + ui.esc(set.author || 'نویسندهٔ ناشناس') + '</span><span>·</span><span>' + U.faRelative(art.updatedAt || Date.now()) + '</span>' +
      '<span>·</span><span>' + U.faNum(st.words) + ' کلمه</span>';
    var m = ui.modal({
      title: 'پیش‌نمایش مقاله',
      size: 'lg',
      body: '<div class="article-preview">' +
        '<h1>' + ui.esc(art.title || 'بدون عنوان') + '</h1>' +
        '<div class="ap-meta">' + meta + '</div>' +
        featured + body + '</div>'
    });
  }

  /* ---------------- رندر اصلی ---------------- */

  function render(container, params) {
    var id = params.id;
    var stored = Nova.store.getById('articles', id);
    if (!stored) {
      container.innerHTML = '<div class="card">' + ui.emptyState({
        icon: 'alertCircle', title: 'مقاله پیدا نشد',
        desc: 'این مقاله حذف شده یا نشانی نادرست است.',
        action: '<a class="btn btn-soft" href="#/content/article">بازگشت به فهرست مقاله‌ها</a>'
      }) + '</div>';
      return;
    }
    /* نمونه‌ها دست‌نخورده می‌مانند؛ ویرایش روی کپی انجام می‌شود */
    if (stored.demo) {
      var copy = JSON.parse(JSON.stringify(stored));
      copy.id = U.uid('art');
      copy.demo = false;
      copy.status = 'draft';
      copy.title = (stored.title || 'بدون عنوان') + ' (کپی من)';
      copy.revisions = [];
      Nova.store.insert('articles', copy);
      ui.toast('مقالهٔ نمونه دست‌نخورده ماند؛ روی کپی خودتان ویرایش می‌کنید.', 'info');
      Nova.router.navigate('/content/article/edit/' + copy.id);
      return;
    }
    art = JSON.parse(JSON.stringify(stored));
    containerRef = container;
    save.status = 'saved';

    container.innerHTML =
      '<div class="view-enter">' +
      '<div class="row-between" style="margin-bottom:14px">' +
      '<div class="row">' +
      '<a class="btn btn-ghost btn-sm" href="#/content/article">' + Nova.icon('chevronStart') + ' فهرست مقاله‌ها</a>' +
      '<span id="save-status" class="save-status saved"></span>' +
      '</div>' +
      '<div class="row">' +
      '<button class="btn btn-ghost" data-action="status-toggle">' + (art.status === 'done' ? 'برگرداندن به پیش‌نویس' : 'علامت‌گذاری تکمیل‌شده') + '</button>' +
      '<button class="btn btn-ghost editor-panel-toggle" data-action="panel">' + Nova.icon('settings') + ' تنظیمات و سئو</button>' +
      '<button class="btn btn-soft" data-action="preview">' + Nova.icon('eye') + ' پیش‌نمایش</button>' +
      '</div></div>' +

      '<div class="editor-layout">' +
      '<div>' +
      '<div class="editor-toolbar">' +
      '<span class="caption">ویرایشگر بلوکی</span>' +
      '<span class="grow"></span>' +
      '<button class="btn btn-plain btn-sm" data-action="add-end">' + Nova.icon('plus') + ' افزودن بلوک</button>' +
      '</div>' +
      '<div class="editor-surface">' +
      '<input class="article-title-input" id="art-title" placeholder="عنوان مقاله…" value="' + ui.esc(art.title || '') + '">' +
      '<div id="block-area"></div>' +
      '<button class="add-block-btn" data-action="add-end">' + Nova.icon('plus') + ' افزودن بلوک</button>' +
      '</div>' +
      '<div class="editor-statusbar"><span id="editor-stats"></span><span class="grow"></span>' +
      '<span class="caption">ذخیرهٔ خودکار فعال است · میان‌بر Ctrl+S برای ذخیرهٔ فوری</span></div>' +
      '</div>' +
      '<div class="editor-panel" id="editor-panel"></div>' +
      '</div>';

    renderBlocks();
    setSaveStatus('saved');
    updateStats();
    Nova.articlePanel.render(container.querySelector('#editor-panel'), art);

    /* ---- عنوان ---- */
    var titleEl = container.querySelector('#art-title');
    titleEl.addEventListener('input', function () {
      art.title = titleEl.value;
      touch();
      Nova.articlePanel.refresh(art);
    });

    /* ---- رویدادهای سطح ویرایشگر ---- */
    container.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('.editable, .img-fields, [data-cite]')) {
        var bl = t.closest('.block');
        if (bl) syncBlockFromDom(bl);
        touch();
      }
    });
    container.addEventListener('focusin', function (e) {
      var bl = e.target.closest && e.target.closest('.block');
      if (bl) bl.classList.add('focus');
    });
    container.addEventListener('focusout', function (e) {
      var bl = e.target.closest && e.target.closest('.block');
      if (bl) bl.classList.remove('focus');
    });

    ui.bind(container, 'click', '[data-action]', function (e, btn) {
      var action = btn.getAttribute('data-action');
      if (action === 'preview') openPreview();
      else if (action === 'panel') togglePanel();
      else if (action === 'add-end') {
        var ip = container.querySelector('.insert-point.last .ip-btn');
        if (ip) openInsertMenu(ip, (art.blocks || []).length);
      }
      else if (action === 'status-toggle') {
        art.status = art.status === 'done' ? 'draft' : 'done';
        btn.textContent = art.status === 'done' ? 'برگرداندن به پیش‌نویس' : 'علامت‌گذاری تکمیل‌شده';
        touch();
        ui.toast(art.status === 'done' ? 'مقاله به‌عنوان تکمیل‌شده علامت خورد.' : 'مقاله به پیش‌نویس برگشت.', 'success');
      }
    });

    /* رویدادهای بلوک‌ها */
    ui.bind(container, 'click', '.block-actions [data-action]', function (e, btn) {
      var blockEl = btn.closest('.block');
      var id = blockEl.getAttribute('data-block');
      var idx = findBlockIndex(id);
      if (idx === -1) return;
      var act = btn.getAttribute('data-action');
      if (act === 'bdel') {
        art.blocks.splice(idx, 1);
        renderBlocks(); touch();
      } else if (act === 'bdup') {
        var c = JSON.parse(JSON.stringify(art.blocks[idx]));
        c.id = U.uid('blk');
        art.blocks.splice(idx + 1, 0, c);
        renderBlocks(); touch();
      } else if (act === 'bup' && idx > 0) {
        var tmp = art.blocks[idx - 1]; art.blocks[idx - 1] = art.blocks[idx]; art.blocks[idx] = tmp;
        renderBlocks(); touch();
        focusBlock(art.blocks[idx - 1].id);
      } else if (act === 'bdown' && idx < art.blocks.length - 1) {
        var tmp2 = art.blocks[idx + 1]; art.blocks[idx + 1] = art.blocks[idx]; art.blocks[idx] = tmp2;
        renderBlocks(); touch();
        focusBlock(art.blocks[idx + 1].id);
      }
    });

    ui.bind(container, 'click', '[data-insert-at]', function (e, btn) {
      openInsertMenu(btn, parseInt(btn.getAttribute('data-insert-at'), 10) + 0);
    });

    ui.bind(container, 'click', '[data-action="add-item"]', function (e, btn) {
      var bl = btn.closest('.block');
      var list = bl.querySelector('[data-list] ul, [data-list] ol');
      if (!list) return;
      var li = document.createElement('li');
      li.innerHTML = '<br>';
      list.appendChild(li);
      var range = document.createRange();
      range.setStart(li, 0); range.collapse(true);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      syncBlockFromDom(bl);
      touch();
    });

    /* میان‌بر Ctrl+S و Ctrl+Shift+P */
    container.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        syncAllBlocks();
        doSave();
        ui.toast('ذخیرهٔ فوری انجام شد.', 'success');
      }
    });
    window.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P') && !e.shiftKey && Nova.router.path().indexOf('/content/article/edit') === 0) {
        e.preventDefault();
        openPreview();
      }
    });
  }

  function focusBlock(id) {
    var el = containerRef.querySelector('.block[data-block="' + id + '"] .editable');
    if (el) el.focus();
  }

  function togglePanel() {
    var p = containerRef && containerRef.querySelector('#editor-panel');
    if (!p) return;
    p.classList.toggle('open');
    if (p.classList.contains('open')) {
      var back = containerRef.querySelector('.editor-backdrop');
      if (!back) {
        back = document.createElement('div');
        back.className = 'backdrop show editor-backdrop';
        back.style.zIndex = '74';
        containerRef.appendChild(back);
        back.addEventListener('click', togglePanel);
      }
    } else {
      var b = containerRef.querySelector('.editor-backdrop');
      if (b && b.parentNode) b.parentNode.removeChild(b);
    }
  }

  /* ---------------- ساخت مقالهٔ جدید ---------------- */

  function createNew() {
    var art2 = {
      id: U.uid('art'),
      demo: false,
      status: 'draft',
      title: '',
      blocks: [newBlock('p')],
      settings: { author: '', category: 'general', tags: [], excerpt: '', featuredImage: '', featuredAlt: '', slug: '', seoTitle: '', metaDesc: '', keyword: '', publishDate: '' },
      brief: null,
      revisions: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    var r = Nova.store.insert('articles', art2);
    if (!r.result.ok) {
      ui.toast('ساخت مقاله انجام نشد؛ فضای ذخیره‌سازی مرورگر در دسترس نیست.', 'error');
      return null;
    }
    Nova.router.navigate('/content/article/edit/' + art2.id);
    return art2;
  }

  /* ---------------- API برای پنل ---------------- */

  function currentArticle() { return art; }
  function notifyChanged() { touch(); Nova.articlePanel.refresh(art); }
  function rerenderBlocks() { renderBlocks(); }
  function panelContainer() { return containerRef && containerRef.querySelector('#editor-panel'); }

  return {
    render: render,
    createNew: createNew,
    currentArticle: currentArticle,
    notifyChanged: notifyChanged,
    rerenderBlocks: rerenderBlocks,
    panelContainer: panelContainer,
    syncAllBlocks: syncAllBlocks,
    openPreview: openPreview,
    initFormatBar: initFormatBar,
    newBlock: newBlock,
    BLOCK_TYPES: BLOCK_TYPES
  };
})();
