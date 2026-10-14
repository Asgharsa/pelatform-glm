/* ============================================================
   نوا — ابزارهای پایه (بدون وابستگی به DOM)
   اعداد فارسی، تقویم جلالی، گریز و پاک‌سازی HTML، اعتبارسنجی
   این فایل در Node هم بارگذاری و آزموده می‌شود.
   ============================================================ */
window.Nova = window.Nova || {};

Nova.utils = (function () {
  'use strict';

  var FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  /* ---------- اعداد و زمان ---------- */

  function faNum(x) {
    return String(x).replace(/[0-9]/g, function (d) { return FA_DIGITS[+d]; });
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  var FA_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  var FA_WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

  /* ---------- تقویم جلالی (الگوریتم استاندارد jalaali) ---------- */

  function div(a, b) { return Math.trunc(a / b); }
  function mod(a, b) { return a - Math.trunc(a / b) * b; }

  var BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

  function jalCal(jy, withoutLeap) {
    var bl = BREAKS.length, gy = jy + 621, leapJ = -14, jp = BREAKS[0], jm, jump, leap, n, i;
    if (jy < jp || jy >= BREAKS[bl - 1]) throw new Error('Invalid Jalaali year ' + jy);
    for (i = 1; i < bl; i += 1) {
      jm = BREAKS[i];
      jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    var leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    var march = 20 + leapJ - leapG;
    if (!withoutLeap) {
      if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
      leap = mod(mod(n + 1, 33) - 1, 4);
      if (leap === -1) leap = 4;
    }
    return { leap: leap, gy: gy, march: march };
  }

  function g2d(gy, gm, gd) {
    var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }

  function d2g(jdn) {
    var j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    var i = div(mod(j, 1461), 4) * 5 + 308;
    var gd = div(mod(i, 153), 5) + 1;
    var gm = mod(div(i, 153), 12) + 1;
    var gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
  }

  function j2d(jy, jm, jd) {
    var r = jalCal(jy, true);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }

  function d2j(jdn) {
    var gy = d2g(jdn).gy, jy = gy - 621, r = jalCal(jy);
    var jdn1f = g2d(gy, 3, r.march), k = jdn - jdn1f, jm, jd;
    if (k >= 0) {
      if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy: jy, jm: jm, jd: jd }; }
      k -= 186;
    } else {
      jy -= 1; k += 179;
      if (r.leap === 1) k += 1;
    }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
    return { jy: jy, jm: jm, jd: jd };
  }

  function toJalaali(date) {
    return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()));
  }

  function toGregorian(jy, jm, jd) {
    return d2g(j2d(jy, jm, jd));
  }

  function isLeapJalaali(jy) { return jalCal(jy).leap === 0; }

  function jalaaliMonthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isLeapJalaali(jy) ? 30 : 29;
  }

  /** «۲۲ مهر ۱۴۰۵» */
  function faDate(date) {
    var j = toJalaali(date);
    return faNum(j.jd) + ' ' + FA_MONTHS[j.jm - 1] + ' ' + faNum(j.jy);
  }

  /** «۱۴:۳۲» */
  function faTime(date) {
    return faNum(pad2(date.getHours())) + ':' + faNum(pad2(date.getMinutes()));
  }

  function faDateTime(date) { return faDate(date) + '، ' + faTime(date); }

  /** زمان نسبی: «۳ دقیقه پیش» */
  function faRelative(ts) {
    var diff = Date.now() - ts;
    if (diff < 0) diff = 0;
    var min = Math.floor(diff / 60000);
    if (min < 1) return 'همین حالا';
    if (min < 60) return faNum(min) + ' دقیقه پیش';
    var hr = Math.floor(min / 60);
    if (hr < 24) return faNum(hr) + ' ساعت پیش';
    var day = Math.floor(hr / 24);
    if (day < 30) return faNum(day) + ' روز پیش';
    return faDate(new Date(ts));
  }

  /* ---------- متن ---------- */

  var HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return HTML_ESCAPES[ch]; });
  }

  /**
   * پاک‌سازی HTML کاربران: نخست بلوک‌های script/style حذف، همه‌چیز escape،
   * و سپس فقط الگوهای سفیدفهرست (b/strong/i/em/br/a با href امن) بازمی‌گردند.
   * بدون DOMParser — در Node هم آزمودنی است.
   */
  function sanitizeRich(html) {
    if (!html) return '';
    var s = String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*$/gi, '')
      .replace(/<style[\s\S]*$/gi, '')
      /* لینک با href حفظ می‌شود، بقیهٔ ویژگی‌ها از تگ‌های مجاز حذف می‌شوند */
      .replace(/<a\b[^>]*?href\s*=\s*"([^"]*)"[^>]*>/gi, function (m, href) { return '<a href="' + href + '">'; })
      .replace(/<a\b[^>]*?href\s*=\s*'([^']*)'[^>]*>/gi, function (m, href) { return "<a href='" + href + "'>"; })
      .replace(/<(\/?)\s*(b|strong|i|em|br)\b[^>]*>/gi, function (m, sl, tag) { return '<' + sl + tag.toLowerCase() + '>'; });
    var out = escapeHtml(s);
    out = out.replace(/&lt;(\/?)(b|strong|i|em|br)\s*\/?&gt;/gi, function (m, sl, tag) {
      return '<' + sl + tag.toLowerCase() + '>';
    });
    out = out.replace(/&lt;a\s+href=&quot;((?:(?!&quot;).)*)&quot;\s*\/?&gt;/gi, function (m, href) {
      var url = href.replace(/&amp;/g, '&').trim();
      if (!/^(https?:\/\/|mailto:|#)/i.test(url)) return '';
      return '<a href="' + href + '" rel="noopener nofollow">';
    });
    out = out.replace(/&lt;\/a&gt;/gi, '</a>');
    return out;
  }

  function stripHtml(html) {
    return String(html || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  function countWords(text) {
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return 0;
    return t.split(' ').length;
  }

  /** زمان مطالعهٔ تقریبی به دقیقه (حدود ۱۸۰ کلمه در دقیقه) */
  function readingMinutes(words) { return Math.max(1, Math.ceil(words / 180)); }

  /** نرمال‌سازی برای جست‌وجو: ی/ک عربی، نیم‌فاصله */
  function norm(s) {
    return String(s || '')
      .replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[أإآ]/g, 'ا')
      .replace(/\u200c/g, ' ').replace(/[\u064B-\u065F]/g, '')
      .toLowerCase().trim();
  }

  /** نامک فارسی/لاتین */
  function slugify(s) {
    var out = norm(s)
      .replace(/[^\w\s\u0600-\u06FF-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return out;
  }

  function isValidSlug(s) {
    return /^[a-z0-9-]+$/.test(s || '') && (s || '').length >= 3;
  }

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v || '');
  }

  function validateDomain(v) {
    return /^(?!-)[a-z0-9\u0600-\u06FF]([a-z0-9\u0600-\u06FF-]*[a-z0-9\u0600-\u06FF])?(\.[a-z0-9\u0600-\u06FF]([a-z0-9\u0600-\u06FF-]*[a-z0-9\u0600-\u06FF])?)+$/i.test(v || '');
  }

  /* ---------- عمومی ---------- */

  var _uidCounter = 0;
  function uid(prefix) {
    _uidCounter += 1;
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + _uidCounter + '-' + Math.random().toString(36).slice(2, 6);
  }

  function debounce(fn, ms) {
    var t = null;
    return function () {
      var args = arguments, self = this;
      if (t) clearTimeout(t);
      t = setTimeout(function () { t = null; fn.apply(self, args); }, ms);
    };
  }

  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

  function formatBytes(n) {
    if (n < 1024) return n + ' بایت';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' کیلوبایت';
    return (n / 1048576).toFixed(1) + ' مگابایت';
  }

  function copyText(text, cb) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (cb) cb(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { if (cb) cb(true); }, function () { fallback(); });
    } else {
      fallback();
    }
  }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }

  return {
    faNum: faNum,
    faDate: faDate,
    faTime: faTime,
    faDateTime: faDateTime,
    faRelative: faRelative,
    faMonths: FA_MONTHS,
    faWeekdays: FA_WEEKDAYS,
    toJalaali: toJalaali,
    toGregorian: toGregorian,
    isLeapJalaali: isLeapJalaali,
    jalaaliMonthLength: jalaaliMonthLength,
    j2d: j2d,
    d2j: d2j,
    g2d: g2d,
    d2g: d2g,
    escapeHtml: escapeHtml,
    sanitizeRich: sanitizeRich,
    stripHtml: stripHtml,
    countWords: countWords,
    readingMinutes: readingMinutes,
    norm: norm,
    slugify: slugify,
    isValidSlug: isValidSlug,
    validateEmail: validateEmail,
    validateDomain: validateDomain,
    uid: uid,
    debounce: debounce,
    clamp: clamp,
    formatBytes: formatBytes,
    copyText: copyText,
    download: download
  };
})();
