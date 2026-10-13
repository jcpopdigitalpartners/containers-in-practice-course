import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {initInstallations} from '../src/scripts/installations.js';

const html=fs.readFileSync('dist/index.html','utf8');
function setup(saved=false,reduced=false){
 const dom=new JSDOM(html,{url:'https://course.test/',pretendToBeVisual:true}),w=dom.window,d=w.document;
 w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:reduced,addEventListener(){}});
 if(saved)w.localStorage.setItem('cip-toolchain-revealed-v1','true');
 const api=initInstallations({doc:d});
 const roots=[...d.querySelectorAll('[data-install-guide]')],root=roots[0],q=s=>root.querySelector(s);
 return {dom,w,d,api,roots,root,q};
}
const a=setup(),{w,d,q,roots,api}=a;
assert.equal(roots.length,1);
assert.equal(d.querySelector('[data-tool-game]'),null);
assert.equal(d.querySelector('[data-install-skip]'),null);
assert.ok(roots.every(r=>!r.querySelector('[data-install-content]').hidden),'Commands are immediately available');
assert.ok(q('.install-terminal .terminal-bar'));
const expected={ubuntu:'sudo apt-get install',rhel:'sudo dnf install',mac:'brew install lima',windows:'wsl --install -d Ubuntu'};
for(const [os,command] of Object.entries(expected)){
 api.selectOS(os);const platform=q(`[data-install-platform="${os}"]`);assert.equal(platform.hidden,false);assert.match(platform.textContent,new RegExp(command));
 for(const executable of ['podman --version','buildah --version','skopeo --version','tofu version','git --version','curl --version'])assert.ok(platform.textContent.includes(executable));
}
const ids=[...d.querySelectorAll('[id]')].map(el=>el.id);assert.equal(ids.length,new Set(ids).size,'No duplicate IDs between guides');
let copied='';Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>copied=text}});api.selectOS('rhel');q('[data-install-platform="rhel"] [data-install-copy]').click();await Promise.resolve();assert.equal(copied,'sudo dnf install -y podman buildah skopeo git curl less unzip ca-certificates');
a.dom.window.close();
const saved=setup(true);assert.equal(saved.q('[data-install-content]').hidden,false);saved.dom.window.close();
const reduced=setup(false,true);assert.equal(reduced.q('[data-install-content]').hidden,false);reduced.dom.window.close();
console.log('PASS: immediate installation access without a game, legacy saved state, reduced motion, terminal chrome, four OS paths, exact command copying and unique IDs');
