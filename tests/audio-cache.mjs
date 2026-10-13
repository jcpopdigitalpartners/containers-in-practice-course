import assert from 'node:assert/strict';
import {createAudioCache} from '../src/scripts/audio-cache.js';
let active=0,maximum=0,created=0;
const requested=[],revoked=[];
const cache=createAudioCache({
 count:10,urlFor:index=>`/segment-${index}.mp3`,
 fetchAudio:async(url,options)=>{
  requested.push({url,options});active++;maximum=Math.max(maximum,active);
  await new Promise(resolve=>setTimeout(resolve,2));active--;
  return {ok:url!=='/segment-5.mp3',blob:async()=>new Blob([url])};
 },
 createObjectURL:()=>`blob:segment-${created++}`,revokeObjectURL:url=>revoked.push(url)
});
assert.equal(cache.get(2),'/segment-2.mp3','Stream immediately before hydration');
const warming=cache.warmAll(2);
assert.equal(cache.warmAll(2),warming,'Only one preload queue runs');
await warming;
assert.equal(requested.length,10);assert.equal(new Set(requested.map(x=>x.url)).size,10);
assert.equal(requested[0].url,'/segment-2.mp3');assert.equal(maximum,3);
assert.ok(requested.every(x=>x.options.cache==='force-cache'));
assert.ok(cache.get(2).startsWith('blob:segment-'));
assert.equal(cache.get(5),'/segment-5.mp3','Failed preloads retain direct playback');
cache.dispose();assert.equal(revoked.length,9);assert.ok(requested.every(x=>x.options.signal.aborted));
assert.equal(cache.get(2),'/segment-2.mp3');
console.log('PASS: every segment preloaded once, three simultaneous requests, immediate streaming fallback, reusable cached bytes, failure fallback, cleanup');
