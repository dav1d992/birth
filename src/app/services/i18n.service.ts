import { Injectable, computed, signal } from '@angular/core';

type Lang = 'da' | 'en';
type Params = Readonly<Record<string, string | number>>;
type Dictionary = Readonly<Record<string, string>>;

const STORAGE_KEY = 'birth-lang';

const DA: Dictionary = {
  'design.skip': 'Gå til indhold',
  'design.footer': 'Plads til ro. Plads til jer. Et skridt ad gangen.',
  'design.eyebrow': 'En guide til jeres nye begyndelse',
  'design.heroStart': 'Et nyt kapitel.',
  'design.heroEnd': 'I jeres tempo.',
  'design.explore': 'Udforsk fødslens faser',
  'design.listLink': 'Lav jeres oxytocin-liste',
  'design.artCaption': 'Plads til at vokse',
  'design.approach': 'Ro, nærvær & forberedelse',
  'design.approachTitle': 'Jeres fødsel. Jeres ønsker.',
  'design.pregnancy': 'Inden I mødes',
  'design.birth': 'Et skridt ad gangen',
  'design.phasesHint': 'Åbn en fase og find støtte til jer begge.',
  'design.listEyebrow': 'Jeres lille samling af ro',
  'design.listNote': 'Musikken I elsker. En varm hånd. Det, der føles trygt for jer.',
  'design.listFormTitle': 'Gør plads til det, der hjælper',
  'design.listTitleHint': 'Fx vores rolige øjeblikke',
  'design.listPrivate': 'Personlig, krypteret og kun til jer.',
  'design.listEmpty': 'Start med én lille ting, der giver ro.',
  'design.backToLists': 'Tilbage til oxytocin-lister',
  'design.language': 'Sprog',
  'app.name': 'Fødselsforberedelse',
  'nav.timeline': 'Tidslinje',
  'nav.oxytocin': 'Oxytocin-lister',
  'nav.admin': 'Admin',
  'lang.da': 'DA',
  'lang.en': 'EN',

  'timeline.pageTitle': 'Fødselstidslinje',
  'timeline.title': 'Graviditet, fødsel og de første dage',
  'timeline.intro': 'Et kort overblik over graviditeten og en detaljeret guide til faserne under fødslen.',
  'timeline.disclaimer': 'Generel information baseret på bl.a. sundhed.dk (Patienthåndbogen), ikke medicinsk rådgivning. Følg altid jordemoderens og hospitalets instruktioner.',
  'timeline.section.pregnancy': 'Kort graviditetsoversigt',
  'timeline.section.birth': 'Fødslens faser',
  'timeline.whatsHappening': 'Hvad sker der',
  'timeline.birthingPerson': 'Hvad den fødende kan gøre',
  'timeline.partner': 'Hvad partneren kan gøre',
  'timeline.callWard': 'Hvornår I bør ringe til fødegangen',
  'timeline.redFlags': 'Røde flag',
  'timeline.firstTime': 'Første gang eller flere gange',
  'timeline.firstTimer': 'Førstegangsfødende:',
  'timeline.experienced': 'Flergangsfødende:',
  'timeline.location.home': 'Hjemme',
  'timeline.location.hospital': 'På hospitalet',
  'timeline.philosophy': 'Denne guide lægger vægt på en fødsel med så lidt medicinsk smertelindring som muligt. Ro, mørke, varme, bevægelse, vand, berøring og rolig vejrtrækning hjælper kroppen med at danne oxytocin, som driver fødslen fremad. Medicinsk smertelindring (fx epidural) kan være en vigtig og nødvendig hjælp, men kan også dæmpe veerne og forlænge forløbet – tal med jordemoderen om dine ønsker.',

  'timeline.trimester1.title': '1. trimester (uge 1-13)',
  'timeline.trimester1.body': 'Kroppen tilpasser sig hormonelt. Træthed og kvalme er almindeligt. Fokus: hvile, væske og tidlig kontakt med sundhedssystemet.',
  'timeline.trimester2.title': '2. trimester (uge 14-27)',
  'timeline.trimester2.body': 'Mange får mere energi. Barnets bevægelser mærkes typisk. Fokus: motion i roligt tempo, mad med næring og forberedelse.',
  'timeline.trimester3.title': '3. trimester (uge 28-36)',
  'timeline.trimester3.body': 'Maven vokser, og søvn kan blive sværere. Fokus: aflastning, pauser, plan for transport og kontakt til fødegangen.',
  'timeline.term.title': 'Terminperiode (uge 37-42)',
  'timeline.term.body': 'Barnet regnes som klar til fødsel. Veer kan starte gradvist eller med vandafgang. Hold øje med bevægelser, blødning, feber og vandets farve.',

  'timeline.phase.nearLabour.title': 'Tegn på at fødslen er nær',
  'timeline.phase.nearLabour.happening': 'Plukkeveer kan tage til, slimproppen kan gå, og barnet kan trænge dybere ned i bækkenet.',
  'timeline.phase.nearLabour.birthingPerson': 'Sov når du kan, spis små måltider, drik vand og begynd at bruge rolige vejrtrækninger.',
  'timeline.phase.nearLabour.partner': 'Skab ro, gør hjemmet klar, hold telefonen opladet og notér symptomer og tidspunkter. Lav jeres oxytocin-liste nu – det, der giver tryghed, ro og velvære, hjælper kroppen med at danne oxytocin, når veerne går i gang.',
  'timeline.phase.nearLabour.callWard': 'Ring ved tvivl, ved vandafgang, hvis veerne bliver regelmæssige, eller hvis du ikke mærker barnet som normalt.',
  'timeline.phase.nearLabour.redFlags': 'Kraftig blødning, grønt/brunt fostervand, feber, svær hovedpine eller markant færre fosterbevægelser.',

  'timeline.phase.latent.title': 'Latent/tidlig fase',
  'timeline.phase.latent.happening': 'Uregelmæssige veer. Livmoderhalsen afkortes, og livmodermunden begynder at åbne sig. Det er oxytocin, der driver veerne, og det dannes bedst, når den fødende føler sig tryg og uforstyrret – stress og adrenalin kan bremse veerne.',
  'timeline.phase.latent.birthingPerson': 'Hvil mellem veerne, spis let, drik, og hold en rolig vejrtrækning.',
  'timeline.phase.latent.partner': 'Massér lænden, tilbyd drikke, og skærm mod afbrydelser. Hjælp med smertelindring uden medicin: gør et varmt bad klar, læg en varmedunk på lænden, gå en tur sammen og foreslå skift i stillinger. Dæmp lyset og brug jeres oxytocin-liste – det holder oxytocinen i gang.',
  'timeline.phase.latent.callWard': 'Ring ved bekymring, hurtigt stigende smerter, eller hvis jeres plan siger det.',
  'timeline.phase.latent.callFirst': 'Tag afsted når veerne er regelmæssige – ca. hvert 5. minut, 1 minut lange, i mindst en time.',
  'timeline.phase.latent.callAgain': 'Tag afsted allerede ved ca. 6 veer i timen (hver 10. minut) af ca. 1 minut – det går ofte hurtigere end første gang.',
  'timeline.phase.latent.redFlags': 'Blødning, misfarvet fostervand, feber, svær hovedpine eller færre fosterbevægelser.',

  'timeline.phase.active.title': 'Aktiv fase',
  'timeline.phase.active.happening': 'Veerne bliver regelmæssige og kraftigere, ofte 3-5 veer på 10 minutter. Livmodermunden udvider sig fra 4-6 cm mod helt åben (ca. 10 cm).',
  'timeline.phase.active.firstTime': 'Udvidningen tager typisk længere tid for førstegangsfødende (ofte omkring 12 timer) end for flergangsfødende (ca. 4-8 timer). Der er dog stor forskel fra fødsel til fødsel.',
  'timeline.phase.active.birthingPerson': 'Fokusér på én ve ad gangen med en lang, kontrolleret udånding gennem hele veen – gerne med en dyb, åben lyd, der holder kæbe og bækkenbund afslappet. Skift stilling og bed tydeligt om den smertelindring du ønsker.',
  'timeline.phase.active.partner': 'Vær rolig og nærværende. Hjælp med vejrtrækningen, kontakt personalet ved behov, og vær talerør for jeres aftaler. Støt smertelindring uden medicin så længe det føles muligt: vand, varme, massage, bevægelse og rytme. Hold rummet mørkt, roligt og trygt – det beskytter oxytocinen, der driver veerne.',
  'timeline.phase.active.redFlags': 'Vedvarende svær smerte mellem veerne, stor blødning, eller tegn på utilpashed hos den fødende.',

  'timeline.phase.transition.title': 'Overgangsfasen',
  'timeline.phase.transition.happening': 'Den sidste og mest intense del af udvidningsperioden, hvor livmodermunden åbner de sidste centimeter. Veerne kan komme tæt, og den fødende kan føle sig overvældet.',
  'timeline.phase.transition.birthingPerson': 'Fokusér på udåndingen, og slap af i kæbe og skuldre. Mærker du tidlig pressetrang, før livmodermunden er helt åben, så pust i korte, lette stød ("pustevejrtrækning") i stedet for at presse, indtil jordemoderen siger til. Bed om direkte støtte.',
  'timeline.phase.transition.partner': 'Vær helt tæt på, tal lavt, mind om pauserne mellem veerne, og hent hjælp hurtigt hvis noget ændrer sig. Fasen er kort, men intens: lyd, vand, varme og din tætte støtte hjælper ofte mere end noget andet. Hjælp med at tage én ve ad gangen – tryghed holder oxytocinen oppe, når det er hårdest.',
  'timeline.phase.transition.redFlags': 'Pludselig kraftig blødning, besvimelse, kramper, eller symptomer der virker akut farlige.',

  'timeline.phase.pushing.title': 'Pressefasen (2. stadie)',
  'timeline.phase.pushing.happening': 'Først trænger barnet ned i bækkenet, og der kan komme en kort pause i veerne. Når hovedet når bækkenbunden, melder pressetrangen sig. Oxytocin topper nu og giver de kraftige presseveer.',
  'timeline.phase.pushing.firstTime': 'Pressefasen varer ofte op til 1 time for førstegangsfødende (op til 2 timer kan accepteres, hvis mor og barn har det godt), mens den typisk er kortere, hvis du har født før.',
  'timeline.phase.pushing.birthingPerson': 'Lyt til kroppen og personalet. Tag en dyb indånding når veen kommer, og pres roligt nedad med lukket mund – eller pust med, hvis jordemoderen guider til det. Pres med veen, skift stilling efter behov, og hvil helt imellem.',
  'timeline.phase.pushing.partner': 'Hold kontakten, giv vand, støt fysisk, og hjælp med at fokusere på én opgave ad gangen.',


  'timeline.phase.placenta.title': 'Moderkagens fødsel (3. stadie)',
  'timeline.phase.placenta.happening': 'Efter barnet er født, fødes moderkagen (efterbyrden), ofte inden for ca. 15 minutter. Kroppens egen oxytocin får livmoderen til at trække sig sammen, og hud mod hud og amning øger den. Mange får desuden en indsprøjtning med syntetisk oxytocin i låret, der forebygger kraftig blødning.',
  'timeline.phase.placenta.birthingPerson': 'Fokusér på ro, hud mod hud hvis muligt, og sig til ved svimmelhed eller stigende smerte.',
  'timeline.phase.placenta.partner': 'Støt kontakten mellem forælder og barn. Hold øje med hvordan den fødende har det.',

  'timeline.phase.goldenHour.title': 'Den første gyldne time',
  'timeline.phase.goldenHour.happening': 'Barnet tilpasser sig livet uden for livmoderen. Oxytocin-niveauet er højt hos både forælder og barn, hvilket fremmer tilknytning og amning. Tidlig hud mod hud og etablering af amning kan starte.',
  'timeline.phase.goldenHour.birthingPerson': 'Hud mod hud, rolig vejrtrækning, drik og spis lidt. Bed om hjælp til amning hvis du ønsker det.',
  'timeline.phase.goldenHour.partner': 'Beskyt roen, så oxytocinen kan arbejde uforstyrret, hjælp med de praktiske ting, og vær nær i den første tilknytningstid.',

  'timeline.phase.firstDays.title': 'De første dage',
  'timeline.phase.firstDays.happening': 'Kroppen restituerer, mælkeproduktion og søvnrytme finder form, og familien lærer barnets signaler at kende. Ved amning og hud mod hud frigives oxytocin – det får mælken til at løbe til og kan give efterveer, mens livmoderen trækker sig sammen.',
  'timeline.phase.firstDays.birthingPerson': 'Prioritér hvile, smertelindring efter behov, væske og mad, og kontakt sundhedsvæsenet ved tvivl.',
  'timeline.phase.firstDays.partner': 'Tag mest muligt praktisk ansvar, skab et skjold omkring familien, og hold øje med trivslen.',
  'timeline.phase.firstDays.callWard': 'Ring ved feber, stigende smerter, kraftig blødning, tristhed der tager over, eller bekymring om barnet.',
  'timeline.phase.firstDays.redFlags': 'Feber, svær hovedpine, kraftig blødning, barnet spiser dårligt eller virker usædvanligt sløvt.',

  'oxytocin.pageTitle': 'Oxytocin-lister',
  'oxytocin.home.title': 'Dine oxytocin-lister',
  'oxytocin.home.intro': 'Lav en personlig liste over ting der skaber ro under fødslen.',
  'oxytocin.home.warningRecover': 'Hvis du glemmer adgangskoden, kan listen ikke gendannes.',
  'oxytocin.home.warningTitle': 'Titlen er synlig for admin, så undgå personlige detaljer i titlen.',
  'oxytocin.home.listTitle': 'Titel',
  'oxytocin.home.password': 'Adgangskode',
  'oxytocin.home.create': 'Opret liste',
  'oxytocin.home.savedLists': 'Lister',
  'oxytocin.home.open': 'Åbn',
  'oxytocin.home.empty': 'Ingen gemte lister endnu.',
  'oxytocin.home.passwordHint': 'Mindst 4 tegn',

  'oxytocin.list.pageTitle': 'Rediger liste',
  'oxytocin.list.unlockTitle': 'Lås liste op',
  'oxytocin.list.unlock': 'Lås op',
  'oxytocin.list.password': 'Adgangskode',
  'oxytocin.list.items': 'Punkter',
  'oxytocin.list.add': 'Tilføj punkt',
  'oxytocin.list.placeholder': 'Skriv noget der skaber ro',
  'oxytocin.list.delete': 'Slet',
  'oxytocin.list.moveUp': 'Op',
  'oxytocin.list.moveDown': 'Ned',
  'oxytocin.list.deleteList': 'Slet liste',
  'oxytocin.list.saved': 'Gemt',
  'oxytocin.list.encryptedInfo':
    'Listen og alt indhold er krypteret. Kun personer med adgangskoden kan læse den – heller ikke os. Del linket og koden med dem, der skal have adgang.',
  'oxytocin.list.share': 'Copy link',
  'oxytocin.list.linkCopied': 'Link kopieret',
  'oxytocin.list.infoAria': 'Om kryptering og sikkerhed',

  'admin.code': 'Admin-kode',
  'admin.login': 'Log ind',
  'admin.logout': 'Log ud',
  'admin.loggedIn': 'Du er logget ind som admin.',
  'admin.createdAt': 'Oprettet',
  'admin.delete': 'Slet',
  'admin.deleteConfirm': 'Er du sikker på at du vil slette "{title}"?',

  'err.generic': 'Noget gik galt. Prøv igen.',
  'err.passwordTooShort': 'Adgangskoden skal være mindst 4 tegn.',
  'err.wrongPassword': 'Forkert adgangskode.',
  'err.notFound': 'Listen findes ikke.',
  'err.locked': 'Listen er låst. Lås den op først.',
  'err.adminCodeRequired': 'Admin-kode mangler.',
  'err.wrongAdminCode': 'Forkert admin-kode.',
  'err.rateLimited': 'For mange forsøg. Vent lidt og prøv igen.',
};

