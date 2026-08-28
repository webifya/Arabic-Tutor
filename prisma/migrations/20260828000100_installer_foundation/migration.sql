CREATE TABLE `app_settings` (
  `key` VARCHAR(191) NOT NULL,
  `value` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `languages` (
  `id` VARCHAR(32) NOT NULL,
  `code` VARCHAR(16) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `native_name` VARCHAR(100) NOT NULL,
  `direction` VARCHAR(3) NOT NULL DEFAULT 'ltr',
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `languages_code_key` (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` VARCHAR(32) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `full_name` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'student',
  `email_verified_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ai_providers` (
  `id` VARCHAR(32) NOT NULL,
  `adapter_key` VARCHAR(64) NOT NULL,
  `display_name` VARCHAR(191) NOT NULL,
  `base_url` VARCHAR(500) NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ai_provider_credentials` (
  `id` VARCHAR(32) NOT NULL,
  `provider_id` VARCHAR(32) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `encrypted_envelope` JSON NOT NULL,
  `key_version` INTEGER NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `rotated_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `ai_provider_credentials_provider_id_idx` (`provider_id`),
  CONSTRAINT `ai_provider_credentials_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ai_provider_models` (
  `id` VARCHAR(32) NOT NULL,
  `provider_id` VARCHAR(32) NOT NULL,
  `provider_model_id` VARCHAR(191) NOT NULL,
  `display_name` VARCHAR(191) NOT NULL,
  `capabilities` JSON NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ai_provider_models_provider_id_provider_model_id_key` (`provider_id`, `provider_model_id`),
  CONSTRAINT `ai_provider_models_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `voice_profiles` (
  `id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `provider_id` VARCHAR(32) NULL,
  `provider_voice_id` VARCHAR(191) NULL,
  `language_code` VARCHAR(16) NOT NULL,
  `speaking_rate` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  `style_instructions` TEXT NULL,
  `purpose` VARCHAR(64) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `provider_metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `voice_profiles_provider_id_idx` (`provider_id`),
  CONSTRAINT `voice_profiles_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
