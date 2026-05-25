-- 和拍 API v1 扩展迁移
-- 在 init.sql 之后执行

-- 1. 用户表：导师角色 + 钉钉 + 入职完成标记
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('newcomer', 'mentor', 'hr') NOT NULL COMMENT '用户角色';

ALTER TABLE `users`
  ADD COLUMN `dingtalk_user_id` VARCHAR(64) DEFAULT NULL COMMENT '钉钉 userId' AFTER `username`,
  ADD COLUMN `onboarding_completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完成入职盲盒' AFTER `onboarding_date`,
  ADD UNIQUE KEY `uk_dingtalk_user_id` (`dingtalk_user_id`);

-- 2. 导师忙闲状态（可选：也可放 Redis）
ALTER TABLE `users`
  ADD COLUMN `mentor_status` ENUM('busy', 'available', 'syncing') DEFAULT 'available' COMMENT '导师状态，仅 mentor 有效' AFTER `role`;

-- 3. 午餐匹配：成功态字段
ALTER TABLE `lunch_match_requests`
  ADD COLUMN `venue_id` VARCHAR(36) DEFAULT NULL COMMENT '食堂/区域 ID' AFTER `user_id`,
  ADD COLUMN `match_code` VARCHAR(32) DEFAULT NULL COMMENT '匹配暗号，如 BLUE-K88' AFTER `status`,
  ADD COLUMN `meeting_point` VARCHAR(255) DEFAULT NULL COMMENT '见面地点文案' AFTER `match_code`,
  ADD COLUMN `meet_before` DATETIME DEFAULT NULL COMMENT '建议到达截止时间' AFTER `meeting_point`,
  ADD COLUMN `matched_at` TIMESTAMP NULL DEFAULT NULL COMMENT '匹配成功时间' AFTER `meet_before`,
  ADD COLUMN `partner_user_id` VARCHAR(36) DEFAULT NULL COMMENT '匹配对象用户 ID' AFTER `matched_at`;

-- 4. 问答题目排序
ALTER TABLE `quiz_questions`
  ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0 COMMENT '题目顺序' AFTER `options`;

-- 5. HR 风险告警（P2）
CREATE TABLE IF NOT EXISTS `hr_alerts` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `user_alias` VARCHAR(100) NOT NULL COMMENT '化名展示',
  `dept` VARCHAR(255) NOT NULL,
  `reason` TEXT NOT NULL,
  `severity` ENUM('yellow', 'red') NOT NULL DEFAULT 'yellow',
  `resolved` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='HR风险告警';

-- 6. 用户当前能量缓存（避免 mood_logs 频繁聚合，可选）
CREATE TABLE IF NOT EXISTS `user_energy_snapshot` (
  `user_id` VARCHAR(36) NOT NULL,
  `energy_level` INT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户当前情绪能量快照';
