import { accountAuth } from './firebase.js';

export async function accountRequest(path, { method = 'GET', body, anonymous = false, signal } = {}) {
  const base = import.meta.env.VITE_SQUASH_API_BASE_URL;
  if (!base) throw new Error('Account configuration requires VITE_SQUASH_API_BASE_URL.');
  const headers = { 'Content-Type': 'application/json' };
  if (!anonymous) {
    const user = accountAuth().currentUser;
    if (!user) throw new Error('Sign in to view your account.');
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  const timeout = AbortSignal.timeout(20000);
  const response = await fetch(`${base.replace(/\/$/, '')}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error?.message || 'Account request could not be completed. Retry.');
    error.code = result.error?.code;
    throw error;
  }
  return result;
}
