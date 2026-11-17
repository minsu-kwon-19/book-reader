import {validate} from '../model.js';
import {validateProfiles} from '../profiles.js';
import {authorized,sameOrigin} from './auth.js';

const key='book-reader:shared:v1';
const script=`local current=redis.call('GET',KEYS[1]); local revision=0; if current then revision=cjson.decode(current).revision end; if revision~=tonumber(ARGV[1]) then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); return 1`;

async function redis(command){
  const url=process.env.KV_REST_API_URL;
  const token=process.env.KV_REST_API_TOKEN;
  if(!url||!token)throw Error('Storage is not configured');
  const response=await fetch(url,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(command)});
  if(!response.ok)throw Error('Storage request failed');
  const result=await response.json();
  if(result.error)throw Error('Storage request failed');
  return result.result;
}
function validPayload(value){
  if(!value||typeof value!=='object'||!value.libraries||typeof value.libraries!=='object')throw Error('Invalid payload');
  try{
    validateProfiles(value.profiles);
    for(const id of ['reader-1','reader-2'])validate(value.libraries[id]);
  }catch{throw Error('Invalid payload')}
  return {profiles:value.profiles,libraries:{'reader-1':value.libraries['reader-1'],'reader-2':value.libraries['reader-2']}};
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(!authorized(req))return res.status(401).json({error:'Unauthorized'});
  if(req.method==='PUT'&&!sameOrigin(req))return res.status(403).json({error:'Forbidden'});
  try{
    if(req.method==='GET'){
      const raw=await redis(['GET',key]);
      return res.status(200).json(raw?JSON.parse(raw):{revision:0,payload:null});
    }
    if(req.method==='PUT'){
      const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
      if(!Number.isSafeInteger(body?.revision)||body.revision<0)return res.status(400).json({error:'Invalid revision'});
      const payload=validPayload(body.payload);
      const next={revision:body.revision+1,payload};
      const result=await redis(['EVAL',script,1,key,body.revision,JSON.stringify(next)]);
      return result===1?res.status(200).json(next):res.status(409).json({error:'Server data changed'});
    }
    return res.status(405).json({error:'Method not allowed'});
  }catch(error){
    if(error.message==='Invalid payload'||error instanceof SyntaxError)return res.status(400).json({error:'Invalid payload'});
    if(error.message==='Storage is not configured')return res.status(503).json({error:error.message});
    console.error(error);
    return res.status(500).json({error:'Sync failed'});
  }
}
