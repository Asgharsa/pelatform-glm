/* ============================================================
   نوا — گفت‌وگوی زنده و گفت‌وگوی تیمی
   هر دو حالت آزمایشی‌اند: پیام‌ها فقط در همین مرورگر ذخیره
   می‌شوند و با برچسب «ارسال محلی» از ارسال واقعی تفکیک می‌گردند.
   ============================================================ */
window.Nova = window.Nova || {};

/* ---------------- گفت‌وگوی زنده ---------------- */
Nova.liveChat = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui;
  var activeId = null;
  var simTimer = null;

  function convList() { return Nova.app.visibleList('liveChats'); }

  function active() {
    var list = convList();
    return list.filter(function (c) { return c.id === activeId; })[0] || list[0] || null;
  }

  function saveChat(conv) {
    var r = Nova.store.updateById('liveChats', conv.id, conv);
    if (!r.result.ok) ui.toast('ذخیرهٔ گفت‌وگو انجام نشد؛ فضای مرورگر پر است.', 'error');
  }

  function renderMsg(m) {
    var mine = m.from === 'agent';
    return '<div class="msg ' + (mine ? 'mine' : '') + '">' +
      '<div class="bubble">' + ui.esc(m.text) + '</div>' +
      '<div class="row" style="gap:6px"><span class="m-time">' + U.faTime(new Date(m.ts)) + '</span>' +
      (mine ? '<span class="m-badge badge badge-local">ارسال محلی</span>' : '') +
      (m.sim ? '<span class="m-badge badge badge-warn">شبیه‌سازی‌شده</span>' : '') +
      '</div></div>';
  }

  function paint(container) {
    var list = convList();
    var cur = active();
    container.innerHTML =
      ui.banner('warn', '<b>حالت آزمایشی.</b> این گفت‌وگو به هیچ سرور واقعی وصل نیست؛ پیام‌ها فقط در همین مرورگر ذخیره می‌شوند و به بازدیدکنندهٔ واقعی نمی‌رسند. پاسخ بازدیدکننده با برچسب «شبیه‌سازی‌شده» از یک سناریوی محلی می‌آید.') +
      '<div class="chat-layout">' +
      '<div class="chat-side">' +
      '<div class="chat-side-head"><span>گفت‌وگوها (' + U.faNum(list.length) + ')</span>' +
      '<button class="btn btn-soft btn-sm" data-act="sim-join">+ بازدیدکنندهٔ آزمایشی</button></div>' +
      '<div class="chat-side-list">' +
      (list.length ? list.map(function (c) {
        var last = (c.messages || []).slice(-1)[0];
        return '<div class="conv-item' + (cur && cur.id === c.id ? ' on' : '') + '" data-conv="' + c.id + '">' +
          '<div class="grow"><div class="ci-name">' + ui.esc(c.name) + (c.demo ? ' ' + ui.badge('badge-demo', 'نمونه') : '') + '</div>' +
          '<div class="ci-preview truncate">' + ui.esc(last ? last.text : 'بدون پیام') + '</div>' +
          '<div class="ci-preview">' + ui.esc(c.page || '') + '</div></div>' +
          '<span class="ci-time">' + (last ? U.faTime(new Date(last.ts)) : '') + '</span></div>';
      }).join('') : '<div class="caption" style="padding:14px">گفت‌وگویی نیست. یک بازدیدکنندهٔ آزمایشی اضافه کنید.</div>') +
      '</div></div>' +
      '<div class="chat-main">' +
      (cur ?
        '<div class="chat-head"><div class="avatar">' + ui.esc(cur.name.slice(0, 1)) + '</div>' +
        '<div class="grow"><div style="font-weight:700;font-size:var(--fs-small)">' + ui.esc(cur.name) + '</div>' +
        '<div class="caption">' + ui.esc(cur.page || '') + ' · ' + (cur.status === 'waiting' ? 'در انتظار پاسخ' : 'پایان‌یافته') + '</div></div>' +
        '<span class="badge badge-conn">آزمایشی — بدون اتصال</span></div>' +
        '<div class="chat-msgs" id="lc-msgs">' + (cur.messages || []).map(renderMsg).join('') + '</div>' +
        '<div class="chat-input">' +
        '<textarea class="textarea" id="lc-input" placeholder="پاسخ خود را بنویسید… (Enter برای ارسال)"></textarea>' +
        '<button class="btn btn-primary icon-btn" data-act="send" style="width:auto;padding:0 16px;height:42px" aria-label="ارسال">' + Nova.icon('send') + '</button>' +
        '</div>'
        : '<div class="empty" style="margin:auto">' + ui.emptyState({ icon: 'chat', title: 'گفت‌وگویی انتخاب نشده', desc: 'از فهرست سمت راست یک گفت‌وگو انتخاب کنید یا بازدیدکنندهٔ آزمایشی بسازید.' }) + '</div>') +
      '</div></div>';

    var msgs = container.querySelector('#lc-msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;

    ui.bind(container, 'click', '[data-conv]', function (e, item) {
      activeId = item.getAttribute('data-conv');
      paint(container);
    });

    ui.bind(container, 'click', '[data-act]', function (e, btn) {
      var act = btn.getAttribute('data-act');
      if (act === 'sim-join') {
        var conv = {
          id: U.uid('lc'), demo: false, name: 'بازدیدکنندهٔ آزمایشی ' + U.faNum(list.length + 1),
          page: 'شبیه‌سازی ورود به سایت', status: 'waiting', createdAt: Date.now(), messages: []
        };
        Nova.store.insert('liveChats', conv);
        activeId = conv.id;
        ui.toast('بازدیدکنندهٔ آزمایشی ساخته شد.', 'success');
        setTimeout(function () {
          var c2 = Nova.store.getById('liveChats', conv.id);
          if (!c2 || Nova.router.path() !== '/live-chat') return;
          c2.messages = (c2.messages || []).concat([{ from: 'visitor', text: 'سلام! چند سؤال دربارهٔ محصولات‌تون داشتم.', ts: Date.now(), sim: true }]);
          saveChat(c2);
          if (Nova.router.path() === '/live-chat') paint(container);
        }, 1500);
        paint(container);
      } else if (act === 'send') {
        sendCurrent(container);
      }
    });

    var input = container.querySelector('#lc-input');
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCurrent(container); }
      });
    }
  }

  function sendCurrent(container) {
    var cur = active();
    var input = container.querySelector('#lc-input');
    if (!cur || !input) return;
    var text = input.value.trim();
    if (!text) return;
    cur.messages = (cur.messages || []).concat([{ from: 'agent', text: text, ts: Date.now() }]);
    cur.status = 'answered';
    saveChat(cur);
    input.value = '';
    paint(container);
    /* پاسخ شبیه‌سازی‌شدهٔ محلی */
    if (simTimer) clearTimeout(simTimer);
    simTimer = setTimeout(function () {
      var c2 = Nova.store.getById('liveChats', cur.id);
      if (!c2 || Nova.router.path() !== '/live-chat') return;
      var replies = ['ممنون از پاسخ‌تون!', 'یک سؤال دیگه هم داشتم…', 'مرسی، بررسی می‌کنم.'];
      c2.messages = (c2.messages || []).concat([{ from: 'visitor', text: replies[Math.floor(Math.random() * replies.length)], ts: Date.now(), sim: true }]);
      saveChat(c2);
      paint(container);
    }, 1800);
  }

  return { render: paint };
})();