const EN: Dictionary = {
  'design.skip': 'Skip to content',
  'design.footer': 'Room for calm. Room for you. One step at a time.',
  'design.eyebrow': 'A guide to your new beginning',
  'design.heroStart': 'A new chapter.',
  'design.heroEnd': 'At your pace.',
  'design.explore': 'Explore the birth phases',
  'design.listLink': 'Make your oxytocin list',
  'design.artCaption': 'Room to grow',
  'design.approach': 'Calm, connection & preparation',
  'design.approachTitle': 'Your birth. Your wishes.',
  'design.pregnancy': 'Before you meet',
  'design.birth': 'One step at a time',
  'design.phasesHint': 'Open a phase to find support for both of you.',
  'design.listEyebrow': 'Your little collection of calm',
  'design.listNote': 'The music you love. A warm hand. Whatever feels like comfort to you.',
  'design.listFormTitle': 'Make room for what helps',
  'design.listTitleHint': 'E.g. our quiet moments',
  'design.listPrivate': 'Personal, encrypted, and just for you.',
  'design.listEmpty': 'Start with one little thing that brings you calm.',
  'design.backToLists': 'Back to oxytocin lists',
  'design.language': 'Language',
  'app.name': 'Birth preparation',
  'nav.timeline': 'Timeline',
  'nav.oxytocin': 'Oxytocin lists',
  'nav.admin': 'Admin',
  'lang.da': 'DA',
  'lang.en': 'EN',

  'timeline.pageTitle': 'Birth timeline',
  'timeline.title': 'Pregnancy, birth, and the first days',
  'timeline.intro': 'A short pregnancy overview and a detailed guide to labour and birth phases.',
  'timeline.disclaimer': 'General information based partly on sundhed.dk (the Danish patient handbook), not medical advice. Always follow your midwife and hospital guidance.',
  'timeline.section.pregnancy': 'Pregnancy overview',
  'timeline.section.birth': 'Birth phases',
  'timeline.whatsHappening': 'What is happening',
  'timeline.birthingPerson': 'What the birthing person can do',
  'timeline.partner': 'What the partner can do',
  'timeline.callWard': 'When to call the maternity ward',
  'timeline.redFlags': 'Red flags',
  'timeline.firstTime': 'First birth or later birth',
  'timeline.firstTimer': 'First birth:',
  'timeline.experienced': 'Later birth:',
  'timeline.location.home': 'At home',
  'timeline.location.hospital': 'At hospital',
  'timeline.philosophy': 'This guide favours a birth with as little medical pain relief as possible. Calm, darkness, warmth, movement, water, touch, and slow breathing help the body produce oxytocin, which drives labour forward. Medical pain relief (such as an epidural) can be an important and sometimes necessary help, but it can also soften contractions and lengthen labour \u2013 talk to your midwife about your wishes.',

  'timeline.trimester1.title': '1st trimester (week 1-13)',
  'timeline.trimester1.body': 'The body adapts hormonally. Fatigue and nausea are common. Focus: rest, hydration, and early care contact.',
  'timeline.trimester2.title': '2nd trimester (week 14-27)',
  'timeline.trimester2.body': 'Many people feel more energy. Fetal movement is often noticeable. Focus: gentle movement, nutrition, preparation.',
  'timeline.trimester3.title': '3rd trimester (week 28-36)',
  'timeline.trimester3.body': 'The belly grows and sleep can be harder. Focus: pacing, breaks, transport plan, and ward contact details.',
  'timeline.term.title': 'Term window (week 37-42)',
  'timeline.term.body': 'Baby is considered term. Labour can begin gradually or with waters breaking. Watch movement, bleeding, fever, and fluid color.',

  'timeline.phase.nearLabour.title': 'Signs labour is near',
  'timeline.phase.nearLabour.happening': 'Practice contractions may intensify, the mucus plug may come away, and baby may move lower in the pelvis.',
  'timeline.phase.nearLabour.birthingPerson': 'Rest when possible, eat small meals, hydrate, and start using calming breathing patterns.',
  'timeline.phase.nearLabour.partner': 'Create calm, prepare practical items, keep phones charged, and note symptoms and timing. Make your oxytocin list now – whatever brings safety, calm, and comfort helps the body produce oxytocin once contractions start.',
  'timeline.phase.nearLabour.callWard': 'Call if unsure, if waters break, if contractions become regular, or if movement feels reduced.',
  'timeline.phase.nearLabour.redFlags': 'Heavy bleeding, green/brown waters, fever, severe headache, or clearly reduced fetal movement.',

  'timeline.phase.latent.title': 'Latent or early phase',
  'timeline.phase.latent.happening': 'Irregular contractions. The cervix shortens and slowly begins to open. Oxytocin drives the contractions and flows best when the birthing person feels safe and undisturbed – stress and adrenaline can slow labour down.',
  'timeline.phase.latent.birthingPerson': 'Rest between contractions, eat lightly, drink, and keep a calm breathing rhythm.',
  'timeline.phase.latent.partner': 'Offer lower-back pressure, keep drinks nearby, and shield from interruptions. Help with drug-free pain relief: run a warm bath, place a heat pack on the lower back, go for walks together, and suggest changing positions. Dim the lights and use your oxytocin list – it keeps oxytocin flowing.',
  'timeline.phase.latent.callWard': 'Call if you are worried, if pain escalates quickly, or if your care plan says so.',
  'timeline.phase.latent.callFirst': 'Leave when contractions are regular – about every 5 minutes, 1 minute long, for at least an hour.',
  'timeline.phase.latent.callAgain': 'Leave already at about 6 contractions per hour (every 10 minutes) lasting about 1 minute – it often goes faster than a first birth.',
  'timeline.phase.latent.redFlags': 'Bleeding, discolored waters, fever, severe headache, or reduced fetal movement.',

  'timeline.phase.active.title': 'Active phase',
  'timeline.phase.active.happening': 'Contractions become regular and stronger, often 3-5 in 10 minutes. The cervix dilates from 4-6 cm toward fully open (about 10 cm).',
  'timeline.phase.active.firstTime': 'Dilation usually takes longer for a first birth (often around 12 hours) than for later births (about 4-8 hours). There is, however, great variation from birth to birth.',
  'timeline.phase.active.birthingPerson': 'Focus on one contraction at a time with one long, controlled exhale through the whole contraction – let a deep, open sound come with it to keep the jaw and pelvic floor relaxed. Change positions and ask clearly for the pain relief you want.',
  'timeline.phase.active.partner': 'Stay grounded. Guide breathing, contact staff when needed, and advocate for agreed preferences. Support drug-free pain relief as long as it feels possible: water, warmth, massage, movement, and rhythm. Keep the room dim, quiet, and safe – it protects the oxytocin that drives contractions.',
  'timeline.phase.active.redFlags': 'Severe persistent pain between contractions, heavy bleeding, or sudden deterioration.',

  'timeline.phase.transition.title': 'Transition',
  'timeline.phase.transition.happening': 'The last and most intense part of dilation, as the cervix opens the final centimetres. Contractions can come close together and feel overwhelming.',
  'timeline.phase.transition.birthingPerson': 'Exhale slowly and relax your jaw and shoulders. If you feel an early urge to push before the cervix is fully open, breathe in short, light puffs ("panting") instead of pushing until the midwife says it is time. Ask for direct support.',
  'timeline.phase.transition.partner': 'Stay close, speak calmly, remind of pauses between contractions, and get help quickly if anything changes. This phase is short but intense: sound, water, warmth, and your close support often help more than anything else. Help take one contraction at a time – feeling safe keeps oxytocin up when it is hardest.',
  'timeline.phase.transition.redFlags': 'Heavy sudden bleeding, fainting, seizures, or symptoms that appear acutely dangerous.',

  'timeline.phase.pushing.title': 'Pushing stage (2nd stage)',
  'timeline.phase.pushing.happening': 'First the baby descends into the pelvis and contractions may briefly pause. When the head reaches the pelvic floor, the urge to push arrives. Oxytocin peaks now and powers the strong pushing contractions.',
  'timeline.phase.pushing.firstTime': 'The pushing stage often lasts up to 1 hour for a first birth (up to 2 hours can be accepted if mother and baby are well), while it is usually shorter if you have given birth before.',
  'timeline.phase.pushing.birthingPerson': 'Follow your body and staff guidance. Take a deep breath as the contraction comes and push steadily downward with your mouth closed – or breathe along if the midwife guides you to. Push with the contraction, change positions as needed, and rest fully in between.',
  'timeline.phase.pushing.partner': 'Offer physical and verbal support, provide water, and keep focus on one step at a time.',

  'timeline.phase.placenta.title': 'Placenta delivery (3rd stage)',
  'timeline.phase.placenta.happening': 'After the baby is born, the placenta is delivered, often within about 15 minutes. The body\'s own oxytocin makes the uterus contract, and skin-to-skin and breastfeeding boost it. Many also receive an injection of synthetic oxytocin in the thigh to help prevent heavy bleeding.',
  'timeline.phase.placenta.birthingPerson': 'Stay warm and calm, do skin-to-skin if possible, report dizziness or rising pain quickly.',
  'timeline.phase.placenta.partner': 'Support bonding and keep attention on how the birthing person feels physically.',

  'timeline.phase.goldenHour.title': 'First golden hour',
  'timeline.phase.goldenHour.happening': 'Baby transitions to life outside the womb. Oxytocin levels are high in both parent and baby, which supports bonding and breastfeeding. Early skin-to-skin and feeding can begin.',
  'timeline.phase.goldenHour.birthingPerson': 'Skin-to-skin, steady breathing, small fluids or snacks, and ask for feeding support if wanted.',
  'timeline.phase.goldenHour.partner': 'Protect calm and privacy so oxytocin can work undisturbed, handle practical needs, and support early bonding.',

  'timeline.phase.firstDays.title': 'First days',
  'timeline.phase.firstDays.happening': 'Recovery continues, feeding patterns emerge, and the family learns baby cues. Breastfeeding and skin-to-skin release oxytocin – it triggers the milk let-down and can cause after-pains as the uterus contracts.',
  'timeline.phase.firstDays.birthingPerson': 'Prioritize rest, pain control as advised, fluids, meals, and ask for help early.',
  'timeline.phase.firstDays.partner': 'Take practical load off, protect family space, and watch wellbeing for all.',
  'timeline.phase.firstDays.callWard': 'Call for fever, increasing pain, heavy bleeding, low mood that escalates, or concern about baby.',
  'timeline.phase.firstDays.redFlags': 'Fever, severe headache, heavy bleeding, poor feeding, or unusual sleepiness in baby.',

  'oxytocin.pageTitle': 'Oxytocin lists',
  'oxytocin.home.title': 'Your oxytocin lists',
  'oxytocin.home.intro': 'Create a personal list of things that help the birthing person relax.',
  'oxytocin.home.warningRecover': 'If you forget the password, the list cannot be recovered.',
  'oxytocin.home.warningTitle': 'The title is visible to admin, so avoid personal details in it.',
  'oxytocin.home.listTitle': 'Title',
  'oxytocin.home.password': 'Password',
  'oxytocin.home.create': 'Create list',
  'oxytocin.home.savedLists': 'Lists',
  'oxytocin.home.open': 'Open',
  'oxytocin.home.empty': 'No saved lists yet.',
  'oxytocin.home.passwordHint': 'Minimum 4 characters',

  'oxytocin.list.pageTitle': 'Edit list',
  'oxytocin.list.unlockTitle': 'Unlock list',
  'oxytocin.list.unlock': 'Unlock',
  'oxytocin.list.password': 'Password',
  'oxytocin.list.items': 'Items',
  'oxytocin.list.add': 'Add item',
  'oxytocin.list.placeholder': 'Write something calming',
  'oxytocin.list.delete': 'Delete',
  'oxytocin.list.moveUp': 'Up',
  'oxytocin.list.moveDown': 'Down',
  'oxytocin.list.deleteList': 'Delete list',
  'oxytocin.list.saved': 'Saved',
  'oxytocin.list.encryptedInfo':
    'The list and all its content are encrypted. Only people with the password can read it – not even us. Share the link and the password with those who need access.',
  'oxytocin.list.share': 'Copy link',
  'oxytocin.list.linkCopied': 'Link copied',
  'oxytocin.list.infoAria': 'About encryption and security',

  'admin.code': 'Admin code',
  'admin.login': 'Log in',
  'admin.logout': 'Log out',
  'admin.loggedIn': 'You are logged in as admin.',
  'admin.createdAt': 'Created',
  'admin.delete': 'Delete',
  'admin.deleteConfirm': 'Are you sure you want to delete "{title}"?',

  'err.generic': 'Something went wrong. Please try again.',
  'err.passwordTooShort': 'Password must be at least 4 characters.',
  'err.wrongPassword': 'Wrong password.',
  'err.notFound': 'List not found.',
  'err.locked': 'List is locked. Unlock it first.',
  'err.adminCodeRequired': 'Admin code is required.',
  'err.wrongAdminCode': 'Wrong admin code.',
  'err.rateLimited': 'Too many attempts. Wait and try again.',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.readStoredLang());
  readonly currentDictionary = computed<Dictionary>(() => (this.lang() === 'da' ? DA : EN));

  setLang(lang: Lang): void {
    this.lang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  t(key: string, params: Params = {}): string {
    const dictionary: Dictionary = this.currentDictionary();
    let value: string = dictionary[key] ?? key;

    for (const [paramName, paramValue] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${paramName}\\}`, 'g'), String(paramValue));
    }

    return value;
  }

  private readStoredLang(): Lang {
    const stored: string | null = localStorage.getItem(STORAGE_KEY);
    return stored === 'en' ? 'en' : 'da';
  }
}
