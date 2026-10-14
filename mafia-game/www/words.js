// Word categories for Imposter mode: { id: { ar: {name, words}, en: {name, words} } }
window.WORDS = {
  food: {
    en: { name: 'Food', words: ['Pizza', 'Falafel', 'Shawarma', 'Koshari', 'Hummus', 'Burger', 'Sushi', 'Pasta', 'Kebab', 'Baklava', 'Omelette', 'Tacos'] },
    ar: { name: 'أكل', words: ['بيتزا', 'فلافل', 'شاورما', 'كشري', 'حمص', 'برجر', 'سوشي', 'مكرونة', 'كباب', 'بقلاوة', 'عجة', 'تاكو'] }
  },
  places: {
    en: { name: 'Places', words: ['Airport', 'Hospital', 'School', 'Beach', 'Mosque', 'Cinema', 'Supermarket', 'Zoo', 'Library', 'Gym', 'Desert', 'Train station'] },
    ar: { name: 'أماكن', words: ['مطار', 'مستشفى', 'مدرسة', 'شاطئ', 'مسجد', 'سينما', 'سوبرماركت', 'حديقة حيوان', 'مكتبة', 'نادي رياضي', 'صحراء', 'محطة قطار'] }
  },
  animals: {
    en: { name: 'Animals', words: ['Camel', 'Lion', 'Dolphin', 'Eagle', 'Horse', 'Penguin', 'Monkey', 'Crocodile', 'Cat', 'Elephant', 'Parrot', 'Fox'] },
    ar: { name: 'حيوانات', words: ['جمل', 'أسد', 'دلفين', 'نسر', 'حصان', 'بطريق', 'قرد', 'تمساح', 'قطة', 'فيل', 'ببغاء', 'ثعلب'] }
  },
  jobs: {
    en: { name: 'Jobs', words: ['Doctor', 'Pilot', 'Teacher', 'Chef', 'Police officer', 'Engineer', 'Farmer', 'Barber', 'Driver', 'Judge', 'Dentist', 'Singer'] },
    ar: { name: 'مهن', words: ['دكتور', 'طيار', 'مدرس', 'طباخ', 'شرطي', 'مهندس', 'فلاح', 'حلاق', 'سائق', 'قاضي', 'دكتور أسنان', 'مغني'] }
  },
  things: {
    en: { name: 'Things', words: ['Mobile phone', 'Umbrella', 'Mirror', 'Key', 'Watch', 'Backpack', 'Candle', 'Remote control', 'Glasses', 'Football', 'Wallet', 'Headphones'] },
    ar: { name: 'أشياء', words: ['موبايل', 'شمسية', 'مراية', 'مفتاح', 'ساعة', 'شنطة', 'شمعة', 'ريموت', 'نظارة', 'كورة', 'محفظة', 'سماعات'] }
  },
  sports: {
    en: { name: 'Sports', words: ['Football', 'Tennis', 'Swimming', 'Boxing', 'Basketball', 'Chess', 'Running', 'Volleyball', 'Karate', 'Cycling', 'Golf', 'Ping pong'] },
    ar: { name: 'رياضة', words: ['كرة قدم', 'تنس', 'سباحة', 'ملاكمة', 'كرة سلة', 'شطرنج', 'جري', 'كرة طائرة', 'كاراتيه', 'دراجات', 'جولف', 'تنس طاولة'] }
  }
};

// Pairs of similar words for the "clueless imposter" variant.
window.PAIRS = {
  food: {
    en: [['Pizza','Lasagna'],['Burger','Sandwich'],['Coffee','Tea'],['Rice','Couscous'],['Shawarma','Kebab'],['Ice cream','Yogurt'],['Apple','Pear'],['Chocolate','Caramel'],['Pancake','Waffle'],['Soup','Stew']],
    ar: [['بيتزا','لازانيا'],['برجر','ساندويتش'],['قهوة','شاي'],['رز','كسكسي'],['شاورما','كباب'],['آيس كريم','زبادي'],['تفاح','كمثرى'],['شوكولاتة','كراميل'],['بان كيك','وافل'],['شوربة','يخنة']]
  },
  places: {
    en: [['Mosque','Church'],['Airport','Train station'],['School','University'],['Beach','Swimming pool'],['Hospital','Pharmacy'],['Cinema','Theatre'],['Mall','Market'],['Desert','Mountain'],['Hotel','Apartment'],['Library','Bookstore']],
    ar: [['مسجد','كنيسة'],['مطار','محطة قطار'],['مدرسة','جامعة'],['شاطئ','مسبح'],['مستشفى','صيدلية'],['سينما','مسرح'],['مول','سوق'],['صحراء','جبل'],['فندق','شقة'],['مكتبة','محل كتب']]
  },
  animals: {
    en: [['Lion','Tiger'],['Dolphin','Shark'],['Camel','Horse'],['Cat','Dog'],['Eagle','Falcon'],['Crocodile','Lizard'],['Monkey','Gorilla'],['Wolf','Fox'],['Rabbit','Mouse'],['Penguin','Seagull']],
    ar: [['أسد','نمر'],['دلفين','قرش'],['جمل','حصان'],['قطة','كلب'],['نسر','صقر'],['تمساح','سحلية'],['قرد','غوريلا'],['ذئب','ثعلب'],['أرنب','فأر'],['بطريق','نورس']]
  },
  jobs: {
    en: [['Doctor','Nurse'],['Teacher','Professor'],['Chef','Baker'],['Pilot','Driver'],['Police officer','Soldier'],['Judge','Lawyer'],['Singer','Actor'],['Engineer','Architect'],['Farmer','Fisherman'],['Barber','Tailor']],
    ar: [['دكتور','ممرض'],['مدرس','أستاذ جامعة'],['طباخ','خباز'],['طيار','سائق'],['شرطي','جندي'],['قاضي','محامي'],['مغني','ممثل'],['مهندس','معماري'],['فلاح','صياد'],['حلاق','خياط']]
  },
  things: {
    en: [['Mobile phone','Tablet'],['Umbrella','Raincoat'],['Mirror','Window'],['Key','Lock'],['Watch','Alarm clock'],['Backpack','Suitcase'],['Candle','Lamp'],['Glasses','Sunglasses'],['Pen','Pencil'],['Towel','Blanket']],
    ar: [['موبايل','تابلت'],['شمسية','معطف مطر'],['مراية','شباك'],['مفتاح','قفل'],['ساعة','منبه'],['شنطة','شنطة سفر'],['شمعة','لمبة'],['نظارة','نظارة شمس'],['قلم حبر','قلم رصاص'],['فوطة','بطانية']]
  },
  sports: {
    en: [['Football','Rugby'],['Tennis','Badminton'],['Swimming','Diving'],['Boxing','Wrestling'],['Basketball','Volleyball'],['Running','Walking'],['Chess','Checkers'],['Golf','Billiards'],['Cycling','Skating'],['Karate','Judo']],
    ar: [['كرة قدم','رجبي'],['تنس','ريشة طائرة'],['سباحة','غطس'],['ملاكمة','مصارعة'],['كرة سلة','كرة طائرة'],['جري','مشي'],['شطرنج','دومينو'],['جولف','بلياردو'],['دراجات','تزلج'],['كاراتيه','جودو']]
  }
};
