export function initReadiness({doc=document,onContinue=()=>{}}={}){
const document=doc,window=doc.defaultView,navigator=window.navigator;
const by=id=>doc.getElementById(id),readinessForm=by('readiness-form');
const readinessCommands={
 ubuntu:{label:'Ubuntu (native Linux)',guide:'ubuntu',code:String.raw`printf 'Logical cores: '; nproc
awk '/MemTotal/ {printf "RAM: %.1f GiB\n",$2/1048576}' /proc/meminfo
printf 'Free disk space: '; df -BG . | awk 'NR==2{print $4}'
printf 'Architecture: '; uname -m`,note:'Run in the Linux shell. Check the storage filesystem where your course workspace and container data will live.'},
 wsl:{label:'Ubuntu inside WSL 2',guide:'ubuntu',code:String.raw`printf 'Guest logical cores: '; nproc
awk '/MemTotal/ {printf "Guest RAM: %.1f GiB\n",$2/1048576}' /proc/meminfo
printf 'Guest free storage: '; df -BG . | awk 'NR==2{print $4}'
printf 'Architecture: '; uname -m
printf 'Linux kernel: '; uname -r`,note:'Run INSIDE Ubuntu on WSL 2. The guest may have a smaller RAM/CPU allocation than Windows. Confirm WSL 2 from PowerShell with: wsl --status.'},
 rhel:{label:'RHEL / Fedora (native Linux)',guide:'rhel',code:String.raw`printf 'Logical cores: '; nproc
awk '/MemTotal/ {printf "RAM: %.1f GiB\n",$2/1048576}' /proc/meminfo
printf 'Free disk space: '; df -BG . | awk 'NR==2{print $4}'
printf 'Architecture: '; uname -m`,note:'Run in your Linux shell. On a virtualized installation, use the guest values rather than host specifications.'},
 mac:{label:'macOS',guide:'macos',code:String.raw`printf 'Host logical cores: '; sysctl -n hw.logicalcpu
sysctl -n hw.memsize | awk '{printf "Host RAM: %.1f GiB\n",$1/1073741824}'
printf 'Host free storage: '; df -g . | awk 'NR==2{print $4 " GiB"}'
printf 'Architecture: '; uname -m`,note:'These are host measurements. Podman uses a Linux VM on macOS: after configuring it, measure the VM allocation before declaring the full course ready.'},
 windows:{label:'Windows PowerShell',guide:'windows',code:String.raw`$sys = Get-CimInstance Win32_ComputerSystem
"Host logical cores: $($sys.NumberOfLogicalProcessors)"
"Host RAM: $([math]::Round($sys.TotalPhysicalMemory / 1GB, 1)) GiB"
$drive = $env:SystemDrive -replace ':',''
"Host free storage: $([math]::Round((Get-PSDrive -Name $drive).Free / 1GB, 1)) GiB"
"OS architecture: $((Get-CimInstance Win32_OperatingSystem).OSArchitecture)"
wsl --status`,note:'Run in PowerShell. WSL may not yet be installed. Once WSL 2 is configured, rerun the Ubuntu/WSL checks inside the Linux guest before final readiness verification.'}
};
by('readiness-os').addEventListener('change',e=>{
 const entry=readinessCommands[e.target.value];by('readiness-command').hidden=!entry;if(!entry)return;
 by('readiness-command-label').textContent=entry.label;by('readiness-code').textContent=entry.code;by('readiness-command-note').textContent=entry.note;
});
async function copyText(txt,button,normal){
 let ok=false;
 try{await navigator.clipboard.writeText(txt);ok=true}catch{}
 if(!ok){const t=document.createElement('textarea');t.value=txt;t.style.position='fixed';t.style.left='-9999px';document.body.appendChild(t);t.select();try{ok=document.execCommand('copy')}catch{}t.remove()}
 button.textContent=ok?'Copied ✓':'Select and copy';window.setTimeout(()=>button.textContent=normal,1800);
}
by('readiness-copy')?.addEventListener('click',()=>{const text=by('readiness-code').textContent;if(text)copyText(text,by('readiness-copy'),'Copy checks ↗')});
let readinessReport='';
for(const eventType of ['input','change'])readinessForm?.addEventListener(eventType,()=>{by('readiness-results').hidden=true;readinessReport=''});
readinessForm?.addEventListener('submit',event=>{
 event.preventDefault();
 const os=by('readiness-os').value,cores=Number(by('readiness-cores').value),ram=Number(by('readiness-ram').value),disk=Number(by('readiness-disk').value),arch=by('readiness-arch').value,runtime=by('readiness-runtime').value,source=by('readiness-source').value;
 const validNumbers=by('readiness-cores').value!=='' && Number.isInteger(cores)&&cores>=1&&cores<=1024&&by('readiness-ram').value!==''&&Number.isFinite(ram)&&ram>0&&ram<=2048&&by('readiness-disk').value!==''&&Number.isFinite(disk)&&disk>=0&&disk<=99999;
 const out=by('readiness-results');out.hidden=false;
 const reasons=[];let status='unknown',heading='',summary='';
 if(!os||!validNumbers||!arch||!runtime||!source){
  heading='Not enough information yet';summary='Select the runtime environment and enter verified values for each machine check.';
  reasons.push('Read the OS-specific command output before estimating capacity. In a VM or WSL 2, use the guest allocation.');
 }else if(arch==='no'||runtime==='no'||cores<4||ram<8||disk<20){
  status='blocked';heading='Not ready for the introductory labs';summary='One or more baseline capacity or runtime checks needs attention before installation.';
  if(cores<4)reasons.push(`CPU: ${cores} logical cores; introductory target is 4.`);
  if(ram<8)reasons.push(`Memory: ${ram} GiB; introductory target is 8 GiB.`);
  if(disk<20)reasons.push(`Free storage: ${disk} GiB; introductory target is 20 GiB.`);
  if(arch==='no')reasons.push('A 64-bit operating system is needed for the supported course toolchain.');
  if(runtime==='no')reasons.push('Linux containers/virtualization are unavailable; check firmware settings, OS support or an alternative host.');
 }else if(['mac','windows','wsl'].includes(os)&&source!=='guest'){
  status='provisional';heading='Host capacity checked · Linux guest still pending';summary='Your entered host values meet the introductory planning targets, but the Linux guest allocation is not yet verified.';
  if(cores<8||ram<16||disk<40)reasons.push('Host capacity is below one or more full-course targets; expect to adjust the workload or use a larger host.');
  reasons.push('Continue to 0.1 and configure WSL 2 or the Linux VM, then rerun these checks inside that guest.');
 }else if(cores>=8&&ram>=16&&disk>=40){
  status='ready';heading='Full-course planning targets met';summary='Your entered measurements meet the recommended baseline for the complete course. This is a resource screen, not a successful container-lab test.';
  if(os==='mac'||os==='windows')reasons.push('Recheck the resources available inside the Linux VM / WSL 2 once it is configured. Host capacity alone does not prove guest capacity.');
  reasons.push('Continue to 0.1 for installation, then validate runtime behavior in 0.2.');
 }else{
  status='partial';heading='Introductory labs: planning targets met';summary='Your machine meets the Module 0–1 planning targets, but the full course may require a smaller workload, more memory, more storage or a more capable host.';
  if(cores<8)reasons.push(`CPU: ${cores} cores; full-course planning target is 8.`);
  if(ram<16)reasons.push(`RAM: ${ram} GiB; full-course planning target starts at 16 GiB.`);
  if(disk<40)reasons.push(`Storage: ${disk} GiB; full-course planning target starts at 40 GiB free.`);
  reasons.push('Proceed to 0.1 with these constraints documented; re-evaluate before the Kubernetes labs.');
 }
 out.dataset.result=status;
 by('readiness-result-heading').textContent=heading;
 by('readiness-result-summary').textContent=summary;
 const ul=by('readiness-reasons');ul.replaceChildren();for(const reason of reasons){const li=document.createElement('li');li.textContent=reason;ul.appendChild(li)}
 by('readiness-to-os').hidden=status==='blocked'||status==='unknown';
 readinessReport=['# Module 00.0 — Machine-readiness screen',`Environment: ${readinessCommands[os]?.label||'Not selected'}`,`Logical CPU cores: ${validNumbers?cores:'Not verified'}`,`RAM GiB: ${validNumbers?ram:'Not verified'}`,`Free storage GiB: ${validNumbers?disk:'Not verified'}`,`64-bit OS: ${arch||'Unknown'}`,`Linux runtime / virtualization: ${runtime||'Unknown'}`,`Measurement source: ${source||'Unknown'}`,`Assessment: ${heading}`,summary,...reasons.map(x=>'- '+x),'','Values were entered by the learner; this is not a direct machine inspection.'].join('\n');
 out.scrollIntoView({behavior:'instant',block:'nearest'});
});
readinessForm?.addEventListener('reset',()=>{
 by('readiness-command').hidden=true;
 by('readiness-results').hidden=true;
 readinessReport='';
});
by('readiness-copy-report')?.addEventListener('click',()=>{if(readinessReport)copyText(readinessReport,by('readiness-copy-report'),'Copy assessment ↗')});

by('readiness-to-os').addEventListener('click',()=>onContinue(readinessCommands[by('readiness-os').value]?.guide||'ubuntu'));
}
