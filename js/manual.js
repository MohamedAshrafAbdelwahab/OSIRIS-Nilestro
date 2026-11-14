/* =========================================================
   manual.js — NASA Mission Manual & Resources (OSIRIS)
   ---------------------------------------------------------
   نافذة «دليل المهمة ومصادر ناسا» — تعمل من القائمة الرئيسية
   ومن داخل اللعب (زر الكتاب بجوار الترس أو مفتاح M).

   - إقرار واضح في الأعلى: القصة خيالية، لكن كل معدات اللعبة
     حقيقية وكل معلومة من مصادر ناسا الرسمية المرتبطة أدناه.
   - ملف كل آلة: شرح علمي (وظيفة + تاريخ + وضعها اليوم)
     + اسم المصدر الرسمي + رابط مباشر قابل للنقر.
   - جدول المصادر: كل روابط صفحة موارد التحدي الرسمية.
   - الملفات المصاحبة: الكوميك ثلاثي الأبعاد (حسب اللغة) + الأرشيف الصامت (PDF).

   - كل الروابط الخارجية: target="_blank" rel="noopener noreferrer"
   - ثنائية اللغة كاملة (en/ar) مع دعم RTL
   ========================================================= */

(function () {
  'use strict';

  /* ---------------------------------------------------------
     روابط مصادر ناسا الرسمية — من صفحة موارد التحدي
     (NASA Space Apps 2026 — Discarded Equipment Storytelling)
     --------------------------------------------------------- */
  const NASA_LINKS = {
    nssdca:      'https://nssdc.gsfc.nasa.gov/',
    eagle:       'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C',
    lrv:         'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
    alsep:       'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C',
    surveyor:    'https://science.nasa.gov/mission/surveyor-3/',
    pathfinder:  'https://science.nasa.gov/mission/mars-pathfinder/',
    mer:         'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
    viking:      'https://science.nasa.gov/mission/viking-1/',
    insight:     'https://science.nasa.gov/mission/insight/',
    dawn:        'https://science.nasa.gov/mission/dawn/',
    near:        'https://science.nasa.gov/mission/near-shoemaker/',
    pioneer:     'https://science.nasa.gov/mission/pioneer-10/',
    ingenuity:   'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/',
    kepler:      'https://science.nasa.gov/mission/kepler/',
  };

  /* ---------------------------------------------------------
     إقرار الخيال العلمي — يظهر دائماً أعلى الدليل
     --------------------------------------------------------- */
  const DISCLAIMER = {
    ar: 'قصة خيالية عن آلات حقيقية: مغامرة طارق وزين من تأليف فريق NileStro، لكن كل جهاز تقابله في اللعبة هو معدات ناسا حقيقية تُركت على القمر والمريخ — وكل معلومة في هذا الدليل مصدرها الصفحات الرسمية لناسا المرتبطة أدناه.',
    en: 'A fictional story about real machines: Tariq and Zain\u2019s adventure is our own narrative, but every piece of equipment you meet in OSIRIS is genuine NASA hardware left behind on the Moon and Mars \u2014 and every fact in this manual comes from the official NASA sources linked below.',
  };

  /* ---------------------------------------------------------
     ملفات الآلات — كل معدات ناسا الظاهرة في اللعبة
     (شرح علمي + موقعها في اللعبة + المصدر الرسمي + الرابط)
     --------------------------------------------------------- */
  const MANUAL_ENTRIES = [
    {
      id: 'eagle',
      img: 'eagle',
      where: { ar: 'الفصل الأول — موقع الهبوط (بحر الهدوء)', en: 'Chapter 1 \u2014 the landing site (Sea of Tranquility)' },
      title: { ar: '«النسر» — جزء الهبوط لمركبة أبولو 11', en: 'Eagle \u2014 Apollo 11\u2019s Descent Stage' },
      body: {
        ar: 'حين أقلع أرمسترونغ وألدرين من بحر الهدوء في 21 يوليو 1969 تركوا خلفهم الجزء السفلي لمركبة «النسر» — فقد كان منصة الإطلاق نفسها. ما زال واقفاً في مكانه حتى اليوم: أول منشأة بشرية دائمة على جرم آخر، وبجانبه أكثر من 500 قطعة من معدات أبولو على السطح القمري.',
        en: 'When Armstrong and Aldrin lifted off from Tranquility Base on July 21, 1969, they left the Eagle\u2019s descent stage behind \u2014 it was their launch pad. It still stands there today: humanity\u2019s first permanent structure on another world, surrounded by more than 500 Apollo artifacts left on the lunar surface.',
      },
      srcName: { ar: 'أرشيف ناسا NSSDCA — مركبة أبولو 11 «النسر»', en: 'NASA NSSDCA \u2014 Apollo 11 Lunar Module / Eagle' },
      srcUrl: NASA_LINKS.eagle,
    },
    {
      id: 'tranquility',
      img: 'bootprint',
      where: { ar: 'الفصل الأول — المشهد الثاني (الآثار والعلم)', en: 'Chapter 1 \u2014 scene 2 (bootprints & flag)' },
      title: { ar: 'بحر الهدوء — البصمات والعلم واللوحة', en: 'Tranquility Base \u2014 Bootprints, Flag & Plaque' },
      body: {
        ar: 'لا رياح ولا أمطار على القمر، لذا ستبقى بصمات أحذية أبولو 11 والعلم واللوحة التذكارية محفورة بلا مساس ملايين السنين. أشعة الشمس فوق البنفسجية القاسية بيّضت العلم الأمريكي عبر نصف قرن إلى راية بيضاء — واللعبة تعرضه تماماً كما سيبدو اليوم.',
        en: 'With no wind or rain on the Moon, Apollo 11\u2019s bootprints, the flag and the commemorative plaque will stay untouched for millions of years. Half a century of harsh ultraviolet light has already bleached the flag into a white banner \u2014 the game shows it exactly as it would look today.',
      },
      srcName: { ar: 'أرشيف ناسا NSSDCA — سجل أبولو 11', en: 'NASA NSSDCA \u2014 Apollo 11 record' },
      srcUrl: NASA_LINKS.eagle,
    },
    {
      id: 'psep',
      img: 'psep',
      where: { ar: 'الفصل الأول — المشهد الثالث (محطة الزلازل)', en: 'Chapter 1 \u2014 scene 3 (the seismometer)' },
      title: { ar: 'PSEP — أول مقياس زلازل على جرم آخر', en: 'PSEP \u2014 the First Seismometer on Another World' },
      body: {
        ar: 'حزمة التجارب السيزمية السلبية لأبولو 11 (1969) كانت أول جهاز زلزالي يوضع على جرم غير الأرض، وكشفت أن القمر «يرن» كالجرس بعد الاصطدامات. شبكة ALSEP التي أطلقتها سجلت آلاف الهزات القمرية حتى أطفأتها ناسا عام 1977 — تُركت الحزم عمداً لتواصل العلم بعد مغادرة الرواد.',
        en: 'Apollo 11\u2019s Passive Seismic Experiment Package (1969) was the first seismometer ever placed on another world \u2014 it revealed that the Moon \u201crings\u201d like a bell after impacts. The ALSEP network it began recorded thousands of moonquakes until NASA powered it down in 1977. The packages were deliberately left behind to keep doing science after the astronauts departed.',
      },
      srcName: { ar: 'أرشيف ناسا NSSDCA — حزم ALSEP العلمية', en: 'NASA NSSDCA \u2014 ALSEP science packages' },
      srcUrl: NASA_LINKS.alsep,
    },
    {
      id: 'rhu',
      img: 'rhu',
      where: { ar: 'الفصل الأول — لغز إذابة الصقيع', en: 'Chapter 1 \u2014 the defrost puzzle' },
      title: { ar: 'RHU — الدفء النووي في الليل القمري', en: 'RHU \u2014 Nuclear Warmth in the Lunar Night' },
      body: {
        ar: 'كريات صغيرة من البلوتونيوم-238 تطلق حرارة ثابتة بمجرد تعفّرها إشعاعياً — بلا لهب ولا أجزاء متحركة. منحت وحدات التدفئة النووية في أبولو نحو 15 واطاً من الدفء لكل وحدة، فأبقت التجارب حية في ليالٍ تبلغ -170°م. نفس التقنية ما زالت تبقي مسبارات ناسا في أعماق الفضاء حية حتى اليوم.',
        en: 'Small pellets of plutonium-238 that release steady heat simply by radioactive decay \u2014 no flame, no moving parts. Apollo\u2019s Radioisotope Heater Units provided about 15 watts of warmth each, keeping experiments alive through \u2013170\u00b0C lunar nights. The same technology still keeps NASA\u2019s deep-space probes alive today.',
      },
      srcName: { ar: 'أرشيف ناسا NSSDCA — الفهرس الرئيسي', en: 'NASA NSSDCA \u2014 master catalog' },
      srcUrl: NASA_LINKS.nssdca,
    },
    {
      id: 'lrrr',
      img: 'lrrr',
      where: { ar: 'الفصل الأول — المشهد الرابع (لغز الليزر)', en: 'Chapter 1 \u2014 scene 4 (the laser puzzle)' },
      title: { ar: 'LRRR — عاكس الليزر الذي لا ينام', en: 'LRRR \u2014 the Laser Reflector That Never Sleeps' },
      body: {
        ar: 'صينية من 100 منشور زجاجي زرعها أبولو 11 — بلا بطاريات ولا أسلاك ولا صيانة. بعد نصف قرن ما زالت مراصد الأرض ترتد إليها أشعة الليزر لقياس مسافة القمر، فاكتشفنا أنه يبتعد 3.8 سم كل سنة. في اللعبة استخدم طارق نفس العاكس لتحديد موقعه بدقة المليمتر.',
        en: 'A tray of 100 glass corner-cubes planted by Apollo 11 \u2014 no batteries, no wires, no maintenance. Half a century later, observatories on Earth still bounce lasers off it to measure the Moon\u2019s distance, revealing that it drifts 3.8 cm farther away every year. In the game, Tariq uses this very reflector to fix his position to millimetre precision.',
      },
      srcName: { ar: 'أرشيف ناسا NSSDCA — حزم ALSEP (العاكسات)', en: 'NASA NSSDCA \u2014 ALSEP science packages (retroreflectors)' },
      srcUrl: NASA_LINKS.alsep,
    },
    {
      id: 'lrv',
      img: 'lrv',
      where: { ar: 'الفصل الأول — المشهدان الخامس والسادس', en: 'Chapter 1 \u2014 scenes 5\u20136 (the rover valley)' },
      title: { ar: 'LRV — أول سيارة كهربائية على القمر', en: 'LRV \u2014 the First Electric Car on the Moon' },
      body: {
        ar: 'ثلاث عربات جوالة قطعت نحو 90 كم على القمر خلال أبولو 15 و16 و17 — بسرعة تصل 18 كم/س، فوق عجلات منسوجة من أسلاك فولاذية مجلفنة. تُركت كل عربة في نهاية مهمتها موقوفة إلى الأبد، ومعها عجلاتها الشبكية وكاميرتها التلفزيونية وهوائي الطبق عالي الكسب الذي بث الصور الحية للأرض.',
        en: 'Three Lunar Roving Vehicles drove a total of about 90 km across the Moon during Apollo 15, 16 and 17 \u2014 at up to 18 km/h, on wheels woven from zinc-plated steel wire. Each rover was parked permanently at the end of its mission, complete with its mesh wheels, its TV camera and the high-gain dish antenna that beamed live video to Earth.',
      },
      srcName: { ar: 'أرشيف ناسا NSSDCA — العربة الجوالة (أبولو 15)', en: 'NASA NSSDCA \u2014 Lunar Roving Vehicle (Apollo 15)' },
      srcUrl: NASA_LINKS.lrv,
    },
    {
      id: 'sojourner',
      img: 'sojourner',
      where: { ar: 'الفصل الثاني — المشهد الثاني (محطة سوجورنر)', en: 'Chapter 2 \u2014 scene 2 (the Sojourner station)' },
      title: { ar: 'سوجورنر — أول عربة على المريخ (1997)', en: 'Sojourner \u2014 the First Rover on Mars (1997)' },
      body: {
        ar: 'بحجم فرن الميكروويف ووزن 11.5 كجم فقط، تدحرج سوجورنر من منحدر مركبة Pathfinder عام 1997 ليصبح أول مركبة تقود على المريخ. عمل 83 يوماً مريخياً — 12 ضعف عمره المخطط — ومهّد الطريق لكل عربة جاءت بعده. يقف اليوم صامتاً بجوار مركبته في وادي أريس.',
        en: 'The size of a microwave oven and just 11.5 kg, Sojourner rolled down Pathfinder\u2019s ramp in 1997 to become the first vehicle to drive on Mars. It operated for 83 sols \u2014 twelve times longer than planned \u2014 and paved the way for every rover since. It now stands silently beside its lander in Ares Vallis.',
      },
      srcName: { ar: 'ناسا ساينس — مركبة مارس Pathfinder', en: 'NASA Science \u2014 Mars Pathfinder' },
      srcUrl: NASA_LINKS.pathfinder,
    },
    {
      id: 'insight',
      img: 'insight',
      where: { ar: 'الفصل الثاني — المشهد الثالث (محطة إنسايت)', en: 'Chapter 2 \u2014 scene 3 (the InSight station)' },
      title: { ar: 'إنسايت — من أنصت لقلب المريخ', en: 'InSight \u2014 the One Who Listened to Mars' },
      body: {
        ar: 'هبط InSight على سهول إليسيوم عام 2018 حاملاً مقياس الزلازل فائق الحساسية SEIS تحت قبة من النحاس والذهب. سجّل أكثر من 1300 هزة مريخية وبرهن أن لب المريخ سائل. في ديسمبر 2022 أنهى الغبار ألواحه الشمسية مهمته — يجلس اليوم صامتاً، نصباً تذكارياً لنبض الكوكب.',
        en: 'InSight landed on Elysium Planitia in 2018 carrying SEIS, an ultra-sensitive seismometer sheltered under a copper-and-gold dome. It recorded more than 1,300 marsquakes and proved that Mars has a liquid core. In December 2022 dust on its solar panels ended the mission \u2014 it now sits silent, a stationary monument to the planet\u2019s heartbeat.',
      },
      srcName: { ar: 'ناسا ساينس — مهمة InSight', en: 'NASA Science \u2014 InSight mission' },
      srcUrl: NASA_LINKS.insight,
    },
    {
      id: 'opportunity',
      img: 'opportunity',
      where: { ar: 'الفصل الثاني — المشهد الرابع (قمة إنديفور)', en: 'Chapter 2 \u2014 scene 4 (Endeavour\u2019s rim)' },
      title: { ar: 'أوبرتونيتي — 15 عاماً في مهمة 90 يوماً', en: 'Opportunity \u2014 15 Years on a 90-Day Mission' },
      body: {
        ar: 'صُمم Opportunity ليعمل 90 يوماً مريخياً فقط، فاستكشف المريخ قرابة 15 عاماً وقطع أكثر من 45 كم — رقماً قياسياً كوكبياً. في يونيو 2018 حجبت عاصفة غبارية ملتفة حول الكوكب شمسه فأرسل رسالته الأخيرة: «بطاريتي منخفضة والظلام يحل». يرقد اليوم على حافة فوهة إنديفور في وادي المثابرة.',
        en: 'Designed to last 90 Martian days, Opportunity explored Mars for nearly 15 years and drove over 45 km \u2014 a planetary driving record. In June 2018 a planet-encircling dust storm darkened its skies, and the rover sent its final message: \u201cMy battery is low and it\u2019s getting dark.\u201d It rests today on the rim of Endeavour crater, in Perseverance Valley.',
      },
      srcName: { ar: 'ناسا ساينس — عربتا الاستكشاف Spirit وOpportunity', en: 'NASA Science \u2014 Mars Exploration Rovers (Spirit & Opportunity)' },
      srcUrl: NASA_LINKS.mer,
    },
  ];

  /* ---------------------------------------------------------
     ما وراء اللعبة — بقية قائمة ناسا للمعدات المتروكة
     (من صفحة موارد التحدي الرسمية)
     --------------------------------------------------------- */
  const BEYOND = [
    { name: { ar: 'مسبارا Surveyor — أول هبوط ناعم (1966-1968)', en: 'Surveyor landers \u2014 proving soft landings (1966\u20131968)' }, url: NASA_LINKS.surveyor },
    { name: { ar: 'فايكنج 1 و2 — أول هبوط أمريكي ناجح (1976)', en: 'Viking 1 & 2 \u2014 the first successful US landers (1976)' }, url: NASA_LINKS.viking },
    { name: { ar: 'Spirit — تاهت في التربة الرخوة وصمتت (2010)', en: 'Spirit \u2014 stuck in soft soil, silent since 2010' }, url: NASA_LINKS.mer },
    { name: { ar: 'فينيكس — حفر عن الجليد المائي (2008)', en: 'Phoenix \u2014 dug for water ice (2008)' }, url: NASA_LINKS.nssdca },
    { name: { ar: 'Dawn — رسم فيستا وسيريس ثم نفد وقوده', en: 'Dawn \u2014 mapped Vesta and Ceres, then ran out of fuel' }, url: NASA_LINKS.dawn },
    { name: { ar: 'NEAR Shoemaker — أول من دار وهبط على كويكب', en: 'NEAR Shoemaker \u2014 first to orbit and land on an asteroid' }, url: NASA_LINKS.near },
    { name: { ar: 'بايونير 10 و11 — تنجرف خارج النظام الشمسي', en: 'Pioneer 10 & 11 \u2014 drifting out of the solar system' }, url: NASA_LINKS.pioneer },
    { name: { ar: 'Ingenuity — أول طائرة على كوكب آخر', en: 'Ingenuity \u2014 the first aircraft on another planet' }, url: NASA_LINKS.ingenuity },
    { name: { ar: 'Kepler — صائد الكواكب الخارجية', en: 'Kepler \u2014 the exoplanet hunter' }, url: NASA_LINKS.kepler },
  ];

  /* جدول المصادر — كل روابط موارد التحدي */
  const SOURCE_ROWS = [
    { used: { ar: 'الفهرس الرئيسي لكل مركبات ومهمات ناسا', en: 'Master catalog of every NASA spacecraft and mission' }, name: 'NASA Space Science Data Coordinated Archive (NSSDCA)', url: NASA_LINKS.nssdca },
    { used: { ar: 'مركبة أبولو 11 «النسر» — موقع اللعب على القمر', en: 'Apollo 11 Lunar Module / Eagle \u2014 the game\u2019s landing site' }, name: 'NSSDCA \u2014 Apollo 11 LM (Eagle)', url: NASA_LINKS.eagle },
    { used: { ar: 'العربة الجوالة القمرية وملحقاتها', en: 'The Lunar Roving Vehicle and its equipment' }, name: 'NSSDCA \u2014 Lunar Roving Vehicle (Apollo 15)', url: NASA_LINKS.lrv },
    { used: { ar: 'حزم التجارب العلمية: مقياس الزلازل والعاكس ووحدات التدفئة', en: 'ALSEP science packages: seismometers, retroreflectors, heater units' }, name: 'NSSDCA \u2014 ALSEP science packages', url: NASA_LINKS.alsep },
    { used: { ar: 'سوجورنر — أول عربة على المريخ', en: 'Sojourner \u2014 the first Mars rover' }, name: 'NASA Science \u2014 Mars Pathfinder', url: NASA_LINKS.pathfinder },
    { used: { ar: 'Opportunity وعاصفة 2018 الغبارية', en: 'Opportunity and the 2018 global dust storm' }, name: 'NASA Science \u2014 Spirit & Opportunity', url: NASA_LINKS.mer },
    { used: { ar: 'إنسايت — مقياس الزلازل SEIS', en: 'InSight \u2014 the SEIS seismometer' }, name: 'NASA Science \u2014 InSight', url: NASA_LINKS.insight },
    { used: { ar: 'ما وراء اللعبة: Surveyor', en: 'Beyond the game: Surveyor' }, name: 'NASA Science \u2014 Surveyor 3', url: NASA_LINKS.surveyor },
    { used: { ar: 'ما وراء اللعبة: فايكنج 1', en: 'Beyond the game: Viking 1' }, name: 'NASA Science \u2014 Viking 1', url: NASA_LINKS.viking },
    { used: { ar: 'ما وراء اللعبة: Dawn', en: 'Beyond the game: Dawn' }, name: 'NASA Science \u2014 Dawn', url: NASA_LINKS.dawn },
    { used: { ar: 'ما وراء اللعبة: NEAR Shoemaker', en: 'Beyond the game: NEAR Shoemaker' }, name: 'NASA Science \u2014 NEAR Shoemaker', url: NASA_LINKS.near },
    { used: { ar: 'ما وراء اللعبة: بايونير 10', en: 'Beyond the game: Pioneer 10' }, name: 'NASA Science \u2014 Pioneer 10', url: NASA_LINKS.pioneer },
    { used: { ar: 'ما وراء اللعبة: مروحية Ingenuity', en: 'Beyond the game: Ingenuity helicopter' }, name: 'NASA Science \u2014 Ingenuity Mars Helicopter', url: NASA_LINKS.ingenuity },
    { used: { ar: 'ما وراء اللعبة: تلسكوب Kepler', en: 'Beyond the game: Kepler telescope' }, name: 'NASA Science \u2014 Kepler', url: NASA_LINKS.kepler },
  ];

  /* نصوص واجهة الدليل */
  const T = {
    title:    { ar: 'دليل المهمة ومصادر ناسا', en: 'NASA MISSION MANUAL' },
    subtitle: { ar: 'أوزيريس — مهجور لكن غير منسي · Space Apps 2026', en: 'OSIRIS \u2014 Abandoned But Not Forgotten \u00b7 Space Apps 2026' },
    tabMachines: { ar: 'آلات اللعبة', en: 'THE MACHINES' },
    tabSources:  { ar: 'المصادر والبيانات', en: 'DATA SOURCES' },
    tabDocs:     { ar: 'الملفات المصاحبة', en: 'DOCUMENTS' },
    machinesSub: { ar: 'كل معدات ناسا التي تقابلها في اللعبة — شرح علمي ومصدر رسمي لكل آلة.', en: 'Every piece of NASA equipment you meet in the game \u2014 with its science and its official source.' },
    beyondTitle: { ar: 'ما وراء اللعبة — عائلة ناسا من المعدات المتروكة', en: 'Beyond the game \u2014 NASA\u2019s wider family of discarded machines' },
    beyondSub:   { ar: 'من نفس قائمة التحدي الرسمية: معدات حقيقية أخرى تركتها ناسا على القمر والمريخ وفي الفضاء العميق.', en: 'From the challenge\u2019s official resource list \u2014 other real machines NASA left on the Moon, Mars and deep space.' },
    inGame:      { ar: 'في اللعبة:', en: 'In the game:' },
    sourceLabel: { ar: 'المصدر:', en: 'NASA source:' },
    openSource:  { ar: 'افتح المصدر على موقع ناسا ↗', en: 'OPEN NASA SOURCE \u2197' },
    srcCol:      { ar: 'المصدر الرسمي', en: 'Official source' },
    usedCol:     { ar: 'استخدمناه لـ', en: 'Used for' },
    linkCol:     { ar: 'الرابط', en: 'Link' },
    open:        { ar: 'فتح ↗', en: 'OPEN \u2197' },
    docStory:    { ar: 'الكوميك ثلاثي الأبعاد', en: '3D Comic Book' },
    docStorySub: { ar: 'القصة نفسها بكوميك تفاعلي ثلاثي الأبعاد تقلّب صفحاته بنفسك — يفتح تلقائياً بلغتك الحالية.', en: 'The same story as an interactive 3D flip-through comic — opens automatically in your current language.' },
    docGuide:    { ar: 'الأرشيف الصامت (PDF)', en: 'The Silent Archive (PDF)' },
    docGuideSub: { ar: 'ملف الحالة العلمي التفصيلي: التحقيق الكامل في معدات ناسا المتروكة — للمعلمين والقراء المتعمقين.', en: 'The detailed science case file: a full investigation into NASA\u2019s discarded equipment — for educators and deep readers.' },
    openDoc:     { ar: 'اقرأ الملف ↗', en: 'READ IT \u2197' },
    footer: {
      ar: 'مشروع تعليمي غير رسمي أُنشئ لمسابقة NASA Space Apps Challenge 2026 — الصور التاريخية من أرشيف ناسا وهي ملكية عامة.',
      en: 'An unofficial educational project made for the NASA Space Apps Challenge 2026 \u2014 historical images from NASA archives, public domain.',
    },
    closeLabel: { ar: 'إغلاق الدليل (Esc)', en: 'Close manual (Esc)' },
  };

  /* ---------------------------------------------------------
     كائن الدليل
     --------------------------------------------------------- */
  const Manual = {
    lang: 'en',
    overlay: null,
    _onClose: null,
    _tab: 'machines',
    _onKeyDown: null,

    t(pair) { return pair ? (pair[this.lang] || pair.en || '') : ''; },

    isOpen() { return !!this.overlay; },

    img(key) {
      return (typeof ASSETS !== 'undefined' && ASSETS.codex && ASSETS.codex[key]) || '';
    },

    /* رابط خارجي آمن — دائماً نافذة جديدة مع noopener */
    extLink(url, label, cls) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = cls || 'manual-link-btn';
      a.textContent = label;
      return a;
    },

    /* ---------- البناء ---------- */
    open(opts = {}) {
      if (this.overlay) return;
      this.lang = opts.lang === 'ar' ? 'ar' : 'en';
      this._onClose = typeof opts.onClose === 'function' ? opts.onClose : null;
      this._tab = 'machines';

      const isAr = this.lang === 'ar';

      const ov = document.createElement('div');
      ov.className = 'manual-overlay' + (isAr ? ' lang-ar' : ' lang-en');
      ov.dir = isAr ? 'rtl' : 'ltr';

      const panel = document.createElement('div');
      panel.className = 'manual-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', this.t(T.title));

      panel.innerHTML = `
        <div class="manual-head">
          <div class="manual-head-txt">
            <span class="manual-title"></span>
            <span class="manual-sub"></span>
          </div>
          <button type="button" class="manual-close" aria-label=""></button>
        </div>
        <div class="manual-disclaimer"><span class="md-icon">!</span><p class="md-text"></p></div>
        <nav class="manual-tabs">
          <button type="button" class="manual-tab" data-tab="machines"></button>
          <button type="button" class="manual-tab" data-tab="sources"></button>
          <button type="button" class="manual-tab" data-tab="docs"></button>
        </nav>
        <div class="manual-body"></div>
        <div class="manual-foot"></div>
      `;

      panel.querySelector('.manual-title').textContent = this.t(T.title);
      panel.querySelector('.manual-sub').textContent = this.t(T.subtitle);
      panel.querySelector('.md-text').textContent = this.t(DISCLAIMER);
      const closeBtn = panel.querySelector('.manual-close');
      closeBtn.textContent = '\u2715';
      closeBtn.setAttribute('aria-label', this.t(T.closeLabel));

      const tabs = panel.querySelectorAll('.manual-tab');
      tabs.forEach((tb) => {
        tb.addEventListener('click', () => {
          this._tab = tb.dataset.tab;
          this._syncTabs();
          this._renderBody();
        });
      });

      closeBtn.addEventListener('click', () => this.close());
      ov.addEventListener('pointerdown', (e) => {
        if (e.target === ov) this.close();
      });

      ov.appendChild(panel);
      document.body.appendChild(ov);
      this.overlay = ov;

      this._syncTabs();
      this._renderBody();

      /* Escape يغلق الدليل — مستمع مؤقت يُزال عند الإغلاق */
      this._onKeyDown = (e) => {
        if (e.key === 'Escape' || e.code === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          this.close();
        }
      };
      window.addEventListener('keydown', this._onKeyDown, true); // capture: قبل معالجات اللعبة
    },

    _syncTabs() {
      if (!this.overlay) return;
      const labels = { machines: T.tabMachines, sources: T.tabSources, docs: T.tabDocs };
      this.overlay.querySelectorAll('.manual-tab').forEach((tb) => {
        tb.textContent = this.t(labels[tb.dataset.tab]);
        tb.classList.toggle('active', tb.dataset.tab === this._tab);
      });
    },

    _renderBody() {
      if (!this.overlay) return;
      const body = this.overlay.querySelector('.manual-body');
      body.innerHTML = '';
      body.scrollTop = 0;

      if (this._tab === 'machines') this._renderMachines(body);
      else if (this._tab === 'sources') this._renderSources(body);
      else this._renderDocs(body);

      const foot = this.overlay.querySelector('.manual-foot');
      foot.textContent = this.t(T.footer);
    },

    /* ---------- تبويب الآلات ---------- */
    _renderMachines(body) {
      const sub = document.createElement('p');
      sub.className = 'manual-sub';
      sub.textContent = this.t(T.machinesSub);
      body.appendChild(sub);

      const grid = document.createElement('div');
      grid.className = 'manual-grid';

      MANUAL_ENTRIES.forEach((entry) => {
        const card = document.createElement('article');
        card.className = 'manual-card';

        const img = document.createElement('img');
        img.className = 'mc-img';
        img.src = this.img(entry.img);
        img.alt = this.t(entry.title);
        img.loading = 'lazy';
        img.draggable = false;
        card.appendChild(img);

        const inner = document.createElement('div');
        inner.className = 'mc-inner';

        const h4 = document.createElement('h4');
        h4.className = 'mc-title';
        h4.textContent = this.t(entry.title);
        inner.appendChild(h4);

        const where = document.createElement('p');
        where.className = 'mc-where';
        where.textContent = '\u25b8 ' + this.t(entry.where);
        inner.appendChild(where);

        const p = document.createElement('p');
        p.className = 'mc-text';
        p.textContent = this.t(entry.body);
        inner.appendChild(p);

        const src = document.createElement('div');
        src.className = 'mc-source';
        const srcName = document.createElement('span');
        srcName.className = 'mc-source-name';
        srcName.textContent = this.t(T.sourceLabel) + ' ' + this.t(entry.srcName);
        src.appendChild(srcName);
        src.appendChild(this.extLink(entry.srcUrl, this.t(T.openSource), 'manual-link-btn'));
        inner.appendChild(src);

        card.appendChild(inner);
        grid.appendChild(card);
      });

      body.appendChild(grid);

      /* ما وراء اللعبة */
      const beyond = document.createElement('section');
      beyond.className = 'manual-beyond';
      const bt = document.createElement('h3');
      bt.textContent = this.t(T.beyondTitle);
      const bs = document.createElement('p');
      bs.className = 'manual-sub';
      bs.textContent = this.t(T.beyondSub);
      beyond.appendChild(bt);
      beyond.appendChild(bs);

      const ul = document.createElement('ul');
      ul.className = 'beyond-list';
      BEYOND.forEach((item) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = this.t(item.name);
        li.appendChild(span);
        li.appendChild(this.extLink(item.url, this.t(T.open), 'manual-link-btn tiny'));
        ul.appendChild(li);
      });
      beyond.appendChild(ul);
      body.appendChild(beyond);
    },

    /* ---------- تبويب المصادر ---------- */
    _renderSources(body) {
      const table = document.createElement('table');
      table.className = 'manual-table';
      const isAr = this.lang === 'ar';

      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>${this.t(T.srcCol)}</th>
          <th>${this.t(T.usedCol)}</th>
          <th>${this.t(T.linkCol)}</th>
        </tr>`;
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      SOURCE_ROWS.forEach((row) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.className = 'mt-name';
        tdName.textContent = row.name;

        const tdUsed = document.createElement('td');
        tdUsed.textContent = this.t(row.used);

        const tdLink = document.createElement('td');
        tdLink.appendChild(this.extLink(row.url, this.t(T.open), 'manual-link-btn tiny'));

        tr.appendChild(isAr ? tdLink : tdName);
        tr.appendChild(tdUsed);
        tr.appendChild(isAr ? tdName : tdLink);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      body.appendChild(table);
    },

    /* ---------- تبويب الملفات ---------- */
    _renderDocs(body) {
      const wrap = document.createElement('div');
      wrap.className = 'manual-docs';

      const docs = [
        { key: 'comic', file: this.lang === 'ar' ? 'assets/docs/comic-ar.html' : 'assets/docs/comic-en.html', title: T.docStory, sub: T.docStorySub, img: 'plaqueIcon' },
        { key: 'archive', file: 'assets/docs/the-silent-archive.pdf', title: T.docGuide, sub: T.docGuideSub, img: 'lor' },
      ];

      docs.forEach((d) => {
        const card = document.createElement('article');
        card.className = 'doc-card';

        const img = document.createElement('img');
        img.className = 'doc-img';
        img.src = this.img(d.img);
        img.alt = this.t(d.title);
        img.loading = 'lazy';
        card.appendChild(img);

        const inner = document.createElement('div');
        inner.className = 'doc-inner';
        const h4 = document.createElement('h4');
        h4.textContent = this.t(d.title);
        const p = document.createElement('p');
        p.textContent = this.t(d.sub);
        inner.appendChild(h4);
        inner.appendChild(p);
        inner.appendChild(this.extLink(d.file, this.t(T.openDoc), 'manual-link-btn'));
        card.appendChild(inner);
        wrap.appendChild(card);
      });

      body.appendChild(wrap);
    },

    /* ---------- الإغلاق ---------- */
    close() {
      if (!this.overlay) return;
      if (this._onKeyDown) {
        window.removeEventListener('keydown', this._onKeyDown, true);
        this._onKeyDown = null;
      }
      this.overlay.remove();
      this.overlay = null;
      const cb = this._onClose;
      this._onClose = null;
      if (typeof cb === 'function') cb();
    },

    setLang(lang) {
      this.lang = lang === 'ar' ? 'ar' : 'en';
      if (this.overlay) {
        const cb = this._onClose;
        this._onClose = null;      // لا نوقف اللعبة أثناء إعادة البناء
        this.close();
        this.open({ lang: this.lang, onClose: cb });
      }
    },
  };

  if (typeof window !== 'undefined') window.Manual = Manual;
})();
