import test from 'node:test';
import assert from 'node:assert/strict';
import {scryptSync} from 'node:crypto';
import login from './api/login.js';
import session from './api/session.js';

test('login sets a private cookie and protects the session',async()=>{
  const old={username:process.env.BOOK_READER_USERNAME,hash:process.env.BOOK_READER_PASSWORD_HASH,key:process.env.BOOK_READER_SYNC_KEY};
  process.env.BOOK_READER_USERNAME='naram';
  process.env.BOOK_READER_PASSWORD_HASH=`test-salt:${scryptSync('test-password','test-salt',32).toString('hex')}`;
  process.env.BOOK_READER_SYNC_KEY='test-session-key';
  process.env.KV_REST_API_URL='https://redis.example.test';
  process.env.KV_REST_API_TOKEN='test-token';
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>({ok:true,json:async()=>({result:1})});
  const res=()=>({code:200,headers:{},setHeader(name,value){this.headers[name]=value},status(code){this.code=code;return this},json(value){this.value=value;return this}});
  try{
    const wrong=res();await login({method:'POST',headers:{host:'example.test'},body:{username:'naram',password:'wrong'}},wrong);
    assert.equal(wrong.code,401);
    const good=res();await login({method:'POST',headers:{host:'example.test'},body:{username:'naram',password:'test-password'}},good);
    assert.equal(good.code,200);
    assert.match(good.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Lax/);
    const check=res();session({method:'GET',headers:{cookie:good.headers['Set-Cookie'].split(';')[0]}},check);
    assert.equal(check.code,200);
  }finally{
    globalThis.fetch=originalFetch;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    for(const [name,value] of Object.entries({BOOK_READER_USERNAME:old.username,BOOK_READER_PASSWORD_HASH:old.hash,BOOK_READER_SYNC_KEY:old.key})){
      if(value===undefined)delete process.env[name];else process.env[name]=value;
    }
  }
});
