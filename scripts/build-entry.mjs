import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const shell=process.platform==='win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const child=spawn(shell,[resolve(import.meta.dirname,'../build_all.sh'),...process.argv.slice(2)],{stdio:'inherit',windowsHide:true});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
