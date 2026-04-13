#!/usr/bin/env node
/**
 * setup-db.js — Initialize the Supabase database schema.
 *
 * Run once after cloning the repo:
 *   npm run setup-db
 *
 * Requires SUPABASE_DB_URL in your .env file.
 * Find it in: Supabase Dashboard → Project Settings → Database → Connection string (URI)
 * It looks like: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
 */

import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '..', 'supabase', 'schema.sql');

const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('\nError: SUPABASE_DB_URL is not set in your .env file.');
  console.error('Add this line to your .env:');
  console.error('  SUPABASE_DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"');
  console.error('\nFind the connection string in: Supabase Dashboard → Project Settings → Database → Connection string (URI)\n');
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  console.log('Connecting to database...');
  await client.connect();

  const sql = readFileSync(schemaPath, 'utf8');
  console.log('Running schema migrations...');
  await client.query(sql);

  console.log('\nDatabase initialized successfully.');
  console.log('  ✓ blog_posts table');
  console.log('  ✓ Row Level Security policies');
  console.log('  ✓ blog-images storage bucket');
  console.log('  ✓ Storage policies');
  console.log('\nNext steps:');
  console.log('  1. Go to Supabase Dashboard → Authentication → Users → Add user');
  console.log('  2. Create your admin account with an email and password');
  console.log('  3. Run: npm run dev');
  console.log('  4. Go to /admin/login and sign in\n');
} catch (err) {
  console.error('\nDatabase setup failed:', err.message, '\n');
  process.exit(1);
} finally {
  await client.end();
}
