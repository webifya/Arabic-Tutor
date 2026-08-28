ALTER TABLE `users`
  ADD COLUMN `display_name` VARCHAR(100) NULL,
  ADD COLUMN `avatar_path` VARCHAR(500) NULL,
  ADD COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  ADD COLUMN `native_language_id` VARCHAR(32) NULL,
  ADD COLUMN `learning_language_id` VARCHAR(32) NULL,
  ADD COLUMN `country` VARCHAR(2) NULL,
  ADD COLUMN `timezone` VARCHAR(100) NOT NULL DEFAULT 'Asia/Dhaka',
  ADD COLUMN `date_of_birth` DATE NULL,
  ADD COLUMN `arabic_level` VARCHAR(32) NULL,
  ADD COLUMN `learning_goal` VARCHAR(32) NULL,
  ADD COLUMN `daily_goal_minutes` INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN `student_mode` VARCHAR(16) NOT NULL DEFAULT 'standard',
  ADD COLUMN `onboarding_state` VARCHAR(32) NOT NULL DEFAULT 'not_started',
  ADD COLUMN `session_version` INTEGER NOT NULL DEFAULT 1,
  ADD INDEX `users_role_status_idx` (`role`,`status`),
  ADD INDEX `users_native_language_id_idx` (`native_language_id`),
  ADD INDEX `users_learning_language_id_idx` (`learning_language_id`),
  ADD CONSTRAINT `users_native_language_id_fkey` FOREIGN KEY (`native_language_id`) REFERENCES `languages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `users_learning_language_id_fkey` FOREIGN KEY (`learning_language_id`) REFERENCES `languages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `auth_accounts` (
  `id` VARCHAR(32) NOT NULL, `user_id` VARCHAR(32) NOT NULL, `type` VARCHAR(32) NOT NULL,
  `provider` VARCHAR(64) NOT NULL, `provider_account_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `auth_accounts_provider_provider_account_id_key` (`provider`,`provider_account_id`),
  INDEX `auth_accounts_user_id_idx` (`user_id`),
  CONSTRAINT `auth_accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `id` VARCHAR(32) NOT NULL, `user_id` VARCHAR(32) NOT NULL, `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL, `used_at` DATETIME(3) NULL, `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `password_reset_tokens_token_hash_key` (`token_hash`),
  INDEX `password_reset_tokens_user_id_expires_at_idx` (`user_id`,`expires_at`),
  CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `verification_tokens` (
  `id` VARCHAR(32) NOT NULL, `identifier` VARCHAR(191) NOT NULL, `token_hash` CHAR(64) NOT NULL,
  `purpose` VARCHAR(32) NOT NULL, `expires_at` DATETIME(3) NOT NULL, `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`),
  UNIQUE INDEX `verification_tokens_token_hash_key` (`token_hash`), INDEX `verification_tokens_identifier_purpose_expires_at_idx` (`identifier`,`purpose`,`expires_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_invitations` (
  `id` VARCHAR(32) NOT NULL, `email` VARCHAR(191) NOT NULL, `role` VARCHAR(32) NOT NULL,
  `token_hash` CHAR(64) NOT NULL, `expires_at` DATETIME(3) NOT NULL, `accepted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`),
  UNIQUE INDEX `user_invitations_token_hash_key` (`token_hash`), INDEX `user_invitations_email_expires_at_idx` (`email`,`expires_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `courses` (
  `id` VARCHAR(32) NOT NULL, `slug` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL, `description` TEXT NULL,
  `source_language_id` VARCHAR(32) NOT NULL, `target_language_id` VARCHAR(32) NOT NULL, `status` VARCHAR(16) NOT NULL DEFAULT 'draft',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `courses_slug_key` (`slug`), INDEX `courses_source_language_id_target_language_id_status_idx` (`source_language_id`,`target_language_id`,`status`),
  CONSTRAINT `courses_source_language_id_fkey` FOREIGN KEY (`source_language_id`) REFERENCES `languages` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `courses_target_language_id_fkey` FOREIGN KEY (`target_language_id`) REFERENCES `languages` (`id`) ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `course_levels` (
  `id` VARCHAR(32) NOT NULL, `course_id` VARCHAR(32) NOT NULL, `slug` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL,
  `position` INTEGER NOT NULL, `status` VARCHAR(16) NOT NULL DEFAULT 'draft', `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`),
  UNIQUE INDEX `course_levels_course_id_slug_key` (`course_id`,`slug`), UNIQUE INDEX `course_levels_course_id_position_key` (`course_id`,`position`),
  CONSTRAINT `course_levels_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `course_units` (
  `id` VARCHAR(32) NOT NULL, `level_id` VARCHAR(32) NOT NULL, `slug` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL,
  `position` INTEGER NOT NULL, `status` VARCHAR(16) NOT NULL DEFAULT 'draft', `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`),
  UNIQUE INDEX `course_units_level_id_slug_key` (`level_id`,`slug`), UNIQUE INDEX `course_units_level_id_position_key` (`level_id`,`position`),
  CONSTRAINT `course_units_level_id_fkey` FOREIGN KEY (`level_id`) REFERENCES `course_levels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lessons` (
  `id` VARCHAR(32) NOT NULL, `unit_id` VARCHAR(32) NOT NULL, `slug` VARCHAR(191) NOT NULL, `title` VARCHAR(191) NOT NULL,
  `position` INTEGER NOT NULL, `status` VARCHAR(16) NOT NULL DEFAULT 'draft', `activity_type` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `lessons_unit_id_slug_key` (`unit_id`,`slug`), UNIQUE INDEX `lessons_unit_id_position_key` (`unit_id`,`position`), INDEX `lessons_status_idx` (`status`),
  CONSTRAINT `lessons_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `course_units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lesson_blocks` (
  `id` VARCHAR(32) NOT NULL, `lesson_id` VARCHAR(32) NOT NULL, `block_type` VARCHAR(64) NOT NULL, `position` INTEGER NOT NULL,
  `schema_version` INTEGER NOT NULL DEFAULT 1, `content` JSON NOT NULL, `status` VARCHAR(16) NOT NULL DEFAULT 'draft',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `lesson_blocks_lesson_id_position_key` (`lesson_id`,`position`), INDEX `lesson_blocks_lesson_id_status_idx` (`lesson_id`,`status`),
  CONSTRAINT `lesson_blocks_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `course_enrollments` (
  `id` VARCHAR(32) NOT NULL, `user_id` VARCHAR(32) NOT NULL, `course_id` VARCHAR(32) NOT NULL, `current_lesson_id` VARCHAR(32) NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'active', `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `completed_at` DATETIME(3) NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`),
  UNIQUE INDEX `course_enrollments_user_id_course_id_key` (`user_id`,`course_id`), INDEX `course_enrollments_course_id_status_idx` (`course_id`,`status`), INDEX `course_enrollments_current_lesson_id_idx` (`current_lesson_id`),
  CONSTRAINT `course_enrollments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_enrollments_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_enrollments_current_lesson_id_fkey` FOREIGN KEY (`current_lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ai_feature_routes` (
  `id` VARCHAR(32) NOT NULL, `feature_key` VARCHAR(100) NOT NULL, `capability` VARCHAR(64) NOT NULL, `provider_id` VARCHAR(32) NULL,
  `model_id` VARCHAR(32) NULL, `voice_profile_id` VARCHAR(32) NULL, `enabled` BOOLEAN NOT NULL DEFAULT true, `timeout_ms` INTEGER NOT NULL DEFAULT 30000,
  `policy` JSON NULL, `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `ai_feature_routes_feature_key_key` (`feature_key`), INDEX `ai_feature_routes_provider_id_idx` (`provider_id`), INDEX `ai_feature_routes_model_id_idx` (`model_id`),
  CONSTRAINT `ai_feature_routes_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ai_feature_routes_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `ai_provider_models` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ai_feature_routes_voice_profile_id_fkey` FOREIGN KEY (`voice_profile_id`) REFERENCES `voice_profiles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ai_feature_route_fallbacks` (
  `id` VARCHAR(32) NOT NULL, `route_id` VARCHAR(32) NOT NULL, `provider_id` VARCHAR(32) NOT NULL, `model_id` VARCHAR(32) NULL, `position` INTEGER NOT NULL, `enabled` BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (`id`), UNIQUE INDEX `ai_feature_route_fallbacks_route_id_position_key` (`route_id`,`position`), UNIQUE INDEX `ai_feature_route_fallbacks_route_id_provider_id_model_id_key` (`route_id`,`provider_id`,`model_id`),
  INDEX `ai_feature_route_fallbacks_provider_id_idx` (`provider_id`), INDEX `ai_feature_route_fallbacks_model_id_idx` (`model_id`),
  CONSTRAINT `ai_feature_route_fallbacks_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `ai_feature_routes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ai_feature_route_fallbacks_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ai_feature_route_fallbacks_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `ai_provider_models` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `voice_profile_assignments` (
  `id` VARCHAR(32) NOT NULL, `voice_profile_id` VARCHAR(32) NOT NULL, `student_mode` VARCHAR(16) NULL, `course_id` VARCHAR(32) NULL,
  `activity_type` VARCHAR(64) NULL, `tts_purpose` VARCHAR(64) NULL, `priority` INTEGER NOT NULL DEFAULT 0, `enabled` BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (`id`), INDEX `voice_profile_assignments_student_mode_course_id_activity_type_tts_purpose_priority_idx` (`student_mode`,`course_id`,`activity_type`,`tts_purpose`,`priority`),
  CONSTRAINT `voice_profile_assignments_voice_profile_id_fkey` FOREIGN KEY (`voice_profile_id`) REFERENCES `voice_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `voice_profile_assignments_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `teaching_styles` (
  `id` VARCHAR(32) NOT NULL, `name` VARCHAR(191) NOT NULL, `student_mode` VARCHAR(16) NULL, `explanation_level` VARCHAR(32) NULL,
  `instructions` TEXT NOT NULL, `encouragement_style` VARCHAR(64) NULL, `enabled` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), INDEX `teaching_styles_student_mode_enabled_idx` (`student_mode`,`enabled`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `media_assets` (
  `id` VARCHAR(32) NOT NULL, `owner_user_id` VARCHAR(32) NULL, `storage_key` VARCHAR(500) NOT NULL, `visibility` VARCHAR(16) NOT NULL,
  `purpose` VARCHAR(64) NOT NULL, `mime_type` VARCHAR(191) NOT NULL, `size_bytes` BIGINT NOT NULL, `checksum` CHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`), UNIQUE INDEX `media_assets_storage_key_key` (`storage_key`), INDEX `media_assets_owner_user_id_purpose_idx` (`owner_user_id`,`purpose`),
  CONSTRAINT `media_assets_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rate_limit_buckets` (
  `key` VARCHAR(191) NOT NULL, `count` INTEGER NOT NULL DEFAULT 0, `window_start` DATETIME(3) NOT NULL, `expires_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (`key`), INDEX `rate_limit_buckets_expires_at_idx` (`expires_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `languages` (`id`,`code`,`name`,`native_name`,`direction`,`enabled`) VALUES
  ('lang_bn','bn','Bengali','বাংলা','ltr',true), ('lang_ar','ar','Arabic','العربية','rtl',true), ('lang_en','en','English','English','ltr',true)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`native_name`=VALUES(`native_name`),`direction`=VALUES(`direction`),`enabled`=true;

INSERT INTO `courses` (`id`,`slug`,`name`,`description`,`source_language_id`,`target_language_id`,`status`)
SELECT 'course_ar_foundation_bn','arabic-foundation-bn','Arabic Foundation for Bangla Speakers','A reusable Bangla-to-Arabic foundation course. Content remains draft until reviewed.',bn.id,ar.id,'draft'
FROM `languages` bn JOIN `languages` ar ON ar.code='ar' WHERE bn.code='bn'
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`source_language_id`=VALUES(`source_language_id`),`target_language_id`=VALUES(`target_language_id`);

UPDATE `users` SET `native_language_id`=(SELECT id FROM `languages` WHERE code='bn' LIMIT 1), `learning_language_id`=(SELECT id FROM `languages` WHERE code='ar' LIMIT 1), `country`='BD', `timezone`='Asia/Dhaka' WHERE `role`='student' AND `native_language_id` IS NULL;
