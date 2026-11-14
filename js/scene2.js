/* =========================================================

   Scene 2 — Zien Walk Stage

   غرف متتابعة + نقاط تفاعل (E) + حوار حرف بحرف + تأثيرات صوتية

   - كل مسارات الوسائط تُقرأ من ملف js/assets.js (ASSETS)

   - دعم اللمس: أزرار تحكم تظهر تلقائياً على الأجهزة اللمسية

   - نظام حفظ مراحل: 'scene2' → 'moon' → 'complete'

     (زر CONTINUE يقفز لأبعد مرحلة وصلها اللاعب)

   - نهاية الجزء الحالي: بعد لوحة الذكريات على سطح القمر

     تتجه شرقاً نحو موقع أبولو 11 → لافتة «يتبع…» → القائمة



   التسلسل (أسماء الملفات في assets.js — راجع CLAUDE.md للتفاصيل):

   - الغرفة 0 (room-docs): صور الحائط نقطة تفاعل → حوار زين

   - بعد الحوار: سهم يسار → الغرفة 1 (room-corridor) → قمرة القيادة

     (room-cockpit): طارق NPC جسم صلب + حوار ثلاثي المتحدثين

   - بعد حوار طارق (podStage): كل الأسهم يميناً نحو حجرة الكبسولة

     (room-airlock) — الاقتراب من الرافع يطلق سينما الاصطدام:

     اهتزاز + تحذير أحمر → خلفية فيديو (room-airlock-damaged)

     → حوار الاصطدام → لافتة المهمة

   - سلسلة الأزمة يساراً: الغرفة 4 (room-docs-damaged) → الغرفة 5

     (room-corridor-damaged): باب صلب + حوار الوداع تلقائياً بالاقتراب

   - تبديل اللاعب إلى طارق → مشي سينمائي → الغرفة 6

     (room-cockpit-damaged): الكرسي جسم صلب → سلسلة الختام:

     بروتوكول الهروب (3..2..1) → فيديو الانفصال (cutscene-separation)

     → حوار انقطاع الاتصال → فيديو الانجراف (cutscene-after-separation)

     → الخاتمة → لافتة «الفصل الأول: ما تركوه خلفهم»

   - الفصل الأول: فيديو الاستيقاظ (cutscene-wake — مرئي فوراً من أول فريم)

     ← سواد قصير ← فتح الباب (hatch-open بفريم + E) ← قطع مباشر بلا سواد

     ← الخروج (hatch-exit بفريم + E) ← قطع مباشر ← الغرفة 7 (room-moon-surface):

     طارق يظهر بنفس مكانه أمام الباب المفتوح — لغز صمام الأكسجين ← لوحة

     الذكريات ← التوجه شرقاً ← «يتبع…»

   - زر الترس (أو Tab أو Escape) يفتح الإعدادات أثناء اللعب

     (معطل عمداً أثناء السينما ولغز الهولوجرام)

   ========================================================= */



