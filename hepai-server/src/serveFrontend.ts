/**
 * 生产 / 钉钉试点：托管前端 build 产物，与 API 同源（单端口）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveFrontendDist(): string | null {
  const candidates = [
    process.env.FRONTEND_DIST?.trim(),
    path.resolve(__dirname, '../../和拍---新人入职社交互助平台/dist'),
    path.resolve(__dirname, '../public'),
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    const indexHtml = path.join(dir, 'index.html');
    if (fs.existsSync(indexHtml)) return dir;
  }
  return null;
}

export function mountFrontend(app: Express): string | null {
  const dist = resolveFrontendDist();
  if (!dist) return null;

  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
  return dist;
}
