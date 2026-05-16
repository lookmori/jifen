// lib/db.ts — 数据库连接 (Neon Serverless)
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

// 开发/构建阶段允许占位符 URL
// 实际部署时需在 Vercel 环境变量中配置 DATABASE_URL
const url = databaseUrl && databaseUrl !== 'postgresql://...'
  ? databaseUrl
  : 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

const sql = neon(url);

export { sql };
