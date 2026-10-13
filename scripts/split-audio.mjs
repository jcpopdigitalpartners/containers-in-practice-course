import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

// Run from the project root. Committed clips need no FFmpeg at build time.
const dataPath='src/data/course.json';
const course=JSON.parse(fs.readFileSync(dataPath,'utf8'));
const sources=course.sourceTracks??course.tracks;
const chapters=course.chapters.map(c=>({...c,sourceTrack:c.sourceTrack??c.track,sourceAt:c.sourceAt??c.at}));
const audioDirectory='public/audio';
const tracks=[],manifest=[];
function probe(file){return Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'}).trim());}
function peaks(file){
  const pcm=execFileSync('ffmpeg',['-v','error','-i',file,'-f','f32le','-ac','1','-ar','8000','pipe:1'],{maxBuffer:32*1024*1024});
  const samples=pcm.length/4,values=[];
  for(let bin=0;bin<128;bin++){
    const start=Math.floor(bin*samples/128),end=Math.floor((bin+1)*samples/128);let energy=0;
    for(let i=start;i<end;i++){const value=pcm.readFloatLE(i*4);energy+=value*value;}
    values.push(Math.sqrt(energy/Math.max(1,end-start)));
  }
  const maximum=Math.max(...values,.00001);
  return values.map(value=>Math.round(value/maximum*1000)/1000);
}
for(const [index,c] of chapters.entries()){
  const source=sources[c.sourceTrack];
  const next=chapters.filter(other=>other.sourceTrack===c.sourceTrack&&other.sourceAt>c.sourceAt).sort((a,b)=>a.sourceAt-b.sourceAt)[0];
  const end=next?.sourceAt??source.length;
  const file=c.audioOverride?.file??(c.opening?source.file:`lesson-${c.id}.mp3`);
  const output=path.join(audioDirectory,file);
  if(!c.opening&&!c.audioOverride)execFileSync('ffmpeg',['-v','error','-ss',String(c.sourceAt),'-i',path.join(audioDirectory,source.file),'-t',String(end-c.sourceAt),'-map','0:a:0','-c:a','copy','-map_metadata','-1','-write_xing','1','-y',output]);
  for(const alias of c.audioOverride?.legacyFiles??[])fs.copyFileSync(output,path.join(audioDirectory,alias));
  const length=probe(output);
  if(!Number.isFinite(length)||length<=0||(!c.audioOverride&&Math.abs(length-(end-c.sourceAt))>.12))throw new Error(`Unexpected clip duration for ${c.id}: ${length}`);
  tracks.push({file,label:c.opening?source.label:c.section?`Module ${c.lesson} · ${c.title}`:`Module ${c.module} · ${c.lesson} · ${c.title}`,length,peaks:c.opening?source.peaks:peaks(output)});
  manifest.push(c.audioOverride?{lesson:c.id,file,sourceFile:file,sourceStart:0,sourceEnd:length,duration:length,mode:'supplied',uploadedName:c.audioOverride.uploadedName,sha256:c.audioOverride.sha256}:{lesson:c.id,file,sourceFile:source.file,sourceStart:c.sourceAt,sourceEnd:end,duration:length});
  c.sourceEnd=end;c.track=index;c.at=0;
  console.log(`${c.lesson} ${c.title}: ${length.toFixed(2)}s`);
}
course.sourceTracks=sources;course.chapters=chapters;course.tracks=tracks;
fs.writeFileSync(dataPath,JSON.stringify(course,null,2)+'\n');
fs.writeFileSync(path.join(audioDirectory,'lesson-manifest.json'),JSON.stringify({cutMode:'Supplied lesson tracks preserved unchanged; generated clips use MP3 frame copy without re-encoding',clips:manifest},null,2)+'\n');
console.log(`Saved ${tracks.length} lesson recordings; retained ${sources.length} original source recordings.`);
