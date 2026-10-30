import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'dotenv';
import { accountPublicBindings } from './account-config.mjs';

const signingBindings = [
  'SQUASH_ANDROID_KEYSTORE_FILE', 'SQUASH_ANDROID_KEY_ALIAS',
  'SQUASH_ANDROID_STORE_PASSWORD', 'SQUASH_ANDROID_KEY_PASSWORD',
  'SQUASH_ANDROID_CERT_SHA256'
];
const allowedBindings = [...signingBindings, ...accountPublicBindings];
const plainSigningBindings = new Set(['SQUASH_ANDROID_KEYSTORE_FILE', 'SQUASH_ANDROID_KEY_ALIAS', 'SQUASH_ANDROID_CERT_SHA256']);

async function fileAssignments(path) {
  try { return parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
}

function pointer(value) {
  const raw = /^kstore:\/\/admin-manual\/([^?#]+)#([A-Z_][A-Z0-9_]*|(?:%[0-9a-f]{2}|[A-Z0-9_])+)$/i.exec(value);
  if (!raw) throw new Error();
  const url = new URL(value);
  if (url.protocol !== 'kstore:' || url.hostname !== 'admin-manual' || url.username || url.password || url.port || url.search) throw new Error();
  const path = decodeURIComponent(raw[1]);
  const variable = decodeURIComponent(raw[2]);
  if (!path || /[\x00-\x1f\x7f\\]/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..') || !/^[A-Z_][A-Z0-9_]*$/.test(variable)) throw new Error();
  return { path, variable };
}

function documentAssignment(document, path, variable) {
  if (document?.exact !== true || document.path !== path || document.source_type !== 'admin-manual' || typeof document.content !== 'string') throw new Error();
  let value;
  let matches = 0;
  const fences = /^```(?:dotenv|env)[ \t]*\r?\n([\s\S]*?)^```[ \t]*\r?$/gm;
  for (const fence of document.content.matchAll(fences)) {
    const assignments = parse(fence[1]);
    if (!Object.hasOwn(assignments, variable)) continue;
    // dotenv normally keeps the last duplicate; canonical bindings must be unambiguous.
    const definitions = fence[1].match(new RegExp(`^[ \\t]*(?:export[ \\t]+)?${variable}[ \\t]*=`, 'gm')) || [];
    matches += definitions.length;
    value = assignments[variable];
  }
  if (matches !== 1 || typeof value !== 'string' || !value.trim() || /^(?:kstore|secret|pointer):/i.test(value.trim())) throw new Error();
  return value;
}

/** Resolve only explicit allowlisted pointers, in memory, for the existing coordinator. */
export async function resolveBuildEnvironment(root) {
  let configured;
  try {
    configured = { ...await fileAssignments(join(root, '.env')), ...await fileAssignments(join(root, '.env.local')), ...process.env };
  } catch { throw new Error('KSTORE_URL'); }
  const documents = new Map();
  const resolved = {};
  const failures = [];
  for (const name of allowedBindings) {
    const value = configured[name];
    if (typeof value !== 'string' || !value.trim() || /^(?:secret|pointer):/i.test(value.trim())) { failures.push(name); continue; }
    if (!/^kstore:/i.test(value.trim())) {
      if(signingBindings.includes(name)&&!plainSigningBindings.has(name)&&!Object.hasOwn(process.env,name)){failures.push(name);continue;}
      if(plainSigningBindings.has(name)&&!Object.hasOwn(process.env,name))resolved[name]=value;
      continue;
    }
    try {
      const reference = pointer(value.trim());
      if (!documents.has(reference.path)) {
        const service = new URL(configured.KSTORE_URL);
        if (!['https:', 'http:'].includes(service.protocol) || service.username || service.password || service.search || service.hash || service.pathname !== '/') throw new Error();
        const endpoint = new URL('/doc', service);
        endpoint.searchParams.set('id', reference.path);
        endpoint.searchParams.set('source_type', 'admin-manual');
        const response = await fetch(endpoint, { signal: AbortSignal.timeout(20000), redirect: 'error', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error();
        documents.set(reference.path, await response.json());
      }
      resolved[name] = documentAssignment(documents.get(reference.path), reference.path, reference.variable);
    } catch { failures.push(name); }
  }
  // Publish only after every requested pointer succeeds; do not partially mutate on failure.
  if(failures.length)throw new Error(failures.join(', '));
  for (const [name, value] of Object.entries(resolved)) process.env[name] = value;
  return resolved;
}
