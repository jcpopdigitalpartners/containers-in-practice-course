import {createHeroMotion} from './hero-motion.js';
import {initInstallations} from './installations.js';
import {initReadiness} from './readiness.js';
import {createAudioCache} from './audio-cache.js';
import WaveSurfer from 'wavesurfer.js';
import { gsap } from 'gsap';
import { createDiagram } from '@markdy/renderer-dom';

const course=JSON.parse(document.getElementById('course-data').textContent);
const base=JSON.parse(document.getElementById('base-path').textContent);
const $=(id)=>document.getElementById(id);
const all=(q,root=document)=>Array.from(root.querySelectorAll(q));
let audio=$('course-audio');
let waveform=createWaveform();
const narrationURL=(index)=>{const file=course.tracks[index].file,hash=course.chapters.find(c=>c.track===index)?.audioOverride?.sha256;return new URL(base+'audio/'+file+(hash?'?v='+hash.slice(0,16):''),location.href).href;};
const audioCache=createAudioCache({count:course.tracks.length,urlFor:narrationURL,fetchAudio:window.fetch.bind(window),createObjectURL:blob=>URL.createObjectURL(blob),revokeObjectURL:url=>URL.revokeObjectURL(url)});
let loadedMediaURL='';
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let installationGuide=null,heroMotion=null;
let completed=safeRead('cip-studio-complete',{}),prefs=safeRead('cip-studio-preferences',{});
let current=0,currentTrack=-1,pendingSeek=null,pendingPlay=false,playbackRequest=0,playInFlightRequest=-1,scrubbing=false,scrubWasPlaying=false,scene=null,sceneStep=-1,mediaEvents=null;
const media=window.matchMedia('(prefers-reduced-motion: reduce)');
let reduced=prefs.reduced??media.matches,follow=prefs.follow??true;
let theme=prefs.theme==='dark'?'dark':'light';
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
const persistPrefs=()=>write('cip-studio-preferences',{reduced,follow,large:$('larger-text').checked,theme});
const clock=(n)=>`${Math.floor(Math.max(0,n)/60)}:${String(Math.floor(Math.max(0,n)%60)).padStart(2,'0')}`;
const chapter=()=>course.chapters[current];
const article=()=>document.querySelector(`[data-lesson="${chapter().id}"]`);
const status=(text)=>{$('audio-status').textContent=text;};
const setPlaying=()=>{$('play').innerHTML=audio.paused?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm7 0h4v14h-4z"/></svg>';$('play').setAttribute('aria-label',audio.paused?'Play narration':'Pause narration');};
function updateProgress(){let count=course.chapters.filter(c=>!c.opening&&completed[c.id]).length;$('progress-count').textContent=`${count} / ${course.chapters.filter(c=>!c.opening).length}`;$('progress-meter').value=count;all('[data-complete]').forEach(x=>x.checked=!!completed[x.dataset.complete]);all('.chapter-link').forEach(a=>a.querySelector('.done-mark').textContent=completed[a.dataset.go]?'✓':'');}
function updateModuleContext(){const c=chapter(),module=course.modules[c.module],first=c.opening?c:course.chapters.find(lesson=>!lesson.opening&&lesson.module===c.module),card=$('module-context');$('context-number').textContent=c.opening?'−0.1':String(c.module);$('context-title').textContent=c.opening?'Opening':module.title;$('context-subtitle').textContent=c.opening?'Welcome · before Module 0':module.subtitle;card.href='#'+first.id;card.dataset.go=first.id;card.setAttribute('aria-label',c.opening?'Opening · return to the welcome lesson':`Module ${c.module}: ${module.title}. Go to the module’s first lesson.`);}
function drawReferences(){const c=chapter();$('reference-links').replaceChildren();for(const r of c.resourcesResolved){const a=document.createElement('a');a.href=r.url;a.target='_blank';a.rel='noopener noreferrer';const title=document.createElement('strong');title.textContent=r.title+' ↗';const detail=document.createElement('span');detail.textContent=r.detail||'Official reference';a.append(title,detail);$('reference-links').append(a);}if(c.sourceTrack!==undefined){const original=c.audioOverride?course.tracks[c.track]:course.sourceTracks[c.sourceTrack],a=document.createElement('a'),title=document.createElement('strong'),detail=document.createElement('span');a.href=c.audioOverride?narrationURL(c.track):base+'audio/'+original.file;a.download=original.file;title.textContent=c.audioOverride?'Lesson recording ↓':'Full source recording ↓';detail.textContent=original.label;a.append(title,detail);$('reference-links').append(a);}$('command-code').textContent=c.code;$('scene-steps').replaceChildren();c.steps.forEach((s,i)=>{const li=document.createElement('li'),b=document.createElement('button'),number=document.createElement('span'),wrap=document.createElement('span'),title=document.createElement('strong'),body=document.createElement('small');number.className='step-number';number.textContent=`0${i+1}`;title.textContent=s.title;body.textContent=s.text;wrap.append(title,body);b.append(number,wrap);b.dataset.step=String(i);b.addEventListener('click',()=>setStep(i,true));li.append(b);$('scene-steps').append(li);});}
function sceneCaption(i){if(i===sceneStep)return;sceneStep=i;const c=chapter();article().querySelector('[data-scene-step]').textContent=`0${i+1}`;article().querySelector('[data-scene-caption]').textContent=c.steps[i].text;all('[data-step]',$('scene-steps')).forEach(b=>{if(Number(b.dataset.step)===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}
function setStep(i,manual=false){sceneCaption(i);if(scene){scene.pause();const beats=scene.beats();const b=beats[i];if(b)scene.seek(Math.max(b.start,b.end-.001));}const b=article().querySelector('[data-scene-play]');b.textContent='▶ Animate';if(manual)status('Diagram step selected · narration position unchanged');}
function mountScene(){scene?.destroy();scene=null;sceneStep=-1;const c=chapter(),mount=article().querySelector('[data-diagram]');try{scene=createDiagram({container:mount,code:c.scene,autoplay:false,loop:false,playbackRate:0.35,copyright:true,studioLink:false,controls:false,clickToPlay:false,interactiveViewport:false,sceneBoundaryProgress:false,fitMode:'contain',responsiveLayout:false,contentPadding:12,onTimeUpdate:(seconds)=>{if(!scene)return;const beats=scene.beats();let i=0;beats.forEach((b,j)=>{if(seconds>=b.start)i=j});sceneCaption(i);},onPlayStateChange:(playing)=>{article().querySelector('[data-scene-play]').textContent=playing?'Ⅱ Pause diagram':'▶ Animate';},onEnded:()=>{article().querySelector('[data-scene-play]').textContent='↺ Replay diagram';}});scene.setTheme?.(theme==='dark'?'midnight':'paper');setStep(0);}catch(error){mount.textContent='The visual could not load. Read the diagram step by step below.';sceneCaption(0);console.error('Diagram initialization failed',error);}article().querySelector('[data-scene-play]').disabled=reduced||!scene;}
function switchTab(root,tab,moveFocus=false){const buttons=all('[role=tab]',root);buttons.forEach(b=>{const active=b.dataset.tab===tab;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active&&moveFocus)b.focus();});all('[data-pane]',root).forEach(p=>p.hidden=p.dataset.pane!==tab);if(tab==='understand')requestAnimationFrame(()=>scene?.resize());else scene?.pause();}
// Loading resets the media time before the requested cue is ready. Those events
// must not let audio-follow replace a lesson selected through navigation.
function narrationReady(){return currentTrack>=0&&audio.readyState>=1&&audio.currentSrc===loadedMediaURL;}
function seekNarration(){if(pendingSeek===null||!narrationReady())return;const length=Number.isFinite(audio.duration)?audio.duration:course.tracks[currentTrack].length;pendingSeek=Math.max(0,Math.min(pendingSeek,Math.max(0,length-.01)));if(Math.abs(audio.currentTime-pendingSeek)>.01)waveform.setTime(pendingSeek);}
function settleSeek(){if(pendingSeek!==null&&narrationReady()&&!audio.seeking&&Math.abs(audio.currentTime-pendingSeek)<.1)pendingSeek=null;}
function seekToPosition(time,keepPlaying){pendingSeek=time;pendingPlay=keepPlaying;waveform.pause();seekNarration();updateTimeline();if(keepPlaying)startNarration();else if(pendingSeek!==null)status('Buffering selected section…');}
function loadTrack(index,time,keepPlaying){scrubbing=false;scrubWasPlaying=false;playbackRequest++;pendingPlay=keepPlaying;pendingSeek=time;$('audio-seek').max=course.tracks[index].length;$('audio-seek').value=time;$('elapsed').textContent=clock(time);$('duration').textContent=clock(course.tracks[index].length);if(index===currentTrack&&narrationReady()){seekToPosition(time,keepPlaying);return;}
 if(index!==currentTrack){waveform.pause();if(audio.getAttribute('src')){replaceMedia();}currentTrack=index;const request=playbackRequest,track=course.tracks[index];waveform.load(loadedMediaURL=audioCache.get(index),[track.peaks],track.length).catch(error=>{if(request!==playbackRequest||error.name==='AbortError')return;pendingPlay=false;status('Narration could not load. Choose Play to retry.');});}
 $('audio-seek').max=course.tracks[index].length;$('audio-seek').value=time;$('elapsed').textContent=clock(time);$('duration').textContent=clock(course.tracks[index].length);status('Loading original narration…');setPlaying();
}
function show(index,{seek=true,focus=false,scroll=false,keepPlaying=!audio.paused||pendingPlay}={}){current=Math.max(0,Math.min(index,course.chapters.length-1));const c=chapter();document.querySelector('.course-hero').hidden=!c.opening;heroMotion?.setActive(!!c.opening);all('[data-lesson]').forEach(x=>x.hidden=x.dataset.lesson!==c.id);all('.chapter-link').forEach(a=>{if(a.dataset.go===c.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});const group=document.querySelector(`[data-module="${c.module}"]`);if(!c.opening)group.open=true;
 $('lesson-title').textContent=c.heading;$('lesson-breadcrumb').textContent=c.opening?'OPENING / WELCOME':`MODULE ${c.lesson?.replace(/^00\./,'0.')||c.section||'0'+c.module} / ${course.modules[c.module].title.toUpperCase()}`;$('lesson-position').textContent=c.opening?'BEFORE MODULE 0':c.section?`MODULE ${c.lesson}`:`LESSON ${String(current).padStart(2,'0')} / ${course.chapters.filter(c=>!c.opening).length}`;updateModuleContext();$('now-title').textContent=c.title;$('recording-label').textContent=c.opening?'Course opening · Before Module 0':`Module ${c.module} · Lesson ${c.lesson}`;drawReferences();mountScene();switchTab(article(),'understand');
 if(seek)loadTrack(c.track,c.at,keepPlaying);else setPlaying();history.replaceState(null,'','#'+c.id);write('cip-studio-last',c.id);if(c.opening)write('cip-studio-opening-seen',true);if(seek)setLessonsOpen(false,{restoreFocus:false});
 const link=document.querySelector(`.chapter-link[data-go="${c.id}"]`),scroller=$('lesson-scroll');if(link&&scroller.clientHeight){const a=link.getBoundingClientRect(),b=scroller.getBoundingClientRect();if(a.top<b.top)scroller.scrollTop+=a.top-b.top-12;else if(a.bottom>b.bottom)scroller.scrollTop+=a.bottom-b.bottom+12;}
 if(scroll&&document.documentElement.scrollTop>250)$('lesson-content').scrollIntoView({block:'start',behavior:'instant'});if(focus)$('lesson-content').focus({preventScroll:true});if(!reduced)gsap.fromTo(article().querySelector('.lesson-heading'),{opacity:.65,y:7},{opacity:1,y:0,duration:.32,ease:'power2.out',overwrite:true});
}
function updateTimeline(){if(scrubbing||!narrationReady())return;settleSeek();if(pendingSeek!==null||audio.seeking)return;const duration=Number.isFinite(audio.duration)?audio.duration:course.tracks[currentTrack]?.length||0;const time=audio.currentTime||0;$('elapsed').textContent=clock(time);$('duration').textContent=clock(duration);$('audio-seek').max=duration;$('audio-seek').value=time;$('audio-seek').setAttribute('aria-valuetext',`${clock(time)} of ${clock(duration)}`);
 if(follow){const candidates=course.chapters.filter(c=>c.track===currentTrack&&c.at<=time+.02);const active=candidates[candidates.length-1];if(active&&active.id!==chapter().id)show(course.chapters.indexOf(active),{seek:false});if(active){const c=chapter(),next=course.chapters[current+1];const end=next&&next.track===c.track?next.at:duration;const fraction=(time-c.at)/Math.max(1,end-c.at);const step=Math.min(2,Math.max(0,Math.floor(fraction*3)));if(step!==sceneStep&&!scene?.isPlaying())setStep(step);}}
}
function startNarration(){pendingPlay=true;if(!narrationReady()){status('Preparing narration · playback will start when ready');return;}seekNarration();settleSeek();if(pendingSeek!==null||audio.seeking){status('Buffering selected section…');return;}if(playInFlightRequest===playbackRequest)return;const request=playbackRequest;playInFlightRequest=request;waveform.play().then(()=>{if(playInFlightRequest===request)playInFlightRequest=-1;if(request!==playbackRequest)return;pendingPlay=false;status('Original narration · '+course.tracks[currentTrack].label);}).catch(()=>{if(playInFlightRequest===request)playInFlightRequest=-1;if(request!==playbackRequest)return;pendingPlay=false;status('Playback could not start. Choose Play to retry.');});}
function play(){if(!audio.paused){playbackRequest++;pendingPlay=false;waveform.pause();return;}startNarration();}
function prepareNarration(){if(!narrationReady())return;seekNarration();updateTimeline();if(pendingPlay)startNarration();else if(pendingSeek!==null)status('Buffering selected section…');else if(audio.paused)status('Original narration ready');}
// Detach the previous element's events before a segment switch. Its currentSrc
// can remain stale during unload; a fresh element prevents WaveSurfer autoload
// from reviving the previous segment.
function bindMediaEvents(){mediaEvents?.abort();mediaEvents=new AbortController();const listen=(event,handler)=>audio.addEventListener(event,handler,{signal:mediaEvents.signal});
for(const event of ['loadedmetadata','loadeddata','progress','canplay','canplaythrough'])listen(event,prepareNarration);
listen('timeupdate',updateTimeline);listen('seeked',()=>{updateTimeline();if(pendingPlay&&pendingSeek===null)startNarration();});listen('play',setPlaying);listen('pause',setPlaying);listen('waiting',()=>status('Buffering narration…'));listen('canplay',()=>{if(!audio.paused)status('Playing original narration');});listen('error',()=>{pendingPlay=false;status('Narration could not load. Choose Play to retry, or read the lesson text.');setPlaying();});listen('ended',()=>{if(scrubbing||!narrationReady()||pendingSeek!==null||audio.seeking||audio.currentTime<audio.duration-.1)return;if(!follow){pendingPlay=false;status('Recording complete · choose your next lesson');setPlaying();return;}const next=course.chapters.findIndex(c=>c.track===currentTrack+1);if(next>=0)show(next,{keepPlaying:true,seek:true});else{pendingPlay=false;status('You reached the end of the narration');setPlaying();}});
}
function replaceMedia(){mediaEvents?.abort();waveform.destroy();const previous=audio;previous.pause();previous.removeAttribute('src');previous.load();const next=document.createElement('audio');next.id='course-audio';next.preload='auto';next.playbackRate=Number($('speed').value);previous.replaceWith(next);audio=next;bindMediaEvents();waveform=createWaveform();}
bindMediaEvents();
$('play').addEventListener('click',()=>{if(audio.error){const time=chapter().at;currentTrack=-1;loadTrack(chapter().track,time,true);return;}play();});
$('back-10').addEventListener('click',()=>{if(narrationReady()){playbackRequest++;seekToPosition(Math.max(0,audio.currentTime-10),!audio.paused||pendingPlay);}});$('forward-10').addEventListener('click',()=>{if(narrationReady()){playbackRequest++;seekToPosition(Math.min(audio.duration,audio.currentTime+10),!audio.paused||pendingPlay);}});
// Both pointer scrubbing and the keyboard slider use WaveSurfer's media player.
function beginScrub(){if(scrubbing)return;scrubWasPlaying=!audio.paused||pendingPlay;scrubbing=true;playbackRequest++;pendingPlay=false;waveform.pause();}
function previewScrub(time){$('elapsed').textContent=clock(time);$('audio-seek').value=time;$('audio-seek').setAttribute('aria-valuetext',`${clock(time)} of ${clock(course.tracks[currentTrack].length)}`);}
function commitScrub(time){scrubbing=false;scrubWasPlaying=false;playbackRequest++;seekToPosition(time,true);}
function cancelScrub(){if(!scrubbing)return;const resume=scrubWasPlaying;scrubbing=false;scrubWasPlaying=false;updateTimeline();if(resume)startNarration();}
function createWaveform(){
 const wave=WaveSurfer.create({container:$('waveform'),media:audio,backend:'MediaElement',height:window.matchMedia('(max-width:720px)').matches?25:36,waveColor:'#73866b',progressColor:'#e8be85',cursorColor:'#ffd6a0',cursorWidth:2,barWidth:2,barGap:3,barRadius:1,barMinHeight:3,normalize:true,fillParent:true,hideScrollbar:true,autoScroll:false,autoCenter:false,interact:true,dragToSeek:{debounceTime:0},autoplay:false});
 wave.on('interaction',time=>{if(scrubbing){previewScrub(time);return;}commitScrub(time);});
 wave.on('dragstart',beginScrub);
 wave.on('dragend',fraction=>commitScrub(fraction*course.tracks[currentTrack].length));
 wave.getWrapper().addEventListener('pointercancel',cancelScrub);
 return wave;
}
$('audio-seek').addEventListener('input',e=>{beginScrub();previewScrub(Number(e.target.value));});
$('audio-seek').addEventListener('change',e=>commitScrub(Number(e.target.value)));
$('audio-seek').addEventListener('pointercancel',cancelScrub);
$('audio-seek').addEventListener('keydown',e=>{if(e.key==='Escape')cancelScrub();});
$('speed').addEventListener('change',(e)=>waveform.setPlaybackRate(Number(e.target.value)));
all('[data-go]').forEach(a=>a.addEventListener('click',(e)=>{e.preventDefault();const index=course.chapters.findIndex(c=>c.id===a.dataset.go);if(index>=0){a.closest('dialog')?.close();show(index,{seek:true,focus:true,scroll:true});}}));
window.addEventListener('hashchange',()=>{const index=course.chapters.findIndex(c=>c.id===location.hash.slice(1));if(index>=0)show(index,{seek:true,focus:true});});
all('[data-lesson]').forEach(root=>{const tabs=all('[role=tab]',root);tabs.forEach((b,i)=>{b.addEventListener('click',()=>switchTab(root,b.dataset.tab));b.addEventListener('keydown',(e)=>{let target=null;if(e.key==='ArrowRight')target=(i+1)%tabs.length;if(e.key==='ArrowLeft')target=(i+tabs.length-1)%tabs.length;if(e.key==='Home')target=0;if(e.key==='End')target=tabs.length-1;if(target!==null){e.preventDefault();switchTab(root,tabs[target].dataset.tab,true);}});});root.querySelector('[data-complete]').addEventListener('change',(e)=>{completed[e.target.dataset.complete]=e.target.checked;write('cip-studio-complete',completed);updateProgress();});root.querySelector('[data-scene-play]').addEventListener('click',()=>{if(!scene||reduced)return;if(scene.isPlaying())scene.pause();else{if(scene.currentTime()>=scene.duration()-.02)scene.seek(0);scene.play();}});root.querySelector('[data-scene-reset]').addEventListener('click',()=>setStep(0,true));});
all('[data-define]').forEach(b=>b.addEventListener('click',()=>{$('glossary-search').value=b.dataset.define;$('glossary-search').dispatchEvent(new Event('input'));$('glossary-dialog').showModal();}));
all('[data-lab-copy]').forEach(button=>button.addEventListener('click',async()=>{const text=button.closest('.guided-command').querySelector('code').textContent,out=button.nextElementSibling;try{await navigator.clipboard.writeText(text);out.textContent='Copied';}catch{out.textContent='Select the text and copy it manually.';}}));

// Nonmodal drawers keep the narration controls available while consulting lessons or references.
const resourcesDrawer=$('resources-drawer'),resourcesToggle=$('resources-toggle'),lessonsDrawer=$('course-nav'),lessonsToggle=$('nav-toggle'),panelsToggle=$('panels-toggle');
let resourcesReturnFocus=null,lessonsReturnFocus=null;
function syncPanelsControl(){
 const expanded=lessonsDrawer.classList.contains('is-open')&&resourcesDrawer.classList.contains('is-open');
 document.body.classList.toggle('panels-all-open',expanded);
 panelsToggle.setAttribute('aria-expanded',String(expanded));
 const action=expanded?'Collapse':'Expand';
 $('panels-label').textContent=action+' panels';panelsToggle.setAttribute('aria-label',action+' all panels');panelsToggle.title=action+' all panels';
}
function updateDrawer(drawer,toggle,open,returnFocus,initialFocus,{restoreFocus=true}={}){
 if(!open&&restoreFocus&&drawer.contains(document.activeElement)){
  const target=returnFocus?.isConnected&&!returnFocus.closest('[hidden],[inert]')?returnFocus:toggle;
  target.focus({preventScroll:true});
 }
 drawer.classList.toggle('is-open',open);drawer.inert=!open;drawer.toggleAttribute('inert',!open);
 drawer.setAttribute('aria-hidden',String(!open));toggle.setAttribute('aria-expanded',String(open));
 if(open)initialFocus?.focus({preventScroll:true});syncPanelsControl();
}
function setLessonsOpen(open,options={}){
 if(open){lessonsReturnFocus=document.activeElement;setResourcesOpen(false);}
 updateDrawer(lessonsDrawer,lessonsToggle,open,lessonsReturnFocus,document.querySelector('.chapter-link[aria-current="page"]')||$('nav-close'),options);
}
function setResourcesOpen(open){
 if(open){resourcesReturnFocus=document.activeElement;setLessonsOpen(false);}
 updateDrawer(resourcesDrawer,resourcesToggle,open,resourcesReturnFocus,$('resources-close'));
}
for(const [drawer,label] of [[resourcesDrawer,'resources-title'],[lessonsDrawer,'lessons-drawer-title']]){
 drawer.setAttribute('role','dialog');drawer.setAttribute('aria-labelledby',label);drawer.inert=true;drawer.setAttribute('inert','');drawer.setAttribute('aria-hidden','true');
}
syncPanelsControl();
panelsToggle.addEventListener('click',()=>{
 const open=panelsToggle.getAttribute('aria-expanded')!=='true';
 if(open){lessonsReturnFocus=panelsToggle;resourcesReturnFocus=panelsToggle;}
 updateDrawer(lessonsDrawer,lessonsToggle,open,lessonsReturnFocus,null);
 updateDrawer(resourcesDrawer,resourcesToggle,open,resourcesReturnFocus,null);
});
resourcesToggle.addEventListener('click',()=>setResourcesOpen(!resourcesDrawer.classList.contains('is-open')));
$('resources-close').addEventListener('click',()=>setResourcesOpen(false));
lessonsToggle.addEventListener('click',()=>setLessonsOpen(!lessonsDrawer.classList.contains('is-open')));
$('nav-close').addEventListener('click',()=>setLessonsOpen(false));
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape'||event.defaultPrevented||document.querySelector('dialog[open]'))return;
 if(lessonsDrawer.classList.contains('is-open')&&lessonsDrawer.contains(event.target)){event.preventDefault();setLessonsOpen(false);}
 else if(resourcesDrawer.classList.contains('is-open')){event.preventDefault();setResourcesOpen(false);}
 else if(lessonsDrawer.classList.contains('is-open')){event.preventDefault();setLessonsOpen(false);}
});
document.addEventListener('pointerdown',event=>{
 if(event.target.closest('.audio-dock,dialog,#panels-toggle'))return;
 if(document.body.classList.contains('panels-all-open')&&[resourcesDrawer,lessonsDrawer,resourcesToggle,lessonsToggle].some(surface=>surface.contains(event.target)))return;
 if(resourcesDrawer.classList.contains('is-open')&&!resourcesDrawer.contains(event.target)&&!resourcesToggle.contains(event.target))setResourcesOpen(false);
 if(lessonsDrawer.classList.contains('is-open')&&!lessonsDrawer.contains(event.target)&&!lessonsToggle.contains(event.target))setLessonsOpen(false);
});
for(const name of ['glossary','settings','primer'])$(name+'-open').addEventListener('click',()=>$(name+'-dialog').showModal());
all('dialog').forEach(d=>d.addEventListener('click',(e)=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('glossary-search').addEventListener('input',(e)=>{const q=e.target.value.toLowerCase();all('[data-term]').forEach(t=>t.hidden=!t.textContent.toLowerCase().includes(q));});
$('follow-audio').checked=follow;$('follow-audio').addEventListener('change',(e)=>{follow=e.target.checked;persistPrefs();if(follow)updateTimeline();});
function applyTheme(){document.documentElement.dataset.theme=theme;$('theme-choice').value=theme;$('theme-color').content=theme==='dark'?'#14231d':'#f5f3ec';scene?.setTheme?.(theme==='dark'?'midnight':'paper');}
$('theme-choice').addEventListener('change',e=>{theme=e.target.value==='dark'?'dark':'light';applyTheme();persistPrefs();});
function applyReduced(){document.body.classList.toggle('motion-off',reduced);if(reduced){gsap.globalTimeline.getChildren().forEach(t=>t.kill());scene?.pause();}heroMotion?.setReduced(reduced);all('[data-scene-play]').forEach(b=>{b.disabled=reduced;b.title=reduced?'Motion is reduced. Use the three walkthrough steps.':'';});$('reduced-motion').checked=reduced;}
$('reduced-motion').addEventListener('change',(e)=>{reduced=e.target.checked;applyReduced();persistPrefs();});media.addEventListener('change',(e)=>{reduced=e.matches;applyReduced();persistPrefs();});$('larger-text').checked=!!prefs.large;document.body.classList.toggle('large-text',!!prefs.large);$('larger-text').addEventListener('change',(e)=>{document.body.classList.toggle('large-text',e.target.checked);persistPrefs();scene?.resize();});
document.body.classList.add('enhanced');applyTheme();applyReduced();updateProgress();
installationGuide=initInstallations({doc:document});
const initialId=location.hash.slice(1)||(!safeRead('cip-studio-opening-seen',false)?'opening':safeRead('cip-studio-last','opening'));let initial=course.chapters.findIndex(c=>c.id===initialId);if(initial<0)initial=0;show(initial,{keepPlaying:false,seek:true});
heroMotion=createHeroMotion({doc:document,gsap,reduced});

// Hydrate all segment audio after the DOM is ready, without delaying the player.
const hydrateAudio=()=>{audioCache.warmAll(currentTrack);};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hydrateAudio,{once:true});else hydrateAudio();
window.addEventListener('pagehide',event=>{if(!event.persisted){heroMotion?.dispose();waveform.destroy();audioCache.dispose();}});

window.addEventListener('resize',()=>waveform.setOptions({height:window.matchMedia('(max-width:720px)').matches?25:36}));

initReadiness({doc:document,onContinue:guide=>{installationGuide.selectOS(guide==='macos'?'mac':guide);show(course.chapters.findIndex(c=>c.id==='preflight'),{seek:true,focus:true,scroll:true});const picker=document.querySelector('[data-install-os]');picker.scrollIntoView({block:'center',behavior:'instant'});picker.focus({preventScroll:true});}});
