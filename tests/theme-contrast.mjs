import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const courseCSS=fs.readFileSync('src/styles/course.css','utf8'),themeCSS=fs.readFileSync('src/styles/themes.css','utf8');
function declarations(css,selector){const start=css.indexOf(selector+'{');assert.ok(start>=0,selector);return Object.fromEntries(css.slice(start+selector.length+1,css.indexOf('}',start)).split(';').filter(Boolean).map(entry=>{const colon=entry.indexOf(':');return [entry.slice(0,colon).trim(),entry.slice(colon+1).trim()];}));}
function luminance(hex){assert.match(hex,/^#[0-9a-f]{6}$/i);const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);return channels.reduce((sum,value,i)=>sum+value*[0.2126,0.7152,0.0722][i],0);}
function check(text,background,label){const a=luminance(text),b=luminance(background),ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);assert.ok(ratio>=4.5,`${label}: ${ratio.toFixed(2)}:1`);return ratio;}
const light=declarations(courseCSS,':root'),dark=declarations(themeCSS,':root[data-theme=dark]'),rail=declarations(themeCSS,'.resources'),darkRail=declarations(themeCSS,':root[data-theme=dark] .resources');
const ratios=[];
for(const [label,tokens] of [['light',light],['dark',dark]])for(const foreground of ['--ink','--muted','--orange'])ratios.push(check(tokens[foreground],tokens['--paper'],`${label} ${foreground}`));
for(const background of [rail.background,darkRail.background])for(const foreground of [rail.color,rail['--muted'],rail['--orange']])ratios.push(check(foreground,background,'Resources text, secondary text and links'));
const code=declarations(themeCSS,'.resources pre');ratios.push(check(code.color,code.background,'Resources commands'));
const doc=new JSDOM(fs.readFileSync('dist/index.html','utf8')).window.document;
assert.ok(doc.querySelector('.side-heading #module-context'));
assert.ok(!doc.querySelector('#lesson-scroll .side-heading'));
assert.equal(doc.querySelectorAll('#lesson-scroll .chapter-link').length,45);
assert.deepEqual([...doc.querySelectorAll('#theme-choice option')].map(el=>el.value),['light','dark']);
assert.ok(doc.querySelector('#theme-toggle'));
const svg=doc.querySelector('.hero-art svg'),dots=svg.querySelector('rect');assert.equal(svg.getAttribute('viewBox'),'0 0 280 235');assert.ok(Number(dots.getAttribute('x'))<0);assert.equal(Number(dots.getAttribute('x'))+Number(dots.getAttribute('width')),280);
console.log(`PASS: primary/secondary/accent text in both themes and Resources meet 4.5:1 (lowest ${Math.min(...ratios).toFixed(1)}:1); fixed header outside all 45 scrollable links, theme choices, extended dot field with unchanged illustration viewport`);
