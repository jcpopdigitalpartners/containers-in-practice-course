import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {initReadiness} from '../src/scripts/readiness.js';
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8')),w=dom.window,d=w.document;
w.HTMLElement.prototype.scrollIntoView=()=>{};
const el=id=>d.getElementById(id);let nextGuide='';
initReadiness({doc:d,onContinue:guide=>nextGuide=guide});
for(const root of [d.querySelector('[data-lesson="opening"]')]){
 const table=root.querySelector('.workstation-targets table');assert.ok(table);
 const values=[...table.querySelectorAll('tbody tr')].map(row=>[...row.cells].map(cell=>cell.textContent));
 assert.deepEqual(values.slice(0,3),[['Logical CPU','4 cores','8 cores'],['RAM','8 GiB','16–32 GiB'],['Free storage','20 GiB','40–80 GiB']]);
}
assert.ok(el('readiness-form').closest('#opening'));assert.equal(d.querySelectorAll('.workstation-targets table').length,1);assert.equal(el('setup-dialog'),null);
const check=values=>{for(const [name,value] of Object.entries(values))el('readiness-'+name).value=String(value);el('readiness-form').dispatchEvent(new w.Event('submit',{cancelable:true}));return el('readiness-results').dataset.result;};
assert.equal(check({}), 'unknown');
const baseline={os:'ubuntu',cores:4,ram:8,disk:20,arch:'yes',runtime:'yes',source:'host'};
assert.equal(check(baseline),'partial');
for(const values of [{cores:3},{ram:7.9},{disk:19.9},{arch:'no'},{runtime:'no'}])assert.equal(check({...baseline,...values}),'blocked');
assert.equal(check({...baseline,cores:8,ram:16,disk:40}),'ready');
assert.equal(check({...baseline,cores:8,ram:16,disk:40,os:'wsl'}),'provisional');
assert.equal(check({...baseline,cores:8,ram:16,disk:40,os:'wsl',source:'guest'}),'ready');
assert.equal(check({...baseline,cores:4.5}),'unknown');
assert.equal(check({...baseline,cores:''}),'unknown');
for(const [os,command] of [['ubuntu','nproc'],['wsl','Guest logical cores'],['rhel','nproc'],['mac','hw.logicalcpu'],['windows','Get-CimInstance']]){
 el('readiness-os').value=os;el('readiness-os').dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.ok(el('readiness-code').textContent.includes(command));assert.equal(el('readiness-command').hidden,false);
}
check({...baseline,cores:8,ram:16,disk:40,os:'mac',source:'guest'});el('readiness-to-os').click();assert.equal(nextGuide,'macos');
el('readiness-form').reset();assert.equal(el('readiness-results').hidden,true);assert.equal(el('readiness-command').hidden,true);
for(const label of el('readiness-form').querySelectorAll('label'))assert.ok(label.querySelector('input,select'),'Every field has its enclosing label');
console.log('PASS: sizing table and readiness check in Opening, Module -0.1, baseline/full-course thresholds, invalid/missing measurements, WSL guest verification, OS resource checks, installation handoff, reset');
w.close();
