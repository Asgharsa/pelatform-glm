/* ============================================================
   نوا — اجزای مشترک رابط کاربری
   اعلان، مُدال، تأیید، فرم‌ساز، برچسب، بنر، حالت خالی، اعتبارسنجی
   ============================================================ */
window.Nova = window.Nova || {};

Nova.ui = (function () {
  'use strict';

  var U = null; // shortcut به utils (برای دور از وابستگی چرخشی دیر مقداردهی می‌شود)

  function esc(s) { return (U || Nova.utils).escapeHtml(s); }
  function fa(n) { return (U || Nova.utils).faNum(n); }

  /* ---------- DOM ---------- */

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = String(html).trim();
    return t.content.firstElementChild;
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /** delegatio رویداد */
  function bind(root, eventName, selector, handler) {
    (root || document).addEventListener(eventName, function (e) {
      var target = e.target.closest(selector);
      if (target && (root || document).contains(target)) handler(e, target);
    });
  }

  /* ---------- اعلان ---------- */

  function toastZone() {
    var z = document.querySelector('.toast-zone');
    if (!z) {
      z = document.createElement('div');
      z.className = 'toast-zone';
      z.setAttribute('role', 'status');
      z.setAttribute('aria-live', 'polite');
      document.body.appendChild(z);
    }
    return z;
  }

  var TOAST_ICON = { success: 'checkCircle', error: 'alertCircle', warn: 'alertTriangle', info: 'info' };

  function toast(msg, type, opts) {
    type = type || 'info';
    opts = opts || {};
    var z = toastZone();
    while (z.children.length >= 4) z.removeChild(z.firstChild);
    var t = el('<div class="toast ' + type + '">' + Nova.icon(TOAST_ICON[type]) + '<div class="grow">' + msg + '</div></div>');
    z.appendChild(t);
    var timer = null;
    function dismiss() {
      if (!t.parentNode) return;
      t.style.transition = 'opacity .25s, transform .25s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(6px)';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }
    function arm() { timer = setTimeout(dismiss, opts.duration || 4200); }
    function pause() { if (timer) { clearTimeout(timer); timer = null; } }
    t.addEventListener('mouseenter', pause);
    t.addEventListener('focusin', pause);
    t.addEventListener('mouseleave', arm);
    t.addEventListener('focusout', arm);
    t.setAttribute('tabindex', '0');
    arm();
    return { dismiss: dismiss };
  }

  /* ---------- مُدال ---------- */

  var modalStack = [];

  function modal(opts) {
    opts = opts || {};
    var back = el('<div class="modal-backdrop"></div>');
    var m = el('<div class="modal ' + (opts.size === 'lg' ? 'modal-lg' : opts.size === 'sm' ? 'modal-sm' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || 'پنجره') + '"></div>');
    var head = el('<div class="modal-head"><div class="modal-title">' + (opts.title || '') + '</div></div>');
    var closeBtn = el('<button class="icon-btn" aria-label="بستن">' + Nova.icon('x') + '</button>');
    head.appendChild(closeBtn);
    var body = el('<div class="modal-body"></div>');
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);
    m.appendChild(head);
    m.appendChild(body);
    var foot = null;
    if (opts.footer) {
      foot = el('<div class="modal-foot"></div>');
      if (typeof opts.footer === 'string') foot.innerHTML = opts.footer;
      else foot.appendChild(opts.footer);
      m.appendChild(foot);
    }
    back.appendChild(m);
    document.body.appendChild(back);

    function close() {
      if (!back.parentNode) return;
      document.body.removeChild(back);
      var idx = modalStack.indexOf(api);
      if (idx > -1) modalStack.splice(idx, 1);
      if (opts.onClose) opts.onClose();
      try { m.dispatchEvent(new CustomEvent('ui-closed')); } catch (e) { /* noop */ }
    }
    closeBtn.addEventListener('click', close);
    if (opts.dismissable !== false) {
      back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    }
    function onKey(e) {
      if (e.key === 'Escape' && modalStack[modalStack.length - 1] === api) {
        e.stopPropagation();
        close();
      }
    }
    document.addEventListener('keydown', onKey, true);

    var api = { el: m, body: body, footer: foot, close: close };
    modalStack.push(api);
    var firstInput = m.querySelector('input, select, textarea, button:not([aria-label="بستن"])');
    setTimeout(function () { (firstInput || closeBtn).focus(); }, 40);
    return api;
  }

  function confirmDialog(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var body = el('<div class="stack">' +
        '<p class="muted" style="font-size:var(--fs-small);line-height:1.8">' + (opts.message || 'آیا مطمئن هستید؟') + '</p>' +
        (opts.extra || '') + '</div>');
      var foot = el('<div class="row"></div>');
      var cancel = el('<button class="btn btn-ghost">انصراف</button>');
      var ok = el('<button class="btn ' + (opts.danger ? 'btn-danger-solid' : 'btn-primary') + '">' + esc(opts.confirmText || 'تأیید') + '</button>');
      foot.appendChild(cancel);
      foot.appendChild(ok);
      var m = modal({
        title: opts.title || 'تأیید عملیات',
        body: body,
        footer: foot,
        size: 'sm',
        onClose: function () { resolve(false); }
      });
      cancel.addEventListener('click', m.close);
      ok.addEventListener('click', function () {
        m.el.setAttribute('data-resolved', '1');
        resolve(true);
        m.close();
      });
    });
  }

  /* ---------- فرم‌ساز عمومی ---------- */

  function fieldHtml(f) {
    var id = 'f-' + f.key + '-' + Math.random().toString(36).slice(2, 6);
    var hintId = id + '-hint';
    var errId = id + '-err';
    var control = '';
    var v = f.value == null ? '' : f.value;
    var attrs = 'id="' + id + '" data-field="' + f.key + '" data-label="' + esc(f.label) + '"' +
      (f.required ? ' data-required="1"' : '') +
      ' aria-describedby="' + hintId + ' ' + errId + '"';

    if (f.type === 'textarea') {
      control = '<textarea class="textarea" ' + attrs + ' placeholder="' + esc(f.placeholder || '') + '">' + esc(v) + '</textarea>';
    } else if (f.type === 'select') {
      control = '<select class="select" ' + attrs + '>' +
        (f.placeholder ? '<option value="">' + esc(f.placeholder) + '</option>' : '') +
        (f.options || []).map(function (o) {
          return '<option value="' + esc(o.value) + '"' + (String(o.value) === String(v) ? ' selected' : '') + '>' + esc(o.label) + '</option>';
        }).join('') + '</select>';
    } else {
      control = '<input class="input" type="' + (f.type || 'text') + '" ' + attrs + ' value="' + esc(v) + '" placeholder="' + esc(f.placeholder || '') + '"' + (f.dirLtr ? ' dir="ltr" style="text-align:left"' : '') + '>';
    }
    return '<div class="field' + (f.full ? ' full' : '') + '">' +
      '<label class="field-label" for="' + id + '">' + esc(f.label) + (f.required ? '<span class="req">*</span>' : '') + '</label>' +
      control +
      (f.hint ? '<div class="field-hint" id="' + hintId + '">' + f.hint + '</div>' : '<span class="visually-hidden" id="' + hintId + '"></span>') +
      '<div class="field-error" id="' + errId + '" role="alert"></div>' +
      '</div>';
  }

  /** اعتبارسنجی یک فیلد؛ خروجی: رشتهٔ خطا یا '' */
  function validateField(f, value, values) {
    var v = String(value == null ? '' : value).trim();
    if (f.required && !v) return 'این فیلد الزامی است.';
    if (!v) return '';
    if (f.type === 'email' && !Nova.utils.validateEmail(v)) return 'نشانی ایمیل معتبر نیست.';
    if (f.type === 'url' && !/^https?:\/\/.+\..+/i.test(v)) return 'نشانی باید با http یا https شروع شود.';
    if (f.type === 'number') {
      var n = Number(v);
      if (isNaN(n)) return 'عدد معتبر وارد کنید.';
      if (f.min != null && n < f.min) return 'حداقل ' + fa(f.min) + ' مجاز است.';
      if (f.max != null && n > f.max) return 'حداکثر ' + fa(f.max) + ' مجاز است.';
    }
    if (f.validate) return f.validate(v, values) || '';
    return '';
  }

  function showFieldError(root, key, err) {
    var field = qs('[data-field="' + key + '"]', root);
    if (!field) return;
    var wrap = field.closest('.field');
    var errEl = wrap ? qs('.field-error', wrap) : null;
    if (field.classList) field.classList.toggle('invalid', !!err);
    if (errEl) {
      errEl.textContent = err || '';
      if (err) errEl.setAttribute('role', 'alert'); else errEl.removeAttribute('role');
    }
  }

  /**
   * مُدال فرم عمومی — خروجی Promise با مقادیر یا null.
   * fields: [{key,label,type,options,required,hint,placeholder,value,full,validate,dirLtr}]
   */
  function formModal(opts) {
    var fields = opts.fields || [];
    return new Promise(function (resolve) {
      var form = el('<form class="stack" novalidate></form>');
      var gridCls = opts.grid === false ? 'stack' : 'grid grid-2';
      var grid = el('<div class="' + gridCls + '"></div>');
      fields.forEach(function (f) {
        var html = fieldHtml(f);
        if (opts.grid === false) { form.appendChild(el(html)); return; }
        var wrap = el('<div style="display:contents"></div>');
        wrap.innerHTML = html;
        var node = wrap.firstElementChild;
        if (f.full) node.style.gridColumn = '1 / -1';
        grid.appendChild(node);
      });
      if (opts.grid !== false) form.appendChild(grid);

      var foot = el('<div class="row"></div>');
      var cancel = el('<button type="button" class="btn btn-ghost">انصراف</button>');
      var submit = el('<button type="submit" class="btn btn-primary">' + esc(opts.submitText || 'ذخیره') + '</button>');
      foot.appendChild(cancel);
      foot.appendChild(submit);

      var m = modal({ title: opts.title || 'فرم', body: form, footer: foot, size: opts.size });
      var settled = false;
      m.el.addEventListener('ui-closed', function () { if (!settled) resolve(null); });

      function collect() {
        var values = {};
        fields.forEach(function (f) {
          var node = qs('[data-field="' + f.key + '"]', form);
          values[f.key] = node ? node.value : '';
        });
        return values;
      }

      /* اعتبارسنجی روی blur */
      bind(form, 'blur', '[data-field]', function (e, target) {
        var key = target.getAttribute('data-field');
        var f = fields.find(function (x) { return x.key === key; });
        if (!f) return;
        var err = validateField(f, target.value, collect());
        showFieldError(form, key, err);
      });
      bind(form, 'input', '[data-field]', function (e, target) {
        var key = target.getAttribute('data-field');
        var f = fields.find(function (x) { return x.key === key; });
        if (!f) return;
        var wrap = target.closest('.field');
        var errEl = wrap ? qs('.field-error', wrap) : null;
        if (errEl && errEl.textContent) {
          var err = validateField(f, target.value, collect());
          showFieldError(form, key, err);
        }
      });

      cancel.addEventListener('click', function () { m.close(); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var values = collect();
        var firstBad = null;
        var allOk = true;
        fields.forEach(function (f) {
          var err = validateField(f, values[f.key], values);
          showFieldError(form, f.key, err);
          if (err) { allOk = false; if (!firstBad) firstBad = f.key; }
        });
        if (!allOk) {
          var node = qs('[data-field="' + firstBad + '"]', form);
          if (node) node.focus();
          return;
        }
        settled = true;
        resolve(values);
        m.close();
      });
    });
  }

  /* ---------- سازنده‌های HTML ---------- */

  function badge(type, text, extraCls) {
    return '<span class="badge ' + type + (extraCls ? ' ' + extraCls : '') + '">' + text + '</span>';
  }

  function banner(type, html) {
    var iconMap = { info: 'info', warn: 'alertTriangle', danger: 'alertCircle', success: 'checkCircle' };
    return '<div class="banner banner-' + type + '" role="note">' + Nova.icon(iconMap[type] || 'info') + '<div class="grow">' + html + '</div></div>';
  }

  function emptyState(o) {
    return '<div class="empty">' +
      '<div class="empty-illu">' + Nova.icon(o.icon || 'inbox') + '</div>' +
      '<div class="empty-title">' + esc(o.title || 'چیزی اینجا نیست') + '</div>' +
      '<div class="empty-desc">' + esc(o.desc || '') + '</div>' +
      (o.action || '') + '</div>';
  }

  function iconBtn(action, icon, title, cls) {
    return '<button class="icon-btn ' + (cls || '') + '" data-action="' + action + '" title="' + esc(title) + '" aria-label="' + esc(title) + '">' + Nova.icon(icon) + '</button>';
  }

  /** کارت‌های تک‌گزینی — data-value روی هر کارت */
  function optCards(name, items, selected) {
    return '<div class="opt-cards" data-field="' + name + '" role="radiogroup" aria-label="' + esc(name) + '">' +
      items.map(function (it) {
        return '<button type="button" class="opt-card' + (it.id === selected ? ' on' : '') + '" data-value="' + esc(it.id) + '" aria-pressed="' + (it.id === selected ? 'true' : 'false') + '">' +
          '<span class="tick">' + Nova.icon('check') + '</span>' +
          (it.icon ? Nova.icon(it.icon) : '') +
          '<span>' + esc(it.label) + '</span></button>';
      }).join('') + '</div>';
  }

  /** چیپ‌های چندگزینی */
  function chipsHtml(name, items, selectedArr) {
    return '<div class="chips" data-field="' + name + '">' +
      items.map(function (it) {
        var on = (selectedArr || []).indexOf(it.id) > -1;
        return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-value="' + esc(it.id) + '" aria-pressed="' + on + '">' + esc(it.label) + '</button>';
      }).join('') + '</div>';
  }

  /**
   * خواندن وضعیت فرم: ورودی‌های data-field معمولی + opt-cards (تک‌گزین)
   * و chips (چندگزین). خروجی: {key: value | value[]}
   */
  function collectForm(root) {
    var out = {};
    qsa('[data-field]', root).forEach(function (node) {
      var key = node.getAttribute('data-field');
      if (node.classList.contains('opt-cards')) {
        var on = qs('.opt-card.on', node);
        out[key] = on ? on.getAttribute('data-value') : '';
      } else if (node.classList.contains('chips')) {
        out[key] = qsa('.chip.on', node).map(function (c) { return c.getAttribute('data-value'); });
      } else if (node.type === 'checkbox') {
        out[key] = node.checked;
      } else {
        out[key] = node.value;
      }
    });
    return out;
  }

  /** رفتار تعاملی opt-cards و chips داخل یک ریشه */
  function initSelectors(root) {
    bind(root, 'click', '.opt-cards .opt-card', function (e, card) {
      var group = card.closest('.opt-cards');
      qsa('.opt-card', group).forEach(function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
      card.classList.add('on');
      card.setAttribute('aria-pressed', 'true');
      group.dispatchEvent(new CustomEvent('formchange', { bubbles: true }));
    });
    bind(root, 'click', '.chips .chip', function (e, chip) {
      if (chip.classList.contains('chip-add')) return;
      chip.classList.toggle('on');
      chip.setAttribute('aria-pressed', chip.classList.contains('on') ? 'true' : 'false');
      chip.closest('.chips').dispatchEvent(new CustomEvent('formchange', { bubbles: true }));
    });
  }

  /* ---------- حالت‌های خطا/یافت‌نشد ---------- */

  function renderError(container, e) {
    var msg = e && e.message ? String(e.message) : '';
    container.innerHTML = '<div class="card" style="margin-top:10px">' +
      banner('danger', '<b>خطای غیرمنتظره در نمایش این صفحه.</b> جزئیات فنی در کنسول مرورگر ثبت شد. می‌توانید صفحه را نوسازی کنید یا به داشبورد بازگردید.' + (msg ? '<div class="mono" style="margin-top:8px;font-size:11px">' + (U || Nova.utils).escapeHtml(msg) + '</div>' : '')) +
      '<div class="row"><button class="btn btn-ghost" onclick="location.reload()">نوسازی صفحه</button>' +
      '<a class="btn btn-soft" href="#/dashboard">بازگشت به داشبورد</a></div></div>';
  }

  function renderNotFound(container, path) {
    container.innerHTML = '<div class="card" style="margin-top:10px">' +
      emptyState({ icon: 'search', title: 'این مسیر پیدا نشد', desc: 'نشانی «' + path + '» در ماژول‌های نوا وجود ندارد. از منوی کناری مسیر دلخواه را انتخاب کنید.', action: '<a class="btn btn-soft" href="#/dashboard">رفتن به داشبورد</a>' }) +
      '</div>';
  }

  /* ---------- سوییچ ---------- */

  function switchHtml(name, checked, label, key) {
    var id = 'sw-' + name + '-' + (key || '');
    return '<label class="switch" for="' + id + '">' +
      '<input type="checkbox" id="' + id + '" data-field="' + name + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="switch-track"></span>' +
      (label ? '<span class="switch-label">' + esc(label) + '</span>' : '') +
      '</label>';
  }

  function init(Utility) { U = Nova.utils; }

  return {
    el: el, qs: qs, qsa: qsa, bind: bind,
    toast: toast, modal: modal, confirmDialog: confirmDialog,
    formModal: formModal, fieldHtml: fieldHtml, validateField: validateField, showFieldError: showFieldError,
    badge: badge, banner: banner, emptyState: emptyState, iconBtn: iconBtn,
    optCards: optCards, chipsHtml: chipsHtml, switchHtml: switchHtml,
    collectForm: collectForm, initSelectors: initSelectors,
    renderError: renderError, renderNotFound: renderNotFound,
    esc: esc, fa: fa,
    init: init
  };
})();
