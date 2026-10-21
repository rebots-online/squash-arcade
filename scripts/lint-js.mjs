// Defect lint for the JS sources: runs the TypeScript checker over src/ with
// checkJs, but only fails on diagnostics that are real defects (syntax errors,
// undefined names, missing modules, missing/misnamed exports). Type-inference
// noise from untyped three.js code is ignored on purpose.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

// Specifiers that vite.config.ts `resolve.alias` rewrites at bundle time; tsc
// cannot see those, so "Cannot find module" for them is not a defect.
const viteAliases = new Set(
  [...fs.readFileSync('vite.config.ts', 'utf8').matchAll(/^\s*'([^']+)':\s*'[^']+',?$/gm)].map((m) => m[1])
);
const isAliasedModuleMiss = (d) =>
  d.code === 2307 && [...viteAliases].some((alias) => ts.flattenDiagnosticMessageText(d.messageText, '').includes(`'${alias}'`));

const DEFECT_CODES = new Set([
  2304, // Cannot find name 'x'
  2552, // Cannot find name 'x'. Did you mean 'y'?
  2305, // Module has no exported member
  2614, // Module has no exported member (did you mean default import?)
  2724, // Module has no exported member named 'x'. Did you mean 'y'?
  2307, // Cannot find module
  2448, // Block-scoped variable used before its declaration
  2451, // Cannot redeclare block-scoped variable
  2300, // Duplicate identifier
  1192 // Module has no default export
]);

const configPath = path.resolve('tsconfig.json');
const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configPath), {
  checkJs: true,
  noEmit: true
});
const program = ts.createProgram(parsed.fileNames, parsed.options);

const diagnostics = [
  ...program.getSyntacticDiagnostics(),
  ...program.getSemanticDiagnostics().filter((d) => DEFECT_CODES.has(d.code) && !isAliasedModuleMiss(d))
].filter((d) => !d.file || !d.file.fileName.includes('/node_modules/'));

for (const d of diagnostics) {
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  if (d.file && d.start !== undefined) {
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
    console.error(`${path.relative(process.cwd(), d.file.fileName)}:${line + 1}:${character + 1} TS${d.code} ${msg}`);
  } else {
    console.error(`TS${d.code} ${msg}`);
  }
}
console.log(`lint-js: ${parsed.fileNames.length} files checked, ${diagnostics.length} defect(s)`);
process.exit(diagnostics.length > 0 ? 1 : 0);
