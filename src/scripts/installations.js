export function initInstallations({doc=document}={}) {
 const view=doc.defaultView,roots=[...doc.querySelectorAll('[data-install-guide]')];
 let os='ubuntu';
 try{os=view.localStorage.getItem('cip-install-os')||os;}catch{}
 if(!['ubuntu','rhel','mac','windows'].includes(os))os='ubuntu';
 function selectOS(value){
  os=value;
  try{view.localStorage.setItem('cip-install-os',os);}catch{}
  roots.forEach(root=>{
   root.querySelector('[data-install-os]').value=os;
   root.querySelectorAll('[data-install-platform]').forEach(platform=>platform.hidden=platform.dataset.installPlatform!==os);
  });
 }
 roots.forEach(root=>{
  root.querySelector('[data-install-os]').addEventListener('change',event=>selectOS(event.target.value));
  root.querySelectorAll('[data-install-copy]').forEach(button=>button.addEventListener('click',async()=>{
   const text=button.closest('li').querySelector('code').textContent,out=button.nextElementSibling;
   try{await view.navigator.clipboard.writeText(text);out.textContent='Copied';}
   catch{out.textContent='Select the command text and copy it manually.';}
  }));
 });
 selectOS(os);
 return {selectOS};
}
