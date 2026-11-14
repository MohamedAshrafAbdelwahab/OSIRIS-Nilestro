/* =========================================================

 main.js — منطق صفحة البداية + تسلسل المشاهد (index.html)

 — الإنجليزية اللغة الافتراضية + ملء الشاشة

 (بجانب زر الإعدادات وداخل تبويب الإعدادات نفسه)



 NEW GAME → مسح الحفظ → المشهد 1 (سجل الأحداث) → المشهد 2

 CONTINUE → حسب مرحلة الحفظ:

 stage 'scene2' → المشهد 2 مباشرة (تخطي شاشة السجل)

 stage 'moon' → المشهد 2 داخل سطح القمر (الفصل الأول)

 stage 'mars' → المشهد 2 داخل المريخ (الفصل الثاني)

 stage 'complete'→ المشهد 2 داخل المريخ (إعادة الفصل الثاني)

 غير ذلك → المشهد 1 عرضاً فورياً

 ========================================================= */



(function () {

  'use strict';



  /* ---------------------------------------------------------

     الحالة العامة

     --------------------------------------------------------- */

  const State = {

    language: null,   // 'en' | 'ar'

    volume:   70,     // 0 - 100

  };

  // متاح لدالة الترجمة t()

  window.State = State;



  const SAVE_KEY  = 'osiris_save';

  const LANG_KEY  = 'osiris_language';

  const VOLUM_KEY = 'osiris_volume';



  /* ---------------------------------------------------------

     عناصر الصفحة

     --------------------------------------------------------- */

  const els = {

    html:        document.documentElement,

    video:       document.getElementById('bgVideo'),

    gameTitle:   document.getElementById('gameTitle'),

    projectLabel:  document.getElementById('projectLabel'),

    gameTagline:   document.getElementById('gameTagline'),

    teamCredit:  document.getElementById('teamCredit'),

    btnNewGame:  document.getElementById('btnNewGame'),

    btnContinue: document.getElementById('btnContinue'),

    btnSettings: document.getElementById('btnSettings'),

    btnManual:   document.getElementById('btnManual'),

    btnLang:     document.getElementById('btnLangSwitch'),

    transition:  document.getElementById('transitionOverlay'),



 // شريط تحميل الأصول 

    preloadHud:   document.getElementById('preloadHud'),

    preloadLabel: document.getElementById('preloadLabel'),

    preloadFill:  document.getElementById('preloadFill'),



    // نافذة الإعدادات

    settingsModal: document.getElementById('settingsModal'),

    volumeSlider:  document.getElementById('volumeSlider'),

    volumeValue:   document.getElementById('volumeValue'),

    btnLangModal:  document.getElementById('btnLangSettings'),

    btnClose:      document.getElementById('btnCloseSettings'),

    btnComic:      document.getElementById('btnComic'),

    btnArchive:    document.getElementById('btnArchive'),



 // ملء الشاشة — بجانب زر الإعدادات وداخل الإعدادات

    btnFsMenu:     document.getElementById('btnFullscreen'),

    btnFsSettings: document.getElementById('btnFullscreenSettings'),



    // المشاهد

    sceneHost:  document.getElementById('sceneHost'),

    sceneHost2: document.getElementById('sceneHost2'),

    crt:        document.getElementById('crt'),

    crtOff:     document.getElementById('crtOff'),



    // النصوص المترجمة

    i18nItems: document.querySelectorAll('[data-i18n]'),

  };



  /* ---------------------------------------------------------

     الحفظ — ملف واحد يحمل «أبعد مرحلة وصلها اللاعب»

     الشكل: { stage: 'scene2' | 'moon' | 'mars' | 'complete', ... }

     --------------------------------------------------------- */

  function readSave() {

    try {

      const raw = localStorage.getItem(SAVE_KEY);

      return raw ? JSON.parse(raw) : null;

    } catch (_) {

      return null;

    }

  }



  function hasSave() {

    return readSave() !== null;

  }



  function initState() {

 // الإنجليزية هي اللغة الافتراضية للعبة (يمكن التبديل من زر اللغة)

    State.language = localStorage.getItem(LANG_KEY) || 'en';



    const savedVol = localStorage.getItem(VOLUM_KEY);

    State.volume = savedVol === null ? 70 : Number(savedVol);



    // زر المتابعة مفعّل فقط عند وجود حفظ

    if (els.btnContinue) els.btnContinue.disabled = !hasSave();

  }



  /* ---------------------------------------------------------

     تطبيق اللغة على واجهة الصفحة

     --------------------------------------------------------- */

  function applyLanguage() {

    const isAr = State.language === 'ar';



    els.html.lang = State.language;

    els.html.dir  = isAr ? 'rtl' : 'ltr';



    els.gameTitle.textContent  = t('gameTitle', State.language);

    els.projectLabel.textContent = t('projectLabel', State.language);

    els.gameTagline.textContent  = t('gameTagline', State.language);

    els.teamCredit.textContent = t('teamCredit', State.language);

    document.title             = t('pageTitle', State.language);



    els.i18nItems.forEach(el => {

      el.textContent = t(el.dataset.i18n, State.language);

    });



 // أزرار ملء الشاشة تتبع اللغة الحالية وحالة ملء الشاشة الفعلية 

    syncFullscreenUI();



    // تسميات أزرار اللغة (تعرض اسم اللغة الأخرى)

    const altLabel = t('langSwitchLabel', State.language);

    const altShort = t('langSwitchShort', State.language);

    els.btnLang.textContent      = altShort;   // أيقونة الشريط العلوي — مختصرة

    els.btnLang.title            = altLabel;

    els.btnLang.setAttribute('aria-label', altLabel);

    els.btnLangModal.textContent = altLabel;   // داخل الإعدادات — كاملة



    localStorage.setItem(LANG_KEY, State.language);

  }



  function toggleLanguage() {

    State.language = State.language === 'en' ? 'ar' : 'en';

    applyLanguage();

    // الدليل مفتوح؟ يُعاد بناؤه بلغة العرض الجديدة

    if (window.Manual && window.Manual.isOpen()) window.Manual.setLang(State.language);

  }



  /* ---------------------------------------------------------

     الإعدادات

     --------------------------------------------------------- */

  function openSettings()  { els.settingsModal.classList.remove('hidden'); syncSettingsUI(); }

  function closeSettings() { els.settingsModal.classList.add('hidden'); }



  function syncSettingsUI() {

    els.volumeSlider.value = State.volume;

    els.volumeValue.textContent = State.volume;

  }



  function onVolumeChange() {

    State.volume = Number(els.volumeSlider.value);

    els.volumeValue.textContent = State.volume;

    applyVolume();

    localStorage.setItem(VOLUM_KEY, State.volume);

  }



  /**

   * تطبيق مستوى الصوت.

   * فيديو الخلفية يبقى مكتوماً دائماً حتى يعمل AutoPlay

   * بدون مشاكل سياسة المتصفح.

   */

  function applyVolume() {

    if (els.video) {

      els.video.muted = true;

      els.video.volume = 1;

    }

    window.GameVolume = State.volume / 100;

  }



  /* ملء الشاشة — من زر القائمة ومن تبويب الإعدادات

 --------------------------------------------------------- */

  function isFullscreenActive() {

    return !!(document.fullscreenElement || document.webkitFullscreenElement);

  }



  async function toggleFullscreen() {

    const root = document.documentElement;

    try {

      if (isFullscreenActive()) {

        if (document.exitFullscreen) await document.exitFullscreen();

        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();

      } else {

        if (root.requestFullscreen) await root.requestFullscreen();

        else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();

        else return; // المتصفح لا يدعم ملء الشاشة



        // على الجوال: نحاول تثبيت الاتجاه الأفقي داخل ملء الشاشة

        // (مدعوم في أندرويد كروم — يتجاهل بأمان في باقي المتصفحات)

        if (screen.orientation && screen.orientation.lock) {

          try { await screen.orientation.lock('landscape'); } catch (_) {}

        }

      }

    } catch (_) { /* سياسة المتصفح (iframe بلا إذن fullscreen مثلاً) — نتجاهل بهدوء */ }

    syncFullscreenUI();

  }



  /** تحديث زرّي ملء الشاشة حسب الحالة الحالية
   *
   *  زر الشريط العلوي أيقونة SVG — نحدّث تلميحه فقط (لا نصاً)
   *  وزر الإعدادات نصي كالسابق */

  function syncFullscreenUI() {

    const key = isFullscreenActive() ? 'exitFullscreen' : 'fullscreen';

    const label = t(key, State.language);

    if (els.btnFsMenu) {

      els.btnFsMenu.title = label;

      els.btnFsMenu.setAttribute('aria-label', label);

    }

    if (els.btnFsSettings) els.btnFsSettings.textContent = label;

  }



  /* ---------------------------------------------------------

     الانتقالات (الشاشة السوداء)

     --------------------------------------------------------- */

  /** تعتيم فوري بدون أنيميشن (نقطة انطلاق أي انتقال) */

  function blackoutInstant() {

    const ov = els.transition;

    if (!ov) return;

    ov.style.transition = 'none';

    ov.classList.remove('fade-out');

    void ov.offsetWidth;      // إجبار المتصفح على تطبيق القيمة

    ov.style.transition = ''; // إعادة مدة الانتقال الأصلية

  }



  /** كشف المشهد تدريجياً من الأسود */

  function reveal() {

    if (els.transition) els.transition.classList.add('fade-out');

  }



  /* ---------------------------------------------------------

     المشهد 1 — سجل الأحداث

     --------------------------------------------------------- */

  function launchScene1(mode) {

    if (!window.Scene1) {

      console.error('Scene1 is not loaded.');

      return;

    }

    if (window.Scene1.running) return; // منع إعادة الإطلاق بالكيبورد



    // المتابعة بدون ملف حفظ → ابدأ لعبة جديدة

    if (mode === 'continue' && !hasSave()) mode = 'new';



 // لعبة جديدة = بداية نظيفة تماماً — مسح أي حفظ قديم (وبقايا الكتيب المحذوف )

    if (mode === 'new') {

      try { localStorage.removeItem(SAVE_KEY); } catch (_) {}

      try { localStorage.removeItem('osiris_codex'); } catch (_) {}

    }



    blackoutInstant();



    // تصفير مؤثرات إطفاء CRT من الجولة السابقة

    if (els.crt)    els.crt.classList.remove('off');

    if (els.crtOff) els.crtOff.classList.remove('active');



    els.sceneHost.classList.remove('hidden-scene');



    // نُنادي start داخل نقرة المستخدم نفسها ليُفتح سياق الصوت

    window.Scene1.start({

      embedded: true,

      mode,                 // 'new' | 'continue'

      onClose: closeScene1,

    });



    if (document.activeElement && document.activeElement.blur) {

      document.activeElement.blur();

    }



    reveal();

  }



  function closeScene1() {

    if (window.Scene1) window.Scene1.stop();



    blackoutInstant();



    setTimeout(() => {

      if (els.sceneHost) els.sceneHost.classList.add('hidden-scene');

      launchScene2();

    }, 120);

  }



  /* ---------------------------------------------------------

     المشهد 2 — مرحلة المشي

     opts.jumpTo = 'moon' → الدخول مباشرة على سطح القمر (متابعة)

     --------------------------------------------------------- */

  function launchScene2(opts = {}) {

    if (!window.Scene2) {

      console.error('Scene2 is not loaded.');

      // لا نترك اللاعب في شاشة سوداء

      if (els.sceneHost2) els.sceneHost2.classList.add('hidden-scene');

      reveal();

      return;

    }



    blackoutInstant();

    els.sceneHost2.classList.remove('hidden-scene');

    window.Scene2.start({

      embedded: true,

      onClose: closeScene2,

      jumpTo: opts.jumpTo || null,

    });



    reveal();

  }



  function closeScene2() {

    blackoutInstant();



    setTimeout(() => {

      if (els.sceneHost2) els.sceneHost2.classList.add('hidden-scene');

      if (window.Scene2) window.Scene2.stop();



      // العودة للقائمة مع تحديث حالة الحفظ

      initState();

      syncSettingsUI();



      reveal();

    }, 120);

  }



  /* ---------------------------------------------------------

     زر المتابعة — يقفز لأبعد مرحلة وصلها اللاعب

     --------------------------------------------------------- */

  function onContinue() {

    if (els.btnContinue.disabled) return;



    const save  = readSave();

    const stage = save && save.stage;



    if (stage === 'scene2') {

      // انتهى السجل → يكمل المشهد الثاني من بدايته مباشرة

      launchScene2();

    } else if (stage === 'moon') {

      // وصل سطح القمر → يكمل الفصل الأول (توسعة الإصلاح متاحة)

      launchScene2({ jumpTo: 'moon' });

    } else if (stage === 'mars' || stage === 'complete') {

 // وصل المريخ (أو أنهى اللعبة) → يكمل الفصل الثاني مباشرة 

      launchScene2({ jumpTo: 'mars' });

    } else {

      // حفظ قديم من إصدارات سابقة → عرض السجل فورياً ثم المشهد الثاني

      launchScene1('continue');

    }

  }



  /* الملفات المصاحبة — تُفتح من تبويب الإعدادات

 الكوميك ثلاثي الأبعاد (يفتح حسب لغة اللعبة الحالية)

 + الملف العلمي التفصيلي «الأرشيف الصامت» (PDF)

 --------------------------------------------------------- */

  const DOC_FILES = {

    comicEn: 'assets/docs/comic-en.html',

    comicAr: 'assets/docs/comic-ar.html',

    archive: 'assets/docs/the-silent-archive.pdf',

  };



  /** يفتح الكوميك بالنسخة المطابقة للغة اللعبة الحالية */
  function openComic() {

    const lang = (State.language === 'ar') ? 'ar' : 'en';

    const url = lang === 'ar' ? DOC_FILES.comicAr : DOC_FILES.comicEn;

    window.open(url, '_blank', 'noopener');

  }



  function openArchive() {

    window.open(DOC_FILES.archive, '_blank', 'noopener');

  }



  /* ---------------------------------------------------------

     ربط الأحداث

     --------------------------------------------------------- */

  function bindEvents() {

    els.btnLang.addEventListener('click', toggleLanguage);

    els.btnLangModal.addEventListener('click', toggleLanguage);



    els.btnSettings.addEventListener('click', openSettings);

    els.btnClose.addEventListener('click', closeSettings);



    // دليل المهمة ومصادر ناسا — من القائمة الرئيسية مباشرة

    if (els.btnManual) els.btnManual.addEventListener('click', () => {

      if (window.Manual) window.Manual.open({ lang: State.language });

    });



 // زرا الملفات المصاحبة — الكوميك حسب اللغة + الأرشيف الصامت

    if (els.btnComic) els.btnComic.addEventListener('click', openComic);

    if (els.btnArchive) els.btnArchive.addEventListener('click', openArchive);



    // النقر على الخلفية خارج النافذة يغلقها

    els.settingsModal.addEventListener('click', (e) => {

      if (e.target === els.settingsModal) closeSettings();

    });



    // زر Escape يغلق الإعدادات (لا شيء فوق الدليل)

    document.addEventListener('keydown', (e) => {

      if (e.key === 'Escape') {

        if (window.Manual && window.Manual.isOpen()) return; // الدليل يغلق نفسه

        closeSettings();

      }

    });



    els.volumeSlider.addEventListener('input', onVolumeChange);



 // ملء الشاشة — الزران ينفذان نفس الأمر ويتبادلان نصهما مع الحالة

    if (els.btnFsMenu)     els.btnFsMenu.addEventListener('click', toggleFullscreen);

    if (els.btnFsSettings) els.btnFsSettings.addEventListener('click', toggleFullscreen);

    document.addEventListener('fullscreenchange', syncFullscreenUI);

    document.addEventListener('webkitfullscreenchange', syncFullscreenUI);



    els.btnNewGame.addEventListener('click', () => launchScene1('new'));



    els.btnContinue.addEventListener('click', onContinue);

  }



  /* ---------------------------------------------------------

     خلفية الفيديو — تشغيل إجباري مع خطة احتياطية

     --------------------------------------------------------- */

  function forceVideoPlay() {

    const video = els.video;

    if (!video) return;



    try { video.load(); } catch (_) {}



    const attemptPlay = () => {

      const p = video.play();

      if (p && typeof p.catch === 'function') {

        p.catch(() => { /* سنحاول عند أول تفاعل */ });

      }

    };



    attemptPlay();

    setTimeout(attemptPlay, 400);



    // المحاولة النهائية: عند أول نقرة أو ضغطة زرار

    const oncePlay = () => {

      attemptPlay();

      window.removeEventListener('pointerdown', oncePlay);

      window.removeEventListener('keydown', oncePlay);

    };

    window.addEventListener('pointerdown', oncePlay);

    window.addEventListener('keydown', oncePlay);

  }



  /* — تحميل مسبق كامل للأصول قبل السماح باللعب

 - شريط تقدم فوق خلفية القائمة الحية (الخلفية لا تختفي)

 - قفل كامل: زرا اللعب معطلان حتى اكتمال كل الملفات 100%

 - عند الاكتمال: يختفي الشريط بسلاسة وتُفتح الأزرار

 --------------------------------------------------------- */

  function enablePlayButtons() {

    if (els.btnNewGame)  els.btnNewGame.disabled = false;

    if (els.btnContinue) els.btnContinue.disabled = !hasSave(); // نفس قاعدة القائمة الأصلية

  }



  function startAssetPreload() {

    // فشل تحميل preload.js؟ نفتح الأزرار فوراً ونعمل بالطريقة القديمة

    if (!window.OSIRIS_PRELOADER) { enablePlayButtons(); return; }



    if (els.btnNewGame)  els.btnNewGame.disabled = true;

    if (els.btnContinue) els.btnContinue.disabled = true;



    let lastPct = -1;

    const setProgress = (p) => {

      const pct = Math.max(0, Math.min(100, Math.round(p * 100)));

      if (pct === lastPct) return;

      lastPct = pct;

      if (els.preloadFill) els.preloadFill.style.width = pct + '%';

      if (els.preloadLabel) {

        els.preloadLabel.textContent = t('preloading') + ' ' + pct + '%';

      }

    };



    OSIRIS_PRELOADER.start(setProgress, () => {

      setProgress(1);

      if (els.preloadLabel) els.preloadLabel.textContent = t('preloadDone');

      if (els.preloadHud) {

        els.preloadHud.classList.add('done');

        setTimeout(() => { if (els.preloadHud && els.preloadHud.parentNode) els.preloadHud.remove(); }, 900);

      }

      enablePlayButtons();

    });

  }



  /* ---------------------------------------------------------

     البداية

     --------------------------------------------------------- */

  function init() {

    initState();

    applyLanguage();

    syncSettingsUI();

    syncFullscreenUI();

    applyVolume();

    bindEvents();



    forceVideoPlay();

    startAssetPreload();



    // فايد خروج من الشاشة السوداء للكشف عن قائمة البداية

    reveal();

  }



  document.addEventListener('DOMContentLoaded', init);

})();
