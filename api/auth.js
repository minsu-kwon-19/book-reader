import {createHmac,scryptSync,timingSafeEqual} from 'node:crypto';

const cookieName='__Host-book_reader_session';
const lifetime=30*24*60*60;
const equal=(left,right)=>{
  const a=Buffer.from(left),b=Buffer.from(right);
  return a.length===b.length&&timingSafeEqual(a,b);
};

export function validLogin(username,password){
  const stored=process.env.BOOK_READER_PASSWORD_HASH;
  const expectedUser=process.env.BOOK_READER_USERNAME;
  if(!stored||!expectedUser||typeof username!=='string'||typeof password!=='string')return false;
  const [salt,hash]=stored.split(':');
  if(!salt||!hash)return false;
  const actual=scryptSync(password,salt,32).toString('hex');
  return equal(username,expectedUser)&&equal(actual,hash);
}
function signature(expires){
  const secret=process.env.BOOK_READER_SYNC_KEY;
  if(!secret)return '';
  return createHmac('sha256',secret).update(String(expires)).digest('hex');
}
export function sessionCookie(){
  const expires=Math.floor(Date.now()/1000)+lifetime;
  return `${cookieName}=${expires}.${signature(expires)}; Path=/; Max-Age=${lifetime}; HttpOnly; Secure; SameSite=Lax`;
}
export function clearSessionCookie(){return `${cookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`}
export function authorized(req){
  const raw=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
  if(!raw)return false;
  const [expires,mac]=raw.split('.');
  if(!/^\d+$/.test(expires)||Number(expires)<=Date.now()/1000||!mac)return false;
  return equal(mac,signature(expires));
}
export function sameOrigin(req){
  const origin=req.headers.origin;
  if(!origin)return true;
  try{return new URL(origin).host===req.headers.host&&new URL(origin).protocol==='https:'}catch{return false}
}
