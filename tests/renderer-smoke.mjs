import fs from 'node:fs';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><div id="diagram"></div>',{url:'https://course.test/',pretendToBeVisual:true});const w=dom.window;
for(const k of ['window','document','HTMLElement','SVGElement','Element','CustomEvent','MutationObserver','getComputedStyle'])globalThis[k]=k==='window'?w:k==='getComputedStyle'?w[k].bind(w):w[k];
globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
w.Element.prototype.animate=function(keyframes,options){return{pause(){},cancel(){},play(){},finish(){},currentTime:0,playState:'paused',effect:{getComputedTiming:()=>({duration:typeof options==='number'?options:options?.duration||0}),getTiming:()=>options||{}},finished:Promise.resolve()}};
const mount=w.document.getElementById('diagram');Object.defineProperties(mount,{clientWidth:{get:()=>620},clientHeight:{get:()=>420}});mount.getBoundingClientRect=()=>({width:620,height:420,top:0,left:0,right:620,bottom:420});
const {createDiagram}=await import('@markdy/renderer-dom');const course=JSON.parse(fs.readFileSync('src/data/course.json'));
let instance;
try{
  instance=createDiagram({container:mount,code:course.chapters.find(c=>c.id==='conclusion').scene,autoplay:false,controls:false,interactiveViewport:false,clickToPlay:false,studioLink:false,sceneBoundaryProgress:false,fitMode:'contain',contentPadding:12});
  instance.seek(instance.duration()-.001);
  mount.className='diagram-mount';
  // Load the host rules after the injected renderer stylesheet. jsdom does not
  // implement specificity fully; browsers use the more specific host selectors.
  const style=w.document.createElement('style');
  style.textContent=fs.readFileSync('src/styles/course.css','utf8').split('/* Markdy supplies fixed text sizes,')[1];
  style.textContent='/* Markdy supplies fixed text sizes,'+style.textContent;
  w.document.head.append(style);
  const label=mount.querySelector('.markdy-node__label');
  const caption=mount.querySelector('.markdy-beat-caption');
  const arrow=mount.querySelector('.markdy-edge-label');
  const plate=mount.querySelector('.markdy-edge-plate');
  assert.ok(label&&caption&&arrow&&plate,'The actual Git diagram supplies node, caption and SVG arrow text');
  const normal=parseFloat(w.getComputedStyle(label).fontSize);
  const normalCaption=parseFloat(w.getComputedStyle(caption).fontSize);
  w.document.body.classList.add('large-text');instance.resize();
  assert.equal(parseFloat(w.getComputedStyle(label).fontSize),normal*1.25);
  assert.equal(parseFloat(w.getComputedStyle(caption).fontSize),normalCaption*1.25);
  assert.equal(w.getComputedStyle(arrow).transform,'scale(1.25)');
  assert.equal(w.getComputedStyle(plate).transform,'scale(1.25)','Arrow plates enlarge with their text');
  instance.setTheme('midnight');
  assert.equal(parseFloat(w.getComputedStyle(label).fontSize),normal*1.25,'Theme changes retain the text preference');
  w.document.body.classList.remove('large-text');instance.resize();
  assert.equal(parseFloat(w.getComputedStyle(label).fontSize),normal,'Turning the preference off restores normal labels');
  assert.notEqual(w.getComputedStyle(arrow).transform,'scale(1.25)');
  console.log('PASS: real renderer node labels, beat captions, SVG arrow labels and plates enlarge and restore');
}finally{instance?.destroy();w.close();}
