export const ENGINE_VERSION = 'runway-prefix-1.0.0';
export const USDC = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
export type Scenario = 'promised' | 'history_median' | 'observed_latest' | 'no_receipt';
export type HistoryMode = 'none' | 'walrus' | 'postgres';
export type Source = 'synthetic_replay' | 'user_confirmed' | 'tatum_verified';
export interface Account { id: string; alias: string; kind: 'manual' | 'sui'; address?: string; amountAtomic: string; included: boolean; confirmedAt: string; version: number; source: Source; reconciliationPending?: boolean }
export interface Client { id: string; alias: string; sender?: string; version: number; archived?: boolean }
export interface Invoice { id: string; clientId: string; invoiceReference: string; amountAtomic: string; paidAtomic: string; dueDate: string; timezone: string; version: number; status: 'expected' | 'partial' | 'paid' | 'cancelled' }
export interface Expense { id: string; label: string; amountAtomic: string; dueDate: string; kind: 'fixed' | 'flexible'; maxReductionAtomic: string; status: 'planned' | 'paid' | 'cancelled' | 'pending'; version: number; hasNotOccurredToday?: boolean }
export interface Outcome { id: string; invoiceId: string; clientId: string; dueDate: string; paidDate: string; amountAtomic: string; source: Source; supersedesId?: string; recordedAt: string; receiptDigest?: string }
export interface Policy { reserveAtomic: string; horizonDays: number; timezone: string; version: number }
export interface PlanningInput { stateVersion: number; asOf: string; localToday: string; horizonEnd: string; timezone: string; confirmedFundsAtomic: string; reserveFloorAtomic: string; pendingAtomic: string; expenses: Expense[]; invoices: Invoice[] }
export interface TimelineEvent { id: string; date: string; type: 'opening' | 'expense' | 'receipt'; label: string; amountAtomic: string; balanceBeforeAtomic: string; balanceAfterAtomic: string; belowFloorAtomic: string; uncoveredAtomic: string; uncertain: boolean; fixed: boolean; sourceIds: string[] }
export interface Breach { eventId: string; label: string; date: string; gapAtomic: string; uncoveredAtomic: string }
export interface Adjustment { expenseId: string; label: string; dueDate: string; expectedExpenseVersion: number; originalAmountAtomic: string; newAmountAtomic: string; reductionAtomic: string; capAtomic: string }
export interface PlanResult { engineVersion: string; stateVersion: number; scenario: Scenario; historyMode: HistoryMode; freshness: 'fresh' | 'stale' | 'incomplete'; availableNowAtomic: string; commitmentShortageAtomic: string; confirmedFundsAtomic: string; reserveFloorAtomic: string; plannedSpendingAtomic: string; feasible: boolean; firstReserveBreach: Breach | null; firstExposedFixedBill: Breach | null; timeline: TimelineEvent[]; adjustedTimeline: TimelineEvent[]; adjustments: Adjustment[]; totalReductionAtomic: string; residualGaps: Breach[]; dependsOnUnsettledReceipt: boolean; selectedHistoryRecordIds: string[]; uncertainty: { sampleCount: number; observedDelayMin?: number; observedDelayMax?: number; medianDelay?: number }; forecastDates: Record<string,string> }
const max = (a: bigint, b: bigint) => a > b ? a : b;
const min = (a: bigint, b: bigint) => a < b ? a : b;
export function parseMoney(value: string): string {
  if (!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(value.trim())) throw new Error('Enter a positive amount with up to six decimal places.');
  const [whole, fraction = ''] = value.trim().split('.');
  return (BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'))).toString();
}
export function formatMoney(atomic: string, exact = false): string {
  const n = BigInt(atomic), a = n < 0n ? -n : n;
  const whole = (a / 1_000_000n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const frac = (a % 1_000_000n).toString().padStart(6,'0');
  const shown = exact ? frac.replace(/0+$/, '') : frac.slice(0,2).replace(/0+$/, '');
  return `${n < 0n ? '−' : ''}${whole}${shown ? '.'+shown : ''}`;
}
export function moneyInput(atomic: string) { return formatMoney(atomic,true).replaceAll(',',''); }
export function validDate(date: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date+'T00:00:00Z')) && new Date(date+'T00:00:00Z').toISOString().slice(0,10) === date; }
export function addDays(date: string, days: number): string { if (!validDate(date)) throw new Error('Invalid calendar date.'); const d = new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10); }
export function daysBetween(a: string, b: string): number { if (!validDate(a)||!validDate(b)) throw new Error('Invalid calendar date.'); return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000); }
export function localDate(instant: string, timezone: string): string { const parts = new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(instant)); const get=(t:string)=>parts.find(p=>p.type===t)!.value; return `${get('year')}-${get('month')}-${get('day')}`; }
export function activeOutcomes(outcomes: Outcome[]): Outcome[] {
  const replaced = new Set(outcomes.flatMap(o=>o.supersedesId ? [o.supersedesId] : []));
  return [...new Map(outcomes.filter(o=>!replaced.has(o.id)).map(o=>[o.id,o])).values()].sort((a,b)=>a.paidDate.localeCompare(b.paidDate)||a.id.localeCompare(b.id));
}
export function timing(outcomes: Outcome[], clientId: string) {
  const rows = activeOutcomes(outcomes).filter(o=>o.clientId===clientId).slice(-8);
  const delays=rows.map(o=>daysBetween(o.dueDate,o.paidDate)).sort((a,b)=>a-b);
  const median = delays.length ? Math.ceil((delays[Math.floor((delays.length-1)/2)]+delays[Math.floor(delays.length/2)])/2) : undefined;
  return { sampleCount:rows.length, medianDelay:rows.length>=4 ? median : undefined, observedDelayMin:delays[0], observedDelayMax:delays.at(-1), ids:rows.map(o=>o.id) };
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (value && typeof value==='object') return '{'+Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
  return JSON.stringify(value);
}
export function normalizeInput(input: PlanningInput) { return {...input,expenses:[...input.expenses].sort((a,b)=>a.id.localeCompare(b.id)),invoices:[...input.invoices].sort((a,b)=>a.id.localeCompare(b.id))}; }
export function normalizeHistory(history: Outcome[]) { return [...history].sort((a,b)=>a.id.localeCompare(b.id)); }
export function plan(input: PlanningInput, history: Outcome[], scenario: Scenario, historyMode: HistoryMode): PlanResult {
  const floor=BigInt(input.reserveFloorAtomic), opening=BigInt(input.confirmedFundsAtomic)-BigInt(input.pendingAtomic);
  const expenses=input.expenses.filter(e=>e.status!=='paid'&&e.status!=='cancelled'&&e.dueDate<=input.horizonEnd);
  const spending=expenses.reduce((s,e)=>s+BigInt(e.amountAtomic),0n);
  const raw=opening-spending-floor;
  const selected=new Set<string>(), forecastDates:Record<string,string>={};
  const effective=historyMode==='none'? [] : history;
  const stats=input.invoices.filter(i=>i.status!=='paid'&&i.status!=='cancelled').map(i=>timing(effective,i.clientId));
  type Event = {id:string;date:string;type:'expense'|'receipt';label:string;amount:bigint;fixed:boolean;uncertain:boolean;sourceIds:string[]};
  const events:Event[]=expenses.map(e=>({id:e.id,date:e.dueDate<input.localToday?input.localToday:e.dueDate,type:'expense',label:e.label,amount:BigInt(e.amountAtomic),fixed:e.kind==='fixed',uncertain:false,sourceIds:[e.id]}));
  if(scenario!=='no_receipt') for(const i of input.invoices.filter(i=>i.status!=='paid'&&i.status!=='cancelled')) {
    const t=timing(effective,i.clientId);
    if((scenario==='history_median'||scenario==='observed_latest')&&t.medianDelay===undefined) throw new Error('There is not enough payment history for a timing estimate yet.');
    const delay=scenario==='promised'?0:scenario==='observed_latest'?t.observedDelayMax!:t.medianDelay!;
    let date=addDays(i.dueDate,delay);if(date<input.localToday) date=input.localToday;
    forecastDates[i.id]=date;
    if(scenario!=='promised') t.ids.forEach(id=>selected.add(id));
    if(date<=input.horizonEnd) events.push({id:i.id,date,type:'receipt',label:i.invoiceReference,amount:BigInt(i.amountAtomic)-BigInt(i.paidAtomic),fixed:false,uncertain:true,sourceIds:[i.id,...(scenario==='promised'?[]:t.ids)]});
  }
  events.sort((a,b)=>a.date.localeCompare(b.date)||(a.type==='expense'?-1:1)-(b.type==='expense'?-1:1)||a.id.localeCompare(b.id));
  const reductions=new Map<string,bigint>();
  function timeline():TimelineEvent[] {
    let balance=opening;
    const rows:TimelineEvent[]=[{id:'opening',date:input.localToday,type:'opening',label:'Confirmed opening funds',amountAtomic:opening.toString(),balanceBeforeAtomic:opening.toString(),balanceAfterAtomic:opening.toString(),belowFloorAtomic:max(0n,floor-opening).toString(),uncoveredAtomic:'0',uncertain:false,fixed:false,sourceIds:[]}];
    for(const e of events) { const amount=e.amount-(reductions.get(e.id)||0n), before=balance;balance+=e.type==='receipt'?amount:-amount;rows.push({id:e.id,date:e.date,type:e.type,label:e.label,amountAtomic:amount.toString(),balanceBeforeAtomic:before.toString(),balanceAfterAtomic:balance.toString(),belowFloorAtomic:max(0n,floor-balance).toString(),uncoveredAtomic:e.type==='expense'?max(0n,amount-max(0n,before)).toString():'0',uncertain:e.uncertain,fixed:e.fixed,sourceIds:e.sourceIds}); }
    return rows;
  }
  const original=timeline();
  for(let k=0;k<=events.length;k++) {
    const row=timeline()[k];let deficit=BigInt(row.belowFloorAtomic);
    if(deficit===0n) continue;
    const priorIds=new Set(events.slice(0,k).filter(e=>e.type==='expense').map(e=>e.id));
    const eligible=expenses.filter(e=>priorIds.has(e.id)&&e.kind==='flexible'&&e.status==='planned'&&(e.dueDate>input.localToday||(e.dueDate===input.localToday&&e.hasNotOccurredToday))&&BigInt(e.maxReductionAtomic)>0n).sort((a,b)=>b.dueDate.localeCompare(a.dueDate)||a.id.localeCompare(b.id));
    for(const e of eligible) { const already=reductions.get(e.id)||0n;const delta=min(deficit,max(0n,min(BigInt(e.amountAtomic),BigInt(e.maxReductionAtomic))-already));reductions.set(e.id,already+delta);deficit-=delta;if(deficit===0n) break; }
  }
  const adjusted=timeline();
  const breach=(r:TimelineEvent):Breach=>({eventId:r.id,label:r.label,date:r.date,gapAtomic:r.belowFloorAtomic,uncoveredAtomic:r.uncoveredAtomic});
  const gaps=adjusted.filter(r=>BigInt(r.belowFloorAtomic)>0n).map(breach);
  const adjustments:Adjustment[]=expenses.filter(e=>(reductions.get(e.id)||0n)>0n).map(e=>({expenseId:e.id,label:e.label,dueDate:e.dueDate,expectedExpenseVersion:e.version,originalAmountAtomic:e.amountAtomic,newAmountAtomic:(BigInt(e.amountAtomic)-reductions.get(e.id)!).toString(),reductionAtomic:reductions.get(e.id)!.toString(),capAtomic:e.maxReductionAtomic}));
  const mainStats=stats[0]||{sampleCount:0};
  return {engineVersion:ENGINE_VERSION,stateVersion:input.stateVersion,scenario,historyMode,freshness:'fresh',confirmedFundsAtomic:input.confirmedFundsAtomic,reserveFloorAtomic:input.reserveFloorAtomic,plannedSpendingAtomic:spending.toString(),availableNowAtomic:max(0n,raw).toString(),commitmentShortageAtomic:max(0n,-raw).toString(),feasible:gaps.length===0,firstReserveBreach:original.find(r=>BigInt(r.belowFloorAtomic)>0n)?breach(original.find(r=>BigInt(r.belowFloorAtomic)>0n)!):null,firstExposedFixedBill:original.find(r=>r.fixed&&BigInt(r.uncoveredAtomic)>0n)?breach(original.find(r=>r.fixed&&BigInt(r.uncoveredAtomic)>0n)!):null,timeline:original,adjustedTimeline:adjusted,adjustments,totalReductionAtomic:adjustments.reduce((s,a)=>s+BigInt(a.reductionAtomic),0n).toString(),residualGaps:gaps,dependsOnUnsettledReceipt:adjusted.some((r,i)=>r.type==='expense'&&BigInt(r.balanceAfterAtomic)-adjusted.slice(0,i+1).filter(t=>t.type==='receipt').reduce((s,t)=>s+BigInt(t.amountAtomic),0n)<floor),selectedHistoryRecordIds:[...selected].sort(),uncertainty:{sampleCount:mainStats.sampleCount,observedDelayMin:mainStats.observedDelayMin,observedDelayMax:mainStats.observedDelayMax,medianDelay:mainStats.medianDelay},forecastDates};
}
