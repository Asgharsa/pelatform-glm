/* ============================================================
   نوا — تم روشن/تیره با حفظ انتخاب کاربر
   ============================================================ */
window.Nova = window.Nova || {};

Nova.theme = (function () {
  'use strict';

  var listeners = [];

  function current() {
    var meta = Nova.store.read('meta', {});
    return meta.theme || 'system';
  }

  function resolved() {
    var t = current();
    if (t !== 'system') return t;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function apply() {
    document.documentElement.dataset.theme = resolved();
    listeners.forEach(function (fn) { try { fn(resolved()); } catch (e) { /* noop */ } });
  }

  function set(mode) {
    var meta = Nova.store.read('meta', {});
    meta.theme = mode;
    Nova.store.write('meta', meta);
    apply();
  }

  function toggle() {
    set(resolved() === 'dark' ? 'light' : 'dark');
  }

  function onChange(fn) { listeners.push(fn); }

  function init() {
    apply();
    if (window.matchMedia) {
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (current() === 'system') apply(); });
      } catch (e) { /* Safari قدیمی */ }
    }
  }

  return { init: init, current: current, resolved: resolved, set: set, toggle: toggle, onChange: onChange };
})();
