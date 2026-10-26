import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { requireBuildAll } from './build-context.mjs';
requireBuildAll();

// Metadata preparation inside the frozen build snapshot. build-all advances MINOR.
const version = (await readFile('version.txt','utf8')).trim();
const pkg = JSON.parse(await readFile('package.json','utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version) || pkg.version !== version) {
  throw new Error('version.txt and package.json must agree before building.');
}
const sourceCommit = process.env.SQUASH_SOURCE_COMMIT || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await writeFile('public/deployment.json', JSON.stringify({
  version, sourceCommit, sourceHash: process.env.SQUASH_SOURCE_HASH || null,
  builtAt: process.env.SQUASH_BUILT_AT || new Date().toISOString()
},null,2)+'\n');
console.log(`Prepared metadata for ${version}; source version is unchanged.`);
