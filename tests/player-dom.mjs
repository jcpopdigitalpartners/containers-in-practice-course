import {createHeroMotion} from '../src/scripts/hero-motion.js';
import {initInstallations} from '../src/scripts/installations.js';
import {initReadiness} from '../src/scripts/readiness.js';
import {createAudioCache} from '../src/scripts/audio-cache.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {parse,compile} from '@markdy/core';
const html=fs.readFileSync('dist/index.html','utf8');
const dom=new JSDOM(html,{url:'https://course.test/',runScripts:'outside-only'});
const w=dom.window,d=w.document,course=JSON.parse(d.getElementById('course-data').textContent);
let paused=true,ready=0,time=0,duration=course.tracks[0].length,playCalls=0,seeking=false,bufferLimit=null;
const ranges=()=>({length:ready>=1?1:0,start:()=>0,end:()=>bufferLimit??duration});
let audio=d.getElementById('course-audio');
const reportedSources=new WeakMap();
Object.defineProperties(w.HTMLMediaElement.prototype,{paused:{get:()=>paused},readyState:{get:()=>ready},seeking:{get:()=>seeking},seekable:{get:ranges},buffered:{get:ranges},currentTime:{get:()=>time,set:v=>{time=bufferLimit!==null&&v>bufferLimit?0:v}},duration:{get:()=>duration},currentSrc:{get(){return reportedSources.get(this)||'';}}});
w.HTMLMediaElement.prototype.load=function(){ready=0;paused=true;time=0;this.dispatchEvent(new w.Event('loadstart'));};
w.HTMLMediaElement.prototype.pause=function(){paused=true;this.dispatchEvent(new w.Event('pause'));};
w.HTMLMediaElement.prototype.play=function(){paused=false;playCalls++;this.dispatchEvent(new w.Event('play'));return Promise.resolve();};
w.matchMedia=()=>({matches:false,addEventListener(){}});
w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};
w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
w.HTMLElement.prototype.getBoundingClientRect=()=>({top:0,bottom:36,left:0,right:640,width:640,height:36});
Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get:()=>640});
w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({canvas:this},{get:(target,key)=>key in target?target[key]:()=>{}})};
w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
w.createHeroMotion=createHeroMotion;w.initInstallations=initInstallations;w.initReadiness=initReadiness;w.createAudioCache=createAudioCache;const fetches=[];w.fetch=(url,options)=>new Promise(resolve=>fetches.push({url,options,resolve}));
w.gsap={fromTo(){},set(){},timeline(){return{to(){return this;},play(){return this;},pause(){return this;},kill(){}};},globalTimeline:{getChildren:()=>[]}};
const compiled=new Map(course.chapters.map(c=>[c.scene,compile(parse(c.scene)).beats]));
w.createDiagram=(opts)=>{const beats=compiled.get(opts.code);let t=0,running=false;return{destroy(){},pause(){running=false;opts.onPlayStateChange?.(false)},play(){running=true;opts.onPlayStateChange?.(true)},seek(value){t=value;opts.onTimeUpdate?.(value,beats.at(-1).end)},beats:()=>beats,currentTime:()=>t,duration:()=>beats.at(-1).end,isPlaying:()=>running,resize(){},setTheme(value){w.diagramTheme=value;}}};
vm.runInContext(fs.readFileSync('node_modules/wavesurfer.js/dist/wavesurfer.min.js','utf8'),dom.getInternalVMContext());
const makeWave=w.WaveSurfer.create.bind(w.WaveSurfer);w.WaveSurfer.create=options=>(w.testWave=makeWave(options));
const source=fs.readFileSync('src/scripts/course.js','utf8').replace(/^import .*;\n/gm,'');
vm.runInContext(source,dom.getInternalVMContext());
const el=id=>d.getElementById(id),click=q=>{d.querySelector(q).click();audio=d.getElementById('course-audio');},visible=id=>!d.querySelector(`[data-lesson="${id}"]`).hidden;
const chapter=id=>course.chapters.find(c=>c.id===id);
const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
const metadata=id=>{audio=d.getElementById('course-audio');reportedSources.set(audio,audio.src);duration=course.tracks[chapter(id).track].length;ready=1;audio.dispatchEvent(new w.Event('loadedmetadata'));};
const settle=async id=>{metadata(id);ready=4;audio.dispatchEvent(new w.Event('canplay'));await flush();};
const assertClip=id=>{const c=chapter(id),m=course.modules[c.module];assert.equal(d.querySelector('.course-hero').hidden,!c.opening);assert.equal(el('context-title').textContent,c.opening?'Opening':m.title);assert.equal(el('context-subtitle').textContent,c.opening?'Welcome · before Module 0':m.subtitle);assert.equal(el('context-number').textContent,c.opening?'−0.1':String(c.module));assert.equal(el('module-context').dataset.go,c.opening?'opening':course.chapters.find(x=>!x.opening&&x.module===c.module).id);assert.ok(new URL(audio.src).pathname.endsWith(course.tracks[chapter(id).track].file),`Correct clip for ${id}`);assert.equal(time,0,`Clip starts at zero: ${id}`);assert.ok(visible(id));assert.equal(w.testWave.getDecodedData()?.length,128,'The current segment must have a decoded waveform: '+id);};
assert.ok(visible('opening'));assert.ok(new URL(audio.src).pathname.endsWith('course-opening.mp3'));assert.equal(playCalls,0,'No automatic narration');
click('#play');assert.equal(playCalls,0,'Play waits for metadata');await settle('opening');assert.equal(playCalls,1);
time=duration;audio.dispatchEvent(new w.Event('ended'));await settle('baseline');assertClip('baseline');
const moduleZero=course.chapters.filter(c=>c.module===0&&!c.opening),files=new Set();
for(const c of [...moduleZero].reverse()){
  click(`.chapter-link[data-go="${c.id}"]`);files.add(audio.src);
  audio.dispatchEvent(new w.Event('timeupdate'));assert.ok(visible(c.id),'Loading events do not replace the selected lesson');
  await settle(c.id);assertClip(c.id);assert.equal(el('duration').textContent,`${Math.floor(duration/60)}:${String(Math.floor(duration%60)).padStart(2,'0')}`);
}
assert.equal(files.size,moduleZero.length,'All six Module 0 lessons use distinct MP3s');
const firstSection=course.chapters.filter(c=>c.section==='1.1');
assert.equal(firstSection.length,3);
for(const [i,c] of firstSection.entries()){
  click(`.chapter-link[data-go="${c.id}"]`);await settle(c.id);assertClip(c.id);
  assert.ok(new URL(audio.src).pathname.endsWith(`audacity-mod-11${i}.mp3`));
  assert.equal(el('recording-label').textContent,`Module 1.1.${i} · ${c.title}`);
  assert.equal(el('lesson-position').textContent,`MODULE 1.1.${i}`);
}
const suppliedSecondSection=course.chapters.filter(c=>['1.2.0','1.2.1','1.2.2'].includes(c.lesson));
assert.equal(suppliedSecondSection.length,3);
for(const c of [...suppliedSecondSection].reverse()){
  click(`.chapter-link[data-go="${c.id}"]`);
  audio.dispatchEvent(new w.Event('timeupdate'));assert.ok(visible(c.id),'Loading keeps the selected Module 1.2 lesson');
  await settle(c.id);assertClip(c.id);
  assert.ok(new URL(audio.src).pathname.endsWith(`aud-mod-${c.lesson.replaceAll('.','')}.mp3`));
  assert.equal(new URL(audio.src).searchParams.get('v'),c.audioOverride.sha256.slice(0,16),'Supplied recordings use their content version');
  const recording=d.querySelector('#reference-links a[download]');assert.equal(recording.download,c.audioOverride.file);assert.equal(recording.querySelector('strong').textContent,'Lesson recording ↓');assert.equal(recording.href,audio.src,'Resources downloads the individual supplied clip');
  assert.equal(el('recording-label').textContent,`Module ${c.lesson} · ${c.title}`);
  assert.equal(el('duration').textContent,`${Math.floor(duration/60)}:${String(Math.floor(duration%60)).padStart(2,'0')}`);
}
click('.chapter-link[data-go="network"]');await settle('network');
const scrub=el('audio-seek'),scrubSource=audio.src;
assert.equal(w.testWave.getMediaElement(),audio,'WaveSurfer owns the course media player');assert.equal(w.testWave.options.dragToSeek.debounceTime,0);
assert.equal(w.testWave.getDecodedData().length,128,'WaveSurfer renders measured peaks for the segment');
const waveWrapper=w.testWave.getWrapper();
waveWrapper.dispatchEvent(new w.MouseEvent('click',{clientX:160,clientY:18,bubbles:true}));await flush();
assert.ok(Math.abs(time-duration/4)<.001,'A click on the actual WaveSurfer wrapper seeks to that point');assert.equal(paused,false);assert.ok(visible('network'));
const pointer=(type,x)=>{const event=new w.MouseEvent(type,{clientX:x,clientY:18,button:0,bubbles:true,cancelable:true});Object.defineProperty(event,'pointerId',{value:1});return event;};
waveWrapper.dispatchEvent(pointer('pointerdown',160));w.dispatchEvent(pointer('pointermove',320));
assert.equal(paused,true,'WaveSurfer drag pauses while choosing a position');
time=5;audio.dispatchEvent(new w.Event('timeupdate'));assert.ok(Math.abs(Number(scrub.value)-duration/2)<.1,'WaveSurfer drag is not overwritten by media updates');
w.dispatchEvent(pointer('pointerup',320));await flush();
assert.ok(Math.abs(time-duration/2)<.001);assert.equal(paused,false,'WaveSurfer drag release plays the selected point');
// A queued library drag seek must not leak into a newly selected segment.
w.history.replaceState(null,'','#config');w.dispatchEvent(new w.HashChangeEvent('hashchange'));await settle('config');await new Promise(resolve=>w.setTimeout(resolve,15));assertClip('config');
click('.chapter-link[data-go="network"]');await settle('network');


