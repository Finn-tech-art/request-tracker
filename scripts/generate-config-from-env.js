#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const envPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(cwd, '.env');

let env = {};
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.substring(0, eq).trim();
    let val = line.substring(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
} else {
  // Fall back to process.env (useful for CI/build environments like Render)
  env = Object.assign({}, process.env);
}

const supabaseUrl = env.SUPABASE_URL || null;
const supabaseKey = env.SUPABASE_ANON_KEY || env.SUPABASE_KEY || null;
const authUrl = env.AUTH_API_URL || env.AUTH_URL || null;

if (!supabaseUrl || !supabaseKey) {
  console.warn('SUPABASE_URL or SUPABASE_ANON_KEY not found in .env or environment. Generating config file with available values.');
}

const outDir = path.join(cwd, 'src', 'js', 'config');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'config.js');

const cfg = {
  AUTH_API_URL: authUrl || null,
  SUPABASE_URL: supabaseUrl || null,
  SUPABASE_ANON_KEY: supabaseKey || null
};

const content = `export default ${JSON.stringify(cfg, null, 2)};\n`;
fs.writeFileSync(outPath, content, 'utf8');
console.log(`Wrote config to ${outPath}`);
