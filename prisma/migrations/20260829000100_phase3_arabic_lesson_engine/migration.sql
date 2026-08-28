ALTER TABLE `lessons`
  ADD COLUMN `completion_rule` JSON NULL,
  ADD COLUMN `xp_reward` INTEGER NOT NULL DEFAULT 10;

ALTER TABLE `lesson_blocks`
  ADD COLUMN `required` BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE `arabic_letters` (
  `id` VARCHAR(32) NOT NULL, `stable_key` VARCHAR(64) NOT NULL, `character` VARCHAR(8) NOT NULL,
  `arabic_name` VARCHAR(64) NOT NULL, `bangla_pronunciation` VARCHAR(191) NOT NULL,
  `english_transliteration` VARCHAR(64) NULL, `bangla_sound_explanation` TEXT NOT NULL,
  `isolated_form` VARCHAR(16) NOT NULL, `initial_form` VARCHAR(16) NULL, `medial_form` VARCHAR(16) NULL, `final_form` VARCHAR(16) NULL,
  `makhraj_region` VARCHAR(64) NOT NULL, `makhraj_subregion` VARCHAR(100) NULL,
  `makhraj_explanation_bn` TEXT NOT NULL, `pronunciation_tip_bn` TEXT NOT NULL, `position` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `arabic_letters_stable_key_key` (`stable_key`), UNIQUE INDEX `arabic_letters_position_key` (`position`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `vocabulary_items` (
  `id` VARCHAR(32) NOT NULL, `stable_key` VARCHAR(100) NOT NULL, `language_id` VARCHAR(32) NOT NULL,
  `word` VARCHAR(191) NOT NULL, `word_with_diacritics` VARCHAR(191) NULL, `bangla_pronunciation` VARCHAR(191) NULL,
  `bangla_meaning` VARCHAR(500) NOT NULL, `english_meaning` VARCHAR(500) NULL, `transliteration` VARCHAR(191) NULL,
  `part_of_speech` VARCHAR(64) NULL, `root` VARCHAR(32) NULL, `difficulty` INTEGER NOT NULL DEFAULT 1, `example_sentence` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `vocabulary_items_stable_key_key` (`stable_key`), INDEX `vocabulary_items_language_id_difficulty_idx` (`language_id`,`difficulty`),
  CONSTRAINT `vocabulary_items_language_id_fkey` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `phrases` (
  `id` VARCHAR(32) NOT NULL, `stable_key` VARCHAR(100) NOT NULL, `language_id` VARCHAR(32) NOT NULL,
  `text` VARCHAR(500) NOT NULL, `text_with_diacritics` VARCHAR(500) NULL, `bangla_pronunciation` VARCHAR(500) NULL,
  `bangla_meaning` VARCHAR(500) NOT NULL, `english_meaning` VARCHAR(500) NULL, `usage_note_bn` TEXT NULL, `difficulty` INTEGER NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `phrases_stable_key_key` (`stable_key`), INDEX `phrases_language_id_difficulty_idx` (`language_id`,`difficulty`),
  CONSTRAINT `phrases_language_id_fkey` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lesson_question_attempts` (
  `id` VARCHAR(32) NOT NULL, `user_id` VARCHAR(32) NOT NULL, `lesson_id` VARCHAR(32) NOT NULL, `block_id` VARCHAR(32) NOT NULL,
  `selected_option_id` VARCHAR(100) NOT NULL, `correct` BOOLEAN NOT NULL, `attempted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), INDEX `lesson_question_attempts_user_id_lesson_id_block_id_correct_idx` (`user_id`,`lesson_id`,`block_id`,`correct`),
  CONSTRAINT `lesson_question_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lesson_question_attempts_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lesson_question_attempts_block_id_fkey` FOREIGN KEY (`block_id`) REFERENCES `lesson_blocks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `arabic_letters` (`id`,`stable_key`,`character`,`arabic_name`,`bangla_pronunciation`,`english_transliteration`,`bangla_sound_explanation`,`isolated_form`,`initial_form`,`medial_form`,`final_form`,`makhraj_region`,`makhraj_subregion`,`makhraj_explanation_bn`,`pronunciation_tip_bn`,`position`) VALUES
('c3_letter_alif','alif','ا','أَلِف','আলিফ','alif','এটি আলিফ। এই পর্যায়ে একে দীর্ঘ আ-ধ্বনির বাহক হিসেবে চিনুন; হামযার স্বতন্ত্র উচ্চারণ পরে শেখানো হবে।','ا','ا','ـا','ـا','oral_cavity','open oral passage','দীর্ঘ স্বর উচ্চারণে মুখের খোলা পথ দিয়ে বাতাস স্বাভাবিকভাবে বের হয়।','অতিরিক্ত টানবেন না; উদাহরণ শুনে দৈর্ঘ্য মিলিয়ে বলা পরে অনুশীলন করা হবে।',1),
('c3_letter_ba','ba','ب','بَاء','বা','bā','দুই ঠোঁট আলতোভাবে মিলিয়ে বাংলা ব-এর কাছাকাছি ধ্বনি হয়।','ب','بـ','ـبـ','ـب','lips','both lips','দুই ঠোঁট মিলিয়ে ছেড়ে দিলে ধ্বনিটি তৈরি হয়।','ঠোঁট শক্ত করে চেপে ধরবেন না।',2),
('c3_letter_ta','ta','ت','تَاء','তা','tā','জিহ্বার আগা ওপরের সামনের দাঁতের গোড়ার কাছাকাছি ছুঁইয়ে হালকা ত-ধ্বনি করুন।','ت','تـ','ـتـ','ـت','tongue','tip near upper incisors','জিহ্বার আগা ওপরের সামনের দাঁতের গোড়ার অংশে লাগে।','বাংলা ট-এর মতো জিহ্বা পেছনে বাঁকাবেন না।',3),
('c3_letter_tha','tha','ث','ثَاء','ছা (আনুমানিক)','thā','এর হুবহু বাংলা ধ্বনি নেই। জিহ্বার আগা ওপর-নিচের সামনের দাঁতের মাঝখানে সামান্য বের করে বাতাস ছাড়ুন; ইংরেজি think-এর th-এর কাছাকাছি।','ث','ثـ','ـثـ','ـث','tongue','tip between incisors','জিহ্বার আগা সামনের দাঁতের কিনারায় বা সামান্য বাইরে থাকে এবং ফাঁক দিয়ে বাতাস যায়।','একে স বা ছ বানাবেন না; জিহ্বার অবস্থান দৃশ্যমান রাখুন।',4),
('c3_letter_jim','jim','ج','جِيم','জীম','jīm','বাংলা জ-এর কাছাকাছি, তবে আরবি উচ্চারণভেদ থাকতে পারে; এই কোর্সে স্পষ্ট মানক জ-ধ্বনি ব্যবহার করা হচ্ছে।','ج','جـ','ـجـ','ـج','tongue','middle of tongue','জিহ্বার মাঝামাঝি অংশ ওপরের তালুর মাঝামাঝি অংশের কাছে উঠে ধ্বনি তৈরি করে।','ধ্বনিটি পরিষ্কার বলুন, অতিরিক্ত শক্ত করবেন না।',5),
('c3_letter_ha','ha','ح','حَاء','হা (গভীর)','ḥā','বাংলায় এর ঠিক সমান ধ্বনি নেই। গলার মাঝামাঝি অংশ থেকে নিঃশ্বাসময়, চাপহীন হ ধ্বনি করুন।','ح','حـ','ـحـ','ـح','throat','middle throat','গলার মাঝের অংশ সংকুচিত না করে বাতাস প্রবাহিত করে ধ্বনিটি হয়।','সাধারণ হ-এর চেয়ে গভীর, কিন্তু খ-এর ঘর্ষণ দেবেন না।',6),
('c3_letter_kha','kha','خ','خَاء','খা','khā','গলার ওপরের দিকে নরম ঘর্ষণসহ খ-ধ্বনি হয়; বাংলা খ-এর চেয়ে ঘর্ষণ বেশি শোনা যেতে পারে।','خ','خـ','ـخـ','ـخ','throat','upper throat near soft palate','গলার ওপরের অংশ ও নরম তালুর কাছাকাছি বাতাসে ঘর্ষণ তৈরি হয়।','গলা ব্যথা হয় এমন জোর দেবেন না।',7),
('c3_letter_dal','dal','د','دَال','দাল','dāl','জিহ্বার আগা ওপরের সামনের দাঁতের গোড়ায় ছুঁইয়ে বাংলা দ-এর কাছাকাছি ধ্বনি করুন।','د','د','ـد','ـد','tongue','tip near upper incisors','জিহ্বার আগা ওপরের সামনের দাঁতের গোড়ার কাছে লাগে।','এটি পরের অক্ষরের সঙ্গে বাম দিকে যুক্ত হয় না—রূপগুলো লক্ষ্য করুন।',8),
('c3_letter_dhal','dhal','ذ','ذَال','যাল (আনুমানিক)','dhāl','এর হুবহু বাংলা ধ্বনি নেই। জিহ্বার আগা দাঁতের মাঝখানে রেখে কণ্ঠস্বরসহ ইংরেজি this-এর th-এর কাছাকাছি বলুন।','ذ','ذ','ـذ','ـذ','tongue','tip between incisors','জিহ্বার আগা সামনের দাঁতের কিনারায় থাকে; ث-এর মতো বাতাস যায়, তবে কণ্ঠস্বর যুক্ত থাকে।','একে জ বা য বানাবেন না; দাঁত-জিহ্বার অবস্থান ধরে রাখুন।',9),
('c3_letter_ra','ra','ر','رَاء','রা','rā','জিহ্বার আগা ওপরের মাড়ির কাছে খুব সংক্ষিপ্ত স্পর্শ করে র-ধ্বনি তৈরি করে।','ر','ر','ـر','ـر','tongue','tip near alveolar ridge','জিহ্বার আগা ওপরের সামনের দাঁতের পেছনের মাড়ির কাছে লাগে।','অতিরিক্ত কাঁপাবেন না; একটি হালকা স্পর্শ দিয়ে শুরু করুন।',10)
ON DUPLICATE KEY UPDATE `character`=VALUES(`character`),`arabic_name`=VALUES(`arabic_name`),`bangla_pronunciation`=VALUES(`bangla_pronunciation`),`bangla_sound_explanation`=VALUES(`bangla_sound_explanation`),`pronunciation_tip_bn`=VALUES(`pronunciation_tip_bn`);

INSERT INTO `vocabulary_items` (`id`,`stable_key`,`language_id`,`word`,`word_with_diacritics`,`bangla_pronunciation`,`bangla_meaning`,`english_meaning`,`transliteration`,`part_of_speech`,`root`,`difficulty`,`example_sentence`) VALUES
('c3_vocab_bab','bab','lang_ar','باب','بَاب','বাব','দরজা','door','bāb','noun','ب و ب',1,'هٰذَا بَابٌ'),
('c3_vocab_tuffah','tuffah','lang_ar','تفاح','تُفَّاح','তুফ্ফাহ','আপেল','apple','tuffāḥ','noun',NULL,1,'هٰذَا تُفَّاحٌ'),
('c3_vocab_jamal','jamal','lang_ar','جمل','جَمَل','জামাল','উট','camel','jamal','noun','ج م ل',1,'هٰذَا جَمَلٌ'),
('c3_vocab_khubz','khubz','lang_ar','خبز','خُبْز','খুব্‌জ','রুটি','bread','khubz','noun','خ ب ز',1,'أُحِبُّ الْخُبْزَ'),
('c3_vocab_shukran','shukran','lang_ar','شكرا','شُكْرًا','শুকরান','ধন্যবাদ','thank you','shukran','expression','ش ك ر',1,'شُكْرًا لَكَ')
ON DUPLICATE KEY UPDATE `word`=VALUES(`word`),`word_with_diacritics`=VALUES(`word_with_diacritics`),`bangla_meaning`=VALUES(`bangla_meaning`),`example_sentence`=VALUES(`example_sentence`);

INSERT INTO `phrases` (`id`,`stable_key`,`language_id`,`text`,`text_with_diacritics`,`bangla_pronunciation`,`bangla_meaning`,`english_meaning`,`usage_note_bn`,`difficulty`) VALUES
('c3_phrase_salam','salam','lang_ar','السلام عليكم','السَّلَامُ عَلَيْكُمْ','আস্-সালামু আলাইকুম','আপনার/আপনাদের ওপর শান্তি বর্ষিত হোক','Peace be upon you','মুসলিমদের বহুল ব্যবহৃত অভিবাদন। বাংলা লেখা কেবল কাছাকাছি নির্দেশনা; আরবি শুনে উচ্চারণ শিখুন।',1),
('c3_phrase_reply','salam-reply','lang_ar','وعليكم السلام','وَعَلَيْكُمُ السَّلَامُ','ওয়া আলাইকুমুস্-সালাম','আপনার/আপনাদের ওপরও শান্তি বর্ষিত হোক','And peace be upon you','সালামের উত্তরে বলা হয়।',1),
('c3_phrase_marhaban','marhaban','lang_ar','مرحبا','مَرْحَبًا','মারহাবান','স্বাগতম / হ্যালো','Hello / welcome','বন্ধুত্বপূর্ণ সাধারণ অভিবাদন।',1),
('c3_phrase_kayfa','kayfa-haluk','lang_ar','كيف حالك؟','كَيْفَ حَالُكَ؟','কাইফা হালুকা?','আপনি কেমন আছেন?','How are you?','এখানে পুরুষকে সম্বোধনের প্রচলিত রূপ দেখানো হয়েছে; অন্য রূপ পরে আসবে।',1),
('c3_phrase_bikhayr','ana-bikhayr','lang_ar','أنا بخير','أَنَا بِخَيْرٍ','আনা বিখাইরিন','আমি ভালো আছি','I am well','কেমন আছেন—এর সহজ উত্তর। শেষের ধ্বনি কথ্য ব্যবহারে হালকা হতে পারে।',1),
('c3_phrase_shukran','shukran','lang_ar','شكرا','شُكْرًا','শুকরান','ধন্যবাদ','Thank you','কৃতজ্ঞতা প্রকাশে ব্যবহার করুন।',1)
ON DUPLICATE KEY UPDATE `text`=VALUES(`text`),`text_with_diacritics`=VALUES(`text_with_diacritics`),`bangla_meaning`=VALUES(`bangla_meaning`),`usage_note_bn`=VALUES(`usage_note_bn`);

UPDATE `courses` SET `name`='আরবি ভাষার ভিত্তি',`description`='বাংলাভাষী শিক্ষার্থীদের জন্য অক্ষর, হারাকাত ও প্রথম কথোপকথনের পথ।',`status`='published' WHERE `slug`='arabic-foundation-bn';

INSERT INTO `course_levels` (`id`,`course_id`,`slug`,`name`,`position`,`status`) VALUES
('c3_level_1','course_ar_foundation_bn','arabic-foundations','লেভেল ১ — আরবি ভাষার ভিত্তি',1,'published')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`position`=VALUES(`position`),`status`='published';

INSERT INTO `course_units` (`id`,`level_id`,`slug`,`name`,`position`,`status`) VALUES
('c3_unit_1','c3_level_1','first-letters','ইউনিট ১ — প্রথম আরবি অক্ষর',1,'published'),
('c3_unit_2','c3_level_1','more-sounds','ইউনিট ২ — আরও কিছু ধ্বনি',2,'published'),
('c3_unit_3','c3_level_1','first-harakat','ইউনিট ৩ — প্রথম হারাকাত',3,'published'),
('c3_unit_4','c3_level_1','first-greetings','ইউনিট ৪ — প্রথম অভিবাদন',4,'published')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`position`=VALUES(`position`),`status`='published';

INSERT INTO `lessons` (`id`,`unit_id`,`slug`,`title`,`position`,`status`,`activity_type`,`completion_rule`,`xp_reward`) VALUES
('c3_l01','c3_unit_1','writing-introduction','আরবি লেখা: প্রথম পরিচয়',1,'published','lesson',JSON_OBJECT('mode','required_questions'),10),
('c3_l02','c3_unit_1','letter-alif','অক্ষর ا — আলিফ',2,'published','letter',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l03','c3_unit_1','letter-ba','অক্ষর ب — বা',3,'published','letter',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l04','c3_unit_1','letter-ta','অক্ষর ت — তা',4,'published','letter',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l05','c3_unit_1','letter-tha','অক্ষর ث — ছা',5,'published','letter',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l06','c3_unit_1','letter-jim','অক্ষর ج — জীম',6,'published','letter',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l07','c3_unit_2','letter-ha','অক্ষর ح — হা',1,'published','letter',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l08','c3_unit_2','letter-kha','অক্ষর خ — খা',2,'published','letter',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l09','c3_unit_2','letter-dal','অক্ষর د — দাল',3,'published','letter',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l10','c3_unit_2','letter-dhal','অক্ষর ذ — যাল',4,'published','letter',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l11','c3_unit_2','letter-ra','অক্ষর ر — রা',5,'published','letter',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l12','c3_unit_3','fatha','ফাতহা — ছোট আ-ধ্বনি',1,'published','reading',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l13','c3_unit_3','kasra','কাসরা — ছোট ই-ধ্বনি',2,'published','reading',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l14','c3_unit_3','damma','দাম্মা — ছোট উ-ধ্বনি',3,'published','reading',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l15','c3_unit_4','salam','সালাম দেওয়া ও উত্তর',1,'published','phrase',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l16','c3_unit_4','hello','মারহাবান — হ্যালো',2,'published','phrase',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l17','c3_unit_4','how-are-you','আপনি কেমন আছেন?',3,'published','phrase',JSON_OBJECT('mode','view_required_blocks'),10),
('c3_l18','c3_unit_4','thanks','শুকরান — ধন্যবাদ',4,'published','phrase',JSON_OBJECT('mode','view_required_blocks'),10)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`),`position`=VALUES(`position`),`status`='published',`completion_rule`=VALUES(`completion_rule`),`xp_reward`=VALUES(`xp_reward`);

INSERT INTO `lesson_blocks` (`id`,`lesson_id`,`block_type`,`position`,`schema_version`,`required`,`content`,`status`) VALUES
('c3_b0101','c3_l01','heading',1,1,true,JSON_OBJECT('text','আরবি ডান দিক থেকে বাম দিকে লেখা ও পড়া হয়'), 'published'),
('c3_b0102','c3_l01','explanation',2,1,true,JSON_OBJECT('body','বাংলা ইন্টারফেস বাম থেকে ডানে থাকবে, কিন্তু প্রতিটি আরবি শব্দ তার নিজস্ব ডান-থেকে-বাম অংশে দেখা যাবে। অক্ষরের ওপর-নিচের ছোট চিহ্ন উচ্চারণে সাহায্য করে।'), 'published'),
('c3_b0103','c3_l01','arabic_text',3,1,true,JSON_OBJECT('text','ا ب ت ث ج','size','xl','label','ডান দিক থেকে অক্ষরগুলো লক্ষ্য করুন'), 'published'),
('c3_b0104','c3_l01','tip',4,1,false,JSON_OBJECT('title','মনে রাখুন','body','বাংলা হরফে লেখা উচ্চারণ কেবল সহায়ক। আরবির সব ধ্বনি বাংলায় ঠিকভাবে লেখা যায় না।'), 'published'),
('c3_b0105','c3_l01','multiple_choice',5,1,true,JSON_OBJECT('prompt','আরবি সাধারণত কোন দিক থেকে পড়া হয়?','options',JSON_ARRAY(JSON_OBJECT('id','left','label','বাম থেকে ডানে'),JSON_OBJECT('id','right','label','ডান থেকে বামে'),JSON_OBJECT('id','top','label','ওপর থেকে নিচে')),'correctOptionId','right','explanation','ঠিক—আরবি ডান দিক থেকে বাম দিকে পড়া হয়।'), 'published'),
('c3_b0106','c3_l01','continue',6,1,true,JSON_OBJECT('label','পাঠ সম্পন্ন করুন'), 'published'),
('c3_b0201','c3_l02','heading',1,1,true,JSON_OBJECT('text','আলিফ চিনুন'), 'published'),
('c3_b0202','c3_l02','arabic_text',2,1,true,JSON_OBJECT('letterKey','alif','exampleWordKey','bab'), 'published'),
('c3_b0203','c3_l02','audio_placeholder',3,1,false,JSON_OBJECT('label','আলিফের উচ্চারণ শুনুন'), 'published'),
('c3_b0204','c3_l02','pronunciation_placeholder',4,1,false,JSON_OBJECT('label','নিজে বলে অনুশীলন'), 'published'),
('c3_b0205','c3_l02','continue',5,1,true,JSON_OBJECT('label','পরের অক্ষরে যান'), 'published'),
('c3_b0301','c3_l03','heading',1,1,true,JSON_OBJECT('text','বা চিনুন'), 'published'),('c3_b0302','c3_l03','arabic_text',2,1,true,JSON_OBJECT('letterKey','ba','exampleWordKey','bab'), 'published'),('c3_b0303','c3_l03','continue',3,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b0401','c3_l04','heading',1,1,true,JSON_OBJECT('text','তা চিনুন'), 'published'),('c3_b0402','c3_l04','arabic_text',2,1,true,JSON_OBJECT('letterKey','ta','exampleWordKey','tuffah'), 'published'),('c3_b0403','c3_l04','continue',3,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b0501','c3_l05','heading',1,1,true,JSON_OBJECT('text','ছা চিনুন—বাংলায় ঠিক সমান ধ্বনি নেই'), 'published'),('c3_b0502','c3_l05','arabic_text',2,1,true,JSON_OBJECT('letterKey','tha'), 'published'),('c3_b0503','c3_l05','tip',3,1,true,JSON_OBJECT('title','জিহ্বার অবস্থান','body','জিহ্বার আগা সামনের দাঁতের মাঝখানে সামান্য রেখে বাতাস ছাড়ুন। একে স বা ছ বানাবেন না।'), 'published'),('c3_b0504','c3_l05','continue',4,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b0601','c3_l06','heading',1,1,true,JSON_OBJECT('text','জীম চিনুন'), 'published'),('c3_b0602','c3_l06','arabic_text',2,1,true,JSON_OBJECT('letterKey','jim','exampleWordKey','jamal'), 'published'),('c3_b0603','c3_l06','continue',3,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b0701','c3_l07','heading',1,1,true,JSON_OBJECT('text','হা চিনুন'), 'published'),('c3_b0702','c3_l07','arabic_text',2,1,true,JSON_OBJECT('letterKey','ha'), 'published'),('c3_b0703','c3_l07','pronunciation_placeholder',3,1,false,JSON_OBJECT('label','গলার ধ্বনি অনুশীলন'), 'published'),('c3_b0704','c3_l07','continue',4,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b0801','c3_l08','heading',1,1,true,JSON_OBJECT('text','খা চিনুন'), 'published'),('c3_b0802','c3_l08','arabic_text',2,1,true,JSON_OBJECT('letterKey','kha','exampleWordKey','khubz'), 'published'),('c3_b0803','c3_l08','continue',3,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b0901','c3_l09','heading',1,1,true,JSON_OBJECT('text','দাল চিনুন'), 'published'),('c3_b0902','c3_l09','arabic_text',2,1,true,JSON_OBJECT('letterKey','dal'), 'published'),('c3_b0903','c3_l09','continue',3,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b1001','c3_l10','heading',1,1,true,JSON_OBJECT('text','যাল চিনুন—কণ্ঠস্বরসহ দাঁতের ধ্বনি'), 'published'),('c3_b1002','c3_l10','arabic_text',2,1,true,JSON_OBJECT('letterKey','dhal'), 'published'),('c3_b1003','c3_l10','continue',3,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b1101','c3_l11','heading',1,1,true,JSON_OBJECT('text','রা চিনুন'), 'published'),('c3_b1102','c3_l11','arabic_text',2,1,true,JSON_OBJECT('letterKey','ra'), 'published'),('c3_b1103','c3_l11','continue',3,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b1201','c3_l12','heading',1,1,true,JSON_OBJECT('text','ফাতহা: অক্ষরের ওপরে ছোট দাগ'), 'published'),('c3_b1202','c3_l12','arabic_text',2,1,true,JSON_OBJECT('text','بَ','size','hero','label','বা-এর সঙ্গে ফাতহা: বা'), 'published'),('c3_b1203','c3_l12','explanation',3,1,true,JSON_OBJECT('body','ফাতহা অক্ষরের ওপরে বসে ছোট আ-ধ্বনি দেয়। এখন بَ ধীরে বলুন: বা। এটি দীর্ঘ আ নয়।'), 'published'),('c3_b1204','c3_l12','continue',4,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b1301','c3_l13','heading',1,1,true,JSON_OBJECT('text','কাসরা: অক্ষরের নিচে ছোট দাগ'), 'published'),('c3_b1302','c3_l13','arabic_text',2,1,true,JSON_OBJECT('text','بِ','size','hero','label','বা-এর সঙ্গে কাসরা: বি'), 'published'),('c3_b1303','c3_l13','explanation',3,1,true,JSON_OBJECT('body','কাসরা অক্ষরের নিচে বসে ছোট ই-ধ্বনি দেয়। بِ বলুন: বি।'), 'published'),('c3_b1304','c3_l13','continue',4,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b1401','c3_l14','heading',1,1,true,JSON_OBJECT('text','দাম্মা: অক্ষরের ওপরে ছোট বাঁক'), 'published'),('c3_b1402','c3_l14','arabic_text',2,1,true,JSON_OBJECT('text','بُ','size','hero','label','বা-এর সঙ্গে দাম্মা: বু'), 'published'),('c3_b1403','c3_l14','explanation',3,1,true,JSON_OBJECT('body','দাম্মা অক্ষরের ওপরে বসে ছোট উ-ধ্বনি দেয়। بُ বলুন: বু।'), 'published'),('c3_b1404','c3_l14','tip',4,1,false,JSON_OBJECT('title','পরে শিখবেন','body','সুকুন, শাদ্দা ও তানউইন পরের ধাপের বিষয়। এখন তিনটি ছোট স্বর পরিষ্কার করুন।'), 'published'),('c3_b1405','c3_l14','continue',5,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b1501','c3_l15','heading',1,1,true,JSON_OBJECT('text','সালাম ও তার উত্তর'), 'published'),('c3_b1502','c3_l15','phrase',2,1,true,JSON_OBJECT('phraseKeys',JSON_ARRAY('salam','salam-reply')), 'published'),('c3_b1503','c3_l15','continue',3,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b1601','c3_l16','heading',1,1,true,JSON_OBJECT('text','বন্ধুত্বপূর্ণ অভিবাদন'), 'published'),('c3_b1602','c3_l16','phrase',2,1,true,JSON_OBJECT('phraseKeys',JSON_ARRAY('marhaban')), 'published'),('c3_b1603','c3_l16','continue',3,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b1701','c3_l17','heading',1,1,true,JSON_OBJECT('text','কেমন আছেন—প্রশ্ন ও উত্তর'), 'published'),('c3_b1702','c3_l17','phrase',2,1,true,JSON_OBJECT('phraseKeys',JSON_ARRAY('kayfa-haluk','ana-bikhayr')), 'published'),('c3_b1703','c3_l17','continue',3,1,true,JSON_OBJECT('label','চালিয়ে যান'), 'published'),
('c3_b1801','c3_l18','heading',1,1,true,JSON_OBJECT('text','ধন্যবাদ বলুন'), 'published'),('c3_b1802','c3_l18','phrase',2,1,true,JSON_OBJECT('phraseKeys',JSON_ARRAY('shukran')), 'published'),('c3_b1803','c3_l18','vocabulary',3,1,false,JSON_OBJECT('vocabularyKeys',JSON_ARRAY('shukran')), 'published'),('c3_b1804','c3_l18','continue',4,1,true,JSON_OBJECT('label','পাঠ সম্পন্ন করুন'), 'published')
ON DUPLICATE KEY UPDATE `block_type`=VALUES(`block_type`),`position`=VALUES(`position`),`schema_version`=VALUES(`schema_version`),`required`=VALUES(`required`),`content`=VALUES(`content`),`status`='published';

UPDATE `course_enrollments` e
JOIN `courses` c ON c.id=e.course_id AND c.slug='arabic-foundation-bn'
SET e.current_lesson_id=COALESCE(e.current_lesson_id,'c3_l01')
WHERE e.status='active';
