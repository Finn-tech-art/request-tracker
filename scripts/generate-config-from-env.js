#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const envPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(cwd, '.env');

if (!fs.existsSync(envPath)) {
  console.error(`.env file not found at ${envPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf8');
const lines = raw.split(/\r?\n/);
const env = {};
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

const adminUser = env.ADMIN_USERNAME || env.ADMIN_USER || env.ADMIN || null;
const adminPass = env.ADMIN_PASSWORD || env.ADMIN_PASS || env.ADMIN_PW || null;

if (!adminUser || !adminPass) {
  console.error('ADMIN_USERNAME and ADMIN_PASSWORD not found in .env');
  process.exit(1);
}

const outDir = path.join(cwd, 'src', 'js', 'config');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'config.js');

const content = `export default ${JSON.stringify({ ADMIN_USERNAME: adminUser, ADMIN_PASSWORD: adminPass }, null, 2)};\n`;
fs.writeFileSync(outPath, content, 'utf8');
console.log(`Wrote config to ${outPath}`);
