/* =========================================================

 assets.js — خريطة الوسائط (Manifest)

 المصدر الوحيد لكل مسارات الصور والفيديوهات في اللعبة.

 أي ملف وسائط جديد يُضاف هنا أولاً ثم يُشار إليه من الغرف

 أو المشاهد — لا تكتب مسار وسائط داخل أي ملف آخر.



 — مشهد طارق (8.jpg) + الصورة الختامية (start-bg.jpg) + مكاتب الفريق



 ★ لاستبدال أي أصل بإصدارك الخاص (صورة/فيديو من إنتاجك):

 ضع ملفك بنفس الاسم والمسار بالضبط وسيحل مكانه فوراً.

 ========================================================= */



const ASSETS = {

  /* —— صور الغرف (خلفيات ثابتة 2752×1536 ما عدا غرف القمر والمريخ 1376×768) —— */

  rooms: {

    docs:          'assets/images/rooms/room-docs.jpg',           // الغرفة 0: غرفة التوثيق (صور الحائط)

    corridor:      'assets/images/rooms/room-corridor.jpg',       // الغرفة 1: الممر/الغرفة الوسطى

    cockpit:       'assets/images/rooms/room-cockpit.jpg',        // الغرفة 2: قمرة القيادة (طارق NPC)

    airlock:       'assets/images/rooms/room-airlock.jpg',        // الغرفة 3: حجرة الكبسولة + رافع الباب

    cockpitDamaged:'assets/images/rooms/room-cockpit-damaged.jpg',// الغرفة 6: القمرة بعد الاصطدام (شاشة القمر الحمراء)

    moon:          'assets/images/rooms/room-moon-surface.jpg',   // الغرفة 7 — المشهد 1: موقع الارتطام (بحر الهدوء)

 /* المشاهد 2..7 — الاسكربت المطور : صور المستخدم 2..7.jpg —— */

    moonFootprints:'assets/images/rooms/moon-footprints.jpg',     // الغرفة 8 — المشهد 2: مسار الوادي وخطوات أبولو + العلم الأبيض (2.jpg)

    moonPsep:      'assets/images/rooms/moon-psep.jpg',           // الغرفة 9 — المشهد 3: محطة الزلازل PSEP + وحدات RHU (3.jpg)

    moonLrrr:      'assets/images/rooms/moon-lrrr.jpg',           // الغرفة 10 — المشهد 4: عاكس الليزر LRRR (4.jpg)

    moonValley:    'assets/images/rooms/moon-valley.jpg',         // الغرفة 11 — المشهد 5: ممر جبال أبولو + مسارات العجلات (5.jpg)

    moonRover:     'assets/images/rooms/moon-rover.jpg',          // الغرفة 12 — المشهد 6: وادي عربة أبولو LRV (6.jpg)

    moonLaunch:    'assets/images/rooms/moon-launch.jpg',         // الغرفة 13 — المشهد 7: منصة الإطلاق ومركبة العبور (7.jpg الجديدة)

 /* الفصل الثاني: المريخ — حديقة التراث الفضائي (الاسكربت الجديد:

       صور المستخدم 1..8.jpg من New folder 13) —— */

    marsHabitat:   'assets/images/rooms/mars-habitat.jpg',      // الغرفة 14 — المشهد 1: داخل المأوى بعد انجلاء العاصفة (1.jpg)

    marsAirlock:   'assets/images/rooms/mars-airlock.jpg',      // الغرفة 15 — ممر بوابة العزل المغلقة (2.jpg)

    marsAirlockOpen:'assets/images/rooms/mars-airlock-open.jpg',// الغرفة 15 بعد فتح البوابة (3.jpg)

    marsPlain:     'assets/images/rooms/mars-plain.jpg',        // الغرفة 16 — السهل الصخري الليلي: أول خلفية خارجية (4.jpg)

    marsSojourner: 'assets/images/rooms/mars-sojourner.jpg',   // الغرفة 17 — المشهد 2: محطة سوجورنر (5.jpg)

    marsInsight:   'assets/images/rooms/mars-insight.jpg',     // الغرفة 18 — المشهد 3: محطة إنسايت (6.jpg)

    marsOpportunity:'assets/images/rooms/mars-opportunity.jpg',// الغرفة 19 — المشهد 4: قمة إنديفور وأوبي (7.jpg)

 /* : مشهد الشروق أصبح غرفة مشي عادية بصورة الأفق الممتد —— */

    marsSunriseWalk:'assets/images/rooms/mars-sunrise.jpg',    // الغرفة 20 — مشهد الشروق: السهل عند الشروق (خلفية مشي عادية)

 /* : مشهد طارق (اللقاء) على خلفية المركبة الهابطة على السهل (8.jpg) —— */

    marsReunion:   'assets/images/rooms/mars-lander.jpg',      // الغرفة 21 — المشهد 5: مشهد طارق أمام المركبة الهابطة (8.jpg)

 finaleDuo: 'assets/images/rooms/start-bg.jpg', // الصورة الأخيرة بعد اللقاء والنهاية (الأخوان داخل القمرة — start-bg.jpg)



 /* — خلف الكواليس: مكاتب فريق NileStro الأربعة (بالترتيب 1→2→3→4) —— */

    office1:       'assets/images/rooms/team-office-1.jpg',    // الغرفة 30 — مكتب ملك (القيادة والبيوتكنولوجي)

    office2:       'assets/images/rooms/team-office-2.jpg',    // الغرفة 31 — مكتب رانيا (أبحاث البيانات وكتب الفضاء)

    office3:       'assets/images/rooms/team-office-3.jpg',    // الغرفة 32 — مكتب مازن (الملاحة وتكنولوجيا الفضاء)

    office4:       'assets/images/rooms/team-office-4.jpg',    // الغرفة 33 — استوديو محمد (التطوير والصوتيات)

  },



  /* —— فيديوهات الغرف بعد الاصطدام (خلفيات حية 1920×1080) —— */

  roomVideos: {

    docsDamaged:   'assets/videos/room-docs-damaged.mp4',         // الغرفة 4: غرفة التوثيك بعد الاصطدام

    corridorDamaged:'assets/videos/room-corridor-damaged.mp4',    // الغرفة 5: الممر بعد الاصطدام (حوار الوداع)

    airlockDamaged:'assets/videos/room-airlock-damaged.mp4',      // خلفية غرفة الكبسولة بعد الاصطدام

  },



  /* —— فيديوهات سينمائية (ملء الشاشة 1920×1080 ~3.9ث) —— */

  cutscenes: {

    separation:    'assets/videos/cutscene-separation.mp4',       // انفصال كبسولة زين (بعد بروتوكول الهروب)

    afterSeparation:'assets/videos/cutscene-after-separation.mp4',// انجراف الكبسولة (قبل الخاتمة)

    wake:          'assets/videos/cutscene-wake.mp4',             // استيقاظ طارق (بدء الفصل الأول)

    hatchOpen:     'assets/videos/cutscene-hatch-open.mp4',       // فتح باب الكبسولة (فريم ثابت + E)

    hatchExit:     'assets/videos/cutscene-hatch-exit.mp4',       // الخروج إلى سطح القمر (فريم ثابت + E)

 /* لقطات الإقلاس من إنتاج المستخدم — بصوتها الخاص، بلا حوار فوقها —— */

    ride:          'assets/videos/cutscene-ride.mp4',            // اللقطة 1: الركوب — طارق يصعد السلم لداخل الكبسولة

    zoomout:       'assets/videos/cutscene-zoomout.mp4',         // اللقطة 2: الإقلاع + زووم آوت حتى يظهر القمر

    moonMars:      'assets/videos/cutscene-moon-mars.mp4',       // اللقطة 3: من القمر إلى المريخ (7.9ث)

 /* الفصل الثاني «حديقة التراث الفضائي» (الاسكربت الجديد)

 : فيديو الشروق أُزيل — مشهد الشروق الآن غرفة مشي عادية (mars-sunrise.jpg) —— */

    ending:        'assets/videos/cutscene-ending.mp4',           // اللقطة الختامية للأخوين وأوبي

  },



  /* أوراق الشخصيات (Sprite sheets خلايا 256×256)

 : أوراق الفريق مُوحَّدة الأحجام — الشخصيات الأربع بنفس الارتفاع

 ومحمد idle بنفس حجم walk (ارتفاع المحتوى 116px في كل الأوراق) —— */

  sprites: {

    zainIdle:      'assets/images/sprites/zain-idle.png',

    zainWalk:      'assets/images/sprites/zain-walk.png',

    tariqIdle:     'assets/images/sprites/tariq-idle.png',

    tariqWalk:     'assets/images/sprites/tariq-walk.png',

    mohamedIdle:   'assets/images/sprites/team-mohamed-idle.png',   // اللاعب في خاتمة الفريق (خلف الكواليس)

    mohamedWalk:   'assets/images/sprites/team-mohamed-walk.png',

    malakIdle:     'assets/images/sprites/team-malak.png',          // ملك قطب — قائدة الفريق

    ranyaIdle:     'assets/images/sprites/team-ranya.png',          // رانيا إبراهيم — الباحثة

    mazenIdle:     'assets/images/sprites/team-mazen.png',          // مازن أشرف — مهندس الملاحة

  },



 /* أجسام تُرسم فوق خلفيات الغرف ( / ) ——

     مسارات عجلات العربة LRV: خلفية ممر الجبال (إصدار المستخدم 5.jpg) لا

     تحوي مسارات مرسومة — الجسم يُرسم برمجياً على أرضية الوادي بالمشهد 5 (الغرفة 11) */

  overlays: {

    tracks:        'assets/images/gen/spr-tracks.png',

  },



 /* —— صور دليل المهمة ومصادر ناسا (js/manual.js) ——

     صور أرشيفية حقيقية من ناسا/ويكيميديا (ملكية عامة) مضغوطة محلياً ——

     يستخدمها دليل «آلات اللعبة» داخل نافذة الدليل (زر الكتاب) */

  codex: {

    plaqueIcon:    'assets/images/codex/codex-plaque-icon.jpg',   // لوحة الذكريات

    earthrise:     'assets/images/codex/earthrise.jpg',           // الأرض تشرق فوق القمر

    bootprint:     'assets/images/codex/bootprint.jpg',           // بصمة الحذاء

    flag:          'assets/images/codex/flag.jpg',                // العلم المبيّض

    eagle:         'assets/images/codex/eagle.jpg',               // مركبة النسر

    psep:          'assets/images/codex/psep.jpg',                // محطة الزلازل

    rhu:           'assets/images/codex/rhu.jpg',                 // وحدة التدفئة النووية

    lrrr:          'assets/images/codex/lrrr.jpg',                // عاكس الليزر

    lrvWheel:      'assets/images/codex/lrv-wheel.jpg',           // العجلة الشبكية

    lrv:           'assets/images/codex/lrv.jpg',                 // العربة الجوالة

    liftoff:       'assets/images/codex/liftoff.jpg',             // إقلاع أبولو 17

    fender:        'assets/images/codex/fender.jpg',              // إصلاح الشريط اللاصق

    vacuum:        'assets/images/codex/codex-vacuum-launch.jpg', // فيزياء الإطلاق في الفراغ

    lor:           'assets/images/codex/lor.jpg',                 // قرار الالتقاط المداري

    mars:          'assets/images/codex/mars.jpg',                // كوكب المريخ

    opportunity:   'assets/images/codex/opportunity.jpg',         // أوبرتونيتي

    storm:         'assets/images/codex/storm.jpg',               // العاصفة الغبارية

    insight:       'assets/images/codex/insight.jpg',             // إنسايت

    sunset:        'assets/images/codex/sunset.jpg',              // الغروب الأزرق

    sojourner:     'assets/images/codex/sojourner.jpg',           // سوجورنر

  },



  /* —— واجهة القائمة —— */

  menu: {

    background:    'assets/videos/menu-background.mp4',           // خلفية القائمة الرئيسية (رواد فضاء بيكسل)

  },

};
