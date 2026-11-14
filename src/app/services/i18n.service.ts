import { Injectable, computed, signal } from '@angular/core';

type Lang = 'da' | 'en';
type Params = Readonly<Record<string, string | number>>;
type Dictionary = Readonly<Record<string, string>>;

const STORAGE_KEY = 'birth-lang';

const DA: Dictionary = {
  'app.name': 'Birth',
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
  'timeline.breathing': 'Vejrtrækning',
  'timeline.painRelief': 'Smertelindring uden medicin',
  'timeline.firstTime': 'Første gang eller flere gange',
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
  'timeline.phase.nearLabour.breathing': 'Begynd at øve rolig vejrtrækning: træk vejret dybt ind gennem næsen i ca. 4 sekunder, og pust langsomt ud gennem munden i 6-8 sekunder. De lange udåndinger sænker puls og spænding.',
  'timeline.phase.nearLabour.birthingPerson': 'Sov når du kan, spis små måltider, drik vand og begynd at bruge rolige vejrtrækninger.',
  'timeline.phase.nearLabour.partner': 'Skab ro, gør hjemmet klar, hold telefonen opladet og notér symptomer og tidspunkter.',
  'timeline.phase.nearLabour.callWard': 'Ring ved tvivl, ved vandafgang, hvis veerne bliver regelmæssige, eller hvis du ikke mærker barnet som normalt.',
  'timeline.phase.nearLabour.redFlags': 'Kraftig blødning, grønt/brunt fostervand, feber, svær hovedpine eller markant færre fosterbevægelser.',

  'timeline.phase.latent.title': 'Latent/tidlig fase',
  'timeline.phase.latent.happening': 'Veerne er uregelmæssige i styrke, varighed og interval. Livmoderhalsen afkortes, og livmodermunden begynder at åbne sig langsomt.',
  'timeline.phase.latent.firstTime': 'Er det din første fødsel, kan du som regel være hjemme i latensfasen og tage på hospitalet, når veerne er regelmæssige, kommer ca. hvert 5. minut og varer ca. 1 minut (omkring 10-12 veer i timen) gennem mindst en time. Har du født før, går det ofte hurtigere – tag afsted tidligere og ring til fødegangen i god tid.',
  'timeline.phase.latent.breathing': 'Find en fast rytme: ånd roligt ind gennem næsen, og pust langt ud gennem munden under hver ve. Slip skuldre og kæbe på udåndingen.',
  'timeline.phase.latent.painRelief': 'Prøv smertelindring uden medicin først: varmt bad eller brusebad, varmedunk på lænden, gåture og skift mellem stillinger. Det holder kroppens egen oxytocin i gang.',
  'timeline.phase.latent.birthingPerson': 'Tag et varmt bad, hvil mellem veerne, spis let, og hold rytmen med rolige ind- og udåndinger.',
  'timeline.phase.latent.partner': 'Tag tid, massér lænden, tilbyd noget at drikke, og beskyt den fødende mod unødvendige afbrydelser.',
  'timeline.phase.latent.callWard': 'Kontakt fødegangen hvis smerterne tiltager hurtigt, ved bekymring, eller hvis en tidligere aftale siger I skal ringe.',
  'timeline.phase.latent.redFlags': 'Samme røde flag: blødning, misfarvet fostervand, feber, svær hovedpine, færre fosterbevægelser.',

  'timeline.phase.active.title': 'Aktiv fase',
  'timeline.phase.active.happening': 'Veerne bliver regelmæssige og kraftigere, ofte 3-5 veer på 10 minutter. Livmodermunden udvider sig fra 4-6 cm mod helt åben (ca. 10 cm).',
  'timeline.phase.active.firstTime': 'Udvidningen tager typisk længere tid for førstegangsfødende (ofte omkring 12 timer) end for flergangsfødende (ca. 4-8 timer). Der er dog stor forskel fra fødsel til fødsel.',
  'timeline.phase.active.breathing': 'Hold fokus på en lang, kontrolleret udånding gennem hele veen. Lad gerne en dyb, åben lyd følge med – det holder kæben og bækkenbunden afslappet.',
  'timeline.phase.active.painRelief': 'Bliv ved de medicinfri metoder så længe det føles muligt: vand, varme, massage, bevægelse, rytme og rolig vejrtrækning. De støtter veerne i stedet for at dæmpe dem.',
  'timeline.phase.active.birthingPerson': 'Fokusér på én ve ad gangen. Skift stilling, brug lyd, og bed tydeligt om den smertelindring du ønsker.',
  'timeline.phase.active.partner': 'Vær rolig og nærværende. Hjælp med vejrtrækningen, kontakt personalet ved behov, og vær talerør for jeres aftaler.',
  'timeline.phase.active.callWard': 'Som regel tid til at være på hospitalet efter lokal vejledning om ve-interval og intensitet.',
  'timeline.phase.active.redFlags': 'Vedvarende svær smerte mellem veerne, stor blødning, eller tegn på utilpashed hos den fødende.',

  'timeline.phase.transition.title': 'Overgangsfasen',
  'timeline.phase.transition.happening': 'Den sidste og mest intense del af udvidningsperioden, hvor livmodermunden åbner de sidste centimeter. Veerne kan komme tæt, og den fødende kan føle sig overvældet.',
  'timeline.phase.transition.breathing': 'Mærker du tidlig pressetrang, før livmodermunden er helt åben, så pust i korte, lette stød ("pustevejrtrækning") i stedet for at presse, indtil jordemoderen siger til. Tæl gerne udåndingen.',
  'timeline.phase.transition.painRelief': 'Fasen er kort, men intens. Lyd, vand, varme og tæt støtte hjælper ofte mere end noget andet – prøv at ride veerne af én ad gangen frem for at bede om medicin.',
  'timeline.phase.transition.birthingPerson': 'Korte, enkle instruktioner. Fokusér på udåndingen, slap af i kæbe og skuldre, og bed om direkte støtte.',
  'timeline.phase.transition.partner': 'Vær helt tæt på, tal lavt, mind om pauserne mellem veerne, og hent hjælp hurtigt hvis noget ændrer sig.',
  'timeline.phase.transition.callWard': 'Er I ikke allerede i kontakt med personalet, skal I ringe med det samme.',
  'timeline.phase.transition.redFlags': 'Pludselig kraftig blødning, besvimelse, kramper, eller symptomer der virker akut farlige.',

  'timeline.phase.pushing.title': 'Pressefasen (2. stadie)',
  'timeline.phase.pushing.happening': 'Først trænger barnet ned i bækkenet, og der kan komme en kort pause i veerne. Når hovedet når bækkenbunden, melder pressetrangen sig.',
  'timeline.phase.pushing.firstTime': 'Pressefasen varer ofte op til 1 time for førstegangsfødende (op til 2 timer kan accepteres, hvis mor og barn har det godt), mens den typisk er kortere, hvis du har født før.',
  'timeline.phase.pushing.breathing': 'Tag en dyb indånding når veen kommer, og pres roligt nedad med lukket mund – eller pust med, hvis jordemoderen guider til det. Pres med veen, og hvil helt imellem.',
  'timeline.phase.pushing.birthingPerson': 'Lyt til kroppen og personalet. Skift stilling efter behov og spar på kræfterne mellem veerne.',
  'timeline.phase.pushing.partner': 'Hold kontakten, giv vand, støt fysisk, og hjælp med at fokusere på én opgave ad gangen.',
  'timeline.phase.pushing.callWard': 'Denne fase foregår normalt på hospital eller fødeklinik med personale omkring jer.',
  'timeline.phase.pushing.redFlags': 'Kraftig blødning, langvarigt fravær af fremgang med bekymrende symptomer eller akut utilpashed.',

  'timeline.phase.placenta.title': 'Moderkagens fødsel (3. stadie)',
  'timeline.phase.placenta.happening': 'Efter barnet er født, fødes moderkagen (efterbyrden), ofte inden for ca. 15 minutter. Mange får en indsprøjtning i låret, der får livmoderen til at trække sig sammen og forebygger kraftig blødning.',
  'timeline.phase.placenta.birthingPerson': 'Fokusér på ro, hud mod hud hvis muligt, og sig til ved svimmelhed eller stigende smerte.',
  'timeline.phase.placenta.partner': 'Støt kontakten mellem forælder og barn. Hold øje med hvordan den fødende har det.',
  'timeline.phase.placenta.callWard': 'Personalet overvåger blødning og livmoderens sammentrækning. Sig straks til ved bekymring.',
  'timeline.phase.placenta.redFlags': 'Vedvarende kraftig blødning, besvimelse eller stærke smerter.',

  'timeline.phase.goldenHour.title': 'Den første gyldne time',
  'timeline.phase.goldenHour.happening': 'Barnet tilpasser sig livet uden for livmoderen. Tidlig hud mod hud og etablering af amning kan starte.',
  'timeline.phase.goldenHour.birthingPerson': 'Hud mod hud, rolig vejrtrækning, drik og spis lidt. Bed om hjælp til amning hvis du ønsker det.',
  'timeline.phase.goldenHour.partner': 'Beskyt roen, hjælp med de praktiske ting, og vær nær i den første tilknytningstid.',
  'timeline.phase.goldenHour.callWard': 'Personalet er allerede til stede, men sig straks til hvis du føler dig utilpas eller svimmel.',
  'timeline.phase.goldenHour.redFlags': 'Stor blødning, feber, svær hovedpine eller hvis barnet virker slapt eller ikke reagerer normalt.',

  'timeline.phase.firstDays.title': 'De første dage',
  'timeline.phase.firstDays.happening': 'Kroppen restituerer, mælkeproduktion og søvnrytme finder form, og familien lærer barnets signaler at kende.',
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
  'oxytocin.home.savedLists': 'Lister på denne enhed',
  'oxytocin.home.open': 'Åbn',
  'oxytocin.home.empty': 'Ingen gemte lister endnu.',
  'oxytocin.home.passwordHint': 'Mindst 8 tegn',

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

  'admin.pageTitle': 'Admin',
  'admin.title': 'Admin-login',
  'admin.code': 'Admin-kode',
  'admin.login': 'Log ind',
  'admin.logout': 'Log ud',
  'admin.listTitle': 'Eksisterende lister',
  'admin.createdAt': 'Oprettet',
  'admin.delete': 'Slet liste',
  'admin.empty': 'Ingen lister endnu.',
  'admin.deleteConfirm': 'Er du sikker på at du vil slette "{title}"?',

  'err.generic': 'Noget gik galt. Prøv igen.',
  'err.passwordTooShort': 'Adgangskoden skal være mindst 8 tegn.',
  'err.wrongPassword': 'Forkert adgangskode.',
  'err.notFound': 'Listen findes ikke.',
  'err.locked': 'Listen er låst. Lås den op først.',
  'err.adminCodeRequired': 'Admin-kode mangler.',
  'err.wrongAdminCode': 'Forkert admin-kode.',
  'err.rateLimited': 'For mange forsøg. Vent lidt og prøv igen.',
};