(function () {

  'use strict';



  const LANG_KEY = 'osiris_language';

  const VOLUM_KEY = 'osiris_volume';

  const SAVE_KEY = 'osiris_save';



  /* ---------------------------------------------------------

     نصوص الواجهة / الحوار / الإرشادات

     --------------------------------------------------------- */

  const INSTRUCTIONS = {

    ar: `

      <h2>🎮 طريقة اللعب</h2>

      <p><kbd>←</kbd><kbd>→</kbd> أو <kbd>A</kbd><kbd>D</kbd> للتحرك يميناً ويساراً</p>

      <p>اقترب من المعدات واضغط <kbd>E</kbd> لفحصها والتفاعل معها</p>

      <p class="panel-start">تحرّك لبدء المهمة</p>

    `,

    en: `

      <h2>🎮 HOW TO PLAY</h2>

      <p><kbd>←</kbd><kbd>→</kbd> or <kbd>A</kbd><kbd>D</kbd> to walk left and right</p>

      <p>Get close to equipment and press <kbd>E</kbd> to inspect it</p>

      <p class="panel-start">MOVE TO BEGIN THE MISSION</p>

    `,

  };



  /** هل الجهاز لمسي؟ — تظهر أزرار التحكم اللمسية تلقائياً */

  function isTouchDevice() {

    return ('ontouchstart' in window) ||

           (navigator.maxTouchPoints > 0) ||

           (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  }



  const TOAST = {

    ar: 'لا توجد معدات في المدى — اقترب أكثر',

    en: 'No equipment in range — get closer',

  };



  /* ---------------------------------------------------------

     المشهد الطارئ — التحذير الأحمر و لافتة المهمة (عربي/إنجليزي)

     --------------------------------------------------------- */

  const IMPACT_WARN = {

    ar: '⚠️ تحذير: اصطدام بسيل نيازك دقيقة — انفجار في خط وقود الهيدرازين!',

    en: '⚠️ WARNING: Micrometeorite swarm impact — Hydrazine fuel line rupture!',

  };



  const MISSION_TASK = {

    ar: 'المهمة: اركض نحو البوابة لمساعدة طارق!',

    en: 'Task: Run to the hatch to help Tariq!',

  };



  /* ---------------------------------------------------------

     المتحدثون — الأسماء تتبدل داخل لوحة الحوار سطراً بسطر

     (زين / طارق / سُهيل — الذكاء الاصطناعي للمهمة)

     --------------------------------------------------------- */

  const SPEAKERS = {

    zain:   { ar: 'زين',   en: 'Zain' },

    tariq:  { ar: 'طارق',  en: 'Tariq' },

    sohail: { ar: 'سُهيل [AI]', en: 'Sohail [AI]' },

    narrator: { ar: '', en: '' },   // سطر سرد بدون اسم متحدث

 /* فريق NileStro (خلف الكواليس) */

    malak:   { ar: 'ملك قطب',       en: 'Malak Kotp' },

    ranya:   { ar: 'رانيا إبراهيم', en: 'Ranya Ibrahem' },

    mazen:   { ar: 'مازن أشرف',     en: 'Mazen Ashraf' },

    mohamed: { ar: 'محمد أشرف',     en: 'Mohamed Ashraf' },

  };



  const DIALOGUES = {

    photos: {

      lines: [

        { who: 'zain',

          ar: '«صورتنا في حديقة المرصد في حلوان وإحنا صغيرين»',

          en: '"That picture of us in the Helwan observatory garden — we were just kids."' },

        { who: 'zain',

          ar: '«طارق كان دايماً باصص للتلسكوب ومكشر، وأنا باصص في الكاميرا وبضحك»',

          en: '"Tariq always glared at the telescope frowning, while I grinned at the camera."' },

        { who: 'zain',

          ar: '«السنين بتجري وإحنا الاتنين فوق القمر أهو!»',

          en: '"The years flew by — and look at us now, both of us above the Moon!"' },

      ],

    },

    tariq: {

      lines: [

        { who: 'zain',

          ar: '«يا باشمهندس طارق! بقالك 6 ساعات لازق في الشاشات دي ومبصتش برة الشباك ثانية واحدة! ارفع عينك وبص على الأرض... من هنا شكلها مسالم وجميل أوي، شبه جوهرة زرقاء عايمة في العتمة.»',

          en: "\"Tariq, you have been glued to those screens for six hours straight! Just look out the window for a second... Earth looks so peaceful from up here, like a brilliant blue marble floating in the dark.\"" },

        { who: 'tariq',

          ar: '«الجمال ده وراه معادلات بالمليمتر يا زين. إحنا داخلين على أضيق نقطة في مدار القمر، ومناورة المقلاع الجاذبي (Gravity Assist) هتبدأ بعد دقايق عشان نكتسب سرعة الهروب للمريخ. أي غلطة في حسابات الدفع، هنفقد نافذة العبور ومش هنوصل أبداً.»',

          en: "\"Behind that beauty lies precise orbital physics, Zain. We are entering our closest lunar approach, and the gravity assist maneuver begins in minutes to sling us toward Mars. Any propulsion miscalculation, and we miss the transfer window entirely.\"" },

        { who: 'sohail',

          ar: '«أؤكد حسابات المهندس طارق. كبسولة الهبوط المريخي معدة للمسار المباشر فور اشتعال محركات الدفع الخلفية.»',

          en: "\"Calculations verified. The Mars descent capsule is pre-programmed for direct trajectory once the main thrusters ignite.\"" },

        { who: 'zain',

          ar: '«حاضر يا سيدي فاهم... على فكرة، أنا علقت لوحة التذكار اللي عملناها عند مدخل الكبسولة زي ما وعدتك: \"طارق وزين — إلى النجوم معاً\".»',

          en: "\"Understood, chief... By the way, I just mounted our commemorative plaque right by the capsule hatch, just like I promised: 'Tariq & Zain — To the stars, together'.\"" },

        { who: 'tariq',

          ar: '«إلى النجوم معاً يا زين. يلا، ادخل الكبسولة دلوقتي، افحص صمام الأمان وتأكد إن ضغط المقصورة مستقر. مش عايز أي مفاجآت وقت الإشعال.»',

          en: "\"To the stars, together. Now head into the capsule, inspect the emergency safety valve, and confirm cabin pressure. I want zero surprises during ignition.\"" },

      ],

    },

    /* حوار الاصطدام — يبدأ بعد لمس الرافع مع خلفية room-airlock-damaged */

    impact: {

      lines: [

        { who: 'zain',

          ar: '«طارق!! إيه الرجة العنيفة دي؟! السفينة بتلف حولين نفسها!»',

          en: "\"Tariq!! What was that impact?! The entire ship is pitching out of control!\"" },

        { who: 'tariq',

          ar: '«حطام فضائي اخترق وحدة الوقود الخلفية! خط الهيدرازين انفجر والتسريب مش راضي يقفل! جاذبية القمر بتسحبنا لتحت بسرعة مرعبة!»',

          en: "\"Space debris breached our propulsion module! The fuel line ruptured and the leak cannot be sealed! Lunar gravity is pulling us into an uncontrollable descent!\"" },

        { who: 'sohail',

          ar: '«تحذير: وزن المركبتين معاً يمنع محركات الهروب من العمل. السقوط على سطح القمر حتمي خلال 45 ثانية. بروتوكول النجاة الوحيد: فصل كبسولة المريخ المستقلة فوراً لتخفيف الكتلة!»',

          en: "\"Warning: The combined spacecraft mass exceeds emergency thrust limits. Lunar crash inevitable within 45 seconds. Sole survival protocol: Jettison the independent Mars capsule immediately to reduce mass!\"" },

      ],

    },

    /* بروتوكول الهروب — طارق وصل غرفة التحكم بعد الاصطدام (room-cockpit-damaged) */

    escape: {

      lines: [

        { who: 'narrator',

          ar: 'دخل طارق غرفة التحكم.',

          en: 'Tariq entered the control room.' },

        { who: 'sohail',

          ar: '«تفعيل بروتوكول الهروب الباليستي. إشعال محركات الانفصال بعد: 3... 2... 1.»',

          en: '"Activating ballistic escape protocol. Firing separation thrusters in: 3... 2... 1."' },

      ],

    },

    /* انفصال الكبسولة — يبدأ بعد انتهاء cutscene-separation */

    separation: {

      lines: [

        { who: 'zain',

          ar: '«طااارق!! طارق رد عليا!! سهيل... رجعني ليه!»',

          en: '"Tariq!! Tariq, answer me!! Sohail... get me back to him!"' },

        { who: 'sohail',

          ar: '«انقطع الاتصال المباشر. كبسولتك الآن في مسار عبور باليستي إجباري نحو المريخ بسرعة 38,000 كم/ساعة. لا يوجد وقود للعودة.»',

          en: '"Direct link severed. Your capsule is now on an irreversible ballistic trajectory to Mars at 38,000 km/h. Insufficient fuel to reverse course."' },

      ],

    },

    /* حوار الوداع — بالغرفة الثانية بعد الاصطدام (room-corridor-damaged)، طارق على اليسار */

    farewell: {

      lines: [

        { who: 'zain',

          ar: '«طارق! اخرج من عندك وتعالى هنا في كبسولتي بسرعة! الكبسولة فيها أكسجين ومحرك مستقل، هتكفينا إحنا الاتنين!»',

          en: "\"Tariq! Get out of there and jump into my capsule! It has life support and independent thrusters, it can hold both of us!\"" },

        { who: 'tariq',

          ar: '«مينفعش يا زين! معادلة الكتلة لا ترحم. وقود كبسولتك محسوب بالجرام لوزن شخص واحد بس عشان تقدر تفلت من جاذبية القمر وتكمل للمريخ. لو دخلت معاك، الوزن هيزيد والكبسولة مش هتقدر تهرب، وهنسقط ونموت إحنا الاتنين!»',

          en: "\"The physics won't allow it, Zain! The mass equation is absolute. Your capsule's propellant is calibrated for a single person to escape lunar gravity and reach Mars. If I step inside, the excess weight will drag us down, and we will both crash!\"" },

        { who: 'zain',

          ar: '«مش هسيبك تموت هنا! اخرج يا طارق، هنلاقي حل تاني سوا!»',

          en: "\"I'm not leaving you to die! Step through the hatch, we will find another way together!\"" },

        { who: 'tariq',

          ar: '«إنت أمل المهمة دي يا زين... وأنا مهندس المركبة دي، هعرف أهبط بيها اضطراري على القمر وهصلحها وهجيلك. افتكر وعدنا دايماً: إلى النجوم معاً!»',

          en: "\"You are the future of this mission, Zain... I built this ship, I can guide her through an emergency landing on the Moon, repair her, and come for you. Remember our promise: To the stars, together!\"" },

      ],

    },

    /* بدء الفصل الأول — استيقاظ طارق فوق cutscene-wake: سُهيل يتحدث حسب لغة اللعبة */

    sohailWake: {

      lines: [

        { who: 'sohail',

          ar: '«طارق... أجبني يا طارق. أجهزة الاستشعار ترصد استقرار النبض. استعدت الوعي بعد 14 دقيقة من الارتطام.»',

          en: '"Tariq... answer me, Tariq. Biometrics confirm pulse stabilization. Consciousness regained 14 minutes post-impact."' },

      ],

    },

 /* أول حوار بعد الخروج إلى سطح القمر (خلفية room-moon-surface) — المشهد 1 */

    tariqCheck: {

      lines: [

        { who: 'sohail',

          ar: '«ضغط المقصورة تعادل مع فراغ القمر. هبوط اضطراري عنيف يا طارق، لكن البدلة سليمة. المشكلة الحالية: صمام أكسجين البدلة مقفول تلقائياً من صدمة الارتطام.»',

          en: '"Cabin pressure equalized with the lunar vacuum. Rough crash landing, Tariq, but your suit is intact. Current hazard: the suit oxygen valve locked automatically upon impact."' },

      ],

    },

 /* بعد إصلاح صمام الأكسجين في الهولوجرام — المشهد 1 */

    oxyDone: {

      lines: [

        { who: 'sohail',

          ar: '«ممتاز! تدفق الأكسجين استقر عند 101 كيلوباسكال، وتنفسك طبيعي 100%.»',

          en: '"Excellent! Oxygen flow stabilized at 101 kPa, breathing nominal at 100%."' },

      ],

    },

 /* نقطة لمعان على الأرض — لوحة الذكريات (المشهد 1) */

    plaque: {

      lines: [

        { who: 'tariq',

          ar: '«لوحة الذكريات اللي زين علقها... طارت من الكابينة واستقرت هنا: \"طارق وزين — إلى النجوم معاً\". مش هسيبك لوحدك يا زين.»',

          en: '"The memory plaque Zain mounted... thrown from the cabin and settled here: \'Tariq & Zain — To the stars, together\'. I won\'t leave you alone, Zain."' },

        { who: 'narrator', card: 'plaque', ar: '', en: '' },

        { who: 'sohail',

          ar: '«أمامنا شرقاً يمتد منخفض بحر الهدوء، حيث بدأت أول خطوة بشرية على القمر في مهمة أبولو 11.»',

          en: '"Ahead to the east lies the Sea of Tranquility, where humanity took its first steps on the Moon during Apollo 11."' },

      ],

    },



 /* ============ الاسكربت المطور — 7 مشاهد متصلة ============ */



    /* آثار الأقدام — المشهد 2 (المهمة 3) */

    footprints: {

      lines: [

        { who: 'tariq',

          ar: '«سهيل! بص في الأرض... في آثار خطوات جزم فضاء منتظمة هنا!»',

          en: '"Sohail! Look at the ground... clear astronaut bootprints stamped here!"' },

        { who: 'sohail',

          ar: '«خطوات نيل أرمسترونج وباز ألدرين، 20 يوليو 1969. مفيش ريح ولا مطر على القمر، وعشان كده الآثار دي هتعيش ملايين السنين من غير ما تتغير.»',

          en: '"Neil Armstrong and Buzz Aldrin\'s bootprints, July 20, 1969. With no wind or rain on the Moon, these tracks will survive millions of years untouched."' },

      ],

    },



    /* العلم الأبيض — المشهد 2 (المهمة 4) */

    flag: {

      lines: [

        { who: 'tariq',

          ar: '«العلم ده أبيض ناصع تماماً... ملوش أي لون!»',

          en: '"This flag is pure white... not a single color left!"' },

        { who: 'sohail',

          ar: '«أشعة الشمس فوق البنفسجية على مدار 50 سنة مسحت الصبغات العضوية بالكامل. الفضاء حوله لراية سلام بتمثل كل أهل الأرض.»',

          en: '"50 years of intense solar ultraviolet radiation bleached every organic dye away. Space turned it into a universal banner of peace for all humankind."' },

      ],

    },



    /* محطة الزلازل PSEP — المشهد 3 (المهمة 5): فحص + اكتشاف وحدات RHU */

    psepIntro: {

      lines: [

        { who: 'tariq',

          ar: '«صندوق أبيض مضلع ومحاط بشرائح ذهبية بتلمع... ده جهاز إيه يا سهيل؟»',

          en: '"A white faceted box wrapped in gleaming gold foil... What device is this, Sohail?"' },

        { who: 'sohail',

          ar: '«جهاز الزلازل السلبي (PSEP) لأبولو 11. سجل أول نبضات زلزالية في باطن القمر واصطدامات النيازك.»',

          en: '"Apollo 11\'s Passive Seismic Experiment Package (PSEP). It recorded the Moon\'s first internal quakes and meteorite impacts."' },

        { who: 'tariq',

          ar: '«والشرائح اللي بتلمع دي؟»',

          en: '"And this shimmering foil?"' },

        { who: 'sohail',

          ar: '«عوازل المايلر (Aluminized Mylar) لعكس حرارة الشمس. وبداخله كبسولتان من وحدات التدفئة بالنظائر المشعة (RHU) بالبلوتونيوم-238، تولد 15 واط حراري مستمر بالتحلل الطبيعي منذ 1969 لحماية الأجهزة من التجمد.»',

          en: '"Aluminized Mylar multi-layer insulation reflecting solar heat. Inside lie two Plutonium-238 Radioisotope Heater Units (RHUs), passively generating 15 watts of continuous heat since 1969 to prevent freezing."' },

        { who: 'narrator', card: 'psep', ar: '', en: '' },

        { who: 'tariq',

          ar: '«دفء نووي شغال بقاله نصف قرن... دي معلومة لازم أفتكرها كويس لو احتجنا حرارة في الصقيع ده.»',

          en: '"Nuclear warmth running for half a century... I must remember this heat source if we ever need warmth in this cold."' },

      ],

    },



    /* بعد نجاح إذابة الصقيع — حلقة العودة (المهمة 10) */

    rhuDone: {

      lines: [

        { who: 'sohail',

          ar: '«تمت إذابة الصقيع بنجاح! بطارية الليزر تعمل بكامل كفاءتها. الآن تقدم شرقاً إلى عاكس الليزر LRRR!»',

          en: '"Defrost successful! The laser battery is at 100% efficiency. Now proceed east to the LRRR reflector!"' },

      ],

    },



    /* مسارات العجلات — المشهد 5 (المهمة 8): ممر جبال أبولو */

    tracks: {

      lines: [

        { who: 'tariq',

          ar: '«يا على الجبال... ضخمة وشاهقة بشكل مهيب! وبص في الأرض يا سهيل: دي مش خطوات بني آدمين، دي خطوط مسارات عجلات سيارة!»',

          en: '"What immense mountains... towering and majestic! And look at the ground, Sohail: those aren\'t footprints, they are vehicle tire tracks!"' },

        { who: 'sohail',

          ar: '«نحن في ممر جبال أبولو. هذه مسارات عجلات صنعتها مركبة تجوال بشرية قطعت هذا الوادي الصامت.»',

          en: '"We have entered the Apollo Mountains pass. These tracks were carved by a crewed rover that traversed this silent valley."' },

        { who: 'tariq',

          ar: '«مسار العجلات مكمل لقدام شرقاً... أكيد في مركبة مستقرة في نهاية المنحدر!»',

          en: '"The tire tracks continue straight ahead to the east... A rover must be parked at the end of this slope!"' },

      ],

    },



    /* عاكس الليزر LRRR — المشهد 4 (المهمة 6): فحص العاكس */

    lrrrIntro: {

      lines: [

        { who: 'tariq',

          ar: '«صندوق صغير مائل فيه 100 مراية مكعبة من زجاج الكوارتز... عاكس الليزر LRRR!»',

          en: '"A small tilted tray holding 100 quartz corner-cubes... the LRRR Laser Reflector!"' },

        { who: 'sohail',

          ar: '«جهاز سلبي نقي بدون أسلاك أو بطاريات. يعكس أي شعاع ليزر يضربه بزاوية 180° إلى مصدره مباشرة. وهو الجهاز الوحيد من أبولو 11 الذي لا يزال يعمل وينتج علماً حتى اليوم لقياس مسافة القمر.»',

          en: '"A purely passive instrument with zero wires or batteries. It reflects any incoming laser at 180\u00b0 directly back to its source. The only Apollo 11 experiment still active today, measuring lunar distance."' },

      ],

    },



    /* فشل معايرة الليزر — المشهد 4 (المهمة 7): البطارية متجمدة عند -120°م */

    laserFail: {

      lines: [

        { who: 'narrator',

          ar: 'فشل إطلاق الليزر: بطارية مجس الليزر متجمدة عند -120°م! تتطلب مصدراً حرارياً لإذابة الصقيع.',

          en: 'Laser ignition failed: sensor battery frozen at -120\u00b0C! A thermal source is required to defrost it.' },

        { who: 'tariq',

          ar: '«البطارية متجمدة تماماً! الليزر مش هيشتغل عشان يعاير الملاحة غير لما نلاقي طريقة نسخنه بيها بأمان.»',

          en: '"The battery is frozen solid! The laser won\'t calibrate our navigation unless we find a safe way to warm it up."' },

        { who: 'sohail',

          ar: '«دعنا نواصل الاستكشاف شرقاً أولاً لتقييم باقي المنظومة.»',

          en: '"Let us continue scouting eastward first to assess the rest of the operational sector."' },

      ],

    },



    /* بعد نجاح معايرة الليزر — حلقة العودة (المهمة 11) */

    lrrrDone: {

      lines: [

        { who: 'sohail',

          ar: '«النبضة المنعكسة قفلت إحداثيات موقعنا بنجاح! حاسوب الملاحة جاهز 100%. تقدم الإصلاح: 60%! الآن عُد إلى طبق عربة القمر LRV لإرسال النداء النهائي!»',

          en: '"The reflected pulse locked our coordinates! Navigation computer 100% ready. Repair progress: 60%! Now return to the LRV antenna dish to transmit the final call!"' },

        { who: 'narrator', card: 'lrrr', ar: '', en: '' },

      ],

    },



    /* فحص عربة أبولو الجوالة — المشهد 6 (المهمة 9) */

    roverInspect: {

      lines: [

        { who: 'tariq',

          ar: '«عربة أبولو الجوالة (LRV)... أول سيارة قادها بشر على جرم غير الأرض في بعثات أبولو 15 و16 و17.»',

          en: '"The Apollo Lunar Roving Vehicle (LRV)... the first vehicle driven by humans on another celestial body (Apollo 15, 16, and 17)."' },

      ],

    },



    /* عجلات الشبك الفولاذي — المشهد 6 (المكوّن 1) */

    wheels: {

      lines: [

        { who: 'tariq',

          ar: '«العجلات مش مطاط... دي شبكة أسلاك فولاذ وزنك مع شرائح تيتانيوم!»',

          en: '"These wheels aren\'t rubber... they\'re a woven steel-zinc wire mesh with titanium treads!"' },

        { who: 'sohail',

          ar: '«صحيح، لأن المطاط كان سيتصلب ويتكسر كالزجاج في صقيع الليل القمري (-170°) أو ينفجر تحت حرارة النهار (+120°).»',

          en: '"Indeed, because rubber would shatter like glass in the -170\u00b0C lunar night or burst under +120\u00b0C daytime heat."' },

      ],

    },



    /* الكاميرا الشاخصة للسماء — المشهد 6 (المكوّن 2) */

    camera: {

      lines: [

        { who: 'tariq',

          ar: '«الكاميرا دي باصة للسماء ونجوم الفضاء فوق ليه؟»',

          en: '"Why is this camera pointed straight up at the stars?"' },

        { who: 'sohail',

          ar: '«كاميرا أبولو 17، وجهها المهندس إد فيندل من هيوستن لتصوير إقلاع آخر بشر غادروا القمر في 1972، وظلت تنظر للأعلى في انتظار عودتنا.»',

          en: '"Apollo 17\'s camera, tilted remotely by engineer Ed Fendell from Houston to film the last human lunar liftoff in 1972, left looking up awaiting our return."' },

        { who: 'narrator', card: 'camera', ar: '', en: '' },

      ],

    },



    /* طبق الهوائي — المشهد 6 (المكوّن 3): اكتشاف حلقة العودة الذكية */

    dishDiscovery: {

      lines: [

        { who: 'tariq',

          ar: '«وطبق الهوائي عالي الكسب ده؟ شكله المقعر بؤرة تركيز مثالية! لو حطينا مرسل بدلتنا في البؤرة، إشارة الاستغاثة هتتضاعف 12 مرة وتستدعي مركبة العبور المدارية!»',

          en: '"And this High-Gain antenna dish? Its concave shape is a perfect focal point! If we place our suit transmitter at the focus, the distress signal will be amplified twelvefold and summon the orbital transit craft!"' },

        { who: 'sohail',

          ar: '«لكن حاسوب الإسناد المداري لن يطلق مركبة العبور إلا بعد إرسال إحداثيات الملاحة المؤكدة من عاكس الليزر LRRR أولاً!»',

          en: '"But the orbital support computer will not dispatch the transit craft until it receives confirmed navigation coordinates from the LRRR reflector first!"' },

        { who: 'tariq',

          ar: '«وعاكس الليزر LRRR كان الليزر بتاعه متجمد... استنى يا سهيل! جهاز الزلازل PSEP كان فيه كبسولات التدفئة النووية بالبلوتونيوم (RHU) بتطلع 15 واط حراري مستمر!»',

          en: '"And the LRRR\'s laser battery was frozen... wait, Sohail! The PSEP station had Plutonium RHU heater capsules generating 15 watts of continuous heat!"' },

        { who: 'sohail',

          ar: '«صحيح يا طارق! يمكننا العودة إلى محطة الزلازل واستخدام حرارة RHU لإذابة صقيع بطارية الليزر بأمان، ثم تشغيله على عاكس LRRR!»',

          en: '"Correct, Tariq! We can return to the seismometer station and use the RHU heat to safely defrost the laser battery, then fire it at the LRRR reflector!"' },

      ],

    },



    /* طبق الهوائي — البث النهائي (المهمة 12): يُفتح بعد قفل إحداثيات LRRR */

    antenna: {

      lines: [

        { who: 'sohail',

          ar: '«الآن وقد قفلنا إحداثياتنا عبر عاكس LRRR... ضع مرسل البدلة في بؤرة الطبق بالظبط وثبّته عند أقصى إشارة — لبث نداء الاستغاثة المركز!»',

          en: '"Now that our coordinates are locked via the LRRR... place the suit transmitter exactly at the dish focus and lock at peak signal — to broadcast the focused distress call!"' },

      ],

    },



    /* بعد نجاح بث النداء (المهمة 12) — مركبة العبور تهبط في منصة الإطلاق الشرقية */

    antennaDone: {

      lines: [

        { who: 'sohail',

          ar: '«تم تضخيم الإشارة بمقدار 12 ضعفاً! نداء الاستغاثة المرفق بإحداثيات LRRR استدعى مركبة العبور المدارية بنجاح! مركبة الإسناد تبدأ الهبوط الآن في منصة الإطلاق الشرقية!»',

          en: '"Signal amplified twelvefold! The distress beacon encoded with LRRR telemetry successfully summoned the orbital transit craft! The transit vehicle is touching down at the eastern launchpad!"' },

        { who: 'narrator', card: 'lrv', ar: '', en: '' },

        { who: 'tariq',

          ar: '«الأجهزة القديمة دي مكنتش خردة ميتة في الرملة يا سهيل... دي كانت منارات بنوها الرواد القدامى عشان ينقذونا بعد 50 سنة. استنني يا زين... أنا في طريقي للمريخ!»',

          en: '"These old machines were never dead scrap in the dust, Sohail... They were lighthouses the pioneers built to save us half a century later. Hold on, Zain... I\'m on my way to Mars!"' },

      ],

    },



    /* =====================================================

 المشهد 7 — منصة الإطلاق والانتقال للمريخ 

 حوارات منقولة حرفياً من الاسكربت المطور (7 خلفيات متصلة)

 ===================================================== */



    /* الصعود والإقلاع — المشهد 7 (المهمة 13): داخل مركبة العبور */

    boardCheck: {

      lines: [

        { who: 'sohail',

          ar: '«الملاحة مضبوطة ببيانات عاكس أبولو، وخزانات الوقود كافية لرحلة عبور مدتها 8 أشهر إلى المريخ. جاهزون للإقلاع يا طارق.»',

          en: '"Navigation calibrated via the Apollo reflector data, and the fuel tanks are loaded for an 8-month transit to Mars. Ready for ascent, Tariq."' },

        { who: 'tariq',

          ar: '«شكراً لكل مهندس ورائد فضاء ساب حتة من روحه وعلمه هنا في السكون ده... لولاكم مكنتش هتحرك شبر. استنني يا زين... أنا في طريقي للمريخ. مش هسيبك هناك لوحدك أبداً.»',

          en: '"Thank you to every engineer and astronaut who left their spirit and science here in this quiet void... Without you, I wouldn\'t have moved an inch. Wait for me, Zain... I\'m on my way to Mars. I will never leave you alone."' },

      ],

    },



    /* =====================================================

 الفصل الثاني — حديقة التراث الفضائي (مسار زين)

 الحوارات منقولة حرفياً من الاسكربت الجديد:

 docs/Mars_Script_Option2_Memorial_Garden.md 

 ===================================================== */



    /* المشهد 1 — داخل المأوى: نهاية العاصفة والقرار */

    habitatIntro: {

      lines: [

        { who: 'zain',

          ar: '«سهيل... بص من الشباك! العاصفة اللي كانت حابسانا 8 شهور هديت أخيراً... أول مرة أشوف سماء المريخ صافية والنجوم باينة كده من يوم ما هبطت!»',

          en:'"Sohail... look out the window! The storm that trapped us for eight months has finally cleared... It\'s the first time I\'ve seen the Martian sky so clear and full of stars since I landed!"' },

        { who: 'sohail',

          ar: '«أؤكد هدوء الرياح السطحية بنسبة 98%. الشحنات الساكنة تلاشت بالكامل. اليوم هو اليوم 240 من بداية عزلتنا. حسابات الملاحة المدارية تشير إلى أن نافذة عبور مركبة طارق من مدار القمر أوشكت على الانتهاء.»',

          en:'"Surface winds dropped by 98%. Electrostatic interference has completely cleared. Today marks Day 240 of our mission. Telemetry indicates Tariq\'s transit window from lunar orbit is approaching its climax."' },

        { who: 'zain',

          ar: '«طارق جاي في الطريق... بس إشارات الهبوط في الوادي هنا محتاجة منارة أرضية عالية عشان توجهه لسطح منبسط. أنا هاخد منارة الليزر وأطلع للسهل الصخري برة.»',

          en: '"Tariq is on his way... but terrain descent into this valley requires a high surface beacon to guide him to flat ground. I will take the laser beacon out onto the rocky plain."' },

      ],

    },



    /* المهمة 1 — التقاط منارة الاستقبال من طاولة المعدات */

    beaconPickup: {

      lines: [

        { who: 'sohail',

          ar: '«منارة الاستقبال الليزرية أصبحت في حوزتك يا زين. البطارية ممتلئة والشعاع جاهز للإطلاق. بوابة العزل إلى الشرق أصبحت مفتوحة أمامك الآن.»',

          en: '"The laser guidance beacon is now in your possession, Zain. Battery fully charged, beam ready to fire. The airlock to the east is now released for you."' },

      ],

    },



    /* المشهد 2 — المحطة الأولى: سوجورنر (شجاعة البدايات) */

    sojournerDlg: {

      lines: [

        { who: 'zain',

          ar: '«سوجورنر (Sojourner)... أول مسبار متجول مشي على كوكب المريخ سنة 1997! حجمه صغير أوي يا سهيل... مكنش أكبر من شنطة مدرسة (11.5 كجم بس)!»',

          en:'"Sojourner... the very first mobile rover to roll on Mars back in 1997! It\'s so tiny, Sohail... no bigger than a school backpack (just 11.5 kg)!"' },

        { who: 'sohail',

          ar: '«صحيح. صممته ناسا كنموذج إثبات تجريبي ضمن مهمة Mars Pathfinder. قطع مسافة 100 متر فقط حول منصة الهبوط، لكنه أثبت للبشرية أن الحركة بعجلات مستقلة على كوكب آخر ممكنة هندسياً.»',

          en: '"Correct. NASA engineered it as a technology demonstration for Mars Pathfinder. It drove only 100 meters around its lander, yet it proved to humanity that independent wheeled exploration on another world was possible."' },

        { who: 'zain',

          ar: '«كنت بحجم لعبة أطفال يا سوجورنر... بس شجاعتك هي اللي فتحت باب الكوكب ده كله للي جم بعدك. طارق كان دايماً يقولي: «أصعب خطوة في الدنيا هي الخطوة الأولى يا زين، لو أخدتها بقلب جامد، الطريق كله هيتفتح قدامك».»',

          en:'"You were the size of a toy, Sojourner... yet your courage unlocked this entire planet for everyone who followed. Tariq always told me: \'The hardest step is the first one, Zain; take it bravely, and the whole universe opens up before you\'."' },

        { who: 'sohail',

          ar: '«سوجورنر علمنا شجاعة البدايات. تابع السير شرقاً يا زين، هناك معلم تاريخي آخر بانتظارنا.»',

          en: '"Sojourner taught us the bravery of beginnings. Continue walking east, Zain; another historic landmark awaits."' },

      ],

    },



    /* المشهد 3 — المحطة الثانية: إنسايت (نبض الكوكب) */

    insightDlg: {

      lines: [

        { who: 'zain',

          ar: '«مسبار إنسايت (InSight)... وصل هنا في 2018. مكنش عنده عجلات يمشي بيها زي سوجورنر، بس كان عنده ودان حساسة أوي تسمع أعماق الكوكب!»',

          en:'"The InSight lander... arrived here in 2018. It had no wheels to roam like Sojourner, but it possessed ultra-sensitive ears listening to the planet\'s deep core!"' },

        { who: 'sohail',

          ar: '«نعم. حمل مقياس الزلازل الفائق (SEIS) واستقر في مكانه بهدوء. رصد أكثر من 1,300 هزة مريخية (Marsquakes)، وسجل اصطدامات النيازك، وكشف لأول مرة في تاريخ العلم أن لب المريخ معدني وسائل.»',

          en: '"Indeed. Carrying the ultra-sensitive SEIS seismometer, it sat in quiet stillness. It recorded over 1,300 marsquakes and meteorite strikes, unveiling for the first time in scientific history that Mars possesses a liquid metallic core."' },

        { who: 'zain',

          ar: '«وظل يسمع نبض المريخ لحد ما الغبار غطى ألواحه الشمسية بالكامل في ديسمبر 2022... فاكر كلماته الأخيرة يا سهيل؟»',

          en: '"And it listened to the heartbeat of Mars until dust blanketed its solar arrays in December 2022... Do you recall its final message, Sohail?"' },

        { who: 'sohail',

          ar: '«وثقت سجلات ناسا رسالته الوداعية: «طاقتي منخفضة للغاية... لا تقلقوا بشأني: كان وقتي هنا هادئاً ومثمراً. سأغلق أجهزتي قريباً، شكراً لبقائكم معي».»',

          en:'"NASA archives documented its serene farewell: \'My power\'s really low... Don\'t worry about me though: my time here has been both serene and productive. Thanks for staying with me.\'"' },

        { who: 'zain',

          ar: '«كان وقته هادئاً ومثمراً... إنسايت علمني السكينة يا سهيل. علمني إن الصمت والانتظار مش عذاب، بل تأمل وخدمة ورضا بالواجب. شكراً لأنك علمتني الصبر في شهور عزلتي.»',

          en: "'Serene and productive'... InSight taught me peace, Sohail. It taught me that stillness and waiting are not suffering, but contemplation, duty, and quiet grace. Thank you for teaching me patience during my months alone." },

        { who: 'sohail',

          ar: '«الآن إلى نهاية التل الصخري شرقاً يا زين... إلى رفيق الصمود الأعظم: أوبورتيونيتي!»',

          en: '"Now, to the summit of the rocky ridge to the east, Zain... to the ultimate emblem of endurance: Opportunity!"' },

      ],

    },



    /* المشهد 4 — المحطة الثالثة: أوبورتيونيتي (المثابرة) */

    oppyDlg: {

      lines: [

        { who: 'zain',

          ar: '«أوبي... أوبورتيونيتي العظيم. هبطت هنا في 2004 عشان تعيش 90 يوم بس... وفضلت تقاتل وتستكشف وتلف في الرملة لـ 15 سنة كاملة (قطع 45 كم)!»',

          en: '"Oppy... the legendary Opportunity. You landed here in 2004 designed for just 90 days... yet you fought, explored, and roamed this dust for 15 full years, driving over 45 kilometers!"' },

        { who: 'sohail',

          ar: '«حتى باغتته العاصفة الكبرى في يونيو 2018 هنا في وادي المثابرة. استنفد آخر قطرة كهرباء لتدفئة قلبه، وودعنا بعبارته الشهيرة: «بطاريتي منخفضة، والظلام يحل من حولي».»',

          en:'"Until the global storm trapped it in June 2018 right here in Perseverance Valley. It spent its final milliwatts keeping its core warm, sending its historic words: \'My battery is low and it is getting dark\'."' },

        { who: 'zain',

          ar: '«سوجورنر علمني شجاعة البداية... وإنسايت علمني الرضا والصبر... وإنت يا أوبي علمتني المثابرة وإننا منستسلمش لحد آخر نفس في صدورنا. وعشان إنت حارس الوادي ده، منارتنا هتشتغل من فوقيك إنت!»',

          en: '"Sojourner taught me the courage to begin... InSight taught me peace and patience... and you, Oppy, taught me perseverance—to never yield until our very last breath. And because you are the guardian of this valley, our guidance beacon shall ignite right from you!"' },

      ],

    },



    /* تركيب المنارة فوق صارية أوبي — انطلاق الشعاع الأزرق */

    beaconFire: {

      lines: [

        { who: 'sohail',

          ar: '«انطلقت إشارة المنارة بكامل طاقتها! رصد بصمة دفع صاروخي قادمة من المدار! مركبة طارق تلتقط إشارة أوبي وتبدأ مناورة الهبوط النهائي فوق فوهتنا الآن!»',

          en:'"Guidance beacon firing at maximum output! Orbital propulsion signature detected! Tariq\'s descent module locks onto Oppy\'s signal, initiating final landing thrusters directly above our crater!"' },

      ],

    },



    /* المشهد 5 — اللقاء الكبير: الحوار الختامي بين الأخوين */

    reunionTalk: {

      lines: [

        { who: 'zain',

          ar: '«اتأخرت 8 شهور يا باشمهندس... مش كنا متفقين نتقابل في المعاد؟»',

          en:'"You\'re eight months late, chief... Didn\'t we agree to meet on time?"' },

        { who: 'tariq',

          ar: '«المسافة كانت 225 مليون كيلومتر يا زين... عايرت كل مليمتر في الطريق عشان متأخرش ثانية واحدة زيادة. حمد الله على سلامتك يا أخويا.»',

          en:'"The road was 225 million kilometers long, Zain... I calibrated every millimeter so I wouldn\'t lose a single extra second. It is good to see you alive, brother."' },

        { who: 'zain',

          ar: '«عارف يا طارق؟ لولا أوبي اللي قاعد حارس الفوهة دي في الرملة، ولولا سوجورنر وإنسايت اللي آنسوا وحشتي في شهور الصمت، ولولا عاكس أبولو اللي دلك على مكانك على القمر... كنا هنبقى تائهين للأبد.»',

          en:'"Do you know, Tariq? If it weren\'t for Oppy standing vigil on this ridge, and Sojourner and InSight comforting my solitude through the silent months, and Apollo\'s laser mirrors that guided you on the Moon... we would have been lost forever."' },

        { who: 'tariq',

          ar: '«هما مش قطع حديد ميتة سابوها في الفضاء ونسيوها يا زين... كل مسبار، كل عاكس، كل عربة، كانت بذرة شجاعة زرعها إنسان عشان ينور طريق للي هييجي بعده.»',

          en: '"They were never dead scrap discarded in the dust, Zain... Every rover, every reflector, every lens was a seed of courage planted by humanity to illuminate the path for those who followed."' },

        { who: 'zain',

          ar: '«تركناهم هنا في البرد والوحشة... بس هما اللي جمعونا من جديد.»',

          en: '"We left them here in the freezing dark... yet they are the ones who brought us back together."' },

      ],

    },



    /* =======================================================

 — خلف الكواليس: حوارات فريق NileStro الأربعة

 (النص الحرفي من اسكربت الفريق — عربي/إنجليزي)

 ======================================================= */



    /* المكتب 1 — محطة القيادة والبيوتكنولوجي: ملك قطب */

    credMalak: {

      lines: [

        { who: 'mohamed',

          ar: '«أهلاً يا ملك! خلصنا الرحلة ووصلنا طارق وزين للمريخ بسلام.»',

          en: '"Hey Malak! We completed the journey and reunited Tariq and Zain safely on Mars."' },

        { who: 'malak',

          ar: '«عاش يا شباب! أهلاً بيكم في مقر NileStro. أنا ملك قطب، باحثة في التكنولوجيا الحيوية وقائدة الفريق. دوري كان إدارة وتنسيق جهود الفريق وتوزيع المهام، وتحليل البيانات العلمية، ومونتاج الفيديو التقديمي. ولأن هدفي تقريب العلوم للأجيال الجديدة، صممت كتاب كوميكس تفاعلي للأطفال يربطهم بأبطال الفضاء!»',

          en: '"Brilliant job, team! Welcome to NileStro headquarters. I\'m Malak Kotp, Biotechnologist and Team Leader. My role was orchestrating team operations, analyzing scientific data, editing our presentation video, and designing an interactive children\'s comic book to make space heritage irresistible to young minds!"' },

        { who: 'mohamed',

          ar: '«من غير تنظيمك ومتابعتك للمواعيد، مكنش المشروع هيطلع بالنظام ده.»',

          en: '"Without your leadership and sharp deadlines, this project wouldn\'t have been this solid."' },

        { who: 'malak',

          ar: '«فريقنا بيكمل بعضه! ادخل المكتب اللي بعدي، رانيا مجهزة كل أسرار الأبحاث الفضائية.»',

          en: '"Teamwork makes the dream work! Head to the next office, Ranya has all the deep space research ready."' },

      ],

    },



    /* المكتب 2 — معمل أبحاث البيانات وكتب الفضاء: رانيا إبراهيم */

    credRanya: {

      lines: [

        { who: 'mohamed',

          ar: '«رانيا! لسه غرقانة في المراجع والمعادلات؟»',

          en: '"Ranya! Still buried under astrophysics references and equations?"' },

        { who: 'ranya',

          ar: '«الفضاء مبيخلصش يا محمد! أنا رانيا إبراهيم، طالبة بالصف الثالث الثانوي - شعبة علمي رياضة. شغفي كان توثيق كل حرف علمي في اللعبة من مصادر ناسا الأصلية بنسبة 100%، وبناء حوارات القصة وسيناريو الأجهزة، وصياغة كتيب تعليمي متكامل (Educational PDF) يبسط أسرار الآلات التاريخية للمتعلمين الكبار والطلاب!»',

          en: '"Space is endless, Mohamed! I\'m Ranya Ibrahem, a 12th-grade mathematics student. My passion was rigorously verifying every scientific fact directly from NASA\'s official archives, developing the narrative dialogue, and authoring an educational PDF companion that demystifies historical space equipment for learners and educators!"' },

        { who: 'mohamed',

          ar: '«مفيش جهاز في اللعبة اتذكر وظيفته إلا وكان وراه بحثك وتدقيقك للأرقام والتاريخ.»',

          en: '"Every single instrument functioning in this game owes its scientific authenticity to your relentless research."' },

        { who: 'ranya',

          ar: '«عشان المحكمين يعرفوا إن شباب مصر بيبحثوا بجد! كمل طريقك لمازن، مهندس الفضاء مستنيك هناك!»',

          en: '"So NASA judges know Egyptian youth research with real rigor! Keep going to Mazen; our space systems engineer is waiting!"' },

      ],

    },



    /* المكتب 3 — مركز الملاحة وتكنولوجيا الفضاء: مازن أشرف */

    credMazen: {

      lines: [

        { who: 'mohamed',

          ar: '«باشمهندس مازن! البدلة الشيك دي احتفالاً بوصول المركبة للمريخ؟»',

          en: '"Engineer Mazen! Suited up in style to celebrate our successful Mars landing?"' },

        { who: 'mazen',

          ar: '«أكيد، المناسبة تستاهل! أنا مازن أشرف، خريج علوم الملاحة وتكنولوجيا الفضاء، ومهندس نظم، ومصمم سرد بصري. دوري كان وضع الأساس العلمي لمسار الرحلة المداري، وأبحاث بعثات القمر والمريخ، وهندسة التفكير النظمي (Systems Thinking) لربط القصة بالفيزياء، والمساهمة في الهوية البصرية وتصميم السرد الإبداعي للعبة!»',

          en: '"Of course, this milestone deserves it! I\'m Mazen Ashraf, Navigation Science and Space Technology graduate, Systems Engineer, and Narrative Designer. My role was architecting the orbital mechanics of our journey, leading mission research, applying systems thinking to fuse storytelling with real physics, and crafting the creative narrative structure of the game!"' },

        { who: 'mohamed',

          ar: '«المقلاع الجاذبي ومسارات الهروب الباليستية كانت أفكارك اللي خلت القصة واقعية 100% قدام ناسا.»',

          en: '"The gravity assist maneuvers and ballistic trajectories were your engineering architecture that made our story 100% credible to NASA."' },

        { who: 'mazen',

          ar: '«بس كل المعادلات دي كانت هتفضل على الورق لولا العبقري الصغير اللي برمج العالم ده كله... روح لمكتبك يا بطل، ده وقتك!»',

          en: '"Yet all those equations would have remained on paper without the young genius who coded this entire universe... Step into your office, champ, it\'s your turn!"' },

      ],

    },



    /* المكتب 4 — استوديو التطوير والصوتيات: محمد أشرف يتحدث للكاميرا */

    credMohamed: {

      lines: [

        { who: 'mohamed',

          ar: '«أهلاً بيكم! أنا محمد أشرف، عندي 17 سنة، وطالب بالصف الثالث الثانوي المصري.»',

          en: '"Welcome! I am Mohamed Ashraf, 17 years old, and a high school senior from Egypt."' },

        { who: 'mohamed',

          ar: '«أنا مبرمج الويب اللي بنيت اللعبة دي من الصفر باستخدام HTML5 وJavaScript وCSS. قمت ببرمجة محرك الحركة، وتصميم ورسم الأصول الفنية والبكسل آرت (Pixel Art)، وتأليف وتنسيق المؤثرات الصوتية والموسيقى التصويرية، وإدارة البنية التقنية بالكامل ورفع المشروع.»',

          en: '"I am the web developer who built this game from scratch using HTML5, JavaScript, and CSS. I programmed the gameplay engine, created and directed the pixel-art visual assets, designed the sound effects and atmospheric audio, and managed the full technical deployment."' },

        { who: 'mohamed',

          ar: '«الفضاء بالنسبة لي مكنش مجرد مسابقة، كان حلم إني أثبت إن شغف البرمجة في سن 17 سنة يقدر يحول تقارير ناسا المعقدة للعبة تفاعلية عالمية تحيي ذكرى الآلات اللي علمتنا الشجاعة.»',

          en: '"To me, space was never just a hackathon topic; it was a dream to prove that a 17-year-old\'s passion for coding can transform dry NASA archives into a global interactive experience that honors the machines that taught humanity courage."' },

        { who: 'mohamed',

          ar: '«شكراً لكل واحد لعب لعبتنا وشاركنا الرحلة...»',

          en: '"Thank you to everyone who played our game and shared this voyage..."' },

        { who: 'mohamed',

          ar: '«من فريق NileStro: متروكون في الفضاء... لكنهم لن يُنسوا أبداً!»',

          en: '"From Team NileStro: Abandoned in space... but Never Forgotten!"' },

      ],

    },

  };



  /* ---------------------------------------------------------

     الخاتمة — النص الأبيض على الأسود + لافتة الفصل الأول

     --------------------------------------------------------- */

  const EPILOGUE_TEXT = {

    ar: 'بين الأرض والقمر والمريخ... مئات الآلات الصامتة التي أرسلها البشر عبر العقود.\nواليوم، حياة أخوين أصبحت معلقة على ما تبقى من تلك الآلات.',

    en: 'Between Earth, the Moon, and Mars... hundreds of silent machines left behind across decades.\nToday, the lives of two brothers depend entirely on what remains of those machines.',

  };



  const CHAPTER_TITLE = {

    ar: 'الفصل الأول: ما تركوه خلفهم.',

    en: 'Chapter One: What They Left Behind.',

  };



  /* ---------------------------------------------------------

     الفصل الأول — سطح القمر (بعد لافتة الفصل)

     نصوص الشارات + لافتة المهمة + نصوص الهولوجرام + بطاقة اللوحة

     --------------------------------------------------------- */

  const CHAPTER1_UI = {

    ar: {

      eOpen: 'اضغط',

      eExit: 'اضغط',

 // مهام الاسكربت المطور — 13 مهمة عبر 7 مشاهد 

      oxyTask: 'المهمة: اضغط [E] لتدوير صمام الأكسجين',

      plaqueTask: 'المهمة: اقترب من الجسم اللامع واضغط [E]',

      eastTask: 'المهمة: تحرك شرقاً نحو منخفض بحر الهدوء',

      footTask: 'المهمة: افحص آثار الأقدام على الأرض [E]',

      flagTask: 'المهمة: تقدم يميناً وافحص العلم [E]',

      psepTask: 'المهمة: اقترب وافحص جهاز الزلازل السلبي PSEP [E]',

      lrrrTask: 'المهمة: افحص عاكس الليزر LRRR [E]',

      calibTask: 'المهمة: اضغط [E] لإطلاق ليزر الخوذة لمعايرة الملاحة',

      tracksTask: 'المهمة: تقدم عبر الممر وتفحص آثار العجلات على الأرض [E]',

      lrvTask: 'المهمة: اقترب وافحص عربة أبولو LRV [E]',

      roverPartsTask: 'المهمة: افحص العجلات والكاميرا ثم طبق الهوائي [E]',

      backtrackTask: 'المهمة: عُد غرباً إلى محطة الزلازل واستخدم حرارة RHU لإذابة صقيع الليزر',

      laserTask: 'المهمة: اضبط زاوية الليزر واضغط [E] لإطلاق نبضة المعايرة',

      broadcastTask: 'المهمة: اضغط [E] لبث نداء الاستغاثة المركز عبر بؤرة الهوائي',

      launchpadTask: 'المهمة: تقدم شرقاً إلى منصة الإطلاق الشرقية',

      boardTask: 'المهمة: اقترب من السلم واضغط [E] للصعود والإقلاع',

      holoTitle: 'فحص صمام الأكسجين',

      holoSub: 'SUIT O2 · SOHAIL v4.2',

      holoStatusLow: 'التدفق منخفض — أعد ضبط الصمام',

      holoStatusRaise: 'يرتفع الضغط… واصل التدوير',

      holoStatusDone: 'الضغط مستقر: 101 kPa',

      holoHint: 'اسحب الصمامل للتدوير — أو استخدم ← → / A D / E',

      rhuTitle: 'إذابة صقيع بطارية الليزر',

      rhuSub: 'RHU Pu-238 · THERMAL PROBE',

      rhuHint: 'استمر بالضغط على [E] لتقريب الموصّل الحراري من كبسولة RHU ثم أفلت داخل النطاق الآمن',

      rhuHold: 'تسخين [E]',

      rhuCool: 'صقيع',

      rhuSafe: 'النطاق الآمن',

      rhuHot: 'خطر',

      rhuStatusCold: 'الصقيع يذوب — استمر بالتسخين',

      rhuStatusOk: 'النطاق الآمن! أفلت للتثبيت الآن',

      rhuStatusHot: 'حرارة زائدة! ارتداد حراري — إعادة المحاولة',

      laserTitle: 'معايرة ليزر الملاحة',

      laserSub: 'LRRR · 180° RETROREFLECTOR',

      laserHint: 'ثبّت المؤشر على مركز الشبكة بـ ← → ثم اضغط [E] للإطلاق',

      laserFire: 'إطلاق النبضة [E]',

      laserMiss: 'النبضة تشتتت — حاول مجدداً',

      laserHit: 'ارتداد مثالي 180°!',

      antennaTitle: 'بؤرة الهوائي المقعر',

      antennaSub: 'HIGH-GAIN DISH · FOCAL LOCK',

      antennaHint: 'حرّك المرسل بـ ← → نحو أقصى إشارة ثم اضغط [E] للتثبيت',

      antennaLock: 'تثبيت البث [E]',

      antennaWeak: 'الإشارة ضعيفة — اقترب أكثر من البؤرة',

      antennaLocked: 'تضخيم 12× — البث مستقر!',

      loading: 'جارٍ تجهيز الأصول…',

      skipHint: 'نقرة أو أي زر للتخطي ▸',

      touchHint: 'استخدم أزرار اللمس أسفل الشاشة للحركة والتفاعل',

    },

    en: {

      eOpen: 'PRESS [E] TO OPEN',

      eExit: 'PRESS [E] TO EXIT',

 // Tasks of the upgraded script — 13 tasks across 7 scenes 

      oxyTask: 'Task: Press [E] to turn the oxygen valve',

      plaqueTask: 'Task: Approach the shiny object and press [E]',

      eastTask: 'Task: Move east toward the Sea of Tranquility',

      footTask: 'Task: Inspect the footprints in the dust [E]',

      flagTask: 'Task: Walk right and inspect the flag [E]',

      psepTask: 'Task: Approach and inspect the PSEP seismometer [E]',

      lrrrTask: 'Task: Inspect the LRRR Laser Reflector [E]',

      calibTask: 'Task: Press [E] to fire the helmet calibration laser',

      tracksTask: 'Task: Advance through the pass and inspect the wheel tracks [E]',

      lrvTask: 'Task: Approach and inspect the Apollo LRV [E]',

      roverPartsTask: 'Task: Inspect the wheels and camera, then the antenna dish [E]',

      backtrackTask: 'Task: Backtrack west to the seismometer station and use RHU heat to defrost the laser',

      laserTask: 'Task: Align the laser angle and press [E] to fire the calibration pulse',

      broadcastTask: 'Task: Press [E] to broadcast the focused distress signal via the dish focus',

      launchpadTask: 'Task: Head east to the eastern launchpad',

      boardTask: 'Task: Approach the ladder and press [E] to board and launch',

      holoTitle: 'OXYGEN REGULATOR',

      holoSub: 'SUIT O2 · SOHAIL v4.2',

      holoStatusLow: 'FLOW LOW — RESET THE VALVE',

      holoStatusRaise: 'PRESSURE RISING — KEEP TURNING',

      holoStatusDone: 'PRESSURE STABLE: 101 kPa',

      holoHint: 'DRAG THE WHEEL — OR HOLD A/D, ARROWS, E',

      rhuTitle: 'LASER BATTERY DEFROST',

      rhuSub: 'RHU Pu-238 · THERMAL PROBE',

      rhuHint: 'HOLD [E] to bring the thermal probe near the RHU chamber, release inside the safe band',

      rhuHold: 'HEAT [E]',

      rhuCool: 'FROZEN',

      rhuSafe: 'SAFE BAND',

      rhuHot: 'DANGER',

      rhuStatusCold: 'FROST MELTING — KEEP HEATING',

      rhuStatusOk: 'SAFE BAND! RELEASE TO LOCK NOW',

      rhuStatusHot: 'OVERHEAT! THERMAL BOUNCE — RETRY',

      laserTitle: 'NAVIGATION LASER',

      laserSub: 'LRRR · 180° RETROREFLECTOR',

      laserHint: 'Steady the reticle on the grid center with ← → then press [E] to fire',

      laserFire: 'FIRE PULSE [E]',

      laserMiss: 'PULSE SCATTERED — TRY AGAIN',

      laserHit: 'PERFECT 180° RETURN!',

      antennaTitle: 'DISH FOCAL POINT',

      antennaSub: 'HIGH-GAIN DISH · FOCAL LOCK',

      antennaHint: 'Move the transmitter with ← → toward peak signal, press [E] to lock',

      antennaLock: 'LOCK BROADCAST [E]',

      antennaWeak: 'SIGNAL WEAK — GET CLOSER TO THE FOCUS',

      antennaLocked: '12× GAIN — BROADCAST STABLE!',

      loading: 'LOADING ASSETS…',

      skipHint: 'CLICK / ANY KEY TO SKIP ▸',

      touchHint: 'Use the on-screen buttons to move and interact',

    },

  };



  /* =========================================================

 — نصوص توسعة الفصل الأول والفصل الثاني (المريخ)

 ========================================================= */



 /* بطاقة العبور الكوكبي بعد لقطات الإقلاع الثلاث (الاسكربت المطور) */

  const EXPANSION_END = {

    ar: {

      title: 'بعد 8 أشهر من العبور الصامت عبر الفضاء السحيق...',

      sub: 'كوكب المريخ — الفصل الثاني: حديقة التراث الفضائي',

      prompt: '[ اضغط لبدء الفصل الثاني ]',

    },

    en: {

      title: 'After 8 months of silent transit through deep space...',

      sub: 'Planet Mars — Chapter Two: The Memorial Garden',

      prompt: '[ PRESS TO START CHAPTER TWO ]',

    },

  };



 /* بطاقة افتتاح الفصل الثاني (الاسكربت الجديد) */

  const MARS_CHAPTER_CARD = {

    ar: {

      title: 'الفصل الثاني',

      sub: 'حديقة التراث الفضائي — مسار زين',

      prompt: '[ اضغط للمتابعة ]',

    },

    en: {

      title: 'CHAPTER TWO',

      sub: 'The Memorial Garden — Zain\'s Path',

      prompt: '[ PRESS TO CONTINUE ]',

    },

  };



 /* بطاقات لوحة الشرف الكونية — الختام (المشهد 6 من الاسكربت الجديد ) */

  const HONOR_CARDS = [

    {

      eyebrow: 'HONOR ROLL · 1997',

      eyebrowAr: 'لوحة الشرف — المسبار الصغير سوجورنر (1997)',

      lineAr: '«الروبوت الصغير الذي علم البشرية شجاعة الخطوة الأولى فوق تراب عالم جديد.»',

      lineEn: '"The tiny robot that taught humanity the courage of the first step upon a new world\'s soil."',

    },

    {

      eyebrow: 'HONOR ROLL · 2018',

      eyebrowAr: 'لوحة الشرف — مسبار إنسايت (2018)',

      lineAr: '«المستكشف الحكيم الذي استمع لنبضات قلب المريخ، وعلمنا الرضا والسكينة.»',

      lineEn: '"The wise explorer that listened to the heartbeat of Mars, and taught us serenity and peace."',

    },

    {

      eyebrow: 'HONOR ROLL · 2004',

      eyebrowAr: 'لوحة الشرف — مسبار أوبورتيونيتي (2004)',

      lineAr: '«المحارب الذي صمد 15 عاماً... وظل حارساً يرشد التائهين ويجمع شمل الأخوين.»',

      lineEn: '"The warrior that endured 15 years... standing guard, guiding the lost and reuniting the brothers."',

    },

  ];



  /* الرسالة الختامية — Title Drop */

  const FINAL_MESSAGE = {

    ar: 'قد تنفد بطارياتهم يوماً ما،\nوقد تبهت ألوان أعلامهم تحت قسوة الأشعة الكونية،\nوقد تدفن رمال الصحاري البعيدة هياكلهم الصامتة...\n\nلكنهم ليسوا خردة، ولن يكونوا أبداً وحيدين.\nلأن كل خطوة يخطوها إنسان في الفضاء اليوم،\nهي صدى لشجاعتهم، وشاهد على أننا لا ننسى رفاق الطريق.',

    en: 'Their batteries may one day drain,\nThe colors of their flags may bleach beneath the cosmic rays,\nAnd the drifting sands of alien deserts may bury their silent frames...\n\nYet they are not scrap, and they will never be alone.\nFor every step humanity takes into deep space today,\nIs an echo of their pioneer courage, and proof that we never abandon those who paved the way.',

  };



  const TITLE_DROP = {

    ar: 'متروكون... لكنهم لم يُنسوا أبداً.',

    en: 'Abandoned... but Never Forgotten.',

  };



  const CREDITS_TEXT = {

    ar: 'فريق NileStro — مشروع أوزيريس\nمسابقة ناسا للفضاء المفتوح 2026',

    en: 'Team NileStro — Project OSIRIS\nNASA Space Apps Challenge 2026',

  };



  /* =========================================================

 فريق NileStro — بيانات شاشة الفريق بعد النهاية

 ★★★ عدّل الأسماء هنا مباشرة: ضع اسم كل عضو في حقل name ★★★

 ========================================================= */

  const TEAM_NILESTRO = [

    { roleAr: 'قائد الفريق', roleEn: 'Team Lead', name: '—' },

    { roleAr: 'المطور الرئيسي', roleEn: 'Lead Developer', name: '—' },

    { roleAr: 'كاتب القصة', roleEn: 'Story Writer', name: '—' },

    { roleAr: 'الفنان', roleEn: 'Artist', name: '—' },

  ];



 /* أسماء الفريق الأربعة في شاشة التوديع الجماعية */

  const TEAM_NAMES = {

    ar: ['ملك قطب', 'رانيا إبراهيم', 'مازن أشرف', 'محمد أشرف'],

    en: ['Malak Kotp', 'Ranya Ibrahem', 'Mazen Ashraf', 'Mohamed Ashraf'],

  };



  /* نصوص واجهة التوسعة + المريخ */

  const EXPANSION_UI = {

    ar: {

 /* مهام الفصل الثاني — الاسكربت الجديد: حديقة التراث الفضائي */

      habitatTask: 'المهمة: اضغط [E] لالتقاط منارة الاستقبال من طاولة المعدات',

      doorTask: 'المهمة: اقترب من بوابة العزل واضغط [E] لعبورها',

      plainTask: 'المهمة: تابع السير شرقاً نحو حديقة التراث الفضائي',

      sojournerTask: 'المهمة: اقترب وافحص المسبار الصغير سوجورنر [E]',

      insightTask: 'المهمة: اقترب وافحص مسبار إنسايت [E]',

      oppyTask: 'المهمة: اقترب من مسبار Opportunity واضغط [E]',

      oppyMastTask: 'المهمة: اضغط [E] لتثبيت وتشغيل منارة الليزر فوق صارية أوبي',

      sunriseTask: 'المهمة: امشِ نحو الشروق — طارق ينتظرك',

      reunionPrompt: 'المهمة: اقترب من طارق والتقِ بأخيك',

      honorPrompt: '[ اضغط لاستعراض لوحة الشرف الكونية ]',

      eRise: 'اضغط E للنهوض وتفقد الأضرار',

      finalPrompt: '[ اضغط للعودة إلى القائمة الرئيسية ]',

      teamQuestion: 'هل تريد التعرف على فريق صناعة اللعبة NileStro؟',

      teamYes: 'نعم — تعرّف على الفريق',

      teamNo: 'لا — العودة للقائمة',

      teamTitle: 'فريق NileStro',

      teamSub: 'صنّاع لعبة مهجور لكن غير منسي — Project OSIRIS',

      teamBack: '[ اضغط للعودة إلى القائمة الرئيسية ]',

 /* خلف الكواليس: مكاتب الفريق الأربعة */

      credTask1: 'المهمة: اقترب وتحدث مع قائدة الفريق ملك [E]',

      credTask2: 'المهمة: تحدث مع باحثة المحتوى رانيا [E]',

      credTask3: 'المهمة: تحدث مع مهندس الملاحة والسرد مازن [E]',

      credTask4: 'المهمة: اقترب من شاشة المطور الرئيسية [E]',

      credNext1: 'المهمة: امشِ شرقاً إلى مكتب رانيا',

      credNext2: 'المهمة: امشِ شرقاً إلى مركز مازن',

      credNext3: 'المهمة: امشِ شرقاً إلى استوديو محمد',

      credIntroTitle: 'انتقال إلى استوديو تطوير NileStro...',

      credIntroSub: 'خلف الكواليس',

      credWaveTitle: 'من فريق NileStro:',

      credWaveLine: 'متروكون في الفضاء... لكنهم لن يُنسوا أبداً!',

      credReplay: '[E] إعادة تشغيل اللعبة من البداية',

      credExit: '[ESC] الخروج للقائمة الرئيسية',

    },

    en: {

 /* Chapter Two tasks — the new Memorial Garden script */

      habitatTask: 'Task: Press [E] to grab the guidance beacon from the equipment table',

      doorTask: 'Task: Approach the airlock door and press [E] to cross it',

      plainTask: 'Task: Continue east toward the Space Heritage Garden',

      sojournerTask: 'Task: Approach and inspect the small Sojourner rover [E]',

      insightTask: 'Task: Approach and inspect the InSight lander [E]',

      oppyTask: 'Task: Approach Opportunity rover and press [E]',

      oppyMastTask: 'Task: Press [E] to mount and fire the laser beacon atop Oppy\'s mast',

      sunriseTask: 'Task: Walk toward the sunrise — Tariq awaits you',

      reunionPrompt: 'Task: Approach Tariq and reunite with your brother',

      honorPrompt: '[ PRESS TO ROLL THE COSMIC HONOR WALL ]',

      eRise: 'PRESS [E] TO GET UP AND ASSESS DAMAGE',

      finalPrompt: '[ PRESS TO RETURN TO MAIN MENU ]',

      teamQuestion: 'Would you like to meet the team behind the game, NileStro?',

      teamYes: 'YES — Meet the Team',

      teamNo: 'NO — Back to Menu',

      teamTitle: 'Team NileStro',

      teamSub: 'Makers of Abandoned but Not Forgotten — Project OSIRIS',

      teamBack: '[ PRESS TO RETURN TO MAIN MENU ]',

 /* Behind the scenes: the four team offices */

      credTask1: 'Task: Approach team leader Malak and talk [E]',

      credTask2: 'Task: Talk to content researcher Ranya [E]',

      credTask3: 'Task: Talk to navigation engineer Mazen [E]',

      credTask4: 'Task: Approach the main developer screen [E]',

      credNext1: 'Task: Walk east to Ranya\'s study lab',

      credNext2: 'Task: Walk east to Mazen\'s mission control',

      credNext3: 'Task: Walk east to Mohamed\'s dev studio',

      credIntroTitle: 'Entering the NileStro dev studio...',

      credIntroSub: 'Behind the scenes',

      credWaveTitle: 'From Team NileStro:',

      credWaveLine: 'Abandoned in space... but Never Forgotten!',

      credReplay: '[E] Replay the game from the start',

      credExit: '[ESC] Exit to the main menu',

    },

  };



  /* بطاقة لوحة الذكريات — تُعرض دائماً باللغتين */

  const PLAQUE_CARD = {

    eyebrow: 'OSIRIS MEMORY PLAQUE',

    eyebrowAr: 'لوحة أوزيريس التذكارية',

    lineAr: '«طارق وزين — إلى النجوم معاً»',

    lineEn: '"Tariq & Zain — To the stars, together"',

  };



  /* بطاقات أرشيف ناسا — تظهر وسط الحوارات (مثل بطاقة اللوحة) */

  const ARCHIVE_CARDS = {

    plaque: PLAQUE_CARD,

    psep: {

      eyebrow: 'NASA ARCHIVE · APOLLO 11',

      eyebrowAr: 'ملف ناسا: PSEP & RHU — أبولو 11',

      lineAr: 'رصد الزلازل القمرية + تدفئة الأجهزة بـ 15 واط حراري من التحلل الإشعاعي الطبيعي للبلوتونيوم-238 — أول طاقة نووية حرارية على جرم آخر (1969).',

      lineEn: 'Recording lunar seismic activity + heating instruments with 15 thermal watts from Pu-238 decay — humanity\'s first nuclear heat on another world (1969).',

    },

    lrrr: {

      eyebrow: 'NASA ARCHIVE · APOLLO 11 LRRR',

      eyebrowAr: 'ملف ناسا: عاكس الليزر LRRR',

      lineAr: '100 منشور كوارتز مكعب — الجهاز الوحيد من أبولو 11 ما زال في الخدمة: يقيس بُعد القمر بدقة المليمتر (تمدد 3.8 سم/سنة) منذ يوليو 1969.',

      lineEn: '100 quartz corner-cubes — the only Apollo 11 experiment still in service: measuring Earth-Moon distance to millimeter accuracy (3.8 cm/yr drift) since July 1969.',

    },

    camera: {

      eyebrow: 'NASA ARCHIVE · DEC 14, 1972',

      eyebrowAr: 'ملف ناسا: كاميرا إد فيندل — أبولو 17',

      lineAr: 'آخر كادر بشري من سطح القمر في القرن العشرين: كاميرا حُرّكت عن بُعد من هيوستن بفارق إشارة 1.3 ثانية لتوثيق إقلاع آخر رواد.',

      lineEn: 'The final human frame of the 20th-century Moon: a camera remotely panned from Houston across a 1.3-second signal delay to film the last astronauts\' ascent.',

    },

    lrv: {

      eyebrow: 'NASA ARCHIVE · APOLLO 15-17',

      eyebrowAr: 'ملف ناسا: العربة الجوالة LRV',

      lineAr: 'أول مركبة كهربائية يقودها بشر على جرم آخر (1971–1972) — عجلات شبك صلب مجلفن بالزنك تتحمل بين ‎-170° و ‎+120° دون مطاط منفوخ.',

      lineEn: 'The first crewed electric vehicle on another world (1971–1972) — zinc-coated steel mesh wheels enduring -170°C to +120°C without inflatable rubber.',

    },

  };



  const UI = {

    ar: { title: 'الإعدادات', volume: 'مستوى الصوت', language: 'اللغة', close: 'إغلاق', mainMenu: 'العودة للقائمة', gearLabel: 'الإعدادات (Esc)', manualLabel: 'دليل المهمة ومصادر ناسا (M)', manualRow: 'دليل ناسا والمصادر' },

    en: { title: 'SETTINGS', volume: 'VOLUME', language: 'LANGUAGE', close: 'CLOSE', mainMenu: 'MAIN MENU', gearLabel: 'Settings (Esc)', manualLabel: 'NASA Mission Manual & Resources (M)', manualRow: 'NASA manual & resources' },

  };



  /* ---------------------------------------------------------

     الغرف — بإحداثيات الصور الأصلية (2752×1536 ما عدا سطح القمر 1376×768)

     photos: الصور المعلقة على حائط المختبر

     الغرفة الثالثة (room-cockpit): قمرة القيادة — فيها طارق كشخصية حية

     --------------------------------------------------------- */

  const ROOMS = [

    {

      img: ASSETS.rooms.docs,

      hotspots: [

        { id: 'photos', bx: 200, by: 470, bw: 540, bh: 480 },

      ],

    },

    {

      img: ASSETS.rooms.corridor,

      hotspots: [],

    },

    {

      img: ASSETS.rooms.cockpit,

      hotspots: [

        { id: 'tariq', npc: true },   // طارق — يُرسم فوق الخلفية، والتفاعل حسب مكانه على الشاشة

      ],

    },

    {

      // «الغرفة صفر» — حجرة بوابة الهروب (AIRLOCK 05) بباب الكبسولة

      // الوجهة النهائية — تُفتح بعد حوار طارق، وجميع الأسهم تتجه نحويها يميناً

      // الرافع الأحمر بجانب الباب — نقطة تفاعل تطلق سينما الاصطدام

      img: ASSETS.rooms.airlock,

      hotspots: [

        { id: 'lever', bx: 1560, by: 560, bw: 340, bh: 520 },

      ],

    },

    /* ================= ما بعد الاصطدام (وضع الأزمة) ================= */

    {

      // الغرفة 4 — غرفة التوثيق بعد الاصطدام (فيديو)

      video: ASSETS.roomVideos.docsDamaged,

      hotspots: [],

    },

    {

      // الغرفة 5 — الغرفة الثانية بعد الاصطدام (فيديو)

      // باب كبسولة زين على اليمين (كتلة صلبة) وطارق واقف على اليسار

      video: ASSETS.roomVideos.corridorDamaged,

      hotspots: [

        { id: 'farewell', npc: true, npcX: 0.28 }, // طارق — حوار الوداع يبدأ تلقائياً بالاقتراب

      ],

    },

    {

      // الغرفة 6 — بديل قمرة القيادة بعد الاصطدام (شاشة القمر الحمراء)

      img: ASSETS.rooms.cockpitDamaged,

      hotspots: [],

    },

    {

      // الغرفة 7 — سطح القمر بعد الخروج (اللاعب هو طارق)

      // صمام الأكسجين على جسم الكبسولة + لوحة الذكريات اللامعة على الأرض

      img: ASSETS.rooms.moon,

      hotspots: [

        { id: 'oxyValve', sxf: 0.13, syf: 0.50, size: 240 },

        { id: 'plaque',   sxf: 0.60, syf: 0.82, size: 220 },

      ],

    },

 /* ====== تكملة القمر — الاسكربت المطور: 7 مشاهد متصلة ====== */

    {

      // الغرفة 8 — المشهد 2: مسار الوادي الفسيح وخطوات أبولو (صورة المستخدم 2.jpg)

      // الآثار عند الكومة المزدحمة (~50٪/83٪) — والعلم الأبيض (~72٪/33٪)

      img: ASSETS.rooms.moonFootprints,

      hotspots: [

        { id: 'footprints', sxf: 0.50, syf: 0.83, size: 140 },

        { id: 'flag',       sxf: 0.72, syf: 0.33, size: 220 },

      ],

    },

    {

      // الغرفة 9 — المشهد 3: محطة الزلازل PSEP ووحدات التدفئة RHU (صورة المستخدم 3.jpg)

      // المحطة المركزية (~63٪/46٪) — كبسولة RHU أسفلها (~64٪/60٪: تظهر بعد اكتشاف الحلقة)

      img: ASSETS.rooms.moonPsep,

      hotspots: [

        { id: 'psep', sxf: 0.63, syf: 0.46, size: 220 },

        { id: 'rhu',  sxf: 0.64, syf: 0.60, size: 160 },

      ],

    },

    {

      // الغرفة 10 — المشهد 4: موقع عاكس الليزر LRRR (صورة المستخدم 4.jpg)

      // العاكس المائل بمرايا الكوارتز المكعبة (~68٪/45٪)

      img: ASSETS.rooms.moonLrrr,

      hotspots: [

        { id: 'lrrr', sxf: 0.68, syf: 0.45, size: 200 },

      ],

    },

    {

      // الغرفة 11 — المشهد 5: مدخل ممر جبال أبولو (صورة المستخدم 5.jpg)

      // مسارات العجلات المزدوجة (جسم مرسوم فوق الأرضية ~60٪/78٪)

      img: ASSETS.rooms.moonValley,

      hotspots: [

        { id: 'tracks', sxf: 0.60, syf: 0.78, size: 220 },

      ],

    },

    {

      // الغرفة 12 — المشهد 6: وادي عربة أبولو LRV (صورة المستخدم 6.jpg)

      // جسم العربة ~62٪/52٪ + العجلة الشبكية ~56٪/69٪ + الكاميرا ~55٪/52.5٪ + الطبق ~71٪/36٪

      img: ASSETS.rooms.moonRover,

      hotspots: [

        { id: 'lrv',     sxf: 0.62, syf: 0.52, size: 180 },

        { id: 'wheels',  sxf: 0.56, syf: 0.69, size: 140 },

        { id: 'camera',  sxf: 0.55, syf: 0.525, size: 140 },

        { id: 'antenna', sxf: 0.71, syf: 0.36, size: 140 },

      ],

    },

    {

      // الغرفة 13 — المشهد 7: منصة الإطلاق والانتقال للمريخ (صورة المستخدم 7.jpg الجديدة)

      // مركبة العبور بسلّم الصعود المفتوح — [E] عند أسفل السلم ~58٪/78٪ للصعود والإقلاع

      img: ASSETS.rooms.moonLaunch,

      hotspots: [

        { id: 'ladder', sxf: 0.58, syf: 0.78, size: 240 },

      ],

    },

 /* ====== الفصل الثاني — حديقة التراث الفضائي: مسار زين (الاسكربت الجديد) ====== */

    {

      // الغرفة 14 — المشهد 1: داخل المأوى بعد انجلاء العاصفة (صورة المستخدم 1.jpg)

      // نافذة الاعتصام + طاولة المعدات (التقاط منارة الاستقبال)

      img: ASSETS.rooms.marsHabitat,

      hotspots: [

        { id: 'habitatWindow', sxf: 0.50, syf: 0.40, size: 200 },

        { id: 'beaconTable',   sxf: 0.17, syf: 0.60, size: 240 },

      ],

    },

    {

      // الغرفة 15 — ممر بوابة العزل: البوابة المغلقة (2.jpg) → تفتح بالضغط على حرف E

      // الملتصق بالباب → الخلفية تتبدل إلىmarsAirlockOpen (3.jpg) — ثم الخروج شرقاً

      img: ASSETS.rooms.marsAirlock,

      hotspots: [

        { id: 'airlockDoor', sxf: 0.46, syf: 0.55, size: 300 },

      ],

    },

    {

      // الغرفة 16 — السهل الصخري الليلي (4.jpg): أول خلفية خارجية —

      // زين يدخل من جهة اليسار (خارجاً من بوابة المأوى)

      img: ASSETS.rooms.marsPlain,

      hotspots: [],

    },

    {

      // الغرفة 17 — المشهد 2: المحطة الأولى — مسبار سوجورنر الصغير (5.jpg)

      img: ASSETS.rooms.marsSojourner,

      hotspots: [

        { id: 'sojourner', sxf: 0.66, syf: 0.58, size: 220 },

      ],

    },

    {

      // الغرفة 18 — المشهد 3: المحطة الثانية — مسبار إنسايت (6.jpg)

      img: ASSETS.rooms.marsInsight,

      hotspots: [

        { id: 'insight', sxf: 0.72, syf: 0.58, size: 260 },

      ],

    },

    {

      // الغرفة 19 — المشهد 4: قمة فوهة إنديفور — مسبار Opportunity (7.jpg)

      // فحص أوبي ثم تركيب المنارة فوق صاريته [E]

      img: ASSETS.rooms.marsOpportunity,

      hotspots: [

        { id: 'oppy',      sxf: 0.70, syf: 0.63, size: 280 },

        { id: 'oppyMast',  sxf: 0.66, syf: 0.50, size: 200 },

      ],

    },

    {

 // الغرفة 20 — مشهد الشروق : خلفية عادية يمشي فيها زين شرقاً

 // نحو موقع طارق — استبدال فيديو الشروق القديم 

      img: ASSETS.rooms.marsSunriseWalk,

      hotspots: [],

    },

    {

 // الغرفة 21 — المشهد 5: مشهد طارق أمام المركبة الهابطة على السهل (8.jpg)

      img: ASSETS.rooms.marsReunion,

      hotspots: [

        { id: 'tariqMars', npc: true, npcX: 0.42 },   // طارق واقف غرب المركبة يستقبل زين القادم

      ],

    },



    /* =======================================================

 — خلف الكواليس: مكاتب فريق NileStro (الغرف 22..25 — بالترتيب 1→2→3→4)

 اللاعب هنا هو محمد أشرف — يمشي عبر المكاتب ويحاور كل عضو [E]

 ======================================================= */

    {

      // الغرفة 22 — مكتب 1: ملك (محطة القيادة والبيوتكنولوجي)

      img: ASSETS.rooms.office1,

      hotspots: [

        { id: 'npcMalak', npc: true, npcX: 0.50 },

      ],

    },

    {

      // الغرفة 23 — مكتب 2: رانيا (معمل أبحاث البيانات وكتب الفضاء)

      img: ASSETS.rooms.office2,

      hotspots: [

        { id: 'npcRanya', npc: true, npcX: 0.58 },

      ],

    },

    {

      // الغرفة 24 — مكتب 3: مازن (مركز الملاحة وتكنولوجيا الفضاء)

      img: ASSETS.rooms.office3,

      hotspots: [

        { id: 'npcMazen', npc: true, npcX: 0.60 },

      ],

    },

    {

      // الغرفة 25 — مكتب 4: استوديو محمد (التطوير والصوتيات) — شاشة المطور الرئيسية

      img: ASSETS.rooms.office4,

      hotspots: [

        { id: 'devScreen', sxf: 0.75, syf: 0.52, size: 320 },

      ],

    },

  ];



  /* ---------------------------------------------------------

     تأثيرات الصوت (Web Audio) — كل الأصوات مولَّدة برمجياً

     الكتابة / خطوات المشي / زر E / الأزرار / فتح الإعدادات

     --------------------------------------------------------- */

  const Sfx = {

    ctx: null,



    /** ينشئ/يفعّل سياق الصوت — يُنادى من أي تفاعل مستخدم */

    ensure() {

      try {

        if (!this.ctx) {

          const Ctx = window.AudioContext || window.webkitAudioContext;

          if (!Ctx) return false;

          this.ctx = new Ctx();

        }

        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

        return this.ctx.state === 'running';

      } catch (_) {

        return false;

      }

    },



    vol() {

      const stored = Number(localStorage.getItem(VOLUM_KEY) ?? 70) / 100;

      const v = (window.GameVolume !== undefined) ? window.GameVolume : stored;

      return Math.max(0, Math.min(1, v));

    },



    on() { return this.ctx && this.ctx.state === 'running'; },



    /** نقرة مفتاح ميكانيكي — تُستخدم للكتابة الحرفية في الحوار */

    keyClick(strength = 0.30) {

      if (!this.on()) return;

      const ctx = this.ctx;

      const volume = this.vol();

      if (volume <= 0) return;



      const t0 = ctx.currentTime;

      const master = ctx.createGain();

      master.gain.value = 1;

      master.connect(ctx.destination);



      // 1) ضوضاء قصيرة = طقطقة المفتاح

      const noiseLen = 0.045;

      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseLen), ctx.sampleRate);

      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {

        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);

      }

      const noise = ctx.createBufferSource();

      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();

      bandpass.type = 'bandpass';

      bandpass.frequency.value = 1500 + Math.random() * 2200;

      bandpass.Q.value = 1.2;

      const noiseGain = ctx.createGain();

      noiseGain.gain.value = strength * volume;

      noise.connect(bandpass).connect(noiseGain).connect(master);

      noise.start(t0);



      // 2) "طقة" قصيرة

      const osc = ctx.createOscillator();

      osc.type = 'square';

      osc.frequency.setValueAtTime(260 + Math.random() * 140, t0);

      const oscGain = ctx.createGain();

      oscGain.gain.setValueAtTime(strength * 1.1 * volume, t0);

      oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);

      osc.connect(oscGain).connect(master);

      osc.start(t0);

      osc.stop(t0 + 0.05);

    },



    /** نقطة قدم أثناء المشي — ضربة ارتطام مكتومة */

    footStep() {

      if (!this.on()) return;

      const ctx = this.ctx;

      const volume = this.vol() * 0.55;

      if (volume <= 0) return;



      const t0 = ctx.currentTime;

      const master = ctx.createGain();

      master.gain.value = 1;

      master.connect(ctx.destination);



      // ارتطام منخفض التردد

      const thump = ctx.createOscillator();

      thump.type = 'sine';

      thump.frequency.setValueAtTime(110 + Math.random() * 30, t0);

      thump.frequency.exponentialRampToValueAtTime(48, t0 + 0.09);

      const thumpGain = ctx.createGain();

      thumpGain.gain.setValueAtTime(0.5 * volume, t0);

      thumpGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);

      thump.connect(thumpGain).connect(master);

      thump.start(t0);

      thump.stop(t0 + 0.12);



      // سواقة خفيفة (البدلة/الحجرة)

      const noiseLen = 0.05;

      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseLen), ctx.sampleRate);

      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {

        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);

      }

      const noise = ctx.createBufferSource();

      noise.buffer = buffer;

      const lowpass = ctx.createBiquadFilter();

      lowpass.type = 'lowpass';

      lowpass.frequency.value = 420 + Math.random() * 140;

      const noiseGain = ctx.createGain();

      noiseGain.gain.value = 0.30 * volume;

      noise.connect(lowpass).connect(noiseGain).connect(master);

      noise.start(t0);

    },



    /** نغمة قصيرة عامة (أزرار الواجهة / تقدم الحوار) */

    blip(freq = 520, dur = 0.05, strength = 0.10, type = 'square') {

      if (!this.on()) return;

      const ctx = this.ctx;

      const volume = this.vol();

      if (volume <= 0) return;



      const t0 = ctx.currentTime;

      const osc = ctx.createOscillator();

      osc.type = type;

      osc.frequency.setValueAtTime(freq, t0);

      const gain = ctx.createGain();

      gain.gain.setValueAtTime(strength * volume, t0);

      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      osc.connect(gain).connect(ctx.destination);

      osc.start(t0);

      osc.stop(t0 + dur + 0.01);

    },



    /** ضغط زر E — صوت اختيار مشرق */

    ePress() {

      if (!this.on()) return;

      const ctx = this.ctx;

      const volume = this.vol();

      this.keyClick(0.26);

      const t0 = ctx.currentTime + 0.02;

      const osc = ctx.createOscillator();

      osc.type = 'triangle';

      osc.frequency.setValueAtTime(880, t0);

      osc.frequency.exponentialRampToValueAtTime(1480, t0 + 0.07);

      const gain = ctx.createGain();

      gain.gain.setValueAtTime(0.0001, t0);

      gain.gain.linearRampToValueAtTime(0.14 * volume, t0 + 0.015);

      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);

      osc.connect(gain).connect(ctx.destination);

      osc.start(t0);

      osc.stop(t0 + 0.14);

    },



    /** انفجار الاصطدام — ضربة ضوضاء + موجة صدمة عميقة */

    explosion() {

      if (!this.on()) return;

      const ctx = this.ctx;

      const volume = this.vol();

      if (volume <= 0) return;

      const t0 = ctx.currentTime;



      const master = ctx.createGain();

      master.gain.value = 1;

      master.connect(ctx.destination);



      // ضوضاء انفجار تنطفئ تدريجياً

      const len = 0.9;

      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);

      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {

        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.6);

      }

      const noise = ctx.createBufferSource();

      noise.buffer = buffer;

      const lowpass = ctx.createBiquadFilter();

      lowpass.type = 'lowpass';

      lowpass.frequency.setValueAtTime(900, t0);

      lowpass.frequency.exponentialRampToValueAtTime(120, t0 + 0.7);

      const noiseGain = ctx.createGain();

      noiseGain.gain.setValueAtTime(0.85 * volume, t0);

      noiseGain.gain.exponentialRampToValueAtTime(0.002, t0 + 0.85);

      noise.connect(lowpass).connect(noiseGain).connect(master);

      noise.start(t0);



      // موجة صدمة عميقة (الرجة)

      const boom = ctx.createOscillator();

      boom.type = 'sine';

      boom.frequency.setValueAtTime(120, t0);

      boom.frequency.exponentialRampToValueAtTime(28, t0 + 0.6);

      const boomGain = ctx.createGain();

      boomGain.gain.setValueAtTime(0.9 * volume, t0);

      boomGain.gain.exponentialRampToValueAtTime(0.002, t0 + 0.7);

      boom.connect(boomGain).connect(master);

      boom.start(t0);

      boom.stop(t0 + 0.75);

    },



    /** صفارة إنذار — رجوع/انطلاق تردد متكرر أثناء التحذير */

    siren(cycles = 4) {

      if (!this.on()) return;

      const ctx = this.ctx;

      const volume = this.vol();

      if (volume <= 0) return;

      const t0 = ctx.currentTime + 0.05;



      for (let i = 0; i < cycles; i++) {

        const start = t0 + i * 0.75;

        const osc = ctx.createOscillator();

        const gain = ctx.createGain();

        osc.type = 'sawtooth';

        osc.frequency.setValueAtTime(520, start);

        osc.frequency.linearRampToValueAtTime(980, start + 0.33);

        osc.frequency.linearRampToValueAtTime(520, start + 0.66);

        gain.gain.setValueAtTime(0.0001, start);

        gain.gain.linearRampToValueAtTime(0.10 * volume, start + 0.05);

        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);

        osc.connect(gain).connect(ctx.destination);

        osc.start(start);

        osc.stop(start + 0.72);

      }

    },



    /** نغمتان عاجلتان لظهور لافتة المهمة */

    missionAlert() {

      this.blip(340, 0.09, 0.14, 'square');

      setTimeout(() => this.blip(680, 0.12, 0.14, 'square'), 140);

    },



    /** فتح/إغلاق الإعدادات — نغمتان */

    modalOpen()  { this.blip(440, 0.06, 0.12); setTimeout(() => this.blip(660, 0.07, 0.12), 70); },

    modalClose() { this.blip(660, 0.05, 0.10); setTimeout(() => this.blip(440, 0.06, 0.10), 60); },

    advance()    { this.blip(620, 0.045, 0.10); },

    menuGo()     { this.blip(520, 0.06, 0.12); setTimeout(() => this.blip(780, 0.08, 0.12), 80); },



 /** همهمة الهزة القمرية — ضوضاء منخفضة مديدة */

    rumble() {

      if (!this.on()) return;

      const ctx = this.ctx;

      const volume = this.vol();

      if (volume <= 0) return;

      const t0 = ctx.currentTime;

      const len = 1.6;

      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);

      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {

        const env = Math.min(1, i / (ctx.sampleRate * 0.2)) * Math.pow(1 - i / data.length, 1.4);

        data[i] = (Math.random() * 2 - 1) * env;

      }

      const src = ctx.createBufferSource();

      src.buffer = buffer;

      const lp = ctx.createBiquadFilter();

      lp.type = 'lowpass';

      lp.frequency.setValueAtTime(120, t0);

      lp.frequency.exponentialRampToValueAtTime(46, t0 + 1.3);

      const gain = ctx.createGain();

      gain.gain.setValueAtTime(0.7 * volume, t0);

      gain.gain.exponentialRampToValueAtTime(0.002, t0 + 1.5);

      src.connect(lp).connect(gain).connect(ctx.destination);

      src.start(t0);

    },

  };



  const Scene2 = {

    running: false,

    embedded: false,

    onClose: null,



    canvas: null,

    ctx: null,

    host: null,

    roomImgs: [null, null, null, null],

    roomVideos: {},          // فيديوهات الغرف بعد الاصطدام: index → عنصر

    idleSheet: null,

    walkSheet: null,

    idleMeta: null,

    walkMeta: null,

    tariqSheet: null,

    tariqMeta: null,

    tariqWalkSheet: null,    // ورقة مشي طارق (مرحلة ما بعد الاصطدام)

    tariqWalkMeta: null,

 /* أوراق الفريق الموحدة: محمد (اللاعب) + ملك/رانيا/مازن (NPC) */

    mohamedSheet: null, mohamedWalkSheet: null,

    mohamedMeta: null, mohamedWalkMeta: null,

    malakSheet: null, malakMeta: null,

    ranyaSheet: null, ranyaMeta: null,

    mazenSheet: null, mazenMeta: null,



    W: 0, H: 0, dpr: 1,

    charX: 0,

    facing: 1, // 1 = right, -1 = left

    keys: { left: false, right: false, e: false },

    vx: 0,

    anim: 'idle',

    frameIdx: 0,

    frameTimer: 0,

    lastTime: 0,

    rafId: null,

    lastWalkFrame: 0,   // لحساب الخطوات المتزامنة مع الأنيميشن



    lang: 'ar',

    instructionsShown: false,

    instructionsEl: null,

    toastEl: null,

    toastTimer: null,

    hasMoved: false,



    // الغرف والتفاعل

    room: 0,

    exitOpen: false,

    transitioning: false,

    autoWalk: false,

    autoTargetX: 0,

    paused: false,

    dialogueActive: false,

    dialogue: null,          // { id, lines, idx }

    dialogueEl: null,

    exitHintEl: null,

    exitHintSide: null,

    gearBtn: null,

    modalEl: null,

    fadeEl: null,



    // المشهد الطارئ (سينما الاصطدام في غرفة الكبسولة)

    cutsceneActive: false,   // يجمد الحركة/التفاعل أثناء المشهد

    impactTriggered: false,  // واقي التشغيل مرة واحدة

    crisis: false,           // وضع الأزمة: خلفيات الفيديو والسلسلة الجديدة يساراً

    farewellDone: false,     // حوار الوداع انتهى (مرة واحدة)

    playerChar: 'zain',      // الشخصية التي يتحكم بها اللاعب: 'zain' | 'tariq'

    videoEl: null,           // عنصر الفيديو الخاص بالخلفية

    warnEl: null,            // الشاشة التحذيرية الحمراء

    missionEl: null,         // لافتة المهمة

    cutsceneTimers: [],      // مؤقتات التسلسل — تُنظف في stop()

    onScriptArrive: null,    // يُنادى عند وصول المشي التلقائي السينمائي

    cutsceneVideoEl: null,   // فيديو سينمائي ملء الشاشة (قابل للتخطي)

    cutsceneVideoDone: null, // الانتقال التالي بعد انتهاء الفيديو السينمائي

    _cutsceneFinish: null,   // دالة إنهاء الفيديو السينمائي (لنقرة التخطي)

    epilogueEl: null,        // شاشة الخاتمة (النص الأبيض + لافتة الفصل)

    epilogueEnded: false,    // انتهت لافتة الفصل — ينتظر نقرة العودة للقائمة

    transitionTimers: [],    // مؤقتات انتقال الغرف — تُنظف في stop()



    /* — إضافات v1.2 — */

    touchEl: null,           // أزرار التحكم اللمسية (تظهر على الأجهزة اللمسية)

    skipHintEl: null,        // تلميح «نقرة للتخطي» فوق الفيديوهات السينمائية

    goalEl: null,            // لافتة مهمة التوجه شرقاً (بعد لوحة الذكريات)

    endCardEl: null,         // بطاقة «يتبع…» في نهاية الجزء الحالي

    chapterEndReady: false,  // بطاقة النهاية جاهزة — نقرة تعيد للقائمة

    eastOpen: false,         // فتح مسار الشرق (نهاية الجزء الحالي)

    loadProgress: 0,         // تقدم تحميل الأصول 0..1 (شاشة التحميل)

    _pendingJump: null,      // 'moon' — دخول مباشر لسطح القمر بعد التحميل



    CELL: 256,

    IDLE_HEIGHT: 182,      // الطول البصري لزين (CSS px) — طارق نفسه الطول

    START_OFFSET: 220,     // مسافة ظهور زين عن حافة الشاشة

    SPEED: 190,

    IDLE_FPS: 6,

    WALK_FPS: 10,

    HOTSPOT_RANGE: 200,    // مدى تقارب زين من نقطة تفاعل (CSS px)

    NPC_TURN_RANGE: 330,   // مدى التفات طارق لينظر لزين

    NPC_INTERACT_RANGE: 230, // مدى التفاعل مع طارق (E)

    LEVER_TRIGGER_RANGE: 130, // مدى الاقتراب الذي يطلق مشهد الاصطدام تلقائياً

    FAREWELL_TRIGGER_RANGE: 210, // مدى الاقتراب من الباب الصلب — يشعل حوار الوداع تلقائياً

    FRAME_STEPS: 2,        // نقطة قدم كل إطارين مشي

    imagesReady: false,



    /* -------------------------------------------------------

       الكتابة الحرفية للحوار (مثل المشهد الأول)

       ------------------------------------------------------- */

    TYPE_SPEED: 26,   // مدة كل حرف (ms)

    TYPE_JITTER: 18,  // تذبذب عشوائي

    typeTimer: null,

    typingLine: null, // { text, shown } — أثناء الكتابة الحرفية



    /* -------------------------------------------------------

       دورة الحياة

       opts: { embedded, onClose, jumpTo }

         jumpTo = 'moon' → متابعة مباشرة على سطح القمر (الفصل الأول)

       ------------------------------------------------------- */

    start({ embedded = false, onClose = null, jumpTo = null } = {}) {

      this.embedded = embedded;

      this.onClose = onClose;

      this.running = true;



      this.lang = localStorage.getItem(LANG_KEY) || 'en';



      this.canvas = document.getElementById('scene2Canvas');

      this.ctx = this.canvas.getContext('2d');

      this.host = document.getElementById('sceneHost2') || document.body;

      this.dpr = Math.min(window.devicePixelRatio || 1, 2);



      this.resize();



      this.keys = { left: false, right: false, e: false };

      this.vx = 0;

      this.anim = 'idle';

      this.frameIdx = 0;

      this.frameTimer = 0;

      this.lastWalkFrame = 0;

      this.hasMoved = false;

      this.room = 0;

      this.exitOpen = false;

      this.transitioning = false;

      this.autoWalk = false;

      this.paused = false;

      this.dialogueActive = false;

      this.dialogue = null;

      this.podStage = false;

      // حالة «الفصل الأول» — سطح القمر

      this.chapterStarted = false;

      this.chapter = false;

      this.oxyResolved = false;

      this.plaqueTaken = false;

      this._cardOpen = false;

      this._chapterE = null;

      this.holoRot = 0;

      this.holoSolved = false;

      this._holoSfxAt = 0;

      this._holoDrag = false;

      this._holoLastA = null;

      this._holoWheel = null;

 // تكملة القمر — الاسكربت المطور: 7 مشاهد 

      this.footprintsDone = false;   // فحص آثار أبولو 11 انتهى (المشهد 2)

      this.flagDone = false;         // فحص العلم الأبيض انتهى (المشهد 2 — يفتح الشرق)

      this.psepSeen = false;         // فحص محطة PSEP انتهى (المشهد 3 — يفتح الشرق)

      this.lrrrSeen = false;         // فحص عاكس LRRR انتهى (المشهد 4)

      this.laserFailSeen = false;    // محاولة المعايرة فشلت — البطارية متجمدة (المشهد 4 — يفتح الشرق)

      this.tracksSeen = false;       // فحص مسارات العجلات انتهى (المشهد 5 — يفتح الشرق)

      this.lrvSeen = false;          // فحص عربة LRV انتهى (المشهد 6)

      this.wheelsSeen = false;       // فحص العجلات (المشهد 6 — مكوّن 1)

      this.cameraSeen = false;       // فحص الكاميرا الشاخصة (المشهد 6 — مكوّن 2)

      this.dishDiscovered = false;   // اكتشاف حلقة العودة الذكية عند الطبق (المشهد 6 — مكوّن 3)

      this.rhuSolved = false;        // إذابة صقيع بطارية الليزر نجحت (حلقة العودة — المهمة 10)

      this.lrrrSolved = false;       // لغز معايرة الليزر نجح (حلقة العودة — المهمة 11)

      this.antennaSolved = false;    // بث نداء الاستغاثة نجح (المهمة 12) = مركبة العبور هبطت

      this.boarded = false;          // طارق صعد لمركبة العبور (المشهد 7 — المهمة 13)

      this.rhuEl = null;             // عنصر لغز RHU

      this.laserEl = null;           // عنصر لغز الليزر

      this.antennaEl = null;         // عنصر لغز الهوائي

      this.lunarTaskEl = null;       // لافتة المهمة الحالية (سلسلة المشاهد)

      this.chapterTimers = [];

      this.onChapterDialogueClosed = null;

      this.chapterVideoEl = null;

      this.badgeEl = null;

      this.blackEl = null;

      this._chapterPreloadEls = null;   // يُعاد إنشاؤه عند الخاتمة القادمة

      this.hologramEl = null;

      this.plaqueCardEl = null;

      this.oxyMissionEl = null;   // مرحلة الانطلاق: تبدأ بعد حوار طارق → كل الأسهم تتجه يميناً للكبسولة

      this.beaconIntroSeen = false;

      this.endAction = null;         // إجراء نقرة بطاقة النهاية (بدل العودة للقائمة)



 /* حالة الفصل الثاني «حديقة التراث الفضائي» (الاسكربت الجديد) — */

      this.marsMode = false;         // اللاعب زين على المريخ

      this.plainSeen = false;        // وصل السهل الليلي مرة واحدة على الأقل

      this.habitatIntroDone = false; // حوار المأوى الافتتاحي انتهى

      this.beaconTaken = false;      // منارة الاستقبال التُقطت من الطاولة

      this.doorOpened = false;       // بوابة العزل فُتحت (حرف E على الباب)

      this.sojournerSeen = false;    // محطة سوجورنر فُحصت

      this.insightSeen = false;      // محطة إنسايت فُحصت

      this.oppySeen = false;         // حوار أوبي انتهى

      this.beaconMounted = false;    // المنارة رُكبت فوق صارية أوبي

 this.sunriseDone = false; // غرفة الشروق زُيارت (غرفة مشي عادية)

      this.beamEl = null;            // شعاع المنارة الأزرق فوق أوبي

      this.teamEl = null;            // شاشة فريق NileStro

      this.reunionDone = false;

 /* حالة خاتمة الفريق «خلف الكواليس» — */

      this.creditsMode = false;      // المشي داخل مكاتب فريق NileStro (الغرف 22..25)

      this.credSeen = [false, false, false, false];  // حوارات المكاتب الأربعة انتهت

      this.credIntroEl = null;       // بطاقة الانتقال السينمائية

      this.credWaveEl = null;        // شاشة التوديع الجماعية

      this.honorShown = false;

      this.finaleEl = null;          // شاشة الختام (لوحة الشرف + الرسالة)

      this.honorEl = null;

      this.extraImgs = {};           // صور التبديل (بوابة العزل المفتوحة)

 // + جسم عاكس LRRR فوق خلفية الوادي 



      // تصفير حالة المشهد الطارئ (مهم عند إعادة اللعب)

      this.cutsceneActive = false;

      this.impactTriggered = false;

      this.crisis = false;

      this.farewellDone = false;

      this.playerChar = 'zain';

      this.videoEl = null;

      this.warnEl = null;

      this.missionEl = null;

      this.cutsceneTimers = [];

      this.onScriptArrive = null;

      this.cutsceneVideoEl = null;

      this.cutsceneVideoDone = null;

      this._cutsceneFinish = null;

      this.epilogueEl = null;

      this.epilogueEnded = false;



      // مؤقتات انتقال الغرف — تُنشأ جديدة كل جولة

      this.transitionTimers = [];



      // تصفير إضافات v1.2

      this.touchEl = null;

      this.manualBtnEl = null;

      this.rotateEl = null;

      this.skipHintEl = null;

      this.goalEl = null;

      this.endCardEl = null;

      this.chapterEndReady = false;

      this.eastOpen = false;

      this.loadProgress = 0;

      this._pendingJump = (jumpTo === 'moon' || jumpTo === 'mars') ? jumpTo : null;



      // قد يكون سياق الصوت معلقاً إذا جاء الإطلاق خارج نقرة المستخدم

      Sfx.ensure();



      if (this._pendingJump === 'moon') {

        // متابعة على سطح القمر: أسود فوري يغطي التحميل ثم ظهور طارق

        // بنفس مكانه أمام الباب المفتوح (مطابق لنهاية فيديو الخروج)

        this.cutsceneActive = true;

        this.crisis = true;

        this.playerChar = 'tariq';

        this.chapter = true;

        this.chapterStarted = true;   // يمنع إعادة إطلاق سلسلة فيديوهات البداية

        this.room = 7;

        this.hasMoved = true;

        this.charX = Math.round(this.W * 0.19);

        this.facing = 1;

        this.anim = 'idle';

        this.autoWalk = false;

        // حافة الشرق فعالة بعد لوحة الذكريات — بدونه لا تنطلق نهاية الفصل

        // عند المتابعة المباشرة (المسار الطبيعي يضبطها عبر سلسلة الأزمة)

        this.exitOpen = true;

        this.saveStage('moon');

        this.blackOn();

      } else {

        this.charX = this.W - this.startX();

        this.facing = 1;

        this.clampX();

        this.saveStage('scene2');

      }



      this.bindKeys();

      this.setupInstructions();

      this.setupRoomUI();

      this.setupTouchControls();



      this.imagesReady = false;

      this.lastTime = performance.now();

      this.loop(this.lastTime);



      this.loadImages()

        .then(() => {

          this.idleMeta = this.extractSheetMeta(this.idleSheet);

          this.walkMeta = this.extractSheetMeta(this.walkSheet);

          this.tariqMeta = this.extractSheetMeta(this.tariqSheet);

          this.tariqWalkMeta = this.extractSheetMeta(this.tariqWalkSheet);

 /* استخراج ميتا أوراق الفريق (محمد + ملك + رانيا + مازن) */

          this.mohamedMeta = this.extractSheetMeta(this.mohamedSheet);

          this.mohamedWalkMeta = this.extractSheetMeta(this.mohamedWalkSheet);

          this.malakMeta = this.extractSheetMeta(this.malakSheet);

          this.ranyaMeta = this.extractSheetMeta(this.ranyaSheet);

          this.mazenMeta = this.extractSheetMeta(this.mazenSheet);



          // توحيد الطول البصري بين idle و walk (الفارق في الأوراق ~17%)

          if (this.idleMeta.h > 0 && this.walkMeta.h > 0) {

            this.idleMeta.scale = this.idleScale;

            this.walkMeta.scale = (this.idleScale * this.idleMeta.h) / this.walkMeta.h;

          }



          // طارق: نفس الطول البصري لزين بالضبط (idle + walk)

          if (this.tariqMeta.h > 0) {

            this.tariqMeta.scale = this.IDLE_HEIGHT / this.tariqMeta.h;

          }

          if (this.tariqWalkMeta.h > 0) {

            this.tariqWalkMeta.scale = this.IDLE_HEIGHT / this.tariqWalkMeta.h;

          }



 /* محمد: نفس طول زين وطارق بالضبط، و idle مطابق لـ walk.

             (الأوراق نفسها مُوحَّدة offline على ارتفاع محتوى 116px) */

          if (this.mohamedMeta && this.mohamedMeta.h > 0) {

            this.mohamedMeta.scale = this.IDLE_HEIGHT / this.mohamedMeta.h;

          }

          if (this.mohamedWalkMeta && this.mohamedWalkMeta.h > 0) {

            this.mohamedWalkMeta.scale = this.IDLE_HEIGHT / this.mohamedWalkMeta.h;

          }

          // أعضاء الفريق الثلاثة: كلهم بنفس الطول البصري تماماً

          if (this.malakMeta && this.malakMeta.h > 0) {

            this.malakMeta.scale = this.IDLE_HEIGHT / this.malakMeta.h;

          }

          if (this.ranyaMeta && this.ranyaMeta.h > 0) {

            this.ranyaMeta.scale = this.IDLE_HEIGHT / this.ranyaMeta.h;

          }

          if (this.mazenMeta && this.mazenMeta.h > 0) {

            this.mazenMeta.scale = this.IDLE_HEIGHT / this.mazenMeta.h;

          }



          this.imagesReady = true;



          // متابعة سطح القمر: دخول سينمائي بعد جهوزية الأصول

          if (this._pendingJump === 'moon' && this.running) {

            this._pendingJump = null;

            this.enterMoonRoomDirect();

          }

          // متابعة المريخ: دخول سينمائي بعد جهوزية الأصول

          if (this._pendingJump === 'mars' && this.running) {

            this._pendingJump = null;

            this.enterMarsRoomDirect();

          }

        })

        .catch((err) => {

          console.error('Scene2 load failed:', err);

          this.imagesReady = true;

          if (this._pendingJump === 'moon' && this.running) {

            this._pendingJump = null;

            this.enterMoonRoomDirect();

          }

          if (this._pendingJump === 'mars' && this.running) {

            this._pendingJump = null;

            this.enterMarsRoomDirect();

          }

        });

    },



    get idleScale() {

      return this.idleMeta && this.idleMeta.h > 0 ? this.IDLE_HEIGHT / this.idleMeta.h : 1.5;

    },



    startX() {

      // ثبيت زين على اليمين — نسبة من عرض الشاشة بحدود معقولة

      return Math.min(320, Math.max(200, this.W * 0.16));

    },



    stop() {

      this.running = false;



      if (this.rafId) cancelAnimationFrame(this.rafId);

      this.rafId = null;



      this.stopTyping();

      this.unbindKeys();



      // إغلاق دليل ناسا إن كان مفتوحاً عند إيقاف المشهد

      if (window.Manual && window.Manual.isOpen()) window.Manual.close();



      const remove = (el) => { if (el && el.parentNode) el.parentNode.removeChild(el); };

      remove(this.instructionsEl);

      remove(this.toastEl);

      remove(this.dialogueEl);

      remove(this.exitHintEl);

      remove(this.gearBtn);

      remove(this.manualBtnEl);

      remove(this.rotateEl);

      remove(this.modalEl);

      remove(this.fadeEl);

      remove(this.warnEl);

      remove(this.missionEl);

      remove(this.cutsceneVideoEl);

      remove(this.epilogueEl);

      if (this.videoEl) { try { this.videoEl.pause(); } catch (_) {} }

      remove(this.videoEl);

      if (this.host) this.host.classList.remove('screen-shake');



      this.instructionsEl = null;

      this.dialogueEl = null;

      this.exitHintEl = null;

      this.exitHintSide = null;   // تصفير جهة السهم القديمة (تمنع السلوك العالق عند إعادة اللعب)

      this.gearBtn = null;

      this.modalEl = null;

      this.fadeEl = null;

      this.toastEl = null;

      this.instructionsShown = false;

      this.dialogueActive = false;

      this.dialogue = null;



      // تنظيف المشهد الطارئ بالكامل + فيديوهات الأزمة

      this.cutsceneTimers.forEach(clearTimeout);

      this.cutsceneTimers = [];

      this.transitionTimers.forEach(clearTimeout);

      this.transitionTimers = [];

      this.cutsceneActive = false;

      this.impactTriggered = false;

      this.crisis = false;

      this.farewellDone = false;

      this.playerChar = 'zain';

      this.videoEl = null;

      this.warnEl = null;

      this.missionEl = null;

      this.onScriptArrive = null;

      this.cutsceneVideoEl = null;

      this.cutsceneVideoDone = null;

      this._cutsceneFinish = null;

      this.epilogueEl = null;

      this.epilogueEnded = false;

      for (const idx of Object.keys(this.roomVideos)) {

        const v = this.roomVideos[idx];

        if (v) { try { v.pause(); } catch (_) {} remove(v); }

      }

      this.roomVideos = {};



      // تنظيف عناصر «الفصل الأول» — سطح القمر

      this.chapterTimers.forEach(clearTimeout);

      this.chapterTimers = [];

      this.onChapterDialogueClosed = null;

      this.chapterStarted = false;

      this.chapter = false;

      this.oxyResolved = false;

      this.plaqueTaken = false;

      this._chapterE = null;

      this._cardOpen = false;

      this.holoSolved = false;

      this.holoRot = 0;

      const removeCh = (el) => { if (el && el.parentNode) el.parentNode.removeChild(el); };

      removeCh(this.chapterVideoEl);

      // مسح احتياطي: قد يبقى فيديو سينمائي سابق معلقاً أثناء القطع المباشر

      // (مثلاً بين نهاية فتح الباب وجهوزية أول فريم للخروج عند الخروج للقائمة)

      if (this.host) {

        this.host.querySelectorAll('.cutscene-video').forEach((el) => el.remove());

      }

      // عناصر التحميل المسبق لفيديوهات الفصل — تُترك لجامع القمامة بعد إفراغ المصدر

      if (this._chapterPreloadEls) {

        this._chapterPreloadEls.forEach((v) => {

          try { v.pause(); v.removeAttribute('src'); v.load(); } catch (_) {}

        });

        this._chapterPreloadEls = null;

      }

      removeCh(this.badgeEl);

      removeCh(this.blackEl);

      removeCh(this.hologramEl);

      removeCh(this.plaqueCardEl);

      removeCh(this.oxyMissionEl);

      // تنظيف ألغاز تكملة القمر وعناصرها

      if (this._rhuTimer)  { clearInterval(this._rhuTimer);  this._rhuTimer = null; }

      if (this._laserTimer){ clearInterval(this._laserTimer);this._laserTimer = null; }

      if (this._antTimer)  { clearInterval(this._antTimer);  this._antTimer = null; }

      removeCh(this.rhuEl);

      removeCh(this.laserEl);

      removeCh(this.antennaEl);

      removeCh(this.lunarTaskEl);



 /* تنظيف المشهد السابع والإطلاق — */

      this.boarded = false;

      this.endAction = null;

      // عناصر التحميل المسبق للتوسعة

      if (this._expansionPreload) {

        this._expansionPreload.forEach((v) => {

          try { v.pause(); v.removeAttribute('src'); v.load(); } catch (_) {}

        });

        this._expansionPreload = null;

      }



 /* تنظيف الفصل الثاني ( / ) — */

      removeCh(this.beamEl);

      removeCh(this.teamEl);

      removeCh(this.finaleEl);

      removeCh(this.honorEl);

      this.beamEl = null;

      this.teamEl = null;

      this.finaleEl = null;

      this.honorEl = null;

      this.marsMode = false;

      this.reunionDone = false;

      this.honorShown = false;



      this.chapterVideoEl = null;

      this.badgeEl = null;

      this.blackEl = null;

      this.hologramEl = null;

      this.plaqueCardEl = null;

      this.oxyMissionEl = null;

      this.rhuEl = null;

      this.laserEl = null;

      this.antennaEl = null;

      this.lunarTaskEl = null;

      this._rhuHold = false;

      this._rhuSolved = false;

      this._laserSolved = false;

      this._antSolved = false;

      this._holoWheel = null;

      this._holoDrag = false;

      this._holoLastA = null;



      // تنظيف إضافات v1.2

      removeCh(this.touchEl);

      removeCh(this.skipHintEl);

      removeCh(this.goalEl);

      removeCh(this.endCardEl);

      this.touchEl = null;

      this.manualBtnEl = null;

      this.rotateEl = null;

      this.skipHintEl = null;

      this.goalEl = null;

      this.endCardEl = null;

      this.chapterEndReady = false;

      this.eastOpen = false;

      this._pendingJump = null;

      this.loadProgress = 0;



      clearTimeout(this.toastTimer);



      this.keys = { left: false, right: false, e: false };

      this.vx = 0;

    },



    /* -------------------------------------------------------

       الحفظ — تحديث «أبعد مرحلة وصلها اللاعب»

       المراحل: 'scene2' → 'moon' → 'complete'

       ------------------------------------------------------- */

    saveStage(stage) {

      try {

        localStorage.setItem(SAVE_KEY, JSON.stringify({

          stage,

          name: stage,

          timestampMs: Date.now(),

        }));

      } catch (_) {}

    },



    /* -------------------------------------------------------

       المقاس والـ DPR (بيكسل حاد)

       ------------------------------------------------------- */

    _resizeBound: null,



    resize() {

      this.W = window.innerWidth;

      this.H = window.innerHeight;



      if (this.canvas && this.ctx) {

        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width  = Math.round(this.W * this.dpr);

        this.canvas.height = Math.round(this.H * this.dpr);

        this.canvas.style.width  = this.W + 'px';

        this.canvas.style.height = this.H + 'px';



        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        this.ctx.imageSmoothingEnabled = false;

      }



      // قبل أول حركة: أعد تثبيت زين على يمين الشاشة عند تغيّر المقاس

      if (this.running && !this.hasMoved && !this.transitioning) {

        this.charX = this.W - this.startX();

      }



      this.clampX();

    },



    /** موضع طارق الثابت في الغرفة الثالثة — نسبة من عرض الشاشة */

    tariqX() {

      return Math.round(this.W * 0.56);

    },



    /** موضع طارق NPC في الغرفة 5 (بعد الاصطدام) — على اليسار */

    tariqCrisisX() {

      return Math.round(this.W * 0.28);

    },



    /** حدود الباب الجداري (الحائط السفيل بين الحجرتين) في الغرفة 5

     *  room-corridor-damaged — الحائط الصلب يغطي من 45% إلى 63% من إطار المصدر

     *  يُحسب بإحداثيات الشاشة عن طريق تغطية الفيديو (drawCover) */

    crisisDoorRange() {

      const v = this.roomVideos[5] || this.videoEl;

      const vw = (v && v.videoWidth) || 1920;

      const vh = (v && v.videoHeight) || 1080;

      const scale = Math.max(this.W / vw, this.H / vh);

      const dw = vw * scale;

      const dx = (this.W - dw) / 2;

      return {

        left:  dx + 0.45 * vw * scale,

        right: dx + 0.63 * vw * scale,

      };

    },



    /** نقطة توقف طارق بجانب الكرسي في الغرفة 6 — يقف على يمين الكرسي (جسم صلب)

     *  ويلتف للقمر عبر النافذة. الحافة اليمنى للكرسي ≈ 1005 بإحداثيات room-cockpit-damaged */

    chairStopX() {

      const img = this.roomImgs[6];

      const iw = (img && img.naturalWidth) || 2752;

      const ih = (img && img.naturalHeight) || 1536;

      const scale = Math.max(this.W / iw, this.H / ih);

      const dw = iw * scale;

      const dx = (this.W - dw) / 2;

      const chairEdge = dx + 1005 * scale; // الحافة اليمنى للكرسي + هامش صغير

      const half = this.charHalf();

      return Math.min(this.W - half - 10, Math.max(half + 10, Math.round(chairEdge + half + 4)));

    },



    clampX() {

      // الحد = نصف عرض الشخصية الفعلي (وليس الخلية كاملة)

      const meta = this.anim === 'walk' ? this.walkMeta : this.idleMeta;

      const half = meta ? (meta.w * meta.scale) / 2 : this.CELL / 4;

      if (this.charX < half) this.charX = half;

      if (this.charX > this.W - half) this.charX = Math.max(half, this.W - half);



      // الغرفة الثالثة: طارق جسم صلب — زين يتوقف أمامه فوراً

      // (لا يتجاوزه ولا يمشي من خلاله ولا يغطي عليه)

      // ملاحظة: يصدق دائماً (حتى أثناء الحوارات/الانتقالات) — زين لا يمكن

      // أن يظل في الجهة اليسرى لطارق إطلاقاً؛ حتى لا يُحاصَر بين جسمه والجدار

      if (this.room === 2 && this.tariqMeta && this.tariqMeta.w > 0) {

        const th = (this.tariqMeta.w * this.tariqMeta.scale) / 2;

        const gap = half + th + 2;   // فجوة كاملة = عرض الشخصيتين (بدون أي تداخل بصري)

        const tx = this.tariqX();

        if (this.charX <= tx) {

          this.charX = tx + gap;          // جهة وصول زين دائماً على يمين طارق

        } else if (Math.abs(this.charX - tx) < gap) {

          this.charX = tx + gap;          // التوقف الفوري بأقل مسافة ممكنة

        }

      }



      // الغرفة 5 (بعد الاصطدام): الباب الجداري بين الحجرتين كتلة صلبة

      // — لا يمكن المشي فوقه ولا عبره. زين (على اليمين) يتوقف أمامه،

      // وطارق (على اليسار) لا يعبر الجدار يميناً.

      if (this.crisis && this.room === 5) {

        const door = this.crisisDoorRange();

        if (this.playerChar === 'zain') {

          // الباب الصلب — زين لا يقدّم أبعد من حافته اليمنى

          const doorStop = door.right + half + 4;

          if (this.charX < doorStop) this.charX = doorStop;



          // طارق جسم صلب (احتياطي — زين لا يستطيع الوصول إليه أصلاً)

          const th5 = (this.tariqMeta && this.tariqMeta.w > 0)

            ? (this.tariqMeta.w * this.tariqMeta.scale) / 2 : 60;

          const npcX = this.tariqCrisisX();

          const gap5 = half + th5 + 2;

          if (this.charX <= npcX) {

            this.charX = npcX + gap5;

          } else if (Math.abs(this.charX - npcX) < gap5) {

            this.charX = npcX + gap5;

          }

          // باب كبسولة زين على اليمين — كتلة صلبة

          const doorLimit = Math.round(this.W * 0.86) - half - 2;

          if (this.charX > doorLimit) this.charX = doorLimit;

        } else {

          // طارق (اللاعب بعد الوداع) لا يعبر الجدار السفيل يميناً

          const tariqDoorStop = door.left - half - 4;

          if (this.charX > tariqDoorStop) { this.charX = tariqDoorStop; this.facing = -1; }

        }

      }



      // الغرفة 6 (القمرة المتضررة): الكرسي جسم صلب — طارق لا يمشي فوقه ولا عبره

      // يدخل الغرفة دائماً من اليمين، فيتكفي أن نمنع النزول عن الحافة اليمنى للكرسي

      if (this.crisis && this.room === 6) {

        const stopX = this.chairStopX();

        if (this.charX < stopX) { this.charX = stopX; this.facing = 1; }

      }

    },



    charHalf() {

      const meta = this.anim === 'walk' ? this.walkMeta : this.idleMeta;

      return meta ? (meta.w * meta.scale) / 2 : this.CELL / 4;

    },



    /* -------------------------------------------------------

       واجهة المشهد: الترس + الإعدادات + زر القائمة + طبقة الانتقال

       ------------------------------------------------------- */

    setupRoomUI() {

      if (this.gearBtn && this.gearBtn.parentNode) return;



      // زر الترس

      const gear = document.createElement('button');

      gear.type = 'button';

      gear.className = 'gear-btn';

      gear.title = UI[this.lang].gearLabel;

      gear.setAttribute('aria-label', UI[this.lang].gearLabel);

      gear.innerHTML = `

        <svg viewBox="0 0 24 24" aria-hidden="true">

          <path d="M19.4 13c.05-.33.08-.66.08-1s-.03-.67-.08-1l2.15-1.63c.19-.14.24-.42.12-.63l-2.03-3.52c-.12-.21-.39-.3-.61-.21l-2.53 1.02a7.8 7.8 0 0 0-1.72-1L14.4 2.4a.5.5 0 0 0-.5-.4h-4.06a.5.5 0 0 0-.5.4l-.38 2.65c-.62.26-1.2.6-1.72 1l-2.53-1.02a.5.5 0 0 0-.61.21l-2.03 3.52a.5.5 0 0 0 .12.63L4.85 11c-.05.33-.08.66-.08 1s.03.67.08 1l-2.15 1.63a.5.5 0 0 0-.12.63l2.03 3.52c.12.21.39.3.61.21l2.53-1.02c.52.4 1.1.74 1.72 1l.38 2.65c.04.23.24.4.5.4h4.06c.26 0 .46-.17.5-.4l.38-2.65c.62-.26 1.2-.6 1.72-1l2.53 1.02c.22.09.49 0 .61-.21l2.03-3.52a.5.5 0 0 0-.12-.63L19.4 13ZM12.12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Z"/>

        </svg>

        <span class="kbd-mini">ESC</span>

      `;

      gear.addEventListener('click', () => this.openModal());

      this.host.appendChild(gear);

      this.gearBtn = gear;



      // زر الدليل — يفتح «دليل المهمة ومصادر ناسا» (أو مفتاح M)

      const manualBtn = document.createElement('button');

      manualBtn.type = 'button';

      manualBtn.className = 'manual-btn';

      manualBtn.title = UI[this.lang].manualLabel;

      manualBtn.setAttribute('aria-label', UI[this.lang].manualLabel);

      manualBtn.innerHTML = `

        <svg viewBox="0 0 24 24" aria-hidden="true">

          <path d="M5.5 3A2.5 2.5 0 0 0 3 5.5v13A2.5 2.5 0 0 0 5.5 21H20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H5.5Z"/>

          <path d="M5.5 5H7v14H5.5a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5Z"/>

          <path d="M10 7.5h7M10 11h7M10 14.5h4.5" stroke="#06210f" stroke-width="1.6" stroke-linecap="round"/>

        </svg>

        <span class="kbd-mini">M</span>

      `;

      manualBtn.addEventListener('click', () => this.openManual());

      this.host.appendChild(manualBtn);

      this.manualBtnEl = manualBtn;



      // قفل الاتجاه الأفقي: على الجوال في الوضع الرأسي تظهر لافتة «أدر جهازك»

      // (تُدار بالكامل من CSS — media query للوضع الرأسي + أجهزة اللمس فقط)

      const rot = document.createElement('div');

      rot.className = 'rotate-overlay';

      rot.setAttribute('aria-hidden', 'true');

      rot.innerHTML = `

        <svg viewBox="0 0 24 24" aria-hidden="true">

          <rect x="7" y="3" width="10" height="18" rx="2"/>

          <path d="M3 8a9 9 0 0 1 3.2-5.2L8 4.5M3 8l-1.8-.9M3 8l-.6-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>

          <path d="M21 16a9 9 0 0 1-3.2 5.2L16 19.5M21 16l1.8.9M21 16l.6 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>

        </svg>

        <p class="rot-en">ROTATE YOUR DEVICE<br><span>OSIRIS plays in landscape</span></p>

        <p class="rot-ar">أدر جهازك أفقيًا<br><span>أوزيريس تُلعب في الوضع الأفقي</span></p>

      `;

      this.host.appendChild(rot);

      this.rotateEl = rot;



      // طبقة تعتيم انتقال الغرف

      const fade = document.createElement('div');

      fade.className = 'room-fade';

      this.host.appendChild(fade);

      this.fadeEl = fade;



      // نافذة الإعدادات

      const modal = document.createElement('div');

      modal.className = 's2-modal-overlay hidden';

      modal.innerHTML = `

        <div class="s2-modal">

          <h3 class="s2-title"></h3>

          <div class="s2-row">

            <span class="s2-volume-label"></span>

            <input type="range" id="s2Volume" min="0" max="100" step="1" />

            <span class="s2-volume-value"></span>

          </div>

          <div class="s2-row">

            <span class="s2-lang-label"></span>

            <button type="button" class="s2-lang-btn s2-btn"></button>

          </div>

          <button type="button" class="s2-manual-btn s2-btn"></button>

          <button type="button" class="s2-menu-btn s2-btn danger"></button>

          <button type="button" class="s2-close-btn s2-btn primary"></button>

        </div>

      `;

      modal.addEventListener('click', (e) => {

        if (e.target === modal) this.closeModal();

      });

      const volEl = modal.querySelector('#s2Volume');

      volEl.addEventListener('input', () => {

        localStorage.setItem(VOLUM_KEY, volEl.value);

        window.GameVolume = Number(volEl.value) / 100;

        modal.querySelector('.s2-volume-value').textContent = volEl.value;

        Sfx.ensure();

        Sfx.advance(); // عيّنة صوت أثناء تحريك المنزلق

      });

      modal.querySelector('.s2-lang-btn').addEventListener('click', () => {

        Sfx.ensure();

        Sfx.advance();

        this.lang = this.lang === 'ar' ? 'en' : 'ar';

        localStorage.setItem(LANG_KEY, this.lang);

        this.syncModalTexts();

        // زر الدليل يتبع اللغة الحالية

        if (this.manualBtnEl) {

          this.manualBtnEl.title = UI[this.lang].manualLabel;

          this.manualBtnEl.setAttribute('aria-label', UI[this.lang].manualLabel);

        }

        // والدليل نفسه إن كان مفتوحاً يعاد بناؤه بلغة العرض الجديدة

        if (window.Manual && window.Manual.isOpen()) window.Manual.setLang(this.lang);

        if (this.instructionsShown && this.instructionsEl) this.setupInstructions();

        if (document.documentElement) {

          document.documentElement.lang = this.lang;

          document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr';

        }

      });

      // زر الدليل داخل الإعدادات — يفتح نافذة «دليل المهمة ومصادر ناسا»

      modal.querySelector('.s2-manual-btn').addEventListener('click', () => {

        Sfx.ensure();

        Sfx.advance();

        this.closeModal();

        this.openManual();

      });



      // زر العودة للقائمة الرئيسية

      modal.querySelector('.s2-menu-btn').addEventListener('click', () => {

        Sfx.ensure();

        Sfx.menuGo();

        this.returnToMenu();

      });

      modal.querySelector('.s2-close-btn').addEventListener('click', () => this.closeModal());



      this.host.appendChild(modal);

      this.modalEl = modal;

      this.syncModalTexts();

    },



    syncModalTexts() {

      if (!this.modalEl) return;

      const ui = UI[this.lang];

      this.modalEl.querySelector('.s2-title').textContent = ui.title;

      this.modalEl.querySelector('.s2-volume-label').textContent = ui.volume;

      this.modalEl.querySelector('.s2-lang-label').textContent = ui.language;

      this.modalEl.querySelector('.s2-close-btn').textContent = ui.close;

      this.modalEl.querySelector('.s2-menu-btn').textContent = ui.mainMenu;

      this.modalEl.querySelector('.s2-manual-btn').textContent = '📖 ' + ui.manualRow;

      const langBtn = this.modalEl.querySelector('.s2-lang-btn');

      langBtn.textContent = this.lang === 'ar' ? 'English' : 'العربية';



      const vol = Number(localStorage.getItem(VOLUM_KEY) ?? 70);

      const volEl = this.modalEl.querySelector('#s2Volume');

      volEl.value = vol;

      this.modalEl.querySelector('.s2-volume-value').textContent = vol;

    },



    openModal() {

      if (!this.modalEl) return;

      // الدليل مفتوح → لا نفتح الإعدادات فوقه

      if (window.Manual && window.Manual.isOpen()) return;

      // الإعدادات لا تُفتح فوق لغز الهولوجرام (تظهر فوقه طبقاته)

      if (this.hologramEl) return;

      // ولا فوق ألغاز تكملة القمر (الحرارة/الليزر/الهوائي)

      if (this.rhuEl || this.laserEl || this.antennaEl) return;

      // ولا أثناء السينما بدون حوار — تُوقف التسلسل وتفسده

      if (this.cutsceneActive && !this.dialogueActive) return;

      Sfx.ensure();

      Sfx.modalOpen();

      this.paused = true;

      this.syncModalTexts();

      this.modalEl.classList.remove('hidden');

    },



    closeModal() {

      if (!this.modalEl) return;

      Sfx.ensure();

      Sfx.modalClose();

      this.modalEl.classList.add('hidden');

      this.paused = false;

    },



    /* -------------------------------------------------------

       دليل المهمة ومصادر ناسا — نافذة js/manual.js

       (نفس حارسات الإعدادات: لا تُفتح فوق الألغاز أو السينما)

       ------------------------------------------------------- */

    openManual() {

      if (!window.Manual) return;

      if (window.Manual.isOpen()) return;

      // لا تُفتح فوق لغز الهولوجرام أو ألغاز تكملة القمر

      if (this.hologramEl || this.rhuEl || this.laserEl || this.antennaEl) return;

      // ولا أثناء السينما بدون حوار

      if (this.cutsceneActive && !this.dialogueActive) return;

      Sfx.ensure();

      Sfx.modalOpen();

      this.paused = true;

      window.Manual.open({

        lang: this.lang,

        onClose: () => { this.paused = false; },

      });

    },



    /** العودة إلى شاشة القائمة الرئيسية (index.html) */

    returnToMenu() {

      if (this.embedded && typeof this.onClose === 'function') this.onClose();

      else location.href = 'index.html';

    },



    /* -------------------------------------------------------

       لوحة الإرشادات

       ------------------------------------------------------- */

    setupInstructions() {

      if (this.instructionsEl && this.instructionsEl.parentNode) {

        this.instructionsEl.parentNode.removeChild(this.instructionsEl);

      }



      const isAr = this.lang === 'ar';

      let html = INSTRUCTIONS[isAr ? 'ar' : 'en'];



      // على الأجهزة اللمسية: سطر إضافي يشرح أزرار اللمس

      if (isTouchDevice()) {

        const hint = `<p class="panel-touch">${CHAPTER1_UI[isAr ? 'ar' : 'en'].touchHint}</p>`;

        html = html.replace('</h2>', '</h2>' + hint);

      }



      const panel = document.createElement('div');

      panel.className = 'instructions-panel' + (isAr ? '' : ' lang-en');

      panel.dir = isAr ? 'rtl' : 'ltr';

      panel.innerHTML = html;



      this.host.appendChild(panel);

      this.instructionsEl = panel;

      this.instructionsShown = true;

    },



    hideInstructions() {

      if (!this.instructionsShown || !this.instructionsEl) return;

      this.instructionsEl.classList.add('hidden');

      this.instructionsShown = false;

    },



    showToast(text) {

      if (!this.toastEl) {

        this.toastEl = document.createElement('div');

        this.toastEl.className = 'scene2-toast';

        this.host.appendChild(this.toastEl);

      }

      this.toastEl.textContent = text;

      this.toastEl.classList.add('show');



      clearTimeout(this.toastTimer);

      this.toastTimer = setTimeout(() => {

        if (this.toastEl) this.toastEl.classList.remove('show');

      }, 1500);

    },



    /* -------------------------------------------------------

       أزرار التحكم اللمسية — تظهر تلقائياً على الأجهزة اللمسية

       (يسار/يمين للحركة + E للتفاعل — تُخفى عند عدم وجود لمس)

       ------------------------------------------------------- */

    setupTouchControls() {

      if (this.touchEl && this.touchEl.parentNode) return;

      if (!isTouchDevice()) return;



      const wrap = document.createElement('div');

      wrap.className = 'touch-controls';

      wrap.dir = 'ltr';   // الأزرار فيزيائية — لا تقلب مع اللغة

      wrap.innerHTML = `

        <div class="tc-group tc-left">

          <button type="button" class="tc-btn" data-dir="left" aria-label="Left">◀</button>

        </div>

        <div class="tc-group tc-right">

          <button type="button" class="tc-btn tc-e" aria-label="Interact">E</button>

          <button type="button" class="tc-btn" data-dir="right" aria-label="Right">▶</button>

        </div>

      `;

      this.host.appendChild(wrap);

      this.touchEl = wrap;



      const btnL = wrap.querySelector('[data-dir="left"]');

      const btnR = wrap.querySelector('[data-dir="right"]');

      const btnE = wrap.querySelector('.tc-e');



      const hold = (btn, onDown, onUp) => {

        btn.addEventListener('pointerdown', (e) => {

          e.preventDefault();

          e.stopPropagation();

          Sfx.ensure();

          btn.classList.add('held');

          onDown();

        });

        const up = (e) => {

          e.stopPropagation();

          btn.classList.remove('held');

          onUp();

        };

        btn.addEventListener('pointerup', up);

        btn.addEventListener('pointercancel', up);

        btn.addEventListener('pointerleave', up);

        // منع القائمة السياقية عند الضغط المطوّل

        btn.addEventListener('contextmenu', (e) => e.preventDefault());

      };



      hold(btnL, () => { this.keys.left = true;  }, () => { this.keys.left = false; });

      hold(btnR, () => { this.keys.right = true; }, () => { this.keys.right = false; });



      hold(btnE, () => {

        // أثناء لغز الهولوجرام: زر E يدوّر الصمام (مثل الكيبورد)

        if (this.hologramEl && !this.holoSolved) {

          this.applyHoloRot(14);

          return;

        }

        // ألغاز تكملة القمر — نفس منطق الكيبورد

        if (this.rhuEl && !this._rhuSolved) { this._rhuHold = true; return; }

        if (this.laserEl) { this.laserFire(); return; }

        if (this.antennaEl) { this.antennaLock(); return; }

        this.keys.e = true;

      }, () => {

        // إفلات زر اللمس أثناء لغز الحرارة = محاولة تثبيت

        if (this.rhuEl) {

          this._rhuHold = false;

          this.rhuReleaseCheck();

        }

      });

    },



    /* -------------------------------------------------------

       الحوار — الكلام يُكتب حرفاً بحرف مع صوت الكتابة

       ------------------------------------------------------- */

    openDialogue(id) {

      const data = DIALOGUES[id];

      if (!data || !data.lines) return;



      this.dialogue = { id, lines: data.lines, idx: 0 };

      this.dialogueActive = true;



      if (!this.dialogueEl) {

        const panel = document.createElement('div');

        panel.className = 'dialogue-panel';

        panel.innerHTML = `

          <div class="dialogue-name"></div>

          <div class="dialogue-text"></div>

          <div class="dialogue-next">▼</div>

        `;

        this.host.appendChild(panel);

        this.dialogueEl = panel;

      }



      const isAr = this.lang === 'ar';

      this.dialogueEl.className = 'dialogue-panel' + (isAr ? '' : ' lang-en');

      this.dialogueEl.dir = isAr ? 'rtl' : 'ltr';

      this.dialogueEl.classList.remove('hidden');

      this.dialogueEl.querySelector('.dialogue-next').classList.add('hidden');



      // ابدأ الكتابة الحرفية للسطر الأول (اسم المتحدث يظهر مع كل سطر)

      this.startTyping(this.dialogue.lines[0]);

    },



    /** يبدأ طباعة سطر حرفاً بحرف — entry: { who, ar, en } */

    startTyping(entry) {

      this.stopTyping();



      // سطر «بطاقة» — إظهار عنصر مطبوع بدل النص المكتوب حرفاً بحرف

      if (entry && entry.card) {

        this.typingLine = null;

        this.typedTarget = null;

        const nameEl = this.dialogueEl.querySelector('.dialogue-name');

        nameEl.textContent = '';

        nameEl.className = 'dialogue-name';

        this.dialogueEl.querySelector('.dialogue-text').textContent = '';

        this.dialogueEl.querySelector('.dialogue-next').classList.add('hidden');

        this.showPlaqueCard(entry.card);

        this._cardOpen = true;

        return;

      }



      // اسم المتحدث لهذا السطر (زين/طارق/سُهيل) + لون خاص لكل واحد

      const nameEl = this.dialogueEl.querySelector('.dialogue-name');

      const who = entry.who ? SPEAKERS[entry.who] : null;

      if (who) {

        nameEl.textContent = who[this.lang] || who.ar;

        nameEl.className = 'dialogue-name' + (entry.who ? ' speaker-' + entry.who : '');

      }



      const isAr = this.lang === 'ar';

      this.typedTarget = entry[this.lang] || entry.ar || '';

      this.typingLine = { text: this.typedTarget, shown: '' };



      const textEl = this.dialogueEl.querySelector('.dialogue-text');

      this.dialogueEl.querySelector('.dialogue-next').classList.add('hidden');



      let idx = 0;

      const step = () => {

        if (!this.dialogueActive || !this.typingLine) return;



        // إيقاف مؤقت أثناء فتح الإعدادات — تستأنف الكتابة عند الإغلاق

        if (this.paused) {

          this.typeTimer = setTimeout(step, 120);

          return;

        }



        if (idx >= this.typingLine.text.length) { this.finishTyping(); return; }



        const ch = this.typingLine.text[idx];

        this.typingLine.shown += ch;

        idx++;

        textEl.textContent = this.typingLine.shown;



        // صوت الكتابة لكل حرف (بدون المسافات) — سُهيل بنغمة إلكترونية أعلى

        if (ch !== ' ' && ch !== '\n') {

          if (entry.who === 'sohail') Sfx.blip(1000 + Math.random() * 200, 0.018, 0.05, 'sine');

          else Sfx.keyClick(0.22);

        }



        this.typeTimer = setTimeout(step, this.TYPE_SPEED + Math.random() * this.TYPE_JITTER);

      };

      this.typeTimer = setTimeout(step, 120); // مهلة صغيرة قبل أول حرف

    },



    /** إثبات السطر كاملاً فوراً (تخطي الكتابة) */

    finishTyping() {

      this.stopTyping();

      if (!this.dialogue || !this.dialogueEl) return;

      const textEl = this.dialogueEl.querySelector('.dialogue-text');

      const entry = this.dialogue.lines[this.dialogue.idx] ?? {};

      textEl.textContent = entry[this.lang] || entry.ar || entry.text || '';

      this.typingLine = null;

      this.dialogueEl.querySelector('.dialogue-next').classList.remove('hidden');

    },



    isTyping() {

      return !!this.typingLine;

    },



    stopTyping() {

      if (this.typeTimer) { clearTimeout(this.typeTimer); this.typeTimer = null; }

    },



    advanceDialogue() {

      if (!this.dialogueActive || !this.dialogue) return;



      // بطاقة اللوحة مفتوحة: أول ضغطة تغلق البطاقة وتتقدم للسطر التالي

      if (this._cardOpen) {

        this._cardOpen = false;

        this.hidePlaqueCard();

        Sfx.advance();

        // المتابعة كالعادة إلى السطر التالي

      }



      // أثناء الكتابة: أول ضغطة تُظهر السطر كاملاً

      if (this.isTyping()) {

        this.finishTyping();

        Sfx.advance();

        return;

      }



      const last = this.dialogue.idx >= this.dialogue.lines.length - 1;

      if (last) {

        this.closeDialogue();

      } else {

        this.dialogue.idx++;

        Sfx.advance();

        this.startTyping(this.dialogue.lines[this.dialogue.idx]);

      }

    },



    closeDialogue() {

      const finishedId = this.dialogue ? this.dialogue.id : null;

      this.dialogueActive = false;

      this.dialogue = null;

      this.stopTyping();

      this.typingLine = null;

      this.typedTarget = null;

      this._cardOpen = false;

      this.hidePlaqueCard();



      if (this.dialogueEl) this.dialogueEl.classList.add('hidden');



      // انتهاء حوار الصور → الباب مفتوح للانتقال بالسهم

      if (this.room === 0) this.exitOpen = true;



      // انتهاء حوار طارق في القمرة → تبدأ مرحلة الانطلاق:

      // كل الأسهم تتجه يميناً نحو غرفة كبسولة الهروب

      if (finishedId === 'tariq' && this.room === 2) this.podStage = true;



      // انتهاء حوار الاصطدام → لافتة المهمة العاجلة + السماح بالحركة مجدداً

      if (finishedId === 'impact') {

        this.cutsceneActive = false;

        this.showMission();

      }



      // انتهاء حوار الوداع → تبديل الشخصية إلى طارق وبدء مشيه السينمائي

      if (finishedId === 'farewell') {

        this.farewellDone = true;

        this.beginTariqScript();

      }



      // انتهاء حوار بروتوكول الهروب (العدّ 3..2..1) → فيديو انفصال الكبسولة

      if (finishedId === 'escape') {

        Sfx.ensure();

        Sfx.explosion();        // إشعال محركات الانفصال

        this.startCutsceneVideo(ASSETS.cutscenes.separation, () => this.openDialogue('separation'));

      }



      // انتهاء حوار انقطاع الاتصال → فيديو الانجراف ثم الخاتمة

      if (finishedId === 'separation') {

        this.startCutsceneVideo(ASSETS.cutscenes.afterSeparation, () => this.showEpilogue());

      }



      /* ============ الفصل الأول — سطح القمر ============ */

      // استمرار سلسلة الفيديوهات بعد إغلاق حوار سُهيل فوق فيديو الاستيقاظ

      const chapterCb = this.onChapterDialogueClosed;

      if (chapterCb) { this.onChapterDialogueClosed = null; chapterCb(finishedId); }



      // انتهاء حوار القمر الأول → لافتة مهمة الأكسجين + تحرير التحكم

      if (finishedId === 'tariqCheck' && this.crisis && this.room === 7) {

        this.cutsceneActive = false;

        this.showOxyMission();

      }



      // انتهاء حوار نجاح الأكسجين → إزالة لافتة الأكسجين + لافتة مهمة اللوحة (المهمة 2)

      if (finishedId === 'oxyDone') {

        if (this.oxyMissionEl) {

          this.removeNode(this.oxyMissionEl);

          this.oxyMissionEl = null;

        }

        this.showLunarTask('plaqueTask');

      }



      // نهاية حوار لوحة الذكريات → فتح مسار الشرق نحو منخفض بحر الهدوء (المشهد 2)

      if (finishedId === 'plaque' && this.crisis && this.room === 7) {

        this.eastOpen = true;

        this.showLunarTask('eastTask');

      }



 /* ===== تكملة القمر — سلسلة المهام الـ13 بعد كل حوار ===== */

      // نهاية حوار آثار الأقدام (المشهد 2) → لافتة فحص العلم في نفس المشهد

      if (finishedId === 'footprints' && this.room === 8) {

        this.showLunarTask('flagTask');

      }

      // نهاية حوار العلم الأبيض (المشهد 2) → فتح الشرق + لافتة محطة الزلازل

      if (finishedId === 'flag' && this.room === 8) {

        this.showLunarTask('psepTask');

      }

      // نهاية فحص PSEP (المشهد 3) → فتح الشرق + لافتة عاكس الليزر

      if (finishedId === 'psepIntro' && this.room === 9) {

        this.psepSeen = true;

        this.showLunarTask('lrrrTask');

      }

      // نهاية فحص العاكس LRRR (المشهد 4) → لافتة محاولة المعايرة (المهمة 7)

      if (finishedId === 'lrrrIntro' && this.room === 10) {

        this.lrrrSeen = true;

        this.showLunarTask('calibTask');

      }

      // نهاية حوار فشل المعايرة (المشهد 4) → فتح الشرق + لافتة ممر الجبال

      if (finishedId === 'laserFail' && this.room === 10) {

        this.laserFailSeen = true;

        this.showLunarTask('tracksTask');

      }

      // نهاية فحص مسارات العجلات (المشهد 5) → فتح الشرق + لافتة العربة

      if (finishedId === 'tracks' && this.room === 11) {

        this.tracksSeen = true;

        this.showLunarTask('lrvTask');

      }

      // نهاية فحص العربة LRV (المشهد 6 — المهمة 9) → لافتة المكونات الثلاثة

      if (finishedId === 'roverInspect' && this.room === 12) {

        this.lrvSeen = true;

        this.showLunarTask('roverPartsTask');

      }

      // نهاية اكتشاف الحلقة عند الطبق (المشهد 6) → مهمة العودة غرباً لإذابة الصقيع

      if (finishedId === 'dishDiscovery' && this.room === 12) {

        this.dishDiscovered = true;

        this.showLunarTask('backtrackTask');

      }

      // نهاية إذابة الصقيع (حلقة العودة — المهمة 10) → لافتة معايرة الليزر شرقاً

      if (finishedId === 'rhuDone' && this.room === 9) {

        this.showLunarTask('laserTask');

      }

      // نهاية نجاح المعايرة (حلقة العودة — المهمة 11) → لافتة العودة للطبق

      if (finishedId === 'lrrrDone' && this.room === 10) {

        this.showLunarTask('broadcastTask');

      }

      // نهاية مقدمة البث → فتح لغز البؤرة

      if (finishedId === 'antenna' && this.room === 12 && !this.antennaSolved) {

        this.openAntennaPuzzle();

      }

      // نهاية بث النداء (المهمة 12) → مركبة العبور هبطت + لافتة منصة الإطلاق

      if (finishedId === 'antennaDone' && this.room === 12) {

        this.showLunarTask('launchpadTask');

        this.preloadExpansionVideos();

      }



 /* ===== الفصل الثاني — حديقة التراث الفضائي (الاسكربت الجديد) ===== */

      if (finishedId === 'habitatIntro') {

        this.habitatIntroDone = true;

        this.cutsceneActive = false;   // تحرير التحكم — زين داخل المأوى

        this.showLunarTask('habitatTask');

      }

      if (finishedId === 'beaconPickup') {

        this.beaconTaken = true;

 // : لا لافتة «اخرج شرقاً» هنا — البوابة نفسها ستنقل اللاعب

        // للمشهد التالي لحظة فتحها (عبور فوري عبر الباب)

      }

      if (finishedId === 'sojournerDlg') {

        this.sojournerSeen = true;

        this.showLunarTask('insightTask');

      }

      if (finishedId === 'insightDlg') {

        this.insightSeen = true;

        this.showLunarTask('oppyTask');

      }

      if (finishedId === 'oppyDlg') {

        this.oppySeen = true;

        this.showLunarTask('oppyMastTask');

      }

      if (finishedId === 'beaconFire') {

 // : لا مشهد شروق سينمائي — تحرير التحكم و لافتة المشي شرقاً

        // نحو غرفة الشروق العادية (المشهد أصبح غرفة مشي كالبقية)

        this.cutsceneActive = false;

        this.showLunarTask('sunriseTask');

      }

      if (finishedId === 'reunionTalk') {

        this.reunionDone = true;

        this.chapterTimers.push(setTimeout(() => {

          if (this.running) this.showHonorWall();

        }, 900));

      }



 /* ===== — خلف الكواليس: فتح الشرق بعد كل حوار مكتب ===== */

      if (finishedId === 'credMalak') {

        this.credSeen[0] = true;

        this.showLunarTask('credNext1');

      }

      if (finishedId === 'credRanya') {

        this.credSeen[1] = true;

        this.showLunarTask('credNext2');

      }

      if (finishedId === 'credMazen') {

        this.credSeen[2] = true;

        this.showLunarTask('credNext3');

      }

      // انتهاء مونولوج محمد — شاشة التوديع الجماعية

      if (finishedId === 'credMohamed') {

        this.credSeen[3] = true;

        this.chapterTimers.push(setTimeout(() => {

          if (this.running) this.showCreditsWave();

        }, 900));

      }

    },



    /* -------------------------------------------------------

       تبديل الكاميرا إلى طارق — مشيه السينمائي بعد الوداع

       (زين يبقى في جهة كبسولته — الشخصية اللاعبة الآن طارق)

       ------------------------------------------------------- */

    beginTariqScript() {

      this.cutsceneActive = true;



      if (this.fadeEl) this.fadeEl.classList.add('on');



      this.cutsceneTimers.push(setTimeout(() => {

        if (!this.running) return;



        // إزالة لافتة المهمة — مرحلة جديدة بدأت

        if (this.missionEl) { this.missionEl.remove(); this.missionEl = null; }



        // الكاميرا تنتقل: اللاعب الآن طارق (يستبدل مكان الـ NPC)

        this.playerChar = 'tariq';

        this.anim = 'idle';

        this.frameIdx = 0;

        this.frameTimer = 0;

        this.lastWalkFrame = 0;

        this.charX = this.tariqCrisisX();

        this.facing = 1; // يتأمل الموقف مؤثراً نحو الأخ الأصغر



        if (this.fadeEl) this.fadeEl.classList.remove('on');



        // لحظة توقف ثم يلتف يساري الشاشة نحو قمرة القيادة

        this.cutsceneTimers.push(setTimeout(() => {

          if (!this.running) return;

          this.facing = -1;

          this.anim = 'walk';

          this.frameIdx = 0;

          this.frameTimer = 0;

          this.lastWalkFrame = 0;

          this.onScriptArrive = () => { this.enterCockpitRoom(); };

          this.autoWalk = true;

          this.autoTargetX = this.charHalf() + 2; // حتى حافة الغرفة اليسرى

        }, 900));

      }, 750));

    },



    /** طارق يترك غرفة الفيديو الثانية إلى بديل قمرة القيادة بعد الاصطدام

     *  عند بلوغه الكرسي الصلب تبدأ سلسلة الختام مباشرة */

    enterCockpitRoom() {

      this.goToRoom(6, 'right', {

        enterTargetX: this.chairStopX(),

        arriveFacing: -1,       // ينظر للقمر عبر النافذة

        arriveAction: () => this.startEscapeSequence(),

      });

    },



    /** بداية سلسلة الختام — طارق واقف على الكرسي، سُهيل يعلن بروتوكول الهروب */

    startEscapeSequence() {

      this.cutsceneActive = true;

      this.facing = -1;         // يتأمل القمر عبر النافذة

      this.openDialogue('escape');

    },



    /** فيديو سينمائي ملء الشاشة — ينتقل لما بعده عند انتهائه (أو بنقرة اللاعب) */

    startCutsceneVideo(src, onEnded) {

      if (this.cutsceneVideoEl) {

        const old = this.cutsceneVideoEl;

        try { old.pause(); } catch (_) {}

        if (old.parentNode) old.parentNode.removeChild(old);

      }

      if (this.skipHintEl) { this.removeNode(this.skipHintEl); this.skipHintEl = null; }

      this.cutsceneVideoEl = null;

      this._cutsceneFinish = null;

      this.cutsceneActive = true;



      const v = document.createElement('video');

 // : الفيديو المحمَّل مسبقاً (Blob) إن توفر — تشغيل فوري

      v.src = (window.OSIRIS_PRELOADER && OSIRIS_PRELOADER.videoSrc(src)) || src;

      v.autoplay = true;

      v.muted = true;

      v.playsInline = true;

      v.setAttribute('playsinline', '');

      v.preload = 'auto';

      v.className = 'cutscene-video';

      this.host.appendChild(v);

      this.cutsceneVideoEl = v;

      this.cutsceneVideoDone = onEnded || null;



      // تلميح «نقرة للتخطي» — يوضح للاعب أن الفيديو قابل للتخطي

      const hint = document.createElement('div');

      hint.className = 'skip-hint' + (this.lang === 'en' ? ' lang-en' : '');

      hint.dir = this.lang === 'ar' ? 'rtl' : 'ltr';

      hint.textContent = CHAPTER1_UI[this.lang === 'en' ? 'en' : 'ar'].skipHint;

      this.host.appendChild(hint);

      this.skipHintEl = hint;



      let fired = false;

      const finish = () => {

        if (fired || !this.running) return;

        fired = true;

        try { v.pause(); } catch (_) {}

        if (v.parentNode) v.parentNode.removeChild(v);

        if (this.skipHintEl) { this.removeNode(this.skipHintEl); this.skipHintEl = null; }

        if (this.cutsceneVideoEl === v) this.cutsceneVideoEl = null;

        const cb = this.cutsceneVideoDone;

        this.cutsceneVideoDone = null;

        this._cutsceneFinish = null;

        if (cb) cb();

      };

      this._cutsceneFinish = finish;

      v.addEventListener('ended', finish);

      v.addEventListener('loadedmetadata', () => {

        // احتياط: لو لم يترتب حدث ended لأي سبب

        this.cutsceneTimers.push(setTimeout(finish, ((v.duration || 8) * 1000) + 800));

      });

      v.play().catch(() => { /* المؤقت الاحتياطي سيُنهيه */ });

    },



    /** الخاتمة — شاشة سوداء بنص أبيض ناعم ثم لافتة الفصل الأول */

    showEpilogue() {

      // تحميل مسبق لفيديوهات الفصل الأول أثناء قراءة الخاتمة

      this.preloadChapterVideos();



      const isAr = this.lang === 'ar';

      const ov = document.createElement('div');

      ov.className = 'epilogue-overlay' + (isAr ? '' : ' lang-en');

      ov.dir = isAr ? 'rtl' : 'ltr';

      ov.innerHTML = '<div class="epilogue-text"></div>';

      this.host.appendChild(ov);

      this.epilogueEl = ov;



      const text = ov.querySelector('.epilogue-text');

      text.textContent = EPILOGUE_TEXT[this.lang] || EPILOGUE_TEXT.ar;



      // ظهور الشاشة السوداء ثم النص بحروف بيضاء ناعمة

      this.cutsceneTimers.push(setTimeout(() => { if (this.running) ov.classList.add('show'); }, 80));

      this.cutsceneTimers.push(setTimeout(() => { if (this.running) text.classList.add('show'); }, 1900));



      // بعد قراءة النص: يختفي ويحل محله لافتة الفصل

      this.cutsceneTimers.push(setTimeout(() => {

        if (this.running) text.classList.remove('show');

      }, 8400));

      this.cutsceneTimers.push(setTimeout(() => {

        if (!this.running) return;

        ov.innerHTML = '<div class="chapter-card"></div>';

        const card = ov.querySelector('.chapter-card');

        card.textContent = CHAPTER_TITLE[this.lang] || CHAPTER_TITLE.ar;



        this.cutsceneTimers.push(setTimeout(() => { if (this.running) card.classList.add('show'); }, 80));



        // نهاية الفصل — نقرة/أي زر للعودة إلى القائمة الرئيسية

        this.cutsceneTimers.push(setTimeout(() => {

          if (!this.running) return;

          this.epilogueEnded = true;

          const prompt = document.createElement('div');

          prompt.className = 'chapter-card chapter-prompt';

          prompt.textContent = isAr ? '[ اضغط للمتابعة — بدء الفصل الأول ]' : '[ PRESS TO CONTINUE — CHAPTER ONE ]';

          ov.appendChild(prompt);

          this.cutsceneTimers.push(setTimeout(() => {

            if (this.running && prompt.parentNode) prompt.classList.add('show');

          }, 80));

        }, 3400));

      }, 10400));

    },



    /* =======================================================

       الفصل الأول — سطح القمر

       سلسلة: cutscene-wake (حوار سُهيل) → cutscene-hatch-open (E للفتح) →

       cutscene-hatch-exit (E للخروج) → سطح القمر والتحكم بطارق

       ======================================================= */

    removeNode(el) { if (el && el.parentNode) el.parentNode.removeChild(el); },



    /** نقرة ما بعد لافتة الفصل → إطلاق سلسلة الفصل الأول */

    continueAfterChapterCard() {

      if (this.chapterStarted) return;   // بدأت بالفعل

      this.epilogueEnded = false;

      Sfx.ensure();



      // أسود فوري فوق لافتة الفصل قبل إزالتها (بدون وميض)

      const ov = document.createElement('div');

      ov.className = 'chapter-black on';

      this.host.appendChild(ov);

      this.blackEl = ov;



      const old = this.epilogueEl;

      this.epilogueEl = null;

      this.epilogueEnded = false;

      this.chapterTimers.push(setTimeout(() => this.removeNode(old), 150));



      this.startChapterOne();

    },



    /** طبقة سوداء (z 80) تفصل بين مراحل الفصل الأول */

    blackOn() {

      if (!this.running) return Promise.resolve();

      return new Promise((resolve) => {

        if (!this.blackEl) {

          const b = document.createElement('div');

          b.className = 'chapter-black';

          this.host.appendChild(b);

          this.blackEl = b;

          requestAnimationFrame(() => b.classList.add('on'));

        } else {

          this.blackEl.classList.add('on');

        }

        this.chapterTimers.push(setTimeout(resolve, 700));

      });

    },



    /** كشف الشاشة بعد السواد */

    blackRelease() {

      const ov = this.blackEl;

      if (!ov) return;

      this.blackEl = null;

      ov.classList.remove('on');

      this.chapterTimers.push(setTimeout(() => this.removeNode(ov), 750));

    },



    /** تحميل مسبق لفيديوهات الفصل الأول أثناء قراءة الخاتمة (~10 ثوانٍ)

     *  حتى يبدأ مشهد الاستيقاظ فور النقر دون أي انتظار */

    preloadChapterVideos() {

      if (this._chapterPreloadEls) return;

      const list = [

        ASSETS.cutscenes.wake,

        ASSETS.cutscenes.hatchOpen,

        ASSETS.cutscenes.hatchExit,

      ];

      this._chapterPreloadEls = list.map((src) => {

        const v = document.createElement('video');

        v.preload = 'auto';

        v.muted = true;

 // : الفيديو المحمَّل مسبقاً (Blob) إن توفر

        v.src = (window.OSIRIS_PRELOADER && OSIRIS_PRELOADER.videoSrc(src)) || src;

        v.load();   // يبدأ التنزيل فوراً — العنصر خارج الشاشة

        return v;

      });

    },



    /** فيديو سينمائي (غير قابل للتخطي) — يكتمل عند انتهاء الفيديو وانتهاء حواره

     *  reveal: إن كان صحيحاً يُكشف عن الفيديو فور جاهزية أول فريم

     *  (يُستخدم مع فيديو الاستيقاظ حتى لا يختبئ خلف طبقة السواد)

 * prevEl : عنصر فيديو سابق معروض — قطع مباشر بلا سواد فوقه

     *  (آخر فريم هناك = أول فريم هنا — قاعدة التسلسل الكانوني) */

    playChapterVideo(src, dialogueId = null, keepLast = false, reveal = false, prevEl = null) {

      return new Promise((resolve) => {

        if (!this.running) { resolve(null); return; }



        const v = document.createElement('video');

 // : الفيديو المحمَّل مسبقاً (Blob) إن توفر

        v.src = (window.OSIRIS_PRELOADER && OSIRIS_PRELOADER.videoSrc(src)) || src;

        v.muted = true;

        v.autoplay = true;

        v.playsInline = true;

        v.setAttribute('playsinline', '');

        v.preload = 'auto';

        v.className = 'cutscene-video';

        // القطع المباشر: نخفي الفيديو حتى يجاهز أول فريم فوق الفيديو السابق

        if (prevEl) v.style.visibility = 'hidden';

        this.host.appendChild(v);

        this.chapterVideoEl = v;



        if (prevEl) {

          const cutNow = () => {

            v.style.visibility = '';

            try { prevEl.pause(); } catch (_) {}

            this.removeNode(prevEl);

          };

          v.addEventListener('loadeddata', cutNow, { once: true });

          v.addEventListener('playing', cutNow, { once: true });

        }



        // الكشف عن الفيديو فور ظهور أول فريم — أول مشهد في الفصل يجب أن يُرى

        if (reveal) {

          const revealNow = () => { if (this.blackEl) this.blackRelease(); };

          v.addEventListener('loadeddata', revealNow, { once: true });

          v.addEventListener('playing', revealNow, { once: true });

        }



        let vidEnded = false;

        let dlgDone = !dialogueId;

        let finished = false;



        const finish = () => {

          if (finished) return;

          finished = true;

          // إغلاق أي حوار متبقٍ فوق الفيديو

          if (this.dialogueActive) {

            this.dialogueActive = false;

            this.dialogue = null;

            this.stopTyping();

            this.typingLine = null;

            this.typedTarget = null;

            if (this.dialogueEl) this.dialogueEl.classList.add('hidden');

          }

          try { v.pause(); } catch (_) {}

          if (!keepLast) this.removeNode(v);

          this.chapterVideoEl = null;

          this.onChapterDialogueClosed = null;

          resolve(keepLast ? v : null);

        };



        const maybe = () => { if (vidEnded && dlgDone) finish(); };



        v.addEventListener('ended', () => { vidEnded = true; maybe(); });

        v.addEventListener('loadedmetadata', () => {

          this.chapterTimers.push(setTimeout(finish, ((v.duration || 10) * 1000) + 1500));

        });



        if (dialogueId) {

          this.onChapterDialogueClosed = (id) => {

            if (id === dialogueId) { dlgDone = true; maybe(); }

          };

          this.chapterTimers.push(setTimeout(() => {

            if (this.running && !this.dialogueActive) this.openDialogue(dialogueId);

          }, 1000));

        }



        v.play().catch(() => { /* المؤقت الاحتياطي سيُنهيه */ });

      });

    },



    /** فريم ثابت (أول فريم) + شارة «اضغط E» — عند E يعمل الفيديو حتى نهايته

     *  opts.keepFrameOut — عند النهاية لا تسود الشاشة: يبقى آخر فريم معروضاً

     *                      (لأن آخر فريم هنا = أول فريم للمشهد التالي)

     *  opts.prevEl — عنصر فيديو سابق: يُزال فور جاهزية أول فريم هنا (قطع مباشر

     *               بلا سواد — يُستخدم بين فتح الباب والخروج حيث اللقطتان متطابقتان)

 * opts.onPress — استدعاء يُنفذ لحظة قبول ضغطة E (قبل التشغيل) */

    holdEFrame(src, label, opts = {}) {

      return new Promise((resolve) => {

        if (!this.running) { resolve(null); return; }



        const keepFrameOut = !!opts.keepFrameOut;

        const prevEl = opts.prevEl || null;

        const onPress = opts.onPress || null;



        const v = document.createElement('video');

 // : الفيديو المحمَّل مسبقاً (Blob) إن توفر

        v.src = (window.OSIRIS_PRELOADER && OSIRIS_PRELOADER.videoSrc(src)) || src;

        v.muted = true;

        v.playsInline = true;

        v.setAttribute('playsinline', '');

        v.preload = 'auto';

        v.className = 'cutscene-video';

        // القطع المباشر: نخفي الفيديو حتى يجاهز أول فريم حتى لا يومض لونه الأسود

        // فوق آخر فريم للفيديو السابق

        if (prevEl) v.style.visibility = 'hidden';

        this.host.appendChild(v);

        this.chapterVideoEl = v;



        let finished = false;

        let frameArmed = false;   // تجهيز الفريم يحدث مرة واحدة فقط (منع تكرار مشهد الباب)

        let pressed = false;      // ضغطة E تُقبل مرة واحدة فقط



        const endPlaying = () => {

          if (finished) return;

          finished = true;



          // قطع مباشر: آخر فريم يبقى على الشاشة — لا سواد ولا إزالة

          if (keepFrameOut) {

            try { v.pause(); } catch (_) {}

            resolve(v);

            return;

          }



          this.chapterTimers.push(setTimeout(() => {

            this.blackOn().then(() => {

              try { v.pause(); } catch (_) {}

              if (this.chapterVideoEl === v) this.chapterVideoEl = null;

              resolve(v);

            });

          }, 350));

        };



        const press = () => {

          if (pressed || finished) return;   // حماية: نقر الشارة + كيبورد معاً لا يعيدان التشغيل

          pressed = true;

          frameArmed = true;                 // بدأ التشغيل — ممنوع تجميد الفريم من جديد مطلقاً

          if (this.badgeEl) { this.removeNode(this.badgeEl); this.badgeEl = null; }

          this._chapterE = null;

          Sfx.ensure();

          Sfx.ePress();

          if (onPress) { try { onPress(); } catch (_) {} }

          const p = v.play();

          if (p && p.catch) p.catch(() => {});

          v.addEventListener('ended', endPlaying, { once: true });

          // مؤقّت احتياطي مباشر — loadedmetadata سبق أن أُطلق قبل ظهور الشارة

          // فلا فائدة من مستمع جديد لن يُطلق أبداً

          this.chapterTimers.push(setTimeout(endPlaying, ((v.duration || 6) * 1000) + 1800));

        };



        const badgeStep = () => {

          if (prevEl) {

            // قطع مباشر: نظهر أول فريم هنا ونزيل الفيديو السابق في نفس اللحظة —

            // آخر فريم هناك = أول فريم هنا فلا يشعر اللاعب بأي انتقال

            v.style.visibility = '';

            try { prevEl.pause(); } catch (_) {}

            this.removeNode(prevEl);

          } else {

            // فريم جاهز — نكشف الشاشة (إزالة السواد) ونظهر شارة E

            this.blackRelease();

          }

          if (this.badgeEl) { this.removeNode(this.badgeEl); this.badgeEl = null; }

          const b = document.createElement('button');

          b.type = 'button';

          b.className = 'chapter-e-badge' + (this.lang === 'en' ? ' lang-en' : '');

          b.innerHTML = '<span class="ce-key">E</span><span></span>';

          b.lastElementChild.textContent = label;

          b.addEventListener('click', press);

          this.host.appendChild(b);

          this.badgeEl = b;

          this._chapterE = press;

        };



        const inFrame = () => {

          if (frameArmed) return;   // الفريم جاهز أو التشغيل بدأ — المؤقّت الاحتياطي لا يعيد المشهد

          frameArmed = true;

          try { v.pause(); v.currentTime = 0.01; } catch (_) {}

          let released = false;

          const release = () => {

            if (released || !this.running) return;

            released = true;

            badgeStep();

          };

          v.addEventListener('seeked', release, { once: true });

          this.chapterTimers.push(setTimeout(release, 900)); // احتياط لو لم يحدث seeked

        };



        v.addEventListener('loadeddata', inFrame, { once: true });

        this.chapterTimers.push(setTimeout(inFrame, 5000)); // احتياط لو تأخر التحميل

      });

    },



    /** إطلاق السلسلة كاملة

     *  التسلسل البصري (يهم التصميم — لا تغيّره):

     *  1) cutscene-wake من أول فريم — أول مشهد يراه اللاعب (لا سواد أمامه)

     *  2) سواد قصير ثم hatch-open (لقطة مختلفة تماماً — سواد مقبول)

     *  3) hatch-exit بقطع مباشر: آخر فريم فتح الباب = أول فريم الخروج — ممنوع السواد

     *  4) سطح القمر بقطع مباشر: طارق يظهر بنفس مكانه أمام الباب المفتوح

     */

    async startChapterOne() {

      if (this.chapterStarted) return;

      this.chapterStarted = true;

      this.chapter = true;

      this.cutsceneActive = true;

      this.hideExitHint();



      // حفظ المرحلة — المتابعة القادمة تفتح مباشرة على سطح القمر

      this.saveStage('moon');



      const ui = CHAPTER1_UI[this.lang === 'en' ? 'en' : 'ar'];



      // المرحلة 1 — فيديو الاستيقاظ مع حوار سُهيل (حسب اللغة) — مرئي فوراً

      const v6 = await this.playChapterVideo(ASSETS.cutscenes.wake, 'sohailWake', true, true);

      await this.blackOn();

      this.removeNode(v6);



      // المرحلة 2 — فريم ثابت من فيديو فتح الباب + «اضغط E للفتح»

      // (keepFrameOut: عند نهايته يبقى آخر فريم — الباب مفتوح — بلا سواد)

      const v7 = await this.holdEFrame(ASSETS.cutscenes.hatchOpen, ui.eOpen, { keepFrameOut: true });



      // المرحلة 3 — فريم ثابت من فيديو الخروج + «اضغط E للخروج»

      // قطع مباشر فوق آخر فريم لفتح الباب (prevEl) — اللقطتان متطابقتان

      const v8 = await this.holdEFrame(ASSETS.cutscenes.hatchExit, ui.eExit, {

        keepFrameOut: true,

        prevEl: v7,

      });



      // المرحلة 4 — سطح القمر والتحكم بطارق (قطع مباشر بنفس المكان)

      this.enterMoonRoom(v8);

    },



    /** الدخول إلى خلفية القمر — اللاعب الآن طارق

     *  قطع مباشر من آخر فريم فيديو الخروج: طارق يظهر بنفس مكانه أمام الباب

     *  المفتوح (~19% من يسار الشاشة) — لا يدخل من اليسار إطلاقاً

     *  exitVideo: عنصر فيديو الخروج — يُزال بعد أن يرسم الكانفس الغرفة خلفه */

    enterMoonRoom(exitVideo = null) {

      if (!this.running) return;

      const go = () => {

        if (!this.running) return;

        if (!this.roomImgs[7]) { this.chapterTimers.push(setTimeout(go, 300)); return; }



        // تجهيز الحالة أولاً — الكانفس يرسم سطح القمر وطارق خلف الفيديو

        this.room = 7;

        this.crisis = true;

        this.playerChar = 'tariq';

        this.hasMoved = true;

        this.charX = Math.round(this.W * 0.19);   // نفس موضع طارق في آخر فريم

        this.facing = 1;                          // ينظر شرقاً نحو اللوحة والمهمة

        this.anim = 'idle';

        this.frameIdx = 0;

        this.frameTimer = 0;

        this.lastWalkFrame = 0;

        this.autoWalk = false;

        this.onScriptArrive = null;

        this.exitOpen = true;   // حافة الشرق فعالة بعد اللوحة (دفاعي — مضبوطة أصلاً في المسار الطبيعي)

        if (this.fadeEl) this.fadeEl.classList.remove('on');



        // بعد فريم رسم على الأقل: قطع مباشر بإزالة فيديو الخروج ثم الحوار

        this.chapterTimers.push(setTimeout(() => {

          if (!this.running) return;

          const el = exitVideo || this.chapterVideoEl;

          if (el) {

            try { el.pause(); } catch (_) {}

            this.removeNode(el);

            if (this.chapterVideoEl === el) this.chapterVideoEl = null;

          }

          this.hideInstructions();   // لوحة الإرشادات لا تعلو على حوار الافتتاح

          this.blackRelease();   // احتياطي — لا توجد طبقة سودة أصلاً في المسار الطبيعي

          this.openDialogue('tariqCheck');

        }, 110));

      };

      go();

    },



    /** لافتة مهمة فحص صمام الأكسجين */

    showOxyMission() {

      if (this.oxyMissionEl || !this.running) return;

      Sfx.ensure();

      Sfx.missionAlert();

      const el = document.createElement('div');

      el.className = 'mission-banner' + (this.lang === 'en' ? ' lang-en' : '');

      el.dir = this.lang === 'ar' ? 'rtl' : 'ltr';

      el.textContent = CHAPTER1_UI[this.lang === 'en' ? 'en' : 'ar'].oxyTask;

      this.host.appendChild(el);

      this.oxyMissionEl = el;

    },



    /** لافتة مهمة التوجه شرقاً (نسخة خضراء) — بعد لوحة الذكريات */

    /** لافتة مهمة فصل القمر — تُستبدل ببعضها عبر سلسلة الغرف 8..13 */

    showLunarTask(key) {

      if (!this.running) return;

      Sfx.ensure();

      Sfx.missionAlert();



      // استبدال أي لافتة سابقة (سلسلة مهام واحدة متصلة)

      if (this.lunarTaskEl) { this.removeNode(this.lunarTaskEl); this.lunarTaskEl = null; }

      if (this.goalEl) { this.removeNode(this.goalEl); this.goalEl = null; }



      const el = document.createElement('div');

      el.className = 'mission-banner goal' + (this.lang === 'en' ? ' lang-en' : '');

      el.dir = this.lang === 'ar' ? 'rtl' : 'ltr';

 // مهام القمر من CHAPTER1_UI ومهام المريخ من EXPANSION_UI (إصلاح —

      // كانت لافتات مهام المريخ تظهر فارغة لأنها تُقرأ من قاموس القمر فقط)

      const uiAr = this.lang === 'en' ? 'en' : 'ar';

      el.textContent = CHAPTER1_UI[uiAr][key] || EXPANSION_UI[uiAr][key] || '';

      this.host.appendChild(el);

      this.lunarTaskEl = el;

    },



    /* =======================================================

       نهاية الجزء الحالي — التوجه شرقاً على سطح القمر

       بطاقة «يتبع…» ثم العودة للقائمة الرئيسية

       ======================================================= */

    /** دخول مباشر لسطح القمر (متابعة بحفظ stage='moon')

     *  يُنادى بعد جهوزية الأصول — طارق يظهر بنفس مكانه أمام الباب المفتوح

     *  (مطابق لنهاية فيديو الخروج في المسار السينمائي — لا دخول من اليسار) */

    enterMoonRoomDirect() {

      if (!this.running) return;

      this.cutsceneActive = true;

      this.blackRelease();



      this.room = 7;

      this.crisis = true;

      this.playerChar = 'tariq';

      this.hasMoved = true;

      this.exitOpen = true;   // حافة الشرق فعالة بعد اللوحة (إصلاح توقف النهاية عند المتابعة)



      // طارق واقف أمام الباب المفتوح — نفس موضع نهاية فيديو الخروج

      this.charX = Math.round(this.W * 0.19);

      this.facing = 1;

      this.anim = 'idle';

      this.frameIdx = 0;

      this.frameTimer = 0;

      this.lastWalkFrame = 0;

      this.autoWalk = false;

      this.onScriptArrive = null;

      if (this.fadeEl) this.fadeEl.classList.remove('on');



      // لحظة كشف الغرفة ثم حوار الفحص الأول

      this.chapterTimers.push(setTimeout(() => {

        if (!this.running) return;

        this.hideInstructions();   // لوحة الإرشادات لا تعلو على حوار الافتتاح

        this.openDialogue('tariqCheck');

      }, 150));

    },



    /** بطاقة أرشيف/ذكريات — تظهر وسط الحوار (key من ARCHIVE_CARDS) */

    showPlaqueCard(key = 'plaque') {

      if (this.plaqueCardEl || !this.running) return;

      const card = ARCHIVE_CARDS[key] || PLAQUE_CARD;

      Sfx.ensure();

      Sfx.blip(880, 0.08, 0.10, 'sine');

      this.chapterTimers.push(setTimeout(() => Sfx.blip(1320, 0.12, 0.08, 'sine'), 110));



      const ov = document.createElement('div');

      ov.className = 'plaque-overlay';

      ov.innerHTML = `

        <div class="plaque-card">

          <div class="plaque-eyebrow">${card.eyebrow}</div>

          <div class="plaque-eyebrow-ar">${card.eyebrowAr}</div>

          <div class="plaque-ar">${card.lineAr}</div>

          <div class="plaque-en">${card.lineEn}</div>

        </div>`;

      this.host.appendChild(ov);

      this.plaqueCardEl = ov;



      // إخفاء لوحة الحوار خلف البطاقة

      if (this.dialogueEl) this.dialogueEl.style.opacity = '0';

      requestAnimationFrame(() => ov.classList.add('show'));

    },



    hidePlaqueCard() {

      const ov = this.plaqueCardEl;

      if (!ov) return;

      this.plaqueCardEl = null;

      ov.classList.remove('show');

      if (this.dialogueEl) this.dialogueEl.style.opacity = '';

      this.chapterTimers.push(setTimeout(() => this.removeNode(ov), 550));

    },



    /** نقطة لمعان لوحة الذكريات على الأرض (الغرفة 7 — بنسب من الشاشة) */

    plaqueScreenPoint() {

      return { x: 0.60 * this.W, y: 0.82 * this.H };

    },



    drawPlaqueSparkle(ctx) {

      const p = this.plaqueScreenPoint();

      if (p.x < -40 || p.x > this.W + 40) return;

      const t = performance.now() / 1000;

      const pulse = 0.55 + 0.45 * Math.sin(t * 3.1);

      const a = 0.35 + 0.6 * Math.abs(Math.sin(t * 1.9));



      ctx.save();

      ctx.translate(p.x, p.y);



      // هالة

      ctx.globalAlpha = 0.35 * a;

      const R = 26 * (0.7 + 0.5 * pulse);

      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);

      g.addColorStop(0, 'rgba(255, 236, 180, 0.9)');

      g.addColorStop(0.45, 'rgba(255, 210, 120, 0.35)');

      g.addColorStop(1, 'rgba(255, 200, 100, 0)');

      ctx.fillStyle = g;

      ctx.beginPath();

      ctx.arc(0, 0, R, 0, Math.PI * 2);

      ctx.fill();



      // نجمة متلألئة

      ctx.globalAlpha = a;

      ctx.strokeStyle = '#fff2cc';

      ctx.lineWidth = 2;

      ctx.shadowColor = 'rgba(255, 226, 150, 0.9)';

      ctx.shadowBlur = 8;

      const L = 7 + 5 * pulse;

      ctx.beginPath();

      ctx.moveTo(-L, 0); ctx.lineTo(L, 0);

      ctx.moveTo(0, -L); ctx.lineTo(0, L);

      ctx.moveTo(-L * 0.5, -L * 0.5); ctx.lineTo(L * 0.5, L * 0.5);

      ctx.moveTo(L * 0.5, -L * 0.5); ctx.lineTo(-L * 0.5, L * 0.5);

      ctx.stroke();

      ctx.restore();

    },



    /* -------------------------------------------------------

       المشهد الطارئ — سينما الاصطدام (رافع غرفة الكبسولة)

       Sequence: اهتزاز + تحذير أحمر → تعتيم → خلفية فيديو الأزمة

                 → حوار الاصطدام → لافتة المهمة

       ------------------------------------------------------- */

    /* -------------------------------------------------------

       الهولوجرام — فحص صمام الأكسجين

       مؤشر ضغط أحمر منخفض + مقبض صمام للتدوير حتى 101 kPa

       ------------------------------------------------------- */

    openHologram() {

      if (this.hologramEl || this.oxyResolved || !this.running) return;

      const isAr = this.lang === 'ar';

      const ui = CHAPTER1_UI[isAr ? 'ar' : 'en'];



      this.paused = true;

      this.holoRot = 0;

      this.holoSolved = false;

      this._holoSfxAt = 0;

      this._holoDrag = false;

      this._holoLastA = null;



      Sfx.ensure();

      Sfx.blip(300, 0.15, 0.10, 'sine');

      this.chapterTimers.push(setTimeout(() => Sfx.blip(620, 0.20, 0.07, 'sine'), 120));



      const ov = document.createElement('div');

      ov.className = 'holo-overlay' + (isAr ? '' : ' lang-en');

      ov.dir = isAr ? 'rtl' : 'ltr';

      ov.innerHTML = `

        <div class="holo-panel">

          <div class="holo-head">

            <span class="holo-title"></span>

            <span class="holo-sub">${ui.holoSub}</span>

          </div>

          <div class="holo-body">

            <div class="holo-gauge-wrap">

              <svg id="holoGauge" viewBox="0 0 220 128"></svg>

              <div class="holo-readout"><span id="holoKpa">41</span><i>kPa</i></div>

            </div>

            <div class="holo-wheel-zone">

              <div class="holo-wheel" id="holoWheel"><span class="wheel-face"><i class="hub-dot"></i></span></div>

              <div class="holo-status warn" id="holoStatus"></div>

            </div>

          </div>

          <p class="holo-hint">${ui.holoHint}</p>

        </div>`;

      ov.querySelector('.holo-title').textContent = ui.holoTitle;

      ov.querySelector('#holoStatus').textContent = ui.holoStatusLow;

      this.host.appendChild(ov);

      this.hologramEl = ov;



      this.buildHoloGauge(ov.querySelector('#holoGauge'));



      // تدوير الصمامل بالسحب (ماوس/لمس)

      const wheel = ov.querySelector('#holoWheel');

      this._holoWheel = wheel;

      const ang = (e) => {

        const r = wheel.getBoundingClientRect();

        return Math.atan2(

          e.clientY - (r.top + r.height / 2),

          e.clientX - (r.left + r.width / 2)

        ) * 180 / Math.PI;

      };

      wheel.addEventListener('pointerdown', (e) => {

        if (this.holoSolved) return;

        Sfx.ensure();

        this._holoDrag = true;

        this._holoLastA = ang(e);

        try { wheel.setPointerCapture(e.pointerId); } catch (_) {}

        e.preventDefault();

      });

      wheel.addEventListener('pointermove', (e) => {

        if (!this._holoDrag || this.holoSolved || this._holoLastA === null) return;

        const a = ang(e);

        let d = a - this._holoLastA;

        if (d > 180) d -= 360;

        if (d < -180) d += 360;

        this._holoLastA = a;

        this.applyHoloRot(d);

      });

      const stopDrag = () => { this._holoDrag = false; };

      wheel.addEventListener('pointerup', stopDrag);

      wheel.addEventListener('pointercancel', stopDrag);

      wheel.addEventListener('lostpointercapture', stopDrag);

    },



    /** رسم قوس المؤشر والمناطق (0..160 kPa) */

    buildHoloGauge(svg) {

      const NS = 'http://www.w3.org/2000/svg';

      const CX = 110, CY = 116, R = 88;

      const angFor = (kpa) => -110 + 220 * (kpa / 160);

      const polar = (deg) => {

        const r = deg * Math.PI / 180;

        return [CX + R * Math.sin(r), CY - R * Math.cos(r)];

      };

      const arc = (k1, k2, cls) => {

        const [x1, y1] = polar(angFor(k1));

        const [x2, y2] = polar(angFor(k2));

        const large = (angFor(k2) - angFor(k1)) > 180 ? 1 : 0;

        const p = document.createElementNS(NS, 'path');

        p.setAttribute('d', `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`);

        p.setAttribute('class', cls);

        svg.appendChild(p);

      };



      arc(0, 160, 'gauge-arc-bg');

      arc(0, 80, 'gauge-arc-danger');

      arc(95, 160, 'gauge-arc-safe');



      // علامات التدريج

      [0, 40, 80, 120, 160].forEach((k) => {

        const a = angFor(k) * Math.PI / 180;

        const line = document.createElementNS(NS, 'line');

        line.setAttribute('x1', CX + (R - 4) * Math.sin(a));

        line.setAttribute('y1', CY - (R - 4) * Math.cos(a));

        line.setAttribute('x2', CX + (R + 5) * Math.sin(a));

        line.setAttribute('y2', CY - (R + 5) * Math.cos(a));

        line.setAttribute('class', 'gauge-tick');

        svg.appendChild(line);

      });



      // علامة الهدف 101 kPa

      const [mx, my] = polar(angFor(101));

      const mk = document.createElementNS(NS, 'circle');

      mk.setAttribute('cx', mx);

      mk.setAttribute('cy', my);

      mk.setAttribute('r', 3.4);

      mk.setAttribute('class', 'gauge-target');

      svg.appendChild(mk);



      // الإبرة

      const grp = document.createElementNS(NS, 'g');

      grp.id = 'holoNeedle';

      grp.setAttribute('transform', `rotate(${angFor(41)} ${CX} ${CY})`);

      const needle = document.createElementNS(NS, 'line');

      needle.setAttribute('x1', CX);

      needle.setAttribute('y1', CY);

      needle.setAttribute('x2', CX);

      needle.setAttribute('y2', CY - R + 14);

      needle.setAttribute('class', 'gauge-needle');

      grp.appendChild(needle);

      svg.appendChild(grp);



      const hub = document.createElementNS(NS, 'circle');

      hub.setAttribute('cx', CX);

      hub.setAttribute('cy', CY);

      hub.setAttribute('r', 7);

      hub.setAttribute('class', 'gauge-hub');

      svg.appendChild(hub);

    },



    /** إضافة زاوية دوران للصمامل (بالعقارب فقط تنفع) */

    applyHoloRot(delta) {

      if (!this.hologramEl || this.holoSolved) return;

      this.holoRot = Math.max(0, Math.min(720, this.holoRot + delta));

      this.updateHoloUI();

    },



    updateHoloUI() {

      const ov = this.hologramEl;

      if (!ov) return;

      const ui = CHAPTER1_UI[this.lang === 'en' ? 'en' : 'ar'];



      const p = this.holoRot / 720;

      const kpa = Math.round(41 + 60 * p);



      const kpaEl = ov.querySelector('#holoKpa');

      if (kpaEl) kpaEl.textContent = kpa;



      const needle = ov.querySelector('#holoNeedle');

      if (needle) {

        const ang = -110 + 220 * (kpa / 160);

        needle.setAttribute('transform', `rotate(${ang} 110 116)`);

      }



      const face = ov.querySelector('.wheel-face');

      if (face) face.style.transform = `rotate(${this.holoRot}deg)`;



      const st = ov.querySelector('#holoStatus');

      if (st && !this.holoSolved) {

        if (kpa < 60) {

          st.textContent = ui.holoStatusLow;

          st.className = 'holo-status warn';

        } else {

          st.textContent = ui.holoStatusRaise;

          st.className = 'holo-status raise';

        }

      }



      // طقطقة مع التدوير

      const now = performance.now();

      if (now - this._holoSfxAt > 120) {

        this._holoSfxAt = now;

        Sfx.blip(420 + 360 * p, 0.03, 0.05, 'square');

      }



      if (p >= 1 && !this.holoSolved) this.solveHologram();

    },



    /** نجاح الفحص: الضغط 101 kPa */

    solveHologram() {

      this.holoSolved = true;

      const ov = this.hologramEl;

      if (ov) {

        const ui = CHAPTER1_UI[this.lang === 'en' ? 'en' : 'ar'];

        const st = ov.querySelector('#holoStatus');

        if (st) { st.textContent = ui.holoStatusDone; st.className = 'holo-status done'; }

        const wheel = ov.querySelector('#holoWheel');

        if (wheel) wheel.classList.add('locked');

        const kpaEl = ov.querySelector('#holoKpa');

        if (kpaEl) kpaEl.textContent = '101';

      }

      Sfx.ensure();

      Sfx.blip(700, 0.10, 0.12, 'sine');

      this.chapterTimers.push(setTimeout(() => Sfx.blip(1050, 0.14, 0.10, 'sine'), 150));

      this.chapterTimers.push(setTimeout(() => {

        this.closeHologram();

        this.oxyResolved = true;

        if (this.running) this.openDialogue('oxyDone');

      }, 1500));

    },



    closeHologram() {

      this.removeNode(this.hologramEl);

      this.hologramEl = null;

      this._holoWheel = null;

      this._holoDrag = false;

      this._holoLastA = null;

      this.paused = false;

    },



    /* ===========================================================

       تكملة القمر — الألغاز الثلاثة

       1) RHU: مسّ حراري استقرائي (اضغط E للاقتراب + أفلت في النطاق الآمن)

       2) LRRR: معايرة ليزر (قاوم الانحراف بالأسهم + E للإطلاق)

       3) الهوائي: بؤرة الطبق (حرّك المرسل نحو أقصى إشارة + E للتثبيت)

       كلها توقف اللعبة (paused) وتُنظف في stop()

       =========================================================== */



    /** إنذار فشل إطلاق الليزر — وميض أحمر + صوت خطأ ثم حوار التجمّد (المشهد 4) */

    laserFailAlert() {

      if (!this.running) return;

      Sfx.ensure();

      Sfx.blip(180, 0.30, 0.14, 'sawtooth');

      this.chapterTimers.push(setTimeout(() => Sfx.blip(140, 0.30, 0.14, 'sawtooth'), 260));



      // وميض أحمر تحذيري قصير (نفس عائلة impact-warn البصرية)

      const warn = document.createElement('div');

      warn.className = 'impact-warn laser-warn' + (this.lang === 'en' ? ' lang-en' : '');

      warn.dir = this.lang === 'ar' ? 'rtl' : 'ltr';

      warn.textContent = this.lang === 'en'

        ? 'LASER IGNITION FAILED — SENSOR BATTERY FROZEN AT -120°C!'

        : 'فشل إطلاق الليزر — بطارية المجس متجمدة عند -120°م!';

      this.host.appendChild(warn);

      this.warnEl = warn;



      this.chapterTimers.push(setTimeout(() => {

        if (this.warnEl) { this.warnEl.remove(); this.warnEl = null; }

        if (this.running) this.openDialogue('laserFail');

      }, 1500));

    },



    /** لغز 1 — إذابة صقيع بطارية الليزر بحرارة RHU (حلقة العودة — الغرفة 9) */

    openRhuPuzzle() {

      if (this.rhuEl || this.rhuSolved || !this.running) return;

      const isAr = this.lang === 'ar';

      const ui = CHAPTER1_UI[isAr ? 'ar' : 'en'];



      this.paused = true;

      this._rhuTemp = -120;

      this._rhuHold = false;

      this._rhuSolved = false;

      this._rhuLastTick = performance.now();



      Sfx.ensure();

      Sfx.blip(240, 0.15, 0.10, 'sine');



      const ov = document.createElement('div');

      ov.className = 'holo-overlay rhu-overlay' + (isAr ? '' : ' lang-en');

      ov.dir = isAr ? 'rtl' : 'ltr';

      ov.innerHTML = `

        <div class="holo-panel">

          <div class="holo-head">

            <span class="holo-title"></span>

            <span class="holo-sub">${ui.rhuSub}</span>

          </div>

          <div class="rhu-body">

            <div class="rhu-chamber">

              <div class="rhu-core"></div>

              <div class="rhu-sensor" id="rhuSensor"></div>

            </div>

            <div class="rhu-thermo">

              <div class="thermo-scale">

                <div class="thermo-fill" id="rhuFill"></div>

                <div class="thermo-safe"></div>

              </div>

              <div class="rhu-readout"><span id="rhuTemp">-40</span><i>°C</i></div>

            </div>

          </div>

          <div class="holo-status warn" id="rhuStatus"></div>

          <button type="button" class="puz-btn" id="rhuBtn"></button>

          <p class="holo-hint">${ui.rhuHint}</p>

        </div>`;

      ov.querySelector('.holo-title').textContent = ui.rhuTitle;

      ov.querySelector('#rhuStatus').textContent = ui.rhuStatusCold;

      const btn = ov.querySelector('#rhuBtn');

      btn.textContent = ui.rhuHold;

      this.host.appendChild(ov);

      this.rhuEl = ov;



      // زر الاقتراب (لمس) — والكيبورد يُوجَّه عبر معالج المفاتيح

      const press = (e) => {

        if (e) e.preventDefault();

        if (this._rhuSolved) return;

        Sfx.ensure();

        this._rhuHold = true;

      };

      const release = () => {

        this._rhuHold = false;

        this.rhuReleaseCheck();

      };

      btn.addEventListener('pointerdown', press);

      btn.addEventListener('pointerup', release);

      btn.addEventListener('pointercancel', release);

      btn.addEventListener('pointerleave', release);

      btn.addEventListener('contextmenu', (e) => e.preventDefault());



      // حلقة المحاكاة (50ms) — تقترب بالضغط وتبرد بالإفلات

      this._rhuTimer = setInterval(() => {

        if (!this.rhuEl || this._rhuSolved) return;

        const now = performance.now();

        const dt = Math.min(0.25, (now - this._rhuLastTick) / 1000);

        this._rhuLastTick = now;



        if (this._rhuHold) {

          this._rhuTemp += 24 * dt;      // الموصّل الحراري يلتقط دفء البلوتونيوم

          // نغمة صاعدة كلما ذاب الصقيع واقتربنا من النطاق

          if (Math.random() < 0.35) {

            const t01 = Math.max(0, Math.min(1, (this._rhuTemp + 120) / 160));

            Sfx.blip(300 + 700 * t01, 0.02, 0.035, 'sine');

          }

        } else {

          this._rhuTemp -= 11 * dt;     // الصقيع يعود بالإفلات

        }

        if (this._rhuTemp < -120) this._rhuTemp = -120;



        // تجاوز الحد = حرارة زائدة على البطارية → ارتداد حراري وإعادة

        if (this._rhuTemp > 34) {

          this._rhuTemp = -120;

          this._rhuHold = false;

          Sfx.ensure();

          Sfx.blip(160, 0.35, 0.16, 'sawtooth');

          this.updateRhuUI(true);

          return;

        }

        this.updateRhuUI(false);

      }, 50);

      this.chapterTimers.push(this._rhuTimer);

    },



    /** تحديث واجهة لغز الحرارة (overheat: وميض أحمر وإعادة) */

    updateRhuUI(overheat) {

      const ov = this.rhuEl;

      if (!ov) return;

      const ui = CHAPTER1_UI[this.lang === 'en' ? 'en' : 'ar'];

      const temp = Math.round(this._rhuTemp);



      const tEl = ov.querySelector('#rhuTemp');

      if (tEl) tEl.textContent = (temp > 0 ? '+' : '') + temp;



      // الترمومتر: من -120 إلى +40 → 0..100% (مدى إذابة صقيع البطارية)

      const p = (this._rhuTemp + 120) / 160;

      const fill = ov.querySelector('#rhuFill');

      if (fill) {

        fill.style.height = (Math.max(0, Math.min(1, p)) * 100) + '%';

        const safe = this._rhuTemp >= 14 && this._rhuTemp <= 22;

        fill.className = 'thermo-fill' + (safe ? ' in-safe' : '') + (this._rhuTemp > 26 ? ' near-hot' : '');

      }



      // مجس البدلة يقترب من الحجرة مع الحرارة

      const sensor = ov.querySelector('#rhuSensor');

      if (sensor) {

        const d = 92 - Math.max(0, Math.min(1, p)) * 62;   // 92px → 30px

        sensor.style.transform = `translateY(${d}px)`;

        sensor.className = 'rhu-sensor' + (this._rhuTemp >= 14 && this._rhuTemp <= 22 ? ' in-safe' : '');

      }



      const st = ov.querySelector('#rhuStatus');

      if (st) {

        if (overheat) {

          st.textContent = ui.rhuStatusHot;

          st.className = 'holo-status warn rhu-flash';

          ov.classList.add('rhu-overheat');

          this.chapterTimers.push(setTimeout(() => ov.classList.remove('rhu-overheat'), 600));

        } else if (this._rhuTemp >= 14 && this._rhuTemp <= 22) {

          st.textContent = ui.rhuStatusOk;

          st.className = 'holo-status done';

        } else {

          st.textContent = ui.rhuStatusCold;

          st.className = 'holo-status warn';

        }

      }

    },



    /** إفلات زر E — إن كنا داخل النطاق الآمن فهذا نجاح */

    rhuReleaseCheck() {

      if (!this.rhuEl || this._rhuSolved) return;

      if (this._rhuTemp >= 14 && this._rhuTemp <= 22) this.solveRhu();

    },



    solveRhu() {

      this._rhuSolved = true;

      this._rhuHold = false;

      Sfx.ensure();

      Sfx.blip(700, 0.10, 0.12, 'sine');

      this.chapterTimers.push(setTimeout(() => Sfx.blip(1050, 0.14, 0.10, 'sine'), 150));

      this.chapterTimers.push(setTimeout(() => {

        this.closeRhuPuzzle();

        this.rhuSolved = true;

        if (this.running) this.openDialogue('rhuDone');

      }, 1400));

    },



    closeRhuPuzzle() {

      if (this._rhuTimer) { clearInterval(this._rhuTimer); this._rhuTimer = null; }

      this.removeNode(this.rhuEl);

      this.rhuEl = null;

      this._rhuHold = false;

      this.paused = false;

    },



    /** لغز 2 — معايرة ليزر الملاحة على عاكس LRRR (الغرفة 12) */

    openLaserPuzzle() {

      if (this.laserEl || this.lrrrSolved || !this.running) return;

      const isAr = this.lang === 'ar';

      const ui = CHAPTER1_UI[isAr ? 'ar' : 'en'];



      this.paused = true;

      this._laserT = 0;

      this._laserOff = 0;      // تصحيح اللاعب

      this._laserSolved = false;

      this._laserLastTick = performance.now();

      this._laserBeepAt = 0;



      Sfx.ensure();

      Sfx.blip(900, 0.06, 0.09, 'square');



      const ov = document.createElement('div');

      ov.className = 'holo-overlay laser-overlay' + (isAr ? '' : ' lang-en');

      ov.dir = isAr ? 'rtl' : 'ltr';

      ov.innerHTML = `

        <div class="holo-panel">

          <div class="holo-head">

            <span class="holo-title"></span>

            <span class="holo-sub">${ui.laserSub}</span>

          </div>

          <div class="laser-body">

            <div class="laser-grid" id="laserGrid">

              <div class="laser-target"></div>

              <div class="laser-reticle" id="laserReticle"></div>

              <div class="laser-beam" id="laserBeam"></div>

            </div>

            <div class="laser-side">

              <div class="laser-meter"><div class="laser-meter-fill" id="laserMeter"></div></div>

              <div class="laser-meter-label">SIGNAL</div>

            </div>

          </div>

          <div class="holo-status warn" id="laserStatus"></div>

          <button type="button" class="puz-btn" id="laserBtn"></button>

          <p class="holo-hint">${ui.laserHint}</p>

        </div>`;

      ov.querySelector('.holo-title').textContent = ui.laserTitle;

      const st = ov.querySelector('#laserStatus');

      st.textContent = '···';

      const btn = ov.querySelector('#laserBtn');

      btn.textContent = ui.laserFire;

      btn.addEventListener('click', (e) => { e.preventDefault(); this.laserFire(); });

      this.host.appendChild(ov);

      this.laserEl = ov;



      // حلقة المحاكاة — المؤشر يتأرجح واللاعب يقاوم بالأسهم

      this._laserTimer = setInterval(() => {

        if (!this.laserEl || this._laserSolved) return;

        const now = performance.now();

        const dt = Math.min(0.25, (now - this._laserLastTick) / 1000);

        this._laserLastTick = now;

        this._laserT += dt;



        // تصحيح اللاعب بالأسهم (يُقرأ من مفاتيح الحركة المشتركة)

        if (this.keys.left)  this._laserOff -= 24 * dt;

        if (this.keys.right) this._laserOff += 24 * dt;

        this._laserOff = Math.max(-40, Math.min(40, this._laserOff));



        const drift = Math.sin(this._laserT * 1.15) * 15;

        this._laserX = drift + this._laserOff;   // % من عرض الشبكة حول المركز

        const align = Math.max(0, 1 - Math.abs(this._laserX) / 9);



        const ret = ov.querySelector('#laserReticle');

        if (ret) ret.style.transform = `translateX(${this._laserX}%)`;

        const meter = ov.querySelector('#laserMeter');

        if (meter) meter.style.width = (align * 100) + '%';



        // نقرات اقتراب — تزداد كثافة قرب المركز (كاشف معادن)

        if (now - this._laserBeepAt > (380 - 330 * align)) {

          this._laserBeepAt = now;

          if (align > 0.05) Sfx.blip(560 + 500 * align, 0.02, 0.04, 'square');

        }

      }, 50);

      this.chapterTimers.push(this._laserTimer);

    },



    /** إطلاق نبضة الليزر — النجاح فقط داخل نطاق التسامح */

    laserFire() {

      if (!this.laserEl || this._laserSolved) return;

      const ui = CHAPTER1_UI[this.lang === 'en' ? 'en' : 'ar'];

      const ov = this.laserEl;

      const st = ov.querySelector('#laserStatus');



      Sfx.ensure();

      if (Math.abs(this._laserX || 0) <= 7) {

        // إصابة مثالية — الشعاع يضرب العاكس ويرتد 180°

        this._laserSolved = true;

        Sfx.blip(1240, 0.18, 0.12, 'sine');

        this.chapterTimers.push(setTimeout(() => Sfx.blip(1860, 0.22, 0.10, 'sine'), 160));

        const beam = ov.querySelector('#laserBeam');

        if (beam) beam.classList.add('fire');

        if (st) { st.textContent = ui.laserHit; st.className = 'holo-status done'; }

        this.chapterTimers.push(setTimeout(() => {

          this.closeLaserPuzzle();

          this.lrrrSolved = true;

          if (this.running) this.openDialogue('lrrrDone');

        }, 1600));

      } else {

        Sfx.blip(180, 0.20, 0.12, 'sawtooth');

        if (st) { st.textContent = ui.laserMiss; st.className = 'holo-status warn laser-shake'; }

        ov.classList.add('laser-missed');

        this.chapterTimers.push(setTimeout(() => ov.classList.remove('laser-missed'), 450));

      }

    },



    closeLaserPuzzle() {

      if (this._laserTimer) { clearInterval(this._laserTimer); this._laserTimer = null; }

      this.removeNode(this.laserEl);

      this.laserEl = null;

      this.paused = false;

    },



    /** لغز 3 — بؤرة الهوائي المقعر (الغرفة 13 — ختام الفصل) */

    openAntennaPuzzle() {

      if (this.antennaEl || this.antennaSolved || !this.running) return;

      const isAr = this.lang === 'ar';

      const ui = CHAPTER1_UI[isAr ? 'ar' : 'en'];



      this.paused = true;

      this._antX = 0.16;         // موضع المرسل على المحور 0..1

      this._antFocus = 0.64;     // البؤرة (يمين المركز قليلاً)

      this._antSolved = false;

      this._antLastTick = performance.now();

      this._antToneAt = 0;



      Sfx.ensure();

      Sfx.blip(300, 0.15, 0.10, 'sine');



      const ov = document.createElement('div');

      ov.className = 'holo-overlay antenna-overlay' + (isAr ? '' : ' lang-en');

      ov.dir = isAr ? 'rtl' : 'ltr';

      ov.innerHTML = `

        <div class="holo-panel">

          <div class="holo-head">

            <span class="holo-title"></span>

            <span class="holo-sub">${ui.antennaSub}</span>

          </div>

          <div class="ant-body">

            <svg viewBox="0 0 320 150" class="ant-dish">

              <path d="M 46 108 Q 160 -6 274 108" class="ant-parabola"></path>

              <line x1="160" y1="34" x2="160" y2="126" class="ant-rail"></line>

              <circle cx="160" cy="126" r="4" class="ant-hub"></circle>

              <circle id="antTx" cx="76" cy="34" r="9" class="ant-tx"></circle>

              <g id="antWaves"></g>

            </svg>

            <div class="ant-meter">

              <div class="ant-bars" id="antBars"></div>

              <div class="ant-gain"><span id="antGain">1×</span></div>

            </div>

          </div>

          <div class="holo-status warn" id="antStatus"></div>

          <button type="button" class="puz-btn" id="antBtn"></button>

          <p class="holo-hint">${ui.antennaHint}</p>

        </div>`;



      ov.querySelector('.holo-title').textContent = ui.antennaTitle;

      const st = ov.querySelector('#antStatus');

      st.textContent = '···';



      // 12 شريط إشارة

      const bars = ov.querySelector('#antBars');

      for (let i = 0; i < 12; i++) {

        const b = document.createElement('i');

        bars.appendChild(b);

      }



      const btn = ov.querySelector('#antBtn');

      btn.textContent = ui.antennaLock;

      btn.addEventListener('click', (e) => { e.preventDefault(); this.antennaLock(); });

      this.host.appendChild(ov);

      this.antennaEl = ov;



      // حلقة المحاكاة — المرسل يتحرك بالأسهم والإشارة تُقاس لحظياً

      this._antTimer = setInterval(() => {

        if (!this.antennaEl || this._antSolved) return;

        const now = performance.now();

        const dt = Math.min(0.25, (now - this._antLastTick) / 1000);

        this._antLastTick = now;



        if (this.keys.left)  this._antX -= 0.30 * dt;

        if (this.keys.right) this._antX += 0.30 * dt;

        this._antX = Math.max(0.04, Math.min(0.96, this._antX));



        const strength = this.antennaStrength();

        this.updateAntennaUI(strength);



        // نغمة تكسب حدة مع الاقتراب من البؤرة

        if (now - this._antToneAt > 110) {

          this._antToneAt = now;

          Sfx.blip(260 + 980 * strength, 0.018, 0.03, 'sine');

        }

      }, 50);

      this.chapterTimers.push(this._antTimer);

    },



    /** قوة الإشارة 0..1 — جرس حول البؤرة مع ضوضاء خفيفة */

    antennaStrength() {

      const d = this._antX - this._antFocus;

      const bell = Math.exp(-(d * d) / (2 * 0.055 * 0.055));

      return Math.max(0, Math.min(1, bell + (Math.random() - 0.5) * 0.03));

    },



    updateAntennaUI(strength) {

      const ov = this.antennaEl;

      if (!ov) return;

      const ui = CHAPTER1_UI[this.lang === 'en' ? 'en' : 'ar'];



      // المرسل على محور التقاطع (x من 40 إلى 280 بإحداثيات الـ SVG)

      const tx = ov.querySelector('#antTx');

      if (tx) tx.setAttribute('cx', 40 + this._antX * 240);



      // أشرطة الإشارة

      const bars = ov.querySelectorAll('#antBars i');

      const lit = Math.round(strength * 12);

      bars.forEach((b, i) => { b.className = i < lit ? 'on' + (i >= 10 ? ' hot' : '') : ''; });



      const gain = ov.querySelector('#antGain');

      if (gain) gain.textContent = (1 + strength * 11).toFixed(1) + '×';



      const st = ov.querySelector('#antStatus');

      if (st && !this._antSolved) {

        if (strength > 0.85) {

          st.textContent = ui.antennaLocked;

          st.className = 'holo-status done';

        } else {

          st.textContent = ui.antennaWeak;

          st.className = 'holo-status warn';

        }

      }

    },



    /** تثبيت البث — ينجح فقط قرب البؤرة */

    antennaLock() {

      if (!this.antennaEl || this._antSolved) return;

      const ui = CHAPTER1_UI[this.lang === 'en' ? 'en' : 'ar'];

      const strength = this.antennaStrength();



      Sfx.ensure();

      if (strength > 0.85) {

        this._antSolved = true;

        const ov = this.antennaEl;

        ov.classList.add('ant-locked');

        // موجة بث تنبثق من المرسل

        const waves = ov.querySelector('#antWaves');

        if (waves) {

          const tx = ov.querySelector('#antTx');

          const cx = Number(tx.getAttribute('cx')) || 76;

          for (let i = 0; i < 3; i++) {

            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

            c.setAttribute('cx', cx);

            c.setAttribute('cy', 34);

            c.setAttribute('r', 10 + i * 9);

            c.setAttribute('class', 'ant-wave');

            c.style.animationDelay = (i * 0.18) + 's';

            waves.appendChild(c);

          }

        }

        Sfx.blip(760, 0.12, 0.12, 'sine');

        this.chapterTimers.push(setTimeout(() => Sfx.blip(1140, 0.14, 0.10, 'sine'), 140));

        this.chapterTimers.push(setTimeout(() => Sfx.blip(1520, 0.2, 0.10, 'sine'), 300));

        this.chapterTimers.push(setTimeout(() => {

          this.closeAntennaPuzzle();

          this.antennaSolved = true;

          if (this.running) this.openDialogue('antennaDone');

        }, 1900));

      } else {

        Sfx.blip(170, 0.2, 0.12, 'sawtooth');

        const st = this.antennaEl.querySelector('#antStatus');

        if (st) { st.textContent = ui.antennaWeak; st.className = 'holo-status warn laser-shake'; }

      }

    },



    closeAntennaPuzzle() {

      if (this._antTimer) { clearInterval(this._antTimer); this._antTimer = null; }

      this.removeNode(this.antennaEl);

      this.antennaEl = null;

      this.paused = false;

    },



    startImpactCutscene() {

      // يُطلق مرة واحدة فقط في الجولة الواحدة

      if (this.impactTriggered || this.transitioning || this.cutsceneActive) return;

      this.impactTriggered = true;

      this.cutsceneActive = true;



      Sfx.ensure();

      Sfx.explosion();

      Sfx.siren(4);



      // اهتزاز الشاشة

      if (this.host) {

        this.host.classList.remove('screen-shake');

        void this.host.offsetWidth; // إعادة تشغيل الأنيميشن

        this.host.classList.add('screen-shake');

      }



      // الشاشة التحذيرية الحمراء الوامضة (بلغة اللاعب)

      const warn = document.createElement('div');

      warn.className = 'impact-warn' + (this.lang === 'en' ? ' lang-en' : '');

      warn.dir = this.lang === 'ar' ? 'rtl' : 'ltr';

      warn.textContent = IMPACT_WARN[this.lang] || IMPACT_WARN.ar;

      this.host.appendChild(warn);

      this.warnEl = warn;



      // بعد التحذير: تعتيم → تبديل الخلفية للفيديو → حوار الاصطدام

      this.cutsceneTimers.push(setTimeout(() => {

        if (!this.running) return;

        if (this.fadeEl) this.fadeEl.classList.add('on');

      }, 2600));



      this.cutsceneTimers.push(setTimeout(() => {

        if (!this.running) return;

        this.startImpactVideo();

        if (this.warnEl) { this.warnEl.remove(); this.warnEl = null; }

        if (this.host) this.host.classList.remove('screen-shake');

      }, 3300));



      this.cutsceneTimers.push(setTimeout(() => {

        if (!this.running) return;

        if (this.fadeEl) this.fadeEl.classList.remove('on');

        this.openDialogue('impact');

      }, 4100));

    },



    /** تشغيل فيديو غرفة الكبسولة المتضررة كخلفية + تجهيز فيديوهات الأزمة */

    startImpactVideo() {

      if (this.videoEl) return;



      const v = document.createElement('video');

 // : الفيديو المحمَّل مسبقاً (Blob) إن توفر

      v.src = (window.OSIRIS_PRELOADER && OSIRIS_PRELOADER.videoSrc(ASSETS.roomVideos.airlockDamaged)) || ASSETS.roomVideos.airlockDamaged;

      v.autoplay = true;

      v.muted = true;          // مسموح مع سياسة Autoplay

      v.loop = true;

      v.playsInline = true;

      v.setAttribute('playsinline', '');

      v.preload = 'auto';

      v.style.cssText = 'position:absolute;width:2px;height:2px;opacity:0;pointer-events:none;';

      this.host.appendChild(v);

      this.videoEl = v;

      this.crisis = true;      // وضع الأزمة: خلفية الفيديو + سلسلة الغرف الجديدة

      this.exitOpen = true;    // البوابة اليسرى مفتوحة (الانفجار دفعنا للخروج)

      v.play().catch(() => {});



      // تجهيز مسبق لفيديوهات الغرفتين التاليتين (الممر والغرفة المتضررة) مخفيَّين

      this.createCrisisVideo(4);

      this.createCrisisVideo(5);

    },



    /** إنشاء عنصر فيديو مخفي لغرفة بعد الاصطدام (يُرسم في Canvas كخلفية) */

    createCrisisVideo(index) {

      const room = ROOMS[index];

      if (!room || !room.video || this.roomVideos[index]) return;



      const v = document.createElement('video');

 // : الفيديو المحمَّل مسبقاً (Blob) إن توفر

      v.src = (window.OSIRIS_PRELOADER && OSIRIS_PRELOADER.videoSrc(room.video)) || room.video;

      v.muted = true;          // تشغيل تلقائي بدون صوت

      v.loop = true;

      v.playsInline = true;

      v.setAttribute('playsinline', '');

      v.preload = 'auto';

      v.style.cssText = 'position:absolute;width:2px;height:2px;opacity:0;pointer-events:none;';

      this.host.appendChild(v);

      this.roomVideos[index] = v;



      // تحميل أول إطار حتى تكون الخلفية جاهزة فور دخول الغرفة

      v.play().then(() => { try { v.pause(); } catch (_) {} }).catch(() => {});

    },



    /** لافتة المهمة العاجلة — تظهر بعد انتهاء حوار الاصطدام */

    showMission() {

      if (this.missionEl) return;

      Sfx.ensure();

      Sfx.missionAlert();



      const el = document.createElement('div');

      el.className = 'mission-banner' + (this.lang === 'en' ? ' lang-en' : '');

      el.dir = this.lang === 'ar' ? 'rtl' : 'ltr';

      el.textContent = MISSION_TASK[this.lang] || MISSION_TASK.ar;

      this.host.appendChild(el);

      this.missionEl = el;

    },



    /** سهم وامض — إشارة إخراج الغرفة (side: 'left' | 'right') */

    showExitHint(side = 'left') {

      // إنشاء العنصر أول مرة فقط (يُعاد استخدامه بعدها)

      if (!this.exitHintEl || !this.exitHintEl.parentNode) {

        const hint = document.createElement('div');

        hint.className = 'exit-hint';

        hint.innerHTML = '<span class="arrow">◀</span>';

        this.host.appendChild(hint);

        this.exitHintEl = hint;

      }

      // تحديد الحالة كاملة كل مرة (بدون ملخصات قديمة تمنع إظهاره ثانية)

      const cls = 'exit-hint' + (side === 'right' ? ' exit-right' : '');

      this.exitHintEl.className = cls;

      this.exitHintEl.querySelector('.arrow').textContent = side === 'right' ? '▶' : '◀';

      this.exitHintSide = side;

      this.exitHintEl.classList.remove('hidden');

    },



    hideExitHint() {

      if (this.exitHintEl) this.exitHintEl.classList.add('hidden');

    },



    /** الحفاظ على حالة سهم الخروج كل إطار (يُعاد تقييمه دائماً — السهم لا يختفي نهائياً) */

    updateExitHint() {

      let side = null;

      if (!this.transitioning && !this.dialogueActive && !this.paused && !this.autoWalk && !this.cutsceneActive) {

        if (this.crisis) {

          // بعد الاصطدام: الأسهم تتجه يساراً نحو غرف الفيديو المتضررة

          if (this.room === 3 || this.room === 4) side = 'left';

          // الغرفة 5 (حوار الوداع) والغرفة 6 (القمرة): لا أسهم

          // سطح القمر: بعد لوحة الذكريات → شرقاً نحو أبولو 11

          if (this.room === 7 && this.eastOpen) side = 'right';

          // الاسكربت المطور — الشرق أولوية متى فُتح، وإلا الغرب للعودة (حلقة ذكية)

          // المشهد 2: الآثار والعلم | المشهد 3: فحص PSEP | المشهد 4: فشل المعايرة

          // المشهد 5: مسارات العجلات | المشهد 6: البث الناجح | المشهد 7: لا شرق (النهاية)

          if (this.room === 8) side = this.flagDone ? 'right' : 'left';

          if (this.room === 9) side = this.psepSeen ? 'right' : 'left';

          if (this.room === 10) side = this.laserFailSeen ? 'right' : 'left';

          if (this.room === 11) side = this.tracksSeen ? 'right' : 'left';

          if (this.room === 12) side = this.antennaSolved ? 'right' : 'left';

          // المشهد 7 (منصة الإطلاق): غرباً فقط قبل الصعود — ثم لا أسهم (الإقلاع)

          if (this.room === 13 && !this.boarded) side = 'left';

        } else if (this.marsMode) {

 // غرف المريخ (حديقة التراث الفضائي 14..20)

          if (this.room === 14 && this.beaconTaken) side = 'right';

          // ممر العزل: لا سهم قبل فتح البوابة — بعدها شرقاً للخروج

          if (this.room === 15) side = this.doorOpened ? 'right' : 'left';

          if (this.room === 16) side = 'right';

          if (this.room === 17) side = this.sojournerSeen ? 'right' : 'left';

          if (this.room === 18) side = this.insightSeen ? 'right' : 'left';

          if (this.room === 19) side = this.beaconMounted ? 'right' : (this.oppySeen ? null : 'left');

          if (this.room === 20) side = 'right';

          // الغرفة 21 (اللقاء): لا أسهم — طارق أمامك داخل القمرة

        } else if (this.podStage) {

          // بعد حوار طارق: كل الأسهم نحو حجرة كبسولة الهروب «الغرفة صفر» — يميناً

          if (this.room === 0 || this.room === 1 || this.room === 2) side = 'right';

          // داخل حجرة الكبسولة نفسها: لا سهم (هي الوجهة) — اليمين مجرد جدار

        } else if (this.room === 0 && this.exitOpen) {

          side = 'left';    // غرفة الصور → الغرفة الثانية (أماماً يساراً)

        } else if (this.room === 1) {

          side = 'left';    // الغرفة الثانية → قمرة القيادة (أماماً يساراً دائماً)

        } else if (this.room === 2) {

          side = 'right';   // قمرة القيادة → العودة للغرفة الثانية

        }

      }

      if (side) this.showExitHint(side);

      else this.hideExitHint();

    },



    /* -------------------------------------------------------

       الغرف ونقاط التفاعل

       ------------------------------------------------------- */

    currentHotspots() {

      const room = ROOMS[this.room];

      return room ? room.hotspots : [];

    },



    /** يحوّل مستطيلاً بإحداثيات الصورة الأصلية إلى إحداثيات الشاشة */

    srcRectToScreen(hs) {

      const img = this.roomImgs[this.room];

      const iw = (img && img.naturalWidth) || 2752;

      const ih = (img && img.naturalHeight) || 1536;



      const scale = Math.max(this.W / iw, this.H / ih);

      const dw = iw * scale;

      const dh = ih * scale;

      const dx = (this.W - dw) / 2;

      const dy = (this.H - dh) / 2;



      return {

        x: dx + hs.bx * scale,

        y: dy + hs.by * scale,

        w: hs.bw * scale,

        h: hs.bh * scale,

      };

    },



    /** مستطيل طارق على الشاشة (مكان وقوفه) */

    tariqRect() {

      return this.npcRect(this.tariqX());

    },



    /** مستطيل NPC واقف على خط الأرض عند x */

    npcRect(npcX) {

      const ground = this.groundY();

      const h = this.IDLE_HEIGHT;

      const w = (this.tariqMeta && this.tariqMeta.w > 0)

        ? this.tariqMeta.w * this.tariqMeta.scale : 60;

      return { x: npcX - w / 2, y: ground - h, w, h };

    },



    /** مستطيل نقطة تفاعل بنسب من الشاشة (الغرفة 7 — سطح القمر) */

    fracRect(hs) {

      const cx = hs.sxf * this.W;

      const cy = hs.syf * this.H;

      const half = (hs.size || 220) * 0.5 * Math.min(1.2, Math.max(0.7, this.W / 1400));

      return { x: cx - half, y: cy - half, w: half * 2, h: half * 2, cx, cy };

    },



    /** أقرب نقطة تفاعل قريبة من زين — أو null */

    nearHotspot() {

      for (const hs of this.currentHotspots()) {

        // نقاط الفصل الأول (نسب من الشاشة — سطح القمر) — مع شروط التسلسل

        if (hs.sxf !== undefined) {

          if (hs.id === 'oxyValve' && this.oxyResolved) continue;

          if (hs.id === 'plaque' && (this.plaqueTaken || !this.oxyResolved)) continue;

 // الاسكربت المطور — شروط ظهور نقاط المشاهد 2..7 

          // المشهد 2: الآثار ثم العلم الأبيض

          if (hs.id === 'footprints' && this.footprintsDone) continue;

          if (hs.id === 'flag' && (this.flagDone || !this.footprintsDone)) continue;

          // المشهد 3: فحص PSEP مرة واحدة — كبسولة RHU بعد اكتشاف الحلقة فقط

          if (hs.id === 'psep' && this.psepSeen) continue;

          if (hs.id === 'rhu' && (this.rhuSolved || !this.dishDiscovered)) continue;

          // المشهد 4: العاكس (فحص ← فشل ← [حلقة] لغز المعايرة)

          if (hs.id === 'lrrr' && this.lrrrSolved) continue;

          // المشهد 5: مسارات العجلات مرة واحدة

          if (hs.id === 'tracks' && this.tracksSeen) continue;

          // المشهد 6: العربة ← العجلات ← الكاميرا ← الطبق (اكتشاف الحلقة ثم البث)

          if (hs.id === 'lrv' && this.lrvSeen) continue;

          if (hs.id === 'wheels' && (this.wheelsSeen || !this.lrvSeen)) continue;

          if (hs.id === 'camera' && (this.cameraSeen || !this.wheelsSeen)) continue;

          // الطبق: متاح للاكتشاف بعد الكاميرا — ثم مخفي حتى قفل إحداثيات LRRR — ثم يفتح للبث

          if (hs.id === 'antenna' && (this.antennaSolved || !this.cameraSeen)) continue;

          if (hs.id === 'antenna' && this.dishDiscovered && !this.lrrrSolved) continue;

          // المشهد 7: سلم مركبة العبور — بعد هبوطها (البث الناجح) وقبل الصعود

          if (hs.id === 'ladder' && (this.boarded || !this.antennaSolved)) continue;

 /* تسلسل غرف المريخ 14..20 (الاسكربت الجديد) — */

          if (hs.id === 'habitatWindow' && (!this.habitatIntroDone || !this.marsMode)) continue;

          if (hs.id === 'beaconTable' && (this.beaconTaken || !this.habitatIntroDone)) continue;

          if (hs.id === 'airlockDoor' && (this.doorOpened || !this.beaconTaken)) continue;

          if (hs.id === 'sojourner' && (this.sojournerSeen || !this.marsMode)) continue;

          if (hs.id === 'insight' && (this.insightSeen || !this.sojournerSeen)) continue;

          if (hs.id === 'oppy' && (this.oppySeen || !this.insightSeen)) continue;

          if (hs.id === 'oppyMast' && (this.beaconMounted || !this.oppySeen)) continue;

          if (hs.id === 'tariqMars' && (!this.sunriseDone || this.reunionDone)) continue;

          const rect = this.fracRect(hs);

          if (Math.abs(this.charX - rect.cx) <= this.HOTSPOT_RANGE) return { hs, rect };

          continue;

        }

        if (hs.npc) {

          const cx = hs.npcX ? Math.round(this.W * hs.npcX) : this.tariqX();

          const rect = this.npcRect(cx);

          if (Math.abs(this.charX - cx) <= this.NPC_INTERACT_RANGE) return { hs, rect, npcX: cx };

          continue;

        }

        const rect = this.srcRectToScreen(hs);

        const cx = rect.x + rect.w / 2;

        if (Math.abs(this.charX - cx) <= this.HOTSPOT_RANGE) return { hs, rect };

      }

      return null;

    },



    interact() {

      // أثناء أي سينم لا يُسمح بالتفاعل

      if (this.cutsceneActive) return;



      const near = this.nearHotspot();

      if (!near) {

        // لا شيء في المدى — نغمة خفيفة هادئة + رسالة (بدون صوت الاختيار المشرق)

        Sfx.ensure();

        Sfx.blip(220, 0.05, 0.06, 'square');

        this.showToast(TOAST[this.lang] || TOAST.ar);

        return;

      }



      Sfx.ensure();

      Sfx.ePress();



      // الفصل الأول — سطح القمر: صمام الأكسجين (هولوجرام الفحص)

      if (this.crisis && this.room === 7 && near.hs.id === 'oxyValve' && !this.oxyResolved) {

        this.openHologram();

        return;

      }

      // الفصل الأول — لوحة الذكريات اللامعة على الأرض

      if (this.crisis && this.room === 7 && near.hs.id === 'plaque' && !this.plaqueTaken) {

        this.plaqueTaken = true;

        this.openDialogue('plaque');

        return;

      }



 /* ===== الاسكربت المطور — نقاط التفاعل في المشاهد 2..7 ===== */

      const lunar = this.crisis && this.room >= 8 && !this.marsMode;



      // المشهد 2 — آثار الأقدام ثم العلم الأبيض

      if (lunar && near.hs.id === 'footprints') {

        this.footprintsDone = true;

        this.openDialogue('footprints');

        return;

      }

      if (lunar && near.hs.id === 'flag') {

        this.flagDone = true;

        this.openDialogue('flag');

        return;

      }



      // المشهد 3 — فحص PSEP (مرة) ثم [حلقة العودة] إذابة صقيع الليزر من RHU

      if (lunar && near.hs.id === 'psep') {

        this.psepSeen = true;

        this.openDialogue('psepIntro');

        return;

      }

      if (lunar && near.hs.id === 'rhu' && !this.rhuSolved) {

        this.openRhuPuzzle();

        return;

      }



      // المشهد 4 — العاكس: فحص ← محاولة معايرة (فشل التجمّد) ← [الحلقة] اللغز

      if (lunar && near.hs.id === 'lrrr' && !this.lrrrSolved) {

        if (!this.lrrrSeen) {

          this.openDialogue('lrrrIntro');

        } else if (!this.laserFailSeen) {

          this.laserFailAlert();

        } else if (!this.rhuSolved) {

          this.laserFailAlert();          // تكرار التحذير: البطارية ما زالت متجمدة

        } else {

          this.openLaserPuzzle();         // بعد الإذابة — نبضة المعايرة (المهمة 11)

        }

        return;

      }



      // المشهد 5 — مسارات العجلات في ممر الجبال

      if (lunar && near.hs.id === 'tracks') {

        this.tracksSeen = true;

        this.openDialogue('tracks');

        return;

      }



      // المشهد 6 — العربة LRV: فحص ← عجلات ← كاميرا ← طبق (اكتشاف الحلقة ثم البث)

      if (lunar && near.hs.id === 'lrv') {

        this.lrvSeen = true;

        this.openDialogue('roverInspect');

        return;

      }

      if (lunar && near.hs.id === 'wheels') {

        this.wheelsSeen = true;

        this.openDialogue('wheels');

        return;

      }

      if (lunar && near.hs.id === 'camera') {

        this.cameraSeen = true;

        this.openDialogue('camera');

        return;

      }

      if (lunar && near.hs.id === 'antenna' && !this.antennaSolved) {

        if (!this.dishDiscovered) {

          this.openDialogue('dishDiscovery');

        } else {

          this.openDialogue('antenna');   // بعد قفل إحداثيات LRRR — مقدمة لغز البث

        }

        return;

      }



      // المشهد 7 — سلم مركبة العبور: الصعود والإقلاع (المهمة 13)

      if (lunar && near.hs.id === 'ladder' && this.antennaSolved && !this.boarded) {

        this.startLaunchSequence();

        return;

      }



 /* ===== غرف المريخ 14..20 — نقاط التفاعل (الاسكربت الجديد) ===== */

      if (this.marsMode && this.room === 14 && near.hs.id === 'beaconTable' && !this.beaconTaken) {

        this.beaconTaken = true;

        Sfx.blip(880, 0.1, 0.1, 'sine');

        this.openDialogue('beaconPickup');

        return;

      }

      if (this.marsMode && this.room === 14 && near.hs.id === 'habitatWindow') {

        this.showToast(this.lang === 'en'

          ? 'The Martian sky is clear... the stars are beautiful tonight.'

          : 'سماء المريخ صافية... النجوم جميلة الليلة.');

        return;

      }

      if (this.marsMode && this.room === 15 && near.hs.id === 'airlockDoor' && !this.doorOpened) {

        this.openAirlockDoor();

        return;

      }

      if (this.marsMode && this.room === 17 && near.hs.id === 'sojourner' && !this.sojournerSeen) {

        this.openDialogue('sojournerDlg');

        return;

      }

      if (this.marsMode && this.room === 18 && near.hs.id === 'insight' && !this.insightSeen) {

        this.openDialogue('insightDlg');

        return;

      }

      if (this.marsMode && this.room === 19 && near.hs.id === 'oppy' && !this.oppySeen) {

        this.openDialogue('oppyDlg');

        return;

      }

      if (this.marsMode && this.room === 19 && near.hs.id === 'oppyMast' && this.oppySeen && !this.beaconMounted) {

        this.mountBeaconOnOppy();

        return;

      }

      if (this.marsMode && this.room === 21 && near.hs.id === 'tariqMars' && !this.reunionDone) {

        this.openDialogue('reunionTalk');

        return;

      }



 /* ===== — خلف الكواليس: حوارات أعضاء فريق NileStro ===== */

      if (this.creditsMode) {

        if (this.room === 22 && near.hs.id === 'npcMalak' && !this.credSeen[0]) {

          this.openDialogue('credMalak');

          return;

        }

        if (this.room === 23 && near.hs.id === 'npcRanya' && !this.credSeen[1]) {

          this.openDialogue('credRanya');

          return;

        }

        if (this.room === 24 && near.hs.id === 'npcMazen' && !this.credSeen[2]) {

          this.openDialogue('credMazen');

          return;

        }

        if (this.room === 25 && near.hs.id === 'devScreen' && !this.credSeen[3]) {

          this.openDialogue('credMohamed');

          return;

        }

      }

      // الرافع بجانب باب الكبسولة — يطلق سينما الاصطدام بدل حوار عادي

      if (near.hs.id === 'lever') {

        this.startImpactCutscene();

        return;

      }

      // حوار الوداع مع طارق (بعد الاصطدام) — يُفتح مرة واحدة

      if (near.hs.id === 'farewell') {

        if (!this.farewellDone) this.openDialogue('farewell');

        return;

      }

      this.openDialogue(near.hs.id);

    },



    /** الانتقال إلى غرفة أخرى مع دخول سينمائي من الجهة المحددة

     *  opts: { enterTargetX, arriveFacing, arriveRelease } */

    goToRoom(nextRoom, entrySide, opts = {}) {

      const mediaReady = this.roomImgs[nextRoom] || this.roomVideos[nextRoom];

      if (this.transitioning || this.room === nextRoom || !mediaReady) return;



      Sfx.ensure();

      Sfx.blip(300, 0.09, 0.10, 'triangle'); // نغمة انتقال الغرف



      this.transitioning = true;

      this.hideExitHint();

      if (this.fadeEl) this.fadeEl.classList.add('on');



      // إدارة تشغيل فيديوهات الأزمة (نوقف غير الحالية لتوفير الأداء)

      for (const idx of Object.keys(this.roomVideos)) {

        const v = this.roomVideos[idx];

        if (v && Number(idx) !== nextRoom) { try { v.pause(); } catch (_) {} }

      }

      if (this.videoEl && nextRoom !== 3) { try { this.videoEl.pause(); } catch (_) {} }



      const begin = () => {

        this.room = nextRoom;

        this.hasMoved = true;



        // العودة للغرفة الوسطى أو دخول الغرفة الثالثة يتيح الخروج مجدداً

        if (nextRoom === 2) this.exitOpen = true;

        if (this.crisis && (nextRoom === 3 || nextRoom === 4)) this.exitOpen = true;



        if (entrySide === 'right') {

          this.charX = this.W + 50;                 // يدخل من يمين الشاشة

          this.autoTargetX = opts.enterTargetX != null

            ? opts.enterTargetX

            : Math.max(0, this.W - this.startX());

          this.facing = -1;

        } else {

          this.charX = -50;                          // يدخل من يسار الشاشة

          this.autoTargetX = this.startX();

          this.facing = 1;

        }



        // استئناف فيديو الغرفة الجديدة إن وُجد

        if (this.roomVideos[nextRoom]) {

          this.roomVideos[nextRoom].play().catch(() => {});

        }



        this.autoWalk = true;

        this.onScriptArrive = null;

        if (opts.arriveFacing != null) {

          this.onScriptArrive = () => { this.facing = opts.arriveFacing; };

        }

        // إجراء إضافي عند الوصول (لا يُطلق الحركة — يبقى داخل السينما)

        if (opts.arriveAction) {

          const prev = this.onScriptArrive;

          this.onScriptArrive = () => {

            if (prev) prev();

            opts.arriveAction();

          };

        }

        if (opts.arriveRelease) {

          const prev = this.onScriptArrive;

          this.onScriptArrive = () => {

            if (prev) prev();

            this.cutsceneActive = false;

          };

        }



        // إدخال سينمائي قصير داخل الغرفة ثم وقوف

        this.anim = 'walk';

        this.frameIdx = 0;

        this.frameTimer = 0;

        this.lastWalkFrame = 0;



        if (this.fadeEl) this.fadeEl.classList.remove('on');



        this.transitionTimers.push(setTimeout(() => { this.transitioning = false; }, 550));

      };



      // مؤقّتات متتبعة — تُلغى عند stop() حتى لا تعدّل الحالة بعد الإيقاف

      this.transitionTimers.push(setTimeout(begin, 650));

    },



    /* -------------------------------------------------------

       تحميل الصور واستخراج معلومات كل ورقة

       ------------------------------------------------------- */

    loadImages() {

      const load = (src) => new Promise((res, rej) => {

        const img = new Image();

        img.onload = () => res(img);

        img.onerror = rej;

 // : المسار المحمَّل مسبقاً (Blob) إن توفر — ظهور فوري بلا انتظار

        img.src = (window.OSIRIS_PRELOADER && OSIRIS_PRELOADER.imageSrc(src)) || src;

      });



      let done = 0;

      // 20 خلفية غرف + بوابة مفتوحة + مسارات + 4 أوراق شخصيات

 // : + 4 مكاتب الفريق + الصورة الختامية + 5 أوراق الفريق = 36

      const total = 36;

      const tick = () => { done++; this.loadProgress = done / total; };



      return Promise.all([

        load(ROOMS[0].img).then(i => { this.roomImgs[0] = i; tick(); }),

        load(ROOMS[1].img).then(i => { this.roomImgs[1] = i; tick(); }),

        load(ROOMS[2].img).then(i => { this.roomImgs[2] = i; tick(); }),

        load(ROOMS[3].img).then(i => { this.roomImgs[3] = i; tick(); }),

        load(ROOMS[6].img).then(i => { this.roomImgs[6] = i; tick(); }),

        load(ROOMS[7].img).then(i => { this.roomImgs[7] = i; tick(); }),

        load(ROOMS[8].img).then(i => { this.roomImgs[8] = i; tick(); }),

        load(ROOMS[9].img).then(i => { this.roomImgs[9] = i; tick(); }),

        load(ROOMS[10].img).then(i => { this.roomImgs[10] = i; tick(); }),

        load(ROOMS[11].img).then(i => { this.roomImgs[11] = i; tick(); }),

        load(ROOMS[12].img).then(i => { this.roomImgs[12] = i; tick(); }),

        load(ROOMS[13].img).then(i => { this.roomImgs[13] = i; tick(); }),

 /* غرف المريخ 14..20 (حديقة التراث الفضائي — الاسكربت الجديد) */

        load(ROOMS[14].img).then(i => { this.roomImgs[14] = i; tick(); }),

        load(ROOMS[15].img).then(i => { this.roomImgs[15] = i; tick(); }),

        load(ROOMS[16].img).then(i => { this.roomImgs[16] = i; tick(); }),

        load(ROOMS[17].img).then(i => { this.roomImgs[17] = i; tick(); }),

        load(ROOMS[18].img).then(i => { this.roomImgs[18] = i; tick(); }),

        load(ROOMS[19].img).then(i => { this.roomImgs[19] = i; tick(); }),

        load(ROOMS[20].img).then(i => { this.roomImgs[20] = i; tick(); }),

        load(ROOMS[21].img).then(i => { this.roomImgs[21] = i; tick(); }),

 /* مكاتب فريق NileStro الأربعة + الصورة الختامية (start-bg.jpg) */

        load(ASSETS.rooms.office1).then(i => { this.roomImgs[22] = i; tick(); }),

        load(ASSETS.rooms.office2).then(i => { this.roomImgs[23] = i; tick(); }),

        load(ASSETS.rooms.office3).then(i => { this.roomImgs[24] = i; tick(); }),

        load(ASSETS.rooms.office4).then(i => { this.roomImgs[25] = i; tick(); }),

        load(ASSETS.rooms.finaleDuo).then(i => { this.extraImgs.finaleDuo = i; tick(); }),

        /* لقطة بوابة العزل المفتوحة — تُستبدل بها الخلفية بعد الضغط على E */

        load(ASSETS.rooms.marsAirlockOpen).then(i => { this.extraImgs.airlockOpen = i; tick(); }),

 /* مسارات عجلات العربة تُرسم فوق أرضية ممر الجبال (المشهد 5) */

        load(ASSETS.overlays.tracks).then(i => { this.extraImgs.tracks = i; tick(); }),

        load(ASSETS.sprites.zainIdle).then(i => { this.idleSheet = i; tick(); }),

        load(ASSETS.sprites.zainWalk).then(i => { this.walkSheet = i; tick(); }),

        load(ASSETS.sprites.tariqIdle).then(i => { this.tariqSheet = i; tick(); }),

        load(ASSETS.sprites.tariqWalk).then(i => { this.tariqWalkSheet = i; tick(); }),

 /* أوراق الفريق الموحدة الأحجام */

        load(ASSETS.sprites.mohamedIdle).then(i => { this.mohamedSheet = i; tick(); }),

        load(ASSETS.sprites.mohamedWalk).then(i => { this.mohamedWalkSheet = i; tick(); }),

        load(ASSETS.sprites.malakIdle).then(i => { this.malakSheet = i; tick(); }),

        load(ASSETS.sprites.ranyaIdle).then(i => { this.ranyaSheet = i; tick(); }),

        load(ASSETS.sprites.mazenIdle).then(i => { this.mazenSheet = i; tick(); }),

      ]);

    },



    /**

     * يرجع معلومات الورقة:

     * frames — مواقع الإطارات غير الفارغة

     * left/right/top/foot — صندوق محتوى الورقة كلها (بالبكسل المصدر)

     * w/h — عرض وارتفاع المحتوى

     * cx — مركز المحتوى الأفقي داخل الخلية (لتثبيت الجسم أثناء المشي)

     */

    extractSheetMeta(sheet) {

      const meta = {

        frames: [], left: 9999, right: 0, top: 9999, foot: 0,

        w: 0, h: 0, cx: 0, scale: 1.5,

      };



      const cols = Math.floor(sheet.width / this.CELL);

      const rows = Math.floor(sheet.height / this.CELL);



      const tmp = document.createElement('canvas');

      tmp.width = this.CELL;

      tmp.height = this.CELL;

      const tctx = tmp.getContext('2d', { willReadFrequently: true });



      for (let r = 0; r < rows; r++) {

        for (let c = 0; c < cols; c++) {

          tctx.clearRect(0, 0, this.CELL, this.CELL);

          tctx.drawImage(

            sheet,

            c * this.CELL, r * this.CELL, this.CELL, this.CELL,

            0, 0, this.CELL, this.CELL

          );



          const data = tctx.getImageData(0, 0, this.CELL, this.CELL).data;

          let L = 9999, R = 0, T = 9999, B = 0;



          for (let y = 0; y < this.CELL; y++) {

            for (let x = 0; x < this.CELL; x++) {

              if (data[(y * this.CELL + x) * 4 + 3] > 16) {

                if (x < L) L = x;

                if (x > R) R = x;

                if (y < T) T = y;

                if (y > B) B = y;

              }

            }

          }



          if (R >= L) {

            meta.frames.push({ sx: c * this.CELL, sy: r * this.CELL });

            if (L < meta.left)  meta.left = L;

            if (R > meta.right) meta.right = R;

            if (T < meta.top)   meta.top = T;

            if (B > meta.foot)  meta.foot = B;

          }

        }

      }



      if (!meta.frames.length) {

        meta.left = 0; meta.right = this.CELL - 1; meta.top = 0; meta.foot = this.CELL - 1;

      }



      meta.h = Math.max(1, meta.foot - meta.top + 1);

      meta.w = Math.max(1, meta.right - meta.left + 1);

      meta.cx = (meta.left + meta.right) / 2;



      return meta;

    },



 /** بيانات الرسم لوضع الشخصية الحالية (زين / طارق / محمد) */

    currentMeta() {

      const isWalk = this.anim === 'walk';

      if (this.playerChar === 'tariq') {

        return (isWalk ? this.tariqWalkMeta : this.tariqMeta)

          || { frames: [{ sx: 0, sy: 0 }], foot: 255, cx: 128, scale: 1, w: 100 };

      }

      if (this.playerChar === 'mohamed') {

        return (isWalk ? this.mohamedWalkMeta : this.mohamedMeta)

          || { frames: [{ sx: 0, sy: 0 }], foot: 255, cx: 128, scale: 1, w: 100 };

      }

      const meta = isWalk ? this.walkMeta : this.idleMeta;

      return meta || { frames: [{ sx: 0, sy: 0 }], foot: 255, cx: 128, scale: 1, w: 100 };

    },



    /* =======================================================

 — توسعة الفصل الأول «الإصلاح والإقلاع» + الفصل الثاني «المريخ»

 ======================================================= */



    /** بدء قوس الإصلاح — بعد حوار استجابة مركبة العبور */

    /** تحميل مسبق لفيديوهات الإطلاق والمريخ بعد بث نداء الاستغاثة

 * (تبدأ سلسلة الإقلاع فور الصعود دون أي انتظار) — لقطات الإطلاق من إنتاج المستخدم */

    preloadExpansionVideos() {

      if (this._expansionPreload) return;

      const list = [

        ASSETS.cutscenes.ride,

        ASSETS.cutscenes.zoomout,

        ASSETS.cutscenes.moonMars,

        ASSETS.cutscenes.ending,

      ];

      this._expansionPreload = list.map((src) => {

        const v = document.createElement('video');

        v.preload = 'auto';

        v.muted = true;

 // : الفيديو المحمَّل مسبقاً (Blob) إن توفر

        v.src = (window.OSIRIS_PRELOADER && OSIRIS_PRELOADER.videoSrc(src)) || src;

        v.load();

        return v;

      });

    },



    /* سلسلة الإقلاع — المشهد 7 من الاسكربت المطور :

 [E] عند سلم مركبة العبور ← سواد ← (1) الركوب صعوداً السلم

 ← حوار القمرة (الملاحة ببيانات أبولو + وداع طارق للسكون)

 ← (2) الإقلاع + زووم آوت حتى يظهر القمر ← (3) من القمر إلى المريخ

 ← بطاقة «بعد 8 أشهر من العبور الصامت... كوكب المريخ» ← الفصل الثاني

 اللقطات بصوتها الخاص (غير مكتومة) — الحوار فوق آخر فريم فقط.

 ------------------------------------------------------- */

    async startLaunchSequence() {

      if (this.boarded || !this.running) return;

      this.boarded = true;

      this.cutsceneActive = true;

      this.hideExitHint();

      // المتابعة القادمة تبدأ مباشرة من المريخ

      this.saveStage('mars');



      this.removeNode(this.lunarTaskEl); this.lunarTaskEl = null;



      // تسود الشاشة ثم تظهر اللقطة الأولى (الركوب)

      await this.blackOn();

      if (!this.running) return;



      // اللقطة 1: الركوب — طارق يصعد السلم لداخل مركبة العبور

      await this.playUserShot(ASSETS.cutscenes.ride);

      if (!this.running) return;



      // حوار القمرة فوق آخر فريم: شاشات التحكم تضيء وهدير المحركات يبدأ

      // (شاشات التحكم بالأزرق والأخضر — المهمة 13: جاهزون للإقلاع)

      await new Promise((resolve) => {

        if (!this.running) { resolve(null); return; }

        this.onChapterDialogueClosed = () => resolve(null);

        this.openDialogue('boardCheck');

      });

      this.onChapterDialogueClosed = null;

      if (!this.running) return;



      await this.blackOn();

      if (this.chapterVideoEl) { this.removeNode(this.chapterVideoEl); this.chapterVideoEl = null; }



      // اللقطة 2: الإقلاع + زووم آوت حتى يظهر القمر

      await this.playUserShot(ASSETS.cutscenes.zoomout);

      if (!this.running) return;

      await this.blackOn();

      if (this.chapterVideoEl) { this.removeNode(this.chapterVideoEl); this.chapterVideoEl = null; }



      // اللقطة 3: من القمر إلى المريخ (7.9ث)

      await this.playUserShot(ASSETS.cutscenes.moonMars);

      if (!this.running) return;

      await this.blackOn();

      if (this.chapterVideoEl) { this.removeNode(this.chapterVideoEl); this.chapterVideoEl = null; }



      // الجملة الختامية: استعدادًا لجزء المريخ...

      this.showExpansionEndCard();

    },



 /** لقطة من لقطات المستخدم — فيديو بلا حوار فوقه وبصوته الخاص

     *  يبقى آخر فريم معروضاً بعد النهاية (يُزال عند السواد التالي) */

    playUserShot(src) {

      return new Promise((resolve) => {

        if (!this.running) { resolve(null); return; }

        const v = document.createElement('video');

 // : الفيديو المحمَّل مسبقاً (Blob) إن توفر

        v.src = (window.OSIRIS_PRELOADER && OSIRIS_PRELOADER.videoSrc(src)) || src;

        v.muted = false;   // اللقطات تحمل صوتاً من إنتاج المستخدم — تُسمع

        v.volume = Math.min(1, Math.max(0, (typeof window.GameVolume === 'number' ? window.GameVolume : 100) / 100));

        v.autoplay = true;

        v.playsInline = true;

        v.setAttribute('playsinline', '');

        v.preload = 'auto';

        v.className = 'cutscene-video';

        this.host.appendChild(v);

        this.chapterVideoEl = v;



        // الكشف فور جاهزية أول فريم — لا سواد فوق اللقطة

        const revealNow = () => { if (this.blackEl) this.blackRelease(); };

        v.addEventListener('loadeddata', revealNow, { once: true });

        v.addEventListener('playing', revealNow, { once: true });



        let finished = false;

        const finish = () => {

          if (finished) return;

          finished = true;

          try { v.pause(); } catch (_) {}

          resolve(null);   // العنصر يبقى معروضاً — يُزال عند السواد التالي

        };

        v.addEventListener('ended', finish);

        v.addEventListener('loadedmetadata', () => {

          this.chapterTimers.push(setTimeout(finish, ((v.duration || 10) * 1000) + 1500));

        });

        v.play().catch(() => { /* المؤقت الاحتياطي سيُنهيه */ });

      });

    },



 /** بطاقة الجملة الختامية «استعدادًا لجزء المريخ» — نقرة تبدأ الفصل الثاني */

    showExpansionEndCard() {

      if (this.chapterEndReady || this.endCardEl) return;

      this.cutsceneActive = true;

      this.eastOpen = false;

      this.hideExitHint();



      const isAr = this.lang === 'ar';

      const T = EXPANSION_END[isAr ? 'ar' : 'en'];

      const ov = document.createElement('div');

      ov.className = 'chapter-end-overlay' + (isAr ? '' : ' lang-en');

      ov.dir = isAr ? 'rtl' : 'ltr';

      ov.innerHTML = `

        <div class="end-title"></div>

        <div class="end-sub"></div>

        <div class="end-prompt"></div>`;

      ov.querySelector('.end-title').textContent = T.title;

      ov.querySelector('.end-sub').textContent = T.sub;

      ov.querySelector('.end-prompt').textContent = T.prompt;

      this.host.appendChild(ov);

      this.endCardEl = ov;



      requestAnimationFrame(() => ov.classList.add('show'));

      this.cutsceneTimers.push(setTimeout(() => {

        if (!this.running) return;

        ov.classList.add('ready');

        this.chapterEndReady = true;

        this.endAction = () => { this.startMarsChapter(); };

      }, 1600));

    },



    /* الفصل الثاني — حديقة التراث الفضائي (مسار زين)

 التسلسل: المأوى (14) ← بوابة العزل بحرف E على الباب (15)

 ← السهل الليلي: دخول من اليسار (16) ← سوجورنر (17)

 ← إنسايت (18) ← أوبي + المنارة (19) ← مشهد الشروق (1.mp4)

 ← اللقاء عند الشروق (20)

 ------------------------------------------------------- */

    async startMarsChapter() {

      if (this.marsMode || !this.running) return;

      this.marsMode = true;

      this.chapter = true;

      this.chapterStarted = true;

      this.cutsceneActive = true;

      this.saveStage('mars');

      this.hideExitHint();



      // الخلفية القمرية تنتهي هنا — اللاعب الآن زين على المريخ

      this.crisis = false;

      this.playerChar = 'zain';



      const isAr = this.lang === 'ar';

      const T = MARS_CHAPTER_CARD[isAr ? 'ar' : 'en'];



      // بطاقة الفصل الثاني فوق السواد

      await this.blackOn();

      if (!this.running) return;

      const ov = document.createElement('div');

      ov.className = 'chapter-end-overlay mars-card' + (isAr ? '' : ' lang-en');

      ov.dir = isAr ? 'rtl' : 'ltr';

      ov.innerHTML = `

        <div class="end-title"></div>

        <div class="end-sub"></div>

        <div class="end-prompt"></div>`;

      ov.querySelector('.end-title').textContent = T.title;

      ov.querySelector('.end-sub').textContent = T.sub;

      ov.querySelector('.end-prompt').textContent = T.prompt;

      this.host.appendChild(ov);

      this.endCardEl = ov;

      requestAnimationFrame(() => ov.classList.add('show'));

      this.cutsceneTimers.push(setTimeout(() => {

        if (!this.running) return;

        ov.classList.add('ready');

        this.chapterEndReady = true;

        this.endAction = () => { this.enterMarsHabitat(); };

      }, 1600));

    },



    /** المشهد 1 — داخل المأوى بعد انجلاء العاصفة: زين واقف أمام النافذة */

    enterMarsHabitat() {

      if (!this.running) return;

      const go = () => {

        if (!this.running) return;

        if (!this.roomImgs[14]) { this.chapterTimers.push(setTimeout(go, 300)); return; }

        this.room = 14;

        this.marsMode = true;

        this.crisis = false;

        this.playerChar = 'zain';

        this.hasMoved = true;

        this.charX = Math.round(this.W * 0.50);   // زين واقف أمام النافذة يتأمل السماء الصافية

        this.facing = 1;

        this.anim = 'idle';

        this.frameIdx = 0;

        this.frameTimer = 0;

        this.lastWalkFrame = 0;

        this.autoWalk = false;

        this.onScriptArrive = null;

        this.exitOpen = true;

        if (this.fadeEl) this.fadeEl.classList.remove('on');



        this.chapterTimers.push(setTimeout(() => {

          if (!this.running) return;

          this.hideInstructions();

          this.blackRelease();

          this.openDialogue('habitatIntro');

        }, 110));

      };

      go();

    },



    /** متابعة مباشرة إلى المريخ (save.stage = 'mars') — داخل المأوى */

    enterMarsRoomDirect() {

      if (!this.running) return;

      this.cutsceneActive = true;

      this.blackRelease();

      this.marsMode = true;

      this.crisis = false;

      this.playerChar = 'zain';

      this.room = 14;

      this.hasMoved = true;

      this.exitOpen = true;

 // : إصلاح الحفظ — بدء المشهد يكتب stage 'scene2' مؤقتاً،

      // وهنا نعيده إلى 'mars' حتى تعيد «متابعة» اللاعبَ إلى المريخ لا لبداية اللعبة

      this.saveStage('mars');

      this.charX = Math.round(this.W * 0.50);

      this.facing = 1;

      this.anim = 'idle';

      this.frameIdx = 0;

      this.frameTimer = 0;

      this.lastWalkFrame = 0;

      this.autoWalk = false;

      this.onScriptArrive = null;

      if (this.fadeEl) this.fadeEl.classList.remove('on');



      this.chapterTimers.push(setTimeout(() => {

        if (!this.running) return;

        this.hideInstructions();

        this.openDialogue('habitatIntro');

      }, 150));

    },



    /* بوابة العزل : الشارة الخضراء الملتصقة بالباب أُزيلت —

 اللاعب يقترب من البوابة فتظهر علامة [E] العائمة العادية فوقها،

 وعند الضغط تُفتح ويُعبر عبرها للمشهد التالي مباشرة

 ------------------------------------------------------- */

    /** فتح بوابة العزل — عبور فوري عبر البوابة نفسها (هسّ ضغط الهواء)

 * : فتح الباب = العبور عبر البوابة نفسها — انتقال فوري للمشهد التالي

     *  (لا سهم خروج شرقاً ولا مشي حتى الحافة: اللاعب يرى الباب يفتح ثم يعبره) */

    openAirlockDoor() {

      if (this.doorOpened || !this.running) return;

      Sfx.ensure();

      this.doorOpened = true;



      // لافتة مهمة البوابة تنتهي عند فتحها

      this.removeNode(this.lunarTaskEl); this.lunarTaskEl = null;



      // هسّ ضغط الهواء — تصريح هوائي متدرج

      Sfx.blip(180, 0.5, 0.10, 'sawtooth');

      this.chapterTimers.push(setTimeout(() => Sfx.blip(320, 0.4, 0.07, 'sine'), 260));

      this.chapterTimers.push(setTimeout(() => Sfx.blip(520, 0.3, 0.05, 'sine'), 620));



      // منع حركة اللاعب أثناء لقطة فتح الباب

      this.cutsceneActive = true;



      // تبدیل الخلفية إلى لقطة البوابة المفتوحة (قطع مباشر مع وميض فايد خفيف)

      if (this.extraImgs && this.extraImgs.airlockOpen) {

        if (this.fadeEl) this.fadeEl.classList.add('on');

        this.chapterTimers.push(setTimeout(() => {

          if (!this.running) return;

          this.roomImgs[15] = this.extraImgs.airlockOpen;

          if (this.fadeEl) this.fadeEl.classList.remove('on');

        }, 420));

      }



      // لحظة قصيرة يرى فيها اللاعب البوابة مفتوحة — ثم يعبرها للمشهد التالي مباشرة

      this.chapterTimers.push(setTimeout(() => {

        if (!this.running) return;

        this.cutsceneActive = false;

        this.goToRoom(16, 'left', this.plainSeen ? {} : {

          arriveAction: () => {

            this.plainSeen = true;

            this.showLunarTask('plainTask');

          },

        });

      }, 1400));

    },



    /* -------------------------------------------------------

       تركيب منارة الاستقبال فوق صارية أوبي — شعاع أزرق نيون

       يخترق سماء الليل عمودياً ثم حوار الرصد المداري

       ------------------------------------------------------- */

    mountBeaconOnOppy() {

      if (this.beaconMounted || !this.running) return;

      this.beaconMounted = true;

      this.cutsceneActive = true;

      this.hideExitHint();

      this.removeNode(this.lunarTaskEl); this.lunarTaskEl = null;

      Sfx.ensure();



      // الشعاع الأزرق الساطع فوق صارية أوبي

      const hs = (ROOMS[19].hotspots || []).find(h => h.id === 'oppyMast');

      const rect = hs ? this.fracRect(hs) : { cx: this.W * 0.66, cy: this.H * 0.5 };

      const beam = document.createElement('div');

      beam.className = 'mars-beam';

      beam.style.left = Math.round(rect.cx) + 'px';

      beam.style.top = Math.round(rect.cy) + 'px';

      this.host.appendChild(beam);

      this.beamEl = beam;

      requestAnimationFrame(() => beam.classList.add('fire'));



      // صوت انطلاق الإشارة — ثلاث نغمات صاعدة متتابعة

      Sfx.blip(620, 0.14, 0.10, 'sine');

      this.chapterTimers.push(setTimeout(() => Sfx.blip(880, 0.16, 0.10, 'sine'), 200));

      this.chapterTimers.push(setTimeout(() => Sfx.blip(1240, 0.22, 0.11, 'sine'), 420));



      // الشعاع يبقى يتوهج فوق أوبي ثم حوار رصد الهبوط

      this.chapterTimers.push(setTimeout(() => {

        if (!this.running) return;

        this.removeNode(this.beamEl);

        this.beamEl = null;

        this.openDialogue('beaconFire');

      }, 2100));

    },



    /* : مشهد الشروق السينمائي (فيديو + مشي مبرمج) أُزيل

 بناءً على طلب المالك — مكانه غرفة مشي عادية (الغرفة 20

 بخلفية mars-sunrise.jpg) يخرج منها اللاعب شرقاً إلى اللقاء

 ------------------------------------------------------- */



    /* -------------------------------------------------------

       لوحة الشرف الكونية — أربع بطاقات متتالية ثم الفيديو الختامي

       ------------------------------------------------------- */

    showHonorWall() {

      if (this.honorEl || this.honorShown) return;

      this.honorShown = true;

      this.cutsceneActive = true;

      this.hideExitHint();

      this.removeNode(this.lunarTaskEl); this.lunarTaskEl = null;



      const isAr = this.lang === 'ar';

      const ui = EXPANSION_UI[isAr ? 'ar' : 'en'];

      const ov = document.createElement('div');

      ov.className = 'plaque-overlay honor-overlay';

      ov.innerHTML = `

        <div class="plaque-card honor-card">

          <div class="plaque-eyebrow"></div>

          <div class="plaque-eyebrow-ar"></div>

          <div class="plaque-ar"></div>

          <div class="plaque-en"></div>

          <div class="honor-next"></div>

        </div>`;

      this.host.appendChild(ov);

      this.honorEl = ov;

      let idx = 0;



      const show = () => {

        const card = HONOR_CARDS[idx];

        ov.querySelector('.plaque-eyebrow').textContent = card.eyebrow;

        ov.querySelector('.plaque-eyebrow-ar').textContent = card.eyebrowAr;

        ov.querySelector('.plaque-ar').textContent = card.lineAr;

        ov.querySelector('.plaque-en').textContent = card.lineEn;

        ov.querySelector('.honor-next').textContent =

          idx < HONOR_CARDS.length - 1 ? (isAr ? '▼' : '▼') : ui.honorPrompt;

        requestAnimationFrame(() => ov.classList.add('show'));

      };

      show();



      const advance = () => {

        if (!this.honorEl) return;

        idx++;

        if (idx >= HONOR_CARDS.length) {

          this.removeNode(this.honorEl);

          this.honorEl = null;

          window.removeEventListener('keydown', onKey);

          this.showFinale();

          return;

        }

        ov.classList.remove('show');

        this.chapterTimers.push(setTimeout(show, 320));

      };

      ov.addEventListener('click', advance);

      const onKey = (e) => {

        if (!this.honorEl) return;

        if (e.repeat) return;

        advance();

      };

      window.addEventListener('keydown', onKey);

    },



    /* -------------------------------------------------------

       الختام — الفيديو الأخير + الرسالة الختامية + Title Drop

       ------------------------------------------------------- */

    async showFinale() {

      if (this.finaleEl) return;

      this.cutsceneActive = true;

      this.saveStage('complete');



      await this.blackOn();

      if (!this.running) return;



// الفيديو الختامي — الأخوين وأوبي تحت الغروب الأزرق

 // (keepLast يُبقي عنصر الفيديو في الصفحة تحت شاشة النهاية — يزيله لاحقاً)

      const endingVideo = await this.playChapterVideo(ASSETS.cutscenes.ending, null, true, true);

      if (!this.running) return;



      await this.blackOn();

      this.removeNode(this.chapterVideoEl);

      this.chapterVideoEl = null;

 // إصلاح: إزالة فيديو الختام المحتفظ بآخر فريمه — كان يبقى في الصفحة

      // فيظهر فوق مكاتب الفريق عند دخول «خلف الكواليس»

      if (endingVideo && endingVideo.parentNode) this.removeNode(endingVideo);

      if (!this.running) return;



      // شاشة الرسالة الختامية — الكلمات الأخيرة تُكتب حرفاً بحرف

 // (: أبيض كبير بذات تصميم بطاقة «الفصل الأول»)

 // : الصورة الأخيرة بعد اللقاء والنهاية = start-bg.jpg خلف النص

      const isAr = this.lang === 'ar';

      const ov = document.createElement('div');

      ov.className = 'finale-overlay type-finale' + (isAr ? '' : ' lang-en');

      ov.dir = isAr ? 'rtl' : 'ltr';

      if (this.extraImgs && this.extraImgs.finaleDuo) {

        ov.style.backgroundImage = 'url("' + this.extraImgs.finaleDuo.src + '")';

        ov.classList.add('has-photo');

      }

      ov.innerHTML = `

        <div class="finale-text"></div>

        <div class="finale-title"></div>

        <div class="finale-credits"></div>

        <div class="finale-team">

          <div class="finale-team-q"></div>

          <div class="finale-team-btns">

            <button type="button" class="finale-btn yes"></button>

            <button type="button" class="finale-btn no"></button>

          </div>

        </div>`;

      this.host.appendChild(ov);

      this.finaleEl = ov;



      const ui = EXPANSION_UI[isAr ? 'ar' : 'en'];

      const textEl = ov.querySelector('.finale-text');

      const titleEl = ov.querySelector('.finale-title');

      const creditsEl = ov.querySelector('.finale-credits');

      const teamBox = ov.querySelector('.finale-team');



      ov.classList.add('show');

      await this.sleepFinale(900);



      // 1) الرسالة الختامية — كتابة حرف بحرف (أبيض كبير بلمعة بطاقة الفصل)

      await this.typeFinaleText(textEl, FINAL_MESSAGE[isAr ? 'ar' : 'en']);

      if (!this.running) return;

      await this.sleepFinale(1500);



      // 2) لافتة العنوان الكبرى — تُكتب هي الأخرى حرفاً بحرف

      await this.typeFinaleText(titleEl, TITLE_DROP[isAr ? 'ar' : 'en'], 70);

      if (!this.running) return;

      Sfx.ensure();

      Sfx.blip(520, 0.3, 0.10, 'sine');

      this.chapterTimers.push(setTimeout(() => Sfx.blip(780, 0.4, 0.09, 'sine'), 350));

      await this.sleepFinale(1200);



      // 3) شارة الفريق

      creditsEl.textContent = CREDITS_TEXT[isAr ? 'ar' : 'en'];

      creditsEl.classList.add('show');

      await this.sleepFinale(1400);



 // 4) سؤال فريق NileStro : هل تريد التعرف على صنّاع اللعبة؟

      ov.querySelector('.finale-team-q').textContent = ui.teamQuestion;

      ov.querySelector('.yes').textContent = ui.teamYes;

      ov.querySelector('.no').textContent = ui.teamNo;

      teamBox.classList.add('show');



      ov.querySelector('.yes').addEventListener('click', () => {

        if (!this.running) return;

        Sfx.ensure();

        Sfx.ePress();

 // خلف الكواليس: خاتمة فريق NileStro التفاعلية (المكاتب الأربعة)

        this.startCreditsEpilogue();

      });

      ov.querySelector('.no').addEventListener('click', () => {

        if (!this.running) return;

        Sfx.ensure();

        Sfx.ePress();

        this.returnToMenu();

      });

    },



    /** مهلة قصيرة تحترم إيقاف الإعدادات أثناء الخاتمة */

    sleepFinale(ms) {

      return new Promise((resolve) => {

        const step = () => {

          if (!this.running) { resolve(); return; }

          if (this.paused) { this.chapterTimers.push(setTimeout(step, 140)); return; }

          resolve();

        };

        this.chapterTimers.push(setTimeout(step, ms));

      });

    },



    /** كتابة الخاتمة حرفاً بحرف — أبيض كبير بذات روح بطاقة الفصل الأول

     *  صوت طقطقة ميكانيكي لكل حرف، ووقفة أطول عند نهايات الأسطر */

    async typeFinaleText(el, text, speed = 52) {

      if (!el || !text) return;

      el.textContent = '';

      el.classList.add('typing');

      for (let i = 0; i < text.length; i++) {

        if (!this.running) return;

        // إيقاف مؤقت أثناء فتح الإعدادات — تستأنف الكتابة عند الإغلاق

        while (this.paused && this.running) {

          await new Promise((r) => this.chapterTimers.push(setTimeout(r, 140)));

        }

        if (!this.running) return;



        const ch = text[i];

        el.textContent += ch;



        if (ch !== ' ' && ch !== '\n') Sfx.keyClick(0.22);



        // نهاية سطر → وقفة تأمل قصيرة أطول

        const isLineEnd = ch === '\n' || (i < text.length - 1 && text[i + 1] === '\n');

        const delay = isLineEnd ? 420 : speed + Math.random() * 26;

        await new Promise((r) => this.chapterTimers.push(setTimeout(r, delay)));

      }

      el.classList.remove('typing');

    },



    /* شاشة فريق NileStro — تُفتح من سؤال نهاية اللعبة

 ★ عدّل بيانات الفريق من ثابت TEAM_NILESTRO في أعلى الملف

 ------------------------------------------------------- */

    showTeamScreen() {

      if (this.teamEl) return;

      this.removeNode(this.finaleEl);

      this.finaleEl = null;



      const isAr = this.lang === 'ar';

      const ui = EXPANSION_UI[isAr ? 'ar' : 'en'];

      const ov = document.createElement('div');

      ov.className = 'team-overlay' + (isAr ? '' : ' lang-en');

      ov.dir = isAr ? 'rtl' : 'ltr';



      const cards = TEAM_NILESTRO.map((m) => `

        <div class="team-card">

          <div class="team-role"></div>

          <div class="team-name"></div>

        </div>`).join('');



      ov.innerHTML = `

        <div class="team-title"></div>

        <div class="team-sub"></div>

        <div class="team-grid">${cards}</div>

        <div class="team-footer">Team NileStro — Project OSIRIS — NASA Space Apps Challenge 2026</div>

        <div class="team-back"></div>`;

      this.host.appendChild(ov);

      this.teamEl = ov;



      ov.querySelector('.team-title').textContent = ui.teamTitle;

      ov.querySelector('.team-sub').textContent = ui.teamSub;

      ov.querySelector('.team-back').textContent = ui.teamBack;

      const roleEls = ov.querySelectorAll('.team-role');

      const nameEls = ov.querySelectorAll('.team-name');

      TEAM_NILESTRO.forEach((m, i) => {

        if (roleEls[i]) roleEls[i].textContent = isAr ? m.roleAr : m.roleEn;

        if (nameEls[i]) nameEls[i].textContent = m.name;

      });



      requestAnimationFrame(() => ov.classList.add('show'));



      const back = () => {

        if (!this.running || !this.teamEl) return;

        Sfx.ensure();

        Sfx.ePress();

        this.returnToMenu();

      };

      ov.querySelector('.team-back').addEventListener('click', back);

      const onKey = (e) => {

        if (e.repeat) return;

        window.removeEventListener('keydown', onKey);

        back();

      };

      this.chapterTimers.push(setTimeout(() => {

        if (this.running) window.addEventListener('keydown', onKey);

      }, 700));

    },



    /* =======================================================

 — خلف الكواليس: خاتمة فريق NileStro التفاعلية

 محمد يمشي عبر مكاتب الفريق الأربعة (الغرف 22..25 — بالترتيب 1→2→3→4)

 ويحاور كل عضو بـ [E] — ثم شاشة التوديع الجماعية

 ======================================================= */



    /** بطاقة الانتقال السينمائية ثم الدخول الغربي إلى المكتب 1 (ملك) */

    startCreditsEpilogue() {

      if (this.credIntroEl || this.creditsMode || !this.running) return;

      Sfx.ensure();

      Sfx.menuGo();



      this.removeNode(this.finaleEl);

      this.finaleEl = null;

      // showFinale تترك طبقة السودة أسفل لوحة النهاية — نكشفها الآن للمكاتب

      this.blackRelease();

      this.cutsceneActive = true;

      this.hideExitHint();

      this.removeNode(this.lunarTaskEl); this.lunarTaskEl = null;



      const isAr = this.lang === 'ar';

      const ui = EXPANSION_UI[isAr ? 'ar' : 'en'];

      const ov = document.createElement('div');

      ov.className = 'credits-intro-overlay';

      ov.dir = isAr ? 'rtl' : 'ltr';

      ov.innerHTML = `

        <div class="credits-intro-card">

          <div class="credits-intro-icon"></div>

          <div class="credits-intro-title"></div>

          <div class="credits-intro-sub"></div>

        </div>`;

      this.host.appendChild(ov);

      this.credIntroEl = ov;

      ov.querySelector('.credits-intro-title').textContent = ui.credIntroTitle;

      ov.querySelector('.credits-intro-sub').textContent = ui.credIntroSub;

      requestAnimationFrame(() => ov.classList.add('show'));



      // تبديل الشخصية إلى محمد وتهيئة وضع خاتمة الفريق قبل الانتقال

      this.creditsMode = true;

      this.marsMode = false;

      this.crisis = false;

      this.playerChar = 'mohamed';

      this.saveStage('complete');



      this.chapterTimers.push(setTimeout(() => {

        if (this.credIntroEl) this.credIntroEl.classList.add('leave');

      }, 2400));

      this.chapterTimers.push(setTimeout(() => {

        if (!this.running) return;

        this.removeNode(this.credIntroEl);

        this.credIntroEl = null;

        // الدخول السينمائي إلى المكتب الأول — محمد يظهر من الغرب ويمشي إلى مكانه

        this.goToRoom(22, 'left', {

          arriveRelease: true,

          arriveAction: () => { if (!this.credSeen[0]) this.showLunarTask('credTask1'); },

        });

      }, 3200));

    },



    /** شاشة التوديع الجماعية — الفريق الأربعة يلوّحون + إعادة اللعب أو القائمة */

    showCreditsWave() {

      if (this.credWaveEl || !this.running) return;

      this.cutsceneActive = true;

      this.hideExitHint();

      this.removeNode(this.lunarTaskEl); this.lunarTaskEl = null;



      const isAr = this.lang === 'ar';

      const ui = EXPANSION_UI[isAr ? 'ar' : 'en'];

      const names = TEAM_NAMES[isAr ? 'ar' : 'en'];



      const ov = document.createElement('div');

      ov.className = 'credits-wave-overlay' + (isAr ? '' : ' lang-en');

      ov.dir = isAr ? 'rtl' : 'ltr';



      const members = [

        { sheet: this.malakSheet,   meta: this.malakMeta },

        { sheet: this.ranyaSheet,   meta: this.ranyaMeta },

        { sheet: this.mazenSheet,   meta: this.mazenMeta },

        { sheet: this.mohamedSheet, meta: this.mohamedMeta },

      ];

      const cells = members.map((m, i) => `

        <div class="wave-char" style="animation-delay:${(i * 0.22).toFixed(2)}s">

          <canvas width="256" height="256"></canvas>

          <div class="wave-name"></div>

        </div>`).join('');



      ov.innerHTML = `

        <div class="wave-title"></div>

        <div class="wave-row">${cells}</div>

        <div class="wave-line"></div>

        <div class="wave-btns">

          <button type="button" class="wave-btn replay"></button>

          <button type="button" class="wave-btn exit"></button>

        </div>`;

      this.host.appendChild(ov);

      this.credWaveEl = ov;



      // رسم الأربعة من الأوراق المحمّلة مسبقاً — إطار الوقوف بنفس مقياس اللعب

      const cvs = ov.querySelectorAll('.wave-char canvas');

      const nameEls = ov.querySelectorAll('.wave-name');

      members.forEach((m, i) => {

        if (nameEls[i]) nameEls[i].textContent = names[i] || '';

        const cv = cvs[i];

        if (!cv || !m.sheet || !m.meta || !m.meta.frames.length) return;

        const cctx = cv.getContext('2d');

        const f = m.meta.frames[0];

        cctx.save();

        cctx.translate(128, 236);

        cctx.scale(m.meta.scale, m.meta.scale);

        cctx.drawImage(m.sheet, f.sx, f.sy, this.CELL, this.CELL,

          -m.meta.cx, -(m.meta.foot + 1), this.CELL, this.CELL);

        cctx.restore();

      });



      ov.querySelector('.wave-title').textContent = ui.credWaveTitle;

      ov.querySelector('.wave-line').textContent = ui.credWaveLine;

      ov.querySelector('.replay').textContent = ui.credReplay;

      ov.querySelector('.exit').textContent = ui.credExit;



      ov.querySelector('.replay').addEventListener('click', () => {

        Sfx.ensure();

        Sfx.menuGo();

        this.restartGame();

      });

      ov.querySelector('.exit').addEventListener('click', () => {

        Sfx.ensure();

        Sfx.ePress();

        this.returnToMenu();

      });



      requestAnimationFrame(() => ov.classList.add('show'));

      // نغمة توديع صاعدة بسيطة

      Sfx.blip(520, 0.30, 0.10, 'sine');

      this.chapterTimers.push(setTimeout(() => Sfx.blip(660, 0.30, 0.10, 'sine'), 260));

      this.chapterTimers.push(setTimeout(() => Sfx.blip(880, 0.40, 0.10, 'sine'), 520));

    },



    /** إعادة تشغيل اللعبة من البداية — مسح الحفظ ثم تحميل القائمة من جديد */

    restartGame() {

      try { localStorage.removeItem(SAVE_KEY); } catch (_) {}

      window.location.reload();

    },



    /* -------------------------------------------------------

       المدخلات

       ------------------------------------------------------- */

    bindKeys() {

      this._onKeyDown = (e) => {

        const k = e.key;

        const c = e.code;   // كود المفتاح الفيزيائي — يعمل مع أي تخطيط (عربي/إنجليزي)



        Sfx.ensure(); // تفعيل الصوت من أول تفاعل



        // دليل ناسا مفتوح → كل المفاتيح له وحده (Esc يغلقه داخل manual.js)

        if (window.Manual && window.Manual.isOpen()) return;



        // نهاية الجزء الحالي (بطاقة «يتبع…») — أي زر ينفذ إجراء النهاية

 // (: قد يكون بدء الفصل الثاني بدل العودة للقائمة)

        if (this.chapterEndReady) {

          e.preventDefault();

          this.chapterEndReady = false;

 // إزالة البطاقة فوراً — قبل التنفيذ كي لا تحجب المشهد التالي 

          if (this.endCardEl) { this.removeNode(this.endCardEl); this.endCardEl = null; }

          const act = this.endAction || (() => this.returnToMenu());

          this.endAction = null;

          act();

          return;

        }



        // نهاية الفصل — أي زر يبدأ الفصل الأول

        if (this.epilogueEnded) { e.preventDefault(); this.continueAfterChapterCard(); return; }



        // الهولوجرام — تدوير الصمامل بالكيبورد

        if (this.hologramEl && !this.holoSolved) {

          let d = null;

          if (k === 'ArrowRight' || k === 'D' || k === 'd' || c === 'ArrowRight' || c === 'KeyD') d = 16;

          else if (k === 'ArrowLeft' || k === 'A' || k === 'a' || c === 'ArrowLeft' || c === 'KeyA') d = -16;

          else if (k === 'e' || k === 'E' || c === 'KeyE') d = 14;

          if (d !== null) {

            e.preventDefault();

            this.applyHoloRot(d);

            return;

          }

        }



        // لغز الحرارة (RHU) — الضغط المستمر على E يقترب والإفلات يثبّت

        if (this.rhuEl && !this._rhuSolved) {

          if (k === 'e' || k === 'E' || c === 'KeyE') {

            e.preventDefault();

            if (!e.repeat) this._rhuHold = true;

          }

          return;

        }



        // لغزا الليزر والهوائي — الأسهم تحرك و E يطلق/يثبّت

        if (this.laserEl || this.antennaEl) {

          if (k === 'ArrowLeft' || k === 'a' || k === 'A' || c === 'ArrowLeft' || c === 'KeyA') {

            e.preventDefault();

            this.keys.left = true;

          } else if (k === 'ArrowRight' || k === 'd' || k === 'D' || c === 'ArrowRight' || c === 'KeyD') {

            e.preventDefault();

            this.keys.right = true;

          } else if ((k === 'e' || k === 'E' || c === 'KeyE') && !e.repeat) {

            e.preventDefault();

            if (this.laserEl) this.laserFire();

            else this.antennaLock();

          }

          return;

        }



        // فريم ثابت ينتظر E (فيديوهات فتح/خروج الباب)

        if (this._chapterE && !e.repeat && (k === 'e' || k === 'E' || c === 'KeyE')) {

          e.preventDefault();

          const f = this._chapterE;

          f();

          return;

        }

        if (this._chapterE) return;



        // الإعدادات مفتوحة → Escape يغلقها فقط (ولا يلمس حالة الإيقاف خارجها)

        if (this.paused) {

          const modalOpen = this.modalEl && !this.modalEl.classList.contains('hidden');

          if ((k === 'Escape' || c === 'Escape') && modalOpen) { e.preventDefault(); this.closeModal(); }

          return;

        }



 // شاشة التوديع الجماعية: E إعادة اللعب من البداية / ESC القائمة

        if (this.credWaveEl) {

          if (e.repeat) return;

          if (k === 'e' || k === 'E' || c === 'KeyE') {

            e.preventDefault();

            Sfx.ensure();

            Sfx.menuGo();

            this.restartGame();

          } else if (k === 'Escape' || c === 'Escape') {

            e.preventDefault();

            Sfx.ensure();

            Sfx.ePress();

            this.returnToMenu();

          }

          return;

        }



        // أثناء الحوار: أي زر ينتقل للسطر التالي (يُكمل/يتخطى الكتابة)

        if (this.dialogueActive) {

          if (e.repeat) return;

          e.preventDefault();

          this.advanceDialogue();

          return;

        }



        // أثناء الفيديو السينمائي: أي زر يخطيه وينتقل للخطوة التالية

        if (this.cutsceneVideoEl && this._cutsceneFinish) {

          e.preventDefault();

          const f = this._cutsceneFinish;

          this._cutsceneFinish = null;

          f();

          return;

        }



        // Tab أو Escape → فتح الإعدادات (زر الترس)

        if (k === 'Tab' || k === 'Escape' || c === 'Tab' || c === 'Escape') {

          e.preventDefault();

          this.openModal();

          return;

        }



        // M → فتح دليل المهمة ومصادر ناسا (زر الكتاب)

        if ((k === 'm' || k === 'M' || c === 'KeyM') && !e.repeat) {

          e.preventDefault();

          this.openManual();

          return;

        }



        if (k === 'ArrowLeft' || k === 'ArrowRight' || k === ' ' ||

            c === 'ArrowLeft' || c === 'ArrowRight' || c === 'Space' ||

            c === 'KeyA' || c === 'KeyD' || c === 'KeyE' ||

            k === 'a' || k === 'A' || k === 'd' || k === 'D' ||

            k === 'e' || k === 'E') {

          e.preventDefault();

        }



        // A/D تعمل حتى لو التخطيط عربي (KeyA = المفتاح الفيزيائي مهما كان الحرف)

        if (k === 'ArrowLeft'  || k === 'a' || k === 'A' || c === 'KeyA') this.keys.left = true;

        if (k === 'ArrowRight' || k === 'd' || k === 'D' || c === 'KeyD') this.keys.right = true;

        if ((k === 'e' || k === 'E' || c === 'KeyE') && !e.repeat) this.keys.e = true;

      };



      this._onKeyUp = (e) => {

        const k = e.key;

        const c = e.code;

        if (k === 'ArrowLeft'  || k === 'a' || k === 'A' || c === 'KeyA') {

          this.keys.left = false;

          this._fuelDir = 0; this._dustDirX = 0;

        }

        if (k === 'ArrowRight' || k === 'd' || k === 'D' || c === 'KeyD') {

          this.keys.right = false;

          this._fuelDir = 0; this._dustDirX = 0;

        }

        if (k === 'ArrowUp' || k === 'w' || k === 'W' || c === 'ArrowUp' || c === 'KeyW') this._dustDirY = 0;

        if (k === 'ArrowDown' || k === 's' || k === 'S' || c === 'ArrowDown' || c === 'KeyS') this._dustDirY = 0;

        // إفلات E أثناء لغز الحرارة = محاولة تثبيت في النطاق الآمن

        if (this.rhuEl && (k === 'e' || k === 'E' || c === 'KeyE')) {

          this._rhuHold = false;

          this.rhuReleaseCheck();

        }

      };



      this._onBlur = () => {

        this.keys = { left: false, right: false, e: false };

      };



      // النقر في أي مكان ينتقل بالحوار (باستثناء أزرار الواجهة)

      this._onDialogPointer = (e) => {

        if (!this.running) return;

        Sfx.ensure();



 // نهاية الجزء الحالي (بطاقة «يتبع…») — نقرة تنفذ إجراء النهاية 

        if (this.chapterEndReady) {

          this.chapterEndReady = false;

 // إزالة البطاقة فوراً — قبل التنفيذ كي لا تحجب المشهد التالي 

          if (this.endCardEl) { this.removeNode(this.endCardEl); this.endCardEl = null; }

          const act = this.endAction || (() => this.returnToMenu());

          this.endAction = null;

          act();

          return;

        }



        // نهاية الفصل — نقرة واحدة تبدأ الفصل الأول

        if (this.epilogueEnded) { this.continueAfterChapterCard(); return; }



        // الفيديو السينمائي: نقرة تُخطّي إلى الخطوة التالية

        if (this.cutsceneVideoEl && this._cutsceneFinish) {

          const f = this._cutsceneFinish;

          this._cutsceneFinish = null;

          f();

          return;

        }



        if (this.paused || !this.dialogueActive) return;

        if (e.target instanceof Element &&

            e.target.closest('.gear-btn, .manual-btn, .manual-overlay, .s2-modal-overlay, .dialogue-panel, .touch-controls, .chapter-e-badge')) return;

        this.advanceDialogue();

      };



      window.addEventListener('keydown', this._onKeyDown);

      window.addEventListener('keyup', this._onKeyUp);

      window.addEventListener('blur', this._onBlur);

      window.addEventListener('pointerdown', this._onDialogPointer);

      window.addEventListener('resize', this._resizeBound);



      // النقر/اللمس المباشر على شارة E فوق نقطة التفاعل — يعمل باللمس وبالماوس

      this._onCanvasPointer = (e) => {

        if (this.paused || this.dialogueActive || this.cutsceneActive ||

            this.transitioning || this.autoWalk) return;

        if (window.Manual && window.Manual.isOpen()) return;

        const pos = this.promptBadgePos();

        if (!pos) return;

        const dx = e.clientX - pos.x;

        const dy = e.clientY - pos.y;

        // نطاق سخي (40px نصف قطر) — مناسب لإصبع اللمس ودقيق للماوس

        if (dx * dx + dy * dy <= 1600) {

          e.preventDefault();

          this.interact();

        }

      };

      if (this.canvas) this.canvas.addEventListener('pointerdown', this._onCanvasPointer);

    },



    unbindKeys() {

      window.removeEventListener('keydown', this._onKeyDown);

      window.removeEventListener('keyup', this._onKeyUp);

      window.removeEventListener('blur', this._onBlur);

      window.removeEventListener('pointerdown', this._onDialogPointer);

      window.removeEventListener('resize', this._resizeBound);

      if (this.canvas && this._onCanvasPointer) this.canvas.removeEventListener('pointerdown', this._onCanvasPointer);

    },



    /* -------------------------------------------------------

       الحلقة والتحديث

       ------------------------------------------------------- */

    loop(t) {

      if (!this.running) return;



      const dt = Math.min((t - this.lastTime) / 1000, 0.05);

      this.lastTime = t;



      this.update(dt);

      this.render();



      this.rafId = requestAnimationFrame((nt) => this.loop(nt));

    },



    /** مشي تلقائي (دخول سينمائي) حتى الوصول للهدف */

    updateAutoWalk(dt) {

      const remain = this.autoTargetX - this.charX;

      const step = this.SPEED * dt;



      if (Math.abs(remain) <= step) {

        this.charX = this.autoTargetX;

        this.autoWalk = false;

        this.anim = 'idle';

        this.frameIdx = 0;

        this.frameTimer = 0;

        const arrived = this.onScriptArrive;

        this.onScriptArrive = null;

        if (arrived) arrived();

        return 0;

      }



      const dir = Math.sign(remain);

      this.charX += dir * step;

      this.facing = dir;

      return dir;

    },



    /** التفاتة طارق NPC: ينظر لزين عند الاقتراب وإلا للجهة الافتراضية */

    tariqFacingTarget() {

      return this.npcFacingTarget(this.tariqX(), -1, 'tariq');

    },



    /** منطق الالتفات عام لأي NPC */

    npcFacingTarget(npcX, defaultFacing, talkId) {

      const dx = this.charX - npcX;

      const talkingToPlayer = this.dialogueActive && this.dialogue && this.dialogue.id === talkId;

      if (talkingToPlayer || Math.abs(dx) <= this.NPC_TURN_RANGE) {

        return dx < 0 ? -1 : 1; // اللاعب على الشمال → يلتف نحوه / على اليمين → يلتف يميناً

      }

      return defaultFacing;

    },



    /** رسم طارق NPC — نفس نظام زين بالضبط (نفس الطول ونفس خط الأرض) */

    drawTariq(ctx) {

      this.drawNpcIdle(ctx, this.tariqX(), this.tariqFacingTarget());

    },



 /** رسم NPC واقف عند x موجه نحو facing — : أي ورقة (طارق افتراضياً) */

    drawNpcIdle(ctx, npcX, facing, sheet = null, meta = null) {

      const sh = sheet || this.tariqSheet;

      const mt = meta || this.tariqMeta;

      if (!mt || !mt.frames.length || !sh) return;



      const ground = this.groundY();

      const f = mt.frames[Math.floor(performance.now() / (1000 / this.IDLE_FPS)) % mt.frames.length];

      const s = mt.scale;

      const tx = npcX;

      const tFacing = facing;



      this.drawShadow(ctx, tx, ground, mt.w * s);



      ctx.save();

      ctx.translate(tx, ground);

      ctx.scale(tFacing * s, s);

      ctx.drawImage(

        sh,

        f.sx, f.sy, this.CELL, this.CELL,

        -mt.cx, -(mt.foot + 1), this.CELL, this.CELL

      );

      ctx.restore();

    },



    update(dt) {

      let dir = 0;



      // حركة اللاعب (تتوقف أثناء الإعدادات/الحوار/الانتقال/السينما الطارئ)

      if (!this.paused && !this.dialogueActive && !this.transitioning && !this.cutsceneActive) {

        const left = this.keys.left;

        const right = this.keys.right;

        if (left && !right) dir = -1;

        else if (right && !left) dir = 1;



        if (dir !== 0) {

          this.facing = dir;

          this.hasMoved = true;

          this.hideInstructions();

        }

      }



      // المشي التلقائي (دخول الغرفة) يعمل حتى أثناء الانتقال —

      // ويتجمد أثناء فتح الإعدادات حتى لا تسبق السينما اللاعب

      if (this.autoWalk && !this.paused) {

        dir = this.updateAutoWalk(dt);

      }



      this.vx = dir * this.SPEED;

      this.charX += this.vx * dt;



      // حدود الشاشة + جسم طارق الصلب (مع السماح بالدخول من خارج الإطار أثناء الانتقال)

      if (!this.transitioning && !this.autoWalk) {

        this.clampX();

      }



      // بلوغ حافة = الانتقال للغرفة المجاورة

      // (سلسلة الغرف بالاتجاه: يمين → يسار. الحواف المسموحة فقط - لا تتغير)

      // ملاحظة: الانتقال يحدث فقط أثناء المشي الفعلي ناحية الحافة —

      // الوقوف الثابت داخل المنطقة (مثل وقوف زين عن صور الحائط) لا يفتح الباب

      if (this.exitOpen && !this.transitioning && !this.autoWalk &&

          !this.paused && !this.dialogueActive && !this.cutsceneActive) {

        const half = this.charHalf();



        if (this.crisis) {

          // بعد الاصطدام: السلسلة الجديدة — يساراً نحو غرف الفيديو ثم القمرة

          if ((this.room === 3 || this.room === 4) && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(this.room + 1, 'right');

          }

          // المشهد 1 → المشهد 2: شرقاً نحو منخفض بحر الهدوء (بعد لوحة الذكريات)

          else if (this.room === 7 && this.eastOpen && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(8, 'left', this.footprintsDone ? {} : {

              arriveAction: () => {

                // أول دخول لمسار الوادي — لافتة فحص آثار الأقدام (المهمة 3)

                this.showLunarTask('footTask');

              },

            });

          }

          // المشهد 2 — غرباً للعودة لموقع الارتطام (دائماً مفتوح)

          else if (this.room === 8 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(7, 'right');

          }

          // المشهد 2 → المشهد 3: شرقاً لمحطة الزلازل (بعد فحص العلم الأبيض)

          else if (this.room === 8 && this.flagDone && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(9, 'left', this.psepSeen ? {} : {

              arriveAction: () => { this.showLunarTask('psepTask'); },

            });

          }

          // المشهد 3 — غرباً للعودة لمسار الوادي (دائماً مفتوح — حلقة العودة تمر من هنا)

          else if (this.room === 9 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(8, 'right');

          }

          // المشهد 3 → المشهد 4: شرقاً لعاكس الليزر (بعد فحص PSEP)

          else if (this.room === 9 && this.psepSeen && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(10, 'left', this.lrrrSeen ? {} : {

              arriveAction: () => { this.showLunarTask('lrrrTask'); },

            });

          }

          // المشهد 4 — غرباً للعودة لمحطة الزلازل (دائماً مفتوح)

          else if (this.room === 10 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(9, 'right');

          }

          // المشهد 4 → المشهد 5: شرقاً لممر الجبال (بعد فشل المعايرة المجمدة)

          else if (this.room === 10 && this.laserFailSeen && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(11, 'left', this.tracksSeen ? {} : {

              arriveAction: () => { this.showLunarTask('tracksTask'); },

            });

          }

          // المشهد 5 — غرباً للعودة لعاكس الليزر (دائماً مفتوح)

          else if (this.room === 11 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(10, 'right');

          }

          // المشهد 5 → المشهد 6: شرقاً للعربة الجوالة (بعد فحص مسارات العجلات)

          else if (this.room === 11 && this.tracksSeen && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(12, 'left', this.lrvSeen ? {} : {

              arriveAction: () => { this.showLunarTask('lrvTask'); },

            });

          }

          // المشهد 6 — غرباً للعودة لممر الجبال (دائماً مفتوح — حلقة العودة الذكية)

          else if (this.room === 12 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(11, 'right');

          }

          // المشهد 6 → المشهد 7: شرقاً لمنصة الإطلاق (بعد نجاح بث النداء — هبوط مركبة العبور)

          else if (this.room === 12 && this.antennaSolved && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(13, 'left', {

              arriveAction: () => { this.showLunarTask('boardTask'); },

            });

          }

          // المشهد 7 — غرباً للعودة لوادي العربة (مفتوح قبل الصعود)

          else if (this.room === 13 && !this.boarded && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(12, 'right');

          }

        } else if (this.marsMode) {

 /* ===== الفصل الثاني — سلسلة غرف المريخ (الاسكربت الجديد 14..21) ===== */

          // الغرفة 14 (المأوى) — شرقاً نحو ممر بوابة العزل (بعد التقاط المنارة)

          if (this.room === 14 && this.beaconTaken && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(15, 'left', {

 // : الشارة الخضراء أُزيلت — لافتة مهمة عادية تشير إلى البوابة

              arriveAction: () => {

                if (!this.doorOpened) this.showLunarTask('doorTask');

                else { this.removeNode(this.lunarTaskEl); this.lunarTaskEl = null; }

              },

            });

          }

          // الغرفة 15 — غرباً للعودة إلى المأوى

          else if (this.room === 15 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(14, 'right');

          }

          // الغرفة 15 — شرقاً: الخروج من بوابة العزل بعد فتحها نحو السهل الليلي

          else if (this.room === 15 && this.doorOpened && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(16, 'left', this.plainSeen ? {} : {

              arriveAction: () => {

                this.plainSeen = true;

                this.showLunarTask('plainTask');

              },

            });

          }

          // الغرفة 16 — غرباً للعودة إلى بوابة العزل

          else if (this.room === 16 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(15, 'right');

          }

          // الغرفة 16 — شرقاً إلى المحطة الأولى: سوجورنر

          else if (this.room === 16 && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(17, 'left');

          }

          // الغرفة 17 — غرباً للعودة إلى السهل

          else if (this.room === 17 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(16, 'right');

          }

          // الغرفة 17 — شرقاً إلى المحطة الثانية: إنسايت (بعد فحص سوجورنر)

          else if (this.room === 17 && this.sojournerSeen && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(18, 'left');

          }

          // الغرفة 18 — غرباً للعودة لسوجورنر

          else if (this.room === 18 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(17, 'right');

          }

          // الغرفة 18 — شرقاً إلى قمة إنديفور وأوبي (بعد فحص إنسايت)

          else if (this.room === 18 && this.insightSeen && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(19, 'left');

          }

          // الغرفة 19 — غرباً للعودة لإنسايت

          else if (this.room === 19 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(18, 'right');

          }

          // الغرفة 19 — شرقاً إلى غرفة الشروق (بعد تركيب المنارة فوق أوبي)

          else if (this.room === 19 && this.beaconMounted && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(20, 'left', this.sunriseDone ? {} : {

              arriveAction: () => {

                this.sunriseDone = true;

                this.showLunarTask('sunriseTask');

              },

            });

          }

          // الغرفة 20 — غرباً للعودة إلى قمة إنديفور

          else if (this.room === 20 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(19, 'right');

          }

 // الغرفة 20 — شرقاً إلى مشهد طارق أمام المركبة الهابطة (/2.6.0)

          else if (this.room === 20 && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(21, 'left', {

              arriveAction: () => {

                if (!this.reunionDone) this.showLunarTask('reunionPrompt');

              },

            });

          }

          // (لا عودة غرباً من الغرفة 21 — طارق ينتظر، اللقاء هو الوجهة)

        } else if (this.creditsMode) {

 /* ===== — خلف الكواليس: سلسلة مكاتب الفريق 22..25 ===== */

          // رجوع غرباً إلى المكتب السابق (مفتوح دائماً للاستكشاف)

          if (this.room === 23 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(22, 'right');

          }

          else if (this.room === 24 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(23, 'right');

          }

          else if (this.room === 25 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(24, 'right');

          }

          // شرقاً إلى المكتب التالي — بعد انتهاء حوار المكتب الحالي فقط

          else if (this.room === 22 && this.credSeen[0] && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(23, 'left', {

              arriveAction: () => { if (!this.credSeen[1]) this.showLunarTask('credTask2'); },

            });

          }

          else if (this.room === 23 && this.credSeen[1] && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(24, 'left', {

              arriveAction: () => { if (!this.credSeen[2]) this.showLunarTask('credTask3'); },

            });

          }

          else if (this.room === 24 && this.credSeen[2] && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(25, 'left', {

              arriveAction: () => { if (!this.credSeen[3]) this.showLunarTask('credTask4'); },

            });

          }

          // (المكتب 4 لا شرق بعده — شاشة التوديع تُفتح من حوار محمد)

        } else {

          if (this.room === 0 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(1, 'right');   // غرفة الصور → الغرفة الثانية (دخول من اليمين)

          } else if (this.room === 1 && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(0, 'left');    // الغرفة الثانية — يمين → العودة للغرفة الأولى (دخول من اليسار)

          } else if (this.room === 1 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(2, 'right');   // الغرفة الثانية — يسار → قمرة القيادة (دخول من اليمين)

          } else if (this.room === 2 && dir === 1 && this.charX >= this.W - half - 2) {

            this.goToRoom(1, 'left');    // قمرة القيادة → العودة للغرفة الثانية (دخول من اليسار)

          } else if (this.room === 0 && dir === 1 && this.podStage && this.charX >= this.W - half - 2) {

            this.goToRoom(3, 'left');    // الغرفة الأولى — يمين → حجرة كبسولة الهروب «الغرفة صفر» (دخول من اليسار)

          } else if (this.room === 3 && dir === -1 && this.charX <= half + 2) {

            this.goToRoom(0, 'right');   // الكبسولة → العودة للغرفة الأولى (دخول من اليمين)

          }

        }

      }



      // حوار الوداع: زين يتقدم يساراً حتى الجدار السفيل (الباب الصلب) في الغرفة 5

      // (بعد الاصطدام) — الاقتراب من الباب يبدأ الحوار تلقائياً (لا يمكن بلوغ طارق)

      if (this.crisis && this.room === 5 && this.playerChar === 'zain' &&

          !this.farewellDone && !this.cutsceneActive && !this.dialogueActive &&

          !this.transitioning && !this.autoWalk && !this.paused) {

        const door = this.crisisDoorRange();

        if (Math.abs(this.charX - door.right) <= this.FAREWELL_TRIGGER_RANGE) {

          Sfx.ensure();

          Sfx.ePress();

          this.openDialogue('farewell');

        }

      }



 /* اللقاء العظيم: اقتراب زين من طارق يشعل الحوار تلقائياً (على خلفية 8.jpg) — */

      if (this.marsMode && this.room === 21 && !this.reunionDone &&

          !this.cutsceneActive && !this.dialogueActive && !this.transitioning &&

          !this.autoWalk && !this.paused) {

        const tx = Math.round(this.W * 0.42);

        if (Math.abs(this.charX - tx) <= this.FAREWELL_TRIGGER_RANGE) {

          Sfx.ensure();

          Sfx.ePress();

          this.openDialogue('reunionTalk');

        }

      }



      // تبديل الأنيميشن حسب الحركة

      const moving = dir !== 0 || this.autoWalk;

      const newAnim = moving ? 'walk' : 'idle';

      if (newAnim !== this.anim) {

        this.anim = newAnim;

        this.frameIdx = 0;

        this.frameTimer = 0;

        this.lastWalkFrame = 0;

      }



      const fps = this.anim === 'walk' ? this.WALK_FPS : this.IDLE_FPS;

      const frameDur = 1 / fps;

      const meta = this.currentMeta();



      if (meta.frames.length > 0) {

        this.frameTimer += dt;

        while (this.frameTimer >= frameDur) {

          this.frameTimer -= frameDur;

          this.frameIdx = (this.frameIdx + 1) % meta.frames.length;



          // نقطة قدم متزامنة مع المشي (كل فريمين)

          if (this.anim === 'walk' &&

              this.frameIdx % this.FRAME_STEPS === 0 &&

              this.frameIdx !== this.lastWalkFrame) {

            this.lastWalkFrame = this.frameIdx;

            Sfx.footStep();

          }

        }

      }



      // زر التفاعل E — فقط أثناء التحكم الحر (ليس أثناء انتقال أو مشي سينمائي)

      if (!this.paused && !this.dialogueActive && !this.cutsceneActive &&

          !this.transitioning && !this.autoWalk && this.keys.e) {

        this.keys.e = false;

        this.interact();

      }



      // الاقتراب القريب من رافع غرفة الكبسولة يطلق المشهد الطارئ تلقائياً

      // (شارة E ظاهرة قبل ذلك بمدى أوسع — اصطدام النيازك يأتي فور الاقتراب من الرافع)

      if (this.room === 3 && !this.impactTriggered &&

          !this.cutsceneActive && !this.transitioning && !this.autoWalk &&

          !this.paused && !this.dialogueActive) {

        for (const hs of this.currentHotspots()) {

          if (hs.id !== 'lever') continue;

          const rect = this.srcRectToScreen(hs);

          const cx = rect.x + rect.w / 2;

          if (Math.abs(this.charX - cx) <= this.LEVER_TRIGGER_RANGE) {

            this.startImpactCutscene();

            break;

          }

        }

      }



      this.updateExitHint();

    },



    /* -------------------------------------------------------

       الرسم

       ------------------------------------------------------- */

    groundY() {

      // رفع الشخصية قليلاً عن الحافة السفلية

      return this.H - Math.max(82, this.H * 0.10);

    },



    render() {

      const ctx = this.ctx;

      const W = this.W;

      const H = this.H;



      ctx.clearRect(0, 0, W, H);



      if (!this.imagesReady) {

        // شاشة تحميل مع شريط تقدم (بدل نص جاف)

        ctx.fillStyle = '#080c14';

        ctx.fillRect(0, 0, W, H);



        const ui = CHAPTER1_UI[this.lang === 'en' ? 'en' : 'ar'];

        ctx.fillStyle = '#39ff5a';

        ctx.font = '14px "Press Start 2P", monospace';

        ctx.textAlign = 'center';

        ctx.textBaseline = 'middle';

        ctx.fillText(ui.loading, W / 2, H / 2 - 44);



        const bw = Math.min(W * 0.5, 420);

        const bh = 18;

        const bx = (W - bw) / 2;

        const by = H / 2 + 6;

        const p = Math.max(0, Math.min(1, this.loadProgress));



        ctx.fillStyle = '#0c1a10';

        ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);

        ctx.strokeStyle = 'rgba(57, 255, 90, 0.55)';

        ctx.lineWidth = 2;

        ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);



        ctx.fillStyle = '#39ff5a';

        ctx.fillRect(bx, by, bw * p, bh);



        ctx.fillStyle = '#9fd0ff';

        ctx.font = '10px "Press Start 2P", monospace';

        ctx.fillText(Math.round(p * 100) + '%', W / 2, by + bh + 26);

        return;

      }



      // الخلفية: فيديو (غرفة الأزمة / فيديوهات الغرف) وإلا صورة الغرفة الحالية

      let bgDrawn = false;



      const drawCover = (src, sw, sh) => {

        const scale = Math.max(W / sw, H / sh);

        const dw = sw * scale;

        const dh = sh * scale;

        ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);

      };



      // خلفية الأزمة في غرفة الكبسولة = فيديو الاصطدام

      let bgVid = null;

      if (this.crisis && this.room === 3 && this.videoEl) bgVid = this.videoEl;

      else if (this.roomVideos[this.room]) bgVid = this.roomVideos[this.room];



      if (bgVid && bgVid.readyState >= 2 && bgVid.videoWidth > 0) {

        drawCover(bgVid, bgVid.videoWidth, bgVid.videoHeight);

        bgDrawn = true;

      }



      const img = this.roomImgs[this.room];

      if (img && !bgDrawn) {

        const iw = img.naturalWidth || img.width;

        const ih = img.naturalHeight || img.height;

        drawCover(img, iw, ih);

        bgDrawn = true;

      }



      // خلفية داكنة مؤقتة حين لا تجهز الفيديو/الصورة بعد

      if (!bgDrawn) {

        ctx.fillStyle = this.crisis ? '#05070c' : '#111';

        ctx.fillRect(0, 0, W, H);

      }



      // مسارات عجلات العربة LRV — جسم مرسوم فوق أرضية ممر الجبال (المشهد 5 / الغرفة 11)

 // (: خلفية المستخدم 5.jpg لا تحوي مسارات مرسومة — المساران يُرسمان

      //  كجسم عريض مسطّح فوق الأرضية، بمنتصفه عند مركز نقطته نفسها)

      if (this.room === 11 && this.extraImgs && this.extraImgs.tracks && !bgVid) {

        const hsT = (ROOMS[11].hotspots || []).find(h => h.id === 'tracks');

        if (hsT) {

          const rectT = this.fracRect(hsT);

          const trIm = this.extraImgs.tracks;

          const trW = Math.round(W * 0.52);                       // عرض المسارين ~نصف الشاشة

          const trH = Math.round(trW * (trIm.naturalHeight / trIm.naturalWidth));

          const tcx = Math.round(rectT.x + rectT.w / 2);

          const tBase = Math.round(rectT.y + rectT.h * 0.72);     // يستقران فوق خط الأرض

          ctx.drawImage(trIm, tcx - trW / 2, tBase - trH, trW, trH);

        }

      }



      // طارق NPC واقف: الغرفة الثانية (قبل الاصطدام) أو الغرفة 5 (بعد الاصطدام — قبل انكسار موقفه)

 // أو مشهد طارق أمام المركبة الهابطة على السهل (الغرفة 21 على خلفية 8.jpg)

      const npcVisible =

        (this.room === 2 && !this.crisis) ||

        (this.room === 5 && this.crisis && this.playerChar === 'zain') ||

        (this.room === 21 && this.marsMode && !this.reunionDone);



 /* خلف الكواليس: NPC أعضاء الفريق داخل مكاتبهم (الغرف 22..24) */

      if (this.creditsMode && this.room >= 22 && this.room <= 24) {

        const teamNpc = {

          22: { sheet: this.malakSheet, meta: this.malakMeta, x: 0.50, talk: 'credMalak' },

          23: { sheet: this.ranyaSheet, meta: this.ranyaMeta, x: 0.58, talk: 'credRanya' },

          24: { sheet: this.mazenSheet, meta: this.mazenMeta, x: 0.60, talk: 'credMazen' },

        }[this.room];

        if (teamNpc && teamNpc.sheet && teamNpc.meta) {

          const nx = Math.round(this.W * teamNpc.x);

          this.drawNpcIdle(ctx, nx, this.npcFacingTarget(nx, -1, teamNpc.talk),

            teamNpc.sheet, teamNpc.meta);

        }

      } else if (npcVisible && this.tariqSheet && this.tariqMeta) {

        if (this.room === 2) {

          this.drawTariq(ctx);

        } else if (this.room === 21) {

          // طارق على السهل غرب المركبة — يستقبل أخاه القادم من الغرب بعد عبور الشروق

          this.drawNpcIdle(ctx, Math.round(this.W * 0.42),

            this.npcFacingTarget(Math.round(this.W * 0.42), -1, 'reunionTalk'));

        } else {

          this.drawNpcIdle(ctx, this.tariqCrisisX(),

            this.npcFacingTarget(this.tariqCrisisX(), 1, 'farewell'));

        }

      }



 // اللاعب (زين / طارق بعد تبديل الكاميرا / محمد في خاتمة الفريق)

      const meta = this.currentMeta();

      const sheet = this.playerChar === 'tariq'

        ? (this.anim === 'walk' ? this.tariqWalkSheet : this.tariqSheet)

        : this.playerChar === 'mohamed'

          ? (this.anim === 'walk' ? this.mohamedWalkSheet : this.mohamedSheet)

          : (this.anim === 'walk' ? this.walkSheet : this.idleSheet);

      if (!sheet || !meta.frames.length) return;



      const f = meta.frames[this.frameIdx % meta.frames.length];

      const s = meta.scale;

      const ground = this.groundY();



      // ظل خفيف يثبّت الشخصية على الأرض

      this.drawShadow(ctx, this.charX, ground, meta.w * s);



      // الشخصية: مركز المحتوى عند charX، والقدم على خط الأرض

      ctx.save();

      ctx.translate(this.charX, ground);

      ctx.scale(this.facing * s, s);

      ctx.drawImage(

        sheet,

        f.sx, f.sy, this.CELL, this.CELL,

        -meta.cx, -(meta.foot + 1), this.CELL, this.CELL

      );

      ctx.restore();



      // علامة [E] فوق أقرب نقطة تفاعل

      // لمعان لوحة الذكريات (الغرفة 7 — بعد إصلاح الأكسجين)

      if (this.crisis && this.room === 7 && this.oxyResolved && !this.plaqueTaken) {

        this.drawPlaqueSparkle(ctx);

      }



      this.drawPromptBadge(ctx);

    },



    /** ظل بيضاوي أسفل أي شخصية */

    drawShadow(ctx, x, ground, width) {

      ctx.save();

      ctx.globalAlpha = 0.30;

      ctx.fillStyle = '#000';

      ctx.beginPath();

      ctx.ellipse(x, ground + 2, width / 2.1, width / 7, 0, 0, Math.PI * 2);

      ctx.fill();

      ctx.restore();

    },









    /** موضع شارة E العائمة فوق نقطة التفاعل — أو null
     *
     *  منطق واحد يُستخدم للرسم وللكشف عن النقر/اللمس المباشر عليها */

    promptBadgePos() {

      if (this.transitioning || this.paused || this.dialogueActive || this.cutsceneActive) return null;

      const near = this.nearHotspot();

      if (!near) return null;

      let bx, by;

      if (near.npcX !== undefined) {

        // نقطة تفاعل شخصية (طارق) — فوق رأسه

        bx = near.npcX;

        by = this.groundY() - this.IDLE_HEIGHT - 36;

      } else {

        bx = near.rect.x + near.rect.w / 2;

        by = near.rect.y - 34;

      }

      const bob = Math.sin(performance.now() / 320) * 5;

      bx = Math.max(36, Math.min(this.W - 36, bx));

      by += bob;

 by = Math.max(24, by); // حماية: الشارة لا تصعد فوق حافة الشاشة 

      return { x: bx, y: by };

    },



    /** علامة زر E العائمة فوق نقطة التفاعل (صور الحائط أو طارق) */

    drawPromptBadge(ctx) {

      const pos = this.promptBadgePos();

      if (!pos) return;

      const bx = pos.x;

      const by = pos.y;

      const w = 34, h = 30, r = 7;



      ctx.save();

      ctx.translate(bx, by);



      // صندوق صغير بحدود فسفورية

      ctx.beginPath();

      if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, r);

      else ctx.rect(-w / 2, -h / 2, w, h);



      ctx.fillStyle = 'rgba(3, 12, 9, 0.88)';

      ctx.fill();

      ctx.lineWidth = 2;

      ctx.strokeStyle = 'rgba(57, 255, 90, 0.85)';

      ctx.shadowColor = 'rgba(57, 255, 90, 0.55)';

      ctx.shadowBlur = 10;

      ctx.stroke();

      ctx.shadowBlur = 0;



      ctx.fillStyle = '#8dff9d';

      ctx.font = '13px "Press Start 2P", monospace';

      ctx.textAlign = 'center';

      ctx.textBaseline = 'middle';

      ctx.fillText('E', 0, 1);



      ctx.restore();

    },

  };



  Scene2._resizeBound = () => Scene2.resize();



  window.Scene2 = Scene2;



  if (document.body.dataset.page === 'scene2-standalone') {

    Scene2.start({ embedded: false });

  }

})();
