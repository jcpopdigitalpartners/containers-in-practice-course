import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {walkthroughs} from '../src/data/walkthroughs.js';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const labels={preflight:'Module 0.2',checkpoint:'Module 0.5',inspect:'Module 1.1.1',image:'Module 1.1.2',network:'Module 1.2.1'};
const command=(code,kind,pause)=>{
 const commit=kind==='File contents'?-1:code.indexOf('\ngit commit '),split=pause?code.indexOf('\n'):commit;
 const block=text=>`\n\`\`\`${kind==='File contents'?'text':'bash'}\n${text}\n\`\`\`\n`;
 return split<0?block(code):block(code.slice(0,split))+'\n'+(pause||'Review the staged diff before continuing. If it contains only your intended changes, run the next block.')+'\n'+block(code.slice(split+1));
};
let markdown='# Containers in Practice — guided practice\n\nUse the same Linux environment throughout. Run one block at a time and check its result before continuing. File contents belong in your editor. The application is the supplied Node.js API; PostgreSQL is its separate database.\n\n';
for(const [id,guide] of Object.entries(walkthroughs)){
 markdown+=`## ${labels[id]} — ${guide.title}\n\n${guide.intro}\n\n`;
 if(guide.download)markdown+='The course page supplies the workspace download. If you are reading this file inside your extracted starter, you already have it.\n\n';
 for(const [i,step] of guide.steps.entries()){
  markdown+=`### ${i+1}. ${step.title}\n\n**Terminal:** ${step.terminal}\n\n**Working directory:** ${step.where}\n\n${step.why}\n`;
  for(const choice of step.choices||[])markdown+=`\n#### ${choice.title}\n\n**Terminal:** ${choice.terminal}\n\n${choice.note}\n`+command(choice.code);
  if(step.code)markdown+=command(step.code,step.kind,step.pauseAfterFirst);
  markdown+=`\n**Check before continuing:** ${step.expected}\n\n**If the result differs:** ${step.recovery}\n\n`;
 }
 markdown+='Official references: '+guide.sources.map(([title,url])=>`[${title}](${url})`).join(' · ')+'\n\n';
}
fs.writeFileSync(path.join(project,'labs/GUIDED-PRACTICE.md'),markdown);
execFileSync('python3',['-c',`
from pathlib import Path
import zipfile
root=Path('labs')
with zipfile.ZipFile('public/practice-starter.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for file in sorted(root.rglob('*')):
  if file.is_file() and not any(part in ('node_modules','.git') for part in file.relative_to(root).parts):
   archive.write(file,'containers-practice-starter/'+file.relative_to(root).as_posix())
`],{cwd:project,stdio:'inherit'});
console.log('Updated the guided practice companion and learner starter ZIP.');
