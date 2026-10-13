import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {walkthroughs,learnerRepository} from '../src/data/walkthroughs.js';

const doc=new JSDOM(fs.readFileSync('dist/index.html','utf8')).window.document;
for(const [id,guide] of Object.entries(walkthroughs)){
 const rendered=doc.getElementById(`${id}-walkthrough`);assert.ok(rendered,`Visible guide for ${id}`);
 assert.equal(rendered.querySelectorAll(':scope > .installation-steps > li').length,guide.steps.length);
 assert.equal(rendered.querySelectorAll('.expected-result').length,guide.steps.length);
 assert.equal(rendered.querySelectorAll('.walkthrough-recovery').length,guide.steps.length);
 for(const step of guide.steps){
  assert.ok(step.terminal&&step.where&&step.why&&step.expected&&step.recovery);
  for(const code of [step.kind==='File contents'?null:step.code,...(step.choices||[]).map(c=>c.code)].filter(Boolean))execFileSync('bash',['-n','-c',code]);
 }
 for(const block of rendered.querySelectorAll('.guided-command')){
  const code=block.querySelector('code').textContent;
  assert.ok(block.querySelector('[data-lab-copy]'));
  if(code.includes('git diff --cached'))assert.ok(!code.includes('git commit '),'Learner reviews staged changes before a separate commit block');
  if(code.includes('pg_isready'))assert.ok(!code.includes('< api/schema.sql'),'Readiness is checked before a separate schema block');
 }
}
assert.equal(doc.querySelector('#preflight-walkthrough .workspace-download').href,learnerRepository);
assert.equal(doc.querySelector('#preflight-walkthrough a[download]'),null);
assert.ok(!doc.querySelector('#primer-dialog').textContent.includes('git init'));
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cip-guided-git-'));
try{
 const root=path.join(scratch,'containers-practice-starter');
 const run=(code,cwd=root)=>execFileSync('bash',['-e','-c',code.replaceAll('~/containers-practice-starter',root)],{cwd,stdio:'pipe',timeout:45000,env:{...process.env,GIT_TERMINAL_PROMPT:'0'}}).toString();
 const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe'}).toString().trim();
 run(walkthroughs.preflight.steps[1].code,scratch);
 for(const file of ['README.md','.gitignore','api/server.mjs','api/package-lock.json','api/schema.sql','scripts/preflight.sh','scripts/vet.mjs','docs/vetting.md','evidence/baseline.md'])assert.ok(fs.existsSync(path.join(root,file)),`Hosted clone supplies ${file}`);
 assert.equal(git('remote','get-url','origin'),learnerRepository+'.git');
 const suppliedCommit=git('rev-parse','HEAD'),suppliedCount=Number(git('rev-list','--count','HEAD'));
 run(walkthroughs.preflight.steps[2].code);run(walkthroughs.preflight.steps[3].code);assert.equal(git('status','--porcelain'),'');
 assert.equal(git('rev-parse','HEAD'),suppliedCommit,'Inspecting a clone does not create a second initial commit');
 fs.writeFileSync(path.join(root,'evidence/module-0/preflight.txt'),'Simulated report for isolated Git workflow testing; not a live runtime result.\n');
 fs.appendFileSync(path.join(root,'evidence/baseline.md'),'\nModule 0 verification evidence from this isolated Git workflow test.\n');run(walkthroughs.checkpoint.steps[1].code);assert.equal(git('rev-parse','checkpoint-0'),git('rev-parse','HEAD'));
 run(walkthroughs.inspect.steps[1].code);fs.appendFileSync(path.join(root,'evidence/baseline.md'),'\nAPI investigation evidence.\n');run(walkthroughs.inspect.steps.at(-1).code);assert.equal(git('branch','--show-current'),'main');assert.equal(git('status','--porcelain'),'');
 run(walkthroughs.image.steps[0].code);
 const recipe=walkthroughs.image.steps.find(s=>s.where.endsWith('/Containerfile')).code;
 fs.writeFileSync(path.join(root,'api/Containerfile'),recipe+'\n');fs.writeFileSync(path.join(root,'api/.containerignore'),walkthroughs.image.steps.find(s=>s.where.endsWith('/.containerignore')).code+'\n');
 for(const line of recipe.split('\n').filter(l=>l.startsWith('COPY ')))for(const file of line.split(' ').slice(1,-1))assert.ok(fs.existsSync(path.join(root,'api',file)),`Build COPY source exists: ${file}`);
 assert.deepEqual(JSON.parse(recipe.split('\n').find(l=>l.startsWith('CMD ')).slice(4)),['node','server.mjs']);
 fs.appendFileSync(path.join(root,'evidence/baseline.md'),'\nImage investigation evidence.\n');run(walkthroughs.image.steps.at(-1).code);assert.equal(git('branch','--show-current'),'main');assert.equal(git('status','--porcelain'),'');
 run(walkthroughs.network.steps[0].code.split('\n').filter(l=>l.startsWith('git ')).join('\n'));fs.writeFileSync(path.join(root,'evidence/module-1-network.md'),'Network investigation evidence.\n');run(walkthroughs.network.steps.at(-1).code);assert.equal(git('branch','--show-current'),'main');assert.equal(git('status','--porcelain'),'');
 assert.equal(Number(git('rev-list','--count','HEAD')),suppliedCount+4,'Supplied history, checkpoint and three investigation commits are preserved');
 assert.ok(git('show','checkpoint-0:evidence/module-0/preflight.txt').includes('Simulated report'),'Checkpoint includes its preflight report');
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
console.log('PASS: five visible guides, terminal/directory/purpose/result/recovery, Bash syntax, separated review/readiness actions, hosted clone and supplied history, isolated checkpoint/report/task-branch/merge workflows, Containerfile inputs and startup');
