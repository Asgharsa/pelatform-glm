/* ============================================================
   نوا — کاتالوگ گزینه‌ها و داده‌های مرجع (بدون DOM)
   ============================================================ */
window.Nova = window.Nova || {};

Nova.options = (function () {
  'use strict';

  /* ---------- استودیوی عکس ---------- */

  var PHOTO_STYLES = [
    { id: 'realistic', fa: 'واقع‌گرایانه', en: 'photorealistic, ultra-detailed', icon: 'camera' },
    { id: 'cinematic', fa: 'سینمایی', en: 'cinematic still, film grain, dramatic mood', icon: 'video' },
    { id: 'luxury', fa: 'تبلیغاتی لوکس', en: 'high-end commercial advertising photography', icon: 'star' },
    { id: '3d', fa: 'سه‌بعدی', en: '3D render, octane, soft studio lighting', icon: 'layers' },
    { id: 'illustration', fa: 'تصویرسازی', en: 'digital illustration, editorial art', icon: 'pen' },
    { id: 'anime', fa: 'انیمه', en: 'anime key visual, cel shading', icon: 'sparkles' },
    { id: 'minimal', fa: 'مینیمال', en: 'minimalist, clean negative space', icon: 'target' },
    { id: 'watercolor', fa: 'آبرنگ', en: 'watercolor painting, soft washes', icon: 'palette' }
  ];

  var LIGHTING = [
    { id: 'soft', fa: 'نور طبیعی ملایم', en: 'soft natural light' },
    { id: 'golden', fa: 'ساعت طلایی', en: 'golden hour warm light' },
    { id: 'studio', fa: 'استودیویی', en: 'studio softbox lighting' },
    { id: 'dramatic', fa: 'دراماتیک', en: 'dramatic chiaroscuro lighting' },
    { id: 'backlit', fa: 'پس‌نور', en: 'backlit rim light' },
    { id: 'neon', fa: 'نئونی', en: 'neon color glow' },
    { id: 'overcast', fa: 'ابری', en: 'soft overcast diffuse light' },
    { id: 'candle', fa: 'شمع‌گونه', en: 'warm candlelight' }
  ];

  var PALETTES = [
    { id: 'warm', fa: 'گرم', en: 'warm earthy palette' },
    { id: 'cool', fa: 'سرد', en: 'cool blue palette' },
    { id: 'pastel', fa: 'پاستلی', en: 'soft pastel palette' },
    { id: 'mono', fa: 'تک‌رنگ', en: 'monochrome palette' },
    { id: 'earthy', fa: 'خاکی', en: 'earthy tones' },
    { id: 'vibrant', fa: 'پرجان', en: 'vibrant saturated palette' },
    { id: 'jewel', fa: 'جواهری', en: 'deep jewel tones' }
  ];

  var BACKGROUNDS = [
    { id: 'solid', fa: 'رنگ ساده', en: 'clean solid color background' },
    { id: 'gradient', fa: 'گرادیان', en: 'smooth gradient background' },
    { id: 'studio', fa: 'پس‌زمینهٔ استودیو', en: 'seamless studio backdrop' },
    { id: 'natural', fa: 'طبیعی', en: 'natural environment' },
    { id: 'urban', fa: 'شهری', en: 'urban environment' },
    { id: 'bokeh', fa: 'بوکه', en: 'blurred bokeh background' },
    { id: 'white', fa: 'سفید یکدست', en: 'pure white background' }
  ];

  var COMPOSITIONS = [
    { id: 'centered', fa: 'مرکزی', en: 'centered composition' },
    { id: 'thirds', fa: 'قاعدهٔ یک‌سوم', en: 'rule of thirds' },
    { id: 'closeup', fa: 'کلوزآپ', en: 'tight close-up' },
    { id: 'wide', fa: 'واید', en: 'wide establishing shot' },
    { id: 'flatlay', fa: 'فلت‌لی', en: 'top-down flat lay' },
    { id: 'symmetric', fa: 'متقارن', en: 'symmetrical composition' },
    { id: 'leading', fa: 'خطوط راهنما', en: 'leading lines' }
  ];

  var ANGLES = [
    { id: 'eye', fa: 'مستقیم (سطح چشم)', en: 'eye-level angle' },
    { id: 'low', fa: 'زاویهٔ پایین', en: 'low angle' },
    { id: 'high', fa: 'زاویهٔ بالا', en: 'high angle' },
    { id: 'top', fa: 'عمود از بالا', en: 'top-down angle' },
    { id: 'dutch', fa: 'کج (داچ)', en: 'dutch angle' },
    { id: 'side', fa: 'نمای کنار', en: 'side view' },
    { id: 'front', fa: 'نمای روبه‌رو', en: 'front view' }
  ];

  var LENSES = [
    { id: '24', fa: 'واید ۲۴ میلی‌متر', en: '24mm wide lens' },
    { id: '50', fa: 'استاندارد ۵۰ میلی‌متر', en: '50mm lens' },
    { id: '85', fa: 'پرترهٔ ۸۵ میلی‌متر', en: '85mm portrait lens, shallow depth of field' },
    { id: 'macro', fa: 'ماکرو', en: 'macro lens, extreme detail' },
    { id: '200', fa: 'تله‌فوتو ۲۰۰ میلی‌متر', en: '200mm telephoto, compressed perspective' },
    { id: 'fisheye', fa: 'چشم‌ماهی', en: 'fisheye lens' }
  ];

  var QUALITY = [
    { id: 'standard', fa: 'استاندارد', en: 'high quality, sharp focus' },
    { id: 'high', fa: 'بالا', en: 'high resolution, crisp details, professional finish' },
    { id: 'ultra', fa: 'حداکثر', en: 'masterpiece, ultra-detailed, 8k-level finish' }
  ];

  var RATIOS = [
    { id: '1:1', w: 1, h: 1 },
    { id: '4:5', w: 4, h: 5 },
    { id: '9:16', w: 9, h: 16 },
    { id: '16:9', w: 16, h: 9 },
    { id: '3:2', w: 3, h: 2 },
    { id: 'custom', w: 0, h: 0 }
  ];

  var REF_ROLES = [
    { id: 'style', fa: 'سبک و حال‌وهوا' },
    { id: 'composition', fa: 'ترکیب‌بندی' },
    { id: 'subject', fa: 'شبیه‌سازی سوژه' },
    { id: 'color', fa: 'پالت رنگ' }
  ];

  var PHOTO_USES = [
    { id: 'post', fa: 'پست شبکهٔ اجتماعی' },
    { id: 'banner', fa: 'بنر وب‌سایت' },
    { id: 'cover', fa: 'کاور وبلاگ' },
    { id: 'ad', fa: 'تبلیغات' },
    { id: 'presentation', fa: 'ارائه و پرزنتشن' },
    { id: 'print', fa: 'چاپ' }
  ];

  var IMG_FORMATS = [
    { id: 'jpeg', fa: 'JPEG (حجم کمتر)' },
    { id: 'png', fa: 'PNG (بدون افت کیفیت)' },
    { id: 'webp', fa: 'WebP (مدرن)' }
  ];

  var TEXT_SPACE = [
    { id: 'yes', fa: 'بله — فضای خالی برای متن', en: 'clean empty area reserved for text overlay' },
    { id: 'no', fa: 'خیر — بدون متن', en: 'no text, no letters, no watermark' }
  ];

  var TEXT_POSITIONS = [
    { id: 'top', fa: 'بالا', en: 'upper third' },
    { id: 'bottom', fa: 'پایین', en: 'lower third' },
    { id: 'center', fa: 'مرکز', en: 'center' },
    { id: 'side', fa: 'کنار', en: 'side margin' }
  ];

  var PHOTO_TEMPLATES = [
    {
      id: 'post', name: 'پست اینستاگرام', icon: 'image', desc: 'مربع ۱:۱، فضای متن پایین',
      patch: { ratio: '1:1', style: 'luxury', use: 'post', textSpace: 'yes', textPos: 'bottom', background: 'studio', composition: 'centered' }
    },
    {
      id: 'story', name: 'استوری', icon: 'zap', desc: 'عمودی ۹:۱۶، پرجزئیات',
      patch: { ratio: '9:16', style: 'cinematic', use: 'post', textSpace: 'yes', textPos: 'top', lighting: 'dramatic' }
    },
    {
      id: 'product', name: 'عکس محصول', icon: 'briefcase', desc: '۴:۵، پس‌زمینهٔ استودیو',
      patch: { ratio: '4:5', style: 'realistic', use: 'ad', textSpace: 'no', background: 'studio', lighting: 'studio', composition: 'centered', angle: 'eye', lens: '85' }
    },
    {
      id: 'cover', name: 'کاور وبلاگ', icon: 'books', desc: 'افقی ۱۶:۹، مینیمال',
      patch: { ratio: '16:9', style: 'minimal', use: 'cover', textSpace: 'yes', textPos: 'side', background: 'solid' }
    }
  ];

  /* ---------- استودیوی ویدیو ---------- */

  var VIDEO_STYLES = [
    { id: 'cinematic', fa: 'سینمایی', en: 'cinematic live-action' },
    { id: 'documentary', fa: 'مستندگونه', en: 'documentary style' },
    { id: 'motion', fa: 'موشن‌گرافیک', en: 'motion graphics' },
    { id: '3d', fa: 'رندر سه‌بعدی', en: '3D animation render' },
    { id: 'anime', fa: 'انیمه', en: 'anime style' },
    { id: 'handdrawn', fa: 'طراحی دستی', en: 'hand-drawn animation' },
    { id: 'retro', fa: 'فیلم قدیمی', en: 'retro film look' },
    { id: 'minimal', fa: 'مینیمال', en: 'minimal clean style' }
  ];

  var VIDEO_LIGHTS = [
    { id: 'natural', fa: 'نور طبیعی', en: 'natural lighting' },
    { id: 'studio', fa: 'استودیویی', en: 'studio lighting' },
    { id: 'golden', fa: 'ساعت طلایی', en: 'golden hour' },
    { id: 'night', fa: 'شبانه', en: 'night scene lighting' },
    { id: 'dramatic', fa: 'دراماتیک', en: 'dramatic contrast lighting' }
  ];

  var VIDEO_COLORS = [
    { id: 'warm', fa: 'گرم و صمیمی', en: 'warm color grading' },
    { id: 'cool', fa: 'سرد و حرفه‌ای', en: 'cool teal grading' },
    { id: 'vibrant', fa: 'پرجان', en: 'vibrant saturated colors' },
    { id: 'muted', fa: 'مات و آرام', en: 'muted desaturated grading' },
    { id: 'bw', fa: 'سیاه‌وسفید', en: 'black and white' }
  ];

  var CAMERA_MOVES = [
    { id: 'static', fa: 'ثابت', en: 'static camera' },
    { id: 'pan', fa: 'پن (چرخش افقی)', en: 'smooth pan' },
    { id: 'tilt', fa: 'تیلت (عمودی)', en: 'tilt up' },
    { id: 'dollyin', fa: 'دالی این (نزدیک‌شدن)', en: 'slow dolly in' },
    { id: 'dollyout', fa: 'دالی اوت (دورشدن)', en: 'dolly out' },
    { id: 'orbit', fa: 'چرخش دور سوژه', en: 'orbit around subject' },
    { id: 'crane', fa: 'کرین', en: 'crane shot' },
    { id: 'handheld', fa: 'دوربین روی دست', en: 'handheld camera' },
    { id: 'tracking', fa: 'تعقیب سوژه', en: 'tracking shot' },
    { id: 'zoom', fa: 'زوم', en: 'slow zoom' }
  ];

  var MOVE_INTENSITY = [
    { id: 'calm', fa: 'آرام', en: 'subtle slow movement' },
    { id: 'balanced', fa: 'متعادل', en: 'moderate movement' },
    { id: 'dynamic', fa: 'پویا', en: 'dynamic energetic movement' }
  ];

  var TRANSITIONS = [
    { id: 'cut', fa: 'کات ساده', en: 'hard cut' },
    { id: 'fade', fa: 'کراس‌فید', en: 'cross dissolve' },
    { id: 'whip', fa: 'ویپ‌پن', en: 'whip pan transition' },
    { id: 'match', fa: 'مچ‌کات', en: 'match cut' },
    { id: 'morph', fa: 'مورف', en: 'morph transition' },
    { id: 'wipe', fa: 'وایپ', en: 'wipe transition' }
  ];

  var VIDEO_GOALS = [
    { id: 'awareness', fa: 'آگاهی از برند' },
    { id: 'sales', fa: 'فروش' },
    { id: 'edu', fa: 'آموزش' },
    { id: 'trust', fa: 'اعتمادسازی' },
    { id: 'launch', fa: 'معرفی محصول' }
  ];

  var VIDEO_AUDIENCES = [
    { id: 'general', fa: 'عموم مخاطبان' },
    { id: 'young', fa: 'جوانان' },
    { id: 'professional', fa: 'متخصصان و مدیران' },
    { id: 'existing', fa: 'مشتریان فعلی' }
  ];

  var VIDEO_RESOLUTIONS = [
    { id: '720p', fa: '۷۲۰p', h: 720 },
    { id: '1080p', fa: '۱۰۸۰p', h: 1080 },
    { id: '4k', fa: '4K', h: 2160 }
  ];

  var VIDEO_FPS = [
    { id: '24', fa: '۲۴ فریم (سینمایی)' },
    { id: '30', fa: '۳۰ فریم (استاندارد)' },
    { id: '60', fa: '۶۰ فریم (روان)' }
  ];

  var VIDEO_FORMATS = [
    { id: 'mp4', fa: 'MP4' },
    { id: 'webm', fa: 'WebM' }
  ];

  var MUSIC_GENRES = [
    { id: 'none', fa: 'بدون موسیقی' },
    { id: 'ambient', fa: 'امبینت' },
    { id: 'upbeat', fa: 'شاد و پرانرژی' },
    { id: 'cinematic', fa: 'سینمایی' },
    { id: 'acoustic', fa: 'آکوستیک' },
    { id: 'electronic', fa: 'الکترونیک' },
    { id: 'traditional', fa: 'ملودی ایرانی' }
  ];

  var SFX = [
    { id: 'whoosh', fa: 'ویژ (حرکت سریع)' },
    { id: 'pop', fa: 'پاپ (ظاهرشدن)' },
    { id: 'click', fa: 'کلیک' },
    { id: 'chime', fa: 'زمزمهٔ نوتیفیکیشن' },
    { id: 'nature', fa: 'صدای محیط' },
    { id: 'crows', fa: 'همهمهٔ جمعیت' }
  ];

  var VOICE_LANGS = [
    { id: 'fa', fa: 'فارسی' },
    { id: 'en', fa: 'انگلیسی' }
  ];

  var VOICE_GENDERS = [
    { id: 'female', fa: 'زن' },
    { id: 'male', fa: 'مرد' }
  ];

  var VOICE_SPEEDS = [
    { id: '0.9', fa: 'آرام' },
    { id: '1', fa: 'عادی' },
    { id: '1.15', fa: 'تند' }
  ];

  /* سرویس‌های نمونهٔ ویدیو — صرفاً برای نمایش وابستگی تنظیمات به سرویس */
  var VIDEO_SERVICES = [
    {
      id: 'demo-a', name: 'سرویس نمونهٔ الف', demo: true,
      caps: { maxDuration: 60, resolutions: ['720p', '1080p'], fps: ['24', '30'], formats: ['mp4'], voiceover: true, subtitles: true, music: true, imageToVideo: true, transitions: ['cut', 'fade', 'wipe'] }
    },
    {
      id: 'demo-b', name: 'سرویس نمونهٔ ب', demo: true,
      caps: { maxDuration: 15, resolutions: ['720p', '1080p', '4k'], fps: ['24', '30', '60'], formats: ['mp4', 'webm'], voiceover: false, subtitles: true, music: false, imageToVideo: false, transitions: ['cut', 'fade', 'whip', 'match', 'morph'] }
    },
    {
      id: 'demo-c', name: 'سرویس نمونهٔ ج (متنی)', demo: true,
      caps: { maxDuration: 120, resolutions: ['1080p'], fps: ['30'], formats: ['mp4'], voiceover: true, subtitles: false, music: true, imageToVideo: true, transitions: ['cut'] }
    }
  ];

  var VIDEO_TEMPLATES = [
    {
      id: 'reels', name: 'ریلز تبلیغاتی', icon: 'zap', desc: '۹:۱۶ · ۱۵ ثانیه · ۴ شات پویا',
      patch: {
        mode: 'text', ratio: '9:16', duration: 15, style: 'cinematic', moveIntensity: 'dynamic',
        transition: 'whip', music: 'upbeat', voiceover: true, voiceLang: 'fa', subtitles: true, resolution: '1080p', fps: '30',
        shots: [
          { desc: 'نمای نزدیک از محصول روی میز با نور دراماتیک', dur: 3, cam: 'dollyin', trans: 'cut' },
          { desc: 'لحظهٔ استفاده — دست کاربر و واکنش مثبت', dur: 4, cam: 'tracking', trans: 'whip' },
          { desc: 'نمای محصول با پس‌زمینهٔ مینیمال و فضای متن', dur: 4, cam: 'static', trans: 'whip' },
          { desc: 'شات پایانی: لوگو و دعوت به اقدام', dur: 4, cam: 'zoom', trans: 'fade' }
        ]
      }
    },
    {
      id: 'product', name: 'ویدیوی محصول', icon: 'briefcase', desc: '۱۶:۹ · ۳۰ ثانیه · آرام و حرفه‌ای',
      patch: {
        mode: 'text', ratio: '16:9', duration: 30, style: '3d', moveIntensity: 'calm',
        transition: 'fade', music: 'ambient', voiceover: true, voiceLang: 'fa', subtitles: true, resolution: '1080p', fps: '30',
        shots: [
          { desc: 'چرخش آرام دور محصول روی پس‌زمینهٔ استودیویی', dur: 8, cam: 'orbit', trans: 'fade' },
          { desc: 'کلوزآپ از جزئیات و بافت', dur: 7, cam: 'static', trans: 'fade' },
          { desc: 'نمایش کاربرد محصول در صحنهٔ واقعی', dur: 8, cam: 'tracking', trans: 'fade' },
          { desc: 'نمای پایانی با لوگو و شعار', dur: 7, cam: 'dollyout', trans: 'fade' }
        ]
      }
    },
    {
      id: 'story', name: 'استوری موشن', icon: 'image', desc: '۹:۱۶ · ۱۰ ثانیه · موشن‌گرافیک',
      patch: {
        mode: 'text', ratio: '9:16', duration: 10, style: 'motion', moveIntensity: 'balanced',
        transition: 'morph', music: 'electronic', voiceover: false, subtitles: true, resolution: '720p', fps: '30',
        shots: [
          { desc: 'متن عنوان با انیمیشن ورود شکل‌ها', dur: 3, cam: 'static', trans: 'morph' },
          { desc: 'آیکون‌های متحرک برای سه ویژگی اصلی', dur: 4, cam: 'static', trans: 'morph' },
          { desc: 'فراخوان پایانی با دکمهٔ تعاملی', dur: 3, cam: 'zoom', trans: 'fade' }
        ]
      }
    },
    {
      id: 'brand', name: 'معرفی برند', icon: 'star', desc: '۱۶:۹ · ۴۵ ثانیه · سینمایی',
      patch: {
        mode: 'text', ratio: '16:9', duration: 45, style: 'documentary', moveIntensity: 'calm',
        transition: 'fade', music: 'cinematic', voiceover: true, voiceLang: 'fa', subtitles: true, resolution: '1080p', fps: '24',
        shots: [
          { desc: 'امداد نما (واید) از فضای کار برند', dur: 10, cam: 'crane', trans: 'fade' },
          { desc: 'دست‌ها در حال کار — جزئیات صنعتگری', dur: 8, cam: 'static', trans: 'cut' },
          { desc: 'مصاحبه یا روایت مشتری', dur: 12, cam: 'static', trans: 'fade' },
          { desc: 'مجموعهٔ لحظه‌های برند (مونتاژ آرام)', dur: 9, cam: 'handheld', trans: 'fade' },
          { desc: 'لوگو با نورپردازی نرم', dur: 6, cam: 'dollyin', trans: 'fade' }
        ]
      }
    }
  ];

  /* ---------- مقاله و ابزارهای متنی ---------- */

  var ARTICLE_TYPES = [
    { id: 'edu', fa: 'آموزشی' },
    { id: 'guide', fa: 'راهنما' },
    { id: 'compare', fa: 'مقایسه‌ای' },
    { id: 'product', fa: 'معرفی محصول' },
    { id: 'news', fa: 'خبری' },
    { id: 'case', fa: 'مطالعهٔ موردی' }
  ];

  var TONES = [
    { id: 'formal', fa: 'رسمی' },
    { id: 'friendly', fa: 'صمیمی' },
    { id: 'motivational', fa: 'انگیزشی' },
    { id: 'educational', fa: 'آموزشی' },
    { id: 'humorous', fa: 'طنز' },
    { id: 'newsy', fa: 'خبری' },
    { id: 'technical', fa: 'فنی' }
  ];

  var AUDIENCES = [
    { id: 'general', fa: 'عمومی' },
    { id: 'beginner', fa: 'مبتدی' },
    { id: 'pro', fa: 'حرفه‌ای' },
    { id: 'managers', fa: 'مدیران' },
    { id: 'teens', fa: 'نوجوانان' },
    { id: 'technical', fa: 'مخاطب فنی' }
  ];

  var CONTENT_GOALS = [
    { id: 'edu', fa: 'آموزش مخاطب' },
    { id: 'seo', fa: 'رشد سئو' },
    { id: 'leads', fa: 'جذب مشتری' },
    { id: 'trust', fa: 'اعتمادسازی' },
    { id: 'brand', fa: 'آگاهی از برند' },
    { id: 'sales', fa: 'فروش' }
  ];

  var LENGTHS = [
    { id: 'short', fa: 'کوتاه (حدود ۵۰۰ کلمه)' },
    { id: 'medium', fa: 'متوسط (حدود ۹۰۰ کلمه)' },
    { id: 'long', fa: 'بلند (حدود ۱۵۰۰ کلمه)' }
  ];

  var ARTICLE_LANGS = [
    { id: 'fa', fa: 'فارسی' },
    { id: 'en', fa: 'انگلیسی' },
    { id: 'bilingual', fa: 'دوزبانه (فارسی + انگلیسی)' }
  ];

  var CTATYPES = [
    { id: 'comment', fa: 'دعوت به ثبت دیدگاه' },
    { id: 'subscribe', fa: 'عضویت در خبرنامه' },
    { id: 'demo', fa: 'درخواست مشاوره/دمو' },
    { id: 'buy', fa: 'خرید محصول' },
    { id: 'download', fa: 'دانلود فایل' },
    { id: 'share', fa: 'اشتراک‌گذاری مقاله' }
  ];

  var CATEGORIES = [
    { id: 'marketing', fa: 'بازاریابی' },
    { id: 'tutorial', fa: 'آموزش' },
    { id: 'product', fa: 'محصولات' },
    { id: 'news', fa: 'اخبار' },
    { id: 'brand', fa: 'دربارهٔ برند' },
    { id: 'general', fa: 'عمومی' }
  ];

  /* ابزارهای متنی */
  var CAPTION_PLATFORMS = [
    { id: 'instagram', fa: 'اینستاگرام' },
    { id: 'linkedin', fa: 'لینکدین' },
    { id: 'x', fa: 'ایکس (توییتر)' },
    { id: 'telegram', fa: 'تلگرام' }
  ];

  var EMAIL_KINDS = [
    { id: 'newsletter', fa: 'خبرنامه' },
    { id: 'welcome', fa: 'خوش‌آمدگویی' },
    { id: 'promo', fa: 'معرفی پیشنهاد' },
    { id: 'followup', fa: 'پیگیری' }
  ];

  var AD_KINDS = [
    { id: 'social', fa: 'تبلیغ شبکهٔ اجتماعی' },
    { id: 'google', fa: 'تبلیغ گوگل' },
    { id: 'banner', fa: 'بنر' }
  ];

  /* ---------- کمکی ---------- */

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function label(list, id) {
    var it = byId(list, id);
    return it ? (it.fa || it.label || '') : '';
  }

  return {
    photoStyles: PHOTO_STYLES, lighting: LIGHTING, palettes: PALETTES, backgrounds: BACKGROUNDS,
    compositions: COMPOSITIONS, angles: ANGLES, lenses: LENSES, quality: QUALITY, ratios: RATIOS,
    refRoles: REF_ROLES, photoUses: PHOTO_USES, imgFormats: IMG_FORMATS, textSpace: TEXT_SPACE,
    textPositions: TEXT_POSITIONS, photoTemplates: PHOTO_TEMPLATES,
    videoStyles: VIDEO_STYLES, videoLights: VIDEO_LIGHTS, videoColors: VIDEO_COLORS,
    cameraMoves: CAMERA_MOVES, moveIntensity: MOVE_INTENSITY, transitions: TRANSITIONS,
    videoGoals: VIDEO_GOALS, videoAudiences: VIDEO_AUDIENCES, videoResolutions: VIDEO_RESOLUTIONS,
    videoFps: VIDEO_FPS, videoFormats: VIDEO_FORMATS, musicGenres: MUSIC_GENRES, sfx: SFX,
    voiceLangs: VOICE_LANGS, voiceGenders: VOICE_GENDERS, voiceSpeeds: VOICE_SPEEDS,
    videoServices: VIDEO_SERVICES, videoTemplates: VIDEO_TEMPLATES,
    articleTypes: ARTICLE_TYPES, tones: TONES, audiences: AUDIENCES, contentGoals: CONTENT_GOALS,
    lengths: LENGTHS, articleLangs: ARTICLE_LANGS, ctaTypes: CTATYPES, categories: CATEGORIES,
    captionPlatforms: CAPTION_PLATFORMS, emailKinds: EMAIL_KINDS, adKinds: AD_KINDS,
    byId: byId, label: label
  };
})();
