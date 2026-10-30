import { readFile, writeFile, unlink, mkdir, stat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { parse } from 'dotenv';
import { resolveAccountEnvironment } from './resolve-build-env.mjs';
import { BILLING_CONFIG_SECRET, runtimeBindings, optionalRuntimeBindings } from '../functions/src/runtime-config.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const digest = value => createHash('sha256').update(value).digest('hex');
const sleep = ms => new Promise(done => setTimeout(done, ms));
const error = name => { throw new Error(name); };
async function assignments(path) { try { return parse(await readFile(path, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; } }

function apiPointer(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'kstore:' || url.hostname !== 'admin-manual' || url.username || url.password || url.port || url.search) throw new Error();
    const id = decodeURIComponent(url.pathname.slice(1)); const variable = decodeURIComponent(url.hash.slice(1));
    if (!id || id.split('/').some(part => !part || part === '.' || part === '..') || /[\\\x00-\x1f]/.test(id) || variable !== 'VITE_SQUASH_API_BASE_URL') throw new Error();
    return { id, variable };
  } catch { error('VITE_SQUASH_API_BASE_URL'); }
}
async function canonicalDocument(service, pointer) {
  const url = new URL('/doc', service); url.searchParams.set('id', pointer.id); url.searchParams.set('source_type', 'admin-manual');
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok) error('CANONICAL_API_DOCUMENT_READ');
  const doc = await response.json();
  if (doc.exact !== true || doc.path !== pointer.id || doc.source_type !== 'admin-manual' || typeof doc.content !== 'string') error('CANONICAL_API_DOCUMENT_IDENTITY');
  return doc;
}
function withApiAssignment(content, variable, value) {
  let count = 0;
  const updated = content.replace(/^```(?:dotenv|env)[ \t]*\r?\n([\s\S]*?)^```[ \t]*\r?$/gm, (fence, body) => {
    const pattern = new RegExp(`^([ \\t]*(?:export[ \\t]+)?${variable}[ \\t]*=[ \\t]*)([^\\r\\n]*)`, 'gm');
    const replacement = body.replace(pattern, (_, prefix, rhs) => {
      count++;
      let quote = null, escaped = false, comment = rhs.length;
      for (let i = 0; i < rhs.length; i++) {
        const char = rhs[i];
        if (escaped) { escaped = false; continue; }
        if (quote === '"' && char === '\\') { escaped = true; continue; }
        if (quote) { if (char === quote) quote = null; continue; }
        if (char === '"' || char === "'") { quote = char; continue; }
        if (char === '#') { comment = i; break; }
      }
      const gap = rhs.slice(0, comment).match(/\s*$/)[0];
      return prefix + JSON.stringify(value) + (comment < rhs.length ? gap + rhs.slice(comment) : gap);
    });
    return fence.replace(body, replacement);
  });
  if (count > 1) error('CANONICAL_API_DOCUMENT_DUPLICATE_ASSIGNMENT');
  return count ? updated : `${content}${content.endsWith('\n') ? '' : '\n'}\n<!-- Squash billing: verified deployed HTTP function endpoint. -->\n\`\`\`dotenv\n${variable}=${JSON.stringify(value)}\n\`\`\`\n`;
}
async function publishApi(service, pointer, original, url) {
  const latest = await canonicalDocument(service, pointer);
  if (latest.revision !== original.revision || latest.content !== original.content) error('CANONICAL_API_DOCUMENT_CHANGED');
  const content = withApiAssignment(latest.content, pointer.variable, url);
  if (content !== latest.content) {
    const response = await fetch(new URL('/doc/write', service), { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pointer.id, source_type: 'admin-manual', ...(typeof latest.title === 'string' ? { title: latest.title } : {}), mode: 'replace', content }) });
    if (!response.ok) error('CANONICAL_API_DOCUMENT_WRITE');
  }
  const verified = await canonicalDocument(service, pointer);
  if (verified.content !== content) error('CANONICAL_API_DOCUMENT_READBACK');
  return { document: pointer.id, revision: verified.revision ?? null, sha256: digest(content) };
}