assert.equal(Number(scrub.max),duration,'Waveform spans the current module clip');
scrub.value='18.4';scrub.dispatchEvent(new w.Event('input'));
assert.equal(paused,true,'Pause playback while choosing a waveform position');
time=4;audio.dispatchEvent(new w.Event('timeupdate'));
assert.equal(Number(scrub.value),18.4,'Playback updates must not overwrite the scrub position');
assert.equal(el('elapsed').textContent,'0:18');
scrub.dispatchEvent(new w.Event('change'));await flush();
assert.equal(time,18.4);assert.equal(paused,false,'Releasing the scrubber plays from the selected position');assert.equal(audio.src,scrubSource);assert.ok(visible('network'));
audio.pause();scrub.value='7.2';scrub.dispatchEvent(new w.Event('input'));audio.dispatchEvent(new w.Event('timeupdate'));
assert.equal(Number(scrub.value),7.2);scrub.dispatchEvent(new w.Event('change'));await flush();
assert.equal(time,7.2);assert.equal(paused,false,'Clicking a paused waveform starts playback at the chosen position');
scrub.value='30';scrub.dispatchEvent(new w.Event('input'));scrub.dispatchEvent(new w.Event('pointercancel'));await flush();
assert.equal(time,7.2);assert.equal(Number(scrub.value),7.2);assert.equal(paused,false,'Cancelling a drag resumes its original position');
audio.pause();scrub.value='40';scrub.dispatchEvent(new w.Event('input'));scrub.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));
assert.equal(Number(scrub.value),7.2);assert.equal(paused,true,'Cancelling a paused scrub keeps it paused');
scrub.value='45';scrub.dispatchEvent(new w.Event('input'));click('.chapter-link[data-go="config"]');await settle('config');
time=3;audio.dispatchEvent(new w.Event('timeupdate'));assert.equal(Number(scrub.value),3,'Changing segments clears an unfinished scrub');assert.ok(visible('config'));

