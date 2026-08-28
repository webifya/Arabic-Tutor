ALTER TABLE `lesson_progress` ADD COLUMN `score_percent` INTEGER NULL;
ALTER TABLE `daily_learning_activities` ADD COLUMN `exercise_attempts` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `exercises` (
  `id` VARCHAR(32) NOT NULL, `stable_key` VARCHAR(100) NOT NULL, `lesson_id` VARCHAR(32) NOT NULL, `block_id` VARCHAR(32) NULL,
  `exercise_type` VARCHAR(64) NOT NULL, `prompt` TEXT NOT NULL, `source_language_id` VARCHAR(32) NULL, `target_language_id` VARCHAR(32) NULL,
  `difficulty` INTEGER NOT NULL DEFAULT 1, `required` BOOLEAN NOT NULL DEFAULT true, `position` INTEGER NOT NULL,
  `scoring_config` JSON NOT NULL, `retry_config` JSON NOT NULL, `payload` JSON NOT NULL, `status` VARCHAR(16) NOT NULL DEFAULT 'draft',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `exercises_stable_key_key` (`stable_key`), UNIQUE INDEX `exercises_lesson_id_position_key` (`lesson_id`,`position`),
  INDEX `exercises_lesson_id_status_required_idx` (`lesson_id`,`status`,`required`), INDEX `exercises_block_id_idx` (`block_id`),
  CONSTRAINT `exercises_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exercises_block_id_fkey` FOREIGN KEY (`block_id`) REFERENCES `lesson_blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `exercises_source_language_id_fkey` FOREIGN KEY (`source_language_id`) REFERENCES `languages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `exercises_target_language_id_fkey` FOREIGN KEY (`target_language_id`) REFERENCES `languages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `exercise_attempts` (
  `id` VARCHAR(32) NOT NULL, `user_id` VARCHAR(32) NOT NULL, `exercise_id` VARCHAR(32) NOT NULL, `request_id` VARCHAR(64) NOT NULL,
  `attempt_number` INTEGER NOT NULL, `submitted_response` JSON NOT NULL, `normalized_response` JSON NULL,
  `correct` BOOLEAN NOT NULL, `score` INTEGER NOT NULL, `started_at` DATETIME(3) NULL, `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `duration_ms` INTEGER NULL,
  PRIMARY KEY (`id`), UNIQUE INDEX `exercise_attempts_user_id_request_id_key` (`user_id`,`request_id`),
  UNIQUE INDEX `exercise_attempts_user_id_exercise_id_attempt_number_key` (`user_id`,`exercise_id`,`attempt_number`),
  INDEX `exercise_attempts_user_id_exercise_id_submitted_at_idx` (`user_id`,`exercise_id`,`submitted_at`),
  CONSTRAINT `exercise_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exercise_attempts_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `exercise_review_signals` (
  `id` VARCHAR(32) NOT NULL, `user_id` VARCHAR(32) NOT NULL, `exercise_id` VARCHAR(32) NOT NULL,
  `attempts_count` INTEGER NOT NULL DEFAULT 0, `correct_count` INTEGER NOT NULL DEFAULT 0, `consecutive_correct` INTEGER NOT NULL DEFAULT 0,
  `first_correct_at` DATETIME(3) NULL, `last_attempted_at` DATETIME(3) NOT NULL, `needs_review` BOOLEAN NOT NULL DEFAULT false,
  `difficulty_signal` INTEGER NOT NULL DEFAULT 0, `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `exercise_review_signals_user_id_exercise_id_key` (`user_id`,`exercise_id`),
  INDEX `exercise_review_signals_user_id_needs_review_last_attempted_at_idx` (`user_id`,`needs_review`,`last_attempted_at`),
  CONSTRAINT `exercise_review_signals_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exercise_review_signals_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE `lesson_blocks` SET `block_type`='exercise',`content`=JSON_OBJECT('exerciseKey','intro-reading-direction') WHERE `id`='c3_b0105';
UPDATE `lessons` SET `completion_rule`=JSON_OBJECT('requiredBlocksViewed',true,'requiredExercisesAttempted',true,'requiredExercisesCorrect',true,'minimumScorePercent',100) WHERE `id`='c3_l01';
UPDATE `lessons` SET `completion_rule`=JSON_OBJECT('requiredBlocksViewed',true,'requiredExercisesAttempted',true,'requiredExercisesCorrect',true,'minimumScorePercent',100) WHERE `id` IN ('c3_l03','c3_l04','c3_l14','c3_l15','c3_l18');

UPDATE `lesson_blocks` SET `position`=4 WHERE `id` IN ('c3_b0303','c3_b0403','c3_b1603');
UPDATE `lesson_blocks` SET `position`=6 WHERE `id` IN ('c3_b1405','c3_b1503');
UPDATE `lesson_blocks` SET `position`=5 WHERE `id`='c3_b1804';
INSERT INTO `lesson_blocks` (`id`,`lesson_id`,`block_type`,`position`,`schema_version`,`required`,`content`,`status`) VALUES
('c4_b0205','c3_l02','exercise',5,1,false,JSON_OBJECT('exerciseKey','alif-flashcard'),'published'),('c4_b0206','c3_l02','exercise',6,1,false,JSON_OBJECT('exerciseKey','alif-read-aloud'),'published'),
('c4_b0303','c3_l03','exercise',3,1,true,JSON_OBJECT('exerciseKey','ba-fill-blank'),'published'),('c4_b0403','c3_l04','exercise',3,1,true,JSON_OBJECT('exerciseKey','ta-tha-matching'),'published'),
('c4_b1405','c3_l14','exercise',5,1,true,JSON_OBJECT('exerciseKey','harakat-matching'),'published'),('c4_b1503','c3_l15','exercise',3,1,true,JSON_OBJECT('exerciseKey','salam-reorder'),'published'),
('c4_b1504','c3_l15','exercise',4,1,false,JSON_OBJECT('exerciseKey','salam-listen-type'),'published'),('c4_b1505','c3_l15','exercise',5,1,false,JSON_OBJECT('exerciseKey','salam-speak'),'published'),
('c4_b1603','c3_l16','exercise',3,1,false,JSON_OBJECT('exerciseKey','marhaban-listen-select'),'published'),('c4_b1804','c3_l18','exercise',4,1,true,JSON_OBJECT('exerciseKey','shukran-translation'),'published')
ON DUPLICATE KEY UPDATE `position`=VALUES(`position`),`required`=VALUES(`required`),`content`=VALUES(`content`),`status`='published';

INSERT INTO `exercises` (`id`,`stable_key`,`lesson_id`,`block_id`,`exercise_type`,`prompt`,`source_language_id`,`target_language_id`,`difficulty`,`required`,`position`,`scoring_config`,`retry_config`,`payload`,`status`) VALUES
('c4_ex_01','intro-reading-direction','c3_l01','c3_b0105','multiple_choice','আরবি সাধারণত কোন দিক থেকে পড়া হয়?','lang_bn','lang_ar',1,true,1,JSON_OBJECT('maxScore',100),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',true),JSON_OBJECT('options',JSON_ARRAY(JSON_OBJECT('id','left','label','বাম থেকে ডানে'),JSON_OBJECT('id','right','label','ডান থেকে বামে'),JSON_OBJECT('id','top','label','ওপর থেকে নিচে')),'correctOptionId','right','explanationBn','ঠিক—আরবি ডান দিক থেকে বাম দিকে পড়া হয়।','explanationEn','Correct—Arabic is read from right to left.'),'published'),
('c4_ex_02','alif-flashcard','c3_l02','c4_b0205','flashcard_check','অক্ষরটি মনে আছে?','lang_ar','lang_bn',1,false,1,JSON_OBJECT('maxScore',100),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',false),JSON_OBJECT('front','ا','backBn','আলিফ','backEn','Alif'),'published'),
('c4_ex_03','ba-fill-blank','c3_l03','c4_b0303','fill_blank','শূন্যস্থানে সঠিক অক্ষর লিখুন: ب_ت','lang_ar','lang_ar',1,true,1,JSON_OBJECT('maxScore',100,'diacritics','required','caseFold',false),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',true),JSON_OBJECT('acceptedAnswers',JSON_ARRAY('ي'),'expectedDisplay','ي'),'published'),
('c4_ex_04','ta-tha-matching','c3_l04','c4_b0403','matching','অক্ষরের সঙ্গে সহায়ক উচ্চারণ নির্দেশনা মিলান।','lang_ar','lang_bn',1,true,1,JSON_OBJECT('maxScore',100),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',true),JSON_OBJECT('pairs',JSON_ARRAY(JSON_OBJECT('id','ta','left','ت','right','তা-এর কাছাকাছি'),JSON_OBJECT('id','tha','left','ث','right','বাংলায় ঠিক সমান ধ্বনি নেই'))),'published'),
('c4_ex_05','harakat-matching','c3_l14','c4_b1405','matching','হারাকাতের সঙ্গে ছোট স্বরধ্বনি মিলান।','lang_ar','lang_bn',1,true,1,JSON_OBJECT('maxScore',100),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',true),JSON_OBJECT('pairs',JSON_ARRAY(JSON_OBJECT('id','fatha','left','بَ','right','ছোট আ'),JSON_OBJECT('id','kasra','left','بِ','right','ছোট ই'),JSON_OBJECT('id','damma','left','بُ','right','ছোট উ'))),'published'),
('c4_ex_06','salam-reorder','c3_l15','c4_b1503','reorder','শব্দগুলো সাজিয়ে সালাম তৈরি করুন।','lang_ar','lang_ar',1,true,1,JSON_OBJECT('maxScore',100),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',true),JSON_OBJECT('tokens',JSON_ARRAY(JSON_OBJECT('id','peace','label','السَّلَامُ'),JSON_OBJECT('id','upon','label','عَلَيْكُمْ')),'correctOrder',JSON_ARRAY('peace','upon')),'published'),
('c4_ex_07','shukran-translation','c3_l18','c4_b1804','translation','شُكْرًا-এর বাংলা অর্থ লিখুন।','lang_ar','lang_bn',1,true,1,JSON_OBJECT('maxScore',100,'diacritics','required','caseFold',true),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',true),JSON_OBJECT('acceptedAnswers',JSON_ARRAY('ধন্যবাদ'),'expectedDisplay','ধন্যবাদ'),'published'),
('c4_ex_08','marhaban-listen-select','c3_l16','c4_b1603','listen_select','শুনে সঠিক অর্থ বেছে নিন।','lang_ar','lang_bn',1,false,1,JSON_OBJECT('maxScore',100),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',false),JSON_OBJECT('audioAssetId',NULL,'options',JSON_ARRAY(JSON_OBJECT('id','hello','label','হ্যালো'),JSON_OBJECT('id','thanks','label','ধন্যবাদ')),'correctOptionId','hello'),'published'),
('c4_ex_09','salam-listen-type','c3_l15','c4_b1504','listen_type','যা শুনছেন তা লিখুন।','lang_ar','lang_ar',1,false,2,JSON_OBJECT('maxScore',100,'diacritics','optional','caseFold',false),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',false),JSON_OBJECT('audioAssetId',NULL,'acceptedAnswers',JSON_ARRAY('السلام عليكم','السَّلَامُ عَلَيْكُمْ')),'published'),
('c4_ex_10','alif-read-aloud','c3_l02','c4_b0206','read_aloud_placeholder','অক্ষরটি পড়ে বলুন।','lang_ar','lang_ar',1,false,2,JSON_OBJECT('maxScore',100),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',false),JSON_OBJECT('available',false),'published'),
('c4_ex_11','salam-speak','c3_l15','c4_b1505','speak_placeholder','সালাম বলে অনুশীলন করুন।','lang_ar','lang_ar',1,false,3,JSON_OBJECT('maxScore',100),JSON_OBJECT('mode','unlimited','mustCorrectToContinue',false),JSON_OBJECT('available',false),'published')
ON DUPLICATE KEY UPDATE `prompt`=VALUES(`prompt`),`required`=VALUES(`required`),`position`=VALUES(`position`),`scoring_config`=VALUES(`scoring_config`),`retry_config`=VALUES(`retry_config`),`payload`=VALUES(`payload`),`status`='published';

INSERT INTO `exercise_attempts` (`id`,`user_id`,`exercise_id`,`request_id`,`attempt_number`,`submitted_response`,`normalized_response`,`correct`,`score`,`submitted_at`)
SELECT a.id,a.user_id,'c4_ex_01',CONCAT('legacy-',a.id),ROW_NUMBER() OVER (PARTITION BY a.user_id ORDER BY a.attempted_at,a.id),JSON_OBJECT('selectedOptionId',a.selected_option_id),JSON_OBJECT('selectedOptionId',a.selected_option_id),a.correct,IF(a.correct,100,0),a.attempted_at
FROM `lesson_question_attempts` a WHERE a.block_id='c3_b0105';

INSERT INTO `exercise_review_signals` (`id`,`user_id`,`exercise_id`,`attempts_count`,`correct_count`,`consecutive_correct`,`first_correct_at`,`last_attempted_at`,`needs_review`,`difficulty_signal`)
SELECT LOWER(REPLACE(UUID(),'-','')),user_id,'c4_ex_01',COUNT(*),SUM(correct),IF(MAX(correct)=1,1,0),MIN(IF(correct,submitted_at,NULL)),MAX(submitted_at),IF(SUM(correct)=0,true,false),IF(SUM(correct)=0,1,0)
FROM `exercise_attempts` WHERE exercise_id='c4_ex_01' GROUP BY user_id;

DROP TABLE `lesson_question_attempts`;
