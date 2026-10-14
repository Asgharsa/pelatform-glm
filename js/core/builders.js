/* ============================================================
   نوا — منطق ساخت پرامپت، بریف، خروجی HTML و بررسی‌های ساختاری
   کاملاً خالص (بدون DOM) تا در Node آزموده شود.
   اصل صداقت: خروجی این توابع «قالبی» است، نه تولید هوش مصنوعی.
   ============================================================ */
window.Nova = window.Nova || {};

Nova.builders = (function () {
  'use strict';

  var U = Nova.utils;
  var O = Nova.options;

  function esc(s) { return U.escapeHtml(s); }
  function attr(s) { return U.escapeHtml(s); }

  /* ============================================================
     استودیوی عکس
     ============================================================ */

  function validateCustomDims(w, h) {
    var W = parseInt(w, 10), H = parseInt(h, 10);
    if (!W || !H || isNaN(W) || isNaN(H)) return { ok: false, error: 'عرض و ارتفاع باید عدد باشند.' };
    if (W < 64 || H < 64) return { ok: false, error: 'هر بعد باید حداقل ۶۴ پیکسل باشد.' };
    if (W > 4096 || H > 4096) return { ok: false, error: 'هر بعد حداکثر ۴۰۹۶ پیکسل است.' };
    if (W / H > 8 || H / W > 8) return { ok: false, error: 'نسبت ابعاد بیش از حد کشیده است (حداکثر ۸ به ۱).' };
    return { ok: true, w: W, h: H };
  }

  function validateRefFile(file) {
    if (!file) return { ok: false, error: 'فایلی انتخاب نشده است.' };
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      return { ok: false, error: 'فقط تصاویر PNG، JPEG، WebP و GIF پذیرفته می‌شوند.' };
    }
    if (file.size > 8 * 1024 * 1024) {
      return { ok: false, error: 'حجم فایل بیش از ۸ مگابایت است.' };
    }
    return { ok: true };
  }

  function creativeWord(v) {
    v = Number(v) || 0;
    if (v < 34) return { fa: 'وفادار به ورودی', en: 'strict adherence to the brief' };
    if (v < 67) return { fa: 'متعادل', en: 'balanced creative freedom' };
    return { fa: 'آزاد و خلاق', en: 'high creative freedom' };
  }

  function ratioLabel(s) {
    if (s.ratio !== 'custom') return s.ratio;
    var d = validateCustomDims(s.w, s.h);
    return d.ok ? d.w + '×' + d.h + ' px' : null;
  }

  /**
   * ساخت پرامپت عکس از وضعیت فرم.
   * s.promptLang === 'en' → پرامپت انگلیسی؛ متن آزاد کاربر دست‌نخورده می‌ماند
   * (محدودیت ترجمه به‌صورت صریح در رابط نشان داده می‌شود).
   */
  function buildPhotoPrompt(s) {
    var en = s.promptLang === 'en';
    var parts = [];
    var style = O.byId(O.photoStyles, s.style);
    var light = O.byId(O.lighting, s.lighting);
    var palette = O.byId(O.palettes, s.palette);
    var bg = O.byId(O.backgrounds, s.background);
    var comp = O.byId(O.compositions, s.composition);
    var angle = O.byId(O.angles, s.angle);
    var lens = O.byId(O.lenses, s.lens);
    var quality = O.byId(O.quality, s.quality);
    var use = O.byId(O.photoUses, s.use);

    var subject = String(s.subject || '').trim();
    var scene = String(s.scene || '').trim();

    if (en) {
      if (subject) parts.push(subject);
      if (scene) parts.push('scene: ' + scene);
      if (style) parts.push(style.en);
      if (light) parts.push(light.en);
      if (palette) parts.push(palette.en);
      if (bg) parts.push(bg.en);
      if (comp) parts.push(comp.en);
      if (angle || lens) parts.push((angle ? angle.en : '') + (angle && lens ? ', ' : '') + (lens ? lens.en : ''));
      var ts = O.byId(O.textSpace, s.textSpace);
      if (ts) {
        if (s.textSpace === 'yes') {
          var pos = O.byId(O.textPositions, s.textPos);
          parts.push(ts.en + (pos ? ' (' + pos.en + ')' : ''));
        } else {
          parts.push(ts.en);
        }
      }
    } else {
      if (subject) parts.push('موضوع: ' + subject);
      if (scene) parts.push('شرح صحنه: ' + scene);
      if (style) parts.push('سبک: ' + style.fa);
      if (light) parts.push('نورپردازی: ' + light.fa);
      if (palette) parts.push('پالت رنگ: ' + palette.fa);
      if (bg) parts.push('پس‌زمینه: ' + bg.fa);
      if (comp) parts.push('ترکیب‌بندی: ' + comp.fa);
      if (angle || lens) parts.push('دوربین: ' + (angle ? angle.fa : '') + (angle && lens ? ' + ' : '') + (lens ? lens.fa : ''));
      var ts2 = O.byId(O.textSpace, s.textSpace);
      if (ts2) {
        if (s.textSpace === 'yes') {
          var pos2 = O.byId(O.textPositions, s.textPos);
          parts.push('فضای متن: ' + ts2.fa.replace('بله — ', '') + (pos2 ? ' در ' + pos2.fa : ''));
        } else {
          parts.push('متن: ' + ts2.fa.replace('خیر — ', ''));
        }
      }
    }

    var rl = ratioLabel(s);
    if (rl) parts.push(en ? 'aspect ratio ' + rl : 'نسبت تصویر: ' + rl);
    if (quality) parts.push(en ? quality.en : 'کیفیت: ' + quality.fa);
    if (use) parts.push(en ? 'intended use: ' + use.fa : 'کاربرد: ' + use.fa);

    var cw = creativeWord(s.freedom);
    parts.push(en ? cw.en : 'میزان آزادی: ' + cw.fa);

    if (s.refRole) {
      var role = O.byId(O.refRoles, s.refRole);
      if (role) parts.push(en ? 'reference image role: ' + role.fa : 'نقش تصویر مرجع: ' + role.fa);
    }
    if (s.outputFormat) parts.push(en ? 'output format: ' + s.outputFormat.toUpperCase() : 'فرمت خروجی: ' + s.outputFormat.toUpperCase());
    if (String(s.negative || '').trim()) {
      parts.push(en ? 'avoid: ' + String(s.negative).trim() : 'پرامپت منفی: ' + String(s.negative).trim());
    }
    return parts.join(en ? ', ' : '؛ ');
  }

  /* ============================================================
     استودیوی ویدیو
     ============================================================ */

  function normalizeShots(s) {
    var shots = (s.shots || []).map(function (sh, i) {
      return {
        n: i + 1,
        desc: String(sh.desc || '').trim(),
        dur: Number(sh.dur) || 0,
        cam: sh.cam || '',
        trans: sh.trans || ''
      };
    });
    return shots;
  }

  function shotsTotal(s) {
    return normalizeShots(s).reduce(function (a, sh) { return a + sh.dur; }, 0);
  }

  function validateDuration(target) {
    var t = Number(target);
    if (isNaN(t) || t < 3) return { ok: false, error: 'مدت باید حداقل ۳ ثانیه باشد.' };
    if (t > 120) return { ok: false, error: 'مدت حداکثر ۱۲۰ ثانیه است.' };
    return { ok: true, value: t };
  }

  /** بررسی پشتیبانی سرویس نمونه از تنظیمات انتخابی */
  function serviceIssues(serviceId, s) {
    var svc = O.byId(O.videoServices, serviceId);
    if (!svc) return [];
    var caps = svc.caps;
    var issues = [];
    if (Number(s.duration) > caps.maxDuration) {
      issues.push({ key: 'duration', text: 'حداکثر مدت این سرویس ' + U.faNum(caps.maxDuration) + ' ثانیه است.' });
    }
    if (caps.resolutions.indexOf(s.resolution) === -1) {
      issues.push({ key: 'resolution', text: 'رزولوشن «' + O.label(O.videoResolutions, s.resolution) + '» در این سرویس پشتیبانی نمی‌شود.' });
    }
    if (caps.fps.indexOf(s.fps) === -1) {
      issues.push({ key: 'fps', text: 'فریم‌ریت انتخابی در این سرویس موجود نیست.' });
    }
    if (caps.formats.indexOf(s.format) === -1) {
      issues.push({ key: 'format', text: 'فرمت ' + s.format.toUpperCase() + ' خروجی این سرویس نیست.' });
    }
    if (s.voiceover && !caps.voiceover) {
      issues.push({ key: 'voiceover', text: 'گویندگی در این سرویس پشتیبانی نمی‌شود.' });
    }
    if (s.subtitles && !caps.subtitles) {
      issues.push({ key: 'subtitles', text: 'زیرنویس در این سرویس پشتیبانی نمی‌شود.' });
    }
    if (s.music && s.music !== 'none' && !caps.music) {
      issues.push({ key: 'music', text: 'موسیقی در این سرویس پشتیبانی نمی‌شود.' });
    }
    if (s.mode === 'image' && !caps.imageToVideo) {
      issues.push({ key: 'mode', text: 'مسیر «تصویر به ویدیو» در این سرویس موجود نیست.' });
    }
    if (s.transition && caps.transitions.indexOf(s.transition) === -1) {
      issues.push({ key: 'transition', text: 'انتقال «' + O.label(O.transitions, s.transition) + '» در این سرویس پشتیبانی نمی‌شود.' });
    }
    return issues;
  }

  function buildShotPrompt(s, shot) {
    var en = false; /* پرامپت شات همیشه فارسی است چون توضیح شات فارسی وارد می‌شود */
    var parts = [];
    parts.push('شات ' + shot.n + ' (' + shot.dur + ' ثانیه): ' + shot.desc);
    var cam = O.byId(O.cameraMoves, shot.cam);
    var trans = O.byId(O.transitions, shot.trans);
    var inten = O.byId(O.moveIntensity, s.moveIntensity);
    if (cam) parts.push('دوربین: ' + cam.fa + (inten ? ' — ' + inten.fa : ''));
    if (trans) parts.push('گذار به شات بعدی: ' + trans.fa);
    var style = O.byId(O.videoStyles, s.style);
    if (style) parts.push('سبک: ' + style.fa);
    if (s.keepSubject) parts.push('ثبات سوژه با شات‌های قبل حفظ شود');
    if (s.keepStyle) parts.push('سبک و رنگ ثابت بماند');
    return parts.join('؛ ');
  }

  function buildVideoPrompt(s) {
    var parts = [];
    var mode = s.mode === 'image' ? 'تصویر به ویدیو' : 'متن به ویدیو';
    parts.push('نوع تولید: ' + mode);
    if (s.subject) parts.push('موضوع: ' + s.subject);
    var goal = O.byId(O.videoGoals, s.goal);
    if (goal) parts.push('هدف: ' + goal.fa);
    var aud = O.byId(O.videoAudiences, s.audience);
    if (aud) parts.push('مخاطب: ' + aud.fa);
    if (s.idea) parts.push('ایده: ' + s.idea);
    var style = O.byId(O.videoStyles, s.style);
    if (style) parts.push('سبک: ' + style.fa);
    var light = O.byId(O.videoLights, s.light);
    if (light) parts.push('نور: ' + light.fa);
    var color = O.byId(O.videoColors, s.color);
    if (color) parts.push('رنگ: ' + color.fa);
    if (s.ratio) parts.push('نسبت تصویر: ' + s.ratio);
    if (s.duration) parts.push('مدت هدف: ' + s.duration + ' ثانیه');
    var res = O.byId(O.videoResolutions, s.resolution);
    if (res) parts.push('رزولوشن: ' + res.fa);
    if (s.fps) parts.push('فریم‌ریت: ' + s.fps);
    if (s.format) parts.push('فرمت: ' + s.format.toUpperCase());
    var inten = O.byId(O.moveIntensity, s.moveIntensity);
    if (inten) parts.push('شدت حرکت: ' + inten.fa);
    var trans = O.byId(O.transitions, s.transition);
    if (trans) parts.push('انتقال شات‌ها: ' + trans.fa);
    if (s.keepSubject) parts.push('ثبات سوژه در کل ویدیو الزامی است');
    if (s.keepStyle) parts.push('ثبات سبک و پالت رنگ در همهٔ شات‌ها الزامی است');
    var music = O.byId(O.musicGenres, s.music);
    if (music && s.music !== 'none') parts.push('موسیقی: ' + music.fa + (s.musicVolume != null && s.musicVolume !== '' ? ' (بلندی ' + s.musicVolume + '٪)' : ''));
    if (s.sfx && s.sfx.length) {
      parts.push('افکت صوتی: ' + s.sfx.map(function (id) { return O.label(O.sfx, id); }).filter(Boolean).join('، '));
    }
    if (s.voiceover) {
      var vg = O.byId(O.voiceGenders, s.voiceGender);
      var vl = O.byId(O.voiceLangs, s.voiceLang);
      var vs = O.byId(O.voiceSpeeds, s.voiceSpeed);
      parts.push('گویندگی: صدای ' + (vg ? vg.fa : '') + ' به زبان ' + (vl ? vl.fa : '') + ' با سرعت ' + (vs ? vs.fa : ''));
      if (s.voiceText) parts.push('متن گویندگی: ' + s.voiceText);
    }
    if (s.subtitles) parts.push('زیرنویس: دارد' + (s.subLang ? ' (' + O.label(O.voiceLangs, s.subLang) + ')' : ''));
    if (s.ctaText) parts.push('دعوت به اقدام پایانی: ' + s.ctaText + (s.ctaType ? ' — ' + O.label(O.ctaTypes, s.ctaType) : ''));
    if (String(s.negative || '').trim()) parts.push('پرامپت منفی: ' + String(s.negative).trim());
    var svc = O.byId(O.videoServices, s.service);
    if (svc) parts.push('سرویس هدف: ' + svc.name + ' (نمونه)');
    return parts.join('؛ ');
  }

  /** تخمین مدت گویندگی (ثانیه) — حدود ۲٫۶ کلمه در ثانیه در سرعت عادی */
  function voiceoverEstimate(text, speed) {
    var words = U.countWords(text);
    if (!words) return 0;
    var sp = parseFloat(speed) || 1;
    return Math.ceil(words / (2.6 * sp));
  }

  /* ============================================================
     ابزارهای متنی — بریف قالبی
     ============================================================ */

  function buildTextBrief(kind, s) {
    var lines = [];
    function kv(k, v) { if (v) lines.push('- ' + k + ': ' + v); }
    if (kind === 'caption') {
      lines.push('بریف کپشن ' + O.label(O.captionPlatforms, s.platform));
      kv('موضوع', s.subject);
      kv('لحن', O.label(O.tones, s.tone));
      kv('هدف', O.label(O.contentGoals, s.goal));
      kv('حجم', s.lengthHint);
      kv('هشتگ‌های پیشنهادی', s.hashtags);
      kv('دعوت به اقدام', s.cta ? O.label(O.ctaTypes, s.cta) : '');
      kv('نکات', s.notes);
    } else if (kind === 'email') {
      lines.push('بریف ایمیل — ' + O.label(O.emailKinds, s.kind));
      kv('موضوع ایمیل', s.subject);
      kv('گیرنده', O.label(O.audiences, s.audience));
      kv('لحن', O.label(O.tones, s.tone));
      kv('پیام اصلی', s.message);
      kv('دعوت به اقدام', s.cta ? O.label(O.ctaTypes, s.cta) : '');
      kv('نکات', s.notes);
    } else if (kind === 'product') {
      lines.push('بریف توضیح محصول');
      kv('نام محصول', s.name);
      kv('مخاطب', O.label(O.audiences, s.audience));
      kv('لحن', O.label(O.tones, s.tone));
      kv('ویژگی‌های کلیدی', s.features);
      kv('مزیت رقابتی', s.advantage);
      kv('نکات', s.notes);
    } else if (kind === 'ad') {
      lines.push('بریف متن تبلیغاتی — ' + O.label(O.adKinds, s.kind));
      kv('محصول/خدمت', s.subject);
      kv('مخاطب', O.label(O.audiences, s.audience));
      kv('لحن', O.label(O.tones, s.tone));
      kv('وعدهٔ اصلی', s.promise);
      kv('دعوت به اقدام', s.cta ? O.label(O.ctaTypes, s.cta) : '');
      kv('محدودیت‌ها', s.notes);
    }
    lines.push('');
    lines.push('این خروجی یک بریف قالبی است؛ متن نهایی نیازمند تولید توسط سرویس متصل است.');
    return lines.join('\n');
  }

  /* ============================================================
     مقاله — ساختار پیشنهادی، خروجی HTML، بررسی‌های ساختاری
     ============================================================ */

  var OUTLINES = {
    edu: ['مقدمه و پیش‌نیازها', 'مرحلهٔ ۱: آماده‌سازی', 'مرحلهٔ ۲: اجرای اصلی', 'مرحلهٔ ۳: پرداخت نهایی', 'اشتباه‌های رایج و راه‌حل', 'جمع‌بندی'],
    guide: ['چرا این موضوع مهم است؟', 'اصطلاحات کلیدی', 'راهنمای گام‌به‌گام', 'نکات حرفه‌ای', 'پرسش‌های متداول', 'جمع‌بندی'],
    compare: ['معرفی گزینه‌ها', 'معیارهای مقایسه', 'مقایسهٔ گزینه‌ها', 'کدام برای شما مناسب است؟', 'جمع‌بندی'],
    product: ['معرفی محصول', 'مشکل اصلی مخاطب', 'راه‌حل محصول', 'ویژگی‌ها و مزایا', 'نظرات و شواهد', 'قیمت و دسترسی', 'جمع‌بندی'],
    news: ['خلاصهٔ خبر', 'جزئیات و شرح رویداد', 'دیدگاه‌های مرتبط', 'پیامدها و ادامهٔ ماجرا'],
    case: ['معرفی پروژه و مشتری', 'چالش', 'راه‌حل اجراشده', 'نتایج و اعداد', 'درس‌های آموخته', 'جمع‌بندی']
  };

  function buildOutlineBlocks(typeId) {
    var titles = OUTLINES[typeId] || OUTLINES.guide;
    return titles.map(function (t) {
      return { id: U.uid('blk'), type: 'h2', data: { text: t } };
    });
  }

  function buildArticleBrief(b) {
    var lines = [];
    lines.push('بریف مقاله — ' + O.label(O.articleTypes, b.type));
    lines.push('زبان: ' + O.label(O.articleLangs, b.lang) + ' | لحن: ' + (O.label(O.tones, b.tone) || '—'));
    lines.push('مخاطب: ' + (O.label(O.audiences, b.audience) || '—') + ' | هدف: ' + (O.label(O.contentGoals, b.goal) || '—'));
    lines.push('حجم: ' + (O.label(O.lengths, b.length) || '—'));
    if (b.topic) lines.push('موضوع: ' + b.topic);
    if (b.points) lines.push('نکات ضروری:\n' + b.points);
    if (b.sources) lines.push('منابع:\n' + b.sources);
    if (b.forbidden) lines.push('واژگان ممنوع: ' + b.forbidden);
    if (b.faq) lines.push('شامل پرسش‌های متداول: بله');
    if (b.cta) lines.push('دعوت به اقدام: ' + O.label(O.ctaTypes, b.cta));
    lines.push('');
    lines.push('ساختار پیشنهادی: ' + (OUTLINES[b.type] || OUTLINES.guide).join(' → '));
    lines.push('');
    lines.push('این بریف قالبی است؛ تولید متن نیازمند اتصال به سرویس است.');
    return lines.join('\n');
  }

  function safeImgSrc(url) {
    return /^(https?:\/\/|data:image\/)/i.test(url || '');
  }

  /** بلوک → HTML امن و تمیز برای وردپرس */
  function blockToHtml(b) {
    var d = b.data || {};
    switch (b.type) {
      case 'p':
        return '<p>' + U.sanitizeRich(d.html || '') + '</p>';
      case 'h2':
        return '<h2>' + esc(d.text) + '</h2>';
      case 'h3':
        return '<h3>' + esc(d.text) + '</h3>';
      case 'ul':
        return '<ul>' + (d.items || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
      case 'ol':
        return '<ol>' + (d.items || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>';
      case 'quote':
        return '<blockquote><p>' + esc(d.text) + '</p>' + (d.cite ? '<cite>' + esc(d.cite) + '</cite>' : '') + '</blockquote>';
      case 'img':
        if (!safeImgSrc(d.url)) return '<!-- تصویر بدون نشانی معتبر حذف شد -->';
        return '<figure><img src="' + attr(d.url) + '" alt="' + attr(d.alt || '') + '" loading="lazy" />' +
          (d.caption ? '<figcaption>' + esc(d.caption) + '</figcaption>' : '') + '</figure>';
      case 'link':
        if (!/^(https?:\/\/|mailto:)/i.test(d.url || '')) return '<!-- لینک نامعتبر -->';
        return '<p><a href="' + attr(d.url) + '" rel="noopener">' + esc(d.text || d.url) + '</a></p>';
      default:
        return '';
    }
  }

  function buildArticleHtml(a) {
    var set = a.settings || {};
    var body = (a.blocks || []).map(blockToHtml).join('\n');
    var head = [];
    head.push('<!-- نوا | خروجی قالبی برای وردپرس -->');
    if (a.title) head.push('<!-- عنوان: ' + a.title.replace(/-->/g, '') + ' -->');
    if (set.slug) head.push('<!-- نامک: ' + set.slug + ' -->');
    if (set.seoTitle) head.push('<!-- عنوان سئو: ' + set.seoTitle.replace(/-->/g, '') + ' -->');
    if (set.metaDesc) head.push('<!-- توضیحات متا: ' + set.metaDesc.replace(/-->/g, '') + ' -->');
    var meta = [];
    if (a.title) meta.push('<h1>' + esc(a.title) + '</h1>');
    return head.join('\n') + '\n<article>\n' + meta.join('\n') + '\n' + body + '\n</article>\n';
  }

  function articleStats(a) {
    var texts = [];
    (a.blocks || []).forEach(function (b) {
      var d = b.data || {};
      if (b.type === 'p') texts.push(U.stripHtml(d.html || ''));
      else if (d.text) texts.push(d.text);
      else if (d.items) texts.push(d.items.join(' '));
      else if (d.caption) texts.push(d.caption);
    });
    if (a.title) texts.push(a.title);
    if (a.settings && a.settings.excerpt) texts.push(a.settings.excerpt);
    var words = U.countWords(texts.join(' '));
    return { words: words, minutes: U.readingMinutes(words), blocks: (a.blocks || []).length };
  }

  /**
   * بررسی‌های سادهٔ ساختار و خوانایی — تضمین رتبه نمی‌دهد.
   * خروجی: [{id,label,status,why}] با status ∈ ok|warn|fail
   */
  function seoChecks(a) {
    var U2 = Nova.utils;
    var set = a.settings || {};
    var stats = articleStats(a);
    var title = String(a.title || '').trim();
    var blocks = a.blocks || [];
    var h2Count = blocks.filter(function (b) { return b.type === 'h2'; }).length;
    var h3Count = blocks.filter(function (b) { return b.type === 'h3'; }).length;
    var imgs = blocks.filter(function (b) { return b.type === 'img'; });
    var noAlt = imgs.filter(function (b) { return !(b.data && String(b.data.alt || '').trim()); }).length;
    var excerpt = String(set.excerpt || '').trim();
    var kw = String(set.keyword || '').trim();

    var checks = [];
    function add(id, label, ok, warn, why) {
      checks.push({ id: id, label: label, status: ok ? 'ok' : (warn ? 'warn' : 'fail'), why: why || '' });
    }

    add('title', 'عنوان مقاله', title.length >= 10 && title.length <= 70, title.length > 0,
      title ? 'طول عنوان ' + U2.faNum(title.length) + ' نویسه است؛ بازهٔ پیشنهادی ۱۰ تا ۷۰ نویسه.' : 'هنوز عنوانی نوشته نشده است.');
    add('h2', 'تیترهای H2', h2Count >= 1, false,
      h2Count ? U2.faNum(h2Count) + ' تیتر H2 در متن هست.' : 'حداقل یک تیتر H2 به خوانایی و ساختار کمک می‌کند.');
    add('h3order', 'سلسله‌مراتب تیترها', !(h3Count > 0 && h2Count === 0), true,
      h3Count && !h2Count ? 'تیتر H3 بدون H2 بالاترش استفاده شده است.' : 'ترتیب تیترها منطقی است.');
    add('length', 'حجم متن', stats.words >= 300, stats.words >= 120,
      'متن فعلی ' + U2.faNum(stats.words) + ' کلمه و حدود ' + U2.faNum(stats.minutes) + ' دقیقه مطالعه است؛ برای مقالهٔ وبلاگی دست‌کم ۳۰۰ کلمه پیشنهاد می‌شود.');
    add('excerpt', 'چکیده', excerpt.length >= 80 && excerpt.length <= 160, excerpt.length > 0,
      'طول چکیده ' + U2.faNum(excerpt.length) + ' نویسه است؛ بازهٔ پیشنهادی ۸۰ تا ۱۶۰ نویسه.');
    add('slug', 'نامک', U2.isValidSlug(set.slug), !!set.slug,
      set.slug ? (U2.isValidSlug(set.slug) ? 'نامک معتبر است.' : 'نامک فقط باید شامل حروف لاتین کوچک، عدد و خط تیره باشد.') : 'نامک برای نشانی مقاله در وردپرس لازم است.');
    add('keyword', 'کلمهٔ کلیدی', !!kw && (title.indexOf(kw) > -1 || excerpt.indexOf(kw) > -1), !!kw,
      kw ? 'کلمهٔ کلیدی در عنوان یا چکیده ' + ((title.indexOf(kw) > -1 || excerpt.indexOf(kw) > -1) ? 'آمده است.' : 'نیامده است.') : 'یک کلمهٔ کلیدی کانونی انتخاب کنید.');
    add('alt', 'متن جایگزین تصاویر', imgs.length === 0 || noAlt === 0, noAlt < imgs.length,
      imgs.length ? (noAlt ? U2.faNum(noAlt) + ' تصویر بدون متن جایگزین است.' : 'همهٔ تصاویر متن جایگزین دارند.') : 'تصویری در مقاله نیست.');
    add('meta', 'عنوان و توضیحات سئو', !!set.seoTitle && !!set.metaDesc, !!(set.seoTitle || set.metaDesc),
      'برای نمایش درست در نتایج جست‌وجو، عنوان سئو و توضیحات متا را کامل کنید.');
    return checks;
  }

  /** اعتبارسنجی بارگذاری مقاله از JSON */
  function validateArticleImport(payload) {
    if (!payload || typeof payload !== 'object') return { ok: false, reason: 'فایل JSON معتبر نیست.' };
    if (!Array.isArray(payload.blocks)) return { ok: false, reason: 'فیلد blocks (آرایهٔ بلوک‌ها) یافت نشد.' };
    var bad = 0;
    var types = ['p', 'h2', 'h3', 'ul', 'ol', 'quote', 'img', 'link'];
    payload.blocks.forEach(function (b) {
      if (!b || typeof b !== 'object' || types.indexOf(b.type) === -1 || !b.data || typeof b.data !== 'object') bad += 1;
    });
    if (bad) return { ok: false, reason: U.faNum(bad) + ' بلوک ساختار نامعتبر دارد.' };
    if (payload.title != null && typeof payload.title !== 'string') return { ok: false, reason: 'عنوان باید متن باشد.' };
    if (payload.settings != null && typeof payload.settings !== 'object') return { ok: false, reason: 'فیلد settings باید شیء باشد.' };
    return { ok: true };
  }

  return {
    validateCustomDims: validateCustomDims,
    validateRefFile: validateRefFile,
    buildPhotoPrompt: buildPhotoPrompt,
    ratioLabel: ratioLabel,
    creativeWord: creativeWord,
    normalizeShots: normalizeShots,
    shotsTotal: shotsTotal,
    validateDuration: validateDuration,
    serviceIssues: serviceIssues,
    buildShotPrompt: buildShotPrompt,
    buildVideoPrompt: buildVideoPrompt,
    voiceoverEstimate: voiceoverEstimate,
    buildTextBrief: buildTextBrief,
    buildOutlineBlocks: buildOutlineBlocks,
    buildArticleBrief: buildArticleBrief,
    blockToHtml: blockToHtml,
    buildArticleHtml: buildArticleHtml,
    articleStats: articleStats,
    seoChecks: seoChecks,
    validateArticleImport: validateArticleImport,
    safeImgSrc: safeImgSrc
  };
})();
