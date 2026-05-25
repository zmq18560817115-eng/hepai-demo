import 'dotenv/config';
import { getDb } from './index.js';

getDb();
console.log('Database ready:', process.env.SQLITE_PATH ?? './data/hepai.sqlite');
