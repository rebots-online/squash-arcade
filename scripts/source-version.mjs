import { readFile, writeFile } from 'node:fs/promises';

export async function setSourceVersion(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid source version.');
  const pkg=JSON.parse(await readFile('package.json','utf8'));
  const lock=JSON.parse(await readFile('package-lock.json','utf8'));
  const cargo=await readFile('src-tauri/Cargo.toml','utf8');
  pkg.version=version;lock.version=version;lock.packages[''].version=version;
  await writeFile('package.json',JSON.stringify(pkg,null,2)+'\n');
  await writeFile('package-lock.json',JSON.stringify(lock,null,2)+'\n');
  await writeFile('src-tauri/Cargo.toml',cargo.replace(/^version = "[^"]+"/m,`version = "${version}"`));
  try {
    const cargoLock=await readFile('src-tauri/Cargo.lock','utf8');
    await writeFile('src-tauri/Cargo.lock',cargoLock.replace(/(\[\[package\]\]\r?\nname = "squash-arcade"\r?\nversion = ")[^"]+/,(_,prefix)=>prefix+version));
  } catch(error) { if(error.code!=='ENOENT') throw error; }
  // Commit marker for the version update: write the canonical file last.
  await writeFile('version.txt',version+'\n');
}
