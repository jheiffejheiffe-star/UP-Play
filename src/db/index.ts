import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { config } from '../config/index.ts';

export const isDbConfigured = Boolean(
  (config.database.url && config.database.url.trim() !== '' && !config.database.url.includes('undefined')) ||
  (config.database.host && config.database.host.trim() !== '' && !config.database.host.includes('undefined'))
);

let dbConnected = false;
export const isDbConnected = () => dbConnected;
export const setDbConnected = (val: boolean) => { dbConnected = val; };

export const createPool = () => {
  if (config.database.url && config.database.url.trim() !== '') {
    return new Pool({
      connectionString: config.database.url,
      ssl: config.database.url.includes("supabase.co") || config.database.url.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
      connectionTimeoutMillis: 5000,
    });
  }

  if (config.database.host && config.database.host.trim() !== '') {
    return new Pool({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.dbName,
      ssl: (config.database.host.includes("supabase.co") || config.database.host.includes("neon.tech"))
        ? { rejectUnauthorized: false }
        : undefined,
      connectionTimeoutMillis: 5000,
    });
  }

  // Fallback dummy pool when no database is configured
  return new Pool({
    connectionTimeoutMillis: 1000,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  // Silent warning if no database is intentionally configured
  if (isDbConfigured) {
    console.error('Unexpected error on idle SQL pool client:', err.message);
  }
});

export const db = drizzle(pool, { schema });

