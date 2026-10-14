/* ============================================================
   نوا — پاسخ‌گویی به دیدگاه‌ها
   فیلتر وضعیت، پاسخ محلی، تأیید/رد/اسپم — همهٔ نمونه برچسب دارد
   ============================================================ */
window.Nova = window.Nova || {};

Nova.comments = (function () {
  'use strict';

  var U = Nova.utils, ui = Nova.ui;
  var filter = 'all';

  var STATUS = {
    pending: { label: 'در انتظار پاسخ', badge: 'badge-warn' },
    approved: { label: 'تأییدشده', badge: 'badge-ok' },
    rejected: { label: 'ردشده', badge: 'badge-local' },
    spam: { label: 'اسپم', badge: 'badge-conn' }
  };

  function articleTitle(id) {
    var a = Nova.store.getById('articles', id);
    return a ? (a.title || 'بدون عنوان') : '—';
  }

  function list() {
    var all = Nova.app.visibleList('comments');
    if (filter !== 'all') return all.filter(function (c) { return c.status === filter; });
    return all;
  }

  function card(c) {
    var st = STATUS[c.status] || STATUS.pending;
    return '<div class="comment-card" data-id="' + c.id + '">' +
      '<div class="avatar">' + ui.esc((c.author || '؟').slice(0, 1)) + '</div>' +
      '<div class="c-body">' +
      '<div class="row-between"><div class="row"><span class="c-author">' + ui.esc(c.author) + '</span>' +
      (c.demo ? ui.badge('badge-demo', 'نمونه') : '') +
      '<span class="badge ' + st.badge + '">' + st.label + '</span></div>' +
      '<span class="caption">' + U.faRelative(c.createdAt || Date.now()) + '</span></div>' +
      '<div class="c-on">روی مقالهٔ «' + ui.esc(articleTitle(c.articleId)) + '»</div>' +
      '<div class="c-text">' + ui.esc(c.text) + '</div>' +
      (c.reply ? '<div class="reply-item"><b class="small">پاسخ شما:</b> ' + ui.esc(c.reply) + ' <span class="badge badge-local">ارسال محلی</span></div>' : '') +
      (c.status === 'pending' ?
        '<div class="row reply-box">' +
        '<button class="btn btn-soft btn-sm" data-act="reply">' + Nova.icon('chat') + ' پاسخ</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="approve">' + Nova.icon('check') + ' تأیید</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="reject">' + Nova.icon('x') + ' رد</button>' +
        '<button class="btn btn-danger btn-sm" data-act="spam">' + Nova.icon('alertTriangle') + ' اسپم</button>' +
        '</div>' : '') +
      '</div></div>';
  }

  function paint() {
    var container = document.getElementById('view-root');
    if (!container) return;
    var all = Nova.app.visibleList('comments');
    var counts = { all: all.length, pending: 0, approved: 0, rejected: 0, spam: 0 };
    all.forEach(function (c) { if (counts[c.status] != null) counts[c.status] += 1; });

    container.innerHTML =
      '<div class="page-head view-enter"><h1>پاسخ‌گویی به دیدگاه‌ها</h1>' +
      '<div class="page-sub">صف پاسخ‌گویی با مدیریت وضعیت — دادهٔ نمایشی و واقعی جدا هستند</div></div>' +
      ui.banner('info', 'در نسخهٔ نمایشی، دیدگاه‌ها از وردپرس یا شبکه‌های اجتماعی <b>همگام نمی‌شوند</b>. پاسخ‌ها به‌صورت محلی ثبت و با برچسب «ارسال محلی» مشخص می‌شوند.') +
      '<div class="chips" style="margin-bottom:14px">' +
      ['all', 'pending', 'approved', 'rejected', 'spam'].map(function (f) {
        return '<button type="button" class="chip' + (filter === f ? ' on' : '') + '" data-filter="' + f + '">' +
          (f === 'all' ? 'همه' : STATUS[f].label) + ' (' + U.faNum(counts[f]) + ')</button>';
      }).join('') + '</div>' +
      (list().length
        ? '<div class="card" style="padding:0">' + list().map(card).join('') + '</div>'
        : '<div class="card">' + ui.emptyState({
          icon: 'inbox', title: 'دیدگاهی در این وضعیت نیست',
          desc: filter === 'all' ? 'هنوز دیدگاهی ثبت نشده است.' : 'صف فعلی خالی است — وضعیت دیگری را بررسی کنید.',
          action: '<a class="btn btn-ghost" href="#/content/article">مشاهدهٔ مقاله‌ها</a>'
        }) + '</div>');

    ui.bind(container, 'click', '[data-filter]', function (e, btn) {
      filter = btn.getAttribute('data-filter');
      paint();
    });

    ui.bind(container, 'click', '[data-act]', function (e, btn) {
      var cardEl = btn.closest('.comment-card');
      if (!cardEl) return;
      var c = Nova.store.getById('comments', cardEl.getAttribute('data-id'));
      if (!c) return;
      var act = btn.getAttribute('data-act');
      if (act === 'reply') {
        ui.formModal({
          title: 'پاسخ به ' + c.author,
          grid: false,
          fields: [{ key: 'reply', label: 'متن پاسخ', type: 'textarea', required: true, value: c.reply || '' }],
          submitText: 'ثبت پاسخ'
        }).then(function (v) {
          if (!v) return;
          c.reply = v.reply.trim();
          c.status = 'approved';
          var r = Nova.store.updateById('comments', c.id, c);
          if (!r.result.ok) { ui.toast('ذخیره انجام نشد.', 'error'); return; }
          ui.toast('پاسخ محلی ثبت شد (به سرویس واقعی ارسال نمی‌شود).', 'success');
          paint();
        });
      } else if (act === 'approve') {
        c.status = 'approved';
        Nova.store.updateById('comments', c.id, c);
        ui.toast('دیدگاه تأیید شد.', 'success');
        paint();
      } else if (act === 'reject') {
        c.status = 'rejected';
        Nova.store.updateById('comments', c.id, c);
        ui.toast('دیدگاه رد شد.', 'info');
        paint();
      } else if (act === 'spam') {
        c.status = 'spam';
        Nova.store.updateById('comments', c.id, c);
        ui.toast('به‌عنوان اسپم علامت خورد.', 'info');
        paint();
      }
    });
  }

  return { render: paint };
})();
