/* =========================================================
   i18n — الترجمات (English / العربية)
   ========================================================= */

const I18N = {
  en: {
    gameTitle: 'OSIRIS',
    projectLabel: 'PROJECT',
    gameTagline: 'ABANDONED BUT NOT FORGOTTEN',
    teamCredit: 'By Team NileStro — NASA Space Apps 2026',
    pageTitle: 'OSIRIS — Abandoned But Not Forgotten',

    newGame:  'NEW GAME',
    continue: 'CONTINUE',
    settings: 'SETTINGS',

    manualBtn: 'NASA MANUAL & RESOURCES',

    settingsTitle: 'SETTINGS',
    volume:   'VOLUME',
    language: 'LANGUAGE',
    close:    'CLOSE',

    fullscreen:      'FULLSCREEN',
    exitFullscreen:  'EXIT FULLSCREEN',

    files:    'FILES',
    comicBtn: '3D COMIC BOOK',
    archiveBtn: 'THE SILENT ARCHIVE (PDF)',

    preloading:  'LOADING GAME ASSETS…',
    preloadDone: 'LOADING COMPLETE — READY TO PLAY',
    langSwitchLabel: 'العربية',   // ما يظهر على الزر = اللغة الأخرى
    langSwitchShort: 'عربي',      // النسخة المختصرة لزر الأيقونة العلوي
  },

  ar: {
    gameTitle: 'أوزيريس',
    projectLabel: 'مشروع',
    gameTagline: 'مهجور لكن غير منسي',
    teamCredit: 'بواسطة فريق NileStro — NASA Space Apps 2026',
    pageTitle: 'أوزيريس — مهجور لكن غير منسي',

    newGame:  'لعبة جديدة',
    continue: 'متابعة',
    settings: 'الإعدادات',

    manualBtn: 'دليل ناسا والمصادر',

    settingsTitle: 'الإعدادات',
    volume:   'مستوى الصوت',
    language: 'اللغة',
    close:    'إغلاق',

    fullscreen:      'ملء الشاشة',
    exitFullscreen:  'إنهاء ملء الشاشة',

    files:    'الملفات',
    comicBtn: 'الكوميك ثلاثي الأبعاد',
    archiveBtn: 'الأرشيف الصامت (PDF)',

    preloading:  'جارٍ تحميل أصول اللعبة…',
    preloadDone: 'اكتمل التحميل — اللعبة جاهزة',
    langSwitchLabel: 'English',
    langSwitchShort: 'EN',
  },
};

/**
 * تُرجع نصاً مترجمّاً حسب اللغة المطلوبة (أو اللغة الحالية للعبة).
 * @param {string} key
 * @param {'ar'|'en'} [lang]
 */
function t(key, lang) {
  const resolved = lang || (window.State && window.State.language) || 'en';
  const dict = I18N[resolved] || I18N.en;
  return dict[key] ?? I18N.en[key] ?? key;
}
