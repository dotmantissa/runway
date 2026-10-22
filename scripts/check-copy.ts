import { readdir,readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const files:string[]=[];
async function walk(dir:string){for(const item of await readdir(dir,{withFileTypes:true})){const file=resolve(dir,item.name);if(item.isDirectory())await walk(file);else if(/\.(tsx|html)$/.test(item.name))files.push(file);}}
await walk('apps/web/src');files.push(resolve('apps/web/index.html'));
let failed=false;
for(const file of files){const copy=await readFile(file,'utf8');if(/[\u2014\p{Extended_Pictographic}]/u.test(copy)){console.error('Em dash or emoji found in '+file);failed=true;}}
if(failed)process.exitCode=1;else console.log('Product copy contains no em dashes or emoji.');