async function main() {
  if (process.env.SQUASH_BUILD_ALL_CONTEXT !== '1') error('Use root build_all.sh --deploy-account.');
  const config = await resolveAccountEnvironment(root);
  // Validate syntax before any API enablement, secret version or deployment.
  for (const name of ['CHECKOUT_SUCCESS_URL', 'CHECKOUT_CANCEL_URL', 'BILLING_RETURN_URL', 'ACCOUNT_AUTH_URL']) {
    let url;
    try { url = new URL(config[name]); } catch { error(name); }
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) error(name);
  }
  if (config.PLAY_LISTING_URL) {
    let url;
    try { url = new URL(config.PLAY_LISTING_URL); } catch { error('PLAY_LISTING_URL'); }
    if (url.protocol !== 'https:' || url.hostname !== 'play.google.com' || url.pathname !== '/store/apps/details' || !url.searchParams.get('id') || url.searchParams.get('id') !== config.PLAY_PACKAGE_NAME || url.username || url.password || url.hash) error('PLAY_LISTING_URL');
  }
  const origins = config.BILLING_ALLOWED_ORIGINS.split(',').map(value => value.trim());
  if (!origins.length || origins.some(value => !value || value === '*' || value === 'null')) error('BILLING_ALLOWED_ORIGINS');
  for (const value of origins) {
    let origin;
    try { origin = new URL(value); } catch { error('BILLING_ALLOWED_ORIGINS'); }
    const nativeOrigin = value === 'tauri://localhost';
    const loopbackHttp = origin.protocol === 'http:' && ['localhost', 'tauri.localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
    if ((!nativeOrigin && origin.protocol !== 'https:' && !loopbackHttp) || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '' && origin.pathname !== '/' || (!nativeOrigin && origin.origin !== value)) error('BILLING_ALLOWED_ORIGINS');
  }
  const project = config.FIREBASE_PROJECT_ID;
  if (!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project)) error('FIREBASE_PROJECT_ID');
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(config.SQUASH_PRODUCT_ID)) error('SQUASH_PRODUCT_ID');
  if (!/^[a-z][a-z0-9-]{2,61}[a-z0-9]$/.test(config.FIRESTORE_DATABASE_ID)) error('FIRESTORE_DATABASE_ID');
  const cliPath = resolve(config.FIREBASE_CLI_PATH); if (!(await stat(cliPath)).isFile()) error('FIREBASE_CLI_PATH');
  const require = createRequire(import.meta.url);
  const auth = require(resolve(dirname(cliPath), '..', 'auth.js'));
  const account = auth.getProjectDefaultAccount(root);
  if (!account?.tokens?.refresh_token) error('FIREBASE_AUTH_SESSION');
  const api = async (origin, path, { method = 'GET', body, allow = [] } = {}) => {
    const tokens = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
    const response = await fetch(`${origin}/v1/${path}`, { method, signal: AbortSignal.timeout(60000), headers: { Authorization: `Bearer ${tokens.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (allow.includes(response.status)) return { httpStatus: response.status };
    if (!response.ok) error(`ACCOUNT_DEPLOY_API_${response.status}`);
    return response.status === 204 ? {} : response.json();
  };
  const raw = { ...await assignments(join(root, '.env')), ...await assignments(join(root, 'functions/.env')), ...await assignments(join(root, '.env.local')), ...await assignments(join(root, 'functions/.env.local')), ...process.env };
  const pointer = apiPointer(raw.VITE_SQUASH_API_BASE_URL);
  const service = new URL(config.KSTORE_URL);
  if (!['https:', 'http:'].includes(service.protocol) || service.username || service.password || service.search || service.hash || service.pathname !== '/') error('KSTORE_URL');
  const original = await canonicalDocument(service, pointer);
  const projectInfo = await api('https://cloudresourcemanager.googleapis.com', `projects/${project}`);
  if (!projectInfo.projectNumber) error('FIREBASE_PROJECT_READBACK');
  // Confirm the configured database exists before any mutation or deployment.
  await api('https://firestore.googleapis.com', `projects/${project}/databases/${config.FIRESTORE_DATABASE_ID}`);
  const rulesOrigin = 'https://firebaserules.googleapis.com';
  const rulesRelease = `projects/${project}/releases/cloud.firestore/${config.FIRESTORE_DATABASE_ID}`;
  const releaseBefore = await api(rulesOrigin, rulesRelease);
  const ruleSetBefore = await api(rulesOrigin, releaseBefore.rulesetName);
  const normalizeRules = text => text.replace(/\/\/[^\r\n]*/g, '').replace(/\s+/g, '').replace(/"/g, "'");
  const remoteRules = normalizeRules((ruleSetBefore.source?.files || []).map(file => file.content).join('\n'));
  const localRules = normalizeRules(await readFile(join(root, 'firestore.rules'), 'utf8'));
  const initialRules = normalizeRules("rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if false; } } }");
  if (remoteRules !== initialRules && remoteRules !== localRules) error('NAMED_DATABASE_RULES_CHANGED');
  const runtime = Object.fromEntries([...runtimeBindings, ...optionalRuntimeBindings].filter(name => config[name] !== undefined).sort().map(name => [name, config[name]]));
  const payload = JSON.stringify(runtime);
  if (Buffer.byteLength(payload) > 64000) error('BILLING_CONFIG_SECRET_SIZE');
  const servicePath = `projects/${projectInfo.projectNumber}/services/secretmanager.googleapis.com`;
  const enabled = await api('https://serviceusage.googleapis.com', servicePath);
  if (enabled.state !== 'ENABLED') {
    let operation = await api('https://serviceusage.googleapis.com', `${servicePath}:enable`, { method: 'POST', body: {} });
    for (let attempt = 0; !operation.done && attempt < 60; attempt++) { await sleep(2000); operation = await api('https://serviceusage.googleapis.com', operation.name); }
    if (!operation.done || operation.error) error('SECRET_MANAGER_ENABLE');
  }
  const secrets = 'https://secretmanager.googleapis.com';
  const secretPath = `projects/${project}/secrets/${BILLING_CONFIG_SECRET}`;
  let existing = await api(secrets, secretPath, { allow: [404] });
  if (existing.httpStatus === 404) existing = await api(secrets, `projects/${project}/secrets?secretId=${BILLING_CONFIG_SECRET}`, { method: 'POST', body: { replication: { automatic: {} }, labels: { application_product: config.SQUASH_PRODUCT_ID } } });
  if (existing.labels?.application_product && existing.labels.application_product !== config.SQUASH_PRODUCT_ID) error('BILLING_CONFIG_SECRET_OWNER');
  const prior = await api(secrets, `${secretPath}/versions/latest:access`, { allow: [404] });
  let identical = false;
  if (prior.httpStatus !== 404) {
    let values; try { values = JSON.parse(Buffer.from(prior.payload.data, 'base64').toString('utf8')); } catch { error('BILLING_CONFIG_SECRET_EXISTING_FORMAT'); }
    if (values.SQUASH_PRODUCT_ID !== config.SQUASH_PRODUCT_ID) error('BILLING_CONFIG_SECRET_OWNER');
    identical = JSON.stringify(Object.fromEntries(Object.entries(values).sort(([a], [b]) => a.localeCompare(b)))) === payload;
  }
  const version = identical ? prior.name : (await api(secrets, `${secretPath}:addVersion`, { method: 'POST', body: { payload: { data: Buffer.from(payload).toString('base64') } } })).name;
  const versionReadback = await api(secrets, `${version}:access`);
  if (Buffer.from(versionReadback.payload.data, 'base64').toString('utf8') !== (identical ? Buffer.from(prior.payload.data, 'base64').toString('utf8') : payload)) error('BILLING_CONFIG_SECRET_READBACK');
  // Preserve every previous secret version; never prune or destroy during deploy.
  const generated = join(root, `.firebase.billing.${randomUUID()}.json`);
  const generatedConfig = { functions: [{ source: 'functions', codebase: 'billing', runtime: 'nodejs22' }], firestore: [{ database: config.FIRESTORE_DATABASE_ID, rules: 'firestore.rules', indexes: 'firestore.indexes.json' }] };
  if ((await api(rulesOrigin, rulesRelease)).rulesetName !== releaseBefore.rulesetName) error('NAMED_DATABASE_RULES_CHANGED');
  await writeFile(generated, JSON.stringify(generatedConfig, null, 2) + '\n', { flag: 'wx' });
  try {
    const redact = text => { for (const value of Object.values(runtime)) if (typeof value === 'string' && value.length > 5) text = text.split(value).join('[binding]'); return text; };
    await new Promise((done, reject) => {
      const deployEnv = { ...process.env };
      for (const name of [...runtimeBindings, ...optionalRuntimeBindings, BILLING_CONFIG_SECRET]) delete deployEnv[name];
      delete deployEnv.DEBUG;
      const child = spawn(process.execPath, [cliPath, 'deploy', '--config', generated, '--only', 'functions:billing,firestore', '--project', project, '--non-interactive'], { cwd: root, windowsHide: true, env: deployEnv, stdio: ['ignore', 'pipe', 'pipe'] });
      for (const stream of [child.stdout, child.stderr]) {
        let pending = ''; stream.setEncoding('utf8');
        stream.on('data', chunk => { pending += chunk; const lines = pending.split('\n'); pending = lines.pop(); for (const line of lines) console.log(redact(line)); });
        stream.on('end', () => { if (pending) console.log(redact(pending)); });
      }
      child.on('error', () => reject(new Error('FIREBASE_DEPLOY_START')));
      child.on('exit', code => code === 0 ? done() : reject(new Error('FIREBASE_DEPLOY_FAILED')));
    });
  } finally { await unlink(generated); }
  const readFunction = async name => {
    const tokens = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
    const response = await fetch(`https://cloudfunctions.googleapis.com/v2/projects/${project}/locations/us-central1/functions/${name}`, { signal: AbortSignal.timeout(60000), headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!response.ok) error('FUNCTION_READBACK');
    const fn = await response.json();
    const binding = fn.serviceConfig?.secretEnvironmentVariables?.find(item => item.key === BILLING_CONFIG_SECRET && item.secret === BILLING_CONFIG_SECRET);
    const expectedVersion = version.split('/').at(-1);
    if (fn.state !== 'ACTIVE' || !fn.serviceConfig?.serviceAccountEmail || !binding || binding.version !== expectedVersion || ![project, String(projectInfo.projectNumber)].includes(binding.projectId)) error('FUNCTION_RUNTIME_READBACK');
    return { name, state: fn.state, uri: fn.serviceConfig.uri, serviceAccount: fn.serviceConfig.serviceAccountEmail, secret: { key: binding.key, version: binding.version } };
  };
  const functions = await Promise.all(['billingApi', 'reconcileBilling'].map(readFunction));
  const url = new URL(functions.find(fn => fn.name === 'billingApi').uri);
  if (url.protocol !== 'https:' || url.username || url.password) error('FUNCTION_URL_READBACK');
  const publicCatalog = await fetch(`${url.href.replace(/\/$/, '')}/catalog?platform=android`, { signal: AbortSignal.timeout(30000), redirect: 'error' });
  if (!publicCatalog.ok) error('FUNCTION_PUBLIC_INVOCATION');
  const catalog = await publicCatalog.json();
  if (!Array.isArray(catalog.offers) || catalog.offers.length !== 4) error('FUNCTION_CATALOG_READBACK');
  const privateAccount = await fetch(`${url.href.replace(/\/$/, '')}/account`, { signal: AbortSignal.timeout(30000), redirect: 'error' });
  if (privateAccount.status !== 401) error('FUNCTION_ROUTE_AUTH_READBACK');
  const canonical = await publishApi(service, pointer, original, url.href.replace(/\/$/, ''));
  await mkdir(join(root, 'builds/account'), { recursive: true });
  await writeFile(join(root, 'builds/account/account-deployment.json'), JSON.stringify({ verifiedAt: new Date().toISOString(), project, database: config.FIRESTORE_DATABASE_ID, product: config.SQUASH_PRODUCT_ID, functions, canonical }, null, 2) + '\n');
  console.log('Account functions ACTIVE; exact API URL saved and canonically read back.');
}
main().catch(e => {
  const diagnostic = /^[A-Z_0-9, ]+$/.test(e.message || '') ? e.message : 'ACCOUNT_DEPLOYMENT_FAILED';
  console.error(diagnostic);
  console.error('Account deployment did not complete. Completed cloud stages are retained; no automatic rollback or secret-version deletion was attempted.');
  process.exitCode = 1;
});
