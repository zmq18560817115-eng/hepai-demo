
-- 和拍 - 新人入职社交互助平台
-- 数据库初始化脚本
-- ----------------------------

-- ----------------------------
-- 1. 用户表 (Users)
-- 存储系统所有用户，包括新员工和HR
-- ----------------------------
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL COMMENT '主键，用户唯一标识 (UUID)',
  `username` VARCHAR(100) NOT NULL UNIQUE COMMENT '用户名/工号',
  `password` VARCHAR(255) NOT NULL COMMENT '加密后的密码',
  `nickname` VARCHAR(100) NOT NULL COMMENT '昵称',
  `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT '头像 URL',
  `role` ENUM('newcomer', 'hr') NOT NULL COMMENT '用户角色',
  `onboarding_date` DATE NOT NULL COMMENT '入职日期',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ----------------------------
-- 2. 问答题目表 (QuizQuestions)
-- 存储入职盲盒的题目
-- ----------------------------
CREATE TABLE `quiz_questions` (
  `id` VARCHAR(36) NOT NULL COMMENT '主键，问题ID (UUID)',
  `text` TEXT NOT NULL COMMENT '问题内容',
  `options` JSON NOT NULL COMMENT '选项，格式: [{\"text\": \"string\", \"value\": \"string\"}]',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问答题目表';

-- ----------------------------
-- 3. 用户答案表 (UserAnswers)
-- 存储用户对盲盒问题的回答
-- ----------------------------
CREATE TABLE `user_answers` (
  `id` VARCHAR(36) NOT NULL COMMENT '主键，答案ID (UUID)',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
  `question_id` VARCHAR(36) NOT NULL COMMENT '问题ID',
  `answer_value` VARCHAR(255) NOT NULL COMMENT '用户选择的答案值',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `quiz_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户答案表';

-- ----------------------------
-- 4. 用户人格面具表 (Personas)
-- 存储用户通过问答生成的虚拟形象
-- ----------------------------
CREATE TABLE `personas` (
  `id` VARCHAR(36) NOT NULL COMMENT '主键 (UUID)',
  `user_id` VARCHAR(36) NOT NULL UNIQUE COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '人格面具名称',
  `tags` JSON DEFAULT NULL COMMENT '性格标签 (JSON数组)',
  `motto` TEXT DEFAULT NULL COMMENT '职场格言',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户人格面具表';

-- ----------------------------
-- 5. 情绪日志表 (MoodLogs)
-- 记录用户的情绪能量和闪光时刻
-- ----------------------------
CREATE TABLE `mood_logs` (
  `id` VARCHAR(36) NOT NULL COMMENT '主键，日志ID (UUID)',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
  `energy_level` INT NOT NULL COMMENT '情绪能量值 (0-100)',
  `log_text` TEXT DEFAULT NULL COMMENT '闪光时刻的文字记录',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='情绪日志表';

-- ----------------------------
-- 6. 导师分配表 (MentorAssignments)
-- 记录新员工和导师的分配关系
-- ----------------------------
CREATE TABLE `mentor_assignments` (
  `mentee_id` VARCHAR(36) NOT NULL COMMENT '新员工ID',
  `mentor_id` VARCHAR(36) NOT NULL COMMENT '导师ID',
  `type` ENUM('main', 'project') NOT NULL COMMENT '导师类型',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  PRIMARY KEY (`mentee_id`, `mentor_id`),
  FOREIGN KEY (`mentee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mentor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导师分配表';

-- ----------------------------
-- 7. 午餐匹配请求表 (LunchMatchRequests)
-- 记录用户的午餐匹配请求
-- ----------------------------
CREATE TABLE `lunch_match_requests` (
  `id` VARCHAR(36) NOT NULL COMMENT '主键，请求ID (UUID)',
  `user_id` VARCHAR(36) NOT NULL COMMENT '发起请求的用户ID',
  `status` ENUM('pending', 'matched', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '请求状态',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '请求时间',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='午餐匹配请求表';

