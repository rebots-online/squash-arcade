import { loadEnv } from 'vite';

// Only explicitly public application bindings may enter the frontend build.
// Canonical credential resolution happens in the invoking operator runtime;
// unresolved pointers fail by name and are never bundled as a value.
export const accountPublicBindings = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_SQUASH_API_BASE_URL',
  'VITE_ACCOUNT_AUTH_URL'
];

export function accountBuildEnvironment(root) {
  const configured = loadEnv('production', root, 'VITE_');
  const result = {};
  for (const name of accountPublicBindings) {
    const value = (process.env[name] ?? configured[name] ?? '').trim();
    if (!value || /^(?:kstore|secret|pointer):/i.test(value)) {
      throw new Error(`Required resolved account binding: ${name}`);
    }
    result[name] = value;
  }
  for (const name of ['VITE_SQUASH_API_BASE_URL', 'VITE_ACCOUNT_AUTH_URL']) {
    let url;
    try { url = new URL(result[name]); } catch { throw new Error(`Invalid HTTPS account binding: ${name}`); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Invalid HTTPS account binding: ${name}`);
  }
  // Preserve existing optional gameplay tuning from the full annotated env.
  for (const [name, value] of Object.entries(configured)) {
    if (name.startsWith('VITE_SA_')) result[name] = process.env[name] ?? value;
  }
  return result;
}
