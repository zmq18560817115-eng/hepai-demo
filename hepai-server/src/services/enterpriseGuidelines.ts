import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/index.js';

const GUIDELINES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../skills/enterprise-management-guidelines',
);

export interface GuidelineChunk {
  id: string;
  category_id: string;
  category_title: string;
  section_title: string;
  content: string;
  source_file: string;
  keywords: string[];
}

export interface GuidelineManifest {
  name: string;
  display_name: string;
  version: string;
  effective_date: string;
  owner: string;
  description: string;
  categories: { id: string; title: string; file: string }[];
  integrated_with: string[];
  answer_policy: string;
}

export interface GuidelineCitation {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  source: string;
  policy_version: string;
}

export interface GuidelineSearchResult {
  chunk: GuidelineChunk;
  score: number;
}

let cachedManifest: GuidelineManifest | null = null;
let cachedChunks: GuidelineChunk[] | null = null;
let persistedVersion: string | null = null;

const POLICY_TOPIC_RE =
  /请假|休假|年假|病假|事假|考勤|打卡|迟到|加班|调休|报销|差旅|发薪|工资|薪酬|绩效|OKR|考核|转正|试用期|入职|离职|劳动合同|保密|信息安全|准则|制度|流程|规定|怎么办|如何申请|带教|导师|融入|HRBP|工单|人事服务|费控|团建|培训|违规|申诉/;

const STOP_WORDS = new Set([
  '的',
  '了',
  '吗',
  '呢',
  '啊',
  '我',
  '你',
  '他',
  '她',
  '是',
  '在',
  '有',
  '和',
  '与',
  '及',
  '什么',
  '怎么',
  '如何',
  '请问',
  '可以',
  '能否',
  '一下',
  '吗',
]);

function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, ' ');
  const tokens: string[] = [];
  const han = normalized.match(/[\u4e00-\u9fa5]+/g) ?? [];
  for (const seg of han) {
    if (seg.length <= 2) {
      if (!STOP_WORDS.has(seg)) tokens.push(seg);
      continue;
    }
    for (let i = 0; i < seg.length - 1; i++) {
      const bi = seg.slice(i, i + 2);
      if (!STOP_WORDS.has(bi)) tokens.push(bi);
    }
    if (seg.length <= 4) tokens.push(seg);
  }
  const words = normalized.match(/[a-z0-9]{2,}/g) ?? [];
  tokens.push(...words);
  return [...new Set(tokens)];
}

function extractKeywords(title: string, content: string): string[] {
  const base = tokenize(`${title} ${content}`);
  const extra: string[] = [];
  if (/请假|休假|年假|病假/.test(content)) extra.push('请假', '休假');
  if (/报销|差旅|发票/.test(content)) extra.push('报销', '差旅');
  if (/绩效|OKR|考核/.test(content)) extra.push('绩效', '考核');
  if (/入职|试用期|转正/.test(content)) extra.push('入职', '试用期');
  if (/导师|带教|融入/.test(content)) extra.push('导师', '带教');
  if (/保密|信息安全/.test(content)) extra.push('保密', '信息安全');
  return [...new Set([...base, ...extra])];
}

function isTableSeparatorRow(cells: string[]) {
  return (
    cells.length > 0 &&
    cells.every((c) => /^-+$/.test(c.replace(/:/g, '').trim()))
  );
}

function tableToPlainText(lines: string[]): string | null {
  const tableLines = lines.filter((l) => l.includes('|'));
  if (tableLines.length < 2) return null;

  const rows = tableLines
    .map((l) =>
      l
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean),
    )
    .filter((cells) => cells.length >= 2);

  if (rows.length < 2) return null;
  const header = rows[0];
  const dataRows = rows.slice(1).filter((r) => !isTableSeparatorRow(r));
  if (dataRows.length === 0) return null;

  return dataRows
    .map((cells) => {
      const pairs = header.map((h, idx) => {
        const v = cells[idx] ?? '';
        if (!h || !v) return '';
        return `${h}：${v}`;
      });
      const sentence = pairs.filter(Boolean).join('；');
      return sentence ? `${sentence}。` : '';
    })
    .filter(Boolean)
    .join('\n');
}

