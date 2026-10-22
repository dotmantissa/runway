export class ApiError extends Error {
 constructor(public code:string,message:string,public fields:{field:string;message:string}[]=[],public requestId?:string){super(message);}
}
let csrf='';
export function setCsrf(value:string){csrf=value;}
export async function api<T=any>(path:string,method='GET',body?:unknown,key=crypto.randomUUID()):Promise<T>{
 const response=await fetch('/api/v1'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json',...(method!=='GET'?{'X-CSRF-Token':csrf,'Idempotency-Key':key}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const result=await response.json();
 if(!response.ok)throw new ApiError(result.error?.code||'REQUEST_FAILED',result.error?.message||'We could not complete this request.',result.error?.fieldErrors||[],result.requestId);
 if(result.csrf)setCsrf(result.csrf);return result;
}
