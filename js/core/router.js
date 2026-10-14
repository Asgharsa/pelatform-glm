/* ============================================================
   نوا — مسیریاب سادهٔ hash با پارامتر مسیر
   ============================================================ */
window.Nova = window.Nova || {};

Nova.router = (function () {
  'use strict';

  var routes = [];
  var currentPath = null;
  var beforeHooks = [];

  function add(pattern, handler, meta) {
    var keys = [];
    var regex = new RegExp('^' + pattern.replace(/:[^/]+/g, function (m) {
      keys.push(m.slice(1));
      return '([^/]+)';
    }) + '$');
    routes.push({ pattern: pattern, regex: regex, keys: keys, handler: handler, meta: meta || {} });
  }

  function parse() {
    var h = location.hash || '';
    var path = h.replace(/^#/, '');
    if (!path) path = '/dashboard';
    return path;
  }

  function navigate(path) {
    if (('#' + path) === location.hash) {
      render();
      return;
    }
    location.hash = '#' + path;
  }

  function match(path) {
    var p = String(path || '').split('?')[0];
    for (var i = 0; i < routes.length; i++) {
      var m = p.match(routes[i].regex);
      if (m) {
        var params = {};
        routes[i].keys.forEach(function (k, idx) { params[k] = decodeURIComponent(m[idx + 1]); });
        return { route: routes[i], params: params };
      }
    }
    return null;
  }

  function render() {
    var path = parse();
    currentPath = path;
    var found = match(path);
    var container = document.getElementById('view-root');
    if (!found) {
      Nova.ui.renderNotFound(container, path);
      Nova.app && Nova.app.setActiveNav(path);
      return;
    }
    for (var i = 0; i < beforeHooks.length; i++) {
      var stop = beforeHooks[i](path, found.params);
      if (stop) return;
    }
    try {
      found.route.handler(container, found.params);
    } catch (e) {
      if (Nova.log) Nova.log('خطا در رندر مسیر ' + path, e);
      Nova.ui.renderError(container, e);
    }
    Nova.app && Nova.app.setActiveNav(path);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function start() {
    window.addEventListener('hashchange', function () {
      Nova.app && Nova.app.closeSidebar();
      render();
    });
    render();
  }

  function onBefore(fn) { beforeHooks.push(fn); }
  function path() { return currentPath; }

  return { add: add, start: start, navigate: navigate, render: render, match: match, onBefore: onBefore, path: path };
})();
