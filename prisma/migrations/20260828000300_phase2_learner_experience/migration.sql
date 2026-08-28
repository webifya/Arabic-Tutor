ALTER TABLE `users`
  ADD COLUMN `onboarding_completed_at` DATETIME(3) NULL,
  ADD COLUMN `recommended_starting_point` VARCHAR(64) NULL,
  ADD COLUMN `interface_locale` VARCHAR(8) NOT NULL DEFAULT 'bn';

CREATE TABLE `daily_learning_activities` (
  `id` VARCHAR(32) NOT NULL, `user_id` VARCHAR(32) NOT NULL, `activity_date` DATE NOT NULL,
  `timezone` VARCHAR(100) NOT NULL, `minutes` INTEGER NOT NULL DEFAULT 0,
  `lessons_completed` INTEGER NOT NULL DEFAULT 0, `words_learned` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE INDEX `daily_learning_activities_user_id_activity_date_key` (`user_id`,`activity_date`),
  INDEX `daily_learning_activities_user_id_activity_date_idx` (`user_id`,`activity_date`),
  CONSTRAINT `daily_learning_activities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `xp_transactions` (
  `id` VARCHAR(32) NOT NULL, `user_id` VARCHAR(32) NOT NULL, `amount` INTEGER NOT NULL,
  `reason` VARCHAR(100) NOT NULL, `source_type` VARCHAR(64) NOT NULL, `source_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`),
  UNIQUE INDEX `xp_transactions_user_id_source_type_source_id_reason_key` (`user_id`,`source_type`,`source_id`,`reason`),
  INDEX `xp_transactions_user_id_created_at_idx` (`user_id`,`created_at`),
  CONSTRAINT `xp_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lesson_progress` (
  `id` VARCHAR(32) NOT NULL, `user_id` VARCHAR(32) NOT NULL, `lesson_id` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'not_started', `started_at` DATETIME(3) NULL, `completed_at` DATETIME(3) NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`),
  UNIQUE INDEX `lesson_progress_user_id_lesson_id_key` (`user_id`,`lesson_id`), INDEX `lesson_progress_lesson_id_status_idx` (`lesson_id`,`status`),
  CONSTRAINT `lesson_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lesson_progress_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
