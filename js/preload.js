/* =========================================================
 preload.js — تحميل مسبق كامل لأصول اللعبة 
 ---------------------------------------------------------
 يبدأ فور فتح القائمة الرئيسية ويحمّل كل أصول اللعبة
 (كل الصور + كل الفيديوهات) قبل السماح ببدء اللعب،
 وتبقى خلفية القائمة حية ومرئية طوال التحميل —
 لا شاشات سوداء ولا خلفيات مفقودة أثناء المشي بعد ذلك.

 - كل ملف يُجلب عبر fetch ويُخزَّن كـ Blob مع objectURL،
 فتشغيل أي خلفية أو لقطة سينمائية داخل اللعبة فوري.
 - imageSrc/videoSrc تعيدان رابط Blob إن وُجد وإلا
 المسار الأصلي — آمنة في كل الأحوال وكل الصفحات.
 - أي أصل يفشل تحميله المسبق يُتجاهل بأمان: تعمل اللعبة
 معه بالطريقة القديمة تلقائياً (تحميل عند الحاجة).
 - خلفية القائمة نفسها (menu-background.mp4) تُشغَّل عبر
 وسم الفيديو المباشر ولا تحتاج تحميلاً مسبقاً هنا.
 ========================================================= */

(function () {
  'use strict';

  const state = {
    started: false,
    done: false,
    total: 0,          // عدد الملفات الكلي
    loaded: 0,         // الملفات المكتملة
    bytes: 0,          // البايتات المنزّلة فعلياً
    totalBytes: 0,     // مجموع الأحجام المعلنة (Content-Length)
    imageURLs: new Map(),  // مسار الصورة → objectURL
    videoURLs: new Map(),  // مسار الفيديو → objectURL
  };

  /** جمع كل مسارات الأصول من خريطة assets.js — الفيديوهات أولاً (الأثقل) */
  function collect() {
    const urls = [];
    const add = (obj) => { if (obj) Object.values(obj).forEach((v) => urls.push(v)); };

    /* فيديوهات: خلفيات الغرف المتضررة ثم اللقطات السينمائية */
    add(ASSETS.roomVideos);
    add(ASSETS.cutscenes);

    /* صور: خلفيات الغرف (الفصلان الأول والثاني معاً) */
    add(ASSETS.rooms);
    /* أوراق الشخصيات + الكائنات المرسومة فوق الخلفيات */
    add(ASSETS.sprites);
    add(ASSETS.overlays);

    return urls;
  }

  /** جلب ملف واحد كـ Blob مع تتبع بايتات التقدم — يعيد true عند التوفر */
  async function fetchBlob(src, isVideo) {
    try {
      const resp = await fetch(src, { cache: 'force-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);

      const len = Number(resp.headers.get('Content-Length') || 0);
      if (len > 0) state.totalBytes += len;

      // قراءة متدفقة — تقدّم حقيقي بالبايت أثناء التنزيل
      const reader = (resp.body && typeof resp.body.getReader === 'function')
        ? resp.body.getReader() : null;
      let blob;
      if (reader) {
        const chunks = [];
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          state.bytes += value.length;
        }
        blob = new Blob(chunks, {
          type: resp.headers.get('Content-Type') || (isVideo ? 'video/mp4' : 'image/jpeg'),
        });
      } else {
        blob = await resp.blob();
        state.bytes += blob.size;
      }

      const url = URL.createObjectURL(blob);
      (isVideo ? state.videoURLs : state.imageURLs).set(src, url);
      return true;
    } catch (_) {
      // فشل التحميل المسبق — المسار الأصلي سيتولى الأمر عند الحاجة كالسابق
      return false;
    }
  }

  /** نسبة التقدم 0..1 — بالبايت إن عُرفت الأحجام وإلا بعدد الملفات */
  function progressRatio() {
    if (state.totalBytes > 0) {
      return Math.min(0.99, state.bytes / state.totalBytes);
    }
    return state.total ? Math.min(0.99, state.loaded / state.total) : 0;
  }

  /**
   * بدء التحميل المسبق — تنزيل متوازٍ (4 ملفات معاً).
   * @param {function(number):void} [onProgress]  تُنادى عند كل تغيّر ملموس
   * @param {function():void}       [onDone]      تُنادى مرة واحدة عند الاكتمال
   */
  function start(onProgress, onDone) {
    if (state.started) return;
    state.started = true;

    const urls = collect();
    state.total = urls.length;
    const videoSet = new Set(Object.values(ASSETS.roomVideos)
      .concat(Object.values(ASSETS.cutscenes)));

    const tick = () => {
      state.loaded++;
      if (onProgress) onProgress(state.done ? 1 : progressRatio());
      if (state.loaded >= state.total && !state.done) {
        state.done = true;
        if (onProgress) onProgress(1);
        if (onDone) onDone();
      }
    };

    let idx = 0;
    const CONCURRENCY = 4;
    const worker = async () => {
      for (;;) {
        const i = idx++;
        if (i >= urls.length) return;
        await fetchBlob(urls[i], videoSet.has(urls[i]));
        tick();
      }
    };
    for (let k = 0; k < Math.min(CONCURRENCY, urls.length); k++) worker();
  }

  /** رابط صورة جاهز (Blob) أو المسار الأصلي */
  function imageSrc(path) {
    return state.imageURLs.get(path) || path;
  }

  /** رابط فيديو جاهز (Blob) أو المسار الأصلي */
  function videoSrc(path) {
    return state.videoURLs.get(path) || path;
  }

  window.OSIRIS_PRELOADER = {
    start,
    imageSrc,
    videoSrc,
    get done()     { return state.done; },
    get progress() { return state.done ? 1 : progressRatio(); },
    get ready()    { return state.started; },
  };
})();