const EN: Dictionary = {
  'app.name': 'Birth',
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
  'timeline.breathing': 'Breathing',
  'timeline.painRelief': 'Drug-free pain relief',
  'timeline.firstTime': 'First birth or later birth',
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
  'timeline.phase.nearLabour.breathing': 'Start practising calm breathing: breathe in slowly through the nose for about 4 seconds, and breathe out through the mouth for 6-8 seconds. Long exhales lower your pulse and tension.',
  'timeline.phase.nearLabour.birthingPerson': 'Rest when possible, eat small meals, hydrate, and start using calming breathing patterns.',
  'timeline.phase.nearLabour.partner': 'Create calm, prepare practical items, keep phones charged, and note symptoms and timing.',
  'timeline.phase.nearLabour.callWard': 'Call if unsure, if waters break, if contractions become regular, or if movement feels reduced.',
  'timeline.phase.nearLabour.redFlags': 'Heavy bleeding, green/brown waters, fever, severe headache, or clearly reduced fetal movement.',

  'timeline.phase.latent.title': 'Latent or early phase',
  'timeline.phase.latent.happening': 'Contractions are irregular in strength, length, and spacing. The cervix shortens and slowly begins to open.',
  'timeline.phase.latent.firstTime': 'If this is your first birth, you can usually stay home during the latent phase and go to hospital when contractions are regular, come about every 5 minutes and last about 1 minute (around 10-12 per hour) for at least an hour. If you have given birth before, it often goes faster – leave earlier and call the ward in good time.',
  'timeline.phase.latent.breathing': 'Find a steady rhythm: breathe in through the nose and out slowly through the mouth during each contraction. Release your shoulders and jaw on the exhale.',
  'timeline.phase.latent.painRelief': 'Try drug-free pain relief first: a warm bath or shower, a heat pack on the lower back, walks, and changing positions. This keeps your own oxytocin flowing.',
  'timeline.phase.latent.birthingPerson': 'Use warmth, rest between contractions, eat lightly, and keep a slow breathing rhythm.',
  'timeline.phase.latent.partner': 'Protect the space, offer lower back pressure, keep drinks nearby, reduce interruptions.',
  'timeline.phase.latent.callWard': 'Call if pain escalates quickly, if you are worried, or if your care plan says to call now.',
  'timeline.phase.latent.redFlags': 'Same red flags: bleeding, discolored waters, fever, severe headache, reduced movement.',

  'timeline.phase.active.title': 'Active phase',
  'timeline.phase.active.happening': 'Contractions become regular and stronger, often 3-5 in 10 minutes. The cervix dilates from 4-6 cm toward fully open (about 10 cm).',
  'timeline.phase.active.firstTime': 'Dilation usually takes longer for a first birth (often around 12 hours) than for later births (about 4-8 hours). There is, however, great variation from birth to birth.',
  'timeline.phase.active.breathing': 'Focus on one long, controlled exhale through the whole contraction. Let a deep, open sound come with it – it keeps the jaw and pelvic floor relaxed.',
  'timeline.phase.active.painRelief': 'Stay with the drug-free methods as long as it feels possible: water, warmth, massage, movement, rhythm, and calm breathing. They support contractions rather than dampening them.',
  'timeline.phase.active.birthingPerson': 'Focus on one contraction at a time. Change positions, use sound, request preferred pain relief.',
  'timeline.phase.active.partner': 'Stay grounded. Guide breathing, contact staff when needed, advocate for agreed preferences.',
  'timeline.phase.active.callWard': 'Usually time to be at the hospital according to your local contraction timing guidance.',
  'timeline.phase.active.redFlags': 'Severe persistent pain between contractions, heavy bleeding, or sudden deterioration.',

  'timeline.phase.transition.title': 'Transition',
  'timeline.phase.transition.happening': 'The last and most intense part of dilation, as the cervix opens the final centimetres. Contractions can come close together and feel overwhelming.',
  'timeline.phase.transition.breathing': 'If you feel an early urge to push before the cervix is fully open, breathe in short, light puffs ("panting") instead of pushing until the midwife says it is time. Counting the exhale can help.',
  'timeline.phase.transition.painRelief': 'This phase is short but intense. Sound, water, warmth, and close support often help more than anything else – try to ride out one contraction at a time rather than asking for medication.',
  'timeline.phase.transition.birthingPerson': 'Keep instructions short and simple. Exhale slowly, relax jaw and shoulders, ask for direct support.',
  'timeline.phase.transition.partner': 'Stay close, speak calmly, remind of pauses between contractions, get help quickly if anything changes.',
  'timeline.phase.transition.callWard': 'If you are not already with care staff, call immediately.',
  'timeline.phase.transition.redFlags': 'Heavy sudden bleeding, fainting, seizures, or symptoms that appear acutely dangerous.',

  'timeline.phase.pushing.title': 'Pushing stage (2nd stage)',
  'timeline.phase.pushing.happening': 'First the baby descends into the pelvis and contractions may briefly pause. When the head reaches the pelvic floor, the urge to push arrives.',
  'timeline.phase.pushing.firstTime': 'The pushing stage often lasts up to 1 hour for a first birth (up to 2 hours can be accepted if mother and baby are well), while it is usually shorter if you have given birth before.',
  'timeline.phase.pushing.breathing': 'Take a deep breath as the contraction comes and push steadily downward with your mouth closed – or breathe along if the midwife guides you to. Push with the contraction and rest fully in between.',
  'timeline.phase.pushing.birthingPerson': 'Follow your body and staff guidance. Change positions and conserve energy between contractions.',
  'timeline.phase.pushing.partner': 'Offer physical and verbal support, provide water, and keep focus on one step at a time.',
  'timeline.phase.pushing.callWard': 'This phase is usually managed at hospital or birth unit with staff present.',
  'timeline.phase.pushing.redFlags': 'Heavy bleeding, lack of progress with concerning symptoms, or acute maternal distress.',

  'timeline.phase.placenta.title': 'Placenta delivery (3rd stage)',
  'timeline.phase.placenta.happening': 'After the baby is born, the placenta is delivered, often within about 15 minutes. Many receive an injection in the thigh that helps the uterus contract and reduces heavy bleeding.',
  'timeline.phase.placenta.birthingPerson': 'Stay warm and calm, do skin-to-skin if possible, report dizziness or rising pain quickly.',
  'timeline.phase.placenta.partner': 'Support bonding and keep attention on how the birthing person feels physically.',
  'timeline.phase.placenta.callWard': 'Staff monitor bleeding and uterine tone. Tell them immediately if concerns arise.',
  'timeline.phase.placenta.redFlags': 'Persistent heavy bleeding, fainting, or severe pain.',

  'timeline.phase.goldenHour.title': 'First golden hour',
  'timeline.phase.goldenHour.happening': 'Baby transitions to life outside the womb. Early skin-to-skin and feeding can begin.',
  'timeline.phase.goldenHour.birthingPerson': 'Skin-to-skin, steady breathing, small fluids or snacks, and ask for feeding support if wanted.',
  'timeline.phase.goldenHour.partner': 'Protect calm and privacy, handle practical needs, support early bonding.',
  'timeline.phase.goldenHour.callWard': 'Staff are already present, but report dizziness, fever, or sudden discomfort right away.',
  'timeline.phase.goldenHour.redFlags': 'Heavy bleeding, fever, severe headache, or if baby seems floppy or unresponsive.',

  'timeline.phase.firstDays.title': 'First days',
  'timeline.phase.firstDays.happening': 'Recovery continues, feeding patterns emerge, and the family learns baby cues.',
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
  'oxytocin.home.savedLists': 'Lists on this device',
  'oxytocin.home.open': 'Open',
  'oxytocin.home.empty': 'No saved lists yet.',
  'oxytocin.home.passwordHint': 'Minimum 8 characters',

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

  'admin.pageTitle': 'Admin',
  'admin.title': 'Admin login',
  'admin.code': 'Admin code',
  'admin.login': 'Log in',
  'admin.logout': 'Log out',
  'admin.listTitle': 'Existing lists',
  'admin.createdAt': 'Created',
  'admin.delete': 'Delete list',
  'admin.empty': 'No lists yet.',
  'admin.deleteConfirm': 'Are you sure you want to delete "{title}"?',

  'err.generic': 'Something went wrong. Please try again.',
  'err.passwordTooShort': 'Password must be at least 8 characters.',
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
