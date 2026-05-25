import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { getDb } from './db/index.js';
import apiRouter from './routes/api.js';

const PORT = Number(process.env.PORT) || 8080;

getDb();

const app = express();
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api/v1', apiRouter);

app.listen(PORT, () => {
  console.log(`和拍 API  http://localhost:${PORT}/api/v1`);
  console.log(`健康检查  http://localhost:${PORT}/api/v1/health`);
  console.log(`数据库    ${process.env.SQLITE_PATH ?? './data/hepai.sqlite'}`);
});
