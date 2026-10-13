// Keep one reusable audio URL per segment. Background loading never replaces
// the active media source; the next selection uses the cached bytes when ready.
export function createAudioCache({count,urlFor,fetchAudio,createObjectURL,revokeObjectURL,concurrency=3}){
  const urls=new Map(),controller=new AbortController();
  let warming=null,disposed=false;
  return {
    get(index){return urls.get(index)??urlFor(index);},
    warmAll(firstIndex=0){
      if(warming)return warming;
      const order=[firstIndex,...Array.from({length:count},(_,i)=>i).filter(i=>i!==firstIndex)];
      let cursor=0;
      const worker=async()=>{
        while(!disposed&&cursor<order.length){
          const index=order[cursor++];
          try{
            const response=await fetchAudio(urlFor(index),{cache:'force-cache',signal:controller.signal});
            if(!response.ok)continue;
            const blob=await response.blob();
            if(disposed||!blob.size)continue;
            urls.set(index,createObjectURL(blob));
          }catch{/* Streaming from the original URL remains available. */}
        }
      };
      warming=Promise.all(Array.from({length:Math.min(concurrency,count)},worker));
      return warming;
    },
    dispose(){disposed=true;controller.abort();urls.forEach(url=>revokeObjectURL(url));urls.clear();}
  };
}
