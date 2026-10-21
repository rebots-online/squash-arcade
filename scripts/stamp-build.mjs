import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = new URL('../', import.meta.url);
const versionPath = new URL('version.txt', projectRoot);
const packagePath = new URL('package.json', projectRoot);
const deploymentPath = new URL('public/deployment.json', projectRoot);

const canonical = (await readFile(versionPath, 'utf8')).trim();
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(canonical);
if (!match) {
  throw new Error('version.txt must contain exactly MAJOR.MINOR.BUILD using three nonnegative integers.');
}
const [major, minor, previousBuild] = match.slice(1).map(Number);
if (![major, minor, previousBuild, minor + 1].every(Number.isSafeInteger)) {
  throw new Error('version.txt components and the next MINOR must be safe integers; correct the canonical version before building.');
}

let packageInfo;
try {
  packageInfo = JSON.parse(await readFile(packagePath, 'utf8'));
} catch (error) {
  throw new Error(`Cannot read package.json for build stamping: ${error.message}. Correct the file and rerun npm run build.`, { cause: error });
}
if (!packageInfo || typeof packageInfo !== 'object' || Array.isArray(packageInfo)) {
  throw new Error('package.json must contain a JSON object before build stamping can update its version.');
}

const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: fileURLToPath(projectRoot),
  encoding: 'utf8'
}).trim();
const buildTime = new Date();
const build = String(Math.floor(buildTime.getTime() / 60000) % 100000).padStart(5, '0');
const version = `${major}.${minor + 1}.${build}`;
const builtAt = buildTime.toISOString();
packageInfo.version = version;

await writeFile(versionPath, `${version}\n`);
await writeFile(packagePath, `${JSON.stringify(packageInfo, null, 2)}\n`);
await writeFile(deploymentPath, `${JSON.stringify({ version, sourceCommit, builtAt }, null, 2)}\n`);
console.log(`Stamped build ${version} from ${sourceCommit}`);
