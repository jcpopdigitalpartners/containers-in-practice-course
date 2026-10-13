export function createHeroMotion({doc=document,gsap,reduced=false}){
 const view=doc.defaultView,art=doc.querySelector('.hero-art'),button=doc.getElementById('hero-motion-toggle');
 const layers=[...art.querySelectorAll('.iso-layer')],middle=art.querySelector('[data-layer="middle"]'),top=art.querySelector('[data-layer="top"]'),indicator=art.querySelector('.hero-status');
 let timeline=null,userPaused=false,onScreen=true,disposed=false,active=!art.closest('[hidden]');
 function reset(){gsap.set(layers,{y:0,opacity:1});gsap.set(indicator,{scale:1,transformOrigin:'50% 50%'});}
 function build(){reset();return gsap.timeline({paused:true,repeat:-1,repeatDelay:1.8})
  .to(top,{y:-18,duration:1,ease:'power2.inOut'},0)
  .to(middle,{y:-9,duration:1,ease:'power2.inOut'},0.12)
  .to(middle,{y:0,duration:0.65,ease:'power2.inOut'},1.65)
  .to(top,{y:0,duration:0.65,ease:'power2.inOut'},2)
  .to(indicator,{scale:1.45,duration:0.28,repeat:1,yoyo:true,ease:'sine.inOut'},2.85);}
 function sync(){
  if(disposed)return;
  button.disabled=reduced;button.textContent=reduced?'Still':userPaused?'Play':'Pause';
  button.setAttribute('aria-label',reduced?'Container illustration animation is off because reduced motion is enabled':userPaused?'Play the container illustration animation':'Pause the container illustration animation');
  if(reduced){timeline?.kill();timeline=null;reset();return;}
  if(!timeline)timeline=build();
  if(!active||userPaused||!onScreen||doc.hidden)timeline.pause();else timeline.play();
 }
 button.addEventListener('click',()=>{userPaused=!userPaused;sync();});
 doc.addEventListener('visibilitychange',sync);
 const observer=view.IntersectionObserver?new view.IntersectionObserver(entries=>{onScreen=entries[0]?.isIntersecting??false;sync();},{threshold:0.1}):null;
 observer?.observe(art);sync();
 return {setActive(value){active=value;sync();},setReduced(value){reduced=value;sync();},dispose(){disposed=true;timeline?.kill();timeline=null;observer?.disconnect();doc.removeEventListener('visibilitychange',sync);reset();}};
}
