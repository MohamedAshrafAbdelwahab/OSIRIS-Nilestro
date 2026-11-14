/* =========================================================
   Scene 1 — The Archive Screen
   شاشة سوداء CRT + طباعة النص سطراً بسطر + صوت نقرات ميكانيكية

   يعمل في وضعين:
   1) مضمّن داخل index.html (SPA) — الصوت يفتح من نقرة "لعبة جديدة"
   2) قائم بذاته (scene1.html) — ينتظر أول نقرة لتفعيل الصوت
   ========================================================= */

(function () {
  'use strict';

  const SAVE_KEY  = 'osiris_save';
  const LANG_KEY  = 'osiris_language';
  const VOLUM_KEY = 'osiris_volume';

  /* ---------------------------------------------------------
     نصوص المشهد (عربي / إنجليزي)
     --------------------------------------------------------- */
  const SCENE_TEXT = {
    ar: [
      "[سجل الأحداث الفلكية — بعثة مرصد حلوان المشتركة]",
      "الجهة: وكالة الفضاء المصرية (EgSA) 🛰️ بالتعاون مع وكالة ناسا (NASA) 🚀",
      "المهمة: مشروع أوزيريس الفضائي (Project OSIRIS)",
      "الهدف: تتبع ودراسة الأجهزة العلمية والمسبارات المتروكة على القمر والمريخ لتوثيق إرث البشرية.",
      "الطاقم:",
      "  - المهندس: طارق (مسؤول الدفع والملاحة المدارية)",
      "  - الباحث: زين (مسؤول الرصد الجيولوجي والبيولوجي)",
      "الذكاء الاصطناعي للمهمة: النظام الملاحي «سُهيل» (Sohail v4.2)",
      "الموقع الحالي: مدار القمر الانتقالي — الاستعداد لمناورة المقلاع الجاذبي نحو المريخ.",
    ],
    en: [
      "[ASTRONOMICAL EVENT LOG — JOINT HELWAN OBSERVATORY MISSION]",
      "Agency: Egyptian Space Agency (EgSA) \u{1F6F0}\uFE0F in cooperation with NASA \u{1F680}",
      "Mission: Project OSIRIS",
      "Objective: Track and study the scientific instruments and probes left on the Moon and Mars — to document humanity's legacy.",
      "Crew:",
      "  - Engineer: Tariq (Propulsion & Orbital Navigation)",
      "  - Researcher: Zain (Geological & Biological Observation)",
      "Mission AI: Navigation system \"Sohail\" (Sohail v4.2)",
      "Current location: Transitional lunar orbit — preparing for the gravity-slingshot maneuver toward Mars.",
    ],
  };

  const SCENE_UI = {
    ar: {
      audioHint: '🔊 اضغط في أي مكان لتفعيل صوت الطباعة',
      continuePrompt: '[ اتصال مشفّر وارد… اضغط للمتابعة ]',
      sceneTag: 'ARCHIVE',
    },
    en: {
      audioHint: '🔊 Click anywhere to enable typing sound',
      continuePrompt: '[ ENCRYPTED TRANSMISSION INCOMING… CLICK TO CONTINUE ]',
      sceneTag: 'ARCHIVE',
    },
  };

  /* ---------------------------------------------------------
     الصوت — نقرات لوحة مفاتيح ميكانيكية (Web Audio)
     --------------------------------------------------------- */
  const audioState = {
    ctx: null,
    enabled: false,
    lastClickTime: 0,
  };

  /** يُنشئ/يُفعّل سياق الصوت — يعمل فوراً إذا نُودي داخل نقرة مستخدم */
  function tryEnableAudio() {
    if (!audioState.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      audioState.ctx = new Ctx();
    }
    const ctx = audioState.ctx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (ctx.state === 'running') {
      if (!audioState.enabled) {
        audioState.enabled = true;
        hideAudioHint();
      }
      return true;
    }
    return false;
  }

  function currentVolume() {
    return Number(localStorage.getItem(VOLUM_KEY) ?? 70) / 100;
  }

  /** نقرة مفتاح ميكانيكي: ضوضاء قصيرة + فلتر + "طقة" */
  function playKeyClick() {
    if (!audioState.enabled || !audioState.ctx) return;

    // منع تراكم النقرات شديدة التقارب
    const now = performance.now();
    if (now - audioState.lastClickTime < 14) return;
    audioState.lastClickTime = now;

    const ctx = audioState.ctx;
    const volume = currentVolume();
    const t0 = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);

    // 1) ضوضاء قصيرة = "طقطقة" المفتاح
    const noiseLen = 0.05;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseLen), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1400 + Math.random() * 2200; // تنويع لكل مفتاح
    bandpass.Q.value = 1.2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.32 * volume;
    noise.connect(bandpass).connect(noiseGain).connect(master);
    noise.start(t0);

    // 2) "طقة" خشخشة قصيرة
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(240 + Math.random() * 120, t0);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.35 * volume, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
    osc.connect(oscGain).connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.05);
  }

  /** رنين هاتف المهمة — إشارة اتصال وارد في نهاية السجل */
  function playRingtone() {
    if (!audioState.enabled || !audioState.ctx) return;

    const ctx = audioState.ctx;
    const volume = currentVolume();
    const t0 = ctx.currentTime + 0.08;
    const steps = 8; // نغمتان متبادلتان × 4

    for (let i = 0; i < steps; i++) {
      const start = t0 + i * 0.16;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = i % 2 === 0 ? 880 : 660;

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.07 * volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.15);
    }
  }

  /* ---------------------------------------------------------
     عناصر المشهد — تُلتقط عند بدء كل تشغيل
     --------------------------------------------------------- */
  const els = {
    crt:       document.getElementById('crt'),
    terminal:  document.getElementById('terminal'),
    audioHint: document.getElementById('audioHint'),
    sceneTag:  document.getElementById('sceneTag'),
    crtOff:    document.getElementById('crtOff'),
  };

  function hideAudioHint() {
    if (els.audioHint) els.audioHint.classList.add('hidden');
  }

  /* ---------------------------------------------------------
     محرك الكتابة — سطراً بسطر، حرفاً بحرف
     --------------------------------------------------------- */
  const TYPE_SPEED = 34;     // مدة كل حرف (ms)
  const LINE_PAUSE = 480;    // سكون بين الأسطر
  const JITTER = 26;         // تذبذب عشوائي في السرعة

  const typing = {
    skipped: false,
    timers: [],
    finished: false,
  };

  function clearTypers() {
    typing.timers.forEach(clearTimeout);
    typing.timers = [];
  }

  function resetTerminal() {
    if (els.terminal) els.terminal.textContent = '';
  }

  function showEndPrompt() {
    typing.finished = true;
    playRingtone();

    const prompt = document.createElement('div');
    prompt.className = 'end-prompt';
    prompt.textContent = SCENE_UI[Scene1.lang].continuePrompt;
    prompt.style.cssText = 'margin-top:2em;color:#79e085;animation:caret-blink 1.2s steps(2) infinite;';
    els.terminal.appendChild(prompt);
  }

  function showFullText(withSave) {
    resetTerminal();
    els.terminal.textContent = SCENE_TEXT[Scene1.lang].join('\n');
    if (withSave) createSave();
    showEndPrompt();
  }

  function createSave() {
    // نهاية السجل — أبعد مرحلة وصلها اللاعب هي الآن «المشهد الثاني»
    // (زر CONTINUE في القائمة سيقفز للمشهد الثاني مباشرة)
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      stage: 'scene2',
      name: 'archive-complete',
      timestampMs: Date.now(),
    }));
  }

  function typeAll() {
    const lines = SCENE_TEXT[Scene1.lang];
    const dirEn = Scene1.lang === 'en';

    els.terminal.classList.toggle('dir-en', dirEn);
    els.audioHint.classList.toggle('dir-en', dirEn);
    els.audioHint.textContent = SCENE_UI[Scene1.lang].audioHint;
    els.audioHint.classList.toggle('hidden', audioState.enabled);
    if (els.sceneTag) els.sceneTag.textContent = SCENE_UI[Scene1.lang].sceneTag;

    // متابعة → عرض فوري بدون طباعة
    if (Scene1.instant) {
      showFullText(true);
      return;
    }

    resetTerminal();
    typing.finished = false;

    let lineIdx = 0;
    let charIdx = 0;

    const current = document.createElement('span');
    els.terminal.appendChild(current);

    const caret = document.createElement('span');
    caret.className = 'caret';
    els.terminal.appendChild(caret);

    const step = () => {
      if (typing.skipped) return;

      if (lineIdx >= lines.length) {
        caret.remove();
        createSave();
        showEndPrompt();
        return;
      }

      const line = lines[lineIdx];

      if (charIdx < line.length) {
        current.textContent += line[charIdx];

        if (line[charIdx] !== ' ' && line[charIdx] !== '\n') playKeyClick();

        charIdx++;
        const delay = charIdx === line.length ? 0 : TYPE_SPEED + Math.random() * JITTER;
        typing.timers.push(setTimeout(step, delay));
      } else {
        // نهاية سطر — ننزل للسطر التالي
        lineIdx++;
        charIdx = 0;
        current.textContent += '\n';
        typing.timers.push(setTimeout(step, LINE_PAUSE));
      }
    };

    typing.timers.push(setTimeout(step, Scene1.embedded ? 250 : 500));
  }

  /* ---------------------------------------------------------
     التخطي / النهاية
     --------------------------------------------------------- */
  function skipTyping() {
    typing.skipped = true;
    clearTypers();
    showFullText(true); // يعرض كامل النص فوراً
  }

  /** نهاية المشهد — إطفاء CRT */
  function endScene() {
    Scene1.ended = true;

    els.crt.classList.add('off');
    els.crtOff.classList.add('active');

    setTimeout(() => {
      if (Scene1.embedded) {
        if (typeof Scene1.onClose === 'function') Scene1.onClose();
      } else {
        location.href = 'scene2.html'; // الوضع المستقل
      }
    }, 600);
  }

  function isTyping() {
    return !typing.skipped && !typing.finished;
  }

  /* ---------------------------------------------------------
     واجهة التكامل
     --------------------------------------------------------- */
  const Scene1 = {
    lang: null,
    embedded: false,
    instant: false,   // عرض النص كاملاً بدون طباعة
    ended: false,
    running: false,
    onClose: null,

    /** إطلاق المشهد — يُنادى من main.js داخل نقرة المستخدم */
    start({ embedded = false, mode = 'new', onClose = null } = {}) {
      this.embedded = embedded;
      this.onClose = onClose;
      this.instant = mode === 'continue';
      this.running = true;
      this.ended = false;

      this.lang = localStorage.getItem(LANG_KEY) || 'en';
      document.documentElement.lang = this.lang;
      document.documentElement.dir  = this.lang === 'ar' ? 'rtl' : 'ltr';

      // إعادة تهيئة الحالة
      typing.skipped = false;
      typing.finished = false;
      clearTypers();

      if (els.crt)    els.crt.classList.remove('off');
      if (els.crtOff) els.crtOff.classList.remove('active');

      // الوضع المضمّن: الصوت يفتح فوراً من نقرة المستخدم الحالية
      if (embedded) tryEnableAudio();

      typeAll();
    },

    /** إنهاء المشهد وإيقاف كل مؤقتاته */
    stop() {
      this.running = false;
      this.ended = true;
      clearTypers();
    },

    tryEnableAudio,
  };

  // واجهة عامة لـ main.js
  window.Scene1 = Scene1;

  /* ---------------------------------------------------------
     مدخلات المستخدم
     (handler واحد دائم — يعمل فقط أثناء تشغيل المشهد)
     --------------------------------------------------------- */
  function handleSceneInput(e) {
    if (!Scene1.running || Scene1.ended) return;
    if (e && e.repeat) return;

    const wasEnabled = audioState.enabled;
    tryEnableAudio();

    // الوضع المستقل فقط: أول نقرة مخصصة لتفعيل الصوت
    if (!Scene1.embedded && !wasEnabled) return;

    if (isTyping()) skipTyping();
    else            endScene();
  }

  window.addEventListener('pointerdown', handleSceneInput);
  window.addEventListener('keydown', handleSceneInput);

  /* ---------------------------------------------------------
     الوضع المستقل (scene1.html) — ينطلق تلقائياً
     --------------------------------------------------------- */
  if (document.body.dataset.page === 'scene-standalone') {
    const ov = document.getElementById('transitionOverlay');
    if (ov) ov.classList.add('fade-out');
    Scene1.start({ embedded: false });
  }
})();
