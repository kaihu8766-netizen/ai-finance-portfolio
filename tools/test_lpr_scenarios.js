// Run with: node --test tools/test_lpr_scenarios.js (no npm dependencies).
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const csv=fs.readFileSync(path.join(root,'demo/lpr_mc_quantiles.csv'),'utf8');
const code=fs.readFileSync(path.join(root,'demo/lpr-scenarios.js'),'utf8');

function reader(base='http://local.test/demo/ai-treasury-copilot/'){
  const requests=[];
  const sandbox={window:{},URL,document:{baseURI:base},location:new URL(base),
    fetch:async url=>{requests.push(url);return {ok:true,text:async()=>csv};}};
  vm.runInNewContext(code,sandbox);
  return {api:sandbox.window.LprScenarios,requests};
}

test('script CSV has 60 months and percentage-point values become decimal rates',()=>{
  const table=reader().api.parse(csv);
  assert.equal(table.rows.length,60);
  assert.equal(table.first,'2026-08');assert.equal(table.last,'2031-07');
  assert.ok(Math.abs(table.at('2027-01-15','P50').rate-0.029856)<1e-15);
  assert.ok(Math.abs(table.at('2027-08-01','P50').rate-0.029701)<1e-15);
  assert.ok(Math.abs(table.at('2028-08-01','P50').rate-0.029446)<1e-15);
  assert.ok(Object.isFrozen(table.rows));
});

test('same-month lookup locks a quoted month without interpolation or extrapolation',()=>{
  const table=reader().api.parse(csv);
  assert.equal(table.at('2027-01-01','P50').rate,table.at('2027-01-31','P50').rate);
  assert.equal(table.at(new Date(2027,0,15),'P50').month,'2027-01');
  assert.throws(()=>table.at('2026-07-31','P50'),/超出CSV覆盖期/);
  assert.throws(()=>table.at('2031-08-01','P50'),/超出CSV覆盖期/);
  assert.throws(()=>table.at('2027-01-01','baseline'),/P10、P50或P90/);
});

test('P10 <= P50 <= P90 at every quoted month, independent of subjective weights',()=>{
  const table=reader().api.parse(csv);
  for(const row of table.rows){
    assert.ok(table.at(row.month,'P10').rate<=table.at(row.month,'P50').rate);
    assert.ok(table.at(row.month,'P50').rate<=table.at(row.month,'P90').rate);
  }
});

test('reject malformed, missing, non-finite or disordered source values',()=>{
  const api=reader().api;
  for(const invalid of [
    csv.replace('q10,q50','wrong,q50'),
    csv.replace('2026-09','2026-08'),
    csv.replace('2026-09','2026-13'),
    csv.replace('2.9567','NaN'),
    csv.replace('2.9567','Infinity'),
    csv.replace('2.9567',''),
    csv.replace('2.9567','9.9567'),
    csv.trim().split('\n').slice(0,-1).join('\n')
  ]) assert.throws(()=>api.parse(invalid));
  assert.equal(api.parse('\uFEFF'+csv).rows.length,60);
});

test('relative loading uses the single local CSV; external origins are rejected',async()=>{
  const {api,requests}=reader();
  const table=await api.load('../lpr_mc_quantiles.csv');
  assert.equal(table.rows.length,60);
  assert.deepEqual(requests,['http://local.test/demo/lpr_mc_quantiles.csv']);
  await assert.rejects(api.load('https://external.test/other.csv'),/不请求外部数据源/);
  assert.equal(requests.length,1);
});

test('file URLs require explicit manual selection, without hidden rate fallback',async()=>{
  const {api,requests}=reader('file:///offline/demo/ai-treasury-copilot/index.html');
  await assert.rejects(api.load('../lpr_mc_quantiles.csv'),/手动选择同一份CSV/);
  assert.equal(requests.length,0);
  assert.ok(Math.abs(api.parse(csv).at('2027-01-01','P50').rate-0.029856)<1e-15);
});
