/** 公司五大部门（HR 看板搜索闭环） */
export const HR_COMPANY_DEPARTMENTS = [
  '内容创作部门',
  '账号运营部门',
  '数据分析部门',
  '商务市场部门',
  '职能部门',
] as const;

export type HrCompanyDepartment = (typeof HR_COMPANY_DEPARTMENTS)[number];

/** 部门简称 / 关键词，用于模糊匹配库里的 dept 字段 */
export const HR_DEPARTMENT_KEYWORDS: Record<HrCompanyDepartment, string[]> = {
  内容创作部门: ['内容创作', '内容', '创作'],
  账号运营部门: ['账号运营', '运营', '账号'],
  数据分析部门: ['数据分析', '数据'],
  商务市场部门: ['商务市场', '商务', '市场'],
  职能部门: ['职能', '行政', '人力'],
};

export function resolveHrDepartment(query: string): HrCompanyDepartment | null {
  const q = query.trim();
  if (!q) return null;
  for (const dept of HR_COMPANY_DEPARTMENTS) {
    if (dept.includes(q) || q.includes(dept.replace('部门', ''))) return dept;
    if (HR_DEPARTMENT_KEYWORDS[dept].some((k) => q.includes(k) || k.includes(q))) {
      return dept;
    }
  }
  return null;
}

export function matchHrDepartmentText(
  deptField: string,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const field = deptField.toLowerCase();
  if (field.includes(q)) return true;
  const resolved = resolveHrDepartment(q);
  if (resolved) {
    const keys = HR_DEPARTMENT_KEYWORDS[resolved];
    if (field.includes(resolved.replace('部门', ''))) return true;
    return keys.some((k) => field.includes(k.toLowerCase()));
  }
  return HR_COMPANY_DEPARTMENTS.some(
    (d) =>
      field.includes(d.toLowerCase()) ||
      q.includes(d.replace('部门', '').toLowerCase()),
  );
}
