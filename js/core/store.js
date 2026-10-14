/* ============================================================
   نوا — لایهٔ ذخیره‌سازی مقاوم (localStorage)
   - مقاوم در برابر دادهٔ خراب (پشتیبان‌گیری از دادهٔ خراب)
   - مدیریت خطای سهمیهٔ پر (QuotaExceededError)
   - جداسازی کلیدها با پیشوند نسخه‌دار
   قابل تزریق بک‌اند برای آزمون در Node.
   ============================================================ */
window.Nova = window.Nova || {};

Nova.store = (function () {
  'use strict';

  var PREFIX = 'nova.v1.';
  var backend = null;
  var lastError = null;

  function detect() {
    try {
      if (typeof localStorage !== 'undefined') {
        var k = '__nova_test__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return localStorage;
      }
    } catch (e) { /* غیرفعال یا پر */ }
    return null;
  }

  backend = detect();

  function setBackend(b) { backend = b; }

  function isAvailable() { return !!backend; }

  function read(key, fallback) {
    try {
      var raw = backend ? backend.getItem(PREFIX + key) : null;
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      lastError = e;
      if (Nova.log) Nova.log('store: خواندن کلید «' + key + '» شکست خورد — دادهٔ خراب', e);
      try {
        if (backend) {
          var bad = backend.getItem(PREFIX + key);
          if (bad != null) backend.setItem('nova.v1.corrupt.' + key + '.' + Date.now(), bad);
          backend.removeItem(PREFIX + key);
        }
      } catch (e2) { /* بی‌خیال */ }
      return fallback;
    }
  }

  function write(key, value) {
    try {
      backend.setItem(PREFIX + key, JSON.stringify(value));
      return { ok: true };
    } catch (e) {
      lastError = e;
      if (Nova.log) Nova.log('store: نوشتن کلید «' + key + '» شکست خورد', e);
      return { ok: false, error: e };
    }
  }

  function remove(key) {
    try { if (backend) backend.removeItem(PREFIX + key); } catch (e) { /* noop */ }
  }

  /* ---------- کلیدهای شناخته‌شده ---------- */

  var KEYS = ['meta', 'articles', 'photoBriefs', 'videoBriefs', 'textBriefs',
    'brands', 'companies', 'teams', 'domains', 'users', 'calendarPlans',
    'liveChats', 'teamChat', 'comments'];

  function exportAll() {
    var data = {};
    KEYS.forEach(function (k) { data[k] = read(k, k === 'meta' ? {} : []); });
    return { app: 'nova', schema: 1, exportedAt: new Date().toISOString(), data: data };
  }

  /** بازگردانی کامل؛ آیتم‌های نمونه دوباره بذر می‌شوند اگر حذف شده باشند */
  function importAll(payload) {
    if (!payload || payload.app !== 'nova' || !payload.data || typeof payload.data !== 'object') {
      return { ok: false, reason: 'ساختار فایل پشتیبان معتبر نیست.' };
    }
    var counts = { restored: 0, skipped: 0 };
    KEYS.forEach(function (k) {
      var val = payload.data[k];
      if (k === 'meta') {
        if (val && typeof val === 'object') { write('meta', val); counts.restored += 1; }
        return;
      }
      if (Array.isArray(val)) {
        var clean = val.filter(function (item) { return item && typeof item === 'object'; });
        counts.skipped += val.length - clean.length;
        write(k, clean);
        counts.restored += 1;
      } else if (val == null) {
        write(k, []);
      } else {
        counts.skipped += 1;
      }
    });
    return { ok: true, counts: counts };
  }

  function clearAllUser() {
    KEYS.forEach(function (k) {
      if (k === 'meta') return;
      var arr = read(k, []);
      if (Array.isArray(arr)) write(k, arr.filter(function (x) { return x && x.demo === true; }));
    });
  }

  function clearDemo() {
    KEYS.forEach(function (k) {
      if (k === 'meta') return;
      var arr = read(k, []);
      if (Array.isArray(arr)) write(k, arr.filter(function (x) { return !(x && x.demo === true); }));
    });
  }

  /* ---------- کمکی‌های مجموعه ---------- */

  function getList(key) {
    var v = read(key, []);
    return Array.isArray(v) ? v : [];
  }

  function saveList(key, list) { return write(key, list); }

  function insert(key, item) {
    var list = getList(key);
    list.push(item);
    return { result: write(key, list), list: list };
  }

  function updateById(key, id, patch) {
    var list = getList(key);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i] = Object.assign({}, list[i], patch);
        return { result: write(key, list), item: list[i] };
      }
    }
    return { result: { ok: false, error: new Error('یافت نشد') } };
  }

  function removeById(key, id) {
    var list = getList(key);
    var next = list.filter(function (x) { return x.id !== id; });
    write(key, next);
    return { removed: list.length - next.length };
  }

  function getById(key, id) {
    var list = getList(key);
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  return {
    KEYS: KEYS,
    setBackend: setBackend,
    isAvailable: isAvailable,
    read: read,
    write: write,
    remove: remove,
    exportAll: exportAll,
    importAll: importAll,
    clearAllUser: clearAllUser,
    clearDemo: clearDemo,
    getList: getList,
    saveList: saveList,
    insert: insert,
    updateById: updateById,
    removeById: removeById,
    getById: getById
  };
})();
