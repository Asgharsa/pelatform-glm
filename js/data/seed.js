/* ============================================================
   نوا — دادهٔ نمونه (بار اول)
   همهٔ آیتم‌ها demo: true دارند و در رابط با برچسب «نمونه»
   از داده‌های کاربر تفکیک می‌شوند.
   ============================================================ */
window.Nova = window.Nova || {};

Nova.seed = (function () {
  'use strict';

  var U = Nova.utils;

  /* تصویر SVG درون‌خطی برای مقالات نمونه (بدون وابستگی به اینترنت) */
  function svgCover(c1, c2, label) {
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='" + c1 + "'/><stop offset='1' stop-color='" + c2 + "'/>" +
      "</linearGradient></defs>" +
      "<rect width='1200' height='675' fill='url(#g)'/>" +
      "<circle cx='980' cy='150' r='180' fill='rgba(255,255,255,0.08)'/>" +
      "<circle cx='180' cy='560' r='220' fill='rgba(255,255,255,0.06)'/>" +
      "<text x='60' y='330' font-family='Vazirmatn, Tahoma' font-size='44' fill='rgba(255,255,255,0.85)' direction='rtl'>" + label + "</text>" +
      "</svg>";
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function blk(type, data) { return { id: U.uid('blk'), type: type, data: data }; }
  function daysFromNow(n) { var d = new Date(); d.setDate(d.getDate() + n); return d; }

  function makeArticle1() {
    return {
      id: 'demo-art-1', demo: true, status: 'done',
      title: '۷ تکنیک عکاسی محصول که هر فروشگاه اینترنتی باید بداند',
      createdAt: Date.now() - 86400000 * 12, updatedAt: Date.now() - 86400000 * 2,
      blocks: [
        blk('p', { html: 'عکس خوب محصول، سکوی پرتاب فروش است. در بسیاری از فروشگاه‌های اینترنتی، تصویر نخستین چیزی است که مخاطب می‌بیند و آخرین بهانه‌ای که برای کلیک روی دکمهٔ خرید لازم دارد. خبر خوب این‌که برای عکاسی حرفه‌ای از محصول، دوربین گران لازم نیست؛ نور درست، ترکیب‌بندی ساده و چند تکنیک کوچک کافی است.' }),
        blk('h2', { text: '۱. نور پنجره، ارزان‌ترین استودیوی دنیا' }),
        blk('p', { html: 'نور طبیعیِ پنجره، نرم و یکدست است. محصول را در زاویهٔ ۴۵ درجه نسبت به پنجره بگذارید و از سمت مقابل، یک کاغذ سفید به‌عنوان بازتابنده استفاده کنید تا سایه‌ها ملایم شوند.' }),
        blk('ul', { items: ['ساعت ۹ تا ۱۱ صبح بهترین نور را دارد', 'از نور مستقیم ظهر بپرهیزید؛ سایهٔ تیز می‌سازد', 'یک مقوای سفید به‌عنوان بازتابنده کافی است'] }),
        blk('h2', { text: '۲. پس‌زمینه را ساده نگه دارید' }),
        blk('p', { html: 'هدف اصلی، محصول است؛ نه دکوراسیون. پس‌زمینهٔ تک‌رنگ یا چوب ساده، توجه را روی محصول قفل می‌کند. اگر محصول رنگی است، پس‌زمینهٔ خنثی انتخاب کنید تا رنگ اصلی تأثیرگذارتر شود.' }),
        blk('quote', { text: 'در عکاسی محصول، هر چیزی که به داستان کمک نمی‌کند، از داستان کم می‌کند.', cite: 'اصل رایج در عکاسی تبلیغاتی' }),
        blk('h2', { text: '۳. سه‌ضلعی طلایی: زاویه، ارتفاع، فاصله' }),
        blk('p', { html: 'ارتفاع دوربین را هم‌سطح محصول بگیرید تا حس روبه‌رو بودن ایجاد شود؛ برای عکس‌های لایف‌استایل، زاویهٔ کمی بالاتر طبیعی‌تر است. برای جزئیات بافت، کلوزآپ نترسید.' }),
        blk('img', { url: svgCover('#5b3aa8', '#2c2552', 'نمونهٔ کاور: عکاسی محصول'), alt: 'کاور مقاله با تم بنفش و عنوان عکاسی محصول', caption: 'نمایش فضای کاور وبلاگ با نسبت ۱۶:۹' }),
        blk('h2', { text: '۴. ثبات با سه‌پایه و تایمر' }),
        blk('p', { html: 'لرزش دست، جزئیات را محو می‌کند. حتی یک سه‌پایهٔ سادهٔ میزی به‌همراه تایمر دو ثانیه‌ای، وضوح عکس را چند برابر می‌کند.' }),
        blk('h3', { text: 'تنظیم پیشنهادی موبایل' }),
        blk('ol', { items: ['قفل فوکوس و نور را روی محصول فعال کنید (لمس طولانی)', 'نوردهی را ۰٫۳- تا ۰٫۷- کم کنید تا هایلایت نسوزد', 'عکس را در فرمت خام یا بالاترین کیفیت ذخیره کنید'] }),
        blk('h2', { text: 'جمع‌بندی' }),
        blk('p', { html: 'با نور پنجره، پس‌زمینهٔ ساده، سه‌پایه و کمی دقت در زاویه، می‌توانید عکس‌هایی بسازید که از میان نتایج جست‌وجو بیرون بزنند. این تکنیک‌ها را همین هفته روی یکی از محصولاتتان امتحان کنید.' })
      ],
      settings: {
        author: 'سارا محمدی', category: 'marketing',
        tags: ['عکاسی', 'فروشگاه اینترنتی', 'محصول'],
        excerpt: 'با نور پنجره، پس‌زمینهٔ ساده و چند تکنیک کوچک، عکس‌های محصولی بسازید که نرخ کلیک را بالا می‌برند — بدون دوربین گران‌قیمت.',
        featuredImage: svgCover('#5b3aa8', '#2c2552', 'عکاسی محصول'),
        featuredAlt: 'چیدمان میز کار برای عکاسی محصول با نور طبیعی',
        slug: 'product-photography-tips',
        seoTitle: '۷ تکنیک عکاسی محصول برای فروشگاه اینترنتی',
        metaDesc: 'آموزش گام‌به‌گام عکاسی محصول با موبایل و نور طبیعی؛ نورپردازی، پس‌زمینه و زاویهٔ درست برای افزایش نرخ کلیک فروشگاه شما.',
        keyword: 'عکاسی محصول',
        publishDate: new Date(Date.now() + 86400000 * 2).toISOString()
      },
      brief: null,
      revisions: []
    };
  }

  function makeArticle2() {
    return {
      id: 'demo-art-2', demo: true, status: 'draft',
      title: 'تقویم محتوایی سه‌ماهه؛ از ایده تا انتشار (پیش‌نویس)',
      createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000 * 1,
      blocks: [
        blk('p', { html: 'تولید محتوای بدون برنامه، مثل رانندگی بدون مقصد است: حرکت زیاد، پیشرفت کم. تقویم محتوایی سه‌ماهه به شما کمک می‌کند منابع را زودتر اختصاص دهید، فرصت‌های فصلی را از دست ندهید و کیفیت محتوا فدای سرعت نشود.' }),
        blk('h2', { text: 'گام ۱: سه پرسش پیش از هر تقویم' }),
        blk('ul', { items: ['مخاطب ما در سه ماه آینده به چه مشکلی فکر می‌کند؟', 'کدام مناسبت‌ها با حوزهٔ ما مرتبط‌اند؟', 'چه منبعی (نویسنده، عکس، بودجه) در دسترس است؟'] }),
        blk('h2', { text: 'گام ۲: ستون‌های تقویم را تعریف کنید' }),
        blk('p', { html: 'هر ردیف تقویم حداقل این ستون‌ها را باید داشته باشد: نوع محتوا، موضوع، کانال انتشار، مسئول و مهلت. این پنج ستون، مرز میان «برنامه» و «خیال» را روشن می‌کنند.' }),
        blk('link', { text: 'راهنمای کامل انواع محتوای ویدیویی', url: 'https://example.com/video-content-guide' })
      ],
      settings: {
        author: 'امیر رضایی', category: 'marketing',
        tags: ['تقویم محتوا', 'استراتژی'],
        excerpt: 'چارچوبی ساده برای ساخت تقویم محتوایی سه‌ماهه؛ از کشف مناسبت‌ها تا تخصیص مسئول و مهلت.',
        featuredImage: '', featuredAlt: '',
        slug: 'content-calendar-3-months',
        seoTitle: '', metaDesc: '', keyword: '',
        publishDate: ''
      },
      brief: null,
      revisions: []
    };
  }

  function make() {
    var now = Date.now();

    var brand = {
      id: 'demo-brand-1', demo: true, name: 'کافه رستا',
      field: 'کافه و رستوران',
      audience: 'جوانان ۲۰ تا ۳۵ سال تهران؛ علاقه‌مند به قهوهٔ تخصصی و فضای آرام کاری',
      tones: ['friendly', 'motivational'],
      values: ['طعم واقعی', 'اصالت', 'آرامش'],
      colors: ['#6c42d8', '#221d40', '#f4e9dc'],
      preferredWords: 'دانهٔ تازه، تجربهٔ آرام، دم‌آوری دقیق',
      forbidden: 'ادعای درمانندگی یا سلامت، «بهترین قهوهٔ جهان»، تخفیف دائمی',
      updatedAt: now - 86400000 * 30
    };

    var companies = [
      { id: 'demo-co-1', demo: true, name: 'کافه رستا', industry: 'کافه و رستوران', website: 'https://caferasta.ir', desc: 'کافه تخصصی با تمرکز روی دانه‌های تک‌خاستگاه', status: 'active' },
      { id: 'demo-co-2', demo: true, name: 'استودیو نارون', industry: 'تولید محتوا', website: 'https://noorstudio.ir', desc: 'استودیوی تولید محتوای بصری برای برندها', status: 'active' }
    ];

    var teams = [
      { id: 'demo-team-1', demo: true, name: 'تیم محتوا', companyId: 'demo-co-1', desc: 'محتوای شبکه‌های اجتماعی و وبلاگ کافه رستا' },
      { id: 'demo-team-2', demo: true, name: 'تیم طراحی', companyId: 'demo-co-2', desc: 'هویت بصری و موشن‌گرافیک' }
    ];

    var domains = [
      { id: 'demo-dom-1', demo: true, domain: 'caferasta.ir', companyId: 'demo-co-1', type: 'main', status: 'verified' },
      { id: 'demo-dom-2', demo: true, domain: 'blog.caferasta.ir', companyId: 'demo-co-1', type: 'sub', status: 'pending' }
    ];

    var users = [
      { id: 'demo-user-1', demo: true, name: 'سارا محمدی', email: 'sara@example.com', role: 'manager', teamId: 'demo-team-1', status: 'active' },
      { id: 'demo-user-2', demo: true, name: 'امیر رضایی', email: 'amir@example.com', role: 'writer', teamId: 'demo-team-1', status: 'active' },
      { id: 'demo-user-3', demo: true, name: 'نگار کریمی', email: 'negar@example.com', role: 'editor', teamId: 'demo-team-2', status: 'invited' }
    ];

    var photoBrief = {
      id: 'demo-ph-1', demo: true, title: 'کاور وبلاگ — فنجان لاته روی میز چوبی',
      createdAt: now - 86400000 * 3, updatedAt: now - 86400000 * 3,
      state: {
        subject: 'فنجان کافه‌لاته روی میز چوبی با دفترچه و علف‌ها',
        use: 'cover', scene: 'صبح آرام کافه، بخار ملایم روی فنجان',
        style: 'cinematic', quality: 'high', ratio: '16:9',
        lighting: 'golden', palette: 'warm', background: 'bokeh', composition: 'thirds',
        angle: 'eye', lens: '85', textSpace: 'yes', textPos: 'side',
        refRole: '', negative: 'متن، واترمارک، دست، شلوغی', freedom: 40,
        promptLang: 'fa', outputFormat: 'jpeg'
      },
      prompt: ''
    };
    photoBrief.prompt = Nova.builders.buildPhotoPrompt(photoBrief.state);

    var videoBrief = {
      id: 'demo-vd-1', demo: true, title: 'ریلز معرفی دمنوش پاییزی کافه رستا',
      createdAt: now - 86400000 * 2, updatedAt: now - 86400000 * 2,
      state: {
        mode: 'text', subject: 'دمنوش جدید زعفران و بهارنارنج', goal: 'sales', audience: 'young',
        idea: 'حس گرمای پاییز با رنگ‌های نارنجی و بخار دمنوش',
        style: 'cinematic', light: 'golden', color: 'warm', ratio: '9:16',
        duration: 15, resolution: '1080p', fps: '30', format: 'mp4',
        camera: 'dollyin', moveIntensity: 'dynamic', transition: 'whip',
        shots: [
          { desc: 'ریزش برگ‌های نارنجی کنار پنجرهٔ کافه', dur: 3, cam: 'static', trans: 'cut' },
          { desc: 'ریختن دمنوش در لیوان شیشه‌ای با بخار', dur: 5, cam: 'dollyin', trans: 'whip' },
          { desc: 'لحظهٔ نوشیدن و لبخند مشتری', dur: 4, cam: 'tracking', trans: 'whip' },
          { desc: 'لوگو و دعوت به اقدام: «امروز سفارش بده»', dur: 3, cam: 'zoom', trans: 'fade' }
        ],
        music: 'ambient', musicVolume: 40, sfx: ['nature'],
        voiceover: true, voiceLang: 'fa', voiceGender: 'female', voiceSpeed: '1',
        voiceText: 'پاییز رسیده و دمنوش زعفران و بهارنارنج کافه رستا هم برگشته. امروز سفارش بده و گرمای پاییز رو بچش.',
        subtitles: true, subLang: 'fa',
        ctaType: 'buy', ctaText: 'امروز سفارش بده',
        negative: 'متن اضافه، لوگوی رقیب، نور سرد', keepSubject: true, keepStyle: true,
        service: 'demo-a', promptLang: 'fa'
      },
      prompt: ''
    };
    videoBrief.prompt = Nova.builders.buildVideoPrompt(videoBrief.state);

    var textBrief = {
      id: 'demo-tx-1', demo: true, kind: 'caption', title: 'کپشن معرفی دمنوش پاییزی',
      createdAt: now - 86400000, updatedAt: now - 86400000,
      state: {
        platform: 'instagram', subject: 'دمنوش زعفران و بهارنارنج', tone: 'friendly',
        goal: 'sales', lengthHint: '۲ تا ۳ خط + هشتگ', hashtags: '#کافه_رستا #دمنوش_پاییزی #تهران',
        cta: 'buy', notes: 'حس گرمایی و صمیمی؛ ایموجی محدود'
      }
    };
    textBrief.prompt = Nova.builders.buildTextBrief('caption', textBrief.state);

    var comments = [
      { id: 'demo-cm-1', demo: true, articleId: 'demo-art-1', author: 'مهدی ن.', email: 'mehdi@example.com', text: 'خیلی کاربردی بود، مخصوصاً بخش نور پنجره. ممنون!', status: 'pending', createdAt: now - 3600000 * 20 },
      { id: 'demo-cm-2', demo: true, articleId: 'demo-art-1', author: 'الهام ر.', email: 'elham@example.com', text: 'می‌شه دربارهٔ نورپردازی استودیویی هم یه مقاله بنویسید؟ چون پنجرهٔ خونه‌ام شماله!', status: 'pending', createdAt: now - 3600000 * 6 },
      { id: 'demo-cm-3', demo: true, articleId: 'demo-art-1', author: 'رضا ک.', email: 'reza@example.com', text: 'از این مقاله توی فروشگاهم استفاده کردم، تفاوت واقعی داشت.', status: 'approved', createdAt: now - 86400000 * 2, reply: 'خوشحالیم که مفید بود؛ موفق باشید!' },
      { id: 'demo-cm-4', demo: true, articleId: 'demo-art-2', author: 'تبلیغ خودکار', email: 'spam@spam.xyz', text: 'کارت اعتباری فوری با نرخ استثنایی!!! همین حالا کلیک کنید...', status: 'spam', createdAt: now - 86400000 }
    ];

    var liveChats = [
      {
        id: 'demo-lc-1', demo: true, name: 'بازدیدکنندهٔ ناشناس', page: 'صفحهٔ منوی کافه رستا',
        status: 'waiting', createdAt: now - 60000 * 14,
        messages: [
          { from: 'visitor', text: 'سلام! دمنوش زعفران هنوز موجوده؟', ts: now - 60000 * 14 },
          { from: 'visitor', text: 'برای امروز سفارش آنلاین دارید؟', ts: now - 60000 * 12 }
        ]
      },
      {
        id: 'demo-lc-2', demo: true, name: 'مریم ک.', page: 'مقالهٔ عکاسی محصول',
        status: 'closed', createdAt: now - 86400000,
        messages: [
          { from: 'visitor', text: 'سلام، امکان مشاوره برای عکاسی محصولات غذایی رو دارید؟', ts: now - 86400000 },
          { from: 'agent', text: 'سلام وقت بخیر! بله، از طریق صفحهٔ تماس می‌تونید هماهنگ کنید.', ts: now - 86400000 + 120000 }
        ]
      }
    ];

    var teamChat = {
      channels: [
        {
          id: 'demo-ch-1', name: 'عمومی', demo: true,
          messages: [
            { from: 'user-1', name: 'سارا محمدی', text: 'سلام بچه‌ها، برنامهٔ محتوایی این هفته رو توی تقویم آپدیت کردم.', ts: now - 86400000 * 2 },
            { from: 'user-2', name: 'امیر رضایی', text: 'دیدم، عالیه. پیش‌نویس مقالهٔ تقویم محتوایی رو هم شروع کردم.', ts: now - 86400000 * 2 + 600000 },
            { from: 'user-1', name: 'سارا محمدی', text: 'مرسی! جمعه برای عکاسی محصول جدید هماهنگیم؟', ts: now - 86400000 }
          ]
        },
        {
          id: 'demo-ch-2', name: 'تیم-محتوا', demo: true,
          messages: [
            { from: 'user-2', name: 'امیر رضایی', text: 'ریلز دمنوش پاییزی رو با بریف نوا ساختم، پرامپت‌ها آمادهٔ تولیده.', ts: now - 3600000 * 30 }
          ]
        }
      ]
    };

    var calendarPlans = [
      { id: 'demo-cp-1', demo: true, date: daysFromNow(1), type: 'photo', title: 'عکاسی دمنوش پاییزی', notes: 'با نور پنجره، سه‌پایه میزی' },
      { id: 'demo-cp-2', demo: true, date: daysFromNow(3), type: 'video', title: 'انتشار ریلز دمنوش', notes: 'ساعت ۱۸ + دعوت به اقدام فروش' },
      { id: 'demo-cp-3', demo: true, date: daysFromNow(6), type: 'article', title: 'انتشار مقالهٔ عکاسی محصول', notes: 'همراه با خبرنامه' },
      { id: 'demo-cp-4', demo: true, date: daysFromNow(10), type: 'text', title: 'کمپین کپشن هفتگی', notes: '' }
    ];

    return {
      meta: { theme: 'system', showDemo: true, seeded: true, onboarded: false },
      articles: [makeArticle1(), makeArticle2()],
      photoBriefs: [photoBrief],
      videoBriefs: [videoBrief],
      textBriefs: [textBrief],
      brands: [brand],
      companies: companies, teams: teams, domains: domains, users: users,
      calendarPlans: calendarPlans,
      liveChats: liveChats, teamChat: teamChat, comments: comments
    };
  }

  function seedIfEmpty() {
    var meta = Nova.store.read('meta', null);
    if (meta && meta.seeded) return false;
    var data = make();
    Nova.store.KEYS.forEach(function (k) {
      Nova.store.write(k, data[k]);
    });
    return true;
  }

  return { make: make, seedIfEmpty: seedIfEmpty };
})();