/* ---------------- گفت‌وگوی تیمی ---------------- */
Nova.teamChat = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui;
  var activeChannel = null;

  function data() {
    var d = Nova.store.read('teamChat', { channels: [] });
    if (!d.channels) d = { channels: [] };
    return d;
  }

  function save(d) {
    var r = Nova.store.write('teamChat', d);
    if (!r.ok) ui.toast('ذخیره انجام نشد؛ فضای مرورگر پر است.', 'error');
  }

  function current() {
    var d = data();
    return d.channels.filter(function (c) { return c.id === activeChannel; })[0] || d.channels[0] || null;
  }

  function render(container) {
    var d = data();
    var cur = current();
    container.innerHTML =
      ui.banner('warn', '<b>حالت آزمایشی.</b> پیام‌های تیمی فقط در همین مرورگر ذخیره می‌شوند؛ اتصال واقعی به سرور یا پیام‌رسان برقرار نیست.') +
      '<div class="chat-layout">' +
      '<div class="chat-side">' +
      '<div class="chat-side-head"><span>کانال‌ها</span><button class="btn btn-soft btn-sm" data-act="add-channel">+ کانال</button></div>' +
      '<div class="chat-side-list">' +
      (d.channels.length ? d.channels.map(function (c) {
        return '<div class="conv-item' + (cur && cur.id === c.id ? ' on' : '') + '" data-ch="' + c.id + '">' +
          '<div class="grow"><div class="ci-name"># ' + ui.esc(c.name) + (c.demo ? ' ' + ui.badge('badge-demo', 'نمونه') : '') + '</div>' +
          '<div class="ci-preview">' + U.faNum((c.messages || []).length) + ' پیام</div></div></div>';
      }).join('') : '<div class="caption" style="padding:14px">کانالی نیست.</div>') +
      '</div></div>' +
      '<div class="chat-main">' +
      (cur ?
        '<div class="chat-head"><div class="avatar">' + Nova.icon('hash') + '</div>' +
        '<div class="grow" style="font-weight:700;font-size:var(--fs-small)">' + ui.esc(cur.name) + '</div>' +
        '<span class="badge badge-conn">آزمایشی — ذخیرهٔ محلی</span></div>' +
        '<div class="chat-msgs">' +
        '<div class="day-sep">پیام‌های نمونه و پیام‌های شما با برچسب تفکیک می‌شوند</div>' +
        (cur.messages || []).map(function (m) {
          var mine = m.from === 'me';
          return '<div class="msg ' + (mine ? 'mine' : '') + '"><div class="bubble">' +
            (mine ? ui.esc(m.text) : '<span class="caption" style="font-weight:700">' + ui.esc(m.name || '') + '</span><br>' + ui.esc(m.text)) +
            '</div><div class="row" style="gap:6px"><span class="m-time">' + U.faTime(new Date(m.ts)) + '</span>' +
            (mine ? '<span class="m-badge badge badge-local">ارسال محلی</span>' : '') + '</div></div>';
        }).join('') + '</div>' +
        '<div class="chat-input">' +
        '<textarea class="textarea" id="tc-input" placeholder="پیام به کانال… (Enter برای ارسال)"></textarea>' +
        '<button class="btn btn-primary" data-act="send" style="height:42px;padding:0 18px" aria-label="ارسال">' + Nova.icon('send') + '</button></div>'
        : '<div class="empty" style="margin:auto">' + ui.emptyState({ icon: 'messages', title: 'کانالی انتخاب نشده', desc: 'یک کانال بسازید تا گفت‌وگوی تیمی آزمایشی شروع شود.' }) + '</div>') +
      '</div></div>';

    ui.bind(container, 'click', '[data-ch]', function (e, item) {
      activeChannel = item.getAttribute('data-ch');
      render(container);
    });

    ui.bind(container, 'click', '[data-act]', function (e, btn) {
      var act = btn.getAttribute('data-act');
      if (act === 'add-channel') {
        ui.formModal({
          title: 'کانال جدید',
          grid: false,
          fields: [{ key: 'name', label: 'نام کانال', required: true, placeholder: 'مثلاً: طرح‌های-هفته' }]
        }).then(function (v) {
          if (!v) return;
          var d2 = data();
          var ch = { id: U.uid('ch'), name: v.name.replace(/\s+/g, '-'), demo: false, messages: [] };
          d2.channels.push(ch);
          save(d2);
          activeChannel = ch.id;
          ui.toast('کانال ساخته شد (محلی).', 'success');
          render(container);
        });
      } else if (act === 'send') {
        var cur2 = current();
        var input = container.querySelector('#tc-input');
        if (!cur2 || !input) return;
        var text = input.value.trim();
        if (!text) return;
        cur2.messages = (cur2.messages || []).concat([{ from: 'me', name: 'شما', text: text, ts: Date.now() }]);
        var d3 = data();
        d3.channels.forEach(function (c) { if (c.id === cur2.id) c.messages = cur2.messages; });
        save(d3);
        input.value = '';
        render(container);
        var i2 = container.querySelector('#tc-input');
        if (i2) i2.focus();
      }
    });

    var input = container.querySelector('#tc-input');
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); var b = container.querySelector('[data-act="send"]'); if (b) b.click(); }
      });
    }
  }

  return { render: render };
})();
