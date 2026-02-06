-- CreateTable
CREATE TABLE `auth_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `token_type` ENUM('access', 'refresh') NOT NULL,
    `device_id` VARCHAR(80) NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `revoked_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_auth_token_hash`(`token_hash`),
    INDEX `ix_auth_expires`(`expires_at`),
    INDEX `ix_auth_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `uq_roles_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_operations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `device_id` VARCHAR(80) NOT NULL,
    `op_id` CHAR(36) NOT NULL,
    `entity_type` ENUM('task', 'workspace_member') NOT NULL,
    `entity_client_id` CHAR(36) NULL,
    `operation` ENUM('create', 'update', 'status', 'delete', 'restore', 'revert') NOT NULL,
    `payload` JSON NOT NULL,
    `base_version` BIGINT UNSIGNED NULL,
    `result` ENUM('applied', 'conflict', 'rejected') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `ix_sync_created_at`(`created_at`),
    INDEX `ix_sync_entity`(`entity_type`, `entity_client_id`),
    INDEX `ix_sync_user`(`user_id`),
    UNIQUE INDEX `uq_sync_op`(`device_id`, `op_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `task_id` BIGINT UNSIGNED NOT NULL,
    `event_type` ENUM('created', 'updated', 'status_changed', 'moved_to_trash', 'restored', 'reverted', 'shared', 'permission_changed') NOT NULL,
    `from_status` ENUM('pendiente', 'en_progreso', 'completada') NULL,
    `to_status` ENUM('pendiente', 'en_progreso', 'completada') NULL,
    `details` JSON NULL,
    `base_version` BIGINT UNSIGNED NULL,
    `result` ENUM('applied', 'conflict', 'rejected') NOT NULL DEFAULT 'applied',
    `device_id` VARCHAR(80) NULL,
    `performed_by` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `ix_task_events_by`(`performed_by`),
    INDEX `ix_task_events_created_at`(`created_at`),
    INDEX `ix_task_events_task`(`task_id`),
    INDEX `ix_task_events_type`(`event_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_versions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `task_id` BIGINT UNSIGNED NOT NULL,
    `version` BIGINT UNSIGNED NOT NULL,
    `snapshot` JSON NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` BIGINT UNSIGNED NOT NULL,

    INDEX `fk_task_versions_user`(`created_by`),
    INDEX `ix_task_versions_task`(`task_id`),
    INDEX `ix_task_versions_version`(`version`),
    UNIQUE INDEX `uq_task_versions`(`task_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `client_id` CHAR(36) NULL,
    `client_rev` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `workspace_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('pendiente', 'en_progreso', 'completada') NOT NULL DEFAULT 'pendiente',
    `owner_user_id` BIGINT UNSIGNED NOT NULL,
    `assigned_user_id` BIGINT UNSIGNED NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(0) NULL,
    `deleted_by` BIGINT UNSIGNED NULL,
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 1,
    `last_modified_device_id` VARCHAR(80) NULL,
    `last_modified_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,

    UNIQUE INDEX `uq_tasks_client_id`(`client_id`),
    INDEX `fk_tasks_deleted_by`(`deleted_by`),
    INDEX `ix_tasks_assigned`(`assigned_user_id`),
    INDEX `ix_tasks_deleted`(`is_deleted`),
    INDEX `ix_tasks_last_modified_at`(`last_modified_at`),
    INDEX `ix_tasks_owner`(`owner_user_id`),
    INDEX `ix_tasks_status`(`status`),
    INDEX `ix_tasks_version`(`version`),
    INDEX `ix_tasks_workspace`(`workspace_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_action_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `token_type` ENUM('verify_email', 'reset_password') NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `used_at` DATETIME(0) NULL,
    `revoked_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` BIGINT UNSIGNED NULL,

    UNIQUE INDEX `uq_action_token_hash`(`token_hash`),
    INDEX `ix_action_expires`(`expires_at`),
    INDEX `ix_action_type`(`token_type`),
    INDEX `ix_action_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` BIGINT UNSIGNED NULL,

    INDEX `fk_user_roles_role`(`role_id`),
    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `auth_provider` ENUM('local', 'google') NOT NULL,
    `google_sub` VARCHAR(191) NULL,
    `password_hash` VARCHAR(255) NULL,
    `password_algo` ENUM('bcrypt') NOT NULL DEFAULT 'bcrypt',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `email_verified_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,

    UNIQUE INDEX `uq_users_email`(`email`),
    UNIQUE INDEX `uq_users_google_sub`(`google_sub`),
    INDEX `ix_users_active`(`is_active`),
    INDEX `ix_users_provider`(`auth_provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workspace_invitations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `workspace_id` BIGINT UNSIGNED NOT NULL,
    `email` VARCHAR(191) NULL,
    `token_hash` CHAR(64) NOT NULL,
    `status` ENUM('pending', 'accepted', 'revoked', 'expired') NOT NULL DEFAULT 'pending',
    `expires_at` DATETIME(0) NOT NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT true,
    `can_create` BOOLEAN NOT NULL DEFAULT false,
    `can_edit` BOOLEAN NOT NULL DEFAULT false,
    `can_delete` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` BIGINT UNSIGNED NULL,

    UNIQUE INDEX `uq_invite_token_hash`(`token_hash`),
    INDEX `ix_invite_email`(`email`),
    INDEX `ix_invite_status`(`status`),
    INDEX `ix_invite_workspace`(`workspace_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workspace_members` (
    `workspace_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT true,
    `can_create` BOOLEAN NOT NULL DEFAULT false,
    `can_edit` BOOLEAN NOT NULL DEFAULT false,
    `can_delete` BOOLEAN NOT NULL DEFAULT false,
    `joined_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `invited_by` BIGINT UNSIGNED NULL,

    INDEX `fk_wm_invited_by`(`invited_by`),
    INDEX `fk_wm_user`(`user_id`),
    PRIMARY KEY (`workspace_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workspaces` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `owner_user_id` BIGINT UNSIGNED NOT NULL,
    `is_archived` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,

    INDEX `ix_workspaces_owner`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auth_tokens` ADD CONSTRAINT `fk_auth_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `sync_operations` ADD CONSTRAINT `fk_sync_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `task_events` ADD CONSTRAINT `fk_task_events_task` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `task_events` ADD CONSTRAINT `fk_task_events_user` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `task_versions` ADD CONSTRAINT `fk_task_versions_task` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `task_versions` ADD CONSTRAINT `fk_task_versions_user` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `fk_tasks_assigned` FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `fk_tasks_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `fk_tasks_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `fk_tasks_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_action_tokens` ADD CONSTRAINT `fk_action_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workspace_invitations` ADD CONSTRAINT `fk_invite_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workspace_members` ADD CONSTRAINT `fk_wm_invited_by` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workspace_members` ADD CONSTRAINT `fk_wm_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workspace_members` ADD CONSTRAINT `fk_wm_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workspaces` ADD CONSTRAINT `fk_workspaces_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
