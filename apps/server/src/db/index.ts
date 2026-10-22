import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { config } from '../config.js';
export interface SQL { query<T=any>(sql:string,params?:unknown[]):Promise<{rows:T[]}> }
export class Database implements SQL {
  private pool?:pg.Pool;
  private embedded?:PGlite;
  private queue:Promise<unknown>=Promise.resolve();
  readonly mode: 'postgres'|'embedded-postgres';
  constructor(url=config.databaseUrl, directory=config.dataDir) { this.mode=url?'postgres':'embedded-postgres';if(url)this.pool=new pg.Pool({connectionString:url,max:10});else this.embedded=new PGlite(directory); }
  async initialize() { const dir=resolve('apps/server/src/db/migrations');for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile(resolve(dir,file),'utf8');if(this.pool)await this.pool.query(sql);else await this.embedded!.exec(sql);} }
  async query<T=any>(sql:string,params:unknown[]=[]):Promise<{rows:T[]}> { if(this.pool)return this.pool.query(sql,params as any[]) as any;return this.exclusive(()=>this.embedded!.query<T>(sql,params)); }
  private async exclusive<T>(fn:()=>Promise<T>):Promise<T> { const prior=this.queue;let release!:()=>void;this.queue=new Promise<void>(r=>{release=r});await prior;try{return await fn();}finally{release();} }
  async transaction<T>(fn:(tx:SQL)=>Promise<T>):Promise<T> {
    if(this.pool) { const c=await this.pool.connect();try{await c.query('BEGIN');const value=await fn(c as SQL);await c.query('COMMIT');return value;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();} }
    return this.exclusive(async()=>{await this.embedded!.exec('BEGIN');try{const value=await fn({query:async<T=any>(s:string,p:unknown[]=[])=>this.embedded!.query<T>(s,p)});await this.embedded!.exec('COMMIT');return value;}catch(e){await this.embedded!.exec('ROLLBACK');throw e;}});
  }
  async close(){if(this.pool)await this.pool.end();else await this.embedded!.close();}
}
