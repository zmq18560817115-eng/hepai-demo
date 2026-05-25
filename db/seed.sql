-- MySQL 种子数据（在 init.sql + 001_api_v1_extensions.sql 之后执行）
-- 开发登录 auth_code: dev_newcomer | dev_mentor | dev_hr

USE hepai;

INSERT INTO users (id, username, dingtalk_user_id, password, nickname, avatar_url, role, mentor_status, onboarding_date, onboarding_completed) VALUES
('u-newcomer-001', 'E00001', 'dev_newcomer', 'dev', '程序员小智', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 'newcomer', 'available', DATE_SUB(CURDATE(), INTERVAL 8 DAY), 0),
('u-newcomer-002', 'E00002', 'dev_partner', 'dev', '产品小美', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mei', 'newcomer', 'available', DATE_SUB(CURDATE(), INTERVAL 12 DAY), 1),
('u-mentor-001', 'M00001', 'dev_mentor', 'dev', '雷军老师', 'https://api.dicebear.com/7.x/identicon/svg?seed=lei', 'mentor', 'busy', CURDATE(), 1),
('u-mentor-002', 'M00002', 'dev_mentor2', 'dev', '张经理', 'https://api.dicebear.com/7.x/identicon/svg?seed=zhang', 'mentor', 'available', CURDATE(), 1),
('u-hr-001', 'HR0001', 'dev_hr', 'dev', 'HR管理员', 'https://api.dicebear.com/7.x/avataaars/svg?seed=hr', 'hr', 'available', CURDATE(), 1);

INSERT INTO quiz_questions (id, text, options, sort_order) VALUES
('q1-uuid', '到了下班时间，你此刻真实的内心OS是？', '[{"text":"火速撤离，回家充电","value":"I"},{"text":"看看谁还没走，约个饭？","value":"E"},{"text":"再磨蹭一会儿，避开晚高峰","value":"N"}]', 1),
('q2-uuid', '遇到卡壳的工作难题，你更喜欢？', '[{"text":"独自钻研，查遍文档","value":"I"},{"text":"直接转头问旁边的前辈","value":"E"},{"text":"发个表情包到群里求助","value":"P"}]', 2),
('q3-uuid', '下班后，你更偏向于怎样放松？', '[{"text":"阅读或看一部安静的电影","value":"I"},{"text":"去健身房或户外跑步","value":"E"},{"text":"和三五好友小聚","value":"S"}]', 3),
('q4-uuid', '开会时你更倾向于？', '[{"text":"先听别人说，最后再发言","value":"I"},{"text":"积极接话，带动讨论","value":"E"},{"text":"记笔记，会后私聊跟进","value":"N"}]', 4),
('q5-uuid', '午餐时间，你更愿意？', '[{"text":"一个人快速吃完","value":"I"},{"text":"和同事一起聊聊","value":"E"},{"text":"看心情，偶尔拼桌","value":"P"}]', 5),
('q6-uuid', '面对新任务，你的第一反应是？', '[{"text":"列清单，按步骤推进","value":"S"},{"text":"先找类似案例抄作业","value":"P"},{"text":"想清楚目标再动手","value":"N"}]', 6),
('q7-uuid', '如果可以选择工位氛围，你更喜欢？', '[{"text":"安静角落，减少打扰","value":"I"},{"text":"热闹区域，随时能聊","value":"E"},{"text":"灵活流动，哪里需要去哪","value":"P"}]', 7),
('q8-uuid', '入职第一周，你最希望获得的支持是？', '[{"text":"清晰的文档和自学路径","value":"I"},{"text":"有人带我认识团队和饭局","value":"E"},{"text":"稳定的带教节奏和反馈","value":"S"}]', 8);

INSERT INTO personas (id, user_id, name, tags, motto) VALUES
(UUID(), 'u-newcomer-002', '社交 E 人带玩型', '["饭局发起人","气氛组"]', '先连接人，再连接事。');

INSERT INTO user_energy_snapshot (user_id, energy_level) VALUES ('u-newcomer-002', 42);

INSERT INTO mentor_assignments (mentee_id, mentor_id, type) VALUES
('u-newcomer-001', 'u-mentor-001', 'main'),
('u-newcomer-001', 'u-mentor-002', 'project'),
('u-newcomer-002', 'u-mentor-001', 'main');

INSERT INTO hr_alerts (id, user_id, user_alias, dept, reason, severity) VALUES
(UUID(), 'u-newcomer-002', '蓝色小象', '研发中心 / 测试组', '连续3天情绪分极低', 'red'),
(UUID(), 'u-newcomer-001', '飞翔橘子', '市场部 / 品牌组', '导师3天未互动', 'yellow');