function markdownToPlainText(md: string): string {
  if (!md) return '';
  const rawLines = md.replace(/\r\n/g, '\n').split('\n');

  // If there is a markdown table, convert it first (keep surrounding context).
  const maybeTable = tableToPlainText(rawLines);
  let text = md;
  if (maybeTable) {
    // Replace the whole table block (best-effort) by plain rows.
    const first = rawLines.findIndex((l) => l.includes('|'));
    let last = first;
    for (let i = first; i < rawLines.length; i++) {
      if (!rawLines[i].includes('|') && rawLines[i].trim() !== '') break;
      if (rawLines[i].includes('|')) last = i;
    }
    const before = rawLines.slice(0, first).join('\n');
    const after = rawLines.slice(last + 1).join('\n');
    text = [before, maybeTable, after].filter(Boolean).join('\n');
  }

  return (
    text
      // headings / blockquotes
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^\s*>\s?/gm, '')
      // bold/italic/backticks
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      // list markers
      .replace(/^\s*-\s+/gm, '')
      // leftover pipes (should be none, but just in case)
      .replace(/\|/g, ' ')
      // collapse spacing
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function hydrateFromDbIfPossible(): {
  manifest: GuidelineManifest | null;
  chunks: GuidelineChunk[] | null;
} {
  try {
    const db = getDb();
    const doc = db
      .prepare(
        `SELECT id, name, version, effective_date, owner, description, answer_policy, integrated_with_json
         FROM policy_documents
         WHERE name = 'enterprise-management-guidelines'
         ORDER BY updated_at DESC
         LIMIT 1`,
      )
      .get() as
      | {
          id: string;
          name: string;
          version: string;
          effective_date: string | null;
          owner: string | null;
          description: string | null;
          answer_policy: string | null;
          integrated_with_json: string | null;
        }
      | undefined;
    if (!doc) return { manifest: null, chunks: null };

    const rows = db
      .prepare(
        `SELECT id, category_id, category_title, section_title, content, source_file, keywords_json
         FROM policy_chunks
         WHERE document_id = ?
         ORDER BY chunk_order ASC`,
      )
      .all(doc.id) as {
      id: string;
      category_id: string;
      category_title: string;
      section_title: string;
      content: string;
      source_file: string;
      keywords_json: string;
    }[];
    if (rows.length === 0) return { manifest: null, chunks: null };

    const categoriesMap = new Map<string, { id: string; title: string; file: string }>();
    const chunks: GuidelineChunk[] = rows.map((r) => {
      if (!categoriesMap.has(r.category_id)) {
        categoriesMap.set(r.category_id, {
          id: r.category_id,
          title: r.category_title,
          file: r.source_file,
        });
      }
      return {
        id: r.id,
        category_id: r.category_id,
        category_title: r.category_title,
        section_title: r.section_title,
        content: r.content,
        source_file: r.source_file,
        keywords: JSON.parse(r.keywords_json ?? '[]') as string[],
      };
    });

    const manifest: GuidelineManifest = {
      name: doc.name,
      display_name: '企业管理准则（制度与流程知识库）',
      version: doc.version,
      effective_date: doc.effective_date ?? '',
      owner: doc.owner ?? '集团人力资源部',
      description: doc.description ?? '',
      categories: Array.from(categoriesMap.values()),
      integrated_with: JSON.parse(doc.integrated_with_json ?? '[]') as string[],
      answer_policy: doc.answer_policy ?? '',
    };
    return { manifest, chunks };
  } catch {
    return { manifest: null, chunks: null };
  }
}

function persistToDb(manifest: GuidelineManifest, chunks: GuidelineChunk[]) {
  if (persistedVersion === manifest.version) return;
  try {
    const db = getDb();
    const existing = db
      .prepare(
        `SELECT id, version FROM policy_documents
         WHERE name = ?
         ORDER BY updated_at DESC LIMIT 1`,
      )
      .get(manifest.name) as { id: string; version: string } | undefined;

    let docId = existing?.id;
    if (!existing || existing.version !== manifest.version) {
      docId = uuid();
      db.prepare(
        `INSERT INTO policy_documents
         (id, name, version, effective_date, owner, description, answer_policy, source_dir, integrated_with_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      ).run(
        docId,
        manifest.name,
        manifest.version,
        manifest.effective_date,
        manifest.owner,
        manifest.description,
        manifest.answer_policy,
        GUIDELINES_DIR,
        JSON.stringify(manifest.integrated_with ?? []),
      );
    } else {
      db.prepare(
        `UPDATE policy_documents
         SET effective_date = ?, owner = ?, description = ?, answer_policy = ?,
             source_dir = ?, integrated_with_json = ?, updated_at = datetime('now')
         WHERE id = ?`,
      ).run(
        manifest.effective_date,
        manifest.owner,
        manifest.description,
        manifest.answer_policy,
        GUIDELINES_DIR,
        JSON.stringify(manifest.integrated_with ?? []),
        docId,
      );
      db.prepare(`DELETE FROM policy_chunks WHERE document_id = ?`).run(docId);
    }

    const insertChunk = db.prepare(
      `INSERT INTO policy_chunks
       (id, document_id, category_id, category_title, section_title, content, source_file, keywords_json, chunk_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    chunks.forEach((chunk, idx) => {
      insertChunk.run(
        chunk.id,
        docId,
        chunk.category_id,
        chunk.category_title,
        chunk.section_title,
        chunk.content,
        chunk.source_file,
        JSON.stringify(chunk.keywords),
        idx,
      );
    });
    persistedVersion = manifest.version;
  } catch {
    // ignore in legacy mode
  }
}

export function loadGuidelineManifest(): GuidelineManifest {
  if (cachedManifest) return cachedManifest;
  const fromDb = hydrateFromDbIfPossible();
  if (fromDb.manifest && fromDb.chunks) {
    cachedManifest = fromDb.manifest;
    cachedChunks = fromDb.chunks;
    persistedVersion = fromDb.manifest.version;
    return cachedManifest;
  }
  const manifestPath = path.join(GUIDELINES_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    cachedManifest = {
      name: 'enterprise-management-guidelines',
      display_name: '企业管理准则',
      version: '0.0.0',
      effective_date: '',
      owner: 'HR',
      description: '准则库未部署',
      categories: [],
      integrated_with: [],
      answer_policy: '',
    };
    return cachedManifest;
  }
  cachedManifest = JSON.parse(
    fs.readFileSync(manifestPath, 'utf8'),
  ) as GuidelineManifest;
  return cachedManifest;
}

export function loadGuidelineChunks(): GuidelineChunk[] {
  if (cachedChunks) return cachedChunks;
  const manifest = loadGuidelineManifest();
  if (cachedChunks) return cachedChunks;
  const chunks: GuidelineChunk[] = [];

  for (const cat of manifest.categories) {
    const filePath = path.join(GUIDELINES_DIR, cat.file);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf8');
    const parts = raw.split(/^## /m).slice(1);
    for (const part of parts) {
      const nl = part.indexOf('\n');
      const sectionTitle = (nl >= 0 ? part.slice(0, nl) : part).trim();
      const content = (nl >= 0 ? part.slice(nl + 1) : '').trim();
      if (!content || sectionTitle.startsWith('常见问题')) continue;
      const id = `${cat.id}__${sectionTitle.replace(/\s+/g, '_').slice(0, 40)}`;
      chunks.push({
        id,
        category_id: cat.id,
        category_title: cat.title,
        section_title: sectionTitle,
        content,
        source_file: cat.file,
        keywords: extractKeywords(sectionTitle, content),
      });
    }
    const faqPart = raw.split(/^## 常见问题/m)[1];
    if (faqPart) {
      chunks.push({
        id: `${cat.id}__faq`,
        category_id: cat.id,
        category_title: cat.title,
        section_title: '常见问题',
        content: faqPart.trim(),
        source_file: cat.file,
        keywords: extractKeywords('常见问题', faqPart),
      });
    }
  }

  cachedChunks = chunks;
  persistToDb(manifest, chunks);
  return chunks;
}

export function isPolicyQuestion(message: string): boolean {
  return POLICY_TOPIC_RE.test(message.trim());
}

export function searchGuidelines(
  query: string,
  limit = 4,
): GuidelineSearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const results: GuidelineSearchResult[] = [];
  for (const chunk of loadGuidelineChunks()) {
    let score = 0;
    const hay = `${chunk.section_title} ${chunk.content} ${chunk.keywords.join(' ')}`;
    for (const t of tokens) {
      if (hay.includes(t)) score += t.length >= 3 ? 3 : 2;
      if (chunk.section_title.includes(t)) score += 4;
      if (chunk.category_title.includes(t)) score += 2;
    }
    if (POLICY_TOPIC_RE.test(query) && chunk.category_id) {
      if (/请假|休假|年假|病假|考勤|打卡|加班/.test(query) && chunk.category_id === 'attendance') {
        score += 5;
      }
      if (/报销|差旅|发薪|工资|薪酬/.test(query) && chunk.category_id === 'compensation') {
        score += 5;
      }
      if (/绩效|OKR|考核|培训/.test(query) && chunk.category_id === 'performance') {
        score += 5;
      }
      if (/入职|试用期|转正|手续/.test(query) && chunk.category_id === 'onboarding') {
        score += 5;
      }
      if (/保密|信息安全|账号|权限/.test(query) && chunk.category_id === 'security') {
        score += 5;
      }
      if (/导师|带教|融入|和拍/.test(query) && chunk.category_id === 'mentoring') {
        score += 5;
      }
    }
    if (score > 0) results.push({ chunk, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function chunksToCitations(
  results: GuidelineSearchResult[],
): GuidelineCitation[] {
  const version = loadGuidelineManifest().version;
  return results.map(({ chunk }) => ({
    id: chunk.id,
    title: chunk.category_title,
    section: chunk.section_title,
    excerpt: chunk.content.slice(0, 160).replace(/\n+/g, ' '),
    source: chunk.source_file,
    policy_version: version,
  }));
}

export function buildGuidelinePromptBlock(results: GuidelineSearchResult[]): string {
  if (results.length === 0) return '';
  const manifest = loadGuidelineManifest();
  const blocks = results.map(
    ({ chunk }, i) =>
      `准则摘录 ${i + 1}（${chunk.category_title} · ${chunk.section_title}）\n${markdownToPlainText(
        chunk.content.slice(0, 900),
      )}`,
  );
  return [
    `## 企业管理准则（${manifest.display_name} v${manifest.version}）`,
    manifest.answer_policy,
    '',
    ...blocks,
  ].join('\n\n');
}

/** 高置信度：直接用准则条文组织回答 */
export function buildGuidelineReply(
  message: string,
  results: GuidelineSearchResult[],
  nickname: string,
  role: string,
): { reply: string; source: string; topic: string } {
  const top = results[0];
  const citations = chunksToCitations(results.slice(0, 3));
  let bridge = '';
  if (/导师|带教|不敢|尴尬/.test(message) && role === 'newcomer') {
    bridge =
      '\n\n【和拍融入】可在「带教导师」发问候，或使用 AI HR 的带教话术建议；正式考核与权限以制度为准。';
  } else if (/焦虑|能量|面具|蹭饭|午餐/.test(message)) {
    bridge =
      '\n\n【和拍融入】情绪与社交类问题可结合安全屋、蹭饭地图；本条答复中的时限与审批以企业管理准则为准。';
  } else if (/入职|盲盒|第一天/.test(message)) {
    bridge =
      '\n\n【和拍融入】集团入职手续完成后，请在插件完成「入职盲盒」8 题并查看安全屋。';
  }

  const body = results
    .slice(0, 2)
    .map(({ chunk }) => {
      const summary = markdownToPlainText(chunk.content).slice(0, 560);
      return `${markdownToPlainText(chunk.section_title)}\n${summary}`;
    })
    .join('\n\n');

  const reply = `${nickname}，关于${top.chunk.category_title}：\n\n${body}\n\n如需办理，请走钉钉「人事服务」或「费控报销」；个案争议请联系 HRBP。${bridge}`;

  return {
    reply,
    source: 'enterprise-guidelines',
    topic: `policy_${top.chunk.category_id}`,
  };
}

export function getGuidelineCatalog() {
  const manifest = loadGuidelineManifest();
  const chunks = loadGuidelineChunks();
  return {
    name: manifest.name,
    display_name: manifest.display_name,
    version: manifest.version,
    effective_date: manifest.effective_date,
    owner: manifest.owner,
    description: manifest.description,
    integrated_with: manifest.integrated_with,
    chunk_count: chunks.length,
    categories: manifest.categories.map((c) => {
      const sections = chunks
        .filter((ch) => ch.category_id === c.id)
        .map((ch) => ({
          id: ch.id,
          section: ch.section_title,
          excerpt: ch.content.slice(0, 80).replace(/\n/g, ' '),
        }));
      return { ...c, sections };
    }),
  };
}

export function getGuidelinesDir(): string {
  return GUIDELINES_DIR;
}