click('.chapter-link[data-go="preflight"]');await settle('preflight');
const range=el('audio-seek');bufferLimit=2;const callsBeforeBuffer=playCalls;
range.value='10';range.dispatchEvent(new w.Event('change'));
assert.equal(playCalls,callsBeforeBuffer,'Do not play the beginning while the requested position is unavailable');assert.equal(paused,true);
bufferLimit=15;audio.dispatchEvent(new w.Event('progress'));await flush();assert.equal(time,10);assert.equal(paused,false);bufferLimit=null;
seeking=true;range.value='8';range.dispatchEvent(new w.Event('change'));time=0;audio.dispatchEvent(new w.Event('timeupdate'));assert.ok(visible('preflight'));assert.equal(paused,true);
time=8;seeking=false;audio.dispatchEvent(new w.Event('seeked'));await flush();assert.equal(paused,false);assert.equal(time,8);
click('.chapter-link[data-go="m4-2"]');audio.dispatchEvent(new w.Event('timeupdate'));assert.ok(visible('m4-2'));await settle('m4-2');assertClip('m4-2');
range.value='12.3';range.dispatchEvent(new w.Event('change'));await flush();assert.equal(time,12.3,'Waveform seeks within the selected lesson');assert.ok(visible('m4-2'));
click('#follow-audio');time=duration;audio.dispatchEvent(new w.Event('ended'));assert.ok(visible('m4-2'),'Follow off keeps the current clip at its end');
click('#reduced-motion');assert.ok(d.body.classList.contains('motion-off'));assert.ok(d.querySelector('[data-lesson="m4-2"] [data-scene-play]').disabled);
click('[data-step="2"]');assert.equal(d.querySelector('[data-lesson="m4-2"] [data-scene-step]').textContent,'03');
const tabs=d.querySelectorAll('[data-lesson="m4-2"] [role=tab]');tabs[0].dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(tabs[1].getAttribute('aria-selected'),'true');assert.equal(d.activeElement,tabs[1]);
click('#follow-audio');
click('.chapter-link[data-go="m3-8"]');await settle('m3-8');time=duration;audio.dispatchEvent(new w.Event('ended'));await settle('m4-0');assertClip('m4-0');assert.equal(paused,false,'Clip-end continuation plays the next module');
for(const playing of [false,true]){
  paused=!playing;click('.opening-link');await settle('opening');
  for(let i=1;i<course.chapters.length;i++){
    const previous=course.chapters[i-1],next=course.chapters[i];
    click(`[data-lesson="${previous.id}"] .next-link`);
    audio.dispatchEvent(new w.Event('timeupdate'));audio.dispatchEvent(new w.Event('ended'));assert.ok(visible(next.id),`Next remains on ${next.id} while loading`);
    await settle(next.id);audio.dispatchEvent(new w.Event('timeupdate'));assertClip(next.id);
    assert.equal(w.location.hash,'#'+next.id);assert.equal(paused,!playing,'Navigation preserves playback state');
  }
  for(let i=course.chapters.length-2;i>=0;i--){
    const from=course.chapters[i+1],previous=course.chapters[i];
    click(`[data-lesson="${from.id}"] .lesson-navigation a:not(.next-link)`);
    audio.dispatchEvent(new w.Event('timeupdate'));assert.ok(visible(previous.id));await settle(previous.id);assertClip(previous.id);assert.equal(paused,!playing);
  }
}
for(const c of course.chapters){
  const previousMedia=audio;
  click(`.chapter-link[data-go="${c.id}"]`);await settle(c.id);
  const src=audio.src;
  w.testWave.getWrapper().dispatchEvent(new w.MouseEvent('click',{clientX:320,clientY:18,bubbles:true}));await flush();
  assert.ok(Math.abs(time-duration/2)<.001,'WaveSurfer scrubs this segment: '+c.id);assert.equal(paused,false);assert.equal(audio.src,src);assert.ok(visible(c.id));
  assert.equal(w.testWave.options.height,36);assert.equal(w.testWave.getDecodedData().length,128);
  if(previousMedia!==audio){const before=el('audio-status').textContent;for(const event of ['waiting','error','ended','timeupdate'])previousMedia.dispatchEvent(new w.Event(event));assert.equal(el('audio-status').textContent,before,'Old media events cannot affect the current player');assert.ok(visible(c.id));}
}
el('speed').value='1.25';el('speed').dispatchEvent(new w.Event('change'));click('.chapter-link[data-go="network"]');await settle('network');assert.equal(audio.playbackRate,1.25,'Speed is retained when replacing the media element');
console.log('PASS: DOM-ready audio hydration and cached segment playback, six supplied Module 1.1/1.2 clips and section navigation, six distinct Module 0 clips, 45 lessons via Next/Previous while paused/playing, waveform/click scrubbing in every segment with stale source and event isolation, clip-end continuation, real WaveSurfer playback/click seeking, keyboard scrubbing with media events and cancellation, buffering/seek completion, no autoplay, waveform, reduced motion, tabs, contextual setup and navigation');
// DOM-ready warming starts three requests and does not delay initial playback.
assert.equal(fetches.length,3);assert.ok(fetches.every(request=>request.options.cache==='force-cache'));
const cachedFile=new URL(fetches[0].url).pathname;
fetches[0].resolve({ok:true,blob:async()=>new w.Blob(['segment audio'],{type:'audio/mpeg'})});await flush();
assert.equal(fetches.length,4,'Preloading continues as slots become available');
const cachedChapter=course.chapters.find(c=>cachedFile.endsWith(course.tracks[c.track].file));
if(!paused)click('#play');click('.chapter-link[data-go="network"]');await settle('network');
click(`.chapter-link[data-go="${cachedChapter.id}"]`);await settle(cachedChapter.id);
assert.equal(audio.src,'blob:test','Selecting a hydrated segment uses its cached audio bytes');
assert.ok(visible(cachedChapter.id));assert.equal(time,0);
click('#play');await flush();assert.equal(paused,false,'A hydrated segment plays through WaveSurfer');
const nativeURL=audio.src;el('audio-seek').value='5';el('audio-seek').dispatchEvent(new w.Event('change'));await flush();
assert.equal(time,5);assert.equal(audio.src,nativeURL,'Scrubbing reuses the hydrated segment');
// Installation steps and command starters are available immediately.
click('.chapter-link[data-go="toolchain"]');await settle('toolchain');
assert.equal(d.querySelector('[data-tool-game]'),null);
assert.equal(d.querySelector('[data-install-content]').hidden,false);
assert.equal(el('copy-commands').disabled,false);assert.equal(el('command-code').textContent,course.chapters.find(c=>c.id==='toolchain').code);
click('.chapter-link[data-go="preflight"]');await settle('preflight');assert.ok(visible('preflight'));
// Readiness hands off to the learner's OS installation path in Module 0.1.
click('.opening-link');await settle('opening');
const measurements={os:'mac',cores:8,ram:16,disk:40,arch:'yes',runtime:'yes',source:'guest'};
for(const [key,value] of Object.entries(measurements))el('readiness-'+key).value=String(value);
el('readiness-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
click('#readiness-to-os');await settle('preflight');assert.ok(visible('preflight'));assertClip('preflight');
assert.equal(d.querySelector('[data-install-os]').value,'mac');assert.equal(d.activeElement,d.querySelector('[data-install-os]'));
assert.equal(d.querySelector('[data-install-platform="mac"]').hidden,false);
assert.equal(el('lesson-search'),null);assert.equal(el('setup-dialog'),null);
click('#nav-toggle');assert.equal(el('nav-toggle').getAttribute('aria-expanded'),'true');assert.equal(d.activeElement,d.querySelector('.chapter-link[aria-current="page"]'));
click('#nav-toggle');assert.equal(el('nav-toggle').getAttribute('aria-expanded'),'false');
// The lesson drawer is available on every viewport and preserves narration when opened.
const lessons=el('course-nav'),lessonToggle=el('nav-toggle');
assert.equal(lessons.inert,true);assert.equal(lessons.getAttribute('aria-hidden'),'true');
const lessonDrawerSnapshot={src:audio.src,time,paused,playCalls};
lessonToggle.focus();click('#nav-toggle');assert.equal(lessons.inert,false);assert.equal(lessons.getAttribute('aria-hidden'),'false');
click('#nav-close');assert.equal(lessons.inert,true);assert.equal(d.activeElement,lessonToggle);
click('#nav-toggle');d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
assert.equal(lessonToggle.getAttribute('aria-expanded'),'false');assert.equal(d.activeElement,lessonToggle);
click('#nav-toggle');el('play').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(lessonToggle.getAttribute('aria-expanded'),'true');
el('main').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(lessonToggle.getAttribute('aria-expanded'),'false');
assert.deepEqual({src:audio.src,time,paused,playCalls},lessonDrawerSnapshot,'Lesson drawer preserves media state');
click('#nav-toggle');click('.chapter-link[data-go="toolchain"]');await settle('toolchain');
assert.equal(lessonToggle.getAttribute('aria-expanded'),'false');assert.equal(lessons.inert,true);assert.equal(d.activeElement,el('lesson-content'));
assert.deepEqual([...d.querySelectorAll('.module-number')].map(x=>x.textContent),['0','1','2','3','4']);
// Guided practice copies a single command/file block and keeps its narration selected.
click('.chapter-link[data-go="image"]');await settle('image');let copiedGuide='';
Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{copiedGuide=text;}}});
const recipeBlock=[...d.querySelectorAll('#image-walkthrough .guided-command')].find(block=>block.querySelector('code').textContent.startsWith('FROM '));
const guideSource=audio.src;recipeBlock.querySelector('[data-lab-copy]').click();await flush();
assert.equal(copiedGuide,recipeBlock.querySelector('code').textContent);assert.equal(recipeBlock.querySelector('[role=status]').textContent,'Copied');assert.equal(audio.src,guideSource);assert.ok(visible('image'));
// Theme changes preserve the active narration and use Markdy's runtime palette switch.
assert.equal(d.documentElement.dataset.theme,'light');assert.equal(w.diagramTheme,'paper');
if(paused)click('#play');await flush();time=6;audio.dispatchEvent(new w.Event('timeupdate'));
const themeSnapshot={src:audio.src,time,paused,playCalls,speed:audio.playbackRate};
click('#theme-toggle');assert.equal(d.documentElement.dataset.theme,'dark');assert.equal(el('theme-choice').value,'dark');assert.equal(w.diagramTheme,'midnight');
assert.equal(el('theme-toggle').getAttribute('aria-label'),'Switch to light theme');
assert.deepEqual({src:audio.src,time,paused,playCalls,speed:audio.playbackRate},themeSnapshot,'Theme switching preserves media state');
const darkPreferences=w.localStorage.getItem('cip-studio-preferences');assert.equal(JSON.parse(darkPreferences).theme,'dark');assert.equal(JSON.parse(darkPreferences).reduced,el('reduced-motion').checked);
const textSnapshot={src:audio.src,time,paused,playCalls};
el('larger-text').checked=true;el('larger-text').dispatchEvent(new w.Event('change'));
assert.ok(d.body.classList.contains('large-text'));
assert.equal(JSON.parse(w.localStorage.getItem('cip-studio-preferences')).large,true);
assert.deepEqual({src:audio.src,time,paused,playCalls},textSnapshot,'Text resizing preserves narration');
click('.chapter-link[data-go="network"]');await settle('network');assert.equal(w.diagramTheme,'midnight');assertClip('network');
assert.ok(d.body.classList.contains('large-text'),'New diagrams inherit the Larger Text preference');
el('larger-text').checked=false;el('larger-text').dispatchEvent(new w.Event('change'));
assert.equal(d.body.classList.contains('large-text'),false);
assert.equal(JSON.parse(w.localStorage.getItem('cip-studio-preferences')).large,false);
el('audio-seek').value='8';el('audio-seek').dispatchEvent(new w.Event('change'));await flush();assert.equal(time,8,'Waveform scrubbing works after theme changes');
click('#module-context');await settle('m1-opening');assertClip('m1-opening');
el('theme-choice').value='light';el('theme-choice').dispatchEvent(new w.Event('change'));assert.equal(d.documentElement.dataset.theme,'light');assert.equal(w.diagramTheme,'paper');assert.equal(JSON.parse(w.localStorage.getItem('cip-studio-preferences')).theme,'light');
const restored=new JSDOM(html,{url:'https://course.test/',runScripts:'outside-only'});restored.window.localStorage.setItem('cip-studio-preferences',darkPreferences);vm.runInContext(restored.window.document.getElementById('theme-init').textContent,restored.getInternalVMContext());assert.equal(restored.window.document.documentElement.dataset.theme,'dark','The saved theme is restored before rendering');
restored.window.document.documentElement.dataset.theme='light';Object.defineProperty(restored.window,'localStorage',{get(){throw new Error('Storage blocked');}});vm.runInContext(restored.window.document.getElementById('theme-init').textContent,restored.getInternalVMContext());assert.equal(restored.window.document.documentElement.dataset.theme,'light');restored.window.close();
console.log('PASS: current-module card across all segments, module-intro navigation, light/dark controls, saved theme bootstrap, unavailable storage, diagram palette changes and preserved narration/scrubbing');
// Opening and dismissing references must not interrupt an active recording.
click('.chapter-link[data-go="toolchain"]');await settle('toolchain');
assert.equal(el('lesson-title').textContent,'Tooling should follow the problem');
assert.ok(el('lesson-title').closest('.lesson-toolbar'));
const drawer=el('resources-drawer'),toggle=el('resources-toggle');
assert.equal(drawer.inert,true);assert.equal(drawer.getAttribute('aria-hidden'),'true');
const drawerSnapshot={src:audio.src,time,paused,playCalls};
toggle.focus();click('#resources-toggle');
assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.equal(drawer.inert,false);
assert.equal(d.activeElement,el('resources-close'));
assert.deepEqual({src:audio.src,time,paused,playCalls},drawerSnapshot);
click('#resources-close');assert.equal(d.activeElement,toggle);assert.equal(drawer.inert,true);
click('#resources-toggle');d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(d.activeElement,toggle);
click('#resources-toggle');click('#settings-open');
d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
assert.equal(toggle.getAttribute('aria-expanded'),'true','Escape respects the preferences dialog above the drawer');
el('settings-dialog').close();el('reduced-motion').checked=true;el('reduced-motion').dispatchEvent(new w.Event('change'));
assert.ok(d.body.classList.contains('motion-off'));click('#resources-close');click('#resources-toggle');
assert.equal(toggle.getAttribute('aria-expanded'),'true','Drawer remains usable with reduced motion');
el('play').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
assert.equal(toggle.getAttribute('aria-expanded'),'true','Player interactions keep references open');
el('main').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(drawer.inert,true);
click('#resources-toggle');click('#nav-toggle');assert.equal(toggle.getAttribute('aria-expanded'),'false','Lesson navigation closes overlapping references');
click('#nav-toggle');
assert.deepEqual({src:audio.src,time,paused,playCalls},drawerSnapshot,'Drawer actions preserve playback');
console.log('PASS: toolbar title, drawer open/close/Escape/outside dismissal, focus restoration, modal precedence, reduced motion, navigation coexistence and uninterrupted audio');
// The header control opens and closes both panels together without changing audio.
const allPanels=el('panels-toggle'),panelsSnapshot={src:audio.src,time,paused,playCalls};
allPanels.focus();allPanels.dispatchEvent(new w.Event('pointerdown',{bubbles:true}));click('#panels-toggle');
assert.equal(el('course-nav').inert,false);assert.equal(drawer.inert,false);assert.equal(allPanels.getAttribute('aria-expanded'),'true');
assert.equal(allPanels.getAttribute('aria-label'),'Collapse all panels');assert.equal(el('panels-label').textContent,'Collapse panels');assert.equal(d.activeElement,allPanels);
el('scene-steps').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
assert.equal(el('course-nav').inert,false,'Using Resources keeps Lessons expanded');
el('lesson-scroll').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(drawer.inert,false,'Using Lessons keeps Resources expanded');
allPanels.dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(allPanels.getAttribute('aria-expanded'),'true','Pointer down does not reset the toggle before click');
click('#panels-toggle');assert.equal(el('course-nav').inert,true);assert.equal(drawer.inert,true);assert.equal(allPanels.getAttribute('aria-expanded'),'false');
click('#nav-toggle');assert.equal(el('panels-label').textContent,'Expand panels','A partial state offers to expand both');click('#panels-toggle');
assert.equal(drawer.inert,false);assert.equal(el('course-nav').inert,false);click('#resources-close');assert.equal(el('panels-label').textContent,'Expand panels');
click('#panels-toggle');assert.equal(allPanels.getAttribute('aria-expanded'),'true');
const activeLesson=d.querySelector('.chapter-link[aria-current="page"]');activeLesson.focus();activeLesson.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
assert.equal(el('course-nav').inert,true);assert.equal(drawer.inert,false,'Escape closes the focused lesson panel');
click('#panels-toggle');click('#panels-toggle');
assert.deepEqual({src:audio.src,time,paused,playCalls},panelsSnapshot,'All-panel control preserves narration');
console.log('PASS: header expand/collapse, partial state, pointer sequencing, independent panel use, focused Escape, accessible labels and preserved media');
w.dispatchEvent(new w.PageTransitionEvent('pagehide',{persisted:false}));assert.ok(fetches[1].options.signal.aborted,'Leaving the page aborts background hydration');
w.testWave.destroy();w.close();
