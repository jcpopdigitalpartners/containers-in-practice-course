import {createServer} from 'node:http';
import {Pool} from 'pg';
import {fileURLToPath} from 'node:url';
export function createApp(pool){return createServer(async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 const path=new URL(req.url,'http://localhost').pathname;
 try{
  if(path==='/health'&&req.method==='GET')return send(200,{status:'ok',instance:process.env.HOSTNAME||'local',probe:'process-only'});
  if(path==='/ready'&&req.method==='GET'){await pool.query('SELECT 1');return send(200,{ready:true});}
  if(path==='/records'&&req.method==='GET'){const {rows}=await pool.query('SELECT id, value FROM records ORDER BY id');return send(200,{records:rows,instance:process.env.HOSTNAME||'local'});}
  if(path==='/records'&&req.method==='POST'){
   let body='';for await(const chunk of req){body+=chunk;if(body.length>16384)return send(413,{error:'Request body too large'});}
   let data;try{data=JSON.parse(body);}catch{return send(400,{error:'Send a JSON object with a value field'});}
   if(typeof data?.value!=='string'||!data.value.trim()||data.value.length>500)return send(400,{error:'value must be a nonempty string of at most 500 characters'});
   const {rows}=await pool.query('INSERT INTO records(value) VALUES($1) RETURNING id, value',[data.value]);return send(201,rows[0]);
  }
  send(404,{error:'Route not found'});
 }catch(error){console.error('Request failed:',error.message);send(path==='/ready'?503:500,{error:'Datastore operation failed'});}
});}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const pool=new Pool({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||5432),database:process.env.DB_NAME||'course',user:process.env.DB_USER||'course',password:process.env.DB_PASSWORD||'coursepass',connectionTimeoutMillis:3000});
 const server=createApp(pool);server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Practice API listening on port '+(process.env.PORT||3000)));
 // Observe shutdown behavior as-is before changing it in the durability module.
}
