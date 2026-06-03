import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { getDb } from './db/index.js';
import apiRouter from './routes/api.js';
import { mountFrontend } from './serveFrontend.js';

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST ?? '0.0.0.0';

getDb();

const defaultOrigins: (string | RegExp)[] = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https:\/\/[a-z0-9-]+\.loca\.lt$/,
  /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/,
  /^https:\/\/[a-z0-9-]+\.onrender\.com$/,
  /^https:\/\/[a-z0-9-]+\.zeabur\.app$/,
  /^https:\/\/[a-z0-9-]+\.fly\.dev$/,
];

const extraOrigins =
  process.env.CORS_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

const app = express();
app.use(
  cors({
    origin: [...defaultOrigins, ...extraOrigins],
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api/v1', apiRouter);

const frontendDist = mountFrontend(app);

app.listen(PORT, HOST, () => {
  console.log(`和拍 API  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/v1`);
  console.log(`健康检查  http://localhost:${PORT}/api/v1/health`);
  console.log(`数据库    ${process.env.SQLITE_PATH ?? './data/hepai.sqlite'}`);
  if (frontendDist) {
    console.log(`前端静态  ${frontendDist}`);
    console.log(`试点入口  http://localhost:${PORT}/  （钉钉 H5 首页填 HTTPS 公网地址）`);
  } else {
    console.log('前端静态  未找到 dist，仅 API 模式（请先 npm run build 前端）');
  }
});
