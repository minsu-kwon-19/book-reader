import {createHash} from 'node:crypto';
import {validLogin,sessionCookie,sameOrigin} from './auth.js';

async function failedAttempts(req){
  const url=process.env.KV_REST_API_URL,token=process.env.KV_REST_API_TOKEN;
  if(!url||!token)throw Error('Storage is not configured');
  const address=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  const key=`book-reader:login-fail:${createHash('sha256').update(address).digest('hex')}`;
  const command=async args=>{
    const response=await fetch(url,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(args)});
    if(!response.ok)throw Error('Rate limit unavailable');
    const body=await response.json();
    if(body.error)throw Error('Rate limit unavailable');
    return body.result;
  };
  const count=Number(await command(['INCR',key]));
  if(count===1)await command(['EXPIRE',key,900]);
  return count;
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!sameOrigin(req))return res.status(403).json({error:'Forbidden'});
  let body;
  try{body=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{return res.status(400).json({error:'잘못된 요청입니다.'})}
  if(!validLogin(body?.username,body?.password)){
    try{
      if(await failedAttempts(req)>5)return res.status(429).json({error:'로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.'});
    }catch{return res.status(503).json({error:'잠시 후 다시 시도해 주세요.'})}
    return res.status(401).json({error:'아이디 또는 비밀번호가 맞지 않습니다.'});
  }
  res.setHeader('Set-Cookie',sessionCookie());
  return res.status(200).json({ok:true});
}
