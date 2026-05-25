const PERSONA_TEMPLATES: Record<
  string,
  { name: string; tags: string[]; motto: string }
> = {
  I: {
    name: '静谧 I 人忍者型',
    tags: ['独处充电', '文档达人', '咖啡续命'],
    motto: '不打扰是我的温柔，交付是我的靠谱。',
  },
  E: {
    name: '社交 E 人带玩型',
    tags: ['饭局发起人', '气氛组', '跨界聊得来'],
    motto: '先连接人，再连接事——团队节奏我来带。',
  },
  P: {
    name: '玩梗 P 人协作型',
    tags: ['表情包外交', '群聊活跃', '灵感快闪'],
    motto: '严肃问题也可以轻松问，求助不丢人。',
  },
  S: {
    name: '踏实 S 人守护型',
    tags: ['步骤清晰', '靠谱搭子', '桌游局常驻'],
    motto: '一步一步来，把小事做好就是最好的融入。',
  },
  N: {
    name: '观察 N 人策谋型',
    tags: ['错峰出行', '信息敏感', '低调进场'],
    motto: '先看清局面再开口，是我的职场安全感。',
  },
};

export function generatePersonaFromAnswers(answers: string[]) {
  const counts: Record<string, number> = {};
  for (const a of answers) counts[a] = (counts[a] ?? 0) + 1;
  const dominant =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'I';
  const template = PERSONA_TEMPLATES[dominant] ?? PERSONA_TEMPLATES.I;
  const secondary = Object.entries(counts)
    .filter(([k]) => k !== dominant)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const tags = secondary
    ? [
        ...template.tags,
        `${PERSONA_TEMPLATES[secondary]?.name.split(' ')[1] ?? ''}倾向`.trim(),
      ].filter(Boolean)
    : [...template.tags];
  return { name: template.name, tags, motto: template.motto };
}
