import { describe, it, expect } from 'vitest';
import { hero } from '../../fixtures/src/index.js';
import { plan, parseMoney, addDays, validDate, timing, type PlanningInput } from './index.js';
function input():PlanningInput { const h=hero();return {stateVersion:1,asOf:'2026-10-29T10:00:00Z',localToday:'2026-10-29',horizonEnd:'2026-11-11',timezone:'Africa/Lagos',confirmedFundsAtomic:'800000000',reserveFloorAtomic:'100000000',pendingAtomic:'0',expenses:h.expenses,invoices:h.invoices}; }
describe('exact funds and prefix constraints',()=>{
 it('keeps future income separate and exposes rent after learned delay',()=>{
  const h=hero(),p=plan(input(),h.outcomes,'promised','none'),m=plan(input(),h.outcomes,'history_median','postgres'),n=plan(input(),[],'no_receipt','none');
  expect([p.availableNowAtomic,m.availableNowAtomic,n.availableNowAtomic]).toEqual(['0','0','0']);
  expect(p.adjustments).toEqual([]);expect(p.uncertainty.sampleCount).toBe(0);
  expect(m.forecastDates['cedar-oct']).toBe('2026-11-03');expect(m.firstExposedFixedBill?.uncoveredAtomic).toBe('50000000');
  expect(m.totalReductionAtomic).toBe('150000000');expect(n.totalReductionAtomic).toBe('150000000');
  expect(m.adjustedTimeline.every(e=>BigInt(e.balanceAfterAtomic)>=100000000n)).toBe(true);
 });
 it('honors fixed bills, caps, overdue expenses and opening deficits',()=>{
  const i=input();i.expenses[0].maxReductionAtomic='100000000';expect(plan(i,[],'no_receipt','none').feasible).toBe(false);
  i.reserveFloorAtomic='50000000';expect(plan(i,[],'no_receipt','none').totalReductionAtomic).toBe('100000000');
  i.expenses[0].dueDate='2026-10-28';expect(plan(i,[],'no_receipt','none').adjustments).toEqual([]);
  i.confirmedFundsAtomic='0';expect(plan(i,[],'no_receipt','none').feasible).toBe(false);
 });
 it('applies superseding outcomes and requires four observations',()=>{
  const h=hero().outcomes;expect(timing(h.slice(0,3),'cedar').medianDelay).toBeUndefined();
  const corrected={...h[3],id:'correction',supersedesId:h[3].id,paidDate:h[3].dueDate};
  expect(timing([...h,corrected],'cedar').sampleCount).toBe(4);expect(timing([...h,corrected],'cedar').observedDelayMax).toBe(4);
 });
 it('uses strict calendar dates and six decimal integer money',()=>{
  expect(validDate('2026-02-30')).toBe(false);expect(addDays('2026-10-30',4)).toBe('2026-11-03');
  expect(parseMoney('1200.000001')).toBe('1200000001');expect(()=>parseMoney('1e6')).toThrow();
 });
 it('matches exhaustive minimum reductions over bounded trajectories',()=>{
  let seed=1129;const rand=(n:number)=>{seed=(seed*1664525+1013904223)>>>0;return seed%n;};
  for(let test=0;test<400;test++){
   const i=input();i.confirmedFundsAtomic=String(rand(13));i.reserveFloorAtomic=String(rand(4));i.invoices=[];
   i.expenses=[0,1,2].map(k=>({id:String(k),label:String(k),dueDate:addDays(i.localToday,k+1),amountAtomic:String(1+rand(5)),maxReductionAtomic:'0',kind:rand(3)?'flexible':'fixed',status:'planned',version:1}));
   i.expenses.forEach(e=>e.maxReductionAtomic=e.kind==='flexible'?e.amountAtomic:'0');
   let best:number|undefined;
   for(let a=0;a<=Number(i.expenses[0].maxReductionAtomic);a++)for(let b=0;b<=Number(i.expenses[1].maxReductionAtomic);b++)for(let c=0;c<=Number(i.expenses[2].maxReductionAtomic);c++){
    let balance=Number(i.confirmedFundsAtomic),ok=balance>=Number(i.reserveFloorAtomic);[a,b,c].forEach((r,k)=>{balance-=Number(i.expenses[k].amountAtomic)-r;ok&&=balance>=Number(i.reserveFloorAtomic);});
    if(ok&&(best===undefined||a+b+c<best))best=a+b+c;
   }
   const p=plan(i,[],'no_receipt','none');expect(p.feasible).toBe(best!==undefined);if(best!==undefined)expect(Number(p.totalReductionAtomic)).toBe(best);
  }
 });
});
