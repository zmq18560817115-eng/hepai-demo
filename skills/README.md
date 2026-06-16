# 和拍 · Agent Skills

## ai-hr-onboarding

新人企业 AI HR 对话的基础 Skill，来源：

- 桌面 `~/Desktop/SKILL.md`（ai-native-onboarding）
- `~/Desktop/ai-native-onboarding/references/*`
- 项目内 `references/hepai-newcomer-playbook.md`（和拍业务）

### 运行时使用

- **后端**：`hepai-server` 启动时由 `src/services/skillLoader.ts` 加载，注入 AI HR 的 system prompt
- **前端**：`GET /api/v1/ai/hr/skill` 获取欢迎语、快捷问题、首周路线
- **Mock**：`和拍---新人入职社交互助平台/src/skills/ai-hr-manifest.json`（与 manifest.json 同步）

### 更新 Skill

1. 编辑本目录下 `SKILL.md` 或 `references/`
2. 同步更新 `manifest.json` 与前端 `src/skills/ai-hr-manifest.json`
3. 重启 `hepai-server`（Skill 正文有内存缓存，重启后生效）
